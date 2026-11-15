// Node-only lifecycle doubles. This executes the real shim, not Chromium or
// mathematical tasks; every synthetic stream is explicitly marked as a fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('./helpers/p9-fraction-native-playwright.cjs',import.meta.url),'utf8');
const runner=fs.readFileSync(new URL('./p9-fraction-order-adapter-browser.cjs',import.meta.url));

async function probe({nativeMode='saved',originalFailure=false,closeFails=false,verdictWriteFails=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'math-fraction-native-shim-'));
 const out=path.join(root,'verification/p9-fraction-order-adapter');
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(root,'tests/helpers'),{recursive:true});
 fs.writeFileSync(path.join(root,'tests/p9-fraction-order-adapter-browser.cjs'),runner);
 const calls=[],logs=[],processState={env:{},exitCode:0,hrtime:{bigint:()=>process.hrtime.bigint()}};
 const originalError=new Error('contract original correction-reset readiness failure');
 const closeError=new Error('contract original browser close failure');
 const launchOptions={headless:true,args:['original-flag','--log-net-log=original-path']};
 const contextOptions={viewport:{width:1280,height:720},reducedMotion:'reduce'};
 const gotoOptions={waitUntil:'load'},reloadOptions={waitUntil:'load'};
 const contextCloseOptions={reason:'original context close'},browserCloseOptions={reason:'original browser close'};
 const response={contractResponse:true},contextClosed={contractContextClosed:true},browserClosed={contractBrowserClosed:true};
 const page={
  setDefaultTimeout(value){assert.equal(this,page);calls.push(['timeout',value]);},
  async goto(...args){assert.equal(this,page);calls.push(['goto',...args]);if(originalFailure&&calls.filter(x=>x[0]==='goto').length===2)throw originalError;return response;},
  async reload(...args){assert.equal(this,page);calls.push(['reload',...args]);return response;}
 };
 const originalReload=page.reload;
 const context={async newPage(...args){assert.equal(this,context);calls.push(['newPage',...args]);return page;},
  async close(...args){assert.equal(this,context);calls.push(['contextClose',...args]);return contextClosed;}};
 const browser={async newContext(...args){assert.equal(this,browser);calls.push(['newContext',...args]);return context;},
  async close(...args){assert.equal(this,browser);calls.push(['browserClose',...args]);if(closeFails)throw closeError;return browserClosed;}};
 const chromium={async launch(...args){assert.equal(this,chromium);calls.push(['launch',...args]);return browser;},
  originalMethod(value){assert.equal(this,chromium);return value;}};
 const real={chromium,firefox:{contractUnwrapped:true},devices:{contractDevice:true}};
 const observeNativeSWTrace=async(actual,{out:where})=>{
  assert.equal(actual,browser);assert.equal(where,out);calls.push(['traceStart']);
  const report={status:'recording',file:'native-service-worker-trace.json',dataLossOccurred:null,errors:[],wholeSequenceGuaranteed:false};
  return {report,beginCleanup(){calls.push(['beginCleanup']);},async observePage(actualPage,{base}){
   assert.equal(actualPage,page);calls.push(['observePage',base]);
   return {beforeClose(){calls.push(['beforeClose']);}};
  },async finish(){
   calls.push(['nativeFinish']);
   if(nativeMode==='reject')throw Error('contract native export rejected');
   const data=Buffer.from(JSON.stringify({contractFixture:true,notChromiumTrace:true,traceEvents:[]}));
   fs.writeFileSync(path.join(out,report.file),data);report.status='saved';report.tracingComplete={stream:'contract-stream'};
   report.bytes=data.length;report.sha256=createHash('sha256').update(data).digest('hex');
   report.dataLossOccurred=nativeMode==='partial'?true:nativeMode==='unknown'?null:false;
   return report;
  }};
 };
 const shimFS=new Proxy(fs,{get(target,key){
  if(key==='writeFileSync')return(file,...args)=>{
   if(verdictWriteFails&&file.endsWith('/native-diagnostic-result.json'))throw Error('contract verdict disk write failed');
   return target.writeFileSync(file,...args);
  };
  return target[key];
 }});
 const module={exports:{}};
 const sandboxRequire=id=>id==='playwright'?real:id==='./p9-native-sw-trace.cjs'?{observeNativeSWTrace}:
  id==='node:fs'?shimFS:id==='node:child_process'?{execFileSync:()=> 'a'.repeat(40)}:require(id);
 try{
  vm.runInNewContext(source,{require:sandboxRequire,module,exports:module.exports,__dirname:path.join(root,'tests/helpers'),
   process:processState,URL,console:{log:value=>logs.push(value)}});
  const wrapped=module.exports;
  assert.equal(wrapped.firefox,real.firefox);assert.equal(wrapped.devices,real.devices);
  assert.equal(wrapped.chromium.originalMethod(response),response);
  assert.equal(await wrapped.chromium.launch(launchOptions),browser);
  assert.equal(await browser.newContext(contextOptions),context);
  assert.equal(await context.newPage(),page);
  page.setDefaultTimeout(20000);
  assert.equal(await page.goto('http://127.0.0.1:18080/v2.html#trail',gotoOptions),response);
  assert.equal(page.reload,originalReload);
  assert.equal(await page.reload(reloadOptions),response);
  let caughtPageError;
  try{assert.equal(await page.goto('http://127.0.0.1:18080/learn.html#fractionbench'),response);}
  catch(error){caughtPageError=error;}
  assert.equal(caughtPageError,originalFailure?originalError:undefined);
  const original=JSON.stringify({contractFixture:true,notChromiumEvidence:true,checks:[],observations:[],correctionObservations:[],
   ...(originalFailure?{error:String(originalError),at:'1280x720-correction-reset'}:{})});
  fs.writeFileSync(path.join(out,'results.json'),original);
  fs.writeFileSync(path.join(out,'browser-netlog.json'),'contract existing NetLog placeholder');
  fs.writeFileSync(path.join(out,'1280x720-cdp-lifecycle.jsonl'),'contract existing CDP placeholder');
  if(originalFailure)processState.exitCode=1;
  else assert.equal(await context.close(contextCloseOptions),contextClosed);
  let caughtCloseError;
  try{assert.equal(await browser.close(browserCloseOptions),browserClosed);}catch(error){caughtCloseError=error;}
  assert.equal(caughtCloseError,closeFails?closeError:undefined,'diagnostics must preserve the exact original browser.close exception');
  assert.equal(fs.readFileSync(path.join(out,'results.json'),'utf8'),original);
  assert.equal(fs.readFileSync(path.join(out,'browser-netlog.json'),'utf8'),'contract existing NetLog placeholder');
  assert.equal(fs.readFileSync(path.join(out,'1280x720-cdp-lifecycle.jsonl'),'utf8'),'contract existing CDP placeholder');
  assert.deepEqual(calls.filter(x=>x[0]==='launch'),[['launch',launchOptions]]);
  assert.deepEqual(calls.filter(x=>x[0]==='newContext'),[['newContext',contextOptions]]);
  assert.deepEqual(calls.filter(x=>x[0]==='newPage'),[['newPage']]);
  assert.deepEqual(calls.filter(x=>x[0]==='timeout'),[['timeout',20000]]);
  assert.deepEqual(calls.filter(x=>x[0]==='goto'),[['goto','http://127.0.0.1:18080/v2.html#trail',gotoOptions],['goto','http://127.0.0.1:18080/learn.html#fractionbench']]);
  assert.deepEqual(calls.filter(x=>x[0]==='reload'),[['reload',reloadOptions]]);
  assert.deepEqual(calls.filter(x=>x[0]==='observePage'),[['observePage','http://127.0.0.1:18080/']]);
  assert.equal(calls.filter(x=>x[0]==='beforeClose').length,1);
  assert.ok(calls.findIndex(x=>x[0]==='observePage')<calls.findIndex(x=>x[0]==='goto'));
  assert.ok(calls.findIndex(x=>x[0]==='nativeFinish')<calls.findIndex(x=>x[0]==='browserClose'));
  assert.deepEqual(calls.filter(x=>x[0]==='browserClose'),[['browserClose',browserCloseOptions]]);
  if(!originalFailure){assert.ok(calls.findIndex(x=>x[0]==='beforeClose')<calls.findIndex(x=>x[0]==='contextClose'));assert.deepEqual(calls.filter(x=>x[0]==='contextClose'),[['contextClose',contextCloseOptions]]);}
  assert.equal(logs.length,1);
  const summary=JSON.parse(logs[0].slice('P9_FRACTION_NATIVE_DIAGNOSTIC '.length));
  const verdict=fs.existsSync(path.join(out,'native-diagnostic-result.json'))?JSON.parse(fs.readFileSync(path.join(out,'native-diagnostic-result.json'),'utf8')):null;
  const lifecycle=fs.readFileSync(path.join(out,'native-shim-lifecycle.jsonl'),'utf8').trim().split('\n').map(line=>JSON.parse(line));
  assert.deepEqual(lifecycle.map(event=>event.kind),['native-finish-await-start',nativeMode==='reject'?'native-finish-await-failed':'native-finish-await-complete',
   'actual-browser-close-start',closeFails?'actual-browser-close-failed':'actual-browser-close-complete']);
  for(let i=0;i<lifecycle.length;i++){
   assert.equal(Number.isNaN(Date.parse(lifecycle[i].at)),false);
   if(i)assert.ok(BigInt(lifecycle[i].nodeMonotonicNs)>=BigInt(lifecycle[i-1].nodeMonotonicNs));
  }
  if(verdict){assert.deepEqual(verdict.lifecycle,lifecycle);assert.deepEqual(verdict.browserClose.started,lifecycle[2]);assert.deepEqual(verdict.browserClose.finished,lifecycle[3]);}
  return {exitCode:processState.exitCode,summary,verdict,calls};
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}

