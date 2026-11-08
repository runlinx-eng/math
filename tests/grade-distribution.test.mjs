import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gradeDistribution,DISTRIBUTION_STAGES} from '../dist/grade-distribution.js';
import {gradeMapSelection} from '../dist/grade-node-filter.js';

const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
const data=JSON.parse(readFileSync(new URL('../dist/data/grade-panorama-lite.json',import.meta.url),'utf8'));
const mapping=new Map(data.nodeMappings.map(m=>[m.nodeId,m.curriculum]));
const packs=atlas.packs;
const themes=atlas.themes;
const all=themes.map(t=>gradeDistribution(atlas,data,'theme',t.id));

test('P2 counts use only real domain-node mappings with independently counted overlaps',()=>{
  assert.deepEqual(DISTRIBUTION_STAGES,['stage-1','stage-2','stage-3']);
  assert.equal(themes.length,5);
  assert.equal(packs.length,23);
  assert.equal(all.reduce((n,t)=>n+t.domainNodeCount,0),537);
  assert.equal(all.reduce((n,t)=>n+t.thinkingNodeCount,0),50);
  assert.deepEqual(data.stages.map((s,i)=>all.reduce((n,t)=>n+t.stages[i].nodeIds.length,0)),[187,259,255]);
  assert.equal(all.reduce((n,t)=>n+t.overlapNodeIds.length,0),216);
  assert.equal(all.reduce((n,t)=>n+t.tripleStageNodeIds.length,0),9);
  assert.equal(all.reduce((n,t)=>n+t.unassignedNodeIds.length,0),61);
  assert.equal(all.reduce((n,t)=>n+t.missingMappingNodeIds.length,0),0);
  for(const stage of data.stages){
    const ids=new Set(all.flatMap(t=>t.stages.find(s=>s.id===stage.id).nodeIds));
    assert.deepEqual(ids,gradeMapSelection(data,stage.id).nodeIds);
  }
});

test('each of 23 pack summaries reconciles with its parent theme without thinking-node inflation',()=>{
  for(const t of themes){
    const theme=gradeDistribution(atlas,data,'theme',t.id);
    const subpacks=packs.filter(p=>p.themeId===t.id);
    assert.equal(theme.groups.length,subpacks.length);
    const details=subpacks.map(p=>gradeDistribution(atlas,data,'pack',p.id));
    assert.equal(details.reduce((n,p)=>n+p.domainNodeCount,0),theme.domainNodeCount);
    assert.equal(details.reduce((n,p)=>n+p.thinkingNodeCount,0),theme.thinkingNodeCount);
    assert.equal(details.reduce((n,p)=>n+p.unassignedNodeIds.length,0),theme.unassignedNodeIds.length);
    for(let i=0;i<3;i++){
      assert.equal(details.reduce((n,p)=>n+p.stages[i].nodeIds.length,0),theme.stages[i].nodeIds.length);
      assert.deepEqual(theme.groups.map(g=>g.stageCounts[i]),details.map(p=>p.stages[i].nodeIds.length));
    }
    for(const id of theme.thinkingNodeIds)assert.equal(atlas.nodes.find(n=>n.id===id).domainId,'thinking');
  }
  const thinkingPack=packs.find(p=>p.title==='把想法说清楚');
  const result=gradeDistribution(atlas,data,'pack',thinkingPack.id);
  assert.equal(result.domainNodeCount,1);
  assert.equal(result.thinkingNodeCount,30);
});

test('stage entries preserve roles, evidence and exact source IDs without inventing stage for unassigned nodes',()=>{
  const original=JSON.stringify(data),originalAtlas=JSON.stringify(atlas);
  const example=all.flatMap(t=>t.tripleStageNodeIds)[0];
  assert.ok(example,'at least one triple-stage node must exist');
  const p=packs.find(p=>p.nodeIds.includes(example));
  const distribution=gradeDistribution(atlas,data,'pack',p.id);
  for(const stage of distribution.stages)assert.ok(stage.nodeIds.includes(example));
  for(const stage of distribution.stages)for(const id of stage.nodeIds){
    assert.ok(mapping.get(id).primaryStages.includes(stage.id));
    assert.ok(mapping.get(id).roles?.[stage.id]);
  }
  assert.equal(all.flatMap(t=>t.unassignedNodeIds).every(id=>mapping.has(id)&&!mapping.get(id).primaryStages.length),true);
  assert.equal(JSON.stringify(data),original);
  assert.equal(JSON.stringify(atlas),originalAtlas);
});

test('group-level research is not a substitute for missing node-level membership',()=>{
  const original=data.nodeMappings.find(m=>m.curriculum.primaryStages.length);
  const modified={...data,nodeMappings:data.nodeMappings.map(m=>m.nodeId===original.nodeId?
    {...m,curriculum:{...m.curriculum,primaryStages:[]}}:m)};
  const pack=packs.find(p=>p.nodeIds.includes(original.nodeId));
  const before=gradeDistribution(atlas,data,'pack',pack.id);
  const after=gradeDistribution(atlas,modified,'pack',pack.id);
  const stage=before.stages.find(s=>s.nodeIds.includes(original.nodeId));
  assert.equal(after.stages.find(s=>s.id===stage.id).nodeIds.length,before.stages.find(s=>s.id===stage.id).nodeIds.length-1);
  assert.equal(after.unassignedNodeIds.length,before.unassignedNodeIds.length+1);
  assert.equal(after.missingMappingNodeIds.length,0);
  assert.equal(gradeDistribution(atlas,data,'theme','nonexistent'),null);
  assert.throws(()=>gradeDistribution(atlas,data,'node',original.nodeId),/Unknown grade distribution scope/);
});
