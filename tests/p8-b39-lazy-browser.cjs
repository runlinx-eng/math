// B39 cold startup boundary and durable saved-state smoke test in Chromium.
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.MATH_BROWSER_BASE||'http://127.0.0.1:43827';
const b39=/\/learning\/phase5\/b39(?:-model|-view)?\.js(?:\?|$)/;
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await ctx.newPage(),requests=[];
  page.on('request',r=>{if(b39.test(r.url()))requests.push(r.url());});
  try{
    await page.goto(base+'/?world=network&layout=53#space',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.mathSpace?.snapshot()?.counts?.nodes===587);
    assert.deepEqual(requests,[],'3D homepage must not request B39 task/model/view');
    await page.goto(base+'/learn.html#graph39',{waitUntil:'domcontentloaded'});
    await page.locator('#work').waitFor({state:'visible',timeout:25000});
    await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='graph39');
    assert.ok(requests.some(s=>s.includes('/b39.js')),'Selected B39 must request task definition');
    assert.ok(requests.some(s=>s.includes('/b39-model.js')),'Selected B39 must request math validator');
    assert.ok(requests.some(s=>s.includes('/b39-view.js')),'Selected B39 must request renderer');
    const stored=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
    assert.ok(stored,'Opening a B39 task should persist a valid record');
    const loaded=requests.length;
    // Native ESM cache must reuse the same batch when navigating to another B39 lesson.
    await page.evaluate(()=>{location.hash='#calculator39';});
    await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='calculator39');
    assert.equal(requests.length,loaded,'Second B39 lesson should reuse cached ESM');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='calculator39');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.calculator39?.id),'calculator39');
    // Invalid saved B39 work must never be overwritten by lazy initialization.
    const corrupt=JSON.stringify({schema:2,lessons:{graph39:{id:'graph39',invalid:true}}});
    await page.evaluate(text=>localStorage.setItem('math-explorer-v2',text),corrupt);
    await page.goto(base+'/learn.html#graph39',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#storage-warning')?.textContent.includes('禁止覆盖'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('math-explorer-v2')),corrupt);
    console.log('B39_LAZY_BROWSER_OK '+JSON.stringify({firstLoads:loaded,reused:true,restored:true,invalidRecordPreserved:true}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
