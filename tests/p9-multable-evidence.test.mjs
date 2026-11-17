import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-multable-cases.cjs';
import * as M from '../dist/learning/phase5/b14-model.js';
import * as V from '../dist/learning/phase5/b14-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import * as Daily from '../dist/learning/daily.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {TASKS,PRACTICE,defaultModel,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor,sessionMeta,sessionRoute} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {multableBinding as binding,replayMultableEvidence as replay} from '../dist/learning/multable-evidence.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
await ensureB39Ready();
const cp=structuredClone,at=c=>sessionTaskFor(c.id,c.index),context=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
const record=m=>({attempts:[{value:cp(m)}]});
function field(t,m,key,value){const html=V.render(t,m),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-xfield']===key);
 assert.equal(tags.length,1,'one visible original field '+key);assert.doesNotMatch(tags[0],/\bdisabled\b|\breadonly\b/);
 if(tags[0].startsWith('<select')){const begin=html.indexOf(tags[0]),body=html.slice(begin,html.indexOf('</select>',begin));assert.ok([...body.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)),'actual select option '+value);}
 m[key]=String(value);M.field(t,m,key);assert.equal(M.valid(t,m),true);
}
function action(t,m,name){const tags=[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-x']===name);assert.equal(tags.length,1,'one visible original action '+name);assert.doesNotMatch(tags[0],/\bdisabled\b/);M.act(t,m,name);assert.equal(M.valid(t,m),true);return m;}
const plain=x=>String(x);
function estimate(c,m,spell=plain){const t=at(c);if(!m.board.estimateOK){field(t,m,'estimate',spell(c.math.estimatedProduct));action(t,m,'b14-estimate');}}
function columns(c,m,spell=plain){const t=at(c),row=c.math.rows[m.board.row];while(m.board.col<row.columns.length){const q=row.columns[m.board.col];if(!m.board.pending){field(t,m,'raw',spell(q.raw));action(t,m,'b14-mul-count');}while(m.board.pending.loose>=10)action(t,m,'b14-trade');field(t,m,'digit',spell(q.loose));action(t,m,'b14-digit');}}
function finish(c,m=M.initial(at(c)),spell=plain){const t=at(c);estimate(c,m,spell);while(m.board.row<c.math.rows.length){const row=c.math.rows[m.board.row];columns(c,m,spell);field(t,m,'shift',row.shift);field(t,m,'rowvalue',spell(row.value));action(t,m,'b14-row');}field(t,m,'answer',spell(c.math.product));return m;}
function firstPending(c){const t=at(c),m=M.initial(t);estimate(c,m);field(t,m,'raw',c.math.rows[0].columns[0].raw);action(t,m,'b14-mul-count');return m;}
const reject=(t,m)=>assert.equal(replay(t,m),null);
const oldOnly=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);reject(t,m);};
const retryTags=a=>{const host={innerHTML:''};renderP3Flow(host,{atlas,id:a.id,record:a});return [...host.innerHTML.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-do']==='p3-retry');};

test('all current original positions, complete fingerprints and seventeen source file hashes are fixed',()=>{
 for(const[file,sha]of Object.entries(fixture.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 assert.equal(Object.keys(fixture.sourceHashes).length,17);
 for(const c of [...fixture.cases,...fixture.excluded,...fixture.associated,...fixture.practice]){assert.deepEqual(at(c),c.task);assert.equal(hash(at(c)),c.taskHash);}
 const native=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-multable'?[id+':'+index]:[]));
 const associated=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-multable'?[id+':'+index]:[]));
 assert.deepEqual(native.sort(),[...fixture.cases,...fixture.excluded].map(c=>c.id+':'+c.index).sort());assert.equal(native.length,11);assert.equal(fixture.cases.length,10);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,5);
 assert.deepEqual(associated.sort(),fixture.associated.map(c=>c.id+':'+c.index).sort());assert.equal(associated.length,17);
 assert.deepEqual(Object.keys(PRACTICE).filter(id=>PRACTICE[id].type==='x-multable').sort(),fixture.practice.map(c=>c.id).sort());assert.equal(fixture.practice.length,3);
});

for(const c of fixture.cases)test(c.id+':'+c.index+' conserves every real trade, carry and weighted partial product',()=>{
 const t=at(c),m=finish(c),before=cp(m),proof=replay(t,m);assert.ok(proof);assert.deepEqual(m,before);assert.equal(M.inspect(t,m).correct,true);
 const p=proof.construction;assert.equal(p.product,c.math.product);assert.equal(p.trades.length,c.math.trades);assert.equal(p.columns.length,c.math.columnCount);assert.equal(p.rows.length,c.math.rows.length);assert.equal(p.estimate.product,c.math.estimatedProduct);assert.deepEqual(p.firstEstimate,{raw:String(c.math.estimatedProduct),correct:true});
 for(const row of c.math.rows){const r=p.rows[row.row];assert.equal(r.rowScale,10**row.row);assert.equal(r.multiplierDigit,row.multiplierDigit);assert.equal(r.unshifted,row.unshifted);assert.equal(r.value,row.value);assert.deepEqual(r.digits,row.digits);assert.equal(r.lastCarry,row.carry);
  for(const q of row.columns){const k=p.columns.find(k=>k.row===row.row&&k.column===q.column);assert.equal(k.raw,q.raw);assert.equal(k.incoming,q.incoming);assert.equal(k.digit,q.loose);assert.equal(k.carry,q.trades);assert.equal(k.tradeIndices.length,q.trades);assert.equal(k.raw,k.aDigit*k.bDigit+k.incoming);assert.equal(k.raw,k.digit+10*k.carry);}
 }
 for(const q of p.trades){assert.equal(q.before.loose-q.after.loose,10);assert.equal(q.after.bundles-q.before.bundles,1);assert.equal(q.before.raw,q.after.raw);assert.equal(q.quantity,(q.before.loose+10*q.before.bundles)*q.weightedUnit);assert.equal(q.quantity,(q.after.loose+10*q.after.bundles)*q.weightedUnit);}
 assert.equal(p.rows.reduce((n,r)=>n+BigInt(r.value),0n),BigInt(t.a)*BigInt(t.b));assert.equal(proof.submittedAnswer.raw,String(c.math.product));assert.equal(proof.independentAdditionProcessAssessed,false);assert.equal(proof.independentAlgorithmDesignAssessed,false);assert.equal(proof.independentMentalCalculationAssessed,false);
 assert.equal(binding(t,context(c)).nodeId,c.nodeId);assert.equal(binding(t,context(c)).method,null);assert.ok(replay(t,exampleModel(t)),'unchanged original example needs no helper');assert.equal(proof.limitBehavior,'original-write-validation-block');
});

test('exact original source is required; foreign contexts, wording and quantities cannot self-authorize',()=>{
 for(const c of fixture.cases){const t=at(c),m=finish(c);for(const x of [null,[],{},false,{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},{sessionId:c.id,index:c.index+.25},{sessionId:'__proto__',index:c.index},{sessionId:[c.id],index:c.index}])assert.equal(binding(t,x),null);
  for(const mutate of [x=>x.prompt+=' altered',x=>x.a++,x=>x.b++,x=>x.estimate++,x=>x.extra=true,x=>delete x.prompt]){const other=cp(t);mutate(other);assert.equal(binding(other,context(c)),null);reject(other,m);}
 }
});

test('the zero-trade native stays excluded; all associated and legacy practice sources remain unbound',()=>{
 for(const c of [...fixture.associated,...fixture.practice,...fixture.excluded]){const t=at(c),m=finish(c);assert.equal(M.inspect(t,m).correct,true);assert.equal(!!replay(t,m),c.math.trades>0);assert.equal(binding(t,context(c)),null);assert.equal(thinkingGuide(t,context(c)),null);assert.equal(thinkingFeedback(t,m,record(m),context(c)),null);}
 assert.equal(fixture.excluded.length,1);const c=fixture.excluded[0];assert.equal(c.id,'bigproduct');assert.equal(c.index,2);assert.equal(c.math.trades,0);assert.deepEqual(c.math.rows.map(r=>r.columns.map(q=>q.raw)),[[0,0,0,0],[0,8,0,6]]);assert.equal(finish(c).history.filter(e=>e.action==='b14-trade').length,0);
});

test('blank, wrong and over-precision first estimates survive correction and internal reset',()=>{
 for(const c of fixture.cases)for(const raw of ['',String(c.math.estimatedProduct+1),String(c.math.estimatedProduct)+'.0000000','not a number']){const t=at(c),m=M.initial(t);field(t,m,'estimate',raw);action(t,m,'b14-estimate');assert.equal(m.board.firstEstimate,raw);assert.ok(m.issue);assert.equal(m.board.estimateOK,false);action(t,m,'b14-reset');assert.equal(m.board.firstEstimate,raw);assert.equal(m.estimate,raw);finish(c,m);const p=replay(t,m);assert.ok(p);assert.deepEqual(p.construction.firstEstimate,{raw,correct:false});assert.equal(p.failures.estimate,1);assert.equal(p.resets.length,1);assert.equal(p.construction.estimate.raw,String(c.math.estimatedProduct));}
});

test('visible wrong raw requests keep their failure before a correct quantity can be traded',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);estimate(c,m);for(const raw of ['',String(c.math.rows[0].columns[0].raw+1),String(c.math.rows[0].columns[0].raw)+'.0000000']){field(t,m,'raw',raw);const b=cp(m.board);action(t,m,'b14-mul-count');assert.deepEqual(m.board,b);assert.ok(m.issue);}finish(c,m);const p=replay(t,m);assert.ok(p);assert.equal(p.failures.count,3);assert.equal(p.events.filter(e=>e.failure==='count').length,3);assert.equal(p.construction.trades.length,c.math.trades);}
});

