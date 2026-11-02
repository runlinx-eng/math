import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONCEPT_EXPLANATIONS,conceptHelpFor} from '../dist/concept-explanations.js';
import {makeKnowledgeNames} from '../dist/spatial-names.js';

const source=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url)));
const byId=new Map(source.nodes.map(n=>[n.id,n]));
const samples=Object.entries(CONCEPT_EXPLANATIONS);

test('twenty-two exact-source explanation samples preserve identities and distinct concept goals',()=>{
  assert.equal(samples.length,22);
  for(const [id,copy] of samples){
    assert.ok(byId.has(id),'sample must reference source node: '+id);
    assert.equal(conceptHelpFor(id),copy);
    for(const field of ['formal','definition','simpler','example','counterexample','tryIt','why']){
      assert.equal(typeof copy[field],'string',id+' '+field);
      assert.ok(copy[field].trim().length>=(field==='formal'?2:10),id+' '+field);
      assert.doesNotMatch(copy[field],/已掌握|你已学会|点击即完成/);
    }
  }
  assert.equal(conceptHelpFor('unknown-source-node'),null);
  assert.equal(byId.get('mt_Ep7TDFuYUa').title,'数轴上的等值分数');
  assert.equal(byId.get('mt_FP-mjXaq3B').title,'等值分数');
  assert.notEqual(conceptHelpFor('mt_Ep7TDFuYUa').definition,conceptHelpFor('mt_FP-mjXaq3B').definition);
});
test('explanation samples cover conceptual, procedural, representational, and language source types',()=>{
  const types=new Set(samples.map(([id])=>byId.get(id).type));
  for(const type of ['CONCEPTUAL','PROCEDURAL','REPRESENTATIONAL','LANGUAGE','META'])assert.ok(types.has(type),type+' source type is represented');
});
test('new samples preserve the key mathematical distinctions in their source goals',()=>{
  assert.match(conceptHelpFor('mt_THl9GLxwoL').definition,/十位.*几个十.*个位.*几个一/);
  assert.match(conceptHelpFor('mt_LpSuPgL31x').definition,/平均分.*按每组指定的数量分组/);
  assert.match(conceptHelpFor('mt_DOe893F6gN').definition,/长度.*厘米或米.*质量.*克或千克/);
  assert.match(conceptHelpFor('mt_-3udyo6VyB').example,/y＝2x＋1.*\(0，1\).*\(1，3\).*\(2，5\)/);
  assert.equal(conceptHelpFor('mt_-3udyo6VyB').visual,'linear-function-graph');
  assert.match(conceptHelpFor('mt_8RmpkDxT9L').definition,/等号.*数量相同/);
  assert.match(conceptHelpFor('mt_vKcxX6iNOA').definition,/分母.*平均分成几份.*分子.*取其中几份.*不能为 0/);
  assert.match(conceptHelpFor('mt_8atyuvPUZc').counterexample,/不等于.*造成/);
  assert.match(conceptHelpFor('mt_mqgu72aCMz').counterexample,/平行且不重合时无解.*重合时有无数个解/);
  assert.match(conceptHelpFor('mt_Qcp2d_kuta').definition,/三维空间.*长、宽、高.*正方体.*长方体/);
  assert.match(conceptHelpFor('mt_Qcp2d_kuta').counterexample,/圆是平面图形，球是立体图形/);
  assert.match(conceptHelpFor('mt_yK51ZnKA8m').definition,/按顺序.*倍数关系.*同时乘或除以同一个正数/);
  assert.match(conceptHelpFor('mt_yK51ZnKA8m').counterexample,/2\/7，不是 2\/5/);
  assert.match(conceptHelpFor('mt_KaF0SQvaiu').definition,/大小相同的单位.*0 刻度.*数值和单位/);
  assert.match(conceptHelpFor('mt_KaF0SQvaiu').counterexample,/留了空隙或互相重叠.*实际长度是 15 厘米/);
  assert.match(conceptHelpFor('mt_PNSyfH56eQ').definition,/p%.*p\/100.*原数量/);
  assert.match(conceptHelpFor('mt_PNSyfH56eQ').example,/360 的 15%.*36＋18＝54/);
  assert.match(conceptHelpFor('mt_Sij9ByyHq6').definition,/体积.*立方单位.*表面积.*平方单位.*外露面/);
  assert.match(conceptHelpFor('mt_Sij9ByyHq6').example,/40 立方厘米.*80 平方厘米/);
  assert.match(conceptHelpFor('mt_1badik7iKJ').definition,/1:50.*实际 50 个相同的长度单位.*统一单位/);
  assert.match(conceptHelpFor('mt_1badik7iKJ').example,/9×50＝450 厘米.*4.5 米/);
});
test('meta samples explain strategy selection, verification, and investigation limits',()=>{
  assert.match(conceptHelpFor('mt_QaYfeVL-0C').definition,/四舍五入.*大致范围.*逆运算.*合理/);
  assert.match(conceptHelpFor('mt_SHVyE1CLUa').definition,/提出清楚的问题.*向谁收集.*怎样收集.*结论的限制/);
  assert.match(conceptHelpFor('mt_SHVyE1CLUa').counterexample,/样本可能不具代表性/);
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
