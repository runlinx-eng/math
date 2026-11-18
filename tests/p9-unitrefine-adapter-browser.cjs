// Exported original-control flows let a separate reviewer drive the real State
// callbacks without importing Chromium, a server, or an author's math oracle.
const fixture=require('./fixtures/p9-unitrefine-cases.cjs');
const navigationFixture=require('./fixtures/p9-unitrefine-navigation.cjs');
function orderedUnitrefineTargets(){
 const all=[...fixture.cases.map(c=>({...c,role:'native'})),...fixture.associated.map(c=>({...c,role:'associated'}))];
 return[...new Set(all.map(c=>c.id))].flatMap(id=>all.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));
}
function unitrefineOperationPlan(spec,model,{reverse=false}={}){
 const out=[],sizes=reverse?[...spec.task.sizes].reverse():spec.task.sizes;
 for(const u of sizes){const count=Number(BigInt(spec.task.total)/BigInt(u.size));out.push({action:'m28-size',data:{index:String(u.size)}});for(let i=0;i<count;i++)out.push({action:'m28-add'});out.push({field:'measure',value:String(count)},{action:'m28-record'});}
 out.push({field:'answers.0',value:'more'});return out;
}
async function saveUnitrefine(api,raw){await api.field('measure',String(raw));await api.action('m28-record');}
async function buildUnitrefineSize(spec,api,size,raw){
 const n=Number(BigInt(spec.task.total)/BigInt(size));await api.action('m28-size',{index:String(size)});for(let i=0;i<n;i++)await api.action('m28-add');await saveUnitrefine(api,raw===undefined?n:raw);
}
async function unitrefineNativeFlow(spec,api){
 const{field,action,solve,model,check,capture,retry,checkpoint,assert}=api,big=spec.task.sizes[0],small=spec.task.sizes[1],bigCount=Number(BigInt(spec.task.total)/BigInt(big.size)),n=Number(BigInt(spec.task.total)/BigInt(small.size));
 const phases=[await capture('initial',false)];
 await action('m28-add');phases.push(await check(false,false,'add-before-size'));await action('m28-record');phases.push(await check(false,false,'record-before-size'));
 await action('m28-remove');phases.push(await capture('unselected-remove-recorded-noop',false));assert(Object.keys((await model()).board.first).length===0,'unselected attempts establish no first record');
 await action('m28-size',{index:String(big.size)});await saveUnitrefine(api,'');phases.push(await check(false,false,'first-blank-selected-record'));
 await action('m28-add');await saveUnitrefine(api,'1');phases.push(await check(false,false,'partial-count-record'));
 for(let i=1;i<bigCount;i++)await action('m28-add');await saveUnitrefine(api,bigCount);phases.push(await check(false,false,'only-first-unit-saved'));
 const firstRun=JSON.stringify((await model()).board.runs);await action('m28-add');phases.push(await capture('first-size-overflow-retains-save',false));assert(JSON.stringify((await model()).board.runs)===firstRun,'overflow preserves the first valid size record');await checkpoint('first-size-overflow',phases);
 await buildUnitrefineSize(spec,api,small.size);await field('answers.0','less');phases.push(await check(false,false,'wrong-visible-comparison-choice'));
 await field('answers.0','more');phases.push(await capture('correct-unsubmitted',false));await checkpoint('correct-unsubmitted',phases);phases.push(await check(true,true,'corrected'));await checkpoint('corrected',phases);
 assert(phases.at(-1).proof.construction.firstRecords[0].raw===''&&phases.at(-1).proof.construction.hadOriginalBad,'selected blank first and original bad remain');phases.push(await check(true,true,'repeated-check'));
 await field('measure',n+'.0');phases.push(await capture('equivalent-current-unsubmitted',false));phases.push(await check(true,true,'equivalent-current-rechecked-without-record'));
 await field('measure',n+'.00000001');phases.push(await check(true,false,'original-near-current-only'));
 await action('m28-record');await field('measure',String(n));phases.push(await check(true,false,'exact-current-near-surviving-record'));
 await action('m28-record');phases.push(await check(true,true,'surviving-record-resaved-exactly'));
 const saved=JSON.stringify((await model()).board.runs);await saveUnitrefine(api,'');phases.push(await check(false,false,'failed-blank-record-keeps-runs'));assert(JSON.stringify((await model()).board.runs)===saved,'failed record keeps both previous valid runs');
 await field('measure',String(n));phases.push(await capture('exact-current-restored-unsubmitted',false));phases.push(await check(true,true,'old-runs-with-real-failed-record-issue'));assert(!!phases.at(-1).proof.issue,'restoring a field does not erase the terminal issue');
 await action('m28-add');phases.push(await check(true,true,'overflow-keeps-both-runs-and-issue'));await checkpoint('overflow',phases);
 await action('m28-remove');phases.push(await check(false,false,'removed-current-unit'));await checkpoint('removed',phases);await action('m28-add');phases.push(await check(false,false,'replaced-not-saved'));await action('m28-record');phases.push(await check(true,true,'removed-unit-rebuilt'));
 const first=JSON.stringify((await model()).board.first);await action('m28-size',{index:String(small.size)});phases.push(await check(false,false,'same-size-resets-only-current-run'));assert(JSON.stringify((await model()).board.first)===first&&(await model()).board.bad,'same size reselect retains first and bad');await checkpoint('reselected',phases);
 await solve();phases.push(await check(true,true,'reselected-size-rebuilt'));await field('prose','我把两种单位的完整数量和剩余部分留在这里；原话待确认。');phases.push(await capture('prose-unsubmitted',false));phases.push(await check(true,true,'prose-rechecked'));
 await retry('native');phases.push(await capture('shared-retry',false));await checkpoint('shared-retry',phases);await solve({reverse:true});phases.push(await check(true,true,'retry-reverse-order-corrected'));await checkpoint('final',phases);return phases;
}
function unitrefineBoundaryKindsFor(spec){return({'precisionunits:0':['first-near-noncurrent-run'],'precisionunits:2':['exact-record-spellings-and-text-limit']})[spec.id+':'+spec.index]||[];}
async function unitrefineBoundaryFlow(kind,spec,api){
 const{field,action,solve,check,capture,model,assert}=api,phases=[],a=spec.task.sizes[0],b=spec.task.sizes[1],n=Number(BigInt(spec.task.total)/BigInt(a.size));
 if(kind==='first-near-noncurrent-run'){
  await buildUnitrefineSize(spec,api,a.size,n+'.00000001');await buildUnitrefineSize(spec,api,b.size);await field('answers.0','more');phases.push(await check(true,false,'first-near-noncurrent-original-success'));
  await action('m28-record');phases.push(await check(true,false,'current-resave-cannot-repair-other-size'));assert((await model()).board.bad===false,'original near-success is not renamed an original bad record');
  await buildUnitrefineSize(spec,api,a.size);phases.push(await check(true,true,'noncurrent-size-rebuilt-exactly'));const first=phases.at(-1).proof.construction.firstRecords[0];assert(first.raw===n+'.00000001'&&first.originalAccepted&&!first.exactFullCount,'near first retains its original success and separate exactness boundary');
 }else if(kind==='exact-record-spellings-and-text-limit'){
  await solve({reverse:true});for(const[label,raw]of[['fraction',n*2+'/2'],['mixed',(n-1)+' 2/2'],['decimal',' 00'+n+'.000 ']]){await saveUnitrefine(api,raw);phases.push(await check(true,true,'exact-record-'+label));}
  await field('answers.0','');phases.push(await check(false,false,'empty-visible-comparison-choice'));await field('answers.0','more');phases.push(await capture('choice-restored-unsubmitted',false));phases.push(await check(true,true,'comparison-choice-rechecked'));
  await field('prose','文'.repeat(1200));phases.push(await check(true,true,'1200-prose-saved'));await saveUnitrefine(api,'0'.repeat(1200-String(n).length)+n);phases.push(await check(true,true,'1200-numeric-record-saved'));
 }else throw Error('Unknown unitrefine boundary '+kind);return phases;
}
function unitrefineCapacityModes(){return[{id:'empty-0',kind:'empty',prior:0},...['clean','bad','issue'].flatMap(kind=>[0,1].map(prior=>({id:kind+'-'+prior,kind,prior})))];}
// Explicit compatibility fixtures are imported into independent empty contexts.
// No constructed model, position or answer enters the native browser route.
function constructUnitrefineCapacityFixture(spec,mode,{State,Core,Engine,setField,task}){
 if(!unitrefineCapacityModes().some(x=>x.id===mode.id&&x.kind===mode.kind&&x.prior===mode.prior))throw Error('Unknown capacity mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);lesson.index=spec.index;state.lessons[spec.id]=lesson;const model=State.modelForLesson(lesson);
 const apply=s=>{if(s.field){setField(model,s.field,s.value);Engine.fieldExtra(task,model,s.field);}else Engine.actExtra(task,model,s.action,s.data||{});};
 if(mode.kind==='empty'){while(model.history.length<2000)apply({action:'m28-remove'});}
 else{
  if(mode.kind==='bad'){apply({action:'m28-size',data:{index:String(spec.task.sizes[0].size)}});apply({action:'m28-record'});}
  for(const s of unitrefineOperationPlan(spec,model))apply(s);if(mode.prior)State.submitLesson(lesson);
  const last=mode.kind==='issue'?1999:2000;while(model.history.length<last)apply({action:'m28-record'});
  if(mode.kind==='issue'){apply({field:'measure',value:''});apply({action:'m28-record'});apply({field:'measure',value:String(model.board.count)});}
 }
 State.addLessonNote(lesson,'明确构造的兼容记录：保留两种单位、历史上限、旧提交与重试。');lesson.draft='兼容草稿原文；不评价解释。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index};
}
async function unitrefineCapacityFlow(mode,spec,api){
 const phases=[await api.capture('at-valid-2000-before-check',false)],n=(await api.model()).board.count;await api.assertRetryAvailable(!!mode.prior);
 for(const name of['size','add','remove','record']){await api.cappedAction(name);phases.push(await api.capture('2000-'+name+'-model-noop',false));}
 if(mode.kind==='empty')phases.push(await api.check(false,false,'empty-capacity-real-first-check'));
 else{
  phases.push(await api.check(true,true,'at-capacity-checked'));await api.field('measure',String(n+1));phases.push(await api.capture('at-capacity-wrong-count-unsubmitted',false));await api.cappedAction('record');phases.push(await api.capture('at-capacity-record-cannot-change-runs',false));phases.push(await api.check(false,false,'at-capacity-wrong-count-checked'));
  await api.field('measure',String(n));phases.push(await api.capture('at-capacity-current-count-restored-unsubmitted',false));phases.push(await api.check(true,true,'at-capacity-current-count-rechecked'));
 }
 await api.retry('capacity-'+mode.id);phases.push(await api.capture('shared-retry-after-capacity',false));await api.solve({reverse:true});phases.push(await api.check(true,true,'capacity-retry-corrected'));return phases;
}
function unitrefineTextModes(){return[0,1].map(prior=>({id:'text-'+prior,prior}));}
function constructUnitrefineTextFixture(spec,mode,{State,Core,Engine,setField,task}){
 if(![0,1].includes(mode.prior))throw Error('Unknown text mode');const state=Core.fresh(),lesson=State.freshLesson(spec.id);lesson.index=spec.index;state.lessons[spec.id]=lesson;const model=State.modelForLesson(lesson),apply=s=>{if(s.field){setField(model,s.field,s.value);Engine.fieldExtra(task,model,s.field);}else Engine.actExtra(task,model,s.action,s.data||{});};
 for(const s of unitrefineOperationPlan(spec,model))apply(s);apply({field:'prose',value:'文'.repeat(1200)});apply({field:'measure',value:'0'.repeat(1200-String(model.board.count).length)+model.board.count});apply({action:'m28-record'});if(mode.prior)State.submitLesson(lesson);
 State.addLessonNote(lesson,'明确构造的文字上限兼容记录，恢复后保留旧提交。');lesson.draft='1201 写入拒绝之前的草稿。';return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index};
}
async function unitrefineTextFlow(mode,spec,api){
 const strict=!!mode.prior,phases=[await api.capture('1200-before-block',strict)];await api.assertRetryAvailable(strict);
 await api.overlongText('prose','文'.repeat(1201));phases.push(await api.capture('1201-text-write-blocked',strict));
 for(const name of['check','size','remove',...(mode.prior?['retry']:[])]){await api.blockedAction(name);phases.push(await api.capture('blocked-visible-'+name,strict));}
 await api.reloadBlocked();phases.push(await api.capture('1200-restored-after-reload',strict));if(!mode.prior)phases.push(await api.check(true,true,'zero-attempt-real-check-before-retry'));
 await api.retry('text-'+mode.prior);phases.push(await api.capture('retry-after-text-block',false));await api.solve({reverse:true});phases.push(await api.check(true,true,'text-retry-corrected'));return phases;
}
module.exports={orderedUnitrefineTargets,unitrefineOperationPlan,unitrefineNativeFlow,unitrefineBoundaryKindsFor,unitrefineBoundaryFlow,unitrefineCapacityModes,constructUnitrefineCapacityFixture,unitrefineCapacityFlow,unitrefineTextModes,constructUnitrefineTextFixture,unitrefineTextFlow};


