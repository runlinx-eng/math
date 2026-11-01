// Chromium acceptance: sample camera and node-scale states in browser animation frames,
// not at arbitrary Playwright delays (software GPUs can skip frames).
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/spatial-focus-transition');
const ROOT='node:mt_WcfaSfVT33',NEXT='node:mt_dmNvjroCPT',base='http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas';
const checks=[],errors=[],check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
const close=(a,b,tolerance=.0001)=>Math.abs(a-b)<=tolerance;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}},reducedMotion:'no-preference'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
   await page.goto(base);await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.snapshot().selected);
   const opening=await snap(),coords=JSON.stringify(opening.positions);
   check(opening.focusTransition===null&&opening.cameraTween===null,'the full map starts from a stable camera');
   await page.screenshot({path:path.join(out,'01-overview.png')});
   const irrelevant=await page.evaluate(async()=>{
     const a=await(await fetch('./data/atlas.json')).json(),root='mt_WcfaSfVT33',
       near=new Set([root,...a.edges.filter(e=>e.prerequisiteId===root||e.topicId===root).map(e=>e.prerequisiteId===root?e.topicId:e.prerequisiteId)]);
     return mathSpace.snapshot().visibleNodes.find(k=>k.startsWith('node:')&&!near.has(k.slice(5)));
   });
   check(!!irrelevant,'an unrelated node is available for fade verification');
   await page.evaluate(unrelated=>{
     window.__motionSamples=[];window.__motionCapture=true;
     const loop=()=>{
       if(!window.__motionCapture)return;
       const m=mathSpace.motion();
       if(m.transition)window.__motionSamples.push({...m,ghostRadius:mathSpace.nodeRadius(unrelated)});
       requestAnimationFrame(loop);
     };requestAnimationFrame(loop);
   },irrelevant);
   await page.locator('[data-action="search"]').click();
   await page.locator('#search-input').fill('mt_WcfaSfVT33');
   await page.locator('#search-results [data-key="'+ROOT+'"]').click();
   await page.waitForFunction(root=>mathSpace.snapshot().selected===root&&!mathSpace.motion().transition&&!mathSpace.motion().tween,ROOT,{timeout:10000});
   const focused=await snap(),focusFrames=await page.evaluate(()=>window.__motionSamples.filter(s=>s.transition==='to-focus'));
   check(focused.selected===ROOT&&focused.visibleNodes.length<30&&!focused.backgroundEdgesVisible,'focus ends at the real local neighbors');
   check(focusFrames.length>=2,'actual browser frames were captured during the focus transition');
   check(focusFrames.some(m=>m.progress>0&&m.progress<1),'the focus animation has an actual intermediate state');
   check(focusFrames.some(m=>m.zoom>opening.cameraZoom+.04&&m.zoom<focused.cameraZoom-.04),'zoom passes through at least one value strictly between overview and focus');
   check(focusFrames.some(m=>m.progress>.03&&m.progress<.98&&m.ghostRadius>0),'unrelated background node fades instead of immediately vanishing');
   check(focusFrames.every((m,i)=>i===0||m.zoom>=focusFrames[i-1].zoom-.0001),'focus zoom does not reverse direction');
   check(focused.cameraZoom>opening.cameraZoom+.1,'focus zoom lands substantially closer to selected knowledge');
   check(close(await page.evaluate(key=>mathSpace.nodeRadius(key),irrelevant),0),'unrelated nodes fully disappear when the transition settles');
   check(JSON.stringify(focused.positions)===coords,'source 3D positions do not move during focusing');
   await page.screenshot({path:path.join(out,'02-focused.png')});
   const camera=[...focused.position],target=[...focused.target],zoom=focused.cameraZoom;
   await page.locator('#focus-card [data-action="choose"][data-key="'+NEXT+'"]').first().click();
   await page.waitForFunction(next=>mathSpace.snapshot().selected===next,NEXT);
   await page.waitForTimeout(100);
   const adjacent=await snap();
   check(adjacent.cameraTween===null&&adjacent.focusTransition===null,'direct neighbor exploration starts no camera-follow animation');
   check(adjacent.position.every((v,i)=>close(v,camera[i]))&&adjacent.target.every((v,i)=>close(v,target[i]))&&close(adjacent.cameraZoom,zoom),'adjacent exploration keeps camera pose and zoom fixed');
   await page.screenshot({path:path.join(out,'03-neighbor-no-follow.png')});
   await page.locator('#local-overview-exit').click();
   await page.waitForFunction(()=>mathSpace.snapshot().selected===null&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.motion().transition&&!mathSpace.motion().tween,null,{timeout:10000});
   const complete=await snap(),reverse=await page.evaluate(()=>window.__motionSamples.filter(s=>s.transition==='to-overview'));
   check(reverse.length>=2&&reverse.some(m=>m.progress>0&&m.progress<1),'return to panorama includes intermediate frames');
   check(reverse.some(m=>m.zoom<zoom-.04&&m.zoom>complete.cameraZoom+.04),'return camera shrinks smoothly through intermediate zoom');
   check(reverse.every((m,i)=>i===0||m.zoom<=reverse[i-1].zoom+.0001),'return zoom does not reverse direction');
   check(complete.selected===null&&complete.visibleNodes.length===537&&complete.backgroundEdgesVisible,'whole 3D map fully restores');
   check(JSON.stringify(complete.positions)===coords,'the return does not rebuild or move any knowledge node');
   check(errors.length===0,'browser has no uncaught page errors');
   await page.screenshot({path:path.join(out,'04-returned-overview.png')});
   await page.evaluate(()=>window.__motionCapture=false);
   fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,realBrowser:true,childTrial:false,motion:{focusFrames:focusFrames.length,returnFrames:reverse.length,startZoom:opening.cameraZoom,focusedZoom:focused.cameraZoom,returnZoom:complete.cameraZoom}},null,2));
   console.log(JSON.stringify({passed:checks.length,errors,focusFrames:focusFrames.length,returnFrames:reverse.length}));
 }catch(err){
   await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
   fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(err),realBrowser:true,childTrial:false},null,2));
   console.error(err.stack);process.exitCode=1;
 }finally{
   await page.evaluate(()=>window.__motionCapture=false).catch(()=>{});
   const video=page.video();await context.close();
   if(video)try{fs.copyFileSync(await video.path(),path.join(out,'focus-transition.webm'));}catch(err){console.error('Video copy:',String(err));}
   await browser.close();
 }
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
