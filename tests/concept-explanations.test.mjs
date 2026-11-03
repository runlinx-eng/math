import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONCEPT_EXPLANATIONS,conceptHelpFor} from '../dist/concept-explanations.js';
import {makeKnowledgeNames} from '../dist/spatial-names.js';

const source=JSON.parse(fs.readFileSync(new URL('../dist/data/math.json',import.meta.url)));
const byId=new Map(source.nodes.map(n=>[n.id,n]));
const samples=Object.entries(CONCEPT_EXPLANATIONS);

test('fifty-five exact-source explanation samples preserve identities and distinct concept goals',()=>{
  assert.equal(samples.length,289);
  for(const [id,copy] of samples){
    assert.ok(byId.has(id),'sample must reference source node: '+id);
    assert.equal(conceptHelpFor(id),copy);
    for(const field of ['formal','definition','simpler','example','counterexample','tryIt','why']){
      assert.equal(typeof copy[field],'string',id+' '+field);
      assert.ok(copy[field].trim().length>=(field==='formal'?2:10),id+' '+field);
      assert.doesNotMatch(copy[field],/已掌握|你已学会|点击即完成/);
    }
  }
  assert.equal(conceptHelpFor('unknown-source-node'),null);
  assert.equal(byId.get('mt_Ep7TDFuYUa').title,'数轴上的等值分数');
  assert.equal(byId.get('mt_FP-mjXaq3B').title,'等值分数');
  assert.notEqual(conceptHelpFor('mt_Ep7TDFuYUa').definition,conceptHelpFor('mt_FP-mjXaq3B').definition);
});
test('explanation samples cover conceptual, procedural, representational, and language source types',()=>{
  const types=new Set(samples.map(([id])=>byId.get(id).type));
  for(const type of ['CONCEPTUAL','PROCEDURAL','REPRESENTATIONAL','LANGUAGE','META'])assert.ok(types.has(type),type+' source type is represented');
});
test('new samples preserve the key mathematical distinctions in their source goals',()=>{
  assert.match(conceptHelpFor('mt_THl9GLxwoL').definition,/十位.*几个十.*个位.*几个一/);
  assert.match(conceptHelpFor('mt_LpSuPgL31x').definition,/平均分.*按每组指定的数量分组/);
  assert.match(conceptHelpFor('mt_DOe893F6gN').definition,/长度.*厘米或米.*质量.*克或千克/);
  assert.match(conceptHelpFor('mt_-3udyo6VyB').example,/y＝2x＋1.*\(0，1\).*\(1，3\).*\(2，5\)/);
  assert.equal(conceptHelpFor('mt_-3udyo6VyB').visual,'linear-function-graph');
  assert.match(conceptHelpFor('mt_8RmpkDxT9L').definition,/等号.*数量相同/);
  assert.match(conceptHelpFor('mt_vKcxX6iNOA').definition,/分母.*平均分成几份.*分子.*取其中几份.*不能为 0/);
  assert.match(conceptHelpFor('mt_8atyuvPUZc').counterexample,/不等于.*造成/);
  assert.match(conceptHelpFor('mt_mqgu72aCMz').counterexample,/平行且不重合时无解.*重合时有无数个解/);
  assert.match(conceptHelpFor('mt_Qcp2d_kuta').definition,/三维空间.*长、宽、高.*正方体.*长方体/);
  assert.match(conceptHelpFor('mt_Qcp2d_kuta').counterexample,/圆是平面图形，球是立体图形/);
  assert.match(conceptHelpFor('mt_yK51ZnKA8m').definition,/按顺序.*倍数关系.*同时乘或除以同一个正数/);
  assert.match(conceptHelpFor('mt_yK51ZnKA8m').counterexample,/2\/7，不是 2\/5/);
  assert.match(conceptHelpFor('mt_KaF0SQvaiu').definition,/大小相同的单位.*0 刻度.*数值和单位/);
  assert.match(conceptHelpFor('mt_KaF0SQvaiu').counterexample,/留了空隙或互相重叠.*实际长度是 15 厘米/);
  assert.match(conceptHelpFor('mt_PNSyfH56eQ').definition,/p%.*p\/100.*原数量/);
  assert.match(conceptHelpFor('mt_PNSyfH56eQ').example,/360 的 15%.*36＋18＝54/);
  assert.match(conceptHelpFor('mt_Sij9ByyHq6').definition,/体积.*立方单位.*表面积.*平方单位.*外露面/);
  assert.match(conceptHelpFor('mt_Sij9ByyHq6').example,/40 立方厘米.*80 平方厘米/);
  assert.match(conceptHelpFor('mt_1badik7iKJ').definition,/1:50.*实际 50 个相同的长度单位.*统一单位/);
  assert.match(conceptHelpFor('mt_1badik7iKJ').example,/9×50＝450 厘米.*4.5 米/);
});
test('four chart and geometry representations preserve their reading rules',()=>{
  assert.equal(conceptHelpFor('mt_JRzXQl9M7c').visual,'dot-plot');
  assert.match(conceptHelpFor('mt_JRzXQl9M7c').definition,/每个点代表一次观测.*相同数值的点竖直堆叠/);
  assert.match(conceptHelpFor('mt_JRzXQl9M7c').counterexample,/6 名学生各读了 5 本/);
  assert.equal(conceptHelpFor('mt_oderfUBZPw').visual,'histogram');
  assert.match(conceptHelpFor('mt_oderfUBZPw').definition,/长条.*不能留缝.*150≤h<160/);
  assert.match(conceptHelpFor('mt_oderfUBZPw').counterexample,/不能告诉我们.*精确身高/);
  assert.equal(conceptHelpFor('mt_8VjmxR1yfw').visual,'box-plot');
  assert.match(conceptHelpFor('mt_8VjmxR1yfw').example,/中位数是 9.*四分位距是 14－6＝8.*极差是 21－3＝18/);
  assert.match(conceptHelpFor('mt_8VjmxR1yfw').counterexample,/不表示上面的人更多/);
  assert.equal(conceptHelpFor('mt_vnJEztczji').visual,'cube-net');
  assert.match(conceptHelpFor('mt_vnJEztczji').definition,/6 个相同的正方形.*不能重叠/);
  assert.match(conceptHelpFor('mt_vnJEztczji').counterexample,/不代表一定是正方体展开图/);
});
test('five procedural samples explain steps, place value, units, and data spread',()=>{
  assert.match(conceptHelpFor('mt_m1W6nTQJ2b').example,/8＋6.*2＋4.*14/);
  assert.match(conceptHelpFor('mt_m1W6nTQJ2b').counterexample,/剩下的是 4/);
  assert.match(conceptHelpFor('mt_q9EaJc2FP8').example,/34×27.*238＋680＝918/);
  assert.match(conceptHelpFor('mt_q9EaJc2FP8').counterexample,/代表 20/);
  assert.match(conceptHelpFor('mt_Jvg8X0N5u0').example,/长＋宽.*22 厘米/);
  assert.match(conceptHelpFor('mt_Jvg8X0N5u0').counterexample,/2×长＋宽/);
  assert.match(conceptHelpFor('mt_kLQOzZYrd5').definition,/速度＝路程÷时间.*单价＝总价÷数量.*密度＝质量÷体积/);
  assert.match(conceptHelpFor('mt_kLQOzZYrd5').example,/150÷2.5＝60 千米\/小时/);
  assert.match(conceptHelpFor('mt_ZfpeI1CFyP').definition,/绝对距离.*距离不能是负数/);
  assert.match(conceptHelpFor('mt_ZfpeI1CFyP').example,/平均数是 8.*4、2、0、1、5.*2.4/);
});
test('four representational samples connect visual structure to the mathematical relationship',()=>{
  assert.equal(conceptHelpFor('mt_ePXg_XyCKU').visual,'ratio-bar-model');
  assert.match(conceptHelpFor('mt_ePXg_XyCKU').example,/30 张贴纸.*5 格.*每格 30÷5＝6 张.*12 张和 18 张/);
  assert.match(conceptHelpFor('mt_ePXg_XyCKU').counterexample,/不同长度/);
  assert.equal(conceptHelpFor('mt_eSv_w46u6H').visual,'venn-two-sets');
  assert.match(conceptHelpFor('mt_eSv_w46u6H').example,/P\(至少喜欢一项\)＝24\/30/);
  assert.match(conceptHelpFor('mt_eSv_w46u6H').counterexample,/不能.*重复算两次/);
  assert.equal(conceptHelpFor('mt_GRWwTDZ3wD').visual,'multiplication-array');
  assert.match(conceptHelpFor('mt_GRWwTDZ3wD').example,/3×4＝12.*12÷3＝4/);
  assert.equal(conceptHelpFor('mt_AQo4u7O4sM').visual,'area-distributive-model');
  assert.match(conceptHelpFor('mt_AQo4u7O4sM').definition,/a×\(b＋c\)＝a×b＋a×c/);
  assert.match(conceptHelpFor('mt_AQo4u7O4sM').counterexample,/3×2/);
});
test('meta samples explain strategy selection, verification, and investigation limits',()=>{
  assert.match(conceptHelpFor('mt_QaYfeVL-0C').definition,/四舍五入.*大致范围.*逆运算.*合理/);
  assert.match(conceptHelpFor('mt_SHVyE1CLUa').definition,/提出清楚的问题.*向谁收集.*怎样收集.*结论的限制/);
  assert.match(conceptHelpFor('mt_SHVyE1CLUa').counterexample,/样本可能不具代表性/);
});

