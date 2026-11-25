// v54 cylindrical layout; standalone geometry, not the default runtime view.
// See docs/spatial-exploration/V54-CYLINDER-SOURCE-AUDIT.md.
// One radial envelope for both the real domain positions and reference rings.
export function cylinderDomainRadiusBounds(y){return [80+.15*y,120+.26*y];}

// Continuous tangents at real path vertices. Y is linear and strictly ascending
// in every cubic segment; only the rendering path, never source topology, changes.
export function cylinderSpineControls(points){
  const tangent=(a,b)=>{
    const dy=b[1]-a[1];if(!(dy>0))throw Error('v54 spine: nonascending source segment');
    const dx=(b[0]-a[0])/dy,dz=(b[2]-a[2])/dy;
    const factor=Math.min(1,1.35/Math.max(1e-9,Math.hypot(dx,dz)));
    return [dx*factor,1,dz*factor];
  };
  if(points.length<2)return [];
  const tangents=points.map((_,i)=>tangent(points[Math.max(0,i-1)],points[Math.min(points.length-1,i+1)]));
  return points.slice(1).map((b,i)=>{
    const a=points[i],dy=(b[1]-a[1])/3;
    if(!(dy>0))throw Error('v54 spine: nonascending source segment');
    return {c1:a.map((v,k)=>v+dy*tangents[i][k]),c2:b.map((v,k)=>v-dy*tangents[i+1][k])};
  });
}

