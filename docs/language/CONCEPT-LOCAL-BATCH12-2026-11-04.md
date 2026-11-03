# 本地 12 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt__we2TDqnJx` 熟练计算10以内加减 | Fluently add and subtract within 10 | `learn.html#factsten` |
| `mt_3e_PQxwC12` 熟练使用加减法 | Recall and use addition and subtraction facts to 20 fluently, and derive and use related facts up to 100 | `learn.html#scaleadd` |
| `mt_cChv2j_-Da` 熟练计算100以内加减 | Fluently add and subtract within 100 using strategies based on place value, properties of operations, and the relationship between addition and subtraction | `learn.html#flexhundred` |
| `mt__t4afSyZRm` 熟练计算20以内加减 | Fluently add and subtract within 20 using mental strategies; know from memory all sums of two one-digit numbers | `learn.html#factstwenty` |
| `mt_19j_5AuuQI` 数轴上的数 | Represent whole numbers as lengths on a number line and represent sums and differences within 100 on a number line diagram | `learn.html#linejumps` |
| `mt_yTWxkzzoOZ` 两步应用题 | Solve one- and two-step word problems within 100 using addition and subtraction, with unknowns in all positions | `learn.html#storytwo` |
| `mt_mpS-JK_p_m` 加法与减法 | Add and subtract numbers with up to four digits using formal written methods of columnar addition and subtraction | `learn.html#columnfour` |
| `mt_HFRYjTb-Z5` 熟练计算1000以内加减 | Fluently add and subtract within 1000 using strategies and algorithms based on place value, properties of operations, and the relationship between addition and subtraction | `learn.html#flexthousand` |
| `mt_CDa5AVakLE` 两步加减法问题 | Solve addition and subtraction two-step problems in contexts, deciding which operations and methods to use and why | `learn.html#plansteps` |
| `mt_anAe11HAEH` 两步方程 | Solve two-step word problems using the four operations; represent problems using equations with a letter standing for the unknown quantity | `learn.html#twostep35` |
| `mt_-F_Lv_apzH` 加法与减法 | Solve addition and subtraction multi-step problems in contexts, deciding which operations and methods to use and why | `learn.html#storylarger` |
| `mt_G3sVFQNCme` 用近似数检查答案 | Use rounding to check answers to calculations and determine appropriate levels of accuracy in context | `learn.html#checkpurpose` |

加减模型的有限案例不等于全范围流利，也不评速度、真实心算或独立纸笔布局。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关专项测试 107 项通过；两种桌面尺寸共 24 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
