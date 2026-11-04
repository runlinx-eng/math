# 本地 11 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_XLP1IM3Qbb` 乘法竖式 | Fluently multiply multi-digit whole numbers (up to 4 digits by 2 digits) using the formal written method of long multiplication | `learn.html#bigproduct` |
| `mt_vmW2cb5c7A` 口算策略 | Perform mental calculations including with mixed operations and large numbers, using strategies such as partitioning, compensation, and derived facts | `learn.html#mentalchoices` |
| `mt_wPgpMJ0-PA` 乘除10、100与1000 | Multiply and divide numbers by 10, 100, and 1000 giving answers up to three decimal places, understanding that digits shift position in the place-value chart | `learn.html#shiftfine` |
| `mt_RXnyhCRYXA` 多步问题：选择运算 | Solve problems involving addition, subtraction, multiplication, and division, deciding which operations and methods to use and why; solve multi-step problems in contexts | `learn.html#storyoperations` |
| `mt_jHgRQ4hR0g` 运算顺序 | Understand and apply the conventional order of operations (PEMDAS/BODMAS) to carry out calculations involving the four operations | `learn.html#orderlab` |
| `mt_QU5R7Aajy9` 给答案取近似值 | Solve problems which require answers to be rounded to specified degrees of accuracy | `learn.html#roundanswers` |
| `mt_4WaKWECpcv` 把数量关系写成算式 | Write simple numerical expressions that record calculations with numbers, and interpret numerical expressions without evaluating them (e.g. recognise that 3 × (18932 + 921) is three times as large as 18932 + 921) | `learn.html#expressions` |
| `mt_xhoOWnhtHq` 因数、倍数与质数 | Use the concepts and vocabulary of prime numbers, factors, multiples, common factors, common multiples, highest common factor (HCF), lowest common multiple (LCM), and prime factorisation including product notation and the unique factorisation property | `learn.html#primeforest` |
| `mt_X5cypSGoGU` 运算的先后顺序 | Use conventional notation for the priority of operations including brackets, powers, roots, and reciprocals; apply BIDMAS/BODMAS consistently to evaluate complex numerical expressions | `learn.html#powerorder` |
| `mt_rxInpOQ74w` 正负数相乘的符号 | Multiply and divide with positive and negative integers and rational numbers, understanding the rules for the sign of the product or quotient | `learn.html#signedproducts` |
| `mt_VUQNveSYjQ` 使用逆运算 | Recognise and use relationships between operations including inverse operations; use these relationships to check answers and simplify calculations | `learn.html#undocalc` |

有限练习不证明全部乘法事实的流利度或真实心算；余数依题意解释。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 22 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
