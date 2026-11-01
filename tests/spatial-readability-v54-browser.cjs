const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.MATH_SPATIAL_EVIDENCE||'verification/thinking-feedback-v56-20261101/regression-v54'),base='http://127.0.0.1:43827/';
const checks=[],errors=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
const snap=p=>p.evaluate(()=>mathSpace.snapshot());
const samePose=(a,b)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<1e-6)&&a.target.every((v,i)=>Math.abs(v-b.target[i])<1e-6)&&Math.abs(a.cameraZoom-b.cameraZoom)<1e-6;
const choose=async(p,id)=>{await p.locator('[data-action="search"]').click();await p.locator('#search-input').fill(id);await p.locator(`#search-results [data-key="node:${id}"]`).click();};
const filter=(p,mode)=>p.locator(`[data-action="edge-display"][data-edge-display="${mode}"]`).click();
const ready=p=>p.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);

(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',timezoneId:'Asia/Shanghai',acceptDownloads:true}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
  try{
    await p.goto(base+'?world=network&layout=53&v=56#space');await ready(p);let s=await snap(p),initial=s;
    check(s.edgeDisplay==='outline'&&s.backgroundEdges===508&&s.counts.edges===1223,'fresh map starts with 508 real outline links while retaining all source relations');
    check((await p.locator('#network-edge-hint').innerText()).includes('全部直接联系'),'outline explains that direct links remain available');
    await p.screenshot({path:path.join(out,'01-outline.png')});
    for(const [mode,count] of [['critical',808],['all',1080],['outline',508]]){
      const before=await snap(p);await filter(p,mode);s=await snap(p);
      check(s.backgroundEdges===count&&s.edgeDisplay===mode&&s.visibleNodes.length===537&&samePose(s,before)&&JSON.stringify(s.positions)===JSON.stringify(initial.positions),'background range '+mode+' changes only the displayed edges');
      check(await p.locator(`[data-edge-display="${mode}"]`).getAttribute('aria-pressed')==='true','background range '+mode+' is exposed to keyboard and assistive technology');
    }
    check((await p.locator('#overall-count').innerText())==='0 / 587','changing background ranges does not complete learning');

    const merge='mt_167X6Ax8P7';await choose(p,merge);s=await snap(p);
    check(s.relations.length===3&&await p.locator('.network-relations [data-action="choose"]').count()===3,'a three-parent convergence lists every direct source relation in outline mode');
    for(const id of ['mt_4bc3EAxhlY','mt_Jf8xcX4UTq','mt_WtIFJSCQIT']){
      const row=p.locator(`.network-relation[data-preview-key="node:${id}"]`);check(await row.count()===1,'convergence parent remains in the list '+id);
      check(s.previewEdges.some(e=>e.from==='node:'+id&&e.to==='node:'+merge),'convergence parent is drawn even when absent from the outline '+id);
    }
    const row=p.locator('.network-relation[data-preview-key="node:mt_4bc3EAxhlY"]'),beforePreview=await snap(p);await row.locator('[data-action="choose"]').focus();
    await p.waitForFunction(()=>mathSpace.snapshot().previewKey==='node:mt_4bc3EAxhlY');s=await snap(p);
    check(s.selected===beforePreview.selected&&samePose(s,beforePreview)&&s.previewEdges.some(e=>e.from==='node:mt_4bc3EAxhlY'&&e.opacity===1),'keyboard preview emphasizes an omitted-outline edge without selection or camera movement');
    await p.screenshot({path:path.join(out,'02-convergence.png')});

    for(const [id,direct,before,after,name] of [['mt_FbDKeLfBCo',4,9,74,'看图识别'],['mt_FP-mjXaq3B',3,17,72,'细分与合并'],['mt_ebPelt-qAl',8,18,71,'同倍变化']]){
      await choose(p,id);s=await snap(p);check(s.relations.length===direct&&(await p.locator('#focus-card h2').innerText()).includes(name),'equivalent fraction identity and all direct links '+name);
      await p.locator('[data-action="trace-mode"][data-mode="before"]').click();s=await snap(p);check(s.traceNodes.length===before&&await p.locator('.trace-list [data-action="choose"]').count()===before,'full prerequisite network '+name);
      if(id==='mt_ebPelt-qAl')check(s.traceEdgeCount===29,'the 18 predecessors retain all 29 actual critical links');
      await p.locator('[data-action="trace-mode"][data-mode="after"]').click();check((await snap(p)).traceNodes.length===after,'full successor network '+name);
    }
    await choose(p,'mt_nvdpxAJTBG');check((await snap(p)).relations.length===16,'a maximum-degree source node exposes all 16 direct relations');
    await choose(p,'mt_0XxyaQLRhn');check(await p.locator('.network-relation[data-preview-key="node:mt_fR0UtsSREU"]').count()===1,'a cross-theme source relation remains accessible');
    await choose(p,'mt_19j_5AuuQI');s=await snap(p);check(s.relations.length===3&&s.relations.every(e=>e.strength==='soft'),'a hard-isolated node still lists its three real soft links');
    await p.locator('[data-action="trace-mode"][data-mode="before"]').click();check((await snap(p)).traceNodes.length===0&&(await p.locator('#focus-card').innerText()).includes('来源没有列出'),'an empty critical trace is explained as a source boundary');

    await choose(p,'mt_WcfaSfVT33');await p.locator('[data-action="trace-mode"][data-mode="after"]').click();s=await snap(p);
    check(s.traceNodes.length===382&&s.traceEdgeCount===565&&s.relations.length===565,'the largest trace keeps its entire reachable graph');
    check(s.previewEdges.length>0&&s.previewEdges.every(e=>e.geometry==='BufferGeometry')&&s.traceArrows<=3,'the large trace uses fine lines and arrows only at the selected node');
    for(let i=0;i<5;i++)await p.locator('[data-action="zoom"][data-factor="0.75"]').click();
    await p.waitForFunction(()=>mathSpace.nodeRadius('node:mt_WcfaSfVT33')>0&&mathSpace.nodeRadius('node:mt_WcfaSfVT33')<=11.3);
    const radius=await p.evaluate(()=>({selected:mathSpace.nodeRadius('node:mt_WcfaSfVT33'),other:mathSpace.nodeRadius(mathSpace.snapshot().visibleNodes.find(k=>k!=='node:mt_WcfaSfVT33'))}));
    check(radius.selected<=11.3&&radius.other<=7.1,'zoom keeps node size uniform and bounded in screen space');
    const visibleNames=await p.locator('.space-label.node:visible').count();check(visibleNames>0&&visibleNames<=12,'zoom progressively shows a bounded set of trace names');
    await p.screenshot({path:path.join(out,'03-large-trace-zoom.png')});
    const outside=await p.evaluate(()=>[...document.querySelectorAll('.trace-list [data-preview-key]')].map(el=>el.dataset.previewKey).find(key=>{const point=mathSpace.project(key);return point&&(!point.visible||point.x<340||point.x>innerWidth-120||point.y<175||point.y>innerHeight-90);})||null);
    check(!!outside,'zoom provides a real off-screen trace node');const offRow=p.locator(`.trace-list [data-preview-key="${outside}"]`),offPose=await snap(p);await offRow.locator('button').focus();
    check((await offRow.locator('.preview-hint').innerText()).includes('画面外')&&samePose(await snap(p),offPose),'an off-screen keyboard preview explains how to locate it without changing the camera');
    const card=p.locator('#focus-card');await card.evaluate(el=>el.scrollTop=el.scrollHeight);await p.waitForTimeout(100);
    check(await card.evaluate(el=>{const title=el.querySelector('h2').getBoundingClientRect(),r=el.getBoundingClientRect();return title.top>=r.top&&title.bottom<r.bottom;}),'the selected knowledge name remains visible while a long trace is scrolled');
    const last=p.locator('.trace-list [data-action="choose"]').last(),lastKey=await last.getAttribute('data-key'),beforeFocus=await snap(p);await last.focus();
    check((await snap(p)).selected===beforeFocus.selected&&samePose(await snap(p),beforeFocus),'keyboard focus at the end of a trace does not navigate or add history');
    check(await last.evaluate(el=>{const r=el.getBoundingClientRect(),sticky=el.closest('#focus-card').querySelector('.focus-sticky').getBoundingClientRect();return r.top>=sticky.bottom-2;}),'keyboard scrolling does not hide a relation behind the fixed title');
    await p.screenshot({path:path.join(out,'03-large-trace.png')});
    const beforeSelect=await snap(p);await last.click();check((await snap(p)).selected===lastKey&&(await snap(p)).traceMode==='direct','clicking a traced point opens its direct links');
    await p.locator('[data-action="back"]').click();s=await snap(p);check(s.selected===beforeSelect.selected&&s.traceMode==='after'&&samePose(s,beforeSelect),'back returns to the prior complete trace and camera');

    await filter(p,'critical');await p.waitForTimeout(350);await p.reload();await ready(p);s=await snap(p);
    check(s.edgeDisplay==='critical'&&s.backgroundEdges===808&&s.traceMode==='after','refresh restores the background range and trace independently');
    await p.locator('[data-action="question"]').click();await p.locator('#question-text').fill('这条联系怎样继续？');await p.locator('.question-dialog [type="submit"]').click();
    const saved=await p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')).daily.questions[0].world);
    check(saved.edgeDisplay==='critical'&&saved.traceMode==='after','a real question saves both the background range and trace');
    await filter(p,'outline');await p.locator('.bottom-bar [data-action="questions"]').click();await p.locator('#questions-popover [data-action="resume-question"]').click();
    s=await snap(p);check(s.edgeDisplay==='critical'&&s.traceMode==='after'&&s.backgroundEdges===808,'resuming the question restores its own background range');
    await p.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offline-status').textContent.includes('离线就绪'),null,{timeout:30000});
    await ctx.setOffline(true);await p.reload();await ready(p);s=await snap(p);check(s.edgeDisplay==='critical'&&s.backgroundEdges===808,'selected background range survives an offline reload');await ctx.setOffline(false);

    const compact=await browser.newContext({viewport:{width:1000,height:720},reducedMotion:'reduce'}),q=await compact.newPage();q.on('pageerror',e=>errors.push(String(e)));
    try{await q.goto(base+'?world=network&layout=53&v=56#space');await ready(q);
      check(await q.evaluate(()=>{const g=document.querySelector('#network-guide').getBoundingClientRect(),r=document.querySelector('.tool-rail').getBoundingClientRect(),c=document.querySelector('#network-edge-controls').getBoundingClientRect();return c.bottom<innerHeight&&c.right<=r.left&&g.bottom<innerHeight-300&&document.documentElement.scrollWidth<=innerWidth;}),'filters and camera controls fit on a shorter desktop');
      await choose(q,merge);const first=q.locator('.network-relations [data-action="choose"]').first();await first.scrollIntoViewIfNeeded();
      check(await first.evaluate(el=>{const r=el.getBoundingClientRect(),card=el.closest('#focus-card').getBoundingClientRect(),sticky=el.closest('#focus-card').querySelector('.focus-sticky').getBoundingClientRect();return r.top>=sticky.bottom-2&&r.bottom<=card.bottom;}),'a direct relation stays visible below the sticky title on a short desktop');
      await q.screenshot({path:path.join(out,'04-compact.png')});
    }finally{await compact.close();}

    const old=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'}),r=await old.newPage();
    try{const previous={version:1,networkVersion:53,networkView:'oblique',position:initial.position,target:initial.target,cameraZoom:initial.cameraZoom,selected:null,showAllNodes:true,relationMode:'off',panels:[],journeyOpen:false};
      await r.addInitScript(v=>localStorage.setItem('math-explorer-network-relationship-view-v1',JSON.stringify(v)),previous);await r.goto(base+'?world=network&layout=53&v=56#space');await ready(r);
      check((await snap(r)).edgeDisplay==='all'&&(await snap(r)).backgroundEdges===1080,'a v53 saved view without a range keeps its original all-links display');
    }finally{await old.close();}
    check(!errors.length,'no browser page errors');fs.writeFileSync(path.join(out,'readability-results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));console.log(JSON.stringify({passed:checks.length,errors}));
  }catch(error){await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'readability-results.json'),JSON.stringify({checks,errors,failed:String(error)},null,2));console.error(error.stack);process.exitCode=1;}
  finally{await ctx.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
