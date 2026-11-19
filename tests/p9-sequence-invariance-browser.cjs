'use strict';
// CI #239 Step 5: genuine NEW independent MP.8 sequence-pattern browser family.
// A real 1920x1080 Chromium context, original wrong math, correction,
// persisted model and screenshots. No answer/model/proof is injected.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=
 require('./helpers/standard-desktop-viewport.cjs');
const {createOrigin,capture}=require('./helpers/p9-basic-artifact.cjs');

const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p9-sequence-invariance');
const spec={id:'general34',index:2,steps:['5','10','15','20'],
  firstWrong:'999',wrongConclusion:'two-seven',correctConclusion:'zero-five',
  initial:0,increment:5,thinkingNode:'mt_fZTn0W_iZR'};
const checks=[],errors=[],observations=[],screenshots=[];
const proofContracts=['math','correction','persistence','negative'];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,
  testedCheckoutSha:checkoutSha,githubSha:process.env.GITHUB_SHA||null,
  runId:process.env.GITHUB_RUN_ID||null,
  runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
  childTrial:false,masteryInferred:false,
  seededCorrectWork:false,seededLessonPositionOnly:true};
function check(ok,label){assert.ok(ok,label);checks.push(label);}
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
  schema:'math-p9-sequence-invariance-browser/1',
  checks,errors,proofContracts,observations,screenshots,
  viewport:STANDARD_DESKTOP_VIEWPORT,provenance
},null,2)+'\n');

