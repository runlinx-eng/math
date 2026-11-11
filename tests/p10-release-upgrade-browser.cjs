// P10 R3: two genuine Git revisions, one origin, real SW/cache/localStorage.
 // Uses the real app and native graders; generated legacy samples are NOT child backups.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const OLD='96844424ceb534e7ca5f864a006b72a52efd0d60';
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p10-release-upgrade');
const port=43829,base='http://127.0.0.1:'+port+'/';
const checks=[],scenarios=[],errors=[];
const check=(condition,label,detail={})=>{assert.ok(condition,label);checks.push(label);scenarios.push({label,result:'A',...detail});};
const read=page=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
const cacheFrom=file=>fs.readFileSync(file,'utf8').match(/const CACHE\s*=\s*'([^']+)'/)?.[1];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wav':'audio/wav','.woff2':'font/woff2'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const oldPath=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-old-'));
 let server,browser;
 try{
  execFileSync('git',['worktree','add','--detach',oldPath,OLD],{cwd:root,stdio:'pipe'});
  const oldCache=cacheFrom(path.join(oldPath,'dist/sw.js'));
  const newCache=cacheFrom(path.join(root,'dist/sw.js'));
  check(!!oldCache&&!!newCache&&oldCache!==newCache,'distinct genuine release Service Worker manifests',{oldCommit:OLD,oldCache,newCache});
  let release='old',deny='';
  server=http.createServer((req,res)=>{
   const pathname=new URL(req.url,base).pathname;
   const rel=decodeURIComponent(pathname).replace(/^\/+/,'')||'index.html';
   if(rel.startsWith('..')||rel.includes('/../')){res.writeHead(400);return res.end('invalid path');}
   if(rel===deny){res.writeHead(503,{'Content-Type':'text/plain','Cache-Control':'no-store'});return res.end('P10 controlled missing resource');}
   const src=path.join(release==='old'?oldPath:root,'dist',rel);
   fs.readFile(src,(err,data)=>{
    if(err){res.writeHead(404);return res.end('not found');}
    res.writeHead(200,{'Content-Type':mime[path.extname(src)]||'application/octet-stream','Cache-Control':'no-store','Service-Worker-Allowed':'/'});
    res.end(data);
   });
  });
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,serviceWorkers:'allow',reducedMotion:'reduce'});
  let page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  const lesson=async(p,id)=>{
   await p.goto(base+'learn.html#'+id,{waitUntil:'domcontentloaded'});
   await p.waitForFunction(s=>window.mathLesson?.snapshot()?.id===s,id,{timeout:30000});
  };
  const oldActive=async(p)=>p.waitForFunction(async name=>{
   const reg=await navigator.serviceWorker.ready;
   const keys=await caches.keys();
   return reg.active&&keys.includes(name);
  },oldCache,{timeout:90000});
  const newReady=async(p)=>p.waitForFunction(async name=>{
   const reg=await navigator.serviceWorker.ready;
   const keys=await caches.keys();
   if(!reg.active||!keys.includes(name))return false;
   const worker=navigator.serviceWorker.controller||reg.active;
   return new Promise(resolve=>{
    const c=new MessageChannel(),timer=setTimeout(()=>resolve(false),1500);
    c.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data?.cache===name&&e.data?.complete===true);};
    worker.postMessage({type:'math-explorer:cache-status'},[c.port2]);
   });
  },newCache,{timeout:90000});
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
  await page.close();
  page=await ctx.newPage();page.on('pageerror',e=>errors.push(String(e)));
  await lesson(page,'equivalent');
  check(JSON.parse(await read(page)).lessons.equivalent.cases[0].attempts.length===2,'closing and reopening old app preserves both attempts');
  await ctx.setOffline(true);
  await lesson(page,'share');
  await page.locator('#actions [data-do="check"]').click();
  check(JSON.parse(await read(page)).lessons.share.cases[0].attempts.length===1,'old release accepts a real offline math attempt');
  await ctx.setOffline(false);
  const beforeUpgrade=await read(page);
  fs.writeFileSync(path.join(out,'before-upgrade.json'),beforeUpgrade);
  const oldTab=page;
  // This page keeps the old release JS loaded while another tab upgrades SW.
  release='new';
  const newTab=await ctx.newPage();newTab.on('pageerror',e=>errors.push(String(e)));
  await newTab.goto(base+'v2.html#trail');
  await newTab.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});
  await newReady(newTab);
  const afterUpgrade=await read(newTab);
  fs.writeFileSync(path.join(out,'after-upgrade.json'),afterUpgrade);
  assert.deepEqual(JSON.parse(afterUpgrade),JSON.parse(beforeUpgrade),'upgrade must not rewrite saved learner records');
  check(true,'real old-to-new SW update leaves full records byte-equivalent');
  const newKeys=await newTab.evaluate(()=>caches.keys());
  check(newKeys.includes(newCache)&&!newKeys.includes(oldCache),'new SW activated and retired old cache cleaned',{cacheKeys:newKeys});
  await lesson(newTab,'share');
  await newTab.locator('#actions [data-do="check"]').click();
  const savedNew=await read(newTab);
  await oldTab.locator('#actions [data-do="check"]').click();
  check((await oldTab.locator('#storage-warning').innerText()).includes('已停止覆盖'),'old tab blocks overwrite after new tab changes same task');
  check(await read(oldTab)===savedNew,'old tab cannot erase newer release submission');
  await oldTab.screenshot({path:path.join(out,'old-tab-conflict.png')});
  await oldTab.close();
  // B39 was NEVER opened online on this profile. Its dynamic module must load offline.
  await ctx.setOffline(true);
  await lesson(newTab,'calculator39');
  check(await newTab.locator('#work').isVisible(),'never-visited B39 task and true grader module load offline');
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
  await ctx.setOffline(false);
  await newTab.goto(base+'v2.html#trail');await newTab.locator('#import-file').waitFor();
  await newTab.locator('[data-lesson-record="equivalent"]').waitFor();
  await newTab.screenshot({path:path.join(out,'new-release-trail.png')});
  const download=newTab.waitForEvent('download');
  await newTab.locator('[data-do="export"]').first().click();
  const exported=await download;
  const actualBackup=fs.readFileSync(await exported.path(),'utf8');
  fs.writeFileSync(path.join(out,'browser-export-v2.json'),actualBackup);
  check(JSON.parse(actualBackup).state.lessons.equivalent.notes.length===1,'real browser backup retains old version history after upgrade');
  // A second browser profile must receive the real V2 backup with no shared storage.
  const remote=await browser.newContext({acceptDownloads:true,serviceWorkers:'allow'});
  const remotePage=await remote.newPage();
  await remotePage.goto(base+'v2.html#trail');await remotePage.locator('#import-file').waitFor();
  const importFile=async(p,contents,name)=>p.locator('#import-file').setInputFiles({name:name||'backup.json',mimeType:'application/json',buffer:Buffer.from(contents)});
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
  const legacyPage=await legacy.newPage();await legacyPage.goto(base+'v2.html#trail');await legacyPage.locator('#import-file').waitFor();
  await importFile(legacyPage,v1,'automatically-constructed-v1.json');
  await legacyPage.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')||'{}').legacy!==undefined);
  check(JSON.parse(await read(legacyPage)).legacy!==null,'synthetic V1 backup imported via real Chromium file input',{sample:'constructed compatibility data, not child backup'});
  const unchanged=await read(legacyPage);
  for(const bad of ['{','{"app":"math-explorer","version":99,"state":{}}','{"app":"math-explorer","version":2,"state":{"schema":2}}']){
   await importFile(legacyPage,bad,'invalid-backup.json');
   check(await read(legacyPage)===unchanged,'invalid or unsupported backup rejected without mutation',{sample:bad.slice(0,40)});
  }
  // Storage quota failure: use the browser's actual localStorage quota, not a mocked setter.
  const quota=await browser.newContext({serviceWorkers:'allow'});
  const quotaPage=await quota.newPage();await quotaPage.goto(base+'v2.html#trail');await quotaPage.locator('#import-file').waitFor();
  await quotaPage.evaluate(()=>{
   let n=0;
   while(true){try{localStorage.setItem('p10-quota-padding','q'.repeat(1024*1024*(++n)));}catch(e){if(e.name!=='QuotaExceededError')throw e;break;}}
  });
  const quotaOriginal=await read(quotaPage);
  await importFile(quotaPage,actualBackup,'real-import-under-quota.json');
  check(await read(quotaPage)===quotaOriginal,'real Chromium quota failure does not overwrite existing record');
  await quotaPage.screenshot({path:path.join(out,'quota-import.png')});
  await quota.close();await legacy.close();await remote.close();
  // A failed new release install must retain old active SW and learner data.
  release='old';
  const failCtx=await browser.newContext({serviceWorkers:'allow'});
  const failPage=await failCtx.newPage();
  await failPage.goto(base+'v2.html#trail');await oldActive(failPage);
  await lesson(failPage,'equivalent');
  await failPage.locator('#actions [data-do="check"]').click();
  const failBefore=await read(failPage);
  release='new';deny='learning/phase5/b39-model.js';
  await failPage.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});
  // Wait for the attempted install, then inspect old registration and old cache.
  await failPage.waitForFunction(async name=>(await caches.keys()).some(k=>k===name),oldCache);
  const failureKeys=await failPage.evaluate(()=>caches.keys());
  check(failureKeys.includes(oldCache),'failed new SW install retains old complete cache',{cacheKeys:failureKeys});
  check(await read(failPage)===failBefore,'failed upgrade does not mutate original learning history');
  deny='';
  await failPage.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});
  await newReady(failPage);
  check(!(await failPage.evaluate(()=>caches.keys())).includes(oldCache),'retry upgrades successfully and retires old cache');
  await failCtx.setOffline(true);
  await lesson(failPage,'equivalent');
  check(JSON.parse(await read(failPage)).lessons.equivalent.cases[0].attempts.length===1,'recovered new release launches and retains history offline');
  await failCtx.close();
  check(errors.length===0,'no uncaught browser page errors',{errors});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,scenarios,errors,oldCommit:OLD,newCommit:process.env.GITHUB_SHA||'PR checkout',oldCache,newCache,realHistoricalChildBackup:false,macManual:false,childTrial:false,independentTeaching:false},null,2));
  console.log('P10_RELEASE_UPGRADE_OK '+checks.length+' real browser checks');
 }catch(e){
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({checks,scenarios,errors,error:String(e),stack:e.stack},null,2));
  console.error('P10_RELEASE_UPGRADE_FAILED '+(e.stack||e));
  process.exitCode=1;
 }finally{
  if(browser)await browser.close().catch(()=>{});
  if(server)await new Promise(resolve=>server.close(resolve));
  try{execFileSync('git',['worktree','remove','--force',oldPath],{cwd:root,stdio:'pipe'});}catch{}
  try{fs.rmSync(oldPath,{recursive:true,force:true});}catch{}
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});