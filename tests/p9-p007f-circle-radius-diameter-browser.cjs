'use strict';
// #342 P007f: original B23 circle controls, actual Checks, State-v2 and stopped-origin SW.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p007f-circle-radius-diameter');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const specs=[
 {id:'circleparts',index:0,r:4.5,node:'mt_xq3YHZ2zeR',hash:'a1466d51fcca03b4c7946c32cf66db3dc1eea6a4bf0fff0b1baea449ee38a234'},
 {id:'circleparts',index:1,r:3,node:'mt_xq3YHZ2zeR',hash:'bd59fb60e1bd3b60d6f5a1b8d798b976020c1e398fe8e8ab8a8ad80b1fee6153'},
 {id:'circleparts',index:2,r:2,node:'mt_xq3YHZ2zeR',hash:'7f8e7528fbd4d96973c497478e732b2d213e2be8f92a64e691e8cd5fdd53ec27'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
let stage='startup';
const ok=(condition,label)=>{assert.ok(condition,stage+': '+label);checks.push(stage+': '+label);};
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p007f-native-circle-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,physicalCompassOrRulerSkillAssessed:false,
   fieldEditTimelinePersisted:false,childTrial:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p007f-circle-radius-diameter-evidence.js')).href);
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
    assert.equal(await parent.count(),1,stage+': one closed details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': native control visible');
  };
  const field=async(key,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+key+'"]');
   await reveal(loc);
   if(await loc.evaluate(el=>el.tagName==='SELECT'))await loc.selectOption(String(value));
   else await loc.fill(String(value));
  };
  const action=async name=>{
   const loc=page.locator('#extra-controls [data-x="g23-'+name+'"]');
   await reveal(loc);await loc.click();
  };
  const check=async()=>{
   const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();
  };
  for(const spec of specs){
   const position=spec.id+':'+spec.index,ctxSpec={sessionId:spec.id,index:spec.index};
   stage=position+':native-navigation';
   // Full navigation, never same-document hash-only switch.
   await page.goto(origin.base+'v2.html#trail');
   const nav=await page.goto(origin.base+'learn.html#circleparts');
   ok(nav?.fromServiceWorker()===true,'original lesson loaded via offline SW');
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='circleparts');
   const existing=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=data.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)
     throw Error('requires untouched original case');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases[index].attempts.length;
   },spec);
   ok(existing===0,'untouched original task');
   const load=await page.reload();
   ok(load?.fromServiceWorker()===true,'chosen native source reloaded offline');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
   const source=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },spec);
   const hash=digest(source.task);
   console.log('P007F_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({position,sha256:hash,nodeId:source.nodeId});
   ok(hash===spec.hash&&source.nodeId===spec.node&&
    source.task.type==='x-s23-circle'&&source.task.radius===spec.r,
    'full source/task SHA and native circle mode');
   ok(candidate.nativeCircleBinding(source.task,ctxSpec)?.strictAApproved===false,
    'independent source-locked circle binding');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
    'standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
    'candidate not registered as strict A feedback');
   stage=position+':before-circle';
   const before=await capture(page,out,position.replace(':','-'),spec,'before-circle');
   captures.push({position,phase:'before-circle',attempts:before.attempts.length,storage:before.storage});
   ok(before.model.history.length===0&&before.model.board.radius===null&&
    candidate.replayNativeCircleEvidence(source.task,before.model,ctxSpec)===null,
    'no circle before native actions');
   stage=position+':wrong-radius-circle';
   const operations=async radius=>{
    await field('radius',radius);await action('circle');
    await action('radial');await action('diameter');await action('rim');
    if(source.task.turn)await action('turn');
   };
   await operations(spec.r+1);
   for(let i=0;i<source.task.questions.length;i++)
    await field('answers.'+i,source.task.questions[i].value);
   const wrongBefore=await capture(page,out,position.replace(':','-'),spec,'wrong-before-check');
   captures.push({position,phase:'wrong-before-check',storage:wrongBefore.storage});
   ok(wrongBefore.model.board.radius===spec.r+1&&
    candidate.replayNativeCircleEvidence(source.task,wrongBefore.model,ctxSpec)===null,
    'original wrong-radius circle rejected independently');
   await check();
   const wrong=await capture(page,out,position.replace(':','-'),spec,'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,storage:wrong.storage});
   const wrongNative=await page.evaluate(async({model,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    return api.inspect(sessionTaskFor('circleparts',index),model).correct;
   },{model:wrong.model,index:spec.index});
   ok(wrong.attempts.length===1&&wrongNative===false,
    'wrong radius rejected by true native Check');
   stage=position+':correct-radius-redraw';
   await operations(spec.r);await check();
   const good=await capture(page,out,position.replace(':','-'),spec,'correct-check');
   captures.push({position,phase:'correct-check',attempts:good.attempts.length,storage:good.storage});
   const actual=await page.evaluate(async({model,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b23-model.js');
    const task=sessionTaskFor('circleparts',index);
    return {valid:api.valid(task,model),correct:api.inspect(task,model).correct};
   },{model:good.model,index:spec.index});
   ok(good.attempts.length===2&&actual.valid&&actual.correct,
    'corrected native source passes actual original Check');
   const proof=candidate.submittedNativeCircleEvidence(source.task,good.model,good.record,ctxSpec);
   ok(proof?.wrongToCorrectRadiusRedrawObserved&&proof.originalCircleDraws===2,
    'two original circle draws and true wrong-to-correct Check snapshots');
   ok(Math.abs(proof.independentGeometry.radiusCm-spec.r)<1e-10&&
    Math.abs(proof.independentGeometry.diameterCm-2*spec.r)<1e-10&&
    Math.abs(proof.independentGeometry.rotatedDiameterCm-2*spec.r)<1e-10&&
    proof.independentGeometry.rotationDegrees===(spec.index===1?45:0),
    'independent radius, diameter and rotation invariant');
   ok(!proof.physicalCompassOrRulerSkillAssessed&&!proof.strictAApproved,
    'no invented physical skill or formal A');
   const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
   const forged=structuredClone(good.model);forged.history[0].f.radius='-2';
   ok(!candidate.submittedNativeCircleEvidence(source.task,good.model,stale,ctxSpec)&&
    !candidate.replayNativeCircleEvidence(source.task,forged,ctxSpec)&&
    !candidate.replayNativeCircleEvidence(source.task,good.model,
      {sessionId:'circleparts',index:(spec.index+1)%3}),
    'stale Check, forged radius and adjacent native case rejected');
   const png='circleparts-'+spec.index+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'correct original case reloads offline');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
   const saved=await capture(page,out,position.replace(':','-'),spec,'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,storage:saved.storage});
   assert.deepEqual(saved.model,good.model,'native circle model survives offline reload');
   assert.deepEqual(saved.record,good.record,'native Check attempts survive offline reload');
  }
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const exportButton=page.locator('#main [data-do="export"]').first();
  await exportButton.waitFor();
  const download=page.waitForEvent('download');await exportButton.click();
  const raw=fs.readFileSync(await(await download).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
    'actual State-v2 export from native lesson');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser page errors or external requests');
  persist();
  console.log('P007F_CIRCLE_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
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
