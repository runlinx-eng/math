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
  await shot('01-learning-foreground');
  await frame.locator('#actions [data-do="check"]').click();
  verify(await beat()==='check'&&await frame.locator('#scene').getAttribute('data-stage')==='revise','actual incorrect check enters correction');
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
  verify(result.errors.length===0,'no page errors');result.passed=true;
 }catch(e){result.failure=e.stack;await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result,null,2));await ctx.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
