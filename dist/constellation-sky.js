// Original decorative sky. These pixels are never math nodes or hit targets.
const canvas=document.querySelector('#constellation-atmosphere');
if(canvas){
 const ctx=canvas.getContext('2d',{alpha:false});
 const tools=document.querySelector('#constellation-tools-toggle');
 const panel=document.querySelector('#network-guide');
 tools?.addEventListener('click',()=>{
   const open=!panel.classList.contains('constellation-open');
   panel.classList.toggle('constellation-open',open);
   tools.setAttribute('aria-expanded',String(open));
   tools.textContent=open?'收起工具 −':'展开工具 ＋';
 });
 const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const rng=random(0x6b3c2026);
 const stars=Array.from({length:650},(_,i)=>({
   u:rng(),v:rng(),r:i%17===0?1.38:.22+rng()*.75,
   a:i%19===0?.63:.06+rng()*.38,
   tint:i%13===0?'#efd4a5':i%9===0?'#a9cad9':'#eff2e8'
 }));
 const dust=Array.from({length:1600},()=>({u:rng(),normal:(rng()+rng()+rng()+rng()-2)*.23,a:.012+rng()*.075,r:.16+rng()*.5}));
 const paint=()=>{
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),ratio=Math.min(devicePixelRatio||1,1.7);
  canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
  canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.fillStyle='#080b13';ctx.fillRect(0,0,w,h);
  const nebula=ctx.createRadialGradient(w*.54,h*.42,15,w*.54,h*.42,Math.max(w,h)*.67);
  nebula.addColorStop(0,'#25334c');nebula.addColorStop(.38,'#121c2d');nebula.addColorStop(1,'#080b13');
  ctx.fillStyle=nebula;ctx.fillRect(0,0,w,h);
  for(const p of dust){const x=p.u*w,y=h*.48-(p.u-.5)*h*.72+p.normal*h;if(y<0||y>h)continue;
    ctx.globalAlpha=p.a;ctx.fillStyle='#b2bfcc';ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();}
  for(const p of stars){const x=p.u*w,y=p.v*h;ctx.globalAlpha=p.a;ctx.fillStyle=p.tint;
    ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();
    if(p.r>1.2){const g=ctx.createRadialGradient(x,y,0,x,y,8);g.addColorStop(0,'#e9d2aa66');g.addColorStop(1,'#e9d2aa00');
      ctx.globalAlpha=.23;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();}}
  ctx.globalAlpha=1;const vignette=ctx.createRadialGradient(w*.48,h*.45,Math.min(w,h)*.12,w*.5,h*.5,Math.max(w,h)*.75);
  vignette.addColorStop(0,'#070b1200');vignette.addColorStop(1,'#05070ddd');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
 };
 let pending=false;const resize=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;paint();});};
 window.addEventListener('resize',resize,{passive:true});
 // The field stays static for everyone, including prefers-reduced-motion users.
 // The actual 3D map alone supplies motion and direct pointer interaction.
 paint();
}
