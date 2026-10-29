import {coinTotal,money} from './b33-model.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(action,label,index,pressed=false)=>`<button type="button" data-x="m33-${action}"${index===undefined?'':` data-index="${esc(index)}"`} aria-pressed="${!!pressed}">${esc(label)}</button>`;
const input=(key,label,value,placeholder='')=>`<label class="m33-field"><span>${esc(label)}</span><input data-xfield="${esc(key)}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></label>`;
const select=(key,label,value,options)=>`<label class="m33-field"><span>${esc(label)}</span><select data-xfield="${esc(key)}"><option value="">选择</option>${options.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
const coin=(d,n=0)=>`<span class="m33-token ${d.record?'record':d.note?'note':'coin'} ${d.tone==='silver'?'silver':''} ${d.shape==='twelve'?'twelve':''}"${d.size?` style="--coin-size:${Number(d.size)}px"`:''}><span>${esc(d.label)}</span>${n?`<small>× ${n}</small>`:''}</span>`;
function coins(t,b){const values=b.counts.map((n,i)=>n?`<button type="button" class="m33-coin-button" data-x="m33-remove" data-index="${i}" aria-label="从桌面拿回一枚${esc(t.denoms[i].label)}">${coin(t.denoms[i],n)}</button>`:'').join('');const saved=b.saved.slice(-4).map((x,j)=>`<span>第${b.saved.length-Math.min(4,b.saved.length)+j+1}次：${x.counts.map((n,i)=>n?`${esc(t.denoms[i].label)}${n>1?' × '+n:''}`:'').filter(Boolean).join(' ＋ ')||'空'} ＝ ${esc(money(x.total,t.currency))}</span>`).join('');return `<div class="m33-heading">${esc(t.placeLabel||'桌面上选的钱')}</div><div class="m33-stage">${values||'<span class="m33-empty">点下面的钱放到这里</span>'}</div><div class="m33-total">当前合计：${esc(money(coinTotal(t,b.counts),t.currency))}</div>${saved?`<div class="m33-saved">${saved}</div>`:''}`;}
function sort(t,b){return `<div class="m33-heading">${esc(t.sceneLabel||'选一类，再放入卡片')}</div><div class="m33-sort">${t.groups.map(g=>`<section><strong>${esc(g.label)}</strong><div class="m33-stage">${b.placed.map((p,i)=>p===g.id?coin(t.cards[i]):'').join('')||'<span class="m33-empty">还没有</span>'}</div></section>`).join('')}</div>`;}
function cart(t,b){const total=b.selected.reduce((s,i)=>s+t.items[i].cents,0);if(!b.revealed)return `<div class="m33-heading">${esc(t.intro||'先猜一猜')}</div><div class="m33-stage">${t.items.map(x=>`<div class="m33-item">${esc(x.name)}<strong>${esc(money(x.cents,t.currency))}</strong></div>`).join('')}</div>`;return `<div class="m33-heading">${esc(t.sceneLabel||'放进选择篮')}</div><div class="m33-stage">${b.selected.map(i=>`<div class="m33-item">${esc(t.items[i].name)}<strong>${esc(money(t.items[i].cents,t.currency))}</strong></div>`).join('')||'<span class="m33-empty">还没有选</span>'}</div><div class="m33-total">合计 ${esc(money(total,t.currency))}${t.budget?`　·　预算 ${esc(money(t.budget,t.currency))}${total<=t.budget?`　·　余下 ${esc(money(t.budget-total,t.currency))}`:'　·　超过预算'}`:''}</div>`;}
function compare(t,b){const bars=t.items.map((x,i)=>{const width=b.revealed?Math.max(10,Math.round(250*x.value/Math.max(...t.items.map(y=>y.value)))):0;return `<div class="m33-comparison"><span>${esc(x.label)}</span><div class="m33-bar"><i style="width:${width}px"></i></div>${b.revealed?`<strong>${esc(x.detail)}</strong>`:''}</div>`;}).join('');return `<div class="m33-heading">${esc(t.sceneLabel||'把两边放在同一把尺上')}</div><div class="m33-compare">${bars}</div>${b.revealed&&t.note?`<p>${esc(t.note)}</p>`:''}`;}
function calculator(t,b,m){const refs=Object.entries(t.refs||{});return `<div class="m33-heading">${t.type==='x-m33-sheet'?'小表格':'计算台'}</div><div class="m33-table">${refs.map(([k,v])=>`<div><b>${esc(k)}</b><span>${esc(t.labels?.[k]||'价格')}</span><strong>${esc(money(v,t.currency))}</strong></div>`).join('')||`<p>${esc(t.intro||'先估一估，再把算式放进来。')}</p>`}</div><div class="m33-display">${b.last&&b.last.formula!==m.formula?'算式已改变，请重新计算':b.last?.result===null||!b.last?'还没有计算':esc(money(b.last.result,t.currency))}</div>`;}
function model(t,b){if(!b.method)return '<div class="m33-stage">先选一种你想用的表示。</div>';if(b.method==='bar')return `<div class="m33-heading">整段 ${t.whole} ${esc(t.unit)}</div><div class="m33-modelbar"><span style="width:${100*t.known/t.whole}%">剪掉 ${t.known}</span><span>剩下 ?</span></div>`;if(b.method==='line')return `<div class="m33-stage m33-equation">${t.whole} ${esc(t.unit)}　— 剪掉 ${t.known} →　?</div>`;return `<div class="m33-stage m33-equation">${t.whole} − ${t.known} = ? ${esc(t.unit)}</div>`;}
export function visual(t,m){const b=m.board;let body=t.type==='x-m33-coins'?coins(t,b):t.type==='x-m33-sort'?sort(t,b):t.type==='x-m33-cart'?cart(t,b):t.type==='x-m33-compare'?compare(t,b):t.type==='x-m33-model'?model(t,b):calculator(t,b,m);return `<div class="m33-world">${body}</div>`;}
export function controls(t,m){const b=m.board;let s='<div class="m33-controls">';
 if(t.type==='x-m33-coins'){
  s+=`<p>点钱放入；点桌面上的钱可拿回一枚。</p><div class="m33-denoms">${t.denoms.map((d,i)=>!t.visibleIndices||t.visibleIndices.includes(i)?`<button type="button" class="m33-coin-button" data-x="m33-add" data-index="${i}" aria-label="放入一枚${esc(d.label)}">${coin(d)}</button>`:'').join('')}</div><div class="m33-buttons">${btn('save','记下这次摆法')}${btn('clear','重新摆')}</div>`;
 }
 if(t.type==='x-m33-sort'){
  s+=`<p>先选类别，再点卡片；选另一类可以改。</p><div class="m33-buttons">${t.groups.map(g=>btn('group',g.label,g.id,b.group===g.id)).join('')}</div><div class="m33-buttons">${t.cards.map((c,i)=>btn('place',c.label,i,b.placed[i]!==null)).join('')}</div>${btn('clear','重新分')}`;
 }
 if(t.type==='x-m33-cart'){
  if(t.estimate&&b.estimate===null)s+=input('estimate',t.estimateLabel||'先估一个大概',m.estimate)+btn('estimate','记下估计');
  else if(!b.revealed)s+=btn('reveal','看看选择');
  else s+=`<p>点选想放进篮子的东西，再点一次可拿出。</p><div class="m33-buttons">${t.items.map((x,i)=>btn('choose',`${x.name} ${money(x.cents,t.currency)}`,i,b.selected.includes(i))).join('')}</div>${btn('clear','重新选')}`;
 }
 if(t.type==='x-m33-compare'){
  if(b.guess===null)s+=`<p>先猜一猜。</p><div class="m33-buttons">${[['left',t.items[0].label],['right',t.items[1].label],['equal','一样']].map(([i,l])=>btn('guess',l,i)).join('')}</div>`;
  else if(!b.revealed)s+=btn('reveal','换成相同单位');
  else s+=`<p>现在选择结果。</p><div class="m33-buttons">${[['left',t.items[0].label],['right',t.items[1].label],['equal','一样']].map(([i,l])=>btn('pick',l,i,b.choice===i)).join('')}</div>`;
 }
 if(t.type==='x-m33-model')s+=`<div class="m33-buttons">${[['bar','画成一条'],['line','沿数轴走'],['equation','写成算式']].map(([i,l])=>btn('method',l,i,b.method===i)).join('')}</div>`;
 if(t.type==='x-m33-calc'||t.type==='x-m33-sheet'){
  if(t.estimate&&b.estimate===null)s+=input('estimate',t.estimateLabel||'先估一个大概',m.estimate)+btn('estimate','记下估计');
  else s+=input('formula',t.type==='x-m33-sheet'?'在结果格写公式':'输入算式',m.formula,t.placeholder||'=A1+A2')+btn('run','计算');
 }
 const ready=t.type==='x-m33-compare'?b.revealed:t.type==='x-m33-cart'?b.revealed:!t.estimate||b.estimate!==null;
 if(ready)for(const[i,q]of(t.questions||[]).entries())s+=q.options?select('answers.'+i,q.label,m.answers[i],q.options):input('answers.'+i,q.label,m.answers[i],q.kind==='major'?(t.currency==='GBP'?'例如 £1.50':'例如 $1.50'):q.kind==='minor'?'填小单位数':'');
 if(m.issue)s+=`<p class="m33-issue" role="status">${esc(m.issue)}</p>`;
 return s+`<details><summary>留下自己的想法（可选）</summary>${input('prose','我的解释或新问题',m.prose)}<small>原话会保存，暂不自动判断。</small></details></div>`;
}
export const render=(t,m)=>`<div id="extra-visual">${visual(t,m)}</div><div id="extra-controls">${controls(t,m)}</div>`;
