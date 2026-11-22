'use strict';
// #342 P005k real B25 source: test/choose, wrong-to-correct Check, offline State-v2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p005k-cross-source-angle-order');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec={id:'angleestimate',index:2,node:'mt_YUJ5pwalqL'};
let stage='startup';const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(v,msg)=>{assert.ok(v,stage+': '+msg);checks.push(stage+': '+msg);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p005k-cross-source-angle-order-browser/1',
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
  'dist/learning/p005k-cross-source-angle-order-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?
    {executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',
   serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{
   if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
    errors.push(stage+': unexpected external request '+r.url());
  });
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original release cache identified');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': one closed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': control visible');
  };
  const click=async(action,index)=>{
   const loc=page.locator('#extra-controls [data-x="g25-'+action+'"][data-index="'+index+'"]');
   await reveal(loc);await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  stage='angleestimate:2:source';
  await page.goto(origin.base+'v2.html#trail');
  const nav=await page.goto(origin.base+'learn.html#angleestimate');
  ok(nav?.fromServiceWorker()===true,'original lesson navigation is offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='angleestimate');
  const existing=await page.evaluate(async()=>{
   const {packText,unpackText}=await import('./storage.js');
   const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=data.lessons.angleestimate;
   if(!lesson||lesson.cases?.[2]?.attempts?.length)
    throw Error('P005k requires untouched original task');
   lesson.index=2;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
   return lesson.cases?.[2]?.attempts?.length||0;
  });
  ok(existing===0,'no seeded native Check');
  const loaded=await page.reload();
  ok(loaded?.fromServiceWorker()===true,'native position reloads offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===2);
  const native=await page.evaluate(async()=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor('angleestimate',2),nodeId:LESSONS.angleestimate.topicId};
  });
  const hash=digest(native.task);
  console.log('P005K_NATIVE_FULL_TASK_SHA256 angleestimate:2 '+hash);
  nativeHashes.push({sessionId:'angleestimate',index:2,sha256:hash,nodeId:native.nodeId});
  ok(native.nodeId===spec.node&&hash==='66129894fabd7fda86e14f8373186a7b65cae628f29a1868a7f30c137e0935e9'&&native.task.type==='x-g25-compare'&&
   native.task.order===true&&native.task.requireTest===true&&
   native.task.questions.length===0,
   'original source and acute comparison task');
  ok(!!candidate.angleOrderingBinding(native.task,{sessionId:'angleestimate',index:2}),
   'source-locked native candidate');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
   'standard desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,
   'no unregistered strict-A feedback');

  stage='angleestimate:2:wrong-check';
  for(let i=0;i<4;i++)await click('test',i);
  await click('choose',1);
  await click('choose',2);
  await check();
  const wrong=await capture(page,out,'angleestimate-2',spec,'wrong-check');
  captures.push({phase:'wrong-check',attempts:wrong.attempts.length,
   history:wrong.model.history.length,storage:wrong.storage});
  ok(wrong.attempts.length===1,'real wrong Check retained');
  const originalWrong=await page.evaluate(async m=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b25-model.js');
   return api.inspect(sessionTaskFor('angleestimate',2),m).correct;
  },wrong.model);
  ok(originalWrong===false,'original grader rejects non-acute choice');
  ok(!candidate.replayAngleOrderingEvidence(native.task,wrong.model,
   {sessionId:'angleestimate',index:2}),'independent replay rejects wrong choice');

  stage='angleestimate:2:corrected-check';
  const undo=page.locator('#extra-controls [data-x="g25-undo"]');
  await reveal(undo);await undo.click();
  for(const i of [3,2,0])await click('choose',i);
  await check();
  const accepted=await capture(page,out,'angleestimate-2',spec,'correct-check');
  captures.push({phase:'correct-check',attempts:accepted.attempts.length,
   history:accepted.model.history.length,storage:accepted.storage});
  ok(accepted.attempts.length===2,'wrong and corrected Check remain');
  const originalOk=await page.evaluate(async m=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b25-model.js');
   return api.inspect(sessionTaskFor('angleestimate',2),m).correct;
  },accepted.model);
  ok(originalOk===true,'original native grader accepts corrected choice');
  const proof=candidate.submittedAngleOrderingEvidence(
   native.task,accepted.model,accepted.record,{sessionId:'angleestimate',index:2});
  ok(proof?.kind==='native-opening-ascending-order',
   'latest Check binds independent math replay');
  ok(JSON.stringify(proof.ascendingOriginalIndices)==='[1,3,2,0]'&&
   proof.measuredOpeningsDegrees.every((v,i)=>Math.abs(v-[135,40,100,70][i])<1e-8),
   'independent trigonometric opening order ignores arm lengths');
  ok(proof.originalControlEvents.some(e=>e.action==='undo'),
   'real order undo correction retained');
  const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
  const forged=structuredClone(accepted.model);forged.history[0].d.index='00';
  ok(!candidate.submittedAngleOrderingEvidence(native.task,accepted.model,
   stale,{sessionId:'angleestimate',index:2})&&
   !candidate.replayAngleOrderingEvidence(native.task,forged,
    {sessionId:'angleestimate',index:2})&&
   !candidate.replayAngleOrderingEvidence(native.task,accepted.model,
    {sessionId:'angleestimate',index:0}),
   'reject stale Check, forged event and wrong position');
  ok(proof.strictAApproved===false&&!proof.verbalProofAssessed&&
   !proof.generalMasteryAssessed,'no inferred mastery or spoken proof');
  const png='angleestimate-2-correct.png';
  await page.screenshot({path:path.join(out,png),fullPage:false});
  screenshots.push(png);
  stage='angleestimate:2:offline-reload';
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'corrected original lesson reloads offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===2);
  const saved=await capture(page,out,'angleestimate-2',spec,'offline-reload');
  captures.push({phase:'offline-reload',attempts:saved.attempts.length,
   history:saved.model.history.length,storage:saved.storage});
  assert.deepEqual(saved.model,accepted.model,'real B25 model survives reload');
  assert.deepEqual(saved.record,accepted.record,'real Check history survives reload');
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const dl=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await dl).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
   'real original State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or external requests');
  persist();
  console.log('P005K_ANGLE_ORDERING_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
