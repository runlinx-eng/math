import test from 'node:test';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b24-model.js';
import {transformBinding,replayTransformEvidence} from '../dist/learning/transform-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import fixture from './fixtures/p9-transform-cases.cjs';

await ensureB39Ready();
const {cases}=fixture;
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const task=(id,index=0)=>sessionTasks(id)[index];
const accepted=(t,m)=>{
 assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
 const proof=replayTransformEvidence(t,m);assert.ok(proof);return proof;
};
const rejected=(t,m,message)=>assert.equal(replayTransformEvidence(t,m),null,message);
const predict=(t,point=['0','0'])=>{
 const m=M.initial(t,314159);[m.predX,m.predY]=point;M.act(t,m,'p24-predict');return m;
};
const operate=(t,m,op=t.goal)=>{
 if(op.kind==='move'){m.dx=String(op.dx);m.dy=String(op.dy);}
 if(op.kind==='mirror')m.axis=op.line;
 if(op.kind==='turn'){m.angle=String(op.angle);m.cx=String(op.center[0]);m.cy=String(op.center[1]);}
 if(op.kind==='scale'){m.factor=String(op.factor);m.cx=String(op.center[0]);m.cy=String(op.center[1]);}
 M.act(t,m,'p24-operate');return m;
};
const finish=(t,m)=>{
 if(t.needsMeasure)M.act(t,m,'p24-measure');
 m.answers=t.questions.map(q=>String(q.value));return m;
};
const alternative=t=>({move:{kind:'move',dx:-12,dy:12},mirror:{kind:'mirror',line:'y=-x'},
 turn:{kind:'turn',angle:-90,center:[8,-8]},scale:{kind:'scale',factor:'3/2',center:[-8,8]}}[t.goal.kind]);
// Coordinate results were reviewed separately from both runtime geometry and
// adapter code; identity belongs to each named vertex, never an unordered set.
const expected=[
 [[5,3]],[[5,3],[7,3],[5,5]],[[4,4]],
 [[3,2],[5,2],[3,4]],[[-1,1],[-3,1],[-1,3]],[[-1,1],[-1,3],[-3,1]],
 [[-1,1],[-3,1],[-1,3]],[[0,3],[2,3],[0,5]],[[1,-1],[3,-1],[1,-3]],
 [[0,3],[2,3],[0,5]],[[-1,1],[-3,1],[-1,3]],[[1,1],[1,3],[-1,1]],
 [[4,-1],[6,-1],[4,1]],[[1,-1],[3,-1],[1,-3]],[[-1,1],[-3,1],[-1,3]],
 [[2,1],[2,3],[4,1]],[[1,2],[1,4],[-1,2]],[[-1,4],[1,4],[-1,6]],
 [[2,2],[6,2],[2,6]],[[6,10],[0,10],[0,0],[6,0]],[[3,1],[7,1],[3,5]],
 [[2,2],[6,2],[2,6]],[[5,3]]
];

test('23 complete native sources span nine nodes; bridges and cross-course copies are excluded',()=>{
 assert.equal(cases.length,23);assert.equal(new Set(cases.map(c=>c.nodeId)).size,9);
 for(const c of cases){
  const t=task(c.id,c.index),binding=transformBinding(t,c);
  assert.equal(t.type,'x-p24-transform');assert.equal(LESSONS[c.id].topicId,c.nodeId);
  assert.equal(hash(t),c.taskHash,'complete task hash requires deliberate source review');
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);assert.ok(binding.question.length>10);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},
   {...c,index:-1},{...c,index:9999},{...c,sessionId:'__proto__'}])assert.equal(transformBinding(t,context),null);
  for(const changed of [{...t,prompt:t.prompt+' changed'},{...t,shape:[[0,0]]},
   {...t,needsMeasure:!t.needsMeasure},{...t,predict:false},{...t,goal:{...t.goal,other:true}},
   {...t,questions:[]}])assert.equal(transformBinding(changed,c),null);
 }
 const found=[],counts={};
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{
  if(transformBinding(t,{sessionId:id,index})){found.push(id+':'+index);counts[t.goal.kind]=(counts[t.goal.kind]||0)+1;}
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(counts,{move:9,mirror:7,turn:3,scale:4});
 let associated=0;
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  assert.equal(transformBinding(t,{sessionId:id,index}),null);if(t.type==='x-p24-transform')associated++;
 });
 assert.equal(associated,31);
 // tooladv39 intentionally reuses pointmove0, but each requires its own source.
 assert.equal(transformBinding(task('pointmove'),{sessionId:'tooladv39',index:1}).nodeId,'mt_ZJC7JnnPCu');
 assert.equal(transformBinding(task('pointmove'),{sessionId:'pointread',index:0}),null);
});

