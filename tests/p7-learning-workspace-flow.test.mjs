import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,lessonSummary,addLessonNote,validateLesson} from '../dist/learning/state.js';
import {TASKS,inspect,exampleModel} from '../dist/learning/tasks.js';
import {learningStage,stageGuidance,checkedMathExplanation,nextRouteLessonId,correctionGuidance} from '../dist/learning/workspace-flow.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {ROUTES,REFLECTIONS} from '../dist/learning/catalog.js';
import {nextRelatedPractice,sourceBridge} from '../dist/learning/bridges.js';

const detailFor=a=>checkedMathExplanation({
 id:a.id,task:TASKS[a.id][a.index],
 model:a.cases[a.index]?.attempts?.at(-1)?.value,
 checked:currentSubmission(a)
});

test('P7-D1: a new lesson has the one fixed sequence of UI regions',()=>{
 const html=readFileSync(new URL('../dist/learn.html',import.meta.url),'utf8');
 const keys=['id="learning-problem"','id="learning-interaction"','id="learning-check"','id="learning-next"'];
 const offsets=keys.map(k=>html.indexOf(k));
 assert.ok(offsets.every(x=>x>=0));
 assert.deepEqual([...offsets].sort((a,b)=>a-b),offsets);
 assert.equal((html.match(/id="actions"/g)||[]).length,1,'one primary action container');
 assert.equal((html.match(/id="work"/g)||[]).length,1,'one real exercise container');
 assert.ok(html.includes('id="math-explanation"'));
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 assert.match(sw,/\.\/learning\/workspace-flow\.js/,'offline cache includes new module');
});

test('P7-D1: stage is derived from real attempts and unchanged work, not navigation',()=>{
 const a=freshLesson('equivalent');
 assert.equal(learningStage(a,currentSubmission(a)),'explore');
 assert.match(stageGuidance('explore'),/只有点击检查/);
 const wrong=submitLesson(a);
 assert.equal(wrong.correct,false);
 assert.equal(learningStage(a,currentSubmission(a)),'revise');
 assert.match(detailFor(a).explanation,/第 1、2、3 条纸带/);
 assert.equal(a.cases[0].attempts.length,1);
 const m=modelForLesson(a);m.rows[0].n=2;m.rows[1].n=3;m.rows[2].n=4;
 assert.equal(learningStage(a,currentSubmission(a)),'recheck');
 assert.equal(detailFor(a),null,'old incorrect submission must not be explained as current work');
 assert.match(stageGuidance('recheck'),/重新检查/);
 const ok=submitLesson(a);
 assert.equal(ok.correct,true);
 assert.equal(learningStage(a,currentSubmission(a)),'passed');
 assert.equal(a.cases[0].attempts.length,2);
 const proof=detailFor(a);
 assert.equal(proof.equation,'2/4 = 3/6 = 4/8 = 1/2');
 assert.match(proof.explanation,/同一个整体/);
 assert.match(proof.question,/自己说说/);
 assert.equal(lessonSummary(a).completed,false,'one correct task is not full completion or mastery');
});

test('P7-D2: second and third equal-fraction questions explain the submitted point',()=>{
 const a=freshLesson('equivalent');
 a.index=1;modelForLesson(a).mark=4;
 assert.equal(submitLesson(a).correct,true);
 assert.equal(detailFor(a).equation,'2/3 = 4/6');
 a.index=2;modelForLesson(a).mark=6;
 assert.equal(submitLesson(a).correct,true);
 const proof=detailFor(a);
 assert.equal(proof.equation,'2/3 = 6/9');
 assert.match(proof.explanation,/相同/);
 a.view='summary';
 assert.equal(learningStage(a,currentSubmission(a)),'reflect');
 assert.equal(detailFor(a),null,'do not claim the summary is a checked math workpiece');
});

test('P7-D1: other configured math activities share stage but not invented proof',()=>{
 const a=freshLesson('share');
 assert.equal(learningStage(a,currentSubmission(a)),'explore');
 assert.equal(detailFor(a),null);
 submitLesson(a);
 assert.equal(learningStage(a,currentSubmission(a)),'revise');
 assert.equal(detailFor(a),null);
});


