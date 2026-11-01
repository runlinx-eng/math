// Relationship-only exploration filter. Never infer knowledge edges from spatial distance.
// Every displayed arrow is an original source edge; domain coordinates stay untouched.
export const FOCUS_DIRECTIONS=['both','before','after'];
export const FOCUS_DEPTHS=['1','2','all'];
export function buildFocusFilter(atlas,domainIds,selected,direction='both',depth='1'){
  const ids=domainIds instanceof Set?domainIds:new Set(domainIds);
  if(!ids.has(selected))return {ids:new Set(),links:[],counts:{nodes:0,edges:0,hidden:0}};
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
