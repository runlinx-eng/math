'use strict';
// #301: original controls, first wrong check, correction, offline and native State-v2.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-thousandstep-adapter');
const tasks=[
 {id:'thousandstep',index:0,start:'4562',delta:1,end:'5562',changed:[1]},
 {id:'thousandstep',index:1,start:'4562',delta:-1,end:'3562',changed:[1]},
 {id:'thousandstep',index:2,start:'9500',delta:1,end:'10500',changed:[0,1]},
 {id:'thousandstep',index:3,start:'10500',delta:-1,end:'9500',changed:[0,1]}
];
const checks=[],screenshots=[],captures=[],errors=[];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evt=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:evt.pull_request?.head?.sha||sha,testedCheckoutSha:sha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const ok=(value,label)=>{assert.ok(value,label);checks.push(label);};
const save=()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p9-thousandstep-browser/1',provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
 proofContracts:['math','correction','persistence','negative','backup'],checks,screenshots,captures,errors},null,2)+'\n');};
async function run(){
 fs.mkdirSync(out,{recursive:true});
 let browser,context,page,restore,restorePage,origin,label='startup';
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  context=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  restore=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await context.newPage();restorePage=await restore.newPage();
  page.setDefaultTimeout(20000);restorePage.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(String(e)));
  restorePage.on('pageerror',e=>errors.push('restore '+String(e)));
  context.on('request',req=>{if(/^https?:/.test(req.url())&&!req.url().startsWith(origin.base))errors.push('external '+req.url());});
  async function click(selector){
   const loc=page.locator(selector);assert.equal(await loc.count(),1,label+' '+selector);
   for(let n=0;n<8&&!await loc.isVisible();n++){
    const closed=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(),1,label+' closed detail');
    await closed.locator(':scope > summary').click();
   }
   ok(await loc.isVisible(),label+' visible '+selector);
   await loc.scrollIntoViewIfNeeded();await loc.click();
  }
  const field=async(name,value)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+name+'"]');
   assert.equal(await loc.count(),1,label+' '+name);await loc.fill(String(value));
  };
  const snapshot=async(phase,row)=>{
   const c=await capture(page,out,row.id+'-'+row.index,row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,
    actions:c.model?.actions,stored:c.storage});
   return c;
  };
  const shot=async phase=>{
   const name=label+'-'+phase+'.png';await page.screenshot({path:path.join(out,name),fullPage:false});screenshots.push(name);
  };
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  async function warm(tab){
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
   ok(status?.cache===release&&status.complete&&status.cached===status.total,'current complete SW offline cache');
  }
  await warm(page);await warm(restorePage);
  await origin.close();ok(!origin.server.listening,'HTTP origin stopped before genuine controls');
  for(const row of tasks){
   label=row.id+'-'+row.index;
   const response=await page.goto(origin.base+'learn.html#'+row.id,{waitUntil:'domcontentloaded'});
   ok(response?.fromServiceWorker()===true||await page.evaluate(()=>!!navigator.serviceWorker.controller),
     label+' native offline lesson');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   await page.evaluate(async({id,index})=>{
    const {unpackText,packText}=await import('./storage.js');
    const raw=localStorage.getItem('math-explorer-v2'),state=JSON.parse(unpackText(raw)),a=state.lessons[id];
    if(!a||a.cases?.[index]?.attempts?.length)throw Error('Only untouched original source may be selected');
    a.index=index;a.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
   },row);
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,label+' offline index selection');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const original=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const t=sessionTaskFor(id,index);
    return {mode:t.mode,type:t.type,start:t.start,step:t.step,nodeId:LESSONS[id].topicId};
   },row);
   ok(original.type==='x-wideshift'&&original.mode==='add'&&
      original.start===row.start&&original.step===row.delta*1000&&
      original.nodeId==='mt_9XVFje6Tyr',label+' unchanged exact native question');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' standard 1920x1080');
   ok(await page.locator('#thinking-feedback').count()===0,label+' no pre-Check strict feedback');
   await field('guess','0');
   await click('#extra-controls [data-x="wide-predict"]');
   if(row.index===3)await click('#extra-visual [data-x="wide-swap"][data-kind="down"][data-index="0"]');
   await click('#extra-visual [data-x="wide-move"][data-delta="'+row.delta+'"]');
   if(row.index===2)await click('#extra-visual [data-x="wide-swap"][data-kind="up"][data-index="1"]');
   for(const column of row.changed)
    await click('#extra-controls [data-x="wide-changed"][data-index="'+column+'"]');
   await field('answer','0');
   await click('#actions [data-do="check"]');
   const wrong=await snapshot('first-wrong',row);
   ok(wrong.attempts.length===1&&wrong.attempts[0].value.answer==='0',label+' actual wrong check preserved');
   ok(await page.locator('#thinking-feedback').count()===0,label+' no strict proof for incorrect answer');
   await field('answer',row.end);await click('#actions [data-do="check"]');
   const checked=await snapshot('corrected',row);
   ok(checked.attempts.length===2&&checked.attempts[0].value.answer==='0'&&
      checked.attempts[1].value.answer===row.end,label+' later correction keeps original Check');
   const proof=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {replayWideShiftAddEvidence}=await import('./learning/wideshift-evidence.js');
    return replayWideShiftAddEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:checked.model});
   ok(proof?.end===row.end&&proof.successfulMoves===1&&
      proof.exchanges===(row.index>=2?1:0),label+' independently replayed base-ten events');
   ok(await page.locator('#thinking-feedback').isVisible(),label+' source-bound feedback for matching Check');
   await shot('checked');
   const refreshed=await page.reload();
   ok(refreshed?.fromServiceWorker()===true,label+' offline reload of submitted work');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const after=await snapshot('offline-reload',row);
   ok(JSON.stringify(after.model)===JSON.stringify(checked.model)&&
      JSON.stringify(after.record)===JSON.stringify(checked.record),
      label+' original model and attempts retained on offline reload');
   ok(await page.locator('#thinking-feedback').isVisible(),label+' current proof survives reload');
  }
  label='retry';const last=tasks[3],before=await snapshot('before-retry',last);
  await click('[data-do="p3-retry"]');
  const reset=await snapshot('after-retry',last);
  ok(reset.attempts.length===before.attempts.length&&reset.model.actions.length===0,
    'Retry clears only current workpiece, preserves recorded checks');
  label='backup';await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').waitFor({state:'visible'});
  const exportedState=await page.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  const downloadEvent=page.waitForEvent('download');await click('#main [data-do="export"]');
  const download=await downloadEvent,bytes=fs.readFileSync(await download.path()),backup=JSON.parse(bytes.toString('utf8'));
  ok(backup.app==='math-explorer'&&backup.version===2,label+' original State-v2');
  ok(JSON.stringify(backup.state)===JSON.stringify(exportedState),label+' real backup full raw state');
  fs.writeFileSync(path.join(out,'native-v2.json'),bytes);
  async function importBackup(buffer,name){
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  ok((await importBackup(bytes,'thousandstep-original-v2.json')).includes('备份已合并'),'native backup imported');
  const restored=await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importBackup(bytes,'thousandstep-repeat-v2.json')).includes('备份已合并'),'repeat import accepted');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restored,'repeat import idempotent');
  ok(!(await importBackup(Buffer.from('{'),'thousandstep-corrupt-v2.json')).includes('备份已合并'),
    'invalid backup refused');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===restored,
    'invalid backup does not damage restored data');
  ok(errors.length===0,'zero browser errors or external calls');
  save();console.log('P9_THOUSANDSTEP_BROWSER_OK '+JSON.stringify({
   native:tasks.length,checks:checks.length,captures:captures.length,headSha:sha,viewport:STANDARD_DESKTOP_VIEWPORT}));
 }catch(error){
  errors.push(label+': '+String(error));await page?.screenshot({path:path.join(out,'failure.png')}).then(()=>screenshots.push('failure.png')).catch(()=>{});
  save();console.error(error.stack||String(error));process.exitCode=1;
 }finally{
  await restore?.close().catch(()=>{});await context?.close().catch(()=>{});
  await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
