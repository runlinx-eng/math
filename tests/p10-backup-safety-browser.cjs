// P10: real file inputs, native graders and disk-backed Chromium profiles.
// Generated V1/conflict samples are compatibility fixtures, never child backups.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/p10-release-upgrade/backup-safety');
const base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827/';
const KEY='math-explorer-v2',PADDING='p10-backup-safety-quota-padding';
const checks=[],errors=[],contexts=new Set();
const check=(yes,label,details={})=>{assert.ok(yes,label);checks.push({label,result:'A',...details});};
const read=page=>page.evaluate(key=>localStorage.getItem(key),KEY);
const digest=text=>crypto.createHash('sha256').update(text).digest('hex');
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let event={};
if(process.env.GITHUB_EVENT_PATH)event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
const provenance={headSha:event.pull_request?.head?.sha||checkoutSha,testedCheckoutSha:checkoutSha,
 nodeVersion:process.version,platform:process.platform,realHistoricalChildBackup:false};
let activePage,profiles;

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 profiles=fs.mkdtempSync(path.join(os.tmpdir(),'math-p10-backup-profiles-'));
 const open=async name=>{
  const context=await chromium.launchPersistentContext(path.join(profiles,name),{
   headless:true,viewport:{width:1440,height:900},acceptDownloads:true,
   serviceWorkers:'allow',reducedMotion:'reduce',
   ...(process.env.MATH_CHROMIUM_EXECUTABLE?{executablePath:process.env.MATH_CHROMIUM_EXECUTABLE}:{}),
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
  });
  contexts.add(context);
  context.on('page',page=>page.on('pageerror',error=>errors.push(String(error))));
  const page=context.pages()[0]||await context.newPage();
  page.on('pageerror',error=>errors.push(String(error)));
  activePage=page;
  provenance.browserVersion=context.browser()?.version()||'persistent Chromium';
  return {context,page};
 };
 const close=async context=>{await context.close();contexts.delete(context);};
 const trail=async page=>{
  activePage=page;
  await page.goto(base+'v2.html#trail');
  await page.locator('#import-file').waitFor({state:'attached'});
  await page.locator('[data-do="export"]').first().waitFor();
 };
 const lesson=async(page,id)=>{
  activePage=page;
  await page.goto(base+'learn.html#'+id);
  await page.waitForFunction(value=>window.mathLesson?.snapshot()?.id===value,id);
 };
 const importFile=async(page,contents,name)=>{
  activePage=page;
  await page.locator('#import-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(contents)});
  // The async change handler clears this input in finally. Waiting for it is
  // essential: setInputFiles alone does not wait for validation or storage.
  await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
  return await page.locator('#toast').innerText();
 };
 try{
  const source=await open('source');
  await lesson(source.page,'equivalent');
  await source.page.locator('#actions [data-do="check"]').click();
  check(await source.page.locator('#scene').getAttribute('data-stage')==='revise','source backup starts with a native incorrect attempt');
  await source.page.locator('#actions [data-do="hint"]').click();
  for(const [row,index] of [[0,1],[1,2],[2,3]])
   await source.page.locator('[data-do="row-part"][data-row="'+row+'"][data-index="'+index+'"]').click();
  await source.page.locator('#actions [data-do="check"]').click();
  check(await source.page.locator('#scene').getAttribute('data-stage')==='passed','source correction passes the unchanged fraction grader');
  for(const mark of ['4','6']){
   await source.page.locator('#actions [data-do="next"]').click();
   await source.page.locator('input[data-field="mark"]').fill(mark);
   await source.page.locator('#actions [data-do="check"]').click();
   check(await source.page.locator('#scene').getAttribute('data-stage')==='passed','source native number-line task '+mark+' passes');
  }
  await source.page.locator('#actions [data-do="next"]').click();
  await source.page.locator('#note').fill('同一个整体可以用不同的等分表示；这份解释应在备份后完整保留。');
  await source.page.locator('[data-do="save-note"]').click();
  await source.page.locator('#note').fill('尚未提交的本机解释草稿。');
  await trail(source.page);
  const download=source.page.waitForEvent('download');
  await source.page.locator('[data-do="export"]').first().click();
  const exported=await download;
  const payload=fs.readFileSync(await exported.path(),'utf8'),backup=JSON.parse(payload);
  const sourceRaw=await read(source.page);
  assert.deepEqual(backup.state,JSON.parse(sourceRaw));
  check(backup.version===2&&backup.state.lessons.equivalent.notes.length===1&&
   backup.state.lessons.equivalent.draft==='尚未提交的本机解释草稿。',
   'actual browser V2 export contains every saved field, explanation and unsubmitted draft');
  fs.writeFileSync(path.join(out,'browser-export-v2.json'),payload);
  await source.page.screenshot({path:path.join(out,'source-backup.png')});
  await close(source.context);

  const remote=await open('import-target');
  await trail(remote.page);
  // renderTrail legitimately persists the application's fresh empty state.
  // Independence means no inherited records, not absence of the storage key.
  const initialTarget=await remote.page.evaluate(async key=>{
   const {fresh}=await import('./exploration-core.js');
   const raw=localStorage.getItem(key);
   return {stored:raw===null?null:JSON.parse(raw),empty:fresh()};
  },KEY);
  assert.deepEqual(initialTarget.stored===null?initialTarget.empty:initialTarget.stored,initialTarget.empty);
  check(true,'independent target profile has native fresh state without inherited learning evidence',
   {freshRecordInitialized:initialTarget.stored!==null});
  check((await importFile(remote.page,payload,'real-browser-v2.json')).includes('备份已合并'),
   'actual V2 file import completes in an independent Chromium profile');
  const restored=await read(remote.page);
  assert.deepEqual(JSON.parse(restored).lessons.equivalent,backup.state.lessons.equivalent);
  check(true,'cross-profile import preserves source lesson field for field',{sha256:digest(restored)});
  check((await importFile(remote.page,payload,'identical-repeat-v2.json')).includes('备份已合并'),
   'identical repeated V2 import completes');
  check(await read(remote.page)===restored,'identical repeated import is byte-idempotent');
  for(const [kind,mutate,expected] of [
   ['draft',state=>{state.lessons.equivalent.draft='来自另一台设备的不同草稿。';},'草稿'],
   ['workpiece',state=>{state.lessons.equivalent.models[0]=structuredClone(state.lessons.equivalent.cases[0].attempts[0].value);},'工作模型'],
   ['same-id-evidence',state=>{const attempt=state.lessons.equivalent.cases[0].attempts[0];attempt.supported=!attempt.supported;},'同 ID 证据']
  ]){
   const incoming=structuredClone(backup);mutate(incoming.state);
   const previousSnapshot=await remote.page.evaluate(key=>localStorage.getItem(key+'-before-import'),KEY);
   const message=await importFile(remote.page,JSON.stringify(incoming),'constructed-'+kind+'-conflict.json');
   check(message.includes('已取消导入')&&message.includes(expected),kind+' conflict is explicitly rejected by the original import guard');
   check(await read(remote.page)===restored,kind+' rejection preserves all original storage bytes');
   check(await remote.page.evaluate(key=>localStorage.getItem(key+'-before-import'),KEY)===previousSnapshot,
    kind+' rejection preserves the previous recovery snapshot');
  }
  for(const [name,bad] of [
   ['corrupt-json','{'],
   ['unsupported-version',JSON.stringify({app:'math-explorer',version:99,state:{}})],
   ['invalid-v2-state',JSON.stringify({app:'math-explorer',version:2,state:{schema:2}})]
  ]){
   const message=await importFile(remote.page,bad,name+'.json');
   check(!!message&&!message.includes('备份已合并'),name+' produces an explicit rejection');
   check(await read(remote.page)===restored,name+' cannot mutate existing learning records');
  }
  await remote.page.screenshot({path:path.join(out,'import-rejection.png')});
  await close(remote.context);

  const legacy=await open('constructed-v1');
  await trail(legacy.page);
  const v1=await legacy.page.evaluate(async()=>{
   const {freshState}=await import('./core.js');
   return JSON.stringify({app:'math-explorer',version:1,state:freshState()});
  });
  check((await importFile(legacy.page,v1,'automatically-constructed-v1.json')).includes('备份已合并'),
   'constructed V1 file passes the native browser compatibility path');
  const legacyState=JSON.parse(await read(legacy.page));
  check(legacyState.schema===2&&legacyState.legacy!==null&&Object.keys(legacyState.lessons).length===0,
   'constructed V1 compatibility preserves legacy semantics without invented lesson evidence');
  await close(legacy.context);

  let quota=await open('quota-reopen');
  await lesson(quota.page,'share');
  await quota.page.locator('#actions [data-do="check"]').click();
  const quotaOriginal=await read(quota.page);
  check(JSON.parse(quotaOriginal).lessons.share.cases[0].attempts.length===1,
   'quota profile contains a real nonempty native learning record before exhaustion');
  await trail(quota.page);
  fs.writeFileSync(path.join(out,'quota-before.json'),quotaOriginal);
  const quotaFill=await quota.page.evaluate(padding=>{
   let low=0,high=16*1024*1024,failures=0;
   while(low<high){
    const next=Math.ceil((low+high)/2);
    try{localStorage.setItem(padding,'q'.repeat(next));low=next;}
    catch(error){if(error.name!=='QuotaExceededError')throw error;failures++;high=next-1;}
   }
   let finalError=null;
   try{localStorage.setItem(padding,'q'.repeat(low+1));}
   catch(error){finalError={name:error.name,message:error.message};}
   return {maxChars:low,storedChars:localStorage.getItem(padding)?.length,failures,finalError};
  },PADDING);
  check(quotaFill.failures>0&&quotaFill.maxChars===quotaFill.storedChars&&quotaFill.finalError?.name==='QuotaExceededError',
   'real localStorage quota is exhausted to one-character precision, without a mocked setter',quotaFill);
  let message=await importFile(quota.page,payload,'real-v2-at-full-quota.json');
  check(/quota|exceeded|配额|容量|空间/i.test(message)&&!message.includes('备份已合并'),
   'completed import reports real storage quota failure while creating its recovery snapshot',{message});
  check(await read(quota.page)===quotaOriginal,'snapshot quota failure leaves the nonempty original record byte-identical');
  check(await quota.page.evaluate(key=>localStorage.getItem(key+'-before-import'),KEY)===null,
   'failed recovery snapshot is not falsely reported as saved');

  // Also exercise failure AFTER the recovery snapshot succeeds. Reserve only
  // that snapshot and its key, leaving too little room for the merged record.
  const snapshotChars=await quota.page.evaluate(async raw=>{
   const {backup}=await import('./exploration-core.js');
   return JSON.stringify(backup(JSON.parse(raw))).length;
  },quotaOriginal);
  const reserve=snapshotChars+(KEY+'-before-import').length+64;
  await quota.page.evaluate(({padding,length})=>localStorage.setItem(padding,'q'.repeat(length)),
   {padding:PADDING,length:quotaFill.maxChars-reserve});
  message=await importFile(quota.page,payload,'real-v2-record-write-quota.json');
  check(/quota|exceeded|配额|容量|空间/i.test(message)&&!message.includes('备份已合并'),
   'completed import also reports quota failure when writing the merged learning record',{message});
  const recoverySnapshot=await quota.page.evaluate(key=>localStorage.getItem(key+'-before-import'),KEY);
  check(recoverySnapshot!==null,'recovery snapshot really exists before the merged-record write fails');
  assert.deepEqual(JSON.parse(recoverySnapshot).state,JSON.parse(quotaOriginal));
  check(await read(quota.page)===quotaOriginal,'merged-record quota failure preserves every original byte and a valid recovery snapshot');
  await quota.page.screenshot({path:path.join(out,'quota-confirmed-failure.png')});
  await close(quota.context);

  // This closes the entire persistent browser and reopens the same disk profile,
  // rather than only opening a new tab in an existing in-memory context.
  quota=await open('quota-reopen');
  await trail(quota.page);
  const afterReopen=await read(quota.page);
  fs.writeFileSync(path.join(out,'quota-after-reopen.json'),afterReopen||'null');
  check(afterReopen===quotaOriginal,'full Chromium close and reopen preserves nonempty original bytes after both quota failures',
   {beforeSha256:digest(quotaOriginal),afterSha256:digest(afterReopen)});
  check(await quota.page.evaluate(padding=>localStorage.getItem(padding)?.length>0,PADDING),
   'reopen used the same persistent profile, including its test quota padding');
  // Free only the synthetic test filler; never remove the learner record.
  await quota.page.evaluate(padding=>localStorage.removeItem(padding),PADDING);
  await lesson(quota.page,'share');
  await quota.page.locator('#actions [data-do="check"]').click();
  const resumed=JSON.parse(await read(quota.page));
  assert.deepEqual(resumed.lessons.share.cases[0].attempts[0],JSON.parse(quotaOriginal).lessons.share.cases[0].attempts[0]);
  check(resumed.lessons.share.cases[0].attempts.length===2,
   'original task still judges and saves a new attempt after space is restored');
  await trail(quota.page);
  check((await importFile(quota.page,payload,'real-v2-after-space-restored.json')).includes('备份已合并'),
   'the same actual V2 backup imports successfully after restoring space');
  const recovered=JSON.parse(await read(quota.page));
  check(recovered.lessons.share.cases[0].attempts.length===2&&recovered.lessons.equivalent.notes.length===1,
   'successful quota retry retains old and newly imported learning history');
  await close(quota.context);
  check(errors.length===0,'no uncaught application page errors',{errors});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({provenance,checks,errors,
   independentPersistentProfiles:4,quotaFullBrowserReopens:1,constructedV1:true,constructedConflictVariants:true},null,2));
  console.log('P10_BACKUP_SAFETY_OK '+checks.length+' real Chromium checks');
 }catch(error){
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({provenance,checks,errors,error:String(error),stack:error.stack},null,2));
  if(activePage&&!activePage.isClosed())await activePage.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
  console.error('P10_BACKUP_SAFETY_FAILED '+(error.stack||error));process.exitCode=1;
 }finally{
  for(const context of contexts)await context.close().catch(()=>{});
  fs.rmSync(profiles,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
