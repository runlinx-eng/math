// Strict observations of equal repartitioning, separate from the B17 grader.
// A correct answer, a saved name alone, or an MP.2-looking widget is not evidence.
import * as fractions from './phase5/b17-model.js';
import {rational} from './phase5/b16-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 recutnames:{indices:[0,1,2],nodeId:'mt_FP-mjXaq3B'},
 samenames:{indices:[0,1,2],nodeId:'mt_ebPelt-qAl'},
 simplestparts:{indices:[0,2],nodeId:'mt_b7T-CjOYUR'},
 tenthtohundred:{indices:[0,2],nodeId:'mt_NaqEP8xDhZ'},
 thousandparts:{indices:[1],nodeId:'mt_kdWoAel3Zl'},
 decimalstops:{indices:[0,1],nodeId:'mt_SBkTGjiZjZ'}
});

export function fractionBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-fracrename',nodeId:source.nodeId}))return null;
 const question=task.decimalStart?
  '小数最后一位数的是哪一种小份？把这些小份等量合并时，整个和选中的量会怎样？':task.simple?
  '把小份合成更大的等份时，哪些小份必须一起处理？怎样检查选中的量没有变化？':
  '每一份再分得更细时，整个的份数和选中的份数怎样一起变化？留下不同名字后，怎样检查它们仍表示同一个量？';
 // These native source nodes are not MP.2 nodes in thinking-source-map.json.
 // Report the checked fraction facts without inheriting a thinking label.
 return {nodeId:source.nodeId,question,method:null};
}

const fieldKeys=Object.keys(fractions.fields);
const text=s=>typeof s==='string'&&s.length<=500;
const integer=(n,min=1,max=10000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const natural=(s,min,max)=>{
 if(!text(s)||!/^\d+$/.test(s.trim()))return null;
 const n=Number(s);return integer(n,min,max)?n:null;
};
const equalPair=(a,b)=>BigInt(a[0])*BigInt(b[1])===BigInt(b[0])*BigInt(a[1]);
const decimalEquals=(s,n,d)=>{
 if(!text(s)||!/^\+?\d+(?:\.\d+)?$/.test(s.trim()))return false;
 const r=rational(s);
 return !!r&&r.every(Number.isSafeInteger)&&r[1]>0&&equalPair(r,[n,d]);
};
const named=(s,n,d)=>text(s)&&s.replace(/\s/g,'')===`${n}/${d}`;
const gcd=(a,b)=>{while(b){[a,b]=[b,a%b];}return a;};

// Every event must have a legal mathematical effect. In particular, failed
// attempts, ignored actions, duplicate saves/tests, resets and no-op rewinds
// cannot be erased by a later valid action to obtain positive observations.
export function replayFractionEvidence(task,model){
 try{
  if(task?.type!=='x-fracrename'||!integer(task.n)||!integer(task.d)||task.n>task.d||
     !model||!keys(model,[...fieldKeys,'board','history','issue'])||
     !fieldKeys.every(k=>text(model[k]))||model.issue!==''||
     !Array.isArray(model.history)||!model.history.length||model.history.length>1500)return null;
  for(const flag of ['simple','hcf','testAdd','decimal'])if(task[flag]!==undefined&&typeof task[flag]!=='boolean')return null;
  if(task.count!==undefined&&!integer(task.count,1,1500))return null;
  if(task.targets!==undefined&&(!Array.isArray(task.targets)||!task.targets.length||
     !task.targets.every(r=>Array.isArray(r)&&r.length===2&&r.every(n=>integer(n))&&equalPair(r,[task.n,task.d]))))return null;
  if(task.decimalStart!==undefined&&!decimalEquals(task.decimalStart,task.n,task.d))return null;
  if(!fractions.valid(task,model)||!fractions.inspect(task,model).correct)return null;

  const b={n:task.n,d:task.d,saved:[],moves:0,first:null,tested:false,opened:!task.decimalStart};
  const transformations=[];let splits=0,merges=0,rewinds=0,addition=null;
  for(const e of model.history){
   if(!keys(e,['a','d','f'])||!keys(e.d,[])||!keys(e.f,fieldKeys)||
      !fieldKeys.every(k=>text(e.f[k])))return null;
   if(e.a==='open-decimal'){
    if(!task.decimalStart||b.opened||!named(e.f.fraction,task.n,task.d))return null;
    b.opened=true;
   }else if(e.a==='split'||e.a==='merge'){
    const factor=natural(e.f.factor,2,1000);
    if(!b.opened||factor===null||e.a==='merge'&&(b.n%factor||b.d%factor)||
       e.a==='split'&&b.d*factor>10000)return null;
    const from=[b.n,b.d],to=e.a==='split'?from.map(n=>n*factor):from.map(n=>n/factor);
    if(!to.every(n=>integer(n))||!equalPair(from,to)||!equalPair(to,[task.n,task.d]))return null;
    b.first??={action:e.a,factor:e.f.factor};
    [b.n,b.d]=to;b.moves++;
    transformations.push({action:e.a,factor,from,to});
    if(e.a==='split')splits++;else merges++;
   }else if(e.a==='remember'){
    if(!b.opened||!named(e.f.fraction,b.n,b.d)||
       b.saved.some(r=>r[0]===b.n&&r[1]===b.d)||!equalPair([b.n,b.d],[task.n,task.d]))return null;
    b.saved.push([b.n,b.d]);
   }else if(e.a==='rewind'){
    if(!b.opened||b.n===task.n&&b.d===task.d)return null;
    b.n=task.n;b.d=task.d;rewinds++;
   }else if(e.a==='test-add'){
    if(!b.opened||!task.testAdd||b.tested)return null;
    const from=[task.n,task.d],to=[task.n+1,task.d+1];
    addition={from,to,relation:equalPair(from,to)?'same':'changed'};
    b.tested=true;
   }else return null;
  }
  if(!same(b,model.board)||!b.opened||!transformations.length||
     !b.saved.some(r=>r[0]!==task.n||r[1]!==task.d)||model.reason!=='recut'||
     !named(model.fraction,...b.saved.at(-1))||
     !(task.targets||[]).every(r=>b.saved.some(s=>same(r,s)))||
     task.count&&b.saved.filter(r=>r[0]!==task.n||r[1]!==task.d).length<task.count||
     task.simple&&gcd(b.n,b.d)!==1||
     task.hcf&&natural(model.hcf,1,10000)!==gcd(task.n,task.d)||
     task.testAdd&&(!addition||model.relation!==addition.relation)||
     task.decimal&&!decimalEquals(model.decimal,task.n,task.d))return null;
  return {start:[task.n,task.d],n:b.n,d:b.d,saved:b.saved,transformations,splits,merges,rewinds,
    addition,decimalStart:task.decimalStart||null,decimal:task.decimal?model.decimal:null,
    simplest:!!task.simple,hcf:task.hcf?gcd(task.n,task.d):null};
 }catch{return null;}
}
