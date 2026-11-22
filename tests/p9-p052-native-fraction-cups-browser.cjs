'use strict';
// One exact original legacy fractions-to-decimal cup task. Original real range
// and name inputs, wrong -> corrected native Check, stopped-origin offline and V2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p052-native-fraction-cups');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let stage='start',version=null;
const checks=[],errors=[],positions=[];
const ok=(value,detail)=>{assert.ok(value,stage+': '+detail);checks.push(stage+': '+detail);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
function save(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p052-original-fraction-cup-browser/1',testedCheckoutSha:sha,
  viewport:STANDARD_DESKTOP_VIEWPORT,chromium:version,
  originalControls:true,onlyLessonIndexSeeded:true,attemptsSeeded:0,
  strictAApproved:false,checks,positions,errors
 },null,2)+'\n');
}
async function get(page,selector){
 const c=page.locator(selector);assert.equal(await c.count(),1,'unique original '+selector);
 for(let k=0;k<10&&!(await c.isVisible());k++){
  const d=c.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await d.count(),1);await d.locator(':scope > summary').click();
 }
 assert.ok(await c.isVisible());return c;
}
async function range(page,index,target){
 const c=await get(page,'#work [data-height="'+index+'"]');
 const min=Number(await c.getAttribute('min')),max=Number(await c.getAttribute('max'));
 const step=Number(await c.getAttribute('step'));
 const r=await c.boundingBox(),prior=Number(await c.inputValue());
 assert.ok(r&&r.width>35&&step===5&&target>=min&&target<=max&&target%step===0,
   'original native cup slider geometry and step');
 const inset=Math.min(10,r.width/8);
 await c.click({position:{x:inset+(target-min)/(max-min)*(r.width-2*inset),y:r.height/2}});
 let n=Number(await c.inputValue());
 if(prior===target&&n===target){
  await c.focus();await c.press(target===max?'ArrowLeft':'ArrowRight');
  n=Number(await c.inputValue());
 }
 let i=0;
 while(n!==target&&i++<30){
  const key=n<target?'ArrowRight':'ArrowLeft';
  let next=n;
  for(let retry=0;retry<3&&next===n;retry++){
   await c.focus();await c.press(key);next=Number(await c.inputValue());
  }
  assert.ok(next!==n&&Math.abs(target-next)<Math.abs(target-n),'real cup slider converges');
  n=next;
 }
 assert.equal(n,target,'real original cup fills to precise target');
}
async function name(page,index,value){
 const c=await get(page,'#work [data-name="'+index+'"]');
 await c.fill(String(value));await c.press('Tab');
}
async function seedIndexOnly(page){
 return page.evaluate(async()=>{
  const {packText,unpackText}=await import('./storage.js');
  const original=localStorage.getItem('math-explorer-v2');
  if(!original)throw Error('missing original learning storage');
  const state=JSON.parse(unpackText(original)),lesson=state.lessons?.quarters;
  if(!lesson||lesson.cases?.[1]?.attempts?.length)
   throw Error('original task already checked or lesson absent');
  lesson.index=1;lesson.view='task';
  localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
  return true;
 });
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const entry=p=>import(pathToFileURL(path.join(root,p)).href);
 const ev=await entry('dist/learning/p052-native-fraction-cups-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const native=await entry('dist/learning/tasks.js');
 const context={sessionId:'quarters',index:1},task=sessionTaskFor('quarters',1);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);browser=await chromium.launch({headless:true});version=browser.version();
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original release available');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,'P052');
  ok((await page.goto(origin.base+'learn.html#quarters'))?.fromServiceWorker()===true,
    'original quarters lesson loads offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='quarters');
  const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
  stage='original-precise-source';
  ok(digest(task)===ev.P052_CUPS_SOURCE.taskHash&&
    ev.p052CupsBinding(task,context)?.nodeId===ev.P052_CUPS_SOURCE.nodeId,
    'source full original task SHA and node');
  ok(await seedIndexOnly(page),'no preloaded lesson work or Checks, only original index');
  ok((await page.reload())?.fromServiceWorker()===true,'original position restored offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===1);
  stage='three-original-cups-wrong-check';
  for(const [i,target]of [50,75,25].entries()){
   await range(page,i,target);
   await name(page,i,['0.5','0.75','0.25'][i]);
  }
  await name(page,0,'0.1');
  await (await get(page,'#actions [data-do="check"]')).click();
  const take=label=>capture(page,out,'quarters-1',{id:'quarters',index:1},label);
  const wrong=await take('wrong-check');
  ok(wrong.attempts.length===1&&!native.inspect(task,wrong.model).correct,
    'original wrong cup-number match recorded');
  ok(!ev.replayP052CupsEvidence(task,wrong.model,context),'independent wrong match rejection');
  await page.screenshot({path:path.join(out,'quarters-1-wrong.png'),fullPage:false});
  stage='corrected-original-check';
  await name(page,0,'0.5');
  const draft=await take('corrected-draft');
  ok(native.inspect(task,draft.model).correct,'original corrected three fraction matches');
  ok(!ev.submittedP052CupsEvidence(task,draft.model,draft.record,context),
    'stale original Check does not authorize changed work');
  await (await get(page,'#actions [data-do="check"]')).click();
  const good=await take('correct-check');
  const proof=ev.submittedP052CupsEvidence(task,good.model,good.record,context);
  ok(good.attempts.length===2&&!!proof,'two saved original Checks and bounded independent math');
  ok(!proof.strictAApproved&&!proof.originalHeightMovementChronologyObserved,'no invented gestures');
  await page.screenshot({path:path.join(out,'quarters-1-correct.png'),fullPage:false});
  stage='native-offline-reload';
  ok((await page.reload())?.fromServiceWorker()===true,'original offline browser reload');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===1);
  const saved=await take('offline-reload');
  assert.deepEqual(saved.model,good.model);assert.deepEqual(saved.record,good.record);
  ok(Boolean(ev.submittedP052CupsEvidence(task,saved.model,saved.record,context)),
   'original match evidence survives State-v2 offline reload');
  positions.push({position:'quarters:1',originalWrongCorrectChecks:2,
    sourceHash:ev.P052_CUPS_SOURCE.taskHash,strictAApproved:false});
  stage='original-State-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const dl=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await (await dl).path()),backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 backup exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(positions.length===1&&errors.length===0,'one original native source, no external requests');
  console.log('P052_ORIGINAL_FRACTION_CUPS_BROWSER_OK '+JSON.stringify({
   head:sha,positions:positions.length,checks:checks.length,strictAApproved:false}));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  save();await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{errors.push(String(e));save();console.error(e.stack||String(e));process.exitCode=1;});