for(const [i,c]of cases.entries())test(`${c.id}:${c.index} verifies actual parameters and every corresponding vertex`,()=>{
 const t=task(c.id,c.index),m=M.example(t),before=JSON.stringify(m),p=accepted(t,m);
 assert.deepEqual(p.sourcePoints,t.shape);assert.deepEqual(p.imagePoints,expected[i]);
 assert.deepEqual(p.operation,t.goal);assert.equal(p.kind,t.goal.kind);
 assert.equal(p.operationCount,1);assert.equal(p.measurementCount,t.needsMeasure?1:0);
 assert.equal(p.measured,t.needsMeasure);assert.equal(p.prediction.correct,true);
 assert.equal(p.automaticImage,true);assert.equal(p.independentMeasurementAssessed,false);
 const factor=t.goal.kind==='scale'?2:1;
 assert.equal(p.invariants.lengthFactor,String(factor));assert.equal(p.invariants.squaredLengthFactor,String(factor**2));
 assert.equal(p.invariants.edgeSquared.length,t.shape.length===1?0:t.shape.length);
 for(const edge of p.invariants.edgeSquared)assert.equal(BigInt(edge.after),BigInt(edge.before)*BigInt(factor**2));
 for(const angle of p.invariants.angleChecks){
  assert.equal(BigInt(angle.afterDot),BigInt(angle.beforeDot)*BigInt(factor**2));
  assert.equal(BigInt(angle.afterCross),BigInt(angle.beforeCross)*BigInt(factor**2)*BigInt(t.goal.kind==='mirror'?-1:1));
 }
 assert.equal(p.invariants.anglesPreserved,t.shape.length>2?true:null);
 assert.equal(p.invariants.orientationPreserved,t.shape.length>2?t.goal.kind!=='mirror':null);
 assert.deepEqual(p.display.imagePoints,expected[i].map(point=>'('+point.join(',')+')'));
 const record={attempts:[{value:structuredClone(m)}]};assert.ok(latestSubmissionMatches(m,record));
 const edited=structuredClone(m);edited.prose='我有另一个问题。';assert.equal(latestSubmissionMatches(edited,record),false);
 assert.equal(latestSubmissionMatches(m,{attempts:[...record.attempts,{value:edited}]}),false);
 assert.ok(latestSubmissionMatches(JSON.parse(JSON.stringify(m)),JSON.parse(JSON.stringify(record))));
 assert.equal(JSON.stringify(m),before,'proof lookup preserves the complete original record');
});

test('wrong predictions and near predictions stay distinguishable from verified transformation results',()=>{
 const t=task('pointmove');
 for(const guess of [['0','0'],['-2 1/2','3/2'],['5.00000001','3'],[' 5.0 ','6/2']]){
  const m=finish(t,operate(t,predict(t,guess))),p=accepted(t,m);
  assert.deepEqual(p.prediction.point,guess);assert.equal(p.prediction.correct,guess[0].trim()==='5.0');
  assert.deepEqual(p.imagePoints,[[5,3]]);
 }
 const near=finish(t,operate(t,predict(t,['5.00000001','3'])));
 assert.equal(near.board.first.incorrectPrediction,undefined,'legacy metadata tolerance is preserved');
 assert.equal(accepted(t,near).prediction.correct,false,'exact feedback does not adopt that tolerance');
});

test('all 23 tasks accept legal different transformations before returning to the target from the original shape',()=>{
 for(const c of cases){
  const t=task(c.id,c.index),m=predict(t);operate(t,m,alternative(t));
  if(t.needsMeasure)M.act(t,m,'p24-measure');
  operate(t,m);finish(t,m);const p=accepted(t,m);
  assert.equal(p.operationCount,2);assert.equal(p.measurementCount,t.needsMeasure?2:0);
  assert.deepEqual(p.operations[0].sourcePoints,t.shape);assert.deepEqual(p.operations[1].sourcePoints,t.shape);
  assert.deepEqual(p.imagePoints,M.example(t).board.image,'the second operation is not composed with the first');
  if(t.goal.kind==='scale'){
   assert.equal(p.operations[0].exactFactor,'3/2');assert.equal(p.operations[0].invariants.squaredLengthFactor,'9/4');
   assert.ok(p.operations[0].exactImagePoints.some(point=>point.some(v=>v.includes('/'))));
  }
 }
});

