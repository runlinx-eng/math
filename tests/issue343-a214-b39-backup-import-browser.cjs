'use strict';
// Central intake: use four B-line original Chromium State-v2 exports, not generated
// model/Check records. Real browser native file chooser and independent profiles.
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const {newDesktopContext}=require('./helpers/standard-desktop-viewport.cjs');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'verification/issue343-a214-b39-backup-import');
const input=path.join(root,'verification/issue341-inputs');
const url=process.env.MATH_BASE_URL||'http://127.0.0.1:43827/';
const cases=[
 ['square-inclusion','structure39',2],
 ['quadrilateral-nesting','structure39',3],
 ['angle-estimate','representations39',2],
 ['protractor','representations39',3]
];
const results=[],errors=[];
const check=(condition,message)=>{assert.ok(condition,message);results.push(message)};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
  for(const [family,sid,index] of cases){
   const exported=fs.readFileSync(path.join(input,'b39-original-export-'+family+'.json'),'utf8');
   const backup=JSON.parse(exported);
   assert.equal(backup.version,2);
   assert.equal(backup.app,'math-explorer');
   const expected=backup.state.lessons[sid];
   assert.ok(expected);
   assert.equal(expected.cases[index].attempts.length,2);
   const ctx=await newDesktopContext(browser,{serviceWorkers:'allow'});
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(String(e)));
   try {
    await page.goto(url+'v2.html#trail');
    await page.locator('#import-file').waitFor({state:'attached'});
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
    check(!before.lessons?.[sid]||!before.lessons[sid].cases?.[index],
      family+' independent browser does not already contain the source Check');
    const choose=async(content,name)=>{
     await page.locator('#import-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(content)});
     await page.waitForFunction(()=>document.querySelector('#import-file')?.value==='');
     return page.locator('#toast').innerText();
    };
    const message=await choose(exported,'original-'+family+'.json');
    check(message.includes('备份已合并'),family+' genuine native export accepted through file chooser');
    const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-explorer-v2')));
    assert.deepEqual(restored.lessons[sid].models[index],expected.models[index]);
    assert.deepEqual(restored.lessons[sid].cases[index],expected.cases[index]);
    check(restored.lessons[sid].cases[index].attempts[0].value!==undefined &&
      restored.lessons[sid].cases[index].attempts.length===2,
      family+' preserves original wrong and corrected Checks');
    const frozen=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
    const duplicate=await choose(exported,'repeat-'+family+'.json');
    check(duplicate.includes('备份已合并'),family+' second identical import accepted');
    check(await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===frozen,
      family+' repeated import does not mutate recorded content');
    const rejected=await choose('{','damaged-'+family+'.json');
    check(!rejected.includes('备份已合并'),family+' corrupted JSON import rejected');
    check(await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===frozen,
      family+' rejected file preserves all existing learning bytes');
   } finally {await ctx.close();}
  }
  check(errors.length===0,'no browser script errors');
 } finally {
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({schema:'issue343-a214-b39-real-import/1',
   testedPositions:cases.map(([family,sid,index])=>({family,position:sid+':'+index})),
   originalUserRecordsNotSynthesized:true,results,errors},null,2)+'\n');
  await browser.close();
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
