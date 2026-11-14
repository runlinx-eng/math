// Diagnostic only: construct the actual PR #173 failure scene with visible
// controls, then repeatedly reload its unchanged work from a stopped origin.
// This does not replace any Required/P10 case or count toward acceptance.
// The first failed operation stops the run; there is no retry or recovery.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {execFileSync}=require('node:child_process'),{once}=require('node:events');
const {pipeline}=require('node:stream/promises');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-offline-reload-diagnostic');
const fixture=require('./fixtures/p9-wideshift-cases.cjs');
const spec=fixture.associated.find(value=>value.id==='link-decimalscale-powerpattern'&&value.index===1);
const productBaselineSha='4dda5a07e836add91e554b12d2fa3854507933d9';
const iterations=800,viewports=[[1440,900],[1280,720]],mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
const bounded=async(promise,ms,label)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),ms);})]);}finally{clearTimeout(timer);}};

// Sparse host observations are diagnostic overhead, not product behavior.
// Read only this Node process and its descendants; never record argv or env.
function runnerSnapshot(){
 const read=file=>{try{return fs.readFileSync(file,'utf8');}catch(error){return {unavailable:String(error)};}};
 const rows=execFileSync('ps',['-eo','pid=,ppid=,rss=,vsz=,nlwp=,comm='],{encoding:'utf8'}).trim().split('\n').map(line=>{
  const [pid,ppid,rssKiB,virtualKiB,threads,...command]=line.trim().split(/\s+/);return {pid:Number(pid),ppid:Number(ppid),rssKiB:Number(rssKiB),virtualKiB:Number(virtualKiB),threads:Number(threads),command:command.join(' ')};
 });
 const owned=new Set([process.pid]);let prior=0;while(prior!==owned.size){prior=owned.size;for(const row of rows)if(owned.has(row.ppid))owned.add(row.pid);}
 const processes=rows.filter(row=>owned.has(row.pid)).map(row=>{try{return {...row,openFDs:fs.readdirSync('/proc/'+row.pid+'/fd').length};}catch(error){return {...row,openFDError:String(error)};}});
 const disk=fs.statfsSync(root);
 return {at:new Date().toISOString(),nodePid:process.pid,hostMemory:{totalBytes:os.totalmem(),freeBytes:os.freemem()},processes,
  disk:{blockSize:disk.bsize,totalBlocks:disk.blocks,availableBlocks:disk.bavail,totalFiles:disk.files,freeFiles:disk.ffree},
  meminfo:read('/proc/meminfo'),memoryPressure:read('/proc/pressure/memory'),cgroupMemoryEvents:read('/sys/fs/cgroup/memory.events'),cgroupMemoryCurrent:read('/sys/fs/cgroup/memory.current'),cgroupMemoryMax:read('/sys/fs/cgroup/memory.max')};
}

// A genuine lesson reopen updates precisely these two existing timestamps.
// Compare every other stored field, including complete old attempts and notes.
function assertPreservedState(before,after,id){
 const left=structuredClone(before),right=structuredClone(after);
 for(const trail of [['daily','bridges',id,'updatedAt'],['daily','continuation','at']]){
  const key=trail.at(-1),a=trail.slice(0,-1).reduce((value,name)=>value[name],left),b=trail.slice(0,-1).reduce((value,name)=>value[name],right);
  assert.ok(Number.isFinite(Date.parse(a[key]))&&Number.isFinite(Date.parse(b[key])));
  assert.ok(b[key]>=a[key],'reopen timestamps must be monotonic');
  delete a[key];delete b[key];
 }
 assert.deepEqual(right,left,'only the original reopen timestamps may change');
}

