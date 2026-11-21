'use strict';
// #342 native circle-pi original Check, SW stopped-origin reload, full State-v2 bytes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-p007k-circle-pi');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const spec={id:'shapefacts',index:2,nodeId:'mt_DNYQLahbfa',
 taskSha256:'bc230723f50cd5fc792097e4690916ea1b6c9cb2935c042f40005569f0d3c825'};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
let stage='startup';const ok=(v,s)=>{assert.ok(v,stage+': '+s);checks.push(stage+': '+s);};
function persist(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p007k-circle-pi-browser/1',provenance:{repository:'runlinx-eng/math',issue:342,
 headSha:sha,runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,physicalCompassOrRulerSkillAssessed:false},
 nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots},null,2)+'\n');}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const cand=await import(pathToFileURL(path.join(root,'dist/learning/p007k-circle-pi-evidence.js')).href);
 let origin,browser,ctx,page;
 try{
 origin=await createOrigin(root);
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
 ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
 ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
 page=await ctx.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(stage+': '+String(e)));
 ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))errors.push(stage+': external '+r.url());});
 const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8'),release=sw.match(/const CACHE = '([^']+)'/)?.[1];
 ok(!!release,'original SW release');
 await page.goto(origin.base+'v2.html#trail');await page.locator('#main [data-do="export"]').first().waitFor();
 await warmAndStop(page,origin,release,ok,stage);
 const reveal=async loc=>{assert.equal(await loc.count(),1,stage+': original control exactly once');
  for(let n=0;n<10&&!(await loc.isVisible());n++){const p=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await p.count(),1);await p.locator(':scope > summary').click();}
  assert.ok(await loc.isVisible(),stage+': original control visible');};
 const field=async(k,v)=>{const l=page.locator('#extra-controls [data-xfield="'+k+'"]');await reveal(l);
  if(await l.evaluate(el=>el.tagName==='SELECT'))await l.selectOption(String(v));else await l.fill(String(v));};
 const action=async(a)=>{const l=page.locator('#extra-controls [data-x="g23-'+a+'"]');await reveal(l);await l.click();};
 const check=async()=>{const l=page.locator('#actions [data-do="check"]');await reveal(l);await l.click();};
 stage='native-source';
 await page.goto(origin.base+'v2.html#trail');
 const nav=await page.goto(origin.base+'learn.html#shapefacts');
 ok(nav?.fromServiceWorker()===true,'original lesson offline');
 await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='shapefacts');
 const untouched=await page.evaluate(async({id,index})=>{
  const {packText,unpackText}=await import('./storage.js');
  const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  const l=state.lessons[id];if(!l||l.cases?.[index]?.attempts?.length)throw Error('original must be untouched');
  l.index=index;l.view='task';localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
  return l.cases?.[index]?.attempts?.length||0;
 },spec);
 ok(untouched===0,'untouched original native case');
 const load=await page.reload();ok(load?.fromServiceWorker()===true,'native target offline reload');
 await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,2);
 const source=await page.evaluate(async({id,index})=>{
  const {sessionTaskFor}=await import('./learning/bridges.js');const {LESSONS}=await import('./learning/catalog.js');
  return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
 },spec);
 const hash=digest(source.task);console.log('P007K_NATIVE_FULL_TASK_SHA256 shapefacts:2 '+hash);
 nativeHashes.push({position:'shapefacts:2',sha256:hash,nodeId:source.nodeId});
 ok(hash===spec.taskSha256&&source.nodeId===spec.nodeId&&source.task.type==='x-s23-circle',
  'full original source SHA and original circle type');
 ok(cand.nativeCirclePiBinding(source.task,{sessionId:'shapefacts',index:2})?.strictAApproved===false,
  'independent native source binding');
 ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'desktop viewport');
 ok(await page.locator('#thinking-feedback').count()===0,'not formally registered');
 const circle=async r=>{await field('radius',r);
  for(const a of ['circle','radial','diameter','rim'])await action(a);};
 stage='wrong-original-circle';
 await circle(5.5);await field('answers.0',9);await field('answers.1','pi');
 const before=await capture(page,out,'shapefacts-2',spec,'wrong-before-check');
 captures.push({phase:'wrong-before-check',storage:before.storage});
 await check();
 const wrong=await capture(page,out,'shapefacts-2',spec,'wrong-check');
 captures.push({phase:'wrong-check',attempts:wrong.attempts.length,storage:wrong.storage});
 ok(wrong.attempts.length===1,'wrong original Check recorded');
 stage='correct-original-circle';
 await circle(4.5);await check();
 const good=await capture(page,out,'shapefacts-2',spec,'correct-check');
 captures.push({phase:'correct-check',attempts:good.attempts.length,storage:good.storage});
 const grade=await page.evaluate(async model=>{
  const {sessionTaskFor}=await import('./learning/bridges.js');
  const n=await import('./learning/phase5/b23-model.js');
  const t=sessionTaskFor('shapefacts',2);
  return {valid:n.valid(t,model),correct:n.inspect(t,model).correct};
 },good.model);
 ok(good.attempts.length===2&&grade.valid&&grade.correct,'corrected real original Check');
 const proof=cand.submittedNativeCirclePiEvidence(source.task,good.model,good.record,{sessionId:'shapefacts',index:2});
 ok(proof?.wrongToCorrectCircleObserved&&proof.originalCircleDraws===2,'two original circles and Check snapshots');
 ok(proof.independentGeometry.diameterCm===9&&
  Math.abs(proof.independentGeometry.circumferenceToDiameterRatio-Math.PI)<1e-9,
  'independent circumference pi relation');
 ok(!proof.strictAApproved&&!proof.physicalCompassOrRulerSkillAssessed,'no invented formal A or physical skill');
 const stale={...good.record,attempts:good.record.attempts.slice(0,1)};
 ok(!cand.submittedNativeCirclePiEvidence(source.task,good.model,stale,{sessionId:'shapefacts',index:2}),
  'stale original Check rejected');
 const png='shapefacts-2-correct.png';await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
 stage='offline-reload';
 const offline=await page.reload();ok(offline?.fromServiceWorker()===true,'correct native case offline reload');
 await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,2);
 const saved=await capture(page,out,'shapefacts-2',spec,'offline-reload');
 captures.push({phase:'offline-reload',attempts:saved.attempts.length,storage:saved.storage});
 assert.deepEqual(saved.model,good.model);assert.deepEqual(saved.record,good.record);
 stage='native-state-v2-export';await page.goto(origin.base+'v2.html#trail');
 const exportBtn=page.locator('#main [data-do="export"]').first();
 await exportBtn.waitFor();const wait=page.waitForEvent('download');await exportBtn.click();
 const raw=fs.readFileSync(await(await wait).path()),v2=JSON.parse(raw.toString('utf8'));
 ok(v2.app==='math-explorer'&&v2.version===2,'true State-v2 native export');
 fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
 ok(errors.length===0,'no browser page errors/external requests');
 persist();console.log('P007K_CIRCLE_PI_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
 head:sha,positions:1,checks:checks.length,strictAApproved:false}));
 }catch(e){errors.push(stage+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
 persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
