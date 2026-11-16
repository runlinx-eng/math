// Fixed, reviewed integer constructions are instructions for visible controls.
// This module never installs solved native models into the browser. Deliberately
// constructed old-backup fixtures are separately labelled compatibility data.
function operationPlan(spec,model={board:{selected:[]}}){
 const steps=[];
 if(spec.type==='x-m33-coins')for(const counts of spec.plan){
  steps.push({action:'m33-clear'});
  counts.forEach((n,index)=>{for(let j=0;j<n;j++)steps.push({action:'m33-add',index});});
  steps.push({action:'m33-save'});
 }else{
  for(const index of model.board.selected)if(!spec.plan.includes(index))steps.push({action:'m33-choose',index});
  for(const index of spec.plan)if(!model.board.selected.includes(index))steps.push({action:'m33-choose',index});
 }
 spec.answers.forEach((value,index)=>steps.push({field:'answers.'+index,value}));
 return steps;
}
const fixture=require('./fixtures/p9-money-cases.cjs');
const navigationFixture=require('./fixtures/p9-money-navigation.cjs');
function orderedMoneyTargets(){
 const selected=[...fixture.cases.map(c=>({...c,role:'native'})),...fixture.associated.map(c=>({...c,role:'associated'}))];
 return[...new Set(selected.map(c=>c.id))].flatMap(id=>selected.filter(c=>c.id===id).sort((a,b)=>a.index-b.index));
}
const boundaryKinds=['save-limit','coin-limit','duplicate-distinct','terminal-failed-save','minimum-correction','budget-subsets','history-limit'];
function moneyBoundaryKindsFor(spec){return boundaryKinds.filter(kind=>{
 const id=kind==='duplicate-distinct'?'coincombo':kind==='minimum-correction'?'austrans':kind==='budget-subsets'?'budgetchoices':'poundnotation';
 return spec.id===id&&spec.index===(kind==='minimum-correction'?2:0);
});}
// Every original subset is checked once. The original valid [0,1] selection is
// last, so the latest current work can use Next without an extra submission.
const budgetMaskOrder=()=>[...Array.from({length:32},(_,i)=>i).filter(i=>i!==3),3];
async function moneyNativeFlow(spec,{task,field,action,solve,check,capture,retry,checkpoint,assert}){
 const phases=[];
 if(task.type==='x-m33-coins')await action('m33-save');else await action('m33-choose',spec.plan[0]);
 if(task.questions.length){const q=task.questions[0],wrong=q.options?q.options.find(([value])=>value!==spec.answers[0])[0]:'999999';await field('answers.0',wrong);}
 phases.push(await check(false,false,'wrong'));
 await field('prose','我保留原来的尝试，再核对各项数量。');await solve();await checkpoint('correct-unsubmitted',phases);
 phases.push(await check(true,true,'corrected'));await checkpoint('corrected',phases);
 phases.push(await check(true,true,'repeated-check'));
 await field('prose','保留新写的原话，不把解释自动判成正确。');phases.push(await capture('unsubmitted-prose',false));await checkpoint('modified-prose',phases);
 phases.push(await check(true,true,'prose-rechecked'));
 await action('m33-clear');phases.push(await check(task.type==='x-m33-coins',task.type==='x-m33-coins','cleared'));
 if(task.type==='x-m33-coins')assert(phases.at(-1).words.includes('当前桌面是 0')&&phases.at(-1).words.includes('当时保存'),'current empty table differs from previously qualified saved compositions');
 else{await solve();phases.push(await check(true,true,'basket-rebuilt'));}
 await retry('native');phases.push(await capture('shared-retry',false));await checkpoint('shared-retry',phases);
 await solve();phases.push(await check(true,true,'retry-corrected'));await checkpoint('final',phases);return phases;
}
async function moneyBoundaryFlow(kind,spec,{task,field,action,solve,check,capture,retry,model,assert,noRemovalControl}){
 const phases=[];
 if(kind==='save-limit'){
  for(let i=0;i<12;i++)await action('m33-save');phases.push(await check(false,false,'twelve-failed-saves'));
  await solve();phases.push(await check(false,false,'correct-thirteenth-not-stored'));
  const current=await model();assert(current.board.saved.length===12&&current.board.saved.every(x=>x.total===0),'correct thirteenth save preserves all twelve saved failures');
  await retry('save-limit-correction');await solve();phases.push(await check(true,true,'retry-corrected'));
 }else if(kind==='coin-limit'){
  for(let i=0;i<51;i++)await action('m33-add',0);phases.push(await capture('fifty-first-request',false));
  assert(phases.at(-1).model.board.counts[0]===50&&phases.at(-1).model.history.length===51,'fifty-first visible add records its no-op');
  for(let i=0;i<50;i++)await action('m33-remove',0);await noRemovalControl();
  await solve();phases.push(await check(true,true,'corrected'));assert(phases.at(-1).proof.events[50].deltaMinorUnits===0,'no coin invented by the capped request');
 }else if(kind==='duplicate-distinct'){
  for(const[index,count]of spec.plan[0].entries())for(let j=0;j<count;j++)await action('m33-add',index);
  for(let i=0;i<3;i++)await action('m33-save');for(const[i,value]of spec.answers.entries())await field('answers.'+i,value);
  phases.push(await check(false,false,'repeated-same-vector'));await solve();phases.push(await check(true,true,'distinct-corrected'));
  assert(phases.at(-1).proof.construction.distinctAccepted===3,'duplicate saves do not invent distinct constructions');
 }else if(kind==='terminal-failed-save'){
  await solve();phases.push(await check(true,true,'saved-success'));await action('m33-clear');await action('m33-save');phases.push(await check(true,true,'terminal-failure-retained'));
  const last=phases.at(-1);assert(last.model.issue&&last.words.includes('当前保存提示仍在')&&last.words.includes('当前桌面是 0'),'terminal failed save and current zero table remain distinct from earlier success');
 }else if(kind==='minimum-correction'){
  for(let i=0;i<17;i++)await action('m33-add',5);await action('m33-save');await field('answers.0','4');phases.push(await check(false,false,'right-amount-too-many-coins'));
  await solve();phases.push(await check(true,true,'minimum-corrected'));assert(phases.at(-1).words.includes('核对器用整数面值检验了最少枚数'),'integer optimum remains the checker result');
 }else if(kind==='budget-subsets'){
  let accepted=0;const masks=budgetMaskOrder();assert(new Set(masks).size===32&&task.items.length===5,'all original 32 subsets once');
  for(const mask of masks){
   const selected=task.items.flatMap((_,i)=>mask&(1<<i)?[i]:[]),before=await model();
   for(const i of before.board.selected)if(!selected.includes(i))await action('m33-choose',i);
   for(const i of selected)if(!before.board.selected.includes(i))await action('m33-choose',i);
   const total=selected.reduce((sum,i)=>sum+BigInt(task.items[i].cents),0n),correct=selected.length>=2&&total<=6000n;
   const snapshot=await check(correct,correct,'subset-'+mask);phases.push(snapshot);
   if(correct){accepted++;assert(snapshot.proof.answers.length===0&&snapshot.proof.construction.totalMinorUnits===Number(total),'automatic remainder is not a submitted answer');}
  }
  assert(accepted===24,'all 32 budget subsets preserve 24 successes and 8 failures');assert(phases.at(-1).correct,'last original subset is valid for subsequent navigation');
 }else if(kind==='history-limit'){
  await solve();phases.push(await check(true,true,'before-history-cap'));
  const count=(await model()).history.length;for(let i=count;i<1200;i++)await action('m33-clear');
  phases.push(await check(true,true,'at-history-cap'));const before=await model();await action('m33-add',0);
  assert(JSON.stringify(await model())===JSON.stringify(before),'actual enabled request at 1200 leaves model and event count unchanged');
  phases.push(await capture('unrecorded-cap-click',true));assert(phases.at(-1).proof.eventCount===1200,'no invented event after the history cap');
 }else throw Error('Unknown money boundary');
 return phases;
}
async function moneyLegacyFlow(spec,{action,solve,check,retry}){
 const phases=[await check(true,false,'compatible-but-unprovable')];
 await action('m33-clear');await solve();phases.push(await check(true,false,'later-actions-retain-ambiguity'));
 await retry('legacy-unambiguous');await solve();phases.push(await check(true,true,'actual-retry-unambiguous'));return phases;
}
module.exports={operationPlan,orderedMoneyTargets,moneyBoundaryKindsFor,budgetMaskOrder,moneyNativeFlow,moneyBoundaryFlow,moneyLegacyFlow};

