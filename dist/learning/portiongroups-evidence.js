// B16 portion groups: replay fixed token identities, group navigation and
// selection toggles. Submitted names/equations are not calculation events.
import * as portions from './phase5/b16-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 halfpaper:{indices:[0],nodeId:'mt_-hTTat0mBR'},
 quarterpaper:{indices:[1],nodeId:'mt_g3W0mdADVu'},
 setfractions:{indices:[0,2],nodeId:'mt_MyGblah2yY'},
 unitsets:{indices:[0,1,2,3],nodeId:'mt_k2WE0-22-4'},
 nonunitamount:{indices:[0,1,2],nodeId:'mt_3y7xKP9MjU'},
 precise38:{indices:[0],nodeId:'mt_mywsN77hGZ'},
 multiShape38:{indices:[2],nodeId:'mt_SmghasIvbT'}
});

export function portionGroupsBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-portiongroups',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,
  question:'怎样让这些组一样多？选中了几组、选中了多少颗，分别与整个的哪一个数量比较？'};
}

// This independent list also fixes the fields that the shared B16 widget
// cannot edit in this task. An unrelated hidden field is never evidence.
const DEFAULTS=Object.freeze({rows:'1',cols:'1',parts:'1',take:'',answer:'',unit:'',equation:'',den:'',num:'',
 whole:'',remainder:'',copies:'',prediction:'',relation:'',left:'',right:'',reason:'',step:'',position:'0',
 choice:'',result:'',shift:'0',rotation:'0',x:'0',y:'0',per:'',total:'',color:'0',decimal:'',percent:'',
 top:'',bottom:'',word:'',count:'1',fixed:'0'});
const FIELD_KEYS=Object.keys(DEFAULTS);
const text=value=>typeof value==='string'&&value.length<=2000;
const integer=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const abs=n=>n<0n?-n:n;
const gcd=(a,b)=>{a=abs(a);while(b){const r=a%b;a=b;b=r;}return a;};
const rational=(n,d=1n)=>{if(!d)return null;if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};};
const equalInteger=(q,value)=>q!==null&&q.n===BigInt(value)*q.d;
const exact=q=>q.d===1n?String(q.n):q.n+'/'+q.d;

// Keep the B16 input grammar and its finite range, but never first convert
// the literal through Number(). In particular, -0 keeps its written sign.
function quantity(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/[−–]/g,'-');let n,d,m;
 if((m=s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/))){
  const whole=BigInt(m[1]),part=BigInt(m[2]);d=BigInt(m[3]);
  if(d<1n||part>=d)return null;
  n=abs(whole)*d+part;if(m[1].startsWith('-'))n=-n;
 }else if((m=s.match(/^(-?\d+)\/(\d+)$/))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if((m=s.match(/^([+-]?)(\d+)(?:\.(\d+))?$/))){
  const fraction=m[3]||'';d=10n**BigInt(fraction.length);
  n=BigInt(m[2])*d+BigInt(fraction||'0');if(m[1]==='-')n=-n;
 }else return null;
 return abs(n)>1000000000000n||d<1n||d>100000000n?null:rational(n,d);
}
function positiveInteger(raw){
 if(!text(raw)||!/^\d+$/.test(raw.trim()))return null;
 const n=BigInt(raw.trim());return n>0n&&n<=1000000000000n?n:null;
}

// The original equation check compares expression structure after parsing
// leaves as floating point. Rebuild the same relevant arithmetic structure
// with exact rational leaves, so rounded literals cannot borrow its success.
function expression(raw){
 if(!text(raw)||/\d\s+\d/.test(raw))return null;
 const s=raw.replace(/\s/g,'').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-')
  .replace(/（/g,'(').replace(/）/g,')');
 if(!s||s.length>200||/[^\d.+\-*/()[\]{}]/.test(s))return null;
 let at=0;
 const atom=()=>{
  const first=s[at];
  if(first==='+'||first==='-'){
   at++;const child=atom();if(!child)return null;
   return {key:(first==='-'?'neg':'pos')+'('+child.key+')',q:rational(first==='-'?-child.q.n:child.q.n,child.q.d)};
  }
  if('([{'.includes(first||'~')){
   at++;const child=parse(0),close={'(':')','[':']','{':'}'}[first];
   if(s[at++]!==close)return null;return child;
  }
  const match=s.slice(at).match(/^\d+(?:\.\d+)?/);if(!match)return null;
  at+=match[0].length;const [whole,fraction='']=match[0].split('.'),d=10n**BigInt(fraction.length);
  const q=rational(BigInt(whole)*d+BigInt(fraction||'0'),d);
  return {key:exact(q),q};
 };
 const parse=min=>{
  let left=atom();if(!left)return null;
  while(at<s.length){
   const op=s[at],precedence={'+':10,'-':10,'*':20,'/':20}[op];
   if(!precedence||precedence<min)break;
   at++;const right=parse(precedence+1);if(!right)return null;
   const a=left.q,b=right.q,q=op==='+'?rational(a.n*b.d+b.n*a.d,a.d*b.d):
    op==='-'?rational(a.n*b.d-b.n*a.d,a.d*b.d):op==='*'?rational(a.n*b.n,a.d*b.d):rational(a.n*b.d,a.d*b.n);
   if(!q)return null;
   const terms=[left.key,right.key];if(op==='+'||op==='*')terms.sort();
   left={key:op+'('+terms.join(',')+')',q};
  }
  return left;
 };
 const result=parse(0);return at===s.length?result:null;
}
function equation(raw,expected,value){
 if(!text(raw))return null;
 const sides=raw.split('=');if(sides.length!==2)return null;
 const parsed=sides.map(expression);
 if(parsed.some(p=>!p||!equalInteger(p.q,value)))return null;
 const matches=expected.some(want=>{
  const parts=want.split('=');if(parts.length!==2)return false;
  const target=parts.map(expression);if(target.some(p=>!p||!equalInteger(p.q,value)))return false;
  return parsed[0].key===target[0].key&&parsed[1].key===target[1].key||
   parsed[0].key===target[1].key&&parsed[1].key===target[0].key;
 });
 return matches?{raw,value,exactValue:exact(parsed[0].q),submissionOnly:true}:null;
}
const index=(raw,max)=>typeof raw==='string'&&/^(0|[1-9]\d*)$/.test(raw)&&
 integer(Number(raw),0,max)&&String(Number(raw))===raw?Number(raw):null;
