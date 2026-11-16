import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {PRACTICE} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b18-model.js';
import * as V from '../dist/learning/phase5/b18-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import {mixedTradeBinding,replayMixedTradeEvidence} from '../dist/learning/mixedtrade-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import fixture from './fixtures/p9-mixedtrade-cases.cjs';

// These tests never call the production evidence helper, the original solveSteps,
// or M.example. Expected source quantities are fixed independently in the fixture.
await ensureB39Ready();
const {cases,bridges,practices}=fixture;
const FIELDS=['guess','equation','answer','whole','part','factor','choice','low','high','inside','story','tile','count','simple','inverse','scaledA','scaledB','decimal','denom','unit','amount','result'];
const stockKeys=['started','w','p','takenW','takenP','trades'];
const actions=['split','merge','all-pieces','take-whole','take-part'];
const cp=x=>structuredClone(x);
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex');
const hash=x=>digest(JSON.stringify(stable(x)));
const taskFor=c=>sessionTaskFor(c.id,c.index);
const stock=m=>Object.fromEntries(stockKeys.map(k=>[k,m.board[k]]));
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){const r=a%b;a=b;b=r;}return a;};
const rational=(n,d=1)=>{n=BigInt(n);d=BigInt(d);const g=gcd(n,d);return[Number(n/g),Number(d/g)];};
const text=r=>r[1]===1?String(r[0]):r.join('/');
const units=(t,s)=>BigInt(s.w)*BigInt(t.d)+BigInt(s.p);
const removed=(t,s)=>BigInt(s.takenW)*BigInt(t.d)+BigInt(s.takenP);
const metrics={acceptedChecks:0,fields:0,buttons:0,stockGraphs:[],actualChromium:false};
const buttons=(t,m)=>(V.render(t,m).match(/<button\b[^>]*>/g)||[]);
const button=(t,m,a)=>buttons(t,m).filter(s=>s.includes(`data-x="b18-${a}"`));
const fill=(t,m,key,value)=>{
 const html=V.render(t,m);assert.ok(html.includes(`data-xfield="${key}"`),`${key} must be a visible original field`);
 m[key]=String(value);M.field(t,m,key);metrics.fields++;return m;
};
const rawAct=(t,m,a,data={})=>M.act(t,m,'b18-'+a,data);
const act=(t,m,a)=>{
 const found=button(t,m,a);assert.equal(found.length,1,`${a} must be present exactly once`);
 assert.doesNotMatch(found[0],/\bdisabled\b/,`${a} must be enabled`);
 metrics.buttons++;rawAct(t,m,a);assert.equal(M.valid(t,m),true);return m;
};
const begin=(c,guess='0')=>{const t=taskFor(c),m=M.initial(t);fill(t,m,'guess',guess);act(t,m,'start');return m;};
const answers=(c,m,values={})=>{
 const t=taskFor(c),e=c.expected;
 fill(t,m,'whole',values.whole??e.final.w);
 fill(t,m,'part',values.part??text(rational(e.final.p,e.denominator)));
 fill(t,m,'answer',values.answer??text(e.result));return m;
};
const finish=(c,m)=>{
 const t=taskFor(c);
 if(t.op==='-'){
  while(m.board.takenW<t.b[0])act(t,m,'take-whole');
  while(m.board.takenP<t.b[1]){if(m.board.p===0)act(t,m,'split');act(t,m,'take-part');}
 }
 while(m.board.p>=t.d)act(t,m,'merge');
 return answers(c,m);
};
const build=(c,{guess='0',allPieces=false,detour=false}={})=>{
 const t=taskFor(c),m=begin(c,guess);
 if(detour){act(t,m,'split');act(t,m,'merge');}
 if(allPieces)act(t,m,'all-pieces');
 return finish(c,m);
};
const accepted=(c,m)=>{
 const t=taskFor(c),e=c.expected,before=JSON.stringify(m);
 assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
 const p=replayMixedTradeEvidence(t,m);assert.ok(p,`${c.id}:${c.index} accepts a real correct workpiece`);
 assert.equal(JSON.stringify(m),before,'strict replay is read-only');
 assert.equal(p.operation,t.op);assert.equal(p.denominator,e.denominator);
 assert.deepEqual(p.operandA,e.operandA);assert.deepEqual(p.operandB,e.operandB);
 assert.deepEqual(p.initialQuantity,e.initialQuantity);assert.deepEqual(p.result,e.result);
 assert.deepEqual(p.remainingQuantity,e.result);
 assert.deepEqual(p.removedQuantity,t.op==='-'?e.operandB:[0,1]);
 assert.deepEqual(p.unitValue,[1,t.d]);assert.deepEqual(p.finalConstruction,stock(m));
 assert.deepEqual([m.board.w,m.board.p],[e.final.w,e.final.p]);
 assert.deepEqual([m.board.takenW,m.board.takenP],[e.requiredTaken.w,e.requiredTaken.p]);
 assert.deepEqual(p.whole.value,[e.final.w,1]);
 assert.deepEqual(p.part.value,rational(e.final.p,e.denominator));assert.deepEqual(p.answer.value,e.result);
 for(const field of ['whole','part','answer']){
  assert.equal(p[field].raw,m[field]);assert.equal(p[field].submissionOnly,true);
 }
 assert.equal(p.eventCount,m.history.length);assert.equal(p.events.length,m.history.length);
 assert.deepEqual(p.events.map(x=>x.historyIndex),m.history.map((_,i)=>i));
 assert.deepEqual(p.events.map(x=>x.action),m.history.map(x=>x.a));
 assert.deepEqual(p.failedRequests,p.events.filter(x=>!x.accepted));
 assert.deepEqual(p.resets,p.events.filter(x=>x.action==='reset'));
 assert.deepEqual(p.exchanges,p.events.filter(x=>['split','merge','all-pieces'].includes(x.action)));
 assert.deepEqual(p.removals,p.events.filter(x=>['take-whole','take-part'].includes(x.action)));
 assert.equal(p.issue,m.issue);
 assert.deepEqual(p.systemGenerated,{referenceWhole:true,initialStock:true,combinedAddends:t.op==='+',quantityCaptions:true});
 assert.equal(p.assessmentLimits.method,null);assert.equal(p.assessmentLimits.recordingLimit,1200);
 for(const name of ['physicalActionAssessed','independentDrawingAssessed','openExplanationAssessed','generalMasteryAssessed','exactKeystrokeOrderKnown','allLaterClicksRecorded'])
  assert.equal(p.assessmentLimits[name],false,name);
 metrics.acceptedChecks++;return p;
};
const rejected=(c,m,label)=>assert.equal(replayMixedTradeEvidence(taskFor(c),m),null,label);
const originalOnly=(c,m,label)=>{
 assert.equal(M.valid(taskFor(c),m),true,label+' retains original validation');
 assert.equal(M.inspect(taskFor(c),m).correct,true,label+' retains original grading');rejected(c,m,label);
};