test('valid fractions, mixed numbers and decimals remain exact integer parameters and answers',()=>{
 const t=task('axisrules'),m=predict(t,[' 4.00 ','-2/2']);
 m.dx='6/2';m.dy='-1 1/1';M.act(t,m,'p24-operate');
 m.answers=['8/2','-1.0000'];const p=accepted(t,m);
 assert.deepEqual(p.operation,{kind:'move',dx:3,dy:-2});assert.equal(p.prediction.correct,true);
 const s=task('growshape'),n=predict(s);n.factor='1 1/1';n.cx='0.00';n.cy='0/9';M.act(s,n,'p24-operate');finish(s,n);
 assert.equal(accepted(s,n).invariants.lengthFactor,'2');
});

test('exact arithmetic rejects near answers, near integer parameters and rounded scale factors',()=>{
 for(const near of ['5.00000001','5.000000000000000000000000000001','4999999999999999999999999999999/1000000000000000000000000000000']){
  const t=task('pointmove'),m=M.example(t);m.answers[0]=near;
  assert.equal(M.inspect(t,m).correct,true,'original tolerance is unchanged');rejected(t,m,'a nearby answer is not exact');
 }
 const t=task('pointmove'),m=predict(t);m.dx='3.000000000000000000000000000001';m.dy='0';
 M.act(t,m,'p24-operate');finish(t,m);assert.equal(M.inspect(t,m).correct,true);rejected(t,m);
 const s=task('growshape'),n=predict(s);n.factor='2.000000000000000000000000000001';n.cx='0';n.cy='0';
 M.act(s,n,'p24-operate');finish(s,n);assert.equal(M.inspect(s,n).correct,true);rejected(s,n);
 for(const factor of ['1.000000000000000000000000000001','2.000000000000000000000000000001']){
  const rounded=predict(s);operate(s,rounded,{kind:'scale',factor,center:[0,0]});operate(s,rounded);finish(s,rounded);
  assert.equal(M.inspect(s,rounded).correct,true);rejected(s,rounded,'rounded-away transformation is not a new visible construction');
 }
 for(const bad of ['NaN','Infinity','1e0','+3','3/0','0 1/0','3.','3,0','3x','9'.repeat(1501)]){
  const model=M.example(t);model.answers[0]=bad;rejected(t,model);
 }
});

test('invalid operations cannot be erased by a later correct image and original final-work pass',()=>{
 const candidates=[
  [task('pointmove'),{kind:'move',dx:13,dy:0}],
  [task('gridmotion',1),{kind:'mirror',line:'z'}],
  [task('gridmotion',2),{kind:'turn',angle:45,center:[0,0]}],
  [task('gridmotion',2),{kind:'turn',angle:90,center:[9,0]}],
  [task('growshape'),{kind:'scale',factor:0,center:[0,0]}],
  [task('growshape'),{kind:'scale',factor:'4.00000001',center:[0,0]}],
  [task('growshape'),{kind:'scale',factor:-2,center:[0,0]}]
 ];
 for(const [t,bad]of candidates){
  const m=predict(t);operate(t,m,bad);assert.notEqual(m.issue,'');operate(t,m);finish(t,m);
  assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);rejected(t,m);
 }
 const t=task('pointmove'),m=M.initial(t,314159);m.predX='bad';m.predY='0';M.act(t,m,'p24-predict');
 m.predX='0';M.act(t,m,'p24-predict');operate(t,m);finish(t,m);assert.equal(M.inspect(t,m).correct,true);rejected(t,m);
});

test('negative mixed scale and positive-target answers fail without erasing invalid-operation history',()=>{
 const scale=task('growshape'),s=predict(scale);
 operate(scale,s,{kind:'scale',factor:'-0 1/2',center:[0,0]});
 assert.equal(s.board.image,null);assert.equal(s.board.op,null);assert.notEqual(s.issue,'');
 const failed=structuredClone(s.history.at(-1));assert.equal(failed.f.factor,'-0 1/2');
 operate(scale,s);finish(scale,s);
 assert.equal(M.valid(scale,s),true);assert.equal(M.inspect(scale,s).correct,true);
 assert.deepEqual(s.history[1],failed,'the failed negative scale stays in the original event history');
 rejected(scale,s,'a later correct image does not erase the failed negative scale');
 const move=task('pointmove');
 for(const input of ['-0 5/1','-00 5/1',' -000 5/1 ']){
  const n=M.example(move);n.answers[0]=input;assert.equal(M.valid(move,n),true);
  assert.equal(M.inspect(move,n).correct,false);rejected(move,n,'negative five is not the required positive five');
 }
});

