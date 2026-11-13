// Verify bounded B34 sequence actions, separate from original grading and pedagogy.
// An accepted answer or a merely present history is never sufficient evidence.
import {rational} from './phase5/b16-model.js';
import {sequenceNext,valid as validSequence,inspect as inspectSequence} from './phase5/b34-model.js';
import {sessionMeta,sessionTasks} from './bridges.js';

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

// Explicit lesson position + canonical task definition + original source node.
// A bridge, a copied task, or a different course using the same type gets no MP.8 label.
export function sequenceBinding(task,context={}){
  const {sessionId,index}=context;
  if(typeof sessionId!=='string'||!Number.isInteger(index)||index<0||
     task?.type!=='x-p34-sequence')return null;
  const binding=BINDINGS[sessionId+':'+index];
  if(!binding||sessionMeta(sessionId)?.topicId!==binding.nodeId)return null;
  const original=sessionTasks(sessionId)?.[index];
  if(original?.type!==task.type||JSON.stringify(original)!==JSON.stringify(task))return null;
  return binding;
}

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const eventShape=e=>e&&typeof e==='object'&&!Array.isArray(e)&&
  same(Object.keys(e).sort(),['a','i','v','w'])&&
  typeof e.a==='string'&&typeof e.i==='string'&&
  typeof e.v==='string'&&typeof e.w==='string';

// This stricter, observational replay does not change b34-model.valid/inspect.
// Undo is accepted only when it actually reverses an existing step;
// unknown/no-op events, invalid steps and a previously broken attempt disqualify feedback.
export function replaySequenceEvidence(task,model){
  if(task?.type!=='x-p34-sequence'||!model||!Array.isArray(model.history)||
     !Number.isSafeInteger(task.start)||!Number.isInteger(task.length)||
     task.length<2||task.length>1500)return null;
  const scale=task.scale??1;
  if(!Number.isSafeInteger(scale)||scale<1||
     !['add','multiply','affine','position'].includes(task.op))return null;
  if(!validSequence(task,model)||!inspectSequence(task,model).correct||
     model.board?.bad!==false)return null;
  const values=[task.start];
  let advances=0,undos=0;
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
    const entered=numerator/fraction[1],expected=sequenceNext(task,values);
    if(!Number.isSafeInteger(expected)||entered!==expected)return null;
    values.push(entered);advances++;
  }
  if(values.length!==task.length||advances<task.length-1||
     !same(values,model.board?.values))return null;
  return {values,displayValues:values.map(v=>String(v/scale)),advances,undos,scale};
}
