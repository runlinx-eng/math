// Run on an isolated local server with Playwright installed; saves screenshots.
// This is an acceptance script, not a claim that a child understood the structure.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/overview-readability-v1');
const base='http://127.0.0.1:43827/';
const checks=[],errors=[],check=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
  await page.goto(base+'?world=network&layout=53#atlas');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const full=await snap();
  check(full.selected===null&&full.globalCoordinates,'explicit overview is the complete fixed-coordinate map');
  check(await page.locator('#network-legend [data-action="network-theme"]').count()===5,'all five thematic directions have names and entry points');
  check(await page.locator('.space-label.theme:visible').count()>=3,'theme labels are anchored in the spatial map');
  check(full.backgroundEdgesVisible,'full view has a genuine relation outline');
  const initial=JSON.stringify(full.positions);
  await page.screenshot({path:path.join(out,'01-overview.png')});
  const shells=page.locator('[data-action="overview-shells"]');
  if(full.overviewShellCount){
   check(await shells.isVisible(),'eligible group shells have a user-controlled preview');
   check(!full.overviewShellsEnabled,'group shells start switched off to avoid misleading borders');
   await shells.click();await page.waitForFunction(()=>mathSpace.snapshot().overviewShellsVisible);
   check((await snap()).overviewShellsEnabled,'user can inspect selected real spatial group shells');
   await page.screenshot({path:path.join(out,'02-optional-shells.png')});
   await shells.click();await page.waitForFunction(()=>!mathSpace.snapshot().overviewShellsVisible);
  }else check(await shells.isHidden(),'no shell is drawn when grouping fails conservative evidence checks');
  await page.locator('[data-action="edge-display"][data-edge-display="all"]').click();
  check((await snap()).backgroundEdges===1080,'complete 808 hard plus 272 soft domain edges remain queryable');
  await page.locator('[data-action="edge-display"][data-edge-display="outline"]').click();
  check((await snap()).backgroundEdges===508,'simplified background remains source-backed');
  await page.locator('[data-action="search"]').click();await page.locator('#search-input').fill('mt_WcfaSfVT33');
  await page.locator('#search-results [data-key="node:mt_WcfaSfVT33"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_WcfaSfVT33');
  const focused=await snap();check(focused.visibleNodes.length<30&&!focused.backgroundEdgesVisible,'selecting a knowledge point still enters local focus');
  check(JSON.stringify(focused.positions)===initial,'focus and outline toggle never change source coordinates');
  check(await page.locator('[data-action="overview-shells"]').isHidden(),'group preview does not compete with focused exploration');
  await page.locator('#local-overview-exit').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected===null&&mathSpace.snapshot().visibleNodes.length===537);
  check(JSON.stringify((await snap()).positions)===initial,'return restores exactly the same 3D coordinate data');
  check(errors.length===0,'no browser runtime errors');
  await page.screenshot({path:path.join(out,'03-return-overview.png')});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors}));
 }catch(err){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(err),childTrial:false},null,2));
  console.error(err);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
