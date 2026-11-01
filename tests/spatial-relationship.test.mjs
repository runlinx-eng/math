import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildGlobalSpace,restoreNetworkCoordinates} from '../dist/spatial-global.js';
import {buildRelationshipSpace,RELATIONSHIP_VERSION} from '../dist/spatial-relationship.js';
import {RELATIONSHIP_POSITIONS,RELATIONSHIP_SCAFFOLD} from '../dist/spatial-relationship-data.js';
import {traceCritical} from '../dist/spatial-trace.js';
import {fresh,validate,backup,parseBackup} from '../dist/exploration-core.js';
import {addQuestion} from '../dist/learning/daily.js';
import {parseView,LAYOUT_VERSION} from '../dist/spatial-model.js';

const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const inventory=JSON.parse(fs.readFileSync(new URL('../docs/spatial-learning/inventory.json',import.meta.url)));
const snapshot=s=>s.objects.map(o=>({key:o.key,position:[...o.position]}));
const assertLegacyFixtureClose=(actual,expected)=>{
  assert.equal(actual.length,expected.length);
  for(let i=0;i<actual.length;i++){
    assert.equal(actual[i].key,expected[i].key,'legacy source identity and order must match');
    for(let k=0;k<3;k++)assert.ok(
      Math.abs(actual[i].position[k]-expected[i].position[k])<=1e-9,
      `legacy source coordinate changed beyond floating-point precision: ${actual[i].key} axis ${k}`
    );
  }
};

test('prototype coordinates are source-ID keyed, fixed and preserve every visible hard direction',()=>{
  const s=buildRelationshipSpace(atlas),domain=atlas.nodes.filter(n=>n.domainId!=='thinking');
  assert.equal(RELATIONSHIP_VERSION,53);assert.equal(s.nodes.size,587);assert.equal(s.relationshipIds.size,537);
  assert.deepEqual(new Set(Object.keys(RELATIONSHIP_POSITIONS)),new Set(domain.map(n=>n.id)));
  for(const n of domain)assert.deepEqual(s.nodes.get(n.id).position,RELATIONSHIP_POSITIONS[n.id]);
  const shown=atlas.edges.filter(e=>s.relationshipIds.has(e.prerequisiteId)&&s.relationshipIds.has(e.topicId));
  assert.equal(shown.filter(e=>e.strength==='hard').length,808);assert.equal(shown.filter(e=>e.strength==='soft').length,272);
  for(const e of shown.filter(e=>e.strength==='hard'))assert.ok(s.nodes.get(e.prerequisiteId).position[1]<s.nodes.get(e.topicId).position[1]);
  assert.ok(new Set(domain.map(n=>s.nodes.get(n.id).position[1])).size>400);
  const initial=snapshot(s),refs=new Map(s.objects.map(o=>[o.key,o.position]));
  for(const view of ['map','relations','oblique'])for(const n of domain){restoreNetworkCoordinates(s,53,view,'node:'+n.id);for(const o of s.objects)assert.equal(o.position,refs.get(o.key));}
  assert.deepEqual(snapshot(s),initial);
});

test('all legacy worlds restore without overwriting the new or v49 coordinates',()=>{
  const s=buildRelationshipSpace(atlas),newPositions=snapshot(s),oldPositions=snapshot(buildGlobalSpace(atlas));
  restoreNetworkCoordinates(s,49,'oblique',null);assert.deepEqual(snapshot(s),oldPositions);
  for(const version of [47,48]){
    const f=JSON.parse(fs.readFileSync(new URL(`./fixtures/spatial-network-v${version}-world.json`,import.meta.url)));
    restoreNetworkCoordinates(s,version,f.world.networkView||'legacy',f.world.selected);assertLegacyFixtureClose(snapshot(s),f.positions);
  }
  restoreNetworkCoordinates(s,53,'oblique',null);assert.deepEqual(snapshot(s),newPositions);
  restoreNetworkCoordinates(s,49,'relations',null);assert.deepEqual(snapshot(s),oldPositions);
  restoreNetworkCoordinates(s,53,'map',null);assert.deepEqual(snapshot(s),newPositions);
});

