// P10 round 3 diagnostic only. No user profile, no real origin, no assertions removed.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const OLD='96844424ceb534e7ca5f864a006b72a52efd0d60';
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p10-release-upgrade');
const port=43831,base='http://127.0.0.1:'+port+'/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const cacheAt=p=>fs.readFileSync(p,'utf8').match(/const CACHE\s*=\s*'([^']+)'/)?.[1];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wav':'audio/wav','.woff2':'font/woff2'};
const delay=t=>new Promise(r=>setTimeout(r,t));
const timed=(promise,t,label)=>Promise.race([promise,new Promise(r=>setTimeout(()=>r({probeTimeout:label}),t))]);
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
 const trace=(event,data={})=>events.push({time:new Date().toISOString(),event,...data});
 try{
  execFileSync('git',['worktree','add','--detach',oldDir,OLD],{cwd:root,stdio:'pipe'});
  const current=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const oldCache=cacheAt(path.join(oldDir,'dist/sw.js')),newCache=cacheAt(path.join(root,'dist/sw.js'));
  server=http.createServer((req,res)=>{
   const id=++seq,version=release,pathname=new URL(req.url,base).pathname;
   const rel=decodeURIComponent(pathname).replace(/^\/+/,'')||'index.html';
   if(rel.startsWith('..')||rel.includes('/../')){res.writeHead(400);res.end('bad path');return;}
   trace('http-request',{id,version,path:pathname,method:req.method});
   req.on('aborted',()=>trace('http-request-aborted',{id,path:pathname}));
   res.on('finish',()=>trace('http-response-finished',{id,path:pathname,status:res.statusCode}));
   res.on('close',()=>{if(!res.writableFinished)trace('http-connection-incomplete',{id,path:pathname,status:res.statusCode,headersSent:res.headersSent});});
   fs.readFile(path.join(version==='old'?oldDir:root,'dist',rel),(err,data)=>{
    if(err){res.writeHead(404);res.end('missing');return;}
    const headers={'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store','Service-Worker-Allowed':'/'};
    if(explicitLength)headers['Content-Length']=data.length;
    trace('http-respond',{id,version,path:pathname,bytes:data.length,digest:pathname==='/learn.html'?hash(data):null,lengthHeader:!!explicitLength});
    res.writeHead(200,headers);res.end(data);
   });
  });
  await new Promise(r=>server.listen(port,'127.0.0.1',r));
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
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
  const cases=[
   {name:'A-new-without-SW',blocked:true},
   {name:'B-fresh-new-SW'},
   {name:'C-upgrade-old-tab-open',upgrade:true},
   {name:'C-upgrade-old-tab-closed',upgrade:true,closeOld:true},
   {name:'C-upgrade-old-learning-online',upgrade:true,study:true},
   {name:'C-upgrade-offline-toggle',upgrade:true,offline:true},
   {name:'C-upgrade-offline-toggle-closed',upgrade:true,offline:true,closeOld:true},
   {name:'D-upgrade-bypass-SW',upgrade:true,bypass:true},
   {name:'E-upgrade-cleanup-after-old-close',upgrade:true,closeOld:true,cleanup:true},
   {name:'G-upgrade-content-length',upgrade:true,length:true}
  ];
  for(const cfg of cases){
   const rec={name:cfg.name,conditions:cfg,oldCommit:OLD,newCommit:current,oldCache,newCache};
   const eventStart=events.length;
   release=cfg.upgrade?'old':'new';explicitLength=!!cfg.length;
   const ctx=await browser.newContext({serviceWorkers:cfg.blocked?'block':'allow',viewport:{width:1280,height:800},reducedMotion:'reduce'});
   let oldPage,tab;
   ctx.on('serviceworker',w=>trace('worker-start',{case:cfg.name,url:w.url()}));
   try{
    if(cfg.upgrade){
     oldPage=await ctx.newPage();
     await oldPage.goto(base+'v2.html#trail',{waitUntil:'commit',timeout:14000});
     // Cache existence alone is not proof that the old worker can serve an offline navigation.
     // Wait for the actual controller, activated worker and precached learn document.
     await oldPage.waitForFunction(async name=>{
      const reg=await navigator.serviceWorker.getRegistration();
      if(reg?.active?.state!=='activated'||!navigator.serviceWorker.controller)return false;
      if(!(await caches.keys()).includes(name))return false;
      const cache=await caches.open(name);
      return !!(await cache.match(new URL('./learn.html',location.href)));
     },oldCache,{timeout:45000});
     rec.oldState=await timed(workerStatus(oldPage),4500,'old state');
     if(cfg.study){
      const online=await oldPage.goto(base+'learn.html#share',{waitUntil:'commit',timeout:12000});
      await oldPage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='share',null,{timeout:12000});
      await oldPage.locator('#actions [data-do="check"]').click();
      rec.onlineNavigation={status:online?.status(),fromSW:online?.fromServiceWorker()};
      rec.onlineStored=await oldPage.evaluate(()=>localStorage.getItem('math-explorer-v2')?.length||0);
     }
     if(cfg.offline){
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
   rec.events={from:eventStart,to:events.length};
   reports.push(rec);
   console.log('P10_ISOLATION_CASE '+JSON.stringify({name:rec.name,navigation:rec.navigation,setupError:rec.setupError,
    controllerCache:rec.before?.controller?.cache,activeCache:rec.before?.active?.cache,waitingCache:rec.before?.waiting?.cache}));
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
