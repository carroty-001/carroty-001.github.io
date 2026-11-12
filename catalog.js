/* 캐릭터 상품과 분리된 가구 시리즈 카탈로그. 가격 미입력은 가격 문의로 유지합니다. */
const FurnitureData = (() => {
  const numeric = (v, fallback = null) => {
    if (v === '' || v == null) return fallback;
    const n = Number(v); if (!Number.isFinite(n) || n < 0) throw Error('가격 또는 수량을 확인해주세요.');
    return n;
  };
  const src = value => {
    let s = String(value ?? '').trim();
    if (!s) return '';
    if (/^https:\/\//i.test(s)) return s;
    if (/^[\w/-]+$/.test(s)) s += '.png';
    return /^[\w./-]+\.(png|jpe?g|webp|gif)$/i.test(s) && s.split('/').every(x => x && x !== '.' && x !== '..') ? s : '';
  };
  function normalize(raw) {
    if (!Array.isArray(raw.series) || !Array.isArray(raw.items)) throw Error('가구 목록 형식을 확인해주세요.');
    const seriesMap = new Map(), itemMap = new Map(), bySeries = new Map();
    const prices = {};
    for (let g = 1; g <= 5; g++) prices[g] = numeric(raw.gradePrices?.[g]);
    const series = raw.series.map(s => {
      const id = String(s.id ?? '').trim(), name = String(s.name ?? '').trim();
      if (!/^F\d+$/.test(id) || !name || seriesMap.has(id)) throw Error('시리즈번호나 시리즈명을 확인해주세요.');
      const row = {id, name, image: src(s.image), totalCount: numeric(s.totalCount), description: String(s.description ?? '')};
      seriesMap.set(id, row); bySeries.set(id, []); return row;
    });
    const items = raw.items.map(i => {
      const id = String(i.id ?? '').trim(), seriesId = String(i.seriesId ?? '').trim();
      if (!/^F\d+_\d+$/.test(id) || itemMap.has(id) || !seriesMap.has(seriesId) || !id.startsWith(seriesId + '_')) throw Error('가구번호 또는 시리즈번호를 확인해주세요.');
      const grade = Number(String(i.grade ?? '').replace(/[★성\s]/g, ''));
      if (!Number.isInteger(grade) || grade < 1 || grade > 5) throw Error('가구 등급은 1~5로 입력해주세요.');
      const stock = numeric(i.stock, 0); if (!Number.isInteger(stock)) throw Error('재고는 정수로 입력해주세요.');
      const row = {id, seriesId, image: src(i.image), grade, price: numeric(i.price), stock,
        status: ({'판매중':'selling','판매완료':'soldout','미판매':'unavailable'})[i.status] || (['selling','soldout','unavailable'].includes(i.status) ? i.status : 'selling'), description: String(i.description ?? '')};
      itemMap.set(id, row); bySeries.get(seriesId).push(row); return row;
    });
    return {series, items, prices, seriesMap, itemMap, bySeries};
  }
  const available = i => i.stock > 0 && i.status === 'selling';
  const price = (model, item) => item.price ?? model.prices[item.grade] ?? null;
  function select(model, seriesId, {owned = true, grade = '', query = '', sort = 'default'} = {}) {
    const q = query.trim().toLowerCase();
    const rows = (model.bySeries.get(seriesId) || []).filter(i => (!owned || available(i)) && (!grade || i.grade === Number(grade)) && (!q || (i.id + ' ' + model.seriesMap.get(i.seriesId).name).toLowerCase().includes(q)));
    return rows.sort((a, b) => {
      if (sort === 'default') return a.id.localeCompare(b.id, 'ko', {numeric: true});
      const pa = price(model, a), pb = price(model, b);
      if (pa == null || pb == null) return pa == null ? (pb == null ? 0 : 1) : -1;
      return sort === 'low' ? pa - pb : pb - pa;
    });
  }
  function fromTables(seriesTable, itemsTable, pricesTable) {
    const rows = (t, required) => {
      const labels = t.cols.map(c => String(c.label || '').trim());
      if (required.some(k => !labels.includes(k))) throw Error('가구 시트의 열 제목을 확인해주세요.');
      return t.rows.map(r => Object.fromEntries(labels.map((k, n) => [k, r.c[n]?.v ?? ''])));
    };
    const series = rows(seriesTable, ['시리즈번호','시리즈명','대표이미지','전체종수']).filter(r => String(r['시리즈번호']).trim()).map(r => ({id:r['시리즈번호'],name:r['시리즈명'],image:r['대표이미지'],totalCount:r['전체종수'],description:r['소개']}));
    const items = rows(itemsTable, ['가구번호','시리즈번호','이미지','등급','개별가격','재고','판매상태']).filter(r => String(r['가구번호']).trim()).map(r => ({id:r['가구번호'],seriesId:r['시리즈번호'],image:r['이미지'],grade:r['등급'],price:r['개별가격'],stock:r['재고'],status:r['판매상태'],description:r['설명']}));
    const gradePrices = {};
    rows(pricesTable, ['등급','기본가격']).forEach(r => { const g = Number(r['등급']); if (g >= 1 && g <= 5) gradePrices[g] = r['기본가격']; });
    return {version:1, series, items, gradePrices};
  }
  return {normalize, available, price, select, fromTables};
})();

(() => {
  const $f = s => document.querySelector(s);
  const SETTINGS={kakaoUrl:'https://open.kakao.com/o/sFesMABh'};
  let selected=[];try{selected=JSON.parse(localStorage.getItem('dangniFurnitureFavs')||'[]')}catch(e){}
  const F=new Set(Array.isArray(selected)?selected:[]);
  function updateBasketCount(){$f('#furnitureBasketCount').textContent=F.size;}
  function toggle(id){F.has(id)?F.delete(id):F.add(id);try{localStorage.setItem('dangniFurnitureFavs',JSON.stringify([...F]))}catch(e){}updateBasketCount();render();}
  function showFav(){
    const rows=basketProducts().filter(i=>F.has(i.id));
    $f('#favoriteList').innerHTML=rows.length?rows.map(i=>`<div class="favorite-row"><div class="thumb">${image(i.image,i.name)}</div><div><b>${escape(i.name)}</b><small>${escape(i.category)} · 보유 ${i.stock}개</small></div><button data-remove="${escape(i.id)}" aria-label="바구니에서 빼기">×</button></div>`).join(''):'<p class="furniture-empty">🧺 바구니가 비어 있어요.</p>';
    document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{toggle(b.dataset.remove);showFav()});
    $f('#copyHint').textContent='';$f('#favoritePanel').classList.remove('hidden');document.body.style.overflow='hidden';
  }
  async function inquire(){
    const rows=basketProducts().filter(i=>F.has(i.id));if(!rows.length){$f('#copyHint').textContent='바구니가 비어 있어요.';return}
    const names=rows.map(i=>i.name).join('\n');
    try{await navigator.clipboard.writeText(names)}catch(e){const area=document.createElement('textarea');area.value=names;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove()}
    $f('#copyHint').textContent=rows.length+'개 가구번호를 복사했어요.';
    setTimeout(()=>{const target=window.parent===window?window:window.parent;target.location.href=SETTINGS.kakaoUrl},350);
  }
  function renderDetailContent(p){const text=$f('#modalDescription');text.textContent=p.description||'';$f('#modalDetailSection').classList.toggle('hidden',!String(p.description||'').trim());}

  const escape = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  let model, loading, config, timer;
  const state = {tab:'furniture', seriesId:'', seriesQuery:'', query:'', owned:true, grade:'', sort:'default', page:1, seriesPage:1};
  const amount = n => n == null ? '가격 문의' : Number(n).toLocaleString('ko-KR', {maximumFractionDigits:10});
  const position = i => i.id.split('_').pop().padStart(2,'0');
  const displayName = i => `${model.seriesMap.get(i.seriesId).name} · 가구 ${position(i)} (${i.id})`;
  const image = (url, label) => url ? `<img src="${escape(url)}" alt="${escape(label)}" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="furniture-photo-fallback" hidden>🪑<small>사진 준비중</small></span>` : '<span class="furniture-photo-fallback">🪑<small>사진 준비중</small></span>';
  const pageButtons = (count, current) => {
    const start = Math.max(1, Math.min(current - 1, count - 3));
    const numbers = Array.from({length:Math.min(4,count)}, (_, n) => n + start);
    return `<nav class="furniture-pages" aria-label="가구 페이지"><button data-page="${current-1}" ${current===1?'disabled':''} aria-label="이전 페이지">‹</button>${numbers.map(n=>`<button data-page="${n}" ${n===current?'aria-current="page"':''}>${n}</button>`).join('')}<button data-page="${current+1}" ${current===count?'disabled':''} aria-label="다음 페이지">›</button><span>${current} / ${count}</span></nav>`;
  };
  function render() {
    if (state.tab !== 'furniture' || !model) return;
    const root = $f('#furnitureContent');
    if (!state.seriesId) {
      const rows = model.series.filter(s => (s.name + ' ' + s.id).toLowerCase().includes(state.seriesQuery.trim().toLowerCase()));
      const pages = Math.max(1, Math.ceil(rows.length / 24)); state.seriesPage = Math.min(state.seriesPage, pages);
      root.innerHTML = `<div class="furniture-heading"><div><p class="furniture-eyebrow">우리 집을 채우는 작은 가구들</p><h2>가구 시리즈</h2></div><span>${rows.length}개 시리즈</span></div><div class="furniture-search"><span aria-hidden="true">🔎</span><input id="seriesSearch" type="search" aria-label="가구 시리즈 검색" placeholder="시리즈 이름으로 찾아보세요" value="${escape(state.seriesQuery)}"></div><div class="furniture-series-grid">${rows.slice((state.seriesPage-1)*24,state.seriesPage*24).map(s => {
        const items = model.bySeries.get(s.id), owned = items.filter(FurnitureData.available).length;
        return `<button class="furniture-series-card" data-series="${escape(s.id)}"><div class="furniture-series-photo">${image(s.image,s.name)}</div><div class="furniture-series-info"><span class="furniture-series-label">${escape(s.id)}</span><h3>${escape(s.name)}</h3><p>보유 ${owned}종 · 등록 ${items.length}종${s.totalCount != null?' / 도감 '+s.totalCount+'종':''}</p><span class="furniture-open">가구 둘러보기 <span aria-hidden="true">↗</span></span></div></button>`;
      }).join('')}</div>${!rows.length?'<p class="furniture-empty">찾는 시리즈가 없어요.</p>':''}${pageButtons(pages,state.seriesPage)}`;
      root.querySelectorAll('[data-series]').forEach(b => b.onclick = () => {state.seriesId=b.dataset.series;state.page=1;state.query='';render();});
      bindSearch('#seriesSearch','seriesQuery');
    } else {
      const s = model.seriesMap.get(state.seriesId);
      if (!s) {state.seriesId='';render();return;}
      const all = model.bySeries.get(s.id), owned = all.filter(FurnitureData.available).length;
      const rows = FurnitureData.select(model,s.id,state), pages = Math.max(1,Math.ceil(rows.length/30)); state.page=Math.min(state.page,pages);
      root.innerHTML = `<button class="furniture-back" id="seriesBack">‹ 모든 시리즈</button><div class="furniture-series-banner"><div class="furniture-banner-photo">${image(s.image,s.name)}</div><div><span class="furniture-eyebrow">${escape(s.id)} COLLECTION</span><h2>${escape(s.name)}</h2><p>보유 ${owned}종 · 등록 ${all.length}종${s.totalCount != null?' / 도감 '+s.totalCount+'종':''}</p>${s.description?'<p>'+escape(s.description)+'</p>':''}</div></div><div class="furniture-controls"><div class="furniture-stock-tabs" role="group" aria-label="보유 필터"><button data-owned="yes" aria-pressed="${state.owned}">보유 가구</button><button data-owned="no" aria-pressed="${!state.owned}">전체 가구</button></div><div class="furniture-selects"><label>등급<select id="furnitureGrade"><option value="">전체 등급</option>${[5,4,3,2,1].map(g=>`<option value="${g}" ${String(g)===state.grade?'selected':''}>${'★'.repeat(g)}</option>`).join('')}</select></label><label>정렬<select id="furnitureSort"><option value="default">기본 정렬</option><option value="low" ${state.sort==='low'?'selected':''}>가격 낮은 순</option><option value="high" ${state.sort==='high'?'selected':''}>가격 높은 순</option></select></label></div></div><div class="furniture-search"><span aria-hidden="true">🔎</span><input id="furnitureItemSearch" type="search" aria-label="가구번호 검색" placeholder="가구번호로 찾아보세요" value="${escape(state.query)}"></div><p class="furniture-result">${rows.length}개의 가구</p><div class="furniture-items-grid">${rows.slice((state.page-1)*30,state.page*30).map(i => `<article class="furniture-item"><button class="furniture-item-picture" data-detail="${escape(i.id)}" aria-label="${escape(displayName(i))} 상세보기">${image(i.image,displayName(i))}</button><div class="furniture-item-info"><span class="furniture-grade" aria-label="${i.grade}성">${'★'.repeat(i.grade)}</span><span class="furniture-item-code">${escape(i.id)}</span><div class="furniture-item-price">${amount(FurnitureData.price(model,i))}</div><p class="furniture-stock ${FurnitureData.available(i)?'':'unavailable'}">${i.stock===0?'품절':(i.status==='selling'?'보유 '+i.stock+'개':'미판매 · 보유 '+i.stock+'개')}</p><button class="furniture-add ${F.has(i.id)?'selected':''}" data-basket="${escape(i.id)}" aria-pressed="${F.has(i.id)}" ${!FurnitureData.available(i)&&!F.has(i.id)?'disabled':''}>🧺 ${F.has(i.id)?'바구니에서 빼기':'바구니에 담기'}</button></div></article>`).join('')}</div>${!rows.length?'<p class="furniture-empty">조건에 맞는 가구가 없어요. 전체 가구나 다른 등급을 선택해보세요.</p>':''}${pageButtons(pages,state.page)}`;
      $f('#seriesBack').onclick=()=>{state.seriesId='';render();};
      root.querySelectorAll('[data-owned]').forEach(b=>b.onclick=()=>{state.owned=b.dataset.owned==='yes';state.page=1;render();});
      $f('#furnitureGrade').onchange=e=>{state.grade=e.target.value;state.page=1;render();};
      $f('#furnitureSort').onchange=e=>{state.sort=e.target.value;state.page=1;render();};
      root.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openItem(b.dataset.detail));
      root.querySelectorAll('[data-basket]').forEach(b=>b.onclick=()=>toggle(b.dataset.basket));
      bindSearch('#furnitureItemSearch','query');
    }
    root.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{if(state.seriesId)state.page=+b.dataset.page;else state.seriesPage=+b.dataset.page;render();$f('#furnitureShop').scrollIntoView({behavior:'smooth',block:'start'});});
  }
  function bindSearch(selector,key) {
    const input=$f(selector);
    input.oninput=()=>{state[key]=input.value;clearTimeout(timer);timer=setTimeout(()=>{state.page=state.seriesPage=1;render();const next=$f(selector);next.focus();},180);};
  }
  function openItem(id) {
    const i=model?.itemMap.get(id); if(!i)return;
    const s=model.seriesMap.get(i.seriesId);
    $f('#modalImage').innerHTML=image(i.image,displayName(i));
    $f('#modalName').textContent=s.name+' · 가구 '+position(i);
    $f('#modalStatus').className='status-badge '+(FurnitureData.available(i)?'selling':'soldout');
    $f('#modalStatus').textContent=FurnitureData.available(i)?'판매중':(i.stock===0?'품절':'미판매');
    $f('#modalPrice').innerHTML=`<div class="product-price">${amount(FurnitureData.price(model,i))}</div>`;
    $f('#modalTags').textContent='★'.repeat(i.grade)+' · 보유 '+i.stock+'개';
    $f('#modalId').textContent=i.id;$f('#modalCategory').textContent='가구 / '+s.name;$f('#modalDate').textContent='—';
    $f('#modalBadges').innerHTML='';$f('#modalContact').href=SETTINGS.kakaoUrl;
    renderDetailContent({image:i.image,images:[],description:i.description});
    const updateButton=()=>{$f('#modalFavorite').textContent=F.has(id)?'🧺 바구니에서 빼기':'🧺 바구니에 담기';$f('#modalFavorite').disabled=!FurnitureData.available(i)&&!F.has(id);};
    updateButton();$f('#modalFavorite').onclick=()=>{toggle(id);updateButton();};
    $f('#productModal').classList.remove('hidden');document.body.style.overflow='';document.body.style.overflow='hidden';
  }
  const basketProducts = () => model ? model.items.map(i=>({id:i.id,name:displayName(i),image:i.image,category:'가구 · '+model.seriesMap.get(i.seriesId).name,price:FurnitureData.price(model,i),stock:i.stock,kind:'furniture'})) : [];
  function setData(data) {
    model=FurnitureData.normalize(data);render();
    updateBasketCount();if (!$f('#favoritePanel').classList.contains('hidden')) showFav();
    const id=$f('#modalId').textContent;
    if (!$f('#productModal').classList.contains('hidden')&&id.startsWith('F')) {
      if(model.itemMap.has(id))openItem(id);else{$f('#productModal').classList.add('hidden');document.body.style.overflow='';}
    }
  }
  let sequence=0;
  function sheet(name) {
    return new Promise((resolve,reject)=>{
      const callback='furnitureSheet'+Date.now()+'_'+(++sequence), script=document.createElement('script');let timeout;
      const clean=()=>{clearTimeout(timeout);script.remove();delete window[callback];};
      window[callback]=data=>{clean();if(data.status==='ok'&&data.table)resolve(data.table);else reject(Error('가구 시트 응답 오류'));};
      script.onerror=()=>{clean();reject(Error('가구 시트 연결 오류'));};timeout=setTimeout(()=>{clean();reject(Error('가구 시트 응답 지연'));},15000);
      const q=new URLSearchParams({sheet:name,headers:'1',tqx:'out:json;responseHandler:'+callback,_t:String(Date.now())});
      script.src='https://docs.google.com/spreadsheets/d/'+encodeURIComponent(config.sheets.spreadsheetId)+'/gviz/tq?'+q;document.head.appendChild(script);
    });
  }
  async function refresh() {
    if(!config?.sheets?.enabled||loading)return;
    loading=true;
    try {
      const tables=await Promise.all([sheet(config.sheets.seriesSheet),sheet(config.sheets.itemsSheet),sheet(config.sheets.pricesSheet)]);
      const raw=FurnitureData.fromTables(...tables);setData(raw);
      try{localStorage.setItem('dangniFurniture:'+config.sheets.spreadsheetId,JSON.stringify(raw));}catch(e){}
    } catch(e) {console.warn('[당그니네 밭] 마지막 가구 목록을 유지합니다.',e.message);}
    finally{loading=false;}
  }
  async function init() {
    try {
      const [catalogResponse,configResponse]=await Promise.all([fetch('catalog.json?'+Date.now()),fetch('config.json?'+Date.now())]);
      if(!catalogResponse.ok||!configResponse.ok)throw Error('가구 파일을 불러오지 못했어요.');
      config=await configResponse.json();setData(await catalogResponse.json());
      if(config.sheets.enabled){try{const cached=JSON.parse(localStorage.getItem('dangniFurniture:'+config.sheets.spreadsheetId));if(cached)setData(cached);}catch(e){}}
      await refresh();setInterval(()=>{if(!document.hidden)refresh();},180000);
    }catch(e){$f('#furnitureContent').innerHTML='<p class="furniture-empty" role="status">가구 목록을 불러오지 못했어요. 잠시 후 새로고침해주세요.</p>';console.warn(e.message);}
  }
  $f('#furnitureBasket').onclick=showFav;
  $f('#basketInquiry').onclick=inquire;
  document.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=()=>{$f('#productModal').classList.add('hidden');document.body.style.overflow=''});
  document.querySelectorAll('[data-fav-close]').forEach(b=>b.onclick=()=>{$f('#favoritePanel').classList.add('hidden');document.body.style.overflow=''});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$f('#productModal').classList.add('hidden');$f('#favoritePanel').classList.add('hidden');document.body.style.overflow=''}});
  updateBasketCount();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  init();
})();
