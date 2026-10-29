async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B11/';page.setDefaultTimeout(9000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const snap=()=>page.evaluate(()=>mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,s)=>{if(!v)throw Error(s);checks.push(s);},click=(a,sel='')=>page.locator(`[data-x="${a}"]${sel}`).click(),field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else await e.fill(String(v));};
 let current='';const model=async()=>{const s=await snap(),a=await state();return(a.lessons[s.id]||a.daily.bridges[s.id]).models[s.index];};
 try{
  await page.goto(base+'learn.html#onesbridge');await page.waitForFunction(()=>window.mathLesson);
  const fixture=await page.evaluate(async()=>{const c=await import('./learning/catalog.js'),t=await import('./learning/tasks.js'),b=await import('./learning/bridges.js'),v=await import('./learning/phase5/b11-model.js');return Object.fromEntries([...Object.keys(c.LESSONS).filter(id=>c.LESSONS[id].batch==='B11'),...Object.keys(b.BRIDGES).filter(id=>b.BRIDGES[id].batch==='B11')].map(id=>[id,b.sessionTasks(id).map(task=>({t:task,m:t.exampleModel(task),steps:v.TYPES.has(task.type)?v.solveSteps(task):null}))]));});
  for(const[id,tasks]of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
   for(let i=0;i<tasks.length;i++){
    current=id+':'+i;const{t,m,steps}=tasks[i];check((await snap()).index===i,current+' opens');if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,current+' untouched cannot complete');}
    if(current==='onesbridge:0'){
     await field('guess','0');await field('align.0','0');await field('align.1','1');await click('b11-place-start');
     check(!(await model()).started&&!!(await model()).issue,'misaligned units cannot start a calculation');
     check((await model()).first==='0','first prediction retained even when alignment is corrected');
    }
    if(current==='fourparts:0'){
     await click('b11-group-pick','[data-index="0"]');await click('b11-group-pick','[data-index="1"]');await field('subtotal','0');await click('b11-group-merge');
     check((await model()).groups.length===t.values.length&&!!(await model()).issue,'wrong subtotal leaves every original group intact');
     await click('b11-group-pick','[data-index="0"]');await click('b11-group-pick','[data-index="1"]');
    }
    if(current==='storymoney:0'){
     await field('op',t.steps[0].op==='+'?'-':'+');await field('amount','0');await field('result','0');await field('method','written');await click('b11-event');
     check((await model()).cursor===0&&!!(await model()).issue,'wrong story operation cannot advance the ledger');
    }
    if(current==='checkrough:0'){
     await field('unit',t.units[0]);await field('roundedA','0');await field('roundedB','0');await field('estimate','0');await click('b11-estimate');
     check((await model()).locked===null&&!!(await model()).issue,'incorrect estimate cannot unlock exact checking');
    }
    // The fixture supplies a plan; every field and action is performed through
    // the live UI. No models, completion or localStorage are injected.
    if(steps)for(const s of steps){if(s.field)await field(s.field,s.value);else await click(s.action,Object.entries(s.data||{}).map(([k,v])=>`[data-${k}="${v}"]`).join(''));}
    if(t.type==='x-pvbench'){
     const before=await model();for(let j=0;j<4;j++)for(let n=0;n<Math.abs(m.u[j]-before.u[j]);n++)await click('pv-add',`[data-index="${j}"][data-delta="${m.u[j]>before.u[j]?1:-1}"][data-side=""]`);
     await field('answer',m.answer);if(t.expanded)for(let j=0;j<3;j++)await field('parts.'+j,m.parts[j]);
    }
    if(t.type==='x-joinstory'){for(const group of ['left','right'])for(let j=0;j<m[group];j++)await click('story-counter',`[data-group="${group}"][data-delta="1"]`);await field('guess',m.guess);await field('op',m.op);await click('story-do');await field('equation',m.equation);if(t.swap){await click('story-swap');await field(t.op==='+'?'otherEquation':'shortage',t.op==='+'?m.otherEquation:m.shortage);}}
    if(t.type==='x-splitbench'){let left=[];for(const s of m.saved){for(let j=0;j<t.total;j++)if(left.includes(j)!==s.ids.includes(j))await click('split-token',`[data-index="${j}"]`);left=[...s.ids];await field('equation',s.eq);await click('split-save');}}
    if(t.type==='x-tenbridge'){await field('guess',m.guess);await click('ten-predict');for(const j of m.landmark.ids)await click('ten-token',`[data-index="${j}"]`);await click('ten-landmark');for(const j of m.moved.filter(j=>!m.landmark.ids.includes(j)))await click('ten-token',`[data-index="${j}"]`);await click('ten-finish');for(const k of ['firstPart','secondPart','equation'])await field(k,m[k]);}
    if(t.type==='x-factfamily')for(const s of m.saved){await click('family-mode',`[data-mode="${s.mode}"]`);await field('equation',s.eq);await click('family-save');}
    if(t.type==='x-recallbench')for(const s of m.saved){await field('answer',s.answer);await click('recall-save');}
    if(t.type==='x-countsteps'){await field('start',m.start);for(const n of m.hops){await field('next',n);await click('steps-next');}await field('equation',m.equation);}
    if(t.type==='x-threegroups')for(const s of m.saved){for(const j of s.pair)await click('triple-pick',`[data-index="${j}"]`);await click('triple-merge');await field('sub',s.sub);await field('total',s.total);await click('triple-save');}
    if(t.type==='x-unitadd'){for(const unit of ['tens','ones'])for(let j=0;j<m[unit];j++)await click('unit-counter',`[data-unit="${unit}"][data-delta="1"]`);await click('unit-join');for(let j=0;j<m.exchanges;j++)await click('unit-exchange');await field('equation',m.equation);}
    if(t.type==='x-subgroups')for(let j=0;j<2;j++){await click('subgroups-branch',`[data-index="${j}"]`);for(const n of m.paths[j]){await field('next',n);await click('subgroups-next');}}
    await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,current+' actual controls complete');check(await page.locator('#storage-warning').isHidden(),current+' valid saved model');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),current+' no horizontal overflow');
    if(['onesbridge:0','fourparts:0','storymoney:0','checkrough:0'].includes(current)){
     const record=(await state()).lessons[id];check(record.cases[i].support,current+' local corrective feedback is preserved as support');check(!(await snap()).summary.cases[i].independent,current+' correction is not independent evidence');
     if(current==='onesbridge:0')check(record.models[i].first==='0','initial quantity prediction survives a successful calculation');
     if(current==='storymoney:0')check(record.models[i].first[0].amount==='0','first story operation survives corrected entries');
     if(current==='checkrough:0')check(record.models[i].first.estimate==='0','first estimate survives a correct estimate and exact answer');
    }
    if(['onesbridge:0','onesbridge:1','fourparts:0','columnthree:1','columnlarge:1','decimalsum:0','decimalsum:1','storylarger:1','storymillion:0','checkrough:0','checkpurpose:0'].includes(current))await page.screenshot({path:root+current.replace(':','-')+'.png',fullPage:true});
    await page.locator('[data-do="next"]').click();
   }
   check((await snap()).summary.completed,id+' complete');await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check((await snap()).summary.completed,id+' survives reload');
  }
  const s=await state();check(Object.keys(s.lessons).length===23,'23 distinct node records');check(Object.keys(s.daily.bridges).length===Object.keys(fixture).length-23,'all distinct joint-work records');check(errors.length===0,'no runtime errors');check(remote.length===0,'no remote requests');return{checks,errors,remote,nodes:23,nodeTasks:Object.entries(fixture).filter(([id])=>s.lessons[id]).reduce((n,[,ts])=>n+ts.length,0),connections:Object.keys(s.daily.bridges).length,connectionTasks:Object.entries(fixture).filter(([id])=>s.daily.bridges[id]).reduce((n,[,ts])=>n+ts.length,0)};
 }catch(e){await page.screenshot({path:root+'browser-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,current,failed:String(e),body:(await page.locator('body').innerText()).slice(-2000),model:await model().catch(()=>null),snapshot:await snap().catch(()=>null)};}finally{await ctx.close();}
}
