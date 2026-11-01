// Whole-map observation cues from REAL hard prerequisites only.
// These are inspectable examples of direction/fork/convergence, not a curriculum
// or a claim that the knowledge graph has one trunk.
export const OVERVIEW_ROLES=['origin','fork','join'];
export function buildOverviewStructure(space){
  const nodes=new Map([...space.nodes.values()].filter(n=>space.relationshipIds?.has(n.id)).map(n=>[n.id,n]));
  const incoming=new Map([...nodes.keys()].map(id=>[id,[]]));
  const outgoing=new Map([...nodes.keys()].map(id=>[id,[]]));
  const byEdge=new Map();
  for(const e of space.atlas.edges){
    if(e.strength!=='hard'||!nodes.has(e.prerequisiteId)||!nodes.has(e.topicId))continue;
    outgoing.get(e.prerequisiteId).push(e.topicId);
    incoming.get(e.topicId).push(e.prerequisiteId);
    byEdge.set(e.prerequisiteId+'>'+e.topicId,e);
  }
  const order=[...nodes.keys()].sort((a,b)=>nodes.get(b).position[1]-nodes.get(a).position[1]);
  const reach=new Map(),depth=new Map();
  for(const id of order){
    const descendants=new Set(),next=outgoing.get(id);
    let longest=0;
    for(const child of next){descendants.add(child);for(const d of reach.get(child)||[])descendants.add(d);longest=Math.max(longest,1+(depth.get(child)||0));}
    reach.set(id,descendants);depth.set(id,longest);
  }
  for(const next of outgoing.values())next.sort((a,b)=>(reach.get(b).size-reach.get(a).size)||(depth.get(b)-depth.get(a))||a.localeCompare(b));
  const continueFrom=(root,steps)=>{const path=[root];while(path.length<=steps){const next=outgoing.get(path.at(-1)).find(id=>!path.includes(id));if(!next)break;path.push(next);}return path;};
  const linksByRole=new Map(OVERVIEW_ROLES.map(role=>[role,new Map()]));
  const add=(role,from,to)=>{
    const key=from+'>'+to,edge=byEdge.get(key);
    if(edge)linksByRole.get(role).set(key,{from,to,role});
  };
  const addPath=(role,path)=>{for(let i=1;i<path.length;i++)add(role,path[i-1],path[i]);};
  const roots=[...nodes.keys()].filter(id=>incoming.get(id).length===0).sort((a,b)=>reach.get(b).size-reach.get(a).size||a.localeCompare(b));
  const origin=roots[0];if(!origin)return {paths:[],links:[],landmarks:[],nodeRoles:new Map(),stats:{hard:byEdge.size,selected:0}};
  const foundation=continueFrom(origin,11);
  addPath('origin',foundation);
  const forks=[...nodes.keys()].filter(id=>outgoing.get(id).length>=2&&reach.get(id).size>=6)
    .sort((a,b)=>(reach.get(b).size+Math.min(depth.get(b),12)*3)-(reach.get(a).size+Math.min(depth.get(a),12)*3)||a.localeCompare(b));
  const fork=forks.find(id=>id!==origin&&outgoing.get(id)[0]!==outgoing.get(id)[1])||forks[0];
  if(fork){
    for(const parent of incoming.get(fork).slice(0,1))add('fork',parent,fork);
    for(const child of outgoing.get(fork).slice(0,2)){add('fork',fork,child);addPath('fork',continueFrom(child,5));}
  }
  const joins=[...nodes.keys()].filter(id=>incoming.get(id).length>=2&&depth.get(id)>=2)
    .sort((a,b)=>(reach.get(b).size+depth.get(b)*2)-(reach.get(a).size+depth.get(a)*2)||a.localeCompare(b));
  const forkSegment=new Set([...linksByRole.get('fork').values()].flatMap(e=>[e.from,e.to]));
  const join=joins.find(id=>!forkSegment.has(id)&&id!==origin)||joins[0];
  if(join){
    for(const parent of incoming.get(join).slice(0,Math.min(3,incoming.get(join).length))){
      add('join',parent,join);
      for(const grand of incoming.get(parent).slice(0,1))add('join',grand,parent);
    }
    addPath('join',continueFrom(join,7));
  }
  const anchors=[{role:'origin',id:origin,text:'共同起点示例'},{role:'fork',id:fork,text:'真实分叉示例'},{role:'join',id:join,text:'真实汇合示例'}].filter(a=>a.id);
  const links=[...linksByRole.values()].flatMap(map=>[...map.values()]);
  const nodeRoles=new Map();
  for(const role of OVERVIEW_ROLES)for(const e of linksByRole.get(role).values()){
    if(!nodeRoles.has(e.from))nodeRoles.set(e.from,role);
    if(!nodeRoles.has(e.to))nodeRoles.set(e.to,role);
  }
  for(const anchor of anchors)nodeRoles.set(anchor.id,anchor.role);
  const roleNodeSets=new Map(OVERVIEW_ROLES.map(role=>[role,new Set([...linksByRole.get(role).values()].flatMap(link=>[link.from,link.to]))]));
  return {paths:OVERVIEW_ROLES.map(role=>({role,links:[...linksByRole.get(role).values()]})),links,landmarks:anchors,nodeRoles,roleNodeSets,
    stats:{hard:byEdge.size,selected:new Set(links.map(e=>e.from+'>'+e.to)).size,roots:roots.length,forkCount:forks.length,joinCount:joins.length,originCoverage:reach.get(origin).size,visibleNodeCount:nodes.size}};
}
