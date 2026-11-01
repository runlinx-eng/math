// Side-by-side measurement of the same domain-node and hard-edge projection.
// These geometric counts do not measure mathematical understanding.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildGlobalSpace} from '../dist/spatial-global.js';
import {buildRelationshipSpace} from '../dist/spatial-relationship.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'verification/spatial-readability-v54-20261031');
fs.mkdirSync(out,{recursive:true});
const atlas=JSON.parse(fs.readFileSync(path.join(root,'dist/data/atlas.json'))),ids=atlas.nodes.filter(n=>n.domainId!=='thinking').map(n=>n.id),set=new Set(ids);
const edges=atlas.edges.filter(e=>e.strength==='hard'&&set.has(e.prerequisiteId)&&set.has(e.topicId));
if(ids.length!==537||edges.length!==808)throw Error('Comparison input differs from the fixed domain subset.');
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],normalize=a=>{const n=Math.hypot(...a);return a.map(x=>x/n);};
const direction=normalize([.65,.5,1]),right=normalize(cross([0,1,0],direction)),up=normalize(cross(direction,right)),width=590,height=460,padding=20;
function project(space){
  const raw=new Map(ids.map(id=>{const p=space.nodes.get(id).position;return [id,[dot(p,right),-dot(p,up)]];}));
  const xs=[...raw.values()].map(p=>p[0]),ys=[...raw.values()].map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min((width-2*padding)/(maxX-minX),(height-2*padding)/(maxY-minY));
  return new Map([...raw].map(([id,p])=>[id,[width/2+(p[0]-(minX+maxX)/2)*scale,height/2+(p[1]-(minY+maxY)/2)*scale]]));
}
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function stats(points){
  let closePairs=0,crossings=0;
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=points.get(ids[i]),b=points.get(ids[j]);if(Math.hypot(a[0]-b[0],a[1]-b[1])<6)closePairs++;}
  for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
    const a=edges[i],b=edges[j];if(a.topicId===b.topicId||a.topicId===b.prerequisiteId||a.prerequisiteId===b.topicId||a.prerequisiteId===b.prerequisiteId)continue;
    const p=points.get(a.prerequisiteId),q=points.get(a.topicId),r=points.get(b.prerequisiteId),s=points.get(b.topicId);
    if(orient(p,q,r)*orient(p,q,s)<0&&orient(r,s,p)*orient(r,s,q)<0)crossings++;
  }
  return {nearNodePairsUnder6Pixels:closePairs,projectedCrossingsWithoutSharedEndpoint:crossings};
}
function draw(space,points,x){
  const lines=edges.map(e=>{const a=points.get(e.prerequisiteId),b=points.get(e.topicId);return `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}"/>`;}).join('');
  const nodes=ids.map(id=>{const n=space.nodes.get(id),p=points.get(id);return `<circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="2.8" fill="${n.color}"/>`;}).join('');
  return `<g transform="translate(${x},55)"><rect width="${width}" height="${height}" fill="#f5f4ef"/><g stroke="#71837b" stroke-opacity=".31" stroke-width=".8">${lines}</g>${nodes}</g>`;
}
const old=buildGlobalSpace(atlas),current=buildRelationshipSpace(atlas),oldPoints=project(old),newPoints=project(current);
const report={nodes:ids.length,hardEdges:edges.length,softEdges:0,viewport:[width,height],projectionDirection:direction,nodeRadiusPixels:2.8,old:stats(oldPoints),current:stats(newPoints),limitations:'Same nodes, edges, direction, point size and viewport; each is independently fitted. Screen-space overlap is not comprehension, correctness or a 3D quality metric.'};
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="545" viewBox="0 0 1200 545"><rect width="1200" height="545" fill="#fffef9"/><g font-family="sans-serif" fill="#23463f"><text x="20" y="30" font-size="16">v49 · same 537 nodes / 808 hard edges</text><text x="620" y="30" font-size="16">v53 · same 537 nodes / 808 hard edges</text><text x="20" y="538" font-size="11">Same camera direction and point size; each layout fitted to the same viewport. Projection only.</text></g>${draw(old,oldPoints,0)}${draw(current,newPoints,600)}</svg>`;
fs.writeFileSync(path.join(out,'layout-comparison.svg'),svg);fs.writeFileSync(path.join(out,'layout-comparison.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
