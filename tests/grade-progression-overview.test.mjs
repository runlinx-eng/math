import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../dist/index.html");
const space = read("../dist/space.js");
const css = read("../dist/space.css");
const sw = read("../dist/sw.js");
const spatialModel = read("../dist/spatial-model.js");
const adapterDoc = read("../docs/grade-progression/DATA-ADAPTER.md");
const interactionRules = read("../docs/spatial-learning/INTERACTION-RULES.md");
const data = JSON.parse(read("../dist/data/grade-progression.json"));

test("relationship and grade observation share the existing guide panel", () => {
  const guide = html.indexOf('id="network-guide"');
  const modeSwitch = html.indexOf('id="observation-mode-switch"');
  const relationshipTitle = html.indexOf('id="network-view-title"');
  const grade = html.indexOf('id="grade-observation-view"');
  const structure = html.indexOf('id="overview-structure-controls"');
  assert.ok(guide >= 0 && modeSwitch > guide && relationshipTitle > modeSwitch && grade > relationshipTitle);
  assert.ok(structure > grade);
  assert.doesNotMatch(html, /id="relationship-observation-content"/);
  assert.match(html, /data-mode="relationship" aria-pressed="true">关系全景/);
  assert.match(html, /data-mode="grade" aria-pressed="false">年级观察/);
  assert.doesNotMatch(html, /id="grade-observation-toolbar"/);
});

test("switching observation mode only changes the guide panel contents", () => {
  const start = space.indexOf("function setObservationMode(mode){");
  const end = space.indexOf("\nfunction renderLocation()", start);
  assert.ok(start >= 0 && end > start);
  const implementation = space.slice(start, end);
  assert.match(implementation, /guide\.querySelectorAll\(':scope > :not\(#observation-mode-switch\):not\(#grade-observation-view\)'\)/);
  assert.match(implementation, /item\.hidden=next!=='relationship'/);
  assert.match(implementation, /grade\.hidden=next!=='grade'/);
  assert.match(implementation, /document\.body\.dataset\.observationMode=next/);
  assert.doesNotMatch(implementation, /scene\.|camera|zoom|fitGlobalView|setMode/);
  assert.match(space, /action==='observation-mode'/);
});

test("grade observation layout stays within the existing explanation area", () => {
  assert.match(css, /\.observation-mode-switch/);
  assert.match(css, /body\[data-observation-mode="grade"\] \.network-guide/);
  assert.match(css, /@media\(max-width:600px\).*observation-mode-switch/s);
});

test("the matrix is built from the 23 source pack records and their five theme groups", () => {
  assert.equal(data.packs.length, 23);
  assert.deepEqual([...new Set(data.packs.map(pack => pack.themeId))], ["numbers", "space", "measure", "patterns", "data"]);
  assert.deepEqual(["numbers", "space", "measure", "patterns", "data"].map(theme => data.packs.filter(pack => pack.themeId === theme).length), [6, 4, 5, 4, 4]);
  assert.equal(data.counts.packStagePositionCount, 69);
  assert.match(space, /gradeProgressionData\.packs/);
  assert.match(space, /pack\.stageJudgements\?\.\[stage\.id\]/);
  assert.doesNotMatch(space.slice(space.indexOf("function renderGradeObservation"), space.indexOf("function loadGradeObservation")), /nodeMappings|curriculum\.roles/);
});

test("six year controls map in adjacent pairs to the same two-year stage", () => {
  assert.deepEqual(data.primaryStageIds, ["stage-1", "stage-2", "stage-3"]);
  assert.match(space, /const GRADE_LABELS=Object\.freeze\(\['一年级','二年级','三年级','四年级','五年级','六年级'\]\)/);
  assert.match(space, /Math\.floor\(\(selectedGrade-1\)\/2\)/);
  assert.match(space, /课程映射精度为两年学段/);
});

test("incomplete time stage-3 is rendered as 待补充 rather than a dash", () => {
  const time = data.packs.find(pack => pack.packId === "time");
  const stage3 = time.stageJudgements["stage-3"];
  assert.equal(stage3.recordStatus, "incomplete");
  assert.equal(stage3.mark, null);
  assert.equal(stage3.markLabel, null);
  assert.deepEqual(stage3.missingFields, ["mark", "markLabel", "reviewStatus"]);
  assert.match(space, /recordStatus==='incomplete'/);
  assert.match(space, /label:'待补充'/);
});

