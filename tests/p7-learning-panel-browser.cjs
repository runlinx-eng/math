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

   const order=await page.locator('#scene>.learning-region').evaluateAll(els=>els.map(el=>el.id));
   requireState(JSON.stringify(order)===JSON.stringify(['learning-problem','learning-interaction','learning-check','learning-next']),'all learning types share four fixed UI regions');
   requireState((await page.locator('#math-explanation').innerText()).includes('第 1、2、3 条纸带'),'wrong fraction work receives evidence-bound mathematical guidance');
   // Complete one standard learning journey through the existing mathematical widgets:
   // first wrong -> edit -> check -> explain -> change conditions -> summarize -> save.
   for(const [row,index] of [[0,1],[1,2],[2,3]])
     await page.locator('#work [data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
   requireState(await page.locator('#scene').getAttribute('data-stage')==='recheck','edited incorrect work must be rechecked');
   requireState(await page.locator('#math-explanation').isHidden(),'old checked explanation is not reused for edited work');
   await page.locator('#actions [data-do="check"]').click();
   requireState(await page.locator('#scene').getAttribute('data-stage')==='passed','first equal-fraction task passes on correct work');
   const firstProof=await page.locator('#math-explanation').innerText();
   requireState(firstProof.includes('2/4 = 3/6 = 4/8 = 1/2'),'first equal-fraction explanation uses submitted mathematical relation');
   requireState((await page.locator('#actions .primary').count())===1,'one main next action after task passes');
   requireState(!(await page.locator('.p3-followups').evaluate(el=>el.open)),'auxiliary learning paths are collapsed after success');
   await shot('17-equivalent-strips-explained');
   await page.locator('#actions [data-do="next"]').click();
   await page.locator('input[data-field="mark"]').evaluate(el=>{el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.locator('#actions [data-do="check"]').click();
   requireState((await page.locator('#math-explanation').innerText()).includes('2/3 = 4/6'),'second task explains the matching number line');
   await shot('18-equivalent-first-numberline');
   await page.locator('#actions [data-do="next"]').click();
   await page.locator('input[data-field="mark"]').evaluate(el=>{el.value='6';el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.locator('#actions [data-do="check"]').click();
   const finalProof=await page.locator('#math-explanation').innerText();
   requireState(finalProof.includes('2/3 = 6/9'),'third task explicitly explains the submitted 6/9 equivalence');
   requireState((await page.locator('#actions [data-do="next"]').innerText()).includes('整理'),'last successful task has one main consolidation action');
   await shot('19-equivalent-final-check-explained');
   await page.locator('#actions [data-do="next"]').click();
   requireState(await page.locator('#scene').getAttribute('data-stage')==='reflect','the same shell enters reflection');
   requireState(await page.locator('#status').innerText()==='操作检查已通过','operation checked does not certify a freely written explanation');
   requireState(await page.locator('#system-explanation').count()===1,'system mathematical explanation remains available as a voluntary aid');
   requireState(!await page.locator('#system-explanation').evaluate(el=>el.open),'mathematical solution does not appear before the learner chooses to read it');
   requireState(!(await page.locator('#learning-problem').innerText()).includes('分子分母同时乘'),'the learner reflection question must not be answered in the initial prompt');
   requireState(await page.locator('#actions button').count()===1,'summary has one next action, not parallel retry/exit decisions');
   requireState(await page.locator('#work [data-do="save-note"]').count()===1,'optional writing is still directly reachable');
   await page.locator('#system-explanation>summary').click();
   requireState((await page.locator('#system-explanation').innerText()).includes('分子'),'the learner may deliberately inspect retained mathematics');
   await page.locator('#system-explanation>summary').click();
   requireState(!await page.locator('#system-explanation').evaluate(el=>el.open),'system explanation can be collapsed again');
   requireState(await page.locator('#actions [data-do="lesson"][data-id="decimal"].primary').count()===1,'reflection offers the actual next route lesson as its main action');
   requireState(await page.locator('#work [data-do="save-note"]').isDisabled(),'an empty explanation is not submitted as learning evidence');
   await page.locator('#note').fill('同一个整体，三分之二与九分之六都走到数轴的同一个位置，因为每份缩小、份数同时增加。');
   requireState(await page.locator('#work [data-do="save-note"]').evaluate(el=>el.classList.contains('primary')),'writing a discovery makes save the main action');
   requireState(!await page.locator('#actions [data-do="lesson"][data-id="decimal"]').evaluate(el=>el.classList.contains('primary')),'saving written thoughts takes precedence over continuing');
   await page.locator('#work [data-do="save-note"]').click();
   const recorded=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.equivalent);
   requireState(recorded.notes.some(n=>n.text.includes('三分之二与九分之六')),'submitted explanation is really saved');
   requireState(recorded.cases[0].attempts.length===2,'first incorrect attempt remains with successful task');
   requireState((await page.locator('#note-save-status').innerText()).includes('已保存这次发现'),'save gets a visible and accessible success confirmation');
   requireState((await page.locator('.saved-note-preview').innerText()).includes('三分之二与九分之六'),'saved words stay visible in the summary');
   requireState(await page.locator('#actions [data-do="lesson"][data-id="decimal"]').evaluate(el=>el.classList.contains('primary')),'after saving, the next real learning activity is primary');
   await shot('20-equivalent-reflection-saved');
   await page.locator('#actions [data-do="lesson"][data-id="decimal"]').click();
   await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='decimal');
   requireState(await page.locator('#status').innerText()==='任务 1 / 4','continuing after a saved reflection directly opens the next task');
   requireState((await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.equivalent.notes)).length===1,'changing lessons retains the previous verified reflection record');
   await shot('20a-next-lesson-opens');


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
   // The preceding step already opened this URL. Navigating to an identical
   // URL may reuse the live document and skip the legacy-normalization boot.
   await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot().id==='decimal');
   const migrated=await shot('16-legacy-play-recovered');
   requireState(migrated.status.startsWith('任务'),'legacy play reopens as the unified task');
   requireState(migrated.actionLabels.some(s=>s.includes('检查我的作品')),'legacy play needs no second start');
   const preserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.decimal);
   requireState(preserved.view==='task','legacy record normalized');
   requireState(preserved.models['-1'].selected.length===3,'original play work preserved for recovery');
   requireState(preserved.models[0].selected.length===3,'compatible unsubmitted work continues in the task');
   requireState(!preserved.cases[0],'unsubmitted play work does not count as checked');
   // User Mac screenshot: 26 filled cells + 0.26 + "26" must pass a prompt
   // asking "百分之几"; the prior grader accepted only the string "26/100".
   await page.evaluate(()=>{
     const all=JSON.parse(localStorage.getItem('math-explorer-v2'));
     all.lessons.decimal.index=2;
     all.lessons.decimal.models[2]={selected:[],decimal:'',fraction:''};
     localStorage.setItem('math-explorer-v2',JSON.stringify(all));
   });
   await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='decimal'&&window.mathLesson?.snapshot()?.index===2);
   requireState((await page.locator('#instruction').innerText()).includes('写成百分之几'),'third decimal task matches Mac screenshot');
   requireState((await page.locator('label.field').allInnerTexts()).some(s=>s.includes('只填数字')),'percent input format is unambiguous');
   await page.locator('#work [data-do="row-fill"]').click();
   await page.locator('#work [data-do="row-fill"]').click();
   for(let i=20;i<26;i++)await page.locator('#work [data-do="cell"][data-index="'+i+'"]').click();
   requireState((await page.locator('#grid-count').innerText())==='26','real controls now show 26 of 100');
   await page.locator('#work [data-field="decimal"]').fill('0.26');
   await page.locator('#work [data-field="fraction"]').fill('0.26');
   await page.locator('#actions [data-do="check"]').click();
   requireState(await page.locator('#scene').getAttribute('data-stage')==='revise','0.26 is a wrong percent count');
   requireState((await page.locator('#check-feedback').innerText()).includes('百分之几'),'the error names the incorrect part');
   await shot('21-decimal-percent-wrong-notation');
   await page.locator('#work [data-field="fraction"]').fill('26');
   requireState(await page.locator('#scene').getAttribute('data-stage')==='recheck','editing the wrong answer needs recheck');
   await page.locator('#actions [data-do="check"]').click();
   requireState(await page.locator('#scene').getAttribute('data-stage')==='passed','26 percent passes the user-visible prompt');
   requireState((await page.locator('#check-feedback').innerText()).includes('26/100 = 0.26 = 26%'),'pass explains why 26 percent is the same amount');
   requireState(await page.locator('#actions [data-do="next"]').count()===1,'next math question appears after valid input');
   await shot('22-decimal-percent-26-accepted');
   await page.locator('#work [data-field="fraction"]').fill('26/100');
   await page.locator('#actions [data-do="check"]').click();
   requireState(await page.locator('#scene').getAttribute('data-stage')==='passed','older 26/100 notation remains compatible');
   const percentRecord=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.decimal);
   requireState(percentRecord.cases[2].attempts.length===3,'wrong, corrected and legacy-format checks retain three distinct attempts');
   requireState(percentRecord.cases[2].attempts[0].value.fraction==='0.26','original mistaken work stays in history');
   await shot('23-decimal-percent-old-notation');
   // Mac regression: completed 4/4 summary, saving a thought must show
   // visible confirmation and a direct, source-configured following lesson.
   await page.evaluate(async()=>{
     const {freshLesson,submitLesson}=await import('./learning/state.js');
     const {TASKS,exampleModel}=await import('./learning/tasks.js');
     const store=JSON.parse(localStorage.getItem('math-explorer-v2'));
     const finished=freshLesson('decimal');
     for(let i=0;i<TASKS.decimal.length;i++){
       finished.index=i;finished.models[i]=exampleModel(TASKS.decimal[i]);
       if(!submitLesson(finished).correct)throw Error('cannot stage decimal task '+i);
     }
     finished.view='summary';
     store.lessons.decimal=finished;
     localStorage.setItem('math-explorer-v2',JSON.stringify(store));
   });
   await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot().view==='summary');
   requireState((await page.locator('#actions [data-do="lesson"][data-id="quarters"]').innerText()).includes('继续学习'),'4/4 summary points to the actual next configured activity');
   requireState(await page.locator('#note-save-status').isHidden(),'unsaved reflection has no false success confirmation');
   await page.locator('#note').fill('一个是十分位，一个是百分位。');
   requireState(await page.locator('#work [data-do="save-note"]').evaluate(el=>el.classList.contains('primary')),'save becomes the sole main action when there is a draft');
   requireState(!await page.locator('#actions [data-do="lesson"][data-id="quarters"]').evaluate(el=>el.classList.contains('primary')),'unsaved text does not compete with next lesson');
   await shot('24-decimal-reflection-before-save');
   await page.locator('#work [data-do="save-note"]').click();
   const confirmed=await page.locator('#note-save-status').innerText();
   requireState(confirmed.includes('已保存这次发现'),'save gives visible success feedback, not a silent rerender');
   requireState((await page.locator('.saved-note-preview').innerText()).includes('一个是十分位，一个是百分位。'),'saved note can be read without expanding history');
   requireState(await page.locator('#note').inputValue()==='','confirmed submission is no longer an unsaved draft');
   requireState(await page.locator('#work [data-do="save-note"]').isDisabled(),'saved note cannot accidentally be submitted twice');
   requireState(await page.locator('#actions [data-do="lesson"][data-id="quarters"]').evaluate(el=>el.classList.contains('primary')),'next lesson is the main action after saving');
   let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.decimal);
   requireState(saved.notes.length===1&&saved.notes[0].text==='一个是十分位，一个是百分位。','recorded words are preserved exactly once');
   requireState(Object.values(saved.cases).every(c=>c.attempts.length===1),'saving does not erase or create task attempts');
   await shot('25-decimal-reflection-saved-with-next');
   await page.reload();
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.view==='summary');
   requireState((await page.locator('.saved-note-preview').innerText()).includes('一个是十分位，一个是百分位。'),'saved reflection remains discoverable after refresh');
   requireState(await page.locator('#actions [data-do="lesson"][data-id="quarters"]').isVisible(),'next learning action survives refresh');
   await page.locator('#actions [data-do="lesson"][data-id="quarters"]').click();
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='quarters');
   requireState((await page.locator('#status').innerText()).startsWith('任务 1 /'),'next lesson opens directly without returning to the map or a second menu');
   saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.decimal);
   requireState(saved.notes.length===1&&saved.view==='summary','previous lesson stays completed and recorded when continuing');
   requireState(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.quarters?.cases?.[0]?.attempts?.length)),'opening the next activity does not fabricate a checked attempt');
   await shot('26-quarters-continuation');
   // Verify the same save->next behavior inside the user's actual 3D workspace,
   // not only in a standalone runner.
   await page.goto(base+'?world=network&layout=53#space/node/mt_TqDq6jyOmL');
   await page.waitForFunction(()=>window.mathSpace?.snapshot().selected==='node:mt_TqDq6jyOmL');
   const startingPose=await page.evaluate(()=>mathSpace.snapshot());
   await page.locator('#focus-card [data-action="open"]').first().click();
   const embedded=page.frameLocator('#journey-frame');
   await embedded.locator('#note').waitFor();
   requireState((await embedded.locator('.saved-note-preview').innerText()).includes('一个是十分位，一个是百分位。'),'embedded summary restores the prior saved note');
   await embedded.locator('#note').fill('从同一张数学树继续研究分数和小数。');
   await embedded.locator('#work [data-do="save-note"]').click();
   requireState((await embedded.locator('#note-save-status').innerText()).includes('已保存这次发现'),'embedded save produces visible confirmation');
   requireState((await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.decimal.notes)).length===2,'embedded save retains both original and new notes');
   await shot('27-embedded-summary-saved',true);
   await embedded.locator('#actions [data-do="lesson"][data-id="quarters"]').click();
   requireState((await embedded.locator('#title').innerText()).includes('半杯'),'embedded continuation opens the next real mathematical activity');
   // The iframe renders synchronously, while its parent updates the selected
   // knowledge asynchronously after the lesson-change postMessage.
   await page.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_DRlbMok2lT');
   const endingPose=await page.evaluate(()=>mathSpace.snapshot());
   requireState(startingPose.selected==='node:mt_TqDq6jyOmL'&&endingPose.selected==='node:mt_DRlbMok2lT','next lesson updates the selected knowledge to the real linked activity, not an unrelated node');
   requireState(startingPose.position.every((v,i)=>Math.abs(v-endingPose.position[i])<.002),'next lesson does not move the 3D camera');
   await shot('28-embedded-quarters-next',true);
   // User screenshot: 1/4 shown as 20 colored squares and 0.2. The next
   // mathematical operation must be explicit without adding a new navigation.
   await embedded.locator('#work [data-do="row-fill"]').click();
   await embedded.locator('#work [data-do="row-fill"]').click();
   await embedded.locator('#work [data-field="decimal"]').fill('0.2');
   await embedded.locator('#actions [data-do="check"]').click();
   requireState(await embedded.locator('#scene').getAttribute('data-stage')==='revise','wrong 1/4 construction remains a checked error, not next-topic progress');
   const nextAction=await embedded.locator('#check-feedback .feedback-next').innerText();
   requireState(nextAction.includes('20 格')&&nextAction.includes('20/100'),'visible next action describes the 20 colored squares actually submitted');
   requireState(nextAction.includes('100 格平均分成 4 份')&&nextAction.includes('核对小数'),'visible next action guides the child to repair the grid and decimal');
   requireState(nextAction.includes('连接不同表示方式'),'thinking method is offered as a strategy, not claimed as learned');
   requireState(await embedded.locator('#thinking-feedback').count()===0,'failed attempt never implies thinking-method mastery');
   await shot('28a-quarter-20-of-100-needs-next-step',true);
   for(const cell of [20,21,22,23,24])await embedded.locator('#work [data-do="cell"][data-index="'+cell+'"]').click();
   await embedded.locator('#work [data-field="decimal"]').fill('0.25');
   requireState(await embedded.locator('#scene').getAttribute('data-stage')==='recheck','edited work needs a new check before advancing');
   requireState(await embedded.locator('#check-feedback .feedback-next').count()===0,'old wrong-construction advice clears after editing');
   await embedded.locator('#actions [data-do="check"]').click();
   requireState(await embedded.locator('#scene').getAttribute('data-stage')==='passed','correct 1/4 representation passes with existing grader');
   requireState((await embedded.locator('#thinking-feedback').innerText()).includes('25 格'),'thinking observation uses the current submitted 25-square evidence');
   requireState(await embedded.locator('[data-thinking-node-id="mt_EBYGhd8X3x"]').count()===1,'source map MP2 thinking node appears only after checked work');
   requireState(await embedded.locator('#actions [data-do="next"]').isVisible(),'a checked correct workpiece now offers the existing next question');
   const prior=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.quarters);
   requireState(prior.cases[0].attempts.length===2&&prior.cases[0].attempts[0].value.selected.length===20,'both attempts retained without creating a new thinking score');
   await shot('28b-quarter-correct-thinking-method-and-next',true);
   // User's next Mac screenshot: three correct cup levels and decimals, 2/2.
   // Check that passing is explained mathematically and connected to MP2,
   // without adding another navigation or an invented mastery result.
   await embedded.locator('#actions [data-do="next"]').click();
   requireState((await embedded.locator('#instruction').innerText()).includes('三个直筒杯'),'the next configured question is the three-cup model');
   for(const [i,level] of [50,75,25].entries()){
     await embedded.locator('#work [data-height="'+i+'"]').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},level);
   }
   for(const [i,name] of ['0.5','0.75','0.2'].entries()){
     await embedded.locator('#work [data-name="'+i+'"]').fill(name);
   }
   await embedded.locator('#actions [data-do="check"]').click();
   requireState(await embedded.locator('#scene').getAttribute('data-stage')==='revise','wrong cup decimal does not receive checked thinking credit');
   requireState(await embedded.locator('#math-explanation').isHidden(),'unmatched cup names cannot display a false mathematical equivalence');
   requireState(await embedded.locator('#math-explanation [data-thinking-node-id]').count()===0,'no MP2 source link before valid check');
   await embedded.locator('#work [data-name="2"]').fill('0.25');
   requireState(await embedded.locator('#scene').getAttribute('data-stage')==='recheck','edited cup name requires another explicit check');
   await embedded.locator('#actions [data-do="check"]').click();
   requireState(await embedded.locator('#scene').getAttribute('data-stage')==='passed','correct fractions, cup levels and decimals pass the existing grader');
   const mathExplanation=await embedded.locator('#math-explanation').innerText();
   requireState(mathExplanation.includes('1/2 = 50/100 = 0.5')&&mathExplanation.includes('3/4 = 75/100 = 0.75')&&mathExplanation.includes('1/4 = 25/100 = 0.25'),'all three checked cup relationships are explained from the submitted work');
   requireState(mathExplanation.includes('并不是三杯水都一样多'),'math feedback does not conflate equal representation and equal water volume');
   requireState(await embedded.locator('#math-explanation [data-thinking-node-id="mt_EBYGhd8X3x"]').count()===1,'one source-grounded MP2 thinking method appears in the existing feedback region');
   requireState(await embedded.locator('#thinking-feedback').count()===0,'math and thinking feedback are not duplicated in the interactive workspace');
   requireState((await embedded.locator('#next-guidance').innerText()).includes('任选一杯'),'passed state prompts an explanation before reflection');
   requireState((await embedded.locator('#actions [data-do="next"]').innerText()).includes('整理这次发现'),'the same primary action advances to reflection');
   const checkedCupRecord=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.quarters);
   requireState(checkedCupRecord.cases[1].attempts.length===2,'wrong and correct cup submissions remain in the original history');
   await shot('28c-three-cups-math-and-thinking-explanation',true);
   await embedded.locator('#actions [data-do="next"]').click();
   requireState(await embedded.locator('#note').isVisible(),'the existing reflection screen remains available');
   requireState((await embedded.locator('#work').innerText()).includes('百格涂了 1/4'),'reflection connects both the grid and cups rather than introducing a new page');
   requireState(await embedded.locator('#math-explanation').isHidden(),'reflection does not misrepresent old checked math as a new submission');
   await shot('28d-three-cups-reflection',true);
   // The route has ended (A 4/4). This must not become a dead end or force
   // a written answer. The next optional activity comes from a real source edge.
   const linkedId='link-decimal-quarters';
   const primaryLinked=embedded.locator('#actions [data-do="lesson"][data-id="'+linkedId+'"]');
   requireState(await embedded.locator('#note').inputValue()==='','the optional reflection starts empty');
   requireState(await embedded.locator('#work [data-do="save-note"]').isDisabled(),'saving is disabled until the learner writes something');
   requireState((await embedded.locator('.reflection-optional').innerText()).includes('不写'),'the learner is explicitly told writing is optional');
   requireState(!await embedded.locator('#system-explanation').evaluate(el=>el.open),'three-cup solution and MP2 guidance must start collapsed');
   requireState(await embedded.locator('#system-explanation .summary-thinking').count()===1,'MP2 source cue remains accessible in the single opt-in math explanation');
   requireState((await embedded.locator('#system-explanation .summary-thinking').textContent()).includes('连接不同表示方式'),'unchanged source-backed MP2 method is preserved');
   requireState(!(await embedded.locator('#learning-problem').innerText()).includes('1/2 ='),'child is not shown mathematical conclusions before independent summary');
   requireState(await embedded.locator('#actions button').count()===1,'route-end summary exposes exactly one next destination button');
   await embedded.locator('#system-explanation>summary').click();
   requireState((await embedded.locator('#system-explanation').innerText()).includes('1/4 = 25/100 = 0.25'),'opening the explanation reveals the original mathematical summary');
   requireState((await embedded.locator('#system-explanation .summary-thinking').innerText()).includes('连接不同表示方式'),'opt-in thinking cue becomes readable on demand');
   await embedded.locator('#system-explanation>summary').click();
   // Disclosure interaction scrolls the iframe. Re-check first-screen reachability
   // from a fresh top-of-panel position, not from the scrolled help content.
   await embedded.locator('#learning-problem').evaluate(el=>el.ownerDocument.defaultView.scrollTo(0,0));
   requireState(await primaryLinked.isVisible()&&await primaryLinked.isEnabled(),'the real linked practice is immediately available as the route-end main action');
   const summaryRegions=await embedded.locator('#scene > .learning-region').evaluateAll(elements=>elements.map(el=>el.id));
   requireState(summaryRegions.join(',')==='learning-problem,learning-check,learning-interaction,learning-next','completed route visually and semantically puts the next choice before optional writing');
   const actionVisibility=await primaryLinked.evaluate(el=>{
     const r=el.getBoundingClientRect();
     return {top:r.top,bottom:r.bottom,viewport:el.ownerDocument.defaultView.innerHeight};
   });
   requireState(actionVisibility.top>=0&&actionVisibility.bottom<actionVisibility.viewport,'next learning action must be above the fold in a real 664px-high embedded panel, not merely display:visible');
   requireState(await embedded.locator('#note-save-status').evaluate(el=>el.previousElementSibling?.dataset.do==='save-note'),'save confirmation stays beside the optional writing action');

   requireState((await primaryLinked.innerText()).includes('百格里的量，怎样装进杯子'),'the suggestion names the actual configured source-backed bridge');
   requireState(await primaryLinked.evaluate(el=>el.classList.contains('primary')),'the source-backed related activity is the main continuation instead of return to space');
   requireState(await embedded.locator('#p3-learning-flow [data-do="lesson"][data-id="'+linkedId+'"]').count()===0,'the same linked activity is not repeated in an optional menu');
   requireState(await page.locator('#journey-surface [data-action="close-journey"]').isVisible(),'embedded learning closes through its single visible outer 3D header exit');
   requireState(await embedded.locator('#back').isHidden(),'the embedded iframe does not introduce a second hidden-or-duplicated exit');
   requireState(await embedded.locator('#actions [data-do="back"]').count()===0,'no second return button competes with the real linked continuation');
   requireState(await embedded.locator('#p3-learning-flow [data-do="p3-retry"]').count()===1,'retrial remains available in the secondary tools without a foreground duplicate');
   requireState(await embedded.locator('#p3-learning-flow [data-do="restart"]').count()===1,'original full-group restart remains available separately from one-question retry');
   await shot('28e-route-end-visible-next-with-optional-reflection',true);
   await embedded.locator('#note').fill('分数和小数表示同一个比例，但百格和杯子的整体不一样。');
   requireState(await embedded.locator('#work [data-do="save-note"]').evaluate(el=>el.classList.contains('primary')),'save becomes primary only while an unsaved explanation is present');
   requireState(!await primaryLinked.evaluate(el=>el.classList.contains('primary')),'the unsaved draft has only one primary action');
   await embedded.locator('#work [data-do="save-note"]').click();
   requireState((await embedded.locator('#note-save-status').innerText()).includes('已保存这次发现'),'saved text produces confirmation before continuing');
   requireState(await primaryLinked.evaluate(el=>el.classList.contains('primary')),'after saving, the source-backed continuation becomes primary again');
   const previous=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.quarters);
   requireState(previous.notes.length===1&&previous.notes[0].text.includes('整体不一样'),'the original v2 record keeps the reflection exactly once');
   requireState(previous.cases[1].attempts.length===2,'wrong and correct cups stay in the attempt history');
   await shot('28f-route-end-saved-and-continue',true);
   const bridgePose=await page.evaluate(()=>mathSpace.snapshot());
   await primaryLinked.click();
   requireState((await embedded.locator('#title').innerText()).includes('百格里的量'),'the optional source-backed bridge opens directly in the same learning workspace');
   requireState((await embedded.locator('#status').innerText()).startsWith('任务 1 /'),'the bridge begins at its original first activity');
   const following=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
   requireState(following.lessons.quarters.notes.length===1,'the source lesson reflection survives the transition');
   requireState(!following.daily.bridges[linkedId]?.cases?.[0]?.attempts?.length,'opening a linked activity does not manufacture a correct attempt');
   const afterBridgePose=await page.evaluate(()=>mathSpace.snapshot());
   requireState(bridgePose.position.every((v,i)=>Math.abs(v-afterBridgePose.position[i])<.002),'the 3D camera pose is preserved when continuing from the final task');
   await shot('28g-source-bridge-opens-directly',true);
   // A failed localStorage write must never look like a successful save,
   // including the case where an input autosave fails before the button click.
   await page.goto(base+'learn.html#decimal');
   await page.waitForFunction(()=>window.mathLesson?.snapshot()?.view==='summary');
   await page.locator('#note').fill('存储失败时不能丢掉的文字。');
   requireState(await page.locator('#work [data-do="save-note"]').isEnabled(),'the unsaved note can be submitted before storage fails');
   await page.evaluate(()=>{
     const original=Storage.prototype.setItem;
     Storage.prototype.setItem=function(key,value){
       if(key==='math-explorer-v2')throw new DOMException('Simulated quota full','QuotaExceededError');
       return original.call(this,key,value);
     };
   });
   await page.locator('#work [data-do="save-note"]').click();
   requireState((await page.locator('#note-save-status').innerText()).includes('尚未保存成功'),'failed save gives visible warning next to the field');
   requireState(await page.locator('#note-save-status').getAttribute('data-state')==='error','failed save is never marked as a success');
   requireState((await page.locator('#note').inputValue()).includes('不能丢掉'),'storage failure never clears the unsaved text');
   requireState(await page.locator('#storage-warning').isVisible(),'original non-destructive storage failure warning remains available');
   const failed=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.decimal);
   requireState(failed.notes.length===2,'failed write cannot fake an extra saved reflection');
   await shot('29-storage-failure-preserves-draft');
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