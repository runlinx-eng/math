import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVITIES,task,inspect,modelIsValid} from '../dist/exploration-content.js';
import {fresh,ensureActivity,submit,addSupport,saveObservation,saveNote,evidenceSummary,nodeState,validate,backup,parseBackup,merge,migrateLegacy} from '../dist/exploration-core.js';
import {freshState,createSession,recordAnswer,finishSession} from '../dist/core.js';
import {questions} from '../dist/lessons.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const original=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url)));
const ids=atlas.nodes.map(n=>n.id),seq=n=>Array.from({length:n},(_,i)=>i);
// Independent mathematical examples, including non-adjacent representations.
const examples={
 fair:[[{cuts:[25,50,75],selected:[0,2,3]},{selected:[0,1,2,4,5,6,8,9,11]}],[{cuts:[20,40,60,80],selected:[1,4]},{selected:[0,2,4,6,8,10]}]],
 rename:[[{rows:[{n:2,d:4},{n:3,d:6},{n:4,d:8}]},{mark:6}],[{rows:[{n:4,d:6},{n:6,d:9},{n:8,d:12}]},{mark:4}]],
 decimal:[[{selected:seq(35)},{hundredths:6,tenths:60}],[{selected:seq(42)},{hundredths:9,tenths:90}]],
};
function commit(a,kind,value){a.stage=kind;a.models[`${kind}:${a.variant}`]=structuredClone(value);return submit(a);}
function complete(id,variant=0){const s=fresh(),a=ensureActivity(s,id);a.variant=variant;for(const[k,i]of [['construct',0],['transfer',1]])commit(a,k,examples[id][variant][i]);return s;}
function legacy(){const s=freshState();s.active=createSession('meaning');s.active.stage='check';questions('meaning','check').forEach((q,i)=>{s.active.index=i;recordAnswer(s.active,q.type==='shade'?seq(q.n):q.answer);});finishSession(s,s.active);s.active=createSession('decimal');s.paused.equivalent=createSession('equivalent');s.bookmarks=[ACTIVITIES.fair.topicId];return s;}