// Tracing.end acknowledges an asynchronous flush. Keep one stop promise and
// the original listener through a diagnostic timeout; never send a second end.
function nativeTraceCapture(cdp,destination,categories){
 const lifecycle={file:path.basename(destination),categories,events:[]};
 const note=(kind,detail={})=>{lifecycle.events.push({at:new Date().toISOString(),kind,...detail});write(destination+'.lifecycle.json',lifecycle);};
 let resolveComplete,rejectComplete,resolveEnd,rejectEnd,started=false,stopPromise;
 const completed=new Promise((resolve,reject)=>{resolveComplete=resolve;rejectComplete=reject;});completed.catch(()=>{});
 const endAcknowledged=new Promise((resolve,reject)=>{resolveEnd=resolve;rejectEnd=reject;});endAcknowledged.catch(()=>{});
 const onComplete=event=>{note('tracing-complete',event);resolveComplete(event);};
 cdp.on('Tracing.tracingComplete',onComplete);note('listener-registered');
 return {
  completion:completed,endAcknowledged,
  async start(){
   note('start-sent');await cdp.send('Tracing.start',{categories:categories.selected.join(','),transferMode:'ReturnAsStream',options:'record-continuously'});started=true;note('start-acknowledged');
  },
  stop(){
   if(stopPromise)return stopPromise;
   stopPromise=(async()=>{
    assert.equal(started,true,'native tracing must start before it stops');
    note('end-sent');await cdp.send('Tracing.end');note('end-acknowledged');resolveEnd();
    const completion=await completed,stream=completion.stream;assert.equal(typeof stream,'string','native tracing completion must supply its stream');
    const gzip=zlib.createGzip(),file=fs.createWriteStream(destination),finished=pipeline(gzip,file);finished.catch(()=>{});
    const digest=crypto.createHash('sha256');let bytes=0;
    try{
     note('stream-read-started');
     for(;;){const chunk=await cdp.send('IO.read',{handle:stream,size:1024*1024});const data=Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8');bytes+=data.length;digest.update(data);if(!gzip.write(data))await once(gzip,'drain');if(chunk.eof)break;}
     gzip.end();await finished;
     const result={file:path.basename(destination),bytes,sha256:digest.digest('hex'),categories,completion,mode:'record-continuously',retention:'native circular buffer; latest events, not a complete run history'};
     note('stream-saved',{bytes,sha256:result.sha256,dataLossOccurred:completion.dataLossOccurred});return result;
    }catch(error){gzip.destroy();await finished.catch(()=>{});throw error;}
    finally{await cdp.send('IO.close',{handle:stream}).catch(error=>note('stream-close-error',{error:String(error)}));}
   })();
   stopPromise.catch(error=>{rejectEnd(error);rejectComplete(error);note('capture-error',{error:String(error)});}).finally(()=>cdp.off('Tracing.tracingComplete',onComplete));
   return stopPromise;
  },
  abandon(error){note('preservation-abandoned',{error:String(error)});rejectComplete(error);cdp.off('Tracing.tracingComplete',onComplete);}
 };
}

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b08-model.js');
 const {wideShiftEvidenceSteps}=await import('../scripts/wideshift-evidence-fixture.mjs');
 const task=sessionTasks(spec.id)[spec.index];assert.equal(hash(JSON.stringify(stable(task))),spec.taskHash);
 git(['diff','--exit-code','HEAD','--','dist']);
 const productTreeSha=git(['rev-parse','HEAD:dist']);assert.equal(productTreeSha,git(['rev-parse',productBaselineSha+':dist']),'the diagnosis must serve the frozen 4dda product tree');
 assert.ok(!fs.existsSync(out)||fs.readdirSync(out).every(file=>file==='console.log'),'preserve previous diagnostic output instead of overwriting it');
 fs.mkdirSync(out,{recursive:true});
 const checkoutSha=git(['rev-parse','HEAD']),treeSha=git(['rev-parse','HEAD^{tree}']);
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,treeSha,productBaselineSha,productTreeSha,runId:process.env.GITHUB_RUN_ID||null,attempt:process.env.GITHUB_RUN_ATTEMPT||null,
  countsTowardAcceptance:false,diagnosticOnly:true,productModified:false,originStopRequired:true,offlineEmulation:false,automaticRetries:0,readinessTimeoutMs:20000,iterationsPerViewport:iterations,viewports,
  source:{id:spec.id,index:spec.index,taskHash:spec.taskHash},playwrightVersion:require((process.env.MATH_PLAYWRIGHT_MODULE||'playwright')+'/package.json').version};
 const files=git(['ls-files','dist']).split('\n').filter(Boolean).map(file=>({file,sha256:hash(fs.readFileSync(path.join(root,file)))}));
 write(path.join(out,'product-source-manifest.json'),{...provenance,files});
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 let browser,server,context,page,diagnostics,browserCDP,traceCapture,current,diagnosticFailure,phase='setup',caseOut=out,eventFd,closing=false;
 const trials=[],errors=[],remote=[],nativeCategories='ServiceWorker,CacheStorage,loading,blink.user_timing';
 const log=(kind,detail={})=>{const entry={at:new Date().toISOString(),phase,kind,...detail};if(eventFd!==undefined)fs.writeSync(eventFd,JSON.stringify(entry)+'\n');return entry;};
 const stopOrigin=async()=>{if(server?.listening){await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});log('origin-stopped');}};
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--log-net-log='+path.join(out,'browser-netlog.json')]});
  provenance.browserVersion=browser.version();write(path.join(out,'provenance.json'),provenance);
  browserCDP=await browser.newBrowserCDPSession();
  const available=(await browserCDP.send('Tracing.getCategories')).categories,requested=nativeCategories.split(','),selected=requested.filter(category=>available.includes(category));
  provenance.nativeTraceCategories={available,requested,selected,missing:requested.filter(category=>!available.includes(category))};
  write(path.join(out,'native-trace-categories.json'),provenance.nativeTraceCategories);write(path.join(out,'provenance.json'),provenance);
  assert.ok(selected.length>0,'at least one requested native trace category must be available');
  // Check the protocol and exported marker before the costly product scene.
  // This isolated about:blank page never visits dist or learner storage.
  phase='native-trace-preflight';
  context=await browser.newContext();page=await context.newPage();
  traceCapture=nativeTraceCapture(browserCDP,path.join(out,'native-trace-preflight.json.gz'),provenance.nativeTraceCategories);await traceCapture.start();
  const marker='p9-offline-reload-native-trace-preflight';await page.evaluate(name=>performance.mark(name),marker);
  const preflightStop=traceCapture.stop();await traceCapture.endAcknowledged;await bounded(traceCapture.completion,10000,'native tracing completion');
  phase='native-trace-preflight-export';const preflightTrace=await preflightStop;traceCapture=null;
  const preflightEvents=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(out,preflightTrace.file)))).traceEvents;
  const markers=preflightEvents.filter(event=>event.name===marker&&event.cat.split(',').includes('blink.user_timing'));
  assert.ok(markers.length>0,'the exported native trace must contain the actual preflight mark');
  write(path.join(out,'native-trace-preflight-verification.json'),{trace:preflightTrace,marker,events:preflightEvents.length,markers,productVisited:false,learnerStorageAccessed:false});
  await context.close();context=null;page=null;
  for(const [width,height]of viewports){
   const prefix=width+'x'+height;phase=prefix+'-cache';caseOut=path.join(out,prefix);fs.mkdirSync(caseOut,{recursive:true});
   eventFd=fs.openSync(path.join(caseOut,'events.jsonl'),'w');
   current={...provenance,width,height,originStopped:false,completedReloads:0,status:'running',rows:[],runnerSnapshots:[]};trials.push(current);
   const captureRunner=name=>{const file='runner-'+name+'.json';let snapshot;try{snapshot=runnerSnapshot();}catch(error){snapshot={snapshotError:String(error)};}write(path.join(caseOut,file),snapshot);current.runnerSnapshots.push(file);};
   captureRunner('before-cache');
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';log('http-request',{path:rel});
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';current.origin=base;
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   await context.addInitScript(()=>{try{window.__p9OfflineReloadBeforeApp=localStorage.getItem('math-explorer-v2');}catch(error){window.__p9OfflineReloadBeforeAppError=String(error);}});
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base)){remote.push(log('external-request',{url:request.url()}));}});
   page=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push(log('pageerror',{error:String(error)})));
   page.on('requestfailed',request=>log('page-requestfailed',{url:request.url(),failure:request.failure()}));
   diagnostics=observeBrowserDiagnostics(page,{out:caseOut,base,label:()=>phase});
   const cdp=await context.newCDPSession(page),recent=[],failed=[],pendingRequests=new Map();
   const mainFrameId=(await cdp.send('Page.getFrameTree')).frameTree.frame.id;
   let currentLoaderId=null,currentDocumentURL=null,observing=true,recentCursor=0;
   const recordCDP=(kind,payload)=>{
    if(kind==='Network.requestWillBeSent'){
     pendingRequests.set(payload.requestId,{url:payload.request.url,loaderId:payload.loaderId,frameId:payload.frameId,type:payload.type});
     if(payload.type==='Document'&&payload.frameId===mainFrameId){currentLoaderId=payload.loaderId;currentDocumentURL=payload.request.url;}
    }
    const request=pendingRequests.get(payload.requestId)||null,entry={at:new Date().toISOString(),phase,kind,request,...payload};
    if(recent.length<3000)recent.push(entry);else{recent[recentCursor]=entry;recentCursor=(recentCursor+1)%3000;}
    if(kind==='Network.loadingFailed'){
     const currentLesson=!closing&&observing&&currentDocumentURL?.startsWith(base+'learn.html')&&request?.loaderId===currentLoaderId;
     log('native-page-loading-failed',{...payload,request,currentLesson});
     if(currentLesson){failed.push(entry);if(failed.length===1){write(path.join(caseOut,'first-loading-failure.json'),{...provenance,first:failed[0],atFirstFailure:[...recent.slice(recentCursor),...recent.slice(0,recentCursor)]});captureRunner('first-loading-failure');}}
    }
    if(kind==='Network.loadingFinished'||kind==='Network.loadingFailed')pendingRequests.delete(payload.requestId);
   };
   for(const name of ['Network.requestWillBeSent','Network.responseReceived','Network.loadingFinished','Network.loadingFailed'])cdp.on(name,payload=>recordCDP(name,payload));
   await cdp.send('Network.enable');
   traceCapture=nativeTraceCapture(browserCDP,path.join(caseOut,'native-trace.json.gz'),provenance.nativeTraceCategories);await traceCapture.start();
   const read=()=>page.evaluate(async()=>{const {readStored}=await import('./storage.js');return {raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2'),beforeApp:window.__p9OfflineReloadBeforeApp,beforeAppError:window.__p9OfflineReloadBeforeAppError||null};});
   const record=async()=>JSON.parse((await read()).text).daily.bridges[spec.id];
   const wait=()=>page.waitForFunction(({id,index})=>{const value=window.mathLesson?.snapshot();return value?.id===id&&value.index===index&&value.view==='task';},spec);
   const reload=async()=>{const response=await page.reload();await wait();assert.equal(response?.fromServiceWorker(),true,'the reload must use the stopped-origin cache');};
   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let cacheReport={ready:false};
   for(let index=0;index<300;index++){
    cacheReport=await page.evaluate(async expected=>{
     const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
     const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
     if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return {ready:false,...identity};
     const status=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);});
     return {...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
    },cache);if(cacheReport.ready===true)break;await page.waitForTimeout(100);
   }
   assert.equal(cacheReport.ready,true);current.cacheReport=cacheReport;await stopOrigin();assert.equal(server.listening,false);current.originStopped=true;
   phase=prefix+'-construct-original-scene';
   await page.evaluate(async({id,index})=>{
    const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')]);
    if(!Object.hasOwn(BRIDGES,id))throw Error('the reviewed failure scene is a related exercise');
    const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';state.daily.bridges[id]=lesson;localStorage.setItem(KEY,JSON.stringify(state));
   },spec);
   await page.goto(base+'learn.html#'+spec.id);await wait();await reload();
   const blank=await record();assert.deepEqual(blank.models[spec.index],M.initial(task));assert.equal(blank.cases[spec.index]?.attempts?.length??0,0);
   assert.equal(await page.locator('#thinking-guide').count(),0);assert.equal(await page.locator('#thinking-feedback').count(),0);
   const expected=M.initial(task),actions=[];
   for(const step of wideShiftEvidenceSteps(task,{guess:'-1'})){
    if(step.field){const control=page.locator('[data-xfield="'+step.field+'"]');assert.equal(await control.isVisible(),true);assert.equal(await control.isEnabled(),true);if(await control.evaluate(element=>element.tagName)==='SELECT')await control.selectOption(String(step.value));else await control.fill(String(step.value));expected[step.field]=String(step.value);M.field(task,expected,step.field);}
    else{const suffix=Object.entries(step.data||{}).map(([key,value])=>'[data-'+key+'="'+value+'"]').join(''),control=page.locator('[data-x="'+step.action+'"]'+suffix);assert.equal(await control.isVisible(),true);assert.equal(await control.isEnabled(),true);await control.click();M.act(task,expected,step.action,step.data);}
    const actual=await record();assert.deepEqual(actual.models[spec.index],expected);actions.push({step,record:actual});
   }
   const check=page.locator('#actions [data-do="check"]');assert.equal(await check.isVisible(),true);assert.equal(await check.isEnabled(),true);await check.click();
   assert.equal(await page.locator('#check-feedback').getAttribute('data-state'),'correct');assert.equal(await page.locator('#thinking-feedback').count(),0);
   let previous=await read(),previousState=JSON.parse(previous.text);const checked=previousState.daily.bridges[spec.id];
   assert.equal(checked.cases[spec.index].attempts.length,1);assert.deepEqual(checked.cases[spec.index].attempts[0].value,expected);
   write(path.join(caseOut,'ui-construction.json'),{...provenance,blank,actions,checked});fs.writeFileSync(path.join(caseOut,'storage-before-reloads.txt'),previous.raw);
   await page.screenshot({path:path.join(caseOut,'constructed.png'),fullPage:true});
   captureRunner('before-reloads');
   for(let index=1;index<=iterations;index++){
    phase=prefix+'-reload-'+String(index).padStart(4,'0');log('reload-start',{index,headSha:provenance.headSha,testedCheckoutSha:checkoutSha,beforeStorageSha256:hash(previous.raw)});
    const started=Date.now();await reload();
    const observed=await read(),state=JSON.parse(observed.text);assert.equal(observed.beforeAppError,null);assert.equal(observed.beforeApp,previous.raw,'browser startup reads the exact preceding stored bytes');assertPreservedState(previousState,state,spec.id);
    assert.equal(await page.locator('#thinking-feedback').count(),0);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.equal(failed.length,0,'a native page request failed');assert.equal(errors.length,0);assert.equal(remote.length,0);
    const snapshot=await page.evaluate(()=>({lesson:window.mathLesson.snapshot(),title:document.querySelector('#title')?.textContent,controller:navigator.serviceWorker.controller?.scriptURL||null}));
    await page.evaluate(name=>performance.mark(name),phase);
    const row={index,headSha:provenance.headSha,testedCheckoutSha:checkoutSha,treeSha,productBaselineSha,productTreeSha,elapsedMs:Date.now()-started,storageSha256:hash(observed.raw),beforeAppSha256:hash(observed.beforeApp),snapshot,state};
    write(path.join(caseOut,phase+'.json'),row);current.rows.push({index,elapsedMs:row.elapsedMs,storageSha256:row.storageSha256});current.completedReloads=index;
    previous=observed;previousState=state;
    if(index%100===0){captureRunner('reload-'+index);console.log('P9_OFFLINE_RELOAD_PROGRESS '+JSON.stringify({viewport:prefix,completed:index,headSha:provenance.headSha}));}
   }
   current.status='completed-without-reproduction';await page.screenshot({path:path.join(caseOut,'completed.png'),fullPage:true});
   phase=prefix+'-native-trace-completion';const traceStop=traceCapture.stop();await traceCapture.endAcknowledged;await bounded(traceCapture.completion,10000,'native tracing completion');
   phase=prefix+'-native-trace-export';current.nativeTrace=await traceStop;traceCapture=null;
   write(path.join(caseOut,'report.json'),current);observing=false;phase=prefix+'-close-context';await context.close();context=null;page=null;diagnostics=null;fs.closeSync(eventFd);eventFd=undefined;
  }
 }catch(error){
  process.exitCode=1;diagnosticFailure=log('diagnostic-stopped',{error:String(error),stack:error.stack});
  if(current){current.status='first-failure';current.error=String(error);current.stack=error.stack;current.phase=phase;}
  try{write(path.join(caseOut,'runner-at-failed-operation.json'),runnerSnapshot());}catch(problem){if(current)current.runnerSnapshotError=String(problem);}
  if(diagnostics){const failure=await diagnostics.dump(error).catch(problem=>({diagnosticError:String(problem)}));if(current)current.failureDiagnostic=failure;}
  if(page)await page.screenshot({path:path.join(caseOut,'first-failure.png'),fullPage:true}).catch(()=>{});
  console.error(error.stack);
 }finally{
  // The first 10s export failure remains a failure. This separate 20s budget
  // only preserves a late stream from the same end; it cannot resume trials.
  if(traceCapture){try{const trace=await bounded(traceCapture.stop(),20000,'late native trace preservation');if(current)current.nativeTrace=trace;else write(path.join(out,'late-preflight-trace.json'),trace);}catch(error){traceCapture.abandon(error);if(current)current.traceError=String(error);process.exitCode=1;}}
  if(current)write(path.join(caseOut,'report.json'),current);
  await stopOrigin();closing=true;if(context)await context.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});if(eventFd!==undefined)fs.closeSync(eventFd);
  write(path.join(out,'results.json'),{provenance,trials,errors,remote,diagnosticFailure,rootCauseResolved:false,acceptanceClaim:false});
 }
}
module.exports={assertPreservedState,nativeTraceCapture};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
