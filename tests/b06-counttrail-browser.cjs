// #378: real native controls, from a fresh learner context. Diagnostic
// baseline only: do not repair a mismatch by changing task definitions,
// mathematical acceptance, or old learner records in the test.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/b06-counttrail');
const base=(process.env.MATH_B06_BASE||'http://127.0.0.1:43827/').replace(/\/?$/,'/');
const checks=[],errors=[],remote=[],observations=[];
const ok=(condition,message)=>{assert.ok(condition,message);checks.push(message);};
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const provenance={testedCheckoutSha:sha,headSha:event.pull_request?.head?.sha||sha,viewport:[1920,1080],seededLessonPositions:false,seededCorrectWork:false,scope:'B06 diagnosis, not child experience or a new mathematical grade'};
fs.mkdirSync(out,{recursive:true});
let browser,context,page,where='setup';
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({provenance,checks,errors,remote,observations},null,2)+'\n');
async function main(){
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {LESSONS}=await import('../dist/learning/catalog.js');
 const {BRIDGES,sessionTasks,sourceBridge}=await import('../dist/learning/bridges.js');
 const {TASKS,PRACTICE,defaultModel,validModel,inspect}=await import('../dist/learning/tasks.js');
 const {render}=await import('../dist/learning/phase5/b06-view.js');
 const atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'),'utf8'));
 const ids=Object.keys(LESSONS).filter(id=>LESSONS[id].batch==='B06');
 const links=Object.values(BRIDGES).filter(b=>b.batch==='B06');
 const inventory=[];
 const add=(kind,id,index,t,source)=>{
  const m=defaultModel(t),html=render(t,m);
  assert.ok(validModel(t,m),id+' initial model');
  inventory.push({kind,id,index,source,type:t.type,prompt:t.prompt,
   initialActions:[...new Set([...html.matchAll(/data-x="([^"]+)"/g)].map(x=>x[1]))],
   initialFields:[...new Set([...html.matchAll(/data-xfield="([^"]+)"/g)].map(x=>x[1]))],
   initialDeviceActions:[...new Set([...html.matchAll(/data-b6="([^"]+)"/g)].map(x=>x[1]))],
   initialModelKeys:Object.keys(m),initialInspect:inspect(t,m),
   status:'static inventory only; no UX verdict'});
 };
 for(const id of ids){for(const [index,t]of TASKS[id].entries())add('native',id,index,t,LESSONS[id].topicId);if(PRACTICE[id])add('practice',id,null,PRACTICE[id],LESSONS[id].topicId);}
 for(const b of links){assert.ok(sourceBridge(b.id,atlas));for(const [index,t]of b.tasks.entries())add('bridge',b.id,index,t,{from:LESSONS[b.from].topicId,to:LESSONS[b.to].topicId});}
 const native=inventory.filter(x=>x.kind==='native'),bridge=inventory.filter(x=>x.kind==='bridge'),practice=inventory.filter(x=>x.kind==='practice');
 assert.equal(ids.length,23);assert.equal(native.length,76);assert.equal(links.length,10);
 fs.writeFileSync(path.join(out,'initial-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
 console.log('B06_INITIAL_INVENTORY '+JSON.stringify({native:native.length,practice:practice.length,bridge:bridge.length,types:[...new Set(native.map(x=>x.type))],scope:'initial data/controls; not individual UX acceptance'}));
 const sameTask=(a,b)=>assert.deepEqual(a,b);
 sameTask(sessionTasks('lastcount')[1],sessionTasks('link-lastcount-manyfaces')[0]);
 const task=sessionTasks('lastcount')[1];
 assert.ok(task.recount&&task.rearrange&&task.layout==='circle');
 assert.match(task.prompt,/换个起点/);
 browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const act=name=>page.locator('[data-do="'+name+'"]');
 const x=(name,index)=>page.locator('[data-x="'+name+'"]'+(index===undefined?'':'[data-index="'+index+'"]'));
 const field=key=>page.locator('[data-xfield="'+key+'"]');
 const put=async(key,value)=>{
  const el=field(key);
  if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(value));
  else await el.fill(String(value));
 };
 const snapshot=()=>page.evaluate(()=>window.mathLesson.snapshot());
 // openLesson hides the loading notice without clearing its text. Only a
 // visible notice can block readiness. On failure capture the real page state.
 const wait=async(id,index,view='task')=>{
  try{
   await page.waitForFunction(({id,index,view})=>{
    const s=window.mathLesson?.snapshot(),notice=document.querySelector('#storage-warning');
    return s?.id===id&&s.index===index&&s.view===view&&notice?.hidden===true;
   },{id,index,view},{timeout:60000});
  }catch(error){
   const actual=await page.evaluate(()=>{
    const notice=document.querySelector('#storage-warning');
    return {url:location.href,snapshot:window.mathLesson?.snapshot()||null,notice:notice?{hidden:notice.hidden,text:notice.textContent}:null,title:document.querySelector('#title')?.textContent,instruction:document.querySelector('#instruction')?.textContent};
   }).catch(e=>({readError:String(e)}));
   throw Error('B06 readiness '+JSON.stringify({expected:{id,index,view},actual}),{cause:error});
  }
 };
 const record=id=>page.evaluate(async id=>{const {readStored}=await import('./storage.js');const state=JSON.parse(readStored('math-explorer-v2'));return state.lessons[id]||state.daily.bridges[id];},id);
 const model=async id=>{const r=await record(id);return r.models[r.index];};
 const shot=async name=>page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 const open=async id=>{
  await context?.close();context=await newDesktopContext(browser,{reducedMotion:'reduce'});
  context.on('request',req=>{if(/^https?:/.test(req.url())&&!req.url().startsWith(base))remote.push(req.url());});
  page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push({where,error:String(e)}));
  const response=await page.goto(base+'learn.html?b06-baseline='+encodeURIComponent(id)+'#'+id);
  ok(response?.ok()===true,id+' lesson document loaded');await wait(id,0);
  assert.equal((await record(id)).cases[0]?.attempts?.length||0,0);
  ok(await page.locator('#storage-warning').isHidden(),id+' starts in a fresh valid record');
 };
 const tap=async seq=>{for(const i of seq)await x('count-tap',i).click();};
 const check=async(id,expected)=>{
  const r=await record(id),before=r.cases[r.index]?.attempts||[];
  ok(await act('check').isEnabled(),where+' original Check reachable');
  await act('check').click();
  const after=await record(id),attempts=after.cases[r.index].attempts;
  assert.equal(attempts.length,before.length+1);
  assert.deepEqual(attempts.slice(0,-1),before);
  assert.equal((await snapshot()).summary.cases[r.index].complete,expected);
  if(expected)ok(await act('next').isEnabled(),where+' Next enabled after correct work');
  else assert.equal(await act('next').count(),0,where+' incorrect work cannot advance');
 };
 const next=async(id,index,view='task')=>{await act('next').click();await wait(id,index,view);};
 const reload=async(id,index,view='task')=>{
  const before=await record(id);await page.reload();await wait(id,index,view);const after=await record(id);
  for(const key of ['cases','models','notes','draft'])assert.deepEqual(after[key],before[key],where+' reload preserves '+key);
 };
 const positions=()=>page.locator('.b6-beads [data-x="count-tap"]').evaluateAll(els=>{const r=els[0].parentElement.getBoundingClientRect();return els.map(e=>{const b=e.getBoundingClientRect();return {id:Number(e.dataset.index),x:Math.round(b.left-r.left),y:Math.round(b.top-r.top)};});});
 const observe=async(id,label)=>{
  const data={id,label,index:(await snapshot()).index,prompt:await page.locator('#instruction').innerText(),layout:await page.locator('.b6-beads').getAttribute('class'),positions:await positions(),
   controls:await page.locator('#extra-controls').innerText(),model:await model(id),attempts:(await record(id)).cases[(await snapshot()).index]?.attempts?.length||0};
  observations.push(data);console.log('B06_COUNTTRAIL_OBSERVATION '+JSON.stringify(data));await shot(id+'-'+label);return data;
 };
 where='countonce:0';await open('countonce');
 await tap([0,1,2,2,3,4,5,6]);await put('total',7);
 await check('countonce',false);
 // Undo the erroneous sequence with the original reset, then count correctly.
 await x('count-reset').click();await tap([0,1,2,3,4,5,6]);await put('total',7);
 await check('countonce',true);await next('countonce',1);
 where='countonce:1';
 ok(await act('check').isDisabled(),'prior #376 requires watching and recounting');
 const puppet=page.locator('[data-b6="puppet-start"]');
 await page.evaluate(()=>{window.__b06Observed=[];const status=document.querySelector('[data-b6="puppet-status"]');new MutationObserver(()=>{if(status.textContent.startsWith('小木偶数到'))window.__b06Observed.push(document.querySelector('.b6-puppet-bead.puppet-active')?.dataset.index);}).observe(status,{childList:true,subtree:true,characterData:true});});
 await puppet.click();
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-x="count-error-bead"]')].length===6&&[...document.querySelectorAll('[data-x="count-error-bead"]')].every(e=>!e.disabled),null,{timeout:15000});
 assert.deepEqual(await page.evaluate(()=>window.__b06Observed),['0','1','2','2','3','4','5']);
 await x('count-error-bead',2).click();await tap([0,1,2,3,4,5]);await put('why','twice');
 assert.equal((await model('countonce')).total,6);await check('countonce',true);
 await next('countonce',1,'summary');await reload('countonce',1,'summary');
 where='lastcount:0';await open('lastcount');
 await tap([0,1,2,3,4,5,6]);await put('total',7);await put('prediction',7);
 await x('count-move').click();await put('after',7);await put('why','same');
 await check('lastcount',true);await next('lastcount',1);
 async function diagnose(id,index){
  where=id+':'+index;
  const start=await observe(id,'01-initial');
  assert.match(start.prompt,/换个起点/);
  assert.match(start.layout,/\bcircle\b/);
  assert.match(start.controls,/把位置打散/);
  assert.match(start.controls,/挪动后会有几个/);
  ok(await field('after').isVisible(),where+' second-total input is exposed before the first count');
  await x('count-move').click();assert.equal((await model(id)).moved,false,'visible move button silently does nothing on incomplete work');
  await tap([0,1,2,3,4,5]);await put('total',6);
  await x('count-move').click();assert.equal((await model(id)).moved,false,'first count alone cannot start the second count');
  const first=await observe(id,'02-counted-but-prediction-required');
  assert.deepEqual(first.model.taps,[0,1,2,3,4,5]);assert.equal(first.model.prediction,null);
  await put('prediction',6);await x('count-move').click();
  const second=await observe(id,'03-moved-before-recount');
  assert.equal(second.model.moved,true);assert.equal(second.model.before,6);assert.deepEqual(second.model.again,[]);
  assert.match(second.layout,/\bscatter\b/);
  ok(JSON.stringify(second.positions)!==JSON.stringify(first.positions),where+' actual bead positions changed, not just a new start');
  // The original predicate rejects an identical sequence even with the right
  // totals; it accepts a different sequence starting at the same bead.
  await tap([0,1,2,3,4,5]);await put('after',6);await put('why','same');await check(id,false);
  await observe(id,'04-same-order-rejected');
  for(let i=0;i<6;i++)await x('count-undo').click();
  await tap([0,2,1,3,4,5]);await put('after',6);await put('why','same');
  await check(id,true);
  const accepted=await observe(id,'05-same-start-different-order-accepted');
  assert.equal(accepted.model.again[0],accepted.model.taps[0]);
  assert.notDeepEqual(accepted.model.again,accepted.model.taps);
  await reload(id,index);assert.equal((await snapshot()).summary.cases[index].complete,true);
  console.log('B06_RECOUNT_BASELINE '+JSON.stringify({id,index,firstStart:accepted.model.taps[0],secondStart:accepted.model.again[0],differentOrderAccepted:true,sameOrderRejected:true,predictionGate:true,actualLayoutChanged:true,continuedFromActualWork:true}));
  await next(id,index+1);
 }
 await diagnose('lastcount',1);
 where='lastcount:2';
 await tap([0,1,2,3,4]);await put('total',5);await put('why','start');await check('lastcount',true);
 await next('lastcount',2,'summary');await reload('lastcount',2,'summary');
 where='link-lastcount-manyfaces:0';await open('link-lastcount-manyfaces');await diagnose('link-lastcount-manyfaces',0);
 ok(errors.length===0,'no page errors');ok(remote.length===0,'no remote requests');
 save();
 console.log('B06_COUNTTRAIL_BASELINE_OK '+JSON.stringify({provenance,checks:checks.length,observations:observations.length,nativeVerified:['countonce:0','countonce:1','lastcount:0','lastcount:1','lastcount:2'],bridgeVerified:['link-lastcount-manyfaces:0'],noSourceChanges:true}));
}
main().catch(async error=>{errors.push({where,error:String(error.stack||error)});if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});save();console.error('B06_COUNTTRAIL_BASELINE_FAILED '+JSON.stringify({where,errors}));process.exitCode=1;}).finally(async()=>{await context?.close();await browser?.close();});
