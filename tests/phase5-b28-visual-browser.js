async original=>{
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B28/';
 const ctx=await original.context().browser().newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'}),p=await ctx.newPage(),checks=[],errors=[],remote=[];
 const check=(v,s)=>{if(!v)throw Error(s);checks.push(s);},snap=()=>p.evaluate(()=>mathLesson.snapshot()),state=()=>p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));
 p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 try{
  await p.goto(base+'learn.html#metricconversions');await p.waitForFunction(()=>window.mathLesson);await p.locator('[data-do="start"]').click();
  const value=p.locator('[data-xfield="values.0"]');await value.fill('350');await p.locator('[data-x="m28-convert"]').click();
  let widths=await p.locator('#extra-visual svg rect[height="20"]').evaluateAll(es=>es.map(e=>+e.getAttribute('width')));check(widths[0]===320&&widths[1]===32,'wrong conversion displays actual shorter bar');
  check((await state()).lessons.metricconversions.cases[0].support,'wrong first conversion records support');await p.screenshot({path:root+'conversion-wrong.png',fullPage:true});
  await value.fill('3500');await p.locator('[data-x="m28-convert"]').click();widths=await p.locator('#extra-visual svg rect[height="20"]').evaluateAll(es=>es.map(e=>+e.getAttribute('width')));
  check(widths[0]===320&&widths[1]===320,'correct conversion makes the bars equal');check(await p.locator('.m28-success').count()===1,'equal bars have visible feedback');
  await value.fill('3510');check(await p.locator('.m28-success').count()===0,'editing removes stale success feedback');await p.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[0].complete,'pending edit cannot reuse the previous conversion');
  await value.fill('3500');await p.locator('[data-x="m28-convert"]').click();await p.locator('[data-do="check"]').click();check((await snap()).summary.cases[0].complete&&!(await snap()).summary.cases[0].independent,'corrected conversion completes with support retained');
  await p.goto(base+'learn.html#measureplot');await p.waitForFunction(()=>window.mathLesson?.snapshot().id==='measureplot');await p.locator('[data-do="start"]').click();
  const measured=p.locator('[data-xfield="measure"]');await measured.fill('3');await p.locator('[data-x="m28-record"]').click();check((await state()).lessons.measureplot.models[0].board.records[0]==='3','first simulated object is measured and recorded');
  await measured.fill('9');check((await state()).lessons.measureplot.models[0].board.records[0]===null,'editing invalidates the earlier recorded length');
  await measured.fill('3');await p.locator('[data-x="m28-record"]').click();await p.locator('#extra-visual [data-x="m28-mark"][data-index="1"]').click();
  check((await state()).lessons.measureplot.models[0].board.marks[1]===1,'direct click places a point at the chosen value');await p.screenshot({path:root+'measured-plot.png',fullPage:true});
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'desktop layout fits');
  check(!errors.length,'no runtime errors');check(!remote.length,'no remote requests');return{checks,errors,remote};
 }catch(e){await p.screenshot({path:root+'visual-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,failed:String(e),body:(await p.locator('body').innerText()).slice(-2000)};}finally{await ctx.close();}
}
