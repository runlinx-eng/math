'use strict';
// #342 / P004a original Chromium UI: four native positions, actual Check,
// wrong -> correct, offline Service Worker, persisted State-v2, true export.
// Candidate replay runs in Node, not through an unregistered offline SW import.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p004b-quadrilateral-nesting');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec={id:'quadsort',index:3,node:'mt_Xt1cRqaBOW'};
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(condition,message)=>{assert.ok(condition,stage+': '+message);checks.push(stage+': '+message);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p004b-quadrilateral-nesting-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,childTrial:false,verbalProofAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,
  checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p004b-quadrilateral-nesting-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?
    {executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',
   serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{
   if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
    errors.push(stage+': unexpected external request '+r.url());
  });
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'native release cache identified');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let attempts=0;attempts<10&&!(await loc.isVisible());attempts++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': single closed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': control visible');
  };
  const click=async(action,index)=>{
   const loc=page.locator('#extra-controls [data-x="g23-'+action+'"][data-index="'+index+'"]');
   await reveal(loc);await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  const s={id:'quadsort',index:3,node:'mt_Xt1cRqaBOW',regions:[2,1,0,0]};
  stage='quadsort:3:source';
  await page.goto(origin.base+'v2.html#trail');
  const navigation=await page.goto(origin.base+'learn.html#quadsort');
  ok(navigation?.fromServiceWorker()===true,'original offline SW lesson navigation');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='quadsort');
  const existing=await page.evaluate(async()=>{
    const {packText,unpackText}=await import('./storage.js');
    const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=data.lessons.quadsort;
    if(!lesson||lesson.cases?.[3]?.attempts?.length)
      throw Error('P004b requires untouched original quadsort:3');
    lesson.index=3;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[3]?.attempts?.length||0;
  });
  ok(existing===0,'original target has no seeded Check');
  const reload=await page.reload();
  ok(reload?.fromServiceWorker()===true,'native task reload from SW');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===3);
  const native=await page.evaluate(async()=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor('quadsort',3),nodeId:LESSONS.quadsort.topicId};
  });
  const taskSha=digest(native.task);
  console.log('P004B_NATIVE_FULL_TASK_SHA256 quadsort:3 '+taskSha);
  nativeHashes.push({sessionId:'quadsort',index:3,sha256:taskSha,nodeId:native.nodeId});
  ok(native.nodeId===s.node&&native.task.type==='x-s23-nest',
    'exact original source and task type');
  ok(!!candidate.quadrilateralNestingBinding(native.task,
    {sessionId:'quadsort',index:3}),'original task matches isolated contract');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
    'standard desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,
    'strict-A feedback remains unregistered');
  const sort=async(item,slot)=>{
    const i=page.locator('#extra-controls [data-xfield="item"]');
    const r=page.locator('#extra-controls [data-xfield="slot"]');
    await reveal(i);await i.selectOption(String(item));
    await reveal(r);await r.selectOption(String(slot));
    const b=page.locator('#extra-controls [data-x="g23-sort"]');
    await reveal(b);await b.click();
  };
  const check=async()=>{
    const b=page.locator('#actions [data-do="check"]');
    await reveal(b);await b.click();
  };
  stage='quadsort:3:wrong-check';
  for(const [i,r] of s.regions.entries())await sort(i,i===0?0:r);
  const answer=page.locator('#extra-controls [data-xfield="answers.0"]');
  await reveal(answer);await answer.selectOption('yes');
  await check();
  const wrong=await capture(page,out,'quadsort-3',s,'wrong-check');
  captures.push({position:'quadsort:3',phase:'wrong-check',
    attempts:wrong.attempts.length,history:wrong.model.history.length,storage:wrong.storage});
  ok(wrong.attempts.length===1,'real wrong Check persisted');
  const wrongAccepted=await page.evaluate(async model=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    return api.inspect(sessionTaskFor('quadsort',3),model).correct;
  },wrong.model);
  ok(wrongAccepted===false,'original grader rejects incorrect placement');
  ok(!candidate.replayQuadrilateralNestingEvidence(native.task,wrong.model,
    {sessionId:'quadsort',index:3}),'candidate refuses wrong placement');
  stage='quadsort:3:corrected-check';
  await sort(0,2);await check();
  const accepted=await capture(page,out,'quadsort-3',s,'correct-check');
  captures.push({position:'quadsort:3',phase:'correct-check',
    attempts:accepted.attempts.length,history:accepted.model.history.length,
    storage:accepted.storage});
  ok(accepted.attempts.length===2,'both actual Check submissions retained');
  const correctAccepted=await page.evaluate(async model=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    return api.inspect(sessionTaskFor('quadsort',3),model).correct;
  },accepted.model);
  ok(correctAccepted===true,'original grader accepts corrected placement');
  const context={sessionId:'quadsort',index:3};
  const proof=candidate.submittedQuadrilateralNestingEvidence(
    native.task,accepted.model,accepted.record,context);
  ok(proof?.kind==='quadrilateral-nesting-actions',
    'latest Check binds exact original event replay');
  ok(JSON.stringify(proof.independentlyCalculatedRegions)===JSON.stringify([2,1,0,0]),
    'independent four-card geometry matches nested regions');
  ok(proof.originalControlEvents.some(e=>e.isCorrection&&e.item===0),
    'actually corrected square placement');
  const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
  const fake=structuredClone(accepted.model);fake.history[0].f.item='00';
  ok(!candidate.submittedQuadrilateralNestingEvidence(native.task,accepted.model,stale,context)&&
    !candidate.replayQuadrilateralNestingEvidence(native.task,fake,context)&&
    !candidate.replayQuadrilateralNestingEvidence(native.task,accepted.model,
      {sessionId:'quadsort',index:0}),
    'reject stale, malformed and wrong-location evidence');
  ok(!proof.reasonForChosenRegionObserved&&!proof.generalMasteryAssessed,
    'no claim about private reasoning or mastery');
  const png='quadsort-3-correct.png';
  await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
  stage='quadsort:3:offline-reload';
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'corrected lesson reloads from offline SW');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===3);
  const saved=await capture(page,out,'quadsort-3',s,'offline-reload');
  captures.push({position:'quadsort:3',phase:'offline-reload',
    attempts:saved.attempts.length,history:saved.model.history.length,storage:saved.storage});
  assert.deepEqual(saved.model,accepted.model,'real model persists after offline reload');
  assert.deepEqual(saved.record,accepted.record,'wrong and corrected Check history persists');
  stage='original-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();
  await btn.waitFor();
  const download=page.waitForEvent('download');
  await btn.click();
  const raw=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'actual original State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or external requests');
  persist();
  console.log('P004B_NESTED_FAMILY_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:1,checks:checks.length,strictAApproved:false}));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
