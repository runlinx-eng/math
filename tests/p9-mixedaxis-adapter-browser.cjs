// Actual applied points, identity-preserving order and separately assessed input.
// Every checked model is made through visible controls and real Next navigation.
// No lesson position, answer, model, history or checked attempt is seeded.
// Mathematical expectations come from the independent literal source fixture.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-mixedaxis-cases.cjs'),{cases,bridges,practices}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-mixedaxis-adapter');
const viewports=[[1440,900],[1280,720]],copy=structuredClone;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),name=([n,d])=>d===1?String(n):n+'/'+d;
const equal=(a,b)=>!!a&&!!b&&BigInt(a[0])*BigInt(b[1])===BigInt(b[0])*BigInt(a[1]);
function coordinateOracle(raw){
 const match=/^([+-]?)(\d{1,12})(?:\.(\d{1,8}))?$/.exec(raw.trim());if(!match)return null;
 const tail=match[3]||'';let n=BigInt(match[2]+tail),d=10n**BigInt(tail.length);if(match[1]==='-')n=-n;
 let a=n<0n?-n:n,b=d;while(b)[a,b]=[b,a%b];n/=a;d/=a;
 return{value:[Number(n),Number(d)],exact:[String(n),String(d)]};
}
const fieldStep=(field,value)=>({field,value:String(value)}),actionStep=(action,data={})=>({action,data});
function placeSteps(spec,indices=spec.task.cards.map((_,index)=>index)){
 return indices.flatMap(index=>[actionStep('b16-select',{index}),fieldStep('position',spec.expected.positionTexts[index]),actionStep('b16-place')]);
}
const orderSteps=indices=>indices.map(index=>actionStep('b16-order',{index}));
const comparisonSteps=spec=>spec.expected.statements.flatMap(q=>[fieldStep('relation',q.symbol),actionStep('b16-symbol')]);
const completeSteps=(spec,{reverse=false,alternate=false}={})=>[
 ...placeSteps(spec,reverse?spec.task.cards.map((_,index)=>index).reverse():undefined),
 ...orderSteps(alternate?spec.expected.validOrders.at(-1):spec.expected.validOrders[0]),...comparisonSteps(spec)
];
function firstWrongSteps(spec){
 assert.ok(!equal(spec.expected.cardValues[0],[spec.task.min,1]));
 return[fieldStep('position','.75'),actionStep('b16-place'),fieldStep('position',spec.task.min),actionStep('b16-place'),
  ...placeSteps(spec,spec.task.cards.map((_,index)=>index).slice(1)),...orderSteps(spec.expected.validOrders[0]),
  ...(spec.expected.statements.length?[fieldStep('relation','≤'),actionStep('b16-symbol')]:[])];
}
const correctionSteps=spec=>[...placeSteps(spec,[0]),...comparisonSteps(spec)];
function restoreOrderSteps(spec,remaining){
 const wanted=spec.expected.validOrders.at(-1);
 // The preceding visible withdrawal leaves a proper prefix for untied cards.
 if(spec.expected.validOrders.length===1){assert.deepEqual(remaining,wanted.slice(0,-1));return orderSteps([wanted.at(-1)]);}
 return[...orderSteps(remaining),...orderSteps(wanted)];
}
const decimalCompareSteps=rows=>rows.flatMap(row=>[
 fieldStep('prediction',row.relation),actionStep('b17-predict-compare'),fieldStep('left',row.left),fieldStep('right',row.right),actionStep('b17-pad'),
 ...row.scan.map(index=>actionStep('b17-scan',{index})),fieldStep('relation',row.relation),actionStep('b17-compare')
]);
// These six fixed original tasks provide real Next navigation. They do not
// increase this family's native coverage and do not call any generic solver.
const prerequisites={
 'mixedpoints:0':{id:'mixedpoints',index:0,
  task:{type:'x-digitlens',prompt:'每张卡只读高亮数字本身代表的量，往大处和小处都看一看。',cases:[
   {raw:'7,450,000,000',at:0,n:7000000000},{raw:'0.0000064',at:7,n:6,d:1000000},
   {raw:'305.0708',at:4,n:0},{raw:'305.0708',at:7,n:8,d:10000}]},
  steps:['7000000000','0.000006','0','0.0008'].flatMap((value,index)=>[
   actionStep('b16-digit',{index}),fieldStep('answer',value),actionStep('b16-digit-save')])},
 'decimalorder2:1':{id:'decimalorder2',index:1,
  task:{type:'x-decimalcompare',cases:[['3.72','3.27'],['0.45','0.54']],prompt:'对齐同一种单位，从大的位置开始看。在哪里第一次不同？'},
  steps:decimalCompareSteps([{left:'3.72',right:'3.27',relation:'>',scan:[0,1]},{left:'0.45',right:'0.54',relation:'<',scan:[0,1]}])},
 'raggeddecimals:0':{id:'raggeddecimals',index:0,
  task:{type:'x-decimalcompare',cases:[['0.45','0.405'],['0.4','0.87'],['0.9','0.11']],prompt:'有时写得长的更大，有时更小。让每种单位对齐后决定。'},
  steps:decimalCompareSteps([{left:'0.450',right:'0.405',relation:'>',scan:[0,1,2]},
   {left:'0.40',right:'0.87',relation:'<',scan:[0,1]},{left:'0.90',right:'0.11',relation:'>',scan:[0,1]}])},
 'link-thousandparts-raggeddecimals:0':{id:'link-thousandparts-raggeddecimals',index:0,
  task:{type:'x-decimalzoom',n:345,prompt:'在0.34与0.35里面找0.345。两次放大后，一小步占原单位的多少？'},
  steps:[actionStep('b17-zoom',{index:3}),actionStep('b17-zoom',{index:4}),actionStep('b17-mark',{index:5}),
   fieldStep('fraction','345/1000'),fieldStep('decimal','0.345'),fieldStep('answer','1/1000')]},
 'link-decimal-decimalorder2:0':{id:'link-decimal-decimalorder2',index:0,
  task:{type:'x-unitwalk',n:3,d:10,decimal:true,prompt:'把3/10走到线上，同一点怎样用小数记录？'},
  steps:[fieldStep('parts','10'),actionStep('b16-partition'),...Array.from({length:3},()=>actionStep('b16-walk')),
   fieldStep('answer','3/10'),fieldStep('decimal','0.3')]},
 'link-temperaturechange-orderforms:0':{id:'link-temperaturechange-orderforms',index:0,
  task:{type:'x-m29-order',prompt:'把 −7、−3、0、2、5 按从小到大的顺序放到数轴上。',values:[-7,-3,0,2,5]},
  steps:[0,1,2,3,4].map(index=>actionStep('m29-choose',{index}))}
};

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const checks=[],errors=[],remote=[],observations=[],preparations=[],isolated=[],offline=[],backups=[],navigation=[],counterfactuals=[];
 const ok=(condition,label,details={})=>{assert.ok(condition,label);checks.push({label,...details});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
  githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,sourceHashes:fixture.sourceHashes,childTrial:false,independentTeachingReview:false,
  seededCorrectWork:false,seededLessonPosition:false,realBrowserBackupImport:false,backupImportsCompleted:0};
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b16-model.js'),Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js');
 const Core=await import('../dist/exploration-core.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const {mixedAxisBinding,replayMixedAxisEvidence}=await import('../dist/learning/mixedaxis-evidence.js');
 const originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const taskFor=spec=>sessionTasks(spec.id)[spec.index],ctx=spec=>({sessionId:spec.id,index:spec.index});
 assert.equal(cases.length,8);assert.equal(bridges.length,10);assert.equal(practices.length,2);
 for(const spec of [...cases,...bridges]){assert.equal(hash(taskFor(spec)),spec.taskHash);assert.deepEqual(taskFor(spec),spec.task);}
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 for(const spec of practices){assert.deepEqual(Tasks.PRACTICE[spec.id],spec.task);assert.equal(hash(spec.task),spec.taskHash);assert.equal(mixedAxisBinding(spec.task,ctx(spec)),null);}
 for(const prep of Object.values(prerequisites))assert.deepEqual(taskFor(prep),prep.task);
 fs.writeFileSync(path.join(out,'sources.json'),JSON.stringify({provenance,cases,bridges,practices,prerequisites},null,2));
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 let browser,server,activePage,label='setup',failureDiagnostic=null;const contexts=new Set(),diagnostics=new Map();
 const readPage=page=>page.evaluate(async()=>{const {readStored}=await import('./storage.js');
  return{raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
 const rawFile=(filename,raw)=>{assert.equal(typeof raw,'string');fs.writeFileSync(path.join(out,filename),raw);
  return{file:filename,bytes:Buffer.byteLength(raw),sha256:digest(raw)};};
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
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});contexts.add(context);
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
     // This dynamic control is created after asynchronous atlas/state boot;
     // the static import input alone is not a readiness signal.
     await current.locator('#main [data-do="export"]').first().waitFor();
     let report={ready:false};
     for(let i=0;i<300;i++){
      report=await current.evaluate(async expected=>{
       const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
       const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,state:worker?.state||null,
        waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
       if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return{ready:false,...identity};
       const status=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
        channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
       });
       return{...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
      },cache);
      if(report.ready)break;await current.waitForTimeout(100);
     }
     const modules=await current.evaluate(async expected=>{
      const store=await caches.open(expected);return Promise.all(['storage.js','exploration-core.js','exploration.js',
       'learning/mixedaxis-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
       'learning/state.js','learning/tasks.js','learning/phase5/b16.js','learning/phase5/b16-model.js','learning/phase5/b16-view.js',
       'learning/phase5/b17.js','learning/phase5/b17-model.js','learning/phase5/b17-view.js',
       'learning/phase5/b29-model.js','learning/phase5/b29-view.js','learning/phase4/async-batches.js']
       .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
     },cache);
     const result={width,height,role,cache,report,modules,missing:modules.filter(item=>!item.cached).map(item=>item.name),originStopped:false};
     offline.push(result);ok(report.ready&&result.missing.length===0,prefix+' '+role+' activated cache has complete dependencies',result);return result;
    }catch(error){activePage=current;error.diagnosticPage=current;throw error;}
   };
   const warmed=await Promise.all([cacheReady(page,'source'),cacheReady(restorePage,'independent-empty-backup-target')]);
   const emptyRestore=originalState(JSON.parse((await readPage(restorePage)).text));
   assert.deepEqual(emptyRestore.lessons,{});assert.deepEqual(emptyRestore.daily.bridges,{});
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const state=async()=>JSON.parse((await readPage(page)).text);
   const saved=async id=>{const current=await state();return current.lessons[id]||current.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index];
   const wait=(current,spec)=>current.waitForFunction(({id,index})=>{const value=window.mathLesson?.snapshot();
    return value?.id===id&&value.index===index&&value.view==='task';},spec);
   const reload=async(spec,phase)=>{
    const before=await saved(spec.id),originStopped=!server.listening,response=await page.reload();await wait(page,spec);
    const after=await saved(spec.id);assert.deepEqual(after.models,before.models);assert.deepEqual(after.cases,before.cases);
    if(originStopped)assert.equal(response?.fromServiceWorker(),true);
    const receipt={width,height,id:spec.id,index:spec.index,phase,originStopped,fromServiceWorker:response?.fromServiceWorker()===true,
     modelSha256:digest(JSON.stringify(after.models[spec.index])),casesSha256:digest(JSON.stringify(after.cases))};
    offline.push(receipt);ok(true,label+' '+phase+' reload retains current work and all checked history',receipt);
   };
   const reveal=async control=>{for(let i=0;i<10;i++){
    const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');if(!(await closed.count()))return;
    await closed.locator(':scope > summary').click();
   }assert.fail('too many nested disclosures');};
   const field=async(spec,key,value)=>{
    const expected=copy(await model(spec)),control=page.locator(`[data-xfield="${key}"]`);
    assert.equal(await control.count(),1,label+' exactly one field '+key);await reveal(control);
    ok(await control.isVisible()&&await control.isEnabled(),label+' real visible field '+key);
    if((await control.evaluate(element=>element.tagName))==='SELECT')await control.selectOption(String(value));else await control.fill(String(value));
    expected[key]=String(value);Engine.fieldExtra(taskFor(spec),expected,key);assert.deepEqual(await model(spec),expected);return expected;
   };
   const action=async(spec,name,data={})=>{
    const expected=copy(await model(spec)),selector=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join('');
    const full=/^(?:b\d+|m\d+)-/.test(name)?name:'b16-'+name,control=page.locator(`[data-x="${full}"]${selector}`);
    assert.equal(await control.count(),1,label+' exactly one action '+full+selector);await reveal(control);
    ok(await control.isVisible()&&await control.isEnabled(),label+' real visible action '+full);await control.click();
    Engine.actExtra(taskFor(spec),expected,full,data);assert.deepEqual(await model(spec),expected);assert.equal(Tasks.validModel(taskFor(spec),expected),true);return expected;
   };
   const runSteps=async(spec,steps)=>{for(const step of steps)if(step.field)await field(spec,step.field,step.value);else await action(spec,step.action,step.data);};
   const shot=async(suffix,current=page)=>{
    const file=label+'-'+suffix+'.png';await current.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await current.screenshot({path:path.join(out,file),fullPage:true});return file;
   };
   const snapshot=async(suffix,current=page)=>{
    const stored=await readPage(current),raw=rawFile(label+'-'+suffix+'-storage.txt',stored.raw),validated=originalState(JSON.parse(stored.text));
    const stateFile=label+'-'+suffix+'-state.json';fs.writeFileSync(path.join(out,stateFile),stored.text);return{raw,stateFile,state:validated};
   };
   const visual=async(spec,current)=>{
    const task=taskFor(spec),b=current.board,pending=(task.statements||[]).length>b.symbols.length;
    assert.equal(await page.locator('[data-xfield]').count(),pending?2:1);
    assert.equal(await page.locator('[data-xfield="position"]').inputValue(),current.position);
    assert.equal(await page.locator('[data-xfield="relation"]').count(),pending?1:0);
    if(pending)assert.equal(await page.locator('[data-xfield="relation"]').inputValue(),current.relation);
    assert.deepEqual(await page.locator('.b16-cards [data-x="b16-select"]').allTextContents(),task.cards);
    assert.deepEqual(await page.locator('.b16-sort [data-x="b16-order"]').allTextContents(),task.cards);
    for(const index of task.cards.keys()){
     assert.equal(await page.locator(`[data-x="b16-select"][data-index="${index}"]`).getAttribute('aria-pressed'),String(b.selected===index));
     assert.equal(await page.locator(`[data-x="b16-order"][data-index="${index}"]`).getAttribute('aria-pressed'),String(b.ordered.includes(index)));
    }
    const circles=await page.locator('svg.b16-axis circle').evaluateAll(elements=>elements.map(element=>({
     cx:Number(element.getAttribute('cx')),width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height})));
    assert.equal(circles.length,Object.keys(b.placements).length);
    Object.values(b.placements).forEach((position,index)=>{
     assert.ok(Math.abs(circles[index].cx-(40+(position-task.min)/(task.max-task.min)*570))<1e-8);
     assert.ok(circles[index].width>0&&circles[index].height>0);
    });
    const ordered=b.ordered.map(index=>task.cards[index]).join('　→　')||'点卡片排一排';
    assert.equal(await page.locator('.b16-sort p').innerText(),'从小到大：'+ordered);
    assert.equal(await page.locator('.b16-issue').count(),current.issue?1:0);if(current.issue)assert.equal(await page.locator('.b16-issue').innerText(),current.issue);
   };
   const proofFor=(spec,current)=>{
    const task=taskFor(spec),expected=spec.expected,proof=replayMixedAxisEvidence(task,current);assert.ok(proof);
    assert.equal(M.valid(task,current),true);assert.equal(M.inspect(task,current).correct,true);
    assert.deepEqual(proof.axis,{min:task.min,max:task.max});assert.deepEqual(proof.cards.map(card=>card.value),expected.cardValues);
    assert.equal(proof.placements.length,task.cards.length);
    for(const [index,placement]of proof.placements.entries()){
     assert.equal(placement.index,index);assert.equal(placement.card,task.cards[index]);assert.deepEqual(placement.cardValue,expected.cardValues[index]);
     assert.deepEqual(placement.value,expected.cardValues[index]);assert.equal(placement.matchesCard,true);assert.equal(placement.inRange,true);
     assert.equal(placement.coordinate,current.board.placements[index]);assert.equal(placement.coordinate,expected.cardValues[index][0]/expected.cardValues[index][1]);
     assert.equal(current.history[placement.historyIndex].action,'place');assert.equal(current.history[placement.historyIndex].data.fields.position,placement.raw);
    }
    assert.ok(expected.validOrders.some(order=>same(order,current.board.ordered)));assert.deepEqual(proof.order.indices,current.board.ordered);
    assert.deepEqual(proof.order.values,current.board.ordered.map(index=>expected.cardValues[index]));
    for(const [index,comparison]of proof.comparisons.entries()){
     const q=expected.statements[index];assert.deepEqual(comparison.left.value,q.a);assert.deepEqual(comparison.right.value,q.b);
     assert.equal(comparison.requiredSymbol,q.symbol);assert.equal(comparison.submittedSymbol,q.symbol);assert.equal(comparison.word,q.word);
     assert.equal(comparison.mathematicallyTrue,true);assert.equal(comparison.meaningMatches,true);
     assert.equal(current.history[comparison.historyIndex].action,'symbol');
    }
    assert.equal(proof.comparisons.length,expected.statements.length);
    const draft=coordinateOracle(current.position),selected=current.board.selected,cardValue=expected.cardValues[selected],
     inside=!!draft&&BigInt(draft.value[0])>=BigInt(task.min)*BigInt(draft.value[1])&&BigInt(draft.value[0])<=BigInt(task.max)*BigInt(draft.value[1]);
    assert.equal(proof.currentDraft.raw,current.position);assert.equal(proof.currentDraft.selectedIndex,selected);
    assert.deepEqual(proof.currentDraft.value,draft?.value??null);assert.deepEqual(proof.currentDraft.valueExact,draft?.exact??null);
    assert.equal(proof.currentDraft.syntaxValid,!!draft);assert.equal(proof.currentDraft.inRange,inside);
    assert.equal(proof.currentDraft.matchesCard,equal(draft?.value,cardValue));assert.deepEqual(proof.currentDraft.appliedValue,cardValue);
    assert.equal(proof.currentDraft.status,!draft?'invalid-number':!inside?'outside-axis':equal(draft.value,cardValue)?'matches-card':'different-from-card');
    assert.equal(proof.eventCount,current.history.length);assert.equal(proof.events.length,current.history.length);assert.equal(proof.issue,current.issue);
    assert.deepEqual(proof.finalConstruction,current.board);
    for(const [index,event]of proof.events.entries()){
     assert.equal(event.historyIndex,index);assert.equal(event.action,current.history[index].action);
     assert.deepEqual(event.fields,{position:current.history[index].data.fields.position,relation:current.history[index].data.fields.relation});
     if(index)assert.deepEqual(event.before,proof.events[index-1].after);
    }
    assert.deepEqual(proof.failedRequests,proof.events.filter(event=>!event.accepted));assert.deepEqual(proof.resets,proof.events.filter(event=>event.action==='reset'));
    assert.deepEqual({index:proof.firstPlacement.index,position:proof.firstPlacement.coordinate},current.board.first);
    const firstEvent=proof.events.find(event=>event.action==='place'&&event.accepted),lastReset=proof.resets.at(-1)?.historyIndex??-1,
     roundFirst=proof.events.find(event=>event.historyIndex>lastReset&&event.action==='place'&&event.accepted);
    assert.deepEqual(proof.firstPlacement,firstEvent.placement);assert.deepEqual(proof.currentRoundFirstPlacement,roundFirst.placement);
    assert.deepEqual(proof.systemGenerated,{numberLine:true,unitTicks:true,cardLabels:true,pointDrawing:true});
    assert.equal(proof.assessmentLimits.method,null);assert.equal(proof.assessmentLimits.recordingLimit,2000);
    for(const key of ['independentDrawingAssessed','authorshipAssessed','understandingAssessed','generalMasteryAssessed','unappliedDraftAssessedAsApplied',
     'unrecordedActionsAuthenticated','allLaterClicksRecorded','historyCompletenessAuthenticated','exactKeystrokeOrderKnown'])assert.equal(proof.assessmentLimits[key],false);
    return proof;
   };
   const wordsFor=async(spec,proof)=>{
    ok(await hint.isVisible(),label+' bounded feedback matches the latest checked work');const words=await hint.innerText();
    assert.ok(words.includes(`${spec.task.cards.length} 张卡`)&&words.includes(`${spec.task.min} 到 ${spec.task.max}`));
    assert.ok(words.includes(proof.order.indices.map(index=>spec.task.cards[index]).join(' → ')));
    if(proof.currentDraft.status==='different-from-card')assert.ok(words.includes('当前输入与这张卡已经放下的正确坐标不同')&&words.includes('已经应用的落点'));
    if(proof.currentDraft.status==='invalid-number')assert.ok(words.includes('当前输入还不是工具可接受的数轴坐标')&&words.includes('仍保留在已经放下的位置'));
    for(const group of proof.order.equalValueGroups)assert.ok(words.includes('表示同一个数 '+name(group.value))&&words.includes('落在同一点'));
    if(proof.comparisons.length)assert.ok(words.includes('数值与题目指定的说法'));
    if(proof.firstPlacement.matchesCard===false)assert.ok(words.includes('曾经放错的位置')&&words.includes('旧错误没有删去'));
    if(proof.resets.length)assert.ok(words.includes('最早实际放下的是')&&words.includes('本轮第一次实际放下的是'));
    assert.ok(words.includes('系统根据已经放下的坐标绘制')&&words.includes('没有自动评价独立画图、自由解释或长期掌握'));
    assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);assert.ok(!/MP\.\d|已经掌握|你已掌握|你独立画/.test(words));return words;
   };
   const observe=async(spec,correct,suffix,kind='native')=>{
    const before=await saved(spec.id),beforeModel=copy(before.models[spec.index]),control=page.locator('#actions [data-do="check"]');
    await reveal(control);await control.click();const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    assert.equal(attempts.length,(before.cases[spec.index]?.attempts?.length??0)+1);assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);assert.equal(new Set(attempts.map(item=>item.id)).size,attempts.length);
    assert.ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean');
    assert.equal(Tasks.inspect(taskFor(spec),beforeModel).correct,correct);
    assert.equal(await page.locator('#check-feedback').getAttribute('data-state'),correct?'correct':'revise');
    let proof=null,words=null;
    if(kind==='native'){
     proof=correct?proofFor(spec,beforeModel):replayMixedAxisEvidence(taskFor(spec),beforeModel);
     if(correct)words=await wordsFor(spec,proof);else{assert.equal(proof,null);assert.equal(await hint.count(),0);}
    }else if(kind==='associated'){assert.equal(mixedAxisBinding(taskFor(spec),ctx(spec)),null);assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);}
    if(kind!=='prerequisite')await visual(spec,beforeModel);
    const stored=await snapshot(suffix),png=await shot(suffix),file=label+'-'+suffix+'.json';
    const result={kind,id:spec.id,index:spec.index,name:suffix,correct,taskHash:hash(taskFor(spec)),model:beforeModel,record:after,attempt,proof,words,
     rawStorage:stored.raw,stateFile:stored.stateFile,screenshot:png,originStopped:!server.listening};
    fs.writeFileSync(path.join(out,file),JSON.stringify(result,null,2));ok(true,label+' '+suffix+' archives real check, full history, storage and image');return{...result,file};
   };
   const advance=async(id,from)=>{
    const before=await saved(id),next=page.locator('#actions [data-do="next"]');assert.equal(before.index,from);assert.equal(await next.count(),1);
    await next.click();await wait(page,{id,index:from+1});const after=await saved(id);
    assert.deepEqual(after.cases,before.cases);for(const [index,value]of Object.entries(before.models))assert.deepEqual(after.models[index],value);
    navigation.push({width,height,id,from,to:from+1,actualNext:true,seededLessonPosition:false});
   };
   const open=async spec=>{
    const active=await page.evaluate(()=>window.mathLesson?.snapshot()?.id||null);
    if(active!==spec.id){
     const beforeUrl=new URL(page.url()),targetUrl=new URL(base+'learn.html#'+spec.id);
     const response=await page.goto(targetUrl.href);await wait(page,{id:spec.id,index:0});
     // A same-document hash navigation has no Document Response. Its actual
     // lesson readiness is still required; every offline reload below still
     // requires a real response from the Service Worker.
     if(response){if(!server.listening)assert.equal(response.fromServiceWorker(),true);}
     else{assert.equal(beforeUrl.origin+beforeUrl.pathname+beforeUrl.search,targetUrl.origin+targetUrl.pathname+targetUrl.search);
      assert.notEqual(beforeUrl.hash,targetUrl.hash);}
     ok(true,label+' course navigation reaches the real first task',{id:spec.id,index:0,originStopped:!server.listening,
      navigationMode:response?'document':'hash',fromServiceWorker:response?response.fromServiceWorker():null});
    }
    let current=(await saved(spec.id)).index;
    while(current<spec.index){
     const record=await saved(spec.id);
     if(!record.cases[current]?.attempts?.length){
      const prep=prerequisites[spec.id+':'+current];assert.ok(prep,label+' fixed navigation prerequisite');assert.deepEqual(taskFor(prep),prep.task);
      assert.deepEqual(record.models[current],Tasks.defaultModel(prep.task));await runSteps(prep,prep.steps);
      preparations.push({width,height,...await observe(prep,true,'navigation-prerequisite-'+current,'prerequisite'),additionalNativeCoverage:false});
     }else assert.equal(Tasks.inspect(sessionTasks(spec.id)[current],record.models[current]).correct,true);
     await advance(spec.id,current);current++;
    }
    assert.equal(current,spec.index);assert.deepEqual(await model(spec),M.initial(taskFor(spec)));
    assert.equal((await saved(spec.id)).cases[spec.index],undefined);
   };

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;await open(spec);assert.equal(mixedAxisBinding(taskFor(spec),ctx(spec))?.nodeId,spec.nodeId);
    assert.equal(mixedAxisBinding(taskFor(spec),ctx(spec)).method,null);assert.equal(await hint.count(),0);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),label+' optional source question starts collapsed');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();assert.equal(await guide.locator('p').isVisible(),true);
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support)break;await page.waitForTimeout(50);}
    assert.deepEqual(afterGuide.models,beforeGuide.models);assert.equal(afterGuide.cases[spec.index]?.support,true);await guide.locator('summary').click();
    const snapshots=[];await runSteps(spec,firstWrongSteps(spec));const wrong=await model(spec);
    assert.deepEqual(wrong.board.first,{index:0,position:spec.task.min});assert.equal(wrong.history[0].action,'place');
    assert.equal(wrong.history[0].data.fields.position,'.75');assert.equal(wrong.board.placements[0],spec.task.min);
    if(spec.expected.statements.length){assert.equal(wrong.board.symbols.length,0);assert.equal(wrong.relation,'≤');assert.ok(wrong.issue);}
    snapshots.push(await observe(spec,false,'01-wrong-applied-position'));
    await runSteps(spec,correctionSteps(spec));assert.equal(await hint.count(),0);
    snapshots.push(await observe(spec,true,'02-correct-applied-work'));const completed=await model(spec),completedProof=proofFor(spec,completed),oldCases=copy((await saved(spec.id)).cases);
    assert.equal(completedProof.firstPlacement.matchesCard,false);assert.equal(completedProof.currentRoundFirstPlacement.matchesCard,false);
    assert.equal(completedProof.failedRequests.filter(event=>event.action==='place').length,1);
    assert.equal(completedProof.failedRequests.filter(event=>event.action==='symbol').length,spec.expected.statements.length?1:0);
    if(server.listening){
     await reload(spec,'online-checked-work');assert.equal(server.listening,true);await wordsFor(spec,completedProof);
     await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
     for(const report of warmed)report.originStopped=!server.listening;
     ok(!server.listening,prefix+' healthy cached origin stops before all remaining work');
     await reload(spec,'first-stopped-origin-checked-work');await wordsFor(spec,completedProof);
    }
    // These memory-only counterfactuals are never written into any browser.
    const hidden=copy(completed);hidden.answer='forged hidden answer';const extraData=copy(completed);
    extraData.history.find(event=>event.action==='place').data.index='0';
    const probes=[['hidden-field',hidden],['unrendered-place-data',extraData]];
    if(spec.expected.statements.length){const hiddenRelation=copy(completed);hiddenRelation.relation='';probes.push(['changed-hidden-retained-relation',hiddenRelation]);}
    for(const [kind,altered]of probes){assert.equal(M.inspect(spec.task,altered).correct,true);assert.equal(replayMixedAxisEvidence(spec.task,altered),null);
     counterfactuals.push({width,height,id:spec.id,index:spec.index,kind,memoryOnly:true,writtenToBrowser:false,originalCorrect:true,strictRejected:true,model:altered});}
    assert.deepEqual(await model(spec),completed);assert.deepEqual((await saved(spec.id)).cases,oldCases);

    await field(spec,'position',String(spec.task.max));const wrongDraft=await model(spec);
    assert.equal(M.inspect(spec.task,wrongDraft).correct,true);assert.equal(await hint.count(),0);assert.deepEqual((await saved(spec.id)).cases,oldCases);
    snapshots.push(await observe(spec,true,'03-unapplied-wrong-input'));assert.equal(snapshots.at(-1).proof.currentDraft.status,'different-from-card');
    await field(spec,'position','0x1');assert.equal(await hint.count(),0);
    snapshots.push(await observe(spec,true,'04-unapplied-invalid-input'));assert.equal(snapshots.at(-1).proof.currentDraft.status,'invalid-number');
    const beforeWithdrawal=await model(spec),withdrawn=await action(spec,'order',{index:beforeWithdrawal.board.ordered.at(-1)});
    assert.deepEqual(withdrawn.board.placements,beforeWithdrawal.board.placements);assert.equal(await hint.count(),0);
    snapshots.push(await observe(spec,false,'05-order-withdrawn'));
    await runSteps(spec,restoreOrderSteps(spec,withdrawn.board.ordered));assert.equal(await hint.count(),0);
    snapshots.push(await observe(spec,true,'06-order-restored'));assert.deepEqual(snapshots.at(-1).model.board.ordered,spec.expected.validOrders.at(-1));
    if(spec.expected.validOrders.length>1)assert.notDeepEqual(snapshots.at(-1).model.board.ordered,completed.board.ordered);
    const beforeReset=await model(spec),reset=await action(spec,'reset');
    assert.deepEqual(reset.board,{selected:0,placements:{},ordered:[],symbols:[],first:wrong.board.first});
    assert.deepEqual(reset.history.slice(0,-1),beforeReset.history);for(const key of Object.keys(M.fields))assert.equal(reset[key],beforeReset[key]);
    if(spec.expected.statements.length){assert.equal(reset.relation,'≥');assert.equal(await page.locator('[data-xfield="relation"]').inputValue(),'≥');}
    snapshots.push(await observe(spec,false,'07-reset-current-work'));await reload(spec,'stopped-origin-reset');assert.equal(await hint.count(),0);
    await runSteps(spec,completeSteps(spec,{reverse:width===1280,alternate:true}));assert.equal(await hint.count(),0);
    snapshots.push(await observe(spec,true,'08-rebuilt-current-work'));const finalRecord=await saved(spec.id),finalModel=finalRecord.models[spec.index],finalProof=proofFor(spec,finalModel);
    assert.equal(finalProof.firstPlacement.matchesCard,false);assert.equal(finalProof.currentRoundFirstPlacement.matchesCard,true);assert.equal(finalProof.resets.length,1);
    assert.ok(finalProof.currentRoundFirstPlacement.historyIndex>finalProof.resets[0].historyIndex);assert.deepEqual(finalModel.history.slice(0,reset.history.length),reset.history);
    assert.deepEqual(snapshots.map(item=>item.correct),[false,true,true,true,false,true,false,true]);
    assert.deepEqual(finalRecord.cases[spec.index].attempts,snapshots.map(item=>item.attempt));
    await reload(spec,'stopped-origin-final-work');await wordsFor(spec,finalProof);await visual(spec,finalModel);
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' has no horizontal overflow');
    const finalStorage=await snapshot('final-reloaded');await shot('final-reloaded');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task:spec.task,snapshots,
     finalModel,finalProof,record:finalRecord,finalRawStorage:finalStorage.raw,finalStateFile:finalStorage.stateFile});
   }
   for(const spec of bridges){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;const nativeBefore=copy((await state()).lessons);await open(spec);
    assert.equal(mixedAxisBinding(spec.task,ctx(spec)),null);assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);
    await runSteps(spec,completeSteps(spec,{reverse:width===1280,alternate:true}));
    const checked=await observe(spec,true,'associated-original-check','associated');
    assert.deepEqual(checked.model.board.ordered,spec.expected.validOrders.at(-1));
    for(const [index,expected]of spec.expected.cardValues.entries())assert.equal(checked.model.board.placements[index],expected[0]/expected[1]);
    assert.deepEqual((await state()).lessons,nativeBefore);await reload(spec,'stopped-origin-associated-work');
    assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);
    assert.deepEqual((await state()).lessons,nativeBefore);assert.equal(await hint.count(),0);assert.equal(await guide.count(),0);
    const stored=await snapshot('associated-reloaded');await shot('associated-reloaded');
    isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,task:spec.task,checked,rawStorage:stored.raw,stateFile:stored.stateFile});
   }
   label=prefix+'-actual-v2-backup';await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   await page.locator('#main [data-do="export"]').first().waitFor();
   const download=page.waitForEvent('download');await page.locator('[data-do="export"]').first().click();const exported=await download;
   const backupPath=path.join(out,label+'.json');await exported.saveAs(backupPath);const payload=fs.readFileSync(backupPath,'utf8'),backup=JSON.parse(payload);
   assert.equal(backup.version,2);assert.deepEqual(backup.state,await state());originalState(backup.state);
   for(const spec of cases){const record=backup.state.lessons[spec.id];assert.equal(record.cases[spec.index].attempts.length,8);proofFor(spec,record.models[spec.index]);}
   for(const spec of bridges)assert.equal(backup.state.daily.bridges[spec.id].cases[spec.index].attempts.length,1);
   for(const prep of Object.values(prerequisites))assert.equal((backup.state.lessons[prep.id]||backup.state.daily.bridges[prep.id]).cases[prep.index].attempts.length,1);
   await shot('exported');activePage=restorePage;
   const targetResponse=await restorePage.reload();await restorePage.locator('#import-file').waitFor({state:'attached'});
   await restorePage.locator('#main [data-do="export"]').first().waitFor();assert.equal(targetResponse?.fromServiceWorker(),true);
   const empty=originalState(JSON.parse((await readPage(restorePage)).text));assert.deepEqual(empty.lessons,{});assert.deepEqual(empty.daily.bridges,{});
   const importFile=async filename=>{
    await restorePage.locator('#import-file').setInputFiles({name:filename,mimeType:'application/json',buffer:Buffer.from(payload)});
    await restorePage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    assert.ok((await restorePage.locator('#toast').innerText()).includes('备份已合并'));
   };
   await importFile('mixedaxis-real-browser-v2.json');const restored=await readPage(restorePage);
   const firstImportRaw=rawFile(label+'-first-import-storage.txt',restored.raw),restoredState=originalState(JSON.parse(restored.text));
   assert.deepEqual(restoredState,backup.state);provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   for(const spec of cases){const record=restoredState.lessons[spec.id];proofFor(spec,record.models[spec.index]);
    assert.deepEqual(record.cases[spec.index].attempts,backup.state.lessons[spec.id].cases[spec.index].attempts);
    for(const attempt of record.cases[spec.index].attempts)assert.equal(Tasks.validModel(spec.task,attempt.value),true);}
   await importFile('mixedaxis-identical-repeat-v2.json');const repeated=await readPage(restorePage);
   const repeatedImportRaw=rawFile(label+'-repeated-import-storage.txt',repeated.raw);
   assert.equal(repeated.raw,restored.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);provenance.backupImportsCompleted++;
   const restoredSpec=cases.at(-1),response=await restorePage.goto(base+'learn.html#'+restoredSpec.id);await wait(restorePage,restoredSpec);
   assert.equal(response?.fromServiceWorker(),true);assert.equal(await restorePage.locator('#thinking-feedback').isVisible(),true);
   const afterOpen=JSON.parse((await readPage(restorePage)).text);
   assert.deepEqual(afterOpen.lessons[restoredSpec.id].models,backup.state.lessons[restoredSpec.id].models);
   assert.deepEqual(afterOpen.lessons[restoredSpec.id].cases,backup.state.lessons[restoredSpec.id].cases);
   const restoredStorage=await snapshot('restored',restorePage);await shot('restored',restorePage);
   backups.push({width,height,file:path.basename(backupPath),bytes:Buffer.byteLength(payload),sha256:digest(payload),
    originalState:backup.state,restoredState,firstImportRaw,repeatedImportRaw,finalRawStorage:restoredStorage.raw,
    independentEmptyContext:true,originStopped:!server.listening,nativeCases:cases.length,associatedCases:bridges.length,
    navigationPrerequisites:Object.keys(prerequisites).length,importsCompleted:2,idempotent:true,
    limit:'Fresh empty-target restoration and repeated import; this does not replace conflicting-draft P10 merge checks.'});
   await context.close();contexts.delete(context);await restoreContext.close();contexts.delete(restoreContext);activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  assert.equal(observations.length,16);assert.equal(isolated.length,20);assert.equal(preparations.length,12);assert.equal(backups.length,2);
  assert.equal(provenance.backupImportsCompleted,4);
  const attemptCounts={native:observations.reduce((total,item)=>total+item.snapshots.length,0),associated:isolated.length,navigationPrerequisites:preparations.length};
  assert.deepEqual(attemptCounts,{native:128,associated:20,navigationPrerequisites:12});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:'success',checks,errors,remote,observations,preparations,isolated,
   offline,backups,navigation,counterfactuals,viewports,provenance,attemptCounts},null,2));
  console.log('P9_MIXEDAXIS_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,
   backups:backups.length,navigationPrerequisites:preparations.length,attemptCounts}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  if(activePage&&diagnostics.has(activePage))failureDiagnostic=await diagnostics.get(activePage).dump(error).catch(failure=>({diagnosticError:String(failure)}));
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:'failure',checks,errors,remote,observations,preparations,isolated,
   offline,backups,navigation,counterfactuals,viewports,provenance,failureDiagnostic,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  for(const context of contexts)await context.close();if(browser)await browser.close();
 }
}

module.exports={coordinateOracle,placeSteps,orderSteps,comparisonSteps,completeSteps,firstWrongSteps,correctionSteps,restoreOrderSteps,prerequisites};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