async function main(){
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
 const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-money-adapter');fs.mkdirSync(out,{recursive:true});
 const {cases,associated,practice}=fixture,targets=orderedMoneyTargets(),viewports=[[1440,900],[1280,720]];
 const checks=[],errors=[],remote=[],observations=[],isolated=[],boundaries=[],forgeries=[],backups=[],offline=[],preparations=[],retries=[],navigations=[],checkedLedger=[],captures=[];
 const cp=structuredClone,digest=value=>crypto.createHash('sha256').update(value).digest('hex');
 const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
 const hash=value=>digest(JSON.stringify(stable(value))),ok=(value,message,detail={})=>{assert.ok(value,message);checks.push({message,...detail});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const sourceFiles=['dist/learning/money-evidence.js','dist/learning/thinking-feedback.js','dist/learning/evidence-adapters.js','dist/exploration-core.js','tests/p9-money-adapter-browser.cjs','tests/fixtures/p9-money-cases.cjs','tests/fixtures/p9-money-navigation.cjs',...Object.keys({...fixture.sourceHashes,...navigationFixture.sourceHashes})];
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),nodeVersion:process.version,cache,
  sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),childTrial:false,independentTeachingReview:false,seededCorrectWork:false,seededLessonPositions:false,
  syntheticCompatibilityFixturesAreChildRecords:false,nativeBackupImportsCompleted:0,compatibilityImportsCompleted:0,corruptImportsRejected:0};
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {sessionTaskFor,BRIDGES}=await import('../dist/learning/bridges.js'),M=await import('../dist/learning/phase5/b33-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js'),{setField}=await import('../dist/learning/phase4/ui.js');
 const State=await import('../dist/learning/state.js'),Core=await import('../dist/exploration-core.js'),{studyActionFocus}=await import('../dist/learning/workspace-flow.js');
 const {moneyBinding:binding,replayMoneyEvidence:replay}=await import('../dist/learning/money-evidence.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const taskFor=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index}),originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const lessonFrom=(value,c)=>Object.hasOwn(BRIDGES,c.id)?value.daily.bridges[c.id]:value.lessons[c.id];
 for(const c of[...cases,...associated,...practice])assert.equal(hash(taskFor(c)),c.taskHash);
 for(const c of navigationFixture.navigation){assert.deepEqual(taskFor(c),c.task);assert.equal(hash(taskFor(c)),c.taskHash);}
 for(const[file,sha]of Object.entries({...fixture.sourceHashes,...navigationFixture.sourceHashes}))assert.equal(digest(fs.readFileSync(path.join(root,file))),sha,file);
 const artifactPaths=new Set(),uniqueFile=name=>{assert.ok(!artifactPaths.has(name),'one immutable raw artifact: '+name);artifactPaths.add(name);return path.join(out,name);};
 fs.writeFileSync(uniqueFile('fixed-source-cases.json'),JSON.stringify(fixture,null,2));fs.writeFileSync(uniqueFile('fixed-navigation.json'),JSON.stringify(navigationFixture,null,2));
 let browser,server,activePage,label='setup';const openContexts=new Set(),diagnostics=new Map();
 const report=()=>({provenance,viewports,checks,errors,remote,observations,isolated,boundaries,forgeries,backups,offline,preparations,retries,navigations,checkedLedger,captures,
  nativeTasks:28,nativeNodes:12,associatedTasks:20,practiceCompatibilityPositions:10,targets:48,sessions:25,childTrial:false,independentTeachingReview:false});
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});provenance.browserVersion=browser.version();
  for(const[width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
   server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   const profiles=[];
   for(const role of['source','native-restore-target','constructed-compatibility']){
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
   const field=async(c,key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before),tag=await control.evaluate(e=>e.tagName),type=await control.getAttribute('type'),numeric=['number','range'].includes(type)||key.startsWith('pair.');
    const applyValue=v=>{setField(expected,key,numeric?(String(v)===''?null:Number(v)):String(v));Engine.fieldExtra(taskFor(c),expected,key);};
    if(tag==='SELECT'){
     assert.equal(await control.locator('option').evaluateAll((options,want)=>options.filter(option=>option.value===want&&!option.disabled).length,String(value)),1);
     await control.selectOption(String(value));applyValue(value);
    }else if(type==='range'){
     const min=Number(await control.getAttribute('min')),max=Number(await control.getAttribute('max')),stride=Number(await control.getAttribute('step')||1),end=Number(value),start=Number(await control.inputValue());
     assert.ok(end>=min&&end<=max&&Number.isInteger((end-min)/stride));await control.focus();await control.press('Home');if(start!==min)applyValue(min);assert.deepEqual(await model(c),expected);
     for(let v=min+stride;v<=end;v+=stride){await control.press('ArrowRight');applyValue(v);assert.deepEqual(await model(c),expected);}
     assert.equal(Number(await control.inputValue()),end);
    }else{const limit=await control.getAttribute('maxlength');if(limit!==null)assert.ok(String(value).length<=Number(limit));await control.fill(String(value));applyValue(value);}
    assert.deepEqual(await model(c),expected);assert.equal(Tasks.validModel(taskFor(c),expected),true);return expected;
   };
   const action=async(c,name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join(''),control=page.locator(`[data-x="${name}"]${suffix}`);
    assert.equal(await control.count(),1,label+' one visible '+name+suffix);await reveal(control);assert.equal(await control.isEnabled(),true);
    const before=await model(c),expected=cp(before),t=taskFor(c);await control.click();Engine.actExtra(t,expected,name,data);const after=await model(c);assert.deepEqual(after,expected);
    if(t.type.startsWith('x-m33-')){
     if(before.history.length===1200){assert.deepEqual(after,before);ok(true,label+' enabled history-cap request changes no model field or event');return after;}
     assert.equal(after.history.length,before.history.length+1);assert.deepEqual(after.history.slice(0,before.history.length),before.history);
     const a=name.replace(/^m33-/,''),v=a==='run'?before.formula:a==='estimate'?before.estimate:'';
     assert.deepEqual(after.history.at(-1),{a,i:String(data.index??''),v:String(v)});
     if(t.type==='x-m33-coins'){
      const counts=cp(before.board.counts);if(name==='m33-add'&&counts[data.index]<50)counts[data.index]++;if(name==='m33-remove')counts[data.index]--;if(name==='m33-clear')counts.fill(0);
      assert.deepEqual(after.board.counts,counts);const total=xs=>xs.reduce((sum,n,i)=>sum+BigInt(n)*BigInt(t.denoms[i].cents),0n);assert.equal(total(after.board.counts),total(counts));
      if(name==='m33-save'){assert.equal(after.board.saved.length,Math.min(12,before.board.saved.length+1));assert.deepEqual(after.board.saved.slice(0,before.board.saved.length),before.board.saved);}
     }else if(t.type==='x-m33-cart'){
      const selected=name==='m33-clear'?[]:name==='m33-choose'?before.board.selected.includes(data.index)?before.board.selected.filter(i=>i!==data.index):[...before.board.selected,data.index].sort((a,b)=>a-b):before.board.selected;
      assert.deepEqual(after.board.selected,selected);
     }
    }
    return after;
   };
   const act=(c,name,index)=>action(c,name,index===undefined?{}:{index});
   const solve=async c=>{for(const step of operationPlan(c,await model(c)))step.field?await field(c,step.field,step.value):await act(c,step.action,step.index);};
   const capture=async(c,phase,strict,{role,checked=false}={})=>{
    const raw=await rawSnapshot(phase),lesson=lessonFrom(raw.decodedState,c),m=lesson.models[c.index],record=lesson.cases[c.index]||null,task=taskFor(c),proof=replay(task,m);
    assert.equal(Tasks.validModel(task,m),true);assert.equal(await hint.count(),strict?1:0);if(strict)assert.equal(await hint.isVisible(),true);
    const words=strict?await hint.innerText():null;
    if(strict){
     assert.ok(proof&&binding(task,ctx(c)));assert.deepEqual(record.attempts.at(-1).value,m);
     assert.ok(words.includes('合计和余款由工具显示')&&words.includes('不据此评价独立心算'));assert.doesNotMatch(words,/MP\.\d/);assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);
     for(const answer of proof.answers.filter(x=>x.kind==='choice')){
      const option=task.questions[answer.index].options.find(([value])=>value===answer.raw);assert.ok(option);
      assert.ok(words.includes(`本次提交的“${answer.label}”是“${option[1]}”`));assert.ok(!words.includes(`本次提交的“${answer.label}”是“${answer.raw}”`));
     }
    }
    const value={width,height,contextRole,id:c.id,index:c.index,label,phase,role,checked,model:m,record,attempts:record?.attempts||[],storage:storageOnly(raw),correct:Tasks.inspect(task,m).correct,strict,proof,words,
     constructedCompatibilityFixture:contextRole==='constructed-compatibility'};captures.push(value);return value;
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
    assert.deepEqual(after.model,M.initial(taskFor(c)));assert.deepEqual(after.lesson.cases,before.lesson.cases);assert.deepEqual(after.lesson.notes,before.lesson.notes);assert.equal(after.lesson.draft,before.lesson.draft);
    for(const[index,value]of Object.entries(before.lesson.models))if(Number(index)!==c.index)assert.deepEqual(after.lesson.models[index],value);assert.equal(await hint.count(),0);
    const storage=kind==='native'?null:(await capture(c,'retry-'+kind,false,{role})).storage;
    const item={width,height,contextRole,id:c.id,index:c.index,kind,beforeRecord:before.record,afterRecord:after.record,emptyModel:after.model,storage,constructedCompatibilityFixture:contextRole==='constructed-compatibility'};retries.push(item);return item;
   };
   const open=async c=>{
    const atPage=await page.evaluate(()=>window.mathLesson?.snapshot());if(atPage?.id!==c.id)await navigate({id:c.id,index:0});
    let at=(await current({id:c.id,index:0})).lesson.index;assert.ok(at<=c.index,'only forward original Next navigation');
    while(at<c.index){
     const previous={id:c.id,index:at},saved=await current(previous);
     if(!saved.record?.attempts?.some(a=>Tasks.inspect(taskFor(previous),a.value).correct)){
      const prep=navigationFixture.navigation.find(x=>x.id===c.id&&x.index===at);assert.ok(prep);assert.equal(binding(taskFor(previous),ctx(previous)),null);
      for(const step of prep.steps)step.field?await field(previous,step.field,step.value):await action(previous,step.action,step.data);
      const checked=await check(previous,true,false,'navigation-prerequisite-'+at,'prerequisite');preparations.push({width,height,...prep,checked,strictMoneyCoverage:false});
     }
     const before=originalState(await state()),next=page.locator('#actions [data-do="next"]');assert.equal(await next.count(),1);assert.equal(await next.isEnabled(),true);await next.click();
     const from=at;at++;await wait({id:c.id,index:at});keepRecords(before,originalState(await state()));navigations.push({width,height,id:c.id,from,to:at,originalNext:true});
    }
    const fresh=await current(c);assert.deepEqual(fresh.model,M.initial(taskFor(c)));assert.equal(fresh.record?.attempts?.length??0,0);assert.equal(await page.locator('[data-do="p3-retry"]').count(),0);
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
     const modules=await target.evaluate(async expected=>{const store=await caches.open(expected);return Promise.all(['storage.js','v2.html','learn.html','learning/learn.js','exploration-core.js','exploration.js','learning/money-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/phase4/ui.js','learning/phase4/engine.js','learning/phase4/view-engine.js','learning/p3-view.js','learning/p3-workflow.js','learning/workspace-flow.js','learning/phase5/b11-model.js','learning/phase5/b11-view.js','learning/phase5/b12-model.js','learning/phase5/b12-view.js','learning/phase5/b28-model.js','learning/phase5/b28-view.js','learning/phase5/b29-model.js','learning/phase5/b29-view.js','learning/phase5/b33-model.js','learning/phase5/b33-view.js','learning/phase5/b33.js','learning/phase5/b38.js','learning/phase5/b38-more.js','learning/phase4/async-batches.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},cache);
     const empty=originalState(await state(target));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
     const item={width,height,role:profile.role,cache,status,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false,emptyLearningState:true,emptyStorage:storageOnly(await rawSnapshot('empty-'+profile.role,target))};
     ok(status.ready&&item.missing.length===0,prefix+' '+profile.role+' active complete cache and genuine empty learning state',item);offline.push(item);return item;
    }catch(error){activePage=target;error.diagnosticPage=target;throw error;}
   };
   const warmed=await Promise.all(profiles.map(cacheReady));await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const item of warmed)item.originStopped=!server.listening;
   ok(!server.listening,prefix+' origin stops before all mathematical controls and real file imports');
   const runBoundary=async(c,kind)=>{
    label=prefix+'-'+c.id+'-'+c.index+'-boundary-'+kind;await retry(c,'boundary-'+kind,'boundary');
    const phases=await moneyBoundaryFlow(kind,c,{task:taskFor(c),field:(key,value)=>field(c,key,value),action:(name,index)=>act(c,name,index),solve:()=>solve(c),
     check:(correct,strict,phase)=>check(c,correct,strict,phase,'boundary'),capture:(phase,strict)=>capture(c,phase,strict,{role:'boundary'}),retry:name=>retry(c,name,'boundary'),model:()=>model(c),
     assert:(value,message)=>ok(value,label+' '+message),noRemovalControl:async()=>assert.equal(await page.locator('[data-x="m33-remove"]').count(),0)});
    await reload(c);assert.deepEqual(await model(c),phases.at(-1).model);assert.equal(await hint.isVisible(),true);const screenshot=await shot('boundary');
    boundaries.push({width,height,kind,id:c.id,index:c.index,phases,screenshot,constructedCompatibilityFixture:false});
   };
   const runNative=async c=>{
    label=prefix+'-'+c.id+'-'+c.index;await open(c);assert.equal(binding(taskFor(c),ctx(c))?.nodeId,c.nodeId);
    assert.equal(await guide.isVisible(),true);assert.equal(await guide.evaluate(e=>e.open),false);assert.equal(await hint.count(),0);const before=await current(c);
    await guide.locator(':scope > summary').click();assert.equal(await guide.locator('p').isVisible(),true);
    await page.waitForFunction(async({id,index})=>{const{readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons[id]?.cases[index]?.support===true;},c);
    await guide.locator(':scope > summary').click();const supported=await current(c);assert.deepEqual(supported.model,before.model);assert.equal(supported.record.attempts.length,0);
    const phases=await moneyNativeFlow(c,{task:taskFor(c),field:(key,value)=>field(c,key,value),action:(name,index)=>act(c,name,index),solve:()=>solve(c),
     check:(correct,strict,phase)=>check(c,correct,strict,phase,'native'),capture:(phase,strict)=>capture(c,phase,strict,{role:'native'}),retry:kind=>retry(c,kind,'native'),assert:(value,message)=>ok(value,label+' '+message),
     checkpoint:async(stage,items)=>{
      if(stage==='correct-unsubmitted')assert.equal(await hint.count(),0);
      if(stage==='corrected'){await shot('corrected');await reload(c);assert.equal(await hint.isVisible(),true);assert.deepEqual(await model(c),items.at(-1).model);}
      if(stage==='modified-prose'||stage==='shared-retry'){await reload(c);assert.equal(await hint.count(),0);}
      if(stage==='final')assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     }});
    const final=phases.at(-1),actual=phases.filter(x=>x.checked);assert.equal(actual.length,c.type==='x-m33-coins'?6:7);assert.equal(phases.length,c.type==='x-m33-coins'?8:9);
    assert.deepEqual(final.attempts,actual.map(x=>x.attempt));assert.deepEqual(final.attempts.slice(0,1),phases[0].attempts);assert.deepEqual(final.attempts.slice(0,2),phases[1].attempts);
    for(const kind of['extra-root','extra-event','inconsistent-board','hidden-action']){
     const forged=cp(final.model),task=taskFor(c);if(kind==='extra-root')forged.unrecorded=1;else if(kind==='extra-event')forged.history[0].unrecorded=1;
     else if(kind==='inconsistent-board'){if(task.type==='x-m33-coins')forged.board.saved[0].total++;else forged.board.selected=[];}
     else if(task.type==='x-m33-coins'){M.act(task,forged,'m33-clear');M.act(task,forged,'m33-remove',{index:0});}else M.act(task,forged,'m33-reveal');
     assert.equal(replay(task,forged),null);forgeries.push({width,height,id:c.id,index:c.index,kind,counterfactual:true,actualBrowserAction:false,model:forged,strict:false});
    }
    observations.push({width,height,id:c.id,index:c.index,nodeId:c.nodeId,taskHash:c.taskHash,phases});for(const kind of moneyBoundaryKindsFor(c))await runBoundary(c,kind);
   };
   for(const c of targets){
    if(c.role==='native')await runNative(c);
    else{label=prefix+'-associated-'+c.id+'-'+c.index;await open(c);assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);await solve(c);
     const snapshot=await check(c,true,false,'associated-checked','associated');assert.ok(snapshot.proof);assert.equal(binding(taskFor(c),ctx(c)),null);await reload(c);assert.equal(await hint.count(),0);assert.deepEqual(await model(c),snapshot.model);
     isolated.push({width,height,kind:'associated',id:c.id,index:c.index,taskHash:c.taskHash,snapshot});}
   }
   const mapCaptures=(rows,finalState)=>rows.map(value=>{
    const lesson=lessonFrom(finalState,value),prior=value.record?.attempts||[];assert.ok(lesson);assert.deepEqual(lesson.cases[value.index].attempts.slice(0,prior.length),prior);
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
   assert.equal(sourceRows.length,255);assert.equal(sourceCaptures.length,321);const positions=[...new Set(sourceRows.map(x=>x.id+':'+x.index))];assert.equal(positions.length,58);
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
   assert.ok((await importFile(restorePage,actual.payload,'money-identical-repeat-v2.json')).includes('备份已合并'));const repeated=await read(restorePage);assert.equal(repeated.raw,imported.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),actual.backup.state);
   const repeatedImportStorage=storageOnly(await rawSnapshot('repeated-import',restorePage));provenance.nativeBackupImportsCompleted++;
   assert.ok(!(await importFile(restorePage,'{','money-corrupt-native.json')).includes('备份已合并'));assert.equal((await read(restorePage)).raw,imported.raw);
   const corruptImportStorage=storageOnly(await rawSnapshot('corrupt-import-rejected',restorePage));provenance.corruptImportsRejected++;
   const last=cases.at(-1);await navigate(last,restorePage);assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredReload=await restorePage.reload();assert.equal(restoredReload?.fromServiceWorker(),true);await wait(last,restorePage);keepRecords(actual.backup.state,originalState(await state(restorePage)));assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const restoredStorage=storageOnly(await rawSnapshot('restored-lesson',restorePage)),restoredScreenshot=await shot('restored',restorePage);
   backups.push({width,height,kind:'actual-browser-v2',backupFile:actual.file,bytes:actual.bytes,backupSha256:actual.sha256,originalState:actual.backup.state,
    emptyBeforeImport,firstImportStorage,repeatedImportStorage,corruptImportStorage,restoredStorage,exportedScreenshot,restoredScreenshot,sourceCaptureMap,
    independentEmptyContext:true,originStopped:!server.listening,wholeStateFirstImportExact:true,repeatByteIdempotent:true,corruptRejectedWithoutWrite:true,checked:255,currentModelCaptures:321,positions:58});

   // The third profile receives only an explicitly constructed compatibility
   // backup. It never overwrites or clears the real source/restore profiles.
   contextRole='constructed-compatibility';page=compatibilityProfile.page;activePage=page;guide=page.locator('#thinking-guide');hint=page.locator('#thinking-feedback');label=prefix+'-constructed-legacy-compatibility';
   const legacyState=Core.fresh(),legacySpec=cases.find(c=>c.id==='pennyshop'&&c.index===0),legacyTask=taskFor(legacySpec),legacy=State.freshLesson(legacySpec.id),legacyModel=M.initial(legacyTask);
   const fixtureWork=(c,m=M.initial(taskFor(c)))=>{
    for(const step of operationPlan(c,m))if(step.field){setField(m,step.field,String(step.value));M.field(taskFor(c),m,step.field);}else M.act(taskFor(c),m,step.action,step.index===undefined?{}:{index:step.index});return m;
   };
   legacyModel.board.revealed=false;M.act(legacyTask,legacyModel,'m33-reveal');fixtureWork(legacySpec,legacyModel);legacy.models[0]=legacyModel;State.submitLesson(legacy);legacyState.lessons[legacySpec.id]=legacy;
   for(const c of practice){const lesson=legacyState.lessons[c.id]??=State.freshLesson(c.id);lesson.models[-1]=fixtureWork(c);}
   originalState(legacyState);const legacyPayload=JSON.stringify(Core.backup(legacyState)),legacyFile=label+'-v2.json';fs.writeFileSync(uniqueFile(legacyFile),legacyPayload);
   const legacyResponse=await page.reload();assert.equal(legacyResponse?.fromServiceWorker(),true);await page.locator('#main [data-do="export"]').first().waitFor();
   const emptyLegacy=originalState(await state());assert.deepEqual(emptyLegacy.lessons,{});assert.deepEqual(emptyLegacy.daily.bridges,{});const legacyEmptyStorage=storageOnly(await rawSnapshot('independent-empty-target'));
   assert.ok((await importFile(page,legacyPayload,legacyFile)).includes('备份已合并'));const legacyImported=await read(page);assert.deepEqual(originalState(JSON.parse(legacyImported.text)),legacyState);
   const legacyImportStorage=storageOnly(await rawSnapshot('imported-original-compatibility'));provenance.compatibilityImportsCompleted++;
   assert.ok(!(await importFile(page,'{','money-corrupt-compatibility.json')).includes('备份已合并'));assert.equal((await read(page)).raw,legacyImported.raw);
   const legacyCorruptStorage=storageOnly(await rawSnapshot('corrupt-import-rejected'));provenance.corruptImportsRejected++;
   const practiceSnapshots=[];
   for(const c of practice){
    label=prefix+'-constructed-practice-'+c.id;await navigate({id:c.id,index:legacyState.lessons[c.id].index});const raw=await rawSnapshot('retained-original-model'),lesson=raw.decodedState.lessons[c.id];
    assert.deepEqual(lesson.models[-1],legacyState.lessons[c.id].models[-1]);assert.equal(binding(taskFor(c),ctx(c)),null);
    if(c.id!==legacySpec.id){assert.equal(lesson.cases[lesson.index]?.attempts?.length??0,0);assert.equal(await hint.count(),0);}
    const item={width,height,kind:'old-practice-compatibility',id:c.id,index:-1,taskHash:c.taskHash,model:lesson.models[-1],storage:storageOnly(raw),nativePositionOpened:lesson.index,strict:false,constructedCompatibilityFixture:true};
    practiceSnapshots.push(item);isolated.push(item);
   }
   label=prefix+'-constructed-legacy-reveal';await navigate(legacySpec);
   const legacyPhases=await moneyLegacyFlow(legacySpec,{action:(name,index)=>act(legacySpec,name,index),solve:()=>solve(legacySpec),
    check:(correct,strict,phase)=>check(legacySpec,correct,strict,phase,'legacy-compatibility'),retry:kind=>retry(legacySpec,kind,'legacy-compatibility')});
   assert.deepEqual(legacyPhases.at(-1).attempts[0],legacy.cases[0].attempts[0]);assert.equal(legacyPhases.at(-1).attempts.length,4);
   await reload(legacySpec);assert.equal(await hint.isVisible(),true);const legacyScreenshot=await shot('retry-corrected');
   boundaries.push({width,height,kind:'legacy-reveal',id:legacySpec.id,index:0,fixture:legacyFile,phases:legacyPhases,screenshot:legacyScreenshot,constructedCompatibilityFixture:true,currentFinalModelFromRealRetry:true});
   label=prefix+'-constructed-final-backup';const legacyFinal=await downloadBackup('v2'),legacyRows=checkedLedger.filter(x=>x.width===width&&x.contextRole==='constructed-compatibility'),legacyCaptures=captures.filter(x=>x.width===width&&x.contextRole==='constructed-compatibility');
   assert.equal(legacyRows.length,3);assert.equal(legacyCaptures.length,4);assert.deepEqual(legacyFinal.backup.state.lessons[legacySpec.id].cases[0].attempts,[legacy.cases[0].attempts[0],...legacyRows.map(x=>x.attempt)]);
   assert.deepEqual(legacyFinal.backup.state.lessons[legacySpec.id].models[0],legacyRows.at(-1).model);
   for(const c of practice)assert.deepEqual(legacyFinal.backup.state.lessons[c.id].models[-1],legacyState.lessons[c.id].models[-1]);
   const compatibilityCaptureMap=mapCaptures(legacyCaptures,legacyFinal.backup.state);
   for(const item of practiceSnapshots)assert.deepEqual(legacyFinal.backup.state.lessons[item.id].models[-1],item.model);
   backups.push({width,height,kind:'constructed-compatibility-final-v2',constructedCompatibilityFixture:true,fixture:legacyFile,fixtureSHA256:digest(legacyPayload),legacyEmptyStorage,legacyImportStorage,legacyCorruptStorage,
    backupFile:legacyFinal.file,bytes:legacyFinal.bytes,backupSha256:legacyFinal.sha256,originalState:legacyFinal.backup.state,compatibilityCaptureMap,practiceSnapshots,
    importedConstructedSubmissions:1,actualUIChecksAfterImport:3,currentModelCaptures:4,oldPractice:10,independentContext:true,originStopped:!server.listening});
   for(const profile of profiles){await profile.context.close();openContexts.delete(profile.context);}activePage=null;
  }
  assert.equal(errors.length,0);assert.equal(remote.length,0);assert.equal(observations.length,56);assert.equal(forgeries.length,224);assert.equal(preparations.length,20);assert.equal(navigations.length,66);
  assert.equal(isolated.filter(x=>x.kind==='associated').length,40);assert.equal(isolated.filter(x=>x.kind==='old-practice-compatibility').length,20);assert.equal(boundaries.length,16);
  assert.equal(checkedLedger.filter(x=>x.contextRole==='source').length,510);assert.equal(checkedLedger.filter(x=>x.contextRole==='constructed-compatibility').length,6);assert.equal(checkedLedger.length,516);
  assert.equal(captures.filter(x=>x.contextRole==='source').length,642);assert.equal(captures.filter(x=>x.contextRole==='constructed-compatibility').length,8);assert.equal(captures.length,650);
  assert.equal(retries.filter(x=>x.contextRole==='source').length,72);assert.equal(retries.filter(x=>x.contextRole==='constructed-compatibility').length,2);assert.equal(retries.length,74);
  assert.equal(backups.filter(x=>x.kind==='actual-browser-v2').length,2);assert.equal(backups.filter(x=>x.kind==='constructed-compatibility-final-v2').length,2);
  assert.equal(provenance.nativeBackupImportsCompleted,4);assert.equal(provenance.compatibilityImportsCompleted,2);assert.equal(provenance.corruptImportsRejected,4);
  const attemptCounts=Object.fromEntries(['native','boundary','associated','prerequisite','legacy-compatibility'].map(role=>[role,checkedLedger.filter(x=>x.role===role).length]));
  assert.deepEqual(attemptCounts,{native:362,boundary:88,associated:40,prerequisite:20,'legacy-compatibility':6});
  const checkedPaths=checkedLedger.flatMap(x=>[x.storage.raw,x.storage.state]),capturePaths=captures.flatMap(x=>[x.storage.raw,x.storage.state]);
  assert.equal(new Set(checkedPaths).size,1032);assert.equal(new Set(capturePaths).size,1300);
  fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(provenance,null,2));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report(),attemptCounts,uniqueCheckedFiles:1032,uniqueCaptureFiles:1300,originStopped:offline.every(x=>x.originStopped)},null,2));
  console.log('P9_MONEY_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:28,taskViewportPairs:56,sourceChecks:510,compatibilityChecks:6,captures:650,oldPractice:20,retries:74,next:66,forgeries:224,nativeBackups:2,compatibilityBackups:2}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;const diagnosticFile=activePage&&diagnostics.has(activePage)?await diagnostics.get(activePage).dump(error).catch(reason=>({diagnosticError:String(reason)})):null;
  if(activePage){await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.html'),await activePage.content().catch(()=>''));}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report(),error:String(error),stack:error.stack,at:label,diagnosticFile},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const context of openContexts)await context.close();if(browser)await browser.close();
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
