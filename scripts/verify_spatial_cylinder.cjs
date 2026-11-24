// Real Chromium preview; isolated profiles, never a personal learning profile.
// Run the normal local server first, then node scripts/verify_spatial_cylinder.cjs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('../tests/helpers/standard-desktop-viewport.cjs');
const base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
const dir=path.resolve(process.env.MATH_V54_EVIDENCE||'verification/spatial-cylinder-v54');
const release='math-explorer-20261124-cylinder-v54-preview2';
const url=version=>base+'/index.html?world=network&layout='+version+'#atlas';
const ready=async(page,version,count)=>{
 await page.waitForFunction(({version,count})=>{const loading=document.querySelector('#loading');if(loading&&!loading.hidden&&loading.querySelector('h1'))throw Error('Map startup failed: '+loading.innerText);const s=window.mathSpace?.snapshot();return s?.networkVersion===version&&s?.visibleNodes.length===count&&document.querySelector('#space-app')?.classList.contains('ready');},{version,count},{timeout:45000});
 return page.evaluate(()=>window.mathSpace.snapshot());
};
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const results=[];
 const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--disable-crash-reporter']});
 try{
   // Same viewport for reference and product, following #239. Smaller sizes
   // are manual responsive previews, not new automated browser test contexts.
   if(process.env.MATH_V54_REFERENCE_HTML){
     const reference=path.resolve(process.env.MATH_V54_REFERENCE_HTML);
     const ctx=await newDesktopContext(browser,{reducedMotion:'reduce'});
     try{const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
       await page.goto(pathToFileURL(reference).href);await page.locator('canvas').first().waitFor();
       await page.waitForFunction(()=>document.querySelector('canvas').width>0);
       await page.waitForTimeout(700);assert.deepEqual(errors,[]);
       fs.copyFileSync(reference,path.join(dir,'reference.html'));
       await page.screenshot({path:path.join(dir,'reference-overview.png')});
     }finally{await ctx.close();}
   }
   for(const {width,height} of [STANDARD_DESKTOP_VIEWPORT]){
     const ctx=await newDesktopContext(browser,{reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));const row={width,height,errors};results.push(row);
     try{
       await page.goto(url(54));let first=await ready(page,54,587);
       const metadata=await page.evaluate(()=>window.mathSpace.cylinder());assert.equal(metadata.thinking.length,50);assert.equal(metadata.bridgeCount,5);assert.equal(metadata.sectors.length,5);assert.equal(metadata.thinkingCount,50);assert.deepEqual(metadata.domainCounts,{numbers:274,measure:88,data:65,space:76,patterns:34});
       assert.equal(first.counts.edges,1223);assert.equal(first.counts.nodes,587);
       await page.screenshot({path:path.join(dir,width+'x'+height+'-overview.png')});
       {
         const camera=s=>({position:s.position,target:s.target,cameraZoom:s.cameraZoom});
         const before=await page.evaluate(()=>window.mathSpace.snapshot());
         assert.equal(await page.locator('#continue-card').isVisible(),false);
         assert.deepEqual(await page.locator('#network-legend .cylinder-theme-count').allTextContents(),await page.locator('#network-legend [data-id]').evaluateAll((buttons,counts)=>buttons.map(b=>String(counts[b.dataset.id])),metadata.domainCounts));
         await page.locator('#network-legend [data-id="numbers"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().selected==='theme:numbers');
         const theme=await page.evaluate(()=>window.mathSpace.snapshot());assert.deepEqual(theme.positions,before.positions);assert.deepEqual(camera(theme),camera(before));assert.equal(theme.visibleNodes.length,587);
         await page.locator('#network-legend [data-id="numbers"]').click();await page.waitForFunction(()=>!window.mathSpace.snapshot().selected);
         await page.mouse.move(width-8,height-8);
         await page.locator('[data-action="grade-map-stage"][data-stage="stage-1"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().gradeStageFilter==='stage-1');
         const filtered=await page.evaluate(()=>window.mathSpace.snapshot());
         assert.equal(filtered.visibleNodes.length,587);assert.deepEqual(filtered.positions,before.positions);assert.deepEqual(camera(filtered),camera(before));
         await page.screenshot({path:path.join(dir,'1920x1080-stage1.png')});
         await page.locator('[data-action="grade-map-stage"][data-stage="all"]').click();
         await page.locator('[data-action="network-view"][data-view="top"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().networkView==='map'&&!window.mathSpace.motion().tween);
         assert.deepEqual((await page.evaluate(()=>window.mathSpace.snapshot())).positions,before.positions);
         await page.screenshot({path:path.join(dir,'1920x1080-top.png')});
         await page.locator('[data-action="network-view"][data-view="oblique"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().networkView==='oblique'&&!window.mathSpace.motion().tween);
         const id=metadata.spines[0].rootId;
         await page.goto(base+'/index.html?world=network&layout=54#space/node/'+id);
         await ready(page,54,587);
         await page.waitForFunction(id=>window.mathSpace.snapshot().selected==='node:'+id,id);
         assert.deepEqual((await page.evaluate(()=>window.mathSpace.snapshot())).positions,before.positions);
         await page.screenshot({path:path.join(dir,'1920x1080-focus.png')});
         await page.goto(url(54));await ready(page,54,587);
         await page.waitForFunction(async release=>{const c=navigator.serviceWorker.controller;if(!c||c.state!=='activated')return false;const cache=await caches.open(release);return !!(await cache.match(new URL('./spatial-cylinder-visuals.js',location.href)));},release,{timeout:90000});
         await ctx.setOffline(true);await page.reload();await ready(page,54,587);
         await ctx.setOffline(false);row.offline=true;
         await page.locator('[data-action="menu"]').click();
         await page.locator('[data-action="map-version"]').click();await ready(page,53,537);
         await page.screenshot({path:path.join(dir,'1920x1080-v53.png')});
         await page.locator('[data-action="menu"]').click();
         await page.locator('[data-action="map-version"]').click();await ready(page,54,587);
         row.switch=true;row.ghosting=true;
       }
       assert.deepEqual(errors,[]);row.passed=true;
     }catch(e){row.failure=e.stack;await page.screenshot({path:path.join(dir,width+'x'+height+'-failure.png')}).catch(()=>{});throw e;}
     finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2));await ctx.close();}
   }
 }finally{await browser.close();}
 console.log(JSON.stringify(results));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
