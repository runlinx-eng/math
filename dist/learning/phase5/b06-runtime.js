// Transient input devices; only completed playback, bounded ink and flash state are persisted.
import {recountReady} from './b06-view.js';
export function mountB06(root,t,getModel,{mutate,saveInk,help}){
 let disposed=false,audio=null,timer=null,stroke=null,poly=null;
 const model=getModel();
 if(t.type==='x-flashcount'&&model.open)timer=setTimeout(()=>{if(!disposed)mutate('flash-close');},Math.max(0,model.until-Date.now()));
 const updateCheck=()=>{
  if(t.type!=='x-counttrail'||!t.error)return;
  const check=root.ownerDocument.querySelector('#actions [data-do="check"]');
  if(!check)return;
  const m=getModel();
  check.textContent='检查结果';
  check.disabled=!(Number.isInteger(m.badStep)&&m.badStep>=1&&m.badStep<=t.error.length&&m.why!==''&&m.taps.length===t.n&&new Set(m.taps).size===t.n&&m.taps.every(i=>Number.isInteger(i)&&i>=0&&i<t.n));
 };
 const playPuppet=button=>{
  if(!t.error||getModel().badStep!==null||button.disabled)return;
  const beads=[...root.querySelectorAll('[data-x="count-error-bead"]')],status=root.querySelector('[data-b6="puppet-status"]'),title=root.querySelector('[data-b6="puppet-title"]');
  if(!status||beads.length!==t.n)return;
  button.disabled=true;button.textContent='正在数';
  for(const bead of beads){bead.disabled=true;bead.classList.remove('puppet-active');delete bead.dataset.countWord;}
  const words=['一','二','三','四','五','六','七','八','九','十'];
  let step=0;
  const tick=()=>{
   if(disposed)return;
   if(step===t.error.length){
    for(const bead of beads){bead.classList.remove('puppet-active');delete bead.dataset.countWord;bead.disabled=false;}
    if(title)title.textContent='② 找出重复的珠子';
    status.textContent='数完了。哪颗珠子被数了两次？';
    button.textContent='再看一次';button.disabled=false;
    return;
   }
   const i=t.error[step],word=words[step]||String(step+1);
   // Restart the actual pointing pulse even when the same bead is counted twice.
   for(const bead of beads){bead.classList.remove('puppet-active');delete bead.dataset.countWord;}
   const active=beads.find(bead=>Number(bead.dataset.index)===i);
   if(active){void active.offsetWidth;active.classList.add('puppet-active');active.dataset.countWord=word;}
   status.textContent='小木偶数到'+word+'，指向珠 '+String.fromCharCode(65+i);
   step++;timer=setTimeout(tick,650);
  };
  tick();
 };
 const click=async e=>{const control=e.target.closest('[data-b6]');if(!control)return;
  if(control.dataset.b6==='puppet-start'){playPuppet(control);return;}
  if(control.dataset.b6==='peek'){if(getModel().reveals)help();mutate('flash-open',{now:Date.now()});}
  if(control.dataset.b6==='text'){help();mutate('write-text');}
  if(control.dataset.b6==='hear'){
   audio?.pause();audio=new Audio(new URL(t.audio,new URL('../../',import.meta.url)));const current=audio;
   const status=root.querySelector('#b6-audio-message');if(status)status.textContent='正在播放';
   current.addEventListener('ended',()=>{if(!disposed&&audio===current){if(Number.isFinite(current.duration)&&current.duration>.25&&current.currentTime>=current.duration-.05){mutate('write-heard',{},false);if(status)status.textContent='播放完了';}else if(status)status.textContent='声音文件没有有效内容，可以看文字提示。';}},{once:true});
   try{await current.play();}catch{if(!disposed&&status)status.textContent='声音暂时无法播放，可以看文字提示。';}
  }
 };
 // The lesson-level input handler saves the reason after this local listener runs.
 // Refresh readiness in a microtask, without modifying shared learning/entry modules.
 const syncRecount=()=>{
  if(t.type!=='x-counttrail'||!t.recount)return;
  const m=getModel(),ready=recountReady(t,m);
  const panel=root.querySelector('[data-b6="recount-prediction"]'),button=root.querySelector('[data-x="count-move"]');
  if(panel)panel.hidden=!m.moved&&!ready;
  if(button)button.disabled=!ready||m.prediction===null;
 };
 const reasonChange=e=>{
  const key=e.target?.dataset?.xfield;
  if(key==='why'||t.recount&&['total','prediction'].includes(key))
   queueMicrotask(()=>{if(!disposed){updateCheck();syncRecount();}});
 };
 updateCheck();syncRecount();
 root.addEventListener('input',reasonChange);
 root.addEventListener('change',reasonChange);
 root.addEventListener('click',click);
 const pad=root.querySelector('#b6-ink');
 const point=e=>{const r=pad.getBoundingClientRect();return[Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
 const redraw=()=>poly?.setAttribute('points',stroke.map(p=>`${p[0]*600},${p[1]*180}`).join(' '));
 const down=e=>{if(e.button!==0||getModel().ink.length>=64)return;e.preventDefault();pad.setPointerCapture(e.pointerId);stroke=[point(e)];poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');pad.append(poly);redraw();};
 const move=e=>{if(!stroke)return;e.preventDefault();if(stroke.length<512){stroke.push(point(e));redraw();}};
 const up=e=>{if(!stroke)return;move(e);const completed=stroke;stroke=null;poly=null;saveInk(completed);if(pad.hasPointerCapture(e.pointerId))pad.releasePointerCapture(e.pointerId);};
 pad?.addEventListener('pointerdown',down);pad?.addEventListener('pointermove',move);pad?.addEventListener('pointerup',up);pad?.addEventListener('pointercancel',up);
 return()=>{disposed=true;clearTimeout(timer);audio?.pause();root.removeEventListener('input',reasonChange);root.removeEventListener('change',reasonChange);root.removeEventListener('click',click);pad?.removeEventListener('pointerdown',down);pad?.removeEventListener('pointermove',move);pad?.removeEventListener('pointerup',up);pad?.removeEventListener('pointercancel',up);};
}
