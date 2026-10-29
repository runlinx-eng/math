async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1000},timezoneId:'Asia/Shanghai'}),p=await ctx.newPage(),base='http://127.0.0.1:43827/',checks=[],errors=[];
 const check=(v,t)=>{if(!v)throw new Error(t);checks.push(t);};p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
 try{
  await p.clock.install({time:new Date('2026-10-24T12:00:00Z')});await p.clock.resume();await p.goto(base+'?v=34#space');await p.waitForFunction(()=>window.mathSpace);
  await p.locator('#continue-card [data-action="continue"]').click();let f=p.frameLocator('#journey-frame');await f.locator('[data-do="question"]').click();await p.locator('#question-text').fill('为什么要分得一样大？');await p.locator('.question-dialog [type="submit"]').click();
  await p.locator('[data-action="close-journey"]').click();await p.locator('[data-action="overview"]').click();await p.locator('#continue-card [data-action="continue"]').click();f=p.frameLocator('#journey-frame');await f.locator('#question-context').waitFor();check(true,'question resumes in its activity');
  // A saved open work surface and pending question must not override a direct link elsewhere.
  await p.waitForTimeout(350);await p.goto(base+'?v=34#space/pack/volume');await p.waitForFunction(()=>window.mathSpace);check(await p.locator('#journey-surface').isHidden(),'explicit route link does not reopen the saved activity');check(await p.locator('#focus-card').innerText().then(t=>t.includes('积木里面藏着多少')),'explicit other route is honored despite the pending question');
  await p.locator('[data-action="choose-route"][data-id="B"]').click();await p.locator('.route-links summary').click();check(await p.locator('.route-links').getAttribute('open')!==null,'connection choices can be expanded');await p.clock.fastForward(61000);check(await p.locator('.route-links').getAttribute('open')!==null,'same-day clock check does not collapse what the child is reading');
  await p.locator('[data-action="overview"]').click();await p.locator('#continue-card [data-action="question-later"]').click();check(!(await p.locator('#continue-card').innerText()).includes('为什么要分得一样大'),'deferred question stays out of today entry');
  await p.clock.setFixedTime(new Date('2026-10-25T12:00:00Z'));await p.clock.fastForward(61000);check((await p.locator('#continue-card').innerText()).includes('为什么要分得一样大'),'open page updates the question entry when the local day changes');check(errors.length===0,'no JavaScript errors');return {checks,errors};
 }catch(e){return {failed:String(e),checks,errors,body:(await p.locator('body').innerText()).slice(-1000)};}finally{await ctx.close();}
}
