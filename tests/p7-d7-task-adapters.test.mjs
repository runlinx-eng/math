import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInventory} from '../scripts/build_p7_d3_inventory.mjs';
import {initial as b38Initial,act as b38Act} from '../dist/learning/phase5/b38-model.js';
import {initial as b27Initial,act as b27Act} from '../dist/learning/phase5/b27-model.js';
import {initial as b14Initial,act as b14Act} from '../dist/learning/phase5/b14-model.js';
import {taskInteractionContract,VERIFIED_STUDY_GATES,studyActionFocus} from '../dist/learning/workspace-flow.js';
import {TASKS} from '../dist/learning/tasks.js';
import {BRIDGES} from '../dist/learning/bridges.js';

test('D7: every actual configured activity has a presentational contract without replacing the grader',()=>{
 const inventory=buildInventory();
 assert.equal(inventory.diagnostics.length,0);
 assert.equal(inventory.counts.nodeTasks,1996);
 assert.equal(inventory.counts.bridgeTasks,1552);
 assert.equal(inventory.counts.bridgeCount,776);
 assert.ok(Object.keys(inventory.taskTypes).length>VERIFIED_STUDY_GATES.length);
 for(const [type,count] of Object.entries(inventory.taskTypes)){
  assert.ok(count>0);
  const x=taskInteractionContract({type});
  assert.equal(x.type,type);
  assert.ok(x.family.length>0&&x.nativeGrader);
  assert.equal(x.checkReadiness,VERIFIED_STUDY_GATES.includes(type)?'基于原生模型状态':'沿用原检查路径');
 }
 const bridge=Object.values(BRIDGES)[0];
 assert.equal(taskInteractionContract(bridge.tasks[0],{bridge:true}).family,'真实知识联合任务');
});
test('D7: argument and counterexample require original replayed work, not arbitrary text',()=>{
 const t={type:'x-r38-counterexample',rule:'strict'};
 const m=b38Initial(t);
 assert.equal(studyActionFocus({task:t,model:m}).kind,'widget');
 m.value='6';m.second='1/2';m.choice='less';m.prose='这只是我的自由解释';
 assert.equal(studyActionFocus({task:t,model:m}).readyToCheck,false);
 b38Act(t,m,'r38-test');
 assert.equal(studyActionFocus({task:t,model:m}).readyToCheck,true);
 m.value='7';
 assert.equal(studyActionFocus({task:t,model:m}).readyToCheck,false);
 const chain={type:'x-r38-chain',cards:[{id:'one',text:'one'}],paths:[['one']]};
 const argument=b38Initial(chain);
 argument.prose='just text';
 assert.equal(studyActionFocus({task:chain,model:argument}).readyToCheck,false);
 b38Act(chain,argument,'r38-card',{index:'one'});
 assert.equal(studyActionFocus({task:chain,model:argument}).readyToCheck,true);
});
test('D7: original geometry construction and folding remain the check readiness source',()=>{
 const build=TASKS.solidstack[0],m=b27Initial(build);
 assert.equal(build.type,'x-g27-build');
 assert.equal(studyActionFocus({task:build,model:m}).readyToCheck,false);
 for(const part of build.target)b27Act(build,m,'g27-add',{index:part});
 assert.equal(studyActionFocus({task:build,model:m}).readyToCheck,true);
 const fold=TASKS.foldprism[1],n=b27Initial(fold);
 assert.equal(fold.type,'x-g27-net');
 assert.equal(studyActionFocus({task:fold,model:n}).readyToCheck,false);
 for(let i=0;i<4;i++)b27Act(fold,n,'g27-piece',{index:i});
 assert.equal(studyActionFocus({task:fold,model:n}).readyToCheck,false);
 b27Act(fold,n,'g27-predict',{index:'yes'});
 assert.equal(studyActionFocus({task:fold,model:n}).kind,'widget');
 b27Act(fold,n,'g27-fold');
 assert.equal(studyActionFocus({task:fold,model:n}).readyToCheck,true);
});
test('D7: parity prediction and pairing are separate original mathematical actions',()=>{
 const t={type:'x-parityjoin',a:3,b:5,op:'+'};
 const m=b14Initial(t);
 assert.equal(studyActionFocus({task:t,model:m}).kind,'widget');
 m.prediction='even';
 b14Act(t,m,'b14-predict');
 assert.equal(studyActionFocus({task:t,model:m}).selector,'[data-x="b14-join"]');
 b14Act(t,m,'b14-join');
 assert.equal(studyActionFocus({task:t,model:m}).readyToCheck,true);
});
test('D7: base construction and unknown native types retain their existing grading path',()=>{
 for(const type of ['equivalent','line','grid','match','x-r38-unknown']){
  assert.equal(studyActionFocus({stage:'explore',task:{type},model:{}}).readyToCheck,true);
 }
 assert.equal(studyActionFocus({stage:'passed'}).kind,'continue');
 assert.equal(studyActionFocus({stage:'reflect'}).kind,'continue');
});
