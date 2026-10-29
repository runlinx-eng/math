// A second, deterministic view of the same source objects. It does not add
// prerequisites or change the preserved coordinates of the original world.
import {buildSpace} from './spatial-model.js';

function hash(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}

function buildLegacyNetworkSpace(atlas){
  const space=buildSpace(atlas), ids=[...space.nodes.keys()].sort();
  const neighbors=new Map(ids.map(id=>[id,new Set()])),next=new Map(ids.map(id=>[id,[]]));
  const indegree=new Map(ids.map(id=>[id,0])),layer=new Map(ids.map(id=>[id,0]));
  const edges=[...atlas.edges].sort((a,b)=>(a.prerequisiteId+'>'+a.topicId).localeCompare(b.prerequisiteId+'>'+b.topicId));
  for(const e of edges){
    if(!neighbors.has(e.prerequisiteId)||!neighbors.has(e.topicId))throw new Error('源关系包含无法定位的节点。');
    neighbors.get(e.prerequisiteId).add(e.topicId);neighbors.get(e.topicId).add(e.prerequisiteId);
    next.get(e.prerequisiteId).push(e.topicId);indegree.set(e.topicId,indegree.get(e.topicId)+1);
  }
  const queue=ids.filter(id=>indegree.get(id)===0);let cursor=0;
  while(cursor<queue.length){const id=queue[cursor++];for(const to of next.get(id)){
    layer.set(to,Math.max(layer.get(to),layer.get(id)+1));indegree.set(to,indegree.get(to)-1);
    if(indegree.get(to)===0)queue.push(to);
  }}
  if(queue.length!==ids.length)throw new Error('源关系含有环，暂时不能按前置链排列。');
  const maxLayer=Math.max(0,...layer.values());
  const themes=[...space.themes.values()];
  const weights=themes.map(t=>Math.sqrt(ids.filter(id=>space.nodes.get(id).themeId===t.id).length));
  const total=weights.reduce((a,b)=>a+b,0),sectors=new Map();let start=-Math.PI/2;
  themes.forEach((t,i)=>{const width=weights[i]/total*Math.PI*2;sectors.set(t.id,{mid:start+width/2,width});start+=width;});
  const packsByTheme=new Map(themes.map(t=>[t.id,[...space.packs.values()].filter(p=>p.themeId===t.id).sort((a,b)=>a.id.localeCompare(b.id))]));
  for(const id of ids){
    const n=space.nodes.get(id),local=neighbors.get(id),sector=sectors.get(n.themeId),packs=packsByTheme.get(n.themeId);
    const packIndex=packs.findIndex(p=>p.id===n.packId),h=hash(id),u=(h%10000)/10000,v=(Math.floor(h/10000)%10000)/10000;
    const otherThemes=new Set([...local].map(k=>space.nodes.get(k).themeId));otherThemes.delete(n.themeId);
    const angle=sector.mid+sector.width*(.82*((packIndex+.5)/packs.length-.5)+.12*(u-.5));
    const radius=310-otherThemes.size*70+(v-.5)*40;
    n.position=[Math.cos(angle)*radius,(layer.get(id)-maxLayer/2)*16,Math.sin(angle)*radius];
    n.degree=local.size;n.crossThemes=otherThemes.size;n.layer=layer.get(id);
  }
  for(const p of space.packs.values()){
    const nodes=p.nodeIds.map(id=>space.nodes.get(id));
    p.position=[0,1,2].map(i=>nodes.reduce((sum,n)=>sum+n.position[i],0)/nodes.length);
    p.radius=24+Math.sqrt(nodes.length)*3.4;
  }
  for(const t of themes){const sector=sectors.get(t.id);t.position=[Math.cos(sector.mid)*365,30,Math.sin(sector.mid)*365];}
  space.layout='network';space.maxLayer=maxLayer;
  return space;
}

// Keep the old coordinate system for question snapshots made in v47.
// The new map has categorical regions, not a centrality or difficulty axis.
export function buildNetworkSpace(atlas){
  const space=buildLegacyNetworkSpace(atlas);
  space.legacyPositions=new Map(space.objects.map(o=>[o.key,[...o.position]]));
  const anchors={numbers:[-350,0,-90],space:[0,0,-205],measure:[350,0,-90],patterns:[-185,0,245],data:[185,0,245]};
  for(const theme of space.themes.values()){
    const center=anchors[theme.id],packs=[...space.packs.values()].filter(p=>p.themeId===theme.id).sort((a,b)=>a.id.localeCompare(b.id));
    const orbit=packs.length>4?98:78;
    for(let i=0;i<packs.length;i++){
      const p=packs[i],angle=-Math.PI/2+i/packs.length*Math.PI*2;
      p.position=[center[0]+Math.cos(angle)*orbit,0,center[2]+Math.sin(angle)*orbit];
      p.radius=24+Math.sqrt(p.nodeIds.length)*3.4;
      const ids=[...p.nodeIds].sort();
      ids.forEach((id,j)=>{
        const angle=j*2.399963229728653+(hash(p.id)%100)/100,r=(p.radius-10)*Math.sqrt((j+.5)/ids.length);
        space.nodes.get(id).position=[p.position[0]+Math.cos(angle)*r,0,p.position[2]+Math.sin(angle)*r];
      });
    }
    const radius=orbit+Math.max(...packs.map(p=>p.radius))+15;
    theme.region={center,radius};theme.radius=radius;
    theme.position=[center[0],0,center[2]-radius-24];
  }
  space.mapPositions=new Map(space.objects.map(o=>[o.key,[...o.position]]));
  space.networkView='map';space.relationIds=null;
  return space;
}

export function relationLayout(space,id){
  if(!space.nodes.has(id))return null;
  const before=[],after=[],edges=space.atlas.edges.filter(e=>e.topicId===id||e.prerequisiteId===id);
  for(const e of edges)(e.topicId===id?before:after).push(e.topicId===id?e.prerequisiteId:e.topicId);
  const order=(a,b)=>{
    const x=space.nodes.get(a),y=space.nodes.get(b);
    return x.themeId.localeCompare(y.themeId)||x.packId.localeCompare(y.packId)||a.localeCompare(b);
  };
  before.sort(order);after.sort(order);
  const positions=new Map([[id,[0,0,0]]]);
  // Rows wrap for legibility; every node in a band is a direct neighbor.
  for(const [ids,sign]of [[before,-1],[after,1]]){
    const cols=Math.min(6,Math.max(1,Math.ceil(Math.sqrt(ids.length*1.5))));
    for(let i=0;i<ids.length;i++){
      const row=Math.floor(i/cols),count=Math.min(cols,ids.length-row*cols);
      positions.set(ids[i],[(i%cols-(count-1)/2)*240,sign*(200+row*180),0]);
    }
  }
  return {id,before,after,edges,positions};
}

export function applyNetworkView(space,view='map',selected=null){
  const focus=selected?.startsWith('node:')?selected.slice(5):null;
  const relation=view==='relations'?relationLayout(space,focus):null;
  if(view==='relations'&&!relation)view='map';
  const base=view==='legacy'?space.legacyPositions:space.mapPositions;
  for(const o of space.objects)o.position=[...base.get(o.key)];
  if(relation)for(const [id,p]of relation.positions)space.nodes.get(id).position=[...p];
  space.networkView=view;space.relationLayout=relation;
  space.relationIds=relation?new Set(relation.positions.keys()):null;
  return view;
}
