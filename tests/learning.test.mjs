import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LESSONS,questions,grade} from '../dist/lessons.js';
import {freshState,createSession,recordAnswer,hint,finishSession,allIndependent,validateState,makeBackup,parseBackup,mergeBackup,topicStatus} from '../dist/core.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url)));
const ids=data.nodes.map(n=>n.id);
const solution=q=>q.type==='shade'?Array.from({length:q.n},(_,i)=>i):q.answer;
function complete(key,{support=false}={}){const state=freshState();state.active=createSession(key);const s=state.active;s.stage='check';questions(key,'check').forEach((q,i)=>{s.index=i;if(support&&i===0)hint(s);recordAnswer(s,solution(q));});finishSession(state,s);return state;}
test('full source projection, every node translated, no dangling math dependencies',()=>{
 assert.equal(data.nodes.length,587);assert.equal(data.edges.length,1223);assert.equal(data.externalEdges.length,32);assert.equal(data.domains.length,12);
 assert.equal(new Set(ids).size,587);assert.equal(data.nodes.filter(n=>n.hasResearch).length,502);
 for(const n of data.nodes){assert.match(n.title,/[\u4e00-\u9fff]/);assert.ok(data.domains.some(d=>d.id===n.domainId));}
 for(const e of data.edges)assert.ok(ids.includes(e.topicId)&&ids.includes(e.prerequisiteId));
 const incoming=new Map(ids.map(id=>[id,0]));for(const e of data.edges)incoming.set(e.topicId,incoming.get(e.topicId)+1);
 const queue=ids.filter(id=>incoming.get(id)===0);let seen=0;
 while(queue.length){const id=queue.shift();seen++;for(const e of data.edges.filter(e=>e.prerequisiteId===id)){incoming.set(e.topicId,incoming.get(e.topicId)-1);if(incoming.get(e.topicId)===0)queue.push(e.topicId);}}
 assert.equal(seen,587);
});
test('all lesson forms have gradeable unique questions and explanations',()=>{
 for(const key of Object.keys(LESSONS))for(const phase of ['placement','practice','check'])for(const variant of [0,1]){
  const qs=questions(key,phase,variant);assert.ok(qs.length>=3);assert.equal(new Set(qs.map(q=>q.id)).size,qs.length);
  for(const q of qs){assert.ok(grade(q,solution(q)),q.id);assert.ok(q.hint&&q.explain);}
 }
 assert.ok(!grade(questions('decimal','check')[1],'0.4'));assert.ok(grade(questions('decimal','check')[1],'0.04'));
});
test('visiting or guided work cannot count as independent; help and first mistakes persist',()=>{
 const state=freshState(),id=LESSONS.meaning.topicId;state.visited[id]=new Date().toISOString();assert.equal(topicStatus(state,id),'visited');
 const s=createSession('meaning');s.stage='check';const qs=questions('meaning','check');recordAnswer(s,'1/99');recordAnswer(s,solution(qs[0]));for(let i=1;i<qs.length;i++){s.index=i;recordAnswer(s,solution(qs[i]));}
 assert.equal(allIndependent(s),false);state.active=s;finishSession(state,s);assert.equal(state.history[0].status,'review');
 assert.equal(complete('equivalent',{support:true}).history[0].status,'review');
 assert.equal(complete('decimal').history[0].status,'independent');
});
test('independent result returns to review after seven days',()=>{const state=complete('meaning'),r=state.history[0];assert.equal(topicStatus(state,LESSONS.meaning.topicId,Date.parse(r.at)),'independent');assert.equal(topicStatus(state,LESSONS.meaning.topicId,Date.parse(r.at)+8*86400000),'review');});
test('backup roundtrip keeps answers, active and paused sessions',()=>{
 const state=complete('decimal');state.paused.meaning=createSession('meaning');state.paused.meaning.stage='explore';state.bookmarks=[LESSONS.meaning.topicId];
 assert.deepEqual(parseBackup(JSON.stringify(makeBackup(state)),ids),state);
});
test('bad or tampered backup is rejected atomically, scores recalculated',()=>{
 const good=complete('meaning'),before=JSON.stringify(good),b=makeBackup(structuredClone(good));b.state.history[0].answers.check[0].attempts[0].answer='0/7';
 assert.equal(parseBackup(JSON.stringify(b),ids).history[0].status,'review');
 assert.throws(()=>parseBackup('{oops',ids));assert.throws(()=>parseBackup(JSON.stringify({app:'wrong'}),ids));
 b.state.bookmarks.push('missing');assert.throws(()=>parseBackup(JSON.stringify(b),ids));assert.equal(JSON.stringify(good),before);
 for(const lesson of ['__proto__','constructor']){const s=freshState();s.active={...createSession('meaning'),lesson};assert.throws(()=>validateState(s,ids));}
});
test('merge keeps current active work and both histories, repeat import does not duplicate',()=>{
 const a=complete('meaning'),b=complete('equivalent');a.active=createSession('decimal');b.active=createSession('equivalent');
 const merged=mergeBackup(a,b);assert.equal(merged.history.length,2);assert.equal(merged.active.lesson,'decimal');assert.equal(merged.paused.equivalent.lesson,'equivalent');
 assert.equal(mergeBackup(merged,b).history.length,2);assert.deepEqual(validateState(merged,ids),merged);
});
