'use strict';
// #342 / P004e original Chromium UI: four native positions, actual Check,
// wrong -> correct, offline Service Worker, persisted State-v2, true export.
// Candidate replay runs in Node, not through an unregistered offline SW import.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p004e-regular-polygon-conditions');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const specs=[
 {id:'regularity',index:0,node:'mt_8H2kO4k2B9',shape:'pentagon',classes:[5],answers:['5','equal'],regular:true},
 {id:'regularity',index:1,node:'mt_8H2kO4k2B9',shape:'square',classes:[0,1,2,3,4,5],answers:['yes'],regular:true},
 {id:'regularity',index:2,node:'mt_8H2kO4k2B9',shape:'rectangle',classes:[0,1,2],answers:['irregular'],regular:false},
 {id:'regularity',index:3,node:'mt_8H2kO4k2B9',shape:'rhombus',classes:[0,1,3],answers:['irregular'],regular:false}
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
  schema:'math-p004e-regular-polygon-conditions-browser/1',
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
  'dist/learning/p004e-regular-polygon-conditions-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?
    {executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',
   serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{
   if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
    errors.push(stage+': unexpected external request '+r.url());
  });
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'native release cache identified');
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
   assert.ok(await loc.isVisible(),stage+': control visible');
  };
  const click=async(action,index)=>{
   const loc=page.locator('#extra-controls [data-x="g23-'+action+'"][data-index="'+index+'"]');
   await reveal(loc);await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  for(const s of specs){
   stage=s.id+':'+s.index+':native-start';
   // Force a real document navigation even when two cases share one lesson URL.
   // A same-document hash navigation may return null rather than a SW Response.
   await page.goto(origin.base+'v2.html#trail');
   const response=await page.goto(origin.base+'learn.html#'+s.id);
   ok(response?.fromServiceWorker()===true,'offline SW lesson navigation');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
   const existing=await page.evaluate(async ({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const raw=localStorage.getItem('math-explorer-v2');
    const data=JSON.parse(unpackText(raw));
    const lesson=data.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P004e requires untouched native target');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases[index]?.attempts?.length||0;
   },s);
   ok(existing===0,'native case not answered or seeded');
   const reload=await page.reload();
   ok(reload?.fromServiceWorker()===true,'selected task truly reloaded offline');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
   const native=await page.evaluate(async ({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },s);
   const taskSha=digest(native.task);
   console.log('P004E_NATIVE_FULL_TASK_SHA256 '+s.id+':'+s.index+' '+taskSha);
   nativeHashes.push({sessionId:s.id,index:s.index,sha256:taskSha,nodeId:native.nodeId});
   ok(native.nodeId===s.node&&native.task.type==='x-s23-quad'&&
    native.task.shape===s.shape,'precise native source and task type');
   ok(!!candidate.regularPolygonConditionsBinding(native.task,
    {sessionId:s.id,index:s.index}),'native source is bound to candidate');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
    'standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
    'unregistered candidate cannot show strict-A feedback');
   stage=s.id+':'+s.index+':native-tests';
   for(let i=0;i<3;i++)await click('test',i);
   await click('class',0);
   for(const [i,q] of native.task.questions.entries()){
    const answer=page.locator('#extra-controls [data-xfield="answers.'+i+'"]');
    await reveal(answer);
    if(q.options)await answer.selectOption(s.answers[i]);
    else await answer.fill(s.answers[i]);
   }
   await check();
   const first=await capture(page,out,s.id+'-'+s.index,s,'wrong-check');
   captures.push({position:s.id+':'+s.index,phase:'wrong-check',
    attempts:first.attempts.length,history:first.model.history.length,storage:first.storage});
   ok(first.attempts.length===1,'native wrong Check retained');
   const wrong=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const modelApi=await import('./learning/phase5/b23-model.js');
    return modelApi.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:first.model});
   ok(wrong===false,'original grader rejects incomplete family membership');
   ok(candidate.replayRegularPolygonConditionsEvidence(native.task,first.model,
    {sessionId:s.id,index:s.index})===null,'candidate refuses missing classification');
   stage=s.id+':'+s.index+':corrected-check';
   if(!s.classes.includes(0))await click('class',0);
   for(const index of s.classes.filter(index=>index!==0))await click('class',index);
   await check();
   const accepted=await capture(page,out,s.id+'-'+s.index,s,'correct-check');
   captures.push({position:s.id+':'+s.index,phase:'correct-check',
    attempts:accepted.attempts.length,history:accepted.model.history.length,
    storage:accepted.storage});
   ok(accepted.attempts.length===2,'wrong and corrected Check both retained');
   const nativeOk=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const modelApi=await import('./learning/phase5/b23-model.js');
    return modelApi.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:accepted.model});
   ok(nativeOk===true,'original grader accepts correct native controls');
   const ctxInfo={sessionId:s.id,index:s.index};
   const proof=candidate.submittedRegularPolygonConditionsEvidence(
    native.task,accepted.model,accepted.record,ctxInfo);
   ok(proof?.kind==='regular-polygon-edge-angle-controls',
    'latest original Check binds candidate replay');
   ok(JSON.stringify(proof.independentlyCalculatedClasses)===JSON.stringify(s.classes),
    'independently derived family membership from edge lengths and interior angles');
   ok(proof.independentlyMeasured.regularPolygon===s.regular,
    'regularity matches independently measured sides and angles');
   const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
   const fake=structuredClone(accepted.model);
   fake.history[0].d.index='9';
   ok(!candidate.submittedRegularPolygonConditionsEvidence(native.task,accepted.model,stale,ctxInfo)&&
    !candidate.replayRegularPolygonConditionsEvidence(native.task,fake,ctxInfo)&&
    !candidate.replayRegularPolygonConditionsEvidence(native.task,accepted.model,
     {sessionId:s.id,index:s.index+2}),'stale, tampered and wrong-position evidence rejected');
   ok(!proof.verbalProofAssessed&&!proof.generalMasteryAssessed,
    'does not claim unobservable geometry reasoning');
   const png=s.id+'-'+s.index+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);
   stage=s.id+':'+s.index+':offline-reload';
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,'corrected lesson reload from SW');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
   const saved=await capture(page,out,s.id+'-'+s.index,s,'offline-reload');
   captures.push({position:s.id+':'+s.index,phase:'offline-reload',
    attempts:saved.attempts.length,history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,accepted.model,'native state persists after offline reload');
   assert.deepEqual(saved.record,accepted.record,'wrong and corrected Check history persists');
  }
  stage='original-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();
  await btn.waitFor();
  const download=page.waitForEvent('download');
  await btn.click();
  const raw=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'actual original State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or external requests');
  persist();
  console.log('P004E_REGULAR_POLYGON_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:specs.length,checks:checks.length,strictAApproved:false}));
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
