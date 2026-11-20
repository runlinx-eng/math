import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const affected=[
 '.github/workflows/p8-startup-performance.yml',
 '.github/workflows/p9-bootstrap-failure-regression.yml',
 '.github/workflows/p9-module-recovery-ci.yml',
 '.github/workflows/p9-ordinal90-recovery.yml'
];
const protectedExisting=[
 '.github/workflows/pull-request-baseline.yml',
 '.github/workflows/overview-readability-check.yml'
];
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const expectedGroup='${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}';
const expectedCancel="${{ github.event_name == 'pull_request' }}";

test('#277 superseded PR Chromium runs are isolated by PR and by workflow',()=>{
 for(const name of [...affected,...protectedExisting]){
  const source=read(name);
  const block=/^concurrency:\n  group: ([^\n]+)\n  cancel-in-progress: ([^\n]+)$/gm;
  const actual=[...source.matchAll(block)];
  assert.equal(actual.length,1,name+' must have one top-level concurrency block');
  assert.equal(actual[0][1],expectedGroup,name+' may never coalesce two different PRs');
  assert.equal(actual[0][2],expectedCancel,name+' may only cancel stale PR revisions');
  assert.match(source,/^  pull_request:/m,name+' still handles PR events');
  assert.match(source,/^  workflow_dispatch:/m,name+' retains manual diagnostics');
  assert.match(source,/^jobs:/m,name+' job entrypoints preserved');
 }
});
test('#277 fallback main integration checks cannot be cancelled by PR edits',()=>{
 const source=read('.github/workflows/p9-bootstrap-failure-regression.yml');
 assert.match(source,/^  push:\n    branches: \[main\]/m);
 assert.match(source,/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
 // This is a literal, reviewable condition, not a generic boolean true:
 // push and workflow_dispatch both evaluate false; only PR is cancellable.
 for(const name of ['push','workflow_dispatch'])assert.notEqual(name,'pull_request');
});
test('#277 preserves the actual expensive tests and fixed trigger scope',()=>{
 const scripts=[
  ['.github/workflows/p8-startup-performance.yml','node tests/p8-startup-performance-browser.cjs'],
  ['.github/workflows/p9-bootstrap-failure-regression.yml','node tests/p9-bootstrap-failure-browser.cjs'],
  ['.github/workflows/p9-module-recovery-ci.yml','node tests/p9-module-recovery-browser.cjs'],
  ['.github/workflows/p9-ordinal90-recovery.yml','node tests/p9-fraction-order-adapter-browser.cjs']
 ];
 for(const [name,command] of scripts)assert.ok(read(name).includes(command),name+' original browser test');
 assert.match(read(scripts[0][0]),/MATH_STARTUP_ROUNDS: '5'/);
 assert.match(read(scripts[3][0]),/timeout-minutes: 35/);
 assert.match(read(scripts[2][0]),/tests\/p9-three-view-lazy-browser\.cjs/);
 assert.match(read(scripts[1][0]),/if-no-files-found: error/);
});