test('a correct last digit cannot skip a trade; wrong retained digits can be visibly corrected',()=>{
 for(const c of fixture.cases){const t=at(c),m=firstPending(c),q=c.math.rows[0].columns[0];field(t,m,'digit',q.loose);action(t,m,'b14-digit');assert.equal(m.board.col,0);assert.ok(m.issue);
  while(m.board.pending.loose>=20)action(t,m,'b14-trade');action(t,m,'b14-digit');assert.equal(m.board.col,0);while(m.board.pending.loose>=10)action(t,m,'b14-trade');field(t,m,'digit',(q.loose+1)%10);action(t,m,'b14-digit');assert.equal(m.board.col,0);finish(c,m);const p=replay(t,m);assert.ok(p);assert.equal(p.failures.digit,3);assert.equal(p.construction.columns[0].carry,q.trades);}
});

test('empty shift, wrong row units and wrong entered row quantities are genuine failed saves',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);estimate(c,m);columns(c,m);const before=cp(m.board);for(const shift of ['', '1']){field(t,m,'shift',shift);field(t,m,'rowvalue',c.math.rows[0].value);action(t,m,'b14-row');assert.deepEqual(m.board,before);assert.ok(m.issue);}field(t,m,'shift',0);for(const value of ['',String(c.math.rows[0].value+1)]){field(t,m,'rowvalue',value);action(t,m,'b14-row');assert.deepEqual(m.board,before);}finish(c,m);const p=replay(t,m);assert.ok(p);assert.equal(p.failures.row,4);}
});

