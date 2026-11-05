// Browser acceptance: curriculum stages only highlight existing 3D panorama nodes.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/grade-progression-overview');
const url='http://127.0.0.1:43827/?world=network&layout=53#atlas';
const checks=[],errors=[],check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.stack||String(e)));
  const pose=()=>page.evaluate(()=>{const s=mathSpace.snapshot();return JSON.stringify({position:s.position,target:s.target,zoom:s.cameraZoom,positions:s.positions});});
  const stablePose=async()=>{
    await page.waitForFunction(()=>mathSpace.motion().tween===null&&mathSpace.motion().transition===null);
    let previous=await pose();
    for(let i=0;i<30;i++){
      await page.waitForTimeout(80);
      const current=await pose();
      if(current===previous)return current;
      previous=current;
    }
    throw Error('Camera did not settle before the stage comparison');
  };
  const assertUnmoved=(before,after,label)=>{
    const a=JSON.parse(before),b=JSON.parse(after);
    check(JSON.stringify(a.positions)===JSON.stringify(b.positions),label+' preserves all source node coordinates');
    const difference=Math.max(...a.position.map((v,i)=>Math.abs(v-b.position[i])),...a.target.map((v,i)=>Math.abs(v-b.target[i])),Math.abs((a.zoom??1)-(b.zoom??1)));
    check(difference<=1e-6,label+' preserves the camera (max delta '+difference+'; before '+JSON.stringify({position:a.position,target:a.target,zoom:a.zoom})+'; after '+JSON.stringify({position:b.position,target:b.target,zoom:b.zoom})+')');
  };
  try{
    await page.goto(url);
    await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.snapshot().selected);
    await page.waitForFunction(()=>document.querySelector('#grade-map-filter-status')?.textContent.includes('537'));
    check(await page.locator('#grade-map-filter').isVisible(),'single panorama has stage filter');
    check(await page.locator('[data-action="grade-map-stage"]').count()===4,'one all and three two-year stages');
    check(await page.locator('#observation-mode-switch,#grade-observation-view,[data-action="grade-view-node"]').count()===0,'old matrix and navigation no longer exist');
    const original=await stablePose();
    for(const [stage,count] of [['stage-1',187],['stage-2',259],['stage-3',255]]){
      await page.locator('[data-action="grade-map-stage"][data-stage="'+stage+'"]').click();
      await page.waitForFunction(({stage,count})=>mathSpace.snapshot().gradeStageFilter===stage&&mathSpace.snapshot().gradeStageMatchedIds.length===count,{stage,count});
      assertUnmoved(original,await stablePose(),'stage '+stage);
      check(await page.locator('#grade-map-filter-status').innerText().then(s=>s.includes(String(count))),'stage '+stage+' shows mapped coverage');
      check((await page.evaluate(()=>mathSpace.snapshot())).visibleNodes.length===537,'stage '+stage+' preserves the complete graph');
      if(stage==='stage-1')await page.screenshot({path:path.join(out,'desktop-grade-filter-stage-1.png')});
    }
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-network-relationship-view-v1')||'null')?.selectedGradeStage==='stage-3');
    await page.reload();
    await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().gradeStageFilter==='stage-3'&&mathSpace.snapshot().gradeStageMatchedIds.length===255);
    assertUnmoved(original,await stablePose(),'reload restores stage filter without moving the graph');
    await page.locator('[data-action="grade-map-stage"][data-stage="all"]').click();
    await page.waitForFunction(()=>mathSpace.snapshot().gradeStageFilter==='all'&&mathSpace.snapshot().gradeStageMatchedIds.length===0);
    assertUnmoved(original,await stablePose(),'all restores unfiltered source positions');
    await page.screenshot({path:path.join(out,'desktop-grade-filter-all.png')});
    for(const [id,expect] of [
      ['mt_s2mfRBoTal',['1—2年级','3—4年级','证据：']],
      ['mt_zMEvtigoM3',['数学思维节点','不分配小学学段']],
      ['mt_b4lbTOJYwI',['未纳入当前课程阶段映射','初中后续','保留未决']],
      ['mt_h02-C8PRrj',['未纳入当前课程阶段映射','证据：']]
    ]){
      await page.goto(url.replace('#atlas','#space/node/'+id));
      await page.waitForFunction(id=>window.mathSpace&&mathSpace.snapshot().selected==='node:'+id,id);
      await page.locator('#focus-card .grade-node-position').waitFor();
      await page.waitForFunction(()=>!document.querySelector('#focus-card .grade-node-position')?.textContent.includes('正在读取'));
      const text=await page.locator('#focus-card .grade-node-position').innerText();
      for(const phrase of expect)check(text.includes(phrase),id+' maintains source fact '+phrase);
      check(await page.locator('#focus-card [data-action="grade-view-node"],#focus-card [data-action="grade-view-pack"]').count()===0,'node detail does not link back to retired matrix');
    }
    // A legacy URL and saved UI mode must not resurrect the retired map.
    const legacyContext=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    try{
      const oldPage=await legacyContext.newPage();
      await oldPage.goto(url);
      await oldPage.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
      const originalLearning=await oldPage.evaluate(async()=>{
        const {KEY,fresh}=await import('./exploration-core.js');
        const {createActivity}=await import('./exploration-core.js');
        const {activityIds}=await import('./exploration-content.js');
        const state=fresh();state.bookmarks=['mt_s2mfRBoTal'];
        state.visited['mt_b4lbTOJYwI']='2026-10-01T00:00:00.000Z';
        state.activities[activityIds[0]]=createActivity(activityIds[0]);
        const raw=JSON.stringify(state);localStorage.setItem(KEY,raw);
        localStorage.setItem('math-explorer-world-mode-v1','classic');
        localStorage.setItem('math-explorer-network-layout-v1','49');
        return raw;
      });
      for(const oldUrl of [
        'http://127.0.0.1:43827/?world=classic&layout=49#atlas',
        'http://127.0.0.1:43827/?world=network&layout=49#space/node/mt_s2mfRBoTal',
        'http://127.0.0.1:43827/#atlas'
      ]){
        await oldPage.goto(oldUrl);
        await oldPage.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().networkVersion===53);
        check(await oldPage.evaluate(()=>document.body.dataset.world==='network'&&location.search.includes('world=network')&&location.search.includes('layout=53')),'legacy URL and saved mode resolve to the single relationship panorama');
        check(await oldPage.locator('#grade-map-filter').isVisible(),'legacy entry still exposes stage filtering');
        const observedLearning=await oldPage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
        // Visiting the deep link legitimately appends a visited timestamp.
        // Verify no pre-existing learning facts are lost, rather than byte equality.
        const beforeState=JSON.parse(originalLearning),afterState=JSON.parse(observedLearning||'null');
        check(!!afterState&&beforeState.bookmarks.every(id=>afterState.bookmarks?.includes(id))&&
          Object.entries(beforeState.visited).every(([id,at])=>afterState.visited?.[id]===at)&&
          Object.keys(beforeState.activities).every(id=>afterState.activities?.[id]?.id===id)&&
          Object.keys(beforeState.lessons).every(id=>afterState.lessons?.[id]?.id===id),
          'legacy entry retains prior bookmarks, visits and learning activities');
        if(oldUrl.includes('/node/'))check(!!afterState.visited['mt_s2mfRBoTal'],'deep link records the new visit without deleting prior data');
        check(await oldPage.locator('[data-action="switch-world"],[data-action="switch-layout"]').count()===0,'legacy map entry controls do not reappear');
        if(oldUrl.includes('/node/'))check((await oldPage.evaluate(()=>mathSpace.snapshot())).selected==='node:mt_s2mfRBoTal','legacy node link retains its selected knowledge point');
      }
      // Retired flat-map links must use the existing 3D geometry and preserve deep links.
      for(const [fragment,selected] of [
        ['atlas',null],['map',null],['atlas/reasoning','pack:reasoning'],
        ['pack/reasoning','pack:reasoning'],['theme/space','theme:space'],
        ['node/mt_s2mfRBoTal','node:mt_s2mfRBoTal']
      ]){
        await oldPage.goto('http://127.0.0.1:43827/v2.html#'+fragment);
        await oldPage.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().networkVersion===53);
        check(new URL(oldPage.url()).pathname.endsWith('/index.html'),'retired v2 route '+fragment+' redirects to the unified 3D application');
        check(await oldPage.locator('.atlas-svg,.theme-grid,.graph-shell').count()===0,'retired route does not recreate a 2D map');
        if(selected)check((await oldPage.evaluate(()=>mathSpace.snapshot())).selected===selected,'retired deep link retains '+selected);
      }
      await oldPage.goto('http://127.0.0.1:43827/v2.html#trail');
      await oldPage.locator('.journal-grid').waitFor();
      check(await oldPage.locator('[data-do="export"],[data-do="import"]').count()===2,'historical trail keeps export and import controls');
      const keptState=await oldPage.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
      check(keptState.bookmarks.includes('mt_s2mfRBoTal')&&!!keptState.activities[Object.keys(JSON.parse(originalLearning).activities)[0]],'retired 2D map cleanup preserves bookmarks and learning records');
      const activityId=await oldPage.evaluate(async()=> (await import('./exploration-content.js')).activityIds[0]);
      await oldPage.goto('http://127.0.0.1:43827/v2.html#activity/'+activityId);
      await oldPage.locator('.activity-shell .activity-tabs').waitFor();
      check(new URL(oldPage.url()).pathname.endsWith('/v2.html'),'historical activity remains available in v2');
      await oldPage.goto('http://127.0.0.1:43827/v2.html#about');
      await oldPage.locator('.about-copy').waitFor();
      check(await oldPage.locator('.about-copy').isVisible(),'source and learning explanation remains available');
      await oldPage.goto('http://127.0.0.1:43827/?world=network&layout=53#atlas');
      await oldPage.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
      await oldPage.locator('#trail-count').click();
      await oldPage.frameLocator('#utility-frame').locator('.journal-grid').waitFor();
      check(await oldPage.frameLocator('#utility-frame').locator('[data-do="export"]').isVisible(),'3D journal drawer still embeds v2 record and backup tools');
      await oldPage.screenshot({path:path.join(out,'desktop-3d-embedded-trail.png')});
      await oldPage.frameLocator('#utility-frame').locator('a[href="index.html#atlas"]').click();
      await oldPage.waitForFunction(()=>document.querySelector('#utility-drawer').hidden);
      check(await oldPage.locator('#grade-map-filter').isVisible(),'embedded trail returns to parent 3D panorama instead of nesting a second map');
    }finally{await legacyContext.close();}
    await page.setViewportSize({width:980,height:760});
    await page.goto(url);
    await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
    await page.locator('#network-legend [data-action="network-theme"][data-id="space"]').click();
    await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:space');
    const rect=await page.locator('#focus-card').evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight};});
    check(rect.left>=0&&rect.right<=rect.w&&rect.top>=0&&rect.bottom<=rect.h,'compact desktop knowledge card stays inside viewport: '+JSON.stringify(rect));
    check(errors.length===0,'no browser exceptions: '+JSON.stringify(errors));
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));
    console.log(JSON.stringify({passed:checks.length,errors}));
  }catch(e){
    await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(e)},null,2));
    console.error(e.stack);process.exitCode=1;
  }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
