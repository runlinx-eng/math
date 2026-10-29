// B12: construct a story model, then connect the child's chosen calculation steps.
export const TYPES=new Set(['x-storyparts','x-storyplan']);
const clone=x=>structuredClone(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const integer=(x,min=-1000000000,max=1000000000)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const text=x=>typeof x==='string'&&x.length<=2000;
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const methods=new Set(['mental','written','tool']);
export function number(s){if(!text(s))return null;const n=s.trim().replace(/[−–－]/g,'-').replace(/＋/g,'+');if(!/^[+-]?\d{1,10}$/.test(n))return null;const v=Number(n);return integer(v)?v:null;}
export const target=t=>sum(t.values.map((v,i)=>v*(t.type==='x-storyparts'?1:t.signs[i])));
const signs=t=>t.type==='x-storyparts'?t.values.map(()=>1):t.signs;
const taskValid=t=>TYPES.has(t.type)&&Array.isArray(t.values)&&t.values.length===3&&t.values.every(n=>integer(n,0,t.type==='x-storyparts'?20:1000000))&&(t.type==='x-storyparts'?t.pairTotal===undefined||integer(t.pairTotal,0,40):Array.isArray(t.signs)&&t.signs.length===3&&t.signs.every(s=>s===1||s===-1)&&t.signs.includes(1));
const idsValid=ids=>Array.isArray(ids)&&ids.length>=1&&ids.length<=3&&new Set(ids).size===ids.length&&ids.every(i=>integer(i,0,2));
const pairValid=ids=>idsValid(ids)&&ids.length===2;
const lengthsValid=ls=>Array.isArray(ls)&&ls.length===3&&ls.every(n=>integer(n,0,20));
const key=g=>g.ids.join(',');
const blank=()=>[0,0,0];
const leaf=(t,id)=>({ids:[id],value:t.values[id],coeffs:blank().map((_,i)=>i===id?1:0),tree:{id}});
const base=t=>t.values.map((_,i)=>leaf(t,i));
const join=(a,b,op)=>({ids:[...a.ids,...b.ids],value:a.value+(op==='+'?b.value:-b.value),coeffs:a.coeffs.map((x,i)=>x+(op==='+'?b.coeffs[i]:-b.coeffs[i])),tree:{op,left:clone(a.tree),right:clone(b.tree)}});
export function expression(t,tree){return tree.id!==undefined?String(t.values[tree.id]):`(${expression(t,tree.left)}${tree.op}${expression(t,tree.right)})`;}

// A small linear grammar, never JavaScript evaluation. The unknown can be in any
// position: □−12+5=38 and □=38+12−5 describe the same missing start.
export function equationMatches(t,raw){try{
 if(!taskValid(t)||!text(raw)||raw.length>200)return false;
 const s=raw.replace(/\s/g,'').replace(/[−–－]/g,'-').replace(/＋/g,'+').replace(/＝/g,'=').replace(/[?？xX]/g,'□');
 if(!/^[\d+\-()=□]+$/.test(s)||s.split('=').length!==2)return false;
 let tokens=s.match(/\d+|[+\-()=□]/g);if(tokens.length>80)return false;
 let at=0,unknowns=0;const leaves=[];
 const add=(a,b,sign=1)=>({u:a.u+sign*b.u,terms:[...a.terms,...b.terms.map(v=>({...v,sign:v.sign*sign}))]});
 function factor(depth){if(depth>24)throw Error('deep');const token=tokens[at++];
  if(token==='+'||token==='-'){const r=factor(depth+1);return token==='-'?{u:-r.u,terms:r.terms.map(v=>({...v,sign:-v.sign}))}:r;}
  if(token==='('){const r=expr(depth+1);if(tokens[at++]!==')')throw Error('close');return r;}
  if(token==='□'){unknowns++;return{u:1,terms:[]};}
  if(!/^\d{1,10}$/.test(token||''))throw Error('number');const v=Number(token);if(!integer(v,0))throw Error('range');leaves.push(v);return{u:0,terms:[{value:v,sign:1}]};
 }
 function expr(depth){let r=factor(depth);while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++];r=add(r,factor(depth),op==='+'?1:-1);}return r;}
 const left=expr(0);if(tokens[at++]!=='=')return false;const right=expr(0);if(at!==tokens.length||unknowns!==1)return false;
 const all=add(left,right,-1);if(Math.abs(all.u)!==1||!same([...leaves].sort((a,b)=>a-b),[...t.values].sort((a,b)=>a-b)))return false;
 const actual=new Map(),expected=new Map();for(const v of all.terms)actual.set(v.value,(actual.get(v.value)||0)-v.sign/all.u);
 t.values.forEach((v,i)=>expected.set(v,(expected.get(v)||0)+signs(t)[i]));
 return [...expected].every(([v,c])=>actual.get(v)===c);
 }catch{return false;}}

