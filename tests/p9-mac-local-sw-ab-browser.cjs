// #207: test-only experiment. Uses isolated localhost, browser contexts and invented records.
// No existing user profile, real local port, production worker or storage is modified.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const dist=path.resolve(__dirname,'../dist');
const out=path.resolve(__dirname,'../verification/issue207-mac-local-ab');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const checks=[],scenarios=[],errors=[];
let server,browser,context;
const record=async page=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
const stable=s=>JSON.stringify({models:s?.models,attempts:s?.attempts,cases:s?.cases,notes:s?.notes,draft:s?.draft});
function ok(value,message){assert.ok(value,message);checks.push(message);}
async function scenario(base,name,sw,viewport){
 const label=name+'-'+viewport.width+'x'+viewport.height;
 const errorsOnPage=[],foreign=[];
 context=await browser.newContext({viewport,reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:sw});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin!==new URL(base).origin){
   foreign.push(route.request().url());return route.abort();
  }
  return route.continue();
 });
 const page=await context.newPage();page.setDefaultTimeout(30000);
 page.on('pageerror',e=>errorsOnPage.push(String(e)));
 let t=Date.now();
 await page.goto(base+'v2.html#trail');
 await page.locator('#import-file').waitFor({state:'attached'});
 const trailMs=Date.now()-t;
 if(sw==='allow'){
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  ok(!!(await page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL)),
   label+' SW present in existing mode');
 }else{
  const state=await page.evaluate(async()=>({
   controller:navigator.serviceWorker?.controller?.scriptURL||null,
   registrations:(await navigator.serviceWorker?.getRegistrations().catch(()=>[])||[]).length
  }));
  ok(state.controller===null&&state.registrations===0,label+' SW absent in Mac-local mode');
 }
 t=Date.now();
 const initial=await page.goto(base+'learn.html#equivalent');
 await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='equivalent');
 const mathMs=Date.now()-t;
 ok(initial.status()===200,label+' fraction task loaded');
 if(sw==='block')ok(!initial.fromServiceWorker(),label+' HTTP supplies modules without SW');
 await page.locator('#actions [data-do="check"]').click();
 ok(await page.locator('#scene').getAttribute('data-stage')==='revise',label+' wrong attempt recorded');
 await page.locator('#actions [data-do="hint"]').click();
 for(const [row,index]of [[0,1],[1,2],[2,3]])
  await page.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
 await page.locator('#actions [data-do="check"]').click();
 ok(await page.locator('#scene').getAttribute('data-stage')==='passed',label+' original grader passes');
 const note='Issue207 isolated record and draft example';
 await page.locator('#note').fill(note);
 await page.locator('[data-do="save-note"]').click();
 const before=stable((await record(page)).lessons.equivalent);
 ok(before.includes(note),label+' note preserved before reload');
 await page.reload();
 await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='equivalent');
 const after=stable((await record(page)).lessons.equivalent);
 ok(before===after,label+' original model, attempt, note and draft survive reload');
 await page.screenshot({path:path.join(out,label+'-math.png')});
 await page.goto(base+'v2.html#trail');
 const downloadPromise=page.waitForEvent('download');
 await page.locator('[data-do="export"]').first().click();
 const exported=JSON.parse(fs.readFileSync(await(await downloadPromise).path(),'utf8'));
 const current=await record(page);
 ok(exported.version===2&&JSON.stringify(exported.state)===JSON.stringify(current),
  label+' real V2 export exactly matches local record');
 await page.goto(base+'learn.html#space');
 await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='space'&&
  !!document.querySelector('#cube-world canvas'));
 ok(await page.locator('#cube-world canvas').count()===1,label+' real 3D canvas');
 await page.reload();
 await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='space'&&
  !!document.querySelector('#cube-world canvas'));
 ok(stable((await record(page)).lessons.equivalent)===after,
  label+' 3D reload preserves previous fraction history');
 ok(errorsOnPage.length===0,label+' no page errors');
 ok(foreign.length===0,label+' no outside-internet requests');
 await page.screenshot({path:path.join(out,label+'-3d.png')});
 scenarios.push({name,viewport,trailMs,mathMs,checks:checks.filter(x=>x.startsWith(label)).length,
  fractionRecordDigest:hash(after),pageErrors:errorsOnPage,externalRequests:foreign});
 await context.close();context=null;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 try{
  server=http.createServer((req,res)=>{
   let rel;
   try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html';}
   catch{res.writeHead(400);res.end('invalid URL');return;}
   const filename=path.resolve(dist,rel);
   if(!filename.startsWith(dist+path.sep)){res.writeHead(400);res.end('invalid path');return;}
   fs.readFile(filename,(error,data)=>{
    if(error){res.writeHead(404);res.end('missing');return;}
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
     '.json':'application/json','.svg':'image/svg+xml','.wav':'audio/wav'};
    res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream',
     'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(data);
   });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  for(const viewport of [{width:1440,height:900},{width:1280,height:720}]){
   await scenario(base,'local-no-sw','block',viewport);
   await scenario(base,'current-sw','allow',viewport);
  }
  console.log('ISSUE207_MAC_LOCAL_AB '+JSON.stringify({status:'success',scenarios:scenarios.length,checks:checks.length}));
 }catch(error){
  errors.push({error:String(error),stack:error?.stack||null});
  process.exitCode=1;console.error(error);
 }finally{
  try{if(context)await context.close();}catch{}
  try{if(browser)await browser.close();}catch{}
  try{if(server)await new Promise(resolve=>server.close(resolve));}catch{}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
   schema:'issue207-mac-local-ab/1',status:errors.length?'failure':'success',
   scenarios,checks,errors,limitations:[
    'Isolated browser contexts: not a test of existing real user SW migration',
    'Local HTTP service is running; stopped-origin offline ability intentionally not required',
    'Passing does not prove Issue #180 historic root cause has been removed',
    'No production runtime, cache or learning record is changed'
   ]},null,2));
 }
})();