// Issue #30 P6-B: real Chromium layout, continuity and evidence order.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const output=path.resolve(__dirname,'../verification/p6b-layout');
const sizes=[[1440,900],[980,760],[1280,720],[1000,1350],[1024,1365]];
const checks=[],errors=[],assert=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name);};
const equalCamera=(a,b)=>a.cameraZoom===b.cameraZoom&&a.position.every((x,i)=>Math.abs(x-b.position[i])<.002)&&a.target.every((x,i)=>Math.abs(x-b.target[i])<.002);
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(String(error)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 const boxes=()=>page.evaluate(()=>{
   const rect=id=>{const el=document.querySelector(id);if(!el||el.hidden||getComputedStyle(el).visibility==='hidden')return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
   return {guide:rect('#network-guide'),card:rect('#focus-card'),hub:rect('#learning-hub'),learn:rect('#journey-surface'),trail:rect('#utility-drawer'),rail:rect('.tool-rail'),nav:rect('.topbar')};
 });
 try{
   await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space');
   await page.waitForFunction(()=>window.mathSpace?.snapshot().visibleNodes.length===537);
   await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null);
   const initial=await snap();
   assert(initial.counts.nodes===587&&initial.counts.edges===1223,'source graph intact');
   for(const [w,h] of sizes){
     await page.setViewportSize({width:w,height:h});
     await page.waitForTimeout(110);
     const b=await boxes();
     assert(b.guide&&b.guide.x>=0&&b.guide.bottom<h-55,'observation controls fit '+w+'x'+h);
     assert(b.rail&&b.rail.x>=0&&b.rail.right<=w+2,'camera toolbar fits '+w+'x'+h);
     await page.screenshot({path:path.join(output,'explore-'+w+'x'+h+'.png')});
   }
   await page.setViewportSize({width:1440,height:900});
   await page.evaluate(()=>location.hash='#space/node/mt_ndGqFPWyen');
   await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
   assert(equalCamera(initial,await snap()),'select knowledge does not move camera');
   const selected=await boxes();
   assert(selected.card&&selected.card.right<=1440&&selected.card.bottom<=900&&selected.card.x>selected.guide.right,'knowledge card docks consistently to right and clears observation controls');
   await page.locator('#focus-card [data-action="focus-section"][data-section="relations"]').click();
   assert(equalCamera(initial,await snap()),'relation context navigation does not move camera');
   const related=page.locator('#focus-card .network-relations [data-action="choose"]').first();
   if(await related.count()){
      await related.click();
      assert(equalCamera(initial,await snap()),'switching related knowledge does not move camera');
   }
   await page.locator('#focus-card [data-action="deselect"]').click();
   assert((await snap()).selected===null&&equalCamera(initial,await snap()),'deselect preserves camera');
   // Produce valid, distinct saved evidence, draft and untouched states.
   await page.evaluate(async()=>{
     const {fresh}=await import('./exploration-core.js');
     const {freshLesson,addLessonNote}=await import('./learning/state.js');
     const {lessonIds}=await import('./learning/catalog.js');
     const state=fresh(),ids=lessonIds.slice(0,3);
     state.lessons[ids[0]]=freshLesson(ids[0]);addLessonNote(state.lessons[ids[0]],'实际保存的学习解释');
     state.lessons[ids[1]]=freshLesson(ids[1]);state.lessons[ids[1]].draft='没有提交的草稿';
     state.lessons[ids[2]]=freshLesson(ids[2]);
     localStorage.setItem('math-explorer-v2',JSON.stringify(state));
     window.__p6bIds=ids;
   });
   await page.reload();
   await page.waitForFunction(()=>window.mathSpace?.snapshot().visibleNodes.length===537);
   await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null);
   const baseline=await snap();
   await page.evaluate(()=>location.hash='#space/node/mt_ndGqFPWyen');
   await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
   await page.locator('#focus-card [data-action="open"]').first().click();
   await page.frameLocator('#journey-frame').locator('#p3-learning-flow').waitFor();
   const beforeLearn=await snap();
   assert(equalCamera(baseline,beforeLearn),'opening learning workspace preserves camera');
   for(const [w,h] of sizes){
     await page.setViewportSize({width:w,height:h});
     await page.waitForTimeout(100);
     const b=await boxes();
     assert(b.learn&&b.learn.x>=0&&b.learn.right<=w+2&&b.learn.bottom<=h+2,'learning stays inside viewport '+w+'x'+h);
     assert(b.learn.width<=w*.54,'learning leaves at least 46% for map '+w+'x'+h);
     assert(b.nav&&b.nav.bottom<b.learn.y,'learning clears top navigation '+w+'x'+h);
     await page.screenshot({path:path.join(output,'learn-'+w+'x'+h+'.png')});
   }
   await page.locator('.primary-nav [data-action="nav-trail"]').click();
   await page.waitForFunction(()=>document.querySelector('#utility-frame')?.contentWindow?.location.hash==='#trail');
   const trail=page.frameLocator('#utility-frame');
   await trail.locator('[data-trail-tier="evidence"] [data-lesson-record]').first().waitFor();
   assert(await trail.locator('[data-trail-tier="evidence"] [data-lesson-record]').count()===1,'actual saved explanation appears in evidence');
   assert(await trail.locator('[data-trail-tier="draft"] [data-lesson-record]').count()===1,'draft session separated from submitted work');
   assert(await trail.locator('[data-trail-tier="available"] [data-lesson-record]').count()===1,'untouched session only in collapsed available list');
   assert(await trail.locator('.trail-available').getAttribute('open')===null,'untouched sessions collapsed by default');
   for(const [w,h] of sizes){
     await page.setViewportSize({width:w,height:h});
     await page.waitForTimeout(110);
     const b=await boxes();
     assert(b.trail&&b.trail.x>=0&&b.trail.right<=w+2&&b.trail.bottom<=h+2,'trail stays inside viewport '+w+'x'+h);
     assert(b.trail.width<=w*.54,'trail leaves space visible '+w+'x'+h);
     await page.screenshot({path:path.join(output,'trail-'+w+'x'+h+'.png')});
   }
   await page.setViewportSize({width:1440,height:900});
   assert(equalCamera(baseline,await snap()),'learn → trail preserves camera');
   await page.locator('.primary-nav [data-action="nav-learn"]').click();
   await page.waitForFunction(()=>mathSpace.snapshot().journeyOpen&&!mathSpace.snapshot().journeySuspended);
   assert(equalCamera(baseline,await snap()),'return to suspended lesson preserves camera');
   await page.keyboard.press('Escape');
   assert((await snap()).journeySuspended,'Esc suspends current activity without unloading');
   await page.goBack();
   await page.waitForTimeout(100);
   assert((await snap()).counts.edges===1223,'browser history retains source graph');
   assert(!errors.length,'no uncaught errors');
   fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify({checks,errors,screenshots:sizes.flatMap(([w,h])=>['explore','learn','trail'].map(mode=>mode+'-'+w+'x'+h+'.png')),manualVisualApproval:false},null,2));
   console.log('P6-B Chromium layout checks: '+checks.length+' passed');
 }catch(error){
   console.error(error.stack);
   fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:String(error),checks,errors},null,2));
   await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
   process.exitCode=1;
 }finally{await browser.close();}
})();
