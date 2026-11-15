// Actual B18 equal-part controls and checked work in stopped-origin Chromium.
// Only empty lesson positions are seeded. No model, answer, proof or checked
// attempt is inserted into the browser. Expected quantities come from the
// independent source fixture, not the production adapter or generic solver.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-scalechain-cases.cjs'),{cases,bridges,practices}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-scalechain-adapter');
const viewports=[[1440,900],[1280,720]],fields=['denom','unit','amount','result','decimal'];
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
const rational=(n,d)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n,d);return[Number(n/g),Number(d/g)];};
const name=([n,d])=>d===1?String(n):n+'/'+d;
function decimal([n,d]){
 n=BigInt(n);d=BigInt(d);let text=String(n/d),remainder=n%d;
 if(!remainder)return text;text+='.';let count=0;
 while(remainder){assert.ok(++count<=8,'fixture quantity has a finite supported decimal');remainder*=10n;text+=remainder/d;remainder%=d;}
 return text;
}
function display(pair,unit){
 const [n,d]=pair.map(BigInt);
 if(unit==='元'&&n*100n%d===0n){const cents=n*100n/d;return cents/100n+'.'+String(cents%100n).padStart(2,'0');}
 return name(pair);
}
function oracleFor(spec){
 const oracle=spec.expectedStages?spec:cases.find(item=>item.taskHash===spec.taskHash);
 assert.ok(oracle,'associated task has an independently fixed native mathematical oracle');return oracle;
}
function stagePlan(spec,index,{round=0,reverse=false}={}){
 const oracle=oracleFor(spec),expected=oracle.expectedStages[index];assert.ok(expected);
 const [n,d]=expected.ratio,denominator=n===3&&d===2?4:expected.denominator*(round%2?2:1);
 const count=n*denominator/d,capacity=Math.ceil(n/d)*denominator;
 assert.ok(Number.isInteger(count)&&count>=1&&count<=160&&denominator<=100);
 // 150% deliberately uses three quarter-pieces from each of two wholes.
 // Other rebuilt paths may use a separated last piece and reverse click order.
 const selectedIds=n===3&&d===2?[0,1,2,4,5,6]:Array.from({length:count},(_,i)=>
  round%2&&i===count-1&&count<capacity?capacity-1:i);
 if(reverse)selectedIds.reverse();
 const pieceValue=rational(BigInt(expected.before[0]),BigInt(expected.before[1])*BigInt(denominator));
 const written=pair=>oracle.unit==='元'?decimal(pair):name(pair);
 return {index,denominator,capacity,selectedIds,pieceValue,expected,
  fields:{denom:denominator===4?'0x4':denominator===5?'5e0':String(denominator),
   unit:written(pieceValue),amount:written(expected.amount),result:written(expected.result),
   decimal:expected.decimalRequired?(n===1&&d===5?'0.20':decimal(expected.ratio)):''}};
}

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[],backups=[],retries=[];
 const ok=(condition,label,details={})=>{assert.ok(condition,label);checks.push({label,...details});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
  githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,sourceHashes:fixture.sourceHashes,childTrial:false,
  independentTeachingReview:false,seededCorrectWork:false,realBrowserBackupImport:false,backupImportsCompleted:0};
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b18-model.js');
 const {scaleChainBinding,replayScaleChainEvidence}=await import('../dist/learning/scalechain-evidence.js');
 const taskFor=spec=>sessionTasks(spec.id)[spec.index],ctx=spec=>({sessionId:spec.id,index:spec.index});
 for(const spec of [...cases,...bridges])assert.equal(hash(taskFor(spec)),spec.taskHash);
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 for(const spec of practices)assert.equal(scaleChainBinding(spec.task,ctx(spec)),null);
 fs.writeFileSync(path.join(out,'sources.json'),JSON.stringify({provenance,cases,bridges,practices},null,2));
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 let browser,server,activePage,label='setup',failureDiagnostic=null;const contexts=new Set(),diagnostics=new Map();
 const readPage=page=>page.evaluate(async()=>{const {readStored}=await import('./storage.js');
  return{raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  for(const [width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});contexts.add(context);
   // Prepare an independent, empty cache while the origin is available, so
   // the later real backup import also works with the HTTP origin stopped.
   const restoreContext=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});contexts.add(restoreContext);
   for(const current of [context,restoreContext])current.on('request',request=>{
    if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());
   });
   const page=activePage=await context.newPage(),restorePage=await restoreContext.newPage();
   for(const current of [page,restorePage]){
    current.setDefaultTimeout(20000);current.on('pageerror',error=>errors.push({label,error:String(error)}));
    diagnostics.set(current,observeBrowserDiagnostics(current,{out,base,label:()=>label}));
   }
   const cacheReady=async(current,role)=>{
    try{
    await current.goto(base+'v2.html#trail');await current.locator('#import-file').waitFor({state:'attached'});
    // The file input is static HTML. The export control is created only after
    // exploration.boot has loaded the atlas and initialized the actual state.
    await current.locator('#main [data-do="export"]').first().waitFor();
    let report={ready:false};
    for(let i=0;i<300;i++){
     report=await current.evaluate(async expected=>{
      const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
      const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,
       state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
      if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return{ready:false,...identity};
      const status=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
       channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
       worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
      });
      return {...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
     },cache);
     if(report.ready)break;await current.waitForTimeout(100);
    }
    const modules=await current.evaluate(async expected=>{
     const store=await caches.open(expected);return Promise.all(['storage.js','exploration-core.js','exploration.js',
      'learning/scalechain-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
      'learning/state.js','learning/tasks.js','learning/phase5/b18-model.js','learning/phase5/b18-view.js',
      'learning/phase5/b18.js','learning/phase5/b37.js','learning/phase5/b38.js','learning/phase5/b38-more.js',
      'learning/phase4/async-batches.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
    },cache);
    const result={width,height,role,cache,report,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};
    offline.push(result);ok(report.ready&&result.missing.length===0,prefix+' '+role+' activated cache contains every dependency',result);return result;
    }catch(error){activePage=current;error.diagnosticPage=current;throw error;}
   };
   const warmed=await Promise.all([cacheReady(page,'source'),cacheReady(restorePage,'backup-target')]);
   const emptyRestore=JSON.parse((await readPage(restorePage)).text);
   assert.deepEqual(emptyRestore.lessons,{});assert.deepEqual(emptyRestore.daily.bridges,{});
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   for(const report of warmed)report.originStopped=!server.listening;
   ok(!server.listening,prefix+' origin stops before all mathematical interaction and backup restoration');

   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const state=async()=>JSON.parse((await readPage(page)).text);
   const saved=async id=>{const s=await state();return s.lessons[id]||s.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const wait=(current,spec)=>current.waitForFunction(({id,index})=>{
    const value=window.mathLesson?.snapshot();return value?.id===id&&value.index===index&&value.view==='task';
   },spec);
   const reload=async spec=>{const response=await page.reload();await wait(page,spec);
    ok(response?.fromServiceWorker()===true,label+' real document reload is served after the origin stopped');};
   const open=async spec=>{
    // Keep all earlier real work. Only select a new, empty native/bridge
    // position; never inject a completed model or overwrite an earlier case.
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{readStored},{freshLesson},{BRIDGES}]=await Promise.all([
      import('./exploration-core.js'),import('./storage.js'),import('./learning/state.js'),import('./learning/bridges.js')]);
     const raw=readStored(KEY),s=raw?JSON.parse(raw):fresh(),table=Object.hasOwn(BRIDGES,id)?s.daily.bridges:s.lessons;
     const record=table[id]||freshLesson(id);
     if(record.models[index]||record.cases[index])throw Error('Browser case must start at an empty position');
     record.index=index;record.view='task';table[id]=record;localStorage.setItem(KEY,JSON.stringify(s));
    },spec);
    await page.goto(base+'learn.html#'+spec.id);await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
    await reload(spec);const record=await saved(spec.id);
    assert.deepEqual(record.models[spec.index],M.initial(taskFor(spec)));
    ok((record.cases[spec.index]?.attempts?.length??0)===0,label+' begins with empty work and no invented checked snapshot');
   };
   const reveal=async control=>{for(let i=0;i<10;i++){
    const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');if(!(await closed.count()))return;
    await closed.locator(':scope > summary').click();
   }assert.fail('too many nested disclosures');};
   const field=async(spec,key,value)=>{
    const expected=structuredClone(await model(spec)),control=page.locator(`[data-xfield="${key}"]`);
    assert.equal(await control.count(),1,label+' one real field '+key);await reveal(control);await control.fill(String(value));
    expected[key]=String(value);M.field(taskFor(spec),expected,key);assert.deepEqual(await model(spec),expected);return expected;
   };
   const action=async(spec,name,data={})=>{
    const expected=structuredClone(await model(spec)),selector=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const control=page.locator(`[data-x="b18-${name}"]${selector}`);assert.equal(await control.count(),1,label+' one real action '+name+selector);
    await reveal(control);await control.click();M.act(taskFor(spec),expected,'b18-'+name,data);
    assert.deepEqual(await model(spec),expected);ok(M.valid(taskFor(spec),expected),label+' original model after '+name);return expected;
   };
   const shot=async(suffix,current=page)=>{await current.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await current.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const snapshot=async(suffix,current=page)=>{const stored=await readPage(current);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),stored.raw);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),stored.text);return JSON.parse(stored.text);};
   const check=async(spec,correct,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]),control=page.locator('#actions [data-do="check"]');
    await reveal(control);await control.click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves exactly one actual checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' keeps original attempt metadata');
    assert.equal(M.inspect(taskFor(spec),beforeModel).correct,correct);
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' observes original grading');
    return {name:suffix,correct,model:beforeModel,attempt,record:after};
   };
   const visual=async(spec,current=undefined)=>{
    current??=await model(spec);const oracle=oracleFor(spec),b=current.board,stage=oracle.expectedStages[b.index];
    assert.equal(await page.locator('[data-x="b18-reset"]').count(),1);
    assert.equal(await page.locator('[data-x="b18-commit"]').count(),stage&&b.denom?1:0);
    assert.equal(await page.locator('[data-x="b18-cut"]').count(),stage?1:0);
    for(const key of fields){const visible=!!stage&&(key==='denom'||b.denom>0&&(key!=='decimal'||stage.decimalRequired));
     assert.equal(await page.locator(`[data-xfield="${key}"]`).count(),visible?1:0,label+' source field window '+key);}
    if(stage){
     assert.deepEqual(b.current,stage.before);const words=await page.locator('#extra-visual .b18-big').innerText();
     ok(words.includes(display(stage.before,oracle.unit)),label+' actual current-whole display uses the independent exact quantity');
     const pieces=page.locator('#extra-visual [data-x="b18-piece"]'),capacity=b.denom?Math.ceil(stage.ratio[0]/stage.ratio[1])*b.denom:0;
     assert.equal(await pieces.count(),capacity);
     const painted=await pieces.evaluateAll(elements=>elements.filter(e=>e.getAttribute('aria-pressed')==='true').map(e=>Number(e.dataset.index)));
     assert.deepEqual(painted.sort((a,b)=>a-b),[...b.selected].sort((a,b)=>a-b));
     if(b.denom){
      const frames=page.locator('#extra-visual .b18-scale-whole');assert.equal(await frames.count(),Math.ceil(stage.ratio[0]/stage.ratio[1]));
      const widths=await pieces.evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().width));
      ok(widths.every(value=>value>0)&&Math.max(...widths)-Math.min(...widths)<1,label+' rendered partitions have equal positive widths');
     }
    }else{
     const rows=await page.locator('#extra-visual .b18-saved > p').allTextContents();assert.equal(rows.length,oracle.expectedStages.length);
     for(const [index,want]of oracle.expectedStages.entries())
      ok(rows[index].includes(display(want.before,oracle.unit))&&rows[index].includes(display(want.result,oracle.unit)),label+' saved row '+index+' displays the independent before/result');
    }
   };
   const prepare=async(spec,index,options={})=>{
    const plan=stagePlan(spec,index,options);assert.equal((await model(spec)).board.index,index);
    await field(spec,'denom',plan.fields.denom);await action(spec,'cut');
    for(const item of plan.selectedIds)await action(spec,'piece',{index:item});
    for(const key of ['unit','amount',...(plan.expected.decimalRequired?['decimal']:[]),'result'])await field(spec,key,plan.fields[key]);
    await visual(spec);return plan;
   };
   const commit=async(spec,plan)=>{
    const current=await action(spec,'commit');assert.equal(current.board.index,plan.index+1);
    assert.deepEqual(current.board.current,plan.expected.result);for(const key of fields)assert.equal(current[key],'');
    await visual(spec,current);return current;
   };
   const finish=async(spec,options={})=>{
    const oracle=oracleFor(spec);for(let index=(await model(spec)).board.index;index<oracle.expectedStages.length;index++)
     await commit(spec,await prepare(spec,index,options));
    const current=await model(spec);assert.equal(M.inspect(taskFor(spec),current).correct,true);return current;
   };
   const proofFor=(spec,current)=>{
    const oracle=oracleFor(spec),proof=replayScaleChainEvidence(taskFor(spec),current);assert.ok(proof);
    assert.deepEqual(proof.start,oracle.start);assert.deepEqual(proof.result,oracle.result);assert.equal(proof.unit,oracle.unit);
    assert.equal(proof.stages.length,oracle.expectedStages.length);
    for(const [index,stage]of proof.stages.entries()){
     const expected=oracle.expectedStages[index];
     for(const key of ['before','ratio','mode','amount','result','decimalRequired','percent'])assert.deepEqual(stage[key],expected[key]);
     assert.deepEqual(stage.pieceValue,rational(BigInt(expected.before[0]),BigInt(expected.before[1])*BigInt(stage.denominator)));
     assert.equal(stage.selectedCount*expected.ratio[1],expected.ratio[0]*stage.denominator);
     assert.deepEqual(stage.selectedIds,current.board.records[index].selected);
    }
    return proof;
   };
   const wordsFor=async proof=>{
    ok(!!proof&&await hint.isVisible(),label+' strict feedback belongs to the latest complete successful snapshot');
    const words=await hint.innerText();
    ok(/提交/.test(words)&&/系统|工具/.test(words)&&/整体/.test(words),label+' feedback separates actual submissions from tool-generated partitions');
    for(const stage of proof.stages)for(const quantity of [stage.before,stage.pieceValue,stage.amount,stage.result])
     ok(words.includes(display(quantity,proof.unit)),label+' feedback retains exact source quantity '+display(quantity,proof.unit));
    ok(/长期掌握/.test(words)&&/建模|独立作图|自由解释/.test(words),label+' feedback keeps its assessment limits');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d|你已掌握|已经掌握|你独立画|你独立计算/.test(words),label+' fixed source work gets no invented mastery or mathematical-practice claim');
    return words;
   };

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),oracle=oracleFor(spec),reverse=width===1280;
    await open(spec);assert.equal(scaleChainBinding(task,ctx(spec))?.nodeId,spec.nodeId);await visual(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional source guide begins collapsed');
    ok(await hint.count()===0,label+' empty work has no strict feedback');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' actual summary opens the optional question');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support)break;await page.waitForTimeout(50);}
    assert.deepEqual(afterGuide.models,beforeGuide.models);ok(afterGuide.cases[spec.index]?.support===true,label+' support does not manufacture mathematical work');
    await guide.locator('summary').click();
    const snapshots=[],special=[];
    if(spec.id==='portionoperator'&&spec.index===0){
     await field(spec,'denom','0');const rejected=await action(spec,'cut');assert.equal(rejected.board.denom,0);
     ok(rejected.issue&&await page.locator('.b18-issue').isVisible(),label+' invalid visible partition request keeps its original issue');
     special.push({kind:'invalid-partition',model:rejected});
    }
    const firstPlan=await prepare(spec,0,{reverse});await field(spec,'result','999');
    const failedFirst=await action(spec,'commit');assert.equal(failedFirst.board.index,0);assert.equal(failedFirst.board.first[0].result,'999');
    snapshots.push(await check(spec,false,'01-wrong-result'));ok(await hint.count()===0,label+' wrong original submission has no strict evidence');
    await field(spec,'result',firstPlan.fields.result);
    if(spec.id==='portionoperator'&&spec.index===1){
     await field(spec,'decimal','.2');const badDecimal=await action(spec,'commit');assert.equal(badDecimal.board.index,0);
     snapshots.push(await check(spec,false,'02-dot-two-rejected'));special.push({kind:'original-decimal-grammar',model:badDecimal});
     await field(spec,'decimal','0.20');
    }
    await commit(spec,firstPlan);
    for(let index=1;index<oracle.expectedStages.length;index++){
     const plan=await prepare(spec,index,{reverse});
     if(spec.id==='portionoperator'&&spec.index===2&&index===1){
      for(const [key,value]of Object.entries({unit:'4.5',amount:'4.5',result:'40.5'}))await field(spec,key,value);
      const wrongWhole=await action(spec,'commit');assert.deepEqual(wrongWhole.board.current,[36,1]);assert.equal(wrongWhole.board.index,1);
      snapshots.push(await check(spec,false,'02-old-whole-tax-rejected'));special.push({kind:'wrong-old-whole',model:wrongWhole});
      for(const [key,value]of Object.entries({unit:'3.6',amount:'3.6',result:'39.6'}))await field(spec,key,value);
     }
     await commit(spec,plan);
    }
    ok(await hint.count()===0,label+' corrected completed work still requires a new check');
    snapshots.push(await check(spec,true,'03-corrected-result'));
    const firstModel=await model(spec),firstProof=proofFor(spec,firstModel),firstWords=await wordsFor(firstProof);
    assert.equal(firstProof.firstAttempts[0].result,'999');ok(firstProof.failedRequests.length>=1,label+' failed commit remains in the real history');
    const firstRecord=await saved(spec.id);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,firstRecord.models);assert.deepEqual((await saved(spec.id)).cases,firstRecord.cases);
    ok(await hint.isVisible(),label+' checked corrected work and all errors restore offline');
    if(spec.id==='portionoperator'&&spec.index===2)await shot('03-multiple-current-wholes');

    const reset=await action(spec,'reset');assert.deepEqual(reset.board.first,firstModel.board.first);
    assert.deepEqual(reset.history.slice(0,firstModel.history.length),firstModel.history);
    for(const key of fields)assert.equal(reset[key],'');
    ok(await hint.count()===0,label+' actual reset immediately invalidates old checked feedback');await visual(spec,reset);await reload(spec);
    ok(await hint.count()===0,label+' offline reload cannot revive obsolete feedback');
    snapshots.push(await check(spec,false,'04-reset-current-work'));
    const pendingPlan=await prepare(spec,0,{round:1,reverse:!reverse}),pending=await model(spec);
    const atZero=await action(spec,'reset');assert.equal(atZero.board.index,0);assert.deepEqual(atZero.board.first,firstModel.board.first);
    for(const key of fields)assert.equal(atZero[key],pending[key]);
    await visual(spec,atZero);ok(await hint.count()===0,label+' index-zero reset hides retained inputs without erasing first attempts');
    const rebuiltPlan=await prepare(spec,0,{round:1,reverse:!reverse});assert.deepEqual(rebuiltPlan,pendingPlan);
    const chosen=rebuiltPlan.selectedIds[0],beforeToggle=await model(spec);
    await action(spec,'piece',{index:chosen});await action(spec,'piece',{index:chosen});
    const afterToggle=await model(spec);assert.equal(afterToggle.history.length,beforeToggle.history.length+2);
    assert.deepEqual([...afterToggle.board.selected].sort((a,b)=>a-b),[...beforeToggle.board.selected].sort((a,b)=>a-b));
    await commit(spec,rebuiltPlan);await finish(spec,{round:1,reverse:!reverse});
    const rebuiltModel=await model(spec),rebuiltProof=proofFor(spec,rebuiltModel);
    assert.equal(rebuiltProof.resets.length,2);assert.equal(rebuiltProof.firstAttempts[0].result,'999');
    assert.equal(rebuiltProof.currentFirstAttempts[0].result,rebuiltPlan.fields.result);
    ok(await hint.count()===0,label+' rebuilt same mathematical quantity needs a fresh actual submission');
    await reload(spec);assert.deepEqual(await model(spec),rebuiltModel);ok(await hint.count()===0,label+' distinct unsubmitted rebuild stays unchecked after reload');
    snapshots.push(await check(spec,true,'05-rechecked-rebuild'));await wordsFor(rebuiltProof);

    if(spec===cases[0]){
     const before=await saved(spec.id),button=page.locator('[data-do="p3-retry"]');assert.equal(await button.count(),1);await reveal(button);await button.click();await wait(page,spec);
     const fresh=await saved(spec.id);assert.deepEqual(fresh.models[spec.index],M.initial(task));assert.deepEqual(fresh.cases,before.cases);assert.deepEqual(fresh.notes,before.notes);
     ok(await hint.count()===0,label+' shared retry clears current work and preserves all previous checked attempts');await reload(spec);
     await finish(spec,{round:2,reverse:!reverse});ok(await hint.count()===0,label+' distinct shared-retry reconstruction cannot borrow earlier feedback');
     snapshots.push(await check(spec,true,'06-shared-retry'));retries.push({width,height,id:spec.id,index:spec.index,before,fresh,checked:snapshots.at(-1)});
    }
    const finalRecord=await saved(spec.id),finalModel=finalRecord.models[spec.index],finalProof=proofFor(spec,finalModel),finalWords=await wordsFor(finalProof);
    assert.deepEqual(finalRecord.cases[spec.index].attempts,snapshots.map(item=>item.attempt));
    assert.deepEqual(finalRecord.cases[spec.index].attempts.slice(0,firstRecord.cases[spec.index].attempts.length),firstRecord.cases[spec.index].attempts);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,finalRecord.models);assert.deepEqual((await saved(spec.id)).cases,finalRecord.cases);
    ok(await hint.isVisible(),label+' final exact work and every earlier checked snapshot survive offline');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    await visual(spec,finalModel);await shot('final-verified');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,
     snapshots,special,firstModel,firstProof,firstWords,reset,atZero,rebuiltModel,rebuiltProof,
     finalModel,finalProof,finalWords,record:finalRecord,stored:await snapshot('final')});
    // Rejection probes operate on Node copies of observed work, never on the
    // live browser. They do not pretend a hidden control was actually clicked.
    const hidden=structuredClone(finalModel);hidden.denom='4';
    assert.equal(M.valid(task,hidden),true);assert.equal(M.inspect(task,hidden).correct,true);
    assert.equal(replayScaleChainEvidence(task,hidden),null);
    negatives.push({width,height,id:spec.id,index:spec.index,syntheticRejectionProbe:true,
     kind:'hidden-final-field',model:hidden,originalCorrect:true,strictRejected:true});
   }

   for(const spec of bridges){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);const nativeBefore=structuredClone((await state()).lessons);
    assert.equal(scaleChainBinding(taskFor(spec),ctx(spec)),null);ok(await guide.count()===0&&await hint.count()===0,label+' associated copy has no borrowed native guide or evidence');
    await finish(spec,{round:width===1280?1:0,reverse:width===1280});const checked=await check(spec,true,'associated-original-check');await visual(spec,checked.model);
    ok(await hint.count()===0,label+' associated original success stays outside strict native feedback');assert.deepEqual((await state()).lessons,nativeBefore);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    assert.deepEqual((await state()).lessons,nativeBefore);ok(await hint.count()===0,label+' source isolation survives real offline restoration');
    await shot('isolated');isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,task:taskFor(spec),checked,stored:await snapshot('isolated')});
   }

   label=prefix+'-actual-v2-backup';await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   const download=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const exported=await download;
   const backupPath=path.join(out,label+'.json');await exported.saveAs(backupPath);const payload=fs.readFileSync(backupPath,'utf8'),backup=JSON.parse(payload);
   assert.equal(backup.version,2);assert.deepEqual(backup.state,await state());
   for(const spec of cases){const record=backup.state.lessons[spec.id];assert.ok(record?.cases[spec.index]?.attempts?.length>=4);proofFor(spec,record.models[spec.index]);}
   for(const spec of bridges)assert.equal(backup.state.daily.bridges[spec.id].cases[spec.index].attempts.length,1);
   ok(true,label+' downloaded JSON contains all original errors, corrections, reset histories and current work');await shot('exported');
   activePage=restorePage;const targetResponse=await restorePage.reload();await restorePage.locator('#import-file').waitFor({state:'attached'});
   await restorePage.locator('#main [data-do="export"]').first().waitFor();
   ok(targetResponse?.fromServiceWorker()===true,label+' empty independent import target also reloads from stopped-origin cache');
   const empty=JSON.parse((await readPage(restorePage)).text);assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
   const importFile=async filename=>{
    await restorePage.locator('#import-file').setInputFiles({name:filename,mimeType:'application/json',buffer:Buffer.from(payload)});
    await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    ok((await restorePage.locator('#toast').innerText()).includes('备份已合并'),label+' actual file input reports a completed merge');
   };
   await importFile('scalechain-real-browser-v2.json');const restored=await readPage(restorePage),restoredState=JSON.parse(restored.text);
   assert.deepEqual(restoredState,backup.state);
   assert.deepEqual(restoredState.lessons,backup.state.lessons);assert.deepEqual(restoredState.daily.bridges,backup.state.daily.bridges);
   for(const spec of cases)proofFor(spec,restoredState.lessons[spec.id].models[spec.index]);
   await importFile('scalechain-identical-repeat-v2.json');assert.equal((await readPage(restorePage)).raw,restored.raw);
   ok(true,label+' independent import preserves every lesson and bridge field; repeated import is byte-idempotent');
   const restoreSpec=cases.at(-1),lessonResponse=await restorePage.goto(base+'learn.html#'+restoreSpec.id);await wait(restorePage,restoreSpec);
   ok(lessonResponse?.fromServiceWorker()===true&&await restorePage.locator('#thinking-feedback').isVisible(),label+' imported current work receives its own bounded feedback offline');
   const afterOpen=JSON.parse((await readPage(restorePage)).text);
   assert.deepEqual(afterOpen.lessons[restoreSpec.id].models,backup.state.lessons[restoreSpec.id].models);
   assert.deepEqual(afterOpen.lessons[restoreSpec.id].cases,backup.state.lessons[restoreSpec.id].cases);
   await shot('restored',restorePage);const restoredSnapshot=await snapshot('restored',restorePage);
   backups.push({width,height,file:path.basename(backupPath),bytes:Buffer.byteLength(payload),sha256:digest(payload),
    originalState:backup.state,restoredState:restoredState,restoredSnapshot,independentEmptyContext:true,
    originStopped:!server.listening,nativeCases:cases.length,associatedCases:bridges.length,idempotent:true});
   provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted=backups.length;
   await context.close();contexts.delete(context);await restoreContext.close();contexts.delete(restoreContext);activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===20&&isolated.length===10&&backups.length===2,'all ten native and five associated tasks ran in both viewports with real backup restoration');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,backups,retries,viewports,provenance},null,2));
  console.log('P9_SCALECHAIN_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,backups:backups.length,negativeCopies:negatives.length}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  if(activePage&&diagnostics.has(activePage))failureDiagnostic=await diagnostics.get(activePage).dump(error).catch(failure=>({diagnosticError:String(failure)}));
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,backups,retries,viewports,provenance,
   failureDiagnostic,error:String(error),stack:error.stack,at:label},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  for(const context of contexts)await context.close();if(browser)await browser.close();
 }
}

module.exports={stagePlan,display};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
