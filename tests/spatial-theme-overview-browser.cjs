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
  // Exercise the floating world-space theme labels, not just the top legend.
  // The map title must remain a stable pointer target during preview.
  const floating=page.locator('.space-label.theme:visible').first();
  await floating.waitFor({state:'visible'});
  const floatingId=(await floating.getAttribute('data-key')).slice('theme:'.length);
  const worldBefore=await camera(),urlBefore=page.url();
  await floating.hover();
  await page.waitForFunction(id=>mathSpace.snapshot().themePreviewId===id,floatingId);
  await page.waitForTimeout(160);
  check(await floating.isVisible()&&await floating.evaluate(el=>el.classList.contains('theme-previewing')),'floating map theme label remains visible and active throughout hover');
  check((await page.evaluate(()=>mathSpace.snapshot())).selected===null,'floating map theme hover never commits a selection');
  check(await page.locator('#focus-card').isHidden(),'floating theme hover does not open the detail panel');
  check(sameCamera(worldBefore,await camera())&&page.url()===urlBefore,'floating theme hover keeps camera and route unchanged');
  const labeled=await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key));
  check(labeled.every(k=>atlas.packs.some(p=>p.themeId===floatingId&&'pack:'+p.id===k)),'floating map preview only displays the hovered theme\'s real groups');
  await page.screenshot({path:path.join(out,'floating-theme-hover.png')});
  // Regression for the screenshot: "规律与推理" theme and its four
  // knowledge-group labels must not overlap or show a duplicate native tooltip.
  const noOverlaps=async()=>page.evaluate(()=>{
    const boxes=[...document.querySelectorAll('.space-label.theme:not([hidden]),.space-label.pack:not([hidden])')]
      .filter(e=>getComputedStyle(e).visibility!=='hidden').map(e=>({name:e.textContent.trim(),type:e.classList.contains('theme')?'theme':'pack',r:e.getBoundingClientRect()}));
    const collisions=[];
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i],b=boxes[j],x=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),y=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
      if(x>1&&y>1)collisions.push({a:a.name,b:b.name,x,y});
    }
    return {count:boxes.length,collisions};
  });
  const beforeThemeCollision=await noOverlaps();
  check(beforeThemeCollision.collisions.length===0,'floating theme preview never overlaps actual visible theme and pack rectangles: '+JSON.stringify(beforeThemeCollision.collisions));
  check(await floating.evaluate(el=>!el.hasAttribute('title')),'floating theme title does not create a duplicate native browser tooltip');
  await page.mouse.move(800,400);
  await page.waitForFunction(()=>mathSpace.snapshot().themePreviewId===null);
  await page.locator('#network-legend [data-action="network-theme"][data-id="patterns"]').hover();
  await page.waitForFunction(()=>mathSpace.snapshot().themePreviewId==='patterns');
  await page.waitForTimeout(170);
  const patternsOverlap=await noOverlaps();
  check(patternsOverlap.collisions.length===0,'patterns theme and its knowledge groups have non-overlapping rendered boxes');
  await page.screenshot({path:path.join(out,'patterns-hover-no-overlap.png')});
  await page.mouse.move(800,400);
  await page.waitForFunction(()=>mathSpace.snapshot().themePreviewId===null);
  await page.mouse.move(800,400);
  await page.waitForFunction(()=>mathSpace.snapshot().themePreviewId===null);
  check((await page.evaluate(()=>mathSpace.snapshot())).selected===null,'floating theme pointerleave restores the unselected map');
  // Manual zoom changes the camera; subsequent theme selection must not.
  await page.locator('.tool-rail [data-action="zoom"][data-factor="0.75"]').click();
  const afterManualZoom=await camera();
  check(afterManualZoom.zoom>0&&afterManualZoom.tween===null,'manual zoom stays available before theme selection');
  // Manual zoom saves asynchronously; settle its own save before attributing
  // any storage change to the subsequent hover-only interaction.
  await page.waitForTimeout(450);
  const initialUrl=page.url(),initialStorage=await page.evaluate(()=>JSON.stringify({...localStorage}));
  const firstLabel=page.locator('#network-legend [data-action="network-theme"][data-id="data"]');
  const initialCamera=await camera();
  await firstLabel.hover();
  await page.waitForFunction(()=>mathSpace.snapshot().themePreviewId==='data');
  check((await page.evaluate(()=>mathSpace.snapshot())).selected===null,'hover only previews a theme without selecting it');
  check(await page.locator('#focus-card').isHidden(),'hover does not open the detail panel');
  check(sameCamera(initialCamera,await camera()),'hover never moves the camera or changes zoom');
  check((await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key))).every(k=>atlas.packs.some(p=>p.themeId==='data'&&'pack:'+p.id===k)),'hover labels belong only to the preview theme');
  check((await page.evaluate(()=>mathSpace.snapshot())).visibleNodes.length===537,'hover retains all 537 domain nodes');
  await page.mouse.move(800,400);
  await page.waitForFunction(()=>mathSpace.snapshot().themePreviewId===null);
  check((await page.evaluate(()=>mathSpace.snapshot())).selected===null&&await page.locator('#focus-card').isHidden(),'leaving header restores the unselected panorama without opening a panel');
  check(page.url()===initialUrl&&await page.evaluate(()=>JSON.stringify({...localStorage}))===initialStorage,'hover never changes navigation, learning or saved view');
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
   // Visible map labels depend on the user's unchanged camera. All packs
   // remain accessible in the theme card even when their anchors are offscreen.
   check(shown.length<=groups.length,theme.title+' never invents extra knowledge-group labels');
   const visibleNames=await page.locator('.space-label.node:visible').evaluateAll(els=>els.map(el=>el.dataset.key.replace('node:','')));
   const offThemeNames=visibleNames.filter(k=>!all.some(n=>n.id===k));
   check(offThemeNames.length===0,theme.title+' never leaks other themes\' knowledge names into its focused map');
   check(visibleNames.length<=12,theme.title+' keeps the topic view readable instead of showing hundreds of names');
   const bounds=await card.evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,h:r.height,scroll:el.scrollHeight,client:el.clientHeight,innerW:innerWidth,innerH:innerHeight};});
   check(bounds.left>=0&&bounds.right<=bounds.innerW&&bounds.top>=0&&bounds.bottom<=bounds.innerH,theme.title+' overview card remains inside the viewport');
   check(bounds.client>0&&bounds.scroll>=bounds.client,theme.title+' knowledge groups remain in a scrollable card');
   await page.screenshot({path:path.join(out,id+'-theme.png')});
  }
  // Hovering a different theme temporarily overrides a locked theme, then restores it.
  await page.locator('#network-legend [data-action="network-theme"][data-id="data"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:data');
  const lockedBefore=await camera();
  await page.locator('#network-legend [data-action="network-theme"][data-id="space"]').hover();
  await page.waitForFunction(()=>mathSpace.snapshot().themePreviewId==='space');
  check((await page.evaluate(()=>mathSpace.snapshot())).selected==='theme:data','hovering another theme keeps the locked selection');
  check(await page.locator('#focus-card h2').textContent()==='数据与可能性','hovering another theme keeps the locked detail panel');
  check((await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key))).every(k=>atlas.packs.some(p=>p.themeId==='space'&&'pack:'+p.id===k)),'temporary theme replaces map labels without changing locked details');
  await page.mouse.move(800,400);
  await page.waitForFunction(()=>mathSpace.snapshot().themePreviewId===null);
  check((await page.evaluate(()=>mathSpace.snapshot())).selected==='theme:data','leaving hover restores the locked theme');
  check(sameCamera(lockedBefore,await camera()),'preview and restoration keep the camera fixed');
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
