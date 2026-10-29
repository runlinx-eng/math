import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {BRIDGES,sourceBridge} from '../dist/learning/bridges.js';
import {LESSONS,topicIds} from '../dist/learning/catalog.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const atlas=JSON.parse(fs.readFileSync(root+'dist/data/atlas.json'));
const bridges=Object.values(BRIDGES).filter(b=>b.phase===3).map(b=>{const source=sourceBridge(b.id,atlas);assert.ok(source,b.id);return {id:b.id,title:b.title,from:{id:b.from,topicId:b.fromTopicId,title:LESSONS[b.from].title},to:{id:b.to,topicId:b.topicId,title:LESSONS[b.to].title},sourceEdge:source,localReason:b.summary,tasks:b.tasks.map((t,index)=>({index,type:t.type,prompt:t.prompt}))};});
assert.equal(new Set(bridges.map(b=>b.from.topicId+'>'+b.to.topicId)).size,bridges.length);
const data={schema:1,availableNodes:12,nodeTasks:30,availableConnections:bridges.length,connectionTasks:bridges.reduce((n,b)=>n+b.tasks.length,0),sourceNodes:atlas.nodes.length,sourceRelations:atlas.edges.length,bridges};
const text='# 阶段 3：已开放的连接活动\n\n新增 9 条连接活动、18 个联合操作；节点仍为 12 个，节点任务仍为 30 个。9 条都对应真实源关系；其余源关系仍可浏览，不因此计为已经完成。\n\n两个端点各自完成不会自动点亮连接。必须在这条连接活动的两个操作中都留下成立作品，才点亮对应源边；提示、错误及修正保留，不宣称独立掌握。活动使用本地共同情境串起两种想法，并非原库自带的可运行课程。\n\n| 活动 | 从哪里连到哪里 | 同时用到的关系 | 源方向 |\n| --- | --- | --- | --- |\n'+bridges.map(b=>`| ${b.title} | ${b.from.title} → ${b.to.title} | ${b.localReason} | \`${b.from.topicId}\` → \`${b.to.topicId}\` |`).join('\n')+'\n\n原始强弱、英文理由和逐步操作见 [机器清单](coverage.json)。路线编号不制造新先修边；共同操作未解锁新节点，也不会替代节点中的全部任务。\n';
const files={'docs/phase3/coverage.json':JSON.stringify(data,null,2)+'\n','docs/phase3/CONNECTIONS.md':text};
for(const[path,value]of Object.entries(files)){if(process.argv.includes('--check'))assert.equal(fs.readFileSync(root+path,'utf8'),value,path+' is stale');else{fs.mkdirSync(root+'docs/phase3',{recursive:true});fs.writeFileSync(root+path,value);}}
console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'write',nodes:data.availableNodes,connections:data.availableConnections,connectionTasks:data.connectionTasks}));
