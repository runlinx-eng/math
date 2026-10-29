import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSpace,relationsFor,parseView,LAYOUT_VERSION} from '../dist/spatial-model.js';
import {fresh,ensureActivity,addSupport,submit,saveNote,validate,evidenceSummary} from '../dist/exploration-core.js';
import {mergeLiveActivity} from '../dist/live-state.js';
import {placeLabel} from '../dist/spatial-labels.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const space=buildSpace(atlas),edgeKey=e=>`${e.prerequisiteId}:${e.topicId}`;

test('labels avoid open content and viewport edges, and hide when no readable space remains',()=>{
 const viewport={w:390,h:844},reserved={x:16,y:300,w:358,h:80};
 for(const x of [8,195,382]){
  const r=placeLabel({x,y:300,w:146,h:68,kind:'theme',viewport,occupied:[reserved]});
  assert.ok(r,'a nearby readable position exists');
  assert.ok(r.x>=16&&r.x+r.w<=374&&r.y>=105&&r.y+r.h<=744);
  assert.ok(r.y+r.h+8<=reserved.y||r.y>=reserved.y+reserved.h+8,'label does not cover content');
 }
 assert.equal(placeLabel({x:195,y:300,w:146,h:68,kind:'theme',viewport,occupied:[{x:0,y:0,w:390,h:844}]}),null);
});

test('every source object has a stable finite 3D home, independent of source row ordering',()=>{
 assert.equal(space.objects.length,615);assert.equal(space.byKey.size,615);
 const reordered={...atlas,nodes:[...atlas.nodes].reverse(),packs:[...atlas.packs].reverse().map(p=>({...p,nodeIds:[...p.nodeIds].reverse()})),edges:[...atlas.edges].reverse(),packLinks:[...atlas.packLinks].reverse()};
 const again=buildSpace(reordered);
 for(const o of space.objects){assert.deepEqual(o.position,again.byKey.get(o.key).position);assert.ok(o.position.every(Number.isFinite));if(o.parent)assert.ok(space.byKey.get(o.parent).children.includes(o.key));}
 assert.ok(new Set([...space.nodes.values()].map(o=>o.position[2].toFixed(3))).size>500,'depth is actual world geometry');
 assert.equal(space.nodes.size,587);assert.equal(space.packs.size,23);assert.equal(space.themes.size,5);
});
test('each source prerequisite appears at both endpoints with its original direction and reason',()=>{
 const found=new Map();
 for(const node of space.nodes.values())for(const l of relationsFor(space,node.key)){
  const e=l.edges[0];assert.equal(l.from,'node:'+e.prerequisiteId);assert.equal(l.to,'node:'+e.topicId);
  assert.ok(atlas.edges.includes(e));found.set(edgeKey(e),(found.get(edgeKey(e))||0)+1);
 }
 assert.equal(found.size,1223);for(const count of found.values())assert.equal(count,2);
});
test('aggregated cross-theme connections preserve all and only original cross-theme edges',()=>{
 const cross=atlas.edges.filter(e=>space.nodes.get(e.topicId).themeId!==space.nodes.get(e.prerequisiteId).themeId);
 assert.deepEqual(space.themeLinks.flatMap(l=>l.edges).map(edgeKey).sort(),cross.map(edgeKey).sort());
 for(const l of space.themeLinks)for(const e of l.edges){assert.equal(l.from,'theme:'+space.nodes.get(e.prerequisiteId).themeId);assert.equal(l.to,'theme:'+space.nodes.get(e.topicId).themeId);}
 for(const pack of space.packs.values())assert.equal(relationsFor(space,pack.key).length,atlas.packLinks.filter(l=>l.fromPack===pack.id||l.toPack===pack.id).length);
});
test('view restoration rejects broken geometry without touching learning data',()=>{
 const valid={version:LAYOUT_VERSION,position:[100,200,600],target:[0,0,0],selected:'node:mt_ndGqFPWyen',panels:[{id:'mt_ndGqFPWyen',anchor:[100,50,20],minimized:true,expanded:false,tab:'records'}],activePanel:'mt_ndGqFPWyen'};
 assert.deepEqual(parseView(valid,space),{...valid,showAllNodes:false,relationMode:'off',journeyOpen:false});
 assert.equal(parseView({...valid,relationMode:'unknown'},space).relationMode,'off');
 for(const raw of [null,{...valid,version:99},{...valid,position:[Infinity,0,0]},{...valid,target:valid.position},{...valid,target:[0,0]}])assert.equal(parseView(raw,space),null);
 const clean=parseView({...valid,selected:'missing',panels:[{id:'missing',anchor:[1,2,3]},...valid.panels]},space);
 assert.equal(clean.selected,null);assert.deepEqual(clean.panels,valid.panels);
});
test('two live activity surfaces retain both working copies even when they began from stale snapshots',()=>{
 const initial=fresh();ensureActivity(initial,'fair');ensureActivity(initial,'rename');
 const left=structuredClone(initial),right=structuredClone(initial);
 left.activities.fair.stage='explain';left.activities.fair.draft='纸带的解释';left.activities.fair.lab.cuts=[25,50,75];saveNote(left.activities.fair,'先平均分');
 let stored=mergeLiveActivity(left,initial,'fair');
 right.activities.rename.stage='explain';right.activities.rename.draft='两个终点重合';right.activities.rename.lab.n=3;right.activities.rename.lab.d=6;saveNote(right.activities.rename,'同一个量');
 stored=mergeLiveActivity(right,stored,'rename');
 left.activities.fair.draft+='，再数份数';stored=mergeLiveActivity(left,stored,'fair');
 assert.equal(stored.activities.fair.draft,'纸带的解释，再数份数');assert.equal(stored.activities.rename.draft,'两个终点重合');
 assert.deepEqual(stored.activities.fair.lab.cuts,[25,50,75]);assert.equal(stored.activities.rename.lab.d,6);
 assert.equal(stored.activities.fair.notes.length,1);assert.equal(stored.activities.rename.notes.length,1);
 assert.deepEqual(validate(stored,atlas),stored);
});
test('live persistence cannot resurrect removed bookmarks or erase another surface hint history',()=>{
 const stale=fresh(),a=ensureActivity(stale,'fair');stale.bookmarks=['mt_ndGqFPWyen'];
 a.stage='construct';a.models['construct:0']={cuts:[25,50,75],selected:[0,1,2]};submit(a);
 const latest=structuredClone(stale);latest.bookmarks=[];addSupport(latest.activities.fair);
 const out=mergeLiveActivity(stale,latest,'fair');
 assert.deepEqual(out.bookmarks,[]);assert.equal(out.activities.fair.evidence['construct:0'].support,true);
 assert.equal(evidenceSummary(out.activities.fair).kinds[0].status,'supported');
 assert.equal(out.activities.fair.evidence['construct:0'].attempts.length,1);
});
