// Browser acceptance for the P-03 guided learning pilot.
// Run with the existing browser-test harness against the local server.
async original=>{
 const browser=original.context().browser(),ctx=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage(),checks=[],errors=[];
 const check=(ok,description)=>{if(!ok)throw Error(description);checks.push(description);};
 const snap=()=>page.evaluate(()=>window.mathLesson.snapshot());
 const field=(key)=>page.locator('[data-xfield="'+key+'"]');
 const clickMany=async(name,n)=>{for(let i=0;i<n;i++)await page.locator('[data-x="'+name+'"][data-index="'+i+'"]').click();};
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:43827/learn.html#counttwenty');
  await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='counttwenty');
  check((await snap()).view==='task'&&(await snap()).index===0,'P-03 starts at actual task 1, not free play');
  check(!(await page.locator('#route-collapsible').evaluate(el=>el.open)),'other route nodes start collapsed');
  check(await page.locator('#instruction').innerText()==='数清整齐的一排','task 1 has a clear objective');
  check(!await field('total').isVisible()&&await page.locator('[data-do="check"]').isDisabled(),'answer and check wait for counting');
  await clickMany('count-tap',20);
  check(await field('total').isVisible(),'answer becomes available after 20 distinct beads');
  await field('total').fill('19');
  check(await page.locator('[data-do="check"]').isEnabled(),'check becomes actionable after an answer');
  await page.locator('[data-do="check"]').click();
  check(!(await snap()).summary.cases[0].complete,'incorrect count is not marked complete');
  await field('total').fill('20');
  await page.locator('[data-do="check"]').click();
  check((await snap()).summary.cases[0].complete,'correct work completes task 1');
  await page.locator('[data-do="next"]').click();
  check((await snap()).index===1&&await page.locator('#instruction').innerText()==='数清散开的珠子','next step displays task 2');
  await clickMany('count-tap',9);
  await field('total').fill('9');
  await page.locator('[data-do="check"]').click();
  check((await snap()).summary.cases[1].complete,'task 2 is checked independently');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='counttwenty');
  check((await snap()).index===1&&(await snap()).summary.cases[0].complete,'reloading preserves the second task and the first result');
  await page.locator('[data-do="next"]').click();
  check((await snap()).index===2&&await page.locator('#instruction').innerText()==='按要求取出珠子','task 3 becomes the only active task');
  check(!await field('numeral').isVisible(),'numeric answer is hidden before selecting 13 beads');
  await clickMany('face-take',13);
  check(await field('numeral').isVisible(),'numeric answer appears once 13 beads are selected');
  await field('numeral').fill('13');
  await page.locator('[data-do="check"]').click();
  check((await snap()).summary.completed,'three verified tasks complete the P-03 record');
  await page.locator('[data-do="next"]').click();
  check((await snap()).view==='summary'&&await page.locator('[data-do="back"]').count()===1,'finishing leads to a discovery summary and map return');
  check(errors.length===0,'no browser page errors');
  return {checks,errors,childTrial:false};
 }catch(e){return {checks,errors,failed:String(e),body:(await page.locator('body').innerText()).slice(-1300)};}
 finally{await ctx.close();}
}
