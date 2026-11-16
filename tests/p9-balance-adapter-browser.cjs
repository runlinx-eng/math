// Ordinary visible-control plans shared with an independent original-controller
// audit. Importing this module never starts a browser or creates native records.
const fixture=require('./fixtures/p9-balance-cases.cjs');
const navigationFixture=require('./fixtures/p9-balance-navigation.cjs');
function orderedBalanceTargets(){
 const all=[...fixture.cases,...fixture.associated];
 return[...new Set(all.map(c=>c.id))].flatMap(id=>all.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));
}
function balanceOperationPlan(spec,model,{raw,weights,record=true}={}){
 const t=spec.task,out=[],a=(action,data)=>out.push({action,data}),f=(field,value)=>out.push({field,value:String(value)});
 if(t.mode==='compare'){
  a('m28-test');a('m28-choice',{index:spec.math.relation});t.questions.forEach((q,i)=>f('answers.'+i,spec.math.lighter));
 }else{
  for(const ignored of model.board.weights)a('m28-remove');
  for(const amount of weights??spec.math.multisets.at(-1))a('m28-weight',{index:String(amount)});
  f('measure',raw??spec.math.mass);f('unit',t.unit);if(record)a('m28-record');
 }
 return out;
}
function balanceOrderedSolutions(spec){
 const result=[],visit=(sum,values)=>{if(sum===spec.math.mass){result.push(values);return;}for(const w of spec.task.weights)if(sum+w<=spec.math.mass)visit(sum+w,[...values,w]);};visit(0,[]);return result;
}
async function saveBalance(api,raw){await api.field('measure',String(raw));await api.action('m28-record');}
function balanceNativeCheckCount(spec){return spec.task.mode==='weigh'?19:7+2*spec.task.questions.length;}
function balanceNativeCaptureCount(spec){return spec.task.mode==='weigh'?26:13+3*spec.task.questions.length;}
async function balanceNativeFlow(spec,api){
 const{field,action,solve,model,check,capture,retry,checkpoint,assert}=api,t=spec.task,phases=[await capture('initial',false)];
 if(t.mode==='compare'){
  phases.push(await check(false,false,'initial-uncompared'));
  for(let i=0;i<t.questions.length;i++){await field('answers.'+i,spec.math.lighter);phases.push(await capture('visible-lighter-before-test-'+i,false));}
  await action('m28-test');phases.push(await capture('tested-without-choice',false));await checkpoint('tested',phases);
  const wrong=['left','right','equal'].find(x=>x!==spec.math.relation);await action('m28-choice',{index:wrong});phases.push(await check(false,false,'wrong-first-comparison'));
  await action('m28-choice',{index:spec.math.relation});phases.push(await capture('correct-unsubmitted',false));await checkpoint('correct-unsubmitted',phases);phases.push(await check(true,true,'corrected'));await checkpoint('corrected',phases);
  assert(phases.at(-1).proof.construction.firstChoice.selected===wrong&&phases.at(-1).proof.construction.hadOriginalBad,'the first wrong comparison remains');phases.push(await check(true,true,'repeated-check'));
  await action('m28-test');phases.push(await capture('retested-unsubmitted',false));phases.push(await check(true,true,'retested-with-retained-choice'));
  for(let i=0;i<t.questions.length;i++){await field('answers.'+i,t.questions[i].options.find(x=>String(x[0])!==spec.math.lighter)[0]);phases.push(await check(false,false,'wrong-visible-lighter-'+i));await field('answers.'+i,spec.math.lighter);phases.push(await check(true,true,'lighter-corrected-'+i));}
 }else{
  await action('m28-remove');phases.push(await check(false,false,'empty-remove-before-record'));
  await field('unit',t.unit);await saveBalance(api,'');phases.push(await check(false,false,'blank-first-record'));assert((await model()).board.first.measure===undefined,'blank record is not the first finite measurement');
  await saveBalance(api,spec.math.mass+1);phases.push(await check(false,false,'first-wrong-record-on-empty-pan'));await solve();phases.push(await capture('correct-unsubmitted',false));await checkpoint('correct-unsubmitted',phases);
  phases.push(await check(true,true,'corrected'));await checkpoint('corrected',phases);assert(phases.at(-1).proof.construction.firstMeasure.raw===String(spec.math.mass+1)&&phases.at(-1).proof.construction.hadOriginalBad,'the first wrong unbalanced record remains');phases.push(await check(true,true,'repeated-check'));
  await field('measure',spec.math.mass+'.0');phases.push(await capture('equivalent-current-unsubmitted',false));phases.push(await check(false,false,'equivalent-spelling-not-saved'));await action('m28-record');phases.push(await check(true,true,'equivalent-spelling-resaved'));
  await saveBalance(api,spec.math.mass+'.00000001');phases.push(await check(true,false,'original-near-record'));await field('measure',String(spec.math.mass));phases.push(await check(false,false,'exact-current-near-saved'));await action('m28-record');phases.push(await check(true,true,'near-reading-resaved-exactly'));
  const saved=JSON.stringify((await model()).board.saved);await saveBalance(api,'');phases.push(await check(false,false,'failed-blank-record-keeps-save'));assert(JSON.stringify((await model()).board.saved)===saved,'failed blank record retains its old raw pair');
  await field('measure',String(spec.math.mass));phases.push(await capture('saved-raw-restored-unsubmitted',false));phases.push(await check(true,true,'old-save-with-real-terminal-issue'));assert(!!phases.at(-1).proof.issue,'the terminal issue survives field restoration');await checkpoint('terminal-issue',phases);
  await action('m28-weight',{index:String(t.weights[0])});phases.push(await check(false,false,'extra-weight-invalidates-save'));await action('m28-remove');phases.push(await capture('balanced-again-but-unsaved',false));phases.push(await check(false,false,'removal-does-not-restore-save'));await action('m28-record');phases.push(await check(true,true,'balance-recorded-again'));
  const last=(await model()).board.weights.at(-1);await action('m28-remove');phases.push(await check(false,false,'removed-weight-unbalances'));await action('m28-weight',{index:String(last)});await action('m28-record');phases.push(await check(true,true,'returned-weight-resaved'));
 }
 await field('prose','我保留这次比较或砝码记录；原话待确认。');phases.push(await capture('prose-unsubmitted',false));phases.push(await check(true,true,'prose-rechecked'));
 await retry('native');phases.push(await capture('shared-retry',false));await checkpoint('shared-retry',phases);await solve();phases.push(await check(true,true,'retry-corrected'));await checkpoint('final',phases);return phases;
}
function balanceBoundaryKindsFor(spec){return({'weightstart:1':['first-near-and-unit','thirty-first-weight'],'measurecalc:2':['thirty-first-weight','all-source-combinations','first-underflow-and-spellings']})[spec.id+':'+spec.index]||[];}
async function balanceBoundaryFlow(kind,spec,api){
 const{field,action,solve,model,check,capture,assert}=api,t=spec.task,mass=spec.math.mass,phases=[];
 if(kind==='first-near-and-unit'){
  await solve({raw:mass+'.00000001'});phases.push(await check(true,false,'first-near-original-success'));assert((await model()).board.bad===false,'original near-success is not renamed bad');await saveBalance(api,mass);phases.push(await check(true,true,'first-near-really-resaved'));
  await field('unit','kg');await action('m28-record');phases.push(await check(false,false,'wrong-unit-record'));await field('unit',t.unit);await action('m28-record');phases.push(await check(true,true,'unit-really-resaved'));
 }else if(kind==='thirty-first-weight'){
  await field('unit',t.unit);await saveBalance(api,mass);phases.push(await check(false,false,'finite-first-record-before-balanced'));
  await action('m28-remove');const weights=Array(30).fill(t.weights[0]);for(const amount of weights)await action('m28-weight',{index:String(amount)});await action('m28-record');phases.push(await check(false,false,'thirty-weights-not-the-source-mass'));
  await saveBalance(api,'');phases.push(await check(false,false,'blank-record-before-thirty-first'));await field('measure',String(mass));const before=await model();await action('m28-weight',{index:String(t.weights[0])});const after=await model();
  assert(after.board.weights.length===30&&after.history.length===before.history.length+1&&JSON.stringify(after.board.saved)===JSON.stringify(before.board.saved)&&after.issue==='','the visible 31st button records an event, retains saved work and clears the issue');
  phases.push(await capture('thirty-first-weight-event-without-added-weight',false));phases.push(await check(false,false,'thirty-first-does-not-change-total'));await solve();phases.push(await check(true,true,'weight-limit-history-corrected'));
  assert(phases.at(-1).proof.weights.filter(x=>x.ignoredAtWeightLimit).length===1&&phases.at(-1).proof.construction.firstMeasure.balanced===false,'weight capacity and the original unbalanced first record remain');
 }else if(kind==='all-source-combinations'){
  const solutions=balanceOrderedSolutions(spec);assert(solutions.length===26,'all 26 independently listed ordered solutions');
  for(const [index,weights]of solutions.entries()){await solve({weights});phases.push(await check(true,true,'source-weight-combination-'+index));}
 }else if(kind==='first-underflow-and-spellings'){
  const raw=mass+' 1/'+(10n**400n).toString();
  await solve({raw});phases.push(await check(true,false,'underflow-original-success'));assert((await model()).board.bad===false,'the original finite approximation remains distinct from exact mass');await field('measure',String(mass));phases.push(await capture('underflow-exact-current-unsubmitted',false));await action('m28-record');phases.push(await check(true,true,'underflow-really-resaved'));
  for(const[label,value]of[['fraction',mass*2+'/2'],['mixed',(mass-1)+' 2/2'],['decimal',' 0'+mass+'.000 ']]){await saveBalance(api,value);phases.push(await check(true,true,'exact-record-'+label));}
  await field('unit','kg');await action('m28-record');phases.push(await check(false,false,'wrong-unit-after-exact-records'));await field('unit',t.unit);await action('m28-record');phases.push(await check(true,true,'unit-corrected-after-exact-records'));
  await field('prose','文'.repeat(1200));phases.push(await check(true,true,'1200-prose-saved'));await saveBalance(api,'0'.repeat(1200-String(mass).length)+mass);phases.push(await check(true,true,'1200-numeric-record-saved'));
 }else throw Error('Unknown balance boundary '+kind);return phases;
}
function balanceCapacityModes(){return[
 {id:'compare-clean-0',source:'compareweight',index:0,kind:'clean',prior:0},{id:'compare-equal-1',source:'compareweight',index:1,kind:'clean',prior:1},
 {id:'compare-bad-1',source:'compareweight',index:0,kind:'bad',prior:1},{id:'compare-nochoice-0',source:'compareweight',index:2,kind:'nochoice',prior:0},
 {id:'five-clean-0',source:'weightstart',index:1,kind:'clean',prior:0},{id:'five-bad-1',source:'weightstart',index:1,kind:'bad',prior:1},{id:'five-issue-1',source:'weightstart',index:1,kind:'issue',prior:1},
 {id:'sevenhundred-clean-0',source:'measurecalc',index:2,kind:'clean',prior:0},{id:'sevenhundred-issue-1',source:'measurecalc',index:2,kind:'issue',prior:1},{id:'sevenhundred-unsaved-0',source:'measurecalc',index:2,kind:'unsaved',prior:0}
];}
const balanceModeSpec=mode=>fixture.cases.find(c=>c.id===mode.source&&c.index===mode.index);
const balanceCappedData=(name,spec)=>name==='choice'?{index:spec.math.relation}:name==='weight'?{index:String(spec.task.weights[0])}:{};
const balanceVisibleActions=spec=>spec.task.mode==='compare'?['test','choice']:['weight','remove','record'];
const balanceCapacityGood=mode=>!['nochoice','unsaved'].includes(mode.kind);
const balanceCapacityCheckCount=(mode,spec)=>3+(spec.task.mode==='weigh'?4:2*spec.task.questions.length);
function constructBalanceCapacityFixture(spec,mode,{State,Core,Engine,setField,task}){
 if(!balanceCapacityModes().some(x=>JSON.stringify(x)===JSON.stringify(mode)))throw Error('Unknown cap mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);lesson.index=spec.index;state.lessons[spec.id]=lesson;const m=State.modelForLesson(lesson),apply=s=>{if(s.field){setField(m,s.field,s.value);Engine.fieldExtra(task,m,s.field);}else Engine.actExtra(task,m,s.action,s.data||{});};
 if(mode.kind==='nochoice'){task.questions.forEach((q,i)=>apply({field:'answers.'+i,value:spec.math.lighter}));while(m.history.length<2000)apply({action:'m28-test'});}
 else{
  if(mode.kind==='bad'){
   if(task.mode==='compare'){apply({action:'m28-test'});apply({action:'m28-choice',data:{index:['left','right','equal'].find(x=>x!==spec.math.relation)}});}
   else{apply({field:'measure',value:String(spec.math.mass+1)});apply({field:'unit',value:task.unit});apply({action:'m28-record'});}
  }
  for(const s of balanceOperationPlan(spec,m,{record:mode.kind!=='unsaved'}))apply(s);
  if(mode.kind==='unsaved')apply({field:'measure',value:''});
  const limit=mode.kind==='issue'?1999:2000;while(m.history.length<limit)apply({action:task.mode==='compare'?'m28-test':'m28-record'});
  if(mode.kind==='issue'){apply({field:'measure',value:''});apply({action:'m28-record'});}
  if(['issue','unsaved'].includes(mode.kind))apply({field:'measure',value:String(spec.math.mass)});
 }
 if(mode.prior)State.submitLesson(lesson);State.addLessonNote(lesson,'明确构造的天平历史兼容记录；保留旧提交。');lesson.draft='历史上限兼容草稿。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index};
}
async function balanceCapacityFlow(mode,spec,api){
 const good=balanceCapacityGood(mode),t=spec.task,phases=[await api.capture('at-valid-2000-before-check',!!mode.prior&&good)];await api.assertRetryAvailable(!!mode.prior);
 for(const name of balanceVisibleActions(spec)){await api.cappedAction(name);phases.push(await api.capture('2000-'+name+'-model-noop',!!mode.prior&&good));}
 phases.push(await api.check(good,good,'at-capacity-checked'));
 if(t.mode==='weigh'){
  await api.field('measure',spec.math.mass+'.0');await api.cappedAction('record');phases.push(await api.capture('capped-record-keeps-original-raw-pair',false));phases.push(await api.check(false,false,'equivalent-unsaved-at-capacity'));
  await api.field('measure',String(spec.math.mass));phases.push(await api.capture('saved-spelling-restored-unsubmitted',false));phases.push(await api.check(good,good,'saved-spelling-restored-rechecked'));
  await api.field('unit','kg');await api.cappedAction('record');phases.push(await api.capture('capped-record-keeps-original-unit',false));phases.push(await api.check(false,false,'wrong-unit-at-capacity'));
  await api.field('unit',t.unit);phases.push(await api.capture('saved-unit-restored-unsubmitted',false));phases.push(await api.check(good,good,'saved-unit-restored-rechecked'));
 }else for(let i=0;i<t.questions.length;i++){
  await api.field('answers.'+i,t.questions[i].options.find(x=>x[0]!==spec.math.lighter)[0]);phases.push(await api.check(false,false,'wrong-lighter-at-capacity-'+i));await api.field('answers.'+i,spec.math.lighter);phases.push(await api.capture('lighter-restored-unsubmitted-'+i,false));phases.push(await api.check(good,good,'lighter-restored-rechecked-'+i));
 }
 await api.field('prose','达到上限后保留的当前原话。');phases.push(await api.capture('capacity-prose-unsubmitted',false));phases.push(await api.check(good,good,'capacity-prose-rechecked'));
 await api.reloadCap();phases.push(await api.capture('cap-restored-after-reload',good));await api.retry('capacity-'+mode.id);phases.push(await api.capture('shared-retry-after-capacity',false));await api.solve();phases.push(await api.check(true,true,'capacity-retry-corrected'));return phases;
}
function balanceTextModes(){return[
 {id:'text-compare-prose-0',source:'compareweight',index:0,field:'prose',prior:0},{id:'text-lighter-prose-1',source:'compareweight',index:2,field:'prose',prior:1},
 {id:'text-five-measure-0',source:'weightstart',index:1,field:'measure',prior:0},{id:'text-five-prose-1',source:'weightstart',index:1,field:'prose',prior:1},
 {id:'text-sevenhundred-measure-0',source:'measurecalc',index:2,field:'measure',prior:0},{id:'text-sevenhundred-prose-1',source:'measurecalc',index:2,field:'prose',prior:1}
];}
function constructBalanceTextFixture(spec,mode,{State,Core,Engine,setField,task}){
 if(!balanceTextModes().some(x=>JSON.stringify(x)===JSON.stringify(mode)))throw Error('Unknown text mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);lesson.index=spec.index;state.lessons[spec.id]=lesson;const m=State.modelForLesson(lesson),apply=s=>{if(s.field){setField(m,s.field,s.value);Engine.fieldExtra(task,m,s.field);}else Engine.actExtra(task,m,s.action,s.data||{});};
 for(const s of balanceOperationPlan(spec,m))apply(s);const short=mode.field==='prose'?'文':String(m[mode.field]),raw=mode.field==='prose'?'文'.repeat(1200):'0'.repeat(1200-short.length)+short;
 apply({field:mode.field,value:raw});if(mode.field==='measure')apply({action:'m28-record'});if(mode.prior)State.submitLesson(lesson);State.addLessonNote(lesson,'明确构造的天平文字边界记录。');lesson.draft='1201写入之前的原草稿。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index};
}
async function balanceTextFlow(mode,spec,api){
 const strict=!!mode.prior,phases=[await api.capture('1200-before-block',strict)];await api.assertRetryAvailable(strict);await api.overlongText(mode.field,(await api.model())[mode.field]+'1');phases.push(await api.capture('1201-text-write-blocked',strict));
 for(const name of['check',...balanceVisibleActions(spec),...(mode.prior?['retry']:[])]){await api.blockedAction(name);phases.push(await api.capture('blocked-visible-'+name,strict));}
 await api.blockedField('prose','写入已停止');phases.push(await api.capture('blocked-visible-text-field',strict));await api.reloadBlocked();phases.push(await api.capture('1200-restored-after-reload',strict));
 if(!mode.prior)phases.push(await api.check(true,true,'zero-attempt-real-check-before-retry'));await api.retry('text-'+mode.id);phases.push(await api.capture('retry-after-text-block',false));await api.solve();phases.push(await api.check(true,true,'text-retry-corrected'));return phases;
}
function balanceLegacyModes(){return[
 {id:'practice-pending-0',source:'compareweight',index:0,kind:'practice',prior:0},
 {id:'practice-pending-2',source:'compareweight',index:2,kind:'practice',prior:2},
 {id:'numeric-five',source:'weightstart',index:1,kind:'numeric',prior:1},
 {id:'numeric-sevenhundred',source:'measurecalc',index:2,kind:'numeric',prior:1}
];}
function constructBalanceLegacyFixture(spec,mode,{State,Core,Engine,setField,task}){
 if(!balanceLegacyModes().some(x=>JSON.stringify(x)===JSON.stringify(mode)))throw Error('Unknown legacy mode');
 const state=Core.fresh(),lesson=State.freshLesson(spec.id);state.lessons[spec.id]=lesson;
 const fill=(c,m,options)=>{for(const step of balanceOperationPlan(c,m,options))if(step.field){setField(m,step.field,step.value);Engine.fieldExtra(c.task,m,step.field);}else Engine.actExtra(c.task,m,step.action,step.data||{});};
 if(mode.kind==='practice'){
  for(let index=0;index<mode.prior;index++){const c=fixture.cases.find(x=>x.id===spec.id&&x.index===index);lesson.index=index;const m=State.modelForLesson(lesson);fill(c,m);State.submitLesson(lesson);}
  const c=fixture.practice[0];lesson.view='play';const m=State.modelForLesson(lesson);fill(c,m);
 }else{
  lesson.index=spec.index;const m=State.modelForLesson(lesson),positive='0 '+spec.math.mass+'/1',negative='-0 '+spec.math.mass+'/1';fill(spec,m,{raw:positive});
  const legacy=JSON.parse(JSON.stringify(m,(_key,value)=>value===positive?negative:value));lesson.models[spec.index]=legacy;
  lesson.cases[spec.index]={support:true,attempts:[{id:'balance-legacy-'+mode.id,at:'2026-11-16T00:00:00.000Z',value:structuredClone(legacy),supported:true,exposed:false}]};
 }
 State.addLessonNote(lesson,'明确构造的原天平兼容记录；旧作品和旧提交分别保留。');lesson.draft='兼容记录中的原草稿。';
 return{state,mode,constructedCompatibilityFixture:true,constructedSubmissions:mode.prior,constructedPosition:spec.index};
}
// A complete cap proof is intentionally large. Archive each full capture once;
// every occurrence in the report retains an explicit, hashed reference to it.
// The original in-memory rows, raw/State files and all validation stay intact.
function writeBalanceReport(outputDirectory,value){
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 assert.ok(Array.isArray(value.captures));const references=new WeakMap(),entries=[];
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
 const indexed=JSON.parse(JSON.stringify(value,(_key,item)=>{
  const archived=item&&typeof item==='object'?references.get(item):null;
  if(!archived)return item;archived.entry.references++;return archived.reference;
 }));
 assert.ok(entries.every(entry=>entry.references>0));
 indexed.captureArchive={version:1,format:'balance-full-capture-sidecars',completeCaptureCount:entries.length,
  fullCaptureBytes:entries.reduce((sum,entry)=>sum+entry.bytes,0),entries};
 const body=Buffer.from(JSON.stringify(indexed,null,2)+'\n'),filename=path.join(outputDirectory,'results.json');
 fs.writeFileSync(filename,body);assert.ok(fs.readFileSync(filename).equals(body));
 return{file:'results.json',sha256:digest(body),bytes:body.length,completeCaptureCount:entries.length,fullCaptureBytes:indexed.captureArchive.fullCaptureBytes};
}
module.exports={balanceLegacyModes,constructBalanceLegacyFixture,orderedBalanceTargets,balanceOperationPlan,balanceOrderedSolutions,balanceNativeFlow,balanceNativeCheckCount,balanceNativeCaptureCount,balanceBoundaryKindsFor,balanceBoundaryFlow,balanceCapacityModes,balanceModeSpec,balanceCappedData,balanceVisibleActions,balanceCapacityGood,balanceCapacityCheckCount,constructBalanceCapacityFixture,balanceCapacityFlow,balanceTextModes,constructBalanceTextFixture,balanceTextFlow,writeBalanceReport};

async function main(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-balance-adapter');fs.mkdirSync(out,{recursive:true});
 const {cases,associated,practice}=fixture,targets=orderedBalanceTargets(),viewports=[[1440,900],[1280,720]];
 const checks=[],errors=[],remote=[],observations=[],isolated=[],boundaries=[],forgeries=[],backups=[],offline=[],preparations=[],retries=[],navigations=[],checkedLedger=[],captures=[],visuals=[],capacity=[],textLimits=[];
 const cp=structuredClone,digest=value=>crypto.createHash('sha256').update(value).digest('hex');
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
 const hash=value=>digest(JSON.stringify(stable(value))),ok=(value,message,detail={})=>{assert.ok(value,message);checks.push({message,...detail});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const sourceFiles=['dist/learning/balance-evidence.js','dist/learning/scale-evidence.js','dist/learning/thinking-feedback.js','dist/learning/evidence-adapters.js','dist/exploration-core.js','tests/p9-balance-adapter-browser.cjs','tests/fixtures/p9-balance-cases.cjs','tests/p9-balance-evidence.test.mjs','tests/fixtures/p9-balance-navigation.cjs','tests/p9-balance-navigation.test.mjs',...Object.keys({...fixture.sourceHashes,...navigationFixture.sourceHashes})];
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),nodeVersion:process.version,cache,
  sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),childTrial:false,independentTeachingReview:false,nativeSourceSeededCorrectWork:false,nativeSourceSeededLessonPositions:false,
  syntheticCompatibilityFixturesAreChildRecords:false,nativeBackupImportsCompleted:0,compatibilityImportsCompleted:0,corruptImportsRejected:0};
 const {ensureB39Ready,prepareSessionRuntime}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();await prepareSessionRuntime('strategy39',{view:true});
 const {sessionTaskFor,BRIDGES}=await import('../dist/learning/bridges.js'),M=await import('../dist/learning/phase5/b28-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js'),{setField}=await import('../dist/learning/phase4/ui.js');
 const {thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 const {scaleBinding,replayScaleEvidence}=await import('../dist/learning/scale-evidence.js');
 const State=await import('../dist/learning/state.js'),Core=await import('../dist/exploration-core.js'),{studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const {balanceBinding:binding,replayBalanceEvidence:replay}=await import('../dist/learning/balance-evidence.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const taskFor=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index}),originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const lessonFrom=(value,c)=>Object.hasOwn(BRIDGES,c.id)?value.daily.bridges[c.id]:value.lessons[c.id];
 for(const c of[...cases,...associated,...practice])assert.equal(hash(taskFor(c)),c.taskHash);
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(path.join(root,file))),sha,file);
 const artifactPaths=new Set(),uniqueFile=name=>{assert.ok(!artifactPaths.has(name),'one immutable raw artifact: '+name);artifactPaths.add(name);return path.join(out,name);};
 fs.writeFileSync(uniqueFile('fixed-source-cases.json'),JSON.stringify(fixture,null,2));fs.writeFileSync(uniqueFile('fixed-navigation.json'),JSON.stringify(navigationFixture,null,2));
 let browser,server,activePage,label='setup';const openContexts=new Set(),diagnostics=new Map();
 const report=()=>({provenance,viewports,checks,errors,remote,observations,isolated,boundaries,forgeries,backups,offline,preparations,retries,navigations,checkedLedger,captures,visuals,capacity,textLimits,
  nativeTasks:6,nativeNodes:3,associatedTasks:4,practiceCompatibilityPositions:1,targets:10,sessions:6,childTrial:false,independentTeachingReview:false});
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});provenance.browserVersion=browser.version();
  for(const[width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
   server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   const profiles=[];
   for(const role of['source','native-restore-target',...balanceLegacyModes().map(m=>'constructed-legacy-'+m.id),...balanceCapacityModes().map(m=>'constructed-cap-'+m.id),...balanceTextModes().map(m=>'constructed-'+m.id)]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:'allow'});openContexts.add(context);
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
    if(t.type==='x-m28-balance'){
     if(before.history.length<2000){assert.equal(after.history.length,before.history.length+1);assert.deepEqual(after.history.slice(0,-1),before.history);assert.equal(after.history.at(-1).a,name.replace(/^m28-/,''));}
     else assert.deepEqual(after,before,'original capped actions leave the entire model unchanged');
    }
    return after;
   };
   const solve=async(c,options)=>{for(const step of balanceOperationPlan(c,await model(c),options))step.field?await field(c,step.field,step.value):await action(c,step.action,step.data);};
   const visual=async(c,phase)=>{
    const task=taskFor(c),m=await model(c),board=page.locator('.m28-world svg');assert.equal(await board.count(),1);await board.scrollIntoViewIfNeeded();assert.equal(await board.isVisible(),true);
    const box=await board.boundingBox();assert.ok(box&&box.width>150&&box.height>50);
    const displayed=await board.evaluate(el=>({viewBox:el.getAttribute('viewBox'),label:el.getAttribute('aria-label'),
     rectangles:[...el.querySelectorAll('rect')].map(node=>{const box=node.getBoundingClientRect();return{x:Number(node.getAttribute('x')),y:Number(node.getAttribute('y')),width:Number(node.getAttribute('width')),height:Number(node.getAttribute('height')),fill:node.getAttribute('fill'),visibleWidth:box.width,visibleHeight:box.height};}),
     lines:[...el.querySelectorAll('line')].map(node=>({x1:Number(node.getAttribute('x1')),x2:Number(node.getAttribute('x2')),y1:Number(node.getAttribute('y1')),y2:Number(node.getAttribute('y2'))}))}));
    assert.equal(displayed.viewBox,'0 0 760 340');assert.equal(displayed.label,'天平，较重一侧下降，平衡表示两侧相等');
    const left=c.math.shape==='compare'?c.math.leftMass:c.math.mass,right=c.math.shape==='compare'?c.math.rightMass:m.board.weights.reduce((a,b)=>a+b,0);
    const delta=task.mode==='weigh'||m.board.tested?Math.sign(left-right):0,yl=150+31*delta,yr=150-31*delta;
    assert.deepEqual(displayed.lines,[{x1:175,x2:585,y1:yl,y2:yr},{x1:175,x2:175,y1:yl,y2:yl+70},{x1:585,x2:585,y1:yr,y2:yr+70}]);
    const objects=task.mode==='compare'?[task.left,task.right]:[{name:task.object||'物体',size:30}];assert.equal(displayed.rectangles.length,objects.length);
    objects.forEach((o,index)=>{const size=o.size||32,x=index?585:175,y=task.mode==='compare'&&!m.board.tested?100:(index?yr:yl)+70;
     for(const[key,value]of Object.entries({x:x-size,y:y-38-size,width:size*2,height:size*2}))assert.equal(displayed.rectangles[index][key],value);
    });
    const texts=await board.locator('text').allTextContents();
    assert.deepEqual(texts,task.mode==='compare'?[task.left.name,task.right.name]:[task.object||'物体',m.board.weights.length?m.board.weights.join(' + '):'还没有放',task.unit]);
    assert.ok(displayed.rectangles.every(r=>r.visibleWidth>0&&r.visibleHeight>0),'the actual source objects have positive visible area');
    const file=label+'-visual-'+phase+'.png',bytes=await board.screenshot({path:uniqueFile(file)});
    const pixels=await page.evaluate(async encoded=>{
     const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),image=new OffscreenCanvas(bitmap.width,bitmap.height),context=image.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();
     const raw=context.getImageData(0,0,image.width,image.height).data,colors=new Set();let min=255,max=0;
     for(let i=0;i<raw.length;i+=4){const r=raw[i],g=raw[i+1],b=raw[i+2];colors.add((r>>4)*256+(g>>4)*16+(b>>4));min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);}
     return{width:image.width,height:image.height,quantizedColors:colors.size,channelRange:max-min};
    },bytes.toString('base64'));
    assert.ok(pixels.quantizedColors>=6&&pixels.channelRange>40,'the actual screenshot contains rendered beam, source objects and chosen addends');
    const item={width,height,id:c.id,index:c.index,label,phase,file,sha256:digest(bytes),bytes:bytes.length,box,pixels,displayed,model:m};visuals.push(item);return item;
   };
   const capture=async(c,phase,strict,{role,checked=false}={})=>{
    const raw=await rawSnapshot(phase),lesson=lessonFrom(raw.decodedState,c),m=lesson.models[c.index],record=lesson.cases[c.index]||null,task=taskFor(c),proof=replay(task,m);
    assert.equal(Tasks.validModel(task,m),true);const expectedFeedback=thinkingFeedback(task,m,record,ctx(c)),native=!!binding(task,ctx(c));
    assert.equal(native&&!!expectedFeedback,strict);if(role!=='prerequisite')assert.equal(!!expectedFeedback,strict);
    else{const prep=navigationFixture.navigation.find(x=>x.id===c.id&&x.index===c.index);assert.ok(prep);assert.equal(!!expectedFeedback,prep.existingOtherFeedback);if(c.id==='measurecalc'&&c.index===1){assert.ok(scaleBinding(task,ctx(c)));const scale=replayScaleEvidence(task,m);assert.equal(scale.construction.record.raw,'12.7');assert.equal(scale.construction.record.unit,'cm');assert.equal(scale.construction.currentQuestions[0].quantity.text,'127');assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(expectedFeedback.method,null);}}
    assert.equal(await hint.count(),expectedFeedback?1:0);if(expectedFeedback)assert.equal(await hint.isVisible(),true);const words=expectedFeedback?await hint.innerText():null;
    if(strict){
     assert.ok(proof&&native);assert.deepEqual(record.attempts.at(-1).value,m);assert.equal(expectedFeedback.method,null);
     assert.ok(words.includes(proof.shape==='compare'?'图中没有显示物体的质量读数':'实际保存的数量原文'));assert.doesNotMatch(words,/MP\.\d/);assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);
     if(proof.shape==='weigh')assert.ok(words.includes(proof.construction.record.raw)&&words.includes(proof.construction.record.unit));else assert.ok(words.includes(task.left.name)&&words.includes(task.right.name));
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
      const checked=await check(previous,true,false,'navigation-prerequisite-'+at,'prerequisite');preparations.push({width,height,...prep,checked,strictBalanceCoverage:false});
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
     const moduleNames=[...new Set(['storage.js','v2.html','learn.html','exploration.js','exploration-core.js','data/atlas.json','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/balance-evidence.js','learning/p3-workflow.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','vendor/three/three.module.min.js','vendor/three/OrbitControls.js',...sourceFiles.filter(file=>file.startsWith('dist/')).map(file=>file.slice(5))])];
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
    const phases=await balanceBoundaryFlow(kind,c,api(c,'boundary'));await reload(c);assert.deepEqual(await model(c),phases.at(-1).model);assert.equal(await hint.isVisible(),true);
    const rendered=await visual(c,'final'),screenshot=await shot('boundary');boundaries.push({width,height,kind,id:c.id,index:c.index,phases,rendered,screenshot,constructedCompatibilityFixture:false});
   };
   const runNative=async c=>{
    label=prefix+'-'+c.id+'-'+c.index;await open(c);assert.equal(binding(taskFor(c),ctx(c))?.nodeId,c.nodeId);
    assert.equal(await guide.isVisible(),true);assert.equal(await guide.evaluate(e=>e.open),false);assert.equal(await hint.count(),0);const before=await current(c),images={initial:await visual(c,'initial')};
    await guide.locator(':scope > summary').click();assert.equal(await guide.locator('p').isVisible(),true);
    await page.waitForFunction(async({id,index})=>{const{readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;},c);
    await guide.locator(':scope > summary').click();const supported=await current(c);assert.deepEqual(supported.model,before.model);assert.equal(supported.record.attempts.length,0);
    const phases=await balanceNativeFlow(c,{...api(c,'native'),checkpoint:async(stage,items)=>{
     if(['tested','terminal-issue'].includes(stage))images[stage]=await visual(c,stage);
     if(stage==='correct-unsubmitted')assert.equal(await hint.count(),0);
     if(stage==='corrected'){images.corrected=await visual(c,'corrected');await shot('corrected');await reload(c);assert.equal(await hint.isVisible(),true);assert.deepEqual(await model(c),items.at(-1).model);assert.notEqual(images.corrected.sha256,images.initial.sha256);}
     if(stage==='shared-retry'){await reload(c);assert.equal(await hint.count(),0);images[stage]=await visual(c,stage);}
     if(stage==='final'){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);images.final=await visual(c,'retry-corrected');}
    }});
    const final=phases.at(-1),actual=phases.filter(x=>x.checked);assert.equal(actual.length,balanceNativeCheckCount(c));assert.equal(phases.length,balanceNativeCaptureCount(c));assert.deepEqual(final.record.attempts,actual.map(x=>x.attempt));
    for(const kind of['extra-root','extra-event','false-issue','hidden-offset','hidden-estimate','hidden-error','hidden-values','foreign-action']){
     const forged=cp(final.model),task=taskFor(c);
     if(kind==='extra-root')forged.unrecorded=1;else if(kind==='extra-event')forged.history[0].unrecorded=1;else if(kind==='false-issue')forged.issue='not the recorded issue';
     else if(kind==='hidden-offset')forged.offset='2.0';else if(kind==='hidden-estimate')forged.estimate='1';else if(kind==='hidden-error')forged.error='1';else if(kind==='hidden-values')forged.values=['1'];else M.act(task,forged,'m28-help');
     assert.equal(replay(task,forged),null);forgeries.push({width,height,id:c.id,index:c.index,kind,counterfactual:true,actualBrowserAction:false,model:forged,originalValid:M.valid(task,forged),strict:false});
    }
    observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,taskHash:c.taskHash,phases,images});for(const kind of balanceBoundaryKindsFor(c))await runBoundary(c,kind);
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
   assert.equal(sourceRows.length,123);assert.equal(sourceCaptures.length,178);const positions=[...new Set(sourceRows.map(x=>x.id+':'+x.index))];assert.equal(positions.length,12);
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
   assert.ok((await importFile(restorePage,actual.payload,'balance-identical-repeat-v2.json')).includes('备份已合并'));const repeated=await read(restorePage);assert.equal(repeated.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),actual.backup.state);
   const repeatedImportStorage=storageOnly(await rawSnapshot('repeated-import',restorePage));provenance.nativeBackupImportsCompleted++;
   assert.ok(!(await importFile(restorePage,'{','balance-corrupt-native.json')).includes('备份已合并'));assert.equal((await read(restorePage)).raw,imported.raw);
   const corruptImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected',restorePage));provenance.corruptImportsRejected++;
   const last=cases.at(-1);await navigate(last,restorePage);assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredReload=await restorePage.reload();assert.equal(restoredReload?.fromServiceWorker(),true);await wait(last,restorePage);keepRecords(actual.backup.state,originalState(await state(restorePage)));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredStorage=storageOnly(await rawSnapshot('restored-lesson',restorePage)),restoredScreenshot=await shot('restored',restorePage);
   backups.push({width,height,kind:'actual-browser-v2',backupFile:actual.file,bytes:actual.bytes,backupSha256:actual.sha256,originalState:actual.backup.state,
    emptyBeforeImport,firstImportStorage,repeatedImportStorage,corruptImportStorage,restoredStorage,exportedScreenshot,restoredScreenshot,sourceCaptureMap,
    independentEmptyContext:true,originStopped:!server.listening,wholeStateFirstImportExact:true,repeatByteIdempotent:true,corruptRejectedWithoutWrite:true,checked:123,currentModelCaptures:178,positions:12});

   // Four separate, explicitly constructed compatibility contexts. Their old
   // records never seed the ordinary source route or count as native UI checks.
   for(const mode of balanceLegacyModes()){
    const profile=profiles.find(p=>p.role==='constructed-legacy-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-'+contextRole;
    const c=balanceModeSpec(mode),task=taskFor(c),fixture=constructBalanceLegacyFixture(c,mode,{State,Core,Engine,setField,task});originalState(fixture.state);
    const payload=JSON.stringify(Core.backup(fixture.state)),file=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(file),payload);
    const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
    const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
    assert.ok((await importFile(page,payload,file)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;
    const importedStorage=storageOnly(await rawSnapshot('first-import'));
    assert.ok((await importFile(page,payload,'balance-repeat-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;const repeatedStorage=storageOnly(await rawSnapshot('repeat-import'));
    assert.ok(!(await importFile(page,'{','balance-corrupt-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;const rejectedImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected'));
    await navigate(c);const before=await current(c),openedStorage=storageOnly(await rawSnapshot('opened-original-record'));let preservedExport=null,phases=[];
    assert.deepEqual(before.lesson.cases,fixture.state.lessons[c.id].cases);assert.deepEqual(before.lesson.notes,fixture.state.lessons[c.id].notes);assert.equal(before.lesson.draft,fixture.state.lessons[c.id].draft);
    if(mode.kind==='practice'){
     assert.deepEqual(before.lesson.models[-1],fixture.state.lessons[c.id].models[-1]);assert.equal(before.record?.attempts?.length??0,0);assert.equal(State.currentSubmission(before.lesson).status,'unsubmitted');assert.equal(await hint.count(),0);
     if(mode.index===2)assert.deepEqual(before.model,before.lesson.models[-1]);else{const initial=Tasks.defaultModel(task);initial.seed=before.model.seed;assert.deepEqual(before.model,initial);assert.notDeepEqual(before.model,before.lesson.models[-1]);}
     phases.push(await capture(c,'legacy-practice-opened-unsubmitted',false,{role:'legacy'}));
     if(mode.index===2)phases.push(await check(c,true,true,'real-check-after-practice-copy','legacy'));
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
     backupFile:final.file,bytes:final.bytes,backupSha256:final.sha256,originalState:final.backup.state,preservedExport,phases,captureMap,rendered,screenshot,importedConstructedSubmissions:mode.prior,actualUIChecksAfterImport:mode.kind==='numeric'||mode.index===2?1:0,independentContext:true,originStopped:!server.listening});
   }
   for(const mode of balanceCapacityModes()){
    const profile=profiles.find(p=>p.role==='constructed-cap-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');
    label=prefix+'-constructed-cap-'+mode.id;const c=balanceModeSpec(mode),task=taskFor(c),fixture=constructBalanceCapacityFixture(c,mode,{Tasks,State,Core,Engine,setField,task});
    originalState(fixture.state);assert.equal(fixture.state.lessons[c.id].models[c.index].history.length,2000);
    const fixturePayload=JSON.stringify(Core.backup(fixture.state)),fixtureFile=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(fixtureFile),fixturePayload);
    const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
    const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
    assert.ok((await importFile(page,fixturePayload,fixtureFile)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;
    const importedStorage=storageOnly(await rawSnapshot('imported-fixture'));
    assert.ok((await importFile(page,fixturePayload,'balance-identical-'+mode.id+'-v2.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;
    const repeatedStorage=storageOnly(await rawSnapshot('repeated-fixture'));
    const invalid=cp(fixture.state);invalid.lessons[c.id].models[c.index].history.push(cp(invalid.lessons[c.id].models[c.index].history.at(-1)));assert.equal(invalid.lessons[c.id].models[c.index].history.length,2001);assert.equal(M.valid(task,invalid.lessons[c.id].models[c.index]),false);
    const invalidPayload=JSON.stringify({...Core.backup(fixture.state),state:invalid});
    assert.ok(!(await importFile(page,invalidPayload,'balance-invalid-2001-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;
    const rejectedImportStorage=storageOnly(await rawSnapshot('invalid-2001-import-rejected'));await navigate(c);
    const actionMetadata=[];
    const phases=await balanceCapacityFlow(mode,c,{...api(c,'capacity'),
     reloadCap:async()=>{await reload(c);},
     assertRetryAvailable:async expected=>assert.equal(await page.locator('[data-do="p3-retry"]').count(),expected?1:0,'zero-attempt fixture does not invent a retry button'),
     cappedAction:async name=>{const before=await current(c),raw=await read(page);await action(c,'m28-'+name,balanceCappedData(name,c));const after=await current(c),changed=await read(page);assert.deepEqual(after.model,before.model);assert.equal(await page.locator('#storage-warning').isVisible(),false);assert.deepEqual(after.record?.attempts||[],before.record?.attempts||[]);
      if(before.model.board.bad||before.model.issue)assert.equal(after.record.support,true);
      assert.notEqual(after.lesson.updatedAt,before.lesson.updatedAt,'the original successful update still writes its timestamp');assert.notEqual(changed.raw,raw.raw,'a model noop is not a raw-storage no-write');
      actionMetadata.push({name,beforeUpdatedAt:before.lesson.updatedAt,afterUpdatedAt:after.lesson.updatedAt,beforeSupport:before.record?.support??null,afterSupport:after.record?.support??null,modelUnchanged:true,rawChanged:true,attemptsUnchanged:true});
     }
    });
    const rendered=await visual(c,'after-capacity-retry'),screenshot=await shot('recovered'),final=await downloadBackup('recovered-v2'),rows=captures.filter(x=>x.width===width&&x.contextRole===contextRole),captureMap=mapCaptures(rows,final.backup.state);
    const currentLesson=lessonFrom(final.backup.state,c);assert.deepEqual(currentLesson.notes,fixture.state.lessons[c.id].notes);assert.equal(currentLesson.draft,fixture.state.lessons[c.id].draft);
    assert.equal(currentLesson.cases[c.index].attempts.length,fixture.constructedSubmissions+balanceCapacityCheckCount(mode,c));assert.deepEqual(currentLesson.cases[c.index].attempts.slice(0,mode.prior),fixture.state.lessons[c.id].cases[c.index]?.attempts||[]);
    const item={width,height,mode,id:c.id,index:c.index,contextRole,constructedCompatibilityFixture:true,constructedSubmissions:fixture.constructedSubmissions,
     fixtureFile,fixtureSHA256:digest(fixturePayload),emptyStorage,importedStorage,repeatedStorage,rejectedImportStorage,phases,captureMap,actionMetadata,rendered,screenshot,
     actualUIChecksAfterImport:balanceCapacityCheckCount(mode,c),actualSharedRetries:1,wholeModelUnchangedByCappedAction:true,controllerMetadataStillWritten:true,currentRawAndUnitMustStillMatchSavedPair:true,documentReloadPerformedForCap:true,documentReloadRequiredForCap:false,
     zeroAttemptNeedsCheckBeforeRetry:mode.prior===0,nativeHandEnteredHistory:false,backupFile:final.file,backupSha256:final.sha256,originalState:final.backup.state};
    capacity.push(item);backups.push({...item,kind:'constructed-capacity-final-v2'});
   }
   for(const mode of balanceTextModes()){
    const profile=profiles.find(p=>p.role==='constructed-'+mode.id);contextRole=profile.role;page=profile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-constructed-'+mode.id;
    const c=balanceModeSpec(mode),task=taskFor(c),fixture=constructBalanceTextFixture(c,mode,{State,Core,Engine,setField,task});originalState(fixture.state);
    const fixturePayload=JSON.stringify(Core.backup(fixture.state)),fixtureFile=label+'-fixture-v2.json';fs.writeFileSync(uniqueFile(fixtureFile),fixturePayload);
    const response=await page.reload();assert.equal(response?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();const empty=originalState(await state());assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});const emptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
    assert.ok((await importFile(page,fixturePayload,fixtureFile)).includes('备份已合并'));const imported=await read(page);assert.deepEqual(originalState(JSON.parse(imported.text)),fixture.state);provenance.compatibilityImportsCompleted++;const importedStorage=storageOnly(await rawSnapshot('imported-fixture'));
    assert.ok((await importFile(page,fixturePayload,'balance-identical-'+mode.id+'-v2.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.compatibilityImportsCompleted++;const repeatedStorage=storageOnly(await rawSnapshot('repeated-fixture'));
    const invalid=cp(fixture.state);invalid.lessons[c.id].models[c.index].prose='文'.repeat(1201);assert.equal(M.valid(task,invalid.lessons[c.id].models[c.index]),false);const invalidPayload=JSON.stringify({...Core.backup(fixture.state),state:invalid});
    assert.ok(!(await importFile(page,invalidPayload,'balance-invalid-1201-'+mode.id+'.json')).includes('备份已合并'));assert.equal((await read(page)).raw,imported.raw);provenance.corruptImportsRejected++;const rejectedImportStorage=storageOnly(await rawSnapshot('invalid-1201-import-rejected'));await navigate(c);
    let persisted,beforeBlock;const images=[],blockedActions=[];
    const phases=await balanceTextFlow(mode,c,{...api(c,'text-limit'),assertRetryAvailable:async expected=>assert.equal(await page.locator('[data-do="p3-retry"]').count(),expected?1:0),
     overlongText:async(key,value)=>{persisted=await read(page);beforeBlock=await current(c);const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.getAttribute('maxlength'),null);await control.fill(value);
      assert.equal(await page.locator('#storage-warning').isVisible(),true);assert.ok((await page.locator('#storage-warning').innerText()).includes('已停止覆盖原记录'));assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);images.push(await shot('1201-blocked'));
     },
     blockedAction:async name=>{const selector=['check','retry'].includes(name)?(name==='check'?'#actions [data-do="check"]':'[data-do="p3-retry"]'):'[data-x="m28-'+name+'"]'+Object.entries(balanceCappedData(name,c)).map(([key,value])=>'[data-'+key+'="'+value+'"]').join(''),control=page.locator(selector);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);await control.click();assert.equal((await read(page)).raw,persisted.raw);assert.deepEqual(await current(c),beforeBlock);blockedActions.push({name,actualVisibleControl:true,rawUnchanged:true,modelUnchanged:true});},
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
  assert.equal(errors.length,0);assert.equal(remote.length,0);assert.equal(observations.length,12);assert.equal(forgeries.length,96);assert.equal(preparations.length,4);assert.equal(navigations.length,12);
  assert.equal(isolated.filter(x=>x.kind==='associated').length,8);assert.equal(isolated.filter(x=>x.kind==='old-practice-compatibility').length,4);assert.equal(isolated.filter(x=>x.kind==='numeric-legacy-compatibility').length,4);assert.equal(boundaries.length,10);assert.equal(capacity.length,20);assert.equal(textLimits.length,12);
  const sourceChecked=checkedLedger.filter(x=>x.contextRole==='source'),sourceCaptures=captures.filter(x=>x.contextRole==='source'),capacityChecked=checkedLedger.filter(x=>x.role==='capacity'),capacityCaptures=captures.filter(x=>x.role==='capacity'),textChecked=checkedLedger.filter(x=>x.role==='text-limit'),textCaptures=captures.filter(x=>x.role==='text-limit'),legacyChecked=checkedLedger.filter(x=>x.role==='legacy'),legacyCaptures=captures.filter(x=>x.role==='legacy');
  assert.equal(sourceChecked.length,246);assert.equal(sourceCaptures.length,356);assert.equal(capacityChecked.length,112);assert.equal(capacityCaptures.length,294);assert.equal(textChecked.length,18);assert.equal(textCaptures.length,128);assert.equal(legacyChecked.length,6);assert.equal(legacyCaptures.length,18);
  assert.equal(checkedLedger.length,382);assert.equal(captures.length,796);assert.equal(retries.filter(x=>x.contextRole==='source').length,22);assert.equal(retries.length,54);
  assert.ok(sourceChecked.every(x=>!x.constructedCompatibilityFixture));assert.ok([...capacityChecked,...textChecked,...legacyChecked].every(x=>x.constructedCompatibilityFixture));
  assert.equal(backups.filter(x=>x.kind==='actual-browser-v2').length,2);assert.equal(backups.filter(x=>x.kind==='constructed-practice-final-v2').length,4);assert.equal(backups.filter(x=>x.kind==='constructed-numeric-final-v2').length,4);assert.equal(backups.filter(x=>x.kind==='constructed-capacity-final-v2').length,20);assert.equal(backups.filter(x=>x.kind==='constructed-text-limit-final-v2').length,12);
  assert.equal(provenance.nativeBackupImportsCompleted,4);assert.equal(provenance.compatibilityImportsCompleted,80);assert.equal(provenance.corruptImportsRejected,42);
  const attemptCounts=Object.fromEntries(['native','boundary','associated','prerequisite','capacity','text-limit','legacy'].map(role=>[role,checkedLedger.filter(x=>x.role===role).length]));
  assert.deepEqual(attemptCounts,{native:136,boundary:98,associated:8,prerequisite:4,capacity:112,'text-limit':18,legacy:6});
  const checkedPaths=checkedLedger.flatMap(x=>[x.storage.raw,x.storage.state]),capturePaths=captures.flatMap(x=>[x.storage.raw,x.storage.state]);assert.equal(new Set(checkedPaths).size,764);assert.equal(new Set(capturePaths).size,1592);
  fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(provenance,null,2));writeBalanceReport(out,{...report(),attemptCounts,uniqueCheckedFiles:764,uniqueCaptureFiles:captures.length*2,originStopped:offline.every(x=>x.originStopped)});
  console.log('P9_BALANCE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:6,taskViewportPairs:12,sourceChecked:246,compatibilityChecked:136,checked:382,sourceCaptures:356,capacityCaptures:capacityCaptures.length,textCaptures:128,legacyCaptures:18,captures:captures.length,oldPractice:4,numericLegacy:4,sourceRetries:22,compatibilitySharedRetries:32,actualNumericRetries:4,next:12,forgeries:96,nativeBackups:2,compatibilityBackups:40,visuals:visuals.length}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(reason=>({diagnosticError:String(reason)})):null;
  if(activePage){await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.html'),await activePage.content().catch(()=>''));}
  writeBalanceReport(out,{...report(),error:String(error),stack:error.stack,at:label,diagnosticFile});console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const context of openContexts)await context.close();if(browser)await browser.close();
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
