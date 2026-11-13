// Source-bound observations of line comparisons; never changes the B23 grader.
import * as geometry from './phase5/b23-model.js';
import {scenario,vectors} from './phase5/b23-geometry.js';
import {sessionMeta,sessionTasks} from './bridges.js';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const keys=(x,wanted)=>x&&typeof x==='object'&&!Array.isArray(x)&&same(Object.keys(x).sort(),wanted.sort());
const SOURCES=Object.freeze({
 lineproperties:{indices:[0,1,2],nodeId:'mt_r8c43QB6wx'},
 geometrynotation:{indices:[2],nodeId:'mt_WtIFJSCQIT'},
 lineorientation:{indices:[0,1,2,3],nodeId:'mt_u23IGDxOpk'},
 linemark:{indices:[1],nodeId:'mt_QysgF57dxh'},
 structure34:{indices:[3],nodeId:'mt_FAXjFkgG6X',method:{nodeId:'mt_FAXjFkgG6X',label:'数位、运算与图形中的结构',code:'ccss-math:MP.7'}}
});
export function lineBinding(task,context={}){
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(task?.type!=='x-s23-lines'||!source||!Number.isInteger(context.index)||
    !source.indices.includes(context.index)||sessionMeta(context.sessionId)?.topicId!==source.nodeId||
    !same(sessionTasks(context.sessionId)?.[context.index],task))return null;
 const question=task.required.length===2?
  '先选一对边，想想把它们延长后会怎样。再换一对：它们相交会形成直角吗？同一个图形能同时出现这两种关系吗？':
  task.required[0]==='parallel'?'先猜哪两条边延长后不会相交，再选出它们比较。图形转斜以后，你会怎样检查？':
  '先猜哪两条边相交形成直角，再选出它们比较。边是否水平，会改变这个关系吗？';
 return {...source,question};
}
// Recompute from edge vectors, rather than trusting stored relation booleans.
// Accept distinct exploratory pairs, but conservatively refuse duplicate/no-op,
// reset, irrelevant actions, malformed fields and any invalid intermediate event.
export function replayLineEvidence(task,model){
 try{
  if(task?.type!=='x-s23-lines'||!model||!Array.isArray(model.history)||
     !model.history.length||!geometry.valid(task,model)||!geometry.inspect(task,model).correct||model.issue!=='')return null;
  const vs=vectors(scenario(task.shape,task.rotation)),seen=new Set(),tests=[];
  if(model.history.length>vs.length*(vs.length-1)/2)return null;
  for(const e of model.history){
   if(!keys(e,['a','f','d'])||e.a!=='lineTest'||!keys(e.f,['first','second'])||!keys(e.d,[])||
      ![e.f.first,e.f.second].every(s=>typeof s==='string'&&/^\d+$/.test(s)))return null;
   const first=Number(e.f.first),second=Number(e.f.second);
   if(!Number.isInteger(first)||!Number.isInteger(second)||first===second||first>=vs.length||second>=vs.length)return null;
   const key=[first,second].sort((a,b)=>a-b).join(':');
   if(seen.has(key))return null;seen.add(key);
   const a=vs[first],b=vs[second];
   const parallel=Math.abs(a[0]*b[1]-a[1]*b[0])<1e-7;
   const perpendicular=Math.abs(a[0]*b[0]+a[1]*b[1])<1e-7;
   tests.push({first,second,parallel,perpendicular});
  }
  if(!same(tests,model.board.tests)||!task.required.every(k=>tests.some(x=>x[k]===true)))return null;
  return {tests,shape:task.shape,rotation:task.rotation||0};
 }catch{return null;}
}
