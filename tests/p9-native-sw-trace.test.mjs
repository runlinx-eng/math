import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';

// These are Node protocol doubles, not Chromium runs or evidence that a native
// trace covers a failed page. Virtual deadlines assert the original 10,000ms
// request and expire after 20ms only to exercise reporting without a long wait.
const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('./helpers/p9-native-sw-trace.cjs',import.meta.url),'utf8');
const base='http://127.0.0.1:18080/';
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.parse(JSON.stringify(value));
async function fixture(t,options={}){
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'math-native-trace-contract-'));
 t.after(()=>fs.rmSync(out,{recursive:true,force:true}));
 const cdp=new EventEmitter(),pageCDP=new EventEmitter(),calls=[],mod={exports:{}};
 const payload=Buffer.from(JSON.stringify({traceEvents:[{cat:'ServiceWorker',name:'Node 合约，非 Chromium'}]}));
 const split=payload.indexOf(Buffer.from('合'));
 const chunks=[payload.subarray(0,split),payload.subarray(split)];
 let reads=0,pageSessions=0,endResolve;
 const nativeFs={...fs,writeSync:(fd,data,offset,length)=>{
  if(options.writeFails)throw Error('contract file write failed');
  return fs.writeSync(fd,data,offset,Math.min(length,7));
 },closeSync:fd=>{
  fs.closeSync(fd);if(options.fileCloseFails)throw Error('contract file close failed');
 }};
 vm.runInNewContext(source,{module:mod,exports:mod.exports,Buffer,process,
  require:name=>name==='node:fs'?nativeFs:require(name),
  setTimeout:(callback,ms)=>{assert.equal(ms,10000);return setTimeout(callback,20);},clearTimeout,
 },{filename:'actual-native-trace-helper.cjs'});
 const completed={dataLossOccurred:false,stream:'contract-stream',traceFormat:'json',streamCompression:'none',...options.completed};
 const complete=()=>cdp.emit('Tracing.tracingComplete',completed);
 cdp.send=(method,params)=>{
  calls.push({method,params});
  if(method==='Tracing.start')return options.startFails?Promise.reject(Error('contract start failed')):Promise.resolve({});
  if(method==='Tracing.end'){
   if(options.endMode==='early-complete-no-ack'){complete();return new Promise(()=>{});}
   if(options.endMode==='no-ack')return new Promise(resolve=>{endResolve=resolve;});
   if(options.endMode==='manual')return new Promise(resolve=>{endResolve=resolve;});
   if(options.endMode!=='no-complete')queueMicrotask(complete);
   return Promise.resolve({});
  }
  if(method==='IO.read'){
   assert.deepEqual(json(params),{handle:'contract-stream',size:1048576});
   if(options.readFails)return Promise.reject(Error('contract IO read failed'));
   const index=reads++,bytes=chunks[index];
   return Promise.resolve({data:bytes.toString(index?'base64':'utf8'),base64Encoded:index===1,eof:index===1});
  }
  if(method==='IO.close')return options.streamCloseFails?Promise.reject(Error('contract IO close failed')):Promise.resolve({});
  return Promise.reject(Error('unexpected native command '+method));
 };
 pageCDP.send=async(method,params)=>{
  calls.push({method,params});assert.ok(['Network.enable','Page.enable'].includes(method));return {};
 };
 const browser={newBrowserCDPSession:async()=>cdp};
 const page={context:()=>({newCDPSession:async target=>{assert.equal(target,page);pageSessions++;return pageCDP;}})};
 const trace=await mod.exports.observeNativeSWTrace(browser,{out,label:()=> 'Node-contract'});
 const observer=await trace.observePage(page,{base});
 const request=({id,type='Script',loader='new',frame='main',url=base+'learning/model.js'})=>pageCDP.emit('Network.requestWillBeSent',{
  requestId:id,loaderId:loader,frameId:frame,type,request:{url},timestamp:1.25,wallTime:2.5,
 });
 const fail=id=>pageCDP.emit('Network.loadingFailed',{requestId:id,timestamp:3.75,type:'Script',errorText:'net::ERR_ABORTED',canceled:true});
 const metadata=()=>JSON.parse(fs.readFileSync(path.join(out,trace.report.metadataFile)));
 const events=()=>fs.readFileSync(path.join(out,trace.report.eventsFile),'utf8').trim().split('\n').map(JSON.parse);
 return {out,trace,observer,cdp,pageCDP,calls,payload,request,fail,complete,metadata,events,
  ack:()=>endResolve({}),pageSessions:()=>pageSessions};
}

