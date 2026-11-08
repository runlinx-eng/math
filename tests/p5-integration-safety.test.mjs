import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fresh,backup,parseBackup,merge,validate} from '../dist/exploration-core.js';
import {freshLesson,submitLesson} from '../dist/learning/state.js';
import {TASKS,exampleModel} from '../dist/learning/tasks.js';
import {addQuestion,captureSession} from '../dist/learning/daily.js';
import {findImportConflicts,assertNoImportConflicts,ImportConflictError} from '../dist/import-conflicts.js';
import {freshState} from '../dist/core.js';

const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const lesson=()=>{const s=freshLesson('share');s.view='task';s.index=0;return s;};
const pair=()=>[fresh(),fresh()];
const conflicts=(a,b)=>findImportConflicts(validate(a,atlas),validate(b,atlas));

test('P5: two different nonempty lesson drafts block import before any write',()=>{
 const [a,b]=pair();a.lessons.share=lesson();b.lessons.share=lesson();
 a.lessons.share.draft='本地未提交的想法';
 b.lessons.share.draft='外部不同的想法';
 const before=JSON.stringify(a),issues=conflicts(a,b);
 assert.ok(issues.some(i=>i.kind==='草稿'));
 assert.throws(()=>assertNoImportConflicts(a,b),ImportConflictError);
 assert.equal(JSON.stringify(a),before);
});

test('P5: empty draft accepts imported draft and repeated import is idempotent',()=>{
 const [a,b]=pair();a.lessons.share=lesson();b.lessons.share=lesson();
 b.lessons.share.draft='尚未写完的数学想法';
 assert.deepEqual(conflicts(a,b),[]);
 const joined=validate(merge(a,b),atlas);
 assert.equal(joined.lessons.share.draft,b.lessons.share.draft);
 assert.deepEqual(conflicts(joined,b),[]);
 assert.deepEqual(validate(merge(joined,b),atlas),joined);
});

test('P5: same event ID and different math attempt blocks import',()=>{
 const [a,b]=pair(),session=lesson();
 session.models[0]=exampleModel(TASKS.share[0]);submitLesson(session);
 a.lessons.share=structuredClone(session);b.lessons.share=structuredClone(session);
 b.lessons.share.cases[0].attempts[0].supported=true;
 assert.ok(conflicts(a,b).some(i=>i.kind==='同 ID 证据'));
});

test('P5: same question ID with different text or scene blocks import',()=>{
 const [a,b]=pair(),session=lesson(),q=addQuestion(a,'第一个问题',{nodeId:'mt_ndGqFPWyen'});
 b.daily.questions=[structuredClone(q)];
 b.daily.questions[0].text='另一个问题';
 assert.ok(conflicts(a,b).some(i=>i.kind==='同 ID 问题内容'));
 b.daily.questions[0].text=q.text;
 a.daily.questions[0].scene=captureSession(session);
 b.daily.questions[0].scene=captureSession(session);
 b.daily.questions[0].scene.record.draft='来自另一份备份的现场';
 assert.ok(conflicts(a,b).some(i=>i.kind==='同 ID 问题现场'));
});

test('P5: disjoint questions and independent events are allowed',()=>{
 const [a,b]=pair();addQuestion(a,'第一个问题',{nodeId:'mt_ndGqFPWyen'});
 addQuestion(b,'第二个问题',{nodeId:'mt_ndGqFPWyen'});
 assert.deepEqual(conflicts(a,b),[]);
 assert.equal(validate(merge(a,b),atlas).daily.questions.length,2);
});

test('P5: V1 legacy records do not manufacture independent learning mastery',()=>{
 const v1={app:'math-explorer',version:1,state:freshState()};
 const old=parseBackup(JSON.stringify(v1),atlas);
 assert.equal(old.schema,2);assert.deepEqual(old.lessons,{});
 const imported=parseBackup(JSON.stringify(backup(old)),atlas);
 assert.deepEqual(imported.legacy,old.legacy);
});

test('P5: 50 MB is a byte limit even when JSON contains multibyte Chinese',()=>{
 const payload=JSON.stringify({app:'math-explorer',version:2,state:{text:'中'.repeat(17_000_000)}});
 assert.ok(payload.length<50_000_000);
 assert.ok(new TextEncoder().encode(payload).length>50_000_000);
 assert.throws(()=>parseBackup(payload,atlas),/50 MB/);
});

test('P5: duplicate ID conflicts are distinct from ordinary non-overlapping attempt unions',()=>{
 const [a,b]=pair(),s=lesson();s.models[0]=exampleModel(TASKS.share[0]);submitLesson(s);
 a.lessons.share=structuredClone(s);b.lessons.share=structuredClone(s);
 const remote=b.lessons.share.cases[0].attempts[0];
 remote.id='different-immutable-event';remote.exposed=true;
 assert.deepEqual(conflicts(a,b),[]);
 assert.equal(validate(merge(a,b),atlas).lessons.share.cases[0].attempts.length,2);
});
