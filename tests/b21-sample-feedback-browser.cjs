// #378: native sample manipulations through the real UI; no seeded answers,
// positions, or stored work. Run maintained B21 Node regressions independently
// of the unavailable historical archive gate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/b21-sample-feedback');
const base='http://127.0.0.1:43827/';
const checks=[],errors=[],observations=[],remote=[];
const ok=(v,m)=>{assert.ok(v,m);checks.push(m);};
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const provenance={testedCheckoutSha:sha,headSha:event.pull_request?.head?.sha||sha,viewport:[1920,1080],seededWork:false};
fs.mkdirSync(out,{recursive:true});
let browser,context,page,label='setup';
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({provenance,checks,errors,observations,remote},null,2)+'\n');
async function main(){
 execFileSync(process.execPath,['--test','tests/phase5-b21.test.mjs'],{cwd:root,stdio:'inherit'});
 const M=await import('../dist/learning/phase5/b21-model.js');
 const {TASKS,PRACTICE,BRIDGES}=await import('../dist/learning/phase5/b21.js');
 const {sessionTasks}=await import('../dist/learning/bridges.js');
 const inventory=[...Object.entries(TASKS).flatMap(([id,ts])=>ts.map((t,index)=>({kind:'native',id,index,t}))),...Object.entries(PRACTICE).map(([id,t])=>({kind:'practice',id,index:-1,t})),...BRIDGES.flatMap(b=>b.tasks.map((t,index)=>({kind:'bridge',id:'link-'+b.from+'-'+b.to,index,t})))].filter(x=>x.t.type==='x-samplelab');
 console.log('B21_SAMPLE_INVENTORY '+JSON.stringify(inventory.map(({kind,id,index,t})=>({kind,id,index,mode:t.mode,profile:t.profile||null,runs:t.runs,groupGoal:!!t.questions?.some(q=>(Array.isArray(q.value)?q.value.includes('frame'):q.value==='frame'))}))));
 browser=await chromium.launch({headless:true,...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const x=name=>page.locator('[data-x="b21-'+name+'"]'),action=name=>page.locator('#actions [data-do="'+name+'"]'),field=key=>page.locator('[data-xfield="'+key+'"]');
 const record=id=>page.evaluate(async id=>{const {readStored}=await import('./storage.js');const s=JSON.parse(readStored('math-explorer-v2'));return s.lessons[id]||s.daily.bridges[id];},id);
 const model=async(id,index)=>(await record(id)).models[index];
 const wait=(id,index,view='task')=>page.waitForFunction(({id,index,view})=>{const s=window.mathLesson?.snapshot();return s?.id===id&&s.index===index&&s.view===view&&document.querySelector('#storage-warning')?.hidden===true;},{id,index,view},{timeout:60000});
 const put=async(key,value)=>{const el=field(key);if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(value));else await el.fill(String(value));};
 const open=async id=>{
  await context?.close();context=await newDesktopContext(browser,{reducedMotion:'reduce'});
  context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
  page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push({label,error:String(e)}));
  const response=await page.goto(base+'learn.html?b21-feedback='+encodeURIComponent(id)+'#'+id);
  ok(response?.ok()===true,id+' loaded');await wait(id,0);
  assert.equal((await record(id)).cases[0]?.attempts?.length||0,0);
 };
 const snapshot=async(name,data)=>{observations.push({label,name,...data});console.log('B21_SAMPLE_OBSERVATION '+JSON.stringify(observations.at(-1)));await page.screenshot({path:path.join(out,label.replace(':','-')+'-'+name+'.png'),fullPage:true});};
 const reload=async(id,index)=>{
  const before=await record(id);await page.reload();await wait(id,index);
  const after=await record(id);for(const k of ['models','cases','notes','draft'])assert.deepEqual(after[k],before[k],label+' reload preserves '+k);
 };
 async function verify(id,index){
  label=id+':'+index;const t=sessionTasks(id)[index];assert.equal(t.type,'x-samplelab');
  const group=!!(t.mode==='proportion'&&t.questions?.some(q=>(Array.isArray(q.value)?q.value.includes('frame'):q.value==='frame')));
  if(id==='fairdraw'&&index===2)assert.equal(group,true,'actual group-imbalance task must retain visible groups');
  if(id==='samplevary')assert.equal(group,false,'sample variability does not require A/B context');
  const club=t.profile==='exercise'&&t.methods.includes('club');
  const formula=t.mode==='proportion'?/步行人数÷本次抽到的总人数×100/:/本次记录的总量÷本次抽到的人数/;
  ok((await page.locator('[data-b21-group-summary]').count()>0)===group,label+' initial context matches source goal');
  for(let j=0;j<t.runs;j++){
   const before=await model(id,index),expected=M.draw(t,before.board.seed,t.sizes?.[j]||t.n,t.methods[Math.min(j,t.methods.length-1)]);
   await x('draw').click();const drawn=await model(id,index),pending=drawn.board.pending;
   assert.deepEqual(pending,expected);assert.equal(new Set(pending.ids).size,pending.n);
   const count=pending.values.reduce((a,b)=>a+b,0),value=M.round1(count/pending.n*(t.mode==='proportion'?100:1));
   assert.match(await page.locator('[data-b21-sample-formula]').innerText(),formula);
   assert.match(await page.locator('[data-b21-sample-value]').innerText(),new RegExp(String(count)));
   ok((await page.locator('[data-b21-group-summary]').count()>0)===group,label+' actual draw context');
   ok((await page.locator('[data-b21-club-summary]').count()>0)===club,label+' club context');
   if(j===0){
    assert.equal(await x('draw').count(),0,'cannot redraw pending sample');
    await put('estimate',value+1);await x('record').click();
    const bad=await model(id,index);const hint=await page.locator('.b21-issue').innerText();
    assert.match(hint,formula);assert.doesNotMatch(hint,t.mode==='proportion'?/总量÷份数|平均值/:/×100|百分比/);
    assert.deepEqual(bad.board.pending,pending);assert.equal(bad.board.seed,drawn.board.seed);assert.equal(bad.board.runs.length,0);assert.ok(!M.inspect(t,bad).correct);
    const raw=page.locator('[data-b21-raw-sample]');assert.ok(await raw.locator(':scope > summary').isVisible());assert.equal(await raw.locator('tbody tr').count(),pending.n);
    if(!group)assert.equal(await raw.getAttribute('open'),null,'irrelevant group evidence is collapsed');
    await snapshot('wrong-estimate',{mode:t.mode,profile:t.profile||null,group,club,hint,n:pending.n,ids:pending.ids,values:pending.values});
    await reload(id,index);assert.match(await page.locator('.b21-issue').innerText(),formula);
   }
   const pre=await model(id,index);await put('estimate',value);await x('record').click();
   const after=await model(id,index);assert.equal(after.board.pending,null);assert.equal(after.board.runs.length,j+1);assert.deepEqual(after.board.runs[j],{...pending,estimate:value});
   assert.deepEqual(after.history.slice(0,-1),pre.history);assert.equal(after.issue,'');assert.ok(M.valid(t,after));
   ok(await page.locator('.b21-issue').count()===0,label+' corrected record clears feedback');
  }
  const m=await model(id,index);
  if(t.compareSizes){
   const a=m.board.runs.slice(0,5).map(r=>r.estimate),b=m.board.runs.slice(5).map(r=>r.estimate);
   for(const[k,v]of Object.entries({lowA:Math.min(...a),highA:Math.max(...a),lowB:Math.min(...b),highB:Math.max(...b)}))await put(k,v);
  }
  for(const[i,q]of (t.questions||[]).entries())await put('answers.'+i,Array.isArray(q.value)?q.value[0]:q.value);
  const original=await model(id,index);assert.ok(M.inspect(t,original).correct,label+' original grade');
  const before=await record(id);await action('check').click();const after=await record(id),attempts=after.cases[index].attempts;
  assert.equal(attempts.length,(before.cases[index]?.attempts?.length||0)+1);assert.deepEqual(attempts.at(-1).value,original);
  assert.equal((await page.evaluate(()=>window.mathLesson.snapshot())).summary.cases[index].complete,true);
  ok(await action('next').isEnabled(),label+' actual Next');
  await snapshot('checked',{mode:t.mode,profile:t.profile||null,runs:original.board.runs.length,correct:true});
  await reload(id,index);await action('next').click();
  await wait(id,index===sessionTasks(id).length-1?index:index+1,index===sessionTasks(id).length-1?'summary':'task');
 }
 for(const id of ['samplevary','fairdraw','link-fairdraw-medialens']){
  await open(id);
  const ts=sessionTasks(id);for(let i=0;i<ts.length&&ts[i].type==='x-samplelab';i++)await verify(id,i);
 }
 ok(!errors.length,'no page errors');ok(!remote.length,'no remote requests');save();
 console.log('B21_SAMPLE_FEEDBACK_OK '+JSON.stringify({provenance,checks:checks.length,observations:observations.length,configuredSamplePositions:inventory.length,actualSamplePositions:observations.filter(o=>o.name==='checked').length,modelAndGradePreserved:true}));
}
main().catch(async e=>{errors.push({label,error:String(e.stack||e)});if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});save();console.error('B21_SAMPLE_FEEDBACK_FAILED '+JSON.stringify(errors));process.exitCode=1;}).finally(async()=>{await context?.close();await browser?.close();});
