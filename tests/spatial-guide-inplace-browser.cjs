// The optional panorama orientation stays in place and keeps all original
// domain knowledge as faint context. Only genuine guide relationships stand out.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/spatial-guide-inplace');
const base='http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas';
const checks=[],errors=[],check=(ok,description)=>{if(!ok)throw Error(description);checks.push(description);};
const same=(a,b,eps=1e-5)=>Math.abs(a-b)<eps;
const samePose=(a,b)=>same(a.cameraZoom,b.cameraZoom)&&a.position.every((v,i)=>same(v,b.position[i]))&&a.target.every((v,i)=>same(v,b.target[i]));
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 const snapshot=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
  await page.goto(base);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().selected===null&&mathSpace.snapshot().visibleNodes.length===537);
  const initial=await snapshot(),coordinates=JSON.stringify(initial.positions);
  check(!initial.cameraTween&&initial.backgroundEdgesVisible,'overview starts as a stable full map');
  await page.screenshot({path:path.join(out,'01-panorama-before-guide.png')});
  await page.locator('[data-action="guide-start"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().guide?.step===0&&mathSpace.snapshot().visibleNodes.length===537);
  let focus=await snapshot();
  check(samePose(initial,focus)&&focus.cameraTween===null,'starting orientation does not move, zoom or rotate camera');
  check(focus.backgroundEdgesVisible,'full-map source relation outline remains a faint guide backdrop');
  check(focus.visibleNodes.length===537,'all 537 domain nodes remain as background knowledge');
  check(await page.locator('#guide-panel').isVisible(),'the step instructions are visible');
   check(focus.guide.currentNodes.length===0&&focus.guide.edges.length===0,'first step shows the complete map without an isolated highlighted example');
   check(await page.locator('#guide-panel h2').textContent()==='先看整张数学地图','first step explains how to read the overall structure');
   check(await page.locator('.space-label.theme:visible').count()>=3,'the five-theme map remains recognizable during the guide');
  check(await page.locator('.space-label.node:visible').count()<25,'background names remain muted instead of crowding the guide');
  await page.screenshot({path:path.join(out,'02-guide-start-same-camera.png')});
  for(let step=1;step<5;step++){
   await page.locator('[data-action="guide-step"][data-step="'+step+'"]').click();
   await page.waitForFunction(i=>mathSpace.snapshot().guide?.step===i&&mathSpace.snapshot().visibleNodes.length===537,step);
   focus=await snapshot();
   if(step===1){
    const background=initial.visibleNodes.find(k=>!focus.guide.seenNodes.includes(k));
    const current=focus.guide.currentNodes[0];
    const radii=await page.evaluate(([a,b])=>({ordinary:mathSpace.nodeRadius(a),current:mathSpace.nodeRadius(b)}),[background,current]);
    check(radii.ordinary>=4&&radii.ordinary<5,'background nodes remain small but readable');
    check(radii.current>radii.ordinary+1,'example nodes are more prominent than the context');
   }
   check(samePose(initial,focus)&&!focus.cameraTween,'step '+step+' keeps the original camera pose and zoom');
   check(focus.backgroundEdgesVisible&&focus.visibleNodes.length===537,'step '+step+' retains all faint panorama knowledge points');
   check(JSON.stringify(focus.positions)===coordinates,'step '+step+' does not alter the fixed mathematics coordinates');
   await page.screenshot({path:path.join(out,'0'+(step+2)+'-guide-step-'+step+'.png')});
  }
  // Restart and exit must not initiate a camera tween either.
  await page.locator('[data-action="guide-reset"]').click();
  focus=await snapshot();
  check(focus.guide?.step===0&&samePose(initial,focus),'restarting the orientation never reframes the map');
  await page.locator('[data-action="guide-exit"]').click();
  const exited=await snapshot();
  check(exited.guide===null&&!exited.cameraTween&&samePose(initial,exited),'exiting guide does not cause a camera jump');
  check(JSON.stringify(exited.positions)===coordinates,'all original knowledge coordinates survive the complete guide');
  check(errors.length===0,'no uncaught browser errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,childTrial:false,guide:5,initialZoom:initial.cameraZoom,visibleGuideNodes:537},null,2));
  console.log(JSON.stringify({passed:checks.length,errors}));
 }catch(error){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(error),childTrial:false},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
