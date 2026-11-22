'use strict';
// #342 P006d: original B19 full-range COUNTIF and real Chromium State-v2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p006d-native-countif-records');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'digitalstudy',index:2,node:'mt_yrvYKSwSRZ',
  hash:'772d795d586bc5e00f1eb0a20be87e5bccca909c46f6de2a622907030cbf01df',
  counts:[3,3,2],total:8,gap:0,maximum:[0,1],minimum:[2],unknown:0},
 {id:'checkrecords',index:2,node:'mt_QHT16CrFO-',
  hash:'387c9a4156b40d7e2143b716ccca795f815afcf18585996be6c2cf8c462a65e4',
  counts:[2,3,2],total:7,gap:1,maximum:[1],minimum:[0,2],unknown:1}
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
  schema:'math-p006d-native-countif-records-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   actualChildrenSurveyed:false,statisticsBeyondSampleAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006d-native-countif-records-evidence.js')).href);
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
   assert.equal(await loc.count(),1,stage+': one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': hidden details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const click=async selector=>{
   const loc=page.locator(selector);await reveal(loc);await loc.click();
  };
  const field=async(key,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+key+'"]');
   await reveal(loc);await loc.fill(String(value));await loc.press('Tab');
  };
  for(const s of cases){
   const position=s.id+':'+s.index,label=s.id+'-'+s.index;
   const context={sessionId:s.id,index:s.index};
   stage=position+':original-source';
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#'+s.id);
   ok(nav?.fromServiceWorker()===true,'native lesson opens offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
      throw Error('P006d requires untouched native position '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:s.id,index:s.index});
   ok(prior===0,'no synthetic earlier original Check');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'native task reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:s.id,index:s.index});
   const hash=digest(original.task);
   console.log('P006D_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,nodeId:original.nodeId,sha256:hash});
   ok(original.nodeId===s.node&&hash===s.hash&&original.task.type==='x-datacount'&&
      original.task.formula===true,'runtime full SHA/source/original formula view');
   ok(candidate.nativeCountifRecordBinding(original.task,context)?.position===position,
      'strict source-bound independent replay binding');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 viewport');
   ok(await page.locator('#thinking-feedback').count()===0,'shared feedback not registered');
   stage=position+':original-full-range-formulas';
   for(let i=0;i<original.task.labels.length;i++){
    const full='=COUNTIF(B2:B'+(s.total+1)+',"'+original.task.labels[i]+'")';
    await field('formulas.'+i,full);
   }
   stage=position+':original-tie-selection';
   for(const index of s.minimum)
    await click('#extra-controls [data-x="b19-min"][data-index="'+index+'"]');
   for(const index of s.maximum)
    await click('#extra-controls [data-x="b19-max"][data-index="'+index+'"]');
   stage=position+':wrong-check';
   await field('gap',s.gap);
   if(s.unknown)await field('unknown',s.unknown);
   await field('total',s.total+1);
   await click('#actions [data-do="check"]');
   const wrong=await capture(page,out,label,{id:s.id,index:s.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    events:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'original incorrect Check preserved');
   ok(!candidate.replayNativeCountifRecord(original.task,wrong.model,context),
      'wrong response rejected by independent mathematics');
   stage=position+':correct-check';
   await field('total',s.total);
   await click('#actions [data-do="check"]');
   const good=await capture(page,out,label,{id:s.id,index:s.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,
    events:good.model.history.length,storage:good.storage});
   ok(good.attempts.length===2,'genuine original wrong-to-correct Checks');
   const grade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const native=await import('./learning/phase5/b19-model.js');
    return native.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:good.model});
   ok(grade===true,'original B19 grader accepts corrected submission');
   const proof=candidate.submittedNativeCountifRecord(original.task,good.model,good.record,context);
   ok(proof?.kind==='b19-original-countif-full-column'&&
      proof.independentTotal===s.total&&proof.independentCategoryGap===s.gap&&
      proof.fullRange==='B2:B'+(s.total+1),'independent complete-range COUNTIF');
   ok(proof?.independentCounts.join(',')===s.counts.join(',')&&
      proof.originalMaxSelections.join(',')===s.maximum.join(',')&&
      proof.originalMinSelections.join(',')===s.minimum.join(',')&&
      proof.unknownRecordsExcluded===s.unknown,'tied extrema and unknown separation');
   ok(proof?.actualChildrenSurveyed===false&&proof?.strictAApproved===false,
      'no synthetic real survey or formal A approval');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.history[0].d.index='99';
   const missing=structuredClone(good.model);
   missing.formulas[0]='=COUNTIF(B2:B'+s.total+',"'+original.task.labels[0]+'")';
   ok(!candidate.submittedNativeCountifRecord(original.task,good.model,stale,context)&&
      !candidate.replayNativeCountifRecord(original.task,forged,context)&&
      !candidate.replayNativeCountifRecord(original.task,missing,context)&&
      !candidate.replayNativeCountifRecord(original.task,good.model,{sessionId:s.id,index:s.index+10}),
      'stale Check forged event partial range and wrong source rejected');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected original task reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const saved=await capture(page,out,label,{id:s.id,index:s.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    events:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'original State-v2 model persisted');
   assert.deepEqual(saved.record,good.record,'original State-v2 wrong and correct attempts persisted');
  }
  stage='original-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const download=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'real original State-v2 backup');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no JS exceptions or external requests');
  persist();
  console.log('P006D_NATIVE_COUNTIF_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
