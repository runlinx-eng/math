import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCylinderLayout,cylinderSpineControls,cylinderDomainRadiusBounds} from '../dist/spatial-cylinder.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const grade=JSON.parse(fs.readFileSync(new URL('../dist/data/grade-panorama-lite.json',import.meta.url)));

function verifyCylinderLayout(atlas,grade,build,assert){
  const before=JSON.stringify([atlas,grade]),out=build(atlas,grade);
  const near=(a,b)=>Math.abs(a-b)<1e-6;
  const ids=new Map(out.nodes.map(n=>[n.id,n])),src=new Map(atlas.nodes.map(n=>[n.id,n]));
  const edgeKey=e=>[e.prerequisiteId,e.topicId,e.strength].join("|");
  const sourceEdges=new Set(atlas.edges.map(edgeKey));
  assert(out.version===54&&out.nodes.length===587&&ids.size===587,"587 unique positions");
  assert(atlas.nodes.every(n=>ids.has(n.id)&&ids.get(n.id).themeId===n.themeId&&ids.get(n.id).packId===n.packId),"source IDs and memberships");
  assert(out.nodes.filter(n=>n.thinking).length===50,"50 thinking nodes");
  assert(out.diagnostics.edgeCount===1223&&out.diagnostics.roots.length===19&&out.diagnostics.maxDepth===27,"source topology");
  assert(out.diagnostics.adjacentCrossEdges===92&&out.themeOrder.join(",")==="numbers,measure,data,space,patterns","12-order optimum");
  assert(near(out.sectors.reduce((s,x)=>s+x.widthDeg+x.corridorDeg,0),360),"angle closure");
  assert(out.sectors.every(s=>s.widthDeg>=36-1e-6&&s.widthDeg<=140+1e-6&&s.corridorDeg>0),"sector bounds");
  for(const p of out.nodes){
    assert(p.position.every(Number.isFinite)&&p.r>0,"finite coordinates");
    if(!p.thinking){
      const l=out.lanes.find(l=>l.id===p.laneId);
      assert(l&&p.theta>=l.start&&p.theta<=l.end&&l.themeId===p.themeId,"lane bounds");
    }else assert(p.anchorStage===null,"thinking no grade");
  }
  assert(Math.max(...out.nodes.filter(n=>n.thinking).map(n=>n.r))<Math.min(...out.nodes.filter(n=>!n.thinking).map(n=>n.r)),"axis isolation");
  for(const e of atlas.edges)assert(ids.get(e.topicId).y-ids.get(e.prerequisiteId).y>=(e.strength==="hard"?20:12)-1e-6,"all-edge monotonicity "+edgeKey(e));
  assert(out.diagnostics.unanchoredIds.length===61&&out.diagnostics.unanchoredIds.includes(grade.specialRisks.unresolvedNode.id),"61 includes unresolved");
  for(const id of out.diagnostics.unanchoredIds){
    const p=ids.get(id),pre=atlas.edges.filter(e=>e.topicId===id);
    assert(p.anchorStage===null&&pre.length>0&&near(p.initialY,Math.max(...pre.map(e=>ids.get(e.prerequisiteId).initialY+(e.strength==="hard"?20:12)))),"unanchored initial Y "+id);
  }
  const numbers=out.spines.filter(s=>s.themeId==="numbers");
  assert(numbers.length>=2&&numbers.length<=3&&new Set(numbers.map(s=>s.rootId)).size===numbers.length,"2–3 actual number spines");
  for(const s of out.spines){
    assert(s.edges.length===s.nodeIds.length-1&&s.edges.length>0,"nonempty directed spine");
    assert(s.edges.every((e,i)=>sourceEdges.has(edgeKey(e))&&e.prerequisiteId===s.nodeIds[i]&&e.topicId===s.nodeIds[i+1]),"real spine edges");
    assert(near(s.weightedScore,s.edges.reduce((v,e)=>v+(e.strength==="hard"?1:.35),0)),"fixed spine weights");
    assert(s.coverage===s.newCoverage+s.overlap,"coverage accounting");
    const points=s.nodeIds.map(id=>ids.get(id).position),controls=cylinderSpineControls(points);
    assert(controls.length===s.edges.length,"one curve per actual path edge");
    for(let i=0;i<controls.length;i++){
      const a=points[i],b=points[i+1],{c1,c2}=controls[i],dy=b[1]-a[1];
      assert(c1.every(Number.isFinite)&&c2.every(Number.isFinite),"finite cubic controls");
      assert(near(c1[1],a[1]+dy/3)&&near(c2[1],a[1]+2*dy/3),"strictly monotone Y throughout curve");
      if(i){
        const previous=controls[i-1].c2,prevDy=a[1]-points[i-1][1];
        for(const k of [0,2])assert(near((a[k]-previous[k])/prevDy,(c1[k]-a[k])/dy),"continuous tangent at actual path vertex");
      }
    }
  }
  assert(out.bridges.length>=3&&out.bridges.length<=5&&new Set(out.bridges.map(e=>e.topicId)).size===out.bridges.length,"few distinct rootless entrances");
  for(const e of out.bridges){
    assert(sourceEdges.has(edgeKey(e))&&src.get(e.topicId).themeId==="patterns"&&src.get(e.prerequisiteId).themeId!=="patterns"&&src.get(e.prerequisiteId).domainId!=="thinking","real cross-theme bridge");
    assert(!atlas.edges.some(x=>x.topicId===e.topicId&&src.get(x.prerequisiteId).themeId==="patterns"&&src.get(x.prerequisiteId).domainId!=="thinking"),"induced root target");
  }
  const height=Math.max(...out.nodes.map(n=>n.y))-Math.min(...out.nodes.map(n=>n.y));
  const diameter=2*Math.max(...out.nodes.map(n=>n.r));
  assert(height/diameter>1.2&&height/diameter<1.6,"upright cylindrical proportions");
  const horizontal=out.spines.flatMap(s=>s.edges).reduce((sum,e)=>{const a=ids.get(e.prerequisiteId),b=ids.get(e.topicId);return sum+Math.hypot(a.position[0]-b.position[0],a.position[2]-b.position[2]);},0);
  assert(horizontal<1200,"real spines follow continuous narrow backbones");
  const domain=out.nodes.filter(n=>!n.thinking),percentileR=nodes=>{const radii=nodes.map(n=>n.r).sort((a,b)=>a-b);return radii[Math.floor(radii.length*.9)];};
  const lower=percentileR(domain.filter(n=>n.y<height*.33)),middle=percentileR(domain.filter(n=>n.y>=height*.33&&n.y<=height*.66)),upper=percentileR(domain.filter(n=>n.y>height*.66));
  assert(lower<middle&&middle<upper&&upper>1.60*lower,"three bands progressively expand with visibly narrower base");
  assert(cylinderDomainRadiusBounds(0)[1]<cylinderDomainRadiusBounds(height)[1],"reference ring envelope expands with actual domain");
  assert(out.diagnostics.collisions===0,"zero unresolved collisions");
  for(let i=0;i<out.nodes.length;i++)for(let j=i+1;j<out.nodes.length;j++){
    const a=out.nodes[i],b=out.nodes[j],distance=Math.hypot(...a.position.map((x,k)=>x-b.position[k]));
    assert(distance>=a.nodeRadius+b.nodeRadius+7-1e-6,"independent pair spacing "+a.id+" "+b.id);
  }
  assert(before===JSON.stringify([atlas,grade]),"input unchanged");
  const reorder={...atlas,nodes:[...atlas.nodes].reverse(),themes:[...atlas.themes].reverse(),edges:[...atlas.edges].reverse(),packs:[...atlas.packs].reverse().map(p=>({...p,nodeIds:[...p.nodeIds].reverse()}))};
  const reverseGrade={...grade,nodeMappings:[...grade.nodeMappings].reverse()};
  assert(JSON.stringify(out)===JSON.stringify(build(reorder,reverseGrade)),"deterministic after input reversal");
  return out;
}

test('v54 real source geometry preserves IDs, DAG, sector bounds, spines, bridges, spacing and deterministic order',()=>{
 verifyCylinderLayout(atlas,grade,buildCylinderLayout,(yes,label)=>assert.ok(yes,label));
});

test('v54 rejects duplicate, dangling and cyclic source edges and mismatched curriculum',()=>{
 const e=atlas.edges[0];
 assert.throws(()=>buildCylinderLayout({...atlas,edges:[...atlas.edges,e]},grade),/duplicate source edges/);
 assert.throws(()=>buildCylinderLayout({...atlas,edges:[...atlas.edges,{...e,topicId:'not-a-node'}]},grade),/invalid source edge/);
 assert.throws(()=>buildCylinderLayout({...atlas,edges:[...atlas.edges,{...e,topicId:e.prerequisiteId}]},grade),/cyclic/);
 assert.throws(()=>buildCylinderLayout(atlas,{...grade,nodeMappings:grade.nodeMappings.slice(1)}),/curriculum IDs/);
});
