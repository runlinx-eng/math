// Twenty native fraction-order tasks, two desktop sizes, genuine controls.
// Only empty lesson positions are seeded; the HTTP origin stops before math.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const cases=require('./fixtures/p9-fraction-order-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-fraction-order-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],correctionObservations=[],offline=[];
const ok=(condition,message)=>{if(!condition)throw Error(message);checks.push(message);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const [{sessionTasks,BRIDGES},fractions,{replayFractionOrderEvidence},{ensureB39Ready}]=await Promise.all([
  import('../dist/learning/bridges.js'),import('../dist/learning/phase5/b17-model.js'),
  import('../dist/learning/fraction-order-evidence.js'),import('../dist/learning/phase4/async-batches.js')
 ]);
 await ensureB39Ready();
 let browser,server,activePage,activeLabel='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const [width,height] of viewports){
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/,'')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push(activeLabel+': '+String(error)));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const shot=async name=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,activeLabel+'-'+name+'.png'),fullPage:true});
   };
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);
    const closed=input.locator('xpath=ancestor::details[not(@open)]').first();
    if(await closed.count())await closed.locator(':scope > summary').click();
    if(await input.evaluate(element=>element.tagName)==='SELECT')await input.selectOption(String(value));
    else await input.fill(String(value));
   };
   const action=async(name,data={})=>{
    const selector='[data-x="'+name+'"]'+Object.entries(data).map(([key,value])=>'[data-'+key+'="'+value+'"]').join('');
    await page.locator(selector).click();
   };
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const rawStorage=()=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const snapshot=window.mathLesson?.snapshot();return snapshot?.id===id&&snapshot.index===index&&snapshot.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' reload comes from stopped-origin Service Worker');
   };
   const open=async spec=>{
    // No solved model, answer, history or correct attempt is seeded here.
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES},{ensureB39Ready}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js'),
      import('./learning/phase4/async-batches.js')
     ]);
     await ensureB39Ready();const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    await page.goto(base+'learn.html#'+spec.id);await reload(spec);
   };
   const step=async s=>s.field?field(s.field,s.value):action(s.action,s.data);
   const solve=async(task,{incomplete=false,wrongPrediction=false}={})=>{
    const steps=fractions.solveSteps(task),lastOrder=steps.findLastIndex(s=>s.action==='b17-order');
    let from=0;
    if(wrongPrediction){
     for(let index=task.cards.length-1;index>=0;index--)await action('b17-card',{index});
     await action('b17-predict');from=steps.findIndex(s=>s.action==='b17-predict')+1;
    }
    for(let n=from;n<steps.length;n++)if(!incomplete||n!==lastOrder)await step(steps[n]);
    return steps[lastOrder];
   };

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let ready=false;
   for(let n=0;n<300;n++){
    ready=await page.evaluate(async expected=>{
     if(!navigator.serviceWorker.controller)return false;
     return new Promise(resolve=>{
      const channel=new MessageChannel(),timeout=setTimeout(()=>{channel.port1.close();resolve(false);},1200);
      channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data?.cache===expected&&event.data.complete===true&&event.data.cached===event.data.total);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
    },cache);
    if(ready)break;await page.waitForTimeout(100);
   }
   ok(ready,width+' complete original offline cache');
   const cachedModules=await page.evaluate(async cache=>{
    const store=await caches.open(cache);
    return Promise.all(['learning/fraction-order-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/phase5/b17-model.js',
     'learning/phase5/b16-model.js','learning/phase5/b39.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(item=>item.cached),width+' fraction-order source and lazy B39 dependencies are cached');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' source HTTP server stopped before mathematical actions');
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;const task=sessionTasks(spec.id)[spec.index];await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),activeLabel+' optional question starts collapsed');
    ok(await hint.count()===0,activeLabel+' no facts before real actions and checking');
    await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),activeLabel+' optional question opens');
    await page.waitForFunction(({id,index})=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id].cases[index]?.support===true,spec);
    await guide.locator('summary').click();
    const blank=await saved(spec.id);
    ok(blank.models[spec.index].history.length===0&&blank.cases[spec.index].attempts.length===0,activeLabel+' guide does not create a mathematical event or submission');
    const last=await solve(task,{incomplete:true,wrongPrediction:true});
    ok(await hint.count()===0,activeLabel+' constructed but unsubmitted work is not verified');
    await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',activeLabel+' incomplete order remains a real failed attempt');
    ok(await hint.count()===0,activeLabel+' incomplete order receives no strict feedback');
    await step(last);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' complete genuine construction passes original mathematics');
    ok(await hint.isVisible(),activeLabel+' complete checked construction receives bounded facts');
    const checked=await model(spec),proof=replayFractionOrderEvidence(task,checked),words=await hint.innerText();
    const firstStorage=await rawStorage(),firstRecord=(await saved(spec.id)).cases[spec.index];
    ok(!!proof&&fractions.valid(task,checked)&&fractions.inspect(task,checked).correct,activeLabel+' stored work passes independent replay and original grading');
    ok(proof.cards.every(card=>words.includes(card)),activeLabel+' observations refer to the actual source fractions');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),activeLabel+' no borrowed mathematical-practice label');
    ok(proof.shadeCounts.every((n,i)=>n===proof.fractions[i][0]),activeLabel+' every real shaded amount has exact numerator and denominator');
    if(task.common)ok(proof.common?.renames.length===task.cards.length,activeLabel+' every card received a real common-unit name');
    if(task.gaps)ok(proof.gaps?.length===task.cards.length,activeLabel+' every distance to one is recorded');
    if(task.benchmark)ok(proof.benchmarks?.length===task.cards.length,activeLabel+' every comparison with one half is recorded');
    if(task.mismatch)ok(checked.history.some(e=>e.a==='align')&&proof.aligned,activeLabel+' unequal diagram wholes were actually aligned');
    await shot('01-verified-offline');await reload(spec);
    ok(await hint.isVisible()&&JSON.stringify(await model(spec))===JSON.stringify(checked),activeLabel+' stopped-origin refresh preserves exact submitted work and evidence');
    const offlineStorage=await rawStorage(),restored=JSON.parse(offlineStorage).lessons[spec.id];
    await field('position','999');ok(await hint.count()===0,activeLabel+' editing invalidates checked feedback immediately');
    await reload(spec);ok(await hint.count()===0,activeLabel+' edited draft remains unverified after offline refresh');
    await submit();
    ok(await hint.count()===0,activeLabel+' a new check cannot use a stale recorded position for changed visible input');
    await field('position',checked.position);await submit();ok(await hint.isVisible(),activeLabel+' restoring the recorded input and rechecking verifies the current work');
    await action('b17-shade',{row:0,index:0});ok(await hint.count()===0,activeLabel+' changing a physical small part invalidates evidence');
    await reload(spec);ok(await hint.count()===0,activeLabel+' changed construction survives offline refresh without stale feedback');
    await action('b17-shade',{row:0,index:0});ok(await hint.count()===0,activeLabel+' restored amount with new history still needs a fresh check');
    await submit();ok(await hint.isVisible(),activeLabel+' legal shading correction replays after a fresh check');
    const end=await saved(spec.id),m=end.models[spec.index],attempts=end.cases[spec.index].attempts;
    ok(attempts.length===5,activeLabel+' five original attempts preserve failed and revised work');
    ok(attempts.every(a=>a.id&&a.at&&a.value&&typeof a.supported==='boolean'&&typeof a.exposed==='boolean'),activeLabel+' original v2 attempt format is retained');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),activeLabel+' no score or mastery state is added');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),activeLabel+' no desktop horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,source:spec.nodeId,
     observation:words,firstModel:checked,finalModel:m,attempts,proof:replayFractionOrderEvidence(task,m),
     offlineModel:restored.models[spec.index],firstRecord,record:end.cases[spec.index],offlineRecord:restored.cases[spec.index],
     storageSnapshots:{first:firstStorage,offline:offlineStorage,final:await rawStorage()}});
   }

   // These visible attempts are replayed without treating an earlier location,
   // failed subdivision or duplicate record as a new successful construction.
   const negative={id:'fractionbench',index:0},task=sessionTasks(negative.id)[negative.index];
   for(const variant of ['wrong-place','wrong-common','duplicate-place','duplicate-rename','reset','final-failed-place']){
    activeLabel=`${width}x${height}-correction-${variant}`;await open(negative);
    const steps=fractions.solveSteps(task);let injected=false;
    for(const s of steps){
     if(!injected&&variant==='wrong-place'&&s.action==='b17-place'){
      const correct=(await model(negative)).position;await field('position','0');await action('b17-place');await field('position',correct);injected=true;
     }
     if(!injected&&variant==='wrong-common'&&s.action==='b17-common'){
      const correct=(await model(negative)).denom;await field('denom','7');await action('b17-common');await field('denom',correct);injected=true;
     }
     await step(s);
    }
    if(variant==='duplicate-place')await action('b17-place');
    if(variant==='duplicate-rename')await action('b17-rename');
    if(variant==='reset'){await action('b17-reset');await solve(task);}
    if(variant==='final-failed-place'){
     const current=(await model(negative)).position;await field('position','-1');await action('b17-place');await field('position',current);
    }
    await submit();const m=await model(negative);
    ok(fractions.valid(task,m)&&fractions.inspect(task,m).correct,activeLabel+' unchanged original grading accepts the final construction');
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' original completion remains available');
    const proof=replayFractionOrderEvidence(task,m);
    ok(!!proof&&proof.history.events.length===m.history.length&&await hint.isVisible(),activeLabel+' previous attempts and the final exact positions are separately checked');
    if(variant==='wrong-place')ok(proof.history.placementAttempts.some(p=>!p.matchesCard),activeLabel+' wrong earlier placement is retained rather than called correct');
    if(variant==='final-failed-place')ok(m.issue!==''&&proof.history.failedRequests.at(-1).issue===m.issue,activeLabel+' final failed placement is retained without clearing its issue');
    await reload(negative);ok(await hint.isVisible()&&JSON.stringify(await model(negative))===JSON.stringify(m),activeLabel+' full corrected history and evidence restore offline');
    const restoredStorage=await rawStorage(),restored=JSON.parse(restoredStorage).lessons[negative.id];
    correctionObservations.push({width,height,id:negative.id,index:negative.index,variant,originalCorrect:true,strictFeedback:true,model:m,proof,record:restored.cases[negative.index],
     restoredModel:restored.models[negative.index],restoredRecord:restored.cases[negative.index],restoredStorage});
    await shot('corrected');
   }
   const bridge=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).map((task,index)=>({id,index,task}))).find(c=>c.task.type==='x-fracorder');
   ok(!!bridge,width+' actual associated fraction-order task exists');
   activeLabel=`${width}x${height}-isolation-${bridge.id}-${bridge.index}`;await open(bridge);
   ok(await guide.count()===0&&await hint.count()===0,activeLabel+' associated tasks do not inherit native guidance');
   await solve(bridge.task);await submit();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' associated original mathematics still works');
   ok(await hint.count()===0,activeLabel+' associated task earns no borrowed native evidence');
   await reload(bridge);ok(await hint.count()===0,activeLabel+' source isolation persists offline');await shot('checked');
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===40,'all twenty native fraction-order tasks complete at both desktop sizes');
  ok(correctionObservations.length===12,'six correction scenarios run in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,correctionObservations,offline,
   nativeTasks:20,nativeNodes:9,taskViewportPairs:observations.length,viewports,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false},null,2));
  console.log('P9_FRACTION_ORDER_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:20,nativeNodes:9,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,correctionObservations,offline,error:String(error),at:activeLabel},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
