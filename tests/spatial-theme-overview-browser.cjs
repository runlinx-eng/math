// Five source-backed theme overviews are navigable views of the same v53 atlas.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/spatial-theme-overview');
const url='http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas';
const ids=['numbers','space','measure','patterns','data'],checks=[],errors=[];
const check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(url);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const atlas=await page.evaluate(async()=>await(await fetch('./data/atlas.json')).json());
  const original=JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions);
  const camera=()=>page.evaluate(()=>{const s=mathSpace.snapshot(),m=mathSpace.motion();return {position:s.position,target:s.target,zoom:s.cameraZoom,tween:m.tween,transition:m.transition};});
  const sameCamera=(a,b)=>JSON.stringify({position:a.position,target:a.target,zoom:a.zoom})===JSON.stringify({position:b.position,target:b.target,zoom:b.zoom});
  await page.waitForFunction(()=>mathSpace.motion().tween===null);
  // Manual zoom changes the camera; subsequent theme selection must not.
  await page.locator('.tool-rail [data-action="zoom"][data-factor="0.75"]').click();
  const afterManualZoom=await camera();
  check(afterManualZoom.zoom>0&&afterManualZoom.tween===null,'manual zoom stays available before theme selection');
  for(const id of ids){
   const theme=atlas.themes.find(t=>t.id===id);
   const groups=atlas.packs.filter(p=>p.themeId===id);
   const all=atlas.nodes.filter(n=>n.themeId===id);
   const mapped=all.filter(n=>n.domainId!=='thinking');
   const before=await camera();
   await page.locator('#network-legend [data-action="network-theme"][data-id="'+id+'"]').click();
   await page.waitForFunction(id=>mathSpace.snapshot().selected==='theme:'+id,id);
   await page.waitForTimeout(150);
   const after=await camera();
   check(sameCamera(before,after),theme.title+' leaves camera position, target and zoom unchanged');
   check(after.tween===null&&after.transition===null,theme.title+' never schedules a camera tween or view transition');
   const s=await page.evaluate(()=>mathSpace.snapshot());
   const card=page.locator('#focus-card[data-kind="theme"]'),overview=card.locator('.theme-overview');
   check(s.selected==='theme:'+id&&s.visibleNodes.length===537,theme.title+' selects the whole source theme without hiding atlas nodes');
   check(JSON.stringify(s.positions)===original,theme.title+' does not change any v53 node coordinate');
   check(await card.isVisible()&&(await card.locator('h2').textContent()).includes(theme.title),theme.title+' gives an identifiable theme overview');
   const attrs=await overview.evaluate(el=>({id:el.dataset.themeId,packs:+el.dataset.packCount,nodes:+el.dataset.nodeCount,mapped:+el.dataset.mapCount}));
   check(attrs.id===id&&attrs.packs===groups.length&&attrs.nodes===all.length&&attrs.mapped===mapped.length,theme.title+' uses the real node and pack totals');
   const controls=await card.locator('.theme-pack-choice').evaluateAll(els=>els.map(el=>el.dataset.key));
   check(controls.length===groups.length&&groups.every(g=>controls.includes('pack:'+g.id)),theme.title+' offers every real knowledge group, without inventing a lesson order');
   check(await card.locator('.theme-pack-question').count()===groups.length,theme.title+' presents a source question for every group');
   check(await page.locator('#network-legend [data-action="network-theme"][data-id="'+id+'"]').getAttribute('aria-pressed')==='true',theme.title+' is marked as the active theme in the top legend');
   const shown=await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(el=>el.dataset.key.replace('pack:','')));
   check(shown.every(k=>groups.some(g=>g.id===k)),theme.title+' does not mix knowledge-group map labels from other themes');
   check(shown.length>=Math.min(2,groups.length),theme.title+' displays real group labels as primary map landmarks');
   const visibleNames=await page.locator('.space-label.node:visible').evaluateAll(els=>els.map(el=>el.dataset.key.replace('node:','')));
   const offThemeNames=visibleNames.filter(k=>!all.some(n=>n.id===k));
   check(offThemeNames.length===0,theme.title+' never leaks other themes\' knowledge names into its focused map');
   check(visibleNames.length<=12,theme.title+' keeps the topic view readable instead of showing hundreds of names');
   const bounds=await card.evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,h:r.height,scroll:el.scrollHeight,client:el.clientHeight,innerW:innerWidth,innerH:innerHeight};});
   check(bounds.left>=0&&bounds.right<=bounds.innerW&&bounds.top>=0&&bounds.bottom<=bounds.innerH,theme.title+' overview card remains inside the viewport');
   check(bounds.client>0&&bounds.scroll>=bounds.client,theme.title+' knowledge groups remain in a scrollable card');
   await page.screenshot({path:path.join(out,id+'-theme.png')});
  }
  // The rule also holds after the user explicitly changes the camera view.
  await page.locator('[data-action="network-view"][data-view="top"]').click();
  await page.waitForFunction(()=>mathSpace.motion().tween===null);
  const angled=await camera();
  await page.locator('#network-legend [data-action="network-theme"][data-id="data"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:data');
  await page.waitForTimeout(150);
  check(sameCamera(angled,await camera()),'theme selection preserves a manually chosen top view');
  await page.locator('#network-legend [data-action="network-theme"][data-id="numbers"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:numbers');
  const first=atlas.packs.find(p=>p.themeId==='numbers');
  await page.locator('#focus-card .theme-pack-choice[data-key="pack:'+first.id+'"]').click();
  await page.waitForFunction(k=>mathSpace.snapshot().selected===k,'pack:'+first.id);
  check((await page.locator('#focus-card h2').textContent()).length>0,'a real theme group opens its existing knowledge/route overview');
  await page.locator('#back-button').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:numbers');
  check(await page.locator('#focus-card .theme-overview').isVisible(),'back returns to the theme with its group choices');
  await page.locator('[data-action="overview"]').first().click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected===null);
  check((await page.evaluate(()=>mathSpace.snapshot())).visibleNodes.length===537,'return to panorama keeps the full map intact');
  await page.setViewportSize({width:980,height:760});
  await page.locator('#network-legend [data-action="network-theme"][data-id="space"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:space');
  const compact=await page.locator('#focus-card').evaluate(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,w:innerWidth,h:innerHeight};});
  check(compact.left>=0&&compact.right<=compact.w&&compact.top>=0&&compact.bottom<=compact.h,'compact desktop theme card stays in view');
  check(errors.length===0,'no browser runtime errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,childTrial:false}));
 }catch(err){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(err),childTrial:false},null,2));
  console.error(err.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
