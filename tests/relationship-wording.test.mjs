import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relationExplanation,reviewedRelationKeys} from '../dist/spatial-reasons.js';
import {RELATION_COPY,relationHeading,relationStrength} from '../dist/navigation-copy.js';
import {makeKnowledgeNames} from '../dist/spatial-names.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const math=JSON.parse(read('dist/data/math.json'));
test('source math relations remain directional and fully traceable',()=>{
  assert.equal(math.nodes.length,587);
  assert.equal(math.edges.length,1223);
  assert.equal(math.edges.filter(e=>e.strength==='hard').length,851);
  assert.equal(math.edges.filter(e=>e.strength==='soft').length,372);
  const keys=new Set(reviewedRelationKeys());
  assert.equal(keys.size,1223);
  for(const edge of math.edges){
    assert.ok(keys.has(edge.prerequisiteId+'>'+edge.topicId));
    const explanation=relationExplanation(edge);
    assert.equal(explanation.reviewed,true,'exact source reason must match its keyed translation');
    assert.ok(explanation.text?.trim(),'Chinese rationale must not be empty');
    assert.equal(relationExplanation({...edge,reason:edge.reason+' changed'}).reviewed,false);
  }
});
test('relationship headings distinguish direction from required/optional link strength',()=>{
  assert.equal(relationHeading('before'),'相关基础');
  assert.equal(relationHeading('after'),'相关后续');
  assert.equal(relationStrength('hard'),'关键基础');
  assert.equal(relationStrength('soft'),'辅助联系');
  assert.notEqual(RELATION_COPY.before,RELATION_COPY.hard);
});
test('both map views share exact revised source titles, preserve original searches and task semantics',()=>{
  const space=read('dist/space.js');
  const olderView=read('dist/exploration.js');
  const labels=makeKnowledgeNames({nodes:math.nodes});
  assert.equal(labels.get('mt_e8CZ7E5qW7'),'凑成10的数的分与合');
  assert.match(space,/relationHeading\(side\)/);
  assert.match(olderView,/relationHeading\('before'\)/);
  assert.match(olderView,/relationHeading\('after'\)/);
  assert.match(olderView,/knowledgeNames=makeKnowledgeNames\(atlas\)/);
  assert.match(olderView,/n\.title\+' '\+n\.name\+' '\+displayNode\(n\)/);
  assert.doesNotMatch(space,/这里会用到|还会连到哪里/);
  assert.doesNotMatch(olderView,/探索包/);
  assert.match(olderView,/活动完成 \$\{s\.done\} \/ \$\{s\.total\}/);
  assert.match(olderView,/不代表所有源目标都已完整评估/);
});
