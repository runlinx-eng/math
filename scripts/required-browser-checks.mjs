// One reviewed browser inventory. Groups run on separate runners; commands
// within each group remain sequential and never suppress another result.
// 2026-11-18: retain all 86 reviewed calls in thirteen required groups after P10 capacity split.
// Preserve the P8/Multable split, all artifact paths, P10 and the 35-minute limit.
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
  {"file":"tests/p9-paperlab-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-fraction-operations-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-mixedtrade-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-fracdecompose-adapter-browser.cjs","env":{}},
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
  "verification/p9-paperlab-adapter/",
  "verification/p9-fraction-operations-adapter/",
  "verification/p9-mixedtrade-adapter/",
  "verification/p9-fracdecompose-adapter/",
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
  {"file":"tests/p9-samefraction-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-mixedaxis-adapter-browser.cjs","env":{}},
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
  "verification/p9-samefraction-adapter/",
  "verification/p9-mixedaxis-adapter/",
 ]},
 "evidence-place":{commands:[
  {"file":"tests/p9-place-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-decimal-place-adapter-browser.cjs","env":{}},
  {"file":"tests/b14-division-container-caption-browser.cjs","env":{}},
  {"file":"tests/p9-division-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-decimalengine-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-place-adapter/",
  "verification/p9-decimal-place-adapter/",
  "verification/b14-division-container-caption/",
  "verification/p9-division-adapter/",
  "verification/p9-decimalengine-adapter/",
 ]},
 // Area was the fourth command in the 35-minute expansion group; a main
 // runner timed out before producing its receipt despite three preceding OKs.
 // Split its real browser evidence onto a separate required runner, not a skip.
 "evidence-expansion":{commands:[
  {"file":"tests/p9-mature-expansion-browser.cjs","env":{}},
  {"file":"tests/p9-route-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-fraction-order-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-mature-expansion/",
  "verification/p9-route-adapter/",
  "verification/p9-fraction-order-adapter/",
 ]},
 "evidence-area":{commands:[
  {"file":"tests/p9-area-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-area-adapter/",
 ]},
 // Preserve the existing expansion-2 order and append the single Unit Cover call.
 // The unchanged 35-minute job budget remains the capacity gate for this combined group.
 "evidence-expansion-2":{commands:[
  {"file":"tests/p9-groups-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-transform-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-angle-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-scalechain-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-fracshare-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-unitcover-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-groups-adapter/",
  "verification/p9-transform-adapter/",
  "verification/p9-angle-adapter/",
  "verification/p9-scalechain-adapter/",
  "verification/p9-fracshare-adapter/",
  "verification/p9-unitcover-adapter/",
 ]},
 // Main run 43601980060 measured 1593793 ms for the four expansion commands.
 // Keep groups/transform/angle together; quantity families get a full runner.
 // The approved capacity split preserves every command, artifact and limit.
 "evidence-quantity":{commands:[
  {"file":"tests/p9-joinstory-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-estimate-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-portiongroups-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-storyledger-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-joinstory-adapter/",
  "verification/p9-estimate-adapter/",
  "verification/p9-portiongroups-adapter/",
  "verification/p9-storyledger-adapter/",
 ]},
 // PR #158 measured 821071ms for the three older expansion commands.
 // Keep the 188 fraction-case viewport instances on their own runner; every
 // upstream command, artifact, and the 35-minute limit remain unchanged.
 "evidence-fractioncase":{commands:[
  {"file":"tests/p9-fdpboard-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-fractioncase-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-cubefraction-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-fractioncase-adapter/",
  "verification/p9-fdpboard-adapter/",
  "verification/p9-cubefraction-adapter/",
 ]},
 // #239: keep all eight original P10/quantity calls, but split the >35-minute runner.
 "p10-learning":{commands:[
  {"file":"tests/p9-numeric-compat-browser.cjs","env":{}},
  {"file":"tests/p10-learning-continuity-browser.cjs","env":{}},
  {"file":"tests/p10-backup-safety-browser.cjs","env":{}},
  {"file":"tests/p10-full-lessons-browser.cjs","env":{}},
  {"file":"tests/p9-time-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-order-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p10-learning-continuity/",
  "verification/p9-numeric-compat/",
  "verification/p10-release-upgrade/backup-safety/",
  "verification/p10-release-upgrade/full-lessons/",
  "verification/p9-time-adapter/",
  "verification/p9-order-adapter/",
 ]},
 // Separate required receipt for the final two original math families.
 "p10-learning-tail":{commands:[
  {"file":"tests/p9-wideshift-adapter-browser.cjs","env":{}},
  {"file":"tests/p9-pvbench-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-wideshift-adapter/",
  "verification/p9-pvbench-adapter/",
 ]},
 // Full offline is mandatory on SW/startup PRs, main pushes and manual runs.
 // Ordinary math PRs leave an explicit, audited not-required group receipt.
 "p10-offline":{commands:[
  {"file":"tests/p10-longterm-offline-browser.cjs","env":{}},
  {"file":"tests/p10-sw-nav-isolation-browser.cjs","env":{}},
  {"file":"tests/p10-release-upgrade-repeat.cjs","env":{}},
 ],artifacts:[
  "verification/p10-longterm-round2/",
  "verification/p10-release-upgrade/",
 ]},
 // #239 CI capacity fix: keep P8 baseline and Money together; isolate Multable in its own required Runner.
 "p8-performance":{commands:[
  {"file":"tests/p8-trail-performance-browser.cjs","env":{"MATH_P8_BASELINE":"1"}},
  {"file":"tests/p8-trail-performance-browser.cjs","env":{}},
  {"file":"tests/p9-money-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p8-trail-performance/",
  "verification/p9-money-adapter/",
 ]},
 "p9-multable":{commands:[
  {"file":"tests/p9-multable-adapter-browser.cjs","env":{}},
 ],artifacts:[
  "verification/p9-multable-adapter/",
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
const groupFor=(name,definitions=BROWSER_GROUPS)=>{
 check(typeof name==='string'&&Object.hasOwn(definitions,name),'Unknown browser group: '+String(name));
 return definitions[name];
};
const validEvent=event=>check(['pull_request','push','workflow_dispatch','schedule'].includes(event),'Unknown workflow event');

export function validateScope(value,event){
 validEvent(event);
 check(value==='true'||value==='false','Missing or invalid browser scope');
 // A manual or scheduled full regression must never silently skip browser groups.
 check(!['workflow_dispatch','schedule'].includes(event)||value==='true','Full regression requires every browser group');
 return value==='true';
}

export function browserScope(event,changedFiles=[]){
 validEvent(event);
 if(['workflow_dispatch','schedule'].includes(event))return 'true';
 check(Array.isArray(changedFiles)&&changedFiles.every(file=>typeof file==='string'),'Invalid changed-file list');
 // Day-to-day PRs and main pushes use a small real-Chromium smoke job instead
 // of the expensive 17-group historical regression. Full runs are manual/weekly.
 return 'false';
}

function legacyBrowserScope(changedFiles=[]){
 const scripts=new Set(Object.values(BROWSER_GROUPS).flatMap(group=>group.commands.map(command=>command.file)));
 // Future source-review-only edits still need the complete browser/P10 gate,
 // even when no runtime, browser script or workflow file changes with them.
 const sourceReview=new Set(['scripts/audit-evidence-expansion.mjs',
  'tests/evidence-expansion-audit.test.mjs','docs/spatial-learning/evidence-review-manifest.json']);
 // Preserve the existing source/document scope and include the actual browser
 // inventory and its scheduler, so a test-only edit cannot omit its own run.
 const relevant=/^(dist\/|tests\/(spatial-(overview|focus|guide|relationship|theme|local).*|grade-progression-overview-browser.*|learning-workspace.*|concept-visual.*|node-name.*|relationship-wording.*)|docs\/spatial-learning\/INTERACTION-RULES\.md$|docs\/language\/|scripts\/((audit-learning-nodes|audit-learning-task-rules|required-browser-checks)\.mjs|server\.py)$|tests\/(learning-node-audit\.test\.mjs|learning-task-rules\.test\.mjs|learning-node-runtime-browser\.cjs|required-browser-checks\.test\.mjs)$|\.github\/workflows\/(pull-request-baseline|overview-readability-check|p9-module-recovery-ci|p9-bootstrap-failure-regression|p9-ordinal90-recovery)\.yml$)/;
 return changedFiles.some(file=>scripts.has(file)||sourceReview.has(file)||relevant.test(file)||OFFLINE_SENSITIVE_FILES.has(file)||OFFLINE_SENSITIVE_TEST.test(file)||
  file==='ci/math-families.json'||file==='ci/live-browser-matrix.json'||file==='scripts/ci-live-browser-matrix.mjs'||
  /^tests\/[a-zA-Z0-9/_-]+-browser\.cjs$/.test(file))?'true':'false';
}

// Keep deep SW/cache browser checks out of unrelated math PRs, but retain
// every math/backup assertion and the complete 69-command main regression.
const OFFLINE_SENSITIVE_FILES=new Set([
 'dist/sw.js','dist/sw-client.js','dist/learn.html',
 'dist/space.js','dist/exploration.js','dist/index.html','dist/v2.html',
 'dist/mac-local.html','dist/local-runtime.js',
 'scripts/server.py','scripts/required-browser-checks.mjs',
 'tests/required-browser-checks.test.mjs',
 '.github/workflows/pull-request-baseline.yml',
 '.github/workflows/p9-module-recovery-ci.yml',
 '.github/workflows/p9-bootstrap-failure-regression.yml',
 '.github/workflows/p9-ordinal90-recovery.yml'
]);
const OFFLINE_SENSITIVE_TEST=/^tests\/(p10-(longterm-offline|sw-nav-isolation|release-upgrade|sw-retirement)|p9-(offline-|module-recovery|bootstrap-failure|ordinal90-|mac-local-))/;
export function offlineScope(event,changedFiles=[],browserRequired=browserScope(event,changedFiles)){
 validEvent(event);
 if(['workflow_dispatch','schedule'].includes(event))return 'true';
 check(Array.isArray(changedFiles)&&changedFiles.every(file=>typeof file==='string'),'Invalid changed-file list');
 check(browserRequired==='true'||browserRequired==='false','Missing or invalid browser scope');
 return 'false';
}

function legacyOfflineScope(changedFiles=[],browserRequired='true'){
 const required=changedFiles.some(file=>OFFLINE_SENSITIVE_FILES.has(file)||OFFLINE_SENSITIVE_TEST.test(file));
 check(!required||browserRequired==='true','Offline-sensitive changes must also run browser regressions');
 return required?'true':'false';
}
function validateScopes(outputs,event){
 check(object(outputs),'Missing browser/offline scope outputs');
 const browser=validateScope(outputs.run_browser,event);
 const offline=validateScope(outputs.run_offline,event);
 check(!offline||browser,'Deep offline scope requires browser regression');
 return {browser,offline};
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

export function runBrowserGroup({group,scope,context,execute,log=()=>{},definitions=BROWSER_GROUPS}){
 validateContext(context);
 const required=validateScope(scope,context.event),definition=groupFor(group,definitions);
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

function validateReport(report,context,required,definitions=BROWSER_GROUPS){
 check(object(report)&&report.schema===schema,'Missing or unknown browser report schema');
 const definition=groupFor(report.group,definitions);
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

export function validateRequiredGate({needs,reports,context,definitions=BROWSER_GROUPS}){
 validateContext(context);
 check(object(needs)&&same(Object.keys(needs).sort(),['browser','smoke-checks','static-checks']),
  'Missing or unexpected required job');
 for(const name of ['static-checks','browser','smoke-checks'])
  check(needs[name]?.result==='success',name+' must finish with success; got '+String(needs[name]?.result));
 const {browser:required,offline:offlineRequired}=validateScopes(needs['static-checks'].outputs,context.event);
 const expectedNames=Object.keys(definitions);
 const rawMatrix=needs['static-checks'].outputs?.browser_matrix;
 check(typeof rawMatrix==='string'&&rawMatrix.length>0,'Missing GitHub dynamic browser matrix output');
 let matrix;
 try{matrix=JSON.parse(rawMatrix);}catch(error){throw Error('Invalid GitHub browser matrix JSON: '+error.message);}
 check(same(matrix,{group:expectedNames}),
  'GitHub matrix output does not match the exact registered and legacy required groups');
 check(expectedNames.length>=GROUP_NAMES.length&&GROUP_NAMES.every((name,index)=>expectedNames[index]===name),
  'The original thirteen required browser groups must remain the ordered prefix');
 check(Array.isArray(reports),'Missing browser group reports');
 const newest=new Map(),attempts=new Set();
 for(const report of reports){
  validateReport(report,context,report.group==='p10-offline'?offlineRequired:required,definitions);
  const key=report.group+':'+report.attempt;
  check(!attempts.has(key),'Duplicate browser group attempt');attempts.add(key);
  if(!newest.has(report.group)||newest.get(report.group).attempt<report.attempt)newest.set(report.group,report);
 }
 check(newest.size===expectedNames.length&&expectedNames.every(group=>newest.has(group)),
  'Every declared browser group needs its own result');
 for(const [group,report] of newest)
  check(report.status===((group==='p10-offline'?offlineRequired:required)?'success':'not-required'),group+' did not complete the required work');
 // Rerun-failed-jobs may reuse successful members from an earlier attempt of
 // this same run and exact SHA. A newer failure always supersedes older success.
 return {sha:context.sha,runId:context.runId,required,offlineRequired,groups:expectedNames,
  invocations:[...newest.values()].reduce((sum,report)=>sum+report.commands.length,0)};
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

async function main(){
 const [operation,group]=process.argv.slice(2);
 if(operation==='scope'){
  const event=process.env.GITHUB_EVENT_NAME;validEvent(event);let files=[];
  if(event==='pull_request'){
   check(process.env.GITHUB_BASE_REF,'Missing pull-request base ref');
   files=execFileSync('git',['diff','--name-only','origin/'+process.env.GITHUB_BASE_REF+'...HEAD'],
    {cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
  }
  const scope=browserScope(event,files),offline=offlineScope(event,files,scope);
  output('run_browser='+scope+'\nrun_offline='+offline+'\n');
  console.log('Browser regression required: '+scope+'; deep offline required: '+offline);return;
 }
 // The same reviewed registry and deterministic plan are used for the live
 // matrix, each runner's work and the final exact-group fail-closed gate.
 const {buildLiveBrowserMatrix}=await import('./ci-live-browser-matrix.mjs');
 const definitions=buildLiveBrowserMatrix().definitions;
 const context=workflowContext();
 if(operation==='prepare'){
  validateScope(process.env.MATH_BROWSER_REQUIRED,context.event);
  const definition=groupFor(group,definitions);
  output('artifact_paths<<MATH_BROWSER_ARTIFACT_PATHS\n'+definition.artifacts.join('\n')+'\nMATH_BROWSER_ARTIFACT_PATHS\n');
  return;
 }
 if(operation==='run'){
  const report=runBrowserGroup({group,scope:process.env.MATH_BROWSER_REQUIRED,context,log:console.log,
   definitions,execute:command=>{
    check(existsSync(resolve(root,command.file)),'Required browser script is missing: '+command.file);
    return spawnSync(process.execPath,[command.file],{cwd:root,stdio:'inherit',
     env:commandEnvironment(process.env,command)});
   }});
  // First-party additional modules must produce original results and screenshots
  // on the executing runner, before uploads can be green. This is stricter
  // than if-no-files-found because that only checks at least one path exists.
  if(definitions[group].newFamily&&report.status==='success'){
   for(const module of definitions[group].modules){
    for(const dir of module.artifacts){
     const base=resolve(root,dir);
     check(existsSync(base),'Missing newly registered evidence path: '+dir);
     const results=resolve(base,'results.json');
     check(existsSync(results),'Missing new family math results JSON: '+results);
     const item=JSON.parse(readFileSync(results,'utf8'));
     check(Array.isArray(item.errors)&&item.errors.length===0,
      'New family has missing or nonempty mathematical errors: '+dir);
     check(Array.isArray(item.checks)&&item.checks.length>0||
      Number.isInteger(item.checks)&&item.checks>0,'New family has no mathematical assertions: '+dir);
     check(Array.isArray(item.proofContracts)&&module.proofContracts.every(x=>item.proofContracts.includes(x)),
      'Missing actual math/correction/persistence proof contract: '+dir);
     check(item.provenance?.testedCheckoutSha===context.sha&&
      String(item.provenance?.runId)===context.runId&&
      Number(item.provenance?.runAttempt)===context.attempt,
      'New family evidence provenance does not match checkout/run/attempt: '+dir);
     check(readdirSync(base).some(f=>f.toLowerCase().endsWith('.png')),
      'New family original Chromium screenshot missing: '+dir);
    }
   }
  }
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
  console.log('REQUIRED_CHECKS_SUCCESS '+JSON.stringify(validateRequiredGate({needs,reports,context,definitions})));return;
 }
 throw Error('Unknown required-browser-checks operation');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 main().catch(error=>{console.error(error.stack);process.exitCode=1;});
}
