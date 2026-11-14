import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import cases from './fixtures/p9-fraction-order-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionMeta} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as fractions from '../dist/learning/phase5/b17-model.js';
import {fractionOrderBinding,replayFractionOrderEvidence} from '../dist/learning/fraction-order-evidence.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const taskHash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const record=value=>({attempts:[{value:structuredClone(value)}]});
const apply=(t,m,a,d={})=>fractions.act(t,m,'b17-'+a,d);
const run=(t,m,steps)=>{for(const s of steps){if(s.field){m[s.field]=s.value;fractions.field(t,m,s.field);}else fractions.act(t,m,s.action,s.data);}return m;};
const original=(t,m)=>{assert.equal(fractions.valid(t,m),true);assert.equal(fractions.inspect(t,m).correct,true);};
const accepts=(t,m)=>{original(t,m);const proof=replayFractionOrderEvidence(t,m);assert.ok(proof);return proof;};
const rejects=(t,m,label)=>assert.equal(replayFractionOrderEvidence(t,m),null,label);
const positionExamples={
 'unitorder:0':['1/2','1/3','1/4','1/5'],
 'unitorder:1':['4/5','3/5','2/5','1/5'],
 'unitorder:2':['1/5','1/2','3/5'],
 'fractionchoices:1':['1/3','1/2','3/4'],
 'samepartcompare:0':['3/8','3/4'],
 'samepartcompare:1':['2/6','5/6'],
 'samepartcompare:2':['3/8','3/4'],
 'fractionbench:0':['3/8','5/12'],
 'fractionbench:1':['3/5','2/3','7/10'],
 'fractionbench:2':['3/7','5/8'],
 'beyondoneorder:0':['3/4','5/6','7/8','11/12'],
 'beyondoneorder:1':['4/3','7/5'],
 'beyondoneorder:2':['4/3','1 2/5','7/4'],
 'beyondoneorder:3':['7/9','5/6'],
 'simplestparts:1':['5/8','2/3'],
 'fdpswitch:2':['30%','1/3','0.35'],
 'fdpswitch:4':['30%','0.35','2/5'],
 'fractionsanity:2':['3/7','1/2','9/10'],
 'representations39:4':['3/7','5/8'],
 'representations39:5':['4/7','5/8']
};

