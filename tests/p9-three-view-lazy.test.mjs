// Structural regression: ordinary lesson startup must not load 3D views.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {needsThreeView,loadThreeViews} from '../dist/learning/three-view-runtime.js';

const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const entry=fs.readFileSync(path.join(dist,'learning/learn.js'),'utf8');
const helper=fs.readFileSync(path.join(dist,'learning/three-view-runtime.js'),'utf8');
const sw=fs.readFileSync(path.join(dist,'sw.js'),'utf8');
const classes=['CubeView','SolidView','SpaceLab','AreaSolidLab','FractionCubeView','PatternGrowthView','FrameView','PowerView'];
const files=['./cubes.js','./phase4/solid-view.js','./phase5/b27-solid-view.js','./phase5/b30-solid-view.js','./phase5/b31-cube-view.js','./phase5/b34-space-view.js','./phase5/b23-solid-view.js','./phase5/b09-power-view.js'];

test('ordinary learning entry imports a lightweight helper instead of any 3D class',()=>{
 assert.match(entry,/import \{needsThreeView,loadThreeViews\} from '\.\/three-view-runtime\.js';/);
 assert.doesNotMatch(entry,/^import .*from ['"](?:\.\/cubes|\.\/phase4\/solid-view|\.\/phase5\/(?:b23-solid-view|b27-solid-view|b30-solid-view|b31-cube-view|b34-space-view|b09-power-view))\.js['"]/m);
 assert.doesNotMatch(helper,/^import\s+[^(']/m,'helper must have no static imports');
 for(const file of files)assert.ok(helper.includes("import('"+file+"')"),'lazy boundary: '+file);
 for(const name of classes)assert.match(entry,new RegExp('\\b'+name+'\\b'),'existing renderer uses '+name);
});

test('preload is before session mutation and synchronous render',()=>{
 const check=entry.indexOf('sessionTasks(next).some(needsThreeView)');
 const load=entry.indexOf('=await loadThreeViews()');
 const storage=entry.indexOf('all=read();a=sessionRecord(all,id)||freshLesson(id)');
 const render=entry.indexOf('render();window.scrollTo(0,0)');
 assert.ok(check>0&&load>check&&storage>load&&render>storage);
 assert.equal(typeof loadThreeViews,'function');
 assert.match(entry,/needsThreeView\(PRACTICE\[next\]\)/,'optional practice modes must preload 3D views too');
});

test('actual current-release manifest keeps the lazy helper and all optional view files offline',()=>{
 const manifest=sw.match(/const FILES = (\[[^\n]+\]);/);
 assert.ok(manifest);
 const cached=new Set([...manifest[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));
 assert.ok(cached.has('./learning/three-view-runtime.js'));
 for(const f of files){
  const relative='./learning/'+f.slice(2);
  assert.ok(cached.has(relative),'precache missing '+relative);
  assert.ok(fs.existsSync(path.join(dist,relative)),'module absent '+relative);
 }
});

test('3D family classification retains all existing synchronous render branches',()=>{
 for(const t of [{type:'cube-plan',dims:[2,3,4]},{type:'x-solid'},{type:'x-net'},
  {type:'x-s23-frame'},{type:'x-g27-cut'},{type:'x-a30-solid'},
  {type:'x-m31-cubes'},{type:'x-m31-product'},{type:'x-p34-growth'},
  {type:'x-powerbuild',pow:3}]){
  assert.equal(needsThreeView(t),true,JSON.stringify(t));
 }
 for(const t of [{type:'x-powerbuild',pow:2},{type:'x-mularray'},
  {type:'x-b18-fraction'},{type:'partition'},null]){
  assert.equal(needsThreeView(t),false,JSON.stringify(t));
 }
});