test('legal negative mixed displacements preserve their actual direction before returning from the original shape',()=>{
 const move=task('pointmove');
 for(const dx of ['-0 2/1','-00 2/1',' -000 2/1 ']){
  const m=predict(move);operate(move,m,{kind:'move',dx,dy:'-0 3/1'});
  assert.deepEqual(m.board.op,{kind:'move',dx:-2,dy:-3});assert.deepEqual(m.board.image,[[0,0]]);assert.equal(m.issue,'');
  const first=structuredClone(m.history.at(-1));operate(move,m);finish(move,m);const p=accepted(move,m);
  assert.equal(p.operationCount,2);assert.deepEqual(p.operations[0].operation,{kind:'move',dx:-2,dy:-3});
  assert.deepEqual(p.operations[0].imagePoints,[[0,0]]);assert.deepEqual(p.imagePoints,[[5,3]]);
  assert.deepEqual(p.operations[1].sourcePoints,[[2,3]],'returning to the goal applies to the original point');
  assert.deepEqual(m.history[1],first);assert.equal(first.f.dx,dx);assert.equal(first.f.dy,'-0 3/1');
 }
 const half=predict(move);operate(move,half,{kind:'move',dx:'-0 1/2',dy:0});
 assert.equal(half.board.image,null);assert.notEqual(half.issue,'');operate(move,half);finish(move,half);
 assert.equal(M.inspect(move,half).correct,true);rejected(move,half,'negative half is outside this integer displacement control');
});

test('negative mixed predictions are real guesses and negative coordinates can be exactly correct answers',()=>{
 const move=task('pointmove');
 for(const guess of [['-0 5/1','3'],['0','-0 3/1']]){
  const n=finish(move,operate(move,predict(move,guess))),p=accepted(move,n);
  assert.equal(n.board.first.incorrectPrediction,true);assert.deepEqual(p.prediction.point,guess);assert.equal(p.prediction.correct,false);
  assert.deepEqual(p.imagePoints,[[5,3]],'a wrong guess does not erase the later valid transformation');
  const feedback=thinkingFeedback(move,n,{attempts:[{value:structuredClone(n)}]},{sessionId:'pointmove',index:0});
  assert.ok(feedback?.detail.some(line=>line.includes('猜想')&&line.includes('不同')));
 }
 const down=task('axisrules'),n=predict(down,['4','-0 1/1']);
 operate(down,n,{kind:'move',dx:3,dy:'-0 2/1'});n.answers=['4','-0 1/1'];const correct=accepted(down,n);
 assert.equal(correct.prediction.correct,true);assert.equal(n.board.first.incorrectPrediction,undefined);
 assert.deepEqual(correct.operation,{kind:'move',dx:3,dy:-2});assert.deepEqual(correct.imagePoints,[[4,-1],[6,-1],[4,1]]);
 const zero=finish(move,operate(move,predict(move,['-0 0/1','-0.000'])));
 assert.equal(accepted(move,zero).prediction.correct,false,'signed zero remains exactly zero');
 const negative=finish(move,operate(move,predict(move,['-1 1/2','-2 1/3'])));
 assert.equal(accepted(move,negative).prediction.correct,false,'ordinary negative mixed predictions remain valid');
});

test('redundant and hidden events fail strict replay while original grading remains unchanged',()=>{
 for(const kind of ['operate-before-prediction','measure-before-image','reset','dot','duplicate-predict','duplicate-operate','duplicate-measure','identity']){
  const t=task('gridmotion'),m=M.initial(t,314159);
  if(kind==='operate-before-prediction')operate(t,m);
  m.predX='0';m.predY='0';M.act(t,m,'p24-predict');
  if(kind==='measure-before-image')M.act(t,m,'p24-measure');
  if(kind==='dot')M.act(t,m,'p24-dot',{index:0});
  if(kind==='duplicate-predict')M.act(t,m,'p24-predict');
  if(kind==='identity')operate(t,m,{kind:'move',dx:0,dy:0});
  if(kind==='reset'){M.act(t,m,'p24-reset');M.act(t,m,'p24-predict');}
  operate(t,m);if(kind==='duplicate-operate')operate(t,m);
  finish(t,m);if(kind==='duplicate-measure')M.act(t,m,'p24-measure');
  assert.equal(M.valid(t,m),true,kind);assert.equal(M.inspect(t,m).correct,true,kind);rejected(t,m,kind);
 }
 const t=task('pointmove'),m=M.example(t);M.act(t,m,'p24-measure');
 assert.equal(M.inspect(t,m).correct,true);rejected(t,m,'no measurement control exists for this task');
});

