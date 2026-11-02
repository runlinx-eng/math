import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONCEPT_EXPLANATIONS} from '../dist/concept-explanations.js';

const source=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url)));
const mapNodes=source.nodes.filter(node=>node.domainId!=='thinking');
const byId=new Map(mapNodes.map(node=>[node.id,node]));
const samples=Object.entries(CONCEPT_EXPLANATIONS);
const coverage=fs.readFileSync(new URL('../docs/language/CONCEPT-EXPLANATION-COVERAGE.md',import.meta.url),'utf8');

const typeLabels={
  CONCEPTUAL:'CONCEPTUAL 概念型',
  PROCEDURAL:'PROCEDURAL 操作型',
  REPRESENTATIONAL:'REPRESENTATIONAL 表示型',
  LANGUAGE:'LANGUAGE 语言型',
  META:'META 策略型'
};
const domainLabels={
  add:'加减法（add）',
  algebra:'代数（algebra）',
  chance:'概率（chance）',
  counting:'计数（counting）',
  data:'数据与统计（data）',
  fractions:'分数（fractions）',
  geometry:'几何（geometry）',
  measure:'测量（measure）',
  multiply:'乘法与除法（multiply）',
  place:'数的表示与数位值（place）',
  ratio:'比与比例（ratio）'
};

test('coverage ledger matches every implemented sample and source distribution',()=>{
  assert.equal(source.nodes.length,587);
  assert.equal(mapNodes.length,537);
  assert.equal(samples.length,39);
  assert.equal(new Set(samples.map(([id])=>id)).size,39);
  assert.ok(samples.every(([id])=>byId.has(id),'every explanation must map to a knowledge-map source node');

  for(const [type,label] of Object.entries(typeLabels)){
    const total=mapNodes.filter(node=>node.type===type).length;
    const covered=samples.filter(([id])=>byId.get(id).type===type).length;
    const rate=(covered/total*100).toFixed(1);
    assert.ok(coverage.includes(`| ${label} | ${total} | ${covered} | ${total-covered} | ${rate}% |`),label+' row must match source-derived counts');
  }

  let domainTotal=0,domainCovered=0;
  for(const [domain,label] of Object.entries(domainLabels)){
    const total=mapNodes.filter(node=>node.domainId===domain).length;
    const covered=samples.filter(([id])=>byId.get(id).domainId===domain).length;
    domainTotal+=total;
    domainCovered+=covered;
    assert.ok(coverage.includes(`| ${label} | ${total} | ${covered} | ${total-covered} |`),label+' row must match source-derived counts');
  }
  assert.equal(domainTotal,537);
  assert.equal(domainCovered,39);

  const visualCount=samples.filter(([,item])=>Boolean(item.visual)).length;
  assert.equal(visualCount,15);
  assert.ok(coverage.includes('| **合计** | **537** | **39** | **498** | **7.3%** |'));
  assert.ok(coverage.includes(`当前有 **${visualCount} 个样板节点**提供真实 SVG 图示`));
});
