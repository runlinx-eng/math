const EPS=1e-8;
export const close=(a,b,tol=EPS)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol;
export const rad=x=>x*Math.PI/180;
export const deg=x=>x*180/Math.PI;
export const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
export const triangle=(a,b)=>[[0,0],[a,0],[0,b]];
export const edgeLengths=p=>p.map((v,i)=>distance(v,p[(i+1)%p.length]));
export const rotate=(p,d)=>{const c=Math.cos(rad(d)),s=Math.sin(rad(d));return[p[0]*c-p[1]*s,p[0]*s+p[1]*c];};
export const rotateAll=(p,d)=>p.map(x=>rotate(x,d));
export function squareOnEdge(p,i){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],orientation=Math.sign(p.reduce((s,v,j)=>s+v[0]*p[(j+1)%p.length][1]-v[1]*p[(j+1)%p.length][0],0));const outward=[orientation*dy,-orientation*dx];return[a,b,[b[0]+outward[0],b[1]+outward[1]],[a[0]+outward[0],a[1]+outward[1]]];}
export const area=p=>Math.abs(p.reduce((s,v,i)=>s+v[0]*p[(i+1)%p.length][1]-v[1]*p[(i+1)%p.length][0],0))/2;
export function rightVertex(p){for(let i=0;i<3;i++){const v=p[i],a=p[(i+1)%3],b=p[(i+2)%3],u=[a[0]-v[0],a[1]-v[1]],w=[b[0]-v[0],b[1]-v[1]],scale=Math.hypot(...u)*Math.hypot(...w);if(scale>EPS&&Math.abs(u[0]*w[0]+u[1]*w[1])<=EPS*scale)return i;}return -1;}
export const roles=ref=>ref===1?{hyp:1,opp:2,adj:0}:ref===2?{hyp:1,opp:0,adj:2}:null;
export const angleAtB=(a,b)=>deg(Math.atan2(b,a));
export function calculate(kind,value){if(!Number.isFinite(value))return null;if(['sin','cos','tan'].includes(kind)){const r=rad(value);if(kind==='tan'&&Math.abs(Math.cos(r))<1e-10)return null;return Math[kind](r);}if(['asin','acos'].includes(kind)){if(value<-1||value>1)return null;return deg(Math[kind](value));}if(kind==='atan')return deg(Math.atan(value));if(kind==='sqrt')return value<0?null:Math.sqrt(value);return null;}
