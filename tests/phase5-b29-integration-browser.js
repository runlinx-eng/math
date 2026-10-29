async original=>{
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B29/',browser=original.context().browser(),ctx=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',timezoneId:'Asia/Shanghai',acceptDownloads:true}),page=await ctx.newPage();let other;
 const checks=[],errors=[],remote=[],check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(String(e)));ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const scene=()=>page.evaluate(()=>mathSpace.snapshot()),state=()=>page.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2'))),lesson=()=>page.frames().find(f=>f.url().includes('learn.html'));const f=page.frameLocator('#journey-frame');
 const reveal=async e=>{for(let n=0;n<4;n++){const d=e.locator('xpath=ancestor::details[not(@open)]').first();if(!(await d.count()))break;await d.locator(':scope > summary').click();}};
 const field=async(k,v)=>{const e=f.locator('[data-xfield="'+k+'"]');await reveal(e);if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){await e.fill(String(v));await e.dispatchEvent('change');}else await e.fill(String(v));},click=async(a,data={})=>{const e=f.locator('[data-x="'+a+'"]'+Object.entries(data).map(([k,v])=>'[data-'+k+'="'+v+'"]').join('')).last();await reveal(e);await e.click();};


 try{
  await page.goto(base+'?v=34#space/pack/area');await page.waitForFunction(()=>window.mathSpace);
  check(await page.locator('[data-action="choose-route"][data-id="D"]').count()===1&&await page.locator('[data-action="choose-route"][data-id="E"]').count()===1,'area retains both historical routes');
  await page.goto(base+'?v=34#space/pack/volume');await page.waitForFunction(()=>window.mathSpace);
  check(await page.locator('[data-action="choose-route"][data-id="B"]').count()===1&&await page.locator('[data-action="choose-route"][data-id="E"]').count()===1,'volume retains both historical routes');
  await page.goto(base+'?v=34#space/pack/units');await page.waitForFunction(()=>window.mathSpace);
  check(await page.locator('#overall-count').innerText()==='0 / 449','449 unique nodes');
  check(await page.locator('[data-action="choose-section"]').count()===3,'three measurement directions');
  await page.locator('[data-action="choose-section"][data-id="units-change"]').click();
  await page.locator('[data-action="route-page"][data-page="1"]').click();
  check(await page.locator('[data-action="choose-route"][data-id="FU"]').count()===1,'FU is reachable in the second group');
  await page.locator('[data-action="choose-route"][data-id="FU"]').click();
  check(await page.locator('#focus-card ol li').count()===2,'FU contains both new ideas');
  await page.locator('[data-action="choose-route"][data-id=""]').click();
  await page.locator('[data-action="choose-section"][data-id=""]').click();
  await page.locator('[data-action="choose-section"][data-id="units-compare"]').click();
  check(await page.locator('[data-action="choose-route"]').count()===3&&await page.locator('[data-action="choose-route"][data-id="E"]').count()===1,'at most three choices and old E is present');
  await page.locator('[data-action="route-page"][data-page="1"]').click();
  check(await page.locator('[data-action="choose-route"][data-id="FK"]').count()===1&&await page.locator('[data-action="choose-route"][data-id="FT"]').count()===1,'new route is reachable on the second page');
  await page.locator('[data-action="choose-route"][data-id="FT"]').click();
  check(await page.locator('#focus-card ol li').count()===2,'FT contains two nodes');
  await page.reload();await page.waitForFunction(()=>window.mathSpace);check((await scene()).learningRouteId==='FT','route survives refresh');await page.screenshot({path:root+'route-ft.png'});
  await page.locator('#focus-card ol button').first().click();await f.locator('[data-do="start"]').click();
  await field('cut',20);await click('m29-cut');let a=(await state()).lessons.lengthstory;
  check(a.models[0].board.bad&&a.cases[0].support&&a.models[0].board.first.cut==='20','wrong first cut and support are retained');
  check(a.models[0].board.cut===20,'incorrect cut is actual saved work');
  await field('prose','为什么这一段还没有对上？');a=(await state()).lessons.lengthstory;const originalModel=structuredClone(a.models[0]);
  const world=await scene(),qtext='已知的 18 厘米从哪一边开始？';
  await f.locator('[data-do="question"]').click();await page.locator('#question-text').fill(qtext);await page.locator('.question-dialog [type="submit"]').click();
  await field('cut',18);await click('m29-cut');await field('prose','后来我把分界移到了 18。');
  await page.locator('[data-action="close-journey"]').click();await page.locator('[data-action="overview"]').click();
  await page.clock.setFixedTime(new Date(Date.now()+86400000));await page.reload();await page.waitForFunction(()=>window.mathSpace);
  check((await page.locator('#continue-card').innerText()).includes(qtext),'simulated next day shows exact question');
  await page.locator('#continue-card [data-action="continue"]').click();await f.locator('#question-context').waitFor();
  const s=await state();check(JSON.stringify(s.lessons.lengthstory.models[0])===JSON.stringify(originalModel),'unfinished wrong cut and original prose restored');
  check(s.daily.questions[0].events.at(-1).displaced.record.models[0].board.cut===18,'later corrected cut retained separately');
  check((await f.locator('#question-context').innerText()).includes(qtext),'question words restored');
  const restored=await scene();check(world.position.every((v,i)=>Math.abs(v-restored.position[i])<1e-6)&&world.target.every((v,i)=>Math.abs(v-restored.target[i])<1e-6),'world camera restored');
  await page.locator('[data-action="close-journey"]').click();await page.locator('[data-action="menu"]').click();const event=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const stream=await(await event).createReadStream();let json='';for await(const part of stream)json+=part.toString();
  check(JSON.parse(json).state.lessons.lengthstory.models[0].board.cut===20,'actual backup contains original cut');
  other=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'});const p=await other.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base+'?v=34#space');await p.waitForFunction(()=>window.mathSpace);
  for(let i=0;i<2;i++){await p.locator('#import-file').setInputFiles({name:'b29.json',mimeType:'application/json',buffer:Buffer.from(json)});await p.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));}
  const imported=await p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));
  check(imported.daily.questions.length===1&&imported.lessons.lengthstory.cases[0].support,'repeat import keeps question and first error');
  await p.locator('#continue-card [data-action="continue"]').click();await p.frameLocator('#journey-frame').locator('#question-context').waitFor();
  check((await p.frameLocator('#journey-frame').locator('#question-context').innerText()).includes(qtext),'import opens original question');
  await page.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offline-status').textContent.includes('离线就绪'));
  const cache=await page.evaluate(async()=>{const name=(await caches.keys()).find(n=>n.includes('learning-v34')),c=await caches.open(name);return{name,count:(await c.keys()).length,modules:await Promise.all(['b29.js','b29-model.js','b29-view.js','b29.css'].map(async n=>!!await c.match('./learning/phase5/'+n)))};});
  check(cache.modules.every(Boolean),'all four B29 files cached');await ctx.setOffline(true);await page.reload();await page.waitForFunction(()=>window.mathSpace);
  await page.locator('#continue-card [data-action="continue"]').click();await f.locator('#question-context').waitFor();
  check((await f.locator('#question-context').innerText()).includes(qtext),'original work opens offline');
  await field('cut',18);await click('m29-cut');await field('equation','45-18=□');await field('answer',27);await field('unit','cm');await f.locator('[data-do="check"]').click();
  check(await lesson().evaluate(()=>mathLesson.snapshot().summary.cases[0].complete),'offline tape construction completes');
  check(!(await lesson().evaluate(()=>mathLesson.snapshot().summary.cases[0].independent)),'first wrong cut remains supported');
  check((await state()).lessons.lengthstory.models[0].board.bad,'first wrong cut remains after correction');
  check(!errors.length,'no runtime errors');check(!remote.length,'no remote requests');return{checks,errors,remote,cache,childTrial:false};
 }catch(e){await page.screenshot({path:root+'integration-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,failed:String(e),url:page.url(),body:(await page.locator('body').innerText()).slice(-2400)};}finally{await ctx.close();if(other)await other.close();}
}
