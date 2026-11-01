import * as THREE from './vendor/three/three.module.min.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';
import {relationsFor} from './spatial-model.js';
import {placeLabel} from './spatial-labels.js';
import {applyNetworkView} from './spatial-network.js';
import {GLOBAL_VERSION,restoreNetworkCoordinates} from './spatial-global.js';
import {overviewShellCandidates} from './spatial-relationship.js';
import {buildOverviewStructure,OVERVIEW_ROLES} from './spatial-overview-structure.js';
import {buildFocusFilter,FOCUS_DIRECTIONS,FOCUS_DEPTHS} from './spatial-focus-filter.js';
import {activityForms,activityGlyph,ACTIVITY_FORMS} from './spatial-activities.js';
import {traceCritical} from './spatial-trace.js';
import {ACTIVITIES,activityIds} from './exploration-content.js';
import {routeStep,routeLinks} from './journey-model.js';

import {LESSONS,ROUTES,lessonForTopic,routeFor,routeForPack,routesForPack,topicIds} from './learning/catalog.js';
import {personalRelations} from './learning/bridges.js';
const V=a=>new THREE.Vector3(...a);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// At the exact top view an orbit cannot cross its polar limit. Let a drag
// starting there tilt away from the pole in either vertical direction.
class SpatialOrbitControls extends OrbitControls {
  _handleMouseDownRotate(event){super._handleMouseDownRotate(event);this.topDragPending=this.allowTopDrag&&this.getPolarAngle()<.002;this.flipTopDrag=false;}
  _handleMouseMoveRotate(event){
    const dy=event.clientY-this._rotateStart.y;
    if(this.topDragPending&&Math.abs(dy)>.1){this.flipTopDrag=dy>0;this.topDragPending=false;}
    if(!this.flipTopDrag){super._handleMouseMoveRotate(event);return;}
    super._handleMouseMoveRotate({clientX:event.clientX,clientY:this._rotateStart.y-dy});
    this._rotateStart.set(event.clientX,event.clientY);
  }
}
function regionGeometry(theme,space){
  const geometry=new THREE.SphereGeometry(1,32,20),position=geometry.attributes.position;
  const centers=theme.children.map(key=>{const p=space.byKey.get(key);return {v:V(p.position).sub(V(theme.position)),r:p.radius*.65};});
  for(let i=0;i<position.count;i++){const v=new THREE.Vector3().fromBufferAttribute(position,i).normalize();const radius=Math.max(90,...centers.map(p=>v.dot(p.v)+p.r));v.multiplyScalar(radius);position.setXYZ(i,v.x,v.y,v.z);}
  geometry.computeVertexNormals();return geometry;
}
export class SpatialScene {
  constructor(host,space,callbacks={}) {
    this.host=host;this.space=space;this.network=space.layout==='network';this.networkVersion=space.networkVersion||48;this.defaultNetworkVersion=space.defaultNetworkVersion||GLOBAL_VERSION;this.networkView=this.network?(space.networkView||'map'):null;this.callbacks=callbacks;this.selected=null;this.hovered=null;this.previewKey=null;this.traceMode='direct';this.traceResult=null;this.edgeDisplay='outline';this.filter='all';this.dirty=true;this.labels=[];this.relations=[];this.relationMode='off';this.showAllNodes=this.network;this.explorationTrail=[];
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setClearColor(0xf5f4ef,1);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    host.prepend(this.renderer.domElement);this.canvas=this.renderer.domElement;
    this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','三维数学空间。方向键平移，加减键缩放；也可以使用查找定位知识。');
    this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2(0xf5f4ef,.00016);
    this.camera=space.globalInfo?new THREE.OrthographicCamera(-800,800,600,-600,1,20000):new THREE.PerspectiveCamera(40,1,1,20000);this.camera.fov=40;this.camera.aspect=1;
    this.camera.position.set(370,260,1600);
    this.controls=new SpatialOrbitControls(this.camera,this.canvas);this.controls.allowTopDrag=this.network;
    this.controls.enableDamping=!matchMedia('(prefers-reduced-motion: reduce)').matches;this.controls.dampingFactor=.13;this.controls.minDistance=28;this.controls.maxDistance=8000;
    this.controls.screenSpacePanning=true;this.controls.zoomToCursor=true;this.controls.minZoom=.15;this.controls.maxZoom=35;this.controls.rotateSpeed=.65;this.controls.panSpeed=.85;
    this.controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
    this.controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE};
    this.controls.minPolarAngle=this.network?.0001:.04;this.controls.maxPolarAngle=Math.PI-.04;this.controls.listenToKeyEvents(this.canvas);
    this.controls.addEventListener('change',()=>{this.dirty=true;callbacks.onCameraChange?.();});
    this.controls.addEventListener('start',()=>{this.tween=null;callbacks.onStart?.();});
    this.controls.addEventListener('end',()=>callbacks.onSettled?.());
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x8e9c91,2));
    const sun=new THREE.DirectionalLight(0xfff7e9,2.8);sun.position.set(-350,600,650);this.scene.add(sun);
    const fill=new THREE.DirectionalLight(0xd8e8ef,.75);fill.position.set(400,-100,-350);this.scene.add(fill);
    const grid=new THREE.GridHelper(6000,60,0xc4cec8,0xd2d8d2);grid.position.y=-400;grid.material.transparent=true;grid.material.opacity=.045;this.scene.add(grid);
    this.pickables=[];this.nodeList=[...space.nodes.values()];this.viewTransition=null;
    this.overviewStructure=this.relationshipMap?buildOverviewStructure(space):{links:[],landmarks:[],nodeRoles:new Map(),stats:{selected:0}};
    this.structureMode='origin';this.focusDirection='both';this.focusDepth='1';this.focusView=null;
    // Each node is a fixed point in 3D space, not a lit 3D ball.
    // Face a flat color disc toward the camera; leave surrounding state rings separate.
    const nodeGeometry=new THREE.CircleGeometry(1,24);
    this.nodeMesh=new THREE.InstancedMesh(nodeGeometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),this.nodeList.length);
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
        const visible=edges.filter(e=>this.edgeCanLocate(e)&&this.edgeIsDisplayed(e)),a=new Float32Array(visible.length*6);visible.forEach((e,i)=>{a.set(space.nodes.get(e.prerequisiteId).position,i*6);a.set(space.nodes.get(e.topicId).position,i*6+3);});
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));
        const material=soft?new THREE.LineDashedMaterial({color:0x82958b,transparent:true,opacity:.08,dashSize:7,gapSize:6,depthWrite:false}):new THREE.LineBasicMaterial({color:0x71837b,transparent:true,opacity:.18,depthWrite:false});
        const mesh=new THREE.LineSegments(g,material);mesh.userData.allEdges=edges;mesh.userData.edges=visible;if(soft)mesh.computeLineDistances();this.scene.add(mesh);return mesh;
      };
      this.networkEdges=makeEdges(space.atlas.edges.filter(e=>e.strength==='hard'),false);
      this.networkSoftEdges=makeEdges(space.atlas.edges.filter(e=>e.strength!=='hard'),true);
    }
    this.globalRegions=new THREE.Group();this.scene.add(this.globalRegions);
    this.overviewShellsEnabled=false;
    this.overviewShells=[];
    this.overviewShellGroup=new THREE.Group();
    this.scene.add(this.overviewShellGroup);
    if(this.relationshipMap){
      for(const shell of overviewShellCandidates(space)){
        const theme=space.themes.get(shell.themeId),group=new THREE.Group();
        group.position.copy(V(shell.center));
        const fill=new THREE.Mesh(new THREE.SphereGeometry(shell.radius,20,12),
          new THREE.MeshBasicMaterial({color:theme.color,transparent:true,opacity:.028,side:THREE.BackSide,depthWrite:false}));
        group.add(fill);
        for(const plane of ['xy','xz','yz']){
          const points=Array.from({length:65},(_,i)=>{
            const angle=i*Math.PI*2/64,a=Math.cos(angle)*shell.radius,b=Math.sin(angle)*shell.radius;
            return plane==='xy'?new THREE.Vector3(a,b,0):plane==='xz'?new THREE.Vector3(a,0,b):new THREE.Vector3(0,a,b);
          });
          const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineDashedMaterial({color:theme.color,transparent:true,opacity:.24,dashSize:7,gapSize:6,depthWrite:false}));
          line.computeLineDistances();group.add(line);
        }
        this.overviewShellGroup.add(group);
        this.overviewShells.push(shell);
      }
    }
    this.globalAxis=new THREE.Group();this.scene.add(this.globalAxis);
    if(space.globalInfo){
      for(const t of space.themes.values()){
        const nodes=this.nodeList.filter(n=>n.themeId===t.id),bands=[];
        for(let layer=0;layer<=space.globalInfo.maxLayer;layer+=5){
          const group=nodes.filter(n=>n.sourceLayer>=layer&&n.sourceLayer<layer+5);if(!group.length)continue;
          const position=n=>space.globalPositions.get(n.key),center=[0,1,2].map(k=>group.reduce((a,n)=>a+position(n)[k],0)/group.length),radius=Math.max(16,...group.map(n=>Math.hypot(position(n)[0]-center[0],position(n)[2]-center[2])+12));
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
      const info=space.globalInfo,x=Math.min(...this.nodeList.map(n=>space.globalPositions.get(n.key)[0]))-65,z=0,lines=[x,info.floor,z,x,info.ceiling+20,z];
      for(let level=0;level<=info.maxLayer;level+=5){const y=info.floor+level*info.step;lines.push(x-8,y,z,x+8,y,z);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));this.globalAxis.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x708979,transparent:true,opacity:.38})));
      this.globalAxisPoints=[{text:'沿关键关系向上',position:[x,info.ceiling+45,z]},{text:'起始层',position:[x,info.floor-32,z]}];
    }
    this.halo=new THREE.Mesh(new THREE.TorusGeometry(1,.075,8,64),new THREE.MeshBasicMaterial({color:0x234c45,transparent:true,opacity:.85,depthTest:false}));this.halo.visible=false;this.halo.renderOrder=4;this.scene.add(this.halo);
    this.labelLayer=document.createElement('div');this.labelLayer.className='space-labels';host.append(this.labelLayer);
    this.structureLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
    this.structureLayer.classList.add('overview-structure-lines');this.structureLayer.setAttribute('aria-hidden','true');this.labelLayer.prepend(this.structureLayer);
    // Focused links are drawn in screen pixels; world positions and source relations stay unchanged.
    this.focusLinkLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
    this.focusLinkLayer.classList.add('spatial-focus-links');
    this.focusLinkLayer.setAttribute('aria-hidden','true');
    this.labelLayer.append(this.focusLinkLayer);
    this.focusVisualLinks=[];this.outgoingVisualLinks=null;
    this.labelTethers=document.createElementNS('http://www.w3.org/2000/svg','svg');this.labelTethers.classList.add('label-tethers');this.labelTethers.setAttribute('aria-hidden','true');this.labelLayer.append(this.labelTethers);
    this.relationLayer=document.createElement('div');this.relationLayer.className='relation-captions';this.labelLayer.append(this.relationLayer);
    for(const object of space.objects){
      const el=document.createElement('button');el.type='button';el.className=`space-label ${object.kind}`;el.dataset.key=object.key;el.style.setProperty('--object-color',object.color);
      const title=document.createElement('span'),step=object.kind==='node'&&routeStep(object.id);const lesson=object.kind==='node'&&lessonForTopic(object.id),route=lesson&&routeFor(lesson);title.textContent=this.network&&object.kind==='node'?(space.knowledgeNames?.get(object.id)||object.title):lesson?`${route.id}–0${route.ids.indexOf(lesson)+1} ${LESSONS[lesson].title}`:step?`A–0${step.step} ${step.title}`:object.title;el.append(title);el.title=title.textContent;
      if(this.network&&object.kind==='node'){
        const forms=activityForms(object.id),form=forms[0]||'steps';el.insertAdjacentHTML('afterbegin',activityGlyph(form));
        el.dataset.activityForm=form;el.title+=' · '+forms.map(f=>ACTIVITY_FORMS[f].label).join('、');
      }
      if(object.kind==='pack'&&routeForPack(object.id)){title.textContent=routesForPack(object.id).length===1?routeForPack(object.id).title:object.title;el.classList.add('has-route');el.title=title.textContent+' · 有动手路线';}
      if(object.kind==='theme'){const sub=document.createElement('small');sub.textContent=`${object.children.length} 个知识簇`;el.append(sub);}
      el.addEventListener('click',event=>{event.stopPropagation();callbacks.onSelect?.(object.key);});
      el.addEventListener('dblclick',event=>{event.stopPropagation();if(object.kind==='node')callbacks.onOpen?.(object.id);});
      el.dataset.baseTitle=title.textContent;el.hidden=true;this.labelLayer.append(el);this.labels.push({object,el});
    }
    this.axisLayer=document.createElement('div');this.axisLayer.className='network-axis-labels';this.labelLayer.append(this.axisLayer);
    for(const a of this.globalAxisPoints||[]){a.el=document.createElement('span');a.el.textContent=a.text;this.axisLayer.append(a.el);}
    this.bandLayer=document.createElement('div');this.bandLayer.className='network-bands';this.labelLayer.append(this.bandLayer);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.canvas.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY,button:e.button,moved:false};});
    this.canvas.addEventListener('pointerup',e=>{if(this.down?.button===0&&!this.down.moved&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)<5){const key=this.hit(e);if(key)callbacks.onSelect?.(key);}this.down=null;});
    this.canvas.addEventListener('pointercancel',()=>{this.down=null;});
    this.canvas.addEventListener('pointermove',e=>{if(this.down){if(Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>=5)this.down.moved=true;return;}this.hovered=this.hit(e);this.canvas.style.cursor=this.hovered?'pointer':this.mode==='rotate'?'grab':'move';this.dirty=true;});
    this.canvas.addEventListener('pointerleave',()=>{this.hovered=null;this.dirty=true;});
    this.canvas.addEventListener('dblclick',e=>{const key=this.hit(e),o=space.byKey.get(key);if(o?.kind==='node')callbacks.onOpen?.(o.id);});
    this.canvas.addEventListener('keydown',e=>{if(['+','=','-','_'].includes(e.key)){e.preventDefault();this.zoom(e.key==='-'||e.key==='_'?1.3:.77);}if(e.key==='Home'){e.preventDefault();callbacks.onOverview?.();}});
    this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();callbacks.onError?.('三维画面暂时中断。学习记录已保留，请重新打开。');});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
    this.refresh(()=>({progress:'unseen',evidence:'none'}));
    this.renderer.setAnimationLoop(time=>this.frame(time));
  }
  get global(){return this.network&&(this.networkVersion===GLOBAL_VERSION||this.networkVersion===this.space.relationshipVersion);}
  get relationshipMap(){return this.network&&this.networkVersion===this.space.relationshipVersion;}
  get knowledgeFocus(){return this.relationshipMap&&this.space.byKey.get(this.selected)?.kind==='node'&&!this.guideFocus;}
  get localRelationshipFocus(){return this.knowledgeFocus&&!this.traceResult;}
  // v53 remains one navigable spatial map whether or not a knowledge point
  // is selected. Only the independent learning activity uses a fixed panel.
  syncKnowledgeCameraControls(){if(this.controls)this.controls.enableZoom=true;}
  panIntoViewWithoutZoom(object,animate=true){
    const p=this.project(object.position);
    // A node already visible in the canvas must NEVER move the camera just
    // because it is near a panel or outside a preferred composition inset.
    if(p.visible&&p.x>=0&&p.x<=this.width&&p.y>=0&&p.y<=this.height)return;
    // Search can select a point outside the viewport. Pan only: preserve zoom,
    // distance and orientation; clicking a visible node never moves the camera.
    const target=V(object.position),delta=target.clone().sub(this.controls.target);
    this.fly(this.camera.position.clone().add(delta).toArray(),target.toArray(),animate?650:0);
  }
  focusKeys(){return new Set([this.selected,...(this.related||[])]);}
  // Recorded navigation contains only pairs with an actual source edge; it never moves coordinates.
  trailLinks(){
    const result=[],seen=new Set();
    for(let i=1;i<this.explorationTrail.length;i++){
      const previous=this.explorationTrail[i-1],current=this.explorationTrail[i];
      for(const link of relationsFor(this.space,previous)){
        if(!((link.from===previous&&link.to===current)||(link.to===previous&&link.from===current)))continue;
        const key=link.from+'>'+link.to;
        if(!seen.has(key)){seen.add(key);result.push({...link,trail:true});}
      }
    }
    return result;
  }
  canLocate(o){return !!o&&(!this.relationshipMap||o.kind!=='node'||this.space.relationshipIds.has(o.id));}
  edgeCanLocate(e){return this.canLocate(this.space.nodes.get(e.prerequisiteId))&&this.canLocate(this.space.nodes.get(e.topicId));}
  edgeIsDisplayed(e){return !this.relationshipMap||e.strength==='hard'&&(this.edgeDisplay!=='outline'||this.space.relationshipScaffold.has(e.prerequisiteId+'>'+e.topicId))||e.strength!=='hard'&&this.edgeDisplay==='all';}
  updateProjection(){this.camera.aspect=this.width/this.height;if(this.camera.isOrthographicCamera){const half=this.camera.position.distanceTo(this.controls.target)*Math.tan(Math.PI/9);this.camera.left=-half*this.camera.aspect;this.camera.right=half*this.camera.aspect;this.camera.top=half;this.camera.bottom=-half;}this.camera.updateProjectionMatrix();}
  resize(){const {width,height}=this.host.getBoundingClientRect();this.width=width;this.height=height;this.updateProjection();this.renderer.setSize(width,height,false);this.dirty=true;}
  setMode(mode){this.mode=mode;this.controls.mouseButtons.LEFT=mode==='rotate'?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;this.controls.mouseButtons.RIGHT=mode==='rotate'?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;this.controls.touches.ONE=mode==='rotate'?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN;this.canvas.style.cursor=mode==='rotate'?'grab':'move';}
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
  snapshot(){return {...(this.network?{networkView:this.networkView,networkVersion:this.networkVersion,...(this.global?{cameraZoom:this.camera.zoom,traceMode:this.traceMode}:{}),...(this.relationshipMap?{edgeDisplay:this.edgeDisplay}:{})}:{}),position:this.camera.position.toArray(),target:this.controls.target.toArray(),selected:this.selected,showAllNodes:this.showAllNodes,relationMode:this.relationMode,...(this.relationshipMap&&this.explorationTrail.length?{explorationTrail:[...this.explorationTrail]}:{}),...(this.relationshipMap?{overviewShellsEnabled:this.overviewShellsEnabled,structureMode:this.structureMode,overviewFilterVersion:1,focusDirection:this.focusDirection,focusDepth:this.focusDepth}:{}),...(this.learningRouteId?{learningRouteId:this.learningRouteId}:{}),...(this.learningSectionId?{learningSectionId:this.learningSectionId,learningRoutePage:this.learningRoutePage||0}:{})};}
  restore(view,animated=false){this.viewTransition=null;if(this.network){this.networkVersion=view.networkVersion||(view.networkView?48:47);this.networkView=view.networkView||'legacy';if(this.relationshipMap){this.edgeDisplay=['outline','critical','all'].includes(view.edgeDisplay)?view.edgeDisplay:'all';this.structureMode=view.overviewFilterVersion===1&&['all','origin','fork','join','off'].includes(view.structureMode)?view.structureMode:'origin';this.focusDirection=FOCUS_DIRECTIONS.includes(view.focusDirection)?view.focusDirection:'both';this.focusDepth=FOCUS_DEPTHS.includes(String(view.focusDepth))?String(view.focusDepth):'1';}}const o=this.space.byKey.get(view.selected),r=ROUTES.find(r=>r.id===view.learningRouteId);this.learningRouteId=r&&(o?.kind==='pack'&&r.packIds.includes(o.id)||o?.kind==='node'&&r.ids.includes(lessonForTopic(o.id)))?r.id:null;this.learningSectionId=this.learningRouteId?r.section||null:o?.kind==='pack'&&ROUTES.some(x=>x.section===view.learningSectionId&&x.packIds.includes(o.id))?view.learningSectionId:null;this.learningRoutePage=this.learningRouteId?Math.floor(ROUTES.filter(x=>x.section===this.learningSectionId).findIndex(x=>x.id===this.learningRouteId)/3):Math.max(0,Math.min(Number.isInteger(view.learningRoutePage)?view.learningRoutePage:0,Math.floor((ROUTES.filter(x=>x.section===this.learningSectionId).length-1)/3)));if(typeof view.showAllNodes==='boolean')this.showAllNodes=view.showAllNodes;if(this.relationshipMap)this.overviewShellsEnabled=view.overviewShellsEnabled===true;this.explorationTrail=[];this.select(view.selected);
    if(this.relationshipMap&&this.space.byKey.get(view.selected)?.kind==='node'&&Array.isArray(view.explorationTrail)){
      const trail=view.explorationTrail.filter(key=>this.space.byKey.get(key)?.kind==='node').slice(-16),valid=[];
      for(const key of trail){if(!valid.length||relationsFor(this.space,valid.at(-1)).some(l=>(l.from===valid.at(-1)&&l.to===key)||(l.to===valid.at(-1)&&l.from===key)))valid.push(key);else break;}
      if(valid.at(-1)===view.selected)this.explorationTrail=valid;
      this.rebuildRelations();
    }if(this.global){this.camera.zoom=view.cameraZoom||1;this.setTrace(view.traceMode||'direct');}this.setRelations(view.relationMode||(this.global&&o?.kind==='node'?'source':'off'));this.fly(view.position,view.target,animated?850:0);}
  overview(animated=true){if(this.network){
    if(this.relationshipMap&&this.selected){
      this.outgoingVisualLinks=animated?[...this.focusVisualLinks]:null;
      if(animated)this.beginViewTransition('to-overview',650);
      else this.viewTransition=null;
      // Deselect in place: never auto-fit, zoom or rotate the shared map.
      this.tween=null;this.select(null);return;
    }
    this.outgoingVisualLinks=this.localRelationshipFocus&&animated?[...this.focusVisualLinks]:null;
    if(this.localRelationshipFocus&&animated)this.beginViewTransition('to-overview',1050);
    if(!this.global)this.networkVersion=this.defaultNetworkVersion;
    this.networkView='oblique';this.select(null);this.fitNetworkView(animated);return;}const factor=Math.max(1,1/this.camera.aspect);this.select(null);this.fly(this.network?[345*factor,310*factor,1150*factor]:[260*factor,160*factor,1580*factor],this.network?[0,0,0]:[0,-15,-70],animated?1100:0);}
  focus(key,{animate=true}={}){const o=this.space.byKey.get(key);if(!o)return;
    const overview=this.global&&!this.selected&&this.wholeMapVisible(),enteringFocus=this.relationshipMap&&!this.selected;
    const previous=this.selected;
    const adjacent=this.localRelationshipFocus&&o.kind==='node'&&previous!==o.key&&relationsFor(this.space,previous)
      .some(l=>(l.from===previous&&l.to===o.key)||(l.to===previous&&l.from===o.key));
    if(enteringFocus&&o.kind==='node'&&animate)this.beginViewTransition('to-focus',850);
    else this.viewTransition=null;
    this.tween=null;this.select(key);
    if(adjacent)return;
    if(this.global){if(o.kind==='node'){
      if(!this.canLocate(o))return;
      if(this.relationshipMap)this.panIntoViewWithoutZoom(o,animate);
      else {const p=this.project(o.position),insets=this.globalInsets();if(enteringFocus||!p.visible||p.x<insets.left||p.x>this.width-insets.right||p.y<insets.top||p.y>this.height-insets.bottom)this.fitGlobalView(animate,[o,...this.nodeList.filter(n=>this.related.has(n.key))]);else if(overview)this.fitGlobalView(animate);}
    }else this.fitGlobalView(animate,this.nodeList.filter(n=>o.kind==='theme'?n.themeId===o.id:n.packId===o.id));return;}
    if(this.network&&o.kind==='node'){if(this.networkView==='relations')this.fitNetworkView(animate);return;}
    const ratio=Math.max(1,.85/this.camera.aspect),d=(o.kind==='theme'?570:o.kind==='pack'?Math.max(225,o.radius*4.7):175)*ratio;
    const direction=this.camera.position.clone().sub(this.controls.target).normalize();this.fly(V(o.position).addScaledVector(direction,d).toArray(),o.position,animate?1000:0);
  }
  select(key){const changed=key!==this.selected;
    if(changed){
      const previous=this.selected,from=this.space.byKey.get(previous),to=this.space.byKey.get(key);
      const adjacent=this.relationshipMap&&!this.guideFocus&&!this.traceResult&&from?.kind==='node'&&to?.kind==='node'&&relationsFor(this.space,previous).some(l=>(l.from===previous&&l.to===key)||(l.to===previous&&l.from===key));
      this.explorationTrail=to?.kind==='node'?(adjacent?[...this.explorationTrail.filter(Boolean),...(this.explorationTrail.length?[]:[previous]),key].slice(-16):[key]):[];
    }
    if(changed){this.relationMode=this.network&&key?.startsWith('node:')?'source':'off';this.traceMode='direct';this.traceResult=null;this.previewKey=null;}this.selected=this.space.byKey.has(key)?key:null;if(this.network)this.applyNetworkLayout();this.syncKnowledgeCameraControls();this.rebuildRelations();this.dirty=true;}
  setTrace(mode){this.traceMode=this.global&&this.selected?.startsWith('node:')&&['before','after'].includes(mode)?mode:'direct';this.traceResult=this.traceMode==='direct'?null:traceCritical(this.space.atlas,this.selected.slice(5),this.traceMode);this.previewKey=null;this.rebuildRelations();this.dirty=true;}
  setGuideFocus(steps,index,{animate=true,fit=true}={}){if(!this.relationshipMap||!steps[index])return;
    // Guided observation is an in-place overlay on the panorama. Cancel an
    // unfinished camera animation; never refit, rotate or zoom for a guide step.
    this.tween=null;this.viewTransition=null;const current=steps[index],seen=steps.slice(0,index+1),byEdge=new Map();for(const step of seen)for(const edge of step.edges)byEdge.set(edge.prerequisiteId+'>'+edge.topicId,edge);this.guideFocus={step:index,edges:[...byEdge.values()],current:new Set(current.edges.map(e=>e.prerequisiteId+'>'+e.topicId)),currentNodes:new Set(current.nodes.map(id=>'node:'+id)),seenNodes:new Set(seen.flatMap(step=>step.nodes.map(id=>'node:'+id)))};this.traceMode='direct';this.traceResult=null;this.select('node:'+current.anchor);this.setRelations('source');this.dirty=true;}
  clearGuideFocus(){if(!this.guideFocus)return;this.guideFocus=null;this.explorationTrail=this.space.byKey.get(this.selected)?.kind==='node'?[this.selected]:[];this.rebuildRelations();this.dirty=true;}
  setPreview(key){const next=key&&this.space.byKey.has(key)&&this.related?.has(key)?key:null;if(next===this.previewKey)return;this.previewKey=next;this.updateRelationPreview();this.dirty=true;}
  updateRelationPreview(){for(const child of this.edgesGroup.children){const m=child.material;if(!m||!child.userData.relation)continue;const incident=child.userData.relation.includes(this.previewKey);m.transparent=true;m.opacity=this.previewKey?(incident?1:.12):child.userData.baseOpacity;m.needsUpdate=true;}}
  setFocusFilter(direction=this.focusDirection,depth=this.focusDepth){
    if(!this.relationshipMap||!this.space.byKey.get(this.selected)?.kind==='node'||this.guideFocus)return;
    this.focusDirection=FOCUS_DIRECTIONS.includes(direction)?direction:'both';
    this.focusDepth=FOCUS_DEPTHS.includes(String(depth))?String(depth):'1';
    this.traceMode='direct';this.traceResult=null;this.previewKey=null;
    this.rebuildRelations();this.dirty=true;
  }
  setRelations(mode){this.relationMode=['source','route'].includes(mode)?mode:'off';this.rebuildRelations();this.dirty=true;}
  setEdgeDisplay(mode){if(!this.relationshipMap||!['outline','critical','all'].includes(mode)||mode===this.edgeDisplay)return;this.edgeDisplay=mode;this.refreshNetworkEdges();this.rebuildRelations();this.dirty=true;}
  setAllNodes(show){this.showAllNodes=!!show;this.rebuildRelations();this.dirty=true;}
  setOverviewShells(enabled){this.overviewShellsEnabled=!!enabled&&this.overviewShells.length>0;this.dirty=true;}
  setStructureMode(mode){
    if(!this.relationshipMap||!['all',...OVERVIEW_ROLES,'off'].includes(mode)||this.structureMode===mode)return;
    this.structureMode=mode;this.rebuildRelations();this.dirty=true;
  }
  get structuralOverview(){return this.relationshipMap&&!this.selected&&!this.guideFocus&&this.structureMode!=='off';}
  transitionProgress(time=performance.now()){
    const t=this.viewTransition;if(!t)return 1;
    const p=clamp((time-t.start)/t.duration,0,1);
    return p*p*(3-2*p);
  }
  beginViewTransition(kind,duration=1050){
    if(!this.relationshipMap||matchMedia('(prefers-reduced-motion: reduce)').matches){this.viewTransition=null;return;}
    this.viewTransition={kind,start:performance.now(),duration,fromKeys:new Set(this.visibleNodes||[])};
    this.dirty=true;
  }
  updateStructureLines(){
    if(!this.structureLayer)return;
    const leaving=this.viewTransition?.kind==='to-focus'&&this.structureMode!=='off';
    this.structureLayer.hidden=!this.structuralOverview&&!leaving;
    this.structureLayer.style.opacity=String(leaving?1-this.transitionProgress():this.viewTransition?.kind==='to-overview'?this.transitionProgress():1);
    if(this.structureLayer.hidden){this.structureLayer.replaceChildren();return;}
    this.structureLayer.setAttribute('viewBox',`0 0 ${this.width} ${this.height}`);
    const seen=new Set(),html=[];
    for(const link of this.overviewStructure.links){
      if(this.structureMode!=='all'&&this.structureMode!==link.role)continue;
      const key=link.from+'>'+link.to;
      if(seen.has(key))continue;seen.add(key);
      const from=this.space.nodes.get(link.from),to=this.space.nodes.get(link.to);
      if(!from||!to)continue;
      const a=this.project(from.position),b=this.project(to.position);
      if(!a.visible||!b.visible)continue;
      html.push(`<path class="structure-path ${link.role}" d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}" />`);
    }
    this.structureLayer.innerHTML=html.join('');
  }
  setLearningSection(id){this.learningSectionId=id;this.learningRoutePage=0;this.learningRouteId=null;this.rebuildRelations();this.dirty=true;}
  setLearningRoute(id){this.learningRouteId=id;if(id){this.learningSectionId=ROUTES.find(r=>r.id===id)?.section||null;this.learningRoutePage=Math.floor(ROUTES.filter(r=>r.section===this.learningSectionId).findIndex(r=>r.id===id)/3);}this.rebuildRelations();this.dirty=true;}
  selectedRoute(){const o=this.space.byKey.get(this.selected);return o?.kind==='pack'&&this.learningRouteId?ROUTES.find(r=>r.id===this.learningRouteId):o?.kind==='pack'&&routesForPack(o.id).length>1?null:undefined;}
  setPersonalProgress(keys){const next=[...keys].sort();if(JSON.stringify(next)!==JSON.stringify(this.litConnections)){this.litConnections=next;this.rebuildRelations();this.dirty=true;}}
  setPersonalMarkers(scenes,questions){if(!this.network)return;this.savedScenes=new Set(scenes);this.queuedQuestions=new Set(questions);this.dirty=true;}
  nodeVisible(o){if(!this.canLocate(o))return false;
    if(this.relationshipMap){
      if(this.guideFocus)return true; // Keep the same 537 knowledge points as the panorama, softly dimmed.
      // Focus and depth filters change emphasis, labels and highlighted source
      // edges only. They must never erase the rest of the 537-point panorama.
      if(this.traceResult||this.localRelationshipFocus)return true;
      if(!this.selected)return true;
    }
    if(this.global)return this.showAllNodes||o.key===this.selected||this.related?.has(o.key)||this.completedNodes?.has(o.id);if(this.networkView==='relations')return this.space.relationIds.has(o.id);const selected=this.space.byKey.get(this.selected);return this.showAllNodes||this.completedNodes?.has(o.id)||o.key===this.selected||this.related?.has(o.key)||(selected?.kind==='pack'&&(this.selectedRoute()===undefined?routeForPack(selected.id):this.selectedRoute())?.ids.includes(lessonForTopic(o.id)));}
  fly(position,target,duration=900,zoom=null){if(matchMedia('(prefers-reduced-motion: reduce)').matches)duration=0;
    this.tween=null;
    // A saved pose or named view must not inherit the previous drag's momentum.
    const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=damping;
    if(!duration){this.camera.position.copy(V(position));this.controls.target.copy(V(target));if(zoom!==null)this.camera.zoom=zoom;this.controls.update();this.updateProjection();this.camera.updateMatrixWorld();this.dirty=true;this.callbacks.onSettled?.();return;}
    this.tween={start:performance.now(),duration,from:this.camera.position.clone(),to:V(position),fromTarget:this.controls.target.clone(),toTarget:V(target),fromZoom:this.camera.zoom,toZoom:zoom===null?this.camera.zoom:zoom};
  }
  zoom(factor){if(this.global){this.camera.zoom=clamp(this.camera.zoom/factor,this.controls.minZoom,this.controls.maxZoom);this.updateProjection();this.dirty=true;this.callbacks.onSettled?.();return;}const offset=this.camera.position.clone().sub(this.controls.target);const length=clamp(offset.length()*factor,30,8000);this.fly(this.controls.target.clone().add(offset.normalize().multiplyScalar(length)).toArray(),this.controls.target.toArray(),250);}
  front(){if(this.relationshipMap){this.fitGlobalView(true);return;}if(this.network&&this.networkView!=='legacy'){if(this.localRelationshipFocus)this.fitGlobalView(true,this.nodeList.filter(n=>this.focusKeys().has(n.key)));else this.fitNetworkView();return;}const distance=this.camera.position.distanceTo(this.controls.target);this.fly(this.controls.target.clone().add(new THREE.Vector3(0,0,distance)).toArray(),this.controls.target.toArray(),700);}
  viewFrom(name){if(this.network){
    if(!this.global)this.networkVersion=this.defaultNetworkVersion;this.networkView=name==='side'?'relations':name==='top'?'map':'oblique';
    this.applyNetworkLayout();this.rebuildRelations();if(this.localRelationshipFocus)this.fitGlobalView(true,this.nodeList.filter(n=>this.focusKeys().has(n.key)));else this.fitNetworkView(true);this.dirty=true;return true;
  }const distance=this.camera.position.distanceTo(this.controls.target),v=name==='top'?new THREE.Vector3(.01,1,.01):name==='side'?new THREE.Vector3(0,0,1):new THREE.Vector3(.3,.27,1);this.fly(this.controls.target.clone().add(v.normalize().multiplyScalar(distance)).toArray(),this.controls.target.toArray(),700);}
  applyNetworkLayout(){
    if(this.space.globalInfo&&!!this.camera.isOrthographicCamera!==this.global){const old=this.camera;this.camera=this.global?new THREE.OrthographicCamera(-800,800,600,-600,1,20000):new THREE.PerspectiveCamera(40,this.width/this.height,1,20000);this.camera.fov=40;this.camera.aspect=this.width/this.height;this.camera.position.copy(old.position);this.camera.quaternion.copy(old.quaternion);this.controls.object=this.camera;this.syncKnowledgeCameraControls();this.updateProjection();}
    this.networkView=this.space.globalPositions?restoreNetworkCoordinates(this.space,this.networkVersion,this.networkView,this.selected):applyNetworkView(this.space,this.networkView,this.selected);
    for(const [id,mesh]of this.packMeshes)mesh.parent.position.copy(V(this.space.packs.get(id).position));
    this.refreshNetworkEdges();
    this.mapRegions.visible=!this.global&&(this.networkView==='map'||this.networkView==='oblique');
    this.globalRegions.visible=this.global&&!this.relationshipMap;this.globalAxis.visible=this.global&&!this.relationshipMap&&this.networkView!=='map';
    this.bandLayer?.replaceChildren();
    if(!this.global&&this.networkView==='relations'&&this.bandLayer){
      const r=this.space.relationLayout,ys=[...r.positions.values()].map(p=>p[1]);
      this.bandLabels=[{text:`还能用到 · ${r.after.length}`,y:Math.max(200,...ys)+75},{text:`这里会用到 · ${r.before.length}`,y:Math.min(-200,...ys)-160}];
      for(const band of this.bandLabels){const el=document.createElement('span');el.textContent=band.text;this.bandLayer.append(el);band.el=el;}
    }else this.bandLabels=[];
  }
  refreshNetworkEdges(){for(const mesh of [this.networkEdges,this.networkSoftEdges])if(mesh){const edges=mesh.userData.allEdges.filter(e=>this.edgeCanLocate(e)&&this.edgeIsDisplayed(e)),array=new Float32Array(edges.length*6);mesh.userData.edges=edges;edges.forEach((e,i)=>{array.set(this.space.nodes.get(e.prerequisiteId).position,i*6);array.set(this.space.nodes.get(e.topicId).position,i*6+3);});mesh.geometry.setAttribute('position',new THREE.BufferAttribute(array,3));mesh.geometry.computeBoundingSphere();if(mesh===this.networkSoftEdges)mesh.computeLineDistances();}}
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
    const themeFocus=this.relationshipMap&&this.space.byKey.get(this.selected)?.kind==='theme';
    const left=themeFocus?(this.width>1050?500:this.width>760?440:Math.min(320,this.width*.43)):this.selected?340:42;
    return {left,right:120,top:Math.max(138,(guide?.bottom||116)+22),bottom:Math.max(88,this.height-(footer?.top||this.height-70)+18)};
  }
  globalScale(){return this.height*this.camera.zoom/(2*this.camera.position.distanceTo(this.controls.target)*Math.tan(Math.PI/9));}
  nodeScreenRadius(key){const i=this.nodeList.findIndex(n=>n.key===key);if(i<0||!this.global)return null;const matrix=new THREE.Matrix4();this.nodeMesh.getMatrixAt(i,matrix);return new THREE.Vector3().setFromMatrixScale(matrix).x*this.globalScale();}
  completionMarkerVisible(key){const i=this.nodeList.findIndex(n=>n.key===key);if(i<0)return false;const matrix=new THREE.Matrix4();this.progressMesh.getMatrixAt(i,matrix);return new THREE.Vector3().setFromMatrixScale(matrix).x>0;}
  wholeMapVisible(){const {top,bottom}=this.globalInsets();return this.nodeList.filter(n=>this.canLocate(n)).every(n=>{const p=this.project(n.position);return p.visible&&p.x>24&&p.x<this.width-110&&p.y>top-8&&p.y<this.height-bottom+8;});}
  recoverUnreadableSavedCamera(){
    // Only during initial restoration, not on clicks, focus/guide steps or
    // ordinary user zoom: a persisted extreme zoom may reduce the entire map
    // to a tiny, unusable dot cluster. Do not change normal saved camera poses.
    if(!this.relationshipMap||!this.global||this.nodeList.length<100)return false;
    this.camera.updateMatrixWorld();this.updateProjection();
    const coords=this.nodeList.filter(n=>this.canLocate(n)).map(n=>this.project(n.position));
    if(coords.length<100)return false;
    const xs=coords.map(p=>p.x).sort((a,b)=>a-b),ys=coords.map(p=>p.y).sort((a,b)=>a-b);
    const i=Math.floor(coords.length*.05),j=Math.ceil(coords.length*.95)-1;
    const width=xs[j]-xs[i],height=ys[j]-ys[i];
    if(!Number.isFinite(width)||!Number.isFinite(height)||width>=this.width*.17||height>=this.height*.17)return false;
    this.fitGlobalView(false);
    return true;
  }
  fitGlobalView(animated=true,objects=null){
    const points=(objects||this.nodeList).filter(o=>this.canLocate(o)).map(o=>V(o.position));if(!points.length)return;
    const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
    const dir=V(this.networkView==='map'?[0,1,.0001]:this.networkView==='relations'?[0,0,1]:[.65,.5,1]).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize(),up=new THREE.Vector3().crossVectors(dir,right).normalize();
    const xs=points.map(p=>p.dot(right)),ys=points.map(p=>p.dot(up));
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const {left,right:rightMargin,top,bottom}=this.globalInsets(),w=Math.max(260,this.width-left-rightMargin),h=Math.max(200,this.height-top-bottom);
    // Fit the projected point bounds, not the large annotation boxes. All views
    // use the same source coordinates; only the orthographic camera changes.
    const minSpan=this.guideFocus?85:this.localRelationshipFocus?110:160;
    const pixels=Math.min((w-72)/Math.max(minSpan,maxX-minX),(h-56)/Math.max(minSpan,maxY-minY));
    const target=right.clone().multiplyScalar((minX+maxX)/2-(left-rightMargin)/(2*pixels)).addScaledVector(up,(minY+maxY)/2+(top-bottom)/(2*pixels)).addScaledVector(dir,center.dot(dir));
    const distance=2200,targetZoom=pixels*2*distance*Math.tan(Math.PI/9)/this.height;
    if(this.relationshipMap&&!objects){
      // Bounds derive from the real graph, not an arbitrary zoom number.
      // Even repeated wheel zoom-outs should leave a recognizable atlas.
      this.controls.minZoom=Math.max(.15,targetZoom*.32);
      this.controls.maxZoom=Math.max(35,targetZoom*5);
    }
    this.fly(target.clone().addScaledVector(dir,distance).toArray(),target.toArray(),animated?1050:0,targetZoom);
  }

  basis(){const right=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);return {right,up,direction:this.camera.position.clone().sub(this.controls.target).normalize()};}
  refresh(stateFor,filter=this.filter){this.stateFor=stateFor;this.filter=filter;this.states=this.nodeList.map(o=>stateFor(o.id));this.completedNodes=new Set(this.nodeList.filter((o,i)=>this.states[i].progress==='completed').map(o=>o.id));
    const available=new Set(topicIds);
    for(const {object,el}of this.labels){
      if(object.kind==='node'){const done=stateFor(object.id).progress==='completed',name=this.network?(this.space.knowledgeNames?.get(object.id)||object.title):(routeStep(object.id)?.title||object.title);el.dataset.progress=done?'completed':'incomplete';el.classList.remove('has-evidence');el.setAttribute('aria-label',`${name}${available.has(object.id)?'，'+(done?'完成':'未完成'):''}`);}
      else {const ids=(object.kind==='pack'?object.nodeIds:this.nodeList.filter(n=>n.themeId===object.id).map(n=>n.id)).filter(id=>available.has(id)),completed=ids.filter(id=>stateFor(id).progress==='completed').length;
        el.classList.remove('has-trail');el.classList.toggle('has-completion',completed>0);el.dataset.completed=String(completed);
        if(object.kind==='theme')el.querySelector('small').innerHTML=ids.length?`<span>完成 ${completed} / ${ids.length}</span><progress max="${ids.length}" value="${completed}" aria-label="完成 ${completed} / ${ids.length}"></progress>`:`${object.children.length} 个分组`;
        el.setAttribute('aria-label',`${object.title}${ids.length?'，完成 '+completed+' / '+ids.length:''}`);
      }
    }
    this.dirty=true;
  }
  paintObjects(){
    const selected=this.space.byKey.get(this.selected),transform=new THREE.Object3D(),color=new THREE.Color(),paper=new THREE.Color(0xf5f4ef),structureActive=this.structuralOverview,
      transition=this.viewTransition,progress=this.transitionProgress(),fadeIn=transition?.kind==='to-overview',fadeOut=transition?.kind==='to-focus';
    const emphasis=o=>{if(o.key===this.previewKey)return 1;if(this.guideFocus)return this.guideFocus.currentNodes.has(o.key)?1:this.guideFocus.seenNodes.has(o.key)?.70:.14;if(!selected)return 1;if(selected.kind==='theme')return o.themeId===selected.id||o.id===selected.id?1:.35;if(selected.kind==='pack')return o.packId===selected.id||o.id===selected.id?1:.28;if(o.key===selected.key)return 1;if(this.related?.has(o.key)){const d=this.traceResult?.distances.get(o.id);return d?Math.max(.52,1-(d-1)*.07):1;}return this.relationshipMap?.18:o.packId===selected.packId?.42:.18;};
    this.visibleNodes=new Set();const pixelsPerUnit=this.relationshipMap?Math.max(.001,this.globalScale()):1;
    const cap=this.relationshipMap?Math.min(1,7/(5*pixelsPerUnit)):1;
    for(let i=0;i<this.nodeList.length;i++){
      const o=this.nodeList[i],s=this.states?.[i]||{progress:'unseen',evidence:'none'},d=this.camera.position.distanceTo(V(o.position))/(this.global?this.camera.zoom:1),focus=emphasis(o);
      const visible=this.nodeVisible(o);if(visible)this.visibleNodes.add(o.key);
      const oldVisible=fadeOut&&transition.fromKeys.has(o.key);
      const visualAmount=fadeOut?(visible?1:oldVisible?1-progress:0):fadeIn?(transition.fromKeys.has(o.key)?1:progress):(visible?1:0);
      const level=visualAmount*(this.global?1:this.network?clamp((1800-d)/1050,.65,1):clamp((900-d)/580,.42,1)),match=this.filter==='all'||this.filter==='visited'&&s.progress!=='unseen'||this.filter==='completed'&&s.progress==='completed';
      const structuralRole=this.overviewStructure.nodeRoles.get(o.id);
      const structuralNode=structureActive&&(this.structureMode==='all'?!!structuralRole:!!this.overviewStructure.roleNodeSets?.get(this.structureMode)?.has(o.id));
      const guideUnrelated=this.relationshipMap&&this.guideFocus&&!this.guideFocus.currentNodes.has(o.key)&&!this.guideFocus.seenNodes.has(o.key);
      // Reuse the panorama's softly translucent background treatment. Only the
      // guide's real current/visited nodes are allowed to regain saturation.
      const focusedBackground=this.relationshipMap&&selected?.kind==='node'&&!this.guideFocus&&o.key!==this.selected&&!this.related?.has(o.key);
      color.set(o.color).lerp(paper,1-(guideUnrelated?.80:focusedBackground?.80:structureActive?(structuralNode?.98:.14):this.relationshipMap&&!selected?.kind?.68:this.network?.87:s.progress==='completed'?.92:.68)*focus*(match?1:.16));
      if(!this.relationshipMap){
        if(fadeOut&&!visible&&oldVisible)color.set(o.color).lerp(paper,1-(1-progress)*(this.overviewStructure.nodeRoles.has(o.id)&&this.structureMode!=='off'?.98:.14));
        if(fadeOut&&visible&&o.key!==this.selected)color.lerp(paper,1-progress);
        if(fadeIn&&!transition.fromKeys.has(o.key))color.lerp(paper,1-progress);
      }
      const pixelRadius=this.relationshipMap&&this.guideFocus?
        (this.guideFocus.currentNodes.has(o.key)?6.5:this.guideFocus.seenNodes.has(o.key)?4.8:3.4):
        structureActive?(structuralNode?5.4:3.4):o.key===this.selected?6.5:this.related?.has(o.key)?4.8:4.3;
      const size=this.relationshipMap?pixelRadius/pixelsPerUnit:(this.global?5:this.network?4:3.2)*cap*(structureActive?(structuralNode?1.6:.65):1);
      transform.position.copy(V(o.position));transform.quaternion.copy(this.camera.quaternion);transform.scale.setScalar((this.relationshipMap?size:this.global?(o.key===this.selected||o.key===this.previewKey?size+3*cap:size):(this.related?.has(o.key)&&selected?.kind==='node'?size+1:size))*level);transform.updateMatrix();this.nodeMesh.setMatrixAt(i,transform.matrix);this.nodeMesh.setColorAt(i,color);
      transform.quaternion.copy(this.camera.quaternion);transform.scale.setScalar(s.progress==='completed'&&match?(size+(this.relationshipMap?2.8/pixelsPerUnit:1.6*cap))*level:0);transform.updateMatrix();this.progressMesh.setMatrixAt(i,transform.matrix);
      transform.scale.setScalar(0);transform.updateMatrix();this.evidenceMesh.setMatrixAt(i,transform.matrix);
      if(this.network){
        transform.position.copy(V(o.position)).add(new THREE.Vector3(8*cap,8*cap,0).applyQuaternion(this.camera.quaternion));transform.quaternion.copy(this.camera.quaternion);
        // A saved activity is a record, not a different kind of knowledge node.
        transform.scale.setScalar(!this.relationshipMap&&visible&&this.savedScenes.has(o.id)?4*cap*level*focus:0);transform.updateMatrix();this.sceneMarkers.setMatrixAt(i,transform.matrix);
        transform.position.copy(V(o.position)).add(new THREE.Vector3(-8*cap,8*cap,0).applyQuaternion(this.camera.quaternion));transform.scale.setScalar(!this.relationshipMap&&visible&&this.queuedQuestions.has(o.id)?4.5*cap*level*focus:0);transform.updateMatrix();this.questionMarkers.setMatrixAt(i,transform.matrix);
      }
    }
    for(const [id,core]of this.packMeshes){const o=this.space.packs.get(id);core.visible=this.network?!this.relationshipMap&&(this.global||this.networkView!=='relations')&&!!selected&&(selected.kind==='theme'?o.themeId===selected.id:o.id===selected.packId||o.id===selected.id):this.showAllNodes||!!selected&&(selected.kind==='theme'?o.themeId===selected.id:o.id===selected.packId||o.id===selected.id);core.material.color.set(o.color).lerp(paper,1-emphasis(o)*.9);}
    for(const field of this.fields){const o=field.userData.object;field.visible=!this.network&&(o.kind==='theme'||this.showAllNodes);field.material.opacity=(o.kind==='theme'?.035:.025)*emphasis(o);}
    this.nodeMesh.instanceMatrix.needsUpdate=true;this.nodeMesh.instanceColor.needsUpdate=true;this.progressMesh.instanceMatrix.needsUpdate=true;this.evidenceMesh.instanceMatrix.needsUpdate=true;
    if(this.network){this.sceneMarkers.instanceMatrix.needsUpdate=true;this.questionMarkers.instanceMatrix.needsUpdate=true;}
    if(this.global)for(const shape of this.globalRegions.children)shape.material.opacity=this.selected?(shape.isMesh?.004:.025):(shape.isMesh?.012:.075);
    this.overviewShellGroup.visible=this.relationshipMap&&!this.selected&&this.overviewShellsEnabled;
  }
  rebuildRelations(){this.focusVisualLinks=[];this.focusView=this.localRelationshipFocus?
    buildFocusFilter(this.space.atlas,this.space.relationshipIds,this.selected.slice(5),this.focusDirection,this.focusDepth):null;
    for(const child of [...this.edgesGroup.children]){child.geometry?.dispose();child.material?.dispose();this.edgesGroup.remove(child);}
    this.progressBackground=[];
    if(this.networkEdges){this.networkEdges.visible=(this.relationshipMap?true:this.showAllNodes)&&(this.global||this.networkView!=='relations');
      this.networkEdges.material.opacity=this.guideFocus?.023:this.relationshipMap&&this.selected?.025:this.global?(this.selected?.035:this.structuralOverview?.023:this.relationshipMap?.085:.16):(this.selected?.06:.19);
      this.networkSoftEdges.visible=this.networkEdges.visible;
      this.networkSoftEdges.material.opacity=this.guideFocus?.012:this.relationshipMap&&this.selected?.010:this.global?(this.selected?.015:.055):(this.selected?.025:.065);}
    const pairs=new Map();for(const link of this.space.themeLinks){const key=[link.from,link.to].sort().join('|');if(!pairs.has(key))pairs.set(key,{...link,edges:[]});pairs.get(key).edges.push(...link.edges);}
    let links=this.guideFocus?this.guideFocus.edges.map(e=>({from:'node:'+e.prerequisiteId,to:'node:'+e.topicId,edges:[e],guideCurrent:this.guideFocus.current.has(e.prerequisiteId+'>'+e.topicId)})):this.relationMode==='off'?personalRelations(this.space.atlas,this.space.byKey.get(this.selected),this.litConnections||[],this.selectedRoute()):this.relationMode==='route'?routeLinks(this.space.atlas).map(e=>({from:'node:'+e.prerequisiteId,to:'node:'+e.topicId,edges:[e]})):this.global&&this.traceResult?this.traceResult.edges.map(e=>({from:'node:'+e.prerequisiteId,to:'node:'+e.topicId,edges:[e]})):this.selected?relationsFor(this.space,this.selected):[...pairs.values()];
    if(this.focusView&&this.relationMode!=='off')links=this.focusView.links.map(e=>({from:'node:'+e.prerequisiteId,to:'node:'+e.topicId,edges:[e]}));
    if(this.guideFocus){const shown=new Set(links.map(l=>l.from+'>'+l.to));for(const l of personalRelations(this.space.atlas,null,this.litConnections||[],null))if(l.lit&&!shown.has(l.from+'>'+l.to))links.push({...l,guideCurrent:false});}
    if(this.localRelationshipFocus&&this.explorationTrail.length>1){
      const seen=new Set(links.map(l=>l.from+'>'+l.to));
      for(const link of this.trailLinks())if(!seen.has(link.from+'>'+link.to)){links.push(link);seen.add(link.from+'>'+link.to);}
    }
    if(this.network){const lit=new Set(this.litConnections||[]);links=links.map(l=>({...l,lit:l.lit||l.edges.some(e=>lit.has(e.prerequisiteId+'>'+e.topicId))}));}
    if(!this.global&&this.networkView==='relations')links=links.filter(l=>l.from===this.selected||l.to===this.selected);this.relations=links;this.related=new Set(links.flatMap(l=>[l.from,l.to]));this.captionCandidates=[];if(this.relationLayer)this.relationLayer.replaceChildren();
    if(this.network&&!this.selected&&this.relationMode==='off'&&links.length){
      const spatialLinks=links.filter(l=>this.canLocate(this.space.byKey.get(l.from))&&this.canLocate(this.space.byKey.get(l.to))),coordinates=new Float32Array(spatialLinks.length*6);spatialLinks.forEach((l,i)=>{coordinates.set(this.space.byKey.get(l.from).position,i*6);coordinates.set(this.space.byKey.get(l.to).position,i*6+3);});
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(coordinates,3));
      this.edgesGroup.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xb48b36,transparent:true,opacity:.8,depthWrite:false})));return;
    }
    if(this.relationshipMap&&this.selected&&!this.guideFocus&&!this.localRelationshipFocus&&!this.traceResult){const shown=new Set(links.map(l=>l.from+'>'+l.to));const completed=personalRelations(this.space.atlas,null,this.litConnections||[],null).filter(l=>l.lit&&!shown.has(l.from+'>'+l.to)&&this.canLocate(this.space.byKey.get(l.from))&&this.canLocate(this.space.byKey.get(l.to)));this.progressBackground=completed.map(l=>({from:l.from,to:l.to}));if(completed.length){const positions=new Float32Array(completed.length*6);completed.forEach((l,i)=>{positions.set(this.space.byKey.get(l.from).position,i*6);positions.set(this.space.byKey.get(l.to).position,i*6+3);});const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));this.edgesGroup.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xb48b36,transparent:true,opacity:.55,depthWrite:false})));}}
    for(const l of links){const a=this.space.byKey.get(l.from),b=this.space.byKey.get(l.to);if(!this.canLocate(a)||!this.canLocate(b))continue;const v=V(a.position),w=V(b.position);const c=v.clone().lerp(w,.5);c.z+=Math.min(70,v.distanceTo(w)*.18);
      const curve=new THREE.QuadraticBezierCurve3(v,c,w),before=this.traceMode==='before'||this.traceMode==='direct'&&l.to===this.selected,color=l.lit?0xb48b36:this.guideFocus?(l.guideCurrent?0x286f7c:0x76988a):this.relationMode==='off'?0x9ca99c:this.selected?(before?0x985b2f:0x286f7c):0xb3bcb3;
      const traced=this.relationshipMap&&!!this.traceResult,hop=traced?Math.min(this.traceResult.distances.get(a.id)??0,this.traceResult.distances.get(b.id)??0):0;
      // v53 focused view: a source-linked screen-space line, never a zoom-inflated 3D tube.
      if(this.relationshipMap&&this.selected){
        const soft=l.edges[0]?.strength==='soft',muted=this.guideFocus&&!l.guideCurrent;
        this.focusVisualLinks.push({from:v,to:w,control:c,color,soft,muted,arrow:!soft&&!l.trail&&(!this.guideFocus||l.guideCurrent),
          fromKey:l.from,toKey:l.to,lit:!!l.lit});
        continue;
      }
      const line=traced?new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(36)),new THREE.LineBasicMaterial({color,transparent:true,opacity:l.lit?.9:Math.max(.2,.72-hop*.055),depthWrite:false})):
        l.lit||this.selected&&this.relationMode!=='off'?new THREE.Mesh(new THREE.TubeGeometry(curve,36,l.lit?.8:this.global?1.35:this.networkView==='relations'?.7:a.kind==='node'?.20:.38,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:this.global?.92:.75,depthWrite:false})):
         new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(36)),new THREE.LineBasicMaterial({color,transparent:true,opacity:this.relationMode==='off'?.3:.14,depthWrite:false}));let rendered=line;if(this.network&&l.edges[0]?.strength==='soft'){
        line.geometry.dispose();line.material.dispose();rendered=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)),new THREE.LineDashedMaterial({color,transparent:true,opacity:this.global?.88:.7,dashSize:6,gapSize:5}));rendered.computeLineDistances();
      }if(this.guideFocus&&!l.lit)rendered.material.opacity=l.guideCurrent?.92:.4;rendered.userData.relation=[l.from,l.to];rendered.userData.baseOpacity=rendered.material.opacity;this.edgesGroup.add(rendered);
      if(this.selected&&this.relationMode!=='off'&&!l.trail&&(!traced||l.from===this.selected||l.to===this.selected)&&(!this.guideFocus||l.guideCurrent)){const arrow=new THREE.Mesh(new THREE.ConeGeometry(this.global?5.5:this.networkView==='relations'?4.5:a.kind==='node'?1.9:3,this.global?15:this.networkView==='relations'?12:a.kind==='node'?5.8:9,10),new THREE.MeshBasicMaterial({color,transparent:true}));arrow.position.copy(curve.getPoint(.78));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(.78).normalize());arrow.userData.relation=[l.from,l.to];arrow.userData.baseOpacity=1;arrow.userData.limitScreenScale=this.relationshipMap;this.edgesGroup.add(arrow);
        this.captionCandidates.push({before,position:curve.getPoint(before?.58:.42).toArray(),length:v.distanceTo(w)});
      }
    }
    if(this.selected&&this.relationLayer&&!this.global&&this.networkView!=='relations')for(const before of [true,false]){const candidate=this.captionCandidates.filter(c=>c.before===before).sort((a,b)=>a.length-b.length)[0];if(!candidate)continue;const el=document.createElement('span');el.className=`relation-caption ${before?'before':'after'}`;el.textContent=before?'这里会用到':'可以继续到';el.hidden=true;this.relationLayer.append(el);candidate.el=el;}this.updateRelationPreview();
  }
  updateFocusLinkLayer(){
    const layer=this.focusLinkLayer;if(!layer)return;
    const t=this.viewTransition,p=this.transitionProgress();
    const transitioningOut=t?.kind==='to-overview',transitioningIn=t?.kind==='to-focus';
    const links=transitioningOut?this.outgoingVisualLinks:this.focusVisualLinks;
    const opacity=transitioningOut?1-p:transitioningIn?p:1;
    if(!this.relationshipMap||!links?.length||opacity<=.001){layer.replaceChildren();layer.hidden=true;return;}
    layer.hidden=false;layer.setAttribute('viewBox',`0 0 ${this.width} ${this.height}`);
    layer.style.opacity=String(opacity);
    const paths=[];
    for(const l of links){
      const curve=new THREE.QuadraticBezierCurve3(l.from,l.control,l.to);
      const start=this.project(curve.getPoint(.025)),mid=this.project(l.control),tip=this.project(curve.getPoint(.88));
      if(!start.visible||!tip.visible)continue;
      const isPreview=this.previewKey&&(l.fromKey===this.previewKey||l.toKey===this.previewKey);
      const fading=this.previewKey&&!isPreview;
      const stroke='#'+l.color.toString(16).padStart(6,'0');
      const lineOpacity=fading?.12:l.muted?.35:l.soft?.58:.84;
      const width=l.lit?2.6:isPreview?2.8:l.soft?1.3:2;
      const dash=l.soft?'stroke-dasharray="4 5"':'';
      paths.push(`<path d="M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${mid.x.toFixed(1)} ${mid.y.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${stroke}" stroke-width="${width}" opacity="${lineOpacity}" ${dash}/>`);
      if(l.arrow&&!fading){
        const near=this.project(curve.getPoint(.83)),dx=tip.x-near.x,dy=tip.y-near.y,length=Math.hypot(dx,dy)||1;
        const ux=dx/length,uy=dy/length,s=4.5;
        const lx=tip.x-ux*s-uy*s*.65,ly=tip.y-uy*s+ux*s*.65;
        const rx=tip.x-ux*s+uy*s*.65,ry=tip.y-uy*s-ux*s*.65;
        paths.push(`<path d="M ${lx.toFixed(1)} ${ly.toFixed(1)} L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L ${rx.toFixed(1)} ${ry.toFixed(1)}" stroke="${stroke}" stroke-width="1.7" opacity="${lineOpacity}"/>`);
      }
    }
    layer.innerHTML=paths.join('');
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
        const landmark=this.structuralOverview&&o.kind==='node'?this.overviewStructure.landmarks.find(a=>a.id===o.id&&(this.structureMode==='all'||this.structureMode===a.role)):null;
        if(landmark){show=true;priority=96;}
        if(o.kind==='theme'){show=selected?.kind!=='node'&&selected?.kind!=='theme'&&scale<2.2;priority=this.relationshipMap?92:60;}
        else if(o.kind==='pack')show=selected?.kind==='theme'?o.themeId===selected.id:selected?.kind!=='node'&&(scale>(this.relationshipMap?1.65:1.15)||isSelected);
        else show=this.nodeVisible(o)&&(scale>2.5||related&&this.traceMode==='direct'||isSelected||o.key===this.hovered||o.key===this.previewKey||!!landmark);
        if(o.key===this.hovered||o.key===this.previewKey||isSelected)show=true;
        if(this.relationshipMap&&!selected&&!this.guideFocus){
          if(o.kind==='node')show=!!landmark||o.key===this.hovered;
          else if(o.kind==='pack')show=false;
        }
        if(this.localRelationshipFocus&&o.kind==='node'&&this.focusView){
          const hop=this.focusView.distances.get(o.id);
          show=isSelected||o.key===this.hovered||o.key===this.previewKey||hop!==undefined&&hop<=1;
          if(hop===undefined&&this.explorationTrail.includes(o.key))show=false;
        }
        if(this.relationshipMap&&this.traceResult&&o.kind==='node'){const hop=this.traceResult.distances.get(o.id);show=isSelected||o.key===this.hovered||o.key===this.previewKey||hop===1&&scale>1.3||hop!==undefined&&scale>2.5;if(hop>1)priority=20;}
        if(this.relationshipMap&&this.guideFocus&&o.kind==='node')show=this.guideFocus.currentNodes.has(o.key)||o.key===this.hovered||o.key===this.previewKey||this.guideFocus.seenNodes.has(o.key)&&scale>2;
        // Theme selection is a knowledge-group overview, not the all-node-name
        // panorama. Only this theme's packs label the map; names emerge after
        // further manual zoom or on direct hover. Other themes remain as points.
        if(this.relationshipMap&&selected?.kind==='theme'){
          if(o.kind==='node'){
            const inspection=o.key===this.hovered||o.key===this.previewKey;
            show=inspection||o.themeId===selected.id&&scale>5.6;
            priority=inspection?95:14;
          }else if(o.kind==='pack'){show=o.themeId===selected.id;priority=82;}
          else show=false;
        }
      }else if(this.network&&this.networkView!=='relations'&&o.kind==='node'&&!related&&!isSelected&&o.key!==this.hovered)show=false;
      if(!this.canLocate(o)||this.relationshipMap&&o.kind!=='node'&&selected?.kind==='node')show=false;
       if(this.relationshipMap&&o.kind==='node'&&(this.localRelationshipFocus||this.traceResult||this.guideFocus)&&!this.nodeVisible(o))show=false;
      if(isSelected&&o.kind==='theme')show=false;
      show=show&&p.visible&&p.x>16&&p.x<this.width-16&&p.y>94&&p.y<this.height-88;
      if(o.key===this.previewKey)priority=95;el.hidden=true;el.classList.remove('selected','related');el.classList.toggle('hovered',o.key===this.hovered||o.key===this.previewKey);el.setAttribute('aria-pressed','false');if(show)candidates.push({...entry,p,priority,isSelected,related});
    }
    candidates.sort((a,b)=>b.priority-a.priority||a.p.distance-b.p.distance);const rects=[...(this.exclusions||[])],tethers=[];let nodes=0;
    for(const c of candidates){const {object:o,el,p}=c,limit=this.relationshipMap&&selected?.kind==='theme'?12:this.relationshipMap&&(this.localRelationshipFocus||this.traceResult)?12:this.global||this.networkView==='relations'?587:22;if(o.kind==='node'&&nodes>=limit&&!c.isSelected&&o.key!==this.hovered&&o.key!==this.previewKey)continue;
      const landmark=this.structuralOverview&&o.kind==='node'?this.overviewStructure.landmarks.find(a=>a.id===o.id&&(this.structureMode==='all'||this.structureMode===a.role)):null;
      const wantedTitle=landmark?`${landmark.text} · ${el.dataset.baseTitle}`:el.dataset.baseTitle;
      const titleSpan=el.querySelector('span');if(titleSpan&&titleSpan.textContent!==wantedTitle)titleSpan.textContent=wantedTitle;
      el.classList.toggle('structure-landmark',!!landmark);
      for(const role of OVERVIEW_ROLES)el.classList.toggle('structure-'+role,landmark?.role===role);
      const title=wantedTitle||o.title;
      const side=!this.global&&this.networkView==='relations'&&o.kind==='node',highlight=c.isSelected||o.key===this.hovered||o.key===this.previewKey;
      const width=this.global?(landmark?Math.min(300,Math.max(210,title.length*14+45)):o.kind==='theme'?Math.min(230,Math.max(158,title.length*18+66)):o.kind==='pack'?Math.min(210,Math.max(110,title.length*12+20)):Math.min(highlight?240:200,Math.max(100,title.length*12+(highlight?63:34)))):side?Math.max(90,Math.min(185,this.project([240,0,0]).x-this.project([0,0,0]).x-12)):o.kind==='theme'?(this.width<600?146:194):Math.min(275,Math.max(112,title.length*(this.width<600?12:13)+44));
      el.classList.toggle('compact-activity',side&&width<135);el.style.width=`${width}px`;
      const height=this.global?(o.kind==='node'?Math.max(30,12+Math.ceil(title.length/Math.max(1,Math.floor((width-(highlight?63:34))/12)))*17):30):o.kind==='theme'?68:side?(width<135?38+Math.ceil(title.length/Math.max(1,Math.floor((width-20)/12)))*17:Math.max(58,18+Math.ceil(title.length/Math.max(1,Math.floor((width-63)/12)))*17)):38;
      const rect=placeLabel({x:p.x,y:p.y,w:width,h:height,kind:this.global&&o.kind==='theme'?'global-theme':o.kind,viewport:{w:this.width,h:this.height,...(this.global?{top:this.globalInsets().top-14,bottom:78}:{})},occupied:rects});if(!rect)continue;
      const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2;if(Math.hypot(cx-p.x,cy-p.y)>45)tethers.push(`<path d="M ${p.x} ${p.y} L ${cx} ${cy}"/>`);
      rects.push(rect);if(o.kind==='node')nodes++;
      el.hidden=false;el.style.width=`${width}px`;el.style.transform=`translate(${rect.x}px,${rect.y}px)`;el.style.zIndex=String(c.priority);el.classList.toggle('selected',c.isSelected);el.classList.toggle('related',!!c.related&&!!this.selected);el.setAttribute('aria-pressed',String(c.isSelected));
    }
    for(const c of this.captionCandidates||[]){if(!c.el)continue;c.el.hidden=true;const p=this.project(c.position);if(!p.visible)continue;const r=placeLabel({x:p.x,y:p.y,w:102,h:28,viewport:{w:this.width,h:this.height},occupied:rects});if(!r)continue;rects.push(r);c.el.style.transform=`translate(${r.x}px,${r.y}px)`;c.el.hidden=false;}
    for(const b of this.bandLabels||[]){const p=this.project([0,b.y,0]);b.el.hidden=!p.visible;b.el.style.transform=`translate(${p.x}px,${p.y}px)`;}
    for(const a of this.globalAxisPoints||[]){const p=this.project(a.position);a.el.hidden=!this.global||this.relationshipMap||this.controls.getPolarAngle()<.02||!p.visible;a.el.style.transform=`translate(${p.x}px,${p.y}px)`;}
    this.labelTethers.innerHTML=tethers.join('');this.updateStructureLines();
  }
  frame(time){if(document.hidden)return;let moving=false;
    if(this.tween){const t=this.tween,x=clamp((time-t.start)/t.duration,0,1),e=x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
      this.camera.position.lerpVectors(t.from,t.to,e);this.controls.target.lerpVectors(t.fromTarget,t.toTarget,e);
      this.camera.zoom=t.fromZoom+(t.toZoom-t.fromZoom)*e;this.dirty=true;moving=true;
      if(x===1){this.tween=null;this.callbacks.onSettled?.();}}
    if(this.viewTransition){
      const t=this.viewTransition,p=this.transitionProgress(time);
      this.dirty=true;moving=true;
      if(this.networkEdges){
        this.networkEdges.visible=this.relationshipMap||t.kind==='to-focus'||!this.selected;
        const base=this.structuralOverview?.023:this.relationshipMap?.085:.16;
        this.networkEdges.material.opacity=this.relationshipMap?(t.kind==='to-focus'?base*(1-p)+.025*p:.025*(1-p)+base*p):base*(t.kind==='to-focus'?1-p:p);
        this.networkSoftEdges.visible=this.networkEdges.visible;
        this.networkSoftEdges.material.opacity=this.relationshipMap?(t.kind==='to-focus'?.012*(1-p)+.010*p:.010*(1-p)+.012*p):.055*(t.kind==='to-focus'?1-p:p);
      }
      for(const edge of this.edgesGroup.children)if(edge.userData.relation&&edge.material){
        const original=this.previewKey?(edge.userData.relation.includes(this.previewKey)?1:.12):edge.userData.baseOpacity??edge.material.opacity;
        edge.material.opacity=original*(t.kind==='to-focus'?p:1-p);
      }
      if(time>=t.start+t.duration){this.viewTransition=null;this.rebuildRelations();this.dirty=true;}
    }
    const changed=this.controls.update();if(!this.dirty&&!changed&&!moving)return;if(this.globalAxis)this.globalAxis.visible=this.global&&!this.relationshipMap&&this.controls.getPolarAngle()>=.02;
    const cap=this.relationshipMap?Math.min(1,7/(5*Math.max(.001,this.globalScale()))):1;for(const shape of this.edgesGroup.children)if(shape.userData.limitScreenScale)shape.scale.setScalar(cap);
    const o=this.space.byKey.get(this.selected);this.halo.visible=this.canLocate(o)&&(!this.relationshipMap||o.kind==='node');if(this.halo.visible){this.halo.position.copy(V(o.position));this.halo.quaternion.copy(this.camera.quaternion);this.halo.scale.setScalar(this.relationshipMap?9.8/Math.max(.001,this.globalScale()):(o.kind==='theme'?18:o.kind==='pack'?10:this.global?11:6.5)*cap);}
    this.updateProjection();this.camera.updateMatrixWorld();this.paintObjects();this.renderer.render(this.scene,this.camera);this.updateFocusLinkLayer();
    // Pointer-independent overlays need not trigger a full DOM layout on every camera frame.
    // Keep WebGL movement and 3D relationship projections frequent; refresh labels/panels at
    // most about 10 times per second during animation, and always on the settled frame.
    const isMoving=!!this.tween||!!this.viewTransition;
    if(!isMoving||this.lastOverlayFrame===undefined||time-this.lastOverlayFrame>=95){
      this.exclusions=this.callbacks.onMove?.()||[];
      this.updateLabels();this.lastOverlayFrame=time;
    }else this.updateStructureLines();
    this.dirty=false;
  }
}
