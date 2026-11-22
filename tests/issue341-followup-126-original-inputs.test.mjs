import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ISSUE341_FOLLOWUP_126_ADAPTERS} from '../dist/learning/issue341-followup-126-candidates.js';
const rows=JSON.parse(readFileSync(new URL('../verification/issue341-inputs/archived-checks-126.json',import.meta.url),'utf8')).rows;
const byPosition=new Map(rows.map(r=>[r.source.position,r]));
test('126 original Mac Check records remain exact and complete without replay or publication',()=>{
 assert.equal(rows.length,126);assert.equal(byPosition.size,126);
 assert.equal(ISSUE341_FOLLOWUP_126_ADAPTERS.length,35);
 for(const f of ISSUE341_FOLLOWUP_126_ADAPTERS){
  for(const s of f.sources){
   const row=byPosition.get(s.position);
   assert.ok(row,s.position);assert.equal(row.familyId,f.id);
   assert.equal(row.source.nodeId,s.nodeId);assert.equal(row.source.type,s.type);
   assert.equal(row.source.taskHash,s.taskHash);
   assert.equal(row.provenance.transportOnly,true);
   assert.equal(row.provenance.freshMathOrBrowserReplay,false);
   assert.equal(row.record.attempts.at(-1).value&&typeof row.model,'object');
   assert.deepEqual(row.record.attempts.at(-1).value,row.model);
  }
 }
});