export function initial(t){const common={history:[],issue:'',equation:'',answer:''};switch(t.type){
 case'x-storyparts':return{...common,lengths:[0,0,0],built:false,selected:[],subtotal:'',merged:null,firstBuild:null,firstMerge:null};
 case'x-storyplan':return{...common,groups:base(t),selected:[],op:'',result:'',method:'',merges:[],first:[]};
}return null;}
const mergeDraft=(m)=>({leftIds:[...m.groups[m.selected[0]].ids],rightIds:[...m.groups[m.selected[1]].ids],op:m.op,result:m.result,method:m.method});
const draftValid=r=>r&&pairOfGroups(r)&&text(r.op)&&text(r.result)&&text(r.method);
function pairOfGroups(r){return idsValid(r.leftIds)&&idsValid(r.rightIds)&&!r.leftIds.some(i=>r.rightIds.includes(i));}
function replay(t,records){let groups=base(t);for(const r of records){if(!draftValid(r)||!['+','-'].includes(r.op)||!methods.has(r.method))return null;const ai=groups.findIndex(g=>key(g)===r.leftIds.join(',')),bi=groups.findIndex(g=>key(g)===r.rightIds.join(','));if(ai<0||bi<0||ai===bi)return null;const g=join(groups[ai],groups[bi],r.op);if(number(r.result)!==g.value)return null;groups=groups.filter((_,i)=>i!==ai&&i!==bi);groups.push(g);}return groups;}
function historyValid(t,h){if(!Array.isArray(h)||h.length>10000)return false;return h.every(e=>{
 if(!e||Object.getPrototypeOf(e)!==Object.prototype)return false;
 if(t.type==='x-storyparts'){
  if(e.action==='b12-parts-lock')return same(Object.keys(e).sort(),['action','lengths'])&&lengthsValid(e.lengths);
  if(e.action==='b12-parts-merge')return same(Object.keys(e).sort(),['action','ids','subtotal'])&&pairValid(e.ids)&&text(e.subtotal);
  return ['b12-parts-undo','b12-parts-reset'].includes(e.action)&&same(Object.keys(e),['action']);
 }
 if(e.action==='b12-plan-merge')return same(Object.keys(e).sort(),['action','depth','draft'])&&integer(e.depth,0,1)&&draftValid(e.draft)&&same(Object.keys(e.draft).sort(),['leftIds','method','op','result','rightIds']);
 return ['b12-plan-undo','b12-plan-reset'].includes(e.action)&&same(Object.keys(e),['action']);
});}
function historyState(t,history){let built=false,merged=null,merges=[],firstBuild=null,firstMerge=null,first=[];
 for(const e of history){if(e.action==='b12-parts-lock'){firstBuild??=clone(e.lengths);if(!built&&same(e.lengths,t.values))built=true;}
  if(e.action==='b12-parts-merge'){const r={ids:clone(e.ids),subtotal:e.subtotal};firstMerge??=clone(r);if(built&&!merged&&number(r.subtotal)===sum(r.ids.map(i=>t.values[i]))&&(t.pairTotal===undefined||number(r.subtotal)===t.pairTotal))merged=r;}
  if(e.action==='b12-parts-undo')merged=null;
  if(e.action==='b12-parts-reset'){built=false;merged=null;}
  if(e.action==='b12-plan-merge'){if(e.depth!==merges.length)return null;first[e.depth]??=clone(e.draft);const trial=[...merges,e.draft];if(replay(t,trial))merges.push(clone(e.draft));}
  if(e.action==='b12-plan-undo')merges.pop();
  if(e.action==='b12-plan-reset')merges=[];
 }return{built,merged,merges,firstBuild,firstMerge,first};
}
export function valid(t,m){try{
 if(!taskValid(t)||!m||Object.getPrototypeOf(m)!==Object.prototype||!historyValid(t,m.history)||![m.issue,m.equation,m.answer].every(text))return false;
 const h=historyState(t,m.history);if(!h)return false;
 if(!Array.isArray(m.selected)||m.selected.length>2||new Set(m.selected).size!==m.selected.length)return false;
 if(t.type==='x-storyparts')return lengthsValid(m.lengths)&&typeof m.built==='boolean'&&m.built===h.built&&(!m.built||same(m.lengths,t.values))&&text(m.subtotal)&&m.selected.every(i=>integer(i,0,2))&&(!m.merged||m.selected.length===0)&&same(m.merged,h.merged)&&same(m.firstBuild,h.firstBuild)&&same(m.firstMerge,h.firstMerge);
 if(![m.op,m.result,m.method].every(text)||!Array.isArray(m.merges)||m.merges.length>2||!same(m.merges,h.merges)||!same(m.first,h.first))return false;
 const groups=replay(t,m.merges);return !!groups&&same(m.groups,groups)&&m.selected.every(i=>integer(i,0,groups.length-1))&&(groups.length>1||m.selected.length===0);
 }catch{return false;}}
