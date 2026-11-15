// B16 fraction/decimal/percent boards: verify actual colored identities and
// requested displays. Written names are submissions, not conversion events.
import * as boards from './phase5/b16-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 viewlinks:{indices:[1,2],nodeId:'mt_CUmjcE7W6c'},
 representationmap:{indices:[2],nodeId:'mt_9KmVWCuh5_'},
 decimalnames:{indices:[0,2,3],nodeId:'mt_Vi4Vo5xs_g'},
 fractionmeasure:{indices:[4],nodeId:'mt_wB-GBDkoNr'},
 pctNames37:{indices:[0,2],nodeId:'mt_4ubP_RMg9o'},
 pctWhole37:{indices:[0,1,2,3],nodeId:'mt_ZM9mhHsyYZ'},
 pctIdeas37:{indices:[1],nodeId:'mt_ESgc4YBw-a'},
 pctFraction37:{indices:[0],nodeId:'mt_ALUrJpY0cZ'}
});

export function fdpBoardBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-fdpboard',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,
  question:'整个被平均分成了多少份，涂了多少份？你写的分数、小数和百分数，是否都表示现在涂出的同一部分？'};
}

// Freeze every shared-widget field independently. Only four text controls
// belong to this task, and even those are absent while nothing is colored.
const DEFAULTS=Object.freeze({rows:'1',cols:'1',parts:'1',take:'',answer:'',unit:'',equation:'',den:'',num:'',
 whole:'',remainder:'',copies:'',prediction:'',relation:'',left:'',right:'',reason:'',step:'',position:'0',
 choice:'',result:'',shift:'0',rotation:'0',x:'0',y:'0',per:'',total:'',color:'0',decimal:'',percent:'',
 top:'',bottom:'',word:'',count:'1',fixed:'0'});
const FIELD_KEYS=Object.keys(DEFAULTS),EDITABLE=new Set(['num','den','decimal','percent']);
const text=value=>typeof value==='string'&&value.length<=2000;
const integer=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const gcd=(a,b)=>{while(b){const r=a%b;a=b;b=r;}return a;};
const ratio=(n,d)=>{const g=gcd(n,d);return d===g?String(n/g):(n/g)+'/'+(d/g);};
const index=(raw,max)=>typeof raw==='string'&&/^(0|[1-9]\d*)$/.test(raw)&&
 integer(Number(raw),0,max)&&String(Number(raw))===raw?Number(raw):null;

function positiveInteger(raw){
 if(!text(raw)||!/^\d+$/.test(raw.trim()))return null;
 const n=BigInt(raw.trim());return n>0n&&n<=1000000000000n?n:null;
}

// A decimal control accepts decimal notation, including an integer such as
// 1 or 100. A fraction expression is not evidence of a decimal representation.
// Parse the original digits before any Number conversion and retain the B16
// finite numerator/denominator limits. The percent field contains the number
// of hundredths (75), not the ratio literal (0.75) or a percent-sign formula.
function decimal(raw){
 if(!text(raw))return null;
 const match=raw.trim().replace(/[−–]/g,'-').match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
 if(!match)return null;
 const fraction=match[3]||'';if(fraction.length>8)return null;
 const d=10n**BigInt(fraction.length);
 let n=BigInt(match[2])*d+BigInt(fraction||'0');if(match[1]==='-')n=-n;
 return n<0n||n>1000000000000n?null:{n,d};
}
const initial=()=>({selected:[],seen:['grid']});

