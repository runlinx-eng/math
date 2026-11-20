// #273: read-only replay tests. Stage 1 is not A admission.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b32-model.js';
import {timeCompareBinding,replayTimeCompareEvidence} from '../dist/learning/timecompare-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

const rows=[
 ['timecompare',0,'right','longer'],
 ['timecompare',1,'left','earlier'],
 ['timecompare',2,'right','first'],
 ['durationorder',1,'left','longer'],
 ['durationwork',1,'right','longer'],
 ['minuteclock',2,'left','longer']
];
const ctx=(id,index)=>({sessionId:id,index});
const act=(t,m,name,value)=>original.act(t,m,'t32-'+name,{index:value});
const proof=(id,index,m)=>replayTimeCompareEvidence(sessionTaskFor(id,index),m,ctx(id,index));

for(const [id,index,expected,kind] of rows){
 test('#273 genuine prior guess, reveal and final choice: '+id+':'+index,()=>{
  const task=sessionTaskFor(id,index),model=original.example(task);
  const before=JSON.stringify({task,model});
  assert.equal(task.type,'x-t32-compare');
  assert.equal(task.kind,kind);
  assert.equal(original.valid(task,model),true);
  assert.equal(original.inspect(task,model).correct,true);
  assert.ok(timeCompareBinding(task,ctx(id,index)));
  const result=proof(id,index,model);
  assert.ok(result,'the native actions must replay, not merely grade');
  assert.equal(result.construction.expected,expected);
  assert.equal(result.eventCount,3);
  assert.equal(result.construction.guessAt,0);
  assert.equal(result.construction.revealAt,1);
  assert.deepEqual(result.construction.decisions,[{at:2,choice:expected,correct:true}]);
  const [a,b]=task.events;
  assert.deepEqual(result.construction.metrics.map(x=>x.duration),
   [a.end-a.start,b.end-b.start],'duration is independently reconstructed');
  assert.equal(result.realButtonSequenceAssessed,true);
  assert.equal(result.independentStrategyAssessed,false);
  assert.equal(result.realWorldTimingAssessed,false);
  assert.equal(result.checkedSubmissionAssessed,false);
  assert.equal(result.generalMasteryAssessed,false);
  assert.equal(JSON.stringify({task,model}),before,'never mutate work or original task');
 });
 test('#273 rejects forged source and result-only shortcuts: '+id+':'+index,()=>{
  const task=sessionTaskFor(id,index),model=original.example(task);
  assert.equal(timeCompareBinding(task),null);
  assert.equal(replayTimeCompareEvidence(task,model),null);
  assert.equal(replayTimeCompareEvidence(task,model,{sessionId:id,index:String(index)}),null);
  assert.equal(replayTimeCompareEvidence(task,model,ctx(id,index+1)),null);
  const altered=structuredClone(task);altered.events[0].start+=1;
  assert.equal(timeCompareBinding(altered,ctx(id,index)),null);
  assert.equal(replayTimeCompareEvidence(altered,model,ctx(id,index)),null);
  const blank=structuredClone(model);blank.history=[];
  assert.equal(proof(id,index,blank),null);
  const forged=structuredClone(model);forged.history[0].i='unknown';
  assert.equal(proof(id,index,forged),null);
 });
}
test('#273 a wrong first guess stays visible, while a correct revealed choice can complete',()=>{
 const t=sessionTaskFor('timecompare',2),m=original.initial(t);
 act(t,m,'guess','left');act(t,m,'reveal');act(t,m,'choice','right');
 assert.equal(original.inspect(t,m).correct,true);
 const result=proof('timecompare',2,m);
 assert.ok(result);
 assert.equal(result.construction.firstGuess,'left');
 assert.equal(result.construction.firstGuessCorrect,false);
 assert.equal(result.construction.finalChoice,'right');
 assert.equal(result.construction.wrongChoices.length,0);
 assert.equal(m.board.bad,false,'a guess was not falsely graded as a failed choice');
});
test('#273 a wrong post-reveal choice and later correction are not rewritten as a clean first try',()=>{
 const t=sessionTaskFor('timecompare',2),m=original.initial(t);
 act(t,m,'guess','left');act(t,m,'reveal');
 act(t,m,'choice','left');act(t,m,'choice','right');
 assert.equal(original.valid(t,m),true);
 assert.equal(original.inspect(t,m).correct,true);
 const result=proof('timecompare',2,m);
 assert.ok(result);
 assert.deepEqual(result.construction.wrongChoices,[2]);
 assert.equal(result.construction.firstChoice,'left');
 assert.equal(result.construction.decisions.at(-1).correct,true);
 assert.equal(m.board.bad,true);
 const onlyWrong=structuredClone(m);onlyWrong.history.pop();
 assert.equal(proof('timecompare',2,onlyWrong),null);
});
test('#273 unused controller actions, repeated reveal or guess are not mathematical evidence',()=>{
 const t=sessionTaskFor('timecompare',0),g=original.example(t);
 for(const [name,index] of [['order','0'],['guess','left'],['reveal',undefined]]){
  const m=structuredClone(g);act(t,m,name,index);
  assert.equal(original.valid(t,m),true);
  assert.equal(original.inspect(t,m).correct,true,'original grader remains unchanged');
  assert.equal(proof('timecompare',0,m),null,'strict replay rejects unused events');
 }
 const m=original.initial(t);
 act(t,m,'guess','left');act(t,m,'reveal');act(t,m,'choice','right');
 act(t,m,'choice','left');
 assert.equal(original.inspect(t,m).correct,false);
 assert.equal(proof('timecompare',0,m),null,'a later wrong choice invalidates current proof');
});
test('#273 result and unit semantics are distinct for starting, ending and elapsed time',()=>{
 const earlier=proof('timecompare',1,original.example(sessionTaskFor('timecompare',1)));
 const first=proof('timecompare',2,original.example(sessionTaskFor('timecompare',2)));
 const longer=proof('durationorder',1,original.example(sessionTaskFor('durationorder',1)));
 const seconds=proof('minuteclock',2,original.example(sessionTaskFor('minuteclock',2)));
 assert.deepEqual(earlier.construction.numbers,[480,500]);
 assert.deepEqual(first.construction.numbers,[570,560]);
 assert.deepEqual(longer.construction.numbers,[30,20]);
 assert.deepEqual(seconds.construction.numbers,[80,75]);
 assert.equal(seconds.construction.unit,'秒');
 assert.equal(earlier.construction.unit,'分钟');
});

