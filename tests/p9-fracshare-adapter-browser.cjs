// Actual B18 fraction-sharing controls and checked work in stopped-origin Chromium.
// Only empty lesson positions are seeded. No model, answer, proof or checked
// attempt is inserted into the browser. Expected quantities come from the
// independent source fixture, not the production adapter or generic solver.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {observeBrowserDiagnostics}=require('./helpers/p9-browser-diagnostics.cjs');
const fixture=require('./fixtures/p9-fracshare-cases.cjs'),{cases,bridges,practices}=fixture;
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-fracshare-adapter');
const viewports=[[1440,900],[1280,720]],fields=['guess','factor','answer','equation','story'];
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),hash=task=>digest(JSON.stringify(stable(task)));
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
const rational=(n,d)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n,d);return[Number(n/g),Number(d/g)];};
const name=([n,d])=>d===1?String(n):n+'/'+d;
function oracleFor(spec){
 const oracle=spec.expected?spec:cases.find(item=>item.taskHash===spec.taskHash);
 assert.ok(oracle,'associated task has a fixed independently reviewed mathematical source');return oracle.expected;
}
function sharePlan(spec,{round=0,reverse=false,guess}={}){
 const task=spec.task,expected=oracleFor(spec),factor=expected.canonicalFactor*(round%2?2:1);
 assert.ok(expected.legalFactors.includes(factor));
 const total=task.n*factor,perPerson=total/task.people,owners=Array.from({length:total},(_,index)=>index%task.people);
 assert.ok(Number.isInteger(perPerson));
 const people=Array.from({length:task.people},(_,index)=>index);if(reverse)people.reverse();
 const assignments=people.map(person=>{
  const pieceIds=owners.flatMap((owner,index)=>owner===person?[index]:[]);if(reverse)pieceIds.reverse();
  assert.equal(pieceIds.length,perPerson);return{person,pieceIds};
 });
 const answer=name(expected.perPerson),original=name(expected.original);
 return{factor,factorInput:'0x'+factor.toString(16),wholeParts:task.d*factor,totalPieces:total,
  pieceValue:rational(1,task.d*factor),owners,assignments,answer,guess:guess??answer,
  equation:(reverse?task.people+'×'+answer:answer+'×'+task.people)+'='+original,
  story:task.story?task.exampleStory:'',expected};
}

