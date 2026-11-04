import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const source=read('dist/data/grade-progression.json');
const lite={
  schemaVersion:1,
  stages:source.stages,
  nodeMappings:source.nodeMappings.map(item=>({
    nodeId:item.nodeId,
    curriculum:{
      primaryStages:item.curriculum.primaryStages,
      roles:item.curriculum.roles,
      evidenceLevel:item.curriculum.evidenceLevel,
      evidenceLevelLabel:item.curriculum.evidenceLevelLabel,
      beyondPrimary:item.curriculum.beyondPrimary?{role:item.curriculum.beyondPrimary.role}:null
    }
  })),
  specialRisks:{
    thinkingNodes:{ids:source.specialRisks.thinkingNodes.ids},
    unresolvedNode:{id:source.specialRisks.unresolvedNode.id,status:source.specialRisks.unresolvedNode.status}
  },
  counts:{
    domainKnowledgeNodeCount:source.counts.domainKnowledgeNodeCount,
    primaryStageNodeCounts:source.counts.primaryStageNodeCounts
  }
};
if(lite.nodeMappings.length!==537||new Set(lite.nodeMappings.map(n=>n.nodeId)).size!==537)
  throw Error('Domain-node curriculum IDs must remain 537 unique mappings');
for(const stage of lite.stages){
  const mapped=lite.nodeMappings.filter(item=>item.curriculum.primaryStages.includes(stage.id)).length;
  if(mapped!==source.counts.primaryStageNodeCounts[stage.id])throw Error('Stage count mismatch: '+stage.id);
}
const output=resolve(root,'dist/data/grade-panorama-lite.json'),text=JSON.stringify(lite)+'\n';
if(process.argv.includes('--check')){
  if(readFileSync(output,'utf8')!==text)throw Error('Generated panorama data is stale; rebuild and commit it');
  console.log('Compact panorama data is up to date: '+lite.nodeMappings.length+' nodes');
}else{
  writeFileSync(output,text,'utf8');
  console.log('Generated compact panorama data: '+text.length+' UTF-8 characters');
}
