// Read-only source-to-task gate audit. Never reads or changes browser learning records.
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LESSONS,REFLECTIONS} from '../dist/learning/catalog.js';
import {TASKS,PRACTICE,defaultModel,validModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sourceBridge} from '../dist/learning/bridges.js';
import {ACTIVITIES,KINDS,task as earlyTask,defaultModel as earlyDefault,modelIsValid as earlyValid} from '../dist/exploration-content.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const folder=resolve(root,'verification/learning-node-audit');
const read=name=>JSON.parse(readFileSync(resolve(folder,name),'utf8'));
const write=(name,data)=>writeFileSync(resolve(folder,name),JSON.stringify(data,null,2)+'\n');
const invariant=(condition,why)=>{if(!condition)throw Error(why);};
const source=JSON.parse(readFileSync(resolve(root,'dist/data/math.json'),'utf8'));
const atlas=JSON.parse(readFileSync(resolve(root,'dist/data/atlas.json'),'utf8'));
await ensureB39Ready();
// Always regenerate the source-derived inventory; never trust an old working-tree report.
execFileSync(process.execPath,['scripts/audit-learning-nodes.mjs'],{cwd:root,timeout:120000,stdio:'pipe'});
const base=read('nodes.json').rows;
const nativeGate=['dist/learning/learn.js#next','dist/learning/state.js#lessonSummary',
  'dist/learning/state.js#currentSubmission','dist/learning/bridges.js#sessionTasks',
  'dist/learning/workspace-flow.js#learningActionPlan'];
const definitionPaths=['dist/learning/tasks.js#TASKS','dist/learning/phase4/catalog.js#EXTRA_TASKS',
  'dist/learning/phase5/*#TASKS','dist/learning/phase4/async-batches.js#ensureB39Ready'];
