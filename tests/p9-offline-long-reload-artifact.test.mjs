// Explicit Node/VM doubles. No Chromium, CDP browser, or mathematical proof.
import test from 'node:test';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import {webcrypto,createHash} from 'node:crypto';

const repo=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
const {observeBrowserDiagnostics}=require(path.join(repo,'tests/helpers/p9-browser-diagnostics.cjs'));
const source=fs.readFileSync(path.join(repo,'tests/p9-offline-long-reload-browser.cjs'),'utf8');
const release='contract-release',base='http://127.0.0.1:18080/';
const initial=()=>JSON.stringify({lessons:{fractionbench:{id:'fractionbench',index:0,view:'task',models:{0:{history:[]}},cases:{0:{support:false,attempts:[]}},notes:[],draft:'',updatedAt:'initial'}}});

async function probe({failureViewport=0,cacheReadFails=false,browserCloseFails=false,attemptMutation=false,diagnosticThrows=false,traceWriteError=false,traceFinishThrows=false,lateViewportEvent=false,nativeMode='saved'}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'math-long-contract-'));
 fs.mkdirSync(path.join(root,'dist'));fs.mkdirSync(path.join(root,'tests'));
 fs.writeFileSync(path.join(root,'dist/sw.js'),`const CACHE = '${release}';`);
 const contexts=[],launches=[],traceEvents=[],logs=[],reads=[];let browserCloses=0;
 const proc={env:{},exitCode:0};
 class Channel{
  constructor(){this.port1={close(){}};this.port2={postMessage:data=>queueMicrotask(()=>this.port1.onmessage?.({data}))};}
 }
 class Page extends EventEmitter{
  constructor(context){super();this.owner=context;this.href=base;this.raw=initial();this.reloads=0;this.failed=false;}
  context(){return this.owner;}
  setDefaultTimeout(ms){assert.equal(ms,20000);}
  url(){return this.href;}
  async goto(url){this.href=url;}
  async reload(){
   this.reloads++;
   if(lateViewportEvent&&this.owner.number===2&&this.reloads===1){
    const earlier=contexts[0].page,request={url:()=>base+'earlier-viewport-request',resourceType:()=> 'fetch',method:()=> 'GET',isNavigationRequest:()=>false,serviceWorker:()=>null,failure:()=>({errorText:'contract earlier-context cleanup cancellation'})};
    earlier.emit('requestfailed',request);earlier.context().emit('requestfailed',request);
   }
   if(this.owner.number===failureViewport&&this.reloads===3){
    const state=JSON.parse(this.raw);state.observedFailureMarker=`current viewport ${this.owner.number}, reload 3`;
    this.raw=JSON.stringify(state);this.failed=true;
    const request={url:()=>base+'learning/phase5/b18-view.js',resourceType:()=> 'script',method:()=> 'GET',isNavigationRequest:()=>false,serviceWorker:()=>null,failure:()=>({errorText:'net::ERR_ABORTED'})};
    this.owner.emit('request',request);this.owner.emit('response',{request:()=>request,url:request.url,status:()=>200,fromServiceWorker:()=>true,headers:()=>({'content-type':'text/javascript'})});
    this.owner.emit('requestfailed',request);this.emit('requestfailed',request);
   }
   if(attemptMutation&&this.owner.number===1&&this.reloads===3){
    const state=JSON.parse(this.raw);state.lessons.fractionbench.cases[0].attempts.push({fixture:'invented attempt contract mutation'});this.raw=JSON.stringify(state);
   }
   return {status:()=>200,fromServiceWorker:()=>true};
  }
  async waitForFunction(fn,arg){if(!await this.evaluate(fn,arg))throw new Error(`contract readiness failure viewport ${this.owner.number} reload ${this.reloads}`);}
  async evaluate(fn,arg){
   if(fn.constructor.name==='AsyncFunction'&&arg?.id==='fractionbench'){this.raw=initial();return;}
   const page=this,controller={state:'activated',scriptURL:base+'sw.js?release='+release,postMessage(_,ports){ports[0].postMessage({complete:true,cache:release,cached:3,total:3});}};
   const cache={match:async()=>{if(cacheReadFails&&page.failed)throw new Error('contract CacheStorage read failed after raw was read');return {status:200,headers:{get:()=> 'text/javascript'},arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};}};
   return await vm.runInNewContext('('+fn.toString()+')(__arg)',{
    __arg:arg,URL,MessageChannel:Channel,setTimeout,clearTimeout,crypto:webcrypto,Uint8Array,
    location:new URL(this.href),localStorage:{getItem:key=>{assert.equal(key,'math-explorer-v2');reads.push({failed:page.failed,raw:page.raw});return page.raw;}},
    window:{mathLesson:page.failed?undefined:{snapshot:()=>({id:'fractionbench',index:0,view:'task'})}},
    navigator:{serviceWorker:{controller,getRegistration:async()=>({scope:base,active:controller})}},
    caches:{keys:async()=>[release],open:async()=>cache},performance:{getEntriesByType:()=>[]},
    document:{readyState:'complete',querySelector:selector=>({'#title':{textContent:'分数'},'#instruction':{textContent:'把分数放到数轴'},'#storage-warning':{hidden:true,textContent:''},'#work':{textContent:page.failed?'':'controlled fixture'},'#actions':{textContent:''},'#check-feedback':{textContent:''}}[selector])}
   });
  }
  async content(){return '<html>controlled contract fixture; not real browser HTML</html>';}
  async screenshot({path:file}){fs.writeFileSync(file,'controlled placeholder; not a real screenshot');}
 }
 const browser={version:()=> 'controlled-node-double-not-chromium',async newContext(){const context=new EventEmitter();context.number=contexts.length+1;context.close=async()=>{};context.newPage=async()=>context.page=new Page(context);contexts.push(context);return context;},async close(){browserCloses++;if(browserCloseFails)throw new Error('contract browser close transport failure');const flag=launches[0].args.find(x=>x.startsWith('--log-net-log='));fs.writeFileSync(flag.slice('--log-net-log='.length),'{"notRealNetLog":true}');}};
 const server={listen(_port,_host,cb){cb();},address:()=>({port:18080}),close(cb){cb();},closeAllConnections(){}};
 // Synthetic saved streams test the runner's gate, never claim Chromium data.
 const nativeDouble=async(_browser,{out})=>{
  const payload=Buffer.from(JSON.stringify({contractFixture:true,notChromiumTrace:true,traceEvents:[]}));
  const report={status:'recording',file:'contract-native-trace.json',metadataFile:'contract-native-meta.json',
   eventsFile:'contract-native-events.jsonl',wholeSequenceGuaranteed:false,dataLossOccurred:null,errors:[]};
  let finished=false;
  return {report,beginCleanup(){},observePage:async()=>({beforeClose(){}}),async finish(){
   if(nativeMode==='finish-rejects')throw new Error('contract native finish rejected');
   if(finished)return report;finished=true;
   report.dataLossOccurred=nativeMode==='loss'?true:nativeMode==='unknown-loss'?null:false;
   if(nativeMode==='error'||nativeMode==='unavailable'){
    report.status=nativeMode;report.dataLossOccurred=null;
    report.errors.push({stage:'contract-native',error:'contract native stream unavailable'});
   }else{
    report.status='saved';report.tracingComplete=nativeMode==='missing-stream'?{}:{stream:'contract-stream-not-browser'};
    report.bytes=payload.length+(nativeMode==='wrong-bytes'?1:0);
    report.sha256=nativeMode==='wrong-hash'?'0'.repeat(64):createHash('sha256').update(payload).digest('hex');
    if(nativeMode!=='missing-file')fs.writeFileSync(path.join(out,report.file),payload);
    if(nativeMode==='write-error')report.errors.push({stage:'event-write',error:'contract native event write failed'});
   }
   fs.writeFileSync(path.join(out,report.metadataFile),JSON.stringify(report));
   fs.writeFileSync(path.join(out,report.eventsFile),JSON.stringify({contractFixture:true,notChromiumTrace:true})+'\n');
   return report;
  }};
 };
 const sandboxRequire=id=>id==='playwright'?{chromium:{launch:async options=>{launches.push(options);return browser;}}}:id==='node:http'?{createServer:()=>server}:id==='node:child_process'?{execFileSync:()=> 'a'.repeat(40)}:id==='./helpers/p9-browser-diagnostics.cjs'?{observeBrowserDiagnostics(...args){const actual=observeBrowserDiagnostics(...args);return diagnosticThrows?{dump:async()=>{throw new Error('contract diagnostic writer unavailable');}}:actual;}}:id==='./helpers/p9-native-sw-trace.cjs'?{observeNativeSWTrace:nativeDouble}:id==='./helpers/p9-cdp-lifecycle-diagnostics.cjs'?{observeCDPLifecycle:async(_page,{file,label})=>({file,mark(kind,data){traceEvents.push({kind,label:label(),file,...data});},async finish(){if(traceFinishThrows)throw new Error('contract trace finish rejected');return {file,writeError:traceWriteError?'contract trace write error':null};}})}:require(id);
 try{
  await vm.runInNewContext(source,{require:sandboxRequire,__dirname:path.join(root,'tests'),process:proc,setTimeout,clearTimeout,console:{log:value=>logs.push(String(value)),error:value=>logs.push(String(value))}});
  const out=path.join(root,'verification/p9-offline-long-reload');
  const files=Object.fromEntries(fs.readdirSync(out).map(name=>[name,fs.readFileSync(path.join(out,name),'utf8')]));
  return {result:JSON.parse(files['results.json']),files,exitCode:proc.exitCode,reloads:contexts.map(c=>c.page.reloads),currentRaw:contexts.at(-1).page.raw,launches:launches.length,browserCloses,traceEvents,logs,reads};
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}


