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
