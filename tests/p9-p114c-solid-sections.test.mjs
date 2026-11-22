import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase5/b27-model.js';
import {P114C_SOURCES,replayP114CSolidSectionsEvidence,submittedP114CSolidSectionsEvidence} from '../dist/learning/p114c-solid-sections-evidence.js';

const ordered=value=>Array.isArray(value)?value.map(ordered):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;

for (const {sessionId,index,taskHash} of P114C_SOURCES) {
  test(`${sessionId}:${index} certifies the observed cross-sections from the saved actions`,()=>{
    const task=sessionTaskFor(sessionId,index);
    const context={sessionId,index};
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),taskHash);
    const good=example(task);
    assert.ok(inspect(task,good).correct);
    const replay=model=>replayP114CSolidSectionsEvidence(task,model,context);
    const proof=replay(good);
    assert.equal(proof?.answers.length,task.cards.length);
    assert.equal(replayP114CSolidSectionsEvidence(task,good,{sessionId,index:-1}),null);
    const reset=structuredClone(good);
    act(task,reset,'g27-reset');
    assert.equal(replay(reset),null);
    for (const change of [
      m=>{m.history=[];},
      m=>{m.history.find(e=>e.a==='answer').d.index='unknown';},
      m=>{m.history=m.history.filter(e=>e.a!=='turn');},
      m=>{m.history=m.history.filter(e=>e.a!=='cut');},
      m=>{m.board.answers[0]=null;},
    ]) {
      const bad=structuredClone(good);
      change(bad);
      assert.equal(replay(bad),null);
      assert.equal(submittedP114CSolidSectionsEvidence(task,good,{attempts:[{value:bad}]},context),null);
    }
    assert.deepEqual(submittedP114CSolidSectionsEvidence(task,good,{attempts:[{value:structuredClone(good)}]},context),proof);
  });
}
