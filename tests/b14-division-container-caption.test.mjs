import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import * as F from '../dist/learning/phase5/b14-model.js';
import * as V from '../dist/learning/phase5/b14-view.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,validateLesson} from '../dist/learning/state.js';
import browserPlan from './b14-division-container-caption-browser.cjs';

await ensureB39Ready();
const {downCases,upCases,workPlan,answerPlan}=browserPlan,copy=x=>structuredClone(x),probes={actions:0,fields:0,submissions:0};
after(()=>console.log('Issue155 original control probes',JSON.stringify(probes)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const buttons=(t,m)=>[...V.render(t,m).matchAll(/<button\b[^>]*>/g)].map(m=>({tag:m[0],attrs:attrs(m[0])}));
function field(t,m,key,value){
 const html=V.render(t,m),tag=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(m=>m[0]).find(tag=>attrs(tag)['data-xfield']===key);assert.ok(tag,`actual field ${key}`);
 if(tag.startsWith('<select'))assert.ok(html.slice(html.indexOf(tag),html.indexOf('</select>',html.indexOf(tag))).includes(`value="${value}"`));
 m[key]=String(value);F.field(t,m,key);probes.fields++;
}
function action(t,m,name,data={}){
 const button=buttons(t,m).find(b=>b.attrs['data-x']===name&&Object.entries(data).every(([k,v])=>b.attrs['data-'+k]===String(v)));
 assert.ok(button,`actual button ${name} ${JSON.stringify(data)}`);assert.doesNotMatch(button.tag,/\bdisabled\b/);
 const length=m.history.length;F.act(t,m,name,data);probes.actions++;assert.equal(m.history.length,length+1);assert.equal(F.valid(t,m),true);
}
function run(t,m,plan){for(const step of plan)if(step.field)field(t,m,step.field,step.value);else action(t,m,step.action,step.data);return m;}
function caption(t,m){const before=JSON.stringify(m),html=V.render(t,m),text=/<p>(已放 [^<]*)<\/p>/.exec(html)?.[1];assert.equal(JSON.stringify(m),before,'rendering never edits mathematical work');return text;}
const tail=(t,m)=>caption(t,m)?.split('。')[1];
const submit=a=>{probes.submissions++;return submitLesson(a);};
const at=c=>sessionTasks(c.id)[c.index];
const prepare=(t,m=F.initial(t))=>run(t,m,workPlan(F,t));
const task=(n,d,interpret='down')=>({type:'x-divtable',n,d,interpret,places:0,prompt:'观察所选完整份是否装得满。'});

test('actual native and associated source inventory isolates three down questions and ten unchanged up questions',()=>{
 const found={nativeDown:[],bridgeDown:[],nativeUp:[],bridgeUp:[]};
 for(const [kind,catalog]of [['native',LESSONS],['bridge',BRIDGES]])for(const id of Object.keys(catalog))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-divtable'&&['down','up'].includes(t.interpret))found[kind+(t.interpret==='down'?'Down':'Up')].push(id+':'+index);
 });
 assert.deepEqual(found.nativeDown,downCases.map(c=>c.id+':'+c.index));assert.deepEqual(found.bridgeDown,[]);
 assert.deepEqual(found.nativeUp,['shortdivide:2','longdivide:1','remainders:1','roundanswers:2','estimatecheck:3']);
 assert.deepEqual(found.bridgeUp,['link-shortdivide-remainders:1','link-longproduct-remainders:1','link-longdivide-storyoperations:0','link-combineproducts-remainders:1','link-estimatecheck-roundanswers:1']);
 for(const c of downCases)assert.deepEqual([at(c).n,at(c).d],[c.n,c.d]);
});

for(const c of downCases)test(`${c.id}:${c.index} missing quantity replaces negative remainder while original controls and State outcomes stay intact`,()=>{
 const t=at(c),a=freshLesson(c.id);a.index=c.index;const m=prepare(t,modelForLesson(a));assert.equal(m.answer,'');assert.equal(m.check,'');
 assert.equal(tail(t,m),`完整装入后剩 ${c.n}`);const zero=copy(m);
 assert.match(buttons(t,m).find(b=>b.attrs['data-x']==='b14-container'&&b.attrs['data-value']==='-1').tag,/\bdisabled\b/);assert.deepEqual(m,zero);
 for(let i=0;i<c.full-1;i++)action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),`完整装入后剩 ${c.remaining+c.d}`);
 action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),`完整装入后剩 ${c.remaining}`);run(t,m,answerPlan(F,t));assert.equal(submit(a).correct,true);
 const first=copy(a.cases[c.index].attempts[0]);action(t,m,'b14-container',{value:1});assert.equal(currentSubmission(a).status,'modified');
 assert.equal(tail(t,m),`要把这些份都装满还差 ${c.oneMissing}`);assert.doesNotMatch(caption(t,m),/剩 -|还差 -|最多|应选|答案/);
 assert.match(V.render(t,m),new RegExp(`<b>${c.remaining}/${c.d}</b>`));assert.equal(submit(a).correct,false);
 const loaded=validateLesson(JSON.parse(JSON.stringify(a)),c.id);assert.ok(loaded);assert.deepEqual(loaded.models[c.index],m);assert.equal(tail(t,loaded.models[c.index]),tail(t,m));
 action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),`要把这些份都装满还差 ${c.twoMissing}`);assert.match(V.render(t,m),new RegExp(`<b>0/${c.d}</b>`));assert.equal(submit(a).correct,false);
 action(t,m,'b14-container',{value:-1});action(t,m,'b14-container',{value:-1});assert.equal(tail(t,m),`完整装入后剩 ${c.remaining}`);assert.equal(submit(a).correct,true);
 assert.deepEqual(a.cases[c.index].attempts.map(x=>F.inspect(t,x.value).correct),[true,false,false,true]);assert.deepEqual(a.cases[c.index].attempts[0],first);
 assert.deepEqual(validateLesson(JSON.parse(JSON.stringify(a)),c.id).cases[c.index].attempts,a.cases[c.index].attempts);
});

