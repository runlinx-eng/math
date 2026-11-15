'use strict';
// Issue #180 historical request-cancellation reproduction. Synthetic only.
// Uses the exact 22 paths and 155-157ms natural failure signature, from
// GitHub run #43705224073, Artifact #14157743738. No production dist edits.
// We compare individual SW 503, simultaneous SW rejection, and navigation
// cancellation without claiming any outcome is the historical root cause.
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const historical=require('./fixtures/issue180-historical-b11-abort-cluster.json');
const modes=['single','cluster','navigation'];
const mode=process.env.MATH_ISSUE180_REPLAY_MODE;
if(!modes.includes(mode))throw Error('MATH_ISSUE180_REPLAY_MODE must be single, cluster or navigation');
assert.equal(historical.paths.length,22,'historical fixture must retain exactly 22 failed scripts');
assert.equal(new Set(historical.paths).size,22,'historical paths must be distinct');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/issue180-historical-replay');
const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/^const CACHE = '([^']+)'/m)?.[1];
assert.ok(release,'SW release must be identifiable');
const baseWorker=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
const marker="self.addEventListener('fetch',event=>{";
assert.equal(baseWorker.split(marker).length,2,'instrument exactly one original SW fetch listener');
const faultModeScript=[
 'const __issue180TargetPaths=new Set('+JSON.stringify(historical.paths.map(p=>'/'+p))+');',
 "let __issue180ReplayMode='baseline';",
 'let __issue180Triggered=0;',
 'const __issue180Hits=[];',
 "self.addEventListener('message',event=>{",
 " if(event.data?.type==='issue180:arm'){",
 "  __issue180ReplayMode=event.data.mode;",
 '  __issue180Triggered=0;__issue180Hits.length=0;',
 '  event.ports?.[0]?.postMessage({armed:true,mode:__issue180ReplayMode});',
 " }else if(event.data?.type==='issue180:stats'){",
 '  event.ports?.[0]?.postMessage({mode:__issue180ReplayMode,count:__issue180Triggered,hits:__issue180Hits.slice(0,80)});',
 ' }',
 '});'
].join('\n');
const faultFetchScript=[
 'const __issue180URL=new URL(event.request.url);',
 'const __issue180Target=__issue180TargetPaths.has(__issue180URL.pathname);',
 "if(__issue180ReplayMode!=='baseline' && event.request.method==='GET' &&",
 "   event.request.destination==='script' && __issue180Target &&",
 "   !__issue180URL.searchParams.has('module-recovery')){",
 ' const __issue180Path=__issue180URL.pathname;',
 ' __issue180Triggered++;__issue180Hits.push({url:__issue180Path,at:Date.now()});',
 ' event.respondWith((async()=>{',
 "  const delay=__issue180ReplayMode==='navigation'?550:156;",
 '  await new Promise(resolve=>setTimeout(resolve,delay));',
 "  if(__issue180ReplayMode==='cluster')throw new TypeError('synthetic-issue180-cluster-rejection');",
 "  if(__issue180ReplayMode==='single' && __issue180Path==='/learning/phase5/b18.js')",
 "   return new Response('synthetic 503 on one original dependency',{status:503,",
 "    headers:{'Content-Type':'text/plain; charset=utf-8'}});",
 '  const cached=await (await caches.open(CACHE)).match(event.request,{ignoreSearch:true});',
 "  return cached||new Response('test target absent',{status:503});",
 ' })());',
 ' return;',
 '}'
].join('\n');
const injectedWorker=baseWorker.replace(marker,faultModeScript+'\n'+marker+'\n'+faultFetchScript);
assert.ok(injectedWorker.includes('synthetic-issue180-cluster-rejection')&&injectedWorker!==baseWorker);
const spec={id:'twodigitpair',index:1};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const snapshots=[];
const failureRoot=historical.source.runId;
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function serializeError(error){return error?.stack||String(error);}
function roundTo(value){return typeof value==='number'?Math.round(value*1000)/1000:null;}
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));}
async function shutdown(server){
 if(!server?.listening)return;
 await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
}
async function workerMessage(page,data){
 return page.evaluate(data=>new Promise(resolve=>{
  const controller=navigator.serviceWorker?.controller;
  if(!controller){resolve({error:'missing-controller'});return;}
  const channel=new MessageChannel();let done=false;
  const finish=value=>{if(done)return;done=true;clearTimeout(timer);channel.port1.close();resolve(value);};
  const timer=setTimeout(()=>finish({timeout:true}),2000);
  channel.port1.onmessage=event=>finish(event.data);
  try{controller.postMessage(data,[channel.port2]);}catch(error){finish({error:String(error)});}
 }),data);
}
async function verifyCache(page){
 const result=await workerMessage(page,{type:'math-explorer:cache-status'});
 assert.equal(result?.cache,release,'expected original SW release');
 assert.equal(result?.complete,true,'original SW cache must be complete');
 assert.equal(result?.cached,result?.total,'no missing offline file');
 return result;
}
async function state(page){
 return page.evaluate(({id,index})=>{
  const raw=localStorage.getItem('math-explorer-v2');
  const obj=raw?JSON.parse(raw):null;
  const lesson=obj?.lessons?.[id]||obj?.daily?.bridges?.[id]||null;
  const snapshot=window.mathLesson?.snapshot?.()||null;
  return {raw,model:lesson?.models?.[index]||null,
   attempts:lesson?.cases?.[index]?.attempts||null,
   lessonIndex:lesson?.index,ready:snapshot?{id:snapshot.id,index:snapshot.index,view:snapshot.view}:null,
   recovery:window.mathStartupRecovery||null,
   warning:document.querySelector('#storage-warning')?.textContent||'',
   warningVisible:document.querySelector('#storage-warning')?.hidden===false};
 },spec);
}
async function seed(page){
 await page.evaluate(async({id,index})=>{
  const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([
   import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')
  ]);
  const data=fresh(),lesson=freshLesson(id);
  lesson.index=index;lesson.view='task';
  if(Object.hasOwn(BRIDGES,id))data.daily.bridges[id]=lesson;else data.lessons[id]=lesson;
  localStorage.setItem(KEY,JSON.stringify(data));
 },spec);
}
async function waitHealthy(page){
 await page.waitForFunction(({id,index})=>{
  const now=window.mathLesson?.snapshot?.();
  return now?.id===id&&now?.index===index&&now?.view==='task';
 },spec);
}
async function completeOfflineSetup(page,base,server){
 await page.goto(base+'v2.html#trail');
 await page.locator('#import-file').waitFor({state:'attached'});
 let ready=false;
 for(let n=0;n<300;n++){
  const status=await workerMessage(page,{type:'math-explorer:cache-status'});
  if(status?.cache===release&&status.complete===true&&status.cached===status.total){ready=true;break;}
  await page.waitForTimeout(100);
 }
 assert.ok(ready,'original current SW cache not complete after precache');
 await seed(page);
 await shutdown(server);
 assert.equal(server.listening,false,'HTTP origin must stay stopped');
 const initial=await page.goto(base+'learn.html#twodigitpair');
 await waitHealthy(page);
 assert.equal(initial?.fromServiceWorker(),true,'baseline page must come from the stopped-origin SW');
 const baseline=await state(page);
 assert.ok(baseline.model,'original B11 model absent before fault replay');
 assert.equal(baseline.lessonIndex,1,'wrong original fraction position');
 return {baseline,cache:await verifyCache(page)};
}
function noteFailureEvents(page,context){
 const events=[],requests=new Map();
 const add=(kind,obj)=>{const rec={seq:events.length+1,kind,at:new Date().toISOString(),...obj};events.push(rec);};
 page.on('requestfailed',request=>{
  add('pageRequestFailed',{url:request.url(),resourceType:request.resourceType(),errorText:request.failure()?.errorText||null});
 });
 page.on('pageerror',error=>add('pageError',{message:String(error)}));
 page.on('console',message=>{if(message.type()==='error')add('consoleError',{text:message.text().slice(0,800)});});
 page.on('framenavigated',frame=>{if(frame===page.mainFrame())add('frameNavigated',{url:frame.url()});});
 const ready=context.newCDPSession(page).then(async cdp=>{
  cdp.on('Network.requestWillBeSent',event=>{
   const url=event.request?.url||'';
   requests.set(event.requestId,{url,resourceType:event.type,frameId:event.frameId,
    loaderId:event.loaderId,initiator:event.initiator?.type||null,cdpStarted:event.timestamp});
   if(event.type==='Script'||event.type==='Document')add('request',{requestId:event.requestId,...requests.get(event.requestId)});
  });
  cdp.on('Network.responseReceived',event=>{
   const v=requests.get(event.requestId);
   if(event.type==='Script'||event.type==='Document')
    add('response',{requestId:event.requestId,url:event.response?.url||v?.url,
     status:event.response?.status,fromServiceWorker:event.response?.fromServiceWorker===true,
     cdpTimestamp:event.timestamp});
  });
  cdp.on('Network.loadingFailed',event=>add('loadingFailed',{
   requestId:event.requestId,request:requests.get(event.requestId)||null,
   errorText:event.errorText,canceled:event.canceled===true,cdpTimestamp:event.timestamp,type:event.type}));
  cdp.on('Network.loadingFinished',event=>{
   const v=requests.get(event.requestId);
   if(v?.resourceType==='Script')add('loadingFinished',{requestId:event.requestId,url:v.url,cdpTimestamp:event.timestamp});
  });
  await cdp.send('Network.enable');
  return cdp;
 });
 return {events,ready};
}
function analyze(events){
 const starts=events.filter(e=>e.kind==='request'&&e.resourceType==='Script');
 const cdpBad=events.filter(e=>e.kind==='loadingFailed');
 const pageBad=events.filter(e=>e.kind==='pageRequestFailed');
 const allBad=[...cdpBad,...pageBad];
 const matches=e=>{
  const url=e.url||e.request?.url||'';
  return historical.paths.some(p=>url.endsWith('/'+p));
 };
 const relevant=allBad.filter(matches);
 const paths=entries=>[...new Set(entries.map(e=>{
  try{return new URL(e.url||e.request?.url).pathname.slice(1);}catch{return '';}
 }).filter(Boolean))];
 const failedPaths=paths(relevant);
 const aborted=relevant.filter(e=>String(e.errorText).includes('ERR_ABORTED'));
 const timed=cdpBad.filter(matches).filter(e=>
  typeof e.cdpTimestamp==='number'&&typeof e.request?.cdpStarted==='number');
 const elapsed=timed.map(e=>roundTo((e.cdpTimestamp-e.request.cdpStarted)*1000));
 const spread=timed.length?Math.max(...timed.map(e=>e.cdpTimestamp))-
  Math.min(...timed.map(e=>e.cdpTimestamp)):null;
 const httpErrors=events.filter(e=>e.kind==='response'&&e.status>=400&&matches(e));
 return {originalFailureRun:failureRoot,historicalFailedScripts:historical.observed.failureCount,
  originalError:historical.observed.error,observedRequestFailureEvents:allBad.length,
  historicalScriptFailures:failedPaths.length,uniqueAffectedPaths:failedPaths.length,
  overlappingHistoricalPaths:failedPaths.filter(p=>historical.paths.includes(p)),
  abortedPaths:paths(aborted).length,cdpAbortEvents:cdpBad.filter(matches)
   .filter(e=>String(e.errorText).includes('ERR_ABORTED')).length,
  httpErrorResponses:httpErrors.map(e=>({url:e.url,status:e.status})),
  cdpFailureSpreadMs:spread===null?null:roundTo(spread*1000),
  startToFailureMs:{min:elapsed.length?Math.min(...elapsed):null,
   max:elapsed.length?Math.max(...elapsed):null},
  firstFailedEvent:allBad[0]||null,scriptRequests:starts.length};
}
async function terminal(page,mode){
 if(mode==='navigation'){
  await page.waitForTimeout(400);
  return state(page);
 }
 await page.waitForFunction(()=>{
  const s=window.mathStartupRecovery;
  return s?.status==='failed'||s?.status==='recovered'||Boolean(window.mathLesson?.snapshot?.());
 },null,{timeout:7000}).catch(()=>{});
 await page.waitForTimeout(300);
 return state(page);
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const report={schema:'issue180-historical-synthetic-replay/1',mode,source:historical.source,
  historical:historical.observed,signature:historical.clock,viewports:[],synthetic:true,
  historicalRootCauseEstablished:false,noProductionFilesChanged:true};
 let browser=null,server=null,context=null;
 try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  for(const [width,height] of [[1440,900],[1280,720]]){
   const v={width,height,mode,stage:'server',synthetic:true};
   report.viewports.push(v);
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/,'')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{
     const bytes=!error&&rel==='sw.js'?Buffer.from(injectedWorker):data;
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':bytes);
    });
   });
   await listen(server);
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   v.stage='baseline';
   const setup=await completeOfflineSetup(page,base,server);
   v.baseline={ready:setup.baseline.ready,cache:setup.cache,
    rawSha256:sha256(setup.baseline.raw),rawBytes:Buffer.byteLength(setup.baseline.raw)};
   v.stage='armed';
   const fault=noteFailureEvents(page,context),cdp=await fault.ready;
   const armed=await workerMessage(page,{type:'issue180:arm',mode});
   assert.equal(armed?.mode,mode,'test-only SW fault did not arm');
   v.arm=armed;
   v.stage='injection';
   const start=Date.now();
   if(mode==='navigation'){
    let resolveFirst=null;
    const first=new Promise(resolve=>{resolveFirst=resolve;});
    const onRequest=request=>{
     if(historical.paths.some(p=>request.url().endsWith('/'+p)))resolveFirst(Date.now());
    };
    page.on('request',onRequest);
    await page.reload({waitUntil:'commit'});
    const firstStarted=await Promise.race([first,page.waitForTimeout(4000).then(()=>null)]);
    page.off('request',onRequest);
    assert.ok(firstStarted,'historic target scripts did not start before synthetic navigation');
    await page.waitForTimeout(156);
    await page.goto(base+'v2.html#trail',{waitUntil:'domcontentloaded'});
    v.navigation={firstTargetAtMs:firstStarted-start,navigateAtMs:Date.now()-start,
     expectedBurstDelayMs:156};
   }else{
    await page.reload();
   }
   v.terminal=await terminal(page,mode);
   v.workerStats=await workerMessage(page,{type:'issue180:stats'});
   v.cacheAfter=await verifyCache(page);
   v.latencyMs=Date.now()-start;
   v.stage='evidence';
   await cdp.detach();
   v.eventJournalFile=mode+'-'+width+'x'+height+'-events.json';
   fs.writeFileSync(path.join(out,v.eventJournalFile),JSON.stringify(fault.events,null,2));
   v.compare=analyze(fault.events);
   v.modelPreserved=same(setup.baseline.model,v.terminal.model)&&same(setup.baseline.attempts,v.terminal.attempts);
   assert.ok(v.modelPreserved,'synthetic replay changed original math model or submission records');
   assert.equal(v.cacheAfter?.cached,v.cacheAfter?.total,'synthetic replay modified cache completeness');
   if(mode==='single')
    assert.ok(v.workerStats?.hits?.some(x=>x.url==='/learning/phase5/b18.js'),
     'single-dependency original B11 target was not requested');
   if(mode==='cluster')
    assert.ok(v.workerStats?.count>0,'cluster fault did not intercept the original module graph');
   if(mode==='navigation')
    assert.ok(v.workerStats?.count>0,'navigation scenario did not intercept original modules');
   v.stage='done';
   console.log('ISSUE180_SYNTHETIC_REPLAY_CASE_OK '+JSON.stringify({mode,width,height,intercepts:v.workerStats.count,
    failures:v.compare.historicalScriptFailures,aborted:v.compare.abortedPaths,
    overlappingPaths:v.compare.uniqueAffectedPaths,modelPreserved:v.modelPreserved,
    recovery:v.terminal.recovery?.status||null}));
   await context.close();context=null;await shutdown(server);server=null;
  }
  report.status='success';
  console.log('ISSUE180_SYNTHETIC_REPLAY_OK '+JSON.stringify({mode,cases:report.viewports.length,
   snapshots:report.viewports.map(x=>({viewport:[x.width,x.height],failed:x.compare.historicalScriptFailures,
    aborted:x.compare.abortedPaths,recovery:x.terminal.recovery?.status||null}))}));
 }catch(error){
  report.status='failure';report.failure=serializeError(error);report.failedStage=report.viewports.at(-1)?.stage||'setup';
  console.error('ISSUE180_SYNTHETIC_REPLAY_ERROR '+report.failure);process.exitCode=1;
 }finally{
  report.completedAt=new Date().toISOString();
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
  if(context)await context.close().catch(()=>{});
  if(server?.listening)await shutdown(server);
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