async function main(){
 fs.mkdirSync(out,{recursive:true});
 let browser,context,page,origin;
 const snap=async label=>{
  const file=label+'.png';
  await page.screenshot({path:path.join(out,file),fullPage:false});
  screenshots.push(file);
 };
 try{
  // Independent arithmetic oracle. Never invoke the lesson's own solver.
  const intended=[spec.initial,...spec.steps.map(Number)];
  check(JSON.stringify(intended)==='[0,5,10,15,20]',
   'reviewed five-term sequence oracle is unchanged');
  check(intended.slice(1).every((v,i)=>v-intended[i]===spec.increment),
   'independent mathematics: four consecutive differences are exactly five');

  origin=await createOrigin(root);
  browser=await chromium.launch({headless:true,
    args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  context=await newDesktopContext(browser,{reducedMotion:'reduce',serviceWorkers:'block'});
  page=await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push('pageerror: '+String(error)));
  context.on('request',request=>{
   if(/^https?:/.test(request.url())&&!request.url().startsWith(origin.base))
    errors.push('external network request: '+request.url());
  });
  await page.goto(origin.base+'learn.html#'+spec.id,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
  // Change only the EMPTY lesson's location (as in the accepted legacy B34
  // browser evidence). Never insert any answer, completed work or score.
  await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
  await page.reload();
  await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,spec.id);
  await page.evaluate(({id,index})=>{
   const state=JSON.parse(localStorage.getItem('math-explorer-v2'));
   state.lessons[id].index=index;
   state.lessons[id].view='task';
   localStorage.setItem('math-explorer-v2',JSON.stringify(state));
  },{id:spec.id,index:spec.index});
  await page.reload();
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
  check(await page.evaluate(()=>innerWidth===1920&&innerHeight===1080),
   'real browser content viewport is 1920x1080');
  await snap('01-pristine');
  const feedback=page.locator('#thinking-feedback');
  check(await feedback.count()===0,'no unearned thinking evidence at start');
  const value=page.locator('[data-xfield="value"]');
  const next=page.locator('[data-x="p34-next"]');
  const submit=page.locator('#actions [data-do="check"]');
  const response=page.locator('[data-xfield="answers.0"]');
  async function answer(choice){
   const tag=await response.evaluate(el=>el.tagName);
   if(tag==='SELECT')await response.selectOption(choice);
   else await response.fill(choice);
  }
  // Original wrong first input must be preserved, never silently corrected.
  await value.fill(spec.firstWrong);
  await next.click();
  await submit.click();
  check(await feedback.count()===0,'wrong step does not award thinking evidence');
  const failed=await capture(page,out,'original-math',spec,'failed-first');
  check(failed.model.board.first.next===spec.firstWrong&&failed.model.board.bad===true,
   'first rejected mathematical attempt is retained in actual browser model');
  await snap('02-first-error');

  for(const term of spec.steps){await value.fill(term);await next.click();}
  const built=await capture(page,out,'original-math',spec,'built-terms');
  check(JSON.stringify(built.model.board.values)===JSON.stringify(intended),
   'actual UI input creates exactly the independently expected 0,5,10,15,20 sequence');
  check(built.model.board.bad===true&&built.model.board.first.next===spec.firstWrong,
   'later correct steps never rewrite original wrong input');

  await answer(spec.wrongConclusion);await submit.click();
  check(await feedback.count()===0,'wrong generalization fails on real check control');
  await snap('03-wrong-conclusion');
  await answer(spec.correctConclusion);await submit.click();
  check(await feedback.isVisible(),'corrected real conclusion receives bounded evidence');
  const feedbackText=await feedback.innerText();
  check(feedbackText.includes('实际留下了')&&feedbackText.includes('不能据此判断独立归纳'),
   'evidence describes actual work without pretending to measure mastery');
  check(await feedback.locator('[data-thinking-node-id="'+spec.thinkingNode+'"]').count()===1,
   'real thinking evidence links to the correct source node');
  const first=await capture(page,out,'original-math',spec,'corrected-first');
  await snap('04-corrected');
  await page.reload();
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
  check(await feedback.isVisible(),'corrected evidence persists through real reload');
  const restored=await capture(page,out,'original-math',spec,'restored');
  check(JSON.stringify(restored.model)===JSON.stringify(first.model),
   'full corrected math model survives real persisted reload');
  await snap('05-restored');

  await answer(spec.wrongConclusion);
  check(await feedback.count()===0,'editing an answer revokes earlier thinking feedback');
  await page.reload();
  await page.waitForFunction(i=>window.mathLesson?.snapshot()?.index===i,spec.index);
  check(await feedback.count()===0,'invalidated feedback stays revoked after reload');
  await submit.click();
  check(await feedback.count()===0,'incorrect recheck cannot resurrect evidence');
  await answer(spec.correctConclusion);await submit.click();
  check(await feedback.isVisible(),'second correction re-establishes real thinking evidence');
  const final=await capture(page,out,'original-math',spec,'final-corrected');
  check(final.model.board.first.next===spec.firstWrong&&final.model.board.bad,
   'original failure remains in final persisted model');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),
   '1920 content viewport has no horizontal document overflow');
  await snap('06-final');
  check(errors.length===0,'no page exceptions or foreign-network access');
  observations.push({sessionId:spec.id,taskIndex:spec.index,
    reviewedArithmetic:{values:intended,difference:spec.increment},
    firstWrong:failed.model.board.first,
    builtValues:built.model.board.values,
    firstCorrectedModel:first.model,
    restoredModel:restored.model,
    finalModel:final.model,
    screenshotFiles:[...screenshots],
    checkCount:checks.length,feedbackText});
  save();
  console.log('NEW_SEQUENCE_INVARIANCE_BROWSER_OK '+JSON.stringify({
   family:'sequence-invariance',checks:checks.length,screenshots:screenshots.length,
   viewport:STANDARD_DESKTOP_VIEWPORT,sha:checkoutSha}));
 }catch(error){
  errors.push('failure: '+String(error));
  if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:false})
   .then(()=>screenshots.push('failure.png')).catch(()=>{});
  save();console.error(error?.stack||String(error));process.exitCode=1;
 }finally{
  if(context)await context.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  if(origin?.server?.listening)await origin.close().catch(()=>{});
 }
}
if(require.main===module)main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
// CI #261 isolation probe: comment-only change exercises targeted family selection; not for merge.
