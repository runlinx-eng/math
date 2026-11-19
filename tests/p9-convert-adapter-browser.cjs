const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin}=require('./helpers/p9-basic-artifact.cjs');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-convert-cases.cjs');

const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-convert-adapter');
const digest=value=>createHash('sha256').update(value).digest('hex');
const {width,height}=STANDARD_DESKTOP_VIEWPORT;
const key=row=>row.id+'-'+row.index;
const sourceFiles=[
 ...Object.keys(fixture.sourceFiles),'dist/sw.js','dist/learn.html','dist/learning/learn.js',
 'dist/learning/thinking-feedback.js','dist/learning/evidence-adapters.js','dist/learning/convert-evidence.js',
 'tests/fixtures/p9-convert-cases.cjs','tests/p9-convert-evidence.test.mjs','tests/p9-convert-adapter-browser.cjs'
];

function saveFile(name,bytes){
 const full=path.join(out,name);
 fs.writeFileSync(full,bytes,{flag:'wx'});
 return {file:name,bytes:Buffer.byteLength(bytes),sha256:digest(bytes)};
}

async function read(page){
 return page.evaluate(async()=>{
  const {readStored}=await import('./storage.js'),name='math-explorer-v2';
  return {raw:localStorage.getItem(name),text:readStored(name)};
 });
}

function stateOf(snapshot){return JSON.parse(snapshot.text);}
function stateFiles(label,snapshot){
 assert.equal(typeof snapshot.raw,'string');
 return {
  raw:saveFile(label+'-storage.txt',snapshot.raw),
  decoded:saveFile(label+'-state.json',snapshot.text)
 };
}

async function activate(page,origin,cache){
 await page.goto(origin.base+'v2.html#trail');
 await page.locator('#main [data-do="export"]').first().waitFor();
 let status=null;
 for(let attempt=0;attempt<300;attempt++){
  status=await page.evaluate(async release=>{
   const worker=navigator.serviceWorker.controller;
   const registration=await navigator.serviceWorker.getRegistration();
   if(!worker||worker!==registration?.active||worker.state!=='activated'||
      new URL(worker.scriptURL).searchParams.get('release')!==release)return null;
   const message=await new Promise(resolve=>{
    const channel=new MessageChannel();
    const timer=setTimeout(()=>{channel.port1.close();resolve(null);},2000);
    channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
    worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
   });
   const store=await caches.open(release);
   const module=await store.match(new URL('learning/convert-evidence.js',location.href));
   return {message,module:module?.ok,worker:worker.scriptURL};
  },cache);
  if(status?.message?.complete&&status.module)break;
  await page.waitForTimeout(100);
 }
 assert.ok(status?.message,'active current worker returned cache status');
 assert.equal(status.message.cache,cache);
 assert.equal(status.message.complete,true);
 assert.ok(status.message.cached>0&&status.message.cached===status.message.total);
 assert.equal(status.module,true);
 const state=stateOf(await read(page));
 assert.deepEqual(state.lessons,{});
 assert.deepEqual(state.daily.bridges,{});
 return status;
}

async function importFile(page,content,name){
 await page.locator('#main [data-do="import"]').first().waitFor();
 const choosing=page.waitForEvent('filechooser');
 await page.locator('#main [data-do="import"]').first().click();
 const chooser=await choosing;
 await chooser.setFiles({name,mimeType:'application/json',buffer:Buffer.from(content)});
 await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
 return page.locator('#toast').innerText();
}
async function download(page){
 const taking=page.waitForEvent('download');
 await page.locator('#main [data-do="export"]').first().click();
 return fs.readFileSync(await (await taking).path());
}

