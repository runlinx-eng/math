// Isolated profiles only. No existing browser profile or learner storage is opened.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'verification/spatial-readability-20261029');
const suites={
  readability:['tests/spatial-readability-browser.js'],
  global:['tests/spatial-global-browser.js'],camera:['tests/spatial-global-camera-browser.js'],
  regressions:['tests/phase5-b39-regression/spatial.js','tests/phase5-b39-regression/daily.js','tests/phase5-b39-regression/readiness.js','tests/phase5-b39-integration-browser.js']
};
const group=process.argv[2]||'readability';
if(!suites[group])throw Error('Choose readability, global, camera or regressions.');
(async()=>{
  fs.mkdirSync(path.join(evidence,'regression/spatial'),{recursive:true});fs.mkdirSync(path.join(evidence,'regression/b39'),{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-gl=swiftshader','--disable-crash-reporter']});
  const ctx=await browser.newContext(),page=await ctx.newPage(),results={};
  try{
    for(const file of suites[group]){
      let code=fs.readFileSync(path.join(root,file),'utf8').replaceAll('learning-v49','learning-v50').replaceAll('learning-v46','learning-v50').replaceAll('?v=49','?v=50').replaceAll('&v=49','&v=50').replaceAll('?v=46','?v=50')
        .replaceAll('/verification/spatial-global-20261029/','/verification/spatial-readability-20261029/')
        .replaceAll('/verification/phase5/B39/regression/spatial/','/verification/spatial-readability-20261029/regression/spatial/')
        .replaceAll('/verification/phase5/B39/','/verification/spatial-readability-20261029/regression/b39/');
      if(file.endsWith('/spatial.js'))code=code.replaceAll('?v=50#space','?world=classic&v=50#space');
      const result=await eval('('+code+')')(page);results[file]=result;
      console.log(JSON.stringify({file,checks:result.checks?.length,errors:result.errors,failed:result.failed||null}));
      if(result.failed)process.exitCode=1;
    }
  }finally{fs.writeFileSync(path.join(evidence,group+'-results.json'),JSON.stringify(results,null,2));await ctx.close();await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
