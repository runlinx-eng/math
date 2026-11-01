// Run the original actual-control suites in fresh contexts without overwriting
// their historical screenshots or treating their output as a child trial.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),which=process.argv[2];
const suites={b17:'tests/phase5-b17-browser.js',b38:'tests/phase5-b38-browser.js'};
if(!suites[which])throw Error('Choose b17 or b38.');
const out=path.join(root,'verification/thinking-feedback-v56-20261101',which);
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.MATH_BROWSER_EXECUTABLE?{executablePath:process.env.MATH_BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']}),ctx=await browser.newContext(),page=await ctx.newPage();
  try{
    const historical=`/Users/zj1-6/dev/math/verification/phase5/${which.toUpperCase()}/`;
    const code=fs.readFileSync(path.join(root,suites[which]),'utf8').replaceAll(historical,out+'/');
    const result=await eval('('+code+')')(page);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify({suite:which,checks:result.checks?.length,failed:result.failed||null,errors:result.errors||[],remote:result.remote||[]}));
    if(result.failed||result.errors?.length||result.remote?.length)process.exitCode=1;
  }finally{await ctx.close();await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
