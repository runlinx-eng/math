# 本地 11 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_K5jM7vlVhA` 12×12以内的乘法表 | Recall multiplication and division facts for multiplication tables up to 12 × 12 | `learn.html#tables12` |
| `mt_8A3pZNOp7Z` 乘除法口算 | Multiply and divide numbers mentally drawing upon known facts, including related facts and place-value adjustments | `learn.html#largerfacts` |
| `mt_A-FyLLLLzy` 图形规律 | Generate a number or shape pattern that follows a given rule; identify apparent features of the pattern not explicit in the rule and explain informally why they occur | `learn.html#shapeseq34` |
| `mt_MCu_SNg_OW` 简式除法与余数 | Divide numbers up to four digits by a one-digit number using short division (and place-value/array strategies); interpret remainders appropriately for the context | `learn.html#shortdivide` |
| `mt_gxCIASSezX` 平方数与立方数 | Recognise and use square numbers and cube numbers, and the notation for squared (²) and cubed (³) | `learn.html#squarecube` |
| `mt_ZOJ6EbdPOb` 理解分数 | Solve problems involving scaling by simple fractions and problems involving simple rates | `learn.html#recipeScale37` |
| `mt_8jFSnXxqQD` 算式中的括号 | Use parentheses, brackets, or braces in numerical expressions and evaluate expressions containing these grouping symbols | `learn.html#bracketlab` |
| `mt_SoDP1fSQEB` 小数乘整数 | Multiply one-digit numbers with up to two decimal places by whole numbers (e.g. 3.47 × 6) | `learn.html#decimalproduct` |
| `mt_FvEq4heNBx` 除数是两位数的除法 | Divide numbers up to 4 digits by a two-digit number using formal written short division where appropriate, interpreting remainders according to context | `learn.html#divide16` |
| `mt_lU-2aTRB9f` 商是小数的除法 | Use written division methods in cases where the answer has up to two decimal places; divide decimals to hundredths by whole numbers | `learn.html#decimaldivide` |
| `mt_WsM4EmdOLe` 有余数的除法 | Divide numbers up to 4 digits by a two-digit divisor using formal written long division, interpreting remainders as whole numbers, fractions, or by rounding as appropriate | `learn.html#longdivide` |

有限练习不证明全部乘法事实的流利度或真实心算；余数依题意解释。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 22 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
