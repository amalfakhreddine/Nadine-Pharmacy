const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error('Firebase server environment variables are missing.');
  }
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
}

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function safe(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function verifyRequest(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new Error('Missing sign-in token.');
  return admin.auth().verifyIdToken(header.slice(7));
}

async function sendEmail(order) {
  const user = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  const to = process.env.ORDER_EMAIL_TO || 'nadinepharmacy6@gmail.com';
  if (!user || !pass) throw new Error('Gmail environment variables are missing.');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  const items = (order.items || []).map(i =>
    `<tr><td style="padding:7px;border-bottom:1px solid #eee">${safe(i.qty)} × ${safe(i.name)}</td><td style="padding:7px;border-bottom:1px solid #eee;text-align:right">${money(Number(i.qty || 0) * Number(i.price || 0))}</td></tr>`
  ).join('');
  const address = order.fulfillment === 'pickup'
    ? 'Pickup from Nadine Parapharm'
    : [order.area, order.street, order.building && `Building ${order.building}`, order.floor && `Floor ${order.floor}`, order.apartment && `Apartment ${order.apartment}`].filter(Boolean).join(', ');

  await transporter.sendMail({
    from: `Nadine Parapharm Orders <${user}>`,
    to,
    subject: `NEW ORDER ${order.id} — ${order.customer || 'Customer'} — ${money(order.total)}`,
    text: `New order ${order.id}\nCustomer: ${order.customer}\nPhone: ${order.phone}\nTotal: ${money(order.total)}\nOpen the admin website for full details.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2 style="margin-bottom:4px">New Nadine Parapharm order</h2><p style="margin-top:0;color:#666">Order <b>${safe(order.id)}</b></p><table style="width:100%;border-collapse:collapse"><tr><td><b>Customer</b></td><td>${safe(order.customer)}</td></tr><tr><td><b>Phone</b></td><td>${safe(order.phone)}</td></tr><tr><td><b>Email</b></td><td>${safe(order.customerEmail)}</td></tr><tr><td><b>Method</b></td><td>${safe(order.fulfillment)}</td></tr><tr><td><b>Address</b></td><td>${safe(address || '—')}</td></tr><tr><td><b>Payment</b></td><td>${safe(order.payment)}</td></tr></table><h3>Items</h3><table style="width:100%;border-collapse:collapse">${items}<tr><td style="padding:9px"><b>Total</b></td><td style="padding:9px;text-align:right"><b>${money(order.total)}</b></td></tr></table><p><a href="${safe(process.env.ADMIN_URL || 'https://nadine-pharmacy.vercel.app/admin.html')}" style="display:inline-block;padding:11px 18px;background:#176b45;color:white;text-decoration:none;border-radius:8px">Open pharmacy admin</a></p></div>`
  });
}

async function sendPush(db, order, onlyUid) {
  let query = db.collection('adminPushTokens').where('active', '==', true);
  if (onlyUid) query = query.where('uid', '==', onlyUid);
  const snap = await query.get();
  const docs = snap.docs.filter(d => d.data().token);
  if (!docs.length) return { registered: 0, sent: 0 };
  const tokens = docs.map(d => d.data().token);
  const itemCount = (order.items || []).reduce((sum, i) => sum + Number(i.qty || 0), 0);
  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: order.test ? 'Nadine Parapharm test notification' : 'NEW ORDER — Nadine Parapharm',
      body: order.test ? 'Background push notifications are working.' : `${order.customer || 'Customer'} · ${itemCount} item${itemCount === 1 ? '' : 's'} · ${money(order.total)}`
    },
    webpush: {
      fcmOptions: { link: process.env.ADMIN_URL || 'https://nadine-pharmacy.vercel.app/admin.html' },
      notification: { icon: '/icon-192.png', badge: '/badge-96.png', requireInteraction: true, tag: order.test ? 'nadine-test' : `order-${order.id}` }
    },
    data: { orderId: String(order.id || ''), url: '/admin.html' }
  });
  const batch = db.batch();
  response.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(code)) {
      batch.set(docs[i].ref, { active: false, invalidatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
  });
  await batch.commit();
  return { registered: tokens.length, sent: response.successCount };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required.' });
  try {
    getAdminApp();
    const decoded = await verifyRequest(req);
    const db = admin.firestore();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    if (body.action === 'test') {
      const ownedTokens = await db.collection('adminPushTokens').where('uid', '==', decoded.uid).where('active', '==', true).limit(1).get();
      if (ownedTokens.empty) return res.status(403).json({ error: 'Enable background alerts first.' });
      const result = await sendPush(db, { id: 'TEST', items: [], total: 0, test: true }, decoded.uid);
      return res.status(200).json(result);
    }

    const orderId = String(body.orderId || '');
    if (!orderId) return res.status(400).json({ error: 'Order ID is required.' });
    const ref = db.collection('orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Order not found.' });
    const order = snap.data();
    if (order.customerUid !== decoded.uid) return res.status(403).json({ error: 'This order does not belong to the signed-in customer.' });
    if (order.externalNotificationSent === true) return res.status(200).json({ alreadySent: true });

    const results = await Promise.allSettled([sendEmail(order), sendPush(db, order)]);
    const emailOk = results[0].status === 'fulfilled';
    const pushResult = results[1].status === 'fulfilled' ? results[1].value : { registered: 0, sent: 0 };
    await ref.set({
      externalNotificationSent: emailOk || pushResult.sent > 0,
      emailNotificationSent: emailOk,
      pushNotificationSentCount: pushResult.sent,
      notificationAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
      notificationError: results.filter(r => r.status === 'rejected').map(r => r.reason && r.reason.message).join(' | ')
    }, { merge: true });
    if (!emailOk && pushResult.sent === 0) throw new Error('Email and push delivery both failed.');
    return res.status(200).json({ emailSent: emailOk, pushSent: pushResult.sent, registeredDevices: pushResult.registered });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Notification failed.' });
  }
};
