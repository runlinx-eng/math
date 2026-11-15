import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';

const require=createRequire(import.meta.url);
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const raw='{"fixture":"isolated contract record; not a child record","attempts":[{"value":7}]}';
const release='contract-release',base='http://127.0.0.1:18080/';

// Exercise the actual runner's catch and the shared diagnostic writer. This
// controlled browser double is a failure-artifact contract, not Chromium proof.
async function runProbe({failureViewport=0,brokenScreenshot=false,mature=false,fractionOrder=false,brokenDiagnostics=false,brokenCache=false,brokenClose=false}={}){
 const adapter=mature||fractionOrder;
 const sourceURL=new URL(fractionOrder?'./p9-fraction-order-adapter-browser.cjs':mature?'./p9-mature-expansion-browser.cjs':'./p9-bootstrap-failure-browser.cjs',import.meta.url);
 const source=fs.readFileSync(sourceURL,'utf8');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'math-bootstrap-artifact-'));
 fs.mkdirSync(path.join(root,'dist'));fs.mkdirSync(path.join(root,'tests'));
 fs.writeFileSync(path.join(root,'dist/sw.js'),"const CACHE = '"+release+"';\n");
 const contexts=[],logs=[],launches=[],processState={env:{},exitCode:0};let browserCloses=0;
 class Channel{
  constructor(){
   this.port1={close(){}};
   this.port2={postMessage:data=>queueMicrotask(()=>this.port1.onmessage?.({data}))};
  }
 }
 class Page extends EventEmitter{
  constructor(context){super();this.owner=context;this.href=base;this.reloads=0;this.missing=false;this.failed=false;this.raw=raw;}
  context(){return this.owner;}
  setDefaultTimeout(ms){assert.equal(ms,20000);}
  url(){return this.href;}
  async goto(url){this.href=url;}
  async reload(){
   if(!this.missing&&++this.reloads===(adapter?1:2)&&this.owner.number===failureViewport){
    this.failed=true;
    this.raw=JSON.stringify({contractFixture:'latest fault bytes, not child work',viewport:this.owner.number,reload:this.reloads});
    const request={url:()=>base+'learning/phase5/b18-view.js',resourceType:()=> 'script',
     method:()=> 'GET',isNavigationRequest:()=>false,serviceWorker:()=>null,
     failure:()=>({errorText:'net::ERR_ABORTED'})};
    this.owner.emit('request',request);
    this.owner.emit('response',{request:()=>request,url:request.url,status:()=>200,fromServiceWorker:()=>true,
     headers:()=>({'content-type':'text/javascript','content-length':'3'})});
    this.emit('pageerror',new Error('contract module graph failed'));
    this.emit('console',{type:()=> 'error',text:()=> 'Failed to load module: net::ERR_ABORTED',location:()=>({url:request.url()})});
    this.emit('requestfailed',request);this.owner.emit('requestfailed',request);
   }
   return {status:()=>200,fromServiceWorker:()=>true};
  }
  async waitForFunction(fn,arg){
   if(!await this.evaluate(fn,arg))throw new Error('contract readiness failure after offline reload '+this.reloads);
  }
  locator(selector){
   if(adapter)return {waitFor:async()=>assert.equal(selector,'#import-file')};
   assert.equal(selector,'#storage-warning');return {waitFor:async()=>assert.ok(this.missing)};
  }
  async evaluate(fn,arg){
   // The mature runner seeds only an empty position before the fault. Its
   // original maths modules are imported below; no mathematical work is faked.
   if(mature&&arg&&typeof arg==='object'&&Object.hasOwn(arg,'keep')){
    assert.equal(arg.id,'turnarray');assert.equal(arg.index,1);return;
   }
   if(fractionOrder&&arg?.id==='fractionbench'&&fn.constructor.name==='AsyncFunction'){
    assert.equal(arg.index,0);return;
   }
   const page=this,controller={state:'activated',scriptURL:base+'sw.js?release='+release,
    postMessage(_,ports){ports[0].postMessage({complete:!page.missing,cache:release,cached:page.missing?2:3,total:3});}};
   const cache={match:async url=>{
    if(brokenCache&&page.failed)throw new Error('contract cache body unavailable');
    return page.missing&&String(url).endsWith('b18-view.js')?null:
     {status:200,headers:{get:()=> 'text/javascript'},arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
   },
    delete:async()=>{page.missing=true;return true;}};
   return await vm.runInNewContext('('+fn.toString()+')(__arg)',{
    __arg:arg,URL,MessageChannel:Channel,setTimeout,clearTimeout,crypto:webcrypto,Uint8Array,
    location:new URL(this.href),localStorage:{getItem:key=>{assert.equal(key,'math-explorer-v2');return this.raw;}},
    window:{mathLesson:this.failed||this.missing?undefined:{snapshot:()=>({id:'share'})}},
    navigator:{serviceWorker:{controller,getRegistration:async()=>({scope:base,active:controller})}},
    caches:{keys:async()=>[release],open:async()=>cache},performance:{getEntriesByType:()=>[]},
    document:{readyState:'complete',querySelector:selector=>({
     '#title':{textContent:'分一分'},'#instruction':{textContent:'把整体分成相等的部分'},
     '#storage-warning':{hidden:!this.missing,textContent:this.missing?'程序未能加载；已保存的学习记录没有被清除':''},
     '#work':{textContent:this.failed||this.missing?'':'真实数学控件'},
     '#actions':{textContent:''},'#check-feedback':{textContent:''}
    }[selector])}
   });
  }
  async content(){return '<html><title>isolated failure shell</title></html>';}
  async screenshot(options){
   if(brokenScreenshot&&options.path.endsWith('-failure.png'))throw new Error('contract screenshot unavailable');
   fs.writeFileSync(options.path,'contract screenshot placeholder; not Chromium pixels');
  }
 }
 const browser={version:()=> 'contract-browser',close:async()=>{
   browserCloses++;
   if(brokenClose)throw new Error('contract browser close unavailable');
   const flag=launches[0]?.args.find(arg=>arg.startsWith('--log-net-log='));
   if(flag)fs.writeFileSync(flag.slice('--log-net-log='.length),JSON.stringify({contractFixture:true,notChromiumNetLog:true}));
  },
  async newContext(){
   const context=new EventEmitter();context.number=contexts.length+1;context.close=async()=>{};
   context.newPage=async()=>context.page=new Page(context);contexts.push(context);return context;
  }};
 const server={listening:false,listen(_port,_host,ready){this.listening=true;ready();},address:()=>({port:18080}),
  close(done){this.listening=false;done();},closeAllConnections(){}};
 const sandboxRequire=id=>id==='playwright'?{chromium:{launch:async options=>{launches.push(options);return browser;}}}:
  id==='node:http'?{createServer:()=>server}:
  id==='node:child_process'?{execFileSync:()=> 'a'.repeat(40)}:
  id==='./fixtures/p9-mature-expansion-cases.cjs'?{array:[{id:'turnarray',index:1}]}:
  id==='./fixtures/p9-fraction-order-cases.cjs'?[{id:'fractionbench',index:0}]:
  id==='./helpers/p9-browser-diagnostics.cjs'?{observeBrowserDiagnostics(...args){
   const diagnostics=observeBrowserDiagnostics(...args);
   return brokenDiagnostics?{dump:async()=>{throw new Error('contract diagnostic writer unavailable');}}:diagnostics;
  }}:require(id);
 try{
  await vm.runInNewContext(source,{require:sandboxRequire,__dirname:path.join(root,'tests'),process:processState,
   console:{log:value=>logs.push(value),error:value=>logs.push(String(value))}},
   {filename:sourceURL.pathname,...(adapter?{importModuleDynamically:vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER}:{})});
  const out=path.join(root,'verification',fractionOrder?'p9-fraction-order-adapter':mature?'p9-mature-expansion':'p9-bootstrap-failure');
  return {result:JSON.parse(fs.readFileSync(path.join(out,'results.json'),'utf8')),
   files:Object.fromEntries(fs.readdirSync(out).map(name=>[name,fs.readFileSync(path.join(out,name),'utf8')])),
   exitCode:processState.exitCode,logs,contexts,launches,browserCloses};
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}

test('healthy monitor preserves all 24 reloads and both deliberate missing-module checks',async()=>{
 const run=await runProbe();
 assert.equal(run.exitCode,0);
 assert.equal(run.result.results.length,2);
 assert.equal(run.result.checks.length,40);
 for(const result of run.result.results){
  assert.equal(result.successfulOfflineReloads.length,12);
  assert.deepEqual(result.deletion,{existed:true,deleted:true,after:false});
  assert.equal(result.before.rawBytes,raw.length);
  assert.equal(result.after.storedBytes,raw.length);
  assert.match(result.after.warning,/已保存的学习记录没有被清除/);
  const captured=JSON.parse(run.files[result.expectedFailureDiagnostic]);
  assert.equal(captured.storageCapture.source,'before-cache-diagnostics');
  assert.equal(run.files[captured.storage],raw);
 }
});

for(const failureViewport of [1,2])test('viewport '+failureViewport+' readiness failure retains active errors, cache, DOM and original storage',async()=>{
 const run=await runProbe({failureViewport,brokenScreenshot:true}),result=run.result;
 assert.equal(run.exitCode,1,'failure cannot become success');
 assert.equal(result.results.length,failureViewport,'the in-progress viewport must not disappear');
 if(failureViewport===2)assert.equal(result.results[0].successfulOfflineReloads.length,12,'previous completed viewport retained');
 const active=result.results.at(-1);
 assert.equal(active.status,'failed');
 assert.equal(active.stage,'healthy-offline-reload');
 assert.equal(active.offlineReloadAttempt,2);
 assert.equal(active.successfulOfflineReloads.length,1,'failed reload is never retried or counted as success');
 assert.equal(active.cacheReport.complete,true,'pre-failure cache inventory retained');
 assert.match(active.pageErrors[0],/module graph failed/);
 assert.match(active.consoleErrors[0],/ERR_ABORTED/);
 assert.equal(active.failedRequests[0].error,'net::ERR_ABORTED');
 assert.equal(active.failureDiagnostic,result.failureDiagnostic);
 const diagnostic=JSON.parse(run.files[result.failureDiagnostic]);
 assert.equal(diagnostic.label,active.label);
 assert.equal(diagnostic.snapshot,null);
 assert.equal(diagnostic.cacheStatus.complete,true);
 assert.deepEqual(diagnostic.cacheKeys,[release]);
 assert.equal(diagnostic.controller.state,'activated');
 assert.equal(diagnostic.dom.work,'');
 assert.equal(diagnostic.eventsByKind.requestfailed[0].failure.errorText,'net::ERR_ABORTED');
 assert.notEqual(run.contexts.at(-1).page.raw,raw,'fault bytes differ from the earlier healthy fixture');
 assert.equal(run.files[diagnostic.storage],run.contexts.at(-1).page.raw,'diagnostics retain the current failed viewport bytes');
 assert.match(run.files[diagnostic.documentFile],/isolated failure shell/);
 assert.match(result.errors.at(-1).message,/readiness failure/);
});

test('independent monitor covers main pushes and uploads failure evidence without scheduling or deployment',()=>{
 const workflow=fs.readFileSync(new URL('../.github/workflows/p9-bootstrap-failure-regression.yml',import.meta.url),'utf8');
 assert.match(workflow,/\n  push:\n    branches: \[main\]/);
 assert.match(workflow,/tests\/helpers\/p9-browser-diagnostics\.cjs/);
 assert.match(workflow,/tests\/p9-mature-expansion-browser\.cjs/);
 assert.match(workflow,/tests\/p9-fraction-order-adapter-browser\.cjs/);
 assert.match(workflow,/tests\/p9-bootstrap-failure-artifact\.test\.mjs/);
 assert.match(workflow,/if: always\(\)/);
 assert.match(workflow,/if-no-files-found: error/);
 assert.doesNotMatch(workflow,/\n  schedule:|deploy-vps|confirm_deploy/);
});

test('mature runner keeps its original reload error and real diagnostic files when screenshots fail',async()=>{
 const run=await runProbe({mature:true,failureViewport:1,brokenScreenshot:true}),result=run.result;
 assert.equal(run.exitCode,1);
 assert.equal(result.at,'1440x900-array-turnarray-1');
 assert.match(result.error,/readiness failure after offline reload 1/);
 assert.match(result.errors[0],/module graph failed/);
 assert.equal(result.offline[0].originStopped,true);
 assert.equal(run.contexts[0].page.reloads,1,'the failed operation was not retried');
 assert.equal(result.observations.length,0,'the injected fault is not a successful mathematical observation');
 assert.equal(typeof result.failureDiagnostic,'string','the failed runner must retain its diagnostic filename');
 const diagnostic=JSON.parse(run.files[result.failureDiagnostic]);
 assert.equal(diagnostic.error,result.error);
 assert.equal(diagnostic.label,result.at);
 assert.equal(diagnostic.snapshot,null);
 assert.equal(diagnostic.cacheStatus.complete,true);
 assert.equal(diagnostic.eventsByKind.requestfailed[0].failure.errorText,'net::ERR_ABORTED');
 assert.notEqual(run.contexts[0].page.raw,raw);
 assert.equal(run.files[diagnostic.storage],run.contexts[0].page.raw);
 assert.match(run.files[diagnostic.documentFile],/isolated failure shell/);
});

test('mature runner preserves the original failure even if diagnostic writing also fails',async()=>{
 const run=await runProbe({mature:true,failureViewport:1,brokenScreenshot:true,brokenDiagnostics:true});
 assert.equal(run.exitCode,1);
 assert.match(run.result.error,/readiness failure after offline reload 1/);
 assert.match(run.result.errors[0],/module graph failed/);
 assert.ok(run.result.failureDiagnostic,'secondary diagnostic failure must be reported without dropping the original error');
 assert.match(run.result.failureDiagnostic.diagnosticError,/diagnostic writer unavailable/);
 assert.equal(run.contexts[0].page.reloads,1);
});

test('fraction-order failure retains cache response bytes, aborted requests and one original NetLog lifecycle',async()=>{
 const run=await runProbe({fractionOrder:true,failureViewport:1,brokenScreenshot:true}),result=run.result;
 assert.equal(run.exitCode,1);
 assert.equal(result.at,'1440x900-fractionbench-0');
 assert.match(result.error,/readiness failure after offline reload 1/);
 assert.match(result.errors[0],/module graph failed/);
 assert.equal(result.offline[0].originStopped,true);
 assert.equal(result.observations.length,0,'this controlled failure is not successful mathematical evidence');
 assert.equal(run.contexts[0].page.reloads,1,'no operation retry');
 assert.equal(run.launches.length,1,'no extra browser is launched for diagnostics');
 assert.equal(run.browserCloses,1,'the original finally closes the same browser and flushes its log');
 assert.deepEqual(Array.from(run.launches[0].args).slice(0,2),['--use-angle=swiftshader','--enable-unsafe-swiftshader']);
 assert.equal(run.launches[0].args.length,3);
 assert.ok(run.launches[0].args[2].endsWith('/p9-fraction-order-adapter/'+result.networkLog));
 assert.equal(JSON.parse(run.files[result.networkLog]).notChromiumNetLog,true,'the browser double never claims a real NetLog');
 const diagnostic=JSON.parse(run.files[result.failureDiagnostic]);
 assert.equal(diagnostic.error,result.error);
 assert.equal(diagnostic.snapshot,null);
 assert.equal(diagnostic.cacheStatus.complete,true);
 const resource=diagnostic.currentNavigationResources.find(r=>r.url.endsWith('b18-view.js'));
 assert.equal(resource.failure.errorText,'net::ERR_ABORTED');
 assert.equal(resource.response.status,200);assert.equal(resource.response.fromServiceWorker,true);
 const cached=diagnostic.cacheResponses.find(r=>r.url===resource.url);
 assert.equal(cached.status,200);assert.equal(cached.contentType,'text/javascript');assert.equal(cached.bytes,3);
 assert.equal(cached.sha256,'039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81');
 assert.notEqual(run.contexts[0].page.raw,raw,'earlier fixtures cannot stand in for the failed work');
 assert.equal(run.files[diagnostic.storage],run.contexts[0].page.raw,'only the observed current bytes are saved');
 assert.match(run.files[diagnostic.documentFile],/isolated failure shell/);
});

test('fraction-order retains its original failure and NetLog when diagnostic writing fails',async()=>{
 const run=await runProbe({fractionOrder:true,failureViewport:1,brokenScreenshot:true,brokenDiagnostics:true});
 assert.equal(run.exitCode,1);
 assert.match(run.result.error,/readiness failure after offline reload 1/);
 assert.match(run.result.failureDiagnostic.diagnosticError,/diagnostic writer unavailable/);
 assert.equal(run.launches.length,1);assert.equal(run.browserCloses,1);
 assert.equal(run.contexts[0].page.reloads,1);
 assert.ok(run.files[run.result.networkLog]);
});

for(const runner of ['bootstrap','mature','fraction-order'])test(runner+' cache diagnostic failure cannot discard current failure storage',async()=>{
 const run=await runProbe({mature:runner==='mature',fractionOrder:runner==='fraction-order',
  failureViewport:1,brokenScreenshot:true,brokenCache:true});
 assert.equal(run.exitCode,1);
 const diagnostic=JSON.parse(run.files[run.result.failureDiagnostic]);
 assert.match(diagnostic.diagnosticError,/cache body unavailable/);
 assert.match(diagnostic.error,/readiness failure/);
 assert.notEqual(run.contexts[0].page.raw,raw);
 assert.equal(run.files[diagnostic.storage],run.contexts[0].page.raw);
 assert.equal(diagnostic.storageCapture.source,'before-cache-diagnostics');
 assert.equal(diagnostic.storageCapture.bytes,Buffer.byteLength(run.contexts[0].page.raw));
 assert.equal(run.contexts[0].page.reloads,runner==='bootstrap'?2:1,'failed operations are not retried');
});

test('fraction-order distinguishes a failed browser close from successful trace cleanup',async()=>{
 const run=await runProbe({fractionOrder:true,failureViewport:1,brokenScreenshot:true,brokenClose:true});
 assert.equal(run.exitCode,1);
 assert.match(run.result.error,/readiness failure/);
 assert.ok(run.logs.some(line=>/browser close unavailable/.test(line)));
 const rows=run.files[run.result.cdpLogs[0]].trim().split('\n').map(line=>JSON.parse(line));
 assert.ok(rows.some(row=>row.kind==='browser-close-start'));
 assert.ok(rows.some(row=>row.kind==='browser-close-failed'&&/browser close unavailable/.test(row.error)));
 assert.equal(rows.some(row=>row.kind==='browser-close-complete'),false);
 assert.equal(rows.at(-1).kind,'diagnostic-stream-end');
 assert.equal(run.contexts[0].page.reloads,1);
});
