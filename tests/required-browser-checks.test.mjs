import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {BROWSER_GROUPS,GROUP_NAMES,browserScope,validateScope,commandEnvironment,
 runBrowserGroup,validateRequiredGate} from '../scripts/required-browser-checks.mjs';

// Independently captured from aaca75b's 48-loop-plus-two-P10 gate. Changes to
// this reviewed inventory need an explicit test update, not automatic discovery.
const originalScripts=`
tests/learning-node-runtime-browser.cjs
tests/three-level-node-progress-browser.cjs
tests/explore-during-learning-browser.cjs
tests/spatial-theme-overview-browser.cjs
tests/p11-focus-hover-browser.cjs
tests/p11-entry-simplification-browser.cjs
tests/p7-d5-entry-browser.cjs
tests/p7-d6-fixed-ui-browser.cjs
tests/p7-d7-multi-type-browser.cjs
tests/p9-thinking-feedback-browser.cjs
tests/p9-geometry-thinking-browser.cjs
tests/p9-sequence-thinking-browser.cjs
tests/p9-sequence-adapter-browser.cjs
tests/p9-counterexample-adapter-browser.cjs
tests/p9-fraction-adapter-browser.cjs
tests/p9-place-adapter-browser.cjs
tests/p9-unitwalk-adapter-browser.cjs
tests/p9-line-adapter-browser.cjs
tests/p9-array-adapter-browser.cjs
tests/p10-learning-continuity-browser.cjs
tests/p10-longterm-offline-browser.cjs
tests/p10-sw-nav-isolation-browser.cjs
tests/p10-release-upgrade-repeat.cjs
tests/p8-node-surface-browser.cjs
tests/p8-trail-performance-browser.cjs
tests/p8-mode-real-click-browser.cjs
tests/p8-b39-lazy-browser.cjs
tests/p1-navigation-browser.cjs
tests/p2-grade-distribution-browser.cjs
tests/p3-learning-flow-browser.cjs
tests/p7-learning-panel-browser.cjs
tests/p7-d4-multi-type-browser.cjs
tests/p4-learning-reliability-browser.cjs
tests/p5-integration-browser.cjs
tests/continuous-space-browser.cjs
tests/p6b-layout-browser.cjs
tests/spatial-overview-browser.cjs
tests/spatial-focus-transition-browser.cjs
tests/spatial-focus-semantics-browser.cjs
tests/spatial-focus-filter-browser.cjs
tests/spatial-guide-inplace-browser.cjs
tests/spatial-unified-map-browser.cjs
tests/grade-progression-overview-browser.cjs
tests/spatial-local-focus-browser.cjs
tests/learning-workspace-browser.cjs
tests/concept-visual-browser.cjs
tests/node-name-browser.cjs
tests/relationship-wording-browser.cjs
tests/p10-backup-safety-browser.cjs
tests/p10-full-lessons-browser.cjs
`.trim().split('\n');
// Explicit reviewed additions; product discovery cannot update this list.
const addedScripts=['tests/p9-division-adapter-browser.cjs','tests/p9-angle-adapter-browser.cjs','tests/p9-numeric-compat-browser.cjs','tests/p9-transform-adapter-browser.cjs','tests/p9-groups-adapter-browser.cjs','tests/p9-fraction-order-adapter-browser.cjs','tests/p9-route-adapter-browser.cjs','tests/p9-mature-expansion-browser.cjs','tests/p9-groupwalk-adapter-browser.cjs',
 'tests/p9-decimal-place-adapter-browser.cjs'];
const reviewedScripts=[...originalScripts,...addedScripts];
const context={event:'pull_request',sha:'a'.repeat(40),runId:'123456789',attempt:2};
const needs=(scope='true')=>({'static-checks':{result:'success',outputs:{run_browser:scope}},browser:{result:'success',outputs:{}}});
const fixture=(scope='true',identity=context)=>GROUP_NAMES.map(group=>runBrowserGroup({group,scope,
 context:identity,execute:()=>({status:0,signal:null})}));
