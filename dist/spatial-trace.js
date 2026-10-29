// Source-only traversal: distance is a shortest edge count, never a spatial layer.
export function traceCritical(atlas,start,direction){
  if(!['before','after'].includes(direction)||!atlas.nodes.some(n=>n.id===start))return {nodes:[],edges:[],distances:new Map()};
  const adjacency=new Map(atlas.nodes.map(n=>[n.id,[]]));
  const hard=atlas.edges.filter(e=>e.strength==='hard');
  for(const e of hard)adjacency.get(direction==='before'?e.topicId:e.prerequisiteId)?.push(direction==='before'?e.prerequisiteId:e.topicId);
  const distance=new Map([[start,0]]),queue=[start];
  for(let i=0;i<queue.length;i++)for(const id of adjacency.get(queue[i])||[])if(!distance.has(id)){distance.set(id,distance.get(queue[i])+1);queue.push(id);}
  const nodes=queue.slice(1).sort((a,b)=>distance.get(a)-distance.get(b)||a.localeCompare(b));
  const edges=hard.filter(e=>distance.has(e.prerequisiteId)&&distance.has(e.topicId));
  return {nodes,edges,distances:distance};
}
