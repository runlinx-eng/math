// Fixed original Mac Check transport only. Full records are restored by CI into
// ignored verification space. These tests never generate synthetic learner history.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ISSUE341_FOLLOWUP_218_ADAPTERS} from '../dist/learning/issue341-followup-218-candidates.js';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();
const fixture=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-218.json',import.meta.url),'utf8'));
const rows=fixture.rows;
test('218 original frozen Mac Check records are complete and signed by source identity',()=>{
 assert.equal(fixture.requiredScope.positions,218);assert.equal(fixture.requiredScope.families,52);
 assert.equal(fixture.sourceCommit,'c453c7cd570c608205867a91132c86848b35400f');
 assert.equal(fixture.sourceBlob,'e4dc821ece91cc27fbea30543f0e0374f602424d');
 assert.equal(rows.length,218);
 const byPosition=new Map(rows.map(r=>[r.source.position,r]));assert.equal(byPosition.size,218);
 let replayed=0;
 for(const f of ISSUE341_FOLLOWUP_218_ADAPTERS)for(const s of f.sources){
  const r=byPosition.get(s.position);assert.ok(r,s.position);
  assert.equal(r.familyId,f.id,s.position);
  for(const field of ['sessionId','index','nodeId','type','taskHash'])assert.equal(r.source[field],s[field],s.position+' '+field);
  assert.equal(r.provenance.transportOnly,true,s.position);
  assert.equal(r.provenance.freshMathOrBrowserReplay,false,s.position);
  assert.ok(Array.isArray(r.record.attempts)&&r.record.attempts.length>0,s.position);
  assert.deepEqual(r.record.attempts.at(-1).value,r.model,s.position);
  const task=sessionTaskFor(s.sessionId,s.index);
  assert.ok(task,s.position);
  const proof=f.submitted(task,r.model,r.record,{sessionId:s.sessionId,index:s.index});
  assert.ok(proof,'original submitted proof did not replay: '+s.position);
  replayed++;
 }
 assert.equal(replayed,218);
});
