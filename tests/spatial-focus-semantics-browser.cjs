// Visual semantics acceptance for the v53 relationship map.
// Sample real DOM/WebGL screen sizes after camera zoom, not just CSS or syntax.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/spatial-focus-semantics'),base='http://127.0.0.1:43827/';
const ROOT='node:mt_WcfaSfVT33',NEXT='node:mt_dmNvjroCPT',checks=[],errors=[];
const check=(value,name)=>{if(!value)throw Error(name);checks.push(name);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
  await page.goto(base+'?v=56&world=network&layout=53#atlas');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const full=await snap(),positions=JSON.stringify(full.positions);
  await page.locator('[data-action="search"]').click();
  await page.locator('#search-input').fill('mt_WcfaSfVT33');
  await page.locator('#search-results [data-key="'+ROOT+'"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_WcfaSfVT33'&&mathSpace.snapshot().visibleNodes.length<30);
  await page.waitForTimeout(120);
  const focus=await snap(),render=await page.evaluate(([a,b])=>{
   const root=document.querySelector('.space-label.node.selected'),relation=document.querySelector('.spatial-focus-links');
   const paths=[...relation.querySelectorAll('path')];
   return {rootPx:mathSpace.nodeRadius(a),neighborPx:mathSpace.nodeRadius(b),lineWidths:paths.map(p=>Number(p.getAttribute('stroke-width'))),
     lines:paths.filter(p=>p.getAttribute('d')?.startsWith('M')).length,cssStroke:getComputedStyle(root).borderTopWidth,
     markerLegend:getComputedStyle(document.querySelector('.network-marker-key')).display,
     layerVisible:!relation.hidden,selectedLabel:root?.textContent?.trim()};
  },[ROOT,NEXT]);
  check(render.layerVisible&&render.lines>0,'real focused relations draw screen-space paths');
  check(render.lineWidths.every(w=>w>=1.3&&w<=2.8),'focused paths and arrows remain thin in screen pixels');
  check(render.rootPx>=5.5&&render.rootPx<=7.5,'selected knowledge has a clear 12-14px round node');
  check(render.neighborPx>=3.8&&render.neighborPx<=5.6,'related knowledge nodes remain 8-10px circles');
  check(render.markerLegend==='none','ambiguous saved-scene square and question diamond are not map-node categories');
  check(render.selectedLabel.includes('一一对应地数'),'selected title remains visible');
  check(await page.locator('.space-label.node.selected .activity-glyph').evaluate(el=>getComputedStyle(el).display==='none'),'learning-form glyph is not mistaken for a different type of knowledge node');
  await page.screenshot({path:path.join(out,'01-refined-focus.png')});
  // A knowledge panel must have no zoom feature; wheel zoom is also locked.
  check(await page.locator('.tool-rail [data-action="zoom"]').first().isHidden(),'knowledge detail has no visible zoom action');
  const fixedZoom=(await snap()).cameraZoom;
  await page.mouse.move(710,470);
  await page.mouse.wheel(0,-360);
  await page.waitForTimeout(160);
  check(Math.abs((await snap()).cameraZoom-fixedZoom)<.0001,'knowledge wheel zoom is disabled');
  const scaled=await page.evaluate(([a,b])=>({root:mathSpace.nodeRadius(a),neighbor:mathSpace.nodeRadius(b),widths:[...document.querySelectorAll('.spatial-focus-links path')].map(p=>Number(p.getAttribute('stroke-width')))}),[ROOT,NEXT]);
  check(scaled.widths.every(w=>w<=2.8)&&scaled.widths.length===render.lineWidths.length,'thin relationship strokes stay consistent without zoom');
  check(Math.abs(scaled.root-render.rootPx)<1.2&&Math.abs(scaled.neighbor-render.neighborPx)<1.2,'node size stays approximately fixed in screen pixels after zoom');
  check(JSON.stringify((await snap()).positions)===positions,'visual size is independent of the real math coordinates');
  await page.screenshot({path:path.join(out,'02-refined-zoom.png')});
  // Guided layout: only controls useful for current study are surfaced.
  await page.locator('[data-action="guide-start"]').click();
  await page.waitForFunction(()=>document.body.classList.contains('guide-mode')&&!document.querySelector('#guide-panel').hidden);
  const guide=await page.evaluate(()=>({rail:getComputedStyle(document.querySelector('.tool-rail')).display,footer:getComputedStyle(document.querySelector('.bottom-bar')).display,panelVisible:!document.querySelector('#guide-panel').hidden,paths:document.querySelectorAll('.spatial-focus-links path').length}));
  check(guide.panelVisible&&guide.rail==='none'&&guide.footer==='none','guided observation hides unrelated map controls and footer');
  check(guide.paths>0,'guided observation retains true knowledge relationships');
  await page.screenshot({path:path.join(out,'03-guided-focus.png')});
  await page.locator('#guide-panel [data-action="guide-exit"]').click();
  await page.waitForFunction(()=>!document.body.classList.contains('guide-mode'));
  check((await snap()).selected!==null,'leaving guide preserves exploration context');
  check(errors.length===0,'no browser page errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,measurements:{focus:render,zoom:scaled,guide},childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,rootPixelRadius:render.rootPx,neighborPixelRadius:render.neighborPx,strokeWidths:[...new Set(render.lineWidths)]}));
 }catch(error){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(error)},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
