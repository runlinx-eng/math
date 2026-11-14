// Real prediction, fraction identities, overlay/common-grid requests and resets.
// Only empty lesson positions are seeded. No checked work is injected.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-samefraction-cases.cjs');
const {cases,associatedCases}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-samefraction-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[],emptyPredictions=[],submissions=[],retries=[],issueRetries=[],visuals=[];
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 childTrial:false,independentTeachingReview:false,seededCorrectWork:false};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const relation=task=>{const l=BigInt(task.left[0])*BigInt(task.right[1]),r=BigInt(task.right[0])*BigInt(task.left[1]);return l<r?'<':l>r?'>':'=';};
const wrong=value=>value==='<'?'>':'<';
const commonDenominator=task=>{for(let d=1;d<=60;d++)if(d%task.left[1]===0&&d%task.right[1]===0)return d;throw Error('no common grid');};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b16-model.js');
 const {sameFractionBinding,replaySameFractionEvidence}=await import('../dist/learning/samefraction-evidence.js');
 for(const spec of [...cases,...associatedCases])assert.equal(hash(sessionTasks(spec.id)[spec.index]),spec.taskHash);
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 let browser,server,context,activePage,diagnostics,failureDiagnostic=null,label='setup';
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
   diagnostics=observeBrowserDiagnostics(page,{out,base,label:()=>label});
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
    // Same-document navigation may return null and retains the old index.
    // Wait for the lesson ID, then reload the document to read the fresh seed.
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
    await reload(spec);
    const record=await saved(spec.id),current=record.models[spec.index];
    assert.deepEqual(current,M.initial(taskFor(spec)));
    ok(current.history.length===0&&(record.cases[spec.index]?.attempts?.length??0)===0,
     label+' begins with an empty original model and no checked work');
   };
   const shot=async suffix=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});
   };
   const reveal=async control=>{
    for(let i=0;i<10;i++){
     const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');
     if(!(await closed.count()))return;
     await closed.locator(':scope > summary').click();
    }
    assert.fail('too many nested disclosures');
   };
   const field=async(key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1,label+' unique visible field '+key);
    await reveal(control);
    if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));
    else await control.fill(String(value));
   };
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const control=page.locator(`[data-x="b16-${name}"]${suffix}`);assert.equal(await control.count(),1,label+' unique real action '+name+suffix);
    await reveal(control);await control.click();
   };
   const names=async(task,d)=>{
    await field('left',task.left[0]*d/task.left[1]+'/'+d);await field('right',task.right[0]*d/task.right[1]+'/'+d);
   };
   const build=async(spec,{reverse=false,early=false,denominator=null,guess=null,existing=null}={})=>{
    const task=taskFor(spec),expected=existing?structuredClone(existing):M.initial(task);
    const a=async(name,data={})=>{await action(name,data);M.act(task,expected,'b16-'+name,data);};
    const f=async(key,value)=>{await field(key,value);expected[key]=String(value);M.field(task,expected,key);};
    await f('prediction',guess??wrong(relation(task)));await a('predict');
    if(early)await a('overlay');
    const d=denominator??commonDenominator(task);
    if(task.common&&early){await f('parts',d);await a('refine');}
    for(const row of reverse?['right','left']:['left','right']){
     const ids=Array.from({length:task[row][0]},(_,i)=>reverse?task[row][1]-1-Math.floor(i*task[row][1]/task[row][0]):i);
     for(const index of ids)await a('fraction',{row,index});
    }
    await a('overlay');
    if(task.common){
     if(!early){await f('parts',d);await a('refine');}
     await f('left',task.left[0]*d/task.left[1]+'/'+d);await f('right',task.right[0]*d/task.right[1]+'/'+d);
    }
    await f('relation',relation(task));await f('reason','same-whole');
    assert.deepEqual(await model(spec),expected);
    ok(true,label+' all real actions and full 35-field snapshots match the unchanged model');return expected;
   };
   const visualFor=async(spec,current)=>{
    const task=taskFor(spec),predicted=current.board.prediction!==null;
    for(const row of ['left','right']){
     const buttons=page.locator(`#extra-visual [data-x="b16-fraction"][data-row="${row}"]`);
     ok(await buttons.count()===(predicted?task[row][1]:0),label+' '+row+' identities appear only after a prediction');
     const chosen=await buttons.evaluateAll(elements=>elements.filter(e=>e.getAttribute('aria-pressed')==='true').map(e=>Number(e.dataset.index)));
     assert.deepEqual(chosen.sort((a,b)=>a-b),[...current.board[row]].sort((a,b)=>a-b));
    }
    const overlay=page.locator('#extra-visual .b16-overlay');
    ok(await overlay.count()===(current.board.overlay?1:0),label+' overlay appears only after a real display request');
    if(current.board.overlay){
     // CSSOM serializes percentages with browser-defined display precision.
     // Check the authored quantity exactly first, then compare CSSOM strings
     // against an independently constructed, detached style in this browser.
     // Neither operation changes the fraction or permits a numeric tolerance.
     const percentages=async(locator,property,ratios)=>{
      const actual=await locator.evaluateAll((elements,{property,ratios})=>elements.map((element,index)=>{
       const ratio=ratios[index];if(!ratio)return {rawStyle:element.getAttribute('style'),actualCSSOM:element.style.getPropertyValue(property)};
       const expectedPercent=String(ratio.numerator/ratio.denominator*100)+'%',probe=document.createElement('span');
       probe.style.setProperty(property,expectedPercent);
       return {...ratio,property,expectedPercent,rawStyle:element.getAttribute('style'),actualCSSOM:element.style.getPropertyValue(property),expectedCSSOM:probe.style.getPropertyValue(property)};
      }),{property,ratios});
      visuals.push({label,width,height,id:spec.id,index:spec.index,property,ratios,actual});
      assert.equal(actual.length,ratios.length);
      for(const [i,item]of actual.entries()){
       assert.equal(item.rawStyle,property+':'+item.expectedPercent,label+' authored '+property+' '+i+' represents its exact selected fraction or grid index');
       assert.notEqual(item.expectedCSSOM,'');
       assert.equal(item.actualCSSOM,item.expectedCSSOM,label+' CSSOM '+property+' '+i+' matches the independent percentage serialization');
       ok(true,label+' '+property+' '+i+' preserves the authored quantity and browser serialization',item);
      }
      return actual;
     };
     await percentages(overlay.locator(':scope > i'),'width',['left','right'].map(row=>({numerator:current.board[row].length,denominator:task[row][1]})));
     await percentages(overlay.locator('em'),'left',current.board.refine===null?[]:
      Array.from({length:current.board.refine+1},(_,i)=>({numerator:i,denominator:current.board.refine})));
    }
    ok(await page.locator('[data-xfield="parts"]').count()===(predicted&&task.common?1:0),label+' common-grid control follows the real task flag');
    for(const key of ['left','right'])ok(await page.locator(`[data-xfield="${key}"]`).count()===(task.common&&current.board.overlay&&current.board.refine!==null?1:0),
     label+' '+key+' written common name appears only with a displayed common grid');
   };
   const check=async(spec,correct,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);
    await page.locator('#actions [data-do="check"]').click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves one real checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' original attempt metadata is retained');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' original result is observed');
    submissions.push({width,height,id:spec.id,index:spec.index,correct,name:suffix,native:!!sameFractionBinding(taskFor(spec),spec)});
    return {name:suffix,model:beforeModel,attempt,record:after};
   };
   const sharedRetry=async(spec,suffix)=>{
    const before=await saved(spec.id),button=page.locator('[data-do="p3-retry"]');
    assert.equal(await button.count(),1);await reveal(button);
    ok(await button.isEnabled(),label+' '+suffix+' is an enabled shared retry');await button.click();await wait(spec);
    const reset=await saved(spec.id);assert.deepEqual(reset.models[spec.index],M.initial(taskFor(spec)));
    assert.deepEqual(reset.cases,before.cases);assert.deepEqual(reset.notes,before.notes);
    ok(await hint.count()===0,label+' '+suffix+' clears current work while retaining every old attempt');
    await reload(spec);const restored=await saved(spec.id);
    assert.deepEqual(restored.models,reset.models);assert.deepEqual(restored.cases,before.cases);
    ok(await hint.count()===0,label+' '+suffix+' empty work restores without earlier feedback');
    return {before,reset};
   };
   const wordsFor=async proof=>{
    ok(!!proof&&await hint.isVisible(),label+' strict feedback requires the current successful checked model');
    const words=await hint.innerText();
    for(const row of ['left','right'])ok(words.includes(proof[row].fraction.join('/')),label+' feedback identifies the actual '+row+' selected fraction');
    ok(words.includes('整体')&&words.includes('系统'),label+' the same whole and automatic display are attributed to the tool');
    ok(words.includes('提交'),label+' the written comparison is described as a submission');
    if(proof.common)for(const row of ['left','right'])ok(words.includes(proof.common[row].join('/')),label+' feedback identifies the submitted common-grid '+row+' name');
    ok(!/你(?:已经|成功)?(?:画出|构造出|证明了|算出|换算出)/.test(words),label+' the system display does not become an invented learner construction or calculation');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' this observational contract has no inferred practice label');
    ok(/长期掌握/.test(words)&&/自由解释|自由文字/.test(words),label+' feedback retains its interpretation limits');return words;
   };
   const snapshot=async suffix=>{
    const stored=await read();fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),stored.raw);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),stored.text);return JSON.parse(stored.text);
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
    const store=await caches.open(expected);return Promise.all(['storage.js','learning/samefraction-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/bridges.js',
     'learning/phase5/b16-model.js','learning/phase5/b16-view.js','learning/phase5/b16.js','learning/phase5/b38.js',
     'learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','learning/phase4/async-batches.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};
   offline.push(cacheCheck);ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' current activated controller has every offline dependency',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP origin stops before all mathematics and actual document reloads');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),reverse=width===1280,early=width===1280;
    await open(spec);ok(sameFractionBinding(task,spec)?.nodeId===spec.nodeId,label+' native position matches its independent source');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide begins collapsed');
    ok(await hint.count()===0,label+' no positive feedback precedes checked work');await visualFor(spec,await model(spec));
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' optional question opens through a real disclosure');
    let afterGuide;
    for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    if(spec===cases[0])await shot('01-guide');await guide.locator('summary').click();
    assert.deepEqual(afterGuide.models,beforeGuide.models);
    ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,
     label+' opening support changes no mathematical model or checked snapshot');
    await build(spec,{reverse,early,denominator:task.common?(early?24:12):null});await visualFor(spec,await model(spec));
    ok(await hint.count()===0,label+' a successful construction remains unsubmitted');
    const snapshots=[];await field('relation',wrong(relation(task)));snapshots.push(await check(spec,false,'01-wrong-comparison'));
    ok(await hint.count()===0,label+' the wrong comparison produces no strict feedback');
    await field('relation',relation(task));snapshots.push(await check(spec,true,'02-correct-comparison'));
    const first=await model(spec),proof=replaySameFractionEvidence(task,first),words=await wordsFor(proof);
    ok(proof.firstPrediction.correct===false&&proof.currentPrediction.correct===false,label+' a real wrong first guess is retained after a correct construction');
    if(early){
     assert.deepEqual(proof.overlays[0].left,[0,task.left[1]]);assert.deepEqual(proof.overlays[0].right,[0,task.right[1]]);
     ok(proof.overlays.at(-1).addedToDisplay===false,label+' the later overlay request confirms the system display without inventing coloring');
    }
    const checked=await saved(spec.id);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,checked.models);assert.deepEqual((await saved(spec.id)).cases,checked.cases);
    ok(await hint.isVisible(),label+' successful work and full attempts survive the stopped-origin reload');
    await field('reason','any-whole');ok(await hint.count()===0,label+' changing the same-whole submission immediately invalidates old feedback');
    if(spec===cases[0])await shot('03-edited');await reload(spec);ok(await hint.count()===0,label+' reload cannot restore a stale checked result');
    snapshots.push(await check(spec,false,'03-wrong-whole'));ok(await hint.count()===0,label+' the newest wrong submission outranks earlier correct work');
    await field('reason','same-whole');snapshots.push(await check(spec,true,'04-correct-whole'));
    await wordsFor(replaySameFractionEvidence(task,await model(spec)));
    const beforeMoves=await model(spec),chosen=beforeMoves.board.left[0];
    await action('fraction',{row:'left',index:chosen});ok(await hint.count()===0,label+' erasing an actual fraction identity invalidates the submission');
    const erased=await model(spec);ok(!erased.board.left.includes(chosen)&&erased.board.left.length===task.left[0]-1,label+' selected identity was truly erased');
    await action('fraction',{row:'left',index:chosen});
    const revised=await model(spec);assert.deepEqual(revised.history.slice(0,beforeMoves.history.length),beforeMoves.history);
    ok(revised.history.length===beforeMoves.history.length+2&&await hint.count()===0,label+' restoring the same quantity retains both moves and still needs a check');
    snapshots.push(await check(spec,true,'05-rechecked-selection'));
    const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replaySameFractionEvidence(task,finalModel),finalWords=await wordsFor(finalProof);
    assert.equal(finalProof.changes.length,proof.changes.length+2);
    assert.equal(finalProof.changes.at(-2).selected,false);assert.equal(finalProof.changes.at(-1).selected,true);
    ok(end.cases[spec.index].attempts.length===5&&snapshots.length===5,label+' all five complete checked models are retained');
    for(const [i,item]of snapshots.entries())assert.deepEqual(item.attempt,end.cases[spec.index].attempts[i]);
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no new score or mastery record is saved');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);
    ok(await hint.isVisible(),label+' rechecked proof survives offline restoration');await visualFor(spec,finalModel);
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    await shot('05-verified-offline');observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,
     reverse,early,first,proof,words,snapshots,finalModel,finalProof,finalWords,record:end,stored:await snapshot('final')});

    // The shared retry replaces the whole model, unlike b16-reset which keeps
    // first/history. Old submitted models remain byte-for-byte in their cases.
    const retryStart=await sharedRetry(spec,'different-rebuild');
    const retryOptions={reverse:!reverse,early:!early,denominator:task.common?(reverse?36:60):null,guess:relation(task)};
    const rebuilt=await build(spec,retryOptions);assert.notDeepEqual(rebuilt,end.models[spec.index]);
    assert.equal(rebuilt.board.first,relation(task));assert.notEqual(rebuilt.board.first,end.models[spec.index].board.first);
    assert.deepEqual((await saved(spec.id)).cases,end.cases);ok(await hint.count()===0,label+' a different reconstructed workpiece needs its own check');
    await reload(spec);assert.deepEqual(await model(spec),rebuilt);assert.deepEqual((await saved(spec.id)).cases,end.cases);
    ok(await hint.count()===0,label+' offline reconstruction cannot borrow the previous checked model');
    const retryChecked=await check(spec,true,'06-shared-retry'),retryProof=replaySameFractionEvidence(task,retryChecked.model),retryWords=await wordsFor(retryProof);
    assert.equal(retryChecked.record.cases[spec.index].attempts.length,6);assert.deepEqual(retryChecked.record.cases[spec.index].attempts.slice(0,5),end.cases[spec.index].attempts);
    assert.equal(retryProof.resets.length,0);assert.equal(retryProof.firstPrediction.value,relation(task));assert.equal(retryProof.issue,'');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,retryChecked.record.models);assert.deepEqual((await saved(spec.id)).cases,retryChecked.record.cases);
    await wordsFor(retryProof);await visualFor(spec,retryChecked.model);
    if(spec===cases[0]||spec.common)await shot('06-shared-retry');
    const checkedStorage=await snapshot('shared-retry-checked');

    // There is no retry epoch in the original schema. A second real retry
    // followed by exactly the same visible construction matches the existing
    // latest submission after reload; it must not invent a seventh attempt.
    const sameStart=await sharedRetry(spec,'identical-rebuild'),identical=await build(spec,retryOptions);
    assert.deepEqual(identical,retryChecked.model);assert.deepEqual((await saved(spec.id)).cases,retryChecked.record.cases);
    await reload(spec);const sameRecord=await saved(spec.id);
    assert.deepEqual(sameRecord.models[spec.index],retryChecked.model);assert.deepEqual(sameRecord.cases,retryChecked.record.cases);
    const sameProof=replaySameFractionEvidence(task,identical);assert.deepEqual(sameProof,retryProof);await wordsFor(sameProof);
    ok(sameRecord.cases[spec.index].attempts.length===6,label+' an identical rebuilt snapshot follows the existing contract without a new epoch or attempt');
    if(spec===cases[0]||spec.common)await shot('06-identical-rebuild');
    retries.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,task,retryStart,retryOptions,rebuilt,checked:retryChecked,proof:retryProof,words:retryWords,stored:checkedStorage,
     sameRebuild:{...sameStart,model:identical,proof:sameProof,record:sameRecord,stored:await snapshot('shared-retry-identical')}});
   }

   // Clicking the visible empty prediction records a no-op. The first actual
   // choice remains distinct, and both complete checked attempts survive reload.
   for(const spec of cases){
    label=prefix+'-empty-prediction-'+spec.id+'-'+spec.index;await open(spec);
    await action('predict');const empty=await model(spec);
    assert.equal(empty.board.first,null);assert.equal(empty.board.prediction,null);assert.equal(empty.issue,'');
    const failed=await check(spec,false,'empty-prediction');ok(await hint.count()===0,label+' an empty choice is not completed mathematics');
    await reload(spec);assert.deepEqual(await model(spec),empty);assert.deepEqual((await saved(spec.id)).cases,failed.record.cases);
    await build(spec,{existing:empty,reverse:width===1280,early:width===1280});
    const corrected=await check(spec,true,'chosen-prediction'),proof=replaySameFractionEvidence(taskFor(spec),corrected.model),words=await wordsFor(proof);
    assert.equal(proof.failedRequests.length,1);assert.equal(proof.failedRequests[0].failure,'empty-prediction');
    assert.equal(proof.failedRequests[0].accepted,false);assert.equal(proof.failedRequests[0].effect,false);
    assert.deepEqual(proof.failedRequests[0].fields,empty.history[0].data.fields);
    assert.deepEqual(proof.failedRequests[0].before,empty.board);assert.deepEqual(proof.failedRequests[0].after,empty.board);
    assert.equal(proof.predictions.length,1);assert.equal(proof.firstPrediction.historyIndex,1);
    assert.deepEqual(corrected.model.history.slice(0,empty.history.length),empty.history);
    assert.deepEqual(corrected.record.cases[spec.index].attempts[0],failed.attempt);
    ok(words.includes('空选择没有被计为第一次或本轮预测'),label+' feedback does not turn an empty request into a prediction');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,corrected.record.models);assert.deepEqual((await saved(spec.id)).cases,corrected.record.cases);
    ok(await hint.isVisible(),label+' a real corrected choice and the failed attempt survive offline restore');
    if(spec===cases[0])await shot('corrected');emptyPredictions.push({width,height,id:spec.id,index:spec.index,empty,failed,corrected,proof,words,stored:await snapshot('empty-prediction')});
   }

   // Reset retains the first prediction and hidden submitted text. A new
   // prediction opens the next round; the two guesses have distinct provenance.
   const commonSpec=cases.find(c=>c.common),commonTask=taskFor(commonSpec);
   label=prefix+'-reset-first-and-current';await open(commonSpec);await build(commonSpec,{early:true,guess:'<'});
   const beforeResetCheck=await check(commonSpec,true,'before-reset'),beforeReset=await model(commonSpec);await action('reset');
   const reset=await model(commonSpec);assert.deepEqual(reset.board,{left:[],right:[],first:'<',prediction:null,overlay:false,refine:null});
   assert.deepEqual(reset.history.slice(0,beforeReset.history.length),beforeReset.history);
   for(const key of Object.keys(M.fields))assert.equal(reset[key],beforeReset[key]);
   for(const key of ['parts','left','right','relation','reason'])ok(await page.locator(`[data-xfield="${key}"]`).count()===0,label+' reset hides but preserves '+key);
   ok(await hint.count()===0,label+' reset invalidates the old proof');await reload(commonSpec);assert.deepEqual(await model(commonSpec),reset);
   await build(commonSpec,{existing:reset,reverse:true,early:true,denominator:60,guess:'>'});
   const rebuilt=await check(commonSpec,true,'after-reset'),resetProof=replaySameFractionEvidence(commonTask,await model(commonSpec));
   await wordsFor(resetProof);assert.equal(resetProof.firstPrediction.value,'<');assert.equal(resetProof.currentPrediction.value,'>');
   assert.equal(resetProof.firstPrediction.correct,false);assert.equal(resetProof.currentPrediction.correct,true);assert.equal(resetProof.resets.length,1);
   assert.deepEqual(rebuilt.record.cases[commonSpec.index].attempts[0],beforeResetCheck.attempt);
   await visualFor(commonSpec,rebuilt.model);await shot('rebuilt');
   negatives.push({width,height,kind:'reset-first-current',id:commonSpec.id,index:commonSpec.index,beforeResetCheck,beforeReset,reset,rebuilt,proof:resetProof,stored:await snapshot('reset')});

   // All five common denominators are available, including non-minimal ones.
   // Repeating a visible request is confirmation of a system display.
   label=prefix+'-legal-common-grids';await open(commonSpec);await build(commonSpec,{early:true});
   const grids=[];
   for(const d of [24,36,48,60,12,12]){
    await field('parts',d);await action('refine');await names(commonTask,d);await action('overlay');
    const checked=await check(commonSpec,true,'common-'+d),proof=replaySameFractionEvidence(commonTask,checked.model);await wordsFor(proof);await visualFor(commonSpec,checked.model);
    assert.equal(proof.common.denominator,d);grids.push({denominator:d,checked,proof});
   }
   assert.equal(grids.at(-1).proof.refinements.at(-1).changed,false);
   negatives.push({width,height,kind:'all-legal-common-grids',id:commonSpec.id,index:commonSpec.index,grids,stored:await snapshot('grids')});

   label=prefix+'-invalid-refinement-cannot-be-erased';await open(commonSpec);
   await field('prediction','<');await action('predict');await field('parts','5');await action('refine');
   const invalid=await model(commonSpec);ok(!!invalid.issue&&invalid.board.refine===null,label+' a visible invalid common-grid request was actually rejected');
   const invalidChecked=await check(commonSpec,false,'invalid-grid-request');await reload(commonSpec);
   assert.deepEqual(await model(commonSpec),invalid);assert.deepEqual((await saved(commonSpec.id)).cases,invalidChecked.record.cases);
   ok(await hint.count()===0,label+' the real rejected request survives reload without positive feedback');
   await field('parts','12');await action('refine');
   for(const row of ['left','right'])for(let index=0;index<commonTask[row][0];index++)await action('fraction',{row,index});
   await action('overlay');await names(commonTask,12);await field('relation','>');await field('reason','same-whole');
   const corrected=await check(commonSpec,true,'original-correct-after-invalid');
   const correctedProof=replaySameFractionEvidence(commonTask,corrected.model);await wordsFor(correctedProof);
   assert.equal(correctedProof.failedRequests.length,1);assert.equal(correctedProof.failedRequests[0].failure,'refinement-not-accepted');
   assert.deepEqual(correctedProof.failedRequests[0].fields,invalid.history.at(-1).data.fields);
   assert.deepEqual(correctedProof.failedRequests[0].after,invalid.board);assert.equal(correctedProof.failedRequests[0].issue,invalid.issue);
   assert.equal(correctedProof.failedRequests[0].effect,false);assert.equal(correctedProof.issue,'');
   assert.deepEqual(corrected.model.history.slice(0,invalid.history.length),invalid.history);
   assert.deepEqual(corrected.record.cases[commonSpec.index].attempts[0],invalidChecked.attempt);
   ok(true,label+' valid correction retains the complete invalid request and checked attempt');
   await action('reset');const invalidReset=await model(commonSpec);await build(commonSpec,{existing:invalidReset,reverse:true,early:true,denominator:24});
   const resetCorrected=await check(commonSpec,true,'reset-after-invalid');
   const correctedResetProof=replaySameFractionEvidence(commonTask,resetCorrected.model);await wordsFor(correctedResetProof);
   assert.deepEqual(correctedResetProof.failedRequests,correctedProof.failedRequests);assert.equal(correctedResetProof.resets.length,1);
   assert.equal(correctedResetProof.firstPrediction.value,correctedProof.firstPrediction.value);
   assert.deepEqual(resetCorrected.model.history.slice(0,corrected.model.history.length),corrected.model.history);
   assert.deepEqual(resetCorrected.record.cases[commonSpec.index].attempts.slice(0,2),corrected.record.cases[commonSpec.index].attempts);
   await reload(commonSpec);assert.deepEqual((await saved(commonSpec.id)).models,resetCorrected.record.models);assert.deepEqual((await saved(commonSpec.id)).cases,resetCorrected.record.cases);
   ok(await hint.isVisible(),label+' reset and offline restoration retain real failure and valid rebuilt work');await shot('corrected-after-reset');

   // A failed request preserves the old grid. Merely correcting its input does
   // not clear the old issue or relabel the failed request as a successful grid.
   await field('parts','5');await action('refine');const terminalFailure=await check(commonSpec,false,'last-invalid-grid');
   assert.deepEqual(terminalFailure.model.board,resetCorrected.model.board);assert.ok(terminalFailure.model.issue);
   await field('parts','24');ok(await hint.count()===0,label+' an input correction still requires a new check');
   const restoredInput=await check(commonSpec,true,'existing-grid-corrected-input'),terminalProof=replaySameFractionEvidence(commonTask,restoredInput.model),terminalWords=await wordsFor(terminalProof);
   assert.deepEqual(restoredInput.model.history,terminalFailure.model.history);assert.equal(terminalProof.issue,terminalFailure.model.issue);
   assert.equal(terminalProof.failedRequests.length,2);assert.equal(terminalProof.refinements.length,correctedResetProof.refinements.length);
   assert.equal(terminalProof.failedRequests.at(-1).historyIndex,restoredInput.model.history.length-1);
   ok(terminalWords.includes('最后一次细分请求的提示仍保留')&&terminalWords.includes('没有把那次失败说成成功'),label+' feedback identifies the existing grid and the still-failed last request');
   const forgedIssue=structuredClone(restoredInput.model);forgedIssue.issue='';
   ok(M.inspect(commonTask,forgedIssue).correct&&replaySameFractionEvidence(commonTask,forgedIssue)===null,label+' a forged issue clear cannot borrow the old grid');
   await reload(commonSpec);assert.deepEqual((await saved(commonSpec.id)).models,restoredInput.record.models);assert.deepEqual((await saved(commonSpec.id)).cases,restoredInput.record.cases);
   await wordsFor(terminalProof);await shot('last-failure-preserved');
   await action('overlay');ok(await hint.count()===0,label+' a real issue-clearing action invalidates the old checked snapshot');
   const cleared=await check(commonSpec,true,'real-overlay-clears-issue'),clearedProof=replaySameFractionEvidence(commonTask,cleared.model);await wordsFor(clearedProof);
   assert.equal(clearedProof.issue,'');assert.deepEqual(clearedProof.failedRequests,terminalProof.failedRequests);
   assert.deepEqual(cleared.record.cases[commonSpec.index].attempts.slice(0,5),restoredInput.record.cases[commonSpec.index].attempts);
   assert.deepEqual(cleared.record.cases[commonSpec.index].attempts.map(item=>M.inspect(commonTask,item.value).correct),[false,true,true,false,true,true]);
   negatives.push({width,height,kind:'invalid-refine-history',id:commonSpec.id,index:commonSpec.index,invalid,invalidChecked,corrected,correctedProof,invalidReset,resetCorrected,correctedResetProof,
    terminalFailure,restoredInput,terminalProof,terminalWords,cleared,clearedProof,stored:await snapshot('invalid-history')});

   // Also retry from a valid current workpiece whose last refinement failed.
   // Only the new current model loses the issue; the complete failed history
   // and its checked snapshot must still be present in the previous attempts.
   await field('parts','5');await action('refine');await field('parts','24');
   const issueBefore=await check(commonSpec,true,'shared-retry-issue-before'),issueBeforeProof=replaySameFractionEvidence(commonTask,issueBefore.model);
   assert.ok(issueBefore.model.issue);assert.equal(issueBeforeProof.issue,issueBefore.model.issue);await wordsFor(issueBeforeProof);
   const issueStart=await sharedRetry(commonSpec,'terminal-issue');
   assert.equal(issueStart.reset.models[commonSpec.index].issue,'');assert.equal(issueStart.reset.models[commonSpec.index].board.first,null);
   const issueRebuilt=await build(commonSpec,{reverse:width===1440,early:true,denominator:60,guess:'>'});
   assert.notDeepEqual(issueRebuilt,issueBefore.model);assert.deepEqual((await saved(commonSpec.id)).cases,issueBefore.record.cases);
   ok(await hint.count()===0,label+' rebuilding after an issue cannot borrow the old checked snapshot');
   await reload(commonSpec);assert.deepEqual(await model(commonSpec),issueRebuilt);ok(await hint.count()===0,label+' issue retry still needs its own check offline');
   const issueAfter=await check(commonSpec,true,'shared-retry-issue-after'),issueAfterProof=replaySameFractionEvidence(commonTask,issueAfter.model);
   assert.deepEqual(issueAfter.record.cases[commonSpec.index].attempts.slice(0,-1),issueBefore.record.cases[commonSpec.index].attempts);
   assert.equal(issueAfterProof.issue,'');assert.equal(issueAfterProof.failedRequests.length,0);assert.equal(issueAfterProof.resets.length,0);
   assert.ok(issueAfter.record.cases[commonSpec.index].attempts.at(-2).value.issue);await wordsFor(issueAfterProof);
   await reload(commonSpec);assert.deepEqual((await saved(commonSpec.id)).models,issueAfter.record.models);assert.deepEqual((await saved(commonSpec.id)).cases,issueAfter.record.cases);
   await wordsFor(issueAfterProof);await shot('shared-retry-terminal-issue');
   issueRetries.push({width,height,id:commonSpec.id,index:commonSpec.index,task:commonTask,before:issueBefore,beforeProof:issueBeforeProof,start:issueStart,rebuilt:issueRebuilt,checked:issueAfter,proof:issueAfterProof,stored:await snapshot('shared-retry-terminal-issue')});

   label=prefix+'-split-digit-submission';await open(commonSpec);await build(commonSpec);
   await field('left','9/1 2');await action('overlay');const split=await check(commonSpec,true,'original-split-digits');
   ok(replaySameFractionEvidence(commonTask,split.model)===null&&await hint.count()===0,label+' distinct digit tokens cannot become a submitted denominator');
   assert.equal(split.model.history.at(-1).data.fields.left,'9/1 2');await reload(commonSpec);ok(await hint.count()===0,label+' split-digit submission stays excluded offline');
   await field('left',' 9 / 12 ');await field('right','8 ÷ 12');const correctedNames=await check(commonSpec,true,'corrected-fraction-whitespace');
   const namesProof=replaySameFractionEvidence(commonTask,correctedNames.model);await wordsFor(namesProof);
   assert.deepEqual(correctedNames.model.history,split.model.history);
   assert.deepEqual(correctedNames.record.cases[commonSpec.index].attempts[0],split.attempt);
   negatives.push({width,height,kind:'split-digits-and-valid-whitespace',id:commonSpec.id,index:commonSpec.index,split,correctedNames,proof:namesProof,stored:await snapshot('names')});

   for(const spec of associatedCases){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);
    ok(sameFractionBinding(taskFor(spec),spec)===null&&await guide.count()===0,label+' a related task does not borrow a native binding or guide');
    await build(spec,{reverse:width===1280,early:width===1280});const checked=await check(spec,true,'associated-original-check');
    await visualFor(spec,checked.model);ok(await hint.count()===0,label+' successful associated work has no strict native feedback');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' offline restore retains the native/associated boundary');if(spec===associatedCases[0])await shot('isolated');
    isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,checked,stored:await snapshot('associated')});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===16&&isolated.length===30,'all eight native and fifteen associated positions ran in both viewports');
  ok(emptyPredictions.length===16&&negatives.length===8,'all empty-choice and correction/reset boundaries ran in both viewports');
  const retryNames=new Set(['06-shared-retry','shared-retry-issue-before','shared-retry-issue-after']);
  ok(submissions.filter(s=>s.native&&!retryNames.has(s.name)).length===144&&submissions.filter(s=>!s.native).length===30,'all original 144 native and 30 associated complete checks remain');
  ok(retries.length===16&&issueRetries.length===2&&submissions.filter(s=>s.native&&retryNames.has(s.name)).length===20,'all sixteen distinct and identical rebuild paths plus both terminal-issue retries run');
  ok(submissions.filter(s=>s.native).length===164,'all 164 native checks remain separate from associated practice');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,emptyPredictions,submissions,retries,issueRetries,visuals,viewports,provenance},null,2));
  console.log('P9_SAMEFRACTION_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,negatives:negatives.length,emptyPredictions:emptyPredictions.length,retries:retries.length,issueRetries:issueRetries.length,submissions:submissions.length}));
 }catch(error){
  if(diagnostics)failureDiagnostic=await diagnostics.dump(error).catch(diagnosticError=>({diagnosticError:String(diagnosticError)}));
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,emptyPredictions,submissions,retries,issueRetries,visuals,viewports,provenance,failureDiagnostic,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
