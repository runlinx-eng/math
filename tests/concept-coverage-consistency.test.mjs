import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONCEPT_EXPLANATIONS} from '../dist/concept-explanations.js';

const source=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url)));
const byId=new Map(source.nodes.map(node=>[node.id,node]));
const samples=Object.entries(CONCEPT_EXPLANATIONS);
const coverage=fs.readFileSync(new URL('../docs/language/CONCEPT-EXPLANATION-COVERAGE.md',import.meta.url),'utf8');

test('coverage ledger stays aligned with implemented explanation samples',()=>{
  const procedural=samples.filter(([id])=>byId.get(id)?.type==='PROCEDURAL').length;
  const visuals=samples.filter(([,item])=>Boolean(item.visual)).length;
  assert.equal(samples.length,35);
  assert.equal(procedural,11);
  assert.equal(visuals,11);
  assert.match(coverage,new RegExp('\\| PROCEDURAL 操作型 \\| 304 \\| '+procedural+' \\| '+(304-procedural)+' \\| 3\\.6% \\|'));
  assert.match(coverage,new RegExp('当前有 \\*\\*'+visuals+' 个样板节点\\*\\*提供真实 SVG 图示'));
  assert.doesNotMatch(coverage,/PROCEDURAL 占知识地图节点约 56\\.6%，当前只有 6 个样板/);
});
