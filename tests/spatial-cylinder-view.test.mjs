import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCylinderSpace,CYLINDER_VERSION,CYLINDER_VIEW_KEY} from '../dist/spatial-cylinder-view.js';
import {buildRelationshipSpace,RELATIONSHIP_VERSION} from '../dist/spatial-relationship.js';
import {restoreNetworkCoordinates} from '../dist/spatial-global.js';
import {parseView,LAYOUT_VERSION,cylinderObservation,cylinderSessionPresentation} from '../dist/spatial-model.js';
import {cylinderReferenceLabelPlacement,placeCylinderReferenceCaption} from '../dist/spatial-cylinder-visuals.js';
import {placePointLabel,overlaps} from '../dist/spatial-labels.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const grade=JSON.parse(fs.readFileSync(new URL('../dist/data/grade-panorama-lite.json',import.meta.url)));
test('v54 opt-in uses all real nodes and stable positions, preserving v53 and source',()=>{
 const source=JSON.stringify(atlas),old=buildRelationshipSpace(atlas),before=JSON.stringify([...old.relationshipPositions]),world=buildCylinderSpace(atlas,grade);
 assert.equal(RELATIONSHIP_VERSION,53);assert.equal(CYLINDER_VERSION,54);assert.equal(CYLINDER_VIEW_KEY,'math-explorer-network-cylinder-view-v1');
 assert.deepEqual(world.cylinderDomainCounts,{numbers:274,measure:88,data:65,space:76,patterns:34});assert.equal(world.cylinderThinkingCount,50);
 assert.ok(world.cylinderMilestoneIds.size>=5&&world.cylinderMilestoneIds.size<=10);
 assert.ok([...world.cylinderMilestoneIds].every(id=>world.cylinderSpineIds.has(id)&&world.relationshipIds.has(id)));
 assert.equal(old.relationshipIds.size,537);assert.equal(world.relationshipIds.size,587);assert.equal(world.networkVersion,54);assert.equal(JSON.stringify(atlas),source);
 assert.equal(world.cylinderOriginPosition[0],0);assert.equal(world.cylinderOriginPosition[2],0);
 assert.ok(world.cylinderOriginPosition[1]<Math.min(...[...world.nodes.values()].map(n=>n.position[1])));
 assert.ok(world.objects.every(o=>o.position!==world.cylinderOriginPosition));
 assert.equal(world.relationshipPositions.size,world.objects.length);assert.equal(old.cylinderOriginPosition,undefined);
 assert.equal(JSON.stringify([...buildRelationshipSpace(atlas).relationshipPositions]),before);
 for(const e of atlas.edges)assert.ok(world.nodes.get(e.topicId).position[1]>world.nodes.get(e.prerequisiteId).position[1]);
 const position=[...world.nodes.values()].map(n=>n.position);
 restoreNetworkCoordinates(world,54,'map',null);restoreNetworkCoordinates(world,54,'relations','node:'+atlas.nodes[0].id);
 assert.ok([...world.nodes.values()].every((n,i)=>n.position===position[i]));
 const raw={version:LAYOUT_VERSION,networkVersion:54,networkView:'oblique',position:[100,150,1000],target:[0,0,0],selected:'node:'+atlas.nodes[0].id,panels:[],cameraZoom:1,edgeDisplay:'outline',traceMode:'direct',overviewFilterVersion:1,structureMode:'off'};
 assert.equal(parseView(raw,world).networkVersion,54);assert.equal(parseView(raw,world).structureMode,'off');assert.equal(parseView(raw,old).networkVersion,undefined);
});

test('v54 reference text fits at either screen edge without changing source coordinates',()=>{
 const nearRight={x:920,y:500,visible:true},p=cylinderReferenceLabelPlacement(nearRight,934,1348,104);
 assert.equal(p.visible,true);assert.ok(p.x>=12&&p.x+p.width<=934-12);assert.equal(nearRight.x,920);
 assert.equal(cylinderReferenceLabelPlacement({x:3,y:500,visible:true},934,1348,104).x,12);
 assert.equal(cylinderReferenceLabelPlacement({x:1000,y:500,visible:true},934,1348,104).visible,false);
 assert.equal(cylinderReferenceLabelPlacement({x:500,y:500,visible:true},1920,1080,104).x,500);
});

test('v54 observation switches are independent booleans and orbit is opt-in on every visit',()=>{
 assert.deepEqual(cylinderObservation(),{spines:true,thinking:true,crossEdges:false,rings:true,orbit:false});
 assert.deepEqual(cylinderObservation({spines:false,thinking:'false',crossEdges:true,rings:false,orbit:true}),{spines:false,thinking:true,crossEdges:true,rings:false,orbit:false});
});

