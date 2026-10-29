import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildNetworkSpace,relationLayout,applyNetworkView} from '../dist/spatial-network.js';
import {parseView,LAYOUT_VERSION} from '../dist/spatial-model.js';
import {activityForms,ACTIVITY_FORMS} from '../dist/spatial-activities.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {fresh,validate,backup,parseBackup} from '../dist/exploration-core.js';
import {addQuestion} from '../dist/learning/daily.js';

const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const space=buildNetworkSpace(atlas),edgeKey=e=>`${e.prerequisiteId}>${e.topicId}`;

test('the map groups every idea inside its own topic area without an invented height axis',()=>{
  for(const n of space.nodes.values()){
    const p=space.packs.get(n.packId),t=space.themes.get(n.themeId);
    assert.equal(n.position[1],0);
    assert.ok(Math.hypot(n.position[0]-p.position[0],n.position[2]-p.position[2])<p.radius);
    assert.ok(Math.hypot(n.position[0]-t.region.center[0],n.position[2]-t.region.center[2])<t.region.radius);
  }
  assert.equal(new Set([...space.nodes.values()].map(n=>n.position.join(','))).size,587);
});

test('each side view contains all and only direct source neighbors on the correct side',()=>{
  for(const n of space.nodes.values()){
    const r=relationLayout(space,n.id),before=atlas.edges.filter(e=>e.topicId===n.id),after=atlas.edges.filter(e=>e.prerequisiteId===n.id);
    assert.deepEqual(r.before.toSorted(),before.map(e=>e.prerequisiteId).toSorted());
    assert.deepEqual(r.after.toSorted(),after.map(e=>e.topicId).toSorted());
    assert.deepEqual(r.edges.map(edgeKey).toSorted(),[...before,...after].map(edgeKey).toSorted());
    assert.equal(r.positions.size,1+before.length+after.length);
    assert.deepEqual(r.positions.get(n.id),[0,0,0]);
    for(const id of r.before)assert.ok(r.positions.get(id)[1]<0);
    for(const id of r.after)assert.ok(r.positions.get(id)[1]>0);
  }
  assert.equal(relationLayout(space,'missing'),null);
});

test('switching layouts preserves the full map and the old saved coordinate system',()=>{
  const s=buildNetworkSpace(atlas),id='mt_-hTTat0mBR',original=new Map(s.objects.map(o=>[o.key,[...o.position]]));
  applyNetworkView(s,'relations','node:'+id);
  assert.deepEqual(s.nodes.get(id).position,[0,0,0]);
  assert.equal(s.relationIds.size,8);
  applyNetworkView(s,'map');
  for(const o of s.objects)assert.deepEqual(o.position,original.get(o.key));
  applyNetworkView(s,'legacy');
  for(const o of s.objects)assert.deepEqual(o.position,s.legacyPositions.get(o.key));
  assert.equal(applyNetworkView(s,'relations','pack:same-amount'),'map');
  assert.equal(s.relationIds,null);
});

test('activity shapes describe real available controls and leave unknown models neutral',()=>{
  assert.deepEqual(activityForms(LESSONS.share.topicId),['portions']);
  assert.deepEqual(activityForms(LESSONS.equivalent.topicId),['portions','line']);
  assert.deepEqual(activityForms(LESSONS.space.topicId),['blocks']);
  for(const l of Object.values(LESSONS)){
    const forms=activityForms(l.topicId);assert.ok(forms.length>0);
    for(const f of forms)assert.ok(ACTIVITY_FORMS[f]);
  }
  assert.deepEqual(activityForms('missing'),[]);
});

test('new question view meanings survive a real backup round trip without rewriting old worlds',()=>{
  const s=fresh(),id='mt_nvdpxAJTBG',world={position:[200,100,900],target:[0,0,0],selected:'node:'+id};
  const worlds=[world,{...world,layout:'network'},...['map','relations','oblique','legacy'].map(networkView=>({...world,layout:'network',networkView}))];
  for(const [i,w]of worlds.entries())addQuestion(s,'原问题 '+i,{nodeId:id,world:w});
  const restored=parseBackup(JSON.stringify(backup(validate(s,atlas))),atlas);
  assert.deepEqual(restored.daily.questions.map(q=>q.world),worlds);
  for(const invalid of [{...world,layout:'network',networkView:'difficulty'},{...world,networkView:'map'},{...world,layout:'classic',networkView:'map'}]){
    const bad=structuredClone(s);bad.daily.questions[0].world=invalid;
    assert.throws(()=>validate(bad,atlas),/空间位置无效/);
  }
});

test('saved camera metadata distinguishes map, relation and legacy restoration',()=>{
  const view={version:LAYOUT_VERSION,position:[200,100,900],target:[0,0,0],selected:'node:mt_nvdpxAJTBG'};
  assert.equal(parseView(view,space).networkView,undefined);
  for(const networkView of ['map','relations','oblique','legacy'])assert.equal(parseView({...view,networkView},space).networkView,networkView);
  assert.equal(parseView({...view,networkView:'difficulty'},space).networkView,undefined);
});


test('all 615 saved homes from the v47 fixture remain exact when restoring legacy questions',()=>{
  const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/spatial-network-v47-world.json',import.meta.url)));
  const s=buildNetworkSpace(atlas);applyNetworkView(s,'legacy');
  assert.deepEqual(s.objects.map(o=>({key:o.key,position:o.position})),fixture.positions);
});
