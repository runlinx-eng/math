// Read-only second-pass interaction semantics and replay contract probes.
// Contract profiles are NOT pedagogy-ready mathematics thinking adapters.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {defaultModel,exampleModel,validModel,inspect} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=resolve(root,'verification/learning-evidence-audit');
execFileSync(process.execPath,['scripts/audit-learning-evidence.mjs'],{cwd:root,encoding:'utf8',timeout:120000});
await ensureB39Ready();
const load=n=>JSON.parse(readFileSync(resolve(dir,n),'utf8'));
const rows=load('tasks.json').rows;
const base=load('summary.json');
const order=(a,b)=>String(a).localeCompare(String(b),'en');
const unique=x=>[...new Set(x)].sort(order);
const write=(name,body)=>writeFileSync(resolve(dir,name),JSON.stringify(body,null,2)+'\n');
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const byType=new Map();
for(const row of rows){
 if(!byType.has(row.type))byType.set(row.type,[]);
 byType.get(row.type).push(row);
}
assert(byType.size===base.uniqueInteractionTypes,'Type inventory mismatch');
assert(rows.length===base.nativeCoreTasks+base.bridgeTasks,'Task inventory mismatch');
const taskAt=row=>sessionTasks(row.sessionId)?.[row.index];
function probe(task){
 const out={defaultValid:false,exampleGenerated:false,exampleValid:false,exampleCorrect:false,
  historyField:false,exampleEventCount:0,eventNames:[],eventKeys:[],
  boardField:false,boardKeys:[],forgedEventRejected:null,boardTamperRejected:null,
  reversedEventsRejected:null,truncatedEventsRejected:null,
  error:null};
 try{
  const initial=defaultModel(task);
  out.defaultValid=validModel(task,initial)===true;
  out.historyField=Array.isArray(initial?.history);
  out.boardField=initial?.board!==null&&typeof initial?.board==='object';
  out.boardKeys=out.boardField?Object.keys(initial.board).sort(order):[];
  const example=exampleModel(task);
  out.exampleGenerated=!!example;
  out.exampleValid=validModel(task,example)===true;
  if(out.exampleValid)out.exampleCorrect=inspect(task,example)?.correct===true;
  const events=Array.isArray(example?.history)?example.history:[];
  out.exampleEventCount=events.length;
  out.eventNames=unique(events.map(e=>String(e?.a??e?.action??'unknown')));
  out.eventKeys=unique(events.flatMap(e=>e&&typeof e==='object'?Object.keys(e):[]));
  if(out.historyField&&example&&Array.isArray(example.history)){
   const forged=structuredClone(example);
   forged.history.push({a:'__audit_unknown_event__',action:'__audit_unknown_event__'});
   out.forgedEventRejected=validModel(task,forged)===false;
   if(events.length>1){const reversed=structuredClone(example);reversed.history.reverse();out.reversedEventsRejected=validModel(task,reversed)===false;}
   if(events.length>0){const truncated=structuredClone(example);truncated.history.pop();out.truncatedEventsRejected=validModel(task,truncated)===false;}
  }
  if(out.boardField&&example){
   const altered=structuredClone(example);
   altered.board={__audit_fake_board__:true};
   out.boardTamperRejected=validModel(task,altered)===false;
  }
 }catch(error){out.error=String(error?.message||error);}
 return out;
}
const semantic=[],gaps=[],profiles=new Map(),risks=[];
for(const [type,members] of [...byType].sort(([a],[b])=>order(a,b))){
 const representative=members.find(r=>r.kind==='native')||members[0];
 const task=taskAt(representative);
 assert(task?.type===type,'Task reference drift '+representative.id);
 const p=probe(task);
 const native=members.filter(r=>r.kind==='native'),bridge=members.filter(r=>r.kind==='bridge');
 const modelFields=unique(members.flatMap(r=>r.modelFields));
 const signature=JSON.stringify([representative.validatorOwner,modelFields,p.boardKeys,p.eventKeys]);
 const profileId='contract-profile-'+String(profiles.size+1).padStart(3,'0');
 if(!profiles.has(signature))profiles.set(signature,{id:profileId,validatorOwner:representative.validatorOwner,
  modelFields,boardKeys:p.boardKeys,eventKeys:p.eventKeys,types:[],taskIds:[],nodeIds:[],nativeTaskIds:[],bridgeTaskIds:[],
  status:'technical signature only; mathematical semantics and feedback reuse unverified'});
 const group=profiles.get(signature);
 group.types.push(type);
 group.taskIds.push(...members.map(r=>r.id));
 group.nodeIds.push(...members.filter(r=>r.kind==='native').map(r=>r.nodeId));
 group.nativeTaskIds.push(...native.map(r=>r.id));
 group.bridgeTaskIds.push(...bridge.map(r=>r.id));
 const sessions=unique(native.map(r=>r.sessionId)),sourceNodes=unique(native.map(r=>r.nodeId));
 const sourceMP=unique(native.map(r=>r.sourceThinkingCode||'unclassified'));
 const entry={
  type,representativeTaskId:representative.id,validatorOwner:representative.validatorOwner,
  technicalProfileId:group.id,nativeCoreTasks:native.length,bridgeTasks:bridge.length,
  nativeNodeCount:sourceNodes.length,nativeSessions:sessions,
  nativeSourceNodes:sourceNodes,sourceThinkingCodes:sourceMP,
  modelFields,historyTasksNative:native.filter(r=>r.hasHistory).length,
  intermediateModelTasksNative:native.filter(r=>r.intermediateModel).length,
  freeTextTasksNative:native.filter(r=>r.freeTextFields.length).length,
  staticEvidenceLevels:Object.fromEntries(['A','B','C','D','E'].map(level=>[level,native.filter(r=>r.evidenceLevel===level).length])),
  currentExplicitGuideBindings:native.filter(r=>r.optionalThinkingGuide).map(r=>r.id),
  currentExactPilotReplayBindings:native.filter(r=>r.replayVerified).map(r=>r.id),
  probe:p,
  contractStatus:'representative runtime probe only; not a complete proof over every variant',
  mathematicalSemanticFamily:'unresolved',
  automaticReasoningInference:false
 };
 semantic.push(entry);
 gaps.push({type,technicalProfileId:group.id,sample:representative.id,
  hasHistory:p.historyField,exampleEvents:p.exampleEventCount,
  eventSchemaObserved:p.eventKeys.length>0,invalidEventProbeRejected:p.forgedEventRejected,
  boardTamperProbeRejected:p.boardTamperRejected,
  reversedEventsProbeRejected:p.reversedEventsRejected,
  truncatedEventsProbeRejected:p.truncatedEventsRejected,
  replayOfAllEventsVerified:false,
  illegalEventOrderingVerified:false,
  intermediateMathematicsVerified:false,
  currentAttemptFreshnessVerifiedForAllCourses:false,
  manualReviewRequired:true,
  rationale:'One example and two tampering probes cannot prove all legal event sequences or current-attempt feedback freshness'});
 if(sessions.length>1||sourceMP.length>1){
  risks.push({type,nativeSessionCount:sessions.length,nativeCoreTasks:native.length,
    sessions,sourceThinkingCodes:sourceMP,
    risk:'Technical reuse does not grant global mathematics-method labels; require explicit session/index/type/source binding'});
 }
}
const coverage=[...profiles.values()].map(p=>({
 id:p.id,validatorOwner:p.validatorOwner,types:unique(p.types),typeCount:p.types.length,
 nativeCoreTasks:p.nativeTaskIds.length,bridgeTasks:p.bridgeTaskIds.length,
 nativeNodeCount:unique(p.nodeIds).length,
 status:p.status
})).sort((a,b)=>order(a.id,b.id));
assert(semantic.length===base.uniqueInteractionTypes,'Missing type semantic row');
assert(coverage.reduce((a,p)=>a+p.nativeCoreTasks,0)===base.nativeCoreTasks,'Native profile coverage mismatch');
assert(coverage.reduce((a,p)=>a+p.bridgeTasks,0)===base.bridgeTasks,'Bridge profile coverage mismatch');
const summary={schema:'math-learning-interaction-semantic/1',basis:'Live original models and one example per task.type, read-only',
 interactionTypes:semantic.length,technicalContractProfiles:coverage.length,
 nativeCoreTasks:base.nativeCoreTasks,bridgeTasks:base.bridgeTasks,
 representativeExamplesValid:semantic.filter(x=>x.probe.exampleValid).length,
 representativeExamplesCorrect:semantic.filter(x=>x.probe.exampleCorrect).length,
 typesWithObservedEvents:semantic.filter(x=>x.probe.exampleEventCount>0).length,
 typesRejectingForgedEvent:semantic.filter(x=>x.probe.forgedEventRejected===true).length,
 typesRejectingBoardTamper:semantic.filter(x=>x.probe.boardTamperRejected===true).length,
 typesRejectingReversedHistory:semantic.filter(x=>x.probe.reversedEventsRejected===true).length,
 typesRejectingTruncatedHistory:semantic.filter(x=>x.probe.truncatedEventsRejected===true).length,
 crossCourseOrSourceRiskTypes:risks.length,
 confirmedPedagogicalAdapterFamilies:null,
 warning:'Technical profiles use structural fingerprints, not a proven pedagogical semantic equivalence. Probes are one representative task per type, not all task variants.'};
