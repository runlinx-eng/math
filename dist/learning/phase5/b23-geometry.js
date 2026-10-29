import{solid}from'../phase4/geometry.js';
const EPS=1e-7;
export const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
export const vectors=ps=>ps.map((p,i)=>[ps[(i+1)%ps.length][0]-p[0],ps[(i+1)%ps.length][1]-p[1]]);
const eq=(a,b)=>Math.abs(a-b)<EPS;
export const gridPoint=i=>[i%7,Math.floor(i/7)];
export function regular(n,r=2,rotation=-90){return Array.from({length:n},(_,i)=>{const a=(rotation+360*i/n)*Math.PI/180;return[r*Math.cos(a),r*Math.sin(a)];});}
export const rotate=(p,a)=>{const c=Math.cos(a*Math.PI/180),s=Math.sin(a*Math.PI/180);return[p[0]*c-p[1]*s,p[0]*s+p[1]*c];};
export const reflect=(p,a)=>{const c=Math.cos(2*a*Math.PI/180),s=Math.sin(2*a*Math.PI/180);return[c*p[0]+s*p[1],s*p[0]-c*p[1]];};
function orientation(a,b,c){return cross([b[0]-a[0],b[1]-a[1]],[c[0]-a[0],c[1]-a[1]]);}
function onSegment(a,b,p){return Math.abs(orientation(a,b,p))<EPS&&p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS;}
function intersects(a,b,c,d){const o1=orientation(a,b,c),o2=orientation(a,b,d),o3=orientation(c,d,a),o4=orientation(c,d,b);return (o1*o2< -EPS&&o3*o4< -EPS)||onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b);}
export function simple(ps){if(ps.length<3||new Set(ps.map(p=>p.join(','))).size!==ps.length)return false;const n=ps.length;for(let i=0;i<n;i++){if(dist(ps[i],ps[(i+1)%n])<EPS||Math.abs(orientation(ps[(i+n-1)%n],ps[i],ps[(i+1)%n]))<EPS)return false;for(let j=i+1;j<n;j++){if(j===i||j===(i+1)%n||i===(j+1)%n)continue;if(intersects(ps[i],ps[(i+1)%n],ps[j],ps[(j+1)%n]))return false;}}const area=ps.reduce((s,p,i)=>s+cross(p,ps[(i+1)%n]),0)/2;return Math.abs(area)>EPS;}
export function properties(ps){const vs=vectors(ps),n=ps.length,sides=vs.map(v=>Math.hypot(...v)),right=vs.map((v,i)=>Math.abs(dot(v,vs[(i+1)%n]))<EPS),equalSides=sides.every(x=>eq(x,sides[0])),equalAngles=vs.map((v,i)=>{const w=vs[(i+1)%n];return dot(v,w)/(Math.hypot(...v)*Math.hypot(...w));}).every((x,_,a)=>eq(x,a[0]));const angles=vs.map((v,i)=>{const w=vs[(i+1)%n];return 180-Math.acos(Math.max(-1,Math.min(1,dot(v,w)/(Math.hypot(...v)*Math.hypot(...w)))))*180/Math.PI;});const para=n===4&&Math.abs(cross(vs[0],vs[2]))<EPS&&Math.abs(cross(vs[1],vs[3]))<EPS,rectangle=n===4&&right.every(Boolean),rhombus=n===4&&equalSides&&para,square=rectangle&&rhombus;return{n,sides,right,angles,equalSides,equalAngles,parallel:para,rectangle,rhombus,square,regular:equalSides&&equalAngles};}
export function symmetric(ps,angle){const out=ps.map(p=>reflect(p,angle));return out.every(p=>ps.some(q=>dist(p,q)<EPS));}
export const shapes={
 square:[[-2,-2],[2,-2],[2,2],[-2,2]],
 rectangle:[[-3,-2],[3,-2],[3,2],[-3,2]],
 rhombus:[[-3,0],[0,-2],[3,0],[0,2]],
 parallelogram:[[-3,-2],[1,-2],[3,2],[-1,2]],
 trapezoid:[[-3,-2],[3,-2],[1,2],[-2,2]],
 irregular:[[-3,-2],[2,-2],[3,2],[-2,1]],
 triangle:[[-2,-1],[2,-1],[1,2]],
 isosceles:[[-2,-1],[2,-1],[0,2]],
 righttriangle:[[0,0],[4,0],[0,3]],
 equilateral:regular(3,2,-90),hexagon:regular(6,2,0),pentagon:regular(5,2,-90),
};
export const scenario=(name,angle=0)=>shapes[name].map(p=>rotate(p,angle));
export function lineRelation(ps,a,b){const v=vectors(ps),x=v[a],y=v[b];return{parallel:Math.abs(cross(x,y))<EPS,perpendicular:Math.abs(dot(x,y))<EPS};}
export function pointsForMeasure(t,f){const a=Number(f.first),b=Number(f.second),angle=Number(f.angle);if(!Number.isFinite(a)||a<=0||a>10)return null;if(t.mode==='triangle'){if(!Number.isFinite(b)||b<=0||b>10||!Number.isFinite(angle)||angle<=0||angle>=180)return null;return[[0,0],[a,0],[b*Math.cos(angle*Math.PI/180),b*Math.sin(angle*Math.PI/180)]];}if(t.mode==='rectangle'){if(!Number.isFinite(b)||b<=0||b>10)return null;return[[0,0],[a,0],[a,b],[0,b]];}if(t.mode==='regular'){if(!eq(angle,108))return null;const radius=a/(2*Math.sin(Math.PI/5));return regular(5,radius,-90);}return null;}
export const CUBE_EDGES=solid('cube').edges;
// Circle-circle intersections; returns both points with no construction-point shortcuts.
export function intersections(a,r,b,s){const d=dist(a,b);if(d<EPS||d>r+s+EPS||d<Math.abs(r-s)-EPS)return[];const x=(r*r-s*s+d*d)/(2*d),h2=r*r-x*x;if(h2< -EPS)return[];const h=Math.sqrt(Math.max(0,h2)),ux=(b[0]-a[0])/d,uy=(b[1]-a[1])/d,c=[a[0]+x*ux,a[1]+x*uy];return[[c[0]-uy*h,c[1]+ux*h],[c[0]+uy*h,c[1]-ux*h]];}
export function constructData(mode,r){if(mode==='bisector'){const A=[2,5],B=[8,5];return{centers:{A,B},intersections:intersections(A,r,B,r),line:[A,B]};}if(mode==='angle'){const O=[2,2],C=[4,2],D=[2,4];return{centers:{C,D},origin:O,intersections:intersections(C,r,D,r),line:[O,[7,2],[2,7]]};}if(mode==='perpendicular'){const P=[5,8],C=[1,5],D=[9,5];return{centers:{C,D},origin:P,intersections:intersections(C,r,D,r),line:[[0,5],[10,5]]};}}
