// P3 is an evidence/presentation selector, not a second learning progress model.
// Every target comes from the actual task catalog or the original atlas source edges.
import {LESSONS} from './catalog.js';
import {BRIDGES,sessionMeta,sessionTasks,sessionRoute,sourceBridge} from './bridges.js';
import {lessonSummary} from './state.js';
import {inspect} from './tasks.js';

// Curated entry points are *existing* configured lessons. These are computer
// simulations or mathematical representations, never verified real-world work.
const APPLICATION_GROUPS = [
  {key:'measurement',label:'测量',ids:['measurestory','shapemeasures','space'],real:'选一个身边的物品，用实际工具测量，写清对象、单位和测量方法。'},
  {key:'data',label:'数据',ids:['survey','playgroundstudy','ownstudy'],real:'自己提出一个可以观察的问题，记录真实回答的来源和次数。'},
  {key:'probability',label:'概率',ids:['trialestimate','chancesim','chancemodel'],real:'用实物重复做一次随机尝试，记录每次结果，再比较实际频数。'},
  {key:'geometry',label:'几何',ids:['shapeuses','shapeapprox','shapemeasures'],real:'找到身边的一件物品，画出近似图形，并说明哪些细节被省略。'},
  {key:'modeling',label:'建模',ids:['model35','model38','shapeapprox'],real:'选一个真实数量关系，明确条件、单位和假设，比较模型与观察。'}
];

export function configuredApplications(){
  return APPLICATION_GROUPS.map(group=>{
    const sessionId=group.ids.find(id=>LESSONS[id]&&sessionTasks(id)?.length);
    return sessionId?{key:group.key,label:group.label,sessionId,
      title:LESSONS[sessionId].title,kind:'模拟情境或数学模型',
      real:group.real}:null;
  }).filter(Boolean);
}

export function workflowFor(atlas,id,record){
  const meta=sessionMeta(id);
  if(!meta||!sessionTasks(id)?.length)throw new Error('未配置的学习任务');
  const tasks=sessionTasks(id),summary=lessonSummary(record);
  const index=record?.index>=0&&record.index<tasks.length?record.index:0;
  const current=summary.cases?.[index]||{complete:false,independent:false,attempts:0};
  const row=record?.cases?.[index];
  const attempts=row?.attempts||[],last=attempts.at(-1);
  const checked=last?inspect(tasks[index],last.value):null;
  const usedSupport=!!row?.support||attempts.some(e=>e.supported);
  const anchor=BRIDGES[id]?.to||id,topicId=meta.topicId;
  const route=sessionRoute(id);
  const nextId=route?.ids?.[route.ids.indexOf(anchor)+1];
  const next=route?.ids?.includes(anchor)&&LESSONS[nextId]&&sessionTasks(nextId)?.length
    ?{id:nextId,title:LESSONS[nextId].title}:null;
  const alternateIndex=tasks.length>1&&(current.complete||summary.completed)
    ?(record?.view==='summary'?0:(index+1)%tasks.length):null;

  const sourceIds=new Set((atlas?.nodes||[]).map(n=>n.id)),seen=new Set();
  const related=(atlas?.edges||[]).filter(e=>e.prerequisiteId===topicId||e.topicId===topicId)
    .map(e=>({nodeId:e.prerequisiteId===topicId?e.topicId:e.prerequisiteId,
      direction:e.prerequisiteId===topicId?'后续联系':'相关基础'}))
    .filter(e=>sourceIds.has(e.nodeId)&&e.nodeId!==topicId&&!seen.has(e.nodeId)&&seen.add(e.nodeId))
    .slice(0,3).map(e=>({...e,title:atlas.nodes.find(n=>n.id===e.nodeId).title}));

  const bridgeIds=Object.values(BRIDGES).filter(b=>b.id!==id&&(b.from===anchor||b.to===anchor)
    &&sessionTasks(b.id)?.length&&sourceBridge(b.id,atlas))
    .slice(0,3).map(b=>({id:b.id,title:b.title}));
  const appPaths=configuredApplications();
  const sameRoute=new Set(route?.ids||[]);
  const applications=appPaths.filter(p=>p.sessionId===anchor||sameRoute.has(p.sessionId));
  const currentApplication=appPaths.find(p=>APPLICATION_GROUPS
    .find(g=>g.key===p.key)?.ids.includes(anchor))||null;

  return {
    id,index,total:tasks.length,done:summary.done,completed:summary.completed,
    currentComplete:!!current.complete,
    latestCheck:checked?(checked.correct?'correct':'revise'):'none',
    attempts:attempts.length,retried:attempts.length>1,usedSupport,
    independent:!!current.independent,
    sessionIndependent:!!summary.independent,
    explanation:summary.explanation,
    noteCount:record?.notes?.length||0,hasDraft:!!record?.draft?.trim(),
    alternateIndex,next,related,bridges,applications,currentApplication,
    // No real-world practice status exists in schema 2. Never synthesize one.
    realPracticeVerified:false
  };
}
