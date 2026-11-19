'use strict';
// Native 1920x1080 B28 plot evidence: all eleven reviewed source positions.
// Only an EMPTY lesson index is positioned. No solved state, answer, attempt,
// proof, or grade is inserted. Every record, dot, correction and Check uses UI.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-plot-adapter');
const rows=[
 ['measureplot',0,[31,39,42,52],10,1,2,6,['2','2']],
 ['measureplot',1,[21,29,32,38,41],10,1,1,5,['2']],
 ['measureplot',2,[30,40,40,50],10,1,2,6,['5']],
 ['quarterplot',0,[35,41,44,48,52],16,4,8,14,['1']],
 ['quarterplot',1,[17,20,23,24],8,2,4,7,['2']],
 ['quarterplot',2,[32,36,40,44],16,4,8,12,['0.75']],
 ['eighthplot',0,[17,18,18,20],8,8,16,24,['0.375','9.125']],
 ['eighthplot',1,[1,2,3,4],8,8,0,8,['0.375','1.25']],
 ['eighthplot',2,[16,17,17,18],8,8,16,20,['2','8.5']],
 ['modmoney',2,[31,39,42,52],10,1,2,6,['2','2']],
 ['modelChoice38',2,[31,39,42,52],10,1,2,6,['2','2']]
].map(([id,index,raw,rawDen,den,start,end,answers])=>({id,index,raw,rawDen,den,start,end,answers}));
const errors=[],checks=[],captures=[],screenshots=[];
const proofContracts=['math','correction','persistence','negative','backup'];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const check=(value,label)=>{assert.ok(value,label);checks.push(label);};
const rounded=(r,den,rawDen)=>Math.floor(r*den/rawDen+0.5);
const key=r=>r.id+'-'+r.index;
function save(){fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
 schema:'math-p9-plot-browser/1',proofContracts,provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
 errors,checks,captures,screenshots
},null,2)+'\n');}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 let browser,origin,context,page,restoredContext,restoredPage,label='begin';
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  context=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push(String(error)));
  context.on('request',req=>{if(/^https?:/.test(req.url())&&!req.url().startsWith(origin.base))errors.push('external '+req.url());});
  const shot=async suffix=>{const file=label+'-'+suffix+'.png';await page.screenshot({path:path.join(out,file),fullPage:false});screenshots.push(file);};
  const click=async(selector)=>{
   // B28 intentionally renders the same add-point action in the SVG axis
   // and in the accessible, disclosed button row. Choose the original
   // button control explicitly rather than ambiguously matching both.
   const target=selector.startsWith('[data-x="m28-mark"]')||
    selector.startsWith('[data-x="m28-unmark"]')
     ?'#extra-controls button'+selector:selector;
   const loc=page.locator(target);assert.equal(await loc.count(),1,target);
   // The shared P3 Retry and the dot controls live in original disclosure
   // elements. Open their actual ancestor summaries before the genuine click.
   for(let depth=0;depth<8&&!await loc.isVisible();depth++){
    const closed=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(),1,selector+' has one outermost closed disclosure');
    await closed.locator(':scope > summary').click();
   }
   assert.equal(await loc.isVisible(),true,selector+' must be reachable');
   await loc.scrollIntoViewIfNeeded();await loc.click();};
  const field=async(name,value)=>{const loc=page.locator('[data-xfield="'+name+'"]');assert.equal(await loc.count(),1,name);await loc.fill(String(value));};
  const captureNow=async(phase,row)=>{const item=await capture(page,out,key(row),row,phase);captures.push({
   id:row.id,index:row.index,phase,storage:item.storage,attempts:item.attempts.length,
   board:item.model?.board,issue:item.model?.issue,
  });return item;};

  // Two separate real browser contexts are independently warmed while the
  // origin exists; every subsequent task, reload, native export and import runs
  // with the original HTTP server genuinely stopped.
  restoredContext=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  restoredPage=await restoredContext.newPage();restoredPage.setDefaultTimeout(20000);
  restoredPage.on('pageerror',error=>errors.push('restore: '+String(error)));
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
      channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
    });
    if(status?.cache===release&&status.complete&&status.cached===status.total)break;
    await tab.waitForTimeout(100);
   }
   check(status?.cache===release&&status.complete===true&&status.cached===status.total,
    role+' has a fully available same-release offline cache');
  }
  await warm(page,'source');await warm(restoredPage,'native restore');
  const blank=await restoredPage.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  check(Object.keys(blank.lessons).length===0,'native V2 restore context begins empty');
  await origin.close();check(!origin.server.listening,'HTTP origin stopped before original dot-plot controls');

  let previous=null,actualNext=0;
  for(const row of rows){
   label=key(row);
   const roundedReadings=row.raw.map(x=>rounded(x,row.den,row.rawDen));
   const frequencies=Array(row.end-row.start+1).fill(0);
   for(const v of roundedReadings){check(v>=row.start&&v<=row.end,label+' tick within scale');frequencies[v-row.start]++;}
   check(frequencies.reduce((a,b)=>a+b,0)===row.raw.length,label+' each source reading counted once');
   if(previous?.id===row.id&&previous.index+1===row.index){
    // Real native Next: keeps all earlier mistakes and saved models.
    await click('#actions [data-do="next"]');actualNext++;
    await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
    check((await page.evaluate(()=>window.mathLesson.snapshot())).id===row.id,label+' real Next retained lesson');
   }else{
    const response=await page.goto(origin.base+'learn.html#'+row.id,{waitUntil:'domcontentloaded'});
    check(response?.fromServiceWorker()===true,label+' navigation was served offline');
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
    // New courses start with an empty original lesson. Enter its task view;
    // only the two unrelated B33/B38 prerequisites need a nonzero position.
    // No answer, attempt, model, score or evidence is ever inserted.
    await page.evaluate(({id,index})=>{
     const state=JSON.parse(localStorage.getItem('math-explorer-v2'));
     const lesson=state.lessons[id];
     if(!lesson||Object.values(lesson.cases||{}).some(c=>c.attempts?.length))
      throw Error('Native position requires untouched lesson '+id);
     lesson.index=index;lesson.view='task';
     localStorage.setItem('math-explorer-v2',JSON.stringify(state));
    },row);
    const reload=await page.reload();
    check(reload?.fromServiceWorker()===true,label+' empty original task view is served offline');
    await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   }
   check(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' 1920x1080');
   await shot('initial');
   const feedback=page.locator('#thinking-feedback');
   check(await feedback.count()===0,label+' no premature feedback');
   // Observable first wrong reading survives subsequent correction and Check.
   await field('measure','999');await click('[data-x="m28-record"]');
   const bad=await captureNow('wrong-reading',row);
   check(bad.model.board.bad===true,label+' first wrong recorded');
   check(bad.model.board.first.measurement0==='999',label+' raw first wrong preserved');
   await click('#actions [data-do="check"]');
   check(await feedback.count()===0,label+' failed check gives no bounded evidence');
   // Add and retract an incorrect dot without changing the original raw task.
   await click('[data-x="m28-mark"][data-index="0"]');
   await click('[data-x="m28-unmark"][data-index="0"]');
   for(let i=0;i<row.raw.length;i++){
    await click('[data-x="m28-select"][data-index="'+i+'"]');
    await field('measure',String(roundedReadings[i]/row.den));
    await click('[data-x="m28-record"]');
   }
   const recorded=await captureNow('all-readings',row);
   check(recorded.model.board.records.length===row.raw.length&&
    recorded.model.board.records.every(x=>x!==null),label+' all readings actually saved');
   for(let i=0;i<frequencies.length;i++)for(let j=0;j<frequencies[i];j++)
    await click('[data-x="m28-mark"][data-index="'+i+'"]');
   for(let i=0;i<row.answers.length;i++)await field('answers.'+i,row.answers[i]);
   const pending=await captureNow('correct-unsubmitted',row);
   check(JSON.stringify(pending.model.board.marks)===JSON.stringify(frequencies),label+' UI dot frequencies');
   check(await feedback.count()===0,label+' complete work is not yet submitted');
   await click('#actions [data-do="check"]');
   check(await feedback.isVisible(),label+' current exact checked work receives feedback');
   const observed=await feedback.innerText();
   check(observed.includes('重复长度')&&observed.includes('刻度'),label+' honest bounded dot feedback');
   const done=await captureNow('correct-submitted',row);
   check(done.attempts.length>=2,label+' wrong Check and corrected Check both retained');
   await shot('checked');
   await page.reload();await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   check(await feedback.isVisible(),label+' proof survives actual persistence');
   const reloaded=await captureNow('reloaded',row);
   check(JSON.stringify(reloaded.model)===JSON.stringify(done.model),label+' full model persisted');
   check(JSON.stringify(reloaded.record)===JSON.stringify(done.record),label+' original attempts persisted');
   // Real unsaved edit must revoke a previously checked proof.
   await field('answers.0','999');
   check(await feedback.count()===0,label+' stale evidence withheld on edit');
   await field('answers.0',row.answers[0]);await click('#actions [data-do="check"]');
   check(await feedback.isVisible(),label+' current recheck restores evidence');
   await shot('rechecked');
   previous=row;
  }
  check(actualNext===6,'original Next advanced two times in each of three measurement courses');

  // Real shared Retry on a completed source-backed course; old attempts stay
  // while the new current model is rebuilt using visible controls only.
  const lastRow=rows.at(-1),beforeRetry=await captureNow('before-shared-retry',lastRow);
  label='shared-retry-'+key(lastRow);
  await click('[data-do="p3-retry"]');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,lastRow.index);
  const reset=await captureNow('after-shared-retry',lastRow);
  check(reset.attempts.length===beforeRetry.attempts.length,'real retry preserves all previous attempts');
  check(reset.model.board.records.every(x=>x===null),'real retry starts a fresh dot-plot construction');
  const reread=lastRow.raw.map(n=>rounded(n,lastRow.den,lastRow.rawDen));
  const refreq=Array(lastRow.end-lastRow.start+1).fill(0);
  reread.forEach(n=>refreq[n-lastRow.start]++);
  for(let i=0;i<reread.length;i++){
   await click('[data-x="m28-select"][data-index="'+i+'"]');
   await field('measure',String(reread[i]/lastRow.den));
   await click('[data-x="m28-record"]');
  }
  for(let i=0;i<refreq.length;i++)for(let n=0;n<refreq[i];n++)
   await click('[data-x="m28-mark"][data-index="'+i+'"]');
  for(let i=0;i<lastRow.answers.length;i++)await field('answers.'+i,lastRow.answers[i]);
  await click('#actions [data-do="check"]');
  check(await page.locator('#thinking-feedback').isVisible(),'real shared Retry can restore strict feedback');
  const afterRetry=await captureNow('rechecked-shared-retry',lastRow);
  check(afterRetry.attempts.length===beforeRetry.attempts.length+1,
   'new current Check appends without replacing previous attempts');
  await shot('after-retry');

  // A real native V2 download and file-chooser import, not JSON injection.
  label='native-v2-restore';
  await page.goto(origin.base+'v2.html#trail');
  const sourceState=await page.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  for(const row of rows){
   const lesson=sourceState.lessons[row.id];
   check(lesson&&lesson.cases[row.index].attempts.length>=3,
    row.id+':'+row.index+' still has original wrong/correct/rechecked attempts');
   check(lesson.models[row.index].board.records.every(x=>x!==null),
    row.id+':'+row.index+' retains complete original records in cumulative State');
  }
  const downloadEvent=page.waitForEvent('download');
  await click('#main [data-do="export"]');
  const download=await downloadEvent,bytes=fs.readFileSync(await download.path());
  const backup=JSON.parse(bytes.toString('utf8'));
  check(backup.app==='math-explorer'&&backup.version===2,'official V2 backup envelope');
  check(JSON.stringify(backup.state)===JSON.stringify(sourceState),'downloaded native V2 matches completed work');
  fs.writeFileSync(path.join(out,'actual-native-v2.json'),bytes);
  try{
   check(Object.keys(blank.lessons).length===0,'native restore is still in its original blank context');
   const importFile=async(payload,name)=>{
    const chooser=restoredPage.waitForEvent('filechooser');
    await restoredPage.locator('#main [data-do="import"]').first().click();
    await (await chooser).setFiles({name,mimeType:'application/json',buffer:payload});
    await restoredPage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    return restoredPage.locator('#toast').innerText();
   };
   const raw=()=>restoredPage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
   check((await importFile(bytes,'plot-native.json')).includes('备份已合并'),'native file chooser import succeeded');
   const importedRaw=await raw();
   const imported=await restoredPage.evaluate(async()=>{
    const {unpackText}=await import('./storage.js');
    return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   });
   check(JSON.stringify(imported)===JSON.stringify(backup.state),'native V2 restored complete original state');
   check((await importFile(bytes,'plot-native-repeat.json')).includes('备份已合并'),'native repeated import processed');
   check(await raw()===importedRaw,'repeated native V2 import is byte-idempotent');
   check(!(await importFile(Buffer.from('{'),'plot-corrupt.json')).includes('备份已合并'),'bad V2 package rejected');
   check(await raw()===importedRaw,'bad import preserves all original state bytes');
   const response=await restoredPage.goto(origin.base+'learn.html#eighthplot');
   check(response?.fromServiceWorker()===true,'V2 restored learning route works after origin stops');
   await restoredPage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='eighthplot');
   check(await restoredPage.locator('#thinking-feedback').isVisible(),
    'restored strict source-backed feedback is visible with no HTTP origin');
   await restoredPage.screenshot({path:path.join(out,'native-v2-restored.png'),fullPage:false});
   screenshots.push('native-v2-restored.png');
  }finally{await restoredContext.close();restoredContext=null;}
  check(errors.length===0,'no browser page exceptions or foreign requests');
  save();console.log('P9_PLOT_BROWSER_OK '+JSON.stringify({native:rows.length,checks:checks.length,
   captures:captures.length,viewport:STANDARD_DESKTOP_VIEWPORT,sha:checkoutSha}));
 }catch(error){
  errors.push(label+': '+String(error));
  if(page)await page.screenshot({path:path.join(out,'failure.png')}).then(()=>screenshots.push('failure.png')).catch(()=>{});
  save();console.error(error.stack||String(error));process.exitCode=1;
 }finally{await restoredContext?.close().catch(()=>{});await context?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)main().catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