const summary=run=>{
 const summaries=run.logs.filter(x=>x.startsWith('P9_OFFLINE_LONG_RELOAD '));
 assert.equal(summaries.length,1,'one final outcome after cleanup');
 const final=JSON.parse(summaries[0].slice('P9_OFFLINE_LONG_RELOAD '.length));
 assert.equal(final.status,run.result.status);
 assert.equal(final.healthyReloadsCompleted,run.result.healthyReloadsCompleted);
 assert.equal(final.nativeCaptureSaved,run.result.nativeCaptureSaved);
 assert.equal(run.launches,1);assert.equal(run.browserCloses,1);
 assert.equal(run.result.mathematicalCoverageAdded,0);
 assert.equal(run.result.traceCoverage,'bounded-tail');
 assert.equal(run.result.wholeSequenceGuaranteed,false);
 return final;
};

test('healthy reloads pass only with a saved native stream whose bytes and hash agree',async()=>{
 const run=await probe();
 assert.equal(run.exitCode,0);assert.equal(run.result.status,'success');
 assert.deepEqual(run.reloads,[256,256]);assert.equal(run.result.checks.length,1027);
 assert.equal(run.result.healthyReloadsCompleted,true);assert.equal(run.result.nativeCaptureSaved,true);
 assert.equal(run.result.diagnosticOutcome,'saved');assert.equal(run.result.windowIntegrity,'no-loss-reported');
 assert.deepEqual(run.result.errors,[]);
 assert.equal(JSON.parse(run.files[run.result.nativeTrace.file]).notChromiumTrace,true);
 summary(run);
});

