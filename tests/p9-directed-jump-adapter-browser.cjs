'use strict';
// #312 B09: eight real source-bound native controls, wrong->correct Check,
// SW-controlled stopped origin, Retry, State-v2 backup and bad-import isolation.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const source=require('./fixtures/p9-directed-jump-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-directed-jump-adapter');
const original=[
 ['linejumps',1,38,65,0,[20,7]],
 ['linejumps',2,52,28,0,[-20,-4]],
 ['linejumps',3,47,63,0,[10,6]],
 ['negativecontext',1,-4,3,-10,[4,3]],
 ['signedwalk',0,-3,2,-10,[5]],
 ['signedwalk',1,4,-3,-10,[-7]],
 ['signedwalk',2,4,-3,-10,[-7]],
 ['signedwalk',5,-4,-6,-10,[-2]]
];
const rows=original.map(([id,index,start,end,min,moves])=>{
 const frozen=source.cases.find(x=>x.id===id&&x.index===index);
 assert.ok(frozen&&JSON.stringify(frozen.moves)===JSON.stringify(moves));
 return {id,index,start,end,min,moves,nodeId:frozen.nodeId,taskHash:frozen.taskHash};
});
const checks=[],errors=[],captures=[],screenshots=[];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evt=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):null;
const provenance={repo:'runlinx-eng/math',issue:312,sha,testedCheckoutSha:sha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||0),
 workflowRunId:process.env.GITHUB_RUN_ID||null,workflowAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
 headSha:evt?.pull_request?.head?.sha||sha,originalControls:true,seededCorrectWork:false,
 seededLessonPositionOnly:true,childTrial:false,masteryInferred:false};
