import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {TASKS,defaultModel,inspect,exampleModel} from '../dist/learning/tasks.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {freshLesson,modelForLesson,submitLesson,lessonSummary,currentSubmission,addLessonNote} from '../dist/learning/state.js';
import {createActivity,evidenceSummary,nodeState} from '../dist/exploration-core.js';
import {ACTIVITIES,KINDS,task as earlyTask,defaultModel as earlyDefault} from '../dist/exploration-content.js';
import {learningActionPlan} from '../dist/learning/workspace-flow.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>JSON.parse(readFileSync(new URL('../verification/learning-node-audit/'+name,import.meta.url),'utf8'));
await ensureB39Ready();

test('all 587 source nodes have traceable core indexes and no invented native optional scored tasks',()=>{
  execFileSync(process.execPath,['scripts/audit-learning-task-rules.mjs'],{cwd:root,timeout:120000,stdio:'pipe'});
  const classified=read('task-classification.json').rows;
  const summary=read('task-rules-summary.json');
  const bridges=read('bridge-task-classification.json').rows;
  const four=read('four-level-feasibility.json').rows;
  assert.equal(classified.length,587);
  assert.equal(new Set(classified.map(r=>r.nodeId)).size,587);
  assert.equal(classified.reduce((n,r)=>n+r.taskCount,0),1996);
  assert.equal(summary.nativeCoreTasks,1996);
  assert.equal(summary.nativeOptionalScoredTasks,0);
  assert.equal(summary.bridgeSessions,776);
  assert.equal(bridges.reduce((n,r)=>n+r.taskCount,0),1552);
  assert.equal(four.length,587);
  assert.equal(summary.fullyDistinguishableThirdAndFourthLevels,0);
  const compatibilityIssues=read('task-rules-issues.json');
  assert.equal(compatibilityIssues.length,3);
  assert.deepEqual(new Set(compatibilityIssues.flatMap(issue=>issue.legacyIds)),
    new Set(['fair','rename','decimal']));
  assert.ok(compatibilityIssues.every(issue=>issue.priority==='待核查'),
    'a confirmed legacy rule difference is not proof of a current P1 user-path blocker');
  assert.equal(summary.confirmedLegacyCoreBlockingFailures,0);
  for(const r of classified){
    assert.equal(LESSONS[r.primarySessionId].topicId,r.nodeId);
    assert.deepEqual(r.coreTaskIndexes,Array.from({length:sessionTasks(r.primarySessionId).length},(_,i)=>i));
    assert.deepEqual(r.coreTaskIds,r.coreTaskIndexes.map(index=>r.primarySessionId+':'+index));
    assert.deepEqual(r.optionalScoredTaskIds,[]);
    assert.equal(r.reflection.notGraded,true);
    assert.equal(r.fourLevel.allCompleted,'not_distinguishable_from_core_completed_without_optional_scored_tasks');
    assert.ok(r.coreTasks.every(t=>t.gateEvidence.includes('dist/learning/state.js#lessonSummary')));
  }
  for(const b of bridges)assert.ok(BRIDGES[b.id]&&b.sourceEdgeVerified&&b.taskCount===sessionTasks(b.id).length);
});

test('unopened, draft, incorrect and correct submissions retain different evidence',()=>{
  const a=freshLesson('share');
  assert.equal(lessonSummary(a).completed,false);
  assert.equal(lessonSummary(a).done,0);
  assert.equal(currentSubmission(a).status,'unsubmitted');
  a.draft='尚未提交的想法';
  modelForLesson(a);
  assert.equal(lessonSummary(a).done,0);
  const failed=submitLesson(a);
  assert.equal(failed.correct,false,'default share work should initially fail');
  assert.equal(a.cases[0].attempts.length,1);
  assert.equal(lessonSummary(a).completed,false);
  assert.equal(currentSubmission(a).status,'revise');
  const passed=exampleModel(TASKS.share[0]);
  assert.equal(inspect(TASKS.share[0],passed).correct,true);
  a.models[0]=passed;
  assert.equal(currentSubmission(a).status,'modified');
  assert.equal(lessonSummary(a).cases[0].complete,false);
  const result=submitLesson(a);
  assert.equal(result.correct,true);
  assert.equal(currentSubmission(a).status,'correct');
  assert.equal(lessonSummary(a).done,1);
  assert.equal(lessonSummary(a).completed,false);
  a.models[0]=defaultModel(TASKS.share[0]);
  assert.equal(currentSubmission(a).status,'modified',
    'historical success cannot be described as a passing current workpiece');
  assert.equal(lessonSummary(a).cases[0].complete,true,
    'historical summary may remain complete; audit must distinguish this from currentSubmission');
});

test('all native required checks pass with current workpieces; optional reflection does not gate',()=>{
  const a=freshLesson('share');
  TASKS.share.forEach((t,i)=>{
    a.index=i;
    a.models[i]=exampleModel(t);
    assert.equal(inspect(t,a.models[i]).correct,true);
    assert.equal(submitLesson(a).correct,true);
  });
  assert.equal(lessonSummary(a).completed,true);
  assert.equal(a.notes.length,0);
  assert.equal(lessonSummary(a).explanation,'missing');
  const noDraft=learningActionPlan({stage:'reflect',hasDraft:false,destination:{action:'back',label:'返回'}});
  assert.equal(noDraft.primary.action,'back');
  addLessonNote(a,'可选的个人发现');
  assert.equal(lessonSummary(a).completed,true);
  assert.equal(lessonSummary(a).explanation,'pending');
  const withDraft=learningActionPlan({stage:'reflect',hasDraft:true,destination:{action:'back',label:'返回'}});
  assert.equal(withDraft.primary.action,'save-note');
  assert.equal(withDraft.destination.action,'back');
});

test('legacy activity completion means both kinds attempted, not core correctness',()=>{
  const a=createActivity('fair');
  assert.equal(evidenceSummary(a).completed,false);
  for(const kind of KINDS){
    const model=earlyDefault(earlyTask('fair',kind,0));
    a.evidence[kind+':0']={support:false,attempts:[{
      id:kind+'-incorrect',at:'2026-11-13T00:00:00.000Z',supported:false,exposed:false,value:model
    }]};
  }
  assert.equal(evidenceSummary(a).completed,true);
  assert.equal(evidenceSummary(a).demonstrated,false);
  const state={activities:{fair:a},lessons:{},visited:{},journeys:{}};
  assert.equal(nodeState(state,ACTIVITIES.fair.topicId).progress,'completed');
  const native=freshLesson('share');
  state.lessons.share=native;
  assert.equal(lessonSummary(native).completed,false);
  assert.equal(nodeState(state,ACTIVITIES.fair.topicId).progress,'completed',
    'the historical fallback is not a proven native-core pass; keep this incompatibility visible');
});

test('bridge completion is separately recorded, not a prerequisite of native node completion',()=>{
  const bridge=BRIDGES['link-equivalent-quarters'];
  assert.ok(bridge);
  const a=freshLesson(bridge.id);
  assert.equal(lessonSummary(a).completed,false);
  assert.equal(sessionTasks(bridge.id).length,2);
  assert.equal(LESSONS[bridge.to].topicId,bridge.topicId);
  const native=freshLesson(bridge.to);
  assert.equal(lessonSummary(native).completed,false);
});
