import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {traceCritical} from '../dist/spatial-trace.js';
import {NODE_QUALIFIERS,makeKnowledgeNames} from '../dist/spatial-names.js';
import {relationExplanation,reviewedRelationKeys} from '../dist/spatial-reasons.js';
import {fresh,validate,backup,parseBackup} from '../dist/exploration-core.js';
import {addQuestion} from '../dist/learning/daily.js';
import {parseView,LAYOUT_VERSION} from '../dist/spatial-model.js';
import {buildGlobalSpace} from '../dist/spatial-global.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));

test('critical tracing follows branches, keeps cross links and uses shortest hops without soft edges',()=>{
  const nodes=['a','b','c','d','x'].map(id=>({id})),edge=(a,b,strength='hard')=>({prerequisiteId:a,topicId:b,strength});
  const edges=[edge('a','b'),edge('a','c'),edge('b','c'),edge('c','d'),edge('a','d'),edge('x','d','soft')],map={nodes,edges};
  const before=traceCritical(map,'d','before');assert.deepEqual(Object.fromEntries(before.distances),{d:0,c:1,a:1,b:2});
  assert.deepEqual(new Set(before.nodes),new Set(['a','b','c']));assert.deepEqual(before.edges,edges.slice(0,5));
  const after=traceCritical(map,'a','after');assert.deepEqual(new Set(after.nodes),new Set(['b','c','d']));assert.deepEqual(after.edges,edges.slice(0,5));
  assert.deepEqual(traceCritical(map,'missing','before').nodes,[]);
});

test('the three equivalent-fraction concepts preserve the real graph counts in both directions',()=>{
  for(const [id,before,after] of [['mt_FbDKeLfBCo',9,74],['mt_FP-mjXaq3B',17,72],['mt_ebPelt-qAl',18,71]]){
    for(const [side,count] of [['before',before],['after',after]]){
      const trace=traceCritical(atlas,id,side),ids=new Set([id,...trace.nodes]);assert.equal(trace.nodes.length,count);
      assert.deepEqual(trace.edges,atlas.edges.filter(e=>e.strength==='hard'&&ids.has(e.prerequisiteId)&&ids.has(e.topicId)));
      assert.equal(new Set(trace.nodes).size,count);assert.ok(!trace.nodes.includes(id));
    }
  }
});

test('all 130 repeated names get unique local mathematical qualifiers without renaming source objects',()=>{
  const before=JSON.stringify(atlas),counts=new Map();for(const n of atlas.nodes)counts.set(n.title,(counts.get(n.title)||0)+1);
  const repeated=atlas.nodes.filter(n=>counts.get(n.title)>1),names=makeKnowledgeNames(atlas);
  assert.equal(repeated.length,130);assert.equal(Object.keys(NODE_QUALIFIERS).length,130);
  assert.equal(new Set(repeated.map(n=>names.get(n.id))).size,130);
  assert.equal(new Set(names.values()).size,587);
  assert.ok(repeated.every(n=>NODE_QUALIFIERS[n.id]&&names.get(n.id).startsWith(n.title+' · ')));
  assert.equal(names.get('mt_FbDKeLfBCo'),'等值分数 · 看图识别');assert.equal(names.get('mt_FP-mjXaq3B'),'等值分数 · 细分与合并');assert.equal(names.get('mt_ebPelt-qAl'),'等值分数 · 同倍变化');
  assert.equal(JSON.stringify(atlas),before);
});

test('reviewed explanations are bound to real edges and exact source reasons; missing reasons remain unreviewed',()=>{
  const keys=reviewedRelationKeys();assert.equal(new Set(keys).size,keys.length);assert.equal(keys.length,atlas.edges.length);
  for(const key of keys){const e=atlas.edges.find(e=>e.prerequisiteId+'>'+e.topicId===key);assert.ok(e);assert.ok(relationExplanation(e).reviewed);assert.ok(relationExplanation(e).text);assert.deepEqual(relationExplanation({...e,reason:e.reason+' changed'}),{text:null,reviewed:false});}
  assert.deepEqual(relationExplanation({prerequisiteId:'not-a-source',topicId:'unknown',reason:'new source'}),{text:null,reviewed:false});
});

test('trace scope and scroll survive world and question validation, while older snapshots stay valid',()=>{
  const id='mt_ebPelt-qAl',world={position:[100,100,2200],target:[0,0,0],selected:'node:'+id,layout:'network',networkVersion:49,networkView:'oblique',cameraZoom:1.35,traceMode:'before',traceScroll:240};
  const s=fresh();addQuestion(s,'为什么它们相等？',{nodeId:id,world});assert.deepEqual(parseBackup(JSON.stringify(backup(validate(s,atlas))),atlas).daily.questions[0].world,world);
  for(const patch of [{traceMode:'wrong'},{traceScroll:-1},{traceScroll:Infinity},{networkVersion:48}]){const bad=structuredClone(s);Object.assign(bad.daily.questions[0].world,patch);assert.throws(()=>validate(bad,atlas),/空间位置无效/);}
  const view=parseView({...world,version:LAYOUT_VERSION},buildGlobalSpace(atlas));assert.equal(view.traceMode,'before');assert.equal(view.traceScroll,240);
  const old=parseView({...world,traceMode:undefined,traceScroll:undefined,version:LAYOUT_VERSION},buildGlobalSpace(atlas));assert.equal(old.traceMode,undefined);
});
