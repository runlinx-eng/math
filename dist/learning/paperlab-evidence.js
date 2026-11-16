// B16 paper partitions: exact source positions and independently replayed
// fold/build, equal-share judgement and distinct equal-area paint histories.
// Tool-rendered fold lines/cells are not independently drawn learner evidence.
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 halfpaper:{indices:[1,2],nodeId:'mt_-hTTat0mBR'},
 quarterpaper:{indices:[0,2],nodeId:'mt_g3W0mdADVu'},
 shapeparts:{indices:[0,1,2,3],nodeId:'mt_xACS3rWWDp'},
 areaparts:{indices:[0,1,2],nodeId:'mt_idbKDrf9qZ'},
 tenpieces:{indices:[1],nodeId:'mt_YzM5goBctT'}
});
const PROMPTS=Object.freeze({
 fold:'每次对折后增加了几个相同的单位份？实际选中的份与写下的分数相等吗？',
 build:'每一小份面积相同吗？选中的是几份，能不能拼回原来的整个？',
 classify:'只数分成几块够不够？每块占几格，是否真的一样大？',
 paint:'每种颜色各占16格中的多少格？这次改的是分界，还是只换了颜色名？'
});
export function paperLabBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
  !matchesNativeEvidenceTask(task,context,{type:'x-paperlab',nodeId:source.nodeId})||
  !Object.hasOwn(PROMPTS,task.mode))return null;
 return {nodeId:source.nodeId,method:null,question:PROMPTS[task.mode]};
}

const DEFAULTS=Object.freeze({rows:'1',cols:'1',parts:'1',take:'',answer:'',unit:'',equation:'',den:'',num:'',
 whole:'',remainder:'',copies:'',prediction:'',relation:'',left:'',right:'',reason:'',step:'',position:'0',
 choice:'',result:'',shift:'0',rotation:'0',x:'0',y:'0',per:'',total:'',color:'0',decimal:'',percent:'',
 top:'',bottom:'',word:'',count:'1',fixed:'0'});
const FIELD_KEYS=Object.keys(DEFAULTS),ACTIONS=new Set(['fold','partition','paper','paint','save','judge','reset']);
const text=s=>typeof s==='string'&&s.length<=2000;
const integer=(n,low,high)=>Number.isSafeInteger(n)&&n>=low&&n<=high;
const initial=(first=null)=>({rows:1,cols:1,folds:[],selected:[],cells:Array(16).fill(-1),saved:[],judgments:[],first});
const snap=x=>structuredClone(x);
const normalize=xs=>{const order=[];return xs.map(x=>{if(!order.includes(x))order.push(x);return order.indexOf(x);});};
const sameColors=(a,b)=>same(normalize(a),normalize(b));
const equalColors=xs=>xs.length===16&&[0,1,2,3].every(c=>xs.filter(x=>x===c).length===4);
const toggle=(list,i)=>list.includes(i)?list.filter(x=>x!==i):[...list,i];
function number(raw){
 if(!text(raw)||!/^[+-]?\d{1,12}(?:\.\d{1,8})?$/.test(raw.trim()))return null;
 const n=Number(raw);return Number.isFinite(n)?n:null;
}
function index(raw,max){
 if(typeof raw!=='string'||!/^(0|[1-9]\d*)$/.test(raw))return null;
 const n=Number(raw);return integer(n,0,max)&&String(n)===raw?n:null;
}
// Arithmetic here does not rely on the original B16 validator and does not
// round fractional amounts through Number. Keep the B16 input grammar.
function fraction(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/[−–]/g,'-');let n,d;
 const mixed=s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
 const rational=s.match(/^(-?\d+)\/(\d+)$/);
 const decimal=s.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
 try{
  if(mixed){
   const w=BigInt(mixed[1]),part=BigInt(mixed[2]);d=BigInt(mixed[3]);
   if(d<1n||part>=d)return null;
   n=(w<0n?-w:w)*d+part;if(s[0]==='-')n=-n;
  }else if(rational){n=BigInt(rational[1]);d=BigInt(rational[2]);}
  else if(decimal){const rest=decimal[3]||'';d=10n**BigInt(rest.length);
   n=BigInt(decimal[2])*d+BigInt(rest||'0');if(decimal[1]==='-')n=-n;
  }else return null;
  if(d<1n||d>100000000n||n< -1000000000000n||n>1000000000000n)return null;
  return {n,d};
 }catch{return null;}
}
const fractionEquals=(s,n,d)=>{const r=fraction(s);return !!r&&r.n*BigInt(d)===BigInt(n)*r.d;};
function visible(task,board){
 if(task.mode==='paint')return new Set(board.saved.length>=2?['color','answer']:['color']);
 if(task.mode==='classify')return board.judgments.length<task.cases.length?
  new Set(task.writeName?['choice','answer']:['choice']):new Set();
 if(task.mode==='build')return new Set(board.rows*board.cols>1?['rows','cols','answer']:['rows','cols']);
 return new Set(board.rows*board.cols>1?['answer']:[]);
}
function validTask(task){
 if(!task||task.type!=='x-paperlab'||!Object.hasOwn(PROMPTS,task.mode)||!text(task.prompt)||
  !integer(task.d,2,10))return false;
 if(task.mode==='fold')return [2,4].includes(task.d)&&!task.cases&&!task.take&&!task.writeName&&!task.shape;
 if(task.mode==='build')return [2,4,6,10].includes(task.d)&&
  (!task.shape||task.shape==='circle')&&(!task.take||integer(task.take,1,task.d))&&!task.cases;
 if(task.mode==='paint')return task.d===4&&!task.cases&&!task.take&&!task.shape;
 return Array.isArray(task.cases)&&task.cases.length>0&&task.cases.length<=8&&
  task.cases.every(c=>Array.isArray(c)&&c.length>0&&c.length<=12&&c.every(n=>integer(n,1,16)))&&
  !task.take&&!task.shape&&(!task.writeName||task.writeName===true);
}
function judgeTruth(task,c){
 return c.length===task.d&&c.every(n=>n===c[0]);
}
function fieldSnapshot(fields,previous,editable){
 return keys(fields,FIELD_KEYS)&&FIELD_KEYS.every(k=>text(fields[k])&&
  (editable.has(k)||fields[k]===previous[k]))&&
  (!editable.has('choice')||['','yes','no'].includes(fields.choice))&&
  (!editable.has('color')||['','0','1','2','3'].includes(fields.color));
}

