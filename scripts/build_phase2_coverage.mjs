import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {LESSONS,ROUTES,REFLECTIONS} from '../dist/learning/catalog.js';
import {TASKS} from '../dist/learning/tasks.js';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const plan=read('docs/content-plan/catalog.json');
// Explicit author review: one entry for each goal, independent of route order.
const mapping={
 share:[[[0],'移动切口平均分成五份，选任意一份'],[[1],'构造四份取三份；用自己的话说明三个单位份'],[[2],'重新分成六份，取任意两份']],
 equivalent:[[[0],'同长纸带上构造 2/4、3/6、4/8'],[[1,2],'把 2/3 对应到六等分和九等分数轴的同一点'],[[0],'构造三种等于半份的分数，不把三个同名样本当三次覆盖']],
 decimal:[[[0,2],'7/10 转小数；换为 0.26 反向构造百分格与分数'],[[1],'用 45 个百格与 0.45 双向对应'],[[3],'在同一零到一单位上把 0.3 与 3/10 对齐']],
 quarters:[[[0,1],'四分之一百格及半杯、四分之三杯的量与小数同时对应'],[[1],'三个直筒杯分别配上小数，作为排序匹配的本地改编'],[[0],'在百格上重建 25/100；解释为何等于 1/4 留在总结']],
 space:[[[1],'选择铺面和填空间的单位；总结解释面积与体积差别'],[[0,1],'实际用边长 1 cm 方块填盒，识别单位立方体并解释'],[[0,1],'填满 2×2×2，再换成 3×2×1 数体积']],
 hidden:[[[0],'亲自逐块搭满 3×2×2，提交每层、层数和 12 cm³'],[[1],'先从固定视角的 3×3×3 数全部 27 块，提交后可拆层'],[[2],'先留下估计才允许填块；搭满 4×2×2 后核对估计与实际']],
 box:[[[0],'提交 12×5=60 的层计划'],[[0],'由层结构连接边长乘积，并解释为什么成立'],[[1],'识别缺角模型，不能直接套外包长方体，给出 58 与方法']],
 steps:[[[0,1],'自己选择切面；两块均为长方体、非空、互不重叠且总和准确'],[[1],'为尺寸不同的台阶计算填充积木；可用两种有效切法'],[[0,1],'以作品解释为什么体积可加，不能凭正确总数判解释']],
 tally:[[[1],'构造一符号一票的圆点图并读指定类别'],[[0],'从投票卡构造五笔一组计数表'],[[2],'从新列表构造每块一票的块状图']],
 survey:[[[0],'逐条观察模拟上学方式，自己记录并回答最多的类别'],[[1],'换为兄弟姐妹数，计数笔画与合计同步，原始观察可回看'],[[1],'本地两列表格记录类别、次数并导出 CSV；不要求外部软件']],
 bars:[[[1],'用一符号一票构造水果图'],[[0],'从表格构造共同零点、单位刻度和已标注轴的条形图'],[[0,1],'读出两类差值，防止把较高柱总量当差值']],
 views:[[[0],'左侧计数表与右侧圆点图保持类别和数量一一对应'],[[0,1],'选择表达偏好并留下为什么；偏好无标准答案'],[[0,1],'分别读取左右两种表示里的同类数量，换资料后再做']],
};
const openGoals={share:[1],quarters:[2],space:[0,1],box:[1,2],steps:[2],views:[0,1]};
const nodes=Object.values(LESSONS).filter(l=>plan.batches[0].topicIds.includes(l.topicId)).map(l=>{const source=plan.nodes.find(n=>n.id===l.topicId),route=ROUTES.find(r=>r.ids.includes(l.id));if(mapping[l.id].length!==source.learningGoals.length)throw new Error('Goal count mismatch '+l.id);
return {topicId:l.topicId,lessonId:l.id,route:route.id,title:l.title,sourceName:source.sourceName,source:source.source,research:source.teachingResource.jsonPointer?'upstream-adapted':'local-supplement',researchReferences:source.teachingResource.jsonPointer?source.teachingResource.activityReferences:'docs/phase2/RESEARCH.md',url:'learn.html#'+l.id,taskCount:TASKS[l.id].length,reflection:REFLECTIONS[l.id],goals:source.learningGoals.map((goal,i)=>({index:i,sourceGoal:goal,tasks:mapping[l.id][i][0].map(j=>({key:l.id+':'+j,index:j,type:TASKS[l.id][j].type,prompt:TASKS[l.id][j].prompt})),implementedAction:mapping[l.id][i][1],explanation:(openGoals[l.id]||[]).includes(i)?'free-text-retained-unassessed':'not-automatically-inferred',claim:'可操作任务对应；不表示孩子已掌握'}))};});
const coverage={schema:'math-phase2-coverage/1',batch:'B01',date:'2026-10-24',sourceCommit:'a8719737ff86ef7940ba5feca11940de1204103e',counts:{availableNodes:nodes.length,newNodes:9,tasks:nodes.reduce((s,n)=>s+n.taskCount,0),sourceGoals:nodes.reduce((s,n)=>s+n.goals.length,0),localResearchSupplements:2,remainingUnimplementedNodes:575},nodes,limits:['解释保留待确认，模拟调查不能证明实际收集能力。','30 个固定任务不能证明长期保持或应对任意新问题。','路线顺序为本地建议，源关系与三维坐标不变。','阶段 3 的连接点亮、新问题与次日接续仍待实现。']};
const md=['# 阶段 2：12 个节点与目标对应','', '当前 B01 已有三条各 4 个节点的学习路线，30 个提交任务、36 个源目标逐一对应。原有 3 个节点保留并补充，新增加 9 个。这里统计的是可用活动，不是已证明的学习效果。','', '孩子界面：先试一试 → 换条件动手 → 收一收并给出正式名称。只有每个确定性任务有成立的作品，新的节点活动才完成；提示和首次错误保留。开放解释不自动评分，活动完成不能代替解释已成立。旧记录按原规则保留，同一来源节点只计一次。','', '来源与两个资料缺口见 [教学依据](RESEARCH.md)，机器对应见 [coverage.json](coverage.json)，制作与估算见 [PRODUCTION.md](PRODUCTION.md)。',''];
for(const n of nodes){md.push('## '+n.route+'–0'+(ROUTES.find(r=>r.id===n.route).ids.indexOf(n.lessonId)+1)+' '+n.title,'', '`'+n.topicId+'` · '+n.sourceName+' · '+n.taskCount+' 个任务。','', '| 源目标 | 对应任务（编号从 1 起）与实际动作 |','| --- | --- |');for(const g of n.goals)md.push('| '+g.sourceGoal.replaceAll('|','\\|')+' | '+g.tasks.map(t=>t.index+1).join('、')+'：'+g.implementedAction+' |');md.push('', '总结提示：'+n.reflection,'');}
md.push('## 验证边界','',...coverage.limits.map(t=>'- '+t),'','首次制作有三类操作族：分割/百格/数轴；三维填充/拆层/切分；计数/图表/观察记录。共同状态、反馈、备份与完成判定由共享模块承担。每个新节点仍需逐个写目标、任务参数和反例，不能只换名字。','');
for(const [path,content]of [['docs/phase2/coverage.json',JSON.stringify(coverage,null,2)+'\n'],['docs/phase2/COVERAGE.md',md.join('\n')]]){const file=new URL(path,root);if(process.argv.includes('--check')){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content)throw new Error('Stale '+path);}else fs.writeFileSync(file,content);}
console.log(JSON.stringify(coverage.counts));
