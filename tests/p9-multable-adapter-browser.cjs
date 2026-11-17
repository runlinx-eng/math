// The exports describe real visible inputs and actions. Native lessons are
// reached through original prerequisites and Next, never seeded positions.
const fixture=require('./fixtures/p9-multable-cases.cjs');
const navigationFixture=require('./fixtures/p9-multable-navigation.cjs');
function orderedMultableTargets(){
 const selected=[...fixture.cases.map(c=>({...c,role:'native'})),...fixture.excluded.map(c=>({...c,role:'excluded'})),...fixture.associated.map(c=>({...c,role:'associated'}))];
 return[...new Set(selected.map(c=>c.id))].flatMap(id=>selected.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));
}
function multableOperationPlan(spec,model,spell=String){
 const b=model.board,steps=[];
 if(!b.estimateOK)steps.push({field:'estimate',value:spell(spec.math.estimatedProduct)},{action:'b14-estimate'});
 for(let row=b.row;row<spec.math.rows.length;row++){
  const r=spec.math.rows[row];
  for(let col=row===b.row?b.col:0;col<r.columns.length;col++){
   const q=r.columns[col],pending=row===b.row&&col===b.col?b.pending:null;
   if(!pending)steps.push({field:'raw',value:spell(q.raw)},{action:'b14-mul-count'});
   for(let loose=pending?pending.loose:q.raw;loose>=10;loose-=10)steps.push({action:'b14-trade'});
   steps.push({field:'digit',value:spell(q.loose)},{action:'b14-digit'});
  }
  steps.push({field:'shift',value:String(r.shift)},{field:'rowvalue',value:spell(r.value)},{action:'b14-row'});
 }
 steps.push({field:'answer',value:spell(spec.math.product)});return steps;
}
async function estimateMultable(spec,{field,action}){await field('estimate',String(spec.math.estimatedProduct));await action('b14-estimate');}
async function finishMultableColumns(spec,api){
 const steps=multableOperationPlan(spec,await api.model()),stop=steps.findIndex(x=>x.field==='shift');
 if(stop<0)throw Error('Expected a current unfinished row');
 for(const step of steps.slice(0,stop))step.field?await api.field(step.field,step.value):await api.action(step.action);
}
async function saveMultableRow(spec,api){const row=spec.math.rows[(await api.model()).board.row];await api.field('shift',String(row.shift));await api.field('rowvalue',String(row.value));await api.action('b14-row');}
async function multableNativeFlow(spec,api){
 const{field,action,solve,check,capture,retry,model,checkpoint,assert}=api,phases=[],q=spec.math.rows[0].columns[0];
 await field('estimate',String(spec.math.estimatedProduct+1));await action('b14-estimate');phases.push(await check(false,false,'first-estimate-wrong'));
 assert((await model()).board.firstEstimate===String(spec.math.estimatedProduct+1),'the first incorrect estimate is retained');
 await estimateMultable(spec,api);await field('raw',String(q.raw+1));await action('b14-mul-count');phases.push(await check(false,false,'first-column-count-wrong'));
 await field('raw',String(q.raw));await action('b14-mul-count');await checkpoint('before-trade',phases);
 await field('digit',String(q.loose));await action('b14-digit');phases.push(await check(false,false,'digit-before-ten-for-one'));
 assert((await model()).board.col===0&&!!(await model()).issue,'writing the remainder cannot skip an enabled exchange');
 while((await model()).board.pending.loose>=10)await action('b14-trade');await checkpoint('after-trade',phases);
 await field('digit',String((q.loose+1)%10));await action('b14-digit');phases.push(await check(false,false,'wrong-retained-digit'));
 await finishMultableColumns(spec,api);await checkpoint('first-row-ready',phases);
 await field('shift','');await field('rowvalue',String(spec.math.rows[0].value));await action('b14-row');phases.push(await check(false,false,'empty-row-shift'));
 await field('shift','1');await action('b14-row');phases.push(await check(false,false,'first-row-wrong-place'));
 await solve();await field('answer',String(spec.math.product+1));phases.push(await check(false,false,'wrong-current-result'));
 await field('answer',String(spec.math.product));phases.push(await capture('correct-unsubmitted',false));await checkpoint('correct-unsubmitted',phases);
 phases.push(await check(true,true,'corrected'));await checkpoint('corrected',phases);
 assert(phases.at(-1).proof.failures.estimate===1&&phases.at(-1).proof.failures.count===1&&phases.at(-1).proof.failures.digit===2&&phases.at(-1).proof.failures.row===2,'the real first failures are retained in the completed replay');
 phases.push(await check(true,true,'repeated-check'));
 await field('answer','0'+spec.math.product+'.000000');phases.push(await capture('equivalent-result-unsubmitted',false));await checkpoint('modified-result',phases);
 phases.push(await check(true,true,'equivalent-result-rechecked'));
 const beforeReset=await model();await action('b14-reset');phases.push(await capture('reset-unsubmitted',false));await checkpoint('reset',phases);
 assert((await model()).board.firstEstimate===beforeReset.board.firstEstimate&&(await model()).answer===beforeReset.answer,'internal reset retains the first estimate and all entered root fields');
 phases.push(await check(false,false,'reset-current-work-incomplete'));await solve();phases.push(await check(true,true,'reset-work-rebuilt'));
 assert(phases.at(-1).proof.resets.length===1&&phases.at(-1).proof.construction.trades.length===spec.math.trades&&phases.at(-1).proof.construction.firstEstimate.correct===false,'current reconstruction cannot borrow trades from the earlier completed segment');
 await retry('native');phases.push(await capture('shared-retry',false));await checkpoint('shared-retry',phases);
 await solve();phases.push(await check(true,true,'retry-corrected'));await checkpoint('final',phases);return phases;
}
function multableBoundaryKindsFor(spec){
 const kinds={'writtenstart:2':['blank-first-and-reset'],'shortproduct:0':['exact-spellings'],'shortproduct:1':['pending-reset'],'shortproduct:2':['zero-column-and-last-carry'],'longproduct:1':['second-row-unit'],'bigproduct:0':['late-reset-no-borrowing'],'bigproduct:1':['last-row-quantity']};
 return kinds[spec.id+':'+spec.index]||[];
}
async function multableBoundaryFlow(kind,spec,api){
 const{field,action,solve,check,capture,model,checkpoint,assert}=api,phases=[];
 if(kind==='blank-first-and-reset'){
  await action('b14-estimate');phases.push(await check(false,false,'blank-first-estimate'));await action('b14-reset');phases.push(await capture('blank-first-retained-by-reset',false));
  await solve();phases.push(await check(true,true,'blank-first-corrected'));assert(phases.at(-1).proof.construction.firstEstimate.raw===''&&phases.at(-1).proof.failures.estimate===1,'blank first input is not replaced by the correction');
 }else if(kind==='exact-spellings'){
  const spell=value=>' 0'+value+'.000000 ';for(const step of multableOperationPlan(spec,await model(),spell))step.field?await field(step.field,step.value):await action(step.action);
  phases.push(await check(true,true,'exact-integer-spellings'));await field('answer',spec.math.product+'.0000000');phases.push(await check(false,false,'seventh-decimal-rejected'));
  await field('answer',String(spec.math.product));phases.push(await check(true,true,'exact-result-restored'));
 }else if(kind==='pending-reset'){
  await estimateMultable(spec,api);await field('raw',String(spec.math.rows[0].columns[0].raw));await action('b14-mul-count');await action('b14-trade');phases.push(await capture('one-exchange-before-reset',false));
  await action('b14-reset');phases.push(await capture('pending-reset-empty-board',false));await solve();phases.push(await check(true,true,'pending-reset-rebuilt'));
  const p=phases.at(-1).proof;assert(p.events.filter(e=>e.action==='b14-trade').length===spec.math.trades+1&&p.construction.trades.length===spec.math.trades,'the old partial exchange remains historical only');
 }else if(kind==='zero-column-and-last-carry'){
  await estimateMultable(spec,api);const steps=multableOperationPlan(spec,await model());
  for(const step of steps){step.field?await field(step.field,step.value):await action(step.action);const b=(await model()).board;
   if(step.action==='b14-mul-count'&&b.col===1)await checkpoint('zero-column',phases);
   if(step.action==='b14-digit'&&b.col===3)await checkpoint('last-carry',phases);
  }
  phases.push(await check(true,true,'zero-column-and-last-carry-complete'));const c=phases.at(-1).proof.construction;
  assert(JSON.stringify(c.columns.map(q=>[q.aDigit,q.incoming,q.raw,q.digit,q.carry]))===JSON.stringify([[6,0,42,2,4],[0,4,4,4,0],[3,0,21,1,2]])&&c.rows[0].lastCarry===2,'the middle zero receives the prior four tens and the final two thousands are retained');
 }else if(kind==='second-row-unit'){
  await estimateMultable(spec,api);await finishMultableColumns(spec,api);await saveMultableRow(spec,api);await finishMultableColumns(spec,api);await checkpoint('second-row-ready',phases);
  const row=spec.math.rows[1];await field('shift','0');await field('rowvalue',String(row.unshifted));await action('b14-row');phases.push(await check(false,false,'second-row-as-ones'));
  await field('shift','1');await action('b14-row');phases.push(await check(false,false,'second-row-unscaled-quantity'));
  await solve();phases.push(await check(true,true,'second-row-tens-restored'));const r=phases.at(-1).proof.construction.rows;
  assert(r[0].value===238&&r[1].unshifted===68&&r[1].rowScale===10&&r[1].value===680,'the tens row contributes 680 rather than 68');
 }else if(kind==='late-reset-no-borrowing'){
  await solve();phases.push(await check(true,true,'before-late-reset'));await action('b14-reset');await estimateMultable(spec,api);
  await field('raw',String(spec.math.rows[0].columns[0].raw));await action('b14-mul-count');phases.push(await check(false,false,'partial-current-cannot-borrow-old-rows'));
  await solve();phases.push(await check(true,true,'late-reset-reconstructed'));
 }else if(kind==='last-row-quantity'){
  await estimateMultable(spec,api);await finishMultableColumns(spec,api);await saveMultableRow(spec,api);await finishMultableColumns(spec,api);
  const row=spec.math.rows[1];await field('shift','1');await field('rowvalue',String(row.value+1));await action('b14-row');await field('rowvalue',String(row.value));
  assert(!!(await model()).issue&&!(await model()).board.rows[1],'editing a wrong row quantity does not save that row or erase its failure');
  phases.push(await check(false,false,'corrected-field-not-yet-saved'));await solve();phases.push(await check(true,true,'last-row-saved'));
 }else throw Error('Unknown multable boundary '+kind);
 return phases;
}
// This is deliberately a compatibility fixture constructor, not a native
// browser operation. It uses only unchanged original model/State APIs, then
// enters an isolated profile through the real v2 file chooser.
function constructMultableCapacityFixture(spec,mode,{Tasks,State,Core,Engine,setField,task}){
 if(!['empty','saved'].includes(mode))throw Error('Unknown capacity fixture mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);lesson.index=spec.index;state.lessons[spec.id]=lesson;
 const model=State.modelForLesson(lesson),apply=step=>{if(step.field){setField(model,step.field,step.value);Engine.fieldExtra(task,model,step.field);}else Engine.actExtra(task,model,step.action,step.data||{});};
 const initialPlan=multableOperationPlan(spec,model),completionEvents=initialPlan.filter(s=>s.action).length;
 if(mode==='saved'){for(const step of initialPlan)apply(step);State.submitLesson(lesson);}
 const remaining=3000-model.history.length-(mode==='saved'?completionEvents:0);
 for(let i=0;i<remaining;i++)apply({action:'b14-reset'});
 if(mode==='saved')for(const step of multableOperationPlan(spec,model))apply(step);
 State.addLessonNote(lesson,'明确构造的兼容数据：检验保存边界和取回后的原始记录。');lesson.draft='兼容数据草稿；不评价解释正确。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode==='saved'?1:0,constructedPosition:spec.index,completionEvents};
}
async function multableCapacityRecoveryFlow(mode,api){
 const phases=[await api.capture('at-valid-capacity-before-check',false)],strict=mode==='saved';
 await api.assertRetryAvailable(strict);
 if(strict)phases.push(await api.check(true,true,'at-valid-capacity-checked'));
 await api.overflow();phases.push(await api.capture('3001-write-blocked',strict));
 for(const name of['check','reset',...(strict?['retry']:[])]){await api.blockedAction(name);phases.push(await api.capture('blocked-page-'+name,strict));}
 await api.reload();phases.push(await api.capture('valid-3000-reloaded',strict));
 if(!strict)phases.push(await api.check(false,false,'first-real-check-after-reload'));
 await api.retry('capacity-'+mode);await api.solve();phases.push(await api.check(true,true,'retry-rebuilt-after-reload'));return phases;
}
module.exports={orderedMultableTargets,multableOperationPlan,multableNativeFlow,multableBoundaryKindsFor,multableBoundaryFlow,constructMultableCapacityFixture,multableCapacityRecoveryFlow};

async function main(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-multable-adapter');fs.mkdirSync(out,{recursive:true});
 const {cases,associated,practice,excluded}=fixture,targets=orderedMultableTargets(),viewports=[[1440,900],[1280,720]];
 const checks=[],errors=[],remote=[],observations=[],isolated=[],boundaries=[],forgeries=[],backups=[],offline=[],preparations=[],retries=[],navigations=[],checkedLedger=[],captures=[],visuals=[],capacity=[];
 const cp=structuredClone,digest=value=>crypto.createHash('sha256').update(value).digest('hex');
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
 const hash=value=>digest(JSON.stringify(stable(value))),ok=(value,message,detail={})=>{assert.ok(value,message);checks.push({message,...detail});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const sourceFiles=['dist/learning/multable-evidence.js','dist/learning/thinking-feedback.js','dist/learning/evidence-adapters.js','dist/exploration-core.js','tests/p9-multable-adapter-browser.cjs','tests/fixtures/p9-multable-cases.cjs','tests/fixtures/p9-multable-navigation.cjs',...Object.keys({...fixture.sourceHashes,...navigationFixture.sourceHashes})];
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),nodeVersion:process.version,cache,
  sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),childTrial:false,independentTeachingReview:false,nativeSourceSeededCorrectWork:false,nativeSourceSeededLessonPositions:false,
  syntheticCompatibilityFixturesAreChildRecords:false,nativeBackupImportsCompleted:0,compatibilityImportsCompleted:0,corruptImportsRejected:0};
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {sessionTaskFor,BRIDGES}=await import('../dist/learning/bridges.js'),M=await import('../dist/learning/phase5/b14-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js'),{setField}=await import('../dist/learning/phase4/ui.js');
 const {thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 const State=await import('../dist/learning/state.js'),Core=await import('../dist/exploration-core.js'),{studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const {multableBinding:binding,replayMultableEvidence:replay}=await import('../dist/learning/multable-evidence.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const taskFor=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index}),originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const lessonFrom=(value,c)=>Object.hasOwn(BRIDGES,c.id)?value.daily.bridges[c.id]:value.lessons[c.id];
 for(const c of[...cases,...associated,...practice,...excluded])assert.equal(hash(taskFor(c)),c.taskHash);
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(path.join(root,file))),sha,file);
 const artifactPaths=new Set(),uniqueFile=name=>{assert.ok(!artifactPaths.has(name),'one immutable raw artifact: '+name);artifactPaths.add(name);return path.join(out,name);};
 fs.writeFileSync(uniqueFile('fixed-source-cases.json'),JSON.stringify(fixture,null,2));fs.writeFileSync(uniqueFile('fixed-navigation.json'),JSON.stringify(navigationFixture,null,2));
 let browser;const openContexts=new Set(),diagnostics=new Map();
 const report=()=>({provenance,viewports,checks,errors,remote,observations,isolated,boundaries,forgeries,backups,offline,preparations,retries,navigations,checkedLedger,captures,visuals,capacity,
  nativeTasks:10,nativeNodes:5,associatedTasks:17,excludedTasks:1,practiceCompatibilityPositions:3,targets:28,sessions:20,childTrial:false,independentTeachingReview:false});
 // Preserve the complete report schema without constructing a single multi-gigabyte
 // JSON string. Each top-level array entry is serialized independently; the original
 // per-capture state/storage/PNG files remain the primary immutable raw evidence.
 const writeJsonReport=(file,value)=>{
  const fd=fs.openSync(file,'w');
  const write=chunk=>{
   const bytes=Buffer.from(chunk);let offset=0;
   while(offset<bytes.length)offset+=fs.writeSync(fd,bytes,offset,bytes.length-offset);
  };
  try{
   write('{');const entries=Object.entries(value);
   for(let i=0;i<entries.length;i++){
    if(i)write(',');const[key,item]=entries[i];write(JSON.stringify(key));write(':');
    if(Array.isArray(item)){
     write('[');
     for(let j=0;j<item.length;j++){if(j)write(',');const encoded=JSON.stringify(item[j]);write(encoded===undefined?'null':encoded);}
     write(']');
    }else{const encoded=JSON.stringify(item);write(encoded===undefined?'null':encoded);}
   }
   write('}');
  }finally{fs.closeSync(fd);}
 };
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});provenance.browserVersion=browser.version();
  // The two viewport runs have separate origins, contexts and immutable evidence paths.
 // Running them concurrently preserves every real-browser check while keeping the
 // complete two-viewport regression inside the existing 35-minute job limit.
 const runViewport=async([width,height])=>{
  let server,activePage,label='setup';
  const profiles=[];
  try{
   const prefix=width+'x'+height;label=prefix+'-cache';
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
   server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   for(const role of['source','native-restore-target','constructed-compatibility','constructed-cap-empty','constructed-cap-saved']){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:'allow'});openContexts.add(context);
    context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
    const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push({label,role,error:String(error)}));diagnostics.set(page,observeBrowserDiagnostics(page,{out,base,label:()=>label}));profiles.push({role,context,page});
   }
   const[sourceProfile,restoreProfile,compatibilityProfile]=profiles,restorePage=restoreProfile.page;
   let page=sourceProfile.page,contextRole='source';activePage=page;let guide=page.locator('#thinking-guide'),hint=page.locator('#thinking-feedback');
   const read=target=>target.evaluate(async()=>{const{readStored}=await import('./storage.js');return{raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
   const state=async(target=page)=>JSON.parse((await read(target)).text);
   const current=async c=>{const lesson=lessonFrom(await state(),c);return{lesson,model:lesson.models[c.index],record:lesson.cases[c.index]||null};};
   const model=async c=>(await current(c)).model;
   const wait=(c,target=page)=>target.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},c);
   const keepRecords=(before,after)=>{
    for(const[left,right]of[[before.lessons,after.lessons],[before.daily.bridges,after.daily.bridges]])for(const[id,record]of Object.entries(left)){
     assert.ok(right[id]);assert.deepEqual(right[id].cases,record.cases);assert.deepEqual(right[id].notes,record.notes);assert.equal(right[id].draft,record.draft);
     for(const[index,value]of Object.entries(record.models))assert.deepEqual(right[id].models[index],value);
    }
   };
   const rawSnapshot=async(suffix,target=page)=>{
    const value=await read(target),decoded=originalState(JSON.parse(value.text)),stem=label+'-'+suffix,raw=stem+'-storage.txt',stateFile=stem+'-state.json';
    assert.equal(typeof value.raw,'string');fs.writeFileSync(uniqueFile(raw),value.raw);fs.writeFileSync(uniqueFile(stateFile),value.text);
    return{raw,state:stateFile,decoded:stateFile,rawBytes:Buffer.byteLength(value.raw),rawSHA256:digest(value.raw),stateSHA256:digest(value.text),decodedState:decoded};
   };
   const storageOnly=value=>{const{decodedState,...storage}=value;return storage;};
   const shot=async(suffix,target=page)=>{await target.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));const file=label+'-'+suffix+'.png';await target.screenshot({path:uniqueFile(file),fullPage:true});return file;};
   const reload=async c=>{const before=originalState(await state()),response=await page.reload();await wait(c);assert.equal(response?.fromServiceWorker(),true);keepRecords(before,originalState(await state()));};
   const navigate=async(c,target=page)=>{
    const before=originalState(await state(target)),oldURL=new URL(target.url()),url=new URL(base+'learn.html#'+c.id),response=await target.goto(url.href);await wait(c,target);
    if(response)assert.equal(response.fromServiceWorker(),true);else{assert.equal(oldURL.origin,url.origin);assert.equal(oldURL.pathname,url.pathname);assert.notEqual(oldURL.hash,url.hash);}
    keepRecords(before,originalState(await state(target)));
   };
   const reveal=async control=>{
    for(let count=0;count<10;count++){
     const closed=control.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
     if(!(await closed.count())){await control.scrollIntoViewIfNeeded();assert.equal(await control.isVisible(),true);return;}
     assert.equal(await closed.count(),1);await closed.locator(':scope > summary').click();
    }
    assert.fail('too many nested disclosures');
   };
   const field=async(c,key,value,coreField=false)=>{
    const attribute=coreField?'data-field':'data-xfield',control=page.locator(`[${attribute}="${key}"]`);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before),tag=await control.evaluate(e=>e.tagName),type=await control.getAttribute('type'),numeric=['number','range'].includes(type)||(coreField?key==='choice':key.startsWith('pair.'));
    const applyValue=raw=>{let value=numeric?(String(raw)===''?null:Number(raw)):String(raw);if(coreField){if(numeric&&value!==null)value=Math.max(0,Math.min(999,Math.trunc(value)));expected[key]=value;}else{setField(expected,key,value);Engine.fieldExtra(taskFor(c),expected,key);}};
    if(tag==='SELECT'){
     assert.equal(await control.locator('option').evaluateAll((options,want)=>options.filter(option=>option.value===want&&!option.disabled).length,String(value)),1);await control.selectOption(String(value));applyValue(value);
    }else if(type==='range'){
     const min=Number(await control.getAttribute('min')),max=Number(await control.getAttribute('max')),stride=Number(await control.getAttribute('step')||1),end=Number(value),start=Number(await control.inputValue());
     assert.ok(end>=min&&end<=max&&Number.isInteger((end-min)/stride));await control.focus();await control.press('Home');if(start!==min)applyValue(min);assert.deepEqual(await model(c),expected);
     for(let v=min+stride;v<=end;v+=stride){await control.press('ArrowRight');applyValue(v);assert.deepEqual(await model(c),expected);}assert.equal(Number(await control.inputValue()),end);
    }else{const limit=await control.getAttribute('maxlength');if(limit!==null)assert.ok(String(value).length<=Number(limit));await control.fill(String(value));applyValue(value);}
    assert.deepEqual(await model(c),expected);assert.equal(Tasks.validModel(taskFor(c),expected),true);return expected;
   };
   const action=async(c,name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');let control=page.locator(`[data-x="${name}"]${suffix}`);
    const buttons=page.locator(`button[data-x="${name}"]${suffix}`);if(await buttons.count())control=buttons;
    assert.equal(await control.count(),1,label+' one visible '+name+suffix);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before),t=taskFor(c);
    await control.click();Engine.actExtra(t,expected,name,data);const after=await model(c);assert.deepEqual(after,expected);
    if(t.type==='x-multable'){
     assert.ok(before.history.length<3000,'native actions stay below the original validation boundary');
     assert.equal(after.history.length,before.history.length+1);assert.deepEqual(after.history.slice(0,-1),before.history);
     assert.equal(after.history.at(-1).action,name);
    }
    return after;
   };
   const solve=async c=>{for(const step of multableOperationPlan(c,await model(c)))step.field?await field(c,step.field,step.value):await action(c,step.action,step.data);};
   const visual=async(c,phase)=>{
    const task=taskFor(c),m=await model(c),board=page.locator('.b14-multiply');assert.equal(await board.count(),1);await board.scrollIntoViewIfNeeded();assert.equal(await board.isVisible(),true);
    const box=await board.boundingBox();assert.ok(box&&box.width>150&&box.height>60);
    const displayed=await board.evaluate(el=>({rows:[...el.querySelectorAll('.b14-written-row')].map(row=>row.textContent.replace(/\s+/g,'')),
     loose:el.querySelectorAll('.b14-counters i').length,bundles:el.querySelectorAll('.b14-bundle').length,counterLabel:el.querySelector('.b14-counters')?.getAttribute('aria-label')||null,
     counters:[...el.querySelectorAll('.b14-counters i,.b14-bundle')].map(node=>{const b=node.getBoundingClientRect();return{width:b.width,height:b.height,text:node.textContent};}),text:el.textContent}));
    const expectedRows=[String(task.a),'×'+task.b,...m.board.rows.map(row=>String(row.value))];
    if(m.board.row<c.math.rows.length)expectedRows.push(String(m.board.carry||'')+[...m.board.digits].reverse().join(''));
    assert.deepEqual(displayed.rows,expectedRows);assert.equal(displayed.loose,m.board.pending?.loose||0);assert.equal(displayed.bundles,m.board.pending?.bundles||0);
    assert.ok(displayed.counters.every(item=>item.width>0&&item.height>0),'each original quantity token has positive visible area');
    const file=label+'-visual-'+phase+'.png',bytes=await board.screenshot({path:uniqueFile(file)});
    const pixels=await page.evaluate(async encoded=>{
     const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),image=new OffscreenCanvas(bitmap.width,bitmap.height),context=image.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();
     const raw=context.getImageData(0,0,image.width,image.height).data,colors=new Set();let min=255,max=0;
     for(let i=0;i<raw.length;i+=4){const r=raw[i],g=raw[i+1],b=raw[i+2];colors.add((r>>4)*256+(g>>4)*16+(b>>4));min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);}
     return{width:image.width,height:image.height,quantizedColors:colors.size,channelRange:max-min};
    },bytes.toString('base64'));
    assert.ok(pixels.quantizedColors>=6&&pixels.channelRange>40,'the actual board screenshot contains rendered written quantities');
    const item={width,height,id:c.id,index:c.index,label,phase,file,sha256:digest(bytes),bytes:bytes.length,box,pixels,displayed,model:m};visuals.push(item);return item;
   };
   const capture=async(c,phase,strict,{role,checked=false}={})=>{
    const raw=await rawSnapshot(phase),lesson=lessonFrom(raw.decodedState,c),m=lesson.models[c.index],record=lesson.cases[c.index]||null,task=taskFor(c),proof=replay(task,m);
    assert.equal(Tasks.validModel(task,m),true);const expectedFeedback=thinkingFeedback(task,m,record,ctx(c)),native=!!binding(task,ctx(c));
    assert.equal(native&&!!expectedFeedback,strict);if(role!=='prerequisite')assert.equal(!!expectedFeedback,strict);
    assert.equal(await hint.count(),expectedFeedback?1:0);if(expectedFeedback)assert.equal(await hint.isVisible(),true);const words=expectedFeedback?await hint.innerText():null;
    if(strict){
     assert.ok(proof&&native);assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(expectedFeedback.method,null);
     assert.ok(words.includes('列位、计数片和写法由工具给定')&&words.includes('没有把它算作另一个独立的加法过程'));assert.doesNotMatch(words,/MP\.\d/);assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);
     assert.ok(words.includes(`当前重建的作品里有 ${proof.construction.trades.length} 次十换一`));
    }
    const value={width,height,contextRole,id:c.id,index:c.index,label,phase,role,checked,model:m,record,attempts:record?.attempts||[],storage:storageOnly(raw),correct:Tasks.inspect(task,m).correct,strict,proof,words,
     existingOtherFeedback:!native&&!!expectedFeedback,constructedCompatibilityFixture:contextRole.startsWith('constructed-')};captures.push(value);return value;
   };
   const check=async(c,correct,strict,phase,role)=>{
    const before=await current(c),control=page.locator('#actions [data-do="check"]');assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();
    assert.equal(await page.locator('#check-feedback').getAttribute('data-state'),correct?'correct':'revise');const after=await current(c),attempt=after.record.attempts.at(-1);
    assert.equal(after.record.attempts.length,(before.record?.attempts?.length??0)+1);assert.deepEqual(after.record.attempts.slice(0,-1),before.record?.attempts??[]);assert.deepEqual(after.model,before.model);assert.deepEqual(attempt.value,before.model);
    assert.equal(Tasks.inspect(taskFor(c),after.model).correct,correct);assert.ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean');
    const value=await capture(c,phase,strict,{role,checked:true});value.attempt=attempt;checkedLedger.push(value);return value;
   };
   const retry=async(c,kind,role)=>{
    const before=await current(c),control=page.locator('[data-do="p3-retry"]');assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();await wait(c);const after=await current(c);
    assert.deepEqual(after.model,Tasks.defaultModel(taskFor(c)));assert.deepEqual(after.lesson.cases,before.lesson.cases);assert.deepEqual(after.lesson.notes,before.lesson.notes);assert.equal(after.lesson.draft,before.lesson.draft);
    for(const[index,value]of Object.entries(before.lesson.models))if(Number(index)!==c.index)assert.deepEqual(after.lesson.models[index],value);assert.equal(await hint.count(),0);
    const storage=kind==='native'?null:(await capture(c,'retry-'+kind,false,{role})).storage;
    const item={width,height,contextRole,id:c.id,index:c.index,kind,beforeRecord:before.record,afterRecord:after.record,emptyModel:after.model,storage,constructedCompatibilityFixture:contextRole.startsWith('constructed-')};retries.push(item);return item;
   };
   const open=async c=>{
    const atPage=await page.evaluate(()=>window.mathLesson?.snapshot());if(atPage?.id!==c.id)await navigate({id:c.id,index:0});
    let at=(await current({id:c.id,index:0})).lesson.index;assert.ok(at<=c.index,'only forward original Next navigation');
    while(at<c.index){
     const previous={id:c.id,index:at},saved=await current(previous);
     if(!saved.record?.attempts?.some(a=>Tasks.inspect(taskFor(previous),a.value).correct)){
      const prep=navigationFixture.navigation.find(x=>x.id===c.id&&x.index===at);assert.ok(prep);assert.equal(binding(taskFor(previous),ctx(previous)),null);
      for(const step of prep.steps)step.field||step.coreField?await field(previous,step.field||step.coreField,step.value,!!step.coreField):await action(previous,step.action,step.data);
      const checked=await check(previous,true,false,'navigation-prerequisite-'+at,'prerequisite');preparations.push({width,height,...prep,checked,strictMultableCoverage:false});
     }
     const before=originalState(await state()),next=page.locator('#actions [data-do="next"]');assert.equal(await next.count(),1);assert.equal(await next.isEnabled(),true);await next.click();
     const from=at;at++;await wait({id:c.id,index:at});keepRecords(before,originalState(await state()));navigations.push({width,height,id:c.id,from,to:at,originalNext:true});
    }
    const fresh=await current(c);assert.deepEqual(fresh.model,Tasks.defaultModel(taskFor(c)));assert.equal(fresh.record?.attempts?.length??0,0);assert.equal(await page.locator('[data-do="p3-retry"]').count(),0);
    assert.equal(await page.locator('#actions [data-do="check"]').isEnabled(),studyActionFocus({task:taskFor(c),model:fresh.model}).readyToCheck);
    ok(true,label+' first arrival is the original untouched work without any injected storage or index');
   };
   const cacheReady=async profile=>{
    const target=profile.page;
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
      },cache);if(status.ready)break;await target.waitForTimeout(100);
     }
     const moduleNames=[...new Set(['storage.js','v2.html','learn.html','exploration.js','exploration-core.js','data/atlas.json','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/multable-evidence.js','learning/p3-workflow.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','vendor/three/three.module.min.js','vendor/three/OrbitControls.js',...sourceFiles.filter(file=>file.startsWith('dist/')).map(file=>file.slice(5))])];
     const modules=await target.evaluate(async({expected,names})=>{const store=await caches.open(expected);return Promise.all(names.map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},{expected:cache,names:moduleNames});
     const empty=originalState(await state(target));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
     const item={width,height,role:profile.role,cache,status,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false,emptyLearningState:true,emptyStorage:storageOnly(await rawSnapshot('empty-'+profile.role,target))};
     ok(status.ready&&item.missing.length===0,prefix+' '+profile.role+' active complete cache and genuine empty learning state',item);offline.push(item);return item;
    }catch(error){activePage=target;error.diagnosticPage=target;throw error;}
   };
   const warmed=await Promise.all(profiles.map(cacheReady));await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const item of warmed)item.originStopped=!server.listening;
   ok(!server.listening,prefix+' origin stops before all mathematical controls and real file imports');
   const api=(c,role)=>({field:(key,value)=>field(c,key,value),action:(name,data)=>action(c,name,data),solve:()=>solve(c),model:()=>model(c),
    check:(correct,strict,phase)=>check(c,correct,strict,phase,role),capture:(phase,strict)=>capture(c,phase,strict,{role}),retry:kind=>retry(c,kind,role),assert:(value,message)=>ok(value,label+' '+message)});
   const runBoundary=async(c,kind)=>{
    label=prefix+'-'+c.id+'-'+c.index+'-boundary-'+kind;await retry(c,'boundary-'+kind,'boundary');const images=[];
    const phases=await multableBoundaryFlow(kind,c,{...api(c,'boundary'),checkpoint:async stage=>images.push(await visual(c,stage))});
    await reload(c);assert.deepEqual(await model(c),phases.at(-1).model);assert.equal(await hint.isVisible(),true);
    const rendered=await visual(c,'final'),screenshot=await shot('boundary');boundaries.push({width,height,kind,id:c.id,index:c.index,phases,images,rendered,screenshot,constructedCompatibilityFixture:false});
   };
   const runNative=async c=>{
    label=prefix+'-'+c.id+'-'+c.index;await open(c);assert.equal(binding(taskFor(c),ctx(c))?.nodeId,c.nodeId);
    assert.equal(await guide.isVisible(),true);assert.equal(await guide.evaluate(e=>e.open),false);assert.equal(await hint.count(),0);const before=await current(c),images={initial:await visual(c,'initial')};
    await guide.locator(':scope > summary').click();assert.equal(await guide.locator('p').isVisible(),true);
    await page.waitForFunction(async({id,index})=>{const{readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;},c);
    await guide.locator(':scope > summary').click();const supported=await current(c);assert.deepEqual(supported.model,before.model);assert.equal(supported.record.attempts.length,0);
    const phases=await multableNativeFlow(c,{...api(c,'native'),checkpoint:async(stage,items)=>{
     if(['before-trade','after-trade','first-row-ready'].includes(stage))images[stage]=await visual(c,stage);
     if(stage==='after-trade'){assert.notEqual(images[stage].sha256,images['before-trade'].sha256);assert.equal(images[stage].displayed.bundles,c.math.rows[0].columns[0].trades);}
     if(stage==='correct-unsubmitted')assert.equal(await hint.count(),0);
     if(stage==='corrected'){await shot('corrected');await reload(c);assert.equal(await hint.isVisible(),true);assert.deepEqual(await model(c),items.at(-1).model);}
     if(['modified-result','reset','shared-retry'].includes(stage)){await reload(c);assert.equal(await hint.count(),0);if(stage!=='modified-result')images[stage]=await visual(c,stage);}
     if(stage==='final'){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);images.final=await visual(c,'retry-corrected');}
    }});
    const final=phases.at(-1),actual=phases.filter(x=>x.checked);assert.equal(actual.length,13);assert.equal(phases.length,17);assert.deepEqual(final.record.attempts,actual.map(x=>x.attempt));
    for(const kind of['extra-root','extra-event','false-issue','hidden-estimate-root','hidden-raw-root','hidden-event-answer','foreign-action','false-incoming-carry']){
     const forged=cp(final.model),task=taskFor(c);
     if(kind==='extra-root')forged.unrecorded=1;else if(kind==='extra-event')forged.history[0].unrecorded=1;else if(kind==='false-issue')forged.issue='not the recorded issue';
     else if(kind==='hidden-estimate-root')forged.estimate+=' ';else if(kind==='hidden-raw-root')forged.raw+=' ';else if(kind==='hidden-event-answer')forged.history[0].data.fields.answer='007';
     else if(kind==='foreign-action')M.act(task,forged,'b14-cut');else forged.board.work[0].incoming++;
     assert.equal(replay(task,forged),null);forgeries.push({width,height,id:c.id,index:c.index,kind,counterfactual:true,actualBrowserAction:false,model:forged,originalValid:M.valid(task,forged),strict:false});
    }
    observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,taskHash:c.taskHash,phases,images});for(const kind of multableBoundaryKindsFor(c))await runBoundary(c,kind);
   };
   for(const c of targets){
    if(c.role==='native')await runNative(c);
    else{label=prefix+'-'+c.role+'-'+c.id+'-'+c.index;await open(c);assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);await solve(c);
     const snapshot=await check(c,true,false,c.role+'-checked',c.role);assert.equal(!!snapshot.proof,c.math.trades>0);assert.equal(binding(taskFor(c),ctx(c)),null);await reload(c);assert.equal(await hint.count(),0);assert.deepEqual(await model(c),snapshot.model);
     const rendered=await visual(c,'checked');isolated.push({width,height,kind:c.role,id:c.id,index:c.index,taskHash:c.taskHash,snapshot,rendered});}
   }
   const mapCaptures=(rows,finalState)=>rows.map(value=>{
    const lesson=lessonFrom(finalState,value),prior=value.record?.attempts||[];assert.ok(lesson);assert.deepEqual(lesson.cases[value.index].attempts.slice(0,prior.length),prior);if(value.record?.support)assert.equal(lesson.cases[value.index].support,true);if(value.record?.exposed)assert.equal(lesson.cases[value.index].exposed,true);
    if(value.checked){assert.deepEqual(lesson.cases[value.index].attempts[prior.length-1],value.attempt);assert.deepEqual(value.model,value.attempt.value);}
    return{id:value.id,index:value.index,label:value.label,phase:value.phase,storage:value.storage,attemptPrefixLength:prior.length,checkedAttemptId:value.checked?value.attempt.id:null,
     currentModelIncludedAsAttempt:value.checked,constructedCompatibilityFixture:value.constructedCompatibilityFixture};
   });
   const downloadBackup=async suffix=>{
    const before=originalState(await state()),response=await page.goto(base+'v2.html#trail');assert.equal(response?.fromServiceWorker(),true);
    await page.locator('#main [data-do="export"]').first().waitFor();keepRecords(before,originalState(await state()));
    const pending=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const downloaded=await pending,file=label+'-'+suffix+'.json';await downloaded.saveAs(uniqueFile(file));
    const payload=fs.readFileSync(path.join(out,file),'utf8'),backup=JSON.parse(payload);assert.equal(backup.version,2);assert.deepEqual(backup.state,originalState(await state()));
    return{file,payload,backup,bytes:Buffer.byteLength(payload),sha256:digest(payload)};
   };
   label=prefix+'-actual-backup';const actual=await downloadBackup('v2'),sourceRows=checkedLedger.filter(x=>x.width===width&&x.contextRole==='source'),sourceCaptures=captures.filter(x=>x.width===width&&x.contextRole==='source');
   assert.equal(sourceRows.length,172);assert.equal(sourceCaptures.length,222);const positions=[...new Set(sourceRows.map(x=>x.id+':'+x.index))];assert.equal(positions.length,37);
   for(const key of positions){const rows=sourceRows.filter(x=>x.id+':'+x.index===key),last=rows.at(-1),lesson=lessonFrom(actual.backup.state,last);assert.deepEqual(lesson.cases[last.index].attempts,rows.map(x=>x.attempt));assert.deepEqual(lesson.models[last.index],last.model);}
   for(const c of cases)assert.ok(replay(taskFor(c),actual.backup.state.lessons[c.id].models[c.index]));
   const sourceCaptureMap=mapCaptures(sourceCaptures,actual.backup.state),exportedScreenshot=await shot('exported');
   const importFile=async(target,text,name)=>{
    const button=target.locator('[data-do="import"]').first();await button.waitFor({state:'visible'});assert.equal(await button.isEnabled(),true);
    const choosing=target.waitForEvent('filechooser');await button.click();const chooser=await choosing;await chooser.setFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});
    await target.waitForFunction(()=>document.querySelector('#import-file')?.value==='');return target.locator('#toast').innerText();
   };
   activePage=restorePage;const targetReload=await restorePage.reload();assert.equal(targetReload?.fromServiceWorker(),true);await restorePage.locator('#main [data-do="export"]').first().waitFor();
   const empty=originalState(await state(restorePage));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyBeforeImport=storageOnly(await rawSnapshot('empty-before-import',restorePage));
   assert.ok((await importFile(restorePage,actual.payload,actual.file)).includes('备份已合并'));const imported=await read(restorePage);assert.deepEqual(originalState(JSON.parse(imported.text)),actual.backup.state);
   const firstImportStorage=storageOnly(await rawSnapshot('first-import',restorePage));provenance.nativeBackupImportsCompleted++;
   assert.ok((await importFile(restorePage,actual.payload,'multable-identical-repeat-v2.json')).includes('备份已合并'));const repeated=await read(restorePage);assert.equal(repeated.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),actual.backup.state);
   const repeatedImportStorage=storageOnly(await rawSnapshot('repeated-import',restorePage));provenance.nativeBackupImportsCompleted++;
   assert.ok(!(await importFile(restorePage,'{','multable-corrupt-native.json')).includes('备份已合并'));assert.equal((await read(restorePage)).raw,imported.raw);
   const corruptImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected',restorePage));provenance.corruptImportsRejected++;
   const last=cases.at(-1);await navigate(last,restorePage);assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredReload=await restorePage.reload();assert.equal(restoredReload?.fromServiceWorker(),true);await wait(last,restorePage);keepRecords(actual.backup.state,originalState(await state(restorePage)));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredStorage=storageOnly(await rawSnapshot('restored-lesson',restorePage)),restoredScreenshot=await shot('restored',restorePage);
   backups.push({width,height,kind:'actual-browser-v2',backupFile:actual.file,bytes:actual.bytes,backupSha256:actual.sha256,originalState:actual.backup.state,
    emptyBeforeImport,firstImportStorage,repeatedImportStorage,corruptImportStorage,restoredStorage,exportedScreenshot,restoredScreenshot,sourceCaptureMap,
    independentEmptyContext:true,originStopped:!server.listening,wholeStateFirstImportExact:true,repeatByteIdempotent:true,corruptRejectedWithoutWrite:true,checked:172,currentModelCaptures:222,positions:37});

   // Old practice positions have no dedicated current practice page. This
   // third independent context receives explicitly constructed compatibility
   // data, never a fabricated native attempt or a seed into the source route.
   contextRole='constructed-compatibility';page=compatibilityProfile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-constructed-practice-compatibility';
   const legacyState=Core.fresh();
   for(const c of practice){const t=taskFor(c),m=Tasks.defaultModel(t);for(const step of multableOperationPlan(c,m))if(step.field){setField(m,step.field,String(step.value));M.field(t,m,step.field);}else M.act(t,m,step.action,step.data||{});
    assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);assert.ok(replay(t,m));assert.equal(binding(t,ctx(c)),null);const a=legacyState.lessons[c.id]??=State.freshLesson(c.id);a.models[-1]=m;assert.deepEqual(a.cases,{});}
   originalState(legacyState);const legacyPayload=JSON.stringify(Core.backup(legacyState)),legacyFile=label+'-v2.json';fs.writeFileSync(uniqueFile(legacyFile),legacyPayload);
   const legacyResponse=await page.reload();assert.equal(legacyResponse?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
   const emptyLegacy=originalState(await state());assert.deepEqual(emptyLegacy.lessons,{});assert.deepEqual(emptyLegacy.daily.bridges,{});const legacyEmptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
   assert.ok((await importFile(page,legacyPayload,legacyFile)).includes('备份已合并'));const legacyImported=await read(page);assert.deepEqual(originalState(JSON.parse(legacyImported.text)),legacyState);
   const legacyImportStorage=storageOnly(await rawSnapshot('imported-original-practice'));provenance.compatibilityImportsCompleted++;
   assert.ok(!(await importFile(page,'{','multable-corrupt-practice.json')).includes('备份已合并'));assert.equal((await read(page)).raw,legacyImported.raw);
   const legacyCorruptStorage=storageOnly(await rawSnapshot('corrupt-import-rejected'));provenance.corruptImportsRejected++;
   const practiceSnapshots=[];
   for(const c of practice){
    label=prefix+'-constructed-practice-'+c.id;await navigate({id:c.id,index:0});const raw=await rawSnapshot('retained-original-model'),lesson=raw.decodedState.lessons[c.id];
    assert.deepEqual(lesson.models[-1],legacyState.lessons[c.id].models[-1]);assert.equal(binding(taskFor(c),ctx(c)),null);assert.equal(lesson.cases[0]?.attempts?.length??0,0);assert.equal(await hint.count(),0);
    const item={width,height,kind:'old-practice-compatibility',id:c.id,index:-1,taskHash:c.taskHash,model:lesson.models[-1],storage:storageOnly(raw),nativePositionOpened:0,strict:false,constructedCompatibilityFixture:true};practiceSnapshots.push(item);isolated.push(item);
   }
   label=prefix+'-constructed-practice-final-backup';const legacyFinal=await downloadBackup('v2');
   for(const c of practice){assert.deepEqual(legacyFinal.backup.state.lessons[c.id].models[-1],legacyState.lessons[c.id].models[-1]);assert.equal(legacyFinal.backup.state.lessons[c.id].cases[0]?.attempts?.length??0,0);}
   backups.push({width,height,kind:'constructed-practice-final-v2',constructedCompatibilityFixture:true,fixture:legacyFile,fixtureSHA256:digest(legacyPayload),legacyEmptyStorage,legacyImportStorage,legacyCorruptStorage,
    backupFile:legacyFinal.file,bytes:legacyFinal.bytes,backupSha256:legacyFinal.sha256,originalState:legacyFinal.backup.state,practiceSnapshots,importedConstructedSubmissions:0,actualUIChecksAfterImport:0,oldPractice:3,independentContext:true,originStopped:!server.listening});
   for(const mode of['empty','saved']){
    const profile=profiles.find(p=>p.role==='constructed-cap-'+mode);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');
    label=prefix+'-constructed-cap-'+mode;const c=cases[0],task=taskFor(c),fixture=constructMultableCapacityFixture(c,mode,{Tasks,State,Core,Engine,setField,task});
    originalState(fixture.state);assert.equal(fixture.state.lessons[c.id].models[c.index].history.length,3000);
    const fixturePayload=JSON.stringify(Core.backup(fixture.state)),fixtureFile=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(fixtureFile),fixturePayload);
    const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
    const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
    assert.ok((await importFile(page,fixturePayload,fixtureFile)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;
    const importedStorage=storageOnly(await rawSnapshot('imported-fixture'));
    assert.ok((await importFile(page,fixturePayload,'multable-identical-'+mode+'-v2.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;
    const repeatedStorage=storageOnly(await rawSnapshot('repeated-fixture'));
    const invalid=cp(fixture.state);M.act(task,invalid.lessons[c.id].models[c.index],'b14-reset');assert.equal(invalid.lessons[c.id].models[c.index].history.length,3001);assert.equal(M.valid(task,invalid.lessons[c.id].models[c.index]),false);
    const invalidPayload=JSON.stringify({...Core.backup(fixture.state),state:invalid});
    assert.ok(!(await importFile(page,invalidPayload,'multable-invalid-3001-'+mode+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;
    const rejectedImportStorage=storageOnly(await rawSnapshot('invalid-3001-import-rejected'));
    await navigate(c);let persisted,beforeOverflow;const capacityImages={};
    const phases=await multableCapacityRecoveryFlow(mode,{
     capture:(phase,strict)=>capture(c,phase,strict,{role:'capacity'}),check:(correct,strict,phase)=>check(c,correct,strict,phase,'capacity'),
     assertRetryAvailable:async expected=>assert.equal(await page.locator('[data-do="p3-retry"]').count(),expected?1:0,'zero-attempt compatibility data does not invent a retry button'),
     overflow:async()=>{
      persisted=await read(page);beforeOverflow=await current(c);const unwritten=cp(beforeOverflow.model);M.act(task,unwritten,'b14-reset');assert.equal(unwritten.history.length,3001);assert.equal(M.valid(task,unwritten),false);
      const reset=page.locator('[data-x="b14-reset"]');assert.equal(await reset.count(),1);await reveal(reset);await reset.click();
      assert.equal(await page.locator('#storage-warning').isVisible(),true);assert.ok((await page.locator('#storage-warning').innerText()).includes('已停止覆盖原记录'));
      assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeOverflow);capacityImages.blocked=await shot('blocked-page');
     },
     blockedAction:async name=>{
      const selector={check:'#actions [data-do="check"]',reset:'[data-x="b14-reset"]',retry:'[data-do="p3-retry"]'}[name],control=page.locator(selector);
      assert.equal(await control.count(),1);await reveal(control);await control.click();assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeOverflow);
     },
     reload:async()=>{await reload(c);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.deepEqual((await current(c)).model,beforeOverflow.model);capacityImages.reloaded=await shot('reloaded-valid-work');},
     retry:async kind=>{const before=await current(c);await retry(c,kind,'capacity');assert.deepEqual((await current(c)).lesson.cases,before.lesson.cases);assert.deepEqual((await current(c)).lesson.notes,before.lesson.notes);assert.equal((await current(c)).lesson.draft,before.lesson.draft);},
     solve:async()=>{await solve(c);assert.equal((await model(c)).history.length,fixture.completionEvents);}
    });
    const screenshot=await shot('recovered'),final=await downloadBackup('recovered-v2'),rows=captures.filter(x=>x.width===width&&x.contextRole===contextRole),captureMap=mapCaptures(rows,final.backup.state);
    const currentLesson=lessonFrom(final.backup.state,c);assert.deepEqual(currentLesson.notes,fixture.state.lessons[c.id].notes);assert.equal(currentLesson.draft,fixture.state.lessons[c.id].draft);
    assert.equal(currentLesson.cases[c.index].attempts.length,fixture.constructedSubmissions+2);
    const item={width,height,mode,id:c.id,index:c.index,contextRole,constructedCompatibilityFixture:true,constructedSubmissions:fixture.constructedSubmissions,
     fixtureFile,fixtureSHA256:digest(fixturePayload),emptyStorage,importedStorage,repeatedStorage,rejectedImportStorage,phases,captureMap,capacityImages,screenshot,
     actualUIChecksAfterImport:2,actualRetriesAfterReload:1,originalRawPreservedWhileBlocked:true,invalidActionWouldHaveAppended3001:true,internalResetDoesNotRecoverBlockedPage:true,
     documentReloadRequired:true,zeroAttemptNeedsCheckBeforeRetry:mode==='empty',nativeHandEnteredHistory:false,backupFile:final.file,backupSha256:final.sha256,originalState:final.backup.state};
    capacity.push(item);backups.push({...item,kind:'constructed-capacity-final-v2'});
   }
   activePage=null;
  }catch(error){
   if(error.diagnosticPage)activePage=error.diagnosticPage;
   const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(reason=>({diagnosticError:String(reason)})):null;
   if(activePage){await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.html'),await activePage.content().catch(()=>''));}
   error.diagnosticFile=diagnosticFile;error.label=label;throw error;
  }finally{
   if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   for(const profile of profiles){await profile.context.close();openContexts.delete(profile.context);}
  }
 };
 const viewportResults=await Promise.allSettled(viewports.map(runViewport));
 const viewportFailure=viewportResults.find(result=>result.status==='rejected');if(viewportFailure)throw viewportFailure.reason;
 assert.equal(errors.length,0);assert.equal(remote.length,0);assert.equal(observations.length,20);assert.equal(forgeries.length,160);assert.equal(preparations.length,18);assert.equal(navigations.length,34);
  assert.equal(isolated.filter(x=>x.kind==='associated').length,34);assert.equal(isolated.filter(x=>x.kind==='excluded').length,2);assert.equal(isolated.filter(x=>x.kind==='old-practice-compatibility').length,6);assert.equal(boundaries.length,14);assert.equal(capacity.length,4);
  const nativeChecked=checkedLedger.filter(x=>x.contextRole==='source'),nativeCaptures=captures.filter(x=>x.contextRole==='source'),capacityChecked=checkedLedger.filter(x=>x.role==='capacity'),capacityCaptures=captures.filter(x=>x.role==='capacity');
  assert.equal(nativeChecked.length,344);assert.equal(nativeCaptures.length,444);assert.equal(capacityChecked.length,8);assert.equal(capacityCaptures.length,34);
  assert.equal(checkedLedger.length,352);assert.equal(captures.length,478);assert.equal(retries.filter(x=>x.contextRole==='source').length,34);assert.equal(retries.length,38);
  assert.ok(nativeChecked.every(x=>!x.constructedCompatibilityFixture));assert.ok(capacityChecked.every(x=>x.constructedCompatibilityFixture));
  assert.equal(backups.filter(x=>x.kind==='actual-browser-v2').length,2);assert.equal(backups.filter(x=>x.kind==='constructed-practice-final-v2').length,2);assert.equal(backups.filter(x=>x.kind==='constructed-capacity-final-v2').length,4);
  assert.equal(provenance.nativeBackupImportsCompleted,4);assert.equal(provenance.compatibilityImportsCompleted,10);assert.equal(provenance.corruptImportsRejected,8);
  const attemptCounts=Object.fromEntries(['native','boundary','associated','excluded','prerequisite','capacity'].map(role=>[role,checkedLedger.filter(x=>x.role===role).length]));
  assert.deepEqual(attemptCounts,{native:260,boundary:30,associated:34,excluded:2,prerequisite:18,capacity:8});
  const checkedPaths=checkedLedger.flatMap(x=>[x.storage.raw,x.storage.state]),capturePaths=captures.flatMap(x=>[x.storage.raw,x.storage.state]);assert.equal(new Set(checkedPaths).size,704);assert.equal(new Set(capturePaths).size,956);
  fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(provenance,null,2));writeJsonReport(path.join(out,'results.json'),{...report(),attemptCounts,uniqueCheckedFiles:704,uniqueCaptureFiles:956,originStopped:offline.every(x=>x.originStopped)});
  console.log('P9_MULTABLE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:10,taskViewportPairs:20,sourceChecked:344,compatibilityChecked:8,checked:352,sourceCaptures:444,compatibilityCaptures:34,captures:478,oldPractice:6,sourceRetries:34,compatibilityRetries:4,next:34,forgeries:160,nativeBackups:2,compatibilityBackups:6,visuals:visuals.length}));
 }catch(error){
  const diagnosticFile=error.diagnosticFile??null;
  const counts=Object.fromEntries(Object.entries(report()).filter(([,value])=>Array.isArray(value)).map(([key,value])=>[key,value.length]));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({schema:'math-p9-multable-browser-failure/1',provenance,counts,error:String(error),stack:error.stack,at:error.label||'viewport',diagnosticFile,artifactFiles:[...artifactPaths].sort()},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  for(const context of openContexts)await context.close();if(browser)await browser.close();
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
