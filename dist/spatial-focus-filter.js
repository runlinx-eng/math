// Relationship-only exploration filter. Never infer knowledge edges from spatial distance.
// Every displayed arrow is an original source edge; domain coordinates stay untouched.
export const FOCUS_DIRECTIONS=['both','before','after'];
export const FOCUS_DEPTHS=['1','2','all'];
export function buildFocusFilter(atlas,domainIds,selected,direction='both',depth='1'){
  const ids=domainIds instanceof Set?domainIds:new Set(domainIds);
  if(!ids.has(selected))return {ids:new Set(),links:[],distances:new Map(),counts:{nodes:0,edges:0,hidden:0}};
  const dir=FOCUS_DIRECTIONS.includes(direction)?direction:'both';
  const range=FOCUS_DEPTHS.includes(String(depth))?String(depth):'1';
  const source=atlas.edges.filter(e=>ids.has(e.prerequisiteId)&&ids.has(e.topicId));
  const forward=new Map(),backward=new Map();
  for(const e of source){
    if(!forward.has(e.prerequisiteId))forward.set(e.prerequisiteId,[]);
    if(!backward.has(e.topicId))backward.set(e.topicId,[]);
    forward.get(e.prerequisiteId).push(e);
    backward.get(e.topicId).push(e);
  }
  const reachable=new Set([selected]),distances=new Map([[selected,0]]);
  const queue=[selected],limit=range==='all'?Infinity:Number(range);
  for(let i=0;i<queue.length;i++){
    const id=queue[i],hop=distances.get(id);
    if(hop>=limit)continue;
    const list=[...(dir==='after'?[]:backward.get(id)||[]),...(dir==='before'?[]:forward.get(id)||[])];
    for(const e of list){
      // Auxiliary associations may be seen at the direct step, but do not
      // silently become invented multi-step prerequisites.
      if(hop>0&&e.strength!=='hard')continue;
      const next=e.prerequisiteId===id?e.topicId:e.prerequisiteId;
      if(!reachable.has(next)){reachable.add(next);distances.set(next,hop+1);queue.push(next);}
    }
  }
  const links=source.filter(e=>reachable.has(e.prerequisiteId)&&reachable.has(e.topicId));
  return {ids:reachable,links,distances,counts:{nodes:reachable.size,edges:links.length,hidden:ids.size-reachable.size}};
}

// v54 ordinary exploration lock: follow only directed hard prerequisites
// transitively; retain all original direct relations (including soft/thinking)
// without promoting a direct association to a multi-step prerequisite.
export function buildCylinderLock(atlas,domainIds,selected){
 const ids=domainIds instanceof Set?domainIds:new Set(domainIds);
 if(!ids.has(selected))return {ids:new Set(),links:[],distances:new Map(),upstreamCount:0,counts:{nodes:0,edges:0,hidden:0}};
 const source=atlas.edges.filter(e=>ids.has(e.prerequisiteId)&&ids.has(e.topicId)),backward=new Map();
 for(const e of source)if(e.strength==='hard'){
   if(!backward.has(e.topicId))backward.set(e.topicId,[]);
   backward.get(e.topicId).push(e);
 }
 const distances=new Map([[selected,0]]),queue=[selected];
 for(let i=0;i<queue.length;i++)for(const e of backward.get(queue[i])||[]){
   const id=e.prerequisiteId;if(!distances.has(id)){distances.set(id,distances.get(queue[i])+1);queue.push(id);}
 }
 const ancestors=new Set(queue);
 const links=source.filter(e=>e.prerequisiteId===selected||e.topicId===selected||e.strength==='hard'&&ancestors.has(e.prerequisiteId)&&ancestors.has(e.topicId));
 for(const e of links)for(const id of [e.prerequisiteId,e.topicId])if(!distances.has(id))distances.set(id,1);
 const reachable=new Set(distances.keys());
 return {ids:reachable,links,distances,upstreamCount:ancestors.size-1,counts:{nodes:reachable.size,edges:links.length,hidden:ids.size-reachable.size}};
}

// v54 compact inspection is a read-only summary of the same source graph.
export function buildCylinderInspection(atlas,locatedIds,selected,locked=false){
  const ids=locatedIds instanceof Set?locatedIds:new Set(locatedIds);
  const thinkingIds=new Set(atlas.nodes.filter(n=>n.domainId==='thinking').map(n=>n.id));
  const before=new Set(),after=new Set(),thinking=new Set();
  let soft=0;
  if(ids.has(selected))for(const e of atlas.edges){
    if(!ids.has(e.prerequisiteId)||!ids.has(e.topicId))continue;
    if(e.prerequisiteId!==selected&&e.topicId!==selected)continue;
    const other=e.topicId===selected?e.prerequisiteId:e.topicId;
    if(other===selected)continue;
    if(e.strength==='hard'){
      if(e.topicId===selected)before.add(other);
      if(e.prerequisiteId===selected)after.add(other);
    }
    if(thinkingIds.has(selected)?!thinkingIds.has(other):thinkingIds.has(other))thinking.add(other);
    if(e.strength==='soft')soft++;
  }
  const upstreamCount=locked?buildCylinderLock(atlas,ids,selected).upstreamCount:null;
  return {before:[...before],after:[...after],thinking:[...thinking],soft,upstreamCount,thinkingNode:thinkingIds.has(selected)};
}
