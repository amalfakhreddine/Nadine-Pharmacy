
function stableProductImageUrl(url){
  if(!url) return '';
  const s=String(url);
  if(s.startsWith('data:') || s.startsWith('blob:') || s.includes('images.weserv.nl')) return s;
  if(/https?:\/\/tse\d*\.mm\.bing\.net\/th/i.test(s)){
    return 'https://images.weserv.nl/?url='+encodeURIComponent(s)+'&w=700&h=700&fit=contain&output=webp';
  }
  return s;
}
function productImgError(img){
  if(!img) return;
  const original=img.dataset.originalSrc||'';
  if(!img.dataset.triedOriginal && original && img.src!==original){
    img.dataset.triedOriginal='1';
    img.src=original;
    return;
  }
  img.onerror=null;
  img.removeAttribute('src');
  img.style.display='none';
  const parent=img.parentElement;
  if(parent && !parent.querySelector('.image-fallback')){
    const d=document.createElement('div');
    d.className='image-fallback';
    d.textContent='🧴';
    d.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:30px';
    parent.appendChild(d);
  }
}



const supabaseReady=!!window.nadineSupabase;
let auth=null,db=null;
if(supabaseReady){auth=window.nadineAuth;db=window.nadineDb;}
function requireSupabase(){if(!supabaseReady){alert('Supabase is not configured.');return false}return true}

const defaults=[{id:1,name:'Panadol Extra',cat:'Medicines',price:4.5,stock:18,meta:'500mg · 24 tablets',expiry:'2027-06-30',images:[]},{id:2,name:'CeraVe Moisturising Cream',cat:'Skincare',price:15.9,stock:9,meta:'340g',expiry:'2028-04-30',images:[]},{id:3,name:'Vitamin D3',cat:'Vitamins',price:8.9,stock:8,meta:'1000 IU · 60 softgels',expiry:'2027-11-30',images:[]},{id:4,name:'Omega-3 Fish Oil',cat:'Supplements',price:12.5,stock:14,meta:'1000mg · 60 softgels',expiry:'2027-09-30',images:[]},{id:5,name:'Magnesium Citrate',cat:'Supplements',price:10.9,stock:10,meta:'200mg · 60 tablets',expiry:'2027-08-31',images:[]},{id:6,name:'Collagen Peptides',cat:'Supplements',price:22,stock:7,meta:'300g powder',expiry:'2027-05-31',images:[]},{id:7,name:'Bepanthen Ointment',cat:'Baby Care',price:6.2,stock:12,meta:'100g',expiry:'2028-02-28',images:[]},{id:8,name:'Digital Thermometer',cat:'Medical Devices',price:7,stock:11,meta:'Fast reading',expiry:'',images:[]}];
const defaultCategories=['Skincare','Baby Care','Cosmetics','Hair Care','Personal Care','Oral Care','Vitamins & Supplements','Wellness','Hygiene','Accessories'];function safeRead(key,fallback,allowEmpty=false){try{const raw=localStorage.getItem(key);if(!raw)return structuredClone(fallback);const parsed=JSON.parse(raw);if(!Array.isArray(parsed))return structuredClone(fallback);if(!allowEmpty&&parsed.length===0)return structuredClone(fallback);return parsed}catch(e){return structuredClone(fallback)}}let products=(window.NADINE_PRELOADED_PRODUCTS||[]).map(p=>({...p}));
window.VERIFIED_EXACT_PRODUCT_IMAGES={"A DERMA BIOLOGY HYDRATING RICHE CREAM": "https://media-pierre-fabre.wedia-group.com/api/wedia/dam/transform/u5wa3z31qn5secygymb7nfgmxykqcmm9o3j3m8y/pf_square/u5wa3z31qn5secygymb7nfgmxykqcmm9o3j3m8y?height=800&t=resize&width=800", "A-DERMA BIOLOGY AC GEL 200ML": "https://www.cf.com.lb/cdn/shop/files/04430-01_1.png?v=1765290280&width=1200", "A DERMA EPITHELIAL A.H ULTRA OFFER": "https://media-pierre-fabre.wedia-group.com/api/wedia/dam/transform/u5wa3z31qn5se9qixyx1d1myjmz43diywws4kqe/pf_square/u5wa3z31qn5se9qixyx1d1myjmz43diywws4kqe?height=800&t=resize&width=800"};let selectedCat='All',showRxOnly=false,cart=[],customerProfile={},activeCartKey='nadineCart_guest',activeWishlistKey='nadineWishlist_guest',wishlist=[],unsubscribeProducts=null,unsubscribeCatalog=null,unsubscribeShopSettings=null;let recent=safeRead('nadineRecent',[],true);const $=id=>document.getElementById(id);const money=n=>'$'+Number(n).toFixed(2);
function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}const isUnlimitedStock=p=>!!p&&(p.stockUnlimited===true||p.stock===null||p.stock===undefined||p.stock==='');const isInStock=p=>!!p&&(isUnlimitedStock(p)||Number(p.stock)>0);
function cartKeyForUser(user){return user?.uid?'nadineCart_user_'+user.uid:'nadineCart_guest'}
function loadCartForUser(user){activeCartKey=cartKeyForUser(user);cart=safeRead(activeCartKey,[],true);updateCartCount();if($('cartOverlay')?.classList.contains('show'))renderCart()}
function saveCart(){localStorage.setItem(activeCartKey,JSON.stringify(cart));updateCartCount()}
function updateCartCount(){$('cartCount').textContent=cart.reduce((s,x)=>s+Number(x.qty||0),0)}
function wishlistKeyForUser(user){return user?.uid?'nadineWishlist_user_'+user.uid:'nadineWishlist_guest'}
async function loadWishlistForUser(user){activeWishlistKey=wishlistKeyForUser(user);wishlist=safeRead(activeWishlistKey,[],true).map(String);if(user&&supabaseReady){try{const snap=await db.collection('wishlists').doc(user.uid).get();if(snap.exists&&Array.isArray(snap.data().items)){wishlist=[...new Set(snap.data().items.map(String))];localStorage.setItem(activeWishlistKey,JSON.stringify(wishlist));}}catch(err){console.warn('Wishlist cloud sync unavailable',err)}}updateWishlistCount();renderProducts();if($('wishlistOverlay')?.classList.contains('show'))renderWishlist()}
async function saveWishlist(){localStorage.setItem(activeWishlistKey,JSON.stringify(wishlist));updateWishlistCount();const user=auth?.currentUser;if(user&&supabaseReady){try{await db.collection('wishlists').doc(user.uid).set({items:wishlist,updatedAt:sbFieldValue.serverTimestamp()},{merge:true})}catch(err){console.warn('Wishlist cloud sync failed',err)}}}
function updateWishlistCount(){$('wishlistCount').textContent=wishlist.length}