async function main(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-unitrefine-adapter');fs.mkdirSync(out,{recursive:true});
 const {cases,associated,practice}=fixture,targets=orderedUnitrefineTargets();
 const {width,height}=STANDARD_DESKTOP_VIEWPORT,viewports=[[width,height]];
 const checks=[],errors=[],remote=[],observations=[],isolated=[],boundaries=[],forgeries=[],backups=[],offline=[],preparations=[],retries=[],navigations=[],checkedLedger=[],captures=[],visuals=[],capacity=[],textLimits=[];
 const cp=structuredClone,digest=value=>crypto.createHash('sha256').update(value).digest('hex');
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
 const hash=value=>digest(JSON.stringify(stable(value))),ok=(value,message,detail={})=>{assert.ok(value,message);checks.push({message,...detail});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const sourceFiles=['dist/learning/unitrefine-evidence.js','dist/learning/thinking-feedback.js','dist/learning/evidence-adapters.js','dist/exploration-core.js','tests/p9-unitrefine-adapter-browser.cjs','tests/fixtures/p9-unitrefine-cases.cjs','tests/p9-unitrefine-evidence.test.mjs','tests/fixtures/p9-unitrefine-navigation.cjs','tests/p9-unitrefine-navigation.test.mjs',...Object.keys({...fixture.sourceHashes,...navigationFixture.sourceHashes})];
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),nodeVersion:process.version,cache,
  sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),childTrial:false,independentTeachingReview:false,nativeSourceSeededCorrectWork:false,nativeSourceSeededLessonPositions:false,
  syntheticCompatibilityFixturesAreChildRecords:false,nativeBackupImportsCompleted:0,compatibilityImportsCompleted:0,corruptImportsRejected:0};
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {sessionTaskFor,BRIDGES}=await import('../dist/learning/bridges.js'),M=await import('../dist/learning/phase5/b28-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js'),{setField}=await import('../dist/learning/phase4/ui.js');
 const {thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 const State=await import('../dist/learning/state.js'),Core=await import('../dist/exploration-core.js'),{studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const {unitrefineBinding:binding,replayUnitrefineEvidence:replay}=await import('../dist/learning/unitrefine-evidence.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const taskFor=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index}),originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const lessonFrom=(value,c)=>Object.hasOwn(BRIDGES,c.id)?value.daily.bridges[c.id]:value.lessons[c.id];
 for(const c of[...cases,...associated,...practice])assert.equal(hash(taskFor(c)),c.taskHash);
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(path.join(root,file))),sha,file);
 const artifactPaths=new Set(),uniqueFile=name=>{assert.ok(!artifactPaths.has(name),'one immutable raw artifact: '+name);artifactPaths.add(name);return path.join(out,name);};
 fs.writeFileSync(uniqueFile('fixed-source-cases.json'),JSON.stringify(fixture,null,2));fs.writeFileSync(uniqueFile('fixed-navigation.json'),JSON.stringify(navigationFixture,null,2));
 let browser,server,activePage,label='setup';const openContexts=new Set(),diagnostics=new Map();
 // Original storage, State and downloaded V2 are separate evidence files.
 // Keep replay hashes and the construction in the index, with exact events
 // available for independent replay from each capture's State file.
 const proofSummaries=new WeakMap();
 function summarizeProof(proof){
  if(proof===null)return null;
  assert.equal(proof.kind,'unitrefine');
  const cached=proofSummaries.get(proof);if(cached)return cached;
  const {events,records,selections,removals,overflows,...summary}=proof;
  const entry={...summary,fullReplayInline:false,replayFrom:'capture.storage.state',
   fullReplaySha256:digest(JSON.stringify(proof)),
   eventRows:events.length,recordRows:records.length,selectionRows:selections.length,
   removalRows:removals.length,overflowRows:overflows.length};
  proofSummaries.set(proof,entry);return entry;
 }
 function compact(value){
  if(Array.isArray(value))return value.map(compact);
  if(!value||typeof value!=='object')return value;
  const result={};
  for(const [key,item] of Object.entries(value)){
   if(['model','record','attempts','originalState','decodedState','emptyModel'].includes(key))continue;
   if(key==='proof')result.proof=summarizeProof(item);
   else if(key==='attempt'){
    const {id,at,supported,exposed}=item;
    result.attemptSummary={id,at,supported,exposed};
   }else if(key==='beforeRecord'||key==='afterRecord'){
    result[key+'Summary']=item?{attemptCount:item.attempts.length,support:item.support,exposed:item.exposed}:null;
   }else result[key]=compact(item);
  }
  return result;
 }
 const report=()=>({provenance,viewports,checks,errors,remote,forgeries,
  ...compact({observations,isolated,boundaries,backups,offline,preparations,retries,navigations,
   checkedLedger,captures,visuals,capacity,textLimits}),
  nativeTasks:3,nativeNodes:1,associatedTasks:1,practiceCompatibilityPositions:1,targets:4,sessions:2,childTrial:false,independentTeachingReview:false});
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});provenance.browserVersion=browser.version();
  const prefix=width+'x'+height;label=prefix+'-cache';
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
  server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
  const profiles=[];
  for(const role of['source','native-restore-target','constructed-compatibility',...unitrefineCapacityModes().map(m=>'constructed-cap-'+m.id),...unitrefineTextModes().map(m=>'constructed-'+m.id)]){
   const context=await newDesktopContext(browser,{reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:'allow'});openContexts.add(context);
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
   if(t.type==='x-m28-refine'){
    if(before.history.length<2000){assert.equal(after.history.length,before.history.length+1);assert.deepEqual(after.history.slice(0,-1),before.history);assert.equal(after.history.at(-1).a,name.replace(/^m28-/,''));}
    else assert.deepEqual(after,before,'original capped actions leave the entire model unchanged');
   }
   return after;
  };
  const solve=async(c,options)=>{for(const step of unitrefineOperationPlan(c,await model(c),options))step.field?await field(c,step.field,step.value):await action(c,step.action,step.data);};
  const visual=async(c,phase)=>{
   const task=taskFor(c),m=await model(c),board=page.locator('.m28-world svg');assert.equal(await board.count(),1);await board.scrollIntoViewIfNeeded();assert.equal(await board.isVisible(),true);
   const box=await board.boundingBox();assert.ok(box&&box.width>150&&box.height>50);
   const displayed=await board.evaluate(el=>({viewBox:el.getAttribute('viewBox'),label:el.getAttribute('aria-label'),
    rectangles:[...el.querySelectorAll('rect')].map(node=>{const box=node.getBoundingClientRect();return{x:Number(node.getAttribute('x')),y:Number(node.getAttribute('y')),width:Number(node.getAttribute('width')),height:Number(node.getAttribute('height')),fill:node.getAttribute('fill'),visibleWidth:box.width,visibleHeight:box.height};}),
    lines:[...el.querySelectorAll('line')].map(node=>({x1:Number(node.getAttribute('x1')),x2:Number(node.getAttribute('x2')),y1:Number(node.getAttribute('y1')),y2:Number(node.getAttribute('y2'))}))}));
   assert.equal(displayed.viewBox,'0 0 760 220');assert.equal(displayed.rectangles.length,m.board.count+1);
   assert.deepEqual([displayed.rectangles[0].x,displayed.rectangles[0].y,displayed.rectangles[0].width,displayed.rectangles[0].height],[100,50,task.total*48,34]);
   for(let i=0;i<m.board.count;i++){const r=displayed.rectangles[i+1];assert.deepEqual([r.x,r.y,r.width,r.height],[100+i*m.board.size*48,120,m.board.size*48,38]);}
   assert.ok(displayed.rectangles.every(r=>r.visibleWidth>0&&r.visibleHeight>0),'every actual whole-unit rectangle has positive visible area');
   const remainder=m.board.size===null?null:task.total-m.board.count*m.board.size;assert.equal(displayed.lines.length,remainder>0?1:0);
   if(remainder>0)assert.deepEqual(displayed.lines[0],{x1:100+m.board.count*m.board.size*48,x2:100+task.total*48,y1:178,y2:178});
   assert.ok((await page.locator('.m28-controls').innerText()).includes(`已放 ${m.board.count} 个`),'the source count is visibly supplied by the tool');
   const file=label+'-visual-'+phase+'.png',bytes=await board.screenshot({path:uniqueFile(file)});
   const pixels=await page.evaluate(async encoded=>{
    const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),image=new OffscreenCanvas(bitmap.width,bitmap.height),context=image.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();
    const raw=context.getImageData(0,0,image.width,image.height).data,colors=new Set();let min=255,max=0;
    for(let i=0;i<raw.length;i+=4){const r=raw[i],g=raw[i+1],b=raw[i+2];colors.add((r>>4)*256+(g>>4)*16+(b>>4));min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);}
    return{width:image.width,height:image.height,quantizedColors:colors.size,channelRange:max-min};
   },bytes.toString('base64'));
   assert.ok(pixels.quantizedColors>=6&&pixels.channelRange>40,'the actual screenshot contains rendered length and unit quantities');
   const item={width,height,id:c.id,index:c.index,label,phase,file,sha256:digest(bytes),bytes:bytes.length,box,pixels,displayed,model:m};visuals.push(item);return item;
  };
  const capture=async(c,phase,strict,{role,checked=false}={})=>{
   const raw=await rawSnapshot(phase),lesson=lessonFrom(raw.decodedState,c),m=lesson.models[c.index],record=lesson.cases[c.index]||null,task=taskFor(c),proof=replay(task,m);
   assert.equal(Tasks.validModel(task,m),true);const expectedFeedback=thinkingFeedback(task,m,record,ctx(c)),native=!!binding(task,ctx(c));
   assert.equal(native&&!!expectedFeedback,strict);if(role!=='prerequisite')assert.equal(!!expectedFeedback,strict);
   assert.equal(await hint.count(),expectedFeedback?1:0);if(expectedFeedback)assert.equal(await hint.isVisible(),true);const words=expectedFeedback?await hint.innerText():null;
   if(strict){
    assert.ok(proof&&native);assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(expectedFeedback.method,null);
    assert.ok(words.includes('连续排放、完整单位数和余量由工具提供')&&words.includes('当前两份有效保存记录'));assert.doesNotMatch(words,/MP\.\d/);assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);
    for(const r of proof.construction.runs)assert.ok(words.includes(`${r.count} × ${r.size} + ${r.remainder} = ${proof.construction.total}`));
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
   const initial=Tasks.defaultModel(taskFor(c));initial.seed=after.model.seed;assert.deepEqual(after.model,initial);assert.deepEqual(after.lesson.cases,before.lesson.cases);assert.deepEqual(after.lesson.notes,before.lesson.notes);assert.equal(after.lesson.draft,before.lesson.draft);
   for(const[index,value]of Object.entries(before.lesson.models))if(Number(index)!==c.index)assert.deepEqual(after.lesson.models[index],value);assert.equal(await hint.count(),0);
   const storage=null;
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
     const checked=await check(previous,true,false,'navigation-prerequisite-'+at,'prerequisite');preparations.push({width,height,...prep,checked,strictUnitrefineCoverage:false});
    }
    const before=originalState(await state()),next=page.locator('#actions [data-do="next"]');assert.equal(await next.count(),1);assert.equal(await next.isEnabled(),true);await next.click();
    const from=at;at++;await wait({id:c.id,index:at});keepRecords(before,originalState(await state()));navigations.push({width,height,id:c.id,from,to:at,originalNext:true});
   }
   const fresh=await current(c);const initial=Tasks.defaultModel(taskFor(c));initial.seed=fresh.model.seed;assert.deepEqual(fresh.model,initial);assert.equal(fresh.record?.attempts?.length??0,0);assert.equal(await page.locator('[data-do="p3-retry"]').count(),0);
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
    const moduleNames=[...new Set(['storage.js','v2.html','learn.html','exploration.js','exploration-core.js','data/atlas.json','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/unitrefine-evidence.js','learning/p3-workflow.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','vendor/three/three.module.min.js','vendor/three/OrbitControls.js',...sourceFiles.filter(file=>file.startsWith('dist/')).map(file=>file.slice(5))])];
    const modules=await target.evaluate(async({expected,names})=>{const store=await caches.open(expected);return Promise.all(names.map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},{expected:cache,names:moduleNames});
    const empty=originalState(await state(target));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
    const item={width,height,role:profile.role,cache,status,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false,emptyLearningState:true,emptyStorage:storageOnly(await rawSnapshot('empty-'+profile.role,target))};
    ok(status.ready&&item.missing.length===0,prefix+' '+profile.role+' active complete cache and genuine empty learning state',item);offline.push(item);return item;
   }catch(error){activePage=target;error.diagnosticPage=target;throw error;}
  };
  const warmed=await Promise.all(profiles.map(cacheReady));await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const item of warmed)item.originStopped=!server.listening;
  ok(!server.listening,prefix+' origin stops before all mathematical controls and real file imports');
  const api=(c,role)=>({field:(key,value)=>field(c,key,value),action:(name,data)=>action(c,name,data),solve:options=>solve(c,options),model:()=>model(c),
   check:(correct,strict,phase)=>check(c,correct,strict,phase,role),capture:(phase,strict)=>capture(c,phase,strict,{role}),retry:kind=>retry(c,kind,role),assert:(value,message)=>ok(value,label+' '+message)});
  const runBoundary=async(c,kind)=>{
   label=prefix+'-'+c.id+'-'+c.index+'-boundary-'+kind;await retry(c,'boundary-'+kind,'boundary');await capture(c,'boundary-retry',false,{role:'boundary'});
   const phases=await unitrefineBoundaryFlow(kind,c,api(c,'boundary'));await reload(c);assert.deepEqual(await model(c),phases.at(-1).model);assert.equal(await hint.isVisible(),true);
   const rendered=await visual(c,'final'),screenshot=await shot('boundary');boundaries.push({width,height,kind,id:c.id,index:c.index,phases,rendered,screenshot,constructedCompatibilityFixture:false});
  };
  const runNative=async c=>{
   label=prefix+'-'+c.id+'-'+c.index;await open(c);assert.equal(binding(taskFor(c),ctx(c))?.nodeId,c.nodeId);
   assert.equal(await guide.isVisible(),true);assert.equal(await guide.evaluate(e=>e.open),false);assert.equal(await hint.count(),0);const before=await current(c),images={initial:await visual(c,'initial')};
   await guide.locator(':scope > summary').click();assert.equal(await guide.locator('p').isVisible(),true);
   await page.waitForFunction(async({id,index})=>{const{readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;},c);
   await guide.locator(':scope > summary').click();const supported=await current(c);assert.deepEqual(supported.model,before.model);assert.equal(supported.record.attempts.length,0);
   const phases=await unitrefineNativeFlow(c,{...api(c,'native'),checkpoint:async(stage,items)=>{
    if(['first-size-overflow','overflow','removed'].includes(stage))images[stage]=await visual(c,stage);
    if(stage==='correct-unsubmitted')assert.equal(await hint.count(),0);
    if(stage==='corrected'){images.corrected=await visual(c,'corrected');await shot('corrected');await reload(c);assert.equal(await hint.isVisible(),true);assert.deepEqual(await model(c),items.at(-1).model);assert.notEqual(images.corrected.sha256,images.initial.sha256);}
    if(['reselected','shared-retry'].includes(stage)){await reload(c);assert.equal(await hint.count(),0);images[stage]=await visual(c,stage);}
    if(stage==='final'){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);images.final=await visual(c,'retry-corrected');}
   }});
   const final=phases.at(-1),actual=phases.filter(x=>x.checked);assert.equal(actual.length,22);assert.equal(phases.length,30);assert.deepEqual(final.record.attempts,actual.map(x=>x.attempt));
   for(const kind of['extra-root','extra-event','false-issue','hidden-offset','hidden-estimate','hidden-error','noncanonical-index','foreign-action']){
    const forged=cp(final.model),task=taskFor(c);
    if(kind==='extra-root')forged.unrecorded=1;else if(kind==='extra-event')forged.history[0].unrecorded=1;else if(kind==='false-issue')forged.issue='not the recorded issue';
    else if(kind==='hidden-offset')forged.offset='0';else if(kind==='hidden-estimate')forged.estimate='1';else if(kind==='hidden-error')forged.error='1';else if(kind==='noncanonical-index')forged.history[0].d.index='00';else M.act(task,forged,'m28-help');
    assert.equal(replay(task,forged),null);forgeries.push({width,height,id:c.id,index:c.index,kind,counterfactual:true,actualBrowserAction:false,model:forged,originalValid:M.valid(task,forged),strict:false});
   }
   observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,taskHash:c.taskHash,phases,images});for(const kind of unitrefineBoundaryKindsFor(c))await runBoundary(c,kind);
  };
  for(const c of targets){
   if(c.role==='native')await runNative(c);
   else{label=prefix+'-'+c.role+'-'+c.id+'-'+c.index;await open(c);assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);await capture(c,'associated-initial',false,{role:'associated'});await solve(c);await capture(c,'associated-unsubmitted',false,{role:'associated'});
    const snapshot=await check(c,true,false,'associated-checked','associated');assert.ok(snapshot.proof);assert.equal(binding(taskFor(c),ctx(c)),null);await reload(c);assert.equal(await hint.count(),0);assert.deepEqual(await model(c),snapshot.model);
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
  assert.equal(sourceRows.length,79);assert.equal(sourceCaptures.length,108);const positions=[...new Set(sourceRows.map(x=>x.id+':'+x.index))];assert.equal(positions.length,6);
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
  assert.ok((await importFile(restorePage,actual.payload,'unitrefine-identical-repeat-v2.json')).includes('备份已合并'));const repeated=await read(restorePage);assert.equal(repeated.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),actual.backup.state);
  const repeatedImportStorage=storageOnly(await rawSnapshot('repeated-import',restorePage));provenance.nativeBackupImportsCompleted++;
  assert.ok(!(await importFile(restorePage,'{','unitrefine-corrupt-native.json')).includes('备份已合并'));assert.equal((await read(restorePage)).raw,imported.raw);
  const corruptImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected',restorePage));provenance.corruptImportsRejected++;
  const last=cases.at(-1);await navigate(last,restorePage);assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
  const restoredReload=await restorePage.reload();assert.equal(restoredReload?.fromServiceWorker(),true);await wait(last,restorePage);keepRecords(actual.backup.state,originalState(await state(restorePage)));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
  const restoredStorage=storageOnly(await rawSnapshot('restored-lesson',restorePage)),restoredScreenshot=await shot('restored',restorePage);
  backups.push({width,height,kind:'actual-browser-v2',backupFile:actual.file,bytes:actual.bytes,backupSha256:actual.sha256,originalState:actual.backup.state,
   emptyBeforeImport,firstImportStorage,repeatedImportStorage,corruptImportStorage,restoredStorage,exportedScreenshot,restoredScreenshot,sourceCaptureMap,
   independentEmptyContext:true,originStopped:!server.listening,wholeStateFirstImportExact:true,repeatByteIdempotent:true,corruptRejectedWithoutWrite:true,checked:79,currentModelCaptures:108,positions:6});

  // Old practice positions have no dedicated current practice page. This
  // third independent context receives explicitly constructed compatibility
  // data, never a fabricated native attempt or a seed into the source route.
  contextRole='constructed-compatibility';page=compatibilityProfile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-constructed-practice-compatibility';
  const legacyState=Core.fresh();
  for(const c of practice){const t=taskFor(c),m=Tasks.defaultModel(t);for(const step of unitrefineOperationPlan(c,m))if(step.field){setField(m,step.field,String(step.value));M.field(t,m,step.field);}else M.act(t,m,step.action,step.data||{});
   assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);assert.ok(replay(t,m));assert.equal(binding(t,ctx(c)),null);const a=legacyState.lessons[c.id]??=State.freshLesson(c.id);a.models[-1]=m;assert.deepEqual(a.cases,{});}
  originalState(legacyState);const legacyPayload=JSON.stringify(Core.backup(legacyState)),legacyFile=label+'-v2.json';fs.writeFileSync(uniqueFile(legacyFile),legacyPayload);
  const legacyResponse=await page.reload();assert.equal(legacyResponse?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
  const emptyLegacy=originalState(await state());assert.deepEqual(emptyLegacy.lessons,{});assert.deepEqual(emptyLegacy.daily.bridges,{});const legacyEmptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
  assert.ok((await importFile(page,legacyPayload,legacyFile)).includes('备份已合并'));const legacyImported=await read(page);assert.deepEqual(originalState(JSON.parse(legacyImported.text)),legacyState);
  const legacyImportStorage=storageOnly(await rawSnapshot('imported-original-practice'));provenance.compatibilityImportsCompleted++;
  assert.ok(!(await importFile(page,'{','unitrefine-corrupt-practice.json')).includes('备份已合并'));assert.equal((await read(page)).raw,legacyImported.raw);
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
   backupFile:legacyFinal.file,bytes:legacyFinal.bytes,backupSha256:legacyFinal.sha256,originalState:legacyFinal.backup.state,practiceSnapshots,importedConstructedSubmissions:0,actualUIChecksAfterImport:0,oldPractice:1,independentContext:true,originStopped:!server.listening});
  for(const mode of unitrefineCapacityModes()){
   const profile=profiles.find(p=>p.role==='constructed-cap-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');
   label=prefix+'-constructed-cap-'+mode.id;const c=cases[0],task=taskFor(c),fixture=constructUnitrefineCapacityFixture(c,mode,{Tasks,State,Core,Engine,setField,task});
   originalState(fixture.state);assert.equal(fixture.state.lessons[c.id].models[c.index].history.length,2000);
   const fixturePayload=JSON.stringify(Core.backup(fixture.state)),fixtureFile=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(fixtureFile),fixturePayload);
   const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
   const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
   assert.ok((await importFile(page,fixturePayload,fixtureFile)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;
   const importedStorage=storageOnly(await rawSnapshot('imported-fixture'));
   assert.ok((await importFile(page,fixturePayload,'unitrefine-identical-'+mode.id+'-v2.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;
   const repeatedStorage=storageOnly(await rawSnapshot('repeated-fixture'));
   const invalid=cp(fixture.state);invalid.lessons[c.id].models[c.index].history.push(cp(invalid.lessons[c.id].models[c.index].history.at(-1)));assert.equal(invalid.lessons[c.id].models[c.index].history.length,2001);assert.equal(M.valid(task,invalid.lessons[c.id].models[c.index]),false);
   const invalidPayload=JSON.stringify({...Core.backup(fixture.state),state:invalid});
   assert.ok(!(await importFile(page,invalidPayload,'unitrefine-invalid-2001-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;
   const rejectedImportStorage=storageOnly(await rawSnapshot('invalid-2001-import-rejected'));await navigate(c);
   const actionMetadata=[];
   const phases=await unitrefineCapacityFlow(mode,c,{...api(c,'capacity'),
    assertRetryAvailable:async expected=>assert.equal(await page.locator('[data-do="p3-retry"]').count(),expected?1:0,'zero-attempt fixture does not invent a retry button'),
    cappedAction:async name=>{const before=await current(c),raw=await read(page);await action(c,'m28-'+name,name==='size'?{index:String(c.task.sizes[0].size)}:{});const after=await current(c),changed=await read(page);assert.deepEqual(after.model,before.model);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.deepEqual(after.record?.attempts||[],before.record?.attempts||[]);
     if(before.model.board.bad||before.model.issue)assert.equal(after.record.support,true);
     assert.notEqual(after.lesson.updatedAt,before.lesson.updatedAt,'the original successful update still writes its timestamp');assert.notEqual(changed.raw,raw.raw,'a model noop is not a raw-storage no-write');
     actionMetadata.push({name,beforeUpdatedAt:before.lesson.updatedAt,afterUpdatedAt:after.lesson.updatedAt,beforeSupport:before.record?.support??null,afterSupport:after.record?.support??null,modelUnchanged:true,rawChanged:true,attemptsUnchanged:true});
    }
   });
   const rendered=await visual(c,'after-capacity-retry'),screenshot=await shot('recovered'),final=await downloadBackup('recovered-v2'),rows=captures.filter(x=>x.width===width&&x.contextRole===contextRole),captureMap=mapCaptures(rows,final.backup.state);
   const currentLesson=lessonFrom(final.backup.state,c);assert.deepEqual(currentLesson.notes,fixture.state.lessons[c.id].notes);assert.equal(currentLesson.draft,fixture.state.lessons[c.id].draft);
   assert.equal(currentLesson.cases[c.index].attempts.length,fixture.constructedSubmissions+(mode.kind==='empty'?2:4));assert.deepEqual(currentLesson.cases[c.index].attempts.slice(0,mode.prior),fixture.state.lessons[c.id].cases[c.index]?.attempts||[]);
   const item={width,height,mode,id:c.id,index:c.index,contextRole,constructedCompatibilityFixture:true,constructedSubmissions:fixture.constructedSubmissions,
    fixtureFile,fixtureSHA256:digest(fixturePayload),emptyStorage,importedStorage,repeatedStorage,rejectedImportStorage,phases,captureMap,actionMetadata,rendered,screenshot,
    actualUIChecksAfterImport:mode.kind==='empty'?2:4,actualSharedRetries:1,wholeModelUnchangedByCappedAction:true,controllerMetadataStillWritten:true,documentReloadRequiredForCap:false,
    zeroAttemptNeedsCheckBeforeRetry:mode.prior===0,nativeHandEnteredHistory:false,backupFile:final.file,backupSha256:final.sha256,originalState:final.backup.state};
   capacity.push(item);backups.push({...item,kind:'constructed-capacity-final-v2'});
  }
  for(const mode of unitrefineTextModes()){
   const profile=profiles.find(p=>p.role==='constructed-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-constructed-'+mode.id;
   const c=cases[0],task=taskFor(c),fixture=constructUnitrefineTextFixture(c,mode,{State,Core,Engine,setField,task});originalState(fixture.state);
   const fixturePayload=JSON.stringify(Core.backup(fixture.state)),fixtureFile=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(fixtureFile),fixturePayload);
   const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
   assert.ok((await importFile(page,fixturePayload,fixtureFile)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;const importedStorage=storageOnly(await rawSnapshot('imported-fixture'));
   assert.ok((await importFile(page,fixturePayload,'unitrefine-identical-'+mode.id+'-v2.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;const repeatedStorage=storageOnly(await rawSnapshot('repeated-fixture'));
   const invalid=cp(fixture.state);invalid.lessons[c.id].models[c.index].prose='文'.repeat(1201);assert.equal(M.valid(task,invalid.lessons[c.id].models[c.index]),false);const invalidPayload=JSON.stringify({...Core.backup(fixture.state),state:invalid});
   assert.ok(!(await importFile(page,invalidPayload,'unitrefine-invalid-1201-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;const rejectedImportStorage=storageOnly(await rawSnapshot('invalid-1201-import-rejected'));await navigate(c);
   let persisted,beforeBlock;const images=[],blockedActions=[];
   const phases=await unitrefineTextFlow(mode,c,{...api(c,'text-limit'),assertRetryAvailable:async expected=>assert.equal(await page.locator('[data-do="p3-retry"]').count(),expected?1:0),
    overlongText:async(key,value)=>{persisted=await read(page);beforeBlock=await current(c);const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.getAttribute('maxlength'),null);await control.fill(value);
     assert.equal(await page.locator('#storage-warning').isVisible(),true);assert.ok((await page.locator('#storage-warning').innerText()).includes('已停止覆盖原记录'));assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);images.push(await shot('1201-blocked'));
    },
    blockedAction:async name=>{const selector={check:'#actions [data-do="check"]',size:`[data-x="m28-size"][data-index="${c.task.sizes[0].size}"]`,remove:'[data-x="m28-remove"]',retry:'[data-do="p3-retry"]'}[name],control=page.locator(selector);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);blockedActions.push({name,actualVisibleControl:true,rawUnchanged:true,modelUnchanged:true});},
    reloadBlocked:async()=>{await reload(c);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.deepEqual((await current(c)).model,beforeBlock.model);images.push(await shot('1200-reloaded'));}
   });
   const rendered=await visual(c,'after-text-retry'),final=await downloadBackup('recovered-v2'),rows=captures.filter(x=>x.width===width&&x.contextRole===contextRole),captureMap=mapCaptures(rows,final.backup.state),currentLesson=lessonFrom(final.backup.state,c),actualChecks=mode.prior?1:2;
   assert.deepEqual(currentLesson.notes,fixture.state.lessons[c.id].notes);assert.equal(currentLesson.draft,fixture.state.lessons[c.id].draft);assert.equal(currentLesson.cases[c.index].attempts.length,mode.prior+actualChecks);assert.deepEqual(currentLesson.cases[c.index].attempts.slice(0,mode.prior),fixture.state.lessons[c.id].cases[c.index]?.attempts||[]);
   const item={width,height,mode,id:c.id,index:c.index,contextRole,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,fixtureFile,fixtureSHA256:digest(fixturePayload),emptyStorage,importedStorage,repeatedStorage,rejectedImportStorage,
    phases,captureMap,images,blockedActions,rendered,actualUIChecksAfterImport:actualChecks,actualSharedRetries:1,writeRejectedBeforeStorage:true,oldRawBytesPreserved:true,documentReloadRequired:true,zeroAttemptNeedsCheckBeforeRetry:mode.prior===0,
    backupFile:final.file,backupSha256:final.sha256,originalState:final.backup.state};textLimits.push(item);backups.push({...item,kind:'constructed-text-limit-final-v2'});
  }
  for(const profile of profiles){await profile.context.close();openContexts.delete(profile.context);}activePage=null;
  assert.equal(errors.length,0);assert.equal(remote.length,0);assert.equal(observations.length,3);assert.equal(forgeries.length,24);assert.equal(preparations.length,2);assert.equal(navigations.length,4);
  assert.equal(isolated.filter(x=>x.kind==='associated').length,1);assert.equal(isolated.filter(x=>x.kind==='old-practice-compatibility').length,1);assert.equal(boundaries.length,2);assert.equal(capacity.length,7);assert.equal(textLimits.length,2);
  const nativeChecked=checkedLedger.filter(x=>x.contextRole==='source'),nativeCaptures=captures.filter(x=>x.contextRole==='source'),capacityChecked=checkedLedger.filter(x=>x.role==='capacity'),capacityCaptures=captures.filter(x=>x.role==='capacity'),textChecked=checkedLedger.filter(x=>x.role==='text-limit'),textCaptures=captures.filter(x=>x.role==='text-limit');
  assert.equal(nativeChecked.length,79);assert.equal(nativeCaptures.length,108);assert.equal(capacityChecked.length,26);assert.equal(capacityCaptures.length,86);assert.equal(textChecked.length,3);assert.equal(textCaptures.length,18);
  assert.equal(checkedLedger.length,108);assert.equal(captures.length,212);assert.equal(retries.filter(x=>x.contextRole==='source').length,5);assert.equal(retries.length,14);
  assert.ok(nativeChecked.every(x=>!x.constructedCompatibilityFixture));assert.ok([...capacityChecked,...textChecked].every(x=>x.constructedCompatibilityFixture));
  assert.equal(backups.filter(x=>x.kind==='actual-browser-v2').length,1);assert.equal(backups.filter(x=>x.kind==='constructed-practice-final-v2').length,1);assert.equal(backups.filter(x=>x.kind==='constructed-capacity-final-v2').length,7);assert.equal(backups.filter(x=>x.kind==='constructed-text-limit-final-v2').length,2);
  assert.equal(provenance.nativeBackupImportsCompleted,2);assert.equal(provenance.compatibilityImportsCompleted,19);assert.equal(provenance.corruptImportsRejected,11);
  const attemptCounts=Object.fromEntries(['native','boundary','associated','prerequisite','capacity','text-limit'].map(role=>[role,checkedLedger.filter(x=>x.role===role).length]));
  assert.deepEqual(attemptCounts,{native:66,boundary:10,associated:1,prerequisite:2,capacity:26,'text-limit':3});
  const checkedPaths=checkedLedger.flatMap(x=>[x.storage.raw,x.storage.state]),capturePaths=captures.flatMap(x=>[x.storage.raw,x.storage.state]);assert.equal(new Set(checkedPaths).size,216);assert.equal(new Set(capturePaths).size,424);
  assert.equal(offline.length,profiles.length);
  assert.ok(offline.every(item=>item.originStopped),'All original learning and backup flows run against a stopped origin');
  const proofContracts=['math','correction','persistence','negative','backup'];
  fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(provenance,null,2));
  const index=JSON.stringify({...report(),proofContracts,attemptCounts,uniqueCheckedFiles:216,uniqueCaptureFiles:424,originStopped:true},null,2);
  assert.ok(Buffer.byteLength(index,'utf8')<64*1024*1024,'results index must stay bounded');
  fs.writeFileSync(path.join(out,'results.json'),index);
  console.log('P9_UNITREFINE_ADAPTER_BROWSER_OK '+JSON.stringify({
   checks:checks.length,nativeTasks:3,taskViewportPairs:3,sourceChecked:nativeChecked.length,
   compatibilityChecked:capacityChecked.length+textChecked.length,checked:checkedLedger.length,
   sourceCaptures:nativeCaptures.length,compatibilityCaptures:capacityCaptures.length+textCaptures.length,
   captures:captures.length,oldPractice:1,sourceRetries:5,compatibilityRetries:9,next:navigations.length,
   forgeries:forgeries.length,nativeBackups:1,compatibilityBackups:10,visuals:visuals.length
  }));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(reason=>({diagnosticError:String(reason)})):null;
  if(activePage){await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.html'),await activePage.content().catch(()=>''));}
  console.error('P9_UNITREFINE_ADAPTER_BROWSER_FAILED:',error.stack||String(error));
  const failure={provenance,at:label,error:String(error),stack:error.stack,diagnosticFile,
   errors:[...errors,{label,error:String(error)}],checks:checks.length,checked:checkedLedger.length,captures:captures.length,
   evidenceFiles:fs.readdirSync(out).sort()};
  try{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(failure,null,2));}
  catch(writeError){console.error('Unable to preserve failure index:',writeError.stack||String(writeError));}
  process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const context of openContexts)await context.close();if(browser)await browser.close();
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
