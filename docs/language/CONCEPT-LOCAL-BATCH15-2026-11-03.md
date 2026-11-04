# 本地 15 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_T76hKqXf0z` 把数凑成一组再相加 | Understand and apply the associative property of addition: when adding three numbers, any two can be added first | `learn.html#regroupadd` |
| `mt_hBZwbst0ow` 等差数列 | Generate and describe linear number sequences, including those with negative and decimal steps; identify the term-to-term rule | `learn.html#linear34` |
| `mt_gu0NPDvlhY` 有序地列出所有可能 | Enumerate possibilities of combinations of two variables systematically (e.g. all ways to choose from a set of options) | `learn.html#pairs34` |
| `mt_VhBH8wrFC6` 象形图与条形图 | Draw a picture graph and a bar graph (with single-unit scale) to represent a data set with up to four categories; solve put-together, take-apart, and compare problems using information presented in a bar graph | `learn.html#bars` |
| `mt_1VSfm9yiLn` 按特征分类 | Interpret categorical data by asking and answering questions about totals, how many in each category, and how many more or less one category has than another | `learn.html#categoryuse` |
| `mt_k2WE0-22-4` 单位分数 | Recognise, find, and write fractions of a discrete set of objects: unit fractions and non-unit fractions with small denominators | `learn.html#unitsets` |
| `mt_CBHwluE6Lp` 同分母分数相加 | Add and subtract fractions with the same denominator, including results greater than one whole (e.g. 5/8 + 6/8 = 11/8) | `learn.html#fractioncarry` |
| `mt_MqqR7VUoz1` 拼成新的图形 | Compose two-dimensional shapes (rectangles, squares, trapezoids, triangles, half-circles, quarter-circles) to create composite shapes, and compose new shapes from the composite shape | `learn.html#shapemerge` |
| `mt_Mnodea7mG_` 棱、顶点与面 | Identify and describe properties of 3-D shapes including the number of edges, vertices, and faces | `learn.html#solids` |
| `mt_AF2BeFQwfX` 计算总价与找零 | Find different combinations of coins that equal the same amount of money | `learn.html#coincombo` |
| `mt_WX30dzi4dt` 熟练使用乘除法事实 | Fluently multiply and divide within 100 using strategies such as the relationship between multiplication and division | `learn.html#mixedfacts` |
| `mt_pjfmCMMPjO` 乘除法口算 | Use place value, known and derived facts to multiply and divide mentally, including multiplying by 0 and 1, dividing by 1, and multiplying together three numbers | `learn.html#mentalproducts` |
| `mt_izien3ZX51` 多或少10、100 | Find 10 or 100 more or less than a given number up to 1000 | `learn.html#shift100` |
| `mt_-c4Ca_nBzX` 用分数表示概率 | Describe the probability of simple equally-likely outcomes using unit fractions: the probability of rolling a 6 on a fair die is 1/6, flipping heads is 1/2, picking one specific colour from three equally represented colours is 1/3; place these fractional probabilities on a 0-to-1 probability scale | `learn.html#chancefraction` |
| `mt_nOCPx5qw0Z` 按比分配 | Divide a given quantity into two parts in a given part:part or part:whole ratio, and express the division as a fraction of the whole | `learn.html#ratioDivide37` |

`mt_WX30dzi4dt` 的有限样例不衡量速度或事实流利度；`mt_pjfmCMMPjO` 的屏幕操作不证明真实心算；`mt_AF2BeFQwfX` 使用来源与活动中的英镑便士情境，不表示已覆盖其他币制。多面体的面、棱、顶点术语与曲面立体的计数约定需区别。其他屏幕构造不等于实体操作、自由绘图或独立解释。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：15 个节点在隔离浏览器 1440×900 和 1280×720 两个视口共 30 个场景通过；截图与结果在 `verification/concept-local-batch15-20261103/`。定向测试 74 项通过；全量 Node 测试 1121/1129，8 项失败与原始基线一致。截图复看不等于用户视觉验收。