const rows=[];
const seen=new Set();
for(const node of base){
  invariant(!seen.has(node.id),'Duplicated source ID '+node.id);
  seen.add(node.id);
  const native=node.validLessonIds;
  const primary=native.includes(node.primarySessionId)?node.primarySessionId:native[0]||null;
  invariant(primary&&LESSONS[primary]?.topicId===node.id,'No validated native session for '+node.id);
  const lessonTasks=sessionTasks(primary);
  invariant(Array.isArray(lessonTasks)&&lessonTasks.length>0,'Missing tasks for '+primary);
  const required=lessonTasks.map((task,index)=>{
    invariant(validModel(task,defaultModel(task)),'Invalid model '+primary+':'+index);
    return {id:primary+':'+index,sessionId:primary,index,indexDisplay:index+1,
      type:task.type,requiredForNext:true,classification:'core',
      gateEvidence:nativeGate,definitionEvidence:definitionPaths};
  });
  const early=node.earlyActivityIds.map(id=>{
    const cases=KINDS.flatMap(kind=>[0,1].map(variant=>{
      const task=earlyTask(id,kind,variant);
      invariant(earlyValid(task,earlyDefault(task)),'Invalid legacy task '+id+':'+kind+':'+variant);
      return {id:id+':'+kind+':'+variant,kind,variant,type:task.type};
    }));
    return {id,sourceTopic:ACTIVITIES[id].topicId,cases,
      requiredKinds:[...KINDS],variantRule:'either_variant_attempt_per_kind',
      historicalCompletion:'any_attempt_for_construct_and_transfer; correctness not required',
      classification:'separate_legacy_evidence_model_not_native_optional_exam',
      evidence:['dist/exploration-core.js#evidenceSummary','dist/exploration-core.js#nodeState',
        'dist/exploration-content.js#KINDS']};
  });
  const bridges=node.validBridgeIds.map(id=>({
    id,fromTopicId:BRIDGES[id].fromTopicId,toTopicId:BRIDGES[id].topicId,
    taskIds:(sessionTasks(id)||[]).map((task,index)=>id+':'+index),
    sourceEdgeVerified:!!sourceBridge(id,atlas),
    relationToCore:'separate_optional_followup_session_not_required_for_native_node_completion',
    evidence:['dist/learning/bridges.js#nextRelatedPractice','dist/learning/daily.js#connectionTimes']
  }));
  rows.push({
    nodeId:node.id,nodeName:node.name,domain:node.domain,
    primaryEntryKind:node.primaryEntryKind,primarySessionId:primary,
    taskCount:required.length,coreTaskIds:required.map(t=>t.id),
    coreTaskIndexes:required.map(t=>t.index),coreTasks:required,
    optionalScoredTaskIds:[],optionalScoredTaskIndexes:[],
    optionalScoredClassification:'none_configured_in_native_session',
    practiceModel:PRACTICE[primary]?{sessionId:primary,index:-1,
      type:PRACTICE[primary].type,classification:'historical_ungraded_play_model',
      evidence:['dist/learning/bridges.js#sessionTaskFor','dist/learning/state.js#enterUnifiedTask']}:null,
    reflection:{optional:true,configured:!!REFLECTIONS[primary],
      notGraded:true,gate:'not_in_lessonSummary_or_next',
      evidence:['dist/learning/learn.js#save-note','dist/learning/workspace-flow.js#learningActionPlan']},
    earlyActivities:early,relatedBridgeSessions:bridges,
    continueRule:'each_session_task_needs_accepted_submission_and_current_task_must_be_correct_to_advance',
    completionRule:'lessonSummary: every configured session task complete; free text excluded',
    sources:nativeGate,classification:'native_core_boundary_proven',
    browserStatus:'not_inferred_from_static_audit',
    fourLevel:{
      unopened:'supported_by_absence_of_saved_attempts',
      learning:'supported_by_one_or_more_persisted_valid_attempts_even_if_wrong',
      coreCompleted:'supported_for_native_tasks_by_lessonSummary_with_currentSubmission_separate',
      allCompleted:'not_distinguishable_from_core_completed_without_optional_scored_tasks',
      displayedCurrentProduct:'completed_or_incomplete_only',
      legacyConflict:early.length?'legacy_may_show_completed_after_incorrect_attempts':'none',
      currentModelNote:'historical completion and the currently edited workpiece are different facts'
    }
  });
}
invariant(rows.length===587&&seen.size===587,'Classification node coverage differs from source');
const totalCore=rows.reduce((n,r)=>n+r.coreTasks.length,0);
const bridgeSessions=Object.values(BRIDGES).map(b=>{
  const tasks=sessionTasks(b.id)||[];
  invariant(tasks.length>0&&!!sourceBridge(b.id,atlas),'Unverified bridge '+b.id);
  return {id:b.id,fromTopicId:b.fromTopicId,toTopicId:b.topicId,sourceEdgeVerified:true,
    taskCount:tasks.length,coreTaskIds:tasks.map((t,i)=>b.id+':'+i),
    coreTaskTypes:tasks.map(t=>t.type),
    relationToNodeCore:'optional_separate_session; completion tracked in daily.bridges',
    evidence:['dist/learning/bridges.js#sourceBridge','dist/learning/state.js#lessonSummary']};
});
const bridgeCore=bridgeSessions.reduce((n,s)=>n+s.taskCount,0);
const legacyUnique=[...new Set(rows.flatMap(r=>r.earlyActivities.map(e=>e.id)))];
const hasLegacy=rows.filter(r=>r.earlyActivities.length>0);
const issues=hasLegacy.map(row=>({
  nodeId:row.nodeId,nodeName:row.nodeName,sessionId:row.primarySessionId,
  legacyIds:row.earlyActivities.map(e=>e.id),
  priority:'待核查',code:'legacy_attempt_completion_not_core_pass',
  actual:'Old activity completion requires an attempt in each kind, not a passing score. Current nodeState can display completed when the native lesson is not complete.',
  scope:'confirmed historical rule difference; present-day user-path severity and actual native core blocking remain unverified',
  evidence:['dist/exploration-core.js#evidenceSummary','dist/exploration-core.js#nodeState'],
  reproduction:'node --test tests/learning-task-rules.test.mjs',
  minimumFix:'In a separately authorized product task, specify how legacy evidence maps to four levels; preserve existing records and graders.'
}));
const summary={
  sourceNodes:source.nodes.length,classifiedNodes:rows.length,
  nativeSessions:new Set(rows.map(r=>r.primarySessionId)).size,
  nativeCoreTasks:totalCore,nativeOptionalScoredTasks:0,
  nativeCoreAndOptionalBoundaryProven:rows.length,
  legacyActivities:legacyUnique.length,legacyOverlapNodes:hasLegacy.length,
  bridgeSessions:bridgeSessions.length,bridgeTasks:bridgeCore,
  possibleUnlearnedByAttemptData:rows.length,possibleLearningByAttemptData:rows.length,
  possibleNativeCoreCompleted:rows.length,
  fullyDistinguishableThirdAndFourthLevels:0,
  fourLevelUnresolvedThirdFourth:rows.length,
  realClickConfirmedByThisScript:0,
  knownLegacyFourLevelConflicts:issues.length,
  confirmedLegacyCoreBlockingFailures:0,
  caveat:'All listed native tasks gate next; PRACTICE is historical ungraded play. Bridge tasks use their own completion record. Static classification is not Chromium click evidence.'
};
invariant(summary.nativeSessions===587,'Native session count changed: '+summary.nativeSessions);
invariant(summary.nativeCoreTasks===1996,'Native task count changed: '+summary.nativeCoreTasks);
invariant(summary.bridgeSessions===776&&summary.bridgeTasks===1552,'Bridge inventory changed');
invariant(summary.legacyActivities===3,'Unexpected legacy catalog');
mkdirSync(folder,{recursive:true});
write('task-classification.json',{schema:'math-learning-task-gates/1',sourceMain:'dist/data/math.json',rows});
write('bridge-task-classification.json',{schema:'math-learning-bridge-gates/1',rows:bridgeSessions});
write('four-level-feasibility.json',{
  schema:'math-learning-progress-feasibility/1',
  definitions:{
    unlearned:'No valid stored answer attempts; opening, visiting or drafting does not start learning.',
    learning:'At least one persisted, valid answer attempt, including an incorrect one.',
    coreCompleted:'All mandatory native TASKS passed the existing gate, checking currentSubmission separately for edited current workpieces.',
    allCompleted:'All core plus separately configured scored optional tasks passed; not a distinct tier when optional scored tasks do not exist.'
  },
  currentData:['lessons[sessionId].cases[index].attempts','lessons[sessionId].models',
    'activities[activityId].evidence[kind:variant].attempts','daily.bridges[bridgeId].cases'],
  guardrails:['Do not infer learning from visits/opening/unsaved draft.',
    'Do not infer a current pass from a previous pass after edits.',
    'Do not promote legacy attempt-only completion to a passed native core score.',
    'Do not infer node core completion from optional bridge sessions.',
    'Do not use optional reflections as a gate.'],
  rows:rows.map(r=>({nodeId:r.nodeId,primarySessionId:r.primarySessionId,
    nativeTaskCount:r.taskCount,optionalScoredTaskCount:0,
    level1:'derivable',level2:'derivable_from_attempts',
    level3:'derivable_with_current_submission_caveat',
    level4:'indistinguishable_from_level3',
    legacyCompatibility:r.fourLevel.legacyConflict}))
});
write('task-rules-summary.json',summary);
write('task-rules-issues.json',issues);
const report=[
  '# 587 节点：核心与可选题、四级进度规则审计','',
  '复现：node scripts/audit-learning-task-rules.mjs；node --test tests/learning-task-rules.test.mjs。运行时会重新执行基础 587 节点静态审计。','',
  '| 项目 | 数量 |','| --- | ---: |',
  ...Object.entries(summary).filter(([,value])=>typeof value==='number').map(([name,value])=>'| '+name+' | '+value+' |'),
  '',
  '## 依据与独立计数',
  '- 原生课程：每个 sessionTasks(index) 都进入 lessonSummary 完成判定，只有当前已通过的题才能点“下一题”；因此全部 1,996 个现行任务是顺序核心题，独立评分可选题为 0。',
  '- PRACTICE 的 -1 索引是旧自由试玩记录，现行统一学习工作区不会把它作为一个新的独立评分可选题。',
  '- 776 个 BRIDGES 各有独立课程记录，合计 1,552 个桥接任务；它们是来源关系上的后续探索，不混入任何节点的原生核心题或重复累计。',
  '- 3 个早期活动各有 construct/transfer 两种任务类型、每类两种可选案例，历史完成条件是两类均有提交，不要求正确。它们和现代课程在三个来源节点重叠。',
  '- 发现、反思、总结文字是可选记录；不参与 lessonSummary 的已完成检查。',
  '',
  '## 四级进度：现状不是四种可展示状态',
  '- 第一层和第二层可通过保存的有效作答尝试区别；打开、浏览、未提交草稿不算学习。',
  '- 第三层可基于原生核心判题计算，但历史通过与当前作品的修改要分开，不能把旧通过冒充“当前作品已通过”。',
  '- 所有原生课程目前没有独立评分可选题，第三层和第四层无法得出有意义的区别；不得伪造第四层。',
  '- 旧活动有自己的提交即完成模型。当前 nodeState 可由旧活动的错误提交得到已完成标记；3 个节点的历史兼容差异已确认，但现行真实用户路径是否发生核心学习阻塞未验证，暂列待核查而非已实测 P1。本审计不修改旧数据和通关规则。',
  '',
  '## 浏览器证据不能混为一谈',
  '此脚本只读源码，不运行浏览器。动态运行映射、真实 UI 点击、答题与刷新证据由 tests/learning-node-runtime-browser.cjs 单独产生 browser-results.json。该文件未由此脚本生成，不能据静态报告填入点击成功数。',
  '',
  '逐节点详表：task-classification.json；独立联合任务：bridge-task-classification.json；进度能力：four-level-feasibility.json；规则问题：task-rules-issues.json。',
  ''
];
writeFileSync(resolve(folder,'TASK-RULES.md'),report.join('\n'));
console.log('LEARNING_TASK_RULES '+JSON.stringify(summary));
