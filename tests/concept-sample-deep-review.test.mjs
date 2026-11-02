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
 assert.equal(sampleReview.summary.revisionsApplied,17);
 assert.equal(sampleReview.summary.revisionOperations,18);
 assert.equal(sampleReview.summary.researchInformedNodesRevised,7);
 assert.equal(sampleReview.summary.samplesWithExternalSourcesReviewed,7);
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
  assert.ok(['ai_second_pass_completed','research_informed_revision_completed'].includes(record.contentReviewStatus));
  assert.equal(record.independentMathReviewStatus,'not_completed');
  assert.equal(record.childUnderstandingStatus,'not_tested');
  assert.equal(record.researchGateStatus,record.externalSourcesVerified?'external_sources_recorded_but_source_taxonomy_flag_remains_false':node.hasResearch===false?'confirmed_missing_teaching_research_record':'teaching_research_record_exists_but_source_validation_still_required');
 }
});

test('85 research gaps match taxonomy and plan, with correct phase and B01 review accounting',()=>{
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
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInThisPass,7);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB01,2);
 assert.equal(researchTriage.summary.nodesWithExternalSourcesVerified,9);
 assert.equal(researchTriage.summary.nodesWithResearchReviewedWithoutExplanation,2);
 assert.equal(researchTriage.summary.nodesWithSourceCoverageRevisions,7);
 assert.equal(researchTriage.records.filter(record=>record.externalSourcesVerified===true).length,9);
 assert.equal(researchTriage.records.filter(record=>record.externalSourcesVerified!==true).length,76);
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='external_sources_reviewed_not_independently_math_validated').length,7);
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='external_sources_reviewed_B01_2026-11-03').length,2);
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='not_verified_in_this_pass').length,76);
 const b01Ids=new Set(['mt_ebQURBOsM5','mt__yvsKKp3TS']);
 for(const id of b01Ids){const record=researchTriage.records.find(item=>item.id===id);assert.ok(record,id);assert.equal(record.externalSourcesVerified,true);assert.equal(record.explanationSamplePresent,false);assert.equal(record.nextAction,'await_authorization_before_explanation_drafting');}
 const phaseBreakdown={};
 for(const record of researchTriage.records){const phase=String(record.phase);phaseBreakdown[phase]??={knowledge_map:0,math_thinking:0};phaseBreakdown[phase][record.scope]++;}
 assert.deepEqual(researchTriage.summary.phaseBreakdownByScope,phaseBreakdown);
 const planPhaseCounts={};
 for(const match of gapPlan.matchAll(/源 ID：\x60[^\x60]+\x60；阶段 (\d+)；状态/g)){planPhaseCounts[match[1]]=(planPhaseCounts[match[1]]??0)+1;}
 assert.deepEqual(researchTriage.summary.phaseCounts,planPhaseCounts);
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


test('seven research-gap samples have external evidence records and actual explanation revisions',()=>{
 const evidence=JSON.parse(fs.readFileSync(new URL('../docs/language/CONCEPT-RESEARCH-EVIDENCE.json',import.meta.url),'utf8'));
 const ids=['mt_SHVyE1CLUa','mt_Sij9ByyHq6','mt_ZfpeI1CFyP','mt_JRzXQl9M7c','mt_oderfUBZPw','mt_8VjmxR1yfw','mt_i2-QaXbyzB'];
 assert.equal(evidence.records.length,7);assert.equal(evidence.sourceCatalog.length,17);assert.equal(evidence.summary.empiricalStudiesOrReports,10);
 for(const id of ids){const record=evidence.records.find(item=>item.id===id);assert.ok(record,id);assert.ok(record.sourceIds.length>0,id);assert.ok(record.revision.length>20,id);assert.equal(record.independentMathReviewStatus,'not_completed');const sample=sampleReview.records.find(item=>item.id===id);assert.equal(sample.externalSourcesVerified,true);assert.equal(sample.revisionApplied,true);}
 assert.match(CONCEPT_EXPLANATIONS['mt_SHVyE1CLUa'].example,/上学夜.*周末夜/);
 assert.match(CONCEPT_EXPLANATIONS['mt_Sij9ByyHq6'].example,/132 平方厘米/);assert.match(CONCEPT_EXPLANATIONS['mt_Sij9ByyHq6'].example,/3 立方米/);
 assert.match(CONCEPT_EXPLANATIONS['mt_ZfpeI1CFyP'].example,/3 厘米/);assert.match(CONCEPT_EXPLANATIONS['mt_ZfpeI1CFyP'].tryIt,/甲的平均绝对偏差为 8 分.*乙的平均绝对偏差为 21 分/);
 assert.match(CONCEPT_EXPLANATIONS['mt_JRzXQl9M7c'].example,/数值 3 出现 4 次/);assert.match(CONCEPT_EXPLANATIONS['mt_oderfUBZPw'].example,/150≤h<160.*6 人.*10 人/);
 assert.match(CONCEPT_EXPLANATIONS['mt_8VjmxR1yfw'].example,/相同的五数概括/);assert.match(CONCEPT_EXPLANATIONS['mt_i2-QaXbyzB'].example,/48 平方厘米.*24 平方厘米.*24 平方厘米/);
});
