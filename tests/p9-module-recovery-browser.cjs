// Real Chromium checks. This is deliberate failure injection, never evidence
// that the historical intermittent Chromium failure has been root-caused.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-module-recovery');
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/^const CACHE = '([^']+)'/m)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const output={release:cache,viewports:[],checks:[],failures:[],historicRootCauseEstablished:false};
const ok=(condition,why)=>{assert.ok(condition,why);output.checks.push(why);};
const wait=page=>page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='share',{timeout:20000});
const state=page=>page.evaluate(()=>({
 raw:localStorage.getItem('math-explorer-v2'),
 ready:window.mathLesson?.snapshot?.()||null,
 recovery:window.mathStartupRecovery||null,
 warning:document.querySelector('#storage-warning')?.textContent||'',
 warningVisible:document.querySelector('#storage-warning')?.hidden===false,
 title:document.querySelector('#title')?.textContent||'',
 instruction:document.querySelector('#instruction')?.textContent||'',
 work:document.querySelector('#work')?.textContent||''
}));
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 let browser,server,context;
 try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  output.browserVersion=browser.version();
  for(const [width,height] of [[1440,900],[1280,720]]){
   const record={viewport:[width,height],errors:[],requests:[],injections:[],steps:[]};
   output.viewports.push(record);
   server=http.createServer((req,res)=>{
    const file=new URL(req.url,'http://localhost').pathname.replace(/^\/+/,'')||'index.html';
    fs.readFile(path.join(root,'dist',file),(err,data)=>{
     res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(err?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',error=>record.errors.push(String(error)));
   page.on('requestfailed',request=>record.requests.push({url:request.url(),error:request.failure()?.errorText}));
   await page.goto(base+'v2.html#trail');
   await page.waitForFunction(release=>navigator.serviceWorker.controller?.scriptURL.endsWith('?release='+release),cache);
   await page.waitForFunction(async release=>{
    const controller=navigator.serviceWorker.controller;
    if(!controller)return false;
    return await new Promise(resolve=>{
     const channel=new MessageChannel();
     const timeout=setTimeout(()=>resolve(false),800);
     channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data?.cache===release&&event.data.complete===true);};
     controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
    });
   },cache);
   await page.goto(base+'learn.html#share');await wait(page);
   const healthy=await state(page);
   ok(healthy.ready?.id==='share'&&!healthy.recovery&&!healthy.warningVisible,
    width+' normal page initializes once without recovery');
   record.steps.push({kind:'online',ready:healthy.ready?.id,rawBytes:healthy.raw?.length});
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});server=null;
   const response=await page.reload();await wait(page);
   const offline=await state(page);
   ok(response?.fromServiceWorker()&&offline.ready?.id==='share'&&!offline.recovery,
    width+' healthy stopped-origin reload uses existing SW without recovery');
   ok(offline.raw===healthy.raw,width+' healthy offline navigation does not alter records');
   record.steps.push({kind:'offline',fromServiceWorker:response.fromServiceWorker(),rawBytes:offline.raw?.length});
   // CDP request interception targets precisely the normal entry URL;
   // release-scoped mirror imports are never intercepted. Avoid cache deletion.
   const cdp=await context.newCDPSession(page);
   let failures=0;
   cdp.on('Fetch.requestPaused',async event=>{
    const u=new URL(event.request.url);
    const original=u.pathname==='/learning/learn.js'&&!u.searchParams.has('module-recovery');
    try{
     if(original&&failures===0){
      failures++;
      record.injections.push({url:event.request.url,requestId:event.requestId,kind:'Fetch.failRequest',reason:'Aborted'});
      await cdp.send('Fetch.failRequest',{requestId:event.requestId,errorReason:'Aborted'});
     }else await cdp.send('Fetch.continueRequest',{requestId:event.requestId});
    }catch(error){record.errors.push('CDP Fetch: '+error);}
   });
   await cdp.send('Fetch.enable',{patterns:[{urlPattern:'*learning/learn.js*',requestStage:'Request'}]});
   const injectedResponse=await page.reload();await wait(page);
   await cdp.send('Fetch.disable');
   const recovered=await state(page);
   record.steps.push({kind:'injected',failures,ready:recovered.ready?.id,
    recovery:recovered.recovery,rawBytes:recovered.raw?.length,
    fromServiceWorker:injectedResponse?.fromServiceWorker(),warning:recovered.warning});
   ok(failures===1,width+' exactly one original script resource request was aborted');
   ok(recovered.recovery?.attempts===1&&recovered.recovery.status==='recovered',
    width+' failed original entry recovered through verified release-scoped module graph');
   ok(recovered.ready?.id==='share'&&recovered.title&&recovered.instruction,
    width+' real lesson title, task and snapshot available after recovery');
   ok(recovered.raw===offline.raw,width+' recovery did not change raw learning v2 history');
   ok(!recovered.warningVisible,width+' recovered page hides original warning after success');
   await page.screenshot({path:path.join(out,width+'x'+height+'-recovered.png')});
   // Alter the cached entry for a fresh reload; same-release SHA pin must reject.
   const tamper=await page.evaluate(async release=>{
    const store=await caches.open(release),url=new URL('learning/learn.js',location.href),original=await store.match(url);
    if(!original)throw Error('entry missing before integrity test');
    await store.put(url,new Response((await original.text())+'\n// deliberately changed entry',{
     headers:{'Content-Type':'text/javascript'}}));
    return true;
   },cache);
   ok(tamper,width+' isolated entry tamper is deliberate');
   await page.reload();
   await page.waitForFunction(()=>window.mathStartupRecovery?.status==='failed');
   const rejected=await state(page);
   record.steps.push({kind:'integrity-tamper',recovery:rejected.recovery,warning:rejected.warning,
    rawBytes:rejected.raw?.length});
   ok(rejected.recovery?.failure==='entry-integrity-mismatch',
    width+' current-release entry integrity mismatch is rejected');
   ok(rejected.warningVisible,width+' failed recovery shows an explicit alert');
   ok(rejected.raw===offline.raw,width+' failed integrity recovery preserves exact original records');
   await page.screenshot({path:path.join(out,width+'x'+height+'-integrity-rejected.png')});
   await context.close();context=null;
  }
  output.status='success';
 }catch(error){
  output.status='failed';output.failures.push({error:String(error),stack:error?.stack});
  console.error(error.stack);process.exitCode=1;
 }finally{
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(output,null,2));
  try{if(context)await context.close();}catch{}
  try{if(server){await new Promise(resolve=>server.close(resolve));server.closeAllConnections();}}catch{}
  try{if(browser)await browser.close();}catch{}
  console.log('P9_MODULE_RECOVERY '+JSON.stringify({status:output.status,checks:output.checks.length,
   viewports:output.viewports.length,failures:output.failures.map(x=>x.error)}));
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
