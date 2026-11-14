// Actual B17 controls at both desktop sizes. Only empty lesson positions are
// seeded; every mathematical action and submission occurs after HTTP shutdown.
// Export the control plan without importing Playwright so Node can independently
// prove each planned field/button is present in the unchanged original V.render.
function operationPlan(F,task,{prediction='negative',forms,denominator}={}){
 const aa=F.frac(forms?.[0]||task.a),bb=F.frac(forms?.[1]||task.b),result=F.operation(task),steps=[];
 const field=(stage,key,value)=>steps.push({stage,field:key,value:String(value)});
 const action=(stage,name,data={})=>steps.push({stage,action:name,data});
 field('start','prediction',prediction);action('start','predict-op');
 field('start','aform',forms?.[0]||F.ftext(aa));field('start','bform',forms?.[1]||F.ftext(bb));action('start','forms');
 if(task.op==='*'){
  for(let index=aa[0]-1;index>=0;index--)action('construct','column',{index});
  for(let index=bb[0]-1;index>=0;index--)action('construct','row',{index});
 }else{
  const D=denominator||F.lcm(aa[1],bb[1]);field('construct','denom',D);action('construct','common');
  for(const [row,r]of[['left',aa],['right',bb]])for(let index=r[0]*D/r[1]-1;index>=0;index--)action('construct','shade',{row,index});
  if(task.op==='/'){
   for(let i=0;i<Math.floor(result[0]/result[1]);i++)action('finish','fit');action('finish','rest');
  }else action('finish','combine');
 }
 if(task.op==='/'){
  field('answer','whole',Math.floor(result[0]/result[1]));field('answer','part',`${result[0]%result[1]}/${result[1]}`);
 }
 field('answer','answer',F.ftext(result));field('answer','reason',task.op==='*'?'scale':task.op==='/'?'groups':'same-parts');
 return steps;
}
const correctionVariants=['early-combine','early-rest','extra-fit-reset','raw-decimal-reset','percent-reset','rounded-common',
 'empty-predict','wrong-forms','bad-common','early-fit'];
module.exports={operationPlan,correctionVariants};

