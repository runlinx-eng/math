// Real unchanged B15 controls, cumulative original records, and forward Next.
// Literal preceding tasks and every mathematical action use actual controls.
const reviewed=require('./fixtures/p9-order-cases.cjs');
function operationPlan(task,{steps,expression,answer}={}){
 const known=reviewed.cases.find(c=>c.task.expression===task.expression&&c.task.expected===task.expected);
 if(!task.writeOnly&&!known&&!steps)throw Error('No independently fixed arithmetic plan');
 const out=[],field=(key,value)=>out.push({field:key,value:String(value)}),act=(name,data={})=>out.push({action:'b15-'+name,data});
 if(task.construct){field('expression',expression??task.expected??task.expression);act('build');}
 if(!task.writeOnly){
  for(const [id,value] of steps||known.steps){act('op',{index:id});field('result',value);act('reduce');}
  field('answer',answer??known.answer);
 }else if(task.reason)field('reason',task.reason);
 return out;
}
const boundaryVariants=['inexact-intermediate','rounded-literal','pending-rounded','terminal-failed-build',
 'huge-power-reset','long-invalid-first','unready-parent','insert-mismatch','independent-siblings','commuted-construction'];
// Node drives this exact browser path against the original V.render/State too.
// Those source-control probes do not substitute for actual Chromium execution.
async function boundaryFlow(variant,{task:t,field,build,reduce,action,run,check,staleReload,model,assert,shot}){
 if(variant==='inexact-intermediate'){
  await build(t.expected);await reduce(3,'0.20000001');await reduce(1,'1');await field('answer','1');
  await check(true,false,'original-near-pass');await shot('inexact-rejected');await action('reset');await run();
 }else if(variant==='rounded-literal'){
  await build('320.00000000000000000001-125');await reduce(1,'195');await field('answer','195');
  await check(true,false,'original-rounded-pass');await shot('literal-rejected');await run();
 }else if(variant==='pending-rounded'){
  await run();await check(true,true,'exact-built');await field('expression','320.00000000000000000001-125');
  await staleReload();await check(true,false,'pending-rounded-rechecked');await field('expression','320.00 − 125');
 }else if(variant==='terminal-failed-build'){
  await run();await check(true,true,'before-failed-build');const before=await model();await build('(');const after=await model();
  assert(JSON.stringify(before.board)===JSON.stringify(after.board)&&after.issue!=='','terminal failed build retains exact tree and its real issue');
  await field('expression',t.expected);
 }else if(variant==='huge-power-reset'){
  await build('0.5^1000000000');await reduce(1,'0');await field('answer','0');await check(false,false,'huge-old-attempt');
  await build('9'.repeat(2000));await check(false,false,'long-failed-build');await action('reset');await run();
 }else if(variant==='long-invalid-first'){
  await build('9'.repeat(2000));await check(false,false,'first-build-failed');await run();
 }else if(variant==='unready-parent'){
  await action('op',{index:3});await field('result','12');await action('reduce');await check(false,false,'unready-failed');
  await run({steps:[[5,'8'],[1,'4'],[3,'12']]});
 }else if(variant==='insert-mismatch'){
  await build('8+3*5');await check(false,false,'insert-failed');await run();
 }else if(variant==='independent-siblings'){
  await action('op',{index:5});await action('op',{index:5});await run({steps:[[5,'8'],[1,'4'],[3,'12']]});
 }else if(variant==='commuted-construction')await run({expression:'(1/5)*5',steps:[[1,'0.2'],[3,'1']]});
 else throw Error('Unknown boundary');
 await check(true,true,'current-exact');
}
const navigationFixture=require('./fixtures/p9-order-navigation.cjs');
function orderedOrderTargets(){
 const selected=[...reviewed.cases.map(c=>({...c,role:'native'})),
  ...reviewed.excluded.map(c=>({...c,id:c.sessionId,role:'excluded'})),
  ...reviewed.associated.map(c=>({...c,id:c.sessionId,role:'associated'}))];
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
 const hash=task=>require('node:crypto').createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
 return [...new Set(selected.map(c=>c.id))].flatMap(id=>selected.filter(c=>c.id===id).sort((a,b)=>a.index-b.index)).map(c=>({...c,taskHash:c.taskHash||hash(c.task)}));
}
function boundaryNamesFor(c){
 return boundaryVariants.filter(variant=>{
  const id=['inexact-intermediate','commuted-construction'].includes(variant)?'powerorder':variant==='insert-mismatch'?'bracketlab':
   ['unready-parent','independent-siblings'].includes(variant)?'orderlab':'storyfraction';
  const index=id==='powerorder'?4:id==='bracketlab'?2:id==='orderlab'?1:0;
  return c.id===id&&c.index===index;
 });
}
// The exact six native paths are shared by the browser and the original-control
// Node probe. Checkpoint hooks inspect/reload real work without adding attempts.
async function nativeFlow(c,{task:t,field,action,build,reduce,run,check,sharedRetry,checkpoint}){
 const phases=[];
 if(t.construct)await build(t.expected);
 await action('op',{index:c.steps[0][0]});await field('result','999999');await action('reduce');
 phases.push(await check(false,false,'failed-reduction'));
 for(const [id,value]of c.steps)await reduce(id,value);
 await field('answer','999999');phases.push(await check(false,false,'wrong-answer'));
 await field('answer',c.answer);phases.push(await check(true,true,'corrected'));
 await checkpoint('corrected',phases);
 await field('answer',c.answer+' ');await checkpoint('modified-equivalent-answer',phases);
 phases.push(await check(true,true,'rechecked-equivalent-answer'));
 await action('reset');await checkpoint('reset-unsubmitted',phases);
 await run();phases.push(await check(true,true,'reset-corrected'));
 await sharedRetry();await run();phases.push(await check(true,true,'shared-retry-corrected'));
 await checkpoint('final',phases);return phases;
}
module.exports={operationPlan,boundaryVariants,boundaryFlow,orderedOrderTargets,boundaryNamesFor,nativeFlow};

