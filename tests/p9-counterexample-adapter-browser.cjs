// Two native B38 rational counterexample tasks at desktop sizes, offline after origin stops.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-counterexample-adapter');
const checks=[],errors=[],remote=[];const ok=(v,msg)=>{if(!v)throw Error(msg);checks.push(msg);};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 let server;
 try{
  for(const [width,height] of [[1440,900],[1280,720]]){
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(err,data)=>{
     res.writeHead(err?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(err?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'v2.html#trail');
   await page.locator('#import-file').waitFor({state:'attached'});
   let cached=false;
   for(let i=0;i<300;i++){
    cached=await page.evaluate(async expected=>{
     if(!navigator.serviceWorker.controller)return false;
     return new Promise(resolve=>{
      const channel=new MessageChannel(),timeout=setTimeout(()=>resolve(false),1200);
      channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data?.cache===expected&&e.data.complete===true&&e.data.cached===e.data.total);};
      navigator.serviceWorker.controller.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
     });
    },cache);
    if(cached)break;await page.waitForTimeout(100);
   }
   ok(cached,width+' active offline cache complete');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   for(const index of [3,4]){
    const label=width+'x'+height+'-argument38-'+index;
    const screenshot=n=>page.screenshot({path:path.join(out,label+'-'+n+'.png'),fullPage:true});
    const field=async(k,v)=>{
     const input=page.locator('[data-xfield="'+k+'"]');
     const closed=input.locator('xpath=ancestor::details[not(@open)]').first();
     if(await closed.count())await closed.locator(':scope > summary').click();
     if(await input.evaluate(e=>e.tagName)==='SELECT')await input.selectOption(v);
     else await input.fill(v);
    };
    try{
     // A pristine native lesson has no persistent v2 record until its first
     // mutation. Set up only the isolated test fixture, with the repository's
     // genuine schema constructors, BEFORE navigating to the offline lesson.
     // All mathematical actions, checks and edits below still use real UI.
     await page.evaluate(async index=>{
      const [{KEY,fresh},{freshLesson}]=await Promise.all([
       import('./exploration-core.js'),import('./learning/state.js')
      ]);
      const state=fresh(),lesson=freshLesson('argument38');
      lesson.index=index;lesson.view='task';
      state.lessons.argument38=lesson;
      localStorage.setItem(KEY,JSON.stringify(state));
     },index);
     ok(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('math-explorer-v2'))?.lessons?.argument38),label+' exact native fixture initialized');
     await page.goto(base+'learn.html#argument38');
     // Navigating to the same URL may not reload the existing document.
     // Force a real new lesson runtime after switching fixture index 3 -> 4.
     await page.reload();
     await page.waitForFunction(index=>{
      const s=window.mathLesson?.snapshot();
      return s?.id==='argument38'&&s.view==='task'&&s.index===index;
     },index);
     const guide=page.locator('#thinking-guide'),hint=page.locator('#thinking-feedback');
     ok(await guide.isVisible(),label+' native optional prompt offline');
     ok(!(await guide.evaluate(e=>e.open)),label+' prompt initially collapsed');
     ok(await hint.count()===0,label+' no unsubmitted thinking evidence');
     await screenshot('01-guide');
     // A true mathematical comparison is made by real controls; then original grader checks.
     await field('value','6');await field('second','1/2');await field('choice','greater');
     await page.locator('[data-x="r38-test"]').click();
     await page.locator('#actions [data-do="check"]').click();
     ok(await hint.count()===0,label+' wrong prediction gives no feedback');
     // Start a fresh native task for a clean history, rather than claiming a
     // repaired invalid history is strict proof (the original grader still allows it).
     await page.evaluate(async index=>{
      const {sessionTasks}=await import('./learning/bridges.js');
      const {defaultModel}=await import('./learning/tasks.js');
      const s=JSON.parse(localStorage.getItem('math-explorer-v2'));
      s.lessons.argument38.index=index;
      s.lessons.argument38.models[index]=defaultModel(sessionTasks('argument38')[index]);
      localStorage.setItem('math-explorer-v2',JSON.stringify(s));
     },index);
     await page.reload();await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,index);
     await field('value','6');await field('second','1/2');await field('choice','less');
     await page.locator('[data-x="r38-test"]').click();
     await page.locator('#actions [data-do="check"]').click();
     ok(await hint.isVisible(),label+' exact checked counterexample from native UI');
     ok((await hint.innerText()).includes('6 × 1/2')&&(await hint.innerText()).includes('矛盾'),label+' bounded verified math observation');
     ok(await hint.locator('[data-thinking-node-id="mt_j5YqQnN6xe"]').count()===1,label+' correct MP.3 source binding');
     await screenshot('02-checked');
     await page.reload();await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,index);
     ok(await hint.isVisible(),label+' current checked snapshot restores offline');
     await field('second','1');
     ok(await hint.count()===0,label+' edited work immediately hides stale evidence');
     await screenshot('03-edited');
     await page.reload();await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,index);
     ok(await hint.count()===0,label+' stale evidence remains absent after refresh');
     await field('second','1/2');await page.locator('#actions [data-do="check"]').click();
     ok(await hint.isVisible(),label+' rechecked current work restores evidence');
     const stored=await page.evaluate(index=>{
      const x=JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.argument38;
      return {attempts:x.cases[index].attempts.length,history:x.models[index].history.length,
        scoring:Object.hasOwn(x,'thinkingScore')||Object.hasOwn(x,'thinkingMastery')};
     },index);
     ok(stored.attempts>=2&&stored.history===1&&!stored.scoring,label+' v2 attempts and no invented scoring schema');
     ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no desktop overflow');
    }catch(e){await screenshot('failure').catch(()=>{});throw e;}
   }
   await context.close();
  }
  ok(!errors.length,'no browser errors');ok(!remote.length,'no remote requests');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,originStopped:true,childTrial:false,independentTeachingReview:false},null,2));
  console.log('P9_COUNTEREXAMPLE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length}));
 }catch(e){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,error:String(e)},null,2));
  console.error(e.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  await browser.close();
 }
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
