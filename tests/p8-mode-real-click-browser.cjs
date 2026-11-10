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
  iframe:document.querySelector('#journey-frame').getAttribute('src'),
  title:document.querySelector('#trail-node-context .trail-node-heading strong')?.textContent,
  summary:document.querySelector('#trail-node-context')?.textContent,
  camera:mathSpace.snapshot().position
 }));
 const verify=async(label,mode,node)=>{
  let s=await state();check(s.mode===mode&&s.urlMode===mode&&(!node||s.selected===node),'mode/node mismatch '+label+': '+JSON.stringify(s));
  checks.push({label,mode,node:s.selected,task:s.iframe,trail:s.trail});
  return s;
 };
 const search=async id=>{
  await page.locator('[data-action="search"]').first().click();
  await page.locator('#search-input').fill(id);
  await page.locator('#search-results [data-key="node:'+id+'"]').click();
  await page.waitForFunction(key=>mathSpace.snapshot().selected===key,'node:'+id);
 };
 // Choose an actual unobscured on-screen source label. Only configured tasks
 // count as successful learn switching targets.
 const clickVisible=async({playable=false}={})=>{
  const keys=await page.evaluate(async playable=>{
   const {lessonForTopic}=await import('./learning/catalog.js');
   return [...document.querySelectorAll('.space-label.node:not([hidden])')].filter(el=>{
    if(el.getAttribute('aria-pressed')==='true')return false;
    const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    if(r.width<5||r.height<5||x<4||y<4||x>innerWidth-4||y>innerHeight-4)return false;
    const top=document.elementFromPoint(x,y);
    return (top===el||el.contains(top))&&(!playable||!!lessonForTopic(el.dataset.key.slice(5)));
   }).map(el=>el.dataset.key);
  },playable);
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
  s=await verify('learning-click-real-label-B','learn',nodeB);
  check(s.journey&&s.iframe.includes('#'),'visible 3D click must open native learning task');
  await page.frameLocator('#journey-frame').locator('#instruction').waitFor();
  const next=await clickVisible({playable:true});
  s=await verify('learning-click-real-label-C','learn',next);
  check(s.journey,'second real 3D node must keep learning');
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
