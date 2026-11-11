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
 const revealEvidence=()=>frame.locator('#learning-support').evaluate(el=>{el.open=true;});
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space/node/mt_ndGqFPWyen');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
  const before=await snap();
  await page.locator('#focus-card [data-action="open"]').first().click();
  await frame.locator('#p3-learning-flow').waitFor({state:'attached'});
  await frame.locator('#learning-support > summary').click();
  check(await frame.locator('.p3-before-check').isHidden(),'unsubmitted work keeps optional empty evidence out of the reading path');
  await frame.locator('.p3-application').evaluate(el=>el.open=true);
  check(await frame.locator('.p3-application').textContent().then(s=>s.includes('模拟情境')&&s.includes('现实生活')),'simulation and real practice remain inspectable in the optional applications drawer');
  await frame.locator('.p3-application').evaluate(el=>el.open=false);
  check(await frame.locator('#actions [data-do="check"]').isVisible(),'first screen already offers checking without a separate start mode');
  await frame.locator('#actions [data-do="check"]').click();
  await revealEvidence();
  check(await frame.locator('.p3-evidence').textContent().then(s=>s.includes('需要修改')),'first incorrect attempt is labeled');
  await frame.locator('[data-do="hint"]').first().click();
  await revealEvidence();
  await frame.locator('.p3-evidence-details').evaluate(el=>{el.open=true;});
  check(await frame.locator('.p3-evidence').textContent().then(s=>s.includes('提示或支持')),'hint evidence remains available in expanded history');
  await frame.locator('[data-do="p3-retry"]').click();
  await revealEvidence();
  check(await frame.locator('.p3-evidence').textContent().then(s=>s.includes('1 次提交')),'retry does not erase attempt history');
  await frame.locator('#actions [data-do="check"]').click();
  await revealEvidence();
  check(await frame.locator('.p3-evidence').textContent().then(s=>s.includes('2 次提交')),'second attempt retained');
  await revealEvidence();
  await frame.locator('#record summary').click();
  check(await frame.locator('#record-body').innerText().then(s=>s.includes('第 1 次')&&s.includes('第 2 次')),'record shows attempts chronologically');
  const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  check(storage.lessons.share.cases[0].attempts.length===2,'stored attempts match UI');
  check(storage.lessons.share.cases[0].support===true,'hint attribution survives retry');
  check(await frame.locator('[data-do="lesson"][data-id="equivalent"]').count()>0,'configured follow-up route available');
  const pose=await snap();
  for(const [w,h] of [[1440,900],[980,760],[1280,720]]){
    await page.setViewportSize({width:w,height:h});
    await frame.locator('#learning-support').scrollIntoViewIfNeeded();
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
  check(await frame.locator('.p3-evidence').textContent().then(s=>s.includes('2 次提交')),'refresh restores history and learning activity');
  await revealEvidence();
  const optionalRelations=frame.locator('.p3-followups');
  if(await optionalRelations.count()&&!(await optionalRelations.evaluate(el=>el.open)))await optionalRelations.locator('summary').click();
  const relatedId=await frame.locator('[data-do="p3-related"]').first().getAttribute('data-node');
  check(!!relatedId,'related knowledge link names a real source node');
  const expected=await page.evaluate(async nodeId=>{
    const [catalog,journey,legacy]=await Promise.all([
      import('./learning/catalog.js'),import('./journey-model.js'),import('./exploration-content.js')
    ]);
    return {
      nodeId,lessonId:catalog.lessonForTopic(nodeId)||null,
      journeyStep:journey.routeStep(nodeId)?.step??null,
      legacy:legacy.activityIds.some(id=>legacy.ACTIVITIES[id].topicId===nodeId)
    };
  },relatedId);
  await frame.locator('[data-do="p3-related"]').first().click();
  // Following a knowledge link in Learn must stay in Learn. P3's original
  // expectation that every related click closes the lesson is obsolete.
  await page.waitForFunction(expected=>{
    if(mathSpace.snapshot().selected!=='node:'+expected.nodeId||
       new URL(location.href).searchParams.get('surface')!=='learn')return false;
    const journeyVisible=!document.querySelector('#journey-surface').hidden;
    const f=document.querySelector('#journey-frame'),url=f?.contentWindow?.location;
    const doc=f?.contentDocument;
    if(expected.lessonId)return journeyVisible&&url?.pathname.endsWith('/learn.html')&&
      url.hash==='#'+expected.lessonId&&
      f.contentWindow.mathLesson?.snapshot()?.id===expected.lessonId&&
      !!doc?.querySelector('#instruction')?.textContent.trim()&&
      !!doc?.querySelector('#work')?.textContent.trim();
    if(expected.legacy)return [...document.querySelectorAll('.work-panel')].some(el=>!el.hidden);
    if(expected.journeyStep!==null)return journeyVisible&&url?.pathname.endsWith('/journey.html')&&
      url.hash==='#'+expected.journeyStep&&!!doc?.querySelector('#m-current')?.textContent.trim();
    return !journeyVisible&&!document.querySelector('#learning-hub').hidden;
  },expected);
  const after=await snap();
  check(after.selected==='node:'+relatedId&&after.selected!==pose.selected,'related knowledge selects the actual other source node');
  check(after.position.every((v,i)=>Math.abs(v-pose.position[i])<.001),'related knowledge keeps map camera');
  const entry=await page.evaluate(()=>({
    hub:!document.querySelector('#learning-hub').hidden,
    journey:!document.querySelector('#journey-surface').hidden,
    legacy:[...document.querySelectorAll('.work-panel')].some(el=>!el.hidden)
  }));
  check(entry.hub||entry.journey||entry.legacy,'related knowledge opens its real task or an explicit unavailable explanation');
  if(entry.journey){
    if(expected.lessonId){
      await frame.locator('#work').waitFor({state:'visible'});
      check(await frame.locator('#work').isVisible(),'related native lesson has a visible mathematical workpiece');
    }else{
      await frame.locator('#m-current').waitFor({state:'visible'});
      check(await frame.locator('#m-current').isVisible(),'related early route has its visible mathematical task');
    }
    check(await page.locator('#learning-hub').isHidden(),'related node directly enters the mapped task');
    await page.evaluate(()=>{document.querySelector('#journey-frame').contentWindow.__p3RelatedProbe='retained';});
  }else if(entry.hub)
    check((await page.locator('#learning-hub').innerText()).includes('没有独立的数学操作活动'),'unconfigured related node reports absence rather than fictitious task');
  else check(expected.legacy,'related legacy math activity is source-configured');
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  check((await snap()).selected==='node:'+relatedId,'reselecting Learn retains related source node');
  if(entry.journey)
    check(await page.evaluate(()=>document.querySelector('#journey-frame').contentWindow.__p3RelatedProbe==='retained'),'reselecting Learn does not reload an active unsaved workpiece');
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
