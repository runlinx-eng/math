// Issue #23 P2: actual Chromium workflow and three target viewport screenshots.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p2-grade-distribution');
const checks=[],errors=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
const samePose=(a,b)=>Math.abs(a.cameraZoom-b.cameraZoom)<.0005&&a.position.every((n,i)=>Math.abs(n-b.position[i])<.0005)&&a.target.every((n,i)=>Math.abs(n-b.target[i])<.0005);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.on('pageerror',error=>errors.push(String(error)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#atlas');
  await page.waitForFunction(()=>window.mathSpace?.snapshot().visibleNodes.length===537&&document.querySelector('#grade-map-filter-status')?.textContent.includes('537'));
  await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null&&mathSpace.motion().transition===null);
  const pose=await snap();
  check(pose.counts.themes===5&&pose.counts.packs===23&&pose.counts.nodes===587&&pose.counts.edges===1223,'original atlas topology unchanged');
  await page.evaluate(()=>location.hash='#space/theme/numbers');
  await page.waitForFunction(()=>document.querySelector('#focus-card .grade-distribution[data-scope="theme"]')?.dataset.id==='numbers');
  check(samePose(pose,await snap()),'route to theme preserves existing camera');
  const theme=page.locator('#focus-card .grade-distribution');
  const sizes=await theme.locator('.grade-stage-choice strong').allTextContents();
  check(JSON.stringify(sizes.map(Number))===JSON.stringify([112,125,126]),'node-level theme totals match expected source data');
  check((await theme.locator('.grade-distribution-note').first().innerText()).includes('97 个'),'overlap count is explicitly disclosed');
  check((await theme.locator('.grade-distribution-note').last().innerText()).includes('12 个数学思维'),'thinking nodes excluded from stage counts');
  await theme.locator('.grade-group-list summary').click();
  check(await theme.locator('.grade-group-choice').count()===6,'theme offers real source group drilldown');
  await theme.locator('.grade-group-choice[data-id="number-sense"]').click();
  await page.waitForFunction(()=>document.querySelector('#focus-card .grade-distribution[data-scope="pack"]')?.dataset.id==='number-sense');
  check(samePose(pose,await snap()),'group drilldown does not refit the scene');
  check(JSON.stringify((await page.locator('#focus-card .grade-stage-choice strong').allTextContents()).map(Number))===JSON.stringify([48,20,12]),'group counts match the source node mapping');
  await page.locator('#focus-card .grade-stage-choice[data-stage="stage-2"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().gradeStageFilter==='stage-2');
  const stage=await snap();
  check(stage.gradeStageMatchedIds.length===259,'theme card controls use the same 259-node stage filter as sidebar');
  check(await page.locator('#grade-map-filter [data-stage="stage-2"]').getAttribute('aria-pressed')==='true','left-hand grade filter stays synchronized');
  check(samePose(pose,stage),'stage selection keeps camera position and target');
  let list=page.locator('#focus-card .grade-stage-list[data-stage="stage-2"]');
  check(await list.getAttribute('open')!==null,'selected stage opens the matching node list');
  check(await list.locator('.grade-node-choice').count()===20,'group list contains exactly 20 source members in stage 2');
  // Native summary is keyboard accessible. Expand/collapse with Enter.
  const summary=page.locator('#focus-card .grade-stage-list[data-stage="stage-1"] summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  check(await page.locator('#focus-card .grade-stage-list[data-stage="stage-1"]').getAttribute('open')!==null,'keyboard Enter expands another grade list');
  await page.locator('#focus-card .grade-stage-list[data-stage="stage-2"] .grade-node-choice').first().click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected?.startsWith('node:'));
  check(samePose(pose,await snap()),'selecting a grade-list node reuses same panorama and preserves camera');
  check(await page.locator('#focus-card .grade-node-position [data-evidence]').count()===1,'node-level evidence and role detail remain');
  check(await page.locator('#focus-card [data-context-section="relations"]').count()===1,'existing source relations remain accessible');
  check(await page.locator('#focus-card [data-context-section="understand"]').count()===1,'existing concept explanation remains accessible');
  check(await page.locator('#focus-card [data-context-section="learn"]').count()===1,'existing learning entry remains accessible');
  await page.locator('.top-tools [data-action="search"]').click();
  await page.locator('#search-input').fill('分数');
  check(await page.locator('#search-results [data-action="choose"]').count()>0,'existing search survives grade-list navigation');
  await page.keyboard.press('Escape');
  check(await page.locator('#search-popover').isHidden(),'Escape closes search');
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  const entry=await page.evaluate(()=>{
    const hub=document.querySelector('#learning-hub'),journey=document.querySelector('#journey-surface');
    return {hub:!hub.hidden,journey:!journey.hidden,legacy:[...document.querySelectorAll('.work-panel')].some(e=>!e.hidden)};
  });
  check(entry.hub||entry.journey||entry.legacy,'learning opens a real task or explains why no independent activity exists');
  if(entry.journey){
    check(await page.frameLocator('#journey-frame').locator('#instruction').count()===1,'configured grade-list topic directly opens its mathematics question');
    check(await page.locator('#learning-hub').isHidden(),'direct grade-list learning does not require route selection');
  }else if(entry.hub){
    check((await page.locator('#learning-hub').innerText()).includes('没有独立的数学操作活动'),'unconfigured grade-list node explains the missing activity');
  }
  const record=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  await page.locator('.primary-nav [data-action="nav-trail"]').click();
  check(await page.locator('#utility-drawer').isVisible(),'footprint surface still opens');
  await page.locator('.primary-nav [data-action="nav-explore"]').click();
  check(samePose(pose,await snap()),'task surfaces preserve prior camera');
  check(await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===record,'task navigation does not modify stored learning evidence');
  await page.evaluate(()=>location.hash='#space/pack/number-sense');
  await page.waitForFunction(()=>document.querySelector('#focus-card .grade-distribution[data-scope="pack"]')?.dataset.id==='number-sense');
  for(const [width,height] of [[1440,900],[980,760],[1280,720]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const bound=await page.evaluate(()=>{
      const r=s=>document.querySelector(s).getBoundingClientRect(),a=r('#network-guide'),b=r('#focus-card'),t=r('.topbar');
      return {a:{left:a.left,right:a.right,bottom:a.bottom},b:{left:b.left,right:b.right,top:b.top,bottom:b.bottom},top:t.bottom,scroll:document.querySelector('#focus-card').scrollHeight>document.querySelector('#focus-card').clientHeight};
    });
    check(bound.b.left>=bound.a.right-2&&bound.b.right<=width&&bound.b.bottom<=height&&bound.b.top>=bound.top-5,'grade card fits observation sidebar at '+width+'x'+height+' '+JSON.stringify(bound));
    check(bound.scroll,'long Chinese distribution remains independently scrollable at '+width+'x'+height);
    await page.locator('#focus-card .grade-stage-list[data-stage="stage-2"] summary').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,'p2-pack-'+width+'x'+height+'.png')});
    check(samePose(pose,await snap()),'viewport change keeps camera at '+width+'x'+height);
  }
  await page.locator('#grade-map-filter [data-stage="all"]').click();
  check((await snap()).gradeStageFilter==='all','left sidebar resets the right-hand stage controls');
  check(!errors.length,'no uncaught browser errors: '+errors.join('; '));
  console.log(JSON.stringify({status:'pass',checks,screenshots:out},null,2));
 }catch(err){
  console.error(JSON.stringify({status:'fail',checks,error:String(err),pageErrors:errors},null,2));process.exitCode=1;
  try{await page.screenshot({path:path.join(out,'failure.png')});}catch{}
 }finally{await browser.close();}
})();
