// P7-D4: four real task families share one command surface without a new grader.
// Screenshots are browser evidence, not Mac/child or mathematics pedagogy approval.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../verification/p7-d4');
const base='http://127.0.0.1:43827/learn.html#';
const assert=(ok,reason)=>{if(!ok)throw Error(reason);};
(async()=>{
 fs.mkdirSync(root,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage(),results=[],errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 try{
  for(const size of [{width:1440,height:900},{width:1280,height:720}]){
   await page.setViewportSize(size);
   for(const sample of [
    {id:'equivalent',name:'construction',cue:'纸带'},
    {id:'argument38',name:'reasoning',cue:'操作'},
    {id:'link-equivalent-quarters',name:'source-bridge',cue:'关联知识'},
    {id:'counttwenty',name:'counting',cue:'先完成'}
   ]){
    await page.goto(base+sample.id);
    // The preceding browser suites may initialize a reusable application record.
    // Each source-family sample starts on its own explicit clean learning state.
    await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
    await page.reload();
    await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,sample.id);
    const state=await page.evaluate(()=>{
     const scene=document.querySelector('#scene'),action=document.querySelector('#actions');
     const command=document.querySelector('.stage-top'),work=document.querySelector('#work'),question=document.querySelector('#learning-problem'),dock=action?.closest('.execution-command');
     const b=action?.querySelector('.primary'),r=b?.getBoundingClientRect();
     const root=command?.getBoundingClientRect();
     return {id:window.mathLesson.snapshot().id,stage:scene?.dataset.stage,
      task:document.querySelector('#instruction')?.textContent||'',
      cue:document.querySelector('#action-cue')?.textContent||'',
      work:!!work&&work.children.length>0,progress:document.querySelector('#status')?.textContent,
      taskDock:!!b&&!!dock,questionBeforeWork:!!question&&!!work&&!!(question.compareDocumentPosition(work)&Node.DOCUMENT_POSITION_FOLLOWING),actionAfterWork:!!work&&!!dock&&!!(work.compareDocumentPosition(dock)&Node.DOCUMENT_POSITION_FOLLOWING),primaryText:b?.textContent,
      primaryEnabled:!b?.disabled,primaryCount:action?.querySelectorAll('.primary:not([hidden])').length||0,
      topRect:root?{top:root.top,bottom:root.bottom}:null,
      mainRect:r?{top:r.top,bottom:r.bottom}:null,viewport:innerHeight,
      track:document.querySelectorAll('#steps li').length,
      uniqueWork:document.querySelectorAll('#work').length,
      uniqueActions:document.querySelectorAll('#actions').length};
    });
    console.log('P7_D4_OPEN '+JSON.stringify({sample:sample.name,size,state}));
    assert(state.id===sample.id,'incorrect source session '+sample.name);
    assert(state.stage==='explore','initial work not ready to explore '+sample.name);
    assert(state.task.length>0&&state.work,'source math prompt/widget missing '+sample.name);
    assert(state.cue.length>0,'current instruction not available '+sample.name);
    assert(state.progress?.startsWith('任务'),'actual task progress missing '+sample.name);
    assert(state.primaryCount===1&&state.taskDock&&state.questionBeforeWork&&state.actionAfterWork,'one reachable action follows the actual source problem and widget '+sample.name);
    assert(state.track===3&&state.uniqueWork===1&&state.uniqueActions===1,'same execution frame '+sample.name);
    assert(state.mainRect?.top>=0&&state.mainRect.bottom<state.viewport,'sticky bottom action offscreen '+sample.name);
    if(sample.name==='construction')assert(state.cue.includes('纸带'),'paper-strip instruction missing');
    if(sample.name==='source-bridge')assert((await page.locator('#interaction-title').innerText()).includes('关联知识'),'the actual source bridge must be identified');
    if(sample.name==='counting')assert(!state.primaryEnabled,'counting task must not be judged before building its required work');
    await page.screenshot({path:path.join(root,sample.name+'-'+size.width+'x'+size.height+'.jpg'),type:'jpeg',quality:58});
    if(!state.primaryEnabled){
     assert(await page.locator('#actions [data-do="check"]').isDisabled(),'unready native work keeps checking disabled '+sample.name);
     assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2'))?.lessons?.[window.mathLesson.snapshot().id]?.cases?.[0]?.attempts?.length||0))===0,'unready work has no submission '+sample.name);
    }
    if(state.primaryEnabled){
     await page.locator('#actions [data-do="check"]').click();
     const after=await page.evaluate(()=>({stage:document.querySelector('#scene').dataset.stage,
      attempts:JSON.parse(localStorage.getItem('math-explorer-v2'))?.lessons||{},
      primaryCount:document.querySelectorAll('#actions .primary:not([hidden])').length,
      cue:document.querySelector('#action-cue')?.textContent}));
     assert(['revise','passed'].includes(after.stage),'actual grader did not respond '+sample.name);
     assert(after.primaryCount===1,'check has no single next action '+sample.name);
     await page.reload();
     await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,sample.id);
     assert(await page.locator('#scene').getAttribute('data-stage')===after.stage,'check state failed to restore '+sample.name);
     await page.screenshot({path:path.join(root,sample.name+'-checked-'+size.width+'.jpg'),type:'jpeg',quality:58});
    }
    results.push({sample:sample.name,size:size.width+'x'+size.height,state:'passed',stage:state.stage,action:state.primaryText});
   }
  }
  assert(errors.length===0,'browser runtime errors '+errors.join('; '));
  fs.writeFileSync(path.join(root,'audit.json'),JSON.stringify({results,errors,macVerified:false,childVerified:false},null,2));
  console.log('P7_D4_AUDIT_COMPLETE '+JSON.stringify({scenarioCount:results.length,errors}));
 }catch(error){
  fs.writeFileSync(path.join(root,'audit.json'),JSON.stringify({results,errors:[...errors,String(error)],macVerified:false,childVerified:false},null,2));
  console.error('P7_D4_AUDIT_FAILURE '+(error.stack||String(error)));
  process.exitCode=1;
 }finally{await browser.close();}
})();
