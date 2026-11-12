// P10: preserve the real v2 learning record when two browser surfaces edit it.
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshLesson,modelForLesson,submitLesson,assertNoConcurrentLessonOverwrite} from '../dist/learning/state.js';

test('P10: unchanged stored record is safe to continue editing',()=>{
 const local=freshLesson('equivalent');
 modelForLesson(local);
 assert.doesNotThrow(()=>assertNoConcurrentLessonOverwrite(local,structuredClone(local)));
});

test('P10: a different model from another tab blocks a silent overwrite',()=>{
 const local=freshLesson('equivalent');modelForLesson(local);
 const stored=structuredClone(local);
 stored.models[0].rows[0].n=stored.models[0].rows[0].n===1?2:1;
 const saved=JSON.stringify(stored);
 assert.throws(()=>assertNoConcurrentLessonOverwrite(local,stored),/已停止保存/);
 assert.equal(JSON.stringify(stored),saved,'checking never changes the saved record');
});

test('P10: another tab advancing the same session cannot be moved backwards',()=>{
 const local=freshLesson('equivalent'),stored=structuredClone(local);
 stored.index=1;
 assert.throws(()=>assertNoConcurrentLessonOverwrite(local,stored),/当前任务位置/);
 stored.index=0;stored.view='summary';
 assert.throws(()=>assertNoConcurrentLessonOverwrite(local,stored),/当前任务位置/);
});

test('P10: different authored drafts cannot silently replace each other',()=>{
 const local=freshLesson('share'),stored=structuredClone(local);
 local.draft='我的第一种解释';stored.draft='另一页面刚写的解释';
 assert.throws(()=>assertNoConcurrentLessonOverwrite(local,stored),/自由解释草稿/);
});

test('P10: a newly submitted active task requires reloading the stale tab',()=>{
 const local=freshLesson('equivalent');modelForLesson(local);
 submitLesson(local);
 const stored=structuredClone(local);
 submitLesson(stored);
 assert.throws(()=>assertNoConcurrentLessonOverwrite(local,stored),/新的提交/);
 assert.equal(stored.cases[0].attempts.length,2);
});

test('P10: same-ID submission mutation cannot overwrite historical evidence',()=>{
 const local=freshLesson('equivalent');modelForLesson(local);submitLesson(local);
 const stored=structuredClone(local);
 stored.cases[0].attempts[0].supported=true;
 assert.throws(()=>assertNoConcurrentLessonOverwrite(local,stored),/历史提交/);
});

test('P10: independent extra notes do not invalidate the existing workpiece',()=>{
 const local=freshLesson('share'),stored=structuredClone(local);
 stored.notes.push({id:'independent',at:'2026-11-11T00:00:00.000Z',text:'新的发现'});
 assert.doesNotThrow(()=>assertNoConcurrentLessonOverwrite(local,stored));
});

test('P10: a removed session with unsaved work is not recreated without warning',()=>{
 const local=freshLesson('equivalent');modelForLesson(local);
 assert.throws(()=>assertNoConcurrentLessonOverwrite(local,null),/已停止保存/);
 assert.doesNotThrow(()=>assertNoConcurrentLessonOverwrite(freshLesson('share'),null));
});
