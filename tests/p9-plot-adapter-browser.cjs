'use strict';
// Native 1920x1080 B28 plot evidence: all eleven reviewed source positions.
// Only an EMPTY lesson index is positioned. No solved state, answer, attempt,
// proof, or grade is inserted. Every record, dot, correction and Check uses UI.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/p9-plot-adapter');
const rows=[
 ['measureplot',0,[31,39,42,52],10,1,2,6,['2','2']],
 ['measureplot',1,[21,29,32,38,41],10,1,1,5,['2']],
 ['measureplot',2,[30,40,40,50],10,1,2,6,['5']],
 ['quarterplot',0,[35,41,44,48,52],16,4,8,14,['1']],
 ['quarterplot',1,[17,20,23,24],8,2,4,7,['2']],
 ['quarterplot',2,[32,36,40,44],16,4,8,12,['0.75']],
 ['eighthplot',0,[17,18,18,20],8,8,16,24,['0.375','9.125']],
 ['eighthplot',1,[1,2,3,4],8,8,0,8,['0.375','1.25']],
 ['eighthplot',2,[16,17,17,18],8,8,16,20,['2','8.5']],
 ['modmoney',2,[31,39,42,52],10,1,2,6,['2','2']],
 ['modelChoice38',2,[31,39,42,52],10,1,2,6,['2','2']]
].map(([id,index,raw,rawDen,den,start,end,answers])=>({id,index,raw,rawDen,den,start,end,answers}));
const errors=[],checks=[],captures=[],screenshots=[];
const proofContracts=['math','correction','persistence','negative','backup'];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 runId:process.env.GITHUB_RUN_ID||null,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
 seededLessonPositionOnly:true,seededCorrectWork:false,childTrial:false,masteryInferred:false};
