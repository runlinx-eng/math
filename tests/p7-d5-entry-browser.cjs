// P7-D5: test the actual task surface and main CTA, not only event handlers.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p7-d5');
const checks=[],errors=[];
const check=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
const base='http://127.0.0.1:43827/';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 const nav=()=>page.locator('.primary-nav [data-action="nav-learn"]');
 const frame=page.frameLocator('#journey-frame');
 const open=async(id='mt_ndGqFPWyen')=>{
   await page.goto(base+'?world=network&layout=53#space/node/'+id);
   await page.waitForFunction(id=>window.mathSpace?.snapshot().selected==='node:'+id,id);
 };
 const stable=(a,b)=>a.position.every((x,i)=>Math.abs(x-b.position[i])<.002)&&a.target.every((x,i)=>Math.abs(x-b.target[i])<.002)&&Math.abs(a.cameraZoom-b.cameraZoom)<.002;
 try{
   // Fresh selected node: direct content, no route menu.
   await open();const before=await snap();
   await nav().click();await frame.locator('#instruction').waitFor();
   check(await page.locator('#learning-hub').isHidden(),'selected node goes straight to a task');
   check((await page.locator('#journey-frame').getAttribute('src')).includes('#share'),'current source node decides source lesson');
   check((await frame.locator('#instruction').innerText()).length>0,'real mathematics question is displayed');
   check(await frame.locator('#work').isVisible(),'real mathematics widget is displayed');
   check(await frame.locator('#actions button.primary').count()===1,'only one main lesson action');
   check(stable(before,await snap()),'camera remains unchanged');
   await page.screenshot({path:path.join(out,'01-selected-direct-1440x900.png')});
   await page.locator('#journey-surface [data-action="close-journey"]').click();
   check((await snap()).selected===before.selected&&stable(before,await snap()),'close preserves selected source and pose');
   // Different explicitly selected topic must beat another saved unfinished lesson.
   await page.evaluate(async()=>{const {freshLesson}=await import('./learning/state.js');const s=JSON.parse(localStorage.getItem('math-explorer-v2'));s.lessons.share=freshLesson('share');s.lessons.share.draft='之前写下的草稿';localStorage.setItem('math-explorer-v2',JSON.stringify(s));});
   await open('mt_Ep7TDFuYUa');await nav().click();await frame.locator('#instruction').waitFor();
   check((await page.locator('#journey-frame').getAttribute('src')).includes('#equivalent'),'selected equivalent fractions beats unrelated unfinished share');
   await page.screenshot({path:path.join(out,'02-selection-beats-history.png')});
   await page.locator('#journey-surface [data-action="close-journey"]').click();
   // No selection with a real draft: exactly one resume CTA.
   await page.locator('#focus-card [data-action="deselect"]').click();
   await nav().click();await page.locator('#learning-hub').waitFor();
   check(await page.locator('#learning-hub [data-action="resume-entry"].primary-button').count()===1,'real saved work gives one resume CTA');
   check(await page.locator('#learning-hub .learning-hub-more').count()===1,'routes remain secondary');
   await page.screenshot({path:path.join(out,'03-real-resume.png')});
   await page.locator('#learning-hub [data-action="resume-entry"]').click();await frame.locator('#instruction').waitFor();
   check((await page.locator('#journey-frame').getAttribute('src')).includes('#share'),'resume opens the saved original lesson');
   check((await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.share.draft))==='之前写下的草稿','saved draft survives entering');
   await page.locator('#journey-surface [data-action="close-journey"]').click();
   // No work: no random lesson, only a knowledge selection action.
   await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('math-explorer-v2'));s.lessons={};s.daily.bridges={};s.daily.questions=[];s.daily.continuation=null;localStorage.setItem('math-explorer-v2',JSON.stringify(s));});
   await page.goto(base+'?world=network&layout=53#atlas');
   await page.waitForFunction(()=>window.mathSpace?.snapshot().selected===null);
   await nav().click();
   check(await page.locator('#learning-hub [data-action="learn-find"].primary-button').count()===1,'no state offers one choose-knowledge CTA');
   check(await page.locator('#learning-hub [data-action="resume-entry"]').count()===0,'no false resume CTA');
   await page.screenshot({path:path.join(out,'04-no-selection.png')});
   await page.locator('#learning-hub [data-action="learn-find"].primary-button').click();
   check(await page.locator('#search-popover').isVisible(),'choose knowledge opens the existing search');
   await page.locator('#search-popover [data-action="close-popover"]').click();
   // The no-activity state is explicit and has no fake start task.
   const unavailable=await page.evaluate(async()=>{
     const atlas=await(await fetch('./data/atlas.json')).json();
     const {lessonForTopic}=await import('./learning/catalog.js');
     const {ACTIVITIES,activityIds}=await import('./exploration-content.js');
     const {routeStep}=await import('./journey-model.js');
     return atlas.nodes.find(n=>!lessonForTopic(n.id)&&!routeStep(n.id)&&!activityIds.some(id=>ACTIVITIES[id].topicId===n.id))?.id;
   });
   check(!!unavailable,'an actual node with no configured independent activity exists');
   await page.evaluate(id=>location.hash='#space/node/'+id,unavailable);
   await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,unavailable);
   await nav().click();
   check(await page.locator('#learning-hub').isVisible(),'non-runnable node does not open an invalid iframe');
   check((await page.locator('#learning-hub').innerText()).includes('没有独立的数学操作活动'),'explains unavailable independent activity');
   check(await page.locator('#learning-hub [data-action="learn-session"].primary-button').count()===0,'no fabricated start button');
   await page.screenshot({path:path.join(out,'05-no-activity.png')});
   await page.locator('#learning-hub [data-action="close-learning-hub"]').last().click();
   // Two desktop sizes: genuine first task action fits within embedded viewport.
   for(const [w,h] of [[1280,720],[1440,900]]){
     await page.setViewportSize({width:w,height:h});await open();await nav().click();
     await frame.locator('#actions button.primary').waitFor();
     const bounds=await page.evaluate(()=>{
       const frame=document.querySelector('#journey-frame'),d=frame.contentDocument,primary=d.querySelector('#actions button.primary'),r=primary?.getBoundingClientRect();
       return {bottom:r?.bottom||Infinity,viewport:frame.contentWindow.innerHeight};
     });
     check(bounds.bottom<=bounds.viewport+2,'primary mathematics action visible in '+w+'x'+h+' frame: '+JSON.stringify(bounds));
     await page.screenshot({path:path.join(out,'06-direct-'+w+'x'+h+'.png')});
     await page.locator('#journey-surface [data-action="close-journey"]').click();
   }
   check(!errors.length,'no uncaught page errors: '+errors.join(','));
   fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors,macVerified:false,childVerified:false},null,2));
   console.log('P7-D5 Chromium '+checks.length+' checks passed');
 }catch(error){console.error(error.stack);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({checks,errors,error:String(error)},null,2));await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});process.exitCode=1;}
 finally{await browser.close();}
})();