test('a symmetric outline is not a no-op when corresponding vertex identities move',()=>{
 const t={...structuredClone(task('gridmotion',2)),shape:[[-1,-1],[1,-1],[1,1],[-1,1]],
  questions:[{label:'转了多少度',value:90}]};
 const m=predict(t);operate(t,m,{kind:'turn',angle:180,center:[0,0]});operate(t,m);finish(t,m);
 const p=accepted(t,m);assert.equal(p.operationCount,2);
 const sorted=points=>points.map(p=>p.join(',')).sort();
 assert.deepEqual(sorted(p.sourcePoints),sorted(p.imagePoints));assert.notDeepEqual(p.sourcePoints,p.imagePoints);
 assert.equal(p.invariants.anglesPreserved,true);
});

test('board, event, hidden fields and current parameter corruption are never inferred away',()=>{
 const t=task('growshape'),base=M.example(t);
 const mutations=[
  m=>m.history=[],m=>m.history.push({...structuredClone(m.history[0]),a:'unknown'}),
  m=>m.history[0].extra=true,m=>m.history[0].f.extra='',m=>m.history[0].d.index='0',
  m=>m.history[1].f.x='0',m=>m.history[1].f.dx='1',m=>m.history[1].f.factor=2,
  m=>m.board.image[1][0]+=1,m=>m.board.saved.cx='1',m=>m.board.op.center[0]=1,
  m=>m.board.first.operate.factor='3',m=>m.board.first.prediction.x='100',
  m=>m.board.extra=true,m=>m.board.measured=false,m=>m.factor='3',m=>m.cx='1',
  m=>m.predX='100',m=>m.x='1',m=>m.dx='1',m=>m.extra=true,
  m=>m.seed=0,m=>m.seed=4294967296,m=>m.issue='unresolved',m=>m.answers.push(''),
  m=>m.answers[0]=2,m=>m.history[1].d=null,m=>m.board.first.incorrectPrediction=true
 ];
 for(const change of mutations){const m=structuredClone(base);change(m);rejected(t,m);}
 for(const bad of [null,[],{},'model',false])rejected(t,bad);
 const m=structuredClone(base);m.cycle=m;rejected(t,m);
 const changedTask={...t,unexpected:true};rejected(changedTask,base);
});

test('parameter boundaries and quarter-turn directions are checked using exact coordinates',()=>{
 const t=task('gridmotion',2),m=predict(t);
 for(const op of [{kind:'turn',angle:-90,center:[-8,8]},{kind:'turn',angle:180,center:[8,-8]},t.goal])operate(t,m,op);
 const p=accepted(t,finish(t,m));
 assert.deepEqual(p.operations[0].imagePoints,[[-15,-1],[-15,-3],[-13,-1]]);
 assert.deepEqual(p.operations[1].imagePoints,[[15,-17],[13,-17],[15,-19]]);
 const s=task('growshape'),n=predict(s);
 for(const factor of ['1/3','4'])operate(s,n,{kind:'scale',factor,center:[0,0]});operate(s,n);finish(s,n);
 const proof=accepted(s,n);assert.equal(proof.operations[0].invariants.lengthFactor,'1/3');
 assert.deepEqual(proof.operations[0].exactImagePoints,[['1/3','1/3'],['1','1/3'],['1/3','1']]);
 assert.equal(proof.operations[1].invariants.squaredLengthFactor,'16');
});


test('feedback attributes generated coordinates and readouts to the tool and does not invent single-point geometry',()=>{
 for(const c of cases){
  const task=sessionTasks(c.id)[c.index],model=M.example(task),proof=replayTransformEvidence(task,model);
  const record={attempts:[{value:structuredClone(model)}]},feedback=thinkingFeedback(task,model,record,c);
  assert.ok(feedback);assert.equal(feedback.method,null);assert.ok(thinkingGuide(task,c));
  assert.ok(feedback.observation.includes('工具每次都从原图计算'));
  assert.ok(feedback.observation.includes(proof.display.operation));
  assert.ok(feedback.observation.includes(proof.display.sourcePoints[0]+' → '+proof.display.imagePoints[0]));
  assert.ok(feedback.detail.some(line=>line.includes('没有自动评价自由解释、独立作图、独立量取或长期掌握')));
  if(task.shape.length===1)assert.ok(!feedback.detail.some(line=>line.includes('对应边长')||line.includes('形成的角保持相同')));
  if(task.needsMeasure)assert.ok(feedback.detail.some(line=>line.includes('这些读数由工具生成')));
 }
});
