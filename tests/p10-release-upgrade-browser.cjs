// P10 R3: two genuine Git revisions, one origin, real SW/cache/localStorage.
 // Uses the real app and native graders; generated legacy samples are NOT child backups.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const OLD='96844424ceb534e7ca5f864a006b72a52efd0d60';
const root=path.resolve(__dirname,'..'),out=process.env.P10_UPGRADE_OUTPUT||path.join(root,'verification/p10-release-upgrade');
const port=Number(process.env.P10_UPGRADE_PORT||43829),base='http://127.0.0.1:'+port+'/';
const checks=[],scenarios=[],errors=[];
const check=(condition,label,detail={})=>{assert.ok(condition,label);checks.push(label);scenarios.push({label,result:'A',...detail});};
const read=page=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
const cacheFrom=file=>fs.readFileSync(file,'utf8').match(/const CACHE\s*=\s*'([^']+)'/)?.[1];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wav':'audio/wav','.woff2':'font/woff2'};
// Playwright 1.56.1 tests the predicate's immediate truthiness: an async
// predicate is a truthy Promise even when it later resolves false. Await the
// page result in Node and explicitly require true before leaving this gate.
const poll=async(page,predicate,arg,label,timeout=90000,onSample=()=>{})=>{
 const end=Date.now()+timeout;let last;
 while(Date.now()<end){
  let timer;
  try{last=await Promise.race([page.evaluate(predicate,arg),new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error(label+' page probe did not settle')),Math.min(6000,end-Date.now()));
  })]);}finally{clearTimeout(timer);}
  onSample(last);
  if(last===true||last?.ready===true)return last;
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw Error(label+' did not become ready: '+JSON.stringify(last));
};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const file of ['results.json','failure.json','diagnostics.json'])fs.rmSync(path.join(out,file),{force:true});
 const oldPath=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-old-'));
 const profileRoot=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-release-profile-'));
 let server,browser,ctx,diagnosticPage,browserVersion;
 let primaryLaunches=0;
 const diagnosticWorkers=[];
 const gitValue=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const current=gitValue(['rev-parse','HEAD']);
 const githubEvent=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={checkoutSha:current,checkoutTree:gitValue(['rev-parse','HEAD^{tree}']),prHeadSha:githubEvent.pull_request?.head?.sha||null,
  nodeVersion:process.version,playwrightVersion:require((process.env.MATH_PLAYWRIGHT_MODULE||'playwright')+'/package.json').version,
  profileId:path.basename(profileRoot),historicalWorkerModified:false};
 const trace=[];let requestSeq=0;
 const record=(event,details={})=>{trace.push({time:new Date().toISOString(),monotonicMs:Number(process.hrtime.bigint()/1000000n),event,...details});};
 try{
  execFileSync('git',['worktree','add','--detach',oldPath,OLD],{cwd:root,stdio:'pipe'});
  const oldCache=cacheFrom(path.join(oldPath,'dist/sw.js'));
  const newCache=cacheFrom(path.join(root,'dist/sw.js'));
  provenance.oldWorkerSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(oldPath,'dist/sw.js'))).digest('hex');
  provenance.newWorkerSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'dist/sw.js'))).digest('hex');
  check(!!oldCache&&!!newCache&&oldCache!==newCache,'distinct genuine release Service Worker manifests',{oldCommit:OLD,oldCache,newCache});
  let release='old',deny='',offlineServing=false,holdPath='',heldResponse=null;
  server=http.createServer((req,res)=>{
   const requestId=++requestSeq;
   const pathname=new URL(req.url,base).pathname;
   const rel=decodeURIComponent(pathname).replace(/^\/+/,'')||'index.html';
   if(rel.startsWith('..')||rel.includes('/../')){res.writeHead(400);return res.end('invalid path');}
   const version=release;
   record('server-request',{requestId,path:pathname,release:version,denied:rel===deny,method:req.method});
   req.once('aborted',()=>record('server-request-aborted',{requestId,path:pathname,release:version}));
   res.once('finish',()=>record('server-response-finished',{requestId,path:pathname,release:version,status:res.statusCode,headersSent:res.headersSent}));
   res.once('close',()=>{if(!res.writableFinished)record('server-response-incomplete',{requestId,path:pathname,release:version,status:res.statusCode,headersSent:res.headersSent});});
   if(offlineServing){record('server-offline',{requestId,path:pathname});req.socket.destroy();return;}
   if(rel===deny){res.writeHead(503,{'Content-Type':'text/plain','Cache-Control':'no-store'});return res.end('P10 controlled missing resource');}
   if(rel===holdPath){heldResponse=res;record('server-response-held',{requestId,path:pathname});return;}
   const src=path.join(release==='old'?oldPath:root,'dist',rel);
   fs.readFile(src,(err,data)=>{
    if(err){res.writeHead(404);return res.end('not found');}
    record('server-response-start',{requestId,path:pathname,release:version,bytes:data.length});
    res.writeHead(200,{'Content-Type':mime[path.extname(src)]||'application/octet-stream','Cache-Control':'no-store','Service-Worker-Allowed':'/'});
    res.end(data);
   });
  });
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
  const launchOptions={headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})};
  const observeContext=(context,label)=>context.on('serviceworker',worker=>{
   record('worker-created',{profile:label,url:worker.url()});
   if(process.env.P10_SW_DIAGNOSTIC!=='1')return;
   diagnosticWorkers.push({worker,profile:label});
   // Opt-in diagnostic instrumentation touches only the new worker's runtime;
   // no historical file or historical worker is changed for acceptance runs.
   worker.evaluate(expected=>{
    if(typeof CACHE==='undefined'||CACHE!==expected)return;
    globalThis.__p10SWEvents=[];
    const log=(step,details={})=>__p10SWEvents.push({time:Date.now(),step,...details});
    for(const method of ['open','keys','delete']){
     const original=caches[method].bind(caches);
     caches[method]=(...args)=>{
      log('caches.'+method+':enter',{args});
      return original(...args).then(value=>{log('caches.'+method+':complete',{args,result:method==='open'?'Cache':value});return value;},error=>{log('caches.'+method+':error',{error:String(error)});throw error;});
     };
    }
    const post=MessagePort.prototype.postMessage;
    MessagePort.prototype.postMessage=function(...args){log('port:postMessage',{data:args[0]});return post.apply(this,args);};
    self.addEventListener('message',event=>log('message:received',{data:event.data,ports:event.ports.length,client:event.source?.id}));
    self.addEventListener('activate',()=>log('activate'));
   },newCache).catch(error=>record('worker-probe-error',{profile:label,error:String(error)}));
  });
  const openPrimary=async(offline=false)=>{
   const context=await chromium.launchPersistentContext(path.join(profileRoot,'upgrade'),{
    ...launchOptions,viewport:{width:1440,height:900},acceptDownloads:true,serviceWorkers:'allow',reducedMotion:'reduce',offline});
   primaryLaunches++;browserVersion=context.browser().version();
   observeContext(context,'upgrade');
   await context.addInitScript(()=>{try{window.__p10BeforeApp=localStorage.getItem('math-explorer-v2');}catch{}});
   record('persistent-browser-opened',{profile:'upgrade',launch:primaryLaunches,offline});return context;
  };
  ctx=await openPrimary();
  let page=ctx.pages()[0]||await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  const lesson=async(p,id)=>{
   const response=await p.goto(base+'learn.html#'+id,{waitUntil:'commit',timeout:45000});
   await p.waitForFunction(s=>window.mathLesson?.snapshot()?.id===s,id,{timeout:30000});
   return response;
  };
  const offlineReload=async(p,id,label)=>{
   const response=await p.reload({waitUntil:'commit',timeout:45000});
   await p.waitForFunction(s=>window.mathLesson?.snapshot()?.id===s,id,{timeout:30000});
   check(response?.status()===200&&response.fromServiceWorker(),label);
  };
  const oldActive=async(p)=>poll(p,async name=>{
   const reg=await navigator.serviceWorker.getRegistration();
   const keys=await caches.keys();
   const cached=keys.includes(name)&&!!await (await caches.open(name)).match(new URL('./learn.html',location.href));
   return {ready:reg?.active?.state==='activated'&&navigator.serviceWorker.controller===reg.active&&cached,
    activeState:reg?.active?.state,controllerState:navigator.serviceWorker.controller?.state,keys,cached};
  },oldCache,'historical worker active and controlling');
  // Do not mistake a complete waiting worker cache for an activated release.
  // scriptURL is identical across generations; the new message protocol and
  // cache identity establish the generation only on active AND controller.
  const newReady=async(p)=>{
   let previous='';
   const status=await poll(p,async name=>{
   const reg=await navigator.serviceWorker.getRegistration();
   const state={ready:false,activeState:reg?.active?.state||null,controllerState:navigator.serviceWorker.controller?.state||null,
    waitingState:reg?.waiting?.state||null,installingState:reg?.installing?.state||null};
   if(!reg?.active||reg.active.state!=='activated'||!navigator.serviceWorker.controller)return state;
   if(reg.waiting||reg.installing)return state;
   state.keys=await caches.keys();
   if(!state.keys.includes(name))return state;
   const ask=worker=>new Promise(resolve=>{
    const c=new MessageChannel();
    const done=value=>{clearTimeout(timer);c.port1.close();resolve(value);};
    const timer=setTimeout(()=>done(null),1200);
    c.port1.onmessage=e=>done(e.data);
    try{worker.postMessage({type:'math-explorer:cache-status'},[c.port2]);}catch{done(null);}
   });
   const activeWorker=reg.active,controllerWorker=navigator.serviceWorker.controller;
   const [active,controller]=await Promise.all([ask(activeWorker),ask(controllerWorker)]);
   return {...state,ready:active?.cache===name&&active.complete===true&&controller?.cache===name&&controller.complete===true&&
    activeWorker===reg.active&&controllerWorker===navigator.serviceWorker.controller&&activeWorker===controllerWorker&&
    reg.active.state==='activated'&&!reg.waiting&&!reg.installing,active,controller,activeState:reg.active?.state};
   },newCache,'new worker active, controlling and complete',90000,sample=>{
    const serialized=JSON.stringify(sample);
    if(serialized!==previous){record('new-worker-readiness',{url:p.url(),status:sample});previous=serialized;}
   });
   record('new-worker-ready',{url:p.url(),status});return status;
  };
  const cleanup=async(p,profile,{requireComplete=true}={})=>{
   const end=Date.now()+12000;let attempt=0,last;
   while(Date.now()<end){
    const remaining=end-Date.now();let timer;
    record('cleanup-send',{profile,url:p.url(),attempt:++attempt,remainingMs:remaining});
    try{
     last=await Promise.race([p.evaluate(timeout=>new Promise((resolve,reject)=>{
      const worker=navigator.serviceWorker.controller;
      if(worker?.state!=='activated'){reject(Error('cleanup controller is not activated'));return;}
      const channel=new MessageChannel();
      const done=(error,value)=>{clearTimeout(timer);channel.port1.close();error?reject(error):resolve(value);};
      const timer=setTimeout(()=>done(Error('cache cleanup response timed out')),timeout);
      channel.port1.onmessage=e=>done(null,e.data);
      try{worker.postMessage({type:'math-explorer:cleanup-retired-caches'},[channel.port2]);}catch(error){done(error);}
     }),remaining),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('cache cleanup exceeded its 12 second budget')),remaining);})]);
    }finally{clearTimeout(timer);}
    record('cleanup-reply',{profile,attempt,report:last});
    assert.equal(last?.type,'math-explorer:cleanup-retired-caches','cleanup must reply on its own protocol');
    assert.equal(last.cache,newCache,'cleanup must reply from the expected new generation');
    if(!requireComplete||last.complete===true)return last;
    if(last.deferred!==true)throw Error('cache cleanup failed without a retryable deferral: '+JSON.stringify(last));
    // A concurrent page-load sweep may still be reporting the client we just
    // closed. Retry explicitly within the original deadline; never force delete.
    await new Promise(resolve=>setTimeout(resolve,Math.min(100,Math.max(0,end-Date.now()))));
   }
   throw Error('cache cleanup stayed deferred within its 12 second budget: '+JSON.stringify(last));
  };
  await page.goto(base+'v2.html#trail');
  await oldActive(page);
  check((await page.evaluate(()=>caches.keys())).includes(oldCache),'old release installed real Cache Storage');
  await lesson(page,'equivalent');
  await page.locator('#actions [data-do="check"]').click();
  check(await page.locator('#scene').getAttribute('data-stage')==='revise','old native fraction check records wrong attempt');
  await page.locator('#actions [data-do="hint"]').click();
  for(const [row,index] of [[0,1],[1,2],[2,3]])
   await page.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
  await page.locator('#actions [data-do="check"]').click();
  check(await page.locator('#scene').getAttribute('data-stage')==='passed','old release real grader passes corrected fraction');
  await page.locator('#actions [data-do="next"]').click();
  await page.locator('input[data-field="mark"]').fill('4');
  await page.locator('#actions [data-do="check"]').click();
  check(await page.locator('#scene').getAttribute('data-stage')==='passed','old fraction task 2 checked');
  await page.locator('#actions [data-do="next"]').click();
  await page.locator('input[data-field="mark"]').fill('6');
  await page.locator('#actions [data-do="check"]').click();
  check(await page.locator('#scene').getAttribute('data-stage')==='passed','old fraction task 3 checked');
  await page.locator('#actions [data-do="next"]').click();
  await page.locator('#note').fill('真正升级以前记录的旧版分数解释：同一整体可以有不同等分。');
  await page.locator('[data-do="save-note"]').click();
  check(JSON.parse(await read(page)).lessons.equivalent.notes.length===1,'old full lesson saved an authored explanation');
  const beforeOldRestart=await read(page);
  await ctx.close();record('persistent-browser-closed',{profile:'upgrade',release:'old'});
  ctx=await openPrimary();
  page=ctx.pages()[0]||await ctx.newPage();page.on('pageerror',e=>errors.push(String(e)));
  await lesson(page,'equivalent');
  check(await page.evaluate(()=>window.__p10BeforeApp)===beforeOldRestart,'full historical browser restart preserves stored records byte-for-byte before app startup');
  check(JSON.parse(await read(page)).lessons.equivalent.cases[0].attempts.length===2,'closing and reopening old browser preserves both attempts');
  offlineServing=true;await ctx.setOffline(true);
  await lesson(page,'share');
  await offlineReload(page,'share','historical offline reload receives cached 200 document from Service Worker');
  await page.locator('#actions [data-do="check"]').click();
  check(JSON.parse(await read(page)).lessons.share.cases[0].attempts.length===1,'old release accepts a real offline math attempt');
  offlineServing=false;await ctx.setOffline(false);
  const beforeUpgrade=await read(page);
  fs.writeFileSync(path.join(out,'before-upgrade.json'),beforeUpgrade);
  const oldTab=page;
  // This page keeps the old release JS loaded while another tab upgrades SW.
  release='new';
  let newTab=await ctx.newPage();newTab.on('pageerror',e=>errors.push(String(e)));
  diagnosticPage=newTab;
  // CDP events retain requestId/loaderId/frameId, which Playwright request
  // events and server timestamps cannot reliably correlate on their own.
  const cdp=await ctx.newCDPSession(newTab);
  await cdp.send('Network.enable');
  cdp.on('Network.requestWillBeSent',e=>record('cdp-request',{requestId:e.requestId,loaderId:e.loaderId,frameId:e.frameId,url:e.request?.url,type:e.type,initiator:e.initiator?.type}));
  cdp.on('Network.responseReceived',e=>record('cdp-response',{requestId:e.requestId,loaderId:e.loaderId,frameId:e.frameId,url:e.response?.url,status:e.response?.status,fromServiceWorker:e.response?.fromServiceWorker}));
  cdp.on('Network.loadingFinished',e=>record('cdp-finished',{requestId:e.requestId,encodedDataLength:e.encodedDataLength}));
  cdp.on('Network.loadingFailed',e=>record('cdp-failed',{requestId:e.requestId,errorText:e.errorText,canceled:e.canceled,blockedReason:e.blockedReason}));
  cdp.on('Page.frameNavigated',e=>record('cdp-navigation-committed',{frameId:e.frame?.id,url:e.frame?.url,loaderId:e.frame?.loaderId}));
  await cdp.send('Page.enable');
  newTab.on('request',req=>record('new-tab-request',{url:req.url(),kind:req.resourceType()}));
  newTab.on('response',res=>record('new-tab-response',{url:res.url(),status:res.status()}));
  newTab.on('requestfailed',req=>record('new-tab-request-failed',{url:req.url(),reason:req.failure()}));
  await newTab.goto(base+'v2.html#trail');
  await newTab.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});
  await newReady(newTab);
  const afterUpgrade=await read(newTab);
  fs.writeFileSync(path.join(out,'after-upgrade.json'),afterUpgrade);
  assert.deepEqual(JSON.parse(afterUpgrade),JSON.parse(beforeUpgrade),'upgrade must not rewrite saved learner records');
  assert.equal(afterUpgrade,beforeUpgrade,'upgrade must preserve the exact stored JSON bytes');
  check(true,'real old-to-new SW update leaves full records byte-equivalent');
  const newKeysBefore=await newTab.evaluate(()=>caches.keys());
  check(newKeysBefore.includes(newCache),'new release installs complete real Cache Storage',{cacheKeys:newKeysBefore});
  check(newKeysBefore.includes(oldCache),'new activation retains offline resources used by the historical open tab',{cacheKeys:newKeysBefore});
  const deferred=await cleanup(newTab,'upgrade-old-tab-open',{requireComplete:false});
  check(deferred.deferred===true&&deferred.complete===false&&deferred.reason==='legacy-or-unknown-client',
   'explicit cleanup defers while historical JavaScript is still open',{deferred});
  check((await newTab.evaluate(()=>caches.keys())).includes(oldCache),'deferred cleanup does not delete the historical tab cache');
  // Retain the old JS tab THROUGH the new release and prove the persisted model
  // cannot be silently overwritten by stale code.
  record('before-new-lesson',{worker:await newTab.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();return {
   controller:navigator.serviceWorker.controller?.scriptURL,active:reg?.active?.scriptURL,
   activeState:reg?.active?.state,waiting:reg?.waiting?.scriptURL,waitingState:reg?.waiting?.state,
   installingState:reg?.installing?.state,keys:await caches.keys()
  };})});
  record('navigation-begin',{target:base+'learn.html#share'});
  await lesson(newTab,'share');
  record('navigation-success',{target:base+'learn.html#share'});
  await newTab.locator('#actions [data-do="check"]').click();
  const savedNew=await read(newTab);
  await oldTab.locator('#actions [data-do="check"]').click();
  check((await oldTab.locator('#storage-warning').innerText()).includes('已停止覆盖'),'old tab blocks overwrite after new tab changes same task');
  check(await read(oldTab)===savedNew,'old tab cannot erase newer release submission');
  await oldTab.screenshot({path:path.join(out,'old-tab-conflict.png')});
  await oldTab.close();
  // A controller change does not replace the historical document's loaded JS.
  // After its tab has closed, request current-worker cleanup and require eviction.
  await newReady(newTab);
  const finalReport=await cleanup(newTab,'upgrade');
  const newKeys=await newTab.evaluate(()=>caches.keys());
  console.log('P10_CACHE_FINAL '+JSON.stringify({finalReport,newKeys}));
  check(finalReport.cache===newCache&&finalReport.complete===true&&newKeys.includes(newCache)&&!newKeys.includes(oldCache),'new SW activated and retired old cache cleaned',{cacheKeys:newKeys});
  // B39 was NEVER opened online on this profile. Its dynamic module must load offline.
  offlineServing=true;await ctx.setOffline(true);
  await lesson(newTab,'calculator39');
  check(await newTab.locator('#work').isVisible(),'never-visited B39 task and true grader module load offline');
  await offlineReload(newTab,'calculator39','B39 offline document reload is served from Service Worker cache');
  await lesson(newTab,'argument38');
  await newTab.locator('[data-x="r38-card"][data-index="wrong"]').click();
  await newTab.locator('#actions [data-do="check"]').click();
  check(await newTab.locator('#scene').getAttribute('data-stage')==='revise','new release grades offline reasoning error');
  await newTab.locator('[data-x="r38-undo"]').click();
  for(const id of ['given','sum','two','answer'])await newTab.locator('[data-x="r38-card"][data-index="'+id+'"]').click();
  await newTab.locator('#actions [data-do="check"]').click();
  check(await newTab.locator('#scene').getAttribute('data-stage')==='passed','new release grades corrected offline reasoning');
  await newTab.reload();
  check(JSON.parse(await read(newTab)).lessons.argument38.cases[0].attempts.length===2,'offline revision persists across reload');
  const beforeNewRestart=await read(newTab);
  fs.writeFileSync(path.join(out,'before-new-browser-restart.json'),beforeNewRestart);
  await ctx.close();record('persistent-browser-closed',{profile:'upgrade',release:'new'});
  offlineServing=true;
  ctx=await openPrimary(true);
  newTab=ctx.pages()[0]||await ctx.newPage();diagnosticPage=newTab;
  newTab.on('pageerror',e=>errors.push(String(e)));
  const reopenedOfflineResponse=await lesson(newTab,'argument38');
  check(reopenedOfflineResponse?.status()===200&&reopenedOfflineResponse.fromServiceWorker(),
   'full browser offline reopen receives a cached 200 document from Service Worker');
  check(await newTab.evaluate(()=>window.__p10BeforeApp)===beforeNewRestart,
   'full new browser offline restart preserves original and newly saved records byte-for-byte');
  await newReady(newTab);
  await newTab.locator('#actions [data-do="check"]').click();
  check(await newTab.locator('#scene').getAttribute('data-stage')==='passed','original grader still passes recovered reasoning after full offline browser restart');
  const restartedRecord=JSON.parse(await read(newTab));
  check(restartedRecord.lessons.argument38.cases[0].attempts.length===3&&restartedRecord.lessons.equivalent.notes.length===1,
   'new offline submission and historical authored explanation coexist after full restart');
  fs.writeFileSync(path.join(out,'after-new-browser-restart.json'),await read(newTab));
  offlineServing=false;
  await ctx.setOffline(false);
  await newTab.goto(base+'v2.html#trail');await newTab.locator('#import-file').waitFor({state:'attached'});
  await newTab.locator('[data-lesson-record="equivalent"]').waitFor();
  await newTab.screenshot({path:path.join(out,'new-release-trail.png')});
  const download=newTab.waitForEvent('download');
  await newTab.locator('[data-do="export"]').first().click();
  const exported=await download;
  const actualBackup=fs.readFileSync(await exported.path(),'utf8');
  fs.writeFileSync(path.join(out,'browser-export-v2.json'),actualBackup);
  check(JSON.parse(actualBackup).state.lessons.equivalent.notes.length===1,'real browser backup retains old version history after upgrade');
  // A second browser profile must receive the real V2 backup with no shared storage.
  browser=await chromium.launch(launchOptions);
  const remote=await browser.newContext({acceptDownloads:true,serviceWorkers:'allow'});
  const remotePage=await remote.newPage();
  await remotePage.goto(base+'v2.html#trail');await remotePage.locator('#import-file').waitFor({state:'attached'});
  const importFile=async(p,contents,name)=>{
   await p.locator('#import-file').setInputFiles({name:name||'backup.json',mimeType:'application/json',buffer:Buffer.from(contents)});
   await p.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
  };
  await importFile(remotePage,actualBackup,'real-browser-backup.json');
  await remotePage.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')||'{}').lessons?.equivalent?.notes?.length===1);
  check(JSON.parse(await read(remotePage)).lessons.equivalent.cases[0].attempts.length===2,'real cross-browser V2 import retains initial error and hints');
  const restored=await read(remotePage);
  await importFile(remotePage,actualBackup,'repeat-real-browser-backup.json');
  await remotePage.waitForFunction(()=>document.querySelector('#toast')?.textContent?.includes('已合并'));
  check(await read(remotePage)===restored,'repeat import of identical real V2 backup is idempotent');
  // Browser-generated compatible V1 sample is synthetic, not historical child data.
  const v1=await remotePage.evaluate(async()=>{const {freshState}=await import('./core.js');return JSON.stringify({app:'math-explorer',version:1,state:freshState()});});
  const legacy=await browser.newContext({serviceWorkers:'allow'});
  const legacyPage=await legacy.newPage();await legacyPage.goto(base+'v2.html#trail');await legacyPage.locator('#import-file').waitFor({state:'attached'});
  await importFile(legacyPage,v1,'automatically-constructed-v1.json');
  await legacyPage.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')||'{}').legacy!=null);
  check(JSON.parse(await read(legacyPage)).legacy!==null,'synthetic V1 backup imported via real Chromium file input',{sample:'constructed compatibility data, not child backup'});
  const unchanged=await read(legacyPage);
  for(const bad of ['{','{"app":"math-explorer","version":99,"state":{}}','{"app":"math-explorer","version":2,"state":{"schema":2}}']){
   await importFile(legacyPage,bad,'invalid-backup.json');
   await legacyPage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   check(await read(legacyPage)===unchanged,'invalid or unsupported backup rejected without mutation',{sample:bad.slice(0,40)});
  }
  // Real quota boundaries, rejected import UI, preserved nonempty records and
  // persistent-browser recovery are mandatory in p10-backup-safety-browser.cjs.
  // This suite does not claim the old 1 MB padding/immediate-read false positive.
  await legacy.close();await remote.close();
  // A failed new release install must retain old active SW and learner data.
  release='old';
  const failCtx=await browser.newContext({serviceWorkers:'allow'});
  observeContext(failCtx,'failed-install-retry');
  const failPage=await failCtx.newPage();
  diagnosticPage=failPage;
  await failPage.goto(base+'v2.html#trail');await oldActive(failPage);
  await lesson(failPage,'equivalent');
  await failPage.locator('#actions [data-do="check"]').click();
  const failBefore=await read(failPage);
  release='new';deny='learning/phase5/b39-model.js';
  const deniedStart=trace.length;
  await failPage.evaluate(async()=>{
   const r=await navigator.serviceWorker.ready;
   window.__p10FailedInstall={states:[],originalActive:r.active};
   const observe=worker=>{
    if(!worker)return;
    const state=()=>window.__p10FailedInstall.states.push({time:Date.now(),state:worker.state});
    state();worker.addEventListener('statechange',state);
   };
   r.addEventListener('updatefound',()=>observe(r.installing));
   await r.update();observe(r.installing);
  });
  // Require a real install rejection while the failed resource is still denied.
  // Merely seeing the old cache is true before the attempted update even starts.
  await failPage.waitForFunction(()=>window.__p10FailedInstall?.states.some(s=>s.state==='redundant'),null,{timeout:30000});
  const failedInstall=await failPage.evaluate(async()=>{
   const r=await navigator.serviceWorker.getRegistration();
   return {states:window.__p10FailedInstall.states,originalStillActive:r.active===window.__p10FailedInstall.originalActive,
    originalStillControls:navigator.serviceWorker.controller===window.__p10FailedInstall.originalActive,
    activeState:r.active?.state,waitingState:r.waiting?.state,installingState:r.installing?.state};
  });
  record('new-install-failed',{profile:'failed-install-retry',...failedInstall});
  check(trace.slice(deniedStart).some(e=>e.event==='server-request'&&e.denied&&e.path==='/learning/phase5/b39-model.js'),
   'failed install actually requested the denied critical resource');
  check(failedInstall.originalStillActive&&failedInstall.originalStillControls&&failedInstall.activeState==='activated',
   'new install becomes redundant while historical worker remains active and controlling',{failedInstall});
  const failureKeys=await failPage.evaluate(()=>caches.keys());
  check(failureKeys.includes(oldCache),'failed new SW install retains old complete cache',{cacheKeys:failureKeys});
  check(await read(failPage)===failBefore,'failed upgrade does not mutate original learning history');
  offlineServing=true;await failCtx.setOffline(true);
  await lesson(failPage,'equivalent');
  await offlineReload(failPage,'equivalent','failed install leaves historical cached page available without network transport');
  check(await read(failPage)===failBefore,'failed install still opens original lesson offline without rewriting records');
  await failPage.locator('#actions [data-do="check"]').click();
  let failAfterOffline=await read(failPage);
  check(JSON.parse(failAfterOffline).lessons.equivalent.cases[0].attempts.length===2,'historical release still grades and saves after failed install offline');
  offlineServing=false;await failCtx.setOffline(false);
  deny='';
  // A separate attempt loses connectivity after the new install has started.
  // Hold one genuine manifest response, then cut network and terminate it;
  // a 503-only test cannot establish interruption during a running install.
  holdPath='learning/phase5/b39-model.js';heldResponse=null;
  await failPage.evaluate(async()=>{
   const r=await navigator.serviceWorker.getRegistration();
   window.__p10InterruptedInstall={states:[],originalActive:r.active};
   const observe=worker=>{
    if(!worker)return;
    const state=()=>window.__p10InterruptedInstall.states.push({time:Date.now(),state:worker.state});
    state();worker.addEventListener('statechange',state);
   };
   r.addEventListener('updatefound',()=>observe(r.installing));
   await r.update();observe(r.installing);
  });
  const heldDeadline=Date.now()+15000;
  while(!heldResponse&&Date.now()<heldDeadline)await new Promise(resolve=>setTimeout(resolve,50));
  check(!!heldResponse,'interrupted install reached a genuine held critical resource response');
  await failCtx.setOffline(true);offlineServing=true;
  heldResponse.destroy();heldResponse=null;holdPath='';
  await failPage.waitForFunction(()=>window.__p10InterruptedInstall?.states.some(s=>s.state==='redundant'),null,{timeout:30000});
  const interrupted=await failPage.evaluate(async()=>{
   const r=await navigator.serviceWorker.getRegistration();
   return {states:window.__p10InterruptedInstall.states,keys:await caches.keys(),
    originalStillActive:r.active===window.__p10InterruptedInstall.originalActive,
    originalStillControls:navigator.serviceWorker.controller===window.__p10InterruptedInstall.originalActive};
  });
  record('new-install-interrupted',{profile:'failed-install-retry',...interrupted});
  check(interrupted.originalStillActive&&interrupted.originalStillControls&&interrupted.keys.includes(oldCache),
   'disconnecting during install retains historical controller and offline cache',{interrupted});
  check(await read(failPage)===failAfterOffline,'interrupted upgrade does not rewrite any existing learning record');
  await lesson(failPage,'equivalent');
  await failPage.locator('#actions [data-do="check"]').click();
  failAfterOffline=await read(failPage);
  check(JSON.parse(failAfterOffline).lessons.equivalent.cases[0].attempts.length===3,
   'historical math grading and saving remain available offline after interrupted update');
  offlineServing=false;await failCtx.setOffline(false);
  await failPage.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});
  await newReady(failPage);
  check((await failPage.evaluate(()=>caches.keys())).includes(newCache),'retry activates real new worker with complete cache');
  // The old page may still have the old release JS running. Its cache is
  // disposable only AFTER that client closes and the new worker controls
  // a fresh page. Do not make early deletion part of upgrade readiness.
  await failPage.close();
  const recoveredPage=await failCtx.newPage();
  diagnosticPage=recoveredPage;
  await recoveredPage.goto(base+'v2.html#trail',{waitUntil:'commit'});
  await newReady(recoveredPage);
  check(await read(recoveredPage)===failAfterOffline,'retry preserves every byte of original and fallback learning records');
  const retryCleanup=await cleanup(recoveredPage,'failed-install-retry');
  const retryKeys=await recoveredPage.evaluate(()=>caches.keys());
  check(retryCleanup?.cache===newCache&&retryCleanup.complete===true&&
   retryKeys.includes(newCache)&&!retryKeys.includes(oldCache),
   'retry retires old cache safely after closing old client',{retryKeys});
  offlineServing=true;await failCtx.setOffline(true);
  const retryOfflineResponse=await lesson(recoveredPage,'equivalent');
  check(retryOfflineResponse?.status()===200&&retryOfflineResponse.fromServiceWorker(),
   'successful retry serves cached learning document without network transport');
  check(JSON.parse(await read(recoveredPage)).lessons.equivalent.cases[0].attempts.length===3,'recovered new release launches and retains history offline');
  await failCtx.close();offlineServing=false;
  check(errors.length===0,'no uncaught browser page errors',{errors});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,scenarios,errors,oldCommit:OLD,newCommit:current,oldCache,newCache,
   provenance:{...provenance,browserVersion,primaryBrowserLaunches:primaryLaunches,primaryBrowserRestarts:primaryLaunches-1},
   workerDiagnostic:process.env.P10_SW_DIAGNOSTIC==='1',quotaCoverage:'required separate p10-backup-safety-browser.cjs',
   realHistoricalChildBackup:false,macManual:false,childTrial:false,independentTeaching:false},null,2));
  console.log('P10_RELEASE_UPGRADE_OK '+checks.length+' real browser checks');
 }catch(e){
  let browserState=null;
  if(diagnosticPage&&!diagnosticPage.isClosed()){
   browserState=await Promise.race([diagnosticPage.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();return {url:location.href,readyState:document.readyState,controller:navigator.serviceWorker.controller?.scriptURL,active:reg?.active?.scriptURL,activeState:reg?.active?.state,keys:await caches.keys()};}).catch(err=>({error:String(err)})),new Promise(resolve=>setTimeout(()=>resolve({error:'browser state probe timed out'}),3500))]);
   await diagnosticPage.screenshot({path:path.join(out,'failure.png'),timeout:3500}).catch(()=>{});
   const raw=await Promise.race([read(diagnosticPage).catch(()=>null),new Promise(resolve=>setTimeout(()=>resolve(null),1500))]);
   if(typeof raw==='string')fs.writeFileSync(path.join(out,'failure-learning-record.json'),raw);
  }
  fs.writeFileSync(path.join(out,'diagnostics.json'),JSON.stringify({browserState,trace},null,2));
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({checks,scenarios,errors,error:String(e),stack:e.stack,browserState,traceCount:trace.length,
   oldCommit:OLD,newCommit:current,provenance:{...provenance,browserVersion,primaryBrowserLaunches:primaryLaunches,primaryBrowserRestarts:Math.max(0,primaryLaunches-1)}},null,2));
  console.error('P10_RELEASE_UPGRADE_FAILED '+(e.stack||e));
  process.exitCode=1;
 }finally{
  const workerEvents=[];
  for(const {worker,profile} of diagnosticWorkers){
   let timer;
   try{
    const events=await Promise.race([worker.evaluate(()=>globalThis.__p10SWEvents||[]),new Promise(resolve=>{timer=setTimeout(()=>resolve({error:'worker trace unavailable'}),1500);})]);
    workerEvents.push({profile,url:worker.url(),events});
   }catch(error){workerEvents.push({profile,error:String(error)});}finally{clearTimeout(timer);}
  }
  fs.writeFileSync(path.join(out,'http-events.json'),JSON.stringify({oldCommit:OLD,newCommit:current,trace,workerEvents},null,2));
  if(ctx)await ctx.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  if(server)await new Promise(resolve=>server.close(resolve));
  try{execFileSync('git',['worktree','remove','--force',oldPath],{cwd:root,stdio:'pipe'});}catch{}
  try{fs.rmSync(oldPath,{recursive:true,force:true});}catch{}
  try{fs.rmSync(profileRoot,{recursive:true,force:true});}catch{}
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
