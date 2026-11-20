'use strict';
// #329: original B32 calendar controls, wrong -> corrected Check,
// source-bound Gregorian replay, offline reload, Retry and State-v2 backup.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-calendar-date-reading-adapter');
const cases=[
 {id:'calendaruse',index:0,date:'2026-03-15',wrong:'2026-03-14',answer:'sun',badAnswer:'sat',weekday:0,day:15},
 {id:'calendaruse',index:1,date:'2026-03-18',wrong:'2026-03-19',answer:'18',badAnswer:'17',weekday:3,day:18}
];
const checks=[],errors=[],captures=[],screenshots=[];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evt=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={repo:'runlinx-eng/math',issue:329,headSha:evt.pull_request?.head?.sha||sha,
 testedCheckoutSha:sha,runId:process.env.GITHUB_RUN_ID||null,
 runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),originalControls:true,
 seededCorrectWork:false,seededLessonPositionOnly:true,childTrial:false,masteryInferred:false};
const ok=(v,m)=>{assert.ok(v,m);checks.push(m);};
function write(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p9-calendar-date-reading-browser/1',provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
  proofContracts:['math','correction','persistence','negative','backup'],
  checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function run(){
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
  for(const c of [ctx,restore])c.on('request',r=>{
   if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))errors.push('external '+r.url());
  });
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  await page.goto(origin.base+'v2.html#trail');await restorePage.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  await restorePage.evaluate(async()=>Boolean(await navigator.serviceWorker.ready));
  await restorePage.reload();await restorePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  ok(await restorePage.evaluate(()=>!!navigator.serviceWorker.controller),'backup context controlled');
  await warmAndStop(page,origin,release,ok,label);
  async function click(selector){
   const loc=page.locator(selector);
   assert.equal(await loc.count(),1,label+' original selector '+selector);
   for(let n=0;n<8&&!(await loc.isVisible());n++){
    const d=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await d.count(),1,label+' collapsed details');
    await d.locator(':scope > summary').click();
   }
   ok(await loc.isVisible(),label+' visible '+selector);
   await loc.scrollIntoViewIfNeeded();await loc.click();
  }
  async function snap(row,phase){
   label=row.id+'-'+row.index+'-'+phase;
   const c=await capture(page,out,row.id+'-'+row.index,row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,
    history:c.model?.history,storage:c.storage});
   return c;
  }
  for(const row of cases){
   label=row.id+'-'+row.index+'-select';
   await page.goto(origin.base+'learn.html#'+row.id);
   const doc=await page.reload();ok(doc?.fromServiceWorker()===true,'original lesson offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   const old=await page.evaluate(async({id,index})=>{
    const {unpackText,packText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2'))),lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Original source already attempted');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases[index]?.attempts?.length||0;
   },row);
   ok(old===0,'source position only, no seeded answer');
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,'position reloaded offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const info=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const t=sessionTaskFor(id,index);
    return {type:t.type,nodeId:LESSONS[id].topicId,dates:t.dates,
      answer:t.questions?.[0]?.value,kind:t.questions?.[0]?.kind};
   },row);
   ok(info.type==='x-t32-calendar'&&info.nodeId==='mt_tVvZVWO5d6'&&
      JSON.stringify(info.dates)===JSON.stringify([row.date])&&
      String(info.answer)===row.answer&&info.kind===(row.index===0?'choice':'number'),
      'exact original native task and answer semantics');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'standard viewport');
   ok(await page.locator('#thinking-feedback').count()===0,'no feedback before Check');
   const day=d=>click('[data-x="t32-day"][data-index="'+d+'"]');
   await day(row.wrong);await day(row.wrong);await day(row.date);
   const selected=await snap(row,'original-date-controls');
   ok(selected.model.history.length===3&&selected.model.history[0].i===row.wrong&&
      selected.model.history[1].i===row.wrong&&selected.model.history[2].i===row.date,
      'native incorrect click and correction chronology retained');
   ok(JSON.stringify(selected.model.board.selected)===JSON.stringify([row.date]),
      'original expected date selected');
   const answer=page.locator('#extra-controls [data-xfield="answers.0"]');
   assert.equal(await answer.count(),1,'native answer field');
   const setAnswer=async value=>row.index===0?answer.selectOption(value):answer.fill(String(value));
   await setAnswer(row.badAnswer);
   await click('#actions [data-do="check"]');
   const wrong=await snap(row,'wrong-check');
   ok(wrong.attempts.length===1&&wrong.attempts[0].value.answers[0]===row.badAnswer,
      'original wrong Check persisted');
   ok(await page.locator('#thinking-feedback').count()===0,'wrong Check no strict proof');
   await setAnswer(row.answer);
   await click('#actions [data-do="check"]');
   const good=await snap(row,'correct-check');
   ok(good.attempts.length===2&&good.attempts[0].value.answers[0]===row.badAnswer&&
      good.attempts[1].value.answers[0]===row.answer,
      'real corrected Check preserves preceding wrong attempt');
   const proof=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {replayCalendarDateReadingEvidence}=await import('./learning/calendar-date-reading-evidence.js');
    return replayCalendarDateReadingEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:good.model});
   ok(proof?.selectedDate===row.date&&proof.dayOfMonth===row.day&&
      proof.gregorianWeekday===row.weekday&&proof.observedDateClicks===3&&
      proof.learnerMasteryAssessed===false,
      'independent Gregorian date arithmetic and actual controls');
   ok(await page.locator('#thinking-feedback').isVisible(),'strict feedback after current correct Check');
   const feedback=await page.locator('#thinking-feedback').innerText();
   ok(feedback.includes(row.date)&&feedback.includes('长期掌握'),
      'date feedback bounded by actual evidence');
   label=row.id+'-'+row.index+'-correct';
   const png=label+'.png';await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);
   const offline=await page.reload();
   ok(offline?.fromServiceWorker()===true,'submitted lesson offline reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const kept=await snap(row,'offline-reload');
   assert.deepEqual(kept.model,good.model);assert.deepEqual(kept.record,good.record);
   ok(await page.locator('#thinking-feedback').isVisible(),'feedback survives offline reload');
  }
  const last=cases.at(-1),before=await snap(last,'before-retry');
  await click('[data-do="p3-retry"]');
  const after=await snap(last,'after-retry');
  ok(after.model.history.length===0&&after.attempts.length===before.attempts.length,
    'Retry clears model without deleting saved Check attempts');
  ok(await page.locator('#thinking-feedback').count()===0,'Retry hides stale feedback');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  const waiting=page.waitForEvent('download');
  await click('#main [data-do="export"]');
  const dl=await waiting,bytes=fs.readFileSync(await dl.path());
  const pack=JSON.parse(bytes.toString('utf8'));
  ok(pack.app==='math-explorer'&&pack.version===2,'native State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),bytes);
  async function importFile(buffer,name){
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  ok((await importFile(bytes,'calendar.json')).includes('备份已合并'),'blank-context State-v2 import');
  const stored=await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importFile(bytes,'calendar-again.json')).includes('备份已合并'),'reimport valid backup');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===stored,'idempotent import');
  ok(!(await importFile(Buffer.from('{'),'calendar-invalid.json')).includes('备份已合并'),'bad import rejected');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===stored,'bad backup preserves data');
  ok(errors.length===0,'no browser errors or external calls');
  write();
  console.log('P9_CALENDAR_DATE_READING_BROWSER_OK '+JSON.stringify({
   sha,checks:checks.length,rows:cases.length,captures:captures.length,viewport:STANDARD_DESKTOP_VIEWPORT}));
 }catch(e){
  errors.push(label+': '+String(e));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  write();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await restore?.close().catch(()=>{});await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
