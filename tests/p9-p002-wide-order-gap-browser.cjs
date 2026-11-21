'use strict';
// #342 P002 candidate-only original B08 control Chromium check. Never grants A.
// Run against actual checkout; raw results / PNG and recorded failure are retained.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-p002-wide-order-gap');
const cases=[
 {id:'placeproblems',index:1,order:[1,0,2],gap:500},
 {id:'bigproblems',index:2,order:[3,0,2,1,4],gap:67000}
];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const checks=[],errors=[],captures=[],screenshots=[];
let stage='startup';
const ok=(v,s)=>{assert.ok(v,stage+': '+s);checks.push(stage+': '+s);};
function persist(){
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p002-wide-order-gap-candidate/1',
  provenance:{repo:'runlinx-eng/math',issue:342,headSha:sha,testedCheckoutSha:sha,
   runId:process.env.GITHUB_RUN_ID||null,originalControls:true,strictAApproved:false,
   seededCorrectWork:false,childTrial:false,learnerMasteryAssessed:false},
  viewport:STANDARD_DESKTOP_VIEWPORT,checks,errors,captures,screenshots
 },null,2)+'\n');
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 let origin,browser,ctx,page;
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
    ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  ctx=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'allow',acceptDownloads:true});
  page=await ctx.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(stage+': '+String(e)));
  const release=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
  await page.goto(origin.base+'v2.html#trail');
  await page.locator('#main [data-do="export"]').first().waitFor();
  await warmAndStop(page,origin,release,ok,stage);
  const reveal=async locator=>{
   for(let tries=0;tries<10&&!(await locator.isVisible());tries++){
    const ancestor=locator.locator('xpath=ancestor::details[not(@open) and not(ancestor::details[not(@open)])]');
    assert.equal(await ancestor.count(),1,'one closed details ancestor');
    await ancestor.locator(':scope > summary').click();
   }
   assert.ok(await locator.isVisible(),'visible original control');
  };
  const act=async(index)=>{
   const control=page.locator('#extra-visual [data-x="wide-order"][data-index="'+index+'"]');
   assert.equal(await control.count(),1,'exact original order card');
   await reveal(control);await control.click();
  };
  const fill=async(field,value)=>{
   const control=page.locator('#extra-controls [data-xfield="'+field+'"]');
   assert.equal(await control.count(),1,'exact original field '+field);
   await reveal(control);
   if(await control.evaluate(e=>e.tagName)==='SELECT')await control.selectOption(String(value));
   else await control.fill(String(value));
  };
  const snap=async(c,phase)=>{
   stage=c.id+':'+c.index+':'+phase;
   const v=await capture(page,out,c.id+'-'+c.index,c,phase);
   captures.push({id:c.id,index:c.index,phase,attempts:v.attempts.length,history:v.model?.orderTrace,storage:v.storage});
   return v;
  };
  for(const c of cases){
   stage=c.id+':'+c.index+':open';
   await page.goto(origin.base+'learn.html#'+c.id);
   await page.reload();
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,c.id);
   const prior=await page.evaluate(async({id,index})=>{
    const {packText,unpackText}=await import('./storage.js');
    const raw=localStorage.getItem('math-explorer-v2');
    const state=JSON.parse(unpackText(raw));
    const lesson=state.lessons[id];
    if(!lesson||lesson.cases?.[index]?.attempts?.length)throw Error('target already has submissions');
    lesson.index=index;lesson.view='task';
    localStorage.setItem('math-explorer-v2',packText(JSON.stringify(state)));
    return lesson.cases[index]?.attempts?.length||0;
   },c);
   ok(prior===0,'target unsubmitted, only lesson navigation selected');
   await page.reload();
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,c.index);
   const task=await page.evaluate(async({id,index})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const t=sessionTaskFor(id,index);
    return {values:t.values,min:t.min,max:t.max,mode:t.mode,gap:t.gap};
   },c);
   ok(task.mode==='order'&&task.gap===true,'original order and exact gap task');
   ok(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),'original desktop viewport');
   ok(await page.locator('#thinking-feedback').count()===0,'candidate feedback remains unregistered');
   const correct=[...c.order],wrong=[correct[1],correct[0],...correct.slice(2)];
   for(const i of wrong)await act(i);
   // Original range sliders: final positions only; do not claim movement history.
   for(let i=0;i<task.values.length;i++){
    const ideal=Math.round((Number(task.values[i])-task.min)/(task.max-task.min)*1000);
    const slider=page.locator('#extra-controls [data-xfield="positions.'+i+'"]');
    assert.equal(await slider.count(),1);
    await reveal(slider);
    const box=await slider.boundingBox();assert.ok(box&&box.width>50);
    await slider.click({position:{x:Math.max(5,Math.min(box.width-5,8+ideal/1000*(box.width-16))),y:box.height/2}});
    const current=async()=>page.evaluate(async({id,index})=>{
     const {unpackText}=await import('./storage.js');
     const state=JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
     return state.lessons[id].models[index].positions;
    },c);
    let got=(await current())[i];
    for(let count=0;count<70&&Math.abs(got-ideal)>5;count++){
     await slider.press(got<ideal?'ArrowRight':'ArrowLeft');got=(await current())[i];
    }
    ok(Math.abs(got-ideal)<=6,'original slider final position '+i);
   }
   await fill('gap',String(c.gap));
   await reveal(page.locator('#actions [data-do="check"]'));
   await page.locator('#actions [data-do="check"]').click();
   const first=await snap(c,'wrong');
   ok(first.attempts.length===1,'first original Check saved');
   for(const i of wrong)await act(i);
   for(const i of correct)await act(i);
   await page.locator('#actions [data-do="check"]').click();
   const second=await snap(c,'correct');
   ok(second.attempts.length===2,'wrong -> correct preserved');
   const result=await page.evaluate(async({id,index,model,record})=>{
    const {sessionTaskFor}=await import('./learning/bridges.js');
    const {submittedWideOrderGapEvidence}=await import('./learning/p002-wide-order-gap-evidence.js');
    return submittedWideOrderGapEvidence(sessionTaskFor(id,index),model,record,{sessionId:id,index});
   },{...c,model:second.model,record:second.record});
   ok(result?.exactRange===String(c.gap)&&
     JSON.stringify(result.selectedSourceIndices)===JSON.stringify(correct),
     'source-bound independent range + trace candidate');
   ok(result.strictIncreasingFinalAxis===true&&
     result.sliderMovementChronologyObserved===false,'honest axis evidence scope');
   ok(await page.locator('#thinking-feedback').count()===0,'not registered as strict A');
   const filename=c.id+'-'+c.index+'-correct.png';
   await page.screenshot({path:path.join(out,filename),fullPage:false});
   screenshots.push(filename);
   await page.reload();
   await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,c.index);
   const restored=await snap(c,'reload');
   assert.deepEqual(restored.model,second.model);
   assert.deepEqual(restored.record,second.record);
   ok(true,'original State-v2 local reload preserved model and Check records');
  }
  ok(errors.length===0,'no uncaught browser exceptions');
  persist();
  console.log('P002_WIDE_ORDER_GAP_CANDIDATE_BROWSER_OK '+JSON.stringify({sha,checks:checks.length,strictAApproved:false}));
 }catch(e){
  errors.push(stage+': '+String(e));await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  persist();console.error(e.stack||String(e));process.exitCode=1;
 }finally{
  await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});
 }
}
if(require.main===module)main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