// Browser Back/Forward support for customer screens.
const NADINE_NAV_IDS=['cartOverlay','wishlistOverlay','checkoutModal','ordersModal','productModal','authModal','profileModal','policyModal'];
let nadineApplyingHistory=false;
function nadineState(view,data={}){return {nadineApp:true,view:view||'home',data};}
function nadineCurrentView(){return history.state&&history.state.nadineApp?history.state.view:'home';}
function nadineCloseAll(){NADINE_NAV_IDS.forEach(id=>document.getElementById(id)?.classList.remove('show'));setPageLocked(false);closeAccountMenu();}
function nadineUrl(view,data={}){let hash=view&&view!=='home'?'#'+view:'#home';if(view==='product'&&data.id)hash+='/'+encodeURIComponent(data.id);if(view==='policy'&&data.type)hash+='/'+encodeURIComponent(data.type);return location.pathname+location.search+hash;}
function nadinePush(view,data={}){if(nadineApplyingHistory)return false;const same=nadineCurrentView()===view&&JSON.stringify(history.state?.data||{})===JSON.stringify(data||{});if(!same)history.pushState(nadineState(view,data),'',nadineUrl(view,data));return true;}
function nadineClose(view,closeNow){if(!nadineApplyingHistory&&nadineCurrentView()===view){history.back();}else{closeNow();}}
function nadineShowState(state){
  nadineApplyingHistory=true;
  nadineCloseAll();
  const view=state?.view||'home',data=state?.data||{};
  if(view==='cart') openCart(true);
  else if(view==='wishlist') openWishlist(true);
  else if(view==='checkout') openCheckout(true);
  else if(view==='orders') openMyOrders(true);
  else if(view==='product'&&data.id) showProduct(data.id,true);
  else if(view==='auth') openAuth(true);
  else if(view==='profile') openProfile(true);
  else if(view==='policy'&&data.type) openPolicy(data.type,true);
  setTimeout(()=>{nadineApplyingHistory=false;},0);
}
if(!(history.state&&history.state.nadineApp)) history.replaceState(nadineState('home'),'',nadineUrl('home'));
window.addEventListener('popstate',e=>nadineShowState(e.state&&e.state.nadineApp?e.state:nadineState('home')));
function openWishlist(fromHistory=false){if(!fromHistory)nadinePush('wishlist');$('wishlistOverlay').classList.add('show');setPageLocked(true);renderWishlist()}function closeWishlist(){nadineClose('wishlist',()=>{$('wishlistOverlay').classList.remove('show');setPageLocked(false)})}
function renderWishlist(){const arr=wishlist.map(id=>products.find(p=>String(p.id)===String(id))).filter(Boolean);$('wishlistItems').innerHTML=arr.length?arr.map(p=>{const safeId=JSON.stringify(String(p.id)),available=isInStock(p);return `<div class="wishlistitem">${p.images?.[0]?`<img src="${stableProductImageUrl(p.images[0])}" data-original-src="${p.images[0]}" referrerpolicy="no-referrer" onerror="productImgError(this)" alt="${p.name}">`:'<div class="thumb" style="width:70px;height:70px">💊</div>'}<div><b>${p.name}</b><div>${money(p.price)}</div><small>${available?'In stock':'Out of stock'}</small><div class="wishlist-actions"><button class="move-cart" ${available?`onclick='addWishlistToCart(${safeId})'`:'disabled'}>${available?'Add to cart':'Unavailable'}</button><button class="remove-wish" onclick='toggleWishlist(${safeId})'>Remove</button></div></div></div>`}).join(''):'<div class="empty">Your wishlist is empty.<br><small>Tap the heart on any product to save it here.</small></div>'}
function addWishlistToCart(id){addToCart(String(id));closeCart();renderWishlist();openWishlist()}
const MEDICAL_DEVICE_SUBCATEGORIES=['Blood Pressure Monitors','Blood Glucose Meters','Glucose Test Strips','Thermometers','Pulse Oximeters','Nebulizers','Scales','First Aid & Wound Care','Supports & Braces','Medical Accessories','Other Medical Devices'];let hiddenMedicalDeviceSubcategories=[];let categorySubcategories={};let selectedDeviceSubcategory='All';function detectMedicalDeviceSubcategory(name){const t=String(name||'').toLowerCase();if(/blood pressure|bp monitor|tensiometer|tension meter|sphygmo/.test(t))return 'Blood Pressure Monitors';if(/accu.?chek|glucometer|glucose meter|blood glucose meter|glucose machine/.test(t)&&!/strip/.test(t))return 'Blood Glucose Meters';if(/glucose.*strip|test strip|accu.?chek.*strip/.test(t))return 'Glucose Test Strips';if(/thermometer|temperature gun|digital temp/.test(t))return 'Thermometers';if(/oximeter|spo2|pulse ox/.test(t))return 'Pulse Oximeters';if(/nebulizer|nebuliser/.test(t))return 'Nebulizers';if(/weighing scale|bathroom scale|body scale|digital scale/.test(t))return 'Scales';if(/bandage|gauze|plaster|wound|dressing|first aid/.test(t))return 'First Aid & Wound Care';if(/brace|support|knee support|ankle support|wrist support|cervical collar/.test(t))return 'Supports & Braces';if(/syringe|needle|tongue depressor|gloves|mask|medical accessory/.test(t))return 'Medical Accessories';return 'Other Medical Devices';}function deviceSubcatFor(p){return p.subcategory||p.medicalDeviceSubcategory||detectMedicalDeviceSubcategory(p.name)}function productSubcatFor(p){return p?.subcategory||(p?.cat==='Medical Devices'?deviceSubcatFor(p):'')}function renderDeviceSubcategories(){const host=$('deviceSubcategories');if(!host)return;if(selectedCat==='All'){host.classList.remove('show');host.innerHTML='';selectedDeviceSubcategory='All';return}let configured=Array.isArray(categorySubcategories?.[selectedCat])?categorySubcategories[selectedCat]:[];if(selectedCat==='Medical Devices')configured=[...new Set([...MEDICAL_DEVICE_SUBCATEGORIES,...configured])].filter(sc=>!hiddenMedicalDeviceSubcategories.includes(sc));const used=configured.filter(sc=>products.some(p=>p.cat===selectedCat&&productSubcatFor(p)===sc));if(selectedDeviceSubcategory!=='All'&&!used.includes(selectedDeviceSubcategory))selectedDeviceSubcategory='All';if(!used.length){host.classList.remove('show');host.innerHTML='';return}host.classList.add('show');host.innerHTML=['All',...used].map(sc=>`<button class="device-subcat ${sc===selectedDeviceSubcategory?'active':''}" onclick="selectedDeviceSubcategory='${sc.replaceAll("'","\'")}';customerProductPage=1;renderDeviceSubcategories();renderProducts()">${sc}</button>`).join('')}function renderCats(){const usedCategories=categories.filter(c=>products.some(p=>String(p.cat||'')===String(c)));if(selectedCat!=='All'&&!usedCategories.includes(selectedCat))selectedCat='All';const standard=['All',...usedCategories].map(c=>`<button class="cat ${c===selectedCat?'active':''}" onclick="selectedCat='${c.replaceAll("'","\'")}';selectedDeviceSubcategory='All';customerProductPage=1;renderCats();renderProducts()">${c}</button>`).join('');$('categories').innerHTML=standard;renderDeviceSubcategories()}
const CUSTOMER_PAGE_SIZE=12;
let customerProductPage=1;

