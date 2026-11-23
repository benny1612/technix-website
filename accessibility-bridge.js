'use strict';
(function(){
 const root=document.documentElement;
 const dock=document.createElement('style');dock.textContent='@media(max-width:660px){html{scroll-padding-bottom:100px}body{padding-bottom:80px}.asw-widget::before{content:"";position:fixed;inset:auto 0 0;height:76px;background:#f3f4ee;border-top:1px solid #ccd5d1;z-index:499999}.asw-menu-btn{bottom:16px!important}}';document.head.appendChild(dock);
 function settings(){try{return JSON.parse(localStorage.getItem('asw-user-settings')||'{}')}catch(e){try{let c=document.cookie.split('; ').find(c=>c.startsWith('asw-user-settings='));return c?JSON.parse(decodeURIComponent(c.split('=').slice(1).join('='))):{}}catch(e){return {}}}}
 function motion(data){window.technixMotionStopped=!!data?.states?.['stop-animations'];root.classList.toggle('technix-motion-off',window.technixMotionStopped)}
 motion(settings());window.addEventListener('technix-accessibility',e=>motion(e.detail));window.addEventListener('storage',()=>motion(settings()));
 let open=false,previous=null,saved=[];
 function sync(){
  const menu=document.querySelector('.asw-menu'),container=document.querySelector('.asw-container'),opener=document.querySelector('.asw-menu-btn');if(!opener)return;
  opener.setAttribute('aria-label','פתיחת תפריט נגישות');opener.setAttribute('title','פתיחת תפריט נגישות');opener.setAttribute('aria-controls','technix-accessibility-menu');
  const active=!!menu&&menu.parentElement.style.display!=='none';opener.setAttribute('aria-expanded',String(active));
  if(menu){menu.id='technix-accessibility-menu';menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-label','תפריט נגישות');menu.setAttribute('dir','rtl');menu.querySelectorAll('[data-key]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(el.classList.contains('asw-selected')))});}
  if(active&&!open){previous=document.activeElement;saved=[...document.body.children].filter(e=>e!==container&&e.tagName!=='SCRIPT').map(e=>[e,e.inert]);saved.forEach(([e])=>e.inert=true);open=true;menu.querySelector('.asw-menu-close')?.focus()}
  if(!active&&open){open=false;saved.forEach(([e,state])=>e.inert=state);saved=[];(previous&&previous.isConnected?previous:opener).focus()}
 }
 new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
 document.addEventListener('click',()=>{queueMicrotask(()=>{motion(settings());sync()})});
 document.addEventListener('keydown',e=>{
  const menu=document.querySelector('.asw-menu');
  if(e.target.matches('.asw-menu-btn')&&e.key===' '){e.preventDefault();e.target.click();return}
  if(e.target.matches('.asw-plus,.asw-minus')&&[' ','Enter'].includes(e.key)){e.preventDefault();e.target.click();return}
  if(!open||!menu)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();menu.querySelector('.asw-menu-close').click();queueMicrotask(sync)}
  if(e.key==='Tab'){const els=[...menu.querySelectorAll('button,a[href],select,[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.disabled);let first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
 },true);sync();
})();