test('the second row really uses the tens unit; 7 and 20 portions are not two identical rows',()=>{
 const c=fixture.cases.find(c=>c.id==='longproduct'&&c.index===1),t=at(c),m=M.initial(t);estimate(c,m);columns(c,m);field(t,m,'shift',0);field(t,m,'rowvalue',238);action(t,m,'b14-row');columns(c,m);field(t,m,'shift',0);field(t,m,'rowvalue',68);action(t,m,'b14-row');assert.equal(m.board.row,1);assert.ok(m.issue);field(t,m,'shift',1);action(t,m,'b14-row');assert.equal(m.board.row,1);finish(c,m);const p=replay(t,m);assert.ok(p);assert.deepEqual(p.construction.rows.map(r=>[r.multiplierDigit,r.rowScale,r.unshifted,r.value]),[[7,1,238,238],[2,10,68,680]]);assert.equal(p.submittedAnswer.value,918);
});

test('every original reset phase preserves root input bytes and first estimate, while current trades start again',()=>{
 for(const c of fixture.cases)for(const phase of ['initial','estimate','pending','row','complete']){const t=at(c),m=M.initial(t);if(phase!=='initial')estimate(c,m);if(phase==='pending'){field(t,m,'raw',c.math.rows[0].columns[0].raw);action(t,m,'b14-mul-count');action(t,m,'b14-trade');}if(phase==='row')columns(c,m);if(phase==='complete')finish(c,m);const before=cp(m),roots=Object.keys(m).filter(k=>!['board','history','issue'].includes(k));action(t,m,'b14-reset');for(const key of roots)assert.equal(m[key],before[key]);assert.deepEqual(m.history.slice(0,-1),before.history);assert.equal(m.board.firstEstimate,before.board.firstEstimate);assert.equal(m.board.estimateOK,false);reject(t,m);finish(c,m);const p=replay(t,m);assert.ok(p);assert.equal(p.resets.length,1);assert.equal(p.segments.length,2);assert.equal(p.construction.currentSegment,1);assert.equal(p.construction.trades.length,c.math.trades);assert.equal(p.construction.rows.length,c.math.rows.length);assert.equal(p.construction.columns.length,c.math.columnCount);assert.equal(p.segments[1].trades,c.math.trades);if(phase==='complete')assert.equal(p.events.filter(e=>e.action==='b14-trade').length,2*c.math.trades);}
});

