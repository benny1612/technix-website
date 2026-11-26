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

(function(){
 if(document.querySelector('.tx-fab'))return;
 const wa=document.querySelector('.mobile-contact a[href*="wa.me"],a[href*="wa.me/972587060190"]');
 const call=document.querySelector('a[href^="tel:"]');
 if(!wa||!call)return;
 const waIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 1 0 12 0z"/></svg>';
 const callIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
 const box=document.createElement('div');box.className='tx-fab';
 box.innerHTML='<a class="tx-fab-opt tx-fab-call" href="'+call.getAttribute('href')+'">'+callIcon+'חייגו עכשיו</a><a class="tx-fab-opt tx-fab-wa" href="'+wa.getAttribute('href')+'" rel="noopener">'+waIcon+'וואטסאפ</a><button class="tx-fab-main" type="button" aria-expanded="false" aria-label="פתיחת אפשרויות יצירת קשר">'+waIcon+'</button>';
 document.body.appendChild(box);
 const main=box.querySelector('.tx-fab-main');
 const set=open=>{box.classList.toggle('open',open);main.setAttribute('aria-expanded',String(open));main.setAttribute('aria-label',open?'סגירת אפשרויות יצירת קשר':'פתיחת אפשרויות יצירת קשר');};
 main.addEventListener('click',e=>{e.stopPropagation();set(!box.classList.contains('open'));});
 document.addEventListener('click',e=>{if(!box.contains(e.target))set(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('open')){set(false);main.focus();}});
})();
(function(){
 const form=document.getElementById('contact-form');if(!form)return;
 const status=document.getElementById('form-status'),btn=form.querySelector('button[type=submit]');
 const phoneOk=v=>/^(?:0[23489]\d{7}|05\d{8}|\+972[23489]\d{7}|\+9725\d{8})$/.test(v.replace(/[\s().-]/g,''));
 const sendI='<svg class="bolt-send" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path class="bolt-line" d="M13 2 4.5 13.5H11L10 22l9.5-12H13z"/><path class="bolt-fill" d="M13 2 4.5 13.5H11L10 22l9.5-12H13z"/></svg>';
 const say=(t,state,extra)=>{status.hidden=false;status.dataset.state=state;status.textContent=t;if(extra){status.append(' ');status.append(extra)}if(state==='info')status.insertAdjacentHTML('afterbegin',sendI)};
 const waLink=document.querySelector('a[href*="wa.me/972587060190"]'),callLink=document.querySelector('a[href^="tel:"]');
 const waI='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 1 0 12 0z"/></svg>';
 const callI='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
 const hideFb=()=>{const x=document.getElementById('form-fallback');if(x)x.hidden=true};
 const showFb=()=>{let x=document.getElementById('form-fallback');if(!x){x=document.createElement('div');x.id='form-fallback';x.className='form-fallback';x.innerHTML='<p>אפשר ליצור קשר ישירות:</p><div class="form-fallback-actions"><a class="button fb-call" href="'+(callLink?callLink.getAttribute('href'):'tel:+972587060190')+'">'+callI+'<span>חייגו עכשיו</span></a><a class="button button-dark fb-wa" rel="noopener" href="'+(waLink?waLink.getAttribute('href'):'https://wa.me/972587060190')+'">'+waI+'<span>שלחו הודעה בוואטסאפ</span></a></div>';status.after(x)}x.hidden=false};
 const showDone=()=>{hideFb();status.hidden=true;form.style.display='none';let d=document.getElementById('form-done');if(!d){d=document.createElement('div');d.id='form-done';d.className='form-done';d.setAttribute('role','status');d.tabIndex=-1;d.innerHTML='<span class="done-icon"><svg class="done-bolt" viewBox="0 0 24 24" width="56" height="56" aria-hidden="true"><path class="bolt-line" d="M13 2 4.5 13.5H11L10 22l9.5-12H13z"/><path class="bolt-fill" d="M13 2 4.5 13.5H11L10 22l9.5-12H13z"/></svg><svg class="done-check" viewBox="0 0 24 24" width="56" height="56" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg></span><h3>הפנייה התקבלה בהצלחה</h3><p>אצור איתכם קשר בהקדם.</p>';form.after(d)}d.hidden=false;d.focus()};
 const newId=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')};
 let pending=null;
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  const f=form.elements,name=f.name.value.trim(),phone=f.phone.value.trim();
  [f.name,f.phone,f.consent].forEach(x=>x.removeAttribute('aria-invalid'));
  if(!name){f.name.setAttribute('aria-invalid','true');f.name.focus();say('נא למלא שם.','error');return}
  if(!phoneOk(phone)){f.phone.setAttribute('aria-invalid','true');f.phone.focus();say('נא למלא מספר טלפון ישראלי תקין.','error');return}
  if(!f.consent.checked){f.consent.setAttribute('aria-invalid','true');f.consent.focus();say('כדי להמשיך יש לאשר יצירת קשר.','error');return}
  const payload={name,phone,town:f.town.value.trim(),message:f.message.value.trim(),_honey:f._honey.value};
  const key=JSON.stringify(payload);
  if(!pending||pending.key!==key)pending={key,id:newId()};
  btn.disabled=true;hideFb();say('שולחים…','info');
  try{
   const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),30000);
   const r=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,request_id:pending.id}),signal:ctl.signal});
   clearTimeout(t);
   if(r.ok){form.reset();pending=null;showDone();return}
   if(r.status===503){say('לא הצלחנו לשלוח את הפנייה.','error');showFb()}
   else if(r.status===429){say('נשלחו יותר מדי פניות. נסו שוב בעוד דקה.','error');showFb()}
   else if(r.status===400)say('בדקו את הפרטים ונסו שוב.','error');
   else {say('לא הצלחנו לאשר שהפנייה נשלחה. כדי לא לשלוח פעמיים, אפשר לנסות שוב או ליצור קשר ישירות.','error');showFb()}
  }catch(err){say('לא הצלחנו לאשר שהפנייה נשלחה.','error');showFb()}
  finally{btn.disabled=false;if(status.dataset.state==='error'&&!status.hidden&&!form.querySelector('[aria-invalid=true]')){status.tabIndex=-1;status.focus()}}
 });
})();
