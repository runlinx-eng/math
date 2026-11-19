import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// #272: P8 measures the startup graph and a fixed Phase4 equivalent-fraction
// deep link, not arbitrary lazy Phase5 lessons. Other browser gates retain
// coverage for edited Phase5 lessons. Keep a guard if benchmark scope changes.
const workflow=readFileSync(new URL('../.github/workflows/p8-startup-performance.yml',import.meta.url),'utf8');
const browser=readFileSync(new URL('./p8-startup-performance-browser.cjs',import.meta.url),'utf8');
const m=/^  pull_request:\n    paths:\n([\s\S]*?)^  workflow_dispatch:/m.exec(workflow);
const lines=m?.[1]?.split('\n')?.map(x=>x.trim()).filter(x=>x.startsWith("- '"));
const paths=lines?.map(x=>x.replace(/^- '|'$/g,''));
function matched(path) {
 assert.ok(Array.isArray(paths),'Missing P8 PR path filter');
 let yes=false;
 for(const rule of paths){
  const neg=rule.startsWith('!'),p=neg?rule.slice(1):rule;
  const match=p==='dist/**'?path.startsWith('dist/'):
   p==='dist/learning/phase5/**'?path.startsWith('dist/learning/phase5/'):
   path===p;
  if(match)yes=!neg;
 }
 return yes;
}
test('#272 P8 keeps the full startup graph, SW, Phase4 and benchmark runner',()=>{
 assert.ok(paths?.includes('dist/**')&&paths?.includes('!dist/learning/phase5/**'));
 assert.ok(paths.indexOf('dist/**')<paths.indexOf('!dist/learning/phase5/**'));
 for(const path of ['dist/index.html','dist/learn.html','dist/sw.js',
  'dist/space.js','dist/spatial-scene.js','dist/exploration.js',
  'dist/learning/learn.js','dist/learning/phase4/task-catalog.js',
  'dist/learning/evidence-adapters.js','dist/data/atlas.json',
  'tests/p8-startup-performance-browser.cjs',
  'tests/ci-p8-trigger.test.mjs',
  '.github/workflows/p8-startup-performance.yml']) {
  assert.equal(matched(path),true,path);
 }
 assert.match(workflow,/^  workflow_dispatch:/m,'manual P8 remains available');
});
test('#272 unrelated lazy Phase5 edits do not repeatedly launch the fixed P8 benchmark',()=>{
 for(const path of ['dist/learning/phase5/b32.js',
  'dist/learning/phase5/b32-model.js','dist/learning/phase5/b32-view.js',
  'dist/learning/phase5/b33.css','dist/learning/phase5/b39-model.js']) {
  assert.equal(matched(path),false,path);
 }
 for(const path of ['dist/learning/b32-evidence.js','dist/sw.js',
  'dist/learning/phase4/view-engine.js'])assert.equal(matched(path),true,path);
});
test('#272 benchmark still uses service-worker-free fixed existing source, not Phase5 deep links',()=>{
 assert.match(browser,/serviceWorkers: 'block'/);
 assert.match(browser,/mt_Ep7TDFuYUa/);
 assert.match(browser,/mt_WcfaSfVT33/);
 assert.doesNotMatch(browser,/\/phase5\/b32\.js/);
});
