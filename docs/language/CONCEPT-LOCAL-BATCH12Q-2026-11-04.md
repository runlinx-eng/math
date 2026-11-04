# 本地 12 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_76SPWvdI7r` 100以内数的英文读法 | Read and write numbers to at least 100 in words | `learn.html#words100` |
| `mt_VFsuftfvYM` 1000以内数的读写 | Read and write numbers to 1000 in numerals, number names, and expanded form | `learn.html#words1000` |
| `mt_JwP9QFv6gQ` 数的读写 | Read, write, order, and compare whole numbers up to at least 1,000,000 using base-ten numerals, number names, expanded form, and place-value understanding | `learn.html#sixdigits` |
| `mt_QqG6IdmTSE` 相邻数位的10倍关系 | Recognise that in a multi-digit whole number, a digit in one place represents ten times what it represents in the place to its right (e.g. 700 ÷ 70 = 10) | `learn.html#tenpattern` |
| `mt_To9HdLy8vq` 1000以内的罗马数字 | Read Roman numerals to 1000 (M) and recognise years written in Roman numerals | `learn.html#romanyears` |
| `mt_5NwqN6pf_A` 大数的近似值 | Round any whole number up to 1,000,000 to the nearest 10, 100, 1,000, 10,000, or 100,000 using place-value understanding | `learn.html#roundlarge` |
| `mt_xMt1TLTs--` 使用大数 | Solve number and practical problems involving reading, writing, ordering, comparing, and rounding whole numbers up to 1,000,000 | `learn.html#bigproblems` |
| `mt__casygEB85` 小数的近似数 | Round decimals to any place using place-value understanding; round any whole number to a required degree of accuracy | `learn.html#roundprecise` |
| `mt_RVK655t391` 测量温度 | Use negative numbers in context (temperature, finance, sea level); calculate intervals across zero | `learn.html#temperaturechange` |
| `mt_XNmGwNggdU` 千万以内的数 | Solve number and practical problems involving reading, writing, ordering, comparing, rounding, and negative numbers up to 10,000,000 | `learn.html#tenmillion` |
| `mt_HLUqHJ9Y7n` 10的幂与数位规律 | Explain patterns in zeros when multiplying by powers of 10 and in decimal-point placement when multiplying/dividing by a power of 10; use whole-number exponents to denote powers of 10 (e.g. 10³ = 1000) | `learn.html#powerpattern` |
| `mt_EDgw64OmfA` 数位之间乘10与除以10 | Recognise that in a multi-digit number, a digit in one place represents 10 times as much as in the place to its right and 1/10 of what it represents in the place to its left | `learn.html#decimalscale` |

中文数名是本地适配，英文读写、口头朗读及真实测量不由这些屏幕任务自动评估。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 24 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
