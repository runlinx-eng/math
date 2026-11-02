// Current v53 guided-walk regression. Historical click-through guide tests
// were superseded by map-target actions; this does not assess child learning.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/spatial-guide-walk');
const base='http://127.0.0.1:43827/?world=network&layout=53&v=56#space';
const checks=[],errors=[],check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
const snap=p=>p.evaluate(()=>mathSpace.snapshot());
const state=p=>p.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));
const samePose=(a,b)=>a.position.every((v,i)=>Math.abs(v-b.position[i])<1e-6)&&a.target.every((v,i)=>Math.abs(v-b.target[i])<1e-6)&&Math.abs(a.cameraZoom-b.cameraZoom)<1e-6;
const visit=async p=>{const cue=p.locator('#guide-cues [data-action="guide-visit"]').first();await cue.waitFor({state:'visible'});await cue.click();};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const initial=await snap(page),coords=JSON.stringify(initial.positions);
  await page.locator('[data-action="guide-start"]').click();
  let s=await snap(page);
  check(s.guide.step===0&&s.guide.edges.length===0,'orientation starts from the whole atlas');
  check((await state(page)).daily.guide.active,'orientation state is stored without learning completion');
  await visit(page);
  check((await snap(page)).guide.step===1,'clicking the theme starts the source walk');
  await visit(page);await visit(page);
  check(await page.locator('[data-action="guide-step"][data-step="2"]').isEnabled(),'the real first link was explored');
  await page.locator('[data-action="guide-step"][data-step="2"]').click();
  s=await snap(page);
  check(s.guide.step===2&&s.guide.edges.length===5,'the fork retains three starting edges and two branches');
  await page.waitForTimeout(300);
  const before=await snap(page);await page.reload();
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().guide?.step===2);
  s=await snap(page);
  check(samePose(before,s)&&JSON.stringify(s.positions)===coords,'reloading preserves the guide step and saved camera');
  check(!await page.locator('[data-action="guide-step"][data-step="3"]').isEnabled(),'an incomplete observation is not automatically certified after reload');
  await visit(page);await visit(page);
  await page.locator('[data-action="guide-step"][data-step="3"]').click();
  await visit(page);
  await page.locator('[data-action="guide-step"][data-step="4"]').click();
  s=await snap(page);
  const real=await page.evaluate(async()=>{
   const graph=await(await fetch('./data/atlas.json')).json();
   const edges=mathSpace.snapshot().guide.edges;
   return edges.every(e=>graph.edges.some(x=>x.prerequisiteId===e.from&&x.topicId===e.to&&x.strength===e.strength));
  });
  check(real,'every highlighted connection is present in the upstream atlas');
  check(s.guide.step===4&&await page.locator('#guide-cues [data-action="guide-visit"]').count()>=1,'free exploration offers locatable genuine next nodes');
  check(samePose(initial,s)&&JSON.stringify(s.positions)===coords,'five steps never change fixed coordinates or camera');
  await page.screenshot({path:path.join(out,'guided-walk.png')});
  await visit(page);
  s=await snap(page);
  check(s.guide===null&&s.selected?.startsWith('node:'),'final selection returns to ordinary node exploration');
  check(!(await state(page)).daily.guide.active,'the orientation exits without saving a learning completion');
  await page.locator('[data-action="guide-start"]').click();
  check((await snap(page)).guide.step===0,'restarting after the final choice begins at the forest entrance');
  await page.locator('[data-action="guide-exit"]').click();
  check(samePose(initial,await snap(page)),'manual exit preserves camera and map');
  check(errors.length===0,'no browser page errors');
  fs.writeFileSync(path.join(out,'guide-results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors}));
 }catch(error){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'guide-results.json'),JSON.stringify({checks,errors,failed:String(error),childTrial:false},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
