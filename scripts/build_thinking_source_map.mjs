// Preserve the upstream practice tags and the actual source edges separately
// from any claim about a learner's ability or a required learning sequence.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {makeKnowledgeNames} from '../dist/spatial-names.js';

const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),hash=p=>crypto.createHash('sha256').update(read(p)).digest('hex');
const atlas=json('dist/data/atlas.json'),upstream=json('vendor/os-taxonomy/data/topics.json'),deps=json('vendor/os-taxonomy/data/dependencies.json'),standards=json('vendor/os-taxonomy/data/curriculum-standards.json'),inventory=json('docs/spatial-learning/inventory.json');
const source=upstream.topics.filter(n=>n.subject==='Mathematics'&&n.domain==='Mathematical Thinking'),local=atlas.nodes.filter(n=>n.domainId==='thinking');
assert.equal(source.length,50);assert.equal(local.length,50);
const bySource=new Map(source.map(n=>[n.id,n])),byInventory=new Map(inventory.nodes.map(n=>[n.id,n])),names=makeKnowledgeNames(atlas);
for(const n of local){const s=bySource.get(n.id);assert.ok(s,n.id);assert.equal(n.name,s.name);assert.deepEqual(n.standards,s.standards);assert.deepEqual(n.evidence,s.evidence);assert.ok(byInventory.get(n.id)?.lessonId,n.id);}
const labels=['理解和解决问题','抽象与数量推理','论证与质疑','数学建模','策略性使用工具','准确表达','发现与利用结构','从重复推理中发现规律'];
const catalogue=standards.curricula.find(c=>c.slug==='ccss-math'),sourceEdges=new Map(deps.dependencies.map(e=>[`${e.prerequisiteId}>${e.topicId}|${e.strength}`,e]));
const assigned=new Set(),groups=[];
const describe=n=>{const item=byInventory.get(n.id);return {id:n.id,displayName:names.get(n.id),sourceName:n.name,standards:n.standards,lessonId:item.lessonId,lessonUrl:item.lessonUrl,taskCount:item.taskCount,goals:item.goals.map(g=>({sourceGoal:g.sourceGoal,tasks:g.tasks,implementedAction:g.implementedAction,claim:g.claim}))};};
for(let k=1;k<=8;k++){
  const code=`ccss-math:MP.${k}`,s=catalogue.topics.find(t=>t.key===code),nodes=local.filter(n=>n.standards.includes(code)),ids=new Set(nodes.map(n=>n.id));
  assert.ok(s,code);assert.equal(nodes.length,6,code);
  for(const n of nodes){assert.ok(!assigned.has(n.id),'Multiple practice tags require review: '+n.id);assigned.add(n.id);}
  const edges=atlas.edges.filter(e=>ids.has(e.prerequisiteId)&&ids.has(e.topicId));assert.equal(edges.length,5,code);assert.ok(edges.every(e=>e.strength==='hard'),code);
  for(const e of edges){const original=sourceEdges.get(`${e.prerequisiteId}>${e.topicId}|${e.strength}`);assert.ok(original&&original.reason===e.reason,code+' source edge mismatch');}
  const starts=nodes.filter(n=>!edges.some(e=>e.topicId===n.id));assert.equal(starts.length,1,code);const ordered=[starts[0].id];
  while(ordered.length<nodes.length){const next=edges.filter(e=>e.prerequisiteId===ordered.at(-1));assert.equal(next.length,1,code);assert.ok(!ordered.includes(next[0].topicId),code);ordered.push(next[0].topicId);}
  groups.push({code,label:labels[k-1],sourceTitle:s.data.title,nodes:ordered.map(id=>describe(nodes.find(n=>n.id===id))),sourceEdges:ordered.slice(1).map((to,i)=>{const e=edges.find(e=>e.prerequisiteId===ordered[i]&&e.topicId===to);return {from:e.prerequisiteId,to:e.topicId,strength:e.strength,sourceReason:e.reason};})});
}
const untagged=local.filter(n=>!assigned.has(n.id)).map(describe);assert.equal(assigned.size,48);assert.equal(untagged.length,2);assert.ok(untagged.every(n=>!n.standards.some(s=>/^ccss-math:MP\.[1-8]$/.test(s))));
const output={schema:'math-thinking-source-map/1',date:'2026-11-01',sources:Object.fromEntries(['vendor/os-taxonomy/data/topics.json','vendor/os-taxonomy/data/dependencies.json','vendor/os-taxonomy/data/curriculum-standards.json','dist/data/atlas.json'].map(p=>[p,hash(p)])),summary:{sourceThinkingNodes:50,explicitPracticeTaggedNodes:48,groups:8,sourceEdgesWithinGroups:40,withoutPracticeTag:2},limits:['这些是来源中的标签和关系，不是孩子的能力等级或强制顺序。','展示名称为本地适配，源名称、目标和ID均保留；不能只凭名称推断能力。','两条无MP代码的计算器内容保留原标准与全部关系，不自动分配到MP.5。','单次操作、课程完成或本地标签不能证明掌握、迁移或一般证明。'],groups,untagged};
const lines=['# 数学思维节点的来源映射','','2026-11-01：从固定上游快照核对，50 个 Mathematical Thinking 节点中，48 个明确带有八个数学实践代码，两个没有这些代码。每个代码当前恰好对应六个源节点，且这六个节点之间有五条来源 hard 关系；这描述的是数据，不规定孩子的学习次序或能力等级。','','每行顺序由现有源边得到，供核对，不作为任务入口或完成条件。显示名为本地适配；源名称、目标和活动入口见 [thinking-source-map.json](thinking-source-map.json)。','','| 来源代码 | 本地理解 | 六个来源节点（ID） |','| --- | --- | --- |',...groups.map(g=>`| ${g.code} | ${g.label} | ${g.nodes.map(n=>`${n.displayName}（\`${n.id}\`）`).join(' → ')} |`),'','以下两个节点属于上游 Mathematical Thinking，保留其原有标准和学习活动，但没有 MP.1–MP.8 代码；不因主题接近而自动写入 MP.5：','',...untagged.map(n=>`- ${n.displayName}（\`${n.id}\`；${n.sourceName}）：${n.standards.join('、')}，活动 \`${n.lessonId}\`。`),'','八个标准的原文标题来自项目内固定上游标准记录。标签、一次正确操作和任务完成都不能代表独立解释、真实工具使用、能力成长或跨情境迁移。来源与本地任务逐项数学审阅仍待继续。','','重新核对：`node scripts/build_thinking_source_map.mjs --check`。',''];
for(const [path,content] of [['docs/spatial-learning/thinking-source-map.json',JSON.stringify(output,null,2)+'\n'],['docs/spatial-learning/THINKING-SOURCE-MAP.md',lines.join('\n')]]){if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),content,path+' is stale');else fs.writeFileSync(path,content);}
console.log(JSON.stringify(output.summary));
