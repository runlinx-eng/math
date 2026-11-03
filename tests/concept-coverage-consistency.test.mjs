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
  add:'加法与减法（add）',
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
  assert.equal(samples.length,343);
  assert.equal(new Set(samples.map(([id])=>id)).size,343);
  assert.ok(samples.every(([id])=>byId.has(id)),'every explanation must map to a knowledge-map source node');

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
  assert.equal(domainCovered,343);

  const visualCount=samples.filter(([,item])=>Boolean(item.visual)).length;
  assert.equal(visualCount,15);
  assert.ok(coverage.includes('| **合计** | **537** | **343** | **194** | **63.9%** |'));
  assert.ok(coverage.includes(`当前有 **${visualCount} 个样板节点**提供真实 SVG 图示`));
});


const nameAudit=JSON.parse(fs.readFileSync(new URL('../docs/language/NODE-NAME-AUDIT.json',import.meta.url),'utf8'));
const termsDoc=fs.readFileSync(new URL('../docs/language/TERMS.md',import.meta.url),'utf8');
const duplicateReview=fs.readFileSync(new URL('../docs/language/DUPLICATE-NAME-REVIEW.md',import.meta.url),'utf8');
const uniqueReview=fs.readFileSync(new URL('../docs/language/UNIQUE-NAME-REVIEW.md',import.meta.url),'utf8');
const relationsReview=fs.readFileSync(new URL('../docs/language/RELATIONS-ACTIVITIES-REVIEW.md',import.meta.url),'utf8');
const mainReadme=fs.readFileSync(new URL('../README.md',import.meta.url),'utf8');
const spatialReadme=fs.readFileSync(new URL('../docs/spatial-learning/README.md',import.meta.url),'utf8');

test('language documentation agrees with the machine-readable name audit and current review scope',()=>{
  const entries=nameAudit.entries;
  const count=(predicate)=>entries.filter(predicate).length;
  const correctedDuplicate=count(entry=>entry.class==='corrected'&&entry.qualified===true);
  const correctedUnique=count(entry=>entry.class==='corrected'&&entry.qualified!==true);
  const qualifierReviewed=count(entry=>entry.class==='qualifier_reviewed');
  const uniqueReviewed=count(entry=>entry.class==='source_reviewed');
  const namedExplanationPilots=count(entry=>entry.class==='explanation');
  const explanationPilotEntries=entries.filter(entry=>entry.explanationPilot===true);

  assert.equal(nameAudit.counts.total,source.nodes.length);
  assert.equal(nameAudit.counts.duplicateGroupCount,44);
  assert.equal(nameAudit.counts.duplicateNodes,130);
  assert.equal(nameAudit.counts.byClass.corrected,84);
  assert.equal(nameAudit.counts.byClass.qualifier_reviewed,92);
  assert.equal(nameAudit.counts.byClass.source_reviewed,406);
  assert.equal(nameAudit.counts.byClass.explanation,5);
  assert.equal(correctedDuplicate,38);
  assert.equal(correctedUnique,46);
  assert.equal(qualifierReviewed,92);
  assert.equal(uniqueReviewed,406);
  assert.equal(namedExplanationPilots,5);
  assert.equal(explanationPilotEntries.length,6);
  assert.ok(explanationPilotEntries.every(entry=>CONCEPT_EXPLANATIONS[entry.id]),
    'all six name-audit explanation pilot nodes must exist in the current explanation module');

  assert.match(termsDoc,/343 个节点已有样板或草稿/);
  assert.match(termsDoc,/15 个节点有按概念制作的静态 SVG 图示/);
  assert.doesNotMatch(termsDoc,/35 个节点|11 个节点/);
  assert.match(termsDoc,/84 个展示名修正/);
  assert.match(termsDoc,/重名节点 38 个/);
  assert.match(termsDoc,/非重名节点 46 个/);
  assert.match(termsDoc,/92 个重名限定语/);
  assert.match(termsDoc,/406 个非重名名称/);
  assert.match(termsDoc,/44 条理由已完成专项数学条件核对/);

  assert.match(duplicateReview,/剩余 108 个节点/);
  assert.match(duplicateReview,/16 项需要修正/);
  assert.match(duplicateReview,/92 项暂保留/);
  assert.match(duplicateReview,/前序批次已修正 22 个展示名/);
  assert.match(uniqueReview,/452 个非重名来源节点/);
  assert.match(uniqueReview,/46 项标题过窄/);
  assert.match(uniqueReview,/406 项未发现足够改名的明确依据/);

  assert.match(relationsReview,/本阶段累计 \*\*44 条专项修订\*\*/);
  assert.match(relationsReview,/累计 \*\*39 条专项防回退断言\*\*/);
  assert.doesNotMatch(mainReadme,/重名想法/);
  assert.match(mainReadme,/docs\/language\/TERMS\.md/);
  assert.match(spatialReadme,/44 条/);
  assert.match(spatialReadme,/39 条/);
});


const conceptReviewStandard=fs.readFileSync(new URL('../docs/language/CONCEPT-REVIEW-STANDARD.md',import.meta.url),'utf8');
const conceptPilot=fs.readFileSync(new URL('../docs/language/CONCEPT-PILOT.md',import.meta.url),'utf8');

test('the content review standard and calibration record cover all 60 configured samples',()=>{
  assert.match(conceptReviewStandard,/来源核对/);
  assert.match(conceptReviewStandard,/数学正确/);
  assert.match(conceptReviewStandard,/范围完整/);
  assert.match(conceptReviewStandard,/适龄/);
  assert.match(conceptReviewStandard,/儿童理解/);
  assert.match(conceptPilot,/39 个样板的首轮内容校准/);
  assert.match(conceptPilot,/21 个样板/);
  assert.match(conceptPilot,/7 个研究缺口/);
  for(const [id] of samples){
    assert.ok(conceptPilot.includes(id),'calibration record must retain sample source ID '+id);
  }
  const secondBatchFirstFive=['mt_oqziWKry-L','mt_aPBzD28_mT','mt_3fwYu7imd4','mt_QhFEDyIwSO','mt_XSXnTQoQ4l'];
  const secondBatchSecondFive=['mt_nTL-owFJTF','mt_PgsHGYJMH-','mt_r8XnXwRA6g','mt_KwdjWEmMNo','mt_ilPrU0cbtT'];
  assert.ok(secondBatchFirstFive.every(id=>CONCEPT_EXPLANATIONS[id]&&byId.get(id).hasResearch===true));
  assert.ok(secondBatchSecondFive.every(id=>CONCEPT_EXPLANATIONS[id]&&byId.get(id).hasResearch===true));
  const researchGaps=samples.filter(([id])=>byId.get(id).hasResearch===false).map(([id])=>id);
  assert.equal(researchGaps.length,51);
  assert.match(conceptPilot,/第十一批：B01–B04首批5个解释草稿/);
  assert.match(conceptPilot,/第十二批第一组：已有研究标记的5个节点/);
  assert.match(conceptPilot,/第十二批第二组：已有研究标记的5个节点/);
  assert.match(coverage,/\*\*537\*\* \| \*\*343\*\* \| \*\*194\*\* \| \*\*63\.9%\*\*/);
  for(const id of researchGaps){
    assert.ok(conceptPilot.includes(id),'research-gap list must retain source ID '+id);
  }
});
