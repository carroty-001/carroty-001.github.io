let P=[],cat="전체",st="all",page=1,per=18,SETTINGS={categories:[],statuses:[],kakaoUrl:"https://open.kakao.com/o/sFesMABh",newDays:3};
let F=new Set(JSON.parse(localStorage.getItem("dangniFavs")||"[]"));
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=n=>Number(n).toLocaleString("ko-KR",{maximumFractionDigits:10});
const crops=["🥕","🥔","🌽","🍠","🍅","🍆","🎃","🧅","🧄","🫛","🫑","🥬"];
function cols(){let w=innerWidth;return w<=600?2:w<=800?3:w<=1100?4:w<=1400?5:6}
function setPer(){per=cols()*(innerWidth<=600?8:6)}
function cropFor(p){let s=String(p.id||p.name||"작물"),h=0;for(let c of s)h=(h*31+c.charCodeAt(0))>>>0;return crops[h%crops.length]}
function statusText(s){let x=SETTINGS.statuses.find(x=>x.value===s);return x?x.label:({selling:"판매중",soldout:"판매완료",unavailable:"미판매"}[s]||s)}
function dr(p){let v=p.discount??p.discountRate??p.discount_rate??0;if(typeof v==="string")v=v.replace("%","");return Math.max(0,Math.min(100,Number(v)||0))}
function sale(p){return Number((Number(p.price||0)*(1-dr(p)/100)).toFixed(10))}
function price(p){if(p.price===null||p.price===undefined||p.price==="")return `<div class="product-price">가격문의</div>`;return dr(p)?`<div class="price-row"><span class="discount">${dr(p)}%</span><span class="old-price">${money(p.price)}</span><span class="sale-price">${money(sale(p))}</span></div>`:`<div class="product-price">${money(p.price)}</div>`}
function isNew(p){let raw=p.date||p.registeredAt||p.registered_at;if(!raw)return false;let d=new Date(String(raw).replace(/\./g,"-")+"T00:00:00");if(isNaN(d))return false;let n=new Date();n.setHours(0,0,0,0);let diff=Math.floor((n-d)/86400000);return diff>=0&&diff<3}
function badges(p){return `<div class="badge-stack">${isNew(p)?'<span class="auto-badge new">NEW</span>':''}${dr(p)?`<span class="auto-badge sale">${dr(p)}%</span>`:''}</div>`}
function media(p){let c=cropFor(p);return p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="crop-fallback" role="img" aria-label="작물 이모티콘" style="display:none">${c}</span>`:`<span class="crop-fallback" role="img" aria-label="작물 이모티콘">${c}</span>`}
function filtered(){let q=$("#searchInput").value.trim().toLowerCase();let result=P.filter(p=>(!q||(p.name+" "+(p.tags||[]).join(" ")).toLowerCase().includes(q))&&(cat==="전체"||p.category===cat)&&(st==="all"||p.status===st));let order=$("#sortFilter").value;return order==="default"?result.sort((a,b)=>a.name.localeCompare(b.name,"ko",{numeric:true})):result.sort((a,b)=>{if(a.price==null&&b.price==null)return 0;if(a.price==null)return 1;if(b.price==null)return -1;return order==="low"?sale(a)-sale(b):sale(b)-sale(a)})}
function saveFav(){localStorage.setItem("dangniFavs",JSON.stringify([...F]));$("#favoriteCount").textContent=F.size}
function toggle(id){F.has(id)?F.delete(id):F.add(id);saveFav();render()}
function render(){let a=filtered(),pages=Math.max(1,Math.ceil(a.length/per));page=Math.min(page,pages);$("#resultCount").textContent=a.length.toLocaleString();let list=a.slice((page-1)*per,page*per);$("#emptyState").classList.toggle("hidden",!!list.length);$("#products").innerHTML=list.map(p=>`<article class="product-card" data-id="${esc(p.id)}">${badges(p)}<button aria-label="바구니에 담기" aria-pressed="${F.has(p.id)}" class="heart ${F.has(p.id)?"faved":""}" data-f="${esc(p.id)}">${F.has(p.id)?"✓":"🛒"}</button><div class="product-image">${media(p)}</div><div class="product-info"><span class="status-badge ${p.status}">${statusText(p.status)}</span><div class="product-name">${esc(p.name)}</div>${price(p)}<div class="tags">${(p.tags||[]).slice(0,3).map(t=>`<span class="tag">#${esc(t)}</span>`).join("")}</div></div></article>`).join("");
document.querySelectorAll("[data-f]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggle(b.dataset.f)});document.querySelectorAll(".product-card").forEach(c=>c.onclick=e=>{if(!e.target.closest("[data-f]"))openDetail(c.dataset.id)});
let s=Math.max(1,page-4),e=Math.min(pages,s+9);s=Math.max(1,e-9);
const pb=(n,label,aria,disabled=false)=>`<button data-p="${n}" aria-label="${aria}" ${disabled?'disabled':''}>${label}</button>`;
$("#pagination").innerHTML=`<div class="page-summary">${page} / ${pages} 페이지 · 한 페이지에 ${per}개 작물</div><div class="page-buttons">`+pb(1,'«','첫 페이지',page===1)+pb(Math.max(1,page-1),'‹','이전 페이지',page===1)+Array.from({length:e-s+1},(_,i)=>s+i).map(n=>`<button class="${n===page?"on":""}" data-p="${n}" aria-label="${n} 페이지" ${n===page?'aria-current="page"':''}>${n}</button>`).join("")+pb(Math.min(pages,page+1),'›','다음 페이지',page===pages)+pb(pages,'»','마지막 페이지',page===pages)+`</div><form class="page-jump" id="pageJump"><label for="pageNumber">페이지 바로 가기</label><input id="pageNumber" type="number" inputmode="numeric" min="1" max="${pages}" value="${page}" aria-label="이동할 페이지 번호" required><button type="submit">이동</button></form>`;
const go=n=>{page=Math.max(1,Math.min(pages,n));render();scrollTo({top:Math.max(0,document.querySelector(".shop-toolbar").offsetTop-24),behavior:"smooth"})};
document.querySelectorAll("#pagination [data-p]").forEach(b=>b.onclick=()=>go(+b.dataset.p));$("#pageJump").onsubmit=ev=>{ev.preventDefault();const n=Number($("#pageNumber").value);if(Number.isInteger(n)&&n>=1&&n<=pages)go(n)};}

function openDetail(id){let p=P.find(x=>x.id===id);if(!p)return;$("#modalImage").innerHTML=media(p);$("#modalName").textContent=p.name;$("#modalStatus").className="status-badge "+p.status;$("#modalStatus").textContent=statusText(p.status);$("#modalPrice").innerHTML=price(p);$("#modalTags").innerHTML=(p.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join("");$("#modalId").textContent=p.id||"";$("#modalCategory").textContent=p.category||"";$("#modalDate").textContent=p.date||"";$("#modalDescription").textContent=p.description||"";$("#modalBadges").innerHTML=badges(p);$("#modalContact").href=p.kakao||SETTINGS.kakaoUrl;let fav=()=>{$("#modalFavorite").textContent=F.has(id)?"✓ 바구니에서 빼기":"🛒 바구니에 담기"};fav();$("#modalFavorite").onclick=()=>{toggle(id);fav()};$("#productModal").classList.remove("hidden");document.body.style.overflow="hidden"}
function showFav(){let a=P.filter(p=>F.has(p.id));$("#favoriteList").innerHTML=a.length?a.map(p=>`<div class="favorite-row"><div class="thumb">${media(p)}</div><div><b>${esc(p.name)}</b><small>${esc(p.category)}</small></div><button data-r="${esc(p.id)}" aria-label="바구니에서 빼기">×</button></div>`).join(""):`<div class="empty-state"><div>🧺</div></div>`;document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{toggle(b.dataset.r);showFav()});$("#favoritePanel").classList.remove("hidden");document.body.style.overflow="hidden"}
async function inquire(){let names=P.filter(p=>F.has(p.id)).map(p=>p.name).filter(Boolean),h=$("#copyHint");if(!names.length){h.textContent="바구니에 담긴 작물이 없어요 🌱";return}let t=names.join("\n");try{await navigator.clipboard.writeText(t)}catch(e){let x=document.createElement("textarea");x.value=t;document.body.appendChild(x);x.select();document.execCommand("copy");x.remove()}h.textContent=`${names.length}개 작물명이 복사됐어요!`;setTimeout(()=>location.href=SETTINGS.kakaoUrl,350)}
$("#sortFilter").onchange=()=>{page=1;render()};
$("#searchInput").oninput=()=>{page=1;render()};$("#clearSearch").onclick=()=>{$("#searchInput").value="";page=1;render()};$("#statusFilter").onchange=e=>{st=e.target.value;page=1;render()};$("#favoritesBtn").onclick=showFav;$("#basketInquiry").onclick=inquire;
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
 $("#statusFilter").innerHTML='<option value="all">전체 상태</option>'+SETTINGS.statuses.filter(x=>x.value!=="unknown").map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('');
 $("#categoryFilter").onchange=e=>{cat=e.target.value;page=1;render()};saveFav();setPer();
 try{const r=await fetch('products.json?'+Date.now());if(r.ok)applyProducts(await r.json())}catch(e){}
 await refreshSheet();setInterval(()=>{if(!document.hidden)refreshSheet()},180000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSheet()});
}
startShop();

let rt;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{let old=per,first=(page-1)*per;setPer();if(old!==per){page=Math.floor(first/per)+1;render()}},120)});

addEventListener("keydown",e=>{if(e.key==="Escape"){["#productModal","#favoritePanel"].forEach(s=>$(s).classList.add("hidden"));document.body.style.overflow=""}});
