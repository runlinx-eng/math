// All 53 new native array/sequence positions, using genuine controls at both
// desktop sizes. An empty lesson position is the only seeded learning state.
// The source HTTP server is stopped before every mathematical interaction.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {capture}=require('./helpers/p9-basic-artifact.cjs');
const reviewed=require('./fixtures/p9-mature-expansion-cases.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-mature-expansion');
const cases=Object.entries(reviewed).flatMap(([family,specs])=>specs.map(spec=>({...spec,family})));
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],explorationObservations=[],isolations=[],offline=[];
const ok=(condition,message)=>{if(!condition)throw Error(message);checks.push(message);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const [{sessionTasks,BRIDGES},arrays,patterns,{replayArrayEvidence},{replaySequenceEvidence}]=await Promise.all([
  import('../dist/learning/bridges.js'),import('../dist/learning/phase5/b13-model.js'),
  import('../dist/learning/phase5/b34-model.js'),import('../dist/learning/array-evidence.js'),import('../dist/learning/sequence-evidence.js')
 ]);
 const modelFor=family=>family==='array'?arrays:patterns;
 const replayFor=family=>family==='array'?replayArrayEvidence:replaySequenceEvidence;
 let browser,server,activePage,activeLabel='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const [width,height] of viewports){
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push(activeLabel+': '+String(error)));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const shot=async name=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,activeLabel+'-'+name+'.png'),fullPage:true});
   };
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);
    const closed=input.locator('xpath=ancestor::details[not(@open)]').first();
    if(await closed.count())await closed.locator(':scope > summary').click();
    if(await input.evaluate(element=>element.tagName)==='SELECT')await input.selectOption(String(value));
    else if(await input.getAttribute('type')==='range'){
     // Keyboard events operate the actual range control; no injected values,
     // synthetic input dispatch or direct model writes establish construction.
     const min=Number(await input.getAttribute('min')||0),max=Number(await input.getAttribute('max')||100);
     const step=Number(await input.getAttribute('step')||1),target=Number(value);
     ok(Number.isFinite(target)&&target>=min&&target<=max,activeLabel+' range target is inside its real control');
     const fromLow=target-min<=max-target;
     await input.focus();await input.press(fromLow?'Home':'End');
     const moves=Math.round((fromLow?target-min:max-target)/step);
     for(let i=0;i<moves;i++)await input.press(fromLow?'ArrowRight':'ArrowLeft');
     ok(Number(await input.inputValue())===target,activeLabel+' keyboard set '+key+' to '+target);
    }else await input.fill(String(value));
   };
   const action=name=>page.locator(`[data-x="${name}"]`).click();
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const state=window.mathLesson?.snapshot();return state?.id===id&&state.index===index&&state.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' reload uses the stopped-origin Service Worker');
   };
   const navigate=async spec=>{await page.goto(base+'learn.html#'+spec.id);await reload(spec);};
   const open=async(spec,keep=false)=>{
    await page.evaluate(async({id,index,keep})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')
     ]);
     const state=keep?JSON.parse(localStorage.getItem(KEY))||fresh():fresh();
     const lesson=freshLesson(id);lesson.index=index;lesson.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
     localStorage.setItem(KEY,JSON.stringify(state));
    },{...spec,keep});
    await navigate(spec);
   };
   const solve=async(spec,{alternative=false}={})=>{
    const task=sessionTasks(spec.id)[spec.index],steps=modelFor(spec.family).solveSteps(task);
    const cut=alternative&&task.split&&task.requiredCut===undefined?task.b-1:null;
    let sequenceSteps=0;
    for(const step of steps){
     if(step.field){
      const value=cut!==null&&step.field==='cut'?cut:cut!==null&&step.field==='left'?task.a*cut*(task.unit||1):
       cut!==null&&step.field==='right'?task.a*(task.b-cut)*(task.unit||1):step.value;
      await field(step.field,value);
     }else{
      await action(step.action);
      if(alternative&&spec.family==='sequence'&&++sequenceSteps===1){
       // The genuine undo control exists while the sequence is unfinished.
       // Undo and restore the first advance before completing later terms.
       await action('p34-undo');await action('p34-next');
      }
     }
    }
   };
   const answerInfo=spec=>{
    const task=sessionTasks(spec.id)[spec.index];
    if(spec.family==='array'){
     const value=task.hidden==='a'?task.a:task.hidden==='b'?task.b*(task.unit||1):task.a*task.b*(task.unit||1);
     return {field:'answer',correct:String(value),wrong:'999999'};
    }
    const q=task.questions[0];
    return {field:'answers.0',correct:String(q.value),wrong:q.options?
     String(q.options.find(([value])=>value!==q.value&&!(q.accepted||[]).includes(value))[0]):'999999'};
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
   ok(ready,width+' current complete offline cache');
   const cachedModules=await page.evaluate(async cache=>{
    const store=await caches.open(cache);
    return Promise.all(['learning/sequence-evidence.js','learning/array-evidence.js','learning/evidence-contract.js',
     'learning/evidence-adapters.js','learning/thinking-feedback.js','learning/phase5/b13-model.js',
     'learning/phase5/b13-view.js','learning/phase5/b34-model.js','learning/phase5/b34-view.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(item=>item.cached),width+' both adapters and runtime dependencies are cached');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' HTTP origin is stopped before all mathematical actions');
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.family}-${spec.id}-${spec.index}`;
    const label=activeLabel,task=sessionTasks(spec.id)[spec.index],answers=answerInfo(spec);
    const snapshots=[],save=async phase=>{const x=await capture(page,out,activeLabel,spec,phase);snapshots.push(x);return x;};
    await open(spec);
    ok(await guide.isVisible(),label+' reviewed native optional guide exists offline');
    ok(!(await guide.evaluate(element=>element.open)),label+' guide starts collapsed');
    ok(await hint.count()===0,label+' no evidence before actions and submission');
    await guide.locator('summary').click();
    await page.waitForFunction(({id,index})=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id].cases[index]?.support===true,spec);
    ok(await guide.locator('p').isVisible(),label+' optional guide opens');
    await guide.locator('summary').click();
    ok(!(await guide.evaluate(element=>element.open)),label+' optional guide closes');
    const empty=await saved(spec.id);
    ok(empty.models[spec.index].history.length===0&&empty.cases[spec.index].attempts.length===0,label+' guide creates no operation or attempt');
    await solve(spec,{alternative:true});
    const construction=(await saved(spec.id)).models[spec.index];
    ok(modelFor(spec.family).valid(task,construction)&&modelFor(spec.family).inspect(task,construction).correct,label+' actual controls build an originally correct mathematical workpiece');
    const proof=replayFor(spec.family)(task,construction);
    ok(!!proof,label+' independently replayed mathematical construction is valid');
    if(spec.family==='array'){
     const shape=page.locator('.b13-array-scene .b13-array');
     ok(await shape.locator('i').count()===task.a*task.b,label+' rendered array retains every original cell');
     ok(await shape.getAttribute('aria-label')===`${construction.board.rows}行，每行${construction.board.cols}格`,label+' displayed row/column orientation matches the replay');
    }else{
     const chips=(await page.locator('.p34-world .p34-chip').allTextContents()).map(x=>x.trim());
     ok(JSON.stringify(chips)===JSON.stringify(proof.displayValues),label+' every displayed sequence term matches exact replay');
     ok(proof.undos===1&&proof.advances===task.length,label+' meaningful undo and redo were genuine control actions');
    }
    ok(await hint.count()===0,label+' unsubmitted correct work is not presented as verified');
    await field(answers.field,answers.wrong);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',label+' original grader rejects wrong answer');
    ok(await hint.count()===0,label+' wrong submission has no positive feedback');
    await save('wrong-answer');
    await field(answers.field,answers.correct);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',label+' original grader accepts corrected work');
    ok(await hint.isVisible(),label+' checked current mathematical evidence is visible');
    const words=await hint.innerText();
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.[1-8]/.test(words),label+' native content source inherits no MP method');
    ok(words.includes('长期掌握'),label+' observation has an explicit interpretation boundary');
    if(spec.family==='sequence'){
     for(const q of task.questions)ok(words.includes(q.label),label+' feedback names the real question '+q.label);
     if(!task.questions.some(q=>q.label.includes('下一项')))ok(!words.includes('预测下一项是'),label+' distant/current item is never mislabeled the next term');
    }
    if(task.hidden)ok(words.includes('未知量')&&words.includes('已代回原来的'),label+' feedback checks the requested unknown and substitution');
    if(task.repeated)ok(words.includes('连加'),label+' row addition receives its own bounded observation');
    if(task.reverseEquation)ok(words.includes('总量写在等号左边'),label+' reverse equation keeps its original required orientation');
    if(task.approximate)ok(words.includes('每箱大约200个')&&words.includes('5箱大约有 1000 个')&&words.includes('没有验证实际箱子的精确总数'),label+' approximate context stays approximate');
    await shot('verified-offline');
    const checked=(await saved(spec.id)).models[spec.index];
    await save('first-correct');
    await reload(spec);ok(await hint.isVisible(),label+' current checked work restores offline');
    ok(JSON.stringify((await saved(spec.id)).models[spec.index])===JSON.stringify(checked),label+' complete workpiece survives offline reload');
    const restored=await save('restored');
    await field(answers.field,answers.wrong);
    ok(await hint.count()===0,label+' editing immediately invalidates old feedback');
    await reload(spec);ok(await hint.count()===0,label+' edited work remains unverified after refresh');
    await submit();ok(await hint.count()===0,label+' newer failure cannot revive the older correct attempt');
    await save('edited-failure');
    await field(answers.field,answers.correct);await submit();
    ok(await hint.isVisible(),label+' current corrected submission restores evidence');
    await save('corrected-answer');
    await reload(spec);ok(await hint.isVisible(),label+' final corrected work restores before its fifth independent check');
    await submit();ok(await hint.isVisible(),label+' fifth check still uses the latest full workpiece');
    const final=await save('final-correct');
    const end=await saved(spec.id),attempts=end.cases[spec.index].attempts;
    ok(attempts.length===5&&attempts.every(attempt=>attempt.id&&attempt.at&&attempt.value),label+' all original four plus final offline recheck and v2 shapes remain');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no capability scores are created');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no desktop horizontal overflow');
    observations.push({width,height,...spec,observation:words,attempts:attempts.length,proof,
     history:end.models[spec.index].history,snapshots,firstModel:checked,restoredModel:restored.model,finalModel:final.model,record:final.record});
   }

   // Retain the same four real explorations. A failed next or empty undo does
   // not advance; a repeated shape/cut is still an actual visible operation.
   const negatives=[
    {id:'linear34',index:1,family:'sequence',variant:'initial-undo'},
    {id:'rules34',index:1,family:'sequence',variant:'wrong-next'},
    {id:'arraystart',index:0,family:'array',variant:'duplicate-shape'},
    {id:'tables12',index:0,family:'array',variant:'duplicate-cut'}
   ];
   for(const spec of negatives){
    activeLabel=`${width}x${height}-negative-${spec.variant}`;await open(spec);
    const snapshots=[],save=async phase=>{const x=await capture(page,out,activeLabel,spec,phase);snapshots.push(x);return x;};
    if(spec.variant==='initial-undo')await action('p34-undo');
    if(spec.variant==='wrong-next'){await field('value','999');await action('p34-next');}
    if(spec.family==='sequence'){await submit();ok(await hint.count()===0,activeLabel+' incomplete failed/no-op work receives no completion evidence');await save('failed-request');await shot('failed-request');}
    await solve(spec);
    if(spec.family==='array'){await submit();ok(await hint.isVisible(),activeLabel+' first complete array checks before the repeated request');await save('before-repeat');}
    if(spec.variant==='duplicate-shape')await action('b13-shape');
    if(spec.variant==='duplicate-cut')await action('b13-cut');
    await submit();
    const task=sessionTasks(spec.id)[spec.index],m=(await saved(spec.id)).models[spec.index];
    ok(modelFor(spec.family).valid(task,m)&&modelFor(spec.family).inspect(task,m).correct,activeLabel+' original grader still accepts the final work');
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' original UI passing rule is unchanged');
    const proof=replayFor(spec.family)(task,m);ok(!!proof&&await hint.isVisible(),activeLabel+' strict replay retains the genuine exploration and corrected effects');
    if(spec.variant==='initial-undo')ok(proof.noOpUndos===1&&proof.undos===0,activeLabel+' empty undo never counts as a removed term');
    if(spec.variant==='wrong-next')ok(proof.failedSteps===1&&proof.first==='999',activeLabel+' wrong first input remains recorded without advancing');
    if(spec.variant==='duplicate-shape')ok(proof.shapeRequests===2&&proof.shapes===1&&proof.confirmations.length===1,activeLabel+' repeat shape confirms the same board without a second construction');
    if(spec.variant==='duplicate-cut')ok(proof.cutRequests===2&&proof.cuts===1&&proof.confirmations.length===1,activeLabel+' repeat cut confirms the same cut without a second partition');
    const first=await save('first-correct');await shot('corrected');
    await reload(spec);ok(await hint.isVisible(),activeLabel+' offline restore keeps the complete exploratory history');const restored=await save('restored');
    ok(JSON.stringify(restored.model)===JSON.stringify(first.model),activeLabel+' full exploratory work survives offline reload');
    await submit();await save('rechecked');
    const answers=answerInfo(spec);await field(answers.field,answers.wrong);await submit();ok(await hint.count()===0,activeLabel+' newer failed answer cannot reuse older success');await save('edited-failure');
    await field(answers.field,answers.correct);await submit();ok(await hint.isVisible(),activeLabel+' newest corrected snapshot restores evidence');
    const final=await save('final-correct');ok(final.attempts.length===5,activeLabel+' five complete exploration snapshots retained');
    explorationObservations.push({width,height,...spec,originalCorrect:true,strictFeedback:true,snapshots,firstModel:first.model,restoredModel:restored.model,finalModel:final.model,record:final.record,history:final.model.history,observation:await hint.innerText()});
   }

   // Verify a genuine MP course and a newly bound domain course coexist in the
   // saved state without sharing attribution or replacing each other's work.
   const source={id:'tables34',index:2,family:'sequence'};
   activeLabel=`${width}x${height}-source-mp8`;await open(source);await solve(source);await submit();
   ok(await hint.locator('[data-thinking-node-id="mt_2jbUekyTu4"]').count()===1,activeLabel+' original exact MP.8 source remains');
   const original=JSON.stringify((await saved(source.id)).models[source.index]);
   const domain={id:'linear34',index:2,family:'sequence'};
   activeLabel=`${width}x${height}-source-domain`;await open(domain,true);await solve(domain);await submit();
   ok(await hint.isVisible()&&await hint.locator('[data-thinking-node-id]').count()===0,activeLabel+' new domain facts have no inherited MP label');
   ok((await hint.innerText()).includes('第10项'),activeLabel+' actual question is the tenth term');
   await navigate(source);
   ok(JSON.stringify((await saved(source.id)).models[source.index])===original,activeLabel+' switching courses preserves the MP lesson work');
   ok(await hint.locator('[data-thinking-node-id="mt_2jbUekyTu4"]').count()===1,activeLabel+' returning restores only the original source');

   for(const [family,type] of [['sequence','x-p34-sequence'],['array','x-mularray']]){
    const found=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).map((task,index)=>({id,index,task}))).find(spec=>spec.task.type===type);
    ok(!!found,family+' reused association fixture exists');
    const spec={id:found.id,index:found.index,family};
    activeLabel=`${width}x${height}-isolation-${family}`;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,activeLabel+' associated task has no native guide or evidence');
    await solve(spec);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' associated task keeps original grading');
    ok(await hint.count()===0,activeLabel+' associated task cannot inherit native evidence');
    await reload(spec);ok(await hint.count()===0,activeLabel+' association isolation survives offline refresh');
    isolations.push({width,height,...spec,...await capture(page,out,activeLabel,spec,'checked'),strictFeedback:false});
    await shot('checked');
   }
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===53*viewports.length,'all 53 newly bound tasks complete at both desktop sizes');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,explorationObservations,isolations,offline,
   nativeTasks:53,nativeNodes:27,taskViewportPairs:observations.length,viewports,
   originStopped:offline.every(item=>item.originStopped),childTrial:false,independentTeachingReview:false},null,2));
  console.log('P9_MATURE_EXPANSION_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:53,nativeNodes:27,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,explorationObservations,isolations,offline,error:String(error),at:activeLabel},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
