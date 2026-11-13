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
  // A learning-panel related-knowledge link is an exploration request,
  // not permission to replace the current native workpiece.
  await frame.locator('[data-do="p3-related"]').first().click();
  await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,relatedId);
  await page.waitForFunction(()=>!document.querySelector('#journey-surface').hidden&&
    document.querySelector('#journey-frame').contentWindow.mathLesson?.snapshot()?.id==='share');
  const after=await snap();
  check(after.selected==='node:'+relatedId&&after.selected!==pose.selected,'related knowledge selects the actual other source node');
  check(after.position.every((v,i)=>Math.abs(v-pose.position[i])<.001),'related knowledge keeps map camera');
  check(await page.locator('#focus-card').isVisible(),'related node shows exploration details beside A');
  check((await frame.locator('.p3-evidence').textContent()).includes('2 次提交'),
    'related exploration preserves A workpiece and attempt history');
  check(await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.share.cases[0].attempts.length===2),
    'A stored attempts survive B exploration');
  // Only an explicit learning action is allowed to switch from A to B.
  if(expected.lessonId){
    const enter=page.locator('#focus-card [data-action="open"]').first();
    check(await enter.isVisible(),'mapped related native lesson has an explicit learning entry');
    await enter.click();
    await page.waitForFunction(id=>{
      const f=document.querySelector('#journey-frame'),doc=f?.contentDocument;
      return !document.querySelector('#journey-surface').hidden&&
        f.contentWindow.mathLesson?.snapshot()?.id===id&&
        !!doc?.querySelector('#work');
    },expected.lessonId);
    check(await frame.locator('#work').isVisible(),'explicitly opened B has visible mathematical workpiece');
    await page.evaluate(()=>{document.querySelector('#journey-frame').contentWindow.__p3RelatedProbe='retained';});
  }else{
    check((await snap()).selected==='node:'+relatedId,
      'unconfigured or legacy related knowledge remains inspectable without fictitious lesson');
  }
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  check((await snap()).selected==='node:'+relatedId,'reselecting Learn retains related exploration node');
  if(expected.lessonId)
    check(await page.evaluate(()=>document.querySelector('#journey-frame').contentWindow.__p3RelatedProbe==='retained'),
      'reselecting Learn does not reload the explicitly chosen native workpiece');
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
