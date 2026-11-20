'use strict';
// #256 source-bound 1920x1080 Chromium evidence, registered for targeted CI.
// No pre-seeded attempts, grades, mathematical operations or proofs.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-timecompare-adapter');
const sources=[{id:'timecompare',index:0},{id:'timecompare',index:1},{id:'timecompare',index:2},{id:'durationorder',index:1},{id:'durationwork',index:1},{id:'minuteclock',index:2}];
const checks=[],captures=[],screenshots=[],errors=[];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const ok=(condition,message)=>{assert.ok(condition,message);checks.push(message);};
const key=x=>x.id+'-'+x.index;
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),
 JSON.stringify({schema:'math-p9-timecompare-browser/1',
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
  const act=(name,index)=>click('#extra-controls button[data-x="t32-'+name+'"]'+
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
  await origin.close();ok(!origin.server.listening,'HTTP origin stopped before all real vessel controls');
  for(const row of sources){
   label=key(row);
   const response=await page.goto(origin.base+'learn.html#'+row.id,{waitUntil:'domcontentloaded'});
   if(response)ok(response.fromServiceWorker()===true,label+' offline original document');
   else ok(await page.evaluate(()=>!!navigator.serviceWorker.controller),label+' offline hash navigation');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   await page.evaluate(({id,index})=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2')),lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Only untouched native position may be selected');
    lesson.index=index;lesson.view='task';localStorage.setItem('math-explorer-v2',JSON.stringify(state));
   },row);
   const reloaded=await page.reload();
   ok(reloaded?.fromServiceWorker()===true,label+' truly offline original reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const t=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const task=sessionTaskFor(id,index);
    return {type:task.type,nodeId:LESSONS[id]?.topicId,kind:task.kind,events:task.events,
     answers:(task.questions||[]).map(q=>String(q.value))};
   },row);
   ok(t.type==='x-t32-compare'&&!!t.nodeId,label+' exact native time source');
   ok(t.events?.length===2&&t.events.every(e=>Number.isInteger(e.start)&&
    Number.isInteger(e.end)&&e.start<=e.end),label+' real task intervals');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' standard viewport');
   const numbers=t.events.map(e=>t.kind==='longer'?e.end-e.start:t.kind==='earlier'?e.start:e.end);
   const expected=numbers[0]===numbers[1]?'equal':t.kind==='longer'?
    (numbers[0]>numbers[1]?'left':'right'):(numbers[0]<numbers[1]?'left':'right');
   const alternative=expected==='left'?'right':'left',wrongFirst=row.id==='timecompare'&&row.index===2;
   const feedback=page.locator('#thinking-feedback');
   ok(await feedback.count()===0,label+' not yet submitted');
   await shot('initial');
   await click('#actions [data-do="check"]');
   const wrong=await snapshot('wrong-submitted',row);
   ok(wrong.attempts.length===1,label+' actual unsuccessful Check retained');
   ok(await feedback.count()===0,label+' no false proof on wrong Check');
   await act('guess',wrongFirst?alternative:expected);
   await act('reveal');
   if(wrongFirst){
    await act('choice',alternative);
    ok(await feedback.count()===0,label+' wrong revealed choice has no proof');
   }
   await act('choice',expected);
   for(let i=0;i<t.answers.length;i++)await field('answers.'+i,t.answers[i]);
   ok(await feedback.count()===0,label+' complete but unchecked draft cannot earn proof');
   await click('#actions [data-do="check"]');
   ok(await feedback.isVisible(),label+' real Check yields strict native proof');
   const success=await snapshot('correct-submitted',row);
   ok(success.attempts.length===2,label+' both real checks retained');
   ok(JSON.stringify(success.attempts.at(-1).value)===JSON.stringify(success.model),
    label+' latest Check matches entire current model');
   const events=success.model.history;
   ok(events[0].a==='guess'&&events[1].a==='reveal'&&events.at(-1).a==='choice'&&
    events.at(-1).i===expected,label+' real chronological guess reveal and choice');
   ok(success.model.board.choice===expected&&success.model.board.bad===wrongFirst,
    label+' original grade and historical error remain intact');
   if(wrongFirst)ok(success.model.board.first.guess===alternative&&
    success.model.board.first.choice===alternative&&
    events.filter(e=>e.a==='choice').length===2,label+' original wrong guess and first wrong choice retained');
   if(t.kind==='longer')ok(t.events.every((e,i)=>numbers[i]===e.end-e.start),
    label+' independently derived elapsed time equals end minus start');
   if(row.id==='minuteclock')ok(JSON.stringify(numbers)==='[80,75]',
    label+' compares original 80 seconds versus 75 seconds');
   await shot('checked');
   const refresh=await page.reload();
   ok(refresh?.fromServiceWorker()===true,label+' actual offline reload after Check');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   ok(await feedback.isVisible(),label+' strict feedback survives offline reload');
   const saved=await snapshot('reloaded',row);
   ok(JSON.stringify(saved.model)===JSON.stringify(success.model)&&
    JSON.stringify(saved.record)===JSON.stringify(success.record),
    label+' actual historical attempts intact after refresh');
   if(t.answers.length)await field('answers.0','999');
   else await act('choice',alternative);
   ok(await feedback.count()===0,label+' new edit invalidates old checked proof');
   if(t.answers.length)await field('answers.0',t.answers[0]);
   else await act('choice',expected);
   await click('#actions [data-do="check"]');
   ok(await feedback.isVisible(),label+' new Check verifies corrected current record');
   const checked=await snapshot('rechecked',row);
   ok(checked.attempts.length===3,label+' new Check appends without erasing prior checks');
   await shot('rechecked');
  }
  // Shared Retry on the final source: does not erase prior graded attempts.
  const last=sources.at(-1);label='shared-retry-'+key(last);
  const before=await snapshot('before-retry',last);
  await click('[data-do="p3-retry"]');
  await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,last.index);
  const reset=await snapshot('after-retry',last);
  ok(reset.attempts.length===before.attempts.length,'Retry retains graded attempts');
  ok(reset.model.history.length===0,'Retry clears current time comparison');
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
  ok((await importFile(bytes,'timecompare-native-v2.json')).includes('备份已合并'),
   'native chooser imports into empty offline restore');
  const first=await raw();
  ok(JSON.stringify(await decoded(restorePage))===JSON.stringify(backup.state),
   'restored original errors and corrections intact');
  ok((await importFile(bytes,'timecompare-repeat-v2.json')).includes('备份已合并'),
   'native repeat import accepted');
  ok(await raw()===first,'byte-idempotent repeat restore');
  ok(!(await importFile(Buffer.from('{'),'timecompare-corrupt-v2.json')).includes('备份已合并'),
   'corrupt V2 rejected');
  ok(await raw()===first,'rejected package does not damage original bytes');
  const restored=await restorePage.goto(origin.base+'learn.html#timecompare');
  ok(restored?.fromServiceWorker()===true,'restored original lesson accessible offline');
  await restorePage.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='timecompare');
  ok(await restorePage.locator('#thinking-feedback').isVisible(),
   'previous successful time comparison proof restored offline');
  await restorePage.screenshot({path:path.join(out,'native-v2-restored.png'),fullPage:false});
  screenshots.push('native-v2-restored.png');
  ok(errors.length===0,'no page exception or external request');
  save();console.log('P9_TIMECOMPARE_BROWSER_OK '+JSON.stringify({native:sources.length,
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
