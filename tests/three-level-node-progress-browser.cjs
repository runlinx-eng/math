// Issue #88: real Chromium/visible UI test, not a synthetic diagram or direct lesson hash.
// Use normal search -> node -> Learn -> actual mathematical controls -> saved checks.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../verification/three-level-node-progress');
const base=process.env.MATH_BROWSER_BASE||'http://127.0.0.1:43827';
const checks=[],errors=[];
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  const nodeId='mt_Ep7TDFuYUa',label='node:'+nodeId;
  const native=page.frameLocator('#journey-frame');
  const check=(condition,description)=>{assert.ok(condition,description);checks.push(description);};
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')||'null'));
  const tier=()=>page.locator('.space-label.node[data-key="'+label+'"]').getAttribute('data-progress');
  const screenshot=async name=>page.screenshot({path:path.join(out,name+'.png')});
  const waitTier=async expected=>page.waitForFunction(({id,tier})=>{
    const el=document.querySelector('.space-label.node[data-key="node:'+id+'"]');
    return el?.dataset.progress==='tier-'+tier;
  },{id:nodeId,tier:expected},{timeout:30000});
  const saveReport=()=>fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({schema:'math-node-progress-browser/1',checks,errors,sourceNode:nodeId,chromium:true},null,2)+'\n');
  try{
    await page.goto(base+'/?world=network&layout=53#space');
    await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
    await waitTier(1);
    check((await tier())==='tier-1','unopened node is not started');
    check(!await page.evaluate(key=>mathSpace.completionMarker(key),label),'no completed ring on unopened node');
    await page.locator('[data-action="search"]').first().click();
    await page.locator('#search-input').fill(nodeId);
    await page.locator('#search-results [data-key="'+label+'"]').click();
    await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,nodeId);
    check((await tier())==='tier-1','search and selection do not count as saved answers');
    await screenshot('01-unlearned');
    await page.locator('#focus-card [data-action="open"]').click();
    await page.waitForFunction(()=>document.querySelector('#journey-frame')?.contentWindow?.mathLesson?.snapshot?.()?.id==='equivalent');
    check((await tier())==='tier-1','opening Learn and unsubmitted work remain tier 1');
    await native.locator('#actions [data-do="check"]').click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.equivalent?.cases?.[0]?.attempts?.length===1);
    await waitTier(2);
    check(await native.locator('#scene').getAttribute('data-stage')==='revise','first real incorrect check retains revise feedback');
    check((await state()).lessons.equivalent.cases[0].attempts.length===1,'wrong attempt persisted');
    check(!await page.evaluate(key=>mathSpace.completionMarker(key),label),'tier 2 does not produce a core-completion light');
    await screenshot('02-learning-wrong');
    for(const [row,index] of [[0,1],[1,2],[2,3]])await native.locator('#work [data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
    check((await tier())==='tier-2','editing after wrong answer still counts as learning');
    await native.locator('#actions [data-do="check"]').click();
    check(await native.locator('#scene').getAttribute('data-stage')==='passed','real equivalent model passed original grader');
    await native.locator('#actions [data-do="next"]').click();
    await native.locator('input[data-field="mark"]').fill('4');
    await native.locator('#actions [data-do="check"]').click();
    check(await native.locator('#scene').getAttribute('data-stage')==='passed','task two passed its original check');
    check((await tier())==='tier-2','partial required checks remain tier 2');
    await native.locator('#actions [data-do="next"]').click();
    await native.locator('input[data-field="mark"]').fill('6');
    await native.locator('#actions [data-do="check"]').click();
    check(await native.locator('#scene').getAttribute('data-stage')==='passed','final required task passed its own check');
    await waitTier(3);
    await page.waitForFunction(key=>mathSpace.completionMarker(key),label);
    check((await tier())==='tier-3','all current checked required work lights tier 3');
    check((await state()).lessons.equivalent.cases[0].attempts.length===2,'earlier wrong submission is preserved');
    await screenshot('03-core-lit');
    await page.reload();
    await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
    await waitTier(3);
    await page.waitForFunction(key=>mathSpace.completionMarker(key),label);
    check((await tier())==='tier-3','refresh restores core light from actual saved checks');
    await screenshot('04-core-lit-restored');
    // If the task is restored in a summary view after reload, reopen it without
    // modifying storage so the test still checks the existing current workpiece.
    const frameActive=await page.locator('#journey-frame').evaluate(el=>el.contentWindow?.mathLesson?.snapshot?.()?.id==='equivalent');
    if(!frameActive){
      await page.locator('.primary-nav [data-surface="learn"]').click();
      await page.waitForFunction(()=>document.querySelector('#journey-frame')?.contentWindow?.mathLesson?.snapshot?.()?.id==='equivalent');
    }
    const mark=native.locator('input[data-field="mark"]');
    await mark.waitFor({state:'visible'});
    await mark.fill('7');
    await waitTier(2);
    check(!await page.evaluate(key=>mathSpace.completionMarker(key),label),'modifying a passed workpiece extinguishes tier-3 light');
    check((await state()).lessons.equivalent.cases[2].attempts.length===1,'history remains after unsubmitted edit');
    await screenshot('05-modified-recheck-required');
    await page.reload();
    await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
    await waitTier(2);
    check((await state()).lessons.equivalent.cases[2].attempts.length===1,'modified workpiece and checked history both survive refresh');
    await screenshot('06-modified-restored');
    // A color-themed graph remains a separate visual dimension from progress.
    await page.locator('.primary-nav [data-surface="explore"]').click();
    const theme=page.locator('[data-action="network-theme"]').first();
    if(await theme.isVisible())await theme.click();
    check((await tier())==='tier-2','theme/overview interaction cannot silently promote a node');
    await screenshot('07-theme-progress');
    check(!errors.length,'no runtime page errors');
    saveReport();
    console.log('THREE_LEVEL_NODE_PROGRESS_BROWSER '+checks.length+' checks passed');
  }catch(error){saveReport();await screenshot('failure').catch(()=>{});console.error('THREE_LEVEL_NODE_PROGRESS_BROWSER_FAILURE '+(error.stack||error));process.exitCode=1;}
  finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
