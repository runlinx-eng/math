// Real Chromium preview; isolated profiles, never a personal learning profile.
// Run the normal local server first, then node scripts/verify_spatial_cylinder.cjs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('../tests/helpers/standard-desktop-viewport.cjs');
const base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
const dir=path.resolve(process.env.MATH_V54_EVIDENCE||'verification/spatial-cylinder-v54');
const release='math-explorer-20261125-cylinder-workbench-ab-preview5';
const atlas=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../dist/data/atlas.json'),'utf8'));
const url=version=>base+'/index.html?world=network&layout='+version+'#atlas';
const darkCard=async(page,selector)=>{
 const el=page.locator(selector).first();await el.waitFor({state:'visible'});
 const rgb=await el.evaluate(n=>getComputedStyle(n).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number));
 assert.ok(rgb.length===3&&rgb.every(v=>v<80),selector+' must have a dark readable surface: '+rgb);
};
// Actual computed colors and geometry: local glyph/outline contrast, not an opaque card.
const assertLabelContrast=async(label)=>{
 const colors=await label.evaluate(el=>{
   const text=el.querySelector('span')||el,s=getComputedStyle(el),t=getComputedStyle(text);
   return {foreground:t.color,background:s.backgroundColor,stroke:t.webkitTextStrokeColor,strokeWidth:t.webkitTextStrokeWidth,border:s.borderTopWidth,shadow:s.boxShadow};
 });
 const parse=s=>{const a=s.match(/[\d.]+/g)?.map(Number)||[];assert.ok(a.length>=3&&(a.length===3||a[3]===1),'expected opaque text/stroke: '+s);return a.slice(0,3);};
 const lum=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 assert.equal(colors.background,'rgba(0, 0, 0, 0)');assert.equal(colors.border,'0px');assert.equal(colors.shadow,'none');
 assert.ok(parseFloat(colors.strokeWidth)>=2);
 const a=lum(parse(colors.foreground)),b=lum(parse(colors.stroke)),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 assert.ok(contrast>=4.5,'annotation glyph/outline contrast must be >= 4.5: '+JSON.stringify(colors));
 return contrast;
};
const assertPointFocus=async(page,key)=>{
 await page.waitForFunction(key=>{const p=window.mathSpace.cylinder().presentation;return p.primaryPoint===key&&p.focusHalo&&document.querySelector('.cylinder-point-primary[data-key="'+key+'"]:not([hidden])');},key);
 const check=await page.evaluate(key=>{
   const canvas=document.querySelector('#space-canvas').getBoundingClientRect(),p=window.mathSpace.project(key),label=document.querySelector('.cylinder-point-primary[data-key="'+key+'"]'),r=label.getBoundingClientRect(),x=p.x+canvas.left,y=p.y+canvas.top;
   return {primary:document.querySelectorAll('.cylinder-point-primary:not([hidden])').length,
     gap:Math.hypot(Math.max(r.left-x,x-r.right,0),Math.max(r.top-y,y-r.bottom,0)),
     halo:window.mathSpace.cylinder().presentation.focusHalo,position:window.mathSpace.snapshot().positions.find(o=>o.key===key).position,
     labels:[...document.querySelectorAll('.cylinder-point-label:not([hidden])')].map(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,border:s.borderTopWidth};})};
 },key);
 assert.equal(check.primary,1);assert.ok(check.gap>=5&&check.gap<=22,'annotation must stay beside the actual point: '+check.gap);
 assert.deepEqual(check.halo,check.position);assert.ok(check.labels.every(o=>o.background==='rgba(0, 0, 0, 0)'&&o.border==='0px'));
};
const assertOriginMarker=async(page)=>{
 await page.waitForFunction(()=>window.mathSpace.cylinder().presentation.originMarker.visible);
 const evidence=await page.evaluate(()=>{
   const marker=document.querySelector('#cylinder-origin-marker'),r=marker.querySelector('.cylinder-origin-compass').getBoundingClientRect(),host=document.querySelector('#space-canvas').getBoundingClientRect(),origin=window.mathSpace.cylinder().presentation.originMarker;
   return {x:r.x+r.width/2-host.x,y:r.y+r.height/2-host.y,projected:origin.projected,position:origin.position,key:marker.dataset.key||null,sourcePoint:window.mathSpace.snapshot().positions.some(o=>JSON.stringify(o.position)===JSON.stringify(origin.position))};
 });
 assert.equal(evidence.key,null);assert.equal(evidence.sourcePoint,false);
 assert.ok(Math.hypot(evidence.x-evidence.projected.x,evidence.y-evidence.projected.y)<=2,'navigation marker is projected from its own fixed world anchor');
 return evidence.position;
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
   // Same standard viewport for reference and product, following #239.
   // High-narrow visual checks are reserved for actual Mac acceptance under #239.
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
     assert.deepEqual(page.viewportSize(),STANDARD_DESKTOP_VIEWPORT);
     try{
       await page.goto(url(54));let first=await ready(page,54,587);
       const metadata=await page.evaluate(()=>window.mathSpace.cylinder());assert.equal(metadata.thinking.length,50);assert.equal(metadata.bridgeCount,5);assert.equal(metadata.sectors.length,5);assert.equal(metadata.thinkingCount,50);assert.deepEqual(metadata.domainCounts,{numbers:274,measure:88,data:65,space:76,patterns:34});
       assert.equal(first.counts.edges,1223);assert.equal(first.counts.nodes,587);
       await page.locator('.space-label.cylinder-milestone:visible').first().waitFor();
       const milestoneKeys=await page.locator('.space-label.cylinder-milestone:visible').evaluateAll(labels=>labels.map(el=>el.dataset.key.slice(5)));
       assert.ok(milestoneKeys.length<=10&&milestoneKeys.every(id=>metadata.milestones.includes(id)));
       await assertOriginMarker(page);
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
         row.hoverLabelContrast=await assertLabelContrast(label);
         await assertPointFocus(page,key);
          await page.screenshot({path:path.join(dir,'1920x1080-hover.png')});
         await label.click();await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key&&window.mathSpace.snapshot().cylinderLocked,key);
         row.lockedLabelContrast=await assertLabelContrast(label);
         await assertPointFocus(page,key);row.pointFirstLabels=true;
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
         const originPosition=await assertOriginMarker(page);
         await page.locator('#cylinder-origin-marker').click();await page.locator('#cylinder-entry-nav').waitFor({state:'visible'});
         await page.waitForFunction(()=>!window.mathSpace.motion().tween);
         await page.locator('[data-action="cylinder-entry-close"]').click();
         await page.locator('.tool-rail [data-action="front"]').click();
         await page.waitForFunction(()=>!window.mathSpace.motion().tween&&!window.mathSpace.snapshot().selected);
         assert.deepEqual(await assertOriginMarker(page),originPosition);
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
         // Joint A/B route. Keep all previous A checks and the independent B
         // workbench suite. Use source-linked native work, not injected records.
         const topic='mt_Ep7TDFuYUa',session='equivalent',activeKey='node:'+topic;
         const learnerState=()=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
         const workbench=page.frameLocator('#journey-frame');
         const waitLesson=async()=>{
           await page.waitForFunction(id=>window.mathSpace?.snapshot().journeyOpen&&document.querySelector('#journey-frame').contentWindow.mathLesson?.snapshot()?.id===id,session,{timeout:60000});
         };
         const foreground=mode=>page.waitForFunction(mode=>document.body.dataset.workbenchForeground===mode,mode);
         // A dark map and a light native lesson are separate color surfaces.
         // Compare the computed CSS, not an assumed class or a golden pixel.
         const foregroundStyles=()=>page.evaluate(()=>{
           const get=s=>getComputedStyle(document.querySelector(s));
           const context=document.querySelector('#learning-map-context');
           const rgb=s=>{const a=s.match(/[0-9.]+/g)?.map(Number)||[];if(a.length!==3&&!(a.length===4&&a[3]===1))throw Error('Expected an opaque context color: '+s);return a.slice(0,3);};
           const lum=s=>rgb(s).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
           const contrasts=[...context.querySelectorAll('.learning-map-title,.learning-map-eyebrow,.learning-map-neighbor span,.learning-map-neighbor strong,.learning-map-neighbor small,.learning-map-neighbor em,.learning-map-footer>span')].map(el=>{
             const bg=el.closest('.learning-map-neighbor')||context,fg=getComputedStyle(el).color,background=getComputedStyle(bg).backgroundColor;
             const a=lum(fg),b=lum(background);
             return {role:el.className||el.tagName,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
           });
           return {filter:get('#space-canvas>canvas').filter,labels:Number(get('#space-canvas .space-labels').opacity),card:Number(get('#focus-card').opacity),lesson:Number(get('#journey-surface').opacity),contextBackground:get('#learning-map-context').backgroundColor,contrasts};
         });
         const assertLearningForeground=async()=>{
           const actual=await foregroundStyles();
           assert.ok(actual.filter.split(' ').includes('brightness(0.64)'),actual.filter);
           assert.ok(actual.filter.split(' ').includes('blur(0.8px)'),actual.filter);
           assert.equal(actual.labels,.62);assert.equal(actual.card,.76);assert.equal(actual.lesson,1);
           assert.equal(actual.contextBackground,'rgb(255, 254, 249)');
           assert.ok(actual.contrasts.length>=6&&actual.contrasts.every(item=>item.ratio>=4.5),'all context text must be readable: '+JSON.stringify(actual));
           return actual;
         };
         const assertMapForeground=async()=>{
           const actual=await page.evaluate(()=>({
             filter:getComputedStyle(document.querySelector('#space-canvas>canvas')).filter,
             labels:Number(getComputedStyle(document.querySelector('#space-canvas .space-labels')).opacity),
             lessonHidden:document.querySelector('#journey-surface').hidden,
             pending:document.querySelector('[data-action="nav-learn"]').dataset.pending,
             pointLabels:document.querySelectorAll('.space-label.node.cylinder-point-label:not([hidden])').length
           }));
           assert.equal(actual.filter,'none');assert.equal(actual.labels,1);
           assert.equal(actual.lessonHidden,true);assert.equal(actual.pending,'true');assert.ok(actual.pointLabels>0);
           return actual;
         };
         const lessonStage=stage=>workbench.locator('#scene').getAttribute('data-stage').then(value=>assert.equal(value,stage));
         const waitStage=stage=>page.waitForFunction(stage=>document.querySelector('#journey-frame').contentDocument?.querySelector('#scene')?.dataset.stage===stage,stage);
         const learner=async()=>JSON.parse(await learnerState()).lessons[session];
         const check=workbench.locator('#actions [data-do="check"]'),next=workbench.locator('#actions [data-do="next"]');
         const pause=page.locator('#workbench-later'),resume=page.locator('[data-action="nav-learn"]');
         const paused=()=>page.waitForFunction(()=>window.mathSpace.snapshot().journeyOpen&&window.mathSpace.snapshot().journeySuspended&&document.querySelector('#journey-surface').hidden);
         const compareOpened=async(raw)=>{
           const expected=JSON.parse(raw),actual=JSON.parse(await learnerState());
           expected.lessons[session].updatedAt=actual.lessons[session].updatedAt;
           expected.daily.continuation.at=actual.daily.continuation.at;
           assert.deepEqual(actual,expected,'only original native reopen timestamps may change');
         };
         await page.goto(base+'/index.html?world=network&layout=54#space/node/'+topic);
         await ready(page,54,587);
         await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key&&window.mathSpace.snapshot().cylinderLocked,activeKey);
         const learningEntry=page.locator('#focus-card [data-action="open"][data-id="'+topic+'"]:visible');
         assert.equal(await learningEntry.count(),1);
         const lockedBefore=await page.evaluate(()=>window.mathSpace.snapshot());
         await learningEntry.click();await waitLesson();await foreground('learn');
         const learningStyles=await assertLearningForeground();
         await page.screenshot({path:path.join(dir,'ab-v54-learning-foreground.png')});
         assert.equal(await workbench.locator('body').getAttribute('data-workbench-shell'),'fixed');
         assert.equal(await workbench.locator('#workbench-beats li').count(),4);
         assert.equal(await workbench.locator('#workbench-curriculum').getAttribute('data-topic-id'),topic);
         assert.equal(await workbench.locator('#status').getAttribute('data-task-ordinal'),'1');
         assert.equal(await workbench.locator('#actions').count(),1);
         const opened=await page.evaluate(()=>window.mathSpace.snapshot());
         assert.equal(opened.networkVersion,54);assert.deepEqual(opened.positions,lockedBefore.positions);
         assert.deepEqual(camera(opened),camera(lockedBefore));
         const token=await workbench.locator('body').evaluate(el=>el.ownerDocument.defaultView.__abDocumentToken='ab-live-'+Math.random());
         const sameDocument=async()=>assert.equal(await workbench.locator('body').evaluate(el=>el.ownerDocument.defaultView.__abDocumentToken),token);
         await check.click();await waitStage('revise');
         const wrong=structuredClone((await learner()).cases[0].attempts[0]);
         for(const [r,i] of [[0,1],[1,2],[2,3]])await workbench.locator('#work [data-do="row-part"][data-row="'+r+'"][data-index="'+i+'"]').click();
         await waitStage('recheck');
         const edited=await learnerState();
         const beforeKey=await page.locator('#learning-map-context [data-direction="before"] [data-source-key]').getAttribute('data-source-key');
         assert.ok(beforeKey&&beforeKey!==activeKey&&beforeKey.startsWith('node:'));
         const beforeId=beforeKey.slice(5);
         assert.ok(atlas.edges.some(e=>e.prerequisiteId===beforeId&&e.topicId===topic),'shown prerequisite has a real directed source edge');
         const pack=atlas.packs.find(p=>p.nodeIds.includes(beforeId));
         assert.ok(pack,'prerequisite belongs to a source pack');
         assert.ok(await page.locator('#workbench-focus-toggle').isHidden(),'v54 has no third foreground state');
         // Real hit-tested blank canvas click, away from points and overlays.
         const pausePoint=await page.evaluate(()=>{
           const canvas=document.querySelector('#space-canvas>canvas'),r=canvas.getBoundingClientRect(),nodes=window.mathSpace.snapshot().positions.filter(o=>o.key.startsWith('node:')).map(o=>({p:window.mathSpace.project(o.key),radius:window.mathSpace.nodeRadius(o.key)||0}));
           for(let y=r.top+110;y<r.bottom-100;y+=27)for(let x=r.left+35;x<r.right-35;x+=29){
             if(document.elementFromPoint(x,y)!==canvas)continue;
             if(nodes.every(({p,radius})=>!p?.visible||Math.hypot(x-r.left-p.x,y-r.top-p.y)>radius+12))return {x,y};
           }
           return null;
         });
         assert.ok(pausePoint,'real exposed blank map hit target');
         await page.mouse.click(pausePoint.x,pausePoint.y);await paused();
         await sameDocument();assert.equal(await learnerState(),edited);
         // Choose the actual linked knowledge through the ordinary search UI.
         // The fixed native document must not be reloaded or replaced.
         await page.locator('[data-action="search"]:visible').first().click();
         await page.locator('#search-input').fill(beforeId);
         await page.locator('#search-results [data-key="'+beforeKey+'"]').click();
         await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key,beforeKey);
         await paused();await sameDocument();
         await page.waitForFunction(()=>document.querySelector('.space-label.node.cylinder-point-label:not([hidden])'));
         const mapStyles=await assertMapForeground();
         const explored=await learnerState(),expected=JSON.parse(edited),actual=JSON.parse(explored);
         assert.ok(actual.visited[beforeId]);
         if(!Object.hasOwn(expected.visited,beforeId)){expected.visited[beforeId]=actual.visited[beforeId];expected.openedPacks[pack.id]??=actual.openedPacks[pack.id];}
         assert.deepEqual(actual,expected,'only original source visit entries may change');
         assert.deepEqual(camera(await page.evaluate(()=>window.mathSpace.snapshot())),camera(opened));
         assert.equal(await workbench.locator('#workbench-curriculum').getAttribute('data-topic-id'),topic);
         await page.screenshot({path:path.join(dir,'ab-v54-prerequisite.png')});
         await page.locator('.top-tools [data-action="overview"]').click();
         await page.waitForFunction(()=>window.mathSpace.snapshot().selected===null);
         await paused();await sameDocument();assert.equal(await learnerState(),explored);
         await page.locator('[data-action="back"]').click();
         await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key,beforeKey);
         await paused();await sameDocument();assert.equal(await learnerState(),explored);
         await resume.click();await foreground('learn');await sameDocument();await lessonStage('recheck');
         const returnedStyles=await assertLearningForeground();
         await page.screenshot({path:path.join(dir,'ab-v54-learning-return.png')});
         assert.equal(await learnerState(),explored);
         await pause.press('Enter');await paused();
         assert.equal(await learnerState(),explored);
         const pausedView=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-network-cylinder-view-v1')));
         assert.equal(pausedView.sessionId,session);assert.equal(pausedView.selected,beforeKey);assert.equal(pausedView.journeySuspended,true);
         assert.equal(pausedView.networkVersion,54);
         await resume.press('Enter');await foreground('learn');await sameDocument();
         assert.equal(await learnerState(),explored);
         await pause.click();await paused();
         // Both the A cylinder and the B presentation must exist in the one
         // current release cache. Reload the actual paused view offline.
         await page.waitForFunction(async release=>{
           const worker=navigator.serviceWorker.controller;if(!worker||worker.state!=='activated')return false;
           const cache=await caches.open(release);
           const modules=await Promise.all(['./spatial-cylinder-visuals.js','./learning/workbench-presentation.js'].map(p=>cache.match(new URL(p,location.href))));
           return modules.every(Boolean);
         },release,{timeout:90000});
         await ctx.setOffline(true);
         try{
           await page.reload();await ready(page,54,587);await waitLesson();await paused();
           await page.waitForFunction(key=>window.mathSpace.snapshot().selected===key,beforeKey);
           await compareOpened(explored);
           await resume.click();await foreground('learn');await waitStage('recheck');
           const offlineStyles=await assertLearningForeground();
           row.foregroundPresentation={learning:learningStyles,map:mapStyles,returned:returnedStyles,offline:offlineStyles};
           await check.click();await waitStage('passed');
           const corrected=await learner();
           assert.equal(corrected.cases[0].attempts.length,2);assert.deepEqual(corrected.cases[0].attempts[0],wrong);
           await page.screenshot({path:path.join(dir,'ab-v54-offline-rechecked.png')});
           await next.click();
           await page.waitForFunction(()=>document.querySelector('#journey-frame').contentWindow.mathLesson.snapshot().index===1);
           assert.equal(await workbench.locator('#status').getAttribute('data-task-ordinal'),'2');
         }finally{await ctx.setOffline(false);}
         const completedFirst=await learnerState();
         await page.locator('#journey-surface [data-action="close-journey"]').click();
         await page.waitForFunction(()=>!window.mathSpace.snapshot().journeyOpen&&document.querySelector('#journey-frame').contentWindow.location.href==='about:blank');
         assert.equal(await learnerState(),completedFirst);
         await page.locator('[data-action="nav-trail"]').click();
         const trail=page.frameLocator('#utility-frame');
         const article=trail.locator('[data-lesson-record="'+session+'"][data-trail-tier="evidence"]');
         await article.filter({hasText:'2 次实际提交'}).waitFor({state:'visible'});
         assert.ok((await article.innerText()).includes('1 / 3'));
         await page.screenshot({path:path.join(dir,'ab-v54-trail.png')});
         await page.locator('[data-action="nav-explore"]').click();
         const beforeSwitch=await learnerState();
         await page.locator('[data-action="menu"]').click();
         await page.locator('[data-action="map-version"]').click();await ready(page,53,537);
         assert.equal(await learnerState(),beforeSwitch);
         await page.locator('[data-action="nav-trail"]').click();
         await page.frameLocator('#utility-frame').locator('[data-lesson-record="'+session+'"] [data-do="resume-lesson"][data-id="'+session+'"]').click();
         await waitLesson();await foreground('learn');
         await compareOpened(beforeSwitch);
         assert.equal(await workbench.locator('#status').getAttribute('data-task-ordinal'),'2');
         assert.equal((await learner()).cases[0].attempts.length,2);
         await page.screenshot({path:path.join(dir,'ab-v53-same-record.png')});
         await page.locator('#journey-surface [data-action="close-journey"]').click();
         await page.waitForFunction(()=>!window.mathSpace.snapshot().journeyOpen);
         const backTo54=await learnerState();
         await page.locator('[data-action="menu"]').click();
         await page.locator('[data-action="map-version"]').click();await ready(page,54,587);
         assert.equal(await learnerState(),backTo54);
         assert.deepEqual((await page.evaluate(()=>window.mathSpace.snapshot())).positions,before.positions);
         row.joint={session,sourcePrerequisite:beforeId,wrongAndCorrectAttempts:2,nextOrdinal:2,pauseRestored:true,offline:true,sameWorkInV53:true,sourcePositionsUnchanged:true};
         // Keep every automated interaction in the approved desktop content box.
         assert.deepEqual(page.viewportSize(),STANDARD_DESKTOP_VIEWPORT);
       }
       assert.deepEqual(errors,[]);row.passed=true;
     }catch(e){row.failure=e.stack;await page.screenshot({path:path.join(dir,width+'x'+height+'-failure.png')}).catch(()=>{});throw e;}
     finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2));await ctx.close();}
   }
 }finally{await browser.close();}
 console.log(JSON.stringify(results));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
