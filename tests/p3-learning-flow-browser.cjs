// P3 regression: source-backed learning workflow and real Chromium screenshots.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p3-learning-flow');
const checks=[],errors=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 const frame=page.frameLocator('#journey-frame');
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space/node/mt_ndGqFPWyen');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
  const before=await snap();
  await page.locator('#focus-card [data-action="open"]').first().click();
  await frame.locator('#p3-learning-flow').waitFor({state:'attached'});
  await frame.locator('#learning-support > summary').click();
  check(await frame.locator('.p3-before-check').isHidden(),'unsubmitted work keeps optional empty evidence out of the reading path');
  await frame.locator('.p3-application>summary').click();
  check(await frame.locator('.p3-application').innerText().then(s=>s.includes('模拟情境')&&s.includes('现实生活')),'simulation and real practice explicitly distinct when the child opens optional applications');
  await frame.locator('.p3-application>summary').click();
  check(await frame.locator('#actions [data-do="check"]').isVisible(),'first screen already offers checking without a separate start mode');
  await frame.locator('#actions [data-do="check"]').click();
  check(await frame.locator('.p3-evidence').innerText().then(s=>s.includes('需要修改')),'first incorrect attempt is labeled');
  await frame.locator('[data-do="hint"]').first().click();
  await frame.locator('.p3-evidence-details summary').click();
  check(await frame.locator('.p3-evidence').innerText().then(s=>s.includes('提示或支持')),'hint evidence remains available in expanded history');
  await frame.locator('[data-do="p3-retry"]').click();
  check(await frame.locator('.p3-evidence').innerText().then(s=>s.includes('1 次提交')),'retry does not erase attempt history');
  await frame.locator('#actions [data-do="check"]').click();
  check(await frame.locator('.p3-evidence').innerText().then(s=>s.includes('2 次提交')),'second attempt retained');
  await frame.locator('#record summary').click();
  check(await frame.locator('#record-body').innerText().then(s=>s.includes('第 1 次')&&s.includes('第 2 次')),'record shows attempts chronologically');
  const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  check(storage.lessons.share.cases[0].attempts.length===2,'stored attempts match UI');
  check(storage.lessons.share.cases[0].support===true,'hint attribution survives retry');
  check(await frame.locator('[data-do="lesson"][data-id="equivalent"]').count()>0,'configured follow-up route available');
  const pose=await snap();
  for(const [w,h] of [[1440,900],[980,760],[1280,720]]){
    await page.setViewportSize({width:w,height:h});
    await frame.locator('#p3-learning-flow').scrollIntoViewIfNeeded();
    const rect=await page.locator('#journey-surface').boundingBox();
    check(!!rect&&rect.x>=-2&&rect.y>=-2&&rect.x+rect.width<=w+2&&rect.y+rect.height<=h+2,'learning pane fits '+w+'x'+h);
    await page.screenshot({path:path.join(out,'p3-learning-'+w+'x'+h+'.png')});
    const now=await snap();
    check(now.selected===pose.selected&&now.position.every((v,i)=>Math.abs(v-pose.position[i])<.001),'camera and node stable at '+w+'x'+h);
  }
  await page.reload();
  await page.waitForFunction(()=>window.mathSpace?.snapshot().journeyOpen===true);
  await frame.locator('#p3-learning-flow').waitFor({state:'attached'});
  await frame.locator('#learning-support > summary').click();
  check(await frame.locator('.p3-evidence').innerText().then(s=>s.includes('2 次提交')),'refresh restores history and learning activity');
  const optionalRelations=frame.locator('.p3-followups');
  if(await optionalRelations.count()&&!(await optionalRelations.evaluate(el=>el.open)))await optionalRelations.locator('summary').click();
  await frame.locator('[data-do="p3-related"]').first().click();
  await page.waitForFunction(()=>!mathSpace.snapshot().journeyOpen&&mathSpace.snapshot().selected?.startsWith('node:'));
  const after=await snap();
  check(after.selected!==pose.selected,'related knowledge is genuine other node');
  check(after.position.every((v,i)=>Math.abs(v-pose.position[i])<.001),'related knowledge keeps map camera');
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  const entry=await page.evaluate(()=>({hub:!document.querySelector('#learning-hub').hidden,journey:!document.querySelector('#journey-surface').hidden}));
  check(entry.hub||entry.journey,'related knowledge offers a real lesson or explains unavailable activity');
  if(entry.journey){
    const src=await page.locator('#journey-frame').getAttribute('src');
    check(src?.startsWith('learn.html#')||src?.startsWith('journey.html#'),'related node opens a configured source activity');
    if(src.startsWith('learn.html#'))await frame.locator('#instruction').waitFor();
    check(await page.locator('#learning-hub').isHidden(),'related node directly enters the source task');
  }else check((await page.locator('#learning-hub').innerText()).includes('没有独立的数学操作活动'),'unconfigured related node reports absence rather than fictitious task');
  // The original P3 flow checks an explicit return. P7-D5 tests browser Back/Forward
  // separately on a single parent task-history entry to avoid iframe history ambiguity.
  await page.locator('.primary-nav [data-action="nav-explore"]').click();
  check(await page.locator('#learning-hub').isHidden()&&await page.locator('.primary-nav [data-action="nav-explore"]').getAttribute('aria-pressed')==='true','explicit return restores exploration without a route chooser');
  check(!errors.length,'no uncaught browser errors: '+errors.join(' / '));
  console.log(JSON.stringify({status:'pass',checks,screenshots:out},null,2));
 }catch(e){
  console.error(JSON.stringify({status:'fail',checks,error:String(e),browserErrors:errors},null,2));
  process.exitCode=1;
  try{await page.screenshot({path:path.join(out,'failure.png')});}catch{}
 }finally{await browser.close();}
})();
