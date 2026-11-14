// B16 same-whole fraction comparison. The tool supplies equal wholes and
// automatic overlays; the learner records predictions, selected identities,
// requested common grids and submitted comparison/name fields.
import * as fractions from './phase5/b16-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 smallershare:{indices:[0,1,2],nodeId:'mt_hyvHv2BCwb'},
 setfractions:{indices:[1],nodeId:'mt_MyGblah2yY'},
 precisefractions:{indices:[1],nodeId:'mt_HY8Yycu_rz'},
 fractionreason:{indices:[0],nodeId:'mt_2ESZh70NyS'},
 because38:{indices:[0],nodeId:'mt_a3dov8CZkq'},
 tools39:{indices:[2],nodeId:'mt_d-WZC2OyMB'}
});
export function sameFractionBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-samefraction',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,
  question:'两边的整体一样大时，每小份各是多少，实际涂了多少份？叠图显示的大小关系，与你现在写的比较一致吗？'};
}

const DEFAULTS=Object.freeze({rows:'1',cols:'1',parts:'1',take:'',answer:'',unit:'',equation:'',den:'',num:'',
 whole:'',remainder:'',copies:'',prediction:'',relation:'',left:'',right:'',reason:'',step:'',position:'0',
 choice:'',result:'',shift:'0',rotation:'0',x:'0',y:'0',per:'',total:'',color:'0',decimal:'',percent:'',
 top:'',bottom:'',word:'',count:'1',fixed:'0'});
const FIELD_KEYS=Object.keys(DEFAULTS),ACTIVE=new Set(['prediction','parts','left','right','relation','reason']);
const text=value=>typeof value==='string'&&value.length<=2000;
const integer=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const choice=value=>['<','=','>'].includes(value);
const pair=value=>Array.isArray(value)&&value.length===2&&integer(value[1],2,60)&&integer(value[0],1,value[1]);
const compare=(left,right)=>{
 const a=BigInt(left[0])*BigInt(right[1]),b=BigInt(right[0])*BigInt(left[1]);
 return {relation:a<b?'<':a>b?'>':'=',crossProducts:[String(a),String(b)]};
};
const initial=(first=null)=>({left:[],right:[],first,prediction:null,overlay:false,refine:null});
const visible=(task,board)=>new Set(!board.prediction?['prediction']:[
 ...(task.common?['parts']:[]),...(board.overlay?['relation','reason']:[]),
 ...(board.overlay&&task.common&&board.refine!==null?['left','right']:[])
]);
const validFields=(fields,last,available)=>keys(fields,FIELD_KEYS)&&FIELD_KEYS.every(key=>text(fields[key])&&
 (ACTIVE.has(key)?available.has(key)||fields[key]===last[key]:fields[key]===DEFAULTS[key]))&&
 ['', '<','=','>'].includes(fields.prediction)&&['','<','=','>'].includes(fields.relation)&&
 ['','same-whole','any-whole'].includes(fields.reason);
const index=(raw,max)=>typeof raw==='string'&&/^(0|[1-9]\d*)$/.test(raw)&&
 integer(Number(raw),0,max)&&String(Number(raw))===raw?Number(raw):null;

// Preserve the original numeric input grammar and exact integer requirement,
// while checking the written digits without a floating-point conversion.
function commonParts(raw){
 if(!text(raw))return null;
 const match=raw.trim().match(/^([+-]?)(\d{1,12})(?:\.(\d{1,8}))?$/);if(!match)return null;
 const fraction=match[3]||'',d=10n**BigInt(fraction.length);
 let n=BigInt(match[2])*d+BigInt(fraction||'0');if(match[1]==='-')n=-n;
 return n<d||n>60n*d||n%d!==0n?null:Number(n/d);
}
function writtenFraction(raw,numerator,denominator){
 if(!text(raw))return null;
 const match=raw.trim().match(/^(\d+)\s*(?:\/|÷)\s*(\d+)$/);if(!match)return null;
 const n=BigInt(match[1]),d=BigInt(match[2]);
 return n===BigInt(numerator)&&d===BigInt(denominator)?
  {raw,numerator,denominator,submissionOnly:true}:null;
}

