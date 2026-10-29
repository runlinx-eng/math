async original => {
 const browser=original.context().browser(),ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',acceptDownloads:true}),page=await ctx.newPage();
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B09/regression/',checks=[],errors=[],remote=[];let restoreCtx,legacyPage;
 const check=(v,label)=>{if(!v)throw new Error(label);checks.push(label);};
 page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(String(e)));ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
 const snap=()=>page.evaluate(()=>window.mathLesson.snapshot());
 const range=async(locator,n)=>{await locator.focus();await locator.press('Home');for(let i=0;i<n;i++)await locator.press('ArrowRight');};
 const field=async(key,value)=>{await page.locator(`[data-field="${key}"]`).fill(String(value));};
 const fixture={
  share:[{cuts:[20,40,60,80],selected:[0]},{cuts:[25,50,75],selected:[0,1,2]},{cuts:[100/6,200/6,50,400/6,500/6],selected:[0,1]}],
  equivalent:[{rows:[2,3,4]},{mark:4},{mark:6}],
  decimal:[{count:70,decimal:'.7'},{count:45,decimal:'.45'},{count:26,decimal:'.26',fraction:'26/100'},{mark:30}],
  quarters:[{count:25,decimal:'.25'},{heights:[50,75,25],names:['.5','.75','.25']}],
  space:[{filled:8,total:8},{surface:'square',inside:'cube',total:6}],
  hidden:[{filled:12,perLayer:6,layers:2,total:12},{perLayer:9,layers:3,total:27},{filled:16,perLayer:8,layers:2,total:16,estimate:20}],
  box:[{perLayer:12,layers:5,total:60},{method:'count',total:58}],
  steps:[{axis:'y',cut:1,first:8,second:8,total:16},{axis:'x',cut:2,first:12,second:6,total:18}],
  tally:[{counts:[6,3,2],answer:3},{counts:[4,6,3],answer:4},{counts:[3,5,2],answer:2}],
  survey:[{seen:9,counts:[4,3,2],choice:0},{seen:10,counts:[2,4,3,1],choice:1}],
  bars:[{counts:[7,4,2,3],answer:3,axes:true},{counts:[3,5,8,2],answer:5}],
  views:[{counts:[5,3,2],left:3,right:3,preferred:'bar'},{counts:[3,6,4],left:4,right:4,preferred:'table'}],
 };
 try{
  await page.goto(base+'?v=11#space');await page.waitForFunction(()=>window.mathSpace);
  check(await page.locator('#overall-count').innerText()==='0 / 127','overview starts with one hundred eighteen available nodes in the expanded catalog');
  check(await page.locator('.space-label.theme:visible').count()===5,'five simple initial directions remain');
  legacyPage=await ctx.newPage();await legacyPage.goto(base+'v2.html#activity/fair');await legacyPage.locator('[data-stage="explain"]').click();
  await page.locator('[data-action="search"]').click();await page.locator('#search-input').fill('装得下多少');await page.locator('#search-results [data-key="pack:volume"]').click();await page.locator('[data-action="choose-route"][data-id="B"]').click();
  check(await page.locator('.route-choice').count()===4,'volume group presents four numbered learning choices');
  await page.screenshot({path:root+'map-volume-route.png'});
  await page.locator('#focus-card [data-key="node:mt_d7XktBQPxm"]').click();const frame=page.frameLocator('#journey-frame');await frame.locator('[data-do="spread"]').waitFor();
  check(await page.locator('#journey-surface header span').innerText()==='路线 B','embedded title matches its actual route');
  check(await page.locator('.work-panel').count()===0,'learning opens a single operation surface, without parallel panels');
  await frame.locator('[data-do="spread"]').click();
  const canvas=frame.locator('canvas'),bb=await canvas.boundingBox();const before=await frame.locator('body').evaluate(()=>window.mathLesson.snapshot().cube.camera);
  await page.mouse.move(bb.x+bb.width*.5,bb.y+bb.height*.55);await page.mouse.down();await page.mouse.move(bb.x+bb.width*.7,bb.y+bb.height*.5,{steps:10});await page.mouse.up();
  const after=await frame.locator('body').evaluate(()=>window.mathLesson.snapshot().cube.camera);
  check(JSON.stringify(before)!==JSON.stringify(after),'direct drag rotates the actual Three.js cube camera');await page.screenshot({path:root+'embedded-cubes.png'});
  await page.locator('[data-action="close-journey"]').click();if(await page.locator('[data-action="choose-route"][data-id="B"]').count())await page.locator('[data-action="choose-route"][data-id="B"]').click();check(await page.locator('.route-choice').count()===4,'closing the work surface returns to its own volume route');
  for(const [id,models] of Object.entries(fixture)){
   await page.goto(base+'learn.html#'+id);await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,id);
   check((await snap()).summary.completed===false,id+' begins incomplete');
   if(id==='hidden'){
    const old=(await snap()).cube.cells.length;await range(page.locator('[data-dimension="0"]'),3);check((await snap()).cube.cells.length!==old,'changing a box dimension actually changes its cube geometry');
    await page.locator('[data-do="spread"]').click();await page.screenshot({path:root+'hidden-play.png'});
   }
   if(id==='bars'){
    const bar=page.locator('[data-bar="0"]'),r=await bar.boundingBox(),chart=await page.locator('.chart').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+1);await page.mouse.down();await page.mouse.move(r.x+r.width/2,chart.y+chart.height-5*18,{steps:7});await page.mouse.up();
    check((await state()).lessons.bars.models['-1'].counts[0]===5,'dragging a bar changes its count by the same visual scale');
   }
   await page.locator('[data-do="start"]').click();
   for(let i=0;i<models.length;i++){
    const m=models[i];check((await snap()).index===i,id+' task '+i+' opens');
    if(m.cuts){
     for(let k=0;k<m.cuts.length;k++){const handle=page.locator(`[data-cut="${k}"]`),r=await handle.boundingBox(),whole=await page.locator('.bar').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+15);await page.mouse.down();await page.mouse.move(whole.x+whole.width*m.cuts[k]/100,r.y+15,{steps:6});await page.mouse.up();}
     for(const k of m.selected)await page.locator(`[data-do="part"][data-index="${k}"]`).click();
    }
    if(m.rows)for(let k=0;k<m.rows.length;k++)await page.locator(`[data-do="row-part"][data-row="${k}"][data-index="${m.rows[k]-1}"]`).click();
    if(m.mark!==undefined)await range(page.locator('[data-field="mark"]'),m.mark);
    if(m.count!==undefined){for(let j=0;j<Math.floor(m.count/10);j++)await page.locator('[data-do="row-fill"]').click();for(let j=Math.floor(m.count/10)*10;j<m.count;j++)await page.locator(`[data-do="cell"][data-index="${j}"]`).click();await field('decimal',m.decimal);if(m.fraction)await field('fraction',m.fraction);}
    if(m.heights)for(let k=0;k<m.heights.length;k++){await range(page.locator(`[data-height="${k}"]`),m.heights[k]/5);await page.locator(`[data-name="${k}"]`).fill(m.names[k]);}
    if(m.estimate!==undefined){await page.locator('[data-do="fill-next"]').click();check((await state()).lessons[id].models[i].filled.length===0,'estimation is saved before any cube is placed');await field('estimate',m.estimate);}
    if(m.filled)for(let j=0;j<m.filled;j++)await page.locator('[data-do="fill-next"]').click();
    if(m.surface){await page.locator('[data-do="unit"][data-field="surface"][data-value="square"]').click();await page.locator('[data-do="unit"][data-field="inside"][data-value="cube"]').click();}
    if(m.axis){await page.locator('[data-field="axis"]').selectOption(m.axis);await range(page.locator('[data-field="cut"]'),m.cut-1);}
    if(m.method)await page.locator(`[data-do="method"][data-value="${m.method}"]`).click();
    for(const k of ['perLayer','layers','total','first','second','answer','left','right'])if(m[k]!==undefined)await field(k,m[k]);
    if(m.seen)for(let k=0;k<m.seen;k++)await page.locator('[data-do="observe"]').click();
    if(m.counts)for(let k=0;k<m.counts.length;k++){if(m.seen)await page.locator(`[data-count-input="${k}"]`).fill(String(m.counts[k]));else for(let j=0;j<m.counts[k];j++)await page.locator(`[data-do="count"][data-row="${k}"][data-delta="1"]`).click();}
    if(m.axes){await page.locator('[data-field="xLabel"]').selectOption('category');await page.locator('[data-field="yLabel"]').selectOption('count');}
    if(m.choice!==undefined)await page.locator('[data-field="choice"]').selectOption(String(m.choice));
    if(m.preferred)await page.locator('[data-field="preferred"]').selectOption(m.preferred);
    if(id==='decimal'&&i===0){await field('decimal','.07');await page.locator('[data-do="check"]').click();check((await snap()).summary.done===0,'wrong decimal place value cannot finish a task');await field('decimal','.7');}
    if(id==='hidden'&&i===0){await page.locator('[data-do="spread"]').click();check((await state()).lessons.hidden.cases[0].support,'opening layers before committing records help');}
    if(id==='hidden'&&i===1)check(await page.locator('[data-do="turn"]').isDisabled(),'fixed-view drawing cannot be rotated before support or feedback');
    if(id==='survey'&&i===1){const ev=page.waitForEvent('download');await page.locator('[data-do="csv"]').click();const stream=await(await ev).createReadStream();let csv='';for await(const c of stream)csv+=c.toString();check(csv.includes('"1 人",4'),'child-created frequency table exports correct counts');}
    await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[i].complete,id+' task '+i+' accepts its constructed result');
    if(i===0){await page.screenshot({path:root+id+'-task.png'});}
    if(id==='quarters'&&i===0){await page.reload();await page.waitForFunction(()=>window.mathLesson);check((await snap()).summary.cases[0].complete,'reload restores the same activity and submitted result');}
    await page.locator('[data-do="next"]').click();
   }
   check((await snap()).view==='summary'&&(await snap()).summary.completed,id+' finishes only after all its tasks');
   await page.locator('#note').fill('我用自己的作品留下一个发现。');await page.locator('[data-do="save-note"]').click();check((await state()).lessons[id].notes.length===1,id+' saves an unassessed explanation');
  }
  let saved=await state();check(saved.lessons.decimal.cases[0].attempts.length===2&&saved.lessons.decimal.cases[0].attempts[1].exposed,'the original error survives later correction');
  await page.goto(base+'?v=11#space');await page.waitForFunction(()=>window.mathSpace);
  check(await page.locator('#overall-count').innerText()==='12 / 127','completed unique topics aggregate to twelve, not duplicated activities');
  await page.locator('[data-action="menu"]').click();await page.locator('#menu-popover [data-action="continue"]').click();await page.frameLocator('#journey-frame').locator('[data-do="start"]').waitFor();check((await page.frameLocator('#journey-frame').locator('#status').innerText())==='未完成','after the twelve legacy nodes, continue suggests new content');
  await page.reload();await page.waitForFunction(()=>window.mathSpace);await page.frameLocator('#journey-frame').locator('[data-do="start"]').waitFor();check((await page.frameLocator('#journey-frame').locator('body').evaluate(()=>window.mathLesson.snapshot().id))==='rows','parent refresh restores the newly opened activity');
  await page.locator('[data-action="close-journey"]').click();
  await page.locator('[data-action="menu"]').click();const downloadEvent=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const download=await downloadEvent,stream=await download.createReadStream();let exported='';for await(const c of stream)exported+=c.toString();check(Object.keys(JSON.parse(exported).state.lessons).length===13,'main backup includes the twelve completed lessons and new working draft');
  restoreCtx=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});const restored=await restoreCtx.newPage();await restored.goto(base+'?v=11#space');await restored.waitForFunction(()=>window.mathSpace);
  await restored.locator('#import-file').setInputFiles({name:'phase2-backup.json',mimeType:'application/json',buffer:Buffer.from(exported)});await restored.waitForFunction(()=>document.querySelector('#overall-count').textContent==='12 / 127');check(true,'actual import restores all twelve progress records in a separate browser');
  await page.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('离线就绪'));await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await ctx.setOffline(true);await page.goto(base+'learn.html#steps');await page.waitForFunction(()=>window.mathLesson);check((await snap()).summary.completed,'new activities reopen with the network unavailable');await ctx.setOffline(false);
  await legacyPage.locator('#explanation').fill('旧活动窗口仍在，不能盖掉新的学习记录。');check(Object.keys((await state()).lessons).length===13,'a stale standalone legacy page cannot erase new lessons');
  await page.locator('#note').fill('回到新活动也保留旧草稿。');await page.locator('[data-do="save-note"]').click();check((await state()).activities.fair.draft.includes('不能盖掉'),'a new activity write retains the legacy draft');
  await legacyPage.goto(base+'v2.html#trail');await legacyPage.locator('[data-lesson-record]').first().waitFor();check(await legacyPage.locator('[data-lesson-record]').count()===13,'the shared record view includes completed lessons and the new working draft');
  check(errors.length===0,'no JavaScript runtime errors');check(remote.length===0,'no external network requests from learning pages');
  const result={checks,errors,remote,availableTopics:127,taskCount:30};await page.evaluate(r=>console.log(JSON.stringify(r)),result);return result;
 }catch(error){await page.screenshot({path:root+'failure.png'}).catch(()=>{});return {failed:String(error),checks,errors,remote,url:page.url(),body:(await page.locator('body').innerText()).slice(-2500)};}
 finally{await ctx.close();if(restoreCtx)await restoreCtx.close();}
}
