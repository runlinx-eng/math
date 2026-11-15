// Real Chromium checks. This is deliberate failure injection, never evidence
// that the historical intermittent Chromium failure has been root-caused.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-module-recovery');
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/^const CACHE = '([^']+)'/m)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
// The harness alters only the SW bytes served to this isolated test origin.
 // Production dist/sw.js and its complete cache remain byte-identical.
const baseWorker=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
const injectedWorker=baseWorker
 .replace("self.addEventListener('fetch',event=>{",String.raw`let __testScriptFaultPath=null,__testScriptFaults=0;
const __testInjectedRequests=[];
self.addEventListener('message',event=>{
 if(event.data?.type==='test-arm-entry-fault'||event.data?.type==='test-arm-child-fault'){
  const path=event.data.type==='test-arm-entry-fault'?'/learning/learn.js':event.data.path;
  if(!['/learning/learn.js','/learning/phase4/common.js','/learning/phase5/b07.js'].includes(path))return;
  __testScriptFaultPath=path;event.ports?.[0]?.postMessage({armed:true,path});
 }else if(event.data?.type==='test-entry-fault-count'){
  event.ports?.[0]?.postMessage({count:__testScriptFaults,requests:__testInjectedRequests,
   remaining:__testScriptFaultPath});
 }
});
self.addEventListener('fetch',event=>{`)
 .replace(" if(event.request.destination==='script'&&url.searchParams.has(MODULE_RECOVERY_KEY)){",String.raw` if(__testScriptFaultPath&&event.request.destination==='script'&&
    url.pathname===__testScriptFaultPath&&!url.searchParams.has(MODULE_RECOVERY_KEY)){
  __testScriptFaultPath=null;__testScriptFaults++;
  __testInjectedRequests.push({url:url.href,status:503});
  event.respondWith(Promise.resolve(new Response('intentional resource failure',{status:503,
   headers:{'Content-Type':'text/plain'}})));return;
 }
 if(event.request.destination==='script'&&url.searchParams.has(MODULE_RECOVERY_KEY)){`);
if(injectedWorker===baseWorker||!injectedWorker.includes('__testScriptFaults++'))
 throw Error('test-only SW response fixture failed to install');
const askWorker=(page,type,extra={})=>page.evaluate(data=>new Promise(resolve=>{
 const channel=new MessageChannel(),timer=setTimeout(()=>resolve(null),2000);
 channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};
 navigator.serviceWorker.controller.postMessage(data,[channel.port2]);
}),{type,...extra});
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const output={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
 release:cache,viewports:[],checks:[],failures:[],historicRootCauseEstablished:false};
const ok=(condition,why)=>{assert.ok(condition,why);output.checks.push(why);};
const wait=(page,recovering=false)=>page.waitForFunction(recovering=>
 window.mathLesson?.snapshot?.()?.id==='share'&&(!recovering||window.mathStartupRecovery?.status==='recovered'),
 recovering,{timeout:20000});
