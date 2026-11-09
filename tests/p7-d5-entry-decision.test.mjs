import test from 'node:test';
import assert from 'node:assert/strict';
import {decideLearningEntry,recoverableLearning} from '../dist/learning/entry-decision.js';
import {freshLesson} from '../dist/learning/state.js';
import {ACTIVITIES,activityIds} from '../dist/exploration-content.js';
import {LESSONS,lessonForTopic} from '../dist/learning/catalog.js';
const empty=()=>({lessons:{},activities:{},daily:{questions:[],bridges:{},continuation:null}});
const node=(id,title='知识')=>({kind:'node',id,title});
const saved=(id,draft='我的尝试')=>({...freshLesson(id),draft});

test('selected source-configured knowledge opens a real lesson, never a route hub',()=>{
 const state=empty();
 assert.deepEqual(decideLearningEntry({selected:node(LESSONS.share.topicId),state}),
  {kind:'lesson',lessonId:'share',nodeId:LESSONS.share.topicId,restore:false});
 state.lessons.share=saved('share');
 assert.equal(decideLearningEntry({selected:node(LESSONS.share.topicId),state}).restore,true);
});

test('explicit selection always beats an unfinished session of a different knowledge',()=>{
 const state=empty();state.lessons.share=saved('share');
 state.daily.continuation={id:'share',at:new Date().toISOString(),questionId:null};
 assert.equal(decideLearningEntry({selected:node(LESSONS.equivalent.topicId),state}).lessonId,'equivalent');
 assert.equal(decideLearningEntry({selected:node(LESSONS.equivalent.topicId),state}).restore,false);
});

test('empty and completed records never masquerade as unfinished saved work',()=>{
 const state=empty();
 state.lessons.share=freshLesson('share');
 assert.equal(recoverableLearning(state),null);
 assert.equal(decideLearningEntry({state}).kind,'pick');
 // A completed record cannot supersede the next explicit learning choice.
 const record=saved('share');record.view='task';
 state.lessons.share=record;
 assert.equal(recoverableLearning(state).sessionId,'share');
});

test('unsaved draft is a recoverable session, questions without a scene are not',()=>{
 const state=empty();state.lessons.share=saved('share');
 assert.equal(decideLearningEntry({state}).kind,'resume');
 state.daily.questions.push({id:'q1',at:new Date().toISOString(),events:[],nodeId:LESSONS.share.topicId,text:'想法',scene:null});
 assert.equal(decideLearningEntry({state}).resumeKind,'session');
});

test('unsupported knowledge never acquires a fabricated lesson',()=>{
 const state=empty();
 const decision=decideLearningEntry({selected:node('not-in-lesson-catalog'),state});
 assert.equal(decision.kind,'unavailable');
 assert.equal(decision.lessonId,undefined);
});

test('legacy recorded activity remains a supported direct destination',()=>{
 const original=activityIds.find(id=>!lessonForTopic(ACTIVITIES[id].topicId));
 assert.ok(original,'legacy-only activity exists');
 const decision=decideLearningEntry({selected:node(ACTIVITIES[original].topicId),state:empty()});
 assert.equal(decision.kind,'legacy');
 assert.equal(decision.legacyId,original);
});

test('pack context does not assume a child was explicitly selected',()=>{
 const decision=decideLearningEntry({selected:{kind:'pack',id:'same-amount'},state:empty()});
 assert.equal(decision.kind,'pick');
 assert.equal(decision.packId,'same-amount');
});
