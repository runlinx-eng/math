# 本地 20 节点解释批次

2026-11-03。逐项按 ID 对照 `dist/data/math.json` 的 description、evidence、assessmentPrompt、年龄范围及原始关系，并核对 `vendor/os-taxonomy/data/teaching-research.json` 对应记录与 `docs/phase5/coverage.json` 的活动映射。研究记录可能由模型生成，`hasResearch=true` 不代表独立教研通过；年龄不决定学习路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_yJmvUCCym7` 加减法应用题 | Solve addition and subtraction word problems within 10 using objects or drawings | `learn.html#smallstories` |
| `mt_e8CZ7E5qW7` 9以内数的分与合 | Find the number that makes 10 when added to a given number from 1 to 9 (number bonds to 10) | `learn.html#partnersten` |
| `mt_zuKAX6lcYR` 拿走与分开：减法的意义 | Understand subtraction as taking away or separating from a group to find how many remain | `learn.html#takethings` |
| `mt_mr_Vk7FGzK` 加法与减法 | Add and subtract one-digit and two-digit numbers to 20, including zero | `learn.html#basicadd` |
| `mt_VAWV_l7J0D` 从生活故事列算式 | Solve one-step word problems involving addition and subtraction to 20, including missing-number problems | `learn.html#earlyunknown` |
| `mt_wh3UqnWsa7` 乘法是相同加数的和 | Solve problems involving multiplication and division using arrays, repeated addition, mental methods, and known facts | `learn.html#bagstories` |
| `mt_0u4KLbvBa1` 奇数与偶数 | Recognise odd and even numbers | `learn.html#evenhalves` |
| `mt_zOWwLxa77y` 认识乘号、除号与等号 | Read, write, and interpret the symbols ×, ÷, and = in multiplication and division number sentences | `learn.html#mulsymbols` |
| `mt_B1zj1RwQ3a` 用排列方阵表示乘法 | Use addition to find the total number of objects arranged in rectangular arrays with up to 5 rows and 5 columns; write an equation to express the total as a sum of equal addends | `learn.html#rowsums` |
| `mt_nvdpxAJTBG` 两个两个地数 | Count in multiples of 2, 5, and 10 (skip counting) | `learn.html#skipbasic` |
| `mt_yqAL6O5i_v` 数20以内的物品 | Count a set of objects to answer 'how many?' for sets up to 20 (arranged in lines, arrays, circles, or scattered) | `learn.html#counttwenty` |
| `mt__YRJ23GuIK` 比较1到10的数字 | Compare two written numerals between 1 and 10 to determine which is greater or less | `learn.html#digitcompare` |
| `mt_x8TshvbbQT` 100以内数的读写 | Read and write numerals from 0 to 100 | `learn.html#write100` |
| `mt_kw7xmp68rU` 多10或少10 | Mentally find 10 more or 10 less than a given two-digit number without counting | `learn.html#shift10` |
| `mt_r0VXbfAmsH` 一个十是十个一 | Understand that 10 can be thought of as a bundle of ten ones — called a 'ten' | `learn.html#tenexchange` |
| `mt_mnEVZNkX3p` 平面图形与立体图形 | Distinguish two-dimensional (flat) shapes from three-dimensional (solid) shapes | `learn.html#flatvsolid` |
| `mt_WXW0hjNhph` 图案与排列规律 | Order and arrange combinations of mathematical objects in patterns and sequences | `learn.html#repeat34` |
| `mt_g3W0mdADVu` 寻找二分之一与四分之一 | Recognise, find, and name a quarter as one of four equal parts of an object, shape, or quantity | `learn.html#quarterpaper` |
| `mt_hyvHv2BCwb` 把图形分得更细 | Understand that decomposing a shape into more equal shares creates smaller shares | `learn.html#smallershare` |
| `mt_TcG90kS8nu` 比较时长 | Use comparative language for time: quicker, slower, earlier, later | `learn.html#timecompare` |

`mt_e8CZ7E5qW7` 的原标题与描述不一致：解释依据来源实际目标“凑10”，保留原 ID 和名称。`mt_nvdpxAJTBG` 除标题所示的2，还覆盖来源目标中的5和10。英语朗读、实物动作、口头流利度、心算方式及手写清晰度均不由这些解释或屏幕任务自动评估。

补充范围与限制：`mt_WXW0hjNhph` 的解释集中于重复图案，来源与活动还涉及增长序列，这部分不应被视为已由解释覆盖；`mt_wh3UqnWsa7` 的解释示范阵列、重复加法和平均分，不评估实际心算或事实提取；`mt_zOWwLxa77y` 以中文解释符号，来源英文口头朗读未评估；`mt_kw7xmp68rU` 演示十位变化，不评估是否真正进行心算；`mt_x8TshvbbQT` 的听写与 `mt_fR0UtsSREU` 一样，真实口头和手写表现仍需观察。

每条解释由 AI 编辑初核，独立数学教研、用户视觉验收与真实儿童理解及迁移测试均未完成；未修改来源节点、关系、坐标和学习记录。

## 技术检查

- 知识点、覆盖和台账专项检查 32/32 通过；增加本批数学边界回归后，PR 活跃 Node 检查 69/69 通过。
- 隔离 Chromium 检查 20 个节点、两种桌面视口，共 40 个场景通过；每个场景的展开截图和结果见 `verification/concept-local-batch20-20261103/`。截图自动检查与抽看不代表用户视觉验收。
- 全量 Node 检查 1116/1124，通过数之外的 8 个失败项目与未修改基线复跑一致；phase2–5 覆盖生成器检查通过。内容规划生成器仍报告基线已有的过期文件。完整 GitHub CI 尚未在本次提交运行。
