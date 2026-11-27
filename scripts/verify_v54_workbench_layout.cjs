// Mac 02 diagnostic viewport checks: separate contexts; the approved #239
// 1920x1080 A/B checks remain unchanged. Real task, controls and original grader.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827';
const dir=path.resolve('verification/v54-workbench-layout');
const topic='mt_-c4Ca_nBzX',session='chancefraction';
const requiredFields=['kind','prob','answers.0'];
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const result={passed:false,rows:[]};
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [width,height,probability] of [[1440,900,true],[1280,720,true],[959,900,false],[960,900,false],[1000,1200,false]]){
   const viewport={width,height},ctx=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const row={viewport,probability,errors,passed:false};result.rows.push(row);
   const shot=name=>page.screenshot({path:path.join(dir,width+'x'+height+'-'+name+'.png')});
   try{
    await page.goto(base+'/index.html?world=network&layout=54&surface=learn#space/node/'+topic);
    await page.waitForFunction(id=>{
      const child=document.querySelector('#journey-frame').contentWindow;
      return window.mathSpace?.snapshot()?.networkVersion===54&&document.body.dataset.workbenchForeground==='learn'&&child.mathLesson?.snapshot()?.id===id&&child.document.body.dataset.workbenchLayout==='compact-v54'&&child.document.querySelector('#workbench-curriculum')?.dataset.state!=='loading'&&child.document.querySelector('#storage-warning')?.hidden;
    },session,{timeout:60000});
    const frame=page.frameLocator('#journey-frame');
    const measure=()=>page.evaluate(fields=>{
      const panel=document.querySelector('#journey-surface'),frame=document.querySelector('#journey-frame'),doc=frame.contentDocument;
      const rect=el=>{const {x,y,width,height,right,bottom}=el.getBoundingClientRect();return {x,y,width,height,right,bottom};};
      const p=rect(panel),f=rect(frame),s=rect(doc.querySelector('#workbench-stage')),work=rect(doc.querySelector('#work')),command=rect(doc.querySelector('.execution-command')),drawer=rect(doc.querySelector('#workbench-drawer')),topbar=rect(document.querySelector('.topbar'));
      const fieldRects=fields.map(field=>{
        const el=doc.querySelector('#extra-controls [data-xfield="'+field+'"]');
        if(!el)return {field,missing:true};
        const r=rect(el),label=rect(el.closest('label')),x=r.x+r.width/2,y=r.y+r.height/2;
        const points=[[x,y],[r.x+3,r.y+3],[r.right-3,r.bottom-3]];
        return {field,rect:r,label,labelText:el.closest('label').textContent.trim(),enabled:!el.disabled,hit:points.every(([cx,cy])=>el===doc.elementFromPoint(cx,cy)||el.contains(doc.elementFromPoint(cx,cy))),parentHit:document.elementFromPoint(f.x+x,f.y+y)===frame,visible:label.x>=s.x-1&&label.right<=s.right+1&&label.y>=s.y-1&&label.bottom<=s.bottom+1&&r.bottom<=drawer.y+1&&r.bottom<=command.y+1&&r.bottom<=frame.contentWindow.innerHeight};
      });
      const map=rect(document.querySelector('#space-app'));
      return {panel:p,frame:f,stage:s,work,drawer,command,topbar,map,ratio:p.width/innerWidth,headingHeight:f.y-p.y+work.y,childViewport:{width:frame.contentWindow.innerWidth,height:frame.contentWindow.innerHeight},scroll:doc.querySelector('#workbench-stage').scrollTop,fields:fieldRects,contextClosed:!document.querySelector('#workbench-context-menu').open,questionCopies:[...document.querySelectorAll('.save-status [data-action="question"]')].filter(e=>e.getClientRects().length).length,guideInWork:!!doc.querySelector('#work #thinking-guide'),guideInDrawer:!!doc.querySelector('#learning-support-drawer-panel #thinking-guide'),goalInDrawer:!!doc.querySelector('#learning-support-drawer-panel #learning-goal')};
    },requiredFields);
    const m=await measure();row.initial=m;
    assert.ok(m.panel.x>=0&&m.panel.y>=m.topbar.bottom-1&&m.panel.right<=width+1&&m.panel.bottom<=height+1,'fixed panel fits below top navigation: '+JSON.stringify(m.panel));
    if(width>=960){assert.ok(m.ratio>=.68&&m.ratio<=.72,'desktop 68–72% width, '+m.ratio);assert.ok(m.map.right<=m.panel.x+1,'actual map is separately reserved');}
    else assert.ok(m.ratio>=.94&&m.panel.x<=12.5,'narrow viewport full-width panel');
    assert.ok(m.contextClosed&&m.questionCopies===0&&m.goalInDrawer&&!m.guideInWork,'default optional details do not occupy the main stage');
    await shot('initial');
    if(probability){
     assert.equal(m.scroll,0,'first screen must not rely on scrolling');
     assert.ok(m.headingHeight<=220,'whole heading budget from panel top to work <=220 CSS px: '+m.headingHeight);
     assert.equal(await frame.locator('#extra-controls .b22-controls > .field :is(input,select)').count(),3,'exact original required fields');
     assert.ok(m.fields.every(f=>!f.missing&&f.enabled&&f.visible&&f.hit&&f.parentHit),'all original input/label rectangles and actual hit targets visible above drawer and command: '+JSON.stringify(m.fields));
     assert.ok(m.fields[2].labelText.includes('一共几个等可能的面'));
     assert.ok(m.guideInDrawer,'the original admitted optional thinking question is available in the existing drawer');
     const summary=page.locator('#workbench-context-menu>summary');
     await summary.click();assert.ok(await page.locator('#learning-map-context').isVisible());
     assert.ok(await page.locator('#learning-map-context [data-source-key]').count()>0,'real source links preserved');
     const open=await measure();assert.deepEqual(open.frame,m.frame,'context disclosure does not shrink iframe');
     await shot('source-context');
     await summary.press('Escape');
     await page.waitForFunction(()=>!document.querySelector('#workbench-context-menu').open);
     await frame.locator('#learning-support>summary').click();
     assert.ok(await frame.locator('#thinking-guide>summary').isVisible(),'optional question remains reachable');
     await shot('auxiliary');
     await frame.locator('#learning-support>summary').press('Escape');
     await frame.locator('#workbench-stage').evaluate(el=>{if(el.inert)throw Error('work stage still inert');});
     const after=await measure();assert.equal(after.scroll,0);assert.ok(after.fields.every(f=>f.visible&&f.hit&&f.parentHit),'closing drawers returns real initial inputs');
     // The real original first task, not a mocked submission or seeded state.
     await frame.locator('#extra-visual [data-x="p22-toggle"][data-index="5"]').click();
     await frame.locator('#extra-controls [data-xfield="kind"]').selectOption('equal');
     await frame.locator('#extra-controls [data-xfield="prob"]').fill('1/6');
     await frame.locator('#extra-controls [data-xfield="answers.0"]').fill('6');
     await frame.locator('#actions [data-do="check"]').click();
     await page.waitForFunction(()=>document.querySelector('#journey-frame').contentDocument.querySelector('#scene').dataset.stage==='passed');
     const evidence=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')).lessons.chancefraction.cases[0]);
     assert.equal(evidence.attempts.length,1);
     row.realSubmission=true;await shot('checked');
    }
    assert.deepEqual(errors,[]);row.passed=true;
   }catch(e){row.failure=e.stack;await shot('failure').catch(()=>{});throw e;}finally{await ctx.close();}
  }
  result.passed=true;
 }finally{fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(result,null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
