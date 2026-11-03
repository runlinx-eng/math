# 本地第三组 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的描述、evidence、assessmentPrompt、来源年龄和真实关系，并核对 `vendor/os-taxonomy/data/teaching-research.json` 与 `docs/phase5/coverage.json` 的对应记录。原始研究可能由模型生成；研究标记不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_ghF3Vv6taM` 熟练计算5以内加减 | Fluently add and subtract within 5 | `learn.html#factsfive` |
| `mt_UQnAFPs83F` 两位数加两位数 | Add and subtract two two-digit numbers using concrete objects, pictorial representations, and mental methods | `learn.html#twodigitpair` |
| `mt_glPPG-kTQY` 100以内的加法 | Add within 100 using strategies based on place value, including adding a two-digit and one-digit number, and a two-digit and a multiple of 10 | `learn.html#addhundred` |
| `mt_PpWSHA-0kv` 加减法的策略 | Use counting on and counting back as strategies for addition and subtraction | `learn.html#countsteps` |
| `mt_HhuSDxwDNM` 乘法口诀与乘法表 | Recall and use multiplication and division facts for the 2, 5, and 10 multiplication tables | `learn.html#tables2510` |
| `mt_wQ89AEXhz3` 乘法口诀与乘法表 | Recall and use multiplication and division facts for the 3, 4, and 8 multiplication tables | `learn.html#tables348` |
| `mt_DyGBW3ZHh3` 笔算乘法与除法 | Write and calculate mathematical statements for multiplication and division using known tables, including two-digit × one-digit, using mental and progressing to formal written methods | `learn.html#writtenstart` |
| `mt_XV0B4kWwqL` 120以内数的读写 | Count to 120 starting at any number less than 120; read and write numerals to 120 | `learn.html#read120` |
| `mt_9L3NQqgqRd` 表示100以内的数 | Identify, represent and estimate numbers to 100 using different representations: place a two-digit number on a 0–100 number line marked in tens, represent it with base-ten blocks (tens and ones), drawings, bead strings or hundred squares, and estimate 'about how many' objects in a set before counting to check | `learn.html#faces100` |
| `mt_FbDKeLfBCo` 等值分数 | Recognise and show, using diagrams, equivalent fractions with small denominators | `learn.html#visualeq` |
| `mt_Kr3IyA6m-O` 数轴上的分数 | Recognise and use fractions as numbers: place unit fractions and non-unit fractions with small denominators on a number line | `learn.html#lineplaces` |
| `mt_a1FdAsRKOF` 简单的分数相加 | Add and subtract fractions with the same denominator within one whole (e.g. 5/7 + 1/7 = 6/7) | `learn.html#joinfractions` |
| `mt_Y9XKzLrUAZ` 转向与方向 | Describe movement and direction, including whole, half, quarter, and three-quarter turns | `learn.html#turnroute` |
| `mt_UooUHC_V7U` 立体图形的平面 | Identify 2-D shapes on the surface of 3-D shapes (e.g. a circle on a cylinder, a triangle on a pyramid) | `learn.html#solidfaces` |
| `mt_sBcRdUfAzV` 平面图形 | Identify and describe properties of 2-D shapes including the number of sides and line symmetry in a vertical line | `learn.html#sidesfold` |
| `mt_-P1kdZhHbL` 测量质量与重量 | Compare two objects directly by mass or weight and describe the difference using language such as heavy, light, heavier than, lighter than | `learn.html#compareweight` |
| `mt_4lp_b5Pzik` 容积与体积 | Measure and begin to record capacity and volume using non-standard and standard units | `learn.html#cupmeasure` |
| `mt_bj1YCgNWUx` 日、周、月与年 | Recognise and use language relating to dates, including days of the week, weeks, months, and years | `learn.html#weekmonth` |
| `mt_IzQvs7k_sE` 按4、8、50、100跳着数 | Count from 0 in multiples of 4, 8, 50, and 100 | `learn.html#skipfour` |
| `mt_7rJM8eWUfw` 六个六个地数 | Count in multiples of 6, 7, 9, 25, and 1000 | `learn.html#skipbig` |

注意：`mt_ghF3Vv6taM`、`mt_HhuSDxwDNM`、`mt_wQ89AEXhz3` 的有限操作与例子不评估全范围的快速回忆；`mt_Y9XKzLrUAZ` 的屏幕操作不代表实际身体转向；`mt_-P1kdZhHbL` 与 `mt_4lp_b5Pzik` 不评估真实手掂或倾倒。

屏幕活动不自动评估实体操作、口头表达、心算方式、手写或全部案例。AI 初核不等于独立数学教研；用户视觉验收及儿童理解和迁移测试尚未完成。

## 技术检查

知识点、覆盖与台账专项测试 34/34 通过；增加数学边界断言后，PR 活跃 Node 检查 71/71 通过。隔离 Chromium 检查 20 个节点、两个桌面视口，共 40 个场景通过；展开截图与结果在 `verification/concept-local-batch20c-20261103/`，不代表用户视觉验收。

全量 Node 检查 1118/1126，8 个失败项目与未修改基线复跑一致；phase2–5 覆盖生成器检查通过。内容规划生成器仍报告基线已有的过期文件；本提交尚未运行完整 GitHub CI。
