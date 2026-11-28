// Fresh native user flow, never restored historical records or generated
// archived evidence. Original strict source and current Check semantics.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/current-formal-evidence');
const base='http://127.0.0.1:43827/',checks=[],errors=[],remote=[];
const ok=(v,label)=>{assert.ok(v,label);checks.push(label);};
fs.mkdirSync(out,{recursive:true});
let browser,context,page;
(async()=>{
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 context=await newDesktopContext(browser,{reducedMotion:'reduce'});
 page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(String(e)));context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
 await page.goto(base+'learn.html#countonce');
 // Opening the task is synchronous after the main runtime loads, but its
 // exact-source feedback registry is loaded asynchronously. Wait for the
 // native guide (not for the feedback under test) on every reload, so a
 // negative feedback assertion cannot pass just because the route is absent.
 const wait=async()=>{
  await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='countonce'&&document.querySelector('#storage-warning')?.hidden===true,null,{timeout:60000});
  const guide=page.locator('#thinking-guide');
  await guide.waitFor({state:'attached',timeout:60000});
  assert.match(await guide.textContent(),/哪些记录能帮助你核对这次结果/);
 };
 await wait();
 const x=(name,i)=>page.locator('[data-x="'+name+'"]'+(i===undefined?'':'[data-index="'+i+'"]'));
 const field=key=>page.locator('[data-xfield="'+key+'"]');
 const feedback=page.locator('#thinking-feedback');
 const submit=()=>page.locator('#actions [data-do="check"]').click();
 const record=()=>page.evaluate(async()=>{const {readStored}=await import('./storage.js');return JSON.parse(readStored('math-explorer-v2')).lessons.countonce;});
 ok(((await record()).cases[0]?.attempts?.length||0)===0,'fresh actual learner record');
 ok(await feedback.count()===0,'no strict feedback before Check');
 for(const i of [0,1,2,2,3,4,5,6])await x('count-tap',i).click();
 await field('total').fill('7');await submit();
 ok(await feedback.count()===0,'duplicate counting does not earn strict evidence');
 const wrong=await record();
 const verdict=await page.evaluate(async value=>{
  const {sessionTaskFor}=await import('./learning/bridges.js');
  const {inspect}=await import('./learning/tasks.js');
  return inspect(sessionTaskFor('countonce',0),value).correct;
 },wrong.cases[0].attempts.at(-1).value);
 assert.equal(verdict,false,'first native Check really was incorrect');
 await x('count-reset').click();for(const i of [0,1,2,3,4,5,6])await x('count-tap',i).click();
 await field('total').fill('7');await submit();
 ok(await feedback.isVisible(),'correct current source has strict submitted feedback');
 ok((await feedback.innerText()).includes('这次作品中的思考线索'),'bounded original feedback');
 const correct=await record();assert.deepEqual(correct.cases[0].attempts.slice(0,1),wrong.cases[0].attempts);
 assert.equal(correct.cases[0].attempts.length,2);
 await page.screenshot({path:path.join(out,'correct-current-source.png'),fullPage:true});
 const reload=async before=>{
  await page.reload();await wait();
  const after=await record();
  for(const k of ['models','cases','notes','draft'])assert.deepEqual(after[k],before[k],'reload preserves '+k);
 };
 await reload(correct);ok(await feedback.isVisible(),'correct evidence survives real reload');
 await field('total').fill('6');ok(await feedback.count()===0,'unsubmitted edit removes current feedback');
 await reload(await record());ok(await feedback.count()===0,'reload cannot revive stale evidence');
 await submit();ok(await feedback.count()===0,'wrong new Check remains unverified');
 await field('total').fill('7');await submit();ok(await feedback.isVisible(),'fresh corrected Check restores evidence');
 const after=await record();assert.deepEqual(after.cases[0].attempts.slice(0,2),correct.cases[0].attempts);
 assert.equal(after.cases[0].attempts.length,4);
 ok(errors.length===0&&remote.length===0,'local operation without page errors or remote requests');
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,historicalOriginalChecksReplayed:0},null,2));
 console.log('CURRENT_FORMAL_BROWSER_OK '+JSON.stringify({checks:checks.length,historicalOriginalChecksReplayed:0}));
})().catch(async e=>{errors.push(String(e.stack||e));if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote},null,2));console.error(e.stack);process.exitCode=1;}).finally(async()=>{await context?.close();await browser?.close();});
