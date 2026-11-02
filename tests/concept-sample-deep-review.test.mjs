import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONCEPT_EXPLANATIONS} from '../dist/concept-explanations.js';

const source=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url),'utf8'));
const sampleReview=JSON.parse(fs.readFileSync(new URL('../docs/language/CONCEPT-SAMPLE-DEEP-REVIEW.json',import.meta.url),'utf8'));
const researchTriage=JSON.parse(fs.readFileSync(new URL('../docs/language/CONCEPT-RESEARCH-TRIAGE.json',import.meta.url),'utf8'));
const gapPlan=fs.readFileSync(new URL('../docs/content-plan/RESEARCH-GAPS.md',import.meta.url),'utf8');
const knowledge=source.nodes.filter(node=>node.domainId!=='thinking');
const thinking=source.nodes.filter(node=>node.domainId==='thinking');
const sourceById=new Map(source.nodes.map(node=>[node.id,node]));
const sampleIds=new Set(Object.keys(CONCEPT_EXPLANATIONS));
const gapIds=new Set([...gapPlan.matchAll(/源 ID：\x60([^\x60]+)\x60；阶段/g)].map(match=>match[1]));
const researchFalse=new Set(source.nodes.filter(node=>node.hasResearch===false).map(node=>node.id));

test('all 45 samples receive an AI second-pass review without overstating acceptance',()=>{
 assert.equal(sampleReview.records.length,45);
 assert.equal(sampleIds.size,45);
 assert.deepEqual(new Set(sampleReview.records.map(record=>record.id)),sampleIds);
 assert.equal(sampleReview.summary.samplesReviewed,45);
 assert.equal(sampleReview.summary.revisionsApplied,11);
 assert.equal(sampleReview.summary.samplesWithResearchGap,7);
 assert.equal(sampleReview.summary.samplesWithResearchRecord,38);
 assert.equal(sampleReview.summary.visualsManualReviewPending,15);
 assert.equal(sampleReview.summary.independentMathReviewsCompleted,0);
 assert.equal(sampleReview.summary.childUnderstandingTestsCompleted,0);
 for(const record of sampleReview.records){
  const node=sourceById.get(record.id);
  assert.ok(node);
  assert.equal(record.sourceTitle,node.title);
  assert.equal(record.hasResearch,node.hasResearch);
  assert.equal(record.contentReviewStatus,'ai_second_pass_completed');
  assert.equal(record.independentMathReviewStatus,'not_completed');
  assert.equal(record.childUnderstandingStatus,'not_tested');
  assert.equal(record.researchGateStatus,node.hasResearch===false?'confirmed_missing_teaching_research_record':'teaching_research_record_exists_but_source_validation_still_required');
 }
});

test('85 research gaps exactly match the taxonomy research flags and original plan',()=>{
 assert.equal(researchFalse.size,85);
 assert.equal(gapIds.size,85);
 assert.deepEqual(researchFalse,gapIds);
 assert.equal(researchTriage.records.length,85);
 assert.deepEqual(new Set(researchTriage.records.map(record=>record.id)),researchFalse);
 assert.equal(researchTriage.summary.total,85);
 assert.equal(researchTriage.summary.knowledgeMapNodes,83);
 assert.equal(researchTriage.summary.mathThinkingNodes,2);
 assert.equal(researchTriage.summary.knowledgeMapWithSamples,7);
 assert.equal(researchTriage.summary.knowledgeMapWithoutSamples,76);
 assert.equal(researchTriage.summary.phaseCounts[2],2);
 assert.equal(researchTriage.summary.phaseCounts[4],7);
 assert.equal(researchTriage.summary.phaseCounts[5],76);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInThisPass,0);
 assert.ok(researchTriage.records.every(record=>record.planStatus==='已排期，研究未补齐'));
 assert.ok(researchTriage.records.every(record=>record.researchVerificationStatus==='not_verified_in_this_pass'));
 assert.equal(knowledge.filter(node=>node.hasResearch===false).length,83);
 assert.equal(thinking.filter(node=>node.hasResearch===false).length,2);
});

test('critical second-pass corrections are present in the explanation source',()=>{
 assert.match(CONCEPT_EXPLANATIONS['mt_8VjmxR1yfw'].definition,/箱体被中位数分成两半/);
 assert.match(CONCEPT_EXPLANATIONS['mt_8VjmxR1yfw'].definition,/两条须分别/);
 assert.match(CONCEPT_EXPLANATIONS['mt_yK51ZnKA8m'].definition,/第二个数量记作 x、把第一个数量记作 y/);
 assert.match(CONCEPT_EXPLANATIONS['mt_mqgu72aCMz'].example,/x＋1＝5－x/);
 assert.match(CONCEPT_EXPLANATIONS['mt_eSv_w46u6H'].example,/P\(至少喜欢一项\)/);
 assert.match(CONCEPT_EXPLANATIONS['mt_kLQOzZYrd5'].example,/密度/);
 assert.match(CONCEPT_EXPLANATIONS['mt_Jvg8X0N5u0'].example,/三角形底/);
});

test('sample and research review scope stays separate from the 492 unconfigured explanations',()=>{
 assert.equal(knowledge.length,537);
 assert.equal(sampleIds.size,45);
 assert.equal(knowledge.length-sampleIds.size,492);
 assert.ok(researchTriage.records.filter(record=>record.scope==='math_thinking').every(record=>!sampleIds.has(record.id)));
});
