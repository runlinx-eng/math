'use strict';
// Three original B05 two-sided balance tasks: bead buttons, wrong then correct
// actual prediction-and-release sequence, original Check, offline native V2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p030-native-balance');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let stage='init',browserVersion=null;
const checks=[],errors=[],positions=[];
const ok=(v,label)=>{assert.ok(v,stage+': '+label);checks.push(stage+': '+label);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
function save(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p030-original-balance-browser/1',testedCheckoutSha:sha,
  viewport:STANDARD_DESKTOP_VIEWPORT,chromium:browserVersion,
  originalControls:true,originalAttemptsSeeded:0,
  strictAApproved:false,checks,errors,positions
 },null,2)+'\n');
}
async function control(page,selector){
 let el=page.locator(selector);
 if(!(await el.count()))el=page.locator(selector.replace('#extra-controls ','.extra-controls '));
 if(!(await el.count()))el=page.locator(selector.replace('#extra-controls ','#extra-visual '));
 assert.equal(await el.count(),1,'unique original '+selector);
 for(let i=0;i<10&&!(await el.isVisible());i++){
  const closed=el.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await closed.count(),1,'one hidden original details');
  await closed.locator(':scope > summary').click();
 }
 assert.ok(await el.isVisible());return el;
}
async function set(page,key,value){
 const el=await control(page,'#extra-controls [data-xfield="'+key+'"]');
 if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(value));
 else{await el.fill(String(value));await el.press('Tab');}
}
async function action(page,name,side){
 let selector='#extra-controls [data-x="'+name+'"]';
 if(side)selector+='[data-side="'+side+'"][data-delta="1"]';
 await (await control(page,selector)).click();
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const entry=p=>import(pathToFileURL(path.join(root,p)).href);
 const ev=await entry('dist/learning/p030-native-balance-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const b05=await entry('dist/learning/phase4/b05-model.js');
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);browser=await chromium.launch({headless:true});browserVersion=browser.version();
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'current original SW release');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,'P030');
  ok((await page.goto(origin.base+'learn.html#equality'))?.fromServiceWorker()===true,
    'original equality lesson offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='equality');
  const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
  for(const src of ev.P030_BALANCE_SOURCES){
   const context={sessionId:'equality',index:src.index},task=sessionTaskFor('equality',src.index);
   stage='source-'+src.position;
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,src.index);
   ok(digest(task)===src.taskHash&&ev.p030BalanceBinding(task,context)?.nodeId===src.nodeId,
    'exact native source full SHA and node');
   for(let i=0;i<task.l;i++)await action(page,'balance-add','left');
   for(let i=0;i<task.r;i++)await action(page,'balance-add','right');
   const actual=task.l===task.r?'level':task.l>task.r?'left':'right';
   const wrong=actual==='level'?'right':'level';
   await set(page,'guess',wrong);
   await action(page,'balance-release');
   await set(page,'symbol',task.l===task.r?'equal':'different');
   stage='first-wrong-check-'+src.position;
   await (await control(page,'#actions [data-do="check"]')).click();
   const take=label=>capture(page,out,'equality-'+src.index,{id:'equality',index:src.index},label);
   const first=await take('wrong-check');
   ok(first.attempts.length===1&&!b05.inspect(task,first.model).correct,
    'wrong original prediction Check persisted');
   ok(ev.replayP030BalanceEvidence(task,first.model,context)===null,
    'wrong balance relation rejected');
   stage='second-correct-check-'+src.position;
   await set(page,'guess',actual);
   await action(page,'balance-release');
   const draft=await take('corrected-draft');
   ok(b05.inspect(task,draft.model).correct,'corrected original trial and mathematical relation');
   ok(ev.submittedP030BalanceEvidence(task,draft.model,draft.record,context)===null,
    'stale Check does not authorize changed model');
   await (await control(page,'#actions [data-do="check"]')).click();
   const good=await take('correct-check');
   const proof=ev.submittedP030BalanceEvidence(task,good.model,good.record,context);
   ok(good.attempts.length===2&&!!proof,'fresh correct Check and independent expression values');
   ok(proof.observedOrderedOriginalReleaseSnapshots.length===2&&
    !proof.strictAApproved&&!proof.individualBeadClickChronologyObserved,
    'two observed native release snapshots, no invented bead gestures');
   stage='native-offline-'+src.position;
   ok((await page.reload())?.fromServiceWorker()===true,'original stopped-origin offline reload');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,src.index);
   const saved=await take('offline-reload');
   assert.deepEqual(saved.model,good.model);assert.deepEqual(saved.record,good.record);
   ok(Boolean(ev.submittedP030BalanceEvidence(task,saved.model,saved.record,context)),
    'source-bound original State-v2 Check survives reload');
   await page.screenshot({path:path.join(out,'equality-'+src.index+'-correct.png'),fullPage:false});
   positions.push({position:src.position,taskHash:src.taskHash,
    originalWrongCorrectChecks:2,originalReleaseSnapshots:2,
    independentMath:true,strictAApproved:false});
   save();
   if(src.index<2)await (await control(page,'#actions [data-do="next"]')).click();
  }
  stage='native-serialize';
  await page.goto(origin.base+'v2.html#trail');
  const button=page.locator('#main [data-do="export"]').first();await button.waitFor();
  const dl=page.waitForEvent('download');await button.click();
  const raw=fs.readFileSync(await (await dl).path()),backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 backup exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(positions.length===3&&errors.length===0,'all three actual native sources without browser errors');
  console.log('P030_ORIGINAL_BALANCE_BROWSER_OK '+JSON.stringify({
   head:sha,positions:positions.length,checks:checks.length,strictAApproved:false}));
 }catch(err){
  errors.push(stage+': '+String(err));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(err.stack||String(err));process.exitCode=1;
 }finally{save();await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)run().catch(e=>{errors.push(String(e));save();console.error(e.stack||String(e));process.exitCode=1;});
