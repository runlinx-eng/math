// Real integer place-value removals, followed by genuine down/up exploration.
// Only empty lesson positions are seeded. Correct work and every checked
// snapshot are produced through the existing visible controls, offline.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const fixture=require('./fixtures/p9-place-removal-cases.cjs');
const {cases,associated,sourceHashes}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-place-removal-adapter');
const unboundAdditions=[
 {id:'tensmove',index:0},{id:'tensmove',index:2},{id:'addhundred',index:1},
 {id:'oneslarge',index:2},{id:'tenslarge',index:0},{id:'hundredsmove',index:0},{id:'hundredsmove',index:2}
];
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],unbound=[],offline=[];
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const amount=counts=>counts.reduce((sum,n,i)=>sum+n*10**i,0);
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 childTrial:false,independentTeachingReview:false,seededCorrectWork:false};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const hash=task=>digest(JSON.stringify(stable(task)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {LESSONS}=await import('../dist/learning/catalog.js');
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b11-model.js');
 const {placeBinding,replayPlaceEvidence}=await import('../dist/learning/place-evidence.js');
 const {placeRemovalBinding,replayPlaceRemovalEvidence}=await import('../dist/learning/place-removal-evidence.js');
 const taskFor=spec=>sessionTasks(spec.id)[spec.index];
 for(const spec of [...cases,...associated])assert.equal(hash(taskFor(spec)),spec.taskHash);
 for(const [file,expected]of Object.entries(sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 const actualUnbound=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).map((task,index)=>({id,index,task})))
  .filter(c=>c.task.type==='x-placecalc'&&c.task.op==='+'&&!placeBinding(c.task,{sessionId:c.id,index:c.index}));
 assert.deepEqual(actualUnbound.map(c=>c.id+':'+c.index).sort(),unboundAdditions.map(c=>c.id+':'+c.index).sort());
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
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push({label,error:String(error)}));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const read=()=>page.evaluate(async()=>{
    const {readStored}=await import('./storage.js');return {raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};
   });
   const saved=async id=>{const state=JSON.parse((await read()).text);return state.lessons[id]||state.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const current=window.mathLesson?.snapshot();return current?.id===id&&current.index===index&&current.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,label+' real document reload uses the stopped-origin cache');
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
    await page.goto(base+'learn.html#'+spec.id);
    // Hash navigation has no document response. A seeded index in the same
    // lesson is deliberately awaited only after the following real reload.
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
    await reload(spec);
    const record=await saved(spec.id),current=record.models[spec.index];
    assert.deepEqual(current,M.initial(taskFor(spec)));
    ok(current.history.length===0&&(record.cases[spec.index]?.attempts?.length??0)===0,
     label+' begins with an empty original workpiece and no invented attempt');
   };
   const shot=async suffix=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});
   };
   const snapshot=async suffix=>{
    const stored=await read();fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),stored.raw);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),stored.text);
    return {raw:stored.raw,state:JSON.parse(stored.text)};
   };
   const reveal=async control=>{
    for(let count=0;count<10;count++){
     const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');
     if(!(await closed.count()))return;
     await closed.locator(':scope > summary').click();
    }
    assert.fail('too many nested disclosures');
   };
   const field=async(key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);await reveal(control);
    if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));
    else await control.fill(String(value));
   };
   const controlFor=(name,data={})=>page.locator(`[data-x="${name}"]`+
    Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join(''));
   const action=async(spec,name,data={})=>{
    const task=taskFor(spec),before=await model(spec),expected=structuredClone(before),control=controlFor(name,data);
    await reveal(control);ok(await control.isEnabled(),label+' '+name+' is actually clickable');
    await control.click();M.act(task,expected,name,data);
    const after=await model(spec);assert.deepEqual(after,expected);
    ok(after.history.length===before.history.length+1&&after.history.at(-1)?.action===name,
     label+' '+name+' saves exactly one real original event and the complete expected workpiece');
    if(name==='b11-exchange'){
     assert.equal(amount(after.counts),amount(before.counts));assert.deepEqual(after.history.at(-1).before,before.counts);
     ok(true,label+' actual adjacent-place exchange preserves the whole quantity');
    }
    if(name==='b11-remove'){
     const index=Number(data.index),needed=before.remaining[index];
     assert(needed>0);assert.equal(before.counts[index]-after.counts[index],needed);assert.equal(after.remaining[index],0);
     assert.equal(amount(before.counts)-amount(after.counts),needed*10**index);assert.equal(after.history.at(-1).needed,needed);
     ok(true,label+' actual nonzero removal changes only its place by count times unit');
    }
    return after;
   };
   const disabled=async(spec,name,data,suffix)=>{
    const before=await model(spec),control=controlFor(name,data);await reveal(control);
    ok(await control.isDisabled(),label+' '+suffix+' remains disabled');
    // A disabled button is never clicked, forced or dispatched synthetically.
    assert.deepEqual(await model(spec),before);
    ok(true,label+' inspecting '+suffix+' adds no event or workpiece change');
   };
   const start=async(spec,{misalign=false}={})=>{
    const task=taskFor(spec);await field('guess',width===1440?'0':'1');
    for(let i=0;i<task.values.length;i++)await field('align.'+i,M.rowOffset(task,i));
    let rejectedStart=null;
    if(misalign){
     await field('align.0',M.rowOffset(task,0)+1);
     const failed=await action(spec,'b11-place-start');
     ok(!failed.started&&!!failed.issue,label+' a real wrong alignment refuses to start');
     rejectedStart=structuredClone(failed.history[0]);await field('align.0',M.rowOffset(task,0));
    }
    const begun=await action(spec,'b11-place-start');
    ok(begun.started&&begun.issue==='',label+' correctly aligned original quantities become available');
    assert.equal(amount(begun.counts),task.op==='-'?task.values[0]:M.answer(task));
    if(rejectedStart)assert.deepEqual(begun.history[0],rejectedStart);
    return {model:begun,rejectedStart};
   };
   const direct=async(spec,options={})=>{
    const started=await start(spec,options);
    await disabled(spec,'b11-exchange',{index:0,dir:'up'},'an underfilled column up-exchange');
    await action(spec,'b11-remove',{index:spec.column});
    await disabled(spec,'b11-remove',{index:spec.column},'a completed column removal');
    await field('answer',spec.answer);
    const current=await model(spec);
    ok(!current.history.some(e=>e.action==='b11-exchange'),label+' direct subtraction records no exchange');
    return {model:current,rejectedStart:started.rejectedStart};
   };
   const solve=async spec=>{
    const task=taskFor(spec),expected=M.initial(task);
    for(const step of M.solveSteps(task)){
     if(step.field){
      await field(step.field,step.value);const parts=step.field.split('.');let object=expected;
      for(const key of parts.slice(0,-1))object=object[key];object[parts.at(-1)]=step.value;M.field(task,expected,step.field);
     }else{await action(spec,step.action,step.data);M.act(task,expected,step.action,step.data);}
    }
    assert.deepEqual(await model(spec),expected);return expected;
   };
   const check=async(spec,correct,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);
    await page.locator('#actions [data-do="check"]').click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves exactly one checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',
     label+' '+suffix+' retains original submission metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),
     label+' '+suffix+' exposes the original result');
    assert.equal(M.valid(taskFor(spec),beforeModel),true);assert.equal(M.inspect(taskFor(spec),beforeModel).correct,correct);
    return {name:suffix,model:beforeModel,attempt,record:after,stored:await snapshot(suffix)};
   };
   const wordsFor=async(task,proof)=>{
    ok(!!proof&&await hint.isVisible(),label+' successful current removal has bounded strict feedback');
    const words=await hint.innerText(),compact=words.replace(/\s+/g,'');
    const hasNumber=n=>new RegExp('(?:^|[^0-9])'+n+'(?![0-9])').test(compact);
    for(const n of [proof.values[0],proof.removed,proof.total])ok(hasNumber(n),label+' feedback includes actual starting, removed or remaining quantity '+n);
    for(const removal of proof.removals){
     ok(hasNumber(removal.count)&&hasNumber(removal.quantity)&&compact.includes(M.placeLabel(task,removal.index)),
      label+' feedback identifies the actual removal count, place unit and quantity');
    }
    const noExchange=/(?:0次(?:单位)?交换|(?:没有|未|无需|不需要)(?:发生|进行|做过|做)?(?:过)?(?:单位)?交换)/;
    if(proof.exchanges.length===0)ok(noExchange.test(compact),label+' direct removal explicitly records no exchange');
    else ok(/交换|合并|拆开/.test(compact)&&!noExchange.test(compact),label+' later genuine exchanges are distinguished from the direct path');
    ok(/拿走|取走|减少/.test(words)&&/剩|留下|结果/.test(words),label+' removed and remaining quantities have distinct roles');
    ok(/解释|证明/.test(words)&&/掌握/.test(words),label+' feedback keeps interpretation and mastery limits');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' no mathematical-practice label is borrowed');
    return words;
   };

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let cacheReport={ready:false};const cacheDeadline=Date.now()+30000;
   for(let i=0;i<300&&Date.now()<cacheDeadline;i++){
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
    const store=await caches.open(expected);return Promise.all(['learn.html','storage.js','learning/place-removal-evidence.js',
     'learning/place-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
     'learning/state.js','learning/tasks.js','learning/phase5/b11-model.js','learning/phase5/b11-view.js',
     'learning/phase5/b34.js','learning/phase4/async-batches.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};
   offline.push(cacheCheck);ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' activated current cache contains every required module',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP origin stops before all mathematical operations');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec);await open(spec);
    ok(placeRemovalBinding(task,spec)?.nodeId===spec.nodeId,label+' exact native source is reviewed');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide begins collapsed');
    ok(await hint.count()===0,label+' empty work has no positive evidence');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' optional question opens with its real summary');
    let supported;
    for(let i=0;i<20;i++){supported=await saved(spec.id);if(supported.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    assert.deepEqual(supported.models,beforeGuide.models);
    ok(supported.cases[spec.index]?.support===true&&(supported.cases[spec.index]?.attempts?.length??0)===0,
     label+' guide support invents no operation or submission');
    if(spec===cases[0])await shot('00-guide');await guide.locator('summary').click();
    await direct(spec);ok(await hint.count()===0,label+' real direct removal still requires a check');
    const snapshots=[];
    await field('answer',spec.answer+1);snapshots.push(await check(spec,false,'01-wrong-answer'));
    ok(await hint.count()===0,label+' incorrect answer has no strict feedback');
    await field('answer',spec.answer);snapshots.push(await check(spec,true,'02-direct-correct'));
    const first=await model(spec),proof=replayPlaceRemovalEvidence(task,first);
    assert.ok(proof);assert.equal(proof.exchanges.length,0);assert.equal(proof.up,0);assert.equal(proof.down,0);
    assert.equal(proof.removals.length,1);assert.equal(proof.removed,spec.take);assert.equal(proof.total,spec.answer);
    assert.equal(replayPlaceEvidence(task,first),null);assert.equal(first.history.length,2);
    const words=await wordsFor(task,proof);await shot('02-direct-correct');
    const directRecord=await saved(spec.id);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,directRecord.models);assert.deepEqual((await saved(spec.id)).cases,directRecord.cases);
    ok(await hint.isVisible(),label+' directly checked work restores offline');
    await field('answer',spec.answer+2);ok(await hint.count()===0,label+' editing immediately removes the old check');
    await shot('03-edited');await reload(spec);ok(await hint.count()===0,label+' offline reload cannot restore edited-away evidence');
    snapshots.push(await check(spec,false,'03-wrong-after-edit'));ok(await hint.count()===0,label+' newest failure outranks earlier success');
    await field('answer',spec.answer);snapshots.push(await check(spec,true,'04-correct-after-edit'));
    await wordsFor(task,replayPlaceRemovalEvidence(task,await model(spec)));
    const beforeMoves=await model(spec);
    await action(spec,'b11-exchange',{index:spec.column,dir:'down'});
    ok(await hint.count()===0,label+' actual decomposition invalidates the earlier current submission');
    await reload(spec);ok(await hint.count()===0,label+' unsubmitted decomposition stays without feedback offline');
    await action(spec,'b11-exchange',{index:spec.column-1,dir:'up'});
    const revised=await model(spec);assert.deepEqual(revised.counts,beforeMoves.counts);assert.deepEqual(revised.remaining,beforeMoves.remaining);
    assert.deepEqual(revised.history.slice(0,beforeMoves.history.length),beforeMoves.history);
    ok(revised.history.length===beforeMoves.history.length+2&&!same(revised,first)&&await hint.count()===0,
     label+' returning to the same digits preserves both real exchanges and needs a new check');
    snapshots.push(await check(spec,true,'05-real-exchanges-rechecked'));
    const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replayPlaceRemovalEvidence(task,finalModel);
    assert.ok(finalProof);assert.equal(finalProof.exchanges.length,2);assert.equal(finalProof.up,1);assert.equal(finalProof.down,1);
    assert.equal(finalProof.removals.length,1);assert.equal(finalProof.removed,spec.take);assert.equal(finalProof.total,spec.answer);
    const finalWords=await wordsFor(task,finalProof);
    ok(end.cases[spec.index].attempts.length===5&&snapshots.length===5,label+' all five full checked snapshots survive');
    for(const [i,item]of snapshots.entries())assert.deepEqual(item.attempt,end.cases[spec.index].attempts[i]);
    ok(!Object.hasOwn(finalModel,'board')&&!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),
     label+' original counts/remaining storage has no new board, score or mastery');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);
    ok(await hint.isVisible(),label+' the newly checked full history restores with the source stopped');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    await shot('05-verified-offline');const stored=await snapshot('final');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,
     first,proof,words,snapshots,finalModel,finalProof,finalWords,record:end,stored});
   }

   for(const spec of cases){
    label=prefix+'-invalid-alignment-'+spec.id+'-'+spec.index;const task=taskFor(spec);await open(spec);
    const built=await direct(spec,{misalign:true});
    const checked=await check(spec,true,'correct-after-invalid-alignment'),current=await model(spec);
    assert.deepEqual(current.history[0],built.rejectedStart);assert.equal(current.history.length,3);
    ok(replayPlaceRemovalEvidence(task,current)===null&&await hint.count()===0,label+' actual earlier failed start is not erased by later original success');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' retained invalid history cannot gain evidence offline');await shot('rejected');
    negatives.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,kind:'real-misaligned-start',rejectedStart:built.rejectedStart,checked,stored:await snapshot('retained')});
   }

   for(const spec of associated){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;const task=taskFor(spec);await open(spec);
    ok(placeRemovalBinding(task,{sessionId:spec.id,index:spec.index})===null&&await guide.count()===0,
     label+' independent associated subtraction has no native guide or binding');
    await solve(spec);const checked=await check(spec,true,'associated-original-check');
    ok(await hint.count()===0,label+' original associated completion does not borrow strict native feedback');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' associated source isolation survives stopped-origin restoration');await shot('isolated');
    isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,task,checked,stored:await snapshot('associated-final')});
   }

   for(const spec of unboundAdditions){
    label=prefix+'-unbound-addition-'+spec.id+'-'+spec.index;const task=taskFor(spec);await open(spec);
    ok(placeRemovalBinding(task,{sessionId:spec.id,index:spec.index})===null&&await guide.count()===0,
     label+' addition is outside the reviewed removal scope');
    await solve(spec);const checked=await check(spec,true,'unbound-original-check'),current=await model(spec);
    ok(replayPlaceRemovalEvidence(task,current)===null&&replayPlaceEvidence(task,current)===null&&await hint.count()===0,
     label+' a no-exchange addition answer cannot manufacture removal evidence');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' unbound addition remains isolated offline');
    if(spec===unboundAdditions[0])await shot('isolated');
    unbound.push({width,height,id:spec.id,index:spec.index,taskHash:hash(task),task,checked,stored:await snapshot('unbound-final')});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===12&&negatives.length===12&&isolated.length===18&&unbound.length===14,
   'all six native positives, six real alignment negatives, nine associated and seven unbound positions run in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,unbound,offline,viewports,provenance},null,2));
  console.log('P9_PLACE_REMOVAL_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,negatives:negatives.length,associated:isolated.length,unbound:unbound.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,unbound,offline,viewports,provenance,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