export function replayFdpBoardEvidence(task,model){
 try{
  if(!keys(task,['type','n','d','prompt','views'])||task.type!=='x-fdpboard'||!text(task.prompt)||
     ![4,100].includes(task.d)||!integer(task.n,1,task.d)||!Array.isArray(task.views)||
     task.views.some(view=>!['pie','line'].includes(view))||new Set(task.views).size!==task.views.length)return null;
  if(!keys(model,[...FIELD_KEYS,'board','history','issue'])||model.issue!==''||
     !FIELD_KEYS.every(key=>text(model[key]))||!keys(model.board,['selected','seen'])||
     !Array.isArray(model.history)||!model.history.length||model.history.length>2000||
     FIELD_KEYS.some(key=>!EDITABLE.has(key)&&model[key]!==DEFAULTS[key]))return null;
  let board=initial(),lastFields={...DEFAULTS};
  const changes=[],viewRequests=[],resets=[];
  for(const [historyIndex,event]of model.history.entries()){
   if(!keys(event,['action','data'])||!['cell','row','view','reset'].includes(event.action))return null;
   const dataKeys=event.action==='reset'?['fields']:event.action==='view'?['value','fields']:['index','fields'];
   if(!keys(event.data,dataKeys)||!keys(event.data.fields,FIELD_KEYS)||
      !FIELD_KEYS.every(key=>text(event.data.fields[key])))return null;
   const fields=event.data.fields,visible=board.selected.length>0;
   // Reset and erasing the last cell hide controls but keep their exact old
   // values. Visible interim wrong names may be corrected without rewriting
   // events: no event here claims that those names were already correct.
   if(FIELD_KEYS.some(key=>EDITABLE.has(key)?!visible&&fields[key]!==lastFields[key]:fields[key]!==DEFAULTS[key]))return null;
   lastFields=fields;
   if(event.action==='reset'){
    resets.push({historyIndex,selectedIds:[...board.selected],displayed:[...board.seen]});board=initial();continue;
   }
   if(event.action==='view'){
    const value=event.data.value;if(!task.views.includes(value))return null;
    const addedToDisplay=!board.seen.includes(value);
    viewRequests.push({historyIndex,value,addedToDisplay,selectedCount:board.selected.length});
    if(addedToDisplay)board.seen.push(value);continue;
   }
   if(event.action==='row'&&task.d!==100)return null;
   const item=index(event.data.index,event.action==='row'?9:task.d-1);if(item===null)return null;
   const affected=event.action==='row'?Array.from({length:10},(_,i)=>item*10+i):[item];
   const erase=affected.every(id=>board.selected.includes(id));
   const beforeCount=board.selected.length,added=erase?[]:affected.filter(id=>!board.selected.includes(id)),removed=erase?affected:[];
   board.selected=erase?board.selected.filter(id=>!affected.includes(id)):[...board.selected,...added];
   changes.push({historyIndex,action:event.action,index:item,added,removed,beforeCount,afterCount:board.selected.length});
   if(!added.length&&!removed.length||board.selected.length!==beforeCount+added.length-removed.length||
      new Set(board.selected).size!==board.selected.length||board.selected.some(id=>!integer(id,0,task.d-1)))return null;
  }
  if(!same(board,model.board)||board.selected.length!==task.n||!task.views.every(view=>board.seen.includes(view)))return null;
  const numerator=positiveInteger(model.num),denominator=positiveInteger(model.den);
  const decimalValue=decimal(model.decimal),percentValue=decimal(model.percent),n=BigInt(board.selected.length),d=BigInt(task.d);
  if(numerator===null||denominator===null||numerator*d!==denominator*n||
     !decimalValue||decimalValue.n*d!==n*decimalValue.d||
     !percentValue||percentValue.n*d!==n*100n*percentValue.d)return null;
  if(!boards.valid(task,model)||!boards.inspect(task,model).correct)return null;
  const exactValue=ratio(n,d),representation={numerator:Number(n),denominator:Number(d),exactValue,systemComputed:true};
  return {denominator:task.d,selectedCount:board.selected.length,selectedIds:[...board.selected],
   unselectedCount:task.d-board.selected.length,baseRepresentation:task.d===100?'hundred-grid':'sector-circle',
   changes,viewRequests,resets,eventCount:model.history.length,
   fraction:{actual:[Number(n),Number(d)],submitted:{numerator:Number(numerator),denominator:Number(denominator),
    rawNumerator:model.num,rawDenominator:model.den,exactValue:ratio(numerator,denominator),submissionOnly:true}},
   decimal:{raw:model.decimal,exactValue:ratio(decimalValue.n,decimalValue.d),submissionOnly:true},
   percent:{raw:model.percent,exactValue:ratio(percentValue.n,percentValue.d),submissionOnly:true},
   systemRepresentations:{line:board.seen.includes('line')?{...representation}:null,
    additionalCircle:task.d===100&&board.seen.includes('pie')?{...representation}:null}};
 }catch{return null;}
}
