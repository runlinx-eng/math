'use strict';
// #342 P006c: three real native B19 controls in Chromium, offline State-v2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p006c-native-frequency-scopes');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'playgroundstudy',index:1,node:'mt_kxeuXm6EyC',
  hash:'f0a5bb49744b71e2999b4cd02a6ccdad8687c20e8531100e31c3f3539c9b5be9',
  counts:[2,1,1],total:4,gap:1,scope:'visits'},
 {id:'measurestory',index:0,node:'mt_6gpryAnpoZ',
  hash:'ed4ec76e97c65506709940aafd84b7adabba2cd9f05558ffc2f88f3ece5be500',
  counts:[3,7,6,4],total:20,gap:4},
 {id:'ownstudy',index:2,node:'mt_Y6JmLjnfRP',
  hash:'42fae338a6579eb8eb924ba776d3a156ec5ca5c4ee324b74ec0413b70f4a2e41',
  counts:[3,6,4,2],total:15,gap:3,extremes:true}
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
  schema:'math-p006c-native-frequency-scopes-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   actualChildrenSurveyed:false,statisticalInferenceAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p006c-native-frequency-scopes-evidence.js')).href);
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
      throw Error('P006c requires untouched original position '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:s.id,index:s.index});
   ok(prior===0,'no seeded old native Check');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'native task reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:s.id,index:s.index});
   const hash=digest(original.task);
   console.log('P006C_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,nodeId:original.nodeId,sha256:hash});
   ok(original.nodeId===s.node&&hash===s.hash&&original.task.type==='x-datacount',
      'runtime full SHA/source/original view');
   ok(candidate.nativeFrequencyScopesBinding(original.task,context)?.kind===s.kind,
      'source locked independent replay');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 real viewport');
   ok(await page.locator('#thinking-feedback').count()===0,'no premature shared registry');
   stage=position+':native-bar-and-comparison';
   for(const [index,count] of s.counts.entries())
    for(let k=0;k<count;k++)
     await click('#extra-controls [data-x="b19-bar"][data-index="'+index+'"][data-delta="1"]');
   if(s.extremes){
    for(const [action,index] of [['min',3],['max',1]])
     await click('#extra-controls [data-x="b19-'+action+'"][data-index="'+index+'"]');
   }
   if(s.scope){
    const scope=page.locator('#extra-controls [data-xfield="scope"]');
    await reveal(scope);
    await scope.selectOption(s.scope);
   }
   stage=position+':original-wrong-check';
   await field('gap',s.gap);
   await field('total',s.total-1);
   await click('#actions [data-do="check"]');
   const wrong=await capture(page,out,label,{id:s.id,index:s.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    events:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'original incorrect Check saved');
   ok(!candidate.replayNativeFrequencyScopes(original.task,wrong.model,context),
      'wrong answer rejected independently');
   stage=position+':correct-check';
   await field('total',s.total);
   await click('#actions [data-do="check"]');
   const good=await capture(page,out,label,{id:s.id,index:s.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,
    events:good.model.history.length,storage:good.storage});
   ok(good.attempts.length===2,'original wrong then correct attempts');
   const grade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const native=await import('./learning/phase5/b19-model.js');
    return native.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:good.model});
   ok(grade===true,'original native grader accepts correction');
   const proof=candidate.submittedNativeFrequencyScopes(original.task,good.model,good.record,context);
   ok(proof?.kind==='b19-native-simulated-frequency-by-scope'&&
      proof.independentlyCountedTotal===s.total&&
      proof.independentCategoryDifference===s.gap&&
      proof.originalIncrementEvents===s.total,'native events and independent scoped frequency');
   ok(s.extremes?
     proof.originalMaxSelections.join(',')==='1'&&proof.originalMinSelections.join(',')==='3':
     proof.originalMaxSelections.length===0&&proof.originalMinSelections.length===0,
      'original extrema only where applicable');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.history[0].d.delta='-1';
   ok(!candidate.submittedNativeFrequencyScopes(original.task,good.model,stale,context)&&
      !candidate.replayNativeFrequencyScopes(original.task,forged,context)&&
      !candidate.replayNativeFrequencyScopes(original.task,good.model,{sessionId:s.id,index:s.index+99}),
      'stale Check forged history and wrong source reject');
   ok(!proof.strictAApproved&&!proof.actualChildrenSurveyed,
      'no formal A or actual respondents claimed');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected native task reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,s.index);
   const saved=await capture(page,out,label,{id:s.id,index:s.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
     events:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'State-v2 native model persists');
   assert.deepEqual(saved.record,good.record,'State-v2 native Check history persists');
  }
  stage='original-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const download=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 backup exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no JS errors or off-origin requests');
  persist();
  console.log('P006C_NATIVE_FREQUENCY_SCOPES_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:cases.length,checks:checks.length,strictAApproved:false
  }));
 }catch(e){
  errors.push(stage+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
