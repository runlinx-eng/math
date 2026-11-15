// An isolated, fail-fast reproduction experiment for Issue #180.
// The original Required commands and their reload counts stay unchanged.
// No solved work is seeded; this does not add mathematical evidence coverage.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const {observeCDPLifecycle}=require('./helpers/p9-cdp-lifecycle-diagnostics.cjs');
const {observeNativeSWTrace}=require('./helpers/p9-native-sw-trace.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-offline-long-reload');
const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const testedCheckoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const headSha=event.pull_request?.head?.sha||testedCheckoutSha;
const reloadsPerViewport=256,spec={id:'fractionbench',index:0};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const checks=[],viewports=[],errors=[],cdpDiagnostics=[],networkLog='browser-netlog.json';
const ok=(condition,message)=>{assert.ok(condition,message);checks.push(message);};
const mathematicalRecord=raw=>{
 const lesson=JSON.parse(raw).lessons[spec.id];
 // Readiness may update timestamps; it must not invent operations or attempts.
 return {models:lesson.models,cases:lesson.cases,notes:lesson.notes,draft:lesson.draft};
};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 let browser,server,context,page,diagnostics,cdp,nativeTrace,nativePage,active,label='setup',failureDiagnostic=null,status='running';
 let healthyReloadsCompleted=false,nativeCaptureSaved=false,diagnosticOutcome='pending',windowIntegrity='unknown';
 const diagnosticStreams=[],nativeFinishErrors=[];
 const finishNative=async reason=>{
  try{if(nativeTrace)await nativeTrace.finish(reason);}
  catch(error){nativeFinishErrors.push({label,stage:'native-trace-finish',error:String(error)});}
 };
 const persist=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  headSha,testedCheckoutSha,release,browserVersion:browser?.version(),reloadsPerViewport,spec,
  experiment:'long healthy reload sequence; stop on first failure; no recovery retries',
  mathematicalCoverageAdded:0,status,healthyReloadsCompleted,nativeCaptureSaved,diagnosticOutcome,
  traceCoverage:'bounded-tail',wholeSequenceGuaranteed:false,windowIntegrity,
  checks,viewports,errors,networkLog,failureDiagnostic,diagnosticStreams,nativeTrace:nativeTrace?.report
 },null,2));
 try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',
   '--log-net-log='+path.join(out,networkLog)],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  nativeTrace=await observeNativeSWTrace(browser,{out,label:()=>label,note:(kind,data)=>cdp?.mark(kind,data)});
  for(const [width,height] of [[1440,900],[1280,720]]){
   label=`${width}x${height}-setup`;
   active={width,height,status:'running',attempt:0,successfulReloads:[],pageErrors:[],consoleErrors:[],failedRequests:[]};
   const viewportResult=active;let pageLabel=label;
   viewports.push(active);persist();
   server=http.createServer((request,response)=>{
    const relative=new URL(request.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',relative),(error,data)=>{
     response.writeHead(error?404:200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-store'});
     response.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   page=await context.newPage();page.setDefaultTimeout(20000);
   diagnostics=observeBrowserDiagnostics(page,{out,base,label:()=>pageLabel});
   cdp=await observeCDPLifecycle(page,{out,base,label:()=>pageLabel,file:`${width}x${height}-cdp-lifecycle.jsonl`});
   cdpDiagnostics.push(cdp);active.cdpLog=cdp.file;
   nativePage=await nativeTrace.observePage(page,{base});
   page.on('pageerror',error=>viewportResult.pageErrors.push(String(error)));
   page.on('console',message=>{if(message.type()==='error')viewportResult.consoleErrors.push(message.text());});
   page.on('requestfailed',request=>viewportResult.failedRequests.push({url:request.url(),error:request.failure()?.errorText||null}));
   await page.goto(base+'v2.html#trail');
   await page.waitForFunction(release=>navigator.serviceWorker.controller?.state==='activated'&&
    new URL(navigator.serviceWorker.controller.scriptURL).searchParams.get('release')===release,release);
   active.cacheReport=await page.evaluate(()=>new Promise(resolve=>{
    const channel=new MessageChannel(),timer=setTimeout(()=>resolve({complete:false}),1200);
    channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};
    navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
   }));
   ok(active.cacheReport.complete&&active.cacheReport.cache===release&&
    active.cacheReport.cached===active.cacheReport.total,label+' complete current precache');
   // Seed only an empty position, as the existing native browser runner does.
   await page.evaluate(async({id,index})=>{
    const [{KEY,fresh},{freshLesson},{ensureB39Ready}]=await Promise.all([
     import('./exploration-core.js'),import('./learning/state.js'),import('./learning/phase4/async-batches.js')
    ]);
    await ensureB39Ready();const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';
    state.lessons[id]=lesson;localStorage.setItem(KEY,JSON.stringify(state));
   },spec);
   const ready=()=>page.waitForFunction(({id,index})=>{
    const snapshot=window.mathLesson?.snapshot();return snapshot?.id===id&&snapshot.index===index&&snapshot.view==='task';
   },spec);
   await page.goto(base+'learn.html#'+spec.id);await ready();
   const before=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
   active.beforeStorage=`${width}x${height}-before-storage.txt`;
   fs.writeFileSync(path.join(out,active.beforeStorage),before);
   const initialMathematics=mathematicalRecord(before);
   await page.screenshot({path:path.join(out,`${width}x${height}-before.png`),fullPage:true});
   await new Promise(resolve=>server.close(resolve));server.closeAllConnections();server=null;
   active.originStopped=true;persist();
   for(let attempt=1;attempt<=reloadsPerViewport;attempt++){
    label=`${width}x${height}-reload-${attempt}`;pageLabel=label;active.attempt=attempt;
    cdp.mark('reload-start',{spec,attempt});
    const response=await page.reload();
    cdp.mark('reload-response',{status:response?.status(),fromServiceWorker:response?.fromServiceWorker()});
    cdp.mark('readiness-wait-start',{spec});await ready();cdp.mark('readiness-wait-complete',{spec});
    const observed=await page.evaluate(()=>({title:document.querySelector('#title')?.textContent||'',
     instruction:document.querySelector('#instruction')?.textContent||'',
     warningHidden:document.querySelector('#storage-warning')?.hidden===true,
     raw:localStorage.getItem('math-explorer-v2')}));
    ok(response?.status()===200&&response.fromServiceWorker()&&observed.warningHidden&&
     observed.title.length>0&&observed.instruction.length>0,label+' cached document and live mathematical content');
    assert.deepEqual(mathematicalRecord(observed.raw),initialMathematics,label+' no invented mathematics');
    ok(active.pageErrors.length===0,label+' no uncaught page errors');
    active.successfulReloads.push({attempt,status:response.status(),fromServiceWorker:response.fromServiceWorker(),
     title:observed.title,instructionLength:observed.instruction.length});
    persist();
   }
   active.afterStorage=`${width}x${height}-after-storage.txt`;
   fs.writeFileSync(path.join(out,active.afterStorage),await page.evaluate(()=>localStorage.getItem('math-explorer-v2')));
   await page.screenshot({path:path.join(out,`${width}x${height}-after.png`),fullPage:true});
   active.status='complete';persist();
   nativePage.beforeClose();cdp.mark('context-close-start');await context.close();cdp.mark('context-close-complete');
   context=null;page=null;diagnostics=null;cdp=null;
  }
  ok(viewports.length===2&&viewports.every(v=>v.successfulReloads.length===reloadsPerViewport),
   'both independent viewports complete their full healthy sequence');
  persist();
 }catch(error){
  status='failure';if(active)active.status='failed';errors.push({label,error:String(error),stack:error?.stack});
  void finishNative({kind:'original-test-failure-fallback',label,error:String(error)});
  cdp?.mark('test-failure-observed',{error:String(error)});
  // Persist current storage independently: a later cache-body read may itself
  // fail or time out, and must not discard bytes already read from this page.
  if(page&&active){
   let timer;
   try{
    const snapshot=await Promise.race([
     page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2'),url:location.href})),
     new Promise(resolve=>{timer=setTimeout(()=>resolve({diagnosticTimeoutMs:1000}),1000);})
    ]);
    const {raw,...metadata}=snapshot;active.failureStorageCapture={at:new Date().toISOString(),...metadata};
    if(typeof raw==='string'){
     active.failureStorage=label+'-failure-storage.txt';
     fs.writeFileSync(path.join(out,active.failureStorage),raw);
    }
   }catch(storageError){active.failureStorageCapture={diagnosticError:String(storageError)};}
   finally{clearTimeout(timer);}
  }
  cdp?.mark('diagnostic-dump-start');
  if(diagnostics)failureDiagnostic=await diagnostics.dump(error).catch(diagnosticError=>({diagnosticError:String(diagnosticError)}));
  cdp?.mark('diagnostic-dump-complete',{failureDiagnostic});
  try{if(page)await page.screenshot({path:path.join(out,label+'-failure.png'),timeout:4000,fullPage:true});}catch{}
  persist();console.error(error);process.exitCode=1;
 }finally{
  healthyReloadsCompleted=viewports.length===2&&viewports.every(v=>v.successfulReloads.length===reloadsPerViewport);
  try{nativeTrace?.beginCleanup();}
  catch(error){nativeFinishErrors.push({label,stage:'native-trace-cleanup',error:String(error)});}
  await finishNative({kind:status==='failure'?'failure-cleanup':'healthy-sequence-complete',label});
  for(const trace of cdpDiagnostics)trace.mark('test-cleanup-start');
  try{if(server){await new Promise(resolve=>server.close(resolve));server.closeAllConnections();}}
  catch(error){errors.push({label,stage:'origin-close',error:String(error)});process.exitCode=1;}
  for(const trace of cdpDiagnostics)trace.mark('browser-close-start');
  try{
   if(browser)await browser.close();
   for(const trace of cdpDiagnostics)trace.mark('browser-close-complete');
  }catch(error){
   for(const trace of cdpDiagnostics)trace.mark('browser-close-failed',{error:String(error)});
   errors.push({label,stage:'browser-close',error:String(error)});process.exitCode=1;
  }
  for(const trace of cdpDiagnostics){
   try{
    const result=await trace.finish();diagnosticStreams.push(result);
    if(result.writeError){errors.push({label,stage:'diagnostic-stream',...result});process.exitCode=1;}
   }catch(error){errors.push({label,stage:'diagnostic-stream',file:trace.file,error:String(error)});process.exitCode=1;}
  }
  // A healthy reload sequence cannot certify a failed or incomplete capture.
  // Check only after cleanup, retaining any original test error at errors[0].
  errors.push(...nativeFinishErrors);
  const native=nativeTrace?.report;
  if(native?.status==='saved'){
   try{
    assert.ok(native.tracingComplete?.stream,'native trace is missing its completed stream');
    const bytes=fs.readFileSync(path.join(out,native.file));
    assert.ok(bytes.length>0,'native trace file is empty');
    assert.equal(bytes.length,native.bytes,'native trace byte count differs from the saved stream');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),native.sha256,'native trace SHA-256 differs from the saved stream');
    nativeCaptureSaved=true;
   }catch(error){errors.push({label,stage:'native-trace-artifact',error:String(error)});}
  }else errors.push({label,stage:'native-trace',error:'Native trace was not saved',status:native?.status||'missing'});
  if(native?.errors?.length)errors.push({label,stage:'native-trace',error:'Native trace reported diagnostic errors',details:native.errors});
  if(nativeCaptureSaved){
   if(native.dataLossOccurred===false)windowIntegrity='no-loss-reported';
   else if(native.dataLossOccurred===true)windowIntegrity='not-proven';
   else errors.push({label,stage:'native-trace-integrity',error:'Native trace data loss status is unknown'});
  }
  const diagnosticErrors=errors.some(error=>error.stage);
  diagnosticOutcome=!nativeCaptureSaved||diagnosticErrors?'incomplete':windowIntegrity==='not-proven'?'partial':'saved';
  const healthy=healthyReloadsCompleted&&viewports.every(v=>v.status==='complete')&&errors.length===0;
  status=healthy&&diagnosticOutcome==='saved'?'success':healthy&&diagnosticOutcome==='partial'?'partial':'failure';
  if(status!=='success')process.exitCode=1;
  persist();
 }
 console.log('P9_OFFLINE_LONG_RELOAD '+JSON.stringify({status,headSha,checks:checks.length,
  reloads:viewports.reduce((sum,v)=>sum+v.successfulReloads.length,0),healthyReloadsCompleted,nativeCaptureSaved,diagnosticOutcome,windowIntegrity}));
})().catch(error=>{console.error(error);process.exitCode=1;});
