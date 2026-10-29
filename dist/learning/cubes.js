// Adapted from Hidden Cubes: local Three.js toon cubes, fill, rotate and separate layers.
// Original design/source: vendor/os-taxonomy/.agents/skills/marble-builder/examples/hidden-cubes/.
import * as THREE from '../vendor/three/three.module.min.js';
import {OrbitControls} from '../vendor/three/OrbitControls.js';
import {voxels} from './tasks.js';
export class CubeView{
 constructor(host,t,onFill){this.t=t;this.onFill=onFill;this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','可转动的积木。拖动改变视角，滚轮缩放；可用转一转和拆层按钮。');host.append(this.canvas);
 this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(35,1,.1,100);this.camera.position.set(7,7,9);this.controls=new OrbitControls(this.camera,this.canvas);this.controls.target.set(0,t.dims[2]*.55,0);this.controls.enablePan=false;this.controls.minDistance=5;this.controls.maxDistance=25;this.controls.update();
 this.scene.add(new THREE.HemisphereLight(0xffffff,0x88918d,2));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-3,8,5);this.scene.add(sun);this.group=new THREE.Group();this.scene.add(this.group);this.geometry=new THREE.BoxGeometry(.96,.96,.96);this.edge=new THREE.EdgesGeometry(this.geometry);this.edgeMat=new THREE.LineBasicMaterial({color:0x273d3b});
 const gradient=new THREE.DataTexture(new Uint8Array([90,180,255]),3,1,THREE.RedFormat);gradient.needsUpdate=true;gradient.minFilter=gradient.magFilter=THREE.NearestFilter;this.gradient=gradient;
 this.materials=[0x85c9bc,0xf0c47c,0xb6c5e6,0xe3a58d,0xb4c99e].map(color=>new THREE.MeshToonMaterial({color,gradientMap:gradient}));this.ghost=new THREE.MeshBasicMaterial({color:0x809b94,transparent:true,opacity:.07,depthWrite:false});
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(5,5,.12,48),new THREE.MeshToonMaterial({color:0xf0ecdd,gradientMap:gradient}));floor.position.y=-.13;this.floor=floor;this.scene.add(floor);
 this.cubes=voxels(t).map((v,i)=>{const g=new THREE.Group(),mesh=new THREE.Mesh(this.geometry,this.materials[v[1]%5]);mesh.userData.index=i;g.add(mesh,new THREE.LineSegments(this.edge,this.edgeMat));g.userData.cell=v;g.userData.index=i;this.group.add(g);return g;});
 this.raycaster=new THREE.Raycaster();this.canvas.addEventListener('pointerdown',e=>this.down=[e.clientX,e.clientY]);this.canvas.addEventListener('pointerup',e=>{if((t.type!=='fill'&&!t.build)||!this.down||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5)return;const r=this.canvas.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const hit=this.raycaster.intersectObjects(this.cubes.map(g=>g.children[0])).find(h=>!(this.model.filled||[]).includes(h.object.userData.index));if(hit)this.onFill(hit.object.userData.index);});
 this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.controls.addEventListener('change',()=>this.render());this.resize();
 }
 attach(host){host.append(this.canvas);this.resizeObserver.disconnect();this.resizeObserver.observe(host);this.resize();}
 resize(){const host=this.canvas.parentElement;if(!host)return;const r=host.getBoundingClientRect();this.renderer.setSize(r.width||600,r.height||300,false);this.camera.aspect=(r.width||600)/(r.height||300);this.camera.updateProjectionMatrix();this.render();}
 update(model,{spread=0,reveal=false}={}){this.model=model;this.controls.enabled=!this.t.staticView||spread>0;const [w,d]=this.t.dims;this.cubes.forEach(g=>{const[x,y,z]=g.userData.cell;let dx=0,dy=0,dz=0;
 if(this.t.type==='decompose'){const k={x:0,y:1,z:2}[model.axis];const offset=(g.userData.cell[k]<model.cut?-1:1)*spread*.8;if(k===0)dx=offset;if(k===1)dy=offset+spread*.8;if(k===2)dz=offset;}else dy=y*spread*.5;
 g.position.set(x-(w-1)/2+dx,y+.5+dy,z-(d-1)/2+dz);const ghost=(this.t.type==='fill'||this.t.build)&&!(model.filled||[]).includes(g.userData.index);g.children[0].material=ghost?this.ghost:this.materials[this.t.type==='decompose'?(g.userData.cell[{x:0,y:1,z:2}[model.axis]]<model.cut?0:1):y%5];g.children[1].visible=!ghost;});this.render();}
 turn(){if(this.t.staticView&&!this.controls.enabled)return;const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4);this.camera.position.copy(this.controls.target.clone().add(offset));this.controls.update();this.render();}
 render(){this.renderer.render(this.scene,this.camera);}
 restoreCamera(v){if(!v)return;this.camera.position.fromArray(v.position);this.controls.target.fromArray(v.target);this.controls.update();this.render();}
 snapshot(){return {camera:this.camera.position.toArray(),target:this.controls.target.toArray(),cells:this.cubes.map(g=>({cell:g.userData.cell,position:g.position.toArray()}))};}
 destroy(){this.resizeObserver.disconnect();this.controls.dispose();this.geometry.dispose();this.edge.dispose();this.edgeMat.dispose();this.materials.forEach(m=>m.dispose());this.ghost.dispose();this.floor.geometry.dispose();this.floor.material.dispose();this.gradient.dispose();this.renderer.dispose();this.renderer.forceContextLoss();}
}
