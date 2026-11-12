// Five source-backed theme overviews are navigable views of the same v53 atlas.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const sameSnapshotWithCameraRoundoff=require('./camera-snapshot.cjs');
const out=process.env.MATH_THEME_OUTPUT||path.resolve(__dirname,'../verification/spatial-theme-overview');
const url=new URL('?v=56&world=network&layout=53#atlas',process.env.MATH_THEME_BASE_URL||'http://127.0.0.1:43827/').href;
const sourceRoot=process.env.MATH_THEME_SOURCE_ROOT||path.resolve(__dirname,'../dist');
const ids=['numbers','space','measure','patterns','data'],checks=[],errors=[];
const check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 let snapshotDiff;
 try{
  await page.goto(url);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const {applyNavigationCopy}=await import(require('node:url').pathToFileURL(path.join(sourceRoot,'navigation-copy.js')).href);
  const atlas=applyNavigationCopy(await page.evaluate(async()=>await(await fetch('./data/atlas.json')).json()));
  const original=JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions);
  const camera=()=>page.evaluate(()=>{const s=mathSpace.snapshot(),m=mathSpace.motion();return {position:s.position,target:s.target,zoom:s.cameraZoom,tween:m.tween,transition:m.transition};});
  const sameCamera=(a,b)=>JSON.stringify({position:a.position,target:a.target,zoom:a.zoom})===JSON.stringify({position:b.position,target:b.target,zoom:b.zoom});
  await page.waitForFunction(()=>mathSpace.motion().tween===null);
  await page.waitForTimeout(450);
  // Hover previews REAL node colors while its theme title reflects hierarchy.
  // Hover does not select, move the camera or write learning storage.
  const hoverCamera=await camera();
  const rawSnapshot=await page.evaluate(()=>JSON.stringify(mathSpace.snapshot()));
  const baselineLabels=await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key));
  const urlBeforeHover=page.url(),storageBeforeHover=await page.evaluate(()=>JSON.stringify({...localStorage}));
  const floatingTheme=page.locator('.space-label.theme:visible').first();
  const themeId=(await floatingTheme.getAttribute('data-key')).replace('theme:','');
  const themeRectBefore=await floatingTheme.boundingBox();
  const themeNode=atlas.nodes.find(n=>n.themeId===themeId&&n.domainId!=='thinking');
  const differentNode=atlas.nodes.find(n=>n.themeId!==themeId&&n.domainId!=='thinking');
  const tints=()=>page.evaluate(keys=>keys.map(key=>mathSpace.nodeTint('node:'+key)),[themeNode.id,differentNode.id]);
  const beforeTints=await tints();
  const diff=(a,b)=>a.map((c,i)=>Math.abs(c-b[i])).reduce((x,y)=>x+y,0);
  await floatingTheme.hover();
  await page.waitForFunction(id=>document.querySelector('#network-legend [data-id="'+id+'"]')?.dataset.hover==='true',themeId);
  check(await page.locator('#network-legend [data-hover="true"]').count()===1,'floating theme hover highlights only its corresponding top-left title');
  await page.waitForFunction(({id,before})=>{const el=mathSpace.nodeTint('node:'+id);return el&&el.some((v,i)=>Math.abs(v-before[i])>.025);},{id:themeNode.id,before:beforeTints[0]});
  const previewTints=await tints();
  check(diff(beforeTints[0],previewTints[0])>.08,'hover visibly restores color to matching theme nodes');
  check(diff(beforeTints[1],previewTints[1])>.01,'hover fades nodes outside the previewed theme: '+JSON.stringify({before:beforeTints[1],after:previewTints[1]}));
  check(await page.locator('#focus-card').isHidden(),'floating theme hover never opens a panel');
  check(await floatingTheme.evaluate(el=>!el.hasAttribute('title')),'theme title does not create a duplicate native browser tooltip');
  const previewGroups=await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key.replace('pack:','')));
  check(previewGroups.length>=2,'hover restores multiple source-backed subtopic titles');
  check(previewGroups.every(id=>atlas.packs.some(p=>p.id===id&&p.themeId===themeId)),'hover shows subtopics only from the previewed theme');
  const themeRectDuring=await floatingTheme.boundingBox();
  check(await floatingTheme.evaluate(el=>getComputedStyle(el).opacity==='1'&&el.classList.contains('preview-theme-target')),
    'hovered world-theme title remains visibly highlighted under the pointer');
  check(themeRectBefore&&themeRectDuring&&Math.abs(themeRectBefore.x-themeRectDuring.x)<2&&Math.abs(themeRectBefore.y-themeRectDuring.y)<2,
    'hovered world-theme title keeps its screen-space position without jumping');
  const labelCollision=await page.evaluate(key=>{
    const main=document.querySelector('.space-label.theme[data-key="'+key+'"]');
    const a=main.getBoundingClientRect();
    return [...document.querySelectorAll('.space-label.pack:not([hidden])')].some(el=>{
      const b=el.getBoundingClientRect();
      return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    });
  },'theme:'+themeId);
  check(!labelCollision,'the primary theme title does not overlap the previewed knowledge-group titles');
  await page.screenshot({path:path.join(out,'theme-hover-title-visible.png')});
  await page.waitForTimeout(200);
  check(await page.locator('#network-legend [data-hover="true"]').count()===1,'visible floating theme title keeps its hover and the group preview without flicker');
  const hoverSnapshot=await page.evaluate(()=>JSON.stringify(mathSpace.snapshot()));
  const unchanged=sameSnapshotWithCameraRoundoff(rawSnapshot,hoverSnapshot);
  snapshotDiff=undefined;
  if(!unchanged){
   const expected=JSON.parse(rawSnapshot),actual=JSON.parse(hoverSnapshot);
   const changedKeys=[...new Set([...Object.keys(expected),...Object.keys(actual)])]
    .filter(key=>JSON.stringify(expected[key])!==JSON.stringify(actual[key]));
   snapshotDiff={changedKeys,fields:Object.fromEntries(changedKeys.map(key=>[key,{
    expectedPresent:Object.hasOwn(expected,key),actualPresent:Object.hasOwn(actual,key),expected:expected[key],actual:actual[key]}]))};
   if(!changedKeys.length)snapshotDiff.keyOrder={expected:Object.keys(expected),actual:Object.keys(actual)};
  }
  check(unchanged,'hover leaves graph snapshot, camera and selected state untouched');
  await page.mouse.move(4,4);
  await page.waitForFunction(()=>document.querySelectorAll('#network-legend [data-hover="true"]').length===0);
  await page.waitForFunction(({id,before})=>{const el=mathSpace.nodeTint('node:'+id);return el&&el.every((v,i)=>Math.abs(v-before[i])<.0001);},{id:themeNode.id,before:beforeTints[0]});
  check(page.url()===urlBeforeHover,'hover does not modify URL');
  // Hover the top-left theme title itself. It should provide the same cue.
  const legendTheme=page.locator('#network-legend [data-action="network-theme"][data-id="data"]');
  await legendTheme.hover();
  check(await legendTheme.getAttribute('data-hover')==='true','top-left theme hover highlights the corresponding header');
  const dataNode=atlas.nodes.find(n=>n.themeId==='data'&&n.domainId!=='thinking');
  const baselineDataTint=await page.evaluate(id=>mathSpace.nodeTint('node:'+id),dataNode.id);
  check(baselineDataTint.every(Number.isFinite),'top-left theme preview has a real source-node color');
  const legendPacks=await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key.replace('pack:','')));
  check(legendPacks.length>=2&&legendPacks.every(id=>atlas.packs.some(p=>p.id===id&&p.themeId==='data')),'top-left theme hover reveals several of its real subtopics');
  check(diff(beforeTints[1],await page.evaluate(id=>mathSpace.nodeTint('node:'+id),differentNode.id))>.02,'legend theme hover also changes real node color');
  await page.mouse.move(4,4);
  await page.waitForFunction(()=>document.querySelectorAll('#network-legend [data-hover="true"]').length===0);
  check(page.url()===urlBeforeHover&&await page.evaluate(()=>JSON.stringify({...localStorage}))===storageBeforeHover,'hover never writes navigation or learning storage');
  check(JSON.stringify(await camera())===JSON.stringify(hoverCamera),'all hover operations leave the camera untouched');

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
   // Hover a real group: illuminate only its members, with its parent in the header.
   const packTitle=page.locator('.space-label.pack:visible').first();
   if(await packTitle.count()){
     const packId=(await packTitle.getAttribute('data-key')).slice(5);
     const pack=atlas.packs.find(p=>p.id===packId),parent=pack.themeId;
     const own=atlas.nodes.find(n=>n.packId===packId&&n.domainId!=='thinking');
     const sibling=atlas.nodes.find(n=>n.themeId===parent&&n.packId!==packId&&n.domainId!=='thinking');
     const originalSelected=(await page.evaluate(()=>mathSpace.snapshot())).selected;
     const oldGroupLabels=await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key));
     const oldCamera=await camera();
     const oldBounds=await packTitle.boundingBox();
     await packTitle.hover();
     await page.waitForFunction(key=>mathSpace.hoverPreview().key===key,'pack:'+packId);
     await page.waitForTimeout(250);
     check((await page.evaluate(()=>mathSpace.hoverPreview())).key==='pack:'+packId,
       theme.title+' group hover remains stable after label relayout');
     const hoverBounds=await packTitle.boundingBox();
     check(oldBounds&&hoverBounds&&Math.abs(oldBounds.x-hoverBounds.x)<2&&Math.abs(oldBounds.y-hoverBounds.y)<2,
       theme.title+' hovered group label stays anchored under the mouse');
     check(await page.locator('#network-legend [data-hover="true"]').count()===1,theme.title+' group hover highlights its parent theme');
     check(await page.locator('#network-legend [data-id="'+parent+'"]').getAttribute('data-hover')==='true',theme.title+' group shows its real parent');
     check((await page.evaluate(()=>mathSpace.hoverPreview())).edges.length===0,theme.title+' group hover does not invent direct node edges');
     if(own&&sibling){
       const ownTint=await page.evaluate(id=>mathSpace.nodeTint('node:'+id),own.id);
       const siblingTint=await page.evaluate(id=>mathSpace.nodeTint('node:'+id),sibling.id);
       check(diff(ownTint,siblingTint)>.02,theme.title+' group hover emphasizes its own source nodes over sibling groups');
     }
     const groupPreviewLabels=await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key));
     check(groupPreviewLabels.every(key=>key==='pack:'+packId),theme.title+' group hover is group-specific, not a duplicate theme preview');
     check((await page.evaluate(()=>mathSpace.snapshot())).selected===originalSelected,theme.title+' group hover keeps clicked theme detail');
     check(JSON.stringify(await camera())===JSON.stringify(oldCamera),theme.title+' group hover never moves the camera');
     check((await page.locator('#network-view-title').textContent()).includes(pack.title),theme.title+' group breadcrumb names the inspected group');
     await page.mouse.move(4,4);
     await page.waitForFunction(()=>mathSpace.hoverPreview().key===null&&document.querySelectorAll('#network-legend [data-hover="true"]').length===0);
     const restored=await page.locator('.space-label.pack:visible').evaluateAll(els=>els.map(e=>e.dataset.key));
     check(JSON.stringify(restored)===JSON.stringify(oldGroupLabels),theme.title+' restores the clicked theme labels on mouse leave');
     check(await card.isVisible(),theme.title+' retains its clicked theme detail after group hover');
   }
  }
  // Direct-node hover uses only real source edges and is reversible.
  await page.locator('[data-action="overview"]').first().click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected===null);
  await page.mouse.move(4,4);
  // Navigation intentionally schedules an asynchronous view save. Let it
  // settle BEFORE measuring storage, so hover is not blamed for that write.
  await page.waitForTimeout(500);
  const nodeCamera=await camera(),nodeSnapshot=JSON.stringify(await page.evaluate(()=>mathSpace.snapshot()));
  const nodeStorage=await page.evaluate(()=>JSON.stringify({...localStorage}));
  const candidates=atlas.nodes.filter(n=>n.domainId!=='thinking'&&atlas.edges.some(e=>e.topicId===n.id||e.prerequisiteId===n.id));
  const projected=await page.evaluate(nodes=>nodes.map(n=>({id:n.id,p:mathSpace.project('node:'+n.id)})).filter(v=>v.p?.visible&&v.p.x>390&&v.p.x<1250&&v.p.y>180&&v.p.y<700),candidates);
  check(projected.length>0,'panorama exposes a real node that can be inspected without navigation');
  const isolated=projected.map(v=>({...v,nearest:Math.min(...projected.filter(w=>w!==v).map(w=>Math.hypot(v.p.x-w.p.x,v.p.y-w.p.y)))})).sort((a,b)=>b.nearest-a.nearest);
  let preview=null;
  for(const target of isolated.slice(0,25)){
    await page.mouse.move(target.p.x,target.p.y);
    await page.waitForTimeout(75);
    const candidate=await page.evaluate(()=>mathSpace.hoverPreview());
    if(candidate.key?.startsWith('node:')&&candidate.edges.length){preview=candidate;break;}
  }
  check(!!preview,'canvas hover previews a real knowledge node');
  const nodeId=preview.key.slice(5);
  const mappedIds=new Set(atlas.nodes.filter(n=>n.domainId!=='thinking').map(n=>n.id));
  const expected=atlas.edges.filter(e=>(e.topicId===nodeId||e.prerequisiteId===nodeId)&&mappedIds.has(e.topicId)&&mappedIds.has(e.prerequisiteId))
    .map(e=>e.prerequisiteId+'>'+e.topicId).sort();
  const actual=preview.edges.map(e=>e.from.slice(5)+'>'+e.to.slice(5)).sort();
  check(JSON.stringify(actual)===JSON.stringify(expected),'node hover presents every mapped direct source edge and invents none');
  check(preview.related.includes('node:'+nodeId),'node hover includes the hovered source node');
  const node=atlas.nodes.find(n=>n.id===nodeId),group=atlas.packs.find(p=>p.id===node.packId),parent=atlas.themes.find(t=>t.id===node.themeId);
  const breadcrumb=await page.locator('#network-view-title').textContent();
  check(breadcrumb.includes(parent.title)&&breadcrumb.includes(group.title)&&breadcrumb.includes('›'),'node preview displays its true theme → group → knowledge path');
  await page.waitForFunction(key=>document.querySelector('.space-label.node.preview-target:not([hidden])')?.dataset.key===key,preview.key);
  const focusLabel=page.locator('.space-label.node.preview-target:visible');
  check(await focusLabel.count()===1,'exactly one currently hovered node has the primary visual frame');
  const focusStyle=await focusLabel.evaluate(el=>{const c=getComputedStyle(el);return {border:parseFloat(c.borderTopWidth),weight:parseFloat(c.fontWeight),shadow:c.boxShadow}});
  check(focusStyle.border>=2&&focusStyle.weight>=700&&focusStyle.shadow!=='none','hover target has a strong border, bold name and visible shadow');
  const relatedLabels=page.locator('.space-label.node.preview-neighbor:visible');
  if(await relatedLabels.count()){
    const nearby=await relatedLabels.first().evaluate(el=>{const c=getComputedStyle(el);return {border:parseFloat(c.borderTopWidth),weight:parseFloat(c.fontWeight)}});
    check(nearby.border<focusStyle.border&&nearby.weight<focusStyle.weight,'real direct neighbors are framed more lightly than the hover target');
  }
  await page.screenshot({path:path.join(out,'node-hover-hierarchy.png')});
  check(JSON.stringify(await camera())===JSON.stringify(nodeCamera),'node hover does not pan, zoom or rotate');
  check(JSON.stringify(await page.evaluate(()=>mathSpace.snapshot()))===nodeSnapshot,'node hover never modifies selected map snapshot');
  await page.mouse.move(4,4);
  await page.waitForFunction(()=>mathSpace.hoverPreview().key===null);
  check(await page.locator('.space-label.node.preview-target:visible').count()===0,'hover target framing disappears on leave');
  check((await page.locator('#network-view-title').textContent())!==breadcrumb,'top-left breadcrumb restores the prior map state on leave');
  check(JSON.stringify(await page.evaluate(()=>mathSpace.snapshot()))===nodeSnapshot,'leaving node restores the panorama');
  check(await page.evaluate(()=>JSON.stringify({...localStorage}))===nodeStorage,'hover records no learning behavior');
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
  const groupCamera=await camera(),groupCoordinates=JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions);
  await page.locator('#focus-card .theme-pack-choice[data-key="pack:'+first.id+'"]').click();
  await page.waitForFunction(k=>mathSpace.snapshot().selected===k,'pack:'+first.id);
  await page.waitForTimeout(180);
  check((await camera()).tween===null,'group click never schedules a hidden camera animation');
  const groupSnapshot=await page.evaluate(()=>mathSpace.snapshot());
  check(sameCamera(groupCamera,await camera())&&groupSnapshot.selected==='pack:'+first.id,
    'clicking a theme group changes selection but never automatically zooms, pans or rotates');
  check(JSON.stringify(groupSnapshot.positions)===groupCoordinates&&groupSnapshot.visibleNodes.length===537,
    'group selection preserves all 537 fixed knowledge positions');
  check((await page.locator('#focus-card h2').textContent()).includes(first.title),
    'group detail identifies the chosen source knowledge group');
  check((await page.locator('#network-view-title').textContent()).includes(first.title),
    'top-left map context identifies the selected group');
  const groupLabels=await page.locator('.space-label.node:visible').evaluateAll(els=>els.map(el=>el.dataset.key.slice(5)));
  check(groupLabels.length<=10&&groupLabels.every(id=>first.nodeIds.includes(id)),
    'group selection only shows a readable number of this group\'s real node names');
  const otherDots=groupSnapshot.visibleNodes.filter(key=>key.startsWith('node:')&&!first.nodeIds.includes(key.slice(5)));
  check(otherDots.length>0,'other groups are not erased from the shared background');
  await page.screenshot({path:path.join(out,'group-selected-no-global-label-cloud.png')});
  // A manual zoom is still allowed and must not resurrect unrelated names.
  await page.locator('.tool-rail [data-action="zoom"][data-factor="0.75"]').click();
  await page.waitForFunction(()=>mathSpace.motion().tween===null);
  const zoomedGroupLabels=await page.locator('.space-label.node:visible').evaluateAll(els=>els.map(el=>el.dataset.key.slice(5)));
  check(zoomedGroupLabels.every(id=>first.nodeIds.includes(id))&&zoomedGroupLabels.length<=16,
    'manual zoom within a selected group never exposes labels from all 537 nodes');
  await page.locator('#back-button').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:numbers');
  check(await page.locator('#focus-card .theme-overview').isVisible(),'back returns to the theme with its group choices');
  await page.locator('#network-legend [data-action="network-theme"][data-id="data"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:data');
  const chance=atlas.packs.find(p=>p.id==='chance');
  check(chance?.themeId==='data','reproduction group belongs to the correct source theme');
  const chanceBefore=await camera();
  await page.locator('#focus-card .theme-pack-choice[data-key="pack:chance"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='pack:chance');
  await page.waitForTimeout(180);
  check((await camera()).tween===null,'data → chance never starts a fit animation');
  check(sameCamera(chanceBefore,await camera()),'data → chance preserves the exact saved camera');
  const chanceNames=await page.locator('.space-label.node:visible').evaluateAll(els=>els.map(el=>el.dataset.key.slice(5)));
  check(chanceNames.length<=10&&chanceNames.every(id=>chance.nodeIds.includes(id)),
    'data → chance displays only the chosen real group names instead of 537-name clutter');
  check((await page.locator('#focus-card h2').textContent()).includes(chance.title),
    'data → chance retains its group detail and routes');
  await page.screenshot({path:path.join(out,'chance-group-click.png')});
  await page.locator('[data-action="overview"]').first().click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected===null);
  check((await page.evaluate(()=>mathSpace.snapshot())).visibleNodes.length===537,'return to panorama keeps the full map intact');
  await page.setViewportSize({width:980,height:760});
  await page.locator('#network-legend [data-action="network-theme"][data-id="space"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='theme:space');
  const compact=await page.locator('#focus-card').evaluate(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,w:innerWidth,h:innerHeight};});
  check(compact.left>=0&&compact.right<=compact.w&&compact.top>=0&&compact.bottom<=compact.h,'compact desktop theme card stays in view: '+JSON.stringify(compact));
  check(errors.length===0,'no browser runtime errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,childTrial:false}));
 }catch(err){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(err),childTrial:false,snapshotDiff},null,2));
  console.error(err.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
