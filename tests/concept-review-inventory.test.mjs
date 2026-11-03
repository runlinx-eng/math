import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CONCEPT_EXPLANATIONS} from '../dist/concept-explanations.js';

const source=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url),'utf8'));
const inventory=JSON.parse(fs.readFileSync(new URL('../docs/language/CONCEPT-REVIEW-INVENTORY.json',import.meta.url),'utf8'));
const audit=JSON.parse(fs.readFileSync(new URL('../docs/language/NODE-NAME-AUDIT.json',import.meta.url),'utf8'));
const knowledge=source.nodes.filter(node=>node.domainId!=='thinking');
const thinking=source.nodes.filter(node=>node.domainId==='thinking');
const sourceById=new Map(source.nodes.map(node=>[node.id,node]));
const externalById=new Map((source.externalNodes||[]).map(node=>[node.id,node]));
const inventoryById=new Map(inventory.nodes.map(node=>[node.id,node]));
const auditById=new Map(audit.entries.map(node=>[node.id,node]));
const sampleIds=new Set(Object.keys(CONCEPT_EXPLANATIONS));
const explanationBytes=fs.readFileSync(new URL('../dist/concept-explanations.js',import.meta.url));
const nameAuditBytes=fs.readFileSync(new URL('../docs/language/NODE-NAME-AUDIT.json',import.meta.url));
const gitBlobSha=content=>createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${content.length}\0`),content])).digest('hex');
const localBatch20b=new Set(["mt_I5j1ZWo2cn", "mt_Zx1xZM-RbX", "mt_s2mfRBoTal", "mt_UTnDKQkVX5", "mt_EmR5n58jZt", "mt_U0waNfD8PB", "mt_kJGCjnuelW", "mt_cFltwUQi-d", "mt_xACS3rWWDp", "mt_MyGblah2yY", "mt_yGv8doDAmp", "mt_2VR963szuk", "mt_XjwUlmxdCT", "mt_zkFbMLpu3U", "mt_NtJYlJdUe9", "mt_-vvVxpOHG2", "mt_M5PPDJStGm", "mt_aHAM29nidj", "mt_OkSJfrmFb_", "mt_M2v1A9OEuM"]);
const localBatch20=new Set(["mt_yJmvUCCym7", "mt_e8CZ7E5qW7", "mt_zuKAX6lcYR", "mt_mr_Vk7FGzK", "mt_VAWV_l7J0D", "mt_wh3UqnWsa7", "mt_0u4KLbvBa1", "mt_zOWwLxa77y", "mt_B1zj1RwQ3a", "mt_nvdpxAJTBG", "mt_yqAL6O5i_v", "mt__YRJ23GuIK", "mt_x8TshvbbQT", "mt_kw7xmp68rU", "mt_r0VXbfAmsH", "mt_mnEVZNkX3p", "mt_WXW0hjNhph", "mt_g3W0mdADVu", "mt_hyvHv2BCwb", "mt_TcG90kS8nu"]);
const localThirdBatch=new Set(['mt_7XcCG43ZZW','mt_C9ZfT-4cgn','mt_fR0UtsSREU']);
const localSecondBatch=new Set(['mt_-hTTat0mBR','mt_KJeEeTutJI','mt_uhuxX8sg9f']);
const localPilot=new Set(['mt__h7hvT4tEb','mt_sYpKWbq5ra','mt_pAcaehday5']);
const newSix=new Set(['mt_dmNvjroCPT','mt_xmmgAzxe5j','mt_IfEgu0X449','mt_PZ909yPrEC','mt_qeZYF6HZ4o','mt_ylXdiVRAYv']);
const newFive=new Set(['mt_ebQURBOsM5','mt__yvsKKp3TS','mt_NSC3LT_-ch','mt_gC-6JXAG5S','mt_iykH2P5oFq']);
const secondBatchFirstFive=new Set(['mt_oqziWKry-L','mt_aPBzD28_mT','mt_3fwYu7imd4','mt_QhFEDyIwSO','mt_XSXnTQoQ4l']);
const secondBatchSecondFive=new Set(['mt_nTL-owFJTF','mt_PgsHGYJMH-','mt_r8XnXwRA6g','mt_KwdjWEmMNo','mt_ilPrU0cbtT']);

function relationIds(edges,nodeId,direction){
  return edges.filter(edge=>direction==='prerequisite'?edge.topicId===nodeId:edge.prerequisiteId===nodeId)
    .map(edge=>({nodeId:direction==='prerequisite'?edge.prerequisiteId:edge.topicId,strength:edge.strength}));
}

test('the full review inventory contains every knowledge-map node exactly once',()=>{
  assert.equal(source.nodes.length,587);
  assert.equal(knowledge.length,537);
  assert.equal(thinking.length,50);
  assert.equal(inventory.nodes.length,537);
  assert.equal(inventory.separateMathThinkingNodes.length,50);
  assert.equal(new Set(inventory.nodes.map(node=>node.id)).size,537);
  assert.equal(new Set(inventory.separateMathThinkingNodes.map(node=>node.id)).size,50);
  assert.equal(inventory.summary.configuredExplanationSamples,109);
  assert.equal(inventory.summary.notConfigured,428);
  assert.equal(inventory.summary.first39FirstPassCalibrated,39);
  assert.equal(inventory.summary.newSixDraftPendingDeepReview,6);
  assert.equal(inventory.summary.secondBatchFirstFiveDraftPendingIndependentReview,5);
  assert.equal(inventory.summary.secondBatchSecondFiveDraftPendingIndependentReview,5);
  assert.equal(inventory.summary.secondBatchTotalDraftPendingIndependentReview,10);
  assert.equal(inventory.summary.hasResearchFalse,83);
  assert.equal(inventory.summary.hasResearchFalseWithSample,12);
  assert.equal(inventory.summary.hasResearchFalseNotConfigured,71);
  assert.equal(inventory.summary.hasResearchTrue,454);
  assert.equal(inventory.summary.relationEdges,1223);
  assert.equal(inventory.summary.hardEdges,851);
  assert.equal(inventory.summary.softEdges,372);
  assert.equal(inventory.summary.separateExternalEdges,32);
  assert.deepEqual(inventory.source.sourceSha256,source.sourceSha256);
  assert.equal(inventory.source.sourceBlobSha,'559a6ac9459495ec848a79119ba182c999fff7b5');
  assert.equal(inventory.source.explanationBlobSha,gitBlobSha(explanationBytes));
  assert.equal(inventory.source.nameAuditBlobSha,gitBlobSha(nameAuditBytes));
});

test('each inventory entry matches its source node and review states',()=>{
  for(const record of inventory.nodes){
    const node=sourceById.get(record.id);
    assert.ok(node,'inventory source node exists: '+record.id);
    assert.equal(record.sourceTitle,node.title);
    assert.equal(record.sourceName,node.name);
    assert.equal(record.type,node.type);
    assert.equal(record.domainId,node.domainId);
    assert.equal(record.domain,node.domain);
    assert.equal(record.description,node.description);
    assert.deepEqual(record.evidence,node.evidence||[]);
    assert.equal(record.assessmentPrompt,node.assessmentPrompt||null);
    assert.equal(record.ageRange.start,node.ageRangeStart??null);
    assert.equal(record.ageRange.end,node.ageRangeEnd??null);
    assert.equal(record.hasResearch,node.hasResearch??null);
    assert.deepEqual(record.relationships.directPrerequisites,relationIds(source.edges,node.id,'prerequisite'));
    assert.deepEqual(record.relationships.directDependents,relationIds(source.edges,node.id,'dependent'));
    assert.deepEqual(record.relationships.externalPrerequisites,relationIds(source.externalEdges||[],node.id,'prerequisite'));
    assert.deepEqual(record.relationships.externalDependents,relationIds(source.externalEdges||[],node.id,'dependent'));
    assert.equal(record.explanationReview.status,sampleIds.has(node.id)?'sample_present':'not_configured');
    assert.equal(record.explanationReview.independentMathReviewStatus,'not_completed');
    assert.equal(record.explanationReview.childUnderstandingStatus,'not_tested');
    assert.ok(auditById.has(node.id),'name audit entry exists: '+node.id);
    assert.equal(record.displayName,auditById.get(node.id).display||node.title);
    if(sampleIds.has(node.id)){
      if(localBatch20b.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'local_batch20b_draft_pending_independent_review');
      else if(localBatch20.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'local_batch20_draft_pending_independent_review');
      else if(localThirdBatch.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'local_third_batch_draft_pending_independent_review');
      else if(localSecondBatch.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'local_second_batch_draft_pending_independent_review');
      else if(localPilot.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'local_pilot_ai_rechecked_pending_independent_review');
      else if(newSix.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'new_six_draft_pending_deep_review');
      else if(newFive.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'first_five_draft_ai_self_checked_pending_independent_review');
      else if(secondBatchFirstFive.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'second_batch_first_five_ai_cross_review_completed_pending_independent_review');
      else if(secondBatchSecondFive.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'second_batch_second_five_ai_cross_review_completed_pending_independent_review');
      else assert.equal(record.explanationReview.calibrationStatus,'first_39_first_pass_calibrated');
    }else{
      assert.equal(record.explanationReview.calibrationStatus,'not_started');
    }
  }
});

test('research flags and source relation endpoints are accounted for without conflating thinking nodes',()=>{
  assert.equal(knowledge.filter(node=>node.hasResearch===false).length,83);
  const researchGapSamples=knowledge.filter(node=>node.hasResearch===false&&sampleIds.has(node.id));
  const researchGapWithoutSamples=knowledge.filter(node=>node.hasResearch===false&&!sampleIds.has(node.id));
  assert.equal(researchGapSamples.length,12);
  assert.ok([...secondBatchFirstFive].every(id=>sourceById.get(id)?.hasResearch===true));
  assert.ok([...secondBatchSecondFive].every(id=>sourceById.get(id)?.hasResearch===true));
  assert.equal(researchGapWithoutSamples.length,71);
  assert.equal(inventory.summary.hasResearchFalseWithSample,researchGapSamples.length);
  assert.equal(inventory.summary.hasResearchFalseNotConfigured,researchGapWithoutSamples.length);
  assert.ok(researchGapSamples.every(node=>inventory.nodes.find(record=>record.id===node.id).researchTriage.status==='external_sources_reviewed_pending_independent_math_review'));
  assert.equal(source.edges.filter(edge=>!sourceById.has(edge.topicId)||!sourceById.has(edge.prerequisiteId)).length,0);
  assert.equal(source.edges.filter(edge=>sourceById.get(edge.topicId)?.domainId==='thinking'||sourceById.get(edge.prerequisiteId)?.domainId==='thinking').length,143);
  assert.equal(source.externalEdges.length,32);
  assert.ok(inventory.nodes.every(node=>node.contentReviewStatus!=='independently_reviewed'));
});
