import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

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


// Actual shipped compact syntax includes multiple imports on one line. Scope:
// static declarations, literal dynamic imports, and the existing B39 suffix.
// This is not a general JavaScript lexer. Pre-existing import-looking text in
// arbitrary strings/comments is not made an unrelated parser requirement here.
test('real compact imports, re-exports and same-line declarations use the same-release mirror',async()=>{
 const source=[
  fs.readFileSync(path.join(dist,'learning/phase4/b04-model.js'),'utf8').split('\n')[0],
  fs.readFileSync(path.join(dist,'learning/phase5/b07-model.js'),'utf8').split('\n')[0],
  fs.readFileSync(path.join(dist,'learning/phase4/b02-view.js'),'utf8').split('\n')[0],
  'import*as namespace from"./namespace.js";',
  'import defaultValue,{named as renamed}from"./mixed.js";',
  'export{renamed}from"./reexport.js";export*from"./star.js";',
  'import"./side-effect.js";',
  'const lazy=import("./literal.js");',
  'const computed=import("./computed.js"+suffix);',
  'const meta=import.meta.url;',
  'const important="./plain.js";const importable="./plain-again.js";',
  'import external from"https://example.test/remote.js";',
  'import bare from"bare-package";'
 ].join('\n');
 const response=await fakeWorker({original:source}).request('learning/learn.js','?module-recovery='+release);
 const mirrored=await response.text();
 for(const specifier of ['./common.js','./b07.js','./geometry.js','./ui.js','./namespace.js','./mixed.js',
  './reexport.js','./star.js','./side-effect.js','./literal.js'])
  assert.ok(mirrored.includes(specifier+'?module-recovery='+release),specifier+' must not reuse its original URL');
 for(const preserved of ['import("./computed.js"+suffix)','import.meta.url',
  'const important="./plain.js";const importable="./plain-again.js";',
  'import external from"https://example.test/remote.js";','import bare from"bare-package";'])
  assert.ok(mirrored.includes(preserved),preserved+' retains its existing semantics');
});

const parseInV8=(script,input)=>{
 const result=spawnSync(process.execPath,['--experimental-vm-modules','--input-type=module','-e',script],{
  input:JSON.stringify(input),encoding:'utf8',timeout:20000,maxBuffer:8*1024*1024
 });
 assert.ifError(result.error);
 assert.equal(result.status,0,result.stderr||result.stdout);
 return JSON.parse(result.stdout);
};

test('V8 parses every shipped cached module and independently compares its complete static dependency list',async()=>{
 const expression=swSource.match(/^const FILES = (\[.*\]);$/m)?.[1];
 assert.ok(expression,'read the actual complete immutable cache list');
 const files=Array.from(vm.runInNewContext(expression)).filter(file=>file.endsWith('.js'));
 const rows=[];
 for(const file of files){
  const original=fs.readFileSync(path.join(dist,file),'utf8'),worker=fakeWorker({original});
  const response=await worker.request('learning/learn.js','?module-recovery='+release);
  assert.equal(response.status,200,file);rows.push({file,original,mirrored:await response.text()});
  assert.equal(worker.writes.length,0,file+' canonical cache stays unchanged');
  assert.equal(worker.fetched.length,0,file+' test does not contact an origin');
 }
 const result=parseInV8(String.raw`
  import fs from 'node:fs';
  import vm from 'node:vm';
  import assert from 'node:assert/strict';
  const {rows,release}=JSON.parse(fs.readFileSync(0,'utf8'));
  let dependencyCount=0,relativeCount=0;
  const expected=specifier=>{
   if(!/^\.\.?\//.test(specifier))return specifier;
   const split=specifier.split('#'),base=split.shift(),fragment=split.length?'#'+split.join('#'):'';
   return base+(base.includes('?')?'&':'?')+'module-recovery='+encodeURIComponent(release)+fragment;
  };
  for(const row of rows){
   // Parse without linking or executing application code; the V8 parser is
   // independent of the production import-rewriting regular expressions.
   const before=Array.from(new vm.SourceTextModule(row.original,{identifier:row.file}).dependencySpecifiers);
   const after=Array.from(new vm.SourceTextModule(row.mirrored,{identifier:row.file+'?recovered'}).dependencySpecifiers);
   assert.deepEqual(after,before.map(expected),row.file+' preserves order and has no missing or extra dependency');
   dependencyCount+=before.length;relativeCount+=before.filter(s=>/^\.\.?\//.test(s)).length;
  }
  process.stdout.write(JSON.stringify({parsedModules:rows.length,dependencyCount,relativeCount,executedModules:0}));
`,{rows,release});
 assert.equal(result.parsedModules,files.length);assert.equal(result.executedModules,0);
 assert.ok(result.relativeCount>0,'the check covers real relative imports');
 console.log('P9_MODULE_RECOVERY_IMPORT_CORPUS '+JSON.stringify(result));
});

