// Read-only, source-derived task interaction and evidence capability inventory.
// Capability is not verified learner mastery or individual browser validation.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LESSONS} from '../dist/learning/catalog.js';
import {TASKS,defaultModel,validModel,inspect,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sourceBridge} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {sequenceBinding,replaySequenceEvidence} from '../dist/learning/sequence-evidence.js';
import {arrayBinding,replayArrayEvidence} from '../dist/learning/array-evidence.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=resolve(root,'verification/learning-evidence-audit');
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const assert=(ok,reason)=>{if(!ok)throw Error(reason);};
const sort=(a,b)=>String(a).localeCompare(String(b),'en');
const sorted=o=>Object.fromEntries(Object.entries(o).sort(([a],[b])=>sort(a,b)));
const write=(name,data)=>writeFileSync(resolve(out,name),JSON.stringify(data,null,2)+'\n');
const atlas=json('dist/data/atlas.json');
const source=json('dist/data/math.json');
const thinking=json('docs/spatial-learning/thinking-source-map.json');
await ensureB39Ready();
// This is the real dispatch ownership implemented in phase4/engine.js.
// The model module is a validator family, NOT automatically a teaching adapter.
const engines=await Promise.all(Array.from({length:38},(_,i)=>i+2).map(async n=>{
 const batch='B'+String(n).padStart(2,'0');
 const module=await import('../dist/learning/'+(n<=5?'phase4/':'phase5/')+'b'+String(n).padStart(2,'0')+'-model.js');
 return {batch,module};
}));
const owners=new Map();
for(const {batch,module} of engines)for(const type of module.TYPES||[]){
 assert(!owners.has(type),'Multiple validator owners: '+type);
 owners.set(type,batch);
}
const nodeById=new Map(source.nodes.map(n=>[n.id,n]));
const mpByNode=new Map();
for(const group of thinking.groups||[])for(const n of group.nodes)mpByNode.set(n.id,group.code);
for(const n of thinking.untagged||[])mpByNode.set(n.id,null);
assert(source.nodes.length===nodeById.size,'Duplicate source nodes');
assert(atlas.edges.length===1223,'Unexpected source edge count; investigate instead of adjusting data');
assert(mpByNode.size===50,'Thinking source catalogue changed');
const rows=[],unknown=[],risk=[];
const seen=new Set();
function visit(kind,sessionId,index,task,nodeId,relatedNodeId=null){
 const id=kind+':'+sessionId+':'+index;
 assert(!seen.has(id),'Duplicate task identifier '+id);
 seen.add(id);
 assert(task&&typeof task.type==='string','Missing task type '+id);
 const owner=task.type.startsWith('x-')?owners.get(task.type)||null:'native-legacy';
 let model,valid=false,checked=false,error=null;
 try{
  model=defaultModel(task);
  valid=validModel(task,model)===true;
  // Only exercise the actual grader; do not infer success from a blank model.
  if(valid){const verdict=inspect(task,model);checked=typeof verdict?.correct==='boolean';}
 }catch(e){error=String(e.message||e);}
 const history=Array.isArray(model?.history);
 const board=model?.board&&typeof model.board==='object';
 const fields=model&&typeof model==='object'?Object.keys(model).sort(sort):[];
 const freeText=fields.filter(k=>/^(prose|explanation|reflection|reason|justification|argument|why|note|notes)$/i.test(k) && typeof model[k]==='string');
 const guide=kind==='native'?thinkingGuide(task,{sessionId,index}):null;
 // Current exact replay feedback pilot; all other history fields are unverified as replay evidence.
 const verifiedReplay=kind==='native'&&history&&!!board&&(
   (!!sequenceBinding(task,{sessionId,index})&&!!replaySequenceEvidence(task,exampleModel(task)))||
   (!!arrayBinding(task,{sessionId,index})&&!!replayArrayEvidence(task,exampleModel(task))));
 let level,reason;
 if(!owner||!valid||!checked||error){level='E';reason='Unknown validator, invalid default model, or grader not inspectable';}
 else if(verifiedReplay){level='A';reason='Explicit native task with source-bound strict mathematics replay and current-submission regression';}
 else if(freeText.length){level='D';reason='Model includes ungraded free explanation; automatic reasoning mastery unsupported';}
 else if(board||fields.some(k=>['selected','filled','rows','counts','heights','cuts','mark','points','shapes','tiles','pieces'].includes(k))){
  level='B';reason='Inspectable workpiece/model state, no full event replay proven by this audit';
 }else if(history){level='E';reason='History field found but replay contract not independently verified';}
 else {level='C';reason='Final model/result can be graded; no intermediate workpiece proven';}
 const sourceKnown=nodeById.has(nodeId);
 const sourceLink=kind==='native'
  ?LESSONS[sessionId]?.topicId===nodeId
  :BRIDGES[sessionId]?.fromTopicId===nodeId&&BRIDGES[sessionId]?.topicId===relatedNodeId&&!!sourceBridge(sessionId,atlas);
 const tagged=kind==='native'&&!!guide;
 const row={id,kind,nodeId,relatedNodeId,sessionId,index,type:task.type,validatorOwner:owner,
  validator:owner==='native-legacy'?'dist/learning/tasks.js#inspect':'dist/learning/phase4/engine.js#inspectExtra -> '+owner,
  modelFields:fields,defaultModelValid:valid,graderCallable:checked,hasHistory:history,
  replayVerified:verifiedReplay,intermediateModel:!!board||fields.some(k=>['selected','filled','rows','counts','heights','cuts','mark','points','shapes','tiles','pieces'].includes(k)),
  finalAnswerOnly:level==='C',freeTextFields:freeText,evidenceLevel:level,evidenceReason:reason,
  sourceMapped:sourceKnown&&sourceLink,sourceEvidence:kind==='native'?'LESSONS[sessionId].topicId':'BRIDGES[id].fromTopicId/topicId + sourceBridge(id,atlas)',
  sourceThinkingCode:mpByNode.get(nodeId)||null,
  optionalThinkingGuide:tagged,thinkingGuideBinding:tagged?sessionId+':'+index:null,
  thinkingFeedbackBinding:kind==='native'&&(verifiedReplay||(sessionId==='structure34'&&index===3)),
  crossCourseReuseRisk:false,
  uncertainty:error||(!sourceLink?'Unverified source mapping':(!owner?'Missing validator ownership':(history&&!verifiedReplay?'History replay not established':null)))};
 rows.push(row);
 if(!row.sourceMapped||!owner||!valid||!checked)unknown.push({id,reason:row.uncertainty||row.evidenceReason});
}
for(const id of Object.keys(LESSONS).sort(sort)){
 const nodeId=LESSONS[id].topicId;
 assert(nodeById.has(nodeId),'Native session missing source node '+id);
 const tasks=sessionTasks(id);
 assert(Array.isArray(tasks)&&tasks.length,'Missing native tasks '+id);
 tasks.forEach((t,i)=>visit('native',id,i,t,nodeId));
}
for(const id of Object.keys(BRIDGES).sort(sort)){
 const b=BRIDGES[id],tasks=sessionTasks(id);
 assert(Array.isArray(tasks)&&tasks.length,'Missing bridge tasks '+id);
 tasks.forEach((t,i)=>visit('bridge',id,i,t,b.fromTopicId,b.topicId));
}
rows.sort((a,b)=>sort(a.id,b.id));
const native=rows.filter(r=>r.kind==='native'),bridge=rows.filter(r=>r.kind==='bridge');
assert(new Set(native.map(r=>r.nodeId)).size===source.nodes.length,'Not all nodes have native tasks');
assert(new Set(native.map(r=>r.sessionId)).size===Object.keys(LESSONS).length,'Native session count mismatch');
assert(new Set(bridge.map(r=>r.sessionId)).size===Object.keys(BRIDGES).length,'Bridge count mismatch');
const types=new Map(),families=new Map(),typeOwners=new Map();
for(const r of rows){
 if(!types.has(r.type))types.set(r.type,[]);
 types.get(r.type).push(r);
 if(!families.has(r.validatorOwner||'unresolved'))families.set(r.validatorOwner||'unresolved',[]);
 families.get(r.validatorOwner||'unresolved').push(r);
 if(!typeOwners.has(r.type))typeOwners.set(r.type,new Set());
 typeOwners.get(r.type).add(r.validatorOwner);
}
for(const t of [...types.keys()]){
 const sessions=new Set(types.get(t).filter(r=>r.kind==='native').map(r=>r.sessionId));
 if(sessions.size>1){
  for(const r of types.get(t))if(r.kind==='native')r.crossCourseReuseRisk=true;
  risk.push({type:t,sessionCount:sessions.size,taskCount:types.get(t).length,
   reason:'Same task.type in multiple native courses; method tags must be explicitly scoped'});
 }
}
const counts=rs=>({tasks:rs.length,nodes:new Set(rs.map(r=>r.nodeId)).size,
 sessions:new Set(rs.map(r=>r.sessionId)).size,native:rs.filter(r=>r.kind==='native').length,
 bridge:rs.filter(r=>r.kind==='bridge').length});
