// Real unchanged B15 controls. Only empty fixtures are seeded; all mathematical
// actions, submissions, shared retries, backup imports and reloads use Chromium.
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
module.exports={operationPlan,boundaryVariants,boundaryFlow};

if(require.main===module)(async()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
 const {execFileSync}=require('node:child_process');
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {createOrigin,warmAndStop,capture}=require('./helpers/p9-basic-artifact.cjs');
 const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-order-adapter');
 const checks=[],errors=[],remote=[],observations=[],boundaries=[],isolated=[],forgeries=[],offline=[],backups=[];
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=x=>structuredClone(x);
 const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
  runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  nodeVersion:process.version,cache,sourceHashes:reviewed.sourceHashes,
  adapterSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'dist/learning/order-evidence.js'))).digest('hex')};
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'fixed-source-cases.json'),JSON.stringify(reviewed,null,2));
 const [{sessionTasks},M,{replayOrderEvidence:replay},{ensureB39Ready}]=await Promise.all([
  import('../dist/learning/bridges.js'),import('../dist/learning/phase5/b15-model.js'),
  import('../dist/learning/order-evidence.js'),import('../dist/learning/phase4/async-batches.js')]);
 await ensureB39Ready();
 const viewports=[[1440,900],[1280,720]];let browser,origin,page,diagnostics,activeLabel='setup';
 const taskFor=spec=>sessionTasks(spec.id)[spec.index];
 const report=()=>({provenance,checks,errors,remote,observations,boundaries,isolated,forgeries,offline,backups,viewports,
  nativeTasks:17,nativeNodes:6,excludedNativeTasks:3,associatedTasks:11,childTrial:false,independentTeachingReview:false});
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--log-net-log='+path.join(out,'browser-netlog.json')]});
  provenance.browserVersion=browser.version();
  for(const [width,height] of viewports){
   origin=await createOrigin(root);const {base}=origin;
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});
   context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   page=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(activeLabel+': '+String(e)));
   diagnostics=observeBrowserDiagnostics(page,{out,base,label:()=>activeLabel});
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const visible=async locator=>{
    for(let count=0;count<10;count++){
     const closed=locator.locator('xpath=ancestor::details[not(@open)][last()]');
     if(!(await closed.count())){
      await locator.evaluate(e=>e.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));return;
     }
     await closed.locator(':scope > summary').click();
    }
    throw Error('too many nested disclosures');
   };
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);await visible(input);
    if(await input.evaluate(e=>e.tagName)==='SELECT')await input.selectOption(String(value));else await input.fill(String(value));
   };
   const current=async spec=>page.evaluate(async({id,index})=>{
    const {unpackText}=await import('/storage.js'),state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
    const lesson=state.lessons[id]||state.daily.bridges[id];return{lesson,model:lesson.models[index],record:lesson.cases[index]};
   },spec);
   const action=async(spec,name,data={})=>{
    const before=(await current(spec)).model,suffix=Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join('');
    const button=page.locator(`[data-x="b15-${name}"]${suffix}`);await visible(button);await button.click();
    const after=(await current(spec)).model;
    ok(after.history.length===before.history.length+1&&after.history.at(-1).action==='b15-'+name,activeLabel+' '+name+' leaves one real action');
    ok(same(after.history.slice(0,before.history.length),before.history),activeLabel+' '+name+' preserves every old event');
    ok(Object.keys(after.history.at(-1).data.fields).length===38&&M.valid(taskFor(spec),after),activeLabel+' complete 38-field event and original state are valid');
    return after;
   };
   const build=async(spec,raw)=>{await field('expression',raw);return action(spec,'build');};
   const reduce=async(spec,id,value)=>{await action(spec,'op',{index:id});await field('result',value);return action(spec,'reduce');};
   const run=async(spec,options)=>{
    for(const s of operationPlan(taskFor(spec),options))if(s.field)await field(s.field,s.value);else await action(spec,s.action.slice(4),s.data);
   };
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';
   },spec);
   const reload=async spec=>{
    const before=await current(spec),response=await page.reload();await wait(spec);const after=await current(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' real document reload comes from stopped-origin Service Worker');
    ok(same(before.model,after.model)&&same(before.record,after.record),activeLabel+' reload preserves the complete work and attempts');
    return after;
   };
   const seedEmpty=async spec=>{
    // An inert same-origin SVG has no learning runtime which could write back a
    // previous question during the new fixture's empty-state initialization.
    const inert=await page.goto(base+'icon.svg');ok(inert?.fromServiceWorker()===true,activeLabel+' inert fixture boundary is offline');
    await page.evaluate(async spec=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES},{ensureB39Ready}]=await Promise.all([
      import('/exploration-core.js'),import('/learning/state.js'),import('/learning/bridges.js'),import('/learning/phase4/async-batches.js')]);
     await ensureB39Ready();const state=fresh();
     if(spec){const lesson=freshLesson(spec.id);lesson.index=spec.index;lesson.view='task';
      if(Object.hasOwn(BRIDGES,spec.id))state.daily.bridges[spec.id]=lesson;else state.lessons[spec.id]=lesson;}
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec||null);
   };
   const open=async spec=>{
    await seedEmpty(spec);const response=await page.goto(base+'learn.html#'+spec.id);await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' new lesson document is actually served offline');
    const state=await current(spec);ok(state.model.history.length===0&&!state.record,activeLabel+' only an empty original task was seeded');
   };
   const shot=async name=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    const file=activeLabel+'-'+name+'.png';await page.screenshot({path:path.join(out,file),fullPage:true});return file;
   };
   const checked=async(spec,correct,strict,phase)=>{
    await page.locator('#actions [data-do="check"]').click();
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),activeLabel+' '+phase+' original grading stays '+correct);
    ok(strict?await hint.isVisible():await hint.count()===0,activeLabel+' '+phase+' strict feedback is '+strict);
    const snapshot=await capture(page,out,activeLabel,spec,phase),t=taskFor(spec),proof=replay(t,snapshot.model);
    ok(M.valid(t,snapshot.model)&&M.inspect(t,snapshot.model).correct===correct,activeLabel+' '+phase+' complete actual model matches original verdict');
    ok(!!proof===(strict&&!t.writeOnly||!strict&&!spec.nodeId&&!t.writeOnly&&correct),activeLabel+' '+phase+' mathematical replay matches its separately bound status');
    ok(same(snapshot.record.attempts.at(-1).value,snapshot.model),activeLabel+' '+phase+' latest full submitted snapshot matches');
    if(proof){
     ok(proof.history.length===snapshot.model.history.length&&proof.effectiveSteps.every(s=>s.exact),activeLabel+' '+phase+' all events retained and every effective reduction exact');
     if(spec.answer)ok(same(proof.built.value,spec.answer==='0.5'?['1','2']:[spec.answer,'1']),activeLabel+' '+phase+' result equals fixed reviewed mathematics');
    }
    return{...snapshot,correct,strict,proof,observation:strict?await hint.innerText():null};
   };
   const setup=await warmAndStop(page,origin,cache,ok,String(width));
   const cached=await page.evaluate(async cache=>{
    const store=await caches.open(cache);return Promise.all(['learning/order-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js',
     'learning/thinking-feedback.js','learning/state.js','learning/phase5/b15-model.js','learning/phase5/b15-view.js','learning/phase5/b16.js','storage.js']
     .map(async name=>({name,present:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cached.every(x=>x.present),width+' exact mathematics, original controls and storage dependencies are cached');
   offline.push({width,height,...setup,cached});

   for(const c of reviewed.cases){
    const spec={...c},t=taskFor(spec),phases=[];activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open))&&await hint.count()===0,activeLabel+' optional source guide begins collapsed without evidence');
    await guide.locator('summary').click();await guide.locator('summary').click();
    const supported=await current(spec);ok(supported.record.support&&supported.record.attempts.length===0&&supported.model.history.length===0,activeLabel+' guide keeps support separate from operations and submissions');
    if(t.construct)await build(spec,t.expected);
    await action(spec,'op',{index:c.steps[0][0]});await field('result','999999');await action(spec,'reduce');
    phases.push(await checked(spec,false,false,'failed-reduction'));
    for(const [id,value] of c.steps)await reduce(spec,id,value);
    await field('answer','999999');phases.push(await checked(spec,false,false,'wrong-answer'));
    await field('answer',c.answer);phases.push(await checked(spec,true,true,'corrected'));
    const exactModel=copy(phases.at(-1).model),firstRecord=copy(phases.at(-1).record);
    ok(await page.locator('[data-x="b15-op"]').count()===0&&await page.locator('[data-xfield="result"]').count()===0,
     activeLabel+' completed operations and the old result input really disappear');
    const screenshot=await shot('exact-offline');await reload(spec);ok(await hint.isVisible(),activeLabel+' checked exact evidence returns offline');
    await field('answer',c.answer+' ');ok(await hint.count()===0,activeLabel+' visible equivalent edit immediately makes full snapshot stale');
    await reload(spec);ok(await hint.count()===0,activeLabel+' unsubmitted equivalent edit stays stale after offline reload');
    phases.push(await checked(spec,true,true,'rechecked-equivalent-answer'));
    await action(spec,'reset');ok(await hint.count()===0,activeLabel+' genuine reset requires another complete check');
    const reset=await capture(page,out,activeLabel,spec,'reset-unsubmitted');
    ok(reset.model.answer===c.answer+' '&&reset.model.result===exactModel.result,activeLabel+' reset preserves formerly visible fields when they become hidden');
    await run(spec);phases.push(await checked(spec,true,true,'reset-corrected'));
    const beforeRetry=copy(phases.at(-1).record),retry=page.locator('[data-do="p3-retry"]');await visible(retry);await retry.click();
    const fresh=await capture(page,out,activeLabel,spec,'shared-retry-empty');
    ok(same(fresh.record,beforeRetry)&&fresh.model.history.length===0&&await hint.count()===0,activeLabel+' real shared retry preserves every old attempt and support');
    await run(spec);phases.push(await checked(spec,true,true,'shared-retry-corrected'));
    const final=phases.at(-1);ok(final.record.attempts.length===6&&same(final.record.attempts.slice(0,3),firstRecord.attempts),activeLabel+' all six complete attempts retain the original failure and correction');
    ok(same(final.record.attempts.slice(0,beforeRetry.attempts.length),beforeRetry.attempts),activeLabel+' shared retry never rewrites any old attempt');
    await reload(spec);ok(await hint.isVisible(),activeLabel+' shared retry success persists offline');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),activeLabel+' no horizontal overflow');
    for(const [kind,mutate] of [
     ['completed-operation',m=>M.act(t,m,'b15-op',{index:c.steps[0][0]})],
     ['hidden-reduce',m=>M.act(t,m,'b15-reduce')],
     ['invented-issue',m=>{m.issue='invented';}],
     ['unrepresented-attribute',m=>{m.history[0].data.value='not-a-button-attribute';}]
    ]){
     const forged=copy(exactModel);mutate(forged);ok(M.valid(t,forged)&&M.inspect(t,forged).correct&&replay(t,forged)===null,activeLabel+' counterfactual '+kind+' rejected without modifying browser work');
     forgeries.push({width,height,id:spec.id,index:spec.index,kind,counterfactual:true,model:forged,strict:false});
    }
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,phases,reset,fresh,screenshot});
   }

   for(const variant of boundaryVariants){
    const id=['inexact-intermediate','commuted-construction'].includes(variant)?'powerorder':variant==='insert-mismatch'?'bracketlab':
     ['unready-parent','independent-siblings'].includes(variant)?'orderlab':'storyfraction';
    const index=id==='powerorder'?4:id==='bracketlab'?2:id==='orderlab'?1:0;
    const spec=reviewed.cases.find(c=>c.id===id&&c.index===index),t=taskFor(spec),phases=[];
    activeLabel=`${width}x${height}-boundary-${variant}`;await open(spec);
    await boundaryFlow(variant,{task:t,field,build:raw=>build(spec,raw),reduce:(id,value)=>reduce(spec,id,value),
     action:(name,data)=>action(spec,name,data),run:options=>run(spec,options),
     check:async(correct,strict,phase)=>{phases.push(await checked(spec,correct,strict,phase));},
     staleReload:async()=>{ok(await hint.count()===0,activeLabel+' unbuilt changed text is immediately stale');
      await reload(spec);ok(await hint.count()===0,activeLabel+' unbuilt changed text stays stale offline');},
     model:async()=>copy((await current(spec)).model),assert:(value,message)=>ok(value,activeLabel+' '+message),shot});
    const final=phases.at(-1),first=phases[0];
    if(phases.length>1)ok(same(final.record.attempts.slice(0,first.record.attempts.length),first.record.attempts)&&
     same(final.model.history.slice(0,first.model.history.length),first.model.history),activeLabel+' all old attempts and raw history survive exact correction');
    if(variant==='pending-rounded')ok(final.proof.built.raw==='320-125'&&final.proof.pending.raw==='320.00 − 125'&&!final.proof.pending.appliedByBuild,activeLabel+' unbuilt equivalent text never becomes another executed expression');
    if(variant==='terminal-failed-build')ok(final.proof.currentIssue!==''&&final.proof.failedRequests.length===1,activeLabel+' retained terminal issue is part of the exact proof');
    await reload(spec);ok(await hint.isVisible(),activeLabel+' corrected boundary remains verified after real offline reload');
    const screenshot=await shot('current-exact');boundaries.push({width,height,variant,id,index,phases,screenshot});

    if(variant==='huge-power-reset'){
     const beforeExport=await current(spec);await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
     const pending=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const download=await pending;
     const payload=fs.readFileSync(await download.path(),'utf8'),backup=JSON.parse(payload),file=activeLabel+'-real-export-v2.json';
     fs.writeFileSync(path.join(out,file),payload);
     ok(backup.version===2&&same(backup.state.lessons[id],beforeExport.lesson),activeLabel+' real V2 export preserves huge old failure and exact corrected record');
     await seedEmpty(null);await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
     const importFile=async(text,name)=>{
      await page.locator('#import-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});
      await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');return page.locator('#toast').innerText();
     };
     ok((await importFile(payload,'order-real-export.json')).includes('备份已合并'),activeLabel+' real backup imports into empty test state while offline');
     const imported=await capture(page,out,activeLabel,spec,'backup-imported');
     ok(same(imported.lesson,backup.state.lessons[id]),activeLabel+' import preserves every old history, attempt, first field and support');
     const raw=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
     ok((await importFile(payload,'order-identical-repeat.json')).includes('备份已合并')&&await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===raw,
      activeLabel+' repeated identical backup import is byte-idempotent');
     const toast=await importFile('{','order-corrupt.json');
     ok(!toast.includes('备份已合并')&&await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===raw,activeLabel+' corrupt import rejects without changing a byte');
     await page.goto(base+'learn.html#'+id);await wait(spec);ok(await hint.isVisible(),activeLabel+' restored actual lesson retains its strict checked work');
     await reload(spec);backups.push({width,height,id,index,export:file,imported,corruptRejected:true,identicalImportByteIdempotent:true,screenshot:await shot('backup-restored')});
    }
   }

   for(const entry of [...reviewed.excluded,...reviewed.associated]){
    const spec={id:entry.sessionId,index:entry.index},t=taskFor(spec);activeLabel=`${width}x${height}-isolated-${spec.id}-${spec.index}`;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,activeLabel+' excluded native or associated task has no inherited guide');
    await run(spec);const snapshot=await checked(spec,true,false,'isolated-checked');
    await reload(spec);ok(await hint.count()===0,activeLabel+' excluded source remains isolated after offline restoration');
    isolated.push({width,height,id:spec.id,index:spec.index,writeOnly:!!t.writeOnly,snapshot});
   }
   await context.close();page=null;diagnostics=null;
  }
  ok(!errors.length,'no Chromium runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===34&&observations.every(o=>o.phases.length===6),'all 17 native tasks complete six real submissions in both viewports');
  ok(boundaries.length===20&&isolated.length===28&&forgeries.length===136&&backups.length===2,
   'ten boundary paths, all excluded/associated positions, 136 counterfactual checks and real backup round trips run at both sizes');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report(),null,2));
  console.log('P9_ORDER_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:17,taskViewportPairs:34,boundaryPaths:20,isolated:28}));
 }catch(error){
  const diagnostic=diagnostics?await diagnostics.dump(error).catch(e=>String(e)):null;
  if(page)await page.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report(),error:String(error),at:activeLabel,diagnostic},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{if(origin)await origin.close();if(browser)await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
