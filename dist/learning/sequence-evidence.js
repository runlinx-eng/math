// Verify bounded B34 sequence actions, separate from original grading and pedagogy.
// An accepted answer or a merely present history is never sufficient evidence.
import {rational} from './phase5/b16-model.js';
import {valid as validSequence,inspect as inspectSequence} from './phase5/b34-model.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence as same} from './evidence-contract.js';

const BINDINGS=Object.freeze({
  'general34:2':{
    nodeId:'mt_fZTn0W_iZR',label:'从规律中概括结论',
    question:'从0起每次加5，个位发生什么变化？换一个起点再观察，原来的说法还成立吗？'
  },
  'general34:3':{
    nodeId:'mt_fZTn0W_iZR',label:'从规律中概括结论',
    question:'起点改成2后，每次仍加5。和从0起步相比，个位怎样变化？你能先猜再检查吗？'
  },
  'tables34:0':{
    nodeId:'mt_2jbUekyTu4',label:'延续表格中的规律',
    question:'每次加4得到的几个数有什么共同点？试着两两配对，并想想几个例子能说明什么。'
  },
  'tables34:2':{
    nodeId:'mt_2jbUekyTu4',label:'延续表格中的规律',
    question:'比较相邻两个数，每次增加的量一样吗？从50出发走到第四项，需要加几次50？你能先猜出下一项，再用已留下的步骤检查吗？'
  },
  'reason34:1':{
    nodeId:'mt_iyovKgZC1q',label:'从重复推理中概括规律',
    question:'从5出发每次加4，第20项要走多少次？能用前几项核对你的计算吗？'
  }
});

// Reviewed domain courses share the arithmetic replay, not the MP.8 label of
// the three original thinking-source lessons above. Keep native IDs explicit.
const SOURCES=Object.freeze({
  linear34:{indices:[0,1,2],nodeId:'mt_hBZwbst0ow'},
  paired34:{indices:[2],nodeId:'mt_fxPtngwUfz'},
  rules34:{indices:[0,1,2],nodeId:'mt_yXO7lQ9Yn7'},
  shapeseq34:{indices:[0,2],nodeId:'mt_A-FyLLLLzy'},
  generate34:{indices:[2],nodeId:'mt_QeKWt4BZn3'},
  design34:{indices:[2],nodeId:'mt_nx4a3kH-59'}
});
const questions=Object.freeze({
  add:'比较相邻两项，每次变化的量和方向相同吗？起点改变后，怎样逐步核对？',
  multiply:'每一项怎样从前一项得到？把“加同一个数”和“乘同一个数”的变化比一比。',
  affine:'每次有几步运算？先做哪一步、再做哪一步？换个次序会得到同一项吗？',
  position:'第几项对应怎样的位置？把项的位置代入给定规则后，怎样核对结果？'
});

// Explicit lesson position + canonical task definition + original source node.
// A bridge, a copied task, or a different course using the same type gets no MP.8 label.
export function sequenceBinding(task,context={}){
  if(!context||typeof context!=='object'||Array.isArray(context))return null;
  const {sessionId,index}=context;
  if(typeof sessionId!=='string'||!Number.isInteger(index)||index<0||
     task?.type!=='x-p34-sequence')return null;
  const source=Object.hasOwn(SOURCES,sessionId)?SOURCES[sessionId]:null;
  const binding=BINDINGS[sessionId+':'+index]||
    (source?.indices.includes(index)?{nodeId:source.nodeId,question:questions[task.op]}:null);
  if(!binding||!matchesNativeEvidenceTask(task,context,{type:'x-p34-sequence',nodeId:binding.nodeId}))return null;
  return {...binding,method:binding.label?
    {nodeId:binding.nodeId,label:binding.label,code:'ccss-math:MP.8'}:null};
}

const eventShape=e=>e&&typeof e==='object'&&!Array.isArray(e)&&
  same(Object.keys(e).sort(),['a','i','v','w'])&&
  typeof e.a==='string'&&typeof e.i==='string'&&
  typeof e.v==='string'&&typeof e.w==='string';

// This stricter, observational replay does not change b34-model.valid/inspect.
// Undo is accepted only when it actually reverses an existing step;
// unknown/no-op events, invalid steps and a previously broken attempt disqualify feedback.
export function replaySequenceEvidence(task,model){
  try{
  if(task?.type!=='x-p34-sequence'||!hasExactKeys(model,['board','history','value','second','prose','answers','issue'])||
     model.issue!==''||!Array.isArray(model.history)||
     !Number.isSafeInteger(task.start)||!Number.isInteger(task.length)||
     task.length<2||task.length>1500)return null;
  const scale=task.scale??1;
  if(!Number.isSafeInteger(scale)||scale<1||
     !['add','multiply','affine','position'].includes(task.op))return null;
  if(['add','multiply'].includes(task.op)?!Number.isSafeInteger(task.step):
     !Number.isSafeInteger(task.a)||!Number.isSafeInteger(task.b))return null;
  if(!validSequence(task,model)||!inspectSequence(task,model).correct||
     model.board?.bad!==false)return null;
  const values=[task.start];
  let advances=0,undos=0,first=null,lastEntry=null;
  for(const e of model.history){
    if(!eventShape(e)||e.i!==''||e.w!=='')return null;
    if(e.a==='undo'){
      if(e.v!==''||values.length<=1)return null;
      values.pop();undos++;
      continue;
    }
    if(e.a!=='next'||values.length>=task.length||!e.v.trim())return null;
    const fraction=rational(e.v);
    if(!fraction)return null;
    const numerator=fraction[0]*scale;
    if(!Number.isSafeInteger(numerator)||numerator%fraction[1]!==0)return null;
    const entered=numerator/fraction[1],last=values.at(-1);
    // Independently calculate each operation in source integer units. The
    // original grader remains a separate requirement, not the replay oracle.
    const expected=task.op==='add'?last+task.step:task.op==='multiply'?last*task.step:
      task.op==='affine'?last*task.a+task.b:task.a*(values.length+1)+task.b;
    if(!Number.isSafeInteger(expected)||entered!==expected)return null;
    first??=e.v;
    lastEntry=e.v;
    values.push(entered);advances++;
  }
  if(values.length!==task.length||advances<task.length-1||
     model.value!==lastEntry||model.second!==''||
     !same({first:{next:first},bad:false,values},model.board))return null;
  if(!(task.questions||[]).every((q,index)=>{
    const answer=model.answers[index];
    if(q.kind!=='number')return q.accepted?q.accepted.includes(answer.trim()):answer.trim()===String(q.value);
    const a=rational(answer),b=rational(String(q.value));
    return !!a&&!!b&&a.every(Number.isSafeInteger)&&b.every(Number.isSafeInteger)&&
      BigInt(a[0])*BigInt(b[1])===BigInt(b[0])*BigInt(a[1]);
  }))return null;
  return {values,displayValues:values.map(v=>String(v/scale)),advances,undos,scale};
  }catch{return null;}
}
