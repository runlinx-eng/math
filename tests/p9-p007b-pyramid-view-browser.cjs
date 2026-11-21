'use strict';
// #342 P007b: native pyramid-turn button, real Checks and raw State-v2/SW.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p007b-pyramid-view');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec={id:'shapedraw',index:5,node:'mt_vJUa62bxeR',
 hash:'fde74143edf21a92606e9f5c565cd883d0b714fb2d5cefd0ce18a4bde7727774'};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
let stage='startup';
const ok=(condition,label)=>{assert.ok(condition,stage+': '+label);checks.push(stage+': '+label);};
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p007b-native-pyramid-view-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,physicalRotationAssessed:false,
   cameraOrientationHistoryPersisted:false,childTrial:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p007b-pyramid-view-evidence.js')).href);
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
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let tries=0;tries<10&&!(await loc.isVisible());tries++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': one closed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const answer=async value=>{
   const select=page.locator('#extra-controls [data-xfield="answers.0"]');
   await reveal(select);await select.selectOption(value);
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  const taskContext={sessionId:spec.id,index:spec.index},position='shapedraw:5';
  stage='pyramid:original-native-navigation';
  await page.goto(origin.base+'v2.html#trail');
  const nav=await page.goto(origin.base+'learn.html#shapedraw');
  ok(nav?.fromServiceWorker()===true,'original lesson loaded via offline SW');
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
  const existing=await page.evaluate(async({id,index})=>{
   const {packText,unpackText}=await import('./storage.js');
   const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=data.lessons[id];
   if(!lesson||lesson.cases?.[index]?.attempts?.length)
    throw Error('P007b requires untouched original case');
   lesson.index=index;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
   return lesson.cases?.[index]?.attempts?.length||0;
  },spec);
  ok(existing===0,'untouched original task before Check attempts');
  const reload=await page.reload();
  ok(reload?.fromServiceWorker()===true,'chosen source reloaded offline');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
  const source=await page.evaluate(async({id,index})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
  },spec);
  const hash=digest(source.task);
  console.log('P007B_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
  nativeHashes.push({position,sha256:hash,nodeId:source.nodeId});
  ok(hash===spec.hash&&source.nodeId===spec.node&&
   source.task.type==='x-s23-frame'&&source.task.mode==='view'&&
   source.task.solid==='pyramid','full source/task SHA and original view mode');
  ok(candidate.pyramidViewBinding(source.task,taskContext)?.strictAApproved===false,
   'independent original source-locked evidence contract');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
   'standard desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,
   'not registered as strict A feedback');
  stage='pyramid:no-turn';
  const before=await capture(page,out,'shapedraw-5',spec,'before-turn');
  captures.push({phase:'before-turn',attempts:before.attempts.length,turns:before.model.board.turns,
   storage:before.storage});
  const initialCheck=await page.evaluate(async({model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b23-model.js');
   return {valid:api.valid(sessionTaskFor('shapedraw',5),model),
    correct:api.inspect(sessionTaskFor('shapedraw',5),model).correct};
  },{model:{...before.model,answers:['pyramid']}});
  ok(initialCheck.valid&&initialCheck.correct===false&&
   candidate.replayPyramidViewEvidence(source.task,before.model,taskContext)===null,
   'answer without a real turn cannot satisfy original or independent replay');
  stage='pyramid:native-turn';
  const turn=page.locator('#extra-controls [data-x="turn-extra"]');
  await reveal(turn);await turn.click();
  const turned=await capture(page,out,'shapedraw-5',spec,'after-turn');
  captures.push({phase:'after-turn',turns:turned.model.board.turns,history:turned.model.history.length,
   storage:turned.storage});
  ok(turned.model.board.turns===1&&turned.model.history.length===1&&
   turned.model.history[0].a==='turn'&&turned.attempts.length===0,
   'one real UI turn button persisted as one original B23 turn event');
  stage='pyramid:wrong-original-Check';
  await answer('cube');await check();
  const wrong=await capture(page,out,'shapedraw-5',spec,'wrong-check');
  captures.push({phase:'wrong-check',attempts:wrong.attempts.length,storage:wrong.storage});
  const originalWrong=await page.evaluate(async({model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b23-model.js');
   return api.inspect(sessionTaskFor('shapedraw',5),model).correct;
  },{model:wrong.model});
  ok(wrong.attempts.length===1&&originalWrong===false&&
   candidate.replayPyramidViewEvidence(source.task,wrong.model,taskContext)===null,
   'wrong cube choice rejected by original Check and replay');
  stage='pyramid:correct-original-Check';
  await answer('pyramid');await check();
  const good=await capture(page,out,'shapedraw-5',spec,'correct-check');
  captures.push({phase:'correct-check',attempts:good.attempts.length,storage:good.storage});
  const originalRight=await page.evaluate(async({model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b23-model.js');
   const task=sessionTaskFor('shapedraw',5);
   return {valid:api.valid(task,model),correct:api.inspect(task,model).correct};
  },{model:good.model});
  ok(good.attempts.length===2&&originalRight.valid&&originalRight.correct,
   'correct pyramid choice passes actual latest original Check');
  const proof=candidate.submittedPyramidViewEvidence(
   source.task,good.model,good.record,taskContext);
  ok(proof?.kind==='native-pyramid-view-identity'&&proof.originalTurnEvents===1&&
   proof.originalCheckSnapshotsObserved===2&&proof.wrongToCorrectCheckRevisionObserved,
   'strict event and latest Check replay from original raw state');
  ok(proof.independentPyramidGeometry.vertices===5&&
   proof.independentPyramidGeometry.edges===8&&
   proof.independentPyramidGeometry.faces===5&&
   proof.independentPyramidGeometry.triangularSideFaces===4,
   'independent square pyramid topology 5 vertices / 8 edges / 5 faces');
  ok(!proof.cameraOrientationHistoryPersisted&&
   !proof.distinctViewingAnglesIndependentlyMeasured&&
   !proof.physicalModelRotationAssessed&&!proof.strictAApproved,
   'no unrecorded orientation or physical manipulation is claimed');
  const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
  const forged=structuredClone(good.model);forged.history[0].a='stick';
  ok(!candidate.submittedPyramidViewEvidence(source.task,good.model,stale,taskContext)&&
   !candidate.replayPyramidViewEvidence(source.task,forged,taskContext)&&
   !candidate.replayPyramidViewEvidence(source.task,good.model,
     {sessionId:'shapedraw',index:4}),
   'stale Check, fabricated turn and adjacent cube task rejected');
  const png='shapedraw-5-pyramid-correct.png';
  await page.screenshot({path:path.join(out,png),fullPage:false});
  screenshots.push(png);
  stage='pyramid:offline-reload';
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'correct native source reloads offline');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,5);
  const saved=await capture(page,out,'shapedraw-5',spec,'offline-reload');
  captures.push({phase:'offline-reload',attempts:saved.attempts.length,storage:saved.storage});
  assert.deepEqual(saved.model,good.model,'original model survives offline reload');
  assert.deepEqual(saved.record,good.record,'Check snapshots survive offline reload');
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const exportButton=page.locator('#main [data-do="export"]').first();
  await exportButton.waitFor();
  const download=page.waitForEvent('download');
  await exportButton.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
   'original State-v2 export, not a synthetic fixture');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser errors/external requests');
  persist();
  console.log('P007B_PYRAMID_VIEW_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
if(require.main===module)run().catch(e=>{
 console.error(e.stack||String(e));process.exitCode=1;
});
