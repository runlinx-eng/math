import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONCEPT_EXPLANATIONS,conceptHelpFor} from '../dist/concept-explanations.js';
import {makeKnowledgeNames} from '../dist/spatial-names.js';

const source=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url)));
const byId=new Map(source.nodes.map(n=>[n.id,n]));
const samples=Object.entries(CONCEPT_EXPLANATIONS);

test('six exact-source concept samples preserve identities and distinct equivalent-fraction goals',()=>{
  assert.equal(samples.length,6);
  for(const [id,copy] of samples){
    assert.ok(byId.has(id),'sample must reference source node: '+id);
    assert.equal(conceptHelpFor(id),copy);
    for(const field of ['formal','definition','simpler','example','counterexample','tryIt','why']){
      assert.equal(typeof copy[field],'string',id+' '+field);
      assert.ok(copy[field].trim().length>=10,id+' '+field);
      assert.doesNotMatch(copy[field],/已掌握|你已学会|点击即完成/);
    }
  }
  assert.equal(conceptHelpFor('unknown-source-node'),null);
  assert.equal(byId.get('mt_Ep7TDFuYUa').title,'数轴上的等值分数');
  assert.equal(byId.get('mt_FP-mjXaq3B').title,'等值分数');
  assert.notEqual(conceptHelpFor('mt_Ep7TDFuYUa').definition,conceptHelpFor('mt_FP-mjXaq3B').definition);
});
test('source names and node counts remain unchanged; help is supplemental',()=>{
  const canonical=makeKnowledgeNames({nodes:source.nodes});
  assert.equal(source.nodes.length,587);
  assert.equal(source.edges.length,1223);
  assert.ok(canonical.get('mt_Ep7TDFuYUa').includes('数轴上的等值分数'));
  assert.equal(byId.get('mt_WcfaSfVT33').title,'一一对应地数');
  assert.equal(byId.get('mt_6xNmQLzuqm').title,'理解面积');
  assert.ok(conceptHelpFor('mt_UcGn2hjhYU').definition.includes('结果等可能'));
});
