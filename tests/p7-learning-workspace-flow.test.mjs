import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,lessonSummary} from '../dist/learning/state.js';
import {TASKS} from '../dist/learning/tasks.js';
import {learningStage,stageGuidance,checkedMathExplanation} from '../dist/learning/workspace-flow.js';

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
