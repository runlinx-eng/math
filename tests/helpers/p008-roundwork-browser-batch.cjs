'use strict';
// Exact native B08 controls and original Check / State-v2 for P008 roundwork.
// Only the lesson position is selected in original storage for nonzero indices.
// No model, attempt, correct result, or lesson completion is preloaded.
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {createOrigin,warmAndStop,capture}=require('./p9-basic-artifact.cjs');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'../..');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const ordered=x=>Array.isArray(x)?x.map(ordered):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(x[k])])):x;
const digest=t=>createHash('sha256').update(JSON.stringify(ordered(t))).digest('hex');
async function control(page,selector){
 let el=page.locator(selector);
 if(!(await el.count()))el=page.locator(selector.replace('#extra-controls ','.extra-controls '));
 if(!(await el.count()))el=page.locator(selector.replace('#extra-controls ','#extra-visual '));
 assert.equal(await el.count(),1,'one original control: '+selector);
 for(let i=0;i<12&&!(await el.isVisible());i++){
  const closed=el.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
  assert.equal(await closed.count(),1,'one closed original details: '+selector);
  await closed.locator(':scope > summary').click();
 }
 assert.ok(await el.isVisible(),'visible original control: '+selector);
 return el;
}
async function moveRange(el,target){
 const min=Number(await el.getAttribute('min')),max=Number(await el.getAttribute('max'));
 const step=Number(await el.getAttribute('step'))||1;
 assert.ok(Number.isInteger(target)&&target>=min&&target<=max,'original slider limits');
 let pos=Number(await el.inputValue());
 if(pos===target){
  await el.press(pos===max?'ArrowLeft':'ArrowRight');
  pos=Number(await el.inputValue());
 }
 // PageUp/PageDown on real range input is browser-native; avoid synthesized events.
 for(let i=0;i<20&&Math.abs(pos-target)>15*step;i++){
  const key=pos<target?'PageUp':'PageDown';
  await el.press(key);
  const next=Number(await el.inputValue());
  if(next===pos||Math.abs(next-target)>=Math.abs(pos-target)){
   if(next!==pos){await el.press(pos<target?'PageDown':'PageUp');pos=Number(await el.inputValue());}
   break;
  }
  pos=next;
 }
 let count=0;
 while(pos!==target&&count++<1100){
  await el.press(pos<target?'ArrowRight':'ArrowLeft');
  const next=Number(await el.inputValue());
  assert.ok(next!==pos&&Math.abs(next-target)<Math.abs(pos-target),'original slider moved one step');
  pos=next;
 }
 assert.equal(pos,target,'original slider lands on desired tick');
}
async function field(page,key,value){
 const el=await control(page,'#extra-controls [data-xfield="'+key+'"]');
 if(await el.getAttribute('type')==='range')return moveRange(el,Number(value));
 if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(value));
 else{await el.fill(String(value));await el.press('Tab');}
}
async function action(page,name,index){
 const selector='#extra-visual [data-x="'+name+'"][data-index="'+index+'"]';
 await (await control(page,selector)).click();
}
async function seedPositionOnly(page,sessionId,index){
 return page.evaluate(async({sessionId,index})=>{
  const {packText,unpackText}=await import('./storage.js');
  const raw=localStorage.getItem('math-explorer-v2');
  if(!raw)throw Error('original State-v2 missing');
  const state=JSON.parse(unpackText(raw)),lesson=state.lessons?.[sessionId];
  if(!lesson||!Array.isArray(lesson.models)||!Array.isArray(lesson.cases)||
     !lesson.models[index]||lesson.cases[index]?.attempts?.length)
   throw Error('prior model or Check missing / position already checked: '+sessionId+':'+index);
  lesson.index=index;
  lesson.view='task';
  localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
  return {sessionId,index,noSeededAttempts:true};
 },{sessionId,index});
}
async function runShard(shard,positionIds){
 const output=path.join(root,'verification/p9-p008-'+shard+'-roundwork');
 fs.mkdirSync(output,{recursive:true});
 const logs=[],errors=[],screenshots=[],positionResults=[];
 let stage='startup',browserVersion=null;
 const ok=(value,label)=>{assert.ok(value,stage+': '+label);logs.push(stage+': '+label);};
 const entry=p=>import(pathToFileURL(path.join(root,p)).href);
 const evidence=await entry('dist/learning/p008-native-roundwork-evidence.js');
 const {sessionTaskFor}=await entry('dist/learning/bridges.js');
 const model=await entry('dist/learning/phase5/b08-model.js');
 const sources=new Map(evidence.P008_ROUNDWORK_SOURCES.map(s=>[s.sessionId+':'+s.index,s]));
 const save=()=>{
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({
   schema:'math-p008-b08-batch-chromium/1',testedCheckoutSha:head,shard,
   originalControls:true,seededLessonPositionOnly:true,originalAttemptsSeeded:0,
   strictAApproved:false,viewport:STANDARD_DESKTOP_VIEWPORT,browser:browserVersion,
   requestedPositions:positionIds,positionResults,checks:logs,errors,screenshots
  },null,2)+'\n');
 };
 let origin,browser,bctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true});browserVersion=browser.version();
  bctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await bctx.newPage();page.setDefaultTimeout(25000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  bctx.on('request',req=>{if(/^https?:/.test(req.url())&&!req.url().startsWith(origin.base))
   errors.push(stage+': external request '+req.url());});
  const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8'),cache=sw.match(/const CACHE = '([^']+)'/)?.[1];
  ok(!!cache,'current official SW release');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,cache,ok,'P008-'+shard);
  for(const position of positionIds){
   const [sessionId,idx]=position.split(':'),index=Number(idx);
   const source=sources.get(position),task=sessionTaskFor(sessionId,index);
   const context={sessionId,index};
   stage='source-'+position;
   ok(source&&task&&digest(task)===source.taskHash,position+' full original task hash');
   ok(evidence.p008RoundworkBinding(task,context)?.nodeId===source.nodeId,position+' exact source node');
   const wanted=model.example(task);
   const original=model.initial(task);
   ok(model.inspect(task,wanted).correct,position+' original native correct example');
   ok(JSON.stringify(wanted)!==JSON.stringify(original),position+' expected original controls');
   const nav=await page.goto(origin.base+'learn.html#'+sessionId);
   ok(nav?.fromServiceWorker()===true,position+' original lesson offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,sessionId);
   const start=page.locator('[data-do="start"]');if(await start.isVisible())await start.click();
   const selected=await seedPositionOnly(page,sessionId,index);
   ok(selected.noSeededAttempts,position+' no fabricated original attempts');
   ok((await page.reload())?.fromServiceWorker()===true,position+' original session position reload');
   await page.waitForFunction(ctx=>window.mathLesson?.snapshot()?.id===ctx.sessionId&&
      window.mathLesson?.snapshot()?.index===ctx.index,context);
   if(task.units)await field(page,'unit',task.unit);
   for(let i=0;i<task.values.length;i++){
    if(i>0)await action(page,'wide-active',i);
    for(const k of ['low','high'])await field(page,'steps.'+i+'.'+k,wanted.steps[i][k]);
    await field(page,'steps.'+i+'.mark',wanted.steps[i].mark);
    await field(page,'steps.'+i+'.result',i===0?'-1':wanted.steps[i].result);
   }
   if(task.sf)for(const i of wanted.sig)await action(page,'wide-sig',i);
   if(task.calc)await field(page,'estimate',wanted.estimate);
   if(task.exact){await field(page,'exact',wanted.exact);await field(page,'relation',wanted.relation);}
   stage='wrong-check-'+position;
   await (await control(page,'#actions [data-do="check"]')).click();
   const label=sessionId+'-'+index;
   const captureState=async phase=>capture(page,output,label,{id:sessionId,index},phase);
   const wrong=await captureState('wrong-check');
   ok(wrong.attempts.length===1&&!model.inspect(task,wrong.model).correct,
    position+' first original Check wrong');
   ok(evidence.replayP008RoundworkEvidence(task,wrong.model,context)===null,
    position+' independently reject wrong value');
   stage='corrected-check-'+position;
   await action(page,'wide-active',0);
   await field(page,'steps.0.result',wanted.steps[0].result);
   const draft=await captureState('corrected-draft');
   ok(model.inspect(task,draft.model).correct,position+' corrected original math');
   ok(evidence.submittedP008RoundworkEvidence(task,draft.model,draft.record,context)===null,
    position+' stale Check never authorizes corrected draft');
   await (await control(page,'#actions [data-do="check"]')).click();
   const good=await captureState('correct-check');
   const proof=evidence.submittedP008RoundworkEvidence(task,good.model,good.record,context);
   ok(good.attempts.length===2&&!!proof,position+' original wrong and corrected Check');
   ok(proof.strictAApproved===false&&!proof.actionSequenceObserved,
    position+' only final states reported; no fabricated slider chronology');
   stage='offline-reload-'+position;
   ok((await page.reload())?.fromServiceWorker()===true,position+' genuinely offline reload');
   await page.waitForFunction(ctx=>window.mathLesson?.snapshot()?.id===ctx.sessionId&&
      window.mathLesson?.snapshot()?.index===ctx.index,context);
   const saved=await captureState('offline-reload');
   assert.deepEqual(saved.model,good.model,position+' model persists unmodified');
   assert.deepEqual(saved.record,good.record,position+' Check history persists');
   ok(Boolean(evidence.submittedP008RoundworkEvidence(task,saved.model,saved.record,context)),
    position+' valid independent proof after reload');
   await page.screenshot({path:path.join(output,label+'-correct.png'),fullPage:false});
   screenshots.push(label+'-correct.png');
   positionResults.push({position,taskHash:source.taskHash,
    originalWrongCorrectChecks:2,sourceVerified:true,storedAttempts:2,
    independentMath:true,offlineReload:true,strictAApproved:false});
   save();
  }
  stage='original-state-v2-export';
  await page.goto(origin.base+'v2.html#trail');
  const exportButton=page.locator('#main [data-do="export"]').first();
  await exportButton.waitFor();
  const download=page.waitForEvent('download');
  await exportButton.click();
  const raw=fs.readFileSync(await (await download).path());
  const parsed=JSON.parse(raw.toString('utf8'));
  ok(parsed.app==='math-explorer'&&parsed.version===2,'original State-v2 export and schema');
  fs.writeFileSync(path.join(output,'native-state-v2.json'),raw);
  ok(errors.length===0,'no browser page errors or external HTTP');
  ok(positionResults.length===positionIds.length,'all requested distinct positions verified');
  console.log('P008_B08_BATCH_BROWSER_OK '+JSON.stringify({
   testedCheckoutSha:head,shard,positions:positionResults.length,
   originalWrongCorrectChecks:positionResults.length*2,
   strictAApproved:false
  }));
 }catch(e){
  errors.push(stage+': '+String(e));
  await page?.screenshot({path:path.join(output,'failure.png'),fullPage:false}).catch(()=>{});
  console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  save();await bctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await origin?.close().catch(()=>{});
 }
}
module.exports={runShard};
