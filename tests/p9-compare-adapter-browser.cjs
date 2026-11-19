'use strict';
// Isolated B28 native length comparison Chromium candidate: NOT CI-registered
// until the preceding B28 plot PR and new main have both been accepted.
// Eleven native tasks, no seeded answers, grades, history, or mathematical proof.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
const rows=require('./fixtures/p9-compare-cases.cjs').cases;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-compare-adapter');
const errors=[],checks=[],captures=[],screenshots=[];
const proofContracts=['math','correction','persistence','negative','backup'];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const ok=(test,label)=>{assert.ok(test,label);checks.push(label);};
const key=row=>row.id+'-'+row.index;
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
 schema:'math-p9-compare-browser/1',proofContracts,provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
 checks,captures,screenshots,errors
},null,2)+'\n');}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 let browser,origin,context,page,restoreContext,restorePage,label='start';
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  context=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(String(e)));
  context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))errors.push('external '+r.url());});
  restoreContext=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  restorePage=await restoreContext.newPage();restorePage.setDefaultTimeout(20000);
  restorePage.on('pageerror',e=>errors.push('restore '+String(e)));
  const shot=async phase=>{const filename=label+'-'+phase+'.png';await page.screenshot({path:path.join(out,filename),fullPage:false});screenshots.push(filename);};
  const click=async selector=>{
   const loc=page.locator(selector);assert.equal(await loc.count(),1,selector);
   for(let depth=0;depth<8&&!await loc.isVisible();depth++){
    const closed=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(),1,'original disclosure '+selector);
    await closed.locator(':scope > summary').click();
   }
   assert.equal(await loc.isVisible(),true,selector);
   await loc.scrollIntoViewIfNeeded();await loc.click();
  };
  const act=async(action,index)=>click('#extra-controls button[data-x="m28-'+action+'"]'+
   (index===undefined?'':'[data-index="'+index+'"]'));
  const field=async(name,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+name+'"]');
   assert.equal(await loc.count(),1,name);
   if((await loc.evaluate(el=>el.tagName))==='SELECT')await loc.selectOption(String(value));
   else await loc.fill(String(value));
  };
  const align=async()=>{
   const loc=page.locator('#extra-controls [data-xfield="offset"]');assert.equal(await loc.count(),1);
   // Real keyboard interaction with the original range input (-3..3).
   await loc.focus();await loc.press('Home');
   for(let i=0;i<3;i++)await loc.press('ArrowRight');
   ok(await loc.inputValue()==='0',label+' aligned to the true zero point');
  };
  const captureNow=async(phase,row)=>{
   const c=await capture(page,out,key(row),row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,storage:c.storage,
    board:c.model?.board,historyCount:c.model?.history?.length||0});
   return c;
  };
  const current=()=>page.evaluate(()=>window.mathLesson.snapshot());
  const released=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  async function warm(tab,role){
   await tab.goto(origin.base+'v2.html#trail');
   await tab.locator('#import-file').waitFor({state:'attached'});
   let status=null;
   for(let i=0;i<300;i++){
    status=await tab.evaluate(async()=>{
     if(!navigator.serviceWorker.controller)return null;
     return new Promise(resolve=>{
      const channel=new MessageChannel(),timeout=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
      channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
    });
    if(status?.cache===released&&status.complete&&status.cached===status.total)break;
    await tab.waitForTimeout(100);
   }
   ok(status?.cache===released&&status.complete&&status.cached===status.total,role+' full offline cache');
  }
  await warm(page,'source');await warm(restorePage,'restore');
  const blank=await restorePage.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  ok(Object.keys(blank.lessons).length===0,'restore starts without native learning work');
  await origin.close();ok(!origin.server.listening,'HTTP origin stopped before real controls');
  const expectedIds=new Set(rows.map(row=>key(row)));ok(expectedIds.size===11,'exactly 11 native positions');

  let previous=null,nextClicks=0;
  for(const row of rows){
   label=key(row);
   if(previous?.id===row.id&&previous.index+1===row.index){
    await click('#actions [data-do="next"]');nextClicks++;
    await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
    ok((await current()).id===row.id,label+' genuine native Next');
   }else{
    const response=await page.goto(origin.base+'learn.html#'+row.id,{waitUntil:'domcontentloaded'});
    if(response)ok(response.fromServiceWorker()===true,label+' offline document navigation');
    else ok(await page.evaluate(()=>!!navigator.serviceWorker.controller),label+' offline hash-only navigation');
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
    // Skip only the unrelated ordermeasure:1 vessel position. This changes
    // the original lesson cursor, never a model, answer, evidence or attempt.
    await page.evaluate(({id,index})=>{
     const state=JSON.parse(localStorage.getItem('math-explorer-v2'));
     const lesson=state.lessons[id];if(!lesson)throw Error('Missing original lesson '+id);
     if(lesson.cases?.[index]?.attempts?.length)throw Error('Cannot seed completed native task '+id+':'+index);
     lesson.index=index;lesson.view='task';localStorage.setItem('math-explorer-v2',JSON.stringify(state));
    },row);
    const reload=await page.reload();
    ok(reload?.fromServiceWorker()===true,label+' full reload served offline');
    await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   }
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' 1920x1080');
   await shot('initial');
   const feedback=page.locator('#thinking-feedback');
   ok(await feedback.count()===0,label+' no premature strict feedback');
   const value=row=>row.answers.map(x=>String(x));
   if(row.mode==='order'){
    await align();
    for(let i=0;i<row.lengths.length;i++)await act('order',i); // intentionally wrong source order
   }else{
    if(row.mode==='indirect'){
     for(let i=0;i<row.lengths.length;i++)await act('copy',i);
    }else await align();
    const wrong=['left','right','equal'].find(x=>x!==row.want);
    await act('choice',wrong);
   }
   await click('#actions [data-do="check"]');
   const wrong=await captureNow('wrong-submitted',row);
   ok(wrong.attempts.length===1,label+' first incorrect native attempt saved');
   ok(await feedback.count()===0,label+' wrong check has no strict feedback');

   if(row.mode==='order'){
    await act('clear');
    for(const i of row.sorted)await act('order',i);
   }else await act('choice',row.want);
   for(let i=0;i<row.answers.length;i++)await field('answers.'+i,row.answers[i]);
   const pending=await captureNow('correct-unsubmitted',row);
   ok(pending.attempts.length===1,label+' original wrong attempt kept before correction');
   ok(await feedback.count()===0,label+' corrected unsubmitted work is not assessed');
   await click('#actions [data-do="check"]');
   ok(await feedback.isVisible(),label+' latest source-bound proof shown after original check');
   const done=await captureNow('correct-submitted',row);
   ok(done.attempts.length===2&&done.model?.history?.length>0,label+' wrong/correct checks both saved');
   ok(done.model?.board?.offset===0||row.mode==='indirect',label+' comparable lengths share zero');
   if(row.mode==='order')ok(JSON.stringify(done.model.board.order)===JSON.stringify(row.sorted),
    label+' sorted original lengths from shortest to longest');
   if(row.mode==='indirect')ok(done.model.board.copied.length===row.lengths.length,
    label+' all three original paper-strip records retained');
   await shot('checked');
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,label+' original lesson reload is offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   ok(await feedback.isVisible(),label+' proof survives real reload');
   const saved=await captureNow('reloaded',row);
   ok(JSON.stringify(done.model)===JSON.stringify(saved.model)&&
     JSON.stringify(done.record)===JSON.stringify(saved.record),
     label+' model and previous attempts survive reload');
   if(row.answers.length){
    const wrongAnswer=row.answers[0]==='yes'?'no':row.answers[0]==='='?'>':
      row.answers[0]==='>'?'<':'999';
    await field('answers.0',wrongAnswer);
   }else if(row.mode==='order')await act('clear');
   else await act('choice',['left','right','equal'].find(x=>x!==row.want));
   ok(await feedback.count()===0,label+' edited work invalidates previous feedback');
   if(row.answers.length)await field('answers.0',row.answers[0]);
   else if(row.mode==='order')for(const i of row.sorted)await act('order',i);
   else await act('choice',row.want);
   await click('#actions [data-do="check"]');
   ok(await feedback.isVisible(),label+' corrected current recheck restores feedback');
   await shot('rechecked');
   previous=row;
  }
  ok(nextClicks===6,'real Next twice for each of three contiguous source courses');
  const last=rows.at(-1),before=await captureNow('before-shared-retry',last);
  label='shared-retry-'+key(last);
  await click('[data-do="p3-retry"]');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,last.index);
  const reset=await captureNow('after-shared-retry',last);
  ok(reset.attempts.length===before.attempts.length,'shared Retry retains original submissions');
  ok(reset.model.board.choice===null&&reset.model.history.length===0,
   'shared Retry clears only the current construction');
  await align();await act('choice',last.want);
  for(let i=0;i<last.answers.length;i++)await field('answers.'+i,last.answers[i]);
  await click('#actions [data-do="check"]');
  ok(await page.locator('#thinking-feedback').isVisible(),'retry can reestablish strict feedback');
  const redone=await captureNow('rechecked-shared-retry',last);
  ok(redone.attempts.length===before.attempts.length+1,'retry appends a new correct attempt');
  await shot('after-retry');

  // Actual native v2 download and blank independent context file-chooser import.
  label='native-v2-restore';
  const response=await page.goto(origin.base+'v2.html#trail');
  if(response)ok(response.fromServiceWorker()===true,'offline V2 source document');
  const source=await page.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  for(const row of rows){
   const lesson=source.lessons[row.id],task=lesson?.cases?.[row.index];
   ok(task?.attempts?.length>=3,row.id+':'+row.index+' original error/correction/recheck retained');
  }
  const started=page.waitForEvent('download');await click('#main [data-do="export"]');
  const downloaded=await started,bytes=fs.readFileSync(await downloaded.path());
  const backup=JSON.parse(bytes.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'unchanged native V2 backup format');
  ok(JSON.stringify(backup.state)===JSON.stringify(source),'V2 download retains all native work');
  fs.writeFileSync(path.join(out,'actual-native-v2.json'),bytes);
  const importFile=async(payload,name)=>{
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer:payload});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  };
  const raw=()=>restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok(Object.keys(blank.lessons).length===0,'native restore context still blank');
  ok((await importFile(bytes,'compare-native-v2.json')).includes('备份已合并'),
    'real blank-context file chooser import succeeds');
  const rawFirst=await raw();
  const restored=await restorePage.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  ok(JSON.stringify(restored)===JSON.stringify(backup.state),'real V2 import restored every task and attempt');
  ok((await importFile(bytes,'compare-repeat-v2.json')).includes('备份已合并'),'native repeat import accepted');
  ok(await raw()===rawFirst,'real repeat import is byte-idempotent');
  ok(!(await importFile(Buffer.from('{'),'compare-corrupt-v2.json')).includes('备份已合并'),
    'corrupt original V2 package rejected');
  ok(await raw()===rawFirst,'failed import leaves original bytes intact');
  const restoreResponse=await restorePage.goto(origin.base+'learn.html#lengthdifference');
  ok(restoreResponse?.fromServiceWorker()===true,'restored lesson opens with HTTP origin stopped');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='lengthdifference');
  ok(await restorePage.locator('#thinking-feedback').isVisible(),'restored source proof visible offline');
  await restorePage.screenshot({path:path.join(out,'native-v2-restored.png'),fullPage:false});
  screenshots.push('native-v2-restored.png');
  ok(errors.length===0,'no page exceptions or external requests');
  save();console.log('P9_COMPARE_BROWSER_OK '+JSON.stringify({native:rows.length,checks:checks.length,
   captures:captures.length,sha:checkoutSha,viewport:STANDARD_DESKTOP_VIEWPORT}));
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
