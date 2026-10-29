async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'}),p=await ctx.newPage(),checks=[],errors=[],remote=[],base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B29/';
 const check=(v,s)=>{if(!v)throw Error(s);checks.push(s);};p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});p.setDefaultTimeout(10000);
 const state=()=>p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));
 try{
  await p.goto(base+'learn.html#lengthstory');await p.waitForFunction(()=>window.mathLesson);await p.locator('[data-do="start"]').click();
  const board=p.locator('.m29-world'),box=await board.boundingBox();check(box.width>=700,'the construction board has readable desktop width');
  const slider=p.locator('[data-xfield="cut"]');await slider.focus();await slider.press('Home');for(let i=0;i<10;i++)await slider.press('ArrowRight');
  check(await slider.inputValue()==='10','slider can be moved with keyboard');const x1=await p.locator('.m29-world svg line[stroke="#ad6046"]').getAttribute('x1');
  await slider.fill('20');await slider.dispatchEvent('input');const x2=await p.locator('.m29-world svg line[stroke="#ad6046"]').getAttribute('x1');check(Number(x2)>Number(x1),'moving the slider visibly moves the boundary at the same scale');
  await p.locator('[data-x="m29-cut"]').click();let m=(await state()).lessons.lengthstory.models[0];check(m.board.first.cut==='20'&&m.board.bad,'wrong cut is recorded');
  await slider.fill('18');await slider.dispatchEvent('input');await p.locator('[data-x="m29-cut"]').click();await p.locator('[data-xfield="equation"]').fill('18+?=45');await p.locator('[data-xfield="answer"]').fill('27');await p.locator('[data-xfield="unit"]').selectOption('cm');await p.locator('[data-do="check"]').click();check((await p.evaluate(()=>mathLesson.snapshot())).summary.cases[0].complete,'corrected construction completes');
  check(!(await p.evaluate(()=>mathLesson.snapshot())).summary.cases[0].independent,'correcting does not erase first error');
  await p.screenshot({path:root+'visual-tape.png',fullPage:true});
  await slider.fill('19');await slider.dispatchEvent('input');await p.locator('[data-do="check"]').click();check(!(await p.evaluate(()=>mathLesson.snapshot())).summary.cases[0].independent,'subsequent editing cannot become independent evidence');
  m=(await state()).lessons.lengthstory.models[0];const inspection=await p.evaluate(async m=>{const e=await import('./learning/phase4/engine.js'),t=(await import('./learning/tasks.js')).TASKS.lengthstory[0];return e.inspectExtra(t,m);},m);check(!inspection.correct,'a moved, uncommitted boundary cannot pass on a stale cut');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'desktop page has no horizontal overflow');
  await p.goto(base+'learn.html#practicalmeasure');await p.waitForFunction(()=>window.mathLesson?.snapshot().id==='practicalmeasure');await p.locator('[data-do="start"]').click();
  await p.locator('[data-xfield="values.0"]').fill('2500');await p.locator('[data-x="m28-convert"]').click();await p.locator('[data-do="check"]').click();await p.locator('[data-do="next"]').click();
  await p.locator('[data-xfield="amount"]').fill('625');for(let i=0;i<4;i++)await p.locator(`[data-x="m29-give"][data-index="${i}"]`).click();
  await p.locator('[data-xfield="answer"]').fill('0.625');await p.locator('[data-xfield="unit"]').selectOption('kg');await p.locator('[data-do="check"]').click();await p.locator('[data-do="next"]').click();
  check(!(await p.locator('#extra-controls').innerText()).includes('11:05'),'clock input example does not reveal the answer');await p.screenshot({path:root+'visual-clock-entry.png',fullPage:true});
  check(!errors.length,'no runtime errors');check(!remote.length,'no remote requests');return{checks,errors,remote};
 }catch(e){await p.screenshot({path:root+'visual-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,failed:String(e),body:(await p.locator('body').innerText()).slice(-2200)};}finally{await ctx.close();}
}
