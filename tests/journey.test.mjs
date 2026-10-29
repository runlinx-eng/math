import {topicIds} from '../dist/learning/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ROUTE_ID,ROUTE_STEPS,routeLinks,freshJourney,actOnJourney} from '../dist/journey-model.js';
import {fresh,validate,backup,parseBackup,merge,nodeState,ensureActivity,addSupport,completionSummary} from '../dist/exploration-core.js';
import {mergeLiveActivity} from '../dist/live-state.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const setup=()=>{const s=fresh();s.journeys[ROUTE_ID]=freshJourney();return s;};
const act=(s,a,v)=>actOnJourney(s.journeys[ROUTE_ID],a,v);
test('suggested route links use actual directed source edges, including the distinct decimal preview node',()=>{
 const edges=routeLinks(atlas);assert.equal(edges.length,2);
 assert.equal(edges[0].strength,'hard');assert.equal(edges[1].strength,'soft');
 assert.deepEqual(edges.map(e=>[e.prerequisiteId,e.topicId]),[[ROUTE_STEPS[0].id,ROUTE_STEPS[1].id],[ROUTE_STEPS[1].id,ROUTE_STEPS[2].id]]);
 assert.notEqual(ROUTE_STEPS[2].id,'mt_TqDq6jyOmL');
});
test('each repartition preserves the selected amount, including non-half selections',()=>{
 const s=setup();act(s,'more');act(s,'split');assert.equal(s.journeys.portions.taken/s.journeys.portions.parts,1);
 act(s,'less');const q=s.journeys.portions.taken/s.journeys.portions.parts;act(s,'split');assert.equal(s.journeys.portions.taken/s.journeys.portions.parts,q);
 act(s,'split');act(s,'split');assert.equal(s.journeys.portions.parts,16);assert.equal(s.journeys.portions.observations.length,3);
});
test('navigation, a preview, and a cup check alone cannot create completion or independent evidence',()=>{
 const s=setup();act(s,'visit',3);act(s,'pour-half');assert.equal(nodeState(s,ROUTE_STEPS[2].id).progress,'exploring');
 act(s,'visit',2);act(s,'summary');assert.equal(s.journeys.portions.phase,'play');act(s,'cup',4);act(s,'check');act(s,'summary');assert.equal(s.journeys.portions.finishedAt,null);assert.equal(nodeState(s,ROUTE_STEPS[1].id).evidence,'none');
});
test('overall completion counts available tasks once; old preview browsing grants no completion',()=>{
 const s=setup();act(s,'visit',1);act(s,'visit',3);act(s,'pour-half');
 assert.deepEqual(completionSummary(s),{done:0,total:topicIds.length});
 const ids=[...ROUTE_STEPS.map(x=>x.id),ROUTE_STEPS[1].id,'mt_unmade'];
 assert.deepEqual(completionSummary(s,ids),{done:0,total:3});
 act(s,'visit',2);act(s,'split');act(s,'check');act(s,'summary');ensureActivity(s,'rename');
 assert.deepEqual(completionSummary(s),{done:1,total:topicIds.length});
 assert.deepEqual(completionSummary(s,ids),{done:1,total:3});
});
test('the fair task completes only after equal division and confirmation, and survives backup merging',()=>{
 const s=setup();act(s,'visit',1);act(s,'finish-fair');assert.equal(s.journeys.portions.fairFinishedAt,null);
 act(s,'cut',50);assert.equal(nodeState(s,ROUTE_STEPS[0].id).progress,'exploring');
 act(s,'finish-fair');const stamp=s.journeys.portions.fairFinishedAt;assert.ok(stamp);
 act(s,'cut',35);act(s,'visit',2);const restored=parseBackup(JSON.stringify(backup(s)),atlas);
 const old=setup();delete old.journeys.portions.fairFinishedAt;
 const combined=validate(merge(validate(old,atlas),restored),atlas);
 assert.equal(combined.journeys.portions.fairFinishedAt,stamp);
 assert.equal(nodeState(combined,ROUTE_STEPS[0].id).progress,'completed');
 assert.equal(nodeState(combined,ROUTE_STEPS[0].id).evidence,'none');
 assert.deepEqual(completionSummary(combined),{done:1,total:topicIds.length});
});
test('first error survives later success, reload, export and repeated merge; a guided sample never grants independent evidence',()=>{
 const s=setup();act(s,'visit',2);act(s,'split');act(s,'cup',5);act(s,'check');const first=structuredClone(s.journeys.portions.attempts[0]);act(s,'cup',4);act(s,'check');act(s,'summary');
 const loaded=parseBackup(JSON.stringify(backup(s)),atlas),again=validate(merge(loaded,s),atlas);
 assert.deepEqual(again.journeys.portions.attempts[0],first);assert.equal(again.journeys.portions.attempts.length,2);assert.equal(again.journeys.portions.attempts[1].exposed,true);
 assert.equal(nodeState(again,ROUTE_STEPS[1].id).progress,'completed');assert.equal(nodeState(again,ROUTE_STEPS[1].id).evidence,'none');
});
test('stale legacy activity writes retain route records, working state, draft and first attempt',()=>{
 const local=fresh(),a=ensureActivity(local,'fair');a.stage='construct';addSupport(a);
 const current=structuredClone(local);current.journeys.portions=freshJourney();act(current,'visit',2);act(current,'split');act(current,'cup',7);act(current,'check');act(current,'draft','还没写完的解释');
 const out=validate(mergeLiveActivity(local,current,'fair'),atlas);
 assert.deepEqual(out.journeys,current.journeys);assert.ok(out.activities.fair.evidence['construct:0'].support);assert.equal(out.journeyContinuation,null);
});
test('v2 backups without the new optional route fields remain valid and invalid route data fail atomically',()=>{
 const old=fresh();delete old.journeys;delete old.journeyContinuation;assert.deepEqual(validate(old,atlas).journeys,{});
 const s=setup();const raw=JSON.stringify(s);s.journeys.portions.cup=99;assert.throws(()=>validate(s,atlas));assert.equal(s.journeys.portions.cup,99);assert.equal(JSON.parse(raw).journeys.portions.cup,0);
 s.journeys.portions.cup=0;s.journeys.portions.finishedAt=new Date().toISOString();assert.throws(()=>validate(s,atlas));
});