test('four geometry samples explain coordinates, transformations, and area procedures',()=>{
  assert.equal(conceptHelpFor('mt_i5_HnoFOYw').visual,'coordinate-grid');
  assert.match(conceptHelpFor('mt_i5_HnoFOYw').definition,/第一个数.*横向位置.*第二个数.*纵向位置/);
  assert.match(conceptHelpFor('mt_i5_HnoFOYw').counterexample,/1，4.*4，1.*不是同一个点/);
  assert.match(conceptHelpFor('mt_i5_HnoFOYw').example,/A\(1，1\).*B\(1，4\).*C\(5，4\).*D\(5，1\).*长 4 格、宽 3 格/);
  assert.equal(conceptHelpFor('mt_SH7QgFl8-v').visual,'grid-transformations');
  assert.match(conceptHelpFor('mt_SH7QgFl8-v').definition,/平移.*反射.*旋转.*保持长度和角度.*反射会改变朝向/);
  assert.match(conceptHelpFor('mt_SH7QgFl8-v').counterexample,/关于 y 轴反射后是.*−1，2.*不是.*1，−2/);
  assert.match(conceptHelpFor('mt_SH7QgFl8-v').why,/平移和旋转保持朝向，反射会翻转朝向/);
  assert.equal(conceptHelpFor('mt_ML5t7n2-U8').visual,'triangle-parallelogram-area');
  assert.match(conceptHelpFor('mt_ML5t7n2-U8').definition,/平行四边形面积.*底×对应的垂直高.*三角形面积.*÷2.*高是与所选底边垂直的距离.*钝角三角形的高可能落在图形外/);
  assert.match(conceptHelpFor('mt_ML5t7n2-U8').simpler,/与它垂直的高/);
  assert.doesNotMatch(conceptHelpFor('mt_ML5t7n2-U8').simpler,/直上直下/);
  assert.match(conceptHelpFor('mt_ML5t7n2-U8').counterexample,/10×5＝50.*不是 10×6＝60.*斜边不是对应的高/);
  assert.match(conceptHelpFor('mt_ML5t7n2-U8').example,/8×5＝40 平方厘米.*8×5÷2＝20 平方厘米/);
  assert.equal(conceptHelpFor('mt_i2-QaXbyzB').visual,'polygon-area-decomposition');
  assert.match(conceptHelpFor('mt_i2-QaXbyzB').definition,/分成.*长方形和三角形.*相加.*补成.*减去多出来的部分.*不能重叠或留空/);
  assert.match(conceptHelpFor('mt_i2-QaXbyzB').example,/底长分别为 1 厘米和 3 厘米.*虽然大小不同.*底长合计为 10−6＝4 厘米.*对应的高都是 4 厘米.*4×4÷2＝8 平方厘米.*24＋8＝32 平方厘米/);
  assert.match(conceptHelpFor('mt_i2-QaXbyzB').counterexample,/重叠.*空隙.*补成长方形/);
  assert.equal(conceptHelpFor('mt_ZfpeI1CFyP').formal,'平均绝对偏差（mean absolute deviation）');
  assert.match(conceptHelpFor('mt_i2-QaXbyzB').counterexample,/对于一般四边形.*两条对角线不垂直/);
});