function normalizeShopText(value){
  return String(value||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim();
}
function productSearchText(p){
  return normalizeShopText(`${p.name||''} ${p.cat||''} ${p.meta||''} ${p.description||''} ${p.activeIngredient||''} ${p.genericName||''} ${p.barcode||''} ${p.strength||''} ${p.uses||''}`);
}
function searchScore(p,q){
  const query=normalizeShopText(q);
  if(!query)return 0;
  const name=normalizeShopText(p.name);
  const ingredient=normalizeShopText(p.genericName||p.activeIngredient);
  const meta=normalizeShopText(p.meta);
  const category=normalizeShopText(p.cat);
  const description=normalizeShopText(p.description);
  const barcode=normalizeShopText(p.barcode);

  let score=0;
  if(name===query)score+=1000;
  else if(name.startsWith(query))score+=700;
  else if(name.includes(query))score+=450;

  if(ingredient===query)score+=650;
  else if(ingredient.startsWith(query))score+=500;
  else if(ingredient.includes(query))score+=350;

  if(category===query)score+=260;
  else if(category.includes(query))score+=150;
  if(meta.includes(query))score+=180;
  if(description.includes(query))score+=80;
  if(barcode===query)score+=900;

  const words=query.split(/\s+/).filter(Boolean);
  const hay=[name,ingredient,meta,category,description].join(' ');
  const matched=words.filter(w=>hay.includes(w)).length;
  score+=matched*90;
  if(words.length&&matched===words.length)score+=180;

  // Light typo tolerance for product-name prefixes.
  if(!score&&query.length>=3){
    const first=query.slice(0,Math.max(3,query.length-1));
    if(name.startsWith(first))score+=120;
  }
  return score;
}
function customerProductCard(p){
  const available=isInStock(p);
  return `<article class="card">
    <div class="photo" onclick="showProduct('${p.id}')" style="cursor:pointer">
      <span class="badge">${available?'IN STOCK':'SOLD OUT'}</span>
      ${Array.isArray(p.images)&&p.images[0]?`<img src="${stableProductImageUrl(p.images[0])}" data-original-src="${p.images[0]}" referrerpolicy="no-referrer" onerror="productImgError(this)" alt="${escapeHtml(p.name)}">`:`<div class="fakepack"><span>Photo loading…</span></div>`}
      <button class="heart ${wishlist.includes(String(p.id))?'saved':''}" aria-label="Save product" onclick="event.stopPropagation();toggleWishlist('${p.id}')">${wishlist.includes(String(p.id))?'♥':'♡'}</button>
    </div>
    <div class="info">
      <small>${escapeHtml(p.cat||'para')}</small>
      <h3 class="product-link" onclick="showProduct('${p.id}')">${escapeHtml(p.name)}</h3>
      <div class="meta">${escapeHtml(p.meta||p.genericName||p.activeIngredient||'')}</div>
      <div class="product-flags">${p.bestSeller?'<span class="flag">BEST SELLER</span>':''}${p.newArrival?'<span class="flag">NEW</span>':''}${p.recommended?'<span class="flag">RECOMMENDED</span>':''}${!isUnlimitedStock(p)&&Number(p.stock)>0&&Number(p.stock)<=5?'<span class="flag">LOW STOCK</span>':''}</div>
      <div class="row"><span class="price">${money(p.price)}</span><button class="add" ${available?`onclick="addToCart('${p.id}')"`:'disabled'}>${available?'Add to cart':'Sold out'}</button></div>
    </div>
  </article>`;
}
function renderCustomerPagination(totalPages){
  const host=$('customerPagination');if(!host)return;
  if(totalPages<=1){host.innerHTML='';return}
  customerProductPage=Math.max(1,Math.min(customerProductPage,totalPages));
  const buttons=[];
  buttons.push(`<button ${customerProductPage===1?'disabled':''} onclick="goCustomerPage(${customerProductPage-1})">‹</button>`);
  const wanted=new Set([1,totalPages,customerProductPage-2,customerProductPage-1,customerProductPage,customerProductPage+1,customerProductPage+2].filter(n=>n>=1&&n<=totalPages));
  let last=0;
  [...wanted].sort((a,b)=>a-b).forEach(n=>{
    if(last&&n-last>1)buttons.push('<span style="padding:9px 2px;color:var(--muted)">…</span>');
    buttons.push(`<button class="${n===customerProductPage?'active':''}" onclick="goCustomerPage(${n})">${n}</button>`);
    last=n;
  });
  buttons.push(`<button ${customerProductPage===totalPages?'disabled':''} onclick="goCustomerPage(${customerProductPage+1})">›</button>`);
  host.innerHTML=buttons.join('');
}
function goCustomerPage(page){
  customerProductPage=page;
  renderProducts();
  document.getElementById('shop')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderProducts(){
  const rawQ=$('search').value.trim();
  let arr=products.filter(p=>selectedCat==='All'||p.cat===selectedCat);if(selectedCat!=='All'&&selectedDeviceSubcategory!=='All')arr=arr.filter(p=>productSubcatFor(p)===selectedDeviceSubcategory);

  if(rawQ){
    arr=arr.map(p=>({p,score:searchScore(p,rawQ)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||String(a.p.name||'').localeCompare(String(b.p.name||'')))
      .map(x=>x.p);
  }

  const sort=$('sort').value;
  if(sort==='low')arr.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
  if(sort==='high')arr.sort((a,b)=>Number(b.price||0)-Number(a.price||0));

  const totalPages=Math.max(1,Math.ceil(arr.length/CUSTOMER_PAGE_SIZE));
  if(customerProductPage>totalPages)customerProductPage=totalPages;
  const start=(customerProductPage-1)*CUSTOMER_PAGE_SIZE;
  const visible=arr.slice(start,start+CUSTOMER_PAGE_SIZE);

  const head=document.querySelector('#shop .section-head h2');
  const sub=document.querySelector('#shop .section-head div div');
  if(head)head.textContent=rawQ?`Search results for “${rawQ}”`:'Shop products';
  if(sub)sub.textContent=rawQ?'Best matches are shown first, including product names, ingredients/composition and categories.':`Browse by category or sort by price. ${products.length.toLocaleString()} products available.`;

  $('products').innerHTML=visible.length?visible.map(customerProductCard).join(''):'<div class="empty">No matching products. Try a shorter name, ingredient/composition, or category.</div>';
  if($('customerResultsNote'))$('customerResultsNote').textContent=arr.length?`Showing ${start+1}–${Math.min(start+visible.length,arr.length)} of ${arr.length} products`:'';
  renderCustomerPagination(arr.length?totalPages:0);
}
async function toggleWishlist(id){id=String(id);wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];await saveWishlist();renderProducts();if($('wishlistOverlay')?.classList.contains('show'))renderWishlist()}
function renderRecent(){const arr=recent.map(id=>products.find(p=>String(p.id)===String(id))).filter(Boolean).slice(0,5);$('recentSection').style.display=arr.length?'block':'none';$('recentProducts').innerHTML=arr.map(p=>`<div class="mini-card" onclick="showProduct('${p.id}')">${p.images?.[0]?`<img src="${stableProductImageUrl(p.images[0])}" data-original-src="${p.images[0]}" referrerpolicy="no-referrer" onerror="productImgError(this)" alt="" style="width:100%;height:90px;object-fit:contain">`:'💊'}<b>${p.name}</b><small>${money(p.price)}</small></div>`).join('')}

function showPrescriptionProducts(){showRxOnly=true;selectedCat='All';$('search').value='';renderCats();renderProducts();document.getElementById('shop').scrollIntoView({behavior:'smooth'});}
function showAllProducts(){showRxOnly=false;selectedCat='All';$('search').value='';renderCats();renderProducts();}
function addToCart(id){let p=products.find(x=>String(x.id)===String(id)),x=cart.find(x=>String(x.id)===String(id));if(!p||!isInStock(p))return;if(x&&(isUnlimitedStock(p)||x.qty<Number(p.stock)))x.qty++;else if(!x)cart.push({id:p.id,name:p.name,price:p.price,qty:1,prescriptionRequired:!!p.prescriptionRequired});if(x)x.prescriptionRequired=!!p.prescriptionRequired;saveCart();openCart()}
function setPageLocked(v){document.body.style.overflow=v?'hidden':''}function openCart(fromHistory=false){if(!fromHistory)nadinePush('cart');$('cartOverlay').classList.add('show');setPageLocked(true);renderCart()}function closeCart(){nadineClose('cart',()=>{$('cartOverlay').classList.remove('show');setPageLocked(false)})}
function changeQty(id,d){id=String(id);let x=cart.find(i=>String(i.id)===id),p=products.find(i=>String(i.id)===id);if(!x)return;const next=Math.max(0,Number(x.qty||0)+d);x.qty=isUnlimitedStock(p)?next:Math.min(Math.max(0,Number(p?.stock||0)),next);if(x.qty===0)cart=cart.filter(i=>String(i.id)!==id);saveCart();renderCart()}
function removeFromCart(id){id=String(id);cart=cart.filter(i=>String(i.id)!==id);saveCart();renderCart()}
function clearCart(){if(!cart.length)return;if(confirm('Remove all items from your cart?')){cart=[];saveCart();renderCart()}}
function currentFulfillment(){return document.querySelector('input[name="fulfillment"]:checked')?.value||'delivery'}function deliveryCharge(sub){return currentFulfillment()==='pickup'||sub===0?0:(sub>=Number(shopSettings.freeDeliveryThreshold||999999)?0:Number(shopSettings.deliveryFee||0))}function renderCart(){let sub=cart.reduce((s,x)=>s+Number(x.qty||0)*Number(x.price||0),0),del=deliveryCharge(sub);$('cartItems').innerHTML=cart.length?cart.map(x=>{const safeId=JSON.stringify(String(x.id));return `<div class="cartitem"><div class="thumb">💊</div><div><b>${x.name}</b><div>${money(x.price)}</div><div class="qty"><button type="button" onclick='changeQty(${safeId},-1)'>−</button><span>${x.qty}</span><button type="button" onclick='changeQty(${safeId},1)'>+</button><button type="button" onclick='removeFromCart(${safeId})' style="width:auto;padding:0 9px;color:var(--danger);font-weight:800">Remove</button></div></div><b>${money(Number(x.qty||0)*Number(x.price||0))}</b></div>`}).join('')+`<button type="button" onclick="clearCart()" style="border:0;background:transparent;color:var(--danger);font-weight:800;cursor:pointer;margin-top:12px">Clear cart</button>`:'<div class="empty">Your cart is empty.</div>';$('subtotal').textContent=money(sub);$('delivery').textContent=del?money(del):(currentFulfillment()==='pickup'?'FREE PICKUP':'FREE');$('total').textContent=money(sub+del)}
function cartNeedsPrescription(){return false}function updateFulfillment(){const pickup=currentFulfillment()==='pickup',fields=$('deliveryFields');fields.style.display=pickup?'none':'contents';['cArea','cStreet','cBuilding'].forEach(id=>$(id).required=!pickup);$('cPayment').value=pickup?'Pay at pickup':'Cash on delivery';$('fulfillmentNote').textContent=pickup?'Pickup is free. The parapharmacy will contact you when your order is ready.':'Delivery is available in Tripoli, Qalamoun and Dahr El Ain. Orders outside these areas must use parapharmacy pickup.';renderCart()}function openCheckout(fromHistory=false){
  if(!cart.length)return alert('Your cart is empty.');
  if(!fromHistory)nadinePush('checkout');
  $('cartOverlay').classList.remove('show');
  $('checkoutModal').classList.add('show');
  updateFulfillment();
  setPageLocked(true);
}
function closeModal(id){const map={checkoutModal:'checkout',ordersModal:'orders',productModal:'product',authModal:'auth',profileModal:'profile',policyModal:'policy'};const view=map[id];if(view)nadineClose(view,()=>{$(id).classList.remove('show');setPageLocked(false)});else{$(id).classList.remove('show');setPageLocked(false)}}const PARAPHARMACY_WHATSAPP_NUMBER='96171979118'; // parapharmacy WhatsApp number (digits only)
function buildWhatsAppOrderMessage(order){
  const itemLines=(order.items||[]).map((item,index)=>`${index+1}. ${item.name} × ${item.qty} — ${money(Number(item.price||0)*Number(item.qty||0))}`);
  const address=order.fulfillment==='pickup'
    ? 'Parapharmacy pickup'
    : [order.area,order.street,order.building?`Building ${order.building}`:'',order.floor?`Floor ${order.floor}`:'',order.apartment?`Apartment ${order.apartment}`:'',order.landmark?`Landmark: ${order.landmark}`:''].filter(Boolean).join(', ');
  return [
    'Hello Nadine Parapharm, I just placed a new order through the website.',
    '',
    `Order: ${order.id}`,
    `Customer: ${order.customer}`,
    `Phone: ${order.phone}`,
    `Type: ${order.fulfillment==='pickup'?'Parapharmacy pickup':'Home delivery'}`,
    `Address: ${address}`,
    `Payment: ${order.payment}`,
    '',
    'Items:',
    ...itemLines,
    '',
    `Subtotal: ${money(order.subtotal)}`,
    `Delivery: ${order.delivery?money(order.delivery):'FREE'}`,
    `Total: ${money(order.total)}`,
    order.deliveryNotes?`Notes: ${order.deliveryNotes}`:'',
  ].filter(Boolean).join('\n');
}
async function placeOrder(){
  if(!requireSupabase())return;
  const user=auth.currentUser;
  if(!user){closeModal('checkoutModal');openAuth();return alert('Please sign in before placing an order.');}
  const name=$('cName').value.trim(),phone=$('cPhone').value.trim(),needsRx=false,fulfillment=currentFulfillment();
  if(!name||!phone)return alert('Please add your name and phone number.');
  if(fulfillment==='delivery'&&['cArea','cStreet','cBuilding'].some(id=>!$(id).value.trim()))return alert('Please complete the delivery area, street and building fields.');
  const prescriptionImage='';
  const submitBtn=$('checkoutForm').querySelector('button[type="submit"]');
  submitBtn.disabled=true;submitBtn.textContent='Placing order...';
  try{
    // Build the order from the current public product data. The customer performs
    // one protected Supabase write only, so optional stock/email actions cannot
    // cancel the order with a permissions error.
    const verifiedItems=[];let subtotal=0;
    for(const requested of structuredClone(cart)){
      const product=products.find(p=>String(p.id)===String(requested.id));
      if(!product||product.active===false)throw new Error(requested.name+' is no longer available.');
      const qty=Math.max(1,Math.floor(Number(requested.qty)||0));
      if(!isUnlimitedStock(product)&&Number(product.stock||0)<qty)throw new Error('Not enough stock for '+product.name+'.');
      const price=Number(product.price||0);
      if(!Number.isFinite(price)||price<0)throw new Error('Invalid price for '+product.name+'.');
      verifiedItems.push({id:String(product.id),name:String(product.name||requested.name),price,qty,prescriptionRequired:false});
      subtotal+=price*qty;
    }
    const delivery=fulfillment==='pickup'?0:(subtotal>=Number(shopSettings.freeDeliveryThreshold||999999)?0:Number(shopSettings.deliveryFee||0));
    const orderId='NP-'+Date.now().toString().slice(-7);
    const order={
      id:orderId,
      createdAt:new Date().toISOString(),
      createdAtServer:sbFieldValue.serverTimestamp(),
      customerUid:user.uid,
      customerEmail:user.email||'',
      customer:name,
      phone,
      fulfillment,
      city:fulfillment==='delivery'?'Tripoli':'',
      area:fulfillment==='delivery'?$('cArea').value.trim():'',
      street:$('cStreet').value.trim(),building:$('cBuilding').value.trim(),floor:$('cFloor').value.trim(),apartment:$('cApartment').value.trim(),landmark:$('cLandmark').value.trim(),deliveryNotes:$('cNotes').value.trim(),
      payment:$('cPayment').value,
      items:verifiedItems,
      requiresPrescription:false,
      prescriptionImage:prescriptionImage||'',
      prescriptionStatus:'Not required',
      subtotal,delivery,total:subtotal+delivery,
      status:fulfillment==='pickup'?'New pickup':'New',
      unread:true,
      stockAdjusted:false
    };
    await db.collection('orders').doc(orderId).set(order);
    const whatsappUrl=`https://wa.me/${PARAPHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppOrderMessage(order))}`;
    cart=[];saveCart();$('checkoutForm').reset();closeModal('checkoutModal');
    // Redirect the customer directly to WhatsApp with the order message prepared.
    // They only need to press Send inside WhatsApp.
    window.location.assign(whatsappUrl);
  }catch(err){
    alert('Order could not be sent: '+err.message)
  }finally{submitBtn.disabled=false;submitBtn.textContent='Place order'}
}
async function openMyOrders(fromHistory=false){if(!fromHistory)nadinePush('orders');
  if(!requireSupabase())return;
  const user=auth.currentUser;if(!user){openAuth();return alert('Please sign in to view your orders.');}
  $('myOrders').innerHTML='<div class="empty">Loading orders…</div>';$('ordersModal').classList.add('show');setPageLocked(true);
  try{const snap=await db.collection('orders').where('customerUid','==',user.uid).get();let orders=snap.docs.map(d=>d.data()).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));$('myOrders').innerHTML=orders.length?orders.map(orderCard).join(''):'<div class="empty">No orders yet.</div>'}catch(err){$('myOrders').innerHTML='<div class="empty">Could not load orders: '+err.message+'</div>'}
}
function orderCard(o){let levels=o.fulfillment==='pickup'?['New pickup','Preparing','Ready for pickup','Collected']:['New','Preparing','Out for delivery','Delivered'],idx=Math.max(0,levels.indexOf(o.status));return `<article class="order-card"><div class="order-head"><div><b>#${o.id}</b><div style="color:var(--muted);font-size:12px">${new Date(o.createdAt).toLocaleString()}</div></div><span class="status">${o.status}</span></div><div style="margin-top:10px">${o.items.map(i=>`${i.qty} × ${i.name}`).join('<br>')}</div><div style="margin-top:10px"><b>Total: ${money(o.total)}</b></div><div class="progress">${levels.map((_,i)=>`<div class="step ${i<=idx?'on':''}"></div>`).join('')}</div></article>`}
let currentReviewProductId=null;
function showProduct(id){
  const p=products.find(x=>String(x.id)===String(id));
  if(p){
    recent=[String(id),...recent.filter(x=>String(x)!==String(id))].slice(0,8);
    try{localStorage.setItem('nadineRecent',JSON.stringify(recent))}catch(e){}
  }
  window.location.href='product.html?id='+encodeURIComponent(String(id));
}
function renderSearchSuggestions(){
  const box=$('searchSuggestions'),q=$('search').value.trim();
  if(!box)return;
  if(!q){box.classList.remove('show');box.innerHTML='';return}
  const arr=products.map(p=>({p,score:searchScore(p,q)}))
    .filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,8)
    .map(x=>x.p);
  box.innerHTML=arr.map(p=>`<div class="suggestion" onclick="showProduct('${p.id}');$('searchSuggestions').classList.remove('show')">${p.images?.[0]?`<img src="${stableProductImageUrl(p.images[0])}" data-original-src="${p.images[0]}" referrerpolicy="no-referrer" onerror="productImgError(this)" alt="">`:'<span>🧴</span>'}<div><b>${escapeHtml(p.name)}</b><small style="display:block">${escapeHtml([p.genericName||p.activeIngredient,p.cat].filter(Boolean).join(' · '))}</small></div><b style="margin-left:auto">${money(p.price)}</b></div>`).join('')||'<div class="suggestion">No products found</div>';
  box.classList.add('show');
}
let eligibleReviewOrderId=null;
async function loadReviews(productId){if(!supabaseReady)return;try{const s=await db.collection('reviews').where('productId','==',productId).get(),rows=s.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.status==='approved').sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));const avg=rows.length?rows.reduce((x,r)=>x+Number(r.rating||0),0)/rows.length:0;$('reviewSummary').innerHTML=rows.length?`<span class="stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</span> ${avg.toFixed(1)} from ${rows.length} verified review${rows.length===1?'':'s'}`:'No approved reviews yet.';$('reviewList').innerHTML=rows.slice(0,10).map(r=>`<div class="review-item"><span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span><span class="verified-review">✓ Verified purchase</span><b style="display:block;margin-top:5px">${escapeHtml(r.customerName||'Customer')}</b><div>${escapeHtml(r.text||'')}</div><small class="muted">Delivery ${Number(r.deliveryRating||0)}/5 · Packaging ${Number(r.packagingRating||0)}/5 · ${r.recommend?'Recommends':'Does not recommend'}</small>${r.adminReply?`<div class="admin-reply"><b>Nadine Parapharm replied</b><br>${escapeHtml(r.adminReply)}</div>`:''}</div>`).join('')}catch(e){$('reviewSummary').textContent='Reviews could not load.'}}
async function checkReviewEligibility(productId){eligibleReviewOrderId=null;const state=$('reviewEligibility'),form=$('reviewForm'),user=auth?.currentUser;if(!state||!form)return;form.style.display='none';if(!user){state.innerHTML='Please <button class="pill soft" onclick="openAuth()">sign in</button> to leave a review.';return}state.textContent='Checking your purchases…';try{const existing=await db.collection('reviews').where('customerUid','==',user.uid).get();if(existing.docs.some(d=>String(d.data().productId)===String(productId))){state.textContent='You already submitted a review for this product.';return}const snap=await db.collection('orders').where('customerUid','==',user.uid).get();const match=snap.docs.map(d=>({docId:d.id,...d.data()})).find(o=>['Delivered','Collected'].includes(o.status)&&(o.items||[]).some(i=>String(i.id||i.productId)===String(productId)));if(!match){state.textContent='Only customers who received or collected this product can review it.';return}eligibleReviewOrderId=match.docId;state.innerHTML='<b>✓ Verified purchase</b> — your review will be sent to the parapharmacy for approval.';form.style.display='grid'}catch(e){state.textContent='Could not verify your purchase right now.'}}
async function submitReview(productId){const user=auth?.currentUser;if(!user)return openAuth();if(!eligibleReviewOrderId)return alert('A completed purchase is required to review this product.');const rating=Number($('reviewRating').value),deliveryRating=Number($('reviewDelivery').value),packagingRating=Number($('reviewPackaging').value),recommend=$('reviewRecommend').value==='yes',text=$('reviewText').value.trim();if(text.length<3)return alert('Please write a short review.');try{const p=products.find(x=>String(x.id)===String(productId));await db.collection('reviews').add({productId:String(productId),productName:p?.name||'Product',customerUid:user.uid,customerEmail:user.email||'',customerName:user.displayName||customerProfile.fullName||'Customer',orderId:eligibleReviewOrderId,rating,deliveryRating,packagingRating,recommend,text,status:'pending',verifiedPurchase:true,adminReply:'',createdAt:sbFieldValue.serverTimestamp(),updatedAt:sbFieldValue.serverTimestamp()});$('reviewText').value='';$('reviewForm').style.display='none';$('reviewEligibility').textContent='Thank you. Your verified review is pending parapharmacy approval.';alert('Thank you. Your review was submitted for approval.')}catch(e){alert('Could not submit review: '+e.message)}}
let authMode='signin';
function openAuth(fromHistory=false){if(!requireSupabase())return;if(!fromHistory)nadinePush('auth');if(auth.currentUser)return toggleAccountMenu();$('authModal').classList.add('show');setPageLocked(true);setAuthMode('signin');setTimeout(()=>$('authEmail').focus(),50)}
function setAuthMode(mode){authMode=mode;let signup=mode==='signup';$('signinTab').classList.toggle('active',!signup);$('signupTab').classList.toggle('active',signup);$('nameField').style.display=signup?'flex':'none';$('forgotBtn').style.display=signup?'none':'inline-block';$('authTitle').textContent=signup?'Create Customer Account':'Customer Sign In';$('authSubmit').textContent=signup?'Create Account':'Sign In';$('authPassword').autocomplete=signup?'new-password':'current-password'}
async function submitAuth(e){e.preventDefault();if(!requireSupabase())return;let email=$('authEmail').value.trim().toLowerCase(),password=$('authPassword').value,name=$('authName').value.trim();try{if(authMode==='signup'){if(!name)return alert('Please enter your full name.');let cred=await auth.createUserWithEmailAndPassword(email,password);await cred.user.updateProfile({displayName:name});await db.collection('profiles').doc(cred.user.uid).set({fullName:name,email,role:'customer',createdAt:sbFieldValue.serverTimestamp(),updatedAt:sbFieldValue.serverTimestamp()},{merge:true})}else await auth.signInWithEmailAndPassword(email,password);closeModal('authModal');$('authForm').reset()}catch(err){alert(err.message)}}
async function socialSignIn(){if(!requireSupabase())return;try{await auth.signInWithPopup();closeModal('authModal')}catch(err){alert('Google sign-in could not start: '+err.message)}}
function customerProfileCacheKey(user){return user?'nadineCustomerProfile:'+user.uid:'nadineCustomerProfile:guest'}
function readCachedCustomerProfile(user){try{return JSON.parse(localStorage.getItem(customerProfileCacheKey(user))||'{}')||{}}catch(e){return {}}}
function cacheCustomerProfile(user,data){try{localStorage.setItem(customerProfileCacheKey(user),JSON.stringify({...data,updatedAtLocal:new Date().toISOString()}))}catch(e){console.warn('Profile cache could not be saved',e)}}
async function loadCustomerProfile(user){customerProfile={};if(!user)return;const cached=readCachedCustomerProfile(user);try{const doc=await db.collection('profiles').doc(user.uid).get();customerProfile={...cached,...(doc.exists?doc.data():{})};cacheCustomerProfile(user,customerProfile);prefillCheckoutFromProfile()}catch(err){customerProfile=cached;prefillCheckoutFromProfile();console.warn('Cloud profile could not load; using saved device copy',err)}}
function prefillCheckoutFromProfile(){const u=auth?.currentUser,p=customerProfile||{};if(!u)return;if($('cName')&&!$('cName').value)$('cName').value=p.fullName||u.displayName||'';if($('cPhone')&&!$('cPhone').value)$('cPhone').value=p.phone||'';const map={cArea:'area',cStreet:'street',cBuilding:'building',cFloor:'floor',cApartment:'apartment',cLandmark:'landmark',cNotes:'deliveryNotes'};Object.entries(map).forEach(([id,key])=>{if($(id)&&!$(id).value)$(id).value=p[key]||''});if(p.preferredFulfillment){const radio=document.querySelector(`input[name="fulfillment"][value="${p.preferredFulfillment}"]`);if(radio)radio.checked=true}}
async function openProfile(fromHistory=false){if(!requireSupabase())return;if(!fromHistory)nadinePush('profile');const user=auth.currentUser;if(!user)return openAuth();$('profileModal').classList.add('show');setPageLocked(true);$('profileMessage').textContent='Loading…';await loadCustomerProfile(user);const p=customerProfile||{},name=p.fullName||user.displayName||'Customer';$('profileAvatar').textContent=(name.trim()[0]||'C').toUpperCase();$('profileSideName').textContent=name;$('profileSideEmail').textContent=user.email||'';$('pName').value=name;$('pEmail').value=user.email||'';$('pPhone').value=p.phone||'';$('pDob').value=p.dateOfBirth||'';$('pFulfillment').value=p.preferredFulfillment||'delivery';$('pArea').value=p.area||'';$('pStreet').value=p.street||'';$('pBuilding').value=p.building||'';$('pFloor').value=p.floor||'';$('pApartment').value=p.apartment||'';$('pLandmark').value=p.landmark||'';$('pNotes').value=p.deliveryNotes||'';$('profileWishlistCount').textContent=wishlist.length;$('profileMemberSince').textContent=user.metadata?.creationTime?new Date(user.metadata.creationTime).getFullYear():'—';try{const snap=await db.collection('orders').where('customerUid','==',user.uid).get();$('profileOrderCount').textContent=snap.size}catch(e){$('profileOrderCount').textContent='—'}$('profileMessage').textContent=''}
async function saveCustomerProfile(){const user=auth.currentUser;if(!user)return;const msg=$('profileMessage'),fullName=$('pName').value.trim(),phone=$('pPhone').value.trim();if(!fullName){msg.textContent='Please enter your full name.';return}const data={fullName,phone,dateOfBirth:$('pDob').value||'',preferredFulfillment:$('pFulfillment').value,city:'Tripoli / Qalamoun / Dahr El Ain',area:$('pArea').value.trim(),street:$('pStreet').value.trim(),building:$('pBuilding').value.trim(),floor:$('pFloor').value.trim(),apartment:$('pApartment').value.trim(),landmark:$('pLandmark').value.trim(),deliveryNotes:$('pNotes').value.trim(),email:user.email||'',role:'customer'};customerProfile={...customerProfile,...data};cacheCustomerProfile(user,customerProfile);try{await user.updateProfile({displayName:fullName});updateAuthButton(user)}catch(e){console.warn('Authentication display name could not update',e)}prefillCheckoutFromProfile();$('profileSideName').textContent=fullName;$('profileAvatar').textContent=(fullName[0]||'C').toUpperCase();msg.textContent='Saving…';try{await db.collection('profiles').doc(user.uid).set({...data,updatedAt:sbFieldValue.serverTimestamp()},{merge:true});customerProfile={...customerProfile,...data};cacheCustomerProfile(user,customerProfile);msg.textContent='Profile saved to your account. It will appear on every device where you sign in.'}catch(err){msg.textContent='Could not save profile to your account: '+err.message+' Publish the included Supabase rules, then try again.'}}
async function sendProfilePasswordReset(){const user=auth.currentUser;if(!user?.email)return;try{await auth.sendPasswordResetEmail(user.email);alert('A password-reset email was sent. Please also check Spam or Junk because the sender is newly configured.')}catch(err){alert(err.message)}}
function handleAuthButton(e){e?.stopPropagation();if(auth&&auth.currentUser)toggleAccountMenu();else openAuth()}
function toggleAccountMenu(){$('accountPop').classList.toggle('show')}
function closeAccountMenu(){$('accountPop').classList.remove('show')}
async function signOutCustomer(){closeAccountMenu();try{await auth.signOut()}catch(err){alert(err.message)}}
async function resetPassword(){if(!requireSupabase())return;const email=$('authEmail').value.trim().toLowerCase();if(!email)return alert('Enter your email address first, then press Forgot password.');try{await auth.sendPasswordResetEmail(email);alert('A password-reset email was sent to '+email+'. Please check your inbox. (Because this email service is newly configured, the message may occasionally appear in your Spam or Junk folder.)')}catch(err){alert('Could not send reset email: '+err.message)}}
document.addEventListener('click',e=>{if(!e.target.closest('.account-menu'))closeAccountMenu()});
const serviceInfo={
delivery:{title:'Tripoli Delivery',body:`<p>We offer local delivery across Tripoli. Delivery availability, charges and timing depend on your area and order details.</p><p>Review the full delivery and returns information before placing your order.</p><p><button class="widebtn" type="button" onclick="openPolicy('delivery')">View delivery details</button></p>`},
pickup:{title:'Free Parapharmacy Pickup',body:`<p>Choose free pickup and collect your order directly from Nadine Parapharm.</p><p>Use the map below to open our location and get directions.</p><p><a href="https://maps.app.goo.gl/dZmH7xQiGc9XyukM8" target="_blank" rel="noopener" style="display:inline-block;background:#126a43;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:800">Open in Google Maps</a></p>`},
consultation:{title:'Free Consultations',body:`<p>Need help choosing a product? Our team can guide you on skincare, cosmetics, baby care, vitamins, supplements and other parapharmacy products.</p><p><a href="https://wa.me/96171979118?text=Hello%20Nadine%20Parapharm%2C%20I%20would%20like%20a%20free%20consultation%20about%20a%20product." target="_blank" rel="noopener" style="display:inline-block;background:#126a43;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:800">Chat on WhatsApp</a></p>`},
healthcare:{title:'Healthcare Services',body:`<p>Our in-parapharmacy healthcare services include blood pressure checks, blood glucose testing and injections administered by a licensed pharmacist.</p><p>Contact us for availability and details before visiting.</p><p><a href="https://wa.me/96171979118?text=Hello%20Nadine%20Parapharm%2C%20I%20would%20like%20more%20information%20about%20your%20in-parapharmacy%20healthcare%20services." target="_blank" rel="noopener" style="display:inline-block;background:#126a43;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:800">Ask on WhatsApp</a></p>`},
medicine:{title:'Medicine Enquiries',body:`<p>Medicines are not sold directly through the website. If you are looking for a medicine, contact our team and we will provide the available information.</p><p><a href="https://wa.me/96171979118?text=Hello%20Nadine%20Parapharm%2C%20I%20am%20looking%20for%20a%20medicine.%20Please%20send%20me%20the%20available%20information." target="_blank" rel="noopener" style="display:inline-block;background:#126a43;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:800">Ask on WhatsApp</a></p>`},
insurance:{title:'Insurance Partners',body:`<p>We work with GlobeMed networks such as AXA, MetLife and BLF, as well as Bankers. Coverage and eligibility depend on your individual plan.</p><p><button class="widebtn" type="button" onclick="openPolicy('insurance')">View insurance details</button></p>`}
};
function openServiceInfo(type){const info=serviceInfo[type];if(!info)return;$('policyTitle').textContent=info.title;$('policyBody').innerHTML=info.body;$('policyModal').classList.add('show');setPageLocked(true)}
const policies={
privacy:`<p><b>Last updated:</b> July 2026</p><p>Nadine Parapharm collects the information needed to create accounts, process orders and contact customers, including name, email, phone number, delivery address and order history. Authentication is provided through Supabase and Google where selected.</p><h3>How information is used</h3><ul><li>To process and deliver orders.</li><li>To provide customer support and order updates.</li><li>To protect the website and prevent misuse.</li></ul><p>Information is not sold. Order and account data may be retained as needed for operations, legal obligations and dispute handling. Customers may contact the parapharmacy to request access or correction of their information.</p>`,
terms:`<p>By using this website, customers agree to provide accurate information and use the service lawfully. Product availability, prices and delivery times may change. An online order is a request and may be confirmed, adjusted or declined by the parapharmacy.</p><p>This website does not provide a medical diagnosis. Customers must follow the pharmacist's or doctor's instructions and read product labels. Nadine Parapharm is not responsible for harm caused by misuse, undisclosed allergies or failure to follow professional advice.</p>`,
delivery:`<h3>Delivery</h3><p>Delivery availability and fees depend on the order value and destination. The parapharmacy may contact the customer to confirm the address, availability and timing.</p><h3>Returns and refunds</h3><p>For health and safety, medicines and products that have left parapharmacy control may not be returnable unless they are defective, damaged, incorrect or otherwise returnable under applicable law. Contact the parapharmacy promptly and keep the receipt and packaging. Approved refunds are handled using the method agreed with the parapharmacy.</p>`,
prescription:`<p>Prescription-only medicines are not supplied solely because an order was submitted online. The parapharmacy may request a valid prescription, verify it and contact the prescriber when appropriate. The pharmacist may refuse or modify an order for safety, legal or stock reasons.</p><p>Do not use the website for urgent medical needs. In an emergency, contact local emergency services.</p>`,
insurance:`<h3>Insurance partners</h3><p>Nadine Parapharm works with GlobeMed networks, including AXA, MetLife and BLF, as well as Bankers.</p><p>Coverage, eligible products, required documents and approval depend on the customer's plan and provider. Contact the parapharmacy on WhatsApp before visiting so the team can check the available information and guide you.</p><p><b>Please note:</b> A preliminary check does not guarantee final approval or coverage. Bring the original insurance documents when visiting.</p><p><a href="https://wa.me/96171979118?text=Hello%20Nadine%20Parapharm%2C%20I%20would%20like%20to%20check%20my%20insurance%20coverage%20before%20visiting." target="_blank" rel="noopener" style="display:inline-block;background:#126a43;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:800">Check on WhatsApp</a></p>`
};
function openPolicy(type,fromHistory=false){if(!fromHistory)nadinePush('policy',{type:String(type)});$('policyTitle').textContent=({privacy:'Privacy Policy',terms:'Terms & Conditions',delivery:'Delivery & Returns',prescription:'Medicine Information',insurance:'Insurance Partners'})[type]||'Policy';$('policyBody').innerHTML=policies[type]||'';$('policyModal').classList.add('show');setPageLocked(true)}
function updateAuthButton(userOverride){let user=userOverride!==undefined?userOverride:(auth&&auth.currentUser);$('authBtn').textContent=user?`Hi, ${(user.displayName||user.email||'Customer').split(' ')[0]}`:'Sign In';$('authBtn').classList.toggle('signed-in',!!user)}

