import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import cases from './fixtures/p9-groups-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as groups from '../dist/learning/phase5/b13-model.js';
import {groupsBinding,replayGroupsEvidence} from '../dist/learning/groups-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';

await ensureB39Ready();
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const taskHash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const taskFor=c=>sessionTasks(c.sessionId)[c.index];
const act=(task,model,name,data={})=>groups.act(task,model,'b13-'+name,data);
const answerFields=(task,model)=>{
 for(const s of groups.solveSteps(task))if(s.field&&['answer','equation','addition','rest'].includes(s.field))model[s.field]=s.value;
 return model;
};
const run=(task,model)=>{
 for(const step of groups.solveSteps(task))if(step.field)model[step.field]=step.value;else groups.act(task,model,step.action,step.data);
 return model;
};
const originalAccepts=(task,model)=>{
 assert.equal(groups.valid(task,model),true);assert.equal(groups.inspect(task,model).correct,true);
};
const accepts=(task,model)=>{
 originalAccepts(task,model);const before=JSON.stringify(model),proof=replayGroupsEvidence(task,model);
 assert.ok(proof);assert.equal(JSON.stringify(model),before,'evidence is read-only');return proof;
};
const rejects=(task,model,label)=>assert.equal(replayGroupsEvidence(task,model),null,label);

test('29 reviewed native positions bind 14 exact source nodes and no associated work',()=>{
 assert.equal(cases.length,29);assert.equal(new Set(cases.map(c=>c.nodeId)).size,14);
 const expected=cases.map(c=>c.sessionId+':'+c.index).sort(),found=[];
 for(const c of cases){
  const task=taskFor(c),binding=groupsBinding(task,c);
  assert.equal(taskHash(task),c.taskHash);
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);
  assert.deepEqual([task.mode,task.a,task.b,task.total],[c.mode,c.groups,c.each,c.total]);
  assert.equal(LESSONS[c.sessionId].topicId,c.nodeId);
  assert.ok(binding.question.length>15);assert.ok(!binding.question.includes(String(c.total)+'='+String(c.total)));
  for(const context of [null,[],false,'equalgroups',{}, {...c,index:String(c.index)},
   {...c,index:-1},{...c,sessionId:'__proto__'},{...c,sessionId:'constructor'}])
   assert.equal(groupsBinding(task,context),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,total:task.total+1},
   {...task,a:task.a+1},{...task,b:task.b+1},{...task,type:'x-mularray'}])
   assert.equal(groupsBinding(changed,c),null);
 }
 for(const sessionId of Object.keys(LESSONS))sessionTasks(sessionId).forEach((task,index)=>{
  if(groupsBinding(task,{sessionId,index}))found.push(sessionId+':'+index);
 });
 assert.deepEqual(found.sort(),expected);
 let sameType=0;
 for(const sessionId of Object.keys(BRIDGES))sessionTasks(sessionId).forEach((task,index)=>{
  assert.equal(groupsBinding(task,{sessionId,index}),null,sessionId+':'+index);
  if(task.type==='x-mulgroups')sameType++;
 });
 assert.equal(sameType,24,'associated copies remain separate from 29 native tasks');
});

for(const c of cases)test(`${c.sessionId}:${c.index} checks each object's identity and the answer's mathematical role`,()=>{
 const task=taskFor(c),model=groups.example(task),proof=accepts(task,model);
 assert.deepEqual([proof.mode,proof.groups,proof.each,proof.total],[c.mode,c.groups,c.each,c.total]);
 assert.deepEqual(proof.counts,Array(c.groups).fill(c.each));
 assert.equal(proof.remainder,c.total-c.groups*c.each);
 assert.equal(proof.resultRole,c.mode==='build'?'total':c.mode==='share'?'each':'groups');
 assert.equal(proof.result,c.mode==='build'?c.total:c.mode==='share'?c.each:c.groups);
 assert.equal(proof.created,c.mode==='build'?c.total:0);
 assert.equal(proof.homes.length,c.total);assert.equal(proof.steps.length,model.history.length);
 for(const step of proof.steps){
  assert.equal(step.totalAfter-step.totalBefore,step.created.length);
  assert.equal(step.counts.reduce((n,x)=>n+x,step.remainder),step.totalAfter);
  assert.equal(new Set(step.moves.map(m=>m.token)).size,step.moves.length);
  assert.ok(step.moves.every(m=>m.from!==m.to&&m.token<step.totalBefore));
  assert.ok(step.created.every(i=>i>=step.totalBefore&&i<step.totalAfter));
  if(c.mode!=='build')assert.equal(step.totalAfter,c.total);
 }
 const record={attempts:[{value:structuredClone(model)}]};
 assert.equal(latestSubmissionMatches(model,record),true);
 const edited=structuredClone(model);edited.answer='999';
 assert.equal(latestSubmissionMatches(edited,record),false);rejects(task,edited);
 assert.equal(latestSubmissionMatches(model,{attempts:[{value:model},{value:edited}]}),false);
 assert.ok(replayGroupsEvidence(task,JSON.parse(JSON.stringify(model))));
 for(const mutate of [m=>m.history=[],m=>m.history.pop(),m=>m.board.buckets++,
  m=>m.board.homes.push(0),m=>m.board.selected.push(999),m=>m.answer='999',
  m=>m.equation='1=1',m=>m.issue='bad',m=>m.extra=true,m=>m.history[0].extra=true,
  m=>m.history[0].data.extra=true,m=>m.history[0].data.index=0,
  m=>m.history[0].data.rows='2',m=>m.history[0].action='b13-shape']){
  const changed=structuredClone(model);mutate(changed);rejects(task,changed,c.sessionId+':'+c.index);
 }
});

