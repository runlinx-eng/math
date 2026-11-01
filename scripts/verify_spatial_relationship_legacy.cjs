// Run historical browser suites in isolated contexts against the preserved v49
// world, writing fresh evidence without changing the historical fixtures.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,process.env.MATH_SPATIAL_EVIDENCE||'verification/thinking-feedback-v56-20261101/legacy');
const groups={rotation:'tests/spatial-rotation-browser.js',exploration:'tests/spatial-exploration-browser.js',global:'tests/spatial-global-browser.js',camera:'tests/spatial-global-camera-browser.js',classic:'tests/phase5-b39-regression/spatial.js'};
const group=process.argv[2];if(!groups[group])throw Error('Choose rotation, exploration, global, camera or classic.');
(async()=>{
  fs.mkdirSync(path.join(evidence,'spatial'),{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']}),ctx=await browser.newContext(),page=await ctx.newPage();
  try{
    let code=fs.readFileSync(path.join(root,groups[group]),'utf8')
      .replaceAll('?world=network','?world=network&layout=49')
      .replaceAll('learning-v49','learning-v56').replaceAll('learning-v46','learning-v56').replaceAll('learning-v51','learning-v56').replaceAll('learning-v52','learning-v56')
      .replaceAll('?v=49','?v=56').replaceAll('&v=49','&v=56').replaceAll('?v=46','?v=56').replaceAll('?v=51','?v=56').replaceAll('&v=51','&v=56').replaceAll('&v=52','&v=56')
      .replaceAll('/Users/zj1-6/dev/math/verification/spatial-global-20261029/',evidence+'/')
      .replaceAll('/Users/zj1-6/dev/math/verification/spatial-exploration-20261029/',evidence+'/')
      .replaceAll('/Users/zj1-6/dev/math/verification/phase5/B39/regression/spatial/',path.join(evidence,'spatial')+'/');
    if(group==='classic')code=code.replaceAll('?v=56#space','?world=classic&v=56#space');
    if(group==='global')code=code.replaceAll("await page.locator('.network-relations > summary').click();","if(!await page.locator('.network-relations').evaluate(el=>el.open))await page.locator('.network-relations > summary').click();").replaceAll("await other.locator('.network-relations > summary').click();","if(!await other.locator('.network-relations').evaluate(el=>el.open))await other.locator('.network-relations > summary').click();");
    const result=await eval('('+code+')')(page);
    fs.writeFileSync(path.join(evidence,group+'-results.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify({group,checks:result.checks?.length,failed:result.failed||null,errors:result.errors||[]}));
    if(result.failed||result.errors?.length||result.remote?.length)process.exitCode=1;
  }finally{await ctx.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
