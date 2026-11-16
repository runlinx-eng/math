// Real fraction decompositions, saved-form goals and separately assessed drafts.
// All work and checked snapshots are created through visible controls and Next.
// No correct model, lesson position, answer, history or localStorage is seeded.
// Fixed mathematical plans below are independent of production solveSteps/example.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-fracdecompose-cases.cjs'),{cases,bridges,practices}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-fracdecompose-adapter');
const viewports=[[1440,900],[1280,720]];
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const rational=(n,d=1)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n,d);return[Number(n/g),Number(d/g)];};
const add=(a,b)=>rational(BigInt(a[0])*BigInt(b[1])+BigInt(b[0])*BigInt(a[1]),BigInt(a[1])*BigInt(b[1]));
const name=([n,d])=>d===1?String(n):n+'/'+d,canonical=parts=>[...parts].sort((a,b)=>a-b);
const partsFor=(task,cuts)=>{const ends=[0,...cuts,task.n];return ends.slice(1).map((end,index)=>end-ends[index]);};
const setField=(model,key,value)=>{const names=key.split('.'),last=names.pop();let target=model;for(const item of names)target=target[item];target[last]=value;};
const planByQuantity={
 '3/8':{
  partial:{parts:[1,2],equation:'3/8=1/8+1/4',wrong:'3/8=1/8+1/8+1/8'},
  duplicatePartial:{parts:[2,1],equation:'3/8=1/4+1/8'},
  completion:{parts:[1,1,1],equation:'3/8=12.5%+1/8+0.125'},
  wrongDraft:'37.5%=12.5%+1/8+0.125',
  duplicateCompleted:{parts:[1,1,1],equation:'3/8=0.125+1/8+12.5%'},
  rebuild:[{parts:[1,1,1],equation:'3/8=1/8+1/8+1/8'},{parts:[2,1],equation:'3/8=1/4+1/8'}]
 },
 '5/6':{
  partial:{parts:[1,4],equation:'5/6=1/6+2/3',wrong:'5/6=1/3+1/2'},
  duplicatePartial:{parts:[4,1],equation:'5/6=2/3+1/6'},
  completion:{parts:[2,3],equation:'5/6=1/3+1/2'},
  wrongDraft:'5/6=1/6+2/3',
  duplicateCompleted:{parts:[3,2],equation:'5/6=1/2+1/3'},
  rebuild:[{parts:[1,4],equation:'5/6=1/6+2/3'},{parts:[3,2],equation:'5/6=1/2+1/3'}]
 },
 '17/8':{
  partial:{parts:[9,8],equation:'17/8=9/8+1',wrong:'17/8=1+1+1/8'},
  duplicatePartial:{parts:[8,9],equation:'17/8=1+9/8'},
  completion:{parts:[8,8,1],equation:'17/8=1+1+1/8'},
  wrongDraft:'17/8=9/8+1',
  duplicateCompleted:{parts:[1,8,8],equation:'17/8=1/8+1+1'},
  rebuild:[{parts:[8,8,1],equation:'17/8=1+1+1/8'}]
 }
};
const scenarioFor=task=>{assert.equal(task.type,'x-fracdecompose');const result=planByQuantity[task.n+'/'+task.d];assert.ok(result);return result;};
function groupSteps(task,parts){
 assert.ok(parts.length>1&&parts.every(n=>Number.isInteger(n)&&n>0));assert.equal(parts.reduce((a,b)=>a+b,0),task.n);
 let boundary=0;return[{action:'b18-new-groups',data:{}},...parts.slice(0,-1).map(part=>({action:'b18-cut',data:{index:boundary+=part}}))];
}
function decompositionSteps(task,plan){return[...groupSteps(task,plan.parts),{field:'equation',value:plan.equation},{action:'b18-save',data:{}}];}
const rebuildSteps=task=>scenarioFor(task).rebuild.flatMap(plan=>decompositionSteps(task,plan));
// The exact constants are test-owned quantities, including B17's percentage
// spelling on the right. This is deliberately not a general production parser.
const writtenValues={'0':[0,1],'1':[1,1],'1/8':[1,8],'1/4':[1,4],'1/6':[1,6],'2/3':[2,3],
 '1/3':[1,3],'1/2':[1,2],'9/8':[9,8],'12.5%':[1,8],'0.125':[1,8],'3/8':[3,8],'5/6':[5,6],'17/8':[17,8]};
