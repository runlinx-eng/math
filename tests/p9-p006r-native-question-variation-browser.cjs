'use strict';
// #342 P006r: actual original B04 choices, wrong->correct Check snapshots.
// B04 DOES NOT persist individual field-change events: never claim it does.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p006r-native-question-variation');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const specs=[
 {id:'statquestions',index:1,node:'mt_iykH2P5oFq',
  hash:'1f654a820c65fc8586140e4977c599093e869fdc8ee54a1fdbb7265dd83f7bd3',
  variable:'sport',population:'group',answers:['足球','游泳']},
 {id:'statquestions',index:2,node:'mt_iykH2P5oFq',
  hash:'eb954fa3f8aead15a7e41265af49424e2dfb61a178e180c078069d32825a34a7',
  variable:'minutes',population:'self-days',answers:['10','20']}
];
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(condition,message)=>{assert.ok(condition,stage+': '+message);checks.push(stage+': '+message);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p006r-native-question-variation-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   fieldChangeEventLogObserved:false,actualSurveyObserved:false,
   freeProseMeaningAssessed:false},
  viewport:STANDARD_DESKTOP_VIEWPORT,nativeHashes,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006r-native-question-variation-evidence.js')).href);
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
    errors.push(stage+': external request '+r.url());
  });
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW release');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let i=0;i<10&&!(await loc.isVisible());i++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': hidden details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const choose=async(k,v)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+k+'"]');
   await reveal(loc);await loc.selectOption(v);
  };
  const check=async()=>page.locator('#actions [data-do="check"]').click();
  for(const s of specs){
   const position=s.id+':'+s.index,context={sessionId:s.id,index:s.index};
   const label='statquestions-'+s.index;
   stage=position+':source';
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#'+s.id);
   ok(nav?.fromServiceWorker()===true,'native B04 lesson opens from offline cache');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P006r requires clean original Check position '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:s.id,index:s.index});
   ok(prior===0,'no seeded original Check attempts');
   const reload=await page.reload();
   ok(reload?.fromServiceWorker()===true,'original B04 task reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:s.id,index:s.index});
   const hash=digest(original.task);
   console.log('P006R_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,nodeId:original.nodeId,sha256:hash});
   ok(original.nodeId===s.node&&hash===s.hash&&
    original.task.type==='x-questionbuild'&&original.task.variable===s.variable,
    'actual runtime source/full SHA256/type/variable match');
   ok(candidate.nativeQuestionVariationBinding(original.task,context)?.position===position,
    'candidate binds exact original statistical-question position');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
    'original desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
    'no premature shared formal evidence adapter');
   stage=position+':original-wrong-check';
   await choose('population','one-once');
   await choose('variable',s.variable);
   await choose('expected','vary');
   await choose('answerA',s.answers[0]);await choose('answerB',s.answers[1]);
   await check();
   const wrong=await capture(page,out,label,{id:s.id,index:s.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    storage:wrong.storage});
   ok(wrong.attempts.length===1&&wrong.model.population==='one-once',
    'original wrong Check and answer selection stored');
   ok(!candidate.replayNativeQuestionVariation(original.task,wrong.model,context),
    'wrong observation unit rejected independently');
   stage=position+':original-correct-check';
   await choose('population',s.population);await check();
   const good=await capture(page,out,label,{id:s.id,index:s.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,
    storage:good.storage});
   ok(good.attempts.length===2&&good.model.population===s.population,
    'original second corrected Check snapshot stored');
   const graded=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const native=await import('./learning/phase4/b04-model.js');
    return native.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:good.model});
   ok(graded===true,'original B04 grader accepts corrected statistical choice');
   const proof=candidate.submittedNativeQuestionVariation(
    original.task,good.model,good.record,context);
   ok(proof?.kind==='b04-native-statistical-question-variation'&&
    proof.wrongToCorrectCheckRevisionObserved&&
    proof.onlyObservationUnitSelectionChangedBetweenChecks,
    'two actual original Check snapshots support bounded correction');
   ok(!proof.originalControlChangeEventLogObserved&&
    !proof.actualSurveyResponsesObserved&&!proof.freeTextMeaningAssessed&&
    !proof.strictAApproved,
    'no invented field history, survey or formal strict A');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.answerB='forged';
   ok(!candidate.submittedNativeQuestionVariation(original.task,good.model,stale,context)&&
    !candidate.replayNativeQuestionVariation(original.task,forged,context)&&
    !candidate.replayNativeQuestionVariation(original.task,good.model,
     {sessionId:s.id,index:0}),
    'stale Check, tampered data and wrong position all fail closed');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);
   stage=position+':State-v2-offline';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'correct task reloads without origin');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const saved=await capture(page,out,label,{id:s.id,index:s.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'original B04 model persisted exactly');
   assert.deepEqual(saved.record,good.record,'original Check records persisted exactly');
   ok(true,'original model and both Checks survive offline reload');
  }
  stage='original-State-v2-backup';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const downloading=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await downloading).path()),backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'genuine original State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or off-origin fetches');
  persist();
  console.log('P006R_NATIVE_QUESTION_VARIATION_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:specs.length,checks:checks.length,strictAApproved:false
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
