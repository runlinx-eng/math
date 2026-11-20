'use strict';
// #327: seven real B32 native unit-card tasks, exercised with the original controls
// in 1920x1080 Chromium. Do not seed answers, models, grades or evidence.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-time-unit-parts-adapter');
const rows=[
 {id:'durationunit',index:2,node:'mt__N55B7u7HD',labels:['1分钟','1分钟'],answers:['2','120'],seconds:120},
 {id:'hoursday',index:0,node:'mt_2XDGT5tei1',labels:['15分钟','15分钟','15分钟','15分钟'],answers:['60'],seconds:3600},
 {id:'hoursday',index:1,node:'mt_2XDGT5tei1',labels:['第一轮12小时','第二轮12小时'],answers:['24'],seconds:86400},
 {id:'hoursday',index:2,node:'mt_2XDGT5tei1',labels:['60分钟','30分钟'],answers:['1','30'],seconds:5400},
 {id:'timeconvert',index:0,node:'mt_2yas4Unc8o',labels:['1小时','1小时','1小时','25分钟'],answers:['205'],seconds:12300},
 {id:'timeconvert',index:1,node:'mt_2yas4Unc8o',labels:['60秒','60秒','30秒'],answers:['2','30'],seconds:150},
 {id:'calendarfacts',index:0,node:'mt_EXlmTURK_o',labels:['15秒','15秒','15秒','15秒'],answers:['1'],seconds:60}
];
const checks=[],captures=[],screenshots=[],errors=[];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evt=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:evt.pull_request?.head?.sha||sha,testedCheckoutSha:sha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 originalNativeControls:true,seededLessonPositionOnly:true,seededCorrectWork:false,
 childTrial:false,masteryInferred:false};
