const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/thinking-feedback-v56-20261101'),base='http://127.0.0.1:43827/';
const checks=[],errors=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
const snap=p=>p.evaluate(()=>mathSpace.snapshot());
const state=p=>p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));
const samePose=(a,b)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<1e-6)&&a.target.every((v,i)=>Math.abs(v-b.target[i])<1e-6)&&Math.abs(a.cameraZoom-b.cameraZoom)<1e-6;
const ready=p=>p.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
const choose=async(p,id)=>{await p.locator('[data-action="search"]').click();await p.locator('#search-input').fill(id);await p.locator(`#search-results [data-key="node:${id}"]`).click();};
const context=browser=>browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',timezoneId:'Asia/Shanghai',acceptDownloads:true});

(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
  const ctx=await context(browser),p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
  try{
    await p.goto(base+'?world=network&layout=53&v=56#space');await ready(p);const initial=await snap(p);
    check(await p.locator('#guide-panel').isHidden(),'the guide is optional and does not interrupt the full map');
    await p.locator('[data-action="guide-start"]').click();let s=await snap(p);
    check(s.guide.step===0&&s.guide.edges.length===3&&(await p.locator('#guide-panel').innerText()).includes('还有其他起点'),'the orientation begins at one real starting point without declaring a unique root');
    check(await p.locator('.guide-progress').getAttribute('value')==='1'&&await p.locator('[data-action="guide-start"]').isHidden(),'guide progress is labelled separately and its entry does not compete with the open panel');
    check((await p.locator('#overall-count').innerText())==='0 / 587'&&(await state(p)).daily.guide.active,'guide attention is saved separately without completing knowledge');
    await p.screenshot({path:path.join(out,'01-start.png')});
    await p.locator('[data-action="guide-step"][data-step="1"]').click();await p.locator('[data-action="guide-step"][data-step="2"]').click();s=await snap(p);
    check(s.guide.step===2&&s.guide.currentNodes.length===3&&s.guide.edges.length===5,'the shared foundation branches to addition and subtraction while earlier source links remain highlighted');
    await p.locator('[data-action="edge-display"][data-edge-display="all"]').click();s=await snap(p);check(s.backgroundEdges===1080&&s.guide.step===2&&s.guide.edges.length===5,'the full background can be revealed without interrupting guide attention');await p.locator('[data-action="edge-display"][data-edge-display="outline"]').click();
    await p.locator('[data-action="guide-step"][data-step="1"]').click();check((await snap(p)).guide.step===1,'guide steps can be revisited without marking learning complete');await p.locator('[data-action="guide-step"][data-step="2"]').click();
    const record=await state(p),before=await snap(p);await p.waitForTimeout(350);await p.reload();await ready(p);s=await snap(p);
    check(s.guide.step===2&&s.guide.edges.length===5&&JSON.stringify(s.positions)===JSON.stringify(initial.positions),'refresh restores the guide step in the same source coordinates');
    check(record.daily.guide.step===2&&s.position.every((v,i)=>Math.abs(v-before.position[i])<1e-6)&&s.target.every((v,i)=>Math.abs(v-before.target[i])<1e-6),'guide restoration preserves the last camera');
    await p.locator('[data-action="guide-step"][data-step="3"]').click();s=await snap(p);
    check(s.guide.step===3&&s.guide.edges.length===7&&(await p.locator('#guide-panel').innerText()).includes('汇合'),'two real branches converge without losing earlier highlights');
    await p.locator('[data-action="zoom"][data-factor="0.75"]').click();const moved=await snap(p);
    await p.evaluate(stale=>window.dispatchEvent(new StorageEvent('storage',{key:'math-explorer-v2',newValue:JSON.stringify(stale)})),record);
    check((await snap(p)).guide.step===3&&(await state(p)).daily.guide.step===3&&samePose(await snap(p),moved),'a delayed stale storage event cannot roll the guide or its camera back');
    await p.screenshot({path:path.join(out,'02-convergence.png')});
    await p.locator('[data-action="guide-step"][data-step="4"]').click();s=await snap(p);
    check(s.guide.step===4&&s.guide.edges.length===9&&s.guide.edges.every(e=>e.strength==='hard'),'the final step follows actual critical links toward division and a half');
    const valid=await p.evaluate(async()=>{const a=await(await fetch('./data/atlas.json')).json(),s=mathSpace.snapshot();return s.guide.edges.every(e=>a.edges.some(x=>x.prerequisiteId===e.from&&x.topicId===e.to&&x.strength===e.strength));});
    check(valid,'every highlighted guide edge matches the complete source graph');
    await p.locator('[data-action="guide-reset"]').click();await p.locator('[data-action="guide-learn"]').click();let frame=p.frameLocator('#journey-frame');await frame.locator('[data-do="start"]').click();
    await frame.locator('[data-x="count-tap"][data-index="0"]').click();
    await p.waitForTimeout(350);await p.reload();await p.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().journeyOpen);frame=p.frameLocator('#journey-frame');await frame.locator('[data-x="count-tap"][data-index="1"]').waitFor();
    check((await snap(p)).guideSuspended&&(await state(p)).lessons.countonce.models[0].taps.length===1,'refresh inside a guide activity retains the partial work and the guide to return to');
    await frame.locator('[data-do="question"]').click();await p.locator('#question-text').fill('为什么每颗只数一次？');await p.locator('.question-dialog [type="submit"]').click();
    await frame.locator('[data-x="count-tap"][data-index="1"]').click();let saved=await state(p);
    check(saved.daily.questions[0].world.guideStep===0&&saved.lessons.countonce.models[0].taps.length===2,'a question inside a guide activity saves the guide context and later work');
    await p.locator('[data-action="close-journey"]').click();check((await snap(p)).guide?.step===0,'closing the activity returns to the same guide step');
    await p.locator('.bottom-bar [data-action="questions"]').click();await p.locator('#questions-popover [data-action="resume-question"]').click();await frame.locator('#question-context').waitFor();saved=await state(p);
    check(saved.lessons.countonce.models[0].taps.length===1&&saved.daily.questions[0].events.at(-1).displaced.record.models[0].taps.length===2,'resuming the original question restores its partial work and retains the displaced draft');
    for(let i=1;i<7;i++)await frame.locator(`[data-x="count-tap"][data-index="${i}"]`).click();await frame.locator('[data-xfield="total"]').fill('7');await frame.locator('[data-do="check"]').click();await frame.locator('[data-do="next"]').click();
    await frame.locator('[data-xfield="badStep"]').fill('4');for(let i=0;i<6;i++)await frame.locator(`[data-x="count-tap"][data-index="${i}"]`).click();await frame.locator('[data-xfield="total"]').fill('6');await frame.locator('[data-xfield="why"]').selectOption('twice');await frame.locator('[data-do="check"]').click();
    await p.waitForFunction(async()=>{const s=JSON.parse((await import('./storage.js')).readStored('math-explorer-v2'));return !!s.lessons.countonce&&Object.values(s.lessons.countonce.cases).length===2&&Object.values(s.lessons.countonce.cases).every(c=>c.attempts.length>0);});
    await p.locator('[data-action="close-journey"]').click();await p.waitForFunction(()=>mathSpace.completionMarker('node:mt_WcfaSfVT33'));
    check((await p.locator('#overall-count').innerText())==='1 / 587'&&mathGuideStep(await snap(p))===0,'real completed node work lights one node and returns to the guide');
    await p.locator('[data-action="guide-step"][data-step="1"]').click();await p.locator('[data-action="guide-step"][data-step="2"]').click();
    await p.waitForFunction(()=>mathSpace.completionMarker('node:mt_WcfaSfVT33'));check((await snap(p)).guide.step===2,'the completed node marker remains visible while guide attention moves elsewhere');
    await p.locator('.bottom-bar [data-action="questions"]').click();await p.locator('#questions-popover [data-action="question-finish"]').click();
    await p.locator('[data-action="menu"]').click();const download=p.waitForEvent('download');await p.locator('[data-action="export"]').click();const file=await download,backup=fs.readFileSync(await file.path());
    const parsed=JSON.parse(backup);check(parsed.state.daily.guide.step===2&&parsed.state.daily.guide.active&&parsed.state.daily.questions[0].events.some(e=>e.displaced),'actual backup contains guide position, original question and displaced draft');
    const imported=await context(browser),q=await imported.newPage();q.on('pageerror',e=>errors.push(String(e)));
    try{await q.goto(base+'?world=network&layout=53&v=56#space');await ready(q);for(let i=0;i<2;i++){await q.locator('#import-file').setInputFiles({name:'guide.json',mimeType:'application/json',buffer:backup});await q.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));}
      await q.reload();await ready(q);check((await snap(q)).guide?.step===2&&(await q.locator('#overall-count').innerText())==='1 / 587','repeated import and reload restore guide and learning completion separately');
      await q.clock.setFixedTime(new Date(Date.now()+86400000));await q.reload();await ready(q);check((await snap(q)).guide?.step===2,'guide position survives a simulated next-day reload');
      await q.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offline-status').textContent.includes('离线就绪'),null,{timeout:30000});
      check(await q.evaluate(async()=>!!await(await caches.open('math-explorer-20261027-learning-v56')).match('./spatial-guide.js')),'the orientation module is in the offline cache');
      await imported.setOffline(true);await q.reload();await ready(q);check((await snap(q)).guide?.step===2&&(await q.locator('#overall-count').innerText())==='1 / 587','guide, completion and complete map reopen offline');await imported.setOffline(false);
    }finally{await imported.close();}

    await p.locator('[data-action="guide-learn"]').click();await frame.locator('[data-do="start"]').click();
    for(const [n,recount] of [[7,false],[6,true]]){for(let i=0;i<n;i++)await frame.locator(`[data-x="count-tap"][data-index="${i}"]`).click();await frame.locator('[data-xfield="total"]').fill(String(n));await frame.locator('[data-xfield="prediction"]').fill(String(n));await frame.locator('[data-x="count-move"]').click();if(recount)for(let i=n-1;i>=0;i--)await frame.locator(`[data-x="count-tap"][data-index="${i}"]`).click();await frame.locator('[data-xfield="after"]').fill(String(n));await frame.locator('[data-xfield="why"]').selectOption('same');await frame.locator('[data-do="check"]').click();await frame.locator('[data-do="next"]').click();}
    for(let i=0;i<5;i++)await frame.locator(`[data-x="count-tap"][data-index="${i}"]`).click();await frame.locator('[data-xfield="total"]').fill('5');await frame.locator('[data-xfield="why"]').selectOption('start');await frame.locator('[data-do="check"]').click();
    await p.locator('[data-action="close-journey"]').click();await p.waitForFunction(()=>document.querySelector('#overall-count').textContent==='2 / 587');s=await snap(p);
    check(s.guide?.step===2&&s.relations.some(e=>e.from==='node:mt_WcfaSfVT33'&&e.to==='node:mt_dmNvjroCPT'&&!e.lit),'completing both endpoint activities does not mark their joint relation complete');

    await p.locator('[data-action="guide-exit"]').click();check(await p.locator('#guide-panel').isHidden()&&!(await state(p)).daily.guide.active,'the guide can be exited without marking more work complete');
    await choose(p,'mt_9L5qyBYmg-');const suggestion=p.locator('.next-idea [data-action="choose"]'),target=await suggestion.getAttribute('data-key');
    const real=await p.evaluate(async target=>{const a=await(await fetch('./data/atlas.json')).json(),s=mathSpace.snapshot();return a.edges.some(e=>'node:'+e.prerequisiteId===s.selected&&'node:'+e.topicId===target);},target);
    await p.locator('.next-idea summary').click();check(real&&(await p.locator('.next-idea p').innerText()).length>0,'a next idea is tied to an actual outgoing source edge and provides its reason');
    const fromSuggestion=await snap(p);await suggestion.click();check((await snap(p)).selected===target,'the suggestion opens the real related node');await p.locator('[data-action="back"]').click();check((await snap(p)).selected===fromSuggestion.selected&&samePose(await snap(p),fromSuggestion),'back returns from a suggested idea to the original knowledge and camera');
    await choose(p,'mt_nvdpxAJTBG');await p.locator('.network-relations [data-action="bridge"][data-id="link-countline-skipbasic"]').click();
    for(const [step,count] of [[1,10],[2,5]]){for(let i=1;i<=count;i++){await frame.locator('[data-xfield="next"]').fill(String(i*step));await frame.locator('[data-x="walk-hop"]').click();}await frame.locator('[data-do="check"]').click();await frame.locator('[data-do="next"]').click();}
    await p.locator('[data-action="close-journey"]').click();await p.locator('[data-action="guide-start"]').click();s=await snap(p);
    const lit=await p.evaluate(async()=>{const b=(await import('./learning/bridges.js')).BRIDGES['link-countline-skipbasic'];return {from:'node:'+b.fromTopicId,to:'node:'+b.topicId};});
    check(s.guide?.step===2&&s.relations.some(e=>e.from===lit.from&&e.to===lit.to&&e.lit)&&s.previewEdges.some(e=>e.from===lit.from&&e.to===lit.to),'a previously completed joint link remains lit while guide attention is elsewhere');
    check((await p.locator('#overall-count').innerText())==='2 / 587','completing a joint link does not complete its two endpoint nodes');
    await p.screenshot({path:path.join(out,'03-progress.png')});
    await p.locator('[data-action="guide-exit"]').click();await choose(p,'mt_ebPelt-qAl');s=await snap(p);
    check(s.progressBackground.some(e=>e.from===lit.from&&e.to===lit.to)&&await p.evaluate(()=>mathSpace.completionMarker('node:mt_WcfaSfVT33')),'real completed nodes and unrelated joint links stay marked while exploring another idea');

    const direct=await context(browser),d=await direct.newPage();d.on('pageerror',e=>errors.push(String(e)));
    try{await d.goto(base+'?world=network&layout=53&v=56#space');await ready(d);await d.locator('[data-action="guide-start"]').click();await d.locator('[data-action="guide-step"][data-step="1"]').click();
      const guidePose=await snap(d);await d.locator('.bottom-bar [data-action="question"]').click();await d.locator('#question-text').fill('这个基础怎样生长？');await d.locator('.question-dialog [type="submit"]').click();
      await d.locator('[data-action="guide-exit"]').click();await choose(d,'mt_ebPelt-qAl');await d.locator('.bottom-bar [data-action="questions"]').click();await d.locator('#questions-popover [data-action="resume-question"]').click();
      const restored=await snap(d);check(restored.guide?.step===1&&!restored.journeyOpen&&restored.position.every((v,i)=>Math.abs(v-guidePose.position[i])<1e-6)&&restored.target.every((v,i)=>Math.abs(v-guidePose.target[i])<1e-6),'a question asked on the map returns directly to the guide step and saved camera');
    }finally{await direct.close();}
    const questionContext=await context(browser),qp=await questionContext.newPage();qp.on('pageerror',e=>errors.push(String(e)));
    try{await qp.goto(base+'?world=network&layout=53&v=56#space');await ready(qp);await choose(qp,'mt_M5PPDJStGm');await qp.locator('.bottom-bar [data-action="question"]').click();await qp.locator('#question-text').fill('为什么数到一百？');await qp.locator('.question-dialog [type="submit"]').click();await choose(qp,'mt_WcfaSfVT33');
      check(await qp.locator('.next-idea [data-action="choose"]').getAttribute('data-key')==='node:mt_M5PPDJStGm'&&(await qp.locator('.next-idea').innerText()).includes('留下的问题'),'a related pending question takes priority in the optional next-idea suggestion');
    }finally{await questionContext.close();}
    const unfinishedContext=await context(browser),u=await unfinishedContext.newPage();u.on('pageerror',e=>errors.push(String(e)));
    try{await u.goto(base+'?world=network&layout=53&v=56#space');await ready(u);await u.locator('[data-action="guide-start"]').click();await u.locator('[data-action="guide-learn"]').click();const uf=u.frameLocator('#journey-frame');await uf.locator('[data-do="start"]').click();await uf.locator('[data-x="count-tap"][data-index="0"]').click();await u.locator('[data-action="close-journey"]').click();await u.waitForTimeout(350);await u.reload();await ready(u);
      check(await u.locator('#guide-panel').isHidden()&&(await u.locator('#continue-card').innerText()).includes('数过的'),'an unfinished activity is offered before automatically reopening the guide');
      await u.locator('#continue-card [data-action="continue"]').click();await uf.locator('[data-x="count-tap"][data-index="1"]').waitFor();check((await state(u)).lessons.countonce.models[0].taps.length===1&&(await snap(u)).guideSuspended,'continuing restores the unfinished work and keeps its guide context');
      await u.locator('[data-action="close-journey"]').click();check((await snap(u)).guide?.step===0,'returning from continued work reopens its guide step');
    }finally{await unfinishedContext.close();}
    const changed=await context(browser),m=await changed.newPage();m.on('pageerror',e=>errors.push(String(e)));
    try{const modified=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json')));modified.edges=modified.edges.filter(e=>!(e.prerequisiteId==='mt_WcfaSfVT33'&&e.topicId==='mt_dmNvjroCPT'));
      await m.route('**/data/atlas.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(modified)}));await m.goto(base+'?world=network&layout=53&v=56#space');await ready(m);
      check(await m.locator('[data-action="guide-start"]').isHidden()&&(await m.locator('#storage-warning').innerText()).includes('导览')&&(await snap(m)).counts.nodes===587,'a missing source edge disables the optional guide without blocking the map');
    }finally{await changed.close();}
    const short=await browser.newContext({viewport:{width:1000,height:720},reducedMotion:'reduce'}),small=await short.newPage();small.on('pageerror',e=>errors.push(String(e)));
    try{await small.goto(base+'?world=network&layout=53&v=56#space');await ready(small);await small.locator('[data-action="guide-start"]').click();await small.waitForTimeout(150);
      check(await small.locator('#guide-panel').evaluate(el=>{const r=el.getBoundingClientRect(),bottom=document.querySelector('.bottom-bar').getBoundingClientRect();return r.top>=100&&r.bottom<=bottom.top&&getComputedStyle(el).overflowY==='auto'&&document.documentElement.scrollWidth<=innerWidth;}),'the guide has a usable scroll area and does not cover the bottom controls on a short desktop');
      await small.locator('[data-action="guide-step"][data-step="1"]').scrollIntoViewIfNeeded();await small.locator('[data-action="guide-step"][data-step="1"]').click();check((await snap(small)).guide?.step===1,'guide navigation remains usable on a short desktop');await small.screenshot({path:path.join(out,'04-short-desktop.png')});
    }finally{await short.close();}
    check(!errors.length,'no browser page errors');fs.writeFileSync(path.join(out,'guide-results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));console.log(JSON.stringify({passed:checks.length,errors}));
  }catch(error){await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'guide-results.json'),JSON.stringify({checks,errors,failed:String(error)},null,2));console.error(error.stack);process.exitCode=1;}
  finally{await ctx.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
function mathGuideStep(snapshot){return snapshot.guide?.step;}
