// Issue #23 P2: derived, read-only distribution of source curriculum mappings.
// Pack-level stage research is deliberately not an input to these counts.
export const DISTRIBUTION_STAGES=Object.freeze(['stage-1','stage-2','stage-3']);

export function gradeDistribution(atlas,gradeData,scopeKind,scopeId){
  if(!['theme','pack'].includes(scopeKind))throw Error('Unknown grade distribution scope');
  if(!Array.isArray(atlas?.nodes)||!Array.isArray(atlas?.packs)||
     !Array.isArray(gradeData?.nodeMappings)||!Array.isArray(gradeData?.stages))
    throw Error('Incomplete grade distribution inputs');
  const packs=atlas.packs.filter(p=>scopeKind==='theme'?p.themeId===scopeId:p.id===scopeId);
  if(!packs.length)return null;
  const nodes=new Map(atlas.nodes.map(n=>[n.id,n]));
  const mapping=new Map(gradeData.nodeMappings.map(item=>[item.nodeId,item.curriculum]));
  const stageIds=new Set(gradeData.stages.map(stage=>stage.id));
  if(DISTRIBUTION_STAGES.some(stage=>!stageIds.has(stage)))
    throw Error('Incomplete primary curriculum stages');
  function calculate(sourcePacks){
    const ids=[...new Set(sourcePacks.flatMap(p=>p.nodeIds))];
    for(const id of ids)if(!nodes.has(id))throw Error('Knowledge group refers to an unknown node');
    const domain=ids.filter(id=>nodes.get(id).domainId!=='thinking');
    const thinking=ids.filter(id=>nodes.get(id).domainId==='thinking');
    const stageMembershipCount=id=>{
      const primary=mapping.get(id)?.primaryStages||[];
      return primary.filter(stage=>stageIds.has(stage)).length;
    };
    const stages=gradeData.stages.map(stage=>({
      id:stage.id,label:stage.label,
      nodeIds:domain.filter(id=>mapping.get(id)?.primaryStages?.includes(stage.id))
    }));
    return {
      domainNodeCount:domain.length,
      thinkingNodeCount:thinking.length,
      thinkingNodeIds:thinking,
      stages,
      overlapNodeIds:domain.filter(id=>stageMembershipCount(id)>1),
      tripleStageNodeIds:domain.filter(id=>stageMembershipCount(id)===3),
      unassignedNodeIds:domain.filter(id=>stageMembershipCount(id)===0),
      missingMappingNodeIds:domain.filter(id=>!mapping.has(id))
    };
  }
  const result=calculate(packs);
  return {...result,scopeKind,scopeId,groups:scopeKind==='theme'?packs.map(pack=>{
    const summary=calculate([pack]);
    return {
      id:pack.id,title:pack.title,
      domainNodeCount:summary.domainNodeCount,
      thinkingNodeCount:summary.thinkingNodeCount,
      overlapCount:summary.overlapNodeIds.length,
      unassignedCount:summary.unassignedNodeIds.length,
      stageCounts:summary.stages.map(stage=>stage.nodeIds.length)
    };
  }):[]};
}
