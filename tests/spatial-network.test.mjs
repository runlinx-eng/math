import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSpace} from '../dist/spatial-model.js';
import {buildNetworkSpace} from '../dist/spatial-network.js';
import {fresh,validate,backup,parseBackup} from '../dist/exploration-core.js';
import {addQuestion} from '../dist/learning/daily.js';

const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const edgeKey=e=>`${e.prerequisiteId}>${e.topicId}`;

test('network coordinates and measures derive deterministically from the actual source graph',()=>{
  const atlasBefore=JSON.stringify(atlas),old=buildSpace(atlas),space=buildNetworkSpace(atlas),oldAgain=buildSpace(atlas);
  const reversed={...atlas,nodes:[...atlas.nodes].reverse(),edges:[...atlas.edges].reverse(),packs:[...atlas.packs].reverse().map(p=>({...p,nodeIds:[...p.nodeIds].reverse()})),packLinks:[...atlas.packLinks].reverse()};
  const again=buildNetworkSpace(reversed);
  assert.equal(space.nodes.size,587);assert.equal(space.packs.size,23);assert.equal(space.themes.size,5);assert.equal(atlas.edges.length,1223);
  const neighbors=new Map([...space.nodes.keys()].map(k=>[k,new Set()]));
  for(const e of atlas.edges){neighbors.get(e.prerequisiteId).add(e.topicId);neighbors.get(e.topicId).add(e.prerequisiteId);
    assert.ok(space.nodes.get(e.prerequisiteId).layer<space.nodes.get(e.topicId).layer,'each displayed layer follows the source direction');}
  for(const node of space.nodes.values()){
    const others=new Set([...neighbors.get(node.id)].map(id=>space.nodes.get(id).themeId));others.delete(node.themeId);
    assert.equal(node.degree,neighbors.get(node.id).size);assert.equal(node.crossThemes,others.size);
    assert.ok(node.position.every(Number.isFinite));assert.deepEqual(node.position,again.nodes.get(node.id).position);
    assert.deepEqual(old.nodes.get(node.id).position,oldAgain.nodes.get(node.id).position);
  }
  assert.equal(space.maxLayer,27);
  assert.equal(JSON.stringify(atlas),atlasBefore,'building the new layout leaves source data intact');
  assert.deepEqual(space.atlas.edges.map(edgeKey).sort(),atlas.edges.map(edgeKey).sort());
});

test('a cycle in source data is surfaced rather than invented into a dependency layer',()=>{
  const e=atlas.edges[0],reversed={prerequisiteId:e.topicId,topicId:e.prerequisiteId,strength:e.strength,reason:e.reason};
  assert.throws(()=>buildNetworkSpace({...atlas,edges:[...atlas.edges,reversed]}),/源关系含有环/);
});

test('question world layout survives validation and backup while old worlds remain unchanged',()=>{
  const state=fresh(),id=atlas.nodes[0].id,world={position:[200,200,900],target:[0,0,0],selected:'node:'+id};
  addQuestion(state,'旧空间的问题',{nodeId:id,world});
  addQuestion(state,'关系全图的问题',{nodeId:id,world:{...world,layout:'network'}});
  const saved=validate(state,atlas),restored=parseBackup(JSON.stringify(backup(saved)),atlas);
  assert.deepEqual(restored.daily.questions.map(q=>q.world),[world,{...world,layout:'network'}]);
  const invalid=structuredClone(saved);invalid.daily.questions[1].world.layout='unknown';
  assert.throws(()=>validate(invalid,atlas),/空间位置无效/);
});