export function replaySameFractionEvidence(task,model){
 try{
  if(!keys(task,['type','left','right','prompt','common'])||task.type!=='x-samefraction'||
     !pair(task.left)||!pair(task.right)||!text(task.prompt)||typeof task.common!=='boolean')return null;
  if(!keys(model,[...FIELD_KEYS,'board','history','issue'])||model.issue!==''||
     !keys(model.board,['left','right','first','prediction','overlay','refine'])||
     !Array.isArray(model.history)||!model.history.length||model.history.length>2000)return null;
  const target=compare(task.left,task.right),predictions=[],changes=[],overlays=[],refinements=[],resets=[];
  let board=initial(),lastFields={...DEFAULTS},round=0;
  for(const [historyIndex,event]of model.history.entries()){
   if(!keys(event,['action','data'])||!['predict','fraction','overlay','refine','reset'].includes(event.action)||
      !keys(event.data,event.action==='fraction'?['row','index','fields']:['fields'])||
      !validFields(event.data.fields,lastFields,visible(task,board)))return null;
   const fields=event.data.fields;lastFields=fields;
   if(event.action==='reset'){
    resets.push({historyIndex,round,left:[...board.left],right:[...board.right],prediction:board.prediction,
     first:board.first,overlay:board.overlay,refine:board.refine});
    board=initial(board.first);round++;continue;
   }
   if(event.action==='predict'){
    if(board.prediction!==null||!choice(fields.prediction))return null;
    board.first??=fields.prediction;board.prediction=fields.prediction;
    predictions.push({historyIndex,round,value:fields.prediction,correct:fields.prediction===target.relation});continue;
   }
   if(board.prediction===null)return null;
   if(event.action==='fraction'){
    const side=event.data.row;if(!['left','right'].includes(side))return null;
    const item=index(event.data.index,task[side][1]-1);if(item===null)return null;
    const selected=!board[side].includes(item),beforeCount=board[side].length;
    board[side]=selected?[...board[side],item]:board[side].filter(id=>id!==item);
    changes.push({historyIndex,round,side,index:item,selected,beforeCount,afterCount:board[side].length});
   }else if(event.action==='overlay'){
    overlays.push({historyIndex,round,addedToDisplay:!board.overlay,
     left:[board.left.length,task.left[1]],right:[board.right.length,task.right[1]]});board.overlay=true;
   }else{
    if(!task.common)return null;
    const p=commonParts(fields.parts);if(p===null||p%task.left[1]||p%task.right[1])return null;
    refinements.push({historyIndex,round,from:board.refine,to:p,changed:board.refine!==p,
     leftScale:p/task.left[1],rightScale:p/task.right[1],
     left:[board.left.length*p/task.left[1],p],right:[board.right.length*p/task.right[1],p]});
    board.refine=p;
   }
   if(['left','right'].some(side=>new Set(board[side]).size!==board[side].length||
      board[side].some(id=>!integer(id,0,task[side][1]-1))))return null;
  }
  const currentFields=Object.fromEntries(FIELD_KEYS.map(key=>[key,model[key]]));
  if(!same(board,model.board)||!validFields(currentFields,lastFields,visible(task,board))||
     board.prediction===null||!board.overlay||board.left.length!==task.left[0]||board.right.length!==task.right[0]||
     model.relation!==target.relation||model.reason!=='same-whole')return null;
  let common=null;
  if(task.common){
   const d=board.refine;if(d===null||commonParts(model.parts)!==d)return null;
   const left=board.left.length*d/task.left[1],right=board.right.length*d/task.right[1];
   const submittedLeft=writtenFraction(model.left,left,d),submittedRight=writtenFraction(model.right,right,d);
   if(!submittedLeft||!submittedRight||BigInt(left)*BigInt(task.left[1])!==BigInt(board.left.length)*BigInt(d)||
      BigInt(right)*BigInt(task.right[1])!==BigInt(board.right.length)*BigInt(d))return null;
   common={denominator:d,left:[left,d],right:[right,d],submittedLeft,submittedRight,systemComputed:true};
  }
  if(!fractions.valid(task,model)||!fractions.inspect(task,model).correct)return null;
  const rows=Object.fromEntries(['left','right'].map(side=>[side,{selectedIds:[...board[side]],
   selectedCount:board[side].length,denominator:task[side][1],unit:[1,task[side][1]],fraction:[board[side].length,task[side][1]]}]));
  return {...rows,relation:target.relation,crossProducts:target.crossProducts,
   firstPrediction:{...predictions[0]},currentPrediction:{...predictions.at(-1)},
   predictions,changes,overlays,refinements,resets,eventCount:model.history.length,common,
   sameWhole:{toolProvided:true,submitted:model.reason,submissionOnly:true},
   submittedRelation:{value:model.relation,submissionOnly:true},
   systemOverlay:{left:[board.left.length,task.left[1]],right:[board.right.length,task.right[1]],systemComputed:true}};
 }catch{return null;}
}
