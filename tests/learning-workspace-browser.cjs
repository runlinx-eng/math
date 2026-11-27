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
 }finally{
   await context.close();
   try{
     // Opt in only from B preview. The historical required-matrix command
     // still runs its original V53 responsive checks and artifacts unchanged.
     if(!process.exitCode&&process.env.MATH_V54_LAYOUT_DIAGNOSTICS==='1'){
       await verifyV54CompactLayout(browser);
       await verifyV54EntryLayout(browser);
       await verifyV54QuietExploration(browser);
       await verifyV54MacJoint(browser);
     }
   }finally{await browser.close();}
 }
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

// Mac 02: extend the existing grandfathered responsive workbench suite,
// not the new fixed-desktop browser entrypoints. The old scenario is
// unchanged; each opt-in case uses its own real native V54 browser context.
// Never replace the original #239 1920x1080 checks or change their policy.
async function verifyV54CompactLayout(browser){
 const assert=require('node:assert/strict');
 const base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
 const dir=path.resolve('verification/v54-workbench-layout');
 const topic='mt_-c4Ca_nBzX',session='chancefraction';
 const requiredFields=['kind','prob','answers.0'];
 fs.mkdirSync(dir,{recursive:true});const result={passed:false,rows:[],testedCheckoutSha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'opt-in legacy responsive workbench extension; standard 1920x1080 gates unchanged'};
  try{
   for(const [width,height,probability] of [[1440,900,true],[1280,720,true],[959,900,false],[960,900,false],[1000,1200,false]]){
    const viewport={width,height},ctx=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const row={viewport,probability,errors,passed:false};result.rows.push(row);
    const shot=name=>page.screenshot({path:path.join(dir,width+'x'+height+'-'+name+'.png')});
    try{
     await page.goto(base+'/index.html?world=network&layout=54&surface=learn#space/node/'+topic);
     await page.waitForFunction(id=>{
       const child=document.querySelector('#journey-frame').contentWindow;
       return window.mathSpace?.snapshot()?.networkVersion===54&&document.body.dataset.workbenchForeground==='learn'&&child.mathLesson?.snapshot()?.id===id&&child.document.body.dataset.workbenchLayout==='compact-v54'&&child.document.querySelector('#workbench-curriculum')?.dataset.state!=='loading'&&child.document.querySelector('#storage-warning')?.hidden;
     },session,{timeout:60000});
     const frame=page.frameLocator('#journey-frame');
     const measure=()=>page.evaluate(fields=>{
       const panel=document.querySelector('#journey-surface'),frame=document.querySelector('#journey-frame'),doc=frame.contentDocument;
       const rect=el=>{const {x,y,width,height,right,bottom}=el.getBoundingClientRect();return {x,y,width,height,right,bottom};};
       const p=rect(panel),f=rect(frame),s=rect(doc.querySelector('#workbench-stage')),work=rect(doc.querySelector('#work')),command=rect(doc.querySelector('.execution-command')),drawer=rect(doc.querySelector('#workbench-drawer')),topbar=rect(document.querySelector('.topbar'));
       const fieldRects=fields.map(field=>{
         const el=doc.querySelector('#extra-controls [data-xfield="'+field+'"]');
         if(!el)return {field,missing:true};
         const r=rect(el),label=rect(el.closest('label')),x=r.x+r.width/2,y=r.y+r.height/2;
         const points=[[x,y],[r.x+3,r.y+3],[r.right-3,r.bottom-3]];
         return {field,rect:r,label,labelText:el.closest('label').textContent.trim(),enabled:!el.disabled,hit:points.every(([cx,cy])=>el===doc.elementFromPoint(cx,cy)||el.contains(doc.elementFromPoint(cx,cy))),parentHit:document.elementFromPoint(f.x+x,f.y+y)===frame,visible:label.x>=s.x-1&&label.right<=s.right+1&&label.y>=s.y-1&&label.bottom<=s.bottom+1&&r.bottom<=drawer.y+1&&r.bottom<=command.y+1&&r.bottom<=frame.contentWindow.innerHeight};
       });
       const map=rect(document.querySelector('#space-app'));
       const headingParts={outer:rect(panel.querySelector(':scope>header')),inner:rect(doc.querySelector('#lesson>header')),title:rect(doc.querySelector('.stage-top')),problem:rect(doc.querySelector('#learning-problem')),interaction:rect(doc.querySelector('#learning-interaction'))};
       const headingText=['#title','#workbench-curriculum','#instruction','#action-cue'].map(selector=>{
         const el=doc.querySelector(selector);
         return {selector,rect:rect(el),text:el.textContent.trim(),unclipped:el.clientHeight>0&&el.clientWidth>0&&el.scrollHeight<=el.clientHeight+1&&el.scrollWidth<=el.clientWidth+1};
       });
       return {panel:p,frame:f,stage:s,work,drawer,command,topbar,map,headingParts,headingText,ratio:p.width/innerWidth,headingHeight:f.y-p.y+work.y,childViewport:{width:frame.contentWindow.innerWidth,height:frame.contentWindow.innerHeight},scroll:doc.querySelector('#workbench-stage').scrollTop,fields:fieldRects,contextClosed:!document.querySelector('#workbench-context-menu').open,questionCopies:[...document.querySelectorAll('.save-status [data-action="question"]')].filter(e=>e.getClientRects().length).length,guideInWork:!!doc.querySelector('#work #thinking-guide'),guideInDrawer:!!doc.querySelector('#learning-support-drawer-panel #thinking-guide'),goalInDrawer:!!doc.querySelector('#learning-support-drawer-panel #learning-goal')};
     },requiredFields);
     const m=await measure();row.initial=m;
     assert.ok(m.panel.x>=0&&m.panel.y>=m.topbar.bottom-1&&m.panel.right<=width+1&&m.panel.bottom<=height+1,'fixed panel fits below top navigation: '+JSON.stringify(m.panel));
     if(width>=960){assert.ok(m.ratio>=.68&&m.ratio<=.72,'desktop 68–72% width, '+m.ratio);assert.ok(m.map.right<=m.panel.x+1,'actual map is separately reserved');}
     else assert.ok(m.ratio>=.94&&m.panel.x<=12.5,'narrow viewport full-width panel');
     assert.ok(m.contextClosed&&m.questionCopies===0&&m.goalInDrawer&&!m.guideInWork,'default optional details do not occupy the main stage');
     await shot('initial');
     if(probability){
      assert.equal(m.scroll,0,'first screen must not rely on scrolling');
      assert.ok(m.headingHeight<=220,'whole heading budget from panel top to work <=220 CSS px: '+m.headingHeight);
      assert.ok(m.headingText.every(h=>h.text&&h.unclipped),'title, curriculum, real problem and action cue must remain readable, not clipped: '+JSON.stringify(m.headingText));
      assert.equal(await frame.locator('#extra-controls .b22-controls > .field :is(input,select)').count(),3,'exact original required fields');
      assert.ok(m.fields.every(f=>!f.missing&&f.enabled&&f.visible&&f.hit&&f.parentHit),'all original input/label rectangles and actual hit targets visible above drawer and command: '+JSON.stringify(m.fields));
      assert.ok(m.fields[2].labelText.includes('一共几个等可能的面'));
      assert.ok(m.guideInDrawer,'the original admitted optional thinking question is available in the existing drawer');
      const summary=page.locator('#workbench-context-menu>summary');
      await summary.click();assert.ok(await page.locator('#learning-map-context').isVisible());
      assert.ok(await page.locator('#learning-map-context [data-source-key]').count()>0,'real source links preserved');
      const open=await measure();assert.deepEqual(open.frame,m.frame,'context disclosure does not shrink iframe');
      await shot('source-context');
      await summary.press('Escape');
      await page.waitForFunction(()=>!document.querySelector('#workbench-context-menu').open);
      const readCase=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.chancefraction.cases[0]??null);
      const beforeAux=await readCase();
      await frame.locator('#learning-support>summary').click();
      assert.ok(await frame.locator('#thinking-guide>summary').isVisible(),'optional question remains reachable');
      assert.deepEqual(await readCase(),beforeAux,'opening the support drawer alone must not record support or an attempt');
      // Check the original delegated support event in one context and keep
      // the other context independent. Neither opening a drawer nor moving a
      // DOM node generates a mathematical submission.
      if(width===1440){
        await frame.locator('#thinking-guide>summary').click();
        await page.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.chancefraction.cases[0]?.support===true);
        assert.equal((await readCase()).attempts.length,0,'opening the actual thinking guide retains its original support event only');
      }
      await shot('auxiliary');
      await frame.locator('#learning-support>summary').press('Escape');
      await page.waitForFunction(()=>!document.querySelector('#journey-frame').contentDocument.querySelector('#workbench-stage').inert);
      const after=await measure();assert.equal(after.scroll,0);assert.ok(after.fields.every(f=>f.visible&&f.hit&&f.parentHit),'closing drawers returns real initial inputs');
      // The real original first task, not a mocked submission or seeded state.
      await frame.locator('#extra-visual [data-x="p22-toggle"][data-index="5"]').click();
      await frame.locator('#extra-controls [data-xfield="kind"]').selectOption('equal');
      await frame.locator('#extra-controls [data-xfield="prob"]').fill('1/6');
      await frame.locator('#extra-controls [data-xfield="answers.0"]').fill('6');
      await frame.locator('#actions [data-do="check"]').click();
      await page.waitForFunction(()=>document.querySelector('#journey-frame').contentDocument.querySelector('#scene').dataset.stage==='passed');
      const evidence=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.chancefraction.cases[0]);
      assert.equal(evidence.attempts.length,1);
      assert.equal(evidence.attempts[0].supported,width===1440,'support event and independent attempt remain distinct');
      row.realSubmission=true;row.supported=evidence.attempts[0].supported;await shot('checked');
     }
     assert.deepEqual(errors,[]);row.passed=true;
    }catch(e){row.failure=e.stack;await shot('failure').catch(()=>{});console.error(width+'x'+height+': '+e.message);}finally{await ctx.close();}
   }
   result.passed=result.rows.length===5&&result.rows.every(row=>row.passed);
  }finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result,null,2)+'\n');}
  assert.ok(result.passed,'V54 responsive workbench: '+result.rows.filter(row=>row.passed).length+'/'+result.rows.length+' viewports passed; inspect original results.json');
  console.log(JSON.stringify({v54ResponsiveLayout:result.rows.map(row=>({viewport:row.viewport,ratio:row.initial?.ratio,headingHeight:row.initial?.headingHeight,passed:row.passed,realSubmission:row.realSubmission??false}))}));

}

