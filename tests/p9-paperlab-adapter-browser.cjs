// Actual B16 paper controls in two stopped-origin Chromium contexts. Native
// and associated positions are reached by ordinary lessons and Next; no state,
// lesson index, model, answer, successful attempt or proof is injected.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-paperlab-cases.cjs'),{cases,bridges,practices,navigation}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-paperlab-adapter');
const viewports=[[1440,900],[1280,720]],fields=['rows','cols','answer','choice','color'];
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
// Explicit mathematical layouts; changing color labels never changes a partition.
const paintPatterns=[
 [0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3],
 [0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3],
 [0,0,1,1,0,0,1,1,2,2,3,3,2,2,3,3]
];
function paperPlan(spec,{reverse=false}={}){
 const task=spec.task,steps=[],field=(key,value)=>steps.push({field:key,value:String(value)}),
  action=(name,data={})=>steps.push({action:'b16-'+name,data});
 if(task.mode==='classify'){
  const truths=spec.expected.truth;
  for(const truth of truths){field('choice',truth?'yes':'no');if(task.writeName)field('answer','1/'+task.d);action('judge');}
 }else if(task.mode==='paint'){
  for(const cells of paintPatterns.slice(0,2)){
   const indices=Array.from({length:16},(_,i)=>i);if(reverse)indices.reverse();
   for(const index of indices){field('color',cells[index]);action('paint',{index});}action('save');
  }field('answer','1/4');
 }else{
  if(task.mode==='fold'){for(let count=1;count<task.d;count*=2)action('fold',{value:reverse?'y':'x'});}
  else{const rows=reverse&&!task.shape?2:1;field('rows',rows);field('cols',task.d/rows);action('partition');}
  for(let count=0;count<(task.take||1);count++)action('paper',{index:reverse?task.d-1-count:count});
  field('answer',(task.take||1)+'/'+task.d);
 }return steps;
}
function navigationPlan(spec){
 const t=spec.task,steps=[],field=(key,value)=>steps.push({field:key,value:String(value)}),
  action=(name,data={})=>steps.push({action:'b16-'+name,data});
 if(t.type==='x-portiongroups'){
  assert.ok([8,12].includes(t.total));assert.equal(t.n,1);
  const per=t.total/t.d;
  for(let group=0;group<t.d;group++){action('group',{index:group});for(let n=0;n<per;n++)action('token',{index:group*per+n});}
  action('take',{index:0});field('per',per);field('answer',per);
 }else if(t.type==='x-unitwalk'){
  assert.equal(t.n,10);assert.equal(t.d,10);assert.equal(t.whole,true);
  field('parts','10');action('partition');for(let n=0;n<10;n++)action('walk');
  field('answer','1');field('whole','1');field('remainder','0');
 }else{
  assert.equal(t.type,'x-samefraction');assert.deepEqual(t.left,[1,2]);assert.deepEqual(t.right,[1,4]);assert.equal(t.common,false);
  field('prediction','>');action('predict');action('fraction',{row:'left',index:0});action('fraction',{row:'right',index:0});
  action('overlay');field('relation','>');field('reason','same-whole');
 }return steps;
}

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const checks=[],errors=[],remote=[],observations=[],preparations=[],isolated=[],offline=[],backups=[];
 const ok=(condition,label,details={})=>{assert.ok(condition,label);checks.push({label,...details});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
  githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,sourceHashes:fixture.sourceHashes,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),childTrial:false,
  independentTeachingReview:false,seededCorrectWork:false,seededLessonPosition:false,realBrowserBackupImport:false,backupImportsCompleted:0};
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b16-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js');
 const Core=await import('../dist/exploration-core.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const {paperLabBinding,replayPaperLabEvidence}=await import('../dist/learning/paperlab-evidence.js');
 const taskFor=spec=>sessionTasks(spec.id)[spec.index],ctx=spec=>({sessionId:spec.id,index:spec.index});
 assert.equal(cases.length,12);assert.equal(bridges.length,24);assert.equal(practices.length,3);assert.equal(navigation.length,5);
 for(const spec of [...cases,...bridges]){assert.equal(hash(taskFor(spec)),spec.taskHash);assert.deepEqual(taskFor(spec),spec.task);}
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 for(const spec of practices){assert.deepEqual(Tasks.PRACTICE[spec.id],spec.task);assert.equal(hash(Tasks.PRACTICE[spec.id]),spec.taskHash);assert.equal(paperLabBinding(spec.task,ctx(spec)),null);}
 for(const prep of navigation){assert.deepEqual(taskFor(prep),prep.task);assert.equal(hash(prep.task),prep.taskHash);}
 fs.writeFileSync(path.join(out,'sources.json'),JSON.stringify({provenance,cases,bridges,practices,navigation},null,2));
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 let browser,server,activePage,label='setup',failureDiagnostic=null;const contexts=new Set(),diagnostics=new Map();
 const readPage=page=>page.evaluate(async()=>{const {readStored}=await import('./storage.js');
  return{raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
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
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});contexts.add(context);
   // Prepare an independent, empty cache while the origin is available, so
   // the later real backup import also works with the HTTP origin stopped.
   const restoreContext=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});contexts.add(restoreContext);
   for(const current of [context,restoreContext])current.on('request',request=>{
    if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());
   });
   const page=activePage=await context.newPage(),restorePage=await restoreContext.newPage();
   for(const current of [page,restorePage]){
    current.setDefaultTimeout(20000);current.on('pageerror',error=>errors.push({label,error:String(error)}));
    diagnostics.set(current,observeBrowserDiagnostics(current,{out,base,label:()=>label}));
   }
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
     const store=await caches.open(expected);return Promise.all(['storage.js','exploration-core.js','exploration.js',
      'learning/paperlab-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
      'learning/state.js','learning/tasks.js','learning/phase5/b16-model.js','learning/phase5/b16-view.js',
      'learning/phase5/b16.js','learning/phase5/b17.js',
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

   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const state=async()=>JSON.parse((await readPage(page)).text);
   const saved=async id=>{const s=await state();return s.lessons[id]||s.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const wait=(current,spec)=>current.waitForFunction(({id,index})=>{
    const value=window.mathLesson?.snapshot();return value?.id===id&&value.index===index&&value.view==='task';
   },spec);
   const reload=async spec=>{const response=await page.reload();await wait(page,spec);
    ok(response?.fromServiceWorker()===true,label+' real document reload is served after the origin stopped');};
   const reveal=async control=>{for(let i=0;i<10;i++){
    const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');if(!(await closed.count()))return;
    await closed.locator(':scope > summary').click();
   }assert.fail('too many nested disclosures');};
   const field=async(spec,key,value)=>{
    const expected=structuredClone(await model(spec)),control=page.locator(`[data-xfield="${key}"]`);
    assert.equal(await control.count(),1,label+' one real field '+key);await reveal(control);ok(await control.isVisible()&&await control.isEnabled(),label+' visible enabled field '+key);if(await control.evaluate(el=>el.tagName==='SELECT'))await control.selectOption(String(value));else await control.fill(String(value));
    expected[key]=String(value);Engine.fieldExtra(taskFor(spec),expected,key);assert.deepEqual(await model(spec),expected);return expected;
   };
   const action=async(spec,name,data={})=>{
    const expected=structuredClone(await model(spec)),selector=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const fullAction=name.startsWith('b')?name:'b16-'+name,control=page.locator(`[data-x="${fullAction}"]${selector}`);assert.equal(await control.count(),1,label+' one real action '+name+selector);
    await reveal(control);ok(await control.isVisible()&&await control.isEnabled(),label+' visible enabled action '+fullAction);await control.click();Engine.actExtra(taskFor(spec),expected,fullAction,data);
    assert.deepEqual(await model(spec),expected);ok(Tasks.validModel(taskFor(spec),expected),label+' original model after '+name);return expected;
   };
   const shot=async(suffix,current=page)=>{await current.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await current.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const snapshot=async(suffix,current=page)=>{const stored=await readPage(current);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),stored.raw);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),stored.text);return originalState(JSON.parse(stored.text));};
   const check=async(spec,correct,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]),control=page.locator('#actions [data-do="check"]');
    await reveal(control);await control.click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves exactly one actual checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    assert.equal(new Set(attempts.map(value=>value.id)).size,attempts.length);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' keeps original attempt metadata');
    assert.equal(Tasks.inspect(taskFor(spec),beforeModel).correct,correct);
    originalState(await state());
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' observes original grading');
    return {name:suffix,correct,model:beforeModel,attempt,record:after};
   };
   const runSteps=async(spec,steps)=>{
    for(const step of steps)if(step.field)await field(spec,step.field,step.value);else await action(spec,step.action,step.data);
   };
   const visual=async spec=>{
    const task=taskFor(spec),current=await model(spec),b=current.board;
    const visible=task.mode==='paint'?['color',...(b.saved.length>=2?['answer']:[])]:
     task.mode==='classify'?(b.judgments.length<task.cases.length?['choice',...(task.writeName?['answer']:[])]:[]):
     task.mode==='build'?['rows','cols',...(b.rows*b.cols>1?['answer']:[])]:b.rows*b.cols>1?['answer']:[];
    for(const key of fields)assert.equal(await page.locator(`[data-xfield="${key}"]`).count(),visible.includes(key)?1:0,label+' source field window '+key);
    assert.equal(await page.locator('[data-x="b16-reset"]').count(),1);
    if(['build','fold'].includes(task.mode)){
     const parts=page.locator('#extra-visual [data-x="b16-paper"]');assert.equal(await parts.count(),b.rows*b.cols);
     assert.deepEqual(await parts.evaluateAll(es=>es.map(e=>Number(e.dataset.index))),Array.from({length:b.rows*b.cols},(_,i)=>i));
     assert.deepEqual(await parts.evaluateAll(es=>es.flatMap(e=>e.getAttribute('aria-pressed')==='true'?[Number(e.dataset.index)]:[])),[...b.selected].sort((a,b)=>a-b));
     const dimensions=await parts.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return[r.width,r.height];}));
     ok(dimensions.every(([w,h])=>w>0&&h>0),label+' all source-defined parts have visible positive area');
     if(task.shape!=='circle'){
      const widths=dimensions.map(([w])=>w),heights=dimensions.map(([,h])=>h);
      ok(Math.max(...widths)-Math.min(...widths)<1&&Math.max(...heights)-Math.min(...heights)<1,label+' rectangular unit cells have equal rendered dimensions within pixel rounding');
     }
    }else if(task.mode==='paint'){
     const cells=page.locator('#extra-visual [data-x="b16-paint"]');assert.equal(await cells.count(),16);
     assert.deepEqual(await cells.evaluateAll(es=>es.map(e=>Number(e.dataset.index))),Array.from({length:16},(_,i)=>i));
     const colors=['rgb(220, 154, 98)','rgb(109, 166, 155)','rgb(169, 152, 201)','rgb(230, 189, 87)'];
     assert.deepEqual(await cells.evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundColor)),b.cells.map(c=>c<0?'rgb(249, 244, 233)':colors[c]));
     assert.equal(await page.locator('#extra-visual .b16-saved > div').count(),b.saved.length);
    }else{
     const pieces=page.locator('#extra-visual .b16-piece-row > span'),actual=task.cases[b.judgments.length]||[];
     assert.equal(await pieces.count(),actual.length);
     for(const [i,count]of actual.entries()){
      assert.equal(await pieces.nth(i).locator('i').count(),count);
      assert.equal(await pieces.nth(i).getAttribute('aria-label'),`第${i+1}份占${count}格`);
     }
    }
   };
   const proofFor=(spec,current)=>{
    const task=taskFor(spec),proof=replayPaperLabEvidence(task,current);assert.ok(proof,label+' current complete paper evidence');
    assert.equal(M.valid(task,current),true);assert.equal(M.inspect(task,current).correct,true);
    assert.equal(proof.d,task.d);assert.equal(proof.mode,task.mode);assert.equal(proof.method,null);
    assert.equal(proof.acceptedHistoryLength,current.history.length);assert.equal(proof.operations.length,current.history.length);
    assert.deepEqual(proof.selectedIds,current.board.selected);assert.equal(proof.first,current.board.first);
    assert.equal(proof.issue,current.issue);assert.equal(proof.round,proof.resets.length);
    for(const [i,event]of proof.operations.entries()){
     assert.equal(event.historyIndex,i);assert.equal(event.action,current.history[i].action);
     assert.deepEqual(event.fields,current.history[i].data.fields);
    }
    assert.equal(proof.folds.length,current.board.folds.length);
    assert.deepEqual(proof.savedWork.map(saved=>saved.colors),current.board.saved);
    assert.deepEqual(proof.judgements.filter(j=>j.correct).map(j=>j.choice),current.board.judgments);
    if(task.mode==='classify'){
     const successful=proof.judgements.filter(j=>j.correct);
     assert.deepEqual(successful.map(j=>j.truth),spec.expected.truth);
     assert.deepEqual(successful.map(j=>j.observedShares),spec.expected.shares);
    }else if(task.mode==='paint'){
     for(const work of proof.savedWork){assert.deepEqual(work.groups.map(group=>group.length),[4,4,4,4]);
      assert.deepEqual([...work.groups.flat()].sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i));}
     assert.deepEqual(proof.currentDraft.colorCounts,[0,1,2,3].map(c=>current.board.cells.filter(x=>x===c).length));
     assert.equal(proof.currentDraft.valid,proof.currentDraft.colorCounts.every(n=>n===4));
    }else assert.deepEqual(proof.answer,spec.expected.answer);
    assert.equal(proof.toolCreatedGrid,true);assert.equal(proof.independentDrawingAssessed,false);
    assert.equal(proof.generalMasteryAssessed,false);assert.equal(proof.exactKeystrokeOrderKnown,false);
    assert.equal(proof.allLaterClicksRecorded,false);assert.equal(proof.recordingLimit,2000);return proof;
   };
   const wordsFor=async proof=>{
    ok(await hint.isVisible(),label+' only the latest complete checked work has strict feedback');const words=await hint.innerText();
    ok(/工具/.test(words)&&/当前完整提交/.test(words)&&/独立作图/.test(words)&&/自由解释/.test(words)&&/长期掌握/.test(words),label+' tool displays and the assessment limits remain explicit');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d|你已掌握|已经掌握/.test(words),label+' no invented method or mastery claim');
    if(proof.mode==='paint')ok(words.includes(`最后一轮已经保存 ${proof.savedWork.length} 种`),label+' saved current work excludes earlier reset rounds');
    if(proof.mode==='classify')ok(words.includes(`最后一轮逐张核对了 ${proof.judgements.filter(j=>j.correct).length} 种`),label+' classification counts only the current completed round');
    if(proof.issue)ok(words.includes('提示仍保留'),label+' the real final failed request stays visible');
    return words;
   };
   const navigate=async id=>{
    const beforeURL=new URL(page.url()),target=new URL(base+'learn.html#'+id),response=await page.goto(target.href);
    await wait(page,{id,index:0});
    if(response)ok(response.fromServiceWorker()===true,label+' original lesson document comes from stopped-origin cache');
    else{assert.equal(beforeURL.origin,target.origin);assert.equal(beforeURL.pathname,target.pathname);assert.notEqual(beforeURL.hash,target.hash);
     ok(true,label+' original lesson opens through the existing document hash');}
    offline.push({width,height,id,phase:'lesson-navigation',navigationMode:response?'document':'hash',fromServiceWorker:response?.fromServiceWorker()??null});
   };
   const open=async spec=>{
    const current=await page.evaluate(()=>window.mathLesson?.snapshot());
    if(current?.id!==spec.id)await navigate(spec.id);
    let at=(await saved(spec.id)).index;
    while(at<spec.index){
     const previous={id:spec.id,index:at},task=taskFor(previous),record=await saved(spec.id);
     if(!record.cases[at]?.attempts?.some(attempt=>Tasks.inspect(task,attempt.value).correct)){
      const prep=navigation.find(x=>x.id===spec.id&&x.index===at);assert.ok(prep,'a frozen real prerequisite exists');
      await runSteps(prep,navigationPlan(prep));const checked=await check(prep,true,'navigation-prerequisite');
      preparations.push({width,height,...prep,checked,nativePaperCoverage:false});
     }
     const before=structuredClone(await saved(spec.id));await page.locator('#actions [data-do="next"]').click();at++;
     await wait(page,{id:spec.id,index:at});const after=await saved(spec.id);assert.deepEqual(after.cases,before.cases);
     for(const [i,value]of Object.entries(before.models))assert.deepEqual(after.models[i],value);
    }
    assert.equal(at,spec.index);assert.deepEqual(await model(spec),M.initial(taskFor(spec)));
    ok(!(await saved(spec.id)).cases[spec.index]?.attempts?.length,label+' reached an empty position without seeded work or location');
   };
   const paint=async(spec,cells,reverse=false)=>{
    const indices=Array.from({length:16},(_,i)=>i);if(reverse)indices.reverse();
    for(const index of indices){await field(spec,'color',cells[index]);await action(spec,'paint',{index});}
   };

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),reverse=width===1280;
    await open(spec);await visual(spec);assert.equal(paperLabBinding(task,ctx(spec))?.nodeId,spec.nodeId);
    ok(await guide.isVisible()&&!(await guide.evaluate(el=>el.open)),label+' optional source guide begins collapsed');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),label+' visible summary opens source question');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support)break;await page.waitForTimeout(50);}
    assert.deepEqual(afterGuide.models,beforeGuide.models);ok(afterGuide.cases[spec.index]?.support===true,label+' optional help cannot manufacture mathematical work');
    await guide.locator('summary').click();const snapshots=[],special=[];
    if(task.mode==='classify'){
     await action(spec,'judge');assert.equal((await model(spec)).board.first,'');
     await field(spec,'choice',spec.expected.truth[0]?'no':'yes');await action(spec,'judge');
    }else{
     if(task.mode==='build'){await field(spec,'rows','7');await action(spec,'partition');assert.ok((await model(spec)).issue);}
     if(task.mode==='paint'){await action(spec,'save');assert.ok((await model(spec)).issue);}
     await runSteps(spec,paperPlan(spec,{reverse}));await field(spec,'answer','999');
    }
    snapshots.push(await check(spec,false,'01-original-wrong'));ok(await hint.count()===0,label+' wrong submission has no evidence');await shot('01-wrong');
    if(task.mode==='classify')await runSteps(spec,paperPlan(spec));
    else await field(spec,'answer',task.mode==='paint'?'1/4':(task.take||1)+'/'+task.d);
    snapshots.push(await check(spec,true,'02-corrected'));const first=await model(spec),firstProof=proofFor(spec,first);await wordsFor(firstProof);await visual(spec);
    const beforeReload=await saved(spec.id);await reload(spec);assert.deepEqual((await saved(spec.id)).models,beforeReload.models);
    assert.deepEqual((await saved(spec.id)).cases,beforeReload.cases);await wordsFor(proofFor(spec,await model(spec)));
    if(task.mode==='classify'){
     assert.equal(firstProof.first,'');assert.ok(firstProof.failures.length>=2);
     await action(spec,'reset');snapshots.push(await check(spec,false,'03-reset-empty'));
     await field(spec,'choice',spec.expected.truth[0]?'no':'yes');await action(spec,'judge');
     snapshots.push(await check(spec,false,'04-reset-wrong'));
     await runSteps(spec,paperPlan(spec));snapshots.push(await check(spec,true,'05-reset-corrected'));
    }else{
     await field(spec,'answer',task.mode==='paint'?'2/8':2*(task.take||1)+'/'+2*task.d);
     ok(await hint.count()===0,label+' equivalent edited text invalidates the previous complete submission');
     await reload(spec);ok(await hint.count()===0,label+' offline restore cannot revive obsolete feedback');
     snapshots.push(await check(spec,true,'03-equivalent-current'));await wordsFor(proofFor(spec,await model(spec)));
     if(task.mode==='paint'){
      await paint(spec,paintPatterns[1].map(color=>(color+1)%4),reverse);await action(spec,'save');
      assert.equal((await model(spec)).board.saved.length,2);assert.ok((await model(spec)).issue);
      snapshots.push(await check(spec,true,'04-duplicate-color-labels'));let p=proofFor(spec,await model(spec));assert.ok(p.failures.length>=2);await wordsFor(p);
      await paint(spec,paintPatterns[2],reverse);snapshots.push(await check(spec,true,'05-valid-unsaved-draft'));
      p=proofFor(spec,await model(spec));assert.equal(p.currentDraft.valid,true);assert.equal(p.currentDraft.alreadySaved,false);assert.equal(p.savedWork.length,2);await wordsFor(p);
      await field(spec,'color','3');await action(spec,'paint',{index:0});snapshots.push(await check(spec,true,'06-invalid-unsaved-draft'));
      p=proofFor(spec,await model(spec));assert.equal(p.currentDraft.valid,false);assert.equal(p.savedWork.length,2);await wordsFor(p);
      special.push({kind:'saved-work-versus-draft',proof:p});await shot('06-draft-separation');
     }else{
      const selected=(await model(spec)).board.selected[0];await action(spec,'paper',{index:selected});
      snapshots.push(await check(spec,false,'04-withdrawn-part'));ok(await hint.count()===0,label+' correct written answer does not replace selected parts');
      await action(spec,'paper',{index:selected});snapshots.push(await check(spec,true,'05-restored-part'));await wordsFor(proofFor(spec,await model(spec)));
      if(task.mode==='build'){
       const rows=(await model(spec)).rows;await field(spec,'rows','7');await action(spec,'partition');
       const issue=(await model(spec)).issue;assert.ok(issue);await field(spec,'rows',rows);
       snapshots.push(await check(spec,true,'06-terminal-partition-failure'));const p=proofFor(spec,await model(spec));assert.equal(p.issue,issue);await wordsFor(p);
       special.push({kind:'failed-partition-with-retained-construction',proof:p});
      }
     }
     const beforeReset=await model(spec);await action(spec,'reset');assert.deepEqual((await model(spec)).history.slice(0,beforeReset.history.length),beforeReset.history);
     snapshots.push(await check(spec,false,'reset-empty'));ok(await hint.count()===0,label+' reset construction never borrows former evidence');
     await runSteps(spec,paperPlan(spec,{reverse:!reverse}));snapshots.push(await check(spec,true,'reset-completed'));
    }
    const final=await model(spec),proof=proofFor(spec,final),words=await wordsFor(proof);await visual(spec);
    assert.equal(proof.round,1);assert.deepEqual(final.history.slice(0,first.history.length),first.history);
    const counts={fold:7,build:8,classify:5,paint:8};assert.equal(snapshots.length,counts[task.mode]);
    const finalRecord=await saved(spec.id);await reload(spec);assert.deepEqual((await saved(spec.id)).cases,finalRecord.cases);
    assert.deepEqual((await saved(spec.id)).models,finalRecord.models);await wordsFor(proofFor(spec,await model(spec)));
    await shot('completed');observations.push({width,height,id:spec.id,index:spec.index,task:taskFor(spec),taskHash:spec.taskHash,
     snapshots,firstProof,proof,words,special,stored:await snapshot('completed')});
   }

   const nativeBefore=structuredClone((await state()).lessons);
   for(const spec of bridges){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);await visual(spec);
    assert.equal(paperLabBinding(taskFor(spec),ctx(spec)),null);ok(await guide.count()===0&&await hint.count()===0,label+' association never inherits the native guide');
    await runSteps(spec,paperPlan(spec,{reverse:width===1280}));const checked=await check(spec,true,'associated-original-check');await visual(spec);
    ok(await hint.count()===0,label+' original success cannot manufacture source-bound feedback');assert.deepEqual((await state()).lessons,nativeBefore);
    await reload(spec);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);assert.deepEqual((await saved(spec.id)).models,checked.record.models);
    ok(await hint.count()===0,label+' associated exclusion survives offline reload');assert.deepEqual((await state()).lessons,nativeBefore);
    if(spec.index===0)await shot('isolated');isolated.push({width,height,id:spec.id,index:spec.index,task:taskFor(spec),taskHash:spec.taskHash,checked});
   }
   label=prefix+'-actual-v2-backup';await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   await page.locator('#main [data-do="export"]').first().waitFor();
   const download=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const exported=await download;
   const backupPath=path.join(out,label+'.json');await exported.saveAs(backupPath);const payload=fs.readFileSync(backupPath,'utf8'),backup=JSON.parse(payload);
   assert.equal(backup.version,2);assert.deepEqual(backup.state,await state());originalState(backup.state);
   for(const spec of cases){const record=backup.state.lessons[spec.id];assert.equal(record?.cases[spec.index]?.attempts?.length,{fold:7,build:8,classify:5,paint:8}[spec.mode]);proofFor(spec,record.models[spec.index]);}
   for(const spec of bridges)assert.equal(backup.state.daily.bridges[spec.id].cases[spec.index].attempts.length,1);
   for(const prep of navigation)assert.equal((backup.state.lessons[prep.id]||backup.state.daily.bridges[prep.id]).cases[prep.index].attempts.length,1);
   ok(true,label+' downloaded JSON contains all original errors, corrections, reset histories and current work');await shot('exported');
   activePage=restorePage;const targetResponse=await restorePage.reload();await restorePage.locator('#import-file').waitFor({state:'attached'});
   await restorePage.locator('#main [data-do="export"]').first().waitFor();
   ok(targetResponse?.fromServiceWorker()===true,label+' empty independent import target also reloads from stopped-origin cache');
   const empty=originalState(JSON.parse((await readPage(restorePage)).text));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
   const importFile=async filename=>{
    await restorePage.locator('#import-file').setInputFiles({name:filename,mimeType:'application/json',buffer:Buffer.from(payload)});
    await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    ok((await restorePage.locator('#toast').innerText()).includes('备份已合并'),label+' actual file input reports a completed merge');
   };
   await importFile('paperlab-real-browser-v2.json');const restored=await readPage(restorePage),restoredState=JSON.parse(restored.text);
   assert.deepEqual(restoredState,backup.state);originalState(restoredState);
   provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   assert.deepEqual(restoredState.lessons,backup.state.lessons);assert.deepEqual(restoredState.daily.bridges,backup.state.daily.bridges);
   for(const spec of cases)proofFor(spec,restoredState.lessons[spec.id].models[spec.index]);
   const firstImportFile=label+'-first-import-storage.txt';fs.writeFileSync(path.join(out,firstImportFile),restored.raw);
   await importFile('paperlab-identical-repeat-v2.json');const repeated=await readPage(restorePage);assert.equal(repeated.raw,restored.raw);
   assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);provenance.backupImportsCompleted++;
   const repeatedImportFile=label+'-repeated-import-storage.txt';fs.writeFileSync(path.join(out,repeatedImportFile),repeated.raw);
   ok(true,label+' independent import preserves every lesson and bridge field; repeated import is byte-idempotent');
   const restoreSpec=cases.at(-1),lessonResponse=await restorePage.goto(base+'learn.html#'+restoreSpec.id);await wait(restorePage,restoreSpec);
   ok(lessonResponse?.fromServiceWorker()===true&&await restorePage.locator('#thinking-feedback').isVisible(),label+' imported current work receives its own bounded feedback offline');
   const afterOpen=JSON.parse((await readPage(restorePage)).text);
   assert.deepEqual(afterOpen.lessons[restoreSpec.id].models,backup.state.lessons[restoreSpec.id].models);
   assert.deepEqual(afterOpen.lessons[restoreSpec.id].cases,backup.state.lessons[restoreSpec.id].cases);
   await shot('restored',restorePage);const restoredSnapshot=await snapshot('restored',restorePage);
   backups.push({width,height,file:path.basename(backupPath),bytes:Buffer.byteLength(payload),sha256:digest(payload),
    originalState:backup.state,restoredState:restoredState,restoredSnapshot,independentEmptyContext:true,
    firstImportRaw:{file:firstImportFile,bytes:Buffer.byteLength(restored.raw),sha256:digest(restored.raw)},
    repeatedImportRaw:{file:repeatedImportFile,bytes:Buffer.byteLength(repeated.raw),sha256:digest(repeated.raw)},
    originStopped:!server.listening,nativeCases:cases.length,associatedCases:bridges.length,navigationPrerequisites:5,importsCompleted:2,idempotent:true});
   await context.close();contexts.delete(context);await restoreContext.close();contexts.delete(restoreContext);activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===24&&isolated.length===48&&preparations.length===10&&backups.length===2,'12 native and 24 associated paper positions ran at two viewports with five real prerequisites each');
  ok(provenance.backupImportsCompleted===4,'two empty independent contexts each completed first and byte-idempotent repeated real v2 import');
  const attemptCounts={native:observations.reduce((sum,item)=>sum+item.snapshots.length,0),associated:isolated.length,navigationPrerequisites:preparations.length};
  assert.deepEqual(attemptCounts,{native:170,associated:48,navigationPrerequisites:10});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,preparations,isolated,offline,backups,viewports,provenance,attemptCounts},null,2));
  console.log('P9_PAPERLAB_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,backups:backups.length,navigationPrerequisites:preparations.length,attemptCounts}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  if(activePage&&diagnostics.has(activePage))failureDiagnostic=await diagnostics.get(activePage).dump(error).catch(failure=>({diagnosticError:String(failure)}));
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,preparations,isolated,offline,backups,viewports,provenance,
   failureDiagnostic,error:String(error),stack:error.stack,at:label},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  for(const context of contexts)await context.close();if(browser)await browser.close();
 }
}

module.exports={paperPlan,navigationPlan,paintPatterns};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
