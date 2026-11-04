// Desktop acceptance for the opt-in three-level source-backed spatial cards.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/grade-spatial-cards');
const url='http://127.0.0.1:43827/?world=network&layout=53#atlas';
const checks=[],errors=[];
const check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack||String(e)));
 try{
  await page.goto(url);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const pose=()=>page.evaluate(()=>{const x=mathSpace.snapshot();return JSON.stringify({position:x.position,target:x.target,zoom:x.cameraZoom,positions:x.positions});});
  const before=await pose();
  await page.locator('[data-action="observation-mode"][data-mode="grade"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.grade-pack-row').length===23&&mathSpace.snapshot().gradeSpatial.nodes===537);
  check(await page.locator('[data-action="grade-select"]').count()===6,'the six existing year selectors remain distinct from spatial stages');
  check(await page.locator('.grade-spatial-stage').count()===3,'three paired-year stage cards exist');
  check(await page.locator('.grade-spatial-stage:visible').count()===0,'spatial cards are opt-in');
  await page.locator('[data-action="grade-spatial-toggle"]').click();
  await page.waitForFunction(()=>document.body.dataset.gradeSpatial==='true'&&mathSpace.snapshot().gradeSpatial.enabled);
  const stats=await page.evaluate(()=>mathSpace.snapshot());
  check(stats.gradeSpatial.stages===3&&stats.gradeSpatial.packs===23&&stats.gradeSpatial.nodes===537,'full 3/23/537 source model stays attached');
  check(await page.locator('.grade-spatial-stage').count()===3,'all three stage anchors still exist');
  const source=await page.evaluate(async()=>await(await fetch('./data/grade-progression.json')).json());
  const sourcePack=source.packs.find(pack=>pack.packId==='add-subtract');
  const first=sourcePack.stageJudgements['stage-1'];
  const expected=first.recordStatus==='incomplete'?'待补充':first.markLabel;
  check(await page.locator('.space-label.pack[data-key="pack:add-subtract"] .grade-spatial-tag').textContent()===expected,'knowledge group card shows source judgement');
  await page.locator('[data-action="grade-select"][data-grade="3"]').click();
  await page.waitForFunction(()=>document.querySelector('.grade-current-stage')?.dataset.selectedStage==='stage-2');
  check((await page.locator('.space-label.node[data-key="node:mt_s2mfRBoTal"] .grade-spatial-tag').textContent()).includes('3—4年级 · 延伸'),'multi-stage knowledge point shows its actual selected-stage role');
  check(await pose()===before,'stage selection and spatial overlay do not change camera or any node coordinates');
  await page.screenshot({path:path.join(out,'desktop-spatial-cards.png')});
  await page.locator('[data-action="grade-spatial-toggle"]').click();
  await page.waitForFunction(()=>document.body.dataset.gradeSpatial==='false');
  check(await page.locator('.grade-spatial-stage:visible').count()===0,'switching the overlay off removes spatial cards');
  check(await pose()===before,'closing the overlay preserves the original camera and map');
  await page.locator('[data-action="observation-mode"][data-mode="relationship"]').click();
  check(await page.locator('#grade-observation-view').isHidden(),'relationship panorama remains available');
  check(errors.length===0,'no uncaught browser errors: '+errors.join(' | '));
  console.log(JSON.stringify({passed:checks.length,checks},null,2));
 }catch(error){
  console.error(error.stack||String(error));console.error('Browser errors:',errors);
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  process.exitCode=1;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
