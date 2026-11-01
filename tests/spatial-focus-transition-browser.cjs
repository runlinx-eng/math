// Chromium acceptance for stable-camera knowledge selection. Zoom and camera
// distance are not changed by selecting v53 knowledge, even from search.
// Animate visual focus, not a forced zoom; preserve the original 3D coordinates.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/spatial-focus-transition');
const ROOT='node:mt_WcfaSfVT33',NEXT='node:mt_dmNvjroCPT',base='http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas';
const checks=[],errors=[],check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
const close=(a,b,eps=.0001)=>Math.abs(a-b)<=eps;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}},reducedMotion:'no-preference'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
  await page.goto(base);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.snapshot().selected);
  const opening=await snap(),coords=JSON.stringify(opening.positions);
  check(opening.focusTransition===null&&opening.cameraTween===null&&opening.zoomEnabled,'overview allows ordinary manual zoom');
  await page.screenshot({path:path.join(out,'01-overview.png')});
  const ghost=await page.evaluate(async()=>{
   const a=await(await fetch('./data/atlas.json')).json(),root='mt_WcfaSfVT33',
      near=new Set([root,...a.edges.filter(e=>e.prerequisiteId===root||e.topicId===root).map(e=>e.prerequisiteId===root?e.topicId:e.prerequisiteId)]);
   return mathSpace.snapshot().visibleNodes.find(k=>k.startsWith('node:')&&!near.has(k.slice(5)));
  });
  check(!!ghost,'a background node is available for fade verification');
  await page.evaluate(unrelated=>{
   window.__motionSamples=[];window.__motionCapture=true;
   const loop=()=>{if(!window.__motionCapture)return;const s=mathSpace.motion();
     if(s.transition)window.__motionSamples.push({...s,ghostRadius:mathSpace.nodeRadius(unrelated)});
     requestAnimationFrame(loop);
   };requestAnimationFrame(loop);
  },ghost);
  await page.locator('[data-action="search"]').click();await page.locator('#search-input').fill('mt_WcfaSfVT33');
  await page.locator('#search-results [data-key="'+ROOT+'"]').click();
  await page.waitForFunction(root=>mathSpace.snapshot().selected===root&&!mathSpace.motion().transition&&!mathSpace.motion().tween,ROOT,{timeout:10000});
  const focused=await snap(),frames=await page.evaluate(()=>window.__motionSamples.filter(s=>s.transition==='to-focus'));
  check(focused.selected===ROOT&&focused.visibleNodes.length<30&&!focused.backgroundEdgesVisible,'selection keeps real direct relationships');
  check(close(focused.cameraZoom,opening.cameraZoom),'knowledge selection never changes camera zoom');
  check(!focused.zoomEnabled,'wheel and pinch zoom are disabled in a knowledge detail');
  check(frames.length>=2&&frames.some(f=>f.progress>0&&f.progress<1),'focus still fades in through intermediate frames');
  check(frames.every(f=>close(f.zoom,opening.cameraZoom)),'no automatic zoom happens during the visual fade');
  check(frames.some(f=>f.ghostRadius>0&&f.progress<.95),'unrelated nodes do not disappear on click');
  check(close(await page.evaluate(key=>mathSpace.nodeRadius(key),ghost),0),'unrelated nodes finish hidden');
  check(JSON.stringify(focused.positions)===coords,'knowledge coordinates stay fixed');
  check(await page.locator('.tool-rail [data-action="zoom"]').first().isHidden(),'zoom buttons disappear in detail mode');
  check(await page.locator('.tool-rail [data-action="front"]').isHidden(),'auto-reframe button does not remain in knowledge detail');
  const stableZoom=focused.cameraZoom;
  await page.mouse.move(720,510);await page.mouse.wheel(0,-430);
  await page.waitForTimeout(150);
  check(close((await snap()).cameraZoom,stableZoom),'mouse wheel cannot change zoom in detail');
  await page.locator('#space-canvas canvas').focus();await page.keyboard.press('+');
  await page.waitForTimeout(80);
  check(close((await snap()).cameraZoom,stableZoom),'keyboard zoom cannot change zoom in detail');
  await page.screenshot({path:path.join(out,'02-focused-no-zoom.png')});
  const previous=await snap(),pos=[...previous.position],target=[...previous.target];
  await page.locator('#focus-card [data-action="choose"][data-key="'+NEXT+'"]').first().click();
  await page.waitForFunction(next=>mathSpace.snapshot().selected===next,NEXT);
  const neighbor=await snap();
  check(neighbor.cameraTween===null&&neighbor.focusTransition===null,'adjacent knowledge does not move the camera');
  check(close(neighbor.cameraZoom,stableZoom)&&neighbor.position.every((v,i)=>close(v,pos[i]))&&neighbor.target.every((v,i)=>close(v,target[i])),'adjacent selection preserves camera zoom, position and direction');
  await page.screenshot({path:path.join(out,'03-adjacent-no-follow.png')});
  await page.locator('#local-overview-exit').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected===null&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.motion().transition&&!mathSpace.motion().tween,null,{timeout:10000});
  const returned=await snap(),reverse=await page.evaluate(()=>window.__motionSamples.filter(f=>f.transition==='to-overview'));
  check(reverse.length>=2&&reverse.some(s=>s.progress>0&&s.progress<1),'return restores the overall map with a smooth visual fade');
  check(returned.zoomEnabled&&await page.locator('.tool-rail [data-action="zoom"]').first().isVisible(),'overview restores manual zoom tools');
  check(returned.selected===null&&returned.visibleNodes.length===537&&returned.backgroundEdgesVisible,'full map is restored on exit');
  check(JSON.stringify(returned.positions)===coords,'return does not alter true knowledge coordinates');
  check(errors.length===0,'no browser runtime errors');
  await page.screenshot({path:path.join(out,'04-returned-overview.png')});
  await page.evaluate(()=>window.__motionCapture=false);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,realBrowser:true,childTrial:false,frames:{focus:frames.length,return:reverse.length},zoom:{overview:opening.cameraZoom,selected:focused.cameraZoom}},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,focusFrames:frames.length,returnFrames:reverse.length}));
 }catch(err){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(err),realBrowser:true,childTrial:false},null,2));
  console.error(err.stack);process.exitCode=1;
 }finally{
  await page.evaluate(()=>window.__motionCapture=false).catch(()=>{});
  const video=page.video();await context.close();
  if(video)try{fs.copyFileSync(await video.path(),path.join(out,'focus-transition.webm'));}catch(err){console.error('Video preservation:',String(err));}
  await browser.close();
 }
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
