async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B07/';
 page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(!r.url().startsWith(base)&&/^https?:/.test(r.url()))remote.push(r.url());});
 const snap=()=>page.evaluate(()=>window.mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};
 const click=async(a,attrs='')=>page.locator(`[data-x="${a}"]${attrs}`).click();
 const field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(!await e.count()||!await e.isEnabled())return;if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){await e.focus();await e.press('Home');const max=+(await e.getAttribute('max')),big=Math.max(1,Math.floor(max/10));for(let i=0;i<Math.floor(v/big);i++)await e.press('PageUp');let now=+await e.inputValue();for(let i=0;i<Math.abs(v-now);i++)await e.press(v>now?'ArrowRight':'ArrowLeft');}else await e.fill(v===null?'':String(v));};
 const model=async()=>{const a=await snap(),s=await state();return(s.lessons[a.id]||s.daily.bridges[a.id]).models[a.index];};
 const build=async(u,side='')=>{const current=(await model()),old=side?current[side]:current.u;for(let i=0;i<4;i++)for(let j=0;j<Math.abs(u[i]-old[i]);j++)await click('pv-add',`[data-index="${i}"][data-delta="${u[i]>old[i]?1:-1}"][data-side="${side}"]`);};
 let current='';
 try{
  await page.goto(base+'learn.html#tenexchange');await page.waitForFunction(()=>window.mathLesson);
  let fixture=await page.evaluate(async()=>{const c=await import('./learning/catalog.js'),t=await import('./learning/tasks.js'),b=await import('./learning/bridges.js');return Object.fromEntries([...Object.keys(c.LESSONS).filter(id=>c.LESSONS[id].batch==='B07'),...Object.keys(b.BRIDGES).filter(id=>b.BRIDGES[id].batch==='B07')].map(id=>[id,b.sessionTasks(id).map(task=>({t:task,m:t.exampleModel(task)}))]));});
  const ONLY=null; if(ONLY)fixture=Object.fromEntries(Object.entries(fixture).filter(([id])=>ONLY.includes(id)));
  for(const[id,tasks]of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
   for(let i=0;i<tasks.length;i++){
    current=id+':'+i;const{t,m}=tasks[i];check((await snap()).index===i,current+' opens');
    if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,current+' empty submission cannot complete');}
    if(t.type==='x-pvbench'){
     if(t.forms){for(const saved of m.saved){await click('pv-form',`[data-form="${saved.form}"]`);await build(saved.u);await click('pv-save');}}
     else{if(!t.fixed)await build(m.u);for(const k of t.exchanges||[])await click('pv-swap',`[data-kind="${k}"]`);if(t.saveCount){await click('pv-save');for(let j=1;j<t.saveCount;j++){const u=(await model()).u;await click('pv-swap',`[data-kind="${u[1]?'down1':'down10'}"]`);await click('pv-save');}}}
     if(t.chart){await page.locator('.b7-chart summary').click();await click('pv-cell',`[data-index="${t.n}"]`);}
     if(t.position)await field('mark',m.mark);
     for(let j=0;j<m.parts.length;j++)await field('parts.'+j,m.parts[j]);for(let j=0;j<m.words.length;j++)await field('words.'+j,m.words[j]);
    }
    if(t.type==='x-pvshift'){
     await field('guess',m.guess);await click('pv-predict');
     for(const delta of m.moves){const u=(await model()).u,k=Math.abs(delta)===100?0:1;if(delta<0&&u[k]===0)await click('pv-swap',`[data-kind="${k===1?'down10':'down100'}"]`);await click('pv-move',`[data-delta="${delta}"]`);}
     let u=(await model()).u;while(u[2]>=10){await click('pv-swap','[data-kind="up1"]');u=(await model()).u;}while(u[1]>=10){await click('pv-swap','[data-kind="up10"]');u=(await model()).u;}
    }
    if(t.type==='x-pvcompare'){await build(m.a,'a');await build(m.b,'b');}
    if(t.type==='x-pvorder'){for(const j of m.order)await click('pv-order',`[data-index="${j}"]`);for(let j=0;j<m.positions.length;j++)await field('positions.'+j,m.positions[j]);}
    if(t.type==='x-pvestimate'){await field('guess',m.guess);await click('pv-predict');for(let j=0;j<t.n;j++)await click('pv-tap',`[data-index="${j}"]`);}
    if(t.type==='x-pvpair'){for(const pair of m.pairs)for(const j of pair)await click('pv-pair',`[data-index="${j}"]`);for(let j=0;j<m.counts.length;j++)await field('counts.'+j,m.counts[j]);}
    if(t.type==='x-countboard')for(let j=0;j<t.holes.length;j++)await field('values.'+j,t.holes[j]);
    if(t.type==='x-countwalk')for(let j=0;j<t.count;j++){await field('next',t.start+t.step*(j+1));await click('walk-hop');}
    for(const[k,v]of Object.entries(m))if(v!==null&&typeof v!=='object'&&typeof v!=='boolean')await field(k,v);
    await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,current+' real controls complete');check(await page.locator('#storage-warning').isHidden(),current+' record valid');
    if(['rename:1','faces100:1','shift100:5','compare1000:0','screen1000:2','parity:1','problems1000:1','faces1000:0'].includes(current))await page.screenshot({path:root+current.replace(':','-')+'.png',fullPage:true});
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),current+' no horizontal overflow');
    await page.locator('[data-do="next"]').click();
   }
   check((await snap()).summary.completed,id+' complete');await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check((await snap()).summary.completed,id+' survives reload');
  }
  const s=await state();check(Object.keys(s.lessons).filter(id=>id in fixture).length===Object.keys(fixture).filter(id=>!id.startsWith('link-')).length,'expected distinct source-node records');check(Object.keys(s.daily.bridges).length===Object.keys(fixture).filter(id=>id.startsWith('link-')).length,'expected distinct source-edge records');check(errors.length===0,'no runtime errors');check(remote.length===0,'no remote requests');return{checks,errors,remote,nodes:Object.keys(fixture).filter(id=>!id.startsWith('link-')).length,nodeTasks:Object.entries(fixture).filter(([id])=>!id.startsWith('link-')).reduce((s,[id,t])=>s+t.length,0),connections:Object.keys(fixture).filter(id=>id.startsWith('link-')).length,connectionTasks:Object.entries(fixture).filter(([id])=>id.startsWith('link-')).reduce((s,[id,t])=>s+t.length,0)};
 }catch(e){await page.screenshot({path:root+'browser-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,current,failed:String(e),url:page.url(),body:(await page.locator('body').innerText()).slice(-2200),snapshot:await snap().catch(()=>null)};}finally{await ctx.close();}
}
