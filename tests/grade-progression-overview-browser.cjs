// A2-2 browser acceptance: the grade matrix is a second observation of the same map.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/grade-progression-overview');
const url='http://127.0.0.1:43827/?v=57&world=network&layout=53#atlas';
const checks=[],errors=[],check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack||String(e)));
 const runMobileChecks=process.env.MATH_RUN_MOBILE_TESTS==='true';
 const pose=()=>page.evaluate(()=>{const s=mathSpace.snapshot();return JSON.stringify({position:s.position,target:s.target,zoom:s.cameraZoom,positions:s.positions});});
 try{
  await page.goto(url);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.snapshot().selected);
  await page.waitForFunction(()=>mathSpace.motion().tween===null);
  const originalPose=await pose();
  const source=await page.evaluate(async()=>await(await fetch('./data/grade-progression.json')).json());
  // Read-only curriculum overlay in the ORIGINAL 3D panorama, without entering the grade matrix.
  await page.waitForFunction(()=>mathSpace.snapshot().gradeStageFilter==='all');
  check(await page.locator('#grade-map-filter').isVisible(),'the original panorama offers the inline curriculum node filter');
  check(await page.locator('[data-action="grade-map-stage"]').count()===4,'three honest two-year stages plus all are offered');
  const overlayStart=await pose();
  for(const [stage,count] of [['stage-1',187],['stage-2',259],['stage-3',255]]){
    await page.locator('[data-action="grade-map-stage"][data-stage="'+stage+'"]').click();
    await page.waitForFunction(({stage,count})=>mathSpace.snapshot().gradeStageFilter===stage&&mathSpace.snapshot().gradeStageMatchedIds.length===count,{stage,count});
    check((await pose())===overlayStart,'switching '+stage+' never changes camera pose or original node positions');
    check(await page.locator('#grade-observation-view').isHidden(),'stage filter does not open another grade space or matrix');
    check(await page.locator('#grade-map-filter-status').innerText().then(s=>s.includes(String(count))),'stage filter displays grounded coverage count');
  }
  await page.locator('[data-action="grade-map-stage"][data-stage="all"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().gradeStageFilter==='all'&&mathSpace.snapshot().gradeStageMatchedIds.length===0);
  check((await pose())===overlayStart,'all restores the original complete 3D map at same coordinates');
  await page.locator('[data-action="observation-mode"][data-mode="grade"]').click();
  await page.waitForFunction(()=>!document.querySelector('#grade-observation-view')?.hidden&&document.querySelectorAll('.grade-pack-row').length===23);
  check(await page.locator('#network-view-title').isHidden(),'grade mode hides the original guide content without wrapping its grid children');
  check(await page.locator('#grade-observation-view').isVisible(),'grade mode opens inside the existing guide panel');
  check(await page.locator('[data-action="grade-select"]').count()===6,'all six year-entry buttons are present');
  check(await page.locator('.grade-theme-row').count()===5,'all five theme groups are present');
  check(await page.locator('.grade-pack-row').count()===23,'all 23 knowledge groups are present');
  const actualGroups=await page.locator('.grade-theme-row').evaluateAll(rows=>rows.map(row=>({id:row.dataset.themeId,count:Number(row.querySelector('small')?.textContent.match(/\d+/)?.[0]||0)})));
  check(JSON.stringify(actualGroups)===JSON.stringify([{id:'numbers',count:6},{id:'space',count:4},{id:'measure',count:5},{id:'patterns',count:4},{id:'data',count:4}]),'five theme groups preserve source order and source counts');
  const actualPacks=await page.locator('.grade-pack-row').evaluateAll(rows=>rows.map(row=>({id:row.dataset.packId,marks:[...row.querySelectorAll('.grade-mark')].map(mark=>mark.textContent.trim())})));
  const expectedPacks=source.packs.map(pack=>({id:pack.packId,marks:source.stages.map(stage=>{const judgement=pack.stageJudgements[stage.id];return judgement.recordStatus==='incomplete'?'待补充':judgement.markLabel;})}));
  check(JSON.stringify(actualPacks)===JSON.stringify(expectedPacks),'all 69 matrix labels match the source pack-stage judgements exactly');
  const years=['stage-1','stage-1','stage-2','stage-2','stage-3','stage-3'];
  for(let grade=1;grade<=6;grade++){
   await page.locator('[data-action="grade-select"][data-grade="'+grade+'"]').click();
   await page.waitForFunction(stage=>document.querySelector('.grade-current-stage')?.dataset.selectedStage===stage,years[grade-1]);
   check(await page.locator('[data-action="grade-select"][data-grade="'+grade+'"]').getAttribute('aria-pressed')==='true','year '+grade+' has a clear selected state');
   check(await page.locator('.grade-stage-heading.is-current').getAttribute('data-stage-id')===years[grade-1],'year '+grade+' selects its correct two-year stage');
  }
  check(await page.locator('.grade-pack-row[data-pack-id="time"] td[data-stage-id="stage-3"] .grade-mark').textContent()==='待补充','time stage-3 displays 待补充, never a dash');
  await page.locator('.grade-pack-toggle[data-pack-id="time"]').click();
  await page.locator('#grade-pack-detail-time').waitFor();
  const timeDetail=await page.locator('#grade-pack-detail-time').innerText();
  check(timeDetail.includes('阶段标记')&&timeDetail.includes('标记文字')&&timeDetail.includes('审查状态'),'incomplete time-stage detail exposes its exact missing fields');
  check(timeDetail.includes('需要独立教研复核'),'available independent-review requirement is shown for time stage-2');
  check(timeDetail.includes('当前记录未提供课程依据条目'),'missing time stage-3 evidence is not fabricated');
  await page.locator('.grade-pack-toggle[data-pack-id="time"]').click();
  await page.locator('#grade-pack-detail-time').waitFor({state:'detached'});
  await page.locator('.grade-pack-toggle[data-pack-id="number-sense"]').click();
  await page.locator('#grade-pack-detail-number-sense').waitFor();
  const numberDetail=await page.locator('#grade-pack-detail-number-sense').innerText();
  check(numberDetail.includes('CN-MATH-2022-S1-NUMBER'),'group detail shows the source curriculum reference ID');
  check(numberDetail.includes('明确要求理解万以内数的意义'),'group detail shows the recorded course-basis explanation');
  check(numberDetail.includes('AI辅助审查不等同于独立教研'),'AI review is not presented as independent pedagogical validation');

  // A2-3 batch 2: enter the original node detail from the grade list without camera movement.
  await page.locator('.grade-pack-toggle[data-pack-id="add-subtract"]').click();
  await page.locator('#grade-pack-detail-add-subtract').waitFor();
  const linkedNode=page.locator('.grade-domain-node[data-node-id="mt_s2mfRBoTal"]');
  check(await linkedNode.count()===1,'the multi-stage domain node appears exactly once in its source knowledge group');
  const linkedStageText=await linkedNode.locator('.grade-node-stage-tags').innerText();
  check(linkedStageText.includes('1—2年级：main')&&linkedStageText.includes('3—4年级：extension')&&linkedStageText.includes('5—6年级：未映射'),'the node keeps all three primary-stage roles, including explicit unmapped stages');
  check((await linkedNode.innerText()).includes('证据：Direct'),'the node evidence category is displayed separately from its roles');
  const beforeNodeSelection=await pose();
  await linkedNode.locator('.grade-domain-node-link').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='relationship'&&mathSpace.snapshot().selected==='node:mt_s2mfRBoTal');
  check((await pose())===beforeNodeSelection,'selecting a grade-list node preserves camera pose, zoom and every original node coordinate');
  check(await page.locator('#focus-card').isVisible(),'grade-list selection opens the existing original knowledge-point detail card');
  check(await page.locator('#focus-card .network-relations').count()>0,'the original direct relationship exploration remains available from the detail card');
  await page.locator('[data-action="observation-mode"][data-mode="grade"]').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='grade'&&mathSpace.snapshot().selected==='node:mt_s2mfRBoTal');
  check(await page.locator('#grade-pack-detail-add-subtract').isVisible(),'returning to grade observation restores the expanded knowledge group');
  check(await page.locator('.grade-domain-node-link[data-node-id="mt_s2mfRBoTal"]').getAttribute('aria-current')==='true','the same node identity remains selected in the grade list');
  check((await pose())===beforeNodeSelection,'switching back to grade observation still preserves the original map pose');
  check((await pose())===originalPose,'mode, year selection and expand/collapse preserve the exact map camera and node positions');

  // A2-3 batch 3: reverse navigation from the original node detail to its grade group.
  await page.locator('[data-action="observation-mode"][data-mode="relationship"]').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='relationship'&&document.querySelector('#focus-card .grade-node-position'));
  const positionText=await page.locator('#focus-card .grade-node-position').innerText();
  check(positionText.includes('1—2年级：main')&&positionText.includes('3—4年级：extension')&&positionText.includes('5—6年级：未映射'),'the original node detail shows all real primary-stage roles');
  check(positionText.includes('证据：Direct')&&positionText.includes('所属知识群：'),'the original detail keeps evidence separate and names the source knowledge group');
  await page.locator('#focus-card [data-action="grade-view-node"][data-node-id="mt_s2mfRBoTal"]').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='grade'&&mathSpace.snapshot().selected==='node:mt_s2mfRBoTal');
  check(await page.locator('#grade-pack-detail-add-subtract').isVisible(),'the reverse entry expands the node’s original knowledge group');
  check(await page.locator('[data-action="grade-select"][data-grade="6"]').getAttribute('aria-pressed')==='true','reverse navigation preserves the user’s selected year');
  check(await page.locator('.grade-domain-node-link[data-node-id="mt_s2mfRBoTal"]').getAttribute('aria-current')==='true','reverse navigation preserves the same node identity');
  await page.waitForFunction(()=>{
    const values=Object.keys(localStorage).filter(key=>/view/i.test(key)).map(key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}});
    return values.some(view=>view?.observationMode==='grade'&&view.selectedGrade===6&&view.expandedGradePackId==='add-subtract'&&view.selected==='node:mt_s2mfRBoTal');
  });
  const beforeReloadPose=await pose();
  await page.reload();
  await page.waitForFunction(()=>window.mathSpace&&document.body.dataset.observationMode==='grade'&&mathSpace.snapshot().selected==='node:mt_s2mfRBoTal'&&!document.querySelector('#grade-observation-view').hidden);
  await page.locator('#grade-pack-detail-add-subtract').waitFor();
  check(await page.locator('[data-action="grade-select"][data-grade="6"]').getAttribute('aria-pressed')==='true','reload restores the selected year');
  check(await page.locator('.grade-domain-node-link[data-node-id="mt_s2mfRBoTal"]').getAttribute('aria-current')==='true','reload restores the selected node in its original knowledge group');
  check((await pose())===beforeReloadPose,'reload restores the saved map camera and original node coordinates');

  // A2-3 batch 4: special nodes preserve the distinction between group and node-level status.
  await page.locator('.grade-pack-toggle[data-pack-id="add-subtract"]').click();
  await page.locator('#grade-pack-detail-add-subtract').waitFor({state:'detached'});
  await page.locator('.grade-pack-toggle[data-pack-id="time"]').click();
  await page.locator('#grade-pack-detail-time').waitFor();
  const timeNode=page.locator('.grade-domain-node[data-node-id="mt_5J2quSTspi"]');
  const timeNodeText=await timeNode.innerText();
  check(timeNodeText.includes('5—6年级：extension')&&timeNodeText.includes('证据：Adjacent'),'time node keeps its stage-three extension role and adjacent evidence');
  check(await page.locator('.grade-pack-row[data-pack-id="time"] td[data-stage-id="stage-3"] .grade-mark').textContent()==='待补充','the incomplete group-level stage-three judgment remains 待补充 while node-level roles stay visible');
  await page.locator('.grade-pack-toggle[data-pack-id="time"]').click();
  await page.locator('#grade-pack-detail-time').waitFor({state:'detached'});
  await page.locator('.grade-pack-toggle[data-pack-id="number-sense"]').click();
  await page.locator('#grade-pack-detail-number-sense').waitFor();
  const thinkingRow=page.locator('.grade-thinking-node[data-node-id="mt_zMEvtigoM3"]');
  check(await thinkingRow.count()===1&&await page.locator('.grade-domain-node[data-node-id="mt_zMEvtigoM3"]').count()===0,'a mathematical-thinking node appears only in its separate list, never in the 537-domain-node list');
  const adjacentMainRow=page.locator('.grade-domain-node[data-node-id="mt_IzQvs7k_sE"]');
  const adjacentMainText=await adjacentMainRow.innerText();
  check(adjacentMainText.includes('1—2年级：extension')&&adjacentMainText.includes('3—4年级：main')&&adjacentMainText.includes('5—6年级：未映射')&&adjacentMainText.includes('证据：Adjacent'),'Adjacent evidence remains separate from the node’s extension/main roles');
  const unresolvedRow=page.locator('.grade-domain-node[data-node-id="mt_b4lbTOJYwI"]');
  const unresolvedRowText=await unresolvedRow.innerText();
  check(unresolvedRowText.includes('小学阶段：未纳入当前课程阶段映射')&&unresolvedRowText.includes('初中后续：main')&&unresolvedRowText.includes('证据：Adjacent')&&unresolvedRowText.includes('保留未决'),'the unresolved node keeps its non-primary status, junior-high role, adjacent evidence and unresolved note');
  const beforeThinkingPose=await pose();
  await thinkingRow.locator('.grade-thinking-node-link').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='relationship'&&mathSpace.snapshot().selected==='node:mt_zMEvtigoM3');
  const thinkingPosition=await page.locator('#focus-card .grade-node-position').innerText();
  check(thinkingPosition.includes('数学思维节点')&&thinkingPosition.includes('不分配小学学段'),'the original detail keeps mathematical thinking outside primary-stage assignment');
  check(await page.locator('#focus-card .grade-node-position .grade-node-stage-tags').count()===0&&await page.locator('#focus-card .grade-node-position-evidence').count()===0,'mathematical-thinking detail does not fabricate stage roles or evidence');
  check((await pose())===beforeThinkingPose,'selecting a mathematical-thinking node does not move the original map');
  await page.locator('#focus-card [data-action="grade-view-pack"][data-node-id="mt_zMEvtigoM3"]').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='grade'&&mathSpace.snapshot().selected==='node:mt_zMEvtigoM3');
  check(await page.locator('.grade-thinking-node-link[data-node-id="mt_zMEvtigoM3"]').getAttribute('aria-current')==='true','the separate thinking-node selection is preserved when returning to its group');
  await page.locator('.grade-domain-node-link[data-node-id="mt_b4lbTOJYwI"]').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='relationship'&&mathSpace.snapshot().selected==='node:mt_b4lbTOJYwI');
  const unresolvedPosition=await page.locator('#focus-card .grade-node-position').innerText();
  check(unresolvedPosition.includes('小学阶段：未纳入当前课程阶段映射')&&unresolvedPosition.includes('初中后续：main')&&unresolvedPosition.includes('证据：Adjacent')&&unresolvedPosition.includes('保留未决'),'the original detail preserves the unresolved node’s actual primary, junior-high, evidence and review states');
  check(await page.locator('#focus-card .grade-node-position .grade-node-stage-tags').count()===0,'junior-high-only node is not assigned to an elementary stage');
  await page.locator('#focus-card [data-action="grade-view-pack"][data-node-id="mt_b4lbTOJYwI"]').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='grade'&&mathSpace.snapshot().selected==='node:mt_b4lbTOJYwI');
  await page.locator('.grade-pack-toggle[data-pack-id="number-sense"]').click();
  await page.locator('#grade-pack-detail-number-sense').waitFor({state:'detached'});
  await page.locator('.grade-pack-toggle[data-pack-id="solids"]').click();
  await page.locator('#grade-pack-detail-solids').waitFor();
  const notCoveredRow=page.locator('.grade-domain-node[data-node-id="mt_h02-C8PRrj"]');
  check((await notCoveredRow.innerText()).includes('小学阶段：未纳入当前课程阶段映射')&&(await notCoveredRow.innerText()).includes('证据：Not-covered'),'Not-covered node stays visible without a fabricated elementary-stage assignment');
  await notCoveredRow.locator('.grade-domain-node-link').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='relationship'&&mathSpace.snapshot().selected==='node:mt_h02-C8PRrj');
  const notCoveredPosition=await page.locator('#focus-card .grade-node-position').innerText();
  check(notCoveredPosition.includes('小学阶段：未纳入当前课程阶段映射')&&notCoveredPosition.includes('证据：Not-covered')&&await page.locator('#focus-card .grade-node-position .grade-node-stage-tags').count()===0,'the original detail keeps Not-covered as evidence rather than a grade');
  await page.locator('#focus-card [data-action="grade-view-pack"][data-node-id="mt_h02-C8PRrj"]').click();
  await page.waitForFunction(()=>document.body.dataset.observationMode==='grade'&&mathSpace.snapshot().selected==='node:mt_h02-C8PRrj');

  await page.screenshot({path:path.join(out,'desktop-grade-matrix.png'),fullPage:false});
  await page.locator('[data-action="observation-mode"][data-mode="relationship"]').click();
  check(await page.locator('#network-view-title').isVisible()&&await page.locator('#grade-observation-view').isHidden(),'returning to relationship panorama restores the original guide content');
  check((await pose())===originalPose,'returning to relationship panorama leaves the map camera and positions unchanged');
  check((await page.evaluate(()=>mathSpace.snapshot())).visibleNodes.length===537,'the original 537-node map remains present');

  if(runMobileChecks){
    await page.setViewportSize({width:390,height:844});
    await page.locator('[data-action="observation-mode"][data-mode="grade"]').click();
    await page.waitForFunction(()=>document.querySelectorAll('.grade-pack-row').length===23&&!document.querySelector('#grade-observation-view').hidden);
    const mobile=await page.evaluate(()=>{
     const panel=document.querySelector('#network-guide'),table=document.querySelector('.grade-matrix-scroll'),name=document.querySelector('.grade-pack-name');
     const p=panel.getBoundingClientRect(),n=name.getBoundingClientRect();
     return {panel:{left:p.left,right:p.right,top:p.top,bottom:p.bottom},width:innerWidth,height:innerHeight,horizontalScroll:table.scrollWidth>table.clientWidth,name:{left:n.left,right:n.right,scrollWidth:name.scrollWidth,clientWidth:name.clientWidth}};
    });
    check(mobile.panel.left>=0&&mobile.panel.right<=390&&mobile.panel.top>=0&&mobile.panel.bottom<=844,'mobile grade panel stays within the viewport');
    check(mobile.horizontalScroll,'mobile matrix provides horizontal scrolling for the three stage columns');
    check(mobile.name.left>=mobile.panel.left&&mobile.name.right<=mobile.panel.right,'mobile knowledge-group names remain inside the panel');
    await page.locator('.grade-pack-toggle[data-pack-id="time"]').click();
    await page.locator('#grade-pack-detail-time').scrollIntoViewIfNeeded();
    const mobileDetails=await page.locator('#grade-pack-detail-time').evaluate(el=>{
     const panel=document.querySelector('#network-guide').getBoundingClientRect(),grid=el.querySelector('.grade-detail-grid'),cards=[...el.querySelectorAll('.grade-detail-stage')].map(card=>{const r=card.getBoundingClientRect();return {left:r.left,right:r.right};});
     return {columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,cards,panel:{left:panel.left,right:panel.right}};
    });
    check(mobileDetails.columns===1,'mobile stage details stack vertically');
    check(mobileDetails.cards.length===3&&mobileDetails.cards.every(card=>card.left>=mobileDetails.panel.left&&card.right<=mobileDetails.panel.right),'all three stage details fit within the mobile panel');
    await page.screenshot({path:path.join(out,'mobile-grade-matrix.png'),fullPage:false});

    await page.locator('.grade-pack-toggle[data-pack-id="time"]').click();
    await page.locator('#grade-pack-detail-time').waitFor({state:'detached'});
    await page.locator('.grade-pack-toggle[data-pack-id="number-sense"]').click();
    await page.locator('#grade-pack-detail-number-sense').scrollIntoViewIfNeeded();
    const mobileNodeList=await page.locator('#grade-pack-detail-number-sense .grade-node-list').evaluate(el=>{
      const panel=document.querySelector('#network-guide').getBoundingClientRect(),r=el.getBoundingClientRect();
      const items=[...el.querySelectorAll('.grade-domain-node,.grade-thinking-node')];
      return {left:r.left,right:r.right,panelLeft:panel.left,panelRight:panel.right,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,itemsFit:items.every(item=>{const box=item.getBoundingClientRect();return box.left>=panel.left-1&&box.right<=panel.right+1;})};
    });
    check(mobileNodeList.left>=mobileNodeList.panelLeft-1&&mobileNodeList.right<=mobileNodeList.panelRight+1&&mobileNodeList.scrollWidth<=mobileNodeList.clientWidth&&mobileNodeList.itemsFit,'mobile node-level details fit the guide panel without horizontal overflow');
    await page.screenshot({path:path.join(out,'mobile-grade-node-list.png'),fullPage:false});
  }


  check(errors.length===0,'no browser JavaScript exceptions: '+JSON.stringify(errors));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,childTrial:false,mobileChecks:runMobileChecks?'executed':'skipped-by-scope'},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,mobileChecks:runMobileChecks?'executed':'skipped-by-scope'}));
 }catch(error){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(error),childTrial:false},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
