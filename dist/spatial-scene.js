import * as THREE from './vendor/three/three.module.min.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
import {relationsFor} from './spatial-model.js';
import {placeLabel} from './spatial-labels.js';
import {applyNetworkView} from './spatial-network.js';
import {GLOBAL_VERSION,restoreNetworkCoordinates} from './spatial-global.js';
import {activityForms,activityGlyph,ACTIVITY_FORMS} from './spatial-activities.js';
import {ACTIVITIES,activityIds} from './exploration-content.js';
import {routeStep,routeLinks} from './journey-model.js';

import {LESSONS,ROUTES,lessonForTopic,routeFor,routeForPack,routesForPack,topicIds} from './learning/catalog.js';
import {personalRelations} from './learning/bridges.js';
const V=a=>new THREE.Vector3(...a);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function regionGeometry(theme,space){
  const geometry=new THREE.SphereGeometry(1,32,20),position=geometry.attributes.position;
  const centers=theme.children.map(key=>{const p=space.byKey.get(key);return {v:V(p.position).sub(V(theme.position)),r:p.radius*.65};});
  for(let i=0;i<position.count;i++){const v=new THREE.Vector3().fromBufferAttribute(position,i).normalize();const radius=Math.max(90,...centers.map(p=>v.dot(p.v)+p.r));v.multiplyScalar(radius);position.setXYZ(i,v.x,v.y,v.z);}
  geometry.computeVertexNormals();return geometry;
}
export class SpatialScene {
  constructor(host,space,callbacks={}) {
    this.host=host;this.space=space;this.network=space.layout==='network';this.networkVersion=space.networkVersion||48;this.networkView=this.network?(space.networkView||'map'):null;this.callbacks=callbacks;this.selected=null;this.hovered=null;this.filter='all';this.dirty=true;this.labels=[];this.relations=[];this.relationMode='off';this.showAllNodes=this.network;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setClearColor(0xf5f4ef,1);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    host.prepend(this.renderer.domElement);this.canvas=this.renderer.domElement;
    this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','三维数学空间。方向键平移，加减键缩放；也可以使用查找定位知识。');
    this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2(0xf5f4ef,.00016);
    this.camera=space.globalInfo?new THREE.OrthographicCamera(-800,800,600,-600,1,20000):new THREE.PerspectiveCamera(40,1,1,20000);this.camera.fov=40;this.camera.aspect=1;
    this.camera.position.set(370,260,1600);
    this.controls=new OrbitControls(this.camera,this.canvas);
    this.controls.enableDamping=!matchMedia('(prefers-reduced-motion: reduce)').matches;this.controls.dampingFactor=.13;this.controls.minDistance=28;this.controls.maxDistance=8000;
    this.controls.screenSpacePanning=true;this.controls.zoomToCursor=true;this.controls.minZoom=.15;this.controls.maxZoom=35;this.controls.rotateSpeed=.65;this.controls.panSpeed=.85;
    this.controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
    this.controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE};
    this.controls.minPolarAngle=this.network?.0001:.04;this.controls.maxPolarAngle=Math.PI-.04;this.controls.listenToKeyEvents(this.canvas);
    this.controls.addEventListener('change',()=>{this.dirty=true;});
    this.controls.addEventListener('start',()=>{this.tween=null;callbacks.onStart?.();});
    this.controls.addEventListener('end',()=>callbacks.onSettled?.());
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x8e9c91,2));
    const sun=new THREE.DirectionalLight(0xfff7e9,2.8);sun.position.set(-350,600,650);this.scene.add(sun);
    const fill=new THREE.DirectionalLight(0xd8e8ef,.75);fill.position.set(400,-100,-350);this.scene.add(fill);
    const grid=new THREE.GridHelper(6000,60,0xc4cec8,0xd2d8d2);grid.position.y=-400;grid.material.transparent=true;grid.material.opacity=.045;this.scene.add(grid);
    this.pickables=[];this.nodeList=[...space.nodes.values()];
    const nodeGeometry=new THREE.SphereGeometry(1,12,10);
    this.nodeMesh=new THREE.InstancedMesh(nodeGeometry,new THREE.MeshStandardMaterial({roughness:.65,metalness:.03}),this.nodeList.length);
    this.nodeMesh.userData.kind='nodes';this.scene.add(this.nodeMesh);this.pickables.push(this.nodeMesh);
    this.progressMesh=new THREE.InstancedMesh(new THREE.TorusGeometry(1,.10,6,24),new THREE.MeshBasicMaterial({color:0x698377,transparent:true,opacity:.8,depthWrite:false}),this.nodeList.length);
    this.evidenceMesh=new THREE.InstancedMesh(new THREE.TorusGeometry(1,.07,6,24),new THREE.MeshBasicMaterial({color:0x5b899b,transparent:true,opacity:.85,depthWrite:false}),this.nodeList.length);
    this.scene.add(this.progressMesh,this.evidenceMesh);
    if(this.network){
      this.sceneMarkers=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0x557969}),this.nodeList.length);
      this.questionMarkers=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1),new THREE.MeshBasicMaterial({color:0xb4773b}),this.nodeList.length);
      this.sceneMarkers.userData.kind='markers';this.questionMarkers.userData.kind='markers';this.scene.add(this.sceneMarkers,this.questionMarkers);this.pickables.push(this.sceneMarkers,this.questionMarkers);
      this.savedScenes=new Set();this.queuedQuestions=new Set();
    }
    this.packMeshes=new Map();this.fields=[];
    for(const p of space.packs.values()) {
      const group=new THREE.Group();group.position.copy(V(p.position));
      const mat=new THREE.MeshStandardMaterial({color:p.color,roughness:.5});
      const core=new THREE.Mesh(new THREE.SphereGeometry(6.5,24,16),mat);core.scale.set(1.3,.82,.74);core.userData.key=p.key;group.add(core);this.pickables.push(core);this.packMeshes.set(p.id,core);
      const field=new THREE.Mesh(new THREE.SphereGeometry(p.radius,24,16),new THREE.MeshBasicMaterial({color:p.color,transparent:true,opacity:.045,side:THREE.BackSide,depthWrite:false}));
      field.scale.set(.96,.87,.76);field.userData.object=p;this.fields.push(field);group.add(field);this.scene.add(group);
    }
    for(const t of space.themes.values()) {
      const field=new THREE.Mesh(regionGeometry(t,space),new THREE.MeshBasicMaterial({color:t.color,transparent:true,opacity:.035,side:THREE.BackSide,depthWrite:false}));
      field.position.copy(V(t.position));field.userData.object=t;this.fields.push(field);this.scene.add(field);
    }
    this.mapRegions=new THREE.Group();this.scene.add(this.mapRegions);
    if(this.network)for(const t of space.themes.values()){
      const {center,radius}=t.region,fill=new THREE.Mesh(new THREE.CircleGeometry(radius,80),new THREE.MeshBasicMaterial({color:t.color,transparent:true,opacity:.075,depthWrite:false,side:THREE.DoubleSide}));
      fill.rotation.x=-Math.PI/2;fill.position.set(center[0],-6,center[2]);this.mapRegions.add(fill);
      const points=Array.from({length:81},(_,i)=>new THREE.Vector3(center[0]+Math.cos(i/80*Math.PI*2)*radius,-5,center[2]+Math.sin(i/80*Math.PI*2)*radius));
      this.mapRegions.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:t.color,transparent:true,opacity:.27,depthWrite:false})));
    }
    this.edgesGroup=new THREE.Group();this.scene.add(this.edgesGroup);
    if(this.network){
      const makeEdges=(edges,soft)=>{
        const a=new Float32Array(edges.length*6);edges.forEach((e,i)=>{a.set(space.nodes.get(e.prerequisiteId).position,i*6);a.set(space.nodes.get(e.topicId).position,i*6+3);});
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));
        const material=soft?new THREE.LineDashedMaterial({color:0x82958b,transparent:true,opacity:.08,dashSize:7,gapSize:6,depthWrite:false}):new THREE.LineBasicMaterial({color:0x71837b,transparent:true,opacity:.18,depthWrite:false});
        const mesh=new THREE.LineSegments(g,material);mesh.userData.edges=edges;if(soft)mesh.computeLineDistances();this.scene.add(mesh);return mesh;
      };
      this.networkEdges=makeEdges(space.atlas.edges.filter(e=>e.strength==='hard'),false);
      this.networkSoftEdges=makeEdges(space.atlas.edges.filter(e=>e.strength!=='hard'),true);
    }
    this.globalRegions=new THREE.Group();this.scene.add(this.globalRegions);
    this.globalAxis=new THREE.Group();this.scene.add(this.globalAxis);
    if(space.globalInfo){
      for(const t of space.themes.values()){
        const nodes=this.nodeList.filter(n=>n.themeId===t.id),bands=[];
        for(let layer=0;layer<=space.globalInfo.maxLayer;layer+=5){
          const group=nodes.filter(n=>n.sourceLayer>=layer&&n.sourceLayer<layer+5);if(!group.length)continue;
          const center=[0,1,2].map(k=>group.reduce((a,n)=>a+n.position[k],0)/group.length),radius=Math.max(16,...group.map(n=>Math.hypot(n.position[0]-center[0],n.position[2]-center[2])+12));
          bands.push({center,radius});
        }
        if(!bands.length)continue;
        bands.unshift({...bands[0],center:[bands[0].center[0],t.globalRegion.minY-12,bands[0].center[2]]});
        bands.push({...bands.at(-1),center:[bands.at(-1).center[0],t.globalRegion.maxY+12,bands.at(-1).center[2]]});
        const vertices=[],indices=[],wire=[];
        for(const [i,b]of bands.entries())for(let j=0;j<24;j++){
          const angle=j/24*Math.PI*2,v=[b.center[0]+Math.cos(angle)*b.radius,b.center[1],b.center[2]+Math.sin(angle)*b.radius];vertices.push(...v);
          if(i<bands.length-1){const a=i*24+j,c=i*24+(j+1)%24;indices.push(a,c,a+24,c,c+24,a+24);}
          if(i>0&&j%6===0)wire.push(...vertices.slice((i-1)*72+j*3,(i-1)*72+j*3+3),...v);
          if(i===0||i===bands.length-1){const next=(j+1)/24*Math.PI*2;wire.push(...v,b.center[0]+Math.cos(next)*b.radius,b.center[1],b.center[2]+Math.sin(next)*b.radius);}
        }
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);
        this.globalRegions.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:t.color,transparent:true,opacity:.035,side:THREE.DoubleSide,depthWrite:false})));
        const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wire,3));this.globalRegions.add(new THREE.LineSegments(wg,new THREE.LineBasicMaterial({color:t.color,transparent:true,opacity:.17,depthWrite:false})));
      }
      const info=space.globalInfo,x=Math.min(...this.nodeList.map(n=>n.position[0]))-65,z=0,lines=[x,info.floor,z,x,info.ceiling+20,z];
      for(let level=0;level<=info.maxLayer;level+=5){const y=info.floor+level*info.step;lines.push(x-8,y,z,x+8,y,z);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));this.globalAxis.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x708979,transparent:true,opacity:.38})));
      this.globalAxisPoints=[{text:'沿关键关系向上',position:[x,info.ceiling+45,z]},{text:'起始层',position:[x,info.floor-32,z]}];
    }
    this.halo=new THREE.Mesh(new THREE.TorusGeometry(1,.075,8,64),new THREE.MeshBasicMaterial({color:0x234c45,transparent:true,opacity:.85,depthTest:false}));this.halo.visible=false;this.halo.renderOrder=4;this.scene.add(this.halo);
    this.labelLayer=document.createElement('div');this.labelLayer.className='space-labels';host.append(this.labelLayer);
    this.labelTethers=document.createElementNS('http://www.w3.org/2000/svg','svg');this.labelTethers.classList.add('label-tethers');this.labelTethers.setAttribute('aria-hidden','true');this.labelLayer.append(this.labelTethers);
    this.relationLayer=document.createElement('div');this.relationLayer.className='relation-captions';this.labelLayer.append(this.relationLayer);
    for(const object of space.objects){
      const el=document.createElement('button');el.type='button';el.className=`space-label ${object.kind}`;el.dataset.key=object.key;el.style.setProperty('--object-color',object.color);
      const title=document.createElement('span'),step=object.kind==='node'&&routeStep(object.id);const lesson=object.kind==='node'&&lessonForTopic(object.id),route=lesson&&routeFor(lesson);title.textContent=this.network&&object.kind==='node'?object.title:lesson?`${route.id}–0${route.ids.indexOf(lesson)+1} ${LESSONS[lesson].title}`:step?`A–0${step.step} ${step.title}`:object.title;el.append(title);el.title=title.textContent;
      if(this.network&&object.kind==='node'){
        const forms=activityForms(object.id),form=forms[0]||'steps';el.insertAdjacentHTML('afterbegin',activityGlyph(form));
        el.dataset.activityForm=form;el.title+=' · '+forms.map(f=>ACTIVITY_FORMS[f].label).join('、');
      }
      if(object.kind==='pack'&&routeForPack(object.id)){title.textContent=routesForPack(object.id).length===1?routeForPack(object.id).title:object.title;el.classList.add('has-route');el.title=title.textContent+' · 有动手路线';}
      if(object.kind==='theme'){const sub=document.createElement('small');sub.textContent=`${object.children.length} 个知识簇`;el.append(sub);}
      el.addEventListener('click',event=>{event.stopPropagation();callbacks.onSelect?.(object.key);});
      el.addEventListener('dblclick',event=>{event.stopPropagation();if(object.kind==='node')callbacks.onOpen?.(object.id);});
      el.hidden=true;this.labelLayer.append(el);this.labels.push({object,el});
    }
    this.axisLayer=document.createElement('div');this.axisLayer.className='network-axis-labels';this.labelLayer.append(this.axisLayer);
    for(const a of this.globalAxisPoints||[]){a.el=document.createElement('span');a.el.textContent=a.text;this.axisLayer.append(a.el);}
    this.bandLayer=document.createElement('div');this.bandLayer.className='network-bands';this.labelLayer.append(this.bandLayer);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.canvas.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY,button:e.button};});
    this.canvas.addEventListener('pointerup',e=>{if(this.down?.button===0&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)<5){const key=this.hit(e);if(key)callbacks.onSelect?.(key);}this.down=null;});
    this.canvas.addEventListener('pointermove',e=>{if(this.down)return;this.hovered=this.hit(e);this.canvas.style.cursor=this.hovered?'pointer':this.mode==='rotate'?'grab':'move';this.dirty=true;});
    this.canvas.addEventListener('pointerleave',()=>{this.hovered=null;this.dirty=true;});
    this.canvas.addEventListener('dblclick',e=>{const key=this.hit(e),o=space.byKey.get(key);if(o?.kind==='node')callbacks.onOpen?.(o.id);});
    this.canvas.addEventListener('keydown',e=>{if(['+','=','-','_'].includes(e.key)){e.preventDefault();this.zoom(e.key==='-'||e.key==='_'?1.3:.77);}if(e.key==='Home'){e.preventDefault();callbacks.onOverview?.();}});
    this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();callbacks.onError?.('三维画面暂时中断。学习记录已保留，请重新打开。');});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
    this.refresh(()=>({progress:'unseen',evidence:'none'}));
    this.renderer.setAnimationLoop(time=>this.frame(time));
  }
  get global(){return this.network&&this.networkVersion===GLOBAL_VERSION;}
  updateProjection(){this.camera.aspect=this.width/this.height;if(this.camera.isOrthographicCamera){const half=this.camera.position.distanceTo(this.controls.target)*Math.tan(Math.PI/9);this.camera.left=-half*this.camera.aspect;this.camera.right=half*this.camera.aspect;this.camera.top=half;this.camera.bottom=-half;}this.camera.updateProjectionMatrix();}
  resize(){const {width,height}=this.host.getBoundingClientRect();this.width=width;this.height=height;this.updateProjection();this.renderer.setSize(width,height,false);this.dirty=true;}
  setMode(mode){this.mode=mode;this.controls.mouseButtons.LEFT=mode==='rotate'?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;this.controls.touches.ONE=mode==='rotate'?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN;this.canvas.style.cursor=mode==='rotate'?'grab':'move';}
  project(position){const p=V(position).project(this.camera);return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2,visible:p.z<1&&p.z>-1&&Math.abs(p.x)<1.4&&Math.abs(p.y)<1.4,distance:this.camera.position.distanceTo(V(position))/(this.global?this.camera.zoom:1)};}
  hit(e){const r=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);
    if(this.network){let best=null,bestD=11*11,bestDepth=Infinity;const x=e.clientX-r.left,y=e.clientY-r.top;
      for(const o of this.nodeList){if(!this.visibleNodes?.has(o.key))continue;const p=this.project(o.position);if(!p.visible)continue;const d=(p.x-x)**2+(p.y-y)**2;if(d<bestD-.1||Math.abs(d-bestD)<.1&&p.distance<bestDepth){best=o;bestD=d;bestDepth=p.distance;}}
      if(best)return best.key;
    }
    const isNodeMesh=o=>o===this.nodeMesh||o===this.sceneMarkers||o===this.questionMarkers;
    const hit=this.raycaster.intersectObjects(this.pickables.filter(o=>o.visible),false).find(h=>!isNodeMesh(h.object)||this.visibleNodes?.has(this.nodeList[h.instanceId]?.key));if(!hit)return null;
    let o=isNodeMesh(hit.object)?this.nodeList[hit.instanceId]:this.space.byKey.get(hit.object.userData.key);
    const d=this.camera.position.distanceTo(V(o.position));if(!this.network&&o.kind==='node'&&d>350)o=this.space.packs.get(o.packId);if(!this.network&&d>1000)o=this.space.themes.get(o.themeId);return o.key;
  }
  snapshot(){return {...(this.network?{networkView:this.networkView,networkVersion:this.networkVersion,...(this.global?{cameraZoom:this.camera.zoom}:{})}:{}),position:this.camera.position.toArray(),target:this.controls.target.toArray(),selected:this.selected,showAllNodes:this.showAllNodes,relationMode:this.relationMode,...(this.learningRouteId?{learningRouteId:this.learningRouteId}:{}),...(this.learningSectionId?{learningSectionId:this.learningSectionId,learningRoutePage:this.learningRoutePage||0}:{})};}
  restore(view,animated=false){if(this.network){this.networkVersion=view.networkVersion||(view.networkView?48:47);this.networkView=view.networkView||'legacy';}const o=this.space.byKey.get(view.selected),r=ROUTES.find(r=>r.id===view.learningRouteId);this.learningRouteId=r&&(o?.kind==='pack'&&r.packIds.includes(o.id)||o?.kind==='node'&&r.ids.includes(lessonForTopic(o.id)))?r.id:null;this.learningSectionId=this.learningRouteId?r.section||null:o?.kind==='pack'&&ROUTES.some(x=>x.section===view.learningSectionId&&x.packIds.includes(o.id))?view.learningSectionId:null;this.learningRoutePage=this.learningRouteId?Math.floor(ROUTES.filter(x=>x.section===this.learningSectionId).findIndex(x=>x.id===this.learningRouteId)/3):Math.max(0,Math.min(Number.isInteger(view.learningRoutePage)?view.learningRoutePage:0,Math.floor((ROUTES.filter(x=>x.section===this.learningSectionId).length-1)/3)));if(typeof view.showAllNodes==='boolean')this.showAllNodes=view.showAllNodes;this.select(view.selected);if(this.global)this.camera.zoom=view.cameraZoom||1;this.setRelations(view.relationMode||'off');this.fly(view.position,view.target,animated?850:0);}
  overview(animated=true){if(this.network){this.networkVersion=GLOBAL_VERSION;this.networkView='oblique';this.select(null);this.fitNetworkView(animated);return;}const factor=Math.max(1,1/this.camera.aspect);this.select(null);this.fly(this.network?[345*factor,310*factor,1150*factor]:[260*factor,160*factor,1580*factor],this.network?[0,0,0]:[0,-15,-70],animated?1100:0);}
  focus(key,{animate=true}={}){const o=this.space.byKey.get(key);if(!o)return;const overview=this.global&&!this.selected&&this.wholeMapVisible();this.select(key);
    if(this.global){if(o.kind==='node'){const p=this.project(o.position),insets=this.globalInsets();if(overview)this.fitGlobalView(animate);else if(!p.visible||p.x<insets.left||p.x>this.width-insets.right||p.y<insets.top||p.y>this.height-insets.bottom)this.fitGlobalView(animate,[o,...this.nodeList.filter(n=>this.related.has(n.key))]);}else this.fitGlobalView(animate,this.nodeList.filter(n=>o.kind==='theme'?n.themeId===o.id:n.packId===o.id));return;}
    if(this.network&&o.kind==='node'){if(this.networkView==='relations')this.fitNetworkView(animate);return;}
    const ratio=Math.max(1,.85/this.camera.aspect),d=(o.kind==='theme'?570:o.kind==='pack'?Math.max(225,o.radius*4.7):175)*ratio;
    const direction=this.camera.position.clone().sub(this.controls.target).normalize();this.fly(V(o.position).addScaledVector(direction,d).toArray(),o.position,animate?1000:0);
  }
  select(key){const changed=key!==this.selected;if(changed)this.relationMode=this.network&&key?.startsWith('node:')?'source':'off';this.selected=this.space.byKey.has(key)?key:null;if(this.network)this.applyNetworkLayout();this.rebuildRelations();this.dirty=true;}
  setRelations(mode){this.relationMode=['source','route'].includes(mode)?mode:'off';this.rebuildRelations();this.dirty=true;}
  setAllNodes(show){this.showAllNodes=!!show;this.rebuildRelations();this.dirty=true;}
  setLearningSection(id){this.learningSectionId=id;this.learningRoutePage=0;this.learningRouteId=null;this.rebuildRelations();this.dirty=true;}
  setLearningRoute(id){this.learningRouteId=id;if(id){this.learningSectionId=ROUTES.find(r=>r.id===id)?.section||null;this.learningRoutePage=Math.floor(ROUTES.filter(r=>r.section===this.learningSectionId).findIndex(r=>r.id===id)/3);}this.rebuildRelations();this.dirty=true;}
  selectedRoute(){const o=this.space.byKey.get(this.selected);return o?.kind==='pack'&&this.learningRouteId?ROUTES.find(r=>r.id===this.learningRouteId):o?.kind==='pack'&&routesForPack(o.id).length>1?null:undefined;}
  setPersonalProgress(keys){const next=[...keys].sort();if(JSON.stringify(next)!==JSON.stringify(this.litConnections)){this.litConnections=next;this.rebuildRelations();this.dirty=true;}}
  setPersonalMarkers(scenes,questions){if(!this.network)return;this.savedScenes=new Set(scenes);this.queuedQuestions=new Set(questions);this.dirty=true;}
  nodeVisible(o){if(this.global)return this.showAllNodes||o.key===this.selected||this.related?.has(o.key)||this.completedNodes?.has(o.id);if(this.networkView==='relations')return this.space.relationIds.has(o.id);const selected=this.space.byKey.get(this.selected);return this.showAllNodes||this.completedNodes?.has(o.id)||o.key===this.selected||this.related?.has(o.key)||(selected?.kind==='pack'&&(this.selectedRoute()===undefined?routeForPack(selected.id):this.selectedRoute())?.ids.includes(lessonForTopic(o.id)));}
  fly(position,target,duration=900){if(matchMedia('(prefers-reduced-motion: reduce)').matches)duration=0;
    this.tween=null;
    // A saved pose or named view must not inherit the previous drag's momentum.
    const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=damping;
    if(!duration){this.camera.position.copy(V(position));this.controls.target.copy(V(target));this.controls.update();this.updateProjection();this.camera.updateMatrixWorld();this.dirty=true;this.callbacks.onSettled?.();return;}
    this.tween={start:performance.now(),duration,from:this.camera.position.clone(),to:V(position),fromTarget:this.controls.target.clone(),toTarget:V(target)};
  }
  zoom(factor){if(this.global){this.camera.zoom=clamp(this.camera.zoom/factor,.15,35);this.updateProjection();this.dirty=true;this.callbacks.onSettled?.();return;}const offset=this.camera.position.clone().sub(this.controls.target);const length=clamp(offset.length()*factor,30,8000);this.fly(this.controls.target.clone().add(offset.normalize().multiplyScalar(length)).toArray(),this.controls.target.toArray(),250);}
  front(){if(this.network&&this.networkView!=='legacy'){this.fitNetworkView();return;}const distance=this.camera.position.distanceTo(this.controls.target);this.fly(this.controls.target.clone().add(new THREE.Vector3(0,0,distance)).toArray(),this.controls.target.toArray(),700);}
  viewFrom(name){if(this.network){
    this.networkVersion=GLOBAL_VERSION;this.networkView=name==='side'?'relations':name==='top'?'map':'oblique';
    this.applyNetworkLayout();this.rebuildRelations();this.fitNetworkView(true);this.dirty=true;return true;
  }const distance=this.camera.position.distanceTo(this.controls.target),v=name==='top'?new THREE.Vector3(.01,1,.01):name==='side'?new THREE.Vector3(0,0,1):new THREE.Vector3(.3,.27,1);this.fly(this.controls.target.clone().add(v.normalize().multiplyScalar(distance)).toArray(),this.controls.target.toArray(),700);}
  applyNetworkLayout(){
    if(this.space.globalInfo&&!!this.camera.isOrthographicCamera!==this.global){const old=this.camera;this.camera=this.global?new THREE.OrthographicCamera(-800,800,600,-600,1,20000):new THREE.PerspectiveCamera(40,this.width/this.height,1,20000);this.camera.fov=40;this.camera.aspect=this.width/this.height;this.camera.position.copy(old.position);this.camera.quaternion.copy(old.quaternion);this.controls.object=this.camera;this.updateProjection();}
    this.networkView=this.space.globalPositions?restoreNetworkCoordinates(this.space,this.networkVersion,this.networkView,this.selected):applyNetworkView(this.space,this.networkView,this.selected);
    for(const [id,mesh]of this.packMeshes)mesh.parent.position.copy(V(this.space.packs.get(id).position));
    for(const mesh of [this.networkEdges,this.networkSoftEdges])if(mesh){const array=mesh.geometry.attributes.position.array;mesh.userData.edges.forEach((e,i)=>{array.set(this.space.nodes.get(e.prerequisiteId).position,i*6);array.set(this.space.nodes.get(e.topicId).position,i*6+3);});mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeBoundingSphere();if(mesh===this.networkSoftEdges)mesh.computeLineDistances();}
    this.mapRegions.visible=!this.global&&(this.networkView==='map'||this.networkView==='oblique');
    this.globalRegions.visible=this.global;this.globalAxis.visible=this.global&&this.networkView!=='map';
    this.bandLayer?.replaceChildren();
    if(!this.global&&this.networkView==='relations'&&this.bandLayer){
      const r=this.space.relationLayout,ys=[...r.positions.values()].map(p=>p[1]);
      this.bandLabels=[{text:`还能用到 · ${r.after.length}`,y:Math.max(200,...ys)+75},{text:`这里会用到 · ${r.before.length}`,y:Math.min(-200,...ys)-160}];
      for(const band of this.bandLabels){const el=document.createElement('span');el.textContent=band.text;this.bandLayer.append(el);band.el=el;}
    }else this.bandLabels=[];
  }
  fitNetworkView(animated=true){
    if(this.global){this.fitGlobalView(animated);return;}
    const side=this.networkView==='relations',positions=side?[...this.space.relationLayout.positions.values(),...this.bandLabels.map(b=>[0,b.y,0])]:this.space.objects.map(o=>o.position);
    const xs=positions.map(p=>p[0]),ys=positions.map(p=>p[side?1:2]);
    const padding=side?40:95,minX=Math.min(...xs)-padding,maxX=Math.max(...xs)+padding,minY=Math.min(...ys)-padding,maxY=Math.max(...ys)+padding;
    const left=side?350:45,right=110,top=side?(this.height<780?180:205):210,bottom=side?130:145,w=Math.max(300,this.width-left-right),h=Math.max(260,this.height-top-bottom);
    const tan=Math.tan(this.camera.fov*Math.PI/360),distance=Math.max((maxY-minY)/(2*tan*h/this.height),(maxX-minX)/(2*tan*this.camera.aspect*w/this.width));
    const dx=(left-right)/this.width*distance*tan*this.camera.aspect,dy=(bottom-top)/this.height*distance*tan;
    const center=side?[(minX+maxX)/2-dx,(minY+maxY)/2-dy,0]:[(minX+maxX)/2-dx,0,(minY+maxY)/2+dy];
    const dir=side?[0,0,1]:this.networkView==='oblique'?[.25,.88,.48]:[0,1,.001];
    this.fly(V(center).addScaledVector(V(dir).normalize(),distance).toArray(),center,animated?700:0);
  }
  globalInsets(){
    const guide=document.querySelector('#network-guide')?.getBoundingClientRect(),footer=document.querySelector('.bottom-bar')?.getBoundingClientRect();
    return {left:this.selected?340:42,right:120,top:Math.max(138,(guide?.bottom||116)+22),bottom:Math.max(88,this.height-(footer?.top||this.height-70)+18)};
  }
  globalScale(){return this.height*this.camera.zoom/(2*this.camera.position.distanceTo(this.controls.target)*Math.tan(Math.PI/9));}
  wholeMapVisible(){const {top,bottom}=this.globalInsets();return this.nodeList.every(n=>{const p=this.project(n.position);return p.visible&&p.x>24&&p.x<this.width-110&&p.y>top-8&&p.y<this.height-bottom+8;});}
  fitGlobalView(animated=true,objects=null){
    const points=(objects||this.nodeList).map(o=>V(o.position));
    const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
    const dir=V(this.networkView==='map'?[0,1,.0001]:this.networkView==='relations'?[0,0,1]:[.65,.5,1]).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize(),up=new THREE.Vector3().crossVectors(dir,right).normalize();
    const xs=points.map(p=>p.dot(right)),ys=points.map(p=>p.dot(up));
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const {left,right:rightMargin,top,bottom}=this.globalInsets(),w=Math.max(260,this.width-left-rightMargin),h=Math.max(200,this.height-top-bottom);
    // Fit the projected point bounds, not the large annotation boxes. All views
    // use the same source coordinates; only the orthographic camera changes.
    const pixels=Math.min((w-72)/Math.max(160,maxX-minX),(h-56)/Math.max(160,maxY-minY));
    const target=right.clone().multiplyScalar((minX+maxX)/2-(left-rightMargin)/(2*pixels)).addScaledVector(up,(minY+maxY)/2+(top-bottom)/(2*pixels)).addScaledVector(dir,center.dot(dir));
    const distance=2200;this.camera.zoom=pixels*2*distance*Math.tan(Math.PI/9)/this.height;
    this.fly(target.clone().addScaledVector(dir,distance).toArray(),target.toArray(),animated?850:0);
  }

  basis(){const right=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);return {right,up,direction:this.camera.position.clone().sub(this.controls.target).normalize()};}
  refresh(stateFor,filter=this.filter){this.stateFor=stateFor;this.filter=filter;this.states=this.nodeList.map(o=>stateFor(o.id));this.completedNodes=new Set(this.nodeList.filter((o,i)=>this.states[i].progress==='completed').map(o=>o.id));
    const available=new Set(topicIds);
    for(const {object,el}of this.labels){
      if(object.kind==='node'){const done=stateFor(object.id).progress==='completed';el.dataset.progress=done?'completed':'incomplete';el.classList.remove('has-evidence');el.setAttribute('aria-label',`${routeStep(object.id)?.title||object.title}${available.has(object.id)?'，'+(done?'完成':'未完成'):''}`);}
      else {const ids=(object.kind==='pack'?object.nodeIds:this.nodeList.filter(n=>n.themeId===object.id).map(n=>n.id)).filter(id=>available.has(id)),completed=ids.filter(id=>stateFor(id).progress==='completed').length;
        el.classList.remove('has-trail');el.classList.toggle('has-completion',completed>0);el.dataset.completed=String(completed);
        if(object.kind==='theme')el.querySelector('small').innerHTML=ids.length?`<span>完成 ${completed} / ${ids.length}</span><progress max="${ids.length}" value="${completed}" aria-label="完成 ${completed} / ${ids.length}"></progress>`:`${object.children.length} 个分组`;
        el.setAttribute('aria-label',`${object.title}${ids.length?'，完成 '+completed+' / '+ids.length:''}`);
      }
    }
    this.dirty=true;
  }
  paintObjects(){
    const selected=this.space.byKey.get(this.selected),transform=new THREE.Object3D(),color=new THREE.Color(),paper=new THREE.Color(0xf5f4ef);
    const emphasis=o=>!selected?1:selected.kind==='theme'?(o.themeId===selected.id||o.id===selected.id?1:.35):selected.kind==='pack'?(o.packId===selected.id||o.id===selected.id?1:.28):(this.related?.has(o.key)||o.key===selected.key?1:o.packId===selected.packId ? .42 : .18);
    this.visibleNodes=new Set();
    for(let i=0;i<this.nodeList.length;i++){
      const o=this.nodeList[i],s=this.states?.[i]||{progress:'unseen',evidence:'none'},d=this.camera.position.distanceTo(V(o.position))/(this.global?this.camera.zoom:1),focus=emphasis(o);
      const visible=this.nodeVisible(o);if(visible)this.visibleNodes.add(o.key);
      const level=visible?(this.global?1:this.network?clamp((1800-d)/1050,.65,1):clamp((900-d)/580,.42,1)):0,match=this.filter==='all'||this.filter==='visited'&&s.progress!=='unseen'||this.filter==='completed'&&s.progress==='completed';
      color.set(o.color).lerp(paper,1-(this.network ? .87 : s.progress==='completed' ? .92 : .68)*focus*(match?1:.16));
      const size=this.global?5:this.network?4:3.2;
      transform.position.copy(V(o.position));transform.quaternion.identity();transform.scale.setScalar((this.global?(o.key===this.selected?size+3:size):(this.related?.has(o.key)&&selected?.kind==='node'?size+1:size))*level);transform.updateMatrix();this.nodeMesh.setMatrixAt(i,transform.matrix);this.nodeMesh.setColorAt(i,color);
      transform.quaternion.copy(this.camera.quaternion);transform.scale.setScalar(s.progress==='completed'&&match?(size+1.6)*level:0);transform.updateMatrix();this.progressMesh.setMatrixAt(i,transform.matrix);
      transform.scale.setScalar(0);transform.updateMatrix();this.evidenceMesh.setMatrixAt(i,transform.matrix);
      if(this.network){
        transform.position.copy(V(o.position)).add(new THREE.Vector3(8,8,0).applyQuaternion(this.camera.quaternion));transform.quaternion.copy(this.camera.quaternion);transform.scale.setScalar(visible&&this.savedScenes.has(o.id)?4*level*focus:0);transform.updateMatrix();this.sceneMarkers.setMatrixAt(i,transform.matrix);
        transform.position.copy(V(o.position)).add(new THREE.Vector3(-8,8,0).applyQuaternion(this.camera.quaternion));transform.scale.setScalar(visible&&this.queuedQuestions.has(o.id)?4.5*level*focus:0);transform.updateMatrix();this.questionMarkers.setMatrixAt(i,transform.matrix);
      }
    }
    for(const [id,core]of this.packMeshes){const o=this.space.packs.get(id);core.visible=this.network?(this.global||this.networkView!=='relations')&&!!selected&&(selected.kind==='theme'?o.themeId===selected.id:o.id===selected.packId||o.id===selected.id):this.showAllNodes||!!selected&&(selected.kind==='theme'?o.themeId===selected.id:o.id===selected.packId||o.id===selected.id);core.material.color.set(o.color).lerp(paper,1-emphasis(o)*.9);}
    for(const field of this.fields){const o=field.userData.object;field.visible=!this.network&&(o.kind==='theme'||this.showAllNodes);field.material.opacity=(o.kind==='theme'?.035:.025)*emphasis(o);}
    this.nodeMesh.instanceMatrix.needsUpdate=true;this.nodeMesh.instanceColor.needsUpdate=true;this.progressMesh.instanceMatrix.needsUpdate=true;this.evidenceMesh.instanceMatrix.needsUpdate=true;
    if(this.network){this.sceneMarkers.instanceMatrix.needsUpdate=true;this.questionMarkers.instanceMatrix.needsUpdate=true;}
    if(this.global)for(const shape of this.globalRegions.children)shape.material.opacity=this.selected?(shape.isMesh?.004:.025):(shape.isMesh?.012:.075);
  }
  rebuildRelations(){for(const child of [...this.edgesGroup.children]){child.geometry?.dispose();child.material?.dispose();this.edgesGroup.remove(child);}
    if(this.networkEdges){this.networkEdges.visible=this.showAllNodes&&(this.global||this.networkView!=='relations');this.networkEdges.material.opacity=this.global?(this.selected?.035:.16):(this.selected?.06:.19);this.networkSoftEdges.visible=this.networkEdges.visible;this.networkSoftEdges.material.opacity=this.global?(this.selected?.015:.055):(this.selected?.025:.065);}
    const pairs=new Map();for(const link of this.space.themeLinks){const key=[link.from,link.to].sort().join('|');if(!pairs.has(key))pairs.set(key,{...link,edges:[]});pairs.get(key).edges.push(...link.edges);}
    let links=this.relationMode==='off'?personalRelations(this.space.atlas,this.space.byKey.get(this.selected),this.litConnections||[],this.selectedRoute()):this.relationMode==='route'?routeLinks(this.space.atlas).map(e=>({from:'node:'+e.prerequisiteId,to:'node:'+e.topicId,edges:[e]})):this.selected?relationsFor(this.space,this.selected):[...pairs.values()];
    if(this.network){const lit=new Set(this.litConnections||[]);links=links.map(l=>({...l,lit:l.lit||l.edges.some(e=>lit.has(e.prerequisiteId+'>'+e.topicId))}));}
    if(!this.global&&this.networkView==='relations')links=links.filter(l=>l.from===this.selected||l.to===this.selected);this.relations=links;this.related=new Set(links.flatMap(l=>[l.from,l.to]));this.captionCandidates=[];if(this.relationLayer)this.relationLayer.replaceChildren();
    if(this.network&&!this.selected&&this.relationMode==='off'&&links.length){
      const coordinates=new Float32Array(links.length*6);links.forEach((l,i)=>{coordinates.set(this.space.byKey.get(l.from).position,i*6);coordinates.set(this.space.byKey.get(l.to).position,i*6+3);});
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(coordinates,3));
      this.edgesGroup.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xb48b36,transparent:true,opacity:.8,depthWrite:false})));return;
    }
    for(const l of links){const a=this.space.byKey.get(l.from),b=this.space.byKey.get(l.to),v=V(a.position),w=V(b.position);const c=v.clone().lerp(w,.5);c.z+=Math.min(70,v.distanceTo(w)*.18);
      const curve=new THREE.QuadraticBezierCurve3(v,c,w),before=l.to===this.selected,color=l.lit?0xb48b36:this.relationMode==='off'?0x9ca99c:this.selected?(before?0x985b2f:0x286f7c):0xb3bcb3;
      const line=l.lit||this.selected&&this.relationMode!=='off'?new THREE.Mesh(new THREE.TubeGeometry(curve,36,l.lit?.8:this.global?1.35:this.networkView==='relations'?.7:a.kind==='node'?.20:.38,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:this.global?.92:.75,depthWrite:false})):
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(36)),new THREE.LineBasicMaterial({color,transparent:true,opacity:this.relationMode==='off'?.3:.14,depthWrite:false}));if(this.network&&l.edges[0]?.strength==='soft'){
        line.geometry.dispose();line.material.dispose();const dashed=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)),new THREE.LineDashedMaterial({color,transparent:true,opacity:this.global?.88:.7,dashSize:6,gapSize:5}));dashed.computeLineDistances();this.edgesGroup.add(dashed);
      }else this.edgesGroup.add(line);
      if(this.selected&&this.relationMode!=='off'){const arrow=new THREE.Mesh(new THREE.ConeGeometry(this.global?5.5:this.networkView==='relations'?4.5:a.kind==='node'?1.9:3,this.global?15:this.networkView==='relations'?12:a.kind==='node'?5.8:9,10),new THREE.MeshBasicMaterial({color}));arrow.position.copy(curve.getPoint(.78));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(.78).normalize());this.edgesGroup.add(arrow);
        this.captionCandidates.push({before,position:curve.getPoint(before?.58:.42).toArray(),length:v.distanceTo(w)});
      }
    }
    if(this.selected&&this.relationLayer&&!this.global&&this.networkView!=='relations')for(const before of [true,false]){const candidate=this.captionCandidates.filter(c=>c.before===before).sort((a,b)=>a.length-b.length)[0];if(!candidate)continue;const el=document.createElement('span');el.className=`relation-caption ${before?'before':'after'}`;el.textContent=before?'这里会用到':'可以继续到';el.hidden=true;this.relationLayer.append(el);candidate.el=el;}
  }
  updateLabels(){
    const selected=this.space.byKey.get(this.selected),candidates=[],scale=this.global?this.globalScale():0;
    for(const entry of this.labels){const {object:o,el}=entry,p=this.project(o.position),isSelected=o.key===this.selected,related=this.related?.has(o.key);let show=false,priority=0;
      if(o.kind==='theme'){show=p.distance>410;priority=50;}
      else if(o.kind==='pack'){show=p.distance<1200&&p.distance>115&&((!this.network&&this.showAllNodes)||selected?.kind==='theme'&&o.themeId===selected.id||o.key===this.selected);priority=o.id==='same-amount'?35:25;}
      else {const parent=this.space.packs.get(o.packId),near=this.camera.position.distanceTo(V(parent.position));show=this.nodeVisible(o)&&(this.showAllNodes?near<320:true);priority=10;if(related&&selected?.kind==='node'){show=true;priority=70;}}
      if(o.key===this.hovered){show=true;priority=95;}if(isSelected){show=true;priority=100;}
      if(this.network&&o.kind==='theme'){show=this.global||this.networkView!=='relations'&&this.networkView!=='legacy';priority=90;}
      if(this.network&&o.kind==='pack'){show=(this.global||this.networkView!=='relations')&&(selected?.kind==='theme'&&o.themeId===selected.id||selected?.kind==='pack'&&o.id===selected.id||!selected);priority=30;}
      if(!this.global&&this.networkView==='relations'&&o.kind!=='node')show=false;
      if(!this.global&&this.networkView==='relations'&&o.kind==='node'){show=this.nodeVisible(o);priority=isSelected?100:70;}
      if(this.global){
        if(o.kind==='theme'){show=selected?.kind!=='node'&&scale<2.2;priority=60;}
        else if(o.kind==='pack')show=selected?.kind!=='node'&&(scale>1.15||selected?.kind==='theme'&&o.themeId===selected.id||isSelected);
        else show=this.nodeVisible(o)&&(scale>2.5||related||isSelected||o.key===this.hovered);
        if(o.key===this.hovered||isSelected)show=true;
      }else if(this.network&&this.networkView!=='relations'&&o.kind==='node'&&!related&&!isSelected&&o.key!==this.hovered)show=false;
      if(isSelected&&o.kind==='theme')show=false;
      show=show&&p.visible&&p.x>16&&p.x<this.width-16&&p.y>94&&p.y<this.height-88;
      el.hidden=true;el.classList.remove('selected','related');el.classList.toggle('hovered',o.key===this.hovered);el.setAttribute('aria-pressed','false');if(show)candidates.push({...entry,p,priority,isSelected,related});
    }
    candidates.sort((a,b)=>b.priority-a.priority||a.p.distance-b.p.distance);const rects=[...(this.exclusions||[])],tethers=[];let nodes=0;
    for(const c of candidates){const {object:o,el,p}=c;if(o.kind==='node'&&nodes>=(this.global||this.networkView==='relations'?587:22)&&!c.isSelected&&o.key!==this.hovered)continue;
      const title=el.querySelector('span')?.textContent||o.title;
      const side=!this.global&&this.networkView==='relations'&&o.kind==='node',highlight=c.isSelected||o.key===this.hovered;
      const width=this.global?(o.kind==='theme'?title.length*14+38:o.kind==='pack'?Math.min(210,Math.max(110,title.length*12+20)):Math.min(highlight?240:200,Math.max(100,title.length*12+(highlight?63:34)))):side?Math.max(90,Math.min(185,this.project([240,0,0]).x-this.project([0,0,0]).x-12)):o.kind==='theme'?(this.width<600?146:194):Math.min(275,Math.max(112,title.length*(this.width<600?12:13)+44));
      el.classList.toggle('compact-activity',side&&width<135);el.style.width=`${width}px`;
      const height=this.global?(o.kind==='node'?Math.max(30,12+Math.ceil(title.length/Math.max(1,Math.floor((width-(highlight?63:34))/12)))*17):30):o.kind==='theme'?68:side?(width<135?38+Math.ceil(title.length/Math.max(1,Math.floor((width-20)/12)))*17:Math.max(58,18+Math.ceil(title.length/Math.max(1,Math.floor((width-63)/12)))*17)):38;
      const rect=placeLabel({x:p.x,y:p.y,w:width,h:height,kind:this.global&&o.kind==='theme'?'global-theme':o.kind,viewport:{w:this.width,h:this.height,...(this.global?{top:this.globalInsets().top-14,bottom:78}:{})},occupied:rects});if(!rect)continue;
      const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2;if(Math.hypot(cx-p.x,cy-p.y)>45)tethers.push(`<path d="M ${p.x} ${p.y} L ${cx} ${cy}"/>`);
      rects.push(rect);if(o.kind==='node')nodes++;
      el.hidden=false;el.style.width=`${width}px`;el.style.transform=`translate(${rect.x}px,${rect.y}px)`;el.style.zIndex=String(c.priority);el.classList.toggle('selected',c.isSelected);el.classList.toggle('related',!!c.related&&!!this.selected);el.setAttribute('aria-pressed',String(c.isSelected));
    }
    for(const c of this.captionCandidates||[]){if(!c.el)continue;c.el.hidden=true;const p=this.project(c.position);if(!p.visible)continue;const r=placeLabel({x:p.x,y:p.y,w:102,h:28,viewport:{w:this.width,h:this.height},occupied:rects});if(!r)continue;rects.push(r);c.el.style.transform=`translate(${r.x}px,${r.y}px)`;c.el.hidden=false;}
    for(const b of this.bandLabels||[]){const p=this.project([0,b.y,0]);b.el.hidden=!p.visible;b.el.style.transform=`translate(${p.x}px,${p.y}px)`;}
    for(const a of this.globalAxisPoints||[]){const p=this.project(a.position);a.el.hidden=!this.global||this.networkView==='map'||!p.visible;a.el.style.transform=`translate(${p.x}px,${p.y}px)`;}
    this.labelTethers.innerHTML=tethers.join('');
  }
  frame(time){if(document.hidden)return;let moving=false;
    if(this.tween){const t=this.tween,x=clamp((time-t.start)/t.duration,0,1),e=x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
      this.camera.position.lerpVectors(t.from,t.to,e);this.controls.target.lerpVectors(t.fromTarget,t.toTarget,e);this.dirty=true;moving=true;
      if(x===1){this.tween=null;this.callbacks.onSettled?.();}}
    const changed=this.controls.update();if(!this.dirty&&!changed&&!moving)return;
    const o=this.space.byKey.get(this.selected);this.halo.visible=!!o;if(o){this.halo.position.copy(V(o.position));this.halo.quaternion.copy(this.camera.quaternion);this.halo.scale.setScalar(o.kind==='theme'?18:o.kind==='pack'?10:this.global?11:6.5);}
    this.updateProjection();this.camera.updateMatrixWorld();this.paintObjects();this.renderer.render(this.scene,this.camera);this.exclusions=this.callbacks.onMove?.()||[];this.updateLabels();this.dirty=false;
  }
}
