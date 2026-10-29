async original=>{
 const base='http://127.0.0.1:43827/',root='/Users/zj1-6/dev/math/verification/phase5/B27/';
 const ctx=await original.context().browser().newContext({viewport:{width:1366,height:900},reducedMotion:'reduce',timezoneId:'Asia/Shanghai'}),page=await ctx.newPage(),checks=[],errors=[],remote=[];
 const check=(v,s)=>{if(!v)throw Error(s);checks.push(s);},snap=()=>page.evaluate(()=>mathLesson.snapshot()),state=()=>page.evaluate(async()=>JSON.parse((await import('./storage.js')).readStored('math-explorer-v2')));
 page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 try{
  await page.goto(base+'learn.html#foldprism');await page.waitForFunction(()=>window.mathLesson);await page.locator('[data-do="start"]').click();
  await page.locator('[data-x="guess"][data-value="false"]').click();
  await page.locator('[data-xfield="pair.0"]').selectOption('0');await page.locator('[data-xfield="pair.1"]').selectOption('1');
  await page.locator('[data-x="fold"]').click();await page.locator('[data-xfield="reason"]').selectOption('overlap');await page.locator('[data-do="check"]').click();await page.locator('[data-do="next"]').click();
  check((await snap()).index===1,'open the actual triangular-prism task');
  for(let i=0;i<4;i++)await page.locator('[data-x="g27-piece"][data-index="'+i+'"]').click();
  await page.locator('[data-x="g27-predict"][data-index="yes"]').click();
  const canvas=page.locator('#extra-world canvas'),flat=await canvas.screenshot();
  let slider=page.locator('[data-xfield="foldPosition"]');await slider.fill('50');await slider.dispatchEvent('change');
  check((await state()).lessons.foldprism.models[1].board.fold===50,'fold stops halfway');const halfway=await canvas.screenshot();check(!flat.equals(halfway),'half-fold changes the actual canvas');
  await page.screenshot({path:root+'prism-halfway.png',fullPage:true});
  const before=(await snap()).extra.camera,box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.56,box.y+box.height*.58,{steps:8});await page.mouse.up();
  const camera=(await snap()).extra.camera;check(camera.some((n,i)=>Math.abs(n-before[i])>.01),'direct drag rotates the 3D net');
  await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='foldprism');
  check((await state()).lessons.foldprism.models[1].board.fold===50,'unfinished fold survives reload');
  const resumed=(await snap()).extra.camera;check(camera.every((n,i)=>Math.abs(n-resumed[i])<1e-6),'actual viewpoint survives reload');
  slider=page.locator('[data-xfield="foldPosition"]');await slider.fill('100');await slider.dispatchEvent('change');
  const folded=await page.locator('#extra-world canvas').screenshot();check(!halfway.equals(folded),'fully folded canvas differs from halfway');
  await page.locator('[data-do="check"]').click();check((await snap()).summary.cases[1].complete,'folded net completes through controls');
  await page.screenshot({path:root+'prism-folded.png',fullPage:true});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'desktop layout fits');
  await page.goto('file:///Users/zj1-6/dev/math/vendor/os-taxonomy/.agents/skills/marble-builder/examples/hidden-cubes/experience.html');
  await page.getByRole('button',{name:'Let’s find out'}).click();await page.getByRole('button',{name:'Place cube'}).click();
  check((await page.locator('body').innerText()).includes('Fill this layer'),'upstream example opens and places a cube');
  await page.screenshot({path:root+'hidden-cubes-example.png'});
  check(!errors.length,'no runtime errors');check(!remote.length,'no remote requests');return{checks,errors,remote};
 }catch(e){await page.screenshot({path:root+'visual-failure.png',fullPage:true}).catch(()=>{});return{checks,errors,remote,failed:String(e),body:(await page.locator('body').innerText()).slice(-2200)};}finally{await ctx.close();}
}
