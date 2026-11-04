# 本地 5 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_b7T-CjOYUR` 约分 | Use common factors to simplify fractions to their simplest form; use common multiples to express fractions with a common denominator | `learn.html#simplestparts` |
| `mt_SBkTGjiZjZ` 小数与分数 | Work interchangeably with terminating decimals and their corresponding fractions (such as 3.5 and 7/2 or 0.375 and 3/8); convert fluently between the two forms | `learn.html#decimalstops` |
| `mt_9Y96vxG_LH` 分数除法 | Divide a fraction by a fraction using the 'keep-change-flip' method and visual models; interpret and solve word problems involving division of fractions by fractions | `learn.html#fractionquotient` |
| `mt_gNUE4B3vuk` 带分数与假分数 | Use the four operations with formal written methods applied to integers, decimals, proper and improper fractions, and mixed numbers, all both positive and negative | `learn.html#fractionfour` |
| `mt_J339bO7qLe` 分数乘法 | Interpret fractions and percentages as operators — find a fraction or percentage of an amount by multiplying, understanding that 'of' means multiply (e.g., 3/4 of 200 = 3/4 × 200 = 150) | `learn.html#portionoperator` |

分数以相同整体为前提，格式位数与数值分开；实际物品操作与独立解释未自动评估。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 10 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
