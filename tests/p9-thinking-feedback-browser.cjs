// P9 pilot: actual UI submissions and verified thinking-method hints.
// Technical browser evidence only; not assessment of free text or teaching outcomes.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p9-thinking-feedback');
const base='http://127.0.0.1:43827/';
const checks=[],errors=[],remote=[];
const check=(condition,message)=>{if(!condition)throw Error(message);checks.push(message);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(String(e)));
 ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const field=async(key,value)=>{
  const element=page.locator('[data-xfield="'+key+'"]');
  const closed=element.locator('xpath=ancestor::details[not(@open)]').first();
  if(await closed.count())await closed.locator(':scope > summary').click();
  if(await element.evaluate(e=>e.tagName)==='SELECT')await element.selectOption(String(value));
  else await element.fill(String(value));
 };
 const action=async(name,data={})=>{
  const selector='[data-x="'+name+'"]'+Object.entries(data).map(([key,value])=>'[data-'+key+'="'+value+'"]').join('');
  const element=page.locator(selector).last();
  const closed=element.locator('xpath=ancestor::details[not(@open)]').first();
  if(await closed.count())await closed.locator(':scope > summary').click();
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
  await field('second','1/2');await action('r38-test');await submit();
  hint=await view();
  check(hint.includes('6 × 1/2')&&hint.includes('更小')&&hint.includes('反例'),'feedback describes the real tested contradiction');
  check(await page.locator('#thinking-feedback [data-thinking-node-id="mt_j5YqQnN6xe"]').count()===1,'counterexample is linked to actual MP.3 source');
  await field('prose','我想再检查其他乘数。');
  check(await page.locator('#thinking-feedback').count()===0,'unsubmitted prose edit cannot reuse the old checked snapshot');
  await submit();
  check((await view()).includes('反例'),'submitted checked work still shows bounded hint with ungraded prose');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  const lesson=saved.lessons.argument38;
  check(lesson.cases[3].attempts.length===3&&lesson.models[3].board.records.length===2,'original incorrect and correct attempts / both comparisons remain in original schema');
  check(lesson.models[3].prose==='我想再检查其他乘数。'&&!('thinkingScore'in lesson),'original free prose saved; no thinking score field added');
  await shot('02-counterexample-checked');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='argument38');
  check((await view()).includes('6 × 1/2'),'matching saved counterexample feedback survives reload');
  await field('second','1');
  check(await page.locator('#thinking-feedback').count()===0,'modifying counterexample removes stale claim immediately');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='argument38');
  check(await page.locator('#thinking-feedback').count()===0,'modified counterexample does not recover a stale hint');

  // Second round: actual B38 reading, B39 chosen calculator, B34 repeated rule.
  const openFresh=async(id)=>{
   await page.goto(base+'learn.html#'+id);
   await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
   await page.reload();
   await page.waitForFunction(expected=>window.mathLesson?.snapshot()?.id===expected,id);
  };
  const solveHere=async()=>{
   const steps=await page.evaluate(async()=>{
    const {id,index}=mathLesson.snapshot();
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {exampleModel}=await import('./learning/tasks.js');
    const task=sessionTaskFor(id,index);
    const b34=await import('./learning/phase5/b34-model.js');
    const b38=await import('./learning/phase5/b38-model.js');
    const b39=await import('./learning/phase5/b39-model.js');
    const handler=[b34,b38,b39].find(m=>m.TYPES.has(task.type));
    return handler?.solveSteps(task)||[];
   });
   for(const step of steps){
    if(step.field)await field(step.field,step.value);
    else await action(step.action,step.data);
   }
  };
  await openFresh('sense38');
  check(await page.locator('#thinking-feedback').count()===0,'MP.1 initial reading has no fabricated evidence');
  await action('r38-card',{index:'wrong'});await submit();
  check(await page.locator('#thinking-feedback').count()===0,'MP.1 wrong reading card has no method award');
  await action('r38-undo');await solveHere();await submit();
  check((await view()).includes('已知')&&(await view()).includes('想找'),'MP.1 checked known and unknown cards are described');
  check(await page.locator('#thinking-feedback [data-thinking-node-id="mt_WkKkb7W9Qd"]').count()===1,'MP.1 source maps to reading the problem');
  await shot('03-reading-checked');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='sense38');
  check((await view()).includes('想找'),'MP.1 current checked work persists across reload');
  await action('r38-undo');
  check(await page.locator('#thinking-feedback').count()===0,'MP.1 undo removes stale thinking feedback');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='sense38');
  check(await page.locator('#thinking-feedback').count()===0,'MP.1 stale result not restored');
  await action('r38-card',{index:'ask'});await submit();
  check((await view()).includes('已知'),'MP.1 recheck restores evidence');
  await openFresh('tools39');
  await field('method','mental');await field('answer','100');await submit();
  check(await page.locator('#thinking-feedback').count()===0,'MP.5 answer with mental choice does not imply calculator use');
  await field('method','calculator');await field('entry','25*4');await action('s39-run');
  await submit();
  check((await view()).includes('计算器')&&(await view()).includes('25*4'),'MP.5 actual chosen and run calculator produces bounded feedback');
  check(await page.locator('#thinking-feedback [data-thinking-node-id="mt_d-WZC2OyMB"]').count()===1,'MP.5 mapped source has real calculator action');
  await shot('04-calculator-checked');
  await field('entry','25*5');
  check(await page.locator('#thinking-feedback').count()===0,'MP.5 modified input invalidates checked result');
  await submit();
  check(await page.locator('#thinking-feedback').count()===0,'MP.5 incorrect recheck gives no method feedback');
  await field('entry','25*4');await action('s39-run');await submit();
  check((await view()).includes('25*4'),'MP.5 corrected execution and recheck restores feedback');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='tools39');
  check((await view()).includes('25*4'),'MP.5 saved calculator evidence survives reload');
  await openFresh('general34');
  // Complete the two real prerequisites through their own task controls.
  check((await page.evaluate(()=>mathLesson.snapshot())).index===0,'MP.8 prerequisite is three-group addition');
  for(const [first,second,subtotal]of [[0,1,12],[1,2,7]]){
   await action('triple-pick',{index:first});await action('triple-pick',{index:second});
   await page.locator('[data-x="triple-merge"]').click();
   await field('sub',String(subtotal));await field('total','13');
   await action('triple-save');
  }
  await submit();await next();
  check((await page.evaluate(()=>mathLesson.snapshot())).index===1,'MP.8 second prerequisite is place-value subtraction');
  const placeSteps=await page.evaluate(async()=>{
   const {id,index}=mathLesson.snapshot();
   const {sessionTaskFor}=await import('./learning/bridges.js');
   const b11=await import('./learning/phase5/b11-model.js');
   return b11.solveSteps(sessionTaskFor(id,index));
  });
  for(const step of placeSteps){if(step.field)await field(step.field,step.value);else await action(step.action,step.data);}
  await submit();await next();
  check((await page.evaluate(()=>mathLesson.snapshot())).index===2,'MP.8 reached original repeated add-five activity');
  check(await page.locator('#thinking-feedback').count()===0,'MP.8 no feedback before repeated actions');
  await field('value','5');await action('p34-next');await submit();
  check(await page.locator('#thinking-feedback').count()===0,'MP.8 first jump alone is insufficient');
  for(const n of [10,15,20]){await field('value',String(n));await action('p34-next');}
  await field('answers.0','zero-five');await submit();
  check((await view()).includes('连续 4 次')&&(await view()).includes('0和5交替'),'MP.8 successive increments and chosen observation are described');
  check(await page.locator('#thinking-feedback [data-thinking-node-id="mt_fZTn0W_iZR"]').count()===1,'MP.8 source link identifies bounded pattern activity');
  await shot('05-pattern-checked');
  await field('answers.0','two-seven');
  check(await page.locator('#thinking-feedback').count()===0,'MP.8 wrong modified pattern observation removes stale hint');
  await submit();check(await page.locator('#thinking-feedback').count()===0,'MP.8 invalid pattern observation never produces award');
  await field('answers.0','zero-five');await submit();
  check((await view()).includes('0和5交替'),'MP.8 corrected checked observation restores evidence');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='general34');
  check((await view()).includes('0和5交替'),'MP.8 current saved work survives reload');
  const p9state=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
  check(p9state.lessons.general34.cases[2].attempts.length===4&&!('thinkingScore' in p9state.lessons.general34),
    'MP.8 initial incomplete, correct, wrong and corrected recheck all retained without a mastery score');
  check(errors.length===0&&remote.length===0,'no page errors or remote calls during local learning flow');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,childTrial:false,independentMathReview:false},null,2));
  console.log('P9_THINKING_FEEDBACK_BROWSER_OK '+JSON.stringify({checks:checks.length,errors,remote}));
 }catch(error){
  await shot('failure').catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,error:String(error)},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{await ctx.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
