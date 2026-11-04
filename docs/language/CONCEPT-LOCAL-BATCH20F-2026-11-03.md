# 本地 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_wzAZ8qFDc4` 口算与笔算加减法 | Solve addition and subtraction problems using mental and written methods, including problems involving numbers, quantities, and measures | `learn.html#storymoney` |
| `mt_FX4a2Q8XXN` 展开单个括号 | Expand (multiply out) a single term over a bracket using the distributive property, e.g., 3(2x + 5) = 6x + 15; expand expressions involving negative multipliers | `learn.html#expand35` |
| `mt_fxPtngwUfz` 数的规律与关系 | Generate two numerical patterns using two given rules; identify relationships between corresponding terms; form ordered pairs and graph them on a coordinate plane | `learn.html#paired34` |
| `mt_ChjMU2GDJa` 条形统计图 | Interpret and present discrete and continuous data using appropriate graphical methods, including bar charts and time graphs | `learn.html#timeorcategory` |
| `mt_fmm-P17Vka` 统计分析的语言 | Read, write, and use the vocabulary of statistical analysis — mean, median, mode, range, frequency, data, sample, average, chart, table, graph, pie chart, scatter graph, correlation — with understanding of what each term describes | `learn.html#statwords` |
| `mt_Fl7b8q9pI1` 一位小数取整 | Round decimals with one decimal place to the nearest whole number | `learn.html#rounddecimal` |
| `mt_SsLWS_APM7` 比较分数大小 | Solve problems involving counting in tenths, fractions of quantities, equivalence, fraction addition/subtraction, and fraction comparison | `learn.html#fractionchoices` |
| `mt_TdV9YGJEoY` 位置、方向与移动 | Use mathematical vocabulary to describe position, direction, and movement, including straight lines and distinguishing rotation as a turn in terms of right angles (quarter, half, three-quarter turns, clockwise and anti-clockwise) | `learn.html#turnwalk` |
| `mt_zuOGOGFAKb` 按特征辨认和绘制图形 | Recognise and draw shapes having specified attributes (e.g. a given number of angles or equal faces); identify triangles, quadrilaterals, pentagons, hexagons, and cubes | `learn.html#shapesides` |
| `mt_zd0YkB3xNj` 测量质量与重量 | Measure and begin to record mass/weight using non-standard and standard units | `learn.html#weightstart` |
| `mt_cqSf213hSa` 测量长度 | Measure the length of an object using same-size length units laid end to end with no gaps or overlaps | `learn.html#sameunitlength` |
| `mt_AR-K72OIIO` 乘法与加法结合的问题 | Solve problems involving multiplying and adding, including using the distributive law, integer scaling problems, and harder correspondence problems | `learn.html#combineproducts` |
| `mt_w6MxaaoMXZ` 乘法表中的规律 | Identify arithmetic patterns (including patterns in the addition table or multiplication table) and explain them using properties of operations | `learn.html#tablepatterns` |
| `mt_98c2qwEF7Q` 千以内的数位 | Solve number problems and practical problems involving place value of numbers up to 1000 | `learn.html#problems1000` |
| `mt_J4j7d3iAfg` 简单随机实验 | Conduct simple probability experiments — flipping a coin, rolling a die, pulling coloured counters from a bag — record results, and compare experimental outcomes with expected theoretical outcomes | `learn.html#chance` |
| `mt_XfyqXLqzpx` 互补事件 | Understand and apply the rule that probabilities of all mutually exclusive outcomes sum to one; use this to find the probability of a complementary event (P(not A) = 1 − P(A)) | `learn.html#chancecomplement` |
| `mt_FnUJMXPUZX` 理解分数 | Solve problems involving unequal sharing and grouping using knowledge of fractions and multiples | `learn.html#ratioShare37` |
| `mt_ATYLKt0je-` 比例推理的语言 | Know and use advanced vocabulary of multiplicative reasoning — direct proportion, inverse proportion, ratio, rate, unit rate, compound unit, scale factor — accurately in problem-solving contexts | `learn.html#rateWords37` |
| `mt_HJTuIGHvcR` 减去整十数 | Subtract multiples of 10 (10–90) from multiples of 10 using place value strategies | `learn.html#decadetake` |
| `mt_R2ccrI-nKD` 100的倍数 | Understand that the multiples of 100 (100–900) each represent a number of hundreds with 0 tens and 0 ones | `learn.html#hundreds` |

小数取整仅采用本活动的非负中点取较大整数约定；随机试验结果不保证吻合理论预期；不完整外部条件下不推断图中间值为实测值。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：20 个节点在隔离浏览器 1440×900 和 1280×720 两个视口共 40 个场景通过；截图与结果在 `verification/concept-local-batch20f-20261103/`。定向测试 76 项通过；全量 Node 测试 1123/1131，8 项失败与原始基线一致。截图复看不等于用户视觉验收。