const learningHistory=raw=>{
 const state=JSON.parse(raw);
 const take=records=>Object.fromEntries(Object.entries(records||{}).map(([id,entry])=>
  [id,{models:entry.models,cases:entry.cases,completed:entry.completed}]));
 return JSON.stringify({lessons:take(state.lessons),bridges:take(state.daily?.bridges)});
};
const state=page=>page.evaluate(()=>({
 raw:localStorage.getItem('math-explorer-v2'),
 ready:window.mathLesson?.snapshot?.()||null,
 recovery:window.mathStartupRecovery||null,
 warning:document.querySelector('#storage-warning')?.textContent||'',
 warningVisible:document.querySelector('#storage-warning')?.hidden===false,
 title:document.querySelector('#title')?.textContent||'',
 instruction:document.querySelector('#instruction')?.textContent||'',
 work:document.querySelector('#work')?.textContent||'',
 feedbackState:document.querySelector('#check-feedback')?.dataset.state||null
}));
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const saveState=(label,value)=>{
 assert.equal(typeof value.raw,'string');
 fs.writeFileSync(path.join(out,label+'-storage.txt'),value.raw);
 fs.writeFileSync(path.join(out,label+'-page.json'),JSON.stringify({...value,raw:undefined,
  rawFile:label+'-storage.txt',rawBytes:Buffer.byteLength(value.raw),rawSha256:digest(value.raw)},null,2));
};
const preservedState=raw=>{
 const value=JSON.parse(raw);
 // A normal lesson boot updates exactly these two timestamps. Everything
 // else, including the current draft, attempts, notes and UI, must match.
 value.lessons.share.updatedAt='boot timestamp';
 value.daily.continuation.at='boot timestamp';
 return value;
};
const cacheModules=page=>page.evaluate(async release=>{
 const store=await caches.open(release),files=['learning/learn.js','learning/phase4/common.js','learning/phase5/b07.js'];
 return Promise.all(files.map(async file=>{
  const response=await store.match(new URL(file,location.href));
  if(!response)return{file,missing:true};
  const bytes=await response.arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',bytes);
  return{file,status:response.status,type:response.headers.get('content-type'),bytes:bytes.byteLength,
   sha256:Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('')};
 }));
},cache);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 let browser,server,context,activePage,diagnostics,label='setup';
 try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  output.browserVersion=browser.version();
  for(const [width,height] of [[1440,900],[1280,720]]){
   const record={viewport:[width,height],errors:[],requests:[],responses:[],injections:[],steps:[]};
   label=width+'x'+height+'-setup';
   output.viewports.push(record);
   server=http.createServer((req,res)=>{
    const file=new URL(req.url,'http://localhost').pathname.replace(/^\/+/,'')||'index.html';
    fs.readFile(path.join(root,'dist',file),(err,data)=>{
     const workerCode=!err&&file==='sw.js'?Buffer.from(injectedWorker):data;
     res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(err?'missing':workerCode);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   diagnostics=observeBrowserDiagnostics(page,{out,base,label:()=>label});
   page.on('pageerror',error=>record.errors.push(String(error)));
   page.on('requestfailed',request=>record.requests.push({label,url:request.url(),error:request.failure()?.errorText}));
   page.on('response',response=>{
    if(response.request().resourceType()==='script')record.responses.push({label,url:response.url(),
     status:response.status(),fromServiceWorker:response.fromServiceWorker()});
   });
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
   label=width+'x'+height+'-healthy-offline';
   const response=await page.reload();await wait(page);
   const offline=await state(page);
   ok(response?.fromServiceWorker()&&offline.ready?.id==='share'&&!offline.recovery,
    width+' healthy stopped-origin reload uses existing SW without recovery');
   ok(learningHistory(offline.raw)===learningHistory(healthy.raw),width+' healthy offline reload preserves mathematics, original models and attempts');
   record.steps.push({kind:'offline',fromServiceWorker:response.fromServiceWorker(),rawBytes:offline.raw?.length});
   saveState(label,offline);
   // Existing B39 work makes every later startup validate the real computed
   // lazy-import path. Its catalog depends on b07.js, one of the failed URLs.
   label=width+'x'+height+'-existing-b39';
   await page.goto(base+'learn.html#graph39');
   await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='graph39',null,{timeout:20000});
   await page.locator('[data-x="s39-mark"]').click();
   await page.locator('#actions [data-do="check"]').click();
   const b39Before=await state(page),b39Record=JSON.parse(b39Before.raw).lessons.graph39;
   ok(b39Record?.cases[0]?.attempts.length===1&&b39Before.feedbackState==='revise',
    width+' actual B39 UI leaves a failed attempt that future startup must validate');
   saveState(label,b39Before);
   await page.goto(base+'learn.html#share');await wait(page);
   // Make real incorrect/correct submissions, then change the current work
   // without submitting it. No record or model is injected through page APIs.
   label=width+'x'+height+'-real-learning';
   await page.locator('#actions [data-do="check"]').click();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',
    width+' unequal unselected partition produces a real failed attempt');
   saveState(label+'-wrong',await state(page));
   await page.locator('[data-do="equal"]').click();
   await page.locator('[data-do="part"][data-index="0"]').click();
   await page.locator('#actions [data-do="check"]').click();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',
    width+' actual equal fifths and one selection produce a corrected attempt');
   saveState(label+'-correct',await state(page));
   await page.locator('[data-do="part"][data-index="1"]').click();
   const draft=await state(page),recorded=JSON.parse(draft.raw).lessons.share;
   ok(recorded.cases[0].attempts.length===2&&recorded.cases[0].attempts[0].value.selected.length===0&&
    recorded.cases[0].attempts[1].value.selected.join(',')==='0'&&recorded.models[0].selected.join(',')==='0,1',
    width+' saved failed/correct attempts and distinct current unsubmitted draft are all present');
   ok(draft.feedbackState!=='correct',width+' old positive feedback expires after the real draft edit');
   saveState(label+'-draft',draft);
   const canonicalCache=await cacheModules(page);
   ok(canonicalCache.every(item=>item.status===200&&item.bytes>0),width+' intact original module bytes are retained before injection');
   record.canonicalCache=canonicalCache;
   let recovered=draft;
   for(const [index,failedScript]of ['learning/learn.js','learning/phase4/common.js','learning/phase5/b07.js'].entries()){
    label=width+'x'+height+'-fault-'+index;
    const before=await state(page);saveState(label+'-before',before);
    const armed=await askWorker(page,index===0?'test-arm-entry-fault':'test-arm-child-fault',{path:'/'+failedScript});
    ok(armed?.armed===true&&armed.path==='/'+failedScript,label+' test worker arms exactly the original requested module');
    const responseStart=record.responses.length;
    const injectedResponse=await page.reload();await wait(page,true);
    const count=await askWorker(page,'test-entry-fault-count');
    const failures=count?.count||0;
    record.injections.push({kind:'test-only-SW-503',failedScript,count:failures,worker:count});
    recovered=await state(page);saveState(label+'-after',recovered);
    record.steps.push({kind:'injected',failedScript,failures,ready:recovered.ready?.id,
     recovery:recovered.recovery,rawBytes:recovered.raw?.length,
     fromServiceWorker:injectedResponse?.fromServiceWorker(),warning:recovered.warning});
    ok(failures===index+1&&count.remaining===null&&count.requests.at(-1).url===base+failedScript,
     label+' exactly one additional original module request receives the intended 503');
    const navigationResponses=record.responses.slice(responseStart);
    ok(navigationResponses.some(item=>item.url===base+failedScript&&item.status===503&&item.fromServiceWorker),
     label+' Chromium observes the original module failure from the isolated worker');
    ok(navigationResponses.some(item=>item.url===base+failedScript+'?module-recovery='+cache&&
     item.status===200&&item.fromServiceWorker),label+' the failed module loads at its verified release mirror URL');
    ok(['learning/phase5/b39.js','learning/phase5/b39-model.js'].every(file=>
     navigationResponses.some(item=>item.url===base+file+'?module-recovery='+cache&&item.status===200&&item.fromServiceWorker)),
     label+' existing B39 record validation uses the same recovery graph for both computed imports');
    ok(recovered.recovery?.attempts===1&&recovered.recovery.status==='recovered',
     label+' entry or child failure recovers with exactly one same-release attempt');
    ok(injectedResponse?.fromServiceWorker()&&recovered.ready?.id==='share'&&recovered.title&&recovered.instruction,
     label+' stopped-origin real lesson title, task and snapshot render within the original deadline');
    ok(learningHistory(recovered.raw)===learningHistory(before.raw),
     label+' all mathematical models and attempts survive the recovered boot');
    assert.deepEqual(preservedState(recovered.raw),preservedState(before.raw));
    ok(recovered.feedbackState!=='correct'&&!recovered.warningVisible,
     label+' old checked feedback remains expired while the recovered warning is hidden');
    const afterCache=await cacheModules(page);assert.deepEqual(afterCache,canonicalCache);
    ok((await askWorker(page,'math-explorer:cache-status'))?.complete===true,
     label+' recovery preserves complete canonical cache and sampled module bytes');
    await page.screenshot({path:path.join(out,label+'-recovered.png')});
   }
   label=width+'x'+height+'-recovered-b39';
   await page.goto(base+'learn.html#graph39');
   await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='graph39',null,{timeout:20000});
   const b39After=await state(page);saveState(label,b39After);
   ok(await page.locator('[data-x="s39-mark"]').isVisible()&&b39After.feedbackState==='revise',
    width+' recovered B39 view renders the existing unsuccessful work without rewriting it');
   ok(record.responses.some(item=>item.label===label&&item.url===base+'learning/phase5/b39-view.js?module-recovery='+cache&&
    item.status===200&&item.fromServiceWorker),width+' computed B39 view also inherits the verified recovery release');
   ok(learningHistory(b39After.raw)===learningHistory(recovered.raw),width+' returning to old B39 work preserves all models and attempts');
   await page.goto(base+'learn.html#share');await wait(page,true);
   recovered=await state(page);saveState(label+'-return-share',recovered);
   // Alter the cached entry for a fresh reload; same-release SHA pin must reject.
   label=width+'x'+height+'-integrity-tamper';
   const tamper=await page.evaluate(async release=>{
    const store=await caches.open(release),url=new URL('learning/learn.js',location.href),original=await store.match(url);
    if(!original)throw Error('entry missing before integrity test');
    await store.put(url,new Response((await original.text())+'\n// deliberately changed entry',{
     headers:{'Content-Type':'text/javascript'}}));
    return true;
   },cache);
   ok(tamper,width+' isolated entry tamper is deliberate');
   const tamperArmed=await askWorker(page,'test-arm-entry-fault');
   ok(tamperArmed?.armed,width+' integrity-negative page load has a controlled entry resource error');
   await page.reload();
   await page.waitForFunction(()=>window.mathStartupRecovery?.status==='failed');
   const rejectedCount=(await askWorker(page,'test-entry-fault-count'))?.count;
   ok(rejectedCount===4,width+' integrity-negative case executes one further independent entry resource fault');
   const rejected=await state(page);
   saveState(label,rejected);
   record.steps.push({kind:'integrity-tamper',recovery:rejected.recovery,warning:rejected.warning,
    rawBytes:rejected.raw?.length});
   ok(rejected.recovery?.failure==='entry-integrity-mismatch',
    width+' current-release entry integrity mismatch is rejected');
   ok(rejected.recovery?.attempts===1&&rejected.ready===null,
    width+' rejected entry has no initialized lesson and does not loop recovery');
   ok(rejected.warningVisible,width+' failed recovery shows an explicit alert');
   ok(rejected.raw===recovered.raw,width+' rejected integrity recovery leaves entire original stored bytes unchanged');
   ok(record.errors.length===0,width+' controlled resource failures introduce no unhandled runtime page errors');
   await page.screenshot({path:path.join(out,width+'x'+height+'-integrity-rejected.png')});
   await context.close();context=null;activePage=null;diagnostics=null;
  }
  output.status='success';
 }catch(error){
  output.status='failed';output.failures.push({error:String(error),stack:error?.stack});
  if(diagnostics)output.failureDiagnostic=await diagnostics.dump(error).catch(failure=>({error:String(failure)}));
  try{if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),timeout:4000});}catch{}
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
