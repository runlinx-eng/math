import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chooseNodeScope,ciTestFiles,chosenTests} from '../scripts/ci-node-scope.mjs';

const mod=path=>({status:'M',path});
const add=path=>({status:'A',path});
const selection=(event,...paths)=>chooseNodeScope(event,paths.map(mod));
const full=['tests/spatial-overview.test.mjs','tests/required-browser-checks.test.mjs',
 'tests/deployment-static.test.mjs','tests/desktop-viewport-policy.test.mjs',
 'tests/ci-node-scope.test.mjs','tests/ci-live-matrix.test.mjs',
 'tests/p9-area-navigation.test.mjs','tests/p9-area-evidence-adapter.test.mjs',
 'tests/p9-multable-evidence.test.mjs','tests/p9-multable-navigation.test.mjs',
 'tests/p9-unitcover-evidence.test.mjs','tests/p9-unitcover-navigation.test.mjs',
 'tests/p9-evidence-contract.test.mjs','tests/p9-numeric-compat.test.mjs',
 'tests/p10-numeric-save-races.test.mjs'];
const ci=['tests/ci-node-scope.test.mjs','tests/ci-live-matrix.test.mjs'];
test('CI-only source and workflow changes do not require every math family Node test',()=>{
 const x=selection('pull_request','.github/workflows/pull-request-baseline.yml',
  'scripts/ci-node-scope.mjs','tests/ci-node-scope.test.mjs',
  'docs/DEVELOPMENT-WORKFLOW.md');
 assert.deepEqual(x,{mode:'ci-only',family:null,reason:'ci-files-only'});
 const picked=chosenTests(x,full,ci);
 assert.ok(picked.includes('tests/ci-node-scope.test.mjs'));
 assert.ok(picked.includes('tests/deployment-static.test.mjs'));
 assert.ok(!picked.includes('tests/p9-area-navigation.test.mjs'));
});
test('main CI-only push stays in reduced Node mode; full milestone remains full',()=>{
 const x=selection('push','scripts/ci-targeted-checks.mjs');
 assert.equal(x.mode,'ci-only');
 const y=selection('workflow_dispatch','scripts/ci-targeted-checks.mjs');
 assert.equal(y.mode,'full');
 assert.deepEqual(chosenTests(y,full,ci),full);
 assert.equal(chooseNodeScope('push',[]).mode,'full');
});
test('reviewed isolated area/multable/unitcover math changes run only their own Node cases plus shared invariants',()=>{
 for(const [family,changed,testfile] of [
  ['area','dist/learning/area-evidence.js','tests/p9-area-evidence-adapter.test.mjs'],
  ['multable','tests/p9-multable-adapter-browser.cjs','tests/p9-multable-evidence.test.mjs'],
  ['unitcover','tests/p9-unitcover-navigation.test.mjs','tests/p9-unitcover-evidence.test.mjs']
 ]){
  const x=selection('pull_request',changed);
  assert.equal(x.mode,'family',family);
  assert.equal(x.family,family);
  const tests=chosenTests(x,full,ci);
  assert.ok(tests.includes(testfile),family);
  assert.ok(tests.includes('tests/p9-evidence-contract.test.mjs'),family);
  assert.ok(tests.includes('tests/p10-numeric-save-races.test.mjs'),family);
  assert.ok(!tests.includes('tests/spatial-overview.test.mjs'),family);
 }
});
test('unknown, shared, mixed, cross-family, content and data changes fall back to FULL Node',()=>{
 const cases=[
  ['dist/learning/learn.js'],
  ['dist/learning/state.js'],
  ['dist/sw.js'],
  ['dist/learning/area-evidence.js','dist/learning/multable-evidence.js'],
  ['dist/learning/area-evidence.js','docs/DEVELOPMENT-WORKFLOW.md'],
  ['tests/fixtures/other-family-cases.cjs'],
  ['vendor/upstream.json'],
  ['docs/LEARNING-DESIGN.md'],
  ['ci/math-families.json','dist/learning/area-evidence.js']
 ];
 for(const changed of cases)assert.equal(selection('pull_request',...changed).mode,'full',changed.join(','));
});
test('deletes, renames, copies and special statuses never select reduced tests',()=>{
 for(const status of ['D','R100','C100','T','U']){
  const x=chooseNodeScope('pull_request',[{status,path:'scripts/ci-node-scope.mjs'}]);
  assert.equal(x.mode,'full',status);
 }
 assert.equal(chooseNodeScope('push',[add('tests/ci-new.test.mjs')]).mode,'ci-only');
});
test('invalid change declarations, path traversal, unknown event or unregistered family fail closed',()=>{
 for(const changes of [null,{},[{status:'M',path:'../foo'}],
  [{status:'M',path:'/etc/passwd'}],[{status:'M'}],[null]])
  assert.throws(()=>chooseNodeScope('pull_request',changes));
 assert.throws(()=>chooseNodeScope('schedule',[]));
 assert.throws(()=>chosenTests({mode:'family',family:'made-up'},full,ci));
 assert.throws(()=>chosenTests({mode:'ci-only'},[],ci));
});
test('new CI tests register automatically and missing required CI inventory is rejected',()=>{
 const all=ciTestFiles([...ci,'tests/ci-brand-new.test.mjs','tests/p9-area-navigation.test.mjs']);
 assert.ok(all.includes('tests/ci-brand-new.test.mjs'));
 assert.ok(!all.includes('tests/p9-area-navigation.test.mjs'));
 const x=selection('pull_request','tests/ci-brand-new.test.mjs');
 assert.ok(chosenTests(x,full,all).includes('tests/ci-brand-new.test.mjs'));
 assert.throws(()=>chosenTests(x,['tests/ci-node-scope.test.mjs'],ci));
});
test('workflow keeps explicit Node scope receipt, manual full coverage, and the original full test inventory',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/pull-request-baseline.yml',import.meta.url),'utf8');
 assert.match(workflow,/node scripts\/ci-node-scope\.mjs output/);
 assert.match(workflow,/node scripts\/ci-node-scope\.mjs run "\$\{test_files\[@\]\}"/);
 assert.match(workflow,/MATH_NODE_EXPECTED_SCOPE: \$\{\{ steps\.node_scope\.outputs\.mode \}\}/);
 assert.match(workflow,/if: steps\.node_scope\.outputs\.mode != 'ci-only'/);
 assert.match(workflow,/node scripts\/audit-learning-nodes\.mjs/);
 assert.match(workflow,/node scripts\/audit-learning-evidence\.mjs/);
 assert.match(workflow,/node scripts\/ci-live-browser-matrix\.mjs output/);
 assert.match(workflow,/^  workflow_dispatch:/m);
 assert.doesNotMatch(workflow,/^  schedule:/m);
});
