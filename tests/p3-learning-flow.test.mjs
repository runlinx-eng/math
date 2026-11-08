import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {TASKS,exampleModel} from '../dist/learning/tasks.js';
import {freshLesson,supportLesson,submitLesson,addLessonNote,lessonSummary} from '../dist/learning/state.js';
import {BRIDGES} from '../dist/learning/bridges.js';
import {workflowFor,configuredApplications} from '../dist/learning/p3-workflow.js';

const atlas={nodes:Object.values(LESSONS).map(l=>({id:l.topicId,title:l.title})),edges:[]};
const node=id=>LESSONS[id].topicId;
const practice=(id='share')=>{const record=freshLesson(id);record.view='task';record.index=0;return record;};
test('initial task never implies completion or mastery',()=>{
 const a=practice(),w=workflowFor(atlas,'share',a);
 assert.equal(w.latestCheck,'none');assert.equal(w.attempts,0);assert.equal(w.completed,false);
 assert.equal(w.realPracticeVerified,false);assert.ok(w.next);
});
test('first independent correct is separate from progress and explanation',()=>{
 const a=practice();a.models[0]=exampleModel(TASKS.share[0]);
 assert.equal(submitLesson(a).correct,true);
 const w=workflowFor(atlas,'share',a);
 assert.equal(w.latestCheck,'correct');assert.equal(w.independent,true);
 assert.equal(w.done,1);assert.equal(w.completed,false);assert.equal(w.explanation,'missing');
});
test('incorrect then corrected preserves retry and blocks first independent',()=>{
 const a=practice();
 assert.equal(submitLesson(a).correct,false);
 a.models[0]=exampleModel(TASKS.share[0]);
 assert.equal(submitLesson(a).correct,true);
 const w=workflowFor(atlas,'share',a);
 assert.equal(w.retried,true);assert.equal(w.independent,false);assert.equal(w.attempts,2);
 assert.equal(w.latestCheck,'correct');
});
test('hint before first correction is not first independent',()=>{
 const a=practice();supportLesson(a);
 a.models[0]=exampleModel(TASKS.share[0]);submitLesson(a);
 const w=workflowFor(atlas,'share',a);
 assert.equal(w.usedSupport,true);assert.equal(w.independent,false);assert.equal(w.done,1);
});
test('draft explanation remains draft and text note remains pending',()=>{
 const a=practice();a.draft='我的解释，尚未提交';
 assert.equal(workflowFor(atlas,'share',a).hasDraft,true);
 addLessonNote(a,'我看见了相等的份');
 const w=workflowFor(atlas,'share',a);
 assert.equal(w.hasDraft,false);assert.equal(w.noteCount,1);
 assert.equal(w.explanation,'pending');assert.equal(w.realPracticeVerified,false);
});
test('variants are only real configured tasks and no invented next lesson',()=>{
 const a=practice();a.models[0]=exampleModel(TASKS.share[0]);submitLesson(a);
 const w=workflowFor(atlas,'share',a);
 assert.ok(w.alternateIndex!==null);assert.ok(TASKS.share[w.alternateIndex]);
 assert.ok(w.next&&LESSONS[w.next.id]);
 const end=workflowFor(atlas,'quarters',practice('quarters'));
 assert.equal(end.next,null);
});
test('only source-backed bridges and relations are offered',()=>{
 const a=practice();
 const b=Object.values(BRIDGES).find(x=>x.from==='share'||x.to==='share');
 assert.ok(b);
 let w=workflowFor(atlas,'share',a);
 assert.equal(w.bridges.length,0);
 atlas.edges.push({prerequisiteId:b.fromTopicId,topicId:b.topicId});
 w=workflowFor(atlas,'share',a);
 assert.ok(w.bridges.some(x=>x.id===b.id));
 assert.ok(w.related.some(x=>x.nodeId===b.topicId||x.nodeId===b.fromTopicId));
});
test('applications reference configured sessions and never verify reality',()=>{
 const apps=configuredApplications();
 assert.ok(apps.length>=4);
 for(const app of apps){assert.ok(LESSONS[app.sessionId]);assert.ok(TASKS[app.sessionId]?.length);assert.ok(app.real);}
 const w=workflowFor(atlas,'survey',practice('survey'));
 assert.ok(w.currentApplication?.key==='data');
 assert.equal(w.realPracticeVerified,false);
});
test('all completed cases remain distinct from mastery; reuse preserves evidence',()=>{
 const a=practice();
 for(let i=0;i<TASKS.share.length;i++){
   a.index=i;a.models[i]=exampleModel(TASKS.share[i]);assert.equal(submitLesson(a).correct,true);
 }
 assert.equal(lessonSummary(a).completed,true);
 assert.equal(workflowFor(atlas,'share',a).completed,true);
 a.index=0;a.models[0]=exampleModel(TASKS.share[0]);submitLesson(a);
 assert.equal(workflowFor(atlas,'share',a).attempts,2);
 assert.equal(lessonSummary(a).cases[0].attempts,2);
});
