// Eleven fixed native B07 benches and eighteen associated benches. Only empty
// lesson positions are seeded; every swap/save/build/input/check uses real UI.
// The HTTP origin stops before all mathematical work and actual document reloads.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const fixture=require('./fixtures/p9-pvbench-cases.cjs'),{cases,associated}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-pvbench-adapter');
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
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const hash=task=>digest(JSON.stringify(stable(task)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const loopFor=current=>current.u[3]?['down100','up100']:current.u[1]&&current.u[2]<=90?
 ['down1','up1']:current.u[2]>=10?['up1','down1']:['down10','up10'];

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b07-model.js');
 const {pvbenchBinding,replayPVBenchEvidence}=await import('../dist/learning/pvbench-evidence.js');
 const {pvbenchEvidenceSteps}=await import('../scripts/pvbench-evidence-fixture.mjs');
 for(const spec of [...cases,...associated])assert.equal(hash(sessionTasks(spec.id)[spec.index]),spec.taskHash);
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected,file);
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
   const taskFor=spec=>sessionTasks(spec.id)[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const current=window.mathLesson?.snapshot();return current?.id===id&&current.index===index&&current.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,label+' real reload uses the stopped-origin document cache');
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
    // A same-document hash navigation has no response. A seeded different index
    // in the same lesson is loaded only by the following actual reload.
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
    await reload(spec);
    const record=await saved(spec.id),current=record.models[spec.index];
    assert.deepEqual(current,M.initial(taskFor(spec)));
    ok(current.history.length===0&&current.saved.length===0&&(record.cases[spec.index]?.attempts?.length??0)===0,
     label+' starts with empty original work and no invented checked snapshots');
   };
   const shot=async suffix=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});
   };
   const snapshot=async suffix=>{
    const stored=await read();fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),stored.raw);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),stored.text);return JSON.parse(stored.text);
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
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const control=page.locator(`[data-x="${name}"]${suffix}`);await reveal(control);
    ok(await control.isEnabled(),label+' real control is enabled: '+name+' '+JSON.stringify(data));await control.click();
   };
   const apply=async(spec,expected,step)=>{
    const task=taskFor(spec);
    if(step.field){
     await field(step.field,step.value);const [key,index]=step.field.split('.');
     if(index===undefined)expected[key]=step.value;else expected[key][index]=step.value;M.field(task,expected,step.field);
    }else{await action(step.action,step.data);M.act(task,expected,step.action,step.data);}
    assert.deepEqual(await model(spec),expected,'actual original model matches every complete control step');
   };
   const build=async(spec,{detour=false}={})=>{
    const task=taskFor(spec),expected=M.initial(task);
    if(task.fixed){
     if(detour)for(const kind of loopFor(expected))await apply(spec,expected,{action:'pv-swap',data:{kind}});
     for(const step of pvbenchEvidenceSteps(task))await apply(spec,expected,step);
    }else{
     // All reviewed nonfixed bridge positions here use ordinary blocks and
     // numeric parts. They remain unbound because add clicks have no history.
     ok(!task.forms&&!task.words&&!task.position&&!task.chart&&!task.saveCount,label+' reviewed bridge uses the inspected ordinary block controls');
     const counts=[Math.floor(task.n/100),Math.floor(task.n/10)%10,task.n%10];
     for(let index=0;index<counts.length;index++)for(let i=0;i<counts[index];i++)
      await apply(spec,expected,{action:'pv-add',data:{index,delta:1}});
     await apply(spec,expected,{field:'answer',value:task.n});
     if(task.expanded)for(const [i,value]of [counts[0]*100,counts[1]*10,counts[2]].entries())
      await apply(spec,expected,{field:'parts.'+i,value});
     if(task.why)await apply(spec,expected,{field:'why',value:task.why});
    }
    ok(M.valid(task,expected)&&M.inspect(task,expected).correct,label+' actual original controls finish the source task');return expected;
   };
   const check=async(spec,expected,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);
    await page.locator('#actions [data-do="check"]').click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves exactly one actual checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' retains original attempt metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(expected?'correct':'revise'),label+' '+suffix+' original grading result is observed');
    return {name:suffix,model:beforeModel,attempt,record:after};
   };
   const wordsFor=async proof=>{
    ok(!!proof&&await hint.isVisible(),label+' current checked successful exchanges receive bounded feedback');
    const words=await hint.innerText();
    ok(words.includes(String(proof.total))&&words.includes(String(proof.swapCount))&&/记录/.test(words)&&/成功/.test(words)&&/交换|换装/.test(words),
     label+' feedback identifies the total and the count of recorded successful exchanges');
    ok(!/所有点击都|全部点击都|每次点击都.{0,12}(?:验证|正确|成功)/.test(words),label+' feedback does not claim to audit unlogged clicks');
    if(proof.saved){
     ok(/保存|留下|留存/.test(words)&&words.includes(String(proof.saved.count)),label+' feedback refers to the real retained representations');
     ok(!/第\s*\d+\s*次交换后保存|紧接着.{0,8}保存/.test(words),label+' saving has no invented exact place in the exchange timeline');
     ok(proof.saved.exactTimingKnown===false&&proof.saved.compatibleWithRecordedPath===true,label+' proof explicitly limits save evidence to compatibility');
    }
    if(proof.submitted.packReport){
     ok(words.includes(String(proof.submitted.packReport.packs))&&words.includes(String(proof.submitted.packReport.remainder))&&/包|整十/.test(words),
      label+' full tens packages and ones remainder stay distinct');
     ok(!/十位(?:数字)?(?:是|为)?\s*23/.test(words),label+' twenty-three tens are not called a tens-place digit');
    }
    if(proof.submitted.expanded)ok(proof.submitted.expanded.every(value=>words.includes(String(value)))&&/提交|写下|填写/.test(words),
     label+' expanded values are identified as submitted values');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' no mathematical-practice label is inferred');
    ok(/长期掌握/.test(words)&&/自由解释|自由文字/.test(words),label+' feedback remains a bounded observation');return words;
   };

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let cacheReport={ready:false};
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
    const store=await caches.open(expected);return Promise.all(['storage.js','learn.html','learning/learn.js',
     'learning/pvbench-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
     'learning/state.js','learning/tasks.js','learning/phase5/b07.js','learning/phase5/b07-model.js','learning/phase5/b07-view.js',
     'learning/phase4/async-batches.js','learning/phase5/b39.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};
   offline.push(cacheCheck);ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' current activated controller has every offline dependency',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP origin stops before all mathematical actions');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),detour=width===1280;await open(spec);
    ok(pvbenchBinding(task,spec)?.nodeId===spec.nodeId,label+' native position retains its exact reviewed source');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide begins collapsed');
    ok(await hint.count()===0,label+' initial quantities do not invent performed exchanges');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' the optional question opens through its real summary');
    let afterGuide;
    for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    if(spec===cases[0])await shot('01-guide');await guide.locator('summary').click();
    assert.deepEqual(afterGuide.models,beforeGuide.models);
    ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,
     label+' guide support creates no exchange, save or submission');
    await build(spec,{detour});ok(await hint.count()===0,label+' completed construction still needs a real check');
    const snapshots=[];await field('answer',task.n-1);snapshots.push(await check(spec,false,'01-wrong-answer'));
    ok(await hint.count()===0,label+' an incorrect numeric answer earns no strict feedback');
    await field('answer',task.n);snapshots.push(await check(spec,true,'02-correct-answer'));
    const first=await model(spec),proof=replayPVBenchEvidence(task,first),words=await wordsFor(proof);
    assert.deepEqual(proof.final,spec.final);assert.equal(proof.total,spec.n);
    assert.equal(proof.swapCount,spec.actions.filter(a=>a!=='save').length+(detour?2:0));
    assert.equal(proof.saved?.goal??null,spec.savedGoal);
    const correct=await saved(spec.id);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,correct.models);assert.deepEqual((await saved(spec.id)).cases,correct.cases);
    ok(await hint.isVisible(),label+' complete checked exchanges and saved forms restore offline');
    await field('answer',task.n-1);ok(await hint.count()===0,label+' editing the total removes stale strict feedback');
    if(spec===cases[0])await shot('03-edited');await reload(spec);ok(await hint.count()===0,label+' edited draft stays unverified after offline reload');
    snapshots.push(await check(spec,false,'03-wrong-after-edit'));
    ok(await hint.count()===0,label+' newest wrong check cannot borrow an earlier successful observation');
    await field('answer',task.n);snapshots.push(await check(spec,true,'04-correct-after-edit'));await wordsFor(replayPVBenchEvidence(task,await model(spec)));
    const beforeLoop=await model(spec),[outward,back]=loopFor(beforeLoop);
    await action('pv-swap',{kind:outward});const displaced=await model(spec);
    ok(!same(displaced.u,beforeLoop.u)&&displaced.history.length===beforeLoop.history.length+1,label+' a real exchange changes the representation');
    ok(await hint.count()===0,label+' new mathematics needs a fresh check even when the total is conserved');
    await reload(spec);assert.deepEqual(await model(spec),displaced);ok(await hint.count()===0,label+' the new unsubmitted exchange restores without stale evidence');
    await action('pv-swap',{kind:back});const returned=await model(spec);
    assert.deepEqual(returned.u,beforeLoop.u);assert.deepEqual(returned.saved,beforeLoop.saved);
    assert.deepEqual(returned.history.slice(0,beforeLoop.history.length),beforeLoop.history);
    ok(returned.history.length===beforeLoop.history.length+2&&await hint.count()===0,label+' reversing an exchange retains both real events and still requires checking');
    snapshots.push(await check(spec,true,'05-rechecked-real-exchanges'));
    const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replayPVBenchEvidence(task,finalModel),finalWords=await wordsFor(finalProof);
    assert.equal(finalProof.swapCount,proof.swapCount+2);assert.equal(end.cases[spec.index].attempts.length,5);
    for(const [i,item]of snapshots.entries())assert.deepEqual(item.attempt,end.cases[spec.index].attempts[i]);
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no new score or mastery state is written');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);
    ok(await hint.isVisible(),label+' latest checked mathematics and all five attempts restore from the stopped origin');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    await shot('05-verified-offline');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,detour,
     first,proof,words,snapshots,finalModel,finalProof,finalWords,record:end,stored:await snapshot('final')});
   }

   // The original grader accepts one saved same-total representation even when
   // it is not the changed form required by rename:0. The adapter must not.
   {
    const spec=cases.find(c=>c.id==='rename'&&c.index===0),task=taskFor(spec);label=prefix+'-wrong-saved-target';await open(spec);
    await action('pv-save');await action('pv-swap',{kind:'down1'});await field('answer',34);await field('why','same');
    const wrong=await check(spec,true,'saved-start-only');
    ok(M.inspect(task,wrong.model).correct&&replayPVBenchEvidence(task,wrong.model)===null&&await hint.count()===0,
     label+' unchanged final grading does not turn the wrong saved target into evidence');
    await reload(spec);ok(await hint.count()===0,label+' wrong saved target remains excluded offline');await shot('rejected');
    await action('pv-save');ok(await hint.count()===0,label+' adding the target form needs a fresh check');
    const corrected=await check(spec,true,'saved-required-target'),proof=replayPVBenchEvidence(task,corrected.model);await wordsFor(proof);
    assert.deepEqual(corrected.record.cases[spec.index].attempts[0],wrong.attempt);
    const beforeDuplicate=await model(spec);await action('pv-save');assert.deepEqual(await model(spec),beforeDuplicate);
    ok(proof.saved.count===2&&proof.saved.exactTimingKnown===false,label+' duplicate save supplies no extra representation or timing information');
    await reload(spec);assert.deepEqual(await model(spec),beforeDuplicate);await wordsFor(replayPVBenchEvidence(task,await model(spec)));
    await shot('corrected');negatives.push({width,height,kind:'wrong-saved-target',id:spec.id,index:spec.index,wrong,corrected,proof,stored:await snapshot('corrected')});
   }

   // A real enabled click can be ignored by the model's ones capacity. There
   // is deliberately no assertion that this unlogged click was replayed.
   {
    const spec=cases.find(c=>c.id==='problems1000'&&c.index===0),task=taskFor(spec);label=prefix+'-unlogged-limit-click';await open(spec);await build(spec);
    for(let i=0;i<9;i++)await action('pv-swap',{kind:'down1'});
    const before=await model(spec);assert.deepEqual(before.u,[0,14,96,0]);
    const control=page.locator('[data-x="pv-swap"][data-kind="down1"]');ok(await control.isEnabled(),label+' original UI exposes the enabled capacity-boundary control');
    await action('pv-swap',{kind:'down1'});const after=await model(spec);assert.deepEqual(after,before);
    ok(after.history.length===11,label+' the ignored tenth split creates no mathematical event');
    await reload(spec);assert.deepEqual(await model(spec),after);
    for(let i=0;i<9;i++)await action('pv-swap',{kind:'up1'});
    const checked=await check(spec,true,'restored-after-ignored-click'),proof=replayPVBenchEvidence(task,checked.model),words=await wordsFor(proof);
    assert.equal(proof.swapCount,20);assert.equal(proof.swaps.filter(s=>s.kind==='down1').length,9);
    ok(proof.historyScope==='successful-swaps-only',label+' only recorded successful exchanges are verified');
    await reload(spec);assert.deepEqual(await model(spec),checked.model);await wordsFor(replayPVBenchEvidence(task,await model(spec)));
    await shot('bounded');negatives.push({width,height,kind:'unlogged-capacity-click',id:spec.id,index:spec.index,before,after,checked,proof,words,stored:await snapshot('bounded')});
   }

   // Insufficient-stock controls are disabled. Observe that state without a
   // forced click or a fabricated failed event.
   {
    const spec=cases[0];label=prefix+'-disabled-stock';await open(spec);const before=await model(spec);
    const control=page.locator('[data-x="pv-swap"][data-kind="down1"]');await reveal(control);
    ok(await control.isDisabled(),label+' splitting a nonexistent ten is disabled');assert.deepEqual(await model(spec),before);
    ok(before.history.length===0&&await hint.count()===0,label+' a disabled control has produced no exchange evidence');
    await reload(spec);assert.deepEqual(await model(spec),before);await shot('disabled');
    negatives.push({width,height,kind:'disabled-insufficient-stock',id:spec.id,index:spec.index,model:before,stored:await snapshot('disabled')});
   }

   for(const spec of associated){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);
    ok(pvbenchBinding(taskFor(spec),spec)===null&&await guide.count()===0,label+' associated task has no borrowed native source binding');
    await build(spec,{detour:spec.fixed&&width===1280});const checked=await check(spec,true,'associated-original-check');
    ok(await hint.count()===0,label+' successful associated mathematics remains outside native feedback');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' offline restoration preserves associated isolation');
    if(spec===associated[0])await shot('isolated');
    isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,checked,stored:await snapshot('associated')});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===22&&isolated.length===36,'all eleven native and eighteen associated positions ran in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance},null,2));
  console.log('P9_PVBENCH_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,negatives:negatives.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
