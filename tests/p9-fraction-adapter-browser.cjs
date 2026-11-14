// Source-bound fraction evidence: all 13 native tasks at both desktop sizes.
// Only the empty lesson position is seeded; every mathematical action and
// submission below uses real controls, with the origin stopped after caching.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-fraction-adapter');
const cases=Object.entries({recutnames:[0,1,2],samenames:[0,1,2],simplestparts:[0,2],tenthtohundred:[0,2],thousandparts:[1],decimalstops:[0,1]})
 .flatMap(([id,indices])=>indices.map(index=>({id,index})));
const checks=[],errors=[],remote=[],observations=[],correctionObservations=[],offline=[];
const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {solveSteps,valid,inspect}=await import('../dist/learning/phase5/b17-model.js');
 const {replayFractionEvidence}=await import('../dist/learning/fraction-evidence.js');
 const browser=await chromium.launch({headless:true,
  ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 let server,activePage,activeLabel='setup';
 try{
  for(const [width,height] of [[1440,900],[1280,720]]){
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
   page.on('pageerror',error=>errors.push(String(error)));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const shot=name=>page.screenshot({path:path.join(out,activeLabel+'-'+name+'.png'),fullPage:true});
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);
    const closed=input.locator('xpath=ancestor::details[not(@open)]').first();
    if(await closed.count())await closed.locator(':scope > summary').click();
    if(await input.evaluate(element=>element.tagName)==='SELECT')await input.selectOption(String(value));
    else await input.fill(String(value));
   };
   const action=name=>page.locator(`[data-x="b17-${name}"]`).click();
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const rawStorage=()=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const state=window.mathLesson?.snapshot();return state?.id===id&&state.index===index&&state.view==='task';
   },spec);
   const open=async spec=>{
    // Genuine v2 constructors, no completed attempts, workpiece or history.
    // This isolates a configured native/bridge position without solving prior tasks.
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')
     ]);
     const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    await page.goto(base+'learn.html#'+spec.id);await page.reload();await wait(spec);
   };
   const solve=async(spec,{alternative=false}={})=>{
    const task=sessionTasks(spec.id)[spec.index];
    let steps=solveSteps(task);
    // Two different legitimate paths demonstrate that the verifier accepts
    // real mathematics, not one hard-coded solver event sequence.
    if(alternative&&spec.id==='simplestparts'&&spec.index===0)steps=[
     {field:'factor',value:'2'},{action:'b17-merge'},
     {field:'factor',value:'3'},{action:'b17-merge'},
     {field:'fraction',value:'3/4'},{action:'b17-remember'},
     {field:'hcf',value:'6'},{field:'reason',value:'recut'}
    ];
    if(alternative&&spec.id==='thousandparts')steps=[
     {field:'factor',value:'10'},{action:'b17-split'},
     {action:'b17-split'},{field:'fraction',value:'100/1000'},
     {action:'b17-remember'},{field:'reason',value:'recut'}
    ];
    for(const step of steps){
     if(step.action==='b17-rewind'){
      const current=(await saved(spec.id)).models[spec.index].board;
      // The old generic example starts with a no-op rewind. Do not perform
      // it in this strict trace; leave the production solver and grader intact.
      if(current.n===task.n&&current.d===task.d)continue;
     }
     if(step.field)await field(step.field,step.value);
     else await action(step.action.replace(/^b17-/,''));
    }
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
    return Promise.all(['learning/fraction-evidence.js','learning/evidence-contract.js','learning/thinking-feedback.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(item=>item.cached),width+' fraction adapter and shared dependency cached');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;
    const label=activeLabel,task=sessionTasks(spec.id)[spec.index];
    await open(spec);
    ok(await guide.isVisible(),label+' exact native optional guide works offline');
    ok(!(await guide.evaluate(element=>element.open)),label+' optional guide starts collapsed');
    ok(await hint.count()===0,label+' no evidence before mathematical actions');
    if(spec.id==='recutnames'&&spec.index===0){
     await submit();
     ok(await hint.count()===0,label+' submitting without actions cannot earn evidence');
     ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',label+' untouched work fails original grading');
     await guide.locator('summary').click();
     await page.waitForFunction(id=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id].cases[0]?.support===true,spec.id);
     ok(await guide.locator('p').isVisible(),label+' optional question can be opened');
     ok((await saved(spec.id)).cases[0].support,label+' optional support uses existing v2 field');
     await shot('01-guide-open');
    }
    await solve(spec,{alternative:true});
    ok(await hint.count()===0,label+' constructed but unsubmitted work is not evidence');
    await field('reason','top');await submit();
    ok(await hint.count()===0,label+' wrong submitted reason grants no positive feedback');
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',label+' original grader rejects wrong reason');
    await field('reason','recut');await submit();
    ok(await hint.isVisible(),label+' checked mathematical operations receive factual feedback');
    const words=await hint.innerText(),state=await saved(spec.id),model=state.models[spec.index];
    const firstStorage=await rawStorage();
    ok(words.includes(`${task.n}/${task.d}`)&&model.board.saved.every(pair=>words.includes(pair.join('/'))),label+' feedback names actual starting and saved fractions');
    ok(words.includes('细分')||words.includes('合并'),label+' feedback describes real split or merge');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!words.includes('MP.2'),label+' no unreviewed MP.2 attribution');
    ok(words.includes('不')&&(words.includes('掌握')||words.includes('解释')),label+' feedback keeps interpretation boundary visible');
    ok(model.history.some(event=>['split','merge'].includes(event.a)),label+' real operation history persisted');
    if(spec.id==='simplestparts'&&spec.index===0)ok(model.history.filter(event=>event.a==='merge').length===2,label+' two legitimate merges are accepted');
    if(spec.id==='thousandparts')ok(model.history.filter(event=>event.a==='split').length===2,label+' two legitimate splits are accepted');
    if(task.decimalStart)ok(model.history[0].a==='open-decimal'&&model.board.opened,label+' decimal opens before the actual merge');
    await shot('02-verified-offline');
    await page.reload();await wait(spec);
    ok(await hint.isVisible(),label+' current checked evidence restores after offline reload');
    const offlineStorage=await rawStorage(),restored=JSON.parse(offlineStorage).lessons[spec.id];
    ok(JSON.stringify(restored.models[spec.index])===JSON.stringify(model),label+' offline snapshot preserves the complete checked mathematical model');
    await field('reason','top');
    ok(await hint.count()===0,label+' any current edit immediately removes stale feedback');
    if(spec.id==='recutnames'&&spec.index===0)await shot('03-edited');
    await page.reload();await wait(spec);
    ok(await hint.count()===0,label+' changed work never revives old evidence on refresh');
    await submit();ok(await hint.count()===0,label+' failing latest submission cannot reuse earlier success');
    await field('reason','recut');await submit();
    ok(await hint.isVisible(),label+' rechecked current work restores evidence');
    const end=await saved(spec.id);
    const attempts=spec.id==='recutnames'&&spec.index===0?5:4;
    ok(end.cases[spec.index].attempts.length===attempts,label+' historical failed and passed attempts are retained');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' unchanged v2 mastery boundary');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal desktop overflow');
    observations.push({width,height,id:spec.id,index:spec.index,observation:words,history:model.history.map(event=>event.a),
     firstModel:model,finalModel:end.models[spec.index],offlineModel:restored.models[spec.index],
     firstRecord:state.cases[spec.index],record:end.cases[spec.index],offlineRecord:restored.cases[spec.index],
     attempts:end.cases[spec.index].attempts,proof:replayFractionEvidence(task,end.models[spec.index]),
     storageSnapshots:{first:firstStorage,offline:offlineStorage,final:await rawStorage()}});
   }

   // Failed/no-effect requests remain visible beside successful constructions.
   // They never add to the count of successful splits, merges or saved names.
   const negative={id:'recutnames',index:0};
   for(const variant of ['invalid-merge','initial-noop-rewind','duplicate-name','reset','final-failed-split']){
    activeLabel=`${width}x${height}-correction-${variant}`;
    await open(negative);
    if(variant==='invalid-merge'){await field('factor','2');await action('merge');}
    if(variant==='initial-noop-rewind')await action('rewind');
    await solve(negative);
    if(variant==='reset'){await action('reset');await solve(negative);}
    if(variant==='duplicate-name'){
     await action('remember');
     // A further genuine split/save clears the latest issue while retaining
     // the earlier duplicate request in the saved attempt history.
     await field('factor','2');await action('split');
     await field('fraction','4/12');await action('remember');
    }
    if(variant==='final-failed-split'){await field('factor','0');await action('split');}
    await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' original grader still accepts the final work');
    const lesson=await saved(negative.id),m=lesson.models[negative.index],task=sessionTasks(negative.id)[negative.index],proof=replayFractionEvidence(task,m);
    ok(valid(task,m)&&inspect(task,m).correct&&!!proof&&await hint.isVisible(),activeLabel+' correction receives evidence without removing its earlier requests');
    ok(proof.history.events.length===m.history.length,activeLabel+' every original event remains in the replay');
    if(variant==='final-failed-split')ok(m.issue!==''&&proof.history.failedRequests.at(-1).issue===m.issue,activeLabel+' latest failed request is retained and is not a successful split');
    await page.reload();await wait(negative);
    ok(await hint.isVisible()&&JSON.stringify((await saved(negative.id)).models[negative.index])===JSON.stringify(m),activeLabel+' full corrected history and evidence restore offline');
    const restoredStorage=await rawStorage(),restoredLesson=JSON.parse(restoredStorage).lessons[negative.id];
    correctionObservations.push({width,height,id:negative.id,index:negative.index,variant,model:m,proof,record:lesson.cases[negative.index],
     restoredModel:restoredLesson.models[negative.index],restoredRecord:restoredLesson.cases[negative.index],restoredStorage,originalCorrect:true,strictFeedback:true});
    await shot('corrected');
   }
   const bridge={id:'link-samenames-simplestparts',index:0};
   activeLabel=`${width}x${height}-bridge-isolation`;
   await open(bridge);
   ok(await guide.count()===0,activeLabel+' reused bridge widget receives no native guide');
   await solve(bridge);await submit();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' bridge original grading still works');
   ok(await hint.count()===0,activeLabel+' bridge cannot inherit native evidence or thinking source');
   await shot('checked');
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(correctionObservations.length===10,'five correction scenarios run in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,correctionObservations,offline,nativeTasks:cases.length,nativeNodes:6,viewports:[[1440,900],[1280,720]],originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false},null,2));
  console.log('P9_FRACTION_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes:6}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,correctionObservations,offline,error:String(error)},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
