function parseStatuses(value){const map={'판매중':'selling','판매완료':'soldout','미판매':'unavailable','세트판매':'set','selling':'selling','soldout':'soldout','unavailable':'unavailable','set':'set'};const a=Array.isArray(value)?value:String(value??'').split(/[,，、|;\n]+/);const result=[...new Set(a.map(v=>map[String(v).trim()]).filter(Boolean))];return result.length?result:['unknown']}
// 상품 공개 열 A:L만 조회합니다. 재고메모(M열)는 요청하지 않습니다.
function sheetProducts(table){
 const labels=table.cols.map(c=>String(c.label||'').trim());
 for(const k of ['상품번호','상품명','카테고리','가격','판매상태','대표이미지'])if(!labels.includes(k))throw Error('상품 열을 확인해주세요');
 const ids=new Set(),get=(r,k)=>{const c=r.c[labels.indexOf(k)];return c?.v??''},parts=v=>String(v||'').split('|').map(s=>s.trim()).filter(Boolean);
 function num(v,empty){if(v===''||v==null)return empty;const n=Number(String(v).replace(/,/g,''));if(!Number.isFinite(n)||n<0)throw Error('숫자 입력 오류');return n}
 function image(v){let s=String(v??'').trim();if(!s)return '';if(/^https:\/\//i.test(s))return s;s=s.replace(/^images\//,'');if(/^\d+$/.test(s))s+='.png';if(!/^[\w.-]+\.(png|jpe?g|webp|gif)$/i.test(s))throw Error('사진 경로 오류');return s}
 return table.rows.filter(r=>String(get(r,'상품명')).trim()).map(r=>{
 const id='X'+String(get(r,'상품번호')).trim();if(id==='X'||ids.has(id))throw Error('상품번호 누락 또는 중복');ids.add(id);
 const date=get(r,'등록일'),m=String(date).match(/^Date\((\d+),(\d+),(\d+)\)$/);
 return {id,name:String(get(r,'상품명')).trim(),category:String(get(r,'카테고리')).trim(),price:num(get(r,'가격'),null),discount:Math.min(100,num(get(r,'할인율(%)'),0)),status:parseStatuses(get(r,'판매상태'))[0],statuses:parseStatuses(get(r,'판매상태')),image:image(get(r,'대표이미지')),images:parts(get(r,'추가이미지')).map(image),tags:parts(get(r,'태그')),description:String(get(r,'상품설명')),date:m?`${m[1]}-${String(+m[2]+1).padStart(2,'0')}-${m[3].padStart(2,'0')}`:String(date),kakao:''};
 });
}
let sheetRequest=0;
function fetchSheetProducts(){return new Promise((resolve,reject)=>{
 const callback='dangniSheetResponse'+(++sheetRequest),script=document.createElement('script');let timer;
 const clean=()=>{clearTimeout(timer);script.remove();delete window[callback]};
 window[callback]=data=>{try{if(data.status!=='ok'||!data.table)throw Error('시트 읽기 실패');const p=sheetProducts(data.table);clean();resolve(p)}catch(e){clean();reject(e)}};
 script.onerror=()=>{clean();reject(Error('시트 연결 실패'))};timer=setTimeout(()=>{clean();reject(Error('시트 응답 지연'))},20000);
 const q=new URLSearchParams({gid:'442445190',headers:'1',tqx:'out:json;responseHandler:'+callback,tq:'select A,B,C,D,E,F,G,H,I,J,K,L',_t:String(Date.now())});
 script.src='https://docs.google.com/spreadsheets/d/1jlgGsTFCeBiffAe7UDdMJFTKizMLA6ex/gviz/tq?'+q;
 document.head.appendChild(script);
})}
