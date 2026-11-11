// P8: actual visible 3D labels are the node selection events, not hash mutations.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p8-mode-clicks');
const check=(v,m)=>{if(!v)throw Error(m);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[],checks=[];
 page.on('pageerror',err=>errors.push(String(err)));
 const nav=m=>page.locator('.primary-nav [data-action="nav-'+m+'"]');
 const state=()=>page.evaluate(()=>({
  mode:document.querySelector('.primary-nav [aria-pressed="true"]')?.dataset.surface,
  urlMode:new URL(location.href).searchParams.get('surface')||'explore',
  selected:mathSpace.snapshot().selected,
  journey:!document.querySelector('#journey-surface').hidden,
  trail:!document.querySelector('#utility-drawer').hidden&&document.querySelector('#utility-drawer').dataset.surface==='trail',
  iframe:document.querySelector('#journey-frame').contentWindow.location.href,
  title:document.querySelector('#trail-node-context .trail-node-heading strong')?.textContent,
  summary:document.querySelector('#trail-node-context')?.textContent,
  camera:mathSpace.snapshot().position
 }));
 const verify=async(label,mode,node)=>{
  let s=await state();check(s.mode===mode&&s.urlMode===mode&&(!node||s.selected===node),'mode/node mismatch '+label+': '+JSON.stringify(s));
  checks.push({label,mode,node:s.selected,task:s.iframe,trail:s.trail});
  return s;
 };
 const waitNativeTask=async key=>{
  const id=await page.evaluate(async key=>(await import('./learning/catalog.js')).lessonForTopic(key.slice(5)),key);
  check(!!id,'clicked node has an actual configured native lesson '+key);
  await page.waitForFunction(id=>{
   const f=document.querySelector('#journey-frame');
   return !document.querySelector('#journey-surface').hidden&&
     f.contentWindow.location.pathname.endsWith('/learn.html')&&
     f.contentWindow.location.hash==='#'+id&&
     !!f.contentDocument?.querySelector('#instruction')?.textContent.trim()&&
     !!f.contentDocument?.querySelector('#work');
  },id);
  check(await page.frameLocator('#journey-frame').locator('#work').isVisible(),'clicked node opened visible native workpiece '+key);
  return id;
 };
 const search=async id=>{
  await page.locator('[data-action="search"]').first().click();
  await page.locator('#search-input').fill(id);
  await page.locator('#search-results [data-key="node:'+id+'"]').click();
  await page.waitForFunction(key=>mathSpace.snapshot().selected===key,'node:'+id);
 };
 // Choose an actual unobscured on-screen source label. Only configured tasks
 // count as successful learn switching targets.
 const clickVisible=async({playable=false,excludeLesson=null}={})=>{
  const keys=await page.evaluate(async ({playable,excludeLesson})=>{
   const {lessonForTopic}=await import('./learning/catalog.js');
   return [...document.querySelectorAll('.space-label.node:not([hidden])')].filter(el=>{
    if(el.getAttribute('aria-pressed')==='true')return false;
    const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    if(r.width<5||r.height<5||x<4||y<4||x>innerWidth-4||y>innerHeight-4)return false;
    const top=document.elementFromPoint(x,y);
    const lesson=lessonForTopic(el.dataset.key.slice(5));
     return (top===el||el.contains(top))&&(!playable||!!lesson)&&(!excludeLesson||lesson!==excludeLesson);
   }).map(el=>el.dataset.key);
  },{playable,excludeLesson});
  check(keys.length>0,'no real visible clickable '+(playable?'configured':'source')+' node');
  const key=keys[0];await page.locator('.space-label.node[data-key="'+key+'"]').click();
  await page.waitForFunction(k=>mathSpace.snapshot().selected===k,key);
  return key;
 };
 try{
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53#space');
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  // Exploration detail -> learn, not the top Learn shortcut.
  await search('mt_ndGqFPWyen');
  let s=await verify('explore-search','explore','node:mt_ndGqFPWyen');
  const originalCamera=s.camera;
  await page.locator('#focus-card [data-action="open"]').first().click();
  await page.frameLocator('#journey-frame').locator('#instruction').waitFor();
  await verify('explore-details-open-learning','learn','node:mt_ndGqFPWyen');
  const nodeB=await clickVisible({playable:true});
  const lessonB=await waitNativeTask(nodeB);
  s=await verify('learning-click-real-label-B','learn',nodeB);
  check(s.journey&&s.iframe.endsWith('#'+lessonB),'visible 3D click must open its own native learning task');
  const next=await clickVisible({playable:true,excludeLesson:lessonB});
  const lessonC=await waitNativeTask(next);
  s=await verify('learning-click-real-label-C','learn',next);
  check(s.journey&&s.iframe.endsWith('#'+lessonC),'second real 3D node must open the newly selected task');
  // Consecutive iframe replacements must not steal the parent's Back/Forward.
  // The suspended lesson remains mounted, including unsaved in-memory work.
  await page.evaluate(()=>{document.querySelector('#journey-frame').contentWindow.__p8HistoryProbe='same-workpiece';});
  await page.goBack();
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('surface')===null);
  await verify('learning-multiple-clicks-back','explore',next);
  await page.goForward();
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('surface')==='learn');
  await waitNativeTask(next);
  check(await page.evaluate(()=>document.querySelector('#journey-frame').contentWindow.__p8HistoryProbe==='same-workpiece'),'mode Forward restores the same unsaved workpiece');
  await verify('learning-multiple-clicks-forward','learn',next);
  await page.screenshot({path:path.join(out,'01-learn-label-click-1440x900.png')});
  await nav('trail').click();s=await verify('learn-to-trail','trail',next);
  check(s.trail&&s.title,'trail must show this selected node');
  const trailNode=await clickVisible();
  s=await verify('trail-click-real-label','trail',trailNode);
  check(s.trail&&s.title,'trail summary must update for selected node');
  await page.screenshot({path:path.join(out,'02-trail-label-click-1440x900.png')});
  await nav('explore').click();
  await verify('trail-to-explore','explore',trailNode);
  await nav('learn').click();
  await verify('explore-to-learn','learn',trailNode);
  await page.goBack();
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('surface')===null);
  await verify('history-back','explore',trailNode);
  await page.goForward();
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('surface')==='learn');
  await verify('history-forward','learn',trailNode);
  await page.reload();
  await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
  await verify('refresh-retains-mode','learn',trailNode);
  await nav('trail').click();
  await page.setViewportSize({width:620,height:800});
  await page.screenshot({path:path.join(out,'03-trail-620x800.png')});
  await verify('narrow-trail','trail',trailNode);
  // Reproduce the reported VPS entry, including a retained historical iframe
  // and locally saved view state from preceding activities.
  const vpsEntry='mt_WcfaSfVT33';
  // Prior scenario ends at 620px, where the task drawer occupies the map.
  // Restore desktop geometry before testing genuine unobscured 3D labels.
  await page.setViewportSize({width:1440,height:900});
  await page.goto('http://127.0.0.1:43827/?world=network&layout=53&surface=trail#space/node/'+vpsEntry);
  await page.waitForFunction(id=>window.mathSpace?.snapshot()?.counts?.nodes===587&&
    window.mathSpace.snapshot().selected==='node:'+id&&
    document.querySelector('#utility-drawer')?.dataset.surface==='trail',vpsEntry);
  await page.waitForFunction(()=>document.querySelector('#utility-frame')?.contentWindow?.location.hash==='#trail');
  await verify('vps-deep-link-trail','trail','node:'+vpsEntry);
  const historicalFrame=await (await page.locator('#utility-frame').elementHandle()).contentFrame();
  await page.evaluate(()=>{
    window.__p8VpsProbe={};
    window.addEventListener('message',e=>{
      if(e.origin!==location.origin)return;
      if(e.data?.probe==='p8-hidden-utility')queueMicrotask(()=>window.__p8VpsProbe.utility=true);
      if(e.data?.probe==='p8-retired-lesson')queueMicrotask(()=>window.__p8VpsProbe.lesson=true);
    });
  });
  await nav('learn').click();
  await page.waitForFunction(()=>document.querySelector('.primary-nav [aria-pressed="true"]')?.dataset.surface==='learn');
  await verify('vps-trail-to-learn','learn','node:'+vpsEntry);
  // A queued click from the previously visible Trail iframe must not undo
  // the user's explicit Learn selection after that iframe was hidden.
  await historicalFrame.evaluate(id=>parent.postMessage({
    type:'math-space:navigate',kind:'node',id,probe:'p8-hidden-utility'
  },location.origin),vpsEntry);
  await page.waitForFunction(()=>window.__p8VpsProbe?.utility===true);
  await verify('vps-hidden-trail-message-does-not-explore','learn','node:'+vpsEntry);
  // The actual 3D label click must enter the selected node's task in Learn.
  const liveFirst=await clickVisible({playable:true});
  const liveFirstId=await waitNativeTask(liveFirst);
  await verify('vps-learn-first-3d-click','learn',liveFirst);
  const liveSecond=await clickVisible({playable:true,excludeLesson:liveFirstId});
  const liveSecondId=await waitNativeTask(liveSecond);
  check(liveSecondId!==liveFirstId,'live second 3D click must select a distinct lesson');
  await verify('vps-learn-second-3d-click','learn',liveSecond);
  // Retired embedded documents share the iframe WindowProxy. Their late
  // close messages must not terminate a newer selected lesson.
  const currentFrame=await (await page.locator('#journey-frame').elementHandle()).contentFrame();
  await currentFrame.evaluate(retired=>parent.postMessage({
    type:'math-space:lesson-close',sessionId:retired,probe:'p8-retired-lesson'
  },location.origin),liveFirstId);
  await page.waitForFunction(()=>window.__p8VpsProbe?.lesson===true);
  await verify('vps-retired-lesson-close-does-not-explore','learn',liveSecond);
  check((await state()).journey,'stale lesson-close cannot hide current workpiece');
  // The fixed learning UI owns a visible parent return button; the legacy
  // child #back link is intentionally hidden in embedded mode.
  await page.locator('#journey-surface [data-action="close-journey"]').click();
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('surface')===null);
  await verify('vps-explicit-lesson-exit','explore',liveSecond);
  // A close message from the *active* embedded lesson must still be accepted.
  await nav('learn').click();
  await waitNativeTask(liveSecond);
  await verify('vps-reopened-active-lesson','learn',liveSecond);
  const currentLessonFrame=await (await page.locator('#journey-frame').elementHandle()).contentFrame();
  await currentLessonFrame.evaluate(id=>parent.postMessage({
    type:'math-space:lesson-close',sessionId:id
  },location.origin),liveSecondId);
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('surface')===null);
  await verify('vps-current-lesson-close-succeeds','explore',liveSecond);
  check(errors.length===0,'runtime errors '+errors.join('; '));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,macVerified:false},null,2));
  console.log('P8_REAL_NODE_CLICKS_COMPLETE '+checks.length);
 }catch(e){
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({checks,errors,error:String(e.stack||e)},null,2));
  console.error('P8_REAL_NODE_CLICKS_FAILURE '+(e.stack||e));
  await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
