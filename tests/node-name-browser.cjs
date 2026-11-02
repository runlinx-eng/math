// Keep legacy source-title searches functional after source-specific UI name corrections.
// UI-level browser check; source nodes, edges, and math positions remain untouched.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const cases=[
  ['mt_doX1BhmFgk','认识十分之一','认识百分之一'],
  ['mt_kdWoAel3Zl','认识十分之一','认识千分之一'],
  ['mt_e4V6hvcuEJ','角的分类','读懂几何图形的标记'],
  ['mt_HY8Yycu_rz','理解分数','准确使用数学词汇和符号'],
  ['mt_hImiKNiaNh','运算顺序','运算与几何结构的联系'],
  ['mt_ZOJ6EbdPOb','理解分数','分数倍与简单速率问题'],
  ['mt_VVn1IXjkzn','用四舍五入估算','四舍五入的误差与上下界'],
  ['mt_KFKUR_gBg_','理解角','长方形的角与边长关系']
];
const output=path.resolve(__dirname,'../verification/node-name-review');
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',error=>{const detail=error.stack||String(error);errors.push(detail);console.error('RENAME_PAGE_ERROR',detail);});
  await page.goto('http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas');
  await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const initialPositions=JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions);
  for(const [id,oldName,newName] of cases){
    await page.locator('[data-action="search"]').click();
    await page.locator('#search-input').fill(oldName);
    const result=page.locator('#search-results [data-key="node:'+id+'"]');
    await result.waitFor({state:'visible'});
    check((await result.innerText()).includes(newName),'old source label locates revised node: '+id);
    await result.click();
    await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,id);
    await page.waitForFunction(()=>document.querySelector('#focus-card')?.hidden===false);
    const title=(await page.locator('#focus-card .focus-sticky h2').innerText()).trim();
    check(title===newName,'focus card shows corrected math goal for '+id+': '+title);
    check(JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions)===initialPositions,
      'renamed node does not change its source position: '+id);
    if(id==='mt_doX1BhmFgk'||id==='mt_HY8Yycu_rz')
      await page.screenshot({path:path.join(output,id+'.png')});
    checks.push({id,oldName,newName});
  }
  check(errors.length===0,'no browser errors in renamed-node search');
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checked:checks.length,checks,errors},null,2));
  console.log(JSON.stringify({passed:checks.length,errors:[]}));
 }catch(err){
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checked:checks.length,checks,errors,failed:String(err)},null,2));
  console.error(err.stack);process.exitCode=1;
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack);process.exitCode=1;});
