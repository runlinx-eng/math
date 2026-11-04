// Curriculum stage is a display filter, not a mathematical prerequisite or a spatial coordinate.
export const GRADE_MAP_STAGES=Object.freeze(['all','stage-1','stage-2','stage-3']);
export function gradeMapSelection(data,stageId='all'){
  if(!GRADE_MAP_STAGES.includes(stageId))throw Error('Unknown curriculum stage');
  if(!data||!Array.isArray(data.nodeMappings)||data.nodeMappings.length!==537)
    throw Error('Incomplete domain-node curriculum mapping');
  if(stageId==='all')return {stageId,nodeIds:new Set(),mappedCount:537};
  const nodeIds=new Set(data.nodeMappings
    .filter(record=>record.curriculum?.primaryStages?.includes(stageId))
    .map(record=>record.nodeId));
  return {stageId,nodeIds,mappedCount:nodeIds.size};
}

export async function loadGradePanoramaData(options={}){
  const url=options.url??'./data/grade-panorama-lite.json';
  const fetcher=options.fetcher??globalThis.fetch;
  if(typeof fetcher!=='function')throw Error('Curriculum fetcher is unavailable');
  const response=await fetcher(url);
  if(!response?.ok)throw Error('Unable to load curriculum stage data');
  const data=await response.json();
  if(data?.schemaVersion!==1||data.nodeMappings?.length!==537||data.stages?.length!==3||
     data.counts?.domainKnowledgeNodeCount!==537||data.specialRisks?.thinkingNodes?.ids?.length!==50)
    throw Error('Incomplete curriculum stage data');
  if(new Set(data.nodeMappings.map(item=>item.nodeId)).size!==537)
    throw Error('Duplicate node in curriculum stage data');
  for(const stage of GRADE_MAP_STAGES.slice(1))
    if(gradeMapSelection(data,stage).mappedCount!==data.counts.primaryStageNodeCounts?.[stage])
      throw Error('Curriculum stage count differs from source: '+stage);
  return data;
}