const nativeRows=rows.filter(r=>r.kind==='native');
const overlap={
 totalNative:nativeRows.length,
 staticAEvidence:nativeRows.filter(r=>r.evidenceLevel==='A').length,
 staticBEvidence:nativeRows.filter(r=>r.evidenceLevel==='B').length,
 staticCEvidence:nativeRows.filter(r=>r.evidenceLevel==='C').length,
 staticDEvidence:nativeRows.filter(r=>r.evidenceLevel==='D').length,
 staticEEvidence:nativeRows.filter(r=>r.evidenceLevel==='E').length,
 withHistory:nativeRows.filter(r=>r.hasHistory).length,
 withIntermediateModel:nativeRows.filter(r=>r.intermediateModel).length,
 withFreeText:nativeRows.filter(r=>r.freeTextFields.length>0).length,
 DWithIntermediateModel:nativeRows.filter(r=>r.evidenceLevel==='D'&&r.intermediateModel).length,
 DWithHistory:nativeRows.filter(r=>r.evidenceLevel==='D'&&r.hasHistory).length,
 exactPilotReplay:nativeRows.filter(r=>r.replayVerified).length,
 warning:'Nonexclusive shape capability counts; history alone is NOT strict replay and free text is NOT automatically scored'
};
assert(['A','B','C','D','E'].reduce((n,k)=>n+overlap['static'+k+'Evidence'],0)===overlap.totalNative,'Original A-E totals mismatch');
write('evidence-capability-overlap.json',overlap);
write('interaction-semantic-matrix.json',{summary,rows:semantic});
write('replay-contract-gaps.json',{rows:gaps});
write('adapter-family-candidates.json',{method:'mechanical technical contract profiles; not confirmed teaching adapters',rows:coverage});
write('adapter-family-coverage.json',{summary,rows:coverage});
write('cross-course-attribution-risks.json',{rows:risks});
write('semantic-summary.json',{...summary,overlap});
const report=[
 '# 323 种交互：数学证据契约第二轮只读审计','',
 '本轮按每个 task.type 实际抽取一个代表性任务，调用原有 defaultModel、exampleModel、validModel、inspect，并对示例历史执行伪造事件、逆序、截断及篡改 board 等负样本。',
 '',
 '| 指标 | 本轮运行结果 |','|---|---:|',
 ...Object.entries(summary).filter(([,v])=>typeof v==='number').map(([k,v])=>'| '+k+' | '+v+' |'),
 '','## 契约准入与待办','',
 '- 负样本被拒绝，只能证明这一个代表性示例对于某一种篡改有防护，不能代替完整事件合法性、全路径回放或时序证明。',
 '- 技术结构指纹只用于发现可能复用的代码接口，不是数学语义；最终数学证据适配器家族数暂不确定。',
 '- 分数表示、几何、数列、证明反例、统计、测量等数学对象仍必须逐类型核对 inspect 条件与事件参数，不按名称或判题模块直接合并。',
 '- 数学思维来源必须使用显式 sessionId、index、task.type、source node 绑定；跨课可共享引擎，不能共享自动正面反馈资格。',
 '- 关联练习 1552 道、776 组的任务保持独立归属；绝不计入核心题进度。',
 '- 开放文字只记录学生表达，不自动得出论证质量或掌握结论。反馈未复核最新提交必须失效。',
 '','## 下一批次最小实施建议','',
 '1. B23/B34 的已知 MP.7/MP.8 绑定作回归基线，增加非法事件顺序与历史/提交差异的负样本。',
 '2. B17/B38 的不同数学事实与来源绑定逐类型复审，分离数学对象验证与可选思考引导。',
 '3. 按本次矩阵中的高覆盖契约指纹筛选真实场景，每批 1–2 模块，另行设计显式参数及独立 Chromium/P10 验收。',
 '4. 无过程事件、仅答案或自由文字的类型先审查可选思考引导；如要求过程证据，需另设交互重构任务。',
 '','## 已观察的技术指纹（非数学家族）','',
 '| 指纹 | 判题模块 | 类型 | 原生题 | 关联题 | 节点 |','|---|---|---:|---:|---:|---:|',
 ...coverage.map(p=>'| '+p.id+' | '+p.validatorOwner+' | '+p.typeCount+' | '+p.nativeCoreTasks+' | '+p.bridgeTasks+' | '+p.nativeNodeCount+' |')
];
writeFileSync(resolve(dir,'SEMANTIC-REPORT.md'),report.join('\n')+'\n');
console.log('SEMANTIC_AUDIT '+JSON.stringify(summary));
