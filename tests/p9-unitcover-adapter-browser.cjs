// Pure original-control flows are exported for a separate source/State review.
// Chromium, server and file I/O run only when this file is the program entry.
const fixture=require('./fixtures/p9-unitcover-cases.cjs');
const navigationFixture=require('./fixtures/p9-unitcover-navigation.cjs');
function orderedUnitcoverTargets(){
 const all=[...fixture.cases.map(c=>({...c,role:'native'})),...fixture.associated.map(c=>({...c,role:'associated'}))];
 return[...new Set(all.map(c=>c.id))].flatMap(id=>all.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));
}
function unitcoverOperationPlan(spec,model){
 const {length,size,unit}=spec.task,wanted=Array.from({length:length/size},(_,i)=>i*size),out=[];
 for(const start of model.board.positions)if(!wanted.includes(start))out.push({action:'m28-place',data:{index:String(start)}});
 for(const start of wanted)if(!model.board.positions.includes(start))out.push({action:'m28-place',data:{index:String(start)}});
 out.push({field:'measure',value:String(length/size)},{field:'unit',value:unit},{action:'m28-record'});
 for(const[q,question]of(spec.task.questions||[]).entries())out.push({field:'answers.'+q,value:String(question.value)});
 return out;
}
async function saveUnitcover(spec,api,measure=String(spec.math.count),unit=spec.task.unit){await api.field('measure',measure);await api.field('unit',unit);await api.action('m28-record');}
async function unitcoverNativeFlow(spec,api){
 const {field,action,solve,model,check,capture,retry,checkpoint,assert}=api,phases=[await capture('initial',false)],n=spec.math.count;
 await action('m28-record');phases.push(await check(false,false,'blank-record'));assert(Object.keys((await model()).board.first).length===0,'blank failure has no first numeric record');
 await saveUnitcover(spec,api,String(n+1),'cm');phases.push(await check(false,false,'wrong-count-on-gap'));
 if(spec.task.size===2){await action('m28-place',{index:'0'});await action('m28-place',{index:'1'});await saveUnitcover(spec,api);phases.push(await check(false,false,'overlap-record'));await checkpoint('overlap',phases);await action('m28-place',{index:'1'});}
 await solve();phases.push(await capture('correct-unsubmitted',false));await checkpoint('correct-unsubmitted',phases);phases.push(await check(true,true,'corrected'));await checkpoint('corrected',phases);
 assert(phases.at(-1).proof.construction.firstMeasure.raw===String(n+1)&&phases.at(-1).proof.construction.hadOriginalBad,'first wrong numeric record and original bad remain');
 phases.push(await check(true,true,'repeated-check'));
 await field('measure',n+'.0');phases.push(await check(false,false,'equivalent-draft-unsaved'));await action('m28-record');phases.push(await check(true,true,'equivalent-saved'));
 await field('prose','我把一样长的单位接好；文字解释保留待确认。');phases.push(await capture('prose-unsubmitted',false));phases.push(await check(true,true,'prose-rechecked'));
 await saveUnitcover(spec,api,n+'.00000001');phases.push(await check(true,false,'original-near-success-only'));assert(phases.at(-1).proof===null,'near original success is not exact current evidence');
 await saveUnitcover(spec,api);phases.push(await check(true,true,'exact-count-restored'));
 const saved=structuredClone((await model()).board.saved);await saveUnitcover(spec,api,'','');phases.push(await check(false,false,'failed-record-keeps-old-save'));assert(JSON.stringify((await model()).board.saved)===JSON.stringify(saved),'failed record preserves old saved pair');
 await field('measure',saved.measure);await field('unit',saved.unit);phases.push(await capture('old-pair-restored-unsubmitted',false));phases.push(await check(true,true,'old-pair-restored-with-issue'));assert(!!phases.at(-1).proof.issue,'restored old pair retains the real failed-save issue');
 await action('m28-place',{index:'0'});phases.push(await check(false,false,'removed-current-unit'));await checkpoint('removed',phases);
 await action('m28-place',{index:'0'});phases.push(await check(false,false,'replaced-not-saved'));await action('m28-record');phases.push(await check(true,true,'removed-unit-rebuilt'));
 const beforeClear=await model();await action('m28-clear');phases.push(await capture('clear-unsubmitted',false));await checkpoint('clear',phases);phases.push(await check(false,false,'cleared-current-cover'));
 assert(JSON.stringify((await model()).board.first)===JSON.stringify(beforeClear.board.first)&&(await model()).board.bad===beforeClear.board.bad,'internal clear preserves first and original bad');
 await solve();phases.push(await check(true,true,'cleared-cover-rebuilt'));await retry('native');phases.push(await capture('shared-retry',false));await checkpoint('shared-retry',phases);
 await solve();phases.push(await check(true,true,'retry-corrected'));await checkpoint('final',phases);return phases;
}
function unitcoverBoundaryKindsFor(spec){return({'lengthstart:0':['first-near-correction'],'lengthstart:2':['exact-spellings-and-empty-unit'],'sameunitlength:1':['text-limit'],'twounits:2':['selection-correction']})[spec.id+':'+spec.index]||[];}
async function unitcoverBoundaryFlow(kind,spec,api){
 const {field,action,solve,check,capture,retry,model,assert}=api,phases=[],n=spec.math.count;
 if(kind==='first-near-correction'){
  for(const start of spec.math.positions)await action('m28-place',{index:String(start)});await saveUnitcover(spec,api,n+'.00000001');phases.push(await check(true,false,'first-near-original-success'));
  await saveUnitcover(spec,api);phases.push(await check(true,true,'first-near-exact-correction'));const c=phases.at(-1).proof.construction;
  assert(c.firstMeasure.originalNearCount&&!c.firstMeasure.exactCount&&!c.hadOriginalBad,'original near first remains successful while exactness is separately false');
 }else if(kind==='exact-spellings-and-empty-unit'){
  await solve();for(const[label,raw]of[['mixed','0 '+n+'/1'],['fraction',n*3+'/3'],['decimal',' 00'+n+'.000 ']]){await saveUnitcover(spec,api,raw);phases.push(await check(true,true,'exact-'+label));}
  await saveUnitcover(spec,api,String(n),'');phases.push(await check(false,false,'empty-unit-really-saved'));assert((await model()).board.saved.unit==='','empty select is a real numeric save');
  await field('unit',spec.task.unit);phases.push(await check(false,false,'restored-unit-not-saved'));await action('m28-record');phases.push(await check(true,true,'unit-pair-resaved'));
 }else if(kind==='selection-correction'){
  await solve();await field('answers.0','less');phases.push(await check(false,false,'wrong-visible-comparison-choice'));await field('answers.0','');phases.push(await check(false,false,'empty-visible-comparison-choice'));await field('answers.0','more');phases.push(await check(true,true,'comparison-choice-restored'));
  assert(!phases.at(-1).proof.unitComparisonReasoningAssessed,'a selected answer is not an independently reasoned comparison');
 }else if(kind==='text-limit'){
  await solve();await field('prose','文'.repeat(1200));phases.push(await check(true,true,'1200-prose-saved'));
  await saveUnitcover(spec,api,'0'.repeat(1200-String(n).length)+n);phases.push(await check(true,true,'1200-number-saved'));
  await api.overlongText('prose','文'.repeat(1201));phases.push(await capture('1201-text-write-blocked',true));
  for(const name of['check','clear','retry']){await api.blockedAction(name);phases.push(await capture('blocked-page-'+name,true));}
  await api.reloadBlocked();phases.push(await capture('1200-text-restored-after-reload',true));await retry('text-limit');phases.push(await capture('retry-after-text-block',false));await solve();phases.push(await check(true,true,'text-limit-retry-corrected'));
 }else throw Error('Unknown unitcover boundary '+kind);
 return phases;
}
function unitcoverCapacityModes(){return['clean','bad','issue'].flatMap(kind=>[0,1].map(prior=>({id:kind+'-'+prior,kind,prior})));}
// This constructor is deliberately isolated from the native browser route.
// A real chooser imports its original valid v2 data into an empty profile.
function constructUnitcoverCapacityFixture(spec,mode,{Tasks,State,Core,Engine,setField,task}){
 if(!['clean','bad','issue'].includes(mode.kind)||![0,1].includes(mode.prior))throw Error('Unknown capacity mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);lesson.index=spec.index;state.lessons[spec.id]=lesson;
 const model=State.modelForLesson(lesson),apply=step=>{if(step.field){setField(model,step.field,step.value);Engine.fieldExtra(task,model,step.field);}else Engine.actExtra(task,model,step.action,step.data||{});};
 if(mode.kind==='bad'){apply({field:'measure',value:String(spec.math.count+1)});apply({field:'unit',value:'cm'});apply({action:'m28-record'});}
 for(const step of unitcoverOperationPlan(spec,model))apply(step);
 if(mode.prior)State.submitLesson(lesson);
 const last=mode.kind==='issue'?1999:2000;while(model.history.length<last)apply({action:'m28-record'});
 if(mode.kind==='issue'){apply({field:'measure',value:''});apply({action:'m28-record'});apply({field:'measure',value:String(spec.math.count)});}
 State.addLessonNote(lesson,'明确构造的兼容记录：上限后检查原动作、旧提交和重试保全。');lesson.draft='兼容草稿原文；不评价解释。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index,completionEvents:spec.math.count+1};
}
async function unitcoverCapacityFlow(mode,spec,api){
 const phases=[await api.capture('at-valid-2000-before-check',false)],raw=String(spec.math.count);await api.assertRetryAvailable(!!mode.prior);
 for(const name of['clear','place','record']){await api.cappedAction(name);phases.push(await api.capture('2000-'+name+'-model-noop',false));}
 phases.push(await api.check(true,true,'at-capacity-checked'));
 await api.field('measure',raw+'.0');phases.push(await api.capture('at-capacity-new-spelling-unsaved',false));await api.cappedAction('record');phases.push(await api.capture('at-capacity-record-cannot-save-spelling',false));phases.push(await api.check(false,false,'at-capacity-draft-check'));
 await api.field('measure',raw);phases.push(await api.capture('at-capacity-old-pair-restored-unsubmitted',false));phases.push(await api.check(true,true,'at-capacity-old-pair-rechecked'));
 await api.field('prose','上限后仍可编辑的原话。');phases.push(await api.capture('at-capacity-prose-unsubmitted',false));phases.push(await api.check(true,true,'at-capacity-prose-rechecked'));
 await api.retry('capacity-'+mode.id);phases.push(await api.capture('shared-retry-after-capacity',false));await api.solve();phases.push(await api.check(true,true,'capacity-retry-corrected'));return phases;
}
// Each capture already has an immutable raw State/v2 snapshot and SHA256.
// Keep the full replay in memory for mathematical assertions, but index its
// digest and bounded construction metadata instead of embedding 2000-event
// histories repeatedly in phases, captures, ledgers and capacity evidence.
function compactUnitcoverReport(value,{preserveModels=false,proofSummaries=new WeakMap()}={}){
 const compactProof=proof=>{
  if(proof===null)return null;
  if(proof?.kind!=='unitcover'||!['events','records','removals','clears'].every(key=>Array.isArray(proof[key])))
   throw Error('unexpected Unit Cover replay shape; refuse to omit proof details');
  let summary=proofSummaries.get(proof);
  if(!summary){
   const{events,records,removals,clears,...metadata}=proof;
   summary={...metadata,fullReplayInline:false,replayFrom:'capture.storage.state',
    fullReplaySha256:require('node:crypto').createHash('sha256').update(JSON.stringify(proof)).digest('hex'),
    eventRows:events.length,recordRows:records.length,removalRows:removals.length,clearRows:clears.length};
   proofSummaries.set(proof,summary);
  }
  return summary;
 };
 const walk=input=>{
  if(Array.isArray(input))return input.map(walk);
  if(!input||typeof input!=='object')return input;
  const out={};
  for(const[key,item]of Object.entries(input)){
   if(['record','attempts','emptyModel','originalState','decodedState'].includes(key))continue;
   if(key==='model'&&!preserveModels)continue;
   if(key==='proof'){out.proof=compactProof(item);continue;}
   if(key==='attempt'){
    out.attemptSummary=item?{id:item.id??null,at:item.at??null,supported:item.supported??null,exposed:item.exposed??null}:null;
    continue;
   }
   if(key==='beforeRecord'||key==='afterRecord'){
    out[key+'Summary']=item?{attemptCount:item.attempts?.length??0,support:item.support??null,exposed:item.exposed??null}:null;
    continue;
   }
   out[key]=walk(item);
  }
  return out;
 };
 return walk(value);
}
module.exports={orderedUnitcoverTargets,unitcoverOperationPlan,unitcoverNativeFlow,unitcoverBoundaryKindsFor,unitcoverBoundaryFlow,unitcoverCapacityModes,constructUnitcoverCapacityFixture,unitcoverCapacityFlow,compactUnitcoverReport};

async function main(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-unitcover-adapter');fs.mkdirSync(out,{recursive:true});
 const {cases,associated,practice}=fixture,targets=orderedUnitcoverTargets(),viewports=[[1440,900],[1280,720]];
 const checks=[],errors=[],remote=[],observations=[],isolated=[],boundaries=[],forgeries=[],backups=[],offline=[],preparations=[],retries=[],navigations=[],checkedLedger=[],captures=[],visuals=[],capacity=[];
 const cp=structuredClone,digest=value=>crypto.createHash('sha256').update(value).digest('hex');
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
 const hash=value=>digest(JSON.stringify(stable(value))),ok=(value,message,detail={})=>{assert.ok(value,message);checks.push({message,...detail});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const sourceFiles=['dist/learning/unitcover-evidence.js','dist/learning/thinking-feedback.js','dist/learning/evidence-adapters.js','dist/exploration-core.js','tests/p9-unitcover-adapter-browser.cjs','tests/fixtures/p9-unitcover-cases.cjs','tests/p9-unitcover-evidence.test.mjs','tests/fixtures/p9-unitcover-navigation.cjs','tests/p9-unitcover-navigation.test.mjs',...Object.keys({...fixture.sourceHashes,...navigationFixture.sourceHashes})];
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),nodeVersion:process.version,cache,
  sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),childTrial:false,independentTeachingReview:false,nativeSourceSeededCorrectWork:false,nativeSourceSeededLessonPositions:false,
  syntheticCompatibilityFixturesAreChildRecords:false,nativeBackupImportsCompleted:0,compatibilityImportsCompleted:0,corruptImportsRejected:0};
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {sessionTaskFor,BRIDGES}=await import('../dist/learning/bridges.js'),M=await import('../dist/learning/phase5/b28-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js'),{setField}=await import('../dist/learning/phase4/ui.js');
 const {thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 const State=await import('../dist/learning/state.js'),Core=await import('../dist/exploration-core.js'),{studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const {unitcoverBinding:binding,replayUnitcoverEvidence:replay}=await import('../dist/learning/unitcover-evidence.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const taskFor=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index}),originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const lessonFrom=(value,c)=>Object.hasOwn(BRIDGES,c.id)?value.daily.bridges[c.id]:value.lessons[c.id];
 for(const c of[...cases,...associated,...practice])assert.equal(hash(taskFor(c)),c.taskHash);
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(path.join(root,file))),sha,file);
 const artifactPaths=new Set(),uniqueFile=name=>{assert.ok(!artifactPaths.has(name),'one immutable raw artifact: '+name);artifactPaths.add(name);return path.join(out,name);};
 fs.writeFileSync(uniqueFile('fixed-source-cases.json'),JSON.stringify(fixture,null,2));fs.writeFileSync(uniqueFile('fixed-navigation.json'),JSON.stringify(navigationFixture,null,2));
 let browser,server,activePage,label='setup';const openContexts=new Set(),diagnostics=new Map();
 const proofSummaries=new WeakMap();
 const compact=(value,preserveModels=false)=>compactUnitcoverReport(value,{preserveModels,proofSummaries});
 const report=()=>({provenance,viewports,checks,errors,remote,
  observations:compact(observations),isolated:compact(isolated),boundaries:compact(boundaries),forgeries:compact(forgeries,true),
  backups:compact(backups),offline:compact(offline),preparations:compact(preparations),retries:compact(retries),navigations:compact(navigations),
  checkedLedger:compact(checkedLedger),captures:compact(captures),visuals:compact(visuals),capacity:compact(capacity),
  nativeTasks:6,nativeNodes:3,associatedTasks:5,practiceCompatibilityPositions:3,targets:11,sessions:7,childTrial:false,independentTeachingReview:false});
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});provenance.browserVersion=browser.version();
  for(const[width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
   server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   const profiles=[];
   for(const role of['source','native-restore-target','constructed-compatibility',...unitcoverCapacityModes().map(m=>'constructed-cap-'+m.id)]){
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
    if(t.type==='x-m28-units'){
     if(before.history.length<2000){assert.equal(after.history.length,before.history.length+1);assert.deepEqual(after.history.slice(0,-1),before.history);assert.equal(after.history.at(-1).a,name.replace(/^m28-/,''));}
     else assert.deepEqual(after,before,'original capped actions leave the entire model unchanged');
    }
    return after;
   };
   const solve=async c=>{for(const step of unitcoverOperationPlan(c,await model(c)))step.field?await field(c,step.field,step.value):await action(c,step.action,step.data);};
   const visual=async(c,phase)=>{
    const task=taskFor(c),m=await model(c),board=page.locator('.m28-world svg');assert.equal(await board.count(),1);await board.scrollIntoViewIfNeeded();assert.equal(await board.isVisible(),true);
    const box=await board.boundingBox();assert.ok(box&&box.width>150&&box.height>50);
    const displayed=await board.evaluate(el=>({viewBox:el.getAttribute('viewBox'),label:el.getAttribute('aria-label'),
     rectangles:[...el.querySelectorAll('rect')].map(node=>{const box=node.getBoundingClientRect();return{x:Number(node.getAttribute('x')),y:Number(node.getAttribute('y')),width:Number(node.getAttribute('width')),height:Number(node.getAttribute('height')),fill:node.getAttribute('fill'),visibleWidth:box.width,visibleHeight:box.height};}),
     lines:[...el.querySelectorAll('line')].map(node=>({x1:Number(node.getAttribute('x1')),x2:Number(node.getAttribute('x2')),y1:Number(node.getAttribute('y1')),y2:Number(node.getAttribute('y2'))}))}));
    const cell=Math.min(48,540/task.length);assert.equal(displayed.viewBox,'0 0 760 220');assert.equal(displayed.rectangles.length,m.board.positions.length+1);
    assert.deepEqual([displayed.rectangles[0].x,displayed.rectangles[0].y,displayed.rectangles[0].width,displayed.rectangles[0].height],[105,60,task.length*cell,35]);
    for(const[i,start]of m.board.positions.entries()){const r=displayed.rectangles[i+1];assert.deepEqual([r.x,r.y,r.width,r.height],[105+start*cell,128,task.size*cell,38]);}
    assert.ok(displayed.rectangles.every(r=>r.visibleWidth>0&&r.visibleHeight>0),'each actual object/unit rectangle has positive visible area');assert.equal(displayed.lines.length,task.length+1);
    for(const[i,line]of displayed.lines.entries())assert.deepEqual(line,{x1:105+i*cell,x2:105+i*cell,y1:117,y2:175});
    assert.ok((await page.locator('.m28-controls').innerText()).includes(`已放 ${m.board.positions.length} 块`),'the original displayed count is identified as tool-provided');
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
     assert.ok(words.includes('网格、每块长度和“已放”块数由工具提供')&&words.includes('每个小格只盖一次'));assert.doesNotMatch(words,/MP\.\d/);assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);
     assert.ok(words.includes(`当前 ${proof.construction.count} 个“${proof.construction.unit}”`));
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
      const checked=await check(previous,true,false,'navigation-prerequisite-'+at,'prerequisite');preparations.push({width,height,...prep,checked,strictUnitcoverCoverage:false});
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
     const moduleNames=[...new Set(['storage.js','v2.html','learn.html','exploration.js','exploration-core.js','data/atlas.json','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/unitcover-evidence.js','learning/p3-workflow.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','vendor/three/three.module.min.js','vendor/three/OrbitControls.js',...sourceFiles.filter(file=>file.startsWith('dist/')).map(file=>file.slice(5))])];
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
    label=prefix+'-'+c.id+'-'+c.index+'-boundary-'+kind;await retry(c,'boundary-'+kind,'boundary');await capture(c,'boundary-retry',false,{role:'boundary'});const images=[];let persisted,beforeBlock;
    const phases=await unitcoverBoundaryFlow(kind,c,{...api(c,'boundary'),
     overlongText:async(key,value)=>{persisted=await read(page);beforeBlock=await current(c);const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.getAttribute('maxlength'),null);await control.fill(value);
      assert.equal(await page.locator('#storage-warning').isVisible(),true);assert.ok((await page.locator('#storage-warning').innerText()).includes('已停止覆盖原记录'));assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);images.push(await shot('1201-blocked'));
     },
     blockedAction:async name=>{const control=page.locator({check:'#actions [data-do="check"]',clear:'[data-x="m28-clear"]',retry:'[data-do="p3-retry"]'}[name]);assert.equal(await control.count(),1);await reveal(control);await control.click();assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);},
     reloadBlocked:async()=>{await reload(c);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.deepEqual((await current(c)).model,beforeBlock.model);images.push(await shot('1200-reloaded'));}
    });
    await reload(c);assert.deepEqual(await model(c),phases.at(-1).model);assert.equal(await hint.isVisible(),true);
    const rendered=await visual(c,'final'),screenshot=await shot('boundary');boundaries.push({width,height,kind,id:c.id,index:c.index,phases,images,rendered,screenshot,constructedCompatibilityFixture:false});
   };
   const runNative=async c=>{
    label=prefix+'-'+c.id+'-'+c.index;await open(c);assert.equal(binding(taskFor(c),ctx(c))?.nodeId,c.nodeId);
    assert.equal(await guide.isVisible(),true);assert.equal(await guide.evaluate(e=>e.open),false);assert.equal(await hint.count(),0);const before=await current(c),images={initial:await visual(c,'initial')};
    await guide.locator(':scope > summary').click();assert.equal(await guide.locator('p').isVisible(),true);
    await page.waitForFunction(async({id,index})=>{const{readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;},c);
    await guide.locator(':scope > summary').click();const supported=await current(c);assert.deepEqual(supported.model,before.model);assert.equal(supported.record.attempts.length,0);
    const phases=await unitcoverNativeFlow(c,{...api(c,'native'),checkpoint:async(stage,items)=>{
     if(['overlap','removed'].includes(stage))images[stage]=await visual(c,stage);
     if(stage==='correct-unsubmitted')assert.equal(await hint.count(),0);
     if(stage==='corrected'){images.corrected=await visual(c,'corrected');await shot('corrected');await reload(c);assert.equal(await hint.isVisible(),true);assert.deepEqual(await model(c),items.at(-1).model);assert.notEqual(images.corrected.sha256,images.initial.sha256);}
     if(['clear','shared-retry'].includes(stage)){await reload(c);assert.equal(await hint.count(),0);images[stage]=await visual(c,stage);}
     if(stage==='final'){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);images.final=await visual(c,'retry-corrected');}
    }});
    const final=phases.at(-1),actual=phases.filter(x=>x.checked);assert.equal(actual.length,17+(c.task.size===2?1:0));assert.equal(phases.length,23+(c.task.size===2?1:0));assert.deepEqual(final.record.attempts,actual.map(x=>x.attempt));
    for(const kind of['extra-root','extra-event','false-issue','hidden-offset','hidden-estimate','hidden-error','noncanonical-index','foreign-action']){
     const forged=cp(final.model),task=taskFor(c);
     if(kind==='extra-root')forged.unrecorded=1;else if(kind==='extra-event')forged.history[0].unrecorded=1;else if(kind==='false-issue')forged.issue='not the recorded issue';
     else if(kind==='hidden-offset')forged.offset='0';else if(kind==='hidden-estimate')forged.estimate='1';else if(kind==='hidden-error')forged.error='1';else if(kind==='noncanonical-index')forged.history[0].d.index='00';else M.act(task,forged,'m28-help');
     assert.equal(replay(task,forged),null);forgeries.push({width,height,id:c.id,index:c.index,kind,counterfactual:true,actualBrowserAction:false,model:forged,originalValid:M.valid(task,forged),strict:false});
    }
    observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,taskHash:c.taskHash,phases,images});for(const kind of unitcoverBoundaryKindsFor(c))await runBoundary(c,kind);
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
   assert.equal(sourceRows.length,128);assert.equal(sourceCaptures.length,184);const positions=[...new Set(sourceRows.map(x=>x.id+':'+x.index))];assert.equal(positions.length,15);
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
   assert.ok((await importFile(restorePage,actual.payload,'unitcover-identical-repeat-v2.json')).includes('备份已合并'));const repeated=await read(restorePage);assert.equal(repeated.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),actual.backup.state);
   const repeatedImportStorage=storageOnly(await rawSnapshot('repeated-import',restorePage));provenance.nativeBackupImportsCompleted++;
   assert.ok(!(await importFile(restorePage,'{','unitcover-corrupt-native.json')).includes('备份已合并'));assert.equal((await read(restorePage)).raw,imported.raw);
   const corruptImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected',restorePage));provenance.corruptImportsRejected++;
   const last=cases.at(-1);await navigate(last,restorePage);assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredReload=await restorePage.reload();assert.equal(restoredReload?.fromServiceWorker(),true);await wait(last,restorePage);keepRecords(actual.backup.state,originalState(await state(restorePage)));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredStorage=storageOnly(await rawSnapshot('restored-lesson',restorePage)),restoredScreenshot=await shot('restored',restorePage);
   backups.push({width,height,kind:'actual-browser-v2',backupFile:actual.file,bytes:actual.bytes,backupSha256:actual.sha256,originalState:actual.backup.state,
    emptyBeforeImport,firstImportStorage,repeatedImportStorage,corruptImportStorage,restoredStorage,exportedScreenshot,restoredScreenshot,sourceCaptureMap,
    independentEmptyContext:true,originStopped:!server.listening,wholeStateFirstImportExact:true,repeatByteIdempotent:true,corruptRejectedWithoutWrite:true,checked:128,currentModelCaptures:184,positions:15});

   // Old practice positions have no dedicated current practice page. This
   // third independent context receives explicitly constructed compatibility
   // data, never a fabricated native attempt or a seed into the source route.
   contextRole='constructed-compatibility';page=compatibilityProfile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-constructed-practice-compatibility';
   const legacyState=Core.fresh();
   for(const c of practice){const t=taskFor(c),m=Tasks.defaultModel(t);for(const step of unitcoverOperationPlan(c,m))if(step.field){setField(m,step.field,String(step.value));M.field(t,m,step.field);}else M.act(t,m,step.action,step.data||{});
    assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);assert.ok(replay(t,m));assert.equal(binding(t,ctx(c)),null);const a=legacyState.lessons[c.id]??=State.freshLesson(c.id);a.models[-1]=m;assert.deepEqual(a.cases,{});}
   originalState(legacyState);const legacyPayload=JSON.stringify(Core.backup(legacyState)),legacyFile=label+'-v2.json';fs.writeFileSync(uniqueFile(legacyFile),legacyPayload);
   const legacyResponse=await page.reload();assert.equal(legacyResponse?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
   const emptyLegacy=originalState(await state());assert.deepEqual(emptyLegacy.lessons,{});assert.deepEqual(emptyLegacy.daily.bridges,{});const legacyEmptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
   assert.ok((await importFile(page,legacyPayload,legacyFile)).includes('备份已合并'));const legacyImported=await read(page);assert.deepEqual(originalState(JSON.parse(legacyImported.text)),legacyState);
   const legacyImportStorage=storageOnly(await rawSnapshot('imported-original-practice'));provenance.compatibilityImportsCompleted++;
   assert.ok(!(await importFile(page,'{','unitcover-corrupt-practice.json')).includes('备份已合并'));assert.equal((await read(page)).raw,legacyImported.raw);
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
   for(const mode of unitcoverCapacityModes()){
    const profile=profiles.find(p=>p.role==='constructed-cap-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');
    label=prefix+'-constructed-cap-'+mode.id;const c=cases[0],task=taskFor(c),fixture=constructUnitcoverCapacityFixture(c,mode,{Tasks,State,Core,Engine,setField,task});
    originalState(fixture.state);assert.equal(fixture.state.lessons[c.id].models[c.index].history.length,2000);
    const fixturePayload=JSON.stringify(Core.backup(fixture.state)),fixtureFile=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(fixtureFile),fixturePayload);
    const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
    const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
    assert.ok((await importFile(page,fixturePayload,fixtureFile)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;
    const importedStorage=storageOnly(await rawSnapshot('imported-fixture'));
    assert.ok((await importFile(page,fixturePayload,'unitcover-identical-'+mode.id+'-v2.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;
    const repeatedStorage=storageOnly(await rawSnapshot('repeated-fixture'));
    const invalid=cp(fixture.state);invalid.lessons[c.id].models[c.index].history.push(cp(invalid.lessons[c.id].models[c.index].history.at(-1)));assert.equal(invalid.lessons[c.id].models[c.index].history.length,2001);assert.equal(M.valid(task,invalid.lessons[c.id].models[c.index]),false);
    const invalidPayload=JSON.stringify({...Core.backup(fixture.state),state:invalid});
    assert.ok(!(await importFile(page,invalidPayload,'unitcover-invalid-2001-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;
    const rejectedImportStorage=storageOnly(await rawSnapshot('invalid-2001-import-rejected'));await navigate(c);
    const actionMetadata=[];
    const phases=await unitcoverCapacityFlow(mode,c,{...api(c,'capacity'),
     assertRetryAvailable:async expected=>assert.equal(await page.locator('[data-do="p3-retry"]').count(),expected?1:0,'zero-attempt fixture does not invent a retry button'),
     cappedAction:async name=>{const before=await current(c),raw=await read(page);await action(c,'m28-'+name,name==='place'?{index:'0'}:{});const after=await current(c),changed=await read(page);assert.deepEqual(after.model,before.model);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.deepEqual(after.record?.attempts||[],before.record?.attempts||[]);
      if(before.model.board.bad||before.model.issue)assert.equal(after.record.support,true);
      assert.notEqual(after.lesson.updatedAt,before.lesson.updatedAt,'the original successful update still writes its timestamp');assert.notEqual(changed.raw,raw.raw,'a model noop is not a raw-storage no-write');
      actionMetadata.push({name,beforeUpdatedAt:before.lesson.updatedAt,afterUpdatedAt:after.lesson.updatedAt,beforeSupport:before.record?.support??null,afterSupport:after.record?.support??null,modelUnchanged:true,rawChanged:true,attemptsUnchanged:true});
     }
    });
    const rendered=await visual(c,'after-capacity-retry'),screenshot=await shot('recovered'),final=await downloadBackup('recovered-v2'),rows=captures.filter(x=>x.width===width&&x.contextRole===contextRole),captureMap=mapCaptures(rows,final.backup.state);
    const currentLesson=lessonFrom(final.backup.state,c);assert.deepEqual(currentLesson.notes,fixture.state.lessons[c.id].notes);assert.equal(currentLesson.draft,fixture.state.lessons[c.id].draft);
    assert.equal(currentLesson.cases[c.index].attempts.length,fixture.constructedSubmissions+5);assert.deepEqual(currentLesson.cases[c.index].attempts.slice(0,mode.prior),fixture.state.lessons[c.id].cases[c.index]?.attempts||[]);
    const item={width,height,mode,id:c.id,index:c.index,contextRole,constructedCompatibilityFixture:true,constructedSubmissions:fixture.constructedSubmissions,
     fixtureFile,fixtureSHA256:digest(fixturePayload),emptyStorage,importedStorage,repeatedStorage,rejectedImportStorage,phases,captureMap,actionMetadata,rendered,screenshot,
     actualUIChecksAfterImport:5,actualSharedRetries:1,wholeModelUnchangedByCappedAction:true,controllerMetadataStillWritten:true,documentReloadRequiredForCap:false,
     zeroAttemptNeedsCheckBeforeRetry:mode.prior===0,nativeHandEnteredHistory:false,backupFile:final.file,backupSha256:final.sha256,originalState:final.backup.state};
    capacity.push(item);backups.push({...item,kind:'constructed-capacity-final-v2'});
   }
   for(const profile of profiles){await profile.context.close();openContexts.delete(profile.context);}activePage=null;
  }
  assert.equal(errors.length,0);assert.equal(remote.length,0);assert.equal(observations.length,12);assert.equal(forgeries.length,96);assert.equal(preparations.length,8);assert.equal(navigations.length,16);
  assert.equal(isolated.filter(x=>x.kind==='associated').length,10);assert.equal(isolated.filter(x=>x.kind==='old-practice-compatibility').length,6);assert.equal(boundaries.length,8);assert.equal(capacity.length,12);
  const nativeChecked=checkedLedger.filter(x=>x.contextRole==='source'),nativeCaptures=captures.filter(x=>x.contextRole==='source'),capacityChecked=checkedLedger.filter(x=>x.role==='capacity'),capacityCaptures=captures.filter(x=>x.role==='capacity');
  assert.equal(nativeChecked.length,256);assert.equal(nativeCaptures.length,368);assert.equal(capacityChecked.length,60);assert.equal(capacityCaptures.length,168);
  assert.equal(checkedLedger.length,316);assert.equal(captures.length,536);assert.equal(retries.filter(x=>x.contextRole==='source').length,22);assert.equal(retries.length,34);
  assert.ok(nativeChecked.every(x=>!x.constructedCompatibilityFixture));assert.ok(capacityChecked.every(x=>x.constructedCompatibilityFixture));
  assert.equal(backups.filter(x=>x.kind==='actual-browser-v2').length,2);assert.equal(backups.filter(x=>x.kind==='constructed-practice-final-v2').length,2);assert.equal(backups.filter(x=>x.kind==='constructed-capacity-final-v2').length,12);
  assert.equal(provenance.nativeBackupImportsCompleted,4);assert.equal(provenance.compatibilityImportsCompleted,26);assert.equal(provenance.corruptImportsRejected,16);
  const attemptCounts=Object.fromEntries(['native','boundary','associated','prerequisite','capacity'].map(role=>[role,checkedLedger.filter(x=>x.role===role).length]));
  assert.deepEqual(attemptCounts,{native:210,boundary:28,associated:10,prerequisite:8,capacity:60});
  const checkedPaths=checkedLedger.flatMap(x=>[x.storage.raw,x.storage.state]),capturePaths=captures.flatMap(x=>[x.storage.raw,x.storage.state]);assert.equal(new Set(checkedPaths).size,632);assert.equal(new Set(capturePaths).size,1072);
  fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(provenance,null,2));
  const resultsText=JSON.stringify({...report(),attemptCounts,uniqueCheckedFiles:632,uniqueCaptureFiles:1072,originStopped:offline.every(x=>x.originStopped)},null,2);
  assert.ok(Buffer.byteLength(resultsText,'utf8')<64*1024*1024,'results index must stay bounded; raw evidence remains in separate files');
  fs.writeFileSync(path.join(out,'results.json'),resultsText);
  console.log('P9_UNITCOVER_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:6,taskViewportPairs:12,sourceChecked:256,compatibilityChecked:60,checked:316,sourceCaptures:368,compatibilityCaptures:168,captures:536,oldPractice:6,sourceRetries:22,compatibilityRetries:12,next:16,forgeries:96,nativeBackups:2,compatibilityBackups:14,visuals:visuals.length}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(reason=>({diagnosticError:String(reason)})):null;
  if(activePage){await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.html'),await activePage.content().catch(()=>''));}
  // Preserve the original failure even if a results index becomes too large.
  // Never re-serialize the same in-memory graph in the catch path.
  const failure={schema:'p9-unitcover-browser-failure/1',provenance,at:label,error:String(error),stack:error.stack||null,diagnosticFile,
   counts:{checks:checks.length,observations:observations.length,isolated:isolated.length,boundaries:boundaries.length,
    forgeries:forgeries.length,backups:backups.length,preparations:preparations.length,retries:retries.length,
    navigations:navigations.length,checked:checkedLedger.length,captures:captures.length,visuals:visuals.length,capacity:capacity.length},
   evidenceFiles:fs.readdirSync(out).sort()};
  try{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(failure,null,2));}
  catch(writeError){console.error('Unable to preserve compact failure index:',writeError.stack||String(writeError));}
  console.error('P9_UNITCOVER_ADAPTER_BROWSER_FAILED:',error.stack||String(error));process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const context of openContexts)await context.close();if(browser)await browser.close();
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
