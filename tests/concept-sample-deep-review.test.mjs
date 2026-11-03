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
 assert.equal(sampleIds.size,55);
 assert.ok([...new Set(sampleReview.records.map(record=>record.id))].every(id=>sampleIds.has(id)));
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

test('85 research gaps match taxonomy and plan, with correct phase and B01/B02/B03/B04 review accounting',()=>{
 assert.equal(researchFalse.size,85);
 assert.equal(gapIds.size,85);
 assert.deepEqual(researchFalse,gapIds);
 assert.equal(researchTriage.records.length,85);
 assert.deepEqual(new Set(researchTriage.records.map(record=>record.id)),researchFalse);
 assert.equal(researchTriage.summary.total,85);
 assert.equal(researchTriage.summary.knowledgeMapNodes,83);
 assert.equal(researchTriage.summary.mathThinkingNodes,2);
 assert.equal(researchTriage.summary.knowledgeMapWithSamples,12);
 assert.equal(researchTriage.summary.knowledgeMapWithoutSamples,71);
 assert.equal(researchTriage.summary.phaseCounts[2],2);
 assert.equal(researchTriage.summary.phaseCounts[4],7);
 assert.equal(researchTriage.summary.phaseCounts[5],76);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInThisPass,7);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB01,2);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB02,1);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB03,1);
 assert.equal(researchTriage.summary.nodesWithExternalSourcesVerified,12);
 assert.equal(researchTriage.summary.nodesWithResearchReviewedWithoutExplanation,0);
 assert.equal(researchTriage.summary.remainingUnverifiedKnowledgeMapNodesWithoutSamples,71);
 assert.equal(researchTriage.summary.remainingUnverifiedMathThinkingNodes,2);
 assert.deepEqual(researchTriage.summary.researchBatchesExternallyReviewed,['B01','B02','B03','B04']);
 assert.equal(researchTriage.summary.nodesWithSourceCoverageRevisions,7);
 assert.equal(researchTriage.records.filter(record=>record.externalSourcesVerified===true).length,12);
 assert.equal(researchTriage.records.filter(record=>record.externalSourcesVerified!==true).length,73);
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='external_sources_reviewed_not_independently_math_validated').length,7);
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='external_sources_reviewed_B01_2026-11-03').length,2);
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='external_sources_reviewed_B02_2026-11-03').length,1);
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='external_sources_reviewed_B03_2026-11-03').length,1);
  assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB04,1);
  const b04=researchTriage.records.find(record=>record.id==='mt_iykH2P5oFq');
  assert.ok(b04);
  assert.equal(b04.externalSourcesVerified,true);
  assert.equal(b04.externalSourceIds.length,5);
  assert.equal(b04.explanationSamplePresent,true);
  assert.equal(b04.researchVerificationStatus,'external_sources_reviewed_B04_2026-11-03');
  assert.equal(b04.nextAction,'independent_content_and_math_review_before_acceptance');
  assert.equal(b04.explanationDraftStatus,'ai_draft_self_checked_pending_independent_review');
  assert.equal(b04.independentMathReviewStatus,'not_completed');
  assert.equal(b04.childUnderstandingStatus,'not_tested');
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='not_verified_in_this_pass').length,73);
 const b01Ids=new Set(['mt_ebQURBOsM5','mt__yvsKKp3TS']);
 for(const id of b01Ids){const record=researchTriage.records.find(item=>item.id===id);assert.ok(record,id);assert.equal(record.externalSourcesVerified,true);assert.equal(record.explanationSamplePresent,true);assert.equal(record.nextAction,'independent_content_and_math_review_before_acceptance');}
 const b02Record=researchTriage.records.find(item=>item.id==='mt_NSC3LT_-ch');
 assert.ok(b02Record);assert.equal(b02Record.externalSourcesVerified,true);assert.equal(b02Record.explanationSamplePresent,true);
 assert.equal(b02Record.researchVerificationStatus,'external_sources_reviewed_B02_2026-11-03');
 assert.equal(b02Record.nextAction,'independent_content_and_math_review_before_acceptance');assert.equal(b02Record.externalSourceIds.length,6);
 assert.equal(b02Record.explanationDraftStatus,'ai_draft_self_checked_pending_independent_review');
 assert.equal(b02Record.independentMathReviewStatus,'not_completed');
 assert.equal(b02Record.childUnderstandingStatus,'not_tested');
 const b03Record=researchTriage.records.find(item=>item.id==='mt_gC-6JXAG5S');
 assert.ok(b03Record);assert.equal(b03Record.externalSourcesVerified,true);assert.equal(b03Record.explanationSamplePresent,true);
 assert.equal(b03Record.researchVerificationStatus,'external_sources_reviewed_B03_2026-11-03');
 assert.equal(b03Record.nextAction,'independent_content_and_math_review_before_acceptance');assert.equal(b03Record.externalSourceIds.length,4);
 assert.equal(b03Record.explanationDraftStatus,'ai_draft_self_checked_pending_independent_review');
 assert.equal(b03Record.independentMathReviewStatus,'not_completed');
 assert.equal(b03Record.childUnderstandingStatus,'not_tested');
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

