# 本地 5 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_Yw1_4Nfsql` 熟练使用加减法 | Fluently add and subtract whole numbers with more than four digits using the standard columnar algorithm | `learn.html#columnlarge` |
| `mt_MWXPiaTnEu` 加减法口算 | Add and subtract numbers mentally with increasingly large numbers, using place-value knowledge and derived facts | `learn.html#mentalbig` |
| `mt_M1tnXqmYbn` 加法与减法 | Solve addition and subtraction multi-step problems in contexts, deciding which operations and methods to use and why, with numbers up to 10,000,000 and decimals | `learn.html#storymillion` |
| `mt_JH_6RpNWjr` 加减法的策略 | Add and subtract decimals to hundredths using strategies based on place value, properties of operations, and the relationship between addition and subtraction; relate strategies to written methods and explain reasoning | `learn.html#decimalsum` |
| `mt_9QzSnn8m80` 正数与负数 | Understand positive and negative numbers as describing quantities with opposite directions or values; use them in context such as temperature, floors in a building, and bank balances | `learn.html#signedwalk` |

加减模型的有限案例不等于全范围流利，也不评速度、真实心算或独立纸笔布局。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关专项测试 107 项通过；两种桌面尺寸共 10 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
