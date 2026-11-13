// Issue #82: browser-generated evidence, not synthetic hash navigation or a static catalog test.
// Launch with an isolated browser context; task selection is by visible search/3D and UI clicks.
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/learning-node-audit/browser');
const base=process.env.MATH_BROWSER_BASE||'http://127.0.0.1:43827';
const checks=[],opened=[],issues=[],errors=[],runtime={};
const report={schema:'math-learning-node-browser/1',viewport:[1440,900],
  staticNodesFromPriorAudit:587,runtimeMappingVerified:0,
  clickedUniqueSourceNodes:0,clickedTaskSessions:0,
  completeAttemptAndRecoverySourceNodes:0,
  legacyUiEntry: 'pending',bridgeUiEntry:'pending',
  checks,opened,issues,errors,runtime,failures:[]};
const recordIssue=(id,taskId,priority,reason,action,evidence)=>issues.push({
  nodeId:id,taskId,priority,reason,reproduction:action,evidence});
const check=(condition,description)=>{assert.ok(condition,description);checks.push(description);};
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await ctx.newPage();
  page.on('pageerror',error=>errors.push(String(error)));
  const nav=name=>page.locator('.primary-nav [data-surface="'+name+'"]');
  const native=page.frameLocator('#journey-frame');
  const save=()=>fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2)+'\n');
  const screenshot=async name=>page.screenshot({path:path.join(out,name+'.png'),fullPage:false}).catch(()=>{});
  const snapshot=async()=>page.evaluate(()=>({selected:window.mathSpace?.snapshot()?.selected,
    surface:new URL(location.href).searchParams.get('surface')||'explore',
    frame:document.querySelector('#journey-frame')?.contentWindow?.location.href,
    visibleCard:!document.querySelector('#focus-card')?.hidden,
    title:document.querySelector('#focus-card .focus-title')?.textContent,
    warning:document.querySelector('#storage-warning')?.textContent,
    labels:document.querySelectorAll('.space-label.node:not([hidden])').length}));
  const start=async()=>{
    await page.goto(base+'/?world=network&layout=53#space',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  };
  const search=async(id)=>{
    await page.locator('[data-action="search"]').first().click();
    const input=page.locator('#search-input');
    await input.fill(id);
    const result=page.locator('#search-results [data-key="node:'+id+'"]');
    await result.waitFor({state:'visible'});
    await result.click();
    await page.waitForFunction(nodeId=>mathSpace.snapshot().selected==='node:'+nodeId,id);
    check((await snapshot()).selected==='node:'+id,'real search selected '+id);
  };
  const nativeReady=async(session)=>{
    await page.waitForFunction(expected=>{
      const f=document.querySelector('#journey-frame');
      return !document.querySelector('#journey-surface').hidden&&
        f?.contentWindow?.mathLesson?.snapshot?.()?.id===expected&&
        !!f.contentDocument?.querySelector('#instruction')?.textContent.trim()&&
        !!f.contentDocument?.querySelector('#work');
    },session,{timeout:30000});
    check(await native.locator('#work').isVisible(),'native widget displayed for '+session);
    const id=await page.evaluate(()=>document.querySelector('#journey-frame').contentWindow.mathLesson.snapshot().id);
    check(id===session,'opened requested session '+session);
  };
  const openBySearch=async(session)=>{
    const info=await page.evaluate(async session=>{
      const {LESSONS}=await import('./learning/catalog.js');
      return {topicId:LESSONS[session]?.topicId,taskCount:LESSONS[session]?.taskCount};
    },session);
    check(!!info.topicId,'source node configured for '+session);
    await search(info.topicId);
    const open=page.locator('#focus-card [data-action="open"]');
    await open.waitFor({state:'visible'});
    await open.click();
    await nativeReady(session);
    opened.push({nodeId:info.topicId,sessionId:session,entry:'visible search result -> focus-card button',
      taskType:await native.locator('#work').getAttribute('data-task-type'),
      taskIndex:await page.evaluate(()=>document.querySelector('#journey-frame').contentWindow.mathLesson.snapshot().index)});
    await screenshot('opened-'+session);
    return info.topicId;
  };
  try{
    await start();
    const audited=await page.evaluate(async()=>{
      const source=await(await fetch('./data/math.json')).json();
      const {LESSONS,lessonForTopic}=await import('./learning/catalog.js');
      const {sessionMeta,sessionTasks}=await import('./learning/bridges.js');
      const {ensureB39Ready}=await import('./learning/phase4/async-batches.js');
      await ensureB39Ready();
      const entries=source.nodes.map(n=>{
        const id=lessonForTopic(n.id),meta=id&&sessionMeta(id),tasks=id&&sessionTasks(id);
        return {id:n.id,session:id,valid:!!id&&meta?.topicId===n.id&&tasks?.length>0};
      });
      return {sourceCount:source.nodes.length,mathSpaceCount:mathSpace.snapshot().counts.nodes,
        validCount:entries.filter(e=>e.valid).length,missing:entries.filter(e=>!e.valid),
        distinctSessions:new Set(entries.map(e=>e.session)).size,
        visibleLabels:document.querySelectorAll('.space-label.node:not([hidden])').length};
    });
    Object.assign(runtime,audited);
    report.runtimeMappingVerified=audited.validCount;
    check(audited.sourceCount===587&&audited.mathSpaceCount===587&&audited.validCount===587
      &&audited.missing.length===0&&audited.distinctSessions===587,
      '587 real page-runtime native source-to-session mappings');
    // Literal 3D label interaction (where the screen provides an unobscured target).
    // This additional click does not count as an opened lesson until its real UI workpiece loads.
    const labels=await page.evaluate(()=>[...document.querySelectorAll('.space-label.node:not([hidden])')]
      .filter(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
        const hit=document.elementFromPoint(x,y);
        return r.width>6&&r.height>6&&x>5&&x<innerWidth-5&&y>5&&y<innerHeight-5&&(hit===el||el.contains(hit));})
      .map(el=>el.dataset.key));
    if(labels.length){
      const label=labels[0];
      await page.locator('.space-label.node[data-key="'+label+'"]').click();
      await page.waitForFunction(key=>mathSpace.snapshot().selected===key,label);
      checks.push('real projected 3D DOM node label selected '+label);
      runtime.real3dSelectedKey=label;
      await screenshot('real-3d-label-selected');
    }else{
      recordIssue(null,null,'待核查','No unobscured 3D labels found in this viewport',
        'Open network map 1440x900 and inspect projected label hit targets','runtime.real3dSelectedKey');
    }
    // Each representative session enters from a real visible search result and
    // a focus-card action; no direct learn.html hash or internal state mutation.
    for(const session of ['share','graph39','pattern39']){
      await start();
      const sourceId=await openBySearch(session);
      if(session==='share'){
        const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
        check(!before.lessons.share?.cases?.[0]?.attempts?.length,
          'opening a lesson is not a submitted attempt');
        await native.locator('#actions [data-do="check"]').click();
        await page.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.share?.cases?.[0]?.attempts?.length===1);
        check(await native.locator('#scene').getAttribute('data-stage')==='revise',
          'real incorrect submission produces revise feedback');
        check(await native.locator('#actions [data-do="next"]').count()===0,
          'incorrect submission does not expose Next');
        await nav('trail').click();
        await page.waitForFunction(()=>document.querySelector('#utility-drawer')?.dataset.surface==='trail');
        const resume=page.locator('#trail-node-context [data-action="trail-to-learn"]');
        check(await resume.isVisible(),'saved attempt creates named Trail resume');
        check(await resume.getAttribute('data-id')==='share','Trail resumes exact session');
        await resume.click();
        await nativeReady('share');
        await page.reload();
        await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
        await nav('learn').click();
        await nativeReady('share');
        const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
        check(after.lessons.share.cases[0].attempts.length===1,
          'Trail and refresh preserve one actual incorrect attempt');
        check(!after.lessons.share.notes.length,'optional text is not needed to preserve attempt');
        report.completeAttemptAndRecoverySourceNodes++;
        await screenshot('share-incorrect-resumed');
      }
      check(opened.at(-1).nodeId===sourceId,'clicked topic/session identity '+session);
    }
    // Legacy fair is mapped to the same real source node as share. The only
    // public early-activity focus CTA is conditional on an existing old record.
    await start();
    await search('mt_ndGqFPWyen');
    const old=page.locator('#focus-card [data-action="open-legacy"]');
    if(await old.isVisible()){
      await old.click();
      const activity=page.locator('.work-panel[data-node="mt_ndGqFPWyen"] iframe.activity-frame');
      await activity.waitFor({state:'visible'});
      check((await activity.getAttribute('src')).includes('#activity/fair'),'old fair activity opened from UI');
      report.legacyUiEntry='real_ui_clicked_and_loaded';
      opened.push({nodeId:'mt_ndGqFPWyen',sessionId:'fair',entry:'focus-card open-legacy'});
      await screenshot('legacy-fair-open');
    }else{
      report.legacyUiEntry='not_offered_without_existing_legacy_record';
      recordIssue('mt_ndGqFPWyen','fair','P2',
        'Fresh context does not offer early fair activity CTA; native share is primary.',
        'Select share source node on the network map; inspect focus actions with empty activity history',
        '#focus-card [data-action="open-legacy"] absent');
      await screenshot('legacy-fair-not-offered');
    }
    // Relation-based bridge session: click a real source relationship entry.
    await start();
    await search('mt_Ep7TDFuYUa');
    const relations=page.locator('#focus-card details.network-relations').first();
    if(await relations.count())await relations.evaluate(el=>el.open=true);
    const bridge=page.locator('#focus-card [data-action="bridge"][data-id="link-equivalent-quarters"]');
    if(await bridge.isVisible()){
      await bridge.click();
      await nativeReady('link-equivalent-quarters');
      check(await native.locator('#work').isVisible(),'bridge-specific widget visible');
      report.bridgeUiEntry='real_relation_click_and_loaded';
      opened.push({nodeId:'mt_Ep7TDFuYUa',sessionId:'link-equivalent-quarters',entry:'real relation bridge action'});
      await screenshot('bridge-from-relationship');
    }else{
      report.bridgeUiEntry='pending_visible_relation';
      recordIssue('mt_Ep7TDFuYUa','link-equivalent-quarters','待核查',
        'Bridge action not visibly offered in this particular focus state.',
        'Search for equivalent fractions, open direct relations and inspect bridge action',
        '#focus-card [data-action="bridge"][data-id="link-equivalent-quarters"]');
      await screenshot('bridge-relation-unavailable');
    }
    check(errors.length===0,'no page errors');
    report.clickedUniqueSourceNodes=new Set(opened.map(e=>e.nodeId)).size;
    report.clickedTaskSessions=new Set(opened.map(e=>e.sessionId)).size;
    save();
    console.log('LEARNING_NODE_RUNTIME_BROWSER '+JSON.stringify({
      runtime:report.runtimeMappingVerified,clickedNodes:report.clickedUniqueSourceNodes,
      openedSessions:report.clickedTaskSessions,recovered:report.completeAttemptAndRecoverySourceNodes,
      legacy:report.legacyUiEntry,bridge:report.bridgeUiEntry,issues:issues.length}));
  }catch(error){
    report.failures.push({message:String(error),stack:error?.stack,snapshot:await snapshot().catch(()=>null)});
    await screenshot('failure');
    save();
    console.error('LEARNING_NODE_RUNTIME_BROWSER_FAILURE '+(error.stack||error));
    process.exitCode=1;
  }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
