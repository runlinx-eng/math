import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

test('the source practice map and all source edges can be reproduced from the pinned data',()=>{
  const output=JSON.parse(execFileSync('node',['scripts/build_thinking_source_map.mjs','--check'],{encoding:'utf8'}));
  assert.deepEqual(output,{sourceThinkingNodes:50,explicitPracticeTaggedNodes:48,groups:8,sourceEdgesWithinGroups:40,withoutPracticeTag:2});
  const data=JSON.parse(fs.readFileSync('docs/spatial-learning/thinking-source-map.json'));
  assert.equal(new Set([...data.groups.flatMap(g=>g.nodes),...data.untagged].map(n=>n.id)).size,50);
  assert.ok(data.groups.every(g=>g.nodes.length===6&&g.sourceEdges.length===5&&g.nodes.every(n=>n.standards.includes(g.code))));
});

test('the two calculator topics retain their own source standards rather than receiving an invented practice tag',()=>{
  const data=JSON.parse(fs.readFileSync('docs/spatial-learning/thinking-source-map.json'));
  assert.deepEqual(new Set(data.untagged.map(n=>n.id)),new Set(['mt_FVVSQR9vGg','mt_ish_uH8vZe']));
  assert.ok(data.untagged.every(n=>n.standards.length&&!n.standards.some(s=>/^ccss-math:MP\./.test(s))));
});