test('current incomplete work after reset cannot borrow earlier completed rows or exchanges',()=>{
 for(const c of fixture.cases){const t=at(c),m=finish(c),first=m.board.firstEstimate;action(t,m,'b14-reset');estimate(c,m);field(t,m,'raw',c.math.rows[0].columns[0].raw);action(t,m,'b14-mul-count');assert.equal(m.board.firstEstimate,first);reject(t,m);assert.equal(M.inspect(t,m).correct,false);finish(c,m);assert.ok(replay(t,m));}
});

test('original finite decimal spellings use exact integers; select values remain the actual options',()=>{
 for(const c of fixture.cases){const t=at(c),m=finish(c,undefined,n=>' 000'+n+'.000000 ');assert.ok(replay(t,m));for(const raw of [String(c.math.product)+'.0000001',String(c.math.product)+'.0000000','+'+c.math.product,String(c.math.product)+'e0','9999999999']){const x=cp(m);field(t,x,'answer',raw);reject(t,x);assert.equal(M.inspect(t,x).correct,false);}const x=cp(m);x.shift='0.0';oldOnly(t,x);}
});

test('all hidden root fields must retain their exact prior event values',()=>{
 for(const c of fixture.cases){const t=at(c),good=finish(c);for(const key of Object.keys(M.initial(t)).filter(k=>!['history','board','issue','answer'].includes(k))){const m=cp(good);m[key]=m[key]==='unexpected'?'different':'unexpected';oldOnly(t,m);}}
});

test('root, board, nested arrays and event shapes are closed and malformed histories fail without throwing',()=>{
 const c=fixture.cases[1],t=at(c),good=finish(c);for(const mutate of [m=>m.extra=1,m=>m.issue='forged issue',m=>m.board.extra=1,m=>m.board.rows[0].extra=1,m=>m.board.digits.extra=true,m=>m.board.rows.extra=true,m=>m.board.rows[0].digits.extra=true,m=>m.board.work.extra=true,m=>m.history.extra=true,m=>m.history[0].extra=1,m=>m.history[0].data.extra=1,m=>m.history[0].data.fields.extra='',m=>m.history[0].data.index=19,m=>m.history[0].data.side=1,m=>m.history[0].data.value=1]){const x=cp(good);mutate(x);reject(t,x);}
 for(const x of [null,{},[],42,{...good,history:null},{...good,history:[null]},{...good,history:[]},{...good,answer:null}])assert.doesNotThrow(()=>reject(t,x));const circular=cp(good);circular.board.circular=circular;assert.doesNotThrow(()=>reject(t,circular));
});

test('field snapshots cannot silently edit hidden fields at any recorded phase',()=>{
 for(const c of fixture.cases){const t=at(c),good=finish(c);const atEstimate=cp(good);atEstimate.history[0].data.fields.answer='123';oldOnly(t,atEstimate);const firstTrade=good.history.findIndex(e=>e.action==='b14-trade'),atTrade=cp(good);atTrade.history[firstTrade].data.fields.raw='999';oldOnly(t,atTrade);const last=cp(good);last.history.at(-1).data.fields.reason='invented explanation';oldOnly(t,last);}
});

