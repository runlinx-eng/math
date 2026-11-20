import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-area-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b30-model.js';
import {freshLesson,submitLesson,currentSubmission,validateLesson} from '../dist/learning/state.js';
import {studyActionFocus} from '../dist/learning/workspace-flow.js';
import {areaBinding,replayAreaEvidence as replay} from '../dist/learning/area-evidence.js';
import {perimeterEdgeBinding} from '../dist/learning/perimeter-edge-evidence.js';
import {unitTileAreaBinding,replayUnitTileAreaEvidence} from '../dist/learning/unit-tile-area-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {applyAreaFixtureStep as apply,areaEvidenceExample as example} from '../scripts/area-evidence-fixture.mjs';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
await ensureB39Ready();
const cp=structuredClone,{cases,excludedCases,associatedCases}=fixture;
const task=c=>sessionTasks(c.id)[c.index],key=c=>c.id+':'+c.index,find=(id,index=0)=>cases.find(c=>c.id===id&&c.index===index);
const act=(t,m,a,index)=>apply(t,m,{action:a==='turn'?'turn-extra':'a30-'+a,...(index===undefined?{}:{data:{index}})});
const field=(t,m,k,v)=>apply(t,m,{field:k,value:String(v)});
const saved=m=>({support:false,attempts:[{value:cp(m)}]});
const accepted=(t,m)=>{assert.ok(M.valid(t,m));assert.ok(M.inspect(t,m).correct);const p=replay(t,m);assert.ok(p);return p;};
const rejected=(t,m)=>assert.equal(replay(t,m),null);
const plan=(c,m)=>{for(const s of c.actions)apply(task(c),m,s);return m;};
const answers=(c,m)=>c.answers.forEach((v,i)=>field(task(c),m,'answers.'+i,v));
const resultFields=(c,m)=>{for(const s of c.actions)if(s.field&&['area','perimeter','unit','areaUnit','radius','diameter'].includes(s.field))apply(task(c),m,s);answers(c,m);};
const rect=(t,m,[x,y,w,h])=>{act(t,m,'corner',y*t.w+x);act(t,m,'corner',(y+h-1)*t.w+x+w-1);act(t,m,'rect');};
function build(t,m,values){['w1','h1','w2','h2'].forEach((k,i)=>field(t,m,k,values[i]));act(t,m,'build');}
function repair(c,m){
 const t=task(c);
 if(['partition','design'].includes(c.kind))act(t,m,'clear');
 if(c.kind==='stadium'){if(m.board.unrolled)act(t,m,'unroll');for(const i of [...m.board.pieces])act(t,m,'piece',i);for(const i of [...m.board.edges])act(t,m,'edge',i);}
 if(c.kind==='openbox')for(const i of [...m.board.selected])act(t,m,'face',i);
 return plan(c,m);
}
function wrong(c,m){
 const t=task(c);
 if(['partition','design'].includes(c.kind)){act(t,m,'rect');rect(t,m,c.expected.independentRectangles[0]);rect(t,m,c.expected.independentRectangles[0]);}
 if(c.kind==='compare')build(t,m,[0,1,1,1]);
 if(c.kind==='pieces'){field(t,m,'part',0);act(t,m,'part');}
 if(c.kind==='stadium')act(t,m,'edge',3);
 if(c.kind==='openbox'){act(t,m,'face',4);field(t,m,'faceValues.4',600);}
 resultFields(c,m);assert.equal(M.inspect(t,m).correct,false);return m;
}
function record(c,m){const a=freshLesson(c.id);a.index=c.index;a.models[c.index]=m;return a;}
function submit(a,correct){const old=cp(a.cases[a.index]?.attempts||[]),value=cp(a.models[a.index]);assert.equal(submitLesson(a).correct,correct);assert.deepEqual(a.cases[a.index].attempts.slice(0,-1),old);assert.deepEqual(a.cases[a.index].attempts.at(-1).value,value);assert.deepEqual(a.models[a.index],value);return a.cases[a.index];}

