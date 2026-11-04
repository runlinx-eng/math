import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRelationshipSpace} from '../dist/spatial-relationship.js';
import {buildGradeRelationshipStructure} from '../dist/grade-relationship-structure.js';
const data=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const atlas=data('../dist/data/atlas.json'),grade=data('../dist/data/grade-progression.json');
const space=buildRelationshipSpace(atlas);
const positions=JSON.stringify([...space.nodes].map(([id,n])=>[id,n.position])),edges=JSON.stringify(atlas.edges);
const classified=buildGradeRelationshipStructure(space,grade);
test('all domain nodes classified by genuine hard prerequisite relations',()=>{
  assert.equal(classified.nodes.size,537);
  assert.equal(classified.stats.hardEdges,808);
  assert.equal(classified.stats.roots,29);
  assert.equal(classified.stats.leaves,156);
  for(const n of classified.nodes.values()){
    assert.ok(['root','trunk','branch','leaf'].includes(n.role));
    assert.equal(n.root,n.incoming===0);assert.equal(n.leaf,n.outgoing===0);
  }
});
test('stage-specific paths follow hard edges and keep group judgements independent',()=>{
  assert.deepEqual([...classified.stages.keys()],['stage-1','stage-2','stage-3']);
  assert.deepEqual([...classified.stages.values()].map(s=>s.stats.mappedNodes),[187,259,255]);
  assert.deepEqual([...classified.stages.values()].map(s=>s.stats.mainGroups),[10,14,17]);
  for(const stage of classified.stages.values()){
    assert.equal(stage.groupJudgements.length,23);
    assert.ok(stage.paths.length>0&&stage.paths.length<=3);
    for(const p of stage.paths){
      assert.equal(classified.nodes.get(p.rootId).root,true);
      for(let i=1;i<p.nodeIds.length;i++)
        assert.ok(classified.sourceEdges.has(p.nodeIds[i-1]+'>'+p.nodeIds[i]));
    }
    for(const link of stage.links)assert.ok(classified.sourceEdges.has(link.from+'>'+link.to));
  }
  assert.equal(classified.stages.get('stage-3').groupJudgements.find(x=>x.packId==='time').judgement,'incomplete');
});
test('classification does not mutate coordinates or source relations',()=>{
  assert.equal(JSON.stringify([...space.nodes].map(([id,n])=>[id,n.position])),positions);
  assert.equal(JSON.stringify(atlas.edges),edges);
});
