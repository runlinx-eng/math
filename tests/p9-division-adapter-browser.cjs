// The original solver supplies an operation plan, never a solved browser model.
// Node independently checks every field and button against unchanged V.render.
function operationPlan(F,task,{method='long'}={}){
 let position=-1;
 return F.solveSteps(task).map(step=>{
  if(step.action==='b14-bring')position++;
  const stage=step.field==='method'||step.action==='b14-method'?'method':
   step.action==='b14-container'?'containers':['check','answer','base','precision'].includes(step.field)?'answer':'work';
  return {stage,...(stage==='work'?{position}:{}),...step,...(step.field==='method'?{value:method}:{})};
 });
}
module.exports={operationPlan};

if(require.main===module)(async()=>{
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {cases,associated}=require('./fixtures/p9-division-cases.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-division-adapter');
 const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],explorationObservations=[],associatedObservations=[],offline=[];
 const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 fs.mkdirSync(out,{recursive:true});
 const [{sessionTasks},F,{replayDivisionEvidence:replay},{ensureB39Ready}]=await Promise.all([
  import('../dist/learning/bridges.js'),import('../dist/learning/phase5/b14-model.js'),
  import('../dist/learning/division-evidence.js'),import('../dist/learning/phase4/async-batches.js')
 ]);
 await ensureB39Ready();let browser,server,activePage,activeLabel='setup';
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
   const base='http://127.0.0.1:'+server.address().port+'/',context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
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
    await locator.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
   };
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);await visible(input);
    if(await input.evaluate(element=>element.tagName)==='SELECT')await input.selectOption(String(value));else await input.fill(String(value));
   };
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const button=page.locator(`[data-x="${name}"]${suffix}`);await visible(button);await button.click();
   };
   const capture=id=>page.evaluate(async id=>{
    const {unpackText}=await import('./storage.js'),rawState=localStorage.getItem('math-explorer-v2'),state=JSON.parse(unpackText(rawState));
    return {rawState,state,record:state.lessons[id]||state.daily.bridges[id]};
   },id);
   const model=async spec=>(await capture(spec.id)).record.models[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' real document reload is served after HTTP shutdown');
   };
   const open=async spec=>{
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES},{ensureB39Ready}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js'),import('./learning/phase4/async-batches.js')
     ]);
     await ensureB39Ready();const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    // A hash-only goto may return null and keep the old in-memory question.
    await page.goto(base+'learn.html#'+spec.id);
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);await reload(spec);
   };
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const checked=async correct=>ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),
    activeLabel+' original grading reports '+(correct?'correct':'revise'));
   const mathematicalAction=async(spec,name,data={})=>{
    const before=await model(spec),task=sessionTasks(spec.id)[spec.index];await action(name,data);const after=await model(spec);
    ok(after.history.length===before.history.length+1&&after.history.at(-1).action===name,activeLabel+' '+name+' records exactly one actual event');
    ok(F.valid(task,after),activeLabel+' the original validator accepts the full event history');
    const event=after.history.at(-1);ok(Object.keys(event.data.fields).length===33&&event.data.index===null&&event.data.side===null,
     activeLabel+' full 33-field snapshot and actual null event coordinates are preserved');
    if(name==='b14-bring')ok(after.board.ready&&after.board.current===F.divCurrent(task,before.board).value,
     activeLabel+' the tool displays the actual carried remainder and next digit');
    if(name==='b14-div-step'){
     if(after.issue)ok(same(after.board,before.board),activeLabel+' a rejected real input does not secretly advance the division');
     else{const s=after.board.steps.at(-1);ok(after.board.steps.length===before.board.steps.length+1&&s.used===s.q*task.d&&s.used+s.r===s.current&&s.r>=0&&s.r<task.d,
      activeLabel+' entered quotient product and remainder conserve this place');}
    }
    if(name==='b14-container')ok(after.board.containers===before.board.containers+Number(data.value),activeLabel+' this enabled container control actually changes the diagram count');
    if(name==='b14-reset')ok(Object.keys(event.data.fields).every(k=>after[k]===before[k]),activeLabel+' actual reset preserves every entered field');
    return after;
   };
   const run=async(spec,stages=['method','work','containers','answer'],options={})=>{
    for(const step of operationPlan(F,sessionTasks(spec.id)[spec.index],options))if(stages.includes(step.stage)&&
      (step.position===undefined||step.position>=(options.fromPosition||0))){
     if(step.field)await field(step.field,step.value);else await mathematicalAction(spec,step.action,step.data);
    }
   };
   const roundTrip=async spec=>{
    const task=sessionTasks(spec.id)[spec.index],before=await model(spec);
    if(['up','down'].includes(task.interpret)){await mathematicalAction(spec,'b14-container',{value:-1});await mathematicalAction(spec,'b14-container',{value:1});}
    else{await mathematicalAction(spec,'b14-reset');await run(spec);}
    ok(same((await model(spec)).board,before.board),activeLabel+' real operations restore the same board while retaining changed history');
   };
   const verifyProof=(spec,m)=>{
    const task=sessionTasks(spec.id)[spec.index],proof=replay(task,m);
    ok(F.valid(task,m)&&F.inspect(task,m).correct&&!!proof,activeLabel+' original grading and independent exact evidence both accept the actual work');
    ok(proof.events.length===m.history.length&&proof.events.every((e,i)=>e.index===i),activeLabel+' every original event index is retained');
    ok(proof.steps.length===String(task.n).length+task.places&&proof.steps.every((s,i)=>s.quotientDigit===m.board.steps[i].q),activeLabel+' no leading internal or final zero quotient digit is dropped');
    for(const s of proof.steps)ok(BigInt(s.dividendPrefix)===BigInt(s.quotientPrefix)*BigInt(task.d)+BigInt(s.remainder)&&s.remainder>=0&&s.remainder<task.d,
     activeLabel+' exact prefix identity holds at position '+s.position);
    ok(BigInt(task.n)*BigInt(proof.calculated.scale)===BigInt(proof.calculated.quotientPrefix)*BigInt(task.d)+BigInt(proof.calculated.remainder),activeLabel+' final scaled prefix conserves the original dividend');
    if(spec.written!==undefined)ok(proof.calculated.written===spec.written&&proof.calculated.remainder===spec.finalRemainder&&proof.answer.raw===spec.answer,
     activeLabel+' written quotient remaining unit and answer role match the independent reviewed fixture');
    if(proof.containers)ok(proof.containers.toolFillsDiagram&&proof.containers.independentObjectDistributionAssessed===false,
     activeLabel+' the diagram is attributed to the tool instead of invented per-object distribution');
    return proof;
   };
   const verifyWords=(proof,words)=>{
    ok(words.includes(String(proof.dividend))&&words.includes(String(proof.divisor))&&words.includes(proof.calculated.written),activeLabel+' feedback includes the actual dividend divisor and all recorded quotient digits');
    ok(/工具.*(显示|示意)/.test(words),activeLabel+' automatic place displays or diagrams are attributed to the tool');
    ok(proof.method.origin==='task-default'?/题目.*记法/.test(words):/选择.*记法/.test(words),activeLabel+' default notation and a recorded choice are distinguished');
    if(proof.rounding)ok(words.includes(proof.rounding.formatted)&&/近似|舍入/.test(words),activeLabel+' the rounded answer is explicitly approximate');
    if(proof.answer.role==='fraction')ok(words.includes(proof.answer.fractionalShare.join('/'))&&/每份/.test(words),activeLabel+' the fraction of each share is distinct from the original remainder');
    if(proof.containers)ok(/示意/.test(words)&&!/亲手.*逐个|逐个分放/.test(words),activeLabel+' container changes do not invent individual object moves');
    ok(!/MP\.\d/.test(words),activeLabel+' no unrelated mathematical-practice label is attached');
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
   ok(ready,width+' explicitly awaited cache status confirms the complete release');
   const cachedModules=await page.evaluate(async cache=>{
    const store=await caches.open(cache),names=['storage.js','exploration-core.js','learning/state.js','learning/division-evidence.js',
     'learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/phase5/b14-model.js',
     'learning/phase5/b14-view.js','learning/phase5/b14.js','learning/phase4/async-batches.js','learning/phase5/b39.js'];
    return Promise.all(names.map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(x=>x.cached),width+' all division and storage modules are cached; missing: '+cachedModules.filter(x=>!x.cached).map(x=>x.name).join(', '));
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' HTTP origin is stopped before all mathematical operations');
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;const task=sessionTasks(spec.id)[spec.index];await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),activeLabel+' optional source-bound guide starts collapsed');
    ok(await hint.count()===0,activeLabel+' no strict feedback appears before actual work');
    await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),activeLabel+' optional question opens');await guide.locator('summary').click();
    const blank=(await capture(spec.id)).record;
    ok(blank.cases[spec.index]?.support===true&&blank.models[spec.index].history.length===0&&blank.cases[spec.index].attempts.length===0,
     activeLabel+' opening the guide creates neither a mathematical event nor a submission');
    await run(spec);const constructed=await model(spec),initialProof=verifyProof(spec,constructed);
    ok(initialProof.method.origin===(task.choose?'recorded-choice':'task-default'),activeLabel+' source-default notation is not called an independent choice');
    ok(await hint.count()===0,activeLabel+' an unsubmitted correct result remains unverified');
    await field('answer','999999');await submit();await checked(false);ok(await hint.count()===0,activeLabel+' wrong answer has no strict evidence');
    await run(spec,['answer']);await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' a fresh complete correct attempt receives strict feedback');
    const firstModel=await model(spec),firstRecord=await capture(spec.id),words=await hint.innerText();verifyWords(verifyProof(spec,firstModel),words);
    ok(await hint.locator('[data-thinking-node-id]').count()===0,activeLabel+' all native bindings keep method null');
    await shot('verified-offline');await reload(spec);ok(await hint.isVisible()&&same(await model(spec),firstModel),activeLabel+' offline reload preserves the complete checked model');
    await field('answer','999998');ok(await hint.count()===0,activeLabel+' a visible answer edit immediately invalidates old feedback');
    await reload(spec);ok(await hint.count()===0,activeLabel+' unsubmitted edits remain unverified offline');await submit();await checked(false);
    ok(await hint.count()===0,activeLabel+' a failed latest submission cannot borrow an older success');
    await run(spec,['answer']);await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' explicit correct recheck restores evidence');
    await roundTrip(spec);ok(await hint.count()===0,activeLabel+' changed mathematical history requires a new complete check');
    await reload(spec);ok(await hint.count()===0,activeLabel+' changed history remains unverified after reload');await submit();await checked(true);
    ok(await hint.isVisible(),activeLabel+' the new complete mathematical history is verified only on submission');
    const final=await capture(spec.id),m=final.record.models[spec.index],attempts=final.record.cases[spec.index].attempts,proof=verifyProof(spec,m);
    verifyWords(proof,await hint.innerText());
    ok(attempts.length===5&&attempts.every(x=>x.id&&x.at&&typeof x.supported==='boolean'&&typeof x.exposed==='boolean'&&F.valid(task,x.value)),activeLabel+' all five complete attempts retain original metadata and valid original models');
    ok(same(attempts.map(x=>F.inspect(task,x.value).correct),[false,true,false,true,true]),activeLabel+' independent regrading preserves the actual wrong correct wrong correct correct sequence');
    ok(same(attempts.at(-1).value,m)&&same(attempts.slice(0,2),firstRecord.record.cases[spec.index].attempts),activeLabel+' latest full snapshot matches and all earlier attempts remain unchanged');
    ok(!Object.hasOwn(final.record,'thinkingScore')&&!Object.hasOwn(final.record,'thinkingMastery'),activeLabel+' no invented score or mastery fields');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),activeLabel+' the learning surface has no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,firstModel,finalModel:m,attempts,proof,
     observation:words,finalObservation:await hint.innerText(),rawState:final.rawState,state:final.state});
   }

   for(const variant of ['wrong-step-reset','long-decimal-reset','wrong-step-corrected','down-overfill','inverse-digit-join','inverse-nearby-token']){
    const spec={id:variant==='down-overfill'?'remainders':'shortdivide',index:variant==='down-overfill'?2:1},task=sessionTasks(spec.id)[spec.index];
    activeLabel=`${width}x${height}-negative-${variant}`;await open(spec);
    if(['wrong-step-reset','long-decimal-reset','wrong-step-corrected'].includes(variant)){
     await mathematicalAction(spec,'b14-bring');await field('q',variant==='long-decimal-reset'?'0.0000000':'0');
     await field('used',variant==='wrong-step-corrected'?'1':'0');await field('rest',variant==='wrong-step-reset'?'8':'1');
     await mathematicalAction(spec,'b14-div-step');ok((await model(spec)).issue!=='',activeLabel+' the original tool visibly rejects this real input');
     if(variant==='wrong-step-corrected'){
      await field('q','0');await field('used','0');await field('rest','1');await mathematicalAction(spec,'b14-div-step');
      await run(spec,['work','containers','answer'],{fromPosition:1});
     }else{await mathematicalAction(spec,'b14-reset');await run(spec);}
    }else{
     await run(spec);
     if(variant==='down-overfill'){
      await mathematicalAction(spec,'b14-container',{value:1});ok((await page.locator('#extra-visual').innerText()).includes('完整装入后剩 -2'),activeLabel+' original overfill caption is negative and cannot be called a valid physical distribution');
      await mathematicalAction(spec,'b14-container',{value:-1});
     }else await field('check',variant==='inverse-digit-join'?'1 5×8+5=125':'15.00000000000000001×8+5=125');
    }
    await submit();await checked(true);const rejected=await capture(spec.id),m=rejected.record.models[spec.index];
    ok(F.valid(task,m)&&F.inspect(task,m).correct&&replay(task,m)===null&&await hint.count()===0,activeLabel+' original completion is preserved while unsupported strict evidence is withheld');
    await reload(spec);ok(await hint.count()===0&&same(await model(spec),m),activeLabel+' full rejected history survives offline');await shot('rejected');
    let corrected=null;
    if(variant.startsWith('inverse-')){
     await field('check','15 × 8 + 5 = 125');ok(await hint.count()===0,activeLabel+' correcting notation alone does not borrow an old submission');
     await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' an explicit correct recheck verifies the corrected notation');
     corrected=await capture(spec.id);verifyProof(spec,corrected.record.models[spec.index]);await reload(spec);
     ok(await hint.isVisible(),activeLabel+' corrected checked notation restores offline');
    }
    negativeObservations.push({width,height,variant,id:spec.id,index:spec.index,model:m,record:rejected.record,rawState:rejected.rawState,state:rejected.state,corrected});
   }

   for(const variant of ['up-extra-room','choose-alternate','empty-reset','precision-edit']){
    const spec=variant==='up-extra-room'?{id:'shortdivide',index:2}:variant==='choose-alternate'?{id:'divide16',index:0}:
     variant==='empty-reset'?{id:'writtenstart',index:1}:{id:'roundanswers',index:1};
    activeLabel=`${width}x${height}-explore-${variant}`;await open(spec);
    if(variant==='empty-reset')await mathematicalAction(spec,'b14-reset');
    await run(spec,undefined,{method:variant==='choose-alternate'?'short':'long'});const before=await model(spec),oldLength=before.history.length;
    if(variant==='up-extra-room'){await mathematicalAction(spec,'b14-container',{value:1});await mathematicalAction(spec,'b14-container',{value:-1});}
    if(variant==='choose-alternate'){await mathematicalAction(spec,'b14-reset');await run(spec,undefined,{method:'long'});}
    if(variant==='precision-edit'){
     await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' correct submitted price precision has evidence');
     await field('precision','1');ok(await hint.count()===0,activeLabel+' changing the actual precision selector invalidates prior evidence');
     await submit();await checked(false);await field('precision','2');ok(await hint.count()===0,activeLabel+' a restored selector still needs explicit checking');
    }
    await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' legal exploration receives source-bound strict feedback');
    const final=await capture(spec.id),m=final.record.models[spec.index],proof=verifyProof(spec,m);
    ok(same(m.history.slice(0,oldLength),before.history),activeLabel+' earlier complete action snapshots are preserved');
    if(variant==='up-extra-room')ok(proof.containers.count===16&&proof.containers.events.length===18,activeLabel+' final bag count differs from the number of container actions');
    if(variant==='choose-alternate')ok(proof.choices.length===2&&proof.choices[0].method==='short'&&proof.method.value==='long'&&proof.currentEpoch===1,activeLabel+' each actual notation choice belongs to its reset epoch');
    if(variant==='empty-reset')ok(proof.events[0].effect===false,activeLabel+' empty reset is not counted as a mathematical change');
    if(variant==='precision-edit')ok(final.record.cases[spec.index].attempts.length===3&&proof.rounding.precisionChosen,activeLabel+' price precision changes retain all three original attempts');
    await reload(spec);ok(await hint.isVisible()&&same(await model(spec),m),activeLabel+' checked exploration restores exactly offline');await shot('checked');
    explorationObservations.push({width,height,variant,before,model:m,proof,record:final.record,rawState:final.rawState,state:final.state,observation:await hint.innerText()});
   }

   for(const spec of associated){
    activeLabel=`${width}x${height}-associated-${spec.id}-${spec.index}`;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,activeLabel+' associated practice inherits no native guide or evidence');
    await run(spec);await submit();await checked(true);const final=await capture(spec.id);verifyProof(spec,final.record.models[spec.index]);
    ok(await hint.count()===0,activeLabel+' correct associated work cannot borrow a native binding');await reload(spec);
    ok(await hint.count()===0&&same(await model(spec),final.record.models[spec.index]),activeLabel+' source isolation and complete model persist offline');await shot('checked');
    associatedObservations.push({width,height,id:spec.id,index:spec.index,record:final.record,rawState:final.rawState,state:final.state});
   }
   // At zero containers the original removal control is disabled. Do not force
   // a click: the earlier negative API tests already cover forged events.
   const spec={id:'remainders',index:1};activeLabel=`${width}x${height}-disabled-empty-container`;await open(spec);await run(spec,['method','work']);
   const before=await model(spec),remove=page.locator('[data-x="b14-container"][data-value="-1"]');
   ok(await remove.isDisabled()&&same(await model(spec),before),activeLabel+' disabled removal creates no event');
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===42,'all 21 native tasks complete five actual submissions in both viewports');
  ok(negativeObservations.length===12&&explorationObservations.length===8&&associatedObservations.length===48,
   'all six negative variants four legal explorations and 24 associated tasks run in both viewports');
  const result={checks,errors,remote,observations,negativeObservations,explorationObservations,associatedObservations,offline,viewports,
   nativeTasks:cases.length,nativeNodes:new Set(cases.map(c=>c.nodeId)).size,taskViewportPairs:observations.length,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log('P9_DIVISION_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage){await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
   fs.writeFileSync(path.join(out,activeLabel+'-failure.html'),await activePage.content().catch(()=>''));}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,explorationObservations,
   associatedObservations,offline,error:String(error),at:activeLabel},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
