async original=>{
  const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/spatial-exploration-20261029/';
  const browser=original.context().browser(),ctx=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce',timezoneId:'Asia/Shanghai',acceptDownloads:true}),p=await ctx.newPage(),checks=[],errors=[];
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const snap=()=>p.evaluate(()=>mathSpace.snapshot());
  const ready=()=>p.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===587);
  const choose=async id=>{await p.locator('[data-action="search"]').click();await p.locator('#search-input').fill(id);await p.locator(`#search-results [data-key="node:${id}"]`).click();};
  const sameCamera=(a,b)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<1e-6)&&a.target.every((v,i)=>Math.abs(v-b.target[i])<1e-6)&&Math.abs(a.cameraZoom-b.cameraZoom)<1e-6;
  p.on('pageerror',e=>errors.push(String(e)));
  try{
    await p.goto(base+'?world=network&v=51#space');await ready();const initial=await snap(),id='mt_ebPelt-qAl';
    await p.locator('[data-action="search"]').click();await p.locator('#search-input').fill('等值分数');
    for(const [key,label]of[['mt_FbDKeLfBCo','看图识别'],['mt_FP-mjXaq3B','细分与合并'],['mt_ebPelt-qAl','同倍变化']])check((await p.locator(`#search-results [data-key="node:${key}"]`).innerText()).includes(label),'search distinguishes equivalent-fraction source node '+key);
    await p.locator(`#search-results [data-key="node:${id}"]`).click();
    let s=await snap();check(s.selected==='node:'+id&&s.traceMode==='direct'&&s.relations.length===8,'selection opens all eight real direct relations');
    check(await p.locator('.network-relations').evaluate(el=>el.open),'the direct relation list opens by default');
    check(await p.locator('#focus-card h2').innerText()==='等值分数 · 同倍变化'&&await p.locator('.space-label.node.selected').innerText()==='等值分数 · 同倍变化','map and focus card use the same mathematical name');
    check((await p.locator('.space-label.node.selected').getAttribute('aria-label')).includes('等值分数 · 同倍变化'),'the accessible name preserves the same mathematical distinction');
    const row=p.locator('.network-relation[data-preview-key="node:mt_FP-mjXaq3B"]'),neighbor=row.locator('[data-action="choose"]');
    check((await row.locator('.relation-reason').innerText()).includes('分子、分母为什么同时乘同一个数'),'the actual source edge has a reviewed child-readable explanation');
    const first=p.locator('.network-relation [data-action="choose"]').first();check(await first.evaluate(el=>{const r=el.getBoundingClientRect(),card=el.closest('#focus-card').getBoundingClientRect();return r.top>=card.top&&r.bottom<=card.bottom;}),'the first direct relation is visible in a short desktop');
    await p.screenshot({path:root+'01-direct.png'});await neighbor.scrollIntoViewIfNeeded();const beforeHover=await snap();await neighbor.hover();
    await p.waitForFunction(()=>mathSpace.snapshot().previewKey==='node:mt_FP-mjXaq3B');s=await snap();
    check(s.selected===beforeHover.selected&&sameCamera(s,beforeHover),'mouse preview highlights the related point without selecting or moving the camera');
    check(s.previewEdges.some(e=>(e.from===s.previewKey||e.to===s.previewKey)&&e.opacity===1)&&s.previewEdges.some(e=>e.from!==s.previewKey&&e.to!==s.previewKey&&e.opacity<.2),'preview emphasizes the corresponding rendered edge and softens unrelated edges');
    check(await p.locator('.space-label[data-key="node:mt_FP-mjXaq3B"]').evaluate(el=>el.classList.contains('hovered')),'the actual neighbor label receives preview emphasis');
    await p.mouse.move(1050,650);await p.waitForFunction(()=>mathSpace.snapshot().previewKey===null);await neighbor.focus();
    await p.waitForFunction(()=>mathSpace.snapshot().previewKey==='node:mt_FP-mjXaq3B');s=await snap();
    check(s.selected===beforeHover.selected&&sameCamera(s,beforeHover),'keyboard focus has the same temporary preview without changing exploration');
    await p.locator('[data-action="trace-mode"][data-mode="before"]').click();s=await snap();
    check(s.traceMode==='before'&&s.traceNodes.length===18&&s.traceEdgeCount===s.relations.length&&s.relations.every(e=>e.strength==='hard'),'all 18 source predecessors and their critical links are traced');
    check(JSON.stringify(s.positions)===JSON.stringify(initial.positions)&&sameCamera(s,beforeHover),'tracing changes neither world positions nor camera');
    check(await p.locator('.trace-list [data-action="choose"]').count()===18,'every traced predecessor is accessible in the list');
    await p.screenshot({path:root+'02-predecessors.png'});
    await p.locator('[data-action="trace-mode"][data-mode="after"]').click();s=await snap();check(s.traceMode==='after'&&s.traceNodes.length===71&&s.relations.every(e=>e.strength==='hard'),'all 71 source successors are traced without auxiliary links');
    await p.locator('[data-action="trace-mode"][data-mode="before"]').click();
    let outside=null;for(let i=0;i<5&&!outside;i++){await p.locator('[data-action="zoom"][data-factor="0.75"]').click();outside=await p.evaluate(()=>[...document.querySelectorAll('.trace-list [data-preview-key]')].map(el=>{const key=el.dataset.previewKey,p=mathSpace.project(key);return {key,...p};}).find(p=>!p.visible||p.x<340||p.x>innerWidth-120||p.y<145||p.y>innerHeight-88)?.key||null);}
    check(!!outside,'zoom provides an off-screen traced point for keyboard navigation');const offRow=p.locator(`.trace-list [data-preview-key="${outside}"]`),cameraBeforePreview=await snap();await offRow.locator('button').focus();
    check((await offRow.locator('.preview-hint').innerText()).includes('画面外')&&sameCamera(await snap(),cameraBeforePreview),'an off-screen preview explains how to locate the point without moving the camera');
    const card=p.locator('#focus-card');await card.evaluate(el=>el.scrollTop=230);await p.waitForTimeout(100);const oldScroll=await card.evaluate(el=>el.scrollTop),old=await snap();
    const next=p.locator('.trace-list [data-action="choose"]').nth(3),nextKey=await next.getAttribute('data-key');await next.click();s=await snap();
    check(s.selected===nextKey&&s.traceMode==='direct','clicking a traced point selects it and starts with its direct links');
    await p.locator('[data-action="back"]').click();s=await snap();
    check(s.selected==='node:'+id&&s.traceMode==='before'&&sameCamera(s,old),'back restores the previous node, full trace and camera');
    check(Math.abs(await card.evaluate(el=>el.scrollTop)-oldScroll)<5,'back restores the previous relation list position');
    await p.waitForTimeout(350);const beforeReload=await snap(),scrollBeforeReload=await card.evaluate(el=>el.scrollTop);await p.reload();await ready();s=await snap();
    check(s.selected===beforeReload.selected&&s.traceMode==='before'&&sameCamera(s,beforeReload),'refresh restores node, trace and camera');
    check(Math.abs(await card.evaluate(el=>el.scrollTop)-scrollBeforeReload)<5,'refresh restores the list position');
    await p.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offline-status').textContent.includes('离线就绪'),null,{timeout:30000});
    check(await p.evaluate(async()=>{const c=await caches.open('math-explorer-20261027-learning-v51');return (await Promise.all(['spatial-names.js','spatial-trace.js','spatial-reasons.js'].map(f=>c.match('./'+f)))).every(Boolean); }),'new source-backed modules are available offline');
    await ctx.setOffline(true);await p.reload();await ready();s=await snap();check(s.selected==='node:'+id&&s.traceMode==='before'&&s.traceNodes.length===18,'the traced map reopens without network access');
    await p.locator('[data-action="question"]').click();await p.locator('#question-text').fill('为什么不同的分数可以是同一个量？');await p.locator('.question-dialog [type="submit"]').click();
    const world=await p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')).daily.questions[0].world);
    check(world.traceMode==='before'&&world.networkVersion===49&&Number.isFinite(world.traceScroll),'a real saved question preserves the trace scope and original camera version');
    await p.locator('[data-action="menu"]').click();const download=p.waitForEvent('download');await p.locator('[data-action="export"]').click();const file=await download,backup=fs.readFileSync(await file.path());
    const compact=await browser.newContext({viewport:{width:1000,height:720},reducedMotion:'reduce'}),q=await compact.newPage();q.on('pageerror',e=>errors.push(String(e)));
    try{
      await q.goto(base+'?world=network&v=51#space');await q.waitForFunction(()=>window.mathSpace);
      const edge=await q.evaluate(async()=>{const a=await(await fetch('./data/atlas.json')).json();return a.edges[0];});
      await q.locator('[data-action="search"]').click();await q.locator('#search-input').fill(edge.topicId);await q.locator(`#search-results [data-key="node:${edge.topicId}"]`).click();
      const unreviewed=q.locator(`.network-relation[data-preview-key="node:${edge.prerequisiteId}"]`);
      const firstCompact=q.locator('.network-relation [data-action="choose"]').first();check(await firstCompact.evaluate(el=>{const r=el.getBoundingClientRect(),card=el.closest('#focus-card').getBoundingClientRect();return r.top>=card.top&&r.bottom<=card.bottom;}),'direct relations remain visible on a 1000-pixel desktop');
      check(!!(await unreviewed.locator('.relation-reason').innerText())&&await unreviewed.locator('.relation-reason.pending').count()===0,'the source edge shows its locally reviewed Chinese reason');
      await unreviewed.locator('details summary').click();check((await unreviewed.locator('details p').innerText())===edge.reason,'the exact original reason remains available beside the Chinese explanation');
      await q.screenshot({path:root+'03-short-reason.png'});
      for(let i=0;i<2;i++){await q.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});await q.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));}
      const imported=await q.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')).daily.questions);
      check(imported.length===1&&imported[0].world.traceMode==='before'&&imported[0].text==='为什么不同的分数可以是同一个量？','actual download and repeated import retain one original question and trace scope');
      await q.locator('[data-action="questions"]').click();await q.locator('#questions-popover [data-action="resume-question"]').click();await q.frameLocator('#journey-frame').locator('[data-do="start"]').waitFor();
      const resumed=await q.evaluate(()=>mathSpace.snapshot());check(resumed.selected==='node:'+id&&resumed.traceMode==='before'&&sameCamera(resumed,world),'resuming the imported question restores the same node, trace and camera');
    }finally{await compact.close();}
    const stress=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'}),r=await stress.newPage();r.on('pageerror',e=>errors.push(String(e)));
    try{
      await r.goto(base+'?world=network&v=51#space');await r.waitForFunction(()=>window.mathSpace);
      await r.locator('[data-action="search"]').click();await r.locator('#search-input').fill('mt_WcfaSfVT33');await r.locator('#search-results [data-key="node:mt_WcfaSfVT33"]').click();
      await r.locator('[data-action="trace-mode"][data-mode="after"]').click();const whole=await r.evaluate(()=>mathSpace.snapshot());
      check(whole.traceNodes.length===382&&whole.traceEdgeCount===565&&whole.relations.length===565,'the largest source successor network keeps all 382 nodes and 565 links');
      check(await r.locator('.trace-list [data-action="choose"]').count()===382,'the largest trace keeps every source node reachable in the scrollable list');
      const last=r.locator('.trace-list [data-action="choose"]').last(),lastKey=await last.getAttribute('data-key');await last.focus();
      await r.waitForFunction(key=>mathSpace.snapshot().previewKey===key,lastKey);check((await r.evaluate(()=>mathSpace.snapshot())).selected==='node:mt_WcfaSfVT33','keyboard focus at the end of a large trace remains a temporary preview');
      await r.screenshot({path:root+'04-largest-trace.png'});
    }finally{await stress.close();}
    const previous=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'}),oldPage=await previous.newPage();oldPage.on('pageerror',e=>errors.push(String(e)));
    try{
      await oldPage.addInitScript(saved=>localStorage.setItem('math-explorer-network-global-view-v1',JSON.stringify(saved)),{version:1,position:initial.position,target:initial.target,selected:'node:'+id,networkVersion:49,networkView:'oblique',cameraZoom:initial.cameraZoom,showAllNodes:true,relationMode:'off',panels:[],journeyOpen:false});
      await oldPage.goto(base+'?world=network&v=51#space');await oldPage.waitForFunction(()=>window.mathSpace);
      check((await oldPage.locator('#focus-card').innerText()).includes('当前连线处于收起状态'),'a previously saved hidden-line preference remains explicit and recoverable');
      await oldPage.locator('[data-action="trace-mode"][data-mode="direct"]').click();
      check((await oldPage.evaluate(()=>mathSpace.snapshot())).relationMode==='source','the direct-relations control can restore previously hidden source lines');
    }finally{await previous.close();}
    check(!errors.length,'no browser errors occurred');return{checks,errors,childTrial:false};
  }catch(e){await p.screenshot({path:root+'failure.png'}).catch(()=>{});return{checks,errors,failed:String(e),url:p.url()};}finally{await ctx.close();}
}
