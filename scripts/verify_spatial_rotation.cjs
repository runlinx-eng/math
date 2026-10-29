const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'verification/spatial-rotation-20261029');
const groups={rotation:['tests/spatial-rotation-browser.js'],exploration:['tests/spatial-exploration-browser.js'],global:['tests/spatial-global-browser.js'],camera:['tests/spatial-global-camera-browser.js'],classic:['tests/phase5-b39-regression/spatial.js']};
const group=process.argv[2]||'rotation';if(!groups[group])throw Error('Choose rotation, exploration, global, camera or classic.');
(async()=>{fs.mkdirSync(path.join(evidence,'regression/spatial'),{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-gl=swiftshader','--disable-crash-reporter']}),ctx=await browser.newContext(),page=await ctx.newPage(),results={};
  try{for(const file of groups[group]){
    let code=fs.readFileSync(path.join(root,file),'utf8').replaceAll('learning-v49','learning-v52').replaceAll('learning-v46','learning-v52').replaceAll('learning-v51','learning-v52').replaceAll('?v=49','?v=52').replaceAll('&v=49','&v=52').replaceAll('?v=46','?v=52').replaceAll('?v=51','?v=52')
      .replaceAll('/verification/spatial-global-20261029/','/verification/spatial-rotation-20261029/').replaceAll('/verification/spatial-exploration-20261029/','/verification/spatial-rotation-20261029/').replaceAll('/verification/phase5/B39/regression/spatial/','/verification/spatial-rotation-20261029/regression/spatial/');
    if(group==='classic')code=code.replaceAll('?v=52#space','?world=classic&v=52#space');
    if(group==='global')code=code.replaceAll("await page.locator('.network-relations > summary').click();","if(!await page.locator('.network-relations').evaluate(el=>el.open))await page.locator('.network-relations > summary').click();").replaceAll("await other.locator('.network-relations > summary').click();","if(!await other.locator('.network-relations').evaluate(el=>el.open))await other.locator('.network-relations > summary').click();");
    const result=await eval('('+code+')')(page);results[file]=result;console.log(JSON.stringify({file,checks:result.checks?.length,errors:result.errors,failed:result.failed||null}));if(result.failed||result.errors?.length)process.exitCode=1;
  }}finally{fs.writeFileSync(path.join(evidence,group+'-results.json'),JSON.stringify(results,null,2));await ctx.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
