import {number} from './b20-model.js';
import {cover,inspect,measured} from './b28-model.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(action,label,index='',pressed=false)=>`<button type="button" data-x="m28-${action}" ${index!==''?`data-index="${esc(index)}"`:''} aria-pressed="${!!pressed}">${esc(label)}</button>`;
const field=(k,label,v,extra='')=>`<label class="m28-field"><span>${esc(label)}</span><input type="text" inputmode="decimal" data-xfield="${esc(k)}" value="${esc(v)}" ${extra}></label>`;
const select=(k,label,v,options)=>`<label class="m28-field"><span>${esc(label)}</span><select data-xfield="${esc(k)}"><option value="">选择</option>${options.map(([id,name])=>`<option value="${esc(id)}" ${String(v)===String(id)?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`;
const unit=(t,m)=>select('unit','单位',m.unit,[...new Set([t.unit,'cm','m','g','kg','mL','L','秒','块','回形针','英寸'].filter(Boolean))].map(x=>[x,x]));
const qs=(t,m)=>(t.questions||[]).map((q,i)=>q.options?select('answers.'+i,q.label,m.answers[i],q.options):field('answers.'+i,q.label,m.answers[i])).join('');
const svg=(contents,label,height=340)=>`<svg class="m28-svg" viewBox="0 0 760 ${height}" role="img" aria-label="${esc(label)}">${contents}</svg>`;
const colors=['#a7d4bd','#eac18a','#a8bed8','#caa5bf','#d8b49b'];
const fmt=x=>String(Number(x.toFixed(4)));
const tickLabel=(v,d)=>{const a=Math.floor(v/d),r=v%d;if(!r)return String(a);const gcd=(x,y)=>y?gcd(y,x%y):x,g=gcd(r,d);return (a?a+' ':'')+(r/g)+'/'+(d/g);};
function compareVisual(t,b){
 const max=Math.max(...t.items.map(x=>x.length)),vert=t.orientation==='height',scale=vert?Math.min(24,210/Math.max(max,1)):Math.min(38,500/Math.max(max,1));let s='';
 if(vert){const ground=292;t.items.forEach((it,i)=>{const x=130+i*175,base=ground-(i===1?b.offset*12:0),h=it.length*scale;s+=`<rect x="${x}" y="${base-h}" width="80" height="${h}" rx="8" fill="${colors[i%5]}" stroke="#577669" stroke-width="2"/><line x1="${x-18}" y1="${base}" x2="${x+98}" y2="${base}" stroke="#708c7c"/><text x="${x+40}" y="320" text-anchor="middle">${esc(it.name)}</text>`;});if(t.showRuler){const major=t.major||1,minor=major>=20?major/5:1;for(let n=0;n<=max;n+=minor){const y=ground-n*scale,big=n%major===0;s+=`<line x1="${big?65:73}" y1="${y}" x2="82" y2="${y}" stroke="#56766a"/>`;if(big)s+=`<text x="55" y="${y+5}" text-anchor="end">${n}</text>`;}s+=`<text x="42" y="38">${esc(t.rulerUnit||'cm')}</text>`;}}
 else t.items.forEach((it,i)=>{const x=120+(i===1&&t.mode!=='indirect'?b.offset*20:0),y=45+i*72,w=it.length*scale;s+=`<text x="20" y="${y+23}">${esc(it.name)}</text><rect x="${x}" y="${y}" width="${w}" height="32" rx="6" fill="${colors[i%5]}" stroke="#557968" stroke-width="2"/>`;if(t.mode==='indirect'&&b.copied.includes(i))s+=`<line x1="120" y1="${y+49}" x2="${120+w}" y2="${y+49}" stroke="#c08045" stroke-width="7" stroke-linecap="round"/>`;});
 if(t.showRuler&&!vert){const y=45+t.items.length*72,major=t.major||1,minor=major>=20?major/5:1;for(let i=0;i<=max;i+=minor){const x=120+i*scale,big=i%major===0;s+=`<line x1="${x}" y1="${y}" x2="${x}" y2="${y+(big?12:7)}" stroke="#56766a"/>`;if(big)s+=`<text x="${x}" y="${y+29}" text-anchor="middle">${i}</text>`;}s+=`<text x="${130+max*scale}" y="${y+29}">${esc(t.rulerUnit||'cm')}</text>`;}
 return svg(s,'比较同一尺度的物体，移动起点以对齐',Math.max(330,100+t.items.length*72));
}
function unitsVisual(t,b){
 const cell=Math.min(48,540/t.length),x=105,y=60;let s=`<rect x="${x}" y="${y}" width="${t.length*cell}" height="35" rx="8" fill="#e2c89d" stroke="#997f61"/><text x="12" y="${y+23}">${esc(t.object||'物体')}</text>`;
 for(const p of b.positions)s+=`<rect x="${x+p*cell}" y="128" width="${t.size*cell}" height="38" rx="5" fill="#93c6ae" fill-opacity=".78" stroke="#436f59" stroke-width="2"/>`;
 for(let i=0;i<t.length;i++){const X=x+i*cell;s+=`<line x1="${X}" y1="117" x2="${X}" y2="175" stroke="#a9bcae" stroke-dasharray="3 3"/>`;}
 s+=`<line x1="${x+t.length*cell}" y1="117" x2="${x+t.length*cell}" y2="175" stroke="#a9bcae"/>`;
 return svg(s,'放同样长的单位，检查是否有空隙或重叠',220);
}
function refineVisual(t,b){
 const cell=48,x=100,y=50,w=t.total*cell;let s=`<rect x="${x}" y="${y}" width="${w}" height="34" rx="8" fill="#e2c89d" stroke="#997f61"/><text x="12" y="${y+23}">${esc(t.object||'物体')}</text>`;
 for(let i=0;i<b.count;i++)s+=`<rect x="${x+i*b.size*cell}" y="120" width="${b.size*cell}" height="38" rx="5" fill="#9acbb3" stroke="#4e7862"/>`;
 if(b.size!==null&&t.total-b.count*b.size>0)s+=`<line x1="${x+b.count*b.size*cell}" y1="178" x2="${x+w}" y2="178" stroke="#c47b4f" stroke-width="5"/><text x="${x+w+10}" y="183">还剩</text>`;
 return svg(s,'用大小不同的单位测量同一个量，橙线表示还剩的部分',220);
}
function rulerVisual(t,b){
 const axis=t.axisMax??Math.max(t.value+2,10),tick=t.tick??1,actual=t.actual??t.value,px=520/axis,x=110,zero=x+b.offset*25;
 let s=`<text x="15" y="67">${esc(t.object||'物体')}</text><rect x="${x}" y="42" width="${actual*px}" height="35" rx="8" fill="#ddba87" stroke="#866b4b"/>`;
 if(t.estimate&&b.prediction===null){s+=`<rect x="${x}" y="130" width="${px}" height="18" fill="#88bba0"/><text x="${x}" y="175">这小段表示 1 ${esc(t.unit)}，先估计整段。</text>`;return svg(s,'先依据参照物估计长度',220);}
 s+=`<rect x="${zero-14}" y="120" width="${axis*px+28}" height="62" rx="5" fill="#f7f2d7" stroke="#a59b7b"/>`;
 const count=Math.round(axis/tick);for(let i=0;i<=count;i++){const v=i*tick,X=zero+v*px,major=Math.abs(v-Math.round(v))<1e-7;s+=`<line x1="${X}" y1="120" x2="${X}" y2="${major?143:132}" stroke="#5d705e"/>`;if(major)s+=`<text x="${X}" y="164" text-anchor="middle">${fmt(v)}</text>`;}
 s+=`<text x="${zero+axis*px+7}" y="164">${esc(t.unit)}</text>`;return svg(s,'物体与可移动零点的刻度尺',220);
}
function balanceVisual(t,b){
 const left=t.left?.mass??t.mass,right=t.mode==='compare'?t.right.mass:b.weights.reduce((x,y)=>x+y,0),delta=(t.mode==='weigh'||b.tested)?Math.sign(left-right):0,yl=150+delta*31,yr=150-delta*31;
 const obj=(x,y,o,color)=>`<rect x="${x-(o.size||32)}" y="${y-38-(o.size||32)}" width="${(o.size||32)*2}" height="${(o.size||32)*2}" rx="12" fill="${color}" stroke="#496c5b"/><text x="${x}" y="${y+30}" text-anchor="middle">${esc(o.name)}</text>`;
 let s=`<line x1="175" y1="${yl}" x2="585" y2="${yr}" stroke="#557669" stroke-width="7"/><path d="M380 150 L350 290 H410 Z" fill="#d8ceb0" stroke="#607967"/><line x1="175" y1="${yl}" x2="175" y2="${yl+70}" stroke="#597667"/><line x1="585" y1="${yr}" x2="585" y2="${yr+70}" stroke="#597667"/><path d="M115 ${yl+70} H235" stroke="#557669" stroke-width="8"/><path d="M525 ${yr+70} H645" stroke="#557669" stroke-width="8"/>`;
 const resting=t.mode==='compare'&&!b.tested;
 s+=obj(175,resting?100:yl+70,t.left||{name:t.object||'物体',size:30},colors[0]);
 if(t.mode==='compare')s+=obj(585,resting?100:yr+70,t.right,colors[1]);else s+=`<text x="585" y="${yr+46}" text-anchor="middle">${b.weights.length?b.weights.join(' + '):'还没有放'}</text><text x="585" y="${yr+96}" text-anchor="middle">${esc(t.unit)}</text>`;
 return svg(s,'天平，较重一侧下降，平衡表示两侧相等');
}
function scaleVisual(t){
 if(t.kind==='digital')return svg(`<rect x="220" y="55" width="320" height="150" rx="28" fill="#dce8dd" stroke="#668371" stroke-width="3"/><text x="380" y="149" text-anchor="middle" class="m28-digital">${esc(t.display)}</text><text x="380" y="185" text-anchor="middle">分 : 秒</text>`,'模拟秒表 '+t.display,240);
 if(t.kind==='dial'){
  const cx=380,cy=170,r=120,ang=v=>Math.PI*(.75+1.5*(v-t.min)/(t.max-t.min));let s=`<circle cx="${cx}" cy="${cy}" r="${r+18}" fill="#f2f4e6" stroke="#779181" stroke-width="3"/>`;
  for(let v=t.min;v<=t.max;v+=t.major){const a=ang(v),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,tx=cx+Math.cos(a)*(r-28),ty=cy+Math.sin(a)*(r-28);s+=`<line x1="${x}" y1="${y}" x2="${cx+Math.cos(a)*(r-12)}" y2="${cy+Math.sin(a)*(r-12)}" stroke="#52715f" stroke-width="3"/><text x="${tx}" y="${ty+5}" text-anchor="middle">${v}</text>`;}
  const a=ang(t.value);s+=`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*(r-36)}" y2="${cy+Math.sin(a)*(r-36)}" stroke="#b65d41" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="7" fill="#b65d41"/><text x="${cx}" y="${cy+55}" text-anchor="middle">${esc(t.unit)}</text>`;return svg(s,'指针秤与刻度',330);
 }
 if(t.kind==='ruler'){
  let s=`<rect x="70" y="85" width="600" height="65" rx="5" fill="#f7f2d7" stroke="#a49a7b"/>`,width=580/(t.max-t.min);
  for(let i=0;i<=Math.round((t.max-t.min)/t.minor);i++){const v=t.min+i*t.minor,x=80+(v-t.min)*width,major=Math.abs(v-Math.round(v))<1e-7;s+=`<line x1="${x}" y1="85" x2="${x}" y2="${major?111:98}" stroke="#597667"/>`;if(major)s+=`<text x="${x}" y="137" text-anchor="middle">${fmt(v)}</text>`;}
  const x=80+(t.value-t.min)*width;s+=`<line x1="${x}" y1="36" x2="${x}" y2="85" stroke="#b65d41" stroke-width="4"/><text x="675" y="135">${esc(t.unit)}</text>`;return svg(s,'标出终点的尺子',200);
 }
 const x=350,y=45,h=250,w=100,level=y+h-(t.value-t.min)/(t.max-t.min)*h;
 let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${t.kind==='thermo'?45:12}" fill="#edf2e5" stroke="#6b8d7b" stroke-width="3"/><rect x="${x+7}" y="${level}" width="${w-14}" height="${y+h-level-6}" fill="${t.kind==='thermo'?'#d68169':'#a3cfde'}" opacity=".85"/>`;
 for(let v=t.min;v<=t.max+1e-8;v+=t.major){const Y=y+h-(v-t.min)/(t.max-t.min)*h;s+=`<line x1="${x+w}" y1="${Y}" x2="${x+w+16}" y2="${Y}" stroke="#557665"/><text x="${x+w+24}" y="${Y+5}">${fmt(v)}</text>`;}
 s+=`<line x1="${x-15}" y1="${level}" x2="${x+w+3}" y2="${level}" stroke="#ad5f45" stroke-width="2"/><text x="${x+50}" y="320" text-anchor="middle">${esc(t.unit)}</text>`;return svg(s,t.kind==='thermo'?'温度计上的液面和刻度':'量杯上的液面和刻度');
}
function convertVisual(t,b){
 let s='';t.rows.forEach((r,i)=>{const y=25+i*95,x=220,top=320,raw=b.saved?.[i],ratio=raw!==undefined?Math.max(0,number(raw)/r.expected):0,w=Math.min(1.25,ratio)*top;
 s+=`<text x="12" y="${y+16}">${esc(r.label||r.value+' '+r.from)}</text><rect x="${x}" y="${y}" width="${top}" height="20" rx="5" fill="#9ccab4"/><text x="12" y="${y+53}">${esc(r.to)} ${raw!==undefined?esc(raw):'？'}</text><rect x="${x}" y="${y+36}" width="${Number.isFinite(w)?w:0}" height="20" rx="5" fill="#dfb481"/><line x1="${x+top}" y1="${y-5}" x2="${x+top}" y2="${y+65}" stroke="#668b73" stroke-dasharray="4 4"/>`;
 if(ratio>1.25)s+=`<text x="${x+top+12}" y="${y+53}">超出</text>`;
 });return svg(s,t.approx?'按题目给定近似关系画出的同尺度数量条':'同一尺度比较换单位前后的数量',Math.max(120,t.rows.length*95+10));
}
function vesselsVisual(t,b){
 const max=Math.max(...t.capacities),base=270,scale=205/max;let s='';t.capacities.forEach((n,i)=>{const x=100+i*185,h=n*scale,level=b.levels[i]*scale;s+=`<rect x="${x}" y="${base-h}" width="95" height="${h}" rx="10" fill="#f7faf3" stroke="${b.selected===i?'#b47e43':'#739181'}" stroke-width="${b.selected===i?4:2}"/><rect x="${x+6}" y="${base-level}" width="83" height="${level}" fill="#a5d5df"/><text x="${x+48}" y="305" text-anchor="middle">${esc(t.names?.[i]||'容器'+(i+1))}</text>`;if(b.seen.includes(i))s+=`<text x="${x+48}" y="${base-h-9}" text-anchor="middle">${n} mL</text>`;});return svg(s,'模拟容器，液面按倒入量升高',330);
}
function plotVisual(t,b){
 const max=t.end/t.den,px=550/max,x=125,raw=t.raw[b.selected]/t.rawDen,y=45;let s=`<text x="15" y="68">${esc(t.names?.[b.selected]||'物体'+(b.selected+1))}</text><rect x="${x}" y="42" width="${raw*px}" height="26" rx="5" fill="#e6b989" stroke="#98764f"/><line x1="${x}" y1="93" x2="${x+max*px}" y2="93" stroke="#537666" stroke-width="2"/>`;
 for(let n=0;n<=t.end;n++){const xx=x+n/t.den*px,whole=n%t.den===0;s+=`<line x1="${xx}" y1="93" x2="${xx}" y2="${whole?110:102}" stroke="#607f6a"/>`;if(whole)s+=`<text x="${xx}" y="128" text-anchor="middle">${n/t.den}</text>`;}
 s+=`<text x="${x+max*px+8}" y="128">${esc(t.unit)}</text><line x1="105" y1="290" x2="685" y2="290" stroke="#537666" stroke-width="2"/>`;
 const count=t.end-t.start,step=580/Math.max(count,1);for(let i=0;i<=count;i++){const xx=105+i*step,v=t.start+i;s+=`<line x1="${xx}" y1="285" x2="${xx}" y2="298" stroke="#537666"/><text x="${xx}" y="320" text-anchor="middle">${esc(tickLabel(v,t.den))}</text>`;for(let j=0;j<b.marks[i];j++)s+=`<circle cx="${xx}" cy="${276-j*20}" r="7" fill="#65977b"/>`;s+=`<rect x="${xx-step*.4}" y="165" width="${step*.8}" height="125" fill="transparent" role="button" tabindex="0" aria-label="在 ${esc(tickLabel(v,t.den))} 加一个点" data-x="m28-mark" data-index="${i}"/>`;}
 return svg(s,'先量物体，再在带分数刻度的点图上放点',345);
}
export function visual(t,m){const b=m.board;let v='';if(t.type==='x-m28-compare')v=compareVisual(t,b);if(t.type==='x-m28-units')v=unitsVisual(t,b);if(t.type==='x-m28-refine')v=refineVisual(t,b);if(t.type==='x-m28-ruler')v=rulerVisual(t,b);if(t.type==='x-m28-balance')v=balanceVisual(t,b);if(t.type==='x-m28-scale')v=scaleVisual(t);if(t.type==='x-m28-convert')v=convertVisual(t,b);if(t.type==='x-m28-vessels')v=vesselsVisual(t,b);if(t.type==='x-m28-plot')v=plotVisual(t,b);return `<div class="m28-world">${v}</div>`;}
export function controls(t,m){
 const b=m.board;let s='<div class="m28-controls">';
 if(['x-m28-compare','x-m28-ruler'].includes(t.type)&&t.mode!=='indirect')s+=`<label class="m28-range">移动起点 <input type="range" min="-3" max="3" step="1" data-xfield="offset" value="${esc(m.offset)}" aria-label="移动起点"></label>`;
 if(t.type==='x-m28-compare'){
  if(t.mode==='indirect')s+=`<p>分别用同一根纸条记下长度。</p><div class="m28-buttons">`+t.items.map((x,i)=>btn('copy','记下'+x.name,i,b.copied.includes(i))).join('')+'</div>';
  if(t.mode==='order')s+=`<p>从短到长依次选择：${b.order.map(i=>esc(t.items[i].name)).join(' → ')||'还没有'}</p><div class="m28-buttons">`+t.items.map((x,i)=>btn('order',x.name,i,b.order.includes(i))).join('')+'</div>'+btn('clear','重新排列');
  else s+='<p>'+esc(t.ask||'比较另一端，哪个更长？')+'</p><div class="m28-buttons">'+t.choices.map(c=>btn('choice',c.label,c.id,b.choice===c.id)).join('')+'</div>';
 }
 if(t.type==='x-m28-units'){
  s+=`<p>每块一样长：在下面选放置起点；再次选择同一位置可拿走。</p><div class="m28-buttons">`+Array.from({length:t.length-t.size+1},(_,i)=>btn('place','位置 '+(i+1),i,b.positions.includes(i))).join('')+'</div>'+btn('clear','全部拿走');
  s+=`<p>已放 ${b.positions.length} 块。每个位置都恰好盖一次，才没有空隙或重叠。</p>`+field('measure','用了几个单位',m.measure)+unit(t,m)+btn('record','记下测量');
 }
 if(t.type==='x-m28-refine'){
  s+='<p>分别选两种大小，用完整的单位排一排。</p><div class="m28-buttons">'+t.sizes.map(u=>btn('size',u.label,u.size,b.size===u.size)).join('')+'</div>'+btn('add','放一个')+btn('remove','拿走一个')+`<p>已放 ${b.count} 个；橙线是还没有量满的部分。</p>`+field('measure','放了几个完整单位',m.measure)+btn('record','记下这一种');
  if(b.runs.length)s+='<p>'+b.runs.map(r=>esc(t.sizes.find(u=>u.size===r.size).label)+'：'+r.count+' 个'+(r.remainder?'，还剩一小段':'，正好量完')).join('；')+'</p>';
 }
 if(t.type==='x-m28-ruler'){
  if(t.tools)s+='<p>先选适合的工具。</p><div class="m28-buttons">'+t.tools.map(x=>btn('tool',x.label,x.id,b.tool===x.id)).join('')+'</div>';
  if(t.estimate&&b.prediction===null)s+=field('estimate','先估计长度（'+t.unit+'）',m.estimate)+btn('predict','留下估计');
  if(!t.estimate||b.prediction!==null){if(t.estimate)s+=`<p>刚才估计：${esc(b.prediction)} ${esc(t.unit)}。</p>`;s+=field('measure','读出的长度',m.measure)+unit(t,m)+btn('record','记下测量');if(t.estimate)s+=field('error','估计与量出的长度相差多少',m.error);}
 }
 if(t.type==='x-m28-balance'){
  if(t.mode==='compare')s+=btn('test','放上天平看看')+(b.tested?'<p>哪边更重？</p><div class="m28-buttons">'+t.choices.map(c=>btn('choice',c.label,c.id,b.choice===c.id)).join('')+'</div>':'');
  else{s+='<p>把右边的砝码一块块放上去，让天平平衡。</p><div class="m28-buttons">'+t.weights.map(x=>btn('weight','放 '+x+' '+t.unit,x)).join('')+'</div>'+btn('remove','拿走最后一块')+field('measure','平衡时一共多少',m.measure)+unit(t,m)+btn('record','记下测量');}
 }
 if(t.type==='x-m28-scale')s+=field('measure',t.readLabel||'读到的数字',m.measure)+unit(t,m)+btn('record','记下读数');
 if(t.type==='x-m28-convert'){
  if(t.hint)s+=`<p>${esc(t.hint)}</p>`;if(t.approx)s+='<p>这是按给定近似关系比较，结果用“约”。</p>';
  s+=t.rows.map((r,i)=>field('values.'+i,(r.label||r.value+' '+r.from)+' 换成 '+r.to,m.values[i])).join('')+btn('convert','把两条放在同一尺度上比较');
 }
 if(t.type==='x-m28-vessels'){
  s+='<div class="m28-buttons">'+t.capacities.map((_,i)=>btn('select',t.names?.[i]||'容器'+(i+1),i,b.selected===i)).join('')+'</div><p>选一个量杯，一杯一杯倒进去。</p><div class="m28-buttons">'+t.units.map(u=>btn('vunit',u.label,u.id,b.unit===u.id)).join('')+'</div>'+btn('pour','倒入一杯')+btn('seen','装满了，记下来');
  if(t.mode!=='precision'&&b.seen.length===t.capacities.length)s+='<p>从能装得最少到最多依次选择：'+(b.order.map(i=>esc(t.names?.[i]||'容器'+(i+1))).join(' → ')||'还没有')+'</p><div class="m28-buttons">'+t.capacities.map((_,i)=>btn('order',t.names?.[i]||'容器'+(i+1),i,b.order.includes(i))).join('')+'</div>'+btn('clear','重新排列');
 }
 if(t.type==='x-m28-plot'){
  s+='<p>先逐个量，记录到最近的 '+esc(t.den===1?'整'+t.unit:'1/'+t.den+' '+t.unit)+'。</p><div class="m28-buttons">'+t.raw.map((_,i)=>btn('select',t.names?.[i]||'物体'+(i+1),i,b.selected===i)).join('')+'</div>'+field('measure','这个物体的长度（可写成 2 1/4）',m.measure)+btn('record','记下这一个');
  s+='<p>已记下 '+b.records.filter(x=>x!==null).length+' / '+t.raw.length+'。点击下方数轴加点，一条记录放一个。</p><details><summary>用按钮加点或撤回</summary><div class="m28-buttons">'+b.marks.map((n,i)=>btn('mark',tickLabel(t.start+i,t.den)+' ＋',i)+ (n?btn('unmark',tickLabel(t.start+i,t.den)+' −',i):'')).join('')+'</div></details>';
 }
 s+=qs(t,m);if(m.issue)s+=`<p class="m28-issue" role="status">${esc(m.issue)}</p>`;
 if(inspect(t,m).correct)s+='<p class="m28-success">操作和记录对上了，还可以再看看。</p>';
 s+=`<details><summary>用自己的话留下发现（可选）</summary>`+field('prose','我的解释或新问题',m.prose)+'<small>原话会保存，暂不自动判断。</small></details></div>';return s;
}
export const render=(t,m)=>`<div id="extra-visual">${visual(t,m)}</div><div id="extra-controls">${controls(t,m)}</div>`;