const success=()=>({needs:needs(),reports:fixture(),context});
const rejected=value=>assert.throws(()=>validateRequiredGate(value));

test('all fifty existing scripts and the reviewed expansion remain, with only the P8 baseline repeated',()=>{
 assert.equal(originalScripts.length,50);assert.equal(new Set(originalScripts).size,50);
 assert.deepEqual(GROUP_NAMES,['ui','evidence-core','evidence-place','evidence-expansion','evidence-expansion-2','p10','p8-performance']);
 const commands=Object.values(BROWSER_GROUPS).flatMap(group=>group.commands);
 assert.equal(commands.length,61);
 assert.deepEqual([...new Set(commands.map(command=>command.file))].sort(),[...reviewedScripts].sort());
 const repeated=commands.filter((command,index)=>commands.findIndex(other=>other.file===command.file)!==index);
 assert.deepEqual(repeated.map(command=>command.file),['tests/p8-trail-performance-browser.cjs']);
 assert.deepEqual(Object.values(BROWSER_GROUPS).map(group=>group.commands.length),[33,10,3,3,3,7,2]);
 assert.deepEqual(BROWSER_GROUPS['evidence-expansion'].commands,[{file:'tests/p9-mature-expansion-browser.cjs',env:{}},{file:'tests/p9-route-adapter-browser.cjs',env:{}},{file:'tests/p9-fraction-order-adapter-browser.cjs',env:{}}]);
 assert.deepEqual(BROWSER_GROUPS['evidence-expansion-2'].commands,[{file:'tests/p9-groups-adapter-browser.cjs',env:{}},{file:'tests/p9-transform-adapter-browser.cjs',env:{}},{file:'tests/p9-angle-adapter-browser.cjs',env:{}}]);
 assert.ok(BROWSER_GROUPS['evidence-core'].commands.some(command=>command.file==='tests/p9-groupwalk-adapter-browser.cjs'));
 assert.deepEqual(BROWSER_GROUPS['evidence-place'].commands,[{file:'tests/p9-place-adapter-browser.cjs',env:{}},
  {file:'tests/p9-decimal-place-adapter-browser.cjs',env:{}},{file:'tests/p9-division-adapter-browser.cjs',env:{}}]);
 for(const command of commands)assert.ok(existsSync(new URL('../'+command.file,import.meta.url)),command.file);
 for(const group of Object.values(BROWSER_GROUPS)){
  assert.ok(group.artifacts.length>0);assert.ok(Object.isFrozen(group.commands));
  assert.ok(group.artifacts.every(path=>path.startsWith('verification/')));
 }
});

test('P8 baseline and normal run share an isolated group without environment leakage',()=>{
 const commands=BROWSER_GROUPS['p8-performance'].commands;
 assert.deepEqual(commands,[
  {file:'tests/p8-trail-performance-browser.cjs',env:{MATH_P8_BASELINE:'1'}},
  {file:'tests/p8-trail-performance-browser.cjs',env:{}}
 ]);
 const inherited={PATH:'/usr/bin',MATH_P8_BASELINE:'stale',MATH_CONCEPT_BROWSER_SCOPE:'stale'};
 assert.deepEqual(commandEnvironment(inherited,commands[0]),{PATH:'/usr/bin',MATH_P8_BASELINE:'1'});
 assert.deepEqual(commandEnvironment(inherited,commands[1]),{PATH:'/usr/bin'});
 const concept=BROWSER_GROUPS.ui.commands.find(command=>command.file==='tests/concept-visual-browser.cjs');
 assert.deepEqual(commandEnvironment(inherited,concept),{PATH:'/usr/bin',MATH_CONCEPT_BROWSER_SCOPE:'smoke'});
 assert.equal(inherited.MATH_P8_BASELINE,'stale','the parent environment is not mutated');
});