function syncCustomerSavedItemsToLiveProducts(){
  const liveIds=new Set(products.map(p=>String(p.id)));
  recent=recent.filter(id=>liveIds.has(String(id)));
  wishlist=wishlist.filter(id=>liveIds.has(String(id)));
  cart=cart.filter(item=>liveIds.has(String(item.id)));
  try{
    localStorage.setItem('nadineRecent',JSON.stringify(recent));
    localStorage.setItem(activeWishlistKey,JSON.stringify(wishlist));
    localStorage.setItem(activeCartKey,JSON.stringify(cart));
  }catch(e){}
  updateCartCount();updateWishlistCount();
}
function bundledProductFor(p){
  if(!p)return null;
  const list=window.NADINE_PRELOADED_PRODUCTS||[];
  const id=String(p.id||'');
  const name=String(p.name||'').trim().toLowerCase().replace(/\s+/g,' ');
  return list.find(x=>String(x.id||'')===id) || list.find(x=>String(x.name||'').trim().toLowerCase().replace(/\s+/g,' ')===name) || null;
}

function smartCategoryFromName(name,currentCat=''){
  const raw=String(name||'');
  const t=(' '+raw.toLowerCase().replace(/[^a-z0-9+]+/g,' ')+' ');
  const current=String(currentCat||'').trim();
  if(current && !/^needs review$/i.test(current) && !/^uncategori[sz]ed$/i.test(current) && current.toLowerCase()!=='para') return current;
  const rules=[
    ['Eye Care',/\b(eye drops?|ophthalm|artelac|soflens|contact lens|lens solution|eye patch|ocular|eyelid)\b/],
    ['Feminine Care',/\b(intimate|feminine|vaginal|gyn|sanitary|period|panty liner|menstrual)\b/],
    ['Sun Care',/\b(sunscreen|sunblock|spf|sun tan|suntan|after sun|solar|uv )\b/],
    ['First Aid & Wound Care',/\b(bandage|gauze|wound|dressing|plaster|first aid|medical honey|betadine|antiseptic)\b/],
    ['Foot Care',/\b(foot|corn remover|heel|forefoot|foot file)\b/],
    ['Nail Care',/\b(nail|acetone|polish remover|cuticle|manicure|pedicure)\b/],
    ['Men’s Care',/\b(for men|homme|beard|after shave|aftershave|shaving)\b/],
    ['Sexual Wellness',/\b(condom|lubricant|sexual|delay spray|intimate gel|long for men|long for women)\b/],
    ['Mother & Maternity',/\b(mama|maternity|pregnan|breast pump|nursing|lactation)\b/],
    ['Baby Feeding',/\b(avent|feeding bottle|bottle brush|nipple|teat|pacifier|soothie|sippy|straw bottle|milk dispenser)\b/],
    ['Medical Supplies',/\b(gloves|syringe|needle|ostomy|coloplast|urine bag|leg bag|mask|tongue depressor)\b/],
    ['Medical Devices',/\b(accu.?chek|glucometer|glucose meter|test strips?|blood pressure|tensiometer|thermometer|oximeter|nebulizer|scale|walker|crutch|brace|support)\b/],
    ['Oral Care',/\b(tooth|toothpaste|toothbrush|mouthwash|mouth wash|dental|floss|interdental|dentifrice|gum care)\b/],
    ['Hair Care',/\b(shampoo|conditioner|hair mask|hair oil|hair serum|dandruff|hair color|hair dye|scalp|anti lice|lice comb)\b/],
    ['Baby Care',/\b(baby|infant|newborn|junior|diaper|nappy|teether|baby cream|baby wash)\b/],
    ['Vitamins & Supplements',/\b(vitamin|multivitamin|zinc|magnesium|probiotic|omega|collagen|ginseng|melatonin|folic|biotin|calcium|iron|l carnitine|cod liver|supplement|caplets?|tablets?|capsules?)\b/],
    ['Nutrition',/\b(protein|nutrition|meal replacement|sweetener|energy bar|formula|milk powder|electrolyte|rehydration)\b/],
    ['Hygiene',/\b(hand wash|handwash|soap|sanitizer|sanitiser|wet wipes|wipes|tissue|cotton|alcohol 70|bath scrubber)\b/],
    ['Personal Care',/\b(deodorant|body spray|body wash|shower gel|razor|hand cream|lip balm|body lotion)\b/],
    ['Cosmetics',/\b(makeup|make up|mascara|foundation|concealer|lipstick|blush|eyeliner|powder)\b/],
    ['Skincare',/\b(face|cream|serum|moistur|cleanser|acne|peel|gel|lotion|micellar|mask|aloe vera|salicylic|hyaluronic|retinol|epithelial|biology)\b/],
    ['Accessories',/\b(organizer|case|brush|scissors|water bag|hot water bag|cushion)\b/]
  ];
  for(const [cat,re] of rules){if(re.test(t))return cat;}
  return 'Wellness';
}

