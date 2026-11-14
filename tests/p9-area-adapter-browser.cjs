// Real B30 controls and original checks. Only empty lesson positions are seeded;
// literal reviewed plans supply independent expectations, never the B30 solver.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const {cases,excludedCases,associatedCases}=require('./fixtures/p9-area-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-area-adapter');
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
 const M=await import('../dist/learning/phase5/b30-model.js');
 const {currentSubmission}=await import('../dist/learning/state.js');
 const {areaBinding,replayAreaEvidence:replay}=await import('../dist/learning/area-evidence.js');
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
    const suffix=Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join(''),selector=`[data-x="${name}"]${suffix}`,buttons=page.locator('button'+selector),control=await buttons.count()?buttons:page.locator(selector);
    assert.equal(await control.count(),1,label+' one actual action '+name+suffix);await reveal(control);
    const before=await model(c),expected=cp(before);await control.click();M.act(taskFor(c),expected,name==='turn-extra'?'a30-turn':name,data);
    const after=await model(c);assert.deepEqual(after,expected);assert.deepEqual(after.history.slice(0,before.history.length),before.history);
    ok(after.history.length===before.history.length+1,label+' original visible action appends its exact raw event');return after;
   };
   const act=(c,a,index)=>action(c,a==='turn'?'turn-extra':'a30-'+a,index===undefined?{}:{index});
   const fillAnswers=async c=>{for(const [i,v]of c.answers.entries())await field(c,'answers.'+i,v);};
   const resultFields=async c=>{for(const s of c.actions)if(s.field&&['area','perimeter','unit','areaUnit','radius','diameter'].includes(s.field))await field(c,s.field,s.value);await fillAnswers(c);};
   const rectangle=async(c,[x,y,w,h])=>{const t=taskFor(c);await act(c,'corner',y*t.w+x);await act(c,'corner',(y+h-1)*t.w+x+w-1);await act(c,'rect');};
   const build=async(c,values)=>{for(const[k,v]of ['w1','h1','w2','h2'].map((k,i)=>[k,values[i]]))await field(c,k,v);await act(c,'build');};
   const plan=async c=>{for(const s of c.actions){if(s.field)await field(c,s.field,s.value);else await action(c,s.action,s.data||{});}};
   const repair=async c=>{
    const m=await model(c);
    if(['partition','design'].includes(c.kind))await act(c,'clear');
    if(c.kind==='stadium'){if(m.board.unrolled)await act(c,'unroll');for(const i of m.board.pieces)await act(c,'piece',i);for(const i of m.board.edges)await act(c,'edge',i);}
    if(c.kind==='openbox')for(const i of m.board.selected)await act(c,'face',i);
    await plan(c);ok(M.inspect(taskFor(c),await model(c)).correct,label+' original mathematical completion remains unchanged');
   };
   const wrong=async c=>{
    if(['partition','design'].includes(c.kind)){await act(c,'rect');await rectangle(c,c.expected.independentRectangles[0]);await rectangle(c,c.expected.independentRectangles[0]);}
    if(c.kind==='compare')await build(c,[0,1,1,1]);
    if(c.kind==='pieces'){await field(c,'part',0);await act(c,'part');}
    if(c.kind==='stadium')await act(c,'edge',3);
    if(c.kind==='openbox'){await act(c,'face',4);await field(c,'faceValues.4',600);}
    await resultFields(c);ok(!M.inspect(taskFor(c),await model(c)).correct,label+' first actual construction is wrong under the original grader');
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
    assert.ok(p);const x=p.construction,e=c.expected;assert.equal(p.kind,c.kind);assert.equal(p.history.events.length,m.history.length);assert.equal(p.issue,m.issue);
    if(['partition','design'].includes(c.kind)){const expected=c.kind==='design'?e.constructed:e;assert.equal(x.totalArea,String(expected.area));assert.equal(x.perimeter,String(expected.perimeter));assert.equal(x.boundaryEdges.length,expected.perimeter);assert.equal(x.rectangles.reduce((n,r)=>n+BigInt(r.area),0n),BigInt(x.totalArea));if(c.kind==='design')assert.ok(x.shape);}
    else if(c.kind==='compare'){assert.deepEqual(x.dimensions,e.independentDimensions.map(String));assert.deepEqual(x.areas,e.areas.map(String));assert.deepEqual(x.perimeters,e.perimeters.map(String));}
    else if(c.kind==='pieces'){assert.deepEqual(x.parts.map(p=>p.area),e.pieceAreas);assert.equal(x.area,e.result);assert.equal(x.partitionByTool,true);}
    else if(c.kind==='stadium'){assert.equal(x.perimeter,e.perimeterApprox);assert.equal(x.area,e.areaApprox);assert.equal(x.piApproximation,'157/50');assert.deepEqual(x.edges,[0,1,2]);}
    else{assert.equal(x.surface,e.surface);assert.deepEqual(x.faces.map(f=>f.area),['300','300','200','200','600']);assert.deepEqual(x.excluded,[4]);assert.equal(x.fieldEditTimingKnown,false);}
    assert.deepEqual(m.answers,c.answers);
   };
   const wordsFor=async(c,p)=>{
    ok(!!p&&await hint.isVisible(),label+' latest exact current construction has strict feedback');
    const words=await hint.innerText();ok(/自由解释/.test(words)&&/长期掌握/.test(words),label+' interpretation stays bounded');
    ok(!/MP\.\d|已掌握/.test(words)&&await hint.locator('[data-thinking-node-id]').count()===0,label+' no invented method or mastery label');
    if(p.kind==='pieces')ok(words.includes('预切部分来自工具')&&words.includes(p.construction.area)&&words.includes('你实际记下了这些部分的面积')&&!/分别选中|实际选择/.test(words),label+' part records do not invent active selection or a child-made partition');
    if(p.kind==='compare')ok(words.includes('图和读数由工具显示'),label+' rectangle dimensions and generated drawing have separate attribution');
    if(p.kind==='stadium')ok(words.includes('π≈3.14')&&words.includes('内部接缝'),label+' approximation and actual outside selection remain distinct');
    if(p.kind==='openbox')ok(words.includes('没有保存每个面积字段的唯一编辑时刻')&&words.includes('当前选中底面和四个侧面，没有把上盖计入')&&!words.includes('去掉上盖'),label+' current faces do not invent lid removal or a field timestamp');
    if(p.pending?.unapplied)ok(/待放|待应用|未重新摆出/.test(words),label+' visible pending input is separate from applied construction');
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
   const modules=await page.evaluate(async expected=>{const store=await caches.open(expected);return Promise.all(['storage.js','learning/area-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/phase5/b30-model.js','learning/phase5/b30-view.js','learning/phase5/b30-geometry.js','learning/phase5/b30-solid-view.js','learning/phase5/b30.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},cache);
   const cacheCheck={width,height,cache,report,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};offline.push(cacheCheck);
   ok(report.ready===true&&cacheCheck.missing.length===0,prefix+' current controller has all actual offline dependencies',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP origin is stopped before mathematical interactions');

   for(const c of cases){
    label=prefix+'-'+c.id+'-'+c.index;await open(c);const t=taskFor(c);
    ok(areaBinding(t,c)?.nodeId===c.nodeId,label+' exact native source binding');
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

   for(const c of cases.filter(c=>['partition','design'].includes(c.kind))){
    label=prefix+'-pending-corners-'+c.id+'-'+c.index;await open(c);await plan(c);const snapshots=[await check(c,true,'complete-before-pending')],complete=replay(taskFor(c),snapshots[0].model).construction;
    const [x,y,w,h]=c.expected.independentRectangles[0],t=taskFor(c);
    await act(c,'corner',y*t.w+x);ok(await hint.count()===0,label+' one pending corner retracts the old checked snapshot');const pendingOne=await saved(c.id),pendingOneStorage=await snapshot('one-corner-unchecked');await restore(c,pendingOne,false);snapshots.push(await check(c,true,'one-pending-corner'));assert.equal(replay(t,snapshots.at(-1).model).pending.corners.length,1);
    await act(c,'corner',(y+h-1)*t.w+x+w-1);const pendingTwo=await saved(c.id),pendingTwoStorage=await snapshot('two-corners-unchecked');ok(await hint.count()===0&&currentSubmission(pendingTwo).status==='modified',label+' two pending corners require a new exact snapshot');await restore(c,pendingTwo,false);snapshots.push(await check(c,true,'two-pending-corners'));assert.equal(replay(t,snapshots.at(-1).model).pending.corners.length,2);
    await act(c,'rect');const failed=await model(c);assert.match(failed.issue,/重叠/);snapshots.push(await check(c,true,'terminal-overlap-keeps-complete-board'));const terminal=replay(t,snapshots.at(-1).model);assert.deepEqual(terminal.construction,complete);assert.equal(terminal.issue,failed.issue);await wordsFor(c,terminal);await restore(c,snapshots.at(-1).record,true);await shot('terminal-overlap-with-retained-proof');
    await act(c,'clear');ok(await hint.count()===0,label+' local clear retracts current proof and retains old attempts');await plan(c);snapshots.push(await check(c,true,'clear-and-rebuild'));const proof=replay(t,snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);await restore(c,snapshots.at(-1).record,true);
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'pending-corners-terminal-overlap-and-clear',snapshots,pendingOne,pendingOneStorage,pendingTwo,pendingTwoStorage,proof});
   }
   for(const [id,index,variant,rects,dims]of [
    ['areadistrib',0,'wrong-source-rectangle-direction',[[0,0,6,2],[0,2,6,1]],null],
    ['areaPerim',2,'different-pair-than-source',null,[3,8,4,6]],
    ['lperim',2,'t-shape-is-not-l',[[0,0,10,2],[4,2,2,8]],null]
   ]){
    const c=cases.find(c=>c.id===id&&c.index===index);label=prefix+'-source-boundary-'+id+'-'+index;await open(c);
    if(rects)for(const r of rects)await rectangle(c,r);else await build(c,dims);await resultFields(c);
    const first=await check(c,true,'ordinary-correct-without-source-construction');ok(replay(taskFor(c),first.model)===null&&await hint.count()===0,label+' unchanged original grade cannot claim the named construction');
    await repair(c);const current=await check(c,true,'corrected-source-construction'),proof=replay(taskFor(c),current.model);assertMath(c,current.model,proof);await wordsFor(c,proof);await restore(c,current.record,true);await shot('source-construction-corrected');
    negativeObservations.push({width,height,id,index,variant,snapshots:[first,current],proof});
   }
   {
    const c=cases.find(c=>c.kind==='design');label=prefix+'-mirrored-subdivided-l';await open(c);
    for(const r of [[0,0,10,3],[7,3,3,3],[7,6,3,4]])await rectangle(c,r);await resultFields(c);const current=await check(c,true,'three-rectangles-mirrored-l'),proof=replay(taskFor(c),current.model);
    assert.equal(proof.construction.rectangles.length,3);assert.equal(proof.construction.totalArea,'51');assert.equal(proof.construction.perimeter,'40');assert.equal(proof.construction.shape.removedArea,49);await wordsFor(c,proof);await restore(c,current.record,true);await shot('mirrored-subdivided-l');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'mirrored-l-with-three-actual-rectangles',snapshots:[current],proof});
   }
   for(const c of cases.filter(c=>c.kind==='compare')){
    label=prefix+'-precision-build-'+c.id+'-'+c.index;await open(c);const dims=c.expected.independentDimensions.map(String),near=[...dims];near[0]+='.00000000000000000001';await build(c,near);await fillAnswers(c);
    const snapshots=[await check(c,true,'original-rounded-build')];ok(replay(taskFor(c),snapshots[0].model)===null&&await hint.count()===0,label+' original rounded acceptance is not exact geometry');
    await field(c,'w1',dims[0]);snapshots.push(await check(c,true,'fields-only-do-not-rebuild'));assert.deepEqual(snapshots[1].model.history,snapshots[0].model.history);ok(replay(taskFor(c),snapshots[1].model)===null&&await hint.count()===0,label+' edited fields cannot turn an earlier approximate build into an exact one');
    await act(c,'build');snapshots.push(await check(c,true,'actual-exact-build'));let proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);assert.equal(proof.history.approximateAccepted.length,1);
    await build(c,[0,1,1,1]);for(const [k,v]of ['w1','h1','w2','h2'].map((k,i)=>[k,dims[i]]))await field(c,k,v);snapshots.push(await check(c,true,'terminal-rejected-build-keeps-exact-board'));proof=replay(taskFor(c),snapshots.at(-1).model);assert.match(proof.issue,/1 到 12/);
    const before=snapshots.at(-1);await field(c,'w1',near[0]);const pending=await saved(c.id),pendingStorage=await snapshot('pending-input-unchecked');assert.deepEqual(pending.models[c.index].history,before.model.history);assert.deepEqual(pending.models[c.index].board,before.model.board);ok(await hint.count()===0&&currentSubmission(pending).status==='modified',label+' pending dimension edit withdraws old feedback');await restore(c,pending,false);
    snapshots.push(await check(c,true,'rechecked-with-unapplied-dimension'));proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);assert.equal(proof.pending.mathExact,false);assert.equal(proof.pending.unapplied,true);await wordsFor(c,proof);await restore(c,snapshots.at(-1).record,true);await shot('pending-dimension-keeps-applied-geometry');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'approximate-build-real-correction-and-unapplied-dimension',snapshots,pending,pendingStorage,proof});
   }
   for(const c of cases.filter(c=>c.kind==='pieces')){
    label=prefix+'-precision-part-'+c.id+'-'+c.index;await open(c);await plan(c);const snapshots=[await check(c,true,'complete-exact-parts')];await act(c,'active',0);await field(c,'part',c.expected.pieceAreas[0]+'.00000000000000000001');await act(c,'part');snapshots.push(await check(c,true,'original-rounded-part'));ok(replay(taskFor(c),snapshots.at(-1).model)===null&&await hint.count()===0,label+' a newly accepted approximate part supersedes the earlier exact record without becoming exact evidence');
    await field(c,'part',c.expected.pieceAreas[0]);snapshots.push(await check(c,true,'part-field-only-is-not-a-record'));ok(replay(taskFor(c),snapshots.at(-1).model)===null&&await hint.count()===0,label+' exact field must actually be recorded');
    await act(c,'part');snapshots.push(await check(c,true,'actual-exact-part-record'));let proof=replay(taskFor(c),snapshots.at(-1).model);assert.equal(proof.history.approximateAccepted.length,1);const kept=cp(proof.construction);
    await field(c,'part',0);await act(c,'part');snapshots.push(await check(c,true,'terminal-rejected-part-keeps-exact-record'));proof=replay(taskFor(c),snapshots.at(-1).model);assert.deepEqual(proof.construction,kept);assert.match(proof.issue,/这一块/);
    const before=snapshots.at(-1);await field(c,'part',7);const pending=await saved(c.id),pendingStorage=await snapshot('pending-input-unchecked');assert.deepEqual(pending.models[c.index].history,before.model.history);assert.deepEqual(pending.models[c.index].board,before.model.board);ok(await hint.count()===0&&currentSubmission(pending).status==='modified',label+' unapplied part edit withdraws old snapshot');await restore(c,pending,false);
    snapshots.push(await check(c,true,'rechecked-with-unapplied-part'));proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);assert.deepEqual(proof.construction,kept);assert.equal(proof.pending.unapplied,true);await wordsFor(c,proof);await restore(c,snapshots.at(-1).record,true);await shot('pending-part-and-terminal-failure-retained');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'approximate-part-real-correction-terminal-failure-and-pending-input',snapshots,pending,pendingStorage,proof});
   }
   {
    const c=cases.find(c=>c.kind==='stadium');label=prefix+'-internal-seam-and-pi';await open(c);await plan(c);await act(c,'edge',3);const snapshots=[await check(c,false,'internal-seam-is-not-outer-edge')];await act(c,'edge',3);snapshots.push(await check(c,true,'removed-internal-seam'));await field(c,'perimeter','28.560000000000001');snapshots.push(await check(c,true,'ordinary-near-answer-is-not-exact-pi-approximation'));ok(replay(taskFor(c),snapshots.at(-1).model)===null&&await hint.count()===0,label+' final answer itself must satisfy the stated exact approximation');await field(c,'perimeter','714/25');snapshots.push(await check(c,true,'exact-fraction-of-stated-approximation'));const proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);await wordsFor(c,proof);await restore(c,snapshots.at(-1).record,true);await shot('corrected-seam-and-specified-pi');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'seam-correction-and-exact-specified-pi',snapshots,proof});
   }
   {
    const c=cases.find(c=>c.kind==='openbox');label=prefix+'-removed-lid-retained-value';await open(c);await plan(c);const snapshots=[await check(c,true,'five-surface-faces')];await act(c,'face',4);await field(c,'faceValues.4',600);snapshots.push(await check(c,false,'lid-added-to-open-box'));await act(c,'face',4);ok(await page.locator('[data-xfield="faceValues.4"]').count()===0,label+' removed lid input is truly hidden');snapshots.push(await check(c,true,'removed-lid-value-retained'));const proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);assert.equal(proof.construction.storedUnselected[0].raw,'600');assert.equal(proof.construction.storedUnselected[0].counted,false);await wordsFor(c,proof);await restore(c,snapshots.at(-1).record,true);await shot('unselected-lid-value-kept-out-of-total');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'visible-lid-edit-then-unselected-hidden-value',snapshots,proof});
   }

   // All 44 associated sources retain their own completion and provenance.
   for(const c of associatedCases){
    label=prefix+'-associated-'+c.id+'-'+c.index;await open(c);ok(await guide.count()===0&&await hint.count()===0,label+' associated source has no native guide');
    await plan(c);const current=await check(c,true,'associated-original-check');ok(areaBinding(taskFor(c),c)===null&&await hint.count()===0,label+' completed associated work does not inherit native evidence');
    await restore(c,current.record,false);isolated.push({width,height,id:c.id,index:c.index,taskHash:c.taskHash,task:taskFor(c),expected:c.expected,snapshot:current});
   }
   const excludedShots=new Set(['gridarea:0','gridarea:1','triArea:0','circleArea:0','solidSurface:1','solidSurface:2']);
   for(const c of excludedCases){
    label=prefix+'-excluded-'+c.id+'-'+c.index;await open(c);await plan(c);const current=await check(c,true,'excluded-original-check');
    ok(areaBinding(taskFor(c),c)===null&&replay(taskFor(c),current.model)===null&&await guide.count()===0&&await hint.count()===0,label+' answer/tool-only work remains outside strict construction coverage');
    await restore(c,current.record,false);if(excludedShots.has(c.id+':'+c.index))await shot('ordinary-completion-stays-unbound');excluded.push({width,height,id:c.id,index:c.index,taskHash:c.taskHash,snapshot:current});
   }
   await context.close();context=null;activePage=null;diagnostics=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===17*2&&retries.length===17*2*2,'all 17 sources have five checks and both actual shared retries at both viewports');
  ok(isolated.length===44*2&&excluded.length===26*2,'all 44 associated sources and all 26 excluded sources remain unbound');
  ok(negativeObservations.length===(7+3+1+4+4+1+1)*2,'all geometry histories retain precision correction, terminal failures and unapplied-input boundaries');
  const result={checks,errors,remote,observations,negativeObservations,isolated,excluded,retries,offline,provenance,viewports,nativeTasks:17,nativeNodes:9,associatedTasks:44,excludedNativeTasks:26,originStopped:offline.every(x=>x.originStopped)};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log('P9_AREA_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:17,associatedTasks:44,taskViewportPairs:observations.length,retries:retries.length}));
 }catch(error){
  const diagnosticFile=diagnostics?await diagnostics.dump(error).catch(()=>null):null;
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,isolated,excluded,retries,offline,provenance,error:String(error),stack:error.stack,at:label,diagnosticFile},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
