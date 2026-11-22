'use strict';
// Exact original B05 x-grow buttons & native inputs for all three positions.
// No source model or attempt injection. Real wrong->correct Check and V2 offline.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p034-original-growing');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let stage='start',version=null;
const checks=[],errors=[],positions=[];
const ok=(condition,label)=>{assert.ok(condition,stage+': '+label);checks.push(stage+': '+label);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const save=()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p034-original-growing-browser/1',testedCheckoutSha:sha,
 viewport:STANDARD_DESKTOP_VIEWPORT,chromium:version,
 originalControls:true,originalAttemptsSeeded:0,seededLessonPositionOnly:false,
 strictAApproved:false,checks,positions,errors},null,2)+'\n');};
async function control(page,selector){
 let el=page.locator(selector);
 if(!(await el.count()))el=page.locator(selector.replace('#extra-controls ','.extra-controls '));
 assert.equal(await el.count(),1,'one original '+selector);
 for(let i=0;i<10&&!(await el.isVisible());i++){
  const parent=el.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await parent.count(),1);await parent.locator(':scope > summary').click();
 }
 assert.ok(await el.isVisible());return el;
}
async function range(page,key,target){
 const el=await control(page,'#extra-controls [data-xfield="'+key+'"]');
 const box=await el.boundingBox(),min=Number(await el.getAttribute('min')),max=Number(await el.getAttribute('max'));
 const prior=Number(await el.inputValue());
 assert.ok(box&&box.width>35&&target>=min&&target<=max,'native original B05 range');
 const inset=Math.min(10,box.width/8);
 await el.click({position:{x:inset+(target-min)/(max-min)*(box.width-2*inset),y:box.height/2}});
 let n=Number(await el.inputValue());
 if(prior===target&&n===target){
  await el.focus();await el.press(target===max?'ArrowLeft':'ArrowRight');
  n=Number(await el.inputValue());
 }
 let attempts=0;
 while(n!==target&&attempts++<100){
  const key=n<target?'ArrowRight':'ArrowLeft';
  let next=n;
  for(let k=0;k<3&&next===n;k++){await el.focus();await el.press(key);next=Number(await el.inputValue());}
  assert.ok(next!==n&&Math.abs(next-target)<Math.abs(n-target),'real slider approaches target');
  n=next;
 }
 assert.equal(n,target,'real original range reaches source value');
}
async function fill(page,key,value){
 const el=await control(page,'#extra-controls [data-xfield="'+key+'"]');
 if(await el.getAttribute('type')==='range')return range(page,key,Number(value));
 await el.fill(String(value));await el.press('Tab');
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const entry=p=>import(pathToFileURL(path.join(root,p)).href);
 const ev=await entry('dist/learning/p034-native-growing-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const b05=await entry('dist/learning/phase4/b05-model.js');
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);browser=await chromium.launch({headless:true});version=browser.version();
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW release exists');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,'P034');
  ok((await page.goto(origin.base+'learn.html#growing'))?.fromServiceWorker()===true,
   'original lesson offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='growing');
  const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
  for(const source of ev.P034_GROWING_SOURCES){
   const context={sessionId:'growing',index:source.index};
   const task=sessionTaskFor('growing',source.index),expected=b05.example(task);
   stage='source-'+source.position;
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,source.index);
   ok(digest(task)===source.taskHash&&ev.p034GrowingBinding(task,context)?.nodeId===source.nodeId,
    'exact original task source and SHA');
   await fill(page,'start',expected.start);
   await fill(page,'step',expected.step);
   if(task.towers)await fill(page,'prediction',expected.prediction);
   for(let i=0;i<task.values.length;i++){
    if(task.given?task.given.includes(i):i<task.known)continue;
    await fill(page,'heights.'+i,expected.heights[i]);
   }
   stage='wrong-'+source.position;
   await fill(page,'step','1');
   await (await control(page,'#actions [data-do="check"]')).click();
   const snap=label=>capture(page,out,'growing-'+source.index,{id:'growing',index:source.index},label);
   const wrong=await snap('wrong-check');
   ok(wrong.attempts.length===1&&!b05.inspect(task,wrong.model).correct,
    'first native Check wrong');
   ok(ev.replayP034GrowingEvidence(task,wrong.model,context)===null,'independent wrong step rejected');
   stage='corrected-'+source.position;
   await fill(page,'step',expected.step);
   const draft=await snap('corrected-draft');
   ok(b05.inspect(task,draft.model).correct,'original six-term rule corrected');
   ok(ev.submittedP034GrowingEvidence(task,draft.model,draft.record,context)===null,
    'previous Check remains stale');
   await (await control(page,'#actions [data-do="check"]')).click();
   const good=await snap('correct-check');
   const proof=ev.submittedP034GrowingEvidence(task,good.model,good.record,context);
   ok(good.attempts.length===2&&!!proof,'correct Check and independent six-term arithmetic');
   ok(!proof.strictAApproved&&!proof.fullActionHistoryObserved,'no invented original action history');
   stage='offline-'+source.position;
   ok((await page.reload())?.fromServiceWorker()===true,'source stopped SW reload');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,source.index);
   const saved=await snap('offline-reload');
   assert.deepEqual(saved.model,good.model);assert.deepEqual(saved.record,good.record);
   ok(!!ev.submittedP034GrowingEvidence(task,saved.model,saved.record,context),
    'original State-v2 persists exact proof');
   await page.screenshot({path:path.join(out,'growing-'+source.index+'-correct.png'),fullPage:false});
   positions.push({position:source.position,taskHash:source.taskHash,
    originalWrongCorrectChecks:2,verifiedRule:true,strictAApproved:false});
   save();
   if(source.index<2)await (await control(page,'#actions [data-do="next"]')).click();
  }
  stage='native-backup';
  await page.goto(origin.base+'v2.html#trail');
  const button=page.locator('#main [data-do="export"]').first();await button.waitFor();
  const download=page.waitForEvent('download');await button.click();
  const raw=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 backup');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(positions.length===3&&errors.length===0,'three original sources, no page or external errors');
  console.log('P034_ORIGINAL_GROWING_BROWSER_OK '+JSON.stringify({
   head:sha,positions:positions.length,checks:checks.length,strictAApproved:false}));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(e.stack||String(e));process.exitCode=1;
 }finally{save();await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)main().catch(e=>{errors.push(String(e));save();console.error(e.stack||String(e));process.exitCode=1;});