test('P7 Mac screenshot: twenty-six filled cells, decimal 0.26, percent count 26 is correct',()=>{
 const task=TASKS.decimal[2];
 assert.equal(task.reverse,true);
 assert.match(task.prompt,/百分之几/);
 const model=exampleModel(task);
 assert.equal(model.selected.length,26);
 assert.equal(model.decimal,'0.26');
 for(const notation of ['26','26%','26％','26/100',' 26 / 100 ']){
   const checked=inspect(task,{...model,fraction:notation});
   assert.equal(checked.correct,true,notation+' should represent 26 percent');
   assert.match(checked.feedback,/26\/100 = 0\.26 = 26%/);
 }
 for(const wrong of ['0.26','25','26/10','']){
   const checked=inspect(task,{...model,fraction:wrong});
   assert.equal(checked.correct,false,'invalid percentage entry: '+wrong);
   assert.match(checked.feedback,/百分之几/);
 }
 assert.match(inspect(task,{...model,decimal:'0.25',fraction:'26'}).feedback,/核对小数/);
 assert.match(inspect(task,{...model,selected:model.selected.slice(1),fraction:'26'}).feedback,/百格/);
});

test('P7 erroneous percent check remains in history after correction',()=>{
 const a=freshLesson('decimal');a.index=2;
 a.models[2]={...exampleModel(TASKS.decimal[2]),fraction:'0.26'};
 assert.equal(submitLesson(a).correct,false);
 assert.equal(currentSubmission(a).status,'revise');
 a.models[2].fraction='26';
 assert.equal(currentSubmission(a).status,'modified','old check no longer applies to revised response');
 assert.equal(submitLesson(a).correct,true);
 assert.equal(currentSubmission(a).status,'correct');
 assert.equal(a.cases[2].attempts.length,2);
 assert.equal(a.cases[2].attempts[0].value.fraction,'0.26');
 assert.equal(a.cases[2].attempts[1].value.fraction,'26');
});


test('P7 completed reflections lead to the next real, uncompleted route activity',()=>{
 const route=ROUTES.find(r=>r.id==='A');
 assert.deepEqual(route.ids,['share','equivalent','decimal','quarters']);
 assert.equal(nextRouteLessonId(route,'decimal'),'quarters');
 assert.equal(nextRouteLessonId(route,'equivalent'),'decimal');
 assert.equal(nextRouteLessonId(route,'equivalent',id=>id==='decimal'),'quarters','skip already-completed activities');
 assert.equal(nextRouteLessonId(route,'quarters'),null,'no fabricated fifth activity');
 assert.equal(nextRouteLessonId(route,'not-in-route'),null,'unknown activities never make up a next step');
 assert.match(stageGuidance('reflect',{hasFollowingLesson:true}),/直接学习下一处/);
 assert.match(stageGuidance('reflect',{hasFollowingLesson:false}),/返回原知识空间/);
});

test('P7 saved reflection preserves verbatim notes and checked work through validation',()=>{
 const record=freshLesson('decimal');
 for(let i=0;i<TASKS.decimal.length;i++){
   record.index=i;
   record.models[i]=exampleModel(TASKS.decimal[i]);
   assert.equal(submitLesson(record).correct,true,'task '+(i+1)+' can finish');
 }
 record.view='summary';
 const original='一个是十分位，一个是百分位。';
 record.draft=original;
 addLessonNote(record,original);
 assert.equal(record.draft,'','saving clears only the transient text draft');
 const valid=validateLesson(record,'decimal');
 assert.equal(valid.view,'summary');
 assert.deepEqual(valid.notes.map(n=>n.text),[original]);
 assert.equal(valid.cases[2].attempts.length,1,'submitted evidence survives saving a note');
 assert.equal(lessonSummary(valid).completed,true,'saving is not a new judgment or completion rule');
});


