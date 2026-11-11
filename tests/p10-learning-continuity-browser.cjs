// P10 real browser: actual mathematical controls + persisted localStorage + SW.
// Results are technical evidence, not Mac, child or independent teaching review.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p10-learning-continuity');
const base='http://127.0.0.1:43827/';
const checks=[],errors=[];
const check=(yes,label)=>{if(!yes)throw Error(label);checks.push(label);};
const read=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',serviceWorkers:'allow'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 const waitLesson=async(id='equivalent')=>page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,id);
 const picture=async name=>page.screenshot({path:path.join(out,name+'.png')});
 try{
  await page.goto(base+'learn.html#equivalent');
  await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
  await page.reload();await waitLesson();
  check(await page.locator('#scene>.learning-region').evaluateAll(els=>JSON.stringify(els.map(e=>e.id))===JSON.stringify(['learning-problem','learning-interaction','learning-check','learning-next'])),'fixed four-region learning layout');
  const other=await ctx.newPage();
  await other.goto(base+'learn.html#equivalent');
  await other.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='equivalent');
  await page.locator('#actions [data-do="check"]').click();
  let state=await read(page);
  check(state.lessons.equivalent.cases[0].attempts.length===1,'first real incorrect submission persisted');
  const before=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
  await other.locator('[data-do="row-part"][data-row="0"][data-index="1"]').click();
  check((await other.locator('#storage-warning').innerText()).includes('已停止保存'),'stale learning tab shows a blocking warning');
  check(await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===before,'stale tab did not overwrite real stored attempt');
  await picture('01-concurrent-save-protected');
  await other.close();

  await page.locator('#actions [data-do="hint"]').click();
  for(const [row,index] of [[0,1],[1,2],[2,3]])
   await page.locator('#work [data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
  check(await page.locator('#scene').getAttribute('data-stage')==='recheck','editing removes stale check state');
  await page.reload();await waitLesson();
  check(await page.locator('#scene').getAttribute('data-stage')==='recheck','refresh restores corrected unsubmitted work');
  state=await read(page);
  check(state.lessons.equivalent.cases[0].attempts.length===1&&state.lessons.equivalent.cases[0].support===true,'wrong attempt and hint history survive refresh');
  await page.locator('#actions [data-do="check"]').click();
  check(await page.locator('#scene').getAttribute('data-stage')==='passed','corrected math submission passes original grader');
  check((await read(page)).lessons.equivalent.cases[0].attempts.length===2,'both submissions remain in real storage');
  await picture('02-recheck-passed');

  await page.locator('#actions [data-do="next"]').click();
  await page.locator('input[data-field="mark"]').fill('4');
  await page.locator('#actions [data-do="check"]').click();
  check(await page.locator('#scene').getAttribute('data-stage')==='passed','number line second task checked');
  await page.locator('#actions [data-do="next"]').click();
  await page.locator('input[data-field="mark"]').fill('6');
  await page.locator('#actions [data-do="check"]').click();
  await page.locator('#actions [data-do="next"]').click();
  check(await page.locator('#scene').getAttribute('data-stage')==='reflect','all three actual tasks reach reflection');
  await page.locator('#note').fill('观察同一个整体，用不同的等分方法表示同一个位置。');
  await page.locator('[data-do="save-note"]').click();
  state=await read(page);
  check(state.lessons.equivalent.notes.length===1&&state.lessons.equivalent.cases[2].attempts.length===1,'reflection and all task checks persisted');
  await page.reload();await waitLesson();
  check((await page.locator('#scene').getAttribute('data-stage'))==='reflect','completed summary restores after reload');
  check((await page.locator('.saved-note-preview').innerText()).includes('同一个整体'),'saved free explanation survives reload');
  await picture('03-full-lesson-restored');

  // This is a fresh page (simulating a closed browser view), not a mocked state.
  await page.goto(base+'v2.html#trail');
  await page.locator('#import-file').waitFor();
  check((await page.locator('#main').innerText()).includes('等值分数'),'completed actual lesson appears in trail');
  const download=page.waitForEvent('download');
  await page.locator('[data-do="export"]').first().click();
  const dl=await download;const file=await dl.path();
  const payload=fs.readFileSync(file,'utf8');
  check(JSON.parse(payload).state.lessons.equivalent.notes.length===1,'exported real backup contains completed summary');

  // Import into another isolated browser profile via actual file input.
  const imported=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'allow'});
  const importedPage=await imported.newPage();
  await importedPage.goto(base+'v2.html#trail');await importedPage.locator('#import-file').waitFor();
  await importedPage.locator('#import-file').setInputFiles({name:'p10-learning-backup.json',mimeType:'application/json',buffer:Buffer.from(payload)});
  await importedPage.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')||'{}').lessons?.equivalent?.notes?.length===1);
  check((await read(importedPage)).lessons.equivalent.cases[0].attempts.length===2,'real backup import restores correction history in separate storage');
  await imported.close();

  // First-load cache is not an installer. Offline is a real network-disconnected context.
  await page.goto(base+'index.html?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(async()=>{
   const keys=await caches.keys();return keys.some(k=>k.startsWith('math-explorer-'));
  });
  await ctx.setOffline(true);
  await page.goto(base+'learn.html#equivalent',{waitUntil:'domcontentloaded'});
  await waitLesson();
  check(await page.locator('#scene').getAttribute('data-stage')==='reflect','completed lesson reopens offline from cached resources');
  await page.goto(base+'index.html?world=network&layout=53#space',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  check(!!(await page.evaluate(()=>window.mathSpace?.snapshot()?.counts?.nodes===587)),'cached 3D map reopens offline');
  await ctx.setOffline(false);
  await page.goto(base+'v2.html#trail');await page.locator('#import-file').waitFor();
  check((await read(page)).lessons.equivalent.notes.length===1,'network restoration does not lose written discovery');
  check(errors.length===0,'no uncaught browser page errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,offlineMode:'real Chromium context offline',tests:'equivalent actual task sequence, import/export and concurrent tabs',mac:false,child:false,pedagogy:false},null,2));
  console.log('P10 continuity Chromium '+checks.length+' checks passed');
 }catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({checks,errors,error:String(e),stack:e.stack},null,2));await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.error(e.stack||e);process.exitCode=1;}
 finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
