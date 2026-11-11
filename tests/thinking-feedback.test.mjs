import test from 'node:test';
import assert from 'node:assert/strict';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {TASKS as F} from '../dist/learning/phase5/b17.js';
import * as fractions from '../dist/learning/phase5/b17-model.js';
import {TASKS as A} from '../dist/learning/phase5/b38.js';
import * as arguments38 from '../dist/learning/phase5/b38-model.js';
import {TASKS as P} from '../dist/learning/phase5/b34.js';
import * as patterns34 from '../dist/learning/phase5/b34-model.js';
import {TASKS as S} from '../dist/learning/phase5/b39.js';
import * as tools39 from '../dist/learning/phase5/b39-model.js';
import {registerB39Model} from '../dist/learning/phase4/engine.js';
// In production the selected B39 task registers its model on demand; make that
// same registration explicit in this isolated Node test without eager runtime imports.
registerB39Model(tools39);
import {freshLesson,modelForLesson,submitLesson,validateLesson,currentSubmission} from '../dist/learning/state.js';

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
    [A.show38[2],'mt_pyMD_SIiYO','show38',2],
    [A.because38[1],'mt_pyMD_SIiYO','because38',1],
    [A.because38[2],'mt_nyK25mNOeR','because38',2],
    [A.argument38[0],'mt_nyK25mNOeR','argument38',0],
    [A.argument38[2],'mt_pyMD_SIiYO','argument38',2]
  ];
  for(const [t,nodeId,sessionId,index] of samples){
    const context={sessionId,index};
    const before=arguments38.initial(t),done=arguments38.example(t);
    assert.equal(thinkingFeedback(t,before,{attempts:[attempt(before)]},context),null,'empty reasoning cannot qualify');
    assert.equal(thinkingFeedback(t,done,{attempts:[]},context),null,'constructed but unsubmitted reasoning cannot qualify');
    assert.equal(thinkingFeedback(t,done,{attempts:[attempt(before)]},context),null,'historical incomplete submission cannot qualify');
    assert.equal(thinkingFeedback(t,done,{attempts:[attempt(done)]}),null,'unreviewed context must not infer MP.3');
    const result=thinkingFeedback(t,done,{attempts:[attempt(before),attempt(done)],support:true},context);
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
    assert.equal(thinkingFeedback(t,changed,{attempts:[attempt(done)]},context),null,'changed work needs a new check');
    const tampered=structuredClone(done);
    tampered.board.selected.push('invented');
    assert.equal(thinkingFeedback(t,tampered,{attempts:[attempt(tampered)]},context),null,'unreplayable history cannot create evidence');
  }
  const unrelated=A.story38[2],m=arguments38.example(unrelated);
  assert.equal(unrelated.type,'x-r38-chain');
  assert.equal(thinkingFeedback(unrelated,m,{attempts:[attempt(m)]},{sessionId:'story38',index:2}),null,
    'another MP category using the same card widget must not be mislabeled as MP.3');
});

