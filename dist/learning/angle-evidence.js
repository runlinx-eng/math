// Evidence describes the openings actually set and recorded in B25. The
// supplied diagram, final answer and free prose do not establish a prediction,
// a physical turn, or an independently explained geometric proof.
import * as angles from './phase5/b25-model.js';
import {matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

// Answer roles are reviewed separately from the original answer key. Numeric
// relations below are calculated from replayed records, never copied from it.
const SOURCES=Object.freeze({
 anglecorner:{nodeId:'mt_8OAGVdeTJ_',cases:{0:['length-same'],1:['larger']}},
 angleparts:{nodeId:'mt_3S10OOGPqu',cases:{0:['vertex'],2:['opening']}},
 rightcheck:{nodeId:'mt_MFfYcnv6Tv',cases:{2:['full-quarters','half-quarters']}},
 anglestraight:{nodeId:'mt_LBT-9jz7kR',cases:{0:['half','full'],2:['smaller-opening']}},
 degreeunit:{nodeId:'mt_qUGMyMYn9m',cases:{0:['full','quarter'],1:['last'],2:['length-same']}},
 angleadd:{nodeId:'mt_89riIKwGYp',cases:{0:['difference'],1:['difference','last'],2:['difference']}},
 anglearound:{nodeId:'mt_oqziWKry-L',cases:{0:['half','full'],1:['opposite','adjacent'],2:['three-quarters']}},
 anglecross:{nodeId:'mt_QDTO3GAgcq',cases:{0:['opposite','adjacent','around'],1:['opposite','adjacent'],2:['cross-comparison']}},
 anglechain:{nodeId:'mt_tedML_iu4Y',cases:{0:['adjacent','opposite'],1:['adjacent','opposite'],2:['adjacent','opposite-rule']}},
 trianglepossible:{nodeId:'mt_4bc3EAxhlY',cases:{6:['last','triangle-possible']}}
});

export function angleBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!Object.hasOwn(source.cases,context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-g25-turn',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,question:task.compareLengths?
  '记下同一个开口在短边和长边时的样子。变的是哪一部分？哪些记录可以放在一起比较？':task.scene==='cross'?
  '把实际开口记下来。两条线相交时，对面与旁边的开口分别有什么联系？':
  '你实际记下了哪些开口？可以用哪些记录比较一部分、半圈和一整圈？'};
}

const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const text=n=>typeof n==='string'&&n.length<=1500;
const scalar=['angle','length','base','a','b','other','prose'];
const fields={set:['angle'],quarter:[],length:['length'],record:[]};

// B25 accepts fractions, mixed numbers and decimals. Resolve their exact value
// before conversion to Number, including the literal minus in "-0 1/2".
// All admitted results are bounded integers, so no rounding tolerance is used.
function exactInteger(raw,min,max){
 if(!text(raw))return null;
 const s=raw.trim();let n,d,m;
 if((m=s.match(/^(-?)(\d{1,80})\s+(\d{1,80})\/(\d{1,80})$/))){
  d=BigInt(m[4]);n=BigInt(m[2])*d+BigInt(m[3]);if(m[1])n=-n;
 }else if((m=s.match(/^(-?)(\d{1,80})\/(\d{1,80})$/))){
  n=BigInt(m[2]);d=BigInt(m[3]);if(m[1])n=-n;
 }else if((m=s.match(/^(-?)(\d{1,80})(?:\.(\d{1,80}))?$/))){
  const tail=m[3]||'';d=10n**BigInt(tail.length);
  n=BigInt(m[2])*d+BigInt(tail||'0');if(m[1])n=-n;
 }else return null;
 if(d===0n||n%d!==0n)return null;
 const value=n/d;
 return value>=BigInt(min)&&value<=BigInt(max)?Number(value):null;
}

function reviewed(task){
 if(task?.type!=='x-g25-turn')return null;
 for(const [sessionId,source]of Object.entries(SOURCES))
  for(const [index,roles]of Object.entries(source.cases))
   if(matchesNativeEvidenceTask(task,{sessionId,index:Number(index)},
    {type:'x-g25-turn',nodeId:source.nodeId}))return roles;
 return null;
}

