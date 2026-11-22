'use strict';
// #342 P006s: original simulated survey buttons, two actual Check snapshots.
// Native survey stores aggregate seen/counts, NOT per-observation click history.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p006s-native-survey-frequency');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const specs=[
 {id:'survey',index:0,node:'mt_ebQURBOsM5',
  hash:'b408662903dcf4427dbd62cde33a67aed44713215040dfe2e1a315ed6d040712',
  order:[1,0,2,0,1,0,2,1,0],counts:[4,3,2],mode:0},
 {id:'survey',index:1,node:'mt_ebQURBOsM5',
  hash:'62e70fbba828146520ab23b8f3e59738ddde922ff980cc3b79af83e2ce892595',
  order:[1,2,0,1,3,2,1,0,2,1],counts:[2,4,3,1],mode:1}
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
  schema:'math-p006s-native-survey-frequency-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalObservationEventHistoryAvailable:false,actualSurveyObserved:false},
  viewport:STANDARD_DESKTOP_VIEWPORT,nativeHashes,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006s-native-survey-frequency-evidence.js')).href);
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
  const check=async()=>page.locator('#actions [data-do="check"]').click();
  for(const s of specs){
   const position=s.id+':'+s.index,context={sessionId:s.id,index:s.index};
   const label='survey-'+s.index;
   stage=position+':source';
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#'+s.id);
   ok(nav?.fromServiceWorker()===true,'original lesson opens offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P006s requires clean original Check '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:s.id,index:s.index});
   ok(prior===0,'no invented or seeded original attempts');
   const reload=await page.reload();
   ok(reload?.fromServiceWorker()===true,'native survey opens from SW offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:s.id,index:s.index});
   const hash=digest(original.task);nativeHashes.push({position,nodeId:original.nodeId,sha256:hash});
   console.log('P006S_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   ok(original.nodeId===s.node&&hash===s.hash&&original.task.type==='survey',
    'real original node, full task SHA and type match');
   ok(candidate.nativeSurveyFrequencyBinding(original.task,context)?.position===position,
    'candidate matches original runtime task');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
    'native desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
    'no shared formal adapter prematurely registered');
   stage=position+':actual-observe-count-buttons';
   const seenCounts=s.counts.map(()=>0);
   for(let i=0;i<s.order.length;i++){
    await page.locator('#work [data-do="observe"]').click();
    const value=s.order[i];seenCounts[value]++;
    if(i===s.order.length-1&&value===s.mode){
     // Leave the unique highest-frequency category one tally mark short
     // for an authentic wrong->correct original Check pair.
    }else{
     await page.locator('#work [data-do="count"][data-row="'+value+'"][data-delta="1"]').click();
    }
    ok(await page.locator('#work .observe-card').innerText().then(t=>t.includes(String(i+1))),
     'original observed counter progressed to '+(i+1));
   }
   ok(JSON.stringify(seenCounts)===JSON.stringify(s.counts),
    'actual native observation order recount matches original task');
   await page.locator('#work [data-field="choice"]').selectOption(String(s.mode));
   await check();
   const wrong=await capture(page,out,label,{id:s.id,index:s.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    storage:wrong.storage});
   ok(wrong.attempts.length===1&&wrong.model.seen===s.order.length,
    'first genuine Check stores all observations and incomplete tally');
   ok(wrong.model.counts[s.mode]===s.counts[s.mode]-1&&
    candidate.replayNativeSurveyFrequency(original.task,wrong.model,context)===null,
    'independent replay rejects one missing category tally');
   stage=position+':correct-tally-and-Check';
   await page.locator('#work [data-do="count"][data-row="'+s.mode+'"][data-delta="1"]').click();
   await check();
   const good=await capture(page,out,label,{id:s.id,index:s.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,
    storage:good.storage});
   ok(good.attempts.length===2&&good.model.seen===s.order.length&&
    JSON.stringify(good.model.counts)===JSON.stringify(s.counts),
    'second genuine Check stores corrected complete category frequencies');
   const graded=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {inspect}=await import('./learning/tasks.js');
    return inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:good.model});
   ok(graded===true,'original native survey grader accepts corrected tally');
   const proof=candidate.submittedNativeSurveyFrequency(
    original.task,good.model,good.record,context);
   ok(proof?.kind==='native-simulated-survey-frequency'&&
    proof.wrongToCorrectCheckRevisionObserved&&
    proof.singleSavedFrequencyRevisionObserved,
    'two original Check snapshots support only bounded corrected total');
   ok(!proof.originalObservationEventHistoryAvailable&&
    !proof.individualCountButtonHistoryAvailable&&
    !proof.realSurveyRespondentsObserved&&
    !proof.childIndependentCountingProcessVerified&&
    !proof.strictAApproved,
    'do not invent individual action logs, respondents or strict A');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.counts[s.mode]++;
   ok(!candidate.submittedNativeSurveyFrequency(original.task,good.model,stale,context)&&
    !candidate.replayNativeSurveyFrequency(original.task,forged,context)&&
    !candidate.replayNativeSurveyFrequency(original.task,good.model,
     {sessionId:'survey',index:2}),
    'stale Check, forged count and wrong source fail closed');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);
   stage=position+':State-v2-offline';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'saved task reloads without origin');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const saved=await capture(page,out,label,{id:s.id,index:s.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'original model persists exactly');
   assert.deepEqual(saved.record,good.record,'original Check snapshots persist exactly');
   ok(true,'model and both genuine Checks survive offline reload');
  }
  stage='original-State-v2-backup';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const downloading=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await downloading).path()),backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'genuine native State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or off-origin fetches');
  persist();
  console.log('P006S_NATIVE_SURVEY_FREQUENCY_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