test('real B39 lazy loader preserves ordinary retries and isolates saved-record restoration under the recovery release',async()=>{
 const original=fs.readFileSync(path.join(dist,'learning/phase4/async-batches.js'),'utf8');
 const response=await fakeWorker({original}).request('learning/learn.js','?module-recovery='+release);
 const mirrored=await response.text();
 const result=parseInV8(String.raw`
  import fs from 'node:fs';
  import vm from 'node:vm';
  import assert from 'node:assert/strict';
  import path from 'node:path';
  import {pathToFileURL} from 'node:url';
  const {original,mirrored,release,dist}=JSON.parse(fs.readFileSync(0,'utf8'));
  // Actual metadata supplies the same 8 tasks/13 bridges validated by the
  // loader. Model/view stubs test registration, not B39 mathematics.
  const batch=await import(pathToFileURL(path.join(dist,'learning/phase5/b39.js')));
  const ids=Object.keys(batch.TASKS),firstId=ids[0];
  assert.equal(ids.length,8);assert.equal(batch.BRIDGES.length,13);
  const outcomes=[];
  for(const recovery of [false,true]){
   let storageReads=0;
   const globals={URL};
   for(const key of ['localStorage','sessionStorage','caches'])Object.defineProperty(globals,key,{
    get(){storageReads++;throw Error('unexpected storage access: '+key);}
   });
   const context=vm.createContext(globals),requests=[],modelRegistrations=[],viewRegistrations=[];
   const lessons=Object.fromEntries(ids.map(id=>[id,{batch:'B39'}])),tasks={},practice={};
   const bridges=Object.fromEntries(batch.BRIDGES.map(b=>['link-'+b.from+'-'+b.to,{batch:'B39',title:b.title,tasks:[]}]));
   const synthetic=async(name,exports)=>{
    const module=new vm.SyntheticModule(Object.keys(exports),function(){
     for(const [key,value]of Object.entries(exports))this.setExport(key,value);
    },{context,identifier:name});
    await module.link(()=>{throw Error('unexpected synthetic dependency');});await module.evaluate();return module;
   };
   const model=await synthetic('test-b39-model',{marker:'independent-model-stub'});
   const renderer=await synthetic('test-b39-renderer',{marker:'independent-renderer-stub'});
   const dispatcher=await synthetic('test-view-engine',{registerB39View:(m,v)=>viewRegistrations.push([m,v])});
   const staticModules={
    '../catalog.js':await synthetic('test-catalog',{LESSONS:lessons}),
    '../tasks.js':await synthetic('test-tasks',{TASKS:tasks,PRACTICE:practice}),
    '../bridges.js':await synthetic('test-bridges',{BRIDGES:bridges}),
    './engine.js':await synthetic('test-engine',{registerB39Model:m=>modelRegistrations.push(m)})
   };
   const batchModule=await synthetic('test-b39-batch',{TASKS:batch.TASKS,PRACTICE:batch.PRACTICE,BRIDGES:batch.BRIDGES});
   let modelFault=true,viewFault=true;
   const entry=new vm.SourceTextModule(recovery?mirrored:original,{
    context,
    identifier:'https://math.example/learning/phase4/async-batches.js'+(recovery?'?module-recovery='+release:''),
    initializeImportMeta(meta,module){meta.url=module.identifier;},
    async importModuleDynamically(specifier){
     requests.push(specifier);
     const clean=specifier.split('?')[0];
     if(clean==='../phase5/b39.js')return batchModule;
     if(clean==='../phase5/b39-model.js'){
      if(modelFault){modelFault=false;throw Error('controlled first model failure');}return model;
     }
     if(clean==='../phase5/b39-view.js'){
      if(viewFault){viewFault=false;throw Error('controlled first view failure');}return renderer;
     }
     if(clean==='./view-engine.js')return dispatcher;
     throw Error('unexpected dynamic module '+specifier);
    }
   });
   await entry.link(specifier=>{
    const clean=specifier.split('?')[0];assert.ok(staticModules[clean],specifier);return staticModules[clean];
   });await entry.evaluate();
   const api=entry.namespace,saved={lessons:{[firstId]:{id:firstId}}};
   assert.equal(api.needsB39Runtime(saved),true);
   await assert.rejects(api.prepareStateForValidation(saved),/controlled first model failure/);
   assert.equal(modelRegistrations.length,0);assert.deepEqual(Object.keys(tasks),[]);
   await api.prepareStateForValidation(saved);
   assert.equal(api.isB39Ready(),true);assert.equal(modelRegistrations.length,1);
   assert.equal(modelRegistrations[0],model.namespace);
   assert.deepEqual(Object.keys(tasks),ids);assert.deepEqual(practice,batch.PRACTICE);
   for(const b of batch.BRIDGES)assert.deepEqual(bridges['link-'+b.from+'-'+b.to].tasks,b.tasks);
   const atReady=requests.length;await api.prepareStateForValidation(saved);assert.equal(requests.length,atReady);
   await assert.rejects(api.prepareSessionRuntime(firstId,{view:true}),/controlled first view failure/);
   assert.equal(viewRegistrations.length,0);
   await api.prepareSessionRuntime(firstId,{view:true});
   assert.equal(viewRegistrations.length,1);assert.equal(viewRegistrations[0][0],model.namespace);
   assert.equal(viewRegistrations[0][1],renderer.namespace);
   const atView=requests.length;await api.prepareSessionRuntime(firstId,{view:true});assert.equal(requests.length,atView);
   const suffix=recovery?'?module-recovery='+release:'';
   const retrySuffix=recovery?suffix:'?retry=1';
   assert.deepEqual(requests,[
    '../phase5/b39.js'+suffix,'../phase5/b39-model.js'+suffix,
    '../phase5/b39.js'+retrySuffix,'../phase5/b39-model.js'+retrySuffix,
    '../phase5/b39-view.js'+suffix,'./view-engine.js'+suffix,
    '../phase5/b39-view.js'+retrySuffix,'./view-engine.js'+suffix
   ]);
   if(recovery)for(const specifier of requests){
    const parsed=new URL(specifier,'https://math.example/learning/phase4/');
    assert.equal(parsed.searchParams.size,1);assert.equal(parsed.searchParams.get('module-recovery'),release);
    assert.equal(parsed.searchParams.has('retry'),false,'no second query bypasses the existing worker gate');
   }
   assert.equal(storageReads,0);
   outcomes.push({recovery,requests,modelRegistrations:modelRegistrations.length,viewRegistrations:viewRegistrations.length,storageReads});
  }
  process.stdout.write(JSON.stringify({outcomes,actualChromium:false,mathematicsAssessed:false}));
`,{original,mirrored,release,dist});
 assert.equal(result.outcomes.length,2);
 assert.ok(result.outcomes.every(row=>row.modelRegistrations===1&&row.viewRegistrations===1&&row.storageReads===0));
 console.log('P9_MODULE_RECOVERY_B39_IMPORTS '+JSON.stringify(result));
});
