// #207: in a throwaway Chromium profile, exercise SW retirement while keeping
// the exact same origin, original math record, backup and an explicit rollback.
// The flag/registration interception are TEST SIMULATION ONLY, not product behavior.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../dist');
const output=path.resolve(__dirname,'../verification/issue207-existing-sw-migration');
const key='math-explorer-v2',flag='issue207-test-only-mac-local-mode';
const checks=[],errors=[],steps=[];
let browser,context,server;
const present=async page=>page.evaluate(key=>localStorage.getItem(key),key);
const lesson=async page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).lessons.equivalent,key);
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
  // A future production guard would withhold registration only in opted-in local
  // mode. Simulate that decision without editing app files or browser settings.
  await context.addInitScript(({flag})=>{
   const sw=navigator.serviceWorker;
   if(!sw)return;
   const native=sw.register.bind(sw);
   Object.defineProperty(sw,'register',{configurable:true,value:function(...args){
    if(localStorage.getItem(flag)==='local')
     return Promise.reject(new Error('Issue207: intentional simulated local mode'));
    return native(...args);
   }});
  },{flag});
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
  await old.evaluate(flag=>localStorage.setItem(flag,'local'),flag);
  const unregistered=await old.evaluate(async()=>{
   const registration=await navigator.serviceWorker.getRegistration();
   return registration?await registration.unregister():false;
  });
  assertOk(unregistered===true,'existing scope registration can be unregistered');
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
  const localState=await point(local,'same origin, fresh page with simulated local mode');
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
  assertOk(JSON.stringify(await lesson(local))===JSON.stringify(beforeLesson),
   'lesson reload works without SW and preserves prior failed attempt');
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
  await local.evaluate(flag=>localStorage.removeItem(flag),flag);
  await local.goto(origin+'v2.html#trail');
  await local.locator('#import-file').waitFor({state:'attached'});
  await local.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  const restored=await point(local,'rollback: same-origin SW registered again');
  assertOk(restored.controller?.includes('sw.js?release=')&&restored.registrations===1,
   're-enabling the old mode restores a controlling SW');
  assertOk(JSON.stringify(await lesson(local))===JSON.stringify(correctedLesson),
   'rollback retains updated learning history exactly');
  await local.screenshot({path:path.join(output,'sw-restored.png')});
  await local.close();
  console.log('ISSUE207_SW_RETIREMENT '+JSON.stringify({status:'success',checks:checks.length,steps:steps.length}));
 }catch(error){errors.push({message:String(error),stack:error?.stack||null});console.error(error);process.exitCode=1;
 }finally{
  try{if(context)await context.close();}catch{}
  try{if(browser)await browser.close();}catch{}
  try{if(server)await new Promise(resolve=>server.close(resolve));}catch{}
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({
   schema:'issue207-existing-sw-migration/1',status:errors.length?'failure':'success',checks,steps,errors,
   limits:[
    'Fresh throwaway Chromium only; a real Mac historical release SW is not tested',
    'Register guard is a test-only simulation, not a product implementation',
    'Existing tabs were closed by the test harness, not by any user-facing migration',
    'Retirement does not erase CacheStorage; no cleanup or user-data migration performed',
    'No claim of Issue #180 root cause or default-mode change'
   ]},null,2));
 }
})();