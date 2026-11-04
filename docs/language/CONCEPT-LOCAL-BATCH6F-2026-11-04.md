# 本地 6 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_rCMdwG-YOE` 单位分数与整数相除 | Solve real-world problems involving division of unit fractions by whole numbers and whole numbers by unit fractions, using visual models and equations | `learn.html#fractiondividewords` |
| `mt_4Km38F4L-6` 分数的意义 | Interpret a fraction as division of the numerator by the denominator (a/b = a ÷ b); solve word problems involving division of whole numbers leading to fractional or mixed-number answers | `learn.html#sharewholes` |
| `mt_e7filQgayF` 分数应用题 | Solve word problems involving addition and subtraction of fractions with unlike denominators, using visual models and benchmark fractions to estimate and assess reasonableness | `learn.html#fractionsanity` |
| `mt_VKW8lOcFaw` 乘法与放大缩小 | Interpret multiplication as scaling (resizing): compare the size of a product to a factor based on the size of the other factor without computing; explain the effect of multiplying by fractions greater than, equal to, or less than 1 | `learn.html#scale` |
| `mt_AabJisinfi` 分数乘法 | Multiply a fraction or whole number by a fraction, including proper fractions by proper fractions; interpret (a/b) × q as a parts of q partitioned into b equal parts; write answers in simplest form | `learn.html#productfractions` |
| `mt_lvaSGHwvQ5` 生活中的分数乘法 | Solve real-world problems involving multiplication of fractions and mixed numbers, using visual fraction models or equations | `learn.html#fractionrecipe` |

分数以相同整体为前提，格式位数与数值分开；实际物品操作与独立解释未自动评估。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 12 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
