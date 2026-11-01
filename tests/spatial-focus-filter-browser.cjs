// Verify the v53 directional/depth lenses on actual source-backed browser rendering.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/spatial-focus-filter'),base='http://127.0.0.1:43827/';
const id='mt_WcfaSfVT33',key='node:'+id,checks=[],errors=[];
const check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 const select=(kind,value)=>page.locator('[data-action="focus-'+kind+'"][data-'+kind+'="'+value+'"]');
 try{
  await page.goto(base+'?v=56&world=network&layout=53#atlas');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const overview=await snap(),coords=JSON.stringify(overview.positions);
  check(overview.structureMode==='origin','single source-backed structure is the normal panorama');
  check(await page.locator('.space-label.node:visible').count()<=4,'unrelated source names do not crowd the panorama');
  await page.screenshot({path:path.join(out,'01-filtered-panorama.png')});
  await page.locator('[data-action="search"]').click();
  await page.locator('#search-input').fill(id);
  await page.locator('#search-results [data-key="'+key+'"]').click();
  await page.waitForFunction(k=>mathSpace.snapshot().selected===k&&!!mathSpace.snapshot().focusFilterCounts,key);
  let s=await snap();const direct=s.focusFilterCounts;
  check(s.focusDirection==='both'&&s.focusDepth==='1','knowledge selection begins with both directions and one hop');
  check(direct.nodes<537&&direct.nodes>1,'a direct focus shows a meaningful small real neighborhood');
  check(await select('depth','2').count()===1&&await select('direction','after').count()===1,'user can choose relation direction and expansion level');
  check(await select('depth','1').getAttribute('aria-pressed')==='true','depth 1 reflects active visual state');
  check(await page.locator('#focus-card .network-relations').evaluate(el=>!el.open),'full source relation list is available but collapsed by default');
  const hardEdges=await page.evaluate(async()=>{
   const atlas=await(await fetch('./data/atlas.json')).json();
   return new Set(atlas.edges.filter(e=>e.strength==='hard').map(e=>e.prerequisiteId+'>'+e.topicId)).size;
  });
  check(hardEdges===851,'original critical math relationships remain in the source');
  await page.screenshot({path:path.join(out,'02-one-hop.png')});
  await select('direction','after').click();
  s=await snap();
  check(s.focusDirection==='after'&&s.focusDepth==='1'&&s.focusFilterCounts.nodes<=direct.nodes,'forward view hides unrelated antecedents');
  const forward=s.focusFilterCounts.nodes;
  await select('depth','2').click();
  s=await snap();
  check(s.focusFilterCounts.nodes>=forward&&s.focusDepth==='2','expanding to two hops never drops a prior reachable node');
  await page.screenshot({path:path.join(out,'03-two-hops.png')});
  await select('depth','all').click();
  s=await snap();
  check(s.focusFilterCounts.nodes>=forward&&s.focusFilterCounts.nodes>=direct.nodes-1,'complete forward relation view expands along source edges');
  check(s.focusFilterCounts.nodes<537,'complete relation only shows reachable knowledge, not unrelated map components');
  const valid=await page.evaluate(async()=>{
   const atlas=await(await fetch('./data/atlas.json')).json(),original=new Set(atlas.edges.map(e=>e.prerequisiteId+'>'+e.topicId));
   const s=mathSpace.snapshot();
   return s.focusFilterEdges.every(e=>original.has(e.from+'>'+e.to));
  });
  check(valid,'every expanded line corresponds to a genuine source relation');
  check(JSON.stringify(s.positions)===coords,'filters never move any of the 537 domain coordinates');
  await page.screenshot({path:path.join(out,'04-all-forward.png')});
  await select('depth','1').click();
  await select('direction','both').click();
  s=await snap();
  check(s.focusDepth==='1'&&s.focusDirection==='both'&&s.focusFilterCounts.nodes===direct.nodes,'local filter is reversible without losing source relations');
  await page.locator('#local-overview-exit').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected===null&&mathSpace.snapshot().visibleNodes.length===537);
  s=await snap();
  check(s.structureMode==='origin'&&JSON.stringify(s.positions)===coords,'overview returns to the same coordinates and single structure');
  check(errors.length===0,'no browser runtime errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,counts:{direct,forward},childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,counts:{direct,forward}}));
 }catch(e){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(e)},null,2));
  console.error(e.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
