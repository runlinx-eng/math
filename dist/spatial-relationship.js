// The chosen full-graph distribution, imported by source ID. The v49 map and
// older worlds remain available for saved questions and explicit comparison.
import {buildGlobalSpace,restoreNetworkCoordinates} from './spatial-global.js';
import {RELATIONSHIP_POSITIONS,RELATIONSHIP_SCAFFOLD} from './spatial-relationship-data.js';

export const RELATIONSHIP_VERSION=53;

export function buildRelationshipSpace(atlas){
  const space=buildGlobalSpace(atlas),domain=atlas.nodes.filter(n=>n.domainId!=='thinking');
  if(domain.length!==537||Object.keys(RELATIONSHIP_POSITIONS).length!==537||domain.some(n=>!RELATIONSHIP_POSITIONS[n.id]))throw Error('关系地图与来源节点不一致。');
  space.relationshipVersion=RELATIONSHIP_VERSION;
  space.relationshipIds=new Set(domain.map(n=>n.id));
  space.relationshipScaffold=new Set(RELATIONSHIP_SCAFFOLD.map(([from,to])=>from+'>'+to));
  for(const n of space.nodes.values())if(space.relationshipIds.has(n.id))n.position=[...RELATIONSHIP_POSITIONS[n.id]];
  // These anchors are for navigation only, not claimed prerequisite edges.
  for(const p of space.packs.values()){
    const children=p.nodeIds.filter(id=>space.relationshipIds.has(id)).map(id=>space.nodes.get(id));
    if(children.length)p.position=[0,1,2].map(i=>children.reduce((sum,n)=>sum+n.position[i],0)/children.length);
  }
  for(const t of space.themes.values()){
    const children=[...space.nodes.values()].filter(n=>n.themeId===t.id&&space.relationshipIds.has(n.id));
    if(children.length)t.position=[0,1,2].map(i=>children.reduce((sum,n)=>sum+n.position[i],0)/children.length);
  }
  space.relationshipPositions=new Map(space.objects.map(o=>[o.key,[...o.position]]));
  space.networkVersion=RELATIONSHIP_VERSION;space.networkView='oblique';
  return space;
}

export function selectRelationshipVersion(space,version,view='oblique',selected=null){
  return restoreNetworkCoordinates(space,version,view,selected);
}
