// P10 round 3 diagnostic only. No user profile, no real origin, no assertions removed.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const OLD='96844424ceb534e7ca5f864a006b72a52efd0d60';
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p10-release-upgrade');
const port=Number(process.env.P10_ISOLATION_PORT||43831),base='http://127.0.0.1:'+port+'/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const cacheAt=p=>fs.readFileSync(p,'utf8').match(/const CACHE\s*=\s*'([^']+)'/)?.[1];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wav':'audio/wav','.woff2':'font/woff2'};
const delay=t=>new Promise(r=>setTimeout(r,t));
const timed=(promise,t,label)=>Promise.race([promise,new Promise(r=>setTimeout(()=>r({probeTimeout:label}),t))]);
// Explicit Node-side polling is required here. The previous CI's waitForFunction was followed by an entirely empty
// oldState and its first /sw.js request was served after release='new'.
// Keep all readiness evidence in the actual page execution context.
const waitForOldControl=async(p,name)=>{
 const started=Date.now();let last;
 while(Date.now()-started<75000){
  last=await p.evaluate(async cacheName=>{
   const reg=await navigator.serviceWorker.getRegistration();
   const keys=await caches.keys();
   let learnCached=false;
   if(keys.includes(cacheName)){
    const cache=await caches.open(cacheName);
    learnCached=!!(await cache.match(new URL('./learn.html',location.href)));
   }
   return {url:location.href,controllerURL:navigator.serviceWorker.controller?.scriptURL||null,
    activeURL:reg?.active?.scriptURL||null,activeState:reg?.active?.state||null,
    waitingState:reg?.waiting?.state||null,installingState:reg?.installing?.state||null,
    keys,learnCached};
  },name);
  if(last.controllerURL&&last.activeState==='activated'&&last.keys.includes(name)&&last.learnCached)return last;
  await delay(150);
 }
 throw Error('old worker never controlled a page with cached learn.html: '+JSON.stringify(last));
};
const workerStatus=async(p)=>p.evaluate(async()=>{
 const reg=await navigator.serviceWorker.getRegistration();
 const ask=w=>!w?Promise.resolve(null):new Promise(resolve=>{
  const channel=new MessageChannel(),timer=setTimeout(()=>resolve({error:'status timeout'}),2000);
  channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);};
  w.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
 });
 return {url:location.href,controller:await ask(navigator.serviceWorker.controller),active:await ask(reg?.active),
  waiting:await ask(reg?.waiting),activeState:reg?.active?.state,waitingState:reg?.waiting?.state,
  installingState:reg?.installing?.state,controllerURL:navigator.serviceWorker.controller?.scriptURL,
  keys:await caches.keys()};
});
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const oldDir=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-isolate-'));
 const events=[],reports=[],errors=[];
 let release='new',explicitLength=false,seq=0,server,browser;
 let currentCase='',lifecycleProbe=false;
 const trace=(event,data={})=>events.push({time:new Date().toISOString(),event,...data});
 try{
  execFileSync('git',['worktree','add','--detach',oldDir,OLD],{cwd:root,stdio:'pipe'});
  const current=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const oldCache=cacheAt(path.join(oldDir,'dist/sw.js')),newCache=cacheAt(path.join(root,'dist/sw.js'));
  server=http.createServer((req,res)=>{
   const id=++seq,version=release,pathname=new URL(req.url,base).pathname;
   if(pathname==='/__p10_probe'&&req.method==='POST'){
    let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{
     try{trace('worker-stage',{case:currentCase,...JSON.parse(body)});}catch(error){trace('probe-error',{error:String(error)});}
     res.writeHead(204);res.end();
    });return;
   }
   const rel=decodeURIComponent(pathname).replace(/^\/+/,'')||'index.html';
   if(rel.startsWith('..')||rel.includes('/../')){res.writeHead(400);res.end('bad path');return;}
   trace('http-request',{id,version,path:pathname,method:req.method});
   req.on('aborted',()=>trace('http-request-aborted',{id,path:pathname}));
   res.on('finish',()=>trace('http-response-finished',{id,path:pathname,status:res.statusCode}));
   res.on('close',()=>{if(!res.writableFinished)trace('http-connection-incomplete',{id,path:pathname,status:res.statusCode,headersSent:res.headersSent});});
   fs.readFile(path.join(version==='old'?oldDir:root,'dist',rel),(err,data)=>{
    if(err){res.writeHead(404);res.end('missing');return;}
    if(rel==='sw.js'&&version==='new'&&lifecycleProbe)data=Buffer.from(lifecycleTrace('new')+data.toString());
    const headers={'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store','Service-Worker-Allowed':'/'};
    if(explicitLength)headers['Content-Length']=data.length;
    trace('http-respond',{id,version,path:pathname,bytes:data.length,digest:pathname==='/learn.html'?hash(data):null,lengthHeader:!!explicitLength});
    res.writeHead(200,headers);res.end(data);
   });
  });
  await new Promise(r=>server.listen(port,'127.0.0.1',r));
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  // Verify the pinned runner's async-predicate semantics without a service worker.
  // A false Promise must never be used as proof of real readiness.
  const controlContext=await browser.newContext(),controlPage=await controlContext.newPage();
  const controlStart=Date.now();
  const asyncFalse=await controlPage.waitForFunction(async()=>false,null,{timeout:1000});
  reports.push({name:'async-predicate-control',value:await asyncFalse.jsonValue(),elapsedMs:Date.now()-controlStart});
  await controlContext.close();
  // A direct response and server version mapping baseline, not a browser assertion.
  const httpCheck={name:'G-direct-HTTP-old-vs-new',versions:[]};
  for(const version of ['old','new']){
   release=version;
   const res=await fetch(base+'learn.html'),data=Buffer.from(await res.arrayBuffer());
   const expected=fs.readFileSync(path.join(version==='old'?oldDir:root,'dist/learn.html'));
   httpCheck.versions.push({version,status:res.status,contentType:res.headers.get('content-type'),receivedBytes:data.length,
    expectedBytes:expected.length,matchingDigest:hash(data)===hash(expected)});
  }
  reports.push(httpCheck);
  const oldSwFile=path.join(oldDir,'dist/sw.js');
  const historicalSw=fs.readFileSync(oldSwFile,'utf8');
  const oldFetchGuard="if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname==='/health')return;";
  if(historicalSw.split(oldFetchGuard).length!==2)throw Error('historical SW fetch guard changed');
  // N: locate Cache API/body completion. O: correlate only lifecycle/extended
  // event completion when N cannot explain the blocked transition. Persist
  // diagnostic events outside the worker so termination cannot erase them.
  const nTrace = `
self.__p10Trace=[];
const p10Trace=(op,detail={})=>{const entry={workerTime:Date.now(),op,...detail};self.__p10Trace.push(entry);fetch(new URL('/__p10_probe',self.location.origin),{method:'POST',body:JSON.stringify(entry)}).catch(()=>{});};
self.addEventListener('install',()=>p10Trace('install:event'));
self.addEventListener('activate',()=>p10Trace('activate:event'));
self.addEventListener('message',e=>p10Trace('message:event',{type:e.data?.type,ports:e.ports.length}));
`;
  const nVariant=copy=>nTrace+historicalSw.replace(oldFetchGuard,oldFetchGuard+`
 if(url.pathname==='/learn.html'){
  p10Trace('fetch:event',{url:event.request.url,copy:${copy}});
  const responsePromise=(async()=>{
   p10Trace('cache.open:start');const cache=await caches.open(CACHE);p10Trace('cache.open:done');
   p10Trace('cache.match:start');const response=await cache.match(event.request,{ignoreSearch:true});
   p10Trace('cache.match:done',{found:!!response,status:response?.status,headers:response?[...response.headers]:null,bodyUsed:response?.bodyUsed});
   if(!response)throw Error('old learn.html cache missing');
   p10Trace('body.arrayBuffer:start');const bytes=await response.clone().arrayBuffer();
   p10Trace('body.arrayBuffer:done',{bytes:bytes.byteLength,bodyUsed:response.bodyUsed});
   const result=${copy}?new Response(bytes,{status:response.status,statusText:response.statusText,headers:response.headers}):response;
   p10Trace('response.promise:return',{copy:${copy}});return result;
  })();
  responsePromise.then(()=>p10Trace('response.promise:fulfilled'),error=>p10Trace('response.promise:rejected',{error:String(error)}));
  event.respondWith(responsePromise);p10Trace('respondWith:registered');return;
 }
`);
  const lifecycleTrace=version=>nTrace+`
const p10Version=${JSON.stringify(version)};
for(const [object,key]of [[self,'skipWaiting'],[self.clients,'claim']]){
 const original=object[key].bind(object);object[key]=(...args)=>{
  p10Trace(key+':start',{version:p10Version});
  return original(...args).then(value=>{p10Trace(key+':done',{version:p10Version});return value;},error=>{p10Trace(key+':error',{version:p10Version,error:String(error)});throw error;});
 };
}
for(const key of ['keys','delete']){
 const original=caches[key].bind(caches);caches[key]=(...args)=>{
  p10Trace('caches.'+key+':start',{version:p10Version,args});
  return original(...args).then(value=>{p10Trace('caches.'+key+':done',{version:p10Version,value});return value;});
 };
}
for(const key of ['addAll','match','put']){
 const original=Cache.prototype[key];Cache.prototype[key]=function(...args){
  const url=String(args[0]?.url||args[0]),watch=key==='addAll'||/\\/(learn|v2)\\.html/.test(url);
  if(watch)p10Trace('cache.'+key+':start',{version:p10Version,url});
  return original.apply(this,args).then(value=>{if(watch)p10Trace('cache.'+key+':done',{version:p10Version,url});return value;},error=>{if(watch)p10Trace('cache.'+key+':error',{version:p10Version,error:String(error)});throw error;});
 };
}
const p10Wait=ExtendableEvent.prototype.waitUntil;
ExtendableEvent.prototype.waitUntil=function(promise){
 const url=this.request?.url||'',type=this.type,watch=type!=='fetch'||/\\/(learn|v2)\\.html/.test(url);
 if(watch){p10Trace('waitUntil:start',{version:p10Version,type,url});Promise.resolve(promise).then(()=>p10Trace('waitUntil:done',{version:p10Version,type,url}),error=>p10Trace('waitUntil:error',{version:p10Version,type,url,error:String(error)}));}
 return p10Wait.call(this,promise);
};
self.addEventListener('fetch',event=>{if(/\\/(learn|v2)\\.html/.test(event.request.url))p10Trace('fetch:dispatch',{version:p10Version,url:event.request.url});});
`;
  const cases=process.env.P10_SW_CACHE_PROBE==='1'?[
   {name:'N1-old-cache-original-response',upgrade:true,diagnosticMode:'cacheOriginal'},
   {name:'N2-old-cache-copied-response',upgrade:true,diagnosticMode:'cacheCopy'},
   {name:'O-lifecycle-and-cache',upgrade:true,diagnosticMode:'lifecycle'}
  ]:[
   {name:'C-original-transition-timing',upgrade:true},
   {name:'C-verified-new-controller',upgrade:true,strictReady:true}
  ];
  for(const cfg of cases){
   currentCase=cfg.name;lifecycleProbe=cfg.diagnosticMode==='lifecycle';
   const rec={name:cfg.name,conditions:cfg,oldCommit:OLD,newCommit:current,oldCache,newCache};
   const eventStart=events.length;
   const oldSwVariant=cfg.diagnosticMode==='cacheOriginal'?nVariant(false):
    cfg.diagnosticMode==='cacheCopy'?nVariant(true):
    cfg.diagnosticMode==='lifecycle'?lifecycleTrace('old'):historicalSw;
   fs.writeFileSync(oldSwFile,oldSwVariant);
   rec.historicalSwModifiedForDiagnosis=oldSwVariant!==historicalSw;
   rec.oldSwVariant=cfg.diagnosticNoRuntimeWrite?'no-runtime-write':cfg.diagnosticMode||'untouched';
   rec.actualOldSwDigest=hash(oldSwVariant);
   release=cfg.upgrade?'old':'new';explicitLength=!!cfg.length;
   const ctx=await browser.newContext({serviceWorkers:cfg.blocked?'block':'allow',viewport:{width:1280,height:800},reducedMotion:'reduce'});
   let oldPage,tab;const workers=[];
   ctx.on('console',m=>{if(m.text().startsWith('P10_SW_N '))trace('worker-stage',{case:cfg.name,text:m.text()});});
   ctx.on('serviceworker',w=>workers.push(w));
   await ctx.addInitScript(()=>{
    window.__p10Lifecycle=[];const log=(event,detail={})=>window.__p10Lifecycle.push({time:Date.now(),event,...detail});
    navigator.serviceWorker?.addEventListener('controllerchange',()=>log('controllerchange',{state:navigator.serviceWorker.controller?.state}));
    navigator.serviceWorker?.getRegistration().then(reg=>{if(!reg)return;reg.addEventListener('updatefound',()=>{const worker=reg.installing;log('updatefound',{state:worker?.state});worker?.addEventListener('statechange',()=>log('statechange',{state:worker.state}));});});
   });
   ctx.on('serviceworker',w=>trace('worker-start',{case:cfg.name,url:w.url()}));
   try{
    if(cfg.upgrade){
     oldPage=await ctx.newPage();
     await oldPage.goto(base+'v2.html#trail',{waitUntil:'commit',timeout:14000});
     // Old worker must actually install while the server is still serving OLD.
     // Previous comparisons observed an empty oldState, so their old-worker
     // precondition was not demonstrated even though the wait appeared to pass.
     rec.oldState=await waitForOldControl(oldPage,oldCache);
     const oldSwRequests=events.slice(eventStart).filter(e=>e.event==='http-request'&&e.version==='old'&&e.path==='/sw.js');
     if(oldSwRequests.length===0)throw Error('old /sw.js was never served by the old release');
     rec.oldSwRequestIds=oldSwRequests.map(e=>e.id);
     trace('old-worker-controlled',{case:cfg.name,state:rec.oldState,oldSwRequestIds:rec.oldSwRequestIds});
     if(cfg.study){
      const online=await oldPage.goto(base+'learn.html#share',{waitUntil:'commit',timeout:12000});
      await oldPage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='share',null,{timeout:12000});
      await oldPage.locator('#actions [data-do="check"]').click();
      rec.onlineNavigation={status:online?.status(),fromSW:online?.fromServiceWorker()};
      rec.onlineStored=await oldPage.evaluate(()=>localStorage.getItem('math-explorer-v2')?.length||0);
     }
     if(cfg.offline){
      rec.beforeOffline=await oldPage.evaluate(async()=>({
       controllerURL:navigator.serviceWorker.controller?.scriptURL||null,
       activeState:(await navigator.serviceWorker.getRegistration())?.active?.state||null,
       cacheKeys:await caches.keys()
      }));
      if(!rec.beforeOffline.controllerURL)throw Error('old worker lost control before offline toggle');
      await ctx.setOffline(true);
      const offlineResponse=await oldPage.goto(base+'learn.html#share',{waitUntil:'commit',timeout:12000});
      rec.offlineNavigation={status:offlineResponse?.status(),fromSW:offlineResponse?.fromServiceWorker()};
      await oldPage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='share',null,{timeout:12000});
      await oldPage.locator('#actions [data-do="check"]').click();
      rec.offlineStored=await oldPage.evaluate(()=>localStorage.getItem('math-explorer-v2')?.length||0);
      await ctx.setOffline(false);
      rec.afterOfflineRecovery=await timed(workerStatus(oldPage),4500,'recovered old worker');
     }
     release='new';
    }
    tab=await ctx.newPage();
    tab.on('request',r=>{if(r.isNavigationRequest())trace('nav-request',{case:cfg.name,url:r.url()});});
    tab.on('response',r=>{if(r.request().isNavigationRequest())trace('nav-response',{case:cfg.name,url:r.url(),status:r.status(),fromSW:r.fromServiceWorker()});});
    tab.on('requestfailed',r=>trace('request-failure',{case:cfg.name,url:r.url(),reason:r.failure()}));
    tab.on('pageerror',e=>errors.push({case:cfg.name,error:String(e)}));
    const entry=await tab.goto(base+'v2.html#trail',{waitUntil:'commit',timeout:14000});
    rec.entry={status:entry?.status(),fromSW:entry?.fromServiceWorker()};
    if(!cfg.blocked){
     await tab.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update();});
     await tab.waitForFunction(async name=>{
      const reg=await navigator.serviceWorker.getRegistration();
      return reg?.active?.state==='activated'&&(await caches.keys()).includes(name);
     },newCache,{timeout:30000});
    }
    if(cfg.strictReady){
     const readyStart=Date.now();let ready;
     do{
      ready=await workerStatus(tab);
      if(ready.activeState==='activated'&&!ready.waitingState&&!ready.installingState&&ready.active?.cache===newCache&&ready.active.complete&&ready.controller?.cache===newCache&&ready.controller.complete)break;
      await delay(150);
     }while(Date.now()-readyStart<45000);
     rec.verifiedReady=ready;
     if(!(ready.active?.cache===newCache&&ready.active.complete&&ready.controller?.cache===newCache&&ready.controller.complete&&!ready.waitingState&&!ready.installingState))throw Error('real active/controller generation not ready: '+JSON.stringify(ready));
    }
    rec.before=await timed(workerStatus(tab),4500,'before navigation');
    if(cfg.closeOld){await oldPage.close();oldPage=null;}
    if(cfg.cleanup){
     rec.cleanup=await timed(tab.evaluate(()=>new Promise(async resolve=>{
      const reg=await navigator.serviceWorker.ready;const ch=new MessageChannel();
      const timer=setTimeout(()=>resolve({error:'cleanup-response-timeout'}),4500);
      ch.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);};
      reg.active.postMessage({type:'math-explorer:cleanup-retired-caches'},[ch.port2]);
     })),5800,'cleanup evaluate');
     rec.afterCleanup=await timed(workerStatus(tab),4500,'after cleanup');
    }
    if(cfg.bypass){
     const session=await ctx.newCDPSession(tab);
     await session.send('Network.enable');
     await session.send('Network.setBypassServiceWorker',{bypass:true});
     session.on('Network.loadingFailed',e=>trace('cdp-loading-failed',{case:cfg.name,error:e.errorText,canceled:e.canceled}));
    }
    const start=Date.now();
    try{
     const response=await tab.goto(base+'learn.html#share',{waitUntil:'commit',timeout:9000});
     rec.navigation={committed:true,status:response?.status(),fromSW:response?.fromServiceWorker(),elapsedMs:Date.now()-start};
     try{await tab.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='share',null,{timeout:4500});rec.appLoaded=true;}
     catch(e){rec.appLoaded=false;rec.appError=String(e);}
     rec.after=await timed(workerStatus(tab),4500,'after navigation');
     await tab.screenshot({path:path.join(out,'isolation-'+cfg.name+'.png'),timeout:3500}).catch(()=>{});
    }catch(e){rec.navigation={committed:false,error:String(e),elapsedMs:Date.now()-start};}
   }catch(e){rec.setupError=String(e);}
   rec.workerTraces=[];
   for(const worker of workers)rec.workerTraces.push(await timed(worker.evaluate(()=>({trace:self.__p10Trace||[],url:self.location.href})).catch(e=>({error:String(e)})),1500,'worker trace'));
   if(tab&&!tab.isClosed())rec.lifecycle=await timed(tab.evaluate(()=>window.__p10Lifecycle||[]).catch(e=>({error:String(e)})),1500,'page lifecycle');
   rec.events={from:eventStart,to:events.length};
   reports.push(rec);
   console.log('P10_ISOLATION_CASE '+JSON.stringify({name:rec.name,navigation:rec.navigation,setupError:rec.setupError,
    controllerCache:rec.before?.controller?.cache,activeCache:rec.before?.active?.cache,waitingCache:rec.before?.waiting?.cache,
    activeState:rec.before?.activeState,waitingState:rec.before?.waitingState,oldControlled:!!rec.oldState?.controllerURL,oldLearnCached:rec.oldState?.learnCached}));
   await timed(ctx.close().catch(()=>{}),5000,'context close');
  }
  fs.writeFileSync(path.join(out,'isolation-results.json'),JSON.stringify({oldCommit:OLD,newCommit:current,oldCache,newCache,reports,errors},null,2));
  fs.writeFileSync(path.join(out,'isolation-http-events.json'),JSON.stringify(events,null,2));
  console.log('P10_ISOLATION_DONE; diagnostic only, not P10 acceptance');
 }catch(e){
  fs.writeFileSync(path.join(out,'isolation-failure.json'),JSON.stringify({message:String(e),stack:e.stack,reports,events:events.slice(-100)},null,2));
  console.error('P10_ISOLATION_FATAL '+String(e));process.exitCode=1;
 }finally{
  if(browser)await timed(browser.close().catch(()=>{}),5000,'browser close');
  if(server)await timed(new Promise(r=>server.close(r)),5000,'server close');
  try{execFileSync('git',['worktree','remove','--force',oldDir],{cwd:root,stdio:'pipe'});}catch{}
  try{fs.rmSync(oldDir,{recursive:true,force:true});}catch{}
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