test('sample and research review scope stays separate from the 487 unconfigured explanations',()=>{
 assert.equal(knowledge.length,537);
 assert.equal(sampleIds.size,50);
 assert.equal(knowledge.length-sampleIds.size,482);
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


test('B02 capacity research record tracks the completed first draft',()=>{
 const b02=JSON.parse(fs.readFileSync(new URL('../docs/language/CONCEPT-RESEARCH-B02.json',import.meta.url),'utf8'));
 assert.equal(b02.batchId,'B02');
 assert.equal(b02.summary.nodesReviewed,1);
 assert.equal(b02.summary.externalSourcesCatalogued,6);
 assert.equal(b02.summary.explanationDraftsCreated,1);
 assert.equal(b02.summary.explanationDraftsPendingIndependentReview,1);
 const node=b02.records.find(item=>item.id==='mt_NSC3LT_-ch');
 assert.ok(node);
 assert.equal(node.sourceIds.length,6);
 assert.match(node.coverageAudit.join(' '),/30 mL, 300 mL and 3 L/);
 assert.match(node.coverageAudit.join(' '),/500 mL/);
 assert.match(node.relationshipBoundary,/No new dependency/);
});

test('B03 fractions research record tracks the completed first draft and preserves equal-part boundaries',()=>{
 const b03=JSON.parse(fs.readFileSync(new URL('../docs/language/CONCEPT-RESEARCH-B03.json',import.meta.url),'utf8'));
 assert.equal(b03.batchId,'B03');
 assert.equal(b03.summary.nodesReviewed,1);
 assert.equal(b03.summary.externalSourcesCatalogued,4);
 assert.equal(b03.summary.explanationDraftsCreated,1);
 assert.equal(b03.summary.explanationDraftsPendingIndependentReview,1);
 const node=b03.records.find(item=>item.id==='mt_gC-6JXAG5S');
 assert.ok(node);
 assert.equal(node.sourceIds.length,4);
 assert.match(node.coverageAudit.join(' '),/1\/4.*2\/8|2\/8.*1\/4/);
 assert.match(node.coverageAudit.join(' '),/same whole/);
 assert.match(node.knownRisks.join(' '),/congruent shapes/);
 assert.match(node.relationshipBoundary,/No new dependency/);
});


test('B01 and B04 research records distinguish draft completion from independent acceptance',()=>{
 const b01=JSON.parse(fs.readFileSync(new URL('../docs/language/CONCEPT-RESEARCH-B01.json',import.meta.url),'utf8'));
 const b04=JSON.parse(fs.readFileSync(new URL('../docs/language/CONCEPT-RESEARCH-B04.json',import.meta.url),'utf8'));
 assert.equal(b01.summary.explanationDraftsCreated,2);
 assert.equal(b01.summary.explanationDraftsPendingIndependentReview,2);
 assert.equal(b04.summary.explanationDraftsCreated,1);
 assert.equal(b04.summary.explanationDraftsPendingIndependentReview,1);
 for(const record of [...b01.records,...b04.records]){
  assert.equal(record.explanationDraftCreated,true);
  assert.equal(record.explanationDraftStatus,'ai_draft_self_checked_pending_independent_review');
  assert.equal(record.independentMathReviewStatus,'not_completed');
  assert.equal(record.childUnderstandingStatus,'not_tested');
 }
});


test('research triage JSON and Markdown stay aligned with source gaps and configured explanations',()=>{
 const triageMarkdown=fs.readFileSync(new URL('../docs/language/CONCEPT-RESEARCH-TRIAGE.md',import.meta.url),'utf8');
 const knowledgeGaps=researchTriage.records.filter(record=>record.scope==='knowledge_map');
 const externallyVerified=researchTriage.records.filter(record=>record.externalSourcesVerified===true);
 assert.equal(researchTriage.records.length,85);
 assert.equal(knowledgeGaps.length,83);
 assert.equal(externallyVerified.length,12);
 assert.equal(researchTriage.summary.nodesWithExternalSourcesVerified,externallyVerified.length);
 assert.equal(researchTriage.summary.nodesWithResearchReviewedWithoutExplanation,
  externallyVerified.filter(record=>!sampleIds.has(record.id)).length);
 for(const record of researchTriage.records){
  assert.equal(record.explanationSamplePresent,sampleIds.has(record.id),
   'triage sample flag must match explanation module: '+record.id);
 }
 for(const [type,summary] of Object.entries(researchTriage.summary.byType)){
  const records=knowledgeGaps.filter(record=>record.type===type);
  const withSample=records.filter(record=>sampleIds.has(record.id)).length;
  assert.equal(summary.total,records.length,type+' total');
  assert.equal(summary.withSample,withSample,type+' withSample');
  assert.equal(summary.withoutSample,records.length-withSample,type+' withoutSample');
  assert.ok(triageMarkdown.includes('| '+type+' | '+records.length+' | '+withSample+' | '+(records.length-withSample)+' |'),
   type+' Markdown row must match triage records');
 }
 for(const [domain,summary] of Object.entries(researchTriage.summary.byDomain)){
  const records=knowledgeGaps.filter(record=>record.domainId===domain);
  const withSample=records.filter(record=>sampleIds.has(record.id)).length;
  assert.equal(summary.total,records.length,domain+' total');
  assert.equal(summary.withSample,withSample,domain+' withSample');
  assert.equal(summary.withoutSample,records.length-withSample,domain+' withoutSample');
  assert.ok(triageMarkdown.includes('| '+summary.title+'（'+domain+'） | '+records.length+' | '+withSample+' | '+(records.length-withSample)+' |'),
   domain+' Markdown row must match triage records');
 }
 const remainingStart=triageMarkdown.indexOf('## 71 个尚无样板的知识地图节点');
 const thinkingStart=triageMarkdown.indexOf('## 2 个数学思维节点',remainingStart);
 assert.ok(remainingStart>=0&&thinkingStart>remainingStart);
 const remainingSection=triageMarkdown.slice(remainingStart,thinkingStart);
 const remainingIds=[...remainingSection.matchAll(/`(mt_[^`]+)`/g)].map(match=>match[1]);
 assert.equal(remainingIds.length,71);
 assert.ok(remainingIds.every(id=>!sampleIds.has(id)));
 assert.ok(triageMarkdown.includes("**12个来源核查完成；73个尚未核查**"));
});
