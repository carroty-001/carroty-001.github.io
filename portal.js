/* Only the surrounding bookmarks are controlled here. Each shop has its own
   document, styles, scripts and basket. Switching never reloads the farm. */
(() => {
  const frames={farm:document.querySelector('#farmFrame'),furniture:document.querySelector('#furnitureFrame')};
  const links=[...document.querySelectorAll('[data-shop]')];
  function selectShop(){
    const selected=location.hash==='#furniture'?'furniture':'farm';
    Object.entries(frames).forEach(([name,frame])=>{
      if(name===selected&&!frame.getAttribute('src'))frame.src=frame.dataset.src;
      frame.hidden=name!==selected;
    });
    links.forEach(link=>{if(link.dataset.shop===selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
    document.title=selected==='farm'?'🥕 당그니네':'🪑 가구 · 당그니네';
  }
  // The original farm's inquiry button navigates the document. In browsers
  // offering Navigation API, preserve that full-page external navigation.
  frames.farm.addEventListener('load',()=>{
    try{
      const navigation=frames.farm.contentWindow.navigation;
      if(navigation)navigation.addEventListener('navigate',event=>{
        const destination=new URL(event.destination.url);
        if(destination.origin!==location.origin&&/^https?:$/.test(destination.protocol)&&event.cancelable){event.preventDefault();location.assign(destination.href)}
      });
    }catch(error){/* The shop may have navigated to an external destination. */}
  });
  window.addEventListener('hashchange',selectShop);
  selectShop();
})();
