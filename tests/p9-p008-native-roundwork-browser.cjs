'use strict';
// P008 development-only real Chromium: original B08 wrong -> corrected Check,
// authentic range input, SW offline reload, original State-v2 export.
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.env.MATH_P008_ARTIFACTS||path.join(root,'verification/p9-p008-native-roundwork'));
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const checks=[],observations=[],screenshots=[],errors=[];
let stage='startup',browserVersion=null;
const ok=(condition,label)=>{assert.ok(condition,stage+': '+label);checks.push(stage+': '+label);};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
async function control(page,selector){
 let element=page.locator(selector);
 if(!(await element.count()))element=page.locator(selector.replace('#extra-controls ','#extra-visual '));
 assert.equal(await element.count(),1,'one original control: '+selector);
 for(let attempt=0;attempt<10&&!(await element.isVisible());attempt++){
  const parent=element.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await parent.count(),1,'one original closed panel for '+selector);
  await parent.locator(':scope > summary').click();
 }
 assert.ok(await element.isVisible(),'visible original control '+selector);
 return element;
}
async function moveRange(input,target){
 const low=Number(await input.getAttribute('min')),high=Number(await input.getAttribute('max'));
 const step=Number(await input.getAttribute('step'))||1;
 const current=Number(await input.inputValue()),rect=await input.boundingBox();
 assert.ok(rect&&rect.width>35&&Number.isInteger(target)&&target>=low&&target<=high,
  'target inside actual native range');
 const inset=Math.min(10,rect.width/8);
 await input.click({position:{x:inset+(target-low)/(high-low)*(rect.width-2*inset),y:rect.height/2}});
 let n=Number(await input.inputValue());
 if(current===target&&n===target){
  await input.focus();await input.press(target===high?'ArrowLeft':'ArrowRight');
  n=Number(await input.inputValue());
 }
 let guard=0;
 while(n!==target&&guard++<100){
  const direction=n<target?'ArrowRight':'ArrowLeft';
  let next=n;
  for(let retry=0;retry<3&&next===n;retry++){
   await input.focus();await input.press(direction);
   next=Number(await input.inputValue());
  }
  assert.ok(next!==n&&Math.abs(next-target)<Math.abs(n-target),
   'actual slider cursor advances toward desired tick');
  n=next;
 }
 assert.equal(n,target,'original native slider reaches exact source tick');
}
async function fill(page,name,value){
 const element=await control(page,'#extra-controls [data-xfield="'+name+'"]');
 if(await element.getAttribute('type')==='range')await moveRange(element,Number(value));
 else if(await element.evaluate(el=>el.tagName)==='SELECT')await element.selectOption(String(value));
 else{await element.fill(String(value));await element.press('Tab');}
}
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p008-native-roundwork-browser/1',testedCheckoutSha:sha,
  originalControls:true,seededLessonPositionOnly:false,strictAApproved:false,
  chromium:browserVersion,viewport:STANDARD_DESKTOP_VIEWPORT,
  testedPositions:['roundwhole:0'],checks,observations,screenshots,errors
 },null,2)+'\n');
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const entry=name=>import(pathToFileURL(path.join(root,name)).href);
 const evidence=await entry('dist/learning/p008-native-roundwork-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const native=await entry('dist/learning/phase5/b08-model.js');
 const context={sessionId:'roundwhole',index:0},tag='roundwhole-0';
 const source=evidence.P008_ROUNDWORK_SOURCES.find(x=>x.sessionId===context.sessionId&&x.index===context.index);
 const task=sessionTaskFor(context.sessionId,context.index),solved=native.example(task);
 let origin,browser,browserContext,page;
 const snapshot=async label=>{
  const s=await capture(page,out,tag,{id:context.sessionId,index:context.index},label);
  observations.push({label,attempts:s.attempts.length,nativeCorrect:native.inspect(task,s.model).correct,
   sourceEvidence:Boolean(evidence.submittedP008RoundworkEvidence(task,s.model,s.record,context))});
  return s;
 };
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true});
  browserVersion=browser.version();
  browserContext=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await browserContext.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  browserContext.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  stage='native-exact-source';
  ok(source&&hash(task)===source.taskHash,'original complete task SHA-256');
  ok(evidence.p008RoundworkBinding(task,context)?.nodeId===source.nodeId,'exact native lesson node');
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW cache version');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,'P008');
  stage='original-offline-lesson';
  ok((await page.goto(origin.base+'learn.html#roundwhole'))?.fromServiceWorker()===true,'original lesson loaded offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='roundwhole');
  const start=page.locator('[data-do="start"]');
  if(await start.isVisible())await start.click();
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===0);
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 original browser viewport');
  stage='wrong-native-check';
  for(const k of ['low','high'])await fill(page,'steps.0.'+k,solved.steps[0][k]);
  await fill(page,'steps.0.mark',solved.steps[0].mark);
  await fill(page,'steps.0.result','0');
  await (await control(page,'#actions [data-do="check"]')).click();
  const wrong=await snapshot('wrong-check');
  ok(wrong.attempts.length===1&&!native.inspect(task,wrong.model).correct,'wrong Check preserved');
  ok(!evidence.replayP008RoundworkEvidence(task,wrong.model,context),'wrong result rejected');
  await page.screenshot({path:path.join(out,tag+'-wrong.png'),fullPage:false});
  screenshots.push(tag+'-wrong.png');
  stage='corrected-native-check';
  await fill(page,'steps.0.result',solved.steps[0].result);
  const draft=await snapshot('corrected-without-new-check');
  ok(native.inspect(task,draft.model).correct,'corrected original model');
  ok(!evidence.submittedP008RoundworkEvidence(task,draft.model,draft.record,context),'old Check cannot authorize changed draft');
  await (await control(page,'#actions [data-do="check"]')).click();
  const good=await snapshot('correct-check');
  const proof=evidence.submittedP008RoundworkEvidence(task,good.model,good.record,context);
  ok(good.attempts.length===2&&!!proof,'fresh correct Check and independent native math');
  ok(proof?.strictAApproved===false&&!proof.actionSequenceObserved,'evidence has honest limitation');
  await page.screenshot({path:path.join(out,tag+'-correct.png'),fullPage:false});
  screenshots.push(tag+'-correct.png');
  stage='native-offline-reload';
  ok((await page.reload())?.fromServiceWorker()===true,'source-stopped SW reload');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===0);
  const restored=await snapshot('offline-reload');
  assert.deepEqual(restored.model,good.model,'original State-v2 model preserved');
  assert.deepEqual(restored.record,good.record,'original wrong and correct attempts preserved');
  ok(Boolean(evidence.submittedP008RoundworkEvidence(task,restored.model,restored.record,context)),
   'proof survives genuine reload');
  stage='original-backup-export';
  await page.goto(origin.base+'v2.html#trail');
  const button=page.locator('#main [data-do="export"]').first();
  await button.waitFor();
  const download=page.waitForEvent('download');
  await button.click();
  const bytes=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(bytes.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 backup exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),bytes);
  ok(errors.length===0,'no original browser page errors or external requests');
  console.log('P008_ROUNDWORK_BROWSER_OK '+JSON.stringify({
   testedCheckoutSha:sha,positions:1,checks:checks.length,strictAApproved:false
  }));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  persist();
  await browserContext?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)main().catch(e=>{errors.push(String(e));persist();console.error(e.stack||String(e));process.exitCode=1;});
