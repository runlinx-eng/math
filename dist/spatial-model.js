// Stable spatial organization. Coordinates are navigation aids; only source edges
// express prerequisites. Learning state never changes an object's position.
export const VIEW_KEY = 'math-explorer-space-v1';
export const LAYOUT_VERSION = 1;
const add = (a,b) => a.map((v,i)=>v+b[i]);
const mix = (a,b,t) => a.map((v,i)=>v+(b[i]-v)*t);
export const distance = (a,b) => Math.hypot(...a.map((v,i)=>v-b[i]));
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const seeds = [[-285,145,65],[260,145,-25],[285,-155,90],[-250,-160,-35],[0,35,-305]];
export const objectKey = (kind,id) => `${kind}:${id}`;

export function buildSpace(atlas){
  const objects=[], byKey=new Map(), themes=new Map(), packs=new Map(), nodes=new Map();
  const put=o=>{objects.push(o);byKey.set(o.key,o);return o;};
  atlas.themes.forEach((t,i)=>{
    const children=atlas.packs.filter(p=>p.themeId===t.id).sort((a,b)=>a.id.localeCompare(b.id));
    const theme=put({...t,kind:'theme',key:objectKey('theme',t.id),position:[...seeds[i]],radius:156,children:[]});
    themes.set(t.id,theme);
    children.forEach((p,j)=>{
      const a=j/children.length*Math.PI*2-.35;
      const position=add(theme.position,[Math.cos(a)*105,Math.sin(a)*90,Math.sin(a*2+.7)*52]);
      const pack=put({...p,kind:'pack',key:objectKey('pack',p.id),position,radius:24+Math.sqrt(p.nodeIds.length)*3.4,color:t.color,children:[],parent:theme.key});
      theme.children.push(pack.key);packs.set(p.id,pack);
    });
  });
  // A modest, deterministic attraction between linked packs preserves the broad
  // regions while bringing cross-region connections slightly closer together.
  const anchors=new Map([...packs].map(([id,p])=>[id,[...p.position]]));
  const links=[...atlas.packLinks].sort((a,b)=>(a.fromPack+a.toPack).localeCompare(b.fromPack+b.toPack));
  for(let pass=0;pass<40;pass++){
    const changes=new Map([...packs].map(([id,p])=>[id,p.position.map((v,i)=>(anchors.get(id)[i]-v)*.09)]));
    for(const l of links){const a=packs.get(l.fromPack),b=packs.get(l.toPack);if(!a||!b)continue;
      const amount=Math.min(2,Math.sqrt(l.edges.length))*.0008;
      for(let i=0;i<3;i++){const d=(b.position[i]-a.position[i])*amount;changes.get(a.id)[i]+=d;changes.get(b.id)[i]-=d;}}
    for(const [id,p] of packs)p.position=add(p.position,changes.get(id));
  }
  const sourceNodes=new Map(atlas.nodes.map(n=>[n.id,n]));
  for(const pack of packs.values()){
    const ids=[...pack.nodeIds].sort(), count=ids.length;
    const local=new Map(ids.map((id,j)=>{
      const y=1-2*(j+.5)/count,a=j*2.399963229728653+(hash(pack.id)%100)/100;
      const r=pack.radius*(.38+.6*((hash(id)%1000)/1000)**.35),q=Math.sqrt(1-y*y);
      return [id,[Math.cos(a)*q*r,y*r,Math.sin(a)*q*r]];
    }));
    // Retain stable shells, with local related objects drawn a little closer.
    const internal=atlas.edges.filter(e=>local.has(e.topicId)&&local.has(e.prerequisiteId)).sort((a,b)=>(a.topicId+a.prerequisiteId).localeCompare(b.topicId+b.prerequisiteId));
    const original=new Map([...local].map(([id,p])=>[id,[...p]]));
    for(let pass=0;pass<24;pass++){
      const next=new Map([...local].map(([id,p])=>[id,mix(p,original.get(id),.06)]));
      for(const e of internal){const a=local.get(e.prerequisiteId),b=local.get(e.topicId);next.set(e.prerequisiteId,mix(next.get(e.prerequisiteId),b,.012));next.set(e.topicId,mix(next.get(e.topicId),a,.012));}
      for(const id of ids)local.set(id,next.get(id));
    }
    ids.forEach(id=>{
      const n=sourceNodes.get(id);const node=put({...n,kind:'node',key:objectKey('node',id),position:add(pack.position,local.get(id)),radius:3.5,color:pack.color,parent:pack.key});
      nodes.set(id,node);pack.children.push(node.key);
    });
  }
  const themeLinks=new Map();
  for(const l of links){const a=packs.get(l.fromPack),b=packs.get(l.toPack);if(a.themeId===b.themeId)continue;
    const key=`${a.themeId}:${b.themeId}`;
    if(!themeLinks.has(key))themeLinks.set(key,{from:themes.get(a.themeId).key,to:themes.get(b.themeId).key,edges:[]});
    themeLinks.get(key).edges.push(...l.edges);
  }
  return {objects,byKey,themes,packs,nodes,atlas,themeLinks:[...themeLinks.values()]};
}