test('17 original area-family bindings, 26 exclusions from area replay and 44 associated sources remain separate',()=>{
 assert.equal(cases.length,17);assert.equal(new Set(cases.map(c=>c.nodeId)).size,9);assert.equal(excludedCases.length,26);assert.equal(associatedCases.length,44);
 assert.deepEqual(Object.fromEntries(['partition','design','compare','pieces','stadium','openbox'].map(k=>[k,cases.filter(c=>c.kind===k).length])),{partition:6,design:1,compare:4,pieces:4,stadium:1,openbox:1});
 const allNative=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).map((t,index)=>({id,index,t}))).filter(r=>M.TYPES.has(r.t.type));
 const allAssociated=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).map((t,index)=>({id,index,t}))).filter(r=>M.TYPES.has(r.t.type));
 assert.deepEqual(allNative.map(key).sort(),[...cases,...excludedCases].map(key).sort());assert.deepEqual(allAssociated.map(key).sort(),associatedCases.map(key).sort());
 for(const c of [...cases,...excludedCases,...associatedCases]){
  const t=task(c),m=example(t);assert.equal(taskFingerprint(t),c.taskHash);assert.ok(M.valid(t,m));assert.ok(M.inspect(t,m).correct);assert.deepEqual(m.answers,c.answers);
  const areaReviewed=cases.includes(c),edgeReviewed=!!perimeterEdgeBinding(t,c),tileReviewed=!!unitTileAreaBinding(t,c);
   const tileProven=tileReviewed&&!!replayUnitTileAreaEvidence(t,m,c);
   assert.equal(!!areaBinding(t,c),areaReviewed);
   assert.equal(!!thinkingGuide(t,c),areaReviewed||edgeReviewed||tileReviewed);
   assert.equal(!!thinkingFeedback(t,m,saved(m),c),areaReviewed||edgeReviewed||tileProven);
  if(excludedCases.includes(c))rejected(t,m);
 }
 for(const [path,hash]of Object.entries(fixture.sourceFiles))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),hash,path+' remains unchanged');
});

test('exact geometry, areas, perimeters and current retained records agree with independent literal results',()=>{
 for(const c of cases){const t=task(c),m=example(t),p=accepted(t,m),x=p.construction,e=c.expected;
  assert.equal(p.kind,c.kind);assert.equal(p.history.events.length,m.history.length);assert.deepEqual(p.first,m.board.first);assert.equal(p.issue,m.issue);
  if(['partition','design'].includes(c.kind)){
   const target=c.kind==='design'?e.constructed:e;assert.equal(x.totalArea,String(target.area));assert.equal(x.perimeter,String(target.perimeter));assert.equal(x.boundaryEdges.length,target.perimeter);
   assert.deepEqual(x.rectangles.map(r=>[r.x,r.y,r.width,r.height]),e.independentRectangles);assert.equal(new Set(x.cells.map(p=>p.join(','))).size,x.cells.length);
   assert.equal(x.rectangles.reduce((s,r)=>s+BigInt(r.area),0n),BigInt(x.totalArea));if(c.kind==='design')assert.ok(x.shape);
  }else if(c.kind==='compare'){assert.deepEqual(x.dimensions,e.independentDimensions.map(String));assert.deepEqual(x.areas,e.areas.map(String));assert.deepEqual(x.perimeters,e.perimeters.map(String));assert.equal(p.pending.mathExact,true);}
  else if(c.kind==='pieces'){assert.deepEqual(x.parts.map(p=>p.area),e.pieceAreas);assert.equal(x.area,e.result);assert.equal(x.partitionByTool,true);}
  else if(c.kind==='stadium'){assert.equal(x.perimeter,e.perimeterApprox);assert.equal(x.area,e.areaApprox);assert.equal(x.piApproximation,'157/50');assert.deepEqual(x.edges,[0,1,2]);}
  else{assert.equal(x.surface,e.surface);assert.deepEqual(x.faces.map(f=>f.area),['300','300','200','200','600']);assert.deepEqual(x.excluded,[4]);assert.equal(x.fieldEditTimingKnown,false);}
 }
});