test('shim preserves real objects, this, arguments, return values and the original navigation count',async()=>{
 const run=await probe();
 assert.equal(run.exitCode,0);assert.equal(run.summary.status,'success');
 assert.equal(run.verdict.nativeCaptureSaved,true);assert.equal(run.verdict.windowIntegrity,'no-loss-reported');
 assert.equal(run.verdict.wholeSequenceGuaranteed,false);assert.equal(run.verdict.traceCoverage,'bounded-tail');
 assert.equal(run.verdict.originalRunner.status,'reported-success');assert.deepEqual(run.verdict.errors,[]);
});

test('saved lossy/unknown capture and a rejected export never claim native success',async()=>{
 for(const nativeMode of ['partial','unknown','reject']){
  const run=await probe({nativeMode});
  assert.equal(run.exitCode,1);assert.equal(run.summary.status,nativeMode==='partial'?'partial':'failure');
  assert.equal(run.verdict.diagnosticOutcome,nativeMode==='partial'?'partial':'incomplete');
  assert.equal(run.verdict.originalRunner.status,'reported-success');
  assert.equal(run.verdict.browserClose.completed,true);
 }
});

test('original page/close errors survive native export and verdict-write failures',async()=>{
 const run=await probe({originalFailure:true,closeFails:true,nativeMode:'reject',verdictWriteFails:true});
 assert.equal(run.exitCode,1);assert.equal(run.verdict,null);assert.equal(run.summary.verdictSaved,false);
 assert.equal(run.summary.status,'failure');assert.equal(run.summary.originalRunnerStatus,'failure');
 assert.match(run.summary.originalError,/original correction-reset readiness failure/);
 assert.equal(run.summary.browserCloseCompleted,false);
 assert.ok(run.summary.errors.some(error=>error.stage==='native-finish'));
 assert.ok(run.summary.errors.some(error=>error.stage==='verdict-write'));
});