test('v54 point annotations stay beside their anchor, avoid markers and suppress collisions',()=>{
 const viewport={w:1000,h:1200,top:100,bottom:80},point={x:450,y:500,w:110,h:28,viewport};
 const marker={x:440,y:490,w:20,h:20};
 const right=placePointLabel({...point,markers:[marker]});
 assert.deepEqual(right,{x:464,y:486,w:110,h:28});assert.equal(overlaps(right,marker,2),false);
 const left=placePointLabel({...point,markers:[marker],occupied:[right]});
 assert.ok(left.x+left.w<point.x&&!overlaps(left,marker,2));
 assert.equal(placePointLabel({...point,occupied:[{x:0,y:0,w:1000,h:1200}]}),null);
 const edge=placePointLabel({...point,x:980});
 assert.ok(edge.x>=12&&edge.x+edge.w<=988);
 assert.equal(point.x,450);assert.equal(point.y,500);
});

test("Mac stage 01: learning",()=>assert.deepEqual(Object.values(cylinderSessionPresentation({"cylinder":true,"surface":"learn","journeyOpen":true,"sessionId":"A"})),[true,false,true,false,true]));
test("Mac stage 01: parked",()=>assert.deepEqual(Object.values(cylinderSessionPresentation({"cylinder":true,"surface":"explore","journeyOpen":true,"journeySuspended":true,"sessionId":"A"})),[true,true,false,true,true]));
test("Mac stage 01: parked guide",()=>assert.deepEqual(Object.values(cylinderSessionPresentation({"cylinder":true,"surface":"explore","journeyOpen":true,"journeySuspended":true,"sessionId":"A","guideSuspended":true})),[true,true,false,true,true]));
test("Mac stage 01: trail",()=>assert.deepEqual(Object.values(cylinderSessionPresentation({"cylinder":true,"surface":"trail","journeyOpen":true,"journeySuspended":true,"sessionId":"A"})),[true,true,false,false,false]));
test("Mac stage 01: v53",()=>assert.deepEqual(Object.values(cylinderSessionPresentation({"cylinder":false,"surface":"explore","journeyOpen":true,"journeySuspended":true,"sessionId":"A"})),[false,false,false,false,false]));
test("Mac stage 01: empty",()=>assert.deepEqual(Object.values(cylinderSessionPresentation({"cylinder":true,"surface":"explore"})),[false,false,false,true,true]));
test("Mac stage 01: legacy no session",()=>assert.deepEqual(Object.values(cylinderSessionPresentation({"cylinder":true,"surface":"explore","journeyOpen":true,"journeySuspended":true})),[false,false,false,false,false]));
test("Mac stage 01: guide in parked",()=>assert.deepEqual(Object.values(cylinderSessionPresentation({"cylinder":true,"surface":"explore","journeyOpen":true,"journeySuspended":true,"sessionId":"A","guideVisible":true})),[true,true,false,false,false]));

test('Mac stage 03: five domain entry paths retain actual source roots and growth entrances',()=>{
 const world=buildCylinderSpace(atlas,grade),primary=world.cylinderLayout.spines.filter(s=>s.index===0);
 assert.equal(primary.length,5);
 assert.equal(new Set(primary.map(s=>s.themeId)).size,5);
 const source=new Map(atlas.edges.map(e=>[e.prerequisiteId+'>'+e.topicId,e.strength]));
 for(const s of primary){
  const incoming=atlas.edges.filter(e=>e.topicId===s.rootId);
  assert.equal(s.isGlobalRoot,incoming.length===0);
  assert.equal(world.cylinderRoots.has(s.rootId),s.isGlobalRoot);
  assert.equal(s.nodeIds[0],s.rootId);
  assert.equal(world.nodes.get(s.rootId).themeId,s.themeId);
  assert.equal(s.edges.length,s.nodeIds.length-1);
  s.edges.forEach((e,i)=>{
   assert.equal(e.prerequisiteId,s.nodeIds[i]);
   assert.equal(e.topicId,s.nodeIds[i+1]);
   assert.equal(source.get(e.prerequisiteId+'>'+e.topicId),e.strength);
  });
 }
 assert.ok(primary.some(s=>s.isGlobalRoot)&&primary.some(s=>!s.isGlobalRoot));
});

test('Mac stage 04: optional stage caption yields to real labels and overlays',()=>{
 const a={x:600,y:400,visible:true},w=104;
 const placed=placeCylinderReferenceCaption(a,1280,720,w);
 assert.deepEqual(placed,{x:600,y:390,w,h:20});
 const blocker={x:590,y:383,w:130,h:35};
 const next=placeCylinderReferenceCaption(a,1280,720,w,[blocker]);
 assert.ok(next&&!overlaps(next,blocker,5));
 assert.equal(placeCylinderReferenceCaption(a,1280,720,w,[{x:0,y:0,w:1280,h:720}]),null);
 assert.equal(placeCylinderReferenceCaption({...a,visible:false},1280,720,w),null);
 assert.equal(placeCylinderReferenceCaption({x:600,y:20,visible:true},1280,720,w),null);
 const edge=placeCylinderReferenceCaption({x:990,y:500,visible:true},1000,1200,w);
 assert.ok(edge.x>=12&&edge.x+edge.w<=988);
 assert.deepEqual(a,{x:600,y:400,visible:true});
});
