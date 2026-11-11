// Complete native lessons, real offline grading and full persistent-browser restarts.
// No stored lesson/model injection, mocked grader, or child-learning effectiveness claim.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.env.P10_FULL_LESSONS_OUT||path.join(root,'verification/p10-release-upgrade/full-lessons'));
const KEY='math-explorer-v2',checks=[],lessons=[],errors=[],requests=[];
const check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const read=p=>p.evaluate(key=>localStorage.getItem(key),KEY);
const state=async p=>JSON.parse(await read(p));
const inspect=p=>p.evaluate(()=>window.mathLesson.snapshot());
const stage=p=>p.locator('#scene').getAttribute('data-stage');
const action=(p,name,attrs='')=>p.locator('[data-x="'+name+'"]'+attrs).click();
async function field(p,name,value){
 const el=p.locator('[data-xfield="'+name+'"]');
 if(await el.evaluate(e=>e.tagName==='SELECT'))await el.selectOption(String(value));
 else await el.fill(String(value));
}
const next=p=>p.locator('#actions [data-do="next"]').click();
const submit=p=>p.locator('#actions [data-do="check"]').click();
async function wrong(p,id,i){
 if(id==='equivalent')return; // untouched strips/zero on number line are valid wrong workpieces
 if(id==='shiftfine'){
  const answers=['345.6','0.0452','0.003456'],steps=[2,-3,-3];
  await field(p,'guess',answers[i]);await action(p,'wide-predict');
  for(let j=0;j<Math.abs(steps[i]);j++)await action(p,'wide-move','[data-delta="'+Math.sign(steps[i])+'"]');
  await field(p,'answer','1');await field(p,'factor',i===0?'100':'1000');
  await field(p,'direction',i===0?'times':'divide');return;
 }
 if(id==='solidstack'){
  if(i<2)for(let j=0;j<(i===0?3:2);j++)await action(p,'g27-add','[data-index="cube"]');
  else for(let j=0;j<2;j++){
   await action(p,'g27-card','[data-index="'+j+'"]');
   await action(p,'g27-choose','[data-index="cubesphere"]');
  }
  await action(p,'turn-extra');return;
 }
 if(i===0||i===2){
  if(i===2)await action(p,'r38-mark','[data-index="start"]');
  await action(p,'r38-card','[data-index="wrong"]');return;
 }
 if(i===1){
  // 3/4 L divided into 1/2 L portions: actually shade, fit a whole group,
  // examine the remainder and normalize both quantities through native controls.
  await field(p,'choice','/');await field(p,'guess','more');
  await field(p,'story','有四分之三升果汁，每份半升，最后不足一份也保留。');
  await action(p,'b18-start');
  await field(p,'work.aform','3/4');await field(p,'work.bform','1/2');await action(p,'b18-op-forms');
  await field(p,'work.denom','4');await action(p,'b18-op-common');
  for(const [row,count] of [['left',3],['right',2]])for(let k=0;k<count;k++)
   await action(p,'b18-op-shade','[data-row="'+row+'"][data-index="'+k+'"]');
  await action(p,'b18-op-fit');await action(p,'b18-op-rest');
  await field(p,'work.whole','1');await field(p,'work.part','1/2');
  await field(p,'work.answer','1');await field(p,'work.reason','groups');
  await field(p,'inverse','2');await field(p,'scaledA','3/2');await field(p,'scaledB','1');
  await action(p,'b18-normalize');return;
 }
 await field(p,'value','6');await field(p,'second','2');await field(p,'choice','greater');
 await action(p,'r38-test');
}
async function correct(p,id,i){
 if(id==='equivalent'){
  if(i===0)for(const [row,index]of [[0,1],[1,2],[2,3]])
   await p.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
  else await p.locator('input[data-field="mark"]').fill(i===1?'4':'6');
 }else if(id==='shiftfine')await field(p,'answer',['345.6','0.0452','0.003456'][i]);
 else if(id==='solidstack'){
  if(i<2){
   for(let j=0;j<(i===0?3:2);j++)await action(p,'g27-remove');
   for(const part of (i===0?['cuboid','cube','cube']:['cylinder','cone']))await action(p,'g27-add','[data-index="'+part+'"]');
  }else for(const [j,value]of [[0,'cylcone'],[1,'boxpyramid']]){
   await action(p,'g27-card','[data-index="'+j+'"]');await action(p,'g27-choose','[data-index="'+value+'"]');
  }
 }else if(i===0||i===2){
  await action(p,'r38-undo');
  if(i===2)await action(p,'r38-mark','[data-index="error"]');
  for(const value of (i===0?['given','sum','two','answer']:['half','one','last']))
   await action(p,'r38-card','[data-index="'+value+'"]');
 }else if(i===1)await field(p,'work.answer','3/2');
 else{
  await field(p,'second','1/2');await field(p,'choice','less');await action(p,'r38-test');
 }
}
async function waitReady(p,cache){
 const end=Date.now()+90000;let report;
 while(Date.now()<end){
  report=await p.evaluate(async name=>{
   const reg=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
   if(!reg?.active||reg.active.state!=='activated'||!worker||reg.waiting||reg.installing)return null;
   return new Promise(resolve=>{
    const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
    channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data?.cache===name?e.data:null);};
    worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
   });
  },cache);
  if(report?.complete===true&&report.cached===report.total)return report;
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw Error('activated controlling worker did not report complete current cache: '+JSON.stringify(report));
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const name of ['results.json','failure.json'])fs.rmSync(path.join(out,name),{force:true});
 const {TASKS}=await import(pathToFileURL(path.join(root,'dist/learning/tasks.js')).href);
 const expected={equivalent:3,shiftfine:3,solidstack:3,argument38:5};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE\s*=\s*'([^']+)'/)?.[1];
 const meta={startedAt:new Date().toISOString(),headSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  workingDiffSha256:digest(execFileSync('git',['diff','HEAD'],{cwd:root})),testSha256:digest(fs.readFileSync(__filename)),
  swSha256:digest(fs.readFileSync(path.join(root,'dist/sw.js'))),cache,
  environment:'real Chromium; independent persistent profile per lesson; entire lesson offline after complete SW install',
  mac:false,child:false,pedagogy:false};
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wav':'audio/wav'};
 let network=true,ctx,page,profile,current;
 const server=http.createServer((req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html';
  requests.push({time:new Date().toISOString(),path:rel,network});
  if(!network){res.writeHead(503);res.end('test origin unavailable while offline');return;}
  if(rel.split('/').includes('..')){res.writeHead(400);res.end();return;}
  fs.readFile(path.join(root,'dist',rel),(err,buf)=>{
   if(err){res.writeHead(404);res.end();return;}
   res.writeHead(200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store','Service-Worker-Allowed':'/','Content-Length':buf.length});res.end(buf);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const launch=async offline=>{
  ctx=await chromium.launchPersistentContext(profile,{headless:true,offline,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   viewport:{width:1440,height:900},serviceWorkers:'allow',reducedMotion:'reduce',
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  await ctx.addInitScript(({origin,key})=>{if(location.origin===origin)window.__p10BeforeAppStorage=localStorage.getItem(key);},{origin:base.slice(0,-1),key:KEY});
  page=ctx.pages()[0]||await ctx.newPage();page.on('pageerror',e=>errors.push({lesson:current?.id,error:String(e)}));
  meta.chromium=ctx.browser()?.version()||await page.evaluate(()=>navigator.userAgent);
  page.setDefaultTimeout(15000);
 };
 const open=async id=>{
  await page.goto(base+'learn.html#'+id,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,id);
 };
 try{
  for(const [id,total]of Object.entries(expected)){
   current={id,total:TASKS[id].length,completed:0,types:TASKS[id].map(t=>t.type),questions:[],browserLaunches:0,result:'B'};lessons.push(current);
   check(TASKS[id].length===total,id+' actual task count matches complete test coverage');
   profile=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-full-'+id+'-'));network=true;
   await launch(false);current.browserLaunches++;
   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   current.cacheReport=await waitReady(page,cache);
   check(current.cacheReport.complete,id+' current SW is activated, controlling and fully cached');
   await ctx.setOffline(true);network=false;
   await open(id);
   for(let i=0;i<total;i++){
    check((await inspect(page)).index===i,id+' question '+(i+1)+' reached through native navigation');
    await wrong(page,id,i);await submit(page);
    check(await stage(page)==='revise',id+' question '+(i+1)+' original grader rejects wrong work');
    await page.locator('#actions [data-do="hint"]').click();
    check((await state(page)).lessons[id].cases[i].support===true,id+' question '+(i+1)+' hint saved');
    await correct(page,id,i);
    check(await stage(page)==='recheck',id+' question '+(i+1)+' modification invalidates old verdict');
    await submit(page);
    check(await stage(page)==='passed',id+' question '+(i+1)+' original grader accepts corrected work offline');
    const record=(await state(page)).lessons[id].cases[i];
    check(record.attempts.length===2,id+' question '+(i+1)+' wrong and corrected submissions both persisted');
    current.questions.push({index:i,type:TASKS[id][i].type,attempts:record.attempts.length,hint:record.support,passed:true,offline:true});current.completed++;
    if(i<total-1)await next(page);
   }
   await page.screenshot({path:path.join(out,id+'-all-questions-offline.png')});
   const before=await read(page),beforeLesson=JSON.parse(before).lessons[id];
   fs.writeFileSync(path.join(out,id+'-before-browser-close.json'),before);
   await ctx.close();ctx=null;
   await launch(true);current.browserLaunches++;await open(id);
   check(await page.evaluate(()=>window.__p10BeforeAppStorage)===before,id+' full browser restart preserves raw stored bytes before app load');
   const restored=await inspect(page),afterLesson=(await state(page)).lessons[id];
   check(restored.index===total-1&&restored.view==='task',id+' offline browser restart restores exact learning position');
   check(JSON.stringify(afterLesson.cases)===JSON.stringify(beforeLesson.cases)&&JSON.stringify(afterLesson.models)===JSON.stringify(beforeLesson.models),id+' all native workpieces, hint flags and attempts restored without change');
   check(restored.summary.done===total&&restored.summary.total===total,id+' every task remains complete after offline browser restart');
   await submit(page);
   check(await stage(page)==='passed'&&(await state(page)).lessons[id].cases[total-1].attempts.length===3,id+' original grader runs again and new attempt saves offline');
   await next(page);check(await stage(page)==='reflect',id+' full lesson reaches original reflection');
   const note='离线整课验收：'+id+'，我保留了错误、提示、修改和检查，再关闭浏览器继续学习。';
   await page.locator('#note').fill(note);await page.locator('[data-do="save-note"]').click();
   check((await state(page)).lessons[id].notes.at(-1)?.text===note,id+' authored explanation saves offline');
   const saved=await read(page);fs.writeFileSync(path.join(out,id+'-after-offline-recheck.json'),saved);
   await ctx.close();ctx=null;
   await launch(true);current.browserLaunches++;await open(id);
   check(await page.evaluate(()=>window.__p10BeforeAppStorage)===saved,id+' second full browser restart preserves new submission and explanation bytes');
   check(await stage(page)==='reflect'&&(await state(page)).lessons[id].notes.at(-1)?.text===note,id+' completed lesson and explanation reopen offline');
   await page.screenshot({path:path.join(out,id+'-offline-summary-restored.png')});
   current.result='A';current.rawBeforeSha256=digest(before);current.rawAfterSha256=digest(saved);current.unresolved=[];
   await ctx.close();ctx=null;fs.rmSync(profile,{recursive:true,force:true});profile=null;
   console.log('P10 full lesson '+id+': '+current.completed+'/'+total+' passed with '+current.browserLaunches+' full browser launches');
  }
  check(errors.length===0,'no uncaught page errors across complete lessons and browser restarts');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...meta,checks,lessons,errors},null,2));
  console.log('P10 full lessons '+checks.length+' real Chromium checks passed');
 }catch(error){
  if(current){current.result='B';current.unresolved=[String(error)];}
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({...meta,checks,lessons,errors,error:String(error),stack:error.stack},null,2));
  await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  console.error(error.stack||error);process.exitCode=1;
 }finally{
  await ctx?.close();if(profile)fs.rmSync(profile,{recursive:true,force:true});
  fs.writeFileSync(path.join(out,'http-events.json'),JSON.stringify(requests,null,2));
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