test('P9 emitted thinking source IDs and practice codes belong to the pinned 50-node map',async()=>{
  const fs=await import('node:fs');
  const source=JSON.parse(fs.readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
  assert.equal(source.groups.length,8);
  assert.equal(source.groups.reduce((sum,g)=>sum+g.nodes.length,0)+source.untagged.length,50);
  const byId=new Map(source.groups.flatMap(g=>g.nodes.map(n=>[n.id,{n,code:g.code}])));
  const cases=[
    [F.recutnames[0],fractions.example(F.recutnames[0]),{}],
    ...[
      ['show38',2],['because38',1],['because38',2],['argument38',0],['argument38',2],
      ['argument38',3],['argument38',4]
    ].map(([id,index])=>{
      const t=A[id][index];
      return [t,arguments38.example(t),{sessionId:id,index}];
    })
  ];
  for(const [t,m,context] of cases){
    const note=thinkingFeedback(t,m,{attempts:[attempt(m)],support:false},context);
    assert.ok(note?.method,'this validated pilot behavior gets a bounded method label');
    const sourceNode=byId.get(note.method.nodeId);
    assert.ok(sourceNode,'linked ID is in the fixed source map');
    assert.equal(note.method.code,sourceNode.code,'method code comes from the correct source chain');
    assert.equal(note.method.label,sourceNode.n.displayName,'no invented thinking title');
  }
});

test('P9 second round three anchored methods use the fixed source map',async()=>{
  const fs=await import('node:fs');
  const source=JSON.parse(fs.readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
  const byId=new Map(source.groups.flatMap(g=>g.nodes.map(n=>[n.id,{n,code:g.code}])));
  const samples=[
    [A.sense38[0],arguments38.example(A.sense38[0]),'sense38',0,'mt_WkKkb7W9Qd'],
    [S.tools39[0],(()=>{const t=S.tools39[0],m=tools39.initial(t);m.method='calculator';m.entry='25*4';tools39.act(t,m,'s39-run');m.answer='100';return m;})(),'tools39',0,'mt_d-WZC2OyMB'],
    [P.general34[2],patterns34.example(P.general34[2]),'general34',2,'mt_fZTn0W_iZR'],
    [P.general34[3],patterns34.example(P.general34[3]),'general34',3,'mt_fZTn0W_iZR']
  ];
  for(const[t,m,id,index,nodeId]of samples){
    const note=thinkingFeedback(t,m,{attempts:[attempt(m)]},{sessionId:id,index});
    assert.equal(note?.method.nodeId,nodeId,id+':'+index);
    assert.equal(note.method.code,byId.get(nodeId).code);
    assert.equal(note.method.label,byId.get(nodeId).n.displayName);
    assert.match(note.connection,/下次/);
    assert.doesNotMatch(JSON.stringify(note),/已经掌握|能力评分/);
    assert.equal(thinkingFeedback(t,m,{attempts:[]},{sessionId:id,index}),null);
    assert.equal(thinkingFeedback(t,m,{attempts:[attempt(m)]}),null);
    assert.equal(thinkingFeedback(t,m,{attempts:[attempt(m)]},{sessionId:id,index:99}),null);
    const changed=structuredClone(m);changed.prose='尚未提交的自由文字';
    assert.equal(thinkingFeedback(t,changed,{attempts:[attempt(m)]},{sessionId:id,index}),null);
    const forged=structuredClone(m);forged.board.bad=!forged.board.bad;
    assert.equal(thinkingFeedback(t,forged,{attempts:[attempt(forged)]},{sessionId:id,index}),null);
  }
});

test('P9 MP.1 reading requires selected known and asked cards, not an arbitrary chain',()=>{
  const t=A.sense38[0],context={sessionId:'sense38',index:0},m=arguments38.initial(t);
  assert.equal(thinkingFeedback(t,m,{attempts:[attempt(m)]},context),null);
  arguments38.act(t,m,'r38-card',{index:'wrong'});
  assert.equal(thinkingFeedback(t,m,{attempts:[attempt(m)]},context),null);
  const done=arguments38.example(t);
  const note=thinkingFeedback(t,done,{attempts:[attempt(m),attempt(done)],support:true},context);
  assert.match(note.observation,/原来3颗/);
  assert.match(note.observation,/想找现在一共几颗/);
  assert.match(note.detail.join(' '),/修改后又提交|提示/);
  const copied={...t,prompt:'别的故事'};
  assert.equal(thinkingFeedback(copied,done,{attempts:[attempt(done)]},context),null);
  assert.equal(thinkingFeedback(A.story38[2],arguments38.example(A.story38[2]),
    {attempts:[attempt(arguments38.example(A.story38[2]))]},{sessionId:'story38',index:2}),null);
});

test('P9 MP.5 requires actual calculator choice and replayed execution, not just correct answer',()=>{
  const t=S.tools39[0],c={sessionId:'tools39',index:0},m=tools39.example(t);
  assert.equal(m.method,'mental');
  assert.equal(thinkingFeedback(t,m,{attempts:[attempt(m)]},c),null);
  m.method='calculator';
  assert.equal(thinkingFeedback(t,m,{attempts:[attempt(m)]},c),null);
  m.entry='25*4';tools39.act(t,m,'s39-run');m.answer='100';
  assert.match(thinkingFeedback(t,m,{attempts:[attempt(m)]},c).observation,/实际输入.*25\*4/);
  const changed=structuredClone(m);changed.entry='25*5';
  assert.equal(thinkingFeedback(t,changed,{attempts:[attempt(m)]},c),null);
  const bad=tools39.initial(t);bad.method='calculator';bad.entry='20*5';tools39.act(t,bad,'s39-run');bad.answer='100';
  assert.equal(thinkingFeedback(t,bad,{attempts:[attempt(bad)]},c),null);
  const notChosen=structuredClone(m);notChosen.method='mental';
  assert.equal(thinkingFeedback(t,notChosen,{attempts:[attempt(notChosen)]},c),null);
  const second=S.tools39[1],valid=tools39.initial(second);
  valid.method='calculator';valid.entry='167*3';tools39.act(second,valid,'s39-run');valid.answer='501';
  assert.equal(thinkingFeedback(second,valid,{attempts:[attempt(valid)]},{sessionId:'tools39',index:1})?.method.nodeId,'mt_d-WZC2OyMB');
  assert.equal(thinkingFeedback(S.strategy39[0],tools39.example(S.strategy39[0]),
    {attempts:[attempt(tools39.example(S.strategy39[0]))]},{sessionId:'strategy39',index:0}),null);
});

test('P9 MP.8 requires successive recorded increments and a checked fixed-rule choice',()=>{
  for(const [index,expected]of [[2,'0和5交替'],[3,'2和7交替']]){
    const t=P.general34[index],c={sessionId:'general34',index},m=patterns34.example(t);
    assert.match(thinkingFeedback(t,m,{attempts:[attempt(m)]},c).observation,new RegExp(expected));
    const noJudgment=structuredClone(m);noJudgment.answers[0]='';
    assert.equal(thinkingFeedback(t,noJudgment,{attempts:[attempt(noJudgment)]},c),null);
    const lost=structuredClone(m);lost.history=[];
    assert.equal(thinkingFeedback(t,lost,{attempts:[attempt(lost)]},c),null);
    const incomplete=patterns34.initial(t);
    assert.equal(thinkingFeedback(t,incomplete,{attempts:[attempt(incomplete)]},c),null);
    assert.equal(thinkingFeedback(t,m,{attempts:[attempt(m)]},{sessionId:'tables34',index}),null);
  }
});

test('P9 original lesson record schema and modified current check survive second-round feedback',()=>{
  const t=A.sense38[0],id='sense38',a=freshLesson(id),m=modelForLesson(a);
  for(const step of arguments38.solveSteps(t))arguments38.act(t,m,step.action,step.data);
  const first=submitLesson(a);
  assert.equal(first.correct,true);
  const record=validateLesson(a,id);
  assert.equal(currentSubmission(record).status,'correct');
  const note=thinkingFeedback(t,record.models[0],record.cases[0],{sessionId:id,index:0});
  assert.ok(note);
  assert.deepEqual(Object.keys(record.cases[0]).sort(),['attempts','support']);
  assert.equal(record.models[0].history.length,3);
  arguments38.act(t,record.models[0],'r38-undo');
  assert.equal(currentSubmission(record).status,'modified');
  assert.equal(thinkingFeedback(t,record.models[0],record.cases[0],{sessionId:id,index:0}),null);
  arguments38.act(t,record.models[0],'r38-card',{index:'ask'});
  submitLesson(record);
  assert.equal(record.cases[0].attempts.length,2);
  assert.equal(currentSubmission(record).status,'correct');
  assert.ok(thinkingFeedback(t,record.models[0],record.cases[0],{sessionId:id,index:0}));
});