test('M141 tail-window config and first current main-loader failure preserve real byte stream',async t=>{
 const f=await fixture(t),start=json(f.calls.find(x=>x.method==='Tracing.start').params);
 assert.deepEqual(start,{transferMode:'ReturnAsStream',streamFormat:'json',streamCompression:'none',bufferUsageReportingInterval:1000,
  traceConfig:{recordMode:'recordContinuously',traceBufferSizeInKb:16384,includedCategories:['ServiceWorker'],excludedCategories:['*'],
   enableSampling:false,enableSystrace:false,enableArgumentFilter:false}});
 f.pageCDP.emit('Page.frameNavigated',{frame:{id:'main',loaderId:'old'}});
 f.request({id:'old',loader:'old'});f.request({id:'document',type:'Document',url:base+'learn.html'});f.fail('old');
 for(const request of [{id:'child',frame:'child'},{id:'css',type:'Stylesheet'},{id:'foreign',url:'https://foreign.invalid/a.js'}]){f.request(request);f.fail(request.id);}
 f.fail('untracked');assert.equal(f.calls.filter(x=>x.method==='Tracing.end').length,0);
 f.request({id:'first'});f.pageCDP.emit('Network.responseReceived',{requestId:'first',response:{status:200,mimeType:'text/javascript',fromServiceWorker:true}});
 f.fail('first');
 assert.equal(f.calls.filter(x=>x.method==='Tracing.end').length,1,'end is sent inside the first eligible failure callback');
 f.request({id:'second'});f.fail('second');
 const report=await f.trace.finish({kind:'later-cleanup'});
 assert.equal(f.calls.filter(x=>x.method==='Tracing.end').length,1);
 assert.equal(report.stopReason.request.requestId,'first');assert.equal(report.stopReason.targetLoader,'new');
 assert.equal(report.stopReason.mainFrameId,'main');assert.equal(report.stopReason.request.timestamp,1.25);
 assert.equal(report.stopReason.request.wallTime,2.5);assert.equal(report.stopReason.event.timestamp,3.75);
 assert.equal(report.stopReason.request.response.fromServiceWorker,true);
 assert.equal(report.status,'saved');assert.equal(report.dataLossOccurred,false);assert.equal(report.wholeSequenceGuaranteed,false);
 assert.deepEqual(fs.readFileSync(path.join(f.out,report.file)),f.payload);
 assert.equal(report.bytes,f.payload.length);assert.equal(report.sha256,digest(f.payload));
 assert.deepEqual(f.metadata(),json(report));
 const events=f.events();assert.equal(events.filter(x=>x.kind==='native-trace-complete').length,1);
 for(let i=1;i<events.length;i++)assert.ok(BigInt(events[i].nodeMonotonicNs)>=BigInt(events[i-1].nodeMonotonicNs));
 assert.ok(f.calls.every(x=>['Tracing.start','Tracing.end','IO.read','IO.close','Network.enable','Page.enable'].includes(x.method)));
});

for(const cleanup of ['beforeClose','beginCleanup'])test(`${cleanup} excludes cleanup aborts from the first-failure trigger`,async t=>{
 const f=await fixture(t);f.request({id:'document',type:'Document',url:base+'learn.html'});
 if(cleanup==='beforeClose')f.observer.beforeClose();else f.trace.beginCleanup();
 f.request({id:'closing'});f.fail('closing');assert.equal(f.calls.filter(x=>x.method==='Tracing.end').length,0);
 const report=await f.trace.finish({kind:'healthy-sequence-complete'});assert.equal(report.status,'saved');
 assert.equal(report.stopReason.kind,'healthy-sequence-complete');
});

test('a complete event received before end ack is persisted immediately',async t=>{
 const f=await fixture(t,{endMode:'manual'}),pending=f.trace.finish({kind:'contract-stop'});
 f.complete();const early=f.metadata();
 assert.equal(early.status,'stopping');assert.equal(early.tracingComplete.stream,'contract-stream');
 assert.equal(early.dataLossOccurred,false);assert.ok(early.tracingCompleteReceived);assert.equal(early.endAcknowledged,undefined);
 f.ack();const report=await pending;assert.equal(report.status,'saved');assert.ok(f.metadata().endAcknowledged);
});

