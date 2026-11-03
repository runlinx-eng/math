# 本地 6 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_o_p-3tCxiM` 带分数与假分数互化 | Recognise mixed numbers and improper fractions; convert from one form to the other (e.g. 2/5 + 4/5 = 6/5 = 1 1/5) | `learn.html#mixedrename` |
| `mt_TgHxujL81r` 分数乘法 | Understand a/b as a multiple of 1/b; multiply proper fractions and mixed numbers by whole numbers, supported by visual models (e.g. 3 × 2/5 = 6/5 = 1 1/5) | `learn.html#repeatfraction` |
| `mt_4ubP_RMg9o` 百分数与小数互化 | Solve problems requiring knowledge of percentage and decimal equivalents of 1/2, 1/4, 1/5, 2/5, 4/5 and fractions with denominators that are multiples of 10 or 25 | `learn.html#pctNames37` |
| `mt_kdWoAel3Zl` 认识十分之一 | Recognise and use thousandths; relate them to tenths, hundredths, and their decimal equivalents (e.g. 1/1000 = 0.001, 35/1000 = 0.035) | `learn.html#thousandparts` |
| `mt_09sySPqM9Z` 理解分数 | Understand a fraction a/b with a > 1 as a sum of fractions 1/b (e.g. 3/5 = 1/5 + 1/5 + 1/5) | `learn.html#unitcopies` |
| `mt_ZM9mhHsyYZ` 理解百分数 | Understand the per cent symbol (%); know that per cent means ‘number of parts per hundred’; write percentages as a fraction with denominator 100 and as a decimal | `learn.html#pctWhole37` |

分数以相同整体为前提，格式位数与数值分开；实际物品操作与独立解释未自动评估。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 12 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
