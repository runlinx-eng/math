# 本地 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_xPqczp7zPX` 三位数加整百数 | Mentally add and subtract a three-digit number and hundreds | `learn.html#hundredsmove` |
| `mt_XuHmIn2xje` 求未知数 | Solve addition and subtraction problems including missing-number problems, using number facts, place value, and more complex methods | `learn.html#bigmissing35` |
| `mt_z5iwdZyeDr` 代数式的变形 | Model situations or procedures by translating them into algebraic expressions or formulae and by using graphs; move between word problems, algebraic representations, tables, and graphical representations | `learn.html#model35` |
| `mt_Yw27nweoTj` 估计答案 | Use graphs of linear and quadratic functions to estimate output values for given inputs, find approximate solutions to equations, and interpret graphical information in real-world contexts | `learn.html#graph39` |
| `mt_70qDTI14td` 带分数的加减法 | Add and subtract mixed numbers with like denominators, including by converting to improper fractions or using properties of operations | `learn.html#mixedexchange` |
| `mt_-V7EnqU7gG` 通分后做分数加减法 | Add and subtract fractions with denominators that are multiples of the same number by finding a common denominator | `learn.html#relatedparts` |
| `mt_ZLqYE7la4Z` 加减法应用题 | Solve word problems involving addition and subtraction of fractions with like denominators, using visual models and equations | `learn.html#fractionstories` |
| `mt_SXbZ3bC9z7` 比较分数大小 | Compare and order fractions with different numerators and denominators by creating common denominators/numerators or comparing to a benchmark such as 1/2; justify conclusions with visual models | `learn.html#fractionbench` |
| `mt_W17Kbwm0-u` 小数与百分数的写法 | Read, write, and use decimal and percentage notation correctly — decimal, decimal point, tenths, hundredths, thousandths, percentage, per cent, % symbol, convert, terminating decimal — and understand the relationships between fractions, decimals, and percentages as three ways of expressing the same value | `learn.html#decpercent` |
| `mt_wUSbRt3-qw` 立体图形 | Identify 3-D shapes, including cubes and other cuboids, from 2-D representations | `learn.html#solidpictures` |
| `mt_YUJ5pwalqL` 估计角的大小 | Estimate and compare acute, obtuse, and reflex angles in degrees; classify angles by type and order them by size | `learn.html#angleestimate` |
| `mt_QysgF57dxh` 直线、射线与角 | Draw and identify points, lines, line segments, rays, angles (right, acute, obtuse), and perpendicular and parallel lines; identify these in two-dimensional figures | `learn.html#linemark` |
| `mt_6oxQPNLHNv` 带测量单位的计算 | Measure, compare, add, and subtract lengths (m/cm/mm), mass (kg/g), and volume/capacity (l/ml) using standard units | `learn.html#measurecalc` |
| `mt_OzRZ89GrQW` 估计长度 | Estimate lengths using units of inches, feet, centimetres, and metres | `learn.html#estimateLength` |
| `mt_e4x3l2JeLI` 测量长度 | Measure the length of an object by selecting and using appropriate tools such as rulers, yardsticks, metre sticks, and measuring tapes | `learn.html#lengthtools` |
| `mt_p-nbe0w_lf` 有余数的除法 | Solve multi-step word problems using the four operations with whole numbers, including interpreting remainders in context; represent with equations using a letter for the unknown; check with estimation | `learn.html#remainders` |
| `mt_0Wg5F97osg` 因数、倍数与质数 | Solve problems involving multiplication and division using knowledge of factors, multiples, squares, and cubes | `learn.html#factoruse` |
| `mt_6-j1NO2ZUH` 用倍数比较 | Solve word problems involving multiplicative comparison using drawings and equations with a symbol for the unknown number | `learn.html#timesproblems` |
| `mt_tAtMET4EIU` 顺着数与倒着数 | Count forwards and backwards in steps of powers of 10 (10, 100, 1000, 10,000, 100,000) for any given number up to 1,000,000 | `learn.html#powersteps` |
| `mt__sMrmOv3bx` 用数位知识解决问题 | Solve number and practical problems involving place value with increasingly large positive numbers | `learn.html#placeproblems` |

分数比较需同一整体；英寸故事本地改成厘米；模拟尺和屏幕操作不证明真实测量或心算；图像读值属于有限精度估计。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：20 个节点在隔离浏览器 1440×900 和 1280×720 两个视口共 40 个场景通过；截图与结果在 `verification/concept-local-batch20k-20261103/`。定向测试 87 项通过；全量 Node 测试 1134/1142，8 项失败与原始基线一致。截图复看不等于用户视觉验收。
