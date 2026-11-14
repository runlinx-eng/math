// Real B16 coloring, erasing and configured display controls. Only empty
// lesson positions are seeded; every model and checked snapshot comes from UI.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const fixture=require('./fixtures/p9-fdpboard-cases.cjs');
const {cases,associatedCases}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-fdpboard-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[];
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
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
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b16-model.js');
 const {fdpBoardBinding,replayFdpBoardEvidence}=await import('../dist/learning/fdpboard-evidence.js');
 for(const spec of [...cases,...associatedCases])assert.equal(hash(sessionTasks(spec.id)[spec.index]),spec.taskHash);
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
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
    // A hash change has no document response. If this is the same lesson,
    // its seeded index becomes visible only after the following real reload.
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
    await reload(spec);
    const record=await saved(spec.id),current=record.models[spec.index];
    assert.deepEqual(current,M.initial(taskFor(spec)));
    ok(current.history.length===0&&(record.cases[spec.index]?.attempts?.length??0)===0,label+' starts with empty work and no invented checked snapshots');
   };
   const shot=async suffix=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});
   };
   const reveal=async control=>{
    // Open the outermost closed ancestor through its real summary control.
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
   const action=async(name,value)=>{
    const selector=value===undefined?'':name==='view'?`[data-value="${value}"]`:`[data-index="${value}"]`;
    const control=page.locator(`[data-x="b16-${name}"]${selector}`);
    await reveal(control);await control.click();
   };
   const build=async(spec,{reverse=false,early=false,scattered=false,existing=null}={})=>{
    const task=taskFor(spec),expected=existing?structuredClone(existing):M.initial(task);
    const a=async(name,value)=>{
     await action(name,value);M.act(task,expected,'b16-'+name,value===undefined?{}:name==='view'?{value}:{index:value});
    };
    const f=async(key,value)=>{await field(key,value);expected[key]=String(value);M.field(task,expected,key);};
    if(early)for(const view of task.views)await a('view',view);
    if(task.d===100&&!scattered){
     const wholeRows=Math.floor(task.n/10);
     for(let i=0;i<wholeRows;i++)await a('row',reverse?9-i:i);
     for(let i=0;i<task.n%10;i++)await a('cell',reverse?99-wholeRows*10-i:wholeRows*10+i);
    }else{
     const ids=Array.from({length:task.n},(_,i)=>scattered?(i*3)%task.d:i);if(reverse)ids.reverse();
     for(const id of ids)await a('cell',id);
    }
    for(const view of task.views)await a('view',view);
    await f('num',task.n);await f('den',task.d);await f('decimal',task.n/task.d);await f('percent',task.n*100/task.d);
    assert.deepEqual(await model(spec),expected);
    ok(true,label+' every real action retains the full original model, identities and event snapshots');return expected;
   };
   const visualFor=async(spec,current)=>{
    const task=taskFor(spec),cells=page.locator('#extra-visual [data-x="b16-cell"]');
    ok(await cells.count()===task.d,label+' the real whole has exactly the task denominator in clickable equal parts');
    const painted=await cells.evaluateAll(elements=>elements.filter(e=>e.getAttribute('aria-pressed')==='true').map(e=>Number(e.dataset.index)));
    assert.deepEqual(painted.sort((a,b)=>a-b),[...current.board.selected].sort((a,b)=>a-b));
    ok(await page.locator('#extra-visual .b16-grid100').count()===(task.d===100?1:0),label+' the actual base representation agrees with grid versus four-sector circle');
    if(task.d===4){
     ok(await page.locator('#extra-visual svg[aria-label="一整个圆平均分成4份"]').count()===1,label+' four-sector initial display remains a circle despite the board grid marker');
     ok(await page.locator('[data-x="b16-row"]').count()===0,label+' the circle has no invented row action');
    }
    const line=page.locator('#extra-visual .b16-position-line i');
    ok(await line.count()===(current.board.seen.includes('line')?1:0),label+' requested line appears exactly when recorded');
    if(await line.count()){
     const value=await line.evaluate(e=>Number.parseFloat(e.style.left));
     ok(Math.abs(value-current.board.selected.length/task.d*100)<1e-9,label+' automatic line display follows the current colored count');
    }
    ok(await page.locator('#extra-visual svg[aria-label="同一部分换到圆中"]').count()===(task.d===100&&current.board.seen.includes('pie')?1:0),
     label+' optional circle is an automatic same-quantity display');
   };
   const check=async(spec,expected,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);
    await page.locator('#actions [data-do="check"]').click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves exactly one real checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' keeps original attempt metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(expected?'correct':'revise'),label+' '+suffix+' original result is observed');
    return {name:suffix,model:beforeModel,attempt,record:after};
   };
   const wordsFor=async proof=>{
    ok(!!proof&&await hint.isVisible(),label+' strict feedback requires the current successful checked work');
    const words=await hint.innerText();
    for(const value of [proof.selectedCount,proof.denominator])ok(words.includes(String(value)),label+' feedback identifies actual colored quantity '+value);
    ok(words.includes('提交')&&words.includes(proof.fraction.submitted.numerator+'/'+proof.fraction.submitted.denominator),
     label+' equivalent fraction is attributed to the submitted name');
    ok(words.includes(proof.decimal.raw)&&words.includes(proof.percent.raw),label+' the two current written representations remain visible in feedback');
    if(proof.systemRepresentations.line||proof.systemRepresentations.additionalCircle)
     ok(words.includes('系统'),label+' automatic representations are attributed to the system');
    ok(!/你(?:已经|成功)?(?:计算|算出|换算|转换|画出|作图)/.test(words),label+' feedback does not invent a conversion or plotting event');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' no mathematical-practice tag is inferred from coloring');
    ok(/长期掌握/.test(words)&&/自由解释|自由文字/.test(words),label+' interpretation remains bounded');return words;
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
    const store=await caches.open(expected);return Promise.all(['storage.js','learning/fdpboard-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js',
     'learning/phase5/b16-model.js','learning/phase5/b16-view.js','learning/phase5/b16.js',
     'learning/phase5/b17.js','learning/phase5/b37.js','learning/phase4/async-batches.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};
   offline.push(cacheCheck);ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' current activated controller has all offline dependencies',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP origin stops before every mathematical interaction');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),reverse=width===1280,early=width===1280;
    await open(spec);ok(fdpBoardBinding(task,spec)?.nodeId===spec.nodeId,label+' native position matches the independent reviewed source');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide begins collapsed');
    ok(await hint.count()===0,label+' no positive evidence precedes a real submission');
    await visualFor(spec,await model(spec));
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' optional question opens through its real summary');
    let afterGuide;
    for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    if(spec===cases[0])await shot('01-guide');await guide.locator('summary').click();
    assert.deepEqual(afterGuide.models,beforeGuide.models);
    ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,
     label+' opening support does not manufacture mathematical actions or a submission');
    ok(await page.locator('[data-xfield="num"]').count()===0,label+' the four written-name inputs are hidden before coloring');
    await build(spec,{reverse,early});await visualFor(spec,await model(spec));
    ok(await hint.count()===0,label+' a correct colored construction alone remains unchecked');
    const snapshots=[];await field('decimal','999');snapshots.push(await check(spec,false,'01-wrong-decimal'));
    ok(await hint.count()===0,label+' an incorrect decimal gets no strict feedback');
    await field('decimal',spec.decimal);snapshots.push(await check(spec,true,'02-correct-decimal'));
    const first=await model(spec),proof=replayFdpBoardEvidence(task,first),words=await wordsFor(proof);
    assert.equal(proof.denominator,spec.d);assert.equal(proof.selectedCount,spec.n);
    assert.equal(proof.changes.reduce((n,change)=>n+change.added.length,0),spec.n);
    assert.equal(proof.changes.reduce((n,change)=>n+change.removed.length,0),0);
    if(early&&task.views.length){
     ok(proof.viewRequests[0].selectedCount===0,label+' the view was genuinely requested before any coloring');
     ok(proof.viewRequests.slice(task.views.length).every(v=>v.addedToDisplay===false),label+' repeated configured display requests do not become extra mathematical construction');
    }
    const correctRecord=await saved(spec.id);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,correctRecord.models);assert.deepEqual((await saved(spec.id)).cases,correctRecord.cases);
    ok(await hint.isVisible(),label+' the entire successful work and attempts survive an offline reload');
    await field('percent','0');ok(await hint.count()===0,label+' editing the percentage removes stale feedback immediately');
    if(spec===cases[0])await shot('03-edited');await reload(spec);ok(await hint.count()===0,label+' reload cannot restore an obsolete checked result');
    snapshots.push(await check(spec,false,'03-wrong-after-edit'));ok(await hint.count()===0,label+' the newest wrong submission outranks earlier correct work');
    await field('percent',spec.percent);snapshots.push(await check(spec,true,'04-correct-after-edit'));
    await wordsFor(replayFdpBoardEvidence(task,await model(spec)));
    const beforeMoves=await model(spec),selectedId=beforeMoves.board.selected[0];
    await action('cell',selectedId);ok(await hint.count()===0,label+' erasing a real colored identity invalidates the checked work');
    const erased=await model(spec);ok(!erased.board.selected.includes(selectedId)&&erased.board.selected.length===spec.n-1,label+' the chosen identity is truly erased');
    await action('cell',selectedId);await field('num',spec.n*2);await field('den',spec.d*2);
    if(task.views.length)await action('view',task.views[0]);
    const revised=await model(spec);assert.deepEqual(revised.history.slice(0,beforeMoves.history.length),beforeMoves.history);
    ok(revised.history.length===beforeMoves.history.length+2+(task.views.length?1:0),label+' returning to the same quantity retains both real color changes and any display request');
    ok(await hint.count()===0,label+' corrected construction still requires a fresh submission');
    snapshots.push(await check(spec,true,'05-rechecked-real-coloring'));
    const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replayFdpBoardEvidence(task,finalModel),finalWords=await wordsFor(finalProof);
    assert.equal(finalProof.changes.length,proof.changes.length+2);assert.equal(finalProof.selectedCount,spec.n);
    assert.deepEqual(finalProof.changes.at(-2).removed,[selectedId]);assert.deepEqual(finalProof.changes.at(-1).added,[selectedId]);
    ok(end.cases[spec.index].attempts.length===5&&snapshots.length===5,label+' all five complete checked snapshots remain recorded');
    for(const [i,item]of snapshots.entries())assert.deepEqual(item.attempt,end.cases[spec.index].attempts[i]);
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no new score or mastery record is saved');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);
    ok(await hint.isVisible(),label+' final rechecked proof survives stopped-origin restoration');await visualFor(spec,finalModel);
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    await shot('05-verified-offline');const stored=await snapshot('final');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,
     reverse,early,proof,words,first,snapshots,finalProof,finalWords,finalModel,record:end,stored});
   }

   // Every step is a visible control. Partially filled rows add only empty
   // identities, and reset keeps the submitted drafts and earlier operations.
   const resetSpec=cases.find(c=>c.id==='viewlinks'&&c.index===1),resetTask=taskFor(resetSpec);
   label=prefix+'-partial-row-and-reset';await open(resetSpec);
   await action('reset');await action('cell',0);await action('row',0);
   const partial=await model(resetSpec);assert.deepEqual(partial.board.selected,[0,1,2,3,4,5,6,7,8,9]);
   await action('row',0);const cleared=await model(resetSpec);assert.deepEqual(cleared.board.selected,[]);
   await build(resetSpec,{existing:cleared,early:true,scattered:true});
   const firstResetCheck=await check(resetSpec,true,'partial-row-rebuilt'),beforeReset=await model(resetSpec);
   const beforeProof=replayFdpBoardEvidence(resetTask,beforeReset);await wordsFor(beforeProof);
   assert.equal(beforeProof.changes[1].added.length,9);assert.equal(beforeProof.changes[2].removed.length,10);
   await action('reset');const reset=await model(resetSpec);
   assert.deepEqual(reset.board,{selected:[],seen:['grid']});assert.deepEqual(reset.history.slice(0,beforeReset.history.length),beforeReset.history);
   for(const key of Object.keys(M.fields))assert.equal(reset[key],beforeReset[key]);
   ok(await page.locator('[data-xfield="num"]').count()===0,label+' reset hides the inputs without clearing their saved text');
   ok(await hint.count()===0,label+' reset makes the previous proof stale');
   await reload(resetSpec);assert.deepEqual(await model(resetSpec),reset);ok(await hint.count()===0,label+' hidden draft values survive offline reset restoration');
   await build(resetSpec,{existing:reset,reverse:true,early:true});
   const rebuilt=await check(resetSpec,true,'after-full-reset'),rebuiltProof=replayFdpBoardEvidence(resetTask,await model(resetSpec));
   await wordsFor(rebuiltProof);assert.equal(rebuiltProof.resets.length,2);
   assert.deepEqual(rebuilt.record.cases[resetSpec.index].attempts[0],firstResetCheck.attempt);
   await shot('rebuilt');negatives.push({width,height,kind:'partial-row-and-reset',id:resetSpec.id,index:resetSpec.index,
    partial,cleared,firstResetCheck,beforeReset,reset,rebuilt,proof:rebuiltProof,stored:await snapshot('reset')});

   // These are representation mistakes, not invalid coloring actions. The
   // original grader may accept rational expressions in decimal text boxes;
   // strict representation feedback waits for the actual requested form.
   for(const kind of ['split-numerator','decimal-fraction','percent-fraction','decimal-precision','percent-scale']){
    const spec=cases.find(c=>c.id==='representationmap'&&c.index===2),task=taskFor(spec);
    label=prefix+'-'+kind;await open(spec);await build(spec,{early:true});
    const key=kind==='split-numerator'?'num':kind.startsWith('decimal')?'decimal':'percent';
    const badValue={'split-numerator':'0 3','decimal-fraction':'3/4','percent-fraction':'150/2','decimal-precision':'0.75000001','percent-scale':'0.75'}[kind];
    await field(key,badValue);await action('view','line');
    const originalCorrect=['split-numerator','decimal-fraction','percent-fraction'].includes(kind);
    const faulty=await check(spec,originalCorrect,'invalid-representation'),bad=await model(spec);
    ok(replayFdpBoardEvidence(task,bad)===null&&await hint.count()===0,label+' the current invalid form or value gives no strict evidence');
    assert.equal(bad.history.at(-1).data.fields[key],badValue);
    await reload(spec);ok(await hint.count()===0,label+' offline restore cannot promote a nonmatching current representation');
    await field(key,key==='num'?'3':key==='decimal'?'0.75':'75');
    const corrected=await check(spec,true,'corrected-representation'),proof=replayFdpBoardEvidence(task,await model(spec));
    await wordsFor(proof);assert.deepEqual(corrected.model.history,faulty.model.history);
    assert.deepEqual(corrected.record.cases[spec.index].attempts[0],faulty.attempt);
    await shot('corrected');negatives.push({width,height,kind,id:spec.id,index:spec.index,faulty,corrected,proof,stored:await snapshot('corrected')});
   }

   const correction=cases.find(c=>c.id==='pctNames37'&&c.index===2),correctionTask=taskFor(correction);
   label=prefix+'-real-coloring-correction';await open(correction);await build(correction);
   await action('cell',3);const allFour=await check(correction,false,'four-is-not-three');
   ok(await hint.count()===0,label+' four colored sectors do not prove the requested three quarters');
   await action('cell',3);const corrected=await check(correction,true,'actual-sector-correction');
   const correctionProof=replayFdpBoardEvidence(correctionTask,await model(correction));await wordsFor(correctionProof);
   assert.deepEqual(correctionProof.changes.at(-2).added,[3]);assert.deepEqual(correctionProof.changes.at(-1).removed,[3]);
   assert.deepEqual(corrected.record.cases[correction.index].attempts[0],allFour.attempt);
   negatives.push({width,height,kind:'real-coloring-correction',id:correction.id,index:correction.index,allFour,corrected,proof:correctionProof,stored:await snapshot('quantity-correction')});

   for(const spec of associatedCases){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);
    ok(fdpBoardBinding(taskFor(spec),spec)===null&&await guide.count()===0,label+' the related task has no borrowed native binding or guide');
    await build(spec,{reverse:width===1280,early:width===1280});const checked=await check(spec,true,'associated-original-check');
    await visualFor(spec,checked.model);ok(await hint.count()===0,label+' successful associated work does not inherit strict native feedback');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' the native/associated boundary survives offline restoration');
    if(spec===associatedCases[0])await shot('isolated');
    isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,checked,stored:await snapshot('associated')});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===30&&isolated.length===38,'all 15 native and 19 associated positions ran in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance},null,2));
  console.log('P9_FDPBOARD_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,negatives:negatives.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
