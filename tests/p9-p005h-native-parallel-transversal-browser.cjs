'use strict';
// #342 P005h: true Chromium, original three B25 parallel-transversal positions.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-p005h-native-parallel');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'parallelangle',index:0,node:'mt_H_pNJ3ZI_S',
  hash:'cdbbc402bfcdd7e8593aa876f501b474fc69660ab61edce5e128fa3ca92ad28e'},
 {id:'parallelangle',index:1,node:'mt_H_pNJ3ZI_S',
  hash:'455479ecfd0c03dc7b71f9e935889928d0727461b2bcf2c2faa74990eeab8b08'},
 {id:'parallelangle',index:2,node:'mt_H_pNJ3ZI_S',
  hash:'74516eb7aa89d993be4b4c918e5aab4b1ccd7d7c08360714fb4b2596411d6fb9'}
];
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(v,msg)=>{assert.ok(v,stage+': '+msg);checks.push(stage+': '+msg);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p005h-native-parallel-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,originalControls:true,
   learnerProofAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p005h-native-parallel-transversal-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?
    {executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{
   if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
    errors.push(stage+': unexpected external request '+r.url());
  });
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW release identified');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': closed original details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const click=async action=>{
   const loc=page.locator('#extra-controls [data-x="g25-'+action+'"]');
   await reveal(loc);await loc.click();
  };
  const answer=async(i,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="answers.'+i+'"]');
   await reveal(loc);
   if(await loc.evaluate(e=>e.tagName.toLowerCase()==='select'))
    await loc.selectOption(String(value));
   else{await loc.fill(String(value));await loc.press('Tab');}
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  for(const spec of cases){
   const position=spec.id+':'+spec.index,label=spec.id+'-'+spec.index;
   const context={sessionId:spec.id,index:spec.index};
   stage=position+':source';
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#'+spec.id);
   ok(nav?.fromServiceWorker()===true,'original lesson opens offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=data.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P005h requires untouched native position '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:spec.id,index:spec.index});
   ok(prior===0,'original position has no preseeded Check');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'original native position reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:spec.id,index:spec.index});
   const hash=digest(original.task);
   console.log('P005H_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({sessionId:spec.id,index:spec.index,sha256:hash,nodeId:original.nodeId});
   ok(original.nodeId===spec.node&&hash===spec.hash&&
      original.task.type==='x-g25-parallel','full runtime SHA/source/native parallel control');
   ok(!!candidate.parallelBinding(original.task,context),
      'candidate binds exact original source only');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
      'standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
      'no unregistered strict-A feedback');
   stage=position+':wrong-check';
   await click('slide'); // original visual translational observation
   const slide=await capture(page,out,label,{id:spec.id,index:spec.index},'slide');
   ok(slide.model.board.slid===true&&slide.model.history.length===1,
      'single original g25-slide transition');
   const wrong=original.task.questions[0].options?'supplement':'71';
   for(let i=0;i<original.task.questions.length;i++)
    await answer(i,i===0?wrong:original.task.questions[i].value);
   await check();
   const rejected=await capture(page,out,label,{id:spec.id,index:spec.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:rejected.attempts.length,
    history:rejected.model.history.length,storage:rejected.storage});
   ok(rejected.attempts.length===1,'original wrong Check retained');
   const wrongGrade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b25-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:spec.id,index:spec.index,model:rejected.model});
   ok(wrongGrade===false,'original grader rejects wrong angle/relationship');
   ok(!candidate.replayParallelEvidence(original.task,rejected.model,context),
      'independent replay rejects wrong original answer');
   stage=position+':correct-check';
   await answer(0,original.task.questions[0].value);
   await check();
   const accepted=await capture(page,out,label,{id:spec.id,index:spec.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:accepted.attempts.length,
    history:accepted.model.history.length,storage:accepted.storage});
   ok(accepted.attempts.length===2,'wrong and corrected Checks both retained');
   const grade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b25-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:spec.id,index:spec.index,model:accepted.model});
   ok(grade===true,'original grader accepts corrected answer');
   const proof=candidate.submittedParallelEvidence(
    original.task,accepted.model,accepted.record,context);
   ok(proof?.kind==='native-parallel-transversal-relations'&&
    proof.originalSlideEvents.length===1&&
    Math.abs(proof.independentCorrespondingAngleDegrees-70)<1e-9&&
    Math.abs(proof.independentSameSideSupplementDegrees-110)<1e-9,
    'independent Euclidean equal/supplement relations with actual slide');
   const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
   const forged=structuredClone(accepted.model);forged.history[0].a='reset';
   ok(!candidate.submittedParallelEvidence(original.task,accepted.model,stale,context)&&
    !candidate.replayParallelEvidence(original.task,forged,context)&&
    !candidate.replayParallelEvidence(original.task,accepted.model,
      {sessionId:spec.id,index:999}),
    'reject stale Check/forged history/wrong original identity');
   ok(proof.strictAApproved===false&&!proof.verbalProofAssessed&&
    !proof.generalMasteryAssessed,'no strict-A or learner proof inferred');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected lesson reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const saved=await capture(page,out,label,{id:spec.id,index:spec.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,accepted.model,'original native model survives offline');
   assert.deepEqual(saved.record,accepted.record,'original Check history survives offline');
  }
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const dl=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await dl).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
     'original State-v2 export includes all three parallel positions');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or unexpected external requests');
  persist();
  console.log('P005H_NATIVE_PARALLEL_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:cases.length,checks:checks.length,strictAApproved:false
  }));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
