// Visible source plans shared with the original-controller Node regression.
// Importing this module does not launch Chromium or seed ordinary source work.
const fixture=require('./fixtures/p9-scale-cases.cjs');
const navigationFixture=require('./fixtures/p9-scale-navigation.cjs');
function orderedScaleTargets(){const all=[...fixture.cases,...fixture.associated];return[...new Set(all.map(c=>c.id))].flatMap(id=>all.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));}
function scaleOperationPlan(spec,_model,{raw,record=true}={}){
 const out=[{field:'measure',value:String(raw??spec.math.raw)},{field:'unit',value:spec.task.unit}];
 if(record)out.push({action:'m28-record'});if(spec.math.answer)out.push({field:'answers.0',value:spec.math.answer});return out;
}
const scaleNearRaw=spec=>spec.math.raw+(spec.math.raw.includes('.')?'':'.')+'00000001';
async function saveScale(api,raw){await api.field('measure',String(raw));await api.action('m28-record');}
const scaleNativeCheckCount=spec=>16+3*spec.task.questions.length;
const scaleNativeCaptureCount=spec=>22+4*spec.task.questions.length;
async function scaleNativeFlow(spec,api){
 const{field,action,solve,model,check,capture,retry,checkpoint,assert}=api,t=spec.task,raw=spec.math.raw,phases=[await capture('initial',false)];
 await field('unit',t.unit);await saveScale(api,'');phases.push(await check(false,false,'blank-first-record'));assert((await model()).board.first.measure===undefined,'blank failure does not become first finite reading');
 await saveScale(api,String(Number(raw)+1));phases.push(await check(false,false,'first-wrong-reading'));await solve();phases.push(await capture('correct-unsubmitted',false));await checkpoint('correct-unsubmitted',phases);
 phases.push(await check(true,true,'corrected'));await checkpoint('corrected',phases);assert(phases.at(-1).proof.construction.firstMeasure.raw===String(Number(raw)+1)&&phases.at(-1).proof.construction.hadOriginalBad,'first wrong reading remains');phases.push(await check(true,true,'repeated-check'));
 await field('measure',' '+raw+' ');phases.push(await capture('equivalent-current-unsubmitted',false));phases.push(await check(false,false,'equivalent-spelling-not-saved'));await action('m28-record');phases.push(await check(true,true,'equivalent-spelling-resaved'));
 await saveScale(api,scaleNearRaw(spec));phases.push(await check(true,false,'original-near-reading'));await field('measure',raw);phases.push(await check(false,false,'exact-current-near-saved'));await action('m28-record');phases.push(await check(true,true,'near-reading-resaved-exactly'));
 await field('unit',t.unit==='g'?'kg':'g');await action('m28-record');phases.push(await check(false,false,'wrong-unit-record'));await field('unit',t.unit);phases.push(await check(false,false,'unit-corrected-without-record'));await action('m28-record');phases.push(await check(true,true,'unit-really-resaved'));
 const saved=JSON.stringify((await model()).board.saved);await saveScale(api,'');phases.push(await check(false,false,'failed-blank-keeps-save'));assert(JSON.stringify((await model()).board.saved)===saved,'blank failure retains the original saved pair');await field('measure',raw);phases.push(await capture('saved-raw-restored-unsubmitted',false));phases.push(await check(true,true,'old-save-with-real-terminal-issue'));assert(!!phases.at(-1).proof.issue,'terminal issue remains');await checkpoint('terminal-issue',phases);
 if(spec.math.answer){const history=JSON.stringify((await model()).history);await field('answers.0','128');phases.push(await check(false,false,'wrong-current-mm-answer'));await field('answers.0','127.00000001');phases.push(await check(true,false,'near-current-mm-answer'));await field('answers.0','127.0');phases.push(await capture('exact-mm-answer-unsubmitted',false));phases.push(await check(true,true,'exact-mm-current-field-rechecked'));assert(JSON.stringify((await model()).history)===history,'current answer edits are not fabricated record events');}
 await field('prose','我保留这次读数与单位；原话待确认。');phases.push(await capture('prose-unsubmitted',false));phases.push(await check(true,true,'prose-rechecked'));
 await retry('native');phases.push(await capture('shared-retry',false));await checkpoint('shared-retry',phases);await solve();phases.push(await check(true,true,'retry-corrected'));await checkpoint('final',phases);return phases;
}
function scaleBoundaryKindsFor(spec){return({'readscales:0':['first-underflow-and-spellings'],'readscales:2':['negative-first-reading'],'readscales:3':['literal-exact-forms'],'readscales:4':['first-near-and-digital'],'measurecalc:1':['question-before-save']})[spec.id+':'+spec.index]||[];}
async function scaleBoundaryFlow(kind,spec,api){
 const{field,action,solve,model,check,capture,assert}=api,phases=[],t=spec.task;
 if(kind==='first-underflow-and-spellings'){
  await solve({raw:'500 1/'+(10n**400n).toString()});phases.push(await check(true,false,'first-underflow-original-success'));assert((await model()).board.bad===false,'original near-good remains distinct from exact');
  await field('measure','500');phases.push(await capture('underflow-exact-current-unsubmitted',false));await action('m28-record');phases.push(await check(true,true,'underflow-really-resaved'));
  for(const[label,raw]of[['fraction','1000/2'],['mixed','499 2/2'],['1200-reading','0'.repeat(1197)+'500']]){await saveScale(api,raw);phases.push(await check(true,true,'exact-'+label));}
  await field('prose','文'.repeat(1200));phases.push(await check(true,true,'1200-prose-recorded'));await saveScale(api,'+500');phases.push(await check(false,false,'invalid-plus-is-retained'));await saveScale(api,'500');phases.push(await check(true,true,'after-invalid-plus'));
 }else if(kind==='first-near-and-digital'){
  await solve({raw:'86.400000000000000000001'});phases.push(await check(true,false,'first-rounded-digital-reading'));assert((await model()).board.bad===false,'rounded original green not rewritten');await saveScale(api,'86.4');phases.push(await check(true,true,'digital-exact-resave'));
  await field('unit','g');await action('m28-record');phases.push(await check(false,false,'digital-wrong-unit'));await field('unit',t.unit);await action('m28-record');phases.push(await check(true,true,'digital-unit-corrected'));
  await saveScale(api,'126.4');phases.push(await check(false,false,'minutes-not-decimal-seconds'));await saveScale(api,'432/5');phases.push(await check(true,true,'digital-rational-reading'));
 }else if(kind==='question-before-save'){
  await field('answers.0','127');await solve();phases.push(await check(true,true,'question-filled-before-record'));const history=JSON.stringify((await model()).history);
  await field('answers.0','128');phases.push(await check(false,false,'wrong-question-current'));await field('answers.0','254/2');phases.push(await check(true,true,'question-equivalent-without-record'));await field('answers.0','0'.repeat(1197)+'127');phases.push(await check(true,true,'1200-current-question'));assert(JSON.stringify((await model()).history)===history,'follow-up has no edit timestamp or record event');
 }else if(kind==='negative-first-reading'){
  await solve({raw:'-23'});phases.push(await check(false,false,'negative-first'));await saveScale(api,'23');phases.push(await check(true,true,'negative-first-corrected'));assert(phases.at(-1).proof.construction.firstMeasure.raw==='-23','negative original first is retained');
 }else if(kind==='literal-exact-forms'){
  for(const[label,raw]of[['fraction','127/10'],['mixed','12 7/10'],['decimal',' 012.700 ']]){await solve({raw});phases.push(await check(true,true,'ruler-'+label));}
 }else throw Error('Unknown scale boundary '+kind);return phases;
}
function scaleCapacityModes(){return[
 {id:'analog-clean-0',source:'readscales',index:0,kind:'clean',prior:0},{id:'analog-bad-1',source:'readscales',index:0,kind:'bad',prior:1},{id:'analog-issue-1',source:'readscales',index:0,kind:'issue',prior:1},{id:'analog-unsaved-0',source:'readscales',index:0,kind:'unsaved',prior:0},
 {id:'digital-clean-0',source:'readscales',index:4,kind:'clean',prior:0},{id:'digital-bad-1',source:'readscales',index:4,kind:'bad',prior:1},{id:'digital-issue-1',source:'readscales',index:4,kind:'issue',prior:1},{id:'digital-unsaved-0',source:'readscales',index:4,kind:'unsaved',prior:0},
 {id:'question-clean-0',source:'measurecalc',index:1,kind:'clean',prior:0},{id:'question-issue-1',source:'measurecalc',index:1,kind:'issue',prior:1}
];}
const scaleModeSpec=mode=>fixture.cases.find(c=>c.id===mode.source&&c.index===mode.index)||navigationFixture.navigation.find(c=>c.id===mode.source&&c.index===mode.index);
const scaleCappedData=()=>({}),scaleVisibleActions=()=>['record'],scaleCapacityGood=mode=>mode.kind!=='unsaved';
const scaleCapacityCheckCount=(_mode,spec)=>7+2*spec.task.questions.length;
function constructScaleCapacityFixture(spec,mode,{State,Core,Engine,setField,task}){
 if(!scaleCapacityModes().some(x=>JSON.stringify(x)===JSON.stringify(mode)))throw Error('Unknown cap mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);lesson.index=spec.index;state.lessons[spec.id]=lesson;const m=State.modelForLesson(lesson),apply=s=>{if(s.field){setField(m,s.field,s.value);Engine.fieldExtra(task,m,s.field);}else Engine.actExtra(task,m,s.action,s.data||{});};
 if(mode.kind==='bad')for(const s of scaleOperationPlan(spec,m,{raw:String(Number(spec.math.raw)+1)}))apply(s);
 for(const s of scaleOperationPlan(spec,m,{record:mode.kind!=='unsaved'}))apply(s);
 if(mode.kind==='unsaved')apply({field:'measure',value:''});
 while(m.history.length<(mode.kind==='issue'?1999:2000))apply({action:'m28-record'});
 if(mode.kind==='issue'){apply({field:'measure',value:''});apply({action:'m28-record'});}
 if(['issue','unsaved'].includes(mode.kind))apply({field:'measure',value:spec.math.raw});
 if(mode.prior)State.submitLesson(lesson);State.addLessonNote(lesson,'明确构造的刻度读数历史兼容记录。');lesson.draft='保留上限前的原草稿。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index};
}
async function scaleCapacityFlow(mode,spec,api){
 const good=scaleCapacityGood(mode),t=spec.task,phases=[await api.capture('at-valid-2000-before-check',!!mode.prior&&good)];await api.assertRetryAvailable(!!mode.prior);
 await api.cappedAction('record');phases.push(await api.capture('2000-record-model-noop',!!mode.prior&&good));phases.push(await api.check(good,good,'at-capacity-checked'));
 await api.field('measure',' '+spec.math.raw);await api.cappedAction('record');phases.push(await api.capture('capped-record-keeps-original-raw-pair',false));phases.push(await api.check(false,false,'equivalent-unsaved-at-capacity'));
 await api.field('measure',spec.math.raw);phases.push(await api.capture('saved-spelling-restored-unsubmitted',false));phases.push(await api.check(good,good,'saved-spelling-restored-rechecked'));
 await api.field('unit',t.unit==='g'?'kg':'g');await api.cappedAction('record');phases.push(await api.capture('capped-record-keeps-original-unit',false));phases.push(await api.check(false,false,'wrong-unit-at-capacity'));
 await api.field('unit',t.unit);phases.push(await api.capture('saved-unit-restored-unsubmitted',false));phases.push(await api.check(good,good,'saved-unit-restored-rechecked'));
 if(spec.math.answer){await api.field('answers.0','128');phases.push(await api.check(false,false,'wrong-answer-at-capacity'));await api.field('answers.0',spec.math.answer);phases.push(await api.capture('answer-restored-unsubmitted',false));phases.push(await api.check(good,good,'answer-restored-rechecked'));}
 await api.field('prose','达到上限后保留的当前原话。');phases.push(await api.capture('capacity-prose-unsubmitted',false));phases.push(await api.check(good,good,'capacity-prose-rechecked'));
 await api.reloadCap();phases.push(await api.capture('cap-restored-after-reload',good));await api.retry('capacity-'+mode.id);phases.push(await api.capture('shared-retry-after-capacity',false));await api.solve();phases.push(await api.check(true,true,'capacity-retry-corrected'));return phases;
}
function scaleTextModes(){return[
 {id:'text-analog-measure-0',source:'readscales',index:0,field:'measure',prior:0},{id:'text-digital-measure-1',source:'readscales',index:4,field:'measure',prior:1},
 {id:'text-analog-prose-0',source:'readscales',index:2,field:'prose',prior:0},{id:'text-digital-prose-1',source:'readscales',index:4,field:'prose',prior:1},
 {id:'text-question-0',source:'measurecalc',index:1,field:'answers.0',prior:0},{id:'text-question-1',source:'measurecalc',index:1,field:'answers.0',prior:1}
];}
const scaleModelField=(model,key)=>key.includes('.')?model[key.split('.')[0]][Number(key.split('.')[1])]:model[key];
function constructScaleTextFixture(spec,mode,{State,Core,Engine,setField,task}){
 if(!scaleTextModes().some(x=>JSON.stringify(x)===JSON.stringify(mode)))throw Error('Unknown text mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);lesson.index=spec.index;state.lessons[spec.id]=lesson;const m=State.modelForLesson(lesson),apply=s=>{if(s.field){setField(m,s.field,s.value);Engine.fieldExtra(task,m,s.field);}else Engine.actExtra(task,m,s.action,s.data||{});};
 for(const s of scaleOperationPlan(spec,m))apply(s);const short=mode.field==='prose'?'文':String(scaleModelField(m,mode.field)),raw=mode.field==='prose'?'文'.repeat(1200):'0'.repeat(1200-short.length)+short;
 apply({field:mode.field,value:raw});if(mode.field==='measure')apply({action:'m28-record'});if(mode.prior)State.submitLesson(lesson);State.addLessonNote(lesson,'明确构造的刻度文字边界记录。');lesson.draft='1201写入之前的原草稿。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index};
}
async function scaleTextFlow(mode,spec,api){
 const strict=!!mode.prior,phases=[await api.capture('1200-before-block',strict)];await api.assertRetryAvailable(strict);await api.overlongText(mode.field,scaleModelField(await api.model(),mode.field)+'1');phases.push(await api.capture('1201-text-write-blocked',strict));
 for(const name of['check','record',...(mode.prior?['retry']:[])]){await api.blockedAction(name);phases.push(await api.capture('blocked-visible-'+name,strict));}
 await api.blockedField('prose','写入已停止');phases.push(await api.capture('blocked-visible-text-field',strict));await api.reloadBlocked();phases.push(await api.capture('1200-restored-after-reload',strict));
 if(!mode.prior)phases.push(await api.check(true,true,'zero-attempt-real-check-before-retry'));await api.retry('text-'+mode.id);phases.push(await api.capture('retry-after-text-block',false));await api.solve();phases.push(await api.check(true,true,'text-retry-corrected'));return phases;
}
function scaleLegacyModes(){return[
 {id:'practice-weight-pending-0',source:'weightstart',index:0,kind:'practice',prior:0,copy:false},{id:'practice-weight-pending-2',source:'weightstart',index:2,kind:'practice',prior:2,copy:true},
 {id:'practice-read-pending-0',source:'readscales',index:0,kind:'practice',prior:0,copy:false},{id:'practice-read-pending-4',source:'readscales',index:4,kind:'practice',prior:4,copy:true},
 {id:'numeric-analog',source:'readscales',index:0,kind:'numeric',prior:1},{id:'numeric-digital',source:'readscales',index:4,kind:'numeric',prior:1}
];}
function constructScaleLegacyFixture(spec,mode,{State,Core,Engine,setField,task}){
 if(!scaleLegacyModes().some(x=>JSON.stringify(x)===JSON.stringify(mode)))throw Error('Unknown legacy mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);state.lessons[spec.id]=lesson;
 const fill=(c,m,options)=>{for(const step of c.steps||scaleOperationPlan(c,m,options))if(step.field){setField(m,step.field,step.value);Engine.fieldExtra(c.task,m,step.field);}else Engine.actExtra(c.task,m,step.action,step.data||{});};
 if(mode.kind==='practice'){
  for(let index=0;index<mode.prior;index++){const c=fixture.cases.find(x=>x.id===spec.id&&x.index===index)||navigationFixture.navigation.find(x=>x.id===spec.id&&x.index===index);lesson.index=index;const m=State.modelForLesson(lesson);fill(c,m);State.submitLesson(lesson);}
  const c=fixture.practice.find(c=>c.id===spec.id);lesson.view='play';const m=State.modelForLesson(lesson);fill(c,m);
 }else{
  lesson.index=spec.index;const m=State.modelForLesson(lesson),[n,d='1']=spec.math.expected.split('/'),positive='0 '+n+'/'+d,negative='-0 '+n+'/'+d;fill(spec,m,{raw:positive});
  const legacy=JSON.parse(JSON.stringify(m,(_key,value)=>value===positive?negative:value));lesson.models[spec.index]=legacy;lesson.cases[spec.index]={support:true,attempts:[{id:'scale-legacy-'+mode.id,at:'2026-11-16T00:00:00.000Z',value:structuredClone(legacy),supported:true,exposed:false}]};
 }
 State.addLessonNote(lesson,'明确构造的刻度读数兼容记录；旧作品和旧提交分别保留。');lesson.draft='兼容记录中的原草稿。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index};
}

// A complete cap proof is intentionally large. Archive each full capture once;
// every occurrence in the report retains an explicit, hashed reference to it.
// The original in-memory rows, raw/State files and all validation stay intact.
function writeScaleReport(outputDirectory,value){
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 assert.ok(Array.isArray(value.captures));const references=new WeakMap(),entries=[],states=[],records=[];
 fs.mkdirSync(path.join(outputDirectory,'captures'),{recursive:true});
 for(const [index,capture]of value.captures.entries()){
  assert.ok(capture&&typeof capture==='object'&&!references.has(capture),'each captured snapshot is registered once');
  const captureId='capture-'+String(index+1).padStart(6,'0'),file='captures/'+captureId+'.json',body=Buffer.from(JSON.stringify(capture,null,2)+'\n');
  const filename=path.join(outputDirectory,file),reference={captureId,file,sha256:digest(body),bytes:body.length};
  if(fs.existsSync(filename))assert.ok(fs.readFileSync(filename).equals(body),'an existing immutable capture must match exactly');
  else fs.writeFileSync(filename,body,{flag:'wx'});
  assert.ok(fs.readFileSync(filename).equals(body),'full capture bytes are retained');
  const entry={...reference,references:0};entries.push(entry);references.set(capture,{reference,entry});
 }
 for(const capture of value.checkedLedger||[])assert.ok(references.has(capture),'every checked row is an archived capture');
 // Final States and both sides of a retry retain every original attempt.
 // Keeping those complete objects inline duplicated hundreds of megabytes;
 // archive their exact JSON as well, without changing or dropping a field.
 const stateHashes=new Map(),recordHashes=new Map(),seen=new WeakSet();
 const archive=(item,kind)=>{
  assert.ok(item&&typeof item==='object'&&!Array.isArray(item));
  if(references.has(item))return;
  const list=kind==='state'?states:records,hashes=kind==='state'?stateHashes:recordHashes;
  const body=Buffer.from(JSON.stringify(item,null,2)+'\n'),sha256=digest(body),existing=hashes.get(sha256);
  if(existing){assert.ok(fs.readFileSync(path.join(outputDirectory,existing.reference.file)).equals(body),'content-identical archived objects retain the full same bytes');references.set(item,existing);return;}
  const id=kind+'-'+String(list.length+1).padStart(6,'0'),file=kind+'s/'+id+'.json',reference={[kind+'Id']:id,file,sha256,bytes:body.length};
  fs.mkdirSync(path.join(outputDirectory,kind+'s'),{recursive:true});const filename=path.join(outputDirectory,file);
  if(fs.existsSync(filename))assert.ok(fs.readFileSync(filename).equals(body),'an existing immutable '+kind+' must match exactly');
  else fs.writeFileSync(filename,body,{flag:'wx'});
  assert.ok(fs.readFileSync(filename).equals(body),'full '+kind+' bytes are retained');
  const entry={...reference,references:0},saved={reference,entry};list.push(entry);hashes.set(sha256,saved);references.set(item,saved);
 };
 const collect=(item,key)=>{
  if(!item||typeof item!=='object'||references.has(item))return;
  if(key==='originalState'){archive(item,'state');return;}
  if(key==='beforeRecord'||key==='afterRecord'){archive(item,'record');return;}
  if(seen.has(item))return;seen.add(item);
  for(const[k,child]of Object.entries(item))collect(child,k);
 };
 collect(value,'');
 const indexed=JSON.parse(JSON.stringify(value,(_key,item)=>{
  const archived=item&&typeof item==='object'?references.get(item):null;
  if(!archived)return item;archived.entry.references++;return archived.reference;
 }));
 assert.ok([...entries,...states,...records].every(entry=>entry.references>0));
 indexed.captureArchive={version:1,format:'scale-full-capture-sidecars',completeCaptureCount:entries.length,
  fullCaptureBytes:entries.reduce((sum,entry)=>sum+entry.bytes,0),entries};
 indexed.stateArchive={version:1,format:'scale-full-state-sidecars',completeStateCount:states.length,
  fullStateBytes:states.reduce((sum,entry)=>sum+entry.bytes,0),entries:states};
 indexed.recordArchive={version:1,format:'scale-full-record-sidecars',completeRecordCount:records.length,
  fullRecordBytes:records.reduce((sum,entry)=>sum+entry.bytes,0),entries:records};
 const body=Buffer.from(JSON.stringify(indexed,null,2)+'\n'),filename=path.join(outputDirectory,'results.json');
 assert.ok(body.length<32*1024*1024,'the complete report index remains below the 32 MiB review limit');
 fs.writeFileSync(filename,body);assert.ok(fs.readFileSync(filename).equals(body));
 return{file:'results.json',sha256:digest(body),bytes:body.length,completeCaptureCount:entries.length,fullCaptureBytes:indexed.captureArchive.fullCaptureBytes,
  completeStateCount:states.length,fullStateBytes:indexed.stateArchive.fullStateBytes,completeRecordCount:records.length,fullRecordBytes:indexed.recordArchive.fullRecordBytes};
}
module.exports={orderedScaleTargets,scaleOperationPlan,scaleNearRaw,scaleNativeFlow,scaleNativeCheckCount,scaleNativeCaptureCount,scaleBoundaryKindsFor,scaleBoundaryFlow,scaleCapacityModes,scaleModeSpec,scaleCappedData,scaleVisibleActions,scaleCapacityGood,scaleCapacityCheckCount,constructScaleCapacityFixture,scaleCapacityFlow,scaleTextModes,scaleModelField,constructScaleTextFixture,scaleTextFlow,scaleLegacyModes,constructScaleLegacyFixture,writeScaleReport};

async function main(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-scale-adapter');fs.mkdirSync(out,{recursive:true});
 const {cases,associated,practice}=fixture,targets=orderedScaleTargets();
 const {width,height}=STANDARD_DESKTOP_VIEWPORT,viewports=[[width,height]];
 const checks=[],errors=[],remote=[],observations=[],isolated=[],boundaries=[],forgeries=[],backups=[],offline=[],preparations=[],retries=[],navigations=[],checkedLedger=[],captures=[],visuals=[],capacity=[],textLimits=[];
 const cp=structuredClone,digest=value=>crypto.createHash('sha256').update(value).digest('hex');
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
 const hash=value=>digest(JSON.stringify(stable(value))),ok=(value,message,detail={})=>{assert.ok(value,message);checks.push({message,...detail});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const sourceFiles=['dist/learning/scale-evidence.js','dist/learning/thinking-feedback.js','dist/learning/evidence-adapters.js','dist/exploration-core.js','tests/p9-scale-adapter-browser.cjs','tests/fixtures/p9-scale-cases.cjs','tests/p9-scale-evidence.test.mjs','tests/fixtures/p9-scale-navigation.cjs','tests/p9-scale-navigation.test.mjs',...Object.keys({...fixture.sourceHashes,...navigationFixture.sourceHashes})];
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),nodeVersion:process.version,cache,
  sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),childTrial:false,independentTeachingReview:false,nativeSourceSeededCorrectWork:false,nativeSourceSeededLessonPositions:false,
  syntheticCompatibilityFixturesAreChildRecords:false,nativeBackupImportsCompleted:0,compatibilityImportsCompleted:0,corruptImportsRejected:0};
 const {ensureB39Ready,prepareSessionRuntime}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();await prepareSessionRuntime('strategy39',{view:true});
 const {sessionTaskFor,BRIDGES}=await import('../dist/learning/bridges.js'),M=await import('../dist/learning/phase5/b28-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js'),{setField}=await import('../dist/learning/phase4/ui.js');
 const {thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 const {EVIDENCE_ADAPTERS}=await import('../dist/learning/evidence-adapters.js');
 const State=await import('../dist/learning/state.js'),Core=await import('../dist/exploration-core.js'),{studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const {scaleBinding:binding,replayScaleEvidence:replay}=await import('../dist/learning/scale-evidence.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const taskFor=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index}),originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const lessonFrom=(value,c)=>Object.hasOwn(BRIDGES,c.id)?value.daily.bridges[c.id]:value.lessons[c.id];
 for(const c of[...cases,...associated,...practice])assert.equal(hash(taskFor(c)),c.taskHash);
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(path.join(root,file))),sha,file);
 const artifactPaths=new Set(),uniqueFile=name=>{assert.ok(!artifactPaths.has(name),'one immutable raw artifact: '+name);artifactPaths.add(name);return path.join(out,name);};
 fs.writeFileSync(uniqueFile('fixed-source-cases.json'),JSON.stringify(fixture,null,2));fs.writeFileSync(uniqueFile('fixed-navigation.json'),JSON.stringify(navigationFixture,null,2));
 let browser,server,activePage,label='setup';const openContexts=new Set(),diagnostics=new Map();
 const report=()=>({provenance,viewports,checks,errors,remote,observations,isolated,boundaries,forgeries,backups,offline,preparations,retries,navigations,checkedLedger,captures,visuals,capacity,textLimits,
  nativeTasks:8,nativeNodes:3,associatedTasks:2,practiceCompatibilityPositions:2,targets:10,sessions:5,childTrial:false,independentTeachingReview:false});
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});provenance.browserVersion=browser.version();
  {
   const prefix=width+'x'+height;label=prefix+'-cache';
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
   server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   const profiles=[];
   for(const role of['source','native-restore-target',...scaleLegacyModes().map(m=>'constructed-legacy-'+m.id),...scaleCapacityModes().map(m=>'constructed-cap-'+m.id),...scaleTextModes().map(m=>'constructed-'+m.id)]){
    const context=await newDesktopContext(browser,{reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:'allow'});openContexts.add(context);
    context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
    const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push({label,role,error:String(error)}));diagnostics.set(page,observeBrowserDiagnostics(page,{out,base,label:()=>label}));profiles.push({role,context,page});
   }
   const[sourceProfile,restoreProfile]=profiles,restorePage=restoreProfile.page;
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
    if(t.type==='x-m28-scale'){
     if(before.history.length<2000){assert.equal(after.history.length,before.history.length+1);assert.deepEqual(after.history.slice(0,-1),before.history);assert.equal(after.history.at(-1).a,name.replace(/^m28-/,''));}
     else assert.deepEqual(after,before,'original capped actions leave the entire model unchanged');
    }
    return after;
   };
   const solve=async(c,options)=>{for(const step of scaleOperationPlan(c,await model(c),options))step.field?await field(c,step.field,step.value):await action(c,step.action,step.data);};
   const visual=async(c,phase)=>{
    const task=taskFor(c),m=await model(c),board=page.locator('.m28-world svg');assert.equal(await board.count(),1);await board.scrollIntoViewIfNeeded();assert.equal(await board.isVisible(),true);
    const box=await board.boundingBox();assert.ok(box&&box.width>150&&box.height>50);
    const displayed=await board.evaluate(el=>({viewBox:el.getAttribute('viewBox'),label:el.getAttribute('aria-label'),svg:el.outerHTML,
     rectangles:[...el.querySelectorAll('rect')].map(node=>{const box=node.getBoundingClientRect();return{x:Number(node.getAttribute('x')),y:Number(node.getAttribute('y')),width:Number(node.getAttribute('width')),height:Number(node.getAttribute('height')),fill:node.getAttribute('fill'),visibleWidth:box.width,visibleHeight:box.height};}),
     lines:[...el.querySelectorAll('line')].map(node=>({x1:Number(node.getAttribute('x1')),x2:Number(node.getAttribute('x2')),y1:Number(node.getAttribute('y1')),y2:Number(node.getAttribute('y2'))})),
     circles:[...el.querySelectorAll('circle')].map(node=>({cx:Number(node.getAttribute('cx')),cy:Number(node.getAttribute('cy')),r:Number(node.getAttribute('r'))})),
     texts:[...el.querySelectorAll('text')].map(node=>({x:Number(node.getAttribute('x')),y:Number(node.getAttribute('y')),text:node.textContent}))}));
    const rects=displayed.rectangles.map(({x,y,width,height})=>({x,y,width,height})),texts=displayed.texts.map(t=>t.text),lines=[];
    const near=(actual,expected)=>{assert.equal(actual.length,expected.length);for(let i=0;i<expected.length;i++)for(const k of Object.keys(expected[i]))assert.ok(Math.abs(actual[i][k]-expected[i][k])<=1e-9,'original SVG floating-point projection '+i+':'+k);};
    if(task.type==='x-m28-balance'){
     // A pending legacy practice opens an untouched, different first task.
     // It remains old balance data and never becomes scale evidence.
     assert.equal(c.id,'weightstart');assert.equal(c.index,0);assert.equal(task.mode,'compare');assert.equal(displayed.viewBox,'0 0 760 340');assert.equal(displayed.label,'天平，较重一侧下降，平衡表示两侧相等');
     const delta=m.board.tested?Math.sign(task.left.mass-task.right.mass):0,yl=150+31*delta,yr=150-31*delta;
     assert.deepEqual(displayed.lines,[{x1:175,x2:585,y1:yl,y2:yr},{x1:175,x2:175,y1:yl,y2:yl+70},{x1:585,x2:585,y1:yr,y2:yr+70}]);assert.deepEqual(texts,[task.left.name,task.right.name]);assert.equal(replay(task,m),null);
    }else{
     assert.equal(task.type,'x-m28-scale');const{kind,min,max,major,value,unit}=task;
     if(kind==='digital'){
      assert.equal(displayed.viewBox,'0 0 760 240');assert.equal(displayed.label,'模拟秒表 01:26.4');assert.deepEqual(rects,[{x:220,y:55,width:320,height:150}]);assert.deepEqual(displayed.lines,[]);assert.deepEqual(displayed.circles,[]);assert.deepEqual(displayed.texts,[{x:380,y:149,text:'01:26.4'},{x:380,y:185,text:'分 : 秒'}]);assert.equal(c.math.expected,'432/5');
     }else if(kind==='dial'){
      assert.equal(displayed.viewBox,'0 0 760 330');assert.equal(displayed.label,'指针秤与刻度');assert.deepEqual(rects,[]);assert.deepEqual(displayed.circles,[{cx:380,cy:170,r:138},{cx:380,cy:170,r:7}]);const labels=[];
      const angle=v=>Math.PI*(.75+1.5*(v-min)/(max-min));for(let v=min;v<=max;v+=major){const a=angle(v);lines.push({x1:380+Math.cos(a)*120,y1:170+Math.sin(a)*120,x2:380+Math.cos(a)*108,y2:170+Math.sin(a)*108});labels.push({x:380+Math.cos(a)*92,y:175+Math.sin(a)*92,text:String(v)});}
      const a=angle(value);lines.push({x1:380,y1:170,x2:380+Math.cos(a)*84,y2:170+Math.sin(a)*84});near(displayed.lines,lines);assert.deepEqual(texts,[...labels.map(x=>x.text),unit]);near(displayed.texts.map(({x,y})=>({x,y})),[...labels.map(({x,y})=>({x,y})),{x:380,y:225}]);
     }else if(kind==='ruler'){
      assert.equal(displayed.viewBox,'0 0 760 200');assert.equal(displayed.label,'标出终点的尺子');assert.deepEqual(rects,[{x:70,y:85,width:600,height:65}]);assert.deepEqual(displayed.circles,[]);assert.equal(min,0);assert.equal(max,15);assert.equal(task.minor,.1);assert.equal(c.math.minorCount,'127');
      for(let i=0;i<=150;i++){const x=80+i*.1*(580/15);lines.push({x1:x,x2:x,y1:85,y2:i%10===0?111:98});}const x=80+12.7*(580/15);lines.push({x1:x,x2:x,y1:36,y2:85});near(displayed.lines,lines);assert.deepEqual(texts,[...Array.from({length:16},(_,i)=>String(i)),'cm']);
     }else{
      assert.ok(['jug','thermo'].includes(kind));assert.equal(displayed.viewBox,'0 0 760 340');assert.equal(displayed.label,kind==='thermo'?'温度计上的液面和刻度':'量杯上的液面和刻度');assert.deepEqual(displayed.circles,[]);const level=295-(value-min)/(max-min)*250;
      near(rects,[{x:350,y:45,width:100,height:250},{x:357,y:level,width:86,height:289-level}]);const labels=[];for(let v=min;v<=max;v+=major){const y=295-(v-min)/(max-min)*250;lines.push({x1:450,x2:466,y1:y,y2:y});labels.push(String(v));}lines.push({x1:335,x2:453,y1:level,y2:level});near(displayed.lines,lines);assert.deepEqual(texts,[...labels,unit]);
     }
    }
    assert.ok(displayed.rectangles.every(r=>r.visibleWidth>0&&r.visibleHeight>0),'all actual source rectangle areas are visible');
    const file=label+'-visual-'+phase+'.png',bytes=await board.screenshot({path:uniqueFile(file)});
    const pixels=await page.evaluate(async encoded=>{
     const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),image=new OffscreenCanvas(bitmap.width,bitmap.height),context=image.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();
     const raw=context.getImageData(0,0,image.width,image.height).data,colors=new Set();let min=255,max=0;
     for(let i=0;i<raw.length;i+=4){const r=raw[i],g=raw[i+1],b=raw[i+2];colors.add((r>>4)*256+(g>>4)*16+(b>>4));min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);}
     return{width:image.width,height:image.height,quantizedColors:colors.size,channelRange:max-min};
    },bytes.toString('base64'));
    assert.ok(pixels.quantizedColors>=6&&pixels.channelRange>40,'the actual screenshot contains the fixed source instrument or the explicitly separate old prerequisite');
    const item={width,height,id:c.id,index:c.index,label,phase,file,sha256:digest(bytes),bytes:bytes.length,box,pixels,displayed,model:m};visuals.push(item);return item;
   };
   const capture=async(c,phase,strict,{role,checked=false}={})=>{
    const raw=await rawSnapshot(phase),lesson=lessonFrom(raw.decodedState,c),m=lesson.models[c.index],record=lesson.cases[c.index]||null,task=taskFor(c),proof=replay(task,m);
    assert.equal(Tasks.validModel(task,m),true);const expectedFeedback=thinkingFeedback(task,m,record,ctx(c)),native=!!binding(task,ctx(c));
    assert.equal(native&&!!expectedFeedback,strict);if(role!=='prerequisite')assert.equal(!!expectedFeedback,strict);
    else{const prep=navigationFixture.navigation.find(x=>x.id===c.id&&x.index===c.index);assert.ok(prep);assert.equal(!!expectedFeedback,prep.existingOtherFeedback);const adapters=EVIDENCE_ADAPTERS.filter(a=>a.binding(task,ctx(c)));assert.deepEqual(adapters.map(a=>a.id),prep.existingAdapter?[prep.existingAdapter]:[]);if(prep.existingAdapter){assert.ok(adapters[0].replay(task,m));assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(expectedFeedback.method,null);}}
    assert.equal(await hint.count(),expectedFeedback?1:0);if(expectedFeedback)assert.equal(await hint.isVisible(),true);const words=expectedFeedback?await hint.innerText():null;
    if(strict){
     assert.ok(proof&&native);assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(expectedFeedback.method,null);
     assert.ok(words.includes('实际保存的读数原文'));assert.doesNotMatch(words,/MP\.\d/);assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);
     assert.ok(words.includes(proof.construction.record.raw)&&words.includes(proof.construction.record.unit));
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
      const checked=await check(previous,true,false,'navigation-prerequisite-'+at,'prerequisite');preparations.push({width,height,...prep,checked,strictScaleCoverage:false});
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
     const moduleNames=[...new Set(['storage.js','v2.html','learn.html','exploration.js','exploration-core.js','data/atlas.json','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/scale-evidence.js','learning/p3-workflow.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','vendor/three/three.module.min.js','vendor/three/OrbitControls.js',...sourceFiles.filter(file=>file.startsWith('dist/')).map(file=>file.slice(5))])];
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
    const phases=await scaleBoundaryFlow(kind,c,api(c,'boundary'));await reload(c);assert.deepEqual(await model(c),phases.at(-1).model);assert.equal(await hint.isVisible(),true);
    const rendered=await visual(c,'final'),screenshot=await shot('boundary');boundaries.push({width,height,kind,id:c.id,index:c.index,phases,rendered,screenshot,constructedCompatibilityFixture:false});
   };
   const runNative=async c=>{
    label=prefix+'-'+c.id+'-'+c.index;await open(c);assert.equal(binding(taskFor(c),ctx(c))?.nodeId,c.nodeId);
    assert.equal(await guide.isVisible(),true);assert.equal(await guide.evaluate(e=>e.open),false);assert.equal(await hint.count(),0);const before=await current(c),images={initial:await visual(c,'initial')};
    await guide.locator(':scope > summary').click();assert.equal(await guide.locator('p').isVisible(),true);
    await page.waitForFunction(async({id,index})=>{const{readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;},c);
    await guide.locator(':scope > summary').click();const supported=await current(c);assert.deepEqual(supported.model,before.model);assert.equal(supported.record.attempts.length,0);
    const phases=await scaleNativeFlow(c,{...api(c,'native'),checkpoint:async(stage,items)=>{
     if(['tested','terminal-issue'].includes(stage))images[stage]=await visual(c,stage);
     if(stage==='correct-unsubmitted')assert.equal(await hint.count(),0);
     if(stage==='corrected'){
      images.corrected=await visual(c,'corrected');await shot('corrected');await reload(c);
      assert.equal(await hint.isVisible(),true);assert.deepEqual(await model(c),items.at(-1).model);
      // Compare the instrument's SVG geometry. Chromium's CSS pixel bounds can vary by a fraction of a pixel after reflow.
      assert.equal(images.corrected.displayed.svg,images.initial.displayed.svg,'the instrument is fixed task data; writing a reading does not move it');
     }
     if(stage==='shared-retry'){await reload(c);assert.equal(await hint.count(),0);images[stage]=await visual(c,stage);}
     if(stage==='final'){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);images.final=await visual(c,'retry-corrected');}
    }});
    const final=phases.at(-1),actual=phases.filter(x=>x.checked);assert.equal(actual.length,scaleNativeCheckCount(c));assert.equal(phases.length,scaleNativeCaptureCount(c));assert.deepEqual(final.record.attempts,actual.map(x=>x.attempt));
    for(const kind of['extra-root','extra-event','false-issue','hidden-offset','hidden-estimate','hidden-error','hidden-values','foreign-action']){
     const forged=cp(final.model),task=taskFor(c);
     if(kind==='extra-root')forged.unrecorded=1;else if(kind==='extra-event')forged.history[0].unrecorded=1;else if(kind==='false-issue')forged.issue='not the recorded issue';
     else if(kind==='hidden-offset')forged.offset='2.0';else if(kind==='hidden-estimate')forged.estimate='1';else if(kind==='hidden-error')forged.error='1';else if(kind==='hidden-values')forged.values=['1'];else M.act(task,forged,'m28-help');
     assert.equal(replay(task,forged),null);forgeries.push({width,height,id:c.id,index:c.index,kind,counterfactual:true,actualBrowserAction:false,model:forged,originalValid:M.valid(task,forged),strict:false});
    }
    observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,taskHash:c.taskHash,phases,images});for(const kind of scaleBoundaryKindsFor(c))await runBoundary(c,kind);
   };
   for(const c of targets){
    if(c.role==='native')await runNative(c);
    else{label=prefix+'-'+c.role+'-'+c.id+'-'+c.index;await open(c);assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);await capture(c,'associated-initial',false,{role:'associated'});await solve(c);await capture(c,'associated-unsubmitted',false,{role:'associated'});
     const snapshot=await check(c,true,false,'associated-checked','associated');assert.ok(snapshot.proof);assert.equal(binding(taskFor(c),ctx(c)),null);await reload(c);assert.equal(await hint.count(),0);assert.deepEqual(await model(c),snapshot.model);
     const rendered=await visual(c,'checked');isolated.push({width,height,kind:c.role,id:c.id,index:c.index,taskHash:c.taskHash,snapshot,rendered});}
   }
   const mapCaptures=(rows,finalState)=>rows.map(value=>{
    const lesson=lessonFrom(finalState,value),prior=value.record?.attempts||[];assert.ok(lesson);assert.deepEqual((lesson.cases[value.index]?.attempts||[]).slice(0,prior.length),prior);if(value.record?.support)assert.equal(lesson.cases[value.index].support,true);if(value.record?.exposed)assert.equal(lesson.cases[value.index].exposed,true);
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
   assert.equal(sourceRows.length,162);assert.equal(sourceCaptures.length,221);const positions=[...new Set(sourceRows.map(x=>x.id+':'+x.index))];assert.equal(positions.length,16);
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
   assert.ok((await importFile(restorePage,actual.payload,'scale-identical-repeat-v2.json')).includes('备份已合并'));const repeated=await read(restorePage);assert.equal(repeated.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),actual.backup.state);
   const repeatedImportStorage=storageOnly(await rawSnapshot('repeated-import',restorePage));provenance.nativeBackupImportsCompleted++;
   assert.ok(!(await importFile(restorePage,'{','scale-corrupt-native.json')).includes('备份已合并'));assert.equal((await read(restorePage)).raw,imported.raw);
   const corruptImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected',restorePage));provenance.corruptImportsRejected++;
   const last=cases.at(-1);await navigate(last,restorePage);assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredReload=await restorePage.reload();assert.equal(restoredReload?.fromServiceWorker(),true);await wait(last,restorePage);keepRecords(actual.backup.state,originalState(await state(restorePage)));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredStorage=storageOnly(await rawSnapshot('restored-lesson',restorePage)),restoredScreenshot=await shot('restored',restorePage);
   backups.push({width,height,kind:'actual-browser-v2',backupFile:actual.file,bytes:actual.bytes,backupSha256:actual.sha256,originalState:actual.backup.state,
    emptyBeforeImport,firstImportStorage,repeatedImportStorage,corruptImportStorage,restoredStorage,exportedScreenshot,restoredScreenshot,sourceCaptureMap,
    independentEmptyContext:true,originStopped:!server.listening,wholeStateFirstImportExact:true,repeatByteIdempotent:true,corruptRejectedWithoutWrite:true,checked:162,currentModelCaptures:221,positions:16});

   // Six separate, explicitly constructed compatibility contexts. Their old
   // records never seed the ordinary source route or count as native UI checks.
   for(const mode of scaleLegacyModes()){
    const profile=profiles.find(p=>p.role==='constructed-legacy-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-'+contextRole;
    const c=scaleModeSpec(mode),task=taskFor(c),fixture=constructScaleLegacyFixture(c,mode,{State,Core,Engine,setField,task});originalState(fixture.state);
    const payload=JSON.stringify(Core.backup(fixture.state)),file=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(file),payload);
    const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
    const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
    assert.ok((await importFile(page,payload,file)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;
    const importedStorage=storageOnly(await rawSnapshot('first-import'));
    assert.ok((await importFile(page,payload,'scale-repeat-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;const repeatedStorage=storageOnly(await rawSnapshot('repeat-import'));
    assert.ok(!(await importFile(page,'{','scale-corrupt-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;const rejectedImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected'));
    await navigate(c);const before=await current(c),openedStorage=storageOnly(await rawSnapshot('opened-original-record'));let preservedExport=null,phases=[];
    assert.deepEqual(before.lesson.cases,fixture.state.lessons[c.id].cases);assert.deepEqual(before.lesson.notes,fixture.state.lessons[c.id].notes);assert.equal(before.lesson.draft,fixture.state.lessons[c.id].draft);
    if(mode.kind==='practice'){
     assert.deepEqual(before.lesson.models[-1],fixture.state.lessons[c.id].models[-1]);assert.equal(before.record?.attempts?.length??0,0);assert.equal(State.currentSubmission(before.lesson).status,'unsubmitted');assert.equal(await hint.count(),0);
     if(mode.copy)assert.deepEqual(before.model,before.lesson.models[-1]);else{const initial=Tasks.defaultModel(task);initial.seed=before.model.seed;assert.deepEqual(before.model,initial);assert.notDeepEqual(before.model,before.lesson.models[-1]);}
     phases.push(await capture(c,'legacy-practice-opened-unsubmitted',false,{role:'legacy'}));
     if(mode.copy)phases.push(await check(c,true,true,'real-check-after-practice-copy','legacy'));
     const after=await current(c);assert.deepEqual(after.lesson.models[-1],before.lesson.models[-1]);for(let i=0;i<mode.prior;i++)assert.deepEqual(after.lesson.cases[i],before.lesson.cases[i]);
     isolated.push({width,height,kind:'old-practice-compatibility',mode,id:c.id,index:-1,nativePositionOpened:mode.index,openedStorage,phases,oldModel:before.lesson.models[-1],constructedCompatibilityFixture:true});
    }else{
     assert.equal(M.valid(task,before.model),false);assert.equal(State.numericCompatibility(task,before.model),true);assert.equal(State.validStoredModel(task,before.model),true);assert.equal(Tasks.inspect(task,before.model).correct,false);assert.equal(replay(task,before.model),null);
     assert.equal(await page.locator('#numeric-compat-notice').isVisible(),true);assert.equal(await page.locator('[data-do="numeric-retry"]').isDisabled(),true);assert.equal(await page.locator('#work [data-xfield]:enabled,#work [data-x]:enabled').count(),0);assert.equal(await hint.count(),0);
     const checker=page.locator('#actions [data-do="check"]');assert.ok((await checker.count())===0||await checker.isDisabled());
     const secondary=page.locator('[data-do="p3-retry"]');assert.equal(await secondary.count(),1);await reveal(secondary);const oldRaw=(await read(page)).raw;await secondary.click();assert.equal((await read(page)).raw,oldRaw);assert.deepEqual(await current(c),before);
     const readOnlyScreenshot=await shot('numeric-read-only');await reload(c);assert.equal(await page.locator('[data-do="numeric-retry"]').isDisabled(),true);assert.deepEqual((await current(c)).model,before.model);
     const preserved=originalState(await state()),button=page.locator('[data-do="numeric-export"]');await reveal(button);assert.equal(await button.isEnabled(),true);
     const waiting=page.waitForEvent('download');await button.click();const downloaded=await waiting,exportFile=label+'-numeric-preserved-v2.json';await downloaded.saveAs(uniqueFile(exportFile));const exportedBytes=fs.readFileSync(path.join(out,exportFile)),exported=JSON.parse(exportedBytes);
     assert.equal(exported.version,2);assert.deepEqual(exported.state,preserved);assert.equal(await page.locator('[data-do="numeric-retry"]').isEnabled(),true);assert.doesNotMatch(await page.locator('#numeric-compat-notice').innerText(),/已(?:成功)?(?:保存|下载)(?:到|在)?(?:本地|磁盘|文件)/);
     preservedExport={file:exportFile,sha256:digest(exportedBytes),bytes:exportedBytes.length,originalState:exported.state,actualNumericExportButton:true};
     await page.locator('[data-do="numeric-retry"]').click();await wait(c);const after=await current(c),initial=Tasks.defaultModel(task);initial.seed=after.model.seed;assert.deepEqual(after.model,initial);assert.deepEqual(after.lesson.cases,before.lesson.cases);assert.deepEqual(after.lesson.notes,before.lesson.notes);assert.equal(after.lesson.draft,before.lesson.draft);assert.equal(await page.locator('#numeric-compat-notice').count(),0);
     phases.push(await capture(c,'numeric-real-retry-fresh',false,{role:'legacy'}));await solve(c);phases.push(await capture(c,'numeric-redo-unsubmitted',false,{role:'legacy'}));phases.push(await check(c,true,true,'numeric-real-redo-checked','legacy'));assert.deepEqual((await current(c)).record.attempts.slice(0,1),before.record.attempts);
     isolated.push({width,height,kind:'numeric-legacy-compatibility',mode,id:c.id,index:c.index,openedStorage,oldModel:before.model,oldRecord:before.record,readOnlyScreenshot,preservedExport,phases,constructedCompatibilityFixture:true});
    }
    const rendered=await visual(c,'compatibility-final'),screenshot=await shot('compatibility-final'),final=await downloadBackup('final-v2'),a=final.backup.state.lessons[c.id];
    assert.deepEqual(a.notes,fixture.state.lessons[c.id].notes);assert.equal(a.draft,fixture.state.lessons[c.id].draft);
    const rows=captures.filter(x=>x.width===width&&x.contextRole===contextRole),captureMap=mapCaptures(rows,final.backup.state);
    backups.push({width,height,kind:'constructed-'+mode.kind+'-final-v2',mode,constructedCompatibilityFixture:true,fixture:file,fixtureSHA256:digest(payload),emptyStorage,importedStorage,repeatedStorage,rejectedImportStorage,openedStorage,
     backupFile:final.file,bytes:final.bytes,backupSha256:final.sha256,originalState:final.backup.state,preservedExport,phases,captureMap,rendered,screenshot,importedConstructedSubmissions:mode.prior,actualUIChecksAfterImport:mode.kind==='numeric'||mode.copy?1:0,independentContext:true,originStopped:!server.listening});
   }
   for(const mode of scaleCapacityModes()){
    const profile=profiles.find(p=>p.role==='constructed-cap-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');
    label=prefix+'-constructed-cap-'+mode.id;const c=scaleModeSpec(mode),task=taskFor(c),fixture=constructScaleCapacityFixture(c,mode,{Tasks,State,Core,Engine,setField,task});
    originalState(fixture.state);assert.equal(fixture.state.lessons[c.id].models[c.index].history.length,2000);
    const fixturePayload=JSON.stringify(Core.backup(fixture.state)),fixtureFile=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(fixtureFile),fixturePayload);
    const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
    const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
    assert.ok((await importFile(page,fixturePayload,fixtureFile)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;
    const importedStorage=storageOnly(await rawSnapshot('imported-fixture'));
    assert.ok((await importFile(page,fixturePayload,'scale-identical-'+mode.id+'-v2.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;
    const repeatedStorage=storageOnly(await rawSnapshot('repeated-fixture'));
    const invalid=cp(fixture.state);invalid.lessons[c.id].models[c.index].history.push(cp(invalid.lessons[c.id].models[c.index].history.at(-1)));assert.equal(invalid.lessons[c.id].models[c.index].history.length,2001);assert.equal(M.valid(task,invalid.lessons[c.id].models[c.index]),false);
    const invalidPayload=JSON.stringify({...Core.backup(fixture.state),state:invalid});
    assert.ok(!(await importFile(page,invalidPayload,'scale-invalid-2001-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;
    const rejectedImportStorage=storageOnly(await rawSnapshot('invalid-2001-import-rejected'));await navigate(c);
    const actionMetadata=[];
    const phases=await scaleCapacityFlow(mode,c,{...api(c,'capacity'),
     reloadCap:async()=>{await reload(c);},
     assertRetryAvailable:async expected=>assert.equal(await page.locator('[data-do="p3-retry"]').count(),expected?1:0,'zero-attempt fixture does not invent a retry button'),
     cappedAction:async name=>{const before=await current(c),raw=await read(page);await action(c,'m28-'+name,scaleCappedData(name,c));const after=await current(c),changed=await read(page);assert.deepEqual(after.model,before.model);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.deepEqual(after.record?.attempts||[],before.record?.attempts||[]);
      if(before.model.board.bad||before.model.issue)assert.equal(after.record.support,true);
      assert.notEqual(after.lesson.updatedAt,before.lesson.updatedAt,'the original successful update still writes its timestamp');assert.notEqual(changed.raw,raw.raw,'a model noop is not a raw-storage no-write');
      actionMetadata.push({name,beforeUpdatedAt:before.lesson.updatedAt,afterUpdatedAt:after.lesson.updatedAt,beforeSupport:before.record?.support??null,afterSupport:after.record?.support??null,modelUnchanged:true,rawChanged:true,attemptsUnchanged:true});
     }
    });
    const rendered=await visual(c,'after-capacity-retry'),screenshot=await shot('recovered'),final=await downloadBackup('recovered-v2'),rows=captures.filter(x=>x.width===width&&x.contextRole===contextRole),captureMap=mapCaptures(rows,final.backup.state);
    const currentLesson=lessonFrom(final.backup.state,c);assert.deepEqual(currentLesson.notes,fixture.state.lessons[c.id].notes);assert.equal(currentLesson.draft,fixture.state.lessons[c.id].draft);
    assert.equal(currentLesson.cases[c.index].attempts.length,fixture.constructedSubmissions+scaleCapacityCheckCount(mode,c));assert.deepEqual(currentLesson.cases[c.index].attempts.slice(0,mode.prior),fixture.state.lessons[c.id].cases[c.index]?.attempts||[]);
    const item={width,height,mode,id:c.id,index:c.index,contextRole,constructedCompatibilityFixture:true,constructedSubmissions:fixture.constructedSubmissions,
     fixtureFile,fixtureSHA256:digest(fixturePayload),emptyStorage,importedStorage,repeatedStorage,rejectedImportStorage,phases,captureMap,actionMetadata,rendered,screenshot,
     actualUIChecksAfterImport:scaleCapacityCheckCount(mode,c),actualSharedRetries:1,wholeModelUnchangedByCappedAction:true,controllerMetadataStillWritten:true,currentRawAndUnitMustStillMatchSavedPair:true,documentReloadPerformedForCap:true,documentReloadRequiredForCap:false,
     zeroAttemptNeedsCheckBeforeRetry:mode.prior===0,nativeHandEnteredHistory:false,backupFile:final.file,backupSha256:final.sha256,originalState:final.backup.state};
    capacity.push(item);backups.push({...item,kind:'constructed-capacity-final-v2'});
   }
   for(const mode of scaleTextModes()){
    const profile=profiles.find(p=>p.role==='constructed-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-constructed-'+mode.id;
    const c=scaleModeSpec(mode),task=taskFor(c),fixture=constructScaleTextFixture(c,mode,{State,Core,Engine,setField,task});originalState(fixture.state);
    const fixturePayload=JSON.stringify(Core.backup(fixture.state)),fixtureFile=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(fixtureFile),fixturePayload);
    const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
    assert.ok((await importFile(page,fixturePayload,fixtureFile)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;const importedStorage=storageOnly(await rawSnapshot('imported-fixture'));
    assert.ok((await importFile(page,fixturePayload,'scale-identical-'+mode.id+'-v2.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;const repeatedStorage=storageOnly(await rawSnapshot('repeated-fixture'));
    const invalid=cp(fixture.state);invalid.lessons[c.id].models[c.index].prose='文'.repeat(1201);assert.equal(M.valid(task,invalid.lessons[c.id].models[c.index]),false);const invalidPayload=JSON.stringify({...Core.backup(fixture.state),state:invalid});
    assert.ok(!(await importFile(page,invalidPayload,'scale-invalid-1201-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;const rejectedImportStorage=storageOnly(await rawSnapshot('invalid-1201-import-rejected'));await navigate(c);
    let persisted,beforeBlock;const images=[],blockedActions=[];
    const phases=await scaleTextFlow(mode,c,{...api(c,'text-limit'),assertRetryAvailable:async expected=>assert.equal(await page.locator('[data-do="p3-retry"]').count(),expected?1:0),
     overlongText:async(key,value)=>{persisted=await read(page);beforeBlock=await current(c);const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.getAttribute('maxlength'),null);await control.fill(value);
      assert.equal(await page.locator('#storage-warning').isVisible(),true);assert.ok((await page.locator('#storage-warning').innerText()).includes('已停止覆盖原记录'));assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);images.push(await shot('1201-blocked'));
     },
     blockedAction:async name=>{const selector=['check','retry'].includes(name)?(name==='check'?'#actions [data-do="check"]':'[data-do="p3-retry"]'):'[data-x="m28-'+name+'"]'+Object.entries(scaleCappedData(name,c)).map(([key,value])=>'[data-'+key+'="'+value+'"]').join(''),control=page.locator(selector);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);blockedActions.push({name,actualVisibleControl:true,rawUnchanged:true,modelUnchanged:true});},
     blockedField:async(key,value)=>{const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.getAttribute('type'),'text');const before=await control.inputValue();await control.fill(value);assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);blockedActions.push({name:key,previousValue:before,requestedValue:value,actualVisibleControl:true,rawUnchanged:true,modelUnchanged:true});},
     reloadBlocked:async()=>{await reload(c);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.deepEqual((await current(c)).model,beforeBlock.model);images.push(await shot('1200-reloaded'));}
    });
    const rendered=await visual(c,'after-text-retry'),final=await downloadBackup('recovered-v2'),rows=captures.filter(x=>x.width===width&&x.contextRole===contextRole),captureMap=mapCaptures(rows,final.backup.state),currentLesson=lessonFrom(final.backup.state,c),actualChecks=mode.prior?1:2;
    assert.deepEqual(currentLesson.notes,fixture.state.lessons[c.id].notes);assert.equal(currentLesson.draft,fixture.state.lessons[c.id].draft);assert.equal(currentLesson.cases[c.index].attempts.length,mode.prior+actualChecks);assert.deepEqual(currentLesson.cases[c.index].attempts.slice(0,mode.prior),fixture.state.lessons[c.id].cases[c.index]?.attempts||[]);
    const item={width,height,mode,id:c.id,index:c.index,contextRole,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,fixtureFile,fixtureSHA256:digest(fixturePayload),emptyStorage,importedStorage,repeatedStorage,rejectedImportStorage,
     phases,captureMap,images,blockedActions,rendered,actualUIChecksAfterImport:actualChecks,actualSharedRetries:1,writeRejectedBeforeStorage:true,oldRawBytesPreserved:true,documentReloadRequired:true,zeroAttemptNeedsCheckBeforeRetry:mode.prior===0,
     backupFile:final.file,backupSha256:final.sha256,originalState:final.backup.state};textLimits.push(item);backups.push({...item,kind:'constructed-text-limit-final-v2'});
   }
   for(const profile of profiles){await profile.context.close();openContexts.delete(profile.context);}activePage=null;
  }
  assert.equal(errors.length,0);assert.equal(remote.length,0);assert.equal(observations.length,8);assert.equal(forgeries.length,64);assert.equal(preparations.length,6);assert.equal(navigations.length,11);
  assert.equal(isolated.filter(x=>x.kind==='associated').length,2);assert.equal(isolated.filter(x=>x.kind==='old-practice-compatibility').length,4);assert.equal(isolated.filter(x=>x.kind==='numeric-legacy-compatibility').length,2);assert.equal(boundaries.length,5);assert.equal(capacity.length,10);assert.equal(textLimits.length,6);
  const sourceChecked=checkedLedger.filter(x=>x.contextRole==='source'),sourceCaptures=captures.filter(x=>x.contextRole==='source'),capacityChecked=checkedLedger.filter(x=>x.role==='capacity'),capacityCaptures=captures.filter(x=>x.role==='capacity'),textChecked=checkedLedger.filter(x=>x.role==='text-limit'),textCaptures=captures.filter(x=>x.role==='text-limit'),legacyChecked=checkedLedger.filter(x=>x.role==='legacy'),legacyCaptures=captures.filter(x=>x.role==='legacy');
  assert.equal(sourceChecked.length,162);assert.equal(sourceCaptures.length,221);assert.equal(capacityChecked.length,74);assert.equal(capacityCaptures.length,166);assert.equal(textChecked.length,9);assert.equal(textCaptures.length,54);assert.equal(legacyChecked.length,4);assert.equal(legacyCaptures.length,12);
  assert.equal(checkedLedger.length,249);assert.equal(captures.length,453);assert.equal(retries.filter(x=>x.contextRole==='source').length,13);assert.equal(retries.length,29);
  assert.ok(sourceChecked.every(x=>!x.constructedCompatibilityFixture));assert.ok([...capacityChecked,...textChecked,...legacyChecked].every(x=>x.constructedCompatibilityFixture));
  assert.equal(backups.filter(x=>x.kind==='actual-browser-v2').length,1);assert.equal(backups.filter(x=>x.kind==='constructed-practice-final-v2').length,4);assert.equal(backups.filter(x=>x.kind==='constructed-numeric-final-v2').length,2);assert.equal(backups.filter(x=>x.kind==='constructed-capacity-final-v2').length,10);assert.equal(backups.filter(x=>x.kind==='constructed-text-limit-final-v2').length,6);
  assert.equal(provenance.nativeBackupImportsCompleted,2);assert.equal(provenance.compatibilityImportsCompleted,44);assert.equal(provenance.corruptImportsRejected,23);
  const attemptCounts=Object.fromEntries(['native','boundary','associated','prerequisite','capacity','text-limit','legacy'].map(role=>[role,checkedLedger.filter(x=>x.role===role).length]));
  assert.deepEqual(attemptCounts,{native:131,boundary:23,associated:2,prerequisite:6,capacity:74,'text-limit':9,legacy:4});
  const checkedPaths=checkedLedger.flatMap(x=>[x.storage.raw,x.storage.state]),capturePaths=captures.flatMap(x=>[x.storage.raw,x.storage.state]);assert.equal(new Set(checkedPaths).size,498);assert.equal(new Set(capturePaths).size,906);
  fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(provenance,null,2));writeScaleReport(out,{...report(),proofContracts:['math','correction','persistence','negative','backup'],attemptCounts,uniqueCheckedFiles:498,uniqueCaptureFiles:captures.length*2,originStopped:offline.every(x=>x.originStopped)});
  console.log('P9_SCALE_ADAPTER_BROWSER_OK '+JSON.stringify({
   checks:checks.length,nativeTasks:cases.length,viewports,
   checked:checkedLedger.length,captures:captures.length,originsStopped:offline.every(x=>x.originStopped),
   retries:retries.length,next:navigations.length,forgeries:forgeries.length,
   nativeImports:provenance.nativeBackupImportsCompleted,compatibilityImports:provenance.compatibilityImportsCompleted,
   corruptImportsRejected:provenance.corruptImportsRejected,visuals:visuals.length
  }));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(reason=>({diagnosticError:String(reason)})):null;
  if(activePage){await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.html'),await activePage.content().catch(()=>''));}
  console.error(error.stack||String(error));process.exitCode=1;
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({provenance,checks,
   errors:[...errors,{label,error:String(error)}],at:label,diagnosticFile,captureCount:captures.length},null,2));
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const context of openContexts)await context.close();if(browser)await browser.close();
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
