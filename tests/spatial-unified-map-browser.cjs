// Regression for the core product contract: panorama, manual zoom, node
// inspection and guided observation are ONE 3D map. Only lessons are a separate UI.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const dir=path.resolve(__dirname,'../verification/spatial-unified-map');
const checks=[],errors=[],check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
const close=(x,y,eps=.0001)=>Math.abs(x-y)<eps;
const samePose=(a,b)=>close(a.cameraZoom,b.cameraZoom)&&a.position.every((n,i)=>close(n,b.position[i]))&&a.target.every((n,i)=>close(n,b.target[i]));
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
   await page.goto('http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas');
   await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.snapshot().selected);
   const whole=await snap(),positions=JSON.stringify(whole.positions);
   check(whole.zoomEnabled&&whole.backgroundEdgesVisible,'full map has normal zoom and true background connections');
   for(let i=0;i<12;i++)await page.locator('.tool-rail [data-action="zoom"][data-factor="1.333333"]').click();
   const bounded=await snap();
   check(bounded.cameraZoom>=whole.cameraZoom*.30-.001,'repeated zoom-outs cannot collapse the full atlas into a tiny cluster');
   await page.screenshot({path:path.join(dir,'00b-zoom-out-boundary.png')});
   await page.locator('[data-action="front"]').click();
   await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null);
   const restoredAtlas=await snap();
   check(restoredAtlas.visibleNodes.length===537&&restoredAtlas.backgroundEdgesVisible,'explicit Home returns to recognizable full atlas with all original nodes');
   const landmark=page.locator('.space-label.node.structure-landmark:visible').first();
   await landmark.waitFor();
   // This is a genuine visible node click, not an offscreen search result.
   await landmark.click();
   await page.waitForFunction(()=>mathSpace.snapshot().selected?.startsWith('node:')&&mathSpace.snapshot().visibleNodes.length===537);
   const focused=await snap();
   check(samePose(whole,focused)&&!focused.cameraTween,'clicking a visible knowledge point never moves or zooms the camera');
   check(focused.zoomEnabled&&focused.backgroundEdgesVisible,'manual controls and faint atlas remain active in node inspection');
   check(focused.focusFilterCounts?.nodes>=1&&focused.focusFilterCounts.nodes<537,'only the true local relations are emphasized');
   check(await page.locator('.tool-rail [data-action="zoom"]').first().isVisible(),'map zoom stays on the same toolbar');
   const ghost=whole.visibleNodes.find(key=>key.startsWith('node:')&&key!==focused.selected&&!focused.focusFilterEdges.some(edge=>'node:'+edge.from===key||'node:'+edge.to===key));
   check(!!ghost,'there is an unrelated source node in the panorama');
   check((await page.evaluate(key=>mathSpace.nodeRadius(key),ghost))>2,'an unrelated knowledge point remains visible as faint background');
   await page.screenshot({path:path.join(dir,'01-selected-with-full-context.png')});
   // Reproduce the narrow desktop with a left browser-sidebar overlay. The
   // entire source card must be inside a safe interior area and fully usable.
   await page.setViewportSize({width:1024,height:1320});
   await page.waitForTimeout(140);
   const card=await page.locator('#focus-card').boundingBox();
   check(card&&card.x>=100&&card.y>=135,'knowledge detail never begins underneath the left browser sidebar');
   check(card.x+card.width<=1024-16&&card.y+card.height<=1320-12,'knowledge detail is fully contained in the available desktop');
   await page.screenshot({path:path.join(dir,'01b-card-with-browser-sidebar.png')});
   await page.setViewportSize({width:1440,height:900});
   await page.waitForTimeout(140);
   await page.locator('.tool-rail [data-action="zoom"][data-factor="0.75"]').click();
   await page.waitForTimeout(140);
   const zoomed=await snap();
   check(zoomed.visibleNodes.length===537&&zoomed.backgroundEdgesVisible,'manual zoom does not discard the atlas background');
   check(!close(zoomed.cameraZoom,focused.cameraZoom),'same manual zoom gesture works on the selected map');
   await page.locator('#focus-card [data-action="focus-depth"][data-depth="2"]').click();
   const expanded=await snap();
   check(expanded.visibleNodes.length===537&&expanded.backgroundEdgesVisible,'two-hop filtering adds emphasis without erasing any nodes');
   check(close(expanded.cameraZoom,zoomed.cameraZoom),'expanding knowledge relations does not refit the camera');
   await page.screenshot({path:path.join(dir,'02-zoomed-filtered-same-map.png')});
   await page.locator('#local-overview-exit').click();
   await page.waitForFunction(()=>mathSpace.snapshot().selected===null);
   const returned=await snap();
   check(samePose(expanded,returned)&&returned.visibleNodes.length===537,'deselect keeps the exact manually adjusted viewpoint');
   check(returned.zoomEnabled&&returned.backgroundEdgesVisible,'the full panorama remains available after deselection');
   await page.screenshot({path:path.join(dir,'03-deselected-same-zoom.png')});
   await page.locator('[data-action="guide-start"]').click();
   await page.waitForFunction(()=>mathSpace.snapshot().guide?.step===0);
   let guide=await snap();
   check(samePose(returned,guide)&&guide.visibleNodes.length===537,'guide reuses the last panorama camera and all background points');
   check(guide.zoomEnabled&&await page.locator('.tool-rail [data-action="zoom"]').first().isVisible(),'guide stays in the same zoomable 3D map');
   const visibleCue=page.locator('#guide-cues [data-action="guide-visit"]:visible').first();
   if(await visibleCue.count()){
     await visibleCue.click();
     await page.waitForFunction(()=>mathSpace.snapshot().guide?.step===1);
     guide=await snap();
     check(samePose(returned,guide)&&guide.visibleNodes.length===537,'guide advances without camera jump or removing surrounding nodes');
   }else{
     // At the user's manually zoomed pose, the source target can be outside
     // the viewport; show a direction hint instead of moving the camera.
     check(await page.locator('#guide-cues .guide-cue-offscreen:visible').count()>0,
       'offscreen guide target gives a map movement hint without refitting the view');
     guide=await snap();
     check(samePose(returned,guide)&&guide.visibleNodes.length===537,'offscreen guide target preserves camera and all source nodes');
   }
   await page.screenshot({path:path.join(dir,'04-guide-same-panorama.png')});
   await page.locator('[data-action="guide-exit"]').click();
   await page.waitForFunction(()=>mathSpace.snapshot().guide===null);
   const guideExit=await snap();
   check(samePose(returned,guideExit)&&guideExit.visibleNodes.length===537,'leaving guide preserves the same camera and all source knowledge');
   check(JSON.stringify(guideExit.positions)===positions,'none of these interaction states changes a knowledge coordinate');
   // Persist an intentionally unreadable wide-angle pose and reload. Restore
   // must repair only that extreme case before the user starts interacting.
   await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
   const cacheKey='math-explorer-network-relationship-view-v1';
   const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'null'),cacheKey);
   check(!!stored&&stored.networkVersion===53,'the v53 saved camera is available for recovery testing');
   await page.addInitScript(key=>{
     const item=JSON.parse(localStorage.getItem(key)||'null');
     if(item){item.cameraZoom=.05;localStorage.setItem(key,JSON.stringify(item));}
   },cacheKey);
   await page.reload();
   await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
   const recovered=await snap();
   check(recovered.cameraZoom>.05+.01,'reloading an unusably tiny saved map repairs the framing');
   check(recovered.visibleNodes.length===537&&recovered.backgroundEdgesVisible,'automatic startup recovery retains all 537 source knowledge points');
   await page.screenshot({path:path.join(dir,'05-recovered-extreme-saved-zoom.png')});
   check(errors.length===0,'no browser JavaScript exceptions');
   fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));
   console.log(JSON.stringify({passed:checks.length,errors}));
 }catch(err){
   await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});
   fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({checks,errors,failed:String(err),childTrial:false},null,2));
   console.error(err.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(err=>{console.error(err.stack);process.exitCode=1;});