test('independent B18 fingerprints enumerate exactly three native, three associated and one practice position',()=>{
 assert.equal(cases.length,3);assert.equal(new Set(cases.map(c=>c.nodeId)).size,1);
 assert.deepEqual(Object.keys(M.fields),FIELDS);
 for(const[path,expected]of Object.entries(fixture.sourceHashes))
  assert.equal(digest(fs.readFileSync(new URL('../'+path,import.meta.url))),expected,path);
 for(const c of [...cases,...bridges,...practices]){
  const t=taskFor(c);assert.equal(hash(t),c.taskHash);assert.deepEqual(t,c.task);
  assert.equal((LESSONS[c.id]||BRIDGES[c.id]).topicId,c.nodeId);
  const a=BigInt(t.a[0])*BigInt(t.d)+BigInt(t.a[1]),b=BigInt(t.b[0])*BigInt(t.d)+BigInt(t.b[1]);
  assert.deepEqual(rational(a,t.d),c.expected.operandA);assert.deepEqual(rational(b,t.d),c.expected.operandB);
  assert.deepEqual(rational(t.op==='+'?a+b:a-b,t.d),c.expected.result);
 }
 const native=[],bound=[],associated=[],practice=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-mixedtrade')native.push(id+':'+index);
  if(mixedTradeBinding(t,{sessionId:id,index}))bound.push(id+':'+index);
 });
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  assert.equal(mixedTradeBinding(t,{sessionId:id,index}),null);
  if(t.type==='x-mixedtrade')associated.push(id+':'+index);
 });
 for(const[id,t]of Object.entries(PRACTICE)){
  assert.equal(mixedTradeBinding(t,{sessionId:id,index:-1}),null);
  if(t.type==='x-mixedtrade')practice.push(id+':-1');
 }
 assert.deepEqual(native.sort(),cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(bound.sort(),native);
 assert.deepEqual(associated.sort(),bridges.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(practice.sort(),practices.map(c=>c.id+':-1').sort());
 assert.deepEqual(cases.map(c=>c.expected.result),[[22,5],[5,2],[5,2]]);
});