test('all P10 commands and the original upgrade repetition wrapper remain sequential after a failure',()=>{
 const expected=['p9-numeric-compat-browser','p10-learning-continuity-browser','p10-longterm-offline-browser','p10-sw-nav-isolation-browser',
  'p10-release-upgrade-repeat','p10-backup-safety-browser','p10-full-lessons-browser'].map(name=>'tests/'+name+'.cjs');
 assert.deepEqual(BROWSER_GROUPS.p10.commands.map(command=>command.file),expected);
 const visited=[];
 const report=runBrowserGroup({group:'p10',scope:'true',context,execute:command=>{
  visited.push(command.file);return {status:visited.length===1?1:0,signal:null};
 }});
 assert.deepEqual(visited,expected);assert.equal(report.status,'failure');
 assert.equal(report.commands[0].outcome,'failure');
 assert.ok(report.commands.slice(1).every(command=>command.outcome==='success'));
 const gate=success();gate.reports[gate.reports.findIndex(item=>item.group==='p10')]=report;rejected(gate);
});

test('each runner failure mode is recorded and cannot cancel the other commands in its group',()=>{
 for(const first of [{status:1,signal:null},{status:null,signal:'SIGTERM'},
  {status:0,signal:'SIGTERM'},{status:0,error:Error('spawn failed')},{},null]){
  let calls=0;
  const report=runBrowserGroup({group:'p10',scope:'true',context,
   execute:()=>calls++===0?first:{status:0,signal:null}});
  assert.equal(calls,7);assert.equal(report.status,'failure');
  assert.equal(report.commands[0].outcome,'failure');
  const gate=success();gate.reports[gate.reports.findIndex(item=>item.group==='p10')]=report;rejected(gate);
 }
 let calls=0;
 const thrown=runBrowserGroup({group:'p10',scope:'true',context,execute:()=>{
  if(calls++===0)throw Error('required script missing');return {status:0};
 }});
 assert.equal(calls,7);assert.equal(thrown.status,'failure');assert.match(thrown.commands[0].error,/missing/);
});

test('main and manual scope always require all groups; PR scope includes the inventory and scheduler',()=>{
 for(const event of ['push','workflow_dispatch']){
  assert.equal(browserScope(event,[]),'true');assert.equal(validateScope('true',event),true);
  assert.throws(()=>validateScope('false',event));
 }
 assert.equal(browserScope('pull_request',['README.md']),'false');
 assert.equal(browserScope('pull_request',[]),'false');
 for(const file of [...reviewedScripts,'dist/learning/place-evidence.js','scripts/required-browser-checks.mjs',
  'tests/required-browser-checks.test.mjs','.github/workflows/pull-request-baseline.yml',
  '.github/workflows/overview-readability-check.yml','docs/spatial-learning/INTERACTION-RULES.md',
  'docs/language/TERMS.md','scripts/audit-learning-nodes.mjs','tests/learning-task-rules.test.mjs',
  'scripts/audit-evidence-expansion.mjs','tests/evidence-expansion-audit.test.mjs',
  'docs/spatial-learning/evidence-review-manifest.json'])
  assert.equal(browserScope('pull_request',[file]),'true',file);
 for(const file of ['scripts/audit-evidence-expansion.mjs.bak','docs/spatial-learning/evidence-review-manifest.json.bak'])
  assert.equal(browserScope('pull_request',[file]),'false',file);
 for(const value of [undefined,null,'',true,false,'TRUE','unknown'])assert.throws(()=>validateScope(value,'pull_request'));
 for(const event of ['',undefined,'pull_request_target','schedule'])assert.throws(()=>browserScope(event,[]));
 assert.throws(()=>browserScope('pull_request',null));
});

test('a complete current result needs all seven groups and the complete current invocation inventory',()=>{
 const before=success(),copy=structuredClone(before);
 assert.deepEqual(validateRequiredGate(before),{sha:context.sha,runId:context.runId,required:true,
  groups:GROUP_NAMES,invocations:61});
 assert.deepEqual(before,copy,'gate reads results without modifying evidence');
 for(const event of ['push','workflow_dispatch']){
  const identity={...context,event};
  assert.equal(validateRequiredGate({needs:needs(),reports:fixture('true',identity),context:identity}).invocations,61);
 }
});