test("grade runtime files are precached and included in offline readiness", () => {
  assert.match(sw, /'\.\/grade-progression-model\.js','\.\/data\/grade-progression\.json'/);
  assert.match(space, /'grade-progression-model\.js','data\/grade-progression\.json'/);
});

test("knowledge groups expand and collapse into three stage-specific evidence panels", () => {
  assert.match(space, /function renderGradePackDetail\(pack\)/);
  assert.match(space, /data-action="grade-pack-toggle"/);
  assert.match(space, /expandedGradePackId===el\.dataset\.packId/);
  assert.match(space, /judgement\.developmentContent/);
  assert.match(space, /judgement\.rationale/);
  assert.match(space, /judgement\.standardEvidence/);
  assert.match(space, /judgement\.scopeBoundary/);
  assert.match(space, /judgement\.reviewStatusLabel/);
  assert.match(space, /judgement\.unresolvedQuestions/);
  assert.match(space, /AI辅助审查不等同于独立教研或儿童理解测试/);
  assert.match(css, /\.grade-detail-grid/);
  assert.match(css, /\.grade-incomplete-note/);
});

test("incomplete group-stage detail preserves missing fields and does not infer a review label", () => {
  const time = data.packs.find(pack => pack.packId === "time");
  const stage3 = time.stageJudgements["stage-3"];
  assert.equal(stage3.recordStatus, "incomplete");
  assert.deepEqual(stage3.missingFields, ["mark", "markLabel", "reviewStatus"]);
  const detail = space.slice(space.indexOf("function renderGradePackDetail"), space.indexOf("function renderGradeObservation"));
  assert.match(detail, /群级判断记录不完整，待补充/);
  assert.match(detail, /审查状态待补充/);
});

test("the current two-year stage is exposed as the selected year changes", () => {
  assert.match(space, /data-selected-stage=/);
  assert.match(space, /selectedGrade-1/);
  assert.match(space, /GRADE_LABELS\[selectedGrade-1\]/);
});

test("network knowledge details remain inside the viewport when the guide panel grows", () => {
  const start = space.indexOf("function updateOverlays()");
  const end = space.indexOf("\nfunction ", start + 10);
  const implementation = space.slice(start, end);
  assert.match(implementation, /guideRect\.right\+16\+width<=innerWidth-16/);
  assert.match(implementation, /innerHeight-height-12/);
  assert.match(implementation, /card\.style\.left=.*rightLeft/);
});

