import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildStructureGuide,linkedSuggestions,GUIDE_ID,GUIDE_STEP_COUNT} from '../dist/spatial-guide.js';
import {lessonForTopic} from '../dist/learning/catalog.js';
import {fresh,validate,backup,parseBackup,merge,completionSummary} from '../dist/exploration-core.js';
import {addQuestion} from '../dist/learning/daily.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const inventory=JSON.parse(fs.readFileSync(new URL('../docs/spatial-learning/inventory.json',import.meta.url)));

test('the optional orientation highlights only actual critical source relations',()=>{
  const steps=buildStructureGuide(atlas),hard=new Set(atlas.edges.filter(e=>e.strength==='hard').map(e=>e.prerequisiteId+'>'+e.topicId));
  assert.equal(steps.length,5);assert.equal(GUIDE_STEP_COUNT,5);
  for(const step of steps){assert.ok(lessonForTopic(step.anchor));assert.ok(step.nodes.includes(step.anchor));for(const e of step.edges)assert.ok(hard.has(e.prerequisiteId+'>'+e.topicId));}
  assert.equal(steps[0].anchor,'mt_WcfaSfVT33');assert.equal(steps[0].overview,true);assert.equal(steps[0].edges.length,0);assert.deepEqual(steps[0].nodes,[]);assert.equal(steps[1].edges.length,3);assert.equal(steps[2].edges.length,2);assert.equal(steps[3].edges.length,2);assert.equal(steps[4].edges.length,2);
  const broken={...atlas,edges:atlas.edges.filter(e=>!(e.prerequisiteId===steps[1].edges[0].prerequisiteId&&e.topicId===steps[1].edges[0].topicId))};
  assert.throws(()=>buildStructureGuide(broken),/当前来源不一致/);
});

test('suggestions across all source nodes use only actual outgoing edges and available activities',()=>{
  const all=new Set(atlas.edges.map(e=>e.prerequisiteId+'>'+e.topicId));
  for(const node of atlas.nodes){const result=linkedSuggestions(atlas,node.id,{hasActivity:id=>!!lessonForTopic(id)});for(const e of result){assert.equal(e.prerequisiteId,node.id);assert.ok(all.has(e.prerequisiteId+'>'+e.topicId));assert.ok(lessonForTopic(e.topicId));}}
  const root='mt_WcfaSfVT33',items=linkedSuggestions(atlas,root),target=items.at(-1).topicId;
  assert.equal(linkedSuggestions(atlas,root,{pendingNodes:[target],isComplete:id=>id===target})[0].topicId,target);
  assert.deepEqual(linkedSuggestions(atlas,'unknown'),[]);
  const nodes=new Map(atlas.nodes.map(n=>[n.id,n])),unjoined=new Set(inventory.edges.filter(e=>!e.jointActivities.length).map(e=>e.from+'>'+e.to));
  for(const edge of [atlas.edges.find(e=>nodes.get(e.prerequisiteId).themeId!==nodes.get(e.topicId).themeId),atlas.edges.find(e=>nodes.get(e.prerequisiteId).domainId==='thinking'),atlas.edges.find(e=>unjoined.has(e.prerequisiteId+'>'+e.topicId))]){
    assert.ok(edge);assert.ok(linkedSuggestions(atlas,edge.prerequisiteId,{hasActivity:id=>!!lessonForTopic(id)}).some(e=>e.topicId===edge.topicId&&e.strength===edge.strength));
  }
});

test('orientation progress is separate from learning completion and survives safe backup merges',()=>{
  const base=fresh(),before=completionSummary(base),older=structuredClone(base),newer=structuredClone(base);
  older.daily.guide={id:GUIDE_ID,step:1,active:true,updatedAt:'2026-10-30T10:00:00.000Z'};
  newer.daily.guide={id:GUIDE_ID,step:3,active:false,updatedAt:'2026-10-31T10:00:00.000Z'};
  const validated=validate(older,atlas);assert.deepEqual(completionSummary(validated),before);
  assert.deepEqual(parseBackup(JSON.stringify(backup(validated)),atlas).daily.guide,older.daily.guide);
  assert.deepEqual(merge(validate(newer,atlas),validated).daily.guide,newer.daily.guide);
  assert.deepEqual(merge(validated,validate(newer,atlas)).daily.guide,newer.daily.guide);
  assert.deepEqual(merge(validate(newer,atlas),fresh()).daily.guide,newer.daily.guide);
  for(const patch of [{step:5},{step:-1},{active:'yes'},{id:'unknown'},{updatedAt:'bad'}]){const bad=structuredClone(older);Object.assign(bad.daily.guide,patch);assert.throws(()=>validate(bad,atlas),/每日学习记录无效/);}
});

test('a question in the orientation preserves its step without changing older question semantics',()=>{
  const state=fresh(),id='mt_WcfaSfVT33',world={position:[100,100,2200],target:[0,0,0],selected:'node:'+id,layout:'network',networkVersion:53,networkView:'oblique',cameraZoom:1,edgeDisplay:'outline',guideStep:0};
  addQuestion(state,'为什么这里会分开？',{nodeId:id,world});assert.deepEqual(parseBackup(JSON.stringify(backup(validate(state,atlas))),atlas).daily.questions[0].world,world);
  for(const patch of [{guideStep:5},{guideStep:-1},{guideStep:'1'},{networkVersion:49}]){const bad=structuredClone(state);Object.assign(bad.daily.questions[0].world,patch);assert.throws(()=>validate(bad,atlas),/空间位置无效/);}
});
