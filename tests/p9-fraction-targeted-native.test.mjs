// Node lifecycle doubles, never Chromium or mathematical acceptance evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('./helpers/p9-fraction-targeted-native-playwright.cjs',import.meta.url),'utf8');
const runner=fs.readFileSync(new URL('./p9-fraction-order-adapter-browser.cjs',import.meta.url));

async function probe(t,{nativeMode='saved',readinessFails=false,earlyFailure=false,closeFails=false,skipTarget=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'math-targeted-native-contract-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const out=path.join(root,'verification/p9-fraction-order-adapter');
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(root,'tests/helpers'),{recursive:true});
 fs.writeFileSync(path.join(root,'tests/p9-fraction-order-adapter-browser.cjs'),runner);
 const calls=[],logs=[],pages=[],contexts=[];
 const processState={env:{},exitCode:0,hrtime:{bigint:()=>process.hrtime.bigint()}};
 const originalError=new Error('contract exact original 20s readiness error'),closeError=new Error('contract exact close error');
 const response={originalResponse:true},handle={originalJSHandle:true},closeResult={originalClose:true};
 const expectedNavigation=[],expectedWaits=[],expectedContexts=[];
 let report,finishPromise;
 const browser={async newContext(options){
  assert.equal(this,browser);calls.push(['newContext',options]);
  const context={async newPage(){
   assert.equal(this,context);
   const page={id:pages.length,async goto(...args){assert.equal(this,page);calls.push(['goto',page.id,...args]);return response;},
    async reload(...args){assert.equal(this,page);calls.push(['reload',page.id,...args]);return response;},
    async waitForFunction(...args){assert.equal(this,page);calls.push(['wait',page.id,...args]);
     if(readinessFails&&page.id===1&&calls.filter(c=>c[0]==='reload'&&c[1]===1).length===90)throw originalError;
     return handle;},setDefaultTimeout(value){assert.equal(this,page);calls.push(['timeout',page.id,value]);}};
   pages.push(page);return page;
  },async close(...args){assert.equal(this,context);calls.push(['contextClose',contexts.indexOf(context),...args]);return closeResult;}};
  contexts.push(context);return context;
 },async close(...args){assert.equal(this,browser);calls.push(['browserClose',...args]);if(closeFails)throw closeError;return closeResult;}};
 const chromium={async launch(...args){assert.equal(this,chromium);calls.push(['launch',...args]);return browser;}};
 const observeNativeSWTrace=async(actual)=>{
  assert.equal(actual,browser);calls.push(['nativeStart',pages.length]);
  report={status:'recording',file:'native-service-worker-trace.json',errors:[],dataLossOccurred:null,capacityExceeded:false};
  return {report,beginCleanup(){calls.push(['beginCleanup']);},async observePage(page,{base}){
   calls.push(['observePage',page.id,base]);return {beforeClose(){calls.push(['beforeClose',page.id]);}};
  },finish(reason){
   if(finishPromise)return finishPromise;
   calls.push(['nativeFinish',reason]);
   finishPromise=(async()=>{
    if(nativeMode==='reject')throw Error('contract native export rejected');
    const buffers=[{bytes_overwritten:nativeMode==='overwritten'?4096:0,chunks_overwritten:0,chunks_discarded:0,
     sequence_packet_loss:0,trace_writer_packet_loss:0}];
    const trace={fixture:'Node only, not Chromium',traceEvents:[],metadata:{trace_processor_stats:{traced_buf:buffers,tokenizer_skipped_packets:0}}};
    if(nativeMode==='missing-stats')delete trace.metadata;
    const bytes=Buffer.from(JSON.stringify(trace));fs.writeFileSync(path.join(out,report.file),bytes);
    report.status='saved';report.bytes=bytes.length;report.sha256=createHash('sha256').update(bytes).digest('hex');
    report.dataLossOccurred=nativeMode==='partial';report.capacityExceeded=nativeMode==='capacity';report.stopReason=reason;
    return report;
   })();return finishPromise;
  }};
 };
 const mod={exports:{}};
 vm.runInNewContext(source,{module:mod,exports:mod.exports,__dirname:path.join(root,'tests/helpers'),URL,
  process:processState,console:{log:x=>logs.push(x)},require:id=>id==='playwright'?{chromium}:
   id==='./p9-native-sw-trace.cjs'?{observeNativeSWTrace}:id==='node:child_process'?{execFileSync:()=> 'a'.repeat(40)}:require(id)});
 const launchOptions={headless:true,args:['unchanged-original']};
 assert.equal(await mod.exports.chromium.launch(launchOptions),browser);
 assert.equal(calls.some(c=>c[0]==='nativeStart'),false,'no trace starts at launch or during earlier scenarios');
 let caughtOriginal;
 const waitFn=()=>true,spec={id:'fractionbench',index:0},navigationOptions={waitUntil:'load'},waitOptions={timeout:20000};
 for(const width of [1440,skipTarget?1290:1280]){
  if(caughtOriginal)break;
  const options={viewport:{width,height:width===1440?900:720},reducedMotion:'reduce'};expectedContexts.push(options);
  const context=await browser.newContext(options),page=await context.newPage();
  page.setDefaultTimeout(20000);
  const goto=async url=>{expectedNavigation.push(['goto',page.id,url,navigationOptions]);assert.equal(await page.goto(url,navigationOptions),response);};
  const reload=async()=>{expectedNavigation.push(['reload',page.id,navigationOptions]);assert.equal(await page.reload(navigationOptions),response);};
  const wait=async()=>{expectedWaits.push(['wait',page.id,waitFn,spec,waitOptions]);assert.equal(await page.waitForFunction(waitFn,spec,waitOptions),handle);};
  await goto('http://127.0.0.1:18080/v2.html#trail');
  for(let i=1;i<=94;i++){
   if(i===89)await goto('http://127.0.0.1:18080/learn.html#fractionbench');
   await reload();
   try{await wait();}catch(error){caughtOriginal=error;break;}
   if(earlyFailure&&page.id===0&&i===1){caughtOriginal=originalError;break;}
  }
  if(!caughtOriginal)assert.equal(await context.close({reason:'original'}),closeResult);
 }
 if(caughtOriginal)processState.exitCode=1;
 const original=JSON.stringify({fixture:'Node only, not real mathematical evidence',checks:[],observations:[],correctionObservations:[],
  ...(caughtOriginal?{error:String(caughtOriginal),at:'1280x720-correction-reset'}:{})});
 fs.writeFileSync(path.join(out,'results.json'),original);
 let caughtClose;
 try{assert.equal(await browser.close({reason:'original'}),closeResult);}catch(error){caughtClose=error;}
 assert.equal(caughtOriginal,(readinessFails||earlyFailure)?originalError:undefined);
 assert.equal(caughtClose,closeFails?closeError:undefined);
 assert.equal(fs.readFileSync(path.join(out,'results.json'),'utf8'),original);
 assert.deepEqual(calls.filter(c=>['goto','reload'].includes(c[0])),expectedNavigation,'no navigation inserted, removed, reordered or changed');
 assert.deepEqual(calls.filter(c=>c[0]==='wait'),expectedWaits,'all original functions, arguments and 20s timeouts preserved');
 assert.deepEqual(calls.filter(c=>c[0]==='newContext').map(c=>c[1]),expectedContexts);
 const verdict=JSON.parse(fs.readFileSync(path.join(out,'targeted-native-result.json'),'utf8'));
 return {calls,verdict,exitCode:processState.exitCode,report,expectedNavigation};
}

