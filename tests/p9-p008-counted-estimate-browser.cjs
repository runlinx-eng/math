'use strict';
// Development-only genuine B07 path: faces100:0 and :1 original Checks/Next,
// then faces100:2 estimated guess, all original 38 dots, wrong -> correct Check,
// SW offline reload, original State-v2 export. No production activation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.env.MATH_P008_COUNT_ARTIFACTS||path.join(root,'verification/p9-p008-counted-estimate'));
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let stage='startup',chromiumVersion=null;
const checks=[],errors=[],screenshots=[],observations=[];
const ok=(value,label)=>{assert.ok(value,stage+': '+label);checks.push(stage+': '+label);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p008-native-counted-estimate-browser/1',testedCheckoutSha:head,
  originalControls:true,seededLessonPositionOnly:false,originalPrerequisiteChecks:2,
  strictAApproved:false,testedPositions:['faces100:2'],viewport:STANDARD_DESKTOP_VIEWPORT,
  chromium:chromiumVersion,checks,errors,screenshots,observations
 },null,2)+'\n');
}
async function control(page,selector){
 let loc=page.locator(selector);
 if(!(await loc.count()))loc=page.locator(selector.replace('#extra-controls ','#extra-visual '));
 assert.equal(await loc.count(),1,'unique original '+selector);
 for(let i=0;i<10&&!(await loc.isVisible());i++){
  const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await parent.count(),1,'visible ancestor for '+selector);
  await parent.locator(':scope > summary').click();
 }
 assert.ok(await loc.isVisible(),'visible '+selector);
 return loc;
}
async function fill(page,key,value){
 const loc=await control(page,'#extra-controls [data-xfield="'+key+'"]');
 if(await loc.getAttribute('type')==='range'){
  let n=Number(await loc.inputValue()),goal=Number(value);
  if(n===goal){await loc.press('ArrowRight');n=Number(await loc.inputValue());}
  let i=0;while(n!==goal&&i++<1001){
   await loc.press(n<goal?'ArrowRight':'ArrowLeft');
   const next=Number(await loc.inputValue());
   assert.notEqual(next,n,'real range tick');n=next;
  }
  assert.equal(n,goal);
 }else{await loc.fill(String(value));await loc.press('Tab');}
}
async function action(page,name,data={}){
 const q=Object.entries(data).map(([k,v])=>'[data-'+k+'="'+v+'"]').join('');
 await (await control(page,'#extra-visual [data-x="'+name+'"]'+q)).click();
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const entry=n=>import(pathToFileURL(path.join(root,n)).href);
 const evidence=await entry('dist/learning/p008-counted-estimate-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const b07=await entry('dist/learning/phase5/b07-model.js');
 const context={sessionId:'faces100',index:2},task=sessionTaskFor('faces100',2);
 let origin,browser,ctx,page;
 const read=async label=>{
  const snap=await capture(page,out,'faces100-2',{id:'faces100',index:2},label);
  observations.push({label,attempts:snap.attempts.length,
   correct:b07.inspect(task,snap.model).correct,
   accepted:Boolean(evidence.submittedP008CountedEstimateEvidence(task,snap.model,snap.record,context))});
  return snap;
 };
 try{
  origin=await createOrigin(root);browser=await chromium.launch({headless:true});
  chromiumVersion=browser.version();
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  stage='exact-original-source';
  const source=evidence.P008_COUNTED_ESTIMATE_SOURCE;
  ok(hash(task)===source.taskHash,'original complete task SHA256');
  ok(evidence.p008CountedEstimateBinding(task,context)?.nodeId===source.nodeId,'original source node');
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW cache name');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,'P008-count');
  ok((await page.goto(origin.base+'learn.html#faces100'))?.fromServiceWorker()===true,'original lesson offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='faces100');
  const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
  stage='original-prerequisite-0';
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===0);
  await fill(page,'mark',47);await fill(page,'left',40);await fill(page,'right',50);
  await (await control(page,'#actions [data-do="check"]')).click();
  ok((await page.evaluate(()=>window.mathLesson.snapshot().index))===0,'original first Check completed');
  await (await control(page,'#actions [data-do="next"]')).click();
  stage='original-prerequisite-1';
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===1);
  for(const [unit,count] of [[1,6],[2,3]])
   for(let i=0;i<count;i++)await action(page,'pv-add',{index:unit,delta:1});
  await action(page,'pv-save');
  await action(page,'pv-form',{form:'sticks'});
  for(const [unit,count] of [[1,6],[2,3]])
   for(let i=0;i<count;i++)await action(page,'pv-add',{index:unit,delta:1});
  await action(page,'pv-save');
  await action(page,'pv-cell',{index:63});
  await fill(page,'answer',63);
  await (await control(page,'#actions [data-do="check"]')).click();
  await (await control(page,'#actions [data-do="next"]')).click();
  stage='original-38-dot-count-and-wrong-check';
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===2);
  await fill(page,'guess',35);
  await action(page,'pv-predict');
  for(let i=0;i<task.n;i++)await action(page,'pv-tap',{index:i});
  await fill(page,'answer',37);
  await (await control(page,'#actions [data-do="check"]')).click();
  const wrong=await read('wrong-check');
  ok(wrong.attempts.length===1&&!b07.inspect(task,wrong.model).correct,'actual incorrect Check retained');
  ok(!evidence.replayP008CountedEstimateEvidence(task,wrong.model,context),'wrong count rejected');
  await page.screenshot({path:path.join(out,'faces100-2-wrong.png'),fullPage:false});
  screenshots.push('faces100-2-wrong.png');
  stage='original-corrected-fresh-check';
  await fill(page,'answer',38);
  const draft=await read('corrected-draft');
  ok(b07.inspect(task,draft.model).correct,'correct original native state before resubmission');
  ok(!evidence.submittedP008CountedEstimateEvidence(task,draft.model,draft.record,context),'stale Check rejected');
  await (await control(page,'#actions [data-do="check"]')).click();
  const good=await read('correct-check');
  const proof=evidence.submittedP008CountedEstimateEvidence(task,good.model,good.record,context);
  ok(good.attempts.length===2&&!!proof,'fresh correct Check with independent 38-dot proof');
  ok(!proof.strictAApproved&&!proof.originalDotSelectionChronologyObserved,'no imagined chronology');
  await page.screenshot({path:path.join(out,'faces100-2-correct.png'),fullPage:false});
  screenshots.push('faces100-2-correct.png');
  stage='offline-reload';
  ok((await page.reload())?.fromServiceWorker()===true,'offline original B07 reload');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===2);
  const persisted=await read('offline-reload');
  assert.deepEqual(persisted.model,good.model,'original State-v2 model preserved');
  assert.deepEqual(persisted.record,good.record,'original Check attempts preserved');
  ok(Boolean(evidence.submittedP008CountedEstimateEvidence(task,persisted.model,persisted.record,context)),
   'source-bound proof survives reload');
  stage='state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const button=page.locator('#main [data-do="export"]').first();await button.waitFor();
  const download=page.waitForEvent('download');await button.click();
  const bytes=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(bytes.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 JSON exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),bytes);
  ok(errors.length===0,'no page errors or external requests');
  console.log('P008_COUNTED_ESTIMATE_BROWSER_OK '+JSON.stringify({testedCheckoutSha:head,checks:checks.length,
   originalPrerequisiteChecks:2,positions:1,strictAApproved:false}));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  persist();await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{errors.push(String(e));persist();console.error(e.stack||String(e));process.exitCode=1;});
