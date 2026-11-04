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
  ['mt_KFKUR_gBg_','理解角','长方形的角与边长关系'],
  ['mt_aivrWs6jrS','乘法口诀与乘法表','乘法表与分数中的规律'],
  ['mt_wh3UqnWsa7','乘法是相同加数的和','用阵列与加法解决乘除'],
  ['mt_A-FyLLLLzy','图形规律','按规则生成数列与图形'],
  ['mt_i2F1nWxJjv','数轴上的数','用数轴表示不等式的解'],
  ['mt_zMEvtigoM3','数轴上的数','根据问题选择数学表示与工具'],
  ['mt_PsylzZ9lHW','数轴上的分数','在数轴上表示正负数、小数与分数'],
  ['mt_ESgc4YBw-a','百分数的应用','比、比例与百分数的语言'],
  ['mt_eKJG-0eC6D','象形统计图与计数表','频数表与多种统计图'],
  ['mt_e8CZ7E5qW7','9以内数的分与合','凑成10的数的分与合'],
  ['mt_UQnAFPs83F','两位数加两位数','两个两位数的加减法'],
  ['mt_Yw27nweoTj','估计答案','从函数图像估计数值与解'],
  ['mt_7rJM8eWUfw','六个六个地数','按6、7、9、25和1000跳着数'],
  ['mt_ZfpeI1CFyP','到平均数的平均距离','平均绝对偏差'],
  ['mt_g3W0mdADVu','寻找二分之一与四分之一','寻找四等份中的一份'],
  ['mt_CBHwluE6Lp','同分母分数相加','同分母分数加减'],
  ['mt_b7T-CjOYUR','约分','约分与通分'],
  ['mt_cdMlC7EpTJ','三角形中的角','三角形、四边形与正多边形的未知角'],
  ['mt_AF2BeFQwfX','计算总价与找零','用不同硬币凑成相同金额'],
  ['mt_2yas4Unc8o','读时间：精确到分钟','时间单位换算'],
  ['mt_RVK655t391','测量温度','用正负数表示变化与跨零差值'],
  ['mt_LlMl2PbaZe','乘法与除法','整数和小数乘除10、100、1000'],
  ['mt_bO-njVOige','10的幂的写法','科学记数法与10的整数次幂'],
  ['mt_5mIcmKRCgA','正比例与比例关系','正比例与反比例']
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