const ok=(v,label)=>{assert.ok(v,label);checks.push(label);};
const key=row=>row.id+'-'+row.index;
function save(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p9-time-unit-parts-browser/1',provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
  proofContracts:['math','correction','persistence','negative','backup'],
  native:rows.map(row=>({id:row.id,index:row.index,node:row.node,seconds:row.seconds})),
  checks,captures,screenshots,errors
 },null,2)+'\n');
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 let origin,browser,ctx,restore,page,restorePage,label='startup';
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  restore=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();restorePage=await restore.newPage();
  for(const p of [page,restorePage]){p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(label+': '+String(e)));}
  for(const c of [ctx,restore])c.on('request',req=>{
   if(/^https?:/.test(req.url())&&!req.url().startsWith(origin.base))errors.push('external '+req.url());
  });
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  await restorePage.goto(origin.base+'v2.html#trail');
  await restorePage.locator('#main [data-do="import"]').first().waitFor();
  await restorePage.evaluate(async()=>Boolean(await navigator.serviceWorker.ready));
  await restorePage.reload();await restorePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  ok(await restorePage.evaluate(()=>!!navigator.serviceWorker.controller),'fresh backup context offline-controlled');
  await warmAndStop(page,origin,release,ok,'unit-card source');
  const clicked=async(selector)=>{
   const el=page.locator(selector);assert.equal(await el.count(),1,label+' unique '+selector);
   for(let i=0;i<8&&!(await el.isVisible());i++){
    const parent=el.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await parent.count(),1,'closed disclosure for '+selector);
    await parent.locator(':scope > summary').click();
   }
   ok(await el.isVisible(),label+' visible '+selector);
   await el.scrollIntoViewIfNeeded();await el.click();
  };
  const shot=async(name)=>{
   const file=label+'-'+name+'.png';
   await page.screenshot({path:path.join(out,file),fullPage:false});screenshots.push(file);
  };
  const snap=async(row,phase)=>{
   label=key(row)+'-'+phase;
   const c=await capture(page,out,key(row),row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,
    history:c.model?.history,selected:c.model?.board?.selected,storage:c.storage});
   return c;
  };
  const choose=async(row)=>{
   label=key(row);
   await page.goto(origin.base+'learn.html#'+row.id);
   const response=await page.reload();
   ok(response?.fromServiceWorker()===true,label+' original lesson reloads with origin stopped');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   const seeded=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2'))),lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Only the untouched original position can be selected');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return {index,attempts:lesson.cases[index]?.attempts?.length||0};
   },row);
   ok(seeded.attempts===0,label+' no seeded Check or answer');
   const loaded=await page.reload();
   ok(loaded?.fromServiceWorker()===true,label+' selected native position reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const task=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const t=sessionTaskFor(id,index);
    return {type:t.type,node:LESSONS[id]?.topicId,labels:t.parts?.map(p=>p.label),
     values:t.questions?.map(q=>String(q.value)),kinds:t.questions?.map(q=>q.kind)};
   },row);
   ok(task.type==='x-t32-units'&&task.node===row.node,label+' exact independent B32 source');
   ok(JSON.stringify(task.labels)===JSON.stringify(row.labels),label+' original unit cards unchanged');
   ok(JSON.stringify(task.values)===JSON.stringify(row.answers)&&task.kinds.every(k=>k==='number'),
      label+' independent unit sums match original questions');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' standard desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,label+' no feedback before submission');
  };
  const select=async index=>clicked('#extra-visual button[data-x="t32-unit"][data-index="'+index+'"]');
  const answer=async(index,value)=>{
   const el=page.locator('#extra-controls [data-xfield="answers.'+index+'"]');
   assert.equal(await el.count(),1,label+' original answer '+index);
   await el.fill(String(value));
  };
  for(const row of rows){
   await choose(row);
   await shot('initial');
   for(let index=0;index<row.labels.length;index++){
    await select(index);
    ok(await page.locator('#extra-visual button[data-x="t32-unit"][data-index="'+index+'"]').getAttribute('aria-pressed')==='true',
       key(row)+' native card '+index+' pressed');
   }
   await select(0);await select(0);
   const chosen=await snap(row,'selected-before-check');
   ok(chosen.model.history.length===row.labels.length+2&&
    JSON.stringify(chosen.model.board.selected)===JSON.stringify(row.labels.map((_,i)=>i)),
    key(row)+' all original actions retained, including unselect and reselect');
   ok(chosen.model.history.at(-2).i==='0'&&chosen.model.history.at(-1).i==='0',
    key(row)+' identical card toggles are retained independently');
   for(let i=0;i<row.answers.length;i++)await answer(i,i===0?'999999':row.answers[i]);
   await clicked('#actions [data-do="check"]');
   const wrong=await snap(row,'wrong-checked');
   ok(wrong.attempts.length===1&&wrong.attempts[0].value.answers[0]==='999999',
    key(row)+' original incorrect Check saved intact');
   ok(await page.locator('#thinking-feedback').count()===0,key(row)+' wrong submission is not strict proof');
   await answer(0,row.answers[0]);
   await clicked('#actions [data-do="check"]');
   const accepted=await snap(row,'correct-checked');
   ok(accepted.attempts.length===2&&accepted.attempts[0].value.answers[0]==='999999'&&
      accepted.attempts[1].value.answers[0]===row.answers[0],
      key(row)+' incorrect and corrected Check both survive');
   ok(JSON.stringify(accepted.attempts.at(-1).value)===JSON.stringify(accepted.model),
      key(row)+' current submitted model exactly matches saved work');
   const replay=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {replayTimeUnitPartsEvidence}=await import('./learning/time-unit-parts-evidence.js');
    return replayTimeUnitPartsEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:accepted.model});
   ok(replay?.totalSeconds===row.seconds&&
      replay.controlEvents.length===row.labels.length+2&&replay.independentCalculationAssessed===false&&
      replay.independentExplanationAssessed===false&&replay.learnerMasteryAssessed===false,
      key(row)+' exact independent math and honest proof boundary');
   ok(replay.controlEvents.at(-2).action==='unselect'&&replay.controlEvents.at(-1).action==='select',
      key(row)+' real toggle events replay in original order');
   ok(await page.locator('#thinking-feedback').isVisible(),key(row)+' strictly source-bound feedback visible');
   const message=await page.locator('#thinking-feedback').innerText();
   ok(message.includes('长期掌握')&&message.includes('独立口算'),
      key(row)+' feedback does not claim unobserved thinking or mastery');
   await shot('correct-checked');
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,key(row)+' checked native work reloads offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const persisted=await snap(row,'offline-checked-reload');
   assert.deepEqual(persisted.model,accepted.model);
   assert.deepEqual(persisted.record,accepted.record);
   ok(await page.locator('#thinking-feedback').isVisible(),key(row)+' feedback survives native offline reload');
   if(row.id==='hoursday'&&row.index===0){
    await clicked('#actions [data-do="next"]');
    ok(await page.evaluate(()=>window.mathLesson?.snapshot()?.index===1),
       'genuine Next navigates while previous checked work remains saved');
   }
  }
  const last=rows.at(-1),before=await snap(last,'before-retry');
  await clicked('[data-do="p3-retry"]');
  const after=await snap(last,'after-retry');
  ok(after.attempts.length===before.attempts.length&&after.model.history.length===0,
     'Retry clears only active original card selection and retains attempts');
  ok(await page.locator('#thinking-feedback').count()===0,'Retry does not reuse previous proof as current feedback');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  const decoded=async tab=>tab.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  const state=await decoded(page);
  const downloadWait=page.waitForEvent('download');await clicked('#main [data-do="export"]');
  const download=await downloadWait,bytes=fs.readFileSync(await download.path()),pack=JSON.parse(bytes.toString('utf8'));
  ok(pack.app==='math-explorer'&&pack.version===2,'original unchanged State-v2 backup exported');
  ok(JSON.stringify(pack.state)===JSON.stringify(state),'backup retains complete native checked and corrected records');
  fs.writeFileSync(path.join(out,'actual-native-state-v2.json'),bytes);
  async function importFile(buffer,name){
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  ok((await importFile(bytes,'time-unit-parts-original.json')).includes('备份已合并'),
     'native offline backup import accepted');
  const restoredRaw=await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok(JSON.stringify(await decoded(restorePage))===JSON.stringify(pack.state),'original time cards and wrong-first corrections restored');
  ok((await importFile(bytes,'time-unit-parts-repeat.json')).includes('备份已合并'),
     'repeated native backup import accepted');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restoredRaw,
     'repeated backup import idempotent');
  ok(!(await importFile(Buffer.from('{'),'time-unit-parts-corrupt.json')).includes('备份已合并'),
     'invalid backup rejected');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restoredRaw,
     'invalid backup preserves every existing record');
  const restoredPageResponse=await restorePage.goto(origin.base+'learn.html#hoursday');
  ok(restoredPageResponse?.fromServiceWorker()===true,'restored real source navigates offline');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='hoursday');
  await restorePage.evaluate(async()=>{
   const {packText,unpackText}=await import('./storage.js');
   const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   const lesson=state.lessons.hoursday;
   if(lesson.cases[0]?.attempts?.length!==2)throw Error('original checked source missing in backup');
   lesson.index=0;lesson.view='task';
   localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
  });
  const restoredReload=await restorePage.reload();
  ok(restoredReload?.fromServiceWorker()===true,'restored native unit task reloads offline');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.index===0);
  ok(await restorePage.locator('#thinking-feedback').isVisible(),
     'restored current checked native original retains feedback');
  const restoredProof=await restorePage.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {replayTimeUnitPartsEvidence}=await import('./learning/time-unit-parts-evidence.js');
   const source=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2'))).lessons.hoursday;
   const model=source.models['0'],record=source.cases['0'];
   return replayTimeUnitPartsEvidence(sessionTaskFor('hoursday',0),model,{sessionId:'hoursday',index:0})?.totalSeconds===3600&&
    JSON.stringify(model)===JSON.stringify(record.attempts.at(-1)?.value);
  });
  ok(restoredProof,'restored latest checked work passes independent time sum replay');
  await restorePage.screenshot({path:path.join(out,'native-state-v2-restored.png'),fullPage:false});
  screenshots.push('native-state-v2-restored.png');
  ok(errors.length===0,'no uncaught browser errors or external requests');
  save();console.log('P9_TIME_UNIT_PARTS_BROWSER_OK '+JSON.stringify({
   native:rows.length,checks:checks.length,captures:captures.length,sha,viewport:STANDARD_DESKTOP_VIEWPORT}));
 }catch(e){
  errors.push(label+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png')}).then(()=>screenshots.push('failure.png')).catch(()=>{});
  save();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await restore?.close().catch(()=>{});await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