function mergeBundledCatalogData(p){
  if(!p)return p;
  const bundled=bundledProductFor(p);
  if(!bundled)return p;
  const merged={...p};
  const cat=String(merged.cat||'').trim();
  if(!cat || /^uncategori[sz]ed$/i.test(cat) || /^needs review$/i.test(cat) || /^para$/i.test(cat)) merged.cat=smartCategoryFromName(merged.name,bundled.cat||merged.cat);
  else merged.cat=smartCategoryFromName(merged.name,merged.cat);
  const imgs=Array.isArray(merged.images)?merged.images.filter(Boolean):[];
  const shouldUseBundledImage=Array.isArray(bundled.images) && bundled.images.length;
  if(shouldUseBundledImage) merged.images=[...bundled.images];
  if(!String(merged.description||'').trim() && String(bundled.description||'').trim()) merged.description=bundled.description;
  return merged;
}
function applyCustomerProducts(rows){
  products=(rows||[])
    .map(r=>{
      let p=r&&r.data!==undefined?{id:r.doc_id,...(r.data||{})}:r;
      if(!p)return null;
      p=mergeBundledCatalogData(p);
      const cat=String(p.cat||'').trim();
      if(!cat||/^uncategori[sz]ed$/i.test(cat)||/^needs review$/i.test(cat)||/^para$/i.test(cat))p.cat=smartCategoryFromName(p.name,p.cat);
      return p;
    })
    .filter(p=>p&&p.active!==false)
    .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));

  syncCustomerSavedItemsToLiveProducts();
  customerProductPage=1;
  renderCats();renderProducts();renderRecent();
  if($('cartOverlay')?.classList.contains('show'))renderCart();
  if($('wishlistOverlay')?.classList.contains('show'))renderWishlist();
}

