async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050}}),p=await ctx.newPage(),checks=[],errors=[],remote=[],base='http://127.0.0.1:43827/';const check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const field=async(k,v)=>{const e=p.locator(`[data-xfield="${k}"]`);if(!await e.count())return;if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){await e.focus();await e.press('Home');const min=+(await e.getAttribute('min')),step=+(await e.getAttribute('step'));for(let i=0;i<Math.round((v-min)/step);i++)await e.press('ArrowRight');}else await e.fill(String(v));};
 try{
  await p.goto(base+'learn.html#allowedrange');await p.waitForFunction(()=>window.mathLesson);const fixtures=await p.evaluate(async()=>{const{TASKS}=await import('./learning/phase5/b09.js'),{example}=await import('./learning/phase5/b09-model.js');return TASKS.allowedrange.map(t=>({t,m:example(t)}));});await p.locator('[data-do="start"]').click();
  for(const [i,{t,m}]of fixtures.entries()){
   for(const c of m.commands){await field('operation',c.op);await field('amount',c.value);await p.locator('[data-x="range-operation"]').click();}
   for(const k of ['boundary','other','side','closed','otherClosed'])await field(k,m[k]);await field('statement',t.upper?`${t.upper}>x>=${t.bound}`:`${t.bound}${({'>=':'<=','>':'<','<=':'>=','<':'>'})[t.relation]}x`);
   for(const n of t.upper?[t.bound,t.upper,'3/2','9/2']:[t.bound,t.bound-.5,t.bound+.5]){await field('probe',n);await p.locator('[data-x="range-test"]').click();}
   await p.locator('[data-do="check"]').click();check(await p.evaluate(i=>mathLesson.snapshot().summary.cases[i].complete,i),'case '+i+' accepts self-chosen interior/exterior and reversed notation');check(await p.locator('#storage-warning').isHidden(),'case '+i+' persists valid work');await p.locator('[data-do="next"]').click();
  }
  await p.reload();await p.waitForFunction(()=>window.mathLesson);check(await p.evaluate(()=>mathLesson.snapshot().summary.completed),'alternate valid work survives reload');check(errors.length===0,'no runtime errors');check(remote.length===0,'no remote requests');return{checks,errors,remote};
 }catch(e){return{checks,errors,remote,failed:String(e),body:(await p.locator('body').innerText()).slice(-1500)};}finally{await ctx.close();}
}
