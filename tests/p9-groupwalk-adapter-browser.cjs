// Six reviewed grouped fraction walks, both desktop sizes, all mathematical
// controls and checks offline after a complete cache and stopped HTTP origin.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-groupwalk-adapter');
const cases=['manycopies','repeatfraction'].flatMap(id=>[0,1,2].map(index=>({id,index})));
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],correctionObservations=[],offline=[];
const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {solveSteps,valid,inspect}=await import('../dist/learning/phase5/b16-model.js');
 const {replayGroupwalkEvidence}=await import('../dist/learning/groupwalk-evidence.js');
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
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide'),axis=page.locator('.b16-axis');
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
   const action=name=>page.locator(`[data-x="b16-${name}"]`).click();
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const rawStorage=()=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const state=window.mathLesson?.snapshot();return state?.id===id&&state.index===index&&state.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' document reload comes from the stopped-origin SW');
   };
   const navigate=async spec=>{await page.goto(base+'learn.html#'+spec.id);await reload(spec);};
   const open=async spec=>{
    // Only an empty original v2 lesson/index is seeded. Never inject a solved
    // board, event history, answer or successful submission into page storage.
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')
     ]);
     const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    await navigate(spec);
   };
   const answers=async task=>{
    for(const step of solveSteps(task))if(step.field&&step.field!=='parts')await field(step.field,step.value);
   };
   const solveOriginal=async spec=>{
    for(const step of solveSteps(sessionTasks(spec.id)[spec.index])){
     if(step.field)await field(step.field,step.value);else await action(step.action.replace(/^b16-/,''));
    }
   };
   const position=async(spec,n)=>{
    const task=sessionTasks(spec.id)[spec.index],m=await model(spec);
    ok(m.board.parts===task.d&&m.board.steps.length===n,activeLabel+' exact current position '+n+'/'+task.d);
    ok(m.board.steps.every((value,index)=>value===index+1),activeLabel+' all retained small-unit positions remain consecutive');
    ok((await axis.getAttribute('aria-label')).includes(`每一整个分${task.d}段，已走${n}步`),activeLabel+' displayed position uses the true small-unit scale');
    const max=Math.max(1,Math.ceil(task.n/task.d),task.axisMax||1,Math.ceil(n/task.d));
    const cx=Number(await axis.locator('circle').getAttribute('cx'));
    ok(Math.abs(cx-(30+(n/task.d)/max*580))<1e-9,activeLabel+' plotted marker matches '+n+'/'+task.d);
   };
   const move=async(spec,name,n)=>{
    const before=await model(spec),task=sessionTasks(spec.id)[spec.index];
    await action(name);await position(spec,n);const after=await model(spec);
    const delta=name==='walk'?task.chunk:-1;
    ok(n-before.board.steps.length===delta,activeLabel+' actual '+name+' changes '+delta+' small units');
    ok(after.history.length===before.history.length+1&&after.history.at(-1).action===name,activeLabel+' move preserves one real original-format event');
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
    return Promise.all(['learning/groupwalk-evidence.js','learning/unitwalk-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/phase5/b16-model.js','learning/phase5/b15-model.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(item=>item.cached),width+' both walk adapters and their runtime dependencies are cached');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' HTTP origin is stopped before all mathematical actions');
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;
    const task=sessionTasks(spec.id)[spec.index],groups=task.n/task.chunk;await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),activeLabel+' optional grouped guide starts collapsed');
    ok(await hint.count()===0,activeLabel+' no evidence before actual actions and submission');
    await guide.locator('summary').click();
    await page.waitForFunction(({id,index})=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id].cases[index]?.support===true,spec);
    ok(await guide.locator('p').isVisible(),activeLabel+' optional question opens and records existing support flag');
    if(spec.id==='manycopies'&&spec.index===0)await shot('01-guide-open');
    await guide.locator('summary').click();
    ok(!(await guide.evaluate(element=>element.open)),activeLabel+' optional question closes');
    const initial=await saved(spec.id);
    ok(initial.models[spec.index].history.length===0&&initial.cases[spec.index].attempts.length===0,activeLabel+' guide interaction creates no mathematical event or check');

    await field('parts',task.d);await action('partition');await position(spec,0);
    await move(spec,'walk',task.chunk);
    for(let n=task.chunk-1;n>=0;n--)await move(spec,'walk-back',n);
    for(let i=1;i<=groups+1;i++)await move(spec,'walk',i*task.chunk);
    // In repeatfraction[1], the original pre-move guard allows 21 -> 28 even
    // though 24 is its threshold. Every retreat still removes only one unit.
    if(spec.id==='repeatfraction'&&spec.index===1){
     ok((await model(spec)).board.steps.length===28,activeLabel+' legitimate grouped step crosses the pre-move limit to 28/3');
     await shot('02-legitimate-crossing');
    }
    for(let n=task.n+task.chunk-1;n>=task.n;n--)await move(spec,'walk-back',n);
    await answers(task);ok(await hint.count()===0,activeLabel+' unsubmitted grouped work has no verified feedback');
    await field('equation','1=1');await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',activeLabel+' a bare true equality does not satisfy original group multiplication');
    ok(await hint.count()===0,activeLabel+' incorrect group equation grants no evidence');
    await field('equation',`${groups}*(${task.chunk}/${task.d})=${task.n}/${task.d}`);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' commuted multiplication factors pass original grading');
    ok(await hint.isVisible(),activeLabel+' actual grouped route receives bounded evidence');
    const words=await hint.innerText(),first=await model(spec),proof=replayGroupwalkEvidence(task,first);
    const firstStorage=await rawStorage(),firstRecord=(await saved(spec.id)).cases[spec.index];
    ok(!!proof&&valid(task,first)&&inspect(task,first).correct,activeLabel+' saved work passes strict and original mathematics');
    ok(words.includes(`整组前进 ${groups+2} 次`)&&words.includes(`退回 ${2*task.chunk} 小份`),activeLabel+' feedback separates actual grouped advances from single-unit retreats');
    ok(words.includes(`共 ${groups} 组`)&&words.includes(`${task.n}/${task.d}`),activeLabel+' task group count and final position are checked independently');
    ok(proof.advances*task.chunk-proof.retreats===task.n,activeLabel+' net displacement uses the true asymmetric controls');
    if(task.buy)ok(words.includes(`至少需要 ${Math.ceil(task.n/task.d)} 个`),activeLabel+' minimum whole purchase is distinguished from consumed fraction');
    if(task.bounds)ok(words.includes(`整数 ${Math.floor(task.n/task.d)} 和 ${Math.ceil(task.n/task.d)}`),activeLabel+' adjacent integers remain checked');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),activeLabel+' grouped arithmetic receives no borrowed MP label');
    await shot('03-verified-offline');await reload(spec);
    ok(await hint.isVisible()&&JSON.stringify(await model(spec))===JSON.stringify(first),activeLabel+' offline reload restores exactly the checked work');
    const offlineStorage=await rawStorage(),restored=JSON.parse(offlineStorage).lessons[spec.id];
    await field('answer','999');ok(await hint.count()===0,activeLabel+' editing the answer immediately invalidates old evidence');
    if(spec.id==='manycopies'&&spec.index===0)await shot('04-edited');
    await reload(spec);ok(await hint.count()===0,activeLabel+' stale evidence stays absent after offline refresh');
    await submit();ok(await hint.count()===0,activeLabel+' latest failed check cannot reuse an earlier success');
    await field('answer',`${task.n}/${task.d}`);await submit();ok(await hint.isVisible(),activeLabel+' a new correct check restores evidence');
    await move(spec,'walk',task.n+task.chunk);
    ok(await hint.count()===0,activeLabel+' actual grouped movement invalidates the previous checked position');
    await reload(spec);ok(await hint.count()===0,activeLabel+' unsubmitted new position survives refresh without feedback');
    for(let n=task.n+task.chunk-1;n>=task.n;n--)await move(spec,'walk-back',n);
    ok(await hint.count()===0,activeLabel+' returning to the endpoint with new history requires another check');
    await submit();ok(await hint.isVisible(),activeLabel+' fresh check verifies the entire new route');
    const end=await saved(spec.id),m=end.models[spec.index],attempts=end.cases[spec.index].attempts;
    ok(attempts.length===5,activeLabel+' failed and successful attempts are retained');
    ok(attempts.every(attempt=>attempt.id&&attempt.at&&attempt.value&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean'),activeLabel+' original v2 submission fields remain');
    const finalProof=replayGroupwalkEvidence(task,m);
    ok(finalProof?.advances===groups+3&&finalProof.retreats===3*task.chunk&&finalProof.groups===groups,activeLabel+' new route changes operation counts but not the required net groups');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),activeLabel+' no score or mastery fields are created');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),activeLabel+' no desktop horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,n:task.n,d:task.d,chunk:task.chunk,groups,
     advances:finalProof.advances,retreats:finalProof.retreats,observation:words,finalObservation:await hint.innerText(),
     history:m.history.map(event=>event.action),board:m.board,attempts:attempts.length,attemptRecords:attempts,
     firstModel:first,finalModel:m,offlineModel:restored.models[spec.index],firstRecord,record:end.cases[spec.index],
     offlineRecord:restored.cases[spec.index],proof:finalProof,
     storageSnapshots:{first:firstStorage,offline:offlineStorage,final:await rawStorage()}});
   }

   const negative={id:'repeatfraction',index:1},task=sessionTasks(negative.id)[negative.index];
   for(const variant of ['zero-back','repeat-partition','reset','wrong-scale','changed-input','upper-noop','rounded-equation','failed-partition','final-failed-partition']){
    activeLabel=`${width}x${height}-negative-${variant}`;await open(negative);
    if(variant==='failed-partition'){await field('parts','0');await action('partition');}
    if(variant==='zero-back')await action('walk-back');
    if(variant==='repeat-partition'){await field('parts',task.d);await action('partition');}
    if(variant==='reset'){
     await field('parts',task.d);await action('partition');await action('walk');await action('reset');
    }
    if(variant==='wrong-scale'){await field('parts','2');await action('partition');await action('walk');}
    if(variant==='upper-noop'){
     await field('parts',task.d);await action('partition');
     for(let i=0;i<5;i++)await action('walk');
     ok((await model(negative)).board.steps.length===28,activeLabel+' fifth group advance has no mathematical effect');
     for(let i=0;i<7;i++)await action('walk-back');await answers(task);
    }else if(variant==='changed-input'){
     await field('parts',task.d);await action('partition');await field('parts','2');await action('walk');
     await field('parts',task.d);await action('walk');await action('walk');await answers(task);
    }else await solveOriginal(negative);
    if(variant==='rounded-equation')await field('equation','(7.0000000000000001/3)*3=21/3');
    if(variant==='final-failed-partition'){await field('parts','0');await action('partition');await field('parts',task.d);}
    await submit();const m=await model(negative);
    ok(valid(task,m)&&inspect(task,m).correct,activeLabel+' original final-work grading is unchanged');
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' original UI accepts the final result');
    const proof=replayGroupwalkEvidence(task,m);
    if(variant==='rounded-equation'){
     ok(await hint.count()===0&&!proof,activeLabel+' an inexact equation still cannot earn an exact multiplication claim');
     await reload(negative);ok(await hint.count()===0,activeLabel+' inexact current evidence remains excluded offline');
     const restoredStorage=await rawStorage(),restored=JSON.parse(restoredStorage).lessons[negative.id];
     negativeObservations.push({width,height,id:negative.id,index:negative.index,variant,model:m,record:restored.cases[negative.index],
      restoredModel:restored.models[negative.index],restoredRecord:restored.cases[negative.index],restoredStorage,originalCorrect:true,strictFeedback:false});await shot('rejected');
    }else{
     ok(!!proof&&proof.history.events.length===m.history.length&&await hint.isVisible(),activeLabel+' every visible request is retained in its actual unit and epoch');
     if(variant==='final-failed-partition')ok(m.issue!==''&&proof.history.failedRequests.at(-1).issue===m.issue,activeLabel+' final failed request is not silently cleared');
     await reload(negative);ok(await hint.isVisible()&&JSON.stringify(await model(negative))===JSON.stringify(m),activeLabel+' recorded correction and evidence restore offline');
     const restoredStorage=await rawStorage(),restored=JSON.parse(restoredStorage).lessons[negative.id];
     correctionObservations.push({width,height,id:negative.id,index:negative.index,variant,model:m,proof,record:restored.cases[negative.index],
      restoredModel:restored.models[negative.index],restoredRecord:restored.cases[negative.index],restoredStorage,originalCorrect:true,strictFeedback:true});await shot('corrected');
    }
   }

   // A shared widget may have two reviewed mathematical contracts, but a real
   // task receives exactly its own guide and evidence without source leakage.
   const source={id:'manycopies',index:0},fixed={id:'lineplaces',index:0};
   activeLabel=`${width}x${height}-cross-contract-source`;await open(source);await solveOriginal(source);await submit();
   ok((await hint.innerText()).includes('整组前进'),activeLabel+' reviewed grouped source has its own feedback');
   const sourceWork=JSON.stringify(await model(source));
   activeLabel=`${width}x${height}-cross-contract-fixed`;await navigate(fixed);
   ok((await guide.innerText()).includes('每一小步表示多少')&&await hint.count()===0,activeLabel+' fixed-unit course keeps its existing independent guide');
   await solveOriginal(fixed);await submit();
   ok(await hint.isVisible()&&!(await hint.innerText()).includes('整组前进'),activeLabel+' fixed-unit task does not inherit grouped semantics');
   activeLabel=`${width}x${height}-cross-contract-return`;await navigate(source);
   ok(JSON.stringify(await model(source))===sourceWork&&(await hint.innerText()).includes('整组前进'),activeLabel+' returning restores only the matching grouped evidence');
   for(const spec of [{id:'wholefractions',index:0},{id:'link-repeatfraction-sharewholes',index:0}]){
    activeLabel=`${width}x${height}-isolation-${spec.id}-${spec.index}`;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,activeLabel+' unreviewed and associated tasks receive no group guide');
    await solveOriginal(spec);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' excluded original mathematics remains usable');
    ok(await hint.count()===0,activeLabel+' passing does not grant borrowed grouped evidence');
    await reload(spec);ok(await hint.count()===0,activeLabel+' source isolation persists offline');await shot('checked');
   }
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===12,'all six grouped native tasks complete at both desktop sizes');
  ok(correctionObservations.length===16&&negativeObservations.length===2,'eight correction scenarios and the exact-notation rejection run in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,correctionObservations,offline,
   nativeTasks:cases.length,nativeNodes:2,taskViewportPairs:observations.length,viewports,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false},null,2));
  console.log('P9_GROUPWALK_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes:2,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,correctionObservations,offline,error:String(error),at:activeLabel},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
