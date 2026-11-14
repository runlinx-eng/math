// Source-bound observations of line comparisons; never changes the B23 grader.
import * as geometry from './phase5/b23-model.js';
import {scenario,vectors} from './phase5/b23-geometry.js';
import {isEvidenceContext,matchesNativeEvidenceTask} from './evidence-contract.js';
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
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(task?.type!=='x-s23-lines'||!source||!Number.isInteger(context.index)||
    !source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-s23-lines',nodeId:source.nodeId}))return null;
 const question=task.required.length===2?
  '先选一对边，想想把它们延长后会怎样。再换一对：它们相交会形成直角吗？同一个图形能同时出现这两种关系吗？':
  task.required[0]==='parallel'?'先猜哪两条边延长后不会相交，再选出它们比较。图形转斜以后，你会怎样检查？':
  '先猜哪两条边相交形成直角，再选出它们比较。边是否水平，会改变这个关系吗？';
 return {...source,question};
}
// Recompute from edge vectors, rather than trusting stored relation booleans.
// Keep every visible request: an empty/same-edge choice fails without adding a
// comparison, and repeating a pair really adds another comparison in B23.
// The lines view has no reset button; unrelated actions remain unbound.
export function replayLineEvidence(task,model){
 try{
  if(task?.type!=='x-s23-lines'||!model||!Array.isArray(model.history)||
     !model.history.length||!geometry.valid(task,model)||!geometry.inspect(task,model).correct||
     !keys(model,[...Object.keys(geometry.fields(task)),'seed','board','history','issue']))return null;
  const vs=vectors(scenario(task.shape,task.rotation)),seen=new Set(),tests=[],events=[];
  const option=s=>s===''||vs.some((_,i)=>s===String(i));
  if(!option(model.first)||!option(model.second))return null;
  for(const [k,v] of Object.entries(geometry.fields(task)))if(!['first','second','answers','prose'].includes(k)&&!same(model[k],v))return null;
  let firstAttempt=null,issue='',failedComparisons=0,repeatedComparisons=0;
  for(const [historyIndex,e] of model.history.entries()){
   if(!keys(e,['a','f','d'])||e.a!=='lineTest'||!keys(e.f,['first','second'])||!keys(e.d,[])||
      ![e.f.first,e.f.second].every(s=>typeof s==='string'&&option(s)))return null;
   firstAttempt??={...e.f};issue='';
   const first=e.f.first===''?null:Number(e.f.first),second=e.f.second===''?null:Number(e.f.second);
   if(first===null||second===null||first===second){
    issue='选两条不同的边，再把它们延长比较。';failedComparisons++;
    events.push({historyIndex,fields:{...e.f},accepted:false,comparisonIndex:null,issue});continue;
   }
   const key=[first,second].sort((a,b)=>a-b).join(':');
   const repeated=seen.has(key);if(repeated)repeatedComparisons++;seen.add(key);
   const a=vs[first],b=vs[second];
   const parallel=Math.abs(a[0]*b[1]-a[1]*b[0])<1e-7;
   const perpendicular=Math.abs(a[0]*b[0]+a[1]*b[1])<1e-7;
   events.push({historyIndex,fields:{...e.f},accepted:true,comparisonIndex:tests.length,repeated,parallel,perpendicular,issue});
   tests.push({first,second,parallel,perpendicular});
  }
  if(model.issue!==issue||!same({first:{lineTest:firstAttempt},tests},model.board)||
     !task.required.every(k=>tests.some(x=>x[k]===true)))return null;
  return {tests,shape:task.shape,rotation:task.rotation||0,firstAttempt,failedComparisons,repeatedComparisons,events};
 }catch{return null;}
}
