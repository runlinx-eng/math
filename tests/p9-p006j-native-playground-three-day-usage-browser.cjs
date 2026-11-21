'use strict';
// #342 / P006j native original B19 studio UI, correction, offline state-v2 and backup.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-p006j-native-playground-three-day-usage');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'playgroundstudy',index:0,node:'mt_kxeuXm6EyC',
  hash:'HASH_PENDING_NATIVE_PREFLIGHT',counts:[6,4,2],rows:12}
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
  schema:'math-p006j-native-playground-three-day-usage-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   actualRespondentsObserved:false,uniquePeopleCountInferable:false,freeProseMeaningAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006j-native-playground-three-day-usage-evidence.js')).href);
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
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW release');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': exactly one original visible control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': hidden details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const field=async(k,v)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+k+'"]');
   await reveal(loc);
   if((await loc.evaluate(e=>e.tagName))==='SELECT')await loc.selectOption(String(v));
   else await loc.fill(String(v));
  };
  const action=async(k,data={})=>{
   const selector='#extra-controls [data-x="b19-'+k+'"]'+
    Object.entries(data).map(([name,value])=>'[data-'+name+'="'+value+'"]').join('');
   const loc=page.locator(selector);await reveal(loc);await loc.click();
  };
  const doStep=async s=>{
   if(s.field)await field(s.field,s.value);
   else if(s.action)await action(s.action.slice(4),s.data||{});
  };
  const check=async()=>page.locator('#actions [data-do="check"]').click();
  for(const s of cases){
   const position=s.id+':'+s.index,label=s.id+'-'+s.index,context={sessionId:s.id,index:s.index};
   stage=position+':original-source';
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#'+s.id);
   ok(nav?.fromServiceWorker()===true,'original playground lesson opens offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P006j requires untouched original position '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:s.id,index:s.index});
   ok(prior===0,'no seeded native attempt');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'original playground studio reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:s.id,index:s.index});
   const hash=digest(original.task);
   console.log('P006J_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,nodeId:original.nodeId,sha256:hash});
   ok(original.nodeId===s.node&&original.task.type==='x-datastudio',
    'exact full runtime SHA and native B19 source');
   ok(candidate.nativeThreeDayUsageBinding(original.task,context)?.recordCount===s.rows,
    'source-locked simulated row contract');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'original desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,'no premature shared registry');
   const native=await import(pathToFileURL(path.join(root,'dist/learning/phase5/b19-model.js')).href);
   const steps=native.solveSteps(original.task);
   stage=position+':native-wrong-first-plan';
   await field('questions.0','lead');
   await field('scope','defined');
   await field('reason','consistent');
   await action('plan');
   await check();
   const wrong=await capture(page,out,label,{id:s.id,index:s.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    events:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'original wrong Check saved');
   ok(wrong.model.board.stage===0&&!!wrong.model.issue,'biased plan does not begin recording');
   ok(!candidate.replayNativeThreeDayUsage(original.task,wrong.model,context),
    'independent math refuses wrong question');
   stage=position+':native-corrected-record-table-plot-report';
   await field('questions.0','clear');
   await action('plan');
   // The wrong-to-correct native plan was already completed through real UI.
   // Do not replay its stage-zero fields after the B19 view advances to recording.
   let passedInitialPlan=false;
   for(const step of steps){
    if(!passedInitialPlan){if(step.action==='b19-plan')passedInitialPlan=true;continue;}
    await doStep(step);
   }
   ok(passedInitialPlan,'canonical native recipe starts with plan stage');
   await check();
   const good=await capture(page,out,label,{id:s.id,index:s.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,
    events:good.model.history.length,storage:good.storage});
   ok(good.attempts.length===2,'wrong then correct original Check retained');
   const grade=native.inspect(original.task,good.model);
   ok(grade.correct===true,'original B19 grader accepts real row work');
   const proof=candidate.submittedNativeThreeDayUsage(original.task,good.model,good.record,context);
   ok(proof?.kind==='b19-native-three-day-usage-frequency'&&
    proof.wrongQuestionThenCorrectionObserved===true&&
    proof.observedOriginalRecordClicks===s.rows,'independent exact event replay');
   ok(JSON.stringify(proof.independentFrequencyCounts)===JSON.stringify(s.counts)&&
    proof.frequencyTotal===s.rows&&proof.observedBoundedReport&&
    !proof.actualRespondentsObserved&&!proof.uniquePeopleCountInferable&&!proof.strictAApproved,
    'independent three-day usage frequency and bounded claim');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.history[2].f.entry[0]='forged';
   ok(!candidate.submittedNativeThreeDayUsage(original.task,good.model,stale,context)&&
    !candidate.replayNativeThreeDayUsage(original.task,forged,context)&&
    !candidate.replayNativeThreeDayUsage(original.task,good.model,{sessionId:s.id,index:s.index+1}),
    'stale Check, forged row and wrong source rejected');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   stage=position+':state-v2-offline';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected original playground studio reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const saved=await capture(page,out,label,{id:s.id,index:s.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    events:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'original native model retained');
   assert.deepEqual(saved.record,good.record,'original Check record retained');
  }
  stage='original-state-v2-backup';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const wait=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await wait).path()),backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original genuine State-v2 backup');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no JS errors or external URLs');
  persist();
  console.log('P006J_NATIVE_THREE_DAY_USAGE_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
