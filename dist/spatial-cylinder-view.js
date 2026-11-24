// v54 is an opt-in layout of the existing real relationship world.
import {buildRelationshipSpace} from './spatial-relationship.js';
import {buildCylinderLayout} from './spatial-cylinder.js';
export const CYLINDER_VERSION=54;
export const CYLINDER_VIEW_KEY='math-explorer-network-cylinder-view-v1';
const PALETTE={numbers:'#4e8cff',space:'#5ecbff',measure:'#f26d85',patterns:'#a78bfa',data:'#f5c451'};
export function buildCylinderSpace(atlas,grade){
 const space=buildRelationshipSpace(atlas),layout=buildCylinderLayout(atlas,grade);
 const offset=Math.max(...layout.nodes.map(n=>n.y))/2;
 space.cylinderLayout=layout;space.cylinderOffset=offset;
 space.cylinderDomainCounts=Object.fromEntries(layout.sectors.map(s=>[s.themeId,layout.nodes.filter(n=>!n.thinking&&n.themeId===s.themeId).length]));
 space.cylinderThinkingCount=layout.nodes.filter(n=>n.thinking).length;
 space.cylinderById=new Map(layout.nodes.map(n=>[n.id,n]));
 space.relationshipVersion=CYLINDER_VERSION;space.defaultNetworkVersion=CYLINDER_VERSION;
 space.relationshipIds=new Set(layout.nodes.map(n=>n.id));
 space.relationshipScaffold=new Set([...layout.spines.flatMap(s=>s.edges),...layout.bridges].map(e=>e.prerequisiteId+'>'+e.topicId));
 space.cylinderSpineIds=new Set(layout.spines.flatMap(s=>s.nodeIds));space.cylinderRoots=new Set(layout.diagnostics.roots);
 for(const n of space.nodes.values()){
   const p=space.cylinderById.get(n.id);n.position=[p.position[0],p.y-offset,p.position[2]];
   n.color=p.thinking?'#e4dcff':PALETTE[n.themeId];
 }
 for(const p of space.packs.values()){
   const children=p.nodeIds.map(id=>space.nodes.get(id));p.position=[0,1,2].map(i=>children.reduce((s,n)=>s+n.position[i],0)/children.length);
   p.color=PALETTE[p.themeId];
 }
 for(const t of space.themes.values()){
   const sector=layout.sectors.find(s=>s.themeId===t.id),children=layout.nodes.filter(n=>!n.thinking&&n.themeId===t.id);
   // Decorative sector name, not a source node.
   const ys=children.map(n=>n.y).sort((a,b)=>a-b);
   const r=Math.max(...children.map(n=>n.r))*.94,y=Math.min(2*offset-18,ys[Math.floor((ys.length-1)*.90)]+26)-offset;
   t.position=[Math.cos(sector.center)*r,y,Math.sin(sector.center)*r];t.color=PALETTE[t.id];
 }
 space.relationshipPositions=new Map(space.objects.map(o=>[o.key,[...o.position]]));
 space.networkVersion=CYLINDER_VERSION;space.networkView='oblique';return space;
}
