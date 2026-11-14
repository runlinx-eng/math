// P10: execute the actual exploration import and startup persistence blocks.
// A competing tab writes while runtime preparation is suspended. These are
// deterministic in-memory scheduling tests, not a claim to patch running old JS.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {KEY,OLD_KEY,fresh,validate,backup,parseBackup,merge,migrateLegacy} from '../dist/exploration-core.js';
import {freshState} from '../dist/core.js';
import {freshLesson,modelForLesson,numericCompatibility,assertNoConcurrentLessonOverwrite} from '../dist/learning/state.js';
import {sessionRecord} from '../dist/learning/daily.js';
import {sessionTasks} from '../dist/learning/bridges.js';
import {assertNoImportConflicts} from '../dist/import-conflicts.js';
import {MAX_BACKUP_BYTES,packText,unpackText,readStored,writeStored} from '../dist/storage.js';
import numericFixture from './fixtures/p9-numeric-legacy.cjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../dist/exploration.js',import.meta.url),'utf8');
const historicalCommit='a7f1860c035c73da0ce9698b2a9f1cb103a2787e';
const historicalSource=execFileSync('git',['show',historicalCommit+':dist/exploration.js'],{cwd:root,encoding:'utf8'});
assert.equal(createHash('sha256').update(historicalSource).digest('hex'),
 '634bc063312f226c68c7cb2d1d7090e2a195d4456f035a9b8c969652cf6097b0',
 'the negative control must execute the reviewed, unchanged historical source');

function importProgram(code){
 const match=code.match(/\$\('#import-file'\)\.addEventListener\('change',async event=>\{[\s\S]*?\n\}\);/);
 assert.ok(match,'extract the actual import listener, without recreating its implementation');
 return match[0];
}
function startupProgram(code){
 const boot=code.indexOf('async function boot(){');
 const start=code.indexOf('state=fresh();',boot);
 const end=code.indexOf('render();',start);
 assert.ok(boot>=0&&start>boot&&end>start,'extract the actual startup storage block');
 const program=code.slice(start,end);
 assert.ok(program.includes('writeStored(KEY,')&&program.includes('readBlocked=true;'),
  'include migration, writing and its existing read-only failure boundary');
 return '(async()=>{'+program+'\nreturn {state,readBlocked};})()';
}
const importPrograms={current:importProgram(source),historical:importProgram(historicalSource)};
const startupPrograms={current:startupProgram(source),historical:startupProgram(historicalSource)};
const learnSource=fs.readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8');
const exportProgram=learnSource.match(/function exportNumericBackup\(\)\{\n[\s\S]*?\n\}/)?.[0];
const matchProgram=learnSource.match(/function numericBackupMatches\(\)\{[^\n]+\}/)?.[0];
assert.ok(exportProgram&&matchProgram,'execute the actual numeric export and permission functions');

function record(draft){
 const value=fresh(),lesson=freshLesson('share');
 lesson.updatedAt='2026-11-14T00:00:00.000Z';
 lesson.draft=draft;
 // Repeated, valid historical notes make the real lossless codec choose its
 // envelope, without changing the production compression threshold.
 lesson.notes=Array.from({length:12},(_,i)=>({id:'prior-note-'+i,at:'2026-11-14T00:00:00.000Z',
  text:'我先把每份排齐，再逐份比较，最后检查整体有没有改变。'.repeat(20)}));
 modelForLesson(lesson);
 value.lessons.share=lesson;
 return validate(value,atlas);
}
const oldRecord=record('先把每份排齐，再比较。'.repeat(25));
const newerRecord=record('另一页刚保存：相等的份数要对应相同的整体。'.repeat(25));
const legacy=freshState();
legacy.visited[atlas.nodes[0].id]='2026-11-13T00:00:00.000Z';
const newerLegacy=structuredClone(legacy);
newerLegacy.bookmarks.push(atlas.nodes[1].id);
const incoming=fresh();
incoming.visited[atlas.nodes[2].id]='2026-11-14T00:01:00.000Z';
const incomingText=JSON.stringify(backup(incoming));
const beforeImportKey=KEY+'-before-import';