test('#273 shared visible proof requires a matching actually checked native model',()=>{
 for(const [id,index] of rows){
  const task=sessionTaskFor(id,index),model=original.example(task);
  const saved={support:false,attempts:[{value:structuredClone(model)}]};
  const before=JSON.stringify({task,model,saved});
  const guide=thinkingGuide(task,ctx(id,index));
  const feedback=thinkingFeedback(task,model,saved,ctx(id,index));
  assert.ok(guide?.question);
  assert.ok(feedback?.observation&&feedback.detail.length>=4);
  assert.equal(feedback.method,null);
  assert.ok(feedback.detail.some(s=>s.includes('结束减开始')));
  const edited=structuredClone(model);edited.history.push({a:'choice',i:'left',v:''});
  assert.equal(thinkingFeedback(task,edited,saved,ctx(id,index)),null,
   'editing after Check revokes old strict proof');
  assert.equal(thinkingFeedback(task,model,{support:false,attempts:[]},ctx(id,index)),null);
  assert.equal(thinkingFeedback(task,model,
   {support:false,attempts:[{value:original.initial(task)}]},ctx(id,index)),null);
  assert.equal(thinkingFeedback(task,model,saved,{sessionId:id,index:String(index)}),null);
  assert.equal(thinkingGuide(task,{sessionId:id,index:String(index)}),null);
  assert.equal(JSON.stringify({task,model,saved}),before);
 }
});