test('filling containers in reverse order preserves roles without requiring a canonical token order',()=>{
 for(const c of cases){
  const task=taskFor(c),model=groups.initial(task);
  if(c.mode!=='share')for(let i=0;i<c.groups;i++)act(task,model,'plate-add');
  if(c.each)for(let i=c.groups-1;i>=0;i--){model.amount=String(c.each);act(task,model,'pour',{bucket:i});}
  answerFields(task,model);const proof=accepts(task,model);
  assert.deepEqual(proof.counts,Array(c.groups).fill(c.each));
  assert.equal(proof.remainder,c.total-c.groups*c.each);
 }
});

test('round-robin distribution keeps the original finite pool and leaves the true remainder',()=>{
 for(const c of cases.filter(c=>c.mode==='share')){
  const task=taskFor(c),model=groups.initial(task);
  for(let n=0;n<c.each;n++)act(task,model,'round');
  answerFields(task,model);const proof=accepts(task,model);
  assert.equal(proof.rounds,c.each);assert.equal(proof.moved,c.groups*c.each);
  assert.equal(proof.created,0);assert.equal(proof.remainder,c.total%c.groups);
 }
});

test('selection, dragging, moving back and replacing conserve the same objects',()=>{
 const task=taskFor(cases.find(c=>c.sessionId==='sharegroups'&&c.index===0)),model=groups.initial(task);
 for(let token=0;token<task.total;token++)act(task,model,'drop',{token,bucket:token%task.a});
 act(task,model,'token',{token:0});act(task,model,'token',{token:2});
 // A selected pour uses the chosen objects, not the visible amount input.
 model.amount='not-a-number';act(task,model,'pour',{bucket:1});
 act(task,model,'token',{token:0});act(task,model,'token',{token:2});
 act(task,model,'drop',{bucket:-1});
 model.amount='2';act(task,model,'pour',{bucket:0});
 answerFields(task,model);const proof=accepts(task,model);
 assert.equal(proof.total,10);assert.equal(proof.created,0);assert.equal(proof.moved,16);
 assert.deepEqual(proof.counts,[5,5]);
 assert.deepEqual(proof.steps.filter(s=>s.action==='b13-drop').at(-1).moves,
  [{token:0,from:1,to:-1},{token:2,from:1,to:-1}]);
});

test('building reuses returned objects before creating new identities',()=>{
 const task=taskFor(cases[0]),model=groups.initial(task);
 act(task,model,'plate-add');act(task,model,'plate-remove');
 for(let i=0;i<task.a;i++)act(task,model,'plate-add');
 model.amount='2';act(task,model,'pour',{bucket:0});
 act(task,model,'token',{token:0});act(task,model,'token',{token:1});
 act(task,model,'drop',{bucket:-1});
 act(task,model,'pour',{bucket:1});
 act(task,model,'pour',{bucket:0});act(task,model,'pour',{bucket:2});
 answerFields(task,model);const proof=accepts(task,model);
 assert.equal(proof.created,6);assert.equal(proof.total,6);assert.equal(proof.moved,4);
 assert.deepEqual(proof.steps.filter(s=>s.action==='b13-pour').map(s=>s.created.length),[2,0,2,2]);
});

test('zero objects still require real empty-group construction and one retains its true role',()=>{
 const zero=taskFor(cases.find(c=>c.sessionId==='mentalproducts'&&c.index===1));
 const proof=accepts(zero,groups.example(zero));
 assert.deepEqual([proof.groups,proof.each,proof.total,proof.created,proof.moved],[5,0,0,0,0]);
 assert.equal(proof.steps.length,5);assert.ok(proof.steps.every(s=>s.action==='b13-plate-add'));
 const blank=answerFields(zero,groups.initial(zero));rejects(zero,blank);
 for(const index of [2,3]){
  const task=taskFor(cases.find(c=>c.sessionId==='mentalproducts'&&c.index===index));
  const p=accepts(task,groups.example(task));assert.equal(p.result,index===2?6:8);
 }
});

