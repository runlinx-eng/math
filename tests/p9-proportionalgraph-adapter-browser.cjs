'use strict';
// #298: original source-bound proportional graph point placement in real 1920x1080 Chromium.
// No seeded correct work; original events, native Check, offline cache and State-v2 are preserved.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-proportionalgraph-adapter');
const sources=[{id:'proportion37',index:3,nodeId:'mt_5mIcmKRCgA'},
 {id:'proportionGraph37',index:0,nodeId:'mt_FspV_imUGK'}];
const checks=[],captures=[],screenshots=[],errors=[];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const ok=(condition,message)=>{assert.ok(condition,message);checks.push(message);};
const key=row=>row.id+'-'+row.index;
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p9-proportionalgraph-browser/1',
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
  const field=async(name,value)=>{
   const el=page.locator('#extra-controls [data-xfield="'+name+'"]');
   assert.equal(await el.count(),1,label+' '+name);
   if(await el.evaluate(x=>x.tagName==='SELECT'))await el.selectOption(String(value));
   else await el.fill(String(value));
  };
  const plot=async(x,y)=>{await field('x',x);await field('y',y);await click('#extra-controls button[data-x="b16-plot"]');};
  const shot=async phase=>{const file=label+'-'+phase+'.png';await page.screenshot({path:path.join(out,file),fullPage:false});screenshots.push(file);};
  const snapshot=async(phase,row)=>{const c=await capture(page,out,key(row),row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,storage:c.storage,
    board:c.model?.board,historyCount:c.model?.history?.length||0});return c;};
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  async function warm(tab,role){
   await tab.goto(origin.base+'v2.html#trail');
   await tab.locator('#import-file').waitFor({state:'attached'});
   let status=null;
   for(let n=0;n<300;n++){
    status=await tab.evaluate(async()=>{
     if(!navigator.serviceWorker.controller)return null;
     return new Promise(resolve=>{
      const channel=new MessageChannel(),timeout=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
      channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
    });
    if(status?.cache===release&&status.complete&&status.cached===status.total)break;
    await tab.waitForTimeout(100);
   }
   ok(status?.cache===release&&status.complete&&status.cached===status.total,role+' complete offline cache');
  }
  await warm(page,'source');await warm(restorePage,'restore');
  const decoded=tab=>tab.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  ok(Object.keys((await decoded(restorePage)).lessons).length===0,'restore initially empty');
  await origin.close();ok(!origin.server.listening,'HTTP origin stopped before real controls');
  for(const row of sources){
   label=key(row);
   const response=await page.goto(origin.base+'learn.html#'+row.id,{waitUntil:'domcontentloaded'});
   if(response)ok(response.fromServiceWorker()===true,label+' offline lesson');
   else ok(await page.evaluate(()=>!!navigator.serviceWorker.controller),label+' offline navigation');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   await page.evaluate(({id,index})=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2')),lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Only untouched original lesson may be selected');
    lesson.index=index;lesson.view='task';localStorage.setItem('math-explorer-v2',JSON.stringify(state));
   },row);
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,label+' offline reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const task=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const t=sessionTaskFor(id,index);
    return {type:t.type,nodeId:LESSONS[id]?.topicId,data:t.data,
      maxX:t.maxX,maxY:t.maxY,line:t.line,xLabel:t.xLabel,yLabel:t.yLabel,rate:t.rate};
   },row);
   ok(task.type==='x-graphpoints'&&task.nodeId===row.nodeId,label+' actual original source');
   ok(JSON.stringify(task.data)===JSON.stringify([[0,0],[1,2],[2,4],[3,6],[4,8]])&&
      task.maxX===4&&task.maxY===8&&task.rate===2&&task.line,
     label+' unchanged graph values');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' standard viewport');
   const feedback=page.locator('#thinking-feedback');
   ok(await feedback.count()===0,label+' no pre-Check feedback');
   await shot('initial');
   if(row.id==='proportion37'){
    await plot(0,1);
    const bad=await snapshot('wrong',row);
    ok(bad.model.board.points.some(p=>p[0]===0&&p[1]===1)&&bad.model.board.first.y===1,
      label+' wrong first point retained');
    ok(await feedback.count()===0,label+' wrong point has no strict feedback');
    await plot(0,0);
    for(let x=1;x<=4;x++)await plot(x,2*x);
   }else{
    await plot(3,7);
    await click('#extra-controls button[data-x="b16-reset"]');
    const reset=await snapshot('reset',row);
    ok(reset.model.board.points.length===0&&reset.model.board.first.x===3&&
       reset.model.board.first.y===7&&reset.model.history.length===2,
      label+' reset retains initial error and history');
    for(let x=0;x<=4;x++)await plot(x,2*x);
   }
   await field('answer','2');await field('reason','per-x');
   const ready=await snapshot('ready',row);
   ok(ready.model.board.points.length===5&&ready.model.history.length>=5,label+' five real placements');
   ok(await feedback.count()===0,label+' no evidence before Check');
   await click('#actions [data-do="check"]');
   ok(await feedback.isVisible(),label+' actual Check reveals bounded feedback');
   const success=await snapshot('checked',row);
   ok(success.attempts.length===1&&JSON.stringify(success.attempts[0].value)===JSON.stringify(success.model),
      label+' submitted snapshot equals current model');
   const proof=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {replayProportionalGraphEvidence}=await import('./learning/proportionalgraph-evidence.js');
    return replayProportionalGraphEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:success.model});
   ok(proof?.construction?.unitRate==='2'&&proof.construction.finalPoints.length===5&&
      proof.construction.incorrectIndices.length===1,label+' original replay exact');
   ok(row.id==='proportion37'?proof.construction.replacements.length===1:
      proof.construction.resets.length===1,label+' correction/reset actually observed');
   await shot('checked');
   const refreshed=await page.reload();
   ok(refreshed?.fromServiceWorker()===true,label+' saved work offline refresh');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   ok(await feedback.isVisible(),label+' feedback after offline refresh');
   const saved=await snapshot('reloaded',row);
   ok(JSON.stringify(saved.model)===JSON.stringify(success.model)&&
      JSON.stringify(saved.record)===JSON.stringify(success.record),
      label+' original record preserved bytewise on reload');
   await shot('reloaded');
  }
  const last=sources.at(-1);label='retry-'+key(last);
  const before=await snapshot('before-retry',last);
  await click('[data-do="p3-retry"]');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,last.index);
  const reset=await snapshot('after-retry',last);
  ok(reset.attempts.length===before.attempts.length,'Retry preserves graded history');
  ok(reset.model.history.length===0,'Retry only clears current work');
  label='native-v2-backup';await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').waitFor({state:'visible'});
  const original=await decoded(page);
  const started=page.waitForEvent('download');await click('#main [data-do="export"]');
  const download=await started,bytes=fs.readFileSync(await download.path()),backup=JSON.parse(bytes.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,'original State-v2 format');
  ok(JSON.stringify(backup.state)===JSON.stringify(original),'export preserves full original data');
  fs.writeFileSync(path.join(out,'actual-native-v2.json'),bytes);
  async function importFile(buffer,name){
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  const raw=()=>restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importFile(bytes,'proportionalgraph-native-v2.json')).includes('备份已合并'),'offline import works');
  const first=await raw();
  ok(JSON.stringify(await decoded(restorePage))===JSON.stringify(backup.state),'source data restored');
  ok((await importFile(bytes,'proportionalgraph-repeat-v2.json')).includes('备份已合并'),'repeat import accepted');
  ok(await raw()===first,'repeat import idempotent');
  ok(!(await importFile(Buffer.from('{'),'proportionalgraph-corrupt-v2.json')).includes('备份已合并'),
   'invalid backup rejected');
  ok(await raw()===first,'invalid backup does not damage original');
  const restored=await restorePage.goto(origin.base+'learn.html#proportion37');
  ok(restored?.fromServiceWorker()===true,'restored lesson offline');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='proportion37');
  await restorePage.evaluate(()=>{
   const state=JSON.parse(localStorage.getItem('math-explorer-v2')),lesson=state.lessons.proportion37;
   if(lesson.cases['3']?.attempts.length!==1)throw Error('Checked source not restored');
   lesson.index=3;lesson.view='task';localStorage.setItem('math-explorer-v2',JSON.stringify(state));
  });
  const selected=await restorePage.reload();
  ok(selected?.fromServiceWorker()===true,'source task reload offline after restore');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.index===3);
  const preserved=await restorePage.evaluate(async()=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {replayProportionalGraphEvidence}=await import('./learning/proportionalgraph-evidence.js');
   const lesson=JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.proportion37;
   const model=lesson.models['3'],record=lesson.cases['3'];
   const proof=replayProportionalGraphEvidence(sessionTaskFor('proportion37',3),model,{sessionId:'proportion37',index:3});
   return !!proof&&proof.construction.incorrectIndices.length===1&&proof.construction.replacements.length===1&&
    JSON.stringify(record.attempts.at(-1)?.value)===JSON.stringify(model);
  });
  ok(preserved,'restored first wrong and corrected positions still replay');
  ok(await restorePage.locator('#thinking-feedback').isVisible(),'restored feedback visible offline');
  await restorePage.screenshot({path:path.join(out,'restored-native-v2.png'),fullPage:false});
  screenshots.push('restored-native-v2.png');
  ok(errors.length===0,'no page errors or external requests');
  save();console.log('P9_PROPORTIONALGRAPH_BROWSER_OK '+JSON.stringify({
   native:sources.length,checks:checks.length,captures:captures.length,sha:checkoutSha,viewport:STANDARD_DESKTOP_VIEWPORT}));
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