const check=(value,label)=>{assert.ok(value,label);checks.push(label);};
const rounded=(r,den,rawDen)=>Math.floor(r*den/rawDen+0.5);
const key=r=>r.id+'-'+r.index;
function save(){fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
 schema:'math-p9-plot-browser/1',proofContracts,provenance,viewport:STANDARD_DESKTOP_VIEWPORT,
 errors,checks,captures,screenshots
},null,2)+'\n');}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 let browser,origin,context,page,label='begin';
 try{
  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  context=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'block'});
  page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push(String(error)));
  context.on('request',req=>{if(/^https?:/.test(req.url())&&!req.url().startsWith(origin.base))errors.push('external '+req.url());});
  const shot=async suffix=>{const file=label+'-'+suffix+'.png';await page.screenshot({path:path.join(out,file),fullPage:false});screenshots.push(file);};
  const click=async(selector)=>{
   if(selector.includes('m28-mark')||selector.includes('m28-unmark')){
    const details=page.locator('#extra-controls details').first();
    if(!await details.evaluate(el=>el.open))await details.locator('summary').click();
   }
   const loc=page.locator(selector);assert.equal(await loc.count(),1,selector);await loc.click();};
  const field=async(name,value)=>{const loc=page.locator('[data-xfield="'+name+'"]');assert.equal(await loc.count(),1,name);await loc.fill(String(value));};
  const captureNow=async(phase,row)=>{const item=await capture(page,out,key(row),row,phase);captures.push({
   id:row.id,index:row.index,phase,storage:item.storage,attempts:item.attempts.length,
   board:item.model?.board,issue:item.model?.issue,
  });return item;};
  for(const row of rows){
   label=key(row);
   const roundedReadings=row.raw.map(x=>rounded(x,row.den,row.rawDen));
   const frequencies=Array(row.end-row.start+1).fill(0);
   for(const v of roundedReadings){check(v>=row.start&&v<=row.end,label+' tick within scale');frequencies[v-row.start]++;}
   check(frequencies.reduce((a,b)=>a+b,0)===row.raw.length,label+' each source reading counted once');
   await page.goto(origin.base+'learn.html#'+row.id,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
   await page.reload();await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,row.id);
   // Only navigate an empty original lesson to its reviewed native index.
   await page.evaluate(({id,index})=>{
    const state=JSON.parse(localStorage.getItem('math-explorer-v2'));
    if(!state.lessons[id])throw Error('Expected an existing empty native lesson '+id);
    state.lessons[id].index=index;state.lessons[id].view='task';
    localStorage.setItem('math-explorer-v2',JSON.stringify(state));
   },row);
   await page.reload();
   await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   check(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),label+' 1920x1080');
   await shot('initial');
   const feedback=page.locator('#thinking-feedback');
   check(await feedback.count()===0,label+' no premature feedback');
   // Observable first wrong reading survives subsequent correction and Check.
   await field('measure','999');await click('[data-x="m28-record"]');
   const bad=await captureNow('wrong-reading',row);
   check(bad.model.board.bad===true,label+' first wrong recorded');
   check(bad.model.board.first.measurement0==='999',label+' raw first wrong preserved');
   await click('#actions [data-do="check"]');
   check(await feedback.count()===0,label+' failed check gives no bounded evidence');
   // Add and retract an incorrect dot without changing the original raw task.
   await click('[data-x="m28-mark"][data-index="0"]');
   await click('[data-x="m28-unmark"][data-index="0"]');
   for(let i=0;i<row.raw.length;i++){
    await click('[data-x="m28-select"][data-index="'+i+'"]');
    await field('measure',String(roundedReadings[i]/row.den));
    await click('[data-x="m28-record"]');
   }
   const recorded=await captureNow('all-readings',row);
   check(recorded.model.board.records.length===row.raw.length&&
    recorded.model.board.records.every(x=>x!==null),label+' all readings actually saved');
   for(let i=0;i<frequencies.length;i++)for(let j=0;j<frequencies[i];j++)
    await click('[data-x="m28-mark"][data-index="'+i+'"]');
   for(let i=0;i<row.answers.length;i++)await field('answers.'+i,row.answers[i]);
   const pending=await captureNow('correct-unsubmitted',row);
   check(JSON.stringify(pending.model.board.marks)===JSON.stringify(frequencies),label+' UI dot frequencies');
   check(await feedback.count()===0,label+' complete work is not yet submitted');
   await click('#actions [data-do="check"]');
   check(await feedback.isVisible(),label+' current exact checked work receives feedback');
   const observed=await feedback.innerText();
   check(observed.includes('重复长度')&&observed.includes('刻度'),label+' honest bounded dot feedback');
   const done=await captureNow('correct-submitted',row);
   check(done.attempts.length>=2,label+' wrong Check and corrected Check both retained');
   await shot('checked');
   await page.reload();await page.waitForFunction(index=>window.mathLesson?.snapshot()?.index===index,row.index);
   check(await feedback.isVisible(),label+' proof survives actual persistence');
   const reloaded=await captureNow('reloaded',row);
   check(JSON.stringify(reloaded.model)===JSON.stringify(done.model),label+' full model persisted');
   check(JSON.stringify(reloaded.record)===JSON.stringify(done.record),label+' original attempts persisted');
   // Real unsaved edit must revoke a previously checked proof.
   await field('answers.0','999');
   check(await feedback.count()===0,label+' stale evidence withheld on edit');
   await field('answers.0',row.answers[0]);await click('#actions [data-do="check"]');
   check(await feedback.isVisible(),label+' current recheck restores evidence');
   await shot('rechecked');
  }
  // A real native V2 download and file-chooser import, not JSON injection.
  label='native-v2-restore';
  await page.goto(origin.base+'v2.html#trail');
  const sourceState=await page.evaluate(async()=>{
   const {unpackText}=await import('./storage.js');
   return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
  });
  const downloadEvent=page.waitForEvent('download');
  await click('#main [data-do="export"]');
  const download=await downloadEvent,bytes=fs.readFileSync(await download.path());
  const backup=JSON.parse(bytes.toString('utf8'));
  check(backup.app==='math-explorer'&&backup.version===2,'official V2 backup envelope');
  check(JSON.stringify(backup.state)===JSON.stringify(sourceState),'downloaded native V2 matches completed work');
  fs.writeFileSync(path.join(out,'actual-native-v2.json'),bytes);
  const restoredContext=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:true});
  const restoredPage=await restoredContext.newPage();
  restoredPage.setDefaultTimeout(20000);
  restoredPage.on('pageerror',e=>errors.push('restore page: '+String(e)));
  try{
   await restoredPage.goto(origin.base+'v2.html#trail');
   const empty=await restoredPage.evaluate(async()=>{
    const {unpackText}=await import('./storage.js');
    return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   });
   check(Object.keys(empty.lessons).length===0,'native restore starts from blank context');
   const importFile=async(payload,name)=>{
    const chooser=restoredPage.waitForEvent('filechooser');
    await restoredPage.locator('#main [data-do="import"]').first().click();
    (await chooser).setFiles({name,mimeType:'application/json',buffer:payload});
    await restoredPage.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
    return restoredPage.locator('#toast').innerText();
   };
   const raw=()=>restoredPage.evaluate(()=>localStorage.getItem('math-explorer-v2'));
   check((await importFile(bytes,'plot-native.json')).includes('备份已合并'),'native file chooser import succeeded');
   const importedRaw=await raw();
   const imported=await restoredPage.evaluate(async()=>{
    const {unpackText}=await import('./storage.js');
    return JSON.parse(unpackText(localStorage.getItem('math-explorer-v2')));
   });
   check(JSON.stringify(imported)===JSON.stringify(backup.state),'native V2 restored complete original state');
   check((await importFile(bytes,'plot-native-repeat.json')).includes('备份已合并'),'native repeated import processed');
   check(await raw()===importedRaw,'repeated native V2 import is byte-idempotent');
   check(!(await importFile(Buffer.from('{'),'plot-corrupt.json')).includes('备份已合并'),'bad V2 package rejected');
   check(await raw()===importedRaw,'bad import preserves all original state bytes');
   await restoredPage.screenshot({path:path.join(out,'native-v2-restored.png'),fullPage:false});
   screenshots.push('native-v2-restored.png');
  }finally{await restoredContext.close();}
  check(errors.length===0,'no browser page exceptions or foreign requests');
  save();console.log('P9_PLOT_BROWSER_OK '+JSON.stringify({native:rows.length,checks:checks.length,
   captures:captures.length,viewport:STANDARD_DESKTOP_VIEWPORT,sha:checkoutSha}));
 }catch(error){
  errors.push(label+': '+String(error));
  if(page)await page.screenshot({path:path.join(out,'failure.png')}).then(()=>screenshots.push('failure.png')).catch(()=>{});
  save();console.error(error.stack||String(error));process.exitCode=1;
 }finally{await context?.close().catch(()=>{});await browser?.close().catch(()=>{});await origin?.close().catch(()=>{});}
}
if(require.main===module)main().catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
