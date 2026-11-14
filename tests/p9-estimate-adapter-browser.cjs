// Real estimate controls, exact submitted equations and five complete checked
// snapshots per native task. Only empty lesson positions are seeded.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {cases,associatedCases}=require('./fixtures/p9-estimate-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-estimate-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[];
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 childTrial:false,independentTeachingReview:false,seededCorrectWork:false};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const hash=task=>crypto.createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b11-model.js');
 const {estimateBinding,replayEstimateEvidence}=await import('../dist/learning/estimate-evidence.js');
 for(const spec of [...cases,...associatedCases])assert.equal(hash(sessionTasks(spec.id)[spec.index]),spec.taskHash);
 let browser,server,context,activePage,label='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  for(const [width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push({label,error:String(error)}));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const read=()=>page.evaluate(async()=>{
    const {readStored}=await import('./storage.js');return {raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};
   });
   const saved=async id=>{const state=JSON.parse((await read()).text);return state.lessons[id]||state.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const taskFor=spec=>sessionTasks(spec.id)[spec.index];
   const format=(spec,n)=>M.fmt(n,taskFor(spec).scale??1);
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const current=window.mathLesson?.snapshot();return current?.id===id&&current.index===index&&current.view==='task';
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
     const state=fresh(),record=freshLesson(id);record.index=index;record.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=record;else state.lessons[id]=record;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    // A hash-only navigation has no document response; the real reload also
    // installs the newly seeded task index before waiting for its snapshot.
    await page.goto(base+'learn.html#'+spec.id);
    await reload(spec);
    const record=await saved(spec.id);
    ok(record.models[spec.index].history.length===0&&(record.cases[spec.index]?.attempts?.length??0)===0,label+' starts with an empty workpiece and no checked snapshots');
   };
   const shot=async suffix=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});
   };
   const field=async(key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);
    if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));
    else await control.fill(String(value));
   };
   const setEstimate=async(spec,path)=>{
    await field('unit',path.unit);await field('roundedA',format(spec,path.rounded[0]));
    await field('roundedB',format(spec,path.rounded[1]));await field('estimate',format(spec,path.estimate));
   };
   const estimate=async(spec,valid=true)=>{
    const before=await model(spec);await page.locator('[data-x="b11-estimate"]').click();
    const after=await model(spec),selection={unit:before.unit,roundedA:before.roundedA,roundedB:before.roundedB,estimate:before.estimate};
    ok(after.history.length===before.history.length+1,label+' actual estimate button appends exactly one event');
    assert.deepEqual(after.history.at(-1),{action:'b11-estimate',...selection});
    assert.deepEqual(after.first,before.first??selection);
    if(valid){assert.deepEqual(after.locked,selection);ok(after.issue==='',label+' the real estimate locks only after valid rounding');}
    else ok(after.locked===null&&!!after.issue,label+' invalid rounding stays in history and does not lock the estimate');
    return after;
   };
   const setFinal=async(spec,path,swap=false)=>{
    const task=taskFor(spec);await field('answer',format(spec,path.answer));await field('inverseStart',format(spec,path.answer));
    await field('inverseOp',task.op==='+'?'-':'+');await field('inversePart',format(spec,swap?task.a:task.b));
    await field('inverseResult',format(spec,swap?task.b:task.a));
    if(task.claimed!==undefined)await field('judgment',path.claim.judgment);
   };
   const check=async(spec,expected,labelSuffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);
    await page.locator('#actions [data-do="check"]').click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+labelSuffix+' saves exactly one real checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+labelSuffix+' retains original attempt metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(expected?'correct':'revise'),label+' '+labelSuffix+' original result is observed');
    return {name:labelSuffix,model:beforeModel,attempt,record:after};
   };
   const wordsFor=async proof=>{
    ok(await hint.isVisible(),label+' strict feedback appears after the current successful check');
    const words=await hint.innerText();
    ok(proof.display.rounded.every(x=>words.includes(x))&&words.includes(proof.display.estimate),label+' feedback includes the actual recorded rounded values and estimate');
    ok(words.includes('系统')&&words.includes('范围')&&words.includes(proof.display.low)&&words.includes(proof.display.high),label+' interval is attributed to the system with exact bounds');
    ok(words.includes('提交')&&words.includes(proof.display.inverse),label+' inverse equation is attributed to submitted fields');
    ok(words.includes((proof.bounds.lowerInclusive?'不小于':'大于')+' '+proof.display.low)&&words.includes('小于 '+proof.display.high),label+' range wording retains the exact open or closed endpoints');
    if(proof.claim){
     ok(words.includes(proof.display.claim),label+' the actual proposed result is named');
     if(proof.claim.plausible&&!proof.claim.exactCorrect)ok(words.includes(proof.display.answer)&&/不等于|≠|不能.*正确|不保证|不能保证/.test(words),label+' plausible estimate is explicitly distinct from the exact result');
    }
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' no source practice label is invented');
    ok(/长期掌握/.test(words)&&/自由解释|自由文字/.test(words),label+' interpretation remains bounded');return words;
   };

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let cacheReport={ready:false};
   // Playwright waitForFunction must not treat an unresolved Promise as true.
   // Await each evaluation and inspect its actual resolved boolean instead.
   for(let i=0;i<300;i++){
    cacheReport=await page.evaluate(async expected=>{
     const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
     const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,
      state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
     if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return {ready:false,...identity};
     const status=await new Promise(resolve=>{
      const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
      channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
      worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
     return {...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
    },cache);
    if(cacheReport.ready===true)break;await page.waitForTimeout(100);
   }
   const modules=await page.evaluate(async expected=>{
    const store=await caches.open(expected);return Promise.all(['storage.js','learning/estimate-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js',
     'learning/phase5/b11-model.js','learning/phase5/b11-view.js','learning/phase4/async-batches.js',
     'learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};
   offline.push(cacheCheck);ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' current activated controller has all offline dependencies',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP origin stops before every mathematical interaction');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),path=spec.paths[width===1440?0:spec.paths.length-1];
    await open(spec);ok(estimateBinding(task,spec)?.nodeId===spec.nodeId,label+' actual native source matches its reviewed binding');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide begins collapsed');
    ok(await hint.count()===0,label+' no strict feedback precedes interaction');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' optional question opens normally');
    let afterGuide;
    for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    if(spec===cases[0])await shot('01-guide');await guide.locator('summary').click();
    assert.deepEqual(afterGuide.models,beforeGuide.models);
    ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,
     label+' opening the optional guide records support without a mathematical event or checked attempt');
    await setEstimate(spec,path);await estimate(spec);await setFinal(spec,path);
    const ready=await model(spec);ok(ready.history.length===1&&await hint.count()===0,label+' filled inverse fields create no extra interaction and require a check');
    const snapshots=[];await field('answer',format(spec,path.answer+1));snapshots.push(await check(spec,false,'01-wrong-answer'));
    ok(await hint.count()===0,label+' wrong answer cannot receive strict feedback');
    await field('answer',format(spec,path.answer));snapshots.push(await check(spec,true,'02-correct-answer'));
    const first=await model(spec),proof=replayEstimateEvidence(task,first);ok(!!proof,label+' persisted real controls satisfy independent replay');
    assert.equal(proof.unit,path.unit);assert.deepEqual(proof.rounded,path.rounded);assert.equal(proof.estimate,path.estimate);
    assert.deepEqual(proof.claim,path.claim);const words=await wordsFor(proof),correctRecord=await saved(spec.id);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,correctRecord.models);assert.deepEqual((await saved(spec.id)).cases,correctRecord.cases);
    ok(await hint.isVisible(),label+' checked model and complete attempts survive offline reload');
    await field('answer',format(spec,path.answer+1));ok(await hint.count()===0,label+' actual answer edit removes old feedback immediately');
    if(spec===cases[0])await shot('03-edited');await reload(spec);
    ok(await hint.count()===0,label+' reload does not revive a stale check');
    snapshots.push(await check(spec,false,'03-wrong-after-edit'));ok(await hint.count()===0,label+' latest wrong check outranks older correct evidence');
    await field('answer',format(spec,path.answer));snapshots.push(await check(spec,true,'04-correct-after-edit'));await wordsFor(replayEstimateEvidence(task,await model(spec)));
    await field('inverseStart',format(spec,path.answer+1));ok(await hint.count()===0,label+' editing the actual inverse equation invalidates the old feedback');
    await reload(spec);ok(await hint.count()===0,label+' modified inverse equation stays unverified after offline reload');
    await field('inverseStart',format(spec,path.answer));
    if(task.op==='+'){await field('inversePart',format(spec,task.a));await field('inverseResult',format(spec,task.b));}
    else await field('inversePart','+'+format(spec,task.b));
    const revised=await model(spec);ok(!same(revised,first)&&revised.history.length===1,label+' a new submitted equation changes the workpiece without inventing an inverse action');
    ok(await hint.count()===0,label+' revised valid equation still requires its own check');
    snapshots.push(await check(spec,true,'05-rechecked-inverse'));
    const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replayEstimateEvidence(task,finalModel),finalWords=await wordsFor(finalProof);
    ok(end.cases[spec.index].attempts.length===5&&snapshots.length===5,label+' five complete original snapshots are retained');
    for(const [i,snapshot]of snapshots.entries())assert.deepEqual(snapshot.attempt,end.cases[spec.index].attempts[i]);
    assert.deepEqual(finalModel.history,first.history);assert.deepEqual(finalModel.first,first.first);assert.deepEqual(finalModel.locked,first.locked);
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no new score or mastery field is written');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);
    ok(await hint.isVisible(),label+' final new check survives offline restoration');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');await shot('05-verified-offline');
    const stored=await read();fs.writeFileSync(path.join(out,label+'-storage.txt'),stored.raw);fs.writeFileSync(path.join(out,label+'-state.json'),stored.text);
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,path,
     observation:words,finalObservation:finalWords,model:finalModel,attempts:end.cases[spec.index].attempts,snapshots,proof:finalProof});

    // Reopen an empty attempt and really make a rounding error first. The
    // original exercise can be corrected, while strict history stays rejected.
    label=prefix+'-invalid-round-'+spec.id+'-'+spec.index;await open(spec);
    await setEstimate(spec,path);await field('roundedA',format(spec,path.rounded[0]+1));await estimate(spec,false);
    const badFirst=structuredClone((await model(spec)).first);
    await setEstimate(spec,path);await estimate(spec);await setFinal(spec,path);
    const negativeSnapshot=await check(spec,true,'corrected-final-work'),badModel=await model(spec);
    ok(M.valid(task,badModel)&&M.inspect(task,badModel).correct,label+' original correction and completion remain available');
    ok(badModel.history.length===2&&same(badModel.first,badFirst)&&!replayEstimateEvidence(task,badModel)&&await hint.count()===0,
     label+' later correct rounding cannot erase the real invalid first event');
    await reload(spec);assert.deepEqual(await model(spec),badModel);ok(await hint.count()===0,label+' invalid-history exclusion survives offline reload');
    negatives.push({width,height,id:spec.id,index:spec.index,variant:'wrong-round-then-correct',model:badModel,snapshot:negativeSnapshot,originalCorrect:true,strictFeedback:false});
    if(spec===cases[0]||spec.id==='fractionfour')await shot('rejected');
   }

   const accuracy=cases.find(c=>c.id==='checkpurpose'&&c.index===1),fine=accuracy.paths[0];
   label=prefix+'-invalid-accuracy';await open(accuracy);
   await setEstimate(accuracy,{unit:1000,rounded:[48000,23000],estimate:71000});await estimate(accuracy,false);
   await setEstimate(accuracy,fine);await estimate(accuracy);await setFinal(accuracy,fine);
   const accuracySnapshot=await check(accuracy,true,'corrected-finer-unit'),accuracyModel=await model(accuracy);
   ok(!replayEstimateEvidence(taskFor(accuracy),accuracyModel)&&await hint.count()===0,label+' an over-coarse earlier selection stays outside strict evidence');
   negatives.push({width,height,variant:'coarse-then-fine',model:accuracyModel,snapshot:accuracySnapshot});await shot('rejected');

   for(const spec of associatedCases){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,label+' associated task does not inherit a native guide');
    for(const step of M.solveSteps(taskFor(spec))){if(step.field)await field(step.field,step.value);else{assert.equal(step.action,'b11-estimate');await estimate(spec);}}
    const snapshot=await check(spec,true,'associated-original-check');
    ok(await hint.count()===0&&estimateBinding(taskFor(spec),spec)===null,label+' original associated grading remains isolated from native feedback');
    await reload(spec);assert.deepEqual(await model(spec),snapshot.model);ok(await hint.count()===0,label+' associated isolation survives offline restoration');
    isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,snapshot});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===24*2&&isolated.length===6*2,'every reviewed native and associated position completes at both viewports');
  ok(negatives.filter(x=>x.variant==='wrong-round-then-correct').length===24*2,'every native task rejects a real invalid first rounding history at both viewports');
  const result={checks,errors,remote,observations,negatives,isolated,offline,provenance,viewports,
   nativeTasks:cases.length,nativeNodes:new Set(cases.map(c=>c.nodeId)).size,taskViewportPairs:observations.length,
   associatedTasks:associatedCases.length,originStopped:offline.every(x=>x.originStopped)};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log('P9_ESTIMATE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes:result.nativeNodes,taskViewportPairs:observations.length,associatedTasks:associatedCases.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,provenance,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
