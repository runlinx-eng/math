import {regular,rotate as turn,dist,simple} from './b23-geometry.js';
export {dist,simple};
const EPS=1e-7;
export const eq=(a,b)=>Math.abs(a-b)<EPS;
export const pointEq=(a,b)=>a.length===b.length&&a.every((v,i)=>eq(v,b[i]));
export const pointSetEq=(a,b)=>a.length===b.length&&a.every(p=>b.some(q=>pointEq(p,q)));
export const translate=(p,dx,dy)=>[p[0]+dx,p[1]+dy];
export function reflect(p,line){const[x,y]=p;if(line==='x')return[x,-y];if(line==='y')return[-x,y];if(line==='y=x')return[y,x];if(line==='y=-x')return[-y,-x];if(line.startsWith('x=')){const c=Number(line.slice(2));return[2*c-x,y];}throw Error('unknown mirror');}
export function rotate(p,center,degrees){const a=turn([p[0]-center[0],p[1]-center[1]],degrees);return a.map((v,i)=>Math.abs(v+center[i])<EPS?0:Math.round((v+center[i])*1e8)/1e8);}
export const scale=(p,center,factor)=>p.map((v,i)=>center[i]+factor*(v-center[i]));
export function applyOp(points,op){if(op.kind==='move')return points.map(p=>translate(p,op.dx,op.dy));if(op.kind==='mirror')return points.map(p=>reflect(p,op.line));if(op.kind==='turn')return points.map(p=>rotate(p,op.center,op.angle));if(op.kind==='scale')return points.map(p=>scale(p,op.center,op.factor));throw Error('unknown transformation');}
export const applyOps=(points,ops)=>ops.reduce((p,o)=>applyOp(p,o),points.map(p=>[...p]));
export function sides(points){if(points.length<2)return[];return points.map((p,i)=>dist(p,points[(i+1)%points.length]));}
export function angles(points){if(points.length<3)return[];return points.map((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length],u=[a[0]-p[0],a[1]-p[1]],v=[b[0]-p[0],b[1]-p[1]],z=(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v));return Math.acos(Math.max(-1,Math.min(1,z)))*180/Math.PI;});}
export const sameMetrics=(a,b)=>a.length===b.length&&sides(a).every((x,i)=>eq(x,sides(b)[i]))&&angles(a).every((x,i)=>eq(x,angles(b)[i]));
export const quadrant=([x,y])=>x===0||y===0?'axis':x>0?(y>0?'I':'IV'):(y>0?'II':'III');
const R=(p,a)=>rotate(p,[0,0],a);
export const motifs={square:[[[-2,-2],[2,-2],[2,2],[-2,2]]],triangle:[regular(3,2,-90)],heart:[[[-2,1],[-1,2],[0,1],[1,2],[2,1],[2,0],[0,-2],[-2,0]]],pinwheel:Array.from({length:4},(_,i)=>[[0,0],[2,0],[1,1]].map(p=>R(p,i*90)))};
export function motifMatches(name,angle){const original=motifs[name],rotated=original.map(poly=>poly.map(p=>R(p,angle)));return rotated.every(poly=>original.some(ref=>pointSetEq(poly,ref)));}
export const interior=n=>(n-2)*180/n;
export function fanPolygon(n,index,side=1.45){const radius=side/(2*Math.sin(Math.PI/n)),v=regular(n,radius,0),first=v[0];return v.map(p=>R([p[0]-first[0],p[1]-first[1]],-(90+180/n)+index*interior(n)));}
// A centrally symmetric modified square: opposite edges are translated copies.
export function tile(a){return a===0?[[0,0],[4,0],[4,4],[0,4]]:[[0,0],[4,0],[4+a,1],[4-a,3],[4,4],[0,4],[-a,3],[a,1]];}
export function tileAt(a,col,row,angle){return tile(a).map(p=>translate(rotate(p,[2,2],angle),4*col,4*row));}
export const baseMotif=[[0,0],[2,0],[0,1]];
export const reflectedMotif=baseMotif.map(p=>reflect(p,'x=2'));
export const motifAt=(source,dx)=>source.map(p=>translate(p,dx,0));

export const studioBase=[[1,0],[2,0],[1,1]];
export const studioParts=(mirrored,rotated)=>{const base=studioBase,mirror=base.map(p=>reflect(p,'y')),parts=mirrored?[base,mirror]:[base];return rotated?[...parts,...parts.map(poly=>poly.map(p=>rotate(p,[0,0],180)))]:parts;};
export const samePolygons=(a,b)=>a.length===b.length&&a.every(p=>b.some(q=>pointSetEq(p,q)));