test('native failure, unavailable, missing or corrupt streams cannot turn healthy reloads into diagnostic success',async t=>{
 for(const nativeMode of ['error','unavailable','missing-stream','missing-file','wrong-bytes','wrong-hash','write-error','finish-rejects']){
  await t.test(nativeMode,async()=>{
   const run=await probe({nativeMode});
   assert.equal(run.exitCode,1);assert.equal(run.result.status,'failure');
   assert.deepEqual(run.reloads,[256,256]);assert.equal(run.result.healthyReloadsCompleted,true);
   assert.equal(run.result.diagnosticOutcome,'incomplete');
   assert.equal(run.result.nativeCaptureSaved,nativeMode==='write-error');
   assert.ok(run.result.errors.some(error=>error.stage.startsWith('native-trace')));
   assert.ok(run.traceEvents.some(event=>event.kind==='browser-close-complete'),'native export rejection does not skip browser cleanup');
   assert.equal(run.result.diagnosticStreams.length,2);
   summary(run);
  });
 }
});

test('saved rolling trace with loss stays partial, and unknown loss cannot pass',async()=>{
 const partial=await probe({nativeMode:'loss'});
 assert.deepEqual(partial.reloads,[256,256]);assert.equal(partial.result.healthyReloadsCompleted,true);
 assert.equal(partial.result.nativeCaptureSaved,true);assert.equal(partial.result.nativeTrace.dataLossOccurred,true);
 assert.equal(partial.result.windowIntegrity,'not-proven');assert.equal(partial.result.diagnosticOutcome,'partial');
 assert.equal(partial.result.status,'partial');assert.equal(partial.exitCode,1);assert.deepEqual(partial.result.errors,[]);
 summary(partial);
 const unknown=await probe({nativeMode:'unknown-loss'});
 assert.equal(unknown.result.nativeCaptureSaved,true);assert.equal(unknown.result.nativeTrace.dataLossOccurred,null);
 assert.equal(unknown.result.healthyReloadsCompleted,true);assert.equal(unknown.result.diagnosticOutcome,'incomplete');
 assert.equal(unknown.result.status,'failure');assert.equal(unknown.exitCode,1);
 assert.ok(unknown.result.errors.some(error=>error.stage==='native-trace-integrity'));
 summary(unknown);
});

