// Real mixed-unit exchanges, removals and checked work in stopped-origin Chromium.
// Every lesson and checked attempt is created through visible controls. The two
// associated index-1 tasks use their original preceding tasks and Next; no
// localStorage, model, answer or proof is seeded. Independent fixture quantities
// are the oracle; this script does not call a production or generic solver.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-mixedtrade-cases.cjs'),{cases,bridges,practices}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-mixedtrade-adapter');
const viewports=[[1440,900],[1280,720]],fields=['guess','whole','part','answer'];
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const rational=(n,d=1)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n,d);return[Number(n/g),Number(d/g)];};
const name=([n,d])=>d===1?String(n):n+'/'+d;
const construction=board=>Object.fromEntries(['started','w','p','takenW','takenP','trades'].map(key=>[key,board[key]]));
const submittedFor=spec=>({whole:String(spec.expected.final.w),part:name(rational(spec.expected.final.p,spec.expected.denominator)),answer:name(spec.expected.result)});
function mixedTradePlan(spec,{guess='0',allPieces=false}={}){
 const expected=spec.expected,d=expected.denominator,steps=[],field=(key,value)=>steps.push({field:key,value:String(value)}),
  action=name=>steps.push({action:'b18-'+name,data:{}});
 let {w,p}=expected.initial;
 field('guess',guess);action('start');
 if(allPieces){assert.ok(w>0);action('all-pieces');p+=w*d;w=0;}
 for(let i=0;i<expected.requiredTaken.w;i++){action('take-whole');if(w)w--;else{assert.ok(p>=d);p-=d;}}
 for(let i=0;i<expected.requiredTaken.p;i++){if(!p){assert.ok(w>0);action('split');w--;p+=d;}action('take-part');p--;}
 while(p>=d){action('merge');w++;p-=d;}
 assert.deepEqual({w,p},expected.final);
 for(const [key,value]of Object.entries(submittedFor(spec)))field(key,value);
 return steps;
}
// These original index-0 tasks are navigation prerequisites only; they are not
// additional native mixed-unit coverage or fabricated successful records.
const prerequisites={
 'link-mixedrename-mixedexchange':{
  task:{type:'x-unitwalk',n:11,d:4,whole:true,prompt:'接出11个四分之一，把完整的1圈出来，剩下的仍是四分之一。'},
  steps:[{field:'parts',value:'4'},{action:'b16-partition',data:{}},...Array.from({length:11},()=>({action:'b16-walk',data:{}})),
   {field:'answer',value:'11/4'},{field:'whole',value:'2'},{field:'remainder',value:'3/4'}]
 },
 'link-splitfraction-mixedexchange':{
  task:{type:'x-fracdecompose',n:17,d:8,required:[[8,8,1]],prompt:'17个八分之一，分成两个完整的1与一个小份。用等式留下整份和零头。'},
  steps:[{action:'b18-cut',data:{index:8}},{action:'b18-cut',data:{index:16}},
   {field:'equation',value:'17/8=8/8+8/8+1/8'},{action:'b18-save',data:{}}]
 }
};

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const checks=[],errors=[],remote=[],observations=[],preparations=[],isolated=[],offline=[],backups=[];
 const ok=(condition,label,details={})=>{assert.ok(condition,label);checks.push({label,...details});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
  githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,sourceHashes:fixture.sourceHashes,childTrial:false,
  independentTeachingReview:false,seededCorrectWork:false,seededLessonPosition:false,realBrowserBackupImport:false,backupImportsCompleted:0};
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b18-model.js');
 const Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js');
 const Core=await import('../dist/exploration-core.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const {mixedTradeBinding,replayMixedTradeEvidence}=await import('../dist/learning/mixedtrade-evidence.js');
 const taskFor=spec=>sessionTasks(spec.id)[spec.index],ctx=spec=>({sessionId:spec.id,index:spec.index});
 assert.equal(cases.length,3);assert.equal(bridges.length,3);assert.equal(practices.length,1);
 for(const spec of [...cases,...bridges]){assert.equal(hash(taskFor(spec)),spec.taskHash);assert.deepEqual(taskFor(spec),spec.task);}
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 for(const spec of practices){assert.deepEqual(Tasks.PRACTICE[spec.id],spec.task);assert.equal(hash(Tasks.PRACTICE[spec.id]),spec.taskHash);assert.equal(mixedTradeBinding(spec.task,ctx(spec)),null);}
 for(const [id,prep]of Object.entries(prerequisites))assert.deepEqual(sessionTasks(id)[0],prep.task);
 fs.writeFileSync(path.join(out,'sources.json'),JSON.stringify({provenance,cases,bridges,practices,prerequisites},null,2));
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
      'learning/mixedtrade-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
      'learning/state.js','learning/tasks.js','learning/phase5/b18-model.js','learning/phase5/b18-view.js',
      'learning/phase5/b18.js','learning/phase5/b16.js','learning/phase5/b16-model.js','learning/phase5/b16-view.js',
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
   const reveal=async control=>{for(let i=0;i<10;i++){
    const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');if(!(await closed.count()))return;
    await closed.locator(':scope > summary').click();
   }assert.fail('too many nested disclosures');};
   const field=async(spec,key,value)=>{
    const expected=structuredClone(await model(spec)),control=page.locator(`[data-xfield="${key}"]`);
    assert.equal(await control.count(),1,label+' one real field '+key);await reveal(control);ok(await control.isVisible()&&await control.isEnabled(),label+' visible enabled field '+key);await control.fill(String(value));
    expected[key]=String(value);Engine.fieldExtra(taskFor(spec),expected,key);assert.deepEqual(await model(spec),expected);return expected;
   };
   const action=async(spec,name,data={})=>{
    const expected=structuredClone(await model(spec)),selector=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const fullAction=name.startsWith('b')?name:'b18-'+name,control=page.locator(`[data-x="${fullAction}"]${selector}`);assert.equal(await control.count(),1,label+' one real action '+name+selector);
    await reveal(control);ok(await control.isVisible()&&await control.isEnabled(),label+' visible enabled action '+fullAction);await control.click();Engine.actExtra(taskFor(spec),expected,fullAction,data);
    assert.deepEqual(await model(spec),expected);ok(Tasks.validModel(taskFor(spec),expected),label+' original model after '+name);return expected;
   };
   const shot=async(suffix,current=page)=>{await current.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await current.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const snapshot=async(suffix,current=page)=>{const stored=await readPage(current);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),stored.raw);
    fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),stored.text);return originalState(JSON.parse(stored.text));};
   const check=async(spec,correct,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]),control=page.locator('#actions [data-do="check"]');
    await reveal(control);await control.click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    ok(attempts.length===(before.cases[spec.index]?.attempts?.length??0)+1,label+' '+suffix+' saves exactly one actual checked snapshot');
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    assert.equal(new Set(attempts.map(value=>value.id)).size,attempts.length);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' keeps original attempt metadata');
    assert.equal(Tasks.inspect(taskFor(spec),beforeModel).correct,correct);
    originalState(await state());
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(correct?'correct':'revise'),label+' '+suffix+' observes original grading');
    return {name:suffix,correct,model:beforeModel,attempt,record:after};
   };
   const runSteps=async(spec,steps)=>{
    for(const step of steps)if(step.field)await field(spec,step.field,step.value);else await action(spec,step.action,step.data);
   };
   const visual=async(spec,current=undefined)=>{
    current??=await model(spec);const task=taskFor(spec),b=current.board,visible=b.started?['whole','part','answer']:['guess'];
    for(const key of fields)assert.equal(await page.locator(`[data-xfield="${key}"]`).count(),visible.includes(key)?1:0,label+' original visible field window '+key);
    assert.equal(await page.locator('[data-x="b18-start"]').count(),b.started?0:1);
    assert.equal(await page.locator('[data-x="b18-reset"]').count(),1);
    const whole=page.locator('#extra-visual .b18-wholes > .b18-one'),piece=page.locator('#extra-visual .b18-loose > .b18-piece');
    assert.equal(await whole.count(),b.started?b.w:0);assert.equal(await piece.count(),b.started?b.p:0);
    if(b.started){
     assert.deepEqual(await whole.allTextContents(),Array(b.w).fill('1'));
     assert.deepEqual(await piece.allTextContents(),Array(b.p).fill('1/'+task.d));
     const geometry=await whole.or(piece).evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return{width:r.width,height:r.height};}));
     ok(geometry.every(r=>r.width>0&&r.height>0),label+' original whole and fractional tokens are visibly sized');
     const text=await page.locator('#extra-visual').innerText();
     ok(text.includes('每个小份是 1/'+task.d)&&text.includes(`现在有 ${b.w} 个整体和 ${b.p} 个小份`),label+' visible quantities retain the original unit');
     for(const [name,enabled]of [['split',b.w>0],['all-pieces',b.w>0],['merge',b.p>=task.d]])
      assert.equal(await page.locator(`[data-x="b18-${name}"]`).isEnabled(),enabled,label+' original enabled state '+name);
     for(const [name,enabled]of [['take-whole',b.takenW<task.b[0]],['take-part',b.takenP<task.b[1]]]){
      const button=page.locator(`[data-x="b18-${name}"]`);assert.equal(await button.count(),task.op==='-'?1:0);
      if(task.op==='-')assert.equal(await button.isEnabled(),enabled,label+' original removal quota '+name);
     }
     if(task.op==='-')ok(text.includes(`已拿走 ${b.takenW}/${task.b[0]} 个整体、${b.takenP}/${task.b[1]} 个小份`),label+' displayed removals match actual stored operations');
    }
   };
   const proofFor=(spec,current)=>{
    const expected=spec.expected,task=taskFor(spec),proof=replayMixedTradeEvidence(task,current);assert.ok(proof);
    assert.equal(M.valid(task,current),true);assert.equal(M.inspect(task,current).correct,true);
    for(const key of ['operandA','operandB','initialQuantity','result'])assert.deepEqual(proof[key],expected[key]);
    assert.equal(proof.operation,task.op);assert.equal(proof.denominator,expected.denominator);assert.deepEqual(proof.unitValue,[1,expected.denominator]);
    assert.deepEqual(proof.remainingQuantity,expected.result);assert.deepEqual(proof.removedQuantity,task.op==='-'?expected.operandB:[0,1]);
    assert.deepEqual(proof.finalConstruction,construction(current.board));
    assert.deepEqual({w:current.board.w,p:current.board.p},expected.final);
    assert.deepEqual({w:current.board.takenW,p:current.board.takenP},expected.requiredTaken);
    assert.deepEqual(proof.whole.value,[expected.final.w,1]);assert.deepEqual(proof.part.value,rational(expected.final.p,task.d));assert.deepEqual(proof.answer.value,expected.result);
    for(const key of ['whole','part','answer']){assert.equal(proof[key].raw,current[key]);assert.equal(proof[key].submissionOnly,true);}
    assert.equal(proof.eventCount,current.history.length);assert.equal(proof.events.length,current.history.length);
    for(const [index,event]of proof.events.entries()){
     const stored=current.history[index];assert.equal(event.historyIndex,index);assert.equal(event.action,stored.a);
     assert.deepEqual(event.fields,Object.fromEntries(fields.map(key=>[key,stored.f[key]])));
     assert.deepEqual(event.quantityBefore,rational(event.before.w*task.d+event.before.p,task.d));
     assert.deepEqual(event.quantityAfter,rational(event.after.w*task.d+event.after.p,task.d));
     if(event.before.started&&event.after.started){
      const taken=event.takenUnits||0;
      assert.equal(event.remainingUnitsBefore-event.remainingUnitsAfter,taken);
      assert.equal(event.removedUnitsAfter-event.removedUnitsBefore,taken);
     }
    }
    assert.deepEqual(proof.failedRequests,proof.events.filter(event=>!event.accepted));
    assert.deepEqual(proof.resets,proof.events.filter(event=>event.action==='reset'));
    assert.deepEqual(proof.exchanges,proof.events.filter(event=>['split','merge','all-pieces'].includes(event.action)));
    assert.deepEqual(proof.removals,proof.events.filter(event=>['take-whole','take-part'].includes(event.action)));
    for(const event of proof.removals.filter(event=>event.action==='take-whole'&&event.removedAs==='fraction-pieces')){
     assert.equal(event.before.w,0);assert.equal(event.takenUnits,task.d);assert.equal(event.before.p-event.after.p,task.d);
     assert.equal(event.before.trades,event.after.trades);assert.ok(!proof.exchanges.some(exchange=>exchange.historyIndex===event.historyIndex));
    }
    assert.deepEqual(proof.systemGenerated,{referenceWhole:true,initialStock:true,combinedAddends:task.op==='+',quantityCaptions:true});
    for(const key of ['exactKeystrokeOrderKnown','physicalActionAssessed','independentDrawingAssessed','openExplanationAssessed','generalMasteryAssessed','allLaterClicksRecorded'])
     assert.equal(proof.assessmentLimits[key],false);
    assert.equal(proof.assessmentLimits.method,null);assert.equal(proof.assessmentLimits.recordingLimit,1200);
    return proof;
   };
   const wordsFor=async proof=>{
    ok(await hint.isVisible(),label+' strict feedback belongs to the current complete checked snapshot');const words=await hint.innerText();
    for(const quantity of [proof.operandA,proof.operation==='+'?proof.operandB:proof.removedQuantity,proof.result])
     ok(words.includes(name(quantity)),label+' feedback retains exact quantity '+name(quantity));
    ok(words.includes('每个小份是 1/'+proof.denominator)&&words.includes(`当前剩下 ${proof.finalConstruction.w} 个整体、${proof.finalConstruction.p} 个小份`),label+' feedback matches the real final construction');
    ok(/工具/.test(words)&&/提交/.test(words)&&/独立作图/.test(words)&&/自由解释/.test(words)&&/长期掌握/.test(words),label+' automatic displays, written submissions and assessment limits stay explicit');
    if(proof.failedRequests.some(event=>event.action==='start'))ok(words.includes('没有成功摆出图'),label+' invalid start is preserved without becoming the first guess');
    if(proof.failedRequests.some(event=>event.action==='take-part'))ok(words.includes('未成功的拿取'),label+' failed removal and actual correction stay visible in bounded feedback');
    if(proof.resets.length)ok(words.includes('重摆前')&&words.includes('最后一轮'),label+' reset keeps earlier records distinct from the current work');
    if(proof.removals.some(event=>event.action==='take-whole'&&event.removedAs==='fraction-pieces'))
     ok(words.includes('没有另算一次“合成整体”的操作'),label+' taking a whole from loose pieces is not invented as a merge');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d|你已掌握|已经掌握|你独立画|你独立计算/.test(words),label+' no invented practice or mastery claim');
    return words;
   };
   const advance=async spec=>{
    const next=page.locator('#actions [data-do="next"]');assert.equal(await next.count(),1);await next.click();await wait(page,spec);
   };
   const openNative=async spec=>{
    if(spec.index===0){const response=await page.goto(base+'learn.html#'+spec.id);await wait(page,spec);ok(response?.fromServiceWorker()===true,label+' native lesson opens from the stopped-origin cache');}
    else{
     const previous=structuredClone(await saved(spec.id));assert.equal(previous.index,spec.index-1);await advance(spec);
     const current=await saved(spec.id);assert.deepEqual(current.cases,previous.cases);
     for(const [index,value]of Object.entries(previous.models))assert.deepEqual(current.models[index],value);
    }
    assert.deepEqual(await model(spec),M.initial(taskFor(spec)));ok((await saved(spec.id)).cases[spec.index]===undefined,label+' current native task has no seeded attempts');
   };

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),values=submittedFor(spec);await openNative(spec);await visual(spec);
    assert.equal(mixedTradeBinding(task,ctx(spec))?.nodeId,spec.nodeId);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),label+' optional native question begins collapsed');
    ok(await hint.count()===0,label+' empty work has no strict feedback');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' actual summary opens the optional question');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support)break;await page.waitForTimeout(50);}
    assert.deepEqual(afterGuide.models,beforeGuide.models);ok(afterGuide.cases[spec.index]?.support===true,label+' optional support creates no mathematical work');
    await guide.locator('summary').click();const snapshots=[],special=[];

    await field(spec,'guess','?');const invalidStart=await action(spec,'start');
    assert.deepEqual(invalidStart.board,M.initial(task).board);assert.equal(invalidStart.issue,'');
    ok(await page.locator('.b18-issue').count()===0,label+' visible invalid start records no invented source issue');
    special.push({kind:'invalid-start',model:invalidStart});
    await field(spec,'guess','0');const started=await action(spec,'start');assert.equal(started.board.first,'0');
    assert.deepEqual({w:started.board.w,p:started.board.p},spec.expected.initial);await visual(spec);
    if(spec.index===1){await action(spec,'take-whole');await action(spec,'take-whole');await action(spec,'take-part');}
    if(spec.index===2){
     await action(spec,'take-whole');await action(spec,'take-part');await action(spec,'take-part');
     const beforeFailure=await model(spec);assert.equal(beforeFailure.board.p,0);
     const failed=await action(spec,'take-part');assert.deepEqual(failed.board,beforeFailure.board);
     assert.equal(failed.history.length,beforeFailure.history.length+1);assert.equal(failed.issue,'小份不够了，可以把一个整体换开；量不会变。');
     ok(await page.locator('.b18-issue').isVisible(),label+' real insufficient-piece request shows the original issue');
     special.push({kind:'insufficient-pieces',before:beforeFailure,after:failed});
    }
    for(const [key,value]of Object.entries(values))await field(spec,key,value);
    snapshots.push(await check(spec,false,'01-incomplete-construction'));ok(await hint.count()===0,label+' correct written totals cannot replace the actual exchanges or removals');
    await visual(spec);await shot('01-incomplete-construction');
    if(spec.index===0)await action(spec,'merge');
    if(spec.index===1)await action(spec,'take-whole');
    if(spec.index===2){await action(spec,'split');for(let i=0;i<3;i++)await action(spec,'take-part');}
    const corrected=await model(spec);assert.equal(corrected.issue,'');assert.equal(M.inspect(task,corrected).correct,true);
    ok(await hint.count()===0,label+' corrected construction needs its own actual check');
    snapshots.push(await check(spec,true,'02-corrected-construction'));
    const firstModel=await model(spec),firstProof=proofFor(spec,firstModel),firstWords=await wordsFor(firstProof);
    assert.equal(firstProof.firstGuess.raw,'0');assert.equal(firstProof.firstGuess.matchesResult,false);assert.equal(firstProof.firstGuess.historyIndex,1);
    assert.equal(firstProof.currentGuess.raw,'0');assert.equal(firstProof.failedRequests.filter(event=>event.action==='start').length,1);
    assert.equal(firstProof.failedRequests.filter(event=>event.action==='take-part').length,spec.index===2?1:0);
    const firstRecord=await saved(spec.id);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,firstRecord.models);assert.deepEqual((await saved(spec.id)).cases,firstRecord.cases);
    ok(await hint.isVisible(),label+' real error and correction history restore offline');

    const [n,d]=spec.expected.result;await field(spec,'answer',2*n+'/'+(2*d));
    const equivalentDraft=await model(spec);assert.equal(M.inspect(task,equivalentDraft).correct,true);
    ok(await hint.count()===0,label+' an equivalent edited answer cannot borrow the older checked snapshot');
    await reload(spec);assert.deepEqual(await model(spec),equivalentDraft);
    ok(await hint.count()===0,label+' unsubmitted equivalent text remains unchecked offline');
    await field(spec,'answer','999');snapshots.push(await check(spec,false,'03-wrong-current-answer'));
    ok(await hint.count()===0,label+' latest wrong answer does not inherit an earlier successful check');
    await field(spec,'answer',values.answer);ok(await hint.count()===0,label+' returning to the older correct text still requires a new check after the wrong attempt');
    snapshots.push(await check(spec,true,'04-answer-corrected-again'));await wordsFor(proofFor(spec,await model(spec)));

    const beforeReset=await model(spec),reset=await action(spec,'reset');
    assert.equal(reset.board.started,false);assert.equal(reset.board.first,'0');assert.deepEqual(construction(reset.board),construction(M.initial(task).board));
    assert.deepEqual(reset.history.slice(0,-1),beforeReset.history);
    for(const key of Object.keys(M.fields))assert.equal(reset[key],beforeReset[key]);
    ok(await hint.count()===0,label+' reset invalidates feedback and preserves original first guess, inputs and operation history');
    await visual(spec,reset);snapshots.push(await check(spec,false,'05-reset-current-work'));await reload(spec);
    assert.deepEqual(await model(spec),reset);ok(await hint.count()===0,label+' reset work restores without reviving old evidence');

    await runSteps(spec,mixedTradePlan(spec,{guess:values.answer,allPieces:true}));
    const rebuilt=await model(spec),rebuiltProof=proofFor(spec,rebuilt),resetIndex=rebuiltProof.resets.at(-1).historyIndex;
    assert.equal(rebuiltProof.firstGuess.raw,'0');assert.equal(rebuiltProof.currentGuess.raw,values.answer);assert.equal(rebuiltProof.currentGuess.matchesResult,true);
    assert.equal(rebuiltProof.resets.length,1);assert.deepEqual(rebuilt.history.slice(0,reset.history.length),reset.history);
    const currentExchanges=rebuiltProof.exchanges.filter(event=>event.historyIndex>resetIndex);
    assert.equal(currentExchanges[0].action,'all-pieces');assert.equal(currentExchanges[0].wholesExchanged,spec.expected.initial.w);
    assert.equal(currentExchanges[0].piecesExchanged,spec.expected.initial.w*task.d);
    assert.equal(currentExchanges.filter(event=>event.action==='merge').length,spec.expected.final.w);
    const wholeFromPieces=rebuiltProof.removals.filter(event=>event.historyIndex>resetIndex&&event.action==='take-whole');
    assert.equal(wholeFromPieces.length,spec.expected.requiredTaken.w);assert.ok(wholeFromPieces.every(event=>event.removedAs==='fraction-pieces'));
    ok(await hint.count()===0,label+' rebuilt equal quantity has new real history and must be checked again');
    snapshots.push(await check(spec,true,'06-rebuilt-all-pieces'));
    const finalRecord=await saved(spec.id),finalModel=finalRecord.models[spec.index],finalProof=proofFor(spec,finalModel),finalWords=await wordsFor(finalProof);
    assert.equal(finalProof.eventCount,[10,15,21][spec.index]);
    assert.deepEqual(finalRecord.cases[spec.index].attempts,snapshots.map(snapshot=>snapshot.attempt));
    assert.deepEqual(snapshots.map(snapshot=>snapshot.correct),[false,true,false,true,false,true]);
    assert.deepEqual(finalRecord.cases[spec.index].attempts.slice(0,firstRecord.cases[spec.index].attempts.length),firstRecord.cases[spec.index].attempts);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,finalRecord.models);assert.deepEqual((await saved(spec.id)).cases,finalRecord.cases);
    ok(await hint.isVisible(),label+' final work and all six actual checked snapshots restore offline');
    await visual(spec,finalModel);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');await shot('final-verified');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,snapshots,special,
     firstModel,firstProof,firstWords,equivalentDraft,reset,rebuilt,rebuiltProof,finalModel,finalProof,finalWords,record:finalRecord,stored:await snapshot('final')});
   }

   for(const spec of bridges){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;const nativeBefore=structuredClone((await state()).lessons);
    const beforeURL=new URL(page.url()),targetURL=new URL(base+'learn.html#'+spec.id);
    const response=await page.goto(targetURL.href),firstSpec={id:spec.id,index:0};await wait(page,firstSpec);assert.equal(page.url(),targetURL.href);
    if(response)ok(response.fromServiceWorker()===true,label+' associated lesson opens from stopped-origin cache');
    else{
     assert.equal(response,null);assert.equal(beforeURL.origin,targetURL.origin);assert.equal(beforeURL.pathname,targetURL.pathname);
     assert.equal(beforeURL.search,targetURL.search);assert.notEqual(beforeURL.hash,targetURL.hash);
     ok(true,label+' associated lesson opens through the existing document hash');
    }
    offline.push({width,height,id:spec.id,phase:'associated-lesson-navigation',beforeURL:beforeURL.href,targetURL:targetURL.href,
     navigationMode:response?'document':'hash',fromServiceWorker:response?response.fromServiceWorker():null});
    assert.deepEqual(await model(firstSpec),Tasks.defaultModel(taskFor(firstSpec)));
    if(spec.index===1){
     const prep=prerequisites[spec.id];assert.ok(prep);assert.deepEqual(taskFor(firstSpec),prep.task);
     await runSteps(firstSpec,prep.steps);const checked=await check(firstSpec,true,'navigation-prerequisite');
     preparations.push({width,height,id:spec.id,index:0,task:prep.task,taskHash:hash(prep.task),checked,nativeMixedCoverage:false});
     await advance(spec);const record=await saved(spec.id);assert.deepEqual(record.cases[0],checked.record.cases[0]);
    }
    assert.deepEqual(await model(spec),M.initial(taskFor(spec)));assert.equal((await saved(spec.id)).cases[spec.index],undefined);
    assert.equal(mixedTradeBinding(taskFor(spec),ctx(spec)),null);
    ok(await guide.count()===0&&await hint.count()===0,label+' associated copy has no borrowed native guide or strict feedback');
    await runSteps(spec,mixedTradePlan(spec,{guess:submittedFor(spec).answer,allPieces:width===1280}));
    const checked=await check(spec,true,'associated-original-check');await visual(spec,checked.model);proofFor(spec,checked.model);
    ok(await hint.count()===0,label+' original mathematical success stays outside the native source binding');
    assert.deepEqual((await state()).lessons,nativeBefore);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    assert.deepEqual((await state()).lessons,nativeBefore);ok(await hint.count()===0,label+' associated isolation survives real offline restoration');
    await shot('isolated');isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,task:taskFor(spec),checked,stored:await snapshot('isolated')});
   }
   label=prefix+'-actual-v2-backup';await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   await page.locator('#main [data-do="export"]').first().waitFor();
   const download=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const exported=await download;
   const backupPath=path.join(out,label+'.json');await exported.saveAs(backupPath);const payload=fs.readFileSync(backupPath,'utf8'),backup=JSON.parse(payload);
   assert.equal(backup.version,2);assert.deepEqual(backup.state,await state());originalState(backup.state);
   for(const spec of cases){const record=backup.state.lessons[spec.id];assert.equal(record?.cases[spec.index]?.attempts?.length,6);proofFor(spec,record.models[spec.index]);}
   for(const spec of bridges)assert.equal(backup.state.daily.bridges[spec.id].cases[spec.index].attempts.length,1);
   for(const id of Object.keys(prerequisites))assert.equal(backup.state.daily.bridges[id].cases[0].attempts.length,1);
   ok(true,label+' downloaded JSON contains all original errors, corrections, reset histories and current work');await shot('exported');
   activePage=restorePage;const targetResponse=await restorePage.reload();await restorePage.locator('#import-file').waitFor({state:'attached'});
   await restorePage.locator('#main [data-do="export"]').first().waitFor();
   ok(targetResponse?.fromServiceWorker()===true,label+' empty independent import target also reloads from stopped-origin cache');
   const empty=originalState(JSON.parse((await readPage(restorePage)).text));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
   const importFile=async filename=>{
    await restorePage.locator('#import-file').setInputFiles({name:filename,mimeType:'application/json',buffer:Buffer.from(payload)});
    await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    ok((await restorePage.locator('#toast').innerText()).includes('备份已合并'),label+' actual file input reports a completed merge');
   };
   await importFile('mixedtrade-real-browser-v2.json');const restored=await readPage(restorePage),restoredState=JSON.parse(restored.text);
   assert.deepEqual(restoredState,backup.state);originalState(restoredState);
   provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   assert.deepEqual(restoredState.lessons,backup.state.lessons);assert.deepEqual(restoredState.daily.bridges,backup.state.daily.bridges);
   for(const spec of cases)proofFor(spec,restoredState.lessons[spec.id].models[spec.index]);
   const firstImportFile=label+'-first-import-storage.txt';fs.writeFileSync(path.join(out,firstImportFile),restored.raw);
   await importFile('mixedtrade-identical-repeat-v2.json');const repeated=await readPage(restorePage);assert.equal(repeated.raw,restored.raw);
   assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);provenance.backupImportsCompleted++;
   const repeatedImportFile=label+'-repeated-import-storage.txt';fs.writeFileSync(path.join(out,repeatedImportFile),repeated.raw);
   ok(true,label+' independent import preserves every lesson and bridge field; repeated import is byte-idempotent');
   const restoreSpec=cases.at(-1),lessonResponse=await restorePage.goto(base+'learn.html#'+restoreSpec.id);await wait(restorePage,restoreSpec);
   ok(lessonResponse?.fromServiceWorker()===true&&await restorePage.locator('#thinking-feedback').isVisible(),label+' imported current work receives its own bounded feedback offline');
   const afterOpen=JSON.parse((await readPage(restorePage)).text);
   assert.deepEqual(afterOpen.lessons[restoreSpec.id].models,backup.state.lessons[restoreSpec.id].models);
   assert.deepEqual(afterOpen.lessons[restoreSpec.id].cases,backup.state.lessons[restoreSpec.id].cases);
   await shot('restored',restorePage);const restoredSnapshot=await snapshot('restored',restorePage);
   backups.push({width,height,file:path.basename(backupPath),bytes:Buffer.byteLength(payload),sha256:digest(payload),
    originalState:backup.state,restoredState:restoredState,restoredSnapshot,independentEmptyContext:true,
    firstImportRaw:{file:firstImportFile,bytes:Buffer.byteLength(restored.raw),sha256:digest(restored.raw)},
    repeatedImportRaw:{file:repeatedImportFile,bytes:Buffer.byteLength(repeated.raw),sha256:digest(repeated.raw)},
    originStopped:!server.listening,nativeCases:cases.length,associatedCases:bridges.length,navigationPrerequisites:2,importsCompleted:2,idempotent:true});
   await context.close();contexts.delete(context);await restoreContext.close();contexts.delete(restoreContext);activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===6&&isolated.length===6&&preparations.length===4&&backups.length===2,'all three native and three associated tasks ran in both viewports; four original navigation prerequisites are separate');
  ok(provenance.backupImportsCompleted===4,'two independent contexts each completed initial and byte-idempotent repeated real v2 import');
  const attemptCounts={native:observations.reduce((sum,item)=>sum+item.snapshots.length,0),associated:isolated.length,navigationPrerequisites:preparations.length};
  assert.deepEqual(attemptCounts,{native:36,associated:6,navigationPrerequisites:4});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,preparations,isolated,offline,backups,viewports,provenance,attemptCounts},null,2));
  console.log('P9_MIXEDTRADE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,backups:backups.length,navigationPrerequisites:preparations.length,attemptCounts}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  if(activePage&&diagnostics.has(activePage))failureDiagnostic=await diagnostics.get(activePage).dump(error).catch(failure=>({diagnosticError:String(failure)}));
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,preparations,isolated,offline,backups,viewports,provenance,
   failureDiagnostic,error:String(error),stack:error.stack,at:label},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  for(const context of contexts)await context.close();if(browser)await browser.close();
 }
}

module.exports={mixedTradePlan,submittedFor,prerequisites};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
