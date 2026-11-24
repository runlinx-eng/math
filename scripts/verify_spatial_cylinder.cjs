// Real Chromium preview; isolated profiles, never a personal learning profile.
// Run the normal local server first, then node scripts/verify_spatial_cylinder.cjs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('../tests/helpers/standard-desktop-viewport.cjs');
const base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
const dir=path.resolve(process.env.MATH_V54_EVIDENCE||'verification/spatial-cylinder-v54');
const release='math-explorer-20261124-cylinder-v54-preview8';
const atlas=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../dist/data/atlas.json'),'utf8'));
const url=version=>base+'/index.html?world=network&layout='+version+'#atlas';
const darkCard=async(page,selector)=>{
 const el=page.locator(selector).first();await el.waitFor({state:'visible'});
 const rgb=await el.evaluate(n=>getComputedStyle(n).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number));
 assert.ok(rgb.length===3&&rgb.every(v=>v<80),selector+' must have a dark readable surface: '+rgb);
};
const assertInspector=async(page,selector,id,lockedCount=null)=>{
 const card=page.locator(selector);await card.waitFor({state:'visible'});
 const thinking=new Set(atlas.nodes.filter(n=>n.domainId==='thinking').map(n=>n.id));
 const direct=atlas.edges.filter(e=>e.prerequisiteId===id||e.topicId===id);
 const unique=values=>[...new Set(values)];
 const expected={
   before:unique(direct.filter(e=>e.strength==='hard'&&e.topicId===id&&e.prerequisiteId!==id).map(e=>e.prerequisiteId)),
   after:unique(direct.filter(e=>e.strength==='hard'&&e.prerequisiteId===id&&e.topicId!==id).map(e=>e.topicId)),
   thinking:unique(direct.map(e=>e.topicId===id?e.prerequisiteId:e.topicId).filter(n=>n!==id&&thinking.has(n)!==thinking.has(id)))
 };
 for(const [kind,ids] of Object.entries(expected)){
   const row=card.locator('[data-relation-kind="'+kind+'"]');
   assert.equal(await row.getAttribute('data-relation-count'),String(ids.length));
   const shown=await row.locator('[data-relation-id]').evaluateAll(els=>els.map(el=>({id:el.dataset.relationId,name:el.textContent.trim()})));
   assert.deepEqual(shown.map(n=>n.id),ids.slice(0,3));assert.ok(shown.every(n=>n.name&&n.name!==n.id));
 }
 const upstream=card.locator('[data-upstream-count]');
 if(lockedCount===null)assert.equal(await upstream.count(),0);
 else {assert.equal(await upstream.getAttribute('data-upstream-count'),String(lockedCount));assert.ok(await upstream.isVisible());}
 const bounds=await card.boundingBox(),viewport=page.viewportSize();
 assert.ok(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width+1&&bounds.y+bounds.height<=viewport.height+1,'inspection must stay in viewport');
};
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
       await page.locator('.space-label.cylinder-milestone:visible').first().waitFor();
       const milestoneKeys=await page.locator('.space-label.cylinder-milestone:visible').evaluateAll(labels=>labels.map(el=>el.dataset.key.slice(5)));
       assert.ok(milestoneKeys.length<=10&&milestoneKeys.every(id=>metadata.milestones.includes(id)));
       await page.screenshot({path:path.join(dir,width+'x'+height+'-overview.png')});
       {
         const camera=s=>({position:s.position,target:s.target,cameraZoom:s.cameraZoom});
         const before=await page.evaluate(()=>window.mathSpace.snapshot());
         assert.equal(await page.locator('#continue-card').isVisible(),false);
         assert.equal(await page.locator('#cylinder-core-key small').textContent(),'50');
         await page.locator('.cylinder-extra-tools summary').click();
         await page.locator('#network-edge-controls [data-edge-display="all"]').waitFor({state:'visible'});
         const opt=key=>page.locator('[data-action="cylinder-option"][data-option="'+key+'"]');
         const presentation=()=>page.evaluate(()=>window.mathSpace.cylinder().presentation);
         const allOptions=await presentation();assert.equal(allOptions.spines,true);assert.ok(allOptions.rings>0&&allOptions.coreGuides>0);assert.equal(allOptions.crossBackgroundEdges,0);
         assert.equal(await opt('orbit').isDisabled(),true);
         for(const [key,field,off,on] of [['spines','spines',false,true],['thinking','coreGuides',0,allOptions.coreGuides],['rings','rings',0,allOptions.rings]]){
           await opt(key).click();
           await page.waitForFunction(({field,off})=>window.mathSpace.cylinder().presentation[field]===off,{field,off});
           assert.equal((await page.evaluate(()=>window.mathSpace.snapshot())).visibleNodes.length,587);
           await opt(key).click();await page.waitForFunction(({field,on})=>window.mathSpace.cylinder().presentation[field]===on,{field,on});
         }
         await opt('crossEdges').click();await page.waitForFunction(()=>window.mathSpace.cylinder().presentation.crossBackgroundEdges>0);
         await opt('crossEdges').click();await page.waitForFunction(()=>window.mathSpace.cylinder().presentation.crossBackgroundEdges===0);
         assert.deepEqual(camera(await page.evaluate(()=>window.mathSpace.snapshot())),camera(before));
         await page.locator('.cylinder-extra-tools summary').click();
         await page.mouse.move(width-8,height-8);
         const key=await page.locator('.space-label.cylinder-milestone:visible').first().getAttribute('data-key');
         const label=page.locator('.space-label[data-key="'+key+'"]');
         await label.hover();
         await page.waitForFunction(key=>window.mathSpace.hoverPreview().key===key,key);
         await page.locator('#cylinder-hover-inspector').waitFor({state:'visible'});
         const preview=await page.evaluate(()=>window.mathSpace.hoverPreview());
         const source=atlas.edges.filter(e=>e.prerequisiteId===key.slice(5)||e.topicId===key.slice(5));
         const edgeKeys=es=>es.map(e=>e.from+'>'+e.to+':'+e.soft).sort();
         assert.deepEqual(edgeKeys(preview.edges),edgeKeys(source.map(e=>({from:'node:'+e.prerequisiteId,to:'node:'+e.topicId,soft:e.strength==='soft'}))));
         await assertInspector(page,'#cylinder-hover-inspector',key.slice(5));
          await page.screenshot({path:path.join(dir,'1920x1080-hover.png')});
         await label.click();await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key&&window.mathSpace.snapshot().cylinderLocked,key);
         assert.equal(await page.locator('#cylinder-node-details').evaluate(el=>el.open),false);
         assert.deepEqual(camera(await page.evaluate(()=>window.mathSpace.snapshot())),camera(before));
         await label.click();await page.waitForFunction(()=>!window.mathSpace.snapshot().selected);
         await label.click();await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key,key);
         const blank=await page.evaluate(()=>{
           const canvas=document.querySelector('#space-canvas canvas'),r=canvas.getBoundingClientRect(),nodes=window.mathSpace.snapshot().visibleNodes.map(key=>window.mathSpace.project(key)).filter(p=>p?.visible);
           for(let y=140;y<r.height-100;y+=65)for(let x=300;x<r.width-100;x+=65)if(document.elementFromPoint(x+r.left,y+r.top)===canvas&&nodes.every(p=>Math.hypot(p.x-x,p.y-y)>30))return [x+r.left,y+r.top];
           return null;
         });
         assert.ok(blank,'find a genuinely blank canvas location');await page.mouse.click(...blank);
         await page.waitForFunction(()=>!window.mathSpace.snapshot().selected);
         assert.deepEqual(camera(await page.evaluate(()=>window.mathSpace.snapshot())),camera(before));
         row.observationSwitches=true;row.pointerLock=true;
         assert.deepEqual(await page.locator('#network-legend .cylinder-theme-count').allTextContents(),await page.locator('#network-legend [data-id]').evaluateAll((buttons,counts)=>buttons.map(b=>String(counts[b.dataset.id])),metadata.domainCounts));
         await page.locator('#network-legend [data-id="numbers"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().cylinderThemeFilter==='numbers');
         const theme=await page.evaluate(()=>window.mathSpace.snapshot());assert.deepEqual(theme.positions,before.positions);assert.deepEqual(camera(theme),camera(before));assert.equal(theme.visibleNodes.length,587);assert.equal(theme.selected,null);
         await page.mouse.move(width-8,height-8);
         assert.equal(await page.locator('#focus-card').isVisible(),false);
         await page.screenshot({path:path.join(dir,'1920x1080-theme-numbers.png')});
         await page.locator('#grade-map-filter [data-action="grade-map-stage"][data-stage="stage-1"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().gradeStageFilter==='stage-1');
         const combined=await page.evaluate(()=>window.mathSpace.snapshot());assert.equal(combined.cylinderThemeFilter,'numbers');assert.equal(combined.selected,null);assert.deepEqual(combined.positions,before.positions);assert.deepEqual(camera(combined),camera(before));
         await page.screenshot({path:path.join(dir,'1920x1080-theme-stage.png')});
         // Explicit secondary directory action preserves the real theme hierarchy.
         await page.locator('.cylinder-extra-tools summary').click();
         await page.locator('#cylinder-theme-directory').click();
         await darkCard(page,'#focus-card .focus-sticky');await darkCard(page,'#focus-card .theme-pack-choice');
         assert.match(await page.locator('#focus-card .theme-thinking-count').innerText(),/在中央思维轴核/);
         await page.locator('#network-legend [data-id="numbers"]').click();await page.waitForFunction(()=>!window.mathSpace.snapshot().selected&&!window.mathSpace.snapshot().cylinderThemeFilter);
         await page.locator('.cylinder-extra-tools summary').click();
         await page.mouse.move(width-8,height-8);
         await page.waitForFunction(()=>window.mathSpace.snapshot().gradeStageFilter==='stage-1');
         const filtered=await page.evaluate(()=>window.mathSpace.snapshot());
         assert.equal(filtered.visibleNodes.length,587);assert.deepEqual(filtered.positions,before.positions);assert.deepEqual(camera(filtered),camera(before));
         await page.screenshot({path:path.join(dir,'1920x1080-stage1.png')});
         await page.locator('#grade-map-filter [data-action="grade-map-stage"][data-stage="all"]').click();
         await page.locator('[data-action="network-view"][data-view="top"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().networkView==='map'&&!window.mathSpace.motion().tween);
         assert.deepEqual((await page.evaluate(()=>window.mathSpace.snapshot())).positions,before.positions);
         await page.screenshot({path:path.join(dir,'1920x1080-top.png')});
         await page.locator('[data-action="network-view"][data-view="oblique"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().networkView==='oblique'&&!window.mathSpace.motion().tween);
         // Pick a real node with more than one hard prerequisite hop and
         // compare the actual rendered lock against independent source traversal.
         const lockFor=id=>{const ancestors=new Set([id]),queue=[id];for(let i=0;i<queue.length;i++)for(const e of atlas.edges)if(e.strength==='hard'&&e.topicId===queue[i]&&!ancestors.has(e.prerequisiteId)){ancestors.add(e.prerequisiteId);queue.push(e.prerequisiteId);}return {ancestors,edges:atlas.edges.filter(e=>e.prerequisiteId===id||e.topicId===id||e.strength==='hard'&&ancestors.has(e.prerequisiteId)&&ancestors.has(e.topicId))};};
         const id=metadata.milestones.find(id=>lockFor(id).ancestors.size>3)||metadata.spines[0].rootId;
         await page.goto(base+'/index.html?world=network&layout=54#space/node/'+id);
         await ready(page,54,587);
         await page.waitForFunction(id=>window.mathSpace.snapshot().selected==='node:'+id&&window.mathSpace.snapshot().cylinderLocked,id);
         const locked=await page.evaluate(()=>window.mathSpace.snapshot());
         assert.deepEqual(locked.positions,before.positions);
         const keys=es=>es.map(e=>e.from+'>'+e.to+':'+e.strength).sort();
         assert.deepEqual(keys(locked.focusFilterEdges),keys(lockFor(id).edges.map(e=>({from:e.prerequisiteId,to:e.topicId,strength:e.strength}))));
         const lockedCamera=camera(locked);
         await page.locator('#focus-card [data-action="deselect"]').click();
         await page.waitForFunction(()=>!window.mathSpace.snapshot().selected);
         assert.deepEqual(camera(await page.evaluate(()=>window.mathSpace.snapshot())),lockedCamera);
         // Re-enter and preserve existing detailed card checks.
         await page.goto(base+'/index.html?world=network&layout=54#space/node/'+id);
         await page.waitForFunction(id=>window.mathSpace?.snapshot().selected==='node:'+id&&window.mathSpace.snapshot().cylinderLocked,id);
         await darkCard(page,'#focus-card .focus-sticky');
         assert.equal(await page.locator('#cylinder-node-details').evaluate(el=>el.open),false);
         assert.equal(await page.locator('#focus-card .primary-button:visible').count(),1);
         await assertInspector(page,'#focus-card',id,lockFor(id).ancestors.size-1);
          row.inspectorNamesAndUpstream=true;
          await page.screenshot({path:path.join(dir,'1920x1080-focus.png')});
         await page.locator('#cylinder-node-details summary').first().click();
         await darkCard(page,'#focus-card .grade-node-position');await darkCard(page,'#focus-card .focus-filter');
         await page.screenshot({path:path.join(dir,'1920x1080-focus-details.png')});
         assert.equal(await page.locator('.cylinder-link-flow').count(),0);
         await page.emulateMedia({reducedMotion:'no-preference'});
         if(lockFor(id).edges.some(e=>e.strength==='hard'))await page.locator('.cylinder-link-flow').first().waitFor({state:'attached'});
         await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('.cylinder-link-flow'));
         row.compactInspector=true;row.directionFlow=true;
         await page.goto(url(54));await ready(page,54,587);
         await page.locator('.tool-rail [data-action="front"]').click();
         await page.waitForFunction(()=>!window.mathSpace.snapshot().selected&&!window.mathSpace.motion().tween);
         const resetCamera=camera(await page.evaluate(()=>window.mathSpace.snapshot()));
         await page.locator('[data-action="cylinder-origin"]').click();await page.locator('#cylinder-entry-nav').waitFor({state:'visible'});
         await page.waitForFunction(()=>!window.mathSpace.motion().tween);
         const rootKeys=metadata.spines.filter(s=>s.index===0).map(s=>'node:'+s.rootId).sort();
         assert.deepEqual((await page.locator('#cylinder-entry-nav [data-action="cylinder-entry"]').evaluateAll(els=>els.map(el=>el.dataset.key))).sort(),rootKeys);
         const entrance=await page.evaluate(()=>window.mathSpace.snapshot());assert.deepEqual(entrance.positions,before.positions);assert.notDeepEqual(camera(entrance),resetCamera);
         await page.screenshot({path:path.join(dir,'1920x1080-entry.png')});
         const root=await page.locator('#cylinder-entry-nav [data-action="cylinder-entry"]').first().getAttribute('data-key');
         await page.locator('#cylinder-entry-nav [data-action="cylinder-entry"]').first().click();
         await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key&&window.mathSpace.snapshot().cylinderLocked,root);
         assert.deepEqual(camera(await page.evaluate(()=>window.mathSpace.snapshot())),camera(entrance));
         await page.locator('.tool-rail [data-action="front"]').click();await page.waitForFunction(()=>!window.mathSpace.snapshot().selected&&!window.mathSpace.motion().tween);
         assert.deepEqual(camera(await page.evaluate(()=>window.mathSpace.snapshot())),resetCamera);
         row.entryNavigation=true;
         await page.emulateMedia({reducedMotion:'no-preference'});
         await page.locator('.cylinder-extra-tools summary').click();
         await page.waitForFunction(()=>!document.querySelector('[data-option="orbit"]').disabled);
         const idle=await page.evaluate(()=>window.mathSpace.snapshot().position);
         await opt('orbit').click();await page.mouse.move(width-8,height-8);
         await page.waitForFunction(p=>window.mathSpace.cylinder().presentation.orbit&&window.mathSpace.snapshot().position.some((x,i)=>Math.abs(x-p[i])>.01),idle);
         await opt('orbit').click();await page.waitForFunction(()=>!window.mathSpace.cylinder().presentation.orbit);
         await page.locator('.cylinder-extra-tools summary').click();
         await page.emulateMedia({reducedMotion:'reduce'});
         await page.locator('.tool-rail [data-action="front"]').click();
         row.orbit=true;
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
