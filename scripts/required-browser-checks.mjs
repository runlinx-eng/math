// One reviewed browser inventory. Groups run on separate runners; commands
// within each group remain sequential and never suppress another result.
import {appendFileSync,existsSync,mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const groups={
 "ui":{commands:[
  {"file":"tests/learning-node-runtime-browser.cjs","env":{}},
  {"file":"tests/three-level-node-progress-browser.cjs","env":{}},
  {"file":"tests/explore-during-learning-browser.cjs","env":{}},
  {"file":"tests/spatial-theme-overview-browser.cjs","env":{}},
  {"file":"tests/p11-focus-hover-browser.cjs","env":{}},
  {"file":"tests/p11-entry-simplification-browser.cjs","env":{}},
  {"file":"tests/p7-d5-entry-browser.cjs","env":{}},
  {"file":"tests/p7-d6-fixed-ui-browser.cjs","env":{}},
  {"file":"tests/p7-d7-multi-type-browser.cjs","env":{}},
  {"file":"tests/p8-node-surface-browser.cjs","env":{}},
  {"file":"tests/p8-mode-real-click-browser.cjs","env":{}},
  {"file":"tests/p8-b39-lazy-browser.cjs","env":{}},
  {"file":"tests/p1-navigation-browser.cjs","env":{}},
  {"file":"tests/p2-grade-distribution-browser.cjs","env":{}},
  {"file":"tests/p3-learning-flow-browser.cjs","env":{}},
  {"file":"tests/p7-learning-panel-browser.cjs","env":{}},
  {"file":"tests/p7-d4-multi-type-browser.cjs","env":{}},
  {"file":"tests/p4-learning-reliability-browser.cjs","env":{}},
  {"file":"tests/p5-integration-browser.cjs","env":{}},
  {"file":"tests/continuous-space-browser.cjs","env":{}},
  {"file":"tests/p6b-layout-browser.cjs","env":{}},
  {"file":"tests/spatial-overview-browser.cjs","env":{}},
  {"file":"tests/spatial-focus-transition-browser.cjs","env":{}},
  {"file":"tests/spatial-focus-semantics-browser.cjs","env":{}},
  {"file":"tests/spatial-focus-filter-browser.cjs","env":{}},
  {"file":"tests/spatial-guide-inplace-browser.cjs","env":{}},
  {"file":"tests/spatial-unified-map-browser.cjs","env":{}},
  {"file":"tests/grade-progression-overview-browser.cjs","env":{}},
  {"file":"tests/spatial-local-focus-browser.cjs","env":{}},
  {"file":"tests/learning-workspace-browser.cjs","env":{}},
  {"file":"tests/concept-visual-browser.cjs","env":{"MATH_CONCEPT_BROWSER_SCOPE":"smoke"}},
  {"file":"tests/node-name-browser.cjs","env":{}},
  {"file":"tests/relationship-wording-browser.cjs","env":{}},
 ],artifacts:[
  "verification/overview-readability-v1/",
  "verification/spatial-focus-transition/",
  "verification/spatial-focus-semantics/",
  "verification/spatial-focus-filter/",
  "verification/spatial-guide-inplace/",
  "verification/spatial-unified-map/",
  "verification/spatial-theme-overview/",
  "verification/grade-progression-overview/",
  "verification/spatial-local-focus/",
  "verification/learning-workspace/",
  "verification/concept-language-pilot/",
  "verification/node-name-review/",
  "verification/language-direction/",
  "verification/p1-navigation/",
  "verification/p2-grade-distribution/",
  "verification/p3-learning-flow/",
  "verification/p7-learning-panel/",
  "verification/learning-node-audit/",
  "verification/three-level-node-progress/",
  "verification/explore-during-learning/",
  "verification/p7-d4/",
  "verification/p7-d5/",
  "verification/p7-d6/",
  "verification/p7-d7/",
  "verification/p8-node-surfaces/",
  "verification/p8-mode-clicks/",
  "verification/p11-focus-hover/",
  "verification/p11-entry-simplification/",
  "verification/p4-learning-reliability/",
  "verification/p5-integration/",
  "verification/continuous-space/",
  "verification/p6b-layout/",
 ]},
 "evidence-core":{commands:[
  {"file":"tests/p9-thinking-feedback-browser.cjs","env":{}},
  {"file":"tests/p9-geometry-thinking-browser.cjs","env":{}},
  {"file":"tests/p9-sequence-thinking-browser.cjs","env":{}},
  {"file":"tests/p9-sequence-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-counterexample-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-fraction-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-unitwalk-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-groupwalk-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-line-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-array-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-thinking-feedback/",
  "verification/p9-geometry-thinking/",
  "verification/p9-sequence-thinking/",
  "verification/p9-sequence-adapter/",
  "verification/p9-counterexample-adapter/",
  "verification/p9-fraction-adapter/",
  "verification/p9-unitwalk-adapter/",
  "verification/p9-groupwalk-adapter/",
  "verification/p9-line-adapter/",
  "verification/p9-array-adapter/",
 ]},
 "evidence-place":{commands:[
  {"file":"tests/p9-place-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-decimal-place-adapter-browser.cjs","env":{}},
  {"file":"tests/b14-division-container-caption-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-place-adapter/",
  "verification/p9-decimal-place-adapter/",
  "verification/b14-division-container-caption/",
 ]},
 "evidence-expansion":{commands:[
  {"file":"tests/p9-mature-expansion-browser.cjs","env":{}},
  {"file":"tests/p9-route-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-fraction-order-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-fraction-operations-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-mature-expansion/",
  "verification/p9-route-adapter/",
  "verification/p9-fraction-order-adapter/",
  "verification/p9-fraction-operations-adapter/",
 ]},
 // PR #146 measured 19m57s for the four existing expansion commands.
 // Keep every invocation and artifact; give the next construction families
 // a separate runner instead of extending that serial path toward its limit.
 "evidence-expansion-2":{commands:[
  {"file":"tests/p9-groups-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-transform-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-angle-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-groups-adapter/",
  "verification/p9-transform-adapter/",
  "verification/p9-angle-adapter/",
 ]},
 // Main run 43601980060 measured 1593793 ms for the four expansion commands.
 // Keep groups/transform/angle together; quantity families get a full runner.
 // The approved capacity split preserves every command, artifact and limit.
 "evidence-quantity":{commands:[
  {"file":"tests/p9-joinstory-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-estimate-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-portiongroups-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-joinstory-adapter/",
  "verification/p9-estimate-adapter/",
  "verification/p9-portiongroups-adapter/",
 ]},
 // PR #158 measured 821071ms for the three older expansion commands.
 // Keep the 188 fraction-case viewport instances on their own runner; every
 // upstream command, artifact, and the 35-minute limit remain unchanged.
 "evidence-fractioncase":{commands:[
  {"file":"tests/p9-fractioncase-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-fractioncase-adapter/",
 ]},
 "p10":{commands:[
  {"file":"tests/p9-numeric-compat-browser.cjs","env":{}},
  {"file":"tests/p10-learning-continuity-browser.cjs","env":{}},
  {"file":"tests/p10-longterm-offline-browser.cjs","env":{}},
  {"file":"tests/p10-sw-nav-isolation-browser.cjs","env":{}},
  {"file":"tests/p10-release-upgrade-repeat.cjs","env":{}},
  {"file":"tests/p10-backup-safety-browser.cjs","env":{}},
  {"file":"tests/p10-full-lessons-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p10-learning-continuity/",
  "verification/p9-numeric-compat/",
  "verification/p10-longterm-round2/",
  "verification/p10-release-upgrade/",
 ]},
 "p8-performance":{commands:[
  {"file":"tests/p8-trail-performance-browser.cjs","env":{"MATH_P8_BASELINE":"1"}},
  {"file":"tests/p8-trail-performance-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p8-trail-performance/",
 ]},
};
for(const group of Object.values(groups)){
 for(const command of group.commands){Object.freeze(command.env);Object.freeze(command);}
 Object.freeze(group.commands);Object.freeze(group.artifacts);Object.freeze(group);
}
export const BROWSER_GROUPS=Object.freeze(groups);
export const GROUP_NAMES=Object.freeze(Object.keys(BROWSER_GROUPS));
const schema='math-required-browser-group/1';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const check=(condition,message)=>{if(!condition)throw Error(message);};
const groupFor=name=>{
 check(typeof name==='string'&&Object.hasOwn(BROWSER_GROUPS,name),'Unknown browser group: '+String(name));
 return BROWSER_GROUPS[name];
};
const validEvent=event=>check(['pull_request','push','workflow_dispatch'].includes(event),'Unknown workflow event');

export function validateScope(value,event){
 validEvent(event);
 check(value==='true'||value==='false','Missing or invalid browser scope');
 check(event==='pull_request'||value==='true','Main pushes and manual runs require every browser group');
 return value==='true';
}

export function browserScope(event,changedFiles=[]){
 validEvent(event);
 if(event!=='pull_request')return 'true';
 check(Array.isArray(changedFiles)&&changedFiles.every(file=>typeof file==='string'),'Invalid changed-file list');
 const scripts=new Set(Object.values(BROWSER_GROUPS).flatMap(group=>group.commands.map(command=>command.file)));
 // Future source-review-only edits still need the complete browser/P10 gate,
 // even when no runtime, browser script or workflow file changes with them.
 const sourceReview=new Set(['scripts/audit-evidence-expansion.mjs',
  'tests/evidence-expansion-audit.test.mjs','docs/spatial-learning/evidence-review-manifest.json']);
 // Preserve the existing source/document scope and include the actual browser
 // inventory and its scheduler, so a test-only edit cannot omit its own run.
 const relevant=/^(dist\/|tests\/(spatial-(overview|focus|guide|relationship|theme|local).*|grade-progression-overview-browser.*|learning-workspace.*|concept-visual.*|node-name.*|relationship-wording.*)|docs\/spatial-learning\/INTERACTION-RULES\.md$|docs\/language\/|scripts\/(audit-learning-nodes|audit-learning-task-rules|required-browser-checks)\.mjs$|tests\/(learning-node-audit\.test\.mjs|learning-task-rules\.test\.mjs|learning-node-runtime-browser\.cjs|required-browser-checks\.test\.mjs)$|\.github\/workflows\/(pull-request-baseline|overview-readability-check)\.yml$)/;
 return changedFiles.some(file=>scripts.has(file)||sourceReview.has(file)||relevant.test(file))?'true':'false';
}

function validateContext(context){
 check(object(context),'Missing workflow identity');validEvent(context.event);
 check(typeof context.sha==='string'&&/^[a-f0-9]{40}$/.test(context.sha),'Missing or invalid checkout SHA');
 check(typeof context.runId==='string'&&/^[1-9]\d*$/.test(context.runId),'Missing or invalid workflow run ID');
 check(Number.isSafeInteger(context.attempt)&&context.attempt>=1,'Missing or invalid workflow attempt');
}

export function commandEnvironment(environment,command){
 const result={...environment};
 delete result.MATH_P8_BASELINE;delete result.MATH_CONCEPT_BROWSER_SCOPE;
 return {...result,...command.env};
}

export function runBrowserGroup({group,scope,context,execute,log=()=>{}}){
 validateContext(context);
 const required=validateScope(scope,context.event),definition=groupFor(group);
 check(typeof execute==='function','Missing browser command executor');
 const report={schema,group,...context,required,status:required?'success':'not-required',commands:[]};
 if(!required)return report;
 for(const command of definition.commands){
  const started=Date.now();let result;
  log('::group::'+command.file+(command.env.MATH_P8_BASELINE==='1'?' (baseline)':''));
  try{result=execute(command)||{};}catch(error){result={status:null,signal:null,error};}
  const exitCode=Number.isInteger(result.status)?result.status:null;
  const signal=result.signal===undefined||result.signal===null?null:String(result.signal);
  const error=result.error?String(result.error).slice(0,2000):null;
  const outcome=exitCode===0&&signal===null&&error===null?'success':'failure';
  report.commands.push({...command,outcome,exitCode,signal,error,elapsedMs:Date.now()-started});
  if(outcome!=='success')report.status='failure';
  log('::endgroup::');
 }
 return report;
}

function validateReport(report,context,required){
 check(object(report)&&report.schema===schema,'Missing or unknown browser report schema');
 const definition=groupFor(report.group);
 check(report.sha===context.sha&&report.runId===context.runId&&report.event===context.event,
  'Browser report belongs to a different checkout or workflow run');
 check(Number.isSafeInteger(report.attempt)&&report.attempt>=1&&report.attempt<=context.attempt,
  'Invalid or future browser report attempt');
 check(report.required===required,'Browser report has a different required scope');
 check(Array.isArray(report.commands),'Missing browser command results');
 if(!required){
  check(report.status==='not-required'&&report.commands.length===0,'Invalid explicit not-required browser result');
  return;
 }
 check(report.commands.length===definition.commands.length,'Missing or extra browser command result');
 for(const [index,command] of report.commands.entries()){
  const expected=definition.commands[index];
  check(object(command)&&command.file===expected.file&&same(command.env,expected.env),
   'Browser command inventory or environment changed');
  check(command.exitCode===null||Number.isInteger(command.exitCode)&&command.exitCode>=0&&command.exitCode<=255,
   'Missing or invalid browser exit code');
  check(command.signal===null||typeof command.signal==='string'&&command.signal.length>0,
   'Missing or invalid browser signal');
  check(command.error===null||typeof command.error==='string'&&command.error.length>0,
   'Missing or invalid browser execution error');
  check(Number.isFinite(command.elapsedMs)&&command.elapsedMs>=0,'Missing or invalid browser duration');
  const expectedOutcome=command.exitCode===0&&command.signal===null&&command.error===null?'success':'failure';
  check(command.outcome===expectedOutcome,'Missing, unknown or inconsistent browser command outcome');
 }
 const expectedStatus=report.commands.every(command=>command.outcome==='success')?'success':'failure';
 check(report.status===expectedStatus,'Missing, unknown or inconsistent browser group outcome');
}

export function validateRequiredGate({needs,reports,context}){
 validateContext(context);
 check(object(needs)&&same(Object.keys(needs).sort(),['browser','static-checks']),
  'Missing or unexpected required job');
 for(const name of ['static-checks','browser'])
  check(needs[name]?.result==='success',name+' must finish with success; got '+String(needs[name]?.result));
 const required=validateScope(needs['static-checks'].outputs?.run_browser,context.event);
 check(Array.isArray(reports),'Missing browser group reports');
 const newest=new Map(),attempts=new Set();
 for(const report of reports){
  validateReport(report,context,required);
  const key=report.group+':'+report.attempt;
  check(!attempts.has(key),'Duplicate browser group attempt');attempts.add(key);
  if(!newest.has(report.group)||newest.get(report.group).attempt<report.attempt)newest.set(report.group,report);
 }
 check(newest.size===GROUP_NAMES.length&&GROUP_NAMES.every(group=>newest.has(group)),
  'Every declared browser group needs its own result');
 for(const [group,report] of newest)
  check(report.status===(required?'success':'not-required'),group+' did not complete the required work');
 // Rerun-failed-jobs may reuse successful members from an earlier attempt of
 // this same run and exact SHA. A newer failure always supersedes older success.
 return {sha:context.sha,runId:context.runId,required,groups:GROUP_NAMES,
  invocations:required?[...newest.values()].reduce((sum,report)=>sum+report.commands.length,0):0};
}

function workflowContext(){
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 check(process.env.GITHUB_SHA===sha,'Checkout does not match the triggering SHA');
 const attempt=process.env.GITHUB_RUN_ATTEMPT;
 check(typeof attempt==='string'&&/^[1-9]\d*$/.test(attempt),'Missing or invalid workflow attempt');
 const context={sha,event:process.env.GITHUB_EVENT_NAME,runId:process.env.GITHUB_RUN_ID,attempt:Number(attempt)};
 validateContext(context);return context;
}

function output(value){
 check(process.env.GITHUB_OUTPUT,'Missing workflow output destination');
 appendFileSync(process.env.GITHUB_OUTPUT,value);
}

function main(){
 const [operation,group]=process.argv.slice(2);
 if(operation==='scope'){
  const event=process.env.GITHUB_EVENT_NAME;validEvent(event);let files=[];
  if(event==='pull_request'){
   check(process.env.GITHUB_BASE_REF,'Missing pull-request base ref');
   files=execFileSync('git',['diff','--name-only','origin/'+process.env.GITHUB_BASE_REF+'...HEAD'],
    {cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
  }
  const scope=browserScope(event,files);output('run_browser='+scope+'\n');
  console.log('Browser regression required: '+scope);return;
 }
 const context=workflowContext();
 if(operation==='prepare'){
  validateScope(process.env.MATH_BROWSER_REQUIRED,context.event);
  const definition=groupFor(group);
  output('artifact_paths<<MATH_BROWSER_ARTIFACT_PATHS\n'+definition.artifacts.join('\n')+'\nMATH_BROWSER_ARTIFACT_PATHS\n');
  return;
 }
 if(operation==='run'){
  const report=runBrowserGroup({group,scope:process.env.MATH_BROWSER_REQUIRED,context,log:console.log,
   execute:command=>{
    check(existsSync(resolve(root,command.file)),'Required browser script is missing: '+command.file);
    return spawnSync(process.execPath,[command.file],{cwd:root,stdio:'inherit',
     env:commandEnvironment(process.env,command)});
   }});
  const destination=resolve(root,'verification/required-browser-groups');mkdirSync(destination,{recursive:true});
  writeFileSync(resolve(destination,group+'-attempt-'+context.attempt+'.json'),JSON.stringify(report,null,2)+'\n');
  console.log('REQUIRED_BROWSER_GROUP '+JSON.stringify({group,status:report.status,invocations:report.commands.length}));
  if(report.status==='failure')process.exitCode=1;return;
 }
 if(operation==='gate'){
  const needs=JSON.parse(process.env.MATH_REQUIRED_NEEDS||'null');
  const directory=resolve(root,'verification/required-browser-results');
  const files=existsSync(directory)?readdirSync(directory):[];
  check(files.every(file=>file.endsWith('.json')),'Unexpected browser result artifact');
  const reports=files.map(file=>JSON.parse(readFileSync(resolve(directory,file),'utf8')));
  console.log('REQUIRED_CHECKS_SUCCESS '+JSON.stringify(validateRequiredGate({needs,reports,context})));return;
 }
 throw Error('Unknown required-browser-checks operation');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(error){console.error(error.stack);process.exitCode=1;}
}
