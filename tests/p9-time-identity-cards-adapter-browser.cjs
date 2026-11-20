'use strict';
// #331: original B32 time identities. Browser source, real clicks, correction,
// stopped-origin offline persistence, retry, State-v2 export and import.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-time-identity-cards-adapter');
const rows=[
 {id:'ampmclock',index:2,node:'mt_4m8BimI4G5',labels:['中午后 12:20','午夜后 00:20'],values:['night'],kinds:['choice'],answers:['night'],bad:'noon',minutes:[740,20]},
 {id:'romanclock',index:2,node:'mt_5J2quSTspi',labels:['下午3:20','上午7:05','中午后12:20','午夜后12:20'],values:['920','425','740','20'],kinds:['time24','time24','time24','time24'],answers:['15:20','07:05','12:20','00:20'],bad:'15:21',minutes:[920,425,740,20]},
 {id:'clockconvert',index:2,node:'mt_WfrE_4r-kY',labels:['午夜后 12:20','中午后 12:20'],values:['20','740'],kinds:['time24','time24'],answers:['00:20','12:20'],bad:'00:21',minutes:[20,740]}
];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evt=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={issue:331,repo:'runlinx-eng/math',headSha:evt.pull_request?.head?.sha||sha,
 testedCheckoutSha:sha,runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 originalNativeControls:true,seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const checks=[],errors=[],captures=[],screenshots=[],ok=(v,m)=>{assert.ok(v,m);checks.push(m)};
let label='startup';
const save=()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
 schema:'math-p9-time-identity-cards-browser/1',provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
 proofContracts:['math','correction','persistence','negative','backup'],checks,errors,captures,screenshots
},null,2)+'\n')};
async function run(){
 // Every snapshot writes original State-v2 bytes before the final summary receipt.
 fs.mkdirSync(out,{recursive:true});
 let origin,browser,ctx,restore,page,restorePage;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  restore=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();restorePage=await restore.newPage();
  for(const p of [page,restorePage]){p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(label+': '+String(e)))}
  for(const c of [ctx,restore])c.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))errors.push('external '+r.url())});
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  await restorePage.goto(origin.base+'v2.html#trail');
  await restorePage.locator('#main [data-do="import"]').first().waitFor();
  await restorePage.evaluate(async()=>Boolean(await navigator.serviceWorker.ready));
  await restorePage.reload();await restorePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await warmAndStop(page,origin,release,ok,label);
  async function click(selector){
   const el=page.locator(selector);assert.equal(await el.count(),1,label+' unique '+selector);
   for(let n=0;n<8&&!(await el.isVisible());n++){
    const d=el.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await d.count(),1,label+' collapsed disclosure');await d.locator(':scope > summary').click();
   }
   ok(await el.isVisible(),label+' visible '+selector);await el.scrollIntoViewIfNeeded();await el.click();
  }
  const snapshot=async(row,phase)=>{
   label=row.id+'-'+phase;
   const c=await capture(page,out,row.id+'-'+row.index,row,phase);
   captures.push({id:row.id,index:row.index,phase,history:c.model?.history,attempts:c.attempts.length,storage:c.storage});
   return c;
  };
  for(const row of rows){
   label=row.id+'-open';
   await page.goto(origin.base+'learn.html#'+row.id);
   const first=await page.reload();ok(first?.fromServiceWorker()===true,label+' native offline source');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   const empty=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2'))),l=state.lessons[id];
    if(!l||l.cases?.[index]?.attempts?.length)throw Error('Original source has a prior Check');
    l.index=index;l.view='task';localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return l.cases[index]?.attempts?.length||0;
   },row);ok(empty===0,'only source position seeded, no correct work');
   const loaded=await page.reload();ok(loaded?.fromServiceWorker()===true,'position offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const task=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const t=sessionTaskFor(id,index);
    return {type:t.type,node:LESSONS[id].topicId,labels:t.parts.map(x=>x.label),
      values:t.questions.map(q=>String(q.value)),kinds:t.questions.map(q=>q.kind)};
   },row);
   ok(task.type==='x-t32-units'&&task.node===row.node&&
      JSON.stringify(task.labels)===JSON.stringify(row.labels)&&
      JSON.stringify(task.values)===JSON.stringify(row.values)&&
      JSON.stringify(task.kinds)===JSON.stringify(row.kinds),'exact original native source');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'original desktop 1920x1080');
   ok(await page.locator('#thinking-feedback').count()===0,'no feedback before Check');
   const card=i=>'#extra-visual button[data-x="t32-unit"][data-index="'+i+'"]';
   for(let i=0;i<row.labels.length;i++)await click(card(i));
   await click(card(0));await click(card(0));
   const chosen=await snapshot(row,'selected');
   ok(chosen.model.history.length===row.labels.length+2&&
      JSON.stringify(chosen.model.board.selected)===JSON.stringify(row.labels.map((_,i)=>i)),
      'native ordered toggle cancellation and final selection retained');
   const answer=async(i,value)=>{
    const el=page.locator('#extra-controls [data-xfield="answers.'+i+'"]');
    assert.equal(await el.count(),1,'original field');
    if(row.kinds[i]==='choice')await el.selectOption(String(value));else await el.fill(String(value));
   };
   for(let i=0;i<row.answers.length;i++)await answer(i,i===0?row.bad:row.answers[i]);
   await click('#actions [data-do="check"]');
   const wrong=await snapshot(row,'wrong-check');
   ok(wrong.attempts.length===1&&wrong.attempts[0].value.answers[0]===row.bad,'original wrong Check persisted');
   ok(await page.locator('#thinking-feedback').count()===0,'wrong Check does not create strict proof');
   await answer(0,row.answers[0]);await click('#actions [data-do="check"]');
   const good=await snapshot(row,'correct-check');
   ok(good.attempts.length===2&&good.attempts[0].value.answers[0]===row.bad&&
      good.attempts[1].value.answers[0]===row.answers[0]&&
      JSON.stringify(good.attempts[1].value)===JSON.stringify(good.model),'original correction, latest work saved');
   const proof=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {replayTimeIdentityCardsEvidence}=await import('./learning/time-identity-cards-evidence.js');
    return replayTimeIdentityCardsEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:good.model});
   ok(proof?.cards?.length===row.labels.length&&
      JSON.stringify(proof.cards.map(x=>x.minuteOfDay))===JSON.stringify(row.minutes)&&
      proof.observedEvents.length===row.labels.length+2&&
      proof.observedEvents.at(-2).kind==='unselect'&&
      proof.observedEvents.at(-1).kind==='select'&&
      proof.learnerConversionDerivationAssessed===false&&proof.learnerMasteryAssessed===false,
      'original chronology, independent minutes and honest inference boundary');
   ok(await page.locator('#thinking-feedback').isVisible(),'bounded source feedback visible');
   const msg=await page.locator('#thinking-feedback').innerText();
   ok(msg.includes('独立推导')&&msg.includes('长期掌握'),'no invented reasoning or mastery');
   const png=row.id+'-2-correct.png';await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
   const offline=await page.reload();ok(offline?.fromServiceWorker()===true,'correct Check stays offline');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const kept=await snapshot(row,'offline-reload');
   assert.deepEqual(kept.model,good.model);assert.deepEqual(kept.record,good.record);
   ok(await page.locator('#thinking-feedback').isVisible(),'feedback persists after offline reload');
  }
  const last=rows.at(-1),before=await snapshot(last,'before-retry');
  await click('[data-do="p3-retry"]');
  const after=await snapshot(last,'after-retry');
  ok(after.model.history.length===0&&after.attempts.length===before.attempts.length,'Retry clears active model but keeps checks');
  ok(await page.locator('#thinking-feedback').count()===0,'Retry clears stale feedback');
  await page.goto(origin.base+'v2.html#trail');await page.locator('#main [data-do="export"]').first().waitFor();
  const wait=page.waitForEvent('download');await click('#main [data-do="export"]');
  const dl=await wait,bytes=fs.readFileSync(await dl.path()),pack=JSON.parse(bytes.toString('utf8'));
  ok(pack.app==='math-explorer'&&pack.version===2,'original State-v2 backup');
  fs.writeFileSync(path.join(out,'original-state-v2.json'),bytes);
  async function importFile(buffer,name){
   const pending=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await pending).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  }
  ok((await importFile(bytes,'identity.json')).includes('备份已合并'),'blank offline State-v2 import');
  const saved=await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importFile(bytes,'identity-again.json')).includes('备份已合并'),'repeat import accepted');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===saved,'import idempotent');
  ok(!(await importFile(Buffer.from('{'),'bad-identity.json')).includes('备份已合并'),'corrupt import rejected');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===saved,'bad import leaves records unchanged');
  ok(errors.length===0,'no browser errors or external requests');
  save();console.log('P9_TIME_IDENTITY_CARDS_BROWSER_OK '+JSON.stringify({sha,rows:rows.length,checks:checks.length}));
 }catch(e){errors.push(label+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});save();console.error(e.stack||String(e));process.exitCode=1}
 finally{await restore?.close().catch(()=>{});await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{})}
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
