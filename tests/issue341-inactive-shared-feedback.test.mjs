import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import * as p14 from '../dist/learning/phase5/b14-model.js';
import * as p13 from '../dist/learning/phase5/b13-model.js';
import * as p35 from '../dist/learning/phase5/b35-model.js';
import * as p20 from '../dist/learning/phase5/b20-model.js';
import * as p09 from '../dist/learning/phase5/b09-model.js';
import {
  ISSUE341_FEEDBACK_PROPOSAL_STATUS,ISSUE341_INACTIVE_ADAPTER_PROPOSALS,
  issue341ProposedGuide,issue341ProposedFeedback
} from '../dist/learning/issue341-inactive-shared-feedback.js';

const record=m=>({attempts:[{value:structuredClone(m)}],support:false});
const source=(sessionId,index)=>({task:sessionTaskFor(sessionId,index),context:{sessionId,index}});
function prime(){
 const x=source('primetest',1),m=p14.initial(x.task);
 m.candidate='1';m.remainder='0';p14.act(x.task,m,'b14-test',{side:0});m.answer='prime';
 return {...x,model:m,word:'质数'};
}
function pairs(){
 const x=source('factorpairs',0),m=p13.initial(x.task);
 for(const [a,b] of [[1,24],[2,12],[3,8],[4,6]]){
   m.rows=String(a);m.cols=String(b);m.answer='24';p13.act(x.task,m,'b13-pair-save');
 }
 return {...x,model:m,word:'4 种不重复因数对'};
}
function factor(){
 const x=source('factor35',0),m=p35.initial(x.task);
 [m.value,m.second,m.third,m.fourth]=['3','1','2','3'];
 p35.act(x.task,m,'a35-factor');
 return {...x,model:m,word:'最大共同因式为 3'};
}
function dot(){
 const x=source('dotrecords',2),m=p20.initial(x.task);
 for(const value of x.task.values){m.value=String(value);p20.act(x.task,m,'b20-dot');}
 m.answers=['10','5'];
 return {...x,model:m,word:'点图实际保存了 10 条'};
}
function interval(){
 const x=source('allowedrange',0),m=p09.initial(x.task);
 m.boundary=12;p09.field(x.task,m,'boundary');
 m.side='right';m.closed='yes';m.statement='12 ≤ x';
 for(const sample of ['23/2','12','25/2']){m.probe=sample;p09.act(x.task,m,'range-test');}
 return {...x,model:m,word:'端点为 12'};
}

test('candidate-only feedback stays isolated after the formal source snapshot is updated, adapters, or the live UI',()=>{
 assert.equal(ISSUE341_FEEDBACK_PROPOSAL_STATUS,'INACTIVE_NOT_APPROVED_NOT_RUNTIME_REGISTERED');
 assert.equal(ISSUE341_INACTIVE_ADAPTER_PROPOSALS.length,5);
 const official=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 assert.equal(official.tasks.length,1762);
 assert.ok(EVIDENCE_ADAPTERS.every(x=>!x.id.startsWith('issue341-')));
 for(const row of ISSUE341_INACTIVE_ADAPTER_PROPOSALS){
   assert.equal(row.id.startsWith('issue341-'),true);
   assert.equal(row.binding.constructor,Function);
   assert.equal(row.submitted.constructor,Function);
 }
});

test('new optional feedback copy is sourced from original successful Check, not a type label',()=>{
 for(const example of [prime(),pairs(),factor(),dot(),interval()]){
   const {task,context,model,word}=example,original=structuredClone(model),r=record(model);
   const guide=issue341ProposedGuide(task,context);
   assert.equal(guide.type,task.type);
   assert.ok(guide.question.length>10);
   const note=issue341ProposedFeedback(task,model,r,context);
   assert.ok(note,'new proposed feedback must be renderable for a real original Check');
   assert.match(note.observation,new RegExp(word));
   assert.equal(note.method,null);
   assert.equal(note.proposalStatus,ISSUE341_FEEDBACK_PROPOSAL_STATUS);
   assert.ok(note.detail.some(x=>x.includes('不')));
   assert.deepEqual(model,original,'new presentation must never mutate original B model');
   assert.equal(issue341ProposedFeedback(task,model,{attempts:[]},context),null);
   assert.equal(issue341ProposedFeedback(task,model,{attempts:[{value:{unrelated:'older-invalid-check'}}]},context),null);
   assert.equal(issue341ProposedGuide({...task,prompt:'forged'},context),null);
   assert.equal(issue341ProposedFeedback(task,model,r,{...context,index:String(context.index)}),null);
   assert.equal(thinkingGuide(task,context),null,'official UI has not been connected');
   assert.equal(thinkingFeedback(task,model,r,context),null,'official feedback is still inactive');
 }
});
