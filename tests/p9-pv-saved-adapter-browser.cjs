'use strict';
// #321: authentic B07 controls at 1920x1080, stopped-origin offline,
// original Check/Retry/Next, exact State-v2 bytes and import rejection.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-pv-saved-adapter');
const rows=[
 {id:'screen1000',index:0,n:347,first:[3,4,7,0],second:[3,4,7,0],forms:['blocks','sticks'],expanded:true},
 {id:'twoproblems',index:2,n:68,first:[0,6,8,0],second:[0,6,8,0],forms:['sticks','blocks'],expanded:true},
 {id:'faces100',index:1,n:63,first:[0,6,3,0],second:[0,6,3,0],forms:['blocks','sticks'],chart:true},
 {id:'faces120',index:1,n:112,first:[0,11,2,0],second:[1,1,2,0],forms:['sticks','blocks'],firstEnd:true}
];
const checks=[],errors=[],captures=[],screenshots=[];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evt=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):null;
const provenance={repo:'runlinx-eng/math',issue:321,sha,testedCheckoutSha:sha,
 headSha:evt?.pull_request?.head?.sha||sha,runId:process.env.GITHUB_RUN_ID||null,
 runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||0),originalControls:true,
 seededCorrectWork:false,seededLessonPositionOnly:true,masteryInferred:false};