function setup({compressed=false,changeAt=0,changedKey=KEY,withLegacy=false}={}){
 const encode=value=>{
  const text=JSON.stringify(value),encoded=compressed?packText(text,0):text;
  if(compressed)assert.notEqual(encoded,text,'the race also exercises the actual compressed storage envelope');
  assert.equal(unpackText(encoded),text);
  return encoded;
 };
 const originalBytes=encode(oldRecord),newBytes=encode(newerRecord);
 // V1 can be small plain JSON even when the main v2 record is compressed.
 const oldBytes=JSON.stringify(legacy),newOldBytes=JSON.stringify(newerLegacy);
 const previousBackup=JSON.stringify(backup(oldRecord));
 const values=new Map([[KEY,originalBytes],[beforeImportKey,previousBackup]]);
 if(withLegacy)values.set(OLD_KEY,oldBytes);
 const writes=[],messages=[],warnings=[];
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value);writes.push(key);}};
 let preparations=0,competingWrites=0;
 const context={
  KEY,OLD_KEY,MAX_BACKUP_BYTES,atlas,fresh,validate,backup,parseBackup,merge,migrateLegacy,
  assertNoImportConflicts,unpackText,
  localStorage:storage,readStored:key=>readStored(key,storage),
  writeStored:(key,text)=>writeStored(key,text,storage),
  state:structuredClone(oldRecord),readBlocked:false,
  render:()=>{},toast:message=>messages.push(message),warn:message=>warnings.push(message),
  prepareStateForValidation:async()=>{
   preparations++;
   if(preparations!==changeAt)return;
   // The storage change occurs after the application has entered preparation
   // and before that promise resolves; it is not an injected application edit.
   await new Promise(resolve=>queueMicrotask(()=>{
    values.set(changedKey,changedKey===KEY?newBytes:newOldBytes);
    competingWrites++;resolve();
   }));
  }
 };
 return {context,values,writes,messages,warnings,originalBytes,newBytes,oldBytes,newOldBytes,previousBackup,
  counts:()=>({preparations,competingWrites}),saved:()=>JSON.parse(readStored(KEY,storage))};
}
async function runImport(version,options){
 const result=setup(options);let listener;
 result.context.$=selector=>{
  assert.equal(selector,'#import-file');
  return {addEventListener:(type,callback)=>{assert.equal(type,'change');listener=callback;}};
 };
 vm.runInNewContext(importPrograms[version],result.context,{filename:version+'-exploration-import.js'});
 assert.equal(typeof listener,'function');
 const event={target:{files:[{size:Buffer.byteLength(incomingText),text:async()=>incomingText}],value:'chosen-backup.json'}};
 await listener(event);
 assert.equal(event.target.value,'','the actual finally block releases the selected file after success or rejection');
 return result;
}
async function runStartup(version,options){
 const result=setup({...options,withLegacy:true});
 result.boot=await vm.runInNewContext(startupPrograms[version],result.context,{filename:version+'-exploration-startup.js'});
 return result;
}

