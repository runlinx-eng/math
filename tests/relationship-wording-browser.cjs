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
  // Long, source-bound explanations must remain readable and scrollable
  // without expanding the card beyond the desktop viewport.
  const longReasonId='mt_QhFEDyIwSO';
  for(const [width,height,slug] of [[1440,900,'desktop'],[1280,720,'compact']]){
    const page=slug==='desktop'?main:await browser.newPage({viewport:{width,height}});
    if(slug!=='desktop'){pages.push(page);page.on('pageerror',e=>errors.push(slug+' '+String(e)));
      await page.goto('http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas');
      await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);}
    await page.locator('[data-action="search"]').click();
    await page.locator('#search-input').fill(longReasonId);
    await page.locator('#search-results [data-key="node:'+longReasonId+'"]').click();
    await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,longReasonId);
    const card=page.locator('#focus-card');
    const relationList=card.locator('.network-explore details.network-relations');
    await relationList.waitFor();
    if(!(await relationList.evaluate(el=>el.open)))await relationList.locator('summary').first().click();
    const metrics=await card.evaluate(el=>{
      const target=[...el.querySelectorAll('.network-relations .relation-reason')].find(p=>p.textContent.includes('等式两边作保持相等的运算'));
      const rect=el.getBoundingClientRect();
      return {visible:!el.hidden,hasTarget:!!target,cardX:rect.x,cardY:rect.y,
        cardW:rect.width,cardH:rect.height,overflowWidth:target?target.scrollWidth-target.clientWidth:null,
        overflowHeight:target?target.scrollHeight-target.clientHeight:null,
        cardScrollHeight:el.scrollHeight,cardClientHeight:el.clientHeight};
    });
    check(metrics.visible&&metrics.hasTarget,slug+': full revised relationship text appears on its source node');
    check(metrics.cardX>=-1&&metrics.cardY>=-1&&metrics.cardX+metrics.cardW<=width+1&&metrics.cardY+metrics.cardH<=height+1,
      slug+': relationship card stays within viewport');
    check(metrics.overflowWidth<=2&&metrics.overflowHeight<=2,slug+': text wraps without clipping');
    await card.evaluate(el=>{el.scrollTop=el.scrollHeight;});
    const scroll=await card.evaluate(el=>el.scrollTop);
    check(metrics.cardScrollHeight<=metrics.cardClientHeight+2||scroll>0,
      slug+': long relationship remains reachable by card scrolling');
    await page.screenshot({path:path.join(output,'03-long-reason-'+slug+'.png')});
  }
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
