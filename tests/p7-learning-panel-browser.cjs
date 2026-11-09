// P7: capture current learning journeys before and after layout changes in real Chromium.
// Screenshots are diagnostic evidence; this test makes no claim about child learning.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p7-learning-panel');
const base='http://127.0.0.1:43827/';
const evidence={scenarios:[],errors:[],humanExperienceVerified:false};
const requireState=(yes,label)=>{if(!yes)throw Error(label);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 async function shot(label,embed=false){
   const file=path.join(out,label+'.jpg');
   await page.screenshot({path:file,type:'jpeg',quality:53});
   const data=await page.evaluate(embed=>{
     const frame=embed?document.querySelector('#journey-frame'):null;
     const doc=frame?.contentDocument||document;
     const lesson=doc.querySelector('#lesson');
     const instruction=doc.querySelector('#instruction');
     const actions=doc.querySelector('#actions');
     const flow=doc.querySelector('#p3-learning-flow');
     if(!lesson)return {missingLesson:true};
     const rect=e=>e?{top:Math.round(e.getBoundingClientRect().top),bottom:Math.round(e.getBoundingClientRect().bottom)}:null;
     return {
       title:doc.querySelector('#title')?.textContent,
       goal:doc.querySelector('#learning-goal')?.textContent,
       instruction:instruction?.textContent,
       status:doc.querySelector('#status')?.textContent,
       headerVisible:!!doc.querySelector('#back')&&getComputedStyle(doc.querySelector('#back')).display!=='none',
       routeOpen:doc.querySelector('#route-collapsible')?.open,
       actionLabels:[...actions?.querySelectorAll('button')||[]].map(b=>b.innerText),
       flowButtons:[...flow?.querySelectorAll('button')||[]].length,
       routeButtons:[...doc.querySelectorAll('#route button')].length,
       lessonHeight:lesson.scrollHeight,
       frameViewport:doc.defaultView.innerHeight,
       instructionRect:rect(instruction),actionsRect:rect(actions),flowRect:rect(flow),
       feedback:doc.querySelector('#check-feedback')?.textContent,
       checkCount:doc.querySelector('.p3-evidence')?.textContent,
     };
   },embed);
   evidence.scenarios.push({label,...data});
   console.log('P7_STEP '+JSON.stringify({label,...data}));
   return data;
 }
 try{
   await page.goto(base+'?world=network&layout=53#space/node/mt_ndGqFPWyen');
   await page.waitForFunction(()=>window.mathSpace?.snapshot().selected==='node:mt_ndGqFPWyen');
   const before=await page.evaluate(()=>mathSpace.snapshot());
   await page.locator('#focus-card [data-action="open"]').first().click();
   const frame=page.frameLocator('#journey-frame');
   await frame.locator('#actions button').first().waitFor();
   const opening=await shot('01-space-open',true);
   requireState(!!opening.goal,'current math knowledge is visible before operation');
   requireState(opening.status.startsWith('任务'),'first task appears immediately in the 3D workspace');
   requireState(opening.actionLabels.some(s=>s.includes('检查我的作品')),'check action exists without a mode switch');
   await shot('02-normal-operate',true);
   await frame.locator('#actions [data-do="check"]').click();
   await shot('03-normal-checked',true);
   await frame.locator('#actions [data-do="hint"]').click();
   await shot('04-normal-hint',true);
   const detail=frame.locator('.p3-followups summary');
   if(await detail.count())await detail.click();
   await frame.locator('[data-do="p3-retry"]').click();
   await frame.locator('#actions [data-do="check"]').click();
   const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
   requireState(stored.lessons.share.cases[0].attempts.length===2,'normal retry kept both attempts');
   await shot('05-normal-retry',true);
   // Complete all three real partition tasks through the existing widgets and inspector.
   for(const [idx,take] of [[0,1],[1,3],[2,2]]){
     if(idx>0)await frame.locator('#actions [data-do="next"]').click();
     await frame.locator('#actions [data-do="hint"]').click();
     for(let part=0;part<take;part++)await frame.locator('#work [data-do="part"][data-index="'+part+'"]').click();
     await frame.locator('#actions [data-do="check"]').click();
     const result=await frame.locator('#check-feedback').innerText();
     requireState(!!result,'successful task displays a concrete result');
     requireState(await frame.locator('#actions [data-do="next"]').count()===1,'success offers a next task');
     requireState(await frame.locator('#actions [data-do="next"]').evaluate(el=>el.classList.contains('primary')),'successful task emphasizes the next action');
     if(idx===0){
       await frame.locator('#work [data-do="part"][data-index="0"]').click();
       requireState((await frame.locator('#check-feedback').innerText()).includes('已修改，尚未重新检查'),'edited work reports recheck needed');
       requireState(await frame.locator('#actions [data-do="next"]').count()===0,'old correct result does not authorize advancing modified work');
       await shot('05-0-modified-recheck-needed',true);
       await frame.locator('#work [data-do="part"][data-index="0"]').click();
       requireState(await frame.locator('#actions [data-do="next"]').count()===1,'restoring the submitted workpiece restores its checked state');
     }
     await shot('05-'+idx+'-correct',true);
   }
   await frame.locator('#actions [data-do="next"]').click();
   await frame.locator('#note').fill('分成一样大的小份，取几份就是几个这样的单位份。');
   await frame.locator('[data-do="save-note"]').click();
   await shot('05-summary-saved',true);
   const finished=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
   requireState(finished.lessons.share.notes.length===1,'saved explanation persists');
   requireState(finished.lessons.share.cases[0].attempts.length===3,'first two incorrect checks survive a successful third');
   await page.locator('#journey-surface [data-action="close-journey"]').click();
   await page.waitForFunction(()=>!mathSpace.snapshot().journeyOpen);
   const after=await page.evaluate(()=>mathSpace.snapshot());
   requireState(before.position.every((v,i)=>Math.abs(v-after.position[i])<.002),'camera did not move on close');
   requireState(after.selected===before.selected,'original knowledge selected after close');
   await page.locator('.primary-nav [data-action="nav-trail"]').click();
   await page.waitForFunction(()=>document.querySelector('#utility-frame')?.contentWindow?.location.hash==='#trail');
   await shot('06-footprint',false);
   // Direct runner isolates explanation-focused and linked activities without another map.
   for(const [id,label] of [['recutnames','explain'],['link-share-equivalent','linked']]){
     await page.goto(base+'learn.html#'+id);
     await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,id);
     await shot('07-'+label+'-open');
     await shot('08-'+label+'-operate');
     if(await page.locator('#actions [data-do="check"]').count()){
       await page.locator('#actions [data-do="check"]').click();
       await shot('09-'+label+'-checked');
       if(await page.locator('#actions [data-do="hint"]').count()){
         await page.locator('#actions [data-do="hint"]').click();
         await shot('10-'+label+'-hint');
       }
     }
   }
   await page.setViewportSize({width:980,height:760});
   await shot('11-compact-learning');
   // Mac first-screen review: the equal-fractions exercise initially opened in
   // ungraded play mode with a misleading "change condition" primary action.
   await page.setViewportSize({width:1440,height:900});
   await page.goto(base+'learn.html#equivalent');
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='equivalent');
   const first=await shot('12-equivalent-first-screen');
   requireState(first.status==='任务 1 / 3','first screen is an active task, not free-play mode');
   requireState(first.instruction.includes('把三条纸带都涂到一半'),'current math task is visible');
   requireState(first.actionLabels.some(s=>s.includes('检查我的作品')),'check is available without an extra start');
   requireState(!first.actionLabels.some(s=>s.includes('开始第')||s.includes('试玩')),'no practice/formal mode selection');
   requireState(!first.checkCount.includes('历史完成'),'unsubmitted work has no empty evidence wall');
   requireState(await page.locator('#record').isHidden(),'empty history is hidden before any attempt');
   requireState(await page.locator('.p3-flow-heading').count()===0,'no phantom evidence heading');
   const active=await shot('13-equivalent-task-started');
   requireState(active.actionLabels.some(s=>s.includes('检查我的作品')),'task has an explicit checking action');
   requireState(await page.locator('#actions [data-do="check"]').evaluate(el=>el.classList.contains('primary')),'check is the single primary task action');
   await page.locator('#actions [data-do="check"]').click();
   const checked=await shot('14-equivalent-first-check');
   requireState(checked.checkCount.includes('当前任务累计 1 次提交'),'first check is still saved and countable');
   requireState(await page.locator('#record').isVisible(),'real attempt reveals the history');
   await page.locator('.p3-evidence-details summary').click();
   requireState((await page.locator('.p3-evidence').innerText()).includes('首次独立证据'),'detailed evidence still exists but is optional');
   await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='equivalent');
   const resumed=await shot('15-equivalent-resumed');
   requireState(resumed.checkCount.includes('1 次提交'),'refresh retains attempt and no fake mastery');
   // An older installed version stored ungraded play models under key -1.
   // The new single workspace must keep that old material and display the task.
   await page.evaluate(async()=>{
     const {freshLesson,modelForLesson}=await import('./learning/state.js');
     const saved=JSON.parse(localStorage.getItem('math-explorer-v2'));
     const record=freshLesson('decimal');
     record.view='play';
     modelForLesson(record).selected=[1,2,3];
     saved.lessons.decimal=record;
     localStorage.setItem('math-explorer-v2',JSON.stringify(saved));
   });
   await page.goto(base+'learn.html#decimal');
   await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='decimal');
   const migrated=await shot('16-legacy-play-recovered');
   requireState(migrated.status.startsWith('任务'),'legacy play reopens as the unified task');
   requireState(migrated.actionLabels.some(s=>s.includes('检查我的作品')),'legacy play needs no second start');
   const preserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.decimal);
   requireState(preserved.view==='task','legacy record normalized');
   requireState(preserved.models['-1'].selected.length===3,'original play work preserved for recovery');
   requireState(preserved.models[0].selected.length===3,'compatible unsubmitted work continues in the task');
   requireState(!preserved.cases[0],'unsubmitted play work does not count as checked');
   fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(evidence,null,2));
   console.log('P7_AUDIT_COMPLETE '+JSON.stringify({scenarioCount:evidence.scenarios.length,errors:evidence.errors}));
   requireState(!evidence.errors.length,'no uncaught Chromium errors');
 }catch(e){
   evidence.failure=String(e);
   console.error('P7_AUDIT_FAILURE '+(e.stack||String(e)));
   await page.screenshot({path:path.join(out,'failure.jpg'),type:'jpeg',quality:60}).catch(()=>{});
   fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(evidence,null,2));
   process.exitCode=1;
 }finally{await browser.close();}
})();