test('foreign and hidden no-op events accepted by old grading do not establish a genuine UI path',()=>{
 for(const c of fixture.cases){const t=at(c),good=finish(c);for(const name of ['b14-container','b14-mul-count','b14-digit','b14-row','b14-estimate']){const m=cp(good);M.act(t,m,name);oldOnly(t,m);}}
});

test('an inserted click on the disabled trade button remains a counterfactual even after genuine correction',()=>{
 for(const c of fixture.cases){const t=at(c),m=firstPending(c);while(m.board.pending.loose>=10)action(t,m,'b14-trade');const trade=[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).find(x=>attrs(x)['data-x']==='b14-trade');assert.match(trade,/\bdisabled\b/);const pending=cp(m.board.pending);M.act(t,m,'b14-trade');assert.deepEqual(m.board.pending,pending);assert.ok(m.issue);finish(c,m);oldOnly(t,m);}
});

test('the board and saved column identities cannot be changed or used to skip a zero column',()=>{
 for(const c of fixture.cases){const t=at(c),good=finish(c);for(const mutate of [m=>m.board.work[0].raw++,m=>m.board.work[0].incoming++,m=>m.board.work[0].bundles++,m=>m.board.work[0].loose++,m=>m.board.rows[0].value++,m=>m.board.rows[0].digits[0]=(m.board.rows[0].digits[0]+1)%10,m=>m.board.rows[0].carry++,m=>m.board.row=0,m=>m.board.work.splice(1,1)]){const x=cp(good);mutate(x);reject(t,x);}}
 const c=fixture.cases.find(c=>c.id==='shortproduct'&&c.index===2),p=replay(at(c),finish(c));assert.deepEqual(p.construction.columns.map(c=>[c.aDigit,c.incoming,c.raw,c.digit,c.carry]),[[6,0,42,2,4],[0,4,4,4,0],[3,0,21,1,2]]);
});

test('the registry adds exactly one contract, and optional guide/feedback require current matching native work',()=>{
 const adapters=EVIDENCE_ADAPTERS.filter(a=>a.id==='multable');assert.equal(adapters.length,1);assert.equal(adapters[0].type,'x-multable');assert.equal(adapters[0].binding,binding);assert.equal(adapters[0].replay,replay);
 for(const c of fixture.cases){const t=at(c),m=finish(c),r=record(m);assert.ok(thinkingGuide(t,context(c)));assert.ok(latestSubmissionMatches(m,r));const f=thinkingFeedback(t,m,r,context(c));assert.ok(f);assert.equal(f.method,null);assert.match(JSON.stringify(f),/没有把它算作另一个独立的加法过程/);assert.match(JSON.stringify(f),new RegExp(String(c.math.product)));if(c.math.rows.length===1)assert.doesNotMatch(f.connection,/第二行/);else assert.match(f.connection,/第二行/);
  for(const wrong of [null,{attempts:[]},{attempts:[{value:null}]},{attempts:[{value:cp(m)},{value:M.initial(t)}]}])assert.equal(thinkingFeedback(t,m,wrong,context(c)),null);
  const changed=cp(m);field(t,changed,'answer',c.math.product+1);assert.equal(latestSubmissionMatches(changed,r),false);assert.equal(thinkingFeedback(t,changed,r,context(c)),null);
 }
});

test('reset before the first Check does not invent earlier submissions; saved first estimate is separate from attempt order',()=>{
 const c=fixture.cases[1],t=at(c),m=M.initial(t);field(t,m,'estimate','');action(t,m,'b14-estimate');action(t,m,'b14-reset');finish(c,m);const r=record(m),f=thinkingFeedback(t,m,r,context(c));assert.ok(f);assert.doesNotMatch(JSON.stringify(f),/此前提交/);assert.match(JSON.stringify(f),/最早保留的估计是“”/);assert.match(JSON.stringify(f),/重新开始板面/);r.attempts.unshift({value:M.initial(t)});assert.match(JSON.stringify(thinkingFeedback(t,m,r,context(c))),/此前提交原样保留/);
});