test('bindings require the complete native task, typed context and exact source position',()=>{
 for(const c of cases){
  const t=taskFor(c),binding=mixedTradeBinding(t,c);assert.ok(binding);
  assert.equal(binding.nodeId,c.nodeId);assert.equal(binding.method,null);
  assert.equal(typeof binding.question,'string');assert.ok(binding.question.length>10);
  assert.deepEqual(mixedTradeBinding(cp(t),c),binding);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},{...c,index:-1},{...c,index:9},
   {...c,sessionId:'constructor'},{...c,sessionId:'__proto__'}])assert.equal(mixedTradeBinding(t,context),null);
  for(const changed of [{...t,prompt:t.prompt+' changed'},{...t,a:[t.a[0]+1,t.a[1]]},
   {...t,b:[t.b[0],t.b[1]+1]},{...t,d:t.d+1},{...t,op:t.op==='+'?'-':'+'},
   {...t,trade:!t.trade},{...t,extra:true},{...t,type:'x-fractioncase'}])assert.equal(mixedTradeBinding(changed,c),null);
 }
});

for(const c of cases)test(`${c.id}:${c.index} accepts hand-calculated results through distinct original visible paths`,()=>{
 const t=taskFor(c);
 for(const options of [{},{allPieces:true},{detour:true},{allPieces:true,detour:true}]){
  const m=build(c,options),p=accepted(c,m);
  assert.equal(p.firstGuess.raw,'0');assert.deepEqual(p.firstGuess.value,[0,1]);
  assert.equal(p.firstGuess.matchesResult,false);assert.deepEqual(p.currentGuess,p.firstGuess);
  const start=p.events[0];assert.equal(start.action,'start');assert.equal(start.stockGeneratedByTool,true);
  assert.equal(start.firstStored,true);assert.deepEqual([start.after.w,start.after.p],[c.expected.initial.w,c.expected.initial.p]);
  if(options.allPieces){const x=p.exchanges.find(x=>x.action==='all-pieces');
   assert.equal(x.wholesExchanged,c.expected.initial.w);assert.equal(x.piecesExchanged,c.expected.initial.w*t.d);
   assert.equal(x.after.trades-x.before.trades,c.expected.initial.w);
  }
 }
});

// Finite stock graph: trades are quotiented only as zero/nonzero when finding
// reachable states. Every examined edge retains its actual trade count/history.
const stateKey=s=>[s.w,s.p,s.takenW,s.takenP,s.trades>0].join(':');
const enabled=(t,s,a)=>a==='split'||a==='all-pieces'?s.w>0:a==='merge'?s.p>=t.d:
 a==='take-whole'?t.op==='-'&&s.takenW<t.b[0]:t.op==='-'&&s.takenP<t.b[1];
