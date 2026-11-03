# 本地 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_oDU_8zMZjp` 加减法口算 | Mentally add and subtract a three-digit number and ones | `learn.html#oneslarge` |
| `mt_aHQ9kNt3is` 三位数加整十数 | Mentally add and subtract a three-digit number and tens | `learn.html#tenslarge` |
| `mt_3qrCtdoVAU` 简单公式 | Understand and use standard mathematical formulae; rearrange formulae to change the subject, performing inverse operations to isolate a different variable | `learn.html#rearrange36` |
| `mt_KhS7K1Mgrw` 展开两个括号的乘积 | Expand products of two or more binomials, e.g., (x + 3)(x - 2) = x² + x - 6, using the grid method or FOIL; simplify the result by collecting like terms | `learn.html#double35` |
| `mt_GZuoYaDdWd` 二次函数图像 | Recognise that quadratic functions produce curved (parabolic) graphs, distinguish them from linear graphs, and use plotted quadratic graphs to estimate values and find approximate solutions | `learn.html#quadratic36` |
| `mt_AYzE1EAvI0` 分数的意义 | Express whole numbers as fractions (e.g. 3 = 3/1) and recognise fractions equivalent to whole numbers (e.g. 4/4 = 1, 6/1 = 6) | `learn.html#wholefractions` |
| `mt_NoB20kVa4w` 数轴上的分数 | Represent fractions on a number line: partition the interval 0 to 1 into b equal parts to locate 1/b, then mark off a lengths of 1/b from 0 to locate a/b | `learn.html#fractionline` |
| `mt_doX1BhmFgk` 认识十分之一 | Count up and down in hundredths; recognise that hundredths arise when dividing an object by 100 or dividing tenths by 10 | `learn.html#hundredths` |
| `mt_933BohS9BH` 比较小数大小 | Compare two decimals to hundredths (or up to three decimal places) by reasoning about size using place-value understanding; record with >, =, < | `learn.html#raggeddecimals` |
| `mt_h0CVtqI2xo` 角的分类 | Identify acute and obtuse angles; compare and order angles up to two right angles by size | `learn.html#angletypes` |
| `mt_r8c43QB6wx` 按边的特征给图形分类 | Classify two-dimensional figures based on the presence or absence of parallel or perpendicular lines, or angles of a specified size; recognise right triangles as a category | `learn.html#lineproperties` |
| `mt_qUGMyMYn9m` 角度与旋转 | Know that angles are measured in degrees, where one degree is 1/360 of a full turn; understand that an angle turning through n one-degree angles has a measure of n degrees | `learn.html#degreeunit` |
| `mt_xWg0lI_gG4` 通过测量比较长度 | Measure to determine how much longer one object is than another, expressing the length difference in terms of a standard length unit | `learn.html#lengthdifference` |
| `mt_4emC463IyW` 比较经过的时间 | Compare durations of events and calculate the time taken by particular events or tasks | `learn.html#durationwork` |
| `mt_U4cIBXVug4` 用倍数比较 | Interpret a multiplication equation as a comparison (e.g. 35 = 5 × 7 means 35 is 5 times as many as 7); represent verbal statements of multiplicative comparisons as equations | `learn.html#timesmeaning` |
| `mt_LlMl2PbaZe` 乘法与除法 | Multiply and divide whole numbers and those involving decimals by 10, 100, and 1000 | `learn.html#shifttens` |
| `mt_y1XCVsIelg` 质数 | Know and use the vocabulary of prime numbers, prime factors, and composite numbers; establish whether a number up to 100 is prime; recall prime numbers up to 19 | `learn.html#primetest` |
| `mt_MewIRdzpzz` 100以内的罗马数字 | Read Roman numerals to 100 (I to C) and understand that the numeral system changed over time to include zero and place value | `learn.html#roman100` |
| `mt_NLSfvB9vUl` 取整十、整百、整千的近似数 | Round any number to the nearest 10, 100, or 1000 | `learn.html#roundwhole` |
| `mt_1KkvzwYxbR` 生活中的负数 | Interpret negative numbers in context (temperature, sea level, bank balance); count forwards and backwards with positive and negative whole numbers, including through zero | `learn.html#negativecontext` |

三位数加减整十跨百需换组；取整仅按活动中的非负数与中点约定；屏幕操作不证明独立心算或实体测量；图像读值是有限情境的估计。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：20 个节点在隔离浏览器 1440×900 和 1280×720 两个视口共 40 个场景通过；截图与结果在 `verification/concept-local-batch20j-20261103/`。定向测试 80 项通过；全量 Node 测试 1127/1135，8 项失败与原始基线一致。截图复看不等于用户视觉验收。