const initial=total=>({groups:Array(total).fill(-1),group:0,taken:[]});
const available=b=>b.groups.every(group=>group>=0);

export function replayPortionGroupsEvidence(task,model){
 try{
  if(task?.type!=='x-portiongroups'||!text(task.prompt)||
     Object.keys(task).some(key=>!['type','total','d','n','prompt','name','equation'].includes(key))||
     !integer(task.total,1,120)||!integer(task.d,2,12)||!integer(task.n,1,task.d)||task.total%task.d!==0||
     task.name!==undefined&&task.name!==true||task.equation!==undefined&&
      (!Array.isArray(task.equation)||!task.equation.length||task.equation.length>10||task.equation.some(v=>!text(v))))return null;
  if(!keys(model,[...FIELD_KEYS,'board','history','issue'])||model.issue!==''||
     !FIELD_KEYS.every(key=>text(model[key]))||!keys(model.board,['groups','group','taken'])||
     !Array.isArray(model.history)||!model.history.length||model.history.length>2000)return null;
  const editable=new Set(['per','answer',...(task.name?['num','den']:[]),...(task.equation?['equation']:[])]);
  if(FIELD_KEYS.some(key=>!editable.has(key)&&model[key]!==DEFAULTS[key]))return null;
  let board=initial(task.total),lastFields={...DEFAULTS};
  const assignments=[],navigation=[],selections=[],resets=[];
  for(const [historyIndex,event]of model.history.entries()){
   if(!keys(event,['action','data'])||!['group','token','take','reset'].includes(event.action)||
      !keys(event.data,event.action==='reset'?['fields']:['index','fields'])||
      !keys(event.data.fields,FIELD_KEYS)||!FIELD_KEYS.every(key=>text(event.data.fields[key])))return null;
   const fields=event.data.fields,visible=available(board);
   // Reset keeps field values even while their controls are hidden. Only a
   // fully distributed board makes those fields editable again.
   if(FIELD_KEYS.some(key=>editable.has(key)?!visible&&fields[key]!==lastFields[key]:fields[key]!==DEFAULTS[key]))return null;
   lastFields=fields;
   if(event.action==='reset'){
    resets.push({historyIndex,assigned:board.groups.filter(group=>group>=0).length,selected:[...board.taken]});
    board=initial(task.total);continue;
   }
   const item=index(event.data.index,event.action==='token'?task.total-1:task.d-1);
   if(item===null)return null;
   if(event.action==='group'){
    navigation.push({historyIndex,from:board.group,to:item,changed:board.group!==item});board.group=item;
   }else if(event.action==='token'){
    const from=board.groups[item];if(from===board.group)return null;
    assignments.push({historyIndex,token:item,from,to:board.group});board.groups[item]=board.group;
   }else{
    const selected=!board.taken.includes(item);
    board.taken=selected?[...board.taken,item]:board.taken.filter(group=>group!==item);
    selections.push({historyIndex,group:item,selected});
   }
   // Every slot remains one original token; navigation and selection never
   // manufacture a token or a second owner. Unequal intermediate groups are
   // normal construction states and may be corrected by later real moves.
   if(board.groups.length!==task.total||board.groups.some(group=>!integer(group,-1,task.d-1))||
      new Set(board.taken).size!==board.taken.length)return null;
  }
  if(!same(board,model.board)||!available(board))return null;
  const groups=Array.from({length:task.d},(_,g)=>board.groups.flatMap((group,token)=>group===g?[token]:[]));
  const counts=groups.map(group=>group.length),each=counts[0];
  const selectedGroups=[...board.taken],selectedTokens=board.groups.flatMap((group,token)=>selectedGroups.includes(group)?[token]:[]);
  const total=board.groups.length,selectedTotal=selectedTokens.length;
  if(counts.some(count=>count!==each)||each*counts.length!==total||selectedGroups.length!==task.n||
     selectedTotal!==each*selectedGroups.length||!equalInteger(quantity(model.per),each)||
     !equalInteger(quantity(model.answer),selectedTotal))return null;
  let submitted=null;
  if(task.name){
   const numerator=positiveInteger(model.num),denominator=positiveInteger(model.den);
   if(numerator===null||denominator===null||numerator*BigInt(total)!==denominator*BigInt(selectedTotal))return null;
   submitted={numerator:Number(numerator),denominator:Number(denominator),submissionOnly:true};
  }
  const submittedEquation=task.equation?equation(model.equation,task.equation,selectedTotal):null;
  if(task.equation&&!submittedEquation)return null;
  if(!portions.valid(task,model)||!portions.inspect(task,model).correct)return null;
  return {total,partitions:groups.length,each,groups,counts,selectedGroups,selectedTokens,selectedTotal,
   unselectedTotal:total-selectedTotal,assignments,navigation,selections,resets,eventCount:model.history.length,
   fraction:{groups:[selectedGroups.length,groups.length],tokens:[selectedTotal,total],submitted},
   equation:submittedEquation};
 }catch{return null;}
}