const transition=(t,s,a)=>{
 const next={...s};let issue='',accepted=true,exchange=0,taken=0,removedAs;
 if(a==='split'||a==='all-pieces'){
  exchange=a==='split'?1:s.w;next.w-=exchange;next.p+=exchange*t.d;next.trades+=exchange;
 }else if(a==='merge'){exchange=1;next.w++;next.p-=t.d;next.trades++;}
 else if(a==='take-whole'){
  if(s.w){next.w--;removedAs='whole-token';}
  else if(s.p>=t.d){next.p-=t.d;removedAs='fraction-pieces';}
  else{accepted=false;issue='现在没有足够的一整份可以拿走。';}
  if(accepted){next.takenW++;taken=t.d;}
 }else if(s.p){next.p--;next.takenP++;taken=1;removedAs='fraction-pieces';}
 else{accepted=false;issue='小份不够了，可以把一个整体换开；量不会变。';}
 return{next,issue,accepted,exchange,taken,removedAs};
};
for(const c of cases)test(`${c.id}:${c.index} independently exhausts the finite reachable stock graph and every visible action edge`,()=>{
 const t=taskFor(c),initial=begin(c),queue=[initial],seen=new Set([stateKey(stock(initial))]);
 let states=0,edges=0,disabledOrHidden=0,failed=0,implicitWhole=0,completedStates=0;
 for(let cursor=0;cursor<queue.length;cursor++){
  const m=queue[cursor],s=stock(m);states++;
  const visual=V.visual(t,m);
  assert.equal((visual.match(/class="b18-one"/g)||[]).length,s.w);
  assert.equal((visual.match(/class="b18-piece"/g)||[]).length,s.p);
  assert.ok(visual.includes(`现在有 ${s.w} 个整体和 ${s.p} 个小份`));
  assert.equal(units(t,s)+removed(t,s),BigInt(c.expected.initial.w*t.d+c.expected.initial.p));
  const checked=answers(c,cp(m));
  const done=s.w===c.expected.final.w&&s.p===c.expected.final.p&&
   s.takenW===c.expected.requiredTaken.w&&s.takenP===c.expected.requiredTaken.p&&(!t.trade||s.trades>0);
  assert.equal(M.inspect(t,checked).correct,done);
  if(done){accepted(c,checked);completedStates++;}else rejected(c,checked,'quantity and removal completion independently determined');
  for(const a of actions){
   const found=button(t,m,a),can=enabled(t,s,a);
   if(!can){disabledOrHidden++;assert.ok(found.length===0||/\bdisabled\b/.test(found[0]));continue;}
   const expected=transition(t,s,a),next=cp(m),historyIndex=next.history.length;
   act(t,next,a);edges++;
   assert.deepEqual(stock(next),expected.next);assert.equal(next.issue,expected.issue);
   assert.equal(units(t,stock(next)),units(t,s)-BigInt(expected.taken));
   assert.equal(removed(t,stock(next)),removed(t,s)+BigInt(expected.taken));
   if(!expected.accepted)failed++;
   if(a==='take-whole'&&expected.removedAs==='fraction-pieces')implicitWhole++;
   const completed=finish(c,cp(next)),p=accepted(c,completed),event=p.events[historyIndex];
   assert.deepEqual(event.before,s);assert.deepEqual(event.after,expected.next);
   assert.equal(event.accepted,expected.accepted);assert.equal(event.issue,expected.issue);
   assert.equal(event.constructionChanged,JSON.stringify(s)!==JSON.stringify(expected.next));
   assert.equal(event.remainingUnitsBefore,Number(units(t,s)));assert.equal(event.remainingUnitsAfter,Number(units(t,expected.next)));
   assert.equal(event.removedUnitsBefore,Number(removed(t,s)));assert.equal(event.removedUnitsAfter,Number(removed(t,expected.next)));
   assert.deepEqual(event.quantityBefore,rational(units(t,s),t.d));assert.deepEqual(event.quantityAfter,rational(units(t,expected.next),t.d));
   if(expected.exchange){assert.equal(event.wholesExchanged,expected.exchange);assert.equal(event.piecesExchanged,expected.exchange*t.d);}
   if(expected.taken){assert.equal(event.takenUnits,expected.taken);assert.equal(event.removedAs,expected.removedAs);}
   const key=stateKey(expected.next);if(!seen.has(key)){seen.add(key);queue.push(next);}
  }
 }
 // Independent count check: all stock partitions plus no-exchange paths are
 // 5+1, (6+5+4+3)*2+8, and (5*3+4*3)+(4*3+3*3)+6 respectively.
 const expectedGraphs=[
  {index:0,states:6,visibleEdges:15,disabledOrHidden:15,failed:0,implicitWhole:0,completedStates:1},
  {index:1,states:44,visibleEdges:158,disabledOrHidden:62,failed:0,implicitWhole:6,completedStates:2},
  {index:2,states:54,visibleEdges:197,disabledOrHidden:73,failed:4,implicitWhole:6,completedStates:1}
 ];
 const graph={index:c.index,states,visibleEdges:edges,disabledOrHidden,failed,implicitWhole,completedStates};
 assert.deepEqual(graph,expectedGraphs[c.index]);metrics.stockGraphs.push(graph);
});

test('the generated initial addition stock is attributed to the tool rather than a recorded physical joining action',()=>{
 const c=cases[0],t=taskFor(c),m=begin(c),before=V.visual(t,M.initial(t));
 assert.equal((before.match(/class="b18-one"/g)||[]).length,0);
 assert.equal((V.visual(t,m).match(/class="b18-one"/g)||[]).length,3);
 assert.equal((V.visual(t,m).match(/class="b18-piece"/g)||[]).length,7);
 const p=accepted(c,finish(c,m));assert.equal(p.systemGenerated.combinedAddends,true);
 assert.deepEqual(p.events.map(x=>x.action),['start','merge']);
 assert.equal(p.events[0].stockGeneratedByTool,true);assert.equal(p.exchanges.length,1);
});

