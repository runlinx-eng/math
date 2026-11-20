// Real Chromium smoke for the optional 3D view loading boundary.
// Isolated browser origins only. Never changes any user's local records or the real SW.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-three-view-lazy');
const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/^const CACHE = '([^']+)'/m)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const results=[],errors=[];
function recordState(){
 const raw=localStorage.getItem('math-explorer-v2');
 const state=JSON.parse(raw);
 const space=state.lessons?.space;
 return{rawBytes:raw.length,protected:JSON.stringify({models:space?.models,cases:space?.cases,notes:space?.notes}),
  warning:document.querySelector('#storage-warning')?.textContent||'',
  visible:document.querySelector('#storage-warning')?.hidden===false,
  canvas:!!document.querySelector('#cube-world canvas'),
  lesson:window.mathLesson?.snapshot?.()||null};
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 let browser,context,server;
 try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  for(const [width,height]of [[1440,900],[1280,720]]){
   const item={viewport:[width,height],checks:[],resourceURLs:[],offline:[],pageErrors:[]};
   results.push(item);
   server=http.createServer((req,res)=>{
    const relative=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',relative),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   // The expanded native learning ESM graph can exceed Chromium's default
   // resource-timing buffer before optional Three.js loads. Preserve timing
   // evidence for all real fetches rather than mistaking buffer saturation
   // for a missing lazy-loaded dependency.
   await page.addInitScript(()=>performance.setResourceTimingBufferSize(4096));
   page.on('pageerror',error=>item.pageErrors.push(String(error)));
   const ok=(condition,message)=>{assert.ok(condition,width+'x'+height+': '+message);item.checks.push(message);};
   await page.goto(base+'v2.html#trail');
   await page.waitForFunction(release=>navigator.serviceWorker.controller?.state==='activated'&&
    new URL(navigator.serviceWorker.controller.scriptURL).searchParams.get('release')===release,release);
   const status=await page.evaluate(()=>new Promise(resolve=>{
    const channel=new MessageChannel(),timeout=setTimeout(()=>resolve(null),2500);
    channel.port1.onmessage=event=>{clearTimeout(timeout);resolve(event.data);};
    navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
   }));
   ok(status?.complete===true&&status.cache===release&&status.cached===status.total,
    'current-release precache complete before changing the origin');
   const first=await page.goto(base+'learn.html#share');
   await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='share');
   const flat=await page.evaluate(()=>({
    resources:performance.getEntriesByType('resource').map(x=>new URL(x.name).pathname),
    title:document.querySelector('#title')?.textContent,
    warning:document.querySelector('#storage-warning')?.hidden===false
   }));
   const three=/\/vendor\/three\/|\/learning\/(?:cubes\.js|phase4\/solid-view\.js|phase5\/(?:b23-solid-view|b27-solid-view|b30-solid-view|b31-cube-view|b34-space-view|b09-power-view)\.js)/;
   item.resourceURLs=flat.resources;
   ok(first?.status()===200&&flat.title?.length>0&&!flat.warning,'flat lesson starts normally');
   ok(!flat.resources.some(x=>three.test(x)),'flat lesson fetches zero Three.js/optional 3D modules');
   await page.screenshot({path:path.join(out,width+'x'+height+'-flat.png'),fullPage:false});
   // page.goto can be a hash-only navigation. Force a real document reload.
   await page.goto(base+'learn.html#space');
   await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='space');
   await page.waitForFunction(()=>!!document.querySelector('#cube-world canvas'));
   const active=await page.evaluate(recordState);
   // A WebGL canvas is created before the optional module's resource timing
   // entry is committed. Wait for the actual Three.js fetch rather than
   // asserting synchronously against an incomplete Performance timeline.
   await page.waitForFunction(()=>performance.getEntriesByType('resource').some(
    x=>/\/vendor\/three\/three\.module\.min\.js/.test(new URL(x.name).pathname)));
   const activeResources=await page.evaluate(()=>performance.getEntriesByType('resource').map(x=>new URL(x.name).pathname));
   ok(active.canvas&&active.lesson.id==='space'&&!active.visible,'3D lesson renders original WebGL cube view');
   ok(activeResources.some(x=>/\/vendor\/three\/three\.module\.min\.js/.test(x)),'3D session fetches Three.js on demand');
   await page.screenshot({path:path.join(out,width+'x'+height+'-cube.png'),fullPage:false});
   await new Promise(resolve=>server.close(resolve));server.closeAllConnections();server=null;
   const offlineReload=await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='space');
   const offline=await page.evaluate(recordState);
   item.offline.push({status:offlineReload?.status(),fromServiceWorker:offlineReload?.fromServiceWorker(),rawBytes:offline.rawBytes});
   ok(offlineReload?.status()===200&&offlineReload.fromServiceWorker(),
    'stopped-origin 3D document reload comes from SW');
   ok(offline.canvas&&!offline.visible&&offline.lesson?.id==='space',
    '3D canvas and lesson still usable while HTTP source stopped');
   ok(offline.protected===active.protected,'3D offline reload retains original models/cases/notes');
   await page.goto(base+'learn.html#share');
   const flatOfflineResponse=await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot?.()?.id==='share');
   ok(flatOfflineResponse?.status()===200&&flatOfflineResponse.fromServiceWorker(),
    'ordinary learning page remains available offline after the 3D session');
   ok(item.pageErrors.length===0,'no runtime errors');
   await context.close();context=null;
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release,browserVersion:browser.version(),results,errors},null,2));
  console.log('P9_THREE_VIEW_LAZY_BROWSER '+JSON.stringify({status:'success',viewports:results.length,checks:results.reduce((n,x)=>n+x.checks.length,0),errors:[]}));
 }catch(error){
  errors.push({error:String(error),stack:error?.stack});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release,results,errors},null,2));
  console.error(error);process.exitCode=1;
 }finally{
  try{if(context)await context.close();}catch{}
  try{if(server){await new Promise(resolve=>server.close(resolve));server.closeAllConnections();}}catch{}
  try{if(browser)await browser.close();}catch{}
 }
})();