test('only twenty reviewed native positions across nine exact sources bind fraction ordering',()=>{
 assert.equal(cases.length,20);assert.equal(new Set(cases.map(c=>c.nodeId)).size,9);
 const found=[];
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index],binding=fractionOrderBinding(task,c);
  assert.deepEqual(task.cards,c.cards);assert.equal(taskHash(task),c.taskHash);assert.equal(sessionMeta(c.id).topicId,c.nodeId);
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);
  assert.match(thinkingGuide(task,c)?.summary,/想一想/);
  for(const bad of [null,[],false,'unitorder',{}, {...c,index:String(c.index)},
   {...c,index:-1},{...c,sessionId:'__proto__'},{...c,index:999}])assert.equal(fractionOrderBinding(task,bad),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,cards:[...task.cards,'1/9']},
   {...task,desc:!task.desc}])assert.equal(fractionOrderBinding(changed,c),null);
 }
 const family=EVIDENCE_ADAPTERS.find(adapter=>adapter.id==='fraction-order');
 assert.ok(family);assert.equal(family.type,'x-fracorder');
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((task,index)=>{
  if(fractionOrderBinding(task,{sessionId:id,index}))found.push(id+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((task,index)=>{
  assert.equal(fractionOrderBinding(task,{sessionId:id,index}),null,id+':'+index);
 });
});

for(const c of cases)test(`${c.id}:${c.index} independently proves the actual fractions, ordering and latest submission`,()=>{
 const task=sessionTasks(c.id)[c.index],model=fractions.example(task),before=JSON.stringify(model),proof=accepts(task,model);
 assert.deepEqual(proof.cards,c.cards);assert.deepEqual(proof.ordered,positionExamples[c.id+':'+c.index]);
 assert.deepEqual(proof.shadeCounts,proof.fractions.map(r=>r[0]));
 assert.deepEqual(proof.placements,c.cards.map(card=>({card,position:card})));
 assert.equal(proof.direction,task.desc?'descending':'ascending');assert.equal(proof.aligned,!!task.mismatch);
 assert.equal(!!proof.common,!!task.common);assert.equal(!!proof.gaps,!!task.gaps);assert.equal(!!proof.benchmarks,!!task.benchmark);
 const saved=record(model),feedback=thinkingFeedback(task,model,saved,c);
 assert.ok(feedback);assert.equal(feedback.method,null);assert.ok(feedback.observation.length>10);
 assert.equal(thinkingFeedback(task,model,null,c),null);assert.equal(thinkingFeedback(task,model,saved,{}),null);
 const edited=structuredClone(model);edited.position='999';
 assert.equal(thinkingFeedback(task,edited,saved,c),null);assert.equal(thinkingFeedback(task,edited,record(edited),c),null);
 assert.equal(thinkingFeedback(task,model,{attempts:[{value:model},{value:edited}]},c),null);
 assert.ok(thinkingFeedback(task,JSON.parse(JSON.stringify(model)),JSON.parse(JSON.stringify(saved)),c));
 assert.equal(JSON.stringify(model),before,'proof generation cannot mutate saved work');
});

test('wrong initial predictions, legitimate selection and reversible shading do not imply failed mathematics',()=>{
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index],model=fractions.initial(task),steps=fractions.solveSteps(task);
  const prediction=[...Array(task.cards.length).keys()].reverse();
  for(const index of prediction)apply(task,model,'card',{index});apply(task,model,'predict');
  const after=steps.findIndex(s=>s.action==='b17-predict')+1;
  run(task,model,steps.slice(after));
  apply(task,model,'select',{index:0});apply(task,model,'select',{index:0});
  apply(task,model,'shade',{row:0,index:0});apply(task,model,'shade',{row:0,index:0});
  const proof=accepts(task,model);assert.deepEqual(proof.prediction,prediction.map(i=>task.cards[i]));
  assert.deepEqual(proof.ordered,positionExamples[c.id+':'+c.index]);
 }
});

test('common parts can be any valid shared denominator, with exact names and equal quantities',()=>{
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index];if(!task.common)continue;
  const model=fractions.example(task),den=model.board.common*2;assert.ok(den<=240);
  model.denom=String(den);apply(task,model,'common');
  for(let i=task.cards.length-1;i>=0;i--){
   apply(task,model,'select',{index:i});const[n,d]=fractions.frac(task.cards[i]);
   model.fraction=`${n*den/d}/${den}`;apply(task,model,'rename');
  }
  const proof=accepts(task,model);assert.equal(proof.common.denominator,den);
  assert.equal(proof.common.renames.length,task.cards.length);
 }
});

test('decimal, percent and mixed names are exact, while tied values allow either order',()=>{
 const mixed=sessionTasks('beyondoneorder')[2],mixedProof=accepts(mixed,fractions.example(mixed));
 assert.deepEqual(mixedProof.fractions,[[7,5],[4,3],[7,4]]);
 const task=sessionTasks('fdpswitch')[2],proof=accepts(task,fractions.example(task));
 assert.deepEqual(proof.fractions,[[3,10],[1,3],[7,20]]);
 const tied={type:'x-fracorder',cards:['1/2','0.50','50%'],max:1,prompt:'same amount'},model=fractions.initial(tied);
 const steps=fractions.solveSteps(tied).filter(s=>s.action!=='b17-order');run(tied,model,steps);
 for(const index of [2,0,1])apply(tied,model,'order',{index});
 assert.deepEqual(accepts(tied,model).ordered,['50%','1/2','0.50']);
});

test('distance to one and half benchmarks retain their separate exact meanings',()=>{
 const gapTask=sessionTasks('beyondoneorder')[0],gap=accepts(gapTask,fractions.example(gapTask));
 assert.deepEqual(gap.gaps.map(x=>x.distance),['1/4','1/8','1/6','1/12']);
 const halfTask=sessionTasks('fractionsanity')[2],half=accepts(halfTask,fractions.example(halfTask));
 assert.deepEqual(half.benchmarks.map(x=>x.relation),['<','=','>']);
 const sameSide=sessionTasks('representations39')[5],proof=accepts(sameSide,fractions.example(sameSide));
 assert.equal(proof.benchmarks,null);assert.equal(proof.common.denominator,56);
 assert.deepEqual(proof.common.renames.map(x=>x.name),['35/56','32/56']);
});