for(const compressed of [false,true]){
 const storageKind=compressed?'compressed':'plain';

 test('P10 historical counterexample: async import loses a newer '+storageKind+' record',async()=>{
  const result=await runImport('historical',{compressed,changeAt:2});
  assert.deepEqual(result.counts(),{preparations:2,competingWrites:1});
  assert.equal(result.saved().lessons.share.draft,oldRecord.lessons.share.draft);
  assert.notEqual(result.saved().lessons.share.draft,newerRecord.lessons.share.draft);
  assert.deepEqual(result.writes,[beforeImportKey,KEY]);
  assert.match(result.messages.at(-1),/备份已合并/);
 });

 test('P10 current import rejects a changed '+storageKind+' snapshot before either write',async()=>{
  const result=await runImport('current',{compressed,changeAt:2});
  assert.deepEqual(result.counts(),{preparations:2,competingWrites:1});
  assert.equal(result.values.get(KEY),result.newBytes,'every byte written by the other tab survives');
  assert.equal(result.values.get(beforeImportKey),result.previousBackup,'the prior recovery backup is not replaced by a stale snapshot');
  assert.deepEqual(result.writes,[]);
  assert.match(result.messages.at(-1),/导入期间学习记录发生变化/);
  assert.ok(result.messages.every(message=>!message.includes('备份已合并')));
 });

 test('P10 current import includes a '+storageKind+' record changed before its snapshot',async()=>{
  const result=await runImport('current',{compressed,changeAt:1});
  assert.deepEqual(result.counts(),{preparations:2,competingWrites:1});
  assert.deepEqual(result.saved().lessons,newerRecord.lessons);
  assert.deepEqual(result.saved().visited,incoming.visited);
  assert.deepEqual(JSON.parse(result.values.get(beforeImportKey)).state,newerRecord);
  assert.deepEqual(result.writes,[beforeImportKey,KEY]);
  assert.match(result.messages.at(-1),/备份已合并/);
 });

 test('P10 current import still merges an unchanged '+storageKind+' record',async()=>{
  const result=await runImport('current',{compressed});
  assert.deepEqual(result.counts(),{preparations:2,competingWrites:0});
  assert.deepEqual(result.saved().lessons,oldRecord.lessons);
  assert.deepEqual(result.saved().visited,incoming.visited);
  assert.deepEqual(JSON.parse(result.values.get(beforeImportKey)).state,oldRecord);
  assert.deepEqual(result.writes,[beforeImportKey,KEY]);
  assert.match(result.messages.at(-1),/备份已合并/);
 });

 test('P10 historical counterexample: startup migration overwrites a newer '+storageKind+' record',async()=>{
  const result=await runStartup('historical',{compressed,changeAt:1});
  assert.deepEqual(result.counts(),{preparations:1,competingWrites:1});
  assert.equal(result.saved().lessons.share.draft,oldRecord.lessons.share.draft);
  assert.notEqual(result.saved().lessons.share.draft,newerRecord.lessons.share.draft);
  assert.equal(result.boot.readBlocked,false);
  assert.deepEqual(result.writes,[KEY]);
 });

 test('P10 current startup preserves a competing '+storageKind+' v2 record and blocks saving',async()=>{
  const result=await runStartup('current',{compressed,changeAt:1});
  assert.deepEqual(result.counts(),{preparations:1,competingWrites:1});
  assert.equal(result.values.get(KEY),result.newBytes);
  assert.equal(result.values.get(OLD_KEY),result.oldBytes);
  assert.equal(result.boot.readBlocked,true);
  assert.deepEqual(result.writes,[]);
  assert.match(result.warnings.at(-1),/停止覆盖原数据/);
 });

 test('P10 current startup also guards the v1 source beside '+storageKind+' v2 storage',async()=>{
  const result=await runStartup('current',{compressed,changeAt:1,changedKey:OLD_KEY});
  assert.deepEqual(result.counts(),{preparations:1,competingWrites:1});
  assert.equal(result.values.get(KEY),result.originalBytes);
  assert.equal(result.values.get(OLD_KEY),result.newOldBytes);
  assert.equal(result.boot.readBlocked,true);
  assert.deepEqual(result.writes,[]);
  assert.match(result.warnings.at(-1),/停止覆盖原数据/);
 });

 test('P10 current startup still migrates stable v1 data beside '+storageKind+' v2 storage',async()=>{
  const result=await runStartup('current',{compressed});
  assert.deepEqual(result.counts(),{preparations:1,competingWrites:0});
  assert.deepEqual(result.saved().lessons,oldRecord.lessons);
  assert.deepEqual(result.saved().legacy,legacy);
  assert.equal(result.values.get(OLD_KEY),result.oldBytes,'migration does not remove the original v1 source');
  assert.equal(result.boot.readBlocked,false);
  assert.deepEqual(result.writes,[KEY]);
  assert.deepEqual(result.warnings,[]);
 });
}