test('every original node and relation survives classification; pack arrows cite actual edges',()=>{
 assert.equal(atlas.nodes.length,587);assert.equal(atlas.themes.length,5);assert.equal(atlas.packs.length,23);
 const packed=atlas.packs.flatMap(p=>p.nodeIds);assert.equal(packed.length,587);assert.equal(new Set(packed).size,587);
 assert.deepEqual(atlas.nodes.map(({packId,themeId,...n})=>n),original.nodes);assert.deepEqual(atlas.edges,original.edges);assert.deepEqual(atlas.externalEdges,original.externalEdges);
 for(const n of atlas.nodes){const p=atlas.packs.find(p=>p.id===n.packId);assert.ok(p.nodeIds.includes(n.id));assert.equal(n.themeId,p.themeId);}
 const edgeKey=e=>`${e.prerequisiteId}:${e.topicId}`;
 const byId=new Map(atlas.nodes.map(n=>[n.id,n]));
 const cross=atlas.edges.filter(e=>byId.get(e.prerequisiteId).packId!==byId.get(e.topicId).packId);
 assert.deepEqual(atlas.packLinks.flatMap(l=>l.edges).map(edgeKey).sort(),cross.map(edgeKey).sort());
 for(const l of atlas.packLinks)for(const e of l.edges){assert.equal(byId.get(e.prerequisiteId).packId,l.fromPack);assert.equal(byId.get(e.topicId).packId,l.toPack);}
 assert.equal(Object.keys(atlas.research).length,502);assert.equal(atlas.adaptation.missingResearchIds.length,85);
 assert.deepEqual(atlas.packs.flatMap(p=>p.activityIds).sort(),Object.keys(ACTIVITIES).sort());
});
test('both cases accept mathematically equivalent constructions across all six representations',()=>{
 for(const[id,variants]of Object.entries(examples))for(const[v,models]of variants.entries())for(const[k,i]of [['construct',0],['transfer',1]]){const t=task(id,k,v);assert.ok(modelIsValid(t,models[i]),`${id}:${k}:${v}`);assert.ok(inspect(t,models[i]).correct,`${id}:${k}:${v}`);}
 assert.ok(inspect(task('decimal','construct'),{selected:seq(35).map(i=>99-i)}).correct,'shape of the shaded area is irrelevant to its measure');
});
test('diagnostics distinguish unequal parts, whole/set, additive equivalence, and decimal place value',()=>{
 const failures=[['fair','construct',{cuts:[15,55,85],selected:[0,1,2]},'unequal'],['fair','transfer',{selected:[0,1,2]},'set'],['rename','construct',{rows:[{n:2,d:3},{n:3,d:6},{n:4,d:8}]},'additive'],['rename','construct',{rows:[{n:2,d:4},{n:2,d:4},{n:4,d:8}]},'family'],['rename','transfer',{mark:3},'line'],['decimal','construct',{selected:[0,1,2,3,4]},'grid'],['decimal','transfer',{hundredths:60,tenths:6},'place']];
 for(const[id,k,m,code]of failures){const result=inspect(task(id,k),m);assert.equal(result.correct,false);assert.equal(result.code,code);assert.ok(result.feedback.length>15);}
});
test('browsing, free manipulation and written explanations do not create independent evidence',()=>{
 const s=fresh(),topic=ACTIVITIES.fair.topicId;s.visited[topic]=new Date().toISOString();assert.equal(nodeState(s,topic).progress,'visited');
 const a=ensureActivity(s,'fair');a.lab.changed=true;a.lab.cuts=[25,50,75];saveObservation(a);saveNote(a,'每一份都一样大。');
 assert.equal(evidenceSummary(a).demonstrated,false);assert.equal(evidenceSummary(a).completed,false);assert.equal(evidenceSummary(a).explanation,'pending');
 assert.equal(nodeState(s,topic).progress,'exploring');assert.equal(nodeState(s,atlas.packs.find(p=>p.id==='same-amount').nodeIds.find(id=>!Object.values(ACTIVITIES).some(a=>a.topicId===id))).progress,'unseen');
});
test('two submitted works mean activity complete even when evidence still needs support',()=>{
 const s=fresh(),a=ensureActivity(s,'fair');commit(a,'construct',{cuts:[15,55,85],selected:[0,1,2]});commit(a,'transfer',{selected:[0,1,2]});
 assert.equal(evidenceSummary(a).completed,true);assert.equal(evidenceSummary(a).demonstrated,false);assert.equal(nodeState(s,ACTIVITIES.fair.topicId).evidence,'supported');
 assert.equal(Date.parse(evidenceSummary(a).reviewAt)-Date.parse(evidenceSummary(a).kinds[1].at),86400000);
});
test('a corrected retry cannot erase the first error, across reload or case switching',()=>{
 const s=fresh(),a=ensureActivity(s,'fair');commit(a,'construct',{cuts:[15,55,85],selected:[0,1,2]});commit(a,'construct',examples.fair[0][0]);commit(a,'transfer',examples.fair[0][1]);
 a.variant=1;a.variant=0;const restored=validate(s,atlas).activities.fair;
 assert.equal(evidenceSummary(restored).demonstrated,false);assert.equal(restored.evidence['construct:0'].attempts[1].exposed,true);
 assert.equal(restored.evidence['construct:0'].attempts.length,2);
});
test('using a hint survives reload and import and cannot count as unaided evidence',()=>{
 const s=fresh(),a=ensureActivity(s,'rename');a.stage='construct';addSupport(a);commit(a,'construct',examples.rename[0][0]);commit(a,'transfer',examples.rename[0][1]);
 const r=parseBackup(JSON.stringify(backup(s)),atlas);assert.equal(evidenceSummary(r.activities.rename).demonstrated,false);assert.equal(r.activities.rename.evidence['construct:0'].attempts[0].supported,true);
 const independent=complete('rename');const hinted=fresh(),h=ensureActivity(hinted,'rename');h.stage='construct';addSupport(h);
 assert.equal(evidenceSummary(merge(hinted,independent).activities.rename).demonstrated,false,'import must not wash out an existing hint even before submission');
});
test('new independent constructions and transfers have bounded evidence, never confirmed explanations',()=>{
 for(const id of Object.keys(ACTIVITIES)){const s=complete(id),e=evidenceSummary(s.activities[id]);assert.equal(e.completed,true);assert.equal(e.demonstrated,true);assert.equal(e.explanation,'missing');saveNote(s.activities[id],'一个未经评估的解释');assert.equal(evidenceSummary(s.activities[id]).explanation,'pending');assert.equal(Date.parse(e.reviewAt)-Math.max(...e.kinds.map(k=>Date.parse(k.at))),7*86400000);}
 const s=complete('rename');commit(s.activities.rename,'transfer',{mark:3});assert.equal(evidenceSummary(s.activities.rename).demonstrated,false,'a later contradiction remains visible');
});
test('legacy records, ongoing sessions, answers and bookmarks are retained without new credit',()=>{
 const old=legacy(),before=JSON.stringify(old),s=migrateLegacy(old,ids);assert.deepEqual(s.legacy,old);assert.deepEqual(s.activities,{});assert.equal(evidenceSummary(s.activities.fair).demonstrated,false);assert.deepEqual(s.bookmarks,old.bookmarks);assert.equal(JSON.stringify(old),before);
 assert.deepEqual(parseBackup(JSON.stringify({app:'math-explorer',version:1,state:old}),atlas),s);
});
test('backup roundtrip and repeated merge retain draft, support, notes and both histories',()=>{
 const own=complete('fair'),other=complete('decimal');own.activities.fair.draft='尚未提交的想法';own.activities.fair.stage='explain';saveNote(own.activities.fair,'第一份解释');saveNote(other.activities.decimal,'第二份解释');own.legacy=legacy();
 const combined=merge(own,other),again=merge(combined,other);assert.deepEqual(again,combined);assert.equal(combined.continuation,'fair');assert.equal(combined.activities.fair.draft,'尚未提交的想法');assert.equal(combined.activities.fair.stage,'explain');assert.deepEqual(parseBackup(JSON.stringify(backup(combined)),atlas),combined);
});
test('malformed imports fail without mutation; asserted scores cannot override actual work',()=>{
 const good=complete('decimal'),before=JSON.stringify(good);const broken=structuredClone(good);broken.activities.decimal.evidence['transfer:0'].attempts[0].value={hundredths:6,tenths:6};broken.activities.decimal.demonstrated=true;
 assert.equal(evidenceSummary(validate(broken,atlas).activities.decimal).demonstrated,false);
 const invalid=[{...good,bookmarks:['missing']},{...good,activities:{constructor:good.activities.decimal}}];
 for(const raw of invalid)assert.throws(()=>validate(raw,atlas));
 const duplicate=structuredClone(good);const row=duplicate.activities.decimal.evidence['construct:0'];row.attempts.push(structuredClone(row.attempts[0]));assert.throws(()=>validate(duplicate,atlas));
 const badShape=structuredClone(good);badShape.activities.decimal.models['construct:0'].selected=[2,2];assert.throws(()=>validate(badShape,atlas));
 assert.throws(()=>parseBackup('{broken',atlas));assert.throws(()=>parseBackup(JSON.stringify({app:'wrong',version:2,state:good}),atlas));assert.equal(JSON.stringify(good),before);
});
