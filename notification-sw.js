self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'/admin';
  event.waitUntil((async()=>{
    const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clientsList){
      if('focus' in client){
        await client.focus();
        if('navigate' in client)await client.navigate(target);
        return;
      }
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
