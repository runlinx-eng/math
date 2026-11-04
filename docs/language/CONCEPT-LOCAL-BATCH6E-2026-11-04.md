# 本地 6 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_14T5yPXUq_` 异分母分数相加 | Add and subtract fractions with unlike denominators (including mixed numbers) by replacing given fractions with equivalent fractions to produce a common denominator | `learn.html#unlikeparts` |
| `mt_gx6KQK5-Kx` 用分数计算面积 | Find the area of a rectangle with fractional side lengths by tiling with unit-fraction squares; show that the area equals the product of the side lengths | `learn.html#fractionarea` |
| `mt_PL9VkDwXfh` 比较分数大小 | Compare and order fractions including fractions greater than 1, by converting to common denominators or using benchmarks | `learn.html#beyondoneorder` |
| `mt_4K1dr204Hi` 小数与分数 | Associate a fraction with division and calculate decimal fraction equivalents for simple fractions (e.g. 3/8 = 0.375); recall and use equivalences between simple fractions, decimals, and percentages in different contexts | `learn.html#fdpswitch` |
| `mt_1PAWhRhpdg` 除以分数 | Interpret and compute division of a whole number by a unit fraction (e.g. 4 ÷ 1/5 = 20); use visual models and the relationship between multiplication and division to explain why the quotient is larger than the dividend | `learn.html#countsmallgroups` |
| `mt_ifPDOYvUqm` 单位分数的除法 | Interpret and compute division of a unit fraction by a non-zero whole number (e.g. 1/3 ÷ 4 = 1/12); use visual models and the relationship between multiplication and division to explain the result | `learn.html#sharesmallpart` |

分数以相同整体为前提，格式位数与数值分开；实际物品操作与独立解释未自动评估。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 12 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
