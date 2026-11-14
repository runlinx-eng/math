// Real Chromium checks for source-bound B13 rotation, partition and scaled units.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {capture,createOrigin,warmAndStop}=require('./helpers/p9-basic-artifact.cjs');
const root=path.resolve(__dirname,'..'),cache=fs.readFileSync(path.join(root,'dist/sw.js'),'utf8').match(/const CACHE = '([^']+)'/)[1];
const out=path.resolve(__dirname,'../verification/p9-array-adapter');
const cases=[
 {id:'structure34',index:1,node:'mt_FAXjFkgG6X',a:6,b:4,rotate:true,answer:'24',equation:'6×4=24'},
 {id:'tables34',index:1,node:'mt_2jbUekyTu4',a:8,b:7,cut:5,left:40,right:16,answer:'56',equation:'8×7=56'},
 {id:'derivepatterns',index:4,node:'mt_aivrWs6jrS',a:3,b:4,unit:10,base:'12',answer:'120',equation:'3×40=120'},
 {id:'derivepatterns',index:0,node:'mt_aivrWs6jrS',a:3,b:4,cut:2,left:6,right:6,answer:'12',equation:'3×4=12'},
 {id:'derivepatterns',index:3,node:'mt_aivrWs6jrS',a:3,b:4,answer:'12',equation:'3×4=12'},
 {id:'derivepatterns',index:5,node:'mt_aivrWs6jrS',a:3,b:4,unit:100,base:'12',answer:'1200',equation:'3×400=1200'},
 {id:'derivepatterns',index:6,node:'mt_aivrWs6jrS',a:8,b:7,cut:5,left:40,right:16,answer:'56',equation:'8×7=56'}
];
const checks=[],errors=[],remote=[],observations=[],offline=[];
const assert=(v,msg)=>{if(!v)throw Error(msg);checks.push(msg);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [width,height] of [[1440,900],[1280,720]]){
   const origin=await createOrigin(root),base=origin.base;
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(width+'x'+height+': '+String(e)));
   try{
    offline.push({width,height,...await warmAndStop(page,origin,cache,assert,width+'x'+height)});
    for(const spec of cases){
     const label=`${width}x${height}-${spec.id}-${spec.index}`;
     const shot=name=>page.screenshot({path:path.join(out,label+'-'+name+'.png'),fullPage:true});
     const feedback=page.locator('#thinking-feedback');
     const input=async(key,val)=>{
      const el=page.locator(`[data-xfield="${key}"]`);
      if(await el.getAttribute('type')==='range'){
       await el.focus();await el.press('Home');for(let n=0;n<Number(val);n++)await el.press('ArrowRight');
       assert(Number(await el.inputValue())===Number(val),label+' genuine keyboard range '+key);
      }
      else await el.fill(String(val));
     };
     const saved=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id],spec.id);
     const snapshots=[],save=async phase=>{const x=await capture(page,out,label,spec,phase);snapshots.push(x);return x;};
     try{
      await page.goto(base+'learn.html#'+spec.id);
      await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,spec.id);
      await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));
      await page.reload();
      await page.waitForFunction(id=>window.mathLesson?.snapshot().id===id,spec.id);
      await page.evaluate(({id,index})=>{
       const s=JSON.parse(localStorage.getItem('math-explorer-v2'));
       s.lessons[id].index=index;s.lessons[id].view='task';
       localStorage.setItem('math-explorer-v2',JSON.stringify(s));
      },spec);
      await page.reload();
      await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,spec.index);
      assert(await page.locator('#thinking-guide').isVisible(),label+' optional guide present');
      assert(!(await page.locator('#thinking-guide').evaluate(e=>e.open)),label+' guide collapsed');
      assert(await feedback.count()===0,label+' no feedback before actions');
      await shot('01-guide');
      await page.locator('[data-x="b13-shape"]').click();await page.locator('#actions [data-do="check"]').click();
      assert(await feedback.count()===0,label+' zero-size shape request remains unsuccessful');
      const failed=await save('failed-shape');assert(failed.model.board.built===null&&failed.model.history.length===1,label+' failed shape retains original empty board');await shot('01-failed-shape');
      await input('rows',spec.a);await input('cols',spec.b);
      if(spec.rotate)await page.locator('[data-xfield="prediction"]').selectOption('same');
      await page.locator('[data-x="b13-shape"]').click();
      if(spec.rotate)await page.locator('[data-x="b13-turn"]').click();
      if(spec.cut){
       await input('cut',spec.cut);await page.locator('[data-x="b13-cut"]').click();
       await input('left',spec.left);await input('right',spec.right);
      }
      if(spec.unit)await input('base',spec.base);
      assert((await saved()).models[spec.index].history.length===(spec.rotate||spec.cut?3:2),label+' failed request and real widget actions saved');
      await input('equation',spec.equation);
      await input('answer','99999');
      await page.locator('#actions [data-do="check"]').click();
      assert(await feedback.count()===0,label+' wrong answer grants no evidence');
      await save('wrong-answer');
      await input('answer',spec.answer);
      await page.locator('#actions [data-do="check"]').click();
      assert(await feedback.isVisible(),label+' current verified feedback visible');
      const words=await feedback.innerText();
      assert(words.includes('实际摆出')&&words.includes('不能据此判断'),label+' observation only, no mastery');
      assert(await feedback.locator(`[data-thinking-node-id="${spec.node}"]`).count()===1,label+' exact thinking source');
      await shot('02-verified');
      const first=await save('first-correct');
      await page.reload();
      await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,spec.index);
      assert(await feedback.isVisible(),label+' checked record survives reload');
      const restored=await save('restored');assert(JSON.stringify(restored.model)===JSON.stringify(first.model),label+' complete corrected model restores offline');
      await input('answer','99999');
      assert(await feedback.count()===0,label+' edited work invalidates feedback');
      await shot('03-edited');
      await page.locator('#actions [data-do="check"]').click();assert(await feedback.count()===0,label+' newer failed check stays unverified');await save('edited-failure');
      await input('answer',spec.answer);await page.locator('#actions [data-do="check"]').click();assert(await feedback.isVisible(),label+' corrected latest check restores evidence');
      const final=await save('final-correct');assert(final.attempts.length===5,label+' five full check snapshots retained');
      observations.push({width,height,...spec,snapshots,firstModel:first.model,finalModel:final.model,record:final.record,observation:words,finalObservation:await feedback.innerText()});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
      assert(!('thinkingScore' in await saved()),label+' v2 state has no thinking score');
     }catch(e){await shot('failure').catch(()=>{});throw e;}
    }
   }finally{await context.close();await origin.close();}
  }
  assert(errors.length===0,'no page errors');assert(remote.length===0,'no external requests');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,offline,originStopped:offline.every(x=>x.originStopped),childTrial:false,pedagogicalReview:false},null,2));
  console.log('P9_ARRAY_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length}));
 }catch(e){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,observations,offline,error:String(e)},null,2));
  console.error(e.stack);process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
