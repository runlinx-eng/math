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
