// Issue #90: real Chromium A-learning/B-exploration with one retained iframe.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.MATH_BROWSER_BASE||'http://127.0.0.1:43827';
const dir=path.resolve(__dirname,'../verification/explore-during-learning');
const ids={a:'mt_Ep7TDFuYUa',b:'mt_ndGqFPWyen',c:'mt_WcfaSfVT33',d:'mt_dmNvjroCPT'};
const checks=[],errors=[];
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 const frame=page.frameLocator('#journey-frame');
 const check=(condition,label)=>{assert.ok(condition,label);checks.push(label);};
 const snap=()=>page.evaluate(()=>({map:mathSpace.snapshot(),lesson:document.querySelector('#journey-frame').contentWindow.mathLesson?.snapshot(),work:document.querySelector('#journey-frame').contentDocument?.querySelector('#work')?.outerHTML,src:document.querySelector('#journey-frame').contentWindow.location.href,token:document.querySelector('#journey-frame').contentWindow.__issue90Token||null,focus:document.querySelector('#focus-card')?.textContent||'',context:document.querySelector('#learning-map-context')?.textContent||'',tier:[...document.querySelectorAll('.space-label.node')].filter(el=>el.dataset.key==='node:mt_ndGqFPWyen').map(el=>el.dataset.progress),course:JSON.parse(localStorage.getItem('math-explorer-v2')||'null')}));
 const picture=name=>page.screenshot({path:path.join(dir,name+'.png'),fullPage:false});
 const select=async id=>{
   await page.locator('.top-tools [data-action="search"]').click();
   await page.locator('#search-input').fill(id);
   await page.locator('#search-results [data-key="node:'+id+'"]').click();
   await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,id);
 };
 const native=async id=>page.waitForFunction(id=>document.querySelector('#journey-frame')?.contentWindow?.mathLesson?.snapshot?.()?.id===id,id);
 try{
   await page.goto(base+'/?world=network&layout=53#space');
   await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
   await select(ids.a);
   await page.locator('#focus-card [data-action="open"]').click();
   await native('equivalent');
   const first=await snap();
   check(first.map.journeyOpen&&!first.map.journeySuspended&&first.lesson.index===0,'A native course open on right');
   await picture('01-learning-a');
   // Real mathematical control: modify the current answer without submitting.
   await frame.locator('#work [data-do="row-part"][data-row="0"][data-index="1"]').click();
   const draft=await snap();
   check(draft.lesson.index===0&&draft.work!==first.work,'A unsubmitted mathematical workpiece changed');
   await page.evaluate(()=>{document.querySelector('#journey-frame').contentWindow.__issue90Token='live-a';});
   const beforeSaved=draft.course.lessons.equivalent;
   await select(ids.b);
   let b=await snap();
   check(b.map.selected==='node:'+ids.b&&b.map.journeyOpen&&!b.map.journeySuspended,'B is exploration selection, A still open');
   check(b.lesson.id==='equivalent'&&b.lesson.index===0&&b.token==='live-a','B selection does not navigate/recreate A iframe');
   check(b.work===draft.work,'B selection preserves unsubmitted A workpiece');
   check(b.focus.includes('理解')&&b.focus.includes('联系'),'B existing details are shown beside A');
   check(b.context.includes('正在学习'),'A docked context remains visible');
   check(!b.course.lessons.share?.cases?.some(c=>c.attempts?.length),'exploring B creates no scored attempt');
   check(b.tier[0]==='tier-1','exploring B does not increase tier');
   await picture('02-learning-a-exploring-b');
   await page.setViewportSize({width:1280,height:720});
   await page.waitForFunction(()=>innerWidth===1280&&innerHeight===720);
   await picture('02b-learning-a-exploring-b-1280x720');
   const compact=await snap();
   check(compact.map.selected==='node:'+ids.b&&compact.lesson.id==='equivalent'&&compact.token==='live-a',
     '1280x720 A/B desktop view retains the same iframe and B map selection');
   await page.setViewportSize({width:1440,height:900});
   await page.locator('#focus-card [data-action="focus-section"][data-section="relations"]').click();
   await picture('03-b-expanded-details');
   await select(ids.c);
   let c=await snap();
   check(c.map.selected==='node:'+ids.c&&c.lesson.id==='equivalent'&&c.token==='live-a','C selection preserves A iframe');
   await picture('04-learning-a-exploring-c');
   await select(ids.d);
   check((await snap()).lesson.id==='equivalent','D selection preserves A iframe');
   // Restore B and submit A while B remains selected: iframe progress messages
   // must not steal exploration focus or change the B answer ledger.
   await select(ids.b);
   await frame.locator('#actions [data-do="check"]').click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('math-explorer-v2')||'{}')?.lessons?.equivalent?.cases?.[0]?.attempts?.length===1);
   b=await snap();
   check(b.map.selected==='node:'+ids.b&&b.lesson.id==='equivalent'&&b.token==='live-a','A saved submission does not steal B map focus');
   check(b.course.lessons.equivalent.cases[0].attempts.length===1,'A answer saved correctly while exploring B');
   check(!b.course.lessons.share?.cases?.some(c=>c.attempts?.length),'B is still unattempted after A saved');
   check(b.tier[0]==='tier-1','B tier unchanged after A progress update');
   await picture('05-a-progress-while-b-selected');
   await page.locator('#focus-card [data-action="deselect"]').click();
   const closed=await snap();
   check(closed.map.selected==='node:'+ids.a&&closed.lesson.id==='equivalent'&&closed.token==='live-a','close B details returns map focus to A without reload');
   await picture('06-close-b-return-a');
   // Opening B via its *explicit lesson CTA* is the only direct card route that
   // changes the course while a native lesson is still mounted.
   await select(ids.b);
   await page.locator('#focus-card [data-action="open"]').click();
   await native('share');
   let switched=await snap();
   check(switched.lesson.id==='share','explicit B lesson action switches to B');
   check(switched.course.lessons.equivalent.cases[0].attempts.length===1,'A submitted answer survives explicit switch');
   await picture('07-explicit-learn-b');
   // Restore saved A course through its existing entry; no schema migration.
   await select(ids.a);
   await page.locator('#focus-card [data-action="open"]').click();
   await native('equivalent');
   let restored=await snap();
   check(restored.course.lessons.equivalent.cases[0].attempts.length===1,'A real submitted answer resumes');
   await select(ids.b);
   await page.reload();
   await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
   await native('equivalent');
   restored=await snap();
   check(restored.map.selected==='node:'+ids.b&&restored.lesson.id==='equivalent','reload restores A lesson and B exploration separately');
   check(await page.locator('#focus-card').isVisible(),'refresh restores B exploration details alongside A');
   check(restored.course.lessons.equivalent.cases[0].attempts.length===1,'reload retains A submission');
   check(errors.length===0,'no page errors: '+errors.join(' ; '));
   await picture('08-refreshed-a-and-b');
   fs.writeFileSync(path.join(dir,'browser-results.json'),JSON.stringify({schema:'math-explore-during-learning-browser/1',checks,errors,ids,chromium:true},null,2)+'\n');
   console.log('EXPLORE_DURING_LEARNING_BROWSER '+checks.length+' checks passed');
 }catch(error){
   fs.writeFileSync(path.join(dir,'browser-results.json'),JSON.stringify({schema:'math-explore-during-learning-browser/1',checks,errors:[...errors,String(error)],ids,chromium:true},null,2)+'\n');
   await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});
   console.error('EXPLORE_DURING_LEARNING_FAILURE '+(error.stack||error));process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
