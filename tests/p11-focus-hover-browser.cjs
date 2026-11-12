// P11 R1: real Chromium hover, unique operation focus and unobstructed map clicks.
// No URL/hash substitution for a real 3D click, no force-click, no assertion weakening.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p11-focus-hover');
const sizes=[[1440,900],[1280,720],[980,760],[620,800],[1000,1350]];
const assert=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),checks=[],errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 const nav=surface=>page.locator('.primary-nav [data-surface="'+surface+'"]');
 const record=async label=>{
  const state=await page.evaluate(async()=>{
   const {lessonForTopic}=await import('./learning/catalog.js');
   const bounds=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const labels=[...document.querySelectorAll('.space-label.node:not([hidden])')].map(el=>{
    const rect=bounds(el),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
    const hit=x>=0&&y>=0&&x<innerWidth&&y<innerHeight?document.elementFromPoint(x,y):null;
    return {key:el.dataset.key,lesson:lessonForTopic(el.dataset.key.slice(5)),rect,clickable:hit===el||el.contains(hit),
     blocker:hit?{tag:hit.tagName,id:hit.id,className:String(hit.className||'').slice(0,80)}:null};
   });
   return {viewport:[innerWidth,innerHeight],selected:mathSpace.snapshot().selected,
    surface:new URL(location.href).searchParams.get('surface')||'explore',
    active:[...document.querySelectorAll('.space-label.node.active-target:not([hidden])')].map(el=>({key:el.dataset.key,current:el.getAttribute('aria-current')})),
    map:bounds(document.querySelector('#space-app')),
    task:bounds(document.querySelector('#journey-surface')),
    contextParent:document.querySelector('#learning-map-context').parentElement.id,
    labels};
  });
  checks.push({label,...state});return state;
 };
 const image=async(label,w,h)=>page.screenshot({path:path.join(out,label+'-'+w+'x'+h+'.png')});
 const clickRealLesson=async exclude=>{
  const snapshot=await record('real-click-candidates-'+(exclude||'first'));
  const options=snapshot.labels.filter(label=>label.clickable&&label.lesson&&label.key!==snapshot.selected&&label.lesson!==exclude);
  assert(options.length>0,'no unobscured configured native node; geometry '+JSON.stringify(snapshot));
  const candidate=options[0];
  await page.locator('.space-label.node[data-key="'+candidate.key+'"]').click();
  await page.waitForFunction(key=>mathSpace.snapshot().selected===key,candidate.key);
  await page.waitForFunction(id=>{
   const frame=document.querySelector('#journey-frame');
   return !document.querySelector('#journey-surface').hidden&&
    frame.contentWindow.location.hash==='#'+id&&
    !!frame.contentDocument?.querySelector('#work');
  },candidate.lesson);
  assert(await page.frameLocator('#journey-frame').locator('#work').isVisible(),'native workpiece must be visible after actual label click');
  return candidate;
 };
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  await page.locator('[data-action="search"]').first().click();
  await page.locator('#search-input').fill('mt_ndGqFPWyen');
  await page.locator('#search-results [data-key="node:mt_ndGqFPWyen"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
  let s=await record('explore-selected');
  assert(s.active.length===1&&s.active[0].key===s.selected&&s.active[0].current==='true','Explore has one accessible active node');
  const hoverNodes=s.labels.filter(label=>label.clickable&&label.key!==s.selected).slice(0,3);
  for(const item of hoverNodes){
   await page.locator('.space-label.node[data-key="'+item.key+'"]').hover();
   const preview=await record('hover-'+item.key);
   assert(preview.selected===s.selected&&preview.active.length===1&&preview.active[0].key===s.selected,'hover cannot change operational focus');
   const newNeighbors=preview.labels.filter(label=>label.key!==item.key&&!s.labels.some(a=>a.key===label.key));
   assert(newNeighbors.length===0,'hover must not spawn new clickable neighbors: '+JSON.stringify(newNeighbors));
  }
  await page.mouse.move(2,2);
  s=await record('hover-left');
  assert(s.selected==='node:mt_ndGqFPWyen'&&s.active.length===1,'pointer leave must preserve selected object');
  for(const [w,h] of sizes){
   await page.setViewportSize({width:w,height:h});await page.waitForTimeout(160);
   const state=await record('explore-'+w+'x'+h);
   assert(state.active.length<=1,'Explore multiple strong labels '+w+'x'+h);
   if(w<=800){
    const rail=await page.locator('.tool-rail').boundingBox();
    const detail=await page.locator('#focus-card').boundingBox();
    if(rail&&detail){
     const overlap=Math.min(rail.x+rail.width,detail.x+detail.width)-Math.max(rail.x,detail.x)>0
      &&Math.min(rail.y+rail.height,detail.y+detail.height)-Math.max(rail.y,detail.y)>0;
     assert(!overlap,'compact explore controls overlap selected-node detail '+w+'x'+h);
    }
   }
   await image('explore',w,h);
  }
  await page.setViewportSize({width:1440,height:900});
  const camera=await page.evaluate(()=>mathSpace.snapshot());
  await page.locator('#focus-card [data-action="open"]').first().click();
  await page.frameLocator('#journey-frame').locator('#work').waitFor();
  await page.waitForFunction(()=>document.querySelector('#learning-map-context').parentElement.id==='journey-surface');
  s=await record('native-task-open');
  assert(s.surface==='learn'&&s.contextParent==='journey-surface','lesson card must be part of fixed task surface');
  assert(s.active.length===1&&s.active[0].key===s.selected,'Learn must have one operational node');
  const after=await page.evaluate(()=>mathSpace.snapshot());
  assert(camera.position.every((v,i)=>Math.abs(v-after.position[i])<.002),'opening workpiece never pans camera');
  const first=await clickRealLesson(null);
  const second=await clickRealLesson(first.lesson);
  assert(first.lesson!==second.lesson,'real map clicks should select different native lessons');
  for(const [w,h] of sizes){
   await page.setViewportSize({width:w,height:h});await page.waitForTimeout(160);
   const state=await record('learn-'+w+'x'+h);
   assert(state.contextParent==='journey-surface','learning context must not cover 3D map '+w+'x'+h);
   assert(state.map.width>(w>800?210:w-5),'usable 3D map width '+w+'x'+h);
   assert(state.task&&state.task.x>=-2&&state.task.y>=-2&&state.task.right<=w+2&&state.task.bottom<=h+2,'lesson panel within viewport '+w+'x'+h);
   if(w<=800){
    const rail=await page.locator('.tool-rail').boundingBox();
    assert(!rail||rail.y+rail.height<=state.task.y-6,
      'compact camera tools must stay above, not over, the learning sheet '+w+'x'+h);
   }
   assert(state.active.length<=1,'Learn duplicate strong focus '+w+'x'+h);
   await image('learn',w,h);
  }
  await page.setViewportSize({width:1440,height:900});
  await nav('trail').click();
  await page.waitForFunction(()=>document.querySelector('#utility-drawer').dataset.surface==='trail');
  s=await record('trail-after-native-task');
  assert(s.surface==='trail'&&s.selected===second.key&&s.active.length===1&&s.active[0].key===second.key,'Trail keeps operation context');
  await image('trail',1440,900);
  await nav('explore').click();
  s=await record('explore-after-trail');
  assert(s.surface==='explore'&&s.selected===second.key,'Explore maintains selected knowledge');
  await page.reload();await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  s=await record('refresh');
  assert(s.selected===second.key,'refresh preserves knowledge context');
  assert(!errors.length,'page errors: '+errors.join('; '));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:true,checks,errors,manualVerified:false},null,2));
  console.log('P11_FOCUS_HOVER_COMPLETE '+JSON.stringify({states:checks.length,viewportCount:sizes.length,realLessons:[first.lesson,second.lesson],errors}));
 }catch(error){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:false,checks,errors:[...errors,String(error)],manualVerified:false},null,2));
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  console.error('P11_FOCUS_HOVER_FAILURE '+(error.stack||error));process.exitCode=1;
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
