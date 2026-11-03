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
 assert.equal(sampleIds.size,399);
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
 assert.equal(researchTriage.summary.knowledgeMapWithSamples,83);
 assert.equal(researchTriage.summary.knowledgeMapWithoutSamples,0);
 assert.equal(researchTriage.summary.phaseCounts[2],2);
 assert.equal(researchTriage.summary.phaseCounts[4],7);
 assert.equal(researchTriage.summary.phaseCounts[5],76);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInThisPass,7);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB01,2);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB02,1);
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB03,1);
 assert.equal(researchTriage.summary.nodesWithExternalSourcesVerified,83);
 assert.equal(researchTriage.summary.nodesWithResearchReviewedWithoutExplanation,0);
 assert.equal(researchTriage.summary.remainingUnverifiedKnowledgeMapNodesWithoutSamples,0);
 assert.equal(researchTriage.summary.remainingUnverifiedMathThinkingNodes,2);
 assert.deepEqual(researchTriage.summary.researchBatchesExternallyReviewed,['B01','B02','B03','B04','B05','B06','B07','B08','B09','B10','B11','B12','B13','B14','B15','B16','B17','B18','B19']);
 assert.equal(researchTriage.summary.nodesWithSourceCoverageRevisions,7);
 assert.equal(researchTriage.records.filter(record=>record.externalSourcesVerified===true).length,83);
 assert.equal(researchTriage.records.filter(record=>record.externalSourcesVerified!==true).length,2);
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
 assert.equal(researchTriage.records.filter(record=>record.researchVerificationStatus==='not_verified_in_this_pass').length,2);
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

test('sample and research review scope stays separate from the 477 unconfigured explanations',()=>{
 assert.equal(knowledge.length,537);
 assert.equal(sampleIds.size,399);
 assert.equal(knowledge.length-sampleIds.size,138);
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
 assert.equal(externallyVerified.length,83);
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
 const remainingStart=triageMarkdown.indexOf('## 0 个尚无样板的知识地图节点');
 const thinkingStart=triageMarkdown.indexOf('## 2 个数学思维节点',remainingStart);
 assert.ok(remainingStart>=0&&thinkingStart>remainingStart);
 const remainingSection=triageMarkdown.slice(remainingStart,thinkingStart);
 const remainingIds=[...remainingSection.matchAll(/`(mt_[^`]+)`/g)].map(match=>match[1]);
 assert.equal(remainingIds.length,0);
 assert.ok(remainingIds.every(id=>!sampleIds.has(id)));
 assert.ok(triageMarkdown.includes("**83个来源核查完成；2个尚未核查**"));
});

test('B05 source-gap drafts retain original source flags and evidence boundaries',()=>{
 const ids=["mt_Y6_cq3UMyy", "mt_biGHAbkoV2", "mt_Eqk6oSbySH", "mt_ZjIFGc6zPW", "mt_W3VOAuFwVw"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B05_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB05,5);
});

test('B06 counting drafts retain source flags and unassessed strategy limits',()=>{
 const ids=["mt_BK5xwkrD5C", "mt_t9BICauBSI", "mt_0ZDouU664X"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B06_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB06,3);
});

test('B07 measurement drafts retain source flags and unassessed strategy limits',()=>{
 const ids=["mt_bnwHo5wfCD", "mt_Jz9UuT8BXW", "mt_MgsDabdnr1", "mt_NM5I3yN-Q6", "mt_CUJr8L5_Wn"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B07_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB07,5);
});

test('B08 algorithm drafts retain source flags and implementation limits',()=>{
 const ids=["mt_zQfWqImxva", "mt_QeKWt4BZn3", "mt_nx4a3kH-59"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B08_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB08,3);
});

test('B09 probability drafts retain source flags and simulation limits',()=>{
 const ids=["mt_dlg6i-Lw0I", "mt_8DT3LXwwH-", "mt_aCwj2PCoRV", "mt_nzdtOLXWWa"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B09_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB09,4);
});

test('B10 data drafts retain source flags and simulated-data limits',()=>{
 const ids=["mt_X53txVXOcG", "mt_QpJydot2Kh", "mt_kxeuXm6EyC", "mt_yrvYKSwSRZ", "mt_TiFjjvBMaY"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B10_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB10,5);
});

test('B11 sampling drafts retain source flags and evidence limits',()=>{
 const ids=["mt_Y6JmLjnfRP", "mt_QHT16CrFO-", "mt_8IsaoMPvod", "mt_4zgPzc6yu5", "mt_6gpryAnpoZ"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B11_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB11,5);
});

test('B12 distribution drafts retain source flags and inference limits',()=>{
 const ids=["mt_OwYms2tB1L", "mt_KCS9GbZgU_", "mt_fQ9Rw10fss", "mt_A2hKhHXgL5", "mt_x7V1qrkiqH"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B12_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB12,5);
});

test('B13 investigation drafts retain source flags and inference limits',()=>{
 const ids=["mt_mn765HbXi1", "mt_O-U263ukg1", "mt_tuEnyrp5Ia", "mt_km4V6d5IAh"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B13_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB13,4);
});

test('B14 geometry drafts retain source flags and activity limits',()=>{
 const ids=["mt_mN4Ye_vtR7", "mt_SK7WntVZ6y", "mt_LBT-9jz7kR", "mt_RdfzwInyAj", "mt_h02-C8PRrj"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B14_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB14,5);
});

test('B15 construction drafts retain source flags and geometry limits',()=>{
 const ids=["mt_h7zVgCDVmx", "mt_61Nhj8W78f", "mt_4bc3EAxhlY"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B15_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB15,3);
});

test('B16 place-value drafts retain source flags and representation limits',()=>{
 const ids=["mt_dJOKkYMsCv", "mt_QguIGVMB1o", "mt_Bt-iORUzdO", "mt_HczwO1sr-y", "mt_F_zEAJ8VIo"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B16_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB16,5);
});

test('B17 grouping drafts retain source flags and tool limits',()=>{
 const ids=["mt_1GDEHyEZYH", "mt_qUjW0N1cYO", "mt_oxfxzbat3k", "mt_NmvuwVUFRS", "mt_bZC-wqWX7Y", "mt_3m0pA-aeat"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B17_2026-11-03');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB17,6);
});

test('B18 measurement drafts retain source flags and tool limits',()=>{
 const ids=["mt_5J2quSTspi", "mt_e7tLi9SCIE", "mt_tVvZVWO5d6", "mt_SOM6Imm2sO", "mt_tegkuJA5gM", "mt_IlDaxVr60U"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B18_2026-11-04');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB18,6);
});

test('B19 money drafts retain source flags and evidence boundaries',()=>{
 const ids=["mt_FSLJbKkryb", "mt_8cs4YPkp23", "mt_9L5qyBYmg-", "mt_5bmrA-0pBi", "mt_Qe2PsFmSAH", "mt_oMkQQ2O-ML", "mt_mMDpLugX2X"];
 for(const id of ids){const r=researchTriage.records.find(x=>x.id===id);assert.equal(r.hasResearch,false);assert.equal(r.externalSourcesVerified,true);assert.equal(r.researchVerificationStatus,'external_sources_reviewed_B19_2026-11-04');assert.equal(r.independentMathReviewStatus,'not_completed');assert.equal(r.childUnderstandingStatus,'not_tested');assert.ok(sampleIds.has(id));}
 assert.equal(researchTriage.summary.sourceRecordsExternallyVerifiedInB19,7);
});