if(require.main===module)(async()=>{
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {cases,associated}=require('./fixtures/p9-fraction-operations-cases.cjs');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-fraction-operations-adapter');
 const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],explorationObservations=[],associatedObservations=[],offline=[];
 const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 fs.mkdirSync(out,{recursive:true});
 const [{sessionTasks},F,{replayFractionOperationsEvidence:replay},{ensureB39Ready}]=await Promise.all([
  import('../dist/learning/bridges.js'),import('../dist/learning/phase5/b17-model.js'),
  import('../dist/learning/fraction-operations-evidence.js'),import('../dist/learning/phase4/async-batches.js')
 ]);
 await ensureB39Ready();let browser,server,activePage,activeLabel='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const [width,height]of viewports){
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/,'')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/',context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push(activeLabel+': '+String(error)));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const shot=async name=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,activeLabel+'-'+name+'.png'),fullPage:true});
   };
   const visible=async locator=>{
    const closed=locator.locator('xpath=ancestor::details[not(@open)]').first();
    if(await closed.count())await closed.locator(':scope > summary').click();
    await locator.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
   };
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);await visible(input);
    if(await input.evaluate(element=>element.tagName)==='SELECT')await input.selectOption(String(value));else await input.fill(String(value));
   };
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const button=page.locator(`[data-x="b17-${name}"]${suffix}`);await visible(button);await button.click();
   };
   const capture=id=>page.evaluate(async id=>{
    const {unpackText}=await import('./storage.js'),rawState=localStorage.getItem('math-explorer-v2'),state=JSON.parse(unpackText(rawState));
    return {rawState,state,record:state.lessons[id]||state.daily.bridges[id]};
   },id);
   const model=async spec=>(await capture(spec.id)).record.models[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' real document reload uses the stopped-origin Service Worker');
   };
   const open=async spec=>{
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES},{ensureB39Ready}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js'),import('./learning/phase4/async-batches.js')
     ]);
     await ensureB39Ready();const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    // Hash-only navigation can return null and can retain the old question.
    // Wait only for the lesson runtime, then reload before testing its new index.
    await page.goto(base+'learn.html#'+spec.id);
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);await reload(spec);
   };
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const checked=async correct=>{
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),activeLabel+' original grading reports '+(correct?'correct':'revise'));
   };
   const mathematicalAction=async(spec,name,data={})=>{
    const before=await model(spec),task=sessionTasks(spec.id)[spec.index];await action(name,data);const after=await model(spec);
    ok(after.history.length===before.history.length+1&&after.history.at(-1).a===name,activeLabel+' '+name+' preserves one real original event');
    ok(F.valid(task,after),activeLabel+' original model validates after '+name);
    ok(Object.keys(after.history.at(-1).f).length===28,activeLabel+' full 28-field event snapshot is retained');
    for(const key of ['left','right','columns','rows'])ok(new Set(after.board[key]).size===after.board[key].length,activeLabel+' '+key+' has no repeated identity');
    if(name==='shade'){
     const row=data.row,selected=after.board[row].includes(Number(data.index));
     ok(selected!==before.board[row].includes(Number(data.index)),activeLabel+' the clicked part identity really toggles');
     ok(await page.locator(`[data-x="b17-shade"][data-row="${row}"][aria-pressed="true"]`).count()===after.board[row].length,
      activeLabel+' displayed selected parts match the recorded row');
    }
    return after;
   };
   const run=async(spec,stages=['start','construct','finish','answer'],options={})=>{
    for(const step of operationPlan(F,sessionTasks(spec.id)[spec.index],options))if(stages.includes(step.stage)){
     if(step.field)await field(step.field,step.value);else await mathematicalAction(spec,step.action,step.data);
    }
   };
   const roundTrip=async spec=>{
    const task=sessionTasks(spec.id)[spec.index],before=await model(spec),side=task.op==='*'?'columns':'left',index=before.board[side].at(-1);
    const name=task.op==='*'?'column':'shade',data=task.op==='*'?{index}:{row:'left',index};
    await mathematicalAction(spec,name,data);await mathematicalAction(spec,name,data);
    if(task.op!=='*')await run(spec,['finish']);
    ok(same((await model(spec)).board,before.board),activeLabel+' a real reversible edit restores the same board but retains its changed history');
   };
   const verifyProof=(spec,m)=>{
    const task=sessionTasks(spec.id)[spec.index],proof=replay(task,m);
    ok(F.valid(task,m)&&F.inspect(task,m).correct&&!!proof,activeLabel+' original grading and independent exact replay both accept actual work');
    ok(same(proof.quantities.result,spec.result||F.operation(task)),activeLabel+' exact result matches the reviewed operands');
    ok(proof.events.length===m.history.length&&proof.events.every((e,i)=>e.index===i&&typeof e.accepted==='boolean'),
     activeLabel+' proof retains every original history index and its actual accepted status');
    ok(same(proof.failedRequests,proof.events.filter(e=>!e.accepted)),activeLabel+' failed requests are a complete subset of retained history');
    const successfulIndices=proof.division?[...proof.division.fitIndices,...proof.division.restIndices]:proof.combination?.combineIndices||[];
    ok(successfulIndices.every(i=>proof.events[i]?.accepted===true),activeLabel+' only successful requests support the current construction');
    if(proof.common){
     ok(same(proof.common.unit,[1,m.board.denom]),activeLabel+' unit is the current actual common part');
     ok(proof.common.left.length===proof.common.counts[0]&&proof.common.right.length===proof.common.counts[1],activeLabel+' selected identities represent both entire original quantities');
    }
    if(proof.division){
     const d=proof.division;ok(d.wholeGroups*d.groupPieces+d.remainingPieces===d.originalPieces&&d.remainingPieces>=0&&d.remainingPieces<d.groupPieces,
      activeLabel+' whole groups and remainder conserve the original quantity');
     ok(d.fitIndices.length===d.wholeGroups&&d.fitIndices.every(i=>i>proof.constructionAfterIndex),activeLabel+' current groups use only fits after the last invalidating edit');
    }
    if(proof.product)ok(proof.product.cellCount*proof.quantities.result[1]===proof.quantities.result[0]*proof.product.cellArea[1],
     activeLabel+' actual selected rows and columns determine the exact intersection area');
    return proof;
   };

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let ready=false;
   for(let n=0;n<300;n++){
    ready=await page.evaluate(async expected=>{
     if(!navigator.serviceWorker.controller)return false;
     return new Promise(resolve=>{
      const channel=new MessageChannel(),timeout=setTimeout(()=>{channel.port1.close();resolve(false);},1200);
      channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data?.cache===expected&&event.data.complete===true&&event.data.cached===event.data.total);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
    },cache);
    if(ready)break;await page.waitForTimeout(100);
   }
   ok(ready,width+' explicit awaited status confirms the complete current offline cache');
   const cachedModules=await page.evaluate(async cache=>{
    const store=await caches.open(cache),names=['storage.js','exploration-core.js','learning/state.js','learning/fraction-operations-evidence.js',
     'learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/phase5/b17-model.js',
     'learning/phase5/b17-view.js','learning/phase5/b16-model.js','learning/phase4/async-batches.js','learning/phase5/b39.js'];
    return Promise.all(names.map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(x=>x.cached),width+' all math and storage modules are cached; missing: '+cachedModules.filter(x=>!x.cached).map(x=>x.name).join(', '));
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' HTTP origin stops before every mathematical operation');
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;const task=sessionTasks(spec.id)[spec.index];await open(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),activeLabel+' source-bound optional guide starts collapsed');
    ok(await hint.count()===0,activeLabel+' no strict feedback before mathematical work');
    await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),activeLabel+' optional question opens');
    await guide.locator('summary').click();const blank=(await capture(spec.id)).record;
    ok(blank.cases[spec.index]?.support===true&&blank.models[spec.index].history.length===0&&blank.cases[spec.index].attempts.length===0,
     activeLabel+' guide sets the existing support flag without creating operations or attempts');
    await run(spec);const constructed=await model(spec),initialProof=verifyProof(spec,constructed);
    ok(initialProof.firstPrediction==='negative',activeLabel+' a lawful incorrect initial prediction is preserved');
    ok(await hint.count()===0,activeLabel+' correct but unsubmitted work remains unverified');
    await field('answer','999');await submit();await checked(false);ok(await hint.count()===0,activeLabel+' wrong answer earns no strict feedback');
    await run(spec,['answer']);await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' fresh correct complete snapshot receives feedback');
    const firstModel=await model(spec),firstRecord=await capture(spec.id),words=await hint.innerText();verifyProof(spec,firstModel);
    const name=r=>r[1]===1?String(r[0]):r.join('/');
    if(initialProof.product)ok(words.includes(name(initialProof.product.cellArea))&&words.includes(String(initialProof.product.cellCount))&&/工具.*交集/.test(words),
     activeLabel+' multiplication feedback names the actual unit and the tool-generated intersection');
    else if(initialProof.division)ok(words.includes(name(initialProof.division.remainingAmount))&&words.includes(name(initialProof.division.fractionOfGroup))&&/原来单位.*一组/.test(words),
     activeLabel+' division feedback distinguishes the original-unit remainder from its fraction of a group');
    else ok(words.includes(name(initialProof.common.unit))&&words.includes(String(initialProof.combination.resultCount))&&/工具显示/.test(words),
     activeLabel+' addition or subtraction feedback attributes the actual result bar to the tool');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),activeLabel+' no unrelated mathematical-practice tag is attached');
    await shot('verified-offline');await reload(spec);
    ok(await hint.isVisible()&&same(await model(spec),firstModel),activeLabel+' offline reload restores the exact checked work');
    await field('answer','998');ok(await hint.count()===0,activeLabel+' editing a visible answer immediately invalidates old feedback');
    await reload(spec);ok(await hint.count()===0,activeLabel+' pending edited work stays unverified after a real offline reload');
    await submit();await checked(false);ok(await hint.count()===0,activeLabel+' failed latest submission cannot borrow an earlier success');
    await run(spec,['answer']);await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' explicit correct recheck restores evidence');
    await roundTrip(spec);ok(await hint.count()===0,activeLabel+' changed real event history needs its own new check');
    await reload(spec);ok(await hint.count()===0,activeLabel+' changed history remains unverified offline');
    await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' new complete submission verifies the edited history');
    const final=await capture(spec.id),m=final.record.models[spec.index],attempts=final.record.cases[spec.index].attempts,proof=verifyProof(spec,m);
    ok(attempts.length===5&&attempts.every(x=>x.id&&x.at&&typeof x.supported==='boolean'&&typeof x.exposed==='boolean'&&F.valid(task,x.value)),
     activeLabel+' all five original complete attempts and their metadata are retained');
    ok(same(attempts.at(-1).value,m)&&same(attempts.slice(0,2),firstRecord.record.cases[spec.index].attempts),
     activeLabel+' latest snapshot matches while earlier wrong and correct attempts are unchanged');
    ok(!Object.hasOwn(final.record,'thinkingScore')&&!Object.hasOwn(final.record,'thinkingMastery'),activeLabel+' no invented score or mastery data');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),activeLabel+' no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,firstModel,finalModel:m,attempts,proof,
     observation:words,finalObservation:await hint.innerText(),rawState:final.rawState,state:final.state});
   }

   for(const variant of correctionVariants){
    const spec={id:'fractionfour',index:['early-rest','early-fit','extra-fit-reset'].includes(variant)?3:0},task=sessionTasks(spec.id)[spec.index];
    activeLabel=`${width}x${height}-negative-${variant}`;await open(spec);let failure=null,inexact=null;
    const failed=async name=>{
     const before=await model(spec),expected=F.act(task,structuredClone(before),name),after=await mathematicalAction(spec,name);
     ok(same(after,expected)&&same(after.board,before.board),activeLabel+' failed visible request retains the complete unchanged original state');
     ok(same(after.history.slice(0,before.history.length),before.history),activeLabel+' failure keeps every earlier raw event');
     ok(same(after.history.at(-1).f,Object.fromEntries(Object.keys(F.fields).map(k=>[k,before[k]]))),
      activeLabel+' failure records all 28 actual field strings without alteration');
     const originalCorrect=F.inspect(task,after).correct;await submit();await checked(originalCorrect);
     const strictFeedback=originalCorrect;
     if(strictFeedback){
      const proof=verifyProof(spec,after);
      ok(variant==='extra-fit-reset'&&proof.failedRequests.length===1&&proof.division.fitIndices.length===1&&await hint.isVisible(),
       activeLabel+' a retained failure does not invalidate the previously complete construction after a fresh check');
     }else ok(replay(task,after)===null&&await hint.count()===0,activeLabel+' incomplete construction still cannot create strict feedback');
     const checkedState=await capture(spec.id),attempts=checkedState.record.cases[spec.index].attempts;
     ok(attempts.length===1&&same(attempts[0].value,after),activeLabel+' the original failed-request snapshot is actually checked and retained');
     failure={before,after,index:before.history.length,originalCorrect,strictFeedback,...checkedState};
     await reload(spec);
     ok((strictFeedback?await hint.isVisible():await hint.count()===0)&&same(await model(spec),after),
      activeLabel+' real offline reload preserves the failed request, its exact issue and the verified current status');
     await shot('failed-request');
    };
    if(['raw-decimal-reset','percent-reset'].includes(variant)){
     await field('prediction','more');await mathematicalAction(spec,'predict-op');
     await field('aform',variant==='raw-decimal-reset'?'0.750000000':'75%');await field('bform','2/3');await failed('forms');
     ok((await model(spec)).board.forms===null,activeLabel+' original input rejection is observed before reset');
     await mathematicalAction(spec,'reset');await run(spec);
    }else if(variant==='extra-fit-reset'){
     await run(spec);await failed('fit');ok((await model(spec)).issue!=='',activeLabel+' extra visible fit really fails');
     await mathematicalAction(spec,'reset');await run(spec);
    }else if(variant==='empty-predict'){
     await failed('predict-op');ok((await model(spec)).board.first===null,activeLabel+' the empty request creates no first prediction');await run(spec);
    }else if(variant==='wrong-forms'){
     await field('prediction','negative');await mathematicalAction(spec,'predict-op');
     await field('aform','0');await field('bform','2/3');await failed('forms');
     await field('aform','3/4');await mathematicalAction(spec,'forms');await run(spec,['construct','finish','answer']);
    }else if(variant==='bad-common'){
     await run(spec,['start']);await field('denom','5');await failed('common');await run(spec,['construct','finish','answer']);
    }else{
     await run(spec,['start']);await field('denom',variant==='rounded-common'?'12.0000000000000001':'12');
     const before=await model(spec),after=await mathematicalAction(spec,'common');
     if(variant==='rounded-common'){
      ok(after.board.denom===12&&!same(before.board,after.board)&&after.issue==='',activeLabel+' original floating-point coercion changes the board despite the inexact written unit');
      inexact={before,after,index:before.history.length};
     }else await failed(variant==='early-rest'?'rest':variant==='early-fit'?'fit':'combine');
     await run(spec,['construct','finish','answer']);
    }
    await submit();await checked(true);const final=await capture(spec.id),m=final.record.models[spec.index],attempts=final.record.cases[spec.index].attempts;
    ok(F.valid(task,m)&&F.inspect(task,m).correct,activeLabel+' original final-result grading remains unchanged');
    let proof=null,observation=null;
    if(variant==='rounded-common'){
     ok(replay(task,m)===null&&await hint.count()===0,activeLabel+' original tool acceptance of an inexact unit remains insufficient for strict evidence');
     ok(attempts.length===1&&same(attempts[0].value,m)&&same(m.history.slice(0,inexact.after.history.length),inexact.after.history),
      activeLabel+' the complete inexact original history and its final checked snapshot are retained');
    }else{
     proof=verifyProof(spec,m);const e=proof.events[failure.index];
     ok(proof.failedRequests.length===1&&e.accepted===false&&e.effect===false&&e.action===failure.after.history.at(-1).a,
      activeLabel+' exactly one failed request remains separate from successful construction');
     ok(same(e.before,failure.before.board)&&same(e.after,failure.after.board)&&same(e.fields,failure.after.history.at(-1).f)&&e.issue===failure.after.issue,
      activeLabel+' the failure proof retains both original states, all 28 fields and the original issue');
     ok(same(m.history.slice(0,failure.after.history.length),failure.after.history)&&attempts.length===2&&
        same(attempts[0],failure.record.cases[spec.index].attempts[0])&&same(attempts[1].value,m),
      activeLabel+' final success preserves the entire failed history and its previously checked attempt');
     ok(await hint.isVisible(),activeLabel+' actual correction or reset followed by complete construction earns fresh strict feedback');
     observation=await hint.innerText();
     if(variant==='empty-predict'){
      ok(proof.firstPrediction==='negative'&&proof.predictions.length===1&&proof.predictions[0].index>failure.index&&/空选择请求.*没有留下估计/.test(observation),
       activeLabel+' the later valid selection is the first prediction; an empty request is not described as a guess');
     }else ok(/尚未完成的请求.*不计作成功接合、放组或余量显示/.test(observation),
      activeLabel+' feedback explicitly separates failed requests from the actual completed construction');
     ok(!/MP\.\d/.test(observation)&&await hint.locator('[data-thinking-node-id]').count()===0,
      activeLabel+' corrected work does not borrow unrelated method tags');
    }
    await reload(spec);
    ok((variant==='rounded-common'?await hint.count()===0:await hint.isVisible())&&same(await model(spec),m),
     activeLabel+' complete final history and its current feedback status persist offline');
    await shot(variant==='rounded-common'?'rejected':'corrected');
    negativeObservations.push({width,height,variant,id:spec.id,index:spec.index,model:m,record:final.record,rawState:final.rawState,state:final.state,
     failure,inexact,proof,strictFeedback:variant!=='rounded-common',observation});
   }

   for(const variant of ['rescale-common','reset-preserves-first','repeat-confirmation']){
    const spec={id:'fractionfour',index:3},task=sessionTasks(spec.id)[spec.index];activeLabel=`${width}x${height}-explore-${variant}`;
    await open(spec);await run(spec);const before=await model(spec),oldLength=before.history.length;
    if(variant==='rescale-common')await run(spec,['construct','finish','answer'],{denominator:24});
    else if(variant==='reset-preserves-first'){await mathematicalAction(spec,'reset');await run(spec,undefined,{prediction:'more'});}
    else{await mathematicalAction(spec,'rest');await mathematicalAction(spec,'rest');}
    await submit();await checked(true);ok(await hint.isVisible(),activeLabel+' legal exploration retains strict evidence');
    const final=await capture(spec.id),m=final.record.models[spec.index],proof=verifyProof(spec,m);
    ok(same(m.history.slice(0,oldLength),before.history),activeLabel+' earlier complete event snapshots are preserved');
    if(variant==='rescale-common')ok(proof.division.groupPieces===16&&proof.division.fitIndices.length===1&&proof.division.fitIndices[0]>=oldLength,
     activeLabel+' current 16-part group is not attributed to the previous 8-part fit');
    if(variant==='reset-preserves-first')ok(proof.firstPrediction==='negative'&&proof.currentPrediction==='more'&&proof.currentEpoch===1,
     activeLabel+' reset separates epochs while retaining the original first prediction');
    if(variant==='repeat-confirmation')ok(proof.events.at(-1).effect===false&&proof.events.at(-2).effect===false,
     activeLabel+' repeated valid confirmations are not described as new groups');
    await reload(spec);ok(await hint.isVisible()&&same(await model(spec),m),activeLabel+' checked exploration restores offline');await shot('checked');
    explorationObservations.push({width,height,variant,id:spec.id,index:spec.index,before,model:m,proof,record:final.record,rawState:final.rawState,state:final.state,observation:await hint.innerText()});
   }

   for(const spec of associated){
    activeLabel=`${width}x${height}-associated-${spec.id}-${spec.index}`;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,activeLabel+' associated task inherits no native guide or evidence');
    await run(spec);await submit();await checked(true);const final=await capture(spec.id);verifyProof(spec,final.record.models[spec.index]);
    ok(await hint.count()===0,activeLabel+' correct associated mathematics cannot borrow the native source binding');
    await reload(spec);ok(await hint.count()===0,activeLabel+' associated isolation persists offline');await shot('checked');
    associatedObservations.push({width,height,id:spec.id,index:spec.index,record:final.record,rawState:final.rawState,state:final.state});
   }
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===20,'all ten original tasks complete five submissions in both viewports');
  ok(negativeObservations.length===20&&negativeObservations.filter(x=>x.strictFeedback).length===18&&
     negativeObservations.filter(x=>!x.strictFeedback).length===2&&explorationObservations.length===6&&associatedObservations.length===4,
   'all six original boundary paths plus four new correction paths, three legal explorations and two associated tasks run in both viewports');
  const checkedSnapshots=observations.reduce((n,x)=>n+x.attempts.length,0)+
   [...negativeObservations,...explorationObservations,...associatedObservations].reduce((n,x)=>n+x.record.cases[x.index].attempts.length,0);
  ok(checkedSnapshots===148,'all 148 original checked snapshots remain complete, including each unresolved request and its later corrected submission');
  const result={checks,errors,remote,observations,negativeObservations,explorationObservations,associatedObservations,offline,viewports,
   nativeTasks:cases.length,nativeNodes:new Set(cases.map(c=>c.nodeId)).size,taskViewportPairs:observations.length,checkedSnapshots,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log('P9_FRACTION_OPERATIONS_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage){
   await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
   fs.writeFileSync(path.join(out,activeLabel+'-failure.html'),await activePage.content().catch(()=>''));
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,explorationObservations,
   associatedObservations,offline,error:String(error),at:activeLabel},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
