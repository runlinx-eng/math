import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,initial} from '../dist/learning/phase5/b23-model.js';
import {P058_SOURCES,p058LeafGridApproximationBinding,replayP058LeafGridApproximationEvidence,submittedP058LeafGridApproximationEvidence} from '../dist/learning/p058-leaf-grid-approximation-evidence.js';

const [source]=P058_SOURCES;
const {sessionId,index}=source;
const context={sessionId,index};
const task=sessionTaskFor(sessionId,index);
const cover=[9,10,15,16,17,22,23,24,25,29,30,31];
const toggle=(m,cell)=>act(task,m,'g23-toggle',{index:cell});
const replay=m=>replayP058LeafGridApproximationEvidence(task,m,context);
function work(cells){
  const m=initial(task,1);
  cells.forEach(cell=>toggle(m,cell));
  m.answers[0]='approx';
  return m;
}

test('P058 locks the exact native approximation prompt and response labels',()=>{
  const order=v=>Array.isArray(v)?v.map(order):v&&typeof v==='object'
    ?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,order(v[k])])):v;
  assert.equal(createHash('sha256').update(JSON.stringify(order(task))).digest('hex'),source.taskHash);
  assert.ok(p058LeafGridApproximationBinding(task,context));
  assert.equal(p058LeafGridApproximationBinding(task,{sessionId,index:-1}),null);
  assert.equal(p058LeafGridApproximationBinding({...task,questions:[]},context),null);
});

test('P058 distinguishes coverage, outside cells and correction by toggling a cell again',()=>{
  assert.equal(replay(work(cover.slice(1))),null);
  const m=work([...cover,0,1]);
  assert.equal(replay(m),null);
  toggle(m,1);
  const proof=replay(m);
  assert.deepEqual(proof?.covered,cover);
  assert.deepEqual(proof.outside,[0]);
  assert.deepEqual(proof.missed,[36,37,38]);
  assert.deepEqual(proof.actions.at(-1),{cell:1,selected:false});
  m.answers[0]='same';
  assert.equal(replay(m),null);
});

test('P058 requires the latest Check and excludes altered cell histories',()=>{
  const m=work([...cover,0,1]);
  const wrong=structuredClone(m);
  toggle(m,1);
  assert.equal(submittedP058LeafGridApproximationEvidence(task,m,{attempts:[{value:wrong}]},context),null);
  assert.ok(submittedP058LeafGridApproximationEvidence(task,m,{attempts:[{value:wrong},{value:m}]},context));
  m.history[0].d.index='09';
  assert.equal(replay(m),null);
});
