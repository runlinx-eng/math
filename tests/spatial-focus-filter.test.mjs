import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildFocusFilter} from '../dist/spatial-focus-filter.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const ids=new Set(atlas.nodes.filter(n=>n.domainId!=='thinking').map(n=>n.id));
const ROOT='mt_WcfaSfVT33';
const edgeIds=new Set(atlas.edges.filter(e=>ids.has(e.prerequisiteId)&&ids.has(e.topicId)).map(e=>e.prerequisiteId+'>'+e.topicId));

test('direct filters show only genuine immediate neighbors and all edges among them',()=>{
 for(const direction of ['both','before','after']){
  const view=buildFocusFilter(atlas,ids,ROOT,direction,'1');
  assert.ok(view.ids.has(ROOT));assert.equal(view.counts.nodes+view.counts.hidden,537);
  assert.ok(view.links.every(e=>edgeIds.has(e.prerequisiteId+'>'+e.topicId)));
  for(const id of view.ids){
   if(id===ROOT)continue;
   assert.ok(atlas.edges.some(e=>direction!=='after'&&e.topicId===ROOT&&e.prerequisiteId===id||
      direction!=='before'&&e.prerequisiteId===ROOT&&e.topicId===id),'direct neighbor is a source relation');
  }
 }
});
test('two-hop and complete relation filters grow monotonically without making fake edges',()=>{
 for(const direction of ['both','before','after']){
  const a=buildFocusFilter(atlas,ids,ROOT,direction,'1'),b=buildFocusFilter(atlas,ids,ROOT,direction,'2'),c=buildFocusFilter(atlas,ids,ROOT,direction,'all');
  assert.ok(a.ids.size<=b.ids.size&&b.ids.size<=c.ids.size);
  for(const id of a.ids)assert.ok(b.ids.has(id));
  for(const id of b.ids)assert.ok(c.ids.has(id));
  for(const view of [a,b,c]){
   assert.equal(view.counts.nodes,view.ids.size);
   assert.equal(view.counts.edges,view.links.length);
   assert.ok(view.links.every(e=>view.ids.has(e.prerequisiteId)&&view.ids.has(e.topicId)&&edgeIds.has(e.prerequisiteId+'>'+e.topicId)));
  }
 }
});
test('auxiliary links show as direct association but never extend a hard prerequisite chain',()=>{
 const graph={edges:[
   {prerequisiteId:'A',topicId:'B',strength:'soft'},
   {prerequisiteId:'B',topicId:'C',strength:'hard'},
   {prerequisiteId:'C',topicId:'D',strength:'hard'},
   {prerequisiteId:'D',topicId:'E',strength:'soft'},
   {prerequisiteId:'C',topicId:'A',strength:'hard'}]};
 const located=new Set(['A','B','C','D','E']);
 const one=buildFocusFilter(graph,located,'A','after','1'),two=buildFocusFilter(graph,located,'A','after','2'),all=buildFocusFilter(graph,located,'A','after','all');
 assert.deepEqual([...one.ids].sort(),['A','B']);
 assert.deepEqual([...two.ids].sort(),['A','B','C']);
 assert.ok(all.ids.has('D'));
 assert.ok(!all.ids.has('E'),'remote auxiliary links must not become invented multi-hop prerequisites');
 assert.ok(two.links.every(e=>e.prerequisiteId==='A'||e.prerequisiteId==='B'||e.prerequisiteId==='C'));
});
test('unknown selected IDs do not invent coordinates or nodes',()=>{
 const view=buildFocusFilter(atlas,ids,'nonexistent','both','all');
 assert.equal(view.links.length,0);assert.equal(view.ids.size,0);
});
