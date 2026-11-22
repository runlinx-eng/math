// P9 pilot: actual UI submissions and verified thinking-method hints.
// Technical browser evidence only; not assessment of free text or teaching outcomes.
const fs=require('node:fs'),path=require('node:path');
const same=require('node:util').isDeepStrictEqual;
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {capture}=require('./helpers/p9-basic-artifact.cjs');
const out=path.resolve(__dirname,'../verification/p9-thinking-feedback');
const base='http://127.0.0.1:43827/';
const checks=[],errors=[],remote=[],snapshots=[];
const check=(condition,message)=>{if(!condition)throw Error(message);checks.push(message);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(String(e)));
 ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 // Formal source feedback may add nested native disclosures. Open the
 // outermost still-closed ancestor each time; never force hidden inputs or
 // synthesize events. A non-disclosure visibility regression remains a failure.
 const reveal=async(element)=>{
  for(let attempt=0;attempt<12;attempt++){
   if(await element.isVisible())return;
   const closed=element.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
   if(await closed.count()!==1)throw Error('original control hidden without one closed disclosure');
   await closed.locator(':scope > summary').click();
  }
  if(!(await element.isVisible()))throw Error('original control remains hidden after opening disclosures');
 };
 const field=async(key,value)=>{
  const element=page.locator('[data-xfield="'+key+'"]');
  if(await element.count()!==1)throw Error('non-unique original field '+key);
  await reveal(element);
  if(await element.evaluate(e=>e.tagName)==='SELECT')await element.selectOption(String(value));
  else await element.fill(String(value));
 };
 const action=async(name,data={})=>{
  const selector='[data-x="'+name+'"]'+Object.entries(data).map(([key,value])=>'[data-'+key+'="'+value+'"]').join('');
  const element=page.locator(selector).last();
  if(await element.count()!==1)throw Error('missing original action '+name);
  await reveal(element);
  await element.click();
 };
 const submit=()=>page.locator('#actions [data-do="check"]').click();
 const next=()=>page.locator('#actions [data-do="next"]').click();
 const view=()=>page.locator('#thinking-feedback').innerText();
 const solve=async()=>{
  const steps=await page.evaluate(async()=>{
   const {id,index}=mathLesson.snapshot();
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const task=sessionTaskFor(id,index);
   const b17=await import('./learning/phase5/b17-model.js');
   const b18=await import('./learning/phase5/b18-model.js');
   const b38=await import('./learning/phase5/b38-model.js');
   const handler=b17.TYPES.has(task.type)?b17:b18.TYPES.has(task.type)?b18:b38;
   return handler.solveSteps(task);
  });
  for(const step of steps){if(step.field)await field(step.field,step.value);else await action(step.action,step.data);}
 };
 const shot=async(name)=>page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 try{
  await page.goto(base+'learn.html#argument38');
  await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
  await page.reload();
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='argument38');
  check(await page.locator('#thinking-feedback').count()===0,'opening a task never fabricates thinking evidence');
  check((await page.evaluate(()=>mathLesson.snapshot())).index===0,'started at the real triangle reasoning task');
  await action('r38-card',{index:'wrong'});
  await submit();
  check(await page.locator('#thinking-feedback').count()===0,'a wrong submitted reasoning card does not earn method feedback');
  await action('r38-undo');
  await solve();
  await submit();
  let hint=await view();
  check(hint.includes('推理步骤')&&hint.includes('展示解题过程'),'ordered correct submitted steps get bounded MP.3 observation');
  check(hint.includes('mt_nyK25mNOeR')===false,'source ID is a metadata attribute rather than child-facing clutter');
  check(await page.locator('#thinking-feedback [data-thinking-node-id="mt_nyK25mNOeR"]').count()===1,'MP.3 source ID links to pinned math thinking source');
  check(hint.includes('不代表已掌握')&&!hint.includes('你已掌握')&&!hint.includes('你的解释正确'),'feedback explicitly limits mastery claims and does not grade explanation');
  await shot('01-reasoning-checked');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='argument38');
  check((await view()).includes('推理步骤'),'matching saved reasoning submission survives reload');
  await action('r38-undo');
  check(await page.locator('#thinking-feedback').count()===0,'changing saved work immediately removes stale reasoning feedback');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='argument38');
  check(await page.locator('#thinking-feedback').count()===0,'reload does not revive old feedback for modified work');
  await action('r38-card',{index:'answer'});await submit();
  check((await view()).includes('推理步骤'),'rechecking corrected reasoning restores current feedback');
  await next();
  await solve();await submit();await next();
  await solve();await submit();await next();
  check((await page.evaluate(()=>mathLesson.snapshot())).index===3,'reached the actual counterexample after completing prior tasks');
  await field('value','6');await field('second','2');await field('choice','less');await action('r38-test');
  await submit();
  check(await page.locator('#thinking-feedback').count()===0,'an incorrect comparison is not a verified counterexample');
  snapshots.push(await capture(page,out,'argument38-3',{id:'argument38',index:3},'wrong-prediction'));
  await field('second','1/2');await action('r38-test');await submit();
  check(await page.locator('#thinking-feedback').isVisible(),'correct last comparison keeps the wrong earlier prediction without rewriting it');
  const first=await capture(page,out,'argument38-3',{id:'argument38',index:3},'first-correct');snapshots.push(first);
  check(first.model.board.first.factor==='2'&&first.model.board.records[0].match===false&&first.model.board.bad===true,'failed first prediction stays in the original model');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.index===3);
  await field('value','6');await field('second','1/2');await field('choice','less');await action('r38-test');await submit();
  snapshots.push(await capture(page,out,'argument38-3',{id:'argument38',index:3},'repeat-comparison'));
  hint=await view();
  check(hint.includes('6 × 1/2')&&hint.includes('更小')&&hint.includes('反例'),'feedback describes the real tested contradiction');
  check(await page.locator('#thinking-feedback [data-thinking-node-id="mt_j5YqQnN6xe"]').count()===1,'counterexample is linked to actual MP.3 source');
  await field('prose','我想再检查其他乘数。');
  check(await page.locator('#thinking-feedback').count()===0,'unsubmitted prose edit cannot reuse the old checked snapshot');
  await submit();
  check((await view()).includes('反例'),'submitted checked work still shows bounded hint with ungraded prose');
  snapshots.push(await capture(page,out,'argument38-3',{id:'argument38',index:3},'prose-checked'));
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  const lesson=saved.lessons.argument38;
  const attempts=lesson.cases[3].attempts,model=lesson.models[3];
  const wrongComparison={value:'6',factor:'2',prediction:'less',actual:'greater',breaks:false,match:false};
  const correctComparison={value:'6',factor:'1/2',prediction:'less',actual:'less',breaks:true,match:true};
  // B38 appends every comparison. Reload and prose edits do not erase the
  // first failure or turn a repeated comparison into a replacement record.
  check(attempts.length===4,'all four original incorrect, corrected, repeated and prose submissions remain');
  check(same(model.board,{records:[wrongComparison,correctComparison,correctComparison],first:{value:'6',factor:'2',prediction:'less'},bad:true}),'all three actual comparisons retain the failed first prediction and exact mathematical results');
  check(same(model.history,[{a:'test',i:'',v:'6',w:'2',c:'less'},{a:'test',i:'',v:'6',w:'1/2',c:'less'},{a:'test',i:'',v:'6',w:'1/2',c:'less'}]),'raw failed, corrected and repeated requests remain in their original order');
  check(same(attempts.map(e=>e.value.history.length),[1,2,3,3])&&same(attempts.map(e=>e.value.board.records.length),[1,2,3,3]),'each saved attempt preserves the comparison history at its own submission time');
  check(snapshots.every(snapshot=>same(attempts.slice(0,snapshot.attempts.length),snapshot.attempts))&&same(attempts.map(e=>e.value),snapshots.map(snapshot=>snapshot.model)),'later correction, reload and prose submission do not rewrite any earlier complete attempt');
  check(same(Object.keys(lesson.cases[3]).sort(),['attempts','support'])&&attempts.every(e=>same(Object.keys(e).sort(),['at','exposed','id','supported','value']))&&same(attempts.map(e=>e.exposed),[false,true,true,true]),'attempts retain the original record schema and first-attempt exposure flags');
  const outcomes=await page.evaluate(async values=>{
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const {inspect}=await import('./learning/phase5/b38-model.js');
   return values.map(value=>inspect(sessionTaskFor('argument38',3),value).correct);
  },attempts.map(e=>e.value));
  check(same(outcomes,[false,true,true,true]),'the first saved attempt stays mathematically wrong after all three later successful submissions');
  check(lesson.models[3].prose==='我想再检查其他乘数。'&&!('thinkingScore'in lesson),'original free prose saved; no thinking score field added');
  await shot('02-counterexample-checked');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='argument38');
  check((await view()).includes('6 × 1/2'),'matching saved counterexample feedback survives reload');
  await submit();snapshots.push(await capture(page,out,'argument38-3',{id:'argument38',index:3},'final-rechecked'));
  check(snapshots.at(-1).attempts.length===5,'five complete counterexample check snapshots retained');
  await field('second','1');
  check(await page.locator('#thinking-feedback').count()===0,'modifying counterexample removes stale claim immediately');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='argument38');
  check(await page.locator('#thinking-feedback').count()===0,'modified counterexample does not recover a stale hint');

  // Second cross-course pilot: real native Check, correction and reload.
  // Existing general34:2/3 MP.8 already have strict replay; do not duplicate.
  const openFresh=async id=>{
    await page.goto(base+'learn.html#'+id);
    await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
    await page.reload();
    await page.waitForFunction(expected=>window.mathLesson?.snapshot()?.id===expected,id);
  };
  await openFresh('sense38');
  check(await page.locator('#thinking-feedback').count()===0,'MP.1 cannot award a method before the first Check');
  await action('r38-card',{index:'wrong'});await submit();
  check(await page.locator('#thinking-feedback').count()===0,'MP.1 wrong card cannot receive method feedback');
  await action('r38-undo');await solve();await submit();
  check((await view()).includes('知道原来3颗')&&(await view()).includes('想找现在一共几颗'),
    'MP.1 feedback describes selected known and asked cards');
  check(await page.locator('#thinking-feedback [data-thinking-node-id="mt_WkKkb7W9Qd"]').count()===1,
    'MP.1 uses the original thinking source ID');
  await shot('03-reading-checked');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='sense38');
  check((await view()).includes('已知'),'MP.1 saved current Check retains bounded feedback after reload');
  await action('r38-undo');
  check(await page.locator('#thinking-feedback').count()===0,'MP.1 editing invalidates older Check');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='sense38');
  check(await page.locator('#thinking-feedback').count()===0,'MP.1 reload cannot revive stale feedback');
  await action('r38-card',{index:'ask'});await submit();
  check((await view()).includes('已知'),'MP.1 rechecking restores current source feedback');
  await openFresh('tools39');
  await field('method','mental');await field('answer','100');await submit();
  check(await page.locator('#thinking-feedback').count()===0,
    'MP.5 correct mental answer does not claim a calculator was used');
  await field('method','calculator');await field('entry','25*4');await action('s39-run');await submit();
  check((await view()).includes('计算器')&&(await view()).includes('25*4'),
    'MP.5 actual calculator run receives bounded feedback');
  check(await page.locator('#thinking-feedback [data-thinking-node-id="mt_d-WZC2OyMB"]').count()===1,
    'MP.5 uses the original thinking source ID');
  await shot('04-calculator-checked');
  await field('entry','25*5');
  check(await page.locator('#thinking-feedback').count()===0,'MP.5 editing invalidates the previous run claim');
  await submit();
  check(await page.locator('#thinking-feedback').count()===0,'MP.5 wrong current expression cannot earn method feedback');
  await field('entry','25*4');await action('s39-run');await submit();
  check((await view()).includes('25*4'),'MP.5 corrected real execution and Check restore feedback');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='tools39');
  check((await view()).includes('25*4'),'MP.5 current saved calculator run survives reload');
  await next();
  check((await page.evaluate(()=>mathLesson.snapshot())).index===1,'MP.5 advanced to second native question');
  await field('method','calculator');await field('entry','167*3');await action('s39-run');
  await field('answer','501');await submit();
  check((await view()).includes('167*3'),'MP.5 second source task requires its own calculator action');
  const p9state=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  const toolLesson=p9state.lessons.tools39;
  check(toolLesson.cases[0].attempts.length===4&&toolLesson.cases[1].attempts.length===1&&
        !('thinkingScore' in toolLesson),'MP.5 old submitted attempts retained with no thinking score');
  check(errors.length===0&&remote.length===0,'no page errors or remote calls during local learning flow');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,snapshots,childTrial:false,independentMathReview:false},null,2));
  console.log('P9_THINKING_FEEDBACK_BROWSER_OK '+JSON.stringify({checks:checks.length,errors,remote}));
 }catch(error){
  await shot('failure').catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,snapshots,error:String(error)},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{await ctx.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
