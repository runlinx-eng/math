import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync('dist/'+path,'utf8');
const page=read('mac-local.html'),client=read('sw-client.js'),space=read('space.js'),
 trail=read('exploration.js'),worker=read('sw.js');
test('Mac local opt-in is localhost-scoped and changes only a separate preference key',()=>{
 assert.match(page,/KEY='math-explorer-runtime-mode-v1'/);
 assert.match(client,/MAC_LOCAL_MODE_KEY='math-explorer-runtime-mode-v1'/);
 assert.match(client,/location.protocol==='http:'/);
 assert.match(client,/localStorage.getItem\(MAC_LOCAL_MODE_KEY\)==='mac-local'/);
 assert.match(client,/if\(isMacLocalMode\(\)\)return;/);
 assert.match(space,/if\(isMacLocalMode\(\)\)\{status.textContent=/);
 assert.match(trail,/if\(isMacLocalMode\(\)\)\{\$\('#offline-status'\)/);
 assert.match(page,/data\?\.app==='local-math-explorer'/);
 assert.match(page,/registration\.unregister\(\)/);
 assert.match(page,/localStorage\.setItem\(KEY,LOCAL\)/);
 assert.match(page,/localStorage\.removeItem\(KEY\)/);
 assert.match(page,/confirm\(/);
 assert.doesNotMatch(page,/caches\.delete\(|localStorage\.clear\(|indexedDB\.deleteDatabase/);
});
test('current offline release includes rollback page and unchanged mathematical app versions',()=>{
 const release=worker.match(/^const CACHE = '([^']+)'/m)?.[1];
 const manifest=worker.match(/const FILES = (\[[^\n]+\]);/)?.[1];
 assert.ok(release&&manifest&&manifest.includes("'./mac-local.html'"));
 for(const name of ['space.js','exploration.js','learn.html','learning/learn.js'])
  assert.ok(read(name).includes(release),name+' must pin same release');
 assert.match(read('index.html'),/href="mac-local.html"/);
 assert.match(read('v2.html'),/href="mac-local.html"/);
});