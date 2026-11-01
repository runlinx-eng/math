import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRelationshipSpace} from '../dist/spatial-relationship.js';
import {buildOverviewStructure,OVERVIEW_ROLES} from '../dist/spatial-overview-structure.js';

const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));

test('three legible motifs use exclusively real hard prerequisites without rearrangement',()=>{
 const space=buildRelationshipSpace(atlas),initial=new Map([...space.nodes.values()].map(n=>[n.id,[...n.position]]));
 const view=buildOverviewStructure(space),valid=new Set(atlas.edges.filter(e=>e.strength==='hard').map(e=>e.prerequisiteId+'>'+e.topicId));
 assert.deepEqual(view.paths.map(p=>p.role),OVERVIEW_ROLES);
 assert.equal(view.stats.hard,808);
 assert.equal(view.stats.visibleNodeCount,537);
 assert.ok(view.links.length>=12,'enough real links to form visually different structure');
 assert.ok(view.links.length<=55,'example lines must not reconstruct the old hairball');
 for(const path of view.paths){
  assert.ok(path.links.length>=2, path.role+' must be an actual path rather than an unconnected label');
  for(const link of path.links){
   assert.equal(link.role,path.role);
   assert.ok(valid.has(link.from+'>'+link.to),'source prerequisite missing: '+link.from+'>'+link.to);
   assert.ok(space.relationshipIds.has(link.from)&&space.relationshipIds.has(link.to));
   assert.ok(space.nodes.get(link.from).position[1]<space.nodes.get(link.to).position[1]);
  }
 }
 assert.equal(view.landmarks.length,3);
 const [origin,fork,join]=view.landmarks;
 assert.equal(origin.role,'origin');assert.equal(fork.role,'fork');assert.equal(join.role,'join');
 assert.equal(atlas.edges.filter(e=>e.strength==='hard'&&space.relationshipIds.has(e.prerequisiteId)&&e.topicId===origin.id).length,0,'origin is an actual root');
 assert.ok(atlas.edges.filter(e=>e.strength==='hard'&&e.prerequisiteId===fork.id&&space.relationshipIds.has(e.topicId)).length>=2,'fork has multiple hard outgoing relations');
 assert.ok(atlas.edges.filter(e=>e.strength==='hard'&&e.topicId===join.id&&space.relationshipIds.has(e.prerequisiteId)).length>=2,'join has multiple hard incoming relations');
 for(const [id,pos] of initial)assert.deepEqual(space.nodes.get(id).position,pos,'structure lens must not change any coordinate');
});

test('observation lines are a subset, never a single artificial trunk or full graph',()=>{
 const space=buildRelationshipSpace(atlas),view=buildOverviewStructure(space);
 const unique=new Set(view.links.map(e=>e.from+'>'+e.to));
 assert.equal(unique.size,view.stats.selected);
 assert.ok(unique.size<808);
 for(const {role} of view.landmarks)assert.ok(view.roleNodeSets.has(role));
 for(const p of view.paths)assert.ok(p.links.every(l=>view.roleNodeSets.get(p.role).has(l.from)&&view.roleNodeSets.get(p.role).has(l.to)));
});
