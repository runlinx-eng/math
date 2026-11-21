'use strict';
// #342 P007g: real original B23 compass arc/meet/line UI, Check, offline and State-v2.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-p007g-compass-bisector');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec={id:'compasswork',index:0,node:'mt_ZrsqGVG-Wt',
 hash:'05568f1f7538a0362961fc24bb1411c5e568e36abc065c1f6b1598554150aaba'};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
let stage='startup';
const ok=(v,s)=>{assert.ok(v,stage+': '+s);checks.push(stage+': '+s);};
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p007g-native-compass-bisector-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,physicalCompassOrRulerSkillAssessed:false,
   fieldEditTimelinePersisted:false,childTrial:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,'dist/learning/p007g-compass-bisector-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
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
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': exactly one hidden details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const field=async(key,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+key+'"]');
   await reveal(loc);
   if(await loc.evaluate(el=>el.tagName==='SELECT'))await loc.selectOption(String(value));
   else await loc.fill(String(value));
  };
  const action=async(name,index)=>{
   const selector='#extra-controls [data-x="g23-'+name+'"]'+
    (index===undefined?'':'[data-index="'+index+'"]');
   const loc=page.locator(selector);await reveal(loc);await loc.click();
  };
  const arc=async(center,r)=>{await field('center',center);await field('radius',r);await action('arc');};
  const check=async()=>{const loc=page.locator('#actions [data-do="check"]');
   await reveal(loc);await loc.click();};
  stage='native-navigation';
  await page.goto(origin.base+'v2.html#trail');
  const nav=await page.goto(origin.base+'learn.html#compasswork');
  ok(nav?.fromServiceWorker()===true,'original compass lesson loaded offline');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='compasswork');
  const before=await page.evaluate(async({id,index})=>{
   const {packText,unpackText}=await import('./storage.js');
   const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=state.lessons[id];
   if(!lesson||lesson.cases?.[index]?.attempts?.length)
    throw Error('requires untouched original compass case');
   lesson.index=index;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
   return lesson.cases?.[index]?.attempts?.length||0;
  },spec);
  ok(before===0,'untouched real native source');
  const load=await page.reload();
  ok(load?.fromServiceWorker()===true,'chosen original source reloads offline');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
  const source=await page.evaluate(async({id,index})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
  },spec);
  const hash=digest(source.task);
  console.log('P007G_NATIVE_FULL_TASK_SHA256 compasswork:0 '+hash);
  nativeHashes.push({position:'compasswork:0',sha256:hash,nodeId:source.nodeId});
  ok(hash===spec.hash&&source.nodeId===spec.node&&
   source.task.type==='x-s23-compass'&&source.task.mode==='bisector',
   'exact source, full SHA and native bisector mode');
  ok(candidate.nativeCompassBisectorBinding(source.task,{sessionId:spec.id,index:spec.index})?.strictAApproved===false,
   'source-bound, independent and not formal strict A');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'standard desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,'candidate not registered in original feedback');
  stage='wrong-equal-radius-construction';
  await arc('A',5);await arc('B',4);await action('meet',0);
  const wrongBefore=await capture(page,out,'compasswork-0',spec,'wrong-before-check');
  captures.push({phase:'wrong-before-check',storage:wrongBefore.storage});
  ok(wrongBefore.model.board.circles.A===5&&wrongBefore.model.board.circles.B===4&&
   !wrongBefore.model.board.finished,
   'original unequal arcs and one marked intersection before Check');
  await check();
  const wrong=await capture(page,out,'compasswork-0',spec,'wrong-check');
  captures.push({phase:'wrong-check',attempts:wrong.attempts.length,storage:wrong.storage});
  const wrongNative=await page.evaluate(async({model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const native=await import('./learning/phase5/b23-model.js');
   return native.inspect(sessionTaskFor('compasswork',0),model).correct;
  },{model:wrong.model});
  ok(wrong.attempts.length===1&&wrongNative===false,'original native Check rejects unequal radii');
  stage='correct-equal-radius-construction';
  await arc('B',5);await action('meet',0);await action('meet',1);await action('line');
  await field('answers.0','equal');await check();
  const good=await capture(page,out,'compasswork-0',spec,'correct-check');
  captures.push({phase:'correct-check',attempts:good.attempts.length,storage:good.storage});
  const actual=await page.evaluate(async({model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const native=await import('./learning/phase5/b23-model.js');
   const task=sessionTaskFor('compasswork',0);
   return {valid:native.valid(task,model),correct:native.inspect(task,model).correct};
  },{model:good.model});
  ok(good.attempts.length===2&&actual.valid&&actual.correct,
   'corrected original arc construction passes real native Check');
  const proof=candidate.submittedNativeCompassBisectorEvidence(source.task,good.model,good.record,
   {sessionId:spec.id,index:spec.index});
  ok(proof?.wrongToCorrectEqualRadiusAndBisectorObserved&&proof.originalArcCount===3,
   'true original wrong-to-correct saved Check snapshots and three arcs');
  ok(proof.independentGeometry.arcRadius===5&&
   proof.independentGeometry.bisectorLength===8&&
   JSON.stringify(proof.independentGeometry.intersections)===JSON.stringify([[5,9],[5,1]])&&
   proof.independentGeometry.perpendicularAtMidpoint,
   'independent two-circle intersections and perpendicular midpoint theorem');
  ok(!proof.physicalCompassOrRulerSkillAssessed&&!proof.strictAApproved,
   'neither physical manipulation nor formal A claimed');
  const stale={...good.record,attempts:good.record.attempts.slice(0,-1)};
  const forged=structuredClone(good.model);forged.history[0].f.radius='-2';
  ok(!candidate.submittedNativeCompassBisectorEvidence(source.task,good.model,stale,
    {sessionId:'compasswork',index:0})&&
   !candidate.replayNativeCompassBisectorEvidence(source.task,forged,
    {sessionId:'compasswork',index:0})&&
   !candidate.replayNativeCompassBisectorEvidence(source.task,good.model,
    {sessionId:'compasswork',index:1}),
   'stale Check, forged arc and adjacent native source rejected');
  const png='compasswork-0-correct.png';
  await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
  stage='offline-reload';
  const offline=await page.reload();
  ok(offline?.fromServiceWorker()===true,'correct original case reloads offline');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,0);
  const saved=await capture(page,out,'compasswork-0',spec,'offline-reload');
  captures.push({phase:'offline-reload',attempts:saved.attempts.length,storage:saved.storage});
  assert.deepEqual(saved.model,good.model,'native compass model survives SW offline reload');
  assert.deepEqual(saved.record,good.record,'native Check history survives SW offline reload');
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const exportButton=page.locator('#main [data-do="export"]').first();
  await exportButton.waitFor();const wait=page.waitForEvent('download');
  await exportButton.click();const raw=fs.readFileSync(await(await wait).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'real native State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no page errors or external browser requests');
  persist();
  console.log('P007G_BISECTOR_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:1,checks:checks.length,strictAApproved:false}));
 }catch(e){
  errors.push(stage+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
