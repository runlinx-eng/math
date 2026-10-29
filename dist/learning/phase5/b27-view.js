import {NAMES,prismNetParts,section} from './b27-geometry.js';
import {inspect} from './b27-model.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(action,label,index='',pressed=false)=>`<button type="button" data-x="g27-${action}" ${index!==''?`data-index="${esc(index)}"`:''} aria-pressed="${!!pressed}">${esc(label)}</button>`;
const cards=(t,b)=>`<div class="g27-cards" aria-label="选择要观察的模型">${t.cards.map((c,i)=>btn('card',(c.label||'模型'+(i+1)),i,b.card===i)).join('')}</div>`;
const bins=(t,action,selected)=>`<div class="g27-buttons">${t.bins.map(b=>btn(action,b.label,b.id,selected===b.id)).join('')}</div>`;
export function visual(){return '';}
export function controls(t,m){
 const b=m.board;let out=`<div class="g27-controls"><button type="button" data-x="turn-extra">转一转</button>`;
 if(['x-g27-sort','x-g27-face'].includes(t.type)){
  const c=t.cards[b.card];out+=cards(t,b);
  if(t.type==='x-g27-face')out+=`<p>观察浅黄色的面。可以直接点它，也可以用按钮点亮。</p>`+btn('probe',b.probed.includes(b.card)?'这面已点亮':'点亮这一面');
  if(t.type!=='x-g27-face'||b.probed.includes(b.card))out+=`<p>${esc(t.question||'把这个模型放到哪一边？')}</p>`+bins(t,'choose',b.choices[b.card]);
  if(c.reveal&&b.choices[b.card]!==null)out+=btn('show',b.revealed.includes(b.card)?'已打开立体':'打开立体看看')+(b.revealed.includes(b.card)?`<p>现在看到的是折成或画成的立体。</p>`:'');
 }else if(t.type==='x-g27-build'){
  out+=`<p>从下往上放。已放：${b.parts.length?b.parts.map(x=>esc(NAMES[x])).join(' → '):'还没有放'}</p><div class="g27-buttons">`+t.options.map(s=>btn('add','放入'+NAMES[s],s)).join('')+`</div>`+btn('remove','拿走最上面的一块');
 }else if(t.type==='x-g27-net'){
  out+=`<p>中间已有一片长方形；选择旁边的纸片，把它们接上。</p><div class="g27-buttons">`+prismNetParts.map((s,i)=>btn('piece',(b.parts.includes(i)?'✓ ':'接上')+s,i,b.parts.includes(i))).join('')+`</div>`;
  if(!b.fold)out+=`<p>这张纸能合成一个两头是三角形的盒子吗？</p><div class="g27-buttons">`+btn('predict','能','yes',b.prediction==='yes')+btn('predict','不能','no',b.prediction==='no')+`</div>`;
  if(b.prediction!==null)out+=`<label class="g27-slider"><span>慢慢折起来，看看纸片怎样合拢</span><input type="range" min="0" max="100" step="1" value="${b.fold}" data-xfield="foldPosition" aria-label="折合纸片"></label>`+(b.fold<100?btn('fold','直接折合'):btn('unfold','摊开再调整'));
  if(b.fold)out+=`<p>拖动模型，看看是否有缺口或重叠。</p>`;
 }else if(t.type==='x-g27-cut'){
  const c=t.cards[b.card];out+=cards(t,b);
  out+=`<p>${esc(c.axis==='vertical'?'这一刀穿过圆锥尖顶和底面中心。':c.axis==='end'?'这一刀和两头的三角形同方向。':'这一刀和底面同方向。')}</p>`;
  if(b.predictions[b.card]===null)out+=`<p>先猜：${esc(c.mode==='compare'?'向上移动，切面的大小怎样变化？':'切面是什么形状？')}</p>`+bins(t,'predict',null);
  else{
   if(c.axis==='vertical')out+=btn('cut','打开切面',2,b.position===2);
   else out+=`<label class="g27-slider"><span>移动切面：${c.axis==='end'?'靠近一端 ← → 靠近另一端':'靠近底部 ← → 靠近顶部'}</span><input type="range" min="1" max="3" step="1" value="${esc(b.position||m.position)}" data-xfield="position" aria-label="移动切面"></label>`;
   const sec=b.position?section(c.shape,c.axis,b.position):null;
   if(sec)out+=`<p class="g27-discovery">看到的切面：${esc(NAMES[sec.shape])}。${c.mode==='compare'?(' 相对底面宽度：'+Math.round(sec.scale*100)+'%。'):''}</p>`;
   out+=`<p>已看过的位置：${(b.observations[b.card]||[]).map(n=>n===1?(c.axis==='end'?'靠近一端':'靠近底部'):n===3?(c.axis==='end'?'靠近另一端':'靠近顶部'):'中间').join('、')||'还没有'}</p>`;
   if((c.required||[1,3]).every(n=>b.observations[b.card].includes(n)))out+=`<p>现在把发现留下：</p>`+bins(t,'answer',b.answers[b.card]);
  }
 }
 if(m.issue)out+=`<p class="g27-issue" role="status">${esc(m.issue)}</p>`;
 if(inspect(t,m).correct)out+=`<p class="g27-discovery">已经对上了；还可以转一转，再看看。</p>`;
 out+=`<details><summary>用自己的话留下发现（可选）</summary><label>我的解释或新问题 <input data-xfield="prose" maxlength="1500" value="${esc(m.prose)}"></label><small>原话会保存，暂不自动判断。</small></details></div>`;
 return out;
}
export const render=(t,m)=>`<div class="cube-world g27-world" id="extra-world"></div><div id="extra-controls">${controls(t,m)}</div>`;
