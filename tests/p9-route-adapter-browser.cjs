// Every reviewed route is built through its real controls at two desktop sizes.
// Only empty lesson positions are seeded; the server stops before any solution.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {cases}=require('./fixtures/p9-route-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-route-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],offline=[];
const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {solveSteps,valid,inspect,answer,origin,destination}=await import('../dist/learning/phase5/b11-model.js');
 const {replayRouteEvidence}=await import('../dist/learning/route-evidence.js');
 let browser,server,activePage,label='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const [width,height] of viewports){
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
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
   page.on('pageerror',error=>errors.push(label+': '+String(error)));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const shot=async name=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,label+'-'+name+'.png'),fullPage:true});
   };
   const field=(key,value)=>page.locator(`[data-xfield="${key}"]`).fill(String(value));
   const click=name=>page.locator(`[data-x="${name}"]`).click();
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const state=window.mathLesson?.snapshot();return state?.id===id&&state.index===index&&state.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,label+' reload uses the stopped-origin cache');
   };
   const open=async spec=>{
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')
     ]);
     const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    await page.goto(base+'learn.html#'+spec.id);await reload(spec);
   };
   const act=async(spec,name)=>{
    const before=await model(spec);await click(name);const after=await model(spec),event=after.history.at(-1);
    const task=sessionTasks(spec.id)[spec.index];
    ok(after.history.length===before.history.length+1&&event?.action===name,label+' real '+name+' appends one v2 event');
    if(name==='b11-route-start'){
     ok(!before.started&&after.started&&after.first===before.guess,label+' start preserves the actual guess');
    }else if(name==='b11-hop'){
     const from=before.hops.at(-1)?.to??origin(task),hop=after.hops.at(-1);
     ok(after.hops.length===before.hops.length+1&&hop.to===from+hop.delta,label+' real landing equals departure plus nonzero displacement');
     ok(hop.delta!==0&&event.from===from&&Number(event.jump)===hop.delta&&Number(event.landing)===hop.to,label+' persisted fields match the actual movement');
    }else if(name==='b11-hop-undo'){
     ok(same(event.hop,before.hops.at(-1))&&same(after.hops,before.hops.slice(0,-1)),label+' undo removes exactly the most recent retained hop');
    }
    return after;
   };
   const steps=async(spec,list)=>{for(const step of list){if(step.field)await field(step.field,step.value);else await act(spec,step.action);}};
   const solve=spec=>steps(spec,solveSteps(sessionTasks(spec.id)[spec.index]));
   const hop=async(spec,delta)=>{
    const task=sessionTasks(spec.id)[spec.index],m=await model(spec),from=m.hops.at(-1)?.to??origin(task);
    await field('jump',delta);await field('landing',from+delta);await act(spec,'b11-hop');
   };
   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   await page.waitForFunction(async expected=>{
    if(!navigator.serviceWorker.controller)return false;
    return new Promise(resolve=>{
     const channel=new MessageChannel(),timeout=setTimeout(()=>{channel.port1.close();resolve(false);},1200);
     channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data?.cache===expected&&event.data.complete===true&&event.data.cached===event.data.total);};
     navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
    });
   },cache,{timeout:60000});
   const modules=await page.evaluate(async cache=>{
    const store=await caches.open(cache);
    return Promise.all(['learning/route-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js',
     'learning/thinking-feedback.js','learning/phase5/b11-model.js','learning/phase5/b11-view.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(modules.every(item=>item.cached),width+' all route dependencies are in the complete offline cache');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' origin stops before mathematical interaction');
   offline.push({width,height,cache,complete:true,originStopped:!server.listening,modules});
   for(const spec of cases){
    label=`${width}x${height}-${spec.id}-${spec.index}`;const task=sessionTasks(spec.id)[spec.index];await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' reviewed optional question starts collapsed');
    ok(await hint.count()===0,label+' no evidence before any operation');
    await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' mathematical question can be opened');
    if(spec===cases[0])await shot('01-guide');
    await guide.locator('summary').click();
    const blank=await saved(spec.id);
    ok(blank.models[spec.index].history.length===0&&blank.cases[spec.index].attempts.length===0,label+' opening a guide creates no mathematical history or attempt');
    await solve(spec);ok(await hint.count()===0,label+' unsubmitted correct path has no feedback');
    await field('answer','999999');await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise'&&await hint.count()===0,label+' incorrect answer does not produce evidence');
    await field('answer',answer(task));await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct'&&await hint.isVisible(),label+' current corrected path passes both gates');
    const first=await model(spec),proof=replayRouteEvidence(task,first),words=await hint.innerText();
    ok(proof&&valid(task,first)&&inspect(task,first).correct,label+' real persisted path satisfies independent replay and original grader');
    ok(proof.origin===origin(task)&&proof.target===destination(task)&&proof.answer===answer(task),label+' operation roles remain distinct');
    ok(words.includes(`从 ${proof.display.origin} 出发`)&&words.includes(`最后到达 ${proof.display.target}`),label+' feedback reports actual endpoints');
    if(task.countup)ok(words.includes(`两端的差是 ${proof.display.answer}`)&&proof.answer!==proof.target,label+' subtraction distance is not confused with the endpoint');
    if(task.compensation)ok(proof.compensation&&words.includes('净退还'),label+' compensation has a genuine overshoot and net return');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' no method label is borrowed from another source');
    ok(/自由解释.*长期掌握/.test(words),label+' bounded interpretation is explicit');
    await shot('02-verified-offline');await reload(spec);
    ok(await hint.isVisible()&&same(await model(spec),first),label+' checked path survives offline reload unchanged');
    await field('answer','999999');ok(await hint.count()===0,label+' editing immediately invalidates old feedback');
    if(spec===cases[0])await shot('03-edited');
    await reload(spec);ok(await hint.count()===0,label+' reload cannot revive stale evidence');
    await submit();ok(await hint.count()===0,label+' latest wrong submission outranks older correct work');
    await field('answer',answer(task));await submit();ok(await hint.isVisible(),label+' new correct submission restores evidence');
    await hop(spec,1);ok(await hint.count()===0,label+' actual route change invalidates feedback');
    await reload(spec);ok(await hint.count()===0,label+' unsubmitted movement remains unverified after offline refresh');
    await act(spec,'b11-hop-undo');ok(await hint.count()===0,label+' same endpoint with extra history still requires a fresh check');
    await submit();ok(await hint.isVisible(),label+' valid exact undo is accepted after rechecking');
    const end=await saved(spec.id),m=end.models[spec.index],attempts=end.cases[spec.index].attempts;
    ok(attempts.length===5&&attempts.every(a=>a.id&&a.at&&a.value&&typeof a.supported==='boolean'&&typeof a.exposed==='boolean'),label+' all original v2 attempts and metadata remain');
    ok(same(m.hops,first.hops)&&m.history.length===first.history.length+2,label+' final retained route and full undo history agree');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no score or mastery field is introduced');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,task,observation:words,
     finalObservation:await hint.innerText(),model:m,attempts,proof:replayRouteEvidence(task,m)});
   }
   // These histories are produced by actual controls. Later correct final work
   // must not erase an invalid landing or turn a backwards-first path into compensation.
   for(const variant of ['invalid-landing','false-compensation']){
    const spec={id:'addhundred',index:variant==='invalid-landing'?0:2},task=sessionTasks(spec.id)[spec.index];
    label=`${width}x${height}-negative-${variant}`;await open(spec);
    await field('guess','0');await act(spec,'b11-route-start');
    if(variant==='invalid-landing'){
     await field('jump','1');await field('landing',task.a+2);await click('b11-hop');
     ok(!!(await model(spec)).issue&&(await model(spec)).hops.length===0,label+' actual invalid landing is rejected');
     await steps(spec,solveSteps(task).slice(2));
    }else{await hop(spec,-1);await hop(spec,task.b+1);await field('answer',answer(task));}
    await submit();const m=await model(spec);
    ok(valid(task,m)&&inspect(task,m).correct&&await page.locator('#check-feedback').getAttribute('data-state')==='correct',label+' original final-work grading is preserved');
    ok(!replayRouteEvidence(task,m)&&await hint.count()===0,label+' insufficient process does not receive strict feedback');
    await reload(spec);ok(await hint.count()===0,label+' evidence exclusion survives offline refresh');
    negatives.push({width,height,variant,model:m,originalCorrect:true,strictFeedback:false});await shot('rejected');
   }
   for(const spec of [{id:'link-bridge20-addhundred',index:1},{id:'link-flexhundred-showwhy',index:1}]){
    label=`${width}x${height}-isolation-${spec.id}-${spec.index}`;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,label+' associated work has no native guide');
    await solve(spec);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct'&&await hint.count()===0,label+' associated original task works without native feedback');
    await reload(spec);ok(await hint.count()===0,label+' associated isolation survives offline reload');
   }
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===cases.length*viewports.length,'all 15 native tasks complete at both desktop sizes');
  const result={checks,errors,remote,observations,negatives,offline,nativeTasks:cases.length,
   nativeNodes:new Set(cases.map(c=>c.nodeId)).size,taskViewportPairs:observations.length,viewports,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log('P9_ROUTE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes:result.nativeNodes,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,offline,error:String(error),at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
