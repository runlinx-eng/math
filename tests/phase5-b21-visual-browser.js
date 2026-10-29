async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1366,height:900},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B21/';page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const snap=()=>page.evaluate(()=>mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,s)=>{if(!v)throw Error(s);checks.push(s);},click=(a,data={})=>page.locator(`[data-x="${a}"]`+Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join('')).click();
 const field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);for(const d of await e.locator('xpath=ancestor::details[not(@open)]').all())await d.locator(':scope > summary').click();if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){const min=Number(await e.getAttribute('min')),step=Number(await e.getAttribute('step')||1);await e.focus();await e.press('Home');for(let n=0;n<Math.round((Number(v)-min)/step);n++)await e.press('ArrowRight');}else await e.fill(String(v));};
 let current='';const model=async()=>{const s=await snap(),a=await state();return(a.lessons[s.id]||a.daily.bridges[s.id]).models[s.index];};
 try{
  await page.goto(base+'learn.html#statwords');await page.waitForFunction(()=>window.mathLesson);
  const fixture=await page.evaluate(async()=>{const c=await import('./learning/phase5/b21.js'),v=await import('./learning/phase5/b21-model.js'),v20=await import('./learning/phase5/b20-model.js');return Object.fromEntries(Object.entries(c.TASKS).map(([id,ts])=>[id,ts.map(t=>({t,steps:(v.TYPES.has(t.type)?v:v20).solveSteps(t)}))]));});
  for(const[id,tasks]of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
   for(let i=0;i<tasks.length;i++){
    current=id+':'+i;const{t,m,steps}=tasks[i];check((await snap()).index===i,current+' opens');if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,current+' untouched cannot complete');}
    if(i===0)await page.screenshot({path:root+'visual-'+id+'-start.png',fullPage:true});
    if(steps)for(const s of steps){if(s.field)await field(s.field,s.value);else await click(s.action,s.data);}
    else if(t.type==='x-questionsort'){for(let j=0;j<m.choices.length;j++)await field('choices.'+j,m.choices[j]);await field('reason',m.reason);}else if(t.type==='x-chartlab'){await field('scale',m.scale);for(let j=0;j<m.heights.length;j++)await field('heights.'+j,m.heights[j]);await field('answer',m.answer);}else throw Error('No UI solver '+t.type);
    await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,current+' actual controls complete');check(await page.locator('#storage-warning').isHidden(),current+' valid saved model');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),current+' no horizontal overflow');
    await page.screenshot({path:root+'visual-'+current.replace(':','-')+'-done.png',fullPage:true});
    await page.locator('[data-do="next"]').click();
   }
   await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check((await snap()).summary.cases.slice(0,tasks.length).every(c=>c.complete),id+' tested task progress survives reload');
  }
  check(!errors.length,'no runtime errors');check(!remote.length,'no remote requests');return{checks,errors,remote,taskViews:43,viewport:{width:1366,height:900},childTrial:false};
 }catch(e){await page.screenshot({path:root+'browser-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,current,failed:String(e),body:(await page.locator('body').innerText()).slice(-2400),model:await model().catch(()=>null),snapshot:await snap().catch(()=>null)};}finally{await ctx.close();}
}