export function replayPaperLabEvidence(task,model){
 try{
  if(!validTask(task)||!model||!keys(model,[...FIELD_KEYS,'board','history','issue'])||
   !text(model.issue)||!Array.isArray(model.history)||!model.history.length||
   model.history.length>2000)return null;
  let board=initial(),previous={...DEFAULTS},issue='',round=0;
  const operations=[],failures=[],resets=[],savedWork=[],judgements=[],folds=[],changes=[];
  for(const [historyIndex,event] of model.history.entries()){
   if(!keys(event,['action','data'])||!ACTIONS.has(event.action))return null;
   const action=event.action;
   const dataKeys=['paper','paint'].includes(action)?['index','fields']:
    action==='fold'?['value','fields']:['fields'];
   if(!keys(event.data,dataKeys)||!fieldSnapshot(event.data.fields,previous,visible(task,board)))return null;
   const f=event.data.fields,before=snap(board);previous=f;issue='';
   const record=(accepted=true)=>operations.push({historyIndex,round,action,accepted,
    changed:!same(before,board),before,after:snap(board),issue,fields:snap(f)});
   if(action==='reset'){
    resets.push({historyIndex,round,board:snap(board),first:board.first});
    board=initial(board.first);round++;record();continue;
   }
   if(action==='fold'){
    if(task.mode!=='fold'||!['x','y'].includes(event.data.value))return null;
    if(board.rows*board.cols<8){
     if(event.data.value==='x')board.cols*=2;else board.rows*=2;
     board.folds.push(event.data.value);board.selected=[];
     folds.push({historyIndex,round,axis:event.data.value,parts:board.rows*board.cols});
    }
   }else if(action==='partition'){
    if(task.mode!=='build')return null;
    const rows=number(f.rows),cols=number(f.cols);
    if(!integer(rows,1,6)||!integer(cols,1,12)||rows*cols>12||
      task.shape==='circle'&&rows!==1){
     issue='这张纸先分成不超过12份；圆从中心分开。';
     failures.push({historyIndex,round,action,issue,fields:snap(f)});
    }else{board.rows=rows;board.cols=cols;board.selected=[];}
   }else if(action==='paper'){
    if(!['fold','build'].includes(task.mode))return null;
    const i=index(event.data.index,board.rows*board.cols-1);if(i===null)return null;
    const selected=!board.selected.includes(i);board.selected=toggle(board.selected,i);
    changes.push({historyIndex,round,index:i,selected,unitParts:board.rows*board.cols});
   }else if(action==='paint'){
    if(task.mode!=='paint')return null;
    const i=index(event.data.index,15),color=number(f.color);
    if(i===null)return null;
    // The original select includes an empty placeholder. Clicking a cell with
    // that visible option records a silent no-op and clears the previous issue.
    if(f.color!==''){
     if(!integer(color,0,3))return null;
     board.cells[i]=color;
     changes.push({historyIndex,round,index:i,color,unitParts:16});
    }
   }else if(action==='save'){
    if(task.mode!=='paint')return null;
    if(!equalColors(board.cells))issue='四种颜色各占同样多的格子，形状可以不同。';
    else if(board.saved.some(xs=>sameColors(xs,board.cells)))issue='这份已经留下了。改变分界，只换颜色不算新分法。';
    else{
     board.saved.push(snap(board.cells));
     savedWork.push({historyIndex,round,colors:snap(board.cells),
      groups:[0,1,2,3].map(c=>board.cells.flatMap((v,i)=>v===c?[i]:[])),
      normalized:normalize(board.cells)});
    }
    if(issue)failures.push({historyIndex,round,action,issue,cells:snap(board.cells)});
   }else if(action==='judge'){
    if(task.mode!=='classify'||board.judgments.length>=task.cases.length)return null;
    const c=task.cases[board.judgments.length],truth=judgeTruth(task,c);
    board.first??=f.choice;
    const good=f.choice===(truth?'yes':'no')&&
      (!truth||!task.writeName||fractionEquals(f.answer,1,task.d));
    judgements.push({historyIndex,round,caseIndex:board.judgments.length,
      observedShares:[...c],truth,choice:f.choice,correct:good,first:board.first});
    if(!good){
     issue='份数和每份大小都要看；相等时，用1和总份数给一小份命名。';
     failures.push({historyIndex,round,action,issue,caseIndex:board.judgments.length,choice:f.choice});
    }else board.judgments.push(f.choice);
   }
   record(issue==='');
  }
  if(!same(board,model.board)||model.issue!==issue||
    !fieldSnapshot(Object.fromEntries(FIELD_KEYS.map(k=>[k,model[k]])),previous,visible(task,board)))return null;
  let complete=false;
  if(task.mode==='classify')complete=board.judgments.length===task.cases.length;
  else if(task.mode==='paint')complete=board.saved.length>=2&&fractionEquals(model.answer,1,4);
  else complete=board.rows*board.cols===task.d&&
   board.selected.length===(task.take||1)&&fractionEquals(model.answer,task.take||1,task.d)&&
   (task.mode!=='fold'||board.folds.length===Math.log2(task.d))&&
   (task.mode!=='build'||board.rows===number(model.rows)&&board.cols===number(model.cols));
  if(!complete)return null;
  const currentDraft=task.mode==='paint'?{
   colorCounts:[0,1,2,3].map(c=>board.cells.filter(x=>x===c).length),
   valid:equalColors(board.cells),alreadySaved:board.saved.some(x=>sameColors(x,board.cells)),
   cells:snap(board.cells)}:null;
  return {mode:task.mode,d:task.d,take:task.take||1,unitValue:[1,task.d],
   selectedIds:[...board.selected],folds:folds.filter(x=>x.round===round),changes,
   judgements:judgements.filter(x=>x.round===round),savedWork:savedWork.filter(x=>x.round===round),
   historicalFolds:folds,historicalJudgements:judgements,historicalSavedWork:savedWork,
   currentDraft,failures,resets,operations,round,first:board.first,
   answer:task.mode==='classify'?null:task.mode==='paint'?[1,4]:[task.take||1,task.d],
   acceptedHistoryLength:model.history.length,issue,method:null,
   toolCreatedGrid:true,independentDrawingAssessed:false,freeTextAssessed:false,generalMasteryAssessed:false,
   exactKeystrokeOrderKnown:false,allLaterClicksRecorded:false,recordingLimit:2000};
 }catch{return null;}
}
