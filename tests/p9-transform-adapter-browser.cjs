// Each native transformation is made with real controls at two desktop sizes.
// Only empty lesson positions are seeded. All mathematics runs after the HTTP
// origin stops; full models and v2 attempt snapshots accompany screenshots.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {cases}=require('./fixtures/p9-transform-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-transform-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],explorations=[],offline=[];
const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b24-model.js');
 const {replayTransformEvidence}=await import('../dist/learning/transform-evidence.js');
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
   // Completing a B24 transformation folds its controls; edits use the visible
   // summary to reopen them. Select controls are never filled as text inputs.
   const reveal=async control=>{
    const details=control.locator('xpath=ancestor::details[1]');
    if(await details.count()&&!(await details.evaluate(e=>e.open)))await details.locator(':scope > summary').click();
   };
   const field=async(key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);await reveal(control);
    if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));
    else await control.fill(String(value));
   };
   const click=async name=>{const control=page.locator(`[data-x="${name}"]`);await reveal(control);await control.click();};
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
    ok(after.history.length===before.history.length+1&&event?.a===name.replace(/^p24-/,''),label+' real '+name+' appends exactly one event');
    ok(same(event.d,{}),label+' transform event has no cross-widget data');
    if(name==='p24-predict'){
     ok(!before.board.prediction&&same(after.board.prediction,{x:before.predX,y:before.predY}),label+' prediction preserves the actual typed values');
    }else if(name==='p24-operate'){
     ok(same(event.f,Object.fromEntries(['dx','dy','axis','angle','cx','cy','factor'].map(k=>[k,before[k]]))),label+' operation captures the actual parameter fields');
    }else if(name==='p24-measure'){
     ok(!!before.board.image&&after.board.measured&&same(before.board.image,after.board.image),label+' measurement requests a readout of the existing image');
    }
    return after;
   };
   const steps=async(spec,list)=>{for(const step of list){if(step.field)await field(step.field,step.value);else await act(spec,step.action);}};
   const solve=spec=>steps(spec,M.solveSteps(sessionTasks(spec.id)[spec.index]));
   const operate=async(spec,op)=>{
    if(op.kind==='move'){await field('dx',op.dx);await field('dy',op.dy);}
    if(op.kind==='mirror')await field('axis',op.line);
    if(op.kind==='turn'){await field('angle',op.angle);await field('cx',op.center[0]);await field('cy',op.center[1]);}
    if(op.kind==='scale'){await field('factor',op.factor);await field('cx',op.center[0]);await field('cy',op.center[1]);}
    return act(spec,'p24-operate');
   };
   const finish=async spec=>{
    const task=sessionTasks(spec.id)[spec.index];
    if(task.needsMeasure)await act(spec,'p24-measure');
    for(const [i,q]of task.questions.entries())await field('answers.'+i,q.value);
   };
   const wrongAnswer=task=>task.questions[0].options?task.questions[0].options.find(o=>o[0]!==task.questions[0].value)[0]:'999999';
   const alternative=task=>({move:{kind:'move',dx:1,dy:1},mirror:{kind:'mirror',line:'y=-x'},
    turn:{kind:'turn',angle:-90,center:[0,0]},scale:{kind:'scale',factor:'3/2',center:[0,0]}}[task.goal.kind]);
   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let ready=false;
   // Await the resolved MessageChannel reply explicitly. A rendered shell or
   // an unresolved Promise must not allow the origin to stop before precaching.
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
   const modules=await page.evaluate(async cache=>{
    const store=await caches.open(cache);
    return Promise.all(['learning/transform-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js',
     'learning/thinking-feedback.js','learning/phase5/b24-model.js','learning/phase5/b24-view.js','learning/phase5/b24-geometry.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const missing=modules.filter(item=>!item.cached).map(item=>item.name);
   const offlineCheck={width,height,cache,complete:ready,originStopped:false,modules,missing};offline.push(offlineCheck);
   ok(ready,width+' current complete offline cache; missing modules: '+JSON.stringify(missing));
   ok(!missing.length,width+' all transform dependencies are in the complete offline cache; missing: '+JSON.stringify(missing));
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   offlineCheck.originStopped=!server.listening;
   ok(offlineCheck.originStopped,width+' origin stops before mathematical interaction');
   for(const spec of cases){
    label=`${width}x${height}-${spec.id}-${spec.index}`;const task=sessionTasks(spec.id)[spec.index];await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' reviewed optional question starts collapsed');
    ok(await hint.count()===0,label+' no evidence exists before actual operations');
    await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),label+' mathematical question opens');
    if(spec===cases[0])await shot('01-guide');await guide.locator('summary').click();
    const blank=await saved(spec.id);
    ok(blank.models[spec.index].history.length===0&&blank.cases[spec.index].attempts.length===0,label+' guide does not create events or submissions');
    await solve(spec);await field('prose','我想再比较另一次变换。');
    ok(await hint.count()===0,label+' correct unsubmitted work has no strict feedback');
    await field('answers.0',wrongAnswer(task));await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise'&&await hint.count()===0,label+' incorrect answer does not produce strict feedback');
    await field('answers.0',task.questions[0].value);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct'&&await hint.isVisible(),label+' the latest correct submission passes both gates');
    const first=await model(spec),proof=replayTransformEvidence(task,first),words=await hint.innerText();
    ok(proof&&M.valid(task,first)&&M.inspect(task,first).correct,label+' real persisted work passes independent geometry and the original grader');
    ok(words.includes(proof.display.operation)&&words.includes(proof.display.sourcePoints[0])&&words.includes(proof.display.imagePoints[0]),label+' feedback names actual parameters and corresponding coordinates');
    ok(proof.operationCount===1&&proof.measurementCount===(task.needsMeasure?1:0),label+' evidence counts real operations and readout requests');
    if(task.shape.length===1)ok(proof.invariants.edgeSquared.length===0&&proof.invariants.anglesPreserved===null,label+' a single point does not claim edge or angle evidence');
    else ok(proof.invariants.anglesPreserved===true&&proof.invariants.lengthFactor===(task.goal.kind==='scale'?'2':'1'),label+' polygon invariants distinguish similarity from unchanged lengths');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' no mathematical-practice label is inferred from widget type');
    ok(/自由解释.*长期掌握/.test(words),label+' interpretation remains bounded');
    await shot('02-verified-offline');await reload(spec);
    ok(await hint.isVisible()&&same(await model(spec),first),label+' complete checked model survives offline reload unchanged');
    await field('answers.0',wrongAnswer(task));ok(await hint.count()===0,label+' editing invalidates the previous feedback immediately');
    if(spec===cases[0])await shot('03-edited');
    await reload(spec);ok(await hint.count()===0,label+' reload does not revive an obsolete correct snapshot');
    await submit();ok(await hint.count()===0,label+' latest wrong answer outranks the earlier correct answer');
    await field('answers.0',task.questions[0].value);await submit();ok(await hint.isVisible(),label+' a fresh correct submission restores feedback');
    const changed=await operate(spec,alternative(task));ok(await hint.count()===0,label+' actual different transformation invalidates feedback');
    ok(!same(changed.board.image,first.board.image),label+' exploration changes corresponding point positions');
    if(task.needsMeasure)await act(spec,'p24-measure');
    await reload(spec);ok(await hint.count()===0,label+' an unsubmitted new image remains unverified after offline reload');
    await submit();ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise'&&await hint.count()===0,label+' valid different transformation is not the required goal');
    await operate(spec,task.goal);if(task.needsMeasure)await act(spec,'p24-measure');
    ok(await hint.count()===0,label+' returning to the target still requires a new check');
    await submit();ok(await hint.isVisible(),label+' legal exploration and a new target check restore strict feedback');
    const end=await saved(spec.id),m=end.models[spec.index],attempts=end.cases[spec.index].attempts,finalProof=replayTransformEvidence(task,m);
    ok(finalProof?.operationCount===3&&finalProof.measurementCount===(task.needsMeasure?3:0),label+' all transformations start from the original shape and remain in history');
    ok(same(m.board.image,first.board.image)&&m.history.length===first.history.length+(task.needsMeasure?4:2),label+' restored image and full real exploration history agree');
    ok(attempts.length===6&&attempts.every(a=>a.id&&a.at&&a.value&&typeof a.supported==='boolean'&&typeof a.exposed==='boolean'),label+' original v2 attempt snapshots and metadata remain intact');
    ok(same(attempts.at(-1).value,m)&&m.prose===first.prose,label+' latest attempt contains the complete current model and optional prose');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no score or mastery record is added');
    await reload(spec);ok(await hint.isVisible()&&same(await model(spec),m),label+' final exploration record and feedback survive offline reload');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,
     observation:words,finalObservation:await hint.innerText(),initialModel:first,model:m,attempts,proof:finalProof});
   }
   for(const variant of ['invalid-parameter','duplicate-operate','duplicate-measure','identity','near-answer',
    'negative-mixed-scale','negative-mixed-answer']){
    const spec=variant==='duplicate-measure'?{id:'gridmotion',index:0}:variant==='negative-mixed-scale'?{id:'growshape',index:0}:{id:'pointmove',index:0};
    const task=sessionTasks(spec.id)[spec.index];label=`${width}x${height}-negative-${variant}`;await open(spec);
    let failedScale;
    if(['invalid-parameter','identity','negative-mixed-scale'].includes(variant)){
     await field('predX','0');await field('predY','0');await act(spec,'p24-predict');
     if(variant==='negative-mixed-scale'){
      const failed=await operate(spec,{kind:'scale',factor:'-0 1/2',center:[0,0]});failedScale=failed.history.at(-1);
      ok(failed.board.image===null&&failed.board.op===null&&!!failed.issue,label+' the negative half scale is rejected before creating an image');
      ok(failedScale.f.factor==='-0 1/2',label+' failed scale retains its exact typed sign and fraction');
     }else await operate(spec,{kind:'move',dx:variant==='identity'?0:13,dy:0});
     if(variant==='invalid-parameter')ok(!!(await model(spec)).issue,label+' original control rejects the out-of-bounds move');
     await operate(spec,task.goal);await finish(spec);
    }else{
     await solve(spec);
     if(variant==='duplicate-operate')await act(spec,'p24-operate');
     if(variant==='duplicate-measure')await act(spec,'p24-measure');
     if(variant==='near-answer')await field('answers.0','5.00000001');
     if(variant==='negative-mixed-answer')await field('answers.0','-0 5/1');
    }
    await submit();const m=await model(spec),state=await saved(spec.id);
    const originalCorrect=variant!=='negative-mixed-answer';
    ok(M.valid(task,m)&&M.inspect(task,m).correct===originalCorrect&&
     await page.locator('#check-feedback').getAttribute('data-state')===(originalCorrect?'correct':'revise'),
     label+' original grading respects the signed numeric answer and final-work rules');
    if(failedScale)ok(same(m.history[1],failedScale),label+' the later correct image cannot remove the failed scale event');
    ok(!replayTransformEvidence(task,m)&&await hint.count()===0,label+' invalid or redundant process receives no strict evidence');
    await reload(spec);ok(await hint.count()===0&&same(await model(spec),m),label+' strict exclusion and full record survive offline reload');
    const observation={width,height,variant,model:m,attempts:state.cases[spec.index].attempts,originalCorrect,strictFeedback:false};
    negatives.push(observation);
    await shot('rejected');
    if(variant==='negative-mixed-answer'){
     await field('answers.0','5');await submit();const repaired=await saved(spec.id),current=repaired.models[spec.index];
     ok(await hint.isVisible()&&!!replayTransformEvidence(task,current),label+' correcting the answer enables the existing valid action evidence');
     ok(same(repaired.cases[spec.index].attempts.slice(0,-1),state.cases[spec.index].attempts)&&same(current.history,m.history),
      label+' answer correction preserves the wrong submission and all original operations');
     await reload(spec);ok(await hint.isVisible()&&same(await model(spec),current),label+' corrected answer and earlier failed response survive offline reload');
     observation.repaired={model:current,attempts:repaired.cases[spec.index].attempts,proof:replayTransformEvidence(task,current)};
    }
   }
   for(const spec of [
    {kind:'negative-mixed-prediction',id:'pointmove',index:0,guess:['-0 5/1','3'],svg:[234.375,155.625]},
    {kind:'negative-mixed-move',id:'pointmove',index:0,guess:['0','0'],svg:[350,225]},
    {kind:'negative-mixed-correct-coordinate',id:'axisrules',index:0,guess:['4','-0 1/1'],svg:[442.5,248.125]}
   ]){
    label=`${width}x${height}-${spec.kind}`;const task=sessionTasks(spec.id)[spec.index];await open(spec);
    await field('predX',spec.guess[0]);await field('predY',spec.guess[1]);await act(spec,'p24-predict');
    const marker=page.locator('#extra-visual svg circle[stroke="#a488b3"]');
    ok(await marker.count()===1,label+' the actual prediction produces one visible SVG marker');
    const coordinates=await marker.evaluate(element=>['cx','cy'].map(name=>Number(element.getAttribute(name))));
    ok(coordinates.every(Number.isFinite)&&same(coordinates,spec.svg),label+' the prediction marker is at the independently checked signed coordinate');
    ok(!/NaN|Infinity/.test(await page.locator('#extra-visual svg').innerHTML()),label+' signed mixed prediction rendering contains only finite geometry');
    await shot('prediction');
    let intermediate;
    if(spec.kind==='negative-mixed-move'){
     intermediate=await operate(spec,{kind:'move',dx:'-0 2/1',dy:0});
     ok(same(intermediate.board.op,{kind:'move',dx:-2,dy:0})&&same(intermediate.board.image,[[0,3]])&&!intermediate.issue,
      label+' the typed negative displacement really moves the original point left');
     await operate(spec,task.goal);
    }else if(spec.kind==='negative-mixed-correct-coordinate')await operate(spec,{kind:'move',dx:3,dy:'-0 2/1'});
    else await operate(spec,task.goal);
    await finish(spec);
    if(spec.kind==='negative-mixed-correct-coordinate')await field('answers.1','-0 1/1');
    await submit();const state=await saved(spec.id),m=state.models[spec.index],proof=replayTransformEvidence(task,m);
    ok(M.valid(task,m)&&M.inspect(task,m).correct&&!!proof&&await hint.isVisible(),label+' real signed numeric work passes the original and independent mathematical gates');
    ok(same(proof.prediction.point,spec.guess)&&proof.prediction.correct===(spec.kind==='negative-mixed-correct-coordinate'),
     label+' a wrong signed guess and an exactly correct negative-coordinate guess stay distinct');
    ok(m.board.first.incorrectPrediction===(spec.kind==='negative-mixed-correct-coordinate'?undefined:true),
     label+' original first-prediction history agrees with the signed mathematics');
    if(intermediate){
     ok(proof.operationCount===2&&same(proof.operations[0].imagePoints,[[0,3]])&&same(proof.operations[1].sourcePoints,[[2,3]])&&
      same(m.history[1],intermediate.history[1]),label+' returning to the target preserves the legitimate exploration and starts again from the original point');
    }
    if(spec.kind==='negative-mixed-correct-coordinate')ok(same(proof.imagePoints,[[4,-1],[6,-1],[4,1]])&&m.answers[1]==='-0 1/1',
     label+' the negative answer belongs to the actual negative coordinate');
    ok(state.cases[spec.index].attempts.length===1&&same(state.cases[spec.index].attempts[0].value,m),
     label+' the submission stores the complete actual signed work');
    await reload(spec);ok(await hint.isVisible()&&same(await model(spec),m),label+' signed work and strict feedback survive offline reload');
    explorations.push({width,height,kind:spec.kind,model:m,intermediate,proof,attempts:state.cases[spec.index].attempts,observation:await hint.innerText()});
    await shot('verified');
   }
   const guessSpec={id:'growshape',index:0},guessTask=sessionTasks(guessSpec.id)[0];
   label=`${width}x${height}-wrong-prediction`;await open(guessSpec);
   await field('predX','0');await field('predY','0');await act(guessSpec,'p24-predict');
   await operate(guessSpec,guessTask.goal);await finish(guessSpec);await submit();
   const guessModel=await model(guessSpec),guessProof=replayTransformEvidence(guessTask,guessModel);
   ok(guessProof?.prediction.correct===false&&guessModel.board.first.incorrectPrediction===true&&await hint.isVisible(),label+' a wrong initial prediction does not erase the later verified operation');
   await reload(guessSpec);ok(await hint.isVisible()&&same(await model(guessSpec),guessModel),label+' prediction and verified operation remain distinct after offline reload');
   explorations.push({width,height,kind:'wrong-prediction',model:guessModel,proof:guessProof,observation:await hint.innerText()});
   for(const spec of [{id:'link-geometrylab-patternfloor',index:0},{id:'link-gridmotion-patternfloor',index:0},
    {id:'link-turnsym-geometrylab',index:1},{id:'link-gridchange-growshape',index:1}]){
    label=`${width}x${height}-isolation-${spec.id}-${spec.index}`;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,label+' associated task has no native guide');
    await solve(spec);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct'&&await hint.count()===0,label+' associated original mathematics works without native feedback');
    await reload(spec);ok(await hint.count()===0,label+' source isolation survives offline reload');
   }
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===cases.length*viewports.length,'all 23 native tasks complete at both desktop sizes');
  ok(negatives.length===7*viewports.length,'all seven rejected paths complete at both desktop sizes');
  ok(explorations.filter(item=>item.kind.startsWith('negative-mixed-')).length===3*viewports.length,
   'three legal signed mixed-number paths complete at both desktop sizes');
  const result={checks,errors,remote,observations,negatives,explorations,offline,nativeTasks:cases.length,
   nativeNodes:new Set(cases.map(c=>c.nodeId)).size,taskViewportPairs:observations.length,viewports,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log('P9_TRANSFORM_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes:result.nativeNodes,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,explorations,offline,error:String(error),at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
