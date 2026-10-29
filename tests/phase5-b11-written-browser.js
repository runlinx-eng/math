async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1366,height:1000},reducedMotion:'reduce'}),p=await ctx.newPage(),checks=[],errors=[],root='/Users/zj1-6/dev/math/verification/phase5/B11/';
 const check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};p.on('pageerror',e=>errors.push(String(e)));
 try{
  for(const [id,last]of[['columnlarge',1],['decimalsum',2]]){
   await p.goto('http://127.0.0.1:43827/learn.html#'+id);await p.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);await p.locator('[data-do="start"]').click();
   const plans=await p.evaluate(async({id,last})=>{const{TASKS}=await import('./learning/phase5/b11.js'),{solveSteps}=await import('./learning/phase5/b11-model.js');return TASKS[id].slice(0,last+1).map(t=>solveSteps(t));},{id,last});
   for(const [i,plan]of plans.entries()){
    for(const s of plan){if(s.field){const el=p.locator(`[data-xfield="${s.field}"]`);if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(s.value);else await el.fill(s.value);}else await p.locator(`[data-x="${s.action}"]`+Object.entries(s.data||{}).map(([k,v])=>`[data-${k}="${v}"]`).join('')).click();}
    await p.locator('[data-do="check"]').click();check(await p.evaluate(i=>mathLesson.snapshot().summary.cases[i].complete,i),id+':'+i+' real controls complete');if(i<last)await p.locator('[data-do="next"]').click();
   }
   const field=p.locator('[data-xfield="columnAnswers.0"]'),value=await field.inputValue();await field.fill('');await field.pressSequentially(value);check(await field.evaluate(e=>e===document.activeElement),id+' digit input keeps focus');
   const alignment=await p.evaluate(()=>{const centers=s=>[...document.querySelectorAll(s)].map(e=>{const b=e.getBoundingClientRect();return b.x+b.width/2});const a=centers('.b11-columns>.b11-column'),b=centers('.b11-written-cell');return a.map((x,i)=>Math.abs(x-b[i]));});check(alignment.every(n=>n<2),id+' written digits align with actual unit columns');check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' no page overflow');
   await p.screenshot({path:root+id+'-written-final.png',fullPage:true});
  }
  check(errors.length===0,'no runtime errors');return{checks,errors};
 }catch(e){return{checks,errors,failed:String(e)};}finally{await ctx.close();}
}
