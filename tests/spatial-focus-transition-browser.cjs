// Actual Chromium transition acceptance. No synthetic coordinates or fake edges.
// The video shows the same 3D knowledge map before, during and after selection.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/spatial-focus-transition');
const ROOT='node:mt_WcfaSfVT33',NEXT='node:mt_dmNvjroCPT',base='http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas';
const checks=[],errors=[],check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
const close=(x,y,tolerance=.00001)=>Math.abs(x-y)<=tolerance;
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}},reducedMotion:'no-preference'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  let videoPath;
  const snap=()=>page.evaluate(()=>mathSpace.snapshot());
  try{
    await page.goto(base);
    await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.snapshot().selected);
    await page.waitForTimeout(120);
    const opening=await snap(),coords=JSON.stringify(opening.positions);
    check(opening.focusTransition===null&&opening.cameraTween===null,'full map begins from a stable camera');
    await page.screenshot({path:path.join(out,'01-before-focus.png')});
    await page.locator('[data-action="search"]').click();
    await page.locator('#search-input').fill('mt_WcfaSfVT33');
    await page.locator('#search-results [data-key="'+ROOT+'"]').click();
    await page.waitForFunction(()=>mathSpace.snapshot().focusTransition?.kind==='to-focus'&&mathSpace.snapshot().visibleNodes.length<30);
    const enter=await snap();
    check(enter.selected===ROOT&&enter.focusTransition.fromCount===537,'focus starts from full original map');
    check(!!enter.cameraTween,'focus camera has a live motion plan');
    check(!close(enter.cameraTween.fromZoom,enter.cameraTween.toZoom),'target zoom differs meaningfully from overview');
    check(close(enter.cameraZoom,enter.cameraTween.fromZoom,.15),'focus does not jump directly to target zoom');
    check(enter.backgroundEdgesVisible,'outgoing panorama edges remain visible at transition start');
    const irrelevant=opening.visibleNodes.find(key=>key.startsWith('node:')&&!enter.visibleNodes.includes(key));
    check(!!irrelevant,'there is at least one unrelated background node to fade');
    await page.waitForTimeout(230);
    const first=await snap(),radiusFirst=await page.evaluate(key=>mathSpace.nodeRadius(key),irrelevant);
    check(first.focusTransition?.kind==='to-focus'&&first.focusTransition.progress>0&&first.focusTransition.progress<1,'focus transition has an intermediate frame');
    check(first.cameraZoom>Math.min(enter.cameraTween.fromZoom,enter.cameraTween.toZoom)&&first.cameraZoom<Math.max(enter.cameraTween.fromZoom,enter.cameraTween.toZoom),'zoom moves continuously through an intermediate value');
    check(radiusFirst>0,'unrelated locations fade rather than disappearing on click');
    // Measure the next frame before screenshots: GPU screenshot capture may take longer than the animation.
    await page.waitForTimeout(160);
    const second=await snap();
    check(second.focusTransition?.progress>first.focusTransition.progress,'opacity fade advances with animation');
    console.log('FOCUS_SAMPLES',JSON.stringify({enter:{cameraZoom:enter.cameraZoom,plan:enter.cameraTween,progress:enter.focusTransition?.progress},first:{cameraZoom:first.cameraZoom,plan:first.cameraTween,progress:first.focusTransition?.progress},second:{cameraZoom:second.cameraZoom,plan:second.cameraTween,progress:second.focusTransition?.progress}}));
    check(!close(second.cameraZoom,first.cameraZoom,.00001),'zoom keeps changing across intermediate frames');
    await page.screenshot({path:path.join(out,'02-mid-zoom.png')});
    await page.waitForFunction(()=>mathSpace.snapshot().focusTransition===null&&mathSpace.snapshot().cameraTween===null,{timeout:5000});
    const focused=await snap(),radiusFinal=await page.evaluate(key=>mathSpace.nodeRadius(key),irrelevant);
    check(focused.visibleNodes.length<30&&!focused.backgroundEdgesVisible,'focus settles into the local relationships');
    check(radiusFinal<.00001,'unrelated nodes finish fully hidden after fade');
    check(close(focused.cameraZoom,enter.cameraTween.toZoom,.0001),'camera lands at the intended zoom');
    check(JSON.stringify(focused.positions)===coords,'fixed 3D source positions are unchanged');
    await page.screenshot({path:path.join(out,'04-focused.png')});
    const stablePos=[...focused.position],stableTarget=[...focused.target],stableZoom=focused.cameraZoom;
    await page.locator('#focus-card [data-action="choose"][data-key="'+NEXT+'"]').first().click();
    await page.waitForFunction(next=>mathSpace.snapshot().selected===next,NEXT);
    await page.waitForTimeout(100);
    const adjacent=await snap();
    check(adjacent.cameraTween===null&&adjacent.focusTransition===null,'visiting an adjacent knowledge point does not start camera-follow animation');
    check(adjacent.position.every((v,i)=>close(v,stablePos[i]))&&adjacent.target.every((v,i)=>close(v,stableTarget[i]))&&close(adjacent.cameraZoom,stableZoom),'neighbor click preserves camera pose and zoom');
    await page.screenshot({path:path.join(out,'05-adjacent-no-camera-follow.png')});
    await page.locator('#local-overview-exit').click();
    await page.waitForFunction(()=>mathSpace.snapshot().focusTransition?.kind==='to-overview');
    const exiting=await snap();
    check(exiting.selected===null&&exiting.visibleNodes.length===537,'return begins by restoring the complete set of real nodes');
    check(!close(exiting.cameraZoom,exiting.cameraTween.toZoom,.15),'return zoom does not snap to final panorama scale');
    await page.waitForTimeout(280);
    const midReturn=await snap();
    check(midReturn.focusTransition?.progress>0&&midReturn.focusTransition.progress<1,'return has intermediate crossfade frames');
    await page.screenshot({path:path.join(out,'06-returning.png')});
    await page.waitForFunction(()=>mathSpace.snapshot().focusTransition===null&&mathSpace.snapshot().cameraTween===null,{timeout:5000});
    const full=await snap();
    check(full.visibleNodes.length===537&&full.backgroundEdgesVisible&&full.selected===null,'panorama is fully restored');
    check(JSON.stringify(full.positions)===coords,'return does not rebuild or relocate the knowledge graph');
    check(errors.length===0,'no browser page errors');
    await page.screenshot({path:path.join(out,'07-after-return.png')});
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,realBrowser:true,childTrial:false},null,2));
    console.log(JSON.stringify({passed:checks.length,errors}));
  }catch(error){
    await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(error),realBrowser:true,childTrial:false},null,2));
    console.error(error.stack);process.exitCode=1;
  }finally{
    const video=page.video();
    await context.close();
    if(video)try{videoPath=await video.path();fs.copyFileSync(videoPath,path.join(out,'focus-transition.webm'));}catch(e){console.error('Video preservation:',String(e));}
    await browser.close();
  }
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
