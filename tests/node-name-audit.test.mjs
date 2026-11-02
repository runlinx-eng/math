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
    assert.ok(['corrected','disambiguation','explanation','candidate'].includes(row.class));
    assert.equal(row.qualified,(frequency.get(n.title)>1));
    if(row.qualified)assert.ok(NODE_QUALIFIERS[row.id],'duplicate has source-goal qualifier');
  }
});
test('22 reviewed corrections are source-ID keyed, not broad string replacements',()=>{
  assert.equal(Object.keys(NODE_DISPLAY_CORRECTIONS).length,22);
  const selected=audit.entries.filter(e=>e.class==='corrected');
  assert.equal(selected.length,22);
  for(const row of selected){
    assert.equal(row.display,NODE_DISPLAY_CORRECTIONS[row.id]);
    assert.ok(row.sourceGoal&&row.sourceGoal.length>=20,'corrected name cites English source description');
    assert.notEqual(row.display,row.original);
  }
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_doX1BhmFgk'],'认识百分之一');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_kdWoAel3Zl'],'认识千分之一');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_e4V6hvcuEJ'],'读懂几何图形的标记');
  assert.equal(NODE_DISPLAY_CORRECTIONS['mt_HY8Yycu_rz'],'准确使用数学词汇和符号');
});
test('four category counts are complete without implying full mathematical review',()=>{
  assert.deepEqual(audit.counts.byClass,{disambiguation:108,explanation:5,candidate:452,corrected:22});
  assert.equal(audit.counts.duplicateGroupCount,44);
  assert.equal(audit.counts.duplicateNodes,130);
  assert.equal(audit.counts.explanationPilots,6);
  assert.match(audit.meta.accuracyNote,/不.*587.*逐一数学审定/);
  assert.ok(math.nodes.every(n=>!Object.hasOwn(n,'displayTitle')),'source data is not rewritten to UI labels');
});
