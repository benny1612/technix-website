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
 const clientSection=document.querySelector('.clients'),clientCards=[...document.querySelectorAll('.client-card')];
 function syncClientLogos(){
  const mobile=matchMedia('(max-width:760px)').matches;
  const phase=clientSection?(innerHeight*.5-clientSection.getBoundingClientRect().top)/90:0;
  clientCards.forEach((card,index)=>{
   const emphasis=mobile?Math.max(0,1-Math.abs(phase-index)):0;
   const value=emphasis.toFixed(4);
   if(card.style.getPropertyValue('--client-emphasis')!==value)card.style.setProperty('--client-emphasis',value);
  });
 }
 function queueDock(){if(dockFrame)return;dockFrame=requestAnimationFrame(()=>{dockFrame=0;syncDock();syncClientLogos();});}
 window.addEventListener('scroll',queueDock,{passive:true});window.addEventListener('resize',queueDock);
 matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',queueDock);
 if(menu)new MutationObserver(syncDock).observe(menu,{attributes:true,attributeFilter:['aria-expanded']});
 document.addEventListener('focusin',syncDock);document.addEventListener('focusout',()=>setTimeout(syncDock,0));
 document.addEventListener('click',()=>queueMicrotask(syncDock));
 // The widget is inserted after load; style changes tell us when its dialog opens.
 const widgetObserver=new MutationObserver(syncDock);
 widgetObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
 syncDock();syncClientLogos();
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

/* Original Technix bulb switch. Theme scope is separate from contact/logo preview work. */
(function(){
 const root=document.documentElement,header=document.querySelector('.site-header');if(!header)return;
 const key='technix-theme';let saved=null;try{saved=localStorage.getItem(key)}catch(_){}
 const system=matchMedia('(prefers-color-scheme:dark)');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='tx-theme-toggle';
 toggle.innerHTML='<svg aria-hidden="true" width="24" height="28" viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.7 19.1c-.2-2.1-3.9-4.8-3.9-8.2a7.2 7.2 0 0 1 14.4 0c0 3.4-3.7 6.1-3.9 8.2M9 21.7h6M9.7 24.4h4.6M11 26h2"/><path class="tx-bulb-filament" d="M10 18.8v-5.5l-1.6-2 3.6 1.2 3.6-1.2-1.6 2v5.5"/><path class="tx-bulb-lit" d="M9 10.7h6"/></svg>';
 header.append(toggle);
 function apply(dark){root.dataset.txTheme=dark?'dark':'light';toggle.setAttribute('aria-pressed',String(dark));const label=dark?'מעבר למצב יום':'מעבר למצב לילה';toggle.setAttribute('aria-label',label);toggle.title=label;root.style.colorScheme=dark?'dark':'light';}
 apply(saved==='dark'||(saved!=='light'&&system.matches));
 toggle.addEventListener('click',()=>{const dark=root.dataset.txTheme!=='dark';apply(dark);saved=dark?'dark':'light';try{localStorage.setItem(key,saved)}catch(_){}toggle.classList.remove('is-pulling');void toggle.offsetWidth;toggle.classList.add('is-pulling');});
 toggle.addEventListener('animationend',()=>toggle.classList.remove('is-pulling'));
 system.addEventListener('change',e=>{if(saved!=='dark'&&saved!=='light')apply(e.matches)});
 window.addEventListener('storage',e=>{if(e.key===key){saved=e.newValue;apply(saved==='dark'||(saved!=='light'&&system.matches))}});
})();
