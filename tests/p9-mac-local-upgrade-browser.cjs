// #207: old *released main* SW -> new opt-in page -> Mac-local HTTP -> new release SW.
// Isolated localhost server and throwaway Chromium; never touch a real Mac profile.
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const repo=path.resolve(__dirname,'..'),newDist=path.join(repo,'dist');
const prior='db5f9a0218b90a35f87e9c21e9e61fdf6c8acd5e';
const output=path.join(repo,'verification/issue207-mac-local-upgrade');
const KEY='math-explorer-v2',MODE='math-explorer-runtime-mode-v1';
const release=p=>fs.readFileSync(path.join(p,'sw.js'),'utf8').match(/^const CACHE = '([^']+)'/m)?.[1];
const latest=release(newDist);
const out={schema:'issue207-mac-local-upgrade/1',from:prior,to:latest,checks:[],states:[],errors:[],
  limitations:['One last-main release to current draft only; not every historical cache version',
   'All browser profiles are ephemeral; manual Mac acceptance not claimed',
   'A success does not establish #180 natural bug root cause']};
let browser,context,server,oldDir,version='old';
const ok=(value,label)=>{assert.ok(value,label);out.checks.push(label);};
const data=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const protectedEvidence=lesson=>JSON.stringify({
 id:lesson?.id,models:lesson?.models,cases:lesson?.cases,notes:lesson?.notes,draft:lesson?.draft});
