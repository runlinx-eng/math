// Chromium proof for B34 MP.8 sequence: actual UI events, checks, and persisted v2 work.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {capture}=require('./helpers/p9-basic-artifact.cjs');
const out=path.resolve(__dirname,'../verification/p9-sequence-thinking');
const base='http://127.0.0.1:43827/';
const checks=[],errors=[],remote=[],observations=[];
const assert=(v,s)=>{if(!v)throw Error(s);checks.push(s);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [width,height,withHelp] of [[1440,900,false],[1280,720,true]]){
   const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await ctx.newPage(),label=width+'x'+height;
   page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(label+': '+String(e)));
   ctx.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   const shot=n=>page.screenshot({path:path.join(out,label+'-'+n+'.png'),fullPage:true});
   const record=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.tables34);
   const note=page.locator('#thinking-feedback');
   const snapshots=[];let checkIndex=0;
   const check=async()=>{await page.locator('#actions [data-do="check"]').click();snapshots.push(await capture(page,out,label,{id:'tables34',index:2},'check-'+(++checkIndex)));};
   const answer=async value=>page.locator('[data-xfield="answers.0"]').fill(value);
   try{
    await page.goto(base+'learn.html#tables34');
    await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='tables34');
    await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
    await page.reload();
    await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='tables34');
    await page.evaluate(()=>{
      const state=JSON.parse(localStorage.getItem('math-explorer-v2'));
      state.lessons.tables34.index=2;
      state.lessons.tables34.view='task';
      localStorage.setItem('math-explorer-v2',JSON.stringify(state));
    });
    await page.reload();
    await page.waitForFunction(()=>window.mathLesson?.snapshot().index===2);
    assert(await page.locator('#thinking-guide').isVisible(),label+' optional B34 thinking prompt visible');
    assert(!(await page.locator('#thinking-guide').evaluate(e=>e.open)),label+' optional prompt starts closed');
    assert(await note.count()===0,label+' no thinking claim before actions');
    await shot('01-first-entry');
    if(withHelp){
      await page.locator('#thinking-guide summary').click();
      await page.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.tables34.cases[2]?.support===true);
      assert(await page.locator('#thinking-guide p').isVisible(),label+' opened optional question painted');
    }
    for(const value of ['100','150','200']){
      await page.locator('[data-xfield="value"]').fill(value);
      await page.locator('[data-x="p34-next"]').click();
    }
    assert((await record()).models[2].board.values.join(',')==='50,100,150,200',label+' three real next actions stored');
    await answer('240');await check();
    assert(await note.count()===0,label+' wrong predicted number never earns method feedback');
    assert((await record()).cases[2].attempts.length===1,label+' wrong check remains in normal attempt history');
    await shot('02-wrong-check');
    await answer('250');
    assert(await note.count()===0,label+' editing wrong answer alone cannot create feedback');
    await check();
    assert(await note.isVisible(),label+' current correctly checked sequence produces evidence note');
    let body=await note.innerText();
    assert(body.includes('50、100、150、200')&&body.includes('250')&&body.includes('不能据此判断'),label+' feedback describes work and limits');
    assert(await note.locator('[data-thinking-node-id="mt_2jbUekyTu4"]').count()===1,label+' exact MP8 source pinned');
    const rect=await note.boundingBox();
    assert(rect&&rect.width>150&&rect.height>40,label+' painted note has nonzero browser bounds');
    await shot('03-checked');
    await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot().index===2);
    assert(await note.isVisible(),label+' correct current saved work restores after refresh');
    const restored=await capture(page,out,label,{id:'tables34',index:2},'restored');
    await answer('260');
    assert(await note.count()===0,label+' changed current answer immediately invalidates feedback');
    await shot('04-modified');
    await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot().index===2);
    assert(await note.count()===0,label+' stale checked feedback remains absent after reload');
    await check();assert(await note.count()===0,label+' wrong recheck cannot restore thinking praise');
    await answer('250');await check();
    assert(await note.isVisible(),label+' corrected recheck restores current evidence');
    const saved=await record(),attempts=saved.cases[2].attempts;
    assert(attempts.length===4,label+' four correct and incorrect submissions preserved');
    assert(attempts.every(a=>a.value&&a.id&&a.at),label+' v2 attempt structure unchanged');
    assert(!('thinkingScore' in saved)&&!('thinkingMastery' in saved),label+' no thinking mastery or grading fields');
    if(!withHelp)assert(saved.cases[2].support===false,label+' without opening optional question no support flag');
    await check();assert(snapshots.at(-1).attempts.length===5,label+' fifth current check preserves all original four submissions');
    observations.push({width,height,id:'tables34',index:2,snapshots,firstModel:snapshots[1].model,restoredModel:restored.model,finalModel:snapshots.at(-1).model,record:snapshots.at(-1).record,observation:await note.innerText(),restored});
    await shot('05-rechecked');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' desktop has no horizontal overflow');
    await ctx.close();
   }catch(e){await shot('failure').catch(()=>{});await ctx.close();throw e;}
  }
  assert(!errors.length,'no uncaught page errors');
  assert(!remote.length,'no external requests');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,childTrial:false,pedagogicalReview:false},null,2));
  console.log('P9_SEQUENCE_THINKING_BROWSER_OK '+JSON.stringify({checks:checks.length}));
 }catch(e){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,error:String(e)},null,2));
  console.error(e.stack);process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