test('source names and node counts remain unchanged; help is supplemental',()=>{
  const canonical=makeKnowledgeNames({nodes:source.nodes});
  assert.equal(source.nodes.length,587);
  assert.equal(source.edges.length,1223);
  assert.ok(canonical.get('mt_Ep7TDFuYUa').includes('数轴上的等值分数'));
  assert.equal(byId.get('mt_WcfaSfVT33').title,'一一对应地数');
  assert.equal(byId.get('mt_6xNmQLzuqm').title,'理解面积');
  assert.ok(conceptHelpFor('mt_UcGn2hjhYU').definition.includes('结果等可能'));
});


test('first-pass calibration closes identified source-scope gaps without claiming child validation',()=>{
  assert.doesNotMatch(conceptHelpFor('mt_Ep7TDFuYUa').simpler,/离 0 一样远/);
  assert.match(conceptHelpFor('mt_Ep7TDFuYUa').simpler,/同一条数轴.*同一个位置/);
  assert.match(conceptHelpFor('mt_UcGn2hjhYU').definition,/结果等可能.*结果机会不相等/);
  assert.match(conceptHelpFor('mt_UcGn2hjhYU').example,/90°.*90\/360＝1\/4.*180°.*1\/2/);
  assert.match(conceptHelpFor('mt_DOe893F6gN').definition,/温度用摄氏度/);
  assert.match(conceptHelpFor('mt_-3udyo6VyB').definition,/y＝mx＋c.*梯度/);
  assert.match(conceptHelpFor('mt_-3udyo6VyB').example,/2x＋3y＝12.*y＝−2\/3x＋4.*梯度是 −2\/3/);
  assert.match(conceptHelpFor('mt_vKcxX6iNOA').definition,/单位分数.*真分数.*假分数.*带分数.*等值分数.*最简分数/);
  assert.match(conceptHelpFor('mt_8atyuvPUZc').definition,/最佳拟合线.*已有数据范围内/);
  assert.match(conceptHelpFor('mt_SHVyE1CLUa').definition,/报告出来.*结论的限制/);
  assert.match(conceptHelpFor('mt_yK51ZnKA8m').definition,/化简.*6:9＝2:3/);
  assert.match(conceptHelpFor('mt_yK51ZnKA8m').definition,/a\/b 表示第一个数量是第二个数量的多少倍.*第二个数量记作 x、把第一个数量记作 y.*y＝\(a\/b\)x/);
  assert.match(conceptHelpFor('mt_Sij9ByyHq6').definition,/直棱柱的体积等于底面积乘高/);
  assert.match(conceptHelpFor('mt_1badik7iKJ').definition,/实际长度求图上长度/);
  assert.match(conceptHelpFor('mt_ePXg_XyCKU').example,/12\/30＝2\/5/);
  assert.match(conceptHelpFor('mt_ePXg_XyCKU').definition,/部分与部分.*部分占整体.*百分数.*双数轴/);
  assert.match(conceptHelpFor('mt_eSv_w46u6H').definition,/两个或三个集合.*乘法原理/);
  assert.match(conceptHelpFor('mt_m1W6nTQJ2b').example,/8＋4＝12.*12－8＝4/);
  assert.match(conceptHelpFor('mt_q9EaJc2FP8').example,/2,347×6＝14,082/);
  assert.match(conceptHelpFor('mt_ZfpeI1CFyP').definition,/原数据的单位.*MAD 为 0/);
  assert.match(conceptHelpFor('mt_JRzXQl9M7c').definition,/相等间隔.*最小值.*观测总数/);
  assert.match(conceptHelpFor('mt_oderfUBZPw').definition,/等宽区间.*频率密度/);
  assert.match(conceptHelpFor('mt_8VjmxR1yfw').example,/另一组的中位数是 10.*四分位距是 7/);
  assert.match(conceptHelpFor('mt_vnJEztczji').definition,/长方体、三棱柱和底面为正方形的棱锥/);
  assert.match(conceptHelpFor('mt_SH7QgFl8-v').definition,/水平、竖直或斜镜线.*90° 或 180°/);
  assert.match(conceptHelpFor('mt_ML5t7n2-U8').definition,/不规则图形.*数格子估算/);
});