async function main(){
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const checks=[],errors=[],remote=[],observations=[],negatives=[],isolated=[],offline=[],backups=[];
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
 const {fracShareBinding,replayFracShareEvidence}=await import('../dist/learning/fracshare-evidence.js');
 const taskFor=spec=>sessionTasks(spec.id)[spec.index],ctx=spec=>({sessionId:spec.id,index:spec.index});
 for(const spec of [...cases,...bridges])assert.equal(hash(taskFor(spec)),spec.taskHash);
 for(const [file,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected);
 for(const spec of practices)assert.equal(fracShareBinding(spec.task,ctx(spec)),null);
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
      'learning/fracshare-evidence.js','learning/evidence-contract.js','learning/evidence-adapters.js','learning/thinking-feedback.js',
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
    current??=await model(spec);const task=taskFor(spec),b=current.board,denominator=task.d*(b.factor||1);
    const visible=b.started?['factor',...(b.factor?['answer','equation']:[])]:['guess'];if(task.story)visible.push('story');
    for(const key of fields)assert.equal(await page.locator('[data-xfield="'+key+'"]').count(),visible.includes(key)?1:0,label+' source field window '+key);
    assert.equal(await page.locator('[data-x="b18-start"]').count(),b.started?0:1);
    assert.equal(await page.locator('[data-x="b18-cut"]').count(),b.started?1:0);
    assert.equal(await page.locator('[data-x="b18-reset"]').count(),1);
    const bar=page.locator('#extra-visual .b18-sharebar > i');
    assert.equal(await bar.count(),denominator);
    const widths=await bar.evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().width));
    ok(widths.every(value=>value>0)&&Math.max(...widths)-Math.min(...widths)<1,label+' reference whole retains equal positive subdivisions');
    const people=page.locator('#extra-visual [data-x="b18-person"]'),pieces=page.locator('#extra-visual [data-x="b18-give"]');
    assert.equal(await people.count(),b.factor?task.people:0);assert.equal(await pieces.count(),b.owners.length);
    if(b.factor){
     const labels=await people.allTextContents();
     for(let person=0;person<task.people;person++){
      const count=b.owners.filter(owner=>owner===person).length;
      assert.equal(labels[person],'第'+(person+1)+'人 · '+count+'小块');
      assert.equal(await people.nth(person).getAttribute('aria-pressed'),String(b.selected===person));
     }
     const pieceLabels=await pieces.allTextContents();
     assert.deepEqual(pieceLabels,b.owners.map(owner=>owner<0?'待分':'第'+(owner+1)+'人'));
     const identity=await pieces.evaluateAll(elements=>elements.map(e=>Number(e.dataset.index)));
     assert.deepEqual(identity,Array.from({length:task.n*b.factor},(_,index)=>index));
     ok((await page.locator('#extra-visual').innerText()).includes('每小块是原来整个的 1/'+denominator),label+' actual caption keeps the original whole as denominator reference');
    }
   };
   const cutTo=async(spec,plan)=>{
    const selected=(await model(spec)).board.selected;
    await field(spec,'factor',plan.factorInput);const current=await action(spec,'cut');
    assert.equal(current.board.factor,plan.factor);assert.equal(current.board.selected,selected);
    assert.deepEqual(current.board.owners,Array(plan.totalPieces).fill(-1));await visual(spec,current);return current;
   };
   const distribute=async(spec,plan)=>{
    for(const assignment of plan.assignments){
     await action(spec,'person',{index:assignment.person});
     for(const index of assignment.pieceIds)await action(spec,'give',{index});
    }
    assert.deepEqual((await model(spec)).board.owners,plan.owners);
    await field(spec,'answer',plan.answer);await field(spec,'equation',plan.equation);await visual(spec);
   };
   const finish=async(spec,options={})=>{
    const plan=sharePlan(spec,options);
    if(!(await model(spec)).board.started){
     await field(spec,'guess',plan.guess);if(taskFor(spec).story)await field(spec,'story',plan.story);
     await action(spec,'start');
    }
    await cutTo(spec,plan);await distribute(spec,plan);
    const current=await model(spec);assert.equal(M.inspect(taskFor(spec),current).correct,true);return current;
   };
   const proofFor=(spec,current)=>{
    const expected=oracleFor(spec),task=taskFor(spec),proof=replayFracShareEvidence(task,current);assert.ok(proof);
    assert.deepEqual(proof.originalQuantity,expected.original);assert.deepEqual(proof.referenceWhole,expected.referenceWhole);
    assert.deepEqual(proof.result,expected.perPerson);assert.equal(proof.people,expected.people);assert.equal(proof.unit,expected.unit);
    assert.equal(proof.totalPieces,task.n*proof.factor);assert.equal(proof.wholeParts,task.d*proof.factor);
    assert.deepEqual(proof.pieceValue,rational(1,task.d*proof.factor));assert.deepEqual(proof.owners,current.board.owners);
    for(const recipient of proof.recipients){
     assert.equal(recipient.count*proof.people,proof.totalPieces);assert.deepEqual(recipient.amount,expected.perPerson);
     assert.deepEqual(recipient.pieceIds,current.board.owners.flatMap((owner,index)=>owner===recipient.person?[index]:[]));
    }
    assert.deepEqual(proof.answer.value,expected.perPerson);assert.deepEqual(proof.inverse.product,expected.original);
    return proof;
   };
   const wordsFor=async proof=>{
    ok(!!proof&&await hint.isVisible(),label+' strict feedback belongs to the latest complete successful snapshot');
    const words=await hint.innerText();
    ok(/提交/.test(words)&&/系统|工具/.test(words)&&/整条|整体/.test(words),label+' feedback attributes the display and current submitted quantities');
    for(const quantity of [proof.originalQuantity,proof.pieceValue,proof.result])
     ok(words.includes(name(quantity)),label+' feedback retains the exact source quantity '+name(quantity));
    ok(/长期掌握/.test(words)&&/独立作图|自由解释/.test(words),label+' feedback keeps its assessment limits');
    if(proof.story.required)ok(/故事/.test(words)&&/语义|作者/.test(words),label+' story is preserved without semantic or authorship scoring');
    ok(await hint.locator('[data-thinking-node-id]').count()===0&&!/MP\.\d|你已掌握|已经掌握|你独立画|你独立计算/.test(words),label+' fixed source work gets no invented mastery or mathematical-practice claim');
    return words;
   };

   for(const spec of cases){
    label=prefix+'-'+spec.id+'-'+spec.index;const task=taskFor(spec),reverse=width===1280,plan=sharePlan(spec,{reverse});
    await open(spec);assert.equal(fracShareBinding(task,ctx(spec))?.nodeId,spec.nodeId);await visual(spec);
    ok(await guide.isVisible()&&!(await guide.evaluate(e=>e.open)),label+' optional source guide begins collapsed');
    ok(await hint.count()===0,label+' empty work has no strict feedback');
    const beforeGuide=await saved(spec.id);await guide.locator('summary').click();
    ok(await guide.locator('p').isVisible(),label+' real summary opens the optional question');
    let afterGuide;for(let i=0;i<20;i++){afterGuide=await saved(spec.id);if(afterGuide.cases[spec.index]?.support)break;await page.waitForTimeout(50);}
    assert.deepEqual(afterGuide.models,beforeGuide.models);ok(afterGuide.cases[spec.index]?.support===true,label+' support does not manufacture mathematical work');
    await guide.locator('summary').click();
    const snapshots=[],special=[];
    if(spec===cases[0]){
     await field(spec,'guess','?');const rejected=await action(spec,'start');
     assert.equal(rejected.board.started,false);assert.equal(rejected.board.first,null);assert.equal(rejected.issue,'');
     ok(await page.locator('.b18-issue').count()===0,label+' original invalid start is retained without inventing an issue');
     special.push({kind:'invalid-start',model:rejected});
    }
    await field(spec,'guess','0');if(task.story)await field(spec,'story',plan.story);await action(spec,'start');
    assert.equal((await model(spec)).board.first,'0');await visual(spec);
    await field(spec,'factor','1');const invalidCut=await action(spec,'cut');
    assert.equal(invalidCut.board.factor,0);ok(invalidCut.issue&&await page.locator('.b18-issue').isVisible(),label+' failed cut retains the original issue');
    special.push({kind:'invalid-cut',model:invalidCut});
    await cutTo(spec,plan);await distribute(spec,plan);await field(spec,'answer','999');
    snapshots.push(await check(spec,false,'01-wrong-answer'));ok(await hint.count()===0,label+' wrong original submission has no strict evidence');
    await shot('01-wrong-answer');
    await field(spec,'answer',plan.answer);ok(await hint.count()===0,label+' corrected work needs a current checked snapshot');
    snapshots.push(await check(spec,true,'02-corrected-answer'));
    const firstModel=await model(spec),firstProof=proofFor(spec,firstModel),firstWords=await wordsFor(firstProof);
    assert.equal(firstProof.firstGuess.raw,'0');assert.equal(firstProof.firstGuess.matchesResult,false);
    assert.ok(firstProof.failedRequests.some(event=>event.action==='cut'));
    const firstRecord=await saved(spec.id);await reload(spec);
    assert.deepEqual((await saved(spec.id)).models,firstRecord.models);assert.deepEqual((await saved(spec.id)).cases,firstRecord.cases);
    ok(await hint.isVisible(),label+' complete error and correction history restores offline');

    if(spec===cases[0]){
     const [n,d]=plan.expected.perPerson;await field(spec,'answer',2*n+'/'+(2*d));
     assert.equal(M.inspect(task,await model(spec)).correct,true);
     ok(await hint.count()===0,label+' an equivalent edited answer cannot borrow the older complete snapshot');
     await reload(spec);ok(await hint.count()===0,label+' unsubmitted equivalent text stays unchecked after reload');
     snapshots.push(await check(spec,true,'03-equivalent-current-answer'));await wordsFor(proofFor(spec,await model(spec)));
    }
    await action(spec,'person',{index:0});const beforeRepeat=await model(spec),samePerson=await action(spec,'person',{index:0});
    assert.deepEqual(samePerson.board,beforeRepeat.board);assert.equal(samePerson.history.length,beforeRepeat.history.length+1);
    ok(await hint.count()===0,label+' repeated selection is recorded without moving a piece or borrowing old feedback');
    const withdrawn=await action(spec,'give',{index:0});assert.equal(withdrawn.board.owners[0],-1);
    snapshots.push(await check(spec,false,'04-withdrawn-piece'));ok(await hint.count()===0,label+' correct written quantities do not replace an actually distributed piece');
    await action(spec,'person',{index:1});await action(spec,'give',{index:0});
    assert.equal(M.inspect(task,await model(spec)).correct,false);
    await action(spec,'person',{index:0});const transferred=await action(spec,'give',{index:0});assert.equal(transferred.board.owners[0],0);
    snapshots.push(await check(spec,true,'05-transfer-corrected'));
    const correctedProof=proofFor(spec,await model(spec));
    assert.ok(correctedProof.assignments.some(event=>event.change==='withdraw'));
    assert.ok(correctedProof.assignments.some(event=>event.change==='transfer'));await wordsFor(correctedProof);

    const beforeFailedRecut=await model(spec);await field(spec,'factor','1');const failedRecut=await action(spec,'cut');
    assert.deepEqual(failedRecut.board,beforeFailedRecut.board);assert.ok(failedRecut.issue);
    await field(spec,'factor',plan.factorInput);const correctedText=await model(spec);
    assert.equal(correctedText.issue,failedRecut.issue);assert.equal(M.inspect(task,correctedText).correct,true);
    ok(await hint.count()===0,label+' textual correction after failed recutting still needs a fresh checked snapshot');
    snapshots.push(await check(spec,true,'06-failed-recut-text-corrected'));
    const failedRecutProof=proofFor(spec,correctedText);assert.equal(failedRecutProof.issue,failedRecut.issue);
    ok((await wordsFor(failedRecutProof)).includes('提示仍保留'),label+' strict feedback preserves the real last failure');
    await shot('06-failed-recut-text-corrected');
    special.push({kind:'terminal-failed-recut',failedRecut,correctedText,proof:failedRecutProof});

    const recutPlan=sharePlan(spec,{round:1,reverse:!reverse}),recut=await cutTo(spec,recutPlan);
    assert.equal(recut.board.selected,correctedText.board.selected);assert.equal(recut.issue,'');
    ok(await hint.count()===0,label+' successful recutting clears the current allocation and invalidates old feedback');
    await action(spec,'give',{index:0});const partial=await model(spec);await reload(spec);
    assert.deepEqual(await model(spec),partial);ok(await hint.count()===0,label+' partial recut is restored without obsolete evidence');
    const reset=await action(spec,'reset');assert.equal(reset.board.first,'0');assert.equal(reset.board.started,false);
    assert.equal(reset.board.factor,0);assert.deepEqual(reset.board.owners,[]);assert.equal(reset.board.selected,0);
    for(const key of Object.keys(M.fields))assert.equal(reset[key],partial[key],label+' reset retains the original input '+key);
    assert.deepEqual(reset.history.slice(0,partial.history.length),partial.history);await visual(spec,reset);
    snapshots.push(await check(spec,false,'07-reset-current-work'));await reload(spec);
    assert.deepEqual(await model(spec),reset);ok(await hint.count()===0,label+' reset and first guess restore without reviving old feedback');

    const rebuiltModel=await finish(spec,{round:1,reverse:!reverse}),rebuiltProof=proofFor(spec,rebuiltModel);
    assert.equal(rebuiltProof.firstGuess.raw,'0');assert.equal(rebuiltProof.currentGuess.raw,plan.answer);
    assert.equal(rebuiltProof.currentGuess.matchesResult,true);assert.equal(rebuiltProof.resets.length,1);
    assert.ok(rebuiltProof.cutRequests.filter(event=>event.accepted).length>=3);
    assert.ok(rebuiltProof.assignments.some(event=>event.change==='withdraw')&&rebuiltProof.assignments.some(event=>event.change==='transfer'));
    ok(await hint.count()===0,label+' distinct rebuilt work must receive its own real check');
    snapshots.push(await check(spec,true,'08-rechecked-rebuild'));
    const finalRecord=await saved(spec.id),finalModel=finalRecord.models[spec.index],finalProof=proofFor(spec,finalModel),finalWords=await wordsFor(finalProof);
    assert.deepEqual(finalRecord.cases[spec.index].attempts,snapshots.map(item=>item.attempt));
    assert.deepEqual(finalRecord.cases[spec.index].attempts.slice(0,firstRecord.cases[spec.index].attempts.length),firstRecord.cases[spec.index].attempts);
    await reload(spec);assert.deepEqual((await saved(spec.id)).models,finalRecord.models);assert.deepEqual((await saved(spec.id)).cases,finalRecord.cases);
    ok(await hint.isVisible(),label+' final current work and every earlier checked snapshot survive offline');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
    await visual(spec,finalModel);await shot('final-verified');
    observations.push({width,height,id:spec.id,index:spec.index,nodeId:spec.nodeId,taskHash:spec.taskHash,task,
     snapshots,special,firstModel,firstProof,firstWords,correctedProof,recut,partial,reset,rebuiltModel,rebuiltProof,
     finalModel,finalProof,finalWords,record:finalRecord,stored:await snapshot('final')});
    // This probe changes a Node copy only. No hidden control is claimed to
    // have been clicked or injected into the actual browser.
    const hidden=structuredClone(finalModel);hidden.guess='1';
    assert.equal(M.valid(task,hidden),true);assert.equal(M.inspect(task,hidden).correct,true);
    assert.equal(replayFracShareEvidence(task,hidden),null);
    negatives.push({width,height,id:spec.id,index:spec.index,syntheticRejectionProbe:true,
     kind:'hidden-guess-edit',model:hidden,originalCorrect:true,strictRejected:true});
   }

   for(const spec of bridges){
    label=prefix+'-associated-'+spec.id+'-'+spec.index;await open(spec);const nativeBefore=structuredClone((await state()).lessons);
    assert.equal(fracShareBinding(taskFor(spec),ctx(spec)),null);ok(await guide.count()===0&&await hint.count()===0,label+' associated copy has no borrowed native guide or evidence');
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
   await importFile('fracshare-real-browser-v2.json');const restored=await readPage(restorePage),restoredState=JSON.parse(restored.text);
   assert.deepEqual(restoredState,backup.state);
   assert.deepEqual(restoredState.lessons,backup.state.lessons);assert.deepEqual(restoredState.daily.bridges,backup.state.daily.bridges);
   for(const spec of cases)proofFor(spec,restoredState.lessons[spec.id].models[spec.index]);
   const firstImportFile=label+'-first-import-storage.txt';fs.writeFileSync(path.join(out,firstImportFile),restored.raw);
   await importFile('fracshare-identical-repeat-v2.json');const repeated=await readPage(restorePage);assert.equal(repeated.raw,restored.raw);
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
    originStopped:!server.listening,nativeCases:cases.length,associatedCases:bridges.length,idempotent:true});
   provenance.realBrowserBackupImport=true;provenance.backupImportsCompleted=backups.length;
   await context.close();contexts.delete(context);await restoreContext.close();contexts.delete(restoreContext);activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  ok(observations.length===10&&isolated.length===14&&backups.length===2,'all five native and seven associated tasks ran in both viewports with real backup restoration');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,backups,viewports,provenance},null,2));
  console.log('P9_FRACSHARE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length,native:observations.length,associated:isolated.length,backups:backups.length,negativeCopies:negatives.length}));
 }catch(error){
  if(error.diagnosticPage)activePage=error.diagnosticPage;
  if(activePage&&diagnostics.has(activePage))failureDiagnostic=await diagnostics.get(activePage).dump(error).catch(failure=>({diagnosticError:String(failure)}));
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,negatives,isolated,offline,backups,viewports,provenance,
   failureDiagnostic,error:String(error),stack:error.stack,at:label},null,2));console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  for(const context of contexts)await context.close();if(browser)await browser.close();
 }
}

module.exports={sharePlan};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
