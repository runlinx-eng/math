// Real source-bound quotient/remainder inputs and preserved prediction changes.
// Every model/check comes from visible controls and actual Next navigation.
// No lesson position, answer, model, history or checked attempt is seeded.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-decimalengine-cases.cjs'),{cases,bridges,practices}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-decimalengine-adapter');
const viewports=[[1440,900],[1280,720]],copy=structuredClone;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),name=([n,d])=>d===1?String(n):n+'/'+d;
const fieldStep=(field,value)=>({field,value:String(value)}),actionStep=(action,data={})=>({action,data});
const expectedFor=spec=>{
 if(spec.expected)return spec.expected;
 // Only reuse an independently fixed mathematical expectation after matching
 // the entire task; this never grants a bridge the native source binding.
 const original=cases.find(candidate=>candidate.taskHash===spec.taskHash);assert.ok(original);
 assert.deepEqual(original.task,spec.task);return original.expected;
};
const exactQuantity=(n,d=1n)=>{let a=n<0n?-n:n,b=d;while(b)[a,b]=[b,a%b];return[Number(n/a),Number(d/a)];};
const wrongReduction=spec=>{
 const e=expectedFor(spec);return same(e.simple,[spec.task.n,spec.task.d])?
  (e.simple[0]*2)+'/'+(e.simple[1]*2):spec.task.n+'/'+spec.task.d;
};
const reductionSteps=(spec,raw=expectedFor(spec).simple.join('/'))=>[fieldStep('fraction',raw),actionStep('b17-reduce')];
function factorSteps(spec,{reverse=false,numberForms=false,width=1440}={}){
 const e=expectedFor(spec),factors=reverse?e.factorOrders.at(-1):e.factorOrders[0];
 return factors.flatMap(value=>[fieldStep('factor',numberForms?(width===1280?'0x'+value.toString(16):value===2?'2.0000000000000001':value+'e0'):value),actionStep('b17-factor')]);
}
const predictionSteps=(spec,wrong=false)=>[fieldStep('kind',wrong?(expectedFor(spec).kind==='stop'?'repeat':'stop'):expectedFor(spec).kind),actionStep('b17-predict-stop')];
function divisionSteps(spec,{numberForms=false,width=1440}={}){
 return expectedFor(spec).rows.flatMap((row,index)=>[
  fieldStep('q',numberForms?(index===0?(width===1440?'1e-999':'  '):row.quotient+'e0'):row.quotient),
  fieldStep('remainder',numberForms?(row.remainder===0?(width===1440?'  ':'0x0'):row.remainder+'e0'):row.remainder),actionStep('b17-digit')]);
}
const answerSteps=(spec,raw=expectedFor(spec).answer)=>[fieldStep('answer',raw),fieldStep('reason','base-ten')];
const wrongAnswer=spec=>{const e=expectedFor(spec);return e.kind==='stop'?e.answer+'1':'0.'+e.nonrepeatingDigits+e.repeatingDigits;};
function completeSteps(spec,{reverse=false,numberForms=false,toolNormalized=false,width=1440}={}){
 const e=expectedFor(spec),raw=toolNormalized&&e.kind==='stop'?(spec.task.n===6&&spec.task.d===15?'40%':e.answer):e.simple.join('/');
 return[...reductionSteps(spec,raw),...factorSteps(spec,{reverse,numberForms,width}),...predictionSteps(spec),
  ...divisionSteps(spec,{numberForms,width}),...answerSteps(spec)];
}
const renameSteps=(original,simple,factor,decimal)=>[
 fieldStep('fraction',original),actionStep('b17-open-decimal'),fieldStep('factor',factor),actionStep('b17-merge'),
 fieldStep('fraction',simple),actionStep('b17-remember'),fieldStep('reason','recut'),fieldStep('decimal',decimal)
];
// Five fixed original prerequisites make every target reachable with real
// Next clicks. These checks add no native coverage to the decimalengine family.
const prerequisites={
 'fdpswitch:1':{id:'fdpswitch',index:1,
  task:{type:'x-fdprecall',prompt:'先不看图，给1/5、1/4、1/10分别写出小数与百分数名字。',cases:[[1,5],[1,4],[1,10]]},
  steps:[['0.2','20'],['0.25','25'],['0.1','10']].flatMap(([decimal,percent])=>[
   fieldStep('decimal',decimal),fieldStep('percent',percent),actionStep('b17-recall')])},
 'fdpswitch:2':{id:'fdpswitch',index:2,
  task:{type:'x-fracorder',cards:['30%','1/3','0.35'],prompt:'在同一条线上比较三个名字。1/3的位置要保留精确分数，不写成0.3。',max:1},
  steps:[...[0,1,2].map(index=>actionStep('b17-card',{index})),actionStep('b17-predict'),
   ...[[3,'0.3'],[1,'1/3'],[7,'0.35']].flatMap(([count,position],row)=>[
    ...Array.from({length:count},(_,index)=>actionStep('b17-shade',{row,index})),actionStep('b17-select',{index:row}),
    fieldStep('position',position),actionStep('b17-place')]),...[0,1,2].map(index=>actionStep('b17-order',{index}))]},
 'decimalstops:0':{id:'decimalstops',index:0,
  task:{type:'x-fracrename',n:375,d:1000,prompt:'0.375的最后一位在数哪一种小份？先写分数，再合到最简。',decimalStart:'0.375',targets:[[3,8]],simple:true,decimal:true},
  steps:renameSteps('375/1000','3/8','125','0.375')},
 'decimalstops:1':{id:'decimalstops',index:1,
  task:{type:'x-fracrename',n:35,d:100,prompt:'把0.35也从位置写成分数，再合到最简。',decimalStart:'0.35',targets:[[7,20]],simple:true,decimal:true},
  steps:renameSteps('35/100','7/20','5','0.35')},
 'link-sharewholes-fdpswitch:0':{id:'link-sharewholes-fdpswitch',index:0,
  task:{type:'x-wholeshare',wholes:3,people:4,prompt:'3个面包平均分4人，不够每人一整个，继续切小来公平分。'},
  steps:[actionStep('b16-cut-wholes'),...[0,1,2,3].flatMap(person=>[actionStep('b16-person',{index:person}),
   ...[person,person+4,person+8].map(index=>actionStep('b16-share-piece',{index}))]),
   fieldStep('whole','0'),fieldStep('remainder','3/4'),fieldStep('answer','3/4'),fieldStep('equation','3÷4=3/4'),fieldStep('total','(3/4)*4=3')]}
};
const expectedAttemptResults=[false,false,false,false,false,true,false,true,false,true];

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const checks=[],errors=[],remote=[],observations=[],preparations=[],isolated=[],offline=[],backups=[],navigation=[],counterfactuals=[];
 const ok=(condition,label,details={})=>{assert.ok(condition,label);checks.push({label,...details});};
 const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
  githubSha:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,
  workflow:process.env.GITHUB_WORKFLOW||null,sourceHashes:fixture.sourceHashes,
  adapterSha256:digest(fs.readFileSync(path.join(root,'dist/learning/decimalengine-evidence.js'))),
  browserScriptSha256:digest(fs.readFileSync(__filename)),childTrial:false,independentTeachingReview:false,
  seededCorrectWork:false,seededLessonPosition:false,realBrowserBackupImport:false,backupImportsCompleted:0};
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b17-model.js'),Tasks=await import('../dist/learning/tasks.js'),Engine=await import('../dist/learning/phase4/engine.js');
 const Core=await import('../dist/exploration-core.js'),atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const {decimalEngineBinding,replayDecimalEngineEvidence}=await import('../dist/learning/decimalengine-evidence.js');
 const originalState=value=>{assert.deepEqual(Core.validate(value,atlas),value);return value;};
 const taskFor=spec=>sessionTasks(spec.id)[spec.index],ctx=spec=>({sessionId:spec.id,index:spec.index});
 assert.equal(cases.length,6);assert.equal(bridges.length,3);assert.equal(practices.length,1);
 for(const spec of [...cases,...bridges]){assert.equal(hash(taskFor(spec)),spec.taskHash);assert.deepEqual(taskFor(spec),spec.task);}
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 for(const spec of practices){assert.deepEqual(Tasks.PRACTICE[spec.id],spec.task);assert.equal(hash(spec.task),spec.taskHash);assert.equal(decimalEngineBinding(spec.task,ctx(spec)),null);}
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
       'learning/decimalengine-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
       'learning/state.js','learning/tasks.js','learning/phase5/b16.js','learning/phase5/b16-model.js','learning/phase5/b16-view.js',
       'learning/phase5/b17.js','learning/phase5/b17-model.js','learning/phase5/b17-view.js',
       'learning/phase4/async-batches.js']
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
    const full=/^(?:b\d+|m\d+)-/.test(name)?name:'b17-'+name,control=page.locator(`[data-x="${full}"]${selector}`);
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
    const task=taskFor(spec),b=current.board,fields=!b.simple?['fraction']:b.factorLeft>1?['factor']:!b.prediction?['kind']:!b.stop?['q','remainder']:['kind','answer','reason'];
    assert.deepEqual((await page.locator('[data-xfield]').evaluateAll(elements=>elements.map(element=>element.dataset.xfield))).sort(),[...fields].sort());
    for(const key of fields)assert.equal(await page.locator(`[data-xfield="${key}"]`).inputValue(),current[key]);
    const actions=!b.simple?['b17-reduce','b17-reset']:b.factorLeft>1?['b17-factor','b17-reset']:!b.prediction||b.stop?['b17-predict-stop','b17-reset']:['b17-digit','b17-reset'];
    assert.deepEqual((await page.locator('#extra-controls [data-x]').evaluateAll(elements=>elements.map(element=>element.dataset.x))).sort(),actions.sort());
    assert.equal(await page.locator('.b17-number').innerText(),task.n+' ÷ '+task.d);
    assert.equal(await page.locator('.b17-factors').count(),b.simple?1:0);
    if(b.simple){const words=await page.locator('.b17-factors').innerText();assert.ok(words.includes(b.simple.join('/'))&&words.includes('整个的份数：'));
     for(const factor of b.factors)assert.ok(words.includes(String(factor)));}
    const renderedRows=await page.locator('.b17-division tbody tr').evaluateAll(rows=>rows.map(row=>[...row.cells].map(cell=>cell.textContent)));
    assert.deepEqual(renderedRows,b.rows.map((row,index)=>{
     const unit=index===0?'1':'1/'+10**index;return[row.input+' 个 '+unit,(index===0?'整数位：':'小数第'+index+'位：')+row.q,row.rem+' 个 '+unit];
    }));
    assert.equal(await page.locator('.b17-note').count(),b.stop?1:0);
    if(b.stop)assert.equal(await page.locator('.b17-note').innerText(),b.cycle===null?'余下0，这次分完了。':'这个余数已经出现过，后面的分法会重复。');
    assert.equal(await page.locator('.b17-issue').count(),current.issue?1:0);if(current.issue)assert.equal(await page.locator('.b17-issue').innerText(),current.issue);
   };
   const proofFor=(spec,current)=>{
    const task=taskFor(spec),e=expectedFor(spec),proof=replayDecimalEngineEvidence(task,current);assert.ok(proof);
    assert.equal(M.valid(task,current),true);assert.equal(M.inspect(task,current).correct,true);
    assert.deepEqual(proof.originalQuantity,[task.n,task.d]);assert.deepEqual(proof.value,e.simple);assert.deepEqual(proof.simple,e.simple);
    assert.deepEqual(proof.reduction.normalizedPair,e.simple);assert.equal(proof.reduction.raw,current.fraction);
    assert.equal(proof.factorization.denominator,e.simple[1]);assert.equal(proof.factorization.product,e.simple[1]);assert.equal(proof.factorization.residualDenominator,1);
    assert.deepEqual(proof.factorization.factors,current.board.factors);assert.ok(e.factorOrders.some(order=>same(order,proof.factorization.factors)));
    assert.equal(proof.factorization.onlyTwoAndFive,e.kind==='stop');
    for(const step of proof.factorization.steps){assert.equal(step.entered.raw,step.raw);assert.equal(step.entered.value,Number(step.raw));
     assert.equal(step.entered.numberSemantics,true);assert.equal(BigInt(step.before),BigInt(step.normalized)*BigInt(step.after));}
    assert.equal(proof.rows.length,e.rows.length);
    for(const [index,row]of proof.rows.entries()){
     const expected=e.rows[index],unit=10n**BigInt(index),n=BigInt(expected.input),q=BigInt(expected.quotient),r=BigInt(expected.remainder),d=BigInt(e.simple[1]);
     assert.equal(n,q*d+r);assert.ok(r>=0n&&r<d);assert.equal(row.index,index);assert.equal(row.input,expected.input);
     assert.equal(row.quotient,expected.quotient);assert.equal(row.remainder,expected.remainder);assert.deepEqual(row.unit,[1,Number(unit)]);
     assert.deepEqual(row.inputQuantity,exactQuantity(n,unit));assert.deepEqual(row.allocatedQuantity,exactQuantity(q*d,unit));
     assert.deepEqual(row.remainingQuantity,exactQuantity(r,unit));assert.deepEqual(row.shareIncrement,exactQuantity(q,unit));
     assert.equal(row.matchesRow,true);assert.equal(current.history[row.historyIndex].a,'digit');
     for(const [entered,key,value]of [[row.enteredQuotient,'q',expected.quotient],[row.enteredRemainder,'remainder',expected.remainder]]){
      assert.equal(entered.raw,current.history[row.historyIndex].f[key]);assert.equal(entered.value,value);assert.equal(entered.value,Number(entered.raw));
      assert.equal(entered.finite,true);assert.equal(entered.integer,true);assert.equal(entered.numberSemantics,true);
     }
    }
    for(const key of ['kind','integerDigits','nonrepeatingDigits','repeatingDigits','cycleIndex','cycleStartFractionalPlace','firstRepeatedRemainder'])assert.equal(proof.expansion[key],e[key]);
    assert.deepEqual(proof.expansion.exactValue,e.simple);assert.equal(proof.expansion.notation,e.integerDigits+'.'+e.nonrepeatingDigits+(e.kind==='repeat'?'('+e.repeatingDigits+')':''));
    if(e.kind==='repeat'){
     assert.equal(proof.expansion.repeatedRemainderFirstHistoryIndex,proof.rows[e.cycleIndex].historyIndex);
     assert.equal(proof.expansion.repeatedRemainderFinalHistoryIndex,proof.rows.at(-1).historyIndex);
     assert.equal(proof.answer.value,null);assert.equal(proof.answer.repeatingDigits,e.repeatingDigits);
    }else assert.deepEqual(proof.answer.value,e.simple);
    assert.equal(proof.answer.raw,current.answer);assert.equal(proof.answer.matchesExpansion,true);assert.equal(proof.answer.submissionOnly,true);
    assert.equal(proof.currentPrediction.raw,current.kind);assert.equal(proof.currentPrediction.matchesCommitted,true);assert.equal(proof.currentPrediction.matchesExpected,true);
    assert.equal(proof.reasonChoice.raw,'base-ten');assert.equal(proof.reasonChoice.fixedChoice,true);assert.equal(proof.reasonChoice.openExplanationAssessed,false);
    assert.equal(proof.eventCount,current.history.length);assert.equal(proof.events.length,current.history.length);assert.equal(proof.issue,current.issue);
    assert.deepEqual(proof.finalConstruction,current.board);
    for(const [index,event]of proof.events.entries()){
     assert.equal(event.historyIndex,index);assert.equal(event.action,current.history[index].a);
     assert.deepEqual(event.fields,Object.fromEntries(['fraction','factor','kind','q','remainder','answer','reason'].map(key=>[key,current.history[index].f[key]])));
     if(index)assert.deepEqual(event.before,proof.events[index-1].after);
    }
    assert.deepEqual(proof.failedRequests,proof.events.filter(event=>!event.accepted));assert.deepEqual(proof.resets,proof.events.filter(event=>event.action==='reset'));
    const predictions=proof.events.filter(event=>event.action==='predict-stop'&&event.accepted),lastReset=proof.resets.at(-1)?.historyIndex??-1;
    assert.deepEqual(proof.firstPrediction,predictions[0].prediction);assert.equal(proof.firstPrediction.value,current.board.first);
    assert.deepEqual(proof.currentRoundFirstPrediction,predictions.find(event=>event.historyIndex>lastReset).prediction);
    assert.deepEqual(proof.finalPrediction,predictions.at(-1).prediction);
    for(const key of ['factorRemainder','nextRowInput','unitLabels','rowTable','repeatedRemainderDetection','cycleIndex','stopMessage'])assert.equal(proof.systemGenerated[key],true);
    assert.equal(proof.systemGenerated.reductionNormalization,proof.reduction.toolNormalized);
    assert.equal(proof.assessmentLimits.method,null);assert.equal(proof.assessmentLimits.recordingLimit,1500);assert.equal(proof.assessmentLimits.textLimit,500);
    for(const key of ['independentReductionAssessed','independentCycleDiscoveryAssessed','generalTerminationProofAssessed','independentLongDivisionLayoutAssessed',
     'openExplanationAssessed','physicalActionAssessed','authorshipAssessed','generalMasteryAssessed','exactRawIntegerSpellingAssessed','exactKeystrokeOrderKnown',
     'historyCompletenessAuthenticated','allLaterClicksRecorded'])assert.equal(proof.assessmentLimits[key],false);
    return proof;
   };
   const wordsFor=async(spec,proof)=>{
    ok(await hint.isVisible(),label+' bounded feedback matches the latest checked work');const words=await hint.innerText(),last=proof.rows.at(-1);
    assert.ok(words.includes(spec.task.n+'/'+spec.task.d+' = '+proof.expansion.notation));
    assert.ok(words.includes(last.input+' = '+last.quotient+' × '+proof.simple[1]+' + '+last.remainder));
    assert.ok(words.includes('下一行输入、单位、重复余数检测和循环提示由工具生成'));
    assert.ok(words.includes('没有自动评价独立约分、自由解释、一般证明或长期掌握'));
    assert.ok(words.includes('这个输入经过工具规范化')===proof.reduction.toolNormalized);
    if(proof.expansion.kind==='repeat')assert.ok(words.includes('重复段为 '+proof.expansion.repeatingDigits)&&words.includes('从小数第 '+proof.expansion.cycleStartFractionalPlace+' 位开始'));
    else assert.ok(words.includes('最后余数为0'));
    if(!proof.firstPrediction.matchesExpected)assert.ok(words.includes('原预测仍保留'));
    if(proof.failedRequests.length)assert.ok(words.includes('当时的输入和提示分别保留'));
    if(proof.resets.length)assert.ok(words.includes('本轮第一次实际留下的预测')&&words.includes('重做没有删除最早预测或旧操作'));
    assert.ok(words.includes('本次选择的固定选项')&&words.includes('独立解释需要另外观察'));
    assert.equal(await hint.locator('[data-thinking-node-id]').count(),0);assert.ok(!/MP\.\d|已经掌握|你已掌握|你独立发现/.test(words));return words;
   };
   const validateBackup=value=>{
    originalState(value);
    for(const spec of cases){const record=value.lessons[spec.id],attempts=record.cases[spec.index].attempts;
     assert.equal(attempts.length,expectedAttemptResults.length);proofFor(spec,record.models[spec.index]);
     attempts.forEach((attempt,index)=>{assert.equal(Tasks.validModel(spec.task,attempt.value),true);assert.equal(Tasks.inspect(spec.task,attempt.value).correct,expectedAttemptResults[index]);});
    }
    for(const spec of [...bridges,...Object.values(prerequisites)]){const record=value.lessons[spec.id]||value.daily.bridges[spec.id],attempts=record.cases[spec.index].attempts;
     assert.equal(attempts.length,1);assert.equal(Tasks.inspect(spec.task,record.models[spec.index]).correct,true);
     assert.equal(Tasks.validModel(spec.task,attempts[0].value),true);assert.equal(Tasks.inspect(spec.task,attempts[0].value).correct,true);
    }
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
     proof=correct?proofFor(spec,beforeModel):replayDecimalEngineEvidence(taskFor(spec),beforeModel);
     if(correct)words=await wordsFor(spec,proof);else{assert.equal(proof,null);assert.equal(await hint.count(),0);}
    }else if(kind==='associated'){assert.equal(decimalEngineBinding(taskFor(spec),ctx(spec)),null);assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);}
    if(kind!=='prerequisite')await visual(spec,beforeModel);
    const stored=await snapshot(suffix),png=await shot(suffix),file=label+'-'+suffix+'.json',bodyFile=label+'-'+suffix+'-body.txt';
    fs.writeFileSync(path.join(out,bodyFile),await page.locator('body').innerText());
    const result={kind,id:spec.id,index:spec.index,name:suffix,correct,taskHash:hash(taskFor(spec)),model:beforeModel,record:after,attempt,proof,words,
     rawStorage:stored.raw,stateFile:stored.stateFile,bodyFile,issue:beforeModel.issue,screenshot:png,originStopped:!server.listening};
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
    if(active!==spec.id){const response=await page.goto(base+'learn.html#'+spec.id);await wait(page,{id:spec.id,index:0});
     // A new lesson on the same learn.html document is a real hash navigation
     // and has no Response. Only an actual document response can be from SW.
     if(!server.listening&&response)assert.equal(response.fromServiceWorker(),true);
     offline.push({width,height,id:spec.id,phase:'open-lesson',originStopped:!server.listening,
      navigationMode:response?'document':'hash',fromServiceWorker:response?response.fromServiceWorker():null});}
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
    const e=expectedFor(spec),reverse=width===1280;label=prefix+'-'+spec.id+'-'+spec.index;await open(spec);
    assert.equal(decimalEngineBinding(taskFor(spec),ctx(spec))?.nodeId,spec.nodeId);assert.equal(decimalEngineBinding(taskFor(spec),ctx(spec)).method,null);
    assert.equal(await hint.count(),0);ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),label+' optional source question starts collapsed');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();assert.equal(await guide.locator('p').isVisible(),true);
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support)break;await page.waitForTimeout(50);}
    assert.deepEqual(afterGuide.models,beforeGuide.models);assert.equal(afterGuide.cases[spec.index]?.support,true);await guide.locator('summary').click();
    const snapshots=[];await runSteps(spec,reductionSteps(spec,wrongReduction(spec)));const failedReduction=await model(spec);
    assert.equal(failedReduction.board.simple,null);assert.equal(failedReduction.board.first,null);assert.ok(failedReduction.issue);
    snapshots.push(await observe(spec,false,'01-wrong-reduction'));
    await runSteps(spec,reductionSteps(spec));const beforeFactor=await model(spec);await field(spec,'factor','4');await action(spec,'factor');
    const failedFactor=await model(spec);assert.deepEqual(failedFactor.board,beforeFactor.board);assert.ok(failedFactor.issue);
    snapshots.push(await observe(spec,false,'02-wrong-factor'));
    await runSteps(spec,factorSteps(spec,{reverse,numberForms:true,width}));await runSteps(spec,predictionSteps(spec,true));
    const wrongPrediction=await model(spec),first=e.kind==='stop'?'repeat':'stop';assert.equal(wrongPrediction.board.first,first);
    const firstRow=e.rows[0];await field(spec,'q',firstRow.quotient+1);await field(spec,'remainder',firstRow.remainder);await action(spec,'digit');
    assert.equal((await model(spec)).board.rows.length,0);await field(spec,'q',firstRow.quotient);await field(spec,'remainder',firstRow.remainder+1);await action(spec,'digit');
    assert.equal((await model(spec)).board.rows.length,0);assert.ok((await model(spec)).issue);
    snapshots.push(await observe(spec,false,'03-wrong-quotient-and-remainder'));
    await runSteps(spec,divisionSteps(spec,{numberForms:true,width}));await runSteps(spec,answerSteps(spec));
    const divided=await model(spec);assert.equal(divided.board.stop,true);assert.equal(divided.board.prediction,first);
    snapshots.push(await observe(spec,false,'04-complete-rows-wrong-prediction'));
    await field(spec,'kind',e.kind);assert.equal((await model(spec)).board.prediction,first);
    snapshots.push(await observe(spec,false,'05-kind-edit-without-commit'));
    await action(spec,'predict-stop');assert.equal(await hint.count(),0);
    snapshots.push(await observe(spec,true,'06-corrected-prediction'));const completed=await model(spec),completedProof=proofFor(spec,completed),oldCases=copy((await saved(spec.id)).cases);
    assert.equal(completedProof.firstPrediction.matchesExpected,false);assert.equal(completedProof.currentRoundFirstPrediction.matchesExpected,false);
    assert.equal(completedProof.failedRequests.length,4);assert.equal(completedProof.failedRequests.filter(event=>event.action==='digit').length,2);
    assert.equal(completedProof.rows[0].enteredQuotient.raw,width===1440?'1e-999':'  ');
    if(server.listening){
     await reload(spec,'online-checked-work');assert.equal(server.listening,true);await wordsFor(spec,completedProof);
     const healthy=await fetch(base+'learning/decimalengine-evidence.js',{signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await healthy.arrayBuffer());
     assert.equal(healthy.status,200);assert.equal(digest(bytes),provenance.adapterSha256);
     offline.push({width,height,phase:'healthy-origin-before-stop',status:healthy.status,bytes:bytes.length,sha256:digest(bytes)});
     await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});for(const report of warmed)report.originStopped=!server.listening;
     ok(!server.listening,prefix+' healthy fully cached origin stops before all remaining work');
     await reload(spec,'first-stopped-origin-checked-work');await wordsFor(spec,completedProof);
    }
    // Counterfactuals stay in Node memory. No invalid model is injected into
    // the browser or counted as a real child interaction.
    const hidden=copy(completed);hidden.factor='7';const data=copy(completed);data.history.find(event=>event.a==='digit').d={index:'0'};
    for(const [kind,altered]of [['changed-hidden-factor',hidden],['unrendered-action-data',data]]){
     assert.equal(M.valid(spec.task,altered),true);assert.equal(M.inspect(spec.task,altered).correct,true);assert.equal(replayDecimalEngineEvidence(spec.task,altered),null);
     counterfactuals.push({width,height,id:spec.id,index:spec.index,kind,memoryOnly:true,writtenToBrowser:false,originalCorrect:true,strictRejected:true,model:altered});
    }
    assert.deepEqual(await model(spec),completed);assert.deepEqual((await saved(spec.id)).cases,oldCases);
    await field(spec,'answer',wrongAnswer(spec));assert.equal(await hint.count(),0);assert.deepEqual((await saved(spec.id)).cases,oldCases);
    snapshots.push(await observe(spec,false,'07-wrong-current-answer'));
    await field(spec,'answer',e.kind==='stop'?e.simple.join('/'):e.answer);assert.equal(await hint.count(),0);
    snapshots.push(await observe(spec,true,'08-correct-current-recheck'));
    const beforeReset=await model(spec),reset=await action(spec,'reset'),initial=M.initial(spec.task).board;initial.first=first;
    assert.deepEqual(reset.board,initial);assert.deepEqual(reset.history.slice(0,-1),beforeReset.history);
    for(const key of Object.keys(M.fields))assert.equal(reset[key],beforeReset[key]);
    snapshots.push(await observe(spec,false,'09-reset-current-work'));await reload(spec,'stopped-origin-reset');assert.equal(await hint.count(),0);
    await runSteps(spec,completeSteps(spec,{reverse:!reverse,toolNormalized:true,width}));assert.equal(await hint.count(),0);
    snapshots.push(await observe(spec,true,'10-rebuilt-current-work'));const finalRecord=await saved(spec.id),finalModel=finalRecord.models[spec.index],finalProof=proofFor(spec,finalModel);
    assert.equal(finalProof.firstPrediction.matchesExpected,false);assert.equal(finalProof.currentRoundFirstPrediction.matchesExpected,true);assert.equal(finalProof.resets.length,1);
    assert.equal(finalProof.failedRequests.length,4);assert.ok(finalProof.currentRoundFirstPrediction.historyIndex>finalProof.resets[0].historyIndex);
    assert.deepEqual(finalModel.history.slice(0,reset.history.length),reset.history);
    if(e.factorOrders.length>1)assert.notDeepEqual(finalProof.factorization.factors,completedProof.factorization.factors);
    assert.equal(finalProof.reduction.toolNormalized,e.kind==='stop');assert.deepEqual(snapshots.map(item=>item.correct),expectedAttemptResults);
    assert.deepEqual(finalRecord.cases[spec.index].attempts,snapshots.map(item=>item.attempt));
    await reload(spec,'stopped-origin-final-work');await wordsFor(spec,finalProof);await visual(spec,finalModel);
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' has no horizontal overflow');
    const finalStorage=await snapshot('final-reloaded');await shot('final-reloaded');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task:spec.task,snapshots,
     finalModel,finalProof,record:finalRecord,finalRawStorage:finalStorage.raw,finalStateFile:finalStorage.stateFile});
   }
   for(const spec of bridges){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;const nativeBefore=copy((await state()).lessons);await open(spec);
    assert.equal(decimalEngineBinding(spec.task,ctx(spec)),null);assert.equal(await guide.count(),0);assert.equal(await hint.count(),0);
    await runSteps(spec,completeSteps(spec,{reverse:width===1280}));const checked=await observe(spec,true,'associated-original-check','associated');
    assert.deepEqual(checked.model.board.simple,expectedFor(spec).simple);assert.deepEqual(checked.model.board.rows,expectedFor(spec).rows.map(row=>({input:row.input,q:row.quotient,rem:row.remainder})));
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
   assert.equal(backup.version,2);assert.deepEqual(backup.state,await state());validateBackup(backup.state);
   for(const spec of cases){const record=backup.state.lessons[spec.id];assert.equal(record.cases[spec.index].attempts.length,10);proofFor(spec,record.models[spec.index]);}
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
   await importFile('decimalengine-real-browser-v2.json');const restored=await readPage(restorePage);
   const firstImportRaw=rawFile(label+'-first-import-storage.txt',restored.raw),restoredState=originalState(JSON.parse(restored.text));
   assert.deepEqual(restoredState,backup.state);validateBackup(restoredState);provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   for(const spec of cases){const record=restoredState.lessons[spec.id];proofFor(spec,record.models[spec.index]);
    assert.deepEqual(record.cases[spec.index].attempts,backup.state.lessons[spec.id].cases[spec.index].attempts);
    for(const attempt of record.cases[spec.index].attempts)assert.equal(Tasks.validModel(spec.task,attempt.value),true);}
   await importFile('decimalengine-identical-repeat-v2.json');const repeated=await readPage(restorePage);
   const repeatedImportRaw=rawFile(label+'-repeated-import-storage.txt',repeated.raw);
   assert.equal(repeated.raw,restored.raw);assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);validateBackup(JSON.parse(repeated.text));provenance.backupImportsCompleted++;
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
  assert.equal(observations.length,12);assert.equal(isolated.length,6);assert.equal(preparations.length,10);assert.equal(backups.length,2);
  assert.equal(provenance.backupImportsCompleted,4);assert.equal(navigation.length,20);
  const attemptCounts={native:observations.reduce((total,item)=>total+item.snapshots.length,0),associated:isolated.length,navigationPrerequisites:preparations.length};
  assert.deepEqual(attemptCounts,{native:120,associated:6,navigationPrerequisites:10});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:'success',checks,errors,remote,observations,preparations,isolated,
   offline,backups,navigation,counterfactuals,viewports,provenance,attemptCounts},null,2));
  console.log('P9_DECIMALENGINE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,
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

module.exports={expectedFor,exactQuantity,wrongReduction,reductionSteps,factorSteps,predictionSteps,divisionSteps,answerSteps,wrongAnswer,completeSteps,prerequisites,expectedAttemptResults};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