test('the review standard distinguishes editorial calibration from independent math and child validation',()=>{
  const standard=fs.readFileSync(new URL('../docs/language/CONCEPT-REVIEW-STANDARD.md',import.meta.url),'utf8');
  const pilot=fs.readFileSync(new URL('../docs/language/CONCEPT-PILOT.md',import.meta.url),'utf8');
  assert.match(standard,/来源核对/);
  assert.match(standard,/数学审查/);
  assert.match(standard,/儿童理解/);
  assert.match(standard,/hasResearch=false/);
  assert.match(standard,/不替代完整学习活动/);
  assert.match(pilot,/21 个补充了来源目标/);
  assert.match(pilot,/7 个研究缺口/);
  assert.match(pilot,/均未完成真实儿童理解验证/);
});


test('first expansion batch explains six additional source goals without changing source identities',()=>{
  const cardinality=conceptHelpFor('mt_dmNvjroCPT');
  assert.match(cardinality.definition,/最后说出的数词.*总数/);
  assert.match(cardinality.definition,/怎样摆放.*从哪件开始数/);
  const teen=conceptHelpFor('mt_xmmgAzxe5j');
  assert.match(teen.definition,/11 到 19.*1 个十.*1 到 9 个一/);
  assert.match(teen.example,/14＝10＋4/);
  const fractions=conceptHelpFor('mt_IfEgu0X449');
  assert.match(fractions.definition,/分母相同.*分子较大/);
  assert.match(fractions.definition,/单位分数 1\/n.*分母越大/);
  assert.match(fractions.counterexample,/1\/4 小于 2\/3/);
  const multiplication=conceptHelpFor('mt_PZ909yPrEC');
  assert.match(multiplication.definition,/每组数量相同.*重复相加/);
  assert.match(multiplication.definition,/每行数量相同的排列方阵/);
  assert.match(multiplication.example,/3＋3＋3＋3＝12.*4×3＝12/);
  const position=conceptHelpFor('mt_qeZYF6HZ4o');
  assert.match(position.definition,/相对于参照物.*观察方向/);
  assert.match(position.counterexample,/左右方向可能改变/);
  const sorting=conceptHelpFor('mt_ylXdiVRAYv');
  assert.match(sorting.definition,/最多三个类别.*分别计数.*排序/);
  assert.match(sorting.counterexample,/重复放进两组/);
});


