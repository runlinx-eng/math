import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const swSource=fs.readFileSync(path.join(dist,'sw.js'),'utf8');
const entry=fs.readFileSync(path.join(dist,'learning/learn.js'),'utf8');
const html=fs.readFileSync(path.join(dist,'learn.html'),'utf8');
const space=fs.readFileSync(path.join(dist,'space.js'),'utf8');
const exploration=fs.readFileSync(path.join(dist,'exploration.js'),'utf8');
const release=swSource.match(/^const CACHE = '([^']+)'/m)?.[1];
const inline=html.match(/<script>([\s\S]*?)<\/script><script type="module" src="learning\/learn\.js"><\/script>/)?.[1];
const pinned=inline?.match(/STARTUP_ENTRY_SHA256='([0-9a-f]{64})'/)?.[1];
const base='https://math.example/';
assert.ok(release&&inline&&pinned,'release must have an inline integrity-pinned pre-entry recovery');

test('released HTML, module, SW and SHA256 share exactly one immutable version',()=>{
 assert.match(inline,new RegExp("STARTUP_RELEASE='"+release+"'"));
 assert.match(entry,new RegExp("registerClientRelease\\('"+release+"'\\)"));
 assert.match(space,new RegExp("const RELEASE='"+release+"'"),'space must register the same worker');
 assert.match(exploration,new RegExp("const RELEASE='"+release+"'"),'v2 trail must register the same worker');
 assert.equal(pinned,createHash('sha256').update(entry).digest('hex'));
 assert.match(inline,/target\.getAttribute\('src'\)!=='learning\/learn\.js'/);
 assert.match(inline,/startupRecoveryAttempted=true/);
 assert.match(inline,/await import\('\.\/learning\/learn\.js\?module-recovery='/);
 assert.match(inline,/window\.mathStartupRecovery/);
 assert.doesNotMatch(inline,/localStorage\.|sessionStorage\.|caches\.delete\(|location\.reload\(|submitLesson/);
 assert.ok(html.indexOf('STARTUP_ENTRY_SHA256')<html.indexOf('<script type="module"'));
});

function fakeWorker({original='export {};',present=true,mime='text/javascript'}={}){
 const handlers={},requested=[],fetched=[],writes=[];
 const objects=new Map(present?[['/learning/learn.js',new Response(original,{headers:{'Content-Type':mime}})]]:[]);
 const cache={
  match:async key=>objects.get(new URL(key.url||key).pathname),
  put:async(req,response)=>{writes.push(req.url);objects.set(new URL(req.url).pathname,response);}
 };
 const caches={open:async key=>{assert.equal(key,release);return cache;},keys:async()=>[release],delete:async()=>false};
 const self={location:{origin:'https://math.example'},registration:{scope:base},
  addEventListener:(name,listener)=>{handlers[name]=listener;}};
 const fetch=async request=>{fetched.push(request.url);throw Error('stopped origin');};
 vm.runInNewContext(swSource,{self,caches,fetch,URL,Response,MessageChannel,setTimeout,clearTimeout});
 return {requested,fetched,writes,objects,async request(name,query=''){
  const req={url:new URL(name+query,base).href,method:'GET',destination:'script'};
  requested.push(req.url);
  let promise;
  handlers.fetch({request:req,respondWith:value=>{assert.equal(promise,undefined);promise=value;},
   waitUntil:()=>{}});
  assert.ok(promise,'SW must respond to ESM request');
  return await promise;
 }};
}

test('ordinary online/offline ESM requests remain byte-identical and cache-first',async()=>{
 const original="import {x} from './x.js'; export const y = 4;";
 const sw=fakeWorker({original}),response=await sw.request('learning/learn.js');
 assert.equal(response.status,200);
 assert.equal(await response.text(),original);
 assert.equal(sw.fetched.length,0);
 assert.equal(sw.writes.length,0);
});

test('verified release has an isolated mirror graph for static, re-export and dynamic imports',async()=>{
 const original=[
  "import {x} from './phase5/b18-view.js';",
  "export {value} from '../storage.js';",
  "import './state.js';",
  "const lazy=import('./phase4/async-batches.js');",
  "export const text='not a real import';"
 ].join('\n');
 const sw=fakeWorker({original});
 const response=await sw.request('learning/learn.js','?module-recovery='+encodeURIComponent(release));
 assert.equal(response.status,200);
 assert.equal(response.headers.get('X-Math-Module-Recovery'),release);
 const code=await response.text();
 for(const name of ['phase5/b18-view.js','../storage.js','state.js','phase4/async-batches.js'])
  assert.ok(code.includes(name+'?module-recovery='+release),name+' is mirrored');
 assert.match(code,/not a real import/);
 assert.equal(sw.fetched.length,0);
 assert.equal(sw.writes.length,0,'mirrored modules must not rewrite the canonical cache');
});

test('foreign release, extra query parameters and nonlisted paths fail closed',async()=>{
 const sw=fakeWorker();
 for(const [path,query] of [
  ['learning/learn.js','?module-recovery=other-release'],
  ['learning/learn.js','?module-recovery='+release+'&anything=1'],
  ['learning/learn.js','?module-recovery='+release+'&module-recovery='+release],
  ['learning/not-a-real-module.js','?module-recovery='+release]
 ]){
  const response=await sw.request(path,query);
  assert.equal(response.status,412,path+query);
 }
 assert.equal(sw.fetched.length,0);
});

test('missing and non-JavaScript cached modules cannot silently enter the mirrored graph',async()=>{
 for(const options of [{present:false},{mime:'text/plain'}]){
  const sw=fakeWorker(options);
  const response=await sw.request('learning/learn.js','?module-recovery='+release);
  assert.equal(response.status,503);
  assert.equal(sw.fetched.length,0,'stopped origin is never contacted to repair a missing mirror');
 }
});

function simulateHtmlError({controllerRelease=release,cacheComplete=true,cachedEntry=entry}={}){
 const hooks=[],warning={hidden:true,textContent:''},calls={status:0,cache:0};
 const worker={state:'activated',scriptURL:new URL('sw.js?release='+controllerRelease,base).href,
  postMessage(_data,ports){calls.status++;queueMicrotask(()=>ports[0].postMessage({
   type:'math-explorer:cache-status',cache:controllerRelease,complete:cacheComplete,
   cached:cacheComplete?300:299,total:300}));}};
 const storage={match:async()=>new Response(cachedEntry,{headers:{'Content-Type':'text/javascript'}})};
 const navigator={serviceWorker:{controller:worker,getRegistration:async()=>({active:worker})}};
 const window={addEventListener:(kind,callback,capture)=>hooks.push({kind,callback,capture})};
 const document={getElementById:()=>warning};
 const cache={open:async name=>{calls.cache++;assert.equal(name,release);return storage;}};
 // The success path is tested in real Chromium: standard Node vm lacks the
 // browser's per-document ESM module map, so only negative gates are doubled.
 vm.runInNewContext(inline,{window,document,navigator,caches:cache,
  crypto:webcrypto,MessageChannel,URL,location:new URL('learn.html',base),
  Uint8Array,setTimeout,clearTimeout,Promise,Number,Array,Error});
 const faulty={tagName:'SCRIPT',type:'module',getAttribute:key=>key==='src'?'learning/learn.js':null};
 return {warning,window,calls,emit:()=>hooks[0].callback({target:faulty}),
  other:target=>hooks[0].callback({target}),hooks};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,35));

test('runtime error and unrelated module failures never trigger a recovery or alert',async()=>{
 const fixture=simulateHtmlError();
 fixture.other({tagName:'SCRIPT',type:'module',getAttribute:()=> 'learning/unrelated.js'});
 fixture.other({tagName:'WINDOW',type:undefined,getAttribute:()=>null});
 await settle();
 assert.equal(fixture.hooks.length,1);
 assert.equal(fixture.hooks[0].capture,true);
 assert.equal(fixture.warning.hidden,true);
 assert.equal(fixture.window.mathStartupRecovery,undefined);
 assert.equal(fixture.calls.status,0);
});

test('stale controller and incomplete precache fail closed with exactly one attempt',async()=>{
 for(const options of [{controllerRelease:'stale'},{cacheComplete:false}]){
  const fixture=simulateHtmlError(options);
  fixture.emit();fixture.emit();await settle();
  assert.equal(fixture.window.mathStartupRecovery.attempts,1);
  assert.equal(fixture.window.mathStartupRecovery.status,'failed');
  assert.equal(fixture.warning.hidden,false);
  assert.match(fixture.warning.textContent,/程序未能加载/);
  assert.match(fixture.warning.textContent,/已保存的学习记录没有被清除/);
  assert.equal(fixture.calls.cache,0);
 }
});

test('tampered original entry is cryptographically rejected before any mirror import',async()=>{
 const fixture=simulateHtmlError({cachedEntry:entry+'\n// tampered'});
 fixture.emit();await settle();
 assert.equal(fixture.window.mathStartupRecovery.status,'failed');
 assert.equal(fixture.window.mathStartupRecovery.failure,'entry-integrity-mismatch');
 assert.equal(fixture.calls.cache,1);
 assert.equal(fixture.warning.hidden,false);
});
