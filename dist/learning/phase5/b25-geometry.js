// Geometry used by the angle and triangle investigations; no answer is inferred
// from a picture's incidental arm length or direction.
const EPS=1e-8;
export const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
export const rad=d=>d*Math.PI/180;
export const deg=r=>r*180/Math.PI;
export const pt=(origin,r,a)=>[origin[0]+r*Math.cos(rad(a)),origin[1]+r*Math.sin(rad(a))];
export const distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
export const angleKind=a=>!Number.isFinite(a)||a<0||a>360?'invalid':close(a,0)?'zero':close(a,90)?'right':close(a,180)?'straight':close(a,360)?'full':a<90?'acute':a<180?'obtuse':'reflex';
export const regularInterior=n=>Number.isInteger(n)&&n>=3?(n-2)*180/n:NaN;
export const polygon=n=>Array.from({length:n},(_,i)=>pt([0,0],1,90+360*i/n));
export const validTriangle=(a,b,c)=>[a,b,c].every(x=>Number.isFinite(x)&&x>0)&&a+b>c+EPS&&a+c>b+EPS&&b+c>a+EPS;
export function circleIntersections(a,r,b,s){
 if(![...a,...b,r,s].every(Number.isFinite)||r<=0||s<=0)return[];
 const d=distance(a,b);if(d<EPS||d>r+s+EPS||d<Math.abs(r-s)-EPS)return[];
 const x=(r*r-s*s+d*d)/(2*d),h2=r*r-x*x;if(h2<-EPS)return[];
 const h=Math.sqrt(Math.max(0,h2)),ux=(b[0]-a[0])/d,uy=(b[1]-a[1])/d,c=[a[0]+x*ux,a[1]+x*uy];
 const p=[c[0]-uy*h,c[1]+ux*h];return h<EPS?[p]:[p,[c[0]+uy*h,c[1]-ux*h]];
}
// AB = base, AC is a ray from A, and BC is a circle around B.
export function ssa(base,opposite,angle){
 if(![base,opposite,angle].every(Number.isFinite)||base<=0||opposite<=0||angle<=0||angle>=180)return[];
 const u=[Math.cos(rad(angle)),Math.sin(rad(angle))],disc=opposite**2-base**2*u[1]**2;if(disc<-EPS)return[];
 const v=Math.sqrt(Math.max(0,disc)),ts=[base*u[0]-v,base*u[0]+v];
 return ts.filter((x,i)=>x>EPS&&(i===0||!close(x,ts[0]))).map(x=>[x*u[0],x*u[1]]);
}
export function sas(base,side,angle){return validTriangle(base,side,Math.sqrt(Math.max(0,base**2+side**2-2*base*side*Math.cos(rad(angle)))))&&angle>0&&angle<180?[[0,0],[base,0],pt([0,0],side,angle)]:null;}
export function asa(base,a,b){if(!Number.isFinite(base)||base<=0||![a,b].every(x=>Number.isFinite(x)&&x>0)||a+b>=180)return null;const side=base*Math.sin(rad(b))/Math.sin(rad(180-a-b));return[[0,0],[base,0],pt([0,0],side,a)];}
export function triangleAngles(p){if(!Array.isArray(p)||p.length!==3)return[];return p.map((v,i)=>{const a=p[(i+1)%3],b=p[(i+2)%3],u=[a[0]-v[0],a[1]-v[1]],w=[b[0]-v[0],b[1]-v[1]],den=Math.hypot(...u)*Math.hypot(...w);return den<EPS?NaN:deg(Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/den))));});}

export function interiorAngles(p){if(!Array.isArray(p)||p.length<3)return[];return p.map((v,i)=>{const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length],u=[a[0]-v[0],a[1]-v[1]],w=[b[0]-v[0],b[1]-v[1]],den=Math.hypot(...u)*Math.hypot(...w);return den<EPS?NaN:deg(Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/den))));});}
