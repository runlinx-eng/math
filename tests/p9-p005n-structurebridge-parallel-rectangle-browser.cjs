'use strict';
// #342 P005n native Chromium; original actions, wrong/correct Check, SW offline and State-v2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p005n-structurebridge-parallel-rectangle');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const position='structurebridge:0',node='mt_hImiKNiaNh';
const taskHash='5574b42f8ac8c33a3c07232a2784d22dfc88e25b0df58091122628b648517dc6';
const spec={id:'structurebridge',index:0},ctx={sessionId:spec.id,index:spec.index};
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[];
const ok=(cond,desc)=>{assert.ok(cond,stage+': '+desc);checks.push(stage+': '+desc);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p005n-structurebridge-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   physicalGeometryAssessed:false,verbalProofAssessed:false},
  position,node,taskHash,viewport:STANDARD_DESKTOP_VIEWPORT,
  checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p005n-structurebridge-parallel-rectangle-evidence.js')).href);
 let origin,browser,browserContext,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  browserContext=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await browserContext.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  browserContext.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': external request '+r.url());});
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const cache=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!cache,'current original SW release');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,cache,ok,stage);
  stage='original-offline-navigation';
  const nav=await page.goto(origin.base+'learn.html#'+spec.id);
  ok(nav?.fromServiceWorker()===true,'native lesson navigation served offline');
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
  const initialRecord=await page.evaluate(async({id,index})=>{
   const {packText,unpackText}=await import('./storage.js');
   const storage=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=storage.lessons[id];
   if(!lesson||lesson.cases?.[index]?.attempts?.length)
    throw Error('original task already has a submission');
   lesson.index=index;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(storage)));
   return lesson.cases?.[index]?.attempts?.length||0;
  },spec);
  ok(initialRecord===0,'no seeded original Check');
  const load=await page.reload();
  ok(load?.fromServiceWorker()===true,'original task reload from offline SW');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
  const original=await page.evaluate(async({id,index})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
  },spec);
  ok(original.nodeId===node&&original.task.type==='x-shapeangle'&&
   digest(original.task)===taskHash,'source, original native task and exact full fingerprint');
  console.log('P005N_NATIVE_FULL_TASK_SHA256 '+position+' '+digest(original.task));
  ok(!!candidate.structureBridgeBinding(original.task,ctx),'source-bound math candidate');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 real Chromium');
  ok(await page.locator('#thinking-feedback').count()===0,'no premature registered feedback');

  const reveal=async locator=>{
   assert.equal(await locator.count(),1,stage+': one original control');
   for(let i=0;i<10&&!await locator.isVisible();i++){
    const parent=locator.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': hidden details ancestor');
    await parent.locator(':scope > summary').click();
   }
   ok(await locator.isVisible(),'original control visible');
  };
  const click=async selector=>{const l=page.locator(selector);await reveal(l);await l.click();};
  const field=async(key,value)=>{
   const l=page.locator('#extra-controls [data-xfield="'+key+'"]');
   await reveal(l);
   const tag=await l.evaluate(el=>el.tagName);
   if(tag==='SELECT')await l.selectOption(String(value));
   else if(await l.getAttribute('type')==='range'){
    await l.evaluate((el,v)=>{
     const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
     setter.call(el,String(v));
     el.dispatchEvent(new Event('input',{bubbles:true}));
     el.dispatchEvent(new Event('change',{bubbles:true}));
    },String(value));
   }else{await l.fill(String(value));await l.press('Tab');}
  };
  stage='original-parallel-rectangle-actions';
  await click('#extra-visual [data-x="b15-parallel"][data-index="0"]');
  await click('#extra-visual [data-x="b15-parallel"][data-index="1"]');
  for(const value of [0,30,0]){
   await field('skew',value);
   await click('#extra-controls [data-x="b15-shape"]');
  }
  for(const key of ['angleB','angleC','angleD'])await field(key,90);
  await field('reason','opposite-adjacent');
  stage='original-wrong-check';
  await field('angleB',80);
  await click('#actions [data-do="check"]');
  const wrong=await capture(page,out,'structurebridge-0',spec,'wrong-check');
  captures.push({phase:'wrong-check',attempts:wrong.attempts.length,events:wrong.model.history.length,storage:wrong.storage});
  ok(wrong.attempts.length===1,'first incorrect Check recorded, not deleted');
  ok(!candidate.replayStructureBridgeEvidence(original.task,wrong.model,ctx),'wrong answer cannot prove geometry');
  stage='original-correct-check';
  await field('angleB',90);
  await click('#actions [data-do="check"]');
  const good=await capture(page,out,'structurebridge-0',spec,'correct-check');
  captures.push({phase:'correct-check',attempts:good.attempts.length,events:good.model.history.length,storage:good.storage});
  ok(good.attempts.length===2,'original wrong and corrected Checks preserved');
  const inspected=await page.evaluate(async({id,index,model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const b15=await import('./learning/phase5/b15-model.js');
   return b15.inspect(sessionTaskFor(id,index),model).correct;
  },{...spec,model:good.model});
  ok(inspected===true,'original native grader accepts corrected result');
  const proof=candidate.submittedStructureBridgeEvidence(original.task,good.model,good.record,ctx);
  ok(proof?.kind==='b15-native-parallelogram-rectangle-transformation'&&
     proof.independentlyVerifiedScreenArea===43400&&
     proof.independentlyVerifiedRightAnglesOnlyAtZeroSkew,'independent geometry and original event replay');
  ok(proof.originalParallelPairMarking.join(',')==='0,1'&&
     proof.originalCapturedSkewSequence.join(',')==='0,30,0',
     'original two parallel markings and three shape captures');
  const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
  const forged=structuredClone(good.model);forged.history[2].data.fields.skew='30';
  ok(!candidate.submittedStructureBridgeEvidence(original.task,good.model,stale,ctx)&&
     !candidate.replayStructureBridgeEvidence(original.task,forged,ctx)&&
     !candidate.replayStructureBridgeEvidence(original.task,good.model,{sessionId:spec.id,index:1}),
     'stale Check, forged history and wrong source fail closed');
  ok(proof.strictAApproved===false&&!proof.sliderMovementTimelineObserved&&
     !proof.freeGeometricProofAssessed,'no strict A or unobserved strategy claims');
  await page.screenshot({path:path.join(out,'structurebridge-0-correct.png'),fullPage:false});
  screenshots.push('structurebridge-0-correct.png');
  stage='original-offline-reload';
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'same original task reloads after origin stopped');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
  const saved=await capture(page,out,'structurebridge-0',spec,'offline-reload');
  captures.push({phase:'offline-reload',attempts:saved.attempts.length,events:saved.model.history.length,storage:saved.storage});
  assert.deepEqual(saved.model,good.model,'original model survives offline reload');
  assert.deepEqual(saved.record,good.record,'original Check history survives reload');
  stage='state-v2-backup-export';
  await page.goto(origin.base+'v2.html#trail');
  const exportBtn=page.locator('#main [data-do="export"]').first();
  await exportBtn.waitFor();
  const download=page.waitForEvent('download');
  await exportBtn.click();
  const raw=fs.readFileSync(await (await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original native V2 backup exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no page exceptions or outside requests');
  persist();
  console.log('P005N_STRUCTUREBRIDGE_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,position,checks:checks.length,strictAApproved:false
  }));
 }catch(error){
  errors.push(stage+': '+String(error));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(error?.stack||String(error));process.exitCode=1;
 }finally{
  await browserContext?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
