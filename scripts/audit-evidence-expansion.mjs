// Source-derived candidates are review work, never automatic runtime admission.
// The committed review manifest is an independent, deliberate approval record:
// CI reads it but never regenerates it from the adapters it is meant to check.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {exampleModel,validModel,inspect} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {fractionEvidenceExample} from './fraction-evidence-fixture.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const sort=(a,b)=>String(a).localeCompare(String(b),'en');
const read=name=>JSON.parse(readFileSync(resolve(root,name),'utf8'));
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort(sort).map(key=>[key,stable(value[key])])):value;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const named=value=>typeof value==='string'&&value.length>0;
const fixtureFor=task=>task.type==='x-fracrename'?fractionEvidenceExample(task):exampleModel(task);
export const taskFingerprint=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
await ensureB39Ready();

export function auditEvidenceExpansion({adapters=EVIDENCE_ADAPTERS,
 manifest=read('docs/spatial-learning/evidence-review-manifest.json'),
 feedbackFor=thinkingFeedback,guideFor=thinkingGuide}={}){
 const thinking=read('docs/spatial-learning/thinking-source-map.json');
 const practice=new Map(thinking.groups.flatMap(group=>group.nodes.map(node=>[node.id,{code:group.code,label:node.displayName}])));
 const defects=[],rows=[],bridges=[],byId=new Map(),seenManifest=new Set();
 const report=(kind,id,detail)=>defects.push({kind,id,detail});
 if(!object(manifest)||manifest.schema!=='math-evidence-reviewed-sources/1'||!Array.isArray(manifest.tasks))
  throw Error('Unsupported reviewed source manifest');
 for(const [position,entry] of manifest.tasks.entries()){
  if(!object(entry)||!named(entry.sessionId)||!Number.isSafeInteger(entry.index)||entry.index<0||
     !named(entry.type)||!named(entry.nodeId)||!named(entry.adapter)||
     typeof entry.taskHash!=='string'||!/^[a-f0-9]{64}$/.test(entry.taskHash)||
     !(entry.method===null||object(entry.method)&&named(entry.method.nodeId)&&named(entry.method.code))){
   report('malformed-reviewed-entry','manifest:'+position,'Review entries require a typed native index, source, adapter, complete task hash and explicit method');
   continue;
  }
  const key=entry.sessionId+':'+entry.index;
  if(seenManifest.has(key))report('duplicate-reviewed-position',key,'One native position must have one reviewed contract');
  seenManifest.add(key);byId.set(key,entry);
 }
 const familyIds=new Set();
 for(const adapter of adapters){
  if(familyIds.has(adapter.id))report('duplicate-adapter-id',adapter.id,'Registry IDs must be unique');
  familyIds.add(adapter.id);
 }
 const familyRows=new Map(adapters.map(adapter=>[adapter.id,[]]));
 for(const sessionId of Object.keys(LESSONS).sort(sort)){
  sessionTasks(sessionId).forEach((task,index)=>{
   const context={sessionId,index},key=sessionId+':'+index,nodeId=LESSONS[sessionId].topicId;
   const expected=byId.get(key),fingerprint=taskFingerprint(task);
   const candidates=adapters.filter(adapter=>adapter.type===task.type),matches=[];
   let example=null,exampleError=null;
   if(candidates.length||expected){
    try{example=fixtureFor(task);}
    catch(error){exampleError=String(error.message||error);}
   }
   // A registry declaration must not conceal an accidentally broad binding.
   // Checking only same-widget adapters would miss this otherwise real scope bug.
   for(const adapter of adapters.filter(adapter=>adapter.type!==task.type)){
    try{if(adapter.binding(task,context))report('native-binding-wrong-widget',key,adapter.id);}
    catch(error){report('native-binding-error',key,adapter.id+': '+String(error.message||error));}
   }
   for(const adapter of candidates){
    let binding=null,replayed=false,error=exampleError;
    try{binding=adapter.binding(task,context);if(example)replayed=!!adapter.replay(task,example);}
    catch(cause){error=String(cause.message||cause);}
    const manifestMatched=!!expected&&expected.adapter===adapter.id&&expected.type===task.type&&
     expected.nodeId===nodeId&&expected.taskHash===fingerprint;
    const candidate={id:key,adapter:adapter.id,type:task.type,nodeId,bound:!!binding,manifestMatched,
     exampleReplayPassed:replayed,status:binding?(manifestMatched?'reviewed-binding':'unreviewed-runtime-binding'):
      replayed?'reviewable-unbound':'different-or-unverified-contract',
     manualReviewRequired:!binding||!manifestMatched||!replayed||!!error,error};
    familyRows.get(adapter.id).push(candidate);
    if(binding){
     matches.push({adapter,binding,replayed,error});
     if(binding.nodeId!==nodeId)report('binding-source-mismatch',key,adapter.id);
     if(error||!replayed)report('reviewed-replay-failed',key,error||adapter.id);
    }
   }
   if(matches.length>1)report('overlapping-native-bindings',key,matches.map(match=>match.adapter.id).join(','));
   if(expected){
    if(expected.type!==task.type||expected.nodeId!==nodeId)
     report('reviewed-source-changed',key,'Native type or source node differs from the reviewed manifest');
    if(expected.taskHash!==fingerprint)
     report('reviewed-task-changed',key,'Complete source task requires a new deliberate mathematical review');
    if(matches.length!==1||matches[0].adapter.id!==expected.adapter)
     report('reviewed-binding-missing-or-changed',key,expected.adapter);
   }else if(matches.length)report('unreviewed-runtime-binding',key,matches.map(match=>match.adapter.id).join(','));
   if(candidates.length||expected){
    let feedback=null,guide=null;
    try{
     guide=guideFor(task,context);
     feedback=example?feedbackFor(task,example,{attempts:[{value:structuredClone(example)}]},context):null;
    }catch(error){report('feedback-error',key,String(error.message||error));}
    if((matches.length||expected)&&(!guide||!feedback))
     report('reviewed-ui-binding-missing',key,'Positive fixture has no matching guide/feedback');
    if(!matches.length&&(guide||feedback))
     report('unreviewed-native-ui-binding',key,'An unbound candidate must not receive a guide or strict factual feedback');
    const method=feedback?.method||null;
    if(method&&(method.nodeId!==nodeId||practice.get(method.nodeId)?.code!==method.code||
       practice.get(method.nodeId)?.label!==method.label))
     report('unjustified-method-label',key,'Method must match the real native source, MP code and source display name');
    if(expected&&(expected.method===null?method!==null:
       !method||expected.method.nodeId!==method.nodeId||expected.method.code!==method.code))
     report('reviewed-method-changed',key,'A source method cannot be added merely because the widget is reused');
    if(matches.length&&example&&(!validModel(task,example)||!inspect(task,example).correct))
     report('original-grader-failed',key,'Strict evidence cannot replace original grading');
   }
   rows.push({id:key,sessionId,index,type:task.type,nodeId,taskHash:fingerprint,
    reviewed:!!expected,boundAdapters:matches.map(match=>match.adapter.id)});
  });
 }
 const nativeIds=new Set(rows.map(row=>row.id));
 for(const key of seenManifest)if(!nativeIds.has(key))report('reviewed-position-missing',key,'The original native task disappeared');
 for(const sessionId of Object.keys(BRIDGES).sort(sort))sessionTasks(sessionId).forEach((task,index)=>{
  const context={sessionId,index},key=sessionId+':'+index;
  for(const adapter of adapters){
   let binding=null;
   try{binding=adapter.binding(task,context);}
   catch(error){report('bridge-binding-error',sessionId+':'+index,String(error.message||error));}
   if(binding){bridges.push({sessionId,index,adapter:adapter.id});report('bridge-inherits-native-binding',sessionId+':'+index,adapter.id);}
  }
  // The actual UI has its own code path. A by-type feedback fallback must not
  // leak reviewed native observations even while every adapter still says null.
  if(adapters.some(adapter=>adapter.type===task.type)){
   try{
    const guide=guideFor(task,context),example=fixtureFor(task);
    const feedback=feedbackFor(task,example,{attempts:[{value:structuredClone(example)}]},context);
    if(guide)report('bridge-inherits-native-guide',key,'Associated work received a native evidence guide');
    if(feedback)report('bridge-inherits-native-feedback',key,'Associated work received native strict factual feedback');
   }catch(error){report('bridge-ui-error',key,String(error.message||error));}
  }
 });
 const families=adapters.map(adapter=>{
  const candidates=familyRows.get(adapter.id),bound=candidates.filter(row=>row.bound);
  return {id:adapter.id,type:adapter.type,nativeTasks:candidates.length,
   boundTasks:bound.length,boundNodes:new Set(bound.map(row=>row.nodeId)).size,
   unboundTasks:candidates.length-bound.length,
   exampleReplayableUnbound:candidates.filter(row=>!row.bound&&row.exampleReplayPassed).length,
   unverifiedUnbound:candidates.filter(row=>!row.bound&&!row.exampleReplayPassed).length,candidates};
 });
 const bound=rows.filter(row=>row.boundAdapters.length);
 const summary={schema:'math-evidence-expansion-audit/1',nativeTasks:rows.length,nativeNodes:Object.keys(LESSONS).length,
  bridgeSessions:Object.keys(BRIDGES).length,bridgeTasks:Object.keys(BRIDGES).reduce((n,id)=>n+sessionTasks(id).length,0),
  reviewedTasks:manifest.tasks.length,boundTasks:bound.length,boundNodes:new Set(bound.map(row=>row.nodeId)).size,
  families:adapters.length,defects:defects.length,bridgeBindings:bridges.length,
  caution:'A passing example identifies a review candidate only; it never grants A classification, a binding, method label, learner score or pedagogical approval. Full A–E classification remains in audit-learning-evidence.mjs.'};
 return {summary,families,defects,reviewed:rows.filter(row=>row.reviewed)};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=auditEvidenceExpansion(),out=resolve(root,'verification/learning-evidence-audit');
 mkdirSync(out,{recursive:true});
 writeFileSync(resolve(out,'expansion-candidates.json'),JSON.stringify(result,null,2)+'\n');
 const lines=['# 数学证据扩展与来源核对','',
  '候选样例通过只表示值得审查，不能自动接入、升级为A类、传播MP标签或认定儿童掌握；全量A–E分类仍由audit-learning-evidence.mjs独立审计。','',
  '| 家族 | 同类型原生题 | 已绑定 | 未绑定 | 未绑定但样例可回放 | 未验证/不同契约 |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
  ...result.families.map(f=>`| ${f.id} | ${f.nativeTasks} | ${f.boundTasks} | ${f.unboundTasks} | ${f.exampleReplayableUnbound} | ${f.unverifiedUnbound} |`),'',
  `审查清单 ${result.summary.reviewedTasks} 题；当前绑定 ${result.summary.boundTasks} 题/${result.summary.boundNodes} 节点；来源/绑定/方法缺陷 ${result.summary.defects} 项。`,
  '同一控件可有多个互斥数学契约，家族列中的同类型数量不可相加充当全量覆盖。',
  '完整原题指纹、课程索引、源节点、适配器和方法标签由已提交审查清单约束；CI只读，任何更新均须在对应数学审查PR中明确提交。',''];
 writeFileSync(resolve(out,'EXPANSION-REPORT.md'),lines.join('\n'));
 console.log('EVIDENCE_EXPANSION_AUDIT '+JSON.stringify(result.summary));
 if(result.defects.length)process.exitCode=1;
}
