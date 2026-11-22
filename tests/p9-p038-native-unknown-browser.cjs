'use strict';
// Genuine B05 x-unknown original controls for 3 P038 source positions.
// Wrong -> corrected native Checks, retained State-v2 after SW offline reload.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p038-native-unknown');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let stage='start',browserVersion=null;
const checks=[],errors=[],sources=[];
const ok=(v,text)=>{assert.ok(v,stage+': '+text);checks.push(stage+': '+text);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
function save(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p038-original-unknown-browser/1',testedCheckoutSha:head,
  chromium:browserVersion,viewport:STANDARD_DESKTOP_VIEWPORT,
  originalControls:true,originalAttemptsSeeded:0,seededLessonPositionOnly:false,
  strictAApproved:false,checks,errors,sources
 },null,2)+'\n');
}
async function control(page,selector){
 const c=page.locator(selector);
 assert.equal(await c.count(),1,'one original '+selector);
 for(let i=0;i<10&&!(await c.isVisible());i++){
  const parent=c.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await parent.count(),1,'one closed native panel');
  await parent.locator(':scope > summary').click();
 }
 assert.ok(await c.isVisible(),'native element visible');
 return c;
}
async function fill(page,key,value){
 const c=await control(page,'#extra-controls [data-xfield="'+key+'"]');
 if(await c.getAttribute('type')==='range'){
  let n=Number(await c.inputValue()),want=Number(value),i=0;
  if(n===want){await c.press('ArrowLeft');n=Number(await c.inputValue());}
  while(n!==want&&i++<80){
   const key=n<want?'ArrowRight':'ArrowLeft';
   await c.press(key);
   const next=Number(await c.inputValue());
   assert.ok(next!==n&&Math.abs(next-want)<Math.abs(n-want));
   n=next;
  }
  assert.equal(n,want);
 }else{await c.fill(String(value));await c.press('Tab');}
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const entry=p=>import(pathToFileURL(path.join(root,p)).href);
 const proof=await entry('dist/learning/p038-native-unknown-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const b05=await entry('dist/learning/phase4/b05-model.js');
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);browser=await chromium.launch({headless:true});
  browserVersion=browser.version();
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!cache,'current native offline SW cache');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,cache,ok,'P038');
  ok((await page.goto(origin.base+'learn.html#unknown'))?.fromServiceWorker()===true,
   'original lesson offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='unknown');
  const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
  for(const source of proof.P038_UNKNOWN_SOURCES){
   const context={sessionId:'unknown',index:source.index};
   const task=sessionTaskFor('unknown',source.index);
   stage='source-'+source.position;
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,source.index);
   ok(hash(task)===source.taskHash&&proof.p038UnknownBinding(task,context)?.nodeId===source.nodeId,
    'original task full SHA and correct node');
   await fill(page,'box',task.answer);
   await fill(page,'written',task.answer+1);
   await (await control(page,'#extra-controls [data-x="unknown-check"]')).click();
   stage='wrong-'+source.position;
   await (await control(page,'#actions [data-do="check"]')).click();
   const snap=label=>capture(page,out,'unknown-'+source.index,{id:'unknown',index:source.index},label);
   const wrong=await snap('wrong-check');
   ok(wrong.attempts.length===1&&!b05.inspect(task,wrong.model).correct,'real wrong Check saved');
   ok(proof.replayP038UnknownEvidence(task,wrong.model,context)===null,'reject wrong equation');
   stage='correct-'+source.position;
   await fill(page,'written',task.answer);
   const draft=await snap('corrected-draft');
   ok(b05.inspect(task,draft.model).correct,'correct native equation before Check');
   ok(proof.submittedP038UnknownEvidence(task,draft.model,draft.record,context)===null,
    'old wrong Check cannot certify altered draft');
   await (await control(page,'#actions [data-do="check"]')).click();
   const good=await snap('correct-check');
   const mathematical=proof.submittedP038UnknownEvidence(task,good.model,good.record,context);
   ok(good.attempts.length===2&&!!mathematical,
    'new original Check and independently verified equality');
   ok(!mathematical.strictAApproved&&!mathematical.actionChronologyObserved,
    'never invent original operation chronology');
   stage='offline-'+source.position;
   ok((await page.reload())?.fromServiceWorker()===true,'original SW offline reload');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,source.index);
   const saved=await snap('offline-reload');
   assert.deepEqual(saved.model,good.model);assert.deepEqual(saved.record,good.record);
   ok(!!proof.submittedP038UnknownEvidence(task,saved.model,saved.record,context),
    'proof remains after State-v2 offline reload');
   await page.screenshot({path:path.join(out,'unknown-'+source.index+'-correct.png'),fullPage:false});
   sources.push({position:source.position,taskHash:source.taskHash,
    originalWrongCorrectChecks:2,independentEquation:true,strictAApproved:false});
   save();
   if(source.index<2)await (await control(page,'#actions [data-do="next"]')).click();
  }
  stage='backup';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const download=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(sources.length===3&&errors.length===0,'all 3 source records verified without page errors');
  console.log('P038_UNKNOWN_ORIGINAL_BROWSER_OK '+JSON.stringify({
   testedCheckoutSha:head,positions:3,checks:checks.length,strictAApproved:false}));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  save();await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{errors.push(String(e));save();console.error(e.stack||String(e));process.exitCode=1;});
