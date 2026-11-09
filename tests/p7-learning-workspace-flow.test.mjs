import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,lessonSummary,addLessonNote,validateLesson} from '../dist/learning/state.js';
import {TASKS,inspect,exampleModel} from '../dist/learning/tasks.js';
import {learningStage,stageGuidance,checkedMathExplanation,nextRouteLessonId} from '../dist/learning/workspace-flow.js';
import {ROUTES} from '../dist/learning/catalog.js';

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
