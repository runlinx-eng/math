# 本地 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_ehGS_uVSJv` 加减法的互逆关系 | Recognise and use the inverse relationship between addition and subtraction to check calculations and solve missing-number problems | `learn.html#undoadd` |
| `mt_AKAtWEwpcj` 加减法口算 | Add and subtract a two-digit number and ones mentally and using concrete/pictorial representations | `learn.html#onesbridge` |
| `mt_nNNVrLqPW3` 合并同类项 | Simplify algebraic expressions by collecting like terms — combine terms with the same variable and power (e.g., 3a + 2b + 5a = 8a + 2b) while maintaining equivalence | `learn.html#terms35` |
| `mt_hVpGOEz2kG` 坐标 | Plot and read coordinates in all four quadrants of the Cartesian plane, using positive and negative x- and y-values to describe positions precisely | `learn.html#coords36` |
| `mt_H6LlpWgEYS` 解决折线图问题 | Solve comparison, sum, and difference problems using information presented in a line graph | `learn.html#linequestions` |
| `mt_Cqm8iy48UI` 读懂表格 | Complete, read, and interpret information in tables, including timetables | `learn.html#timetable` |
| `mt_HnKbuCliNS` 比较分数大小 | Compare two fractions with the same numerator or the same denominator by reasoning about size; record comparisons with >, =, or < symbols | `learn.html#samepartcompare` |
| `mt_TqDq6jyOmL` 分数与小数对应 | Recognise and write decimal equivalents of any number of tenths or hundredths (e.g. 3/10 = 0.3, 27/100 = 0.27) | `learn.html#decimal` |
| `mt_u23IGDxOpk` 平行与垂直 | Identify horizontal and vertical lines and pairs of perpendicular and parallel lines | `learn.html#lineorientation` |
| `mt_fEuoBYw6bU` 平面与立体图形分类 | Compare and sort common 2-D and 3-D shapes and everyday objects by their properties | `learn.html#solidsort` |
| `mt_BFJ-ch_8QU` 比较与排列测量结果 | Compare and order lengths, mass, and capacity and record results using >, <, and = | `learn.html#ordermeasure` |
| `mt_skYly2Qm01` 测量长度 | Order three objects by length and compare the lengths of two objects indirectly using a third object | `learn.html#indirectlength` |
| `mt_Zdv-b-iW5K` 乘除法应用题 | Use multiplication and division within 100 to solve word problems involving equal groups, arrays, and measurement quantities | `learn.html#groupstories` |
| `mt_isojCL9yy-` 乘整十数 | Multiply one-digit whole numbers by multiples of 10 in the range 10–90 using strategies based on place value and properties of operations | `learn.html#tensproducts` |
| `mt_hniI4E-OCE` 判断奇偶 | Determine whether a group of objects (up to 20) has an odd or even number of members | `learn.html#parity` |
| `mt_AQcVRBddko` 排列1000以内的数 | Compare and order numbers up to 1000 using >, =, and < symbols, based on place-value understanding | `learn.html#compare1000` |
| `mt_Zt30Gxi-qp` 计算简单概率 | Calculate the probability of a simple event with equally likely outcomes using the formula: probability = number of favourable outcomes ÷ total number of possible outcomes; express the result as a fraction in its simplest form; apply to rolling dice, drawing from bags, and other simple chance situations | `learn.html#chancecalc` |
| `mt_t0g2SlP404` 0到1之间的概率 | Understand probability as a measure expressed as a number between 0 (impossible) and 1 (certain); place events on the probability scale; express probabilities as fractions, decimals, and percentages | `learn.html#chanceline` |
| `mt_xAf2bu9wYK` 一个量占另一个量的几分之几 | Express one quantity as a fraction of another where the result may be less than 1 or greater than 1, and interpret the meaning in context | `learn.html#fractionOf37` |
| `mt_ALUrJpY0cZ` 把百分数写成分数 | Define percentage as 'number of parts per hundred'; interpret percentages and percentage changes as a fraction or a decimal; express one quantity as a percentage of another; compare quantities using percentages; work with percentages greater than 100% | `learn.html#pctFraction37` |

概率计算仅适用于所列基本结果等可能的情境；分数比较保持同一整体；长度比较统一单位与起点。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：20 个节点在隔离浏览器 1440×900 和 1280×720 两个视口共 40 个场景通过；截图与结果在 `verification/concept-local-batch20e-20261103/`。定向测试 75 项通过；全量 Node 测试 1122/1130，8 项失败与原始基线一致。Phase 2–5 覆盖生成器检查通过。截图复看不等于用户视觉验收。
