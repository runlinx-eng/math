# 本地 7 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_NaqEP8xDhZ` 十分之几与百分之几 | Express a fraction with denominator 10 as an equivalent fraction with denominator 100 and use this to add fractions with denominators 10 and 100 (e.g. 3/10 + 4/100 = 34/100) | `learn.html#tenthtohundred` |
| `mt_Ii1hV4V5ql` 两位小数的近似数 | Round decimals with two decimal places to the nearest whole number and to one decimal place | `learn.html#roundtenths` |
| `mt_Vi4Vo5xs_g` 十分位与百分位 | Use decimal notation for fractions with denominators 10 or 100; read and write decimal numbers as fractions (e.g. 0.62 = 62/100, 0.71 = 71/100) | `learn.html#decimalnames` |
| `mt_sA2OvTiech` 三位小数 | Solve problems involving numbers with up to three decimal places | `learn.html#decimalmeasure3` |
| `mt_ebPelt-qAl` 等值分数 | Explain why a fraction a/b is equivalent to (n×a)/(n×b) using visual models; use this principle to recognise and generate equivalent fractions, including tenths and hundredths | `learn.html#samenames` |
| `mt_VgOePicFYK` 分数加法的意义 | Understand addition and subtraction of fractions as joining and separating parts; decompose a fraction into a sum of fractions with the same denominator in more than one way | `learn.html#splitfraction` |
| `mt_HJA2Oz-Zh1` 分数的意义 | Solve word problems involving multiplication of a fraction by a whole number using visual models and equations | `learn.html#manycopies` |

分数以相同整体为前提，格式位数与数值分开；实际物品操作与独立解释未自动评估。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 14 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
