'use strict';
// #342 P007j original rectangle UI, exact source, true Check snapshots, offline State-v2.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const specs=[{"sessionId":"rectanglefacts","index":0,"nodeId":"mt_KFKUR_gBg_","sha":"51525557b3ab785b3a256fc25dd26a594c233e27f89c4022977b9e01d3f4703b","prompt":"一边8厘米，周长28厘米。先想另一边，再画出长方形。","w":8,"h":6,"questions":[{"label":"另一边多少厘米","value":6}],"inference":"perimeter"},{"sessionId":"rectanglefacts","index":1,"nodeId":"mt_KFKUR_gBg_","sha":"5ead1dacb723f7815f8644c3ca88a37f9441430aa415fe830d521b54b5a097e0","prompt":"画长7厘米、宽3厘米的长方形，看看每个角。","w":7,"h":3,"questions":[{"label":"每个角多少度","value":90}],"inference":"right-angles"},{"sessionId":"rectanglefacts","index":2,"nodeId":"mt_KFKUR_gBg_","sha":"0426eaa9e4788cbcddee61834514a651dbb9bc068f45e3fc9f3abf3b7e856110","prompt":"一边6厘米，面积24平方厘米。先找另一边，再画出来。","w":6,"h":4,"questions":[{"label":"另一边多少厘米","value":4},{"label":"周长多少厘米","value":20}],"inference":"area"}];
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-p007j-rectangle-invariants');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
let stage='startup';const ok=(v,s)=>{assert.ok(v,stage+': '+s);checks.push(stage+': '+s);};
function persist(){fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({schema:'math-p007j-native-rectangle-browser/1',
 provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,runId:process.env.GITHUB_RUN_ID||null,
 strictAApproved:false,physicalRulerSkillAssessed:false,childTrial:false},
 nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots},null,2)+'\n');}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,'dist/learning/p007j-rectangle-invariants-evidence.js')).href);
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
 ok(!!release,'original release cache identified');
 await page.goto(origin.base+'v2.html#trail');await page.locator('#main [data-do="export"]').first().waitFor();
 await warmAndStop(page,origin,release,ok,stage);
 const reveal=async loc=>{assert.equal(await loc.count(),1,stage+': one original control');
  for(let n=0;n<10&&!(await loc.isVisible());n++){
   const p=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
   assert.equal(await p.count(),1);await p.locator(':scope > summary').click();}
  assert.ok(await loc.isVisible(),stage+': original control visible');};
 const field=async(k,v)=>{const loc=page.locator('#extra-controls [data-xfield="'+k+'"]');await reveal(loc);
  if(await loc.evaluate(el=>el.tagName==='SELECT'))await loc.selectOption(String(v));else await loc.fill(String(v));};
 const action=async(name)=>{const loc=page.locator('#extra-controls [data-x="g23-'+name+'"]');
  await reveal(loc);await loc.click();};
 const check=async()=>{const loc=page.locator('#actions [data-do="check"]');await reveal(loc);await loc.click();};
 for(const s of specs){
  const position=s.sessionId+':'+s.index,label='rectanglefacts-'+s.index;
  stage=position+':native-source';
  await page.goto(origin.base+'v2.html#trail');
  const nav=await page.goto(origin.base+'learn.html#rectanglefacts');
  ok(nav?.fromServiceWorker()===true,'lesson loaded offline via SW');
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='rectanglefacts');
  const untouched=await page.evaluate(async({id,index})=>{
   const {packText,unpackText}=await import('./storage.js');
   const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const l=state.lessons[id];if(!l||l.cases?.[index]?.attempts?.length)
    throw Error('expected untouched original rectangle');
   l.index=index;l.view='task';localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
   return l.cases?.[index]?.attempts?.length||0;
  },{id:s.sessionId,index:s.index});
  ok(untouched===0,'untouched original source');
  const load=await page.reload();ok(load?.fromServiceWorker()===true,'original target reload offline');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
  const source=await page.evaluate(async({id,index})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {LESSONS}=await import('./learning/catalog.js');
   return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
  },{id:s.sessionId,index:s.index});
  const hash=digest(source.task);console.log('P007J_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
  nativeHashes.push({position,sha256:hash,nodeId:source.nodeId});
  ok(hash===s.sha&&source.nodeId===s.nodeId&&source.task.type==='x-s23-ruler'&&source.task.mode==='rectangle',
   'exact native source, task SHA and rectangle type');
  ok(candidate.nativeRectangleBinding(source.task,{sessionId:s.sessionId,index:s.index})?.strictAApproved===false,
   'independent source lock and no formal A');
  ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'desktop viewport');
  ok(await page.locator('#thinking-feedback').count()===0,'not registered as strict A');
  stage=position+':wrong-original-draw';
  await field('first',s.w-1);await field('second',s.h);await action('draw');
  for(let i=0;i<s.questions.length;i++)await field('answers.'+i,s.questions[i].value);
  const before=await capture(page,out,label,s,'wrong-before-check');
  captures.push({position,phase:'wrong-before-check',storage:before.storage});
  await check();
  const wrong=await capture(page,out,label,s,'wrong-check');
  captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,storage:wrong.storage});
  const wrongGrade=await page.evaluate(async({index,model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const n=await import('./learning/phase5/b23-model.js');
   return n.inspect(sessionTaskFor('rectanglefacts',index),model).correct;
  },{index:s.index,model:wrong.model});
  ok(wrong.attempts.length===1&&!wrongGrade,'true wrong original Check');
  stage=position+':correct-original-draw';
  await field('first',s.w);await action('draw');await check();
  const good=await capture(page,out,label,s,'correct-check');
  captures.push({position,phase:'correct-check',attempts:good.attempts.length,storage:good.storage});
  const actual=await page.evaluate(async({index,model})=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const n=await import('./learning/phase5/b23-model.js');
   const t=sessionTaskFor('rectanglefacts',index);
   return {valid:n.valid(t,model),correct:n.inspect(t,model).correct};
  },{index:s.index,model:good.model});
  ok(good.attempts.length===2&&actual.valid&&actual.correct,'real corrected Check');
  const proof=candidate.submittedNativeRectangleEvidence(source.task,good.model,good.record,{sessionId:s.sessionId,index:s.index});
  ok(proof?.wrongToCorrectNativeDrawObserved&&proof.originalDraws===2,'two raw Check snapshots, two original draws');
  ok(proof.independentGeometry.areaSquareCm===s.w*s.h&&
   proof.independentGeometry.perimeterCm===2*(s.w+s.h)&&
   proof.independentGeometry.inferredMissingSideCm===s.h,
   'independent original rectangle geometry and inverse relation');
  ok(!proof.strictAApproved&&!proof.physicalRulerSkillAssessed,'no invented physical learning/formal A');
  const tampered=structuredClone(good.model);tampered.history[0].f.first='0';
  ok(!candidate.replayNativeRectangleEvidence(source.task,tampered,{sessionId:s.sessionId,index:s.index})&&
   !candidate.replayNativeRectangleEvidence(source.task,good.model,{sessionId:s.sessionId,index:(s.index+1)%3}),
   'wrong original history/neighbor rejected');
  const png=label+'-correct.png';await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
  stage=position+':offline-reload';
  const offline=await page.reload();ok(offline?.fromServiceWorker()===true,'native case offline reload');
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
  const saved=await capture(page,out,label,s,'offline-reload');
  captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,storage:saved.storage});
  assert.deepEqual(saved.model,good.model);assert.deepEqual(saved.record,good.record);
 }
 stage='native-state-v2-export';await page.goto(origin.base+'v2.html#trail');
 const exportBtn=page.locator('#main [data-do="export"]').first();
 await exportBtn.waitFor();const wait=page.waitForEvent('download');await exportBtn.click();
 const raw=fs.readFileSync(await(await wait).path()),v2=JSON.parse(raw.toString('utf8'));
 ok(v2.app==='math-explorer'&&v2.version===2,'full native State-v2 exported');
 fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
 ok(errors.length===0,'no browser errors or external requests');
 persist();console.log('P007J_RECTANGLE_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
 head:sha,positions:specs.length,checks:checks.length,strictAApproved:false}));
 }catch(e){errors.push(stage+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
 persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
