// 상품 상세에는 추가이미지를 입력한 순서대로 세로로 표시합니다.
function detailImageSources(p){
 const normalize=value=>{
  let src=String(value??'').trim();if(!src)return '';
  if(/^https:\/\//i.test(src))return src;
  src=src.replace(/^\.\//,'');if(/^[\w/-]+$/.test(src))src+='.png';
  if(!/^[\w./-]+\.(png|jpe?g|webp|gif)$/i.test(src)||src.split('/').some(s=>!s||s==='.'||s==='..'))return '';
  try{return typeof itemImagePath==='function'?itemImagePath(src):src}catch(e){return ''}
 };
 const main=normalize(p.image),values=Array.isArray(p.images)?p.images:String(p.images??'').split('|');
 return [...new Set(values.map(normalize).filter(src=>src&&src!==main))];
}
function renderDetailContent(p){
 const sources=detailImageSources(p),description=String(p.description??'');
 const text=document.querySelector('#modalDescription');text.textContent=description;text.classList.toggle('hidden',!description.trim());
 document.querySelector('#modalDetailImages').innerHTML=sources.map((src,i)=>`<figure class="detail-image"><img src="${esc(src)}" alt="${esc(p.name)} 설명사진 ${i+1}" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><figcaption class="detail-image-error" hidden>설명사진을 불러오지 못했어요.</figcaption></figure>`).join('');
 document.querySelector('#modalDetailSection').classList.toggle('hidden',!sources.length&&!description.trim());
}
let P=[],cat="전체",st="selling",page=1,per=18,SETTINGS={categories:[],statuses:[],kakaoUrl:"https://open.kakao.com/o/sFesMABh",newDays:3};
let F=new Set(JSON.parse(localStorage.getItem("dangniFavs")||"[]"));
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=n=>Number(n).toLocaleString("ko-KR",{maximumFractionDigits:10});
const crops=["🥕","🥔","🌽","🍠","🍅","🍆","🎃","🧅","🧄","🫛","🫑","🥬"];
function cols(){let w=innerWidth;return w<=600?2:w<=800?3:w<=1100?4:w<=1400?5:6}
function setPer(){per=cols()*(innerWidth<=600?8:6)}
function cropFor(p){let s=String(p.id||p.name||"작물"),h=0;for(let c of s)h=(h*31+c.charCodeAt(0))>>>0;return crops[h%crops.length]}
function productStatuses(p){return parseStatuses(p.statuses||p.status)}
function statusBadges(p){return productStatuses(p).map(s=>`<span class="status-badge ${s}">${esc(statusText(s))}</span>`).join("")}
function statusText(s){let x=SETTINGS.statuses.find(x=>x.value===s);return x?x.label:({selling:"판매중",soldout:"판매완료",unavailable:"미판매",set:"세트판매"}[s]||s)}
function dr(p){let v=p.discount??p.discountRate??p.discount_rate??0;if(typeof v==="string")v=v.replace("%","");return Math.max(0,Math.min(100,Number(v)||0))}
function sale(p){return Number((Number(p.price||0)*(1-dr(p)/100)).toFixed(10))}
function price(p){if(productStatuses(p).includes("unavailable"))return `<div class="product-price">-</div>`;if(p.price===null||p.price===undefined||p.price==="")return `<div class="product-price">가격문의</div>`;return dr(p)?`<div class="price-row"><span class="discount">${dr(p)}%</span><span class="old-price">${money(p.price)}</span><span class="sale-price">${money(sale(p))}</span></div>`:`<div class="product-price">${money(p.price)}</div>`}
function isNew(p){let raw=p.date||p.registeredAt||p.registered_at;if(!raw)return false;let d=new Date(String(raw).replace(/\./g,"-")+"T00:00:00");if(isNaN(d))return false;let n=new Date();n.setHours(0,0,0,0);let diff=Math.floor((n-d)/86400000);return diff>=0&&diff<3}
// 최근 7일 검색 + 검색 결과 상품 클릭 TOP 10
const hotProductIds=new Set();
let hotSearchTimer=null;
const hotSearchDelayMs=1100;
function hotSearchMatches(){
 const q=searchKey($("#searchInput").value);
 if(q.length<2)return [];
 // 화면의 실제 검색 결과에만 검색 점수를 부여합니다.
 const matched=filtered();
 if(!matched.length||matched.length>10)return [];
 return matched.map(p=>({id:String(p.id),name:String(p.name||"")}));
}
function scheduleHotSearch(){
 clearTimeout(hotSearchTimer);
 hotSearchTimer=setTimeout(()=>{
  const items=hotSearchMatches();
  if(items.length)sendHotEvent("search",items,searchKey($("#searchInput").value));
 },hotSearchDelayMs);
}
async function sendHotEvent(type,items,query=""){
 if(!wishlistEndpoint||!items.length)return;
 try{
  await wishJsonp({action:"track",type,client:wishClientId(),
   items:JSON.stringify(items.slice(0,10)),q:query.slice(0,100)});
  // 새 순위는 다른 방문자에게도 자동으로 반영됩니다.
  queueHotRefresh();
 }catch(error){console.warn("[당그니네 밭] 인기 집계 대기:",error.message)}
}
let hotRefreshTimer=null;
function queueHotRefresh(){
 clearTimeout(hotRefreshTimer);
 hotRefreshTimer=setTimeout(refreshHotProducts,1200);
}
async function refreshHotProducts(){
 if(!wishlistEndpoint||document.hidden)return;
 try{
  const data=await wishJsonp({action:"hot"});
  const ids=(data.items||[]).slice(0,10).map(item=>String(item.id));
  if(ids.join("|")!==[...hotProductIds].join("|")){
   hotProductIds.clear();ids.forEach(id=>hotProductIds.add(id));render();
  }
 }catch(error){console.warn("[당그니네 밭] HOT 순위 대기:",error.message)}
}
function startHotTracking(){
 if(!wishlistEndpoint)return;
 refreshHotProducts();
 setInterval(refreshHotProducts,180000);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshHotProducts()});
}
// 구글 스프레드시트의 '태그' 열에 '당그니 PICK'을 넣으면 추천 배지만 표시합니다.
function isDangniPickTag(t){const v=String(t??'').normalize('NFKC').replace(/[\s\p{P}\p{S}]+/gu,'').toLocaleLowerCase('ko-KR');return v==='당그니pick'||v==='당그니픽'}
function hasDangniPick(p){return Array.isArray(p.tags)&&p.tags.some(isDangniPickTag)}
// 러빗 PICK: '러빗 PICK', '러빗 픽', '러빗픽'을 같은 태그로 인식합니다.
function isRabbitPickTag(t){const v=String(t??'').normalize('NFKC').replace(/[\s\p{P}\p{S}]+/gu,'').toLocaleLowerCase('ko-KR');return v==='러빗pick'||v==='러빗픽'}
function hasRabbitPick(p){return Array.isArray(p.tags)&&p.tags.some(isRabbitPickTag)}
// 기존 '구템' 입력을 유지하면서 '레릭'/'RELIC'도 인식하고 RELIC 배지를 표시합니다.
function isOldItemTag(t){const v=String(t??'').normalize('NFKC').replace(/[\s\p{P}\p{S}]+/gu,'').toLocaleLowerCase('ko-KR');return v==='구템'||v==='레릭'||v==='relic'}
function hasOldItem(p){return isOldItemTag(p.category)||(Array.isArray(p.tags)&&p.tags.some(isOldItemTag))}
function displayTags(p){return (Array.isArray(p.tags)?p.tags:[]).filter(t=>!isDangniPickTag(t)&&!isRabbitPickTag(t)&&!isOldItemTag(t))}
// 상품 카드에서는 PICK만 사진 왼쪽 아래로 분리합니다. 상세 팝업에서는 기존 배지 목록을 유지합니다.
function badges(p,includePick=true){return `<div class="badge-stack">${hasOldItem(p)?'<span class="auto-badge old-item">✦ RELIC</span>':''}${hotProductIds.has(String(p.id))?'<span class="auto-badge hot">🔥 HOT</span>':''}${isNew(p)?'<span class="auto-badge new">NEW</span>':''}${includePick&&hasDangniPick(p)?'<span class="auto-badge dangni-pick">💗 당그니 PICK</span>':''}${includePick&&hasRabbitPick(p)?'<span class="auto-badge rabbit-pick">🐰 러빗 PICK</span>':''}${dr(p)?`<span class="auto-badge sale">${dr(p)}%</span>`:''}</div>`}
function photoPickBadge(p){
 const dangni=hasDangniPick(p),rabbit=hasRabbitPick(p);
 if(!dangni&&!rabbit)return '';
 return `<div class="photo-pick-row">${dangni?'<span class="photo-pick-badge"><span class="pick-content"><span class="pick-heart" aria-hidden="true">💗</span><span class="pick-text">당그니 PICK</span></span></span>':''}${rabbit?'<span class="photo-pick-badge rabbit-pick"><span class="pick-content"><span class="pick-heart" aria-hidden="true">🐰</span><span class="pick-text">러빗 PICK</span></span></span>':''}</div>`;
}
function media(p){let c=cropFor(p);return p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="crop-fallback" role="img" aria-label="작물 이모티콘" style="display:none">${c}</span>`:`<span class="crop-fallback" role="img" aria-label="작물 이모티콘">${c}</span>`}
// 띄어쓰기·기호 차이를 무시하고 상품명과 태그를 검색합니다.
function searchKey(value){
 return String(value??"").normalize("NFKC").toLocaleLowerCase("ko-KR")
  .replace(/[\\s\\p{P}\\p{S}]+/gu,"");
}
// 검색 결과가 전혀 없을 때만 한 글자 오타도 허용합니다 (4글자 이상).
function oneEditAway(a,b){
 if(Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,errors=0;
 while(i<a.length&&j<b.length){
  if(a[i]===b[j]){i++;j++;continue}
  if(++errors>1)return false;
  if(a.length>b.length)i++;
  else if(a.length<b.length)j++;
  else{i++;j++}
 }
 return errors+(a.length-i)+(b.length-j)<=1;
}
function nearSearch(q,field){
 if(q.length<4)return false;
 const value=searchKey(field);
 for(let size=q.length-1;size<=q.length+1;size++){
  if(size<1||size>value.length)continue;
  for(let start=0;start+size<=value.length;start++)
   if(oneEditAway(q,value.slice(start,start+size)))return true;
 }
 return false;
}
// 등록일이 비어 있으면 오래된 상품으로 취급합니다.
function registeredTime(p){
 const raw=p.date??p.registeredAt??p.registered_at;
 if(raw==null||String(raw).trim()==="")return 0;
 const normalized=String(raw).trim().replace(/\.\s*/g,"-").replace(/-$/," ").trim();
 const time=Date.parse(normalized);
 return Number.isFinite(time)?time:0;
}
// 기본 정렬 하나에 등록일 최신순 + 같은 날짜 내 가나다순을 합칩니다.
function setupSortOptions(){
 const select=$("#sortFilter");if(!select)return;
 const label=select.closest("label");
 const title=label?.querySelector("span");if(title)title.textContent="정렬 기준";
 select.setAttribute("aria-label","정렬 기준");
 const base=select.querySelector('option[value="default"]');
 if(base)base.textContent="기본 정렬";
 // 이전 버전에서 추가했던 별도 최신순 옵션을 제거합니다.
 select.querySelectorAll('option[value="newest"]').forEach(option=>option.remove());
 // 기존 정렬 이름과 옵션을 유지하고 찜 많은 순만 추가합니다.
 if(!select.querySelector('option[value="mostWished"]')){
  const option=document.createElement("option");
  option.value="mostWished";
  option.textContent="찜 많은 순";
  select.appendChild(option);
 }
 select.value="default";
}
setupSortOptions();
function filtered(){
 const q=searchKey($("#searchInput").value);
 const candidates=P.filter(p=>(cat==="전체"||p.category===cat)
  &&(st==="all"||productStatuses(p).includes(st)));
 const fields=p=>[p.name,...(Array.isArray(p.tags)?p.tags:[])];
 let result=!q?candidates:candidates.filter(p=>fields(p).some(x=>searchKey(x).includes(q)));
 if(q&&result.length===0&&q.length>=4)
  result=candidates.filter(p=>fields(p).some(x=>nearSearch(q,x)));
 const order=$("#sortFilter").value;
 const byName=(a,b)=>String(a.name||"").localeCompare(String(b.name||""),"ko",{numeric:true});
 if(order==="default")return result.sort((a,b)=>
  (Number(isNew(b))-Number(isNew(a)))||
  (Number(hotProductIds.has(String(b.id)))-Number(hotProductIds.has(String(a.id))))||
  byName(a,b)
 );
 if(order==="mostWished")return result.sort((a,b)=>
  ((Number(wishCounts[String(b.id)])||0)-(Number(wishCounts[String(a.id)])||0))||byName(a,b)
 );
 return result.sort((a,b)=>{
  if(a.price==null&&b.price==null)return byName(a,b);
  if(a.price==null)return 1;
  if(b.price==null)return -1;
  const difference=order==="low"?sale(a)-sale(b):sale(b)-sale(a);
  return difference||byName(a,b);
 });
}

// === 공용 찜 수: Google Apps Script + 익명 브라우저 식별자 ===
// 개인 이름, 연락처, IP를 수집하지 않습니다. 브라우저별로 하나의 식별자만 사용합니다.
const wishCounts=Object.create(null);
let wishlistEndpoint="",wishlistReady=false,wishlistRequestSeq=0;
const wishlistQueues=new Map();
let wishlistInitialSync=Promise.resolve();
const wishlistClientKey="dangniWishlistClientId";
function wishClientId(){
 let id=localStorage.getItem(wishlistClientKey);
 if(!/^[a-f0-9]{32}$/.test(id||"")){
  const bytes=new Uint8Array(16);
  crypto.getRandomValues(bytes);
  id=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
  localStorage.setItem(wishlistClientKey,id);
 }
 return id;
}
function wishJsonp(params){
 return new Promise((resolve,reject)=>{
  if(!wishlistEndpoint){reject(Error("찜 집계 주소 미설정"));return}
  const callback="dangniWishCb_"+(++wishlistRequestSeq),script=document.createElement("script");
  let timer;
  const done=()=>{clearTimeout(timer);script.remove();delete window[callback]};
  window[callback]=payload=>{done();payload&&payload.ok?resolve(payload):reject(Error(payload?.error||"찜 집계 오류"))};
  script.onerror=()=>{done();reject(Error("찜 집계 연결 실패"))};
  timer=setTimeout(()=>{done();reject(Error("찜 집계 응답 지연"))},20000);
  const url=new URL(wishlistEndpoint);
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
  url.searchParams.set("callback",callback);
  url.searchParams.set("nonce",Date.now()+"_"+wishlistRequestSeq);
  script.src=url.toString();document.head.appendChild(script);
 });
}
function wishCountHtml(id){
 if(!wishlistReady)return "";
 const count=Math.max(0,Number(wishCounts[id])||0);
 return `<span class="wish-inline-count${count>=100?" wish-many":""}" data-wish-id="${esc(id)}" aria-label="현재 ${count}명이 담았어요">${count>=100?"99+":count.toLocaleString("ko-KR")}</span>`;
}
function updateWishCount(id,count){
 if(!wishlistReady)return;
 wishCounts[id]=Math.max(0,Number(count)||0);
 document.querySelectorAll(".wish-inline-count[data-wish-id]").forEach(el=>{
  if(el.dataset.wishId!==String(id))return;
  const n=wishCounts[id];el.textContent=n>=100?"99+":n.toLocaleString("ko-KR");
  el.classList.toggle("wish-many",n>=100);
  el.setAttribute("aria-label",`현재 ${n}명이 담았어요`);
 });
 // 찜 많은 순 정렬 중이면 서버에서 받은 최신 수치대로 즉시 재정렬합니다.
 if($("#sortFilter")?.value==="mostWished")render();
}
function updateAllWishCounts(counts){
 for(const id of Object.keys(wishCounts))delete wishCounts[id];
 for(const [id,n] of Object.entries(counts||{}))wishCounts[id]=Math.max(0,Number(n)||0);
 wishlistReady=true;
 render();

}
function syncWishChange(id,selected){
 if(!wishlistEndpoint)return;
 // 동일 상품을 빠르게 여러 번 누른 경우에도 서버 요청 순서 유지.
 const prev=wishlistQueues.get(id)||wishlistInitialSync;
 const next=prev.catch(()=>{}).then(()=>wishJsonp({action:"set",client:wishClientId(),id,selected:selected?1:0}))
  .then(data=>{if(data.id===id)updateWishCount(id,data.count)})
  .catch(error=>console.warn("[당그니네 밭] 찜 수 갱신 지연:",error.message));
 wishlistQueues.set(id,next);
 next.finally(()=>{if(wishlistQueues.get(id)===next)wishlistQueues.delete(id)});
}
async function refreshWishCounts(){
 if(!wishlistEndpoint||document.hidden)return;
 try{const data=await wishJsonp({action:"counts"});updateAllWishCounts(data.counts)}
 catch(e){console.warn("[당그니네 밭] 찜 수 조회 지연:",e.message)}
}
async function startWishCounts(){
 try{
  const response=await fetch("wishlist-config.json?"+Date.now(),{cache:"no-store"});
  if(!response.ok)return;
  const config=await response.json(),url=String(config.webAppUrl||"").trim();
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))return;
  wishlistEndpoint=url;
  // 기존 바구니 상품도 첫 접속 시 서버에 동기화. 한 브라우저는 한 명.
  const ids=[...F].filter(id=>/^[A-Za-z0-9_-]{1,40}$/.test(id));
  wishlistInitialSync=wishJsonp({action:"sync",client:wishClientId(),ids:ids.join(",")});
  const data=await wishlistInitialSync;
  updateAllWishCounts(data.counts);
  setInterval(refreshWishCounts,180000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshWishCounts()});
 }catch(e){console.warn("[당그니네 밭] 찜 수 연결 대기:",e.message)}
}
(function addWishStyles(){
 const style=document.createElement("style");
 style.textContent=`
 /* 두 원을 분리 유지: 전체 오른쪽 4px·위쪽 2px, 숫자 원 17px로 축소 */
 .product-card button.heart.wish-basket-stack{
  position:absolute;top:-1px;right:8px;display:block;box-sizing:border-box;
  width:36px;height:60px;min-width:36px;min-height:60px;
  padding:0;margin:0;border:0;border-radius:0;
  background:transparent;box-shadow:none;
  overflow:visible;line-height:1;
  isolation:isolate;
 }
 /* 바구니 흰색 원: 32x32 정원, 기존 중심 위치 유지 */
 .product-card button.heart.wish-basket-stack::before{
  content:"";position:absolute;z-index:0;
  left:2px;bottom:2px;width:32px;height:32px;
  box-sizing:border-box;border-radius:50%;
  background:rgba(255,255,255,.96);
  box-shadow:0 2px 8px rgba(66,58,44,.14);
  pointer-events:none;
 }
 .product-card button.heart.wish-basket-stack.faved::before{
  background:#fff3e4;
 }
 /* 찜 숫자: 작은 둥근 네모. 바구니 원은 그대로 두고 숫자만 4px 내림 */
 .product-card button.heart.wish-basket-stack .wish-inline-count{
  position:absolute;z-index:2;top:7px;left:50%;
  transform:translateX(-50%);
  display:flex;align-items:center;justify-content:center;
  box-sizing:border-box;width:24px;height:14px;
  min-width:24px;min-height:14px;
  margin:0;padding:0 3px;border:0;border-radius:7px;
  background:#fff;color:#745f51;
  box-shadow:0 1px 5px rgba(66,58,44,.13);
  font:700 9px/1 'Noto Sans KR',sans-serif;
  font-variant-numeric:tabular-nums;text-align:center;white-space:nowrap;
  pointer-events:none;
 }
 .product-card button.heart.wish-basket-stack .wish-inline-count.wish-many{
  font-size:8px;
 }
 /* HOT badge: overlay on product photo, keep original NEW and sale badges */
 .product-card .auto-badge.hot{
  background:#fff1dc;color:#b35d30;
  border:1px solid #f3cc9f;border-radius:6px;
  box-shadow:0 1px 4px rgba(90,58,26,.12);
  font-size:9px;font-weight:800;white-space:nowrap;
 }
 /* 당그니 PICK은 추천 배지만 표시하고 정렬 순서는 바꾸지 않습니다. */
 .product-card .auto-badge.dangni-pick,
 #modalBadges .auto-badge.dangni-pick{
  background:#ffe4ee;color:#a83e6b;
  border:1px solid #f5b9cf;border-radius:6px;
  box-shadow:0 1px 4px rgba(90,58,26,.10);
  font-size:9px;font-weight:800;white-space:nowrap;
 }
 /* 희귀한 옛 시즌 상품용 RELIC 배지: 정렬에는 영향을 주지 않습니다. */
 .product-card .auto-badge.old-item,
 #modalBadges .auto-badge.old-item{
  background:linear-gradient(135deg,#412637 0%,#301b2c 100%);
  color:#ffddb0;
  border:1px solid #bc936c;
  border-radius:6px;
  box-shadow:0 1px 5px rgba(55,26,41,.24);
  font-size:9px;font-weight:800;letter-spacing:.35px;white-space:nowrap;
 }
 /* 여러 배지가 중복되어도 상품 사진 왼쪽에 모두 세로로 표시합니다. */
 .product-card .badge-stack{
  display:flex;flex-direction:column;align-items:flex-start;
  flex-wrap:nowrap;gap:4px;max-width:calc(100% - 55px);
  width:max-content;z-index:3;pointer-events:none;
 }
 .product-card .badge-stack .auto-badge{
  display:inline-block;max-width:100%;width:max-content;
  box-sizing:border-box;white-space:nowrap;line-height:1.15;
 }
 /* 당그니 PICK은 사진 속 '거래 가능' 리본 바로 위, 왼쪽 아래에 단독 표시합니다. */
 .product-card .product-image{position:relative;}
 .product-card .product-image .photo-pick-row{
  position:absolute;left:8px;bottom:clamp(9px,calc(6% - 15px),23px);z-index:4;
  display:flex;align-items:center;justify-content:flex-start;
  gap:3px;flex-wrap:wrap;max-width:calc(100% - 12px);
  pointer-events:none;
 }
 .product-card .product-image .photo-pick-badge{
  display:inline-flex;align-items:center;justify-content:center;
  max-width:100%;
  padding:3.5px 8.5px;box-sizing:border-box;
  background:rgba(255,228,238,.97);color:#a83e6b;
  border:1px solid #f5b9cf;border-radius:6px;
  box-shadow:0 1px 5px rgba(90,58,26,.18);
  font-size:10px;font-weight:800;line-height:1.15;white-space:nowrap;
  pointer-events:none;
 }
 /* 러빗 PICK: 당그니 PICK과 같은 크기·폰트, 라벤더+보라색 테마 */
 .product-card .product-image .photo-pick-badge.rabbit-pick,
 #modalBadges .auto-badge.rabbit-pick{
  background:#eee3ff;color:#8052ad;border:1px solid #cdb6ee;
 }
 #modalBadges .auto-badge.rabbit-pick{
  border-radius:6px;box-shadow:0 1px 4px rgba(90,58,26,.10);
  font-size:9px;font-weight:800;white-space:nowrap;
 }
 .product-card .product-image .photo-pick-badge .pick-content{
  display:inline-flex;align-items:center;justify-content:center;gap:3px;
  margin:0 auto;white-space:nowrap;
  transform:translate(-1px,1px);
 }
 .product-card .product-image .photo-pick-badge .pick-heart{
  display:inline-flex;align-items:center;justify-content:center;
  flex:0 0 auto;line-height:1;
 }
 .product-card .product-image .photo-pick-badge .pick-text{
  display:inline-flex;align-items:center;justify-content:center;line-height:1.15;
 }
 /* 상세 화면에서는 모든 배지를 가로로 배치하고 좁으면 다음 줄로 넘깁니다. */
 #modalBadges .badge-stack{
  display:flex;flex-direction:row;align-items:center;flex-wrap:wrap;
  gap:5px;max-width:100%;width:auto;position:static;
 }
 #modalBadges .auto-badge{white-space:nowrap;}
 .product-card button.heart.wish-basket-stack .basket-emoji{
  position:absolute;z-index:1;left:50%;bottom:6px;
  transform:translateX(-50%);
  display:block;font-size:19px;line-height:24px;
  background:transparent;border:0;box-shadow:none;
  pointer-events:none;
 }
 `;
 document.head.appendChild(style);
})();


function saveFav(){localStorage.setItem("dangniFavs",JSON.stringify([...F]));$("#favoriteCount").textContent=F.size}
function toggle(id){F.has(id)?F.delete(id):F.add(id);saveFav();render();syncWishChange(id,F.has(id))}
function render(){let a=filtered(),pages=Math.max(1,Math.ceil(a.length/per));page=Math.min(page,pages);$("#resultCount").textContent=a.length.toLocaleString();let list=a.slice((page-1)*per,page*per);$("#emptyState").classList.toggle("hidden",!!list.length);$("#products").innerHTML=list.map(p=>`<article class="product-card" data-id="${esc(p.id)}">${badges(p,false)}<button aria-label="${F.has(p.id)?"바구니에서 빼기":"바구니에 담기"}" aria-pressed="${F.has(p.id)}" class="heart wish-basket-stack ${F.has(p.id)?"faved":""}" data-f="${esc(p.id)}">${wishCountHtml(p.id)}<span class="basket-emoji" aria-hidden="true">🧺</span></button><div class="product-image">${media(p)}${photoPickBadge(p)}</div><div class="product-info"><div class="status-group">${statusBadges(p)}</div><div class="product-name">${esc(p.name)}</div>${price(p)}<div class="tags">${displayTags(p).slice(0,3).map(t=>`<span class="tag">#${esc(t)}</span>`).join("")}</div></div></article>`).join("");
document.querySelectorAll("[data-f]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggle(b.dataset.f)});document.querySelectorAll(".product-card").forEach(c=>c.onclick=e=>{if(!e.target.closest("[data-f]")){const p=P.find(x=>String(x.id)===c.dataset.id);if(p&&searchKey($("#searchInput").value).length>=2)sendHotEvent("click",[{id:String(p.id),name:String(p.name||"")}],searchKey($("#searchInput").value));openDetail(c.dataset.id)}});
let available=document.querySelector(".products-area").clientWidth||Math.max(180,innerWidth-80);let count=Math.max(1,Math.min(10,Math.floor((available+4)/40)-4));let s=Math.max(1,page-Math.floor((count-1)/2)),e=Math.min(pages,s+count-1);s=Math.max(1,e-count+1);
const pb=(n,label,aria,disabled=false)=>`<button data-p="${n}" aria-label="${aria}" ${disabled?'disabled':''}>${label}</button>`;
$("#pagination").innerHTML=`<div class="page-summary">${page} / ${pages} 페이지 · 한 페이지에 ${per}개 작물</div><div class="page-buttons">`+pb(1,'&lt;','첫 페이지로 이동',page===1)+Array.from({length:e-s+1},(_,i)=>s+i).map(n=>`<button class="${n===page?"on":""}" data-p="${n}" aria-label="${n} 페이지" ${n===page?'aria-current="page"':''}>${n}</button>`).join("")+pb(pages,'&gt;','마지막 페이지로 이동',page===pages)+`</div><form class="page-jump" id="pageJump"><label for="pageNumber">페이지 바로 가기</label><input id="pageNumber" type="number" inputmode="numeric" min="1" max="${pages}" value="${page}" aria-label="이동할 페이지 번호" required><button type="submit">이동</button></form>`;
const go=n=>{page=Math.max(1,Math.min(pages,n));render();scrollTo({top:Math.max(0,document.querySelector(".shop-toolbar").offsetTop-24),behavior:"smooth"})};
document.querySelectorAll("#pagination [data-p]").forEach(b=>b.onclick=()=>go(+b.dataset.p));$("#pageJump").onsubmit=ev=>{ev.preventDefault();const n=Number($("#pageNumber").value);if(Number.isInteger(n)&&n>=1&&n<=pages)go(n)};}

function openDetail(id){let p=P.find(x=>x.id===id);if(!p)return;$("#modalImage").innerHTML=media(p);$("#modalName").textContent=p.name;$("#modalStatus").className="status-group";$("#modalStatus").innerHTML=statusBadges(p);$("#modalPrice").innerHTML=price(p);$("#modalTags").innerHTML=displayTags(p).map(t=>`<span class="tag">#${esc(t)}</span>`).join("");$("#modalId").textContent=p.id||"";$("#modalCategory").textContent=p.category||"";$("#modalDate").textContent=p.date||"";renderDetailContent(p);$("#modalBadges").innerHTML=badges(p);$("#modalContact").href=p.kakao||SETTINGS.kakaoUrl;let fav=()=>{$("#modalFavorite").textContent=F.has(id)?"🧺 바구니에서 빼기":"🧺 바구니에 담기"};fav();$("#modalFavorite").onclick=()=>{toggle(id);fav()};$("#productModal").classList.remove("hidden");document.body.style.overflow="hidden"}
// 바구니의 가격 표시는 상품 카드와 동일하게 할인 적용 후 가격을 사용합니다.
function basketPriceText(p){
 if(productStatuses(p).includes("unavailable"))return "-";
 if(p.price===null||p.price===undefined||String(p.price).trim()==="")return "가격문의";
 const amount=dr(p)?sale(p):Number(p.price);
 return Number.isFinite(amount)?money(amount):String(p.price);
}
function showFav(){let a=P.filter(p=>F.has(p.id));$("#favoriteList").innerHTML=a.length?a.map(p=>`<div class="favorite-row"><div class="thumb">${media(p)}</div><div><b>${esc(p.name)}</b><small>${esc(p.category)}</small><small class="basket-item-price">${esc(basketPriceText(p))}</small></div><button data-r="${esc(p.id)}" aria-label="바구니에서 빼기">×</button></div>`).join(""):`<div class="empty-state"><div>🧺</div></div>`;document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{toggle(b.dataset.r);showFav()});$("#favoritePanel").classList.remove("hidden");document.body.style.overflow="hidden"}
async function inquire(){
 const items=P.filter(p=>F.has(p.id)&&p.name),h=$("#copyHint");
 if(!items.length){h.textContent="바구니에 담긴 작물이 없어요 🌱";return}
 const t=items.map(p=>`${p.name} ${basketPriceText(p)}`).join("\n");
 try{await navigator.clipboard.writeText(t)}catch(e){
  const x=document.createElement("textarea");x.value=t;document.body.appendChild(x);x.select();
  const copied=document.execCommand("copy");x.remove();
  if(!copied){h.textContent="복사에 실패했어요. 다시 눌러주세요.";return}
 }
 h.textContent=`${items.length}개 작물명과 가격이 복사됐어요!`;
 setTimeout(()=>location.href=SETTINGS.kakaoUrl,350);
}
function clearBasket(){
 const h=$("#copyHint");
 if(!F.size){h.textContent="바구니가 이미 비어 있어요 🌱";return}
 if(!window.confirm(`바구니에 담긴 ${F.size}개 상품을 모두 비울까요?`))return;
 const ids=[...F];F.clear();saveFav();render();showFav();
 ids.forEach(id=>syncWishChange(id,false)); // 찜현황 시트의 공용 찜 수도 함께 갱신
 h.textContent="바구니를 모두 비웠어요 🧺";
}
function setupBasketActions(){
 const inquireButton=$("#basketInquiry");if(!inquireButton||$("#basketClear"))return;
 const row=document.createElement("div");row.className="basket-action-row";
 inquireButton.parentNode.insertBefore(row,inquireButton);row.appendChild(inquireButton);
 const clearButton=document.createElement("button");clearButton.type="button";
 clearButton.id="basketClear";clearButton.className="basket-clear";
 clearButton.textContent="🗑 모두 비우기";clearButton.onclick=clearBasket;row.appendChild(clearButton);
 const style=document.createElement("style");style.textContent=`
 .basket-action-row{display:flex;align-items:stretch;gap:8px;margin-top:20px}
 .basket-action-row .basket-inquiry{flex:1;min-width:0;margin-top:0;cursor:pointer}
 .basket-clear{flex:0 0 auto;padding:12px 11px;border:0;border-radius:8px;
  background:#ffead4;color:#9b4f3b;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}
 .basket-clear:hover{background:#ffe0bd}
 .basket-item-price{color:#9b4f3b!important;font-weight:700;margin-top:3px!important}
 @media(max-width:390px){.basket-action-row{gap:6px}.basket-clear{padding:10px 7px;font-size:12px}}
 `;document.head.appendChild(style);
}
setupBasketActions();
$("#sortFilter").onchange=()=>{page=1;render()};
$("#searchInput").oninput=()=>{page=1;render();scheduleHotSearch()};$("#clearSearch").onclick=()=>{clearTimeout(hotSearchTimer);$("#searchInput").value="";page=1;render()};$("#statusFilter").onchange=e=>{st=e.target.value;page=1;render()};$("#favoritesBtn").onclick=showFav;$("#basketInquiry").onclick=inquire;
document.querySelectorAll("[data-close-modal]").forEach(x=>x.onclick=()=>{$("#productModal").classList.add("hidden");document.body.style.overflow=""});document.querySelectorAll("[data-fav-close]").forEach(x=>x.onclick=()=>{$("#favoritePanel").classList.add("hidden");document.body.style.overflow=""});
let syncing=false;
function syncMessage(t){}
function applyProducts(a){
 P=a;SETTINGS.categories=[...new Set(P.map(p=>p.category).filter(Boolean))];
 if(!SETTINGS.categories.includes(cat))cat="전체";
 $("#categoryFilter").innerHTML=["전체",...SETTINGS.categories].map(c=>`<option value="${esc(c)}">${c==="전체"?"전체 카테고리":esc(c)}</option>`).join("");$("#categoryFilter").value=cat;
 render();if(!$("#favoritePanel").classList.contains("hidden"))showFav();
 if(!$("#productModal").classList.contains("hidden")){let id=$("#modalId").textContent;if(P.some(p=>p.id===id))openDetail(id);else{$("#productModal").classList.add("hidden");document.body.style.overflow=""}}
}
async function refreshSheet(){if(syncing)return;syncing=true;try{applyProducts(await fetchSheetProducts());syncMessage('🌱 작물 정보가 새로 반영됐어요')}catch(e){syncMessage('🌱 시트 연결이 잠시 지연되어 마지막 작물 정보를 보여드려요')}finally{syncing=false}}
async function startShop(){
 try{const r=await fetch('settings.json?'+Date.now());if(r.ok)SETTINGS={...SETTINGS,...await r.json()}}catch(e){}
 SETTINGS.statuses=[{value:'selling',label:'판매중'},{value:'soldout',label:'판매완료'},{value:'unavailable',label:'미판매'},{value:'set',label:'세트판매'}];
 $("#statusFilter").innerHTML='<option value="all">전체 상태</option>'+SETTINGS.statuses.filter(x=>x.value!=="unknown").map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('');
 $("#statusFilter").value=st;
 $("#categoryFilter").onchange=e=>{cat=e.target.value;page=1;render()};saveFav();setPer();
 try{const r=await fetch('products.json?'+Date.now());if(r.ok)applyProducts(await r.json())}catch(e){}
 await refreshSheet();setInterval(()=>{if(!document.hidden)refreshSheet()},180000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSheet()});
}
startShop();
startWishCounts().then(startHotTracking);

let rt;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{let old=per,first=(page-1)*per;setPer();if(old!==per)page=Math.floor(first/per)+1;render()},120)});

addEventListener("keydown",e=>{if(e.key==="Escape"){["#productModal","#favoritePanel"].forEach(s=>$(s).classList.add("hidden"));document.body.style.overflow=""}});

// 공지·이벤트 문구는 announcements.json에서 변경할 수 있습니다.
async function loadFarmNews(){try{const r=await fetch('announcements.json?'+Date.now());if(!r.ok)return;const data=await r.json();if(!Array.isArray(data.items))return;const items=data.items.filter(x=>x.enabled!==false&&typeof x.text==='string'&&x.text.trim());$("#farmAnnouncements").innerHTML=items.length?items.map(x=>`<div class="farm-news-row"><span class="news-tag ${x.type==='event'?'event':''}">${x.type==='event'?'이벤트':'공지'}</span><p>${esc(x.text)}</p></div>`).join(''):'<div class="farm-news-row"><p>곧 새로운 밭 소식을 전해드릴게요 🌱</p></div>'}catch(e){}}
loadFarmNews();
