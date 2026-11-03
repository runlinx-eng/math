import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildGradeProgressionModel,
  assertGradeProgressionRuntimeData,
  loadGradeProgressionData
} from "../dist/grade-progression-model.js";

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const atlas = readJson("../dist/data/atlas.json");
const atlasBefore = structuredClone(atlas);
const nodeStageCandidates = readJson("../docs/grade-progression/node-stage-candidates.json");
const packStageEvidence = readJson("../docs/grade-progression/pack-stage-evidence.json");
const runtimeData = readJson("../dist/data/grade-progression.json");
const model = buildGradeProgressionModel({ atlas, nodeStageCandidates, packStageEvidence });

test("runtime model is generated from the current source records", () => {
  assert.deepEqual(runtimeData, model);
  assert.equal(assertGradeProgressionRuntimeData(runtimeData), runtimeData);
});

test("the atlas and its original relationships remain unchanged", () => {
  assert.deepEqual(atlas, atlasBefore);
  assert.equal(atlas.nodes.length, 587);
  assert.equal(atlas.edges.length, 1223);
});

test("537 domain mappings join by unique nodeId and packId without copying graph nodes", () => {
  assert.equal(model.nodeMappings.length, 537);
  assert.equal(new Set(model.nodeMappings.map(item => item.nodeId)).size, 537);
  const atlasById = new Map(atlas.nodes.map(item => [item.id, item]));
  for (const item of model.nodeMappings) {
    assert.equal(atlasById.get(item.nodeId)?.packId, item.packId);
    assert.equal("name" in item, false);
    assert.equal("description" in item, false);
    assert.equal("position" in item, false);
  }
});

test("primary stages, node roles and evidence levels remain independent", () => {
  assert.deepEqual(model.primaryStageIds, ["stage-1", "stage-2", "stage-3"]);
  assert.deepEqual(model.counts.primaryStageNodeCounts, {
    "stage-1": 187, "stage-2": 259, "stage-3": 255
  });
  assert.deepEqual(model.counts.evidenceLevelCounts, {
    direct: 225, conceptual: 243, adjacent: 64, "not-covered": 5
  });
  assert.deepEqual(model.counts.stageRoleCounts, {
    "stage-1:main": 136,
    "stage-2:extension": 114,
    "stage-1:extension": 51,
    "stage-2:main": 145,
    "stage-3:extension": 136,
    "stage-3:main": 119,
    "beyond-primary:main": 42,
    "beyond-primary:transition": 81,
    "beyond-primary:extension": 13
  });
  const adjacentMain = model.nodeMappings.find(item => item.nodeId === "mt_anAe11HAEH");
  assert.equal(adjacentMain.curriculum.roles["stage-3"], "main");
  assert.equal(adjacentMain.curriculum.evidenceLevel, "adjacent");
  assert.equal(adjacentMain.curriculum.evidenceLevelLabel, "Adjacent");
});

test("junior-high content remains a separate continuation, not a fourth primary stage", () => {
  const unresolved = model.nodeMappings.find(item => item.nodeId === "mt_b4lbTOJYwI");
  assert.deepEqual(unresolved.curriculum.primaryStages, []);
  assert.equal(unresolved.ageCandidate.candidateStages.includes("beyond-primary-transition"), true);
  assert.equal(unresolved.curriculum.beyondPrimary.role, "main");
  assert.equal(unresolved.curriculum.evidenceLevel, "adjacent");
  assert.equal(model.counts.beyondPrimaryNodeCount, 136);
  assert.equal(model.counts.multiStageNodeCount, 289);
  assert.equal(model.primaryStageIds.includes("beyond-primary"), false);
});

test("23 pack judgements retain all 69 stage positions and separate process marks", () => {
  assert.equal(model.packs.length, 23);
  assert.equal(model.counts.packStagePositionCount, 69);
  const reasoning = model.packs.find(item => item.packId === "reasoning");
  for (const stageId of model.primaryStageIds) {
    assert.equal(reasoning.stageJudgements[stageId].mark, "process");
    assert.equal(reasoning.stageJudgements[stageId].markLabel, "过程");
  }
  const fractionOperations = model.packs.find(item => item.packId === "fraction-operations");
  assert.equal(fractionOperations.stageJudgements["stage-1"].mark, "not-primary");
  assert.equal(fractionOperations.stageJudgements["stage-1"].markLabel, "—");
});

test("50 thinking nodes remain separate and are not assigned primary stages", () => {
  const thinkingIds = new Set(model.specialRisks.thinkingNodes.ids);
  assert.equal(thinkingIds.size, 50);
  assert.equal(model.counts.mathThinkingNodeCount, 50);
  assert.equal(model.nodeMappings.some(item => thinkingIds.has(item.nodeId)), false);
  assert.equal(model.specialRisks.thinkingNodes.count, 50);
});

test("special research and curriculum risks are preserved and reconciled", () => {
  assert.equal(model.counts.notCoveredNodeCount, 5);
  assert.equal(model.counts.researchGapCount, 85);
  assert.equal(model.counts.researchGapDomainNodeCount, 83);
  assert.equal(model.counts.researchGapThinkingNodeCount, 2);
  assert.equal(model.counts.adjacentMainRiskCount, 17);
  assert.equal(model.specialRisks.unresolvedNode.id, "mt_b4lbTOJYwI");
  const atlasResearchGaps = atlas.nodes.filter(item => item.hasResearch === false).map(item => item.id);
  assert.deepEqual(new Set(model.specialRisks.teachingResearchGaps.ids), new Set(atlasResearchGaps));
  assert.equal(model.specialRisks.notCoveredNodes.length, 5);
  assert.equal(model.specialRisks.adjacentMain.nodes.length, 17);
});

test("time pack stage-3 remains incomplete without inferring a dash", () => {
  const time = model.packs.find(item => item.packId === "time");
  const stage3 = time.stageJudgements["stage-3"];
  assert.equal(stage3.recordStatus, "incomplete");
  assert.equal(stage3.mark, null);
  assert.equal(stage3.markLabel, null);
  assert.equal(stage3.reviewStatus, null);
  assert.equal(stage3.nodeEvidence.length, 4);
  assert.deepEqual(stage3.missingFields, ["mark", "markLabel", "reviewStatus"]);
  assert.equal(model.sourceAudit.incompletePackStages.length, 1);
  assert.equal(model.sourceAudit.incompletePackStages[0].packId, "time");
  assert.equal(model.sourceAudit.incompletePackStages[0].stageId, "stage-3");
  assert.equal(time.stageJudgements["stage-2"].reviewStatus, "needs-independent-pedagogical-review");
  assert.equal(time.stageJudgements["stage-2"].unresolvedQuestions.length, 2);
});

test("runtime loader validates a fetched static data file", async () => {
  const loaded = await loadGradeProgressionData({
    url: "./data/grade-progression.json",
    fetcher: async url => ({
      ok: true,
      json: async () => {
        assert.equal(url, "./data/grade-progression.json");
        return runtimeData;
      }
    })
  });
  assert.deepEqual(loaded, runtimeData);
});
