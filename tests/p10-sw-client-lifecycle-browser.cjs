// Stage 13 diagnostic: identical real historical upgrade, independent persistent
// profiles; A retains scoped pages, B closes them after saving, then reopens.
// Never changes the historical SW, its runtime, storage or registration.
// Only the new SW is traced; these cases do not count as formal acceptance.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const http=require('node:http'),crypto=require('node:crypto'),zlib=require('node:zlib');
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p10-release-upgrade/stage13-lifecycle');
const OLD='96844424ceb534e7ca5f864a006b72a52efd0d60';
const OLD_HASH='773bac0d2ae4383ffb071e7f1046f96d4855d165c2bf751da6d04b820fe7cf00';
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const bounded=async(promise,ms,label)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),ms);})]);}finally{clearTimeout(timer);}};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wav':'audio/wav'};
const cacheOf=data=>data.toString().match(/const CACHE\s*=\s*'([^']+)'/)[1];
const nativeCategories='ServiceWorker,CacheStorage,blink.user_timing';
const modes=(process.env.P10_LIFECYCLE_CASES||'A-retain-clients,B-close-clients').split(',');
assert.ok(modes.length&&modes.every(mode=>['A-retain-clients','B-close-clients','C-suppress-legacy-probes'].includes(mode)));
const newProbe=identity=>`
// Diagnostic-only new worker wrapper. No changes to historical worker.
const stage13Identity=${JSON.stringify(identity)};
const stage13Log=(event,detail={})=>{
 const item={...stage13Identity,event,workerTime:Date.now(),...detail};
 console.info('P10_STAGE13_WORKER '+JSON.stringify(item));
 fetch(new URL('/__stage13_evidence',self.location.origin),{method:'POST',body:JSON.stringify(item)}).catch(()=>{});
};
const stage13Skip=self.skipWaiting.bind(self);
self.skipWaiting=()=>{stage13Log('skipWaiting-enter');return stage13Skip().then(value=>{stage13Log('skipWaiting-complete');return value;},error=>{stage13Log('skipWaiting-error',{error:String(error)});throw error;});};
self.addEventListener('install',()=>stage13Log('install-event'));
self.addEventListener('activate',()=>stage13Log('activate-event'));
`;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const oldDir=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-stage13-old-'));
 const reports=[];
 try{
  execFileSync('git',['worktree','add','--detach',oldDir,OLD],{cwd:root,stdio:'pipe'});
  const oldSW=fs.readFileSync(path.join(oldDir,'dist/sw.js'));
  const newSW=fs.readFileSync(path.join(root,'dist/sw.js'));
  assert.equal(hash(oldSW),OLD_HASH,'historical SW must be exact original bytes');
  const oldCache=cacheOf(oldSW),newCache=cacheOf(newSW);
  const provenance={checkoutSha:git(['rev-parse','HEAD']),checkoutTree:git(['rev-parse','HEAD^{tree}']),
   historicalCommit:OLD,historicalSW:OLD_HASH,historicalWorkerModified:false,newProductSW:hash(newSW),
   diagnosticNewWorker:true,countsTowardAcceptance:false,playwrightVersion:require((process.env.MATH_PLAYWRIGHT_MODULE||'playwright')+'/package.json').version};
  for(const mode of modes){
   const profile=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-stage13-'+mode+'-'));
   const caseOut=path.join(out,mode);fs.mkdirSync(caseOut,{recursive:true});
   const events=[],record=(event,detail={})=>events.push({time:new Date().toISOString(),monotonicMs:Number(process.hrtime.bigint()/1000000n),profileId:path.basename(profile),event,...detail});
   const report={mode,profileId:path.basename(profile),...provenance,legacyPageProbeSuppression:mode==='C-suppress-legacy-probes'};
   let ctx,server,browserCDP,traceStarted=false,release='old',offline=false,seq=0;
   const versions=new Map(),pendingHTTP=new Map();
   const servedNewSW=Buffer.from(newProbe({profileId:report.profileId,mode,productHash:hash(newSW)})+newSW);
   report.servedNewSW=hash(servedNewSW);
   try{
    server=http.createServer((req,res)=>{
     const pathname=new URL(req.url,'http://localhost').pathname;
     if(pathname==='/__stage13_evidence'&&req.method==='POST'){
      let body='';req.on('data',part=>body+=part);req.on('end',()=>{
       try{const item=JSON.parse(body);assert.equal(item.profileId,report.profileId);record('new-worker-probe',item);}catch(error){record('probe-invalid',{error:String(error)});}
       res.writeHead(204);res.end();
      });return;
     }
     const rel=decodeURIComponent(pathname).replace(/^\/+/, '')||'index.html';
     if(rel.split('/').includes('..')){res.writeHead(400);res.end();return;}
     const id=++seq,version=release;pendingHTTP.set(id,{id,path:pathname,version});record('http-request',{id,path:pathname,version,offline});
     res.once('finish',()=>{pendingHTTP.delete(id);record('http-finished',{id,path:pathname,status:res.statusCode});});
     res.once('close',()=>{if(!res.writableFinished){pendingHTTP.delete(id);record('http-aborted',{id,path:pathname,offline});}});
     if(offline){req.socket.destroy();return;}
     fs.readFile(path.join(version==='old'?oldDir:root,'dist',rel),(error,data)=>{
      if(error){res.writeHead(404);res.end('missing');return;}
      if(rel==='sw.js'&&version==='new')data=servedNewSW;
      if(rel==='sw.js')record('served-worker',{id,version,sha256:hash(data)});
      res.writeHead(200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store','Service-Worker-Allowed':'/'});res.end(data);
     });
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port+'/';report.origin=base;
    const launch={headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
     ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})};
    const observe=context=>{
     context.on('serviceworker',worker=>record('playwright-worker-created',{url:worker.url()}));
     context.on('page',page=>{page.on('pageerror',error=>record('page-error',{error:String(error),url:page.url()}));});
    };
    ctx=await chromium.launchPersistentContext(profile,{...launch,viewport:{width:1440,height:900},serviceWorkers:'allow'});observe(ctx);
    report.browserVersion=ctx.browser().version();
    await ctx.addInitScript(()=>{try{window.__stage13BeforeApp=localStorage.getItem('math-explorer-v2');}catch{}});
    let oldPage=ctx.pages()[0]||await ctx.newPage();
    await oldPage.goto(base+'v2.html#trail');
    const waitFor=async(page,predicate,arg,timeout=30000)=>{
     const end=Date.now()+timeout;let last;
     while(Date.now()<end){last=await bounded(page.evaluate(predicate,arg),6000,'page predicate');if(last===true||last?.ready)return last;await delay(100);}
     throw Error('state not reached: '+JSON.stringify(last));
    };
    await waitFor(oldPage,async name=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state==='activated'&&navigator.serviceWorker.controller===r.active&&(await caches.keys()).includes(name);},oldCache);
    const lesson=async(page,id)=>{await page.goto(base+'learn.html#'+id,{waitUntil:'commit',timeout:15000});await page.waitForFunction(value=>window.mathLesson?.snapshot()?.id===value,id);};
    await lesson(oldPage,'equivalent');
    await oldPage.locator('#actions [data-do="check"]').click();
    assert.equal(await oldPage.locator('#scene').getAttribute('data-stage'),'revise');
    await oldPage.locator('#actions [data-do="hint"]').click();
    for(const [row,index] of [[0,1],[1,2],[2,3]])await oldPage.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
    await oldPage.locator('#actions [data-do="check"]').click();
    assert.equal(await oldPage.locator('#scene').getAttribute('data-stage'),'passed');
    await oldPage.locator('#actions [data-do="next"]').click();
    await oldPage.locator('input[data-field="mark"]').fill('4');await oldPage.locator('#actions [data-do="check"]').click();
    assert.equal(await oldPage.locator('#scene').getAttribute('data-stage'),'passed');
    await oldPage.locator('#actions [data-do="next"]').click();
    await oldPage.locator('input[data-field="mark"]').fill('6');await oldPage.locator('#actions [data-do="check"]').click();
    assert.equal(await oldPage.locator('#scene').getAttribute('data-stage'),'passed');
    await oldPage.locator('#actions [data-do="next"]').click();
    await oldPage.locator('#note').fill('历史版本的分数解释：同一个整体等分后数量不变。');await oldPage.locator('[data-do="save-note"]').click();
    const beforeRestart=await oldPage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
    await ctx.close();record('historical-browser-closed');
    ctx=await chromium.launchPersistentContext(profile,{...launch,viewport:{width:1440,height:900},serviceWorkers:'allow'});observe(ctx);
    await ctx.addInitScript(()=>{try{window.__stage13BeforeApp=localStorage.getItem('math-explorer-v2');}catch{}});
    // An about:blank observer stays alive when every scoped client closes.
    // It never controls, intercepts, pauses or stops a worker.
    const observer=await ctx.newPage(),observerCDP=await ctx.newCDPSession(observer);
    observerCDP.on('ServiceWorker.workerVersionUpdated',payload=>{for(const v of payload.versions)versions.set(v.versionId,v);record('native-worker-versions',payload);});
    observerCDP.on('ServiceWorker.workerRegistrationUpdated',payload=>record('native-registrations',payload));
    observerCDP.on('ServiceWorker.workerErrorReported',payload=>record('native-worker-error',payload));
    await observerCDP.send('ServiceWorker.enable');
    browserCDP=await ctx.browser().newBrowserCDPSession();
    await browserCDP.send('Tracing.start',{categories:nativeCategories,transferMode:'ReturnAsStream',options:'record-continuously'});traceStarted=true;
    record('native-trace-started',{categories:nativeCategories});
    oldPage=ctx.pages()[0]||await ctx.newPage();await lesson(oldPage,'equivalent');
    assert.equal(await oldPage.evaluate(()=>window.__stage13BeforeApp),beforeRestart);
    offline=true;await ctx.setOffline(true);await lesson(oldPage,'share');
    await oldPage.locator('#actions [data-do="check"]').click();
    offline=false;await ctx.setOffline(false);
    const saved=await oldPage.evaluate(()=>localStorage.getItem('math-explorer-v2'));fs.writeFileSync(path.join(caseOut,'before-update.json'),saved);
    report.historicalLearningVerified=true;record('historical-learning-saved',{bytes:Buffer.byteLength(saved),sha256:hash(saved)});
    report.oldNativeVersions=[...versions.values()];
    const inspect=async page=>bounded(page.evaluate(async({oldCache,newCache,knownNewActive})=>{
     const reg=await navigator.serviceWorker.getRegistration();
     const worker=w=>w?{state:w.state,scriptURL:w.scriptURL,isController:w===navigator.serviceWorker.controller}:null;
     const ask=w=>!w?Promise.resolve(null):new Promise(resolve=>{const c=new MessageChannel();const done=data=>{clearTimeout(t);c.port1.close();resolve(data);};const t=setTimeout(()=>done(null),1000);c.port1.onmessage=e=>done(e.data);w.postMessage({type:'math-explorer:cache-status'},[c.port2]);});
     // Observation must never wake a historical controller. Native version
     // identity tells us when active is the new worker, without messaging it.
     const candidate=reg?.waiting||(knownNewActive?reg?.active:null);
     const status=await ask(candidate);
     return {url:location.href,controller:worker(navigator.serviceWorker.controller),active:worker(reg?.active),waiting:worker(reg?.waiting),installing:worker(reg?.installing),keys:await caches.keys(),status,
      ready:!!candidate&&candidate===reg.active&&candidate===navigator.serviceWorker.controller&&candidate.state==='activated'&&status?.cache===newCache&&status.complete===true&&!reg.waiting&&!reg.installing};
    },{oldCache,newCache,knownNewActive:[...versions.values()].some(v=>v.status==='activated'&&!report.oldNativeVersions.some(old=>old.versionId===v.versionId))}),6000,'same-profile worker inspection');
    release='new';record('release-switched');
    if(mode==='C-suppress-legacy-probes'){
     // C changes one cause found in A's native trace: application status
     // messages waking the historical worker after it has begun retiring.
     // No historical worker file/runtime, registration or cache is changed.
     await ctx.addInitScript(()=>{
      if(location.pathname!=='/v2.html'||!('serviceWorker'in navigator)||typeof ServiceWorker==='undefined')return;
      const legacy=navigator.serviceWorker.controller,post=ServiceWorker.prototype.postMessage;
      window.__stage13SuppressedProbes=[];
      ServiceWorker.prototype.postMessage=function(message,...rest){
       if(this===legacy&&['math-explorer:cache-status','math-explorer:cleanup-retired-caches'].includes(message?.type)){
        window.__stage13SuppressedProbes.push({time:Date.now(),type:message.type,scriptURL:this.scriptURL,state:this.state});return;
       }
       return post.call(this,message,...rest);
      };
     });
    }
    let newPage=await ctx.newPage();
    const pageCDP=await ctx.newCDPSession(newPage);
    const pendingPage=new Map();
    pageCDP.on('Network.requestWillBeSent',e=>{pendingPage.set(e.requestId,e.request.url);record('page-request',{id:e.requestId,url:e.request.url,type:e.type});});
    pageCDP.on('Network.loadingFinished',e=>{pendingPage.delete(e.requestId);record('page-request-finished',{id:e.requestId});});
    pageCDP.on('Network.loadingFailed',e=>{pendingPage.delete(e.requestId);record('page-request-failed',{id:e.requestId,error:e.errorText});});
    await pageCDP.send('Network.enable');
    await newPage.goto(base+'v2.html#trail',{timeout:15000});
    await newPage.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
    let last,prior='';
    const sampleUntil=async(ms)=>{
     const end=Date.now()+ms;
     while(Date.now()<end){last=await inspect(newPage);const str=JSON.stringify(last);if(str!==prior){record('page-worker-state',last);prior=str;}if(last.ready)return true;await delay(250);}return false;
    };
    report.readyWithClients=await sampleUntil(15000);
    await observer.evaluate(()=>performance.mark('stage13-before-client-action'));
    report.beforeClientAction={state:last,nativeVersions:[...versions.values()],pendingHTTP:[...pendingHTTP.values()],pendingPage:[...pendingPage.values()]};
    const atAction=await newPage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
    fs.writeFileSync(path.join(caseOut,'before-client-action.json'),atAction);assert.equal(atAction,saved,'upgrade/inspection must preserve full stored bytes');
    if(mode==='B-close-clients'){
     const scoped=ctx.pages().filter(p=>p.url().startsWith(base));
     record('closing-all-scoped-clients',{urls:scoped.map(p=>p.url()),savedHash:hash(atAction)});
     for(const p of scoped)await p.close();
     assert.equal(ctx.pages().filter(p=>p.url().startsWith(base)).length,0);
     await delay(3000);
     report.withoutScopedClients={nativeVersions:[...versions.values()],pendingHTTP:[...pendingHTTP.values()]};record('all-scoped-clients-closed',report.withoutScopedClients);
     newPage=await ctx.newPage();await newPage.goto(base+'v2.html#trail',{waitUntil:'commit',timeout:15000});
     await newPage.locator('#import-file').waitFor({state:'attached'});
     report.readyAfterReopen=await sampleUntil(15000);
    }else{
     report.readyWithClientsAtSecondDeadline=await sampleUntil(15000);
    }
    const after=await newPage.evaluate(()=>localStorage.getItem('math-explorer-v2'));fs.writeFileSync(path.join(caseOut,'after-client-action.json'),after);
    report.bytesPreserved=after===saved;assert.equal(after,saved,'client close/reopen must preserve learner data');
    if(mode==='C-suppress-legacy-probes'){
     report.suppressedProbes=await newPage.evaluate(()=>window.__stage13SuppressedProbes);
     assert.equal(report.readyWithClients,true,'suppressing only legacy probes must permit real activation with old clients retained');
     await lesson(newPage,'share');
     assert.equal(await newPage.evaluate(()=>window.__stage13BeforeApp),saved,'new lesson startup must preserve exact prior bytes');
     await newPage.locator('#actions [data-do="check"]').click();
     const latest=await newPage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
     await oldPage.locator('#actions [data-do="check"]').click();
     assert.ok((await oldPage.locator('#storage-warning').innerText()).includes('已停止覆盖'));
     assert.equal(await oldPage.evaluate(()=>localStorage.getItem('math-explorer-v2')),latest);
     report.newNavigationWithLegacyOpen=true;report.legacyOverwriteBlocked=true;
     fs.writeFileSync(path.join(caseOut,'after-native-new-and-stale-old-check.json'),latest);
    }
    await observer.evaluate(()=>performance.mark('stage13-final-cutoff'));
    report.final={state:await inspect(newPage),nativeVersions:[...versions.values()],pendingHTTP:[...pendingHTTP.values()]};
    await newPage.screenshot({path:path.join(caseOut,'final.png')});
    report.diagnosticCompleted=true;
   }catch(error){report.error=String(error);report.stack=error.stack;process.exitCode=1;record('case-failed',{error:String(error)});}
   finally{
    if(traceStarted){
     try{
      const complete=new Promise(resolve=>browserCDP.once('Tracing.tracingComplete',resolve));await browserCDP.send('Tracing.end');
      const {stream}=await bounded(complete,10000,'native tracing complete');const chunks=[];
      for(;;){const chunk=await browserCDP.send('IO.read',{handle:stream});chunks.push(Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8'));if(chunk.eof)break;}
      await browserCDP.send('IO.close',{handle:stream});
      const trace=Buffer.concat(chunks);fs.writeFileSync(path.join(caseOut,'native-trace.json.gz'),zlib.gzipSync(trace));
      report.nativeTrace={bytes:trace.length,sha256:hash(trace),categories:nativeCategories};
     }catch(error){report.traceError=String(error);process.exitCode=1;}
    }
    fs.writeFileSync(path.join(caseOut,'events.json'),JSON.stringify(events,null,2));
    fs.writeFileSync(path.join(caseOut,'report.json'),JSON.stringify(report,null,2));
    reports.push(report);console.log('P10_STAGE13_CASE '+JSON.stringify(report));
    if(ctx)await ctx.close().catch(()=>{});
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    fs.rmSync(profile,{recursive:true,force:true});
   }
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({provenance,reports,independentProfiles:new Set(reports.map(r=>r.profileId)).size===reports.length},null,2));
 }finally{
  try{execFileSync('git',['worktree','remove','--force',oldDir],{cwd:root,stdio:'pipe'});}catch{}
  fs.rmSync(oldDir,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
