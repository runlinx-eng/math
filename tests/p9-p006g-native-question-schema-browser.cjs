'use strict';
// #342 P006g: original B19 plan clicks, wrong-to-correct, State-v2 offline replay.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p006g-native-question-schema');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'digitalstudy',index:1,node:'mt_yrvYKSwSRZ',
  hash:'8a6ab9dade6db9c69df3522079c61190e5fddba7940162181553db02d582dc53',
  correct:['neutral','cover'],wrong:'lead'},
 {id:'ownstudy',index:1,node:'mt_Y6JmLjnfRP',
  hash:'24d52fec334e5c24456dbbcdfddeba1a645863b650bee50527c68fec6fe8eedb',
  correct:['clear','one','one'],wrong:'vague'}
];
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(condition,msg)=>{assert.ok(condition,stage+': '+msg);checks.push(stage+': '+msg);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p006g-native-question-schema-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   realRespondentsObserved:false,freeProseMeaningAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006g-native-question-schema-evidence.js')).href);
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
  ok(!!release,'native SW release');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': hidden details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const choose=async(index,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="answers.'+index+'"]');
   await reveal(loc);await loc.selectOption(value);
  };
  const click=async selector=>{
   const loc=page.locator(selector);await reveal(loc);await loc.click();
  };
  for(const s of cases){
   const position=s.id+':'+s.index,label=s.id+'-'+s.index;
   const context={sessionId:s.id,index:s.index};
   stage=position+':original-source';
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#'+s.id);
   ok(nav?.fromServiceWorker()===true,'original lesson opens offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
      throw Error('P006g requires untouched original position '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:s.id,index:s.index});
   ok(prior===0,'no seeded old native Check');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'native plan task reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:s.id,index:s.index});
   const hash=digest(original.task);
   console.log('P006G_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,nodeId:original.nodeId,sha256:hash});
   ok(original.nodeId===s.node&&hash===s.hash&&original.task.type==='x-dataplan',
    'runtime full SHA/source/original plan view');
   ok(candidate.nativeQuestionSchemaBinding(original.task,context)?.position===position,
    'locked original question-schema task');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 viewport');
   ok(await page.locator('#thinking-feedback').count()===0,'no premature shared registry');
   stage=position+':original-invalid-plan';
   for(let i=0;i<s.correct.length;i++)await choose(i,i===0?s.wrong:s.correct[i]);
   await click('#extra-controls [data-x="b19-plan"]');
   await click('#actions [data-do="check"]');
   const wrong=await capture(page,out,label,{id:s.id,index:s.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    events:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'original incorrect plan Check saved');
   ok(!candidate.replayNativeQuestionSchema(original.task,wrong.model,context),
    'independent plan replay refuses wrong selection');
   stage=position+':corrected-original-plan';
   await choose(0,s.correct[0]);
   await click('#extra-controls [data-x="b19-plan"]');
   await click('#actions [data-do="check"]');
   const good=await capture(page,out,label,{id:s.id,index:s.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,
    events:good.model.history.length,storage:good.storage});
   ok(good.attempts.length===2,'original wrong then correct Check history');
   const grade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const native=await import('./learning/phase5/b19-model.js');
    return native.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:good.model});
   ok(grade===true,'native grader accepts corrected plan');
   const proof=candidate.submittedNativeQuestionSchema(original.task,good.model,good.record,context);
   ok(proof?.kind==='b19-native-question-schema-plan'&&
    proof.wrongPlanThenCorrectionObserved===true&&proof.observedPlanClickEvents===2,
    'independent original question-schema event replay');
   ok(proof.observedFinalChoices.join(',')===s.correct.join(',')&&
    !proof.strictAApproved&&!proof.recordedSurveyResponsesObserved&&!proof.representativenessVerified,
    'observable choice sequence only; no real respondents/strict-A claim');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.history[0].f.answers[0]='forged';
   ok(!candidate.submittedNativeQuestionSchema(original.task,good.model,stale,context)&&
    !candidate.replayNativeQuestionSchema(original.task,forged,context)&&
    !candidate.replayNativeQuestionSchema(original.task,good.model,{sessionId:s.id,index:s.index+9}),
    'stale Check, forged history and wrong source reject');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   stage=position+':native-state-v2-offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected original plan reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const saved=await capture(page,out,label,{id:s.id,index:s.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    events:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'native plan model persisted');
   assert.deepEqual(saved.record,good.record,'original wrong and correct Check records persisted');
  }
  stage='original-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const download=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'real original State-v2 backup');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no JS exceptions or off-origin requests');
  persist();
  console.log('P006G_NATIVE_QUESTION_SCHEMA_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
