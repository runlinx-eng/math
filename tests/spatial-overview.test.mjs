import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRelationshipSpace,overviewShellCandidates} from '../dist/spatial-relationship.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const pos=s=>s.objects.map(o=>[o.key,...o.position]);
test('all five theme anchors use real fixed v53 node coordinates',()=>{
 const s=buildRelationshipSpace(atlas),initial=pos(s);
 assert.equal(s.themes.size,5);assert.equal(s.relationshipIds.size,537);assert.equal(s.nodes.size,587);
 for(const theme of s.themes.values()){
  const nodes=[...s.nodes.values()].filter(n=>s.relationshipIds.has(n.id)&&n.themeId===theme.id);
  assert.ok(nodes.length>0);
  for(let i=0;i<3;i++)assert.ok(Math.abs(theme.position[i]-nodes.reduce((a,n)=>a+n.position[i],0)/nodes.length)<1e-7);
 }
 overviewShellCandidates(s);assert.deepEqual(pos(s),initial);
});
test('optional shells use only genuine, compact and little-mixed knowledge groups',()=>{
 const s=buildRelationshipSpace(atlas),shells=overviewShellCandidates(s),sq=(a,b)=>a.reduce((v,x,i)=>v+(x-b[i])**2,0);
 assert.equal(new Set(shells.map(g=>g.id)).size,shells.length);
 for(const g of shells){
  const p=s.packs.get(g.id);assert.ok(p);assert.equal(g.themeId,p.themeId);
  const members=p.nodeIds.filter(id=>s.relationshipIds.has(id)).map(id=>s.nodes.get(id));
  assert.equal(g.memberCount,members.length);assert.ok(members.length>=6&&g.radius<=95);
  assert.ok(g.outsiders<=Math.max(2,Math.floor(members.length*.15)));
  assert.ok(members.every(n=>sq(n.position,g.center)<g.radius*g.radius));
 }
});
test('reject spatially scattered or heavily intermixed groups',()=>{
 const makeSpace=(domain,groups)=>({relationshipIds:new Set(domain.map(n=>n.id)),nodes:new Map(domain.map(n=>[n.id,n])),packs:new Map(groups.map(p=>[p.id,p]))});
 const mixed=[...Array.from({length:6},(_,i)=>({id:'a'+i,packId:'a',position:[i,0,0]})),...Array.from({length:8},(_,i)=>({id:'b'+i,packId:'b',position:[i+.3,.2,0]}))];
 const pack=(id,nodes)=>({id,themeId:id,nodeIds:nodes.filter(n=>n.packId===id).map(n=>n.id)});
 assert.equal(overviewShellCandidates(makeSpace(mixed,[pack('a',mixed)])).length,0);
 const spread=Array.from({length:6},(_,i)=>({id:'s'+i,packId:'s',position:[65*i,0,0]}));
 assert.equal(overviewShellCandidates(makeSpace(spread,[pack('s',spread)])).length,0);
 const compact=Array.from({length:6},(_,i)=>({id:'c'+i,packId:'c',position:[2*i,0,0]}));
 assert.equal(overviewShellCandidates(makeSpace(compact,[pack('c',compact)])).length,1);
});
