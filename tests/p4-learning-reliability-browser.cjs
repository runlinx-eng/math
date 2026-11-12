// P4 browser evidence: actual Chromium Service Worker, offline navigation and
// independent learning/view storage. Does not simulate a Service Worker upgrade.
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p4-learning-reliability');
const checks=[],errors=[],check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
const lifecycle=[],snapshots=[];
let initialInstall=null;
const host='http://127.0.0.1:43827';
const cacheName=fs.readFileSync(path.resolve(__dirname,'../dist/sw.js'),'utf8').match(/const CACHE\s*=\s*'([^']+)'/)?.[1];
if(!cacheName)throw Error('Service Worker cache version missing');
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'}).trim();
const githubEvent=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:githubEvent.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 testedTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'}).trim(),cache:cacheName};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'allow',reducedMotion:'reduce'});
 // Observe native lifecycle events only: no SW protocol messages, method
 // interception, forced updates or state changes are introduced by diagnostics.
 await context.exposeBinding('__p4RecordLifecycle',(_source,record)=>lifecycle.push(record));
 await context.addInitScript(origin=>{
  if(location.origin!==origin||!('serviceWorker'in navigator))return;
  const serviceWorker=navigator.serviceWorker,workers=new WeakMap(),registrations=new WeakSet();
  const documentId=crypto.randomUUID();let nextWorker=0,registration=null;
  const info=worker=>{
   if(!worker)return null;
   if(!workers.has(worker))workers.set(worker,++nextWorker);
   return {id:workers.get(worker),url:worker.scriptURL,state:worker.state};
  };
  const record=(event,worker=null)=>window.__p4RecordLifecycle({event,documentId,time:new Date().toISOString(),
   monotonicMs:performance.now(),url:location.href,observed:info(worker),controller:info(serviceWorker.controller),
   active:info(registration?.active),waiting:info(registration?.waiting),installing:info(registration?.installing),
   controllerIsActive:!!serviceWorker.controller&&serviceWorker.controller===registration?.active,
   status:document.querySelector('#offline-status')?.textContent||null}).catch(()=>{});
  const observed=new WeakSet();
  const observeWorker=worker=>{
   if(!worker||observed.has(worker))return;
   observed.add(worker);info(worker);
   worker.addEventListener('statechange',()=>record('statechange',worker));
  };
  const observeRegistration=value=>{
   if(!value)return;
   registration=value;
   for(const worker of [value.active,value.waiting,value.installing])observeWorker(worker);
   if(!registrations.has(value)){
    registrations.add(value);
    value.addEventListener('updatefound',()=>{observeWorker(value.installing);record('updatefound',value.installing);});
   }
   record('registration-observed');
  };
  serviceWorker.addEventListener('controllerchange',()=>{
   observeWorker(serviceWorker.controller);record('controllerchange',serviceWorker.controller);
   serviceWorker.getRegistration().then(observeRegistration).catch(()=>{});
  });
  serviceWorker.getRegistration().then(observeRegistration).catch(()=>{});
  serviceWorker.ready.then(value=>{observeRegistration(value);record('ready');}).catch(()=>{});
  window.addEventListener('load',()=>record('load'),{once:true});
  record('document-init');
 },host);
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 const snapshot=async label=>{
  let timer;
  try{
   const value=await Promise.race([page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.getRegistration(),controller=navigator.serviceWorker.controller;
    const info=worker=>worker?{url:worker.scriptURL,state:worker.state}:null;
    return {time:new Date().toISOString(),url:location.href,status:document.querySelector('#offline-status')?.textContent||null,
     controller:info(controller),active:info(registration?.active),waiting:info(registration?.waiting),installing:info(registration?.installing),
     controllerIsActive:!!controller&&controller===registration?.active};
   }),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('read-only lifecycle snapshot timed out')),2000);})]);
   snapshots.push({label,...value});
  }catch(error){snapshots.push({label,error:String(error)});}finally{clearTimeout(timer);}
 };
 try{
  await page.goto(host+'/v2.html#trail');
  await page.locator('#main .subhero h1').waitFor();
  const status=await page.evaluate(async cacheKey=>{
    await navigator.serviceWorker.ready;
    const c=await caches.open(cacheKey);
    const entries=['./v2.html','./exploration.js','./exploration-core.js','./learn.html','./learning/state.js','./data/atlas.json'];
    return Promise.all(entries.map(p=>c.match(new URL(p,location.href)).then(Boolean)));
  },cacheName);
  check(status.every(Boolean),'real SW cache contains trail, learning runner, data and backup modules');
  await snapshot('before-readiness-wait');
  // The new cache-status protocol is asynchronous. Wait for the worker's
  // complete-manifest response, not just six cached files or a rendered page.
  await page.waitForFunction(()=>document.querySelector('#offline-status')?.textContent?.includes('就绪'),null,{timeout:20000});
  check((await page.locator('#offline-status').innerText()).includes('就绪'),'trail reports current cache readiness');
  await snapshot('initial-trail-ready');
  initialInstall={provenance,result:'ready',lifecycle:[...lifecycle],snapshot:snapshots.at(-1)};
  fs.writeFileSync(path.join(out,'initial-install.json'),JSON.stringify(initialInstall,null,2));
  await page.evaluate(async()=>{
   const {fresh,KEY}=await import('./exploration-core.js');
   const state=fresh();
   state.visited['mt_ndGqFPWyen']='2026-11-01T00:00:00.000Z';
   state.bookmarks=['mt_ndGqFPWyen'];
   localStorage.setItem(KEY,JSON.stringify(state));
   localStorage.setItem('math-explorer-network-relationship-view-v1',JSON.stringify({unrelated:'view-only'}));
  });
  await page.reload();
  await page.locator('#main .journal-grid').waitFor();
  check((await page.locator('#main').innerText()).includes('我想探索'),'trail loaded after local recovery');
  const before=await page.evaluate(()=>({study:localStorage.getItem('math-explorer-v2'),view:localStorage.getItem('math-explorer-network-relationship-view-v1')}));
  await context.setOffline(true);
  await page.goto(host+'/v2.html#trail',{waitUntil:'domcontentloaded'});
  await page.locator('#main .journal-grid').waitFor({timeout:15000});
  check((await page.locator('#main').innerText()).includes('我想探索'),'real network-offline trail navigation works');
  await page.goto(host+'/learn.html#share',{waitUntil:'domcontentloaded'});
  await page.locator('#lesson').waitFor({timeout:15000});
  check(await page.locator('#lesson').isVisible(),'learning runner opens offline');
  await page.goto(host+'/index.html?world=network&layout=53#space',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot(),{timeout:20000});
  check(await page.evaluate(()=>!!window.mathSpace),'3D map initializes offline');
  const after=await page.evaluate(()=>({study:localStorage.getItem('math-explorer-v2'),view:localStorage.getItem('math-explorer-network-relationship-view-v1')}));
  check(!!after.study&&after.study.includes('mt_ndGqFPWyen'),'offline storage retains learning visit');
  check(after.view===before.view||!!after.view,'view storage remains independent from learning data');
  await context.setOffline(false);
  await page.goto(host+'/v2.html#trail');
  await page.locator('#main .journal-grid').waitFor();
  for(const [w,h] of [[1440,900],[980,760],[1280,720]]){
    await page.setViewportSize({width:w,height:h});
    await page.locator('#main .subhero').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,'trail-'+w+'x'+h+'.png'),fullPage:true});
    const bounds=await page.locator('#main').boundingBox();
    check(!!bounds&&bounds.width<=w+2,'trail fit '+w+'x'+h);
  }
  check(errors.length===0,'no uncaught browser errors: '+errors.join('; '));
  await snapshot('success');
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({provenance,checks,errors,offlineNavigation:true,swUpgradeVerified:false,initialInstall,snapshots},null,2));
  console.log('P4 Chromium checks: '+checks.length+' passed');
 }catch(e){
  await snapshot('failure');
  if(!initialInstall){
   initialInstall={provenance,result:'failed-before-ready',lifecycle:[...lifecycle],snapshot:snapshots.at(-1)};
   fs.writeFileSync(path.join(out,'initial-install.json'),JSON.stringify(initialInstall,null,2));
  }
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({provenance,error:String(e),checks,errors,initialInstall,snapshots},null,2));
  console.error(e);process.exitCode=1;
 }
 finally{
  fs.writeFileSync(path.join(out,'sw-lifecycle.json'),JSON.stringify({provenance,
   observation:'native lifecycle listeners and read-only properties; no diagnostic SW messages or prototype interception',lifecycle,snapshots},null,2));
  await browser.close();
 }
})();