let customerProductsChannel=null;
let customerProductsRefreshTimer=null;

async function loadAllCustomerProductsDirect(){
  // The Excel-backed bundled catalog is the storefront source of truth for
  // product names and prices. This prevents incomplete/corrupt database rows
  // from rendering blank names or $NaN on the customer site.
  const bundled=Array.isArray(window.NADINE_PRELOADED_PRODUCTS)?window.NADINE_PRELOADED_PRODUCTS:[];
  applyCustomerProducts(bundled.map(p=>({...p})));
}

function scheduleCustomerProductsRefresh(){
  clearTimeout(customerProductsRefreshTimer);
  customerProductsRefreshTimer=setTimeout(()=>{
    loadAllCustomerProductsDirect().catch(err=>console.error('Customer product refresh failed',err));
  },120);
}

function startCatalogListeners(){
  if(!supabaseReady)return;
  if(unsubscribeProducts)unsubscribeProducts();
  if(unsubscribeCatalog)unsubscribeCatalog();
  if(unsubscribeShopSettings)unsubscribeShopSettings();

  // Product catalog is loaded DIRECTLY from Supabase.
  // This guarantees that SoftPharm imports visible in admin are also visible here,
  // including catalogs larger than the 1,000-row PostgREST default.
  loadAllCustomerProductsDirect().catch(err=>{
    console.error('Products could not load from Supabase shop feed',err);
    products=[];
    renderCats();renderProducts();renderRecent();
    const note=$('customerResultsNote');
    if(note)note.textContent='The product catalog could not load. Please refresh after the shop_products SQL setup is installed.';
  });

  if(customerProductsChannel){
    try{window.nadineSupabase.removeChannel(customerProductsChannel)}catch(e){}
  }
  customerProductsChannel=window.nadineSupabase
    .channel('customer-products-direct-'+Math.random())
    .on('postgres_changes',{
      event:'*',
      schema:'public',
      table:'app_documents',
      filter:'collection_name=eq.products'
    },scheduleCustomerProductsRefresh)
    .subscribe();

  // Keep a cleanup function in the old variable so the rest of the page remains compatible.
  unsubscribeProducts=()=>{
    clearTimeout(customerProductsRefreshTimer);
    if(customerProductsChannel){
      try{window.nadineSupabase.removeChannel(customerProductsChannel)}catch(e){}
      customerProductsChannel=null;
    }
  };

  unsubscribeCatalog=db.collection('settings').doc('catalog').onSnapshot(
    {includeMetadataChanges:true},
    doc=>{
      if(doc.metadata&&doc.metadata.fromCache)return;
      categories=doc.exists&&Array.isArray(doc.data().categories)?[...new Map(
        doc.data().categories
          .map(v=>String(v||'').trim())
          .filter(v=>v&&!/^uncategori[sz]ed$/i.test(v))
          .map(v=>[v.toLowerCase(),v])
      ).values()]:[];
      if(products.some(p=>String(p.cat||'').toLowerCase()==='para')&&!categories.some(c=>c.toLowerCase()==='para'))categories.push('para');
      hiddenMedicalDeviceSubcategories=doc.exists&&Array.isArray(doc.data().medicalDeviceHiddenSubcategories)?doc.data().medicalDeviceHiddenSubcategories:[];categorySubcategories=doc.exists&&doc.data().categorySubcategories&&typeof doc.data().categorySubcategories==='object'?doc.data().categorySubcategories:{};
      if(selectedCat!=='All'&&!categories.includes(selectedCat))selectedCat='All';
      renderCats();renderProducts();renderRecent();
    },
    err=>{
      console.error('Categories could not load from server',err);
      categories=products.some(p=>String(p.cat||'').toLowerCase()==='para')?['para']:[];
      selectedCat='All';renderCats();renderProducts();
    }
  );

  unsubscribeShopSettings=db.collection('settings').doc('shop').onSnapshot(doc=>{
    if(doc.exists)shopSettings={...shopSettings,...doc.data()};
    renderCart();
  },err=>console.error('Shop settings could not load',err));
}


