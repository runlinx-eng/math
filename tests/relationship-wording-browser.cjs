// UI contract: one meaning for source relation direction and reviewed titles.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const output=path.resolve(__dirname,'../verification/language-direction');
const check=(value,label)=>{if(!value)throw Error(label);};
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const pages=[],errors=[];
 try{
  const main=await browser.newPage({viewport:{width:1440,height:900}});
  pages.push(main);main.on('pageerror',e=>errors.push('main '+String(e)));
  await main.goto('http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas');
  await main.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
  const coordinates=JSON.stringify((await main.evaluate(()=>mathSpace.snapshot())).positions);
  await main.locator('[data-action="search"]').click();
  await main.locator('#search-input').fill('mt_e8CZ7E5qW7');
  await main.locator('#search-results [data-key="node:mt_e8CZ7E5qW7"]').click();
  await main.waitForFunction(()=>mathSpace.snapshot().selected==='node:mt_e8CZ7E5qW7');
  const h=await main.locator('#focus-card .network-explore').textContent();
  check(h.includes('相关基础')&&h.includes('相关后续'),'3D knowledge relations have two explicit directions');
  check(!h.includes('这里会用到')&&!h.includes('还会连到哪里'),'3D view does not use ambiguous directional words');
  check(JSON.stringify((await main.evaluate(()=>mathSpace.snapshot())).positions)===coordinates,'direction names do not move source positions');
  await main.screenshot({path:path.join(output,'01-3d-directions.png')});
  const alternate=await browser.newPage({viewport:{width:1440,height:900}});
  pages.push(alternate);alternate.on('pageerror',e=>errors.push('alternate '+String(e)));
  await alternate.goto('http://127.0.0.1:43827/v2.html#atlas');
  await alternate.locator('#atlas-search').waitFor();
  check((await alternate.locator('#main').innerText()).includes('知识群'),'secondary map uses knowledge group naming');
  check(!(await alternate.locator('#main').innerText()).includes('探索包'),'secondary map no longer switches terminology');
  await alternate.locator('#atlas-search').fill('9以内数的分与合');
  const revised=alternate.locator('.leaf[data-id="mt_e8CZ7E5qW7"]');
  await revised.waitFor({state:'visible'});
  check((await revised.innerText()).includes('凑成10的数的分与合'),'search uses old source title but displays reviewed title');
  await revised.click();
  await alternate.locator('#node-dialog[open] #node-title').waitFor();
  check((await alternate.locator('#node-title').innerText()).includes('凑成10的数的分与合'),'secondary detail uses same display title');
  const relation=await alternate.locator('#node-dialog .relations').innerText();
  check(relation.includes('相关基础')&&relation.includes('相关后续'),'secondary node detail preserves relationship directions');
  await alternate.screenshot({path:path.join(output,'02-secondary-directions.png')});
  check(errors.length===0,'no browser runtime errors');
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed:9,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:9,errors:[],childTrial:false}));
 }catch(e){fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({errors,failed:String(e)},null,2));console.error(e.stack);process.exitCode=1;}
 finally{for(const page of pages)await page.close().catch(()=>{});await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
