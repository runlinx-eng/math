// #339: real 1920x1080 Chromium PREAUDIT of the original B08 lesson controls.
// This test neither registers a strict A adapter nor confers learning mastery.
// Original prerequisites and target cards are completed with visible controls;
// no model or lesson state is seeded, assigned or fabricated in the browser.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-signed-order-preaudit');
const cases=[
 {id:'tenmillion',index:1,nodeId:'mt_XNmGwNggdU',taskHash:'0deadc9a3d0aac1cdf6206a515848e9642f08d687f6d8e4b730d70aae64c859c'}
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
 const {rounded,decimal,dpFor}=await import('../dist/learning/phase5/b08-math.js');
 const {signedOrderPreauditBinding,replaySignedOrderPreaudit:replay}=await import('../dist/learning/signed-order-preaudit.js');
 const {EVIDENCE_ADAPTERS}=await import('../dist/learning/evidence-adapters.js');
 const Core=await import('../dist/exploration-core.js');
 const atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||sha,testedCheckoutSha:sha,
  githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,
  runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,viewport:[1920,1080],
  seededCorrectWork:false,seededLessonPositions:false,strictAApproved:false,
  childTrial:false,independentTeachingReview:false};
 const checks=[],errors=[],remote=[],observations=[],preparations=[],rawEvidence=[];
 const ok=(yes,message)=>{assert.ok(yes,message);checks.push(message);};
 const taskFor=s=>sessionTasks(s.id)[s.index];
 for(const s of cases){const t=taskFor(s);assert.equal(hash(t),s.taskHash);assert.equal(t.mode,'order');assert.equal(t.type,'x-wideboard');
  assert.equal(signedOrderPreauditBinding(t,{sessionId:s.id,index:s.index})?.nodeId,s.nodeId);}
 fs.mkdirSync(out,{recursive:true});
 let browser,context,server,page,label='setup';
 try{
  server=http.createServer((req,res)=>{
   const rel=new URL(req.url,'http://localhost').pathname.replace(/^[/]+/, '')||'index.html';
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
  context=await newDesktopContext(browser,{reducedMotion:'reduce',acceptDownloads:true});
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
  const placeRound=async s=>{
   const t=taskFor(s);assert.equal(t.type,'x-roundwork');
   assert.equal(t.values.length,1,'rounded-city prerequisite has one native value');
   const r=rounded(t.values[0],t.unit);
   assert.ok(r&&Number.isFinite(r.position),'native rounding rule defined');
   await field('steps.0.low',decimal(r.low));
   await field('steps.0.high',decimal(r.high));
   const control=page.locator('[data-xfield="steps.0.mark"]');
   assert.equal(await control.count(),1,label+' prerequisite original range');
   await reveal(control);
   const box=await control.boundingBox();
   ok(!!box&&box.width>50,label+' visible original rounding slider');
   const ideal=Math.round(r.position);
   const x=Math.max(5,Math.min(box.width-5,8+ideal/1000*(box.width-16)));
   await control.click({position:{x,y:box.height/2}});
   let actual=(await model(s)).steps[0].mark;
   for(let step=0;step<60&&Math.abs(actual-r.position)>5;step++){
    await control.press(actual<r.position?'ArrowRight':'ArrowLeft');
    actual=(await model(s)).steps[0].mark;
   }
   ok(Math.abs(actual-r.position)<=6,label+' original rounded-city slider placed');
   ok((await model(s)).steps[0].touched===true,label+' original rounding range touch recorded');
   await field('steps.0.result',decimal(r.result,dpFor(t.unit)));
  };
  const open=async s=>{
   // A different session hash alone is same-document navigation; force a new
   // document request for each original lesson before checking its response.
   const response=await page.goto(base+'learn.html?preaudit='+encodeURIComponent(s.id)+'#'+s.id);
   ok(response?.ok()===true,label+' original lesson document loaded');
   await wait({id:s.id,index:0});
   for(let at=0;at<s.index;at++){
    const p={id:s.id,index:at},t=taskFor(p);
    assert.equal(t.type,'x-roundwork',label+' exact native rounded-city prerequisite');
    await placeRound(p);
    ok(M.inspect(t,await model(p)).correct,label+' original preceding task solved via visible controls');
    const pre=await check(p,true,'navigation-'+at);
    const before=await saved(s.id),next=page.locator('#actions [data-do="next"]');
    await reveal(next);ok(await next.isEnabled(),label+' original Next enabled');await next.click();
    await wait({id:s.id,index:at+1});
    const after=await saved(s.id);
    assert.deepEqual(after.cases,before.cases);
    preparations.push({id:s.id,index:at,type:t.type,taskHash:hash(t),
     sourceTask:structuredClone(t),correctedModel:structuredClone(pre.model),
     checkedRecord:structuredClone(pre.record),originalCorrect:true,visibleControls:true});
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
   assert.equal(replay(t,first.model,first.record,{sessionId:s.id,index:s.index}),null);
   for(const i of wrong)await act('wide-order',{index:i});
   for(const i of expected)await act('wide-order',{index:i});
   const corrected=await model(s);assert.deepEqual(corrected.order,expected);
   ok(M.valid(t,corrected)&&M.inspect(t,corrected).correct,label+' corrected actual controls satisfy original grader');
   const second=await check(s,true,'corrected');
   const proof=replay(t,second.model,second.record,{sessionId:s.id,index:s.index});
   ok(!!proof&&proof.preReviewOnly===true&&proof.strictAApproved===false,label+' source-bound preaudit replay only');
   ok(proof.operations.length===second.model.orderTrace.length,label+' full actual pick/remove chronology survives Check');
   ok(proof.operations.some(e=>e.kind==='remove'),label+' correction preserves removals');
   ok(proof.observedSliderMotionChronology===false,label+' no invented slider motion trace');
   ok(proof.finalAxisPositions.every(p=>p.error<=6),label+' mathematically correct final axis');
   // Check rendered SVG text geometry, not just correctness of the underlying values.
   // The original 6/7-digit cards can be only a few pixels apart on the full axis.
   const axisLabels=await page.locator('.b8-axis .b8-mark-label').evaluateAll(nodes=>nodes.map(node=>{
    const rect=node.getBoundingClientRect();
    return {text:node.textContent,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom};
   }));
   ok(axisLabels.length===t.values.length,label+' number-axis shows all distinct value labels');
   for(let i=0;i<axisLabels.length;i++)for(let j=i+1;j<axisLabels.length;j++){
    const a=axisLabels[i],b=axisLabels[j];
    const collide=a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
    ok(!collide,label+' number-axis value labels do not overlap '+i+'/'+j);
   }
   // The zoom is visual only; it neither changes sliders nor adds evidence.
   const closeZoom=page.locator('.b8-axis .b8-axis-zoom');
   ok(await closeZoom.count()===0,label+' signed axis stays on the original unzoomed scale');
   ok(EVIDENCE_ADAPTERS.filter(a=>a.binding(t,{sessionId:s.id,index:s.index})).map(a=>a.id).join(',')==='signed-order',
    label+' exactly one formally registered signed-order adapter');
   const forged=structuredClone(second.model);forged.orderTrace[0].kind='remove';
   ok(replay(t,forged,{attempts:[{value:forged}]},{sessionId:s.id,index:s.index})===null,
    label+' independent replay rejects fabricated click sequence');
   const old=structuredClone(second.model);delete old.orderTrace;delete old.orderTraceOverflow;
   ok(M.inspect(t,old).correct&&
    replay(t,old,{attempts:[{value:old}]},{sessionId:s.id,index:s.index})===null,
    label+' original legacy grading survives but cannot grant strict evidence');
   await page.screenshot({path:path.join(out,label+'-corrected-1920x1080.png'),fullPage:true});
   const beforeReload=await saved(s.id);
   const reloadResponse=await page.reload();assert.ok(reloadResponse);await wait(s);
   const afterReload=await saved(s.id);
   assert.deepEqual(afterReload.models,beforeReload.models,'State-v2 preserves original models on real reload');
   assert.deepEqual(afterReload.cases,beforeReload.cases,'State-v2 preserves original attempts on real reload');
   const screenshotFile=label+'-corrected-1920x1080.png';
   const screenshotSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,screenshotFile))).digest('hex');
   // CI generated work only; preserve original attempts without interpreting strategy.
   rawEvidence.push({id:s.id,index:s.index,nodeId:s.nodeId,taskHash:s.taskHash,
    sourceTask:structuredClone(t),wrongFirstModel:structuredClone(first.model),
    wrongFirstRecord:structuredClone(first.record),correctedModel:structuredClone(second.model),
    correctedRecord:structuredClone(second.record),preauditProof:structuredClone(proof),
    beforeReloadLesson:structuredClone(beforeReload),afterReloadLesson:structuredClone(afterReload),
    screenshot:screenshotFile,screenshotSha256});
   observations.push({id:s.id,index:s.index,nodeId:s.nodeId,taskHash:s.taskHash,selectedOrder:proof.selectedOrder,
    eventCount:proof.operations.length,wrongFirstSaved:true,correctionSaved:true,originalGrader:true,
    axisFinalOnly:true,strictAApproved:false,screenshot:label+'-corrected-1920x1080.png'});
  }
  ok(errors.length===0,'no Chromium page errors');ok(remote.length===0,'no external requests');
  const report={schema:'math-signed-order-browser-preaudit/1',provenance,
   proofContracts:['math','correction','persistence','negative'],cases,checks,errors,remote,preparations,observations,
   cautions:['no slider movement chronology','no independently observed comparison strategy','no child mastery study','no strict A registration']};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,'raw-evidence.json'),JSON.stringify({
   schema:'math-signed-order-authentic-raw/1',provenance,prerequisites:preparations,cases:rawEvidence,
   cautions:['CI-controlled original interface, not child observation',
    'only pick/remove chronology; slider positions are final observations',
    'not strict A approval']
  },null,2)+'\n');
  console.log('P9_SIGNED_ORDER_PREAUDIT_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,
   prerequisites:preparations.length,headSha:sha,strictAApproved:false}));
 }finally{
  if(context)await context.close();if(browser)await browser.close();
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
 }
}
main().catch(error=>{console.error('P9_SIGNED_ORDER_PREAUDIT_BROWSER_FAILED',error);process.exitCode=1;});
