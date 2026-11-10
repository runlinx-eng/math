// P7-D6: independent Chromium evidence for real decimal place-value
// prediction, manipulation, correction and persistence in the shared runner.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../verification/p7-d6');
const check=(condition,message)=>{if(!condition)throw Error(message)};
(async()=>{
 fs.mkdirSync(root,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const records=[],errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  for(const size of [{width:1440,height:900},{width:1280,height:720}]){
   await page.setViewportSize(size);
   await page.goto('http://127.0.0.1:43827/learn.html#shiftfine');
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='shiftfine');
   const tag=String(size.width);
   const read=()=>page.evaluate(()=>{
    const scene=document.querySelector('#scene'),action=document.querySelector('#actions'),work=document.querySelector('#work'),focus=work?.querySelector('[data-study-primary]');
    return {stage:scene.dataset.stage,focus:scene.dataset.actionFocus,primaryCount:document.querySelectorAll('#actions .primary,#work .study-primary').length,
      primary:focus?.textContent||action.querySelector('.primary')?.textContent||'',checkDisabled:action.querySelector('[data-do="check"]')?.disabled,
      workVisible:!!work?.getBoundingClientRect().height,routeOpen:document.querySelector('#learning-support')?.open,
      routeExists:!!document.querySelector('#route-collapsible'),feedback:document.querySelector('#check-feedback')?.textContent||''};
   });
   let v=await read();
   check(v.stage==='explore'&&v.focus==='widget'&&v.primaryCount===1,'initial decimal prediction has one primary action '+tag);
   check(v.checkDisabled===true&&!v.routeOpen&&v.workVisible&&v.routeExists,'initial work is visible before optional lists '+tag);
   await page.screenshot({path:path.join(root,'decimal-first-'+tag+'.jpg'),type:'jpeg',quality:65});
   await page.locator('[data-xfield="guess"]').fill('345.6');
   await page.locator('[data-x="wide-predict"]').click();
   v=await read();
   check(v.focus==='work'&&v.checkDisabled,'prediction must precede actual moving '+tag);
   await page.screenshot({path:path.join(root,'decimal-predicted-'+tag+'.jpg'),type:'jpeg',quality:65});
   await page.locator('[data-x="wide-move"][data-delta="1"]').click();
   await page.locator('[data-x="wide-move"][data-delta="1"]').click();
   check((await read()).checkDisabled===false,'manipulation enables check '+tag);
   await page.locator('[data-xfield="answer"]').fill('34.56');
   await page.locator('[data-xfield="factor"]').fill('100');
   await page.locator('[data-xfield="direction"]').selectOption('times');
   await page.locator('#actions [data-do="check"]').click();
   check((await read()).stage==='revise','wrong decimal work must fail '+tag);
   await page.screenshot({path:path.join(root,'decimal-failed-'+tag+'.jpg'),type:'jpeg',quality:65});
   await page.locator('[data-xfield="answer"]').fill('345.6');
   check((await read()).stage==='recheck','edited decimal must not keep its old check '+tag);
   await page.screenshot({path:path.join(root,'decimal-modified-'+tag+'.jpg'),type:'jpeg',quality:65});
   await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='shiftfine');
   check((await read()).stage==='recheck','reload must keep changed-unchecked state '+tag);
   await page.locator('#actions [data-do="check"]').click();
   check((await read()).stage==='passed','correct decimal must pass original grader '+tag);
   await page.screenshot({path:path.join(root,'decimal-passed-'+tag+'.jpg'),type:'jpeg',quality:65});
   const saved=await page.evaluate(()=>window.mathLesson.snapshot());
   check(saved.summary.cases[0].complete,'success counted in original session '+tag);
   await page.locator('#actions [data-do="next"]').click();
   check((await read()).stage==='explore','continuation must open actual next configured task '+tag);
   await page.goto('http://127.0.0.1:43827/learn.html#equivalent');
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='equivalent');
   v=await read();
   check(v.primaryCount===1&&!v.checkDisabled&&v.workVisible,'different construction task shares single action '+tag);
   await page.screenshot({path:path.join(root,'fraction-first-'+tag+'.jpg'),type:'jpeg',quality:65});
   await page.locator('#actions [data-do="check"]').click();
   check((await read()).stage==='revise','fraction grader must give real correction '+tag);
   for(const [row,index] of [[0,1],[1,2],[2,3]])
    await page.locator('#work [data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
   check((await read()).stage==='recheck','fraction edits invalidate old result '+tag);
   await page.locator('#actions [data-do="check"]').click();
   check((await read()).stage==='passed','fraction grader still passes original construction '+tag);
   await page.screenshot({path:path.join(root,'fraction-passed-'+tag+'.jpg'),type:'jpeg',quality:65});
   records.push({viewport:size,decimal:'prediction -> manipulation -> fail -> change -> restore -> pass -> next',fraction:'fail -> change -> pass'});
   await ctx.clearCookies();
   await page.evaluate(()=>localStorage.clear());
  }
  check(errors.length===0,'browser errors: '+errors.join('; '));
  fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({records,errors,macVerified:false,childVerified:false},null,2));
  console.log('P7_D6_AUDIT_COMPLETE '+JSON.stringify({scenarioCount:records.length,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error('P7_D6_AUDIT_FAILED '+(e.stack||e));process.exitCode=1});
