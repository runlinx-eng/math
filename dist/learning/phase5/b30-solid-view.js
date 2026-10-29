import * as THREE from '../../vendor/three/three.module.min.js';
import {OrbitControls} from '../../vendor/three/OrbitControls.js';
const colors=[0x8db9a3,0xe5bb82,0x9cb9ce,0xd4a9b2,0xb8c997,0xd3ad90,0x9ec1b6,0xe5be8f,0xa9bfce,0xd4a3a3,0xb3c58d];
const vec=p=>new THREE.Vector3(...p);
function geometry(points){const out=[];for(let i=1;i<points.length-1;i++)out.push(...points[0],...points[i],...points[i+1]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(out,3));g.computeVertexNormals();return g;}
export class AreaSolidLab{
 constructor(host,t,onFace,onMove){
  this.t=t;this.onFace=onFace;this.onMove=onMove;this.scene=new THREE.Scene();this.group=new THREE.Group();this.scene.add(this.group);
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','拖动旋转立体，点击可见的面；也可以使用下面的按钮。');host.append(this.canvas);
  this.camera=new THREE.PerspectiveCamera(38,1,.1,100);this.camera.position.set(3.2,2.7,4.9);this.controls=new OrbitControls(this.camera,this.canvas);this.controls.enablePan=false;this.controls.minDistance=4.5;this.controls.maxDistance=16;this.controls.addEventListener('change',()=>this.render());this.controls.addEventListener('start',()=>this.startCamera=this.camera.position.clone());this.controls.addEventListener('end',()=>{if(this.startCamera&&this.startCamera.distanceTo(this.camera.position)>.001)this.onMove?.();});
  this.scene.add(new THREE.HemisphereLight(0xffffff,0x95a196,2));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-4,7,5);this.scene.add(sun);this.ray=new THREE.Raycaster();this.canvas.addEventListener('pointerdown',e=>this.down=[e.clientX,e.clientY]);this.canvas.addEventListener('pointerup',e=>{if(!this.down||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5)return;const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),this.camera);const hit=this.ray.intersectObjects(this.pick)[0];if(hit&&Number.isInteger(hit.object.userData.index)&&hit.object.userData.index>=0)this.onFace?.(hit.object.userData.index);});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
 }
 polygon(points,i,selected,opacity=1){const g=geometry(points),material=new THREE.MeshStandardMaterial({color:selected?0xe2a867:colors[(i>=0?i:5)%colors.length],roughness:.9,side:THREE.DoubleSide,transparent:opacity<1,opacity,depthWrite:opacity>=1});const mesh=new THREE.Mesh(g,material);mesh.userData.index=i;this.group.add(mesh);if(i>=0)this.pick.push(mesh);const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points.map(vec)),new THREE.LineBasicMaterial({color:0x345b4c,transparent:opacity<1,opacity:Math.max(.45,opacity)}));this.group.add(line);return mesh;}
 box(t,b){const[w,d,h]=t.size,X=w/2,Y=h/2,Z=d/2,faces=[
  [[-X,-Y,Z],[X,-Y,Z],[X,Y,Z],[-X,Y,Z]],[[X,-Y,-Z],[-X,-Y,-Z],[-X,Y,-Z],[X,Y,-Z]],
  [[-X,-Y,-Z],[-X,-Y,Z],[-X,Y,Z],[-X,Y,-Z]],[[X,-Y,Z],[X,-Y,-Z],[X,Y,-Z],[X,Y,Z]],
  [[-X,Y,Z],[X,Y,Z],[X,Y,-Z],[-X,Y,-Z]],[[-X,-Y,-Z],[X,-Y,-Z],[X,-Y,Z],[-X,-Y,Z]]
 ];faces.forEach((p,i)=>this.polygon(p,i,b.selected.includes(i),t.openTop&&i===4?.2:1));this.group.scale.setScalar(2/Math.max(w,d,h));}
 pyramid(t,b){const[s,slant]=t.size,q=s/2,h=Math.sqrt(slant*slant-q*q),Y=h/2,apex=[0,Y,0],v=[[-q,-Y,-q],[q,-Y,-q],[q,-Y,q],[-q,-Y,q]];
  this.polygon(v,0,b.selected.includes(0));for(let i=0;i<4;i++)this.polygon([v[i],v[(i+1)%4],apex],i+1,b.selected.includes(i+1));this.group.scale.setScalar(2/Math.max(s,h));}
 prism(t,b){const[a,c,L]=t.size,X=a/2,Y=c/2,Z=L/2,A=[-X,-Y,Z],B=[X,-Y,Z],C=[-X,Y,Z],D=[-X,-Y,-Z],E=[X,-Y,-Z],F=[-X,Y,-Z];const faces=[[A,B,C],[D,F,E],[A,D,E,B],[A,C,F,D],[B,E,F,C]];faces.forEach((p,i)=>this.polygon(p,i,b.selected.includes(i)));this.group.scale.setScalar(2/Math.max(a,c,L));}
 stack(t,b){const rise=b.split?1.35:0,face=(p,i)=>this.polygon(p,i,b.selected.includes(i));
  face([[-2,-2,-2],[2,-2,-2],[2,-2,2],[-2,-2,2]],0);
  face([[-2,-2,2],[2,-2,2],[2,0,2],[-2,0,2]],1);face([[2,-2,-2],[-2,-2,-2],[-2,0,-2],[2,0,-2]],1);
  face([[-2,-2,-2],[-2,-2,2],[-2,0,2],[-2,0,-2]],1);face([[2,-2,2],[2,-2,-2],[2,0,-2],[2,0,2]],1);
  for(const p of [[[-2,0,-2],[-1,0,-2],[-1,0,2],[-2,0,2]],[[1,0,-2],[2,0,-2],[2,0,2],[1,0,2]],[[-1,0,-2],[1,0,-2],[1,0,-1],[-1,0,-1]],[[-1,0,1],[1,0,1],[1,0,2],[-1,0,2]]])face(p,2);
  const lo=rise,hi=2+rise;face([[-1,hi,-1],[1,hi,-1],[1,hi,1],[-1,hi,1]],3);
  face([[-1,lo,1],[1,lo,1],[1,hi,1],[-1,hi,1]],4);face([[1,lo,-1],[-1,lo,-1],[-1,hi,-1],[1,hi,-1]],4);
  face([[-1,lo,-1],[-1,lo,1],[-1,hi,1],[-1,hi,-1]],4);face([[1,lo,1],[1,lo,-1],[1,hi,-1],[1,hi,1]],4);
  if(b.split){this.polygon([[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1]],-1,false,.6);this.polygon([[-1,lo,-1],[1,lo,-1],[1,lo,1],[-1,lo,1]],-1,false,.6);}this.group.scale.setScalar(.5);this.group.position.y=-rise*.12;
 }
 cylinder(t){const[r,h]=t.size,g=new THREE.CylinderGeometry(r,r,h,48,1,false),mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:colors[0],roughness:.9}));this.group.add(mesh);this.group.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,30),new THREE.LineBasicMaterial({color:0x345b4c})));this.group.scale.setScalar(2/Math.max(2*r,h));}
 lprism(){const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(3,0);shape.lineTo(3,1);shape.lineTo(2,1);shape.lineTo(2,2.5);shape.lineTo(0,2.5);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:false});g.center();const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:colors[0],roughness:.9,side:THREE.DoubleSide}));this.group.add(mesh);this.group.add(new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:0x345b4c})));this.group.scale.setScalar(.72);}
 update(m){this.clear();this.pick=[];this.group.position.set(0,0,0);this.group.scale.setScalar(1);const b=m.board;if(this.t.kind==='box')this.box(this.t,b);else if(this.t.kind==='pyramid')this.pyramid(this.t,b);else if(this.t.kind==='prism')this.prism(this.t,b);else if(this.t.kind==='stack')this.stack(this.t,b);else if(this.t.kind==='cylinder')this.cylinder(this.t);else if(this.t.kind==='lprism')this.lprism();this.render();}
 turn(){const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4);this.camera.position.copy(this.controls.target.clone().add(offset));this.controls.update();this.render();}
 restoreCamera(v){if(v){this.camera.position.fromArray(v.position);this.controls.target.fromArray(v.target);this.controls.update();}}
 snapshot(){return{camera:this.camera.position.toArray(),target:this.controls.target.toArray(),shape:this.t.kind,objects:this.group.children.length};}
 attach(host){host.append(this.canvas);this.resizeObserver.disconnect();this.resizeObserver.observe(host);this.resize();}
 resize(){const r=this.canvas.parentElement?.getBoundingClientRect();if(!r)return;this.renderer.setSize(r.width||600,r.height||330,false);this.camera.aspect=(r.width||600)/(r.height||330);this.camera.updateProjectionMatrix();this.render();}
 render(){this.renderer.render(this.scene,this.camera);}
 clear(){this.group.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});this.group.clear();}
 destroy(){this.resizeObserver.disconnect();this.controls.dispose();this.clear();this.renderer.dispose();this.renderer.forceContextLoss();}
}
