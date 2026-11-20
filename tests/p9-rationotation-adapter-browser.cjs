'use strict';
// #290 real original ratio-notation steps: 1920x1080 Chromium targeted evidence.
// No pre-seeded attempts, grades, mathematical operations or proofs.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-rationotation-adapter');
const sources=[
 {id:'ratioNotation37',index:1,expected:['2','1','3']},
 {id:'ratioNotation37',index:2,expected:['2','3']}
];
const checks=[],captures=[],screenshots=[],errors=[];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const ok=(condition,message)=>{assert.ok(condition,message);checks.push(message);};
const key=x=>x.id+'-'+x.index;
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p9-rationotation-browser/1',
  proofContracts:['math','correction','persistence','negative','backup'],
  provenance,viewport:STANDARD_DESKTOP_VIEWPORT,checks,captures,screenshots,errors},null,2)+'\n');}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 let browser,context,page,restoreContext,restorePage,origin,label='start';
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  context=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  restoreContext=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await context.newPage();restorePage=await restoreContext.newPage();
  page.setDefaultTimeout(20000);restorePage.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(String(e)));
  restorePage.on('pageerror',e=>errors.push('restore '+String(e)));
  context.on('request',req=>{if(/^https?:/.test(req.url())&&!req.url().startsWith(origin.base))errors.push('external '+req.url());});
  const click=async selector=>{
   const loc=page.locator(selector);assert.equal(await loc.count(),1,selector);
   for(let n=0;n<8&&!await loc.isVisible();n++){
    const d=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await d.count(),1,selector+' disclosure');
    await d.locator(':scope > summary').click();
   }
   ok(await loc.isVisible(),label+' visible '+selector);
   await loc.scrollIntoViewIfNeeded();await loc.click();
  };
  const act=(name,index)=>click('#extra-controls button[data-x="r37-'+name+'"]'+
   (index===undefined?'':'[data-index="'+index+'"]'));
  const field=async(name,value)=>{
   const el=page.locator('#extra-controls [data-xfield="'+name+'"]');
   assert.equal(await el.count(),1,name);
   if(await el.evaluate(x=>x.tagName==='SELECT'))await el.selectOption(String(value));
   else await el.fill(String(value));
  };
  const shot=async phase=>{
   const file=label+'-'+phase+'.png';await page.screenshot({path:path.join(out,file),fullPage:false});
   screenshots.push(file);
  };
  const snapshot=async(phase,row)=>{
   const c=await capture(page,out,key(row),row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,
    storage:c.storage,board:c.model?.board,historyCount:c.model?.history?.length||0});
   return c;
  };
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  async function warm(tab,role){
   await tab.goto(origin.base+'v2.html#trail');
   await tab.locator('#import-file').waitFor({state:'attached'});
   let status=null;
   for(let n=0;n<300;n++){
    status=await tab.evaluate(async()=>{
     if(!navigator.serviceWorker.controller)return null;
     return new Promise(resolve=>{
      const channel=new MessageChannel();
      const timeout=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
      channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
    });
    if(status?.cache===release&&status.complete&&status.cached===status.total)break;
    await tab.waitForTimeout(100);
   }
   ok(status?.cache===release&&status.complete&&status.cached===status.total,role+' full offline cache');
  }
  await warm(page,'source');await warm(restorePage,'native restore');
  const decoded=tab=>tab.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  ok(Object.keys((await decoded(restorePage)).lessons).length===0,'restore begins empty');
  await origin.close();ok(!origin.server.listening,'HTTP origin stopped before all real steps controls');

  for(const row of sources){
   label=key(row);
   const response=await page.goto(origin.base+'learn.html#'+row.id,{waitUntil:'domcontentloaded'});
   if(response)ok(response.fromServiceWorker()===true,label+' real offline lesson');
   else ok(await page.evaluate(()=>!!navigator.serviceWorker.controller),label+' offline navigation');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   await page.evaluate(({id,index})=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2')),lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Only untouched native lesson position may be selected');
    lesson.index=index;lesson.view='task';localStorage.setItem('math-explorer-v2',JSON.stringify(state));
   },row);
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,label+' offline reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const task=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const t=sessionTaskFor(id,index);
    return {type:t.type,nodeId:LESSONS[id]?.topicId,
     steps:t.steps.map(s=>({title:s.title,label:s.label,value:String(s.value),kind:s.kind||'number'})),
     questions:t.questions||[]};
   },row);
   ok(task.type==='x-r37-steps'&&!!task.nodeId,label+' exact reviewed native equal-ratio steps');
   ok(task.steps.length===row.expected.length&&task.questions.length===0,
    label+' unchanged original step cards');
   ok(task.steps.every((s,i)=>s.kind==='number'&&s.value===row.expected[i]),
    label+' independently calculated equal-ratio integer notation results agree with original tasks');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' standard viewport');
   const feedback=page.locator('#thinking-feedback');
   ok(await feedback.count()===0,label+' no unsubmitted feedback');
   await shot('initial');
   await field('value','999999');await act('step');
   const bad=await snapshot('wrong-step-unsubmitted',row);
   ok(bad.model.board.index===0&&bad.model.board.records.length===1&&
      bad.model.board.records[0].correct===false&&bad.model.board.first[0]==='999999',
      label+' first wrong step preserved');
   ok(await feedback.count()===0,label+' intermediate error not a checked proof');
   for(let i=0;i<row.expected.length;i++){
    await field('value',row.expected[i]);await act('step');
    const during=await snapshot('after-step-'+i,row);
    ok(during.model.board.index===i+1&&during.model.board.records.at(-1).correct===true,
       label+' actual correct step advances card '+(i+1));
    ok(during.model.board.first[0]==='999999'&&during.model.board.bad===true,
       label+' wrong first answer remains in native state');
   }
   ok(await feedback.count()===0,label+' all steps before Check do not generate strict feedback');
   await click('#actions [data-do="check"]');
   ok(await feedback.isVisible(),label+' actual Check exposes source math feedback');
   const success=await snapshot('correct-submitted',row);
   ok(success.attempts.length===1,label+' one native Check');
   ok(JSON.stringify(success.attempts.at(-1).value)===JSON.stringify(success.model),
      label+' latest submitted model matches current work');
   ok(success.model.board.records.length===task.steps.length+1&&
      success.model.board.records[0].correct===false&&
      success.model.board.records.slice(1).every(x=>x.correct),
      label+' genuine wrong and corrected step sequence');
   ok(success.model.history.length===task.steps.length+1&&
      success.model.history.every(e=>e.a==='step'),label+' original step event log complete');
   const replay=await page.evaluate(async({id,index,model})=>{
     const {sessionTaskFor}=await import('./learning/bridges.js');
     const {replayRatioNotationEvidence}=await import('./learning/rationotation-evidence.js');
     return replayRatioNotationEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:success.model});
   ok(replay?.construction?.completedSteps===task.steps.length&&
      replay?.construction?.wrongStepIndices?.length===1,
      label+' real saved original model passes exact independent replay');
   await shot('checked');
   const refresh=await page.reload();
   ok(refresh?.fromServiceWorker()===true,label+' offline checked state reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   ok(await feedback.isVisible(),label+' source feedback survives offline reload');
   const saved=await snapshot('reloaded',row);
   ok(JSON.stringify(saved.model)===JSON.stringify(success.model)&&
      JSON.stringify(saved.record)===JSON.stringify(success.record),
      label+' original corrections and check persist identically');
   await shot('reloaded');
  }
  // Shared Retry on the final source: does not erase prior graded attempts.
  const last=sources.at(-1);label='shared-retry-'+key(last);
  const before=await snapshot('before-retry',last);
  await click('[data-do="p3-retry"]');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,last.index);
  const reset=await snapshot('after-retry',last);
  ok(reset.attempts.length===before.attempts.length,'Retry retains graded attempts');
  ok(reset.model.history.length===0,'Retry clears current native equal-ratio steps history');
  // Native unchanged V2 download and import into an independent truly empty context.
  label='native-v2-restore';await page.goto(origin.base+'v2.html#trail');
  const source=await decoded(page);
  const started=page.waitForEvent('download');await click('#main [data-do="export"]');
  const download=await started,bytes=fs.readFileSync(await download.path()),backup=JSON.parse(bytes.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'unchanged native V2 backup');
  ok(JSON.stringify(backup.state)===JSON.stringify(source),'export retains every native attempt');
  fs.writeFileSync(path.join(out,'actual-native-v2.json'),bytes);
  async function importFile(buffer,name){
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  const raw=()=>restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importFile(bytes,'rationotation-native-v2.json')).includes('备份已合并'),
   'native chooser imports into empty offline restore');
  const first=await raw();
  ok(JSON.stringify(await decoded(restorePage))===JSON.stringify(backup.state),
   'restored original errors and corrections intact');
  ok((await importFile(bytes,'rationotation-repeat-v2.json')).includes('备份已合并'),
   'native repeat import accepted');
  ok(await raw()===first,'byte-idempotent repeat restore');
  ok(!(await importFile(Buffer.from('{'),'rationotation-corrupt-v2.json')).includes('备份已合并'),
   'corrupt V2 rejected');
  ok(await raw()===first,'rejected package does not damage original bytes');
  const restored=await restorePage.goto(origin.base+'learn.html#ratioNotation37');
  ok(restored?.fromServiceWorker()===true,'restored original lesson accessible offline');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='ratioNotation37');
  // The exported lesson is still on step-case 2, which was intentionally
  // retried. Its current model is blank even though its past Check remains.
  const afterRestore=await restorePage.evaluate(()=>{
   const lesson=JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.ratioNotation37;
   return {index:lesson.index,retried:lesson.models['2']?.history.length===0,
    earlierAttempts:lesson.cases['1']?.attempts.length||0,
    oldPairUntouched:!(lesson.cases['0']?.attempts?.length)};
  });
  ok(afterRestore.index===2&&afterRestore.retried&&afterRestore.earlierAttempts===1&&afterRestore.oldPairUntouched,
   'original V2 keeps final Retry, earlier checked ratio steps and unrelated pair source separately');
  ok(!await restorePage.locator('#thinking-feedback').isVisible(),
   'a retried model without new Check does not display strict evidence');
  // Review the actually completed second native position; index 0 is
  // a different x-r37-pair task and must never be passed off as this family.
  await restorePage.evaluate(()=>{
   const state=JSON.parse(localStorage.getItem('math-explorer-v2'));
   if(state.lessons.ratioNotation37.cases['1']?.attempts.length!==1)
    throw Error('Original reviewed ratio-notation case 1 missing in V2 restore');
   state.lessons.ratioNotation37.index=1;
   state.lessons.ratioNotation37.view='task';
   localStorage.setItem('math-explorer-v2',JSON.stringify(state));
  });
  const selected=await restorePage.reload();
  ok(selected?.fromServiceWorker()===true,'reviewed checked source reloads offline');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.index===1);
  const preservedProof=await restorePage.evaluate(async()=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {replayRatioNotationEvidence}=await import('./learning/rationotation-evidence.js');
   const lesson=JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.ratioNotation37;
   const model=lesson.models['1'],record=lesson.cases['1'];
   const proof=replayRatioNotationEvidence(sessionTaskFor('ratioNotation37',1),model,{sessionId:'ratioNotation37',index:1});
   return !!proof&&proof.construction.wrongStepIndices.length===1&&
      JSON.stringify(record.attempts.at(-1)?.value)===JSON.stringify(model);
  });
  ok(preservedProof,'restored actual ratio steps retain independent math, first wrong input and completed Check');
  ok(await restorePage.locator('#thinking-feedback').isVisible(),
   'previously checked source-bound ratio notation feedback survives offline V2 restore');
  await restorePage.screenshot({path:path.join(out,'native-v2-restored.png'),fullPage:false});
  screenshots.push('native-v2-restored.png');
  ok(errors.length===0,'no page exception or external request');
  save();console.log('P9_RATIONOTATION_BROWSER_OK '+JSON.stringify({native:sources.length,
   checks:checks.length,captures:captures.length,sha:checkoutSha,viewport:STANDARD_DESKTOP_VIEWPORT}));
 }catch(e){
  errors.push(label+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png')}).then(()=>screenshots.push('failure.png')).catch(()=>{});
  save();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await restoreContext?.close().catch(()=>{});await context?.close().catch(()=>{});
  await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