for(const job of ['static-checks','browser'])test(job+' failure, cancellation, skip and unknown or missing status fail closed',()=>{
 for(const status of ['failure','cancelled','skipped','neutral','timed_out','unknown','',null,undefined]){
  const value=success();value.needs[job].result=status;rejected(value);
 }
 const missing=success();delete missing.needs[job].result;rejected(missing);
 const absent=success();delete absent.needs[job];rejected(absent);
});

test('missing or unknown scope and unexpected required jobs cannot produce a green gate',()=>{
 for(const scope of [undefined,null,'',true,false,'unknown']){
  const value=success();value.needs['static-checks'].outputs.run_browser=scope;rejected(value);
 }
 const missing=success();delete missing.needs['static-checks'].outputs;rejected(missing);
 for(const value of [null,[],{},false])rejected({...success(),needs:value});
 const extra=success();extra.needs.other={result:'success'};rejected(extra);
 for(const event of ['push','workflow_dispatch']){
  const value=success();value.context={...context,event};value.needs=needs('false');rejected(value);
 }
});

test('only explicit unrelated-PR scope may produce complete not-required group results',()=>{
 let calls=0;
 const reports=GROUP_NAMES.map(group=>runBrowserGroup({group,scope:'false',context,execute:()=>{calls++;return {status:0};}}));
 assert.equal(calls,0);
 assert.equal(validateRequiredGate({needs:needs('false'),reports,context}).required,false);
 assert.equal(validateRequiredGate({needs:needs('false'),reports,context}).invocations,0);
 const partial=structuredClone(reports);partial.pop();rejected({needs:needs('false'),reports:partial,context});
 const implicit=structuredClone(reports);delete implicit[0].status;rejected({needs:needs('false'),reports:implicit,context});
 const skipped=structuredClone(reports);skipped[0].status='skipped';rejected({needs:needs('false'),reports:skipped,context});
 const invented=structuredClone(reports);invented[0].commands=fixture()[0].commands;
 rejected({needs:needs('false'),reports:invented,context});
 rejected({needs:needs(),reports,context});
});

test('group receipts cannot omit, invent, duplicate or borrow another source identity',()=>{
 for(const group of GROUP_NAMES){
  const value=success();value.reports=value.reports.filter(report=>report.group!==group);rejected(value);
 }
 for(const change of [
  value=>value.reports.pop(),value=>value.reports.push(structuredClone(value.reports[0])),
  value=>{value.reports[0].group='unreviewed';},value=>{value.reports[0].sha='b'.repeat(40);},
  value=>{value.reports[0].runId='999';},value=>{value.reports[0].event='push';},
  value=>{value.reports[0].attempt=3;},value=>{value.reports[0].attempt=0;},
  value=>{value.reports[0].required=false;},value=>{delete value.reports[0].schema;},
  value=>{value.reports[0].status='skipped';},value=>{value.reports[0].status='cancelled';},
  value=>{value.reports[0].status='unknown';},value=>{delete value.reports[0].status;},
  value=>{value.reports[0]=null;}
 ]){const value=success();change(value);rejected(value);}
 for(const reports of [null,{},[],undefined])rejected({...success(),reports});
 assert.throws(()=>runBrowserGroup({group:'unreviewed',scope:'true',context,execute:()=>({status:0})}));
});

