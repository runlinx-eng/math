// Real B30 controls, original checks and actual Next navigation. No lesson/model
// seeding. Literal reviewed plans supply expectations, never the B30 solver.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const {createExcludedFeedbackAudit}=require('./helpers/p9-area-time-excluded-feedback.cjs');
const fixture=require('./fixtures/p9-area-cases.cjs'),{cases,excludedCases,associatedCases}=fixture;
const navigationFixture=require('./fixtures/p9-area-navigation.cjs'),{navigation}=navigationFixture;
function orderedAreaTargets(){
 const selected=[...cases.map(c=>({...c,role:'native'})),...associatedCases.map(c=>({...c,role:'associated'})),
  ...excludedCases.map(c=>({...c,role:'excluded'}))];
 return [...new Set(selected.map(c=>c.id))].flatMap(id=>selected.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));
}
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-area-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],isolated=[],excluded=[],retries=[],boundaryRetries=[],offline=[],preparations=[],backups=[],navigationTransitions=[],rangeInputs=[];
const snapshotFiles=new Set();
const ok=(value,label,detail={})=>{assert.ok(value,label);checks.push({label,...detail});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),cp=structuredClone;
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>crypto.createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

async function main(){
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
  githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,workflow:process.env.GITHUB_WORKFLOW||null,
  sourceHashes:{...fixture.sourceFiles,...navigationFixture.sourceHashes},workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),
  childTrial:false,independentTeachingReview:false,seededCorrectWork:false,seededLessonPositions:false,realBrowserBackupImport:false,backupImportsCompleted:0};
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready,prepareSessionRuntime}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();await prepareSessionRuntime('tools39',{view:true});
 const M=await import('../dist/learning/phase5/b30-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js');
 const {setField}=await import('../dist/learning/phase4/ui.js');
 const Core=await import('../dist/exploration-core.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const {currentSubmission}=await import('../dist/learning/state.js');
 const {areaBinding,replayAreaEvidence:replay}=await import('../dist/learning/area-evidence.js');
 const {studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const taskFor=c=>sessionTasks(c.id)[c.index];
 const auditExcludedFeedback=await createExcludedFeedbackAudit('area',excludedCases,taskFor);
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
     for(const [id,record]of Object.entries(left)){assert.ok(right[id]);assert.deepEqual(right[id].models,record.models);assert.deepEqual(right[id].cases,record.cases);assert.deepEqual(right[id].notes,record.notes);assert.equal(right[id].draft,record.draft);}
   };
   const saved=async id=>{const state=JSON.parse((await read()).text);return state.lessons[id]||state.daily.bridges[id];};
   const model=async c=>(await saved(c.id)).models[c.index];
   const wait=c=>page.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},c);
   const reload=async c=>{const response=await page.reload();await wait(c);ok(response?.fromServiceWorker()===true,label+' real reload uses the stopped-origin service worker');};
   const snapshot=async(suffix,current=page)=>{
    const value=await readPage(current),stem=label+'-'+suffix,raw=stem+'-storage.txt',state=stem+'-state.json';originalState(JSON.parse(value.text));
    for(const file of [raw,state]){assert.equal(snapshotFiles.has(file),false,'each original snapshot has a unique filename: '+file);snapshotFiles.add(file);}
    fs.writeFileSync(path.join(out,raw),value.raw);fs.writeFileSync(path.join(out,state),value.text);return {raw,state};
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
      for(const step of prep.steps){await perform(previous,step);}
      assert.equal(Tasks.inspect(task,await model(previous)).correct,true);
      const checked=await check(previous,true,'navigation-prerequisite-'+at);preparations.push({width,height,...prep,checked,strictAreaCoverage:false});
     }
     const before=originalState(JSON.parse((await read()).text)),next=page.locator('#actions [data-do="next"]');
     assert.equal(await next.count(),1);assert.equal(await next.isEnabled(),true);await next.click();const fromIndex=at;at++;
     await wait({id:c.id,index:at});const after=originalState(JSON.parse((await read()).text));
     for(const [left,right]of [[before.lessons,after.lessons],[before.daily.bridges,after.daily.bridges]])for(const [id,record]of Object.entries(left)){
      assert.ok(right[id]);assert.deepEqual(right[id].cases,record.cases);assert.deepEqual(right[id].notes,record.notes);
      for(const [i,value]of Object.entries(record.models))assert.deepEqual(right[id].models[i],value);
     }
     const preceding=before.lessons[c.id]||before.daily.bridges[c.id];
     navigationTransitions.push({width,height,id:c.id,fromIndex,toIndex:at,checkedAttemptIds:preceding.cases[fromIndex].attempts.map(x=>x.id)});
    }
    const record=await saved(c.id),m=record.models[c.index];assert.deepEqual(m,Tasks.defaultModel(taskFor(c)));
    ok((record.cases[c.index]?.attempts?.length??0)===0,label+' untouched work has zero checks without any state injection');
    const expected=studyActionFocus({task:taskFor(c),model:m}).readyToCheck;
    ok(await page.locator('#actions [data-do="check"]').isEnabled()===expected,label+' actual empty-work check availability agrees with existing studyActionFocus');
   };
   const resetCurrent=async c=>{
    const before=await saved(c.id),control=page.locator('[data-do="p3-retry"]');assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();await wait(c);
    const after=await saved(c.id);assert.deepEqual(after.models[c.index],M.initial(taskFor(c)));assert.deepEqual(after.cases,before.cases);assert.deepEqual(after.notes,before.notes);
    for(const [i,value]of Object.entries(before.models))if(Number(i)!==c.index)assert.deepEqual(after.models[i],value);
    ok(await hint.count()===0,label+' real boundary retry preserves all earlier checks');
    boundaryRetries.push({width,height,id:c.id,index:c.index,variant:label,before,after,storage:await snapshot('boundary-shared-retry')});
   };
   const reveal=async control=>{
    for(let i=0;i<10;i++){
     const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');
     if(!(await closed.count()))return;await closed.locator(':scope > summary').click();
    }
    assert.fail('too many nested disclosures');
   };
   const field=async(c,key,value,coreField=false)=>{
    const attribute=coreField?'data-field':'data-xfield',control=page.locator(`[${attribute}="${key}"]`);
    assert.equal(await control.count(),1,label+' one original '+attribute+' '+key);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before),tag=await control.evaluate(e=>e.tagName),inputType=await control.getAttribute('type');
    const write=raw=>{
     const numeric=['number','range'].includes(inputType)||(coreField?key==='choice':key.startsWith('pair.'));
     let next=numeric?(String(raw)===''?null:Number(raw)):String(raw);
     if(coreField){if(numeric&&next!==null)next=Math.max(0,Math.min(999,Math.trunc(next)));expected[key]=next;}
     else{setField(expected,key,next);Engine.fieldExtra(taskFor(c),expected,key);}
    };
    if(inputType==='range'){
     const min=Number(await control.getAttribute('min')??0),max=Number(await control.getAttribute('max')??100),step=Number(await control.getAttribute('step')??1),target=Number(value),steps=Math.round((target-min)/step);
     assert.ok(Number.isFinite(step)&&step>0&&target>=min&&target<=max&&Math.abs(min+steps*step-target)<1e-9,label+' exact keyboard-reachable range target');
     const initial=Number(await control.inputValue());await control.focus();await control.press('Home');
     if(initial!==min){write(min);rangeInputs.push({width,height,id:c.id,index:c.index,field:key,coreField,key:'Home',value:min});}
     assert.deepEqual(await model(c),expected);assert.equal(Number(await control.inputValue()),min);
     for(let i=1;i<=steps;i++){
      await control.press('ArrowRight');const next=min+i*step;write(next);
      assert.deepEqual(await model(c),expected);assert.equal(Number(await control.inputValue()),next);
      rangeInputs.push({width,height,id:c.id,index:c.index,field:key,coreField,key:'ArrowRight',value:next});
     }
    }else{
     if(tag==='SELECT')await control.selectOption(String(value));else await control.fill(String(value));
     write(value);assert.deepEqual(await model(c),expected);
    }
    assert.equal(Tasks.validModel(taskFor(c),expected),true);return expected;
   };
   const action=async(c,name,data={})=>{
    const suffix=Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join(''),selector=`[data-x="${name}"]${suffix}`;
    const buttons=page.locator('button'+selector),control=await buttons.count()?buttons:page.locator(selector);
    assert.equal(await control.count(),1,label+' one original control '+name+suffix);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before);await control.click();
    Engine.actExtra(taskFor(c),expected,name==='turn-extra'?'a30-turn':name,data);
    const after=await model(c);assert.deepEqual(after,expected);
    if(Array.isArray(before.history))assert.deepEqual(after.history.slice(0,before.history.length),before.history);
    if(taskFor(c).type.startsWith('x-a30-'))ok(after.history.length===before.history.length+1,label+' original visible action appends its exact raw event');
    assert.equal(Tasks.validModel(taskFor(c),after),true);return after;
   };
   const perform=async(c,step)=>{
    if(step.coreField)await field(c,step.coreField,step.value,true);
    else if(step.field)await field(c,step.field,step.value);
    else await action(c,step.action,cp(step.data||{}));
   };
   const act=(c,a,index)=>action(c,a==='turn'?'turn-extra':'a30-'+a,index===undefined?{}:{index});
   const fillAnswers=async c=>{for(const [i,v]of c.answers.entries())await field(c,'answers.'+i,v);};
   const resultFields=async c=>{for(const s of c.actions)if(s.field&&['area','perimeter','unit','areaUnit','radius','diameter'].includes(s.field))await field(c,s.field,s.value);await fillAnswers(c);};
   const rectangle=async(c,[x,y,w,h])=>{const t=taskFor(c);await act(c,'corner',y*t.w+x);await act(c,'corner',(y+h-1)*t.w+x+w-1);await act(c,'rect');};
   const build=async(c,values)=>{for(const[k,v]of ['w1','h1','w2','h2'].map((k,i)=>[k,values[i]]))await field(c,k,v);await act(c,'build');};
   const plan=async c=>{for(const step of c.actions)await perform(c,step);};
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
    assert.equal(Tasks.inspect(taskFor(c),beforeModel).correct,correct);
    await reveal(control);ok(await control.isEnabled(),label+' '+suffix+' original check control is enabled');await control.click();
    const after=await saved(c.id),attempts=after.cases[c.index].attempts,attempt=attempts.at(-1);
    assert.deepEqual(attempts.slice(0,-1),before.cases[c.index]?.attempts??[]);assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[c.index],beforeModel);
    ok(attempts.length===(before.cases[c.index]?.attempts?.length??0)+1,label+' '+suffix+' saves exactly one original checked snapshot');
    for(const [i,value]of Object.entries(before.models))if(Number(i)!==c.index)assert.deepEqual(after.models[i],value);
    for(const [i,value]of Object.entries(before.cases))if(Number(i)!==c.index)assert.deepEqual(after.cases[i],value);
    originalState(JSON.parse((await read()).text));
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' retains original check metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' shows the actual original result');
    return {name:suffix,correct,model:beforeModel,attempt,record:after,storage:await snapshot(suffix)};
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
   const wordsFor=async(c,p,current=page)=>{
    const hint=current.locator('#thinking-feedback');
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
   const assertRetainedMath=(c,m,p,variant)=>{
    if(variant==='mirrored-l-with-three-actual-rectangles'){
     assert.ok(p);assert.equal(p.kind,'design');assert.equal(p.construction.rectangles.length,3);
     assert.equal(p.construction.totalArea,'51');assert.equal(p.construction.perimeter,'40');assert.equal(p.construction.shape.removedArea,49);
     assert.equal(p.construction.boundaryEdges.length,40);assert.equal(p.history.events.length,m.history.length);assert.deepEqual(m.answers,c.answers);
    }else assertMath(c,m,p);
   };
   const restore=async(c,record,expectDisplayedFeedback)=>{
    const beforeState=originalState(JSON.parse((await read()).text));await reload(c);const after=await saved(c.id);assert.deepEqual(after.models,record.models);assert.deepEqual(after.cases,record.cases);assert.deepEqual(after.notes,record.notes);assert.equal(after.draft,record.draft);keepRecords(beforeState,originalState(JSON.parse((await read()).text)));
    ok((await hint.count()>0)===expectDisplayedFeedback,label+' stopped-origin reload retains current feedback boundary');return after;
   };
   const retry=async(c,suffix)=>{
    const before=await saved(c.id),control=page.locator('[data-do="p3-retry"]');assert.equal(await control.count(),1);await reveal(control);await control.click();await wait(c);
    const after=await saved(c.id);assert.deepEqual(after.models[c.index],M.initial(taskFor(c)));assert.deepEqual(after.cases,before.cases);assert.deepEqual(after.notes,before.notes);
    for(const [i,value]of Object.entries(before.models))if(Number(i)!==c.index)assert.deepEqual(after.models[i],value);
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
    const names=[...new Set(['storage.js','v2.html','learn.html','exploration-core.js','exploration.js',
     'learning/area-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js',
     'learning/phase4/async-batches.js','learning/phase4/view-engine.js','learning/phase5/b39.js',
     ...Object.keys(provenance.sourceHashes).map(file=>file.replace(/^dist\//,''))])];
    const modules=await current.evaluate(async({cache,names})=>{
     const store=await caches.open(cache);return Promise.all(names.map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
    },{cache,names});
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
    await runBoundaries(c);
   };

   const runBoundaries=async currentSpec=>{
   for(const c of cases.filter(c=>['partition','design'].includes(c.kind)&&c.id===currentSpec.id&&c.index===currentSpec.index)){
    label=prefix+'-pending-corners-'+c.id+'-'+c.index;await resetCurrent(c);await plan(c);const snapshots=[await check(c,true,'complete-before-pending')],complete=replay(taskFor(c),snapshots[0].model).construction;
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
    if(id!==currentSpec.id||index!==currentSpec.index)continue;
    const c=currentSpec;label=prefix+'-source-boundary-'+id+'-'+index;await resetCurrent(c);
    if(rects)for(const r of rects)await rectangle(c,r);else await build(c,dims);await resultFields(c);
    const first=await check(c,true,'ordinary-correct-without-source-construction');ok(replay(taskFor(c),first.model)===null&&await hint.count()===0,label+' unchanged original grade cannot claim the named construction');
    await repair(c);const current=await check(c,true,'corrected-source-construction'),proof=replay(taskFor(c),current.model);assertMath(c,current.model,proof);await wordsFor(c,proof);await restore(c,current.record,true);await shot('source-construction-corrected');
    negativeObservations.push({width,height,id,index,variant,snapshots:[first,current],proof});
   }
   if(currentSpec.kind==='design'){
    const c=currentSpec;label=prefix+'-mirrored-subdivided-l';await resetCurrent(c);
    for(const r of [[0,0,10,3],[7,3,3,3],[7,6,3,4]])await rectangle(c,r);await resultFields(c);const current=await check(c,true,'three-rectangles-mirrored-l'),proof=replay(taskFor(c),current.model);
    assert.equal(proof.construction.rectangles.length,3);assert.equal(proof.construction.totalArea,'51');assert.equal(proof.construction.perimeter,'40');assert.equal(proof.construction.shape.removedArea,49);await wordsFor(c,proof);await restore(c,current.record,true);await shot('mirrored-subdivided-l');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'mirrored-l-with-three-actual-rectangles',snapshots:[current],proof});
   }
   for(const c of cases.filter(c=>c.kind==='compare'&&c.id===currentSpec.id&&c.index===currentSpec.index)){
    label=prefix+'-precision-build-'+c.id+'-'+c.index;await resetCurrent(c);const dims=c.expected.independentDimensions.map(String),near=[...dims];near[0]+='.00000000000000000001';await build(c,near);await fillAnswers(c);
    const snapshots=[await check(c,true,'original-rounded-build')];ok(replay(taskFor(c),snapshots[0].model)===null&&await hint.count()===0,label+' original rounded acceptance is not exact geometry');
    await field(c,'w1',dims[0]);snapshots.push(await check(c,true,'fields-only-do-not-rebuild'));assert.deepEqual(snapshots[1].model.history,snapshots[0].model.history);ok(replay(taskFor(c),snapshots[1].model)===null&&await hint.count()===0,label+' edited fields cannot turn an earlier approximate build into an exact one');
    await act(c,'build');snapshots.push(await check(c,true,'actual-exact-build'));let proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);assert.equal(proof.history.approximateAccepted.length,1);
    await build(c,[0,1,1,1]);for(const [k,v]of ['w1','h1','w2','h2'].map((k,i)=>[k,dims[i]]))await field(c,k,v);snapshots.push(await check(c,true,'terminal-rejected-build-keeps-exact-board'));proof=replay(taskFor(c),snapshots.at(-1).model);assert.match(proof.issue,/1 到 12/);
    const before=snapshots.at(-1);await field(c,'w1',near[0]);const pending=await saved(c.id),pendingStorage=await snapshot('pending-input-unchecked');assert.deepEqual(pending.models[c.index].history,before.model.history);assert.deepEqual(pending.models[c.index].board,before.model.board);ok(await hint.count()===0&&currentSubmission(pending).status==='modified',label+' pending dimension edit withdraws old feedback');await restore(c,pending,false);
    snapshots.push(await check(c,true,'rechecked-with-unapplied-dimension'));proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);assert.equal(proof.pending.mathExact,false);assert.equal(proof.pending.unapplied,true);await wordsFor(c,proof);await restore(c,snapshots.at(-1).record,true);await shot('pending-dimension-keeps-applied-geometry');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'approximate-build-real-correction-and-unapplied-dimension',snapshots,pending,pendingStorage,proof});
   }
   for(const c of cases.filter(c=>c.kind==='pieces'&&c.id===currentSpec.id&&c.index===currentSpec.index)){
    label=prefix+'-precision-part-'+c.id+'-'+c.index;await resetCurrent(c);await plan(c);const snapshots=[await check(c,true,'complete-exact-parts')];await act(c,'active',0);await field(c,'part',c.expected.pieceAreas[0]+'.00000000000000000001');await act(c,'part');snapshots.push(await check(c,true,'original-rounded-part'));ok(replay(taskFor(c),snapshots.at(-1).model)===null&&await hint.count()===0,label+' a newly accepted approximate part supersedes the earlier exact record without becoming exact evidence');
    await field(c,'part',c.expected.pieceAreas[0]);snapshots.push(await check(c,true,'part-field-only-is-not-a-record'));ok(replay(taskFor(c),snapshots.at(-1).model)===null&&await hint.count()===0,label+' exact field must actually be recorded');
    await act(c,'part');snapshots.push(await check(c,true,'actual-exact-part-record'));let proof=replay(taskFor(c),snapshots.at(-1).model);assert.equal(proof.history.approximateAccepted.length,1);const kept=cp(proof.construction);
    await field(c,'part',0);await act(c,'part');snapshots.push(await check(c,true,'terminal-rejected-part-keeps-exact-record'));proof=replay(taskFor(c),snapshots.at(-1).model);assert.deepEqual(proof.construction,kept);assert.match(proof.issue,/这一块/);
    const before=snapshots.at(-1);await field(c,'part',7);const pending=await saved(c.id),pendingStorage=await snapshot('pending-input-unchecked');assert.deepEqual(pending.models[c.index].history,before.model.history);assert.deepEqual(pending.models[c.index].board,before.model.board);ok(await hint.count()===0&&currentSubmission(pending).status==='modified',label+' unapplied part edit withdraws old snapshot');await restore(c,pending,false);
    snapshots.push(await check(c,true,'rechecked-with-unapplied-part'));proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);assert.deepEqual(proof.construction,kept);assert.equal(proof.pending.unapplied,true);await wordsFor(c,proof);await restore(c,snapshots.at(-1).record,true);await shot('pending-part-and-terminal-failure-retained');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'approximate-part-real-correction-terminal-failure-and-pending-input',snapshots,pending,pendingStorage,proof});
   }
   if(currentSpec.kind==='stadium'){
    const c=currentSpec;label=prefix+'-internal-seam-and-pi';await resetCurrent(c);await plan(c);await act(c,'edge',3);const snapshots=[await check(c,false,'internal-seam-is-not-outer-edge')];await act(c,'edge',3);snapshots.push(await check(c,true,'removed-internal-seam'));await field(c,'perimeter','28.560000000000001');snapshots.push(await check(c,true,'ordinary-near-answer-is-not-exact-pi-approximation'));ok(replay(taskFor(c),snapshots.at(-1).model)===null&&await hint.count()===0,label+' final answer itself must satisfy the stated exact approximation');await field(c,'perimeter','714/25');snapshots.push(await check(c,true,'exact-fraction-of-stated-approximation'));const proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);await wordsFor(c,proof);await restore(c,snapshots.at(-1).record,true);await shot('corrected-seam-and-specified-pi');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'seam-correction-and-exact-specified-pi',snapshots,proof});
   }
   if(currentSpec.kind==='openbox'){
    const c=currentSpec;label=prefix+'-removed-lid-retained-value';await resetCurrent(c);await plan(c);const snapshots=[await check(c,true,'five-surface-faces')];await act(c,'face',4);await field(c,'faceValues.4',600);snapshots.push(await check(c,false,'lid-added-to-open-box'));await act(c,'face',4);ok(await page.locator('[data-xfield="faceValues.4"]').count()===0,label+' removed lid input is truly hidden');snapshots.push(await check(c,true,'removed-lid-value-retained'));const proof=replay(taskFor(c),snapshots.at(-1).model);assertMath(c,snapshots.at(-1).model,proof);assert.equal(proof.construction.storedUnselected[0].raw,'600');assert.equal(proof.construction.storedUnselected[0].counted,false);await wordsFor(c,proof);await restore(c,snapshots.at(-1).record,true);await shot('unselected-lid-value-kept-out-of-total');
    negativeObservations.push({width,height,id:c.id,index:c.index,variant:'visible-lid-edit-then-unselected-hidden-value',snapshots,proof});
   }

   };

   // All 44 associated sources retain their own completion and provenance.
   const runAssociated=async c=>{
    label=prefix+'-associated-'+c.id+'-'+c.index;await open(c);ok(await guide.count()===0&&await hint.count()===0,label+' associated source has no native guide');
    await plan(c);const current=await check(c,true,'associated-original-check');ok(areaBinding(taskFor(c),c)===null&&await hint.count()===0,label+' completed associated work does not inherit native evidence');
    await restore(c,current.record,false);isolated.push({width,height,id:c.id,index:c.index,taskHash:c.taskHash,task:taskFor(c),expected:c.expected,snapshot:current});
   };
   const excludedShots=new Set(['gridarea:0','gridarea:1','triArea:0','circleArea:0','solidSurface:1','solidSurface:2']);
   const runExcluded=async c=>{
    label=prefix+'-excluded-'+c.id+'-'+c.index;await open(c);
    const initial=await saved(c.id);await auditExcludedFeedback(page,c,initial.models[c.index],initial.cases[c.index]??null);
    await plan(c);const current=await check(c,true,'excluded-original-check');
    ok(areaBinding(taskFor(c),c)===null&&replay(taskFor(c),current.model)===null,label+' stays outside the original area family construction coverage');
    const otherFamily=await auditExcludedFeedback(page,c,current.model,current.record.cases[c.index]);
    const reloaded=await restore(c,current.record,otherFamily.feedback);assert.deepEqual(await auditExcludedFeedback(page,c,reloaded.models[c.index],reloaded.cases[c.index]),otherFamily);
    if(excludedShots.has(c.id+':'+c.index))await shot('ordinary-completion-stays-unbound');excluded.push({width,height,id:c.id,index:c.index,taskHash:c.taskHash,snapshot:current,otherFamily});
   };
   for(const c of orderedAreaTargets()){
    if(c.role==='native')await runNative(c);else if(c.role==='associated')await runAssociated(c);else await runExcluded(c);
   }
   label=prefix+'-actual-v2-backup';const exportResponse=await page.goto(base+'v2.html#trail');ok(exportResponse?.fromServiceWorker()===true,label+' original export page opens offline');await page.locator('#import-file').waitFor({state:'attached'});
   await page.locator('#main [data-do="export"]').first().waitFor();
   const download=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const exported=await download;
   const backupPath=path.join(out,label+'.json');await exported.saveAs(backupPath);const payload=fs.readFileSync(backupPath,'utf8'),backup=JSON.parse(payload);
   assert.equal(backup.version,2);assert.deepEqual(backup.state,JSON.parse((await read()).text));originalState(backup.state);assert.deepEqual(Core.parseBackup(payload,atlas),backup.state);
   for(const c of cases){
    const record=backup.state.lessons[c.id],observed=observations.find(x=>x.width===width&&x.id===c.id&&x.index===c.index);
    const extra=negativeObservations.filter(x=>x.width===width&&x.id===c.id&&x.index===c.index);
    const snapshots=[...observed.snapshots,...extra.flatMap(x=>x.snapshots)],attempts=snapshots.map(x=>x.attempt);
    const expected=c.kind==='partition'?10+(c.id==='areadistrib'&&c.index===0?2:0):c.kind==='design'?13:c.kind==='compare'?10+(c.id==='areaPerim'&&c.index===2?2:0):c.kind==='pieces'?11:c.kind==='stadium'?9:8;
    assert.equal(attempts.length,expected);
    assert.deepEqual(record.cases[c.index].attempts,attempts);assert.deepEqual(record.models[c.index],snapshots.at(-1).model);
    assert.deepEqual(attempts.slice(0,5).map(x=>Tasks.inspect(taskFor(c),x.value).correct),[false,true,false,true,true]);
    assertRetainedMath(c,record.models[c.index],replay(taskFor(c),record.models[c.index]),extra.at(-1)?.variant);
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
   for(const item of [...retries,...boundaryRetries].filter(x=>x.width===width)){
    const record=backup.state.lessons[item.id],prior=item.before.cases[item.index].attempts;
    assert.deepEqual(record.cases[item.index].attempts.slice(0,prior.length),prior);assert.deepEqual(item.after.cases,item.before.cases);
    assert.deepEqual(item.after.models[item.index],M.initial(taskFor(item)));assert.deepEqual(item.after.notes,item.before.notes);
    for(const [index,entry]of Object.entries(item.before.cases))assert.deepEqual(record.cases[index].attempts.slice(0,entry.attempts.length),entry.attempts);
    for(const [index,value]of Object.entries(item.before.models))if(Number(index)!==item.index)assert.deepEqual(item.after.models[index],value);
   }
   const allRecords=[...Object.values(backup.state.lessons),...Object.values(backup.state.daily.bridges)];assert.equal(allRecords.length,49);
   const allCases=allRecords.flatMap(r=>Object.values(r.cases));assert.equal(allCases.length,111);assert.equal(allCases.reduce((n,c)=>n+c.attempts.length,0),272);
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
   await importFile('area-real-browser-v2.json');const restored=await readPage(restorePage),restoredState=JSON.parse(restored.text);
   assert.deepEqual(restoredState,backup.state);originalState(restoredState);provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   for(const c of cases){const m=restoredState.lessons[c.id].models[c.index],last=negativeObservations.filter(x=>x.width===width&&x.id===c.id&&x.index===c.index).at(-1);assertRetainedMath(c,m,replay(taskFor(c),m),last?.variant);}
   const firstImportFile=label+'-first-import-storage.txt';fs.writeFileSync(path.join(out,firstImportFile),restored.raw);
   await importFile('area-identical-repeat-v2.json');const repeated=await readPage(restorePage);assert.equal(repeated.raw,restored.raw);
   assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);provenance.backupImportsCompleted++;
   const repeatedImportFile=label+'-repeated-import-storage.txt';fs.writeFileSync(path.join(out,repeatedImportFile),repeated.raw);
   ok(true,label+' complete first import and byte-identical repeat both preserve every record');
   const restoreSpec=cases.find(c=>c.id==='netSurface'&&c.index===2);assert.equal(backup.state.lessons[restoreSpec.id].index,restoreSpec.index);const lessonResponse=await restorePage.goto(base+'learn.html#'+restoreSpec.id);
   await restorePage.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},restoreSpec);
   ok(lessonResponse?.fromServiceWorker()===true,label+' imported original lesson opens from stopped-origin cache');
   const afterOpen=originalState(JSON.parse((await readPage(restorePage)).text)),restoredRecord=afterOpen.lessons[restoreSpec.id];keepRecords(backup.state,afterOpen);
   assert.deepEqual(restoredRecord.models,backup.state.lessons[restoreSpec.id].models);assert.deepEqual(restoredRecord.cases,backup.state.lessons[restoreSpec.id].cases);
   const restoredProof=replay(taskFor(restoreSpec),restoredRecord.models[restoreSpec.index]);assertMath(restoreSpec,restoredRecord.models[restoreSpec.index],restoredProof);
   const restoredWords=await wordsFor(restoreSpec,restoredProof,restorePage);await shot('restored',restorePage);const restoredSnapshot=await snapshot('restored',restorePage);
   backups.push({width,height,file:path.basename(backupPath),bytes:Buffer.byteLength(payload),sha256:digest(payload),originalState:backup.state,restoredState,restoredSnapshot,restoredProof,restoredWords,
    independentEmptyContext:true,firstImportRaw:{file:firstImportFile,bytes:Buffer.byteLength(restored.raw),sha256:digest(restored.raw)},
    repeatedImportRaw:{file:repeatedImportFile,bytes:Buffer.byteLength(repeated.raw),sha256:digest(repeated.raw)},originStopped:!server.listening,
    nativeCases:17,associatedCases:44,excludedCases:26,navigationPrerequisites:24,importsCompleted:2,idempotent:true});

   await context.close();context=null;await restoreContext.close();restoreContext=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===17*2&&retries.length===17*2*2,'all 17 native sources retain five main checks and two real shared retries per viewport');
  ok(isolated.length===44*2&&excluded.length===26*2,'all 44 associated and 26 excluded original sources remain outside strict area-family coverage');
  ok(boundaryRetries.length===42&&negativeObservations.length===42,'all 21 boundary scenarios per viewport begin with real current-position retry');
  ok(preparations.length===48&&navigationTransitions.length===124,'both viewports complete 24 real prerequisites and 62 real forward Next actions');
  ok(backups.length===2&&provenance.backupImportsCompleted===4,'two independent empty contexts receive four actual v2 file-input imports');
  const attemptCounts={native:observations.reduce((n,x)=>n+x.snapshots.length,0)+negativeObservations.reduce((n,x)=>n+x.snapshots.length,0),associated:isolated.length,excluded:excluded.length,navigationPrerequisites:preparations.length};
  assert.deepEqual(attemptCounts,{native:356,associated:88,excluded:52,navigationPrerequisites:48});
  assert.equal(Object.values(attemptCounts).reduce((a,b)=>a+b,0),544);assert.equal(retries.length+boundaryRetries.length,110);
  const checkedSnapshots=[...observations.flatMap(x=>x.snapshots),...negativeObservations.flatMap(x=>x.snapshots),...isolated.map(x=>x.snapshot),...excluded.map(x=>x.snapshot),...preparations.map(x=>x.checked)];
  assert.equal(checkedSnapshots.length,544);assert.equal(new Set(checkedSnapshots.map(x=>x.storage.raw)).size,544);assert.equal(new Set(checkedSnapshots.map(x=>x.storage.state)).size,544);
  const snapshotFileCounts={checked:checkedSnapshots.length,uniqueRaw:new Set(checkedSnapshots.map(x=>x.storage.raw)).size,uniqueState:new Set(checkedSnapshots.map(x=>x.storage.state)).size,totalSnapshotFiles:snapshotFiles.size};
  const result={status:'success',checks,errors,remote,observations,negativeObservations,isolated,excluded,retries,boundaryRetries,offline,preparations,navigationTransitions,rangeInputs,backups,attemptCounts,snapshotFileCounts,provenance,viewports,nativeTasks:17,nativeNodes:9,associatedTasks:44,excludedNativeTasks:26,originStopped:offline.every(x=>x.originStopped)};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log('P9_AREA_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:17,associatedTasks:44,taskViewportPairs:observations.length,retries:retries.length,boundaryRetries:boundaryRetries.length,attemptCounts,backups:backups.length,navigationTransitions:navigationTransitions.length}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(diagnosticError=>({diagnosticError:String(diagnosticError)})):null;
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:'failure',checks,errors,remote,observations,negativeObservations,isolated,excluded,retries,boundaryRetries,offline,preparations,navigationTransitions,rangeInputs,backups,provenance,error:String(error),stack:error.stack,at:label,diagnosticFile},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(context)await context.close();if(restoreContext)await restoreContext.close();if(browser)await browser.close();
 }
}
module.exports={orderedAreaTargets};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
