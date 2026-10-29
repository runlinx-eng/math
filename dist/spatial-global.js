// One global 3D coordinate system. Views and selections never rearrange it.
// The v47/v48 builders remain available only for restoring saved worlds.
import {buildNetworkSpace,applyNetworkView} from './spatial-network.js';

export const GLOBAL_VERSION=49;
export function hardLayers(atlas){
  const ids=atlas.nodes.map(n=>n.id).sort(),incoming=new Map(ids.map(id=>[id,0]));
  const next=new Map(ids.map(id=>[id,[]])),layers=new Map(ids.map(id=>[id,0]));
  for(const e of atlas.edges.filter(e=>e.strength==='hard')){
    if(!next.has(e.prerequisiteId)||!incoming.has(e.topicId))throw Error('关键关系包含无法定位的节点。');
    next.get(e.prerequisiteId).push(e.topicId);incoming.set(e.topicId,incoming.get(e.topicId)+1);
  }
  const queue=ids.filter(id=>incoming.get(id)===0);let at=0;
  while(at<queue.length){const id=queue[at++];for(const to of next.get(id).sort()){
    layers.set(to,Math.max(layers.get(to),layers.get(id)+1));incoming.set(to,incoming.get(to)-1);
    if(incoming.get(to)===0)queue.push(to);
  }}
  if(at!==ids.length)throw Error('关键前置关系含有环，不能推定上下层次。');
  return layers;
}

export function buildGlobalSpace(atlas){
  const space=buildNetworkSpace(atlas),layers=hardLayers(atlas),max=Math.max(...layers.values()),step=28,floor=-max*step/2;
  space.globalInfo={version:GLOBAL_VERSION,maxLayer:max,step,floor,ceiling:floor+max*step};
  for(const n of space.nodes.values()){n.sourceLayer=layers.get(n.id);n.position[1]=floor+n.sourceLayer*step;}
  for(const p of space.packs.values()){
    const nodes=p.nodeIds.map(id=>space.nodes.get(id));
    p.position[1]=nodes.reduce((sum,n)=>sum+n.position[1],0)/nodes.length;
  }
  for(const t of space.themes.values()){
    const nodes=[...space.nodes.values()].filter(n=>n.themeId===t.id),ys=nodes.map(n=>n.position[1]);
    const minY=Math.min(...ys),maxY=Math.max(...ys),[x,,z]=t.region.center;
    t.globalRegion={center:[x,(minY+maxY)/2,z],minY,maxY,radius:t.region.radius};
    t.position=[x,(minY+maxY)/2,z];
    t.globalLabel=[x,maxY+52,z-t.region.radius-24];
  }
  space.globalPositions=new Map(space.objects.map(o=>[o.key,[...o.position]]));
  space.networkVersion=GLOBAL_VERSION;space.networkView='oblique';space.relationLayout=null;space.relationIds=null;
  return space;
}

export function restoreNetworkCoordinates(space,version,view,selected){
  if(version===GLOBAL_VERSION){
    // Current view/selection updates are coordinate-invariant, including array identity.
    if(space.networkVersion!==GLOBAL_VERSION)for(const o of space.objects)o.position=[...space.globalPositions.get(o.key)];
    space.networkVersion=GLOBAL_VERSION;space.networkView=view;space.relationLayout=null;space.relationIds=null;
    return view;
  }
  space.networkVersion=version;
  return applyNetworkView(space,version===47?'legacy':view,selected);
}
