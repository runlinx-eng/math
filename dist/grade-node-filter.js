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
