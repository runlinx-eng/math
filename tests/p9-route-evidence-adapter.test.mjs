import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as routes from '../dist/learning/phase5/b11-model.js';
import {routeBinding,replayRouteEvidence} from '../dist/learning/route-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import fixture from './fixtures/p9-route-cases.cjs';

await ensureB39Ready();
const {cases}=fixture;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const hash=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
const expectedAnswer=task=>task.a+(task.op==='+'?task.b:-task.b);
const record=model=>({attempts:[{value:structuredClone(model)}]});
const accepted=(task,model)=>{
 assert.equal(routes.valid(task,model),true);assert.equal(routes.inspect(task,model).correct,true);
 const proof=replayRouteEvidence(task,model);assert.ok(proof);return proof;
};
const rejected=(task,model,message)=>assert.equal(replayRouteEvidence(task,model),null,message);
const begin=(task,guess='0')=>{
 const model=routes.initial(task);model.guess=guess;routes.act(task,model,'b11-route-start');return model;
};
const hop=(task,model,delta,landing=routes.location(task,model)+delta)=>{
 const scale=task.scale??1;model.jump=routes.fmt(delta,scale);model.landing=routes.fmt(landing,scale);
 routes.act(task,model,'b11-hop');return model;
};
const finish=(task,model)=>{model.answer=routes.fmt(expectedAnswer(task),task.scale??1);return model;};
const path=(task,deltas,guess='0')=>{
 const model=begin(task,guess);for(const delta of deltas)hop(task,model,delta);return finish(task,model);
};

test('fifteen reviewed original questions have eight exact sources and no inferred MP label',()=>{
 assert.equal(cases.length,15);assert.equal(new Set(cases.map(c=>c.nodeId)).size,8);
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index],binding=routeBinding(task,c);
  assert.equal(task.type,'x-routecalc');assert.equal(LESSONS[c.id].topicId,c.nodeId);
  assert.equal(hash(task),c.taskHash,'complete source task was deliberately reviewed');
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);
  assert.ok(binding.question.length>10);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},
   {...c,index:-1},{...c,index:10000},{...c,sessionId:'__proto__'}])assert.equal(routeBinding(task,context),null);
  for(const altered of [{...task,prompt:task.prompt+' changed'},{...task,a:task.a+1},
   {...task,b:task.b+1},{...task,op:task.op==='+'?'-':'+'},
   {...task,countup:!task.countup},{...task,compensation:!task.compensation}])assert.equal(routeBinding(altered,c),null);
 }
 const found=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((task,index)=>{
  if(routeBinding(task,{sessionId:id,index}))found.push(id+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 let associated=0;
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((task,index)=>{
  assert.equal(routeBinding(task,{sessionId:id,index}),null);
  if(task.type==='x-routecalc')associated++;
 });
 assert.equal(associated,9,'same-widget associated exercises remain separate');
});

for(const c of cases)test(`${c.id}:${c.index} independently replays the saved number-line path`,()=>{
 const task=sessionTasks(c.id)[c.index],model=routes.example(task),before=JSON.stringify(model);
 const proof=accepted(task,model),target=task.countup?task.a:expectedAnswer(task);
 assert.equal(proof.operation,task.op);assert.equal(proof.scale,1);
 assert.equal(proof.origin,task.countup?task.b:task.a);assert.equal(proof.target,target);
 assert.equal(proof.answer,expectedAnswer(task));assert.equal(proof.countup,!!task.countup);
 assert.equal(proof.netChange,target-proof.origin);
 assert.equal(proof.hops.length,model.hops.length);
 for(const h of proof.hops)assert.equal(h.from+h.delta,h.to);
 assert.equal(proof.hops.reduce((sum,h)=>sum+h.delta,0),proof.netChange);
 assert.equal(proof.steps.length,model.history.length-1);
 assert.equal(proof.forwardMoves,model.history.filter(e=>e.action==='b11-hop'&&routes.number(e.jump)>0).length);
 assert.equal(proof.backwardMoves,model.history.filter(e=>e.action==='b11-hop'&&routes.number(e.jump)<0).length);
 assert.equal(proof.undos,0);
 assert.deepEqual(proof.display.values,[String(task.a),String(task.b)]);
 assert.equal(proof.display.answer,String(expectedAnswer(task)));
 if(task.compensation){
  assert.ok(proof.compensation);assert.ok(proof.compensation.excess>0);
  assert.equal(proof.compensation.overshoot-proof.target,proof.compensation.excess);
  assert.equal(proof.compensation.returnDistance,proof.compensation.excess);
 }else assert.equal(proof.compensation,null);
 const saved=record(model);assert.ok(latestSubmissionMatches(model,saved));
 const edited=structuredClone(model);edited.answer+='0';assert.equal(latestSubmissionMatches(edited,saved),false);
 const newer={attempts:[...saved.attempts,{value:edited}]};assert.equal(latestSubmissionMatches(model,newer),false);
 const absent=structuredClone(model);absent.history=[];rejected(task,absent);
 assert.ok(latestSubmissionMatches(JSON.parse(JSON.stringify(model)),JSON.parse(JSON.stringify(saved))));
 assert.equal(JSON.stringify(model),before,'proof lookup never changes the workpiece');
});

test('valid wrong guesses and exact equivalent integer spellings remain real initial predictions',()=>{
 const task=sessionTasks('onesbridge')[2];
 for(const guess of ['0','  +0.00 ','−1','＋999']){
  const model=path(task,[4,3],guess);accepted(task,model);
  assert.equal(model.first,guess);assert.equal(model.history[0].guess,guess);
 }
 const model=begin(task,'0');model.jump='＋4.000';model.landing=' 40.000000 ';
 routes.act(task,model,'b11-hop');hop(task,model,3);accepted(task,finish(task,model));
});

test('alternative segmentations and effective undo preserve the full operation chain',()=>{
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index],delta=routes.destination(task)-routes.origin(task),sign=Math.sign(delta);
  const model=begin(task,'0');hop(task,model,sign);routes.act(task,model,'b11-hop-undo');
  assert.equal(routes.location(task,model),routes.origin(task));
  const values=task.compensation?[delta+2*sign,-sign,-sign]:[sign,delta-sign];
  for(const value of values)if(value)hop(task,model,value);
  const proof=accepted(task,finish(task,model));assert.equal(proof.undos,1);
  assert.equal(proof.steps[1].kind,'undo');assert.equal(proof.steps[1].delta,-sign);
  assert.equal(proof.hops.reduce((sum,h)=>sum+h.delta,0),delta);
 }
});