const ok=(value,msg)=>{assert.ok(value,msg);checks.push(msg);};
function write(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
 schema:'math-p9-directed-jump-browser/1',provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
 proofContracts:['math','correction','persistence','negative','backup'],
 checks,errors,captures,screenshots
},null,2)+'\n');}
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
  await page.goto(origin.base+'v2.html#trail');await restorePage.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  await restorePage.evaluate(async()=>Boolean(await navigator.serviceWorker.ready));
  await restorePage.reload();
  await restorePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await restorePage.locator('#main [data-do="export"]').first().waitFor();
  ok(await restorePage.evaluate(()=>!!navigator.serviceWorker.controller),'backup context SW-controlled');
  await warmAndStop(page,origin,release,ok,label);
  const click=async selector=>{
   const loc=page.locator(selector);
   assert.equal(await loc.count(),1,label+' original native '+selector);
   for(let n=0;n<8&&!(await loc.isVisible());n++){
    const closed=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await closed.count(),1,label+' collapsed ancestor');
    await closed.locator(':scope > summary').click();
   }
   ok(await loc.isVisible(),label+' native control visible '+selector);
   await loc.scrollIntoViewIfNeeded();await loc.click();
  };
  const field=async(key,value,select=false)=>{
   const loc=page.locator('#extra-controls [data-xfield="'+key+'"]');
   assert.equal(await loc.count(),1,label+' original field '+key);
   if(select)await loc.selectOption(String(value));else await loc.fill(String(value));
   ok(await loc.inputValue()===String(value),label+' native field '+key);
  };
  const snap=async(row,phase)=>{
   label=row.id+'-'+row.index+'-'+phase;
   const c=await capture(page,out,row.id+'-'+row.index,row,phase);
   captures.push({id:row.id,index:row.index,phase,attempts:c.attempts.length,
    history:c.model?.history,jumps:c.model?.jumps,storage:c.storage});
   return c;
  };
  const selectOriginal=async row=>{
   label=row.id+'-'+row.index+'-select';
   await page.goto(origin.base+'learn.html#'+row.id);
   let reply=await page.reload();
   ok(reply?.fromServiceWorker()===true,row.id+' original lesson offline');
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   const old=await page.evaluate(async({id,index})=>{
    const {unpackText,packText}=await import('./storage.js');
    const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('Original lesson has submitted work');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases[index]?.attempts?.length||0;
   },row);
   ok(old===0,row.id+' only original position selected (no answer seeded)');
   reply=await page.reload();
   ok(reply?.fromServiceWorker()===true,row.id+' original task offline reload');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const native=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {LESSONS}=await import('./learning/catalog.js');
    const t=sessionTaskFor(id,index);
    return {type:t.type,nodeId:LESSONS[id].topicId,start:t.start,
      end:t.start+(t.op==='+'?t.operand:-t.operand),min:t.min,reverse:!!t.reverse};
   },row);
   ok(native.type==='x-directedjump'&&!native.reverse&&native.nodeId===row.nodeId&&
     native.start===row.start&&native.end===row.end&&native.min===row.min,
     row.id+' authentic source task and signed target');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
     row.id+' required Chromium desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,row.id+' no premature feedback');
  };
  for(const row of rows){
   await selectOriginal(row);
   label=row.id+'-'+row.index+'-actions';
   const anchor=page.locator('#extra-controls [data-xfield="anchor"]');
   assert.equal(await anchor.count(),1);
   await anchor.focus();await anchor.press('Home');
   for(let v=row.min;v<row.start;v++)await anchor.press('ArrowRight');
   ok(await anchor.inputValue()===String(row.start),row.id+' native keyboard anchor');
   await field('guess',row.end);
   await click('#extra-controls [data-x="direct-predict"]');
   for(const delta of row.moves){
    await field('size',Math.abs(delta));
    await field('dir',delta<0?'left':'right',true);
    await click('#extra-controls [data-x="direct-jump"]');
   }
   if(row.id==='signedwalk'&&row.index===0)await field('zero','reference',true);
   const drawn=await snap(row,'native-jumps');
   ok(drawn.model.jumps.length===row.moves.length&&
      row.moves.every((v,i)=>drawn.model.jumps[i]===v&&drawn.model.history[i]===v),
      row.id+' real success history equals directed path');
   await field('answer',row.end+1);
   await click('#actions [data-do="check"]');
   const wrong=await snap(row,'wrong-check');
   ok(wrong.attempts.length===1&&wrong.attempts[0].value.answer===String(row.end+1),
      row.id+' wrong original Check retained');
   ok(await page.locator('#thinking-feedback').count()===0,row.id+' wrong latest answer no strict feedback');
   await field('answer',row.end);
   await click('#actions [data-do="check"]');
   const good=await snap(row,'correct-check');
   ok(good.attempts.length===2&&good.attempts[1].value.answer===String(row.end),
      row.id+' corrected Check and both attempts retained');
   const proof=await page.evaluate(async({id,index,model})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {replayDirectedJumpEvidence}=await import('./learning/directed-jump-evidence.js');
    return replayDirectedJumpEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
   },{...row,model:good.model});
   ok(proof?.start===row.start&&proof.end===row.end&&
      proof.observableSuccessfulJumps.length===row.moves.length&&
      proof.observableSuccessfulJumps.every((e,i)=>e.change===row.moves[i]&&e.to-e.from===e.change),
      row.id+' independent exact mathematics replay');
   ok(await page.locator('#thinking-feedback').isVisible(),row.id+' bounded source feedback visible');
   const msg=await page.locator('#thinking-feedback').innerText();
   ok(msg.includes('撤销')&&msg.includes('长期掌握'),row.id+' chronology/mastery limitations remain explicit');
   label=row.id+'-'+row.index+'-accepted';
   const png=label+'.png';await page.screenshot({path:path.join(out,png),fullPage:false});
   screenshots.push(png);
   const reply=await page.reload();
   ok(reply?.fromServiceWorker()===true,row.id+' stopped-origin reload after Check');
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   const persisted=await snap(row,'offline-reload');
   assert.deepEqual(persisted.model,good.model);assert.deepEqual(persisted.record,good.record);
   ok(await page.locator('#thinking-feedback').isVisible(),row.id+' feedback persists offline');
  }
  const last=rows.at(-1),before=await snap(last,'before-retry');
  await click('[data-do="p3-retry"]');
  const reset=await snap(last,'after-retry');
  ok(reset.model.history.length===0&&reset.attempts.length===before.attempts.length,
     'native Retry starts new model without destroying Check history');
  ok(await page.locator('#thinking-feedback').count()===0,'Retry hides stale feedback');
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  const save=page.waitForEvent('download');
  await click('#main [data-do="export"]');
  const dl=await save,bytes=fs.readFileSync(await dl.path()),pack=JSON.parse(bytes.toString('utf8'));
  ok(pack.app==='math-explorer'&&pack.version===2,'native State-v2 exported');
  fs.writeFileSync(path.join(out,'native-state-v2.json'),bytes);
  const importFile=async(buffer,name)=>{
   const chooser=restorePage.waitForEvent('filechooser');
   await restorePage.locator('#main [data-do="import"]').first().click();
   await(await chooser).setFiles({name,mimeType:'application/json',buffer});
   await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
   return restorePage.locator('#toast').innerText();
  };
  ok((await importFile(bytes,'directed-jump.json')).includes('备份已合并'),'native blank-context State-v2 import');
  const stored=await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  ok((await importFile(bytes,'directed-jump-repeat.json')).includes('备份已合并'),'repeat import accepted');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===stored,'repeat import idempotent');
  ok(!(await importFile(Buffer.from('{'),'bad.json')).includes('备份已合并'),'bad backup rejected');
  ok(await restorePage.evaluate(()=>localStorage.getItem('math-explorer-v2'))===stored,'bad backup cannot alter saved lessons');
  ok(errors.length===0,'no page errors or external HTTP calls');
  write();console.log('P9_DIRECTED_JUMP_BROWSER_OK '+JSON.stringify({
    sha,checks:checks.length,rows:rows.length,captures:captures.length,viewport:STANDARD_DESKTOP_VIEWPORT}));
 }catch(e){errors.push(label+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  write();console.error(e.stack||String(e));process.exitCode=1;
 }finally{await restore?.close().catch(()=>{});await ctx?.close().catch(()=>{});
  await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
