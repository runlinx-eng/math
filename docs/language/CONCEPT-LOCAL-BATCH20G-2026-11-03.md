# 本地 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_3JgrHY221M` 加减法中的未知数 | Determine the unknown whole number in an addition or subtraction equation relating three whole numbers | `learn.html#unknown` |
| `mt_oIzycTBeE4` 等号表示什么 | Understand the meaning of the equal sign as 'is the same as' and determine if equations are true or false | `learn.html#equality` |
| `mt_g_fkAqmz72` 代数式与方程的语言 | Understand and use the concepts and vocabulary of expressions, equations, inequalities, terms, and factors; distinguish between an expression (no equals sign), an equation (equals sign), and an inequality (inequality sign) | `learn.html#words35` |
| `mt_yXO7lQ9Yn7` 按规律生成数列 | Generate terms of a sequence from a term-to-term rule (e.g., 'add 3 each time') or a position-to-term rule (e.g., '2n + 1'), and identify whether a sequence is arithmetic, geometric, or neither | `learn.html#rules34` |
| `mt_Cg8VPguS_V` 计算平均数 | Calculate and interpret the mean as an average of a data set | `learn.html#meanbalance` |
| `mt_HlNSurPVDp` 折线统计图 | Construct and interpret line graphs for continuous data (e.g. temperature over time, plant growth); read intermediate values, identify trends, and solve comparison and difference problems | `learn.html#timebuilder` |
| `mt_IegHBHERVa` 比较两位小数 | Compare numbers with the same number of decimal places up to two decimal places | `learn.html#decimalorder2` |
| `mt_wB-GBDkoNr` 小数与分数 | Solve simple measure and money problems involving fractions and decimals to two decimal places | `learn.html#fractionmeasure` |
| `mt_MFfYcnv6Tv` 直角与转弯 | Identify right angles; recognise that two right angles make a half-turn, three make three-quarters, and four make a complete turn | `learn.html#rightcheck` |
| `mt_8OAGVdeTJ_` 理解角 | Recognise angles as a property of shape or a description of a turn | `learn.html#anglecorner` |
| `mt_6J1wmCWf41` 金额的加减法 | Solve simple money problems involving addition and subtraction, including giving change | `learn.html#pennyshop` |
| `mt_2XDGT5tei1` 一小时有多少分钟 | Know the number of minutes in an hour and the number of hours in a day | `learn.html#hoursday` |
| `mt_Lb2ZnMdkYR` 运算性质 | Apply properties of operations (commutative, associative, distributive) as strategies to multiply and divide | `learn.html#productways` |
| `mt_xZvDCYA5Ae` 乘除法中的未知数 | Determine the unknown whole number in a multiplication or division equation relating three whole numbers (e.g. 8 × ? = 48, ? × 6 = 42) | `learn.html#unknownproducts` |
| `mt_9XVFje6Tyr` 多1000或少1000 | Find 1000 more or less than a given number | `learn.html#thousandstep` |
| `mt_vXRzMbiPff` 负数 | Count backwards through zero to include negative numbers | `learn.html#negativefirst` |
| `mt_sHJqh6UUya` 用实验估计概率 | Record, describe, and analyse the frequency of outcomes from probability experiments to develop an understanding of relative frequency as an estimate of probability | `learn.html#trialestimate` |
| `mt_vmQJAtAFuy` 概率的刻度 | Understand probability as a measure on a scale from 0 (impossible) to 1 (certain); use the language of probability including likely, unlikely, certain, and impossible | `learn.html#chancescale` |
| `mt_FspV_imUGK` 比例关系的图像 | Represent proportional relationships using double number lines (two parallel number lines aligned at 0) and ratio tables; recognise that equivalent ratios generate straight lines through the origin when graphed | `learn.html#proportionGraph37` |
| `mt_XWSGuFW7It` 比的写法 | Use ratio notation to describe the relationship between two or more quantities, simplify ratios to their simplest form, and convert between ratio and fraction representations | `learn.html#ratioNotation37` |

频率估计不能保证每次增加试验次数都更接近理论概率；折线中间值是有条件估计；跨万位的千位运算需要换组。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：20 个节点在隔离浏览器 1440×900 和 1280×720 两个视口共 40 个场景通过；截图与结果在 `verification/concept-local-batch20g-20261103/`。定向测试 77 项通过；全量 Node 测试 1124/1132，8 项失败与原始基线一致。截图复看不等于用户视觉验收。
