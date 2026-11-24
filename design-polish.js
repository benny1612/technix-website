/* Shared progressive enhancements. No form submission, tracking or remote requests. */
'use strict';
(function(){
 document.documentElement.classList.add('js');
 const menu=document.querySelector('.menu-button'),nav=document.querySelector('#navigation');
 const dock=document.querySelector('.mobile-contact');
 const primary=document.querySelector('.hero-actions')||document.querySelector('main h1');
 const contact=document.querySelector('#contact')||document.querySelector('.site-footer');
 let dockFrame=0;
 const clamp=value=>Math.max(0,Math.min(1,value));
 function syncDock(){
  if(!dock)return;
  const accessibility=document.querySelector('.asw-menu');
  const accessibilityOpen=accessibility&&accessibility.parentElement.style.display!=='none';
  const editing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  const primaryBottom=primary?primary.getBoundingClientRect().bottom:0;
  const contactTop=contact?contact.getBoundingClientRect().top:Infinity;
  const allowed=menu?.getAttribute('aria-expanded')!=='true'&&!accessibilityOpen&&!editing&&matchMedia('(max-width:760px)').matches;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const progress=!allowed?0:reduced?(primaryBottom<=0&&contactTop>=innerHeight?1:0):Math.min(clamp(-primaryBottom/160),clamp((contactTop-innerHeight)/160));
  dock.hidden=progress<=0;dock.inert=progress<1;dock.setAttribute('aria-hidden',String(progress<1));
  const offset=`${(1-progress)*100}%`;if(dock.style.getPropertyValue('--dock-offset')!==offset)dock.style.setProperty('--dock-offset',offset);
  dock.classList.toggle('is-visible',progress===1);
  document.documentElement.classList.toggle('tx-dock-visible',progress>0);
 }
 function queueDock(){if(dockFrame)return;dockFrame=requestAnimationFrame(()=>{dockFrame=0;syncDock();});}
 window.addEventListener('scroll',queueDock,{passive:true});window.addEventListener('resize',queueDock);
 matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',queueDock);
 if(menu)new MutationObserver(syncDock).observe(menu,{attributes:true,attributeFilter:['aria-expanded']});
 document.addEventListener('focusin',syncDock);document.addEventListener('focusout',()=>setTimeout(syncDock,0));
 document.addEventListener('click',()=>queueMicrotask(syncDock));
 // The widget is inserted after load; style changes tell us when its dialog opens.
 const widgetObserver=new MutationObserver(syncDock);
 widgetObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
 syncDock();
 const rail=document.querySelector('.reviews-window');
 if(rail){
  const cards=[...rail.querySelectorAll('.review-card')],back=document.querySelector('[data-review-prev]'),next=document.querySelector('[data-review-next]'),status=document.querySelector('.reviews-status');
  const visibleCount=()=>matchMedia('(max-width:760px)').matches?1:3;
  const index=()=>{const edge=rail.getBoundingClientRect().right;let best=0,distance=Infinity;cards.forEach((card,i)=>{const d=Math.abs(card.getBoundingClientRect().right-edge);if(d<distance){distance=d;best=i;}});return best;};
  const update=()=>{const i=index();back.disabled=i===0;next.disabled=i>=cards.length-visibleCount();const end=Math.min(cards.length,i+visibleCount());status.textContent=end===i+1?`ביקורת ${i+1} מתוך ${cards.length}`:`ביקורות ${i+1} עד ${end} מתוך ${cards.length}`;};
  const go=step=>{const i=Math.max(0,Math.min(cards.length-visibleCount(),index()+step));const delta=cards[i].getBoundingClientRect().right-rail.getBoundingClientRect().right;rail.scrollBy({left:delta,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches||window.technixMotionStopped?'instant':'smooth'});};
  back.addEventListener('click',()=>go(-1));next.addEventListener('click',()=>go(1));
  rail.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
 }
 const phoneLabel=document.querySelector('.header-phone>span:not(.sr-only)');
 if(phoneLabel)phoneLabel.textContent=phoneLabel.textContent.trim().replace(/:$/,'')+':';
 const active=document.querySelector('.site-header a[href="/guides"]');
 if(active&&/guides|electrical-fault|electrical-panel|energy-site|utility-inspection/.test(location.pathname))active.setAttribute('aria-current','page');
 if(location.pathname==='/'||location.pathname.endsWith('/index.html')){
  const sections=[...document.querySelectorAll('main>section[id]')];
  if('IntersectionObserver' in window){const sectionObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){document.querySelectorAll('#navigation a').forEach(a=>{const on=a.getAttribute('href')==='#'+e.target.id;if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-15% 0px -60% 0px'});sections.forEach(s=>sectionObserver.observe(s));}
 }
})();
