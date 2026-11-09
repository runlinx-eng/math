// Issue #23 P1: navigation is a task surface on the one immutable 3D panorama.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p1-navigation');
const checks=[],errors=[],check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
const key='math-explorer-v2';
const samePose=(a,b)=>Math.abs(a.cameraZoom-b.cameraZoom)<.0005&&a.position.every((v,i)=>Math.abs(v-b.position[i])<.0005)&&a.target.every((v,i)=>Math.abs(v-b.target[i])<.0005);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(String(error)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#atlas');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null&&mathSpace.motion().transition===null);
  const first=await snap();
  check(first.visibleNodes.length===537,'the original single 537-node panorama is retained');
  const sidebarFit=await page.evaluate(keys=>{
    const edge=document.querySelector('#network-guide').getBoundingClientRect().right;
    return keys.map(key=>mathSpace.project(key)).filter(p=>p?.visible&&p.x>edge+20&&p.x<innerWidth-105&&p.y>145&&p.y<innerHeight-90).length;
  },first.visibleNodes);
  check(sidebarFit>15,'initial panorama fits visible atlas beside the observation column (nodes='+sidebarFit+')');
  const current=()=>page.locator('.primary-nav [aria-pressed="true"]').getAttribute('data-surface');
  check(await current()==='explore','exploration is the active default');
  const stored=await page.evaluate(k=>localStorage.getItem(k),key);
  await page.locator('[data-action="nav-learn"]').first().click();
  check(await current()==='learn'&&await page.locator('#learning-hub').isVisible(),'learning tab opens the contextual learning entry');
  check(await page.locator('#learning-hub [data-action="learn-find"].primary-button').count()===1,'no selected topic presents one primary choose action');
  check(await page.locator('#learning-hub [data-action="resume-entry"]').count()===0,'new users are not given a false resume action');
  check(await page.locator('#learning-hub .learning-hub-more [data-action="learn-session"]').count()>0,'old routes remain available as secondary options');
  check(samePose(first,await snap()),'learning navigation does not move the camera');
  check(await page.evaluate(k=>localStorage.getItem(k),key)===stored,'navigation alone does not change the existing learning record');
  await page.screenshot({path:path.join(out,'01-learning-overview.png')});
  await page.locator('#learning-hub .learning-hub-more summary').click();
  await page.locator('#learning-hub [data-action="nav-trail"]').click();
  check(await current()==='trail'&&await page.locator('#utility-drawer').isVisible(),'footprint tab opens the old records and backup surface');
  await page.waitForFunction(()=>document.querySelector('#utility-frame')?.contentWindow?.location.hash==='#trail');
  check((await page.locator('#utility-frame').getAttribute('data-embedded-src')).includes('v2.html?embedded=1#trail'),'trail reuses old storage-compatible runner');
  check(samePose(first,await snap()),'footprint navigation keeps the camera');
  await page.screenshot({path:path.join(out,'02-footprint.png')});
  await page.locator('.primary-nav [data-action="nav-explore"]').click();
  check(await current()==='explore'&&await page.locator('#utility-drawer').isHidden(),'exploration returns to the map without an overview refit');
  check(samePose(first,await snap()),'returning to the map preserves camera');
  await page.locator('.top-tools [data-action="search"]').click();
  await page.locator('#search-input').fill('分数');
  check(await page.locator('#search-results [data-action="choose"]').count()>0,'original global search remains accessible');
  await page.locator('#search-popover [data-action="close-popover"]').click();
  // Select directly through an existing route; hash and camera must keep their semantics.
  await page.evaluate(()=>{location.hash='#space/node/mt_ndGqFPWyen';});
  await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_ndGqFPWyen');
  const focused=await snap();
  check(samePose(first,focused),'node selection does not change camera pose');
  const card=page.locator('#focus-card');
  check(await card.locator('.focus-section-nav button').count()===3,'knowledge context has three task-aligned sections');
  check(await card.locator('[data-context-section="understand"]').count()===1&&await card.locator('[data-context-section="relations"] .network-relations').count()===1,'understanding and original direct relations remain');
  check(await card.locator('[data-context-section="relations"] .network-relations').getAttribute('open')!==null,'direct relations remain expanded by default');
  await card.locator('[data-action="focus-section"][data-section="learn"]').click();
  check(await card.locator('[data-context-section="learn"]').count()===1,'learning section remains accessible without losing content');
  const viewBefore=await snap();
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().journeyOpen);
  check(await page.locator('#learning-hub').isHidden(),'selected configured node bypasses the route chooser');
  check((await page.locator('#journey-frame').getAttribute('src')).includes('learn.html#share'),'selected node opens its real source lesson');
  check(samePose(viewBefore,await snap()),'learning tab from a node leaves camera unchanged');
  await page.screenshot({path:path.join(out,'03-selected-node-learning.png')});
  await page.waitForFunction(()=>document.body.classList.contains('has-journey')&&document.querySelector('#journey-frame').getAttribute('src').includes('learn.html'));
  check(await page.locator('#journey-surface').isVisible(),'existing learning iframe opens unchanged');
   check((await page.locator('#journey-surface [data-action="close-journey"]').innerText()).includes('返回知识空间'),'lesson close always names the same destination');
  check(samePose(viewBefore,await snap()),'starting learning does not refit the map');
  await page.locator('#journey-surface [data-action="close-journey"]').click();
  await page.waitForFunction(()=>!document.body.classList.contains('has-journey'));
  check(samePose(viewBefore,await snap()),'closing lesson returns to saved map pose');
   check(await current()==='explore'&&await page.locator('#learning-hub').isHidden(),'closing a lesson from the learning entry returns to the same map, not a second learning panel');
   check(new URL(page.url()).searchParams.get('surface')===null,'lesson close clears the work-surface URL without changing knowledge selection');
  await page.locator('#focus-card [data-action="deselect"]').click();
  check((await snap()).selected===null,'clearing the selection restores the neutral learning start');
  // Three target viewport sizes. The nav must stay reachable without horizontal overflow.
  for(const [width,height] of [[1440,900],[980,760],[1280,720]]){
    await page.setViewportSize({width,height});
    const measure=await page.evaluate(()=>{
      const nav=document.querySelector('.primary-nav').getBoundingClientRect();
      const tools=document.querySelector('.top-tools').getBoundingClientRect();
      const hub=document.querySelector('#learning-hub').getBoundingClientRect();
      return {nav:{left:nav.left,right:nav.right,top:nav.top,bottom:nav.bottom},tools:{left:tools.left,right:tools.right},hub:{left:hub.left,right:hub.right}};
    });
    check(measure.nav.left>=0&&measure.nav.right<=width&&measure.tools.right<=width,'main navigation fits '+width+'x'+height);
    await page.locator('.primary-nav [data-action="nav-learn"]').click();
    const bounds=await page.locator('#learning-hub').boundingBox();
    check(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width&&bounds.y+bounds.height<=height,'learning hub fits '+width+'x'+height);
    await page.screenshot({path:path.join(out,'04-'+width+'x'+height+'.png')});
    await page.locator('.primary-nav [data-action="nav-explore"]').click();
  }
  // P1-B: browser history, refresh, Escape, grade/camera preservation.
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  check(new URL(page.url()).searchParams.get('surface')==='learn','learning tab creates a distinct URL');
  await page.goBack();
  await page.waitForFunction(()=>document.querySelector('.primary-nav [aria-pressed="true"]')?.dataset.surface==='explore');
  check(await page.locator('#learning-hub').isHidden(),'Back restores exploration');
  await page.goForward();
  await page.waitForFunction(()=>document.querySelector('.primary-nav [aria-pressed="true"]')?.dataset.surface==='learn');
  check(await page.locator('#learning-hub').isVisible(),'Forward reopens learning');
  await page.waitForTimeout(450);
  await page.reload();
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  await page.waitForFunction(()=>document.querySelector('.primary-nav [aria-pressed="true"]')?.dataset.surface==='learn');
  check(await page.locator('#learning-hub').isVisible(),'refresh retains learning task');
  await page.locator('#learning-hub .learning-hub-more summary').click();
  await page.locator('#learning-hub [data-action="nav-trail"]').click();
  check(new URL(page.url()).searchParams.get('surface')==='trail','footprint uses a distinct task URL');
  // A same-document history step can update the surface before SW navigation 'load'.
  await page.evaluate(()=>history.back());
  await page.waitForFunction(()=>document.querySelector('.primary-nav [aria-pressed="true"]')?.dataset.surface==='learn');
  check(await page.locator('#utility-drawer').isHidden()&&await page.locator('#learning-hub').isVisible(),'Back from footprint reopens learning');
  await page.locator('#learning-hub [data-action="close-learning-hub"]').click();
  check(new URL(page.url()).searchParams.get('surface')===null&&await page.locator('#learning-hub').isHidden(),'explicit close clears task URL');
  await page.locator('.primary-nav [data-action="nav-trail"]').click();
  await page.locator('#utility-drawer [data-action="close-utility"]').click();
  check(await page.locator('#utility-drawer').isHidden()&&new URL(page.url()).searchParams.get('surface')===null,'footprint close returns to exploration');
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  await page.keyboard.press('Escape');
  check(await page.locator('#learning-hub').isHidden()&&new URL(page.url()).searchParams.get('surface')===null,'Escape closes active task');
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  await page.locator('.top-tools [data-action="search"]').click();
  check(await page.locator('#search-popover').isVisible()&&await page.locator('#learning-hub').isHidden(),'search remains visible when invoked from learning');
  await page.keyboard.press('Escape');
  check(await page.locator('#search-popover').isHidden(),'Escape dismisses search first');
  await page.locator('[data-action="grade-map-stage"][data-stage="stage-2"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().gradeStageFilter==='stage-2');
  const stagePose=await snap();
  await page.locator('.primary-nav [data-action="nav-learn"]').click();
  await page.locator('.primary-nav [data-action="nav-explore"]').click();
  check(samePose(stagePose,await snap())&&(await snap()).gradeStageFilter==='stage-2','task switching preserves grade and camera');
  await page.locator('[data-action="grade-map-stage"][data-stage="all"]').click();
  for(const [width,height] of [[1440,900],[980,760],[1280,720]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const bounds=await page.evaluate(()=>{
      const r=s=>document.querySelector(s).getBoundingClientRect();
      const g=r('#network-guide'),rail=r('.tool-rail'),nav=r('.topbar'),card=r('#focus-card');
      return {g:{x:g.x,y:g.y,right:g.right,bottom:g.bottom},rail:{x:rail.x,y:rail.y},nav:{bottom:nav.bottom},card:{x:card.x,y:card.y,bottom:card.bottom,visible:getComputedStyle(document.querySelector('#focus-card')).visibility!=='hidden'}};
    });
    check(bounds.g.x>=0&&bounds.g.bottom<=height&&(bounds.g.right<bounds.rail.x||bounds.g.bottom<=bounds.rail.y+4),'observation and camera tools separate '+width+'x'+height);
    check(bounds.g.y>=bounds.nav.bottom-4,'observation remains below top navigation '+width+'x'+height);
    if(bounds.card.visible)check(bounds.card.x>=bounds.g.right-2&&bounds.card.bottom<=height,'knowledge detail avoids observation column '+width+'x'+height+' '+JSON.stringify(bounds));
    await page.screenshot({path:path.join(out,'05-p1b-map-'+width+'x'+height+'.png')});
  }
  check(!errors.length,'no uncaught browser page errors: '+errors.join('; '));
  console.log(JSON.stringify({status:'pass',checks,screenshots:out},null,2));
 }catch(err){console.error(JSON.stringify({status:'fail',checks,error:String(err),pageErrors:errors},null,2));process.exitCode=1;}
 finally{await browser.close();}
})();
