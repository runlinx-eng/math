const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(a,label,i,pressed=false)=>`<button type="button" data-x="m31-${a}"${i===undefined?'':` data-index="${esc(i)}"`} aria-pressed="${!!pressed}">${esc(label)}</button>`;
const field=(key,label,value,placeholder='')=>`<label class="m31-field">${esc(label)}<input data-xfield="${esc(key)}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></label>`;
const select=(key,label,value,options)=>`<label class="m31-field">${esc(label)}<select data-xfield="${esc(key)}"><option value="">选择</option>${options.map(([v,l])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
const units=(key,label,value)=>select(key,label,value,[['mL','mL'],['L','L'],['g','g'],['kg','kg'],['cm²','cm²'],['cm³','cm³'],['ft²','ft²'],['ft³','ft³']]);
const svg=(s,label,h=300)=>`<svg viewBox="0 0 760 ${h}" role="img" aria-label="${esc(label)}">${s}</svg>`;
function compare(t,b){const maxShape=Math.max(...t.capacities.map((v,i)=>v/(t.widths[i]-8))),scale=185/maxShape,base=220;let s='';
 for(let i=0;i<2;i++){const x=80+i*160,w=t.widths[i],h=t.capacities[i]/(w-8)*scale,lh=h*b.amounts[i]/t.capacities[i];s+=`<rect x="${x}" y="${base-h}" width="${w}" height="${h}" rx="8" fill="#f9fbf6" stroke="#779481" stroke-width="3"/><rect x="${x+4}" y="${base-lh}" width="${w-8}" height="${lh}" fill="#9ccfda" opacity=".9"/><text x="${x+w/2}" y="${base+25}" text-anchor="middle">${esc(t.names[i])}</text>`;}
 const max=Math.max(...t.amounts)*1.12;
 for(let i=0;i<2;i++){const x=435+i*125,h=160,w=75,lh=h*b.poured[i]/max;s+=`<rect x="${x}" y="${base-h}" width="${w}" height="${h}" rx="8" fill="#f9fbf6" stroke="#729583" stroke-width="3"/><rect x="${x+4}" y="${base-lh}" width="${w-8}" height="${lh}" fill="#9ccfda"/><text x="${x+w/2}" y="${base+25}" text-anchor="middle">${esc(t.names[i])}倒入</text>`;}
 s+='<text x="520" y="275" text-anchor="middle">左边容器一样厚；右边的杯子一样</text>';return svg(s,'不同形状的容器和两个相同的比较杯',300);
}
function fill(t,b){const x=200,y=35,w=150,h=200,level=h*b.level/t.capacity;const u=t.units.find(u=>u.id===b.unit);let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#f8faf5" stroke="#6c8d79" stroke-width="3"/><rect x="${x+5}" y="${y+h-level}" width="${w-10}" height="${level}" fill="#9ecfdc"/><line x1="${x-14}" y1="${y+h*(1-t.goal/t.capacity)}" x2="${x+w+10}" y2="${y+h*(1-t.goal/t.capacity)}" stroke="#b87250" stroke-dasharray="6 4"/><text x="${x+w+20}" y="${y+h*(1-t.goal/t.capacity)+5}">要到这里</text><text x="${x+w/2}" y="265" text-anchor="middle">容器能装 ${t.capacity} mL</text>`;
 if(u)s+=`<rect x="470" y="145" width="85" height="85" rx="7" fill="#a6d5df" stroke="#678a79" stroke-width="3"/><text x="512" y="255" text-anchor="middle">${esc(u.label)}</text>`;return svg(s,'用同样大小的量杯倒水，目标位置用虚线表示',290);
}
function balance(t,b){const pair=b.last===null?null:t.pairs[b.last],[L,R]=pair||[0,1],left=t.objects[L],right=t.objects[R],sign=pair?Math.sign(left.mass-right.mass):0,cy=135,tilt=sign*22;let s=`<path d="M380 130 L345 250 H415 Z" fill="#d8e2d6" stroke="#708c78" stroke-width="3"/><line x1="200" y1="${cy+tilt}" x2="560" y2="${cy-tilt}" stroke="#567764" stroke-width="8"/><circle cx="380" cy="135" r="8" fill="#567764"/>`;
 if(pair){for(const [x,y,o] of [[200,cy+tilt,left],[560,cy-tilt,right]])s+=`<line x1="${x}" y1="${y}" x2="${x}" y2="${y+55}" stroke="#678974" stroke-width="3"/><path d="M${x-58} ${y+55} Q${x} ${y+80} ${x+58} ${y+55}" fill="#ebd6a7" stroke="#728b76" stroke-width="3"/><circle cx="${x}" cy="${y+36}" r="18" fill="#d3ae7e"/><text x="${x}" y="${y+100}" text-anchor="middle">${esc(o.name)}</text>`;}
 else s+='<text x="380" y="290" text-anchor="middle">选两件东西放上同一架天平</text>';return svg(s,'模拟天平：较低的一边较重',310);
}
function meter(t,b){if(b.prediction===null)return svg('<text x="380" y="135" text-anchor="middle">先估一估，再看仪器</text>','估计后显示仪器',230);const x=250,y=30,w=160,h=220,span=t.max-t.min,value=t.valueN/t.valueD,minor=t.minorN/t.minorD,level=y+h-(value-t.min)/span*h;let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${t.kind==='jug'?10:4}" fill="#f8faf5" stroke="#71907b" stroke-width="3"/>`;
 if(t.kind==='jug')s+=`<rect x="${x+5}" y="${level}" width="${w-10}" height="${y+h-level}" fill="#a5d5df"/><line x1="${x-8}" y1="${level}" x2="${x+w+10}" y2="${level}" stroke="#a75e42" stroke-width="3"/>`;
 else s+=`<line x1="${x-20}" y1="${level}" x2="${x+w+15}" y2="${level}" stroke="#a75e42" stroke-width="4"/>`;
 const count=Math.round(span/minor);for(let i=0;i<=count;i++){const v=t.min+i*minor,Y=y+h-i*h/count,major=Math.abs((v-t.min)/t.major-Math.round((v-t.min)/t.major))<1e-7;s+=`<line x1="${x+w}" y1="${Y}" x2="${x+w+(major?20:10)}" y2="${Y}" stroke="#527564" stroke-width="${major?2:1}"/>`;if(major)s+=`<text x="${x+w+27}" y="${Y+5}">${Number(v.toFixed(3))}</text>`;}
 s+=`<text x="${x+w/2}" y="280" text-anchor="middle">${esc(t.unit)}</text>`;return svg(s,t.kind==='jug'?'量杯液面与刻度':'模拟质量秤的指针与刻度',300);
}
export function visual(t,m){let v='';if(t.type==='x-m31-compare')v=compare(t,m.board);else if(t.type==='x-m31-fill')v=fill(t,m.board);else if(t.type==='x-m31-balance')v=balance(t,m.board);else if(t.type==='x-m31-meter')v=meter(t,m.board);return `<div class="m31-world">${v}</div>`;}
export function controls(t,m){const b=m.board;let s='<div class="m31-controls">';
 if(t.type==='x-m31-compare'){
  if(b.prediction===null)s+='<p>先猜一猜：</p><div class="m31-buttons">'+[['left',t.names[0]+'更多'],['right',t.names[1]+'更多'],['equal','一样多']].map(([v,l])=>btn('guess',l,v)).join('')+'</div>';
  else {s+='<p>把两份倒进一样的杯子，再比较。</p><div class="m31-buttons">'+t.names.map((n,i)=>btn('pour','倒出'+n,i,b.poured[i]>0)).join('')+'</div>';if(b.poured.every((n,i)=>n===t.amounts[i]))s+='<p>现在怎样？</p><div class="m31-buttons">'+[['left',t.names[0]+'更多'],['right',t.names[1]+'更多'],['equal','一样多']].map(([v,l])=>btn('choice',l,v,b.choice===v)).join('')+'</div>';}
 }
 if(t.type==='x-m31-fill'){
  s+='<div class="m31-buttons">'+t.units.map(u=>btn('choose',u.label,u.id,b.unit===u.id)).join('')+'</div>';
  if(b.unit){s+=btn('add','倒一杯')+btn('reset','重新倒')+`<p>已倒 ${b.count} 杯。${b.runs.length?`已记录 ${b.runs.length} 种量杯。`:''}</p>`;if(b.level===t.goal)s+=field('count','用了几杯',m.count)+field('amount','现在有多少',m.amount)+units('unit','单位',m.unit)+btn('record','记下来');}
 }
 if(t.type==='x-m31-balance'){
  s+='<div class="m31-buttons">'+t.pairs.map(([a,c],i)=>btn('test','比较'+t.objects[a].name+'和'+t.objects[c].name,i,b.tested.includes(i))).join('')+'</div>';
  if(b.tested.length){s+='<p>已经比较：</p><div class="m31-facts">'+b.tested.map(i=>{const[a,c]=t.pairs[i],A=t.objects[a],C=t.objects[c];return `${esc(A.name)} ${A.mass>C.mass?'＞':A.mass<C.mass?'＜':'＝'} ${esc(C.name)}`;}).join('　')+'</div>';}
  if(b.tested.length===t.pairs.length)s+='<p>从轻到重，依次点选：</p><div class="m31-buttons">'+t.objects.map((o,i)=>btn('order',o.name,i,b.order.includes(i))).join('')+'</div><p>目前顺序：'+b.order.map(i=>esc(t.objects[i].name)).join(' → ')+'</p>'+btn('clear','重新排序');
 }
 if(t.type==='x-m31-meter'){
  if(b.prediction===null)s+=field('estimate','先估计，大约多少 '+t.unit,m.estimate)+btn('predict','看仪器');
  else s+=`<p>你先估了 ${esc(b.prediction)} ${esc(t.unit)}。看看刻度。</p>`+field('step','每小段是多少 '+t.unit,m.step)+field('reading','读出多少',m.reading)+units('unit','单位',m.unit)+btn('meter','记下读数');
 }
 if(t.type==='x-m31-cubes'){
  const total=t.grid.reduce((a,x)=>a*x,1),next=Array.from({length:total},(_,i)=>i).find(i=>!b.filled.includes(i));
  s+=`<p>每个小块的边长是 1/${t.den} ${esc(t.unit)}。已放 ${b.filled.length} / ${total} 块。</p><div class="m31-buttons">`+(next===undefined?'':btn('fill','放一块',next))+btn('remove','拿回一块')+btn('spread',b.spread?'合起各层':'打开各层')+`<button type="button" data-x="turn-extra">转一转</button></div>`;
  if(b.filled.length===total&&!b.plan)s+=field('perLayer','每层有几块',m.perLayer)+field('layers','有几层',m.layers)+field('total','一共几块',m.total)+btn('plan','记下块数');
  if(b.plan)s+=`<p>每层 ${esc(b.plan.perLayer)} 块 × ${esc(b.plan.layers)} 层 = ${esc(b.plan.total)} 块。</p>`;
  if(b.plan&&!b.part)s+=field('oneCube','一小块是多少立方单位',m.oneCube,'例如 1/8')+field('base','底面积是多少平方单位',m.base,'例如 3/2')+btn('part','记下大小');
  if(b.part)s+=`<p>每小块 ${esc(b.part.oneCube)} ${esc(t.unit)}³；底面 ${esc(b.part.base)} ${esc(t.unit)}²。</p>`+field('volume','小块加起来的体积',m.volume,'例如 3 3/4')+field('product','按长宽高算出的体积',m.product,'例如 15/4')+units('unit','体积单位',m.unit);
 }
 if(t.type==='x-m31-product')s+=`<button type="button" data-x="turn-extra">转一转</button><p>长 ${esc(t.labels[0])}、宽 ${esc(t.labels[1])}、深 ${esc(t.labels[2])} ${esc(t.unit)}。</p>`+field('base','底面积',m.base,'例如 27/8')+field('volume','底面积 × 深度',m.volume,'例如 2 1/4')+field('product','长 × 宽 × 深',m.product)+units('unit','体积单位',m.unit);
 for(const [i,q]of(t.questions||[]).entries())s+=q.options?select('answers.'+i,q.label,m.answers[i],q.options):field('answers.'+i,q.label,m.answers[i]);
 if(m.issue)s+=`<p role="status" class="m31-issue">${esc(m.issue)}</p>`;
 return s+`<details><summary>留下自己的想法（可选）</summary>${field('prose','我的解释或新问题',m.prose)}<small>原话会保存，暂不自动判断。</small></details></div>`;
}
export const render=(t,m)=>['x-m31-cubes','x-m31-product'].includes(t.type)?`<div id="extra-world" class="cube-world m31-solid"></div><div id="extra-controls">${controls(t,m)}</div>`:`<div id="extra-visual">${visual(t,m)}</div><div id="extra-controls">${controls(t,m)}</div>`;
