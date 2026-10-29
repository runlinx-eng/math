async original=>{
 const browser=original.context().browser(),base='http://127.0.0.1:43827/',checks=[],errors=[],remote=[];const contexts=[];
 const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 const make=async()=>{const ctx=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});contexts.push(ctx);const p=await ctx.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(String(e)));ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});return p;};
 const state=async p=>p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));
 try{
  for(const method of ['mental','written','calculator']){
   const p=await make();await p.goto(base+'learn.html#strategy39');await p.waitForFunction(()=>window.mathLesson);await p.locator('[data-do="start"]').click();await p.locator('[data-xfield="method"]').selectOption(method);
   check((await p.locator('[data-xfield="entry"]').count())===(method==='calculator'?1:0),method+' shows only the chosen method controls');
   await p.locator('[data-xfield="answer"]').fill('545');
   if(method==='calculator'){
    await p.locator('[data-do="check"]').click();check(!(await p.evaluate(()=>mathLesson.snapshot())).summary.cases[0].complete,'calculator choice without running an expression does not complete');
    await p.locator('[data-xfield="entry"]').fill('345+100');await p.locator('[data-x="s39-run"]').click();await p.locator('[data-xfield="entry"]').fill('200+345');await p.locator('[data-x="s39-run"]').click();
   }
   await p.locator('[data-do="check"]').click();const a=(await state(p)).lessons.strategy39;check((await p.evaluate(()=>mathLesson.snapshot())).summary.cases[0].complete,method+' is accepted as a valid choice');
   if(method==='calculator')check(a.cases[0].support&&a.models[0].board.runs.length===2&&a.models[0].board.runs[0].value===445,'calculator support and first mistaken input are retained');
   else check(!a.cases[0].support,'selecting '+method+' does not pretend calculator help was used');
   await p.reload();await p.waitForFunction(()=>window.mathLesson);check((await p.evaluate(()=>mathLesson.snapshot())).summary.cases[0].complete,method+' survives reload');
  }
  const p=await make();await p.goto(base+'learn.html#graph39');await p.waitForFunction(()=>window.mathLesson);await p.locator('[data-do="start"]').click();const set=async(v)=>{await p.locator('[data-xfield="cursor"]').fill(String(v));await p.locator('[data-xfield="cursor"]').dispatchEvent('input');await p.locator('[data-x="s39-mark"]').click();};await set(1.5);await p.locator('[data-xfield="answer"]').fill('-1.75');await p.locator('[data-do="check"]').click();await p.locator('[data-do="next"]').click();await set(-1.4);await p.locator('[data-do="check"]').click();check(!(await p.evaluate(()=>mathLesson.snapshot())).summary.cases[1].complete,'one intersection is not enough when the graph has two');await set(1.4);await p.locator('[data-do="check"]').click();check((await p.evaluate(()=>mathLesson.snapshot())).summary.cases[1].complete,'both approximate intersections are accepted');const a=(await state(p)).lessons.graph39;check(a.models[1].board.marks.length===2&&a.models[1].board.first==='-1.4','the two marks and first position are saved');
  const q=await make();await q.goto(base+'v2.html#about');await q.locator('.about-copy').waitFor();const about=await q.locator('.about-copy').innerText();check(about.includes('587 个源节点')&&about.includes('231 条短路线')&&about.includes('776 条原有关联'),'source information shows current nodes, routes and connections');check(about.includes('不代表所有源目标都已完整评估')&&!about.includes('其余节点尚未制作'),'source information states the bounded coverage');
  check(!errors.length,'no runtime errors');check(!remote.length,'no remote requests');return{checks,errors,remote,childTrial:false};
 }catch(e){return{checks,errors,remote,failed:String(e)};}finally{for(const ctx of contexts)await ctx.close();}
}
