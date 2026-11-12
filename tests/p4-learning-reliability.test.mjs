// P4 focused reliability tests. Each assertion exercises the actual P3 runtime modules.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fresh,backup,parseBackup,merge,validate,KEY,OLD_KEY} from '../dist/exploration-core.js';
import {freshState} from '../dist/core.js';
import {freshLesson,mergeLesson,submitLesson,lessonSummary} from '../dist/learning/state.js';
import {TASKS,exampleModel} from '../dist/learning/tasks.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {addQuestion,captureSession,freshDaily,mergeDaily,continuation} from '../dist/learning/daily.js';
import {readStored,writeStored,packText,unpackText} from '../dist/storage.js';

const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const at1='2025-10-01T10:00:00.000Z',at2='2026-11-01T10:00:00.000Z';
const lesson=()=>{const r=freshLesson('share');r.view='task';r.index=0;return r;};
const matching=()=>LESSONS.share.topicId;
const json=x=>JSON.stringify(x);

test('P4: imported unfinished draft survives when the local lesson has no draft',()=>{
  const local=lesson(),remote=lesson();
  local.updatedAt=at1;remote.updatedAt=at2;
  remote.draft='两份一样大，为什么能换写法？';
  const merged=mergeLesson(local,remote);
  assert.equal(merged.draft,remote.draft);
  assert.equal(merged.updatedAt,at2);
  assert.equal(local.draft,'');
});

test('P4: question merge retains an imported original scene when local duplicate has no scene',()=>{
  const local=freshDaily(),incoming=freshDaily(),record=lesson();
  const q=addQuestion({daily:local},'当时怎么解释？',{nodeId:matching()},at1);
  incoming.questions.push({...structuredClone(q),scene:captureSession(record),world:{
    position:[40,60,80],target:[0,0,0],selected:'node:'+matching(),layout:'network',networkVersion:49
  }});
  const result=mergeDaily(local,incoming);
  assert.equal(result.questions.length,1);
  assert.equal(result.questions[0].scene?.record.id,'share');
  assert.equal(result.questions[0].world?.networkVersion,49);
  assert.equal(validate({...fresh(),daily:result},atlas).daily.questions[0].scene.record.id,'share');
});

test('P4: earliest visit and opened-pack evidence survive merging newer snapshots',()=>{
  const id=matching(),pack=atlas.packs[0].id;
  const local=fresh(),incoming=fresh();
  local.visited[id]=at1;incoming.visited[id]=at2;
  local.openedPacks[pack]=at1;incoming.openedPacks[pack]=at2;
  const result=merge(local,incoming);
  assert.equal(result.visited[id],at1);
  assert.equal(result.openedPacks[pack],at1);
});

test('P4: two partially overlapping lesson backups merge attempts by immutable IDs',()=>{
  const a=lesson();
  a.models[0]=exampleModel(TASKS.share[0]);
  submitLesson(a);
  const b=structuredClone(a);
  b.models[0]={...b.models[0]};
  b.cases[0].attempts[0].exposed=false;
  submitLesson(b);
  b.cases[0].support=true;
  const x=fresh(),y=fresh();x.lessons.share=a;y.lessons.share=b;
  const joined=validate(merge(x,y),atlas);
  assert.equal(joined.lessons.share.cases[0].attempts.length,2);
  assert.equal(new Set(joined.lessons.share.cases[0].attempts.map(e=>e.id)).size,2);
  assert.equal(joined.lessons.share.cases[0].support,true);
  assert.equal(lessonSummary(joined.lessons.share).independent,false);
  const again=validate(merge(joined,y),atlas);
  assert.deepEqual(again.lessons.share.cases[0].attempts,joined.lessons.share.cases[0].attempts);
});

test('P4: full V1 backup import retains original legacy object without manufacturing mastery',()=>{
  const old=freshState();
  const imported=parseBackup(json({app:'math-explorer',version:1,state:old}),atlas);
  assert.equal(imported.schema,2);
  assert.deepEqual(imported.legacy,old);
  assert.deepEqual(imported.lessons,{});
  const reloaded=parseBackup(json(backup(imported)),atlas);
  assert.deepEqual(reloaded.legacy,old);
  assert.deepEqual(reloaded.lessons,{});
});

test('P4: V2 backup idempotency and independence of view storage',()=>{
  const s=fresh();s.bookmarks.push(matching());s.lessons.share=lesson();s.lessons.share.draft='未完成';
  const one=parseBackup(json(backup(s)),atlas),twice=validate(merge(one,one),atlas);
  assert.deepEqual(twice,one);
  assert.equal(KEY,'math-explorer-v2');
  assert.equal(OLD_KEY!==KEY,true);
  assert.ok(!json(backup(s)).includes('math-explorer-network-relationship-view-v1'));
});

test('P4: invalid and unsupported imports do not mutate the current object',()=>{
  const saved=fresh(),before=json(saved);
  for(const bad of ['{',json({app:'another-app',version:2,state:saved}),json({app:'math-explorer',version:3,state:saved}),json({app:'math-explorer',version:2,state:{schema:2}})]){
    assert.throws(()=>parseBackup(bad,atlas));
    assert.equal(json(saved),before);
  }
});

test('P4: corrupt local storage, compression and quota failure do not delete prior bytes',()=>{
  const store=new Map(),io={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  const original=json({draft:'原稿',history:Array(3000).fill({hint:true,answer:'再试'})});
  writeStored(KEY,original,io);
  const bytes=store.get(KEY);
  assert.equal(readStored(KEY,io),original);
  io.setItem=()=>{throw new Error('QuotaExceededError')};
  assert.throws(()=>writeStored(KEY,original+'new',io));
  assert.equal(store.get(KEY),bytes);
  assert.equal(unpackText(packText('同一份作品'.repeat(10000),0)),'同一份作品'.repeat(10000));
});

test('P4: offline readiness checks must reference the current Service Worker cache',()=>{
  const sw=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  const trail=fs.readFileSync(new URL('../dist/exploration.js',import.meta.url),'utf8');
  const space=fs.readFileSync(new URL('../dist/space.js',import.meta.url),'utf8');
  const version=sw.match(/const CACHE\s*=\s*'([^']+)'/)?.[1];
  assert.ok(version);
  // Readiness must query the FULL manifest of the worker controlling this
  // document and bind its reply to the entry module's release. A complete
  // retired cache cannot make a failed new installation appear ready.
  assert.ok(sw.includes("event.data?.type!=='math-explorer:cache-status'"),'worker must answer cache completeness queries');
  assert.ok(sw.includes('result.cached===result.total'),'worker must verify the entire manifest');
  for(const [name,source] of [['trail',trail],['space',space]]){
    assert.ok(source.includes("type:'math-explorer:cache-status'"),name+' does not query the current worker');
    assert.ok(source.includes('isCurrentReleaseReady({release:RELEASE,registration,'),name+' does not bind completeness to the current activated controller');
    assert.equal(source.match(/const RELEASE='([^']+)'/)?.[1],version,name+' entry release differs from its offline package');
    assert.ok(!source.includes("caches.open('math-explorer-"),name+' still checks a hardcoded old cache key');
  }
  const files=sw.match(/const FILES\s*=\s*(\[[\s\S]*?\]);/)?.[1];
  assert.ok(files);
  const paths=JSON.parse(files.replace(/'/g,'"'));
  for(const entry of paths){const relative=entry.replace(/^\.\//,'').split('?')[0];assert.ok(fs.existsSync(new URL('../dist/'+relative,import.meta.url)),entry+' is missing from offline package');}
});
