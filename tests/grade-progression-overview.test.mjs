import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../dist/index.html");
const space = read("../dist/space.js");
const css = read("../dist/space.css");
const sw = read("../dist/sw.js");
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
