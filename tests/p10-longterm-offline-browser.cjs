// P10 R2: real Chromium storage, actual graders, offline and upgrade/cache checks.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p10-longterm-round2');
const base='http://127.0.0.1:43827/';
const checks=[];
const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
const snapshot=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,serviceWorkers:'allow',reducedMotion:'reduce'});
 let page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  // Same storage, four different native task systems. No mocked grader or injected answers.
  const tasks=[
   {id:'equivalent',wrong:async()=>{},correct:async()=>{
     for(const [row,index] of [[0,1],[1,2],[2,3]])await page.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
   }},
   {id:'shiftfine',wrong:async()=>{
     await page.locator('[data-xfield="guess"]').fill('345.6');
     await page.locator('[data-x="wide-predict"]').click();
     await page.locator('[data-x="wide-move"][data-delta="1"]').click();
     await page.locator('[data-x="wide-move"][data-delta="1"]').click();
     await page.locator('[data-xfield="answer"]').fill('34.56');
     await page.locator('[data-xfield="factor"]').fill('100');
     await page.locator('[data-xfield="direction"]').selectOption('times');
   },correct:async()=>page.locator('[data-xfield="answer"]').fill('345.6')},
   {id:'solidstack',wrong:async()=>{
     for(const part of ['cube','cube','cube'])await page.locator('[data-x="g27-add"][data-index="'+part+'"]').click();
     await page.locator('[data-x="turn-extra"]').click();
   },correct:async()=>{
     for(let i=0;i<3;i++)await page.locator('[data-x="g27-remove"]').click();
     for(const part of ['cuboid','cube','cube'])await page.locator('[data-x="g27-add"][data-index="'+part+'"]').click();
   }},
   {id:'argument38',wrong:async()=>page.locator('[data-x="r38-card"][data-index="wrong"]').click(),correct:async()=>{
     await page.locator('[data-x="r38-undo"]').click();
     for(const value of ['given','sum','two','answer'])await page.locator('[data-x="r38-card"][data-index="'+value+'"]').click();
   }}
  ];
  for(const t of tasks){
   await page.goto(base+'learn.html#'+t.id);
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,t.id);
   await t.wrong();
   await page.locator('#actions [data-do="check"]').click();
   check(await page.locator('#scene').getAttribute('data-stage')==='revise',t.id+' native first submission is incorrect');
   const before=await snapshot(page);
   check(before.lessons[t.id].cases[0].attempts.length===1,t.id+' wrong submission persisted');
   await t.correct();
   check(await page.locator('#scene').getAttribute('data-stage')==='recheck',t.id+' edit invalidates previous verdict');
   await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,t.id);
   check(await page.locator('#scene').getAttribute('data-stage')==='recheck',t.id+' edited work restored after reload');
   await page.locator('#actions [data-do="check"]').click();
   check(await page.locator('#scene').getAttribute('data-stage')==='passed',t.id+' actual native grading passes');
   let state=await snapshot(page);
   check(state.lessons[t.id].cases[0].attempts.length===2,t.id+' error and correction both persisted');
   await page.locator('#actions [data-do="next"]').click();
   await page.close();
   // Fresh tab in the same browser profile: preserves real localStorage.
   const resumed=await ctx.newPage();
   await resumed.goto(base+'learn.html#'+t.id);
   await resumed.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,t.id);
   state=await snapshot(resumed);
   check(state.lessons[t.id].cases[0].attempts.length===2,t.id+' history survives closed tab and reopening');
   await resumed.goto(base+'v2.html#trail');
   await resumed.locator('[data-lesson-record="'+t.id+'"]').waitFor({state:'attached'});
   check((await resumed.locator('[data-lesson-record="'+t.id+'"]').innerText()).includes('任务 1 /'),t.id+' native work is visible in trail');
   await resumed.screenshot({path:path.join(out,t.id+'-trail.png')});
   // Use resumed tab for next task; maintain a single stable page reference via navigation.
   page=await ctx.newPage();
   await resumed.close();
  }
  // Actual JSON backup file exported through UI; conflicting native workpiece
  // must be rejected by the 3D import path without changing real localStorage.
  await page.goto(base+'v2.html#trail');
  await page.locator('#import-file').waitFor({state:'attached'});
  const exported=page.waitForEvent('download');
  await page.locator('[data-do="export"]').first().click();
  const backupFile=await exported;
  const incoming=JSON.parse(fs.readFileSync(await backupFile.path(),'utf8'));
  const localEquivalent=incoming.state.lessons.equivalent;
  localEquivalent.models[0]=structuredClone(localEquivalent.cases[0].attempts[0].value);
  const conflictBuffer=Buffer.from(JSON.stringify(incoming));
  await page.goto(base+'index.html?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  const beforeImport=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  await page.locator('#import-file').setInputFiles({name:'conflicting-real-backup.json',mimeType:'application/json',buffer:conflictBuffer});
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent?.includes('冲突'));
  check((await page.locator('#toast').innerText()).includes('冲突'),'3D entry reports conflicting imported workpiece');
  check(await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===beforeImport,'3D conflict rejection leaves original browser record unchanged');
  await page.screenshot({path:path.join(out,'3d-import-conflict.png')});
  // Corrupt data on the real 3D entry: raw rescue, never empty v2.
  const broken=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:720}});
  const damaged=await broken.newPage();
  await damaged.goto(base+'index.html?world=network&layout=53#space');
  await damaged.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  const raw='{"schema":2,"lessons":{"broken":';
  await damaged.evaluate(text=>localStorage.setItem('math-explorer-v2',text),raw);
  await damaged.reload();await damaged.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  const exportEvent=damaged.waitForEvent('download');
  await damaged.locator('[data-action="menu"]').click();
  await damaged.locator('#menu-popover [data-action="export"]').click();
  const rescue=await exportEvent;
  check(rescue.suggestedFilename().includes('原始存储'),'3D damaged record exports rescue text, not v2 backup');
  check(fs.readFileSync(await rescue.path(),'utf8')===raw,'3D rescue preserves exact damaged data');
  check(await damaged.evaluate(()=>localStorage.getItem('math-explorer-v2'))===raw,'3D rescue does not overwrite damaged data');
  await broken.close();
  // Active worker reports completeness of entire manifest; deliberately remove one entry.
  await page.goto(base+'index.html?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  const report=async()=>page.evaluate(async()=>{
   const worker=navigator.serviceWorker.controller||(await navigator.serviceWorker.ready).active;
   return await new Promise((resolve,reject)=>{
    const c=new MessageChannel(),t=setTimeout(()=>reject(Error('cache response timeout')),12000);
    c.port1.onmessage=e=>{clearTimeout(t);resolve(e.data);};
    worker.postMessage({type:'math-explorer:cache-status'},[c.port2]);
   });
  });
  await page.waitForFunction(async()=>{
   const worker=navigator.serviceWorker.controller||(await navigator.serviceWorker.ready).active;
   return await new Promise(resolve=>{
    const c=new MessageChannel(),t=setTimeout(()=>resolve(false),1000);
    c.port1.onmessage=e=>{clearTimeout(t);resolve(e.data?.complete===true);};
    worker.postMessage({type:'math-explorer:cache-status'},[c.port2]);
   });
  },null,{timeout:90000});
  const complete=await report();
  check(complete.complete&&complete.cached===complete.total&&complete.total>100,'active SW full manifest is cached');
  await page.evaluate(async key=>{
    const cache=await caches.open(key);
    await cache.delete(new URL('learning/phase5/b39-model.js',location.href));
  },complete.cache);
  const incomplete=await report();
  check(!incomplete.complete&&incomplete.cached===complete.cached-1,'missing unvisited task resource detected');
  await page.evaluate(async key=>{
    const cache=await caches.open(key);
    const response=await fetch('learning/phase5/b39-model.js');
    if(!response.ok)throw Error('could not restore deleted cache resource');
    await cache.put(new URL('learning/phase5/b39-model.js',location.href),response);
  },complete.cache);
  check((await report()).complete,'network repair restores complete cache');
  await ctx.setOffline(true);
  await page.goto(base+'learn.html#argument38',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='argument38');
  check((await snapshot(page)).lessons.argument38.cases[0].attempts.length===2,'offline task reopening preserves earlier errors and corrections');
  await page.goto(base+'index.html?world=network&layout=53#space',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  check(true,'offline 3D scene loads from cached bundle');
  await ctx.setOffline(false);
  check(errors.length===0,'no uncaught Chromium errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,meaning:'First-case lifecycle across four real task systems; not full completion of all four lessons',mac:false,child:false,pedagogy:false},null,2));
  console.log('P10 R2 '+checks.length+' real Chromium checks passed');
 }catch(e){
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({checks,errors,error:String(e),stack:e.stack},null,2));
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  console.error(e.stack||e);process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
