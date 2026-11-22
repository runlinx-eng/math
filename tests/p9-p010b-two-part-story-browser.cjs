'use strict';
// Genuine B05 original controls for two source-locked P010 tasks.
// Wrong Check -> corrected Check -> original next; SW stopped-origin V2 export.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p010b-two-part-story');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let phase='start',version=null;
const checks=[],sources=[],errors=[];
const ok=(x,n)=>{assert.ok(x,phase+': '+n);checks.push(phase+': '+n);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const save=()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p010-b05-original-browser/1',head,chromium:version,
 viewport:STANDARD_DESKTOP_VIEWPORT,originalControls:true,originalAttemptsSeeded:0,
 strictAApproved:false,checks,sources,errors},null,2)+'\n');};
async function ctrl(page,selector){
 const el=page.locator(selector);assert.equal(await el.count(),1,'one original '+selector);
 for(let i=0;i<10&&!(await el.isVisible());i++){
  const closed=el.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await closed.count(),1);await closed.locator(':scope > summary').click();
 }
 assert.ok(await el.isVisible(),'original control visible');return el;
}
async function set(page,key,value){
 const el=await ctrl(page,'#extra-controls [data-xfield="'+key+'"]');
 if(await el.getAttribute('type')==='range'){
  let n=Number(await el.inputValue()),want=Number(value),i=0;
  if(n===want){await el.press(n===20?'ArrowLeft':'ArrowRight');n=Number(await el.inputValue());}
  while(n!==want&&i++<100){const key=n<want?'ArrowRight':'ArrowLeft';
   await el.press(key);const z=Number(await el.inputValue());
   assert.ok(z!==n&&Math.abs(z-want)<Math.abs(n-want));n=z;}
  assert.equal(n,want);
 }else if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(value));
 else{await el.fill(String(value));await el.press('Tab');}
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const entry=p=>import(pathToFileURL(path.join(root,p)).href);
 const e=await entry('dist/learning/p010-two-part-story-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const b05=await entry('dist/learning/phase4/b05-model.js');
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);browser=await chromium.launch({headless:true});version=browser.version();
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',x=>errors.push(phase+': '+String(x)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(phase+': external request '+r.url());});
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original offline cache');
  await page.goto(origin.base+'v2.html#trail');await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,'P010');
  ok((await page.goto(origin.base+'learn.html#represent'))?.fromServiceWorker()===true,'offline original lesson');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='represent');
  const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
  for(const src of e.P010_TWO_PART_SOURCES){
   phase=src.position;await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,src.index);
   const context={sessionId:'represent',index:src.index},t=sessionTaskFor('represent',src.index),good=b05.example(t);
   ok(hash(t)===src.taskHash&&e.p010TwoPartBinding(t,context)?.nodeId===src.nodeId,'frozen original exact source');
   for(const [key,value] of Object.entries(good))
    await set(page,key,key==='op'?(t.missing?'plus':'minus'):value);
   phase='wrong-'+src.position;
   await (await ctrl(page,'#actions [data-do="check"]')).click();
   const snap=label=>capture(page,out,'represent-'+src.index,{id:'represent',index:src.index},label);
   const wrong=await snap('wrong-check');
   ok(wrong.attempts.length===1&&!b05.inspect(t,wrong.model).correct,'wrong native Check');
   ok(e.replayP010TwoPartEvidence(t,wrong.model,context)===null,'math rejects wrong Check');
   phase='correct-'+src.position;
   await set(page,'op',good.op);
   const draft=await snap('corrected-draft');
   ok(b05.inspect(t,draft.model).correct,'original corrected work');
   ok(!e.submittedP010TwoPartEvidence(t,draft.model,draft.record,context),'stale Check rejected');
   await (await ctrl(page,'#actions [data-do="check"]')).click();
   const accepted=await snap('correct-check');
   ok(accepted.attempts.length===2&&!!e.submittedP010TwoPartEvidence(t,accepted.model,accepted.record,context),
    'fresh Check and independent math proof');
   phase='offline-'+src.position;
   ok((await page.reload())?.fromServiceWorker()===true,'offline reloaded original');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,src.index);
   const restored=await snap('offline-reload');
   assert.deepEqual(restored.model,accepted.model);assert.deepEqual(restored.record,accepted.record);
   ok(Boolean(e.submittedP010TwoPartEvidence(t,restored.model,restored.record,context)),
    'original State-v2 Check preserved');
   await page.screenshot({path:path.join(out,'represent-'+src.index+'-correct.png'),fullPage:false});
   sources.push({position:src.position,taskHash:src.taskHash,originalWrongCorrectChecks:2,
    checkedSource:true,independentMath:true,strictAApproved:false});
   save();
   if(src.index===0)await (await ctrl(page,'#actions [data-do="next"]')).click();
  }
  phase='export';await page.goto(origin.base+'v2.html#trail');
  const button=page.locator('#main [data-do="export"]').first();await button.waitFor();
  const ready=page.waitForEvent('download');await button.click();
  const raw=fs.readFileSync(await (await ready).path()),backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'native V2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(sources.length===2&&errors.length===0,'both sources and no browser errors');
  console.log('P010_TWO_PART_NATIVE_BROWSER_OK '+JSON.stringify({head,positions:sources.length,checks:checks.length,
   strictAApproved:false}));
 }catch(err){
  errors.push(phase+': '+String(err));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(err.stack||String(err));process.exitCode=1;
 }finally{save();await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)run().catch(e=>{errors.push(String(e));save();console.error(e.stack||String(e));process.exitCode=1;});
