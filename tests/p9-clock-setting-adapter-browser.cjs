'use strict';
// #306: real original B32 controls, wrong-to-correct Check, saved attempts,
// stopped-origin reload, Retry and native State-v2 backup. Never seed correct work.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-clock-setting-adapter');
const rows=[
 {id:'hourclock',index:2,hour:'2',minute:30,wrong:'at',correct:'between',time:150,hand:150},
 {id:'fiveclock',index:2,hour:'3',minute:40,wrong:'21',correct:'20',time:220,hand:220},
 {id:'quarterclock',index:1,hour:'6',minute:45,wrong:'14',correct:'15',time:405,hand:405}
];
const checks=[],errors=[],captures=[],screenshots=[];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evt=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:evt.pull_request?.head?.sha||sha,testedCheckoutSha:sha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 originalControls:true,seededCorrectWork:false,seededLessonPositionOnly:true,childTrial:false,masteryInferred:false};
const ok=(v,message)=>{assert.ok(v,message);checks.push(message);};
function write(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p9-clock-setting-browser/1',provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
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
  for(const c of [ctx,restore])c.on('request',request=>{
   if(/^https?:/.test(request.url())&&!request.url().startsWith(origin.base))errors.push('external '+request.url());
  });
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  await page.goto(origin.base+'v2.html#trail');
  await restorePage.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  // Separate contexts have separate SW installs; a visible document is not
  // necessarily controlled. Activate and reload backup before HTTP is stopped.
  await restorePage.evaluate(async()=>Boolean(await navigator.serviceWorker.ready));
  await restorePage.reload();
  await restorePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  ok(await restorePage.evaluate(()=>!!navigator.serviceWorker.controller),
     'backup context is SW-controlled before shutting down HTTP');
  await warmAndStop(page,origin,release,ok,label);
  const selectOriginal=async row=>{
   const response=await page.goto(origin.base+'learn.html#'+row.id);
   ok(response?.fromServiceWorker()===true,row.id+' original course loaded offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   const before=await page.evaluate(async({id,index})=>{
    const {unpackText,packText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Native source must be untouched');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return {previous:index,oldAttempts:lesson.cases[index]?.attempts?.length||0};
   },row);
   ok(before.oldAttempts===0,row.id+' no seeded answer or previous Check');
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,row.id+' selected original index offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const c=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const t=sessionTaskFor(id,index);
    return {type:t.type,mode:t.mode,initial:t.initial,value:t.value,node:LESSONS[id].topicId};
   },row);
   ok(c.type==='x-t32-clock'&&c.mode==='set'&&c.initial===65&&c.value===row.time,
      row.id+' native editable task and original time');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
      row.id+' standard viewport');
   ok(await page.locator('#thinking-feedback').count()===0,row.id+' no feedback before Check');
  };
  const saved=async row=>capture(page,out,row.id+'-'+row.index,row,label);
  const snap=async(row,phase)=>{
   label=row.id+'-'+row.index+'-'+phase;
   const c=await saved(row);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,
    history:c.model?.history,storage:c.storage});
   return c;
  };
  const action=async(selector)=>{
   const loc=page.locator(selector);
   assert.equal(await loc.count(),1,label+' exact control '+selector);
   await loc.scrollIntoViewIfNeeded();await loc.click();
  };
  const input=async(row,answer)=>{
   const el=page.locator('#extra-controls [data-xfield="answers.0"]');
   assert.equal(await el.count(),1);
   if(row.id==='hourclock')await el.selectOption(answer);
   else await el.fill(answer);
  };
  const check=async(row)=>{
   await action('#actions [data-do="check"]');
   return snap(row,'checked');
  };
  for(const row of rows){
   label=row.id+'-'+row.index;await selectOriginal(row);
   const hour=page.locator('#extra-controls [data-xfield="hour"]');
   assert.equal(await hour.count(),1);
   await hour.selectOption(row.hour);
   const minute=page.locator('#extra-controls [data-xfield="minute"]');
   assert.equal(await minute.count(),1);
   await minute.focus();await minute.press('Home');
   for(let i=0;i<row.minute;i++)await minute.press('ArrowRight');
   await input(row,row.wrong);
   const wrong=await snap(row,'wrong-before-check');
   ok(wrong.model.board.hour===Number(row.hour)&&wrong.model.board.minute===row.minute,
      row.id+' hour/minute controls set correct clock');
   ok(wrong.model.history.some(e=>e.a==='hour')&&wrong.model.history.some(e=>e.a==='minute'),
      row.id+' actual controls generated both kinds of events');
   await action('#actions [data-do="check"]');
   const rejected=await snap(row,'wrong-checked');
   ok(rejected.attempts.length===1&&rejected.attempts[0].value.answers[0]===row.wrong,
      row.id+' first wrong Check retained in State-v2');
   ok(await page.locator('#thinking-feedback').count()===0,row.id+' no strict feedback on wrong latest Check');
   await input(row,row.correct);
   await action('#actions [data-do="check"]');
   const accepted=await snap(row,'correct-checked');
   ok(accepted.attempts.length===2&&accepted.attempts[0].value.answers[0]===row.wrong&&
      accepted.attempts[1].value.answers[0]===row.correct,row.id+' wrong and corrected checks persist');
   const proof=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {replayClockSettingEvidence}=await import('./learning/clock-setting-evidence.js');
    return replayClockSettingEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:accepted.model});
   ok(proof?.finalMinutes===row.time&&proof.hourHandHalfDegrees===row.hand&&
      proof.minuteHandDegrees===row.minute*6,row.id+' independent half-degree clock geometry');
   ok(await page.locator('#thinking-feedback').isVisible(),row.id+' latest submitted real controls get feedback');
   const message=await page.locator('#thinking-feedback').innerText();
   ok(message.includes('自由解释')&&message.includes('长期掌握')&&message.includes('徒手画针'),
      row.id+' evidence does not claim independent drawing or mastery');
   const png=label+'.png';await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   const reload=await page.reload();
   ok(reload?.fromServiceWorker()===true,row.id+' stopped-origin reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const persisted=await snap(row,'offline-reload');
   assert.deepEqual(persisted.model,accepted.model);assert.deepEqual(persisted.record,accepted.record);
   ok(await page.locator('#thinking-feedback').isVisible(),row.id+' strict feedback survives offline restore');
  }
  const last=rows.at(-1),beforeRetry=await snap(last,'before-retry');
  await action('[data-do="p3-retry"]');
  const afterRetry=await snap(last,'after-retry');
  ok(afterRetry.model.history.length===0&&afterRetry.attempts.length===beforeRetry.attempts.length,
     'shared Retry clears current dial but retains all checks');
  ok(await page.locator('#thinking-feedback').count()===0,'old feedback removed after shared Retry');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  const exportWait=page.waitForEvent('download');await action('#main [data-do="export"]');
  const dl=await exportWait,bytes=fs.readFileSync(await dl.path()),pack=JSON.parse(bytes.toString('utf8'));
  ok(pack.app==='math-explorer'&&pack.version===2,'original State-v2 backup exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),bytes);
  async function importFile(buffer,name){
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  ok((await importFile(bytes,'clock-original.json')).includes('备份已合并'),'native backup import accepted');
  const restored=await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importFile(bytes,'clock-repeat.json')).includes('备份已合并'),'repeated native import accepted');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restored,'repeat import idempotent');
  ok(!(await importFile(Buffer.from('{'),'clock-broken.json')).includes('备份已合并'),'bad backup rejected');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restored,'bad import leaves records unchanged');
  ok(errors.length===0,'zero browser exceptions or external calls');
  write();console.log('P9_CLOCK_SETTING_BROWSER_OK '+JSON.stringify({
   sha,checks:checks.length,rows:rows.length,captures:captures.length,viewport:STANDARD_DESKTOP_VIEWPORT}));
 }catch(e){
  errors.push(label+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  write();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await restore?.close().catch(()=>{});await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