const record=(m,e)=>m.history.push(clone(e));
const fail=(m,msg)=>{m.issue=msg;};
const pick=(m,i,max)=>{if(!integer(i,0,max))return;const p=m.selected.indexOf(i);if(p>=0)m.selected.splice(p,1);else if(m.selected.length<2)m.selected.push(i);};
export function act(t,m,action,d={}){m.issue='';if(t.type==='x-storyparts'){
 if(action==='b12-parts-lock'&&!m.built){m.firstBuild??=clone(m.lengths);record(m,{action,lengths:clone(m.lengths)});if(!same(m.lengths,t.values))fail(m,'每条带子代表一份。把三份各自的数量摆出来，名字不要换位。');else m.built=true;}
 if(action==='b12-parts-pick'&&m.built&&!m.merged)pick(m,Number(d.index),2);
 if(action==='b12-parts-merge'&&m.built&&!m.merged&&m.selected.length===2){const r={ids:[...m.selected],subtotal:m.subtotal};m.firstMerge??=clone(r);record(m,{action,...r});if(number(m.subtotal)!==sum(m.selected.map(i=>t.values[i])))fail(m,'只把选中的这两份接起来。先检查它们一共有多少。');else if(t.pairTotal!==undefined&&number(m.subtotal)!==t.pairTotal)fail(m,`这次先找能合成 ${t.pairTotal} 的两份，另一份继续留着。`);else{m.merged=r;m.selected=[];m.subtotal='';}}
 if(action==='b12-parts-undo'&&m.merged){record(m,{action});m.merged=null;m.selected=[];m.subtotal='';}
 if(action==='b12-parts-reset'){record(m,{action});Object.assign(m,{lengths:[0,0,0],built:false,merged:null,selected:[],subtotal:'',equation:'',answer:''});}
 }else if(t.type==='x-storyplan'){
 if(action==='b12-plan-pick'&&m.groups.length>1)pick(m,Number(d.index),m.groups.length-1);
 if(action==='b12-plan-merge'&&m.selected.length===2&&m.merges.length<2){const r=mergeDraft(m),depth=m.merges.length;m.first[depth]??=clone(r);record(m,{action,depth,draft:r});const groups=replay(t,[...m.merges,r]);if(!groups)fail(m,'按选卡片的先后次序算这一步。检查加减号、结果，再记下你用的办法。');else{m.merges.push(r);m.groups=groups;m.selected=[];m.op='';m.result='';m.method='';}}
 if(action==='b12-plan-undo'&&m.merges.length){record(m,{action});m.merges.pop();m.groups=replay(t,m.merges);m.selected=[];m.op='';m.result='';m.method='';}
 if(action==='b12-plan-reset'){record(m,{action});Object.assign(m,{groups:base(t),merges:[],selected:[],op:'',result:'',method:'',equation:'',answer:''});}
 }return m;}
