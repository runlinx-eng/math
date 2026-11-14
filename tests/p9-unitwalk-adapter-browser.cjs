// Fixed-unit fraction walks: all 18 reviewed native tasks, at both desktop sizes.
// Seed only an empty lesson position; every mathematical event and submission
// comes from real controls. Stop the HTTP origin after its complete SW cache.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-unitwalk-adapter');
const cases=Object.entries({lineplaces:[0,1,2,3],unitcopies:[0,1,2],wholefractions:[1,2,3,4],
 translateamount:[3],storyfraction:[2],tenpieces:[0],decimalnames:[1],fractionmeasure:[3],mixedrename:[0,1]})
 .flatMap(([id,indices])=>indices.map(index=>({id,index})));
const thinkingSources={translateamount:'mt_3VmBdlAeOZ',storyfraction:'mt_dXq9VWm31W'};
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],offline=[];
const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {solveSteps,valid,inspect}=await import('../dist/learning/phase5/b16-model.js');
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
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide'),axis=page.locator('.b16-axis');
   const shot=async name=>{
    // Full-page evidence starts at the real top, so the number line is retained
    // instead of all screenshots showing only the last field or sticky actions.
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:path.join(out,activeLabel+'-'+name+'.png'),fullPage:true});
   };
   const field=async(key,value)=>{
    const input=page.locator(`[data-xfield="${key}"]`);
    const closed=input.locator('xpath=ancestor::details[not(@open)]').first();
    if(await closed.count())await closed.locator(':scope > summary').click();
    if(await input.evaluate(element=>element.tagName)==='SELECT')await input.selectOption(String(value));
    else await input.fill(String(value));
   };
   const action=name=>page.locator(`[data-x="b16-${name}"]`).click();
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const state=window.mathLesson?.snapshot();return state?.id===id&&state.index===index&&state.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' document reload is served by the stopped-origin SW');
   };
   const navigate=async spec=>{await page.goto(base+'learn.html#'+spec.id);await reload(spec);};
   const open=async spec=>{
    // Genuine v2 constructors: no completed work, attempts, or event history.
    // Directly choosing a configured index isolates it from earlier tasks.
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([
      import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')
     ]);
     const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    await navigate(spec);
   };
   const answers=async task=>{
    for(const step of solveSteps(task))if(step.field&&step.field!=='parts')await field(step.field,step.value);
   };
   const solveOriginal=async spec=>{
    for(const step of solveSteps(sessionTasks(spec.id)[spec.index])){
     if(step.field)await field(step.field,step.value);
     else await action(step.action.replace(/^b16-/,''));
    }
   };
   const position=async(spec,n)=>{
    const task=sessionTasks(spec.id)[spec.index],m=(await saved(spec.id)).models[spec.index];
    ok(m.board.parts===task.d&&m.board.steps.length===n,activeLabel+' current exact position '+n+'/'+task.d);
    ok(m.board.steps.every((value,index)=>value===index+1),activeLabel+' retained unit positions are consecutive');
    const label=await axis.getAttribute('aria-label');
    ok(label.includes(`每一整个分${task.d}段，已走${n}步`),activeLabel+' displayed scale and current position match '+n+'/'+task.d);
    const max=Math.max(1,Math.ceil(task.n/task.d),task.axisMax||1,Math.ceil(n/task.d));
    const cx=Number(await axis.locator('circle').getAttribute('cx'));
    ok(Math.abs(cx-(30+(n/task.d)/max*580))<1e-9,activeLabel+' marker uses the actual unit length at '+n+'/'+task.d);
   };
   const move=async(spec,direction,n)=>{await action(direction);await position(spec,n);};

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
   ok(ready,width+' complete current offline cache');
   const cachedModules=await page.evaluate(async cache=>{
    const store=await caches.open(cache);
    return Promise.all(['learning/unitwalk-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js',
     'learning/thinking-feedback.js','learning/phase5/b16-model.js','learning/phase5/b16-view.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(item=>item.cached),width+' unit-walk adapter, registry and recursive runtime dependencies cached');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' HTTP source is stopped before all mathematical actions');
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;
    const label=activeLabel,task=sessionTasks(spec.id)[spec.index];
    await open(spec);
    ok(await guide.isVisible(),label+' exact native optional guide works offline');
    ok(!(await guide.evaluate(element=>element.open)),label+' optional guide starts collapsed');
    ok(await hint.count()===0,label+' no evidence before actual mathematical actions');
    await guide.locator('summary').click();
    await page.waitForFunction(({id,index})=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id].cases[index]?.support===true,spec);
    ok(await guide.locator('p').isVisible(),label+' optional question can be opened');
    ok((await saved(spec.id)).cases[spec.index].support,label+' existing v2 support flag records the opened guide');
    if(spec.id==='lineplaces'&&spec.index===0)await shot('01-guide-open');
    await guide.locator('summary').click();
    ok(!(await guide.evaluate(element=>element.open))&&!(await guide.locator('p').isVisible()),label+' optional question can be closed');
    const initial=await saved(spec.id);
    ok(initial.models[spec.index].history.length===0&&initial.cases[spec.index].attempts.length===0,label+' opening and closing a guide creates no mathematical events or submissions');
    if(spec.id==='lineplaces'&&spec.index===0){
     await submit();
     ok(await hint.count()===0,label+' untouched submission cannot earn evidence');
     ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',label+' untouched work fails original grading');
    }

    await field('parts',task.d);await action('partition');await position(spec,0);
    // Every task uses a genuine alternative route: return to zero, walk to
    // the target, cross it by one unit, then step back. Repeated identical
    // forward events are real successive moves, not events to deduplicate.
    await move(spec,'walk',1);await move(spec,'walk-back',0);
    for(let n=1;n<=task.n;n++)await move(spec,'walk',n);
    await move(spec,'walk',task.n+1);await move(spec,'walk-back',task.n);
    await answers(task);
    ok(await hint.count()===0,label+' unsubmitted construction is not a verified observation');
    await field('answer','999');await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',label+' original grader rejects the wrong endpoint answer');
    ok(await hint.count()===0,label+' wrong submission grants no positive evidence');
    await field('answer',`${task.n}/${task.d}`);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',label+' original grader accepts the current work');
    ok(await hint.isVisible(),label+' checked forward and backward steps receive factual feedback');
    const words=await hint.innerText(),state=await saved(spec.id),model=state.models[spec.index];
    ok(words.includes(`1/${task.d}`)&&words.includes(`${task.n}/${task.d}`),label+' feedback names the actual unit fraction and endpoint');
    ok(words.includes(`前进 ${task.n+2} 次`)&&words.includes('后退 2 次'),label+' feedback describes the observed forward and backward counts');
    ok(words.includes('没有自动评价自由解释、独立论证、表示转换能力或长期掌握'),label+' feedback states its interpretation boundary');
    ok(model.history.filter(event=>event.action==='walk').length===task.n+2&&
     model.history.filter(event=>event.action==='walk-back').length===2,label+' actual forward and backward counts are preserved');
    ok(model.history.length===task.n+5&&model.history[0].action==='partition'&&model.history.every(event=>event.data.fields.parts===String(task.d)),label+' every persisted event uses the same intended unit');
    ok(valid(task,model)&&inspect(task,model).correct,label+' persisted work independently satisfies original model inspection');
    const node=thinkingSources[spec.id];
    if(node)ok(await hint.locator(`[data-thinking-node-id="${node}"]`).count()===1&&words.includes('MP.2'),label+' only the exact reviewed MP.2 source is attached');
    else ok(await hint.locator('[data-thinking-node-id]').count()===0&&!words.includes('MP.2'),label+' ordinary fraction knowledge does not inherit MP.2');
    await shot('02-verified-offline');
    await reload(spec);ok(await hint.isVisible(),label+' checked work restores after offline reload');
    ok(JSON.stringify((await saved(spec.id)).models[spec.index])===JSON.stringify(model),label+' offline reload preserves the complete mathematical workpiece');

    await field('answer','999');
    ok(await hint.count()===0,label+' editing the current answer immediately removes old feedback');
    if(spec.id==='lineplaces'&&spec.index===0)await shot('03-edited');
    await reload(spec);ok(await hint.count()===0,label+' edited work cannot revive old feedback on refresh');
    await submit();ok(await hint.count()===0,label+' a failing latest submission cannot reuse an earlier success');
    await field('answer',`${task.n}/${task.d}`);await submit();
    ok(await hint.isVisible(),label+' rechecking the corrected current answer restores evidence');
    await move(spec,'walk-back',task.n-1);
    ok(await hint.count()===0,label+' a real backward move immediately invalidates the checked position');
    await reload(spec);ok(await hint.count()===0,label+' a changed position remains unverified after offline refresh');
    await position(spec,task.n-1);await move(spec,'walk',task.n);
    ok(await hint.count()===0,label+' returning to the same endpoint with new events still requires a fresh submission');
    await submit();ok(await hint.isVisible(),label+' fresh submission verifies the new complete route');
    const end=await saved(spec.id),endModel=end.models[spec.index],attempts=end.cases[spec.index].attempts;
    ok(attempts.length===(spec.id==='lineplaces'&&spec.index===0?6:5),label+' all failed and successful attempts remain in history');
    ok(attempts.every(attempt=>attempt.id&&attempt.at&&attempt.value&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean'),label+' original v2 attempt shape is retained');
    ok(endModel.history.length===task.n+7&&endModel.board.steps.length===task.n,label+' later reverse and forward events remain even at the same endpoint');
    const finalWords=await hint.innerText();
    ok(finalWords.includes(`前进 ${task.n+3} 次`)&&finalWords.includes('后退 3 次'),label+' refreshed feedback recomputes the complete new route');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no mastery or score fields are created');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' desktop page has no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,node:node||null,n:task.n,d:task.d,
     observation:words,finalObservation:finalWords,history:endModel.history.map(event=>event.action),
     forward:task.n+3,backward:3,attempts:attempts.length});
   }

   // These real but invalid histories can finish with a correct original grade.
   // Their invalid earlier steps must not be erased by later valid operations.
   const negative={id:'lineplaces',index:2},negativeTask=sessionTasks(negative.id)[negative.index];
   for(const variant of ['zero-back','duplicate-partition','reset','wrong-scale','changed-input-scale','upper-noop','walk-before-partition']){
    activeLabel=`${width}x${height}-negative-${variant}`;await open(negative);
    if(variant==='zero-back')await action('walk-back');
    if(variant==='duplicate-partition'){await field('parts',negativeTask.d);await action('partition');}
    if(variant==='reset'){
     await field('parts',negativeTask.d);await action('partition');await action('walk');await action('reset');
    }
    if(variant==='wrong-scale'){await field('parts','2');await action('partition');await action('walk');}
    if(variant==='walk-before-partition'){await field('parts',negativeTask.d);await action('walk');}
    if(variant==='upper-noop'){
     await field('parts',negativeTask.d);await action('partition');
     const limit=(Math.ceil(negativeTask.n/negativeTask.d)+1)*negativeTask.d;
     for(let n=0;n<=limit;n++)await action('walk');
     ok((await saved(negative.id)).models[negative.index].board.steps.length===limit,activeLabel+' extra upper-bound walk has no mathematical effect');
     for(let n=limit;n>negativeTask.n;n--)await action('walk-back');
     await answers(negativeTask);
    }else if(variant==='changed-input-scale'){
     await field('parts',negativeTask.d);await action('partition');
     await field('parts','2');await action('walk');await field('parts',negativeTask.d);
     for(let n=1;n<negativeTask.n;n++)await action('walk');
     await answers(negativeTask);
    }else await solveOriginal(negative);
    await submit();
    const m=(await saved(negative.id)).models[negative.index];
    ok(valid(negativeTask,m)&&inspect(negativeTask,m).correct,activeLabel+' original mathematical grading remains unchanged');
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' original UI still passes the final work');
    ok(await hint.count()===0,activeLabel+' strict evidence rejects the invalid earlier event');
    await reload(negative);ok(await hint.count()===0,activeLabel+' offline restore cannot erase an invalid history');
    negativeObservations.push({width,height,variant,history:m.history.map(event=>event.action),board:m.board,originalCorrect:true,strictFeedback:false});
    await shot('rejected');
   }

   // Switch away from an MP.2-bearing course without replacing its saved data.
   // A d=1 task in another course may pass but cannot borrow the previous source.
   const source={id:'translateamount',index:3};activeLabel=`${width}x${height}-cross-course-source`;
   await open(source);await solveOriginal(source);await submit();
   ok(await hint.locator('[data-thinking-node-id="mt_3VmBdlAeOZ"]').count()===1,activeLabel+' reviewed source is initially present');
   const sourceWork=JSON.stringify((await saved(source.id)).models[source.index]);
   const outside={id:'wholefractions',index:0};activeLabel=`${width}x${height}-unreviewed-integer`;
   await navigate(outside);
   ok(await guide.count()===0&&await hint.count()===0,activeLabel+' switching courses never transfers an old guide or feedback');
   await solveOriginal(outside);await submit();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' excluded integer task keeps original grading');
   ok(await hint.count()===0,activeLabel+' same widget cannot inherit a reviewed source');await shot('checked');
   activeLabel=`${width}x${height}-cross-course-return`;await navigate(source);
   ok(JSON.stringify((await saved(source.id)).models[source.index])===sourceWork,activeLabel+' other-course learning preserves the original work');
   ok(await hint.locator('[data-thinking-node-id="mt_3VmBdlAeOZ"]').count()===1,activeLabel+' returning restores only the matching source evidence');

   for(const isolated of [{id:'repeatfraction',index:2},{id:'link-translateamount-viewlinks',index:0}]){
    activeLabel=`${width}x${height}-isolation-${isolated.id}-${isolated.index}`;await open(isolated);
    const grouped=isolated.id==='repeatfraction';
    if(grouped)ok((await guide.innerText()).includes('一次接几小份'),activeLabel+' chunk=1 uses the separately reviewed grouped guide');
    else ok(await guide.count()===0,activeLabel+' associated task receives no native guide');
    await solveOriginal(isolated);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' original grouped or associated grading still works');
    if(grouped)ok(await hint.isVisible()&&(await hint.innerText()).includes('整组前进')&&await hint.locator('[data-thinking-node-id]').count()===0,activeLabel+' chunk=1 receives only the independent grouped contract without an MP label');
    else ok(await hint.count()===0,activeLabel+' an identical associated task cannot inherit native evidence');
    await reload(isolated);
    ok(grouped?await hint.isVisible()&&(await hint.innerText()).includes('整组前进'):await hint.count()===0,activeLabel+' source and mathematical-contract isolation survive offline refresh');await shot('checked');
   }
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===cases.length*viewports.length,'all 18 native tasks complete at both desktop sizes');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,offline,
   nativeTasks:cases.length,nativeNodes:9,taskViewportPairs:observations.length,viewports,originStopped:offline.every(x=>x.originStopped),
   childTrial:false,independentTeachingReview:false},null,2));
  console.log('P9_UNITWALK_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes:9,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,offline,error:String(error),at:activeLabel},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