function waitForLesson(page,row){
 return page.waitForFunction(({id,index})=>{
  const current=window.mathLesson?.snapshot();
  return current?.id===id&&current.index===index&&current.view==='task';
 },row);
}
async function openLesson(page,base,row){
 const response=await page.goto(base+'learn.html#'+row.id);
 if(response)assert.equal(response.fromServiceWorker(),true);
 await waitForLesson(page,row);
}
async function reopen(page,row){
 const response=await page.reload();
 assert.equal(response?.fromServiceWorker(),true);
 await waitForLesson(page,row);
}
async function applyStep(page,step){
 if(step.field){
  const target=page.locator('[data-xfield="'+step.field+'"]');
  assert.equal(await target.count(),1,step.field);
  assert.equal(await target.isVisible(),true,step.field);
  if(await target.evaluate(e=>e.tagName)==='SELECT')await target.selectOption(step.value);
  else await target.fill(step.value);
 }else{
  const index=step.index===undefined?'':'[data-index="'+step.index+'"]';
  const control=page.locator('[data-x="'+step.action+'"]'+index);
  assert.equal(await control.isVisible(),true,step.action);
  await control.click();
 }
}
async function fill(page,key,values){
 for(const [index,value] of values.entries())await applyStep(page,{field:key+'.'+index,value});
}
const save=page=>applyStep(page,{action:'m28-convert'});
async function visibleBars(page,task,raw,expectedWidths){
 const board=page.locator('.m28-world svg');
 assert.equal(await board.isVisible(),true);
 const visible=await board.evaluate(svg=>({
  box:svg.getBoundingClientRect().toJSON(),
  label:svg.getAttribute('aria-label'),
  top:[...svg.querySelectorAll('rect[fill="#9ccab4"]')].map(e=>Number(e.getAttribute('width'))),
  bottom:[...svg.querySelectorAll('rect[fill="#dfb481"]')].map(e=>Number(e.getAttribute('width'))),
  labels:[...svg.querySelectorAll('text')].map(e=>e.textContent)
 }));
 assert.ok(visible.box.height>0&&visible.box.width>0);
 assert.equal(/近似/.test(visible.label),!!task.approx);
 assert.deepEqual(visible.top,task.rows.map(()=>320));
 assert.deepEqual(visible.bottom,expectedWidths);
 for(const [i,row] of task.rows.entries()){
  assert.ok(visible.labels.includes(row.label||row.value+' '+row.from));
  assert.ok(visible.labels.includes(row.to+' '+(raw?.[i]??'？')));
 }
 assert.equal(visible.labels.filter(label=>label==='超出').length,(raw||[]).filter((value,i)=>Number(value)/task.rows[i].expected>1.25).length);
 return visible;
}

