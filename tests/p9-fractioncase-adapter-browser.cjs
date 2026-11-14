// Real B18 choices and B17 construction controls; no completed model is seeded.
// Outer and inner histories have paired anchors, not invented shared timestamps.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const fixture=require('./fixtures/p9-fractioncase-cases.cjs'),{cases,associated}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-fractioncase-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[];
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 childTrial:false,independentTeachingReview:false,seededCorrectWork:false,coreDependencyIssue:150};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(v).digest('hex'),hash=t=>digest(JSON.stringify(stable(t)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b18-model.js'),F=await import('../dist/learning/phase5/b17-model.js');
 const {fractionCaseBinding,replayFractionCaseEvidence}=await import('../dist/learning/fractioncase-evidence.js');
 const ctx=spec=>({sessionId:spec.id,index:spec.index}),taskFor=spec=>sessionTasks(spec.id)[spec.index];
 const specFor=(id,index=0)=>{const spec=cases.find(c=>c.id===id&&c.index===index);assert.ok(spec);return spec;};
 function solveSteps(t,{wrongPrediction=false,reverse=false,formScale=1,bounds=null,scattered=false}={}){
  const source=structuredClone(t);
  if(formScale!==1)for(const key of['a','b']){const[n,d]=F.frac(t[key]);source[key]=`${n*formScale}/${d*formScale}`;}
  const list=M.solveSteps(source).map(s=>structuredClone(s));
  if(wrongPrediction)for(const s of list){if(s.field==='guess')s.value='negative';if(s.field==='low')s.value='100';if(s.field==='high')s.value='101';if(s.field==='inside')s.value='no';}
  if(bounds){const r=F.operation(M.inner(t)),lo=F.frac(bounds[0]),hi=F.frac(bounds[1]);
   const inside=BigInt(r[0])*BigInt(lo[1])>=BigInt(lo[0])*BigInt(r[1])&&BigInt(r[0])*BigInt(hi[1])<=BigInt(hi[0])*BigInt(r[1]);
   for(const s of list){if(s.field==='low')s.value=bounds[0];if(s.field==='high')s.value=bounds[1];if(s.field==='inside')s.value=inside?'yes':'no';}
  }
  if(scattered)for(const s of list)if(['b18-op-column','b18-op-row'].includes(s.action)){
   const form=F.frac(source[s.action==='b18-op-column'?'a':'b']),capacity=Math.ceil(form[0]/form[1])*form[1];
   if(Number(s.data.index)===form[0]-1&&form[0]<capacity)s.data.index=capacity-1;
  }
  if(reverse)for(let i=0;i<list.length;){
   if(!['b18-op-shade','b18-op-column','b18-op-row'].includes(list[i].action)){i++;continue;}
   let end=i+1;while(end<list.length&&list[end].action===list[i].action)end++;
   list.splice(i,end-i,...list.slice(i,end).reverse());i=end;
  }
  return list;
 }
 for(const spec of [...cases,...associated])assert.equal(hash(taskFor(spec)),spec.taskHash);
 for(const[file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 let browser,server,context,activePage,label='setup';
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  for(const[width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push({label,error:String(error)}));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const read=()=>page.evaluate(async()=>{const {readStored}=await import('./storage.js');return{raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
   const state=async()=>JSON.parse((await read()).text);
   const saved=async id=>{const s=await state();return s.lessons[id]||s.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{const current=window.mathLesson?.snapshot();return current?.id===id&&current.index===index&&current.view==='task';},spec);
   const reload=async spec=>{const response=await page.reload();await wait(spec);ok(response?.fromServiceWorker()===true,label+' real document reload uses the stopped-origin cache');};
   const open=async spec=>{
    await page.evaluate(async({id,index})=>{
     const[{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')]);
     const s=fresh(),record=freshLesson(id);record.index=index;record.view='task';
     if(Object.hasOwn(BRIDGES,id))s.daily.bridges[id]=record;else s.lessons[id]=record;
     localStorage.setItem(KEY,JSON.stringify(s));
    },spec);
    await page.goto(base+'learn.html#'+spec.id);
    // A hash-only navigation can retain the former index until a real reload.
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);await reload(spec);
    const record=await saved(spec.id);assert.deepEqual(record.models[spec.index],M.initial(taskFor(spec)));
    ok((record.cases[spec.index]?.attempts?.length??0)===0,label+' starts without injected completed or checked work');
   };
   const reveal=async control=>{for(let i=0;i<10;i++){const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');if(!(await closed.count()))return;await closed.locator(':scope > summary').click();}assert.fail('too many nested disclosures');};
   const field=async(key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);assert.equal(await control.count(),1,label+' one real field '+key);await reveal(control);
    if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));else await control.fill(String(value));
   };
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const control=page.locator(`[data-x="${name}"]${suffix}`);assert.equal(await control.count(),1,label+' one real button '+name+suffix);await reveal(control);await control.click();
   };
   const edit=async(spec,key,value)=>{
    const expected=structuredClone(await model(spec));await field(key,value);
    if(key.startsWith('work.'))expected.work[key.slice(5)]=String(value);else expected[key]=String(value);
    M.field(taskFor(spec),expected,key);assert.deepEqual(await model(spec),expected);return expected;
   };
   const act=async(spec,name,data={})=>{const expected=structuredClone(await model(spec));await action(name,data);M.act(taskFor(spec),expected,name,data);assert.deepEqual(await model(spec),expected);return expected;};
   const perform=async(spec,list)=>{
    const expected=structuredClone(await model(spec)),task=taskFor(spec);
    for(const s of list){
     if(s.field){await field(s.field,s.value);if(s.field.startsWith('work.'))expected.work[s.field.slice(5)]=s.value;else expected[s.field]=s.value;M.field(task,expected,s.field);}
     else{await action(s.action,s.data);M.act(task,expected,s.action,s.data);}
     assert.equal(M.valid(task,expected),true);
    }
    assert.deepEqual(await model(spec),expected);return expected;
   };
   const finish=async(spec,options={})=>{const current=await perform(spec,solveSteps(taskFor(spec),options));ok(M.valid(taskFor(spec),current)&&M.inspect(taskFor(spec),current).correct,label+' original construction and current submissions agree');return current;};
   const check=async(spec,correct,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);
    const control=page.locator('#actions [data-do="check"]');await reveal(control);await control.click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves one actual checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' preserves original attempt metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' original grader verdict');return{name:suffix,model:beforeModel,attempt,record:after};
   };
   const wordsFor=async proof=>{
    ok(!!proof&&await hint.isVisible(),label+' strict feedback belongs to the latest successful complete submission');const words=await hint.innerText();
    ok(/提交/.test(words)&&/工具|系统/.test(words),label+' submitted names and tool-generated construction have separate attribution');
    ok(!/你(?:额外|亲手|独立)(?:预测|计算|推导|归一化)/.test(words),label+' automatic predictions and displays are not invented learner operations');
    if(proof.estimate)ok(/范围|区间/.test(words)&&/自动/.test(words),label+' chosen interval and automatic midpoint classification remain distinct');
    if(proof.normalized)ok(/兼容/.test(words)&&/时刻|时间/.test(words)&&/不能|无法/.test(words),label+' normalization describes a compatible window without claiming exact cross-stream timing');
    if(proof.construction.division)ok(/一组/.test(words)&&/原/.test(words),label+' original-unit remainder and fraction of a group stay distinct');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words),label+' every source has method null');
    ok(/长期掌握/.test(words)&&/自由解释|自由文字|故事/.test(words),label+' open explanations and mastery remain unassessed');return words;
   };
   const visual=async(spec,current)=>{
    const task=taskFor(spec),b=current.board,w=current.work.board;
    ok(await page.locator('[data-x="b18-start"]').count()===(b.started?0:1),label+' start exists only before the current construction');
    ok(await page.locator('[data-x="b18-op-predict-op"]').count()===0,label+' the inner prediction is generated automatically without a second prediction button');
    ok(await page.locator('[data-x="b18-reset"]').count()===1&&await page.locator('[data-x="b18-op-reset"]').count()===0,label+' one visible reset pairs both histories');
    const ready=w.forms&&(task.op==='*'?w.columns.length===w.forms[0][0]&&w.rows.length===w.forms[1][0]:task.op==='/'?w.rest:w.combined);
    ok(await page.locator('[data-x="b18-normalize"]').count()===(ready&&task.reciprocal?1:0),label+' normalization is visible only after the current construction is ready');
    if(!w.forms)return;
    if(task.op==='*'){
     const cols=Math.ceil(w.forms[0][0]/w.forms[0][1])*w.forms[0][1],rows=Math.ceil(w.forms[1][0]/w.forms[1][1])*w.forms[1][1];
     ok(await page.locator('.b18-area-grid i').count()===cols*rows,label+' area grid preserves the actual form denominators and full units');
     const selected=await page.locator('.b18-area-grid i').evaluateAll(xs=>xs.filter(e=>e.style.backgroundColor==='rgb(201, 141, 85)').length);
     ok(selected===w.columns.length*w.rows.length,label+' actual row-column overlap has the correct number of cells');
    }else if(w.denom){
     for(const row of['left','right'])ok(await page.locator(`[data-x="b18-op-shade"][data-row="${row}"][aria-pressed="true"]`).count()===w[row].length,label+' selected '+row+' pieces match saved identities');
     if(w.combined)ok(await page.locator('.b17-result-parts .filled').count()===(task.op==='+'?w.left.length+w.right.length:w.left.length-w.right.length),label+' combined display is generated from the selected quantities');
     if(task.op==='/'&&w.rest){const words=await page.locator('.b17-fit').innerText();ok(words.includes('还余 '+(w.left.length-w.fits*w.right.length)+' 小份')&&words.includes('每整组有 '+w.right.length+' 小份'),label+' remainder display keeps both piece counts');}
    }
   };
   const shot=async suffix=>{await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const snapshot=async suffix=>{const s=await read();fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),s.raw);fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),s.text);return JSON.parse(s.text);};

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let cacheReport={ready:false};
   for(let i=0;i<300;i++){
    cacheReport=await page.evaluate(async expected=>{
     const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
     const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
     if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return{ready:false,...identity};
     const status=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);});
     return{...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
    },cache);
    if(cacheReport.ready===true)break;await page.waitForTimeout(100);
   }
   const modules=await page.evaluate(async expected=>{
    const store=await caches.open(expected);return Promise.all(['storage.js','learning/fractioncase-evidence.js','learning/fraction-operations-evidence.js',
     'learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/bridges.js',
     'learning/phase5/b16-model.js','learning/phase5/b17-model.js','learning/phase5/b17-view.js','learning/phase5/b18.js','learning/phase5/b18-model.js','learning/phase5/b18-view.js',
     'learning/phase5/b38.js','learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','learning/phase4/async-batches.js']
     .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
   },cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(m=>!m.cached).map(m=>m.name),originStopped:false};offline.push(cacheCheck);
   ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' complete cache and activated controller before origin shutdown',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;
   ok(cacheCheck.originStopped,prefix+' HTTP source stops before every task and real document reload');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec);await open(spec);
    ok(fractionCaseBinding(task,ctx(spec))?.nodeId===spec.nodeId,label+' reviewed native source is bound');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional guide starts collapsed');ok(await hint.count()===0,label+' no evidence before actual submission');await visual(spec,await model(spec));
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),label+' actual disclosure opens the optional guide');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    await guide.locator('summary').click();assert.deepEqual(afterGuide.models,beforeGuide.models);ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,label+' help invents no construction or checked attempt');
    const snapshots=[await check(spec,false,'01-empty-work')];
    await finish(spec,{wrongPrediction:true,reverse:width===1280});await visual(spec,await model(spec));const answer=(await model(spec)).work.answer;
    ok(await hint.count()===0,label+' an unsubmitted construction is not checked strict evidence');
    await edit(spec,'work.answer','999');snapshots.push(await check(spec,false,'02-wrong-answer'));ok(await hint.count()===0,label+' wrong answer has no strict feedback');
    await edit(spec,'work.answer',answer);snapshots.push(await check(spec,true,'03-correct-answer'));
    const first=await model(spec),proof=replayFractionCaseEvidence(task,first),words=await wordsFor(proof);
    if(task.estimate){assert.deepEqual(proof.estimate.bounds,['100','101']);assert.equal(proof.estimate.inside,false);}else assert.equal(proof.firstAttempt.guess,'negative');
    const checked=await saved(spec.id);await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.models);assert.deepEqual((await saved(spec.id)).cases,checked.cases);ok(await hint.isVisible(),label+' latest checked evidence restores offline');
    await edit(spec,'work.answer','998');ok(await hint.count()===0,label+' editing a current inner answer immediately expires old feedback');
    if(spec===cases[0])await shot('edited');await reload(spec);ok(await hint.count()===0,label+' offline reload cannot revive a stale submission');snapshots.push(await check(spec,false,'04-edited-answer'));
    const beforeReset=await model(spec),reset=await act(spec,'b18-reset');
    assert.deepEqual(reset.history.slice(0,-1),beforeReset.history);assert.deepEqual(reset.work.history.slice(0,-1),beforeReset.work.history);assert.deepEqual(reset.board.first,first.board.first);assert.equal(reset.work.board.first,first.work.board.first);
    for(const key of Object.keys(M.fields))assert.equal(reset[key],beforeReset[key]);for(const key of Object.keys(F.fields))assert.equal(reset.work[key],beforeReset.work[key]);
    ok(await hint.count()===0,label+' reset retains history and removes the unfinished current proof');await visual(spec,reset);await reload(spec);assert.deepEqual(await model(spec),reset);
    await finish(spec,{reverse:width===1280});snapshots.push(await check(spec,true,'05-rebuilt-current-work'));
    const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replayFractionCaseEvidence(task,finalModel),finalWords=await wordsFor(finalProof);
    assert.equal(finalProof.starts.length,2);assert.equal(finalProof.resets.length,1);assert.deepEqual(finalProof.firstAttempt,first.board.first);assert.equal(finalProof.construction.currentEpoch,1);
    ok(end.cases[spec.index].attempts.length===5,label+' exactly five complete genuine attempts remain');for(const[i,item]of snapshots.entries())assert.deepEqual(item.attempt,end.cases[spec.index].attempts[i]);
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' no invented scoring or mastery schema');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);await visual(spec,finalModel);ok(await hint.isVisible(),label+' rebuilt current proof restores offline');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');await shot('verified-offline');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,first,proof,words,snapshots,beforeReset,reset,finalModel,finalProof,finalWords,record:end,stored:await snapshot('final')});
   }

   for(const kind of['wrong-choice','wrong-forms','raw-decimal-precision','zero-groups-fit','wrong-normalization']){
    const spec=kind==='wrong-normalization'?specFor('fractionquotient',1):kind==='zero-groups-fit'?specFor('fractionquotient'):specFor('joinfractions');
    const task=taskFor(spec);label=prefix+'-'+kind;await open(spec);let failed;
    if(kind==='wrong-choice'){
     await edit(spec,'choice','*');await edit(spec,'guess','negative');failed=await act(spec,'b18-start');await finish(spec);
    }else if(kind==='wrong-forms'||kind==='raw-decimal-precision'){
     const list=solveSteps(task),start=list.findIndex(s=>s.action==='b18-start');await perform(spec,list.slice(0,start+1));
     await edit(spec,'work.aform',kind==='wrong-forms'?'1/5':'0.400000000');await edit(spec,'work.bform','2/5');failed=await act(spec,'b18-op-forms');
     await perform(spec,list.slice(start+1));
    }else if(kind==='zero-groups-fit'){
     const list=solveSteps(task),rest=list.findIndex(s=>s.action==='b18-op-rest');await perform(spec,list.slice(0,rest));
     failed=await act(spec,'b18-op-fit');await perform(spec,list.slice(rest));
    }else{
     await finish(spec);await edit(spec,'scaledA','3/4');failed=await act(spec,'b18-normalize');await edit(spec,'scaledA','3/2');await act(spec,'b18-normalize');
    }
    ok(!!failed.issue,label+' actual visible action reports the invalid step');const corrected=await check(spec,true,'original-correct-after-recorded-failure');
    ok(replayFractionCaseEvidence(task,corrected.model)===null&&await hint.count()===0,label+' later correctness cannot erase failed history');
    assert.deepEqual(corrected.model.history.slice(0,failed.history.length),failed.history);assert.deepEqual(corrected.model.work.history.slice(0,failed.work.history.length),failed.work.history);
    await act(spec,'b18-reset');await finish(spec);const resetCorrected=await check(spec,true,'original-correct-after-reset');
    ok(replayFractionCaseEvidence(task,resetCorrected.model)===null&&await hint.count()===0,label+' paired reset cannot wash away invalid events');
    await reload(spec);ok(await hint.count()===0,label+' the strict exclusion persists offline');await shot('excluded');
    negatives.push({width,height,kind,id:spec.id,index:spec.index,failed,corrected,resetCorrected,stored:await snapshot('excluded')});
   }

   for(const[id,index]of[['joinfractions',0],['joinfractions',1],['fractionarea',0],['fractionquotient',0]]){
    const spec=specFor(id,index),task=taskFor(spec);label=prefix+'-equivalent-forms-'+id+'-'+index;await open(spec);
    await finish(spec,{formScale:2,reverse:width===1280,scattered:task.op==='*'});const checked=await check(spec,true,'equivalent-forms'),proof=replayFractionCaseEvidence(task,checked.model);await wordsFor(proof);await visual(spec,checked.model);
    assert.deepEqual(proof.quantities.result,spec.result);if(task.op==='*')assert.equal(proof.construction.product.contiguousColumns,false);
    await reload(spec);ok(await hint.isVisible(),label+' changed actual pieces preserve the same quantity offline');
    negatives.push({width,height,kind:'legitimate-equivalent-forms',id,index,checked,proof,stored:await snapshot('equivalent')});
   }

   for(const bounds of[['-0 1/2','-0 1/4'],['50%','100%'],['23/12','2'],['1','23/12']]){
    const spec=specFor('unlikeparts'),task=taskFor(spec);label=prefix+'-interval-'+negatives.length;await open(spec);await finish(spec,{bounds});
    const checked=await check(spec,true,'honest-interval-reflection'),proof=replayFractionCaseEvidence(task,checked.model);await wordsFor(proof);assert.deepEqual(proof.estimate.bounds,bounds);
    await reload(spec);ok(await hint.isVisible(),label+' exact signed, percent or closed-endpoint interval restores offline');
    negatives.push({width,height,kind:'legitimate-interval',bounds,checked,proof,stored:await snapshot('interval')});
   }

   for(const spec of associated){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);const nativeBefore=structuredClone((await state()).lessons);
    ok(fractionCaseBinding(taskFor(spec),ctx(spec))===null&&await guide.count()===0,label+' associated copy has no native source binding or guide');
    await finish(spec,{reverse:width===1280});const checked=await check(spec,true,'associated-original-check');await visual(spec,checked.model);
    ok(await hint.count()===0,label+' associated original success does not borrow native strict feedback');assert.deepEqual((await state()).lessons,nativeBefore);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);assert.deepEqual((await state()).lessons,nativeBefore);
    ok(await hint.count()===0,label+' native/associated separation survives the stopped-origin reload');if(spec===associated[0])await shot('isolated');
    isolated.push({width,height,id:spec.id,index:spec.index,from:spec.from,to:spec.to,taskHash:spec.taskHash,checked,stored:await snapshot('associated')});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===76&&isolated.length===112,'all 38 native and 56 associated positions run in both viewports');
  ok(observations.every(o=>o.snapshots.length===5),'all 380 native checked snapshots are retained');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance},null,2));
  console.log('P9_FRACTIONCASE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,negatives:negatives.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance,error:String(error),stack:error.stack,at:label},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});if(context)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