async function main(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
 const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-order-adapter');fs.mkdirSync(out,{recursive:true});
 const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],boundaries=[],isolated=[],forgeries=[],offline=[],backups=[],preparations=[],retries=[],navigations=[],checkedLedger=[];
 const cp=structuredClone,digest=value=>crypto.createHash('sha256').update(value).digest('hex');
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
 const hash=value=>digest(JSON.stringify(stable(value))),ok=(value,message,detail={})=>{assert.ok(value,message);checks.push({message,...detail});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,
  runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,workflow:process.env.GITHUB_WORKFLOW||null,
  workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),nodeVersion:process.version,cache,
  sourceHashes:{...reviewed.sourceHashes,...navigationFixture.sourceHashes},adapterSha256:digest(fs.readFileSync(path.join(root,'dist/learning/order-evidence.js'))),
  seededCorrectWork:false,seededLessonPositions:false,childTrial:false,independentTeachingReview:false,realBrowserBackupImport:false,backupImportsCompleted:0,corruptImportsRejected:0};
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {sessionTasks}=await import('../dist/learning/bridges.js'),M=await import('../dist/learning/phase5/b15-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js'),{setField}=await import('../dist/learning/phase4/ui.js');
 const {orderBinding,replayOrderEvidence:replay}=await import('../dist/learning/order-evidence.js');
 const Core=await import('../dist/exploration-core.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const {studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const taskFor=c=>sessionTasks(c.id)[c.index],targets=orderedOrderTargets();
 const {createExcludedFeedbackAudit}=require('./helpers/p9-area-time-excluded-feedback.cjs');
 const otherRows=require('./fixtures/p9-money-order-convert-cross-family-boundaries.cjs').order;
 const isOther=c=>otherRows.some(row=>row.sessionId===c.id&&row.index===c.index);
 const auditOther=await createExcludedFeedbackAudit('order',[...navigationFixture.navigation,...targets.filter(c=>c.role==='excluded')],taskFor,otherRows);
 for(const c of targets){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const[file,sha]of Object.entries(provenance.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),sha,file);
 fs.writeFileSync(path.join(out,'fixed-source-cases.json'),JSON.stringify(reviewed,null,2));
 fs.writeFileSync(path.join(out,'fixed-navigation.json'),JSON.stringify(navigationFixture,null,2));
 const artifactPaths=new Set(),uniqueFile=name=>{assert.ok(!artifactPaths.has(name),'one immutable artifact per observed phase: '+name);artifactPaths.add(name);return path.join(out,name);};
 let browser,server,context,restoreContext,activePage,label='setup';const diagnostics=new Map();
 const report=()=>({provenance,checks,errors,remote,observations,boundaries,isolated,forgeries,offline,backups,preparations,retries,navigations,checkedLedger,viewports,
  nativeTasks:17,nativeNodes:6,excludedNativeTasks:3,associatedTasks:11,prerequisitesPerViewport:7,targetPositions:31,sessions:15,
  childTrial:false,independentTeachingReview:false});
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  for(const[width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
   server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});
   restoreContext=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});
   for(const ctx of[context,restoreContext])ctx.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage(),restorePage=await restoreContext.newPage();
   for(const current of[page,restorePage]){current.setDefaultTimeout(20000);current.on('pageerror',error=>errors.push({label,error:String(error)}));diagnostics.set(current,observeBrowserDiagnostics(current,{out,base,label:()=>label}));}
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const readPage=current=>current.evaluate(async()=>{const{readStored}=await import('./storage.js');return{raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
   const state=async(current=page)=>originalState(JSON.parse((await readPage(current)).text));
   const saved=async id=>{const value=await state();return value.lessons[id]||value.daily.bridges[id];};
   const model=async c=>(await saved(c.id)).models[c.index];
   const current=async c=>{const lesson=await saved(c.id);return{lesson,model:lesson.models[c.index],record:lesson.cases[c.index]};};
   const wait=c=>page.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},c);
   const keepRecords=(before,after)=>{
    for(const[left,right]of[[before.lessons,after.lessons],[before.daily.bridges,after.daily.bridges]])for(const[id,record]of Object.entries(left)){
     assert.ok(right[id]);assert.deepEqual(right[id].cases,record.cases);assert.deepEqual(right[id].notes,record.notes);assert.equal(right[id].draft,record.draft);
     for(const[i,value]of Object.entries(record.models))assert.deepEqual(right[id].models[i],value);
    }
   };
   const snapshot=async(suffix,target=page)=>{
    const value=await readPage(target),stem=label+'-'+suffix;originalState(JSON.parse(value.text));
    const raw=stem+'-storage.txt',decoded=stem+'-state.json';fs.writeFileSync(uniqueFile(raw),value.raw);fs.writeFileSync(uniqueFile(decoded),value.text);
    return{raw,state:decoded,rawBytes:Buffer.byteLength(value.raw),rawSHA256:digest(value.raw),stateSHA256:digest(value.text)};
   };
   const shot=async(suffix,target=page)=>{await target.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));const file=label+'-'+suffix+'.png';await target.screenshot({path:uniqueFile(file),fullPage:true});return file;};
   const reload=async c=>{const before=await state(),response=await page.reload();await wait(c);ok(response?.fromServiceWorker()===true,label+' document reload uses the stopped-origin service worker');keepRecords(before,await state());};
   const reveal=async control=>{
    for(let i=0;i<10;i++){const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');
     if(!(await closed.count())){await control.evaluate(e=>e.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));return;}
     await closed.locator(':scope > summary').click();}
    assert.fail('too many nested disclosures');
   };
   const field=async(c,key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1,label+' one original field '+key);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before),tag=await control.evaluate(e=>e.tagName),type=await control.getAttribute('type');
    const numeric=type==='number'||type==='range'||key.startsWith('pair.');
    const applyValue=v=>{setField(expected,key,numeric?(String(v)===''?null:Number(v)):String(v));Engine.fieldExtra(taskFor(c),expected,key);};
    if(tag==='SELECT'){
     assert.equal(await control.locator('option').evaluateAll((options,want)=>options.filter(option=>option.value===want&&!option.disabled).length,String(value)),1);
     await control.selectOption(String(value));applyValue(value);
    }else if(type==='range'){
     const min=Number(await control.getAttribute('min')),max=Number(await control.getAttribute('max')),stride=Number(await control.getAttribute('step')||1),end=Number(value);
     assert.ok(end>=min&&end<=max&&Number.isInteger((end-min)/stride));
     const start=Number(await control.inputValue());await control.focus();await control.press('Home');
     if(start!==min)applyValue(min);assert.deepEqual(await model(c),expected);
     for(let v=min+stride;v<=end;v+=stride){await control.press('ArrowRight');applyValue(v);assert.deepEqual(await model(c),expected);}
     assert.equal(Number(await control.inputValue()),end);
    }else{const limit=await control.getAttribute('maxlength');if(limit!==null)assert.ok(String(value).length<=Number(limit));await control.fill(String(value));applyValue(value);}
    assert.deepEqual(await model(c),expected);assert.equal(Tasks.validModel(taskFor(c),expected),true);return expected;
   };
   const action=async(c,name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join(''),control=page.locator(`[data-x="${name}"]${suffix}`);
    assert.equal(await control.count(),1,label+' one original action '+name+suffix);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before);await control.click();Engine.actExtra(taskFor(c),expected,name,data);const after=await model(c);
    assert.deepEqual(after,expected);assert.equal(Tasks.validModel(taskFor(c),after),true);assert.deepEqual(after.history.slice(0,before.history.length),before.history);
    if(taskFor(c).type==='x-orderlab'){
     assert.equal(after.history.length,before.history.length+1);assert.equal(Object.keys(after.history.at(-1).data.fields).length,38);
     ok(true,label+' original B15 action retains one exact 38-field event');
    }
    return after;
   };
   const act=(c,name,data)=>action(c,'b15-'+name,data),build=async(c,raw)=>{await field(c,'expression',raw);return act(c,'build');};
   const reduce=async(c,id,value)=>{await act(c,'op',{index:id});await field(c,'result',value);return act(c,'reduce');};
   const run=async(c,options)=>{for(const step of operationPlan(taskFor(c),options)){if(step.field)await field(c,step.field,step.value);else await action(c,step.action,step.data);}};
   const check=async(c,correct,strict,phase,role)=>{
    const before=await current(c),control=page.locator('#actions [data-do="check"]');assert.equal(await control.count(),1);assert.equal(await control.isEnabled(),true);await control.click();
    const after=await current(c),attempt=after.record.attempts.at(-1),task=taskFor(c),proof=replay(task,after.model);
    assert.equal(after.record.attempts.length,(before.record?.attempts?.length??0)+1);assert.deepEqual(after.record.attempts.slice(0,-1),before.record?.attempts??[]);
    assert.deepEqual(after.model,before.model);assert.deepEqual(attempt.value,before.model);ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' real attempt metadata retained');
    assert.equal(Tasks.validModel(task,after.model),true);assert.equal(Tasks.inspect(task,after.model).correct,correct);
    assert.equal(await page.locator('#check-feedback').getAttribute('data-state'),correct?'correct':'revise');
    const otherFamily=(role==='prerequisite'||role==='excluded')&&isOther(c)?await auditOther(page,c,after.model,after.record):null;
    assert.equal(await hint.count(),strict||otherFamily?.feedback?1:0);if(strict)assert.equal(await hint.isVisible(),true);
    const source=orderBinding(task,{sessionId:c.id,index:c.index});if(otherFamily)assert.equal(source,null,'separate proof is not order coverage');
    assert.equal(!!proof,task.type==='x-orderlab'&&!task.writeOnly&&correct&&(strict||!source));
    if(proof){assert.equal(proof.history.length,after.model.history.length);assert.ok(proof.effectiveSteps.every(step=>step.exact));
     if(c.answer)assert.deepEqual(proof.built.value,c.answer==='0.5'?['1','2']:[c.answer,'1']);}
    const item={width,height,id:c.id,index:c.index,label,phase,role,correct,strict,model:after.model,record:after.record,attempt,proof,storage:await snapshot(phase),observation:strict?await hint.innerText():null,otherFamily};
    checkedLedger.push(item);return item;
   };
   const sharedRetry=async(c,kind)=>{
    const before=await current(c),control=page.locator('[data-do="p3-retry"]');assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();await wait(c);
    const after=await current(c);assert.deepEqual(after.model,Tasks.defaultModel(taskFor(c)));assert.deepEqual(after.lesson.cases,before.lesson.cases);assert.deepEqual(after.lesson.notes,before.lesson.notes);assert.equal(after.lesson.draft,before.lesson.draft);
    for(const[index,value]of Object.entries(before.lesson.models))if(Number(index)!==c.index)assert.deepEqual(after.lesson.models[index],value);
    assert.equal(await hint.count(),0);await reload(c);assert.equal(await hint.count(),0);
    const item={width,height,id:c.id,index:c.index,kind,beforeRecord:before.record??null,afterRecord:after.record??null,emptyModel:after.model,storage:await snapshot('shared-retry-empty')};retries.push(item);return item;
   };
   const open=async c=>{
    const atPage=await page.evaluate(()=>window.mathLesson?.snapshot());
    if(atPage?.id!==c.id){
     const before=await state(),oldURL=new URL(page.url()),target=new URL(base+'learn.html#'+c.id),response=await page.goto(target.href);await wait({id:c.id,index:0});
     if(response)ok(response.fromServiceWorker()===true,label+' actual lesson document uses stopped-origin cache');
     else{assert.equal(oldURL.origin,target.origin);assert.equal(oldURL.pathname,target.pathname);assert.notEqual(oldURL.hash,target.hash);}
     keepRecords(before,await state());
    }
    let at=(await saved(c.id)).index;assert.ok(at<=c.index,'only forward original lesson navigation');
    while(at<c.index){
     const previous={id:c.id,index:at},record=await saved(c.id);
     if(!record.cases[at]?.attempts?.some(attempt=>Tasks.inspect(taskFor(previous),attempt.value).correct)){
      const prep=navigationFixture.navigation.find(x=>x.id===c.id&&x.index===at);assert.ok(prep,'exact literal preceding task');
      if(isOther(previous))await auditOther(page,previous,record.models[at],record.cases[at]??null);
      for(const step of prep.steps){if(step.field)await field(previous,step.field,step.value);else await action(previous,step.action,step.data);}
      assert.equal(orderBinding(taskFor(previous),{sessionId:previous.id,index:at}),null);
      const checked=await check(previous,true,false,'navigation-prerequisite-'+at,'prerequisite');preparations.push({width,height,...prep,checked,strictOrderCoverage:false});
     }
     const before=await state(),next=page.locator('#actions [data-do="next"]');assert.equal(await next.count(),1);assert.equal(await next.isEnabled(),true);await next.click();
     const from=at;at++;await wait({id:c.id,index:at});keepRecords(before,await state());navigations.push({width,height,id:c.id,from,to:at,originalNext:true});
    }
    const item=await current(c);assert.deepEqual(item.model,Tasks.defaultModel(taskFor(c)));assert.equal(item.record?.attempts?.length??0,0);
    assert.equal(await page.locator('#actions [data-do="check"]').isEnabled(),studyActionFocus({task:taskFor(c),model:item.model}).readyToCheck);
    ok(true,label+' first arrival is untouched original work without injected storage or positions');
   };
   const cacheReady=async(target,role)=>{
    try{
     await target.goto(base+'v2.html#trail');await target.locator('#import-file').waitFor({state:'attached'});await target.locator('#main [data-do="export"]').first().waitFor();
     let status={ready:false};
     for(let i=0;i<300;i++){
      status=await target.evaluate(async expected=>{
       const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
       const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
       if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return{ready:false,...identity};
       const report=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);});
       return{...identity,report,ready:report?.cache===expected&&report.complete===true&&report.cached===report.total&&report.total>0};
      },cache);
      if(status.ready)break;await target.waitForTimeout(100);
     }
     const modules=await target.evaluate(async expected=>{const store=await caches.open(expected);return Promise.all(['storage.js','v2.html','learn.html','learning/learn.js','exploration-core.js','exploration.js','learning/order-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/phase4/ui.js','learning/phase4/engine.js','learning/phase4/view-engine.js','learning/p3-view.js','learning/p3-workflow.js','learning/workspace-flow.js','learning/phase5/b14-model.js','learning/phase5/b14-view.js','learning/phase5/b15-model.js','learning/phase5/b15-view.js','learning/phase5/b15.js','learning/phase5/b16.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},cache);
     const blank=await state(target);assert.deepEqual(blank.lessons,{});assert.deepEqual(blank.daily.bridges,{});
     const item={width,height,role,cache,status,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false,emptyLearningState:true};
     ok(status.ready&&item.missing.length===0,prefix+' '+role+' active complete cache includes all real math and restore dependencies',item);offline.push(item);return item;
    }catch(error){activePage=target;error.diagnosticPage=target;throw error;}
   };
   const warmed=await Promise.all([cacheReady(page,'source'),cacheReady(restorePage,'backup-target')]);
   const sourceEmptyStorage=await snapshot('empty-source'),restoreEmptyStorage=await snapshot('empty-restore-target',restorePage);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const item of warmed)item.originStopped=!server.listening;
   ok(!server.listening,prefix+' origin stops before every mathematical action and real backup import');

   const runBoundary=async(c,variant)=>{
    label=prefix+'-'+c.id+'-'+c.index+'-boundary-'+variant;
    const before=await current(c);let initialEmptyStorage=null;
    if(variant==='long-invalid-first'){
     assert.equal(before.record?.attempts?.length??0,0,'first long build failure is the first real checked attempt of this source');
     assert.deepEqual(before.model,Tasks.defaultModel(taskFor(c)));assert.equal(await page.locator('[data-do="p3-retry"]').count(),0);
     initialEmptyStorage=await snapshot('first-original-empty-work');
    }else await sharedRetry(c,'boundary-'+variant);
    const t=taskFor(c),phases=[];
    await boundaryFlow(variant,{task:t,field:(key,value)=>field(c,key,value),build:raw=>build(c,raw),reduce:(id,value)=>reduce(c,id,value),action:(name,data)=>act(c,name,data),run:options=>run(c,options),
     check:async(correct,strict,phase)=>{phases.push(await check(c,correct,strict,phase,'boundary'));},
     staleReload:async()=>{assert.equal(await hint.count(),0);await reload(c);assert.equal(await hint.count(),0);},
     model:()=>model(c),assert:(value,message)=>ok(value,label+' '+message),shot:name=>shot(name)});
    const final=phases.at(-1),first=phases[0];assert.deepEqual(final.record.attempts.slice(0,before.record?.attempts?.length??0),before.record?.attempts??[]);
    if(phases.length>1){assert.deepEqual(final.record.attempts.slice(0,first.record.attempts.length),first.record.attempts);assert.deepEqual(final.model.history.slice(0,first.model.history.length),first.model.history);}
    if(variant==='pending-rounded'){assert.equal(final.proof.built.raw,'320-125');assert.equal(final.proof.pending.raw,'320.00 − 125');assert.equal(final.proof.pending.appliedByBuild,false);}
    if(variant==='terminal-failed-build'){assert.notEqual(final.proof.currentIssue,'');assert.equal(final.proof.failedRequests.length,1);}
    if(variant==='long-invalid-first'){
     assert.equal(first.correct,false);assert.equal(first.record.attempts.length,1);assert.equal(first.attempt.value.board.first,'9'.repeat(2000));
     assert.equal(final.model.board.first,'9'.repeat(2000));assert.deepEqual(final.record.attempts[0],first.attempt);
    }
    await reload(c);assert.equal(await hint.isVisible(),true);
    const screenshot=await shot('current-exact');boundaries.push({width,height,variant,id:c.id,index:c.index,phases,screenshot,
     start:initialEmptyStorage?'first-original-empty-work':'real-shared-retry',initialEmptyStorage});
   };
   const runNative=async c=>{
    const nativeLabel=prefix+'-'+c.id+'-'+c.index;label=nativeLabel;await open(c);const t=taskFor(c);assert.equal(orderBinding(t,{sessionId:c.id,index:c.index})?.nodeId,c.nodeId);
    assert.equal(await guide.isVisible(),true);assert.equal(await guide.evaluate(e=>e.open),false);assert.equal(await hint.count(),0);
    const initial=await current(c);await guide.locator('summary').click();
    await page.waitForFunction(async({id,index})=>{const{readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;},c);
    await guide.locator('summary').click();const supported=await current(c);assert.deepEqual(supported.model,initial.model);assert.equal(supported.record.attempts.length,0);
    const variants=boundaryNamesFor(c);
    if(variants.includes('long-invalid-first')){
     await runBoundary(c,'long-invalid-first');label=nativeLabel;
     // A real local reset retains that first failed request and all attempts.
     await act(c,'reset');assert.equal(await hint.count(),0);assert.equal((await model(c)).board.first,'9'.repeat(2000));
    }
    const before=await current(c);let reset,fresh,screenshot;
    const phases=await nativeFlow(c,{task:t,field:(key,value)=>field(c,key,value),action:(name,data)=>act(c,name,data),build:raw=>build(c,raw),reduce:(id,value)=>reduce(c,id,value),run:()=>run(c),
     check:(correct,strict,phase)=>check(c,correct,strict,phase,'native'),sharedRetry:async()=>{fresh=await sharedRetry(c,'native');},
     checkpoint:async(stage,items)=>{
      if(stage==='corrected'){
       assert.equal(await page.locator('[data-x="b15-op"]').count(),0);assert.equal(await page.locator('[data-xfield="result"]').count(),0);
       screenshot=await shot('exact-offline');await reload(c);assert.equal(await hint.isVisible(),true);
      }else if(stage==='modified-equivalent-answer'){assert.equal(await hint.count(),0);await reload(c);assert.equal(await hint.count(),0);}
      else if(stage==='reset-unsubmitted'){
       const value=await current(c);assert.equal(value.model.answer,c.answer+' ');assert.equal(value.model.result,items[2].model.result);assert.equal(await hint.count(),0);
       reset={model:value.model,record:value.record,storage:await snapshot(stage)};
      }else if(stage==='final'){await reload(c);assert.equal(await hint.isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
     }});
    const final=phases.at(-1),prior=before.record?.attempts??[];assert.equal(phases.length,6);assert.equal(final.record.attempts.length,prior.length+6);
    assert.deepEqual(final.record.attempts.slice(0,prior.length),prior);assert.deepEqual(final.record.attempts.slice(prior.length),phases.map(x=>x.attempt));
    const exactModel=phases[2].model;
    for(const[kind,mutate]of[['completed-operation',m=>M.act(t,m,'b15-op',{index:c.steps[0][0]})],['hidden-reduce',m=>M.act(t,m,'b15-reduce')],['invented-issue',m=>{m.issue='invented';}],['unrepresented-attribute',m=>{m.history[0].data.value='not-a-button-attribute';}]]){
     const forged=cp(exactModel);mutate(forged);assert.equal(M.valid(t,forged),true);assert.equal(M.inspect(t,forged).correct,true);assert.equal(replay(t,forged),null);
     forgeries.push({width,height,id:c.id,index:c.index,kind,counterfactual:true,model:forged,strict:false});
    }
    observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,phases,reset,fresh,screenshot});
    for(const variant of variants.filter(name=>name!=='long-invalid-first'))await runBoundary(c,variant);
   };
   for(const c of targets){
    if(c.role==='native')await runNative(c);
    else{label=prefix+'-'+c.role+'-'+c.id+'-'+c.index;await open(c);
     if(c.role==='excluded'&&isOther(c)){const empty=await current(c);await auditOther(page,c,empty.model,empty.record??null);}else{assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);}
     await run(c);const value=await check(c,true,false,'isolated-checked',c.role);await reload(c);
     if(value.otherFamily){const restored=await current(c);assert.deepEqual(await auditOther(page,c,restored.model,restored.record),value.otherFamily);}else assert.equal(await hint.count(),0);
     isolated.push({width,height,id:c.id,index:c.index,role:c.role,writeOnly:!!taskFor(c).writeOnly,snapshot:value});}
   }
   label=prefix+'-actual-v2-backup';const beforeExport=await state(),response=await page.goto(base+'v2.html#trail');
   assert.equal(response?.fromServiceWorker(),true);await page.locator('#import-file').waitFor({state:'attached'});await page.locator('#main [data-do="export"]').first().waitFor();keepRecords(beforeExport,await state());
   const download=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const exported=await download,file=label+'.json';await exported.saveAs(uniqueFile(file));
   const payload=fs.readFileSync(path.join(out,file),'utf8'),backup=JSON.parse(payload);assert.equal(backup.version,2);assert.deepEqual(backup.state,await state());originalState(backup.state);
   const ledger=checkedLedger.filter(x=>x.width===width),positions=[...new Set(ledger.map(x=>x.id+':'+x.index))];assert.equal(ledger.length,143);assert.equal(positions.length,38);
   for(const key of positions){
    const rows=ledger.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),record=backup.state.lessons[last.id]||backup.state.daily.bridges[last.id];
    assert.deepEqual(record.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(record.models[last.index],last.model);assert.deepEqual(record.cases[last.index],last.record);
   }
   for(const c of reviewed.cases){const record=backup.state.lessons[c.id];assert.ok(replay(taskFor(c),record.models[c.index]));assert.equal(Tasks.inspect(taskFor(c),record.models[c.index]).correct,true);}
   assert.equal(backup.state.lessons.storyfraction.cases[0].attempts[0].value.board.first,'9'.repeat(2000));
   for(const item of retries.filter(x=>x.width===width)){const record=backup.state.lessons[item.id],prior=item.beforeRecord?.attempts??[];assert.deepEqual(record.cases[item.index].attempts.slice(0,prior.length),prior);assert.deepEqual(item.beforeRecord,item.afterRecord);}
   ok(true,label+' actual whole-state export maps every checked original raw to cumulative attempts and latest models');const exportedScreenshot=await shot('exported');
   activePage=restorePage;const restoredResponse=await restorePage.reload();assert.equal(restoredResponse?.fromServiceWorker(),true);await restorePage.locator('#import-file').waitFor({state:'attached'});await restorePage.locator('#main [data-do="export"]').first().waitFor();
   const blank=await state(restorePage);assert.deepEqual(blank.lessons,{});assert.deepEqual(blank.daily.bridges,{});const emptyBeforeImport=await snapshot('empty-before-import',restorePage);
   const importFile=async(text,name)=>{const choosing=restorePage.waitForEvent('filechooser');await restorePage.locator('[data-do="import"]').click();const chooser=await choosing;
    await chooser.setFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');return restorePage.locator('#toast').innerText();};
   assert.ok((await importFile(payload,'order-real-export-v2.json')).includes('备份已合并'));const imported=await readPage(restorePage);assert.deepEqual(originalState(JSON.parse(imported.text)),backup.state);
   const firstImportStorage=await snapshot('first-import',restorePage);provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   assert.ok((await importFile(payload,'order-identical-repeat-v2.json')).includes('备份已合并'));const repeated=await readPage(restorePage);assert.equal(repeated.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);
   const repeatedImportStorage=await snapshot('repeated-import',restorePage);provenance.backupImportsCompleted++;
   assert.ok(!(await importFile('{','order-corrupt.json')).includes('备份已合并'));const corrupt=await readPage(restorePage);assert.equal(corrupt.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(corrupt.text)),backup.state);
   const corruptImportStorage=await snapshot('corrupt-import-rejected',restorePage);provenance.corruptImportsRejected++;
   const c=reviewed.cases.at(-1),lessonResponse=await restorePage.goto(base+'learn.html#'+c.id);assert.equal(lessonResponse?.fromServiceWorker(),true);
   await restorePage.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},c);
   keepRecords(backup.state,await state(restorePage));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const reloadResponse=await restorePage.reload();assert.equal(reloadResponse?.fromServiceWorker(),true);
   await restorePage.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},c);
   keepRecords(backup.state,await state(restorePage));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredStorage=await snapshot('restored-lesson',restorePage),restoredScreenshot=await shot('restored-lesson',restorePage);
   backups.push({width,height,file,bytes:Buffer.byteLength(payload),sha256:digest(payload),originalState:backup.state,independentEmptyContext:true,sourceEmptyStorage,restoreEmptyStorage,emptyBeforeImport,
    firstImportStorage,repeatedImportStorage,corruptImportStorage,restoredStorage,exportedScreenshot,restoredScreenshot,
    wholeStateFirstImportExact:true,identicalImportByteIdempotent:true,corruptRejectedWithoutWrite:true,importsCompleted:2,originStopped:!server.listening,checkedCount:ledger.length,positions:positions.length});
   await context.close();context=null;await restoreContext.close();restoreContext=null;activePage=null;
  }
  assert.equal(errors.length,0);assert.equal(remote.length,0);assert.equal(observations.length,34);assert.ok(observations.every(x=>x.phases.length===6));
  assert.equal(boundaries.length,20);assert.equal(isolated.length,28);assert.equal(forgeries.length,136);assert.equal(preparations.length,14);assert.equal(navigations.length,46);
  assert.equal(retries.filter(x=>x.kind==='native').length,34);assert.equal(retries.filter(x=>x.kind.startsWith('boundary-')).length,18);assert.equal(retries.length,52);
  assert.equal(boundaries.filter(x=>x.start==='first-original-empty-work').length,2);assert.equal(boundaries.filter(x=>x.start==='real-shared-retry').length,18);
  assert.equal(backups.length,2);assert.equal(provenance.backupImportsCompleted,4);assert.equal(provenance.corruptImportsRejected,2);
  const attemptCounts=Object.fromEntries(['native','boundary','associated','excluded','prerequisite'].map(role=>[role,checkedLedger.filter(x=>x.role===role).length]));
  assert.deepEqual(attemptCounts,{native:204,boundary:40,associated:22,excluded:6,prerequisite:14});assert.equal(checkedLedger.length,286);
  const checkedRaw=checkedLedger.flatMap(x=>[x.storage.raw,x.storage.state]);assert.equal(new Set(checkedRaw).size,572);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report(),attemptCounts,uniqueCheckedRawFiles:checkedRaw.length,originStopped:offline.every(x=>x.originStopped)},null,2));
  console.log('P9_ORDER_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:17,taskViewportPairs:34,boundaryPaths:20,attemptCounts,checked:286,sharedRetries:52,forgeries:136,backups:2}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(reason=>({diagnosticError:String(reason)})):null;
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report(),error:String(error),stack:error.stack,at:label,diagnosticFile},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});if(context)await context.close();if(restoreContext)await restoreContext.close();if(browser)await browser.close();
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
