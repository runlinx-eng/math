// Build a task-level review worklist. Candidate tasks are references, not a
// claim that a relation is taught, understood or mathematically reviewed.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {TASKS} from '../dist/learning/tasks.js';
import {BRIDGES} from '../dist/learning/bridges.js';
import {validateRelationReviews} from './check_relation_use_reviews.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const inventory=read('docs/spatial-learning/inventory.json'),reviews=read('docs/spatial-learning/relation-use-review.json');
const reviewStats=validateRelationReviews(reviews,inventory),reviewByEdge=new Map(reviews.records.map(r=>[`${r.from}>${r.to}`,r]));
const taskIndex={},nodes={};
for(const n of inventory.nodes){
  const tasks=TASKS[n.lessonId];assert.ok(tasks&&tasks.length===n.taskCount,n.id);
  nodes[n.id]={lessonId:n.lessonId,lessonUrl:n.lessonUrl,goalCount:n.goals.length,tasks:tasks.map((t,index)=>{
    const key=`${n.lessonId}:${index}`;assert.ok(!taskIndex[key],key);
    taskIndex[key]={type:t.type,prompt:t.prompt,sha256:hash(JSON.stringify(t)),sourceGoals:n.goals.filter(g=>g.tasks.some(x=>x.index===index)).map(g=>g.index)};
    return key;
  })};
}
for(const [id,b] of Object.entries(BRIDGES))for(const [index,t] of b.tasks.entries()){
  const key=`${id}:${index}`;assert.ok(!taskIndex[key],key);taskIndex[key]={type:t.type,prompt:t.prompt,sha256:hash(JSON.stringify(t)),sourceGoals:[]};
}
const edges=inventory.edges.map(e=>{
  const review=reviewByEdge.get(`${e.from}>${e.to}`),joint=e.jointActivities.flatMap(a=>{
    const b=BRIDGES[a.id];assert.ok(b&&b.fromTopicId===e.from&&b.topicId===e.to&&b.tasks.length===a.taskCount,a.id);
    return b.tasks.map((_,i)=>`${a.id}:${i}`);
  });
  assert.ok(nodes[e.from]&&nodes[e.to]);
  return {from:e.from,to:e.to,strength:e.strength,sourceReason:e.sourceReason,localReason:e.localReason,fromTasks:nodes[e.from].tasks,toTasks:nodes[e.to].tasks,jointTasks:joint,localReview:review?{classification:review.classification,note:review.note,evidence:review.evidence.map(x=>x.key)}:null,independentMathematicalReview:'pending'};
});
const summary={nodes:Object.keys(nodes).length,edges:edges.length,nodeTasks:Object.keys(TASKS).reduce((n,id)=>n+TASKS[id].length,0),jointTasks:Object.values(BRIDGES).reduce((n,b)=>n+b.tasks.length,0),edgesWithJoint:edges.filter(e=>e.jointTasks.length).length,edgesWithoutJoint:edges.filter(e=>!e.jointTasks.length).length,locallyInspected:reviewStats.reviewed,notYetInspected:reviewStats.unreviewed,insufficientEvidence:reviewStats.insufficient};
assert.deepEqual(Object.values(summary),[587,1223,1996,1552,776,447,9,1214,2]);
const output={schema:'math-relation-evidence-index/1',date:'2026-11-01',sourceInventory:'docs/spatial-learning/inventory.json',localReview:'docs/spatial-learning/relation-use-review.json',limits:['候选任务只是两端已有任务，不意味着任务使用了该关系。','联合任务存在不等于已完成内容和数学审阅。','没有联合任务不等于没有教学或必须新增任务。','独立数学审阅、真实孩子使用及学习效果均未完成。'],summary,nodes,tasks:taskIndex,edges};
const path='docs/spatial-learning/relation-evidence-index.json',content=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),content,path+' is stale');else fs.writeFileSync(path,content);
console.log(JSON.stringify(summary));