/* Browser back/forward navigation for the single-page customer website. */
(function setupBrowserNavigation(){
  const originals={
    openCart:window.openCart,
    closeCart:window.closeCart,
    openWishlist:window.openWishlist,
    closeWishlist:window.closeWishlist,
    openCheckout:window.openCheckout,
    closeModal:window.closeModal,
    openMyOrders:window.openMyOrders,
    showProduct:window.showProduct,
    openAuth:window.openAuth,
    openProfile:window.openProfile,
    openPolicy:window.openPolicy
  };
  let applyingHistory=false;
  const modalToView={
    checkoutModal:'checkout',
    ordersModal:'orders',
    productModal:'product',
    authModal:'auth',
    profileModal:'profile',
    policyModal:'policy'
  };
  const navigationalIds=['cartOverlay','wishlistOverlay','checkoutModal','ordersModal','productModal','authModal','profileModal','policyModal'];

  function stateFor(view,data){return {nadineNavigation:true,view:view||'home',data:data||null};}
  function currentState(){return history.state&&history.state.nadineNavigation?history.state:stateFor('home');}
  function closeNavigationalViews(){
    navigationalIds.forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('show');});
    setPageLocked(false);
    closeAccountMenu();
  }
  function applyState(state){
    applyingHistory=true;
    closeNavigationalViews();
    const view=state?.view||'home',data=state?.data||{};
    try{
      if(view==='cart') originals.openCart();
      else if(view==='wishlist') originals.openWishlist();
      else if(view==='checkout') originals.openCheckout();
      else if(view==='orders') originals.openMyOrders();
      else if(view==='product') originals.showProduct(data.id);
      else if(view==='auth') originals.openAuth();
      else if(view==='profile') originals.openProfile();
      else if(view==='policy') originals.openPolicy(data.type);
    }finally{
      setTimeout(()=>{applyingHistory=false;},0);
    }
  }
  function go(view,data,replace){
    const next=stateFor(view,data);
    if(replace) history.replaceState(next,'',location.href);
    else history.pushState(next,'',location.href);
    applyState(next);
  }
  function backOrClose(expectedView,closeFn){
    if(!applyingHistory&&currentState().view===expectedView&&history.length>1){history.back();return;}
    closeFn();
  }

  history.replaceState(stateFor('home'),'',location.href);
  window.addEventListener('popstate',e=>applyState(e.state&&e.state.nadineNavigation?e.state:stateFor('home')));

  window.openCart=function(){if(applyingHistory)return originals.openCart();go('cart');};
  window.closeCart=function(){backOrClose('cart',originals.closeCart);};
  window.openWishlist=function(){if(applyingHistory)return originals.openWishlist();go('wishlist');};
  window.closeWishlist=function(){backOrClose('wishlist',originals.closeWishlist);};
  window.openCheckout=function(){if(applyingHistory)return originals.openCheckout();go('checkout');};
  window.openMyOrders=function(){if(applyingHistory)return originals.openMyOrders();go('orders');};
  window.showProduct=function(id){return originals.showProduct(id);};
  window.openAuth=function(){if(applyingHistory)return originals.openAuth();go('auth');};
  window.openProfile=function(){if(applyingHistory)return originals.openProfile();go('profile');};
  window.openPolicy=function(type){if(applyingHistory)return originals.openPolicy(type);go('policy',{type:String(type)});};
  window.closeModal=function(id){
    const view=modalToView[id];
    if(view)return backOrClose(view,()=>originals.closeModal(id));
    return originals.closeModal(id);
  };
})();

