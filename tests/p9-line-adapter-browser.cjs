// All ten native tasks at both desktop sizes, using real controls and a stopped origin.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-line-adapter');
const cases=[...['lineproperties','lineorientation'].flatMap(id=>Array.from({length:id==='lineproperties'?3:4},(_,index)=>({id,index}))),{id:'geometrynotation',index:2},{id:'linemark',index:1},{id:'structure34',index:3}];
const checks=[],errors=[],remote=[];const assert=(v,s)=>{if(!v)throw Error(s);checks.push(s);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {solveSteps}=await import('../dist/learning/phase5/b23-model.js');
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 let server;
 try{
  for(const [width,height] of [[1440,900],[1280,720]]){
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(err,data)=>{
     res.writeHead(err?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(err?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'learn.html#lineproperties');
   await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='lineproperties');
   let ready=false;
   for(let n=0;n<300;n++){
    ready=await page.evaluate(async cache=>{
     if(!navigator.serviceWorker.controller)return false;
     return new Promise(resolve=>{
      const ch=new MessageChannel(),timer=setTimeout(()=>resolve(false),1200);
      ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();resolve(e.data?.cache===cache&&e.data.complete===true&&e.data.cached===e.data.total);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[ch.port2]);
     });
    },cache);
    if(ready)break;await page.waitForTimeout(100);
   }
   assert(ready,width+' current offline manifest complete');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   for(const spec of cases){
    const label=`${width}x${height}-${spec.id}-${spec.index}`,task=sessionTasks(spec.id)[spec.index];
    const shot=n=>page.screenshot({path:path.join(out,label+'-'+n+'.png'),fullPage:true});
    const note=page.locator('#thinking-feedback');
    const field=async(k,v)=>page.locator(`[data-xfield="${k}"]`).selectOption(String(v));
    try{
     // Fixture only selects the existing native position. Target work and submissions use UI.
     await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
     await page.goto(base+'learn.html#'+spec.id);
     await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,spec.id);
     await page.evaluate(({id,index})=>{
      const s=JSON.parse(localStorage.getItem('math-explorer-v2'));s.lessons[id].index=index;s.lessons[id].view='task';
      localStorage.setItem('math-explorer-v2',JSON.stringify(s));
     },spec);
     await page.reload();await page.waitForFunction(i=>window.mathLesson?.snapshot().index===i,spec.index);
     assert(await page.locator('#thinking-guide').isVisible(),label+' exact optional guide loads with origin stopped');
     assert(!(await page.locator('#thinking-guide').evaluate(e=>e.open)),label+' guide collapsed');
     assert(await note.count()===0,label+' no unsubmitted evidence');
     await shot('01-guide-offline');
     for(const step of solveSteps(task)){
      if(step.field?.startsWith('answers.'))continue;
      if(step.field)await field(step.field,step.value);
      else await page.locator(`[data-x="${step.action}"]`).click();
     }
     const correct=task.questions[0].value,wrong=task.questions[0].options.find(o=>o[0]!==correct)[0];
     await field('answers.0',wrong);await page.locator('#actions [data-do="check"]').click();
     assert(await note.count()===0,label+' wrong answer grants no feedback offline');
     await field('answers.0',correct);await page.locator('#actions [data-do="check"]').click();
     assert(await note.isVisible(),label+' real checked line comparison visible offline');
     const words=await note.innerText();assert(words.includes('实际检查')&&words.includes('不能推断'),label+' factual limited observation');
     assert(await note.locator('[data-thinking-node-id]').count()===(spec.id==='structure34'?1:0),label+' no cross-source MP attribution');
     await shot('02-verified-offline');
     await page.reload();await page.waitForFunction(i=>window.mathLesson?.snapshot().index===i,spec.index);
     assert(await note.isVisible(),label+' checked snapshot restores offline');
     await field('answers.0',wrong);assert(await note.count()===0,label+' edit immediately removes feedback');
     await shot('03-edited-offline');
     await page.reload();await page.waitForFunction(i=>window.mathLesson?.snapshot().index===i,spec.index);
     assert(await note.count()===0,label+' stale feedback stays absent after offline reload');
     await field('answers.0',correct);await page.locator('#actions [data-do="check"]').click();
     assert(await note.isVisible(),label+' corrected work can be checked again offline');
     const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id],spec.id);
     assert(saved.cases[spec.index].attempts.length===3,label+' all attempts retained');
     assert(!('thinkingScore'in saved)&&!('thinkingMastery'in saved),label+' unchanged v2 scoring boundary');
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no desktop overflow');
    }catch(e){await shot('failure').catch(()=>{});throw e;}
   }
   await context.close();
  }
  assert(errors.length===0,'no browser errors');assert(remote.length===0,'no external requests');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,originStopped:true,childTrial:false,pedagogicalReview:false},null,2));
  console.log('P9_LINE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length}));
 }catch(e){fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,error:String(e)},null,2));console.error(e.stack);process.exitCode=1;}
 finally{if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
