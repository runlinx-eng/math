// B first batch: fixed #239 desktop viewport; use the actual lesson and map.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('../tests/helpers/standard-desktop-viewport.cjs');
const base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
const dir=path.resolve(process.env.MATH_B_EVIDENCE||'verification/learning-workbench-b');
const aKey='node:mt_Ep7TDFuYUa';
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const result={checks:[],errors:[],passed:false};
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await newDesktopContext(browser,{reducedMotion:'reduce'}),page=await ctx.newPage();
 page.on('pageerror',e=>result.errors.push(e.message));
 const verify=(condition,label)=>{assert.ok(condition,label);result.checks.push(label);};
 const shot=name=>page.screenshot({path:path.join(dir,name+'.png')});
 const foreground=expected=>page.waitForFunction(expected=>document.body.dataset.workbenchForeground===expected,expected);
 const read=()=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
 try{
  assert.deepEqual(page.viewportSize(),STANDARD_DESKTOP_VIEWPORT);
  await page.goto(base+'/index.html?surface=learn#space/node/mt_Ep7TDFuYUa');
  await page.waitForFunction(()=>window.mathSpace?.snapshot().journeyOpen&&document.querySelector('#journey-frame').contentWindow.mathLesson?.snapshot()?.id==='equivalent',{},{timeout:60000});
  const frame=page.frames().find(f=>f.url().includes('learn.html')&&f.url().endsWith('#equivalent'));
  assert.ok(frame,'mounted real equivalent lesson');
  const token=await frame.evaluate(()=>window.__workbenchEvidenceToken='same-document-'+Math.random());
  const same=async()=>verify(await frame.evaluate(()=>window.__workbenchEvidenceToken)===token,'same live child document');
  const beat=()=>frame.locator('#workbench-beats [aria-current="step"]').getAttribute('data-beat');
  await foreground('learn');verify(await beat()==='try','fresh lesson can manipulate without a new reading gate');
  verify(await frame.locator('#workbench-beats li').count()===4,'four visual beats');
  await frame.waitForFunction(()=>document.body.dataset.workbenchShell==='fixed'&&matchMedia('(min-height:440px) and (min-width:340px)').matches&&getComputedStyle(document.querySelector('#workbench-stage')).display==='block');
  const location=()=>frame.evaluate(()=>{
    const grade=document.querySelector('#workbench-curriculum'),status=document.querySelector('#status');
    return {session:grade.dataset.sessionId,node:grade.dataset.topicId,scope:grade.dataset.scope,
      state:grade.dataset.state,stages:grade.dataset.stageIds,evidence:grade.dataset.evidence,label:grade.textContent,
      ordinal:status.dataset.taskOrdinal,total:status.dataset.taskTotal,view:status.dataset.view,status:status.textContent};
  });
  const beforeLocation=await read();
  await frame.waitForFunction(()=>document.querySelector('#workbench-curriculum')?.dataset.state==='mapped');
  const initialLocation=await location();result.location={initial:initialLocation};
  assert.deepEqual(initialLocation,{session:'equivalent',node:'mt_Ep7TDFuYUa',scope:'native',state:'mapped',stages:'stage-2 stage-3',evidence:'conceptual',label:'知识学段：3—4年级（延伸） / 5—6年级（主要）',ordinal:'1',total:'3',view:'task',status:'任务 1 / 3'});
  verify(true,'active knowledge shows both exact source curriculum stages and the actual first of three tasks');
  verify(await read()===beforeLocation,'reading course location does not create a learner event');
  await frame.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const shell=()=>frame.evaluate(()=>{
    const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
    const stage=document.querySelector('#workbench-stage');
    // Measured child geometry only; the desktop context is never resized.
    const measuredChildViewport={width:innerWidth,height:innerHeight};
    return {header:box('#lesson > header'),title:box('#scene .stage-top'),stage:box('#workbench-stage'),footer:box('#scene .execution-command'),height:stage.clientHeight,scrollHeight:stage.scrollHeight,scrollTop:stage.scrollTop,outerScroll:window.scrollY,viewport:measuredChildViewport,overflowY:getComputedStyle(stage).overflowY,drawer:box('#workbench-drawer'),regions:Array.from(stage.querySelectorAll(':scope > .learning-region'),el=>el.id),recordInside:stage.contains(document.querySelector('#record')),recordInDrawer:document.querySelector('#record').parentElement.id==='workbench-drawer',supportInDrawer:document.querySelector('#learning-support').parentElement.id==='workbench-drawer',inert:stage.inert};
  });
  const fixed=await shell();result.geometry={initial:fixed};
  verify(!fixed.recordInside&&fixed.recordInDrawer&&fixed.supportInDrawer&&fixed.height>0&&fixed.overflowY==='auto'&&fixed.header.bottom<=fixed.title.top+1&&fixed.title.bottom<=fixed.stage.top+1&&fixed.stage.bottom<=fixed.drawer.top+1&&fixed.drawer.bottom<=fixed.footer.top+1&&fixed.footer.bottom<=fixed.viewport.height+1,'separate header, scroll stage, auxiliary strip and non-overlapping command bar');
  assert.deepEqual(fixed.regions,['learning-problem','learning-interaction','learning-check','learning-next']);
  verify(!fixed.inert&&!await frame.locator('#learning-support').evaluate(el=>el.open)&&await frame.locator('#record').isHidden(),'auxiliary content defaults closed; empty history stays hidden');
  verify(await frame.locator('#actions').count()===1,'one existing action container');
  await shot('01-learning-foreground');
  await frame.locator('#actions [data-do="check"]').click();
  verify(await beat()==='check'&&await frame.locator('#scene').getAttribute('data-stage')==='revise','actual incorrect check enters correction');
  const beforeDrawer=await read(),beforeScroll=await shell();
  await frame.locator('#workbench-stage').evaluate(el=>el.scrollTop=el.scrollHeight);
  const stageScrolled=await shell();result.geometry.beforeScroll=beforeScroll;result.geometry.stageScrolled=stageScrolled;
  verify(stageScrolled.scrollHeight>stageScrolled.height&&stageScrolled.scrollTop>0&&stageScrolled.outerScroll===0,'long real mathematical content scrolls independently');
  for(const key of ['header','title','stage','drawer','footer'])assert.deepEqual(stageScrolled[key],beforeScroll[key]);
  await shot('01b-stage-scrolled');
  const stageInert=value=>frame.waitForFunction(value=>document.querySelector('#workbench-stage').inert===value,value);
  await frame.locator('#record > summary').press('Enter');await stageInert(true);
  verify(await frame.locator('#record').evaluate(el=>el.open)&&await frame.locator('#record-body').isVisible(),'existing real history opens by keyboard in the drawer');
  verify(await frame.locator('#record-body [data-do="relations"]').isVisible(),'existing map relationship action remains reachable');
  const recordPanel=frame.locator('#record-drawer-panel');
  await recordPanel.focus();await recordPanel.press('Escape');await stageInert(false);
  verify(!await frame.locator('#record').evaluate(el=>el.open)&&await frame.locator('#record > summary').evaluate(el=>el.ownerDocument.activeElement===el),'Escape closes history and restores keyboard focus');
  await frame.locator('#learning-support > summary').press('Enter');await stageInert(true);
  verify(await frame.locator('#learning-support').evaluate(el=>el.open),'existing optional support opens by keyboard');
  await frame.locator('#route-collapsible > summary').click();
  verify(await frame.locator('#route button').first().isVisible(),'original configured course routes remain reachable');
  await frame.locator('.p3-application > summary').click();
  await frame.locator('.p3-application > details > summary').click();
  const supportPanel=frame.locator('#learning-support-drawer-panel');
  const panel=await supportPanel.evaluate(el=>{el.scrollTop=el.scrollHeight;const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:el.clientHeight,scrollHeight:el.scrollHeight,scrollTop:el.scrollTop};});
  const scrolled=await shell();result.geometry.drawerScrolled={...scrolled,panel};
  assert.deepEqual(scrolled.viewport,beforeScroll.viewport,'opening auxiliary content does not resize the child viewport');
  verify(panel.scrollHeight>panel.height&&panel.scrollTop>0&&scrolled.scrollTop===stageScrolled.scrollTop&&scrolled.outerScroll===0,'long real optional content scrolls independently of the mathematical stage');
  verify(panel.top>=scrolled.stage.top-1&&panel.bottom<=scrolled.drawer.top+1&&panel.bottom<=scrolled.footer.top+1,'drawer never covers the fixed header or command bar');
  for(const key of ['header','title','stage','drawer','footer'])assert.deepEqual(scrolled[key],stageScrolled[key]);
  await shot('01c-auxiliary-drawer');
  await frame.locator('#record > summary').press('Enter');
  await frame.waitForFunction(()=>document.querySelector('#record').open&&!document.querySelector('#learning-support').open);
  verify(true,'only one auxiliary disclosure remains open');
  await recordPanel.focus();await recordPanel.press('Escape');await stageInert(false);
  verify(await read()===beforeDrawer,'opening, scrolling and closing original history and support without taking a hint leaves State-v2 byte-for-byte unchanged');
  for(const [row,index] of [[0,1],[1,2],[2,3]])await frame.locator('#work [data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
  verify(await frame.locator('#scene').getAttribute('data-stage')==='recheck','edit invalidates previous feedback');
  const before=await read(),snapshot=await frame.evaluate(()=>window.mathLesson.snapshot());
  assert.ok(before);
  const label=page.locator('.space-label.node:not([data-key="'+aKey+'"]):visible').first();
  await label.waitFor({state:'visible'});
  const bKey=await label.getAttribute('data-key');verify(!!bKey&&bKey!==aKey,'another real visible node');
  await label.click();
  await foreground('map');
  await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key,bKey);
  await same();
  // A real map visit may append the original visited/openedPacks entries.
  // The remaining State-v2, including the live lesson, must stay identical.
  assert.ok(bKey.startsWith('node:'));
  const bId=bKey.slice(5),packId=await page.evaluate(async id=>{
   const response=await fetch('./data/atlas.json');if(!response.ok)throw new Error('atlas unavailable');
   const atlas=await response.json();return atlas.packs.find(p=>p.nodeIds.includes(id))?.id;
  },bId);
  assert.ok(packId,'selected node belongs to a real source pack');
  const afterMap=await read(),actual=JSON.parse(afterMap),expected=JSON.parse(before);
  assert.ok(actual.visited[bId],'original map visit persisted');
  if(!Object.hasOwn(expected.visited,bId)){
   expected.visited[bId]=actual.visited[bId];
   assert.ok(actual.openedPacks[packId],'original map pack visit persisted');
   expected.openedPacks[packId]??=actual.openedPacks[packId];
  }
  assert.deepEqual(actual,expected,'only original selected-node and pack visit additions allowed');
  verify(true,'real map visit preserves all lesson and unrelated state');
  assert.deepEqual(await frame.evaluate(()=>window.mathLesson.snapshot()),snapshot);
  const mapLocation=await location();assert.deepEqual(mapLocation,initialLocation);result.location.mapForeground=mapLocation;
  verify(true,'another real map node cannot replace the active course curriculum or task position');
  await shot('02-map-foreground');
  await frame.locator('#instruction').click();
  await foreground('learn');await same();verify(await read()===afterMap,'focus return without new learner events');
  verify(await frame.locator('#scene').getAttribute('data-stage')==='recheck','unsubmitted correction remains live');
  const toggle=page.locator('#workbench-focus-toggle');await toggle.press('Enter');await foreground('map');
  await toggle.press('Enter');await foreground('learn');await same();
  verify(await read()===afterMap,'keyboard foreground toggle is presentation only');
  await frame.locator('#actions [data-do="check"]').click();
  verify(await frame.locator('#scene').getAttribute('data-stage')==='passed','original grader accepts the corrected work');
  verify(JSON.parse(await read()).lessons.equivalent.cases[0].attempts.length===2,'original wrong and corrected submissions retained');
  await shot('03-corrected-original-task');
  const oldIndex=(await frame.evaluate(()=>window.mathLesson.snapshot())).index;
  await frame.locator('#learning-support > summary').press('Enter');await stageInert(true);
  await frame.locator('#actions [data-do="next"]').click();
  await stageInert(false);
  verify(!await frame.locator('#learning-support').evaluate(el=>el.open),'original Next closes the optional drawer and resumes mathematical work');
  verify((await frame.evaluate(()=>window.mathLesson.snapshot())).index===oldIndex+1,'original Next advances exactly one task after a correct check');
  const nextLocation=await location();result.location.next=nextLocation;
  assert.deepEqual(nextLocation,{...initialLocation,ordinal:'2',status:'任务 2 / 3'});
  verify(true,'actual Next advances the displayed task position without relabeling the active knowledge');
  const advanced=await shell();result.geometry.advanced=advanced;
  verify(advanced.scrollTop===0&&advanced.outerScroll===0,'new real task starts at the top of the independent stage');
  await shot('04-next-original-task');
  verify(result.errors.length===0,'no page errors');result.passed=true;
 }catch(e){result.failure=e.stack;await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result,null,2));await ctx.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