test('the outline contains only 508 real hard edges and does not replace the complete graph',()=>{
  const s=buildRelationshipSpace(atlas),source=new Set(atlas.edges.filter(e=>e.strength==='hard').map(e=>e.prerequisiteId+'>'+e.topicId));
  assert.equal(RELATIONSHIP_SCAFFOLD.length,508);assert.equal(s.relationshipScaffold.size,508);
  for(const [from,to] of RELATIONSHIP_SCAFFOLD){assert.ok(source.has(from+'>'+to));assert.ok(s.relationshipIds.has(from)&&s.relationshipIds.has(to));}
  assert.equal(inventory.edges.filter(e=>e.inOutline).length,508);assert.equal(atlas.edges.length,1223);
  assert.equal(atlas.edges.filter(e=>e.strength==='hard'&&s.relationshipIds.has(e.prerequisiteId)&&s.relationshipIds.has(e.topicId)&&!s.relationshipScaffold.has(e.prerequisiteId+'>'+e.topicId)).length,300);
});

test('inventory keeps every source goal and edge while separating mapping from mathematics review',()=>{
  assert.equal(inventory.nodes.length,587);assert.equal(inventory.nodes.reduce((sum,n)=>sum+n.goals.length,0),1772);
  assert.equal(inventory.edges.length,1223);assert.equal(inventory.edges.filter(e=>!e.inMainMap).length,143);
  assert.equal(inventory.edges.filter(e=>e.jointActivities.length).length,776);
  assert.equal(inventory.edges.filter(e=>!e.jointActivities.length).length,447);
  assert.ok(inventory.edges.every(e=>e.useReview==='pending'&&e.mathematicalReview==='pending'));
  for(const e of atlas.edges){const row=inventory.edges.find(x=>x.from===e.prerequisiteId&&x.to===e.topicId&&x.strength===e.strength);assert.ok(row);assert.equal(row.sourceReason,e.reason);}
  const trace=traceCritical(atlas,'mt_WcfaSfVT33','after');assert.equal(trace.nodes.length,382);assert.ok(trace.nodes.some(id=>!Object.hasOwn(RELATIONSHIP_POSITIONS,id)));
});

test('new and old questions retain their own coordinate versions, camera and trace in backup',()=>{
  const s=fresh(),id=atlas.nodes.find(n=>n.domainId==='thinking').id;
  const world={position:[100,200,2200],target:[0,0,0],selected:'node:'+id,layout:'network',networkVersion:53,networkView:'oblique',cameraZoom:1.35,traceMode:'before',traceScroll:127};
  addQuestion(s,'这个想法怎样用在别处？',{nodeId:id,world});
  const restored=parseBackup(JSON.stringify(backup(validate(s,atlas))),atlas);
  assert.deepEqual(restored.daily.questions[0].world,world);
  assert.equal(parseView({...world,version:LAYOUT_VERSION},buildRelationshipSpace(atlas)).networkVersion,53);
  for(const patch of [{networkVersion:50},{networkVersion:48},{layout:'classic'},{cameraZoom:0},{traceMode:'invalid'}]){
    const bad=structuredClone(s);Object.assign(bad.daily.questions[0].world,patch);assert.throws(()=>validate(bad,atlas),/空间位置无效/);
  }
});

test('a new-map question and saved view preserve a valid background range without changing old questions',()=>{
  const s=fresh(),id=atlas.nodes[0].id,world={position:[100,200,2200],target:[0,0,0],selected:'node:'+id,layout:'network',networkVersion:53,networkView:'oblique',cameraZoom:1,edgeDisplay:'critical'};
  addQuestion(s,'先看全部关键联系。',{nodeId:id,world});
  assert.deepEqual(parseBackup(JSON.stringify(backup(validate(s,atlas))),atlas).daily.questions[0].world,world);
  assert.equal(parseView({...world,version:LAYOUT_VERSION},buildRelationshipSpace(atlas)).edgeDisplay,'critical');
  for(const patch of [{edgeDisplay:'unknown'},{networkVersion:49}]){const bad=structuredClone(s);Object.assign(bad.daily.questions[0].world,patch);assert.throws(()=>validate(bad,atlas),/空间位置无效/);}
  delete s.daily.questions[0].world.edgeDisplay;assert.equal(validate(s,atlas).daily.questions[0].world.edgeDisplay,undefined);
});
