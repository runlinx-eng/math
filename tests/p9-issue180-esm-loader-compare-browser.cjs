'use strict';
// Issue #180: read-only native ESM startup A/B. Not a mathematical acceptance gate.
// The original B11 task/20s startup criterion are unchanged. No retries or fault injection.
// This intentionally contrasts online + SW, online + bypass, and origin-stopped + SW.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createReloadStartupProbe}=require('./helpers/p9-issue180-reload-probe.cjs');

const mode=process.env.MATH_ISSUE180_LOADER_MODE;
const MODE={
 'sw-online':{bypass:false,stopOrigin:false,expectSW:true},
 'bypass-online':{bypass:true,stopOrigin:false,expectSW:false},
 'sw-offline':{bypass:false,stopOrigin:true,expectSW:true}
};
if(!Object.hasOwn(MODE,mode))throw Error('MATH_ISSUE180_LOADER_MODE must be sw-online, bypass-online or sw-offline');
const config=MODE[mode];
const cycles=12;
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/issue180-loader-compare');
const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
if(!release)throw Error('Cannot identify current offline cache release');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const target={id:'twodigitpair',index:1};
const viewports=[[1440,900],[1280,720]];
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const completeSW=async(page)=>{
 for(let n=0;n<300;n++){
  const complete=await page.evaluate(expected=>{
   if(!navigator.serviceWorker?.controller)return false;
   return new Promise(resolve=>{
    const channel=new MessageChannel();
    const timer=setTimeout(()=>{channel.port1.close();resolve(false);},1200);
    channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();
     const v=e.data;resolve(v?.cache===expected&&v.complete===true&&v.cached===v.total);};
    navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
   });
  },release);
  if(complete)return true;
  await page.waitForTimeout(100);
 }
 return false;
};
const getModel=async page=>page.evaluate(({id,index})=>{
 const raw=localStorage.getItem('math-explorer-v2');
 const state=raw?JSON.parse(raw):null;
 const lesson=state?.lessons?.[id]||state?.daily?.bridges?.[id];
 return {rawPresent:typeof raw==='string',rawBytes:raw?.length||0,
  lessonIndex:lesson?.index,model:lesson?.models?.[index]||null,
  attempts:lesson?.cases?.[index]?.attempts||null};
},target);
const wait=page=>page.waitForFunction(({id,index})=>{
 const snapshot=window.mathLesson?.snapshot?.();
 return snapshot?.id===id&&snapshot.index===index&&snapshot.view==='task';
},target);
const closeServer=server=>new Promise(resolve=>{
 if(!server?.listening)return resolve();
 server.close(resolve);server.closeAllConnections();
});
const startServer=async()=>{
 const server=http.createServer((req,res)=>{
  const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
  const file=path.join(root,'dist',rel);
  fs.readFile(file,(error,data)=>{
   res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
   res.end(error?'missing':data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return server;
};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const result={schema:'issue180-loader-controlled-ab/1',mode,cycles,release,target,viewports,
  experimentalOnly:true,notAcceptance:true,observations:[],failures:[],startedAt:new Date().toISOString()};
 let browser=null,server=null,page=null,context=null,probe=null,cdp=null;
 let activeLabel='setup',before=null;
 try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  for(const [width,height] of viewports){
   server=await startServer();
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   page=await context.newPage();
   page.setDefaultTimeout(20000);
   const pageErrors=[],remote=[];
   page.on('pageerror',error=>pageErrors.push(String(error)));
   context.on('request',request=>{
    if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());
   });
   activeLabel=`${width}x${height}-setup`;
   await page.goto(base+'v2.html#trail');
   await page.locator('#import-file').waitFor({state:'attached'});
   assert(await completeSW(page),activeLabel+' current SW cache not complete');
   await page.evaluate(async({id,index})=>{
    const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([
     import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')
    ]);
    const state=fresh(),lesson=freshLesson(id);
    lesson.index=index;lesson.view='task';
    if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
    localStorage.setItem(KEY,JSON.stringify(state));
   },target);
   if(config.bypass){
    cdp=await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setBypassServiceWorker',{bypass:true});
   }
   if(config.stopOrigin){
    await closeServer(server);
    assert(!server.listening,'HTTP origin remains alive in offline mode');
   }
   activeLabel=`${width}x${height}-${mode}-initial`;
   probe=createReloadStartupProbe({context,page,out,cache:release});
   await probe.start();
   before=await probe.snapshot();
   const initial=await page.goto(base+'learn.html#'+target.id);
   await wait(page);
   assert(initial?.fromServiceWorker()===config.expectSW,activeLabel+' first document response has unexpected SW provenance');
   let baseline=await getModel(page);
   assert(baseline.rawPresent&&baseline.lessonIndex===target.index&&baseline.model,activeLabel+' seeded model not preserved');
   for(let round=1;round<=cycles;round++){
    activeLabel=`${width}x${height}-${mode}-reload-${round}`;
    before=await probe.snapshot();
    const previous=await getModel(page);
    const started=Date.now();
    const response=await page.reload();
    await wait(page);  // The same original 20-second mathLesson readiness criterion.
    const elapsedMs=Date.now()-started;
    assert(response?.fromServiceWorker()===config.expectSW,activeLabel+' document SW provenance changed');
    const after=await getModel(page);
    assert(after.rawPresent&&after.lessonIndex===target.index,activeLabel+' lost the lesson record');
    assert(JSON.stringify(after.model)===JSON.stringify(previous.model),activeLabel+' mathematical model mutated on reload');
    assert(JSON.stringify(after.attempts)===JSON.stringify(previous.attempts),activeLabel+' saved attempts mutated on reload');
    const recovery=await page.evaluate(()=>window.mathStartupRecovery||null);
    assert(recovery?.status!=='failed',activeLabel+' entry recovery failed: '+JSON.stringify(recovery));
    assert(pageErrors.length===0,activeLabel+' page runtime errors: '+JSON.stringify(pageErrors));
    assert(remote.length===0,activeLabel+' unexpected remote requests: '+JSON.stringify(remote));
    result.observations.push({width,height,mode,round,elapsedMs,fromServiceWorker:response.fromServiceWorker(),
     ready:true,modelSha256:sha256(JSON.stringify(after.model)),attemptsSha256:sha256(JSON.stringify(after.attempts)),
     startupRecovery:recovery});
    console.log('ISSUE180_LOADER_RELOAD_OK',JSON.stringify({width,height,mode,round,elapsedMs,fromServiceWorker:response.fromServiceWorker()}));
   }
   await probe.success({label:`${width}x${height}-${mode}-all-${cycles}-reloads`,before});
   await probe.close();probe=null;
   if(cdp){await cdp.detach();cdp=null;}
   await context.close();context=null;page=null;
   await closeServer(server);server=null;
  }
  result.status='success';
  result.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log('ISSUE180_LOADER_COMPARE_OK',JSON.stringify({mode,reloads:result.observations.length,viewports:viewports.length}));
 }catch(error){
  result.status='failure';result.error=String(error);result.at=activeLabel;
  result.failures.push({at:activeLabel,error:String(error)});
  if(probe)await probe.failure({label:activeLabel,before,error}).catch(e=>console.error('Probe error:',String(e)));
  if(page){
   await page.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
   const html=await page.content().catch(()=>null);
   if(html)fs.writeFileSync(path.join(out,activeLabel+'-failure.html'),html);
  }
  result.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(probe)await probe.close().catch(()=>{});
  if(cdp)await cdp.detach().catch(()=>{});
  if(context)await context.close().catch(()=>{});
  await closeServer(server);
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
