// Real Chromium checks for source-bound B13 rotation, partition and scaled units.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const base='http://127.0.0.1:43827/';
const out=path.resolve(__dirname,'../verification/p9-array-adapter');
const cases=[
 {id:'structure34',index:1,node:'mt_FAXjFkgG6X',a:6,b:4,rotate:true,answer:'24',equation:'6×4=24'},
 {id:'tables34',index:1,node:'mt_2jbUekyTu4',a:8,b:7,cut:5,left:40,right:16,answer:'56',equation:'8×7=56'},
 {id:'derivepatterns',index:4,node:'mt_aivrWs6jrS',a:3,b:4,unit:10,base:'12',answer:'120',equation:'3×40=120'}
];
const checks=[],errors=[],remote=[];
const assert=(v,msg)=>{if(!v)throw Error(msg);checks.push(msg);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [width,height] of [[1440,900],[1280,720]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(width+'x'+height+': '+String(e)));
   try{
    for(const spec of cases){
     const label=`${width}x${height}-${spec.id}-${spec.index}`;
     const shot=name=>page.screenshot({path:path.join(out,label+'-'+name+'.png'),fullPage:true});
     const feedback=page.locator('#thinking-feedback');
     const input=async(key,val)=>{
      const el=page.locator(`[data-xfield="${key}"]`);
      if(await el.getAttribute('type')==='range')await el.evaluate((e,v)=>{
       e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));
      },val);
      else await el.fill(String(val));
     };
     const saved=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons[id],spec.id);
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
      await input('rows',spec.a);await input('cols',spec.b);
      if(spec.rotate)await page.locator('[data-xfield="prediction"]').selectOption('same');
      await page.locator('[data-x="b13-shape"]').click();
      if(spec.rotate)await page.locator('[data-x="b13-turn"]').click();
      if(spec.cut){
       await input('cut',spec.cut);await page.locator('[data-x="b13-cut"]').click();
       await input('left',spec.left);await input('right',spec.right);
      }
      if(spec.unit)await input('base',spec.base);
      assert((await saved()).models[spec.index].history.length===(spec.rotate||spec.cut?2:1),label+' real widget actions saved');
      await input('equation',spec.equation);
      await input('answer','99999');
      await page.locator('#actions [data-do="check"]').click();
      assert(await feedback.count()===0,label+' wrong answer grants no evidence');
      await input('answer',spec.answer);
      await page.locator('#actions [data-do="check"]').click();
      assert(await feedback.isVisible(),label+' current verified feedback visible');
      const words=await feedback.innerText();
      assert(words.includes('实际摆出')&&words.includes('不能据此判断'),label+' observation only, no mastery');
      assert(await feedback.locator(`[data-thinking-node-id="${spec.node}"]`).count()===1,label+' exact thinking source');
      await shot('02-verified');
      await page.reload();
      await page.waitForFunction(index=>window.mathLesson?.snapshot().index===index,spec.index);
      assert(await feedback.isVisible(),label+' checked record survives reload');
      await input('answer','99999');
      assert(await feedback.count()===0,label+' edited work invalidates feedback');
      await shot('03-edited');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
      assert(!('thinkingScore' in await saved()),label+' v2 state has no thinking score');
     }catch(e){await shot('failure').catch(()=>{});throw e;}
    }
   }finally{await context.close();}
  }
  assert(errors.length===0,'no page errors');assert(remote.length===0,'no external requests');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,childTrial:false,pedagogicalReview:false},null,2));
  console.log('P9_ARRAY_ADAPTER_BROWSER_OK '+JSON.stringify({checks:checks.length}));
 }catch(e){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,remote,error:String(e)},null,2));
  console.error(e.stack);process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
