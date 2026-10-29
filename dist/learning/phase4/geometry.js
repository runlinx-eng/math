// Mathematical geometry shared by the displayed objects and their checks.
const neg=a=>a.map(x=>-x),same=(a,b)=>a.every((x,i)=>x===b[i]);
export function solid(shape){
 const vertices=shape==='pyramid'?[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,1,0]]:shape==='prism'?[[-1,-.8,-.7],[1,-.8,-.7],[0,1,-.7],[-1,-.8,.7],[1,-.8,.7],[0,1,.7]]:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>shape==='cuboid'?[v[0]*1.4,v[1]*.7,v[2]]:v);
 const faces=shape==='pyramid'?[[0,3,2,1],[0,1,4],[1,2,4],[2,3,4],[3,0,4]]:shape==='prism'?[[0,2,1],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]]:[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[1,2,6,5],[0,4,7,3]];
 const edgeMap=new Map();for(const f of faces)for(let i=0;i<f.length;i++){const e=[f[i],f[(i+1)%f.length]].sort((a,b)=>a-b);edgeMap.set(e.join(','),e);}return {vertices,faces,edges:[...edgeMap.values()]};
}
export const NETS={cross:[[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]],stair:[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]],block:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]};
export function foldedNet(cells){
 if(!cells.length)return {valid:false,tree:[],normals:[],opposite:[]};const index=new Map(cells.map((p,i)=>[p.join(','),i])),axes=Array(cells.length),tree=[];axes[0]={u:[1,0,0],v:[0,1,0],n:[0,0,1]};const queue=[0];let conflict=false;
 for(const parent of queue){const a=axes[parent],[x,y]=cells[parent];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const i=index.get([x+dx,y+dy].join(','));if(i===undefined)continue;const b=dx===1?{u:neg(a.n),v:a.v,n:a.u}:dx===-1?{u:a.n,v:a.v,n:neg(a.u)}:dy===1?{u:a.u,v:neg(a.n),n:a.v}:{u:a.u,v:a.n,n:neg(a.v)};if(axes[i]){if(!same(axes[i].n,b.n)||!same(axes[i].u,b.u))conflict=true;}else{axes[i]=b;tree.push({parent,child:i,dx,dy});queue.push(i);}}}
 const normals=axes.map(a=>a?.n||null),unique=new Set(normals.filter(Boolean).map(a=>a.join(','))),opposite=[];normals.forEach((a,i)=>{if(a)normals.forEach((b,j)=>{if(b&&j>i&&same(a,neg(b)))opposite.push([i,j]);});});return {valid:cells.length===6&&queue.length===6&&unique.size===6&&!conflict,tree,normals,opposite};
}
export function floorCells(t,m){const w=t.draw?m.w:t.w,h=t.draw?m.h:t.h;return t.cells?[...t.cells]:Array.from({length:w*h},(_,i)=>i);}
// Clip a polygon against each square; areas drive both the pond picture and its half-square rule.
function clip(poly,axis,bound,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ina=sign*(a[axis]-bound)>=-1e-9,inb=sign*(b[axis]-bound)>=-1e-9;if(ina)out.push(a);if(ina!==inb){const k=(bound-a[axis])/(b[axis]-a[axis]);out.push(a.map((x,j)=>x+(b[j]-x)*k));}}return out;}
export function pondCells(t){const out=[];for(let y=0;y<t.h;y++)for(let x=0;x<t.w;x++){let p=t.polygon;for(const[a,b,s]of [[0,x,1],[0,x+1,-1],[1,y,1],[1,y+1,-1]])if(p.length)p=clip(p,a,b,s);const area=Math.abs(p.reduce((n,a,i)=>{const b=p[(i+1)%p.length];return n+a[0]*b[1]-a[1]*b[0];},0))/2;out.push(area);}return out;}
