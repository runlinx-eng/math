import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gradeMapSelection,GRADE_MAP_STAGES} from '../dist/grade-node-filter.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=read('../dist/index.html'),space=read('../dist/space.js'),css=read('../dist/space.css');
const sw=read('../dist/sw.js'),model=read('../dist/spatial-model.js');
const data=JSON.parse(read('../dist/data/grade-progression.json'));
test('the product exposes exactly one 3D relationship panorama with an inline stage filter',()=>{
  assert.match(html,/id="network-guide"/);
  assert.match(html,/id="grade-map-filter"/);
  assert.deepEqual(GRADE_MAP_STAGES,['all','stage-1','stage-2','stage-3']);
  assert.equal((html.match(/data-action="grade-map-stage"/g)||[]).length,4);
  assert.doesNotMatch(html,/id="observation-mode-switch"|id="grade-observation-view"|data-mode="grade"/);
  assert.doesNotMatch(html,/data-action="switch-world"|data-action="switch-layout"|原有空间|切换到旧关系地图/);
  assert.doesNotMatch(space,/function switchWorld\(|function switchLayout\(|action==='switch-world'|action==='switch-layout'/);
  assert.match(space,/worldLayout='network';const chosenNetworkVersion=RELATIONSHIP_VERSION/);
  assert.doesNotMatch(space,/setObservationMode|renderGradeObservation|renderGradePackDetail|revealGradeNode|action==='grade-select'|action==='grade-view-node'/);
  assert.doesNotMatch(css,/grade-observation-view|grade-matrix|observation-mode-switch|grade-pack-toggle/);
});
test('only the active two-year stage belongs to the saved view',()=>{
  assert.match(space,/selectedGradeStage/);
  assert.match(model,/selectedGradeStage:/);
  assert.doesNotMatch(model,/observationMode|expandedGradePackId|selectedGrade:/);
  assert.doesNotMatch(space,/expandedGradePackId|observationMode|selectedGrade=/);
});
test('the map filters by real domain-node mappings, never by pack-level curriculum judgments',()=>{
  assert.equal(data.nodeMappings.length,537);
  assert.equal(data.packs.length,23);
  const stageCounts={'stage-1':187,'stage-2':259,'stage-3':255};
  const all=gradeMapSelection(data,'all');
  assert.equal(all.mappedCount,537);
  for(const [stage,count] of Object.entries(stageCounts)){
    const got=gradeMapSelection(data,stage);
    assert.equal(got.mappedCount,count);
    for(const id of got.nodeIds)
      assert.ok(data.nodeMappings.find(x=>x.nodeId===id)?.curriculum.primaryStages.includes(stage));
  }
});
test('pack-level curriculum evidence is retained as independent source data',()=>{
  assert.equal(data.counts.packStagePositionCount,69);
  assert.equal(data.counts.incompletePackStagePositionCount,1);
  const time=data.packs.find(p=>p.packId==='time');
  assert.equal(time.stageJudgements['stage-3'].recordStatus,'incomplete');
  assert.equal(time.stageJudgements['stage-3'].mark,null);
  assert.equal(data.packs.reduce((n,p)=>n+p.domainKnowledgeNodeCount,0),537);
});
test('node details keep evidence, unmapped and junior-high-only status without the obsolete matrix link',()=>{
  assert.match(space,/function renderGradeNodePosition/);
  assert.match(space,/grade-node-position-evidence/);
  assert.match(space,/初中后续/);
  assert.match(space,/未纳入当前课程阶段映射/);
  assert.match(space,/数学思维节点 · 独立内容，不分配小学学段/);
  assert.doesNotMatch(space,/查看年级观察 →|grade-view-pack|grade-view-node/);
  assert.match(css,/\.grade-node-position/);
  assert.equal(data.specialRisks.thinkingNodes.ids.length,50);
  assert.equal(data.counts.beyondPrimaryNodeCount,136);
  assert.equal(data.counts.notCoveredNodeCount,5);
  const special=data.nodeMappings.find(n=>n.nodeId==='mt_b4lbTOJYwI');
  assert.deepEqual(special.curriculum.primaryStages,[]);
  assert.equal(special.curriculum.beyondPrimary.role,'main');
  assert.equal(special.curriculum.evidenceLevel,'adjacent');
});
test('grade curriculum is still cached for offline use',()=>{
  assert.match(sw,/grade-node-filter\.js/);
  assert.match(sw,/data\/grade-panorama-lite\.json/);
  assert.match(space,/loadGradePanoramaData/);
});

test('retired 2D map routes preserve the historical learning surface without another map',()=>{
  const legacy=read('../dist/exploration.js'),legacyHtml=read('../dist/v2.html');
  assert.match(legacy,/function redirectRetiredMap\(/);
  assert.doesNotMatch(legacy,/function renderAtlas\(|function renderHome\(|function renderTheme\(|function renderPack\(|function diagram\(/);
  assert.doesNotMatch(legacyHtml,/href="#atlas"|href="#map"|node-dialog/);
  assert.match(legacy,/function renderActivity\(/);
  assert.match(legacy,/function renderTrail\(/);
  assert.match(legacy,/function renderAbout\(/);
  assert.match(legacy,/function showNode\(/);
  assert.match(legacy,/parseBackup\(/);
  assert.match(legacy,/backup\(state\)/);
  assert.match(sw,/\.\/v2\.html/);
  assert.match(sw,/\.\/exploration\.js/);
});
