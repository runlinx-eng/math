'use strict';
 // #342 P007l original B25 sas controls/Check and complete real State-v2/offline source.
 const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
 const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
 const {execFileSync}=require('node:child_process');
 const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
 const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
 const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
 const specs=[{"sessionId":"triangledraw","index":0,"nodeId":"mt_Jf8xcX4UTq","sha":"d78e88326c59af0ccc0ca3efe5f5504d3f8ba3a84a5299983709bc47d140aced","prompt":"先画7厘米底边，再从A点画5厘米的边，夹角40°；找出第三个顶点。","mode":"sas","target":{"base":7,"a":5,"angle":40},"chooseCount":1,"questions":[{"label":"夹角多少度","value":40}]},{"sessionId":"trianglecongruent","index":0,"nodeId":"mt_167X6Ax8P7","sha":"8bdcc1a887e2c7ae16d5c0a62eb8492cb8d5f4931e7d6f8061c8aa6d5f8e6546","prompt":"两边分别是7、5厘米，它们之间的角是40°。画出三角形。","mode":"sas","target":{"base":7,"a":5,"angle":40},"chooseCount":1,"questions":[{"label":"两边和夹角","value":"sas","options":[["sas","可以确定一个三角形形状"],["ssa","总会有两个不同形状"]]}]},{"sessionId":"trianglecongruent","index":3,"nodeId":"mt_167X6Ax8P7","sha":"c59ca48c2f01cef41ec430856d75412dc35f4b08f18a5b0fc2d61ce3e6c945d2","prompt":"两条直角边分别是6厘米和4厘米。","mode":"sas","target":{"base":6,"a":4,"angle":90},"chooseCount":1,"questions":[{"label":"这是一种","value":"right","options":[["right","两直角边确定的直角三角形"],["oblique","没有直角的三角形"]]}]},{"sessionId":"trianglepossible","index":5,"nodeId":"mt_4bc3EAxhlY","sha":"e371888c52fd73a0d699bcaab3331d09089cad2950bf907452c7d6af84543ddc","prompt":"仍用7厘米、5厘米和40°，这次让40°夹在两条已知边之间。","mode":"sas","target":{"base":7,"a":5,"angle":40},"chooseCount":1,"questions":[{"label":"不计翻面，有几种不同形状","value":1}]}];
 const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-p007l-triangle-sas');
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
 const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
 const checks=[],errors=[],captures=[],screenshots=[],nativeHashes=[];
 let stage='startup';const ok=(v,s)=>{assert.ok(v,stage+': '+s);checks.push(stage+': '+s);};
 function persist(){fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
   schema:'math-p007l-native-triangle-sas-browser/1',
   provenance:{repository:'runlinx-eng/math',issue:342,headSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,strictAApproved:false,
   physicalRulerOrCompassSkillAssessed:false,childTrial:false},
   nativeHashes,viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
  },null,2)+'\n');
 }
 async function run(){
  fs.mkdirSync(out,{recursive:true});
  const cand=await import(pathToFileURL(path.join(root,'dist/learning/p007l-triangle-sas-evidence.js')).href);
  let origin,browser,ctx,page;
  try{
   origin=await createOrigin(root);
   browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
    ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
   ctx=await newDesktopContext(browser,{reducedMotion:'reduce',
    serviceWorkers:'allow',acceptDownloads:true});
   page=await ctx.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(stage+': '+String(e)));
   ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin.base))
    errors.push(stage+': unexpected external '+r.url());});
   const sw=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8');
   const release=sw.match(/const CACHE = '([^']+)'/)?.[1];
   ok(!!release,'original SW release identified');
   await page.goto(origin.base+'v2.html#trail');await page.locator('#main [data-do="export"]').first().waitFor();
   await warmAndStop(page,origin,release,ok,stage);
   const reveal=async loc=>{
    assert.equal(await loc.count(),1,stage+': exactly one native control');
    for(let n=0;n<10&&!(await loc.isVisible());n++){
     const p=loc.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
     assert.equal(await p.count(),1,stage+': one collapsed ancestor');
     await p.locator(':scope > summary').click();
    }
    assert.ok(await loc.isVisible(),stage+': original control visible');
   };
   const field=async(k,v)=>{
    const l=page.locator('#extra-controls [data-xfield="'+k+'"]');await reveal(l);
    if(await l.evaluate(el=>el.tagName==='SELECT'))await l.selectOption(String(v));
    else await l.fill(String(v));
   };
   const action=async(name,index)=>{
    const selector='#extra-controls [data-x="g25-'+name+'"]'+
     (index===undefined?'':'[data-index="'+index+'"]');
    const l=page.locator(selector);await reveal(l);await l.click();
   };
   const check=async()=>{const l=page.locator('#actions [data-do="check"]');
    await reveal(l);await l.click();};
   for(const s of specs){
    const position=s.sessionId+':'+s.index,label=s.sessionId+'-'+s.index;
    const spec={id:s.sessionId,index:s.index};
    stage=position+':native-source';
    await page.goto(origin.base+'v2.html#trail');
    const nav=await page.goto(origin.base+'learn.html#'+s.sessionId);
    ok(nav?.fromServiceWorker()===true,'original lesson loaded via offline SW');
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,s.sessionId);
    const untouched=await page.evaluate(async({id,index})=>{
     const {packText,unpackText}=await import('./storage.js');
     const data=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
     const l=data.lessons[id];
     if(!l||l.cases?.[index]?.attempts?.length)throw Error('requires untouched native task');
     l.index=index;l.view='task';
     localStorage.setItem('math-explorer-v2',packText(JSON.stringify(data)));
     return l.cases?.[index]?.attempts?.length||0;
    },spec);
    ok(untouched===0,'original target untouched');
    const load=await page.reload();ok(load?.fromServiceWorker()===true,'target source offline reload');
    await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
    const source=await page.evaluate(async({id,index})=>{
     const {sessionTaskFor}=await import('./learning/bridges.js');
     const {LESSONS}=await import('./learning/catalog.js');
     return {task:sessionTaskFor(id,index),nodeId:LESSONS[id].topicId};
    },spec);
    const hash=digest(source.task);
    console.log('P007L_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
    nativeHashes.push({position,sha256:hash,nodeId:source.nodeId});
    ok(hash===s.sha&&source.nodeId===s.nodeId&&source.task.type==='x-g25-triangle'&&
     source.task.mode==='sas','exact original source, SHA and triangle mode');
    ok(cand.nativeTriangleBinding(source.task,{sessionId:s.sessionId,index:s.index})?.strictAApproved===false,
     'independent original binding; no formal A');
    ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'desktop viewport');
    ok(await page.locator('#thinking-feedback').count()===0,'candidate not formally registered');
    stage=position+':wrong-original-triangle';
    await field('base',s.target.base-1);await action('base');
    for(const [k,v] of Object.entries(s.target))if(k!=='base'){await field(k,v);await action(k);}
    await action('construct');await action('finish');
    for(let i=0;i<s.questions.length;i++)await field('answers.'+i,s.questions[i].value);
    const before=await capture(page,out,label,spec,'wrong-before-check');
    captures.push({position,phase:'wrong-before-check',storage:before.storage});
    await check();
    const wrong=await capture(page,out,label,spec,'wrong-check');
    captures.push({position,phase:'wrong-check',attempts:wrong.attempts.length,storage:wrong.storage});
    const wrongActual=await page.evaluate(async({id,index,model})=>{
     const {sessionTaskFor}=await import('./learning/bridges.js');
     const n=await import('./learning/phase5/b25-model.js');
     return n.inspect(sessionTaskFor(id,index),model).correct;
    },{...spec,model:wrong.model});
    ok(wrong.attempts.length===1&&!wrongActual,'true rejected first original Check');
    stage=position+':correct-original-triangle';
    await field('base',s.target.base);await action('base');
    await action('construct');
    for(let i=0;i<s.chooseCount;i++)await action('choose',i);
    await action('finish');
    await check();
    const good=await capture(page,out,label,spec,'correct-check');
    captures.push({position,phase:'correct-check',attempts:good.attempts.length,storage:good.storage});
    const actual=await page.evaluate(async({id,index,model})=>{
     const {sessionTaskFor}=await import('./learning/bridges.js');
     const n=await import('./learning/phase5/b25-model.js'),t=sessionTaskFor(id,index);
     return {valid:n.valid(t,model),correct:n.inspect(t,model).correct};
    },{...spec,model:good.model});
    ok(good.attempts.length===2&&actual.valid&&actual.correct,'true corrected native Check');
    const proof=cand.submittedNativeTriangleEvidence(source.task,good.model,good.record,
     {sessionId:s.sessionId,index:s.index});
    ok(proof?.wrongToCorrectOriginalConstructionObserved&&proof.originalConstructCount===2,
     'independent source-bound replay of two actual original Check snapshots');
    ok(proof.independentGeometry.chosenCount===s.chooseCount&&
     proof.independentGeometry.baseCm===s.target.base,
     'independently calculated sas geometry and chosen usable intersections');
    ok(!proof.physicalRulerOrCompassSkillAssessed&&!proof.strictAApproved,
     'no inferred physical skill or formal A');
    const tampered=structuredClone(good.model);tampered.history[0].f.base='100';
    ok(!cand.replayNativeTriangleEvidence(source.task,tampered,{sessionId:s.sessionId,index:s.index})&&
     !cand.submittedNativeTriangleEvidence(source.task,good.model,
      {attempts:good.record.attempts.slice(0,1)},{sessionId:s.sessionId,index:s.index}),
     'forged original event and stale Check rejected');
    const png=label+'-correct.png';
    await page.screenshot({path:path.join(out,png),fullPage:false});screenshots.push(png);
    stage=position+':offline-reload';
    const offline=await page.reload();ok(offline?.fromServiceWorker()===true,'original corrected case offline reload');
    await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,s.index);
    const saved=await capture(page,out,label,spec,'offline-reload');
    captures.push({position,phase:'offline-reload',attempts:saved.attempts.length,storage:saved.storage});
    assert.deepEqual(saved.model,good.model,'native model survives offline reload');
    assert.deepEqual(saved.record,good.record,'native Check attempts survive offline reload');
   }
   stage='native-state-v2-export';
   await page.goto(origin.base+'v2.html#trail');
   const exportBtn=page.locator('#main [data-do="export"]').first();
   await exportBtn.waitFor();const download=page.waitForEvent('download');
   await exportBtn.click();const raw=fs.readFileSync(await(await download).path());
   const v2=JSON.parse(raw.toString('utf8'));
   ok(v2.app==='math-explorer'&&v2.version===2,'actual full original State-v2 export');
   fs.writeFileSync(path.join(out,'native-state-v2.json'),raw);
   ok(errors.length===0,'no browser errors/external requests');
   persist();console.log('P007L_SAS_DEVELOPMENT_BROWSER_OK '+JSON.stringify({
    head:sha,positions:specs.length,checks:checks.length,strictAApproved:false}));
  }catch(e){errors.push(stage+': '+String(e));
   await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
   persist();console.error(e.stack||String(e));process.exitCode=1;
  }finally{await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
 }
 if(require.main===module)run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
