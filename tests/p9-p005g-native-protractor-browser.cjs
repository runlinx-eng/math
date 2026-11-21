'use strict';
// #342 P005g native three-position protractor, original UI and State-v2 evidence.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p005g-native-protractor');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cases=[
 {id:'angleprotractor',index:0,node:'mt_4MFUAsbx_6',mode:'measure',amount:47,
  hash:'107b5a8506ea58a40654d33f663faf8cc36d1060cbf5e3b6c890c95801bb126a'},
 {id:'angleprotractor',index:1,node:'mt_4MFUAsbx_6',mode:'draw',amount:135,
  hash:'b59a56720e76b1c137285af1f28c5a39215295ffe87712266a187c8d98fedc42'},
 {id:'angleprotractor',index:2,node:'mt_4MFUAsbx_6',mode:'measure',amount:130,
  hash:'38f731b2d957fd5a6bd7befea7ba52703a90d8ebe014cfaec13f0a82ed75440d'}
];
let stage='startup';
const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
const ok=(v,msg)=>{assert.ok(v,stage+': '+msg);checks.push(stage+': '+msg);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p005g-native-protractor-browser/1',
  provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   originalControls:true,childTrial:false,physicalProtractorAssessed:false},
  nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 const candidate=await import(pathToFileURL(path.join(root,
  'dist/learning/p005g-native-protractor-evidence.js')).href);
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
  ok(!!release,'original SW release identified');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async loc=>{
   assert.equal(await loc.count(),1,stage+': exactly one original control');
   for(let n=0;n<10&&!(await loc.isVisible());n++){
    const parent=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,stage+': closed original details ancestor');
    await parent.locator(':scope > summary').click();
   }
   assert.ok(await loc.isVisible(),stage+': original control visible');
  };
  const click=async (action,index)=>{
   const loc=page.locator('#extra-controls [data-x="g25-'+action+'"]'
    +(index===undefined?'':'[data-index="'+index+'"]'));
   await reveal(loc);await loc.click();
  };
  const fill=async (name,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+name+'"]');
   await reveal(loc);await loc.fill(String(value));await loc.press('Tab');
  };
  const answer=async (i,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="answers.'+i+'"]');
   await reveal(loc);
   if(await loc.evaluate(e=>e.tagName.toLowerCase()==='select'))await loc.selectOption(String(value));
   else{await loc.fill(String(value));await loc.press('Tab');}
  };
  const check=async()=>{
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
     throw Error('P005g requires untouched native position '+id+':'+index);
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
    return lesson.cases?.[index]?.attempts?.length||0;
   },{id:spec.id,index:spec.index});
   ok(prior===0,'original position has no preseeded Check');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,'original native position reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
   },{id:spec.id,index:spec.index});
   const hash=digest(original.task);
   console.log('P005G_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
   nativeHashes.push({sessionId:spec.id,index:spec.index,sha256:hash,nodeId:original.nodeId});
   ok(original.nodeId===spec.node&&hash===spec.hash&&
      original.task.type==='x-g25-protractor'&&
      original.task.mode===spec.mode&&original.task.amount===spec.amount,
      'source/full runtime SHA/native protractor mode match');
   ok(!!candidate.protractorBinding(original.task,context),
      'candidate binds exact original source only');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
      'standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,
      'no unregistered strict-A feedback');

   stage=position+':align';
   await click('move','right');await click('move','right');
   await click('move','up');await click('flip');
   const aligned=await capture(page,out,label,{id:spec.id,index:spec.index},'aligned');
   ok(aligned.model.board.x===0&&aligned.model.board.y===0&&aligned.model.board.rotation===0,
      'real move/move/move/flip aligned center and zero scale');
   stage=position+':wrong-check';
   if(spec.mode==='draw'){await fill('angle',50);await click('draw');}
   else await answer(0,50);
   if(spec.mode==='draw')await answer(0,spec.amount);
   if(spec.index===2)await answer(1,'recheck');
   await check();
   const wrong=await capture(page,out,label,{id:spec.id,index:spec.index},'wrong-check');
   captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,
    history:wrong.model.history.length,storage:wrong.storage});
   ok(wrong.attempts.length===1,'original wrong Check retained');
   const wrongGrade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b25-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:spec.id,index:spec.index,model:wrong.model});
   ok(wrongGrade===false,'original grader rejects wrong measurement/drawing');
   ok(!candidate.replayProtractorEvidence(original.task,wrong.model,context),
      'independent replay rejects wrong final result');

   stage=position+':correct-check';
   if(spec.mode==='draw'){await fill('angle',spec.amount);await click('draw');}
   else await answer(0,spec.amount);
   await check();
   const accepted=await capture(page,out,label,{id:spec.id,index:spec.index},'correct-check');
   captures.push({position,phase:'correct-check',attempts:accepted.attempts.length,
    history:accepted.model.history.length,storage:accepted.storage});
   ok(accepted.attempts.length===2,'wrong and corrected Checks both retained');
   const correctGrade=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const api=await import('./learning/phase5/b25-model.js');
    return api.inspect(sessionTaskFor(id,index),model).correct;
   },{id:spec.id,index:spec.index,model:accepted.model});
   ok(correctGrade===true,'original grader accepts corrected operation');
   const proof=candidate.submittedProtractorEvidence(
    original.task,accepted.model,accepted.record,context);
   ok(proof?.kind==='native-protractor-alignment',
      'original latest Check binds independent protractor replay');
   ok(proof.targetDegrees===spec.amount&&
      Math.abs(proof.independentlyObservedDegrees-spec.amount)<1e-8&&
      proof.alignedCenter[0]===0&&proof.alignedCenter[1]===0&&
      proof.zeroLineRotationDegrees===0,
      'geometric invariant and aligned native controls');
   ok(proof.drawCorrectionObserved===(spec.mode==='draw')&&
      proof.originalControlEvents.length===(spec.mode==='draw'?6:4),
      'native moves/flip and draw correction history without invented events');
   const stale={...accepted.record,attempts:accepted.record.attempts.slice(0,-1)};
   const forged=structuredClone(accepted.model);forged.history[0].d.index='left';
   ok(!candidate.submittedProtractorEvidence(original.task,accepted.model,stale,context)&&
      !candidate.replayProtractorEvidence(original.task,forged,context)&&
      !candidate.replayProtractorEvidence(original.task,accepted.model,
       {sessionId:spec.id,index:999}),
      'reject stale last Check, forged movement and wrong native identity');
   ok(proof.strictAApproved===false&&!proof.physicalProtractorAssessed&&
      !proof.generalMasteryAssessed,
      'no physical measurement or formal A inferred');
   const png=label+'-correct.png';
   await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);

   stage=position+':offline-reload';
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'corrected native lesson reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,spec.index);
   const saved=await capture(page,out,label,{id:spec.id,index:spec.index},'offline-reload');
   captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,
    history:saved.model.history.length,storage:saved.storage});
   assert.deepEqual(saved.model,accepted.model,'original protractor model survives offline');
   assert.deepEqual(saved.record,accepted.record,'original native Check history survives offline');
  }
  stage='native-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const btn=page.locator('#main [data-do="export"]').first();await btn.waitFor();
  const dl=page.waitForEvent('download');await btn.click();
  const raw=fs.readFileSync(await(await dl).path());
  const backup=JSON.parse(raw.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,
     'original State-v2 export includes all three protractor positions');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser exceptions or unexpected external requests');
  persist();
  console.log('P005G_NATIVE_PROTRACTOR_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
   head:sha,positions:cases.length,checks:checks.length,strictAApproved:false
  }));
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