const ok=(v,name)=>{assert.ok(v,name);checks.push(name);};
function write(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p9-pv-saved-browser/1',provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
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
  await restorePage.evaluate(async()=>Boolean(await navigator.serviceWorker.ready));
  await restorePage.reload();await restorePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  ok(await restorePage.evaluate(()=>!!navigator.serviceWorker.controller),'backup context SW controlled');
  await warmAndStop(page,origin,release,ok,label);
  const action=async selector=>{
   const loc=page.locator(selector);
   assert.equal(await loc.count(),1,label+' exact original control '+selector);
   for(let i=0;i<8&&!(await loc.isVisible());i++){
    const closed=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(),1,label+' closed ancestor '+selector);
    await closed.locator(':scope > summary').click();
   }
   ok(await loc.isVisible()&&await loc.isEnabled(),label+' enabled original '+selector);
   await loc.scrollIntoViewIfNeeded();await loc.click();
  };
  const snap=async(row,phase)=>{
   label=row.id+'-'+row.index+'-'+phase;
   const c=await capture(page,out,row.id+'-'+row.index,row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,storage:c.storage});
   return c;
  };
  const selectOriginal=async row=>{
   label=row.id+'-'+row.index+'-select';
   await page.goto(origin.base+'learn.html#'+row.id);
   let reply=await page.reload();ok(reply?.fromServiceWorker()===true,'offline native lesson opened '+row.id);
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   const before=await page.evaluate(async({id,index})=>{
    const {unpackText,packText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Original position already checked');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return {original:lesson.models[index],previous:(lesson.cases[index]?.attempts||[]).length};
   },row);
   ok(before.previous===0,'no seeded attempt '+row.id);
   reply=await page.reload();ok(reply?.fromServiceWorker()===true,'reloaded exact position offline '+row.id);
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'1920x1080 exact viewport');
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const {pvSavedBinding}=await import('./learning/pv-saved-evidence.js');
    const task=sessionTaskFor(id,index);
    return {n:task.n,type:task.type,forms:task.forms,
     binding:pvSavedBinding(task,{sessionId:id,index})?.nodeId,source:LESSONS[id].topicId};
   },row);
   ok(original.type==='x-pvbench'&&original.n===row.n&&
     JSON.stringify(original.forms)===JSON.stringify(row.forms)&&
     original.binding===original.source,'original source exact, not reused widget '+row.id);
   ok(await page.locator('#thinking-feedback').count()===0,'no early strict feedback');
  };
  const build=async(row,units,formIndex)=>{
   if(formIndex===1)await action('[data-x="pv-form"][data-form="'+row.forms[1]+'"]');
   for(let unit=0;unit<3;unit++)for(let i=0;i<units[unit];i++)
    await action('#extra-visual [data-x="pv-add"][data-index="'+unit+'"][data-delta="1"]');
   await action('#extra-visual [data-x="pv-save"]');
  };
  for(const row of rows){
   await selectOriginal(row);
   await build(row,row.first,0);
   const first=await snap(row,'first-save');
   ok(first.model.saved.length===1&&first.model.saved[0].form===row.forms[0]&&
     JSON.stringify(first.model.saved[0].u)===JSON.stringify(row.first),'first authentic saved representation');
   await build(row,row.second,1);
   const both=await snap(row,'second-save');
   ok(both.model.saved.length===2&&both.model.saved[1].form===row.forms[1]&&
     JSON.stringify(both.model.saved[1].u)===JSON.stringify(row.second),'second original form and save');
   ok(both.model.history.length===0,'no fake add/remove history');
   const field=async(key,value)=>{
    const locator=page.locator('#extra-controls [data-xfield="'+key+'"]');
    ok(await locator.count()===1,'original field '+key);await locator.fill(String(value));
   };
   if(row.expanded)for(let i=0;i<3;i++)
    await field('parts.'+i,[Math.floor(row.n/100)*100,Math.floor(row.n/10)%10*10,row.n%10][i]);
   if(row.chart)await action('#extra-visual [data-x="pv-cell"][data-index="'+row.n+'"]');
   await field('answer',row.n-1);
   await action('#actions [data-do="check"]');
   const wrong=await snap(row,'wrong-checked');
   ok(wrong.attempts.length===1&&wrong.attempts[0].value.answer===row.n-1,'wrong Check stored in original attempt');
   ok(await page.locator('#thinking-feedback').count()===0,'wrong attempt gets no strict feedback');
   await field('answer',row.n);
   ok(await page.locator('#thinking-feedback').count()===0,'stale feedback remains absent');
   await action('#actions [data-do="check"]');
   const accepted=await snap(row,'correct-checked');
   ok(accepted.attempts.length===2&&accepted.attempts[0].value.answer===row.n-1&&
     accepted.attempts[1].value.answer===row.n,'real correction and both preserved');
   const proof=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {replayPVSavedEvidence}=await import('./learning/pv-saved-evidence.js');
    return replayPVSavedEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:accepted.model});
   ok(proof?.total===row.n&&proof.representations.length===2&&
     proof.savedOrderObserved===true&&proof.addRemoveHistoryObserved===false&&
     proof.learnerMasteryAssessed===false,'two original saved source-bound snapshots; no fabricated process');
   ok(await page.locator('#thinking-feedback').isVisible(),'current checked result displays strict feedback');
   const message=await page.locator('#thinking-feedback').innerText();
   ok(message.includes('保存')&&message.includes('没有完整事件记录'),'bounded feedback disclaims absent history');
   label=row.id+'-'+row.index+'-correct';
   const png=label+'.png';await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   let reply=await page.reload();
   ok(reply?.fromServiceWorker()===true,'accepted work reloads after origin stopped');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const persisted=await snap(row,'offline-reloaded');
   assert.deepEqual(persisted.model,accepted.model);
   assert.deepEqual(persisted.record,accepted.record);
   ok(await page.locator('#thinking-feedback').isVisible(),'strict feedback restored offline');
   if(row.id==='screen1000'){
    await action('#actions [data-do="next"]');
    ok(await page.evaluate(()=>window.mathLesson?.snapshot()?.index===1),'real Next navigates without erasing checked work');
    await page.goto(origin.base+'learn.html#'+row.id);
    await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='screen1000');
   }
  }
  const last=rows.at(-1),before=await snap(last,'before-retry');
  await action('[data-do="p3-retry"]');
  const retried=await snap(last,'after-retry');
  ok(retried.model.saved.length===0&&retried.attempts.length===before.attempts.length,
   'Retry clears current saved work but preserves both real attempts');
  ok(await page.locator('#thinking-feedback').count()===0,'Retry hides old feedback');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  const next=page.waitForEvent('download');await action('#main [data-do="export"]');
  const dl=await next,bytes=fs.readFileSync(await dl.path()),pack=JSON.parse(bytes.toString('utf8'));
  ok(pack.app==='math-explorer'&&pack.version===2,'original State-v2 export');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),bytes);
  async function importFile(buffer,name){
   const choose=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await choose).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  ok((await importFile(bytes,'pv-saved-original.json')).includes('备份已合并'),'original backup imports');
  const restored=await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importFile(bytes,'pv-saved-repeat.json')).includes('备份已合并'),'repeat backup imports');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restored,'repeat import idempotent');
  ok(!(await importFile(Buffer.from('{'),'pv-saved-damaged.json')).includes('备份已合并'),'bad backup rejected');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restored,'bad backup does not mutate storage');
  ok(errors.length===0,'no browser errors or external calls');
  write();console.log('P9_PV_SAVED_BROWSER_OK '+JSON.stringify({sha,rows:rows.length,checks:checks.length}));
 }catch(error){
  errors.push(label+': '+String(error));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  write();console.error(error.stack||String(error));process.exitCode=1;
 }finally{
  await restore?.close().catch(()=>{});await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
