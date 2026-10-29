async original=>{
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B28/regression/b27/',browser=original.context().browser(),ctx=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',timezoneId:'Asia/Shanghai',acceptDownloads:true}),page=await ctx.newPage();let other;
 const checks=[],errors=[],remote=[],check=(v,l)=>{if(!v)throw Error(l);checks.push(l);};page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(String(e)));ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 const scene=()=>page.evaluate(()=>mathSpace.snapshot()),state=()=>page.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2'))),lesson=()=>page.frames().find(f=>f.url().includes('learn.html'));const f=page.frameLocator('#journey-frame');
 const reveal=async e=>{for(let n=0;n<4;n++){const d=e.locator('xpath=ancestor::details[not(@open)]').first();if(!(await d.count()))break;await d.locator(':scope > summary').click();}};
 const field=async(k,v)=>{const e=f.locator('[data-xfield="'+k+'"]');await reveal(e);if(await e.evaluate(e=>e.tagName)==='SELECT')await e.selectOption(String(v));else if(await e.getAttribute('type')==='range'){await e.fill(String(v));await e.dispatchEvent('change');}else await e.fill(String(v));},click=async(a,data={})=>{const e=f.locator('[data-x="'+a+'"]'+Object.entries(data).map(([k,v])=>'[data-'+k+'="'+v+'"]').join('')).last();await reveal(e);await e.click();};

 try{
  await page.goto(base+'?v=33#space/pack/solids');await page.waitForFunction(()=>window.mathSpace);
  check(await page.locator('#overall-count').innerText()==='0 / 445','445 unique nodes');
  check(await page.locator('[data-action="choose-section"]').count()===3,'three directions remain');
  await page.locator('[data-action="choose-section"][data-id="solid-cut"]').click();
  check(await page.locator('[data-action="choose-route"]').count()===1,'one short slicing route');
  await page.locator('[data-action="choose-route"][data-id="FH"]').click();
  check(await page.locator('#focus-card ol li').count()===2,'FH contains two nodes');
  await page.reload();await page.waitForFunction(()=>window.mathSpace);check((await scene()).learningRouteId==='FH','route survives refresh');
  await page.screenshot({path:root+'route-fh.png'});
  await page.locator('#focus-card ol button').nth(1).click();await f.locator('[data-do="start"]').click();
  await click('g27-predict',{index:'smaller'});let a=(await state()).lessons.prismslices;
  check(a.models[0].board.first.prediction0==='smaller'&&a.models[0].board.bad&&a.cases[0].support,'wrong first prediction is retained and marks support');
  await field('position',1);await field('prose','如果换一刀的方向，切面还会是三角形吗？');
  let frame=lesson(),before=(await frame.evaluate(()=>mathLesson.snapshot())).extra.camera,box=await f.locator('#extra-world canvas').boundingBox();
  await page.mouse.move(box.x+box.width*.52,box.y+box.height*.48);await page.mouse.down();await page.mouse.move(box.x+box.width*.61,box.y+box.height*.55,{steps:8});await page.mouse.up();
  let cam=(await frame.evaluate(()=>mathLesson.snapshot())).extra.camera;
  check(cam.some((n,i)=>Math.abs(n-before[i])>.01),'drag rotates the real 3D model');
  a=(await state()).lessons.prismslices;const originalModel=structuredClone(a.models[0]);
  check(originalModel.board.observations[0].includes(1)&&originalModel.prose.includes('方向'),'first cut position and original prose retained');
  const world=await scene(),qtext='如果把这一刀歪一点，还是三角形吗？';
  await f.locator('[data-do="question"]').click();await page.locator('#question-text').fill(qtext);await page.locator('.question-dialog [type="submit"]').click();
  await field('position',3);await click('g27-answer',{index:'same'});await field('prose','我先比较了两个位置。');
  await page.locator('[data-action="close-journey"]').click();await page.locator('[data-action="overview"]').click();
  await page.clock.setFixedTime(new Date(Date.now()+86400000));await page.reload();await page.waitForFunction(()=>window.mathSpace);
  check((await page.locator('#continue-card').innerText()).includes(qtext),'simulated next day shows exact question');
  await page.locator('#continue-card [data-action="continue"]').click();await f.locator('#question-context').waitFor();frame=lesson();
  const s=await state();check(JSON.stringify(s.lessons.prismslices.models[0])===JSON.stringify(originalModel),'original unfinished model and wrong prediction restored');
  check(s.daily.questions[0].events.at(-1).displaced.record.models[0].board.observations[0].includes(3),'later cut position kept as displaced draft');
  check((await f.locator('#question-context').innerText()).includes(qtext),'question words restored');
  let resumed=(await frame.evaluate(()=>mathLesson.snapshot())).extra.camera;
  check(cam.every((n,i)=>Math.abs(n-resumed[i])<1e-6),'lesson camera restored');
  const restored=await scene();check(world.position.every((v,i)=>Math.abs(v-restored.position[i])<1e-6)&&world.target.every((v,i)=>Math.abs(v-restored.target[i])<1e-6),'world camera restored');
  await page.locator('[data-action="close-journey"]').click();await page.locator('[data-action="menu"]').click();const event=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const stream=await(await event).createReadStream();let json='';for await(const part of stream)json+=part.toString();
  check(JSON.parse(json).state.lessons.prismslices.models[0].board.observations[0].includes(1),'actual backup contains original cut');
  other=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'});const p=await other.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base+'?v=33#space');await p.waitForFunction(()=>window.mathSpace);
  for(let i=0;i<2;i++){await p.locator('#import-file').setInputFiles({name:'b27.json',mimeType:'application/json',buffer:Buffer.from(json)});await p.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已合并'));}
  const imported=await p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));
  check(imported.daily.questions.length===1&&imported.lessons.prismslices.cases[0].support,'repeat import keeps question and support');
  await p.locator('#continue-card [data-action="continue"]').click();await p.frameLocator('#journey-frame').locator('#question-context').waitFor();
  check((await p.frameLocator('#journey-frame').locator('#question-context').innerText()).includes(qtext),'import opens original question');
  await page.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offline-status').textContent.includes('离线就绪'));
  const cache=await page.evaluate(async()=>{const name=(await caches.keys()).find(n=>n.includes('learning-v33')),c=await caches.open(name);return{name,count:(await c.keys()).length,modules:await Promise.all(['b27.js','b27-model.js','b27-view.js','b27-geometry.js','b27-solid-view.js','b27.css'].map(async n=>!!await c.match('./learning/phase5/'+n)))};});
  check(cache.modules.every(Boolean),'all six B27 files cached');await ctx.setOffline(true);await page.reload();await page.waitForFunction(()=>window.mathSpace);
  await page.locator('#continue-card [data-action="continue"]').click();await f.locator('#question-context').waitFor();
  check((await f.locator('#question-context').innerText()).includes(qtext),'original work opens offline');
  await field('position',3);await click('g27-answer',{index:'same'});await f.locator('[data-do="check"]').click();
  check(await lesson().evaluate(()=>mathLesson.snapshot().summary.cases[0].complete),'offline slice comparison completes');
  check(!(await lesson().evaluate(()=>mathLesson.snapshot().summary.cases[0].independent)),'wrong prediction remains assisted');
  check((await state()).lessons.prismslices.models[0].board.first.prediction0==='smaller','first wrong prediction persists');
  check(!errors.length,'no runtime errors');check(!remote.length,'no remote requests');return{checks,errors,remote,cache,childTrial:false};
 }catch(e){await page.screenshot({path:root+'integration-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,failed:String(e),url:page.url(),body:(await page.locator('body').innerText()).slice(-2400)};}finally{await ctx.close();if(other)await other.close();}
}
