'use strict';
// #342 P006n: native five draws, original B21 Check, SW offline, State-v2 export.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p006n-native-repeat-sampling');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sample={id:'samplevary',index:0,node:'mt_x7V1qrkiqH',hash:process.env.P006N_TASK_SHA||null};
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(v,msg)=>{assert.ok(v,stage+': '+msg);checks.push(stage+': '+msg);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p006n-native-repeat-sampling-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   actualRespondentsObserved:false,populationInferenceVerified:false},
  viewport:STANDARD_DESKTOP_VIEWPORT,nativeHashes,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006n-native-repeat-sampling-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
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
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let j=0;j<10&&!(await loc.isVisible());j++){
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
  const action=async(k)=>{
   const loc=page.locator('#extra-controls [data-x="b21-'+k+'"]');
   await reveal(loc);await loc.click();
  };
  const check=async()=>page.locator('#actions [data-do="check"]').click();
  const s=sample,position=s.id+':'+s.index,label='samplevary-0';
  const context={sessionId:s.id,index:s.index};
  stage=position+':original-source';
  await page.goto(origin.base+'v2.html#trail');
  const nav=await page.goto(origin.base+'learn.html#'+s.id);
  ok(nav?.fromServiceWorker()===true,'original B21 lesson opens offline');
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
  const prior=await page.evaluate(async({id,index})=>{
   const {packText,unpackText}=await import('./storage.js');
   const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=state.lessons[id];
   if(!lesson||lesson.cases?.[index]?.attempts?.length)
    throw Error('P006n requires clean native position '+id+':'+index);
   lesson.index=index;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
   return lesson.cases?.[index]?.attempts?.length||0;
  },{id:s.id,index:s.index});
  ok(prior===0,'original position contains no seeded Check');
  const loaded=await page.reload();
  ok(loaded?.fromServiceWorker()===true,'original B21 task reloads offline');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
  const original=await page.evaluate(async({id,index})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
  },{id:s.id,index:s.index});
  const hash=digest(original.task);
  console.log('P006N_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
  nativeHashes.push({position,nodeId:original.nodeId,sha256:hash});
  ok(original.nodeId===s.node&&(!s.hash||hash===s.hash)&&
   original.task.type==='x-samplelab'&&original.task.runs===5,
   'original B21 source/full task type and five-draw contract');
  ok(candidate.nativeRepeatSamplingBinding(original.task,context)?.drawCount===5,
   'candidate bound to exact original five resamples');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
   'original desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,
   'no premature shared registry');
  const estimates=[];
  for(let i=0;i<5;i++){
   stage=position+':native-draw-'+i;
   await action('draw');
   const pending=(await capture(page,out,label,{id:s.id,index:s.index},'draw-'+i)).model.board.pending;
   ok(!!pending&&pending.method==='all'&&pending.ids.length===20&&
    new Set(pending.ids).size===20&&pending.ids.every(id=>id>=1&&id<=80),
    'original draw '+i+' has twenty unique synthetic members');
   const successes=pending.values.reduce((a,b)=>a+b,0);
   const estimate=Math.round((successes/20*100+Number.EPSILON)*10)/10;
   estimates.push(estimate);
   if(i===0){
    stage=position+':original-wrong-record-and-check';
    await field('estimate',estimate+1);
    await action('record');
    const rejected=(await capture(page,out,label,{id:s.id,index:s.index},'wrong-record')).model;
    ok(!!rejected.issue&&!!rejected.board.pending,
     'incorrect native estimate rejected without consuming pending draw');
    ok(!candidate.replayNativeRepeatSampling(original.task,rejected,context),
     'independent replay rejects unfinished incorrect record');
    await check();
    const wrong=await capture(page,out,label,{id:s.id,index:s.index},'wrong-check');
    captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
     events:wrong.model.history.length,storage:wrong.storage});
    ok(wrong.attempts.length===1,'original wrong Check retained');
   }
   stage=position+':native-correct-record-'+i;
   await field('estimate',estimate);
   await action('record');
   const accepted=(await capture(page,out,label,{id:s.id,index:s.index},'record-'+i)).model;
   ok(accepted.issue===''&&accepted.board.runs.length===i+1&&
    accepted.board.runs[i].estimate===estimate,
    'correct original record '+i+' accepted and saved');
  }
  stage=position+':correct-check';
  await field('answers.0','chance');
  await check();
  const good=await capture(page,out,label,{id:s.id,index:s.index},'correct-check');
  captures.push({position,phase:'correct-check',attempts:good.attempts.length,
   events:good.model.history.length,storage:good.storage});
  ok(good.attempts.length===2,'wrong then correct original Checks retained');
  const native=await import(pathToFileURL(path.join(root,'dist/learning/phase5/b21-model.js')).href);
  ok(native.inspect(original.task,good.model).correct===true,
   'original B21 grader accepts five proportions and bounded question');
  const proof=candidate.submittedNativeRepeatSampling(original.task,good.model,
   good.record,context);
  ok(!!proof&&proof.kind==='b21-native-five-repeat-samples'&&
   proof.wrongEstimateThenCorrectionObserved&&proof.observedDrawClicks===5&&
   proof.observedRecordClicks===6,
   'five original draws independently replayed with a corrected error');
  ok(JSON.stringify(proof.samplePercentages)===JSON.stringify(estimates)&&
   proof.noFutureSampleRangeGuarantee&&!proof.realRespondentsObserved&&
   !proof.strictAApproved,
   'actual percentages checked; no future-range or population guarantee');
  const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
  const forged=structuredClone(good.model);forged.board.runs[0].ids[0]=9999;
  ok(!candidate.submittedNativeRepeatSampling(original.task,good.model,stale,context)&&
   !candidate.replayNativeRepeatSampling(original.task,forged,context)&&
   !candidate.replayNativeRepeatSampling(original.task,good.model,{sessionId:s.id,index:1}),
   'stale Check, forged sample and wrong position rejected');
  const png=label+'-correct.png';await page.screenshot({path:path.join(out,png),fullPage:false});
  screenshots.push(png);
  stage=position+':original-state-v2-offline';
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'correct original sample reloads offline');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
  const saved=await capture(page,out,label,{id:s.id,index:s.index},'offline-reload');
  captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
   events:saved.model.history.length,storage:saved.storage});
  assert.deepEqual(saved.model,good.model,'original B21 model persisted exactly');
  assert.deepEqual(saved.record,good.record,'latest original Check persisted exactly');
  stage='original-state-v2-backup';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const wait=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await wait).path()),backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'genuine original State-v2 backup');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser JS errors or external URLs');
  persist();
  console.log('P006N_NATIVE_REPEAT_SAMPLING_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:1,checks:checks.length,strictAApproved:false
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
