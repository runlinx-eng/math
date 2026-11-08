// P4 browser evidence: actual Chromium Service Worker, offline navigation and
// independent learning/view storage. Does not simulate a Service Worker upgrade.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p4-learning-reliability');
const checks=[],errors=[],check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
const host='http://127.0.0.1:43827';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'allow',reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(host+'/v2.html#trail');
  await page.locator('#main .subhero h1').waitFor();
  const status=await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    const c=await caches.open('math-explorer-20261108-learning-reliability-p4');
    const entries=['./v2.html','./exploration.js','./exploration-core.js','./learn.html','./learning/state.js','./data/atlas.json'];
    return Promise.all(entries.map(p=>c.match(new URL(p,location.href)).then(Boolean)));
  });
  check(status.every(Boolean),'real SW cache contains trail, learning runner, data and backup modules');
  check((await page.locator('#offline-status').innerText()).includes('就绪'),'trail reports current cache readiness');
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
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors,offlineNavigation:true,swUpgradeVerified:false},null,2));
  console.log('P4 Chromium checks: '+checks.length+' passed');
 }catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(e),checks,errors},null,2));console.error(e);process.exitCode=1;}finally{await browser.close();}
})();