export function buildCylinderLayout(atlas, grade) {
  // v54 is a pure, opt-in geometry builder. Never mutate atlas or curriculum.
  const TAU=2*Math.PI, RAD=Math.PI/180, EPS=1e-7;
  const cmp=(a,b)=>a<b?-1:a>b?1:0;
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
  const diff=(a,b)=>((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;
  const isThinking=n=>n.domainId==="thinking";
  const key=e=>e.prerequisiteId+">"+e.topicId;
  const strength=e=>e.strength==="hard"?1:.35;
  const gap=e=>e.strength==="hard"?20:12;
  const fail=s=>{throw Error("v54 cylinder: "+s);};
  if(!Array.isArray(atlas?.nodes)||!Array.isArray(atlas.edges)||!Array.isArray(atlas.themes)||!Array.isArray(atlas.packs)||!Array.isArray(grade?.nodeMappings))fail("incomplete inputs");
  const ids=atlas.nodes.map(n=>n.id).sort(cmp),nodes=new Map(atlas.nodes.map(n=>[n.id,n]));
  const themeIds=atlas.themes.map(t=>t.id).sort(cmp),packs=new Map(atlas.packs.map(p=>[p.id,p]));
  if(ids.length!==nodes.size||themeIds.length!==5||new Set(themeIds).size!==5||!themeIds.includes("numbers")||packs.size!==atlas.packs.length)fail("duplicate or unexpected source groups");
  const domain=ids.filter(id=>!isThinking(nodes.get(id))),thinking=ids.filter(id=>isThinking(nodes.get(id)));
  const mappings=new Map(grade.nodeMappings.map(m=>[m.nodeId,m.curriculum]));
  if(mappings.size!==grade.nodeMappings.length||mappings.size!==domain.length||domain.some(id=>!mappings.has(id))||thinking.some(id=>mappings.has(id)))fail("curriculum IDs do not match domain IDs");
  const thinkingIds=grade.specialRisks?.thinkingNodes?.ids;
  if(!Array.isArray(thinkingIds)||thinkingIds.length!==thinking.length||new Set(thinkingIds).size!==thinking.length||thinkingIds.some(id=>!nodes.has(id)||!isThinking(nodes.get(id))))fail("thinking IDs do not match curriculum");
  for(const id of ids){
    const n=nodes.get(id),p=packs.get(n.packId);
    if(!themeIds.includes(n.themeId)||!p||p.themeId!==n.themeId||!p.nodeIds.includes(id))fail("invalid source group: "+id);
  }
  const edges=[...atlas.edges].sort((a,b)=>cmp(key(a),key(b)));
  if(new Set(edges.map(key)).size!==edges.length)fail("duplicate source edges");
  const incoming=new Map(ids.map(id=>[id,[]])),outgoing=new Map(ids.map(id=>[id,[]]));
  for(const e of edges){
    if(!nodes.has(e.topicId)||!nodes.has(e.prerequisiteId)||!["hard","soft"].includes(e.strength))fail("invalid source edge: "+key(e));
    incoming.get(e.topicId).push(e);outgoing.get(e.prerequisiteId).push(e);
  }
  const roots=ids.filter(id=>!incoming.get(id).length),remaining=new Map(ids.map(id=>[id,incoming.get(id).length]));
  const order=[...roots],depth=new Map(ids.map(id=>[id,0]));
  for(let i=0;i<order.length;i++){
    const id=order[i];
    for(const e of outgoing.get(id)){
      const v=e.topicId;depth.set(v,Math.max(depth.get(v),depth.get(id)+1));
      remaining.set(v,remaining.get(v)-1);if(remaining.get(v)===0)order.push(v);
    }
  }
  if(order.length!==ids.length)fail("source graph is cyclic");
  const stages=new Map(ids.map(id=>{
    const c=mappings.get(id),s=[...(c?.primaryStages||[])].sort(cmp);
    if(s.some(x=>!["stage-1","stage-2","stage-3"].includes(x)))fail("unknown primary stage: "+id);
    return [id,s.find(x=>c.roles?.[x]==="main")||s[0]||null];
  }));
  const anchors={"stage-1":0,"stage-2":100,"stage-3":200};
  const initialY=new Map();
  for(const id of order){
    const pre=incoming.get(id),lower=pre.length?Math.max(...pre.map(e=>initialY.get(e.prerequisiteId)+gap(e))):0;
    initialY.set(id,Math.max(stages.get(id)?anchors[stages.get(id)]:0,lower));
  }
  const themeNodes=new Map(themeIds.map(t=>[t,domain.filter(id=>nodes.get(id).themeId===t)]));
  const cross=new Map(themeIds.map(t=>[t,new Map(themeIds.map(u=>[u,0]))]));
  for(const e of edges){
    const a=nodes.get(e.prerequisiteId),b=nodes.get(e.topicId);
    if(!isThinking(a)&&!isThinking(b))cross.get(a.themeId).set(b.themeId,cross.get(a.themeId).get(b.themeId)+1);
  }
  const permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(p=>[x,...p])):[[]];
  const candidates=permutations(themeIds.filter(t=>t!=="numbers")).filter(p=>cmp(p[0],p.at(-1))<0).map(p=>["numbers",...p]);
  const adjacentScore=p=>p.reduce((s,t,i)=>{const u=p[(i+1)%p.length];return s+cross.get(t).get(u)+cross.get(u).get(t);},0);
  candidates.sort((a,b)=>adjacentScore(b)-adjacentScore(a)||cmp(a.join("|"),b.join("|")));
  const themeOrder=candidates[0],corridor=8,available=360-corridor*5,minWidth=36,maxWidth=140;
  // Bounded proportional allocation, not direct node-count allocation.
  const widths=new Map(),weights=new Map(themeOrder.map(t=>[t,Math.sqrt(themeNodes.get(t).length)]));
  let active=[...themeOrder],left=available;
  while(active.length){
    const total=active.reduce((s,t)=>s+weights.get(t),0);
    if(total<=0)fail("empty sector allocation");
    const fixed=active.map(t=>[t,left*weights.get(t)/total]).filter(([,w])=>w<minWidth-EPS||w>maxWidth+EPS);
    if(!fixed.length){for(const t of active)widths.set(t,left*weights.get(t)/total);break;}
    // Fix a single bound at a time and reallocate the remaining capacity.
    const [t,w]=fixed[0],bound=clamp(w,minWidth,maxWidth);
    widths.set(t,bound);left-=bound;active=active.filter(x=>x!==t);
  }
  let cursor=-Math.PI/2-widths.get("numbers")*RAD/2;
  const sectors=themeOrder.map(t=>{
    const width=widths.get(t),start=cursor,end=start+width*RAD;
    cursor=end+corridor*RAD;
    return {themeId:t,widthDeg:width,corridorDeg:corridor,start,end,center:(start+end)/2};
  });
  if(Math.abs(sectors.reduce((s,t)=>s+t.widthDeg+t.corridorDeg,0)-360)>EPS||sectors.some(t=>t.widthDeg<minWidth-EPS||t.widthDeg>maxWidth+EPS))fail("sector bounds");
  const sectorByTheme=new Map(sectors.map(s=>[s.themeId,s]));
  const edgeRef=e=>({prerequisiteId:e.prerequisiteId,topicId:e.topicId,strength:e.strength});
  const setUnion=(a,b)=>new Set([...a,...b]);
  const increment=(a,b)=>[...a].filter(x=>!b.has(x)).length;
  // Extract actual directed paths; pack membership influences placement only.
  const spines=[],entrySets=new Map(),reachByTheme=new Map();
  for(const theme of themeOrder){
    const members=themeNodes.get(theme),set=new Set(members);
    const localOut=id=>outgoing.get(id).filter(e=>set.has(e.topicId));
    const entries=members.filter(id=>!incoming.get(id).some(e=>set.has(e.prerequisiteId)));
    entrySets.set(theme,entries);
    const localOrder=order.filter(id=>set.has(id)),reachable=new Map();
    for(const id of [...localOrder].reverse()){
      let r=new Set([id]);for(const e of localOut(id))r=setUnion(r,reachable.get(e.topicId));reachable.set(id,r);
    }
    reachByTheme.set(theme,reachable);
    const usedRoots=new Set(),usedNodes=new Set(),usedEdges=new Set();let covered=new Set();
    const target=theme==="numbers"?3:1;
    for(let i=0;i<target;i++){
      const best=new Map();
      for(const id of [...localOrder].reverse()){
        let winner={score:0,path:[],nodes:[id]};
        for(const e of localOut(id)){
          const tail=best.get(e.topicId);
          // Hard and soft weights remain fixed; novelty is a separate term.
          const score=strength(e)+(usedEdges.has(key(e))?0:.20)+tail.score;
          if(score>winner.score+EPS||(Math.abs(score-winner.score)<=EPS&&cmp(key(e),winner.path[0]?key(winner.path[0]):"~")<0))
            winner={score,path:[e,...tail.path],nodes:[id,...tail.nodes]};
        }
        best.set(id,winner);
      }
      // Additional spines may branch at actual knowledge-pack entries rather
      // than inventing a global root. Prefer distinct genuine directed paths.
      const pool=i===0?entries:members.filter(id=>entries.includes(id)||!incoming.get(id).some(e=>set.has(e.prerequisiteId)&&nodes.get(e.prerequisiteId).packId===nodes.get(id).packId));
      const choices=pool.filter(id=>!usedRoots.has(id)&&best.get(id).path.length&&best.get(id).path.some(e=>!usedEdges.has(key(e)))).map(id=>{
        const p=best.get(id),r=reachable.get(id);
        return {id,p,r,root:incoming.get(id).length===0,low:stages.get(id)==="stage-1",gain:increment(r,covered),novel:p.path.filter(e=>!usedEdges.has(key(e))).length,newNodes:p.nodes.filter(n=>!usedNodes.has(n)).length};
      });
      choices.sort((a,b)=>i===0?Number(b.root)-Number(a.root)||Number(b.low)-Number(a.low)||b.r.size-a.r.size||b.p.score-a.p.score||cmp(a.id,b.id):b.gain-a.gain||b.novel-a.novel||b.newNodes-a.newNodes||Number(b.low)-Number(a.low)||b.p.score-a.p.score||cmp(a.id,b.id));
      if(!choices.length)break;
      const c=choices[0],overlap=c.r.size-c.gain,weightedScore=c.p.path.reduce((s,e)=>s+strength(e),0);
      spines.push({themeId:theme,index:i,rootId:c.id,isGlobalRoot:c.root,packId:nodes.get(c.id).packId,nodeIds:c.p.nodes,edges:c.p.path.map(edgeRef),weightedScore,coverage:c.r.size,newCoverage:c.gain,overlap});
      usedRoots.add(c.id);c.p.nodes.forEach(id=>usedNodes.add(id));c.p.path.forEach(e=>usedEdges.add(key(e)));covered=setUnion(covered,c.r);
    }
  }
  const numberSpines=spines.filter(s=>s.themeId==="numbers");
  if(numberSpines.length<2||numberSpines.length>3)fail("number theme needs 2–3 real spines");
  // Assign actual packs to parallel angular bands, with explicit spine node
  // membership taking priority where paths cross or merge.
  const laneById=new Map(),lanes=[];
  for(const s of sectors){
    const members=themeNodes.get(s.themeId),localSpines=spines.filter(p=>p.themeId===s.themeId);
    const count=s.themeId==="numbers"?numberSpines.length:1;
    const byLane=Array.from({length:count},()=>[]);
    const packIds=[...new Set(members.map(id=>nodes.get(id).packId))].sort(cmp),packLane=new Map();
    for(const p of packIds){
      const hits=localSpines.slice(0,count).map(sp=>sp.nodeIds.filter(id=>nodes.get(id).packId===p).length);
      let ix=0;if(count>1)for(let j=1;j<count;j++)if(hits[j]>hits[ix]||(hits[j]===hits[ix]&&byLane[j].length<byLane[ix].length))ix=j;
      packLane.set(p,ix);
    }
    for(const id of members){
      const found=count>1?localSpines.findIndex(sp=>sp.nodeIds.includes(id)):-1;
      const ix=found>=0?found:packLane.get(nodes.get(id).packId);
      byLane[ix].push(id);
    }
    if(byLane.some(a=>!a.length))fail("empty spine band");
    const pad=1.2*RAD,space=s.end-s.start-2*pad-(count-1)*pad;
    const total=byLane.reduce((n,a)=>n+Math.sqrt(a.length),0);
    let at=s.start+pad;
    for(let j=0;j<count;j++){
      const w=space*Math.sqrt(byLane[j].length)/total;
      const l={id:s.themeId+":"+j,themeId:s.themeId,index:j,start:at,end:at+w,center:at+w/2,nodeCount:byLane[j].length};
      lanes.push(l);byLane[j].forEach(id=>laneById.set(id,l));at+=w+pad;
    }
  }
  const degree=id=>incoming.get(id).length+outgoing.get(id).length;
  const maxDegree=Math.max(1,...ids.map(degree));
  const pos=new Map(),seedAngles=new Map();
  const bounds=(p)=>p.thinking?[18,62]:cylinderDomainRadiusBounds(p.y);
  // Pack-local initial order is independent of input row ordering.
  for(const l of lanes){
    const members=domain.filter(id=>laneById.get(id).id===l.id);
    members.sort((a,b)=>cmp(nodes.get(a).packId,nodes.get(b).packId)||hash(a)-hash(b)||cmp(a,b));
    for(let i=0;i<members.length;i++){
      const id=members[i],fraction=(i+.15+.7*hash("angle:"+id))/members.length;
      seedAngles.set(id,l.start+fraction*(l.end-l.start));
    }
  }
  for(const id of ids){
    const n=nodes.get(id),think=isThinking(n),y=initialY.get(id)*1.55+hash("height:"+id)*10,l=laneById.get(id);
    let theta=seedAngles.get(id);
    if(think){
      const neighbors=[...incoming.get(id).map(e=>e.prerequisiteId),...outgoing.get(id).map(e=>e.topicId)].filter(x=>!isThinking(nodes.get(x)));
      const centers=neighbors.map(x=>sectorByTheme.get(nodes.get(x).themeId).center);
      const x=centers.reduce((s,t)=>s+Math.cos(t),0),z=centers.reduce((s,t)=>s+Math.sin(t),0);
      theta=(centers.length?Math.atan2(z,x):TAU*hash(id))+(hash("thought:"+id)-.5)*.65;
      seedAngles.set(id,theta);
    }
    const p={id,themeId:n.themeId,packId:n.packId,thinking:think,laneId:l?.id??null,y,theta,r:0,
      nodeRadius:(think?2.5:2.8)+1.9*Math.log1p(degree(id))/Math.log1p(maxDegree)};
    const [lo,hi]=bounds(p),hub=Math.log1p(degree(id))/Math.log1p(maxDegree);
    p.r=lo+(hi-lo)*clamp(.18+.68*(1-hub)+(hash("r:"+id)-.5)*.20,.06,.94);
    pos.set(id,p);
  }
  // Angle-only barycentric smoothing. Project cross-theme neighbors toward
  // the lane boundary; never jump across corridors or rearrange on filtering.
  for(let pass=0;pass<14;pass++){
    const next=new Map();
    for(const id of domain){
      const p=pos.get(id),l=laneById.get(id),seed=seedAngles.get(id);
      const es=[...incoming.get(id),...outgoing.get(id)];
      let sum=seed*2,den=2;
      for(const e of es){
        const other=e.topicId===id?e.prerequisiteId:e.topicId,q=pos.get(other);
        if(q.thinking)continue;
        const ang=clamp(l.center+diff(q.theta,l.center),l.start,l.end);
        const w=strength(e)*(q.themeId===p.themeId?1:.22);
        sum+=ang*w;den+=w;
      }
      next.set(id,clamp(.5*p.theta+.5*sum/den,l.start+.002,l.end-.002));
    }
    for(const [id,t] of next)pos.get(id).theta=t;
  }
  // Actual path members follow a narrow radial/azimuth backbone before
  // constrained relaxation. Shared vertices remain single real nodes.
  const spinePlaced=new Set();
  for(const sp of spines)for(const id of sp.nodeIds){
    if(spinePlaced.has(id))continue;spinePlaced.add(id);
    const p=pos.get(id),l=laneById.get(id),[lo,hi]=bounds(p);
    p.theta=l.center+(l.end-l.start)*(.22*Math.sin(p.y/145+sp.index*1.2+hash(sp.themeId)*6.28)+(hash("spine-angle:"+id)-.5)*.09);
    p.r=lo+(hi-lo)*(.21+.13*Math.sin(p.y/185+hash(sp.themeId)*6.28)+.07*hash("spine-radius:"+id));
  }
  const projectY=()=>{
    for(const id of order){
      const p=pos.get(id);
      for(const e of incoming.get(id))p.y=Math.max(p.y,pos.get(e.prerequisiteId).y+gap(e));
    }
  };
  const cart=p=>[p.r*Math.cos(p.theta),p.y,p.r*Math.sin(p.theta)];
  const required=(a,b)=>a.nodeRadius+b.nodeRadius+7;
  const positions=ids.map(id=>pos.get(id));
  // Anisotropic constrained relaxation: angular 65%, radial 30%, Y 5%.
  // Project back to source DAG after every height adjustment.
  projectY();
  let rounds=0;
  for(;rounds<100;rounds++){
    const xyz=positions.map(cart),deltas=positions.map(()=>[0,0,0]);let collisions=0;
    for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
      const a=positions[i],b=positions[j],u=xyz[i],v=xyz[j],want=required(a,b);
      let dx=u[0]-v[0],dy=u[1]-v[1],dz=u[2]-v[2],d=Math.hypot(dx,dy,dz);
      if(d>=want-EPS)continue;collisions++;
      if(d<EPS){const t=TAU*hash(a.id+"|"+b.id);dx=Math.cos(t);dz=Math.sin(t);dy=0;d=1;}
      const f=(want-d)*.65/d;
      for(const [k,sign] of [[i,1],[j,-1]]){
        const p=positions[k],ct=Math.cos(p.theta),st=Math.sin(p.theta);
        deltas[k][0]+=sign*f*(-dx*st+dz*ct)*.65;
        deltas[k][1]+=sign*f*(dx*ct+dz*st)*.30;
        deltas[k][2]+=sign*f*dy*.05;
      }
    }
    if(!collisions)break;
    for(let i=0;i<positions.length;i++){
      const p=positions[i],d=deltas[i],l=laneById.get(p.id);
      p.theta+=clamp(d[0]/Math.max(p.r,1),-.08,.08);
      if(l)p.theta=clamp(p.theta,l.start+.002,l.end-.002);
      p.y=Math.max(0,p.y+clamp(d[2],-4,4));p.r+=clamp(d[1],-8,8);
    }
    projectY();
    for(const p of positions){const [lo,hi]=bounds(p);p.r=clamp(p.r,lo,hi);}
  }
  function separation(){
    const xyz=positions.map(cart);let min=Infinity,margin=Infinity,collisions=0;
    for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
      const d=Math.hypot(...xyz[i].map((x,k)=>x-xyz[j][k])),m=d-required(positions[i],positions[j]);
      min=Math.min(min,d);margin=Math.min(margin,m);if(m<-EPS)collisions++;
    }
    return {minCenterDistance:min,minClearance:margin,collisions};
  }
  // Capacity expansion is explicit and bounded; never silently relax spacing
  // or drop nodes. Scale both rings uniformly to preserve the isolation gap.
  let spacing=separation(),radialScale=1;
  for(let i=0;spacing.collisions&&i<12;i++){
    for(const p of positions)p.r*=1.12;
    radialScale*=1.12;spacing=separation();
  }
  if(spacing.collisions)fail("insufficient radial capacity");
  if(edges.some(e=>pos.get(e.topicId).y-pos.get(e.prerequisiteId).y<gap(e)-EPS))fail("vertical constraint failed");
  const bridges=[];
  for(const theme of themeOrder){
    if(themeNodes.get(theme).some(id=>incoming.get(id).length===0))continue;
    const entries=entrySets.get(theme),reachable=reachByTheme.get(theme);
    const candidates=entries.map(id=>{
      const options=incoming.get(id).filter(e=>{
        const n=nodes.get(e.prerequisiteId);return !isThinking(n)&&n.themeId!==theme;
      }).sort((a,b)=>strength(b)-strength(a)||cmp(key(a),key(b)));
      return {id,options};
    }).filter(c=>c.options.length);
    let covered=new Set(),chosen=new Set();
    // Select the lowest entrance for each represented pack first (up to five),
    // then additional low entrances by marginal coverage. No synthetic edges.
    while(chosen.size<Math.min(5,candidates.length)){
      const seenPacks=new Set([...chosen].map(id=>nodes.get(id).packId));
      const pool=candidates.filter(c=>!chosen.has(c.id));
      pool.sort((a,b)=>Number(seenPacks.has(nodes.get(a.id).packId))-Number(seenPacks.has(nodes.get(b.id).packId))||
        pos.get(a.id).y-pos.get(b.id).y||strength(b.options[0])-strength(a.options[0])||
        increment(reachable.get(b.id),covered)-increment(reachable.get(a.id),covered)||cmp(a.id,b.id));
      const c=pool[0];chosen.add(c.id);covered=setUnion(covered,reachable.get(c.id));bridges.push(edgeRef(c.options[0]));
      if(chosen.size>=3&&pool.slice(1).every(x=>seenPacks.has(nodes.get(x.id).packId)||nodes.get(x.id).packId===nodes.get(c.id).packId)&&increment(new Set(themeNodes.get(theme)),covered)<=1)break;
    }
    if(!bridges.some(e=>nodes.get(e.topicId).themeId===theme))fail("no real entrance for rootless theme: "+theme);
  }
  const unanchored=domain.filter(id=>!stages.get(id));
  const resultNodes=positions.map(p=>({...p,initialY:initialY.get(p.id),anchorStage:stages.get(p.id),sourceDepth:depth.get(p.id),position:cart(p)}));
  if(resultNodes.some(p=>!p.position.every(Number.isFinite)))fail("nonfinite position");
  return {version:54,themeOrder,sectors,lanes,nodes:resultNodes,spines,bridges,
    diagnostics:{nodeCount:ids.length,edgeCount:edges.length,roots,maxDepth:Math.max(...depth.values()),adjacentCrossEdges:adjacentScore(themeOrder),
      unanchoredIds:unanchored,unresolvedId:grade.specialRisks?.unresolvedNode?.id??null,rounds,radialScale,...spacing}};
}