test('first five researched drafts preserve source evidence and mathematical boundaries',()=>{
  const collect=conceptHelpFor('mt_ebQURBOsM5');
  assert.match(collect.example,/步行3人、汽车4人、公交2人、自行车1人/);
  assert.match(collect.example,/3＋4＋2＋1＝10/);
  assert.match(collect.tryIt,/频数总和是否等于有效回答人数/);
  assert.match(collect.counterexample,/0是一个真实的回答，未回答是缺失/);
  const compare=conceptHelpFor('mt__yvsKKp3TS');
  assert.match(compare.definition,/类别、每类频数和总数应一致/);
  assert.match(compare.example,/狗4人.*4个图标.*都读出4人/);
  assert.match(compare.counterexample,/计数表是表格，不是图/);
  const capacity=conceptHelpFor('mt_NSC3LT_-ch');
  assert.match(capacity.example,/300 mL.*30 mL.*3 L/);
  assert.match(capacity.example,/1 L＝1000 mL.*500 mL.*容量仍是1 L/);
  assert.match(capacity.counterexample,/只看水位高度也不能判断容量/);
  const fractions=conceptHelpFor('mt_gC-6JXAG5S');
  assert.match(fractions.example,/1\/2＝2\/4＝4\/8/);
  assert.match(fractions.example,/2\/8＝1\/4/);
  assert.match(fractions.counterexample,/等份要求面积或数量相等，不要求每块形状完全一样/);
  assert.equal(2/8,1/4);
  assert.equal(1/2,2/4);
  assert.equal(1/2,4/8);
  const statistical=conceptHelpFor('mt_iykH2P5oFq');
  assert.match(statistical.definition,/总体.*观测单位.*变量.*预期变异/);
  assert.match(statistical.example,/典型值约9小时.*不表示每个人都睡9小时/);
  assert.match(statistical.counterexample,/我们班有多少名学生.*固定人数/);
  assert.match(statistical.counterexample,/同一个人这一周每天睡多久.*答案也可能变化/);
});


