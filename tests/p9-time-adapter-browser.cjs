// Real B32 controls, original checks and actual Next navigation. No lesson/model
// seeding. Literal reviewed plans supply expectations, never the B32 solver.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-time-cases.cjs'),{cases,excludedCases,associatedCases}=fixture;
const navigationFixture=require('./fixtures/p9-time-navigation.cjs'),{navigation,excludedRepresentatives}=navigationFixture;
function orderedTimeTargets(){
 const selected=[...cases.map(c=>({...c,role:'native'})),...associatedCases.map(c=>({...c,role:'associated'})),
  ...excludedCases.filter(c=>excludedRepresentatives.includes(c.id+':'+c.index)).map(c=>({...c,role:'excluded'}))];
 return [...new Set(selected.map(c=>c.id))].flatMap(id=>selected.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));
}
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-time-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],isolated=[],excluded=[],retries=[],boundaryRetries=[],offline=[],preparations=[],backups=[];
const ok=(value,label,detail={})=>{assert.ok(value,label);checks.push({label,...detail});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),cp=structuredClone;
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,workflow:process.env.GITHUB_WORKFLOW||null,
 sourceHashes:{...fixture.sourceFiles,...navigationFixture.sourceHashes},workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),
 childTrial:false,independentTeachingReview:false,seededCorrectWork:false,seededLessonPositions:false,realBrowserBackupImport:false,backupImportsCompleted:0};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>crypto.createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b32-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js');
 const {setField}=await import('../dist/learning/phase4/ui.js');
 const Core=await import('../dist/exploration-core.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const {currentSubmission}=await import('../dist/learning/state.js');
 const {timeBinding,replayTimeEvidence:replay}=await import('../dist/learning/time-evidence.js');
 const {studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const taskFor=c=>sessionTasks(c.id)[c.index];
 for(const c of [...cases,...excludedCases,...associatedCases])assert.equal(hash(taskFor(c)),c.taskHash);
 for(const spec of navigation){assert.deepEqual(taskFor(spec),spec.task);assert.equal(hash(spec.task),spec.taskHash);}
 for(const [file,expected]of Object.entries({...fixture.sourceFiles,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected,file);
 let browser,server,context,restoreContext,activePage,label='setup';const diagnostics=new Map();
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
   const keepRecords=(before,after)=>{
    for(const [left,right]of [[before.lessons,after.lessons],[before.daily.bridges,after.daily.bridges]])
     for(const [id,record]of Object.entries(left)){assert.ok(right[id]);assert.deepEqual(right[id].models,record.models);assert.deepEqual(right[id].cases,record.cases);assert.deepEqual(right[id].notes,record.notes);}
   };
   const saved=async id=>{const state=JSON.parse((await read()).text);return state.lessons[id]||state.daily.bridges[id];};
   const model=async c=>(await saved(c.id)).models[c.index];
   const wait=c=>page.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},c);
   const reload=async c=>{const response=await page.reload();await wait(c);ok(response?.fromServiceWorker()===true,label+' real reload uses the stopped-origin service worker');};
   const snapshot=async(suffix,current=page)=>{
    const value=await readPage(current),stem=label+'-'+suffix;originalState(JSON.parse(value.text));fs.writeFileSync(path.join(out,stem+'-storage.txt'),value.raw);fs.writeFileSync(path.join(out,stem+'-state.json'),value.text);
    return {raw:stem+'-storage.txt',state:stem+'-state.json'};
   };
   const shot=async(suffix,current=page)=>{await current.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));await current.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const open=async c=>{
    const current=await page.evaluate(()=>window.mathLesson?.snapshot());
    if(current?.id!==c.id){
     const before=originalState(JSON.parse((await read()).text)),oldURL=new URL(page.url()),target=new URL(base+'learn.html#'+c.id);
     const response=await page.goto(target.href);await wait({id:c.id,index:0});
     if(response)ok(response.fromServiceWorker()===true,label+' lesson document comes from stopped-origin cache');
     else{assert.equal(oldURL.origin,target.origin);assert.equal(oldURL.pathname,target.pathname);assert.notEqual(oldURL.hash,target.hash);}
     keepRecords(before,originalState(JSON.parse((await read()).text)));
    }
    let at=(await saved(c.id)).index;assert.ok(at<=c.index,label+' only original forward navigation is needed');
    while(at<c.index){
     const previous={id:c.id,index:at},task=taskFor(previous),record=await saved(c.id);
     if(!record.cases[at]?.attempts?.some(attempt=>Tasks.inspect(task,attempt.value).correct)){
      const prep=navigation.find(x=>x.id===c.id&&x.index===at);assert.ok(prep,'frozen exact navigation prerequisite');
      for(const step of prep.steps){if(step.field)await field(previous,step.field,step.value);else await action(previous,step.action,step.data);}
      assert.equal(Tasks.inspect(task,await model(previous)).correct,true);
      const checked=await check(previous,true,'navigation-prerequisite-'+at);preparations.push({width,height,...prep,checked,strictTimeCoverage:false});
     }
     const before=originalState(JSON.parse((await read()).text)),next=page.locator('#actions [data-do="next"]');
     assert.equal(await next.count(),1);assert.equal(await next.isEnabled(),true);await next.click();at++;
     await wait({id:c.id,index:at});const after=originalState(JSON.parse((await read()).text));
     for(const [left,right]of [[before.lessons,after.lessons],[before.daily.bridges,after.daily.bridges]])for(const [id,record]of Object.entries(left)){
      assert.ok(right[id]);assert.deepEqual(right[id].cases,record.cases);assert.deepEqual(right[id].notes,record.notes);
      for(const [i,value]of Object.entries(record.models))assert.deepEqual(right[id].models[i],value);
     }
    }
    const record=await saved(c.id),m=record.models[c.index];assert.deepEqual(m,M.initial(taskFor(c)));
    ok((record.cases[c.index]?.attempts?.length??0)===0,label+' untouched work has zero checks without any state injection');
    const expected=studyActionFocus({task:taskFor(c),model:m}).readyToCheck;
    ok(await page.locator('#actions [data-do="check"]').isEnabled()===expected,label+' actual empty-work check availability agrees with existing studyActionFocus');
   };
   const resetCurrent=async c=>{
    const before=await saved(c.id),control=page.locator('[data-do="p3-retry"]');assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();await wait(c);
    const after=await saved(c.id);assert.deepEqual(after.models[c.index],M.initial(taskFor(c)));assert.deepEqual(after.cases,before.cases);assert.deepEqual(after.notes,before.notes);
    for(const [i,value]of Object.entries(before.models))if(Number(i)!==c.index)assert.deepEqual(after.models[i],value);
    ok(await hint.count()===0,label+' real boundary retry preserves all earlier checks');
    boundaryRetries.push({width,height,id:c.id,index:c.index,before,after,storage:await snapshot('boundary-shared-retry')});
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
    const before=await model(c),expected=cp(before),tag=await control.evaluate(e=>e.tagName),inputType=await control.getAttribute('type');
    if(tag==='SELECT')await control.selectOption(String(value));
    else if(await control.getAttribute('type')==='range'){
     // Actual keyboard operations, not a scripted assignment of range.value.
     await control.focus();await control.press('Home');for(let i=0;i<Number(value);i++)await control.press('ArrowRight');
     const after=await model(c);assert.equal(after[key],String(value));assert.deepEqual(after.history.slice(0,before.history.length),before.history);return after;
    }else await control.fill(String(value));
    setField(expected,key,inputType==='number'?(String(value)===''?null:Number(value)):String(value));
    Engine.fieldExtra(taskFor(c),expected,key);assert.deepEqual(await model(c),expected);assert.equal(Tasks.validModel(taskFor(c),expected),true);return expected;
   };
   const action=async(c,name,data={})=>{
    const suffix=Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join(''),control=page.locator(`[data-x="${name}"]${suffix}`);
    assert.equal(await control.count(),1,label+' one actual action '+name+suffix);await reveal(control);
    const before=await model(c),expected=cp(before);assert.equal(await control.isEnabled(),true);await control.click();Engine.actExtra(taskFor(c),expected,name,data);
    const after=await model(c);assert.deepEqual(after,expected);assert.deepEqual(after.history.slice(0,before.history.length),before.history);
    if(taskFor(c).type.startsWith('x-t32-'))ok(after.history.length===before.history.length+1,label+' original visible action appends its exact raw event');
    assert.equal(Tasks.validModel(taskFor(c),after),true);return after;
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
    for(const [i,value]of Object.entries(before.models))if(Number(i)!==c.index)assert.deepEqual(after.models[i],value);
    for(const [i,value]of Object.entries(before.cases))if(Number(i)!==c.index)assert.deepEqual(after.cases[i],value);
    originalState(JSON.parse((await read()).text));
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
   const wordsFor=async(c,p,current=page)=>{
    const feedback=current.locator('#thinking-feedback');
    ok(!!p&&await feedback.isVisible(),label+' latest exact current construction has strict feedback');
    const words=await feedback.innerText();ok(/自由解释/.test(words)&&/长期掌握/.test(words),label+' interpretation stays bounded');
    ok(!/MP\.\d|已掌握/.test(words)&&await feedback.locator('[data-thinking-node-id]').count()===0,label+' no invented method or mastery label');
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
     const store=await caches.open(expected);return Promise.all(["storage.js", "v2.html", "learn.html", "learning/learn.js", "exploration-core.js", "exploration.js", "learning/time-evidence.js", "learning/evidence-contract.js", "learning/evidence-adapters.js", "learning/thinking-feedback.js", "learning/state.js", "learning/tasks.js", "learning/phase5/b32-model.js", "learning/phase5/b32-view.js", "learning/phase5/b32.js", "learning/phase4/b03-model.js", "learning/phase4/b03-view.js", "learning/phase5/b16-model.js", "learning/phase5/b16-view.js", "learning/phase5/b24-model.js", "learning/phase5/b24-view.js", "learning/phase5/b28-model.js", "learning/phase5/b28-view.js", "learning/phase4/async-batches.js", "learning/phase5/b39.js", "learning/phase5/b39-model.js", "learning/phase5/b39-view.js"].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
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

   const runNative=async c=>{
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
    await runBoundaries(c);
   };

   const runBoundaries=async currentSpec=>{
   for(const c of cases.filter(c=>c.type==='x-t32-steps'&&c.id===currentSpec.id&&c.index===currentSpec.index)){
    label=prefix+'-negative-one-hop-'+c.id+'-'+c.index;await resetCurrent(c);await field(c,'jump',c.expected.durationMinutes);await act(c,'move');await fillAnswers(c);
    const one=await check(c,true,'one-hop-original-correct');ok(replay(taskFor(c),one.model)===null&&await hint.count()===0,label+' single final duration keeps original completion without segmented evidence');
    await repair(c);await field(c,'jump','0');await act(c,'move');const failed=await model(c);assert.match(failed.issue,/每一步/);
    const current=await check(c,true,'segmented-with-last-failed-request'),proof=replay(taskFor(c),current.model);assertMath(c,current.model,proof);
    ok(proof.history.failedRequests.length===1&&proof.issue===failed.issue,label+' final failed request is retained without destroying a complete segmented construction');await wordsFor(c,proof);await restore(c,current.record,true);
    if(c.id==='elapsedtime')await shot('corrected-segments');negativeObservations.push({width,height,id:c.id,index:c.index,variant:'one-hop-then-segments-with-failed-zero',snapshots:[one,current],proof});
   }
   for(const c of cases.filter(c=>c.type==='x-t32-stopwatch'&&c.id===currentSpec.id&&c.index===currentSpec.index)){
    label=prefix+'-negative-stop-zero-'+c.id+'-'+c.index;await resetCurrent(c);await act(c,'start');await act(c,'stop');await fillAnswers(c);const early=await check(c,false,'stopped-at-zero');
    await act(c,'start');for(const tick of c.expected.exampleSimulatedTicks)await act(c,'tick',tick);
    const elapsed=(await model(c)).board.elapsed;await act(c,'tick',30);assert.equal((await model(c)).board.elapsed,elapsed);assert.match((await model(c)).issue,/超过/);
    await act(c,'stop');await act(c,'start');await act(c,'tick',10);await act(c,'stop');const current=await check(c,true,'corrected-with-overshoot-and-noops'),proof=replay(taskFor(c),current.model);assertMath(c,current.model,proof);
    ok(proof.first.stop===0&&proof.history.failedRequests.length===2&&proof.history.noops.length>=3,label+' first zero, rejected whole overshoot and post-completion clicks stay distinct');await wordsFor(c,proof);await restore(c,current.record,true);await shot('corrected-timer');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'zero-stop-overshoot-postcompletion-noops',snapshots:[early,current],proof});
   }
   for(const c of cases.filter(c=>c.type==='x-t32-steps'&&c.id===currentSpec.id&&c.index===currentSpec.index)){
    label=prefix+'-pending-jump-'+c.id+'-'+c.index;await resetCurrent(c);await plan(c);
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

   };

   // All same-type associated sources keep their own ordinary completion,
   // including three card-order tasks not duplicated in native B32 sources.
   const runAssociated=async c=>{
    label=prefix+'-associated-'+c.id+'-'+c.index;await open(c);ok(await guide.count()===0&&await hint.count()===0,label+' associated source has no native guide');
    await plan(c);const current=await check(c,true,'associated-original-check');ok(timeBinding(taskFor(c),c)===null&&await hint.count()===0,label+' completed associated work does not inherit native evidence');
    await restore(c,current.record,false);isolated.push({width,height,id:c.id,index:c.index,taskHash:c.taskHash,task:taskFor(c),expected:c.expected,snapshot:current});
   };
   const runExcluded=async c=>{
    label=prefix+'-excluded-'+c.id+'-'+c.index;await open(c);await plan(c);const current=await check(c,true,'excluded-original-check');
    ok(timeBinding(taskFor(c),c)===null&&replay(taskFor(c),current.model)===null&&await guide.count()===0&&await hint.count()===0,label+' answer/tool-only work remains outside strict construction coverage');
    await restore(c,current.record,false);if(taskFor(c).mode==='set')await shot('setting-not-upgraded');excluded.push({width,height,id:c.id,index:c.index,taskHash:c.taskHash,snapshot:current});
   };
   for(const c of orderedTimeTargets()){
    if(c.role==='native')await runNative(c);else if(c.role==='associated')await runAssociated(c);else await runExcluded(c);
   }
   label=prefix+'-actual-v2-backup';await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   await page.locator('#main [data-do="export"]').first().waitFor();
   const download=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const exported=await download;
   const backupPath=path.join(out,label+'.json');await exported.saveAs(backupPath);const payload=fs.readFileSync(backupPath,'utf8'),backup=JSON.parse(payload);
   assert.equal(backup.version,2);assert.deepEqual(backup.state,JSON.parse((await read()).text));originalState(backup.state);
   for(const c of cases){
    const record=backup.state.lessons[c.id],observed=observations.find(x=>x.width===width&&x.id===c.id&&x.index===c.index);
    const extra=negativeObservations.filter(x=>x.width===width&&x.id===c.id&&x.index===c.index);
    const snapshots=[...observed.snapshots,...extra.flatMap(x=>x.snapshots)],attempts=snapshots.map(x=>x.attempt);
    assert.equal(attempts.length,c.type==='x-t32-steps'?9:c.type==='x-t32-stopwatch'?7:5);
    assert.deepEqual(record.cases[c.index].attempts,attempts);assert.deepEqual(record.models[c.index],snapshots.at(-1).model);
    assert.deepEqual(attempts.slice(0,5).map(x=>Tasks.inspect(taskFor(c),x.value).correct),[false,true,false,true,true]);
    assertMath(c,record.models[c.index],replay(taskFor(c),record.models[c.index]));
   }
   for(const item of isolated.filter(x=>x.width===width)){
    const record=backup.state.daily.bridges[item.id];assert.deepEqual(record.cases[item.index].attempts,[item.snapshot.attempt]);assert.deepEqual(record.models[item.index],item.snapshot.model);
   }
   for(const item of excluded.filter(x=>x.width===width)){
    const record=backup.state.lessons[item.id];assert.deepEqual(record.cases[item.index].attempts,[item.snapshot.attempt]);assert.deepEqual(record.models[item.index],item.snapshot.model);
   }
   for(const prep of preparations.filter(x=>x.width===width)){
    const record=backup.state.lessons[prep.id]||backup.state.daily.bridges[prep.id];assert.deepEqual(record.cases[prep.index].attempts,[prep.checked.attempt]);assert.deepEqual(record.models[prep.index],prep.checked.model);
   }
   for(const item of boundaryRetries.filter(x=>x.width===width)){
    const record=backup.state.lessons[item.id],prior=item.before.cases[item.index].attempts;
    assert.deepEqual(record.cases[item.index].attempts.slice(0,prior.length),prior);assert.deepEqual(item.after.cases,item.before.cases);
    assert.deepEqual(item.after.models[item.index],M.initial(taskFor(item)));
   }
   ok(true,label+' actual v2 download retains all failed, corrected, retry, boundary, associated and prerequisite snapshots');await shot('exported');
   activePage=restorePage;const targetResponse=await restorePage.reload();await restorePage.locator('#import-file').waitFor({state:'attached'});
   await restorePage.locator('#main [data-do="export"]').first().waitFor();
   ok(targetResponse?.fromServiceWorker()===true,label+' independently empty import target reloads with origin stopped');
   const empty=originalState(JSON.parse((await readPage(restorePage)).text));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
   const importFile=async filename=>{
    await restorePage.locator('#import-file').setInputFiles({name:filename,mimeType:'application/json',buffer:Buffer.from(payload)});
    await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    ok((await restorePage.locator('#toast').innerText()).includes('备份已合并'),label+' real file input completes the original merge');
   };
   await importFile('time-real-browser-v2.json');const restored=await readPage(restorePage),restoredState=JSON.parse(restored.text);
   assert.deepEqual(restoredState,backup.state);originalState(restoredState);provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   for(const c of cases){const m=restoredState.lessons[c.id].models[c.index];assertMath(c,m,replay(taskFor(c),m));}
   const firstImportFile=label+'-first-import-storage.txt';fs.writeFileSync(path.join(out,firstImportFile),restored.raw);
   await importFile('time-identical-repeat-v2.json');const repeated=await readPage(restorePage);assert.equal(repeated.raw,restored.raw);
   assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);provenance.backupImportsCompleted++;
   const repeatedImportFile=label+'-repeated-import-storage.txt';fs.writeFileSync(path.join(out,repeatedImportFile),repeated.raw);
   ok(true,label+' complete first import and byte-identical repeat both preserve every record');
   const restoreSpec=cases.at(-1),lessonResponse=await restorePage.goto(base+'learn.html#'+restoreSpec.id);
   await restorePage.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},restoreSpec);
   ok(lessonResponse?.fromServiceWorker()===true,label+' imported original lesson opens from stopped-origin cache');
   const afterOpen=JSON.parse((await readPage(restorePage)).text),restoredRecord=afterOpen.lessons[restoreSpec.id];
   assert.deepEqual(restoredRecord.models,backup.state.lessons[restoreSpec.id].models);assert.deepEqual(restoredRecord.cases,backup.state.lessons[restoreSpec.id].cases);
   const restoredProof=replay(taskFor(restoreSpec),restoredRecord.models[restoreSpec.index]);assertMath(restoreSpec,restoredRecord.models[restoreSpec.index],restoredProof);
   const restoredWords=await wordsFor(restoreSpec,restoredProof,restorePage);await shot('restored',restorePage);const restoredSnapshot=await snapshot('restored',restorePage);
   backups.push({width,height,file:path.basename(backupPath),bytes:Buffer.byteLength(payload),sha256:digest(payload),originalState:backup.state,restoredState,restoredSnapshot,restoredProof,restoredWords,
    independentEmptyContext:true,firstImportRaw:{file:firstImportFile,bytes:Buffer.byteLength(restored.raw),sha256:digest(restored.raw)},
    repeatedImportRaw:{file:repeatedImportFile,bytes:Buffer.byteLength(repeated.raw),sha256:digest(repeated.raw)},originStopped:!server.listening,
    nativeCases:20,associatedCases:63,excludedCases:8,navigationPrerequisites:16,importsCompleted:2,idempotent:true});

   await context.close();context=null;await restoreContext.close();restoreContext=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===20*2&&retries.length===20*2*2,'all 20 sources have five checks and both actual shared retries at both viewports');
  ok(isolated.length===63*2&&excluded.length===8*2,'all 63 associated sources and eight answer/tool-only browser representatives stay unbound');
  ok(boundaryRetries.length===30,'all 30 boundary scenarios begin with real shared retry while preserving complete earlier checks');
  ok(negativeObservations.length===(6+3+6)*2,'all time paths and timers retain actual failure/correction and unapplied-input boundary scenarios');
  ok(preparations.length===32&&backups.length===2&&provenance.backupImportsCompleted===4,'both viewports complete 16 real prerequisites and first plus repeated real v2 imports');
  const attemptCounts={native:observations.reduce((n,x)=>n+x.snapshots.length,0)+negativeObservations.reduce((n,x)=>n+x.snapshots.length,0),associated:isolated.length,excluded:excluded.length,navigationPrerequisites:preparations.length};
  assert.deepEqual(attemptCounts,{native:260,associated:126,excluded:16,navigationPrerequisites:32});
  const result={checks,errors,remote,observations,negativeObservations,isolated,excluded,retries,boundaryRetries,offline,preparations,backups,attemptCounts,provenance,viewports,nativeTasks:20,nativeNodes:10,associatedTasks:63,excludedNativeTasks:40,originStopped:offline.every(x=>x.originStopped)};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log('P9_TIME_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:20,associatedTasks:63,taskViewportPairs:observations.length,retries:retries.length,boundaryRetries:boundaryRetries.length,attemptCounts,backups:backups.length}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(diagnosticError=>({diagnosticError:String(diagnosticError)})):null;
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,isolated,excluded,retries,boundaryRetries,offline,preparations,backups,provenance,error:String(error),stack:error.stack,at:label,diagnosticFile},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(restoreContext)await restoreContext.close();if(browser)await browser.close();
 }
}
module.exports={orderedTimeTargets};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
