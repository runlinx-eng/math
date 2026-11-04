import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gradeMapSelection,GRADE_MAP_STAGES,loadGradePanoramaData} from '../dist/grade-node-filter.js';
const data=JSON.parse(readFileSync(new URL('../dist/data/grade-progression.json',import.meta.url),'utf8'));
test('grade filter uses only the original 537 node curriculum mappings',()=>{
  assert.deepEqual(GRADE_MAP_STAGES,['all','stage-1','stage-2','stage-3']);
  assert.equal(gradeMapSelection(data,'all').mappedCount,537);
  assert.equal(gradeMapSelection(data,'all').nodeIds.size,0);
  for(const [stage,count] of [['stage-1',187],['stage-2',259],['stage-3',255]]){
    const result=gradeMapSelection(data,stage);
    assert.equal(result.mappedCount,count);
    assert.equal(result.nodeIds.size,count);
    for(const id of result.nodeIds){
      const node=data.nodeMappings.find(n=>n.nodeId===id);
      assert.ok(node.curriculum.primaryStages.includes(stage));
    }
  }
  assert.throws(()=>gradeMapSelection(data,'sixth-grade'));
});
test('node membership may span stages and neither mutates mappings nor fabricates a grade',()=>{
  const before=JSON.stringify(data);
  const a=gradeMapSelection(data,'stage-1').nodeIds,b=gradeMapSelection(data,'stage-2').nodeIds;
  assert.ok([...a].some(id=>b.has(id)));
  assert.equal(JSON.stringify(data),before);
  const mapped=new Set(data.nodeMappings.map(n=>n.nodeId));
  for(const stage of GRADE_MAP_STAGES.slice(1))for(const id of gradeMapSelection(data,stage).nodeIds)assert.ok(mapped.has(id));
});

const lite=JSON.parse(readFileSync(new URL('../dist/data/grade-panorama-lite.json',import.meta.url),'utf8'));
test('lean runtime exactly matches the 537-node source curriculum semantics',()=>{
  assert.equal(lite.nodeMappings.length,537);
  assert.equal(new Set(lite.nodeMappings.map(x=>x.nodeId)).size,537);
  assert.deepEqual(lite.stages,data.stages);
  assert.equal(lite.specialRisks.thinkingNodes.ids.length,50);
  assert.deepEqual(lite.counts.primaryStageNodeCounts,data.counts.primaryStageNodeCounts);
  for(const original of data.nodeMappings){
    const tiny=lite.nodeMappings.find(n=>n.nodeId===original.nodeId);
    assert.ok(tiny);
    for(const field of ['primaryStages','roles','evidenceLevel','evidenceLevelLabel'])
      assert.deepEqual(tiny.curriculum[field],original.curriculum[field]);
    assert.deepEqual(tiny.curriculum.beyondPrimary?.role??null,original.curriculum.beyondPrimary?.role??null);
  }
  for(const stage of GRADE_MAP_STAGES)
    assert.deepEqual([...gradeMapSelection(lite,stage).nodeIds].sort(),[...gradeMapSelection(data,stage).nodeIds].sort());
  assert.ok(JSON.stringify(lite).length < JSON.stringify(data).length*.2);
});
test('lean loader validates shape, coverage and exact stage counts',async()=>{
  const ok=await loadGradePanoramaData({fetcher:async()=>({ok:true,json:async()=>lite})});
  assert.equal(ok,lite);
  await assert.rejects(()=>loadGradePanoramaData({fetcher:async()=>({ok:false})}),/Unable to load/);
  const wrong={...lite,counts:{...lite.counts,primaryStageNodeCounts:{...lite.counts.primaryStageNodeCounts,'stage-2':0}}};
  await assert.rejects(()=>loadGradePanoramaData({fetcher:async()=>({ok:true,json:async()=>wrong})}),/count differs/);
});
