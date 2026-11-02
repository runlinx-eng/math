// Twenty-six-node UI review: five source types, eleven domains, procedural patterns, and seven exact visuals; progressive explanation and map invariants.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/concept-language-pilot');
const ids=[
  ['count','mt_WcfaSfVT33'],['addition','mt_OvyoRo47K-'],
  ['numberline-fractions','mt_Ep7TDFuYUa'],['construct-fractions','mt_FP-mjXaq3B'],
  ['area','mt_6xNmQLzuqm'],['chance','mt_UcGn2hjhYU'],
  ['place-value','mt_THl9GLxwoL'],['division','mt_LpSuPgL31x'],
  ['measurement-units','mt_DOe893F6gN'],['linear-graphs','mt_-3udyo6VyB'],
  ['arithmetic-symbols','mt_8RmpkDxT9L'],['fraction-notation','mt_vKcxX6iNOA'],
  ['correlation','mt_8atyuvPUZc'],['simultaneous-equations','mt_mqgu72aCMz'],
  ['rounding-estimation','mt_QaYfeVL-0C'],['statistical-investigation','mt_SHVyE1CLUa'],
  ['solid-shapes','mt_Qcp2d_kuta'],['ratio','mt_yK51ZnKA8m'],
  ['measuring-length','mt_KaF0SQvaiu'],['calculating-percentages','mt_PNSyfH56eQ'],
  ['surface-area-volume','mt_Sij9ByyHq6'],['scale-drawings','mt_1badik7iKJ'],
  ['ratio-bar-model','mt_ePXg_XyCKU'],['venn-two-sets','mt_eSv_w46u6H'],
  ['multiplication-array','mt_GRWwTDZ3wD'],['area-distributive-model','mt_AQo4u7O4sM']
];
const check=(ok,desc)=>{if(!ok)throw Error(desc);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const checks=[],measurements=[],errors=[];
 try{
  for(const [width,height,slug] of [[1440,900,'desktop'],[1280,720,'compact']]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas');
   await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
   const start=JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions);
   const cases=slug==='desktop'?ids:[ids[2],ids[4],ids[8],ids[9],ids[12],ids[13],ids[14],ids[15],ids[16],ids[17],ids[18],ids[19],ids[20],ids[21],ids[22],ids[23],ids[24],ids[25]];
   for(const [label,id] of cases){
    const tag=slug+'-'+label;
    await page.locator('[data-action="search"]').click();
    await page.locator('#search-input').fill(id);
    await page.locator('#search-results [data-key="node:'+id+'"]').click();
    await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,id);
    await page.waitForFunction(()=>document.querySelector('#focus-card')&&!document.querySelector('#focus-card').hidden);
    await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null);
    const card=page.locator('#focus-card'),help=card.locator('.concept-help'),mainAction=card.locator('.focus-actions .primary-button').first();
    check(await help.count()===1,tag+': exact node has a precise explanation');
    check(await help.locator('.concept-term').innerText()!==''&&await help.locator('.concept-definition').innerText()!=='',tag+': formal concept and definition visible');
    const closed=await help.locator('.concept-alternatives').evaluate(el=>!el.open);
    check(closed,tag+': secondary explanations are closed by default');
    const geometry=await card.evaluate(el=>{
      const box=el.getBoundingClientRect(),h=el.querySelector('.focus-sticky').getBoundingClientRect(),
        def=el.querySelector('.concept-definition').getBoundingClientRect(),
        action=el.querySelector('.focus-actions .primary-button')?.getBoundingClientRect(),
        available={width:window.innerWidth,height:window.innerHeight};
      return {box:{x:box.x,y:box.y,w:box.width,h:box.height},
        header:{y:h.y,h:h.height},definition:{y:def.y,h:def.height},
        action:action?{y:action.y,h:action.height}:null,
        clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,view:available};
    });
    check(geometry.box.x>=-1&&geometry.box.y>=-1&&geometry.box.x+geometry.box.w<=width+1&&geometry.box.y+geometry.box.h<=height+1,
      tag+': knowledge card stays within viewport');
    check(geometry.action&&geometry.action.y>=geometry.box.y&&geometry.action.y+geometry.action.h<=geometry.box.y+geometry.box.h,
      tag+': learning action stays available at entry');
    check(geometry.definition.y>=geometry.header.y+geometry.header.h-2&&geometry.definition.y+geometry.definition.h<=geometry.box.y+geometry.box.h+2,
      tag+': concept definition does not overlap the sticky title or leave the card');
    check(await card.locator('.network-relations').count()>0,
      tag+': true map relationships remain in the knowledge card');
    await page.screenshot({path:path.join(out,tag+'-initial.png')});
    await page.waitForTimeout(220);
    const before=JSON.stringify(await page.evaluate(()=>mathSpace.snapshot()));
    const storage=await page.evaluate(()=>JSON.stringify({...localStorage}));
    await help.locator('.concept-alternatives > summary').click();
    const types=await help.locator('.concept-mode > summary').allInnerTexts();
    check(types.includes('换个说法')&&types.includes('举例与反例')&&types.includes('自己试一试')&&types.includes('为什么'),
      tag+': four useful alternative text explanation routes remain available');
    const visualLabels={
      'mt_Ep7TDFuYUa':'二等分','mt_FP-mjXaq3B':'二等分','mt_-3udyo6VyB':'y=2x+1',
      'mt_ePXg_XyCKU':'2比3','mt_eSv_w46u6H':'韦恩图',
      'mt_GRWwTDZ3wD':'3行4列','mt_AQo4u7O4sM':'宽4加2'
    };
    const expectedVisual=Object.hasOwn(visualLabels,id);
    check(types.includes('看图理解')===expectedVisual,tag+': only nodes with a real visual show the diagram entry');
    if(expectedVisual){
      await help.locator('.concept-visual-mode > summary').click();
      const image=help.locator('.concept-visual svg');
      check(await image.count()===1,tag+': diagram exists');
      const info=await image.evaluate(svg=>({width:svg.getBoundingClientRect().width,
        accessibility:svg.getAttribute('aria-label'),
        inside:svg.getBoundingClientRect().right<=svg.closest('.focus-card').getBoundingClientRect().right+1}));
      const labelNeedle=visualLabels[id];
      check(info.width>=150&&info.inside&&info.accessibility?.includes(labelNeedle),
        tag+': exact-math visual fits the card and has an accessible description');
    }else await help.locator('.concept-mode').first().locator('summary').click();
    await page.screenshot({path:path.join(out,tag+'-expanded.png')});
    check(JSON.stringify(await page.evaluate(()=>mathSpace.snapshot()))===before,
      tag+': reading explanations does not change camera, nodes, selection, or relation data');
    check(await page.evaluate(()=>JSON.stringify({...localStorage}))===storage,
      tag+': explanation reads never record learning completion');
    check(JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions)===start,
      tag+': all world coordinates unchanged');
    measurements.push({tag,id,geometry,modes:types});
    checks.push(tag);
   }
   await context.close();
  }
  check(errors.length===0,'no browser errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:checks.length,checks,measurements,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,viewportCases:checks,errors,childTrial:false}));
 }catch(err){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,measurements,errors,failed:String(err)},null,2));
  console.error(err.stack);process.exitCode=1;
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack);process.exitCode=1;});