test('original State keeps failed, corrected, edited and retried attempts distinct with full v2 identity',()=>{
 const c=fixture.cases.find(c=>c.id==='shortproduct'&&c.index===0),t=at(c),a=State.freshLesson(c.id),m=State.modelForLesson(a);assert.equal(retryTags(a).length,0);assert.equal(State.submitLesson(a).correct,false);assert.equal(retryTags(a).length,1);field(t,m,'estimate',301);action(t,m,'b14-estimate');State.supportLesson(a);finish(c,m);assert.equal(State.submitLesson(a).correct,true);State.addLessonNote(a,'十个一换成一个十，原来的量没有丢。');const good=cp(a),r=a.cases[0];assert.ok(thinkingFeedback(t,m,r,context(c)));field(t,m,'answer',283);assert.equal(State.currentSubmission(a).status,'modified');assert.equal(State.lessonSummary(a).cases[0].complete,true);assert.equal(thinkingFeedback(t,m,r,context(c)),null);assert.equal(State.submitLesson(a).correct,false);field(t,m,'answer',282);assert.equal(thinkingFeedback(t,m,r,context(c)),null);assert.equal(State.submitLesson(a).correct,true);assert.ok(thinkingFeedback(t,m,r,context(c)));assert.deepEqual(a.cases[0].attempts.slice(0,2),good.cases[0].attempts);
 const before=cp(a),retry=retryTags(a);assert.equal(retry.length,1);assert.doesNotMatch(retry[0],/\bdisabled\b/);a.models[0]=defaultModel(t);assert.deepEqual(a.cases,before.cases);assert.deepEqual(a.notes,before.notes);assert.equal(a.models[0].board.firstEstimate,null);assert.deepEqual(a.models[0].history,[]);assert.equal(thinkingFeedback(t,a.models[0],a.cases[0],context(c)),null);finish(c,a.models[0]);assert.equal(State.submitLesson(a).correct,true);assert.deepEqual(a.cases[0].attempts.slice(0,-1),before.cases[0].attempts);
 const state=Core.fresh();state.lessons[c.id]=a;const checked=Core.validate(state,atlas),backup=Core.backup(checked),restored=Core.parseBackup(JSON.stringify(backup),atlas);assert.deepEqual(restored,checked);assert.deepEqual(Core.merge(restored,Core.parseBackup(JSON.stringify(backup),atlas)),restored);
});

test('identically restored complete snapshots use the existing equality gate, without a new persisted retry epoch',()=>{
 const c=fixture.cases[1],t=at(c),m=finish(c),r=record(m);field(t,m,'answer',283);assert.equal(thinkingFeedback(t,m,r,context(c)),null);field(t,m,'answer',282);assert.ok(latestSubmissionMatches(m,r));assert.ok(thinkingFeedback(t,m,r,context(c)));assert.equal(Object.keys(m).length,36);assert.ok(!Object.hasOwn(m,'epoch')&&!Object.hasOwn(m,'segment'));
});

function capped(c){const t=at(c),length=finish(c).history.length,m=M.initial(t);assert.match(V.render(t,m),/data-x="b14-reset"/);for(let i=0;i<3000-length;i++)M.act(t,m,'b14-reset');finish(c,m);assert.equal(m.history.length,3000);return m;}

test('a valid current construction can reach 3000, while action 3001 is rejected rather than rewritten as a no-op',()=>{
 const c=fixture.cases[1],t=at(c),m=capped(c),p=replay(t,m);assert.ok(p);assert.equal(p.eventCount,3000);assert.equal(p.historyAtCapacity,true);assert.equal(p.limitBehavior,'original-write-validation-block');assert.equal(p.construction.trades.length,c.math.trades);assert.match(JSON.stringify(thinkingFeedback(t,m,record(m),context(c))),/已到可保存的上限/);const previous=cp(m);M.act(t,m,'b14-reset');assert.equal(m.history.length,3001);assert.notDeepEqual(m.board,previous.board);assert.equal(M.valid(t,m),false);reject(t,m);assert.equal(M.valid(t,previous),true);
});

