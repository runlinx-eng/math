// Real Chromium P9 geometry pilot. Only unrelated earlier lesson positions
// are skipped by a schema-valid test fixture; every target-task action and
// check is performed through the actual browser controls.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p9-geometry-thinking');
const base='http://127.0.0.1:43827/';
const checks=[],errors=[],remote=[];
const assert=(v,s)=>{if(!v)throw Error(s);checks.push(s);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [width,height,withHelp] of [[1440,900,false],[1280,720,true]]){
   const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await ctx.newPage();
   const label=width+'x'+height;
   page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(label+': '+String(e)));
   ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   const shot=n=>page.screenshot({path:path.join(out,label+'-'+n+'.png'),fullPage:true});
   const record=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.structure34);
   const note=page.locator('#thinking-feedback');
   const pick=async(a,b)=>{
    await page.locator('[data-xfield="first"]').fill(String(a));
    await page.locator('[data-xfield="second"]').fill(String(b));
    await page.locator('[data-x="g23-lineTest"]').click();
   };
   const answer=async v=>page.locator('[data-xfield="answers.0"]').selectOption(v);
   const check=()=>page.locator('#actions [data-do="check"]').click();
   try{
    await page.goto(base+'learn.html#structure34');
    await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='structure34');
    await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
    await page.reload();
    await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='structure34');
    await page.evaluate(()=>{
     const state=JSON.parse(localStorage.getItem('math-explorer-v2'));
     // Browser fixture only: open existing task index 3 without inventing
     // scored attempts in positions 0-2.
     state.lessons.structure34.index=3;
     state.lessons.structure34.view='task';
     localStorage.setItem('math-explorer-v2',JSON.stringify(state));
    });
    await page.reload();
    await page.waitForFunction(()=>window.mathLesson?.snapshot().index===3);
    assert(await page.locator('#thinking-guide').isVisible(),label+' optional prompt is in the actual task');
    assert(!(await page.locator('#thinking-guide').evaluate(e=>e.open)),label+' prompt starts closed');
    assert(await note.count()===0,label+' no thinking claim on first entry');
    await shot('01-first-entry');
    if(withHelp){
     await page.locator('#thinking-guide summary').click();
     await page.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.structure34.cases[3]?.support===true);
     assert((await record()).cases[3].support===true,label+' explicitly opening question uses existing support evidence');
     assert(await page.locator('#thinking-guide p').isVisible(),label+' optional question really painted after click');
    }
    await pick(0,2);await answer('both');await check();
    assert(await note.count()===0,label+' partial geometric work cannot earn a method label');
    assert((await record()).cases[3].attempts.length===1,label+' original incorrect submission persisted');
    await shot('02-wrong-check');
    await pick(0,1);
    assert(await note.count()===0,label+' merely editing the work gives no prior success claim');
    await check();
    assert(await note.isVisible(),label+' correct current submission shows method feedback');
    let body=await note.innerText();
    assert(body.includes('平行')&&body.includes('垂直')&&body.includes('不代表已掌握'),label+' factual methods and limited attribution painted');
    assert(await note.locator('[data-thinking-node-id="mt_FAXjFkgG6X"]').count()===1,label+' exact source MP.7 attached');
    const rect=await note.boundingBox();
    assert(rect&&rect.width>150&&rect.height>40,label+' feedback has visible painted geometry');
    await shot('03-current-checked');
    await page.reload();
    await page.waitForFunction(()=>window.mathLesson?.snapshot().index===3);
    assert(await note.isVisible(),label+' feedback restores only with matching saved successful attempt');
    await answer('one');
    assert(await note.count()===0,label+' editing removes old successful feedback immediately');
    await shot('04-modified');
    await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot().index===3);
    assert(await note.count()===0,label+' stale method feedback does not return after reload');
    await check();
    assert(await note.count()===0,label+' incorrect resubmission does not restore method feedback');
    await answer('both');await check();
    assert(await note.isVisible(),label+' rechecking corrected work restores evidence description');
    const saved=await record(),attempts=saved.cases[3].attempts;
    assert(attempts.length===4,label+' incorrect/correct/incorrect/correct attempts retained');
    assert(attempts.every(x=>x.value&&x.id&&x.at),label+' original attempt format preserved');
    assert(!('thinkingScore'in saved)&&!('thinkingMastery'in saved),label+' no mastery fields added');
    if(!withHelp)assert(saved.cases[3].support===false,label+' independent path does not mark optional help');
    await shot('05-rechecked');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no desktop horizontal overflow');
    await ctx.close();
   }catch(error){await shot('failure').catch(()=>{});await ctx.close();throw error;}
  }
  assert(!errors.length,'no uncaught browser errors');
  assert(!remote.length,'no external requests');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,childTrial:false,independentReview:false},null,2));
  console.log('P9_GEOMETRY_THINKING_BROWSER_OK '+JSON.stringify({checks:checks.length}));
 }catch(e){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,error:String(e)},null,2));
  console.error(e.stack);process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
