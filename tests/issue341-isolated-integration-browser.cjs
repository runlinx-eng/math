'use strict';
// New shared integration and rendering only. Inputs are immutable captures from
// the already-passed 113 family suites; those controls/tests are not rerun here.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext,STANDARD_DESKTOP_VIEWPORT}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/issue341-isolated-integration');
const fixturePath=path.join(root,'verification/issue341-inputs/archived-checks-365.json');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const event=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH)):null;
const result={schema:'issue-341-isolated-shared-integration/1',errors:[],checks:[],rows:[],
 proofContracts:['shared-routing','latest-check','original-submitted','feedback-rendering','production-isolation'],
 provenance:{testedCheckoutSha:sha,sourceHead:event?.pull_request?.head?.sha||sha,
  runId:process.env.GITHUB_RUN_ID||'local',runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT||1),
  reusedOriginalRun:44909628782,reusedOriginalHead:'0cafdaed5aad3d32bf09ab1d9abf6e77130a069d',
  fixtureSha256:createHash('sha256').update(fs.readFileSync(fixturePath)).digest('hex')},
 scope:{candidateFamilies:113,candidatePositions:365,formalA:1178,newFormalA:365,
  originalFamilySuitesRerun:0,originalNavigationRerun:0,oldMathProofsRewritten:0,
  nativeUIControlsReperformed:false,offlineCandidateActivation:false},viewport:STANDARD_DESKTOP_VIEWPORT};
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<title>#341 隔离共享集成审阅</title><style>
body{margin:0;background:#f5f7fa;color:#152335;font:16px/1.6 system-ui,sans-serif}
header,main{max-width:1100px;margin:auto;padding:24px}header{border-bottom:1px solid #cbd5e1}
h1{font-size:24px;margin:0 0 10px}#status{font-weight:600;color:#17634b}
.scope{font-size:14px;color:#48566b}select{font:inherit;padding:6px;margin:12px 0}
article{background:white;border:1px solid #d5dde8;border-radius:10px;margin:14px 0;padding:18px}
article h2{font-size:15px;color:#5e6f85;margin:0 0 10px}article p{margin:7px 0}
small{display:block;color:#5e6f85}details{margin-top:10px}summary{cursor:pointer}
</style><header><h1>365 道候选 · 隔离共享集成审阅</h1>
<div id="status">正在载入原始证据与共享组合…</div>
<p class="scope">使用原 Artifact 的已保存 Check，审阅新增共享接线与反馈。正式名单新增365道（总1178）；本页只验证原隔离组合，不替代正式学习入口。</p>
<label>家族 <select id="family"><option value="">全部家族</option></select></label></header>
<main id="cards"></main></html>`;

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 let browser,server;
 try{
  server=http.createServer((req,res)=>{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(pathname==='/__issue341__/'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;
   }
   if(pathname==='/__issue341__/fixtures.json'){
    res.writeHead(200,{'Content-Type':'application/json'});res.end(fs.readFileSync(fixturePath));return;
   }
   const file=path.resolve(root,'dist','.'+pathname);
   if(file!==fixturePath&&!file.startsWith(path.join(root,'dist')+path.sep)){
    res.writeHead(403);res.end();return;
   }
   const mime={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
    '.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
   fs.readFile(file,(error,bytes)=>{
    res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(error?'missing':bytes);
   });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{})});
  result.browserVersion=browser.version();
  // The real production page now loads formal adapters on exact admitted sources.
  const normal=await newDesktopContext(browser,{serviceWorkers:'block'});
  const live=await normal.newPage(),candidateRequests=[];
  live.on('request',req=>{if(new URL(req.url()).pathname.includes('issue341-'))candidateRequests.push(req.url());});
  await live.goto(base+'/learn.html#allowedrange');
  await live.waitForFunction(()=>window.mathLesson?.snapshot()?.id==='allowedrange');
  await live.locator('#thinking-guide').waitFor({state:'visible',timeout:15000});
  assert.ok(candidateRequests.some(url=>url.endsWith('/learning/issue341-formal-admissions.js')),
    'normal entry must load the versioned exact formal source list');
  assert.ok(candidateRequests.some(url=>url.endsWith('/learning/issue341-formal-source-routing.js')),
    'normal entry must load source-gated feedback for a formally admitted native task');
  result.checks.push('normal learning entry loads exact formal routing and bounded guide');
  await normal.close();
  const context=await newDesktopContext(browser,{serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',error=>result.errors.push(String(error)));
  await page.goto(base+'/__issue341__/');
  const composed=await page.evaluate(async()=>{
   const {ensureB39Ready}=await import('/learning/phase4/async-batches.js');
   await ensureB39Ready();
   const {sessionTaskFor}=await import('/learning/bridges.js');
   const {issue341IsolatedRegistry,issue341IsolatedGuide,issue341IsolatedFeedback,
    ISSUE341_INTEGRATION_STATUS}=await import('/learning/issue341-isolated-integration.js');
   const fixture=await (await fetch('/__issue341__/fixtures.json')).json();
   const rows=[],errors=[],checks=[];
   const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
   const cards=document.querySelector('#cards'),families=new Set();
   const storageBefore=JSON.stringify({...localStorage});
   for(const row of fixture.rows){
    const source=row.source,context={sessionId:source.sessionId,index:source.index};
    const task=sessionTaskFor(source.sessionId,source.index),before=JSON.stringify([row.model,row.record]);
    try{
     const route=issue341IsolatedRegistry.resolve(task,context);
     check(route.status==='matched'&&route.match.adapter.id===row.familyId,source.position+' shared route');
     const guide=issue341IsolatedGuide(task,context);
     check(guide.question==='哪些记录能帮助你核对这次结果？',source.position+' neutral pre-Check guide');
     const note=issue341IsolatedFeedback(task,row.model,row.record,context);
     check(note?.candidateFamily===row.familyId&&note.method===null&&
      note.proposalStatus===ISSUE341_INTEGRATION_STATUS,source.position+' shared feedback');
     check(issue341IsolatedFeedback(task,row.model,{attempts:[]},context)===null,source.position+' no Check rejected');
     check(issue341IsolatedFeedback(task,row.model,{...row.record,attempts:row.record.attempts.slice(0,-1)},context)===null,
      source.position+' stale Check rejected');
     check(issue341IsolatedFeedback(task,{...row.model,__unsubmittedEdit:true},row.record,context)===null,
      source.position+' changed current work rejected');
     if(row.group==='P007')check(issue341IsolatedFeedback(task,row.model,
      {...row.record,attempts:[row.record.attempts.at(-1)]},context)===null,source.position+' original two Checks retained');
     check(JSON.stringify([row.model,row.record])===before,source.position+' saved evidence untouched');
     const article=document.createElement('article');article.dataset.family=row.familyId;article.dataset.position=source.position;
     const label=document.createElement('h2');label.textContent=row.packet+' · '+source.position;article.append(label);
     const title=document.createElement('strong');title.textContent=note.title;article.append(title);
     for(const text of [note.observation,note.connection]){
      const paragraph=document.createElement('p');paragraph.textContent=text;article.append(paragraph);
     }
     const detail=document.createElement('small');detail.textContent=note.detail.join(' ');article.append(detail);
     const explanation=document.createElement('details'),summary=document.createElement('summary');
     summary.textContent=guide.summary;explanation.append(summary);
     const question=document.createElement('p');question.textContent=guide.question;explanation.append(question);article.append(explanation);
     cards.append(article);families.add(row.familyId);
     check(article.innerText.includes(note.observation)&&!article.innerText.includes('undefined'),source.position+' rendered text');
     rows.push({position:source.position,family:row.familyId,group:row.group,status:'PASS',
      observation:note.observation,connection:note.connection,method:note.method,
      originalAttempts:row.record.attempts.length,artifactId:row.provenance.artifactId,
      originalMember:row.provenance.member,originalMemberSha256:row.provenance.memberSha256});
    }catch(error){errors.push(source.position+': '+String(error));}
   }
   for(const family of [...families].sort()){
    const option=document.createElement('option');option.value=family;option.textContent=family;
    document.querySelector('#family').append(option);
   }
   document.querySelector('#family').addEventListener('change',event=>{
    for(const article of cards.children)article.hidden=!!event.target.value&&article.dataset.family!==event.target.value;
   });
   check(JSON.stringify({...localStorage})===storageBefore,'isolated integration does not write learning storage');
   document.querySelector('#status').textContent=rows.length+' / 365 道共享接线通过 · '+families.size+' 家族 · 正式新增 A 0';
   return {rows,errors,checks,families:families.size};
  });
  result.rows=composed.rows;result.errors.push(...composed.errors);result.checks.push(...composed.checks);
  assert.equal(composed.rows.length,365);assert.equal(composed.families,113);assert.deepEqual(result.errors,[]);
  assert.equal(await page.locator('article').count(),365);
  await page.screenshot({path:path.join(out,'all365-shared-integration.png')});
  await page.locator('#family').selectOption('issue341-P091');
  assert.equal(await page.locator('article:visible').count(),2);
  assert.ok((await page.locator('article:visible').first().innerText()).includes('没有保存每次图形'));
  await page.screenshot({path:path.join(out,'p091-bounded-feedback.png')});
  await context.close();
 }catch(error){result.errors.push(String(error.stack||error));process.exitCode=1;}
 finally{
  if(browser)await browser.close();
  if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2)+'\n');
  console.log('ISSUE341_SHARED_INTEGRATION '+JSON.stringify({positions:result.rows.length,
   families:new Set(result.rows.map(row=>row.family)).size,checks:result.checks.length,
   errors:result.errors,formalA:1178,newFormalA:365,originalFamilySuitesRerun:0}));
 }
})();