const byType=[...types].sort(([a],[b])=>sort(a,b)).map(([type,rs])=>({type,...counts(rs),
 owners:[...new Set(rs.map(r=>r.validatorOwner))].sort(sort),
 evidenceLevels:sorted(Object.fromEntries(['A','B','C','D','E'].map(k=>[k,rs.filter(r=>r.evidenceLevel===k).length]))),
 historyTasks:rs.filter(r=>r.hasHistory).length,replayVerifiedTasks:rs.filter(r=>r.replayVerified).length,
 crossCourseReuseRisk:rs.some(r=>r.crossCourseReuseRisk)}));
const byFamily=[...families].sort(([a],[b])=>sort(a,b)).map(([family,rs])=>({
 family,...counts(rs),types:[...new Set(rs.map(r=>r.type))].sort(sort),
 historyTasks:rs.filter(r=>r.hasHistory).length,
 verifiedReplayTasks:rs.filter(r=>r.replayVerified).length,
 status:'validator ownership only; teaching adapter requires per-interaction review'
}));
const levels=Object.fromEntries(['A','B','C','D','E'].map(level=>{
 const rs=native.filter(r=>r.evidenceLevel===level);
 return [level,{...counts(rs),percent:Number((rs.length/native.length*100).toFixed(2))}];
}));
const summary={schema:'math-learning-interaction-evidence/1',basis:'Live source modules with B39 loaded; static capability audit, not learner/browser proof',
 sourceNodes:source.nodes.length,sourceEdges:atlas.edges.length,sourceThinkingNodes:mpByNode.size,
 nativeSessions:new Set(native.map(r=>r.sessionId)).size,nativeCoreTasks:native.length,
 bridgeSessions:new Set(bridge.map(r=>r.sessionId)).size,bridgeTasks:bridge.length,
 uniqueInteractionTypes:types.size,validatorFamilies:families.size,
 proposedTeachingAdapterFamilies:'not determined; requires semantic review beyond validator module identity',
 evidenceLevelsNative:levels,unknownTaskCount:unknown.length,
 crossCourseReusedTypes:risk.length,
 historyTasksNative:native.filter(r=>r.hasHistory).length,
 replayVerifiedTasksNative:native.filter(r=>r.replayVerified).length,
 guideBindingsNative:native.filter(r=>r.optionalThinkingGuide).length,
 caution:'A is a source-bound strict sequence or array replay capability for exact native positions, not learner mastery. B/C/D remain conservative model-shape proxies; grader ownership is not a teaching adapter family.'};
