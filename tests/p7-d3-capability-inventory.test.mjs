import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildInventory} from '../scripts/build_p7_d3_inventory.mjs';
import {LESSONS,ROUTES} from '../dist/learning/catalog.js';
import {TASKS,inspect,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sourceBridge} from '../dist/learning/bridges.js';
import {freshLesson,submitLesson,currentSubmission,lessonSummary,validateLesson,addLessonNote} from '../dist/learning/state.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {learningStage,nextRouteLessonId} from '../dist/learning/workspace-flow.js';

const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));

test('D3-A every configured node task, bridge task, route, practice model and legacy entry appears in a reproducible map',()=>{
 const m=buildInventory();
 assert.equal(m.counts.sourceNodes,587);
 assert.equal(m.counts.sourceEdges,1223);
 assert.equal(m.counts.lessonCount,587);
 assert.equal(m.counts.nodeTasks,1996);
 assert.equal(m.counts.bridgeCount,776);
 assert.equal(m.counts.bridgeTasks,1552);
 assert.equal(m.counts.bridgeSourceEdges,776);
 assert.equal(m.counts.unbridgedSourceEdges,447);
 assert.equal(m.counts.legacyActivities,3);
 assert.equal(m.counts.legacyVariants,12);
 assert.equal(m.counts.oldPracticeCount,Object.keys(LESSONS).length);
 assert.equal(m.entries.filter(x=>x.group==='node-task').length,1996);
 assert.equal(m.entries.filter(x=>x.group==='bridge-task').length,1552);
 assert.equal(m.entries.filter(x=>x.group==='source-edge').length,1223);
 assert.equal(m.entries.filter(x=>x.group==='route').length,ROUTES.length);
 assert.equal(m.diagnostics.length,0,m.diagnostics.slice(0,20).join('\n'));
 for(const r of m.entries)for(const key of ['source','id','originEntry','userTask','dataJudging','currentUI','recommendation','status','evidence','preservation'])
   assert.ok(r[key],r.group+' '+r.id+' missing '+key);
});

test('D3-B exposure contract: every capability has one defined UI role without silently dropping legacy access',()=>{
 const map=buildInventory();
 const roles=['当前操作','按需辅助','后台能力','待归类保留'];
 assert.equal(Object.values(map.counts.uiRoleCounts).reduce((a,n)=>a+n,0),map.entries.length);
 for(const r of map.entries){
   assert.ok(roles.includes(r.uiRole),r.id+' has an invalid role');
   assert.ok(r.showWhen?.length>0,r.id+' lacks its reveal condition');
   assert.ok(r.accessGuarantee?.length>0,r.id+' lacks an access or retention rule');
 }
 for(const group of ['node-task','bridge-task'])assert.ok(map.entries.filter(r=>r.group===group).every(r=>r.uiRole==='当前操作'));
 for(const group of ['feedback','application','source-edge','route','continuation'])assert.ok(map.entries.filter(r=>r.group===group).every(r=>r.uiRole==='按需辅助'));
 assert.ok(map.entries.filter(r=>r.group==='persistence').every(r=>r.uiRole==='后台能力'));
 for(const group of ['legacy-activity','legacy-practice','legacy-journey','experiment','old-quiz'])assert.ok(map.entries.filter(r=>r.group===group).every(r=>r.uiRole==='待归类保留'));
 assert.ok(map.entries.filter(r=>r.group==='legacy-practice').every(r=>r.accessGuarantee.includes('models[-1]')),'old practice models must be retained even if the original UI is not yet verified');
});

test('D3-C manipulation: three-cup matching checks actual submitted work and invalidates stale success',()=>{
 const a=freshLesson('quarters');a.index=1;
 const task=TASKS.quarters[1];
 assert.equal(task.type,'match');
 assert.equal(submitLesson(a).correct,false);
 const valid=exampleModel(task);
 a.models[1]=valid;
 assert.equal(currentSubmission(a).status,'modified');
 assert.equal(submitLesson(a).correct,true);
 assert.equal(currentSubmission(a).status,'correct');
 const submittedName=a.cases[1].attempts.at(-1).value.names[0];
 a.models[1].names[0]='0.99';
 assert.equal(learningStage(a,currentSubmission(a)),'recheck');
 assert.equal(inspect(task,a.models[1]).correct,false);
 assert.equal(a.cases[1].attempts.at(-1).value.names[0],submittedName);
 assert.equal(lessonSummary(a).completed,false);
 a.models[1].names[0]=submittedName;
 assert.equal(currentSubmission(a).status,'correct');
});

test('D3-C reasoning/counterexample: replay-based construction is graded but arbitrary prose is not',()=>{
 const index=TASKS.argument38.findIndex(t=>t.type==='x-r38-counterexample');
 assert.ok(index>=0,'counterexample model remains in the original task catalog');
 const task=TASKS.argument38[index],m=exampleModel(task);
 assert.equal(inspect(task,m).correct,true);
 const altered={...m,prose:'没有经过自动验证的自由解释'};
 assert.equal(inspect(task,altered).correct,true,'free text is stored, not automatically marked correct/incorrect');
 const a=freshLesson('argument38');a.index=index;a.models[index]=altered;
 assert.equal(submitLesson(a).correct,true);
 assert.equal(currentSubmission(a).status,'correct');
 assert.ok(thinkingFeedback(task,a.models[index],a.cases[index]));
 a.models[index].prose='已修改的自由文字';
 assert.equal(currentSubmission(a).status,'modified');
 assert.equal(thinkingFeedback(task,a.models[index],a.cases[index]),null,'no stale thinking observation after editing');
});

test('D3-C source bridge: two different original task runners, real edge, history and restoration',()=>{
 const id='link-equivalent-quarters',b=BRIDGES[id];
 assert.ok(b);assert.ok(sourceBridge(id,atlas));
 assert.deepEqual(b.tasks.map(x=>x.type),['equivalent','grid']);
 const a=freshLesson(id);
 for(let i=0;i<b.tasks.length;i++){
   a.index=i;a.models[i]=exampleModel(b.tasks[i]);
   assert.equal(submitLesson(a).correct,true,'bridge step '+(i+1));
 }
 assert.equal(lessonSummary(a).completed,true);
 a.view='summary';
 addLessonNote(a,'我发现它们保持同一个量，但有不同的名字');
 const restored=validateLesson(structuredClone(a),id,{allowBridge:true});
 assert.equal(restored.view,'summary');
 assert.equal(restored.notes.length,1);
 assert.deepEqual(restored.cases[0].attempts.map(x=>x.value),a.cases[0].attempts.map(x=>x.value));
 const route=ROUTES.find(r=>r.id==='A');
 assert.equal(nextRouteLessonId(route,'quarters'),null,'never fabricate a fifth route step');
});

test('D3-A leave legacy activity, old play, early route, and experiments explicitly visible in the map',()=>{
 const map=buildInventory();
 for(const group of ['legacy-activity','legacy-practice','legacy-journey','experiment','persistence','continuation','application','old-quiz']){
   assert.ok(map.entries.some(x=>x.group===group),group+' may not be silently excluded');
 }
 for(const id of ['fair','rename','decimal'])assert.equal(map.entries.filter(x=>x.group==='legacy-activity'&&x.id.startsWith(id+'/')).length,4);
 assert.ok(map.entries.some(x=>x.group==='experiment'&&x.id==='hidden-cubes'));
 assert.ok(map.entries.some(x=>x.group==='experiment'&&x.id==='bee-builder'));
});
