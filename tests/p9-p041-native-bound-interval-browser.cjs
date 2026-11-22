'use strict';
// Original B08 boundary tests: source-specific Check wrong then correct,
// genuine two endpoint probe button presses, offline State-v2 export.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p041-native-bound-interval');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let stage='init',browserVersion=null;
const checks=[],errors=[],sources=[];
const ok=(v,label)=>{assert.ok(v,stage+': '+label);checks.push(stage+': '+label);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const save=()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p041-original-bound-browser/1',head,chromium:browserVersion,
 viewport:STANDARD_DESKTOP_VIEWPORT,originalControls:true,seededLessonPositionOnly:true,
 attemptsSeeded:0,strictAApproved:false,checks,errors,sources},null,2)+'\n');};
async function control(page,selector){
 const el=page.locator(selector);assert.equal(await el.count(),1,'one original '+selector);
 for(let i=0;i<12&&!(await el.isVisible());i++){
  const closed=el.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await closed.count(),1);await closed.locator(':scope > summary').click();
 }
 assert.ok(await el.isVisible());return el;
}
async function field(page,key,value){
 const el=await control(page,'#extra-controls [data-xfield="'+key+'"]');
 if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(value));
 else{await el.fill(String(value));await el.press('Tab');}
}
async function seed(page,index){
 return page.evaluate(async(index)=>{
  const {packText,unpackText}=await import('./storage.js');
  const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  const lesson=data.lessons?.estbounds;
  if(!lesson||lesson.cases?.[index]?.attempts?.length)
   throw Error('original source already checked or missing');
  lesson.index=index;lesson.view='task';
  localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
  return true;
 },index);
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const entry=p=>import(pathToFileURL(path.join(root,p)).href);
 const ev=await entry('dist/learning/p041-native-bound-interval-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const native=await entry('dist/learning/phase5/b08-model.js');
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);browser=await chromium.launch({headless:true});browserVersion=browser.version();
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(22000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!cache,'original cache');
  await page.goto(origin.base+'v2.html#trail');await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,cache,ok,'P041');
  ok((await page.goto(origin.base+'learn.html#estbounds'))?.fromServiceWorker()===true,'original lesson offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='estbounds');
  const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
  for(const src of ev.P041_BOUND_SOURCES){
   const context={sessionId:'estbounds',index:src.index},task=sessionTaskFor('estbounds',src.index);
   const solved=native.example(task);
   stage='source-'+src.position;
   ok(hash(task)===src.taskHash&&ev.p041BoundBinding(task,context)?.nodeId===src.nodeId,'source SHA and node');
   ok(await seed(page,src.index),'original index selected without seeded model/attempt');
   ok((await page.reload())?.fromServiceWorker()===true,'genuine offline lesson reload');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,src.index);
   await field(page,'low',solved.low);await field(page,'high',solved.high);
   for(const trial of solved.trials){
    await field(page,'probe',trial.value);
    await (await control(page,'#extra-controls [data-x="wide-probe"]')).click();
   }
   await field(page,'left','closed');await field(page,'right','closed');
   stage='wrong-'+src.position;
   await (await control(page,'#actions [data-do="check"]')).click();
   const snap=label=>capture(page,out,'estbounds-'+src.index,{id:'estbounds',index:src.index},label);
   const wrong=await snap('wrong-check');
   ok(wrong.attempts.length===1&&!native.inspect(task,wrong.model).correct,'incorrect source Check recorded');
   ok(ev.replayP041BoundEvidence(task,wrong.model,context)===null,'false upper inclusion rejected');
   stage='correct-'+src.position;
   await field(page,'right','open');
   const draft=await snap('corrected-draft');
   ok(native.inspect(task,draft.model).correct,'original mathematics corrected');
   ok(!ev.submittedP041BoundEvidence(task,draft.model,draft.record,context),'old Check rejected');
   await (await control(page,'#actions [data-do="check"]')).click();
   const good=await snap('correct-check');
   ok(good.attempts.length===2&&!!ev.submittedP041BoundEvidence(task,good.model,good.record,context),
     'fresh source-bound mathematics and two genuine probes');
   stage='reload-'+src.position;
   ok((await page.reload())?.fromServiceWorker()===true,'native offline reload');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,src.index);
   const saved=await snap('offline-reload');
   assert.deepEqual(saved.model,good.model);assert.deepEqual(saved.record,good.record);
   ok(Boolean(ev.submittedP041BoundEvidence(task,saved.model,saved.record,context)),'saved original Check preserved');
   await page.screenshot({path:path.join(out,'estbounds-'+src.index+'-correct.png'),fullPage:false});
   sources.push({position:src.position,taskHash:src.taskHash,originalWrongCorrectChecks:2,
    observedOriginalEndpointProbes:2,strictAApproved:false});
   save();
  }
  stage='export';await page.goto(origin.base+'v2.html#trail');
  const button=page.locator('#main [data-do="export"]').first();await button.waitFor();
  const dl=page.waitForEvent('download');await button.click();
  const raw=fs.readFileSync(await (await dl).path()),backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(sources.length===2&&errors.length===0,'two exact original sources and no errors');
  console.log('P041_BOUND_ORIGINAL_BROWSER_OK '+JSON.stringify({head,positions:2,checks:checks.length,
   strictAApproved:false}));
 }catch(err){
  errors.push(stage+': '+String(err));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(err.stack||String(err));process.exitCode=1;
 }finally{save();await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)run().catch(e=>{errors.push(String(e));save();console.error(e.stack||String(e));process.exitCode=1;});
