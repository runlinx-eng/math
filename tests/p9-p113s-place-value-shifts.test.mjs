import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,changed,initial,inspect} from '../dist/learning/phase5/b07-model.js';
import {P113S_SOURCES,replayP113SPlaceValueShiftsEvidence,submittedP113SPlaceValueShiftsEvidence} from '../dist/learning/p113s-place-value-shifts-evidence.js';

for (const {sessionId,index,taskHash} of P113S_SOURCES) {
  test(`${sessionId}:${index} verifies native move and exchange constraints`,()=>{
    const context={sessionId,index};
    const task=sessionTaskFor(sessionId,index);
    const replay=model=>replayP113SPlaceValueShiftsEvidence(task,model,context);
    const ordered=Object.fromEntries(Object.entries(task).sort(([a],[b])=>a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),taskHash);
    const model=initial(task);
    model.guess=task.start+task.delta;
    act(task,model,'pv-predict');
    if (task.start===300) act(task,model,'pv-swap',{kind:'down10'});
    const delta=Math.sign(task.delta)*(Math.abs(task.delta)>=100?100:10);
    for (let i=0;i<Math.abs(task.delta/delta);i++) act(task,model,'pv-move',{delta});
    if (task.start===190) act(task,model,'pv-swap',{kind:'up10'});
    model.answer=task.start+task.delta;
    model.changed=changed(task);
    assert.ok(inspect(task,model).correct);
    assert.equal(replay(model)?.netChange,task.delta);
    assert.equal(replayP113SPlaceValueShiftsEvidence(task,model,{sessionId,index:-1}),null);
    const wrong=structuredClone(model);
    wrong.answer=999;
    assert.equal(submittedP113SPlaceValueShiftsEvidence(task,model,{attempts:[{value:wrong}]},context),null);
    assert.deepEqual(submittedP113SPlaceValueShiftsEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),replay(model));
    if (!model.history.length) {
      const roundTrip=structuredClone(model);
      act(task,roundTrip,'pv-swap',{kind:'down1'});
      act(task,roundTrip,'pv-swap',{kind:'up1'});
      assert.ok(replay(roundTrip));
    }
    const impossible=structuredClone(model);
    impossible.history.unshift('up1','down1');
    assert.ok(inspect(task,impossible).correct);
    assert.equal(replay(impossible),null);
  });
}