test('every source retains actual failure, correction, five original submissions and both shared retries',()=>{
 for(const c of cases){const t=task(c),a=record(c,M.initial(t));let m=a.models[c.index];assert.equal(studyActionFocus({task:t,model:m}).readyToCheck,true);
  wrong(c,m);const failure=cp(m),first=cp(m.board.first);submit(a,false);rejected(t,m);repair(c,m);assert.deepEqual(m.history.slice(0,failure.history.length),failure.history);
  for(const[k,v]of Object.entries(first))assert.deepEqual(m.board.first[k],v);accepted(t,m);assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);submit(a,true);assert.ok(thinkingFeedback(t,m,a.cases[c.index],c));
  for(const againWrong of [true,false]){const old=cp(a.cases),notes=cp(a.notes);a.models[c.index]=M.initial(t);m=a.models[c.index];assert.deepEqual(a.cases,old);assert.deepEqual(a.notes,notes);assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);
   if(againWrong){wrong(c,m);submit(a,false);repair(c,m);}else plan(c,m);
   accepted(t,m);assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);submit(a,true);assert.ok(thinkingFeedback(t,m,a.cases[c.index],c));
  }
  assert.equal(a.cases[c.index].attempts.length,5);assert.deepEqual(validateLesson(cp(a),c.id),a);
 }
});

test('pending corners and terminal overlapping attempts preserve completed rectangles and actual issues',()=>{
 for(const c of cases.filter(c=>['partition','design'].includes(c.kind))){const t=task(c),m=example(t),a=record(c,m);submit(a,true);const complete=cp(accepted(t,m).construction),old=cp(m.history);
  const [x,y,w,h]=c.expected.independentRectangles[0];act(t,m,'corner',y*t.w+x);assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);
  let p=accepted(t,m);assert.deepEqual(p.construction,complete);assert.equal(p.pending.corners.length,1);submit(a,true);
  act(t,m,'corner',(y+h-1)*t.w+x+w-1);p=accepted(t,m);assert.deepEqual(p.construction,complete);assert.equal(p.pending.corners.length,2);submit(a,true);
  act(t,m,'rect');assert.match(m.issue,/重叠/);p=accepted(t,m);assert.deepEqual(p.construction,complete);assert.equal(p.history.failedRequests.at(-1).issue,m.issue);assert.deepEqual(m.history.slice(0,old.length),old);submit(a,true);
  const first=cp(m.board.first);act(t,m,'clear');rejected(t,m);plan(c,m);accepted(t,m);assert.deepEqual(m.board.first,first);submit(a,true);assert.deepEqual(validateLesson(cp(a),c.id),a);
 }
});

test('source-specific partitions and specified rectangle pairs cannot borrow ordinary correct alternatives',()=>{
 const c=find('areadistrib'),t=task(c),m=M.initial(t);rect(t,m,[0,0,6,2]);rect(t,m,[0,2,6,1]);resultFields(c,m);assert.ok(M.inspect(t,m).correct);rejected(t,m);repair(c,m);accepted(t,m);
 const p=find('areaPerim',2),q=task(p),n=M.initial(q);build(q,n,[3,8,4,6]);answers(p,n);assert.ok(M.inspect(q,n).correct);rejected(q,n);
 for(const pair of [[2,12,4,6],[12,2,6,4],[4,6,2,12],[6,4,12,2]]){build(q,n,pair);accepted(q,n);}
 const r=find('rectsplit',2),s=task(r),x=M.initial(s);rect(s,x,[0,0,5,3]);rect(s,x,[0,3,3,2]);rect(s,x,[3,3,2,1]);resultFields(r,x);assert.ok(M.valid(s,x));rejected(s,x);repair(r,x);accepted(s,x);
});

test('L witness accepts rotations, mirrors and subdivision, but rejects an original-correct T shape',()=>{
 const c=find('lperim',2),t=task(c);
 for(const [a,b]of [[1,1],[3,7],[8,2],[9,9]])for(const [right,bottom]of [[false,false],[true,false],[false,true],[true,true]]){
  const cells=[];for(let y=0;y<10;y++)for(let x=0;x<10;x++)if(!(right?x>=10-a:x<a)||!(bottom?y>=10-b:y<b))cells.push([x,y]);
  const m=M.initial(t);for(const[x,y]of cells)rect(t,m,[x,y,1,1]);field(t,m,'perimeter',40);field(t,m,'unit','cm');const p=accepted(t,m);assert.equal(p.construction.totalArea,String(100-a*b));assert.equal(p.construction.shape.removedArea,a*b);
 }
 const m=M.initial(t);rect(t,m,[0,0,10,2]);rect(t,m,[4,2,2,8]);field(t,m,'perimeter',40);field(t,m,'unit','cm');assert.ok(M.inspect(t,m).correct);rejected(t,m);repair(c,m);accepted(t,m);
});