test('second-batch first five explanations preserve source-specific mathematical goals and boundaries',()=>{
  const angles=conceptHelpFor('mt_oqziWKry-L');
  assert.match(angles.definition,/360°.*180°.*对顶角.*相等/);
  assert.match(angles.example,/120°.*95°.*145°.*4×90°＝360°.*270°/);
  assert.match(angles.why,/平角.*180°.*周角.*360°/);
  const place=conceptHelpFor('mt_aPBzD28_mT');
  assert.match(place.definition,/数字是 0 到 9 的记号.*数位是数字在数中的位置.*位值是这个数字在该位置表示的实际数量/);
  assert.match(place.definition,/个位.*十位.*百位.*百位上的数字不能是 0/);
  assert.match(place.example,/362.*300.*60.*2.*706.*700.*0.*6/);
  assert.match(place.counterexample,/706 不是 7＋0＋6＝13/);
  const probability=conceptHelpFor('mt_3fwYu7imd4');
  assert.match(probability.definition,/互不重叠.*概率之和等于 1.*P\(不发生 A\)＝1－P\(A\)/);
  assert.match(probability.example,/0.20.*0.35.*0.15.*0.30.*0.65.*1\/6.*5\/6/);
  assert.match(probability.tryIt,/漏掉一种颜色/);
  const equation=conceptHelpFor('mt_QhFEDyIwSO');
  assert.match(equation.definition,/最高次数为 1.*分数或负数系数.*未知数/);
  assert.match(equation.example,/2x＋1＝x＋8.*x＝7/);
  assert.match(equation.tryIt,/−\(1\/2\)\(x－4\)＋3＝2/);
  assert.match(equation.counterexample,/只改变了一边/);
  const statistics=conceptHelpFor('mt_XSXnTQoQ4l');
  assert.match(statistics.definition,/算术平均数.*选择中心指标.*极端值影响/);
  assert.match(statistics.definition,/平均数.*中位数.*众数.*极差.*比较两组观测数据/);
  assert.match(statistics.example,/平均数是 30÷5＝6.*中位数是 5.*众数是 5.*极差是 11－3＝8/);
  assert.match(statistics.example,/甲班.*中位数是 7.*极差是 9－6＝3.*乙班.*中位数是 8.*极差是 10－5＝5/);
  assert.match(statistics.tryIt,/分别求两组的中位数和极差/);
  assert.match(statistics.tryIt,/选一个最适合表达.*典型水平.*说明理由/);
});


test('second-batch second five explanations preserve source-specific goals and mathematical boundaries',()=>{
  const volume=conceptHelpFor('mt_nTL-owFJTF');
  assert.match(volume.definition,/长×宽.*底面积×高.*cm³.*m³.*不规则立体/);
  assert.match(volume.example,/4×3＝12.*12×5＝60 cm³.*40×20×15＝12000 cm³/);
  assert.match(volume.counterexample,/58 个 1 cm³.*不是 60 cm³/);
  assert.match(volume.why,/每一层.*长和宽.*层数.*高/);
  const representations=conceptHelpFor('mt_PgsHGYJMH-');
  assert.match(representations.definition,/具体物品、图画.*头脑中的图像/);
  assert.match(representations.example,/3 个计数片.*2 个.*3＋2＝5.*5 个苹果.*划掉 2 个.*5－2＝3/);
  assert.match(representations.tryIt,/手指、小物品或图画/);
  const scaled=conceptHelpFor('mt_r8XnXwRA6g');
  assert.match(scaled.definition,/一个图形符号.*固定数量.*条形图.*柱顶.*坐标轴.*从 0 开始/);
  assert.match(scaled.definition,/一个图形符号.*固定数量.*图例和坐标轴刻度/);
  assert.match(scaled.example,/每格代表 5 只宠物.*足球.*网球.*20 人.*15 人.*35 票/);
  assert.match(scaled.tryIt,/每格代表 2 本书.*6 本.*10 本.*4 本/);
  const algebra=conceptHelpFor('mt_KwdjWEmMNo');
  assert.match(algebra.definition,/ab.*3y.*a².*a\/b.*b 不能为 0.*系数是与字母相乘的数.*系数也可以是分数/);
  assert.match(algebra.example,/3y.*a².*\(1\/2\)x.*a\/b/);
  assert.match(algebra.counterexample,/3y 不是 3＋y.*a² 不是 2a/);
  const estimate=conceptHelpFor('mt_ilPrU0cbtT');
  assert.match(estimate.definition,/近似结果.*精确计算.*精度/);
  assert.match(estimate.example,/487×23.*500×20＝10000.*487×23＝11201/);
  assert.match(estimate.tryIt,/198×31.*200.*31.*30.*3980÷8/);
  assert.match(estimate.tryIt,/1120.*是否合理.*估算/);
});

