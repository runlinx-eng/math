async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B10/';page.setDefaultTimeout(9000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const snap=()=>page.evaluate(()=>mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,s)=>{if(!v)throw Error(s);checks.push(s);},click=(a,sel='')=>page.locator(`[data-x="${a}"]${sel}`).click(),field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else await e.fill(String(v));};
 let current='';const model=async()=>{const s=await snap(),a=await state();return(a.lessons[s.id]||a.daily.bridges[s.id]).models[s.index];};
 try{
  await page.goto(base+'learn.html#jointhings');await page.waitForFunction(()=>window.mathLesson);
  const fixture=await page.evaluate(async()=>{const c=await import('./learning/catalog.js'),t=await import('./learning/tasks.js'),b=await import('./learning/bridges.js');return Object.fromEntries([...Object.keys(c.LESSONS).filter(id=>c.LESSONS[id].batch==='B10'),...Object.keys(b.BRIDGES).filter(id=>b.BRIDGES[id].batch==='B10')].map(id=>[id,b.sessionTasks(id).map(task=>({t:task,m:t.exampleModel(task)}))]));});
  for(const[id,tasks]of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
   for(let i=0;i<tasks.length;i++){
    current=id+':'+i;const{t,m}=tasks[i];check((await snap()).index===i,current+' opens');if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,current+' untouched cannot complete');}
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
    if(['showactions:1','smallstories:2','screenadd:1','screenadd:2','signsfirst:2','splitpairs:0','bonds20:0','swapadd:2','tripleadd:0','regroupadd:2','scaleadd:3'].includes(current))await page.screenshot({path:root+current.replace(':','-')+'.png',fullPage:true});
    await page.locator('[data-do="next"]').click();
   }
   check((await snap()).summary.completed,id+' complete');await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check((await snap()).summary.completed,id+' survives reload');
  }
  const s=await state();check(Object.keys(s.lessons).length===22,'22 distinct node records');check(Object.keys(s.daily.bridges).length===16,'16 distinct joint-work records');check(errors.length===0,'no runtime errors');check(remote.length===0,'no remote requests');return{checks,errors,remote,nodes:22,nodeTasks:65,connections:16,connectionTasks:32};
 }catch(e){await page.screenshot({path:root+'browser-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,current,failed:String(e),body:(await page.locator('body').innerText()).slice(-2000),model:await model().catch(()=>null),snapshot:await snap().catch(()=>null)};}finally{await ctx.close();}
}
