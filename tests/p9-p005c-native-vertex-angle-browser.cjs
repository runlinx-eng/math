'use strict';
// #342 P005c: real B25 vertices UI across three original source-locked positions.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p005c-native-vertex-angles');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const NODE='mt_h0CVtqI2xo';
const cases=[
 {index:2,hash:'fe8d25eebb372ca59917395fad7ad2c641ebeb9e66b59da04e536e11850ffd4c',
  kind:'obtuse',expected:[2],wrong:0,answer:'1'},
 {index:3,hash:'3e545f1207fd64dcee25f76cc7449116ba45995afd385738fec4c7fce527b140',
  kind:'acute',expected:[0,2],wrong:1,answer:'2'},
 {index:4,hash:'e2b698087a7edc69401092db6ff10b55938c9b49caedb5dfaed420bef75e96c6',
  kind:'obtuse',expected:[1,3],wrong:0,answer:'2'}
];
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(v,msg)=>{assert.ok(v,stage+': '+msg);checks.push(stage+': '+msg);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p005c-native-vertex-angles-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,childTrial:false,verbalProofAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,
  checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p005c-native-vertex-angle-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?
    {executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',
   serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{
   if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
    errors.push(stage+': unexpected external request '+r.url());
  });
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original release cache identified');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': one closed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const click=async index=>{
   const loc=page.locator('#extra-controls [data-x="g25-choose"][data-index="'+index+'"]');
   await reveal(loc);await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };

  for(const spec of cases){
   const context={sessionId:'angletypes',index:spec.index};
   const position='angletypes:'+spec.index;
   const label='angletypes-'+spec.index;
   stage=position+':source';
   // Use full document navigations; same-document hash changes are not SW evidence.
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#angletypes');
   ok(nav?.fromServiceWorker()===true,'original lesson navigation is offline');
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='angletypes');
   const untouched=await page.evaluate(async index=>{
    const {packText,unpackText}=await import('./storage.js');
    const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=data.lessons.angletypes;
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P005c requires untouched original position '+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },spec.index);
   ok(untouched===0,'no seeded native Check for this position');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'original task reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const original=await page.evaluate(async index=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor('angletypes',index),nodeId:LESSONS.angletypes.topicId};
   },spec.index);
   const hash=digest(original.task);
   console.log('P005C_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({sessionId:'angletypes',index:spec.index,sha256:hash,nodeId:original.nodeId});
   ok(original.nodeId===NODE&&hash===spec.hash&&
      original.task.type==='x-g25-vertices'&&original.task.kind===spec.kind,
      'independent source and exact original runtime fingerprint');
   ok(!!candidate.vertexAngleBinding(original.task,context),
      'candidate source lock matches this exact native task');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
      'standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
      'no unregistered strict-A feedback');

   stage=position+':wrong-check';
   await click(spec.wrong);
   const ans=page.locator('#extra-controls [data-xfield="answers.0"]');
   await reveal(ans);await ans.fill(spec.answer);await ans.press('Tab');
   await check();
   const wrong=await capture(page,out,label,{id:'angletypes',index:spec.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    history:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'first wrong Check retained');
   const oldWrong=await page.evaluate(async({index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const native=await import('./learning/phase5/b25-model.js');
    return native.inspect(sessionTaskFor('angletypes',index),model).correct;
   },{index:spec.index,model:wrong.model});
   ok(oldWrong===false,'original grader rejects wrong vertex');
   ok(!candidate.replayVertexAngleEvidence(original.task,wrong.model,context),
      'independent math rejects wrong vertex');

   stage=position+':correct-check';
   await click(spec.wrong); // a genuine unchoose on original UI
   for(const i of spec.expected)await click(i);
   await check();
   const accepted=await capture(page,out,label,{id:'angletypes',index:spec.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:accepted.attempts.length,
    history:accepted.model.history.length,storage:accepted.storage});
   ok(accepted.attempts.length===2,'wrong and corrected original Checks retained');
   const oldOk=await page.evaluate(async({index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const native=await import('./learning/phase5/b25-model.js');
    return native.inspect(sessionTaskFor('angletypes',index),model).correct;
   },{index:spec.index,model:accepted.model});
   ok(oldOk===true,'original native grader accepts corrected vertex selection');
   const proof=candidate.submittedVertexAngleEvidence(
    original.task,accepted.model,accepted.record,context);
   ok(proof?.kind==='native-polygon-interior-angle-classification',
      'latest Check binds independent atan2 polygon proof');
   ok(JSON.stringify(proof.selectedVertexIndices)===JSON.stringify(spec.expected)&&
      proof.independentClassification.filter(x=>x===spec.kind).length===spec.expected.length,
      'independent interior angle kinds select exact original vertices');
   ok(proof.correctionObserved===true&&
      proof.originalControlEvents.some(e=>e.action==='unchoose'),
      'original wrong-to-correct toggling is replayable');
   const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
   const forged=structuredClone(accepted.model);
   forged.history[0].d.index='00';
   ok(!candidate.submittedVertexAngleEvidence(original.task,accepted.model,stale,context)&&
      !candidate.replayVertexAngleEvidence(original.task,forged,context)&&
      !candidate.replayVertexAngleEvidence(original.task,accepted.model,
       {sessionId:'angletypes',index:1}),
      'reject stale Check, forged event and wrong source position');
   ok(proof.strictAApproved===false&&!proof.verbalProofAssessed&&
      !proof.generalMasteryAssessed,'no invented proof or formal A status');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);

   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected native lesson reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const saved=await capture(page,out,label,{id:'angletypes',index:spec.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,accepted.model,'original B25 model survives offline reload');
   assert.deepEqual(saved.record,accepted.record,'both original Checks survive offline reload');
  }
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const dl=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await dl).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
     'real original State-v2 export across three native positions');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no page errors or external requests');
  persist();
  console.log('P005C_NATIVE_VERTEX_ANGLES_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:cases.length,checks:checks.length,strictAApproved:false}));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
