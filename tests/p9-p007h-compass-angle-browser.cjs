'use strict';
// #342 original B23 compass angle, real native Check, offline, raw State-v2.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-p007h-compass-angle');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec={id:'compasswork',index:1,node:'mt_ZrsqGVG-Wt',hash:'afc67970d24d820a8a7cedabd17eebeee81d46dbf74999cb27496b36bd029579'};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
let stage='startup';const ok=(v,s)=>{assert.ok(v,stage+': '+s);checks.push(stage+': '+s);};
function persist(){fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
 schema:'math-p007h-native-compass-browser/1',
 provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,runId:process.env.GITHUB_RUN_ID||null,
 strictAApproved:false,physicalCompassOrRulerSkillAssessed:false,childTrial:false},
 nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const cand=await import(pathToFileURL(path.join(root,'dist/learning/p007h-compass-angle-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
 origin=await createOrigin(root);
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
 ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
 ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
 page=await ctx.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(stage+': '+String(e)));
 ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
  errors.push(stage+': external '+r.url());});
 const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
 const release=sw.match(/const CACHE = '([^']+)'/)?.[1];ok(!!release,'original release cache');
 await page.goto(origin.base+'v2.html#trail');await page.locator('#main [data-do="export"]').first().waitFor();
 await warmAndStop(page,origin,release,ok,stage);
 const reveal=async loc=>{assert.equal(await loc.count(),1,stage+': exactly one control');
  for(let n=0;n<10&&!(await loc.isVisible());n++){
   const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
   assert.equal(await parent.count(),1);await parent.locator(':scope > summary').click();}
  assert.ok(await loc.isVisible(),stage+': native control visible');};
 const field=async(k,v)=>{const loc=page.locator('#extra-controls [data-xfield="'+k+'"]');
  await reveal(loc);if(await loc.evaluate(el=>el.tagName==='SELECT'))await loc.selectOption(String(v));
  else await loc.fill(String(v));};
 const action=async(a,index)=>{const loc=page.locator('#extra-controls [data-x="g23-'+a+'"]'+
  (index===undefined?'':'[data-index="'+index+'"]'));await reveal(loc);await loc.click();};
 const check=async()=>{const loc=page.locator('#actions [data-do="check"]');await reveal(loc);await loc.click();};
 const arc=async(center,r)=>{await field('center',center);await field('radius',r);await action('arc');};
 stage='native-source';
 await page.goto(origin.base+'v2.html#trail');
 const nav=await page.goto(origin.base+'learn.html#compasswork');
 ok(nav?.fromServiceWorker()===true,'real native lesson loaded through stopped-origin SW');
 await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='compasswork');
 const untouched=await page.evaluate(async({id,index})=>{
  const {packText,unpackText}=await import('./storage.js');
  const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  const lesson=state.lessons[id];
  if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('expected untouched original task');
  lesson.index=index;lesson.view='task';
  localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
  return lesson.cases?.[index]?.attempts?.length||0;
 },spec);
 ok(untouched===0,'untouched original source');
 const load=await page.reload();ok(load?.fromServiceWorker()===true,'original target reloaded offline');
 await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
 const source=await page.evaluate(async({id,index})=>{
  const {sessionTaskFor}=await import('./learning/bridges.js');
  const {LESSONS}=await import('./learning/catalog.js');
  return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
 },spec);
 const hash=digest(source.task);
 console.log('P007H_NATIVE_FULL_TASK_SHA256 compasswork:1 '+hash);
 nativeHashes.push({position:'compasswork:1',sha256:hash,nodeId:source.nodeId});
 ok(hash===spec.hash&&source.nodeId===spec.node&&source.task.mode==='angle',
  'full source SHA and original compass mode');
 ok(cand.nativeCompassBinding(source.task,{sessionId:spec.id,index:spec.index})?.strictAApproved===false,
  'independent native source-lock');
 ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'desktop viewport');
 ok(await page.locator('#thinking-feedback').count()===0,'not registered as strict A');
 stage='wrong-arcs';
 await arc('O',2);
 await arc('C',2);
 await arc('D',3);
 const before=await capture(page,out,'compasswork-1',spec,'wrong-before-check');
 captures.push({phase:'wrong-before-check',storage:before.storage});
 ok(!before.model.board.finished,'wrong unequal arc construction not complete');
 await check();
 const wrong=await capture(page,out,'compasswork-1',spec,'wrong-check');
 captures.push({phase:'wrong-check',attempts:wrong.attempts.length,storage:wrong.storage});
 const wrongGrade=await page.evaluate(async model=>{const {sessionTaskFor}=await import('./learning/bridges.js');
  const n=await import('./learning/phase5/b23-model.js');
  return n.inspect(sessionTaskFor('compasswork',1),model).correct;},wrong.model);
 ok(wrong.attempts.length===1&&!wrongGrade,'original wrong native Check');
 stage='correct-arcs';
 await arc('D',2);
 await action('meet',1);
 await action('line');
 await action('measure');
 await field('answers.0','45');await check();
 const good=await capture(page,out,'compasswork-1',spec,'good-check');
 captures.push({phase:'good-check',attempts:good.attempts.length,storage:good.storage});
 const grade=await page.evaluate(async model=>{const {sessionTaskFor}=await import('./learning/bridges.js');
  const n=await import('./learning/phase5/b23-model.js');
  const t=sessionTaskFor('compasswork',1);
  return {valid:n.valid(t,model),correct:n.inspect(t,model).correct};},good.model);
 ok(good.attempts.length===2&&grade.valid&&grade.correct,'original corrected native Check');
 const p=cand.submittedNativeCompassEvidence(source.task,good.model,good.record,
  {sessionId:spec.id,index:spec.index});
 ok(p?.wrongToCorrectArcConstructionObserved&&p.originalArcCount===4,
  'raw two original Check snapshots replayed');
 ok(JSON.stringify(p.independentGeometry.halfAnglesDegrees)===JSON.stringify([45,45]),
  'independent angle geometry');
 ok(!p.physicalCompassOrRulerSkillAssessed&&!p.strictAApproved,'no invented mastery/formal A');
 const forged=structuredClone(good.model);forged.history[0].f.radius='99';
 ok(!cand.replayNativeCompassEvidence(source.task,forged,{sessionId:'compasswork',index:1})&&
  !cand.submittedNativeCompassEvidence(source.task,good.model,{attempts:good.record.attempts.slice(0,1)},
   {sessionId:'compasswork',index:1}),'forged/old Check rejected');
 const png='compasswork-1-correct.png';
 await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
 stage='offline-reload';
 const offline=await page.reload();ok(offline?.fromServiceWorker()===true,'native case reload offline');
 await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
 const saved=await capture(page,out,'compasswork-1',spec,'offline-reload');
 captures.push({phase:'offline-reload',attempts:saved.attempts.length,storage:saved.storage});
 assert.deepEqual(saved.model,good.model);assert.deepEqual(saved.record,good.record);
 stage='native-state-v2-export';
 await page.goto(origin.base+'v2.html#trail');const exportBtn=page.locator('#main [data-do="export"]').first();
 await exportBtn.waitFor();const download=page.waitForEvent('download');await exportBtn.click();
 const raw=fs.readFileSync(await(await download).path()),v2=JSON.parse(raw.toString('utf8'));
 ok(v2.app==='math-explorer'&&v2.version===2,'actual full native State-v2 export');
 fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
 ok(errors.length===0,'no browser errors or external requests');
 persist();
 console.log('P007H_ANGLE_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
  head:sha,positions:1,checks:checks.length,strictAApproved:false}));
 }catch(e){errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
