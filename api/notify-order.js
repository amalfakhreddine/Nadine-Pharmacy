const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://umaotmgjvzkvsvnsavdu.supabase.co';

function serverClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing.');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function money(v){ return '$'+Number(v||0).toFixed(2); }
function safe(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

async function verifyRequest(req, sb) {
  const header=req.headers.authorization||'';
  if(!header.startsWith('Bearer ')) throw new Error('Missing sign-in token.');
  const {data,error}=await sb.auth.getUser(header.slice(7));
  if(error||!data?.user) throw error||new Error('Invalid sign-in token.');
  return data.user;
}
async function sendEmail(order){
  const user=process.env.GMAIL_USER;
  const pass=(process.env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');
  const to=process.env.ORDER_EMAIL_TO||'nadinepharmacy6@gmail.com';
  if(!user||!pass) throw new Error('Gmail environment variables are missing.');
  const transporter=nodemailer.createTransport({service:'gmail',auth:{user,pass}});
  const items=(order.items||[]).map(i=>`<tr><td style="padding:7px;border-bottom:1px solid #eee">${safe(i.qty)} × ${safe(i.name)}</td><td style="padding:7px;border-bottom:1px solid #eee;text-align:right">${money(Number(i.qty||0)*Number(i.price||0))}</td></tr>`).join('');
  const address=order.fulfillment==='pickup'?'Pickup from Nadine Parapharm':[order.area,order.street,order.building&&`Building ${order.building}`,order.floor&&`Floor ${order.floor}`,order.apartment&&`Apartment ${order.apartment}`].filter(Boolean).join(', ');
  await transporter.sendMail({
    from:`Nadine Parapharm Orders <${user}>`,to,
    subject:`NEW ORDER ${order.id} — ${order.customer||'Customer'} — ${money(order.total)}`,
    text:`New order ${order.id}\nCustomer: ${order.customer}\nPhone: ${order.phone}\nTotal: ${money(order.total)}`,
    html:`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>New Nadine Parapharm order</h2><p>Order <b>${safe(order.id)}</b></p><p><b>Customer:</b> ${safe(order.customer)}<br><b>Phone:</b> ${safe(order.phone)}<br><b>Email:</b> ${safe(order.customerEmail)}<br><b>Method:</b> ${safe(order.fulfillment)}<br><b>Address:</b> ${safe(address||'—')}</p><table style="width:100%;border-collapse:collapse">${items}<tr><td><b>Total</b></td><td style="text-align:right"><b>${money(order.total)}</b></td></tr></table></div>`
  });
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'POST required.'});
  try{
    const sb=serverClient();
    const user=await verifyRequest(req,sb);
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    if(body.action==='test')return res.status(200).json({ok:true,message:'Supabase authentication is working.'});
    const orderId=String(body.orderId||'');
    if(!orderId)return res.status(400).json({error:'Order ID is required.'});
    const {data:row,error}=await sb.from('app_documents').select('doc_id,data').eq('collection_name','orders').eq('doc_id',orderId).maybeSingle();
    if(error)throw error;
    if(!row)return res.status(404).json({error:'Order not found.'});
    const order={id:row.doc_id,...(row.data||{})};
    if(order.customerUid!==user.id)return res.status(403).json({error:'This order does not belong to the signed-in customer.'});
    if(order.externalNotificationSent===true)return res.status(200).json({alreadySent:true});
    await sendEmail(order);
    const next={...(row.data||{}),externalNotificationSent:true,emailNotificationSent:true,notificationAttemptedAt:new Date().toISOString(),notificationError:''};
    const {error:updateError}=await sb.from('app_documents').upsert({collection_name:'orders',doc_id:orderId,data:next,updated_at:new Date().toISOString()},{onConflict:'collection_name,doc_id'});
    if(updateError)throw updateError;
    return res.status(200).json({emailSent:true});
  }catch(error){
    console.error(error);
    return res.status(500).json({error:error.message||'Notification failed.'});
  }
};
