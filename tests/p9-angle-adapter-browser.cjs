// Real controls for every reviewed source at two desktop sizes. Only an empty
// lesson position is seeded. All mathematics, checking and reloads happen after
// the HTTP origin stops; full original models and attempts are retained below.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const cases=require('./fixtures/p9-angle-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-angle-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],boundaries=[],offline=[];
const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {unpackText}=await import('../dist/storage.js');
 const {sessionTasks,BRIDGES}=await import('../dist/learning/bridges.js');
 const angles=await import('../dist/learning/phase5/b25-model.js');
 const {replayAngleEvidence}=await import('../dist/learning/angle-evidence.js');
 let browser,server,activePage,activeLabel='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const [width,height]of viewports){
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
   const guide=page.locator('#thinking-guide'),hint=page.locator('#thinking-feedback');
   const shot=async name=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,activeLabel+'-'+name+'.png'),fullPage:true});
   };
   const visible=async locator=>{
    for(let n=0;n<4;n++){
     const closed=locator.locator('xpath=ancestor::details[not(@open)]').first();
     if(!(await closed.count()))break;
     await closed.locator(':scope > summary').click();
    }
    await locator.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
   };
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);await visible(input);
    if(await input.evaluate(element=>element.tagName)==='SELECT')await input.selectOption(String(value));
    else await input.fill(String(value));
   };
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const button=page.locator(`[data-x="g25-${name}"]${suffix}`);
    await visible(button);await button.click();
   };
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   // Export exactly the stored bytes at existing checkpoints. Capturing does
   // not perform any mathematical action or create another submission.
   const captureNative=async(spec,stage)=>{
    const raw=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
    const text=unpackText(raw),state=JSON.parse(text),lesson=state.lessons[spec.id]||state.daily.bridges[spec.id];
    const model=lesson?.models[spec.index];
    ok(typeof raw==='string'&&!!model&&lesson.index===spec.index,activeLabel+' '+stage+' captures complete stored lesson and current model');
    const files={raw:activeLabel+'-'+stage+'-storage.txt',state:activeLabel+'-'+stage+'-state.json'};
    fs.writeFileSync(path.join(out,files.raw),raw);fs.writeFileSync(path.join(out,files.state),text);
    return{stage,raw,text,state,lesson,model,files};
   };
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
   const answerFields=async(spec,task=sessionTasks(spec.id)[spec.index])=>{
    const values=spec.answers||task.questions.map(q=>q.value);
    for(const [index,value]of values.entries())await field('answers.'+index,value);
   };
   const originalSolve=async spec=>{
    for(const step of angles.solveSteps(sessionTasks(spec.id)[spec.index]))
     if(step.field)await field(step.field,step.value);else await action(step.action.replace(/^g25-/,''),step.data);
   };
   const realAction=async(spec,name)=>{
    const before=await model(spec);await action(name);const after=await model(spec),b=after.board;
    ok(after.history.length===before.history.length+1&&after.history.at(-1).a===name,
     activeLabel+' '+name+' records exactly one original-format event');
    ok(Number.isInteger(b.angle)&&b.angle>=0&&b.angle<=360&&[1,2,3].includes(b.length),
     activeLabel+' opening and visible length stay in their true domains');
    ok(new Set(b.records.map(r=>r.angle+':'+r.length)).size===b.records.length,
     activeLabel+' each recorded angle and length pair remains unique');
    if(name==='record')ok(b.records.length===before.board.records.length+1&&
     b.records.at(-1).angle===b.angle&&b.records.at(-1).length===b.length,
     activeLabel+' record captures the actual visible opening and length');
    if(name==='length')ok(b.angle===before.board.angle,activeLabel+' changing visible length preserves the opening');
    if(name==='quarter')ok(b.angle===(before.board.angle===360?90:Math.min(360,before.board.angle+90)),
     activeLabel+' advance follows the original bounded control');
    return after;
   };
   const setAngle=async(spec,value)=>{await field('angle',value);return realAction(spec,'set');};
   const recordAngle=async(spec,value)=>{await setAngle(spec,value);return realAction(spec,'record');};
   const boundaryWalk=async spec=>{
    for(const start of [315,359]){
     await setAngle(spec,start);const before=await model(spec),label=await page.locator('[data-x="g25-quarter"]').innerText();
     ok(label===`转到整圈（再转${360-start}°）`,activeLabel+' clipped advance says its actual remaining degrees');
     await shot('boundary-'+start);const after=await realAction(spec,'quarter');
     ok(after.board.angle===360,activeLabel+' bounded advance really reaches the whole turn');
     boundaries.push({width,height,id:spec.id,index:spec.index,kind:'clamped',label,before,after,degrees:360-start});
     const wrappedLabel=await page.locator('[data-x="g25-quarter"]').innerText();
     ok(wrappedLabel==='转到下一圈的四分之一处',activeLabel+' full-turn control explains the next-circle position');
     await shot('boundary-360-after-'+start);const next=await realAction(spec,'quarter');
     ok(next.board.angle===90,activeLabel+' next-circle action really lands at 90 degrees');
     boundaries.push({width,height,id:spec.id,index:spec.index,kind:'wrapped',label:wrappedLabel,before:after,after:next,degrees:90});
    }
   };
   const alternativeSolve=async spec=>{
    if(spec.id==='anglecorner'&&spec.index===0)await boundaryWalk(spec);
    if(spec.id==='rightcheck'&&spec.index===2){
     for(const angle of spec.targets){
      const after=await realAction(spec,'quarter');ok(after.board.angle===angle,activeLabel+' repeated real quarter actions reach the reviewed milestone');
      await realAction(spec,'record');
     }
    }else if(spec.id==='angleparts'&&spec.index===2){
     await setAngle(spec,spec.targets[0]);
     await field('length','3');await realAction(spec,'length');await realAction(spec,'record');
     await field('length','1');await realAction(spec,'length');await realAction(spec,'record');
    }else{
     for(const angle of spec.targets)await recordAngle(spec,spec.id==='degreeunit'&&spec.index===1?'90/2':angle);
     if(spec.compareLengths){
      // The original solver includes this legitimate confirmation. It is not
      // another change of angle and must not be counted as an extra turn.
      await setAngle(spec,spec.targets[0]);
      await field('length','3');await realAction(spec,'length');await realAction(spec,'record');
     }
    }
    await answerFields(spec);
   };
   const wrongAnswer=(task,value)=>task.questions[0].options?
    task.questions[0].options.find(([option])=>String(option)!==String(value))[0]:'999';

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let ready=false;
   // Explicitly await each MessageChannel result. An async waitForFunction
   // predicate is not used as a substitute for the resolved readiness value.
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
   const cachedModules=await page.evaluate(async cache=>{
    const store=await caches.open(cache);
    return Promise.all(['learning/angle-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js',
     'learning/thinking-feedback.js','learning/phase5/b25.js','learning/phase5/b25-model.js',
     'learning/phase5/b25-view.js','learning/phase5/b25-geometry.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const missingModules=cachedModules.filter(item=>!item.cached).map(item=>item.name);
   const offlineStatus={width,height,cache,complete:ready,cachedModules,missingModules,originStopped:false};offline.push(offlineStatus);
   ok(ready,width+' complete current offline cache; missing modules: '+JSON.stringify(missingModules));
   ok(missingModules.length===0,width+' angle adapter and original dependencies cached; missing: '+JSON.stringify(missingModules));
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   offlineStatus.originStopped=!server.listening;
   ok(offlineStatus.originStopped,width+' HTTP origin stops before all mathematical operations');

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;
    const task=sessionTasks(spec.id)[spec.index];await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),activeLabel+' optional source-bound guide starts collapsed');
    ok(await hint.count()===0,activeLabel+' no evidence before real work');
    await guide.locator('summary').click();
    await page.waitForFunction(({id,index})=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id].cases[index]?.support===true,spec);
    ok(await guide.locator('p').isVisible(),activeLabel+' opening optional guidance retains the existing support flag');
    await guide.locator('summary').click();const empty=await saved(spec.id);
    ok(empty.models[spec.index].history.length===0&&empty.cases[spec.index].attempts.length===0,
     activeLabel+' guidance manufactures no mathematical action or submission');
    await alternativeSolve(spec);
    const constructed=await model(spec),constructionProof=replayAngleEvidence(task,constructed);
    ok(!!constructionProof,activeLabel+' real alternate construction passes independent replay');
    ok(JSON.stringify(constructionProof.targetRecords.map(r=>r.angle))===JSON.stringify(spec.targets),
     activeLabel+' actual records contain all reviewed openings in order');
    if(spec.compareLengths)ok(!!constructionProof.lengthComparison,activeLabel+' actual short and long records share one angle');
    if(spec.scene==='cross')ok(constructionProof.cross.angle+constructionProof.cross.adjacent===180&&constructionProof.cross.around===360,
     activeLabel+' actual intersection satisfies both straight-line and full-turn relations');
    ok(await hint.count()===0,activeLabel+' unsubmitted work does not receive verified feedback');

    await field('answers.0',wrongAnswer(task,spec.answers[0]));await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise'&&await hint.count()===0,
     activeLabel+' incorrect question response receives original correction and no strict evidence');
    await field('answers.0',spec.answers[0]);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct'&&await hint.isVisible(),
     activeLabel+' new correct submission receives bounded angle feedback');
    const firstLesson=await saved(spec.id),first=firstLesson.models[spec.index],words=await hint.innerText();
    const nativeCaptures={first:await captureNative(spec,'native-first')};
    ok(angles.valid(task,first)&&angles.inspect(task,first).correct&&!!replayAngleEvidence(task,first),
     activeLabel+' saved UI actions satisfy original grading and strict mathematics');
    ok(spec.targets.every(angle=>words.includes(String(angle))),activeLabel+' factual feedback names the actual recorded openings');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),activeLabel+' no MP label is borrowed');
    await shot('verified-offline');await reload(spec);
    ok(await hint.isVisible()&&JSON.stringify(await model(spec))===JSON.stringify(first),
     activeLabel+' offline refresh preserves the exact checked model');
    nativeCaptures.firstOffline=await captureNative(spec,'native-first-offline');

    await field('angle','999');ok(await hint.count()===0,activeLabel+' pending input immediately invalidates old feedback');
    await reload(spec);ok(await hint.count()===0,activeLabel+' pending input stays unverified offline');
    nativeCaptures.pendingInputOffline=await captureNative(spec,'native-pending-input-offline');
    await submit();const pendingLesson=await saved(spec.id),pending=pendingLesson.models[spec.index];
    nativeCaptures.pendingChecked=await captureNative(spec,'native-pending-checked');
    ok(angles.inspect(task,pending).correct&&await page.locator('#check-feedback').getAttribute('data-state')==='correct',
     activeLabel+' original record-based grading is unchanged for an unacted input');
    ok(await hint.count()===0&&!replayAngleEvidence(task,pending),activeLabel+' stale construction cannot verify a pending 999-degree input');
    await field('angle',first.angle);await submit();
    ok(await hint.isVisible(),activeLabel+' restoring the actual last input and checking again verifies it');

    const beforeReturn=await model(spec);
    await setAngle(spec,0);await setAngle(spec,spec.targets.at(-1));
    const returned=await model(spec);
    ok(returned.board.angle===beforeReturn.board.angle&&returned.board.length===beforeReturn.board.length&&
     JSON.stringify(returned.board.records)===JSON.stringify(beforeReturn.board.records),
     activeLabel+' two real changes restore the displayed opening without forging a new record');
    ok(returned.history.length===beforeReturn.history.length+2&&await hint.count()===0,
     activeLabel+' new actual history needs a new check even after the opening returns');
    await reload(spec);ok(await hint.count()===0,activeLabel+' changed history remains unverified after offline refresh');
    nativeCaptures.pendingHistoryOffline=await captureNative(spec,'native-pending-history-offline');
    await submit();ok(await hint.isVisible(),activeLabel+' a fresh check verifies the complete new history');
    const end=await saved(spec.id),m=end.models[spec.index],attempts=end.cases[spec.index].attempts,proof=replayAngleEvidence(task,m);
    nativeCaptures.final=await captureNative(spec,'native-final');
    ok(attempts.length===5,activeLabel+' all five submissions are retained');
    ok(attempts.every(attempt=>attempt.id&&attempt.at&&attempt.value&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean'),
     activeLabel+' original submission metadata and snapshots remain intact');
    ok(JSON.stringify(attempts.at(-1).value)===JSON.stringify(m)&&!!proof,
     activeLabel+' latest complete submission matches the entire checked model');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),activeLabel+' no added score or mastery state');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),activeLabel+' no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,
     targets:spec.targets,observation:words,finalObservation:await hint.innerText(),firstModel:first,finalModel:m,
     firstLesson,pendingLesson,finalLesson:end,attempts,proof,nativeCaptures});
   }

   const negativeCases=[
    {variant:'duplicate-record',id:'anglecorner',index:0},
    {variant:'same-length',id:'anglecorner',index:0},
    {variant:'invalid-angle',id:'anglecorner',index:0},
    {variant:'rounded-angle',id:'anglecorner',index:0},
    {variant:'negative-zero-mixed',id:'anglecorner',index:0},
    {variant:'reversed-records',id:'angleadd',index:1},
    {variant:'stale-opening',id:'anglecross',index:0},
    {variant:'rounded-answer',id:'degreeunit',index:1},
    {variant:'negative-mixed-answer',id:'degreeunit',index:1}
   ];
   for(const spec of negativeCases){
    activeLabel=`${width}x${height}-negative-${spec.variant}`;const task=sessionTasks(spec.id)[spec.index];await open(spec);
    let failedOpening,failed;
    if(spec.variant==='reversed-records'){
     for(const angle of [...task.targets].reverse())await recordAngle(spec,angle);
     await setAngle(spec,task.targets.at(-1));await answerFields(spec,task);
    }else{
     await originalSolve(spec);
     if(spec.variant==='duplicate-record')await action('record');
     if(spec.variant==='same-length')await action('length');
     if(['invalid-angle','rounded-angle','negative-zero-mixed'].includes(spec.variant)){
      const value=spec.variant==='invalid-angle'?'361':spec.variant==='rounded-angle'?'60.0000000000000001':'-0 60/1';
      const before=await model(spec);await field('angle',value);await action('set');
      if(spec.variant==='negative-zero-mixed'){
       const failed=await model(spec);failedOpening={index:failed.history.length-1,event:failed.history.at(-1)};
       ok(!!failed.issue&&failed.board.angle===before.board.angle&&JSON.stringify(failed.board.records)===JSON.stringify(before.board.records),
        activeLabel+' the negative sixty-degree opening is rejected without changing the visible construction or records');
       ok(failedOpening.event.a==='set'&&failedOpening.event.f.angle==='-0 60/1',activeLabel+' the rejected event preserves the exact negative mixed input');
      }
      await submit();failed={model:await model(spec),lesson:await saved(spec.id),raw:await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))};
      await field('angle','60');await action('set');
     }
     if(spec.variant==='stale-opening'){await field('angle','65');await action('set');}
     if(spec.variant==='rounded-answer')await field('answers.0','45.00000001');
     if(spec.variant==='negative-mixed-answer')await field('answers.0','-0 45/1');
    }
    await submit();const m=await model(spec);
    const originalCorrect=spec.variant!=='negative-mixed-answer';
    ok(angles.valid(task,m)&&angles.inspect(task,m).correct===originalCorrect,activeLabel+' original grading respects the signed angle answer and record rules');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(originalCorrect?'correct':'revise'),
     activeLabel+' the visible result agrees with the actual positive opening measurement');
    if(failedOpening)ok(JSON.stringify(m.history[failedOpening.index])===JSON.stringify(failedOpening.event),
     activeLabel+' a later correct opening retains the failed negative action in its original position');
    const strictFeedback=['duplicate-record','same-length','invalid-angle','negative-zero-mixed'].includes(spec.variant),proof=replayAngleEvidence(task,m);
    if(strictFeedback){ok(!!proof&&await hint.isVisible(),activeLabel+' real failed requests and confirmations preserve completed angle evidence');
     if(failed)ok(proof.failedRequests.length===1&&JSON.stringify(m.history.slice(0,failed.model.history.length))===JSON.stringify(failed.model.history),activeLabel+' failure remains exact and is not counted as an angle change');
     else ok(proof.confirmations>0,activeLabel+' duplicate confirmation does not manufacture extra records');
    }else ok(await hint.count()===0&&!proof,activeLabel+' inexact, stale or contradictory final evidence remains excluded');
    const checked=await saved(spec.id),checkedRaw=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
    await reload(spec);ok((await hint.count()>0)===strictFeedback&&JSON.stringify(await model(spec))===JSON.stringify(m),activeLabel+' complete original model and faithful evidence decision survive offline');
    const lesson=await saved(spec.id),observation={width,height,id:spec.id,index:spec.index,variant:spec.variant,failed,model:m,
     lesson,checked,checkedRaw,restoredRaw:await page.evaluate(()=>localStorage.getItem('math-explorer-v2')),proof,originalCorrect,strictFeedback};negativeObservations.push(observation);
    await shot(strictFeedback?'corrected':'rejected');
    if(spec.variant==='negative-mixed-answer'){
     await field('answers.0','45');await submit();const repaired=await saved(spec.id),current=repaired.models[spec.index];
     ok(await hint.isVisible()&&!!replayAngleEvidence(task,current),activeLabel+' correcting only the answer enables the actual recorded angle evidence');
     ok(JSON.stringify(repaired.cases[spec.index].attempts.slice(0,-1))===JSON.stringify(lesson.cases[spec.index].attempts)&&
      JSON.stringify(current.history)===JSON.stringify(m.history),activeLabel+' the negative answer submission and every real action remain intact after correction');
     await reload(spec);ok(await hint.isVisible()&&JSON.stringify(await model(spec))===JSON.stringify(current),activeLabel+' correction and earlier negative response survive offline reload');
     observation.repaired={model:current,lesson:repaired,proof:replayAngleEvidence(task,current)};
    }
   }

   const bridge=Object.keys(BRIDGES).flatMap(id=>(sessionTasks(id)||[]).map((task,index)=>({id,index,task}))).find(c=>c.task.type==='x-g25-turn');
   ok(!!bridge,width+' a real associated angle task is available for source isolation');
   activeLabel=`${width}x${height}-associated-${bridge.id}-${bridge.index}`;await open(bridge);
   ok(await guide.count()===0&&await hint.count()===0,activeLabel+' associated task inherits neither guide nor evidence');
   await originalSolve(bridge);await submit();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' associated original task remains usable');
   ok(await hint.count()===0,activeLabel+' correct associated work cannot borrow native evidence');
   await reload(bridge);ok(await hint.count()===0,activeLabel+' associated isolation persists offline');await shot('checked');
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===46,'all 23 native tasks finish at both desktop sizes');
  ok(negativeObservations.length===18,'all nine correction, confirmation and negative paths finish at both desktop sizes');
  ok(boundaries.length===8,'clipped and next-circle advances are observed at both desktop sizes');
  const nativeNodes=new Set(cases.map(c=>c.nodeId)).size;
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,boundaries,offline,
   nativeTasks:cases.length,nativeNodes,taskViewportPairs:observations.length,viewports,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false},null,2));
  console.log('P9_ANGLE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,boundaries,offline,error:String(error),at:activeLabel},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