test('history, event schema, board, first prediction and mathematical fields are not interchangeable',()=>{
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index],model=fractions.example(task);
  const changes=[m=>{m.history=[];},m=>m.history.pop(),m=>m.history.reverse(),
   m=>{m.history[0].extra=true;},m=>{m.history[0].d.index='1.0';},
   m=>{m.history[0].f.extra='ignored';},m=>{m.board.parts[0]=[];},
   m=>{m.board.first=m.board.first.slice(1);},m=>{m.board.placements[0]='0';},
   m=>{m.history.find(e=>e.a==='place').f.position='0';},
   m=>{m.issue='failed';},m=>{m.position='0';},m=>{m.board.ordered.reverse();}];
  for(const change of changes){const bad=structuredClone(model);change(bad);rejects(task,bad,c.id+':'+c.index);}
 }
});

test('originally ignored global actions, duplicate mathematical records and impossible effects never earn evidence',()=>{
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index];
  for(const action of ['split','remember','predict','align','place']){
   const model=fractions.example(task);apply(task,model,action);original(task,model);
   rejects(task,model,c.id+':'+c.index+' '+action);
  }
  const model=fractions.example(task);apply(task,model,'shade',{row:0,index:999999});original(task,model);rejects(task,model);
  if(task.common){const model=fractions.example(task);apply(task,model,'rename');original(task,model);rejects(task,model);}
  if(task.gaps||task.benchmark){const model=fractions.example(task);apply(task,model,'landmark');original(task,model);rejects(task,model);}
 }
});

test('invalid attempted placement or common division cannot be hidden by later successful work',()=>{
 for(const [id,index,wrong,selected] of [['fdpswitch',2,'0.3',1],['beyondoneorder',2,'1.3',0]]){
  const task=sessionTasks(id)[index],model=fractions.initial(task),steps=fractions.solveSteps(task);
  let inserted=false;
  for(const step of steps){
   if(!inserted&&step.action==='b17-place'&&model.board.selected===selected){
    const correct=model.position;model.position=wrong;apply(task,model,'place');model.position=correct;inserted=true;
   }
   run(task,model,[step]);
  }
  original(task,model);rejects(task,model,'a wrong recorded location is still present in history');
 }
 const task=sessionTasks('fractionbench')[0],model=fractions.initial(task);
 for(const step of fractions.solveSteps(task)){
  if(step.action==='b17-common'){const current=model.denom;model.denom='7';apply(task,model,'common');model.denom=current;}
  run(task,model,[step]);
 }
 original(task,model);rejects(task,model);
});

test('current auxiliary inputs must still match the last recorded mathematical action',()=>{
 for(const [id,index,key,value] of [['fractionbench',0,'fraction','1/2'],
  ['fractionbench',0,'denom','48'],['beyondoneorder',0,'answer','0'],
  ['fractionsanity',2,'relation','<'],['fdpswitch',2,'position','1/3']]){
  const task=sessionTasks(id)[index],model=fractions.example(task);model[key]=value;
  rejects(task,model,id+':'+index+' '+key);
 }
});

test('malformed and precision-sensitive values fail closed without throwing',()=>{
 const task=sessionTasks('fdpswitch')[2],done=fractions.example(task);
 for(const bad of [null,undefined,[],false,{}, {...done,history:'bad'}, {...done,board:null}])rejects(task,bad);
 for(const raw of ['0.35000000000000001','1/0','NaN','Infinity','1e-3','process.exit()',
  '9007199254740993/27021597764222979','1'.repeat(501)]){
  const model=structuredClone(done);model.history.find(e=>e.a==='place').f.position=raw;rejects(task,model,raw);
 }
 for(const changed of [{...task,cards:[]},{...task,cards:['1/0','1/2']},{...task,common:'yes'},
  {...task,gaps:true,benchmark:true},{...task,max:0},{...task,cards:['-1','1/2']}])rejects(changed,done);
});