test('the original update transaction blocks 3001 before storage; reload and actual P3 retry preserve old attempts',()=>{
 const c=fixture.cases[1],t=at(c),id=c.id,learn=readFileSync(new URL('../dist/learning/learn.js',import.meta.url),'utf8'),body=learn.slice(learn.indexOf('function update('),learn.indexOf('\nfunction questionContext('));assert.ok(body.startsWith('function update(')&&body.endsWith('}}'));
 assert.ok(learn.includes("if(blocked){if(b.dataset.do==='save-note')showNoteSaveFailure();return;}"));assert.ok(learn.includes("if(!el||blocked||a.view==='summary'||!isExtra(task())||numericReadOnly())return;"));
 const factory=new Function('d',`const {localStorage,KEY,atlas,id,read,sessionRecord,assertNoConcurrentLessonOverwrite,mergeLesson,uiSnapshot,now,validateLesson,BRIDGES,rememberSession,questionId,sessionMeta,sessionRoute,validate,writeStored,notify,$}=d;let all=read(),a=sessionRecord(all,id),blocked=false;${body};return {update,get blocked(){return blocked},get all(){return all},get record(){return a}};`);
 for(const prior of [false,true]){const state=Core.fresh(),a=State.freshLesson(id);state.lessons[id]=a;a.models[0]=prior?capped(c):M.initial(t);if(!prior)for(let i=0;i<3000;i++)M.act(t,a.models[0],'b14-reset');if(prior){State.submitLesson(a);State.addLessonNote(a,'原换十与提交保留。');}const saved=Core.validate(state,atlas),backing=new Map(),storage={getItem:k=>backing.get(k)??null,setItem:(k,v)=>backing.set(k,String(v))};Storage.writeStored(Core.KEY,JSON.stringify(saved),storage);const raw=storage.getItem(Core.KEY),oldCases=cp(a.cases),oldNotes=cp(a.notes);let writes=0;const warning={hidden:true,textContent:''};const create=()=>factory({localStorage:storage,KEY:Core.KEY,atlas,id,read:()=>Core.validate(JSON.parse(Storage.readStored(Core.KEY,storage)),atlas),sessionRecord:Daily.sessionRecord,assertNoConcurrentLessonOverwrite:State.assertNoConcurrentLessonOverwrite,mergeLesson:State.mergeLesson,uiSnapshot:()=>cp(a.ui),now:Core.now,validateLesson:State.validateLesson,BRIDGES,rememberSession:Daily.rememberSession,questionId:null,sessionMeta,sessionRoute,validate:Core.validate,writeStored:(k,v)=>{writes++;Storage.writeStored(k,v,storage);},notify:()=>{},$:()=>warning});
  const blocked=create();assert.equal(blocked.update(r=>M.act(t,State.modelForLesson(r),'b14-reset')),false);assert.equal(blocked.blocked,true);assert.equal(writes,0);assert.equal(storage.getItem(Core.KEY),raw);assert.match(warning.textContent,/保存遇到问题，已停止覆盖原记录/);assert.equal(blocked.update(r=>r.models[0]=defaultModel(t)),false);assert.equal(storage.getItem(Core.KEY),raw);
  const reloaded=create();assert.equal(reloaded.blocked,false);assert.equal(retryTags(reloaded.record).length,prior?1:0);if(!prior){let checked;assert.equal(reloaded.update(r=>checked=State.submitLesson(r)),true);assert.equal(checked.correct,false);assert.equal(retryTags(reloaded.record).length,1);}const retained=cp(reloaded.record.cases);assert.equal(reloaded.update(r=>{r.view='task';r.models[r.index]=defaultModel(t);}),true);assert.deepEqual(reloaded.record.models[0],defaultModel(t));assert.deepEqual(reloaded.record.cases,retained);assert.deepEqual(reloaded.record.notes,oldNotes);if(prior)assert.deepEqual(reloaded.record.cases,oldCases);const restored=Core.parseBackup(JSON.stringify(Core.backup(reloaded.all)),atlas);assert.deepEqual(restored,reloaded.all);assert.equal(restored.lessons[id].cases[0].attempts[0].value.history.length,3000);
 }
});

test('a forged over-limit import is rejected without changing the original complete cumulative backup',()=>{
 const c=fixture.cases[1],t=at(c),s=Core.fresh(),a=State.freshLesson(c.id);s.lessons[c.id]=a;a.models[0]=capped(c);State.submitLesson(a);const old=JSON.stringify(s),backup=Core.backup(cp(s));M.act(t,backup.state.lessons[c.id].models[0],'b14-reset');assert.throws(()=>Core.parseBackup(JSON.stringify(backup),atlas));assert.equal(JSON.stringify(s),old);assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(cp(s))),atlas),s);
});
