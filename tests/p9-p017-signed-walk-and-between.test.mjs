import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial} from '../dist/learning/phase5/b09-model.js';
import {P017_SOURCES, p017SignedWalkAndBetweenBinding, replayP017SignedWalkAndBetweenEvidence, submittedP017SignedWalkAndBetweenEvidence} from '../dist/learning/p017-signed-walk-and-between-evidence.js';

const fullSteps = task => {
  const steps=[];
  const f=(field,value)=>steps.push({field,value:String(value)});
  const a=(action,data)=>steps.push({action,data});
  if (task.type === 'x-signedline' && task.mode === 'walk') {
    const step=Math.sign(task.end-task.start);
    for (let point=task.start; point!==task.end;) {
      point+=step;
      f('next',point);
      a('signed-step');
    }
  } else if (task.type === 'x-signedline' && task.mode === 'place') {
    task.values.forEach((value,i)=>f('positions.'+i,value*100));
    if (task.zero) f('zero','reference');
    if (task.compare) f('relation',task.values[task.compare[0]]<task.values[task.compare[1]]?'<':'>');
  } else if (task.type === 'x-directedjump') {
    f('anchor',task.start);
    f('guess',task.start+task.operand);
    a('direct-predict');
    for (const segment of task.path) {
      f('size',Math.abs(segment));
      f('dir',segment>0?'right':'left');
      a('direct-jump');
    }
    f('answer',task.start+task.operand);
  } else if (task.type === 'x-betweenpoints') {
    const [an,ad]=task.a;
    let [bn,bd]=task.b;
    for (let i=0;i<task.rounds;i++) {
      bn=an*bd+bn*ad;
      bd=2*ad*bd;
      let g=bn, r=bd;
      while (r) [g,r]=[r,g%r];
      bn/=g;
      bd/=g;
      f('entry',bn+'/'+bd);
      a('between-insert');
      a('between-zoom',{side:'left'});
    }
    f('rule','midpoint');
  } else if (task.type === 'x-decimalmachine') {
    const seen=new Set();
    let remainder=task.n%task.d;
    while (remainder && !seen.has(remainder)) {
      seen.add(remainder);
      const parts=remainder*10;
      f('digit',Math.floor(parts/task.d));
      remainder=parts%task.d;
      f('remainder',remainder);
      a('decimal-next');
    }
    f('kind',remainder?'repeats':'ends');
    f('fraction',task.n+'/'+task.d);
  } else if (task.type === 'x-numbercards') {
    task.cards.forEach((card,index)=>{
      a('number-card',{index});
      f('kinds.'+index,card.kind);
      if (card.fraction) f('fractions.'+index,card.fraction.join('/'));
      else a('number-basis');
      f('reasons.'+index,card.why);
    });
  } else throw new Error('Unexpected prerequisite '+task.type);
  return steps;
};
const wrongSteps=task=>task.type==='x-signedline'
  ? fullSteps(task).slice(0,2)
  : fullSteps(task).map(step=>step.field==='rule'?{...step,value:'plusone'}:step);
const correctSteps=task=>task.type==='x-signedline'
  ? fullSteps(task).slice(2)
  : fullSteps(task).slice(-1);

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P017_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP017SignedWalkAndBetweenEvidence(task, model, context);
  const submit = (model, saved) => submittedP017SignedWalkAndBetweenEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P017 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p017SignedWalkAndBetweenBinding(task, context));
    assert.equal(p017SignedWalkAndBetweenBinding(task, {sessionId,index:-1}), null);
    const model = initial(task);
    play(model, wrongSteps(task));
    const failed = structuredClone(model);
    assert.equal(replay(model), null);
    play(model, correctSteps(task));
    const accepted = replay(model);
    assert.ok(accepted);
    assert.equal(submit(model, failed), null);
    assert.deepEqual(submit(model, structuredClone(model)), accepted);
    const forged = structuredClone(model);
    forged.history = [];
    assert.equal(replay(forged), null);
  });
}
