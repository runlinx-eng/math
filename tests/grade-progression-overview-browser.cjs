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
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const pose=()=>page.evaluate(()=>{const s=mathSpace.snapshot();return JSON.stringify({position:s.position,target:s.target,zoom:s.cameraZoom,positions:s.positions});});
 try{
  await page.goto(url);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537&&!mathSpace.snapshot().selected);
  await page.waitForFunction(()=>mathSpace.motion().tween===null);
  const originalPose=await pose();
  const source=await page.evaluate(async()=>await(await fetch('./data/grade-progression.json')).json());
  await page.locator('[data-action="observation-mode"][data-mode="grade"]').click();
  await page.waitForFunction(()=>!document.querySelector('#grade-observation-view')?.hidden&&document.querySelectorAll('.grade-pack-row').length===23);
  check(await page.locator('#relationship-observation-content').isHidden(),'grade mode hides only the original guide content');
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
  check((await pose())===originalPose,'mode, year selection and expand/collapse preserve the exact map camera and node positions');
  await page.screenshot({path:path.join(out,'desktop-grade-matrix.png'),fullPage:false});
  await page.locator('[data-action="observation-mode"][data-mode="relationship"]').click();
  check(await page.locator('#relationship-observation-content').isVisible()&&await page.locator('#grade-observation-view').isHidden(),'returning to relationship panorama restores the original guide content');
  check((await pose())===originalPose,'returning to relationship panorama leaves the map camera and positions unchanged');
  check((await page.evaluate(()=>mathSpace.snapshot())).visibleNodes.length===537,'the original 537-node map remains present');

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
  check(errors.length===0,'no browser JavaScript exceptions');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors}));
 }catch(error){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(error),childTrial:false},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