export function replayAngleEvidence(task,model){
 try{
  const roles=reviewed(task);
  if(!roles||!Array.isArray(task.targets)||!task.targets.length||
     !task.targets.every(n=>integer(n,1,360))||new Set(task.targets).size!==task.targets.length||
     !Array.isArray(task.questions)||task.questions.length!==roles.length)return null;
  if(!keys(model,[...scalar,'answers','seed','board','history','issue'])||
     !scalar.every(k=>text(model[k]))||['base','a','b','other'].some(k=>model[k]!=='')||
     !integer(model.seed,1,4294967295)||model.issue!==''||
     !Array.isArray(model.answers)||model.answers.length!==roles.length||!model.answers.every(text)||
     !Array.isArray(model.history)||!integer(model.history.length,1,1000))return null;
  const board={first:{},angle:0,length:1,records:[]},records=[],steps=[],advances=[];
  let lastAngleInput='',lastLengthInput='',changes=0,confirmations=0;
  for(const [historyIndex,event]of model.history.entries()){
   if(!keys(event,['a','f','d'])||!Object.hasOwn(fields,event.a)||
      !keys(event.f,fields[event.a])||!keys(event.d,[])||
      !fields[event.a].every(k=>text(event.f[k])))return null;
   const action=event.a,fromAngle=board.angle,fromLength=board.length;
   board.first[action]??=structuredClone(event.f);
   if(action==='set'){
    const value=exactInteger(event.f.angle,0,360);if(value===null)return null;
    board.angle=value;lastAngleInput=event.f.angle;
    if(value===fromAngle)confirmations++;
   }else if(action==='quarter'){
    // The existing bounded control stops at a whole turn; after 360 it starts
    // the next quarter. Preserve that behavior and state the actual advance.
    const wrapped=fromAngle===360;
    board.angle=wrapped?90:Math.min(360,fromAngle+90);
    const degrees=wrapped?90:board.angle-fromAngle;
    if(!integer(degrees,1,90))return null;
    advances.push({historyIndex,from:fromAngle,to:board.angle,degrees,wrapped,clamped:degrees<90});
   }else if(action==='length'){
    const value=exactInteger(event.f.length,1,3);
    if(!['1','2','3'].includes(event.f.length)||value===null||value===fromLength)return null;
    board.length=value;lastLengthInput=event.f.length;
   }else{
    if(board.records.some(r=>r.angle===board.angle&&r.length===board.length))return null;
    board.records.push({angle:board.angle,length:board.length});
    records.push({angle:board.angle,length:board.length,historyIndex});
   }
   const changed=board.angle!==fromAngle||board.length!==fromLength;
   if(changed)changes++;
   steps.push({action,fromAngle,toAngle:board.angle,fromLength,toLength:board.length,changed});
  }
  if(!same(board,model.board)||model.angle!==lastAngleInput||model.length!==lastLengthInput||
     board.angle!==task.targets.at(-1))return null;
  // Respect the requested order without pretending that unrecorded fields
  // were operations. Additional legitimate exploration may remain in history.
  const targetRecords=[];let cursor=0;
  for(const angle of task.targets){
   const recordIndex=records.findIndex((r,i)=>i>=cursor&&r.angle===angle);
   if(recordIndex<0)return null;
   targetRecords.push({...records[recordIndex],recordIndex});cursor=recordIndex+1;
  }
  let lengthComparison=null;
  if(task.compareLengths){
   const angle=task.targets[0],shortRecordIndex=records.findIndex(r=>r.angle===angle&&r.length===1),
    longRecordIndex=records.findIndex(r=>r.angle===angle&&r.length===3);
   if(shortRecordIndex<0||longRecordIndex<0)return null;
   lengthComparison={angle,shortRecordIndex,longRecordIndex};
  }
  const differences=targetRecords.slice(1).map((r,i)=>({from:targetRecords[i].angle,to:r.angle,
   difference:r.angle-targetRecords[i].angle,fromRecordIndex:targetRecords[i].recordIndex,toRecordIndex:r.recordIndex}));
  let cross=null;
  if(task.scene==='cross'){
   if(!integer(board.angle,1,179))return null;
   cross={angle:board.angle,opposite:board.angle,adjacent:180-board.angle,around:360};
  }
  let triangle=null;
  if(roles.includes('triangle-possible')){
   const parts=targetRecords.map((r,i)=>r.angle-(i?targetRecords[i-1].angle:0));
   if(!parts.every(n=>integer(n,1,359)))return null;
   const sum=parts.reduce((a,b)=>a+b,0);
   triangle={parts,sum,canForm:sum===180};
  }
  const recorded=value=>targetRecords.find(r=>r.angle===value)?.angle??null;
  const expected=role=>{
   switch(role){
    case'length-same':return lengthComparison?'same':null;
    case'opening':return lengthComparison?'opening':null;
    // The common vertex is supplied by the original diagram, not constructed
    // by a learner event; this checks its label without claiming otherwise.
    case'vertex':return'vertex';
    case'larger':return targetRecords.length===2&&targetRecords[1].angle>targetRecords[0].angle?'larger':null;
    case'half':return recorded(180);
    case'full':return recorded(360);
    case'quarter':return recorded(90);
    case'three-quarters':return recorded(270);
    case'full-quarters':return recorded(360)===360?360/90:null;
    case'half-quarters':return recorded(180)===180?180/90:null;
    case'last':return targetRecords.at(-1).angle;
    case'difference':return differences.length===1?differences[0].difference:null;
    case'smaller-opening':return board.angle>180&&board.angle<360&&360-board.angle<180?'small':null;
    case'opposite':return cross?.opposite??null;
    case'adjacent':return cross?.adjacent??null;
    case'around':return cross?2*(cross.angle+cross.adjacent):null;
    case'cross-comparison':return cross&&cross.opposite===cross.angle&&cross.angle+cross.adjacent===180&&cross.angle!==cross.adjacent?'different':null;
    case'opposite-rule':return cross&&cross.opposite===cross.angle?'opposite':null;
    case'triangle-possible':return triangle&&triangle.sum>180?'none':null;
    default:return null;
   }
  };
  const answers=[];
  for(const [i,role]of roles.entries()){
   const value=expected(role);if(value===null)return null;
   if(typeof value==='number'?exactInteger(model.answers[i],0,360)!==value:model.answers[i]!==value)return null;
   answers.push({role,value});
  }
  if(!angles.valid(task,model)||!angles.inspect(task,model).correct)return null;
  return {angle:board.angle,length:board.length,records,targetRecords,steps,changes,confirmations,advances,
   lengthComparison,differences,cross,triangle,answers};
 }catch{return null;}
}
