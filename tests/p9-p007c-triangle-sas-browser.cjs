'use strict';
// #342 P007c: native SAS triangle ruler draw button, real Checks and raw State-v2/SW.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p007c-triangle-sas');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec={id:'shapemeasures',index:0,node:'mt_hdrMoiTgqu',
 hash:'07b7c68d5d254f6042b17f6ba7f18f850caad412da75f82ee00f01ca7f236e36'};
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
  schema:'math-p007c-native-triangle-sas-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,physicalRulerUseAssessed:false,
   fieldEditTimelinePersisted:false,childTrial:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p007c-triangle-sas-evidence.js')).href);
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
  const field=async(key,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+key+'"]');
   await reveal(loc);await loc.fill(String(value));
  };
  const draw=async()=>{
   const loc=page.locator('#extra-controls [data-x="g23-draw"]');
   await reveal(loc);await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  const taskContext={sessionId:spec.id,index:spec.index},position='shapemeasures:0';
  stage='sas:native-navigation';
  await page.goto(origin.base+'v2.html#trail');
  const nav=await page.goto(origin.base+'learn.html#shapemeasures');
  ok(nav?.fromServiceWorker()===true,'original lesson loaded via offline SW');
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
  const existing=await page.evaluate(async({id,index})=>{
   const {packText,unpackText}=await import('./storage.js');
   const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=data.lessons[id];
   if(!lesson||lesson.cases?.[index]?.attempts?.length)
    throw Error('P007c requires untouched original case');
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
  console.log('P007C_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
  nativeHashes.push({position,sha256:hash,nodeId:source.nodeId});
  ok(hash===spec.hash&&source.nodeId===spec.node&&
   source.task.type==='x-s23-ruler'&&source.task.mode==='triangle'&&
   JSON.stringify(source.task.target)==='[5,7,60]',
   'full source/task SHA and original SAS triangle mode');
  ok(candidate.triangleSasBinding(source.task,taskContext)?.strictAApproved===false,
   'independent original source-locked SAS contract');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'standard desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,
   'candidate not registered as strict A feedback');
  stage='sas:before-draw';
  const before=await capture(page,out,'shapemeasures-0',spec,'before-draw');
  captures.push({phase:'before-draw',attempts:before.attempts.length,storage:before.storage});
  ok(before.model.history.length===0&&before.model.board.drawing===null&&
   candidate.replayTriangleSasEvidence(source.task,before.model,taskContext)===null,
   'no constructed geometry before draw');
  stage='sas:wrong-dimension-draw';
  await field('first','4');await field('second','7');await field('angle','60');
  await draw();
  await field('answers.0','60');
  const wrongBefore=await capture(page,out,'shapemeasures-0',spec,'wrong-before-check');
  captures.push({phase:'wrong-before-check',storage:wrongBefore.storage});
  ok(wrongBefore.model.history.length===1&&wrongBefore.model.history[0].a==='draw'&&
   wrongBefore.model.board.drawing.first==='4'&&
   candidate.replayTriangleSasEvidence(source.task,wrongBefore.model,taskContext)===null,
   'original draw persists incorrect first side, independent replay rejects');
  await check();
  const wrong=await capture(page,out,'shapemeasures-0',spec,'wrong-check');
  captures.push({phase:'wrong-check',attempts:wrong.attempts.length,storage:wrong.storage});
  const originalWrong=await page.evaluate(async({model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b23-model.js');
   return api.inspect(sessionTaskFor('shapemeasures',0),model).correct;
  },{model:wrong.model});
  ok(wrong.attempts.length===1&&originalWrong===false,
   'wrong first side rejected by actual original Check');
  stage='sas:correct-dimension-redraw';
  await field('first','5');await draw();await check();
  const good=await capture(page,out,'shapemeasures-0',spec,'correct-check');
  captures.push({phase:'correct-check',attempts:good.attempts.length,storage:good.storage});
  const nativeCheck=await page.evaluate(async({model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const api=await import('./learning/phase5/b23-model.js');
   const task=sessionTaskFor('shapemeasures',0);
   return {valid:api.valid(task,model),correct:api.inspect(task,model).correct};
  },{model:good.model});
  ok(good.attempts.length===2&&nativeCheck.valid&&nativeCheck.correct,
   'latest corrected native drawing passes original Check');
  const proof=candidate.submittedTriangleSasEvidence(
   source.task,good.model,good.record,taskContext);
  ok(proof?.kind==='native-triangle-sas-drawing'&&
   proof.originalDrawEvents===2&&proof.wrongToCorrectDrawingRevisionObserved,
   'two original draw events and native wrong-to-correct Checks replay');
  ok(Math.abs(proof.independentGeometry.thirdSideCm-Math.sqrt(39))<1e-9&&
   Math.abs(proof.independentGeometry.areaSquareCm-35*Math.sqrt(3)/4)<1e-9,
   'independent cosine law and area verification');
  ok(!proof.actualRulerOrProtractorUseAssessed&&!proof.strictAApproved,
   'no invented physical tool evidence or formal A');
  const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
  const forged=structuredClone(good.model);forged.history[0].f.first='-1';
  ok(!candidate.submittedTriangleSasEvidence(source.task,good.model,stale,taskContext)&&
   !candidate.replayTriangleSasEvidence(source.task,forged,taskContext)&&
   !candidate.replayTriangleSasEvidence(source.task,good.model,
      {sessionId:'shapemeasures',index:1}),
   'stale Check, forged dimension and adjacent task rejected');
  const png='shapemeasures-0-sas-correct.png';
  await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
  stage='sas:offline-reload';
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'correct native source reloads offline');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,0);
  const saved=await capture(page,out,'shapemeasures-0',spec,'offline-reload');
  captures.push({phase:'offline-reload',attempts:saved.attempts.length,storage:saved.storage});
  assert.deepEqual(saved.model,good.model,'original geometry model survives offline reload');
  assert.deepEqual(saved.record,good.record,'native Check snapshots survive offline reload');
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const exportButton=page.locator('#main [data-do="export"]').first();
  await exportButton.waitFor();
  const download=page.waitForEvent('download');await exportButton.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
   'original State-v2 export, not a synthetic fixture');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser errors/external requests');
  persist();
  console.log('P007C_SAS_DRAWING_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
