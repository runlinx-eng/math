// Real B10 counters, demonstration requests, exchanges and submitted equations.
// Start only from empty lesson records; preserve every actual checked model.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const fixture=require('./fixtures/p9-joinstory-cases.cjs'),{cases,associated}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-joinstory-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[];
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
const result=t=>t.a+(t.op==='+'?t.b:-t.b);
const equation=t=>t.balance?`${t.a}+${t.b}=${t.balance[0]}+${t.balance[1]}`:`${t.a}${t.op}${t.b}=${result(t)}`;

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b10-model.js');
 const {joinStoryBinding,replayJoinStoryEvidence}=await import('../dist/learning/joinstory-evidence.js');
 for(const spec of [...cases,...associated])assert.equal(hash(sessionTasks(spec.id)[spec.index]),spec.taskHash);
 for(const[file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 let browser,server,context,activePage,label='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  for(const[width,height]of viewports){
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
   const parts=async(spec,a,b,reverse=false)=>{
    const expected=await model(spec),task=taskFor(spec),entries=reverse?[['right',b],['left',a]]:[['left',a],['right',b]];
    for(const[group,n]of entries)while(expected[group]!==n){
     const data={group,delta:n>expected[group]?1:-1};await action('story-counter',data);M.act(task,expected,'story-counter',data);
    }
    assert.deepEqual(await model(spec),expected);
    ok(true,label+' real counters match the original complete model without fabricating counter history');
   };
   const demonstrate=async(spec,{a,b,op,guess='-1',reverse=false}={})=>{
    const task=taskFor(spec);await parts(spec,a??task.a,b??task.b,reverse);
    await edit(spec,'guess',guess);await edit(spec,'op',op??task.op);return act(spec,'story-do');
   };
   const finish=async(spec,{guess='-1',reverse=false,swaps=1}={})=>{
    const task=taskFor(spec);await demonstrate(spec,{guess,reverse});await edit(spec,'equation',equation(task));
    if(task.swap){for(let i=0;i<swaps;i++)await act(spec,'story-swap');
     await edit(spec,task.op==='+'?'otherEquation':'shortage',task.op==='+'?`${task.b}+${task.a}=${result(task)}`:'not-enough');}
    const current=await model(spec);ok(M.valid(task,current)&&M.inspect(task,current).correct,label+' complete original construction is correct');return current;
   };
   const check=async(spec,correct,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);
    const control=page.locator('#actions [data-do="check"]');await reveal(control);await control.click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves one real checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' preserves original attempt metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' actual grader result');
    return{name:suffix,model:beforeModel,attempt,record:after};
   };
   const wordsFor=async proof=>{
    ok(!!proof&&await hint.isVisible(),label+' strict feedback belongs to the latest successful submitted model');
    const words=await hint.innerText();
    ok(words.includes('演示')&&words.includes('系统')&&words.includes('提交'),label+' system demonstrations and learner-submitted equations have distinct attribution');
    for(const n of [proof.latest.a,proof.latest.b,proof.latest.result])ok(words.includes(String(n)),label+' feedback describes recorded quantity '+n);
    if(proof.reference)ok(/工具|给出|参照/.test(words),label+' the second balance side is attributed to a provided reference');
    if(proof.currentDisplay.kind==='insufficient')ok(/不够|不足/.test(words),label+' swapped subtraction describes insufficient objects');
    if(proof.currentDisplay.kind==='comparison')ok(/配对/.test(words),label+' comparison is distinct from physically taking objects');
    ok(!/你(?:逐颗|逐个|亲手)(?:数|搬|配|划)/.test(words),label+' unrecorded item movements are not invented');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' all source courses have method null');
    ok(/长期掌握/.test(words)&&/自由解释|自由文字/.test(words),label+' interpretation limits remain explicit');return words;
   };
   const visual=async(spec,current)=>{
    const task=taskFor(spec),done=current.done,swapped=current.swapped;
    ok(await page.locator('[data-x="story-counter"]').count()===4,label+' two real quantity counters remain available');
    ok(await page.locator('[data-xfield="equation"]').count()===(done?1:0),label+' equation belongs to an actual demonstration');
    ok(await page.locator('[data-x="story-swap"]').count()===(done&&task.swap?1:0),label+' exchange control belongs only to configured tasks');
    ok(await page.locator('[data-xfield="otherEquation"]').count()===(done&&task.swap&&swapped&&task.op==='+'?1:0),label+' exchanged addition field follows the visible state');
    ok(await page.locator('[data-xfield="shortage"]').count()===(done&&task.swap&&swapped&&task.op==='-'?1:0),label+' insufficient-take field follows the visible state');
    if(!done)return;
    const a=swapped?done.b:done.a,b=swapped?done.a:done.b,draw=page.locator('#extra-visual');
    if(task.rep==='fingers')ok(await draw.locator('.b10-hand rect.up').count()===a+b,label+' both hand diagrams faithfully show their supported quantities');
    else if(task.compare){ok(await draw.locator('.b10-compare i').count()===a+b,label+' both rows remain visible in a comparison');
     ok(await draw.locator('.b10-compare i.cross').count()===2*b,label+' system paired marks reflect the smaller row');}
    else{
     const shown=done.op==='+'?a+b:a,reference=task.balance?task.balance[0]+task.balance[1]:0;
     ok(await draw.locator('.b10-dots i').count()===shown+reference,label+' system display preserves the recorded and provided quantities');
     if(done.op==='-')ok(await draw.locator('.b10-dots i.cross').count()===Math.min(a,b),label+' system crossing never removes more objects than available');
     if(done.op==='-'&&b>a)ok((await draw.innerText()).includes('仍然不够'),label+' unavailable objects are shown as an insufficiency boundary');
    }
   };
   const shot=async suffix=>{await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const snapshot=async suffix=>{const s=await read();fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),s.raw);fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),s.text);return JSON.parse(s.text);};

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
    const store=await caches.open(expected);return Promise.all(['storage.js','learning/joinstory-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/bridges.js',
     'learning/phase5/b10.js','learning/phase5/b10-model.js','learning/phase5/b10-view.js','learning/phase5/b11.js',
     'learning/phase5/b34.js','learning/phase5/b38.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js',
     'learning/phase4/async-batches.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(m=>!m.cached).map(m=>m.name),originStopped:false};
   offline.push(cacheCheck);ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' complete cache and actual activated controller before origin shutdown',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP source stops before every task and actual document reload');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec);await open(spec);
    ok(joinStoryBinding(task,spec)?.nodeId===spec.nodeId,label+' matches the reviewed native position');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide begins collapsed');
    ok(await hint.count()===0,label+' no positive evidence before real submissions');await visual(spec,await model(spec));
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' actual disclosure reveals the optional question');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    await guide.locator('summary').click();assert.deepEqual(afterGuide.models,beforeGuide.models);
    ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,label+' help creates no mathematical action or check');
    const snapshots=[await check(spec,false,'01-empty-work')];
    await finish(spec,{guess:'-1',reverse:width===1280});await visual(spec,await model(spec));
    ok(await hint.count()===0,label+' completed unsubmitted work is not strict checked evidence');
    await edit(spec,'equation',`${task.a}${task.op}${task.b}=${result(task)+1}`);snapshots.push(await check(spec,false,'02-wrong-equation'));
    ok(await hint.count()===0,label+' wrong submitted arithmetic has no strict feedback');
    await edit(spec,'equation',equation(task));snapshots.push(await check(spec,true,'03-correct-equation'));
    const first=await model(spec),proof=replayJoinStoryEvidence(task,first),words=await wordsFor(proof);
    assert.equal(proof.firstPrediction.raw,'-1');assert.equal(proof.firstPrediction.correct,false);assert.equal(proof.firstPrediction.role,task.hidden||'result');
    const checked=await saved(spec.id);await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.models);assert.deepEqual((await saved(spec.id)).cases,checked.cases);
    ok(await hint.isVisible(),label+' current submitted evidence survives the stopped-origin reload');
    await edit(spec,'guess','0');ok(await hint.count()===0,label+' editing current guess immediately expires old feedback');
    if(spec===cases[0])await shot('edited');await reload(spec);ok(await hint.count()===0,label+' reload cannot resurrect an old checked snapshot');
    snapshots.push(await check(spec,true,'04-unrecorded-guess-edit'));
    ok(replayJoinStoryEvidence(task,await model(spec))===null&&await hint.count()===0,label+' original completion does not turn an unrecorded guess into demonstration evidence');
    await act(spec,'story-do');if(task.swap){for(let i=0;i<(width===1280?3:1);i++)await act(spec,'story-swap');}
    snapshots.push(await check(spec,true,'05-repeated-demonstration'));
    const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replayJoinStoryEvidence(task,finalModel),finalWords=await wordsFor(finalProof);
    assert.equal(finalProof.demonstrations.length,2);assert.equal(finalProof.demonstrations[1].sameAsPreviousRecordedDisplay,!task.swap);
    assert.equal(finalProof.firstPrediction.raw,'-1');assert.equal(finalProof.latest.guess,'0');
    ok(end.cases[spec.index].attempts.length===5,label+' exactly five genuine checked snapshots remain');
    for(const[i,item]of snapshots.entries())assert.deepEqual(item.attempt,end.cases[spec.index].attempts[i]);
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no invented score or mastery schema');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);
    await visual(spec,finalModel);ok(await hint.isVisible(),label+' final proof restores from complete saved history');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    await shot('verified-offline');observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,
     first,proof,words,snapshots,finalModel,finalProof,finalWords,record:end,stored:await snapshot('final')});
   }

   for(const[id,index,a,b,op]of [['showactions',1,6,2,'+'],['showactions',1,5,2,'-'],['takethings',2,7,4,'+'],['takethings',2,3,5,'-'],['takethings',0,2,5,'-']]){
    const spec=cases.find(c=>c.id===id&&c.index===index);label=prefix+'-unsuitable-'+id+'-'+index+'-'+a+'-'+op;
    await open(spec);await demonstrate(spec,{a,b,op,guess:'0'});const unsuitable=await model(spec),shown=await page.locator('#extra-visual').innerText();
    await finish(spec);const corrected=await check(spec,true,'original-correct-after-unsuitable-display');
    ok(replayJoinStoryEvidence(taskFor(spec),corrected.model)===null&&await hint.count()===0,label+' a later correct display does not erase the unsuitable recorded display');
    assert.deepEqual(corrected.model.history.slice(0,unsuitable.history.length),unsuitable.history);
    await reload(spec);ok(await hint.count()===0,label+' exclusion survives stopped-origin restore');await shot('excluded');
    negatives.push({width,height,kind:'unsuitable-display-retained',id,index,unsuitable,shown,corrected,stored:await snapshot('excluded')});
   }

   for(const[id,index]of [['jointhings',0],['takethings',0],['smallstories',3],['notice34',0]]){
    const spec=cases.find(c=>c.id===id&&c.index===index),task=taskFor(spec);label=prefix+'-faithful-experiment-'+id+'-'+index;
    await open(spec);await demonstrate(spec,{a:5,b:1,op:task.op==='+'?'-':'+',guess:'-2'});const explored=await model(spec);
    await finish(spec,{guess:String(task.hidden?task[task.hidden]:result(task))});const checked=await check(spec,true,'corrected-choice'),proof=replayJoinStoryEvidence(task,checked.model);
    await wordsFor(proof);assert.equal(proof.demonstrations[0].matchesTask,false);assert.equal(proof.demonstrations[1].matchesTask,true);assert.equal(proof.firstPrediction.raw,'-2');
    assert.deepEqual(checked.model.history.slice(0,explored.history.length),explored.history);
    negatives.push({width,height,kind:'faithful-experiment-corrected',id,index,explored,checked,proof,stored:await snapshot('exploration')});
   }

   const splitSpec=cases.find(c=>c.id==='basicadd'&&c.index===0);label=prefix+'-split-digit-equation';await open(splitSpec);await finish(splitSpec);
   await edit(splitSpec,'equation','1 4+5=19');const split=await check(splitSpec,true,'original-split-digits');
   ok(replayJoinStoryEvidence(taskFor(splitSpec),split.model)===null&&await hint.count()===0,label+' original cleaner cannot manufacture a multi-digit number');
   await reload(splitSpec);ok(await hint.count()===0,label+' malformed submitted tokens stay excluded offline');
   await edit(splitSpec,'equation','19 ＝ 14 ＋ 5');const corrected=await check(splitSpec,true,'corrected-token-equation'),splitProof=replayJoinStoryEvidence(taskFor(splitSpec),corrected.model);await wordsFor(splitProof);
   assert.deepEqual(corrected.model.history,split.model.history);assert.deepEqual(corrected.record.cases[splitSpec.index].attempts[0],split.attempt);
   negatives.push({width,height,kind:'submitted-digit-boundary',split,corrected,proof:splitProof,stored:await snapshot('tokens')});

   const unrecordedSpec=cases[0];label=prefix+'-unrecorded-input-boundary';await open(unrecordedSpec);
   await parts(unrecordedSpec,3,2);await act(unrecordedSpec,'story-do');const failed=await model(unrecordedSpec);
   assert.deepEqual(failed.history,[]);ok(!!failed.issue,label+' missing guess produces a real visible source warning without a history event');
   await finish(unrecordedSpec);const retried=await check(unrecordedSpec,true,'later-recorded-demo'),boundaryProof=replayJoinStoryEvidence(taskFor(unrecordedSpec),retried.model);await wordsFor(boundaryProof);
   assert.equal(boundaryProof.demonstrations.length,1);assert.ok(boundaryProof.unrecorded.includes('unsuccessful-clicks'));
   negatives.push({width,height,kind:'unrecorded-click-not-invented',failed,retried,proof:boundaryProof,stored:await snapshot('unrecorded')});

   for(const spec of associated){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);const nativeBefore=structuredClone((await state()).lessons);
    ok(joinStoryBinding(taskFor(spec),spec)===null&&await guide.count()===0,label+' related copy has no native binding or guide');
    await finish(spec,{reverse:width===1280});const checked=await check(spec,true,'associated-original-check');await visual(spec,checked.model);
    ok(await hint.count()===0,label+' original associated success does not borrow strict native feedback');assert.deepEqual((await state()).lessons,nativeBefore);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' offline restoration preserves native/associated separation');assert.deepEqual((await state()).lessons,nativeBefore);
    if(spec===associated[0])await shot('isolated');isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,checked,stored:await snapshot('associated')});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===82&&isolated.length===52,'all 41 native and 26 associated positions ran in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance},null,2));
  console.log('P9_JOINSTORY_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,negatives:negatives.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
