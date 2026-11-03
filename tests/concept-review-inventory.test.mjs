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
const newSix=new Set(['mt_dmNvjroCPT','mt_xmmgAzxe5j','mt_IfEgu0X449','mt_PZ909yPrEC','mt_qeZYF6HZ4o','mt_ylXdiVRAYv']);
const newFive=new Set(['mt_ebQURBOsM5','mt__yvsKKp3TS','mt_NSC3LT_-ch','mt_gC-6JXAG5S','mt_iykH2P5oFq']);

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
  assert.equal(inventory.summary.configuredExplanationSamples,50);
  assert.equal(inventory.summary.notConfigured,487);
  assert.equal(inventory.summary.first39FirstPassCalibrated,39);
  assert.equal(inventory.summary.newSixDraftPendingDeepReview,6);
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
      if(newSix.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'new_six_draft_pending_deep_review');
      else if(newFive.has(node.id))assert.equal(record.explanationReview.calibrationStatus,'first_five_draft_ai_self_checked_pending_independent_review');
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
  assert.equal(researchGapWithoutSamples.length,71);
  assert.equal(inventory.summary.hasResearchFalseWithSample,researchGapSamples.length);
  assert.equal(inventory.summary.hasResearchFalseNotConfigured,researchGapWithoutSamples.length);
  assert.ok(researchGapSamples.every(node=>inventory.nodes.find(record=>record.id===node.id).researchTriage.status==='external_sources_reviewed_pending_independent_math_review'));
  assert.equal(source.edges.filter(edge=>!sourceById.has(edge.topicId)||!sourceById.has(edge.prerequisiteId)).length,0);
  assert.equal(source.edges.filter(edge=>sourceById.get(edge.topicId)?.domainId==='thinking'||sourceById.get(edge.prerequisiteId)?.domainId==='thinking').length,143);
  assert.equal(source.externalEdges.length,32);
  assert.ok(inventory.nodes.every(node=>node.contentReviewStatus!=='independently_reviewed'));
});
