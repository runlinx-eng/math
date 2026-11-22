'use strict';
// #342 P006a: original native B19 clicks, wrong -> corrected Check, offline State-v2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p006a-category-frequency-count');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const id='categoryuse',index=0,ctx={sessionId:id,index};
const taskSha='945aa122537d0193ef311aadb9b1d47bd5c3bbe22f472c19163977e69b117fbe';
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[];
const ok=(condition,description)=>{assert.ok(condition,stage+': '+description);checks.push(stage+': '+description);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p006a-native-frequency-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,runId:process.env.GITHUB_RUN_ID||null,
   strictAApproved:false,actualChildrenSurveyed:false,statisticalInferenceAssessed:false},
  originalPosition:'categoryuse:0',taskSha,viewport:STANDARD_DESKTOP_VIEWPORT,
  checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006a-category-frequency-count-evidence.js')).href);
 let origin,browser,browserCtx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  browserCtx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await browserCtx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  browserCtx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW version exists');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  stage='native-offline-navigation';
  const nav=await page.goto(origin.base+'learn.html#'+id);
  ok(nav?.fromServiceWorker()===true,'original native lesson offline');
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,id);
  const prior=await page.evaluate(async({id,index})=>{
   const {packText,unpackText}=await import('./storage.js');
   const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=state.lessons[id];
   if(!lesson||lesson.cases?.[index]?.attempts?.length)
    throw Error('P006a original position already has a Check');
   lesson.index=index;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
   return lesson.cases?.[index]?.attempts?.length||0;
  },{id,index});
  ok(prior===0,'no seeded old Check');
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'native source reloads with origin stopped');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,index);
  const original=await page.evaluate(async({id,index})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
  },{id,index});
  console.log('P006A_NATIVE_FULL_TASK_SHA256 categoryuse:0 '+digest(original.task));
  ok(original.nodeId==='mt_1VSfm9yiLn'&&
     digest(original.task)===taskSha&&original.task.type==='x-datacount',
     'exact original source, task and SHA256');
  ok(!!candidate.categoryFrequencyBinding(original.task,ctx),'source-bound evidence module');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 original viewport');
  ok(await page.locator('#thinking-feedback').count()===0,'no premature shared registry');
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const p=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await p.count(),1,stage+': hidden details ancestor');
    await p.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const click=async selector=>{const loc=page.locator(selector);await reveal(loc);await loc.click();};
  const field=async(key,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+key+'"]');
   await reveal(loc);await loc.fill(String(value));await loc.press('Tab');
  };
  stage='original-nine-frequency-increments';
  for(const [index,count] of [4,3,2].entries()){
   for(let n=0;n<count;n++)
    await click('#extra-controls [data-x="b19-bar"][data-index="'+index+'"][data-delta="1"]');
  }
  await field('gap',1);
  stage='wrong-original-check';
  await field('total',8);
  await click('#actions [data-do="check"]');
  const wrong=await capture(page,out,'categoryuse-0',{id,index},'wrong-check');
  captures.push({phase:'wrong-check',attempts:wrong.attempts.length,events:wrong.model.history.length,storage:wrong.storage});
  ok(wrong.attempts.length===1,'wrong original Check recorded');
  ok(!candidate.replayCategoryFrequencyEvidence(original.task,wrong.model,ctx),
     'wrong total rejected independently');
  stage='corrected-original-check';
  await field('total',9);
  await click('#actions [data-do="check"]');
  const good=await capture(page,out,'categoryuse-0',{id,index},'correct-check');
  captures.push({phase:'correct-check',attempts:good.attempts.length,events:good.model.history.length,storage:good.storage});
  ok(good.attempts.length===2,'wrong and corrected original Checks retained');
  const originalPass=await page.evaluate(async({id,index,model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const native=await import('./learning/phase5/b19-model.js');
   return native.inspect(sessionTaskFor(id,index),model).correct;
  },{id,index,model:good.model});
  ok(originalPass===true,'original native B19 grader accepts corrected histogram');
  const proof=candidate.submittedCategoryFrequencyEvidence(original.task,good.model,good.record,ctx);
  ok(proof?.kind==='b19-original-simulated-frequency-tally'&&
     proof.independentlyCountedTotal===9&&proof.independentCategoryDifference===1,
     'original click replay, independent frequency totals and difference');
  ok(proof.independentFrequencies.join(',')==='4,3,2'&&
     !proof.actualChildrenSurveyed&&!proof.strictAApproved,'no real survey or strict A claim');
  const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
  const fake=structuredClone(good.model);fake.history[0].d.delta='-1';
  ok(!candidate.submittedCategoryFrequencyEvidence(original.task,good.model,stale,ctx)&&
     !candidate.replayCategoryFrequencyEvidence(original.task,fake,ctx)&&
     !candidate.replayCategoryFrequencyEvidence(original.task,good.model,{sessionId:id,index:1}),
     'stale original Check, forged history and wrong source fail closed');
  await page.screenshot({path:path.join(out,'categoryuse-0-correct.png'),fullPage:false});
  screenshots.push('categoryuse-0-correct.png');
  stage='native-state-v2-offline-reload';
  const reload=await page.reload();
  ok(reload?.fromServiceWorker()===true,'original B19 task reloads offline');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,index);
  const saved=await capture(page,out,'categoryuse-0',{id,index},'offline-reload');
  captures.push({phase:'offline-reload',attempts:saved.attempts.length,events:saved.model.history.length,storage:saved.storage});
  assert.deepEqual(saved.model,good.model,'original model persisted');
  assert.deepEqual(saved.record,good.record,'original Check history persisted');
  stage='original-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const download=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'native State-v2 backup exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no page errors or external requests');
  persist();
  console.log('P006A_NATIVE_FREQUENCY_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:1,checks:checks.length,strictAApproved:false
  }));
 }catch(error){
  errors.push(stage+': '+String(error));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(error.stack||String(error));process.exitCode=1;
 }finally{
  await browserCtx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
