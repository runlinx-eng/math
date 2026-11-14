// All 29 native group tasks use actual controls at both desktop sizes. Only an
// empty lesson position is seeded; the origin stops before mathematical work.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const reviewed=require('./fixtures/p9-groups-cases.cjs');
const cases=reviewed.map(c=>({...c,id:c.sessionId}));
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-groups-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],correctionObservations=[],notationObservations=[],offline=[];
const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks,BRIDGES}=await import('../dist/learning/bridges.js');
 const groups=await import('../dist/learning/phase5/b13-model.js');
 const {replayGroupsEvidence}=await import('../dist/learning/groups-evidence.js');
 let browser,server,activePage,activeLabel='setup';
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
   page.on('pageerror',error=>errors.push(activeLabel+': '+String(error)));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const shot=async name=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,activeLabel+'-'+name+'.png'),fullPage:true});
   };
   const visible=async locator=>{
    const closed=locator.locator('xpath=ancestor::details[not(@open)]').first();
    if(await closed.count())await closed.locator(':scope > summary').click();
    // Scroll the real viewport; do not force a click through another control.
    await locator.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
   };
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);await visible(input);
    if(await input.evaluate(element=>element.tagName)==='SELECT')await input.selectOption(String(value));
    else await input.fill(String(value));
   };
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const button=page.locator(`[data-x="b13-${name}"]${suffix}`);
    await visible(button);await button.click();
   };
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const rawStorage=()=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const state=window.mathLesson?.snapshot();return state?.id===id&&state.index===index&&state.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' document reload uses the stopped-origin Service Worker');
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
   const answers=async task=>{
    for(const step of groups.solveSteps(task))
     if(step.field&&['answer','equation','addition','rest'].includes(step.field))await field(step.field,step.value);
   };
   const originalSolve=async spec=>{
    for(const step of groups.solveSteps(sessionTasks(spec.id)[spec.index]))
     if(step.field)await field(step.field,step.value);else await action(step.action.replace(/^b13-/,''),step.data);
   };
   const mathematicalAction=async(spec,name,data={})=>{
    const before=await model(spec),task=sessionTasks(spec.id)[spec.index];
    await action(name,data);const after=await model(spec),b=after.board;
    ok(after.history.length===before.history.length+1&&after.history.at(-1).action==='b13-'+name,
     activeLabel+' '+name+' records exactly one original-format event');
    ok(b.homes.every(home=>Number.isInteger(home)&&home>=-1&&home<b.buckets),activeLabel+' every object has one valid location');
    const counts=Array.from({length:b.buckets},(_,i)=>b.homes.filter(home=>home===i).length);
    const rest=b.homes.filter(home=>home===-1).length;
    ok(counts.reduce((n,x)=>n+x,rest)===b.homes.length,activeLabel+' group counts plus table remainder conserve all identities');
    if(task.mode!=='build')ok(b.homes.length===task.total,activeLabel+' division never adds or loses an object');
    else if(name!=='pour')ok(b.homes.length===before.board.homes.length,activeLabel+' only a real build pour can introduce objects');
    ok(await page.locator('[data-b13-token]').count()===b.homes.length,activeLabel+' displayed object count matches the recorded identities');
    return after;
   };
   const roundTrip=async spec=>{
    const before=await model(spec),token=before.board.homes.findIndex(home=>home>=0);
    if(token<0){
     await mathematicalAction(spec,'plate-add');await mathematicalAction(spec,'plate-remove');
     return;
    }
    const home=before.board.homes[token];
    await mathematicalAction(spec,'token',{token});
    await mathematicalAction(spec,'drop',{bucket:-1});
    ok((await model(spec)).board.homes[token]===-1,activeLabel+' the same selected object returns to the table');
    await mathematicalAction(spec,'token',{token});
    await mathematicalAction(spec,'pour',{bucket:home});
    ok(JSON.stringify((await model(spec)).board)===JSON.stringify(before.board),activeLabel+' returning an object restores exactly the same grouping');
   };
   const alternativeSolve=async spec=>{
    const task=sessionTasks(spec.id)[spec.index];
    if(task.mode!=='share'){
     await mathematicalAction(spec,'plate-add');await mathematicalAction(spec,'plate-remove');
     for(let i=0;i<task.a;i++)await mathematicalAction(spec,'plate-add');
    }
    if(task.mode==='share')for(let i=0;i<task.b;i++)await mathematicalAction(spec,'round');
    else if(task.b){
     await field('amount',task.b);
     for(let bucket=task.a-1;bucket>=0;bucket--)await mathematicalAction(spec,'pour',{bucket});
    }
    await roundTrip(spec);await answers(task);
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
   ok(ready,width+' complete current offline cache');
   const cachedModules=await page.evaluate(async cache=>{
    const store=await caches.open(cache);
    return Promise.all(['learning/groups-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js',
     'learning/thinking-feedback.js','learning/phase5/b13-model.js','learning/phase5/b13-view.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(item=>item.cached),width+' grouping adapter and original runtime dependencies are cached');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' HTTP origin stops before all mathematical operations');
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;
    const task=sessionTasks(spec.id)[spec.index];await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),activeLabel+' optional source-bound guide starts collapsed');
    ok(await hint.count()===0,activeLabel+' no evidence before actual work');
    await guide.locator('summary').click();
    await page.waitForFunction(({id,index})=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id].cases[index]?.support===true,spec);
    ok(await guide.locator('p').isVisible(),activeLabel+' guide opens and retains the existing support flag');
    await guide.locator('summary').click();
    const empty=await saved(spec.id);
    ok(empty.models[spec.index].history.length===0&&empty.cases[spec.index].attempts.length===0,activeLabel+' optional guidance manufactures no mathematical event or submission');
    await alternativeSolve(spec);
    const constructed=await model(spec),firstProof=replayGroupsEvidence(task,constructed);
    ok(!!firstProof,activeLabel+' actual alternative distribution passes independent replay before submission');
    ok(firstProof.groups===spec.groups&&firstProof.each===spec.each&&firstProof.total===spec.total,
     activeLabel+' reviewed group count, each amount and total agree');
    ok(await page.locator('.b13-plate').count()===spec.groups,activeLabel+' visible containers match the true number of groups');
    const roleLabel=await page.locator('[data-xfield="answer"]').locator('xpath=ancestor::label').innerText();
    ok(roleLabel.includes(task.mode==='build'?'全部':task.mode==='share'?'每份':'几份'),activeLabel+' answer control asks the correct mathematical role');
    ok(await hint.count()===0,activeLabel+' unsubmitted correct grouping receives no verified feedback');
    await field('answer','999');await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise'&&await hint.count()===0,
     activeLabel+' wrong answer preserves original correction feedback and gives no evidence');
    await field('answer',firstProof.result);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct'&&await hint.isVisible(),
     activeLabel+' new correct submission receives bounded grouping feedback');
    const first=await model(spec),words=await hint.innerText();
    const firstStorage=await rawStorage(),firstRecord=(await saved(spec.id)).cases[spec.index];
    ok(groups.valid(task,first)&&groups.inspect(task,first).correct&&!!replayGroupsEvidence(task,first),
     activeLabel+' saved real actions satisfy both original grading and strict mathematics');
    ok(words.includes(String(spec.total))&&words.includes(String(spec.groups)),activeLabel+' factual feedback includes the actual total and grouping');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),activeLabel+' no MP label is borrowed from another task');
    await shot('verified-offline');await reload(spec);
    ok(await hint.isVisible()&&JSON.stringify(await model(spec))===JSON.stringify(first),activeLabel+' offline refresh restores the exact checked work');
    const offlineStorage=await rawStorage(),restored=JSON.parse(offlineStorage).lessons[spec.id];
    await field('answer','999');ok(await hint.count()===0,activeLabel+' editing immediately invalidates old feedback');
    await reload(spec);ok(await hint.count()===0,activeLabel+' edited pending work stays unverified after offline refresh');
    await submit();ok(await hint.count()===0,activeLabel+' latest failed submission cannot reuse an earlier success');
    await field('answer',firstProof.result);await submit();ok(await hint.isVisible(),activeLabel+' a new valid check restores feedback');
    await roundTrip(spec);
    ok(await hint.count()===0,activeLabel+' a new real operation needs a fresh check even after restoring the same board');
    await reload(spec);ok(await hint.count()===0,activeLabel+' unsubmitted changed history remains unverified offline');
    await submit();ok(await hint.isVisible(),activeLabel+' rechecking verifies the complete new history');
    const end=await saved(spec.id),m=end.models[spec.index],attempts=end.cases[spec.index].attempts,proof=replayGroupsEvidence(task,m);
    ok(attempts.length===5,activeLabel+' all five failed and successful attempts are retained');
    ok(attempts.every(attempt=>attempt.id&&attempt.at&&attempt.value&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean'),
     activeLabel+' original v2 submission metadata and snapshots remain intact');
    ok(JSON.stringify(attempts.at(-1).value)===JSON.stringify(m)&&!!proof,activeLabel+' latest complete submission snapshot matches the entire checked model');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),activeLabel+' no additional score or mastery state');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),activeLabel+' no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,mode:spec.mode,
     total:proof.total,groups:proof.groups,each:proof.each,remainder:proof.remainder,result:proof.result,resultRole:proof.resultRole,
     created:proof.created,moved:proof.moved,rounds:proof.rounds,observation:words,finalObservation:await hint.innerText(),
     firstModel:first,finalModel:m,attempts,proof,offlineModel:restored.models[spec.index],firstRecord,record:end.cases[spec.index],
     offlineRecord:restored.cases[spec.index],storageSnapshots:{first:firstStorage,offline:offlineStorage,final:await rawStorage()}});
   }

   const negative={id:'sharegroups',index:0},task=sessionTasks(negative.id)[negative.index];
   for(const variant of ['zero-pour','empty-pool-round','same-destination','reset','final-failed-pour']){
    activeLabel=`${width}x${height}-correction-${variant}`;await open(negative);await originalSolve(negative);
    if(variant==='zero-pour'){
     await field('amount','0');await action('pour',{bucket:0});await action('token',{token:0});
    }else if(variant==='empty-pool-round'){
     await action('round');await action('token',{token:0});
    }else if(variant==='same-destination'){
     await action('token',{token:0});await action('pour',{bucket:0});
    }else if(variant==='reset'){await action('reset');await originalSolve(negative);}
    else{await field('amount','0');await action('pour',{bucket:0});}
    await submit();const m=await model(negative);
    ok(groups.valid(task,m)&&groups.inspect(task,m).correct,activeLabel+' existing final-result grading is unchanged');
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' original UI still accepts its correct final work');
    const proof=replayGroupsEvidence(task,m);
    ok(!!proof&&proof.history.events.length===m.history.length&&await hint.isVisible(),activeLabel+' strict evidence preserves the attempts without claiming failed distribution');
    if(variant==='final-failed-pour')ok(m.issue!==''&&proof.history.failedRequests.at(-1).issue===m.issue,activeLabel+' the current failed pour retains its exact issue');
    await reload(negative);ok(await hint.isVisible()&&JSON.stringify(await model(negative))===JSON.stringify(m),activeLabel+' full correction history and evidence restore offline');
    const restoredStorage=await rawStorage(),restored=JSON.parse(restoredStorage).lessons[negative.id];
    correctionObservations.push({width,height,id:negative.id,index:negative.index,variant,model:m,proof,record:restored.cases[negative.index],
     restoredModel:restored.models[negative.index],restoredRecord:restored.cases[negative.index],restoredStorage,originalCorrect:true,strictFeedback:true});
    await shot('corrected');
   }

   activeLabel=`${width}x${height}-separated-digits`;await open(negative);await originalSolve(negative);
   await field('equation','1 0 ÷ 2 = 5');await submit();
   const separated=await model(negative),separatedRecord=await saved(negative.id);
   ok(groups.valid(task,separated)&&groups.inspect(task,separated).correct,
    activeLabel+' original grading remains unchanged for its whitespace-tolerant equation');
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct'&&
    !replayGroupsEvidence(task,separated)&&await hint.count()===0,
    activeLabel+' strict evidence does not silently join separated digits into ten');
   await reload(negative);ok(await hint.count()===0,activeLabel+' ambiguous submitted notation stays unverified offline');
   await shot('rejected');await field('equation','10 ÷ 2 = 5');
   ok(!!replayGroupsEvidence(task,await model(negative))&&await hint.count()===0,
    activeLabel+' ordinary operator spacing is valid but changed notation needs a fresh check');
   await submit();const corrected=await model(negative),correctedRecord=await saved(negative.id);
   ok(await hint.isVisible()&&groups.inspect(task,corrected).correct,
    activeLabel+' the explicit current corrected integer equation receives evidence');
   const notationAttempts=correctedRecord.cases[negative.index].attempts;
   ok(notationAttempts.length===2&&JSON.stringify(notationAttempts[0])===JSON.stringify(separatedRecord.cases[negative.index].attempts[0])&&
    JSON.stringify(notationAttempts[0].value)===JSON.stringify(separated)&&JSON.stringify(notationAttempts[1].value)===JSON.stringify(corrected),
    activeLabel+' original and corrected complete submissions both remain intact');
   await reload(negative);ok(await hint.isVisible()&&JSON.stringify(await model(negative))===JSON.stringify(corrected),
    activeLabel+' freshly checked corrected notation restores offline');await shot('corrected');
   notationObservations.push({width,height,id:negative.id,index:negative.index,separated,corrected,attempts:notationAttempts});

   const bridge=Object.keys(BRIDGES).flatMap(id=>(sessionTasks(id)||[]).map((task,index)=>({id,index,task}))).find(c=>c.task.type==='x-mulgroups');
   ok(!!bridge,width+' a real associated grouping task is available for source isolation');
   activeLabel=`${width}x${height}-associated-${bridge.id}-${bridge.index}`;await open(bridge);
   ok(await guide.count()===0&&await hint.count()===0,activeLabel+' associated task inherits neither guide nor evidence');
   await originalSolve(bridge);await submit();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' associated original task remains usable');
   ok(await hint.count()===0,activeLabel+' correct associated work cannot borrow native evidence');
   await reload(bridge);ok(await hint.count()===0,activeLabel+' associated isolation persists offline');await shot('checked');
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===58,'all 29 native tasks finish at both desktop sizes');
  ok(notationObservations.length===2,'separated-digit rejection and explicitly rechecked correction run in both viewports');
  const nativeNodes=new Set(cases.map(c=>c.nodeId)).size;
  ok(correctionObservations.length===10,'five correction scenarios run in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,correctionObservations,notationObservations,offline,
   nativeTasks:cases.length,nativeNodes,taskViewportPairs:observations.length,viewports,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false},null,2));
  console.log('P9_GROUPS_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,correctionObservations,notationObservations,offline,error:String(error),at:activeLabel},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
