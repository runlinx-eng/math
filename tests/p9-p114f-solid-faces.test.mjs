import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,initial,inspect,solveSteps} from '../dist/learning/phase5/b27-model.js';
import {P114F_SOURCES,replayP114FSolidFacesEvidence,submittedP114FSolidFacesEvidence} from '../dist/learning/p114f-solid-faces-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P114F_SOURCES) {
  test(`${sessionId}:${index} certifies the visible classifications from the saved actions`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP114FSolidFacesEvidence(task,model,context);
    const proof=replay(good);
    assert.deepEqual(proof?.categories,task.cards.map(c=>c.answer));
    assert.equal(replayP114FSolidFacesEvidence(task,good,{sessionId,index:-1}),null);
    const pending=initial(task,1);
    act(task,pending,'g27-probe');
    act(task,pending,'g27-choose',{index:task.bins.find(x=>x.id!==task.cards[0].answer).id});
    act(task,pending,'g27-reset');
    assert.equal(replay(pending),null);
    for (const step of solveSteps(task)) {
      act(task,pending,step.action==='turn-extra'?'g27-turn':step.action,step.data);
    }
    assert.deepEqual(replay(pending),proof);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history.find(e=>e.a==='choose').d.index='unknown';},
      m=>{m.history=m.history.filter(e=>e.a!=='turn');},
      m=>{m.history=m.history.filter(e=>e.a!=='probe');},
      m=>{m.board.choices[0]=null;},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP114FSolidFacesEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP114FSolidFacesEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
