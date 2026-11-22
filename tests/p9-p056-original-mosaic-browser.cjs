'use strict';
// One exact original B03 x-mosaic: 16 real paint button actions, save,
// recolour four original cells to a distinct shape, wrong -> correct Check,
// offline reload and genuine State-v2 export. No model/attempt pre-seeding.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p056-original-mosaic');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let stage='start',browserVersion=null;
const checks=[],errors=[],screenshots=[],positions=[];
const ok=(v,s)=>{assert.ok(v,stage+': '+s);checks.push(stage+': '+s);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const save=()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p056-original-b03-mosaic/1',testedCheckoutSha:head,
 viewport:STANDARD_DESKTOP_VIEWPORT,chromium:browserVersion,
 originalControls:true,seededLessonPositionOnly:true,originalAttemptsSeeded:0,
 strictAApproved:false,checks,positions,errors,screenshots},null,2)+'\n');};
async function control(page,selector){
 let x=page.locator(selector);
 if(!(await x.count()))x=page.locator(selector.replace('#extra-controls ','.extra-controls '));
 if(!(await x.count()))x=page.locator(selector.replace('#extra-controls ','#extra-visual '));
 assert.equal(await x.count(),1,'original control exists '+selector);
 for(let i=0;i<10&&!(await x.isVisible());i++){
  const d=x.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await d.count(),1);await d.locator(':scope > summary').click();
 }
 assert.ok(await x.isVisible(),'visible original button '+selector);
 return x;
}
const act=async(page,name,index)=>{const suffix=index===undefined?'':'[data-index="'+index+'"]';
 await (await control(page,'#extra-visual [data-x="'+name+'"]'+suffix)).click();};
async function controlsAction(page,name,index){
 const suffix=index===undefined?'':'[data-index="'+index+'"]';
 await (await control(page,'#extra-controls [data-x="'+name+'"]'+suffix)).click();
}
async function field(page,key,value){
 const c=await control(page,'#extra-controls [data-xfield="'+key+'"]');
 await c.fill(String(value));await c.press('Tab');
}
async function positionOnly(page,index){
 return page.evaluate(async index=>{
  const {packText,unpackText}=await import('./storage.js');
  const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  const lesson=state.lessons?.equalparts;
  if(!lesson||lesson.cases?.[index]?.attempts?.length)
   throw Error('original position missing or prior saved Check');
  lesson.index=index;lesson.view='task';
  localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
  return true;
 },index);
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const entry=p=>import(pathToFileURL(path.join(root,p)).href);
 const source=await entry('dist/learning/p056-original-mosaic-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const model=await entry('dist/learning/phase4/b03-model.js');
 const context={sessionId:'equalparts',index:1},task=sessionTaskFor('equalparts',1);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);browser=await chromium.launch({headless:true});
  browserVersion=browser.version();
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(22000);
  page.on('pageerror',x=>errors.push(stage+': '+String(x)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'current original offline SW cache');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,'P056');
  ok((await page.goto(origin.base+'learn.html#equalparts'))?.fromServiceWorker()===true,
   'original B03 lesson offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='equalparts');
  const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
  stage='exact-source-original';
  ok(hash(task)===source.P056_MOSAIC_SOURCE.taskHash&&
    source.p056MosaicBinding(task,context)?.nodeId===source.P056_MOSAIC_SOURCE.nodeId,
   'exact original B03 source, node and full task fingerprint');
  ok(await positionOnly(page,1),'only original lesson position chosen');
  ok((await page.reload())?.fromServiceWorker()===true,'original B03 index restored offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===1);
  stage='original-first-16-cells';
  // First equal-area partition: four whole rows, each one colour.
  for(let color=0;color<4;color++){
   await controlsAction(page,'paint-color',color);
   for(let i=color*4;i<(color+1)*4;i++)await act(page,'paint',i);
  }
  await controlsAction(page,'save-mosaic');
  stage='genuinely-different-second-partition';
  // Four real recolours create distinct boundary geometry (not just a new palette).
  await controlsAction(page,'paint-color',2);
  await act(page,'paint',6);
  await act(page,'paint',7);
  await controlsAction(page,'paint-color',1);
  await act(page,'paint',8);
  await act(page,'paint',9);
  await field(page,'den',3);
  stage='wrong-original-check';
  await (await control(page,'#actions [data-do="check"]')).click();
  const snap=label=>capture(page,out,'equalparts-1',{id:'equalparts',index:1},label);
  const wrong=await snap('wrong-check');
  ok(wrong.attempts.length===1&&!model.inspect(task,wrong.model).correct,'original first wrong Check');
  ok(!source.replayP056MosaicEvidence(task,wrong.model,context),'reject wrong fraction report');
  await page.screenshot({path:path.join(out,'equalparts-1-wrong.png'),fullPage:false});
  screenshots.push('equalparts-1-wrong.png');
  stage='corrected-original-check';
  await field(page,'den',4);
  const draft=await snap('corrected-draft');
  ok(model.inspect(task,draft.model).correct,'original saved two forms and arithmetic valid');
  ok(!source.submittedP056MosaicEvidence(task,draft.model,draft.record,context),
   'old wrong Check cannot certify corrected model');
  await (await control(page,'#actions [data-do="check"]')).click();
  const good=await snap('correct-check');
  const proof=source.submittedP056MosaicEvidence(task,good.model,good.record,context);
  ok(good.attempts.length===2&&!!proof,'correct new original Check with independent equal areas');
  ok(!proof.strictAApproved&&!proof.paintActionChronologyObserved,'no invented original chronology');
  await page.screenshot({path:path.join(out,'equalparts-1-correct.png'),fullPage:false});
  screenshots.push('equalparts-1-correct.png');
  stage='native-offline-reload';
  ok((await page.reload())?.fromServiceWorker()===true,'offline original after Check');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===1);
  const persisted=await snap('offline-reload');
  assert.deepEqual(persisted.model,good.model);assert.deepEqual(persisted.record,good.record);
  ok(!!source.submittedP056MosaicEvidence(task,persisted.model,persisted.record,context),
   'saved original Check survives reload');
  positions.push({position:'equalparts:1',originalChecks:2,
   savedDistinctPartitions:1,originalPaintClicks:20,strictAApproved:false});
  stage='state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const button=page.locator('#main [data-do="export"]').first();await button.waitFor();
  const download=page.waitForEvent('download');await button.click();
  const raw=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(positions.length===1&&errors.length===0,'original checks and no page errors');
  console.log('P056_ORIGINAL_MOSAIC_BROWSER_OK '+JSON.stringify({
   testedCheckoutSha:head,checks:checks.length,positions:1,strictAApproved:false}));
 }catch(err){
  errors.push(stage+': '+String(err));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(err.stack||String(err));process.exitCode=1;
 }finally{
  save();await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(err=>{errors.push(String(err));save();console.error(err.stack||String(err));process.exitCode=1;});
