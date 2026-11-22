'use strict';
// #342 / P003: original Chromium evidence plus exact formal-source feedback.
// Uses original B17 controls, actual Check, offline SW, and State-v2 record bytes.
// Former candidate semantics remain checked; current release binds only source proof.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p003-rulejump-equivalent');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec={id:'percentpatterns',index:0};
const expectedTaskSha='860ef4c64b8993c38591ccf90ddf032c3e9aaa789f8a10e459b2362757436fce';
const checks=[],errors=[],captures=[],screenshots=[];
let stage='startup';
const ok=(condition,message)=>{
 assert.ok(condition,stage+': '+message);
 checks.push(stage+': '+message);
};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p003-rulejump-candidate-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,testedCheckoutSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,originalControls:true,seededCorrectWork:false,
   strictAApproved:true,childTrial:false,learnerMasteryAssessed:false},
  native:{...spec,taskSha256:expectedTaskSha},viewport:STANDARD_DESKTOP_VIEWPORT,
  checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,'dist/learning/p003-rulejump-equivalent-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',request=>{
   if(/^https?:/.test(request.url())&&!request.url().startsWith(origin.base))
    errors.push(stage+': external request '+request.url());
  });
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'current SW cache release identified');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  stage='native-lesson';
  const firstResponse=await page.goto(origin.base+'learn.html#'+spec.id);
  ok(firstResponse?.fromServiceWorker()===true,'lesson actually loaded via offline SW');
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
  const originalAttempts=await page.evaluate(async ({id,index})=>{
   const {packText,unpackText}=await import('./storage.js');
   const raw=localStorage.getItem('math-explorer-v2');
   const state=JSON.parse(unpackText(raw));
   const lesson=state.lessons[id];
   if(!lesson||lesson.cases?.[index]?.attempts?.length)
    throw Error('P003 target must be an unsubmitted native lesson');
   lesson.index=index;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
   return lesson.cases[index]?.attempts?.length||0;
  },spec);
  ok(originalAttempts===0,'only native lesson index selected; no answer injected');
  const secondResponse=await page.reload();
  ok(secondResponse?.fromServiceWorker()===true,'native task reloaded offline');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
  const native=await page.evaluate(async({id,index})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
  },spec);
  ok(native.nodeId==='mt_jCy07DyBNU','native source node matches P003');
  ok(native.task.type==='x-rulejump'&&native.task.a===25&&native.task.b===0,
   'original rulejump task parameters');
  ok(JSON.stringify(native.task.inputs)===JSON.stringify([4,7,16]),
   'all three original inputs are fixed');
  ok(digest(native.task)===expectedTaskSha,'runtime complete native task SHA256');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
   'real desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,'unsubmitted original lesson has no strict feedback');
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let tries=0;tries<10&&!(await loc.isVisible());tries++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': one collapsed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const fill=async(name,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+name+'"]');
   await reveal(loc);
   if(await loc.evaluate(e=>e.tagName)==='SELECT')await loc.selectOption(String(value));
   else await loc.fill(String(value));
  };
  const act=async(name)=>{
   const loc=page.locator('#extra-controls [data-x="b17-'+name+'"]');
   await reveal(loc);
   await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  const snap=async(phase)=>{
   stage='percentpatterns:0:'+phase;
   const r=await capture(page,out,'percentpatterns-0',spec,phase);
   captures.push({phase,historyLength:r.model?.history?.length,attempts:r.attempts?.length,
    storage:r.storage});
   return r;
  };
  stage='incomplete-alternative';
  await fill('multiplier','25');
  await fill('offset','0');
  await fill('divisor','1');
  await act('rule');
  await fill('n','4');await fill('answer','100');await act('run');
  await check();
  const incomplete=await snap('incomplete-check');
  ok(incomplete.attempts.length===1,'one incomplete original Check recorded');
  const statusIncomplete=await page.evaluate(async m=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const original=await import('./learning/phase5/b17-model.js');
   return original.inspect(sessionTaskFor('percentpatterns',0),m).correct;
  },incomplete.model);
  ok(statusIncomplete===false,'original grader correctly rejects incomplete run set');
  stage='complete-alternative';
  for(const n of [7,16]){
   await fill('n',String(n));await fill('answer',String(25*n));await act('run');
  }
  await check();
  const alternate=await snap('alternative-check');
  ok(alternate.attempts.length===2,'alternative Check retained after incomplete one');
  // Original grading remains in Chromium; strict candidate validation uses
  // the genuine captured native task and model in Node.
  const nativeCorrect=await page.evaluate(async m=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const original=await import('./learning/phase5/b17-model.js');
   return original.inspect(sessionTaskFor('percentpatterns',0),m).correct;
  },alternate.model);
  const alternateProof={nativeCorrect,
   candidate:candidate.replayRulejumpEquivalentEvidence(native.task,alternate.model,
    {sessionId:spec.id,index:spec.index})};
  ok(alternateProof.nativeCorrect===true,'original grader allows equivalent times-25 rule');
  ok(alternateProof.candidate===null,'candidate rejects an unobserved times-100 / divide-4 method');
  ok(await page.locator('#thinking-feedback').count()===0,'native-correct alternate strategy is not falsely strict-A supported');
  stage='canonical-correction';
  await fill('multiplier','100');await fill('offset','0');await fill('divisor','4');
  await act('rule');
  for(const n of [4,7,16]){
   await fill('n',String(n));await fill('answer',String(25*n));await act('run');
  }
  await check();
  const accepted=await snap('canonical-check');
  ok(accepted.attempts.length===3,'incomplete, alternative, and canonical Checks preserved');
  const context={sessionId:spec.id,index:spec.index};
  const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
  const forged=structuredClone(accepted.model);
  forged.history[0].a='run';
  const proof={
   done:candidate.submittedRulejumpEquivalentEvidence(native.task,accepted.model,accepted.record,context),
   staleAccepted:!!candidate.submittedRulejumpEquivalentEvidence(native.task,accepted.model,stale,context),
   forgedAccepted:!!candidate.replayRulejumpEquivalentEvidence(native.task,forged,context),
   otherIndexAccepted:!!candidate.replayRulejumpEquivalentEvidence(native.task,accepted.model,
    {sessionId:'percentpatterns',index:1})
  };
  ok(proof.done?.kind==='rulejump-times100-divide4','latest genuine Check binds exact P003 proof');
  ok(JSON.stringify(proof.done?.canonicalRuns.map(x=>x.thenDivideBy4))===JSON.stringify([100,175,400]),
   'three mathematically independent expected results');
  ok(JSON.stringify(proof.done?.observedFirstRule)===JSON.stringify(['25','0','1'])&&
   proof.done.firstRuleNecessarilyCanonical===false,'alternative first strategy is not misreported');
  ok(proof.done.mentalCalculationOrderObserved===false&&proof.done.learnerMasteryAssessed===false,
   'does not claim hidden mental strategy or learning mastery');
  ok(!proof.staleAccepted&&!proof.forgedAccepted&&!proof.otherIndexAccepted,
   'reject stale Check, forged event, and other source position');
  ok(await page.locator('#thinking-feedback').isVisible(),'canonical source-bound Check earns strict feedback');
  await page.screenshot({path:path.join(out,'canonical-correct.png'),fullPage:false});
  screenshots.push('canonical-correct.png');
  stage='offline-reload';
  const reload=await page.reload();
  ok(reload?.fromServiceWorker()===true,'original lesson reload came from offline SW');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
  const recovered=await snap('offline-reload');
  assert.deepEqual(recovered.model,accepted.model,'native model persists exactly');
  assert.deepEqual(recovered.record,accepted.record,'native Check history persists exactly');
  ok(true,'original State-v2 model and all attempts survived offline reload');
  stage='native-backup';
  await page.goto(origin.base+'v2.html#trail');
  const exportControl=page.locator('#main [data-do="export"]').first();
  await exportControl.waitFor();
  const download=page.waitForEvent('download');
  await exportControl.click();
  const originalFile=await download;
  const bytes=fs.readFileSync(await originalFile.path());
  const backup=JSON.parse(bytes.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'real original State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),bytes);
  ok(errors.length===0,'no browser exceptions or external requests');
  persist();
  console.log('P003_RULEJUMP_EQUIVALENT_CANDIDATE_BROWSER_OK '+JSON.stringify({
   sha,checks:checks.length,sourceSha:expectedTaskSha,strictAApproved:true}));
 }catch(error){
  errors.push(stage+': '+String(error));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(error.stack||String(error));process.exitCode=1;
 }finally{
  await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
