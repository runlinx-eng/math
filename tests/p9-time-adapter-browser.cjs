// Real B32 controls and original checks. Only empty lesson positions are seeded;
// literal reviewed plans supply independent expectations, never the B32 solver.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const {cases,excludedCases,associatedCases}=require('./fixtures/p9-time-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-time-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],isolated=[],excluded=[],retries=[],offline=[];
const ok=(value,label,detail={})=>{assert.ok(value,label);checks.push({label,...detail});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),cp=structuredClone;
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,childTrial:false,independentTeachingReview:false,seededCorrectWork:false};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>crypto.createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b32-model.js');
 const {currentSubmission}=await import('../dist/learning/state.js');
 const {timeBinding,replayTimeEvidence:replay}=await import('../dist/learning/time-evidence.js');
 const {studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const taskFor=c=>sessionTasks(c.id)[c.index];
 for(const c of [...cases,...excludedCases,...associatedCases])assert.equal(hash(taskFor(c)),c.taskHash);
 let browser,server,context,activePage,diagnostics,label='setup';
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  for(const [width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   diagnostics=observeBrowserDiagnostics(page,{out,base,label:()=>label});
   page.on('pageerror',error=>errors.push({label,error:String(error)}));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const read=()=>page.evaluate(async()=>{const {readStored}=await import('./storage.js');return {raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
   const saved=async id=>{const state=JSON.parse((await read()).text);return state.lessons[id]||state.daily.bridges[id];};
   const model=async c=>(await saved(c.id)).models[c.index];
   const wait=c=>page.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},c);
   const reload=async c=>{const response=await page.reload();await wait(c);ok(response?.fromServiceWorker()===true,label+' real reload uses the stopped-origin service worker');};
   const snapshot=async suffix=>{
    const value=await read(),stem=label+'-'+suffix;fs.writeFileSync(path.join(out,stem+'-storage.txt'),value.raw);fs.writeFileSync(path.join(out,stem+'-state.json'),value.text);
    return {raw:stem+'-storage.txt',state:stem+'-state.json'};
   };
   const shot=async suffix=>{await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const open=async c=>{
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')]);
     const state=fresh(),record=freshLesson(id);record.index=index;record.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=record;else state.lessons[id]=record;
     localStorage.setItem(KEY,JSON.stringify(state));
    },c);
    await page.goto(base+'learn.html#'+c.id);await reload(c);
    const record=await saved(c.id),m=record.models[c.index];
    assert.deepEqual(m,M.initial(taskFor(c)));
    ok((record.cases[c.index]?.attempts?.length??0)===0,label+' starts with an empty current workpiece and zero checks');
    const expected=studyActionFocus({task:taskFor(c),model:m}).readyToCheck;
    ok(await page.locator('#actions [data-do="check"]').isEnabled()===expected,label+' actual empty-work check availability agrees with existing studyActionFocus');
   };
   const reveal=async control=>{
    for(let i=0;i<10;i++){
     const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');
     if(!(await closed.count()))return;await closed.locator(':scope > summary').click();
    }
    assert.fail('too many nested disclosures');
   };
   const field=async(c,key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1,label+' one actual field '+key);await reveal(control);
    const before=await model(c),expected=cp(before),tag=await control.evaluate(e=>e.tagName);
    if(tag==='SELECT')await control.selectOption(String(value));
    else if(await control.getAttribute('type')==='range'){
     // Actual keyboard operations, not a scripted assignment of range.value.
     await control.focus();await control.press('Home');for(let i=0;i<Number(value);i++)await control.press('ArrowRight');
     const after=await model(c);assert.equal(after[key],String(value));assert.deepEqual(after.history.slice(0,before.history.length),before.history);return after;
    }else await control.fill(String(value));
    const [k,index]=key.split('.');if(index===undefined)expected[k]=String(value);else expected[k][Number(index)]=String(value);
    M.field(taskFor(c),expected,key);assert.deepEqual(await model(c),expected);return expected;
   };
   const action=async(c,name,data={})=>{
    const suffix=Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join(''),control=page.locator(`[data-x="${name}"]${suffix}`);
    assert.equal(await control.count(),1,label+' one actual action '+name+suffix);await reveal(control);
    const before=await model(c),expected=cp(before);await control.click();M.act(taskFor(c),expected,name,data);
    const after=await model(c);assert.deepEqual(after,expected);assert.deepEqual(after.history.slice(0,before.history.length),before.history);
    ok(after.history.length===before.history.length+1,label+' original visible action appends its exact raw event');return after;
   };
   const act=(c,a,index)=>action(c,'t32-'+a,index===undefined?{}:{index});
   const fillAnswers=async c=>{for(const [i,v]of c.answers.entries())await field(c,'answers.'+i,v);};
   const plan=async c=>{
    for(const s of c.actions){
     if(s.field)await field(c,s.field,s.value);
     else{
      const data=cp(s.data||{});
      if(width===1280&&s.action==='t32-part'&&!taskFor(c).requiredParts)data.index=taskFor(c).parts-1;
      await action(c,s.action,data);
     }
    }
   };
   const repair=async c=>{
    const kind=c.type.slice(6),t=taskFor(c);
    if(['roman','order','steps'].includes(kind))await act(c,'clear');
    if(kind==='parts')for(const i of (await model(c)).board.selected)await act(c,'part',i);
    if(kind==='stopwatch'){
     if(!(await model(c)).board.stopped){
      await act(c,'start');let current=await model(c);
      while(current.board.elapsed<c.expected.durationSeconds){const left=c.expected.durationSeconds-current.board.elapsed;current=await act(c,'tick',left>=30?30:10);}
      await act(c,'stop');
     }
     await fillAnswers(c);
    }else await plan(c);
    ok(M.inspect(t,await model(c)).correct,label+' original mathematical completion remains unchanged');
   };
   const wrong=async c=>{
    const kind=c.type.slice(6),t=taskFor(c);
    if(kind==='roman'){await act(c,'pick',4);await act(c,'place',5);await act(c,'place',5);}
    if(kind==='order'){
     const reverse=[...c.expected.orderedIdentities].reverse();for(const i of reverse)await act(c,'order',i);await act(c,'order',reverse[0]);
    }
    if(kind==='parts'){if(t.requiredParts)await act(c,'part',1);else{await act(c,'part',0);await act(c,'part',1);}}
    if(kind==='stopwatch'){await act(c,'tick',10);await act(c,'start');await act(c,'tick',10);await act(c,'stop');}
    if(kind==='steps'){await field(c,'jump','-0 1/2');await act(c,'move');}
    await fillAnswers(c);ok(!M.inspect(t,await model(c)).correct,label+' first actual construction is wrong under the original grader');
   };
   const check=async(c,correct,suffix)=>{
    const before=await saved(c.id),beforeModel=cp(before.models[c.index]),control=page.locator('#actions [data-do="check"]');
    await reveal(control);ok(await control.isEnabled(),label+' '+suffix+' original check control is enabled');await control.click();
    const after=await saved(c.id),attempts=after.cases[c.index].attempts,attempt=attempts.at(-1);
    assert.deepEqual(attempts.slice(0,-1),before.cases[c.index]?.attempts??[]);assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[c.index],beforeModel);
    ok(attempts.length===(before.cases[c.index]?.attempts?.length??0)+1,label+' '+suffix+' saves exactly one original checked snapshot');
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' retains original check metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' shows the actual original result');
    return {name:suffix,model:beforeModel,attempt,record:after,storage:await snapshot(suffix)};
   };
   const assertMath=(c,m,p)=>{
    assert.ok(p);const x=p.construction,e=c.expected;
    if(p.kind==='roman'){assert.deepEqual(m.board.placed,Array.from({length:12},(_,i)=>i));assert.equal(x.four,4);}
    if(p.kind==='order'){assert.deepEqual(m.board.order,e.orderedIdentities);assert.deepEqual(x.labels,e.orderedLabels);}
    if(p.kind==='parts'){
     assert.equal(m.board.selected.length,e.selectedCount);if(e.requiredIdentities)assert.deepEqual(m.board.selected,e.requiredIdentities);
     assert.equal(x.unitPart,e.unitPartAmount);assert.equal(x.amount,e.selectedAmount);
    }
    if(p.kind==='stopwatch'){assert.equal(m.board.elapsed,e.durationSeconds);assert.equal(x.minutes,e.totalMinutes);assert.equal(x.ticks.reduce((sum,n)=>sum+BigInt(n),0n),BigInt(e.durationSeconds));}
    if(p.kind==='steps'){
     assert.deepEqual(m.board.moves,e.exampleChosenSegments);assert.deepEqual([x.segments[0].from,...x.segments.map(s=>s.to)],e.balances);
     assert.deepEqual([x.startClock,...x.segments.map(s=>s.toClock)],e.displayedClocks);
    }
    assert.deepEqual(m.answers,c.answers);
   };
   const wordsFor=async(c,p)=>{
    ok(!!p&&await hint.isVisible(),label+' latest exact current construction has strict feedback');
    const words=await hint.innerText();ok(/自由解释/.test(words)&&/长期掌握/.test(words),label+' interpretation stays bounded');
    ok(!/MP\.\d|已掌握/.test(words)&&await hint.locator('[data-thinking-node-id]').count()===0,label+' no invented method or mastery label');
    if(p.kind==='stopwatch')ok(words.includes('模拟')&&words.includes('没有据此评价真实活动计时'),label+' timing is explicitly a simulation');
    if(p.kind==='parts')ok(words.includes('等分来自工具')&&words.includes(p.construction.amount),label+' partition and selected quantity have distinct attribution');
    if(p.kind==='steps')ok(words.includes('当前保留下来的分段')&&words.includes('时间坐标由工具显示'),label+' actual segments are distinguished from generated coordinates');
    if(p.jumpInput?.pending)ok(words.includes('待应用')&&words.includes('不计入上述合计'),label+' visible pending input is distinct from executed segments');
    return words;
   };
   const restore=async(c,record,strict)=>{
    await reload(c);const after=await saved(c.id);assert.deepEqual(after.models,record.models);assert.deepEqual(after.cases,record.cases);
    ok((await hint.count()>0)===strict,label+' stopped-origin reload retains current feedback boundary');return after;
   };
   const retry=async(c,suffix)=>{
    const before=await saved(c.id),control=page.locator('[data-do="p3-retry"]');assert.equal(await control.count(),1);await reveal(control);await control.click();await wait(c);
    const after=await saved(c.id);assert.deepEqual(after.models[c.index],M.initial(taskFor(c)));assert.deepEqual(after.cases,before.cases);assert.deepEqual(after.notes,before.notes);
    ok(await hint.count()===0,label+' shared retry replaces only current work and cannot borrow an older different model');await restore(c,after,false);
    retries.push({width,height,id:c.id,index:c.index,suffix,before,after,storage:await snapshot(suffix)});
   };

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let report={ready:false};
   for(let i=0;i<300;i++){
    report=await page.evaluate(async expected=>{
     const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
     const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
     if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return {ready:false,...identity};
     const status=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);});
     return {...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
    },cache);
    if(report.ready===true)break;await page.waitForTimeout(100);
   }
   const modules=await page.evaluate(async expected=>{const store=await caches.open(expected);return Promise.all(['storage.js','learning/time-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/phase5/b32-model.js','learning/phase5/b32-view.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},cache);
   const cacheCheck={width,height,cache,report,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};offline.push(cacheCheck);
   ok(report.ready===true&&cacheCheck.missing.length===0,prefix+' current controller has all actual offline dependencies',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP origin is stopped before mathematical interactions');

   for(const c of cases){
    label=prefix+'-'+c.id+'-'+c.index;await open(c);const t=taskFor(c);
    ok(timeBinding(t,c)?.nodeId===c.nodeId,label+' exact native source binding');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide starts collapsed');ok(await hint.count()===0,label+' empty work is not strict evidence');
    const empty=await saved(c.id);await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),label+' optional guide opens through its own control');
    await page.waitForFunction(async({id,index})=>{
     const {readStored}=await import('./storage.js');
     return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;
    },{id:c.id,index:c.index});
    const supported=await saved(c.id);assert.deepEqual(supported.models,empty.models);ok((supported.cases[c.index]?.attempts?.length??0)===0,label+' optional support creates no mathematical check');await guide.locator('summary').click();
    const snapshots=[];
    await wrong(c);snapshots.push(await check(c,false,'01-wrong-construction'));ok(await hint.count()===0,label+' wrong work has no strict feedback');
    const failed=await model(c),first=cp(failed.board.first);await repair(c);assert.deepEqual((await model(c)).history.slice(0,failed.history.length),failed.history);
    for(const [k,v]of Object.entries(first))assert.deepEqual((await model(c)).board.first[k],v);
    ok(await hint.count()===0,label+' correction requires a check of this current complete model');snapshots.push(await check(c,true,'02-corrected'));
    const corrected=await saved(c.id),correctedModel=corrected.models[c.index],proof=replay(t,correctedModel);assertMath(c,correctedModel,proof);const words=await wordsFor(c,proof);
    await restore(c,corrected,true);await shot('corrected-offline');
    await field(c,'prose','这里留下未检查的新想法，不自动评分。');ok(await hint.count()===0,label+' changing even ungraded current text invalidates the old complete snapshot');await restore(c,await saved(c.id),false);
    await retry(c,'retry-after-two');await wrong(c);snapshots.push(await check(c,false,'03-wrong-after-retry'));
    await repair(c);snapshots.push(await check(c,true,'04-corrected-after-retry'));assertMath(c,await model(c),replay(t,await model(c)));
    await retry(c,'retry-after-four');await plan(c);ok(await hint.count()===0,label+' distinct rebuilt work is unsubmitted despite older correct snapshots');
    snapshots.push(await check(c,true,'05-rechecked-current-work'));
    const final=await saved(c.id),finalModel=final.models[c.index],finalProof=replay(t,finalModel);assertMath(c,finalModel,finalProof);const finalWords=await wordsFor(c,finalProof);
    ok(final.cases[c.index].attempts.length===5&&snapshots.length===5,label+' five full original checked snapshots remain');
    snapshots.forEach((s,i)=>assert.deepEqual(s.attempt,final.cases[c.index].attempts[i]));
    await restore(c,final,true);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');await shot('verified-offline');
    observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,taskHash:c.taskHash,task:t,expected:c.expected,model:finalModel,proof:finalProof,observation:words,finalObservation:finalWords,snapshots,record:final,storage:await snapshot('final')});
   }

   for(const c of cases.filter(c=>c.type==='x-t32-steps')){
    label=prefix+'-negative-one-hop-'+c.id+'-'+c.index;await open(c);await field(c,'jump',c.expected.durationMinutes);await act(c,'move');await fillAnswers(c);
    const one=await check(c,true,'one-hop-original-correct');ok(replay(taskFor(c),one.model)===null&&await hint.count()===0,label+' single final duration keeps original completion without segmented evidence');
    await repair(c);await field(c,'jump','0');await act(c,'move');const failed=await model(c);assert.match(failed.issue,/每一步/);
    const current=await check(c,true,'segmented-with-last-failed-request'),proof=replay(taskFor(c),current.model);assertMath(c,current.model,proof);
    ok(proof.history.failedRequests.length===1&&proof.issue===failed.issue,label+' final failed request is retained without destroying a complete segmented construction');await wordsFor(c,proof);await restore(c,current.record,true);
    if(c.id==='elapsedtime')await shot('corrected-segments');negativeObservations.push({width,height,id:c.id,index:c.index,variant:'one-hop-then-segments-with-failed-zero',snapshots:[one,current],proof});
   }
   for(const c of cases.filter(c=>c.type==='x-t32-stopwatch')){
    label=prefix+'-negative-stop-zero-'+c.id+'-'+c.index;await open(c);await act(c,'start');await act(c,'stop');await fillAnswers(c);const early=await check(c,false,'stopped-at-zero');
    await act(c,'start');for(const tick of c.expected.exampleSimulatedTicks)await act(c,'tick',tick);
    const elapsed=(await model(c)).board.elapsed;await act(c,'tick',30);assert.equal((await model(c)).board.elapsed,elapsed);assert.match((await model(c)).issue,/超过/);
    await act(c,'stop');await act(c,'start');await act(c,'tick',10);await act(c,'stop');const current=await check(c,true,'corrected-with-overshoot-and-noops'),proof=replay(taskFor(c),current.model);assertMath(c,current.model,proof);
    ok(proof.first.stop===0&&proof.history.failedRequests.length===2&&proof.history.noops.length>=3,label+' first zero, rejected whole overshoot and post-completion clicks stay distinct');await wordsFor(c,proof);await restore(c,current.record,true);await shot('corrected-timer');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'zero-stop-overshoot-postcompletion-noops',snapshots:[early,current],proof});
   }
   for(const c of cases.filter(c=>c.type==='x-t32-steps')){
    label=prefix+'-pending-jump-'+c.id+'-'+c.index;await open(c);await plan(c);
    const first=await check(c,true,'recorded-segments'),originalProof=replay(taskFor(c),first.model);assertMath(c,first.model,originalProof);await wordsFor(c,originalProof);
    await field(c,'jump','7');const pending=await saved(c.id);
    assert.deepEqual(pending.models[c.index].history,first.model.history);assert.deepEqual(pending.models[c.index].board,first.model.board);assert.deepEqual(pending.cases,first.record.cases);
    ok(currentSubmission(pending).status==='modified'&&await hint.count()===0,label+' editing a visible input retracts the old checked snapshot before any new move');
    const pendingStorage=await snapshot('pending-unchecked');await restore(c,pending,false);
    const current=await check(c,true,'rechecked-with-unapplied-input'),proof=replay(taskFor(c),current.model);assertMath(c,current.model,proof);
    assert.deepEqual(proof.construction,originalProof.construction);assert.deepEqual(proof.history,originalProof.history);
    assert.deepEqual(proof.jumpInput,{current:'7',lastRequested:originalProof.jumpInput.lastRequested,pending:true});
    await wordsFor(c,proof);await restore(c,current.record,true);if(c.id==='elapsedtime')await shot('unapplied-input-keeps-recorded-segments');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'visible-unapplied-jump-edited-then-rechecked',snapshots:[first,current],pending:{record:pending,storage:pendingStorage},proof});
   }

   // All same-type associated sources keep their own ordinary completion,
   // including three card-order tasks not duplicated in native B32 sources.
   for(const c of associatedCases){
    label=prefix+'-associated-'+c.id+'-'+c.index;await open(c);ok(await guide.count()===0&&await hint.count()===0,label+' associated source has no native guide');
    await plan(c);const current=await check(c,true,'associated-original-check');ok(timeBinding(taskFor(c),c)===null&&await hint.count()===0,label+' completed associated work does not inherit native evidence');
    await restore(c,current.record,false);isolated.push({width,height,id:c.id,index:c.index,taskHash:c.taskHash,task:taskFor(c),expected:c.expected,snapshot:current});
   }
   const excludedIds=new Set(['hourclock:0','hourclock:2','fiveclock:2','quarterclock:1','timecompare:0','calendaruse:3','timeconvert:0','eventorder:0']);
   for(const c of excludedCases.filter(c=>excludedIds.has(c.id+':'+c.index))){
    label=prefix+'-excluded-'+c.id+'-'+c.index;await open(c);await plan(c);const current=await check(c,true,'excluded-original-check');
    ok(timeBinding(taskFor(c),c)===null&&replay(taskFor(c),current.model)===null&&await guide.count()===0&&await hint.count()===0,label+' answer/tool-only work remains outside strict construction coverage');
    await restore(c,current.record,false);if(taskFor(c).mode==='set')await shot('setting-not-upgraded');excluded.push({width,height,id:c.id,index:c.index,taskHash:c.taskHash,snapshot:current});
   }
   await context.close();context=null;activePage=null;diagnostics=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===20*2&&retries.length===20*2*2,'all 20 sources have five checks and both actual shared retries at both viewports');
  ok(isolated.length===63*2&&excluded.length===8*2,'all 63 associated sources and eight answer/tool-only browser representatives stay unbound');
  ok(negativeObservations.length===(6+3+6)*2,'all time paths and timers retain actual failure/correction and unapplied-input boundary scenarios');
  const result={checks,errors,remote,observations,negativeObservations,isolated,excluded,retries,offline,provenance,viewports,nativeTasks:20,nativeNodes:10,associatedTasks:63,excludedNativeTasks:40,originStopped:offline.every(x=>x.originStopped)};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log('P9_TIME_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:20,associatedTasks:63,taskViewportPairs:observations.length,retries:retries.length}));
 }catch(error){
  const diagnosticFile=diagnostics?await diagnostics.dump(error).catch(()=>null):null;
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,isolated,excluded,retries,offline,provenance,error:String(error),stack:error.stack,at:label,diagnosticFile},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
