const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.MATH_SPATIAL_EVIDENCE||'verification/thinking-feedback-v56-20261101/regression-v53');
const base='http://127.0.0.1:43827/',checks=[],errors=[];
const check=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
const samePose=(a,b)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<1e-6)&&a.target.every((v,i)=>Math.abs(v-b.target[i])<1e-6)&&Math.abs(a.cameraZoom-b.cameraZoom)<1e-6;
const snap=p=>p.evaluate(()=>mathSpace.snapshot());
const ready=p=>p.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length>0);
const choose=async(p,id)=>{await p.locator('[data-action="search"]').click();await p.locator('#search-input').fill(id);await p.locator(`#search-results [data-key="node:${id}"]`).click();};
const context=browser=>browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',timezoneId:'Asia/Shanghai',acceptDownloads:true});

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']}),ctx=await context(browser),p=await ctx.newPage();
  p.on('pageerror',e=>errors.push(String(e)));
  try{
    await p.goto(base+'?world=network&layout=53#space');await ready(p);await p.locator('[data-action="edge-display"][data-edge-display="all"]').click();let s=await snap(p);
    check(s.networkVersion===53&&s.visibleNodes.length===537&&s.backgroundEdges===1080,'new map renders 537 domain points and all 1,080 domain edges');
    check(s.counts.nodes===587&&s.counts.edges===1223,'complete source objects remain in the model');
    check((await p.locator('#overall-count').innerText())==='0 / 587','global learning progress still counts all 587 source nodes');
    check(await p.locator('#storage-warning').isHidden(),'the real 3D canvas has not lost its context');
    await p.screenshot({path:path.join(out,'01-overview.png')});

    const from='mt_9L5qyBYmg-',thinking='mt_FVVSQR9vGg';
    await choose(p,from);s=await snap(p);const row=p.locator(`.network-relation[data-preview-key="node:${thinking}"]`);
    check(await row.count()===1&&(await row.innerText()).includes('数学思维'),'a real edge to a non-spatial thinking node appears with its context');
    const beforePreview=await snap(p);await row.locator('[data-action="choose"]').focus();await p.waitForFunction(id=>mathSpace.snapshot().previewKey==='node:'+id,thinking);
    check(samePose(beforePreview,await snap(p))&&(await row.innerText()).includes('在学习中呈现'),'keyboard preview explains the context without moving or selecting');
    await row.locator('[data-action="choose"]').click();s=await snap(p);
    check(s.selected==='node:'+thinking&&s.visibleNodes.length===537&&samePose(s,beforePreview),'selecting a thinking node keeps the camera instead of inventing a point');
    check((await p.locator('#focus-card').innerText()).includes('这个数学思维在学习中呈现'),'thinking content has a clear detail and activity entry');
    check(await p.evaluate(id=>mathSpace.project('node:'+id)===null,thinking),'a non-spatial node has no projected map position');
    await p.locator('#focus-card [data-action="open"]').click();await p.frameLocator('#journey-frame').locator('[data-do="start"]').waitFor();
    check((await snap(p)).journeyOpen,'the existing thinking activity opens in the learning surface');
    const frame=p.frameLocator('#journey-frame');await frame.locator('[data-do="start"]').click();
    await frame.locator('[data-xfield="estimate"]').fill('25');await frame.locator('[data-x="m33-estimate"]').click();
    await frame.locator('[data-xfield="formula"]').fill('4.85+12.30');
    await p.waitForFunction(async()=>{const raw=(await import('./storage.js')).readStored('math-explorer-v2');return raw&&JSON.parse(raw).lessons.moneycalc?.models?.[0]?.formula==='4.85+12.30';});
    await p.locator('[data-action="close-journey"]').click();
    check((await p.locator('#overall-count').innerText())==='0 / 587','browsing and opening an activity do not mark it complete');
    await choose(p,thinking);await p.locator('#focus-card [data-action="open"]').click();
    await frame.locator('[data-xfield="formula"]').waitFor();
    check(await frame.locator('[data-xfield="formula"]').inputValue()==='4.85+12.30','partial work in a thinking activity resumes with the original input');
    await p.locator('[data-action="close-journey"]').click();

    await choose(p,'mt_WcfaSfVT33');await p.locator('[data-action="trace-mode"][data-mode="after"]').click();s=await snap(p);
    check(s.traceNodes.length===382&&s.traceEdgeCount===565,'the largest hard trace keeps the complete network, including non-spatial nodes');
    const hidden=p.locator('.trace-list .network-relation').filter({hasText:'数学思维 · 在学习中查看'}).first();
    check(await hidden.count()===1,'non-spatial thinking nodes remain reachable in the full trace list');
    const traceBefore=await snap(p),key=await hidden.getAttribute('data-preview-key');await hidden.locator('button').click();
    check((await snap(p)).selected===key&&(await snap(p)).traceMode==='direct','choosing a trace entry starts its direct relations');
    await p.locator('[data-action="back"]').click();s=await snap(p);
    check(s.selected===traceBefore.selected&&s.traceMode==='after'&&samePose(s,traceBefore),'back restores the prior full trace and camera');
    await p.screenshot({path:path.join(out,'02-trace.png')});

    await p.locator('[data-action="overview"]').click();const beforeDrag=await snap(p);
    await p.mouse.move(1070,620);await p.mouse.down();await p.mouse.move(990,570,{steps:6});await p.mouse.up();
    await p.waitForTimeout(250);s=await snap(p);
    check(!samePose(s,beforeDrag)&&JSON.stringify(s.positions)===JSON.stringify(beforeDrag.positions),'left drag rotates the new map without changing coordinates');
    await p.locator('[data-action="network-view"][data-view="top"]').click();
    check((await snap(p)).networkVersion===53,'named camera views stay on the selected new layout');
    const top=await snap(p);await p.locator('[data-action="network-view"][data-view="side"]').click();
    const sideCheck=await p.evaluate(async()=>{const a=await(await fetch('./data/atlas.json')).json(),edges=a.edges.filter(e=>e.strength==='hard'&&mathSpace.project('node:'+e.prerequisiteId)&&mathSpace.project('node:'+e.topicId));return {count:edges.length,rise:edges.every(e=>mathSpace.project('node:'+e.prerequisiteId).y>mathSpace.project('node:'+e.topicId).y)};});
    check(sideCheck.count===808&&sideCheck.rise&&JSON.stringify(top.positions)===JSON.stringify((await snap(p)).positions),'side view projects all 808 domain hard edges upward without moving any point');

    await choose(p,'mt_nvdpxAJTBG');
    await p.locator('.network-relations [data-action="bridge"][data-id="link-countline-skipbasic"]').click();
    for(const [step,count] of [[1,10],[2,5]]){for(let i=1;i<=count;i++){await frame.locator('[data-xfield="next"]').fill(String(i*step));await frame.locator('[data-x="walk-hop"]').click();}await frame.locator('[data-do="check"]').click();await frame.locator('[data-do="next"]').click();}
    const joint=await p.frames().find(f=>f.url().includes('learn.html')).evaluate(()=>mathLesson.snapshot().summary.completed);
    await p.locator('[data-action="close-journey"]').click();await p.locator('[data-action="overview"]').click();
    await p.waitForFunction(()=>mathSpace.snapshot().relations.some(r=>r.lit));
    check(joint&&(await snap(p)).relations.some(r=>r.lit)&&(await p.locator('#overall-count').innerText())==='0 / 587','a real joint activity lights its source link without completing its endpoints');

    await choose(p,thinking);await p.locator('[data-action="question"]').click();await p.locator('#question-text').fill('我怎样用计算器检查金额？');await p.locator('.question-dialog [type="submit"]').click();
    const world=await p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')).daily.questions[0].world);
    check(world.networkVersion===53&&world.selected==='node:'+thinking,'a real question saves the new layout and thinking context');
    await p.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offline-status').textContent.includes('离线就绪'),null,{timeout:30000});
    check(await p.evaluate(async()=>{const c=await caches.open('math-explorer-20261027-learning-v56');return !!await c.match('./spatial-relationship.js')&&!!await c.match('./spatial-relationship-data.js');}),'new layout modules are available in the offline cache');
    await p.locator('[data-action="menu"]').click();const downloaded=p.waitForEvent('download');await p.locator('[data-action="export"]').click();const file=await downloaded,backup=fs.readFileSync(await file.path());
    const imported=await context(browser),q=await imported.newPage();q.on('pageerror',e=>errors.push(String(e)));
    try{
      await q.goto(base+'?world=network&layout=53#space');await ready(q);
      for(let i=0;i<2;i++){await q.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});await q.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));}
      const questions=await q.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')).daily.questions);
      const importedModel=await q.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')).lessons.moneycalc.models[0]);
      check(questions.length===1&&questions[0].world.networkVersion===53&&questions[0].text==='我怎样用计算器检查金额？'&&importedModel.formula==='4.85+12.30'&&importedModel.board.first.estimate==='25','actual download and repeated import retain the question, original estimate and unfinished formula');
      await q.locator('.bottom-bar [data-action="questions"]').click();await q.locator('#questions-popover [data-action="resume-question"]').click();await q.frameLocator('#journey-frame').locator('[data-xfield="formula"]').waitFor();
      check((await snap(q)).networkVersion===53&&(await snap(q)).selected==='node:'+thinking,'resuming the imported thinking question returns to its real activity');
    }finally{await imported.close();}
    await ctx.setOffline(true);await p.reload();await ready(p);s=await snap(p);
    check(s.networkVersion===53&&s.visibleNodes.length===537,'the new layout and complete data reopen offline');
    await ctx.setOffline(false);

    const oldContext=await context(browser),old=await oldContext.newPage();old.on('pageerror',e=>errors.push(String(e)));
    try{
      await old.goto(base+'?world=network&layout=49#space');await ready(old);await choose(old,'mt_ebPelt-qAl');
      await old.locator('[data-action="trace-mode"][data-mode="before"]').click();const oldPose=await snap(old);
      await old.locator('[data-action="question"]').click();await old.locator('#question-text').fill('旧地图中的等值分数');await old.locator('.question-dialog [type="submit"]').click();
      await old.locator('[data-action="menu"]').click();await old.locator('[data-action="switch-layout"]').click();await ready(old);
      check((await snap(old)).networkVersion===53,'the layout switch opens the new map while preserving the old map');
      await old.locator('[data-action="zoom"][data-factor="0.75"]').click();const newPose=await snap(old);
      await old.locator('.bottom-bar [data-action="questions"]').click();await old.locator('#questions-popover [data-action="resume-question"]').click();await old.frameLocator('#journey-frame').locator('[data-do="start"]').waitFor();
      let restored=await snap(old);check(restored.networkVersion===49&&restored.traceMode==='before'&&samePose(restored,oldPose),'an old question returns to its v49 coordinates, trace and camera');
      const retained=await old.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-network-relationship-view-v1')));
      check(retained.networkVersion===53&&samePose(retained,newPose),'resuming an old question saves the separate new-map camera before switching');
      await old.waitForTimeout(350);await old.reload();await old.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().journeyOpen);restored=await snap(old);
      check(restored.networkVersion===49&&restored.selected==='node:mt_ebPelt-qAl','refresh continues the resumed old activity in its original map');
    }finally{await oldContext.close();}
    check(!errors.length,'no browser page errors occurred');
    fs.writeFileSync(path.join(out,'new-results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));console.log(JSON.stringify({passed:checks.length,errors}));
  }catch(error){await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'new-results.json'),JSON.stringify({checks,errors,failed:String(error)},null,2));console.error(error.stack);process.exitCode=1;}
  finally{await ctx.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