export function relationsFor(space,key){
  const object=space.byKey.get(key);if(!object)return [];
  if(object.kind==='node')return space.atlas.edges.filter(e=>e.topicId===object.id||e.prerequisiteId===object.id).map(e=>({from:objectKey('node',e.prerequisiteId),to:objectKey('node',e.topicId),edges:[e]}));
  if(object.kind==='pack')return space.atlas.packLinks.filter(e=>e.fromPack===object.id||e.toPack===object.id).map(e=>({from:objectKey('pack',e.fromPack),to:objectKey('pack',e.toPack),edges:e.edges}));
  return space.themeLinks.filter(e=>e.from===key||e.to===key);
}

export function parseView(raw,space){
  if(!raw||raw.version!==LAYOUT_VERSION)return null;
  const vector=v=>Array.isArray(v)&&v.length===3&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<1e6);
  if(!vector(raw.position)||!vector(raw.target)||distance(raw.position,raw.target)<5)return null;
  const selected=space.byKey.has(raw.selected)?raw.selected:null;
  const panels=(Array.isArray(raw.panels)?raw.panels:[]).filter(p=>p&&space.nodes.has(p.id)&&vector(p.anchor)).slice(0,2).map(p=>({id:p.id,anchor:[...p.anchor],minimized:!!p.minimized,expanded:!!p.expanded,tab:['activity','overview','records'].includes(p.tab)?p.tab:null}));
  const activePanel=panels.some(p=>p.id===raw.activePanel)?raw.activePanel:panels.at(-1)?.id||null;
  return {...(Number.isFinite(raw.cameraZoom)&&raw.cameraZoom>=.05&&raw.cameraZoom<=100?{cameraZoom:raw.cameraZoom}:{}),...([47,48,49].includes(raw.networkVersion)?{networkVersion:raw.networkVersion}:{}),...(['map','relations','oblique','legacy'].includes(raw.networkView)?{networkView:raw.networkView}:{}),version:LAYOUT_VERSION,position:[...raw.position],target:[...raw.target],selected,panels,activePanel,showAllNodes:!!raw.showAllNodes,relationMode:['source','route'].includes(raw.relationMode)?raw.relationMode:'off',journeyOpen:!!raw.journeyOpen,...(typeof raw.learningSectionId==='string'&&raw.learningSectionId.length<=32?{learningSectionId:raw.learningSectionId,learningRoutePage:Number.isInteger(raw.learningRoutePage)&&raw.learningRoutePage>=0?Math.min(100,raw.learningRoutePage):0}:{}),...(typeof raw.learningRouteId==='string'&&raw.learningRouteId.length<=32?{learningRouteId:raw.learningRouteId}:{}),...(typeof raw.sessionId==='string'?{sessionId:raw.sessionId}:{}),...(typeof raw.questionId==='string'?{questionId:raw.questionId}:{})};
}
