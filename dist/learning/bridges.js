import {EXTRA_BRIDGES} from './phase4/catalog.js';
import {LESSONS,routeFor} from './catalog.js';
import {TASKS,PRACTICE} from './tasks.js';
const copy=t=>structuredClone(t);
const pair=(from,to,title,summary,tasks)=>({id:`link-${from}-${to}`,from,to,topicId:LESSONS[to].topicId,fromTopicId:LESSONS[from].topicId,title,formal:'把两个想法连起来',summary,tasks,phase:3});
const entries=[
 pair('share','equivalent','切成六份，还是半份吗？','先平均分才能数单位份；不同分法可以表示同一个半份。',[{...copy(TASKS.share[2]),n:3,prompt:'把整块平均分成 6 份，取 3 份，做出一个半份。'},copy(TASKS.equivalent[0])]),
 pair('equivalent','quarters','四分之一怎样走到 0.25？','把四分之一改写成百分之二十五，就和 0.25 连在了一起。',[{type:'equivalent',n:1,d:4,denominators:[4,8,12],prompt:'把三条同长纸带都取到四分之一，分法改变，量保持。'},copy(TASKS.quarters[0])]),
 pair('decimal','quarters','百格里的量，怎样装进杯子？','百格、小数和分数都是给同一个量取名字。',[{type:'grid',n:50,d:100,prompt:'先在百格上做出 50/100，并写出小数。'},copy(TASKS.quarters[1])]),
 pair('space','hidden','搭出来的块，怎样一层层数？','填满空间的单位块，可以按完整的层来数，隐藏的也算在里面。',[{type:'fill',dims:[3,2,2],prompt:'先亲自搭满 3 × 2 × 2 的盒子，记下体积。'}, {...copy(TASKS.hidden[0]),build:false,prompt:'还是这个盒子：把刚才放入的块数写成一层 × 层数。'}]),
 pair('hidden','box','一层的数法，怎样变成公式？','长乘宽得到一层，再乘高。形状不同，也可能装下一样多的块。',[{type:'cube-plan',dims:[3,2,4],prompt:'长 3、宽 2、高 4。先用每层块数和层数算总量。'}, {type:'cube-plan',dims:[4,3,2],prompt:'换成长 4、宽 3、高 2。再用同一个办法，看看总量怎样变化。'}]),
 pair('box','steps','会算一箱，能算整个台阶吗？','把台阶分成互不重叠的长方体，每块用长宽高计算，再相加。',[{type:'cube-plan',dims:[2,2,3],prompt:'先求出这一块 2 × 2 × 3 长方体的体积。'}, {...copy(TASKS.steps[1]),prompt:'把刚才那一块放回台阶。找一个有效切法，分别计算再合起来。'}]),
 pair('tally','survey','每一个回答，怎样留在表里？','每条观察对应一笔，分类累计的笔数就是频数。',[copy(TASKS.survey[0]),{type:'chart',labels:['走路','公交','骑车'],counts:[4,3,2],source:'table',view:'tally',target:1,prompt:'把刚才自己的两列记录换成计数笔画，再读出公交的人数。'}]),
 pair('tally','views','笔画变圆点，什么没变？','同一类别的次数不变，计数表和圆点图就表达同一份资料。',[{type:'chart',labels:['猫','狗','兔'],counts:[5,3,2],source:'cards',view:'tally',target:1,prompt:'先把这份投票整理成计数笔画。'}, copy(TASKS.views[0])]),
 pair('bars','views','柱子变圆点，怎样对得上？','条形高度与圆点个数可以表示同一数量，换画法不改变原始数据。',[{...copy(TASKS.bars[0]),labels:['猫','狗','兔'],counts:[7,4,2]}, {type:'compare',labels:['猫','狗','兔'],counts:[7,4,2],source:'bar',view:'picture',target:1,prompt:'把刚才的柱子改用圆点表示，再从两边读出狗的票数。'}]),
];
entries.push(...EXTRA_BRIDGES.map(b=>({...pair(b.from,b.to,b.title,b.summary,b.tasks),phase:b.phase||4,...(b.batch?{batch:b.batch}:{})})));
export const BRIDGES=Object.fromEntries(entries.map(x=>[x.id,x]));
export const bridgeIds=Object.keys(BRIDGES);
export const edgeKey=(from,to)=>`${from}>${to}`;
export const bridgeEdgeKey=id=>edgeKey(BRIDGES[id].fromTopicId,BRIDGES[id].topicId);
export const sessionMeta=id=>LESSONS[id]||BRIDGES[id];
export const sessionTasks=id=>TASKS[id]||BRIDGES[id]?.tasks;
export const sessionTaskFor=(id,index)=>index===-1?(PRACTICE[id]||BRIDGES[id]?.tasks[0]):sessionTasks(id)?.[index];
export const sessionRoute=id=>routeFor(BRIDGES[id]?.to||id);
export const bridgeForLesson=id=>entries.filter(b=>b.to===id);
export function sourceBridge(id,atlas){const b=BRIDGES[id];return b&&atlas.edges.find(e=>e.prerequisiteId===b.fromTopicId&&e.topicId===b.topicId);}
// Only actual source edges appear. Route numbers never manufacture dependencies.
export function personalRelations(atlas,selected,litKeys=[],routeOverride=undefined){const lit=new Set(litKeys),route=routeOverride!==undefined?routeOverride:selected?.kind==='node'?sessionRoute(Object.keys(LESSONS).find(id=>LESSONS[id].topicId===selected.id)):selected?.kind==='pack'?Object.values(LESSONS).map(l=>sessionRoute(l.id)).find(r=>r.packIds.includes(selected.id)):null;
 const routeTopics=new Set((route?.ids||[]).map(id=>LESSONS[id].topicId));return atlas.edges.filter(e=>lit.has(edgeKey(e.prerequisiteId,e.topicId))||routeTopics.has(e.prerequisiteId)&&routeTopics.has(e.topicId)).map(e=>({from:'node:'+e.prerequisiteId,to:'node:'+e.topicId,edges:[e],lit:lit.has(edgeKey(e.prerequisiteId,e.topicId))}));}