// Mac 03 uses the same historical responsive extension and real paused
// native workbench, independent of the fixed-desktop A/AB acceptance.
async function verifyV54EntryLayout(browser){
 const assert=require('node:assert/strict'),atlas=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../dist/data/atlas.json'),'utf8'));
 const dir=path.resolve('verification/v54-entry-layout'),rootURL=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
 fs.mkdirSync(dir,{recursive:true});
 const result={passed:false,rows:[],testedCheckoutSha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()};
 try{
  for(const [width,height] of [[1280,720],[1000,1200]]){
   const viewport={width,height},ctx=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
   const row={viewport,errors,passed:false,switches:[]};result.rows.push(row);
   page.on('pageerror',e=>errors.push(e.message));
   const shot=name=>page.screenshot({path:path.join(dir,width+'x'+height+'-'+name+'.png')});
   try{
    await page.goto(rootURL+'/index.html?world=network&layout=54&surface=learn#space/node/mt_-c4Ca_nBzX');
    await page.waitForFunction(()=>{
      const w=document.querySelector('#journey-frame')?.contentWindow;
      return window.mathSpace?.snapshot()?.networkVersion===54&&document.body.dataset.workbenchForeground==='learn'&&w?.mathLesson?.snapshot()?.id==='chancefraction'&&w.document.body.dataset.workbenchLayout==='compact-v54'&&w.document.querySelector('#workbench-curriculum')?.dataset.state!=='loading'&&w.document.getElementById('storage-warning')?.hidden;
    },null,{timeout:60000});
    const lesson=page.frameLocator('#journey-frame'),key='#extra-controls [data-xfield="prob"]';
    const token=await lesson.locator('body').evaluate(el=>el.ownerDocument.defaultView.__entryLayoutToken='entry-live-'+Math.random());
    await lesson.locator(key).fill('1/7');
    const readRecord=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.chancefraction);
    await page.waitForFunction(()=>{
      const record=JSON.parse(localStorage.getItem('math-explorer-v2')||'null')?.lessons?.chancefraction;
      return record?.models?.[record.index]?.prob==='1/7';
    });
    const original=await readRecord(),positions=await page.evaluate(()=>mathSpace.snapshot().positions);
    assert.equal(original.models[original.index].prob,'1/7','assert a real saved, unsubmitted probability draft before navigation');
    const preserved=async()=>{
      assert.equal(await lesson.locator('body').evaluate(el=>el.ownerDocument.defaultView.__entryLayoutToken),token);
      assert.deepEqual(await readRecord(),original);
      const state=await page.evaluate(()=>({open:mathSpace.snapshot().journeyOpen,paused:mathSpace.snapshot().journeySuspended,pending:document.querySelector('[data-action="nav-learn"]').dataset.pending}));
      assert.deepEqual(state,{open:true,paused:true,pending:'true'});
    };
    await page.locator('[data-action="nav-explore"]').click();
    await page.waitForFunction(()=>mathSpace.snapshot().journeySuspended&&document.querySelector('#journey-surface').hidden);
    await preserved();
    const nav=page.locator('#cylinder-entry-nav'),choices=nav.locator('[data-action="cylinder-entry"]');
    await page.locator('.tool-rail [data-action="cylinder-origin"]').click();await nav.waitFor({state:'visible'});
    await page.waitForFunction(()=>!mathSpace.motion().tween);
    const roots=await choices.evaluateAll(els=>els.map(el=>({key:el.dataset.key,kind:el.dataset.entryKind,incoming:Number(el.dataset.incoming)})));
    assert.equal(roots.length,5);
    for(const r of roots){const incoming=atlas.edges.filter(e=>e.topicId===r.key.slice(5)).length;assert.equal(r.incoming,incoming);assert.equal(r.kind,incoming?'growth':'root');}
    await shot('origin');
    let selected=null;
    const camera=()=>page.evaluate(()=>{const s=mathSpace.snapshot();return {position:s.position,target:s.target,zoom:s.cameraZoom};});
    for(const r of roots){
      const choice=nav.locator('[data-key="'+r.key+'"]'),before=await camera();
      await choice.hover();
      await page.waitForFunction(key=>mathSpace.cylinder().presentation.entryPreview?.key===key&&mathSpace.nodeRadius(key)>=5.5,r.key);
      assert.equal(await page.evaluate(()=>mathSpace.snapshot().selected),selected);
      assert.deepEqual(await camera(),before);
      await preserved();
      await choice.click();
      await page.waitForFunction(key=>mathSpace.snapshot().selected===key&&mathSpace.snapshot().cylinderLocked&&!mathSpace.motion().tween&&document.querySelector('#cylinder-entry-nav').dataset.compact==='true',r.key);
      const geometry=await page.evaluate(key=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
        const nav=document.querySelector('#cylinder-entry-nav'),card=document.querySelector('#focus-card'),n=rect(nav),c=rect(card),p=mathSpace.project(key);
        const visible=(r,container)=>r.left>=container.left-1&&r.right<=container.right+1&&r.top>=container.top-1&&r.bottom<=container.bottom+1;
        const hit=el=>{
          const r=rect(el),points=[[(r.left+r.right)/2,(r.top+r.bottom)/2],[r.left+5,r.top+5],[r.right-5,r.top+5],[r.left+5,r.bottom-5],[r.right-5,r.bottom-5]];
          return r.width>10&&r.height>10&&points.every(([x,y])=>el.contains(document.elementFromPoint(x,y)));
        };
        const bounds={left:0,top:0,right:innerWidth,bottom:innerHeight};
        return {nav:n,card:c,gap:c.top-n.bottom,within:visible(n,bounds)&&visible(c,bounds),switches:[...nav.querySelectorAll('[data-action="cylinder-entry"]')].map(el=>({key:el.dataset.key,visible:visible(rect(el),n),hit:hit(el)})),homeHit:hit(nav.querySelector('[data-action="cylinder-entry-home"]')),closeHit:hit(nav.querySelector('[data-action="cylinder-entry-close"]')),overviewHit:hit(document.querySelector('.top-tools [data-action="overview"]')),floatingOverviewHidden:document.querySelector('#local-overview-exit').getClientRects().length===0,root:{x:p.x,y:p.y,visible:p.visible&&p.x>=0&&p.x<n.left&&p.y>=94&&p.y<=innerHeight-88}};
      },r.key);
      assert.ok(geometry.within&&geometry.gap>=6&&geometry.switches.every(s=>s.visible&&s.hit)&&geometry.homeHit&&geometry.closeHit&&geometry.overviewHit&&geometry.floatingOverviewHidden&&geometry.root.visible,'entry switcher, card, root are separately visible: '+JSON.stringify(geometry));
      assert.equal(await choices.count(),5);assert.equal(await choice.getAttribute('aria-pressed'),'true');
      assert.notDeepEqual(await camera(),before);assert.deepEqual(await page.evaluate(()=>mathSpace.snapshot().positions),positions);
      await preserved();
      // The actual compact card keeps its original primary action reachable.
      const action=page.locator('#focus-card .cylinder-compact-inspection .primary-button');
      await action.scrollIntoViewIfNeeded();
      assert.ok(await action.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2));}));
      row.switches.push({key:r.key,geometry});
      selected=r.key;
      if(row.switches.length===1||row.switches.length===5)await shot('locked-'+row.switches.length);
    }
    await nav.locator('[data-action="cylinder-entry-home"]').click();
    await page.waitForFunction(()=>!mathSpace.snapshot().selected&&!mathSpace.motion().tween&&document.querySelector('#cylinder-entry-nav').dataset.compact==='false');
    assert.equal(await choices.count(),5);await preserved();await shot('returned-origin');
    await page.locator('[data-action="nav-learn"]').click();
    await page.waitForFunction(()=>!mathSpace.snapshot().journeySuspended&&!document.querySelector('#journey-surface').hidden);
    assert.equal(await lesson.locator('body').evaluate(el=>el.ownerDocument.defaultView.__entryLayoutToken),token);
    assert.equal(await lesson.locator(key).inputValue(),'1/7');assert.deepEqual(await readRecord(),original);
    assert.ok(await nav.isHidden());assert.deepEqual(errors,[]);
    row.sameDocument=true;row.draftPreserved=true;row.passed=true;
   }catch(e){row.failure=e.stack;await shot('failure').catch(()=>{});console.error(width+'x'+height+': '+e.message);}finally{await ctx.close();}
  }
  result.passed=result.rows.length===2&&result.rows.every(r=>r.passed);
 }finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result,null,2)+'\n');}
 assert.ok(result.passed,'V54 entry layout: '+result.rows.filter(r=>r.passed).length+'/'+result.rows.length+' passed');
 console.log(JSON.stringify({v54EntryLayout:result.rows.map(r=>({viewport:r.viewport,passed:r.passed,switches:r.switches.length,sameDocument:r.sameDocument,draftPreserved:r.draftPreserved}))}));
}

