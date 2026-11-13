let P=[],cat="전체",st="all",page=1,per=10;let F=new Set(JSON.parse(localStorage.getItem("dangniFavs")||"[]"));const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));const money=n=>Number(n||0).toLocaleString("ko-KR")+"원";function statusText(s){return s==="reserved"?"예약중":s==="soldout"?"판매완료":"판매중"}function img(p){return p.image?`<img src="${esc(p.image)}" loading="lazy" onerror="this.outerHTML='🥕'">`:"🥕"}function updateFav(){localStorage.setItem("dangniFavs",JSON.stringify([...F]));$("#favCount").textContent=F.size}function toggle(id){F.has(id)?F.delete(id):F.add(id);updateFav();render()}function filtered(){let q=$("#q").value.trim().toLowerCase();return P.filter(p=>(!q||(p.name+" "+(p.tags||[]).join(" ")).toLowerCase().includes(q))&&(cat==="전체"||p.category===cat)&&(st==="all"||p.status===st))}function render(){let a=filtered(),pages=Math.max(1,Math.ceil(a.length/per));page=Math.min(page,pages);$("#total").textContent=a.length.toLocaleString();let list=a.slice((page-1)*per,page*per);$("#empty").hidden=!!list.length;$("#grid").innerHTML=list.map(p=>`<article class="card" data-id="${esc(p.id)}">${p.badge?`<span class="badge ${String(p.badge).toLowerCase()==="new"?"new":""}">${esc(p.badge)}</span>`:""}<button class="heart ${F.has(p.id)?"on":""}" data-f="${esc(p.id)}">${F.has(p.id)?"♥":"♡"}</button><div class="photo">${img(p)}</div><div class="card-info"><h3>${esc(p.name)}</h3><span class="category">${esc(p.category)}</span><div class="meta"><span class="price">${money(p.price)}</span><span class="status ${p.status}">${statusText(p.status)}</span></div></div></article>`).join("");document.querySelectorAll(".heart").forEach(b=>b.onclick=e=>{e.stopPropagation();toggle(b.dataset.f)});document.querySelectorAll(".card").forEach(c=>c.onclick=e=>{if(!e.target.closest(".heart"))openDetail(c.dataset.id)});let start=Math.max(1,page-2),end=Math.min(pages,start+4);start=Math.max(1,end-4);$("#pages").innerHTML=(page>1?`<button data-p="${page-1}">‹</button>`:"")+Array.from({length:end-start+1},(_,i)=>start+i).map(n=>`<button class="${n===page?"on":""}" data-p="${n}">${n}</button>`).join("")+(page<pages?`<button data-p="${page+1}">›</button>`:"");document.querySelectorAll("#pages button").forEach(b=>b.onclick=()=>{page=+b.dataset.p;render();scrollTo({top:0,behavior:"smooth"})})}function openDetail(id){let p=P.find(x=>x.id===id);if(!p)return;$("#detailName").textContent=p.name;$("#detailCat").textContent=p.category;$("#detailStatus").innerHTML=`<span class="status ${p.status}">${statusText(p.status)}</span>`;$("#detailPrice").textContent="🥕 "+money(p.price);$("#detailBadge").innerHTML=p.badge?`<span class="badge ${String(p.badge).toLowerCase()==="new"?"new":""}">${esc(p.badge)}</span>`:"";let imgs=[p.image,...(p.images||[])].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);$("#detailImg").src=imgs[0]||"";$("#thumbs").innerHTML=imgs.map((x,i)=>`<button class="${i?"":"on"}" data-img="${esc(x)}"><img src="${esc(x)}"></button>`).join("");document.querySelectorAll("#thumbs button").forEach(t=>t.onclick=()=>{$("#detailImg").src=t.dataset.img;document.querySelectorAll("#thumbs button").forEach(x=>x.classList.remove("on"));t.classList.add("on")});let refresh=()=>{$("#detailHeart").textContent=F.has(id)?"♥":"♡";$("#detailHeart").classList.toggle("on",F.has(id));$("#detailFav").textContent=F.has(id)?"♥ 찜 해제":"♡ 찜하기"};refresh();$("#detailHeart").onclick=$("#detailFav").onclick=()=>{toggle(id);refresh()};let url=(p.kakao||window.KAKAO_URL||"").trim();$("#kakao").href=url||"#";$("#kakao").onclick=e=>{if(!url){e.preventDefault();alert("script.js의 KAKAO_URL에 카카오톡 문의 링크를 넣어주세요.")}};$("#detail").hidden=false;document.body.style.overflow="hidden"}function showFavs(){let a=P.filter(p=>F.has(p.id));$("#favList").innerHTML=a.length?a.map(p=>`<div class="fav-row" data-id="${esc(p.id)}"><div>${p.image?`<img src="${esc(p.image)}">`:"🥕"}</div><div><b>${esc(p.name)}</b><small>${esc(p.category)}</small><strong>🥕 ${money(p.price)}</strong></div><button data-r="${esc(p.id)}">♥</button></div>`).join(""):`<div class="empty"><div>♡</div><b>아직 찜한 씨앗이 없어요!</b></div>`;document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{toggle(b.dataset.r);showFavs()});document.querySelectorAll(".fav-row").forEach(r=>r.onclick=e=>{if(!e.target.closest("button"))openDetail(r.dataset.id)});$("#favPanel").hidden=false;document.body.style.overflow="hidden"}$("#q").oninput=()=>{page=1;render()};$("#category").onchange=e=>{cat=e.target.value;page=1;render()};$("#status").onchange=e=>{st=e.target.value;page=1;render()};$("#favTop").onclick=showFavs;document.querySelectorAll("[data-close]").forEach(x=>x.onclick=()=>{$("#detail").hidden=true;document.body.style.overflow=""});document.querySelectorAll("[data-fav-close]").forEach(x=>x.onclick=()=>{$("#favPanel").hidden=true;document.body.style.overflow=""});window.KAKAO_URL="https://open.kakao.com/o/sFesMABh";
const SHEET_ID="1k-RcpGW7y9GeGgmAuym2olddsfyR6WMXj1XtJympgGM";
const SHEET_GID="442445190";
function parseCSV(csv){
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<csv.length;i++){
    const c=csv[i];
    if(c==='"'){if(quoted&&csv[i+1]==='"'){field+='"';i++}else quoted=!quoted}
    else if(c===','&&!quoted){row.push(field);field=""}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(field);field="";if(row.some(v=>v.trim()))rows.push(row);row=[]}
    else field+=c;
  }
  row.push(field);if(row.some(v=>v.trim()))rows.push(row);
  return rows;
}
function sheetProducts(csv){
  const rows=parseCSV(csv.replace(/^\uFEFF/,""));
  const keys=(rows.shift()||[]).map(x=>x.trim().replace(/\s+/g,"").toLowerCase());
  const pick=(r,...names)=>{for(const n of names){let i=keys.indexOf(n.replace(/\s+/g,"").toLowerCase());if(i>=0&&r[i]!==undefined&&String(r[i]).trim()!=="")return String(r[i]).trim()}return ""};
  if(!keys.some(x=>["상품명","이름","name","품명"].includes(x)))throw Error("시트에 상품명 열이 없습니다");
  const pathFor=n=>{n=String(n||"").trim().replace(/\.png$/i,"");if(!n)return "";if(/^https?:\/\//i.test(n))return n;if(n.includes("/"))return n;const id=Number(n.split("_")[0]);const dir=id<=500?"1-500":id<=1000?"501-1000":"1001-1500";return `images/${dir}/${n}.png`};
  return rows.map((r,i)=>{
    const id=pick(r,"상품번호","번호","id","상품ID")||String(i+1);
    const name=pick(r,"상품명","이름","name","품명");
    const state=pick(r,"판매상태","상태","status").toLowerCase();
    const extra=pick(r,"추가이미지","상세이미지","images").split(/[|,\n]/).map(pathFor).filter(Boolean);
    return {
      id,name,category:pick(r,"카테고리","분류","category")||"기타",
      price:Number(pick(r,"가격","판매가","price").replace(/[^\d.-]/g,""))||0,
      status:/예약|reserved/.test(state)?"reserved":/완료|품절|soldout|sold/.test(state)?"soldout":"selling",
      image:pathFor(pick(r,"대표이미지","이미지","이미지번호","사진","image")||id),
      images:extra,badge:pick(r,"뱃지","배지","badge"),
      tags:pick(r,"태그","tags").split(/[,|]/).map(x=>x.trim()).filter(Boolean),
      kakao:pick(r,"문의링크","카카오링크","kakao")
    };
  }).filter(p=>p.name);
}
async function loadProducts(){
  const csvURL=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}&t=${Date.now()}`;
  try{
    const res=await fetch(csvURL,{cache:"no-store"});
    if(!res.ok)throw Error(`시트 HTTP ${res.status}`);
    const csv=await res.text();
    if(/^\s*</.test(csv))throw Error("시트가 비공개이거나 CSV가 아닙니다");
    const items=sheetProducts(csv);
    if(!items.length)throw Error("시트에 상품이 없습니다");
    return items;
  }catch(err){
    console.warn("구글 시트 로드 실패, 기존 products.json 사용:",err);
    const res=await fetch("products.json?"+Date.now());
    if(!res.ok)throw Error("구글 시트와 products.json 모두 불러올 수 없습니다");
    return res.json();
  }
}
loadProducts().then(a=>{P=a.map(p=>({...p,images:Array.isArray(p.images)?p.images:[],tags:Array.isArray(p.tags)?p.tags:[]}));let cats=["전체",...new Set(P.map(p=>p.category).filter(Boolean))];$("#category").innerHTML=cats.map(c=>`<option value="${esc(c)}">${c==="전체"?"카테고리 전체":esc(c)}</option>`).join("");updateFav();render()}).catch(err=>{console.error(err);$("#empty").hidden=false;$("#empty").innerHTML="<div>🥕</div><b>상품 데이터를 불러오지 못했어요.</b>";});