if(supabaseReady){auth.onAuthStateChanged(user=>{updateAuthButton(user);loadCartForUser(user);loadWishlistForUser(user);loadCustomerProfile(user)});startCatalogListeners();}
else{loadCartForUser(null);loadWishlistForUser(null);}
renderCats();renderProducts();renderRecent();updateCartCount();updateWishlistCount();
if(!supabaseReady)updateAuthButton();


(function(){
  const CACHE_KEY='nadine_exact_product_photos_v4';
  let cache={}; try{cache=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')||{}}catch(e){}
  const stop=new Set(['A','AN','THE','AND','OR','WITH','FOR','OF','IN','ON','FREE','OFFER','PACK','PCS','PC']);
  const norm=x=>String(x||'').toUpperCase().replace(/A[ -]?DERMA/g,'ADERMA').replace(/WIPS/g,'WIPES').replace(/[^A-Z0-9]+/g,' ').trim();
  const toks=x=>norm(x).split(/\s+/).filter(t=>t.length>1&&!stop.has(t));
  function score(a,b){
    const A=toks(a),B=new Set(toks(b)); if(!A.length)return 0;
    let hit=0, important=0, importantHit=0;
    for(const t of A){ if(B.has(t))hit++; if(/[0-9]/.test(t)||t.length>=5){important++;if(B.has(t))importantHit++;} }
    let sc=hit/A.length; if(important) sc=.65*sc+.35*(importantHit/important);
    if(norm(a)===norm(b)) sc=1; return sc;
  }
  function cleanUrl(u){return String(u||'').replace(/&width=\d+/,'&width=900');}
  async function resolveOne(p){
    const key=norm(p.name); if(!key)return null;
    if(window.VERIFIED_EXACT_PRODUCT_IMAGES?.[key]) return window.VERIFIED_EXACT_PRODUCT_IMAGES[key];
    if(cache[key]) return cache[key];
    const q=encodeURIComponent(String(p.name||'').replace(/\+/g,' '));
    const urls=[
      `https://www.cf.com.lb/search/suggest.json?q=${q}&resources[type]=product&resources[limit]=6&resources[options][unavailable_products]=last`,
      `https://cf.com.lb/search/suggest.json?q=${q}&resources[type]=product&resources[limit]=6&resources[options][unavailable_products]=last`
    ];
    for(const url of urls){
      try{
        const r=await fetch(url,{mode:'cors',credentials:'omit'}); if(!r.ok)continue;
        const j=await r.json(); const arr=j?.resources?.results?.products||[];
        let best=null,bestScore=0;
        for(const x of arr){
          const sc=score(p.name,x.title); if(sc>bestScore){bestScore=sc;best=x;}
        }
        // High threshold prevents unrelated photos. Exact source catalog often scores 0.8-1.0.
        if(best && bestScore>=0.72 && best.image){
          const img=cleanUrl(best.image); cache[key]=img;
          try{localStorage.setItem(CACHE_KEY,JSON.stringify(cache))}catch(e){}
          return img;
        }
      }catch(e){}
    }
    return null;
  }
  async function hydrate(){
    if(!Array.isArray(window.products)&&typeof products==='undefined')return;
    const list=(typeof products!=='undefined'?products:window.products)||[];
    // apply verified/cache immediately
    let changed=false;
    for(const p of list){const k=norm(p.name);const u=(window.VERIFIED_EXACT_PRODUCT_IMAGES||{})[k]||cache[k];if(u&&(!p.images||!p.images[0])){p.images=[u];changed=true;}}
    if(changed&&typeof render==='function')render();
    const todo=list.filter(p=>!p.images?.[0]);
    let cursor=0;
    async function worker(){
      while(cursor<todo.length){const p=todo[cursor++];const u=await resolveOne(p);if(u){p.images=[u]; if(cursor%8===0&&typeof render==='function')render();}}
    }
    await Promise.all(Array.from({length:4},worker));
    if(typeof render==='function')render();
  }
  window.nadineResolveExactPhotos=hydrate;
  window.addEventListener('load',()=>setTimeout(hydrate,700));
  setTimeout(hydrate,1800);
})();
