// All 26 reviewed native decimal shifts and 22 related bridge positions.
// Only empty lessons are seeded. Every prediction, move, field and check uses
// the original visible controls after the HTTP origin has stopped.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const fixture=require('./fixtures/p9-wideshift-cases.cjs'),{cases,associated,excludedAdd}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-wideshift-adapter');
const viewports=[[1440,900],[1280,720]],checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[];
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 childTrial:false,independentTeachingReview:false,seededCorrectWork:false};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>crypto.createHash('sha256').update(x).digest('hex'),hash=t=>digest(JSON.stringify(stable(t)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const Q=1000000n,LIMIT=100000000n*Q;
const ticks=s=>{assert.match(s,/^-?\d+(?:\.\d{1,6})?$/);const [w,f='']=s.replace(/^-/,'').split('.');return (BigInt(w)*Q+BigInt(f.padEnd(6,'0')))*(s.startsWith('-')?-1n:1n);};
const decimal=n=>{const f=String(n%Q).padStart(6,'0').replace(/0+$/,'');return String(n/Q)+(f?'.'+f:'');};

// This verifier uses exact integer arithmetic and the raw trace. Neither the
// original targetShift/log10 nor the production replay establishes the maths.
function exact(spec,model,proof){
 let n=ticks(spec.start),shift=0;assert.ok(proof);assert.equal(proof.unit,Number(Q));assert.equal(proof.start,Number(n));
 assert.equal(model.trace.length,proof.successfulMoves);assert.equal(proof.steps.length,model.trace.length);
 for(const [i,delta]of model.trace.entries()){
  assert.ok(delta===1||delta===-1);const before=n;
  if(delta===1)n*=10n;else{assert.equal(n%10n,0n);n/=10n;}
  shift+=delta;assert.ok(n>0n&&n<=LIMIT&&shift>=-9&&shift<=9);
  assert.deepEqual(proof.steps[i],{index:i,delta,fromShift:shift-delta,toShift:shift,from:Number(before),to:Number(n),
   display:{from:decimal(before),to:decimal(n)},operation:delta===1?'times':'divide'});
 }
 assert.equal(shift,spec.targetShift);assert.equal(model.shift,shift);assert.equal(ticks(model.answer),n);
 assert.equal(proof.end,Number(n));assert.equal(proof.display.end,spec.end);assert.equal(n,ticks(spec.end));
 assert.equal(proof.display.factor,spec.factor);assert.equal(proof.netShift,shift);assert.equal(proof.direction,spec.direction);
 assert.equal(model.guess,model.committed);assert.equal(proof.guess.matchesResult,ticks(model.committed)===n);
 assert.equal(proof.digitRowsSystemGenerated,true);assert.equal(proof.unrecordedClicksAssessed,false);
 if(spec.mode==='scientific'){
  assert.ok(n>=Q&&n<10n*Q);const exponent=BigInt(model.exponent),power=10n**(exponent<0n?-exponent:exponent);
  assert.equal(exponent>=0n?n*power:ticks(spec.start)*power,exponent>=0n?ticks(spec.start):n);
  assert.equal(proof.scientific.exponent,Number(spec.exponent));assert.equal(model.factor,'');assert.equal(model.direction,'');
 }else{assert.equal(model.exponent,'');assert.equal(ticks(model.factor),BigInt(spec.factor)*Q);assert.equal(model.direction,spec.direction);}
 return {startUnits:String(ticks(spec.start)),endUnits:String(n),netShift:shift,successfulMoves:model.trace.length,scientificMultiplyBack:spec.mode==='scientific'};
}

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 fs.mkdirSync(out,{recursive:true});
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const M=await import('../dist/learning/phase5/b08-model.js');
 const {wideShiftBinding,replayWideShiftEvidence}=await import('../dist/learning/wideshift-evidence.js');
 const {wideShiftEvidenceSteps}=await import('../scripts/wideshift-evidence-fixture.mjs');
 for(const spec of [...cases,...associated,...excludedAdd,...fixture.excludedBoards])assert.equal(hash(sessionTasks(spec.id)[spec.index]),spec.taskHash);
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected,file);
 let browser,server,context,activePage,label='setup';
 try{
  browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});provenance.browserVersion=browser.version();
  for(const [width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-cache';
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':data);});
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
   context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remote.push(request.url());});
   const page=activePage=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push({label,error:String(error)}));
   const hint=page.locator('#thinking-feedback'),guide=page.locator('#thinking-guide');
   const read=()=>page.evaluate(async()=>{const {readStored}=await import('./storage.js');return {raw:localStorage.getItem('math-explorer-v2'),text:readStored('math-explorer-v2')};});
   const saved=async id=>{const state=JSON.parse((await read()).text);return state.lessons[id]||state.daily.bridges[id];};
   const model=async spec=>(await saved(spec.id)).models[spec.index],taskFor=spec=>sessionTasks(spec.id)[spec.index];
   const wait=spec=>page.waitForFunction(({id,index})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view==='task';},spec);
   const reload=async spec=>{const response=await page.reload();await wait(spec);ok(response?.fromServiceWorker()===true,label+' actual reload uses the stopped-origin cache');};
   const open=async spec=>{
    await page.evaluate(async({id,index})=>{
     const [{KEY,fresh},{freshLesson},{BRIDGES}]=await Promise.all([import('./exploration-core.js'),import('./learning/state.js'),import('./learning/bridges.js')]);
     const state=fresh(),record=freshLesson(id);record.index=index;record.view='task';
     if(Object.hasOwn(BRIDGES,id))state.daily.bridges[id]=record;else state.lessons[id]=record;
     localStorage.setItem(KEY,JSON.stringify(state));
    },spec);
    await page.goto(base+'learn.html#'+spec.id);await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);await reload(spec);
    const record=await saved(spec.id),current=record.models[spec.index];assert.deepEqual(current,M.initial(taskFor(spec)));
    ok(current.committed===null&&current.trace.length===0&&(record.cases[spec.index]?.attempts?.length??0)===0,label+' starts from empty original work');
   };
   const shot=async suffix=>{await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));await page.screenshot({path:path.join(out,label+'-'+suffix+'.png'),fullPage:true});};
   const snapshot=async suffix=>{const stored=await read();fs.writeFileSync(path.join(out,label+'-'+suffix+'-storage.txt'),stored.raw);fs.writeFileSync(path.join(out,label+'-'+suffix+'-state.json'),stored.text);return JSON.parse(stored.text);};
   const reveal=async control=>{for(let count=0;count<10;count++){const closed=control.locator('xpath=ancestor::details[not(@open)][last()]');if(!(await closed.count()))return;await closed.locator(':scope > summary').click();}assert.fail('too many nested disclosures');};
   const field=async(key,value)=>{const control=page.locator(`[data-xfield="${key}"]`);await reveal(control);if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));else await control.fill(String(value));};
   const moveControl=delta=>page.locator(`[data-x="wide-move"][data-delta="${delta}"]`);
   const action=async(name,data={})=>{
    const suffix=Object.entries(data).map(([key,value])=>`[data-${key}="${value}"]`).join(''),control=page.locator(`[data-x="${name}"]${suffix}`);
    await reveal(control);ok(await control.isEnabled(),label+' real control enabled: '+name+' '+JSON.stringify(data));await control.click();
   };
   const apply=async(spec,expected,step)=>{
    const task=taskFor(spec);if(step.field){await field(step.field,step.value);expected[step.field]=String(step.value);M.field(task,expected,step.field);}
    else{await action(step.action,step.data);M.act(task,expected,step.action,step.data);}
    assert.deepEqual(await model(spec),expected,'actual complete model follows each original control');
   };
   const fillResult=async spec=>{
    await field('answer',spec.end);if(spec.mode==='scientific')await field('exponent',spec.exponent);
    else{await field('factor',spec.factor);await field('direction',spec.direction);}
   };
   const build=async(spec,{guess='-1',detour=false,trace}={})=>{
    const task=taskFor(spec),expected=M.initial(task),direct=Array.from({length:Math.abs(spec.targetShift)},()=>Math.sign(spec.targetShift));
    for(const step of wideShiftEvidenceSteps(task,{guess,trace:trace??(detour?[1,-1,...direct]:direct)}))await apply(spec,expected,step);
    ok(M.valid(task,expected)&&M.inspect(task,expected).correct,label+' real controls finish the unchanged task');return expected;
   };
   const check=async(spec,expected,suffix)=>{
    const before=await saved(spec.id),beforeModel=structuredClone(before.models[spec.index]);await page.locator('#actions [data-do="check"]').click();
    const after=await saved(spec.id),attempts=after.cases[spec.index].attempts,attempt=attempts.at(-1);
    assert.equal(attempts.length,(before.cases[spec.index]?.attempts?.length??0)+1);assert.deepEqual(attempt.value,beforeModel);assert.deepEqual(after.models[spec.index],beforeModel);
    assert.deepEqual(attempts.slice(0,-1),before.cases[spec.index]?.attempts??[]);
    ok(attempt.id&&attempt.at&&typeof attempt.supported==='boolean'&&typeof attempt.exposed==='boolean',label+' '+suffix+' keeps original attempt metadata');
    ok(await page.locator('#check-feedback').getAttribute('data-state')===(expected?'correct':'revise'),label+' '+suffix+' observes original grading');
    return {name:suffix,model:beforeModel,attempt,record:after};
   };
   const visual=async(spec,current)=>{
    const rows=await page.locator('#extra-visual .b8-columns section').evaluateAll(elements=>elements.map(e=>({
     label:e.querySelector('span').textContent,unit:e.querySelector('small').textContent,digit:Number(e.querySelector('strong').textContent),pointEdge:e.classList.contains('point-edge')})));
    let n=ticks(spec.start);for(const delta of current.trace){if(delta===1)n*=10n;else{assert.equal(n%10n,0n);n/=10n;}}
    let total=0n;for(const row of rows){const unit=row.unit.startsWith('1 / ')?Q/BigInt(row.unit.slice(4)):Q*BigInt(row.unit);assert.ok(unit>0n);assert.equal(row.digit,Number(n/unit%10n));assert.equal(row.pointEdge,row.unit==='1');total+=BigInt(row.digit)*unit;}
    assert.equal(total,n);const caption=await page.locator('#extra-visual .b8-caption').allTextContents(),trace=await page.locator('#extra-visual .b8-trace').innerText();
    assert.ok(caption.some(text=>text.includes('现在表示 '+decimal(n))));assert.equal((trace.match(/× 10/g)||[]).length,current.trace.filter(d=>d===1).length);assert.equal((trace.match(/÷ 10/g)||[]).length,current.trace.filter(d=>d===-1).length);
    ok(rows.length>=5,label+' tool-generated digit row independently represents the current exact quantity');return {rows,caption,trace,currentUnits:String(n),systemGenerated:true};
   };
   const wordsFor=async proof=>{
    ok(!!proof&&await hint.isVisible(),label+' current checked valid moves receive bounded feedback');const words=await hint.innerText();
    ok(words.includes(proof.display.start)&&words.includes(proof.display.end)&&words.includes(proof.successfulMoves+' 次成功移动'),label+' feedback names actual start, result and successful move count');
    ok(words.includes('没有核对每一次点击')&&words.includes('数位行由工具按当前的数自动画出'),label+' feedback distinguishes successful trace from clicks and automatic drawing');
    ok(words.includes(proof.guess.matchesResult?'与这次得到的数相符':'与这次得到的数不同'),label+' the frozen initial guess has its own truth value');
    const relation=proof.scientific?`${proof.display.end} × 10^${proof.scientific.exponent} = ${proof.display.start}`:`${proof.display.start} ${proof.direction==='times'?'×':'÷'} ${proof.display.factor} = ${proof.display.end}`;
    ok(words.includes(relation),label+' displayed relationship matches independent exact arithmetic');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d/.test(words)&&/自由解释/.test(words)&&/长期掌握/.test(words),label+' no unearned practice attribution or mastery claim');return words;
   };

   await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor({state:'attached'});
   let cacheReport={ready:false};
   for(let i=0;i<300;i++){
    cacheReport=await page.evaluate(async expected=>{
     const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
     const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,state:worker?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
     if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return {ready:false,...identity};
     const status=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);});
     return {...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
    },cache);if(cacheReport.ready===true)break;await page.waitForTimeout(100);
   }
   const modules=await page.evaluate(async expected=>{const store=await caches.open(expected);return Promise.all(['storage.js','learn.html','learning/learn.js','learning/wideshift-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js','learning/state.js','learning/tasks.js','learning/phase5/b08.js','learning/phase5/b14.js','learning/phase5/b18.js','learning/phase5/b39.js','learning/phase5/b08-model.js','learning/phase5/b08-view.js','learning/phase5/b08-math.js','learning/phase4/async-batches.js'].map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));},cache);
   const cacheCheck={width,height,cache,report:cacheReport,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};offline.push(cacheCheck);
   ok(cacheReport.ready===true&&cacheCheck.missing.length===0,prefix+' activated current controller has every offline dependency',cacheCheck);
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});cacheCheck.originStopped=!server.listening;ok(cacheCheck.originStopped,prefix+' HTTP origin stops before mathematical work');

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),detour=width===1280,guess=detour?spec.end:'-1';await open(spec);
    ok(wideShiftBinding(task,spec)?.nodeId===spec.nodeId,label+' native position retains its literal source');
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open))&&await hint.count()===0,label+' optional guide starts collapsed without evidence');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();ok(await guide.locator('p').isVisible(),label+' real summary opens the optional question');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support===true)break;await page.waitForTimeout(50);}
    if(spec===cases[0])await shot('01-guide');await guide.locator('summary').click();assert.deepEqual(afterGuide.models,beforeGuide.models);
    ok(afterGuide.cases[spec.index]?.support===true&&(afterGuide.cases[spec.index]?.attempts?.length??0)===0,label+' opening guidance invents no moves or submission');
    const snapshots=[await check(spec,false,'01-blank')];ok(await hint.count()===0,label+' blank work is not evidence');
    await build(spec,{guess,detour});ok(await hint.count()===0,label+' completed controls still require checking');
    await field('answer','0');snapshots.push(await check(spec,false,'02-wrong-answer'));ok(await hint.count()===0,label+' wrong final answer earns no strict feedback');
    await field('answer',spec.end);snapshots.push(await check(spec,true,'03-correct-answer'));
    const first=await model(spec),proof=replayWideShiftEvidence(task,first),math=exact(spec,first,proof),words=await wordsFor(proof),firstVisual=await visual(spec,first);
    assert.equal(proof.successfulMoves,Math.abs(spec.targetShift)+(detour?2:0));assert.equal(proof.guess.matchesResult,detour);
    const correct=await saved(spec.id);await reload(spec);assert.deepEqual((await saved(spec.id)).models,correct.models);assert.deepEqual((await saved(spec.id)).cases,correct.cases);ok(await hint.isVisible(),label+' all successful work restores offline');
    await field('answer','0');ok(await hint.count()===0,label+' edited answer hides stale feedback');if(spec===cases[0])await shot('04-edited');
    await reload(spec);ok(await hint.count()===0,label+' edited draft stays unverified after reload');snapshots.push(await check(spec,false,'04-wrong-after-edit'));
    await field('answer',spec.end);const beforeLoop=await model(spec);await action('wide-move',{delta:1});const displaced=await model(spec);
    assert.equal(displaced.trace.length,beforeLoop.trace.length+1);assert.equal(displaced.shift,beforeLoop.shift+1);ok(await hint.count()===0,label+' a new successful move needs a new check');
    await reload(spec);assert.deepEqual(await model(spec),displaced);ok(await hint.count()===0,label+' unsubmitted move survives offline without old feedback');
    await action('wide-move',{delta:-1});const returned=await model(spec);assert.equal(returned.shift,beforeLoop.shift);assert.deepEqual(returned.trace,[...beforeLoop.trace,1,-1]);
    snapshots.push(await check(spec,true,'05-rechecked-return'));const end=await saved(spec.id),finalModel=end.models[spec.index],finalProof=replayWideShiftEvidence(task,finalModel);
    const finalMath=exact(spec,finalModel,finalProof),finalWords=await wordsFor(finalProof),finalVisual=await visual(spec,finalModel);
    assert.equal(finalProof.successfulMoves,proof.successfulMoves+2);assert.equal(end.cases[spec.index].attempts.length,5);for(const [i,item]of snapshots.entries())assert.deepEqual(item.attempt,end.cases[spec.index].attempts[i]);
    ok(!Object.hasOwn(end,'thinkingScore')&&!Object.hasOwn(end,'thinkingMastery'),label+' feedback writes no new score or mastery state');
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,end.models);assert.deepEqual((await saved(spec.id)).cases,end.cases);await wordsFor(finalProof);
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');await shot('05-verified-offline');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,detour,guess,first,proof,math,words,firstVisual,snapshots,finalModel,finalProof,finalMath,finalWords,finalVisual,record:end,stored:await snapshot('final')});
   }

   // Observe disabled precision/range controls without clicking or fabricating
   // a failed move. Genuine opposite moves then return to the required result.
   for(const entry of [{id:'tenpattern',index:0,delta:1,kind:'range-disabled'},{id:'decimalscale',index:0,delta:-1,kind:'precision-disabled'}]){
    const spec=cases.find(c=>c.id===entry.id&&c.index===entry.index),task=taskFor(spec);label=prefix+'-'+entry.kind;await open(spec);await field('guess','-1');await action('wide-predict');
    while(await moveControl(entry.delta).isEnabled())await action('wide-move',{delta:entry.delta});
    const before=await model(spec);ok(await moveControl(entry.delta).isDisabled(),label+' limit is visibly disabled');assert.ok(before.trace.length>0&&before.trace.length<10);await shot('disabled');
    await reload(spec);assert.deepEqual(await model(spec),before);ok(await moveControl(entry.delta).isDisabled(),label+' disabled limit restores unchanged');
    for(let i=0;i<Math.abs(spec.targetShift-before.shift);i++)await action('wide-move',{delta:Math.sign(spec.targetShift-before.shift)});
    await fillResult(spec);const checked=await check(spec,true,'returned-from-limit'),proof=replayWideShiftEvidence(task,checked.model),math=exact(spec,checked.model,proof),words=await wordsFor(proof);
    await reload(spec);assert.deepEqual(await model(spec),checked.model);await shot('returned');negatives.push({width,height,kind:entry.kind,id:spec.id,index:spec.index,before,checked,proof,math,words,stored:await snapshot('returned')});
   }

   // The original view leaves ±9 and 60-record controls enabled. The model
   // ignores these clicks; they are not represented as successful trace events.
   for(const entry of [{id:'standardform',index:0,delta:-1,kind:'negative-shift-ignored'},{id:'standardform',index:1,delta:1,kind:'positive-shift-ignored'}]){
    const spec=cases.find(c=>c.id===entry.id&&c.index===entry.index),task=taskFor(spec);label=prefix+'-'+entry.kind;await open(spec);await field('guess','-1');await action('wide-predict');
    for(let i=0;i<9;i++)await action('wide-move',{delta:entry.delta});const before=await model(spec);assert.equal(before.shift,9*entry.delta);
    await action('wide-move',{delta:entry.delta});const after=await model(spec);assert.deepEqual(after,before);ok(after.trace.length===9,label+' enabled out-of-limit click creates no successful move');
    await reload(spec);assert.deepEqual(await model(spec),after);for(let i=0;i<Math.abs(spec.targetShift-after.shift);i++)await action('wide-move',{delta:Math.sign(spec.targetShift-after.shift)});
    await fillResult(spec);const checked=await check(spec,true,'returned-after-ignored-click'),proof=replayWideShiftEvidence(task,checked.model),math=exact(spec,checked.model,proof),words=await wordsFor(proof);
    await reload(spec);assert.deepEqual(await model(spec),checked.model);await shot('bounded');negatives.push({width,height,kind:entry.kind,id:spec.id,index:spec.index,before,after,checked,proof,math,words,stored:await snapshot('bounded')});
   }
   {
    const spec=cases.find(c=>c.id==='powerpattern'&&c.index===1),task=taskFor(spec);label=prefix+'-sixty-successful-moves';await open(spec);
    const trace=[...Array.from({length:29},()=>[1,-1]).flat(),1,1];await build(spec,{trace});const before=await model(spec);assert.equal(before.trace.length,60);
    await action('wide-move',{delta:-1});const after=await model(spec);assert.deepEqual(after,before);ok(await hint.count()===0,label+' ignored sixty-first click cannot supply a submission');
    const checked=await check(spec,true,'sixty-records'),proof=replayWideShiftEvidence(task,checked.model),math=exact(spec,checked.model,proof),words=await wordsFor(proof);assert.equal(proof.successfulMoves,60);
    await reload(spec);assert.deepEqual(await model(spec),checked.model);await shot('bounded');negatives.push({width,height,kind:'sixty-record-limit',id:spec.id,index:spec.index,before,after,checked,proof,math,words,stored:await snapshot('bounded')});
   }
   {
    const spec=cases[0];label=prefix+'-invalid-prediction';await open(spec);await field('guess','1e3');const before=await model(spec);await action('wide-predict');
    const after=await model(spec);assert.deepEqual(after,before);ok(after.committed===null&&after.trace.length===0,label+' invalid prediction records no commitment or move');await shot('uncommitted');
    await field('guess',spec.end);await action('wide-predict');await action('wide-move',{delta:1});await fillResult(spec);const checked=await check(spec,true,'corrected-prediction'),proof=replayWideShiftEvidence(taskFor(spec),checked.model),math=exact(spec,checked.model,proof),words=await wordsFor(proof);
    await reload(spec);assert.deepEqual(await model(spec),checked.model);negatives.push({width,height,kind:'invalid-prediction',id:spec.id,index:spec.index,before,after,checked,proof,math,words,stored:await snapshot('corrected')});
   }

   for(const spec of [...associated,...excludedAdd.filter(c=>c.kind==='bridge')]){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;const task=taskFor(spec);await open(spec);
    ok(wideShiftBinding(task,spec)===null&&await guide.count()===0,label+' related position has no borrowed native source');
    if(task.mode==='add'){
     assert.equal(task.start,'9500');assert.equal(task.step,1000);const expected=M.initial(task);
     for(const step of [{field:'guess',value:'-1'},{action:'wide-predict',data:{}},{action:'wide-move',data:{delta:1}},
      {action:'wide-swap',data:{kind:'up',index:1}},{field:'answer',value:'10500'},
      {action:'wide-changed',data:{index:0}},{action:'wide-changed',data:{index:1}}])await apply(spec,expected,step);
    }else await build(spec,{guess:'-1',detour:width===1280});
    const checked=await check(spec,true,'associated-original-check');ok(await hint.count()===0,label+' correct related task remains isolated');
    const proof=task.mode==='add'?null:replayWideShiftEvidence(task,checked.model),math=proof?exact(spec,checked.model,proof):null;
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,checked.record.models);assert.deepEqual((await saved(spec.id)).cases,checked.record.cases);ok(await hint.count()===0,label+' related work restores offline without native feedback');
    if(spec===associated[0]||task.mode==='add')await shot('isolated');isolated.push({width,height,id:spec.id,index:spec.index,taskHash:spec.taskHash,task,checked,proof,math,stored:await snapshot('associated')});
   }
   await context.close();context=null;activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===52&&isolated.length===44&&negatives.length===12,'all native, associated and boundary cases ran in both viewports');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance},null,2));
  console.log('P9_WIDESHIFT_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,negatives:negatives.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,viewports,provenance,error:String(error),stack:error.stack,at:label},null,2));console.error(error.stack);process.exitCode=1;
 }finally{if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});if(context)await context.close();if(browser)await browser.close();}
}
module.exports={exact};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