test('P7 real 1/4 hundred-grid error shows a concrete repair action, then recheck',()=>{
 const a=freshLesson('quarters'),t=TASKS.quarters[0],m=modelForLesson(a);
 m.selected=Array.from({length:20},(_,i)=>i);m.decimal='0.2';
 assert.equal(submitLesson(a).correct,false);
 const wrong=currentSubmission(a);
 assert.equal(wrong.status,'revise');
 const guidance=correctionGuidance({task:t,model:m,checked:wrong});
 assert.match(guidance.observation,/20 格.*20\/100.*1\/4/);
 assert.match(guidance.action,/100 格平均分成 4 份/);
 assert.match(guidance.action,/调整涂色.*核对小数.*检查我的作品/);
 assert.match(guidance.method,/连接不同表示方式/);
 assert.equal(thinkingFeedback(t,m,a.cases[0]),null,'wrong answer is not credited with a thinking method');
 m.selected=Array.from({length:25},(_,i)=>i);m.decimal='0.25';
 assert.equal(currentSubmission(a).status,'modified');
 assert.equal(correctionGuidance({task:t,model:m,checked:currentSubmission(a)}),null,'outdated wrong feedback clears after edits');
 assert.equal(thinkingFeedback(t,m,a.cases[0]),null,'unsubmitted changes do not receive thinking evidence');
 assert.equal(submitLesson(a).correct,true);
 assert.equal(currentSubmission(a).status,'correct');
 const cue=thinkingFeedback(t,m,a.cases[0]);
 assert.equal(cue.method.nodeId,'mt_EBYGhd8X3x','actual source MP2 node, not an invented ID');
 assert.match(cue.observation,/25 格.*0\.25/);
 assert.match(cue.detail.join(' '),/不代表已经掌握/);
 assert.equal(a.cases[0].attempts.length,2);
 assert.equal(a.cases[0].attempts[0].value.selected.length,20);
});

test('P9 source thinking pilot uses only submitted representation and not an ungraded explanation',()=>{
 const t=TASKS.decimal[2],a=freshLesson('decimal');a.index=2;
 const m=modelForLesson(a);m.selected=Array.from({length:26},(_,i)=>i);m.decimal='0.26';m.fraction='26';
 assert.equal(thinkingFeedback(t,m,a.cases[2]),null);
 assert.equal(submitLesson(a).correct,true);
 const cue=thinkingFeedback(t,m,a.cases[2]);
 assert.equal(cue.method.nodeId,'mt_CUmjcE7W6c');
 assert.equal(cue.method.code,'ccss-math:MP.2');
 assert.match(cue.observation,/26 格.*0\.26/);
 assert.doesNotMatch(JSON.stringify(cue),/已掌握|能力评分|自由解释正确/);
 const changed=modelForLesson(a);changed.decimal='0.25';
 assert.equal(thinkingFeedback(t,changed,a.cases[2]),null);
});


test('P7 Mac screenshot: three checked cups explain each real fraction-decimal equivalence and MP2 link',()=>{
 const a=freshLesson('quarters');a.index=1;
 const t=TASKS.quarters[1],m=modelForLesson(a);
 assert.equal(t.type,'match');
 assert.equal(detailFor(a),null,'no explanation before checking any model');
 assert.equal(submitLesson(a).correct,false);
 assert.equal(detailFor(a),null,'a wrong cup model never gets confirmed as an equal relationship');
 a.models[1]=exampleModel(t);
 assert.equal(currentSubmission(a).status,'modified','replacing the error does not silently create a new check');
 assert.equal(detailFor(a),null,'unsent correct work is not checked evidence');
 assert.equal(submitLesson(a).correct,true);
 const explanation=detailFor(a);
 assert.equal(explanation.kind,'correct');
 assert.match(explanation.equation,/1\/2 = 50\/100 = 0\.5/);
 assert.match(explanation.equation,/3\/4 = 75\/100 = 0\.75/);
 assert.match(explanation.equation,/1\/4 = 25\/100 = 0\.25/);
 assert.match(explanation.explanation,/同样大小的一满杯.*分数.*小数/);
 assert.match(explanation.explanation,/并不是三杯水都一样多/);
 assert.match(explanation.question,/任选一杯/);
 assert.equal(explanation.method.nodeId,'mt_EBYGhd8X3x','use a real MP2 thinking source node');
 assert.equal(explanation.method.code,'ccss-math:MP.2');
 assert.equal(thinkingFeedback(t,a.models[1],a.cases[1]),null,'do not create a redundant thinking card in the work area');
 assert.match(REFLECTIONS.quarters,/百格涂了 1\/4.*杯子装了 1\/4.*相同.*不同/);
 assert.equal(a.cases[1].attempts.length,2,'earlier failed check remains in the original record');
 a.models[1].names[2]='0.20';
 assert.equal(currentSubmission(a).status,'modified');
 assert.equal(detailFor(a),null,'edits revoke a previous checked explanation and source method');
 assert.equal(submitLesson(a).correct,false);
 assert.equal(detailFor(a),null,'false math inference cannot be recovered from old success');
});


