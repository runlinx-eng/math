async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B13/';page.setDefaultTimeout(9000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const snap=()=>page.evaluate(()=>mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,s)=>{if(!v)throw Error(s);checks.push(s);},click=(a,data={})=>page.locator(`[data-x="${a}"]`+Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join('')).click();
 const field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){const min=Number(await e.getAttribute('min')),step=Number(await e.getAttribute('step')||1);await e.focus();await e.press('Home');for(let n=0;n<Math.round((Number(v)-min)/step);n++)await e.press('ArrowRight');}else await e.fill(String(v));};
 let current='';const model=async()=>{const s=await snap(),a=await state();return(a.lessons[s.id]||a.daily.bridges[s.id]).models[s.index];};
 try{
  await page.goto(base+'learn.html#equalgroups');await page.waitForFunction(()=>window.mathLesson);
  const fixture=await page.evaluate(async()=>{const c=await import('./learning/catalog.js'),t=await import('./learning/tasks.js'),b=await import('./learning/bridges.js'),v=await import('./learning/phase5/b13-model.js');return Object.fromEntries([...Object.keys(c.LESSONS).filter(id=>c.LESSONS[id].batch==='B13'),...Object.keys(b.BRIDGES).filter(id=>b.BRIDGES[id].batch==='B13')].map(id=>[id,b.sessionTasks(id).map(task=>({t:task,m:t.exampleModel(task),steps:v.TYPES.has(task.type)?v.solveSteps(task):null}))]));});
  for(const[id,tasks]of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
   for(let i=0;i<tasks.length;i++){
    current=id+':'+i;const{t,m,steps}=tasks[i];check((await snap()).index===i,current+' opens');if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,current+' untouched cannot complete');}
    let solved=false;
    if(current==='sharegroups:0'){
     await field('amount',4);await click('b13-pour',{bucket:0});await field('amount',6);await click('b13-pour',{bucket:1});await field('answer',5);await field('equation','10÷2=5');await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,'right answer with unequal shares cannot complete');
     const before=await model();await page.locator('[data-b13-token="4"]').dragTo(page.locator('[data-b13-bucket="0"]'));const after=await model();check(after.board.homes[4]===0&&after.board.homes.length===10,'real drag moves the same token without changing the whole');check(before.board.homes.filter(x=>x===0).length===4&&after.board.homes.filter(x=>x===0).length===5,'drag corrects unequal shares');solved=true;
    }
    if(current==='screenshare:0'){
     await page.locator('[data-b13-token="0"]').dragTo(page.locator('[data-b13-bucket="0"]'));check((await model()).board.homes[0]===0,'real drag starts from the original pool');await click('b13-token',{token:1});await click('b13-pour',{bucket:1});check((await model()).board.homes[1]===1,'click and destination is an alternative to drag');await page.screenshot({path:root+'sharing-partial.png',fullPage:true});await click('b13-reset');check((await model()).history.some(e=>e.action==='b13-drop'),'reset retains earlier drag');
    }
    if(current==='turnarray:0'){await field('rows',3);await field('cols',5);await field('prediction','more');await click('b13-shape');await click('b13-turn');check((await model()).board.prediction==='more'&&!!(await model()).issue,'first wrong rotation prediction retained');}
    // All models are constructed with actual controls, never storage injection.
    if(steps&&!solved)for(const s of steps){if(s.field)await field(s.field,s.value);else await click(s.action,s.data);}
    if(t.type==='x-joinstory'){for(const group of['left','right'])for(let j=0;j<m[group];j++)await click('story-counter',{group,delta:1});await field('guess',m.guess);await field('op',m.op);await click('story-do');await field('equation',m.equation);}
    if(t.type==='x-pvpair'){for(const pair of m.pairs)for(const j of pair)await click('pv-pair',{index:j});}
    if(t.type==='x-fwall')for(let j=0;j<m.counts.length;j++)await click('wall-cell',{row:j,index:m.counts[j]-1});
    if(t.type==='x-fgroups'){for(let g=0;g<t.groups;g++){await click('group-select',{index:g});for(let j=0;j<t.count;j++)if(m.groups[j]===g)await click('group-token',{index:j});}await click('take-group',{index:0});}
    if(t.type==='x-floor'){if(t.draw){await field('w',m.w);await field('h',m.h);}if(t.partition){await field('cols',m.cols);await field('rows',m.rows);}for(let j=0;j<m.rows;j++)await click('row');}
    if(!steps&&t.type!=='x-joinstory'){const fields=await page.locator('[data-xfield]').evaluateAll(es=>es.map(e=>e.dataset.xfield));for(const k of fields){const v=k.split('.').reduce((a,p)=>a?.[p],m);if(v!==undefined&&v!==null&&typeof v!=='object')await field(k,v);}}
    if(current==='productways:1'){
     await field('cut',5);await click('b13-cut');await field('left',40);await field('right',2);await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,'both split parts must include every row');await field('cut',3);await click('b13-cut');await field('left',24);await field('right',32);
     await field('rows',7);check(await page.locator('[data-x="b13-cut"]').isDisabled(),'pending shape disables cutting');await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,'changed preview cannot submit a stale array');await field('rows',8);check(await page.locator('[data-x="b13-cut"]').isEnabled()&&await page.locator('[data-xfield="right"]').inputValue()==='32','cut controls and entered amounts return after correcting dimensions');await page.screenshot({path:root+'self-chosen-split.png',fullPage:true});
    }
    if(current==='factorpairs:0'){const before=(await model()).board.pairs.length;await field('rows',6);await field('cols',4);await click('b13-pair-save');check((await model()).board.pairs.length===before,'mirror rectangle is not another factor pair');}
    if(current==='unknownproducts:1'){await field('check','45÷5=8');await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,'unknown needs correct substitution in original relation');await field('check','45÷5=9');}
    if(current==='tensproducts:0'){const e=page.locator('[data-xfield="equation"]');await e.fill('');await e.pressSequentially('210=30*7');check(await e.inputValue()==='210=30*7','multi-character typing retains focus');}
    await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,current+' actual controls complete');check(await page.locator('#storage-warning').isHidden(),current+' valid saved model');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),current+' no horizontal overflow');
    if(['sharegroups:0','turnarray:0','productways:1'].includes(current)){const r=(await state()).lessons[id];check((r.cases[i].support||r.cases[i].attempts.length>1)&&!((await snap()).summary.cases[i].independent),current+' corrected work retains earlier failure or support');}
    if(['turnarray:2','tensproducts:0','factorpairs:1'].includes(current))await page.screenshot({path:root+current.replace(':','-')+'.png',fullPage:true});
    await page.locator('[data-do="next"]').click();
   }
   check((await snap()).summary.completed,id+' complete');await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check((await snap()).summary.completed,id+' survives reload');
  }
  const s=await state();check(Object.keys(s.lessons).length===24,'24 distinct node records');check(Object.keys(s.daily.bridges).length===26,'26 distinct joint-work records');check(!errors.length,'no runtime errors');check(!remote.length,'no remote requests');return{checks,errors,remote,nodes:24,nodeTasks:Object.entries(fixture).filter(([id])=>s.lessons[id]).reduce((n,[,ts])=>n+ts.length,0),connections:26,connectionTasks:Object.entries(fixture).filter(([id])=>s.daily.bridges[id]).reduce((n,[,ts])=>n+ts.length,0)};
 }catch(e){await page.screenshot({path:root+'browser-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,current,failed:String(e),body:(await page.locator('body').innerText()).slice(-2400),model:await model().catch(()=>null),snapshot:await snap().catch(()=>null)};}finally{await ctx.close();}
}
