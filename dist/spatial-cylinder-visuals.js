import {cylinderDomainRadiusBounds,cylinderSpineControls} from './spatial-cylinder.js';
// v54 only: decorative guides are not mathematical edges or pick targets.
// Reference labels have fixed pixel sizes. Clamp the near-edge annotation,
// never the actual curriculum ring or any mathematical node.
export function cylinderReferenceLabelPlacement(anchor,viewportWidth,viewportHeight,labelWidth){
 const width=Math.min(labelWidth,Math.max(1,viewportWidth-24));
 const x=Math.max(12,Math.min(viewportWidth-12-width,anchor.x));
 return {x,width,visible:anchor.visible&&anchor.x>=-32&&anchor.x<=viewportWidth+32&&anchor.y>=12&&anchor.y<=viewportHeight-12};
}
export function createCylinderVisuals(THREE,space,nodeList){
 const layout=space.cylinderLayout,group=new THREE.Group(),offset=space.cylinderOffset,scale=layout.diagnostics.radialScale;
 group.name='v54-cylinder-visuals';
 const V=a=>new THREE.Vector3(...a);
 const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.24,'rgba(255,255,255,.62)');g.addColorStop(.58,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
 const texture=new THREE.CanvasTexture(c);
 const glowMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:texture,color:0xffffff,transparent:true,opacity:.47,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}),nodeList.length);
 const diamond=new THREE.PlaneGeometry(1.42,1.42);diamond.rotateZ(Math.PI/4);
 const thinkingMesh=new THREE.InstancedMesh(diamond,new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,fog:false}),nodeList.length);
 glowMesh.frustumCulled=false;thinkingMesh.frustumCulled=false;glowMesh.renderOrder=1;group.add(glowMesh,thinkingMesh);
 const milestoneMesh=new THREE.InstancedMesh(new THREE.RingGeometry(.78,1,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.80,depthWrite:false,side:THREE.DoubleSide,fog:false}),nodeList.length);
 milestoneMesh.frustumCulled=false;milestoneMesh.renderOrder=2;group.add(milestoneMesh);
 const guides=new THREE.Group();guides.name='decorative-cylinder-guides';group.add(guides);
 const line=(points,color,opacity,dashed=false)=>{
   const geo=new THREE.BufferGeometry().setFromPoints(points),opts={color,transparent:true,opacity,depthWrite:false,fog:false};
   const m=new THREE.Line(geo,dashed?new THREE.LineDashedMaterial({...opts,dashSize:9,gapSize:8}):new THREE.LineBasicMaterial(opts));
   if(dashed)m.computeLineDistances();return m;
 };
 const arc=(r,y,a,b)=>Array.from({length:65},(_,i)=>{const t=a+(b-a)*i/64;return new THREE.Vector3(r*Math.cos(t),y-offset,r*Math.sin(t));});
 // Reference heights are real median displayed positions of the three
 // curriculum anchor cohorts, never grade boundaries or prerequisite edges.
 const core=layout.nodes.filter(n=>n.thinking),coreR=Math.max(...core.map(n=>n.r))+9;
 const coreTop=Math.max(...core.map(n=>n.y)),coreBottom=Math.min(...core.map(n=>n.y));
 const layerRefs=['stage-1','stage-2','stage-3'].map((id,i)=>{
   const ys=layout.nodes.filter(n=>!n.thinking&&n.anchorStage===id).map(n=>n.y).sort((a,b)=>a-b);
   const y=(ys[Math.floor((ys.length-1)/2)]+ys[Math.floor(ys.length/2)])/2;
   return {id,y,r:cylinderDomainRadiusBounds(y)[1]*scale+8,label:['1—2年级参考层','3—4年级参考层','5—6年级参考层'][i]};
 });
 for(const s of layout.sectors){
   const color=space.themes.get(s.themeId).color;
   const base=line(arc(cylinderDomainRadiusBounds(0)[1]*scale,0,s.start,s.end),color,.12,true);base.userData.layer='rings';guides.add(base);
   for(const ref of layerRefs){
     const m=line(arc(ref.r,ref.y,s.start,s.end),0xa0b2d5,.14,true);
     m.userData.stage=ref.id;m.userData.layer='rings';guides.add(m);
   }
 }
 const labels=[];
 for(const ref of layerRefs){
   const canvas=document.createElement('canvas');canvas.height=40;
   const context=canvas.getContext('2d');context.font='22px sans-serif';
   canvas.width=Math.ceil(context.measureText(ref.label).width)+8;
   context.font='22px sans-serif';context.textBaseline='middle';context.fillStyle='#b8c7e0';context.fillText(ref.label,4,20);
   const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
   const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,opacity:.56,depthWrite:false,depthTest:false,fog:false}));
   sprite.center.set(0,.5);sprite.renderOrder=3;guides.add(sprite);labels.push({ref,sprite,width:canvas.width/2});
 }
 const axis=line([new THREE.Vector3(0,coreBottom-offset,0),new THREE.Vector3(0,coreTop-offset,0)],0xc6b5ff,.36,true);axis.userData.layer='thinking';guides.add(axis);
 for(const y of [coreBottom,(coreBottom+coreTop)/2,coreTop]){const ring=line(arc(coreR,y,0,Math.PI*2),0xc6b5ff,.18,true);ring.userData.layer='thinking';guides.add(ring);}
 let seed=54017;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const stars=[];for(let i=0;i<420;i++){const a=random()*Math.PI*2,r=720+random()*1050,y=(random()-.5)*2200;stars.push(Math.cos(a)*r,y,Math.sin(a)*r);}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
 const starField=new THREE.Points(sg,new THREE.PointsMaterial({color:0x7283b1,size:1.35,sizeAttenuation:false,transparent:true,opacity:.22,depthWrite:false,fog:false}));starField.name='decorative-background-stars';group.add(starField);
 const records=[],seen=new Set(),source=new Map(space.atlas.edges.map(e=>[e.prerequisiteId+'>'+e.topicId,e])),accents=new THREE.Group();group.add(accents);
 // Round each real path segment using its neighboring real vertices.
 // Control Y coordinates are exactly 1/3 and 2/3 of each segment; no
 // extra connections or reversals are introduced. Curves meet source nodes.
 const pathCurves=new Map();
 // One tangent per real vertex gives a smooth continuation along a path.
 // Shared real edges keep their first geometry, and can branch only at their true endpoints.
 for(const sp of layout.spines){
   const points=sp.nodeIds.map(id=>space.nodes.get(id).position),controls=cylinderSpineControls(points);
   sp.edges.forEach((e,i)=>{
     const key=e.prerequisiteId+'>'+e.topicId;if(pathCurves.has(key))return;
     const {c1,c2}=controls[i];
     pathCurves.set(key,new THREE.CubicBezierCurve3(V(points[i]),V(c1),V(c2),V(points[i+1])));
   });
 }
 function addEdge(e,bridge){
   const key=e.prerequisiteId+'>'+e.topicId,original=source.get(key);
   if(!original||original.strength!==e.strength)throw Error('v54 visual edge not in source: '+key);
   if(seen.has(key))return;seen.add(key);
   const a=space.nodes.get(e.prerequisiteId),b=space.nodes.get(e.topicId),color=bridge?0xbba4ff:b.color,soft=e.strength==='soft',from=V(a.position),to=V(b.position);
   const curve=bridge?new THREE.LineCurve3(from,to):pathCurves.get(key)||new THREE.LineCurve3(from,to);
   const m=line(curve.getPoints(12),color,bridge?.21:.78,soft);m.name=bridge?'real-entry-bridge':'real-spine-edge';m.userData.edge={...e};accents.add(m);
   const pieces=[{mesh:m,opacity:bridge?.21:.78}];
   if(!soft){
     for(const [radius,opacity] of [[1.35,bridge?.10:.58],[3.5,bridge?.035:.16]]){
       const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,12,radius,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
       accents.add(tube);pieces.push({mesh:tube,opacity});
     }
   }records.push({edge:e,bridge,pieces});
 }
 for(const e of layout.bridges)addEdge(e,true);
 for(const s of layout.spines)for(const e of s.edges)addEdge(e,false);
 // Flow is on real hard edges; separate segments never draw synthetic bridges.
 const paths=layout.spines.flatMap((s,i)=>{
   const segments=s.edges.filter(e=>e.strength==='hard').map(e=>{const curve=pathCurves.get(e.prerequisiteId+'>'+e.topicId);return {curve,length:curve.getLength()};});
   return segments.length?[{segments,total:segments.reduce((t,e)=>t+e.length,0),color:space.themes.get(s.themeId).color,phase:i*.173}]:[];
 });
 const fg=new THREE.BufferGeometry(),fp=new Float32Array(paths.length*3),fc=new Float32Array(paths.length*3);
 paths.forEach((p,i)=>new THREE.Color(p.color).toArray(fc,i*3));fg.setAttribute('position',new THREE.BufferAttribute(fp,3));fg.setAttribute('color',new THREE.BufferAttribute(fc,3));
 const flow=new THREE.Points(fg,new THREE.PointsMaterial({map:texture,vertexColors:true,size:12,sizeAttenuation:false,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));flow.frustumCulled=false;flow.renderOrder=2;group.add(flow);
 function setEmphasis(scene){
   const entryPreview=scene.cylinderEntryPreview,focus=!!(entryPreview||scene.selected||scene.hoverMapKey||scene.hoverThemeId||scene.cylinderThemeFilter||scene.guideFocus),filtered=scene.gradeStageId!=='all',task=scene.taskWorkspaceActive;
   const options=scene.cylinderOptions;accents.visible=options.spines;milestoneMesh.visible=options.spines;
   const selected=space.byKey.get(scene.selected),theme=scene.hoverThemeId||(selected?.kind==='theme'?selected.id:!selected&&!scene.hoverMapKey?scene.cylinderThemeFilter:null);
   for(const rec of records){
     const e=rec.edge,hit=!filtered||scene.gradeStageIds.has(e.prerequisiteId)&&scene.gradeStageIds.has(e.topicId);
     const themeHit=!theme||space.nodes.get(e.prerequisiteId).themeId===theme&&space.nodes.get(e.topicId).themeId===theme;
     // Hover only the real principal path; all original geometry and the
     // user's independent spine visibility switch remain unchanged.
     const entryHit=entryPreview?.edgeKeys.has(e.prerequisiteId+'>'+e.topicId);
     const factor=(hit?1:.14)*(entryPreview?(entryHit?1:.09):focus?(theme?(themeHit?1:.14):.24):1)*(task?.54:1);
     for(const {mesh,opacity} of rec.pieces)mesh.material.opacity=opacity*factor;
   }
   const screenRight=scene.basis().right,right=screenRight.clone();right.y=0;right.normalize();
   const px=Math.max(.001,scene.globalScale()),showRefs=options.rings&&scene.networkView!=='map'&&!scene.selected&&!scene.guideFocus&&!task;
   for(const obj of guides.children){if(obj.userData.layer)obj.visible=options[obj.userData.layer];if(obj.userData.stage)obj.material.opacity=filtered?(obj.userData.stage===scene.gradeStageId?.32:.06):.18;}
   for(const {ref,sprite,width} of labels){
     sprite.position.copy(right).multiplyScalar(ref.r+8);sprite.position.y=ref.y-offset;
     const anchor=scene.project(sprite.position.toArray()),placed=cylinderReferenceLabelPlacement(anchor,scene.width,scene.height,width);
     sprite.visible=showRefs&&placed.visible;
     sprite.position.addScaledVector(screenRight,(placed.x-anchor.x)/px);
     sprite.scale.set(placed.width/px,20/px,1);
     sprite.material.opacity=filtered?(ref.id===scene.gradeStageId?.94:.30):.73;
   }
   guides.visible=!scene.guideFocus;flow.visible=options.spines&&!focus&&!filtered&&!task&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 }
 function move(time){if(!flow.visible)return;for(let i=0;i<paths.length;i++){
   const p=paths[i];let at=((time*.000115+p.phase)%1)*p.total,e=p.segments[0];
   for(const seg of p.segments){e=seg;if(at<=seg.length)break;at-=seg.length;}
   e.curve.getPointAt(Math.max(0,Math.min(1,at/Math.max(e.length,1e-6)))).toArray(fp,i*3);
 }fg.attributes.position.needsUpdate=true;}
 return {group,glowMesh,thinkingMesh,milestoneMesh,flow,accents,guides,setEmphasis,move,edgeCount:records.length,bridgeCount:records.filter(r=>r.bridge).length};
}
