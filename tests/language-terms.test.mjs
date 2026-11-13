// First-layer language contract: only user-facing meaning, not math or layout behavior.
// These source checks guard key entry labels; browser acceptance remains independent.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('dist/index.html');
const space=read('dist/space.js');
const exploration=read('dist/exploration.js');

test('guide entry names its actual goal rather than a generic map tour',()=>{
  assert.match(index,/data-action="guide-start" class="guide-entry">发现知识的联系<\/button>/);
  assert.match(space,/继续发现知识的联系/);
  assert.match(space,/class="guide-step">发现知识的联系<\/span>/);
  assert.doesNotMatch(index,/认识这张图/);
});

test('theme, group and knowledge point remain distinct user-facing levels',()=>{
  assert.match(space,/const objectLevelLabel=o=>/);
  assert.match(space,/'知识群':'主题'/);
  assert.match(space,/o\?objectLevelLabel\(o\):'全貌'/);
  assert.match(index,/查找主题、知识群或知识点/);
  assert.doesNotMatch(index,/知识簇/);
  assert.doesNotMatch(space,/一簇想法|知识簇/);
});

test('thinking content is a category, not the learner progress state',()=>{
  assert.match(space,/另有 \$\{thinkingCount\} 个数学思维内容（不在地图上单独显示）/);
  assert.match(space,/地图知识点 \$\{mapped\} 个 · 数学思维 \$\{extra\} 个/);
  assert.doesNotMatch(space,/学习中 \$\{extra\} 个|个思维节点在学习中/);
});

test('completion counts describe tasks rather than mastery',()=>{
  assert.match(index,/<span>学习任务进度<\/span>/);
  assert.match(exploration,/function renderTrail\(/);
  assert.match(exploration,/记录走过的路，也记录想法/);
  assert.doesNotMatch(index,/整体进度/);
  assert.doesNotMatch(exploration,/<span>整体进度<\/span>/);
  assert.doesNotMatch(exploration,/function renderAtlas\(/);
  assert.match(space,/visibleTier\(l\.topicId\)===3/);
  assert.match(space,/NODE_TIERS\[visibleTier\(id\)\]/);
  assert.doesNotMatch(space,/整体掌握|已经掌握所有知识/);
});
