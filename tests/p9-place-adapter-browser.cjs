// Reviewed integer or separately selected decimal tasks at both desktop sizes. Only an
// empty lesson position is seeded; mathematical work uses actual UI controls.
// Every case runs with the HTTP origin stopped after the complete SW cache.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const decimalScope=process.env.MATH_PLACE_EVIDENCE_SCOPE==='decimal';
const root=path.resolve(__dirname,'..'),out=path.join(root,decimalScope?'verification/p9-decimal-place-adapter':'verification/p9-place-adapter');
const groups=decimalScope?{decimalsum:[1,2,3,4],decimalmeasure3:[1,2],fractionmeasure:[1],fractionfour:[13,14]}:
 {onesbridge:[0,1],tensmove:[3],decadetake:[2],twodigitpair:[0,1],flexhundred:[0,1],
 oneslarge:[3],tenslarge:[2,3],showwhy:[0,2],fourparts:[2],buildthousand:[0,1,2],
 columnthree:[1,3],flexthousand:[2,4],columnfour:[1,3],columnlarge:[1,3,4]};
const cases=Object.entries(groups).flatMap(([id,indices])=>indices.map(index=>({id,index})));
const nativeNodes=Object.keys(groups).length;
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negativeObservations=[],offline=[];
const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const amount=counts=>counts.reduce((sum,n,i)=>sum+n*10**i,0);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {solveSteps,valid,inspect,answer,fmt,rowOffset}=await import('../dist/learning/phase5/b11-model.js');
 const displayedAnswer=task=>fmt(answer(task),task.scale??1);
 const {replayPlaceEvidence}=await import('../dist/learning/place-evidence.js');
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
    else await input.fill(String(value));
   };
   const click=(name,data={})=>page.locator(`[data-x="${name}"]`+
    Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('')).click();
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const saved=id=>page.evaluate(id=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];
   },id);
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{
    const state=window.mathLesson?.snapshot();return state?.id===id&&state.index===index&&state.view==='task';
   },spec);
   const reload=async spec=>{
    const response=await page.reload();await wait(spec);
    ok(response?.fromServiceWorker()===true,activeLabel+' document reload comes from the stopped-origin SW');
   };
   const navigate=async spec=>{await page.goto(base+'learn.html#'+spec.id);await reload(spec);};
   const open=async spec=>{
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
   const act=async(spec,name,data={})=>{
    const before=await model(spec);await click(name,data);const after=await model(spec);
    const task=sessionTasks(spec.id)[spec.index],event=after.history.at(-1);
    ok(event?.action===name&&after.history.length===before.history.length+1,activeLabel+' actual '+name+' appends one existing v2 event');
    if(name==='b11-exchange'){
     const index=Number(data.index),expected=[...before.counts];
     if(data.dir==='up'){expected[index]-=10;expected[index+1]++;}
     else{expected[index]--;expected[index-1]+=10;}
     ok(JSON.stringify(after.counts)===JSON.stringify(expected),activeLabel+' exchange changes only adjacent decimal places');
     ok(amount(after.counts)===amount(before.counts),activeLabel+' exchange preserves the full mathematical quantity');
     ok(JSON.stringify(event.before)===JSON.stringify(before.counts),activeLabel+' persisted exchange records its actual before state');
    }else if(name==='b11-remove'){
     const index=Number(data.index),count=before.remaining[index];
     ok(after.counts[index]===before.counts[index]-count&&after.remaining[index]===0,activeLabel+' take removes the outstanding units in this column');
     ok(amount(before.counts)-amount(after.counts)===count*10**index,activeLabel+' take changes the quantity by the correct unit scale');
     ok(event.needed===count,activeLabel+' take preserves the actual outstanding number');
    }else if(name==='b11-place-start'){
     ok(after.started,activeLabel+' original alignment starts the construction');
     ok(amount(after.counts)===(task.op==='+'?answer(task):task.values[0]),activeLabel+' aligned starting piles represent exactly the original operands');
     ok(JSON.stringify(after.align)===JSON.stringify(task.values.map((_,i)=>String(rowOffset(task,i)))),activeLabel+' each written last digit aligns with its actual place unit');
    }
    return after;
   };
   const steps=async(spec,list)=>{
    for(const step of list){if(step.field)await field(step.field,step.value);else await act(spec,step.action,step.data);}
   };
   const solve=spec=>steps(spec,solveSteps(sessionTasks(spec.id)[spec.index]));
   const detour=async spec=>{
    const before=await model(spec),index=before.counts.findIndex((n,i)=>i>0&&n>0);
    ok(index>0,activeLabel+' a real higher unit is available for an alternative route');
    await act(spec,'b11-exchange',{index,dir:'down'});
    await act(spec,'b11-exchange',{index:index-1,dir:'up'});
    ok(JSON.stringify((await model(spec)).counts)===JSON.stringify(before.counts),activeLabel+' genuine alternative exchanges return to the same quantity and digits');
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
   ok(ready,width+' complete current offline cache');
   const cachedModules=await page.evaluate(async cache=>{
    const store=await caches.open(cache);
    return Promise.all(['learning/place-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js',
     'learning/thinking-feedback.js','learning/phase5/b11-model.js','learning/phase5/b11-view.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   ok(cachedModules.every(item=>item.cached),width+' place adapter, registry and runtime dependencies are cached');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   ok(!server.listening,width+' HTTP origin is stopped before mathematical operations');
   offline.push({width,height,cache,complete:ready,originStopped:!server.listening,cachedModules});

   for(const spec of cases){
    activeLabel=`${width}x${height}-${spec.id}-${spec.index}`;
    const task=sessionTasks(spec.id)[spec.index];await open(spec);
    ok(await guide.isVisible(),activeLabel+' exact native optional guide works offline');
    ok(!(await guide.evaluate(element=>element.open)),activeLabel+' optional guide starts collapsed');
    ok(await hint.count()===0,activeLabel+' no positive evidence before actions or checking');
    await guide.locator('summary').click();
    await page.waitForFunction(({id,index})=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id].cases[index]?.support===true,spec);
    ok(await guide.locator('p').isVisible(),activeLabel+' optional mathematical question is readable');
    if(spec.id===cases[0].id&&spec.index===cases[0].index)await shot('01-guide-open');
    await guide.locator('summary').click();
    ok(!(await guide.evaluate(element=>element.open)),activeLabel+' optional guide closes again');
    const initial=await saved(spec.id);
    ok(initial.models[spec.index].history.length===0&&initial.cases[spec.index].attempts.length===0,activeLabel+' guide alone creates no mathematical event or submission');
    await solve(spec);await detour(spec);
    ok(await hint.count()===0,activeLabel+' correct unsubmitted work has no current evidence');
    await field('answer','999999');await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise',activeLabel+' wrong answer fails original grading');
    ok(await hint.count()===0,activeLabel+' failed submission yields no positive evidence');
    await field('answer',displayedAnswer(task));await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' corrected current work passes original grading');
    ok(await hint.isVisible(),activeLabel+' actual exchanges yield bounded factual feedback');
    const words=await hint.innerText(),first=await model(spec),proof=replayPlaceEvidence(task,first);
    ok(!!proof&&valid(task,first)&&inspect(task,first).correct,activeLabel+' actual persisted work satisfies strict and original checks');
    const up=first.history.filter(e=>e.action==='b11-exchange'&&e.dir==='up').length;
    const down=first.history.filter(e=>e.action==='b11-exchange'&&e.dir==='down').length;
    ok(words.includes(`向高位合并 ${up} 次`)&&words.includes(`向低位拆开 ${down} 次`),activeLabel+' feedback reports actual exchange directions and counts');
    ok(words.includes('数量守恒')&&words.includes(`结果 ${displayedAnswer(task)} 相符`),activeLabel+' feedback relates conserved exchanges to the actual displayed result');
    if(decimalScope){
     const names=task.scale===100?['百分之一','十分之一','一','十','百']:['千分之一','百分之一','十分之一','一','十','百'];
     const event=first.history.find(e=>e.action==='b11-exchange'),next=event.index+(event.dir==='up'?1:-1);
     ok(words.includes(names[event.index])&&words.includes(names[next]),activeLabel+' feedback names the actual fractional units on both sides of the exchange');
     ok(!words.includes(`结果 ${answer(task)} 相符`),activeLabel+' raw integer smallest units never appear as the displayed answer');
     ok(proof.scale===task.scale&&proof.total===answer(task),activeLabel+' exact internal integer quantity remains distinct from its display scale');
    }
    ok(/解释|证明|掌握/.test(words),activeLabel+' feedback states its interpretation boundary');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),activeLabel+' ordinary arithmetic source receives no borrowed thinking label');
    ok(!Object.hasOwn(first,'board'),activeLabel+' original top-level counts and remaining are preserved without a fictional board');
    await shot('02-verified-offline');await reload(spec);
    ok(await hint.isVisible(),activeLabel+' checked result restores on offline reload');
    ok(JSON.stringify(await model(spec))===JSON.stringify(first),activeLabel+' complete mathematical work survives offline reload');
    await field('answer','999999');
    ok(await hint.count()===0,activeLabel+' editing immediately removes old feedback');
    if(spec.id===cases[0].id&&spec.index===cases[0].index)await shot('03-edited');
    await reload(spec);ok(await hint.count()===0,activeLabel+' edited answer cannot revive stale feedback after refresh');
    await submit();ok(await hint.count()===0,activeLabel+' newer failed check cannot reuse older success');
    await field('answer',displayedAnswer(task));await submit();ok(await hint.isVisible(),activeLabel+' fresh correct check restores current evidence');

    const previous=await model(spec),column=previous.counts.findIndex((n,i)=>i>0&&n>0);
    await act(spec,'b11-exchange',{index:column,dir:'down'});
    ok(await hint.count()===0,activeLabel+' actual mathematical editing invalidates the current evidence');
    await reload(spec);ok(await hint.count()===0,activeLabel+' unsubmitted decomposed work remains unverified after refresh');
    await act(spec,'b11-exchange',{index:column-1,dir:'up'});
    ok(await hint.count()===0,activeLabel+' returning to the same digits with new events still needs a check');
    await submit();ok(await hint.isVisible(),activeLabel+' new complete history passes after a fresh check');
    const end=await saved(spec.id),m=end.models[spec.index],attempts=end.cases[spec.index].attempts;
    ok(attempts.length===5,activeLabel+' all failed and successful attempts remain in history');
    ok(attempts.every(attempt=>attempt.id&&attempt.at&&attempt.value&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean'),activeLabel+' existing v2 submission format remains');
    ok(m.history.length===first.history.length+2&&amount(m.counts)===answer(task),activeLabel+' later reversible exchanges remain in the current history');
    ok(m.remaining.every(n=>n===0),activeLabel+' all required take-away quantities have been removed');
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),activeLabel+' no mastery or score storage is introduced');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),activeLabel+' desktop page has no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,values:task.values,scale:task.scale??1,displayedAnswer:displayedAnswer(task),align:m.align,operation:task.op,written:!!task.written,
     observation:words,finalObservation:await hint.innerText(),history:m.history,counts:m.counts,remaining:m.remaining,attempts:attempts.length});
   }

   // Both mistakes use genuinely reachable controls. The original grader may
   // later pass; the earlier invalid event must remain excluded from evidence.
   for(const variant of ['misaligned-start','insufficient-take']){
    const spec=decimalScope?(variant==='misaligned-start'?{id:'decimalmeasure3',index:2}:{id:'decimalsum',index:3}):
     {id:'onesbridge',index:variant==='misaligned-start'?0:1},task=sessionTasks(spec.id)[spec.index];
    activeLabel=`${width}x${height}-negative-${variant}`;await open(spec);
    const all=solveSteps(task),startAt=all.findIndex(step=>step.action==='b11-place-start');
    await steps(spec,all.slice(0,startAt));
    if(variant==='misaligned-start'){
     await field('align.0',rowOffset(task,0)===0?'1':'0');await click('b11-place-start');
     ok(!(await model(spec)).started,activeLabel+' wrong actual alignment refuses to start');
     await field('align.0',rowOffset(task,0));await act(spec,'b11-place-start');
    }else{
     await act(spec,'b11-place-start');await click('b11-remove',{index:0});
     ok(!!(await model(spec)).issue,activeLabel+' taking unavailable units is an actual failed action');
    }
    await steps(spec,all.slice(startAt+1));await submit();const m=await model(spec);
    ok(valid(task,m)&&inspect(task,m).correct,activeLabel+' original final-work grading remains unchanged');
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' original UI accepts the final mathematical answer');
    ok(await hint.count()===0&&!replayPlaceEvidence(task,m),activeLabel+' strict evidence does not erase an earlier invalid event');
    await reload(spec);ok(await hint.count()===0,activeLabel+' invalid history remains excluded after offline refresh');
    negativeObservations.push({width,height,variant,history:m.history,originalCorrect:true,strictFeedback:false});await shot('rejected');
   }

   // Switch courses without replacing the source's actual saved evidence.
   const source=decimalScope?{id:'decimalsum',index:1}:{id:'onesbridge',index:0},outside={id:'tensmove',index:0};
   activeLabel=`${width}x${height}-cross-course-source`;await open(source);await solve(source);await submit();
   ok(await hint.isVisible(),activeLabel+' reviewed source initially has verified evidence');
   const sourceWork=JSON.stringify(await model(source));
   activeLabel=`${width}x${height}-cross-course-outside`;await navigate(outside);
   ok(await guide.count()===0&&await hint.count()===0,activeLabel+' changing course removes the previous source guide and evidence');
   await solve(outside);await submit();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct'&&await hint.count()===0,activeLabel+' another real native task passes without borrowing evidence');
   activeLabel=`${width}x${height}-cross-course-return`;await navigate(source);
   ok(JSON.stringify(await model(source))===sourceWork&&await hint.isVisible(),activeLabel+' returning preserves and restores only the matching saved evidence');

   // Decimal tasks now have a separately reviewed scope. Unreviewed native
   // arithmetic and independent associated work still cannot inherit evidence.
   for(const spec of [{id:'tensmove',index:0},{id:'hundredsmove',index:0},
    {id:decimalScope?'link-columnlarge-decimalsum':'link-basicadd-onesbridge',index:1}]){
    activeLabel=`${width}x${height}-isolation-${spec.id}-${spec.index}`;await open(spec);
    ok(await guide.count()===0&&await hint.count()===0,activeLabel+' outside tasks receive no native exchange guide');
    await solve(spec);await submit();
    ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',activeLabel+' excluded original task remains usable');
    ok(await hint.count()===0,activeLabel+' same widget cannot inherit reviewed native evidence');
    await reload(spec);ok(await hint.count()===0,activeLabel+' source isolation survives offline restoration');await shot('checked');
   }
   await context.close();activePage=null;
  }
  ok(!errors.length,'no browser runtime errors');ok(!remote.length,'no external requests');
  ok(observations.length===cases.length*viewports.length,`all ${cases.length} ${decimalScope?'decimal':'integer'} native tasks complete at both desktop sizes`);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,offline,
   scope:decimalScope?'decimal':'integer',nativeTasks:cases.length,nativeNodes,taskViewportPairs:observations.length,viewports,
   originStopped:offline.every(x=>x.originStopped),childTrial:false,independentTeachingReview:false},null,2));
  console.log((decimalScope?'P9_DECIMAL_PLACE_ADAPTER_BROWSER_OK ':'P9_PLACE_ADAPTER_BROWSER_OK ')+
   JSON.stringify({checks:checks.length,nativeTasks:cases.length,nativeNodes,taskViewportPairs:observations.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,activeLabel+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negativeObservations,offline,error:String(error),at:activeLabel},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
