'use strict';
// #280 source-bound 1920x1080 Chromium evidence, registered for targeted CI.
// No pre-seeded attempts, grades, mathematical operations or proofs.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-ratioshare-adapter');
const sources=[{id:'ratioShare37',index:0},{id:'ratioShare37',index:1},{id:'ratioShare37',index:2},{id:'ratioDivide37',index:0},{id:'ratioDivide37',index:1},{id:'ratioDivide37',index:2}];
const checks=[],captures=[],screenshots=[],errors=[];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const ok=(condition,message)=>{assert.ok(condition,message);checks.push(message);};
const key=x=>x.id+'-'+x.index;
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p9-ratioshare-browser/1',
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
  const act=(name,index)=>click('#extra-visual button[data-x="r37-'+name+'"]'+
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
  await origin.close();ok(!origin.server.listening,'HTTP origin stopped before all real ratio controls');

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
    return {type:t.type,nodeId:LESSONS[id]?.topicId,total:t.total,parts:t.parts,
      labels:t.labels,unit:t.unit,answers:(t.questions||[]).map(q=>String(q.value))};
   },row);
   ok(task.type==='x-r37-share'&&!!task.nodeId,label+' exact original equal-share task');
   const totalSlots=task.parts.reduce((sum,n)=>sum+n,0);
   ok(task.parts.length>=2&&task.parts.length<=3&&task.parts[1]>=2&&
    Number.isSafeInteger(task.total)&&task.total%totalSlots===0,label+' exact positive parts');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' standard viewport');
   const feedback=page.locator('#thinking-feedback');
   ok(await feedback.count()===0,label+' no unsubmitted proof');
   await shot('initial');
   let slot=0;
   // Overallocate the first person by one part; underallocate the second by one.
   // All slots must be filled to enable the original Check button.
   for(let owner=0;owner<task.parts.length;owner++){
    await act('person',owner);
    const count=task.parts[owner]+(owner===0?1:owner===1?-1:0);
    for(let n=0;n<count;n++)await act('slot',slot++);
   }
   ok(slot===totalSlots,label+' actually placed all equal parts');
   for(let i=0;i<task.answers.length;i++)await field('answers.'+i,task.answers[i]);
   ok(await feedback.count()===0,label+' unsubmitted incorrect distribution has no proof');
   await click('#actions [data-do="check"]');
   const wrong=await snapshot('wrong-submitted',row);
   ok(wrong.attempts.length===1,label+' original unsuccessful Check persists');
   const wrongCounts=task.parts.map((_,i)=>wrong.model.board.slots.filter(n=>n===i).length);
   ok(wrongCounts[0]===task.parts[0]+1&&wrongCounts[1]===task.parts[1]-1,
    label+' verified wrong split, not just a wrong answer field');
   ok(await feedback.count()===0,label+' incorrect submission never earns strict source feedback');
   await act('person',1);
   await act('slot',task.parts[0]);
   ok(await feedback.count()===0,label+' correction without Check not called completed proof');
   await click('#actions [data-do="check"]');
   ok(await feedback.isVisible(),label+' correct original Check exposes source feedback');
   const success=await snapshot('correct-submitted',row);
   ok(success.attempts.length===2,label+' failed and successful original attempts retained');
   ok(JSON.stringify(success.attempts.at(-1).value)===JSON.stringify(success.model),
    label+' latest submission matches current model with full operation history');
   const slots=success.model.board.slots,events=success.model.history;
   const counts=task.parts.map((_,i)=>slots.filter(n=>n===i).length);
   ok(slots.every(n=>n>=0)&&JSON.stringify(counts)===JSON.stringify(task.parts),
    label+' every equal piece assigned exactly once in prescribed ratio');
   ok(events.filter(e=>e.a==='slot').length===totalSlots+1,
    label+' original slot events include one real reassignment');
   ok(events.at(-1).a==='slot'&&events.at(-1).i===String(task.parts[0]),
    label+' final original action changed one specific piece');
   ok(task.parts.reduce((sum,n)=>sum+n*(task.total/totalSlots),0)===task.total,
    label+' independent quantity sum matches the original total');
   ok(JSON.stringify(wrong.model.board.slots)!==JSON.stringify(slots),
    label+' initial wrong model preserved separately from correction');
   await shot('checked');
   const refresh=await page.reload();
   ok(refresh?.fromServiceWorker()===true,label+' checked work survives offline reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   ok(await feedback.isVisible(),label+' feedback survives original offline reload');
   const saved=await snapshot('reloaded',row);
   ok(JSON.stringify(saved.model)===JSON.stringify(success.model)&&
    JSON.stringify(saved.record)===JSON.stringify(success.record),
    label+' all saved native work and attempts persist identically');
   await field('answers.0','999');
   ok(await feedback.count()===0,label+' unsaved answer edit revokes strict checked proof');
   await field('answers.0',task.answers[0]);
   await click('#actions [data-do="check"]');
   ok(await feedback.isVisible(),label+' current rechecked allocation restores feedback');
   const rechecked=await snapshot('rechecked',row);
   ok(rechecked.attempts.length===3,label+' third Check appends, never erases failed history');
   await shot('rechecked');
  }
  // Shared Retry on the final source: does not erase prior graded attempts.
  const last=sources.at(-1);label='shared-retry-'+key(last);
  const before=await snapshot('before-retry',last);
  await click('[data-do="p3-retry"]');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,last.index);
  const reset=await snapshot('after-retry',last);
  ok(reset.attempts.length===before.attempts.length,'Retry retains graded attempts');
  ok(reset.model.history.length===0,'Retry clears current ratio construction');
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
  ok((await importFile(bytes,'ratioshare-native-v2.json')).includes('备份已合并'),
   'native chooser imports into empty offline restore');
  const first=await raw();
  ok(JSON.stringify(await decoded(restorePage))===JSON.stringify(backup.state),
   'restored original errors and corrections intact');
  ok((await importFile(bytes,'ratioshare-repeat-v2.json')).includes('备份已合并'),
   'native repeat import accepted');
  ok(await raw()===first,'byte-idempotent repeat restore');
  ok(!(await importFile(Buffer.from('{'),'ratioshare-corrupt-v2.json')).includes('备份已合并'),
   'corrupt V2 rejected');
  ok(await raw()===first,'rejected package does not damage original bytes');
  const restored=await restorePage.goto(origin.base+'learn.html#ratioShare37');
  ok(restored?.fromServiceWorker()===true,'restored original lesson accessible offline');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='ratioProblem37');
  ok(await restorePage.locator('#thinking-feedback').isVisible(),
   'previous successful ratio relation proof restored offline');
  await restorePage.screenshot({path:path.join(out,'native-v2-restored.png'),fullPage:false});
  screenshots.push('native-v2-restored.png');
  ok(errors.length===0,'no page exception or external request');
  save();console.log('P9_RATIOSHARE_BROWSER_OK '+JSON.stringify({native:sources.length,
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
