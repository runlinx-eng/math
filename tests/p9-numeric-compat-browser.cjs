// Signed mixed-number repair: actual file import/export, read-only legacy work,
// explicit safe retries, and finite prediction geometry through real controls.
// Fixtures are constructed historical API records, never children's backups.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const fixture=require('./fixtures/p9-numeric-legacy.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-numeric-compat');
const KEY='math-explorer-v2',viewports=[[1440,900],[1280,720]];
const checks=[],errors=[],remote=[],offline=[],observations=[],legacyFiles=new Map();
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ok=(value,label,details={})=>{assert.ok(value,label);checks.push({label,...details});};
const cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 oldCommit:fixture.sourceCommit,constructedLegacyFixture:true,realHistoricalChildBackup:false,
 fullServiceWorkerUpgrade:false,childTrial:false,independentTeachingReview:false};
const oldFile=name=>{
 if(!legacyFiles.has(name)){
  const bytes=execFileSync('git',['show',fixture.sourceCommit+':dist/'+name],{cwd:root,maxBuffer:8*1024*1024});
  legacyFiles.set(name,{bytes,sha256:digest(bytes)});
 }
 return legacyFiles.get(name).bytes;
};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 assert.equal(digest(oldFile('learning/phase5/b20-model.js')),fixture.sourceHashes.b20);
 assert.equal(digest(oldFile('learning/phase5/b24-model.js')),fixture.sourceHashes.b24);
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const M=await import('../dist/learning/phase5/b24-model.js');
 const {inspect}=await import('../dist/learning/tasks.js');
 const {lessonSummary,numericCompatibility,validStoredModel}=await import('../dist/learning/state.js');
 let browser,server,activePage,label='setup';const contexts=new Set();
 const read=page=>page.evaluate(async key=>{
  const {readStored}=await import('./storage.js');return {raw:localStorage.getItem(key),text:readStored(key)};
 },KEY);
 const state=async page=>JSON.parse((await read(page)).text);
 const capture=async(page,name)=>{
  const saved=await read(page);fs.writeFileSync(path.join(out,name+'-storage.txt'),saved.raw??'');
  fs.writeFileSync(path.join(out,name+'-state.json'),saved.text??'null');return JSON.parse(saved.text);
 };
 const shot=async(page,name)=>{
  await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
  await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 };
 try{
  browser=await chromium.launch({headless:true,
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  provenance.browserVersion=browser.version();
  for(const [width,height]of viewports){
   const prefix=width+'x'+height;label=prefix+'-setup';
   server=http.createServer((req,res)=>{
    const rel=new URL(req.url,'http://localhost').pathname.replace(/^\/+/, '')||'index.html';
    if(rel==='__numeric_old_probe__.html'){
     res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
     res.end('<!doctype html><meta charset="utf-8"><title>Historical validator probe</title>');return;
    }
    if(rel.startsWith('__numeric_old__/')){
     const name=rel.slice('__numeric_old__/'.length);
     try{const bytes=oldFile(name);res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}
     catch{res.writeHead(404);res.end('missing historical resource');}return;
    }
    fs.readFile(path.join(root,'dist',rel),(error,data)=>{
     res.writeHead(error?404:200,{'Content-Type':mime[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});
     res.end(error?'missing':data);
    });
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base='http://127.0.0.1:'+server.address().port+'/';
   const openContext=async role=>{
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',acceptDownloads:true});contexts.add(context);
    context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push({role,url:r.url()});});
    context.on('page',p=>p.on('pageerror',error=>errors.push({label,role,error:String(error)})));
    const page=await context.newPage();page.setDefaultTimeout(20000);return {context,page};
   };
   const source=await openContext('source'),legacyTarget=await openContext('legacy-backup-import'),target=await openContext('independent-import');
   const page=activePage=source.page;
   const trail=async p=>{activePage=p;const response=await p.goto(base+'v2.html#trail');await p.locator('#import-file').waitFor({state:'attached'});return response;};
   const waitLesson=(p,id)=>p.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,id);
   const lesson=async(p,id)=>{
    activePage=p;const response=await p.goto(base+'learn.html#'+id);await waitLesson(p,id);
    ok(response?.fromServiceWorker()===true,label+' learning document comes from the stopped-origin cache');
   };
   const reload=async(p,id)=>{
    const response=await p.reload();await waitLesson(p,id);
    ok(response?.fromServiceWorker()===true,label+' reload comes from the stopped-origin cache');
   };
   const importFile=async(p,payload,name)=>{
    activePage=p;await p.locator('#import-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(payload)});
    await p.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    return p.locator('#toast').innerText();
   };
   const exportFile=async(p,name,action='export')=>{
    activePage=p;const downloaded=p.waitForEvent('download');await p.locator(`[data-do="${action}"]`).first().click();
    const file=await downloaded,payload=fs.readFileSync(await file.path(),'utf8');
    fs.writeFileSync(path.join(out,name+'.json'),payload);
    const backup=JSON.parse(payload);assert.deepEqual(backup.state,await state(p));
    ok(true,label+' actual downloaded backup contains the entire current stored state');return {payload,backup};
   };
   const warm=async(p,role)=>{
    await trail(p);let report={ready:false};
    for(let i=0;i<300;i++){
     report=await p.evaluate(async expected=>{
      const registration=await navigator.serviceWorker.getRegistration(),worker=navigator.serviceWorker.controller;
      const identity={controller:worker?.scriptURL||null,active:registration?.active?.scriptURL||null,
       activeState:registration?.active?.state||null,waiting:registration?.waiting?.scriptURL||null,installing:registration?.installing?.scriptURL||null};
      if(!worker||worker!==registration?.active||worker.state!=='activated'||new URL(worker.scriptURL).searchParams.get('release')!==expected)return {ready:false,...identity};
      const status=await new Promise(resolve=>{
       const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},1200);
       channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
       worker.postMessage({type:'math-explorer:cache-status'},[channel.port2]);
      });
      return {...identity,status,ready:status?.cache===expected&&status.complete===true&&status.cached===status.total&&status.total>0};
     },cache);
     if(report.ready===true)break;await p.waitForTimeout(100);
    }
    const modules=await p.evaluate(async expected=>{
     const store=await caches.open(expected);return Promise.all(['learning/state.js','learning/learn.js','learning/phase5/b20-model.js',
      'learning/phase5/b24-model.js','learning/phase5/b24-view.js','exploration-core.js','learning/thinking-feedback.js']
      .map(async name=>({name,cached:!!await store.match(new URL(name,location.href))})));
    },cache);
    const result={width,height,role,cache,report,modules,missing:modules.filter(x=>!x.cached).map(x=>x.name),originStopped:false};offline.push(result);
    ok(report.ready===true&&result.missing.length===0,prefix+' '+role+' current activated controller has complete offline dependencies',result);return result;
   };
   const sourceOffline=await warm(page,'source'),legacyOffline=await warm(legacyTarget.page,'legacy-backup-import'),targetOffline=await warm(target.page,'independent-import');
   // Load original, unmodified historical modules under a separate URL before
   // stopping the server. This verifies the fixture's original semantics, not
   // a complete service-worker upgrade or every historical writer.
   const oldPage=await source.context.newPage();await oldPage.goto(base+'__numeric_old_probe__.html');
   const oldAccepted=await oldPage.evaluate(async payload=>{
    const [core,tasks,bridges,atlas]=await Promise.all([import('./__numeric_old__/exploration-core.js'),
     import('./__numeric_old__/learning/tasks.js'),import('./__numeric_old__/learning/bridges.js'),
     fetch('./__numeric_old__/data/atlas.json').then(r=>r.json())]);
    window.numericOldProbe={core,atlas};const parsed=core.parseBackup(payload,atlas);
    return {state:parsed,pointCorrect:tasks.inspect(bridges.sessionTasks('pointmove')[0],parsed.lessons.pointmove.models[0]).correct};
   },JSON.stringify(fixture.backup));
   assert.deepEqual(oldAccepted.state,fixture.backup.state);
   ok(oldAccepted.pointCorrect,prefix+' unchanged historical reader accepts its own constructed legacy record');
   const oldUI=await source.context.newPage();oldUI.setDefaultTimeout(20000);
   await oldUI.goto(base+'__numeric_old__/learn.html#share');
   await oldUI.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='share');
   await oldUI.locator('#actions [data-do="check"]').waitFor();
   const oldUIBefore=await oldUI.evaluate(()=>({snapshot:window.mathLesson.snapshot(),raw:localStorage.getItem('math-explorer-v2')}));
   let oldPointBefore=null;
   const oldShare=JSON.parse(oldUIBefore.raw).lessons.share;
   ok(JSON.parse(oldUIBefore.raw).schema===2&&oldShare?.models?.[0],prefix+' original historical learning page remains open with a real V2 workpiece');
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   sourceOffline.originStopped=legacyOffline.originStopped=targetOffline.originStopped=!server.listening;
   ok(!server.listening,prefix+' HTTP origin stops before all imports and mathematical interactions');

   label=prefix+'-legacy-import';
   const payload=JSON.stringify(fixture.backup);
   fs.writeFileSync(path.join(out,prefix+'-constructed-legacy-v2.json'),payload);
   ok((await importFile(page,payload,'constructed-legacy-v2.json')).includes('备份已合并'),label+' real file import accepts preserved historical data');
   const imported=await capture(page,label);
   for(const [id,record]of Object.entries(fixture.backup.state.lessons))assert.deepEqual(imported.lessons[id],record);
   assert.deepEqual(imported.lessons.share,oldShare);
   ok(imported.schema===2,label+' importing legacy data alone does not rewrite its format');
   const importBytes=(await read(page)).text;
   ok((await importFile(page,payload,'identical-legacy-v2.json')).includes('备份已合并'),label+' identical historical file imports again');
   ok((await read(page)).text===importBytes,label+' repeated historical import is byte-idempotent');
   const initialExport=await exportFile(page,prefix+'-before-retry-export');
   ok(initialExport.backup.version===2,label+' pre-retry export remains V2');
   for(const spec of fixture.legacyCases){
    label=prefix+'-legacy-'+spec.id;await lesson(page,spec.id);
    const record=(await state(page)).lessons[spec.id],t=sessionTasks(spec.id)[spec.index],m=record.models[spec.index];
    ok(numericCompatibility(t,m)&&validStoredModel(t,m)&&!M.valid(t,m),label+' only the storage compatibility boundary accepts the unchanged legacy model');
    ok(!inspect(t,m).correct&&!lessonSummary(record).cases[spec.index].complete,label+' historical parser success does not become current mathematical completion');
    ok(await page.locator('#numeric-compat-notice').isVisible(),label+' read-only compatibility notice is visible');
    ok(await page.locator('[data-do="numeric-retry"]').isVisible(),label+' explicit safe retry is available');
    ok(await page.locator('[data-do="numeric-retry"]').isDisabled(),label+' replacing a historical workpiece requires a fresh complete backup download first');
    ok(await page.locator('#work [data-xfield]:enabled,#work [data-x]:enabled').count()===0,label+' legacy mathematical controls cannot mutate the old work');
    const check=page.locator('#actions [data-do="check"]');
    ok(await check.count()===0||await check.isDisabled(),label+' legacy-only work cannot submit as a current answer');
    ok(await page.locator('#thinking-feedback').count()===0,label+' legacy-only work has no positive P9 evidence');
    assert.deepEqual(record.models,fixture.backup.state.lessons[spec.id].models);
    assert.deepEqual(record.cases,fixture.backup.state.lessons[spec.id].cases);
    const secondaryRetry=page.locator('[data-do="p3-retry"]');
    if(await secondaryRetry.count()){
     const beforeSecondaryRetry=await read(page);await secondaryRetry.click();
     const afterSecondaryRetry=await read(page);
     ok(beforeSecondaryRetry.raw===afterSecondaryRetry.raw,label+' secondary retry cannot bypass backup permission or change the original stored work');
     ok(await page.locator('#numeric-compat-notice').isVisible()&&await page.locator('[data-do="numeric-retry"]').isDisabled(),
      label+' secondary retry leads back to the explicit backup boundary');
    }
    await shot(page,label+'-read-only');await reload(page,spec.id);
    const reopened=(await state(page)).lessons[spec.id];
    assert.deepEqual(reopened.models,record.models);assert.deepEqual(reopened.cases,record.cases);
    assert.deepEqual(reopened.notes,record.notes);assert.equal(reopened.draft,record.draft);
    ok(await page.locator('#numeric-compat-notice').isVisible(),label+' offline reload preserves the read-only boundary');
   }

   const reveal=async control=>{
    const details=control.locator('xpath=ancestor::details[1]');
    if(await details.count()&&!(await details.evaluate(e=>e.open)))await details.locator(':scope > summary').click();
   };
   const field=async(key,value)=>{
    const control=page.locator(`[data-xfield="${key}"]`);await reveal(control);
    if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));else await control.fill(String(value));
   };
   const click=async name=>{const control=page.locator(`[data-x="${name}"]`);await reveal(control);await control.click();};
   const submit=()=>page.locator('#actions [data-do="check"]').click();
   const checkPrediction=async(id,expectedPoint)=>{
    const raw=(await state(page)).lessons[id].models[0],circle=page.locator('#extra-visual svg circle[stroke="#a488b3"]');
    ok(await circle.count()===1,label+' one actual prediction marker is drawn');
    const actual=await circle.evaluate(e=>({x:Number(e.getAttribute('cx')),y:Number(e.getAttribute('cy'))}));
    const t=sessionTasks(id)[0],[xmin,xmax,ymin,ymax]=t.domain;
    const unit=Math.min(600/(xmax-xmin),370/(ymax-ymin));
    const expected={x:(700-(xmax-xmin)*unit)/2+(expectedPoint[0]-xmin)*unit,
     y:(450+(ymax-ymin)*unit)/2-(expectedPoint[1]-ymin)*unit};
    ok(Number.isFinite(actual.x)&&Number.isFinite(actual.y)&&actual.x===expected.x&&actual.y===expected.y,
     label+' prediction marker has finite correct signed coordinates',{point:expectedPoint,actual,expected});
    ok(!/NaN|Infinity/.test(await page.locator('#extra-visual svg').innerHTML()),label+' prediction SVG contains no invalid numeric geometry');
    return {model:raw,point:expectedPoint,actual,expected};
   };
   const retry=async id=>{
    label=prefix+'-retry-'+id;await lesson(page,id);
    ok(await page.locator('[data-do="numeric-retry"]').isDisabled(),label+' retry begins disabled before the explicit backup action');
    if(id==='pointmove'){
     const firstExport=await exportFile(page,label+'-superseded-backup-v2','numeric-export');
     ok(firstExport.backup.version===2&&await page.locator('[data-do="numeric-retry"]').isEnabled(),label+' actual V2 backup download enables the explicit replacement action');
     const beforeOtherWrite=await read(page);activePage=oldUI;
     await oldUI.locator('#actions [data-do="check"]').click();
     const afterOtherWrite=await read(page);
     ok(afterOtherWrite.text!==beforeOtherWrite.text,label+' a real check in the still-open historical share lesson changes the saved snapshot');
     const preserved=(await state(page)).lessons[id];activePage=page;
     await page.locator('[data-do="numeric-retry"]').click();
     const invalidated=(await state(page)).lessons[id];
     assert.deepEqual(invalidated.models,preserved.models);assert.deepEqual(invalidated.cases,preserved.cases);
     ok(await page.locator('#numeric-compat-notice').isVisible()&&await page.locator('[data-do="numeric-retry"]').isDisabled(),
      label+' any changed storage snapshot invalidates backup permission without replacing the old workpiece');
     await oldUI.goto(base+'__numeric_old__/learn.html#pointmove');
     await oldUI.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='pointmove');
     ok(await oldUI.locator('[data-xfield="answers.0"]').isEnabled(),label+' the unmodified historical page holds the original pointmove workpiece');
     oldPointBefore=await oldUI.evaluate(()=>({snapshot:window.mathLesson.snapshot(),raw:localStorage.getItem('math-explorer-v2'),answer:document.querySelector('[data-xfield="answers.0"]').value}));
    }
    const before=await state(page),record=before.lessons[id],old=record.models[0];
    const savedBackup=await exportFile(page,label+'-preserved-backup-v2','numeric-export');
    assert.deepEqual(savedBackup.backup.state,before);
    ok(savedBackup.backup.version===2&&await page.locator('[data-do="numeric-retry"]').isEnabled(),label+' whole original work is present in an actual downloaded V2 file before retry');
    const notice=await page.locator('#numeric-compat-notice').innerText();
    ok(!/已(?:成功)?(?:保存|下载)(?:到|在)?(?:本地|磁盘|文件)/.test(notice),label+' UI does not claim that starting a download proves a file was saved');
    await page.locator('[data-do="numeric-retry"]').click();
    await page.locator('[data-xfield="predX"]').waitFor();
    const after=await state(page),current=after.lessons[id];
    ok(after.schema===2&&!Object.hasOwn(current,'numericArchives'),label+' retry retains the established V2 storage format');
    assert.deepEqual(savedBackup.backup.state.lessons[id].models[0],old);
    assert.deepEqual(current.cases,record.cases);assert.deepEqual(current.notes,record.notes);assert.equal(current.draft,record.draft);
    for(const [index,m]of Object.entries(record.models))if(index!=='0')assert.deepEqual(current.models[index],m);
    for(const [other,r]of Object.entries(before.lessons))if(other!==id)assert.deepEqual(after.lessons[other],r);
    ok(!numericCompatibility(sessionTasks(id)[0],current.models[0])&&M.valid(sessionTasks(id)[0],current.models[0])&&current.models[0].history.length===0,
     label+' safe retry creates a fresh valid model without invented actions');
    ok(await page.locator('#numeric-compat-notice').count()===0&&await page.locator('#thinking-feedback').count()===0,label+' fresh work has no inherited completion feedback');
    await capture(page,label+'-fresh');await shot(page,label+'-fresh');return {before:record,oldWorkpiece:old,savedBackup};
   };

   const pointRetry=await retry('pointmove');
   const beforeOldWrite=await read(page);activePage=oldUI;
   await oldUI.locator('[data-xfield="answers.0"]').fill('6');
   await oldUI.locator('#storage-warning').waitFor();
   const oldWarning=await oldUI.locator('#storage-warning').innerText(),afterOldWrite=await read(page);
   ok(/停止|覆盖|原有记录/.test(oldWarning),label+' ordinary edit in a still-open historical page visibly detects the changed workpiece',{warning:oldWarning});
   ok(beforeOldWrite.raw===afterOldWrite.raw&&beforeOldWrite.text===afterOldWrite.text,label+' this real old-page edit preserves every stored byte through the existing same-lesson conflict guard');
   await shot(oldUI,prefix+'-old-active-page-write-blocked');activePage=page;
   await field('predX','-0 5/1');await field('predY','3');await click('p24-predict');
   const negativePrediction=await checkPrediction('pointmove',[-5,3]);
   ok(negativePrediction.model.board.first.incorrectPrediction===true,label+' negative five remains a valid wrong prediction, not positive five');
   await shot(page,label+'-negative-prediction');
   await field('dx','-0 2/1');await field('dy','0');await click('p24-operate');
   let point=(await state(page)).lessons.pointmove;
   ok(same(point.models[0].board.image,[[0,3]]),label+' negative-zero mixed movement actually moves left by two');
   await field('dx','3');await click('p24-operate');
   await field('answers.0','-0 5/1');await field('answers.1','3');await submit();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise'&&await page.locator('#thinking-feedback').count()===0,
    label+' negative five is rejected as the positive-five answer');
   await field('answers.0','5');await submit();
   ok(await page.locator('#check-feedback').getAttribute('data-state')==='correct',label+' new correct work passes after actual correction');
   point=(await state(page)).lessons.pointmove;
   assert.deepEqual(point.cases[0].attempts.slice(0,pointRetry.before.cases[0].attempts.length),pointRetry.before.cases[0].attempts);
   assert.deepEqual(pointRetry.savedBackup.backup.state.lessons.pointmove.models[0],pointRetry.oldWorkpiece);
   ok(point.cases[0].attempts.length===3&&!lessonSummary(point).cases[0].independent,label+' historical attempt and two new real submissions retain their provenance');
   await reload(page,'pointmove');
   assert.deepEqual((await state(page)).lessons.pointmove.models,point.models);
   assert.deepEqual((await state(page)).lessons.pointmove.cases,point.cases);
   await capture(page,prefix+'-pointmove-after-new-work');

   const growRetry=await retry('growshape');
   ok(Object.keys(growRetry.before.cases).length===0,label+' the complete exported legacy draft remains unsubmitted without an invented attempt');
   await field('predX','-1 1/2');await field('predY','-0 1/2');await click('p24-predict');
   const mixedPrediction=await checkPrediction('growshape',[-1.5,-0.5]);await shot(page,label+'-mixed-prediction');
   await field('factor','-0 1/2');await field('cx','0');await field('cy','0');await click('p24-operate');
   let grow=(await state(page)).lessons.growshape;
   ok(grow.models[0].board.image===null&&!!grow.models[0].issue,label+' negative scale is rejected without fabricating a positive image');
   await submit();ok(await page.locator('#check-feedback').getAttribute('data-state')==='revise'&&await page.locator('#thinking-feedback').count()===0,
    label+' invalid negative scale cannot produce positive completion or P9 evidence');
   await field('factor','2');await click('p24-operate');await click('p24-measure');
   for(const [i,q]of sessionTasks('growshape')[0].questions.entries())await field('answers.'+i,q.value);
   await submit();grow=(await state(page)).lessons.growshape;
   ok(inspect(sessionTasks('growshape')[0],grow.models[0]).correct&&await page.locator('#check-feedback').getAttribute('data-state')==='correct',
    label+' original correction workflow remains usable under fixed numeric semantics');
   ok(await page.locator('#thinking-feedback').count()===0,label+' correcting an invalid operation does not invent strict mathematical history');
   assert.deepEqual(growRetry.savedBackup.backup.state.lessons.growshape.models[0],growRetry.oldWorkpiece);
   ok(grow.cases[0].attempts.length===2,label+' only the two real new submissions enter the attempt list');
   assert.deepEqual(grow.notes,growRetry.before.notes);assert.equal(grow.draft,growRetry.before.draft);
   await reload(page,'growshape');assert.deepEqual((await state(page)).lessons.growshape.cases,grow.cases);
   await shot(page,label+'-corrected');

   label=prefix+'-unaffected';const beforeOther=(await state(page)).lessons.lineplaces;
   assert.deepEqual(beforeOther,fixture.backup.state.lessons.lineplaces);
   await lesson(page,'lineplaces');
   ok(await page.locator('#thinking-feedback').isVisible(),label+' existing correct mathematical evidence in another family remains available');
   const afterOther=(await state(page)).lessons.lineplaces;
   assert.deepEqual(afterOther.models,beforeOther.models);assert.deepEqual(afterOther.cases,beforeOther.cases);
   assert.deepEqual(afterOther.notes,beforeOther.notes);assert.equal(afterOther.draft,beforeOther.draft);

   label=prefix+'-legacy-backup-restore';
   const emptyLegacy=await read(legacyTarget.page);
   ok(emptyLegacy.raw===null&&emptyLegacy.text===null,label+' old-workpiece restore uses independent empty storage');
   ok((await importFile(legacyTarget.page,pointRetry.savedBackup.payload,'before-retry-v2.json')).includes('备份已合并'),label+' the actual pre-retry V2 download restores offline');
   const restoredLegacy=await capture(legacyTarget.page,prefix+'-restored-original-v2');
   assert.deepEqual(restoredLegacy,pointRetry.savedBackup.backup.state);
   for(const spec of fixture.legacyCases){
    const expected=pointRetry.savedBackup.backup.state.lessons[spec.id];
    await lesson(legacyTarget.page,spec.id);
    ok(await legacyTarget.page.locator('#numeric-compat-notice').isVisible(),label+' restored '+spec.id+' work retains its read-only mathematics boundary');
    ok(await legacyTarget.page.locator('[data-do="numeric-retry"]').isDisabled(),label+' restoring a backup does not inherit an earlier page download permission');
    await reload(legacyTarget.page,spec.id);
    const restoredRecord=(await state(legacyTarget.page)).lessons[spec.id];
    assert.deepEqual(restoredRecord.models,expected.models);assert.deepEqual(restoredRecord.cases,expected.cases);
    assert.deepEqual(restoredRecord.notes,expected.notes);assert.equal(restoredRecord.draft,expected.draft);
   }
   await shot(legacyTarget.page,label+'-original-draft');

   label=prefix+'-new-work-export';await trail(page);
   const finalState=await capture(page,prefix+'-before-final-v2-export'),exported=await exportFile(page,prefix+'-new-work-export-v2');
   ok(exported.backup.version===2&&exported.backup.state.schema===2,label+' completed new work and unchanged historical attempts export in established V2 format');

   label=prefix+'-new-work-import';
   const emptyFinal=await read(target.page);
   ok(emptyFinal.raw===null&&emptyFinal.text===null,label+' destination context contains no inherited lessons');
   ok((await importFile(target.page,exported.payload,'new-work-v2.json')).includes('备份已合并'),label+' actual final V2 file imports offline into independent storage');
   const restored=await capture(target.page,prefix+'-restored-final-v2');assert.deepEqual(restored,finalState);
   const restoredBytes=(await read(target.page)).text;
   ok((await importFile(target.page,exported.payload,'identical-new-work-v2.json')).includes('备份已合并'),label+' the same final file imports again');
   ok((await read(target.page)).text===restoredBytes,label+' repeated final V2 import is byte-idempotent');
   const response=await target.page.reload();await target.page.locator('#import-file').waitFor({state:'attached'});
   ok(response?.fromServiceWorker()===true,label+' restored new work reloads with the origin stopped');
   assert.deepEqual(await state(target.page),restored);
   await exportFile(target.page,prefix+'-restored-export-v2');await shot(target.page,label+'-restored');
   ok(await target.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
   observations.push({width,height,legacyImported:imported,negativePrediction,mixedPrediction,pointRetry,growRetry,
    oldActivePage:{initial:oldUIBefore,pointBefore:oldPointBefore,warning:oldWarning,beforeWrite:beforeOldWrite,afterWrite:afterOldWrite,scope:'ordinary edit uses the existing same-lesson conflict guard'},
    finalState,restored,restoredLegacy,exports:{initialVersion:initialExport.backup.version,finalVersion:exported.backup.version,
     finalSha256:digest(exported.payload)}});
   for(const item of [source,legacyTarget,target]){await item.context.close();contexts.delete(item.context);}activePage=null;
  }
  ok(errors.length===0,'no browser runtime errors');ok(remote.length===0,'no external requests');
  const result={checks,errors,remote,offline,observations,viewports,provenance,
   historicalFiles:[...legacyFiles].map(([name,v])=>({name,sha256:v.sha256})),originStopped:offline.every(x=>x.originStopped)};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
  console.log('P9_NUMERIC_COMPAT_BROWSER_OK '+JSON.stringify({checks:checks.length,viewports:viewports.length,legacyCases:fixture.legacyCases.length}));
 }catch(error){
  if(activePage)await activePage.screenshot({path:path.join(out,label+'-failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,offline,observations,provenance,error:String(error),stack:error.stack,at:label},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  for(const context of contexts)await context.close();if(browser)await browser.close();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
