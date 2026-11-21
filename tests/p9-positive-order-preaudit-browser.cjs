// #337: real 1920x1080 Chromium PREAUDIT of the original B08 lesson controls.
// This test neither registers a strict A adapter nor confers learning mastery.
// Original prerequisites and target cards are completed with visible controls;
// no model or lesson state is seeded, assigned or fabricated in the browser.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-positive-order-preaudit');
const cases=[
 {id:'bigcompare',index:2,nodeId:'mt_MHaiUd2FLA',taskHash:'3af8e623611e2f89e1e0aa354e1f023203a77fd200f5ceee9381967878a05639'},
 {id:'sixdigits',index:2,nodeId:'mt_JwP9QFv6gQ',taskHash:'15c65015c8abb99241d30bb8ffff1bf16ea6ba529c114a612ffd664acce484ea'},
 {id:'millionwords',index:1,nodeId:'mt_Gag_h98jWP',taskHash:'f4b80d951ea72967caa1de4041a4aa113cd4d7d1d69d56ab59fb6ecbb1278e38'}
];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const sorted=t=>t.values.map((v,i)=>({v:BigInt(v),i})).sort((a,b)=>a.v<b.v?-1:a.v>b.v?1:0).map(x=>x.i);
async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const M=await import('../dist/learning/phase5/b08-model.js');
 const {chinese}=await import('../dist/learning/phase5/b08-math.js');
 const {positiveOrderPreauditBinding,replayPositiveOrderPreaudit:replay}=await import('../dist/learning/positive-order-preaudit.js');
 const Core=await import('../dist/exploration-core.js');
 const atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||sha,testedCheckoutSha:sha,
  githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,
  runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,viewport:[1920,1080],
  seededCorrectWork:false,seededLessonPositions:false,strictAApproved:false,
  childTrial:false,independentTeachingReview:false};
 const checks=[],errors=[],remote=[],observations=[],preparations=[];
 const ok=(yes,message)=>{assert.ok(yes,message);checks.push(message);};
 const taskFor=s=>sessionTasks(s.id)[s.index];
 for(const s of cases){const t=taskFor(s);assert.equal(hash(t),s.taskHash);assert.equal(t.mode,'order');assert.equal(t.type,'x-wideboard');
  assert.equal(positiveOrderPreauditBinding(t,{sessionId:s.id,index:s.index})?.nodeId,s.nodeId);}
 fs.mkdirSync(out,{recursive:true});
 let browser,context,server,page,label='setup';
 try{
  server=http.createServer((req,res)=>{
   const rel=new URL(req.url,'http://localhost').pathname.replace(/^\\/+/, '')||'index.html';
   fs.readFile(path.join(root,'dist',rel),(err,data)=>{
    res.writeHead(err?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(err?'missing':data);
   });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce',acceptDownloads:true});
  context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
  page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push({label,error:String(error)}));
  const read=()=>page.evaluate(async()=>{
   const {readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2'));
  });
  const verified=async()=>{const s=await read();assert.deepEqual(Core.validate(s,atlas),s);return s;};
  const saved=async id=>(await verified()).lessons[id];
  const model=async s=>(await saved(s.id)).models[s.index];
  const wait=s=>page.waitForFunction(({id,index})=>{
   const x=window.mathLesson?.snapshot();return x?.id===id&&x.index===index&&x.view==='task';
  },{id:s.id,index:s.index});
  const reveal=async control=>{
   for(let n=0;n<10;n++){const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');
    if(!(await closed.count()))return;await closed.locator(':scope > summary').click();}
   assert.fail('unbounded nested details');
  };
  const act=async(name,data={})=>{
   const suffix=Object.entries(data).map(([k,v])=>`[data-${k}="${v}"]`).join('');
   const control=page.locator(`[data-x="${name}"]${suffix}`);assert.equal(await control.count(),1,label+' '+name+suffix);
   await reveal(control);ok(await control.isEnabled(),label+' enabled '+name+suffix);await control.click();
  };
  const field=async(key,value)=>{
   const control=page.locator(`[data-xfield="${key}"]`);
   assert.equal(await control.count(),1,label+' field '+key);await reveal(control);
   if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));
   else{assert.notEqual(await control.getAttribute('type'),'range');await control.fill(String(value));}
  };
  const check=async(s,expected,name)=>{
   const before=await saved(s.id),t=taskFor(s),button=page.locator('#actions [data-do="check"]');
   await reveal(button);ok(await button.isEnabled(),label+' '+name+' original Check enabled');
   const original=structuredClone(before.models[s.index]);
   assert.equal(M.inspect(t,original).correct,expected);
   await button.click();
   const after=await saved(s.id),attempts=after.cases[s.index].attempts;
   assert.deepEqual(attempts.slice(0,-1),before.cases[s.index]?.attempts||[]);
   assert.deepEqual(attempts.at(-1).value,original);
   assert.deepEqual(after.models[s.index],original);
   assert.equal(attempts.length,(before.cases[s.index]?.attempts?.length||0)+1);
   assert.equal(await page.locator('#check-feedback').getAttribute('data-state'),expected?'correct':'revise');
   return {model:original,record:after.cases[s.index]};
  };
  const placeDigits=async(t)=>{
   const cols=M.columns(t);
   for(let row=0;row<t.values.length;row++){
    if(row)await act('wide-active',{index:row});
    const v=Number(t.values[row]);
    for(let j=0;j<cols.length;j++){
     const digit=Math.floor(v/10**cols[j])%10;
     for(let n=0;n<digit;n++)await act('wide-add',{index:j,delta:1});
    }
    if(t.mode==='build'){
     await field('answers.'+row,t.values[row]);
     if(t.expanded)for(let j=0;j<cols.length;j++)
      await field('parts.'+row+'.'+j,String((Math.floor(v/10**cols[j])%10)*10**cols[j]));
     if(t.words)await field('words.'+row,chinese(v));
    }
   }
   if(t.mode==='compare'){
    const [a,b]=t.values.map(Number);
    await field('relation',a===b?'=':a<b?'<':'>');
    const first=cols.findIndex(e=>Math.floor(a/10**e)%10!==Math.floor(b/10**e)%10);
    await field('first',first<0?'same':String(first));
   }
  };
  const open=async s=>{
   const response=await page.goto(base+'learn.html#'+s.id);
   ok(response?.ok()===true,label+' original lesson document loaded');
   await wait({id:s.id,index:0});
   for(let at=0;at<s.index;at++){
    const p={id:s.id,index:at},t=taskFor(p);
    assert.ok(['build','compare'].includes(t.mode),label+' frozen prerequisite operation family');
    await placeDigits(t);
    ok(M.inspect(t,await model(p)).correct,label+' original preceding task solved via visible controls');
    await check(p,true,'navigation-'+at);
    const before=await saved(s.id),next=page.locator('#actions [data-do="next"]');
    await reveal(next);ok(await next.isEnabled(),label+' original Next enabled');await next.click();
    await wait({id:s.id,index:at+1});
    const after=await saved(s.id);
    assert.deepEqual(after.cases,before.cases);
    preparations.push({id:s.id,index:at,mode:t.mode,originalCorrect:true,visibleControls:true});
   }
   assert.deepEqual(await model(s),M.initial(taskFor(s)));
   ok(((await saved(s.id)).cases[s.index]?.attempts?.length??0)===0,
    label+' new target has no prior checked attempts');
  };
  const placeAxis=async s=>{
   const t=taskFor(s);
   for(let i=0;i<t.values.length;i++){
    const ideal=Math.round((Number(t.values[i])-t.min)/(t.max-t.min)*1000);
    const control=page.locator(`[data-xfield="positions.${i}"]`);
    await reveal(control);const box=await control.boundingBox();ok(!!box&&box.width>50,label+' visible range control '+i);
    const x=Math.max(5,Math.min(box.width-5,8+ideal/1000*(box.width-16)));
    await control.click({position:{x,y:box.height/2}});
    let actual=(await model(s)).positions[i];
    for(let step=0;step<60&&Math.abs(actual-ideal)>5;step++){
     await control.press(actual<ideal?'ArrowRight':'ArrowLeft');
     actual=(await model(s)).positions[i];
    }
    ok(Math.abs(actual-ideal)<=6,label+' real range input reached correct integer position '+i);
    ok((await model(s)).touched[i]===true,label+' original range input recorded touch '+i);
   }
  };
  for(const s of cases){
   label=s.id+'-'+s.index;await open(s);const t=taskFor(s),expected=sorted(t);
   const wrong=[expected[1],expected[0],...expected.slice(2)];
   for(const i of wrong)await act('wide-order',{index:i});
   await placeAxis(s);
   const bad=await model(s);assert.deepEqual(bad.order,wrong);
   ok(!M.inspect(t,bad).correct,label+' true wrong-first order fails original grader');
   const first=await check(s,false,'wrong-first');
   assert.equal(replay(t,first.model,first.record,s),null);
   for(const i of wrong)await act('wide-order',{index:i});
   for(const i of expected)await act('wide-order',{index:i});
   const corrected=await model(s);assert.deepEqual(corrected.order,expected);
   ok(M.valid(t,corrected)&&M.inspect(t,corrected).correct,label+' corrected actual controls satisfy original grader');
   const second=await check(s,true,'corrected');
   const proof=replay(t,second.model,second.record,{sessionId:s.id,index:s.index});
   ok(!!proof&&proof.preReviewOnly===true&&proof.strictAApproved===false,label+' source-bound preaudit replay only');
   ok(proof.events.length===second.model.orderTrace.length,label+' full actual pick/remove chronology survives Check');
   ok(proof.events.some(e=>e.kind==='remove'),label+' correction preserves removals');
   ok(proof.sliderMotionHistoryObserved===false,label+' no invented slider motion trace');
   ok(proof.finalAxisPositions.every(p=>p.finalPositionError<=6),label+' mathematically correct final axis');
   assert.equal(await page.locator('#thinking-feedback').count(),0,'preaudit may not show strict A feedback');
   await page.screenshot({path:path.join(out,label+'-corrected-1920x1080.png'),fullPage:true});
   const beforeReload=await saved(s.id);
   const reloadResponse=await page.reload();assert.ok(reloadResponse);await wait(s);
   const afterReload=await saved(s.id);
   assert.deepEqual(afterReload.models,beforeReload.models,'State-v2 preserves original models on real reload');
   assert.deepEqual(afterReload.cases,beforeReload.cases,'State-v2 preserves original attempts on real reload');
   observations.push({id:s.id,index:s.index,nodeId:s.nodeId,taskHash:s.taskHash,selectedOrder:proof.selectedOrder,
    eventCount:proof.events.length,wrongFirstSaved:true,correctionSaved:true,originalGrader:true,
    axisFinalOnly:true,strictAApproved:false,screenshot:label+'-corrected-1920x1080.png'});
  }
  ok(errors.length===0,'no Chromium page errors');ok(remote.length===0,'no external requests');
  const report={schema:'math-positive-order-browser-preaudit/1',provenance,cases,checks,errors,remote,preparations,observations,
   cautions:['no slider movement chronology','no independently observed comparison strategy','no child mastery study','no strict A registration']};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
  console.log('P9_POSITIVE_ORDER_PREAUDIT_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,
   prerequisites:preparations.length,headSha:sha,strictAApproved:false}));
 }finally{
  if(context)await context.close();if(browser)await browser.close();
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
 }
}
main().catch(error=>{console.error('P9_POSITIVE_ORDER_PREAUDIT_BROWSER_FAILED',error);process.exitCode=1;});
