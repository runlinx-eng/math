'use strict';
// #342 P005j: original x-g25-corners in genuine 1920x1080 Chromium.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p005j-native-polygon-triangulation');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'triangleangles',index:1,node:'mt_cdMlC7EpTJ',n:4,
  hash:'0f6663f98f33d41c0a34325fa27fa2efccd210c8226ec84f54b54d2c780fd0c7'},
 {id:'triangleangles',index:2,node:'mt_cdMlC7EpTJ',n:6,
  hash:'147de24573fdcaf86536f966660dc6f70defc3f1c96a2b1d1f40c4ae83af2dec'},
 {id:'polygonangles',index:1,node:'mt_J03RFlVdas',n:6,
  hash:'07e4b762dc704c68929bf22c12cfa40b749813061618ad50bfee9da182053e11'},
 {id:'polygonangles',index:2,node:'mt_J03RFlVdas',n:5,
  hash:'27d4dadcb1c638fb86fcdd4497c8658ebaa9716293697d394b252d6fe0a28993'}
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
  schema:'math-p005j-native-polygon-triangulation-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,verbalProofAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p005j-native-polygon-triangulation-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?
    {executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
   errors.push(stage+': unexpected external request '+r.url());});
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
  const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!release,'original SW release available');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': unique original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': closed original details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const diagonal=async index=>{
   const loc=page.locator('#extra-controls [data-x="g25-diagonal"][data-index="'+index+'"]');
   await reveal(loc);await loc.click();
  };
  const answer=async(i,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="answers.'+i+'"]');
   await reveal(loc);
   if(await loc.evaluate(e=>e.tagName.toLowerCase()==='select'))
    await loc.selectOption(String(value));
   else{await loc.fill(String(value));await loc.press('Tab');}
  };
  const originalCheck=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  for(const spec of cases){
   const position=spec.id+':'+spec.index,label=spec.id+'-'+spec.index;
   const context={sessionId:spec.id,index:spec.index};
   stage=position+':source';
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#'+spec.id);
   ok(nav?.fromServiceWorker()===true,'original lesson opens offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=data.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('P005j requires untouched native position '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:spec.id,index:spec.index});
   ok(prior===0,'original position starts with no Check');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'native position reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:spec.id,index:spec.index});
   const hash=digest(original.task);
   console.log('P005J_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,sha256:hash,nodeId:original.nodeId});
   ok(original.nodeId===spec.node&&hash===spec.hash&&
      original.task.type==='x-g25-polygon','full runtime SHA/source/original polygon');
   ok(!!candidate.polygonBinding(original.task,context),'source-specific candidate binding');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
      'no unregistered strict-A thinking feedback');
   stage=position+':original-diagonal-fan';
   const order=Array.from({length:spec.n-3},(_,i)=>spec.n-2-i);
   for(const i of order)await diagonal(i);
   const chosen=await capture(page,out,label,{id:spec.id,index:spec.index},'original-fan');
   ok(chosen.model.board.diagonals.length===spec.n-3&&
      chosen.model.history.length===spec.n-3,
      'original UI records each non-adjacent diagonal exactly once');
   stage=position+':wrong-check';
   for(let i=0;i<original.task.questions.length;i++)
    await answer(i,i===0?999:original.task.questions[i].value);
   await originalCheck();
   const wrong=await capture(page,out,label,{id:spec.id,index:spec.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    history:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'wrong original Check preserved');
   ok(!candidate.replayPolygonEvidence(original.task,wrong.model,context),
      'independent mathematics refuses wrong Check');
   stage=position+':correct-check';
   await answer(0,original.task.questions[0].value);await originalCheck();
   const good=await capture(page,out,label,{id:spec.id,index:spec.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,
    history:good.model.history.length,storage:good.storage});
   ok(good.attempts.length===2,'wrong and corrected original Checks persist');
   const grade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b25-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:spec.id,index:spec.index,model:good.model});
   ok(grade===true,'original grader accepts corrected submission');
   const proof=candidate.submittedPolygonEvidence(original.task,good.model,good.record,context);
   ok(proof?.kind==='native-convex-polygon-fan-triangulation'&&
    Math.abs(proof.independentInteriorSumDegrees-(spec.n-2)*180)<1e-7&&
    Math.abs(proof.independentExteriorSumDegrees-360)<1e-7&&
    proof.originalDiagonalOrder.join(',')===order.join(','),
    'independent Euclidean fan areas, interior/exterior sums and original click history');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.history[0].a='test';
   ok(!candidate.submittedPolygonEvidence(original.task,good.model,stale,context)&&
    !candidate.replayPolygonEvidence(original.task,forged,context)&&
    !candidate.replayPolygonEvidence(original.task,good.model,{sessionId:spec.id,index:0}),
    'stale Check, forged history and wrong source rejected');
   ok(proof.strictAApproved===false&&!proof.verbalProofAssessed&&!proof.generalMasteryAssessed,
      'no formal-A or mastery claim');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected task reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const saved=await capture(page,out,label,{id:spec.id,index:spec.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'State-v2 original model survives offline');
   assert.deepEqual(saved.record,good.record,'original wrong and corrected Checks survive offline');
  }
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const dl=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await dl).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
      'original State-v2 exported with both position histories');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exception or unexpected external request');
  persist();
  console.log('P005J_NATIVE_POLYGON_TRIANGULATION_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:cases.length,checks:checks.length,strictAApproved:false
  }));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
