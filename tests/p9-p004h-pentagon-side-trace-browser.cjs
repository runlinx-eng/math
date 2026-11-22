'use strict';
// #342 P004h: original pentagon side marking, Check correction, offline SW and State-v2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p004h-pentagon-side-trace');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(condition,message)=>{assert.ok(condition,stage+': '+message);checks.push(stage+': '+message);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p004h-pentagon-side-trace-browser/1',
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
  'dist/learning/p004h-pentagon-side-trace-evidence.js')).href);
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
  ok(!!release,'original cache identified');
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
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const mark=async index=>{
   const loc=page.locator('#extra-controls [data-x="g23-mark"][data-index="'+index+'"]');
   await reveal(loc);await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  const s={id:'sidesfold',index:0,node:'mt_sBcRdUfAzV'};
  stage='sidesfold:0:native-start';
  await page.goto(origin.base+'v2.html#trail');
  const nav=await page.goto(origin.base+'learn.html#sidesfold');
  ok(nav?.fromServiceWorker()===true,'original offline lesson navigation');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='sidesfold');
  const existing=await page.evaluate(async()=>{
   const {packText,unpackText}=await import('./storage.js');
   const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=data.lessons.sidesfold;
   if(!lesson||lesson.cases?.[0]?.attempts?.length)
    throw Error('P004h requires untouched native task');
   lesson.index=0;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
   return lesson.cases?.[0]?.attempts?.length||0;
  });
  ok(existing===0,'native task has no seeded Check');
  const reload=await page.reload();
  ok(reload?.fromServiceWorker()===true,'original task reloads offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===0);
  const native=await page.evaluate(async()=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor('sidesfold',0),nodeId:LESSONS.sidesfold.topicId};
  });
  const hash=digest(native.task);
  console.log('P004H_NATIVE_FULL_TASK_SHA256 sidesfold:0 '+hash);
  nativeHashes.push({sessionId:'sidesfold',index:0,sha256:hash,nodeId:native.nodeId});
  const context={sessionId:'sidesfold',index:0};
  ok(native.nodeId===s.node&&native.task.type==='x-s23-sides'&&
   native.task.shape==='pentagon'&&native.task.rotation===24,
   'exact original pentagon source and rotation');
  ok(!!candidate.pentagonSideTraceBinding(native.task,context),
   'candidate binds native source and original task');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
   'standard desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,
   'no strict-A feedback from unregistered candidate');
  stage='sidesfold:0:incomplete-marks';
  for(let i=0;i<4;i++)await mark(i);
  const incomplete=await capture(page,out,'sidesfold-0',s,'incomplete-marks');
  captures.push({phase:'incomplete-marks',attempts:incomplete.attempts.length,
   history:incomplete.model.history.length});
  ok(!candidate.replayPentagonSideTraceEvidence(native.task,incomplete.model,context),
   'reject just four original edge marks');
  await mark(4);
  // The original controls have two real numeric answer fields.
  const answer=i=>page.locator('#extra-controls [data-xfield="answers.'+i+'"]');
  for(const [i,value] of [['0','4'],['1','5']]){
   const loc=answer(i);await reveal(loc);await loc.fill(value);
  }
  stage='sidesfold:0:wrong-check';
  await check();
  const wrong=await capture(page,out,'sidesfold-0',s,'wrong-check');
  captures.push({phase:'wrong-check',attempts:wrong.attempts.length,
   history:wrong.model.history.length,storage:wrong.storage});
  ok(wrong.attempts.length===1,'real wrong Check retained');
  const originalWrong=await page.evaluate(async model=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b23-model.js');
   return api.inspect(sessionTaskFor('sidesfold',0),model).correct;
  },wrong.model);
  ok(!originalWrong,'native grader rejects wrong edge count');
  ok(!candidate.replayPentagonSideTraceEvidence(native.task,wrong.model,context),
   'candidate rejects wrong answer despite all edge marks');
  stage='sidesfold:0:corrected-check';
  await answer(0).fill('5');
  await check();
  const accepted=await capture(page,out,'sidesfold-0',s,'correct-check');
  captures.push({phase:'correct-check',attempts:accepted.attempts.length,
   history:accepted.model.history.length,storage:accepted.storage});
  ok(accepted.attempts.length===2,'original wrong-to-correct Checks retained');
  const originalCorrect=await page.evaluate(async model=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b23-model.js');
   return api.inspect(sessionTaskFor('sidesfold',0),model).correct;
  },accepted.model);
  ok(originalCorrect,'original grader accepts five marks and both counts');
  const proof=candidate.submittedPentagonSideTraceEvidence(
   native.task,accepted.model,accepted.record,context);
  ok(proof?.kind==='native-pentagon-side-marking'&&
   proof.independentGeometry.edgeCount===5&&
   proof.observedEdgeIndices.length===5,
   'latest original Check binds independent pentagon side trace');
  const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
  const forged=structuredClone(accepted.model);
  forged.history[0].d.index='05';
  ok(!candidate.submittedPentagonSideTraceEvidence(native.task,
      accepted.model,stale,context)&&
    !candidate.replayPentagonSideTraceEvidence(native.task,forged,context)&&
    !candidate.replayPentagonSideTraceEvidence(native.task,accepted.model,
      {sessionId:'sidesfold',index:1}),
   'stale Check, forged mark and wrong task position rejected');
  ok(!proof.physicalMeasurementObserved&&!proof.generalMasteryAssessed,
   'no unsupported claim about measurement or mastery');
  const png='sidesfold-0-correct.png';
  await page.screenshot({path:path.join(out,png),fullPage:false});
  screenshots.push(png);
  stage='sidesfold:0:offline-reload';
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'corrected task reloads from offline SW');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===0);
  const saved=await capture(page,out,'sidesfold-0',s,'offline-reload');
  captures.push({phase:'offline-reload',attempts:saved.attempts.length,
   history:saved.model.history.length,storage:saved.storage});
  assert.deepEqual(saved.model,accepted.model,'native side-mark model persists');
  assert.deepEqual(saved.record,accepted.record,'native Check record persists');
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();
  await btn.waitFor();const download=page.waitForEvent('download');
  await btn.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
   'true original State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or external requests');
  persist();
  console.log('P004H_PENTAGON_SIDE_TRACE_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
