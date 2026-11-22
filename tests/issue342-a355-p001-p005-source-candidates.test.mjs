// #342: independently validate all 66 exact original contracts and formal admission.
// Does not mint Check records or alter the native graders.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {ISSUE342_A_P001_P003_ADAPTERS as a} from '../dist/learning/issue342-a355-p001-p003-candidates.js';
import {ISSUE342_A_P004_VERIFIED_ADAPTERS as b} from '../dist/learning/issue342-a355-p004-tested-candidates.js';
import {ISSUE342_A_P004_LATE_ADAPTERS as c} from '../dist/learning/issue342-a355-p004-late-candidates.js';
import {ISSUE342_A_P004B_ADAPTERS as d} from '../dist/learning/issue342-a355-p004b-candidate.js';
import {ISSUE342_A_P005_EARLY_ADAPTERS as e} from '../dist/learning/issue342-a355-p005-early-candidates.js';
import {ISSUE342_A_P005_LATE_ADAPTERS as f} from '../dist/learning/issue342-a355-p005-late-candidates.js';
await ensureB39Ready();
const adapters=[...a,...b,...c,...d,...e,...f];
const official=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url),'utf8'));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const fullHash=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
const key=(sessionId,index)=>JSON.stringify([sessionId,index]);
test('A355 P001-P005 has 66 exact formal sources without colliding with other reviewed positions',()=>{
 assert.equal(adapters.length,31);
 assert.deepEqual([a.length,b.length,c.length,d.length,e.length,f.length],[3,7,6,1,7,7]);
 const positions=adapters.flatMap(x=>x.sources.map(source=>({source,family:x})));
 assert.equal(positions.length,66);
 const added=official.tasks.filter(x=>/^issue341-A-P00[1-5]/.test(x.adapter??''));
 assert.equal(official.tasks.length,1663);
 assert.equal(added.length,66);
 const previous=official.tasks.filter(x=>!/^issue341-A-P00[1-5]/.test(x.adapter??''));
 const old=new Set(previous.map(x=>key(x.sessionId,x.index)));
 assert.equal(old.size,official.tasks.length-positions.length,'existing main sources remain distinct');
 const formalByPosition=new Map(added.map(x=>[key(x.sessionId,x.index),x]));
 assert.equal(formalByPosition.size,66,'all newly admitted positions remain unique');
 const seen=new Set();
 for(const {source:s,family} of positions){
  const k=key(s.sessionId,s.index);
  assert.equal(seen.has(k),false,'duplicate in staged sources '+s.position);seen.add(k);
  assert.equal(old.has(k),false,'overlaps previous main official A '+s.position);
  assert.deepEqual(formalByPosition.get(k),{
   sessionId:s.sessionId,index:s.index,type:s.type,nodeId:s.nodeId,
   adapter:family.id,taskHash:s.taskHash,method:null
  },'exact formal source identity differs '+s.position);
  assert.equal(s.position,s.sessionId+':'+s.index);
  assert.match(s.taskHash,/^[a-f0-9]{64}$/);
  const native=sessionTaskFor(s.sessionId,s.index);
  assert.ok(native,'missing actual native task '+s.position);
  assert.equal(native.type,s.type,'wrong task type '+s.position);
  assert.equal(fullHash(native),s.taskHash,'full original SHA mismatch '+s.position);
  assert.equal(LESSONS[s.sessionId].topicId,s.nodeId,'wrong lesson source '+s.position);
  assert.ok(family.types.includes(native.type));
  const bound=family.binding(native,{sessionId:s.sessionId,index:s.index});
  assert.ok(bound,'evidence binding rejects original task '+s.position);
  assert.equal(bound.nodeId,s.nodeId);
  assert.equal(bound.method,null);
  assert.equal(bound.strictAApproved,false);
  assert.deepEqual(bound.candidateSource,s);
  assert.equal(family.binding(native,{sessionId:s.sessionId,index:999999}),null,'position widening '+s.position);
  const wrong=structuredClone(native);wrong.prompt+=' (forged)';
  assert.equal(family.binding(wrong,{sessionId:s.sessionId,index:s.index}),null,'forged task accepted '+s.position);
 }
 assert.equal(seen.size,66);
 assert.deepEqual(new Set(formalByPosition.keys()),seen,'no unreviewed sibling source was admitted');
 console.log('ISSUE342_P001_P005_NATIVE_66_SHA_BINDING_PASS');
});
