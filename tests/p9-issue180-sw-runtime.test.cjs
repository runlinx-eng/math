'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {createPassiveServiceWorkerObserver}=require('./helpers/p9-issue180-sw-runtime.cjs');

class FakeServiceWorker extends EventEmitter{
 constructor(url='http://localhost/sw.js'){super();this.href=url;this.evaluations=0;}
 url(){return this.href;}
 async evaluate(fn){
  this.evaluations++;
  if(fn.name==='installInsideWorker')return {installed:true,scriptURL:this.href,installedAt:'2026-11-15T00:00:00Z'};
  if(fn.name==='readInsideWorker')return {installed:true,scriptURL:this.href,
   eventCount:1,events:[{seq:1,kind:'unhandledrejection',reason:'passive-contract'}]};
  throw Error('Unknown diagnostic evaluation');
 }
}
class FakeContext extends EventEmitter{
 constructor(workers){super();this.workers=workers;}
 serviceWorkers(){return this.workers;}
}
test('passive SW observer captures errors and worker-owned requests without modifying requests',async()=>{
 const worker=new FakeServiceWorker(),context=new FakeContext([worker]),events=[];
 const observer=createPassiveServiceWorkerObserver({context,note:(kind,data)=>events.push({kind,...data})});
 await observer.start();
 assert.equal(worker.evaluations,1);
 const request={url:()=> 'http://localhost/dependency.js',resourceType:()=> 'script',
  serviceWorker:()=>worker,failure:()=>({errorText:'net::ERR_FAILED'})};
 context.emit('request',request);
 context.emit('requestfailed',request);
 context.emit('response',{request:()=>request,url:request.url,status:()=>503});
 const first=await observer.snapshot();
 assert.equal(first.liveWorkerCount,1);
 assert.equal(first.workers[0].installed,true);
 assert.equal(first.workers[0].eventCount,1);
 await observer.snapshot();
 assert.equal(events.filter(x=>x.kind==='serviceWorkerRuntimeError').length,1,'events deduplicated by worker sequence');
 assert.equal(events.filter(x=>x.kind==='serviceWorkerOwnedRequest').length,1);
 assert.equal(events.filter(x=>x.kind==='serviceWorkerOwnedRequestFailed').length,1);
 assert.equal(events.filter(x=>x.kind==='serviceWorkerOwnedResponse').length,1);
 observer.close();
 assert.equal(context.listenerCount('request'),0);
 assert.equal(context.listenerCount('serviceworker'),0);
 assert.equal(worker.listenerCount('close'),0);
});
test('observer reports worker snapshot failure as missing visibility rather than falsely claiming success',async()=>{
 const worker=new FakeServiceWorker();
 worker.evaluate=async()=>{throw Error('worker-unavailable');};
 const context=new FakeContext([worker]),events=[];
 const observer=createPassiveServiceWorkerObserver({context,note:(kind,data)=>events.push({kind,...data})});
 await observer.start();
 const state=await observer.snapshot();
 assert.equal(state.workers[0].unavailable,true);
 assert.match(state.workers[0].error,/worker-unavailable/);
 assert.equal(events.some(x=>x.kind==='serviceWorkerRuntimeAttachFailed'),true);
 observer.close();
});