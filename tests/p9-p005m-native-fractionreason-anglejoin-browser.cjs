'use strict';
// #342 P005m: actual B16 controls in native Chromium, State-v2 and SW offline.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p005m-native-fractionreason-anglejoin');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'fractionreason',index:2,node:'mt_2ESZh70NyS',angles:[45,90,45],
  hash:'87348811a8a2af3a10b9f4e29d1f56ffe13d6ebc0c4b259326cf5ec3a951ab70'},
 {id:'fractionreason',index:3,node:'mt_2ESZh70NyS',angles:[30,60,90],
  hash:'7d32137f7f140f8fabaa1d8e07c2ae0a8a6a7c60933566b300a5beb3100506e8'}
];
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(condition,description)=>{assert.ok(condition,stage+': '+description);checks.push(stage+': '+description);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p005m-native-fractionreason-anglejoin-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,verbalProofAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p005m-native-fractionreason-anglejoin-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': unexpected external request '+r.url());});
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW release available');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': hidden details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control is visible');
  };
  const click=async(selector)=>{
   const loc=page.locator(selector);await reveal(loc);await loc.click();
  };
  const rotate=async(degrees)=>{
   const loc=page.locator('#extra-controls [data-xfield="rotation"]');
   await reveal(loc);
   await loc.evaluate((el,v)=>{
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    setter.call(el,String(v));
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
   },degrees);
  };
  const answer=async(value)=>{
   const loc=page.locator('#extra-controls [data-xfield="answer"]');
   await reveal(loc);await loc.fill(String(value));await loc.press('Tab');
  };
  const check=async()=>click('#actions [data-do="check"]');
  for(const spec of cases){
   const position=spec.id+':'+spec.index,label=spec.id+'-'+spec.index;
   const context={sessionId:spec.id,index:spec.index};
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
     throw Error('P005m original position already has a submission');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:spec.id,index:spec.index});
   ok(prior===0,'no seeded original Check');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'native position reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:spec.id,index:spec.index});
   const hash=digest(original.task);
   console.log('P005M_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,sha256:hash,nodeId:original.nodeId});
   ok(original.nodeId===spec.node&&hash===spec.hash&&
      original.task.type==='x-anglejoin'&&
      JSON.stringify(original.task.angles)===JSON.stringify(spec.angles),
      'exact source, native original task and full SHA256');
   ok(!!candidate.angleJoinBinding(original.task,context),'source-bound candidate');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 viewport');
   ok(await page.locator('#thinking-feedback').count()===0,'no unregistered feedback');
   stage=position+':original-three-angle-controls';
   let degrees=0;
   for(let i=0;i<3;i++){
    await click('#extra-visual [data-x="b16-angle"][data-index="'+i+'"]');
    await rotate(degrees);
    await click('#extra-controls [data-x="b16-rotate-place"]');
    degrees+=spec.angles[i];
   }
   for(const v of ['original','together','straight'])
    await click('#extra-visual [data-x="b16-chain"][data-value="'+v+'"]');
   ok(degrees===180,'independent planned angle sum is 180');
   stage=position+':wrong-check';
   await answer(90);await check();
   const wrong=await capture(page,out,label,{id:spec.id,index:spec.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    history:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'wrong original Check is retained');
   ok(!candidate.replayAngleJoinEvidence(original.task,wrong.model,context),
      'candidate rejects incorrect native answer');
   stage=position+':corrected-check';
   await answer(180);await check();
   const good=await capture(page,out,label,{id:spec.id,index:spec.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,
    history:good.model.history.length,storage:good.storage});
   ok(good.attempts.length===2,'wrong and corrected original Checks retained');
   const inspected=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b16-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:spec.id,index:spec.index,model:good.model});
   ok(inspected===true,'native grader accepts corrected answer');
   const proof=candidate.submittedAngleJoinEvidence(original.task,good.model,good.record,context);
   ok(proof?.kind==='native-three-angle-straight-join'&&
      proof.independentTriangleSumDegrees===180&&proof.unbrokenHalfTurnVerified,
      'independent Euclidean math and replay of original actions');
   ok(proof.originalAnglePickOrder.join(',')==='0,1,2'&&
      proof.originalChainControlOrder.join(',')==='original,together,straight',
      'three real picks, placements and ordered reasoning buttons');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.history[0].data.index='00';
   ok(!candidate.submittedAngleJoinEvidence(original.task,good.model,stale,context)&&
      !candidate.replayAngleJoinEvidence(original.task,forged,context)&&
      !candidate.replayAngleJoinEvidence(original.task,good.model,{sessionId:spec.id,index:1}),
      'stale Check, forged action and wrong source rejected');
   ok(proof.strictAApproved===false&&!proof.verbalProofAssessed&&
      !proof.generalMasteryAssessed,'no strict A or mastery claim');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'native lesson survives stopped HTTP origin');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const saved=await capture(page,out,label,{id:spec.id,index:spec.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'original model survives offline reload');
   assert.deepEqual(saved.record,good.record,'original Check history survives reload');
  }
  stage='state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const download=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 backup exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or external requests');
  persist();
  console.log('P005M_NATIVE_ANGLEJOIN_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
