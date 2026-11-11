// P7-D7/D8: browser checks against native operations, never synthetic graders.
// Artifact screenshots are technical browser evidence, not Mac or teaching approval.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/p7-d7');
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const base='http://127.0.0.1:43827/learn.html#';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const results=[],errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  const load=async(id,clean=true)=>{
   await page.goto(base+id);
   if(clean){await page.evaluate(()=>localStorage.removeItem('math-explorer-v2'));await page.reload();}
   await page.waitForFunction(id=>window.mathLesson?.snapshot()?.id===id,id);
  };
  const read=()=>page.evaluate(()=>{
   const scene=document.querySelector('#scene'),work=document.querySelector('#work');
   const buttons=[...document.querySelectorAll('#actions .primary:not([hidden]),#work .study-primary:not([hidden])')];
   return {stage:scene.dataset.stage,focus:scene.dataset.actionFocus,primary:buttons.map(b=>b.textContent.trim()),checkDisabled:document.querySelector('#actions [data-do="check"]')?.disabled,feedback:document.querySelector('#check-feedback')?.textContent||'',taskType:work.dataset.taskType,workWidth:work.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth+3};
  });
  const shot=async(name)=>page.screenshot({path:path.join(out,name+'.jpg'),type:'jpeg',quality:65});
  const stage=async(expect,name)=>{
   let s=await read();assert(s.stage===expect,name+' stage '+JSON.stringify(s));assert(s.primary.length===1,name+' one primary '+JSON.stringify(s));assert(!s.overflow,name+' overflow '+JSON.stringify(s));await shot(name);return s;
  };
  for(const size of [{width:1440,height:900},{width:1280,height:720},{width:600,height:800}]){
   await page.setViewportSize(size);const tag=size.width;
   await load('equivalent');
   let s=await stage('explore','fraction-first-'+tag);
   assert(s.taskType==='equivalent'&&!s.checkDisabled,'paper strips live check');
   assert(await page.locator('.eq-bar button[aria-pressed]').count()===18,'paper strips report pressed state');
   await page.locator('#actions [data-do="check"]').click();
   await stage('revise','fraction-wrong-'+tag);
   for(const [row,index] of [[0,1],[1,2],[2,3]])await page.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
   await stage('recheck','fraction-edited-'+tag);
   assert(await page.locator('.eq-bar button.on[aria-pressed="true"]').count()>0,'strip pressed feedback');
   await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='equivalent');
   await stage('recheck','fraction-restored-'+tag);
   await page.locator('#actions [data-do="check"]').click();
   await stage('passed','fraction-passed-'+tag);
   await page.locator('#actions [data-do="next"]').click();
   assert((await read()).stage==='explore','fraction proceeds to real next task');
   results.push({id:'equivalent',viewport:tag,flow:'fail > modify > restore > pass > real next'});
   await load('shiftfine');
   s=await stage('explore','shift-first-'+tag);
   assert(s.focus==='widget'&&s.checkDisabled,'shift predicts first');
   await page.locator('[data-xfield="guess"]').fill('345.6');
   await page.locator('[data-x="wide-predict"]').click();
   assert((await read()).checkDisabled,'predicted without moving cannot check');
   await page.locator('[data-x="wide-move"][data-delta="1"]').click();
   await page.locator('[data-x="wide-move"][data-delta="1"]').click();
   await page.locator('[data-xfield="answer"]').fill('34.56');
   await page.locator('[data-xfield="factor"]').fill('100');
   await page.locator('[data-xfield="direction"]').selectOption('times');
   await page.locator('#actions [data-do="check"]').click();
   await stage('revise','shift-wrong-'+tag);
   await page.locator('[data-xfield="answer"]').fill('345.6');
   await stage('recheck','shift-edited-'+tag);
   await page.locator('#actions [data-do="check"]').click();
   await stage('passed','shift-passed-'+tag);
   await page.locator('#actions [data-do="next"]').click();
   assert((await read()).stage==='explore','shift real next');
   results.push({id:'shiftfine',viewport:tag,flow:'predict > move > fail > modify > pass > next'});
   await load('solidstack');
   s=await stage('explore','geometry-first-'+tag);
   assert(s.taskType==='x-g27-build'&&s.checkDisabled,'geometry cannot check empty');
   for(const part of ['cube','cube','cube'])await page.locator('[data-x="g27-add"][data-index="'+part+'"]').click();
   await page.locator('[data-x="turn-extra"]').click();
   assert(!(await read()).checkDisabled,'geometry complete construction enables check');
   await page.locator('#actions [data-do="check"]').click();
   await stage('revise','geometry-wrong-'+tag);
   for(let i=0;i<3;i++)await page.locator('[data-x="g27-remove"]').click();
   for(const part of ['cuboid','cube','cube'])await page.locator('[data-x="g27-add"][data-index="'+part+'"]').click();
   await stage('recheck','geometry-edited-'+tag);
   await page.locator('#actions [data-do="check"]').click();
   await stage('passed','geometry-passed-'+tag);
   await page.locator('#actions [data-do="next"]').click();
   assert((await read()).stage==='explore','geometry real next');
   results.push({id:'solidstack',viewport:tag,flow:'build > fail > replace parts > pass > next'});
   await load('argument38');
   s=await stage('explore','argument-first-'+tag);
   assert(s.taskType==='x-r38-chain'&&s.checkDisabled,'argument requires cards');
   await page.locator('[data-x="r38-card"][data-index="wrong"]').click();
   await page.locator('#actions [data-do="check"]').click();
   await stage('revise','argument-wrong-'+tag);
   await page.locator('[data-x="r38-undo"]').click();
   for(const id of ['given','sum','two','answer'])await page.locator('[data-x="r38-card"][data-index="'+id+'"]').click();
   await stage('recheck','argument-edited-'+tag);
   await page.locator('#actions [data-do="check"]').click();
   await stage('passed','argument-passed-'+tag);
   await page.locator('#actions [data-do="next"]').click();
   assert((await read()).stage==='explore','argument real next');
   results.push({id:'argument38',viewport:tag,flow:'reason > fail > revise chain > pass > next'});
   await load('link-equivalent-quarters');
   s=await stage('explore','bridge-first-'+tag);
   assert(s.taskType==='equivalent','first source bridge is native strips');
   for(const [row,index] of [[0,0],[1,1],[2,2]])await page.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
   await page.locator('#actions [data-do="check"]').click();
   await stage('passed','bridge-first-passed-'+tag);
   await page.locator('#actions [data-do="next"]').click();
   assert((await read()).taskType==='grid','second bridge native grid');
   await stage('explore','bridge-second-'+tag);
   await page.locator('#actions [data-do="check"]').click();
   await stage('revise','bridge-grid-wrong-'+tag);
   for(let i=0;i<25;i++)await page.locator('[data-do="cell"][data-index="'+i+'"]').click();
   await page.locator('[data-field="decimal"]').fill('0.25');
   await stage('recheck','bridge-grid-edited-'+tag);
   await page.locator('#actions [data-do="check"]').click();
   await stage('passed','bridge-grid-passed-'+tag);
   await page.locator('#actions [data-do="next"]').click();
   await stage('reflect','bridge-reflect-'+tag);
   await page.reload();await page.waitForFunction(()=>window.mathLesson?.snapshot()?.view==='summary');
   await stage('reflect','bridge-summary-restored-'+tag);
   results.push({id:'link-equivalent-quarters',viewport:tag,flow:'source bridge > real grid > fail > revise > pass > summary > restore'});
   await page.evaluate(()=>localStorage.clear());
  }
  assert(errors.length===0,'page errors '+errors.join('; '));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors,macVerified:false,childVerified:false,pedagogyVerified:false},null,2));
  console.log('P7_D7_AUDIT_COMPLETE '+JSON.stringify({scenarios:results.length,screenshots:'verification/p7-d7',errors}));
 }catch(e){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors:[...errors,String(e)],macVerified:false,childVerified:false},null,2));
  console.error('P7_D7_AUDIT_FAILED '+(e.stack||e));
  process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
