import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRelationshipSpace} from '../dist/spatial-relationship.js';
import {buildGradeSpatialMetadata,placeGradeStageCard} from '../dist/grade-spatial-cards.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const atlas=read('../dist/data/atlas.json');
const grade=read('../dist/data/grade-progression.json');
const space=buildRelationshipSpace(atlas);
const originalPositions=new Map([...space.nodes].map(([id,node])=>[id,[...node.position]]));
const originalEdges=JSON.stringify(atlas.edges);

test('3D grade annotations preserve all 537 source node coordinates and every relationship',()=>{
  const result=buildGradeSpatialMetadata(space,grade);
  assert.deepEqual(result.counts,{stages:3,packs:23,nodes:537});
  assert.equal(result.stages.length,3);
  assert.deepEqual(result.stages.map(s=>s.id),['stage-1','stage-2','stage-3']);
  assert.equal(result.stages.some(s=>s.count===0),false);
  for(const [id,node] of result.nodes){
    assert.deepEqual(node.position,originalPositions.get(id));
    assert.notStrictEqual(node.position,space.nodes.get(id).position);
  }
  for(const [id,pack] of result.packs)assert.deepEqual(pack.position,space.packs.get(id).position);
  assert.equal(JSON.stringify(atlas.edges),originalEdges);
  assert.deepEqual([...space.nodes].map(([id,n])=>[id,n.position]),[...originalPositions]);
});

test('two-year stage mapping remains explicit, including cross-stage and missing data',()=>{
  const result=buildGradeSpatialMetadata(space,grade);
  const multi=result.nodes.get('mt_s2mfRBoTal');
  assert.equal(multi.roles['stage-1'],'main');
  assert.equal(multi.roles['stage-2'],'extension');
  assert.equal(multi.roles['stage-3'],undefined);
  assert.equal(result.packs.get('time').marks['stage-3'],'待补充');
  const thinking=grade.specialRisks.thinkingNodes.ids[0];
  assert.equal(result.nodes.has(thinking),false);
  for(const stage of result.stages){
    const same=grade.nodeMappings.filter(n=>n.curriculum.primaryStages.includes(stage.id));
    assert.equal(stage.count,same.length);
  }
});

test('stage annotations do not obscure visible panels or the viewport',()=>{
  const viewport={width:1440,height:900};
  const a={x:900,y:450,visible:true};
  const rect=placeGradeStageCard(a,{w:152,h:49},viewport,[{x:0,y:90,w:420,h:650}]);
  assert.ok(rect&&rect.x>420);
  assert.equal(placeGradeStageCard({...a,visible:false},{w:152,h:49},viewport),null);
  assert.equal(placeGradeStageCard({x:200,y:250,visible:true},{w:152,h:49},viewport,[{x:0,y:0,w:1440,h:900}]),null);
});
