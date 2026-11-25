// Learning activities stay mounted over one visible 3D space.
// They must not move the camera and must retain access to primary navigation.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/learning-workspace'),base='http://127.0.0.1:43827/?v=56&world=network&layout=53#space/node/mt_6_O6THdEDK';
const checks=[],errors=[],check=(value,label)=>{if(!value)throw Error(label);checks.push(label);},near=(a,b,eps=.0001)=>Math.abs(a-b)<eps;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 const layout=()=>page.evaluate(()=>{
   const panel=document.querySelector('#journey-surface'),frame=document.querySelector('#journey-frame'),lesson=frame?.contentDocument?.querySelector('#lesson'),header=panel?.querySelector(':scope > header'),r=panel.getBoundingClientRect();
   const c=(el)=>getComputedStyle(document.querySelector(el)).display;
   const childContentHeight=lesson?Math.ceil(lesson.scrollHeight):null,panelHeaderHeight=header?header.getBoundingClientRect().height:null;
   const child=frame?.contentDocument,stage=child?.querySelector('#workbench-stage');
   const shell=child?.body?.dataset.workbenchShell==='fixed';
   const fixed=!!stage&&frame.contentWindow.getComputedStyle(stage).display==='block';
   const stageHeight=fixed?stage.clientHeight:null;
   const expectedHeight=innerHeight-(innerWidth<=1100?186:188);
   return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,viewportW:innerWidth,viewportH:innerHeight,
      frame:frame.getBoundingClientRect().height,topbar:c('.topbar'),rail:c('.tool-rail'),lessonVisible:!panel.hidden,
      childContentHeight,panelHeaderHeight,shell,fixed,stageHeight,expectedHeight};
 });
 // B1 intentionally uses the available viewport rather than feedback from
 // the child's own fixed height. Preserve the original desktop/tall/short
 // scenes and the stable measured bounds check, without a circular equation.
 const waitForMeasuredPanel=()=>page.waitForFunction(()=>{
   const panel=document.querySelector('#journey-surface'),frame=document.querySelector('#journey-frame');
   const child=frame?.contentDocument,lesson=child?.querySelector('#lesson'),header=panel?.querySelector(':scope > header');
   if(!panel||!lesson||!header||panel.hidden||child.body.dataset.workbenchShell!=='fixed'||!frame.contentWindow.mathLesson)return false;
   const sample={panelHeight:panel.getBoundingClientRect().height,frameHeight:frame.getBoundingClientRect().height,headerHeight:header.getBoundingClientRect().height,viewportHeight:innerHeight};
   const key=JSON.stringify(sample);
   if(window.__learningPanelHeightSample===key)window.__learningPanelHeightStableFrames=(window.__learningPanelHeightStableFrames||0)+1;
   else{window.__learningPanelHeightSample=key;window.__learningPanelHeightStableFrames=0;}
   const reserved=innerWidth<=1100?186:188;
   const expected=sample.viewportHeight-reserved;
   return window.__learningPanelHeightStableFrames>=2&&Math.abs(sample.panelHeight-expected)<=3;
 });
 const fixedGeometry=()=>page.evaluate(()=>{
   const frame=document.querySelector('#journey-frame'),d=frame.contentDocument,w=frame.contentWindow;
   const rect=selector=>{const r=d.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};
   const stage=d.querySelector('#workbench-stage'),button=d.querySelector('#actions .primary'),r=button.getBoundingClientRect();
   const hit=d.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
   const outerReturn=document.querySelector('#journey-surface [data-action="close-journey"]'),o=outerReturn.getBoundingClientRect();
   const returnHit=document.elementFromPoint((o.left+o.right)/2,(o.top+o.bottom)/2);
   return {fixed:w.getComputedStyle(stage).display==='block',stage:rect('#workbench-stage'),header:rect('#scene .stage-top'),drawer:rect('#workbench-drawer'),command:rect('#scene .execution-command'),viewport:w.innerHeight,scrollHeight:stage.scrollHeight,clientHeight:stage.clientHeight,scrollTop:stage.scrollTop,outerScroll:w.scrollY,primaryHit:!!hit&&button.contains(hit),returnHit:!!returnHit&&outerReturn.contains(returnHit)};
 });
 const assertFixed=async label=>{
   const g=await fixedGeometry();
   check(g.fixed&&g.clientHeight>0&&g.header.bottom<=g.stage.top+1&&g.stage.bottom<=g.drawer.top+1&&g.drawer.bottom<=g.command.top+1&&g.command.bottom<=g.viewport+1,label+' fixed header, mathematical stage, drawer and command are separate, visible rows');
   check(g.primaryHit&&g.returnHit,label+' original primary and outer return are real hit targets');
   return g;
 };
 try{
  await page.goto(base);
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().selected==='node:mt_6_O6THdEDK');
  await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null);
  const before=await snap(),coords=JSON.stringify(before.positions);
  check(before.zoomEnabled===true,'knowledge selection shares panorama zoom; only the actual learning workspace hides map tools');
  await page.locator('#focus-card [data-action="open"]').first().click();
  await page.waitForFunction(()=>{
    const f=document.querySelector('#journey-frame');
    return document.body.classList.contains('has-journey')&&f.contentWindow.location.pathname.endsWith('/learn.html')&&!!f.contentDocument?.querySelector('#lesson');
  });
  const frame=page.frameLocator('#journey-frame');
  await frame.locator('#lesson').waitFor();
  const opened=await snap();
  await waitForMeasuredPanel();
  const surface=await layout();
  check(opened.cameraTween===null,'opening a lesson cancels hidden map camera motion');
  check(near(opened.cameraZoom,before.cameraZoom),'the lesson does not change the map camera zoom');
  check(opened.position.every((v,i)=>near(v,before.position[i]))&&opened.target.every((v,i)=>near(v,before.target[i])),'opening lesson preserves map camera pose');
  check(surface.lessonVisible&&surface.x>=0&&surface.y>=0&&surface.right<=surface.viewportW&&surface.bottom<=surface.viewportH,'learning surface fully fits the desktop viewport');
  check(surface.shell&&surface.fixed&&surface.h<=surface.viewportH-188+1&&surface.h>=250&&surface.frame>100,'native workbench fits the safe viewport without hiding the 3D navigation');
  const expected=surface.expectedHeight;
  check(Math.abs(surface.h-expected)<=3,`panel height matches the available viewport for the fixed workbench (actual ${surface.h}px; expected ${expected}px; lesson ${surface.childContentHeight}px; header ${surface.panelHeaderHeight}px; viewport ${surface.viewportH}px)`);
  check(surface.topbar==='flex'&&surface.rail==='flex','global navigation and spatial camera controls remain available with learning open');
  const initialFixed=await assertFixed('desktop');
  const original={x:surface.x,y:surface.y,w:surface.w,h:surface.h};
  await page.screenshot({path:path.join(out,'01-stable-learning.png')});
  // More room must expose additional content rather than leaving the panel 820px tall.
  await page.setViewportSize({width:1440,height:1450});
  await waitForMeasuredPanel();
  const tall=await layout();
  check(Math.abs(tall.h-tall.expectedHeight)<=3,
      `on a tall screen the panel expands to the available viewport, not a fixed 820px (actual ${tall.h}px; expected ${tall.expectedHeight}px)`);
  const tallFixed=await assertFixed('tall');
  check(tall.frame>surface.frame&&tallFixed.clientHeight>initialFixed.clientHeight,'more height enlarges the real mathematical stage rather than a blank or clipped outer shell');
  const lastControl=await frame.locator('#actions').evaluate(el=>({
    bottom:el.getBoundingClientRect().bottom,
    viewport:innerHeight,
    scrollHeight:document.scrollingElement.scrollHeight
  }));
  check(lastControl.bottom<=lastControl.viewport+3,
      'when the content fits on a tall screen the final activity controls are fully visible');
  await page.screenshot({path:path.join(out,'01c-full-content-tall-screen.png')});
  await page.setViewportSize({width:1440,height:900});
  await waitForMeasuredPanel();
  // Reproduce a Mac trackpad pinch. Chrome emits Ctrl+wheel inside the active iframe;
  // the app should consume that event rather than letting Chrome zoom its entire page.
  const gesture=await frame.locator('#lesson').evaluate(el=>{
    const pinch=new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-220});
    el.dispatchEvent(pinch);
    const normal=new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:220});
    el.dispatchEvent(normal);
    return {pinchBlocked:pinch.defaultPrevented,ordinaryScrollAllowed:!normal.defaultPrevented,
      ratio:devicePixelRatio,viewportScale:visualViewport?.scale??1};
  });
  check(gesture.pinchBlocked,'embedded lesson blocks trackpad-style pinch webpage zoom');
  check(gesture.ordinaryScrollAllowed,'ordinary scrolling stays enabled inside the lesson');
  const parentPinch=await page.evaluate(()=>{
    const ev=new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-180});
    document.querySelector('#journey-surface').dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  check(parentPinch,'parent overlay also blocks pinch zoom outside the learning iframe');
  const initialRatio=await page.evaluate(()=>devicePixelRatio);
  const initialScale=await page.evaluate(()=>visualViewport?.scale??1);
  const beforePinch=await layout(); // Compare with the immediate 1440×900 state, not pre-resize measurements.
  const area=await page.locator('#journey-frame').boundingBox();
  await page.mouse.move(area.x+area.width/2,area.y+Math.min(area.height/2,200));
  await page.keyboard.down('Control');
  await page.mouse.wheel(0,-250);
  await page.keyboard.up('Control');
  await page.waitForTimeout(130);
  const actual=await layout();
  const afterRatio=await page.evaluate(()=>devicePixelRatio),afterScale=await page.evaluate(()=>visualViewport?.scale??1);
  check(near(afterRatio,initialRatio)&&near(afterScale,initialScale),'actual browser Ctrl+wheel does not enlarge the document');
  check(near(beforePinch.w,actual.w,2)&&near(beforePinch.h,actual.h,2)&&near(beforePinch.x,actual.x,2)&&near(beforePinch.y,actual.y,2),`panel bounds stay unchanged after the real pinch event (before ${JSON.stringify({x:beforePinch.x,y:beforePinch.y,w:beforePinch.w,h:beforePinch.h})}, after ${JSON.stringify({x:actual.x,y:actual.y,w:actual.w,h:actual.h})})`);
  await page.screenshot({path:path.join(out,'01b-after-pinch-attempt.png')});
  // Test scrolling on a shorter screen without resizing or shifting the lesson panel.
  await page.setViewportSize({width:1280,height:620});
  const small=await layout();
  check(small.y>=0&&small.bottom<=620&&small.w<=1280,'compact learning layout remains inside a shorter viewport');
  // Keep the original short viewport case. A fixed stage scrolls inside its
  // own region; when the child is too small the original document scrolls.
  await frame.locator('#lesson').evaluate(()=>{const stage=document.querySelector('#workbench-stage');if(stage&&getComputedStyle(stage).display==='block')stage.scrollTop=stage.scrollHeight;else window.scrollTo(0,document.scrollingElement.scrollHeight);});
  const actions=await frame.locator('#actions').evaluate(el=>({
    bottom:el.getBoundingClientRect().bottom,
    view:innerHeight,at:scrollY
  }));
  check(actions.bottom<=actions.view+3,'short viewport can scroll to the complete bottom action area');
  await frame.locator('#lesson').evaluate(()=>{const stage=document.querySelector('#workbench-stage');if(stage&&getComputedStyle(stage).display==='block')stage.scrollTop=360;else window.scrollTo(0,360);});
  const scroll=await frame.locator('#lesson>header').evaluate(el=>({headerTop:el.getBoundingClientRect().top,scrollY:scrollY,viewport:innerHeight}));
  check(scroll.headerTop>=-1&&scroll.headerTop<80,'lesson status header remains visible while content scrolls');
  const outerReturn=await page.locator('#journey-surface [data-action="close-journey"]').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2));});
  check(outerReturn,'real outer return is reachable at the existing short viewport');
  await page.screenshot({path:path.join(out,'02-scrolled-learning.png')});
  await page.setViewportSize({width:1440,height:900});
  await waitForMeasuredPanel();
  const reset=await layout();
  await assertFixed('restored desktop');
  check(near(original.x,reset.x,2)&&near(original.y,reset.y,2)&&near(original.w,reset.w,2)&&near(original.h,reset.h,2),'restoring viewport restores exactly the original activity panel geometry');
  await page.locator('[data-action="close-journey"]').click();
  await page.waitForFunction(()=>!document.body.classList.contains('has-journey'));
  const returned=await snap();
  check(returned.selected==='node:mt_6_O6THdEDK','return goes back to the original mathematical knowledge point');
  check(near(returned.cameraZoom,before.cameraZoom)&&returned.position.every((v,i)=>near(v,before.position[i])),'return does not force map zoom or fly to a different group');
  check(JSON.stringify(returned.positions)===coords,'all spatial knowledge positions stay identical');
  check(errors.length===0,'browser runtime stays error-free');
  await page.screenshot({path:path.join(out,'03-return-to-knowledge.png')});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,layout:{desktop:surface,small},childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,errors}));
 }catch(err){
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(err),childTrial:false},null,2));
  console.error(err.stack);process.exitCode=1;
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
