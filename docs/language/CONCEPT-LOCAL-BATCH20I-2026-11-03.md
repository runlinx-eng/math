# 本地 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_zxST3MarI9` 加减法的策略 | Explain why addition and subtraction strategies work, using place value and the properties of operations | `learn.html#showwhy` |
| `mt_ewmuMMPAzP` 1000以内的加减法 | Add and subtract within 1000 using concrete models, drawings, and strategies based on place value; understand composing and decomposing tens and hundreds | `learn.html#buildthousand` |
| `mt_i2F1nWxJjv` 数轴上的数 | Understand inequalities as statements comparing expressions, represent solutions on a number line, and solve simple linear inequalities using the same inverse-operation methods as equations | `learn.html#allowedrange` |
| `mt_WBdHkc2HTf` 一次函数图像 | Recognise that a linear function produces a straight-line graph, understand the relationship between an equation of the form y = mx + c and its graphical representation, and interpret gradient and y-intercept in context | `learn.html#linear36` |
| `mt_HRKzwEQJgO` 数列的第n项规律 | Find the nth-term expression for an arithmetic sequence by identifying the common difference and the zero-term, and use it to determine any term in the sequence or test whether a given number belongs to the sequence | `learn.html#nth35` |
| `mt_BdAeZJUOir` 散点图 | Plot bivariate data on a scatter graph with correctly labelled axes and appropriate scales; describe the correlation (positive, negative, none) and draw an estimated line of best fit where appropriate | `learn.html#scattercraft` |
| `mt_idbKDrf9qZ` 图形中的分数 | Partition shapes into parts with equal areas and express the area of each part as a unit fraction of the whole | `learn.html#areaparts` |
| `mt_ndGqFPWyen` 分数的意义 | Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts; understand a/b as a parts of size 1/b | `learn.html#share` |
| `mt_hRZyKvz1KN` 平面图形 | Identify lines of symmetry in 2-D shapes presented in different orientations; recognise line-symmetric figures and draw lines of symmetry | `learn.html#shapeaxes` |
| `mt_jBQS-CicNn` 第一象限的坐标 | Describe positions on a 2-D grid as coordinates in the first quadrant | `learn.html#pointread` |
| `mt_hR2Y7NhMSY` 对称轴 | Complete a simple symmetric figure with respect to a specific line of symmetry | `learn.html#mirrorfold` |
| `mt_DLcEzmmj2r` 加减法应用题 | Solve word problems involving lengths within 100, using addition and subtraction with drawings and equations | `learn.html#lengthstory` |
| `mt_4m8BimI4G5` 上午与下午的时间 | Tell and write times to five minutes on analogue and digital clocks with a.m. or p.m. (before or after midday), relating times to daily events and using the words morning, afternoon, evening, noon and midnight. Roman-numeral clock faces and the 24-hour clock are covered in Roman numeral and 24-hour clocks | `learn.html#ampmclock` |
| `mt_18fK9sQdIz` 笔算乘法 | Multiply two-digit and three-digit numbers by a one-digit number using formal written layout | `learn.html#shortproduct` |
| `mt_FHIAv6dfhU` 因数、倍数与质数 | Find all factor pairs for a whole number in the range 1–100; identify common factors and common multiples of two numbers; use these concepts to solve problems | `learn.html#factorlab` |
| `mt_lC_Q5mSL_I` 万以内的数 | Identify, represent, and estimate numbers up to 10,000 using different representations | `learn.html#fourfaces` |
| `mt_jY7uf0Cb7o` 每个数字的位值 | Recognise the place value of each digit in a four-digit number (thousands, hundreds, tens, and ones) | `learn.html#fourplaces` |
| `mt_-bMnJcPJy8` 实验结果与理论概率 | Run repeated probability experiments and compare experimental (relative frequency) results with theoretical predictions; understand and demonstrate that as the number of trials increases, the experimental probability tends towards the theoretical probability — and that short runs can give very different results | `learn.html#trialcompare` |
| `mt_iEXqN48w3x` 百分数的应用 | Solve problems involving percentage increase, percentage decrease, finding the original value after a percentage change, and calculating simple interest | `learn.html#pctChange37` |
| `mt_3y7xKP9MjU` 求一个数量的几分之几：进阶 | Solve problems involving increasingly harder fractions to calculate quantities, including non-unit fractions where the answer is a whole number | `learn.html#nonunitamount` |

概率试验属于独立重复的有限模拟，不证明每一步都接近理论值；线性函数图像的阅读不等于对关系的独立证明；单利情境不是现实金融建议。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：20 个节点在隔离浏览器 1440×900 和 1280×720 两个视口共 40 个场景通过；截图与结果在 `verification/concept-local-batch20i-20261103/`。定向测试 79 项通过；全量 Node 测试 1126/1134，8 项失败与原始基线一致。截图复看不等于用户视觉验收。