test('taking a whole directly from d loose pieces changes removal counts without inventing an exchange',()=>{
 for(const c of cases.filter(c=>c.task.op==='-')){
  const t=taskFor(c),m=begin(c);act(t,m,'all-pieces');
  const trades=m.board.trades,before=cp(m.board);act(t,m,'take-whole');
  assert.equal(m.board.trades,trades);assert.equal(m.board.p,before.p-t.d);
  const p=accepted(c,finish(c,m)),step=p.events[2];
  assert.equal(step.removedAs,'fraction-pieces');assert.equal(step.takenUnits,t.d);
  assert.equal(step.before.w,0);assert.equal(step.after.w,0);
  assert.equal(p.exchanges.some(x=>x.historyIndex===2),false);
 }
});

test('a visible failed part removal remains in the proof after a real split and correction',()=>{
 const c=cases[2],t=taskFor(c),m=begin(c);
 act(t,m,'take-part');act(t,m,'take-part');const before=cp(m.board);act(t,m,'take-part');
 assert.deepEqual(m.board,before);assert.equal(m.issue,'小份不够了，可以把一个整体换开；量不会变。');
 const p=accepted(c,finish(c,m)),failed=p.failedRequests;
 assert.equal(failed.length,1);assert.equal(failed[0].historyIndex,3);assert.equal(failed[0].action,'take-part');
 assert.equal(failed[0].accepted,false);assert.equal(failed[0].constructionChanged,false);
 assert.equal(p.removals.includes(failed[0]),true);assert.equal(p.issue,'');
 assert.equal(p.events.some(x=>x.historyIndex>3&&x.action==='split'),true);
});

test('invalid starts preserve requests without manufacturing a first guess or an error message',()=>{
 const c=cases[0],t=taskFor(c),m=M.initial(t);
 for(const guess of ['', '.5','0x4','2e0','1/0','1 /2','3 7/5','NaN','25％']){
  fill(t,m,'guess',guess);act(t,m,'start');assert.equal(m.board.started,false);assert.equal(m.board.first,null);assert.equal(m.issue,'');
 }
 fill(t,m,'guess','-0 1/2');act(t,m,'start');const p=accepted(c,finish(c,m));
 assert.equal(p.failedRequests.length,9);assert.equal(p.firstGuess.historyIndex,9);
 assert.equal(p.firstGuess.raw,'-0 1/2');assert.deepEqual(p.firstGuess.value,[-1,2]);
 assert.equal(p.events.filter(x=>x.firstStored).length,1);
 assert.ok(p.failedRequests.every(x=>x.action==='start'&&!x.accepted&&x.issue===''));
});

test('zero, negative, decimal, mixed-number and percentage guesses use the original guess grammar only',()=>{
 const c=cases[0];
 for(const[raw,value,matches]of [['0',[0,1],false],['-1',[-1,1],false],['−0 1/2',[-1,2],false],
  ['4.40',[22,5],true],['4 2/5',[22,5],true],['440%',[22,5],true],['0.00000001%',[1,10000000000],false],
  ['1000000000000',[1000000000000,1],false],['  +4.4  ',[22,5],true]]){
  const p=accepted(c,build(c,{guess:raw}));assert.equal(p.firstGuess.raw,raw);
  assert.deepEqual(p.firstGuess.value,value);assert.equal(p.firstGuess.matchesResult,matches);
 }
});

test('visible submitted names are independently exact and retain the original B16 lexical bounds',()=>{
 const c=cases[0],t=taskFor(c);
 for(const values of [{whole:'4/1',part:'2/5',answer:'22/5'},
  {whole:'+4',part:'0.40',answer:'4.40'}, {whole:'4.0',part:'0 2/5',answer:'4 2/5'},
  {whole:'400000000/100000000',part:'40000000/100000000',answer:'440000000/100000000'},
  {whole:'0004',part:'  0.40000000  ',answer:'0004.40000000'}]){
  const m=build(c);answers(c,m,values);accepted(c,m);
 }
 for(const[field,value]of [['whole','400%'],['part','40%'],['answer','440%'],['answer','4e0'],['answer','0x4'],
  ['answer','3 7/5'],['answer','22 /5'],['answer','22/0'],['answer','4.400000000'],['part','.4'],
  ['part','0.400000000'],['whole','4000000000/1000000000']]){
  const m=build(c);fill(t,m,field,value);assert.equal(M.valid(t,m),true);
  assert.equal(M.inspect(t,m).correct,false);rejected(c,m,field+' '+value);
 }
 for(const[field,value]of [['whole','3'],['part','3/5'],['answer','21/5']]){
  const m=build(c);fill(t,m,field,value);rejected(c,m,'each submitted quantity matters independently');
 }
});

