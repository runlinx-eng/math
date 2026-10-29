// Transient input devices; only completed playback, bounded ink and flash state are persisted.
export function mountB06(root,t,getModel,{mutate,saveInk,help}){
 let disposed=false,audio=null,timer=null,stroke=null,poly=null;
 const model=getModel();
 if(t.type==='x-flashcount'&&model.open)timer=setTimeout(()=>{if(!disposed)mutate('flash-close');},Math.max(0,model.until-Date.now()));
 const click=async e=>{const control=e.target.closest('[data-b6]');if(!control)return;
  if(control.dataset.b6==='peek'){if(getModel().reveals)help();mutate('flash-open',{now:Date.now()});}
  if(control.dataset.b6==='text'){help();mutate('write-text');}
  if(control.dataset.b6==='hear'){
   audio?.pause();audio=new Audio(new URL(t.audio,new URL('../../',import.meta.url)));const current=audio;
   const status=root.querySelector('#b6-audio-message');if(status)status.textContent='正在播放';
   current.addEventListener('ended',()=>{if(!disposed&&audio===current){if(Number.isFinite(current.duration)&&current.duration>.25&&current.currentTime>=current.duration-.05){mutate('write-heard',{},false);if(status)status.textContent='播放完了';}else if(status)status.textContent='声音文件没有有效内容，可以看文字提示。';}},{once:true});
   try{await current.play();}catch{if(!disposed&&status)status.textContent='声音暂时无法播放，可以看文字提示。';}
  }
 };
 root.addEventListener('click',click);
 const pad=root.querySelector('#b6-ink');
 const point=e=>{const r=pad.getBoundingClientRect();return[Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
 const redraw=()=>poly?.setAttribute('points',stroke.map(p=>`${p[0]*600},${p[1]*180}`).join(' '));
 const down=e=>{if(e.button!==0||getModel().ink.length>=64)return;e.preventDefault();pad.setPointerCapture(e.pointerId);stroke=[point(e)];poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');pad.append(poly);redraw();};
 const move=e=>{if(!stroke)return;e.preventDefault();if(stroke.length<512){stroke.push(point(e));redraw();}};
 const up=e=>{if(!stroke)return;move(e);const completed=stroke;stroke=null;poly=null;saveInk(completed);if(pad.hasPointerCapture(e.pointerId))pad.releasePointerCapture(e.pointerId);};
 pad?.addEventListener('pointerdown',down);pad?.addEventListener('pointermove',move);pad?.addEventListener('pointerup',up);pad?.addEventListener('pointercancel',up);
 return()=>{disposed=true;clearTimeout(timer);audio?.pause();root.removeEventListener('click',click);pad?.removeEventListener('pointerdown',down);pad?.removeEventListener('pointermove',move);pad?.removeEventListener('pointerup',up);pad?.removeEventListener('pointercancel',up);};
}
