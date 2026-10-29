import fs from 'node:fs';import assert from 'node:assert/strict';
import{LESSONS,ROUTES}from'../dist/learning/catalog.js';import{TASKS}from'../dist/learning/tasks.js';import{BRIDGES,sourceBridge}from'../dist/learning/bridges.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),plan=read('docs/content-plan/catalog.json'),atlas=read('dist/data/atlas.json'),old=read('docs/phase2/coverage.json');
// Author-reviewed goal-to-task mapping. Task indices are zero-based here.
const map={
 rows:[[[0,1],'用等大行列分板，再逐排铺满'],[[0,1],'逐排增加方片，记录行数、每行格数与总数'],[[0,1],'同一方阵换宽后重建行列与总量']],
 solids:[[[0,1,2],'转动三种立体，逐项标面、棱、顶点'],[[0,1,2],'操作时用通俗称呼，总结对应正式术语'],[[0,1,2],'提交每种立体的三类数量，并留下性质描述']],
 nets:[[[0],'自行画六个连格，折前提交能否合成与一对相对面'],[[0,1],'折叠模型后核对面棱顶点；本轮选择正方体'],[[1,2],'预测阶梯与两行展开图，解释重叠的失败原因']],
 attributes:[[[1],'使用长短与轻重工具比较两支模拟铅笔'],[[0],'同一对容器分别比较高、重与容量'],[[0,1],'按不同属性选择正确的通俗比较描述']],
 measure:[[[0],'选尺、厘米、移动零点、读桌面长度'],[[1],'加减砝码使天平平衡，按克读数'],[[2],'把已装满模拟容器的水倒入量杯，按毫升记录']],
 area:[[[0],'只铺 L 形内部，用单位格计数'],[[1],'以平方厘米方片覆盖模拟书面'],[[1],'比较书面与前一 L 形的单位格数']],
 tiling:[[[0],'逐排铺满 4×6 并提交因素及 24'],[[0,1],'转向后重建方阵，用行列解释乘法'],[[2],'自己改变长宽，铺满并记录自己的乘法']],
 rectangle:[[[0],'7×9 图中对应行列与 63 cm²'],[[1],'构造面积 36 的任意整数边长长方形'],[[2],'把同样方法迁移到米制花园 8×5']],
 boundary:[[[0],'固定长 8，调宽到面积 48；面积与周长各有单位'],[[1],'处理 7.5 的小数边长并区别平方量与边长'],[[2],'按明确半格规则选择池塘覆盖格并估计；并非精确测量']],
 capacity:[[[0],'先估后逐份倒满模拟杯'],[[1],'与一升参照瓶比较再灌满'],[[2],'保持总容量一升，把当前水调为半升并分别记录']],
 equalparts:[[[0],'调整圆的等角分界并命名三分之一'],[[1],'保存两个不同分区，每种颜色各占四格'],[[1],'用不同轮廓的等面积格组解释；文字不自动评分']],
 notation:[[[0,1,2],'建分数并指出取份数、整体份数对应的上下数字'],[[0,1,2],'分类允许单位分数也是真分数；五个四分之一改成一整加一份'],[[3],'在等长纸带构造 1/2 和 2/4 并解释']],
 folds:[[[0],'连续对折模拟，分别记录 2、4、8 份'],[[1],'在两张等大的披萨图取 1/4 和 2/8'],[[2,3],'在方形和圆形分别取八分之一，解释相同单位份意义']],
 amounts:[[[0],'将全部十二颗分到三等组，取一组并记数'],[[1],'将整体四等分并取三份'],[[2],'把同一长度四等分，从零走一段']],
 fractionline:[[[0],'分四段走一段'],[[0,1,2,3,4],'记录每段大小并说明整体与分段关系'],[[1,2],'分别构造三分之一和六分之一'],[[3],'从零走三段四分之一'],[[4],'自行六等分并走五段'],[[5],'读取预分割数轴上五个八分之一的位置']],
 visualeq:[[[0],'图示二等分与四等分的同一个半份'],[[1],'三种分法找末端对齐的 2/3、4/6、6/9'],[[0,1,2],'比较涂色面积，并反查只改分母导致的变化']],
 hundredths:[[[0],'逐个记录从 3/100 到 12/100 的过程'],[[0],'把十分之一再十等分并写最小份名'],[[1,2,3],'在 0 到 1/10 中定位 3、7、9 个百分之一']],
 decpercent:[[[0,2],'搭整份与百格，填写个位、十分位、百分位'],[[0,1,2],'将同一量写成百分数，包含超过 100% 的量'],[[1,2],'半份与 9 个百格分别用分数、小数、百分数对应']],
 scale:[[[0],'先预测 3/4×7 的方向，再改变长度核对'],[[1,2],'分别观察大于一与小于一的倍数，并选出与一比较的理由'],[[3],'对齐 3/4 与 6/8，解释乘 2/2 保持量']],
 ratios:[[[0],'搭三块与两块，按总量二十分配'],[[1],'换成十八按五比一分，算单块与两边'],[[1],'切换同一模型的条形、表格、双数轴并留下用途说明']],
 sortobjects:[[[0],'按颜色放入唯一组并计数'],[[1],'同一物品改按大小重分'],[[0,1],'据各组数量识别最多与最少']],
 sortdata:[[[0,1],'按水果回答分类并核对每类总数'],[[0,1],'在有类别名的记录栏填次数'],[[0,1],'按次数排列，新增回答后重排；允许并列的任意先后']],
 statquestions:[[[0],'将六个固定或有变异的问题分类，并说明群体总数为何仍固定'],[[1,2],'构造对象与属性，并提出两种可能记录'],[[0,2],'辨认群体固定总数，把一次记录改成跨日观察；完整话语保留未评分']],
 datavocab:[[[0],'构建图并补标题、类别轴、次数轴、比例刻度'],[[1],'将可数与可测量的量分类，用半单位诊断'],[[0],'切换笔画、频数表与图案，对应术语与实际记录']],
 scaledgraphs:[[[0],'每格五只构建宠物柱图'],[[1],'按图例两票一图案，比较足球与网球差值'],[[1],'在同图求最多两类的合计']],
 displaypurpose:[[[0,1],'同一运动数据构建并切换表格与条形'],[[0,1],'分别查准确数与比较差距；选择和理由保留，偏好不作为唯一正确答案'],[[1],'指出最多的项目并计算与最少之差']],
 likelihood:[[[0],'五种条件明确的抽珠事件放到可能性轴；替换含天气等含糊前提的例子'],[[0],'把五个词与对应构成相联'],[[0],'专门举蓝珠作反例，区别很可能与一定']],
 chance:[[[0],'二十次伪随机抛币，每次一笔并核对记录'],[[1],'三十次伪随机掷骰，逐项计数并比较第一种结果与预测'],[[2],'放回抽珠，保留预测和真实结果再比较']],
 fairness:[[[0],'构造理想硬币的两个等机会结果并观察试验'],[[1,2],'构造等扇区三色及一红五蓝，按面积解释机会'],[[1,2],'亲自制作等可能与不等可能的例子']],
 simulation:[[[0],'本地数字工具代替外部表格函数，三个规模各五轮并保存比例'],[[0],'用全部真实结果作图观察波动，不强制五轮必然更集中'],[[0],'解释通常趋势与不保证，检查一个合法反例']],
 repeat:[[[0],'圈选最小单元并用单元搭三次'],[[1],'构造 1223 并重复三次'],[[2],'把动作映射为圆方方，保持次序']],
 structure:[[[0],'交换 3 与 9 的位置并写新算式'],[[1],'在四十七上增加一个十并描述位值'],[[2],'分别标记长方形与正方形的边和直角并比较']],
 growing:[[[0],'记录起点五、步长三并补后续'],[[1],'以步长负五补齐减少序列'],[[2],'留下第六塔预测，再搭后面三塔']],
 equality:[[[0],'构造两个六，预测后放开天平'],[[1],'构造五与七，判断不能用等号'],[[2],'左五与右二加三保持平衡，解释等号不表示方向']],
 unknown:[[[0],'调整方框到三并代回'],[[1],'在方框减三的模型里构造八并检查'],[[2],'右边方框构造十二并检查']],
 represent:[[[0],'将贴纸故事的两部分对应到 14+5=19'],[[0,1],'用两部分与整体搭图并求未知部分'],[[0,1],'图、算式和数字角色对应；接受同一关系的加减两种形式']],
 explain:[[[0],'将五拆成二和三，用图展示凑十'],[[1],'用数轴五步得到同一结果，作为第二种方法'],[[2],'指出拆分后的五重复计算，并修复作品']],
 justify:[[[0],'合并位值块、换十，和竖式进位同步呈现'],[[1],'修复 315 的位值错误并指出换十原因'],[[2],'拼完整对子，组装适用于任意偶数的理由，再造反例区别更广的假命题']],
};
const added=Object.values(LESSONS).filter(l=>['B02','B03','B04','B05'].includes(l.batch)).map(l=>{const source=plan.nodes.find(n=>n.id===l.topicId),mapping=map[l.id];assert.equal(mapping.length,source.learningGoals.length,l.id);return{topicId:l.topicId,lessonId:l.id,batch:l.batch,route:ROUTES.find(r=>r.ids.includes(l.id)).id,title:l.title,sourceName:source.sourceName,source:source.source,research:source.teachingResource.jsonPointer?'upstream-adapted':'local-supplement',researchReferences:source.teachingResource.jsonPointer?source.teachingResource.activityReferences:'docs/phase4/RESEARCH.md',url:'learn.html#'+l.id,taskCount:TASKS[l.id].length,reflection:l.reflection,goals:source.learningGoals.map((g,i)=>({index:i,sourceGoal:g,tasks:mapping[i][0].map(j=>{assert.ok(TASKS[l.id][j],l.id+':'+j);return{index:j,type:TASKS[l.id][j].type,prompt:TASKS[l.id][j].prompt};}),implementedAction:mapping[i][1],explanation:'free explanations retained unassessed; deterministic construction checked',claim:'任务对应，不宣称掌握'}))};});
const nodes=[...old.nodes,...added],bridges=Object.values(BRIDGES).filter(b=>b.phase<=4).map(b=>{const source=sourceBridge(b.id,atlas);assert.ok(source,b.id);return{id:b.id,from:b.from,to:b.to,phase:b.phase,title:b.title,sourceEdge:source,summary:b.summary,tasks:b.tasks.map((t,index)=>({index,type:t.type,prompt:t.prompt}))};});
assert.equal(nodes.length,50);assert.equal(new Set(nodes.map(n=>n.topicId)).size,50);assert.deepEqual(nodes.map(n=>n.topicId).sort(),plan.batches.slice(0,5).flatMap(b=>b.topicIds).sort());
const counts={availableNodes:50,newNodes:38,nodeTasks:nodes.reduce((n,x)=>n+TASKS[x.lessonId].length,0),sourceGoals:nodes.reduce((n,x)=>n+x.goals.length,0),routes:ROUTES.filter(r=>r.ids.every(id=>!LESSONS[id].batch||['B02','B03','B04','B05'].includes(LESSONS[id].batch))).length,availableConnections:bridges.length,connectionTasks:bridges.reduce((n,b)=>n+b.tasks.length,0),localResearchSupplements:9,remainingUnimplementedNodes:537,remainingResearchGaps:76};
const coverage={schema:'math-phase4-coverage/1',date:'2026-10-25',sourceCommit:'a8719737ff86ef7940ba5feca11940de1204103e',counts,nodes,bridges,limits:['孩子尚未试用，阶段4整体未完成。','所有测量、折叠、调查与随机试验为屏幕模型，不代替真实器具和实际收集。','文字解释与推理质量未由程序判懂。结构化作品成立不等于可独立迁移或长期掌握。','路线编号是本地建议；只有源数据中的真实边可作为连接。','模拟采用可复算伪随机序列，不保证每一批大样本都更接近期望。']};
const lines=['# 阶段 4：50 个节点的可追溯内容','','累计 50 个不同源节点、'+counts.nodeTasks+' 个节点任务、15 条短路线，21 条源关系各有两步联合操作。新增 38 个节点，剩余 537 个已在全量批次计划中安排。此表是内容对应，技术验证见 VALIDATION；孩子尚未试用。','','[补充依据](RESEARCH.md) · [机器清单](coverage.json)','','| 路线 | 学习入口 | 节点数 |','| --- | --- | --- |',...ROUTES.filter(r=>r.ids.every(id=>!LESSONS[id].batch||['B02','B03','B04','B05'].includes(LESSONS[id].batch))).map(r=>`| ${r.id} | ${r.title} | ${r.ids.length} |`),''];
for(const n of added){lines.push('## '+n.route+' '+n.title,'',`源节点 ${n.topicId} · ${n.sourceName} · ${n.taskCount} 个任务`,'','| 源目标 | 对应任务与动作 |','| --- | --- |');for(const g of n.goals)lines.push('| '+g.sourceGoal.replaceAll('|','\\|')+' | '+g.tasks.map(t=>t.index+1).join('、')+'：'+g.implementedAction+' |');lines.push('');}lines.push('## 验证边界','',...coverage.limits.map(x=>'- '+x),'');
for(const[p,v]of Object.entries({'docs/phase4/coverage.json':JSON.stringify(coverage,null,2)+'\n','docs/phase4/COVERAGE.md':lines.join('\n')})){if(process.argv.includes('--check'))assert.equal(fs.readFileSync(p,'utf8'),v,p);else fs.writeFileSync(p,v);}console.log(counts);
