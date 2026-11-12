// P11 R2: prove entry consolidation keeps resume, trail history and backup paths.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p11-entry-simplification');
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const checks=[],errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 const nav=surface=>page.locator('.primary-nav [data-surface="'+surface+'"]');
 const more=page.locator('.top-tools [data-action="menu"]');
 const menu=page.locator('#menu-popover'),menuContinue=menu.locator('[data-action="continue"]');
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  // Selecting a node can legitimately update the visit ledger; capture the
  // storage baseline only after that user action, before navigation-only changes.
  assert(await page.locator('#continue-card [data-action="continue"]').isVisible(),'overview continuation card missing');
  await more.click();
  assert(await menu.isVisible(),'more menu missing');
  assert(!(await menuContinue.isVisible()),'duplicate visible overview continuation');
  assert(await menu.locator('[data-action="journal"]').count()===0,'duplicate menu journal');
  assert(await page.locator('#trail-count').count()===0,'duplicate footer journal');
  assert(await menu.locator('[data-action="export"]').isVisible(),'backup export missing');
  assert(await menu.locator('[data-action="import"]').isVisible(),'backup import missing');
  checks.push('overview: sole resume, history tab and backup commands');
  await page.screenshot({path:path.join(out,'overview-1440x900.png')});
  await page.locator('.top-tools [data-action="search"]').click();
  await page.locator('#search-input').fill('mt_ndGqFPWyen');
  await page.locator('#search-results [data-key="node:mt_ndGqFPWyen"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
  assert(await page.locator('#continue-card').isHidden(),'selected context should hide overview continuation');
  await more.click();
  assert(await menuContinue.isVisible(),'selected node must retain global resume as secondary');
  checks.push('selected: global resume stays reachable');
  const before=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  await page.screenshot({path:path.join(out,'selected-1440x900.png')});
  await nav('trail').click();
  await page.waitForFunction(()=>document.querySelector('#utility-drawer').dataset.surface==='trail');
  assert(await page.locator('#utility-frame').count()===1,'trail iframe missing');
  assert(await nav('trail').getAttribute('aria-pressed')==='true','trail tab inactive');
  await nav('explore').click();
  assert(await page.locator('#utility-drawer').isHidden(),'trail drawer not closed');
  checks.push('Trail tab: history and return');
  await page.setViewportSize({width:620,height:800});
  await nav('trail').click();
  assert(await page.locator('#utility-drawer').isVisible(),'compact Trail not reachable');
  await nav('explore').click();
  await more.click();
  assert(await menu.locator('[data-action="export"]').isVisible(),'compact backup export missing');
  assert(await menu.locator('[data-action="import"]').isVisible(),'compact backup import missing');
  checks.push('620x800: Trail and both backups reachable');
  await page.screenshot({path:path.join(out,'compact-620x800.png')});
  const after=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  assert(before===after,'navigation-only changes modified v2 learning record');
  // R2 batch 2: a named Trail session restores the saved native lesson rather
  // than resuming a different suspended iframe. Existing P11 focus coverage
  // separately exercises two actual 3D node-label clicks.
  await page.setViewportSize({width:1440,height:900});
  if(await menu.isVisible())await more.click();
  await nav('explore').click();
  const startAction=page.locator('#focus-card [data-action="open"]');
  assert(await startAction.isVisible(),'selected lesson primary action missing');
  assert((await startAction.textContent()).includes('开始学习'),'new lesson must say start');
  await startAction.focus();
  assert(await startAction.evaluate(el=>document.activeElement===el),'keyboard focus cannot reach primary lesson action');
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('#journey-frame').contentWindow.location.hash==='#share');
  const native=page.frameLocator('#journey-frame');
  await native.locator('#actions [data-do="check"]').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  const savedChecks=saved.lessons.share.cases[0].attempts.length;
  assert(savedChecks>0,'original native course must save a real attempt');
  await nav('trail').click();
  const trailResume=page.locator('#trail-node-context [data-action="trail-to-learn"]');
  assert(await trailResume.isVisible(),'Trail current-course resume missing');
  assert(await trailResume.getAttribute('data-id')==='share','Trail resume must name selected session ID');
  assert((await trailResume.textContent()).includes('继续'),'unfinished native course should show continue');
  await trailResume.click();
  await page.waitForFunction(()=>document.querySelector('#journey-frame').contentWindow.location.hash==='#share');
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  assert(restored.lessons.share.cases[0].attempts.length===savedChecks,'Trail resume lost or duplicated saved attempts');
  checks.push('named Trail resume restores original native course and attempts');
  // The second course is entered by clicking its actual projected 3D label.
  // A search URL or synthetic hash cannot substitute for this hit test.
  await nav('explore').click();
  await page.locator('.space-label.node[data-key="node:mt_09sySPqM9Z"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_09sySPqM9Z');
  // Explore clicks select context, never auto-launch a different lesson.
  await page.locator('#focus-card [data-action="open"]').click();
  await page.waitForFunction(()=>document.querySelector('#journey-frame').contentWindow.location.hash==='#unitcopies');
  await native.locator('#actions [data-do="check"]').click();
  const two=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  const secondChecks=two.lessons.unitcopies.cases[0].attempts.length;
  assert(secondChecks>0,'second actual native course did not save its work');
  assert(two.lessons.share.cases[0].attempts.length===savedChecks,'opening second course overwrote first');
  await nav('trail').click();
  assert(await trailResume.getAttribute('data-id')==='unitcopies','Trail selected second course ID wrong');
  await trailResume.click();
  await page.waitForFunction(()=>document.querySelector('#journey-frame').contentWindow.location.hash==='#unitcopies');
  assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')))).lessons.unitcopies.cases[0].attempts.length===secondChecks,
    'second course attempts changed when resumed');
  // Revisit the first source through the normal search selector only after
  // proving an actual second 3D click, then resume the exact first record.
  await nav('explore').click();
  await page.locator('.top-tools [data-action="search"]').click();
  await page.locator('#search-input').fill('mt_ndGqFPWyen');
  await page.locator('#search-results [data-key="node:mt_ndGqFPWyen"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
  await nav('trail').click();
  assert(await trailResume.getAttribute('data-id')==='share','Trail selected original course ID wrong');
  await trailResume.click();
  await page.waitForFunction(()=>document.querySelector('#journey-frame').contentWindow.location.hash==='#share');
  const twoRestored=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  assert(twoRestored.lessons.share.cases[0].attempts.length===savedChecks,'original course attempts lost');
  assert(twoRestored.lessons.unitcopies.cases[0].attempts.length===secondChecks,'other course attempts lost');
  checks.push('two independently saved native courses, second real 3D click and non-overwriting Trail restore');
  for(const [w,h] of [[1440,900],[1280,720],[980,760],[620,800],[1000,1350]]){
    await page.setViewportSize({width:w,height:h});
    await nav('learn').click();
    assert(await native.locator('#work').isVisible(),'native lesson missing at '+w+'x'+h);
    assert(await native.locator('#back').isHidden(),'embedded return duplicates outer return at '+w+'x'+h);
    await page.screenshot({path:path.join(out,'learning-'+w+'x'+h+'.png')});
    await nav('trail').click();
    assert(await trailResume.isVisible(),'Trail resume missing at '+w+'x'+h);
    await page.screenshot({path:path.join(out,'trail-'+w+'x'+h+'.png')});
    await nav('explore').click();
    await page.screenshot({path:path.join(out,'explore-'+w+'x'+h+'.png')});
  }
  await nav('trail').click();
  await trailResume.click();
  assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')))).lessons.share.cases[0].attempts.length===savedChecks,
    'five-viewport switching overwrote original course attempt');
  checks.push('five viewports: Explore/Learn/Trail screenshots, embedded return and draft-safe restore');
  // A real touch-capable context checks that navigation is not hover-only.
  const touchContext=await browser.newContext({viewport:{width:620,height:800},hasTouch:true,reducedMotion:'reduce'});
  try{
    const touch=await touchContext.newPage();
    await touch.goto('http://127.0.0.1:43827/?world=network&layout=53#space');
    await touch.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
    await touch.locator('.primary-nav [data-surface="trail"]').tap();
    assert(await touch.locator('#utility-drawer').isVisible(),'touch cannot open Trail');
    await touch.locator('.primary-nav [data-surface="explore"]').tap();
    assert(await touch.locator('#utility-drawer').isHidden(),'touch cannot return Explore');
    await touch.screenshot({path:path.join(out,'touch-620x800.png')});
    checks.push('620x800 touch: Explore/Trail navigation and screenshot');
  }finally{await touchContext.close();}
  assert(errors.length===0,'browser page errors: '+errors.join('; '));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,checks,errors,manualVerified:false,learningBytesUnchanged:true},null,2));
  console.log('P11_R2_ENTRY_SIMPLIFICATION_COMPLETE '+JSON.stringify({checks,learningBytesUnchanged:true}));
 }catch(error){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:false,checks,errors:[...errors,String(error)],manualVerified:false},null,2));
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  console.error('P11_R2_ENTRY_SIMPLIFICATION_FAILURE '+(error.stack||error));process.exitCode=1;
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