test('reset keeps all fields and the first successful guess while exposing a new current guess',()=>{
 for(const c of cases){
  const t=taskFor(c),m=build(c,{guess:'-1'}),firstLength=m.history.length,fields=Object.fromEntries(FIELDS.map(k=>[k,m[k]]));
  act(t,m,'reset');assert.equal(m.board.started,false);assert.equal(m.board.first,'-1');
  assert.deepEqual(Object.fromEntries(FIELDS.map(k=>[k,m[k]])),fields);
  assert.ok(V.render(t,m).includes('data-xfield="guess"'));
  for(const hidden of ['whole','part','answer'])assert.equal(V.render(t,m).includes(`data-xfield="${hidden}"`),false);
  fill(t,m,'guess',text(c.expected.result));act(t,m,'start');finish(c,m);
  const p=accepted(c,m);assert.equal(p.firstGuess.raw,'-1');assert.equal(p.firstGuess.matchesResult,false);
  assert.equal(p.currentGuess.raw,text(c.expected.result));assert.equal(p.currentGuess.matchesResult,true);
  assert.equal(p.currentGuess.historyIndex,firstLength+1);assert.equal(p.resets.length,1);
  assert.deepEqual(p.resets[0].fields,{guess:fields.guess,whole:fields.whole,part:fields.part,answer:fields.answer});
  assert.equal(p.events.filter(x=>x.firstStored).length,1);
 }
});

test('repeated visible reset requests may be no-ops and never delete an earlier first guess',()=>{
 const c=cases[1],t=taskFor(c),m=M.initial(t);
 act(t,m,'reset');act(t,m,'reset');fill(t,m,'guess','0');act(t,m,'start');act(t,m,'reset');act(t,m,'reset');
 fill(t,m,'guess','2.5');act(t,m,'start');const p=accepted(c,finish(c,m));
 assert.equal(p.resets.length,4);assert.equal(p.resets.filter(x=>!x.constructionChanged).length,3);
 assert.equal(p.firstGuess.historyIndex,2);assert.equal(p.firstGuess.raw,'0');assert.equal(p.currentGuess.raw,'2.5');
});

test('the original 1000-character model limit and 1200-event recording limit remain exact',()=>{
 const c=cases[0],t=taskFor(c),m=build(c,{guess:' '.repeat(999)+'0'});
 fill(t,m,'answer',' '.repeat(996)+'22/5');assert.equal(m.answer.length,1000);accepted(c,m);
 const tooLong=cp(m);tooLong.answer=' '.repeat(997)+'22/5';assert.equal(M.valid(t,tooLong),false);rejected(c,tooLong);
 const full=M.initial(t);fill(t,full,'guess','0');
 for(let i=0;i<1198;i++)act(t,full,'reset');act(t,full,'start');act(t,full,'merge');answers(c,full);
 assert.equal(full.history.length,1200);const p=accepted(c,full);assert.equal(p.resets.length,1198);
 const before=JSON.stringify(full);act(t,full,'reset');assert.equal(JSON.stringify(full),before,'full original log ignores the later click');
 assert.equal(p.assessmentLimits.allLaterClicksRecorded,false);
 const overflow=cp(full);overflow.history.push(cp(full.history[0]));assert.equal(M.valid(t,overflow),false);rejected(c,overflow);
});

test('hidden start, unrelated actions and event payloads are refused without changing historical grading',()=>{
 const c=cases[0],t=taskFor(c);
 for(const a of ['split','merge','all-pieces','take-whole','take-part','cut','new-groups','save','person','give','piece','commit','normalize']){
  const m=M.initial(t);rawAct(t,m,a);fill(t,m,'guess','0');act(t,m,'start');finish(c,m);
  originalOnly(c,m,'hidden initial '+a);
 }
 for(const a of ['start','take-whole','take-part','cut','new-groups','save','person','give','piece','commit','normalize']){
  const m=build(c);rawAct(t,m,a);finish(c,m);originalOnly(c,m,'hidden active '+a);
 }
 const payload=begin(c);rawAct(t,payload,'merge',{index:0});finish(c,payload);originalOnly(c,payload,'irrelevant index payload');
});

