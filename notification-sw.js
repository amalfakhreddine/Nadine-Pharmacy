importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:'AIzaSyAxdijMU916B4aJ_2OKYxgkoSN-juLmQW8',
  authDomain:'nadine-pharmacy.firebaseapp.com',
  projectId:'nadine-pharmacy',
  storageBucket:'nadine-pharmacy.firebasestorage.app',
  messagingSenderId:'618108519430',
  appId:'1:618108519430:web:0aae00e0a0683712aa2f87'
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage((payload)=>{
  const d=payload.data||{};
  return self.registration.showNotification(d.title||'NEW ORDER — Nadine Parapharm',{
    body:d.body||'A new customer order was received.',
    icon:'/icon-192.png',
    badge:'/badge-96.png',
    tag:d.type==='test'?'nadine-test':'order-'+(d.orderId||Date.now()),
    renotify:true,
    requireInteraction:true,
    vibrate:[300,150,300,150,500],
    data:{url:d.url||'/admin'}
  });
});

self.addEventListener('notificationclick',(event)=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'/admin';
  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      if('focus' in client){
        await client.focus();
        if('navigate' in client)await client.navigate(target);
        return;
      }
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
