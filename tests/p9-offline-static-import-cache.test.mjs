import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const manifest=sw.match(/const FILES = (\[[^\n]+\]);/);
assert.ok(manifest,'Service Worker must expose a literal precache manifest');
const entries=[...manifest[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
const cached=new Set(entries.map(entry=>new URL(entry,'https://example.invalid/').pathname.slice(1)));

function staticDependencies(source){
  // Test the import/export forms used by our shipped ESM files, including
  // literal dynamic imports; do not execute production modules in Node.
  const patterns=[
    /\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?['"]([^'"]+)['"]/gs,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  return patterns.flatMap(pattern=>[...source.matchAll(pattern)].map(match=>match[1]));
}

function missingDependencies(files){
  const omissions=[];
  for(const file of files){
    if(!file.endsWith('.js'))continue;
    const absolute=path.join(root,file);
    assert.ok(fs.existsSync(absolute),'Precached JavaScript missing on disk: '+file);
    const code=fs.readFileSync(absolute,'utf8');
    for(const request of staticDependencies(code)){
      if(!request.startsWith('.'))continue;
      const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(file),request.split(/[?#]/,1)[0]));
      if(!files.has(resolved))omissions.push(file+' -> '+resolved);
    }
  }
  return omissions.sort();
}

test('every dependency of a precached JavaScript module is precached',()=>{
  assert.deepEqual(missingDependencies(cached),[]);
});

test('the cache audit detects a missing static module dependency',()=>{
  assert.ok(missingDependencies(new Set(['spatial-scene.js'])).some(entry=>entry.includes('spatial-overview-structure.js')));
});
