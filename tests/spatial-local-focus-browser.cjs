// Current v53 regression: selection keeps the shared 537-node panorama intact,
// while highlighted direct links and exploration trail remain actual source edges.
// This supersedes the old local-only acceptance assertions.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.MATH_SPATIAL_EVIDENCE||'verification/spatial-local-focus'),base='http://127.0.0.1:43827/';
const checks=[],errors=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot()),selected=id=>'node:'+id;
 const ROOT='mt_WcfaSfVT33',COUNT='mt_dmNvjroCPT';
 const choice=id=>page.locator('#focus-card .network-relations [data-action="choose"][data-key="'+selected(id)+'"]');
 try{
  await page.goto(base+'?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const panorama=await snap();
  check(panorama.selected===null&&panorama.backgroundEdgesVisible,'overview starts with all map nodes and background');
  await page.locator('[data-action="search"]').click();
  await page.locator('#search-input').fill(ROOT);
  await page.locator('#search-results [data-key="'+selected(ROOT)+'"]').click();
  await page.waitForFunction(()=>{const s=mathSpace.snapshot();return s.selected==='node:mt_WcfaSfVT33'&&s.visibleNodes.length===537;});
  let s=await snap();
  check(s.visibleNodes.length===537&&s.visibleNodes.includes(selected(ROOT))&&s.backgroundEdgesVisible,'selecting a node keeps the 537-node background and original edges');
   check(await page.locator('#focus-card .network-relations').evaluate(el=>el.open),'direct relations are open after selecting a node');
  check(await page.locator('#local-overview-exit').isVisible(),'the local focus has a persistent full-map exit');
  const integrity=await page.evaluate(async id=>{
   const atlas=await(await fetch('./data/atlas.json')).json(),s=mathSpace.snapshot();
   const direct=new Set([id,...atlas.edges.filter(e=>e.prerequisiteId===id||e.topicId===id).map(e=>e.prerequisiteId===id?e.topicId:e.prerequisiteId)]);
   const source=new Set(atlas.edges.map(e=>e.prerequisiteId+'>'+e.topicId));
    const locatable=new Set(s.positions.map(p=>p.key.slice(5)));
    const actualDirect=[...direct].filter(id=>locatable.has(id));
    return s.visibleNodes.length===537&&s.focusFilterCounts?.nodes===actualDirect.length&&
      s.focusFilterEdges.every(e=>source.has(e.from+'>'+e.to));
  },ROOT);
  check(integrity,'focus emphasizes only actual source neighbors without deleting unrelated nodes');
  check(JSON.stringify(s.positions)===JSON.stringify(panorama.positions),'local display never changes source coordinates');
  check(s.explorationTrail.join(',')===selected(ROOT),'local exploration starts at the chosen node');
  await page.screenshot({path:path.join(out,'01-local-root.png')});
  await choice(COUNT).click();await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_dmNvjroCPT');
  s=await snap();
  check(s.explorationTrail.join(',')===[ROOT,COUNT].map(selected).join(',')&&s.backgroundEdgesVisible&&s.visibleNodes.length===537,'following a real edge keeps the panorama and extends the trail');
  const next=await page.evaluate(async count=>{
   const atlas=await(await fetch('./data/atlas.json')).json(),available=new Set(mathSpace.snapshot().positions.map(p=>p.key.slice(5)));
   return atlas.edges.filter(e=>e.prerequisiteId===count||e.topicId===count)
    .map(e=>e.prerequisiteId===count?e.topicId:e.prerequisiteId)
    .find(id=>id!=='mt_WcfaSfVT33'&&available.has(id));
  },COUNT);
  check(!!next,'there is a second real neighbor to extend the path');
  await choice(next).click();await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,next);
  s=await snap();
  check(s.explorationTrail.length===3&&s.visibleNodes.includes(selected(ROOT)),'older visited node remains shown along the real path');
  const trueTrail=await page.evaluate(async()=>{
   const a=await(await fetch('./data/atlas.json')).json(),trail=mathSpace.snapshot().explorationTrail.map(k=>k.slice(5));
   return trail.slice(1).every((id,i)=>a.edges.some(e=>e.prerequisiteId===id&&e.topicId===trail[i]||e.topicId===id&&e.prerequisiteId===trail[i]));
  });
  check(trueTrail,'each remembered trail link exists in the source graph');
  await page.screenshot({path:path.join(out,'02-expanded-path.png')});
  await page.locator('[data-action="network-view"][data-view="top"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().networkView==='map');
  s=await snap();check(s.visibleNodes.length===537&&s.backgroundEdgesVisible,'switching view angle keeps the full map background');
  await page.waitForTimeout(400);await page.reload();
  await page.waitForFunction(id=>window.mathSpace&&mathSpace.snapshot().selected==='node:'+id,next);
  s=await snap();check(s.explorationTrail.length===3&&s.visibleNodes.includes(selected(ROOT)),'reload restores the real-edge trail');
  await page.locator('#local-overview-exit').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected===null&&mathSpace.snapshot().visibleNodes.length===537);
  s=await snap();check(s.backgroundEdgesVisible&&s.visibleNodes.length===537&&(s.explorationTrail?.length||0)===0,'canceling selection clears the trail without dropping map nodes');
  check(await page.locator('#focus-card').isHidden()&&await page.locator('#local-overview-exit').isHidden(),'leaving local focus closes the relation card and return control');
  await page.locator('[data-action="search"]').click();await page.locator('#search-input').fill(ROOT);
  await page.locator('#search-results [data-key="'+selected(ROOT)+'"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_WcfaSfVT33');
  await page.waitForTimeout(350);
  await page.goto(base+'?world=network&layout=53#atlas');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().selected===null&&mathSpace.snapshot().visibleNodes.length===537);
  check(await page.locator('#focus-card').isHidden()&&await page.locator('#local-overview-exit').isHidden(),'direct panorama URL overrides saved local view and hides the card');
  check((await snap()).backgroundEdgesVisible,'direct panorama URL restores background structure');
  check(JSON.stringify(s.positions)===JSON.stringify(panorama.positions),'panorama and local/expanded views share fixed coordinates');
  check(errors.length===0,'no browser runtime errors');
  await page.screenshot({path:path.join(out,'03-full-overview.png')});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,childTrial:false}));
 }catch(error){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(error),childTrial:false},null,2));
  console.error(error.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
