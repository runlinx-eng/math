'use strict';
// #342 P005f native UI: two angles, real guess/reveal and wrong-to-correct Checks.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p005f-native-angle-estimates');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'angleestimate',index:0,node:'mt_YUJ5pwalqL',
  hash:'2e95b28676442bc8fc86c1bdfdeec5cfb3cff4d88efa1c546acbf6dfa3e06e35',
  amount:130,tolerance:15,className:'obtuse',answer:'more',bad:70},
 {id:'angleestimate',index:1,node:'mt_YUJ5pwalqL',
  hash:'0747b513cf0a1b47fa7287c24c8f1124fad9decd5264b49ac198cc44d8c24b6d',
  amount:270,tolerance:20,className:'reflex',answer:'reflex',bad:90}
];
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(v,msg)=>{assert.ok(v,stage+': '+msg);checks.push(stage+': '+msg);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
  .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p005f-native-angle-estimates-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,childTrial:false,verbalProofAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p005f-native-angle-estimates-evidence.js')).href);
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
   assert.equal(await loc.count(),1,stage+': one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': one closed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const click=async action=>{
   const loc=page.locator('#extra-controls [data-x="g25-'+action+'"]');
   await reveal(loc);await loc.click();
  };
  const fillAngle=async value=>{
   const loc=page.locator('#extra-controls [data-xfield="angle"]');
   await reveal(loc);await loc.fill(String(value));await loc.press('Tab');
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  for(const spec of cases){
   const context={sessionId:spec.id,index:spec.index};
   const position=spec.id+':'+spec.index,label=spec.id+'-'+spec.index;
   stage=position+':source';
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#'+spec.id);
   ok(nav?.fromServiceWorker()===true,'original lesson navigation offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=data.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P005f requires untouched original task '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:spec.id,index:spec.index});
   ok(prior===0,'no seeded native Check');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'original native position reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:spec.id,index:spec.index});
   const hash=digest(original.task);
   console.log('P005F_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({sessionId:spec.id,index:spec.index,sha256:hash,nodeId:original.nodeId});
   ok(original.nodeId===spec.node&&hash===spec.hash&&
      original.task.type==='x-g25-estimate'&&
      original.task.amount===spec.amount&&original.task.tolerance===spec.tolerance,
      'native source + full runtime SHA256 + original estimate contract');
   ok(!!candidate.angleEstimateBinding(original.task,context),
      'source-locked candidate binds current original task');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
      'standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
      'no unregistered strict-A feedback');

   stage=position+':wrong-check';
   await fillAngle(spec.bad);await click('guess');await click('reveal');
   const ans=page.locator('#extra-controls [data-xfield="answers.0"]');
   await reveal(ans);await ans.selectOption(spec.answer);
   await check();
   const wrong=await capture(page,out,label,{id:spec.id,index:spec.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    history:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'first native wrong Check retained');
   const wrongGrade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b25-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:spec.id,index:spec.index,model:wrong.model});
   ok(wrongGrade===false,'original grader rejects imprecise estimate');
   ok(!candidate.replayAngleEstimateEvidence(original.task,wrong.model,context),
      'independent replay rejects imprecise estimate');

   stage=position+':correct-check';
   await fillAngle(spec.amount);await click('guess');await click('reveal');
   await check();
   const accepted=await capture(page,out,label,{id:spec.id,index:spec.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:accepted.attempts.length,
    history:accepted.model.history.length,storage:accepted.storage});
   ok(accepted.attempts.length===2,'wrong and corrected original Checks retained');
   const originalGrade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b25-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:spec.id,index:spec.index,model:accepted.model});
   ok(originalGrade===true,'original grader accepts corrected estimate');
   const proof=candidate.submittedAngleEstimateEvidence(
    original.task,accepted.model,accepted.record,context);
   ok(proof?.kind==='native-angle-estimate-reveal',
      'latest original Check binds independent angle estimate evidence');
   ok(proof.measuredDirectedDegrees===spec.amount&&
      proof.absoluteErrorDegrees===0&&proof.allowedErrorDegrees===spec.tolerance&&
      proof.independentClass===spec.className,
      'directed atan2 independently checks obtained angle and tolerance');
   ok(proof.correctionObserved&&proof.initialMistakePersisted&&
      proof.originalControlEvents.filter(e=>e.action==='guess').length===2,
      'real guess/reveal correction trace retained');
   const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
   const forged=structuredClone(accepted.model);forged.history[0].f.angle='070';
   ok(!candidate.submittedAngleEstimateEvidence(original.task,accepted.model,stale,context)&&
      !candidate.replayAngleEstimateEvidence(original.task,forged,context)&&
      !candidate.replayAngleEstimateEvidence(original.task,accepted.model,
       {sessionId:spec.id,index:999}),
      'reject stale Check, forged event and wrong native position');
   ok(proof.strictAApproved===false&&!proof.physicalProtractorAssessed&&
      !proof.generalMasteryAssessed,'no invented physical measurement or formal A');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);

   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected lesson reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const saved=await capture(page,out,label,{id:spec.id,index:spec.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,accepted.model,'original model survives offline reload');
   assert.deepEqual(saved.record,accepted.record,'native Check history survives offline reload');
  }
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const dl=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await dl).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
     'original State-v2 export across two native positions');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or external requests');
  persist();
  console.log('P005F_NATIVE_ANGLE_ESTIMATES_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:cases.length,checks:checks.length,strictAApproved:false}));
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
