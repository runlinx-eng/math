// Five-step action-oriented guided walk on the unchanged source atlas.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/spatial-guide-inplace');
const base='http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas';
const checks=[],errors=[],check=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
const same=(a,b,eps=1e-5)=>Math.abs(a-b)<eps;
const samePose=(a,b)=>same(a.cameraZoom,b.cameraZoom)&&a.position.every((n,i)=>same(n,b.position[i]))&&a.target.every((n,i)=>same(n,b.target[i]));
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.evaluate(()=>mathSpace.snapshot());
 const target=()=>page.locator('#guide-cues [data-action="guide-visit"]').first();
 const visit=async()=>{await target().waitFor({state:'visible'});await target().click();};
 try{
  await page.goto(base);await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const initial=await snap(),positions=JSON.stringify(initial.positions);
  const backgroundId='node:mt_dmNvjroCPT'; // real directly connected knowledge
  await page.evaluate(key=>{
    document.querySelector('.space-label.node[data-key="'+key+'"]')
      ?.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));
  },backgroundId);
  await page.waitForTimeout(80);
  const overviewHover=await page.evaluate(()=>mathSpace.hoverPreview());
  check(overviewHover.key===backgroundId&&overviewHover.edges.length>0,
    'free overview exposes the source-backed direct relationship preview');
  await page.evaluate(key=>{
    document.querySelector('.space-label.node[data-key="'+key+'"]')
      ?.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));
  },backgroundId);
  await page.locator('[data-action="guide-start"]').click();
  await page.waitForFunction(()=>mathSpace.snapshot().guide?.step===0);
  let state=await snap();
  check(samePose(initial,state)&&!state.cameraTween,'entering guide does not change camera');
  check(state.guide.currentNodes.length===0&&state.guide.edges.length===0,'first step retains whole forest without a forced local route');
  check((await page.locator('.space-label.theme:visible').count())>=3,'main themes remain legible');
  check(await page.locator('.space-label.pack:visible').count()===0,'first step suppresses knowledge-group labels');
  check(await page.locator('#guide-panel .guide-head .guide-count').innerText()==='01 / 05','compact progress keeps the exact step and total');
  check((await page.locator('#guide-panel .guide-hint').innerText()).includes('数与运算')
    &&await page.locator('[data-action="guide-exit"]').isVisible(),'clear step purpose and exit remain visible');
  check(await page.locator('[data-action="guide-step"][data-step="1"]').isDisabled(),'cannot skip the first on-map action');
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(out,'01-forest.png')});
  // The guided panorama remains inspectable, but non-target knowledge and
  // themes are locked to this task. No click may exit the guide implicitly.
  const lockedTheme=page.locator('.space-label.theme[aria-disabled="true"]:visible').first();
  check(await lockedTheme.count()>0,'other themes remain visible but locked');
  const initialGuide=await snap();
  await lockedTheme.evaluate(el=>el.click());
  check((await snap()).guide?.step===0&&samePose(await snap(),initialGuide),
    'clicking a non-target theme does not change the guide or camera');
  const hoveredNode=page.locator('.space-label.node[data-key="'+backgroundId+'"]');
  check((await snap()).visibleNodes.includes(backgroundId),'background knowledge point stays in the 537-node forest');
  await page.evaluate(key=>{
    const el=document.querySelector('.space-label.node[data-key="'+key+'"]');
    el?.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));
  },backgroundId);
  await page.waitForTimeout(120);
  const guideHover=await page.evaluate(()=>mathSpace.hoverPreview());
  check(guideHover.key===backgroundId&&guideHover.edges.length>0&&guideHover.related.length>0,
    'locked knowledge has full source-backed direct relations');
  check(JSON.stringify(guideHover.edges)===JSON.stringify(overviewHover.edges)
      &&JSON.stringify(guideHover.related)===JSON.stringify(overviewHover.related),
    'guide hover information is identical to full overview for the same knowledge point');
  check(await hoveredNode.isVisible()&&await hoveredNode.getAttribute('aria-disabled')==='true',
    'locked knowledge still reveals its complete name without click permission');
  await hoveredNode.evaluate(el=>{el.click();el.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));});
  check((await snap()).guide?.step===0&&!(await snap()).journeyOpen&&samePose(await snap(),initialGuide),
    'click and double-click on locked background do not open learning or leave the guide');
  await hoveredNode.evaluate(el=>el.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'})));
  await page.waitForTimeout(80);
  check((await snap()).guide?.step===0,
    'leaving temporary hover restores the underlying guide step');
  check((await page.evaluate(()=>mathSpace.hoverPreview())).key===null,
    'mouseout clears temporary overview preview, not the guide');

  await visit();await page.waitForFunction(()=>mathSpace.snapshot().guide?.step===1);
  check((await target().count())===1,'guide points to the next source location');
  const actionable=page.locator('.space-label.node.guide-target:visible').first();
  if(await actionable.count()){
    check(await actionable.getAttribute('aria-disabled')==='false',
      'visible current-task knowledge label is clickable');
  }else{
    // A denser observation sidebar may leave the fixed-position source label
    // offscreen; its projected task cue is still the on-map action.
    const cue=target(),cueKey=await cue.getAttribute('data-key');
    check(await cue.isVisible()&&cueKey?.startsWith('node:'),
      'offscreen current-task knowledge remains actionable through its source-node cue');
  }
  const other=page.locator('.space-label.node.guide-locked').first();
  check(await other.getAttribute('aria-disabled')==='true',
    'non-task knowledge is explicitly locked');

  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(out,'02-first-connection.png')});
  await visit();check(await page.locator('[data-action="guide-step"][data-step="2"]').isDisabled(),'finding start alone is not a full source connection');
  const seenStart=page.locator('.space-label.node[data-key="node:mt_WcfaSfVT33"]');
  await page.waitForFunction(()=>{
    const el=document.querySelector('.space-label.node[data-key="node:mt_WcfaSfVT33"]');
    return el?.getAttribute('aria-disabled')==='true'&&el.classList.contains('guide-visited');
  });
  check(await seenStart.getAttribute('aria-disabled')==='true'
    &&await seenStart.evaluate(el=>el.classList.contains('guide-visited')),
    'observed start becomes visible but locked once its task action is complete');
  await visit();check(await page.locator('[data-action="guide-step"][data-step="2"]').isEnabled(),'following a source edge unlocks the next discovery');
  await page.locator('[data-action="guide-step"][data-step="2"]').click();
  state=await snap();
  check(state.guide.step===2&&state.guide.edges.length>=5,'source route and two actual branches remain in the graph');
  const pathBeforeHover=await page.locator('.spatial-focus-links path').count();
  await page.evaluate(key=>document.querySelector('.space-label.node[data-key="'+key+'"]')
    ?.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'})),backgroundId);
  await page.waitForTimeout(90);
  const temporary=await page.evaluate(()=>mathSpace.hoverPreview());
  check(temporary.key===backgroundId&&temporary.edges.length===guideHover.edges.length,
    'guided hover reuses the overview real-edge preview without changing its content');
  check((await snap()).guide?.step===2,
    'full hover preview is read-only and does not progress or interrupt the guide');
  await page.evaluate(key=>document.querySelector('.space-label.node[data-key="'+key+'"]')
    ?.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'})),backgroundId);
  await page.waitForTimeout(90);
  check((await snap()).guide?.step===2&&JSON.stringify((await snap()).guide.edges)===JSON.stringify(state.guide.edges)
    &&(await page.evaluate(()=>mathSpace.hoverPreview())).key===null,
    'leaving the preview restores unchanged source guide edges and clears hover');
  check((await page.locator('#guide-cues [data-action="guide-visit"]').count())===2,'branch step offers two map targets');
  const cueText=await page.locator('#guide-cues [data-action="guide-visit"]').evaluateAll(cues=>cues.map(el=>({
    action:el.querySelector('.guide-cue-action')?.textContent?.trim(),
    title:el.querySelector('.guide-cue-name')?.textContent?.trim(),
    full:el.getAttribute('aria-label')
  })));
  check(cueText.every(item=>item.action&&item.title&&item.full.includes(item.title)),
    'each redesigned prompt keeps its complete knowledge name and action');
  const cueRects=await page.locator('#guide-cues [data-action="guide-visit"]').evaluateAll(cues=>cues.map(el=>{
    const r=el.getBoundingClientRect();return {key:el.dataset.key,x:r.x,y:r.y,w:r.width,h:r.height};
  }));
  const intersect=(a,b)=>a.x<b.x+b.w+8&&a.x+a.w+8>b.x&&a.y<b.y+b.h+8&&a.y+a.h+8>b.y;
  check(!intersect(cueRects[0],cueRects[1]),'fork choices do not overlap or intercept each other');
  check(cueRects.every(r=>r.w>50&&r.h>25&&r.x>=0&&r.y>=0&&r.x+r.w<=1440&&r.y+r.h<=900),'both fork choices remain fully on screen');
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(out,'03-fork.png')});
  await visit();check(await page.locator('[data-action="guide-step"][data-step="3"]').isDisabled(),'observing only one branch does not finish the fork');
  await visit();check(await page.locator('[data-action="guide-step"][data-step="3"]').isEnabled(),'both source branches allow proceeding');
  await page.locator('[data-action="guide-step"][data-step="3"]').click();
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(out,'04-merge.png')});
  await visit();
  check(await page.locator('[data-action="guide-step"][data-step="4"]').isEnabled(),'touching the convergence target completes the observation');
  await page.locator('[data-action="guide-step"][data-step="4"]').click();
  state=await snap();
  check(state.guide.step===4&&await target().count()>=1,'free-choice step offers real outgoing source neighbors');
  check(!await page.locator('[data-action="guide-step"][data-step="5"]').count(),'last stage is a user choice, not an automatic finish');
  check(samePose(initial,state)&&JSON.stringify(state.positions)===positions,'all five steps preserve camera and original node coordinates');
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(out,'05-free-choice.png')});
  await visit();
  state=await snap();
  check(state.guide===null&&state.selected?.startsWith('node:')&&state.visibleNodes.length===537,'choosing a real neighbor returns to ordinary free exploration on the same map');
  check(samePose(initial,state),'choosing an in-view guide target does not jump camera');
  const ordinaryNode=page.locator('.space-label.node[data-key="'+backgroundId+'"]');
  check(await ordinaryNode.getAttribute('aria-disabled')===null,
    'all knowledge points regain ordinary click permission after guide exit');

  await page.locator('[data-action="guide-start"]').click();
  state=await snap();
  check(state.guide?.step===0&&samePose(initial,state),'restarting guide remains in place');
  await page.locator('[data-action="guide-exit"]').click();
  state=await snap();
  check(state.guide===null&&samePose(initial,state),'exiting guide keeps camera unchanged');
  check(errors.length===0,'no uncaught browser errors');
  fs.writeFileSync(path.join(out,'screenshots.json'),JSON.stringify([{"step":1,"file":"01-forest.png","goal":"Find a real entrance in the five themes"},{"step":2,"file":"02-first-connection.png","goal":"Walk a real prerequisite connection"},{"step":3,"file":"03-fork.png","goal":"Observe two outgoing branches"},{"step":4,"file":"04-merge.png","goal":"Observe two incoming prerequisites"},{"step":5,"file":"05-free-choice.png","goal":"Choose a real outgoing connection independently"}],null,2));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,childTrial:false,guide:5,visibleNodes:537},null,2));
  console.log(JSON.stringify({passed:checks.length,errors}));
 }catch(e){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,failed:String(e),childTrial:false},null,2));console.error(e.stack);process.exitCode=1;}
 finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
