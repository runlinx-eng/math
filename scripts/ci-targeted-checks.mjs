// CI-only targeted browser plan and receipts. Full 17-group inventory is untouched.
// Routine checks select changed families; manual milestone runs use the original full gate.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {appendFileSync,existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {dirname,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BROWSER_GROUPS} from './required-browser-checks.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const check=(value,message)=>assert.ok(value,message);
const same=(a,b)=>assert.deepEqual(a,b);
const safeScript=/^tests\/[a-zA-Z0-9][a-zA-Z0-9/_-]*-browser\.cjs$/;
const stable=(files)=>[...new Set(files)].sort();
const identity=()=>{
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 check(process.env.GITHUB_SHA===sha,'Runner checkout SHA does not match GitHub trigger');
 const attempt=Number(process.env.GITHUB_RUN_ATTEMPT);
 check(/^[a-f0-9]{40}$/.test(sha),'Invalid checkout SHA');
 check(Number.isSafeInteger(attempt)&&attempt>=1,'Invalid run attempt');
 check(/^[1-9][0-9]*$/.test(process.env.GITHUB_RUN_ID||''),'Invalid run ID');
 return {sha,event:process.env.GITHUB_EVENT_NAME,runId:process.env.GITHUB_RUN_ID,attempt};
};
function checkedFiles(changedFiles){
 check(Array.isArray(changedFiles),'Missing changed file list');
 for(const file of changedFiles)check(typeof file==='string'&&file.length>0&&
  !file.startsWith('/')&&!file.includes('..')&&!file.includes('\\'),
  'Invalid changed file path');
 return stable(changedFiles);
}
export function planTargetedChecks({event,changedFiles,definitions,registry,previousRegistry=null,
 fileExists=p=>existsSync(resolve(root,p))}){
 check(['pull_request','push','workflow_dispatch'].includes(event),'Unknown CI event');
 const changed=checkedFiles(changedFiles);
 check(definitions&&typeof definitions==='object','Missing reviewed family definitions');
 check(registry&&Array.isArray(registry.newFamilies),'Missing registered math families');
 const registered=new Set(Object.values(definitions).flatMap(group=>group.commands.map(c=>c.file)));
 const modules=registry.newFamilies;
 const selected=new Set();
 const add=(file)=>{
  if(registered.has(file)||safeScript.test(file)&&fileExists(file))selected.add(file);
  else throw Error('No reviewed browser test exists for '+file);
 };
 const familyByName=name=>{
  const normalized=name.replace(/[-_]/g,'-');
  let found=false;
  const legacy='tests/p9-'+normalized+'-adapter-browser.cjs';
  if(registered.has(legacy)){add(legacy);found=true;}
  for(const module of modules){
   const pattern=new RegExp('(?:^|-)'+module.familyId.replace(/[-_]/g,'-')+'(?:-|$)');
   if(pattern.test(normalized)){
    add(module.entry);found=true;
   }
  }
  return found;
 };
 const full=event==='workflow_dispatch';
 const smoke=full||changed.some(file=>!(/^(docs\/|README\.md$|AGENTS\.md$|LICENSE$|\.gitignore$)/).test(file));
 if(event==='pull_request'){
  for(const file of changed){
   if(registered.has(file)){add(file);continue;}
   if(safeScript.test(file)&&fileExists(file)){add(file);continue;}
   if(file==='ci/math-families.json'){
    check(previousRegistry&&Array.isArray(previousRegistry.newFamilies),
     'Registry change requires a previous registry for exact new-family detection');
    const before=new Map(previousRegistry.newFamilies.map(m=>[m.familyId,m]));
    for(const module of modules){
     if(JSON.stringify(before.get(module.familyId))!==JSON.stringify(module))add(module.entry);
    }
    continue;
   }
   if(/^dist\/learning\/(?:phase5\/)?[a-zA-Z0-9_-]+(?:\.js|\.mjs)$/.test(file)){
    const stem=basename(file).replace(/\.(?:js|mjs)$/,'')
     .replace(/-(?:evidence|model|adapter|view|runtime)$/,'');
    if(familyByName(stem))continue;
    // Unknown/shared lesson code is never treated as an unrelated documentation edit.
    add('tests/p10-learning-continuity-browser.cjs');
    add('tests/p9-thinking-feedback-browser.cjs');
    continue;
   }
   if(/^dist\/(?:sw(?:-client)?\.js|learn\.html|index\.html|v2\.html|local-runtime\.js|mac-local\.html)$/.test(file)||
    file==='scripts/server.py'){
    add('tests/p10-longterm-offline-browser.cjs');
    add('tests/p10-sw-nav-isolation-browser.cjs');
    add('tests/p10-release-upgrade-repeat.cjs');
    continue;
   }
   if(/^dist\/(?:spatial-[a-zA-Z0-9_-]+\.js|space\.(?:js|css)|exploration\.js)$/.test(file)){
    add('tests/spatial-overview-browser.cjs');
    continue;
   }
   if(/^tests\/helpers\//.test(file)){
    add('tests/p10-learning-continuity-browser.cjs');
    add('tests/p9-thinking-feedback-browser.cjs');
    continue;
   }
   if(file==='vendor/upstream.json'||file==='dist/data/atlas.json'){
    add('tests/p10-full-lessons-browser.cjs');
   }
  }
 }
 const include=stable([...selected]).map(script=>({id:hash(script).slice(0,12),script}));
 check(new Set(include.map(x=>x.id)).size===include.length,'Targeted ID collision');
 const plan={schema:'math-ci-targeted/1',event,changedFiles:changed,runSmoke:smoke,
  matrix:{include},scripts:include.map(x=>x.script)};
 plan.digest=hash(plan);
 return plan;
}
export function validateDailyGate({needs,reports,context,plan}){
 check(context&&['pull_request','push'].includes(context.event),'Daily gate requires PR or main push');
 check(plan&&plan.event===context.event,'Daily gate requires matching PR or main push plan');
 same(Object.keys(needs||{}).sort(),['browser','plan-checks','smoke-checks','static-checks','targeted']);
 check(needs['plan-checks']?.result==='success','Changed-file planning job failed');
 check(needs['static-checks']?.result==='success','Static checks failed');
 check(needs.browser?.result==='skipped','Full browser job must be skipped in daily mode');
 check(needs['smoke-checks']?.result===(plan.runSmoke?'success':'skipped'),'Smoke job result differs from required scope');
 check(needs.targeted?.result===(plan.scripts.length?'success':'skipped'),'Targeted job result differs from actual selected families');
 const outputs=needs['plan-checks'].outputs||{};
 check(outputs.run_smoke===(plan.runSmoke?'true':'false'),'Smoke decision differs from recomputed source diff');
 check(outputs.run_targeted===(plan.scripts.length?'true':'false'),'Targeted decision differs from recomputed source diff');
 check(outputs.targeted_digest===plan.digest,'Targeted plan checksum differs from source diff');
 let declared;
 try{declared=JSON.parse(outputs.targeted_matrix);}catch{throw Error('Invalid selected matrix JSON');}
 same(declared,plan.matrix);
 check(Array.isArray(reports),'Missing targeted receipt list');
 const byId=new Map(),attemptKeys=new Set(),expected=new Map(plan.matrix.include.map(i=>[i.id,i.script]));
 for(const r of reports){
  check(r&&r.schema==='math-ci-targeted-result/1','Unknown targeted receipt');
  check(expected.get(r.id)===r.script,'Unselected or wrongly matched family receipt');
  check(r.sha===context.sha&&r.event===context.event&&r.runId===context.runId,
   'Receipt belongs to another run or checkout');
  check(Number.isSafeInteger(r.attempt)&&r.attempt>0&&r.attempt<=context.attempt,'Invalid receipt attempt');
  check(typeof r.elapsedMs==='number'&&Number.isFinite(r.elapsedMs)&&r.elapsedMs>=0,'Invalid family duration');
  check(Number.isSafeInteger(r.exitCode)&&r.exitCode>=0&&r.exitCode<=255,'Invalid command exit code');
  check(r.status===(r.exitCode===0&&!r.error?'success':'failure'),'Inconsistent family outcome');
  const key=r.id+':'+r.attempt;
  check(!attemptKeys.has(key),'Duplicate targeted receipt attempt');attemptKeys.add(key);
  if(!byId.has(r.id)||byId.get(r.id).attempt<r.attempt)byId.set(r.id,r);
 }
 check(byId.size===expected.size&&[...expected.keys()].every(id=>byId.has(id)),
  'Missing required impacted-family receipt');
 for(const r of byId.values())check(r.status==='success','Impacted family did not pass: '+r.script);
 return {mode:'daily',sha:context.sha,runId:context.runId,smoke:plan.runSmoke,
  targetedScripts:plan.scripts};
}
function currentFiles(event){
 if(event==='workflow_dispatch')return [];
 let from;
 if(event==='pull_request'){
  check(process.env.GITHUB_BASE_REF&&/^[a-zA-Z0-9/_-]+$/.test(process.env.GITHUB_BASE_REF),
   'Missing safe PR base branch');
  from='origin/'+process.env.GITHUB_BASE_REF+'...HEAD';
 }else{check(event==='push','Unknown daily event');from='HEAD^';}
 const args=event==='pull_request'?['diff','--name-only',from]:['diff','--name-only','HEAD^','HEAD'];
 const raw=execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
 return raw.split('\n').filter(Boolean);
}
function previousRegistry(event,changed){
 if(event!=='pull_request'||!changed.includes('ci/math-families.json'))return null;
 const base='origin/'+process.env.GITHUB_BASE_REF;
 return JSON.parse(execFileSync('git',['show',base+':ci/math-families.json'],
  {cwd:root,encoding:'utf8',maxBuffer:1024*1024}));
}
// Daily selection is deliberately independent of the historical full-regression
// packing. Retain the exact legacy scripts and checked family entrypoints, but
// never call the full ten-bin/29-minute packer for a routine PR or main push.
export function dailyDefinitions(registry){
 check(registry?.schema==='math-ci-family-registry/1'&&Array.isArray(registry.newFamilies),
  'Invalid reviewed registry for daily checks');
 const definitions={...BROWSER_GROUPS},entries=new Set(Object.values(BROWSER_GROUPS)
  .flatMap(group=>group.commands.map(cmd=>cmd.file)));
 for(const family of registry.newFamilies){
  check(typeof family.familyId==='string'&&/^[a-z][a-z0-9-]*$/.test(family.familyId),
   'Invalid daily family identity');
  check(safeScript.test(family.entry)&&existsSync(resolve(root,family.entry)),
   'Missing registered daily family browser script');
  check(!entries.has(family.entry),'Duplicate registered browser entry');
  entries.add(family.entry);
  check(Array.isArray(family.artifacts)&&family.artifacts.length>0&&
   Array.isArray(family.proofContracts)&&family.proofContracts.includes('math'),
   'Missing family evidence contract');
  const key='daily-'+family.familyId;
  check(!Object.hasOwn(definitions,key),'Duplicate daily family ID');
  definitions[key]={newFamily:true,commands:[{file:family.entry,env:{}}],
   modules:[{familyId:family.familyId,entry:family.entry,artifacts:family.artifacts,
    proofContracts:family.proofContracts}]};
 }
 return definitions;
}
export function currentPlan(){
 const event=process.env.GITHUB_EVENT_NAME,changed=currentFiles(event);
 const registry=JSON.parse(readFileSync(resolve(root,'ci/math-families.json'),'utf8'));
 return planTargetedChecks({event,changedFiles:changed,registry,
  definitions:dailyDefinitions(registry),previousRegistry:previousRegistry(event,changed)});
}
function verifyRegisteredFamily(script,context,definitions){
 for(const group of Object.values(definitions)){
  if(!group.newFamily)continue;
  for(const module of group.modules){
   if(module.entry!==script)continue;
   for(const dir of module.artifacts){
    const folder=resolve(root,dir);
    check(existsSync(folder),'New family missing original evidence directory: '+dir);
    const resultPath=resolve(folder,'results.json');
    check(existsSync(resultPath),'New family missing mathematical results: '+dir);
    const result=JSON.parse(readFileSync(resultPath,'utf8'));
    check(Array.isArray(result.errors)&&result.errors.length===0,'New family mathematical errors: '+dir);
    check(Array.isArray(result.checks)&&result.checks.length>0||
     Number.isInteger(result.checks)&&result.checks>0,'New family has no mathematical checks');
    check(Array.isArray(result.proofContracts)&&module.proofContracts.every(p=>result.proofContracts.includes(p)),
     'New family lacks registered proof contracts: '+dir);
    check(result.provenance?.testedCheckoutSha===context.sha&&
     String(result.provenance?.runId)===context.runId&&
     Number(result.provenance?.runAttempt)===context.attempt,
     'New family evidence does not belong to this run');
    check(readdirSync(folder).some(f=>f.toLowerCase().endsWith('.png')),'Missing true Chromium screenshot: '+dir);
   }
  }
 }
}
export function runTargetedTask(){
 const context=identity();
 check(context.event==='pull_request','Family jobs run on PRs only; main runs smoke');
 const plan=currentPlan(),script=process.env.MATH_TARGET_SCRIPT,id=process.env.MATH_TARGET_ID;
 check(plan.matrix.include.some(i=>i.id===id&&i.script===script),'Requested browser script is not selected by changed files');
 const start=Date.now(),child=spawnSync(process.execPath,[script],{cwd:root,env:process.env,stdio:'inherit'});
 let error=child.error?String(child.error):child.signal?'Terminated: '+child.signal:null;
 let exitCode=Number.isInteger(child.status)?child.status:1;
 if(exitCode===0&&!error)try{
  verifyRegisteredFamily(script,context,dailyDefinitions(JSON.parse(
   readFileSync(resolve(root,'ci/math-families.json'),'utf8'))));
 }catch(e){error=String(e.stack||e);exitCode=1;}
 const report={schema:'math-ci-targeted-result/1',id,script,...context,
  elapsedMs:Date.now()-start,exitCode,error:error?error.slice(0,2000):null,
  status:exitCode===0&&!error?'success':'failure'};
 const folder=resolve(root,'verification/targeted-results');
 mkdirSync(folder,{recursive:true});
 writeFileSync(resolve(folder,id+'-attempt-'+context.attempt+'.json'),JSON.stringify(report,null,2)+'\n');
 console.log('TARGETED_BROWSER_RESULT '+JSON.stringify({script,status:report.status,elapsedMs:report.elapsedMs}));
 if(report.status!=='success')process.exitCode=1;
 return report;
}
function main(){
 const op=process.argv[2];
 if(op==='plan'){
  const plan=currentPlan();
  check(process.env.GITHUB_OUTPUT,'Missing GITHUB_OUTPUT');
  appendFileSync(process.env.GITHUB_OUTPUT,
   'run_targeted='+(plan.scripts.length?'true':'false')+'\n'+
   'run_smoke='+(plan.runSmoke?'true':'false')+'\n'+
   'targeted_matrix='+JSON.stringify(plan.matrix)+'\n'+
   'targeted_digest='+plan.digest+'\n');
  console.log('TARGETED_BROWSER_PLAN '+JSON.stringify(plan));return;
 }
 if(op==='run'){runTargetedTask();return;}
 if(op==='gate'){
  const context=identity(),plan=currentPlan();
  const needs=JSON.parse(process.env.MATH_REQUIRED_NEEDS||'null');
  const folder=resolve(root,'verification/targeted-downloaded');
  const files=existsSync(folder)?readdirSync(folder):[];
  check(files.every(x=>x.endsWith('.json')),'Non-JSON targeted receipt');
  const reports=files.map(file=>JSON.parse(readFileSync(resolve(folder,file),'utf8')));
  console.log('REQUIRED_DAILY_SUCCESS '+JSON.stringify(validateDailyGate({needs,reports,context,plan})));return;
 }
 throw Error('Unknown targeted CI operation');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(error){console.error(error.stack||error);process.exitCode=1;}
}
