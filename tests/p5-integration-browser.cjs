// P5 actual Chromium: nine user tasks, backup conflict UI and three viewports.
// Synthetic backups are clearly marked; no claim of real user history acceptance.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p5-integration');
const checks=[],errors=[],check=(yes,name)=>{if(!yes)throw Error(name);checks.push(name);};
const base='http://127.0.0.1:43827/';
const id='mt_ndGqFPWyen';
const sameCamera=(a,b)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<.002)&&
 a.target.every((v,i)=>Math.abs(v-b.target[i])<.002);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',serviceWorkers:'allow'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const frame=page.frameLocator('#journey-frame');
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 const revealEvidence=()=>frame.locator('#learning-support').evaluate(el=>{el.open=true;});
 try{
  await page.goto(base+'?world=network&layout=53#atlas');
  await page.waitForFunction(()=>window.mathSpace?.snapshot().visibleNodes.length===537);
  await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null&&mathSpace.motion().transition===null);
  const initial=await snap();
  check(initial.counts.nodes===587&&initial.counts.edges===1223&&initial.visibleNodes.length===537,'1 exploration: original single 3D panorama intact');
  await page.locator('#grade-map-filter [data-stage="stage-2"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().gradeStageFilter==='stage-2');
  check((await snap()).gradeStageMatchedIds.length===259,'2 grade observation: 259 original mapped nodes');
  check(sameCamera(initial,await snap()),'grade selection never changes camera');
  await page.evaluate(id=>{location.hash='#space/node/'+id},id);
  await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,id);
  check(await page.locator('#focus-card [data-context-section="understand"]').count()===1,'3 understanding: existing concept information accessible');
  check(await page.locator('#focus-card [data-context-section="relations"] .network-relations').count()===1,'4 relationship tracing: original relation detail accessible');
  check(sameCamera(initial,await snap()),'concept and relationship selection preserve camera');
  await page.locator('#focus-card [data-action="open"]').first().click();
  await frame.locator('#p3-learning-flow').waitFor({state:'attached'});
  await frame.locator('#learning-support > summary').click();
  check(await frame.locator('.p3-before-check').isHidden(),'5 hands-on learning: no empty evidence wall before any check');
  check(await frame.locator('#actions [data-do="check"]').isVisible(),'a task is checkable without a separate start');
  await frame.locator('#actions [data-do="check"]').click();
  await revealEvidence();
  check(await frame.locator('.p3-evidence').textContent().then(x=>x.includes('需要修改')),'6 result verification: incorrect first attempt surfaced');
  await frame.locator('[data-do="hint"]').first().click();
  await revealEvidence();
  await frame.locator('[data-do="p3-retry"]').click();
  await revealEvidence();
  await frame.locator('#actions [data-do="check"]').click();
  await revealEvidence();
  await frame.locator('.p3-evidence-details').evaluate(el=>{el.open=true;});
  check(await frame.locator('.p3-evidence').textContent().then(x=>x.includes('2 次提交')&&x.includes('提示或支持')),'6 verification: history and support retained in detail');
  check(await frame.locator('.p3-followups [data-do="p3-related"]').count()>0,'7 extension: actual source relationship leads onward');
  await frame.locator('.p3-application').evaluate(el=>{el.open=true;});
  check(await frame.locator('.p3-application').textContent().then(x=>x.includes('模拟情境')&&x.includes('现实生活')),'8 application: simulated and real practice stay available in the optional drawer');
  await frame.locator('.p3-application').evaluate(el=>{el.open=false;});
  const saved=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  check(JSON.parse(saved).lessons.share.cases[0].attempts.length===2,'9 footprint: two genuine browser submissions persisted');
  const before=await snap();
  for(const [w,h] of [[1440,900],[980,760],[1280,720]]){
    await page.setViewportSize({width:w,height:h});
    const pane=await page.locator('#journey-surface').boundingBox();
    check(!!pane&&pane.x>=-2&&pane.y>=-2&&pane.x+pane.width<=w+2&&pane.y+pane.height<=h+2,'learning pane fits '+w+'x'+h);
    await page.screenshot({path:path.join(out,'learning-'+w+'x'+h+'.png')});
    check(sameCamera(before,await snap()),'viewport resize does not move 3D camera '+w+'x'+h);
  }
  await page.reload();await page.waitForFunction(()=>window.mathSpace?.snapshot().journeyOpen);
  await frame.locator('#p3-learning-flow').waitFor({state:'attached'});
  await frame.locator('#learning-support > summary').click();
  check(await frame.locator('.p3-evidence').textContent().then(x=>x.includes('2 次提交')),'9 resume: actual attempts survive refresh');
  await page.locator('#journey-surface [data-action="close-journey"]').click();
  await page.locator('.primary-nav [data-action="nav-trail"]').click();
  await page.waitForFunction(()=>document.querySelector('#utility-frame')?.contentWindow?.location.hash==='#trail');
  check(await page.locator('#utility-drawer').isVisible(),'9 trail: footprint surface opens');
  await page.screenshot({path:path.join(out,'trail-1440x900.png')});
  await page.locator('.primary-nav [data-action="nav-explore"]').click();
  check(sameCamera(before,await snap()),'return to exploration keeps camera');
  // Import UX uses synthetic V2 data only; local and incoming conflicting drafts
  // must leave the exact existing key untouched and provide readable feedback.
  const trail=await context.newPage();
  trail.on('pageerror',e=>errors.push(String(e)));
  await trail.goto(base+'v2.html#trail');
  await trail.locator('#import-file').waitFor({state:'attached'});
  const sample=await trail.evaluate(async()=>{
    const {fresh,KEY}=await import('./exploration-core.js');
    const {freshLesson}=await import('./learning/state.js');
    const s=fresh();s.lessons.share=freshLesson('share');
    s.lessons.share.draft='本地草稿 A';
    localStorage.setItem(KEY,JSON.stringify(s));
    const other=structuredClone(s);other.lessons.share.draft='外部草稿 B';
    return {before:localStorage.getItem(KEY),incoming:JSON.stringify({app:'math-explorer',version:2,state:other})};
  });
  await trail.reload();await trail.locator('#import-file').waitFor({state:'attached'});
  await trail.locator('#import-file').setInputFiles({name:'synthetic-conflict-v2.json',mimeType:'application/json',buffer:Buffer.from(sample.incoming)});
  await trail.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('冲突'));
  check((await trail.locator('#toast').innerText()).includes('已取消导入'),'synthetic conflict receives explicit failure notice');
  check(await trail.evaluate(()=>localStorage.getItem('math-explorer-v2'))===sample.before,'synthetic conflicting import leaves original storage bytes unchanged');
  check(!errors.length,'no uncaught browser errors');
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors,syntheticBackup:true,realHistoricalBackupVerified:false,manualVisualReview:false},null,2));
  console.log('P5 Chromium checks: '+checks.length+' passed');
 }catch(e){
  console.error('P5 Chromium failure: '+e.stack);
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(e),checks,errors},null,2));
  try{await page.screenshot({path:path.join(out,'failure.png')});}catch{}
  process.exitCode=1;
 }finally{await browser.close();}
})();
