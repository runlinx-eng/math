import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildGlobalSpace,hardLayers,restoreNetworkCoordinates} from '../dist/spatial-global.js';
import {fresh,validate,backup,parseBackup} from '../dist/exploration-core.js';
import {addQuestion} from '../dist/learning/daily.js';
import {parseView,LAYOUT_VERSION} from '../dist/spatial-model.js';

const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const snapshot=s=>s.objects.map(o=>({key:o.key,position:[...o.position]}));

test('the entire 587-node structure has fixed topic homes and a shared hard-prerequisite height scale',()=>{
  const s=buildGlobalSpace(atlas);assert.equal(s.nodes.size,587);assert.equal(s.packs.size,23);assert.equal(s.themes.size,5);
  assert.equal(s.globalInfo.maxLayer,25);
  for(const e of atlas.edges.filter(e=>e.strength==='hard'))assert.ok(s.nodes.get(e.prerequisiteId).position[1]<s.nodes.get(e.topicId).position[1]);
  for(const n of s.nodes.values()){
    const p=s.packs.get(n.packId),t=s.themes.get(n.themeId);
    assert.ok(Math.hypot(n.position[0]-p.position[0],n.position[2]-p.position[2])<p.radius);
    assert.ok(Math.hypot(n.position[0]-t.region.center[0],n.position[2]-t.region.center[2])<t.region.radius);
  }
  assert.equal(new Set([...s.nodes.values()].map(n=>n.position[1])).size,26);
  assert.ok(new Set([...s.nodes.values()].map(n=>n.position[2])).size>500);
});

test('auxiliary relations never raise nodes or become prerequisite levels',()=>{
  const all=buildGlobalSpace(atlas),hard=buildGlobalSpace({...atlas,edges:atlas.edges.filter(e=>e.strength==='hard')});
  assert.deepEqual(snapshot(all),snapshot(hard));
  const e=atlas.edges.find(e=>e.strength==='hard');
  assert.deepEqual([...hardLayers({...atlas,edges:[...atlas.edges,{prerequisiteId:e.topicId,topicId:e.prerequisiteId,strength:'soft'}]})],[...hardLayers(atlas)]);
  assert.throws(()=>hardLayers({...atlas,edges:[...atlas.edges,{prerequisiteId:e.topicId,topicId:e.prerequisiteId,strength:'hard'}]}),/含有环/);
});

test('view changes and selecting any source node leave the same global coordinate arrays intact',()=>{
  const s=buildGlobalSpace(atlas),before=snapshot(s),refs=new Map(s.objects.map(o=>[o.key,o.position]));
  for(const view of ['map','relations','oblique'])for(const n of s.nodes.values()){
    restoreNetworkCoordinates(s,49,view,n.key);
    assert.equal(s.relationIds,null);
    for(const o of s.objects)assert.equal(o.position,refs.get(o.key));
  }
  assert.deepEqual(snapshot(s),before);
});

test('global coordinates do not depend on source row order and never mutate source data',()=>{
  const raw=JSON.stringify(atlas),a=buildGlobalSpace(atlas),b=buildGlobalSpace({...atlas,nodes:[...atlas.nodes].reverse(),edges:[...atlas.edges].reverse(),packs:[...atlas.packs].reverse().map(p=>({...p,nodeIds:[...p.nodeIds].reverse()}))});
  for(const n of a.nodes.values())assert.deepEqual(n.position,b.nodes.get(n.id).position);
  assert.equal(JSON.stringify(atlas),raw);
});

test('both older coordinate systems still restore from their saved fixtures, then return to the global map',()=>{
  const s=buildGlobalSpace(atlas),initial=snapshot(s);
  for(const version of [47,48]){
    const f=JSON.parse(fs.readFileSync(new URL(`./fixtures/spatial-network-v${version}-world.json`,import.meta.url)));
    restoreNetworkCoordinates(s,version,f.world.networkView||'legacy',f.world.selected);
    assert.deepEqual(snapshot(s),f.positions);
    restoreNetworkCoordinates(s,49,'relations',f.world.selected);assert.deepEqual(snapshot(s),initial);
  }
});

test('question backups preserve the global coordinate version and orthographic camera zoom',()=>{
  const s=fresh(),id=atlas.nodes[0].id,world={position:[100,100,2200],target:[0,0,0],selected:'node:'+id,layout:'network',networkVersion:49,networkView:'oblique',cameraZoom:1.35};
  addQuestion(s,'整张图中原来的位置',{nodeId:id,world});
  const restored=parseBackup(JSON.stringify(backup(validate(s,atlas))),atlas);assert.deepEqual(restored.daily.questions[0].world,world);
  for(const patch of [{networkVersion:50},{networkVersion:48},{layout:'classic'},{cameraZoom:0},{cameraZoom:Infinity}]){
    const bad=structuredClone(s);Object.assign(bad.daily.questions[0].world,patch);assert.throws(()=>validate(bad,atlas),/空间位置无效/);
  }
  const camera=parseView({...world,version:LAYOUT_VERSION},buildGlobalSpace(atlas));assert.equal(camera.networkVersion,49);assert.equal(camera.cameraZoom,1.35);
});