test('equation meaning is not interchangeable between sharing and counting groups',()=>{
 for(const c of cases){
  const task=taskFor(c),model=groups.example(task);
  for(const equation of [model.equation,model.equation.split('=').reverse().join('='),
   model.equation.replace(/×/g,' * ').replace(/÷/g,' / ').replace(/=/g,'＝')]){
   model.equation=equation;accepts(task,model);
  }
  for(const equation of [`${c.total}=${c.total}`,'1=1','0/0=0',
   `${c.groups}.0000000000000001×${c.each}=${c.total}`,
   `${c.total}÷0=${c.groups}`,model.equation+'=1']){
   model.equation=equation;rejects(task,model,equation);
  }
  if(c.mode==='share'&&c.groups!==c.each&&!task.remainder){
   model.equation=`${c.total}÷${c.each}=${c.groups}`;model.answer=String(c.groups);rejects(task,model,'wrong division question');
  }
  if(task.remainder){const correct=groups.example(task);correct.rest='0';rejects(task,correct,'remainder cannot disappear');}
  if(task.repeated){const correct=groups.example(task);correct.addition='1=1';rejects(task,correct,'each addend must represent one group');}
 }
});

test('failed or ineffective historical actions never become evidence after a later correction',()=>{
 const task=taskFor(cases.find(c=>c.sessionId==='sharegroups'&&c.index===0));
 for(const kind of ['zero-pour','no-pool','same-destination','cross-widget','unknown-token','reset']){
  let model=groups.example(task);
  if(kind==='zero-pour'){model.amount='0';act(task,model,'pour',{bucket:0});act(task,model,'token',{token:0});}
  if(kind==='no-pool'){act(task,model,'round');act(task,model,'token',{token:0});}
  if(kind==='same-destination'){act(task,model,'token',{token:0});act(task,model,'pour',{bucket:0});}
  if(kind==='cross-widget')act(task,model,'turn');
  if(kind==='unknown-token')act(task,model,'token',{token:199});
  if(kind==='reset'){act(task,model,'reset');run(task,model);}
  originalAccepts(task,model);rejects(task,model,kind);
 }
 const build=taskFor(cases[0]),model=groups.example(build);
 act(build,model,'plate-remove');act(build,model,'token',{token:0});
 originalAccepts(build,model);rejects(build,model,'cannot delete a full group and hide the failure');
});

test('invalid task domains, exact scalar boundaries and malformed models fail closed',()=>{
 const task=taskFor(cases[0]),model=groups.example(task);
 for(const changed of [null,{}, {...task,a:0},{...task,a:13},{...task,b:-1},
  {...task,b:0.5},{...task,total:145},{...task,total:7},{...task,mode:'other'},
  {...task,remainder:true},{...task,remainder:'yes'},{...task,repeated:1}])rejects(changed,model);
 for(const changed of [null,[],false,'bad',{}, {...model,history:null},{...model,history:[null]},
  {...model,history:Array(5001).fill(model.history[0])},{...model,amount:0},
  {...model,answer:'6.0000000000000001'}])rejects(task,changed);
 for(const value of [-1,0,13,1.5,Infinity,NaN]){
  const changed=structuredClone(model),event=changed.history.find(e=>e.action==='b13-pour');
  event.data.amount=String(value);rejects(task,changed);
 }
});


test('feedback distinguishes a total, a per-group amount, a group count, zero and a true remainder',()=>{
 for(const c of cases){
  const task=taskFor(c),model=groups.example(task),record={attempts:[{value:structuredClone(model)}]},proof=accepts(task,model);
  assert.match(thinkingGuide(task,c)?.summary,/每份、份数和总量/);
  const feedback=thinkingFeedback(task,model,record,c);
  assert.ok(feedback);assert.equal(feedback.method,null);
  const role=task.mode==='build'?'全部物品的总量':task.mode==='share'?'每份的数量':'份数';
  assert.ok(feedback.observation.includes(`填写的 ${proof.result} 表示${role}`));
  assert.ok(feedback.detail.some(line=>line.includes('没有自动评价自由解释')));
  if(c.each===0){
   assert.ok(feedback.detail.some(line=>line.includes('每份0个，合在一起仍是0个')));
   assert.ok(feedback.observation.includes('份空容器'));
   assert.doesNotMatch(feedback.observation+feedback.detail.join(''),/放入物品|实际分放|分放时/,'zero objects cannot imply a placement event');
  }
  if(proof.remainder)assert.ok(feedback.detail.some(line=>line.includes('桌上剩下 1 个，比 3 份少')));
  const changed=structuredClone(model);changed.answer='999';
  assert.equal(thinkingFeedback(task,changed,record,c),null);
  assert.equal(thinkingFeedback(task,model,{attempts:[...record.attempts,{value:changed}]},c),null);
 }
});
