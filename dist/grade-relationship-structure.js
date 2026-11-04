// Classification over source hard prerequisites; the displayed "trunk" is
// a representative path, never a claim that mathematics has one unique trunk.
const STAGES=['stage-1','stage-2','stage-3'];
export function buildGradeRelationshipStructure(space,model){
  const domain=new Map([...space.nodes].filter(([id])=>space.relationshipIds?.has(id)));
  if(domain.size!==537||model?.nodeMappings?.length!==537||model?.packs?.length!==23)
    throw Error('Incomplete relationship or grade source');
  const incoming=new Map([...domain.keys()].map(id=>[id,[]]));
  const outgoing=new Map([...domain.keys()].map(id=>[id,[]]));
  const hard=new Set();
  for(const e of space.atlas.edges){
    if(e.strength!=='hard'||!domain.has(e.prerequisiteId)||!domain.has(e.topicId))continue;
    const key=e.prerequisiteId+'>'+e.topicId;
    if(hard.has(key))continue;
    hard.add(key);outgoing.get(e.prerequisiteId).push(e.topicId);incoming.get(e.topicId).push(e.prerequisiteId);
  }
  for(const adj of [...incoming.values(),...outgoing.values()])adj.sort();
  const degrees=new Map([...incoming].map(([id,ids])=>[id,ids.length]));
  const queue=[...domain.keys()].filter(id=>!degrees.get(id)).sort();
  const order=[];
  while(queue.length){
    const id=queue.shift();order.push(id);
    for(const child of outgoing.get(id)){
      degrees.set(child,degrees.get(child)-1);
      if(!degrees.get(child)){queue.push(child);queue.sort();}
    }
  }
  if(order.length!==domain.size)throw Error('Hard prerequisite cycle prevents structure classification');
  const reach=new Map(),depth=new Map();
  for(const id of [...order].reverse()){
    const downstream=new Set();let longest=0;
    for(const next of outgoing.get(id)){
      downstream.add(next);
      for(const child of reach.get(next))downstream.add(child);
      longest=Math.max(longest,1+depth.get(next));
    }
    reach.set(id,downstream);depth.set(id,longest);
  }
  const mapped=new Map(model.nodeMappings.map(n=>[n.nodeId,n]));
  if(mapped.size!==domain.size||[...domain.keys()].some(id=>!mapped.has(id)))
    throw Error('Stage map does not cover all source domain knowledge');
  const roots=[...domain.keys()].filter(id=>!incoming.get(id).length)
    .sort((a,b)=>reach.get(b).size-reach.get(a).size||a.localeCompare(b));
  const nodes=new Map([...domain.keys()].map(id=>[id,{
    id,themeId:domain.get(id).themeId,packId:domain.get(id).packId,
    incoming:incoming.get(id).length,outgoing:outgoing.get(id).length,
    descendants:reach.get(id).size,depth:depth.get(id),
    root:!incoming.get(id).length,leaf:!outgoing.get(id).length,
    fork:outgoing.get(id).length>=2,join:incoming.get(id).length>=2,
    trunk:false,role:'branch'
  }]));
  const stages=new Map(),backboneNodes=new Set();
  for(const stageId of STAGES){
    const members=new Set(model.nodeMappings.filter(n=>n.curriculum.primaryStages.includes(stageId)).map(n=>n.nodeId));
    const main=new Set(model.nodeMappings.filter(n=>n.curriculum.roles?.[stageId]==='main').map(n=>n.nodeId));
    const downstreamMember=new Map(),downstreamMain=new Map();
    for(const id of domain.keys()){
      let all=members.has(id)?1:0,important=main.has(id)?1:0;
      for(const n of reach.get(id)){if(members.has(n))all++;if(main.has(n))important++;}
      downstreamMember.set(id,all);downstreamMain.set(id,important);
    }
    // One root per theme at most, three independent example paths for legibility.
    const candidates=new Map();
    for(const id of roots){
      const theme=domain.get(id).themeId,rank=3*downstreamMain.get(id)+downstreamMember.get(id);
      if(!rank)continue;
      const prev=candidates.get(theme);
      if(!prev||rank>prev.rank||rank===prev.rank&&reach.get(id).size>reach.get(prev.id).size)
        candidates.set(theme,{id,rank});
    }
    const selected=[...candidates.values()].sort((a,b)=>b.rank-a.rank||a.id.localeCompare(b.id)).slice(0,3);
    const links=new Map(),paths=[],landmarks=[];
    const add=(from,to,role)=>{const key=from+'>'+to;if(hard.has(key)&&!links.has(key))links.set(key,{from,to,role});};
    for(const chosen of selected){
      const path=[chosen.id];
      while(path.length<9){
        const options=outgoing.get(path.at(-1)).filter(id=>!path.includes(id)&&downstreamMember.get(id)>0)
          .sort((a,b)=>downstreamMain.get(b)-downstreamMain.get(a)||
            downstreamMember.get(b)-downstreamMember.get(a)||reach.get(b).size-reach.get(a).size||a.localeCompare(b));
        if(!options.length)break;
        const next=options[0];add(path.at(-1),next,'trunk');path.push(next);
      }
      if(path.length<2)continue;
      for(const id of path)backboneNodes.add(id);
      let branch=null;
      for(const id of path.slice(0,-1)){
        const alternative=outgoing.get(id).filter(n=>!path.includes(n)&&downstreamMember.get(n)>0)
          .sort((a,b)=>downstreamMain.get(b)-downstreamMain.get(a)||downstreamMember.get(b)-downstreamMember.get(a)||a.localeCompare(b));
        if(alternative.length){branch={from:id,to:alternative[0]};add(id,alternative[0],'branch');break;}
      }
      paths.push({themeId:domain.get(chosen.id).themeId,rootId:chosen.id,nodeIds:path,branch,
        mappedCount:path.filter(id=>members.has(id)).length});
      landmarks.push({id:chosen.id,text:'根',role:'grade-root'});
      const middle=path.find(id=>id!==chosen.id&&main.has(id))||path[1];
      if(middle)landmarks.push({id:middle,text:'干',role:'grade-trunk'});
    }
    const groups=model.packs.map(pack=>{
      const judgement=pack.stageJudgements?.[stageId]||{};
      const records=model.nodeMappings.filter(n=>n.packId===pack.packId&&members.has(n.nodeId));
      return {packId:pack.packId,themeId:pack.themeId,name:pack.name,
        judgement:judgement.recordStatus==='incomplete'?'incomplete':judgement.mark,
        markLabel:judgement.recordStatus==='incomplete'?'待补充':judgement.markLabel,
        mappedCount:records.length,mainCount:records.filter(n=>main.has(n.nodeId)).length};
    });
    stages.set(stageId,{id:stageId,memberIds:[...members],mainIds:[...main],paths,
      links:[...links.values()],landmarks:landmarks.slice(0,6),
      pathNodeIds:[...new Set(paths.flatMap(p=>p.nodeIds))],
      groupJudgements:groups,
      stats:{mappedNodes:members.size,mainNodes:main.size,
        mainGroups:groups.filter(g=>g.judgement==='main').length,
        paths:paths.length,visibleEdges:links.size}});
  }
  for(const node of nodes.values()){
    node.trunk=backboneNodes.has(node.id);
    node.role=node.root?'root':node.leaf?'leaf':node.trunk?'trunk':'branch';
  }
  return {nodes,stages,sourceEdges:hard,stats:{
    nodes:domain.size,hardEdges:hard.size,roots:roots.length,
    leaves:[...nodes.values()].filter(n=>n.leaf).length,
    forks:[...nodes.values()].filter(n=>n.fork).length,
    joins:[...nodes.values()].filter(n=>n.join).length,
    isolated:[...nodes.values()].filter(n=>n.root&&n.leaf).length,
    trunks:[...nodes.values()].filter(n=>n.trunk).length,
    groups:model.packs.length,stages:STAGES.length}};
}
