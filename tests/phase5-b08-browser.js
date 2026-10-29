async original=>{
 const ctx=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B08/';page.setDefaultTimeout(9000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(!r.url().startsWith(base)&&/^https?:/.test(r.url()))remote.push(r.url());});
 const snap=()=>page.evaluate(()=>window.mathLesson.snapshot()),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))),check=(v,l)=>{if(!v)throw Error(l);checks.push(l);},click=async(a,attrs='')=>page.locator(`[data-x="${a}"]${attrs}`).click();
 const field=async(k,v)=>{const e=page.locator(`[data-xfield="${k}"]`);if(!await e.count()||!await e.isEnabled())return;if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){await e.focus();await e.press('Home');for(let i=0;i<Math.floor(v/100);i++)await e.press('PageUp');let now=+await e.inputValue();for(let i=0;i<Math.abs(v-now);i++)await e.press(v>now?'ArrowRight':'ArrowLeft');}else await e.fill(v===null?'':String(v));};
 const model=async()=>{const a=await snap(),s=await state();return(s.lessons[a.id]||s.daily.bridges[a.id]).models[a.index];};let current='';
 try{
  await page.goto(base+'learn.html#fourplaces');await page.waitForFunction(()=>window.mathLesson);
  let fixture=await page.evaluate(async()=>{const c=await import('./learning/catalog.js'),t=await import('./learning/tasks.js'),b=await import('./learning/bridges.js');return Object.fromEntries([...Object.keys(c.LESSONS).filter(id=>c.LESSONS[id].batch==='B08'),...Object.keys(b.BRIDGES).filter(id=>b.BRIDGES[id].batch==='B08')].map(id=>[id,b.sessionTasks(id).map(task=>({t:task,m:t.exampleModel(task)}))]));});
  const ONLY=null;if(ONLY)fixture=Object.fromEntries(Object.entries(fixture).filter(([id])=>ONLY.includes(id)));
  for(const[id,tasks]of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check(!(await snap()).summary.completed,id+' begins incomplete');if(await page.locator('[data-do="start"]').count())await page.locator('[data-do="start"]').click();
   for(let i=0;i<tasks.length;i++){
    current=id+':'+i;const{t,m}=tasks[i];check((await snap()).index===i,current+' opens');
    if(i===0){await page.locator('[data-do="check"]').click();check(!(await snap()).summary.cases[i].complete,current+' empty attempt cannot complete');}
    if(t.type==='x-wideboard'){
     if(['build','compare','puzzle'].includes(t.mode))for(let r=0;r<m.rows.length;r++){if(m.rows.length>1)await click('wide-active',`[data-index="${r}"]`);for(let k=0;k<m.rows[r].length;k++)for(let n=0;n<m.rows[r][k];n++)await click('wide-add',`[data-index="${k}"][data-delta="1"]`);await field('answers.'+r,m.answers[r]);for(let k=0;k<m.parts[r].length;k++)await field(`parts.${r}.${k}`,m.parts[r][k]);await field('words.'+r,m.words[r]);}
     if(t.mode==='order'){for(const k of m.order)await click('wide-order',`[data-index="${k}"]`);if(t.conversions)for(let k=0;k<m.answers.length;k++)await field('answers.'+k,m.answers[k]);}
     if(t.mode==='line'||t.mode==='order'&&!t.conversions)for(let k=0;k<m.positions.length;k++)await field('positions.'+k,m.positions[k]);
     for(const k of ['relation','first','gap'])await field(k,m[k]);
    }
    if(t.type==='x-wideshift'){
     await field('guess',m.guess);await click('wide-predict');
     if(t.mode==='add'){if(t.step<0&&(await model()).u[1]===0)await click('wide-swap','[data-kind="down"][data-index="0"]');await click('wide-move',`[data-delta="${Math.sign(t.step)}"]`);if((await model()).u[1]>=10)await click('wide-swap','[data-kind="up"][data-index="1"]');for(const k of m.changed)await click('wide-changed',`[data-index="${k}"]`);}
     else for(const d of m.trace)await click('wide-move',`[data-delta="${d}"]`);
     for(const k of ['answer','factor','direction','exponent'])await field(k,m[k]);
    }
    if(t.type==='x-roundwork'){
     await field('unit',m.unit);for(const k of m.sig)await click('wide-sig',`[data-index="${k}"]`);
     for(let r=0;r<m.steps.length;r++){if(m.steps.length>1)await click('wide-active',`[data-index="${r}"]`);for(const k of ['low','high','mark','result'])await field(`steps.${r}.${k}`,m.steps[r][k]);}
     for(const k of ['estimate','exact','relation'])await field(k,m[k]);
    }
    if(t.type==='x-boundinterval'){for(const k of ['low','high','left','right'])await field(k,m[k]);for(const s of m.trials){await field('probe',s.value);await click('wide-probe');}}
    if(t.type==='x-romanwork'){if(t.mode==='write')for(const c of m.roman)await click('roman-tile',`[data-tile="${c}"]`);else{for(const k of m.cuts)await click('roman-cut',`[data-index="${k}"]`);for(let k=0;k<m.parts.length;k++)await field('parts.'+k,m.parts[k]);}await field('answer',m.answer);await field('zero',m.zero);for(let k=0;k<m.each.length;k++)await field('each.'+k,m.each[k]);}
    if(t.type==='x-pvbench'){for(let k=0;k<4;k++)for(let n=0;n<m.u[k];n++)await click('pv-add',`[data-index="${k}"][data-delta="1"][data-side=""]`);await field('answer',m.answer);for(let k=0;k<m.parts.length;k++)await field('parts.'+k,m.parts[k]);await field('why',m.why);}
    await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,current+' actual controls complete');check(await page.locator('#storage-warning').isHidden(),current+' valid persisted record');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),current+' no horizontal overflow');
    if(['fourplaces:0','thousandstep:2','decimalscale:2','decimalwords:1','roundtenths:2','accuracy:1','estbounds:2','romanyears:0','standardform:1'].includes(current))await page.screenshot({path:root+current.replace(':','-')+'.png',fullPage:true});
    await page.locator('[data-do="next"]').click();
   }
   check((await snap()).summary.completed,id+' complete');await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);check((await snap()).summary.completed,id+' survives reload');
  }
  const s=await state();check(Object.keys(s.lessons).filter(id=>id in fixture).length===Object.keys(fixture).filter(id=>!id.startsWith('link-')).length,'expected unique source-node records');check(Object.keys(s.daily.bridges).length===Object.keys(fixture).filter(id=>id.startsWith('link-')).length,'expected distinct source-edge records');check(errors.length===0,'no runtime errors');check(remote.length===0,'no remote requests');return{checks,errors,remote,nodes:Object.keys(fixture).filter(id=>!id.startsWith('link-')).length,nodeTasks:Object.entries(fixture).filter(([id])=>!id.startsWith('link-')).reduce((s,[id,t])=>s+t.length,0),connections:Object.keys(fixture).filter(id=>id.startsWith('link-')).length,connectionTasks:Object.entries(fixture).filter(([id])=>id.startsWith('link-')).reduce((s,[id,t])=>s+t.length,0)};
 }catch(e){await page.screenshot({path:root+'browser-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,current,failed:String(e),url:page.url(),body:(await page.locator('body').innerText()).slice(-2600),snapshot:await snap().catch(()=>null)};}finally{await ctx.close();}
}
