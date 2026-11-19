'use strict';
// #256 isolated native 1920x1080 vessel Chromium evidence. Not registered into
// Required until #255 has been independently accepted on the merged main.
// No pre-seeded attempts, grades, mathematical operations or proofs.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
// Temporary diagnostic branch ONLY: test independent replay on actual Chromium
// event history before shared feedback registration. Do not merge this bypass.
// The WIP's eventual browser contract still requires actual visible feedback.
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-vessels-adapter');
const sources=[{id:'indirectmass',index:1},{id:'ordermeasure',index:1},{id:'precisionunits',index:1}];
const checks=[],captures=[],screenshots=[],errors=[];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const ok=(condition,message)=>{assert.ok(condition,message);checks.push(message);};
const key=x=>x.id+'-'+x.index;
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p9-vessels-browser/1',
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
  const act=(name,index)=>click('#extra-controls button[data-x="m28-'+name+'"]'+
   (index===undefined?'':'[data-index="'+index+'"]'));
  const field=async(name,value)=>{
   const el=page.locator('#extra-controls [data-xfield="'+name+'"]');
   assert.equal(await el.count(),1,name);await el.fill(String(value));
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
  const {sessionTaskFor}=await import('../dist/learning/bridges.js');
  const {replayVesselsEvidence}=await import('../dist/learning/vessels-evidence.js');
  const proved=(row,model,phase)=>{
    const proof=replayVesselsEvidence(sessionTaskFor(row.id,row.index),model,{sessionId:row.id,index:row.index});
    ok(!!proof,label+' '+phase+' independent exact math replay of real Chromium model');
    ok(proof?.eventCount===model.history.length,label+' '+phase+' verified all recorded events');
  };
  const decoded=tab=>tab.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  ok(Object.keys((await decoded(restorePage)).lessons).length===0,'restore begins empty');
  await origin.close();ok(!origin.server.listening,'HTTP origin stopped before all real vessel controls');
  for(const row of sources){
   label=key(row);
   const response=await page.goto(origin.base+'learn.html#'+row.id,{waitUntil:'domcontentloaded'});
   if(response)ok(response.fromServiceWorker()===true,label+' offline document');
   else ok(await page.evaluate(()=>!!navigator.serviceWorker.controller),label+' offline hash navigation');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   await page.evaluate(({id,index})=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2')),lesson=state.lessons[id];
    if(!lesson||Object.values(lesson.cases||{}).some(c=>c.attempts?.length))
     throw Error('Only untouched lesson positions may be selected');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',JSON.stringify(state));
   },row);
   const reload=await page.reload();
   ok(reload?.fromServiceWorker()===true,label+' offline actual reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const t=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const task=sessionTaskFor(id,index);
    return {type:task.type,nodeId:LESSONS[id]?.topicId,capacities:task.capacities,units:task.units,
     requiredUnit:task.requiredUnit||null,mode:task.mode,
     answers:(task.questions||[]).map(q=>String(q.value))};
   },row);
   ok(t.type==='x-m28-vessels'&&!!t.nodeId,label+' exact original vessel task');
   ok(t.capacities.every(n=>Number.isSafeInteger(n)&&n>0),label+' original integer capacities');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' standard desktop');
   const feedback=page.locator('#thinking-feedback');
   ok(await feedback.count()===0,label+' no early strict proof');
   await shot('initial');
   // Submit a genuinely wrong original state without adding fake answers.
   await click('#actions [data-do="check"]');
   const wrong=await snapshot('wrong-submitted',row);
   ok(wrong.attempts.length===1,label+' unsuccessful original check retained');
   ok(await feedback.count()===0,label+' unsuccessful check yields no strict proof');
   // All operations below use the original, visible B28 controls.
   for(let i=0;i<t.capacities.length;i++){
    await act('select',i);
    const unit=t.units.find(u=>u.id===(t.requiredUnit||t.units[0].id));
    ok(!!unit&&t.capacities[i]%unit.amount===0,label+' integral repeated unit model');
    await act('vunit',unit.id);
    for(let n=0;n<t.capacities[i]/unit.amount;n++)await act('pour');
    await act('seen');
   }
   if(t.mode==='order'){
    const sorted=t.capacities.map((n,i)=>({n,i})).sort((a,b)=>a.n-b.n||a.i-b.i);
    for(const x of sorted)await act('order',x.i);
   }
   for(let i=0;i<t.answers.length;i++)await field('answers.'+i,t.answers[i]);
   ok(await feedback.count()===0,label+' complete but unsubmitted work cannot receive proof');
   await click('#actions [data-do="check"]');
   ok(await feedback.count()===0,label+' shared UI feedback registration is still absent');
   const success=await snapshot('correct-submitted',row);
   proved(row,success.model,'correct-submitted');
   ok(success.attempts.length===2,label+' both actual attempts retained');
   ok(JSON.stringify(success.attempts.at(-1).value)===JSON.stringify(success.model),
    label+' latest check equals entire real vessel model');
   const poured=success.model.history.filter(e=>e.a==='pour').length;
   const expected=t.capacities.reduce((n,cap)=>n+cap/
     t.units.find(u=>u.id===(t.requiredUnit||t.units[0].id)).amount,0);
   ok(poured===expected,label+' all actual uniform-unit pours present');
   ok(success.model.board.seen.length===t.capacities.length,label+' every container recorded full');
   await shot('checked');
   const refreshed=await page.reload();
   ok(refreshed?.fromServiceWorker()===true,label+' true offline reload after success');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   ok(await feedback.count()===0,label+' no unregistered UI feedback after offline reload');
   const saved=await snapshot('reloaded',row);
   proved(row,saved.model,'offline-reloaded');
   ok(JSON.stringify(saved.model)===JSON.stringify(success.model)&&
    JSON.stringify(saved.record)===JSON.stringify(success.record),
    label+' original model and wrong/correct history survive reload');
   // Visible edit invalidates feedback without removing previous attempts.
   if(t.mode==='order')await act('clear');
   else await field('answers.0','999');
   ok(await feedback.count()===0,label+' changed current work invalidates stale proof');
   if(t.mode==='order'){
    const sorted=t.capacities.map((n,i)=>({n,i})).sort((a,b)=>a.n-b.n||a.i-b.i);
    for(const x of sorted)await act('order',x.i);
   }else await field('answers.0',t.answers[0]);
   await click('#actions [data-do="check"]');
   ok(await feedback.count()===0,label+' shared UI feedback still pending after recheck');
   const rechecked=await snapshot('rechecked',row);
   proved(row,rechecked.model,'rechecked');
   ok(rechecked.attempts.length===3,label+' genuine recheck appends original history');
   await shot('rechecked');
  }
  // Shared Retry on the final source: does not erase prior graded attempts.
  const last=sources.at(-1);label='shared-retry-'+key(last);
  const before=await snapshot('before-retry',last);
  await click('[data-do="p3-retry"]');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,last.index);
  const reset=await snapshot('after-retry',last);
  ok(reset.attempts.length===before.attempts.length,'Retry retains graded attempts');
  ok(reset.model.history.length===0,'Retry clears current vessel construction');
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
  ok((await importFile(bytes,'vessels-native-v2.json')).includes('备份已合并'),
   'native chooser imports into empty offline restore');
  const first=await raw();
  ok(JSON.stringify(await decoded(restorePage))===JSON.stringify(backup.state),
   'restored original errors and corrections intact');
  ok((await importFile(bytes,'vessels-repeat-v2.json')).includes('备份已合并'),
   'native repeat import accepted');
  ok(await raw()===first,'byte-idempotent repeat restore');
  ok(!(await importFile(Buffer.from('{'),'vessels-corrupt-v2.json')).includes('备份已合并'),
   'corrupt V2 rejected');
  ok(await raw()===first,'rejected package does not damage original bytes');
  const restored=await restorePage.goto(origin.base+'learn.html#ordermeasure');
  ok(restored?.fromServiceWorker()===true,'restored original lesson accessible offline');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='ordermeasure');
  ok(await restorePage.locator('#thinking-feedback').count()===0,
   'shared vessel UI feedback is not registered in isolated diagnostic checkout');
  await restorePage.screenshot({path:path.join(out,'native-v2-restored.png'),fullPage:false});
  screenshots.push('native-v2-restored.png');
  ok(errors.length===0,'no page exception or external request');
  save();console.log('P9_VESSELS_BROWSER_OK '+JSON.stringify({native:sources.length,
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