test('local batch keeps equal-whole, shape, and aligned comparison boundaries',()=>{
  const half=conceptHelpFor('mt_-hTTat0mBR');
  assert.match(half.definition,/相等.*两份/);
  assert.match(half.counterexample,/不相等/);
  const shapes=conceptHelpFor('mt_KJeEeTutJI');
  assert.match(shapes.definition,/正方形.*长方形/);
  assert.match(shapes.counterexample,/直角/);
  const lengths=conceptHelpFor('mt_uhuxX8sg9f');
  assert.match(lengths.definition,/共同起点/);
  assert.match(lengths.counterexample,/不一定/);
});

test('local number concepts preserve zero, division order and place value',()=>{
  const parts=conceptHelpFor('mt_7XcCG43ZZW');
  assert.match(parts.example,/0 颗和 5 颗/);
  const commutation=conceptHelpFor('mt_C9ZfT-4cgn');
  assert.match(commutation.counterexample,/12÷3＝4.*3÷12＝1\/4/);
  const numerals=conceptHelpFor('mt_fR0UtsSREU');
  assert.match(numerals.example,/1 个十和 7 个一/);
  assert.match(numerals.definition,/0 表示没有物品/);
});

test('twenty-node batch preserves counting, fraction and time boundaries',()=>{
  assert.match(conceptHelpFor('mt_e8CZ7E5qW7').definition,/10/);
  assert.match(conceptHelpFor('mt_0u4KLbvBa1').counterexample,/0.*偶数/);
  assert.match(conceptHelpFor('mt_hyvHv2BCwb').counterexample,/不同大小/);
  assert.match(conceptHelpFor('mt_TcG90kS8nu').why,/开始时刻/);
  assert.match(conceptHelpFor('mt_zOWwLxa77y').counterexample,/12＝3×4/);
});

test('second twenty-node batch keeps cross-hundred, common-whole and capacity boundaries',()=>{
  assert.match(conceptHelpFor('mt_I5j1ZWo2cn').counterexample,/85＋30＝115/);
  assert.match(conceptHelpFor('mt_OkSJfrmFb_').example,/97加10是107/);
  assert.match(conceptHelpFor('mt_MyGblah2yY').counterexample,/不同大小整体/);
  assert.match(conceptHelpFor('mt_zkFbMLpu3U').definition,/容量.*当前水量/);
  assert.match(conceptHelpFor('mt_xACS3rWWDp').counterexample,/不一定形状相同/);
});

test('third twenty-node batch retains unit, geometry and date boundaries',()=>{
  assert.match(conceptHelpFor('mt_4lp_b5Pzik').counterexample,/不同大小/);
  assert.match(conceptHelpFor('mt_sBcRdUfAzV').counterexample,/不是.*对称轴/);
  assert.match(conceptHelpFor('mt_bj1YCgNWUx').counterexample,/365天.*364天/);
  assert.match(conceptHelpFor('mt_a1FdAsRKOF').counterexample,/不是4\/10/);
});

test('fourth twenty-node batch preserves equality, probability and unit boundaries',()=>{
  assert.match(conceptHelpFor('mt_Xp-rj46S2w').definition,/面积相等/);
  assert.match(conceptHelpFor('mt_GDG9_SZmsO').definition,/除数不为零/);
  assert.match(conceptHelpFor('mt__N55B7u7HD').counterexample,/30秒.*不是40秒/);
  assert.match(conceptHelpFor('mt_iFFKZd-Vgv').example,/很可能.*不是一定/);
  assert.match(conceptHelpFor('mt_h0gJcSuwdL').counterexample,/都加2/);
});

