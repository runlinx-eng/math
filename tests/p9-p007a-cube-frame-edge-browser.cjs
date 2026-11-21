'use strict';
// #342 P007a: real original cube-edge buttons, two genuine Checks, State-v2/SW.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p007a-cube-frame-edge');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const specs=[
 {id:'shapeframe',index:2,node:'mt_2VR963szuk',
  hash:'1c0ff827c79b8f6dcd423ae54c45e4a9e39faba861dba0d6c4badbb155d5fd4e'},
 {id:'shapedraw',index:4,node:'mt_vJUa62bxeR',
  hash:'ccbb859c4d93758378686ab0e62edd7e69a3d3b137913aec8b14f144d537dbdd'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
  .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(condition,message)=>{assert.ok(condition,stage+': '+message);checks.push(stage+': '+message);};
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p007a-cube-frame-edge-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,physicalConstructionAssessed:false,
   spokenProofAssessed:false,childTrial:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,
  checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p007a-cube-frame-edge-evidence.js')).href);
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
   assert.equal(await loc.count(),1,stage+': exactly one native control');
   for(let tries=0;tries<10&&!(await loc.isVisible());tries++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': exactly one closed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const stick=async index=>{
   const loc=page.locator('#extra-controls [data-x="g23-stick"][data-index="'+index+'"]');
   await reveal(loc);await loc.click();
  };
  const answer=async(index,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="answers.'+index+'"]');
   await reveal(loc);await loc.fill(String(value));
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  for(const s of specs){
   const position=s.id+':'+s.index,taskContext={sessionId:s.id,index:s.index};
   const label=s.id+'-'+s.index;
   stage=position+':start';
   // A fresh document navigation is required: hash-only navigation keeps stale SW state.
   await page.goto(origin.base+'v2.html#trail');
   const navigation=await page.goto(origin.base+'learn.html#'+s.id);
   ok(navigation?.fromServiceWorker()===true,'native offline SW navigation');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.id);
   const existing=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=data.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P007a requires untouched native original task');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },s);
   ok(existing===0,'untouched original case before two Check attempts');
   const reload=await page.reload();
   ok(reload?.fromServiceWorker()===true,'chosen original task reloaded offline');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },s);
   const hash=digest(original.task);
   console.log('P007A_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,sha256:hash,nodeId:original.nodeId});
   ok(hash===s.hash&&original.nodeId===s.node&&
    original.task.type==='x-s23-frame'&&original.task.mode==='build'&&
    original.task.solid==='cube','full native source/task SHA and cube-build mode');
   ok(!!candidate.cubeFrameEdgeBinding(original.task,taskContext),
    'independent candidate source lock matches exact original task');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
    'standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
    'no unregistered strict A feedback');
   stage=position+':native-toggle-and-eleven-edges';
   await stick(0);await stick(0);await stick(0);
   for(let i=1;i<=10;i++)await stick(i);
   const incomplete=await capture(page,out,label,s,'eleven-edges');
   captures.push({position,phase:'eleven-edges',history:incomplete.model.history.length,
    edgeCount:incomplete.model.board.edges.length,attempts:incomplete.attempts.length});
   ok(incomplete.model.board.edges.length===11&&incomplete.attempts.length===0,
    'original edge toggle removes and re-adds edge, 11/12 not complete');
   const invalid=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    return {valid:api.valid(sessionTaskFor(id,index),model),
     correct:api.inspect(sessionTaskFor(id,index),model).correct};
   },{id:s.id,index:s.index,model:incomplete.model});
   ok(invalid.valid===true&&invalid.correct===false&&
    candidate.replayCubeFrameEdgeEvidence(original.task,incomplete.model,taskContext)===null,
    'original model valid but unfinished frame fails original and independent math');
   stage=position+':complete-frame-wrong-Check';
   await stick(11);
   await answer(0,'0');await answer(1,'12');await answer(2,'6');
   await check();
   const wrong=await capture(page,out,label,s,'wrong-check');
   captures.push({position,phase:'wrong-check',history:wrong.model.history.length,
    edgeCount:wrong.model.board.edges.length,attempts:wrong.attempts.length,
    storage:wrong.storage});
   ok(wrong.model.board.edges.length===12&&wrong.attempts.length===1,
    'first real Check retains complete edge frame and wrong answer');
   const originalWrong=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:s.id,index:s.index,model:wrong.model});
   ok(originalWrong===false&&
    candidate.replayCubeFrameEdgeEvidence(original.task,wrong.model,taskContext)===null,
    'wrong first Check is rejected by original and independent checks');
   stage=position+':corrected-Check';
   await answer(0,'8');
   await check();
   const good=await capture(page,out,label,s,'correct-check');
   captures.push({position,phase:'correct-check',history:good.model.history.length,
    edgeCount:good.model.board.edges.length,attempts:good.attempts.length,
    storage:good.storage});
   ok(good.attempts.length===2&&good.model.board.edges.length===12,
    'two original Check snapshots preserve frame and answer revision');
   const originalRight=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    return {valid:api.valid(sessionTaskFor(id,index),model),
     correct:api.inspect(sessionTaskFor(id,index),model).correct};
   },{id:s.id,index:s.index,model:good.model});
   ok(originalRight.valid===true&&originalRight.correct===true,
    'original native grader independently accepts corrected original task');
   const proof=candidate.submittedCubeFrameEdgeEvidence(
    original.task,good.model,good.record,taskContext);
   ok(proof?.kind==='native-cube-frame-edge-build'&&
    proof.originalCheckSnapshotsObserved===2&&
    proof.wrongToCorrectCheckRevisionObserved&&
    proof.originalStickEvents===14,'strict independent replay binds latest real Check');
   ok(proof.independentCubeGeometry.vertexCount===8&&
    proof.independentCubeGeometry.edgeCount===12&&
    proof.independentCubeGeometry.faceCount===6&&
    proof.independentCubeGeometry.vertexDegrees.every(d=>d===3),
    'independent 8 vertices 12 edges 6 faces and degree-3 cube invariant');
   ok(proof.observedEffectiveEdgeRemovals===1&&
    proof.observedEffectiveEdgeAdds===13&&
    !proof.independentPhysicalCubeConstructionObserved&&
    !proof.verbalGeometricProofAssessed&&!proof.strictAApproved,
    'original toggles only, no physical construction or formal A inferred');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.history[0].d.index='00';
   ok(!candidate.submittedCubeFrameEdgeEvidence(original.task,good.model,stale,taskContext)&&
    !candidate.replayCubeFrameEdgeEvidence(original.task,forged,taskContext)&&
    !candidate.replayCubeFrameEdgeEvidence(original.task,good.model,
      {sessionId:s.id,index:s.index+1}),
    'stale original Check, forged edge index and wrong position rejected');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);
   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected native task reloads offline');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
   const saved=await capture(page,out,label,s,'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'original model survives offline reload');
   assert.deepEqual(saved.record,good.record,'original Check snapshots survive offline reload');
  }
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const exportButton=page.locator('#main [data-do="export"]').first();
  await exportButton.waitFor();
  const download=page.waitForEvent('download');
  await exportButton.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
    'original State-v2 export, not an artificial fixture');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or unexpected external requests');
  persist();
  console.log('P007A_CUBE_FRAME_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
if(require.main===module)run().catch(e=>{
 console.error(e.stack||String(e));process.exitCode=1;
});
