const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/thinking-feedback-v56-20261101'),base='http://127.0.0.1:43827/';
const checks=[],errors=[],remote=[],check=(v,s)=>{if(!v)throw Error(s);checks.push(s);};
const state=p=>p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),p=await ctx.newPage();
  p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(String(e)));ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
  const field=async(k,v)=>{const el=p.locator(`[data-xfield="${k}"]`),d=el.locator('xpath=ancestor::details[not(@open)]').first();if(await d.count())await d.locator(':scope > summary').click();if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(v));else await el.fill(String(v));};
  const click=async(a,data={})=>{const el=p.locator(`[data-x="${a}"]`+Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join('')).last(),d=el.locator('xpath=ancestor::details[not(@open)]').first();if(await d.count())await d.locator(':scope > summary').click();await el.click();};
  const solve=async()=>{const steps=await p.evaluate(async()=>{const {id,index}=mathLesson.snapshot(),{TASKS}=await import('./learning/tasks.js'),t=TASKS[id][index],a=await import('./learning/phase5/b17-model.js'),b=await import('./learning/phase5/b18-model.js'),c=await import('./learning/phase5/b38-model.js');return (a.TYPES.has(t.type)?a:b.TYPES.has(t.type)?b:c).solveSteps(t);});for(const s of steps){if(s.field)await field(s.field,s.value);else await click(s.action,s.data);}};
  try{
    await p.goto(base+'?v=56#space');await p.waitForFunction(()=>window.mathSpace&&navigator.serviceWorker.controller&&document.querySelector('#offline-status').textContent.includes('离线就绪'));
    check(await p.evaluate(async()=>!!await(await caches.open('math-explorer-20261027-learning-v56')).match('./learning/thinking-feedback.js')),'feedback module is in the offline cache');
    await p.goto(base+'learn.html#recutnames');await p.waitForFunction(()=>window.mathLesson);await p.locator('[data-do="start"]').click();
    check(await p.locator('#thinking-feedback').count()===0,'opening an activity does not claim a thinking method');
    await p.locator('[data-do="check"]').click();check(await p.locator('#thinking-feedback').count()===0,'an incomplete submission does not get a success observation');
    await solve();await p.locator('[data-do="check"]').click();let text=await p.locator('#thinking-feedback').innerText();
    check(text.includes('1/3')&&text.includes('2/6')&&text.includes('整体和选中的量都没变'),'fraction feedback describes the exact construction and selected reason');
    check(text.includes('修改后又试了一次')&&text.includes('比较分数'),'feedback reflects an earlier submission and connects the method to another use');
    let s=await state(p);check(s.lessons.recutnames.cases[0].attempts.length===2&&s.lessons.recutnames.models[0].board.saved.length===1,'both attempts and actual fraction construction remain in the original learning record');
    await p.screenshot({path:path.join(out,'01-fraction-feedback.png'),fullPage:true});
    await p.reload();await p.waitForFunction(()=>window.mathLesson);check((await p.locator('#thinking-feedback').innerText()).includes('1/3'),'matching submitted feedback survives refresh');
    await field('reason','top');check(await p.locator('#thinking-feedback').count()===0,'editing the work immediately removes stale feedback');await p.reload();await p.waitForFunction(()=>window.mathLesson);check(await p.locator('#thinking-feedback').count()===0,'refresh does not restore feedback for a displaced submission');
    await field('reason','recut');await p.locator('[data-do="check"]').click();check((await p.locator('#thinking-feedback').innerText()).includes('2/6'),'the revised construction can be submitted again');
    await p.goto(base+'learn.html#argument38');await p.waitForFunction(()=>window.mathLesson);await p.locator('[data-do="start"]').click();
    for(let i=0;i<3;i++){await solve();await p.locator('[data-do="check"]').click();await p.locator('[data-do="next"]').click();}
    check((await p.evaluate(()=>mathLesson.snapshot())).index===3,'counterexample follows actual preceding reasoning tasks');
    const pair=async(v,f,c)=>{await field('value',v);await field('second',f);await field('choice',c);await click('r38-test');};
    await pair('6','2','less');await pair('6','1/2','less');await field('prose','我想知道为什么乘一半会变小。');
    check(await p.locator('#thinking-feedback').count()===0,'seeing a comparison is not yet a submitted thinking observation');await p.locator('[data-do="check"]').click();text=await p.locator('#thinking-feedback').innerText();
    check(text.includes('6 × 1/2')&&text.includes('更小')&&text.includes('反例'),'feedback uses the actual counterexample to explain how it tests the claim');
    check(text.includes('试了 2 次比较')&&text.includes('提示或比较反馈'),'actual comparisons and visible support are reflected');
    check(!text.includes('掌握')&&!text.includes('能力评分')&&!text.includes('你的解释正确'),'feedback does not grade free explanation or infer mastery');
    s=await state(p);check(s.lessons.argument38.models[3].prose==='我想知道为什么乘一半会变小。'&&s.lessons.argument38.models[3].board.records.length===2,'the original words and both actual comparisons remain saved');
    await p.screenshot({path:path.join(out,'02-counterexample-feedback.png'),fullPage:true});
    await p.reload();await p.waitForFunction(()=>window.mathLesson);check((await p.locator('#thinking-feedback').innerText()).includes('6 × 1/2'),'counterexample feedback is restored from the saved submission');
    await field('second','1');check(await p.locator('#thinking-feedback').count()===0,'a changed counterexample cannot show old feedback');await field('choice','equal');await click('r38-test');await p.locator('[data-do="check"]').click();check((await p.locator('#thinking-feedback').innerText()).includes('与原来的数一样大'),'a different actual counterexample is described accurately');
    await p.locator('[data-do="next"]').click();await pair('6','1','equal');await p.locator('[data-do="check"]').click();check(await p.locator('#thinking-feedback').count()===0,'equality does not refute the changed nonstrict claim');await pair('6','1/2','less');await p.locator('[data-do="check"]').click();check((await p.locator('#thinking-feedback').innerText()).includes('总不会变小'),'a counterexample to the changed claim is reported separately');
    await ctx.setOffline(true);await p.goto(base+'learn.html#recutnames');await p.waitForFunction(()=>window.mathLesson);check((await p.locator('#thinking-feedback').innerText()).includes('2/6'),'saved fraction feedback and local activity reopen offline');
    check(!errors.length&&!remote.length,'no page errors or remote requests');
    fs.writeFileSync(path.join(out,'feedback-results.json'),JSON.stringify({checks,errors,remote,childTrial:false},null,2));console.log(JSON.stringify({checks:checks.length,errors,remote}));
  }catch(error){await p.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,'feedback-results.json'),JSON.stringify({checks,errors,remote,failed:String(error)},null,2));console.error(error.stack);process.exitCode=1;}
  finally{await ctx.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
