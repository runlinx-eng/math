'use strict';
// #342 / P001: exercise one authentic B30 SVG edge task at 1920x1080.
// No seeded answers; only the native lesson position is selected. Checks are
// submitted through the existing UI, then preserved as original State-v2 bytes.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-gridarea-perimeter-contrast');
const rows=[{id:'gridarea',index:2,count:4,length:14,answer:'12'}];
const checks=[],errors=[],captures=[],screenshots=[];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evt=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):null;
const provenance={repo:'runlinx-eng/math',issue:342,sha,testedCheckoutSha:sha,runId:process.env.GITHUB_RUN_ID||null,
 runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||0),workflowRunId:process.env.GITHUB_RUN_ID||null,
 workflowAttempt:process.env.GITHUB_RUN_ATTEMPT||null,headSha:evt?.pull_request?.head?.sha||sha,
 originalControls:true,seededCorrectWork:false,seededLessonPositionOnly:true,strictAApproved:false,
 childTrial:false,masteryInferred:false};
const ok=(v,message)=>{assert.ok(v,message);checks.push(message);};
function write(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-math-p9-gridarea-perimeter-contrast-candidate/1',provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
  proofContracts:['math','correction','persistence','negative','backup'],
  strictAApproved:false,
  checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
 fs.mkdirSync(out,{recursive:true});
 let origin,browser,ctx,restore,page,restorePage,label='startup';
 try{
  const candidate=await import(pathToFileURL(path.join(root,'dist/learning/gridarea-perimeter-contrast-evidence.js')).href);
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  restore=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();restorePage=await restore.newPage();
  for(const p of [page,restorePage]){p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(label+': '+String(e)));}
  for(const c of [ctx,restore])c.on('request',request=>{
   if(/^https?:/.test(request.url())&&!request.url().startsWith(origin.base))errors.push('external '+request.url());
  });
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  await page.goto(origin.base+'v2.html#trail');
  await restorePage.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  await restorePage.evaluate(async()=>Boolean(await navigator.serviceWorker.ready));
  await restorePage.reload();await restorePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  ok(await restorePage.evaluate(()=>!!navigator.serviceWorker.controller),'backup context SW-controlled before offline stop');
  await warmAndStop(page,origin,release,ok,label);
  const action=async selector=>{
   const loc=page.locator(selector);
   assert.equal(await loc.count(),1,label+' exact original '+selector);
   for(let n=0;n<8&&!(await loc.isVisible());n++){
    const closed=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(),1,label+' collapsed ancestor '+selector);
    await closed.locator(':scope > summary').click();
   }
   ok(await loc.isVisible(),label+' original control visible '+selector);
   await loc.scrollIntoViewIfNeeded();await loc.click();
  };
  const snap=async(row,phase)=>{
   label=row.id+'-'+row.index+'-'+phase;
   const c=await capture(page,out,row.id+'-'+row.index,row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,
    history:c.model?.history,storage:c.storage});
   return c;
  };
  const selectOriginal=async row=>{
   label=row.id+'-'+row.index+'-select';
   await page.goto(origin.base+'learn.html#'+row.id);
   let reply=await page.reload();
   ok(reply?.fromServiceWorker()===true,row.id+' original lesson offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   const old=await page.evaluate(async({id,index})=>{
    const {unpackText,packText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Original lesson must be unsubmitted');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases[index]?.attempts?.length||0;
   },row);
   ok(old===0,row.id+' no seeded answer');
   reply=await page.reload();
   ok(reply?.fromServiceWorker()===true,row.id+' native index reloaded offline');
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,row.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const {boundaryRuns,perimeterEdges}=await import('./learning/phase5/b30-geometry.js');
    const task=sessionTaskFor(id,index);
    return {type:task.type,mode:task.mode,nodeId:LESSONS[id].topicId,nativeTask:task,
     count:boundaryRuns(task.cells).length,length:perimeterEdges(task.cells).length};
   },row);
   ok(original.type==='x-a30-grid'&&original.mode==='edge'&&
    original.count===row.count&&original.length===row.length,
    row.id+' actual original grid perimeter and segment identity');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
    row.id+' required viewport');
   ok(await page.locator('#thinking-feedback').count()===0,row.id+' no early feedback');
   return original.nativeTask;
  };
  for(const row of rows){
   const nativeTask=await selectOriginal(row);
   for(let i=0;i<row.count;i++)
    await action('#extra-visual [data-x="a30-edge"][data-index="'+i+'"]');
   let snapBefore=await snap(row,'edges-selected');
   ok(snapBefore.model.board.edges.length===row.count&&
     snapBefore.model.history.length===row.count&&
     snapBefore.model.history.every(e=>e.a==='edge'&&Object.keys(e.f).length===0),
     row.id+' original SVG clicks recorded chronological edge events');
   await page.locator('#extra-controls [data-xfield="perimeter"]').fill(String(row.length-1));
   await page.locator('#extra-controls [data-xfield="unit"]').selectOption('cm');
   if(row.answer)await page.locator('#extra-controls [data-xfield="answers.0"]').fill(row.answer);
   await action('#actions [data-do="check"]');
   const wrong=await snap(row,'wrong-checked');
   ok(wrong.model.perimeter==='13'&&wrong.model.answers[0]==='12',row.id+' correct area alone cannot imply correct perimeter');
   ok(wrong.attempts.length===1&&wrong.attempts[0].value.perimeter===String(row.length-1),
    row.id+' first wrong Check and original answer preserved');
   ok(await page.locator('#thinking-feedback').count()===0,row.id+' wrong answer cannot receive strict feedback');
   await page.locator('#extra-controls [data-xfield="perimeter"]').fill(String(row.length));
   await action('#actions [data-do="check"]');
   const accepted=await snap(row,'correct-checked');
   ok(accepted.attempts.length===2&&accepted.attempts[0].value.perimeter===String(row.length-1)&&
    accepted.attempts[1].value.perimeter===String(row.length),
    row.id+' correction and both Check attempts persisted');
   // Released SW deliberately excludes this candidate; replay the exact
   // browser-captured native task, model and Check bytes in the Node runner.
   const proof=candidate.submittedGridareaPerimeterContrastEvidence(
    nativeTask,accepted.model,accepted.record,{sessionId:row.id,index:row.index});
   ok(proof?.perimeterCentimeters===row.length&&proof.areaSquareCentimeters===12&&proof.exteriorUnitEdgesVerified===row.length&&
     proof.runs.length===row.count&&proof.runs.reduce((n,r)=>n+r.length,0)===row.length,
     row.id+' independent exterior units equal actual run lengths');
   ok(await page.locator('#thinking-feedback').count()===0,row.id+' candidate is not registered in shared feedback');
   label=row.id+'-'+row.index+'-correct';
   const png=label+'.png';await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   const reply=await page.reload();
   ok(reply?.fromServiceWorker()===true,row.id+' stopped-origin reload after Check');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const persisted=await snap(row,'offline-reload');
   assert.deepEqual(persisted.model,accepted.model);
   assert.deepEqual(persisted.record,accepted.record);
   ok(await page.locator('#thinking-feedback').count()===0,row.id+' candidate remains unregistered after reload');
  }
  const last=rows.at(-1),beforeRetry=await snap(last,'before-retry');
  await action('[data-do="p3-retry"]');
  const afterRetry=await snap(last,'after-retry');
  ok(afterRetry.model.history.length===0&&afterRetry.attempts.length===beforeRetry.attempts.length,
    'shared Retry clears current edges, preserves prior Check attempts');
  ok(await page.locator('#thinking-feedback').count()===0,'Retry hides previous feedback');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  const exportWait=page.waitForEvent('download');
  await action('#main [data-do="export"]');
  const dl=await exportWait,bytes=fs.readFileSync(await dl.path()),pack=JSON.parse(bytes.toString('utf8'));
  ok(pack.app==='math-explorer'&&pack.version===2,'native State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),bytes);
  async function importFile(buffer,name){
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  ok((await importFile(bytes,'gridarea-original.json')).includes('备份已合并'),'native backup imported');
  const restored=await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importFile(bytes,'gridarea-repeat.json')).includes('备份已合并'),'repeat import accepted');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restored,'repeat import idempotent');
  ok(!(await importFile(Buffer.from('{'),'gridarea-bad.json')).includes('备份已合并'),'bad backup rejected');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restored,'bad import leaves all records unchanged');
  ok(errors.length===0,'no browser exceptions or external calls');
  write();console.log('P9_GRIDAREA_PERIMETER_CONTRAST_CANDIDATE_BROWSER_OK '+JSON.stringify({
   sha,checks:checks.length,rows:rows.length,captures:captures.length,viewport:STANDARD_DESKTOP_VIEWPORT,strictAApproved:false}));
 }catch(e){
  errors.push(label+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  write();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await restore?.close().catch(()=>{});await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
