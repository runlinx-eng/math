'use strict';
// Intake #343: one authentic B-line Chromium State-v2 file chooser per original run.
// All 95 mathematical task records are verified against their exact frozen snapshots.
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..'),input=path.join(root,'verification/issue341-inputs');
const out=path.join(root,'verification/issue343-a214-next95-backup-import');
const base=process.env.MATH_BASE_URL||'http://127.0.0.1:43827/';
const original=JSON.parse(fs.readFileSync(path.join(input,'archived-checks-a214-next95.json'),'utf8'));
const lock=JSON.parse(fs.readFileSync(path.join(root,'docs/math-parallel/issue343-a214-next95-original-lock.json'),'utf8'));
assert.equal(original.schema,'issue343-a214-next95-original-Check/1');
assert.equal(original.rows.length,95);
assert.equal(lock.rows.length,95);
const perRun=new Map();
for(const row of lock.rows){
 const run=row.checkPath.split('/')[0];
 if(!perRun.has(run))perRun.set(run,[]);
 perRun.get(run).push(row);
}
assert.ok(perRun.size>=21,'real source runs missing');
const results=[],errors=[];
const check=(ok,label)=>{assert.ok(ok,label);results.push(label)};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [run,rows] of perRun){
   const payload=fs.readFileSync(path.join(input,'b39-next95-original-export-'+run+'.json'),'utf8');
   const exported=JSON.parse(payload);
   check(exported.version===2&&exported.app==='math-explorer',run+' genuine State-v2 export');
   const context=await newDesktopContext(browser,{serviceWorkers:'allow'});
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(String(error)));
   try{
    await page.goto(base+'v2.html#trail');
    await page.locator('#import-file').waitFor({state:'attached'});
    const choose=async(contents,name)=>{
     await page.locator('#import-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(contents)});
     await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
     return await page.locator('#toast').innerText();
    };
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
    for(const row of rows)check(!before?.lessons?.[row.sessionId]?.cases?.[row.index],
      row.position+' independent fresh target');
    check((await choose(payload,run+'.json')).includes('备份已合并'),run+' native file-chooser import');
    const imported=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
    for(const row of rows){
     const sid=row.sessionId,index=row.index;
     const exact=original.rows.find(x=>x.source.position===row.position);
     assert.ok(exact,'source-locked original Check missing');
     assert.deepEqual(imported.lessons[sid].models[index],exact.model,row.position+' original model');
     assert.deepEqual(imported.lessons[sid].cases[index],exact.record,row.position+' original Check');
     check(exact.record.attempts.length===2,row.position+' wrong-then-correct record imported');
    }
    const byteSnapshot=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
    check((await choose(payload,run+'-repeat.json')).includes('备份已合并'),run+' repeat import');
    check(await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===byteSnapshot,
      run+' repeated import preserves existing bytes');
    check(!(await choose('{',run+'-damaged.json')).includes('备份已合并'),run+' corrupt import rejected');
    check(await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===byteSnapshot,
      run+' corrupt input cannot overwrite original');
   }finally{await context.close();}
  }
  check(errors.length===0,'no runtime browser errors');
 }finally{
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({
   schema:'issue343-a214-next95-genuine-import/1',frozen:lock.frozen,
   uniqueTasks:95,originalRuns:perRun.size,originalUserRecordsNotSynthesized:true,
   checks:results,errors
  },null,2)+'\n');
  await browser.close();
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
