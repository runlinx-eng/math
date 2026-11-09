// Continuous-space contract: selection, camera, learn/trail surfaces and evidence.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const output=path.resolve(__dirname,'../verification/continuous-space');
const checks=[],errors=[],assert=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
const equalCamera=(a,b)=>a.cameraZoom===b.cameraZoom&&a.position.every((x,i)=>Math.abs(x-b.position[i])<.002)&&a.target.every((x,i)=>Math.abs(x-b.target[i])<.002);
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(String(error)));
 const snapshot=()=>page.evaluate(()=>mathSpace.snapshot());
 const lesson=page.frameLocator('#journey-frame');
 try{
   await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space');
   await page.waitForFunction(()=>window.mathSpace?.snapshot().visibleNodes.length===537);
   const initial=await snapshot();
   assert(initial.counts.nodes===587&&initial.counts.edges===1223,'source graph and coordinates available');
   const nodes=await page.evaluate(async()=>{const a=await (await fetch('./data/atlas.json')).json();return a.nodes.slice(0,2).map(n=>n.id);});
   for(const id of nodes){
     await page.evaluate(id=>location.hash='#space/node/'+id,id);
     await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,id);
     assert(equalCamera(initial,await snapshot()),'direct knowledge selection never moves camera '+id);
   }
   await page.locator('#focus-card [data-action="deselect"]').click();
   assert((await snapshot()).selected===null&&equalCamera(initial,await snapshot()),'deselect clears knowledge without a camera reset');
   // A real configured lesson is resumed without reloading its iframe.
   await page.evaluate(()=>location.hash='#space/node/mt_ndGqFPWyen');
   await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
   const before=await snapshot();
   await page.locator('#focus-card [data-action="open"]').first().click();
   await lesson.locator('#p3-learning-flow').waitFor();
   const originalDocument=await page.evaluate(()=>{const f=document.querySelector('#journey-frame');f.contentWindow.__continuousProbe={created:Date.now()};return f.contentWindow.__continuousProbe;});
   assert(await page.locator('.primary-nav [data-action="nav-trail"]').isVisible(),'trail navigation remains visible over current learning workspace');
   await page.locator('.primary-nav [data-action="nav-trail"]').click();
   await page.waitForFunction(()=>mathSpace.snapshot().journeySuspended&&document.querySelector('#utility-drawer')?.hidden===false);
   assert(await page.locator('#journey-surface').isHidden(),'learn activity is suspended, not discarded, on trail');
   await page.waitForFunction(()=>document.querySelector('#utility-frame').contentWindow.location.hash==='#trail');
   assert(await page.locator('#utility-drawer').isVisible(),'trail appears over the shared space');
   await page.locator('.primary-nav [data-action="nav-explore"]').click();
   assert((await snapshot()).journeySuspended,'exploration does not unload suspended lesson');
   assert(equalCamera(before,await snapshot()),'learn → trail → explore retains camera');
   await page.locator('.primary-nav [data-action="nav-learn"]').click();
   await page.waitForFunction(()=>mathSpace.snapshot().journeyOpen&&!mathSpace.snapshot().journeySuspended);
   assert(await page.evaluate(()=>!!document.querySelector('#journey-frame').contentWindow.__continuousProbe),'lesson iframe document persists across three workspaces');
   const snap=await snapshot();
   assert(snap.selected===before.selected&&equalCamera(before,snap),'resume restores same selected concept and camera');
   for(const [w,h] of [[1440,900],[980,760],[1280,720]]){
     await page.setViewportSize({width:w,height:h});
     const b=await page.locator('#journey-surface').boundingBox();
     assert(b&&b.x>=-2&&b.y>=-2&&b.x+b.width<=w+2&&b.y+b.height<=h+2,'learning workspace fits '+w+'x'+h);
     assert(await page.locator('.primary-nav [data-action="nav-explore"]').isVisible(),'global navigation available '+w+'x'+h);
     await page.screenshot({path:path.join(output,'learn-'+w+'x'+h+'.png')});
   }
   await page.keyboard.press('Escape');
   assert((await snapshot()).journeySuspended,'Esc suspends rather than destroys lesson');
   await page.keyboard.press('Escape');
   assert((await snapshot()).selected===null,'second Esc clears knowledge selection');
   await page.locator('.primary-nav [data-action="nav-learn"]').click();
   assert((await snapshot()).journeyOpen&&!(await snapshot()).journeySuspended,'learning remains resumable after Esc');
   await page.locator('#journey-surface [data-action="close-journey"]').click();
   assert(!(await snapshot()).journeyOpen,'explicit close completes the workspace lifecycle');
    assert(new URL(page.url()).searchParams.get('surface')===null,'close always returns to the knowledge-space surface');
    assert(await page.locator('.primary-nav [data-action="nav-explore"]').getAttribute('aria-pressed')==='true','close has one destination, independent of how learning was opened');
   assert(!errors.length,'no uncaught browser errors');
   fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify({checks,errors,manualReview:false},null,2));
   console.log('Continuous 3D checks: '+checks.length+' passed');
 }catch(error){
   console.error(error.stack);
   fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:String(error),checks,errors},null,2));
   await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
   process.exitCode=1;
 }finally{await browser.close();}
})();