test('counting up reports the difference separately from destination and actual travelled distance',()=>{
 const task=sessionTasks('mentalbig')[1],model=path(task,[5000,-1000,2800]);
 const proof=accepted(task,model);
 assert.equal(proof.origin,3200);assert.equal(proof.target,10000);assert.equal(proof.answer,6800);
 assert.equal(proof.netChange,6800);assert.equal(proof.hops.reduce((n,h)=>n+Math.abs(h.delta),0),8800);
 model.answer='10000';rejected(task,model,'the endpoint is not the required difference');
});

test('compensation requires passing the target rather than merely including a backwards step',()=>{
 const task=sessionTasks('addhundred')[2];
 const falseCompensation=path(task,[-1,10]);
 assert.equal(routes.inspect(task,falseCompensation).correct,true,'original rule intentionally stays unchanged');
 rejected(task,falseCompensation,'a backwards-first path never passes its target');
 const overshootRemoved=begin(task);hop(task,overshootRemoved,10);routes.act(task,overshootRemoved,'b11-hop-undo');
 hop(task,overshootRemoved,-1);hop(task,overshootRemoved,10);finish(task,overshootRemoved);
 assert.equal(routes.inspect(task,overshootRemoved).correct,true);rejected(task,overshootRemoved,'an undone overshoot cannot certify the retained route');
 const detour=path(task,[12,-4,1]);const proof=accepted(task,detour);
 assert.equal(proof.compensation.overshoot,65);assert.equal(proof.compensation.excess,3);
 assert.equal(proof.compensation.returnDelta,-3);assert.equal(proof.compensation.returnDistance,3);
 assert.equal(proof.compensation.returnedInOneDirection,false,'feedback must describe net return, not invent a straight return');
});

test('real invalid, zero or mis-landed requests remain failed events after later correction',()=>{
 const task=sessionTasks('onesbridge')[2];
 for(const [delta,to] of [[0,36],[4,41],[1,1000000001]]){
  const model=begin(task);hop(task,model,delta,to);assert.ok(model.issue);
  hop(task,model,4);hop(task,model,3);finish(task,model);
  assert.equal(routes.inspect(task,model).correct,true);
  const p=replayRouteEvidence(task,model);assert.ok(p);assert.equal(p.failedRequests.length,1);
  assert.equal(p.failedRequests[0].from,p.failedRequests[0].to);assert.equal(p.hops.length,2);
  assert.deepEqual(p.failedRequests[0].raw,{jump:model.history[1].jump,landing:model.history[1].landing});
 }
 const textModel=begin(task);textModel.jump='1e0';textModel.landing='37';routes.act(task,textModel,'b11-hop');
 hop(task,textModel,4);hop(task,textModel,3);finish(task,textModel);
 assert.equal(routes.inspect(task,textModel).correct,true);
 const p=replayRouteEvidence(task,textModel);assert.ok(p);assert.equal(p.failedRequests[0].raw.jump,'1e0');
 assert.equal(p.forwardMoves,2);assert.equal(p.steps.length,2);
});

test('a final failed request preserves a completed route and its exact issue without inventing a move',()=>{
 const task=sessionTasks('onesbridge')[2],m=routes.example(task),before=structuredClone(m.hops);
 m.jump='0';m.landing=String(m.hops.at(-1).to);routes.act(task,m,'b11-hop');
 assert.ok(m.issue);assert.equal(routes.inspect(task,m).correct,true);
 const p=replayRouteEvidence(task,m);assert.ok(p);assert.equal(p.failedRequests.length,1);
 assert.deepEqual(m.hops,before);assert.equal(p.failedRequests[0].issue,m.issue);
 const forged=structuredClone(m);forged.issue='';rejected(task,forged,'a missing failure prompt is not the recorded state');
});