export function field(t,m,key){if(t.type==='x-storyparts'&&/^lengths\.[012]$/.test(key)){const i=Number(key.at(-1));m.lengths[i]=m.built?t.values[i]:Number(m.lengths[i]);}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份操作记录不能读，试着重新开始这一步。'};
 const equation=equationMatches(t,m.equation),answer=number(m.answer)===target(t);let correct,feedback;
 if(t.type==='x-storyparts'){correct=m.built&&!!m.merged&&equation&&answer;feedback=!m.built?'先按故事把三条带子摆好。':!m.merged?'选两份接起来，另一份也要留在桌上。':!equation?'把三份都写进同一个算式，用 □ 留出问题里的未知数。':'看看最后的数量是否包含了全部三份。';}
 else{const g=m.groups[0],meaning=m.groups.length===1&&same(g.coeffs,t.signs)&&g.value===target(t);correct=meaning&&equation&&answer;feedback=m.groups.length>1?'用两步把三张卡片连起来，每张只用一次。':!meaning?'每一步虽然算得通，还要符合故事：哪些数量应当加进来，哪些应当减去？可以退一步换个安排。':!equation?'用一个算式写出整个故事，每个已知数用一次，用 □ 表示问题里的未知数。':'把问题所问的数量写在最后。';}
 return{correct:!!correct,feedback:correct?(t.type==='x-storyparts'?'带子、计算和故事对上了。':'两步计算和故事对上了。'):feedback,evidence:{kind:t.type,construction:clone(m),explanationAssessed:false,fluencyAssessed:false,mentalStrategyAssessed:false,realToolUseAssessed:false,freehandDrawingAssessed:false}};
}
export function solveSteps(t){const out=[],m=initial(t);const f=(key,value)=>{value=String(value);out.push({field:key,value});let p=m;const ps=key.split('.');for(const k of ps.slice(0,-1))p=p[k];p[ps.at(-1)]=value;field(t,m,key);};const a=(action,data={})=>{out.push({action,data});act(t,m,action,data);};
 if(t.type==='x-storyparts'){t.values.forEach((v,i)=>f(`lengths.${i}`,v));a('b12-parts-lock');let ids=[0,1];if(t.pairTotal!==undefined){ids=null;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(t.values[i]+t.values[j]===t.pairTotal)ids=[i,j];if(!ids)throw Error('No requested pair');}for(const index of ids)a('b12-parts-pick',{index});f('subtotal',sum(ids.map(i=>t.values[i])));a('b12-parts-merge');f('equation',t.values.join('+')+'=□');}
 else if(t.type==='x-storyplan'){let accumulator=t.signs.indexOf(1);const remaining=t.values.map((_,i)=>i).filter(i=>i!==accumulator);for(const id of remaining){const ai=m.groups.findIndex(g=>g.ids.includes(accumulator)),bi=m.groups.findIndex(g=>g.ids.length===1&&g.ids[0]===id);a('b12-plan-pick',{index:ai});a('b12-plan-pick',{index:bi});f('op',t.signs[id]===1?'+':'-');f('result',m.groups[ai].value+t.signs[id]*m.groups[bi].value);f('method','written');a('b12-plan-merge');}f('equation',expression(t,m.groups[0].tree)+'=□');}
 f('answer',target(t));return out;
}
export function example(t){const m=initial(t);for(const step of solveSteps(t)){if(step.field){const path=step.field.split('.');let p=m;for(const k of path.slice(0,-1))p=p[k];p[path.at(-1)]=step.value;field(t,m,step.field);}else act(t,m,step.action,step.data);}return m;}
