async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const ONLY=["nextone", "link-countonce-lastcount", "link-lastcount-nextone", "link-lastcount-manyfaces", "link-quickfive-partswithin", "link-countline-skipbasic", "link-skipbasic-anytens", "link-skipbasic-skipfour", "link-write20-teenbuild", "link-digitcompare-order20", "link-write20-numberwords"];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B06/';
 page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(!r.url().startsWith(base)&&/^https?:/.test(r.url()))remote.push(r.url());});
 const snap=()=>page.evaluate(()=>window.mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};
 const click=async(a,attrs='')=>page.locator(`[data-x="${a}"]${attrs}`).click();
 const field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(!await e.count()||!await e.isEnabled()||String(await e.inputValue())===String(v??''))return;if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){await e.focus();await e.press('Home');const min=+(await e.getAttribute('min')),step=+(await e.getAttribute('step'));for(let i=0;i<(v-min)/step;i++)await e.press('ArrowRight');}else await e.fill(v===null?'':String(v));};
 let current='';
 try{
  await page.goto(base+'learn.html#countonce');await page.waitForFunction(()=>window.mathLesson);
  let fixture=await page.evaluate(async()=>{const c=await import('./learning/catalog.js'),t=await import('./learning/tasks.js'),b=await import('./learning/bridges.js');return Object.fromEntries([...Object.keys(c.LESSONS).filter(id=>c.LESSONS[id].batch==='B06'),...Object.keys(b.BRIDGES).filter(id=>b.BRIDGES[id].batch==='B06')].map(id=>[id,b.sessionTasks(id).map(task=>({t:task,m:t.exampleModel(task)}))]));});
  if(ONLY)fixture=Object.fromEntries(Object.entries(fixture).filter(([id])=>ONLY.includes(id)));
  const expectedNodes=Object.keys(fixture).filter(id=>!id.startsWith('link-')).length,expectedLinks=Object.keys(fixture).length-expectedNodes;
  // The complete UI pass includes every node and joint task, without setting model/storage values.
  for(const[id,tasks]of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
   for(let i=0;i<tasks.length;i++){
    current=id+':'+i;const{t,m}=tasks[i];check((await snap()).index===i,current+' opens');
    if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,current+' empty work cannot complete');}
    if(t.type==='x-counttrail'){for(let j=0;j<t.n;j++)await click('count-tap',`[data-index="${j}"]`);await field('total',t.n);if(t.rearrange){await field('prediction',t.n);await click('count-move');if(t.recount)for(let j=t.n-1;j>=0;j--)await click('count-tap',`[data-index="${j}"]`);}}
    if(t.type==='x-paircounts')for(let j=0;j<Math.min(t.a,t.b);j++){await click('pair-a',`[data-index="${j}"]`);await click('pair-b',`[data-index="${j}"]`);}
    if(t.type==='x-onechange'){await field('guess',t.n+t.delta);await click('one-change');}
    if(t.type==='x-numberfaces'){for(let j=0;j<t.n;j++)await click('face-take',`[data-index="${j}"]`);if(!t.give)for(let j=0;j<t.n;j++)await click('face-dot',`[data-index="${j}"]`);}
    if(t.type==='x-flashcount'){await page.locator('[data-b6="peek"]').click();check(await page.locator('.b6-flash i,.b6-ten-frame span').count()>0,current+' flash reveals representation');await page.waitForFunction(()=>document.querySelector('.b6-flash')?.textContent.includes('已盖住'));}
    if(t.type==='x-fingers'){for(let j=0;j<t.n;j++)await click('finger-toggle',`[data-index="${j}"]`);await click('finger-show');}
    if(t.type==='x-partbuild'){for(const p of m.saved){await field('red',p[0]);await field('blue',p[1]);await click('parts-save');}}
    if(t.type==='x-bundlecount'){for(let j=0;j<t.size;j++)await click('bundle-pick',`[data-index="${j}"]`);await click('bundle-wrap');for(let j=1;j<Math.floor(t.n/t.size);j++)await click('bundle-repeat');}
    if(t.type==='x-countboard')for(let j=0;j<t.holes.length;j++)await field('values.'+j,t.holes[j]);
    if(t.type==='x-countwalk')for(let j=0;j<t.count;j++){await field('next',t.start+t.step*(j+1));await click('walk-hop');}
    if(t.type==='x-orderline')for(const j of m.order)await click('order-pick',`[data-index="${j}"]`);
    if(t.type==='x-teenbuild'){for(let j=0;j<10;j++)await click('teen-pick',`[data-index="${j}"]`);await click('teen-wrap');if(t.unpack){await click('teen-unpack');for(let j=0;j<10;j++)await click('teen-pick',`[data-index="${j}"]`);await click('teen-wrap');}}
    if(t.type==='x-numberwrite'){if(t.mode==='audio'){await page.locator('[data-b6="hear"]').click();await page.waitForFunction(({id,i})=>{const s=JSON.parse(localStorage.getItem('math-explorer-v2'));return(s.lessons[id]||s.daily.bridges[id]).models[i].heard>0;},{id,i});}for(const k of['hundreds','tens','ones'])for(let j=0;j<m[k];j++)await click('write-add',`[data-unit="${k}"][data-delta="1"]`);}
    for(const[k,v]of Object.entries(m))if(v!==null&&typeof v!=='object'&&typeof v!=='boolean')await field(k,v);
    await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,current+' manipulation completes');
    check(await page.locator('#storage-warning').isHidden(),current+' records persist');
    if(['bundles:0','partswithin:2','powersteps:6','teenbuild:1','write100:0'].includes(current))await page.screenshot({path:root+current.replace(':','-')+'.png',fullPage:true});
    await page.locator('[data-do="next"]').click();
   }
   check((await snap()).summary.completed,id+' complete');await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check((await snap()).summary.completed,id+' completion survives refresh');
  }
  const s=await state();check(Object.keys(s.lessons).filter(id=>id in fixture).length===expectedNodes,'expected new node records');check(Object.keys(s.daily.bridges).length===expectedLinks,'expected distinct joint-work records');check(errors.length===0,'no runtime errors');check(remote.length===0,'no remote requests');return{checks,errors,remote,nodes:expectedNodes,nodeTasks:Object.entries(fixture).filter(([id])=>!id.startsWith('link-')).reduce((s,[id,t])=>s+t.length,0),connections:expectedLinks,connectionTasks:expectedLinks*2};
 }catch(e){return{checks,errors,remote,current,failed:String(e),url:page.url(),body:(await page.locator('body').innerText()).slice(-1500),state:await state().catch(()=>null)};}finally{await ctx.close();}
}