test('all reviewed paths reject malformed, omitted, reordered or fabricated event and model details',()=>{
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index],base=routes.example(task);
  const changes=[
   ['missing start',m=>m.history.shift()],['missing hop',m=>m.history.splice(1,1)],
   ['reverse events',m=>m.history.reverse()],['duplicate start',m=>m.history.splice(1,0,structuredClone(m.history[0]))],
   ['unknown action',m=>m.history[1].action='teleport'],['cross widget',m=>m.history.push({action:'b11-event',index:0})],
   ['old from',m=>m.history[1].from++],['string from',m=>m.history[1].from=String(m.history[1].from)],
   ['missing from',m=>delete m.history[1].from],['extra event field',m=>m.history[1].extra=true],
   ['empty jump',m=>m.history[1].jump=''],['nonfinite jump',m=>m.history[1].jump='Infinity'],
   ['hex jump',m=>m.history[1].jump='0x10'],['wrong landing',m=>m.history[1].landing='0'],
   ['extra start field',m=>m.history[0].from=0],['numeric guess',m=>m.history[0].guess=0],
   ['changed first',m=>m.first='777'],['changed current guess',m=>m.guess='777'],
   ['unstarted',m=>m.started=false],['active issue',m=>m.issue='bad step'],
   ['changed board hop',m=>m.hops[0].to++],['extra board hop field',m=>m.hops[0].extra=true],
   ['fake board',m=>m.board={hops:m.hops}],['extra model field',m=>m.extra=true],
   ['wrong answer',m=>m.answer='999999999'],['empty history',m=>m.history=[]]
  ];
  for(const [label,change] of changes){const model=structuredClone(base);change(model);rejected(task,model,c.id+':'+c.index+' '+label);}
  for(const value of [null,{},[],{...base,history:null},{...base,hops:null},{...base,first:null}])rejected(task,value);
 }
});

test('an undo must remove precisely the latest retained hop and cannot act on an empty path',()=>{
 const task=sessionTasks('onesbridge')[2],base=path(task,[4,3]);
 for(const event of [{action:'b11-hop-undo',hop:{delta:4,to:40}},
  {action:'b11-hop-undo',hop:{delta:3,to:43},from:43},
  {action:'b11-hop-undo',hop:{delta:'3',to:43}},
  {action:'b11-hop-undo',hop:{delta:3,to:43,extra:1}}]){
  const model=structuredClone(base);model.history.push(event);rejected(task,model);
 }
 const empty=structuredClone(base);empty.history.splice(1,0,{action:'b11-hop-undo',hop:{delta:4,to:40}});rejected(task,empty);
 const two=begin(task);hop(task,two,4);routes.act(task,two,'b11-hop-undo');
 two.history.push({action:'b11-hop-undo',hop:{delta:4,to:40}});hop(task,two,4);hop(task,two,3);finish(task,two);
 assert.equal(routes.inspect(task,two).correct,true);rejected(task,two);
});

test('integer smallest-unit conversion rejects fractional residues and unsupported numeric forms',()=>{
 const task=sessionTasks('onesbridge')[2],base=routes.example(task);
 for(const value of ['43.000001','43.00000000000000000001','4.3e1','0x2b','43x','43\n.0','NaN','1000000001']){
  const model=structuredClone(base);model.answer=value;rejected(task,model,value);
 }
 // A deliberately unbound scale probe proves exact conversion independently;
 // it does not broaden the fifteen reviewed native positions.
 const decimal={type:'x-routecalc',a:340,b:278,op:'+',prompt:'exact scale probe',scale:100,minSteps:2};
 const model=path(decimal,[200,78]);const proof=accepted(decimal,model);
 assert.equal(proof.answer,618);assert.equal(proof.display.answer,'6.18');
 assert.equal(proof.display.origin,'3.40');assert.equal(routeBinding(decimal,{sessionId:'onesbridge',index:2}),null);
 model.answer='6.180001';rejected(decimal,model);
 for(const changed of [{...decimal,scale:0},{...decimal,scale:3},{...decimal,scale:10000},
  {...decimal,minSteps:0},{...decimal,minSteps:'2'},{...decimal,unknownRule:true},
  {...decimal,countup:true},{...decimal,compensation:'true'},{...decimal,a:Number.MAX_SAFE_INTEGER}])rejected(changed,model);
});

test('the original hundred-hop bound, signed domain and repeated real movement are preserved',()=>{
 const task=sessionTasks('onesbridge')[3],model=begin(task);
 for(let i=0;i<98;i++)hop(task,model,i%2? -1:1);
 hop(task,model,2);hop(task,model,3);const proof=accepted(task,finish(task,model));
 assert.equal(proof.hops.length,100);
 hop(task,model,1);assert.ok(model.issue);model.issue='';rejected(task,model,'the recorded over-capacity hop remains invalid');
 const negative=path(task,[-50,55]);accepted(task,negative);
 assert.equal(negative.hops[0].to,-7,'the original signed number-line domain stays available');
});
