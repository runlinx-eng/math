import test from 'node:test';
import assert from 'node:assert/strict';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {TASKS as F} from '../dist/learning/phase5/b17.js';
import * as fractions from '../dist/learning/phase5/b17-model.js';
import {TASKS as A} from '../dist/learning/phase5/b38.js';
import * as arguments38 from '../dist/learning/phase5/b38-model.js';

const attempt=value=>({value:structuredClone(value)});

test('fraction feedback requires a submitted, valid construction and describes the actual new names',()=>{
  const t=F.recutnames[0],empty=fractions.initial(t),done=fractions.example(t);
  assert.equal(thinkingFeedback(t,empty,null),null);
  assert.equal(thinkingFeedback(t,empty,{attempts:[attempt(empty)],support:false}),null);
  assert.equal(thinkingFeedback(t,done,{attempts:[],support:false}),null);
  const result=thinkingFeedback(t,done,{attempts:[attempt(empty),attempt(done)],support:true});
  assert.match(result.observation,/1\/3.*2\/6/);
  assert.match(result.connection,/比较分数/);
  assert.ok(result.detail.some(s=>s.includes('修改')));
  assert.ok(result.detail.some(s=>s.includes('提示')));
  const changed=structuredClone(done);changed.reason='top';
  assert.equal(thinkingFeedback(t,changed,{attempts:[attempt(done)],support:false}),null);
});

test('counterexample feedback reports only a tested contradiction and does not assess free text',()=>{
  for(const t of A.argument38.slice(3)){
    const done=arguments38.example(t),result=thinkingFeedback(t,done,{attempts:[attempt(done)],support:true});
    assert.match(result.observation,/6 × 1\/2.*更小/);
    assert.match(result.connection,/反例/);
    assert.doesNotMatch(JSON.stringify(result),/掌握|能力评分|已经证明|自由解释/);
    const untested=arguments38.initial(t);
    assert.equal(thinkingFeedback(t,untested,{attempts:[attempt(untested)],support:false}),null);
    const changed=structuredClone(done);changed.prose='这是我的解释';
    assert.equal(thinkingFeedback(t,changed,{attempts:[attempt(done)],support:true}),null);
  }
});

test('an equal result refutes the strict claim but not the nonstrict claim',()=>{
  for(const [index,expected] of [[3,true],[4,false]]){
    const t=A.argument38[index],m=arguments38.initial(t);m.value='6';m.second='1';m.choice='equal';arguments38.act(t,m,'r38-test');
    const result=thinkingFeedback(t,m,{attempts:[attempt(m)],support:false});
    assert.equal(!!result,expected);
    if(result)assert.match(result.observation,/与原来的数一样大/);
  }
});

test('unsupported activity types never receive a guessed thinking label',()=>{
  const t={type:'number'},m={value:1};
  assert.equal(thinkingFeedback(t,m,{attempts:[attempt(m)],support:false}),null);
});
