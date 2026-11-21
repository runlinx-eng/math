'use strict';
// #342 P004d: four native triangle point-drawing controls, original Check, SW, State-v2.
// No candidate module injection into the unregistered production offline cache.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p004d-triangle-drawing');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const specs=[
 {id:'shapehello',index:2,node:'mt_KJeEeTutJI'},
 {id:'shapeframe',index:0,node:'mt_2VR963szuk'},
 {id:'shapeidentity',index:0,node:'mt_bfhng6mOuy'},
 {id:'shapedraw',index:0,node:'mt_vJUa62bxeR'}
];
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(condition,message)=>{assert.ok(condition,stage+': '+message);checks.push(stage+': '+message);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p004d-triangle-drawing-browser/1',
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
  'dist/learning/p004d-triangle-drawing-evidence.js')).href);
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
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let attempts=0;attempts<10&&!(await loc.isVisible());attempts++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': single closed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const control=async(action,index)=>{
   const scope=action==='add'?'#extra-visual':'#extra-controls';
   const extra=action==='add'?'[data-index="'+index+'"]':'';
   const loc=page.locator(scope+' [data-x="g23-'+action+'"]'+extra);
   await reveal(loc);await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  for(const s of specs){
   const position=s.id+':'+s.index,taskContext={sessionId:s.id,index:s.index};
   stage=position+':start';
   // Always create a fresh real document navigation before changing position.
   await page.goto(origin.base+'v2.html#trail');
   const navigation=await page.goto(origin.base+'learn.html#'+s.id);
   ok(navigation?.fromServiceWorker()===true,'native offline SW navigation');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
   const existing=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=data.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P004d requires untouched native task');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },s);
   ok(existing===0,'native position has no seeded Check');
   const reload=await page.reload();
   ok(reload?.fromServiceWorker()===true,'chosen task reloaded offline');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
   const native=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },s);
   const hash=digest(native.task);
   console.log('P004D_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({sessionId:s.id,index:s.index,sha256:hash,nodeId:native.nodeId});
   ok(native.nodeId===s.node&&native.task.type==='x-s23-polygon'&&
    native.task.n===3&&native.task.kind==='any',
    'exact native source, three-point free triangle invariant');
   ok(!!candidate.triangleDrawingBinding(native.task,taskContext),
    'original task matches candidate source lock');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
    'standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
    'no unregistered strict-A feedback');
   stage=position+':collinear-rejected';
   for(const index of [8,9,10])await control('add',index);
   await control('close');
   const rejected=await capture(page,out,s.id+'-'+s.index,s,'collinear-close-rejected');
   captures.push({position,phase:'collinear-close-rejected',
    attempts:rejected.attempts.length,history:rejected.model.history.length});
   ok(!rejected.model.board.closed,'collinear points are not a closed triangle');
   ok(!candidate.replayTriangleDrawingEvidence(native.task,rejected.model,taskContext),
    'strict replay rejects collinear attempt');
   stage=position+':undo-and-correction';
   await control('undo');await control('add',38);await control('close');
   const answerLoc=(i)=>page.locator('#extra-controls [data-xfield="answers.'+i+'"]');
   const setAnswer=async(i,value)=>{
    const loc=answerLoc(i);await reveal(loc);
    const q=native.task.questions[i];
    if(q.options)await loc.selectOption(String(value));
    else await loc.fill(String(value));
   };
   for(const [i,q] of native.task.questions.entries())
    await setAnswer(i,i===0?(q.options?
      q.options.find(option=>String(option[0])!==String(q.value))?.[0]:
      '0'):q.value);
   await check();
   const wrong=await capture(page,out,s.id+'-'+s.index,s,'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    history:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'real wrong answer Check retained');
   const nativeWrong=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:wrong.model});
   ok(nativeWrong===false,'native grader rejects wrong answer');
   ok(!candidate.replayTriangleDrawingEvidence(native.task,wrong.model,taskContext),
    'strict replay also rejects wrong answer');
   stage=position+':corrected-check';
   await setAnswer(0,native.task.questions[0].value);
   await check();
   const accepted=await capture(page,out,s.id+'-'+s.index,s,'correct-check');
   captures.push({position,phase:'correct-check',attempts:accepted.attempts.length,
    history:accepted.model.history.length,storage:accepted.storage});
   ok(accepted.attempts.length===2,'wrong and corrected Check both retained');
   const nativeOk=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:accepted.model});
   ok(nativeOk===true,'original grader accepts corrected point drawing');
   const proof=candidate.submittedTriangleDrawingEvidence(
    native.task,accepted.model,accepted.record,taskContext);
   ok(proof?.kind==='native-triangle-point-construction',
    'latest original Check binds independent triangle replay');
   ok(JSON.stringify(proof.originalPointIndices)===JSON.stringify([8,9,38])&&
    proof.independentGeometry.areaSquareGridUnits>0,
    'original point order and independently calculated nonzero area');
   const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
   const forged=structuredClone(accepted.model);
   forged.history[0].d.index='08';
   ok(!candidate.submittedTriangleDrawingEvidence(native.task,accepted.model,stale,taskContext)&&
    !candidate.replayTriangleDrawingEvidence(native.task,forged,taskContext)&&
    !candidate.replayTriangleDrawingEvidence(native.task,accepted.model,
      {sessionId:s.id,index:s.index+1}),
    'stale Check, forged index and wrong source position rejected');
   ok(!proof.verbalJustificationObserved&&!proof.generalMasteryAssessed,
    'does not infer spoken geometric reasoning or mastery');
   const png=s.id+'-'+s.index+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);
   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected lesson reloads offline');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
   const saved=await capture(page,out,s.id+'-'+s.index,s,'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,accepted.model,'original model survives offline reload');
   assert.deepEqual(saved.record,accepted.record,'original Check history survives reload');
  }
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();
  await btn.waitFor();const download=page.waitForEvent('download');
  await btn.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
    'true original State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or external requests');
  persist();
  console.log('P004D_TRIANGLE_DRAWING_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:specs.length,checks:checks.length,strictAApproved:false}));
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