test('P7 end of route A offers a real, uncompleted source-linked practice rather than a dead-end',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
 const route=ROUTES.find(r=>r.id==='A');
 assert.equal(route.ids.at(-1),'quarters');
 assert.equal(nextRouteLessonId(route,'quarters'),null,'the configured route has no fabricated fifth lesson');
 const first=nextRelatedPractice('quarters',atlas);
 assert.ok(first,'a real source-linked practice can be offered after this route');
 assert.equal(first.id,'link-decimal-quarters','prefer the nearest verified prerequisite, decimal → quarters');
 assert.ok(sourceBridge(first.id,atlas),'the promoted action must follow an actual source relationship');
 const other=nextRelatedPractice('quarters',atlas,id=>id==='link-decimal-quarters');
 assert.equal(other?.id,'link-equivalent-quarters','a completed bridge is skipped in favor of another real source task');
 assert.equal(nextRelatedPractice('quarters',atlas,id=>id==='link-decimal-quarters'||id==='link-equivalent-quarters'),null,'all related practices completed: return to knowledge space');
 assert.equal(nextRelatedPractice('quarters',{edges:[]}),null,'never invent a next task without source evidence');
 assert.equal(nextRelatedPractice('link-decimal-quarters',atlas),null,'avoid recursive bridge recommendations');
 assert.match(stageGuidance('reflect',{hasRelatedPractice:true}),/不写文字也能继续/);
});

test('P7-D3-B: summary separates validated task results from an optional system proof and keeps one foreground next action',()=>{
 const runtime=readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8');
 const auxiliary=readFileSync(new URL('../dist/learning/p3-view.js',import.meta.url),'utf8');
 assert.match(runtime,/id="system-explanation" class="system-explanation"/,'system explanation remains opt-in');
 assert.match(runtime,/\$\{esc\(lesson\.summary\)\}/,'original math content is retained rather than deleted');
 assert.doesNotMatch(runtime,/<h2>\$\{lesson\.formal\}<\/h2><p>\$\{lesson\.summary\}/,'summary must not automatically show the solution above the learner explanation');
 assert.match(runtime,/这组操作已通过检查/,'screen distinguishes checked operation from ungraded prose');
 assert.match(runtime,/\$\{summary\.done\} \/ \$\{summary\.total\}/,'summary uses actual checked task evidence');
 assert.match(runtime,/data-primary-destination/,'the single next action still follows a real route or relation');
 assert.doesNotMatch(runtime,/\+btn\('restart',BRIDGES\[id\]/,'restart no longer competes with the main destination');
 assert.match(auxiliary,/button\('p3-retry','再试当前条件'\)/,'retrial remains accessible in contextual tools');
 assert.match(auxiliary,/button\('restart','重新做这组任务'\)/,'full-group restart is retained instead of being silently removed');
 assert.match(auxiliary,/stage==='reflect'\?'':passed/,'complete attempt history is not duplicated in two surface panels');
});

test('P7 route completion summary names optional writing and does not duplicate the primary source bridge',()=>{
 const html=readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8');
 const flow=readFileSync(new URL('../dist/learning/p3-view.js',import.meta.url),'utf8');
 assert.match(html,/class="reflection-optional"/);
 assert.match(html,/class="summary-thinking"/);
 assert.match(html,/继续探索：/);
 assert.match(html,/data-primary-destination/);
 assert.match(html,/nextLinkedPractice/);
 assert.match(flow,/primarySessionId=null/);
 assert.match(flow,/flow\.bridges\.filter\(b=>b\.id!==primarySessionId\)/);
});
