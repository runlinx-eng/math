import test from 'node:test';
import assert from 'node:assert/strict';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
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

test('MP.7 geometry needs genuine replayable two-relation work in the pinned source task',async()=>{
  const {TASKS:B34}=await import('../dist/learning/phase5/b34.js');
  const geometry=await import('../dist/learning/phase5/b23-model.js');
  const t=B34.structure34[3],done=geometry.example(t),context={sessionId:'structure34',index:3};
  const record={support:false,attempts:[attempt(done)]};
  assert.equal(t.type,'x-s23-lines');
  assert.ok(geometry.valid(t,done));
  assert.equal(geometry.inspect(t,done).correct,true);
  const note=thinkingFeedback(t,done,record,context);
  assert.match(note.observation,/平行.*垂直/);
  assert.match(note.connection,/哪些关系没有变/);
  assert.equal(note.method.nodeId,'mt_FAXjFkgG6X');
  assert.equal(note.method.code,'ccss-math:MP.7');
  assert.equal(note.method.label,'数位、运算与图形中的结构');
  assert.doesNotMatch(note.observation,/你已掌握|你的解释正确|你独立证明/);
  assert.equal(thinkingFeedback(t,done,record,{sessionId:'lineproperties',index:2}),null,
    'the original lineproperties lesson has its own source mapping');
  assert.equal(thinkingFeedback(t,done,record,{sessionId:'structure34',index:2}),null);
  assert.equal(thinkingFeedback(t,done,{support:false,attempts:[]},context),null);
  const wrong=structuredClone(done);wrong.answers[0]='one';
  assert.equal(geometry.inspect(t,wrong).correct,false);
  assert.equal(thinkingFeedback(t,wrong,{attempts:[attempt(wrong)]},context),null);
  assert.equal(thinkingFeedback(t,wrong,record,context),null,'edited work cannot reuse a passed submission');
  const missing=structuredClone(done);missing.board.tests=missing.board.tests.filter(x=>x.parallel);
  assert.equal(thinkingFeedback(t,missing,{attempts:[attempt(missing)]},context),null,
    'tampered board cannot pass replay validation');
  assert.equal(thinkingFeedback(t,done,{support:true,attempts:[attempt(wrong),attempt(done)]},context).detail.some(x=>x.includes('提示')),true);
  const source=JSON.parse((await import('node:fs')).readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
  const node=source.groups.find(g=>g.code==='ccss-math:MP.7').nodes.find(n=>n.id==='mt_FAXjFkgG6X');
  assert.equal(node.displayName,note.method.label);
  assert.equal(node.lessonId,'structure34');
  assert.equal(node.goals.some(g=>g.tasks.some(q=>q.index===3&&q.type===t.type)),true);
});

test('MP.8 tables34 sequence uses only replay-checked native events and never labels a shared widget',async()=>{
  const {TASKS:B34}=await import('../dist/learning/phase5/b34.js');
  const p34=await import('../dist/learning/phase5/b34-model.js');
  const task=B34.tables34[2],context={sessionId:'tables34',index:2};
  const empty=p34.initial(task),done=p34.example(task);
  assert.equal(task.type,'x-p34-sequence');
  assert.equal(thinkingGuide(task,context)?.type,task.type);
  assert.match(thinkingGuide(task,context).question,/加几次50/);
  assert.equal(thinkingGuide(task,{sessionId:'linear34',index:2}),null);
  assert.equal(thinkingGuide(B34.tables34[0],{sessionId:'tables34',index:0}),null);
  assert.equal(thinkingFeedback(task,empty,null,context),null);
  assert.equal(thinkingFeedback(task,done,{attempts:[]},context),null);
  assert.equal(thinkingFeedback(task,done,{attempts:[attempt(empty)]},context),null);
  assert.equal(p34.valid(task,done),true);
  assert.equal(p34.inspect(task,done).correct,true);
  const result=thinkingFeedback(task,done,{attempts:[attempt(done)],support:false},context);
  assert.equal(result?.method?.nodeId,'mt_2jbUekyTu4');
  assert.equal(result.method.label,'延续表格中的规律');
  assert.equal(result.method.code,'ccss-math:MP.8');
  assert.match(result.observation,/50、100、150、200.*3 次加50.*250/);
  assert.match(result.detail.join(' '),/不能据此判断独立归纳/);
  assert.equal(thinkingFeedback(task,done,{attempts:[attempt(done)]},{sessionId:'general34',index:2}),null);
  assert.equal(thinkingFeedback(task,done,{attempts:[attempt(done)]},{sessionId:'tables34',index:0}),null);
  const wrong=structuredClone(done);wrong.answers[0]='240';
  assert.equal(p34.inspect(task,wrong).correct,false);
  assert.equal(thinkingFeedback(task,wrong,{attempts:[attempt(wrong)]},context),null);
  assert.equal(thinkingFeedback(task,wrong,{attempts:[attempt(done)]},context),null,'editing invalidates prior success');
  const extra=structuredClone(done);extra.value='350';
  assert.equal(thinkingFeedback(task,extra,{attempts:[attempt(done)]},context),null,'draft edits invalidate feedback');
  const forged=structuredClone(done);forged.board.values[2]=155;
  assert.equal(p34.valid(task,forged),false);
  assert.equal(thinkingFeedback(task,forged,{attempts:[attempt(forged)]},context),null);
  const noSteps=structuredClone(done);noSteps.history=[];
  assert.equal(p34.valid(task,noSteps),false);
  assert.equal(thinkingFeedback(task,noSteps,{attempts:[attempt(noSteps)]},context),null);
  const other=B34.linear34[2],otherDone=p34.example(other);
  assert.equal(thinkingFeedback(other,otherDone,{attempts:[attempt(otherDone)]},context),null,
    'a different actual task definition cannot claim MP.8 tables34');
  assert.equal(thinkingFeedback(other,otherDone,{attempts:[attempt(otherDone)]},{sessionId:'linear34',index:2}),null);
  const src=JSON.parse((await import('node:fs')).readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
  const node=src.groups.find(g=>g.code==='ccss-math:MP.8').nodes.find(n=>n.id===result.method.nodeId);
  assert.equal(node.lessonId,'tables34');
  assert.equal(node.displayName,result.method.label);
  assert.ok(node.goals.some(g=>g.tasks.some(q=>q.index===2&&q.type===task.type)));
  assert.equal(thinkingGuide(B34.structure34[3],{sessionId:'structure34',index:3})?.type,'x-s23-lines',
    'prior MP.7 guide remains bound to the original geometry position');
});
