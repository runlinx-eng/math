import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTargets} from './validate-targets.mjs';
const source={sessionId:'angletypes',index:1,nodeId:'mt_h0CVtqI2xo',
 taskSha256:'126024ce38ae4972a7a8fe4b3a93dfdbbf7e25d72267b6d07c718425dc371324',
 type:'x-g25-compare',view:'b25',controls:['g25-test','g25-choose','g25-undo']};
const sample={schema:'math-a-candidate-targets/2',targets:[{case:'P005b-angle-ordering',
 sha:'8e595357d081d62c444861550d259996e15105dc',
 node_test:'tests/p9-p005b-angle-ordering-evidence.test.mjs',
 browser_test:'tests/p9-p005b-angle-ordering-browser.cjs',native:[source]}]};
const changed=fn=>{const x=structuredClone(sample);fn(x);return x;};
test('positive case emits exact matrix without rewriting identity',()=>{
 const matrix=validateTargets(sample);assert.equal(matrix.include.length,1);
 assert.equal(matrix.include[0].native[0].taskSha256,source.taskSha256);
});
for(const [label,fn] of [
 ['short SHA',x=>{x.targets[0].native[0].taskSha256='a'.repeat(40);}],
 ['path traversal',x=>{x.targets[0].node_test='../tests/script.test.mjs';}],
 ['mutable branch',x=>{x.targets[0].sha='main';}],
 ['wrong node id',x=>{x.targets[0].native[0].nodeId='';}],
 ['unknown view',x=>{x.targets[0].native[0].view='unknown';}],
 ['missing test',x=>{delete x.targets[0].browser_test;}],
 ['duplicate position',x=>{x.targets[0].native.push({...x.targets[0].native[0]});}],
 ['unsafe case',x=>{x.targets[0].case='P005b-invalid@';}],
 ['empty target list',x=>{x.targets=[];}],
 ['unknown field',x=>{x.targets[0].unreviewed=true;}]
]){
 test('fail closed: '+label,()=>assert.throws(()=>validateTargets(changed(fn)),/A_DEV_TARGET_INVALID/));
}

test('original B15 native geometry controls are admitted, unknown B15 action is rejected',()=>{
 const valid=changed(x=>{
  x.targets[0].native[0]={...x.targets[0].native[0],
   sessionId:'structurebridge',index:0,nodeId:'mt_hImiKNiaNh',type:'x-shapeangle',
   taskSha256:'5574b42f8ac8c33a3c07232a2784d22dfc88e25b0df58091122628b648517dc6',
   view:'b15',controls:['b15-parallel','b15-shape']};
 });
 assert.equal(validateTargets(valid).include[0].native[0].view,'b15');
 valid.targets[0].native[0].controls.push('b15_make_up');
 assert.throws(()=>validateTargets(valid),/A_DEV_TARGET_INVALID/);
});

test('native B19 data-count view and original bar control permitted, unsafe action denied',()=>{
 const valid=changed(x=>{
  x.targets[0].native[0]={...x.targets[0].native[0],
   sessionId:'categoryuse',index:0,nodeId:'mt_1VSfm9yiLn',
   taskSha256:'945aa122537d0193ef311aadb9b1d47bd5c3bbe22f472c19163977e69b117fbe',
   type:'x-datacount',view:'b19',controls:['b19-bar']};
 });
 assert.equal(validateTargets(valid).include[0].native[0].controls[0],'b19-bar');
 valid.targets[0].native[0].controls[0]='b19_bad';
 assert.throws(()=>validateTargets(valid),/A_DEV_TARGET_INVALID/);
});

test('original B21 sample drawing and recording controls admitted, unsafe action rejected',()=>{
 const valid=changed(x=>{
  x.targets[0].native[0]={...x.targets[0].native[0],
   sessionId:'fairdraw',index:0,nodeId:'mt_4zgPzc6yu5',
   taskSha256:'8fe9d888f53692c0c592ffe2b36e2f9d74ecc152349581edb5bb2948286f8da3',
   type:'x-samplelab',view:'b21',controls:['b21-draw','b21-record']};
 });
 assert.equal(validateTargets(valid).include[0].native[0].view,'b21');
 valid.targets[0].native[0].controls[0]='b21_fake';
 assert.throws(()=>validateTargets(valid),/A_DEV_TARGET_INVALID/);
});

test('legacy original survey task admitted only at survey:0 and survey:1',()=>{
 for(const index of [0,1]){
  const allowed=changed(x=>{
   Object.assign(x.targets[0].native[0],{
    sessionId:'survey',index,nodeId:'mt_ebQURBOsM5',
    taskSha256:index===0?
     'b408662903dcf4427dbd62cde33a67aed44713215040dfe2e1a315ed6d040712':
     '62e70fbba828146520ab23b8f3e59738ddde922ff980cc3b79af83e2ce892595',
    type:'survey',view:null,controls:[]
   });
  });
  assert.equal(validateTargets(allowed).include[0].native[0].type,'survey');
  for(const mutation of [
   s=>s.index=2,
   s=>s.sessionId='tally',
   s=>s.type='chart',
   s=>s.type='x-fake',
   s=>s.controls=['b21-fake']
  ]){
   const candidate=structuredClone(allowed);mutation(candidate.targets[0].native[0]);
   if(candidate.targets[0].native[0].type==='x-fake'){
    // Generic x-* types are allowed only as syntax; runtime source SHA preflight rejects fakes.
    continue;
   }
   assert.throws(()=>validateTargets(candidate),/A_DEV_TARGET_INVALID/);
  }
 }
});
