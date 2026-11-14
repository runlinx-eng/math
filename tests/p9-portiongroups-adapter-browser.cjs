// Real B16 group/token/take/reset controls. Only empty lesson positions are
// seeded; all constructions and five native submissions use the visible UI.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const fixture=require('./fixtures/p9-portiongroups-cases.cjs');
const {cases,associatedCases}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-portiongroups-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],explorations=[],isolated=[],offline=[];
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

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b16-model.js');
 const {portionGroupsBinding,replayPortionGroupsEvidence}=await import('../dist/learning/portiongroups-evidence.js');
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
   const action=async(name,index)=>{
    const control=page.locator(`[data-x="b16-${name}"]${index===undefined?'':`[data-index="${index}"]`}`);
    await reveal(control);await control.click();
   };
   const build=async(spec,{reverse=false,early=false,existing=null}={})=>{
    const task=taskFor(spec),expected=existing?structuredClone(existing):M.initial(task);
    const a=async(name,index)=>{await action(name,index);M.act(task,expected,'b16-'+name,index===undefined?{}:{index});};
    const f=async(key,value)=>{await field(key,value);expected[key]=String(value);M.field(task,expected,key);};
    const selected=Array.from({length:task.n},(_,i)=>reverse?task.d-i-1:i);
    if(early)for(const group of selected)await a('take',group);
    const order=Array.from({length:task.d},(_,i)=>i);if(reverse)order.reverse();
    for(const group of order){
     await a('group',group);
     const tokens=Array.from({length:task.total},(_,i)=>i).filter(i=>i%task.d===group);if(reverse)tokens.reverse();
     for(const token of tokens)await a('token',token);
    }
    if(!early)for(const group of selected)await a('take',group);
    await f('per',task.total/task.d);await f('answer',task.total*task.n/task.d);
    if(task.name){await f('num',task.n);await f('den',task.d);}
    if(task.equation)await f('equation',task.equation[0]);
    assert.deepEqual(await model(spec),expected);
    ok(true,label+' all real controls preserve the full original model and event snapshots');return expected;
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
    ok(!!proof&&await hint.isVisible(),label+' strict feedback appears only for the current successful checked work');
    const words=await hint.innerText();
    for(const value of [proof.total,proof.partitions,proof.each,proof.selectedGroups.length,proof.selectedTotal])
     ok(words.includes(String(value)),label+' feedback names actual group/token quantity '+value);
    ok(/整体|全部/.test(words)&&/组/.test(words)&&/选/.test(words),label+' whole, equal groups and selected quantity remain distinguishable');
    if(proof.fraction.submitted)ok(words.includes('提交')&&words.includes(proof.fraction.submitted.numerator+'/'+proof.fraction.submitted.denominator),
     label+' equivalent fraction is attributed to the submitted name, not reinterpreted as actual group counts');
    if(proof.equation)ok(words.includes('提交')&&words.includes(proof.equation.raw),label+' written equation is identified as a submission');
    if(proof.confirmations.length)ok(words.includes(`${proof.confirmations.length} 次点击`)&&words.includes('没有换组')&&words.includes('不算新的移动'),label+' repeated clicks are retained without inventing a move or quantity');
    ok(!/先(?:把|将)?.{0,12}(?:平均分|均分).{0,15}再/.test(words),label+' feedback does not invent an obligatory order of selection and distribution');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' no mathematical-practice label is inferred');
    ok(/长期掌握/.test(words)&&/自由解释|自由文字/.test(words),label+' interpretation stays bounded');return words;
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
    const store=await caches.open(expected);return Promise.all(['storage.js','learning/portiongroups-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js',
     'learning/phase5/b16-model.js','learning/phase5/b16-view.js','learning/phase5/b38-more.js','learning/phase4/async-batches.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};
   offline.push(cacheCheck);ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' current activated controller has all offline dependencies',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP origin stops before every mathematical interaction');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),reverse=width===1280,early=width===1280;
    await open(spec);ok(portionGroupsBinding(task,spec)?.nodeId===spec.nodeId,label+' native position matches the reviewed source');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide begins collapsed');
    ok(await hint.count()===0,label+' no strict feedback precedes real interaction');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' optional question opens through the real summary');
    let afterGuide;
    for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    if(spec===cases[0])await shot('01-guide');await guide.locator('summary').click();
    assert.deepEqual(afterGuide.models,beforeGuide.models);
    ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,
     label+' guide support does not add mathematical events or a checked attempt');
    ok(await page.locator('[data-xfield="per"]').count()===0,label+' answer fields wait for actual token distribution');
    await build(spec,{reverse,early});ok(await hint.count()===0,label+' correct construction alone is still unchecked');
    const snapshots=[];await field('answer',spec.answer+1);snapshots.push(await check(spec,false,'01-wrong-answer'));
    ok(await hint.count()===0,label+' wrong selected quantity receives no strict feedback');
    await field('answer',spec.answer);snapshots.push(await check(spec,true,'02-correct-answer'));
    const first=await model(spec),proof=replayPortionGroupsEvidence(task,first),words=await wordsFor(proof);
    assert.equal(proof.total,spec.total);assert.equal(proof.each,spec.each);assert.equal(proof.selectedTotal,spec.answer);
    assert.equal(proof.assignments.length,spec.total);
    if(early)ok(proof.selections.at(-1).historyIndex<proof.assignments[0].historyIndex,label+' actual early selection remains a legal path');
    const correctRecord=await saved(spec.id);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,correctRecord.models);assert.deepEqual((await saved(spec.id)).cases,correctRecord.cases);
    ok(await hint.isVisible(),label+' full successful work and attempt history survive offline reload');
    await field('per',spec.each+1);ok(await hint.count()===0,label+' editing per-group quantity immediately removes stale feedback');
    if(spec===cases[0])await shot('03-edited');await reload(spec);ok(await hint.count()===0,label+' reload does not restore the obsolete check');
    snapshots.push(await check(spec,false,'03-wrong-after-edit'));ok(await hint.count()===0,label+' newest wrong check outranks earlier successful evidence');
    await field('per',spec.each);snapshots.push(await check(spec,true,'04-correct-after-edit'));await wordsFor(replayPortionGroupsEvidence(task,await model(spec)));
    const beforeMoves=await model(spec);
    await action('group',1);await action('token',0);ok(await hint.count()===0,label+' a real cross-group move invalidates the old checked work');
    const moved=await model(spec);ok(moved.board.groups[0]===1,label+' the original token identity actually changes group');
    await action('group',0);await action('token',0);
    if(task.name){await field('num',width===1440?3:2);await field('den',width===1440?12:8);}
    if(task.equation)await field('equation',task.equation[0].split('=').reverse().join('=').replaceAll('/','÷').replaceAll('*','×'));
    const revised=await model(spec);assert.deepEqual(revised.history.slice(0,beforeMoves.history.length),beforeMoves.history);
    ok(revised.history.length===beforeMoves.history.length+4&&!same(revised,first),label+' returning the token keeps four actual navigation/move events');
    ok(await hint.count()===0,label+' corrected construction still needs its own new check');
    snapshots.push(await check(spec,true,'05-rechecked-real-moves'));
    const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replayPortionGroupsEvidence(task,finalModel),finalWords=await wordsFor(finalProof);
    assert.equal(finalProof.assignments.length,spec.total+2);assert.equal(finalProof.selectedTotal,spec.answer);
    ok(end.cases[spec.index].attempts.length===5&&snapshots.length===5,label+' five complete real checked snapshots are retained');
    for(const [i,item]of snapshots.entries())assert.deepEqual(item.attempt,end.cases[spec.index].attempts[i]);
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no new score or mastery record is written');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);
    ok(await hint.isVisible(),label+' final new proof survives stopped-origin restoration');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    await shot('05-verified-offline');const stored=await snapshot('final');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,
     reverse,early,proof,words,first,snapshots,finalProof,finalWords,finalModel,record:end,stored});
   }

   // The original same-group click and reset/rebuild scenarios remain. Each
   // no-op is now retained as a confirmation, without inventing a token move.
   for(const [id,index]of [['halfpaper',0],['unitsets',2],['nonunitamount',1],['multiShape38',2]]){
    const spec=cases.find(c=>c.id===id&&c.index===index),task=taskFor(spec);label=prefix+'-confirmation-history-'+id+'-'+index;
    await open(spec);await build(spec);const beforeConfirmation=await model(spec),originalProof=replayPortionGroupsEvidence(task,beforeConfirmation);
    await action('group',0);const sameGroup=structuredClone((await model(spec)).board);await action('token',0);
    const confirmed=await model(spec),confirmationProof=replayPortionGroupsEvidence(task,confirmed);
    assert.deepEqual(confirmed.board,sameGroup);assert.deepEqual(confirmed.history.slice(0,beforeConfirmation.history.length),beforeConfirmation.history);
    ok(M.inspect(task,confirmed).correct&&confirmationProof?.confirmations.length===1,label+' a visible same-group click remains correct and is recorded as a confirmation');
    assert.deepEqual(confirmationProof.assignments,originalProof.assignments);
    ok(await hint.count()===0,label+' the current confirmation still requires its own check');
    const confirmedCheck=await check(spec,true,'checked-confirmation'),confirmedWords=await wordsFor(confirmationProof),confirmedStored=await snapshot('confirmed');
    const beforeReset=await model(spec);await action('reset');const reset=await model(spec);
    assert.deepEqual(reset.history.slice(0,beforeReset.history.length),beforeReset.history);
    assert.deepEqual(reset.board,{groups:Array(task.total).fill(-1),group:0,taken:[]});
    for(const key of Object.keys(M.fields))assert.equal(reset[key],beforeReset[key]);
    ok(await page.locator('[data-xfield="per"]').count()===0,label+' reset hides answer controls but keeps all old input values');
    ok(await hint.count()===0,label+' reset invalidates the previously checked confirmation');
    const resetCheck=await check(spec,false,'reset-needs-rebuilding');ok(await hint.count()===0,label+' an empty reset board is unfinished');
    const resetStored=await snapshot('reset');
    await build(spec,{reverse:true,early:true,existing:reset});const checked=await check(spec,true,'correct-after-retained-no-op');
    const current=await model(spec),proof=replayPortionGroupsEvidence(task,current),words=await wordsFor(proof);
    assert.deepEqual(proof.confirmations,confirmationProof.confirmations);assert.equal(proof.assignments.length,task.total*2);
    assert.deepEqual(current.history.slice(0,reset.history.length),reset.history);
    ok(checked.record.cases[spec.index].attempts.length===3,label+' confirmation, unfinished reset and rebuilt work all retain complete checked snapshots');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    await wordsFor(replayPortionGroupsEvidence(task,await model(spec)));await shot('retained');
    explorations.push({width,height,kind:'no-op-before-reset',id,index,beforeConfirmation,beforeReset,reset,confirmedCheck,resetCheck,checked,
     confirmationProof,proof,confirmedWords,words,confirmedStored,resetStored,stored:await snapshot('rebuilt')});
   }

   // These are submitted-field mistakes, not invalid mathematical actions.
   // A corrected current submission can be verified without rewriting history.
   for(const kind of ['equation-precision','split-numerator']){
    const spec=cases.find(c=>kind==='equation-precision'?c.id==='nonunitamount'&&c.index===1:c.id==='unitsets'&&c.index===2);
    const task=taskFor(spec);label=prefix+'-'+kind;await open(spec);await build(spec);
    if(kind==='equation-precision')await field('equation',width===1440?'18.0000000000000001/3*2=12':'18/3*2=12.0000000000000001');
    else await field('num','0 1');
    const faulty=await check(spec,true,'original-parser-result'),bad=await model(spec);
    ok(replayPortionGroupsEvidence(task,bad)===null&&await hint.count()===0,label+' permissive original parser success is not exact mathematical evidence');
    await reload(spec);ok(await hint.count()===0,label+' invalid submitted literal remains without strict evidence offline');
    if(kind==='equation-precision')await field('equation','12=2×(18÷3)');else{await field('num','3');await field('den','12');}
    const corrected=await check(spec,true,'corrected-submission'),proof=replayPortionGroupsEvidence(task,await model(spec));
    await wordsFor(proof);assert.deepEqual(corrected.model.history,faulty.model.history);
    assert.deepEqual(corrected.record.cases[spec.index].attempts[0],faulty.attempt);
    await shot('corrected');negatives.push({width,height,kind,id:spec.id,index:spec.index,faulty,corrected,proof,stored:await snapshot('corrected')});
   }

   const correction=cases[0];label=prefix+'-real-selection-and-sharing-correction';await open(correction);await build(correction);
   await action('take',1);const tooMany=await check(correction,false,'too-many-selected-groups');ok(await hint.count()===0,label+' all groups selected cannot stand for the requested half');
   await action('take',1);await action('group',1);await action('token',0);const unequal=await check(correction,false,'unequal-groups');
   ok(await hint.count()===0,label+' incorrect equal-sharing construction receives no strict evidence');
   await action('group',0);await action('token',0);const corrected=await check(correction,true,'real-correction');
   const correctionProof=replayPortionGroupsEvidence(taskFor(correction),await model(correction));await wordsFor(correctionProof);
   negatives.push({width,height,kind:'real-quantity-correction',id:correction.id,index:correction.index,tooMany,unequal,corrected,proof:correctionProof});

   for(const spec of associatedCases){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);
    ok(portionGroupsBinding(taskFor(spec),spec)===null&&await guide.count()===0,label+' associated task has no borrowed native binding or guide');
    await build(spec,{reverse:width===1280,early:width===1280});await action('group',0);await action('token',0);
    const proof=replayPortionGroupsEvidence(taskFor(spec),await model(spec));ok(proof?.confirmations.length===1,label+' a real associated same-group click is a mathematical no-op');
    const checked=await check(spec,true,'associated-original-check');
    ok(await hint.count()===0,label+' successful associated work does not inherit native strict feedback');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    ok(await hint.count()===0,label+' offline restore preserves the associated-task boundary');
    if(spec===associatedCases[0])await shot('isolated');
    isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,checked,proof,stored:await snapshot('associated')});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===26&&isolated.length===40,'all 13 native and 20 associated positions ran in both viewports');
  ok(explorations.length===8&&negatives.length===6,'all original no-op/reset explorations and precision/quantity counterexamples are retained');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,explorations,isolated,offline,viewports,provenance},null,2));
  console.log('P9_PORTIONGROUPS_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,negatives:negatives.length,explorations:explorations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,explorations,isolated,offline,viewports,provenance,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