function runNumericExport({changeStored,changeOnClick=false,failDownload=false}={}){
 const initial=validate(structuredClone(numericFixture.backup.state),atlas);
 const local=structuredClone(initial.lessons.growshape);
 if(changeStored)changeStored(initial);
 const saved=validate(initial,atlas),originalRaw=JSON.stringify(saved);
 let raw=originalRaw,renders=0;
 const blobs=[],downloads=[];
 const context={
  KEY,atlas,validate,fresh,backup,unpackText,sessionRecord,assertNoConcurrentLessonOverwrite,Blob,
  id:local.id,a:local,numericBackup:null,numericExportMessage:'',
  localStorage:{getItem:key=>{assert.equal(key,KEY);return raw;}},
  numericReadOnly:()=>local.view==='task'&&numericCompatibility(sessionTasks(local.id)[local.index],local.models[local.index]),
  model:()=>local.models[local.index],
  URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:p10-numeric-backup';},revokeObjectURL:()=>{}},
  document:{createElement:tag=>{
   assert.equal(tag,'a');
   return {click(){
    if(failDownload)throw new Error('download denied');
    downloads.push({href:this.href,name:this.download});
    if(changeOnClick){const next=structuredClone(saved);next.lessons.growshape.draft+='另一页刚修改';raw=JSON.stringify(next);}
   }};
  }},
  // A Node test can observe the Blob and requested download, never disk receipt.
  setTimeout:()=>0,render:()=>{renders++;}
 };
 vm.runInNewContext(matchProgram+'\n'+exportProgram+'\nexportNumericBackup();',context,{filename:'current-numeric-export.js'});
 const permission=vm.runInNewContext('numericBackupMatches()',context);
 return {context,local,saved,originalRaw,raw,blobs,downloads,permission,renders};
}

test('P10 numeric export refuses a stored record missing the current legacy workpiece',()=>{
 const result=runNumericExport({changeStored:s=>delete s.lessons.growshape.models[0]});
 // The general merge guard intentionally accepts missing model keys. The
 // narrower export boundary must prove that the exact soon-to-be-replaced
 // workpiece is actually in the downloaded snapshot.
 assert.doesNotThrow(()=>assertNoConcurrentLessonOverwrite(result.local,result.saved.lessons.growshape));
 assert.deepEqual(result.blobs,[]);assert.deepEqual(result.downloads,[]);
 assert.equal(result.context.numericBackup,null);assert.equal(result.permission,false);
 assert.match(result.context.numericExportMessage,/当前旧作品不在这份已保存记录中/);
 assert.equal(result.raw,result.originalRaw);assert.equal(result.renders,1);
});

test('P10 numeric export refuses a changed stored workpiece without granting retry permission',()=>{
 const result=runNumericExport({changeStored:s=>s.lessons.growshape.models[0].prose+='另一页面的新解释'});
 assert.deepEqual(result.blobs,[]);assert.deepEqual(result.downloads,[]);
 assert.equal(result.context.numericBackup,null);assert.equal(result.permission,false);
 assert.match(result.context.numericExportMessage,/已停止保存/);
 assert.equal(result.raw,result.originalRaw);
});

test('P10 numeric export contains the exact original model and the whole unchanged v2 record',async()=>{
 const result=runNumericExport();
 assert.equal(result.blobs.length,1);assert.equal(result.downloads.length,1);
 assert.match(result.downloads[0].name,/\.json$/);
 const exported=JSON.parse(await result.blobs[0].text());
 assert.equal(exported.version,2);assert.deepEqual(exported.state,result.saved);
 assert.deepEqual(exported.state.lessons.growshape.models[0],result.local.models[0]);
 assert.equal(result.context.numericBackup.raw,result.originalRaw);
 assert.equal(result.context.numericBackup.model,JSON.stringify(result.local.models[0]));
 assert.equal(result.permission,true);assert.equal(result.raw,result.originalRaw);
 assert.match(result.context.numericExportMessage,/已发起备份下载。请确认已保留文件/);
 assert.doesNotMatch(result.context.numericExportMessage,/已(?:成功)?(?:保存|下载)(?:到|在)?(?:本地|磁盘|文件)/);
});

test('P10 numeric export permission expires when another tab changes storage during the download request',async()=>{
 const result=runNumericExport({changeOnClick:true});
 assert.equal(result.blobs.length,1);assert.equal(result.downloads.length,1);
 assert.deepEqual(JSON.parse(await result.blobs[0].text()).state,result.saved);
 assert.notEqual(result.raw,result.originalRaw);
 assert.equal(result.permission,false,'starting a download cannot authorize replacing a later storage snapshot');
});

test('P10 a failed numeric download request leaves the old workpiece and retry permission unchanged',()=>{
 const result=runNumericExport({failDownload:true});
 assert.equal(result.blobs.length,1);assert.deepEqual(result.downloads,[]);
 assert.equal(result.context.numericBackup,null);assert.equal(result.permission,false);
 assert.equal(result.raw,result.originalRaw);
 assert.match(result.context.numericExportMessage,/未能发起备份下载，旧作品没有改变/);
});
