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
   await shot('01-space-open',true);
   await frame.locator('#actions [data-do="start"]').click();
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
     if(await page.locator('#actions [data-do="start"]').count())await page.locator('#actions [data-do="start"]').click();
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