import * as THREE from '../../vendor/three/three.module.min.js';
import {OrbitControls} from '../../vendor/three/OrbitControls.js';
import {solid} from '../phase4/geometry.js';
import {section,isFlat} from './b27-geometry.js';
const colors=[0x91c1b2,0xe7bd7e,0xa5bbd8,0xdca68b,0xb1c78f];
const vec=a=>new THREE.Vector3(...a);
function faceGeometry(points){
 const out=[];for(let i=1;i<points.length-1;i++)out.push(...points[0],...points[i],...points[i+1]);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(out,3));g.computeVertexNormals();return g;
}
function polyShape(shape){
 if(shape==='circle')return Array.from({length:48},(_,i)=>[Math.cos(i*Math.PI/24),Math.sin(i*Math.PI/24),0]);
 const n={triangle:3,square:4,rectangle:4,pentagon:5,hexagon:6}[shape]||4;
 if(shape==='square')return [[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0]];
 if(shape==='rectangle')return [[-1.4,-.8,0],[1.4,-.8,0],[1.4,.8,0],[-1.4,.8,0]];
 return Array.from({length:n},(_,i)=>{const a=Math.PI/2+i*2*Math.PI/n;return [Math.cos(a),Math.sin(a),0];});
}
export class SpaceLab{
 constructor(host,t,onProbe,onMove){
  this.t=t;this.onProbe=onProbe;this.onMove=onMove;this.scene=new THREE.Scene();this.group=new THREE.Group();this.scene.add(this.group);
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','拖动来转动模型；也可以使用转动按钮。');host.append(this.canvas);
  this.camera=new THREE.PerspectiveCamera(38,1,.1,100);this.camera.position.set(t.type==='x-g27-net'?-3.5:3.2,t.type==='x-g27-net'?3:2.8,t.type==='x-g27-net'?6:5.5);
  this.controls=new OrbitControls(this.camera,this.canvas);this.controls.enablePan=false;this.controls.minDistance=t.type==='x-g27-net'?7.5:4.5;this.controls.maxDistance=22;
  this.controls.addEventListener('change',()=>this.render());this.controls.addEventListener('start',()=>this.startCamera=this.camera.position.clone());this.controls.addEventListener('end',()=>{if(this.startCamera&&this.startCamera.distanceTo(this.camera.position)>.001)this.onMove?.();});
  this.scene.add(new THREE.HemisphereLight(0xffffff,0x8b948e,2));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-3,7,6);this.scene.add(sun);
  this.ray=new THREE.Raycaster();this.canvas.addEventListener('pointerdown',e=>this.down=[e.clientX,e.clientY]);this.canvas.addEventListener('pointerup',e=>{if(!this.down||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5||!this.pick?.length)return;const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),this.camera);if(this.ray.intersectObjects(this.pick).length)this.onProbe?.();});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
 }
 mat(color,opacity=1){return new THREE.MeshStandardMaterial({color,roughness:.88,side:THREE.DoubleSide,transparent:opacity<1,opacity,depthWrite:opacity>=1});}
 polygon(group,points,color=colors[0],opacity=1,edge=true){const geo=faceGeometry(points),mesh=new THREE.Mesh(geo,this.mat(color,opacity));group.add(mesh);if(edge){const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points.map(vec)),new THREE.LineBasicMaterial({color:0x36584f}));group.add(line);}return mesh;}
 addSolid(group,shape,{transparent=false}={}){
  const opacity=transparent?.35:1;
  if(['tower','cubehouse'].includes(shape)){
   const parts=shape==='tower'?['cylinder','cone']:['cuboid','pyramid'];parts.forEach((s,i)=>{const g=new THREE.Group();g.scale.setScalar(.6);g.position.y=i?(shape==='tower'?.6:.42):-.6;group.add(g);this.addSolid(g,s);});
  }else if(['cube','cuboid','prism','pyramid'].includes(shape)){
   const s=solid(shape),vs=s.vertices.map(p=>shape==='prism'?[p[0],p[1],p[2]*2]:p);
   s.faces.forEach((f,i)=>this.polygon(group,f.map(k=>vs[k]),colors[i%colors.length],opacity,false));
   const line=new THREE.BufferGeometry().setFromPoints(s.edges.flatMap(([a,b])=>[vec(vs[a]),vec(vs[b])]));group.add(new THREE.LineSegments(line,new THREE.LineBasicMaterial({color:0x36584f,transparent,opacity:transparent?.65:1})));
  }else if(['sphere','cylinder','cone','hexprism'].includes(shape)){
   const geo=shape==='sphere'?new THREE.SphereGeometry(1,36,24):shape==='cylinder'?new THREE.CylinderGeometry(1,1,2,48):shape==='hexprism'?new THREE.CylinderGeometry(1,1,2,6):new THREE.ConeGeometry(1,2,48);
   const mesh=new THREE.Mesh(geo,this.mat(colors[0],opacity));group.add(mesh);
   if(shape!=='sphere')group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,20),new THREE.LineBasicMaterial({color:0x36584f,transparent,opacity:transparent?.65:1})));
  }
 }
 flat(group,shape){
  if(shape==='netcube'){
   for(const [x,y] of [[0,0],[-1,0],[1,0],[0,1],[0,-1],[0,-2]])this.polygon(group,[[x-.49,y-.49,0],[x+.49,y-.49,0],[x+.49,y+.49,0],[x-.49,y+.49,0]],colors[(x+y+9)%colors.length]);
  }else if(shape==='netbox'){
   const rects=[[-1.4,-.7,1.4,.7],[-3.4,-.7,-1.4,.7],[1.4,-.7,3.4,.7],[3.4,-.7,6.2,.7],[-1.4,.7,1.4,2.7],[-1.4,-2.7,1.4,-.7]];
   rects.forEach(([x0,y0,x1,y1],i)=>this.polygon(group,[[x0,y0,0],[x1,y0,0],[x1,y1,0],[x0,y1,0]].map(([x,y,z])=>[(x-1.4)*.4,y*.4,z]),colors[i%colors.length]));
  }else if(shape==='netprism'){this.prismNet(group,[0,1,2,3],0);group.rotation.x=Math.PI/2;group.scale.setScalar(.65);}
  else if(['picturebox','pictureprism'].includes(shape)){
   const p=shape==='picturebox'?[[[-1,-.7],[.55,-.7]],[[.55,-.7],[.55,.65]],[[.55,.65],[-1,.65]],[[-1,.65],[-1,-.7]],[[-1,.65],[-.4,1.05]],[[.55,.65],[1.15,1.05]],[[-.4,1.05],[1.15,1.05]],[[1.15,1.05],[1.15,-.3]],[[1.15,-.3],[.55,-.7]]]:
    [[[-1,-.7],[0,1]],[ [0,1],[1,-.7]],[[1,-.7],[-1,-.7]],[[0,1],[.65,1.35]],[[1,-.7],[1.65,-.35]],[[.65,1.35],[1.65,-.35]]];
   const pts=p.flatMap(([a,b])=>[new THREE.Vector3(a[0],a[1],0),new THREE.Vector3(b[0],b[1],0)]);group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x35594c})));
  }else this.polygon(group,polyShape(shape),colors[0]);
 }
 prismNet(group,parts,fold){
  const angle=fold/100,rect=(parent,center)=>{const pts=[[center-1,0,-1.5],[center+1,0,-1.5],[center+1,0,1.5],[center-1,0,1.5]];this.polygon(parent,pts,colors[parent===group?0:1]);};
  rect(group,0);
  if(parts.includes(0)){const p=new THREE.Group();p.position.x=1;p.rotation.z=angle*Math.PI*2/3;group.add(p);rect(p,1);}
  if(parts.includes(1)){const p=new THREE.Group();p.position.x=-1;p.rotation.z=-angle*Math.PI*2/3;group.add(p);rect(p,-1);}
  for(const [id,sign] of [[2,1],[3,-1]])if(parts.includes(id)){const p=new THREE.Group();p.position.z=sign*1.5;p.rotation.x=-sign*angle*Math.PI/2;group.add(p);this.polygon(p,[[-1,0,0],[1,0,0],[0,0,sign*Math.sqrt(3)]],colors[2]);}
 }
 highlight(group,shape,face,active){
  let points;
  if(['cylinder','cone'].includes(shape)){const y=face==='top'?1.008:-1.008;points=Array.from({length:48},(_,i)=>[Math.cos(i*Math.PI/24),y,Math.sin(i*Math.PI/24)]);}
  else if(shape==='pyramid')points=[[-1,-1,1.008],[1,-1,1.008],[0,1,.008]];
  else if(shape==='cube')points=[[-1,-1,1.008],[1,-1,1.008],[1,1,1.008],[-1,1,1.008]];
  else if(shape==='cuboid')points=[[-1.4,-.7,1.008],[1.4,-.7,1.008],[1.4,.7,1.008],[-1.4,.7,1.008]];
  if(points){const mesh=this.polygon(group,points,active?0xe5ae4c:0xf4dc9f,active?.95:.45);this.pick.push(mesh);}
 }
 drawCut(card,position){
  const sec=section(card.shape,card.axis,position);if(!sec)return;
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(3.7,3.7),new THREE.MeshBasicMaterial({color:0xf2c679,transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false}));
  if(card.axis==='horizontal'){plane.rotation.x=-Math.PI/2;plane.position.y=sec.points[0][1];}
  if(card.axis==='end')plane.position.z=sec.points[0][2];
  if(card.axis==='vertical')plane.rotation.y=Math.PI/2;
  this.group.add(plane);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(plane.geometry),new THREE.LineBasicMaterial({color:0xbb8e54,transparent:true,opacity:.7}));plane.add(edge);
  const mesh=this.polygon(this.group,sec.points,0xedb44f,.95,true);mesh.renderOrder=3;
 }
 update(m){
  this.clear();this.group.position.set(0,0,0);this.pick=[];const b=m.board;let shape='';
  if(['x-g27-sort','x-g27-face'].includes(this.t.type)){
   const c=this.t.cards[b.card];shape=b.revealed.includes(b.card)&&c.reveal?c.reveal:c.shape;
   if(isFlat(shape))this.flat(this.group,shape);else this.addSolid(this.group,shape);
   if(this.t.type==='x-g27-face')this.highlight(this.group,shape,c.face,b.probed.includes(b.card));
  }else if(this.t.type==='x-g27-build'){
   shape='composition';const heights=b.parts.map(s=>s==='cuboid'?.84:s==='prism'?1.08:1.2);let y=-heights.reduce((a,x)=>a+x,0)/2;b.parts.forEach((s,i)=>{const g=new THREE.Group();g.scale.setScalar(.6);g.position.y=y+heights[i]/2-(s==='prism'?.06:0);y+=heights[i];this.group.add(g);this.addSolid(g,s);});
  }else if(this.t.type==='x-g27-net'){shape='prism-net';this.prismNet(this.group,b.parts,b.fold);this.group.scale.setScalar(.75);this.group.position.y=-.65*b.fold/100;}
  else{const c=this.t.cards[b.card];shape=c.shape;this.addSolid(this.group,shape,{transparent:true});if(b.position)this.drawCut(c,b.position);}
  this.lastShape=shape;this.lastCut=this.t.type==='x-g27-cut'?b.position:null;this.render();
 }
 turn(){const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4);this.camera.position.copy(this.controls.target.clone().add(offset));this.controls.update();this.render();}
 restoreCamera(v){if(v){this.camera.position.fromArray(v.position);this.controls.target.fromArray(v.target);const offset=this.camera.position.clone().sub(this.controls.target);if(offset.length()<this.controls.minDistance){offset.setLength(this.controls.minDistance);this.camera.position.copy(this.controls.target.clone().add(offset));}this.controls.update();}}
 snapshot(){return {camera:this.camera.position.toArray(),target:this.controls.target.toArray(),shape:this.lastShape,cut:this.lastCut,objects:this.group.children.length};}
 attach(host){host.append(this.canvas);this.resizeObserver.disconnect();this.resizeObserver.observe(host);this.resize();}
 resize(){const r=this.canvas.parentElement?.getBoundingClientRect();if(!r)return;this.renderer.setSize(r.width||600,r.height||320,false);this.camera.aspect=(r.width||600)/(r.height||320);this.camera.updateProjectionMatrix();this.render();}
 render(){this.renderer.render(this.scene,this.camera);}
 clear(){this.group.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});this.group.clear();}
 destroy(){this.resizeObserver.disconnect();this.controls.dispose();this.clear();this.renderer.dispose();this.renderer.forceContextLoss();}
}