mkdirSync(out,{recursive:true});
write('tasks.json',{schema:summary.schema,rows});
write('types.json',{rows:byType});
write('validator-families.json',{rows:byFamily});
write('uncertain.json',{rows:unknown});
write('cross-course-risks.json',{rows:risk});
write('summary.json',summary);
const report=[
 '# 587 节点：交互类型与数学证据只读审计','',
 '复现：node scripts/audit-learning-evidence.mjs；Node 22；先动态装载 B39。不是 587 节点 Chromium 逐项点击。','',
 '| 指标 | 实测 |','| --- | ---: |',
 ...['sourceNodes','sourceEdges','sourceThinkingNodes','nativeSessions','nativeCoreTasks','bridgeSessions','bridgeTasks','uniqueInteractionTypes','validatorFamilies','historyTasksNative','replayVerifiedTasksNative','unknownTaskCount','crossCourseReusedTypes'].map(k=>'| '+k+' | '+summary[k]+' |'),
 '','## 核心任务证据级别（能力的保守静态分类，不代表学生已掌握）','',
 '| 级别 | 任务数 | 占核心任务 |','| --- | ---: | ---: |',
 ...Object.entries(levels).map(([k,v])=>'| '+k+' | '+v.tasks+' | '+v.percent+'% |'),
 '','## 判题器所有权家族（不是已确认教学适配器数量）','',
 '| 模块 | 核心任务 | 关联题 | task.type 数 |','| --- | ---: | ---: | ---: |',
 ...byFamily.map(f=>'| '+f.family+' | '+f.native+' | '+f.bridge+' | '+f.types.length+' |'),
 '','## 准入边界','',
 '- 可选引导必须明确绑定 sessionId + index + task.type，不能按类型全局贴标签。',
 '- A 需要对操作事件合法性、回放、中间状态、当前提交一致性做独立测试。',
 '- B 只描述当前作品；C 不能从答对推断方法；D 的自由解释需教研；E 先核查。',
 '- 776 组关联练习另计，不并入 1,996 道原生核心题。修改作品后过期反馈须自动撤销。',
 '- 本工具没有自动证明所有拥有 history 字段的类型具备严格回放；原判题器和 v2 记录完全不变。',
 '- 适配器数量需要结合交互语义复审；目前的 validatorFamilies 是模型模块层面的可复用底座，不是可上线思维适配器数量。',
 '','## 建议分批（需逐类型复核）','',
 '1. 先为已验证 MP.7/MP.8 的精确任务继续增加负样本和过期反馈测试。',
 '2. 优先复核 A/B 的 history、board 和事件契约；每批选 1–2 判题家族、5–20 道真实任务，不预先承诺全覆盖。',
 '3. C 类先加明确课次映射的可选思考引导，不生成自动方法掌握反馈。',
 '4. D/E 留给数学教研、映射核对或交互重新设计，不通过自动生成正面证据。',
 '5. 每批在 Node、真实 Chromium 双桌面视口、相关 P10 数据安全回归通过后再扩展。'
];
writeFileSync(resolve(out,'REPORT.md'),report.join('\n')+'\n');
console.log('LEARNING_EVIDENCE_AUDIT '+JSON.stringify(summary));
