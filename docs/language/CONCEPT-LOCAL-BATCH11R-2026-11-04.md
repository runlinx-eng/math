# 本地 11 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_Ac7oMWhyPw` 数的读写 | Read, write, and compare decimals to thousandths using base-ten numerals, number names, and expanded form; compare using >, =, < based on place-value meaning | `learn.html#decimalwords` |
| `mt_Gag_h98jWP` 千万以内数的读写 | Read, write, order, and compare numbers up to 10,000,000 and determine the value of each digit | `learn.html#millionwords` |
| `mt_lNGpnILM5C` 读懂小数的数位 | Identify the value of each digit in numbers given to three decimal places (e.g. in 4.378, the 7 represents 7 hundredths) | `learn.html#decimalplaces` |
| `mt_RWUY7_IXvw` 用距离理解绝对值 | Understand the absolute value of a rational number as its distance from zero on the number line; interpret absolute value as magnitude in real-world contexts; distinguish absolute value comparisons from ordering statements | `learn.html#distancezero` |
| `mt_U9sme87C32` 小数的数位与运用 | Round numbers and measures to an appropriate degree of accuracy including to a specified number of decimal places or significant figures | `learn.html#accuracy` |
| `mt_PsylzZ9lHW` 数轴上的分数 | Understand and use place value for decimals, measures, and integers of any size; extend the number system to include all positive and negative integers, decimals, and fractions on a single number line | `learn.html#mixedpoints` |
| `mt_uDJY0X0hgo` 数轴上的分数 | Order positive and negative integers, decimals, and fractions on a number line; use the symbols =, ≠, <, >, ≤, ≥ to compare values including negative numbers and mixed representations | `learn.html#orderforms` |
| `mt_hCVPYlF-7Y` 平方数与立方数 | Use integer powers and associated real roots (square, cube, and higher); recognise powers of 2, 3, 4, and 5; distinguish between exact representations of roots and their decimal approximations | `learn.html#powerblocks` |
| `mt_VVn1IXjkzn` 用四舍五入估算 | Use approximation through rounding to estimate answers and calculate possible resulting errors expressed using inequality notation a < x ≤ b; understand upper and lower bounds of rounded values | `learn.html#estbounds` |
| `mt_bO-njVOige` 10的幂的写法 | Interpret and compare numbers in standard form A × 10ⁿ where 1 ≤ A < 10 and n is an integer; convert between ordinary numbers and standard form | `learn.html#standardform` |
| `mt_b4lbTOJYwI` 数集与无穷 | Appreciate the infinite nature of the sets of integers, real numbers, and rational numbers; position integers on a number line and distinguish between rational and irrational numbers | `learn.html#numberworld` |

中文数名是本地适配，英文读写、口头朗读及真实测量不由这些屏幕任务自动评估。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 22 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。phase 2–5 覆盖生成检查通过；`build_content_plan.py --check` 报告三个既有内容规划生成文件过期。独立数学复核、用户视觉验收及儿童理解测试未完成。