test('disabled controls cannot be inserted into an otherwise valid correct history',()=>{
 const add=cases[0],t=taskFor(add);
 for(const a of ['split','all-pieces']){
  const m=begin(add);act(t,m,'all-pieces');assert.match(button(t,m,a)[0],/\bdisabled\b/);
  rawAct(t,m,a);finish(add,m);originalOnly(add,m,'disabled '+a);
 }
 const merged=build(add);assert.match(button(t,merged,'merge')[0],/\bdisabled\b/);
 rawAct(t,merged,'merge');originalOnly(add,merged,'disabled merge');
 for(const c of cases.slice(1))for(const a of ['take-whole','take-part']){
  const m=build(c);assert.match(button(taskFor(c),m,a)[0],/\bdisabled\b/);
  rawAct(taskFor(c),m,a);originalOnly(c,m,'exhausted '+a);
 }
});

test('hidden fields cannot change at the beginning, after starting, after reset, or between snapshots',()=>{
 const c=cases[0],t=taskFor(c);
 for(const key of FIELDS.filter(k=>k!=='guess')){
  const m=M.initial(t);m[key]='hidden';fill(t,m,'guess','0');act(t,m,'start');finish(c,m);
  originalOnly(c,m,'hidden initial '+key);
 }
 const changed=build(c);changed.guess='1';originalOnly(c,changed,'current hidden guess');
 const round=build(c);act(t,round,'reset');round.answer='22/05';fill(t,round,'guess','1');act(t,round,'start');finish(c,round);
 originalOnly(c,round,'answer edited in hidden reset window');
 const transient=build(c);transient.guess='1';rawAct(t,transient,'split');transient.guess='0';rawAct(t,transient,'merge');
 originalOnly(c,transient,'hidden historical guess changed and restored');
});

test('extra shapes, fabricated issues and tampered construction are refused as strict evidence',()=>{
 const c=cases[0],t=taskFor(c),good=build(c);
 for(const mutate of [m=>m.extra=true,m=>m.history[0].extra=true,m=>m.history[0].f.extra='',
  m=>m.issue='fabricated failure',m=>m.board.first='1',m=>m.board.w++,m=>m.board.p++,m=>m.board.trades++,
  m=>m.history[0].f.guess='1',m=>m.history.splice(1,1),m=>m.history[0].d={index:'0'},m=>m.history[0].a='unknown']){
  const m=cp(good);mutate(m);rejected(c,m,'altered evidence cannot inherit a proof');
 }
 for(const m of [null,{},[],true,{...good,history:null},{...good,history:[null]},
  {...good,whole:4},{...good,board:null},{...good,history:[{a:'start',d:null,f:{}}]}])
  assert.doesNotThrow(()=>rejected(c,m));
 assert.equal(JSON.stringify(good),JSON.stringify(build(c)),'reference model unchanged');
 assert.equal(M.inspect(t,good).correct,true);
});

test('associated and practice copies retain their original mathematics but never receive a native guide or feedback',()=>{
 for(const c of [...bridges,...practices]){
  const t=taskFor(c),m=build(c);accepted(c,m);
  assert.equal(mixedTradeBinding(t,c),null);assert.equal(thinkingGuide(t,c),null);
  assert.equal(thinkingFeedback(t,m,{attempts:[{value:cp(m)}]},c),null);
 }
});