for(const [mode,stage] of [['no-ack','trace-end-ack'],['no-complete','trace-complete-wait']])test(`${stage} timeout stays distinct and late facts do not change failure`,async t=>{
 const f=await fixture(t,{endMode:mode}),report=await f.trace.finish({kind:'contract-stop'});
 assert.equal(report.status,'error');assert.equal(report.errors[0].stage,stage);assert.match(report.errors[0].error,new RegExp(stage+' exceeded 10000ms'));
 if(mode==='no-ack')f.ack();f.complete();await Promise.resolve();await Promise.resolve();
 const persisted=f.metadata();assert.equal(persisted.status,'error');assert.equal(persisted.dataLossOccurred,false);
 assert.ok(persisted.tracingCompleteReceived);assert.ok(persisted.endAcknowledged);
 assert.equal(f.calls.filter(x=>x.method==='IO.read').length,0);assert.equal(report.sha256,undefined);
 assert.equal(f.events().filter(x=>x.kind==='native-trace-complete').length,1);
 assert.equal(f.events().filter(x=>x.kind==='native-trace-saved').length,0);
});

test('completion remains recorded if the end response times out; known stream is closed once',async t=>{
 const f=await fixture(t,{endMode:'early-complete-no-ack'}),report=await f.trace.finish({kind:'contract-stop'});
 assert.equal(report.status,'error');assert.equal(report.errors[0].stage,'trace-end-ack');
 assert.equal(f.metadata().tracingComplete.stream,'contract-stream');assert.equal(f.metadata().dataLossOccurred,false);
 assert.equal(f.calls.filter(x=>x.method==='IO.read').length,0);assert.equal(f.calls.filter(x=>x.method==='IO.close').length,1);
});

test('ring overwrite dataLoss remains true even when the stream is saved',async t=>{
 const f=await fixture(t,{completed:{dataLossOccurred:true}}),report=await f.trace.finish({kind:'healthy-sequence-complete'});
 assert.equal(report.status,'saved');assert.equal(report.dataLossOccurred,true);assert.equal(report.wholeSequenceGuaranteed,false);
 assert.equal(f.metadata().tracingComplete.dataLossOccurred,true);
});

for(const completed of [{stream:undefined},{dataLossOccurred:undefined},{traceFormat:'proto'},{streamCompression:'gzip'}])test(`incomplete or unsupported stream is not saved: ${Object.keys(completed)[0]}`,async t=>{
 const f=await fixture(t,{completed}),report=await f.trace.finish({kind:'contract-stop'});
 assert.equal(report.status,'error');assert.equal(report.errors[0].stage,'trace-stream-validation');
 assert.equal(report.sha256,undefined);assert.equal(f.calls.filter(x=>x.method==='IO.read').length,0);
 if(Object.hasOwn(completed,'dataLossOccurred'))assert.equal(report.dataLossOccurred,null);
});

test('IO read and close failures retain separate stages and the original failure first',async t=>{
 const f=await fixture(t,{readFails:true,streamCloseFails:true}),report=await f.trace.finish({kind:'contract-stop'});
 assert.equal(report.status,'error');assert.deepEqual(Array.from(report.errors,x=>x.stage),['trace-stream-read','trace-stream-close']);
 assert.equal(f.calls.filter(x=>x.method==='IO.close').length,1);assert.equal(report.sha256,undefined);
});

test('file write and file close failures retain separate stages',async t=>{
 const f=await fixture(t,{writeFails:true,fileCloseFails:true}),report=await f.trace.finish({kind:'contract-stop'});
 assert.equal(report.status,'error');assert.deepEqual(Array.from(report.errors,x=>x.stage),['trace-file-write','trace-file-close']);
 assert.equal(f.calls.filter(x=>x.method==='IO.close').length,1);assert.equal(report.sha256,undefined);
});

test('start unavailable never becomes a successful capture or worker attachment',async t=>{
 const f=await fixture(t,{startFails:true}),report=await f.trace.finish({kind:'cleanup'});
 assert.equal(report.status,'unavailable');assert.equal(report.dataLossOccurred,null);assert.equal(f.pageSessions(),0);
 assert.equal(report.errors[0].stage,'trace-start');assert.equal(f.calls.filter(x=>x.method==='Tracing.end').length,0);
});