test('exact divisibility has zero remainder, and one excess full portion reports a positive missing amount',()=>{
 const t=task(12,3),m=prepare(t);assert.equal(tail(t,m),'完整装入后剩 12');
 for(let i=0;i<4;i++)action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),'完整装入后剩 0');run(t,m,answerPlan(F,t));assert.equal(F.inspect(t,m).correct,true);
 action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),'要把这些份都装满还差 3');assert.equal(F.inspect(t,m).correct,false);
 action(t,m,'b14-container',{value:-1});assert.equal(F.inspect(t,m).correct,true);
});

test('less than one full portion does not manufacture a negative remainder or reveal an answer',()=>{
 const t=task(5,8),m=prepare(t);assert.equal(tail(t,m),'完整装入后剩 5');assert.equal(m.answer,'');
 action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),'要把这些份都装满还差 3');assert.equal(m.answer,'');
 action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),'要把这些份都装满还差 11');assert.equal(m.answer,'');
 action(t,m,'b14-container',{value:-1});action(t,m,'b14-container',{value:-1});run(t,m,answerPlan(F,t));assert.equal(F.inspect(t,m).correct,true);
});

test('all original up source scenarios retain the same unallocated quantity and original minimal-count grading',()=>{
 for(const catalog of [LESSONS,BRIDGES])for(const id of Object.keys(catalog))for(const t of sessionTasks(id))if(t.type==='x-divtable'&&t.interpret==='up'){
  const m=prepare(t);assert.equal(tail(t,m),`还没安排 ${t.n}`);const q=Math.floor(t.n/t.d),r=t.n%t.d,want=Math.ceil(t.n/t.d);
  for(let i=0;i<q;i++)action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),`还没安排 ${r}`);
  for(let i=q;i<want;i++)action(t,m,'b14-container',{value:1});run(t,m,answerPlan(F,t));assert.equal(tail(t,m),'还没安排 0');assert.equal(F.inspect(t,m).correct,true);
  action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),'还没安排 0');assert.equal(F.inspect(t,m).correct,false);action(t,m,'b14-container',{value:-1});assert.equal(F.inspect(t,m).correct,true);
 }
});

test('the existing 200-container boundary and ignored further add retain their original history and count',()=>{
 const t=task(34,5),m=prepare(t);for(let i=0;i<200;i++)action(t,m,'b14-container',{value:1});assert.equal(tail(t,m),'要把这些份都装满还差 966');
 const length=m.history.length;action(t,m,'b14-container',{value:1});assert.equal(m.board.containers,200);assert.equal(m.history.length,length+1);assert.equal(tail(t,m),'要把这些份都装满还差 966');
 action(t,m,'b14-container',{value:-1});assert.equal(tail(t,m),'要把这些份都装满还差 961');
});

test('old serialized excess-container work renders honestly without changing fields board history or previous attempts',()=>{
 const c=downCases[1],t=at(c),a=freshLesson(c.id);a.index=c.index;const m=prepare(t,modelForLesson(a));
 for(let i=0;i<6;i++)action(t,m,'b14-container',{value:1});run(t,m,answerPlan(F,t));assert.equal(submit(a).correct,false);
 const raw=JSON.stringify(a),restored=validateLesson(JSON.parse(raw),c.id);assert.ok(restored);const recordBefore=JSON.stringify(restored);
 assert.equal(tail(t,restored.models[c.index]),'要把这些份都装满还差 2');assert.equal(JSON.stringify(restored),recordBefore);assert.deepEqual(restored.models[c.index],m);
 assert.equal(F.inspect(t,restored.models[c.index]).correct,false);assert.equal(restored.cases[c.index].attempts.length,1);
});

test('all exported browser plans use actual original fields and enabled buttons for both native and bridge records',()=>{
 for(const c of [...downCases,...upCases]){
  const t=at(c),a=freshLesson(c.id);a.index=c.index;const m=prepare(t,modelForLesson(a)),want=t.interpret==='down'?c.full:c.minimum;
  for(let i=0;i<want;i++)action(t,m,'b14-container',{value:1});run(t,m,answerPlan(F,t));assert.equal(submit(a).correct,true);
  action(t,m,'b14-container',{value:1});assert.equal(submit(a).correct,false);action(t,m,'b14-container',{value:-1});assert.equal(submit(a).correct,true);
  assert.ok(validateLesson(JSON.parse(JSON.stringify(a)),c.id,{allowBridge:Object.hasOwn(BRIDGES,c.id)}));
 }
});