async function main(){
 fs.mkdirSync(out,{recursive:true});
 const Core=await import('../dist/exploration-core.js');
 const State=await import('../dist/learning/state.js');
 const Tasks=await import('../dist/learning/tasks.js');
 const {sessionTaskFor,BRIDGES}=await import('../dist/learning/bridges.js');
 const {replayConvertEvidence,convertBinding}=await import('../dist/learning/convert-evidence.js');
 const {thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 const atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const testedCheckoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const report={
  provenance:{
   testedCheckoutSha,headSha:event.pull_request?.head?.sha||testedCheckoutSha,
   githubSha:process.env.GITHUB_SHA??null,runId:process.env.GITHUB_RUN_ID??null,
   runAttempt:process.env.GITHUB_RUN_ATTEMPT??null,cache,nodeVersion:process.version,
   sourceFiles:Object.fromEntries(sourceFiles.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))]))
  },
  viewports:[[width,height]],proofContracts:['math','correction','persistence','negative','backup'],
  checks:[],errors:[],remote:[],observations:[],checkedLedger:[],navigations:[],retries:[],
  offline:[],backups:[],compatibility:[],childTrial:false,independentTeachingReview:false
 };
 const taskFor=row=>sessionTaskFor(row.id,row.index);
 const context=row=>({sessionId:row.id,index:row.index});
 const lessonFrom=(state,row)=>Object.hasOwn(BRIDGES,row.id)?state.daily.bridges[row.id]:state.lessons[row.id];
 const current=async(page,row)=>lessonFrom(stateOf(await read(page)),row);
 const modelFor=async(page,row)=>(await current(page,row)).models[row.index];
 const feedback=page=>page.locator('#thinking-feedback');
 const check=async(page,row,phase,correct,strict)=>{
  const before=await current(page,row),task=taskFor(row);
  await page.locator('#actions [data-do="check"]').click();
  const snapshot=await read(page),lesson=lessonFrom(stateOf(snapshot),row),model=lesson.models[row.index];
  const record=lesson.cases[row.index],attempt=record.attempts.at(-1);
  assert.deepEqual(record.attempts.slice(0,-1),before.cases[row.index]?.attempts||[]);
  assert.deepEqual(attempt.value,model);
  assert.deepEqual(model,before.models[row.index]);
  assert.equal(Tasks.inspect(task,model).correct,correct);
  const originalFeedback=thinkingFeedback(task,model,record,context(row));
  assert.equal(await feedback(page).count(),originalFeedback?1:0);
  assert.equal(!!(convertBinding(task,context(row))&&originalFeedback),strict);
  const proof=strict?replayConvertEvidence(task,model):null;
  if(strict)assert.ok(proof&&originalFeedback?.method===null);
  const item={id:row.id,index:row.index,role:row.role,phase,correct,strict,model,attempt,proof,
   storage:stateFiles((row.profile||'source')+'-'+key(row)+'-'+phase,snapshot)};
  report.checkedLedger.push(item);
  report.checks.push({id:row.id,index:row.index,phase,correct,strict});
  return item;
 };
 const shot=async(page,label)=>{
  const bytes=await page.screenshot({fullPage:true,animations:'disabled'});
  return saveFile(label+'.png',bytes);
 };
 const retry=async(page,row)=>{
  const before=await current(page,row),control=page.locator('[data-do="p3-retry"]');
  assert.equal(await control.count(),1);
  for(let depth=0;depth<5&&!await control.isVisible();depth++){
   const closed=control.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
   await closed.locator(':scope > summary').click();
  }
  assert.equal(await control.isVisible(),true);
  await control.click();
  const after=await current(page,row),initial=Tasks.defaultModel(taskFor(row));
  initial.seed=after.models[row.index].seed;
  assert.deepEqual(after.models[row.index],initial);
  assert.deepEqual(after.cases,before.cases);
  assert.deepEqual(after.notes,before.notes);
  assert.equal(after.draft,before.draft);
  for(const [i,model] of Object.entries(before.models))if(Number(i)!==row.index)assert.deepEqual(after.models[i],model);
  assert.equal(await feedback(page).count(),0);
  report.retries.push({id:row.id,index:row.index,profile:row.profile||'source',storage:stateFiles((row.profile||'source')+'-'+key(row)+'-retry',await read(page))});
 };
 const solve=async(page,row,values=row.values)=>{
  await fill(page,'values',values);await save(page);await fill(page,'answers',row.answers);
 };
 const tourRow=async(page,row)=>{
  const task=taskFor(row),guide=page.locator('#thinking-guide');
  assert.deepEqual((await current(page,row)).cases[row.index]?.attempts||[],[]);
  if(row.role==='prerequisite'){
   for(const step of row.steps)await applyStep(page,step);
   await check(page,row,'prerequisite',true,false);
   return;
  }
  assert.equal(await guide.count(),row.role==='native'?1:0);
  assert.equal(await feedback(page).count(),0);
  if(row.role==='associated'){
   await solve(page,row);await check(page,row,'associated',true,false);
   return;
  }

  assert.equal(await guide.evaluate(el=>el.open),false);
  await guide.locator('summary').click();
  assert.equal(await guide.locator('p').isVisible(),true);
  assert.equal((await current(page,row)).cases[row.index].support,true);
  await guide.locator('summary').click();
  const bars={initial:await visibleBars(page,task,null,row.values.map(()=>0))};
  await save(page); // Blank request, before any fully finite group.
  assert.deepEqual((await modelFor(page,row)).board,{first:{},bad:false,saved:null});

  const changedIndex=row.values.length-1;
  const wrong=row.values.map((raw,i)=>i===changedIndex?String(Number(raw)*2):raw);
  await solve(page,row,wrong);
  const first=await check(page,row,'wrong-group',false,false);
  assert.deepEqual(first.model.board.first.values,wrong);
  bars.wrong=await visibleBars(page,task,wrong,row.values.map((_,i)=>i===changedIndex?400:320));

  const near=row.values.map((raw,i)=>i!==0?raw:raw.includes('.')?raw+'0000000001':raw+'.00000000001');
  await fill(page,'values',near);await save(page);
  const nearAttempt=await check(page,row,'original-tolerance',true,false);
  assert.equal(replayConvertEvidence(task,nearAttempt.model),null);
  const raw=row.values.map(value=>value+(value.includes('.')?'0':'.0'));
  await fill(page,'values',raw);
  assert.deepEqual((await modelFor(page,row)).board.saved,near);
  bars.unsaved=await visibleBars(page,task,near,barsNear(near,row.values));
  await check(page,row,'raw-value-unsaved',false,false);

  await save(page);
  assert.equal(await feedback(page).count(),0);
  const corrected=await check(page,row,'corrected',true,true);
  assert.equal(corrected.proof.relationship,row.kind);
  assert.deepEqual(corrected.proof.rows.map(r=>r.raw),raw);
  assert.deepEqual(corrected.proof.rows.map(r=>r.expected),row.values);
  assert.deepEqual(corrected.proof.firstSave.values,wrong);
  const rendered=await feedback(page).innerText();
  assert.equal(rendered.includes('按本题给定的近似关系'),row.kind==='given-approximation');
  bars.corrected=await visibleBars(page,task,raw,row.values.map(()=>320));
  const screenshot=await shot(page,key(row)+'-corrected');

  await fill(page,'values',raw.map((value,i)=>i===0?'':value));await save(page);
  assert.deepEqual((await modelFor(page,row)).board,corrected.model.board);
  await fill(page,'values',raw);
  const terminal=await check(page,row,'restored-raw-after-invalid-group',true,true);
  assert.equal(terminal.proof.events.at(-1).saved,false);
  assert.deepEqual(terminal.proof.saved,corrected.proof.saved);
  const beforeReload=await current(page,row);
  await reopen(page,row);
  const reloaded=await current(page,row);
  assert.deepEqual(reloaded.models,beforeReload.models);
  assert.deepEqual(reloaded.cases,beforeReload.cases);
  assert.equal(await feedback(page).isVisible(),true);

  await retry(page,row);
  await reopen(page,row);
  assert.equal(await feedback(page).count(),0);
  await solve(page,row);
  await check(page,row,'retry-corrected',true,true);
  report.observations.push({id:row.id,index:row.index,taskHash:row.taskHash,kind:row.kind,bars,screenshot});
 };
 function barsNear(values,expected){return values.map((value,i)=>Math.min(1.25,Number(value)/Number(expected[i]))*320);}
 const trail=async(page,base)=>{
  const url=base+'v2.html#trail';
  const response=await (page.url()===url?page.reload():page.goto(url));
  assert.equal(response?.fromServiceWorker(),true);
  await page.locator('#main [data-do="export"]').first().waitFor();
 };
 const restore=async(page,bytes,label)=>{
  const empty=await read(page);
  assert.deepEqual(stateOf(empty).lessons,{});
  assert.deepEqual(stateOf(empty).daily.bridges,{});
  assert.match(await importFile(page,bytes,label+'.json'),/备份已合并/);
  const first=await read(page);
  assert.deepEqual(stateOf(first),Core.parseBackup(bytes.toString(),atlas));
  assert.match(await importFile(page,bytes,label+'-repeat.json'),/备份已合并/);
  const repeat=await read(page);
  assert.equal(repeat.raw,first.raw);
  assert.doesNotMatch(await importFile(page,'{',label+'-corrupt.json'),/备份已合并/);
  const rejected=await read(page);
  assert.equal(rejected.raw,first.raw);
  report.backups.push({role:label,empty:stateFiles(label+'-empty',empty),
   first:stateFiles(label+'-first',first),repeat:stateFiles(label+'-repeat',repeat),
   rejected:stateFiles(label+'-rejected',rejected),accepted:2,corruptRejected:1,
   wholeStateExact:true,repeatByteIdempotent:true});
  return stateOf(first);
 };

 let browser,origin,active,label='initial';
 const diagnostics=new Map();
 try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  report.provenance.browserVersion=browser.version();
  origin=await createOrigin(root);
  const profiles=await Promise.all(['source','native-restore','constructed-limits','constructed-practice'].map(async role=>{
   const context=await newDesktopContext(browser,{reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:'allow'});
   context.on('request',request=>{
    if(/^https?:/.test(request.url())&&!request.url().startsWith(origin.base))report.remote.push(request.url());
   });
   const page=await context.newPage();
   page.setDefaultTimeout(20000);
   page.on('pageerror',error=>report.errors.push({role,label,error:String(error)}));
   diagnostics.set(page,observeBrowserDiagnostics(page,{out,base:origin.base,label:()=>label}));
   return {role,page};
  }));
  await Promise.all(profiles.map(async({role,page})=>{
   const status=await activate(page,origin,cache);
   report.offline.push({role,...status});
  }));
  await origin.close();
  assert.equal(origin.server.listening,false);
  report.originStopped=true;

  const [source,restored,limits,practice]=profiles.map(profile=>profile.page);
  active=source;
  for(const route of fixture.routes){
   label='source-'+route[0].id;
   await openLesson(source,origin.base,route[0]);
   for(const [index,row] of route.entries()){
    label='source-'+key(row);
    if(index>0){
     const before=await current(source,row);
     await source.locator('#actions [data-do="next"]').click();
     await waitForLesson(source,row);
     const after=await current(source,row);
     assert.deepEqual(after.cases,before.cases);
     for(const [i,model] of Object.entries(before.models))assert.deepEqual(after.models[i],model);
     report.navigations.push({id:row.id,from:index-1,to:index});
    }
    await tourRow(source,row);
   }
  }
  assert.equal(report.navigations.length,23);
  assert.equal(report.observations.length,21);
  assert.equal(report.observations.filter(r=>r.kind==='given-approximation').length,6);
  assert.equal(report.checkedLedger.length,150);
  label='actual-v2';
  await trail(source,origin.base);
  const bytes=await download(source);
  const state=stateOf(await read(source));
  assert.deepEqual(Core.parseBackup(bytes.toString(),atlas),state);
  report.actualBackup=saveFile('actual-v2-export.json',bytes);
  for(const row of fixture.routes.flat()){
   const lesson=lessonFrom(state,row);
   const entries=report.checkedLedger.filter(entry=>entry.id===row.id&&entry.index===row.index);
   assert.deepEqual(lesson.cases[row.index].attempts,entries.map(entry=>entry.attempt));
   assert.deepEqual(lesson.models[row.index],entries.at(-1).model);
  }
  active=restored;
  await trail(restored,origin.base);
  assert.deepEqual(await restore(restored,bytes,label),state);
  const last=fixture.cases.at(-1);
  await openLesson(restored,origin.base,last);
  await reopen(restored,last);
  assert.equal(await feedback(restored).isVisible(),true);
  assert.deepEqual((await current(restored,last)).cases,lessonFrom(state,last).cases);
  report.restoredScreenshot=await shot(restored,'actual-v2-restored-offline');

  active=limits;label='constructed-limits';
  await trail(limits,origin.base);
  const row={...fixture.cases.find(r=>r.id==='metricconversions'&&r.index===1),profile:'limits'};
  const limitState=Core.fresh(),limitLesson=State.freshLesson(row.id),task=taskFor(row);
  const capped=Tasks.exampleModel(task);
  capped.history=Array.from({length:2000},()=>structuredClone(capped.history[0]));
  limitLesson.index=row.index;limitLesson.models[row.index]=capped;
  State.submitLesson(limitLesson);
  limitState.lessons[row.id]=limitLesson;
  const limitPayload=JSON.stringify({app:'math-explorer',version:2,state:limitState});
  report.limitFixture=saveFile('constructed-2000-v2.json',limitPayload);
  await restore(limits,limitPayload,label);
  const invalid=structuredClone(limitState);
  invalid.lessons[row.id].models[row.index].history.push(structuredClone(capped.history[0]));
  const beforeReject=await read(limits);
  assert.doesNotMatch(await importFile(limits,JSON.stringify({app:'math-explorer',version:2,state:invalid}),'invalid-2001.json'),/备份已合并/);
  assert.equal((await read(limits)).raw,beforeReject.raw);
  await openLesson(limits,origin.base,row);
  assert.equal(await feedback(limits).isVisible(),true);
  const before=await current(limits,row);
  await save(limits);
  const after=await current(limits,row);
  assert.deepEqual(after.models,before.models);
  assert.deepEqual(after.cases,before.cases);
  assert.notEqual(after.updatedAt,before.updatedAt);
  const long='0'.repeat(1198)+'10';
  await applyStep(limits,{field:'values.0',value:long});
  const atLimit=await read(limits),limitModel=await modelFor(limits,row);
  assert.equal(limitModel.values[0],long);
  await applyStep(limits,{field:'values.0',value:'0'+long});
  assert.match(await limits.locator('#storage-warning').innerText(),/已停止覆盖原记录/);
  assert.equal((await read(limits)).raw,atLimit.raw);
  report.blockedScreenshot=await shot(limits,'constructed-limit-blocked');
  await reopen(limits,row);
  assert.equal(await limits.locator('#storage-warning').isVisible(),false);
  assert.deepEqual(await modelFor(limits,row),limitModel);
  await check(limits,row,'unsaved-at-cap',false,false);
  await retry(limits,row);
  await solve(limits,row,[long,...row.values.slice(1)]);
  await check(limits,row,'explicit-retry-at-1200',true,true);
  assert.equal(await feedback(limits).evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  report.compatibility.push({role:label,fixture:true,actions:2000,overlongWriteBlocked:true,
   overlongImportRejected:true,checkedTextLength:long.length,
   screenshot:await shot(limits,'constructed-limit-corrected')});

  active=practice;label='constructed-practice';
  await trail(practice,origin.base);
  const old=Core.fresh();
  for(const row of fixture.practice){
   const lesson=State.freshLesson(row.id);
   lesson.view='play';lesson.models[-1]=Tasks.exampleModel(taskFor(row));
   old.lessons[row.id]=lesson;
  }
  const miles=old.lessons.mileskm,milesTask=sessionTaskFor('mileskm',2);
  miles.index=2;miles.models[2]=Tasks.exampleModel(milesTask);
  miles.models[2].answers[1]='-0 2/5';
  miles.view='task';State.submitLesson(miles);miles.view='play';miles.index=0;
  const practicePayload=JSON.stringify({app:'math-explorer',version:2,state:old});
  report.practiceFixture=saveFile('constructed-practice-v2.json',practicePayload);
  await restore(practice,practicePayload,label);
  for(const row of fixture.practice){
   const first={id:row.id,index:0};
   await openLesson(practice,origin.base,first);
   const lesson=await current(practice,first);
   assert.deepEqual(lesson.models[-1],old.lessons[row.id].models[-1]);
   assert.deepEqual(lesson.cases,old.lessons[row.id].cases);
   assert.equal(await feedback(practice).count(),0);
  }
  await trail(practice,origin.base);
  const finalPractice=await download(practice);
  const finalRecord=Core.parseBackup(finalPractice.toString(),atlas).lessons.mileskm;
  assert.deepEqual(finalRecord.cases[2],miles.cases[2]);
  assert.equal(finalRecord.models[2].answers[1],'-0 2/5');
  report.compatibility.push({role:label,fixture:true,oldPractice:6,signedMixedRawPreserved:true,
   export:saveFile('constructed-practice-export.json',finalPractice)});

  assert.equal(report.retries.length,22);
  assert.equal(report.checkedLedger.length,152);
  assert.equal(report.checkedLedger.filter(entry=>entry.role==='prerequisite').length,6);
  assert.equal(report.checkedLedger.filter(entry=>entry.role==='associated').length,18);
  assert.equal(report.errors.length,0);
  assert.deepEqual(report.remote,[]);
  saveFile('results.json',JSON.stringify(report,null,2)+'\n');
  console.log('P9_CONVERT_ADAPTER_BROWSER_OK',JSON.stringify({
   checked:report.checkedLedger.length,native:21,exact:15,givenApproximation:6,
   associated:18,prerequisites:6,next:23,practice:6,retries:22,imports:6,rejected:4,originsStopped:true
  }));
 }catch(error){
  report.errors.push({label,error:String(error)});
  await diagnostics.get(active)?.dump(error);
  saveFile('results.json',JSON.stringify(report,null,2)+'\n');
  throw error;
 }finally{
  await browser?.close();
  await origin?.close();
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
