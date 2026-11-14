// Real Chromium proof for the shared B34 sequence evidence protocol in distinct MP.8 lessons.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {capture,createOrigin,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const out=path.resolve(__dirname,'../verification/p9-sequence-adapter');
const root=path.resolve(__dirname,'..'),cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const cases=[
 {id:'general34',index:2,steps:['5','10','15','20'],correct:'zero-five',wrong:'two-seven',node:'mt_fZTn0W_iZR'},
 {id:'tables34',index:2,steps:['100','150','200'],correct:'250',wrong:'249',node:'mt_2jbUekyTu4'},
 {id:'general34',index:3,steps:['7','12'],correct:'two-seven',wrong:'zero-five',node:'mt_fZTn0W_iZR'},
 {id:'tables34',index:0,steps:['4','8','12','16'],correct:'even',wrong:'odd',node:'mt_2jbUekyTu4'},
 {id:'reason34',index:1,steps:['9','13','17'],correct:'81',wrong:'80',node:'mt_iyovKgZC1q'}
];
const checks=[],errors=[],remote=[],observations=[],offline=[];
const assert=(condition,name)=>{if(!condition)throw Error(name);checks.push(name);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [width,height] of [[1440,900],[1280,720]]){
   const origin=await createOrigin(root),base=origin.base;
   const context=await b.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage();
   const viewport=width+'x'+height;
   page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(viewport+': '+String(e)));
   context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   try{
    offline.push({width,height,...await warmAndStop(page,origin,cache,assert,viewport)});
    for(const spec of cases){
     const label=viewport+'-'+spec.id+'-'+spec.index;
     const shot=n=>page.screenshot({path:path.join(out,label+'-'+n+'.png'),fullPage:true});
     const note=page.locator('#thinking-feedback');
     const record=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id],spec.id);
     const snapshots=[],save=async phase=>{const x=await capture(page,out,label,spec,phase);snapshots.push(x);return x;};
     const answer=async value=>{
       const input=page.locator('[data-xfield="answers.0"]');
       if(await input.evaluate(e=>e.tagName)==='SELECT')await input.selectOption(value);
       else await input.fill(value);
     };
     try{
      await page.goto(base+'learn.html#'+spec.id);
      await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,spec.id);
      await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
      await page.reload();
      await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,spec.id);
      await page.evaluate(({id,index})=>{
        const state=JSON.parse(localStorage.getItem('math-explorer-v2'));
        state.lessons[id].index=index;
        state.lessons[id].view='task';
        localStorage.setItem('math-explorer-v2',JSON.stringify(state));
      },{id:spec.id,index:spec.index});
      await page.reload();
      await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,spec.index);
      assert(await page.locator('#thinking-guide').isVisible(),label+' optional guide visible');
      assert(!(await page.locator('#thinking-guide').evaluate(e=>e.open)),label+' guide closed by default');
      assert(await note.count()===0,label+' no feedback before actual actions');
      await shot('01-before');
      await page.locator('[data-xfield="value"]').fill('999');await page.locator('[data-x="p34-next"]').click();
      await page.locator('#actions [data-do="check"]').click();
      assert(await note.count()===0,label+' failed next does not advance or award evidence');
      const failed=await save('failed-step');assert(failed.model.board.values.length===1&&failed.model.board.bad===true,label+' first wrong input and bad marker retained');
      await shot('01-failed-step');
      for(const value of spec.steps){
        await page.locator('[data-xfield="value"]').fill(value);
        await page.locator('[data-x="p34-next"]').click();
      }
      assert((await record()).models[spec.index].history.length===spec.steps.length+1,label+' failed and successful real actions stored');
      await answer(spec.wrong);
      await page.locator('#actions [data-do="check"]').click();
      assert(await note.count()===0,label+' wrong submitted answer gets no thinking feedback');
      await save('wrong-answer');
      await answer(spec.correct);
      await page.locator('#actions [data-do="check"]').click();
      assert(await note.isVisible(),label+' checked actions show evidence');
      const body=await note.innerText();
      assert(body.includes('实际留下了')&&body.includes('不能据此判断独立归纳'),label+' bounded factual wording');
      assert(await note.locator('[data-thinking-node-id="'+spec.node+'"]').count()===1,label+' own source attached');
      await shot('02-checked');
      const first=await save('first-correct');
      await page.reload();
      await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,spec.index);
      assert(await note.isVisible(),label+' matching submitted work restores on reload');
      const restored=await save('restored');assert(JSON.stringify(restored.model)===JSON.stringify(first.model),label+' full corrected model restores');
      await answer(spec.wrong);
      assert(await note.count()===0,label+' editing immediately invalidates feedback');
      await shot('03-modified');
      await page.reload();
      await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,spec.index);
      assert(await note.count()===0,label+' edited work remains unverified on reload');
      await page.locator('#actions [data-do="check"]').click();
      assert(await note.count()===0,label+' wrong recheck cannot restore evidence');
      await save('edited-failure');
      await answer(spec.correct);
      await page.locator('#actions [data-do="check"]').click();
      assert(await note.isVisible(),label+' corrected recheck restores evidence');
      const saved=await record(),attempts=saved.cases[spec.index].attempts;
      assert(attempts.length===5,label+' original four checks plus failed-step check retained');
      assert(attempts.every(a=>a.id&&a.at&&a.value),label+' v2 record shape unchanged');
      assert(!('thinkingScore' in saved)&&!('thinkingMastery' in saved),label+' no mastery score');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' desktop no overflow');
      const final=await save('final-correct');assert(final.model.board.first.next==='999'&&final.model.board.bad===true,label+' correction never rewrites first attempt');
      observations.push({width,height,...spec,snapshots,firstModel:first.model,finalModel:final.model,record:final.record,observation:body,finalObservation:await note.innerText()});
     }catch(e){await shot('failure').catch(()=>{});throw e;}
    }
   }finally{await context.close();await origin.close();}
  }
  assert(errors.length===0,'no uncaught page errors');
  assert(remote.length===0,'no external requests');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,offline,originStopped:offline.every(x=>x.originStopped),childTrial:false,pedagogicalReview:false},null,2));
  console.log('P9_SEQUENCE_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length}));
 }catch(e){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,error:String(e)},null,2));
  console.error(e.stack);process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
