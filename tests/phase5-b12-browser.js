async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B12/';page.setDefaultTimeout(9000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const snap=()=>page.evaluate(()=>mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,s)=>{if(!v)throw Error(s);checks.push(s);},click=(a,sel='')=>page.locator(`[data-x="${a}"]${sel}`).click(),field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){await e.focus();await e.press('Home');for(let n=0;n<Number(v);n++)await e.press('ArrowRight');}else await e.fill(String(v));};
 let current='';const model=async()=>{const s=await snap(),a=await state();return(a.lessons[s.id]||a.daily.bridges[s.id]).models[s.index];};
 try{
  await page.goto(base+'learn.html#threepiles');await page.waitForFunction(()=>window.mathLesson);
  const fixture=await page.evaluate(async()=>{const c=await import('./learning/catalog.js'),t=await import('./learning/tasks.js'),b=await import('./learning/bridges.js'),v=await import('./learning/phase5/b12-model.js'),v11=await import('./learning/phase5/b11-model.js');return Object.fromEntries([...Object.keys(c.LESSONS).filter(id=>c.LESSONS[id].batch==='B12'),...Object.keys(b.BRIDGES).filter(id=>b.BRIDGES[id].batch==='B12')].map(id=>[id,b.sessionTasks(id).map(task=>({t:task,m:t.exampleModel(task),steps:v.TYPES.has(task.type)?v.solveSteps(task):v11.TYPES.has(task.type)?v11.solveSteps(task):null}))]));});
  for(const[id,tasks]of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
   for(let i=0;i<tasks.length;i++){
    current=id+':'+i;const{t,m,steps}=tasks[i];check((await snap()).index===i,current+' opens');if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,current+' untouched cannot complete');}
    if(current==='threepiles:0'){
     await field('lengths.0',4);await field('lengths.1',7);await field('lengths.2',5);await click('b12-parts-lock');
     check(!(await model()).built&&!!(await model()).issue,'incorrect third bar is not accepted');const bars=await page.locator('.b12-bar').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,cells:e.children.length})));check(bars[0].width>100&&Math.abs(bars[0].width/4-bars[1].width/7)<1,'bars have visible width and equal-size units');await page.screenshot({path:root+'first-bar-construction.png',fullPage:true});
    }
    if(current==='storytwo:0'){
     for(const index of[0,1])await click('b12-plan-pick',`[data-index="${index}"]`);await field('op','-');await field('result','24');await field('method','mental');await click('b12-plan-merge');check((await model()).groups.length===3&&!!(await model()).issue,'wrong intermediate quantity cannot advance');
     await field('op','+');await field('result','47');await click('b12-plan-merge');for(const index of[1,0])await click('b12-plan-pick',`[data-index="${index}"]`);await field('op','-');await field('result','42');await field('method','written');await click('b12-plan-merge');await field('equation','35-12+5=□');await field('answer','28');await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,'arithmetic-correct but wrong-meaning plan cannot complete');await click('b12-plan-undo');await click('b12-plan-undo');
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
    if(current==='storytwo:2')await field('equation','□−12+5=38');
    if(current==='plansteps:4'){
     const e=page.locator('[data-xfield="equation"]');await e.fill('');await e.pressSequentially('415-168+230=?');check(await e.inputValue()==='415-168+230=?','multi-character equation input keeps focus');
    }
    await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,current+' actual controls complete');check(await page.locator('#storage-warning').isHidden(),current+' valid saved model');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),current+' no horizontal overflow');
    if(['threepiles:0','storytwo:0'].includes(current)){const r=(await state()).lessons[id];check(r.cases[i].support&&!((await snap()).summary.cases[i].independent),current+' corrected construction retains support');check(current==='threepiles:0'?r.models[i].firstBuild[2]===5:r.models[i].first[0].result==='24',current+' first wrong construction retained');}
    if(['threepiles:1','storytwo:2','plansteps:1'].includes(current))await page.screenshot({path:root+current.replace(':','-')+'.png',fullPage:true});
    await page.locator('[data-do="next"]').click();
   }
   check((await snap()).summary.completed,id+' complete');await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check((await snap()).summary.completed,id+' survives reload');
  }
  const s=await state();check(Object.keys(s.lessons).length===3,'3 distinct node records');check(Object.keys(s.daily.bridges).length===Object.keys(fixture).length-3,'all distinct joint-work records');check(errors.length===0,'no runtime errors');check(remote.length===0,'no remote requests');return{checks,errors,remote,nodes:3,nodeTasks:Object.entries(fixture).filter(([id])=>s.lessons[id]).reduce((n,[,ts])=>n+ts.length,0),connections:Object.keys(s.daily.bridges).length,connectionTasks:Object.entries(fixture).filter(([id])=>s.daily.bridges[id]).reduce((n,[,ts])=>n+ts.length,0)};
 }catch(e){await page.screenshot({path:root+'browser-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,current,failed:String(e),body:(await page.locator('body').innerText()).slice(-2000),model:await model().catch(()=>null),snapshot:await snap().catch(()=>null)};}finally{await ctx.close();}
}