test('approximate accepted build stays historical until an actual exact build supersedes it',()=>{
 for(const c of cases.filter(c=>c.kind==='compare')){const t=task(c),m=M.initial(t),dims=c.expected.independentDimensions.map(String),near=[...dims];near[0]+='.00000000000000000001';
  build(t,m,near);answers(c,m);assert.ok(M.inspect(t,m).correct);rejected(t,m);const raw=cp(m.history);
  field(t,m,'w1',dims[0]);assert.ok(M.inspect(t,m).correct);rejected(t,m);assert.deepEqual(m.history,raw);
  act(t,m,'build');let p=accepted(t,m);assert.deepEqual(m.history.slice(0,raw.length),raw);assert.equal(p.history.approximateAccepted.length,1);
  build(t,m,[0,1,1,1]);['w1','h1','w2','h2'].forEach((k,i)=>field(t,m,k,dims[i]));p=accepted(t,m);assert.match(p.issue,/1 到 12/);assert.deepEqual(p.construction.dimensions,dims);
  const a=record(c,m);submit(a,true);field(t,m,'w1',near[0]);assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);
  p=accepted(t,m);assert.equal(p.pending.mathExact,false);assert.equal(p.pending.unapplied,true);assert.deepEqual(p.construction.dimensions,dims);submit(a,true);assert.ok(thinkingFeedback(t,m,a.cases[c.index],c));
 }
});

test('part records distinguish near acceptance, exact rerecording, terminal failure and pending visible input',()=>{
 for(const c of cases.filter(c=>c.kind==='pieces')){const t=task(c),m=example(t),first=cp(m.board.first);act(t,m,'active',0);const raw=c.expected.pieceAreas[0]+'.00000000000000000001';field(t,m,'part',raw);act(t,m,'part');assert.ok(M.inspect(t,m).correct);rejected(t,m);
  field(t,m,'part',c.expected.pieceAreas[0]);assert.ok(M.inspect(t,m).correct);rejected(t,m);act(t,m,'part');let p=accepted(t,m);assert.equal(p.history.approximateAccepted.length,1);const retained=cp(p.construction);
  field(t,m,'part',0);act(t,m,'part');assert.match(m.issue,/这一块/);p=accepted(t,m);assert.deepEqual(p.construction,retained);assert.deepEqual(m.board.first,first);
  const a=record(c,m);submit(a,true);const history=cp(m.history),board=cp(m.board);field(t,m,'part',7);assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);
  p=accepted(t,m);assert.deepEqual(p.construction,retained);assert.deepEqual(m.history,history);assert.deepEqual(m.board,board);assert.equal(p.pending.unapplied,true);submit(a,true);assert.ok(thinkingFeedback(t,m,a.cases[c.index],c));
 }
});

test('wrong seam selection is retained and only actual outer boundaries contribute to stadium evidence',()=>{
 const c=find('circleArea',2),t=task(c),m=example(t);act(t,m,'edge',3);assert.equal(M.inspect(t,m).correct,false);rejected(t,m);act(t,m,'edge',3);const p=accepted(t,m);assert.equal(p.bad,true);assert.deepEqual(p.construction.edges,[0,1,2]);assert.ok(p.history.events.some(e=>e.input.i==='3'));
 field(t,m,'perimeter','28.560000000000001');assert.ok(M.inspect(t,m).correct);rejected(t,m);field(t,m,'perimeter','714/25');accepted(t,m);
});

test('the optional lid value can persist only after a real visible editing window and never contributes to surface',()=>{
 const c=find('netSurface',2),t=task(c),m=example(t),fake=cp(m);fake.faceValues[4]='600';assert.ok(M.inspect(t,fake).correct);rejected(t,fake);
 act(t,m,'face',4);field(t,m,'faceValues.4',600);assert.equal(M.inspect(t,m).correct,false);rejected(t,m);act(t,m,'face',4);let p=accepted(t,m);assert.equal(p.construction.surface,'1600');assert.deepEqual(p.construction.storedUnselected,[{identity:4,raw:'600',wasVisible:true,counted:false}]);
 act(t,m,'face',4);field(t,m,'faceValues.4','a retained earlier wrong number');act(t,m,'face',4);p=accepted(t,m);assert.equal(p.construction.surface,'1600');assert.equal(p.construction.fieldEditTimingKnown,false);
});

