// #378 B02/B27: real paper design, prediction, fold, correction and rotation.
// No seeded task positions, saved work, or new mathematical grading.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/net-representation');
const base='http://127.0.0.1:43827/',checks=[],errors=[],observations=[],remote=[];
const ok=(v,m)=>{assert.ok(v,m);checks.push(m);};
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const provenance={testedCheckoutSha:sha,headSha:event.pull_request?.head?.sha||sha,viewport:[1920,1080],seededWork:false};
fs.mkdirSync(out,{recursive:true});
let browser,context,page,label='setup';
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({provenance,checks,errors,observations,remote},null,2)+'\n');
async function main(){
 execFileSync(process.execPath,['--test','tests/phase4-b02.test.mjs','tests/phase5-b27.test.mjs'],{cwd:root,stdio:'inherit'});
 const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');await ensureB39Ready();
 const {TASKS,PRACTICE,inspect,validModel}=await import('../dist/learning/tasks.js');
 const {BRIDGES,sessionTasks}=await import('../dist/learning/bridges.js');
 const {NETS,foldedNet}=await import('../dist/learning/phase4/geometry.js');
 const {NET_FACE_COLORS}=await import('../dist/learning/phase4/b02-view.js');
 const inv=[...Object.entries(TASKS).flatMap(([id,ts])=>ts.map((t,index)=>({kind:'native',id,index,t}))),...Object.entries(PRACTICE).map(([id,t])=>({kind:'practice',id,index:-1,t})),...Object.values(BRIDGES).flatMap(b=>b.tasks.map((t,index)=>({kind:'bridge',id:b.id,index,t})))].filter(x=>['x-net','x-g27-net'].includes(x.t.type));
 console.log('NET_REPRESENTATION_INVENTORY '+JSON.stringify(inv.map(({kind,id,index,t})=>({kind,id,index,type:t.type,preset:!!t.preset,draw:!!t.draw}))));
 browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const x=(name,suffix='')=>page.locator('[data-x="'+name+'"]'+suffix),action=name=>page.locator('#actions [data-do="'+name+'"]'),field=key=>page.locator('[data-xfield="'+key+'"]');
 const record=id=>page.evaluate(async id=>{const {readStored}=await import('./storage.js');const s=JSON.parse(readStored('math-explorer-v2'));return s.lessons[id]||s.daily.bridges[id];},id);
 const model=async(id,index)=>(await record(id)).models[index],snap=()=>page.evaluate(()=>window.mathLesson.snapshot());
 const wait=(id,index,view='task')=>page.waitForFunction(({id,index,view})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view===view&&document.querySelector('#storage-warning')?.hidden===true;},{id,index,view},{timeout:60000});
 const put=async(key,value)=>{const el=field(key);if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(value));else await el.fill(String(value));};
 const open=async id=>{
  await context?.close();context=await newDesktopContext(browser,{reducedMotion:'reduce'});
  context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
  page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push({label,error:String(e)}));
  const response=await page.goto(base+'learn.html?net-review='+encodeURIComponent(id)+'#'+id);ok(response?.ok()===true,id+' loaded');await wait(id,0);
  assert.equal((await record(id)).cases[0]?.attempts?.length||0,0);
 };
 const shot=async(name,data)=>{observations.push({label,name,...data});console.log('NET_REPRESENTATION_OBSERVATION '+JSON.stringify(observations.at(-1)));await page.screenshot({path:path.join(out,label.replace(':','-')+'-'+name+'.png'),fullPage:true});};
 const reload=async(id,index)=>{const before=await record(id);await page.reload();await wait(id,index);const after=await record(id);for(const k of ['models','cases','notes','draft'])assert.deepEqual(after[k],before[k]);};
 const check=async(id,index,correct)=>{
  const before=await record(id),t=sessionTasks(id)[index],m=before.models[index];
  assert.ok(validModel(t,m));assert.equal(inspect(t,m).correct,correct);
  await action('check').click();const after=await record(id),attempts=after.cases[index].attempts;
  assert.deepEqual(attempts.slice(0,-1),before.cases[index]?.attempts||[]);assert.deepEqual(attempts.at(-1).value,m);
  assert.equal((await snap()).summary.cases[index].complete,correct);
  if(correct)ok(await action('next').isEnabled(),label+' original Next available');else assert.equal(await action('next').count(),0);
 };
 const next=async(id,index)=>{await action('next').click();await wait(id,index===sessionTasks(id).length-1?index:index+1,index===sessionTasks(id).length-1?'summary':'task');};
 const layout=async()=>{
  const paper=page.locator('.x-net-paper'),preview=page.locator('.x-net-preview'),canvas=page.locator('#extra-world canvas');
  ok(await paper.isVisible()&&await preview.isVisible()&&await canvas.isVisible(),label+' two labelled representations');
  assert.equal(await canvas.count(),1);assert.equal(await page.locator('#extra-world').count(),1);
  const p=await paper.boundingBox(),v=await preview.boundingBox(),c=await canvas.boundingBox();
  ok(c.width>=160&&c.height>=150,label+' visible WebGL area');
  ok(p.x+p.width<=v.x+1||p.y+p.height<=v.y+1,label+' representations do not overlap');
  const faces=await page.locator('[data-net-face]').evaluateAll(els=>els.map(e=>({face:e.dataset.netFace,color:e.style.getPropertyValue('--net-face'),label:e.getAttribute('aria-label'),disabled:e.disabled})).sort((a,b)=>a.face.localeCompare(b.face)));
  for(const f of faces){const i=f.face.charCodeAt(0)-65;assert.equal(f.color,'#'+NET_FACE_COLORS[i].toString(16).padStart(6,'0'));assert.match(f.label,new RegExp(f.face));}
  return {paper:p,preview:v,canvas:c,faces};
 };
 async function net(id,index){
  label=id+':'+index;const t=sessionTasks(id)[index];assert.equal(t.type,'x-net');
  if(t.draw){
   assert.equal((await model(id,index)).cells.length,0);ok(await x('fold').isDisabled(),'cannot fold empty paper');
   for(const[c,r]of NETS.cross)await x('net-cell','[data-col="'+c+'"][data-row="'+r+'"]').click();
   const c=NETS.cross[0];await x('net-cell','[data-col="'+c[0]+'"][data-row="'+c[1]+'"]').click();assert.equal((await model(id,index)).cells.length,5);
   await x('net-cell','[data-col="'+c[0]+'"][data-row="'+c[1]+'"]').click();
  }
  const m=await model(id,index),f=foldedNet(m.cells),first=await layout();assert.equal(first.faces.length,6);
  ok(await field('pair.0').isHidden(),'no forced pair before choosing a prediction');
  // Both branches depend on the learner's choice rather than the net's truth.
  await x('guess','[data-value="true"]').click();ok(await field('pair.0').isVisible(),'positive prediction shows pair');
  if(!f.valid){await put('pair.0',0);await put('pair.1',2);}
  await x('guess','[data-value="false"]').click();ok(await field('pair.0').isHidden(),'negative prediction collapses pair');
  const optional=page.locator('[data-net-pair-optional]');await optional.locator('summary').click();
  ok(await field('pair.0').isVisible(),'original optional pair fields remain reachable');
  await optional.locator('summary').click();
  await x('guess','[data-value="'+f.valid+'"]').click();
  if(f.valid){
   await put('pair.0',f.opposite[0][0]);await put('pair.1',f.opposite[0][1]);
  }
  await put('why','我的试折记录');
  const before=await model(id,index);await shot('prediction',{validNet:f.valid,prediction:before.guess,layout:await layout()});
  await x('fold').click();let after=await model(id,index);assert.equal(after.fold,100);assert.equal(after.runs.length,before.runs.length+1);
  assert.deepEqual(after.runs.at(-1),{cells:before.cells,guess:before.guess,pair:before.pair,why:before.why});
  ok(await field('pair.0').isDisabled(),'committed opposite prediction cannot be edited during fold');
  await field('fold').press('Home');await field('fold').press('ArrowRight');
  assert.equal((await model(id,index)).fold,1);
  assert.deepEqual((await model(id,index)).runs,after.runs);
  await shot('partial',{fold:1,layout:await layout()});
  const camera=(await snap()).extra.camera;await x('turn-extra').click();assert.notDeepEqual((await snap()).extra.camera,camera);
  await field('fold').press('End');assert.equal((await model(id,index)).fold,100);
  // Test original incorrect response before correcting; never silently fill.
  if(f.valid){await put('counts.faces',5);await put('counts.edges',12);await put('counts.vertices',8);}
  else await put('reason','six');
  await check(id,index,false);
  if(f.valid)await put('counts.faces',6);else await put('reason','overlap');
  await check(id,index,true);
  await shot('checked',{validNet:f.valid,layout:await layout(),attempts:(await record(id)).cases[index].attempts.length});
  await reload(id,index);assert.equal((await snap()).summary.cases[index].complete,true);
  await next(id,index);
 }
 await open('nets');for(let i=0;i<3;i++)await net('nets',i);
 await open('foldprism');await net('foldprism',0);
 // B27 triangular-prism interaction is unchanged; confirm it still supports
 // a missing-piece prediction, actual folding, correction and rotation.
 label='foldprism:1';let t=sessionTasks('foldprism')[1];assert.equal(t.type,'x-g27-net');
 await x('g27-predict','[data-index="no"]').click();await x('g27-fold').click();
 assert.equal((await model('foldprism',1)).board.fold,100);
 await check('foldprism',1,false);
 await x('g27-unfold').click();for(let i=0;i<4;i++)await x('g27-piece','[data-index="'+i+'"]').click();
 await x('g27-predict','[data-index="yes"]').click();await x('g27-fold').click();await x('turn-extra').click();
 const prism=await model('foldprism',1);assert.equal(prism.board.parts.length,4);assert.equal(prism.board.fold,100);assert.equal(prism.board.turned,true);
 await check('foldprism',1,true);await shot('prism-regression',{parts:prism.board.parts,fold:prism.board.fold,turned:prism.board.turned});
 await reload('foldprism',1);await next('foldprism',1);
 await open('link-nets-solidpictures');await net('link-nets-solidpictures',0);
 ok(errors.length===0,'no page errors');ok(remote.length===0,'no remote requests');save();
 console.log('NET_REPRESENTATION_OK '+JSON.stringify({provenance,checks:checks.length,observations:observations.length,configuredPositions:inv.length,nativeNetPositions:4,bridgeNetPositions:1,prismRegression:1,originalGradingPreserved:true}));
}
main().catch(async e=>{errors.push({label,error:String(e.stack||e)});if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});save();console.error('NET_REPRESENTATION_FAILED '+JSON.stringify(errors));process.exitCode=1;}).finally(async()=>{await context?.close();await browser?.close();});
