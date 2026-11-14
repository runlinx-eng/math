// Real B11 ledger submissions, retained failures, correction and shared p3-retry.
// Start only from empty lesson records; preserve every actual checked model.
const fs=require('node:fs'),nodePath=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-storyledger-cases.cjs'),{cases,associatedCases:associated}=fixture;
const root=nodePath.resolve(__dirname,'..'),out=nodePath.join(root,'verification/p9-storyledger-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[];
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
const cache=fs.readFileSync(nodePath.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 childTrial:false,independentTeachingReview:false,seededCorrectWork:false};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
const planner=require('./fixtures/p9-storyledger-controls.cjs');
const retries=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};


(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b11-model.js');
 const {storyLedgerBinding,replayStoryLedgerEvidence}=await import('../dist/learning/storyledger-evidence.js');
 for(const spec of [...cases,...associated])assert.equal(hash(sessionTasks(spec.id)[spec.index]),spec.taskHash);
 for(const[file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(nodePath.join(root,file))),expected);
 let browser,server,context,activePage,diagnostics,label='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  for(const[width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(nodePath.join(root,'dist',rel),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[nodePath.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   diagnostics=observeBrowserDiagnostics(page,{out,base,label:()=>label});
   page.on('pageerror',error=>errors.push({label,error:String(error)}));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const read=()=>page.evaluate(async()=>{
    const {readStored}=await import('./storage.js');return{raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};
   });
   const state=async()=>JSON.parse((await read()).text);
   const saved=async id=>{const s=await state();return s.lessons[id]||s.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const taskFor=spec=>sessionTasks(spec.id)[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const current=window.mathLesson?.snapshot();return current?.id===id&&current.index===index&&current.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,label+' real document reload uses the stopped-origin cache');
   };
   const open=async spec=>{
    await page.evaluate(async({id,index})=>{
     const[{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')
     ]);
     const s=fresh(),record=freshLesson(id);record.index=index;record.view='task';
     if(Object.hasOwn(BRIDGES,id))s.daily.bridges[id]=record;else s.lessons[id]=record;
     localStorage.setItem(KEY,JSON.stringify(s));
    },spec);
    await page.goto(base+'learn.html#'+spec.id);
    // A same-document hash change can retain the previous task index. Wait for
    // lesson readiness, then really reload the freshly seeded current record.
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
    await reload(spec);
    const record=await saved(spec.id);assert.deepEqual(record.models[spec.index],M.initial(taskFor(spec)));
    ok((record.cases[spec.index]?.attempts?.length??0)===0,label+' starts with no injected checked work');
   };
   const reveal=async control=>{
    for(let i=0;i<10;i++){
     const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');
     if(!(await closed.count()))return;await closed.locator(':scope > summary').click();
    }
    assert.fail('too many nested disclosures');
   };
   const field=async(key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1,label+' one real field '+key);
    await reveal(control);
    if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));else await control.fill(String(value));
   };
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const control=page.locator(`[data-x="${name}"]${suffix}`);assert.equal(await control.count(),1,label+' one real button '+name+suffix);
    await reveal(control);await control.click();
   };
   const edit=async(spec,key,value)=>{
    const before=await model(spec),expected=structuredClone(before);await field(key,value);
    expected[key]=String(value);M.field(taskFor(spec),expected,key);assert.deepEqual(await model(spec),expected);return expected;
   };
   const act=async(spec,name,data={})=>{
    const before=await model(spec),expected=structuredClone(before);await action(name,data);
    M.act(taskFor(spec),expected,name,data);assert.deepEqual(await model(spec),expected);return expected;
   };
   const shot=async suffix=>{await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));await page.screenshot({path:nodePath.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const snapshot=async suffix=>{const s=await read();fs.writeFileSync(nodePath.join(out,label+'-'+suffix+'-storage.txt'),s.raw);fs.writeFileSync(nodePath.join(out,label+'-'+suffix+'-state.json'),s.text);return JSON.parse(s.text);};

   const check=async(spec,correct,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);
    const control=page.locator('#actions [data-do="check"]');await reveal(control);await control.click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves one real checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' preserves original attempt metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' actual grader result');
    const stored=await snapshot(suffix);return{name:suffix,model:beforeModel,attempt,record:after,stored};
   };

   const commit=async(spec,values,accepted)=>{
    for(const [key,value]of Object.entries(values))await edit(spec,key,value);
    const before=await model(spec),after=await act(spec,'b11-event');
    assert.equal(after.history.length,before.history.length+1);assert.deepEqual(after.history.at(-1),{action:'b11-event',index:before.cursor,...values});
    assert.deepEqual(after.history.slice(0,-1),before.history);
    if(accepted){assert.equal(after.cursor,before.cursor+1);assert.deepEqual(after.saved.slice(0,-1),before.saved);}
    else{assert.equal(after.cursor,before.cursor);assert.deepEqual(after.saved,before.saved);ok(!!after.issue,label+' rejected original event leaves an explanation and does not advance');}
    ok(true,label+' actual event retains raw fields, first attempt and exact original transition');return after;
   };
   const finish=async(spec,variant=0)=>{
    const task=taskFor(spec);let current=await model(spec);
    while(current.cursor<task.steps.length)current=await commit(spec,planner.row(task,current.cursor,variant),true);
    ok(M.valid(task,current)&&M.inspect(task,current).correct,label+' source steps are complete under the unchanged original grader');return current;
   };
   const retry=async(spec,suffix)=>{
    const before=await saved(spec.id),button=page.locator('[data-do="p3-retry"]');
    assert.equal(await button.count(),1,label+' one real shared retry control');await reveal(button);await button.click();await wait(spec);
    const after=await saved(spec.id);assert.deepEqual(after.models[spec.index],M.initial(taskFor(spec)));assert.deepEqual(after.cases,before.cases);
    ok(await hint.count()===0,label+' a fresh workpiece cannot borrow the older checked model');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,after.models);assert.deepEqual((await saved(spec.id)).cases,before.cases);
    ok(await hint.count()===0,label+' retry and complete old attempts survive stopped-origin reload');
    const stored=await snapshot(suffix);retries.push({width,height,id:spec.id,index:spec.index,suffix,before,after,stored});return after;
   };
   const wordsFor=async(spec,proof)=>{
    ok(!!proof&&await hint.isVisible(),label+' strict feedback belongs to the latest complete checked workpiece');
    const words=await hint.innerText(),task=taskFor(spec);
    for(const n of [proof.start,proof.end,...proof.accepted.map(e=>e.balanceAfter)])ok(words.includes(planner.display(n,proof.scale)),label+' feedback retains an exact current balance '+n);
    ok(words.includes('提交')&&words.includes('保留')&&words.includes('长期掌握')&&words.includes('没有验证实际心算'),label+' arithmetic submission and reported method have bounded attribution');
    if(proof.failed.length)ok(words.includes(proof.failed.length+' 次未推进')&&words.includes('首尝试'),label+' failed original events and later correction are retained explicitly');
    if(spec.id==='storymoney'&&spec.index===2)ok(words.includes('较小数量')&&words.includes('不表示实际拿走'),label+' comparison is not a physical removal');
    if(spec.id==='storylarger'&&spec.index===2)ok(words.includes('距离目标还差')&&words.includes('差额'),label+' the remaining goal gap is the tracked quantity');
    ok(!/MP\.\d|你独立完成|已经掌握/.test(words),label+' no unsupported method label or mastery claim');
    ok(await page.locator('[data-xfield]').count()===0&&await page.locator('[data-x="b11-event"]').count()===0,label+' completed ledger has no fabricated editable fields or reset');
    return words;
   };
   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let cacheReport={ready:false};
   for(let i=0;i<300;i++){
    cacheReport=await page.evaluate(async expected=>{
     const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
     const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,state:worker?.state||null,
      waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
     if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return{ready:false,...identity};
     const status=await new Promise(resolve=>{
      const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
      channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
      worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
     return{...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
    },cache);
    if(cacheReport.ready===true)break;await page.waitForTimeout(100);
   }
   const modules=await page.evaluate(async expected=>{
    const store=await caches.open(expected);return Promise.all(['storage.js','learning/storyledger-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/bridges.js',
     'learning/phase5/b11.js','learning/phase5/b11-model.js','learning/phase5/b11-view.js','learning/p3-view.js',
     'learning/phase5/b34.js','learning/phase5/b38.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js',
     'learning/phase4/async-batches.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(m=>!m.cached).map(m=>m.name),originStopped:false};
   offline.push(cacheCheck);ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' complete cache and actual activated controller before origin shutdown',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP source stops before every task and actual document reload');


   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec);await open(spec);
    ok(storyLedgerBinding(task,spec)?.nodeId===spec.nodeId,label+' fixed native source matches');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional question begins collapsed');ok(await hint.count()===0,label+' no feedback before real work');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),label+' optional question opens');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    await guide.locator('summary').click();assert.deepEqual(afterGuide.models,beforeGuide.models);ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,label+' help preserves the empty mathematical record');
    const wrong=planner.wrongRow(task,0,width===1440?'operation':'result');await commit(spec,wrong,false);
    const snapshots=[await check(spec,false,'01-wrong-event')];ok(await hint.count()===0,label+' incomplete first event has no completed strict feedback');
    const firstFailed=structuredClone((await model(spec)).first);await reload(spec);assert.deepEqual((await model(spec)).first,firstFailed);
    await finish(spec,0);ok(await hint.count()===0,label+' corrected complete work still requires its own check');snapshots.push(await check(spec,true,'02-corrected'));
    const first=await model(spec),firstProof=replayStoryLedgerEvidence(task,first),firstWords=await wordsFor(spec,firstProof);assert.equal(firstProof.failed.length,1);assert.deepEqual(first.first,firstFailed.concat(first.first.slice(firstFailed.length)));
    assert.deepEqual([firstProof.start,...firstProof.accepted.map(e=>e.balanceAfter)],spec.balances);assert.equal(firstProof.events[0].cursorAfter,0);assert.equal(firstProof.events[1].stepIndex,0);
    const checked=await saved(spec.id);await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.models);assert.deepEqual((await saved(spec.id)).cases,checked.cases);ok(await hint.isVisible(),label+' first current check survives offline reload');
    await retry(spec,'retry-after-two');await commit(spec,planner.wrongRow(task,0,'amount'),false);snapshots.push(await check(spec,false,'03-wrong-new-work'));
    ok(await hint.count()===0,label+' newer incomplete submission outranks older correct work');await finish(spec,1);snapshots.push(await check(spec,true,'04-corrected-new-work'));await wordsFor(spec,replayStoryLedgerEvidence(task,await model(spec)));
    await retry(spec,'retry-after-four');await finish(spec,2);ok(await hint.count()===0,label+' distinct rebuilt work has no current check');snapshots.push(await check(spec,true,'05-rechecked'));
    const finalModel=await model(spec),proof=replayStoryLedgerEvidence(task,finalModel),words=await wordsFor(spec,proof),record=await saved(spec.id);
    assert.equal(record.cases[spec.index].attempts.length,5);assert.deepEqual(record.cases[spec.index].attempts,snapshots.map(s=>s.attempt));assert.equal(proof.failed.length,0);
    for(const [i,s]of snapshots.entries())assert.deepEqual(s.record.cases[spec.index].attempts,record.cases[spec.index].attempts.slice(0,i+1));
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,record.models);assert.deepEqual((await saved(spec.id)).cases,record.cases);ok(await hint.isVisible(),label+' fifth complete check and all past attempts survive offline reload');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');await shot('05-verified-offline');
    const stored=await snapshot('final');observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,first,firstProof,firstWords,finalModel,proof,words,snapshots,record,stored});
   }
   for(const kind of ['empty-method','empty-operation','unparsed','overprecision']){
    const spec=cases.find(c=>c.id===(kind==='unparsed'||kind==='overprecision'?'storymillion':'storymoney')&&c.index===(kind==='unparsed'||kind==='overprecision'?3:0)),task=taskFor(spec);
    label=prefix+'-negative-'+kind;await open(spec);await commit(spec,planner.wrongRow(task,0,kind),false);const wrong=await check(spec,false,'wrong'),before=await model(spec);ok(await hint.count()===0,label+' failed original input does not complete evidence');
    await finish(spec,1);const corrected=await check(spec,true,'corrected'),current=await model(spec),proof=replayStoryLedgerEvidence(task,current);assert.equal(proof.failed.length,1);assert.deepEqual(current.first[0],before.first[0]);assert.deepEqual(current.history.slice(0,before.history.length),before.history);await wordsFor(spec,proof);
    await reload(spec);assert.deepEqual(await model(spec),current);const stored=await snapshot('retained');await shot('corrected');negatives.push({width,height,id:spec.id,index:spec.index,kind,wrong,corrected,proof,stored});
   }
   for(const spec of associated){const task=taskFor(spec);label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);ok(await guide.count()===0&&await hint.count()===0,label+' associated context starts without native guidance');
    await commit(spec,planner.wrongRow(task,0,'operation'),false);await finish(spec,1);const checked=await check(spec,true,'checked'),current=await model(spec);assert.ok(replayStoryLedgerEvidence(task,current));assert.equal(storyLedgerBinding(task,spec),null);
    ok(await guide.count()===0&&await hint.count()===0,label+' same-widget associated work does not inherit native evidence');await reload(spec);assert.deepEqual(await model(spec),current);ok(await hint.count()===0,label+' associated isolation survives offline reload');const stored=await snapshot('isolated');ok(!!stored.daily.bridges[spec.id]&&!stored.lessons[spec.id],label+' associated storage is separate from native lessons');await shot('checked');isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,task,checked,stored});
   }
   await context.close();context=null;activePage=null;
  }
  assert.equal(observations.length,16);assert.equal(isolated.length,10);assert.equal(negatives.length,8);assert.equal(retries.length,32);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  const result={checks,errors,remote,observations,negatives,isolated,retries,offline,provenance,viewports,nativeTasks:cases.length,associatedTasks:associated.length,originStopped:offline.every(x=>x.originStopped)};
  fs.writeFileSync(nodePath.join(out,'results.json'),JSON.stringify(result,null,2));console.log('P9_STORYLEDGER_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,taskViewportPairs:observations.length,associatedPairs:isolated.length}));
 }catch(error){
  const failureDiagnostic=diagnostics?await diagnostics.dump(error).catch(diagnosticError=>({diagnosticError:String(diagnosticError)})):null;
  if(activePage)await activePage.screenshot({path:nodePath.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(nodePath.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,retries,offline,provenance,error:String(error),stack:error.stack,at:label,failureDiagnostic},null,2));console.error(error.stack);process.exitCode=1;
 }finally{if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});if(context)await context.close();if(browser)await browser.close();}
})();
