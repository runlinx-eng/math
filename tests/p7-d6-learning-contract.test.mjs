import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initial as initialWide,act as actWide} from '../dist/learning/phase5/b08-model.js';
import {studyActionFocus,learningActionPlan} from '../dist/learning/workspace-flow.js';

const shift={type:'x-wideshift',mode:'shift',start:'3.456',step:2};
test('D6: actual decimal shift must predict and manipulate before checking',()=>{
 const m=initialWide(shift);
 const initial=studyActionFocus({stage:'explore',task:shift,model:m});
 assert.equal(initial.kind,'widget');
 assert.equal(initial.selector,'[data-x="wide-predict"]');
 assert.equal(initial.readyToCheck,false);
 m.guess='345.6';
 actWide(shift,m,'wide-predict');
 assert.equal(m.committed,'345.6');
 const moved=studyActionFocus({stage:'explore',task:shift,model:m});
 assert.equal(moved.kind,'work');
 assert.equal(moved.readyToCheck,false);
 actWide(shift,m,'wide-move',{delta:1});
 assert.equal(studyActionFocus({stage:'explore',task:shift,model:m}).readyToCheck,true);
 assert.equal(studyActionFocus({stage:'revise',task:shift,model:m}).kind,'check');
 assert.equal(studyActionFocus({stage:'recheck',task:shift,model:m}).kind,'check');
 assert.equal(learningActionPlan({stage:'explore',readyToCheck:moved.readyToCheck}).primary.disabled,true);
});
test('D6: different task types keep native graders and safe main action',()=>{
 for(const type of ['equivalent','line','grid','x-r38-chain','x-r38-counterexample']){
  assert.deepEqual(studyActionFocus({stage:'explore',task:{type},model:{}}),{kind:'check',readyToCheck:true,cue:null});
 }
 assert.equal(studyActionFocus({stage:'explore',task:{type:'x-parityjoin'},model:{board:{first:null}}}).kind,'widget');
 assert.equal(studyActionFocus({stage:'passed'}).kind,'continue');
 assert.equal(studyActionFocus({stage:'reflect'}).kind,'continue');
});
test('D6: one real workpiece, four ordered regions, one optional support drawer',()=>{
 const html=readFileSync(new URL('../dist/learn.html',import.meta.url),'utf8');
 const ids=['learning-problem','learning-interaction','learning-check','learning-next'];
 assert.ok(ids.every(id=>(html.match(new RegExp('id="'+id+'"','g'))||[]).length===1));
 assert.deepEqual([...ids].sort((a,b)=>html.indexOf('id="'+a+'"')-html.indexOf('id="'+b+'"')),ids);
 assert.equal((html.match(/id="work"/g)||[]).length,1);
 assert.equal((html.match(/id="actions"/g)||[]).length,1);
 assert.match(html,/<details id="learning-support"/);
 assert.ok(html.indexOf('id="route-collapsible"')>html.indexOf('id="learning-support"'));
});
test('D6: current math render and persistence are retained',()=>{
 const runtime=readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8');
 assert.match(runtime,/widgets\(t,m\)/);
 assert.match(runtime,/submitLesson\(r\)/);
 assert.match(runtime,/currentSubmission\(a\)/);
 assert.match(runtime,/studyActionFocus/);
 assert.match(runtime,/syncLearningRegions\(\)/);
 assert.doesNotMatch(runtime,/function newGrader/);
});
