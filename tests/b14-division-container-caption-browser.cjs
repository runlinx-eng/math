// Original B14 operations only. This display correction creates no new
// mathematics evidence binding and does not replace grading or stored work.
const downCases=[
 {id:'longdivide',index:2,n:34,d:5,full:6,remaining:4,oneMissing:1,twoMissing:6},
 {id:'remainders',index:2,n:52,d:9,full:5,remaining:7,oneMissing:2,twoMissing:11},
 {id:'roundanswers',index:3,n:34,d:5,full:6,remaining:4,oneMissing:1,twoMissing:6}
];
const upCases=[{id:'remainders',index:1,n:52,d:9,full:5,minimum:6,remaining:7},
 {id:'link-longproduct-remainders',index:1,n:52,d:9,full:5,minimum:6,remaining:7}];
const workPlan=(F,task)=>{const plan=F.solveSteps(task);return plan.slice(0,plan.findIndex(s=>s.field==='check'));};
const answerPlan=(F,task)=>F.solveSteps(task).filter(s=>['check','answer','base','precision'].includes(s.field));
module.exports={downCases,upCases,workPlan,answerPlan};

if(require.main===module)(async()=>{
 const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/b14-division-container-caption');
 const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],upObservations=[],offline=[];
 const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);},same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 fs.mkdirSync(out,{recursive:true});
 const [{sessionTasks},F]=await Promise.all([import('../dist/learning/bridges.js'),import('../dist/learning/phase5/b14-model.js')]);
 let browser,server,page,label='setup';
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const [width,height]of viewports){
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/',context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(label+': '+String(error)));
   const capture=id=>page.evaluate(async id=>{const{unpackText}=await import('./storage.js'),rawState=localStorage.getItem('math-explorer-v2'),state=JSON.parse(unpackText(rawState));
    return{rawState,state,record:state.lessons[id]||state.daily.bridges[id]};},id);
   const model=async spec=>(await capture(spec.id)).record.models[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},spec);
   const reload=async spec=>{const response=await page.reload();await wait(spec);ok(response?.fromServiceWorker()===true,label+' actual reload uses the stopped-origin Service Worker');};
   const open=async spec=>{
    await page.evaluate(async({id,index})=>{const[{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')]);
     const state=fresh(),lesson=freshLesson(id);lesson.index=index;lesson.view='task';if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=lesson;else state.lessons[id]=lesson;localStorage.setItem(KEY,JSON.stringify(state));},spec);
    await page.goto(base+'learn.html#'+spec.id);await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);await reload(spec);
   };
   const visible=async locator=>{const closed=locator.locator('xpath=ancestor::details[not(@open)]').first();if(await closed.count())await closed.locator(':scope > summary').click();
    await locator.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));};
   const field=async(key,value)=>{const input=page.locator(`[data-xfield="${key}"]`);await visible(input);if(await input.evaluate(e=>e.tagName)==='SELECT')await input.selectOption(String(value));else await input.fill(String(value));};
   const action=async(spec,name,data={})=>{
    const before=await model(spec),selector=`[data-x="${name}"]`+Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join(''),button=page.locator(selector);
    await visible(button);await button.click();const after=await model(spec),task=sessionTasks(spec.id)[spec.index];
    ok(after.history.length===before.history.length+1&&after.history.at(-1).action===name,label+' exactly one original event records '+name);
    ok(F.valid(task,after),label+' the unchanged original model validates the full history');
    if(name==='b14-container')ok(after.board.containers===before.board.containers+Number(data.value),label+' an enabled add or remove really changes selected containers');
   };
   const run=async(spec,plan)=>{for(const step of plan)if(step.field)await field(step.field,step.value);else await action(spec,step.action,step.data);};
   const caption=()=>page.locator('#extra-visual p').filter({hasText:/^已放 /}).innerText();
   const observe=async(spec,expected,stage)=>{
    const m=await model(spec),text=await caption(),cells=await page.locator('#extra-visual .b14-containers > div > b').allTextContents();
    ok(text===`已放 ${m.board.containers} 份；可放 ${m.board.containers*spec.d}，原来 ${spec.n}。${expected}`,label+' '+stage+' reports the actual remaining or missing quantity');
    ok(!/剩 -|还差 -|最多|应选|答案/.test(text),label+' caption contains no negative remainder or automatic final answer');
    ok(same(cells,Array.from({length:m.board.containers},(_,i)=>`${Math.min(spec.d,Math.max(0,spec.n-i*spec.d))}/${spec.d}`)),label+' original automatic filled partial and empty diagrams remain accurate');
    return{stage,caption:text,cells,model:m};
   };
   const submit=async correct=>{await page.locator('#actions [data-do="check"]').click();ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' original grading remains '+(correct?'correct':'revise'));};
   const shot=async name=>{await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));await page.screenshot({path:path.join(out,label+'-'+name+'.png'),fullPage:true});};

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});let ready=false;
   for(let i=0;i<300;i++){
    ready=await page.evaluate(async expected=>{
     if(!navigator.serviceWorker.controller)return false;
     return new Promise(resolve=>{const channel=new MessageChannel(),timeout=setTimeout(()=>{channel.port1.close();resolve(false);},1200);
      channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data?.cache===expected&&e.data.complete===true&&e.data.cached===e.data.total);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);});
    },cache);if(ready)break;await page.waitForTimeout(100);
   }
   ok(ready,width+' explicitly awaited complete cache');
   const modules=await page.evaluate(async cache=>{const store=await caches.open(cache),names=['storage.js','learning/state.js','learning/phase5/b14-view.js','learning/phase5/b14-model.js','learning/phase5/b14.js'];
    return Promise.all(names.map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},cache);
   ok(modules.every(x=>x.cached),width+' required modules cached; missing: '+modules.filter(x=>!x.cached).map(x=>x.name).join(', '));
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});ok(!server.listening,width+' origin stops before every mathematics action');
   offline.push({width,height,cache,modules,originStopped:!server.listening});

   for(const spec of downCases){
    label=`${width}x${height}-${spec.id}-${spec.index}`;const task=sessionTasks(spec.id)[spec.index],stages=[];await open(spec);await run(spec,workPlan(F,task));
    const zero=await model(spec),remove=page.locator('[data-x="b14-container"][data-value="-1"]');ok(await remove.isDisabled(),label+' zero-container removal is disabled');
    stages.push(await observe(spec,`完整装入后剩 ${spec.n}`,'zero'));ok(same(await model(spec),zero),label+' observing a disabled control creates no event');
    for(let i=0;i<spec.full-1;i++)await action(spec,'b14-container',{value:1});stages.push(await observe(spec,`完整装入后剩 ${spec.remaining+spec.d}`,'one-fewer-full'));
    await action(spec,'b14-container',{value:1});stages.push(await observe(spec,`完整装入后剩 ${spec.remaining}`,'full'));await run(spec,answerPlan(F,task));await submit(true);
    const first=await capture(spec.id);
    await action(spec,'b14-container',{value:1});stages.push(await observe(spec,`要把这些份都装满还差 ${spec.oneMissing}`,'partial-last'));await submit(false);await shot('missing-partial');
    const partial=await capture(spec.id);await reload(spec);ok(same(await model(spec),partial.record.models[spec.index]),label+' overfilled work and its actual failed submission restore unchanged offline');
    stages.push(await observe(spec,`要把这些份都装满还差 ${spec.oneMissing}`,'partial-reloaded'));
    await action(spec,'b14-container',{value:1});stages.push(await observe(spec,`要把这些份都装满还差 ${spec.twoMissing}`,'extra-empty'));await submit(false);await shot('missing-empty');
    await action(spec,'b14-container',{value:-1});await action(spec,'b14-container',{value:-1});stages.push(await observe(spec,`完整装入后剩 ${spec.remaining}`,'corrected'));await submit(true);
    const final=await capture(spec.id),attempts=final.record.cases[spec.index].attempts;
    ok(attempts.length===4&&same(attempts.map(a=>F.inspect(task,a.value).correct),[true,false,false,true]),label+' all four complete original attempt outcomes are preserved');
    ok(same(attempts.slice(0,1),first.record.cases[spec.index].attempts)&&same(attempts.at(-1).value,final.record.models[spec.index]),label+' earlier success is intact and the latest corrected full snapshot matches');
    await reload(spec);await submit(true);const rechecked=await capture(spec.id);
    ok(rechecked.record.cases[spec.index].attempts.length===5&&same(rechecked.record.models[spec.index],final.record.models[spec.index]),label+' reloading and explicit checking retain the same actual model');
    await shot('corrected');ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    observations.push({width,height,id:spec.id,index:spec.index,stages,partial,final:rechecked});
   }
   for(const spec of upCases){
    label=`${width}x${height}-up-${spec.id}-${spec.index}`;const task=sessionTasks(spec.id)[spec.index],stages=[];await open(spec);await run(spec,workPlan(F,task));
    stages.push(await observe(spec,`还没安排 ${spec.n}`,'zero'));
    for(let i=0;i<spec.full;i++)await action(spec,'b14-container',{value:1});stages.push(await observe(spec,`还没安排 ${spec.remaining}`,'not-enough'));
    await action(spec,'b14-container',{value:1});stages.push(await observe(spec,'还没安排 0','minimum'));await run(spec,answerPlan(F,task));await submit(true);
    await action(spec,'b14-container',{value:1});stages.push(await observe(spec,'还没安排 0','extra-empty'));await submit(false);
    await action(spec,'b14-container',{value:-1});await submit(true);const final=await capture(spec.id);
    ok(same(final.record.cases[spec.index].attempts.map(a=>F.inspect(task,a.value).correct),[true,false,true]),label+' up still requires its original minimal sufficient count');
    await reload(spec);ok(same(await model(spec),final.record.models[spec.index]),label+' unchanged native or associated up record restores offline');await shot('unchanged');
    upObservations.push({width,height,id:spec.id,index:spec.index,stages,final});
   }
   await context.close();page=null;
  }
  ok(observations.length===6&&upObservations.length===4,'all three down sources plus native and associated up controls complete both viewports');
  ok(!errors.length&&!remote.length,'no runtime errors or external requests');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,upObservations,offline,viewports,childTrial:false},null,2));
  console.log('B14_DIVISION_CONTAINER_CAPTION_BROWSER_OK '+JSON.stringify({checks:checks.length,down:observations.length,up:upObservations.length}));
 }catch(error){
  if(page){await page.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,label+'-failure.html'),await page.content().catch(()=>''));}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,upObservations,offline,error:String(error),at:label},null,2));console.error(error.stack);process.exitCode=1;
 }finally{if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});if(browser)await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
