import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeKnowledgeNames,NODE_DISPLAY_CORRECTIONS,NODE_QUALIFIERS} from '../dist/spatial-names.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const math=read('dist/data/math.json'),audit=read('docs/language/NODE-NAME-AUDIT.json');
const byId=new Map(math.nodes.map(n=>[n.id,n]));
const frequency=new Map();for(const node of math.nodes)frequency.set(node.title,(frequency.get(node.title)||0)+1);
const unique=x=>new Set(x).size===x.length;
test('all 587 source nodes have one auditable naming decision and unique display identity',()=>{
  assert.equal(math.nodes.length,587);
  assert.equal(math.edges.length,1223);
  assert.equal(audit.entries.length,math.nodes.length);
  assert.ok(unique(audit.entries.map(e=>e.id)),'audit source IDs unique');
  assert.deepEqual(new Set(audit.entries.map(e=>e.id)),new Set(math.nodes.map(n=>n.id)));
  const labels=makeKnowledgeNames({nodes:math.nodes});
  assert.equal(labels.size,587);
  assert.ok(unique([...labels.values()]),'all 587 current display names are distinguishable');
  for(const row of audit.entries){
    const n=byId.get(row.id);
    assert.equal(row.original,n.title);
    assert.equal(row.sourceName,n.name);
    assert.equal(row.display,labels.get(row.id),'audit display should match runtime name');
    assert.ok(['corrected','qualifier_reviewed','source_reviewed','explanation'].includes(row.class));
    assert.equal(row.qualified,(frequency.get(n.title)>1));
    if(row.qualified)assert.ok(NODE_QUALIFIERS[row.id],'duplicate has source-goal qualifier');
  }
});
test('84 source-reviewed corrections are ID keyed, not broad string replacements',()=>{
  assert.equal(Object.keys(NODE_DISPLAY_CORRECTIONS).length,84);
  const selected=audit.entries.filter(e=>e.class==='corrected');
  assert.equal(selected.length,84);
  for(const row of selected){
    assert.equal(row.display,NODE_DISPLAY_CORRECTIONS[row.id]);
    assert.ok(row.sourceGoal&&row.sourceGoal.length>=20,'corrected name cites English source description');
    assert.notEqual(row.display,row.original);
  }
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_doX1BhmFgk'],'认识百分之一');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_kdWoAel3Zl'],'认识千分之一');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_e4V6hvcuEJ'],'读懂几何图形的标记');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_HY8Yycu_rz'],'准确使用数学词汇和符号');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_zMEvtigoM3'],'根据问题选择数学表示与工具');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_ESgc4YBw-a'],'比、比例与百分数的语言');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_e8CZ7E5qW7'],'凑成10的数的分与合');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_2yas4Unc8o'],'时间单位换算');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_5mIcmKRCgA'],'正比例与反比例');
});
test('four category counts are complete without implying full mathematical review',()=>{
  assert.deepEqual(audit.counts.byClass,{qualifier_reviewed:92,explanation:5,corrected:84,source_reviewed:406});
  const unchanged=audit.entries.filter(e=>e.class==='source_reviewed');
  assert.equal(unchanged.length,406);
  assert.ok(unchanged.every(e=>e.sourceGoal&&e.reviewStage==='unique_source_goal_review'));
  const correctedUnique=audit.entries.filter(e=>e.class==='corrected'&&e.reviewStage==='unique_source_goal_review');
  assert.equal(correctedUnique.length,46);
  const retained=audit.entries.filter(e=>e.class==='qualifier_reviewed');
  assert.equal(retained.length,92);
  assert.ok(retained.every(e=>e.qualified&&e.sourceGoal&&e.basis));
  assert.equal(audit.counts.duplicateGroupCount,44);
  assert.equal(audit.counts.duplicateNodes,130);
  assert.equal(audit.counts.explanationPilots,6);
  assert.match(audit.meta.accuracyNote,/全部 587.*第一轮来源/);
  assert.ok(math.nodes.every(n=>!Object.hasOwn(n,'displayTitle')),'source data is not rewritten to UI labels');
});
