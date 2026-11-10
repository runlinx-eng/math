// P8: real Chromium label clicks, deterministic DOM timings and internal hot-path profile.
// Benchmark instrumentation is injected into the test page only; app source stays unchanged.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p8-trail-performance');
const baseline=process.env.MATH_P8_BASELINE==='1';
const oldChoose="function choose(key,{animate=true,history=true,openLesson=worldLayout!=='network'||taskSurfaceFromUrl()==='learn',inPlace=true}={}){const object=space.byKey.get(key);if(!object)return;if(guideVisible){visitGuideTarget(key);return;}if(journeyOpen)closeJourney(false);if(guideVisible||guideSuspended)leaveGuide();else if(learning.daily.guide?.active&&scene.relationshipMap)recordGuide(learning.daily.guide.step,false);if(history)remember();pointerPreview=null;focusPreview=null;scene.setPreview(null);closePopovers();activeRouteId=null;scene.setLearningRoute(null);scene.setLearningSection(null);if(inPlace){if(scene.relationshipMap&&!scene.selected&&object.kind==='node'&&animate)scene.beginViewTransition('to-focus',850);else scene.viewTransition=null;scene.select(key);}else scene.focus(key,{animate});setHash(key);\n  if(object.kind==='node')mutateLearning(s=>{s.visited[object.id]??=now();s.openedPacks[object.packId]??=now();});\n  else if(object.kind==='pack')mutateLearning(s=>{s.openedPacks[object.id]??=now();});\n  if(object.kind==='node'&&openLesson){if(worldLayout==='network'&&taskSurfaceFromUrl()==='learn')startLearningFromSelection();else{const lesson=lessonForTopic(object.id);if(lesson)openLearningLesson(lesson);else if(routeStep(object.id))openJourney(routeStep(object.id).step);}}\n  renderFocus();renderLocation();scheduleSave();\n}";
const check=(v,m)=>{if(!v)throw Error(m);};
const summarize=a=>({count:a.length,median:a.length?([...a].sort((x,y)=>x-y)[Math.floor(a.length/2)]):null,p95:a.length?([...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.ceil(a.length*.95)-1)]):null,max:a.length?Math.max(...a):null});
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  window.__p8work=[];window.__p8events=[];window.__p8storage=[];
  for(const method of ['getItem','setItem']){
   const original=Storage.prototype[method];
   Storage.prototype[method]=function(...args){
    const start=performance.now();
    try{return original.apply(this,args);}
    finally{if(args[0]==='math-explorer-v2')window.__p8storage.push({method,ms:performance.now()-start,bytes:method==='setItem'?String(args[1]||'').length:0});}
   };
  }
  document.addEventListener('click',e=>{
   const label=e.target.closest?.('.space-label.node');
   if(!label)return;
   const key=label.dataset.key,start=performance.now();
   const record={key,start,titleDOM:null,summaryDOM:null,paint:null};
   window.__p8events.push(record);
   const host=document.querySelector('#trail-node-context');
   if(!host)return;
   let observer;
   observer=new MutationObserver(()=>{
    const strong=host.querySelector('.trail-node-heading strong');
    if(!strong)return;
    if(record.titleDOM===null)record.titleDOM=performance.now()-start;
    if(record.summaryDOM===null&&host.querySelector('.trail-node-status,.trail-node-empty')){
     record.summaryDOM=performance.now()-start;
     requestAnimationFrame(()=>{requestAnimationFrame(()=>{record.paint=performance.now()-start;});});
     observer.disconnect();
    }
   });
   observer.observe(host,{subtree:true,childList:true,characterData:true});
  },true);
 });
 await page.route('**/space.js',async route=>{
  const response=await route.fetch();
  let body=await response.text();
  if(baseline){
   const begin=body.indexOf('function choose(key,'),end=body.indexOf('\nfunction overview(',begin);
   check(begin>=0&&end>begin,'baseline chooser splice unavailable');
   body=body.slice(0,begin)+oldChoose+body.slice(end);
  }
  const instrument=(opening,closing,label)=>{
   check(body.includes(opening)&&body.includes(closing),'instrument anchor missing '+label);
   body=body.replace(opening,opening+'const __p8start=performance.now();try{');
   body=body.replace(closing,'}finally{window.__p8work.push({name:"'+label+'",ms:performance.now()-__p8start});}}'+closing.split('}').slice(1).join('}'));
  };
  // One-line method tail, immediately before the next function.
  const begin='function mutateLearning(fn){';
  const end="return false;}}\nfunction questionComposer";
  check(body.includes(begin)&&body.includes(end),'mutateLearning anchors missing');
  body=body.replace(begin,begin+'const __p8start=performance.now();try{');
  body=body.replace(end,"return false;}}finally{window.__p8work.push({name:'mutateLearning',ms:performance.now()-__p8start});}}\nfunction questionComposer");
  check(body.includes('function refreshLearning(){')&&body.includes('renderTrailNodeContext();}\nfunction scheduleSave'),'refresh anchors missing');
  body=body.replace('function refreshLearning(){','function refreshLearning(){const __p8start=performance.now();try{');
  body=body.replace('renderTrailNodeContext();}\nfunction scheduleSave',"renderTrailNodeContext();}finally{window.__p8work.push({name:'refreshLearning',ms:performance.now()-__p8start});}}\nfunction scheduleSave");
  check(body.includes('function renderTrailNodeContext(){')&&body.includes('\n}\nfunction showUtility(which)'),'trail render anchors missing');
  body=body.replace('function renderTrailNodeContext(){','function renderTrailNodeContext(){const __p8start=performance.now();try{');
  body=body.replace('\n}\nfunction showUtility(which)',"\n}finally{window.__p8work.push({name:'renderTrailNodeContext',ms:performance.now()-__p8start});}}\nfunction showUtility(which)");
  await route.fulfill({response,body});
 });
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  // Select the initial real node in Explore, where search is not covered by
  // the full-history iframe. Trail measurements begin only after switching.
  // Enter a source node through the actual search UI; no synthetic choose/hash.
  await page.locator('[data-action="search"]').first().click();
  await page.locator('#search-input').fill('mt_ndGqFPWyen');
  await page.locator('#search-results [data-key="node:mt_ndGqFPWyen"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
  await page.locator('.primary-nav [data-action="nav-trail"]').click();
  await page.waitForFunction(()=>!document.querySelector('#utility-drawer').hidden);
  const samples=[];
  for(let i=0;i<8;i++){
   await page.waitForFunction(()=>[...document.querySelectorAll('.space-label.node:not([hidden])')].some(el=>{
    if(el.getAttribute('aria-pressed')==='true')return false;
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    if(r.width<5||r.height<5||cx<10||cy<10||cx>innerWidth-10||cy>innerHeight-10)return false;
    const top=document.elementFromPoint(cx,cy);
    return top===el||el.contains(top);
   }));
   const keys=await page.evaluate(()=>[...document.querySelectorAll('.space-label.node:not([hidden])')].filter(el=>{
    if(el.getAttribute('aria-pressed')==='true')return false;
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    if(r.width<5||r.height<5||cx<10||cy<10||cx>innerWidth-10||cy>innerHeight-10)return false;
    const top=document.elementFromPoint(cx,cy);
    return top===el||el.contains(top);
   }).map(el=>el.dataset.key));
   const key=keys[i%keys.length];
   const before=await page.evaluate(()=>({work:window.__p8work.length,storage:window.__p8storage.length,events:window.__p8events.length}));
   await page.locator('.space-label.node[data-key="'+key+'"]').click({timeout:5000});
   // Revisited nodes may already have a painted event from an earlier click.
   // Wait for the present click, never for a matching historical record.
   await page.waitForFunction(({key,before})=>
     window.__p8events.slice(before.events).some(e=>e.key===key&&e.paint!==null),
   {key,before});
   const sample=await page.evaluate(({key,before})=>{
    const event=window.__p8events.slice(before.events).find(e=>e.key===key);
    const work=window.__p8work.slice(before.work),storage=window.__p8storage.slice(before.storage);
    return {key,clickToTitle: event.titleDOM,clickToSummary:event.summaryDOM,clickToPaint:event.paint,
      work,storage,selected:mathSpace.snapshot().selected,
      currentTitle:document.querySelector('#trail-node-context .trail-node-heading strong')?.textContent};
   },{key,before});
   check(sample.selected===key,'3D click did not select '+key);
   check(sample.clickToTitle!==null&&sample.clickToPaint!==null,'trail response missing '+key);
   samples.push(sample);
   if(i===3)await page.screenshot({path:path.join(out,baseline?'baseline-trail-1440x900.png':'trail-node-1440x900.png')});
  }
  const nameStats={};for(const name of ['mutateLearning','refreshLearning','renderTrailNodeContext']){
   const entries=samples.flatMap(s=>s.work.filter(w=>w.name===name).map(w=>w.ms));
   nameStats[name]=summarize(entries);
  }
  const report={version:baseline?'pr59-unoptimized-choose':'optimized-choose',samples,metrics:{
   clickToTitle:summarize(samples.map(s=>s.clickToTitle)),
   clickToSummary:summarize(samples.map(s=>s.clickToSummary)),
   clickToPaint:summarize(samples.map(s=>s.clickToPaint)),
   learningReads:samples.reduce((a,s)=>a+s.storage.filter(e=>e.method==='getItem').length,0),
   learningWrites:samples.reduce((a,s)=>a+s.storage.filter(e=>e.method==='setItem').length,0),
   learningReadWriteMs:summarize(samples.flatMap(s=>s.storage.map(e=>e.ms))),
   functions:nameStats
  },errors};
  fs.writeFileSync(path.join(out,baseline?'baseline.json':'results.json'),JSON.stringify(report,null,2));
  console.log('P8_TRAIL_PERF_RESULT '+JSON.stringify({baseline,metrics:report.metrics}));
  check(errors.length===0,'runtime errors '+errors.join('; '));
 }catch(e){
  fs.writeFileSync(path.join(out,baseline?'baseline-failure.json':'failure.json'),JSON.stringify({error:String(e.stack||e),errors},null,2));
  console.error('P8_TRAIL_PERF_FAILURE '+(e.stack||e));
  await page.screenshot({path:path.join(out,baseline?'baseline-failure.png':'failure.png')}).catch(()=>{});
  process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
