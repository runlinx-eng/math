// P8 regression: the current surface gives the meaning of a 3D node selection.
// Explore -> knowledge; Learn -> native workpiece; Trail -> this node's evidence.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p8-node-surfaces');
const check=(v,m)=>{if(!v)throw Error(m);};
const sourceNode='mt_ndGqFPWyen',fractionNode='mt_Ep7TDFuYUa';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[],records=[];
 page.on('pageerror',err=>errors.push(String(err)));
 const nav=key=>page.locator('.primary-nav [data-action="nav-'+key+'"]');
 const frame=page.frameLocator('#journey-frame'),trailFrame=page.frameLocator('#utility-frame');
 const waitNativeTask=async id=>{
  await page.waitForFunction(id=>{
   const f=document.querySelector('#journey-frame');
   return f?.contentWindow?.location.pathname.endsWith('/learn.html')&&
     f.contentWindow.location.hash==='#'+id&&
     !!f.contentDocument?.querySelector('#instruction')?.textContent.trim()&&
     !!f.contentDocument?.querySelector('#work');
  },id);
  check(await frame.locator('#work').isVisible(),'native math workpiece must be visible for '+id);
 };
 const inspect=()=>page.evaluate(()=>({
  selected:mathSpace.snapshot().selected,
  journeyOpen:mathSpace.snapshot().journeyOpen,
  suspended:mathSpace.snapshot().journeySuspended,
  surface:new URL(location.href).searchParams.get('surface')||'explore',
  pressed:[...document.querySelectorAll('.primary-nav [aria-pressed="true"]')].map(n=>n.dataset.surface),
  hub:!document.querySelector('#learning-hub').hidden,
  drawer:document.querySelector('#utility-drawer').hidden?'':document.querySelector('#utility-drawer').dataset.surface,
  trailText:document.querySelector('#trail-node-context')?.textContent||'',
  camera:mathSpace.snapshot().position,
  target:mathSpace.snapshot().target,
  zoom:mathSpace.snapshot().cameraZoom
 }));
 const cameraStable=(a,b)=>a.camera.every((x,i)=>Math.abs(x-b.camera[i])<.002)&&a.target.every((x,i)=>Math.abs(x-b.target[i])<.002)&&Math.abs(a.zoom-b.zoom)<.002;
 const expect=async(surface,selected,name)=>{
  const a=await inspect();check(a.surface===surface&&a.pressed.length===1&&a.pressed[0]===surface,'wrong mode '+name+': '+JSON.stringify(a));
  if(selected)check(a.selected==='node:'+selected,'wrong selected knowledge '+name+': '+JSON.stringify(a));
  records.push({name,mode:a.surface,selected:a.selected,journeyOpen:a.journeyOpen,drawer:a.drawer});
  return a;
 };
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  await page.evaluate(id=>{location.hash='#space/node/'+id;},sourceNode);
  await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,sourceNode);
  let s=await expect('explore',sourceNode,'explore-selected');
  check(!s.journeyOpen&&await page.locator('#focus-card').isVisible(),'Explore must show knowledge card, not a math activity');
  const original=s;
  await nav('learn').click();await waitNativeTask('share');
  s=await expect('learn',sourceNode,'selected-learn');
  check(s.journeyOpen&&!s.suspended,'Learn must open source node native task');
  check(cameraStable(original,s),'mode selection must not move the 3D camera');
  await frame.locator('#actions [data-do="check"]').click();
  check(await frame.locator('#scene').getAttribute('data-stage')==='revise','first native incorrect submission is preserved');
  await nav('trail').click();
  await page.waitForFunction(()=>document.querySelector('#utility-drawer').dataset.surface==='trail');
  s=await expect('trail',sourceNode,'selected-trail');
  check(s.suspended&&s.drawer==='trail'&&s.trailText.includes('1 次检查'),'Trail must show saved attempts for selected node, without leaving this mode');
  check(cameraStable(original,s),'Trail must preserve camera');
  await page.screenshot({path:path.join(out,'01-node-trail-1440x900.png')});
  await page.waitForFunction(()=>document.querySelector('#utility-frame').contentWindow.location.hash==='#trail');
  await trailFrame.locator('[data-do="node"][data-id="'+sourceNode+'"]').first().click();
  // postMessage from the historical iframe is asynchronous: observe the parent
  // processing the navigation before asserting the destination surface.
  await page.waitForFunction(()=>!mathSpace.snapshot().journeyOpen&&document.querySelector('#utility-drawer')?.dataset.surface==='trail');
  s=await expect('trail',sourceNode,'trail-original-node-link');
  check(!s.journeyOpen&&!s.hub,'Trail record -> node preserves Trail context');
  // Directly changing selected knowledge while Trail is active scopes the summary;
  // it cannot silently switch to Explore or open a lesson.
  await page.evaluate(id=>{location.hash='#space/node/'+id;},fractionNode);
  await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,fractionNode);
  s=await expect('trail',fractionNode,'trail-switch-node');
  check(s.drawer==='trail'&&s.trailText.includes('没有可查看的学习记录'),'Trail selection is not a fake completion');
  await page.screenshot({path:path.join(out,'02-trail-other-node-1440x900.png')});
  await nav('explore').click();
  s=await expect('explore',fractionNode,'explore-switch');
  check(!s.journeyOpen&&await page.locator('#focus-card').isVisible(),'Explore follows chosen source node and shows explanation');
  await page.locator('#focus-card [data-action="deselect"]').click();
  await nav('learn').click();
  check(await page.locator('#learning-hub').isVisible(),'Learn without a selected node retains the native entry hub');
  s=await expect('learn',null,'learn-no-selected');
  // A prior failed submission creates a genuine unfinished session, so D5
  // correctly prioritizes Resume and keeps "find another topic" in details.
  const find=page.locator('#learning-hub [data-action="learn-find"]').first();
  if(!(await find.isVisible()))await page.locator('#learning-hub .learning-hub-more > summary').click();
  check(await find.isVisible(),'choosing a different knowledge node stays available beside Resume');
  await find.click();
  check(await page.locator('#search-popover').isVisible(),'Learn selection uses existing search UI');
  s=await expect('learn',null,'learn-search-open');
  check(!s.hub,'search opens over map without returning to Explore');
  await page.locator('#search-input').fill(fractionNode);
  await page.locator('#search-results [data-key="node:'+fractionNode+'"]').click();
  await waitNativeTask('equivalent');
  s=await expect('learn',fractionNode,'search-selected-learn');
  check(s.journeyOpen,'search selection must start that node, not return to Explore');
  await page.screenshot({path:path.join(out,'03-search-to-learning-1440x900.png')});
  await nav('trail').click();
  s=await expect('trail',fractionNode,'learning-to-trail');
  check(s.trailText.includes('没有可查看的学习记录'),'fresh task session is not falsely counted as submitted');
  await page.reload();await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  await page.waitForFunction(()=>document.querySelector('#utility-drawer').hidden===false);
  s=await expect('trail',fractionNode,'trail-reload');
  check(s.drawer==='trail','Trail reload keeps selected node context');
  for(const size of [{width:1280,height:720},{width:620,height:800}]){
   await page.setViewportSize(size);
   const v=await expect('trail',fractionNode,'trail-viewport-'+size.width);
   const bounds=await page.locator('#utility-drawer').boundingBox();
   check(bounds&&bounds.x>=-2&&bounds.y>=-2&&bounds.x+bounds.width<=size.width+2&&bounds.y+bounds.height<=size.height+2,'Trail drawer must fit viewport '+size.width);
   await page.screenshot({path:path.join(out,'04-trail-'+size.width+'x'+size.height+'.png')});
  }
  await page.locator('#trail-node-context [data-action="trail-to-learn"]').click();
  await waitNativeTask('equivalent');
  s=await expect('learn',fractionNode,'trail-to-learn-same-node');
  check(s.journeyOpen,'Trail -> Learn opens same node, no unrelated task');
  check(errors.length===0,'page errors: '+errors.join('; '));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks:records,errors,macVerified:false,childVerified:false},null,2));
  console.log('P8_SURFACE_SELECTION_COMPLETE '+JSON.stringify({checks:records.length,errors}));
 }catch(e){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks:records,errors:[...errors,String(e)]},null,2));
  console.error('P8_SURFACE_SELECTION_FAILURE '+(e.stack||e));
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
