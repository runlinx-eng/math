// Finite models used by the space, sorting and slicing activities.
export const NAMES={cube:'正方体',cuboid:'长方体',pyramid:'四棱锥',prism:'三棱柱',sphere:'球',cylinder:'圆柱',cone:'圆锥',hexprism:'六棱柱',circle:'圆',square:'正方形',triangle:'三角形',rectangle:'长方形',pentagon:'五边形',hexagon:'六边形',netcube:'正方体展开图',netbox:'长方体展开图',netprism:'三棱柱展开图',picturebox:'长方体画法',pictureprism:'三棱柱画法'};
export const isFlat=s=>['circle','square','triangle','rectangle','pentagon','hexagon','netcube','netbox','netprism','picturebox','pictureprism'].includes(s);
export function section(shape,axis,position){
 const p=Number(position)/4;if(![.25,.5,.75].includes(p))return null;
 if(shape==='prism'&&axis==='end'){const z=-1.4+2.8*p;return {shape:'triangle',scale:1,points:[[-1,-.8,z],[1,-.8,z],[0,1,z]]};}
 if(shape==='cone'&&axis==='vertical'&&p===.5)return {shape:'triangle',scale:1,points:[[0,-1,-1],[0,-1,1],[0,1,0]]};
 if(axis!=='horizontal')return null;
 const y=-1+2*p;
 if(['cube','cuboid','pyramid'].includes(shape)){const s=shape==='pyramid'?1-p:1,dx=shape==='cuboid'?1.4*s:s,dz=s;return {shape:shape==='cuboid'?'rectangle':'square',scale:s,points:[[-dx,y,-dz],[dx,y,-dz],[dx,y,dz],[-dx,y,dz]]};}
 if(['cylinder','cone','hexprism'].includes(shape)){const s=shape==='cone'?1-p:1,n=shape==='hexprism'?6:48;return {shape:shape==='hexprism'?'hexagon':'circle',scale:s,points:Array.from({length:n},(_,i)=>{const a=Math.PI/2+2*Math.PI*i/n;return [Math.cos(a)*s,y,Math.sin(a)*s];})};}
 return null;
}
export const sizeRelation=shape=>['cone','pyramid'].includes(shape)?'smaller':'same';
export const sectionShape=(shape,axis)=>section(shape,axis,axis==='vertical'?2:1)?.shape||null;
// Equilateral prism net: one base rectangle, two side rectangles and two triangles.
// Folding about their shared edges preserves every face and joins all prism edges.
export const prismNetParts=['右侧长方形','左侧长方形','前面的三角形','后面的三角形'];