// Mac 04: independent responsive evidence; all original legacy, 02 and
// 03 cases still run unchanged. No new fixed-desktop entrypoint or policy.
async function verifyV54QuietExploration(browser){
 const assert=require('node:assert/strict'),dir=path.resolve('verification/v54-quiet-exploration'),base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
 fs.mkdirSync(dir,{recursive:true});
 const result={passed:false,rows:[],testedCheckoutSha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()};
 try{
  for(const [width,height] of [[1280,720],[1000,1200]]){
   const viewport={width,height},ctx=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
   const row={viewport,errors,passed:false,stages:[]};result.rows.push(row);
   page.on('pageerror',e=>errors.push(e.message));
   const shot=name=>page.screenshot({path:path.join(dir,width+'x'+height+'-'+name+'.png')});
   const ready=async()=>{
     await page.waitForFunction(()=>window.mathSpace?.snapshot()?.networkVersion===54&&window.mathSpace.snapshot().visibleNodes.length===587&&document.querySelector('#loading')?.hidden&&!window.mathSpace.motion().tween,{},{timeout:60000});
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   };
   const pose=()=>page.evaluate(()=>{
     const s=mathSpace.snapshot();
     return {position:s.position,target:s.target,zoom:s.cameraZoom,positions:s.positions,projections:s.visibleNodes.map(key=>{const p=mathSpace.project(key);return {key,x:p.x,y:p.y,visible:p.visible};})};
   });
   // OrbitControls recomputes its target using floating-point arithmetic
   // on a dirty frame. visual1 tall viewport differed by only 2.84e-14
   // world units. Keep exact source-position equality; admit roundoff
   // only in camera components, and independently prove actual screen
   // projections of all 587 source nodes have not perceptibly changed.
   const assertSamePose=async(before,label)=>{
     const after=await pose();
     assert.deepEqual(after.positions,before.positions,label+': source coordinates exact');
     const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
     const positionDelta=delta(after.position,before.position),targetDelta=delta(after.target,before.target),zoomDelta=Math.abs(after.zoom-before.zoom);
     assert.ok(positionDelta<=1e-9&&targetDelta<=1e-9&&zoomDelta<=1e-12,label+': camera roundoff only '+JSON.stringify({positionDelta,targetDelta,zoomDelta}));
     assert.equal(after.projections.length,587);
     let maxPixelDelta=0;
     for(let i=0;i<after.projections.length;i++){
       const a=after.projections[i],b=before.projections[i];
       assert.equal(a.key,b.key);assert.equal(a.visible,b.visible);
       const distance=Math.hypot(a.x-b.x,a.y-b.y);
       assert.ok(Number.isFinite(distance),label+': finite projected source '+a.key);
       maxPixelDelta=Math.max(maxPixelDelta,distance);
     }
     assert.ok(maxPixelDelta<=1e-6,label+': every source projection unchanged to one millionth CSS px');
     return {label,positionDelta,targetDelta,zoomDelta,maxPixelDelta,sourceCoordinatesExact:true,projectedNodes:587};
   };
   const measure=()=>page.evaluate(()=>{
     const rect=el=>{const r=el.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};};
     const visible=el=>!!el&&!el.hidden&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
     const rail=document.querySelector('.tool-rail'),details=document.querySelector('.cylinder-extra-tools');
     const buttons=[...rail.querySelectorAll('button')].filter(visible).map(el=>{
       const range=document.createRange();range.selectNodeContents(el);
       const r=el.getBoundingClientRect(),text=range.getBoundingClientRect(),lines=[...range.getClientRects()].filter(r=>r.width&&r.height);
       const points=[[(r.left+r.right)/2,(r.top+r.bottom)/2],[r.left+5,r.top+5],[r.right-5,r.bottom-5]];
       return {action:el.dataset.action,text:el.textContent.trim(),nowrap:getComputedStyle(el).whiteSpace==='nowrap',oneLine:lines.every(b=>Math.abs(b.top-lines[0].top)<1),fit:text.width<=r.width+1,hit:points.every(([x,y])=>el.contains(document.elementFromPoint(x,y))),rect:rect(el)};
     });
     const captions=[...document.querySelectorAll('.cylinder-reference-caption')].filter(visible).map(el=>({stage:el.dataset.stage,text:el.textContent,rect:rect(el)}));
     const obstacles=[...document.querySelectorAll('.space-label:not([hidden]),#cylinder-origin-marker:not([hidden]),#network-guide,#focus-card,#cylinder-entry-nav,#cylinder-hover-inspector,.tool-rail,.topbar,.bottom-bar')].filter(visible).map(rect);
     const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
     return {detailsOpen:details.open,descriptionVisible:visible(document.querySelector('#network-view-description')),lensVisible:visible(document.querySelector('.lens-indicator')),rail:rect(rail),buttons,captions,captionOverlap:captions.some(a=>obstacles.some(b=>overlaps(a.rect,b))),stage:mathSpace.snapshot().gradeStageFilter,reference:mathSpace.cylinder().presentation.referenceCaption};
   });
   const check=async(stage)=>{
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const m=await measure();
     assert.equal(m.stage,stage);assert.equal(m.detailsOpen,false);assert.equal(m.descriptionVisible,false);assert.equal(m.lensVisible,false);
     assert.ok(m.buttons.length>=10&&m.buttons.every(b=>b.nowrap&&b.oneLine&&b.fit&&b.hit&&Math.abs(b.rect.y-m.buttons[0].rect.y)<1),'all camera controls are single-row and directly hit: '+JSON.stringify(m.buttons));
     assert.ok(m.rail.x>=0&&m.rail.y>=0&&m.rail.x+m.rail.w<=width+1&&m.rail.y+m.rail.h<=height+1);
     assert.ok(m.captions.length<=(stage==='all'?0:1)&&m.captions.every(c=>c.stage===stage)&&!m.captionOverlap);
     if(m.captions.length)assert.equal(m.reference.stage,stage);
     return m;
   };
   try{
     await page.goto(base+'/index.html?world=network&layout=54#atlas');await ready();
     const initial=await check('all'),before=await pose();row.initial=initial;row.poseChecks=[];await shot('default');
     const summary=page.locator('.cylinder-extra-tools>summary');
     await summary.click();
     assert.ok(await page.locator('#network-view-description').isVisible());
     assert.ok(await page.locator('.cylinder-observation-switches [data-action="cylinder-option"]').count()===5);
     await summary.press('Escape');assert.equal(await page.locator('.cylinder-extra-tools').evaluate(el=>el.open),false);
     row.poseChecks.push(await assertSamePose(before,'optional observation text and switches do not move the camera'));
     for(const stage of ['stage-1','stage-2','stage-3']){
       await page.locator('#grade-map-filter [data-stage="'+stage+'"]').click();
       await page.mouse.move(width-8,height-8);
       await page.waitForFunction(stage=>mathSpace.snapshot().gradeStageFilter===stage,stage);
       const evidence=await check(stage);row.stages.push(evidence);
       row.poseChecks.push(await assertSamePose(before,'reference label placement never moves actual source positions or camera'));
       await shot(stage);
     }
     // Return to all without changing the camera; the original grade text is
     // still available from its control even when an unsafe caption is omitted.
     await page.locator('#grade-map-filter [data-stage="all"]').click();await page.mouse.move(width-8,height-8);
     await page.waitForFunction(()=>mathSpace.snapshot().gradeStageFilter==='all');await check('all');
     row.poseChecks.push(await assertSamePose(before,'returning to all grades does not move the map'));
     await summary.click();
     await page.locator('.tool-rail [data-action="front"]').click();
     await page.waitForFunction(()=>!mathSpace.motion().tween);
     row.reset=await check('all');
     await summary.click();
     await page.reload();await ready();
     row.reload=await check('all');
     assert.deepEqual(errors,[]);row.passed=true;
   }catch(e){row.failure=e.stack;await shot('failure').catch(()=>{});console.error(width+'x'+height+': '+e.message);}finally{await ctx.close();}
  }
  result.passed=result.rows.length===2&&result.rows.every(r=>r.passed);
 }finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result,null,2)+'\n');}
 assert.ok(result.passed,'V54 quiet exploration: '+result.rows.filter(r=>r.passed).length+'/'+result.rows.length+' passed');
 console.log(JSON.stringify({v54QuietExploration:result.rows.map(r=>({viewport:r.viewport,passed:r.passed,stages:r.stages.map(s=>({stage:s.stage,captions:s.captions.length,overlap:s.captionOverlap})),controls:r.initial?.buttons.length}))}));
}