test('selected reset alone is traced; all 188 original reloads and waits survive unchanged',async t=>{
 const {calls,verdict,exitCode}=await probe(t);
 const started=calls.findIndex(c=>c[0]==='nativeStart'),ended=calls.findIndex(c=>c[0]==='nativeFinish');
 assert.equal(calls.filter(c=>c[0]==='nativeStart').length,1);
 assert.equal(calls.slice(0,started).filter(c=>c[0]==='reload'&&c[1]===0).length,94);
 assert.equal(calls.slice(0,started).filter(c=>c[0]==='reload'&&c[1]===1).length,88);
 assert.equal(calls[started+1][0],'observePage');assert.equal(calls[started+2][0],'goto');
 assert.equal(calls.slice(started,ended).filter(c=>c[0]==='reload').length,2);
 assert.equal(calls.slice(ended).filter(c=>c[0]==='reload').length,4);
 assert.equal(calls[ended-1][0],'wait');
 assert.equal(calls.filter(c=>c[0]==='reload').length,188);
 assert.equal(verdict.window.target.secondReload,90);assert.equal(verdict.window.status,'completed');
 assert.equal(verdict.status,'success');assert.equal(verdict.diagnosticOutcome,'saved');assert.equal(exitCode,0);
 assert.equal(verdict.countsTowardAcceptance,false);assert.equal(verdict.rootCauseEstablished,false);
 assert.equal(verdict.wholeSequenceGuaranteed,false);assert.equal(verdict.nativeIntegrity.noBufferLoss,true);
});

for(const nativeMode of ['partial','capacity','overwritten','missing-stats','reject'])
 test(`${nativeMode} cannot masquerade as an intact selected native window`,async t=>{
  const {verdict,exitCode}=await probe(t,{nativeMode});
  assert.equal(exitCode,1);assert.notEqual(verdict.status,'success');assert.notEqual(verdict.diagnosticOutcome,'saved');
  assert.equal(verdict.originalRunner.status,'reported-success');assert.equal(verdict.browserClose.completed,true);
 });

test('the exact original readiness error and close error survive native export failure',async t=>{
 const {verdict,exitCode}=await probe(t,{readinessFails:true,closeFails:true,nativeMode:'reject'});
 assert.equal(exitCode,1);assert.equal(verdict.status,'failure');assert.equal(verdict.window.status,'readiness-failed');
 assert.equal(verdict.originalRunner.status,'failure');assert.equal(verdict.browserClose.completed,false);
 assert.ok(verdict.errors.some(e=>e.stage==='native-finish'));
});

for(const options of [{earlyFailure:true},{skipTarget:true}])test('an unreached target is incomplete and never starts a substitute trace',async t=>{
 const {verdict,calls,exitCode}=await probe(t,options);
 assert.equal(exitCode,1);assert.equal(verdict.status,'failure');assert.equal(verdict.window.status,'not-reached');
 assert.equal(calls.filter(c=>c[0]==='nativeStart').length,0);
 assert.equal(verdict.nativeCaptureSaved,false);
});
