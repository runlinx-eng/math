// #207: in a throwaway Chromium profile, exercise SW retirement while keeping
// the exact same origin, original math record, backup and an explicit rollback.
// The actual opt-in page and current application modules are used; no shims.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../dist');
const output=path.resolve(__dirname,'../verification/issue207-mac-local-mode');
const key='math-explorer-v2',flag='math-explorer-runtime-mode-v1';
const checks=[],errors=[],steps=[];
let browser,context,server;
const present=async page=>page.evaluate(key=>localStorage.getItem(key),key);
const lesson=async page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).lessons.equivalent,key);
// A lesson's transient view/index/updatedAt can be updated by native openLesson.
// These are not mathematical observations. Every model, attempt, note and draft must persist.
const preserved=s=>JSON.stringify({id:s?.id,models:s?.models,cases:s?.cases,notes:s?.notes,draft:s?.draft});
const assertOk=(yes,label)=>{assert.ok(yes,label);checks.push(label);};
const point=async(page,label)=>{
 const data=await page.evaluate(async()=>{
  const r=await navigator.serviceWorker.getRegistration();
  return {url:location.href,controller:navigator.serviceWorker.controller?.scriptURL||null,
   active:r?.active?.scriptURL||null,registrations:(await navigator.serviceWorker.getRegistrations()).length,
   caches:await caches.keys(),stored:!!localStorage.getItem('math-explorer-v2')};
 });
 steps.push({label,...data});
 return data;
};
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 try{
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
   '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
  server=http.createServer((request,response)=>{
   let rel;
   try{rel=decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html';}
   catch{response.writeHead(400);response.end('invalid URL');return;}
   if(rel==='health'){
    response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
    response.end(JSON.stringify({app:'local-math-explorer',version:1,project_root:root}));return;
   }
   const file=path.resolve(root,rel);
   if(!file.startsWith(root+path.sep)){response.writeHead(400);response.end('bad path');return;}
   fs.readFile(file,(err,bytes)=>{
    if(err){response.writeHead(404);response.end('not found');return;}
    response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
     'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    response.end(bytes);
   });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  context=await browser.newContext({serviceWorkers:'allow',acceptDownloads:true,
   viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const homepage=await context.newPage();homepage.setDefaultTimeout(30000);
  await homepage.goto(origin+'v2.html#trail');
  await homepage.locator('#import-file').waitFor({state:'attached'});
  await homepage.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  const original=await point(homepage,'original sw controlled');
  assertOk(original.controller?.includes('sw.js?release='),'current release SW controls original profile');
  assertOk(original.caches.some(x=>x.startsWith('math-explorer-')),'original caches exist');
  const old=await context.newPage();old.setDefaultTimeout(30000);
  await old.goto(origin+'learn.html#equivalent');
  await old.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='equivalent');
  await old.locator('#actions [data-do="check"]').click();
  assertOk(await old.locator('#scene').getAttribute('data-stage')==='revise',
   'actual incorrect fraction attempt creates a retained learning record');
  const beforeRaw=await present(old);
  const beforeLesson=await lesson(old);
  assertOk(!!beforeRaw&&beforeLesson?.cases?.[0]?.attempts?.length===1,
   'the actual first incorrect attempt exists in cases[0].attempts before retirement');
  // The real settings page verifies the local Python launcher before enabling.
  await homepage.goto(origin+'mac-local.html');
  await homepage.waitForFunction(()=>document.querySelector('#health').textContent==='正在运行');
  assertOk(await homepage.locator('#enable').isDisabled(),
   'mode is opt-in and requires backup acknowledgement');
  await homepage.locator('#ack').check();
  homepage.once('dialog',dialog=>dialog.accept());
  await homepage.locator('#enable').click();
  await homepage.waitForFunction(()=>document.querySelector('#result').textContent.includes('已切换选择'));
  assertOk(await homepage.evaluate(flag=>localStorage.getItem(flag)==='mac-local',flag),
   'product settings page persisted an explicit Mac-local choice');
  assertOk((await homepage.evaluate(async()=>navigator.serviceWorker.getRegistrations())).length===0,
   'product settings retired only the current SW registration');
  assertOk(await present(old)===beforeRaw,'unregister did not alter one byte of learning record');
  const retired=await point(old,'unregistered on still-open old client');
  assertOk(JSON.stringify(retired.caches)===JSON.stringify(original.caches),
   'retirement does not erase original CacheStorage');
  // Unregister does not immediately detach an existing controlled document.
  // Close only throwaway test tabs; a real Mac rollout needs user-visible guidance.
  await old.close();await homepage.close();
  const local=await context.newPage();local.setDefaultTimeout(30000);
  await local.goto(origin+'v2.html#trail');
  await local.locator('#import-file').waitFor({state:'attached'});
  const localState=await point(local,'same origin, fresh page with real Mac-local mode');
  assertOk(localState.controller===null&&localState.registrations===0,
   'new local client has no SW controller or registration');
  assertOk(JSON.stringify((await lesson(local)))===JSON.stringify(beforeLesson),
   'all original lesson fields survive same-origin SW retirement');
  const backupEvent=local.waitForEvent('download');
  await local.locator('[data-do="export"]').first().click();
  const backup=JSON.parse(fs.readFileSync(await(await backupEvent).path(),'utf8'));
  const current=JSON.parse(await present(local));
  assertOk(backup.version===2&&JSON.stringify(backup.state)===JSON.stringify(current),
   'real V2 export remains valid in local mode');
  assertOk(JSON.stringify(backup.state.lessons.equivalent)===JSON.stringify(beforeLesson),
   'backup contains every original lesson field after retirement');
  await local.goto(origin+'learn.html#equivalent');
  await local.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='equivalent');
  assertOk(preserved(await lesson(local))===preserved(beforeLesson),
   'lesson reload without SW preserves every model, attempt, note and draft');
  await local.locator('#actions [data-do="hint"]').click();
  for(const [row,index] of [[0,1],[1,2],[2,3]]){
   await local.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
  }
  await local.locator('#actions [data-do="check"]').click();
  assertOk(await local.locator('#scene').getAttribute('data-stage')==='passed',
   'new local-mode actions still use original grader and save corrected history');
  const correctedLesson=await lesson(local);
  assertOk(JSON.stringify(correctedLesson)!==JSON.stringify(beforeLesson),
   'local-mode math writes a new valid update while retaining earlier history');
  await local.screenshot({path:path.join(output,'local-after-retirement.png')});
  await local.goto(origin+'mac-local.html');
  await local.waitForFunction(()=>document.querySelector('#health').textContent==='正在运行');
  assertOk(await local.locator('#restore').isEnabled(),'product page provides explicit rollback');
  await local.locator('#restore').click();
  await local.waitForFunction(()=>document.querySelector('#result').textContent.includes('已恢复离线模式'));
  assertOk(await local.evaluate(flag=>localStorage.getItem(flag)===null,flag),
   'product rollback does not delete any learner data');
  await local.goto(origin+'v2.html#trail');
  await local.locator('#import-file').waitFor({state:'attached'});
  await local.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  const restored=await point(local,'rollback: same-origin SW registered again');
  assertOk(restored.controller?.includes('sw.js?release=')&&restored.registrations===1,
   're-enabling the old mode restores a controlling SW');
  assertOk(preserved(await lesson(local))===preserved(correctedLesson),
   'rollback preserves updated mathematical evidence, notes and draft');
  await local.screenshot({path:path.join(output,'sw-restored.png')});
  await local.close();
  console.log('ISSUE207_MAC_LOCAL_PRODUCT '+JSON.stringify({status:'success',checks:checks.length,steps:steps.length}));
 }catch(error){errors.push({message:String(error),stack:error?.stack||null});console.error(error);process.exitCode=1;
 }finally{
  try{if(context)await context.close();}catch{}
  try{if(browser)await browser.close();}catch{}
  try{if(server)await new Promise(resolve=>server.close(resolve));}catch{}
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({
   schema:'issue207-mac-local-product/1',status:errors.length?'failure':'success',checks,steps,errors,
   limits:[
    'Fresh throwaway Chromium only; a real Mac historical release SW is not tested',
    'Real feature-branch settings page is exercised without a registration mock',
    'Existing tabs were closed by the test harness, not by any user-facing migration',
    'Retirement does not erase CacheStorage; no cleanup or user-data migration performed',
    'No claim of Issue #180 root cause or default-mode change'
   ]},null,2));
 }
})();