test('a successful job flag cannot hide missing commands, changed environments or unsuccessful command results',()=>{
 for(const change of [
  report=>report.commands.pop(),report=>report.commands.push(structuredClone(report.commands[0])),
  report=>report.commands.reverse(),report=>{report.commands[0].file='tests/other.cjs';},
  report=>{report.commands[0].env={UNREVIEWED:'1'};},report=>{delete report.commands;},
  report=>{report.commands[0].outcome='skipped';},report=>{report.commands[0].outcome='cancelled';},
  report=>{report.commands[0].outcome='unknown';},report=>{delete report.commands[0].outcome;},
  report=>{report.commands[0].exitCode=1;},report=>{delete report.commands[0].exitCode;},
  report=>{report.commands[0].signal='SIGTERM';},report=>{delete report.commands[0].signal;},
  report=>{report.commands[0].error='failed';},report=>{delete report.commands[0].error;},
  report=>{report.commands[0].elapsedMs=-1;},report=>{report.commands[0].elapsedMs=NaN;}
 ]){const value=success();change(value.reports[0]);rejected(value);}
 const p8=success();p8.reports.find(report=>report.group==='p8-performance').commands.shift();rejected(p8);
 const wrongMode=success();wrongMode.reports.find(report=>report.group==='p8-performance').commands[0].env={};rejected(wrongMode);
});

test('same-run retries choose the newest result per group and require missing earlier successes to be available',()=>{
 const previous={...context,attempt:1},reports=fixture('true',previous);
 const retry=runBrowserGroup({group:'evidence-place',scope:'true',context,execute:()=>({status:0})});
 assert.equal(validateRequiredGate({needs:needs(),reports:[...reports,retry],context}).invocations,61);
 const failed=runBrowserGroup({group:'evidence-place',scope:'true',context,execute:()=>({status:1})});
 rejected({needs:needs(),reports:[...reports,failed],context});
 const oldFailure=runBrowserGroup({group:'evidence-place',scope:'true',context:previous,execute:()=>({status:1})});
 assert.equal(validateRequiredGate({needs:needs(),reports:[...reports.filter(report=>report.group!=='evidence-place'),oldFailure,retry],context}).invocations,61);
 rejected({needs:needs(),reports:[retry],context});
 rejected({needs:needs(),reports:[...reports,retry,retry],context});
});

test('workflow retains the stable final check, isolated fixed groups, complete runtime and artifact paths',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/pull-request-baseline.yml',import.meta.url),'utf8');
 const browser=workflow.split('\n  browser:\n')[1].split('\n  required-checks:\n')[0];
 const gate=workflow.split('\n  required-checks:\n')[1];
 assert.deepEqual(browser.match(/group: \[([^\]]+)\]/)[1].split(',').map(value=>value.trim()),GROUP_NAMES);
 assert.match(browser,/fail-fast: false/);assert.doesNotMatch(workflow,/continue-on-error:/);
 assert.doesNotMatch(browser,/^    if:/m,'browser jobs themselves cannot be silently skipped by scope');
 assert.match(browser,/fetch-depth: 0/);assert.match(browser,/playwright@1\.56\.1/);assert.match(browser,/fonts-noto-cjk/);
 assert.match(browser,/required-browser-result-\$\{\{ matrix\.group \}\}-attempt-\$\{\{ github\.run_attempt \}\}/);
 assert.match(browser,/math-required-checks-browser-evidence-\$\{\{ matrix\.group \}\}-\$\{\{ github\.run_attempt \}\}/);
 assert.match(browser,/if-no-files-found: error/);
 assert.match(gate,/^    name: required-checks$/m);assert.match(gate,/needs: \[static-checks, browser\]/);
 assert.match(gate,/^    if: \$\{\{ always\(\) \}\}$/m);
 assert.match(gate,/MATH_REQUIRED_NEEDS: \$\{\{ toJSON\(needs\) \}\}/);
 assert.match(gate,/node scripts\/required-browser-checks\.mjs gate/);
 assert.match(workflow,/push:\n    branches: \[main\]/);assert.match(workflow,/workflow_dispatch:/);
 for(const path of ['verification/learning-evidence-audit/','verification/learning-node-audit/',
  'verification/p7-d3/','verification/p7-d7/coverage.json'])assert.ok(workflow.includes(path),path);
});
