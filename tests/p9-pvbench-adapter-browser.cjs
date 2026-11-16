// Eleven fixed native B07 benches and eighteen associated benches.
// Original visible prerequisites and Next retain all earlier lesson work.
// No position, model or submission is seeded. Every mathematical control runs
// after the origin stops; real v2 files restore into an independent empty context.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const fixture=require('./fixtures/p9-pvbench-cases.cjs'),{cases,associated}=fixture;
const {navigation}=require('./fixtures/p9-pvbench-navigation.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-pvbench-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],retries=[],negatives=[],isolated=[],offline=[],preparations=[],backups=[];
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,workflow:process.env.GITHUB_WORKFLOW||null,
 sourceHashes:fixture.sourceHashes,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),
 childTrial:false,independentTeachingReview:false,seededCorrectWork:false,seededLessonPosition:false,realBrowserBackupImport:false,backupImportsCompleted:0};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const hash=task=>digest(JSON.stringify(stable(task)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const loopFor=current=>current.u[3]?['down100','up100']:current.u[1]&&current.u[2]<=90?
 ['down1','up1']:current.u[2]>=10?['up1','down1']:['down10','up10'];
const negativeAttempts=item=>item.first?[item.first.attempt,item.wrong.attempt,item.corrected.attempt]:item.wrong?[item.wrong.attempt,item.corrected.attempt]:item.checked?[item.checked.attempt]:[];
const fieldCorrections=[
 {id:'rename',index:0,field:'why',wrong:'pieces',correct:'same',kind:'conservation-choice'},
 {id:'faces1000',index:3,field:'parts.0',wrong:4,correct:400,kind:'expanded-place-value'},
 {id:'problems1000',index:0,field:'packs',wrong:3,correct:23,kind:'whole-tens-not-tens-digit'}
];

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b07-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js');
 const {setField}=await import('../dist/learning/phase4/ui.js');
 const Core=await import('../dist/exploration-core.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};

 const {pvbenchBinding,replayPVBenchEvidence}=await import('../dist/learning/pvbench-evidence.js');
 const {pvbenchEvidenceSteps}=await import('../scripts/pvbench-evidence-fixture.mjs');
 for(const spec of [...cases,...associated])assert.equal(hash(sessionTasks(spec.id)[spec.index]),spec.taskHash);
 for(const spec of navigation){assert.deepEqual(sessionTasks(spec.id)[spec.index],spec.task);assert.equal(hash(spec.task),spec.taskHash);}
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected,file);
 let browser,server,context,restoreContext,activePage,label='setup';const diagnostics=new Map();
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
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});
   restoreContext=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});
   for(const current of [context,restoreContext])current.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage(),restorePage=await restoreContext.newPage();
   for(const current of [page,restorePage]){
    current.setDefaultTimeout(20000);current.on('pageerror',error=>errors.push({label,error:String(error)}));
    diagnostics.set(current,observeBrowserDiagnostics(current,{out,base,label:()=>label}));
   }
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const readPage=current=>current.evaluate(async()=>{const {readStored}=await import('./storage.js');return {raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
   const read=()=>readPage(page);
   const saved=async id=>{const state=JSON.parse((await read()).text);return state.lessons[id]||state.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index],taskFor=spec=>sessionTasks(spec.id)[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},spec);
   const reload=async spec=>{const response=await page.reload();await wait(spec);ok(response?.fromServiceWorker()===true,label+' actual reload uses the stopped-origin cache');};
   const open=async spec=>{
    const current=await page.evaluate(()=>window.mathLesson?.snapshot());
    if(current?.id!==spec.id){
     const beforeURL=new URL(page.url()),target=new URL(base+'learn.html#'+spec.id),response=await page.goto(target.href);
     await wait({id:spec.id,index:0});
     if(response)ok(response.fromServiceWorker()===true,label+' lesson document comes from stopped-origin cache');
     else{assert.equal(beforeURL.origin,target.origin);assert.equal(beforeURL.pathname,target.pathname);assert.notEqual(beforeURL.hash,target.hash);
      ok(true,label+' lesson changes through the existing document hash');}
    }
    let at=(await saved(spec.id)).index;assert.ok(at<=spec.index);
    while(at<spec.index){
     const previous={id:spec.id,index:at},task=taskFor(previous),record=await saved(spec.id);
     if(!record.cases[at]?.attempts?.some(attempt=>Tasks.inspect(task,attempt.value).correct)){
      const prep=navigation.find(x=>x.id===spec.id&&x.index===at);assert.ok(prep,'exact frozen navigation prerequisite');
      const expected=structuredClone(await model(previous));
      for(const step of prep.steps){
       if(step.field){await field(step.field,step.value);setField(expected,step.field,step.value);Engine.fieldExtra(task,expected,step.field);}
       else{await action(step.action,step.data);Engine.actExtra(task,expected,step.action,step.data);}
       assert.deepEqual(await model(previous),expected);assert.equal(Tasks.validModel(task,expected),true);
      }
      assert.equal(Tasks.inspect(task,expected).correct,true);const checked=await check(previous,true,'navigation-prerequisite');
      preparations.push({width,height,...prep,checked,nativePVBenchCoverage:false});
     }
     const before=structuredClone(await saved(spec.id));await page.locator('#actions [data-do="next"]').click();at++;
     await wait({id:spec.id,index:at});const after=await saved(spec.id);assert.deepEqual(after.cases,before.cases);
     for(const [i,value]of Object.entries(before.models))assert.deepEqual(after.models[i],value);
    }
    assert.equal(at,spec.index);const record=await saved(spec.id),currentModel=record.models[spec.index];
    assert.deepEqual(currentModel,M.initial(taskFor(spec)));
    ok(currentModel.history.length===0&&currentModel.saved.length===0&&(record.cases[spec.index]?.attempts?.length??0)===0,label+' starts from empty original work without seeding');
   };
   const resetCurrent=async spec=>{
    const before=await saved(spec.id),button=page.locator('[data-do="p3-retry"]');assert.equal(await button.count(),1);
    await reveal(button);assert.equal(await button.isEnabled(),true);await button.click();await wait(spec);
    const after=await saved(spec.id);assert.deepEqual(after.models[spec.index],M.initial(taskFor(spec)));
    assert.deepEqual(after.cases,before.cases);ok(await hint.count()===0,label+' real retry retains all earlier checked records');
   };
   const shot=async(suffix,current=page)=>{await current.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));await current.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const snapshot=async(suffix,current=page)=>{const stored=await readPage(current);fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),stored.raw);fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),stored.text);return originalState(JSON.parse(stored.text));};
   const reveal=async control=>{for(let count=0;count<10;count++){const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');if(!(await closed.count()))return;await closed.locator(':scope > summary').click();}assert.fail('too many nested disclosures');};
   const field=async(key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);await reveal(control);
    const input=await control.evaluate(e=>({tag:e.tagName,type:e.type,min:e.min,max:e.max,step:e.step}));
    if(input.tag==='SELECT')await control.selectOption(String(value));
    else if(input.type==='range'){
     // Sliders cannot be filled. Real keyboard events update the original
     // input handler, including its touched flag; DOM values are read only.
     const target=Number(value),min=Number(input.min),max=Number(input.max),step=Number(input.step||1);
     assert.ok(target>=min&&target<=max);assert.equal((target-min)%step,0);
     await control.press(target-min<=max-target?'Home':'End');
     let current=Number(await control.inputValue());
     for(let count=0;current!==target&&count<20;count++){
      const before=current;await control.press(current<target?'PageUp':'PageDown');current=Number(await control.inputValue());
      if(current===before||(before-target)*(current-target)<=0)break;
     }
     for(let count=0;current!==target&&count<=(max-min)/step;count++){
      const before=current;await control.press(current<target?'ArrowRight':'ArrowLeft');current=Number(await control.inputValue());
      assert.notEqual(current,before,'a real slider key must move toward the target');
     }
     assert.equal(current,target);
    }else await control.fill(String(value));
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
   const build=async(spec,{detour=false,extraLoops=0}={})=>{
    const task=taskFor(spec),expected=M.initial(task);
    if(task.fixed){
     for(let i=0;i<Number(detour)+extraLoops;i++)for(const kind of loopFor(expected))
      await apply(spec,expected,{action:'pv-swap',data:{kind}});
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
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]),button=page.locator('#actions [data-do="check"]');
    assert.equal(await button.count(),1);ok(await button.isEnabled(),label+' '+suffix+' is a legal visible check');await button.click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    assert.equal(attempts.length,(before.cases[spec.index]?.attempts?.length??0)+1);assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' keeps original attempt metadata');
    originalState(JSON.parse((await read()).text));
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(expected?'correct':'revise'),label+' '+suffix+' observes original grading');
    return {name:suffix,model:beforeModel,attempt,record:after};
   };
   const wordsFor=async(proof,current=page)=>{
    const feedback=current.locator('#thinking-feedback');
    ok(!!proof&&await feedback.isVisible(),label+' current checked successful exchanges receive bounded feedback');
    const words=await feedback.innerText();
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
    ok(await feedback.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' no mathematical-practice label is inferred');
    ok(/长期掌握/.test(words)&&/自由解释|自由文字/.test(words),label+' feedback remains a bounded observation');return words;
   };

   const cacheReady=async(current,role)=>{
    try{
    await current.goto(base+'v2.html#trail');await current.locator('#import-file').waitFor({state:'attached'});
    // The file input is static HTML. The export control is created only after
    // exploration.boot has loaded the atlas and initialized the actual state.
    await current.locator('#main [data-do="export"]').first().waitFor();
    let report={ready:false};
    for(let i=0;i<300;i++){
     report=await current.evaluate(async expected=>{
      const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
      const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,
       state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
      if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return{ready:false,...identity};
      const status=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
       channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
       worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
      });
      return {...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
     },cache);
     if(report.ready)break;await current.waitForTimeout(100);
    }
    const modules=await current.evaluate(async expected=>{
     const store=await caches.open(expected);return Promise.all(['storage.js','v2.html','learn.html','learning/learn.js','exploration-core.js','exploration.js',
      'learning/pvbench-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
      'learning/state.js','learning/tasks.js','learning/phase5/b07-model.js','learning/phase5/b07-view.js','learning/phase5/b07.js','learning/phase5/b39.js',
      'learning/phase4/async-batches.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
    },cache);
    const result={width,height,role,cache,report,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};
    offline.push(result);ok(report.ready&&result.missing.length===0,prefix+' '+role+' activated cache contains every dependency',result);return result;
    }catch(error){activePage=current;error.diagnosticPage=current;throw error;}
   };
   const warmed=await Promise.all([cacheReady(page,'source'),cacheReady(restorePage,'backup-target')]);
   const emptyRestore=JSON.parse((await readPage(restorePage)).text);
   assert.deepEqual(emptyRestore.lessons,{});assert.deepEqual(emptyRestore.daily.bridges,{});
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   for(const report of warmed)report.originStopped=!server.listening;
   ok(!server.listening,prefix+' origin stops before all mathematical interaction and backup restoration');

   const runBoundaries=async currentSpec=>{
   // The original grader accepts one saved same-total representation even when
   // it is not the changed form required by rename:0. The adapter must not.
   if(currentSpec.id==='rename'&&currentSpec.index===0){
    const spec=currentSpec,task=taskFor(spec);label=prefix+'-wrong-saved-target';await resetCurrent(spec);
    await action('pv-save');await action('pv-swap',{kind:'down1'});await field('answer',34);await field('why','same');
    const wrong=await check(spec,true,'saved-start-only');
    ok(M.inspect(task,wrong.model).correct&&replayPVBenchEvidence(task,wrong.model)===null&&await hint.count()===0,
     label+' unchanged final grading does not turn the wrong saved target into evidence');
    await reload(spec);ok(await hint.count()===0,label+' wrong saved target remains excluded offline');await shot('rejected');
    await action('pv-save');ok(await hint.count()===0,label+' adding the target form needs a fresh check');
    const corrected=await check(spec,true,'saved-required-target'),proof=replayPVBenchEvidence(task,corrected.model);await wordsFor(proof);
    assert.deepEqual(corrected.record.cases[spec.index].attempts.at(-2),wrong.attempt);
    const beforeDuplicate=await model(spec);await action('pv-save');assert.deepEqual(await model(spec),beforeDuplicate);
    ok(proof.saved.count===2&&proof.saved.exactTimingKnown===false,label+' duplicate save supplies no extra representation or timing information');
    await reload(spec);assert.deepEqual(await model(spec),beforeDuplicate);await wordsFor(replayPVBenchEvidence(task,await model(spec)));
    await shot('corrected');negatives.push({width,height,kind:'wrong-saved-target',id:spec.id,index:spec.index,wrong,corrected,proof,stored:await snapshot('corrected')});
   }

   // A real enabled click can be ignored by the model's ones capacity. There
   // is deliberately no assertion that this unlogged click was replayed.
   if(currentSpec.id==='problems1000'&&currentSpec.index===0){
    const spec=currentSpec,task=taskFor(spec);label=prefix+'-unlogged-limit-click';await resetCurrent(spec);await build(spec);
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

   // Numeric place values and the conservation choice remain the child's
   // submitted fields. Correcting them must retain the exact earlier attempt
   // and must not invent an additional exchange or an input-event history.
   for(const scenario of fieldCorrections.filter(x=>x.id===currentSpec.id&&x.index===currentSpec.index)){
    const spec=cases.find(c=>c.id===scenario.id&&c.index===scenario.index),task=taskFor(spec);
    label=prefix+'-correction-'+scenario.kind;await resetCurrent(spec);await build(spec);
    const first=await check(spec,true,'first-correct');await wordsFor(replayPVBenchEvidence(task,first.model));
    await field(scenario.field,scenario.wrong);ok(await hint.count()===0,label+' changing a submitted field removes old evidence');
    const wrong=await check(spec,false,'wrong-field');
    ok(await hint.count()===0&&replayPVBenchEvidence(task,wrong.model)===null,label+' real wrong submission remains outside strict evidence');
    await reload(spec);assert.deepEqual(await model(spec),wrong.model);ok(await hint.count()===0,label+' offline wrong field cannot borrow earlier success');
    await field(scenario.field,scenario.correct);ok(await hint.count()===0,label+' a corrected field still needs a new check');
    const corrected=await check(spec,true,'corrected-field'),proof=replayPVBenchEvidence(task,corrected.model),words=await wordsFor(proof);
    assert.deepEqual(corrected.record.cases[spec.index].attempts.slice(-3,-1),[first.attempt,wrong.attempt]);
    assert.deepEqual(corrected.model.history,first.model.history);assert.deepEqual(corrected.model.saved,first.model.saved);
    assert.equal(proof.swapCount,first.model.history.length);assert.equal(proof.inputScope,'stored-numbers');
    await reload(spec);assert.deepEqual((await saved(spec.id)).cases,corrected.record.cases);
    await wordsFor(replayPVBenchEvidence(task,await model(spec)));await shot('retained');
    negatives.push({width,height,kind:scenario.kind,id:spec.id,index:spec.index,first,wrong,corrected,proof,words,stored:await snapshot('retained')});
   }

   // A saved pair made by splitting a hundred has the right total but does not
   // answer the prompt to split one ten. Add the requested representation
   // through visible controls; preserve both early saves and their first check.
   if(currentSpec.id==='problems1000'&&currentSpec.index===2){
    const spec=currentSpec,task=taskFor(spec);
    label=prefix+'-correction-saved-one-ten';await resetCurrent(spec);
    await action('pv-save');await action('pv-swap',{kind:'down10'});await action('pv-save');await field('answer',362);
    const wrong=await check(spec,true,'wrong-saved-pair');
    ok(replayPVBenchEvidence(task,wrong.model)===null&&await hint.count()===0,label+' the original green check cannot turn a hundred split into the requested ten split');
    await reload(spec);assert.deepEqual(await model(spec),wrong.model);ok(await hint.count()===0,label+' wrong saved pair remains excluded offline');
    await action('pv-swap',{kind:'up10'});await action('pv-swap',{kind:'down1'});await action('pv-save');
    ok(await hint.count()===0,label+' the added correct form still requires checking');
    const corrected=await check(spec,true,'corrected-saved-pair'),proof=replayPVBenchEvidence(task,corrected.model),words=await wordsFor(proof);
    assert.deepEqual(corrected.record.cases[spec.index].attempts.at(-2),wrong.attempt);
    assert.deepEqual(corrected.model.saved.slice(0,2),wrong.model.saved);
    assert.deepEqual(corrected.model.history.slice(0,wrong.model.history.length),wrong.model.history);
    assert.deepEqual(corrected.model.u,[3,5,12,0]);assert.equal(proof.saved.count,3);
    assert.equal(proof.saved.goal,'before-after-one-ten');assert.equal(proof.saved.exactTimingKnown,false);
    const beforeDuplicate=await model(spec);await action('pv-save');assert.deepEqual(await model(spec),beforeDuplicate);
    await reload(spec);assert.deepEqual((await saved(spec.id)).cases,corrected.record.cases);await wordsFor(replayPVBenchEvidence(task,await model(spec)));
    await shot('retained');negatives.push({width,height,kind:'saved-one-ten-correction',id:spec.id,index:spec.index,wrong,corrected,proof,words,stored:await snapshot('retained')});
   }

   };

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),detour=width===1280;await open(spec);
   // Insufficient-stock controls are disabled. Observe that state without a
   // forced click or a fabricated failed event.
   if(spec===cases[0]){
    const previousLabel=label;label=prefix+'-disabled-stock';const before=await model(spec);
    const control=page.locator('[data-x="pv-swap"][data-kind="down1"]');await reveal(control);
    ok(await control.isDisabled(),label+' splitting a nonexistent ten is disabled');assert.deepEqual(await model(spec),before);
    ok(before.history.length===0&&await hint.count()===0,label+' a disabled control has produced no exchange evidence');
    await reload(spec);assert.deepEqual(await model(spec),before);await shot('disabled');
    negatives.push({width,height,kind:'disabled-insufficient-stock',id:spec.id,index:spec.index,model:before,stored:await snapshot('disabled')});label=previousLabel;
   }


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

    // The widget has no reset event, but the shared P3 retry is a real visible
    // action. It replaces the current model and preserves previous attempts.
    // Use two extra initial loops so this new work cannot be byte-identical to
    // the fifth snapshot; the original schema has no separate retry epoch.
    const beforeRetry=await saved(spec.id),retryButton=page.locator('[data-do="p3-retry"]');
    assert.equal(await retryButton.count(),1);await reveal(retryButton);
    ok(await retryButton.isEnabled(),label+' shared retry is an enabled visible control');await retryButton.click();await wait(spec);
    const reset=await saved(spec.id);assert.deepEqual(reset.models[spec.index],M.initial(task));assert.deepEqual(reset.cases,beforeRetry.cases);
    ok(await hint.count()===0,label+' retry starts empty while previous checked histories stay in their attempts');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,reset.models);assert.deepEqual((await saved(spec.id)).cases,beforeRetry.cases);
    ok(await hint.count()===0,label+' the empty retry remains unverified after offline restoration');
    const rebuilt=await build(spec,{detour,extraLoops:2});
    assert.notDeepEqual(rebuilt,beforeRetry.models[spec.index]);assert.equal(rebuilt.history.length,beforeRetry.models[spec.index].history.length+2);
    assert.deepEqual((await saved(spec.id)).cases,beforeRetry.cases);ok(await hint.count()===0,label+' a distinct reconstructed path needs a new submission');
    await reload(spec);assert.deepEqual(await model(spec),rebuilt);assert.deepEqual((await saved(spec.id)).cases,beforeRetry.cases);
    ok(await hint.count()===0,label+' reconstructed work cannot borrow the old checked path offline');
    const checked=await check(spec,true,'06-shared-retry'),retryProof=replayPVBenchEvidence(task,checked.model),retryWords=await wordsFor(retryProof);
    assert.equal(checked.record.cases[spec.index].attempts.length,6);
    assert.deepEqual(checked.record.cases[spec.index].attempts.slice(0,5),beforeRetry.cases[spec.index].attempts);
    assert.equal(retryProof.swapCount,rebuilt.history.length);assert.deepEqual(checked.model.history,rebuilt.history);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    await wordsFor(replayPVBenchEvidence(task,await model(spec)));
    if(spec===cases[0]||spec.savedGoal)await shot('06-shared-retry');
    retries.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,task,before:beforeRetry,reset,rebuilt,checked,proof:retryProof,words:retryWords,stored:await snapshot('retry-final')});
    await runBoundaries(spec);
   }

   const nativeBefore=structuredClone(JSON.parse((await read()).text).lessons);
   for(const spec of associated){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);
    ok(pvbenchBinding(taskFor(spec),spec)===null&&await guide.count()===0,label+' associated task has no borrowed native source binding');
    await build(spec,{detour:spec.fixed&&width===1280});const checked=await check(spec,true,'associated-original-check');
    ok(await hint.count()===0,label+' successful associated mathematics remains outside native feedback');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' offline restoration preserves associated isolation');
    assert.deepEqual(JSON.parse((await read()).text).lessons,nativeBefore);
    if(spec===associated[0])await shot('isolated');
    isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,checked,stored:await snapshot('associated')});
   }
   label=prefix+'-actual-v2-backup';await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   await page.locator('#main [data-do="export"]').first().waitFor();
   const download=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const exported=await download;
   const backupPath=path.join(out,label+'.json');await exported.saveAs(backupPath);const payload=fs.readFileSync(backupPath,'utf8'),backup=JSON.parse(payload);
   assert.equal(backup.version,2);assert.deepEqual(backup.state,JSON.parse((await read()).text));originalState(backup.state);
   for(const spec of cases){
    const record=backup.state.lessons[spec.id],observed=observations.find(x=>x.width===width&&x.id===spec.id&&x.index===spec.index),retry=retries.find(x=>x.width===width&&x.id===spec.id&&x.index===spec.index);
    const extra=negatives.filter(x=>x.width===width&&x.id===spec.id&&x.index===spec.index),attempts=[...observed.snapshots.map(x=>x.attempt),retry.checked.attempt,...extra.flatMap(negativeAttempts)];
    const expectedCount=6+({'rename:0':5,'problems1000:0':4,'problems1000:2':2,'faces1000:3':3}[spec.id+':'+spec.index]||0);
    assert.equal(attempts.length,expectedCount);assert.deepEqual(record.cases[spec.index].attempts,attempts);
    assert.deepEqual(attempts.slice(0,6).map(x=>Tasks.inspect(taskFor(spec),x.value).correct),[false,true,false,true,true,true]);
    assert.ok(replayPVBenchEvidence(taskFor(spec),record.models[spec.index]));assert.deepEqual(record.models[spec.index],attempts.at(-1).value);
   }
   for(const item of isolated.filter(x=>x.width===width))assert.deepEqual(backup.state.daily.bridges[item.id].cases[item.index].attempts,[item.checked.attempt]);
   for(const prep of preparations.filter(x=>x.width===width))assert.deepEqual((backup.state.lessons[prep.id]||backup.state.daily.bridges[prep.id]).cases[prep.index].attempts,[prep.checked.attempt]);
   ok(true,label+' actual download retains every original incomplete check, error, correction, retry, limit case and current work');await shot('exported');
   activePage=restorePage;const targetResponse=await restorePage.reload();await restorePage.locator('#import-file').waitFor({state:'attached'});
   await restorePage.locator('#main [data-do="export"]').first().waitFor();
   ok(targetResponse?.fromServiceWorker()===true,label+' independent empty import target reloads from stopped-origin cache');
   const empty=originalState(JSON.parse((await readPage(restorePage)).text));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
   const importFile=async filename=>{
    await restorePage.locator('#import-file').setInputFiles({name:filename,mimeType:'application/json',buffer:Buffer.from(payload)});
    await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    ok((await restorePage.locator('#toast').innerText()).includes('备份已合并'),label+' real file input completes the original backup merge');
   };
   await importFile('pvbench-real-browser-v2.json');const restored=await readPage(restorePage),restoredState=JSON.parse(restored.text);
   assert.deepEqual(restoredState,backup.state);originalState(restoredState);
   provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   for(const spec of cases){const value=restoredState.lessons[spec.id].models[spec.index];assert.ok(replayPVBenchEvidence(taskFor(spec),value));}
   const firstImportFile=label+'-first-import-storage.txt';fs.writeFileSync(path.join(out,firstImportFile),restored.raw);
   await importFile('pvbench-identical-repeat-v2.json');const repeated=await readPage(restorePage);assert.equal(repeated.raw,restored.raw);
   assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);provenance.backupImportsCompleted++;
   const repeatedImportFile=label+'-repeated-import-storage.txt';fs.writeFileSync(path.join(out,repeatedImportFile),repeated.raw);
   ok(true,label+' first import preserves the complete state and repeated import is byte-idempotent');
   const restoreSpec=cases.at(-1),lessonResponse=await restorePage.goto(base+'learn.html#'+restoreSpec.id);
   await restorePage.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},restoreSpec);
   ok(lessonResponse?.fromServiceWorker()===true,label+' imported lesson opens from stopped-origin cache');
   const afterOpen=JSON.parse((await readPage(restorePage)).text),restoredRecord=afterOpen.lessons[restoreSpec.id];
   assert.deepEqual(restoredRecord.models,backup.state.lessons[restoreSpec.id].models);assert.deepEqual(restoredRecord.cases,backup.state.lessons[restoreSpec.id].cases);
   const restoredProof=replayPVBenchEvidence(taskFor(restoreSpec),restoredRecord.models[restoreSpec.index]);assert.ok(restoredProof);
   const restoredWords=await wordsFor(restoredProof,restorePage);await shot('restored',restorePage);const restoredSnapshot=await snapshot('restored',restorePage);
   backups.push({width,height,file:path.basename(backupPath),bytes:Buffer.byteLength(payload),sha256:digest(payload),
    originalState:backup.state,restoredState,restoredSnapshot,restoredProof,restoredWords,independentEmptyContext:true,
    firstImportRaw:{file:firstImportFile,bytes:Buffer.byteLength(restored.raw),sha256:digest(restored.raw)},
    repeatedImportRaw:{file:repeatedImportFile,bytes:Buffer.byteLength(repeated.raw),sha256:digest(repeated.raw)},
    originStopped:!server.listening,nativeCases:cases.length,associatedCases:18,navigationPrerequisites:navigation.length,importsCompleted:2,idempotent:true});
   await context.close();context=null;await restoreContext.close();restoreContext=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===22&&retries.length===22&&isolated.length===36,'all eleven native, shared retries and eighteen associated positions ran in both viewports');
  ok(negatives.length===14,'all seven correction or unavailable-action boundaries ran in both viewports');
  ok(preparations.length===12&&backups.length===2&&provenance.backupImportsCompleted===4,'both viewports complete six visible prerequisites and first plus repeated real backup import');
  const attemptCounts={native:observations.reduce((sum,item)=>sum+item.snapshots.length,0)+retries.length+negatives.reduce((sum,item)=>sum+negativeAttempts(item).length,0),associated:isolated.length,navigationPrerequisites:preparations.length};
  assert.deepEqual(attemptCounts,{native:160,associated:36,navigationPrerequisites:12});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,retries,negatives,isolated,offline,preparations,backups,viewports,provenance,attemptCounts},null,2));
  console.log('P9_PVBENCH_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,retries:retries.length,associated:isolated.length,negatives:negatives.length,backups:backups.length,navigationPrerequisites:preparations.length,attemptCounts}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  const failureDiagnostic=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(diagnosticError=>({diagnosticError:String(diagnosticError)})):null;
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,retries,negatives,isolated,offline,preparations,backups,viewports,provenance,error:String(error),stack:error.stack,at:label,failureDiagnostic},null,2));console.error(error.stack);process.exitCode=1;
 }finally{if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});if(context)await context.close();if(restoreContext)await restoreContext.close();if(browser)await browser.close();}
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