function equationOracle(task,raw,parts){
 const sides=raw.trim().split('='),left=sides.length===2?writtenValues[sides[0].trim()]||null:null,
  terms=sides.length===2?sides[1].split('+').map(term=>({raw:term,value:writtenValues[term.trim()]||null})):[],
  syntaxValid=!!left&&terms.length>0&&terms.every(term=>term.value),sum=terms.length&&terms.every(term=>term.value)?terms.reduce((sum,term)=>add(sum,term.value),[0,1]):null,
  pieces=terms.map(term=>term.value&&term.value[0]>0&&Number.isInteger(term.value[0]*task.d/term.value[1])?term.value[0]*task.d/term.value[1]:null),
  matchesGroups=pieces.length===parts.length&&pieces.every(n=>n!==null)&&JSON.stringify(canonical(pieces))===JSON.stringify(canonical(parts)),
  total=rational(task.n,task.d),leftMatchesTotal=JSON.stringify(left)===JSON.stringify(total),rightMatchesTotal=JSON.stringify(sum)===JSON.stringify(total);
 return{syntaxValid:!!syntaxValid,left,terms:terms.map((term,index)=>({...term,pieces:pieces[index]})),sum,leftMatchesTotal,rightMatchesTotal,matchesGroups,
  matchesTotal:leftMatchesTotal&&rightMatchesTotal,valid:!!syntaxValid&&leftMatchesTotal&&rightMatchesTotal&&matchesGroups};
}
const fracCaseSteps=(a,b,denom,leftCount,rightCount,result,{mixed=false}={})=>[
 {field:'choice',value:'+'},{field:'guess',value:mixed?'more':'part'},{action:'b18-start',data:{}},
 {field:'work.aform',value:a},{field:'work.bform',value:b},{action:'b18-op-forms',data:{}},
 {field:'work.denom',value:String(denom)},{action:'b18-op-common',data:{}},
 ...Array.from({length:leftCount},(_,index)=>({action:'b18-op-shade',data:{row:'left',index}})),
 ...Array.from({length:rightCount},(_,index)=>({action:'b18-op-shade',data:{row:'right',index}})),
 {action:'b18-op-combine',data:{}},{field:'work.answer',value:result},{field:'work.reason',value:'same-parts'},
 ...(mixed?[{field:'simple',value:'5/4'},{field:'whole',value:'1'},{field:'part',value:'1/4'}]:[])
];
// Original first tasks provide actual Next navigation to associated index 1.
// They are recorded separately and do not count as new family coverage.
const prerequisites={
 'link-joinfractions-precisefractions':{
  task:{type:'x-fractioncase',a:'2/5',op:'+',b:'2/5',prompt:'同样大小的面包，取出两份2/5。先猜，再接起来。',scene:'2/5　与　2/5'},
  steps:fracCaseSteps('2/5','2/5',5,2,2,'4/5')
 },
 'link-unitcopies-splitfraction':{
  task:{type:'x-unitwalk',n:5,d:8,prompt:'每次走一份八分之一，接出五份。把这些小份用加号记下来。',copies:true},
  steps:[{field:'parts',value:'8'},{action:'b16-partition',data:{}},...Array.from({length:5},()=>({action:'b16-walk',data:{}})),
   {field:'answer',value:'5/8'},{field:'copies',value:'5'},{field:'equation',value:'1/8+1/8+1/8+1/8+1/8'}]
 },
 'link-fractioncarry-splitfraction':{
  task:{type:'x-fractioncase',a:'7/8',op:'+',b:'3/8',prompt:'接过1以后继续数小份；写出整份与剩下的部分。',scene:'7/8　与　3/8',mixed:true,simple:true},
  steps:fracCaseSteps('7/8','3/8',8,7,3,'5/4',{mixed:true})
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
 const {fracDecomposeBinding,replayFracDecomposeEvidence}=await import('../dist/learning/fracdecompose-evidence.js');
 const taskFor=spec=>sessionTasks(spec.id)[spec.index],ctx=spec=>({sessionId:spec.id,index:spec.index});
 assert.equal(cases.length,3);assert.equal(bridges.length,5);assert.equal(practices.length,1);
 for(const spec of [...cases,...bridges]){assert.equal(hash(taskFor(spec)),spec.taskHash);assert.deepEqual(taskFor(spec),spec.task);}
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 for(const spec of practices){assert.deepEqual(Tasks.PRACTICE[spec.id],spec.task);assert.equal(hash(Tasks.PRACTICE[spec.id]),spec.taskHash);assert.equal(fracDecomposeBinding(spec.task,ctx(spec)),null);}
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
      'learning/fracdecompose-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
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
    assert.equal(await control.count(),1,label+' one real field '+key);await reveal(control);ok(await control.isVisible()&&await control.isEnabled(),label+' visible enabled field '+key);if((await control.evaluate(element=>element.tagName))==='SELECT')await control.selectOption(String(value));else await control.fill(String(value));
    setField(expected,key,String(value));Engine.fieldExtra(taskFor(spec),expected,key);assert.deepEqual(await model(spec),expected);return expected;
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
    current??=await model(spec);const task=taskFor(spec),parts=partsFor(task,current.board.cuts),groups=page.locator('#extra-visual .b18-decompose > .b18-group');
    assert.equal(await page.locator('[data-xfield]').count(),1);assert.equal(await page.locator('[data-xfield="equation"]').inputValue(),current.equation);
    assert.equal(await groups.count(),parts.length);
    assert.deepEqual(await groups.evaluateAll(elements=>elements.map(group=>group.querySelectorAll('.b18-little').length)),parts);
    const pieces=page.locator('#extra-visual .b18-little');assert.equal(await pieces.count(),task.n);
    const geometry=await pieces.evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return{width:r.width,height:r.height};}));
    ok(geometry.every(r=>r.width>0&&r.height>0),label+' each original unit piece is visibly sized');
    const cutButtons=page.locator('[data-x="b18-cut"]');assert.equal(await cutButtons.count(),task.n-1);
    for(let index=1;index<task.n;index++){
     const control=page.locator(`[data-x="b18-cut"][data-index="${index}"]`);assert.equal(await control.count(),1);
     assert.equal(await control.getAttribute('aria-pressed'),String(current.board.cuts.includes(index)));
     assert.equal(await control.isEnabled(),true);
    }
    for(const action of ['save','new-groups','reset'])assert.equal(await page.locator(`[data-x="b18-${action}"]`).isEnabled(),true);
    assert.deepEqual(await page.locator('#extra-visual .b18-saved > span').allTextContents(),current.board.saved.map(item=>item.equation));
    const words=await page.locator('#extra-visual').innerText();ok(words.includes('原来的量：'+task.n+'/'+task.d)&&words.includes('每小块都是 1/'+task.d),label+' visible reference and unit stay explicit');
    assert.equal(await page.locator('.b18-issue').count(),current.issue?1:0);if(current.issue)assert.equal(await page.locator('.b18-issue').innerText(),current.issue);
   };
   const verifyDecomposition=(task,entry)=>{
    const parts=partsFor(task,entry.cuts);assert.deepEqual(entry.parts,parts);assert.ok(parts.every(n=>Number.isInteger(n)&&n>0));assert.equal(parts.reduce((a,b)=>a+b,0),task.n);
    assert.deepEqual(entry.groupQuantities,parts.map(n=>rational(n,task.d)));
    assert.deepEqual(entry.canonicalParts,canonical(parts));assert.equal(entry.canonicalKey,canonical(parts).join(','));assert.equal(entry.isSplit,parts.length>1);
    const expected=equationOracle(task,entry.equation.raw,parts),actual=entry.equation;
    assert.deepEqual(actual.left.value,expected.left);assert.deepEqual(actual.terms,expected.terms);assert.deepEqual(actual.sum,expected.sum);
    assert.deepEqual(actual.sumExact,expected.sum?expected.sum.map(String):null);
    for(const key of ['syntaxValid','leftMatchesTotal','rightMatchesTotal','matchesTotal','matchesGroups','valid'])assert.equal(actual[key],expected[key],key+' independently matches this written equation');
    assert.equal(entry.mathematicalMatch,parts.length>1&&expected.valid);
   };
   const proofFor=(spec,current)=>{
    const task=taskFor(spec),expected=spec.expected,proof=replayFracDecomposeEvidence(task,current);assert.ok(proof);
    assert.equal(M.valid(task,current),true);assert.equal(M.inspect(task,current).correct,true);
    assert.deepEqual(proof.totalQuantity,expected.total);assert.deepEqual(proof.unitValue,expected.unit);assert.equal(proof.pieceCount,task.n);assert.deepEqual(proof.referenceWhole,[1,1]);
    assert.equal(proof.savedDecompositions.length,current.board.saved.length);
    for(const [index,saved]of proof.savedDecompositions.entries()){
     verifyDecomposition(task,saved);assert.equal(saved.mathematicalMatch,true);
     assert.deepEqual({parts:saved.parts,equation:saved.equation.raw},current.board.saved[index]);
     const event=current.history[saved.historyIndex];assert.equal(event.a,'save');assert.equal(event.f.equation,saved.equation.raw);
    }
    assert.equal(new Set(proof.savedDecompositions.map(saved=>saved.canonicalKey)).size,proof.savedDecompositions.length);
    assert.equal(proof.goal.minimumSaved,expected.minimumSaved);assert.equal(proof.goal.distinctSaved,current.board.saved.length);assert.equal(proof.goal.completed,true);
    assert.deepEqual(proof.goal.requiredCanonicalParts,expected.requiredParts.map(canonical));
    assert.deepEqual(proof.goal.requiredCanonicalKeys,expected.requiredParts.map(parts=>canonical(parts).join(',')));
    assert.deepEqual(proof.goal.matchedSavedIndices,expected.requiredParts.map(parts=>proof.savedDecompositions.findIndex(saved=>saved.canonicalKey===canonical(parts).join(','))));
    assert.ok(proof.goal.matchedSavedIndices.every(index=>index>=0));
    const draft=proof.currentDraft;verifyDecomposition(task,draft);assert.deepEqual(draft.cuts,current.board.cuts);assert.equal(draft.equation.raw,current.equation);
    const matching=proof.savedDecompositions.flatMap((saved,index)=>JSON.stringify(saved.cuts)===JSON.stringify(draft.cuts)&&saved.equation.raw===current.equation?[index]:[]),
     sameParts=proof.savedDecompositions.flatMap((saved,index)=>saved.canonicalKey===draft.canonicalKey?[index]:[]);
    assert.deepEqual(draft.matchingSavedIndices,matching);assert.deepEqual(draft.sameDecompositionSavedIndices,sameParts);
    assert.equal(draft.savedSnapshotMatches,matching.length>0);assert.equal(draft.unsaved,matching.length===0);assert.equal(draft.canSaveAsNew,draft.mathematicalMatch&&sameParts.length===0);
    assert.equal(draft.equationStatus,!current.equation.trim()?'blank':!draft.equation.syntaxValid?'invalid-syntax':!draft.equation.valid?'does-not-match-groups':'matches-groups');
    assert.equal(proof.eventCount,current.history.length);assert.equal(proof.events.length,current.history.length);assert.equal(proof.issue,current.issue);
    for(const [index,event]of proof.events.entries()){
     const original=current.history[index];assert.equal(event.historyIndex,index);assert.equal(event.action,original.a);assert.deepEqual(event.fields,{equation:original.f.equation});
     assert.deepEqual(event.before.parts,partsFor(task,event.before.cuts));assert.deepEqual(event.after.parts,partsFor(task,event.after.cuts));
     if(index)assert.deepEqual(event.before,proof.events[index-1].after);
     if(event.action==='cut'){
      assert.equal(event.index,Number(original.d.index));assert.equal(event.change,event.before.cuts.includes(event.index)?'join':'split');
      assert.deepEqual(event.after.cuts,event.before.cuts.includes(event.index)?event.before.cuts.filter(n=>n!==event.index):[...event.before.cuts,event.index].sort((a,b)=>a-b));
     }
     if(event.action==='new-groups'){assert.deepEqual(event.after.cuts,[]);assert.equal(event.after.savedCount,event.before.savedCount);}
     if(event.action==='reset'){assert.deepEqual(event.after.cuts,[]);assert.equal(event.after.savedCount,0);}
     if(event.action==='save'){
      verifyDecomposition(task,event.decomposition);
      assert.equal(event.after.savedCount,event.before.savedCount+(event.accepted?1:0));
      if(!event.accepted){assert.deepEqual(event.after,event.before);assert.ok(event.issue);}
     }
    }
    assert.deepEqual(proof.failedRequests,proof.events.filter(event=>!event.accepted));assert.deepEqual(proof.resets,proof.events.filter(event=>event.action==='reset'));
    assert.deepEqual(proof.newGroups,proof.events.filter(event=>event.action==='new-groups'));
    assert.deepEqual(current.board.first,{parts:proof.firstAttempt.decomposition.parts,equation:proof.firstAttempt.fields.equation});
    assert.deepEqual(proof.firstAttempt,proof.events.find(event=>event.action==='save'));
    const lastReset=proof.resets.at(-1)?.historyIndex??-1;assert.deepEqual(proof.currentRoundFirstAttempt,proof.events.find(event=>event.action==='save'&&event.historyIndex>lastReset));
    assert.deepEqual(proof.systemGenerated,{initialUnitPieces:true,groupedDiagram:true,groupPieceCounts:true,savedEquationDisplay:true});
    for(const key of ['exactKeystrokeOrderKnown','physicalActionAssessed','independentDrawingAssessed','openExplanationAssessed','authorshipAssessed','generalMasteryAssessed','allLaterClicksRecorded','historyCompletenessAuthenticated'])assert.equal(proof.assessmentLimits[key],false);
    for(const key of ['savedFormsVerified','currentDraftSeparatelyAssessed','writtenEquationsAreSubmissions','equationTermOrderDoesNotIdentifyVisualGroup'])assert.equal(proof.assessmentLimits[key],true);
    assert.equal(proof.assessmentLimits.method,null);assert.equal(proof.assessmentLimits.recordingLimit,1200);return proof;
   };
   const wordsFor=async proof=>{
    ok(await hint.isVisible(),label+' saved-form evidence belongs to the latest complete checked snapshot');const words=await hint.innerText(),draft=proof.currentDraft;
    ok(words.includes(`已经保存 ${proof.savedDecompositions.length} 种不同的分组`)&&words.includes('每个小份是 '+name(proof.unitValue))&&words.includes('拼回原来的 '+name(proof.totalQuantity)),label+' feedback uses the verified saved forms, unit and total');
    for(const saved of proof.savedDecompositions)ok(words.includes(saved.equation.raw)&&words.includes(saved.parts.join('、')),label+' every saved equation and group size is explicit');
    if(draft.savedSnapshotMatches)ok(words.includes('当前分组和等式与已有的一种保存记录一致'),label+' matching saved draft is identified');
    else if(!draft.isSplit)ok(words.includes('当前草稿还没有拆成两组')&&words.includes('未作为新的拆法保存'),label+' unsplit draft is not described as a saved decomposition');
    else if(!draft.equation.valid)ok(words.includes('当前草稿的等式还没有与当前分组对上')&&words.includes('这里只确认已保存的作品'),label+' incorrect current equation cannot borrow the saved proof');
    else if(draft.sameDecompositionSavedIndices.length)ok(words.includes('顺序或写法变化')&&words.includes('没有增加一种新的拆法'),label+' reordered or rewritten grouping is not counted twice');
    else ok(words.includes('还没有保存成新的作品'),label+' a valid new draft is not invented as a saved action');
    if(proof.firstAttempt.accepted===false)ok(words.includes('当时未保存成功'),label+' original first failed save remains an explicit failed request');
    if(proof.issue)ok(words.includes('最后一次保存未成功的提示仍保留'),label+' terminal failure is not erased by valid saved work');
    if(proof.resets.length)ok(words.includes('最后一轮的保存成果')&&words.includes('第一次保存请求也没有被替换'),label+' reset separates current saved forms from retained old history');
    ok(/工具提供/.test(words)&&/不评价独立作图、自由解释或长期掌握/.test(words),label+' system display and assessment limits stay explicit');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d|你已掌握|已经掌握|你独立画|你独立计算/.test(words),label+' no invented practice or mastery label');return words;
   };
   const advance=async spec=>{const next=page.locator('#actions [data-do="next"]');assert.equal(await next.count(),1);await next.click();await wait(page,spec);};
   const openNative=async spec=>{
    if(spec.index===0){const response=await page.goto(base+'learn.html#'+spec.id);await wait(page,spec);ok(response?.fromServiceWorker()===true,label+' native task opens after the origin stopped');}
    else{const previous=structuredClone(await saved(spec.id));assert.equal(previous.index,spec.index-1);await advance(spec);
     const current=await saved(spec.id);assert.deepEqual(current.cases,previous.cases);for(const [index,value]of Object.entries(previous.models))assert.deepEqual(current.models[index],value);}
    assert.deepEqual(await model(spec),M.initial(taskFor(spec)));assert.equal((await saved(spec.id)).cases[spec.index],undefined);
   };

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),plan=scenarioFor(task);await openNative(spec);await visual(spec);
    assert.equal(fracDecomposeBinding(task,ctx(spec))?.nodeId,spec.nodeId);assert.equal(fracDecomposeBinding(task,ctx(spec)).method,null);
    ok(await guide.isVisible()&&!(await guide.evaluate(element=>element.open)),label+' optional question begins collapsed');assert.equal(await hint.count(),0);
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),label+' visible summary opens the optional question');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support)break;await page.waitForTimeout(50);}
    assert.deepEqual(afterGuide.models,beforeGuide.models);assert.equal(afterGuide.cases[spec.index]?.support,true);await guide.locator('summary').click();
    const snapshots=[],special=[];
    await field(spec,'equation','0=1');const firstFailed=await action(spec,'save');
    assert.deepEqual(firstFailed.board,{cuts:[],saved:[],first:{parts:[task.n],equation:'0=1'}});assert.equal(firstFailed.history.length,1);assert.ok(firstFailed.issue);
    snapshots.push(await check(spec,false,'01-first-failed-save'));assert.equal(replayFracDecomposeEvidence(task,firstFailed),null);assert.equal(await hint.count(),0);await visual(spec);await shot('01-first-failed-save');

    await runSteps(spec,groupSteps(task,plan.partial.parts));await field(spec,'equation',plan.partial.wrong);const beforeMismatch=await model(spec),mismatch=await action(spec,'save');
    assert.deepEqual(mismatch.board,beforeMismatch.board);assert.ok(mismatch.issue);assert.equal(mismatch.history.length,beforeMismatch.history.length+1);
    special.push({kind:'same-total-wrong-groups',before:beforeMismatch,after:mismatch});
    await field(spec,'equation',plan.partial.equation);const partial=await action(spec,'save');assert.equal(partial.issue,'');assert.equal(partial.board.saved.length,1);
    assert.deepEqual(partial.board.saved[0],{parts:plan.partial.parts,equation:plan.partial.equation});assert.equal(M.inspect(task,partial).correct,false);
    snapshots.push(await check(spec,false,'02-valid-saved-but-goal-incomplete'));assert.equal(await hint.count(),0);
    if(spec.index===2)ok(partial.board.saved[0].parts.join(',')==='9,8'&&replayFracDecomposeEvidence(task,partial)===null,label+' 9/8 plus 1 is valid saved work but does not supply two complete wholes and a remainder');

    const beforeClear=await model(spec),cleared=await action(spec,'new-groups');assert.deepEqual(cleared.board.cuts,[]);assert.deepEqual(cleared.board.saved,beforeClear.board.saved);
    assert.deepEqual(cleared.board.first,firstFailed.board.first);assert.equal(cleared.equation,beforeClear.equation);assert.deepEqual(cleared.history.slice(0,-1),beforeClear.history);
    // groupSteps deliberately includes a second, harmless clear. The real
    // history retains it; it is not called another decomposition.
    await runSteps(spec,decompositionSteps(task,plan.duplicatePartial));const duplicatePartial=await model(spec);
    assert.deepEqual(duplicatePartial.board.saved,partial.board.saved);assert.equal(duplicatePartial.issue,'交换先后还是同一组拆法。试着改变每组拿几份。');
    special.push({kind:'reordered-partial-duplicate',model:duplicatePartial});
    await runSteps(spec,decompositionSteps(task,plan.completion));const completed=await model(spec);assert.equal(completed.board.saved.length,2);assert.equal(M.inspect(task,completed).correct,true);
    assert.equal(await hint.count(),0);snapshots.push(await check(spec,true,'03-saved-goal-complete'));
    const completedProof=proofFor(spec,completed),completedWords=await wordsFor(completedProof);assert.equal(completedProof.firstAttempt.accepted,false);assert.equal(completedProof.firstAttempt.historyIndex,0);
    assert.equal(completedProof.currentRoundFirstAttempt.historyIndex,0);assert.equal(completedProof.failedRequests.length,3);await visual(spec);await shot('03-saved-goal-complete');
    const completedRecord=await saved(spec.id);await reload(spec);assert.deepEqual((await saved(spec.id)).models,completedRecord.models);assert.deepEqual((await saved(spec.id)).cases,completedRecord.cases);await wordsFor(completedProof);

    await field(spec,'equation',plan.wrongDraft);const uncheckedWrong=await model(spec);assert.equal(M.inspect(task,uncheckedWrong).correct,true);assert.equal(await hint.count(),0);
    const wrongDraftProof=proofFor(spec,uncheckedWrong);assert.equal(wrongDraftProof.currentDraft.mathematicalMatch,false);assert.equal(wrongDraftProof.currentDraft.unsaved,true);
    if(spec.index===0){assert.equal(wrongDraftProof.currentDraft.equation.syntaxValid,false);assert.ok(completedProof.savedDecompositions[1].equation.terms.some(term=>term.raw==='12.5%'));}
    await reload(spec);assert.deepEqual(await model(spec),uncheckedWrong);assert.equal(await hint.count(),0);
    const wrongSaved=await action(spec,'save');assert.deepEqual(wrongSaved.board,uncheckedWrong.board);assert.ok(wrongSaved.issue);assert.equal(M.inspect(task,wrongSaved).correct,true);
    snapshots.push(await check(spec,true,'04-wrong-draft-failed-save'));const wrongProof=proofFor(spec,wrongSaved),wrongWords=await wordsFor(wrongProof);await visual(spec);await shot('04-wrong-draft-saved-proof');
    ok(wrongProof.currentDraft.equation.valid===false&&wrongProof.goal.completed,label+' original completion and valid saved evidence coexist with an explicitly wrong current draft');

    await field(spec,'equation',plan.completion.equation);const corrected=await model(spec);assert.equal(M.inspect(task,corrected).correct,true);assert.equal(await hint.count(),0);
    snapshots.push(await check(spec,true,'05-current-equation-corrected'));const correctedProof=proofFor(spec,corrected);assert.equal(correctedProof.currentDraft.savedSnapshotMatches,true);await wordsFor(correctedProof);
    assert.ok(corrected.issue);assert.deepEqual(corrected.board.saved,completed.board.saved);
    const beforeUnsplit=await model(spec),unsplit=await action(spec,'new-groups');assert.deepEqual(unsplit.board.cuts,[]);assert.deepEqual(unsplit.board.saved,beforeUnsplit.board.saved);
    assert.deepEqual(unsplit.board.first,firstFailed.board.first);assert.equal(unsplit.equation,beforeUnsplit.equation);assert.equal(await hint.count(),0);
    snapshots.push(await check(spec,true,'06-unsplit-current-draft'));const unsplitProof=proofFor(spec,unsplit),unsplitWords=await wordsFor(unsplitProof);assert.equal(unsplitProof.currentDraft.isSplit,false);await visual(spec);await shot('06-unsplit-draft-saved-proof');
    await runSteps(spec,decompositionSteps(task,plan.duplicateCompleted));const duplicateCompleted=await model(spec);assert.deepEqual(duplicateCompleted.board.saved,completed.board.saved);
    assert.equal(duplicateCompleted.issue,'交换先后还是同一组拆法。试着改变每组拿几份。');assert.equal(await hint.count(),0);
    snapshots.push(await check(spec,true,'07-reordered-completed-duplicate'));const duplicateProof=proofFor(spec,duplicateCompleted),duplicateWords=await wordsFor(duplicateProof);
    assert.equal(duplicateProof.currentDraft.mathematicalMatch,true);assert.equal(duplicateProof.currentDraft.unsaved,true);assert.equal(duplicateProof.currentDraft.canSaveAsNew,false);assert.equal(duplicateProof.failedRequests.length,5);

    const beforeReset=await model(spec),reset=await action(spec,'reset');assert.deepEqual(reset.board,{cuts:[],saved:[],first:firstFailed.board.first});assert.equal(reset.issue,'');
    for(const key of Object.keys(M.fields))assert.equal(reset[key],beforeReset[key]);assert.deepEqual(reset.history.slice(0,-1),beforeReset.history);
    snapshots.push(await check(spec,false,'08-reset-current-work'));assert.equal(replayFracDecomposeEvidence(task,reset),null);assert.equal(await hint.count(),0);await visual(spec);await reload(spec);
    assert.deepEqual(await model(spec),reset);assert.equal(await hint.count(),0);
    await runSteps(spec,rebuildSteps(task));const rebuilt=await model(spec),rebuiltProof=proofFor(spec,rebuilt);assert.equal(await hint.count(),0);
    assert.equal(rebuiltProof.firstAttempt.historyIndex,0);assert.equal(rebuiltProof.firstAttempt.accepted,false);assert.equal(rebuiltProof.currentRoundFirstAttempt.accepted,true);
    assert.equal(rebuiltProof.resets.length,1);assert.equal(rebuiltProof.failedRequests.length,5);assert.equal(rebuiltProof.savedDecompositions.length,plan.rebuild.length);
    assert.deepEqual(rebuilt.history.slice(0,reset.history.length),reset.history);assert.ok(rebuiltProof.savedDecompositions.every(saved=>saved.historyIndex>rebuiltProof.resets[0].historyIndex));
    snapshots.push(await check(spec,true,'09-rebuilt-saved-goal'));const finalRecord=await saved(spec.id),finalModel=finalRecord.models[spec.index],finalProof=proofFor(spec,finalModel),finalWords=await wordsFor(finalProof);
    assert.deepEqual(snapshots.map(snapshot=>snapshot.correct),[false,false,true,true,true,true,true,false,true]);
    assert.deepEqual(finalRecord.cases[spec.index].attempts,snapshots.map(snapshot=>snapshot.attempt));assert.deepEqual(finalRecord.cases[spec.index].attempts.slice(0,completedRecord.cases[spec.index].attempts.length),completedRecord.cases[spec.index].attempts);
    assert.equal(finalProof.eventCount,[27,24,24][spec.index]);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,finalRecord.models);assert.deepEqual((await saved(spec.id)).cases,finalRecord.cases);await wordsFor(finalProof);await visual(spec);
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');await shot('final-verified');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,snapshots,special,firstFailed,partial,duplicatePartial,
     completed,completedProof,completedWords,uncheckedWrong,wrongSaved,wrongProof,wrongWords,corrected,correctedProof,unsplit,unsplitProof,unsplitWords,
     duplicateCompleted,duplicateProof,duplicateWords,reset,rebuilt,rebuiltProof,finalModel,finalProof,finalWords,record:finalRecord,stored:await snapshot('final')});
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
     preparations.push({width,height,id:spec.id,index:0,task:prep.task,taskHash:hash(prep.task),checked,nativeDecompositionCoverage:false});
     await advance(spec);const record=await saved(spec.id);assert.deepEqual(record.cases[0],checked.record.cases[0]);
    }
    assert.deepEqual(await model(spec),M.initial(taskFor(spec)));assert.equal((await saved(spec.id)).cases[spec.index],undefined);
    assert.equal(fracDecomposeBinding(taskFor(spec),ctx(spec)),null);
    ok(await guide.count()===0&&await hint.count()===0,label+' associated copy has no borrowed native guide or strict feedback');
    await runSteps(spec,rebuildSteps(taskFor(spec)));
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
   for(const spec of cases){const record=backup.state.lessons[spec.id];assert.equal(record?.cases[spec.index]?.attempts?.length,9);proofFor(spec,record.models[spec.index]);}
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
   await importFile('fracdecompose-real-browser-v2.json');const restored=await readPage(restorePage),restoredState=JSON.parse(restored.text);
   const firstImportFile=label+'-first-import-storage.txt';fs.writeFileSync(path.join(out,firstImportFile),restored.raw);
   assert.deepEqual(restoredState,backup.state);originalState(restoredState);
   provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted++;
   assert.deepEqual(restoredState.lessons,backup.state.lessons);assert.deepEqual(restoredState.daily.bridges,backup.state.daily.bridges);
   for(const spec of cases)proofFor(spec,restoredState.lessons[spec.id].models[spec.index]);
   await importFile('fracdecompose-identical-repeat-v2.json');const repeated=await readPage(restorePage);
   const repeatedImportFile=label+'-repeated-import-storage.txt';fs.writeFileSync(path.join(out,repeatedImportFile),repeated.raw);
   assert.equal(repeated.raw,restored.raw);
   assert.deepEqual(originalState(JSON.parse(repeated.text)),backup.state);provenance.backupImportsCompleted++;
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
    originStopped:!server.listening,nativeCases:cases.length,associatedCases:bridges.length,navigationPrerequisites:3,importsCompleted:2,idempotent:true});
   await context.close();contexts.delete(context);await restoreContext.close();contexts.delete(restoreContext);activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===6&&isolated.length===10&&preparations.length===6&&backups.length===2,'all three native and five associated tasks ran in both viewports; six original navigation prerequisites are separate');
  ok(provenance.backupImportsCompleted===4,'two independent contexts each completed initial and byte-idempotent repeated real v2 import');
  const attemptCounts={native:observations.reduce((sum,item)=>sum+item.snapshots.length,0),associated:isolated.length,navigationPrerequisites:preparations.length};
  assert.deepEqual(attemptCounts,{native:54,associated:10,navigationPrerequisites:6});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:'success',checks,errors,remote,observations,preparations,isolated,offline,backups,viewports,provenance,attemptCounts},null,2));
  console.log('P9_FRACDECOMPOSE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,backups:backups.length,navigationPrerequisites:preparations.length,attemptCounts}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  if(activePage&&diagnostics.has(activePage))failureDiagnostic=await diagnostics.get(activePage).dump(error).catch(failure=>({diagnosticError:String(failure)}));
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:'failure',checks,errors,remote,observations,preparations,isolated,offline,backups,viewports,provenance,
   failureDiagnostic,error:String(error),stack:error.stack,at:label},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  for(const context of contexts)await context.close();if(browser)await browser.close();
 }
}

module.exports={scenarioFor,groupSteps,decompositionSteps,rebuildSteps,equationOracle,setField,prerequisites};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
