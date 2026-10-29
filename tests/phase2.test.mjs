import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {LESSONS,topicIds as allTopicIds} from '../dist/learning/catalog.js';
import {TASKS,defaultModel,validModel,inspect,voxels,splitVolumes,exampleModel} from '../dist/learning/tasks.js';
import {freshLesson,modelForLesson,submitLesson,supportLesson,lessonSummary,validateLesson,mergeLesson} from '../dist/learning/state.js';
import {fresh,validate,merge,backup,parseBackup,completionSummary,nodeState} from '../dist/exploration-core.js';
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const plan=JSON.parse(fs.readFileSync(new URL('../docs/content-plan/catalog.json',import.meta.url)));
const sampleIds=Object.keys(LESSONS).filter(id=>plan.batches[0].topicIds.includes(LESSONS[id].topicId));
const topicIds=sampleIds.map(id=>LESSONS[id].topicId);
const seq=n=>Array.from({length:n},(_,i)=>i);
const score=(id,index,value)=>inspect(TASKS[id][index],value);
function finish(id){const a=freshLesson(id);a.view='task';for(let i=0;i<TASKS[id].length;i++){a.index=i;a.models[i]=exampleModel(TASKS[id][i]);submitLesson(a);}return a;}

test('phase2 has exactly the twelve planned source nodes, including nine beyond legacy activities',()=>{
 assert.equal(topicIds.length,12);assert.equal(new Set(topicIds).size,12);
 assert.deepEqual([...topicIds].sort(),[...plan.batches[0].topicIds].sort());
 assert.equal(sampleIds.reduce((n,id)=>n+TASKS[id].length,0),30);
});
test('equal partition is necessary; sixths accept precise noninteger cut locations',()=>{
 assert.ok(score('share',0,{cuts:[20,40,60,80],selected:[4]}).correct);
 assert.ok(!score('share',0,{cuts:[10,40,60,80],selected:[4]}).correct);
 assert.ok(score('share',2,{cuts:[100/6,200/6,300/6,400/6,500/6],selected:[1,5]}).correct);
 assert.ok(!validModel(TASKS.share[2],{cuts:[20,10,50,66,83],selected:[0,1]}));
 assert.ok(!validModel(TASKS.share[0],{cuts:[20,40,60,80],selected:[1,1]}));
});
test('equivalence preserves the whole and the same number-line point',()=>{
 assert.ok(score('equivalent',0,{rows:[{n:2,d:4},{n:3,d:6},{n:4,d:8}]}).correct);
 assert.ok(!score('equivalent',0,{rows:[{n:3,d:4},{n:3,d:6},{n:4,d:8}]}).correct);
 assert.ok(score('equivalent',1,{mark:4}).correct);assert.ok(score('equivalent',2,{mark:6}).correct);
 assert.ok(!score('equivalent',2,{mark:4}).correct);
});
test('decimal positions and arbitrary shading patterns remain mathematically equivalent',()=>{
 assert.ok(score('decimal',0,{selected:seq(70).map(i=>99-i),decimal:'0.70',fraction:''}).correct);
 assert.ok(!score('decimal',0,{selected:seq(70),decimal:'0.07',fraction:''}).correct);
 assert.ok(score('decimal',1,{selected:seq(45),decimal:'.45',fraction:''}).correct);
 assert.ok(score('decimal',2,{selected:seq(26),decimal:'0.26',fraction:'26/100'}).correct);
 assert.ok(!score('decimal',2,{selected:seq(26),decimal:'0.26',fraction:'26/10'}).correct);
 assert.ok(score('decimal',3,{mark:30}).correct);assert.ok(!score('decimal',3,{mark:3}).correct);
});
test('quarters can be rebuilt through hundredths and transferred to three cups',()=>{
 assert.ok(score('quarters',0,{selected:seq(25),decimal:'0.25',fraction:''}).correct);
 assert.ok(!score('quarters',0,{selected:seq(4),decimal:'0.4',fraction:''}).correct);
 assert.ok(score('quarters',1,{heights:[50,75,25],names:['.5','.75','.25']}).correct);
 assert.ok(!score('quarters',1,{heights:[50,75,25],names:['.5','.25','.75']}).correct);
});
test('volume counts filled cubes, not surface squares or duplicated placements',()=>{
 assert.ok(score('space',0,{filled:seq(8),total:8}).correct);
 assert.ok(!score('space',0,{filled:seq(7),total:8}).correct);
 assert.ok(!validModel(TASKS.space[0],{filled:[0,0],total:8}));
 assert.ok(score('space',1,{surface:'square',inside:'cube',total:6}).correct);
 assert.ok(!score('space',1,{surface:'cube',inside:'square',total:6}).correct);
});
test('a correct cube total cannot conceal wrong layer factors; estimate is not judged by exactness',()=>{
 assert.ok(score('hidden',0,{filled:seq(12),perLayer:6,layers:2,total:12,estimate:null}).correct);
 assert.ok(!score('hidden',0,{filled:seq(12),perLayer:4,layers:3,total:12,estimate:null}).correct);
 assert.ok(score('hidden',1,{perLayer:9,layers:3,total:27,estimate:null}).correct);
 assert.ok(TASKS.hidden[1].staticView);
 assert.ok(!score('hidden',0,{filled:seq(11),perLayer:6,layers:2,total:12,estimate:null}).correct);
 assert.ok(score('hidden',2,{filled:seq(16),perLayer:8,layers:2,total:16,estimate:20}).correct);
 assert.ok(!score('hidden',2,{filled:seq(16),perLayer:8,layers:2,total:16,estimate:null}).correct);
});
test('cuboid formula is rejected for an incomplete bounding box',()=>{
 assert.ok(score('box',0,{perLayer:12,layers:5,total:60,estimate:null}).correct);
 assert.equal(voxels(TASKS.box[1]).length,58);
 assert.ok(score('box',1,{total:58,method:'count'}).correct);
 assert.ok(!score('box',1,{total:60,method:'formula'}).correct);
 assert.ok(!score('box',1,{total:58,method:'formula'}).correct);
});
test('different valid disjoint decompositions give the same total; incomplete parts fail',()=>{
 assert.ok(score('steps',0,{axis:'y',cut:1,first:8,second:8,total:16}).correct);
 assert.ok(score('steps',0,{axis:'x',cut:2,first:12,second:4,total:16}).correct);
 assert.ok(score('steps',1,{axis:'x',cut:2,first:12,second:6,total:18}).correct);
 assert.ok(!score('steps',0,{axis:'z',cut:2,first:16,second:0,total:16}).correct);
 assert.ok(!score('steps',0,{axis:'x',cut:1,first:6,second:10,total:16}).correct);
 for(const t of TASKS.steps){const parts=splitVolumes(t,'y',1);assert.equal(parts.reduce((s,p)=>s+p.count,0),voxels(t).length);}
});
test('data graphs require correct category counts, axis roles and a difference rather than taller height',()=>{
 assert.ok(score('bars',0,{counts:[7,4,2,3],answer:3,xLabel:'category',yLabel:'count'}).correct);
 assert.ok(!score('bars',0,{counts:[7,4,2,3],answer:7,xLabel:'category',yLabel:'count'}).correct);
 assert.ok(!score('bars',0,{counts:[7,4,2,3],answer:3,xLabel:'count',yLabel:'category'}).correct);
 assert.ok(score('tally',0,{counts:[6,3,2],answer:3,xLabel:'',yLabel:''}).correct);
});
test('collection must observe the whole source and retain correct categorical and discrete frequencies',()=>{
 for(const t of TASKS.survey){assert.deepEqual(t.labels.map((_,i)=>t.order.filter(v=>v===i).length),t.counts);}
 assert.ok(score('survey',0,{seen:9,counts:[4,3,2],choice:0}).correct);
 assert.ok(!score('survey',0,{seen:8,counts:[4,3,2],choice:0}).correct);
 assert.ok(!score('survey',0,{seen:9,counts:[5,3,2],choice:0}).correct);
 assert.ok(score('survey',1,{seen:10,counts:[2,4,3,1],choice:1}).correct);
});
test('representation preference is free, while each read value and category still must match',()=>{
 for(const preferred of ['table','bar','picture','list'])assert.ok(score('views',0,{counts:[5,3,2],left:3,right:3,preferred,reason:''}).correct);
 assert.ok(!score('views',0,{counts:[5,3,2],left:3,right:5,preferred:'table',reason:'很长的解释也不能掩盖错数'}).correct);
});
test('opening, submitting wrong work, or forcing summary never completes a new activity',()=>{
 const a=freshLesson('quarters');assert.ok(!lessonSummary(a).completed);a.view='task';submitLesson(a);assert.ok(!lessonSummary(a).completed);
 a.view='summary';const restored=validateLesson(a,'quarters');assert.equal(restored.view,'task');assert.ok(!lessonSummary(restored).completed);
 assert.throws(()=>validateLesson({...a,cases:{0:{support:false,attempts:[{id:'forged',at:'2026-10-24T00:00:00Z',value:{selected:[NaN]},supported:false,exposed:false}]}}},'quarters'));
});
test('hints, first errors and later corrections survive without becoming independent first success',()=>{
 const a=freshLesson('quarters');a.view='task';submitLesson(a);a.models[0]=exampleModel(TASKS.quarters[0]);submitLesson(a);a.index=1;supportLesson(a);a.models[1]=exampleModel(TASKS.quarters[1]);submitLesson(a);
 assert.ok(lessonSummary(a).completed);assert.ok(!lessonSummary(a).independent);
 const restored=validateLesson(a,'quarters');assert.equal(restored.cases[0].attempts.length,2);assert.ok(restored.cases[0].attempts[1].exposed);assert.ok(restored.cases[1].support);
});
test('new and old records roundtrip and merge without replacing working drafts or immutable history',()=>{
 const s=fresh();s.lessons.quarters=finish('quarters');s.lessonContinuation='quarters';
 const imported=parseBackup(JSON.stringify(backup(s)),atlas);assert.ok(lessonSummary(imported.lessons.quarters).completed);
 const current=fresh();current.lessons.quarters=freshLesson('quarters');current.lessons.quarters.draft='未提交的草稿';current.lessons.quarters.models[0]={selected:[99],decimal:'.01',fraction:''};
 const mixed=validate(merge(current,imported),atlas);assert.equal(mixed.lessons.quarters.draft,'未提交的草稿');assert.deepEqual(mixed.lessons.quarters.models[0].selected,[99]);assert.ok(lessonSummary(mixed.lessons.quarters).completed);
 const old=fresh();delete old.lessons;delete old.lessonContinuation;assert.deepEqual(validate(old,atlas).lessons,{});
 const again=mergeLesson(mixed.lessons.quarters,imported.lessons.quarters);assert.equal(again.cases[0].attempts.length,1);
});
test('all twelve can complete with deduplicated global progress and separate explanation status',()=>{
 const s=fresh();for(const id of sampleIds)s.lessons[id]=finish(id);
 assert.deepEqual(completionSummary(s),{done:12,total:allTopicIds.length});
 assert.deepEqual(completionSummary(s,[...topicIds,topicIds[0]]),{done:12,total:12});
 assert.equal(nodeState(s,LESSONS.share.topicId).explanation,'missing');
 assert.equal(parseBackup(JSON.stringify(backup(s)),atlas).schema,2);
});

test('delivery coverage includes every original goal, with local research gaps kept explicit',()=>{
 const coverage=JSON.parse(fs.readFileSync(new URL('../docs/phase2/coverage.json',import.meta.url)));
 assert.equal(coverage.nodes.length,12);assert.equal(coverage.counts.sourceGoals,36);
 assert.equal(coverage.nodes.filter(n=>n.research==='local-supplement').length,2);
 for(const n of coverage.nodes){const source=plan.nodes.find(s=>s.id===n.topicId);assert.deepEqual(n.goals.map(g=>g.sourceGoal),source.learningGoals);for(const g of n.goals){assert.ok(g.tasks.length);for(const t of g.tasks)assert.equal(TASKS[n.lessonId][t.index].type,t.type);}}
 execFileSync(process.execPath,['scripts/build_phase2_coverage.mjs','--check'],{cwd:fileURLToPath(new URL('../',import.meta.url)),timeout:10000});
});