test('fifteen-node batch preserves denominator, probability and regrouping boundaries',()=>{
  assert.match(conceptHelpFor('mt_CBHwluE6Lp').counterexample,/不是7\/10/);
  assert.match(conceptHelpFor('mt_-c4Ca_nBzX').definition,/所有基本结果等可能/);
  assert.match(conceptHelpFor('mt_izien3ZX51').counterexample,/290/);
  assert.match(conceptHelpFor('mt_nOCPx5qw0Z').counterexample,/2＋3＝5/);
  assert.match(conceptHelpFor('mt_T76hKqXf0z').counterexample,/不能.*直接套到减法/);
});

test('twenty-node batch keeps units, shared wholes, probability and coordinate boundaries',()=>{
  assert.match(conceptHelpFor('mt_HnKbuCliNS').definition,/同一整体/);
  assert.match(conceptHelpFor('mt_Zt30Gxi-qp').definition,/等可能/);
  assert.match(conceptHelpFor('mt_BFJ-ch_8QU').counterexample,/先换算/);
  assert.match(conceptHelpFor('mt_hVpGOEz2kG').counterexample,/不属于任何象限/);
  assert.match(conceptHelpFor('mt_ALUrJpY0cZ').counterexample,/基准量/);
});

test('twenty-node batch preserves rounding, sample and probability boundaries',()=>{
  assert.match(conceptHelpFor('mt_Fl7b8q9pI1').definition,/非负.*约定/);
  assert.match(conceptHelpFor('mt_J4j7d3iAfg').counterexample,/不保证/);
  assert.match(conceptHelpFor('mt_XfyqXLqzpx').counterexample,/重叠/);
  assert.match(conceptHelpFor('mt_R2ccrI-nKD').counterexample,/30个十/);
  assert.match(conceptHelpFor('mt_ChjMU2GDJa').counterexample,/不能.*实际/);
});

test('twenty-node batch distinguishes observed frequency, units and place-value exchanges',()=>{
  assert.match(conceptHelpFor('mt_sHJqh6UUya').why,/并无保证/);
  assert.match(conceptHelpFor('mt_HlNSurPVDp').why,/估计/);
  assert.match(conceptHelpFor('mt_9XVFje6Tyr').why,/多个数位/);
  assert.match(conceptHelpFor('mt_XWSGuFW7It').counterexample,/3\/5/);
  assert.match(conceptHelpFor('mt_Cg8VPguS_V').counterexample,/410\/6/);
});

test('twenty-node batch keeps quantity, adaptation and sampling boundaries',()=>{
  assert.match(conceptHelpFor('mt_tpT9brpI6D').example,/10000平方厘米/);
  assert.match(conceptHelpFor('mt_9IzhGUZ30z').why,/不评估英文数词/);
  assert.match(conceptHelpFor('mt_GDtFU5fyUv').why,/不放回/);
  assert.match(conceptHelpFor('mt_iNdrM2-oJf').why,/商的意义不同/);
  assert.match(conceptHelpFor('mt_bESTSBB0wK').counterexample,/不同总人数/);
});

test('twenty-node batch preserves changes, equality and evidence boundaries',()=>{
  assert.match(conceptHelpFor('mt_i2F1nWxJjv').why,/乘除负数.*方向/);
  assert.match(conceptHelpFor('mt_-bMnJcPJy8').counterexample,/不保证.*每一步/);
  assert.match(conceptHelpFor('mt_BdAeZJUOir').counterexample,/不证明/);
  assert.match(conceptHelpFor('mt_hRZyKvz1KN').example,/非正方形.*2条/);
  assert.match(conceptHelpFor('mt_iEXqN48w3x').counterexample,/基准/);
});

test('twenty-node batch keeps place values, zeros and shape boundaries',()=>{
  assert.match(conceptHelpFor('mt_aHQ9kNt3is').example,/372＋40＝412/);
  assert.match(conceptHelpFor('mt_LlMl2PbaZe').counterexample,/不改变数值/);
  assert.match(conceptHelpFor('mt_y1XCVsIelg').counterexample,/1既不是素数也不是合数/);
  assert.match(conceptHelpFor('mt_933BohS9BH').example,/0\.7＝0\.70＝0\.700/);
  assert.match(conceptHelpFor('mt_3qrCtdoVAU').simpler,/除数不为零/);
});
