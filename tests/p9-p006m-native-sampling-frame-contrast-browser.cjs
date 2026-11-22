'use strict';
// #342 P006m: native club vs complete-frame sample, original B21 controls/Check/offline.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p006m-native-sampling-frame-contrast');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sample={id:'fairdraw',index:1,node:'mt_4zgPzc6yu5',
 hash:'852bacf9fa85cb2853d9bcbb39f3c83135bbb5b8cc431e297dd55bd05143e321'};
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(v,msg)=>{assert.ok(v,stage+': '+msg);checks.push(stage+': '+msg);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p006m-native-sampling-frame-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   realRespondentsObserved:false,unbiasedPopulationInferenceVerified:false},
  viewport:STANDARD_DESKTOP_VIEWPORT,nativeHashes,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006m-native-sampling-frame-contrast-evidence.js')).href);
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
  const s=sample,position=s.id+':'+s.index,label='fairdraw-1';
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
    throw Error('P006m requires clean native position '+id+':'+index);
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
  console.log('P006M_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
  nativeHashes.push({position,nodeId:original.nodeId,sha256:hash});
  ok(original.nodeId===s.node&&hash===s.hash&&original.task.type==='x-samplelab',
   'exact original B21 source/full SHA/control task');
  ok(candidate.nativeSamplingFrameBinding(original.task,context)?.methods?.join(',')==='club,all',
   'candidate bound to two native frames');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'original desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,'no premature shared registry');
  stage=position+':first-club-draw-and-wrong-check';
  await action('draw');
  const first=(await capture(page,out,label,{id:s.id,index:s.index},'club-after-draw')).model.board.pending;
  ok(!!first&&first.method==='club'&&first.ids.length===20&&
   first.ids.every(id=>id<=200)&&new Set(first.ids).size===20,
   'original club-only frame draw of 20 unique synthetic IDs');
  const estimate1=Math.round((first.values.reduce((a,b)=>a+b,0)/20+Number.EPSILON)*10)/10;
  await field('estimate',estimate1+1);
  await action('record');
  const wrongModel=(await capture(page,out,label,{id:s.id,index:s.index},'club-wrong-record')).model;
  ok(!!wrongModel.issue&&!!wrongModel.board.pending,
   'incorrect original club mean rejected without consuming pending draw');
  ok(!candidate.replayNativeSamplingFrames(original.task,wrongModel,context),
   'independent replay rejects unfinished incorrect record');
  await check();
  const wrong=await capture(page,out,label,{id:s.id,index:s.index},'wrong-check');
  captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
   events:wrong.model.history.length,storage:wrong.storage});
  ok(wrong.attempts.length===1,'original wrong Check retained');
  stage=position+':correct-club-and-all-draw';
  await field('estimate',estimate1);
  await action('record');
  const completed1=(await capture(page,out,label,{id:s.id,index:s.index},'club-recorded')).model;
  ok(completed1.board.runs.length===1&&completed1.board.runs[0].method==='club',
   'first original club draw accepted');
  await action('draw');
  const second=(await capture(page,out,label,{id:s.id,index:s.index},'all-after-draw')).model.board.pending;
  ok(!!second&&second.method==='all'&&second.ids.length===20&&
   second.ids.every(id=>id<=800)&&new Set(second.ids).size===20,
   'original complete population frame draw of 20 unique synthetic IDs');
  const estimate2=Math.round((second.values.reduce((a,b)=>a+b,0)/20+Number.EPSILON)*10)/10;
  await field('estimate',estimate2);
  await action('record');
  for(let i=0;i<original.task.questions.length;i++){
   const q=original.task.questions[i];
   await field('answers.'+i,q.value[0]);
  }
  await check();
  const good=await capture(page,out,label,{id:s.id,index:s.index},'correct-check');
  captures.push({position,phase:'correct-check',attempts:good.attempts.length,
   events:good.model.history.length,storage:good.storage});
  ok(good.attempts.length===2,'wrong-to-correct original Checks retained');
  const native=await import(pathToFileURL(path.join(root,'dist/learning/phase5/b21-model.js')).href);
  ok(native.inspect(original.task,good.model).correct===true,
   'original B21 grader accepts two recorded frame estimates and choices');
  const proof=candidate.submittedNativeSamplingFrames(original.task,good.model,good.record,context);
  ok(!!proof&&proof.kind==='b21-native-sampling-frame-contrast'&&
   proof.wrongEstimateThenCorrectionObserved&&proof.observedDrawClicks===2&&
   proof.observedRecordClicks===3,'two distinct original frames independently replayed');
  ok(proof.sampleMeans[0]===estimate1&&proof.sampleMeans[1]===estimate2&&
   proof.noRealRespondentsObserved&&!proof.singlePairProvesPopulationBias&&
   !proof.strictAApproved,'sample statistics bounded; no real population inference or formal A');
  const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
  const forged=structuredClone(good.model);forged.board.runs[0].ids[0]=700;
  ok(!candidate.submittedNativeSamplingFrames(original.task,good.model,stale,context)&&
   !candidate.replayNativeSamplingFrames(original.task,forged,context)&&
   !candidate.replayNativeSamplingFrames(original.task,good.model,{sessionId:'fairdraw',index:0}),
   'stale Check, impossible club member and wrong source rejected');
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
  console.log('P006M_NATIVE_SAMPLING_FRAME_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