test('feedback attributes recorded parts and current faces without inventing a selection or lid removal',()=>{
 for(const c of cases.filter(c=>c.kind==='pieces')){
  const t=task(c),m=M.initial(t);assert.equal(m.board.active,0);
  for(const [index,step]of c.actions.entries())if(index!==0)apply(t,m,step);
  assert.ok(!m.history.some(e=>e.a==='active'&&e.i==='0'));
  assert.equal(m.history[0].a,'part');accepted(t,m);
  const feedback=thinkingFeedback(t,m,saved(m),c);assert.ok(feedback);
  assert.match(feedback.observation,/你实际记下了这些部分的面积/);
  assert.doesNotMatch(JSON.stringify(feedback),/分别选中|实际选择/);
  assert.match(feedback.detail.join(' '),/各部分身份、逐次记下的面积/);
 }
 const c=find('netSurface',2),t=task(c),m=example(t);
 assert.ok(!m.history.some(e=>e.a==='face'&&e.i==='4'));accepted(t,m);
 const feedback=thinkingFeedback(t,m,saved(m),c);assert.ok(feedback);
 assert.match(feedback.observation,/当前选中底面和四个侧面，没有把上盖计入/);
 assert.doesNotMatch(JSON.stringify(feedback),/去掉上盖|以前选过又取消/);
 act(t,m,'face',4);field(t,m,'faceValues.4',600);act(t,m,'face',4);accepted(t,m);
 assert.match(thinkingFeedback(t,m,saved(m),c).detail.join(' '),/以前选过又取消的上盖/);
});

test('hidden controls, payload changes, forged replay state and non-exact current quantities fail closed',()=>{
 for(const c of cases){const t=task(c),m=example(t),mutations=[x=>x.extra=1,x=>x.board.extra=1,x=>x.board.first.extra=1,x=>x.issue='forged',x=>x.history[0].extra=1,x=>x.history[0].f.extra='1',x=>x.history=[],x=>x.answers.push('forged'),x=>x.base='hidden'];
  if(c.kind!=='openbox')mutations.push(x=>x.history.push({a:'turn',i:'',f:{}}));else mutations.push(x=>x.history.push({a:'split',i:'',f:{}}));
  for(const mutate of mutations){const fake=cp(m);mutate(fake);rejected(t,fake);assert.equal(thinkingFeedback(t,fake,saved(fake),c),null);}
  const indexed=m.history.findIndex(e=>e.i!=='');if(indexed>=0){const fake=cp(m);fake.history[indexed].i='0'+fake.history[indexed].i;rejected(t,fake);}
  const stale=cp(m);field(t,stale,'prose','current work changed after the old check');assert.equal(thinkingFeedback(t,stale,saved(m),c),null);
  const borrowed=cp(t);borrowed.prompt+=' changed';assert.equal(areaBinding(borrowed,c),null);rejected(borrowed,m);
  for(const ctx of [null,{},[],{sessionId:[c.id],index:c.index},{sessionId:c.id,index:String(c.index)},{sessionId:'constructor',index:0},{sessionId:c.id,index:-1}])assert.equal(areaBinding(t,ctx),null);
 }
});

test('current input spellings and the complete final snapshot remain intact through feedback and v2 record validation',()=>{
 for(const c of cases){const t=task(c),m=example(t),a=record(c,m),before=JSON.stringify(m);submit(a,true);const feedback=thinkingFeedback(t,m,a.cases[c.index],c);assert.ok(feedback);assert.equal(JSON.stringify(m),before);
  assert.equal(feedback.method,null);assert.match(feedback.detail.join(' '),/自由解释/);assert.match(feedback.detail.join(' '),/长期掌握/);assert.doesNotMatch(JSON.stringify(feedback),/MP\.\d|已掌握/);
  assert.deepEqual(validateLesson(cp(a),c.id),a);field(t,m,'prose','new ungraded explanation');assert.equal(currentSubmission(a).status,'modified');assert.equal(thinkingFeedback(t,m,a.cases[c.index],c),null);submit(a,true);assert.ok(thinkingFeedback(t,m,a.cases[c.index],c));
 }
});