test("the original guide content remains direct children of the existing grid panel", () => {
  assert.match(html, /<aside id="network-guide"[^>]*>[\s\S]*?<div id="observation-mode-switch"/);
  assert.match(html, /<div id="observation-mode-switch"[\s\S]*?<strong id="network-view-title"/);
  assert.match(css, /#observation-mode-switch,#grade-observation-view\{grid-column:1\/-1/);
});

test("the relationship structure controls stay below the added observation-mode row", () => {
  assert.match(css, /body\[data-world="network"\] \.overview-structure-controls\{top:230px\}/);
  assert.match(css, /body\[data-observation-mode="grade"\] \.overview-structure-controls\{display:none!important\}/);
  assert.match(css, /@media\(max-width:600px\)\{body\[data-world="network"\] \.overview-structure-controls\{top:250px\}\}/);
});

test("expanded details are outside the horizontally scrolling matrix", () => {
  assert.match(space, /const expandedPack=gradeProgressionData\.packs\.find\(pack=>pack\.packId===expandedGradePackId\)/);
  assert.match(space, /const expandedMarkup=expandedPack\?renderGradePackDetail\(expandedPack\):''/);
  assert.match(space, /class="grade-detail-panel"/);
  assert.match(css, /\.grade-detail-panel\{width:100%;min-width:0;max-width:100%/);
  assert.doesNotMatch(space, /class="grade-detail-row"/);
});


test("expanded groups expose each mapped domain node once with every stage role and its independent evidence level", () => {
  assert.equal(data.nodeMappings.length, 537);
  assert.equal(new Set(data.nodeMappings.map(item => item.nodeId)).size, 537);
  assert.match(space, /function renderGradeNodeList\(pack,selectedStageId\)/);
  assert.match(space, /space\.packs\.get\(pack\.packId\)/);
  assert.match(space, /gradeNodeMappingsById\.get\(id\)/);
  assert.match(space, /mapping\.curriculum\.roles/);
  assert.match(space, /mapping\.curriculum\.evidenceLevelLabel/);
  assert.match(space, /stageLabel=gradeStageForSelected\(\)/);
  assert.match(space, /未映射/);
  assert.match(space, /初中后续/);
  assert.match(css, /\.grade-domain-node-list/);
  assert.match(css, /\.grade-node-stage-tag\[data-role=transition\]/);
});

test("thinking nodes are rendered in a separate section and never enter the 537-node curriculum list", () => {
  assert.equal(data.specialRisks.thinkingNodes.count, 50);
  const thinkingIds = new Set(data.specialRisks.thinkingNodes.ids);
  assert.equal(data.nodeMappings.some(item => thinkingIds.has(item.nodeId)), false);
  assert.match(space, /pack\.mathThinkingNodeIds/);
  assert.match(space, /数学思维 · 独立内容，不分配小学学段/);
  assert.match(space, /不参与537个领域知识节点的小学课程阶段归属/);
});

test("not-covered and junior-high-only nodes keep their true unmapped primary status", () => {
  const notCovered = data.nodeMappings.filter(item => item.curriculum.evidenceLevel === "not-covered");
  assert.equal(notCovered.length, 5);
  assert.ok(notCovered.every(item => item.curriculum.primaryStages.length === 0));
  const unresolved = data.nodeMappings.find(item => item.nodeId === "mt_b4lbTOJYwI");
  assert.deepEqual(unresolved.curriculum.primaryStages, []);
  assert.equal(unresolved.curriculum.beyondPrimary.role, "main");
  assert.equal(unresolved.curriculum.evidenceLevel, "adjacent");
  assert.match(space, /小学阶段：未纳入当前课程阶段映射/);
});


test("grade-node selection enters the original graph through its in-place node selector", () => {
  assert.match(space, /action==='grade-node-select'/);
  assert.match(space, /setObservationMode\('relationship'\);choose\(target\.key,\{openLesson:false,inPlace:true\}\)/);
  assert.match(space, /scene\.select\(key\)/);
  assert.match(css, /body\[data-observation-mode="grade"\] \.focus-card\{display:none!important\}/);
});


test("the original node detail exposes its real grade position and routes back to the same pack", () => {
  assert.match(space, /function renderGradeNodePosition\(o\)/);
  assert.match(space, /gradeNodeMappingsById\.get\(o\.id\)/);
  assert.match(space, /mapping\.curriculum\.primaryStages/);
  assert.match(space, /mapping\.curriculum\.beyondPrimary/);
  assert.match(space, /mapping\.curriculum\.evidenceLevelLabel/);
  assert.match(space, /grade-view-node/);
  assert.match(space, /grade-view-pack/);
  assert.match(space, /function revealGradeNode\(nodeId\)/);
  assert.match(space, /expandedGradePackId=node\.packId/);
  assert.match(space, /scrollIntoView\(\{block:'nearest'\}\)/);
  assert.match(space, /renderGradeNodePosition\(o\)/);
  assert.match(css, /\.grade-node-position\{/);
});

test("grade mode, selected year and expanded pack are validated and saved with the original map view", () => {
  assert.match(space, /observationMode:worldLayout==='network'\?observationMode:'relationship'/);
  assert.match(space, /selectedGrade,expandedGradePackId/);
  assert.match(space, /observationMode=worldLayout==='network'\?stored\.observationMode:'relationship'/);
  assert.match(space, /setObservationMode\(observationMode\)/);
  assert.match(space, /selectedGrade=grade;renderGradeObservation\(\);scheduleSave\(\)/);
  assert.match(space, /renderGradeObservation\(\);scheduleSave\(\)/);
  assert.match(spatialModel, /observationMode:\['relationship','grade'\]\.includes\(raw\.observationMode\)\?raw\.observationMode:'relationship'/);
  assert.match(spatialModel, /Number\.isInteger\(raw\.selectedGrade\)/);
  assert.match(spatialModel, /space\.packs\.has\(raw\.expandedGradePackId\)/);
});


test("grade-position data loading is deferred and does not compete with an immediately opened learning activity", () => {
  assert.match(space, /gradePositionLoadTimer=setTimeout\(\(\)=>/);
  assert.match(space, /journeyOpen\|\|observationMode!=='relationship'/);
  assert.match(space, /if\(changed&&next==='relationship'\)renderFocus\(\)/);
  assert.match(space, /clearTimeout\(gradePositionLoadTimer\)/);
});


test("all 23 group node counts reconcile exactly to the 537 unique curriculum mappings", () => {
  assert.equal(data.packs.length, 23);
  assert.equal(data.nodeMappings.length, 537);
  assert.equal(new Set(data.nodeMappings.map(item => item.nodeId)).size, 537);
  for (const pack of data.packs) {
    assert.equal(data.nodeMappings.filter(item => item.packId === pack.packId).length, pack.domainKnowledgeNodeCount, pack.packId + " domain-node count");
  }
  assert.equal(data.packs.reduce((sum, pack) => sum + pack.domainKnowledgeNodeCount, 0), 537);
});

test("special curriculum boundaries remain separate and unchanged", () => {
  assert.equal(data.specialRisks.thinkingNodes.count, 50);
  assert.equal(data.specialRisks.notCoveredNodes.length, 5);
  assert.equal(data.specialRisks.adjacentMain.count, 17);
  assert.equal(data.specialRisks.teachingResearchGaps.count, 85);
  assert.equal(data.nodeMappings.filter(item => item.curriculum.beyondPrimary).length, 136);
  assert.ok(data.specialRisks.notCoveredNodes.every(item => {
    const mapping = data.nodeMappings.find(candidate => candidate.nodeId === item.id);
    return mapping && mapping.curriculum.primaryStages.length === 0 && mapping.curriculum.evidenceLevel === "not-covered";
  }));
  const unresolved = data.specialRisks.unresolvedNode;
  assert.equal(unresolved.id, "mt_b4lbTOJYwI");
  assert.match(unresolved.status, /保留未决/);
  const unresolvedMapping = data.nodeMappings.find(item => item.nodeId === unresolved.id);
  assert.deepEqual(unresolvedMapping.curriculum.primaryStages, []);
  assert.equal(unresolvedMapping.curriculum.beyondPrimary.role, "main");
  assert.equal(unresolvedMapping.curriculum.evidenceLevel, "adjacent");
  const adjacentMain = data.nodeMappings.filter(item => item.curriculum.evidenceLevel === "adjacent" && Object.values(item.curriculum.roles).includes("main"));
  assert.equal(adjacentMain.length, 17);
  assert.ok(adjacentMain.every(item => item.curriculum.evidenceLevel === "adjacent" && Object.values(item.curriculum.roles).includes("main")));
});

test("incomplete time group status does not erase its four real node-level stage-three roles", () => {
  const time = data.packs.find(pack => pack.packId === "time");
  const stageThree = time.stageJudgements["stage-3"];
  assert.equal(stageThree.recordStatus, "incomplete");
  assert.equal(stageThree.mark, null);
  assert.equal(stageThree.markLabel, null);
  assert.equal(stageThree.extensionNodeIds.length, 4);
  for (const id of stageThree.extensionNodeIds) {
    const mapping = data.nodeMappings.find(item => item.nodeId === id);
    assert.equal(mapping.curriculum.roles["stage-3"], "extension");
  }
  assert.match(space, /judgement\.recordStatus==='incomplete'/);
  assert.match(space, /节点级角色与证据独立于上方群级判断/);
});

test("unresolved status is shown without exposing the full research-gap register", () => {
  assert.match(space, /specialRisks\.unresolvedNode\?\.id===id/);
  assert.match(space, /grade-node-unresolved/);
  assert.match(space, /specialRisks\.unresolvedNode\.status/);
  assert.doesNotMatch(space, /teachingResearchGaps/);
});

test("adapter and interaction documentation define the same A2-3 node identity and two-way navigation contract", () => {
  assert.match(adapterDoc, /按唯一 nodeId/);
  assert.match(adapterDoc, /50个数学思维节点/);
  assert.match(adapterDoc, /初中后续/);
  assert.match(adapterDoc, /不调用自动聚焦/);
  assert.match(interactionRules, /A2-2 \/ A2-3/);
  assert.match(interactionRules, /查看年级观察/);
  assert.match(interactionRules, /不自动移动、缩放或旋转镜头/);
});