// Mac 05: one real continuous acceptance journey, in addition to (not in
// place of) all original isolated regressions. No storage injection; only
// actual controls create learner state. The document token is diagnostic.
async function verifyV54MacJoint(browser){
 const assert=require('node:assert/strict'),base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
 const atlas=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../dist/data/atlas.json'),'utf8'));
 const release=fs.readFileSync(path.resolve(__dirname,'../dist/sw.js'),'utf8').match(/^const CACHE = '([^']+)';/m)?.[1];
 const dir=path.resolve('verification/v54-mac-joint'),viewport={width:1280,height:720};
 const topic='mt_-c4Ca_nBzX',session='chancefraction',other='mt_Ep7TDFuYUa',otherKey='node:'+other;
 fs.mkdirSync(dir,{recursive:true});
 const result={passed:false,viewport,testedCheckoutSha:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),release,errors:[],steps:[]};
 const ctx=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await ctx.newPage();
 const frame=page.frameLocator('#journey-frame'),input=frame.locator('#extra-controls [data-xfield="prob"]'),learn=page.locator('[data-action="nav-learn"]'),pause=page.locator('#workbench-later');
 const nav=page.locator('#cylinder-entry-nav'),choices=nav.locator('[data-action="cylinder-entry"]');
 page.on('pageerror',e=>result.errors.push(e.message));
 let currentStep=null,token,baseline,positions;
 const shot=name=>page.screenshot({path:path.join(dir,name+'.png')});
 const run=async(n,ids,title,fn)=>{
   currentStep={number:n,issues:ids,title,passed:false};result.steps.push(currentStep);
   currentStep.evidence=await fn();
   assert.deepEqual(result.errors,[]);
   await shot(String(n).padStart(2,'0')+'-'+ids.join('-'));
   currentStep.passed=true;
 };
 const read=()=>page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
 const record=async()=>JSON.parse(await read()).lessons[session];
 const mark=()=>frame.locator('body').evaluate(el=>el.ownerDocument.defaultView.__joint05Token='mac-joint-'+Math.random());
 const sameDoc=async()=>assert.equal(await frame.locator('body').evaluate(el=>el.ownerDocument.defaultView.__joint05Token),token);
 const sameRecord=async()=>assert.deepEqual(await record(),baseline,'original probability lesson remains byte-equivalent');
 const ready=()=>page.waitForFunction(()=>window.mathSpace?.snapshot()?.networkVersion===54&&window.mathSpace.snapshot().visibleNodes.length===587&&document.querySelector('#space-app')?.classList.contains('ready'),null,{timeout:60000});
 const lessonReady=()=>page.waitForFunction(id=>{
   const w=document.querySelector('#journey-frame')?.contentWindow;
   return w?.mathLesson?.snapshot()?.id===id&&w.document.body.dataset.workbenchLayout==='compact-v54'&&w.document.querySelector('#workbench-curriculum')?.dataset.state!=='loading'&&w.document.getElementById('storage-warning')?.hidden;
 },session,{timeout:60000});
 const foreground=()=>page.waitForFunction(()=>window.mathSpace?.snapshot()?.journeyOpen&&!mathSpace.snapshot().journeySuspended&&!document.querySelector('#journey-surface').hidden&&document.body.dataset.workbenchForeground==='learn');
 const paused=()=>page.waitForFunction(()=>window.mathSpace?.snapshot()?.journeyOpen&&mathSpace.snapshot().journeySuspended&&document.querySelector('#journey-surface').hidden&&document.querySelector('[data-action="nav-learn"]').dataset.pending==='true');
 const camera=()=>page.evaluate(()=>{const s=mathSpace.snapshot();return {position:s.position,target:s.target,zoom:s.cameraZoom};});
 const cameraDelta=(a,b)=>Math.max(...a.position.map((x,i)=>Math.abs(x-b.position[i])),...a.target.map((x,i)=>Math.abs(x-b.target[i])),Math.abs(a.zoom-b.zoom));
 const samePositions=async()=>assert.deepEqual(await page.evaluate(()=>mathSpace.snapshot().positions),positions);
 const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 try{
  await run(1,['I-01'],'V54 actual node entry and foreground',async()=>{
    await page.goto(base+'/index.html?world=network&layout=54#space/node/'+topic);await ready();
    await page.waitForFunction(key=>mathSpace.snapshot().selected===key&&mathSpace.snapshot().cylinderLocked,'node:'+topic);
    positions=await page.evaluate(()=>mathSpace.snapshot().positions);
    await page.locator('#focus-card [data-action="open"][data-id="'+topic+'"]:visible').click();await lessonReady();await foreground();await settle();
    const styles=await page.evaluate(()=>{
      const get=s=>getComputedStyle(document.querySelector(s));
      const labels=[...document.querySelectorAll('.space-label.node:not([hidden])')].map(el=>({key:el.dataset.key,point:el.classList.contains('cylinder-point-label'),background:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderTopWidth}));
      return {filter:get('#space-canvas>canvas').filter,labelsOpacity:Number(get('#space-canvas .space-labels').opacity),lessonOpacity:Number(get('#journey-surface').opacity),labels};
    });
    assert.match(styles.filter,/brightness\(0\.64\)/);assert.match(styles.filter,/blur\(0\.8px\)/);assert.equal(styles.labelsOpacity,.62);assert.equal(styles.lessonOpacity,1);
    assert.ok(styles.labels.every(l=>l.point&&l.background==='rgba(0, 0, 0, 0)'&&l.border==='0px'),'no V53 white rectangular node labels during V54 learning');
    assert.ok(await page.locator('#workbench-focus-toggle').isHidden());
    assert.equal(await frame.locator('#workbench-curriculum').getAttribute('data-topic-id'),topic);
    token=await mark();await samePositions();return styles;
  });
  await run(2,['I-02'],'70 percent stage and real probability draft',async()=>{
    const m=await page.evaluate(()=>{
      const panel=document.querySelector('#journey-surface'),iframe=document.querySelector('#journey-frame'),doc=iframe.contentDocument,rect=el=>el.getBoundingClientRect();
      const p=rect(panel),f=rect(iframe),s=rect(doc.querySelector('#workbench-stage')),work=rect(doc.querySelector('#work')),dock=rect(doc.querySelector('#workbench-drawer')),command=rect(doc.querySelector('.execution-command'));
      const fields=['kind','prob','answers.0'].map(field=>{
        const el=doc.querySelector('#extra-controls [data-xfield="'+field+'"]'),r=rect(el),label=rect(el.closest('label')),x=r.x+r.width/2,y=r.y+r.height/2;
        return {field,label:el.closest('label').textContent.trim(),visible:label.left>=s.left-1&&label.right<=s.right+1&&label.top>=s.top-1&&label.bottom<=s.bottom+1&&r.bottom<=dock.top+1&&r.bottom<=command.top+1&&!el.disabled,hit:[[x,y],[r.left+3,r.top+3],[r.right-3,r.bottom-3]].every(([a,b])=>el.contains(doc.elementFromPoint(a,b)))&&document.elementFromPoint(f.left+x,f.top+y)===iframe};
      });
      return {ratio:p.width/innerWidth,heading:f.top-p.top+work.top,scroll:doc.querySelector('#workbench-stage').scrollTop,fields};
    });
    assert.ok(m.ratio>=.68&&m.ratio<=.72&&m.heading<=220);assert.equal(m.scroll,0);assert.ok(m.fields.every(f=>f.visible&&f.hit&&f.label));
    assert.equal(await frame.locator('#extra-controls .b22-controls > .field :is(input,select)').count(),3);
    await frame.locator('#extra-visual [data-x="p22-toggle"][data-index="5"]').click();
    await frame.locator('#extra-controls [data-xfield="kind"]').selectOption('equal');
    await input.fill('1/7');await frame.locator('#extra-controls [data-xfield="answers.0"]').fill('6');
    await page.waitForFunction(()=>{const r=JSON.parse(localStorage.getItem('math-explorer-v2')||'null')?.lessons?.chancefraction;return r?.models?.[r.index]?.prob==='1/7';});
    baseline=await record();assert.equal(Object.values(baseline.cases||{}).flatMap(x=>x.attempts||[]).length,0);
    return {...m,draft:baseline.models[baseline.index].prob,attempts:0};
  });
  await run(3,['I-03'],'single question entry and optional real source context',async()=>{
    const child=frame.locator('#lesson > header [data-do="question"]'),global=page.locator('.save-status [data-action="question"]');
    assert.ok(await child.isVisible()&&await global.isHidden()&&await pause.isVisible());
    const questionCount=JSON.parse(await read()).daily.questions.length;
    const composer=page.locator('dialog.question-dialog');
    await child.click();await composer.waitFor({state:'visible'});await composer.locator('[data-cancel]').click();await composer.waitFor({state:'hidden'});
    assert.equal(JSON.parse(await read()).daily.questions.length,questionCount);
    const details=page.locator('#workbench-context-menu'),summary=details.locator('summary');assert.equal(await details.evaluate(el=>el.open),false);
    await summary.click();const links=await page.locator('#learning-map-context [data-source-key]').evaluateAll(els=>els.map(el=>el.dataset.sourceKey));
    assert.ok(links.length&&links.every(k=>atlas.edges.some(e=>(e.topicId===topic&&e.prerequisiteId===k.slice(5))||(e.prerequisiteId===topic&&e.topicId===k.slice(5)))));
    await summary.press('Escape');await page.waitForFunction(()=>!document.querySelector('#workbench-context-menu').open);await sameRecord();
    return {singleQuestionEntry:true,cancelNoWrite:true,sourceKeys:links};
  });
  await run(4,['II-01'],'actual exposed map click pauses into V54',async()=>{
    const point=await page.evaluate(()=>{
      const canvas=document.querySelector('#space-canvas>canvas'),r=canvas.getBoundingClientRect(),nodes=mathSpace.snapshot().positions.filter(o=>o.key.startsWith('node:')).map(o=>({p:mathSpace.project(o.key),radius:mathSpace.nodeRadius(o.key)||0}));
      for(let y=r.top+110;y<r.bottom-100;y+=27)for(let x=r.left+35;x<r.right-35;x+=29){
        if(document.elementFromPoint(x,y)!==canvas)continue;
        if(nodes.every(({p,radius})=>!p?.visible||Math.hypot(x-r.left-p.x,y-r.top-p.y)>radius+12))return {x,y};
      }
      return null;
    });
    assert.ok(point,'real exposed map hit target');await page.mouse.click(point.x,point.y);await paused();await sameDoc();await sameRecord();
    const presentation=await page.evaluate(()=>({version:mathSpace.snapshot().networkVersion,filter:getComputedStyle(document.querySelector('#space-canvas>canvas')).filter,labels:Number(getComputedStyle(document.querySelector('#space-canvas .space-labels')).opacity),pending:document.querySelector('[data-action="nav-learn"]').dataset.pending,pointLabels:document.querySelectorAll('.space-label.node.cylinder-point-label:not([hidden])').length}));
    assert.equal(presentation.version,54);assert.equal(presentation.filter,'none');assert.equal(presentation.labels,1);assert.equal(presentation.pending,'true');assert.ok(presentation.pointLabels>0);
    return {...presentation,point,sameDocument:true};
  });
  await run(5,['II-02'],'real different node selection, explicit switch cancellation, resume A',async()=>{
    await page.locator('[data-action="search"]:visible').first().click();await page.locator('#search-input').fill(other);
    await page.locator('#search-results [data-key="'+otherKey+'"]').click();await page.waitForFunction(k=>mathSpace.snapshot().selected===k,otherKey);await paused();await sameDoc();await sameRecord();
    const beforeCancel=await read(),start=page.locator('#focus-card [data-action="open"][data-id="'+other+'"]:visible');
    const prompt=page.waitForEvent('dialog',{timeout:10000}).then(async d=>{assert.equal(d.type(),'confirm');assert.match(d.message(),/草稿/);await d.dismiss();});
    await Promise.all([prompt,start.click()]);await paused();assert.equal(await read(),beforeCancel);await sameDoc();
    await learn.click();await foreground();await lessonReady();await sameDoc();await sameRecord();assert.equal(await input.inputValue(),'1/7');
    return {selectedOther:otherKey,resumed:session,cancelNoWrite:true,sameDocument:true};
  });
  await run(6,['II-03'],'real browser Back/Forward, cached offline reload and restoration',async()=>{
    // Back and Forward are the browser history, not the app Back button.
    await page.goBack({waitUntil:'commit'});await paused();await sameDoc();await sameRecord();
    await page.goForward({waitUntil:'commit'});await foreground();await sameDoc();await sameRecord();assert.equal(await input.inputValue(),'1/7');
    await pause.click();await paused();await sameDoc();await sameRecord();
    await page.waitForFunction(async name=>{
      const worker=navigator.serviceWorker.controller;if(!worker||worker.state!=='activated')return false;
      const cache=await caches.open(name);
      return (await Promise.all(['./spatial-cylinder-visuals.js','./learning/workbench-presentation.js','./learn.html'].map(p=>cache.match(new URL(p,location.href))))).every(Boolean);
    },release,{timeout:90000});
    await ctx.setOffline(true);
    try{
      await page.reload();await ready();await lessonReady();await paused();
      const after=await record(),expected=structuredClone(baseline);expected.updatedAt=after.updatedAt;assert.deepEqual(after,expected,'only original native reopen timestamp may change');baseline=after;
      assert.notEqual(await frame.locator('body').evaluate(el=>el.ownerDocument.defaultView.__joint05Token),token);
      token=await mark();await learn.click();await foreground();await lessonReady();await sameDoc();
      assert.equal(await input.inputValue(),'1/7');await sameRecord();
      await pause.click();await paused();await sameDoc();await sameRecord();
    }finally{await ctx.setOffline(false);}
    await samePositions();
    return {browserBack:true,browserForward:true,offlineReload:true,originalDraft:'1/7',reloadedDocument:true};
  });
  await run(7,['III-01'],'real entry hover and source spine emphasis',async()=>{
    await page.locator('.tool-rail [data-action="cylinder-origin"]').click();await nav.waitFor({state:'visible'});await page.waitForFunction(()=>!mathSpace.motion().tween);
    const key=await choices.first().getAttribute('data-key'),sp=(await page.evaluate(()=>mathSpace.cylinder().spines)).find(s=>s.index===0&&'node:'+s.rootId===key),pose=await camera(),raw=await read();
    assert.ok(sp&&sp.edges.length);
    const edgeKeys=sp.edges.map(e=>e.prerequisiteId+'>'+e.topicId);assert.ok(edgeKeys.every(k=>atlas.edges.some(e=>e.prerequisiteId+'>'+e.topicId===k)));
    await choices.first().hover();await page.waitForFunction(({key,edgeKeys})=>{
      const p=mathSpace.cylinder().presentation,chosen=p.entryEdges.filter(e=>edgeKeys.includes(e.key)),other=p.entryEdges.filter(e=>!edgeKeys.includes(e.key));
      return p.entryPreview?.key===key&&mathSpace.nodeRadius(key)>=5.5&&chosen.length===edgeKeys.length&&Math.min(...chosen.map(e=>e.opacity))>Math.max(...other.map(e=>e.opacity));
    },{key,edgeKeys});
    assert.equal(await page.evaluate(()=>mathSpace.snapshot().selected),null);assert.ok(cameraDelta(await camera(),pose)<=1e-9);assert.equal(await read(),raw);await sameDoc();await sameRecord();await samePositions();
    return {key,sourceEdgeKeys:edgeKeys,hoverOnly:true};
  });
  await run(8,['III-02'],'five explicit entry switches with separated locked card',async()=>{
    const keys=await choices.evaluateAll(els=>els.map(el=>el.dataset.key)),switches=[];assert.equal(keys.length,5);
    let selected=null;
    for(const key of keys){
      const choice=nav.locator('[data-key="'+key+'"]'),old=await camera();
      await choice.hover();await page.waitForFunction(key=>mathSpace.cylinder().presentation.entryPreview?.key===key,key);
      assert.equal(await page.evaluate(()=>mathSpace.snapshot().selected),selected);assert.ok(cameraDelta(await camera(),old)<=1e-9);
      await choice.click();await page.waitForFunction(key=>mathSpace.snapshot().selected===key&&mathSpace.snapshot().cylinderLocked&&!mathSpace.motion().tween&&document.querySelector('#cylinder-entry-nav').dataset.compact==='true',key);
      const geometry=await page.evaluate(key=>{
        const nav=document.querySelector('#cylinder-entry-nav'),card=document.querySelector('#focus-card'),n=nav.getBoundingClientRect(),c=card.getBoundingClientRect(),p=mathSpace.project(key);
        const hit=el=>{const r=el.getBoundingClientRect();return [[(r.left+r.right)/2,(r.top+r.bottom)/2],[r.left+5,r.top+5],[r.right-5,r.top+5],[r.left+5,r.bottom-5],[r.right-5,r.bottom-5]].every(([x,y])=>el.contains(document.elementFromPoint(x,y)));};
        return {gap:c.top-n.bottom,within:n.left>=0&&n.top>=0&&n.right<=innerWidth&&c.bottom<=innerHeight,allHit:[...nav.querySelectorAll('button'),document.querySelector('.top-tools [data-action="overview"]')].every(hit),rootVisible:p.visible&&p.x>=0&&p.x<n.left&&p.y>=94&&p.y<=innerHeight-88};
      },key);
      assert.ok(geometry.gap>=6&&geometry.within&&geometry.allHit&&geometry.rootVisible);assert.equal(await choices.count(),5);
      assert.ok(cameraDelta(await camera(),old)>1e-6);assert.equal(await choice.getAttribute('aria-pressed'),'true');
      await paused();await sameDoc();await sameRecord();await samePositions();selected=key;switches.push({key,...geometry});
    }
    return {switches,sameDocument:true};
  });
  await run(9,['III-03'],'actual source indegree classification',async()=>{
    const rows=await choices.evaluateAll(els=>els.map(el=>({key:el.dataset.key,kind:el.dataset.entryKind,incoming:Number(el.dataset.incoming),text:el.textContent})));
    for(const r of rows){const incoming=atlas.edges.filter(e=>e.topicId===r.key.slice(5)).length;assert.equal(r.incoming,incoming);assert.equal(r.kind,incoming?'growth':'root');assert.match(r.text,incoming?/生长入口/:/真正起点/);}
    assert.equal(rows.filter(r=>r.kind==='root').length,4);assert.equal(rows.filter(r=>r.kind==='growth').length,1);
    await nav.locator('[data-action="cylinder-entry-home"]').click();await page.waitForFunction(()=>!mathSpace.snapshot().selected&&!mathSpace.motion().tween&&document.querySelector('#cylinder-entry-nav').dataset.compact==='false');assert.equal(await choices.count(),5);
    await nav.locator('[data-action="cylinder-entry-close"]').click();await sameDoc();await sameRecord();return {rows,returnedOrigin:true};
  });
  await run(10,['IV-01'],'default closed observation options and explicit controls',async()=>{
    const details=page.locator('.cylinder-extra-tools'),summary=details.locator('summary');
    assert.equal(await details.evaluate(el=>el.open),false);assert.ok(await page.locator('#network-view-description').isHidden());
    await summary.click();assert.ok(await page.locator('#network-view-description').isVisible());assert.equal(await page.locator('.cylinder-observation-switches [data-action="cylinder-option"]').count(),5);
    await summary.press('Escape');assert.equal(await details.evaluate(el=>el.open),false);
    await summary.click();await page.locator('.tool-rail [data-action="front"]').click();await page.waitForFunction(()=>!mathSpace.motion().tween);assert.equal(await details.evaluate(el=>el.open),false);
    await samePositions();await sameDoc();await sameRecord();return {defaultClosed:true,explicitFiveSwitches:true,escapeClosed:true,resetClosed:true};
  });
  await run(11,['IV-02','IV-03'],'single-line toolbar, reference caption collision and final real Check',async()=>{
    const measure=()=>page.evaluate(()=>{
      const visible=el=>!!el&&!el.hidden&&el.getClientRects().length>0,rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
      const rail=[...document.querySelectorAll('.tool-rail button')].filter(visible).map(el=>{
        const range=document.createRange();range.selectNodeContents(el);const r=el.getBoundingClientRect(),lines=[...range.getClientRects()].filter(x=>x.width&&x.height);
        return {text:el.textContent.trim(),nowrap:getComputedStyle(el).whiteSpace==='nowrap',oneLine:lines.every(x=>Math.abs(x.top-lines[0].top)<1),fit:range.getBoundingClientRect().width<=r.width+1,hit:el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)),y:r.y};
      });
      const captions=[...document.querySelectorAll('.cylinder-reference-caption')].filter(visible).map(el=>({stage:el.dataset.stage,rect:rect(el)}));
      const obstacles=[...document.querySelectorAll('.space-label:not([hidden]),#cylinder-origin-marker:not([hidden]),#network-guide,#focus-card,#cylinder-entry-nav,#cylinder-hover-inspector,.tool-rail,.topbar,.bottom-bar')].filter(visible).map(rect);
      return {rail,captions,collision:captions.some(a=>obstacles.some(b=>overlap(a.rect,b))),lens:visible(document.querySelector('.lens-indicator'))};
    });
    const pose=await camera(),visuals=[];
    for(const stage of ['all','stage-1','stage-2','stage-3']){
      await page.locator('#grade-map-filter [data-stage="'+stage+'"]').click();await page.mouse.move(viewport.width-8,viewport.height-8);await page.waitForFunction(stage=>mathSpace.snapshot().gradeStageFilter===stage,stage);await settle();
      const v=await measure();assert.equal(v.rail.length,10);assert.ok(v.rail.every(b=>b.nowrap&&b.oneLine&&b.fit&&b.hit&&Math.abs(b.y-v.rail[0].y)<1));assert.equal(v.lens,false);
      assert.ok(v.captions.length<=(stage==='all'?0:1)&&v.captions.every(c=>c.stage===stage)&&!v.collision);assert.ok(cameraDelta(await camera(),pose)<=1e-9);await samePositions();visuals.push({stage,...v});await shot('11-'+stage);
    }
    assert.ok(visuals.some(v=>v.captions.length===1),'actual reference caption can be placed without collision');
    await page.locator('#grade-map-filter [data-stage="all"]').click();await learn.click();await foreground();await lessonReady();await sameDoc();await sameRecord();
    assert.equal(await input.inputValue(),'1/7');await input.fill('1/6');await frame.locator('#actions [data-do="check"]').click();
    await page.waitForFunction(()=>document.querySelector('#journey-frame').contentDocument.querySelector('#scene').dataset.stage==='passed');
    const checked=await record();assert.equal(checked.cases[0].attempts.length,1);assert.equal(checked.cases[0].attempts[0].supported,false);await samePositions();
    return {visuals,realSubmission:true,attempts:1,independent:true};
  });
  assert.equal(result.steps.length,11);assert.ok(result.steps.every(s=>s.passed));result.passed=true;
 }catch(e){result.failure=e.stack;if(currentStep)currentStep.failure=e.stack;await shot('failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result,null,2)+'\n');await ctx.close();}
 console.log(JSON.stringify({v54MacJoint:{testedCheckoutSha:result.testedCheckoutSha,passed:result.passed,steps:result.steps.map(s=>({number:s.number,issues:s.issues,passed:s.passed})),errors:result.errors}}));
}
