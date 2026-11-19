import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkRelease,syncRelease} from '../scripts/ci-release-sync.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
const old='math-explorer-20261119-p9-compare-v1',next='math-explorer-20261120-sample-v1';
function makeFixture(){
 const root=mkdtempSync(join(tmpdir(),'math-release-sync-'));
 const write=(path,content)=>{const full=join(root,path);mkdirSync(join(full,'..'),{recursive:true});writeFileSync(full,content);};
 const entry=`import {registerClientRelease} from '../sw-client.js';\nregisterClientRelease('${old}');\nconst unchanged=42;\n`;
 const sha=hash(entry);
 write('dist/sw.js',`const CACHE = '${old}';\nconst FILES = [];\n`);
 write('dist/space.js',`const RELEASE='${old}';\nregisterClientRelease(RELEASE);\n`);
 write('dist/exploration.js',`const RELEASE='${old}';\nregisterClientRelease(RELEASE);\n`);
 write('dist/learning/learn.js',entry);
 write('dist/learn.html',`const STARTUP_RELEASE='${old}';\nconst STARTUP_ENTRY_SHA256='${sha}';\n`);
 write('tests/fixtures/p9-math-navigation.cjs',`module.exports={\n  "sourceHashes": {\n    "dist/learning/tasks.js": "${'1'.repeat(64)}",\n    "dist/learning/learn.js": "${sha}"\n  },\n  "controllerSourceHashes": {"update": "abc"}\n};\n`);
 return {root,write,entry,sha};
}
function withFixture(fn){
 const f=makeFixture();try{fn(f);}finally{rmSync(f.root,{recursive:true,force:true});}
}
test('checked offline pins are consistent before and after one explicit batch synchronization',()=>withFixture(f=>{
 assert.equal(checkRelease(f.root).release,old);
 const result=syncRelease({dir:f.root,release:next,baseLearnSource:f.entry});
 assert.equal(result.changed.length,6);
 assert.equal(result.reviewedFixtures,1);
 assert.equal(checkRelease(f.root).release,next);
 assert.equal(checkRelease(f.root).sha256,result.sha256);
 assert.equal(syncRelease({dir:f.root,release:next,baseLearnSource:f.entry}).changed.length,0);
}));
test('mismatched SW, startup integrity and reviewed fixture hashes fail closed',()=>withFixture(f=>{
 f.write('dist/sw.js',`const CACHE = '${next}';\n`);
 assert.throws(()=>checkRelease(f.root),/Release mismatch/);
 f.write('dist/sw.js',`const CACHE = '${old}';\n`);
 f.write('dist/learn.html',`const STARTUP_RELEASE='${old}';\nconst STARTUP_ENTRY_SHA256='${'0'.repeat(64)}';\n`);
 assert.throws(()=>checkRelease(f.root),/Startup entry digest stale/);
 f.write('dist/learn.html',`const STARTUP_RELEASE='${old}';\nconst STARTUP_ENTRY_SHA256='${f.sha}';\n`);
 f.write('tests/fixtures/p9-math-navigation.cjs',`module.exports={"sourceHashes":{"dist/learning/learn.js":"${'f'.repeat(64)}"}};\n`);
 assert.throws(()=>checkRelease(f.root),/Reviewed navigation source hash stale/);
 assert.throws(()=>syncRelease({dir:f.root,release:next,baseLearnSource:f.entry}),/manual review required/);
 assert.match(readFileSync(join(f.root,'dist/space.js'),'utf8'),new RegExp(old));
}));
test('a non-release edit to learned source cannot silently approve new navigation fingerprints',()=>withFixture(f=>{
 f.write('dist/learning/learn.js',f.entry.replace('unchanged=42','unchanged=43'));
 assert.throws(()=>syncRelease({dir:f.root,release:next,baseLearnSource:f.entry}),/non-release changes/);
 assert.match(readFileSync(join(f.root,'dist/sw.js'),'utf8'),new RegExp(old));
}));
test('malformed/multiple pins and invalid release identifiers never write changes',()=>withFixture(f=>{
 assert.throws(()=>syncRelease({dir:f.root,release:'../../not-a-release',baseLearnSource:f.entry}),/explicit safe/);
 f.write('dist/space.js',`const RELEASE='${old}';\nconst RELEASE='${old}';\n`);
 assert.throws(()=>syncRelease({dir:f.root,release:next,baseLearnSource:f.entry}),/exactly one/);
 assert.match(readFileSync(join(f.root,'dist/sw.js'),'utf8'),new RegExp(old));
}));

// Runs in every real CI Node scope; this check intentionally retains the fixtures.
const checkoutRoot=resolve(fileURLToPath(new URL('..',import.meta.url)));
test('real checkout release, startup integrity and reviewed navigation pins stay aligned',
 {skip:!existsSync(join(checkoutRoot,'dist/sw.js'))},()=>{
  const current=checkRelease(checkoutRoot);
  assert.ok(current.reviewedFixtures>=1);
 });