const state=async(page,label)=>{
 const v=await page.evaluate(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return {controller:navigator.serviceWorker.controller?.scriptURL||null,
   registration:registration?.active?.scriptURL||null,
   registered:(await navigator.serviceWorker.getRegistrations()).length,
   keys:await caches.keys()};
 });
 out.states.push({label,...v});
 return v;
};
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 try{
  oldDir=fs.mkdtempSync(path.join(os.tmpdir(),'math-issue207-previous-'));
  execFileSync('git',['worktree','add','--detach',oldDir,prior],{cwd:repo,stdio:'pipe'});
  const oldDist=path.join(oldDir,'dist'),oldRelease=release(oldDist);
  assert.ok(oldRelease&&oldRelease!==latest,'historic and candidate SW releases must differ');
  out.previousRelease=oldRelease;
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
   '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
   '.svg':'image/svg+xml','.wav':'audio/wav'};
  server=http.createServer((request,response)=>{
   let rel;
   try{rel=decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html';}
   catch{response.writeHead(400);response.end('bad url');return;}
   if(rel==='health'){
    response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
    response.end(JSON.stringify({app:'local-math-explorer',version:1,project_root:repo}));return;
   }
   const root=version==='old'?oldDist:newDist,filename=path.resolve(root,rel);
   if(!filename.startsWith(root+path.sep)){response.writeHead(400);response.end('bad path');return;}
   fs.readFile(filename,(err,bytes)=>{
    if(err){response.writeHead(404);response.end('missing');return;}
    response.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream',
     'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    response.end(bytes);
   });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  context=await browser.newContext({serviceWorkers:'allow',acceptDownloads:true,reducedMotion:'reduce',
   viewport:{width:1440,height:900}});
  const older=await context.newPage();older.setDefaultTimeout(90000);
  const math=await context.newPage();math.setDefaultTimeout(90000);
  const errors=[];for(const page of [older,math])page.on('pageerror',error=>errors.push(String(error)));
  await older.goto(origin+'v2.html#trail');
  await older.locator('#import-file').waitFor({state:'attached'});
  await older.waitForFunction(release=>navigator.serviceWorker.controller?.scriptURL.includes('release='+release),oldRelease);
  const before=await state(older,'old release before upgrade');
  ok(before.registered===1&&before.keys.includes(oldRelease),'last-main SW registration and cache are active');
  await math.goto(origin+'learn.html#equivalent');
  await math.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='equivalent');
  await math.locator('#actions [data-do="check"]').click();
  ok(await math.locator('#scene').getAttribute('data-stage')==='revise','old math grader records incorrect attempt');
  const original=(await data(math)).lessons.equivalent;
  ok(original.cases[0].attempts.length===1,'old release has actual stored evidence');
  // Replace only HTTP server files; old cache/controller are still alive.
  version='new';
  await older.goto(origin+'mac-local.html');
  await older.waitForFunction(()=>document.querySelector('#health')?.textContent==='正在运行');
  ok(await older.locator('#enable').isDisabled(),'new inline settings page is reachable under old SW');
  await older.locator('#ack').check();
  older.once('dialog',dialog=>dialog.accept());
  await older.locator('#enable').click();
  await older.waitForFunction(()=>document.querySelector('#result').textContent.includes('已切换选择'));
  ok(await older.evaluate(k=>localStorage.getItem(k)==='mac-local',MODE),
   'new settings page sets mode while the old release controller exists');
  const retired=await state(older,'old SW deregistered by real new settings');
  ok(retired.registered===0&&retired.keys.includes(oldRelease),
   'old SW registration removed without cache deletion');
  ok(protectedEvidence((await data(math)).lessons.equivalent)===protectedEvidence(original),
   'old math observation unchanged during mode selection');
  await older.close();await math.close();
  const local=await context.newPage();local.setDefaultTimeout(90000);
  local.on('pageerror',error=>errors.push(String(error)));
  await local.goto(origin+'v2.html#trail');
  await local.locator('#import-file').waitFor({state:'attached'});
  const noSW=await state(local,'new files in Mac-local mode');
  ok(noSW.controller===null&&noSW.registered===0,'new no-SW client starts after historical cache retirement');
  ok(protectedEvidence((await data(local)).lessons.equivalent)===protectedEvidence(original),
   'old learning data preserved under new source');
  await local.goto(origin+'learn.html#equivalent');
  await local.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='equivalent');
  ok(protectedEvidence((await data(local)).lessons.equivalent)===protectedEvidence(original),
   'new lesson JS validates old mathematical history');
  await local.locator('#actions [data-do="hint"]').click();
  for(const [row,index]of [[0,1],[1,2],[2,3]])
   await local.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
  await local.locator('#actions [data-do="check"]').click();
  const improved=(await data(local)).lessons.equivalent;
  ok(improved.cases[0].attempts.length===2,'user can continue correction under new local mode');
  await local.screenshot({path:path.join(output,'old-release-to-mac-local.png')});
  await local.goto(origin+'v2.html#trail');
  const backupReady=local.waitForEvent('download');
  await local.locator('[data-do="export"]').first().click();
  const backup=JSON.parse(fs.readFileSync(await(await backupReady).path(),'utf8'));
  ok(backup.version===2&&JSON.stringify(backup.state)===JSON.stringify(await data(local)),
   'full V2 backup remains valid across historical release');
  await local.goto(origin+'mac-local.html');
  await local.waitForFunction(()=>document.querySelector('#health').textContent==='正在运行');
  await local.locator('#restore').click();
  await local.waitForFunction(()=>document.querySelector('#result').textContent.includes('已恢复离线模式'));
  await local.goto(origin+'v2.html#trail');
  await local.locator('#import-file').waitFor({state:'attached'});
  await local.waitForFunction(release=>navigator.serviceWorker.controller?.scriptURL.includes('release='+release),latest);
  const newSW=await state(local,'new release re-enabled on rollback');
  ok(newSW.registered===1&&newSW.keys.includes(latest),'new release cache installed after rollback');
  ok(protectedEvidence((await data(local)).lessons.equivalent)===protectedEvidence(improved),
   'rollback to new SW keeps all old and new mathematical attempts');
  ok(errors.length===0,'no page errors during historical release upgrade');
  await local.screenshot({path:path.join(output,'new-release-rollback.png')});
  await local.close();
  console.log('ISSUE207_OLD_RELEASE_UPGRADE '+JSON.stringify({status:'success',checks:out.checks.length,oldRelease,newRelease:latest}));
 }catch(error){out.errors.push({error:String(error),stack:error?.stack||null});console.error(error);process.exitCode=1;}
 finally{
  try{if(context)await context.close();}catch{}
  try{if(browser)await browser.close();}catch{}
  try{if(server)await new Promise(resolve=>server.close(resolve));}catch{}
  if(oldDir){try{execFileSync('git',['worktree','remove','--force',oldDir],{cwd:repo,stdio:'pipe'});}catch{}
   try{fs.rmSync(oldDir,{recursive:true,force:true});}catch{}}
  out.status=out.errors.length?'failure':'success';
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(out,null,2));
 }
})();