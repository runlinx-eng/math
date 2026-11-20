import test from 'node:test';
import assert from 'node:assert/strict';
import {PREFLIGHT_STEPS,runPushPreflight} from '../scripts/ci-push-preflight.mjs';

const names=PREFLIGHT_STEPS.map(step=>step.id);
const fake=(failAt=-1,how='status')=>{
 const seen=[];
 const run=args=>{
  seen.push(args);
  const index=seen.length-1;
  if(index!==failAt)return {status:0};
  if(how==='exception')return {error:new Error('transport stopped'),status:null};
  if(how==='signal')return {signal:'SIGTERM',status:null};
  return {status:1};
 };
 return {seen,run};
};

test('one read-only pre-push command covers release pins, matrix capacity, and registry/order contracts',()=>{
 assert.deepEqual(names,[
  'release-and-reviewed-hashes','registered-browser-capacity','registry-and-source-contract-tests']);
 assert.deepEqual(PREFLIGHT_STEPS[0].args,['scripts/ci-release-sync.mjs','check']);
 assert.deepEqual(PREFLIGHT_STEPS[1].args,['scripts/ci-live-browser-matrix.mjs','inspect']);
 const tests=PREFLIGHT_STEPS[2].args;
 for(const file of ['tests/ci-release-sync.test.mjs','tests/ci-live-matrix.test.mjs',
  'tests/ci-plan-math-families.test.mjs','tests/p9-evidence-contract.test.mjs'])
  assert.ok(tests.includes(file),file);
 assert.ok(PREFLIGHT_STEPS.every(x=>x.args.every(y=>y!=='sync')));
});

test('healthy preflight runs all checks once and never pushes or edits files',()=>{
 const f=fake(),reports=[];
 const result=runPushPreflight({cwd:'/tmp/work',run:f.run,report:s=>reports.push(s)});
 assert.deepEqual(f.seen,PREFLIGHT_STEPS.map(step=>step.args));
 assert.deepEqual(result,{passed:names,readOnly:true,remotePushes:0});
 assert.equal(reports.filter(x=>x.startsWith('PUSH_PREFLIGHT_OK')).length,1);
});

test('any failing stage blocks all later stages, including a two-wave browser capacity failure',()=>{
 for(let i=0;i<PREFLIGHT_STEPS.length;i++){
  const f=fake(i);
  assert.throws(()=>runPushPreflight({run:f.run,report:()=>{}}),
   new RegExp(names[i]+' failed'));
  assert.equal(f.seen.length,i+1);
 }
});

test('timeout, process signal, and malformed process status fail closed',()=>{
 for(const how of ['exception','signal']){
  const f=fake(0,how);
  assert.throws(()=>runPushPreflight({run:f.run,report:()=>{}}),/failed/);
 }
 assert.throws(()=>runPushPreflight({run:()=>null,report:()=>{}}),/failed/);
});
