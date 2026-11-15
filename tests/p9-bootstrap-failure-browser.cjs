// Deliberate cache damage in an isolated Chromium context: healthy offline
// reloads must work, and a missing child module must show an explicit warning.
// Never operates on any user's real storage, and preserves original maths.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-bootstrap-failure');
const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const headSha=event.pull_request?.head?.sha||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const testedCheckoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const checks=[],results=[],errors=[];
const ok=(state,description)=>{assert.ok(state,description);checks.push(description);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 let browser,server,context,page,label='setup';
 try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  for(const [width,height]of [[1440,900],[1280,720]]){
   label=width+'x'+height;
   server=http.createServer((request,response)=>{
    const relative=new URL(request.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',relative),(error,data)=>{
     response.writeHead(error?404:200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-store'});
     response.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   page=await context.newPage();page.setDefaultTimeout(20000);
   const pageErrors=[],consoleErrors=[],failedRequests=[];
   page.on('pageerror',error=>pageErrors.push(String(error)));
   page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
   page.on('requestfailed',request=>failedRequests.push({url:request.url(),error:request.failure()?.errorText||null}));
   await page.goto(base+'v2.html#trail');
   await page.waitForFunction(release=>navigator.serviceWorker.controller?.state==='activated'&&
    new URL(navigator.serviceWorker.controller.scriptURL).searchParams.get('release')===release,release);
   const cacheReport=await page.evaluate(async release=>{
    const worker=navigator.serviceWorker.controller;
    return await new Promise(resolve=>{
     const channel=new MessageChannel(),t=setTimeout(()=>resolve({complete:false}),1200);
     channel.port1.onmessage=event=>{clearTimeout(t);resolve(event.data);};
     worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
    });
   },release);
   ok(cacheReport.complete&&cacheReport.cache===release&&cacheReport.cached===cacheReport.total,
    label+' complete current-release precache before intentional fault');
   await page.goto(base+'learn.html#share');
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='share');
   const initial=await page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2'),
    title:document.querySelector('#title')?.textContent||'',
    warningHidden:document.querySelector('#storage-warning')?.hidden===true}));
   ok(typeof initial.raw==='string'&&initial.raw.length>0&&initial.warningHidden,
    label+' normal lesson initializes saved v2 state without warning');
   await page.screenshot({path:path.join(out,label+'-healthy.png'),fullPage:false});
   await new Promise(resolve=>server.close(resolve));server.closeAllConnections();server=null;
   const successfulOfflineReloads=[];
   for(let attempt=0;attempt<12;attempt++){
    const res=await page.reload();
    await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='share');
    const healthy=await page.evaluate(()=>({title:document.querySelector('#title')?.textContent||'',
     instruction:document.querySelector('#instruction')?.textContent||'',
     warningHidden:document.querySelector('#storage-warning')?.hidden===true}));
    ok(res?.status()===200&&res.fromServiceWorker()&&healthy.warningHidden&&healthy.instruction.length>0,
     label+' stopped-origin reload '+(attempt+1)+' renders real maths');
    successfulOfflineReloads.push({attempt:attempt+1,status:res.status(),fromServiceWorker:res.fromServiceWorker(),
     title:healthy.title,instructionLength:healthy.instruction.length});
   }
   const before=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
   const deletion=await page.evaluate(async release=>{
    const cache=await caches.open(release),url=new URL('./learning/phase5/b18-view.js',location.href);
    const existed=!!(await cache.match(url)),deleted=await cache.delete(url);
    return{existed,deleted,after:!!(await cache.match(url))};
   },release);
   ok(deletion.existed&&deletion.deleted&&!deletion.after,
    label+' deliberately remove exactly one imported ESM from this isolated cache');
   const response=await page.reload();
   await page.locator('#storage-warning').waitFor({state:'visible'});
   const after=await page.evaluate(()=>({raw:localStorage.getItem('math-explorer-v2'),
    warning:document.querySelector('#storage-warning')?.textContent||'',
    visible:document.querySelector('#storage-warning')?.hidden===false,
    lesson:window.mathLesson?.snapshot?.()||null,
    readyState:document.readyState,title:document.querySelector('#title')?.textContent||''}));
   ok(response?.status()===200&&response.fromServiceWorker(),
    label+' document still loads from SW with stopped source server');
   ok(after.visible&&/程序未能加载/.test(after.warning)&&/已保存的学习记录没有被清除/.test(after.warning),
    label+' a missing module shows the failure instead of a silent empty shell');
   ok(after.lesson===null&&after.readyState==='complete',
    label+' reproduced genuine pre-bootstrap module-graph failure');
   assert.equal(after.raw,before,label+' cached module failure must not modify saved work');
   checks.push(label+' original saved bytes preserved');
   await page.screenshot({path:path.join(out,label+'-missing-module-warning.png'),fullPage:false});
   results.push({label,release,cacheReport,successfulOfflineReloads,
    missingModule:'learning/phase5/b18-view.js',deletion,
    response:{status:response.status(),fromServiceWorker:response.fromServiceWorker()},
    before:{rawBytes:before.length},after:{readyState:after.readyState,warning:after.warning,
     lesson:after.lesson,storedBytes:after.raw.length,title:after.title},
    pageErrors,consoleErrors,failedRequests});
   await context.close();context=null;page=null;
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({headSha,testedCheckoutSha,release,
   browserVersion:browser.version(),checks,results,errors},null,2));
  console.log('P9_BOOTSTRAP_FAILURE_BROWSER '+JSON.stringify({status:'success',headSha,checks:checks.length,viewports:results.length}));
 }catch(error){
  errors.push({label,message:String(error),stack:error?.stack});
  try{if(page)await page.screenshot({path:path.join(out,label+'-failure.png'),timeout:4000});}catch{}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({headSha,testedCheckoutSha,release,checks,results,errors},null,2));
  console.error(error);process.exitCode=1;
 }finally{
  try{if(context)await context.close();}catch{}
  try{if(server){await new Promise(resolve=>server.close(resolve));server.closeAllConnections();}}catch{}
  try{if(browser)await browser.close();}catch{}
 }
})();
