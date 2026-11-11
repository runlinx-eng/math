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

test('P9 reasoning-chain feedback requires current replay-valid submitted work, not a correct answer alone',()=>{
  const samples=[
    [A.show38[2],'mt_pyMD_SIiYO'],
    [A.because38[1],'mt_pyMD_SIiYO'],
    [A.because38[2],'mt_nyK25mNOeR'],
    [A.argument38[0],'mt_nyK25mNOeR'],
    [A.argument38[2],'mt_pyMD_SIiYO']
  ];
  for(const [t,nodeId] of samples){
    const before=arguments38.initial(t),done=arguments38.example(t);
    assert.equal(thinkingFeedback(t,before,{attempts:[attempt(before)]}),null,'empty reasoning cannot qualify');
    assert.equal(thinkingFeedback(t,done,{attempts:[]}),null,'constructed but unsubmitted reasoning cannot qualify');
    assert.equal(thinkingFeedback(t,done,{attempts:[attempt(before)]}),null,'historical incomplete submission cannot qualify');
    const result=thinkingFeedback(t,done,{attempts:[attempt(before),attempt(done)],support:true});
    assert.equal(result.method.nodeId,nodeId);
    assert.equal(result.method.code,'ccss-math:MP.3');
    assert.match(result.observation,/按顺序摆出了 \d+ 个推理步骤/);
    assert.match(result.detail.join(' '),/文字或口头解释尚未自动判断/);
    assert.ok(result.detail.some(x=>x.includes('提示')));
    assert.doesNotMatch(result.observation,/已经掌握|证明你会|能力评分/);
    if(t.lines)assert.match(result.observation,/标记.*需要修正/);
    if(t.scene==='exchange')assert.match(result.observation,/一捆十/);
    if(t.scene==='array')assert.match(result.observation,/十列中移走了两列/);
    const changed=structuredClone(done);
    arguments38.act(t,changed,'r38-undo');
    assert.equal(thinkingFeedback(t,changed,{attempts:[attempt(done)]}),null,'changed work needs a new check');
    const tampered=structuredClone(done);
    tampered.board.selected.push('invented');
    assert.equal(thinkingFeedback(t,tampered,{attempts:[attempt(tampered)]}),null,'unreplayable history cannot create evidence');
  }
});

test('P9 emitted thinking source IDs and practice codes belong to the pinned 50-node map',async()=>{
  const fs=await import('node:fs');
  const source=JSON.parse(fs.readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
  assert.equal(source.groups.length,8);
  assert.equal(source.groups.reduce((sum,g)=>sum+g.nodes.length,0)+source.untagged.length,50);
  const byId=new Map(source.groups.flatMap(g=>g.nodes.map(n=>[n.id,{n,code:g.code}])));
  const cases=[
    [F.recutnames[0],fractions.example(F.recutnames[0])],
    ...[A.show38[2],A.because38[1],A.because38[2],A.argument38[0],A.argument38[2],...A.argument38.slice(3)]
      .map(t=>[t,arguments38.example(t)])
  ];
  for(const [t,m] of cases){
    const note=thinkingFeedback(t,m,{attempts:[attempt(m)],support:false});
    assert.ok(note?.method,'this validated pilot behavior gets a bounded method label');
    const sourceNode=byId.get(note.method.nodeId);
    assert.ok(sourceNode,'linked ID is in the fixed source map');
    assert.equal(note.method.code,sourceNode.code,'method code comes from the correct source chain');
    assert.equal(note.method.label,sourceNode.n.displayName,'no invented thinking title');
  }
});