for(const c of cases)test(`${c.id}:${c.index} preserves five actual submissions, first errors, reset history and full v2 records`,()=>{
 const t=taskFor(c),lesson=State.freshLesson(c.id);lesson.index=c.index;lesson.models[c.index]=begin(c);
 const m=lesson.models[c.index];finish(c,m);fill(t,m,'answer','0');
 assert.equal(State.submitLesson(lesson).correct,false);const wrong=JSON.stringify(lesson.cases[c.index].attempts[0]);
 State.supportLesson(lesson);fill(t,m,'answer',text(c.expected.result));assert.equal(State.submitLesson(lesson).correct,true);
 assert.equal(State.currentSubmission(lesson).status,'correct');assert.ok(thinkingFeedback(t,m,lesson.cases[c.index],c));
 act(t,m,'split');assert.equal(State.currentSubmission(lesson).status,'modified');
 assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);assert.equal(State.submitLesson(lesson).correct,false);
 act(t,m,'merge');assert.equal(State.submitLesson(lesson).correct,true);
 act(t,m,'reset');fill(t,m,'guess',text(c.expected.result));act(t,m,'start');finish(c,m);
 assert.equal(State.submitLesson(lesson).correct,true);assert.equal(lesson.cases[c.index].attempts.length,5);
 assert.equal(JSON.stringify(lesson.cases[c.index].attempts[0]),wrong);
 assert.deepEqual(lesson.cases[c.index].attempts.map(a=>M.inspect(t,a.value).correct),[false,true,false,true,true]);
 assert.equal(lesson.cases[c.index].attempts[0].supported,false);assert.equal(lesson.cases[c.index].attempts[0].exposed,false);
 assert.ok(lesson.cases[c.index].attempts.slice(1).every(a=>a.supported&&a.exposed));
 assert.equal(State.lessonSummary(lesson).cases[c.index].independent,false);
 const p=accepted(c,m);assert.equal(p.firstGuess.raw,'0');assert.equal(p.currentGuess.matchesResult,true);
 assert.equal(p.resets.length,1);assert.ok(thinkingGuide(t,c));assert.ok(thinkingFeedback(t,m,lesson.cases[c.index],c));
 State.addLessonNote(lesson,'我先估错了，再核对整份与零头。');lesson.draft='未提交的说明草稿';
 const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
 const state=Core.fresh();state.lessons[c.id]=lesson;state.lessonContinuation=c.id;
 state.visited[c.nodeId]='2026-11-15T00:00:00.000Z';state.bookmarks=[c.nodeId];
 state.openedPacks[atlas.packs[0].id]='2026-11-15T00:00:00.000Z';
 const original=JSON.stringify(state),backup=JSON.stringify(Core.backup(state));
 const restored=Core.parseBackup(backup,atlas);assert.deepEqual(restored,state);assert.equal(JSON.stringify(state),original);
 assert.deepEqual(Core.merge(Core.fresh(),restored).lessons,state.lessons);
 assert.deepEqual(Core.merge(restored,restored).lessons,state.lessons);
 assert.equal(State.currentSubmission(restored.lessons[c.id]).status,'correct');
 assert.deepEqual(replayMixedTradeEvidence(t,restored.lessons[c.id].models[c.index]),p);
});

test('latest full snapshot gates equivalent text edits, fresh paths and exact reconstruction without adding an epoch',()=>{
 const c=cases[0],t=taskFor(c),m=build(c),record={support:false,attempts:[{value:cp(m)}]};
 assert.ok(thinkingFeedback(t,m,record,c));assert.equal(latestSubmissionMatches(m,record),true);
 fill(t,m,'answer','4.4');accepted(c,m);assert.equal(latestSubmissionMatches(m,record),false);
 assert.equal(thinkingFeedback(t,m,record,c),null);record.attempts.push({value:cp(m)});assert.ok(thinkingFeedback(t,m,record,c));
 const distinct=build(c,{detour:true});assert.equal(thinkingFeedback(t,distinct,record,c),null);
 const exact=cp(record.attempts.at(-1).value);assert.equal(latestSubmissionMatches(exact,record),true);
 assert.ok(thinkingFeedback(t,exact,record,c),'the existing contract uses serialized equality, not a retry epoch');
 for(const bad of [null,{}, {attempts:[]},{attempts:[{value:null}]},{attempts:[{value:cp(m)},{}]}])
  assert.equal(thinkingFeedback(t,m,bad,c),null);
});

test('public feedback distinguishes tool output, written names, the original guess and actual process evidence',()=>{
 const c=cases[2],t=taskFor(c),m=build(c,{allPieces:true}),record={support:false,attempts:[{value:cp(m)}]};
 const f=thinkingFeedback(t,m,record,c);assert.ok(f);assert.equal(f.method,null);
 const message=JSON.stringify(f);assert.match(message,/工具|系统/);assert.match(message,/最初|首/);
 assert.match(message,/整[份体]|小份/);assert.match(message,/独立|掌握|长期/);
 assert.equal(JSON.stringify(record.attempts[0].value),JSON.stringify(m));
});

after(()=>console.log('MIXEDTRADE_INDEPENDENT_PROBES '+JSON.stringify(metrics)));