test('original page failure remains primary when native export also fails, without a recovery reload',async()=>{
 for(const nativeMode of ['error','finish-rejects','loss']){
  const run=await probe({failureViewport:1,nativeMode});
  assert.equal(run.exitCode,1);assert.equal(run.result.status,'failure');assert.deepEqual(run.reloads,[3]);
  assert.equal(run.result.healthyReloadsCompleted,false);
  assert.match(run.result.errors[0].error,/contract readiness failure viewport 1 reload 3/);
  assert.equal(run.result.errors[0].stage,undefined);
  assert.equal(run.result.viewports[0].successfulReloads.length,2);
  assert.equal(run.files[run.result.viewports[0].failureStorage],run.currentRaw);
  const diagnostic=JSON.parse(run.files[run.result.failureDiagnostic]);
  assert.equal(diagnostic.error,run.result.errors[0].error);
  assert.equal(run.result.nativeTrace.dataLossOccurred,nativeMode==='loss'?true:null);
  summary(run);
 }
});

test('healthy reload completion survives browser or lifecycle writer failure without a success outcome',async()=>{
 for(const options of [{browserCloseFails:true},{traceWriteError:true},{traceFinishThrows:true}]){
  const run=await probe(options);
  assert.equal(run.exitCode,1);assert.equal(run.result.status,'failure');
  assert.equal(run.result.healthyReloadsCompleted,true);assert.equal(run.result.nativeCaptureSaved,true);
  assert.equal(run.result.diagnosticOutcome,'incomplete');assert.deepEqual(run.reloads,[256,256]);
  assert.equal(run.result.errors[0].stage,options.browserCloseFails?'browser-close':'diagnostic-stream');
  summary(run);
 }
});
