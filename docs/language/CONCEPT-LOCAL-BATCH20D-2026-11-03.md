# 本地第四组 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的描述、evidence、assessmentPrompt 与真实关系，并核对 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json`。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_QCgbiVrwnp` 交换顺序来相加 | Understand and apply the commutative property of addition: addends can be added in any order | `learn.html#swapadd` |
| `mt_ezc2m_0dzN` 寻找加法中的未知数 | Understand subtraction as finding an unknown addend (e.g. 10 − 8 = ? is the same as 8 + ? = 10) | `learn.html#missing35` |
| `mt_YFS7JFk64p` 含两个未知数的等式 | Find pairs of numbers that satisfy an equation with two unknowns (e.g. find pairs (a, b) where a + b = 10 or 2a + b = 15) | `learn.html#twounknown35` |
| `mt_i9rJbuFO3p` 把问题写成方程 | Express missing number problems algebraically using letters for unknowns; translate word problems into equations | `learn.html#writing35` |
| `mt_c29FaCTNsx` 象形统计图与计数表 | Interpret and construct simple pictograms, tally charts, block diagrams, and simple tables | `learn.html#tally` |
| `mt_xppl18avyY` 按特征分类 | Classify objects into given categories, count the number in each category, and sort the categories by count | `learn.html#sortobjects` |
| `mt_Xp-rj46S2w` 把图形平均分 | Partition circles and rectangles into two, three, or four equal shares; describe shares as halves, thirds, and fourths; recognise that equal shares of identical wholes need not have the same shape | `learn.html#equalparts` |
| `mt_YzM5goBctT` 认识十分之一 | Count up and down in tenths; recognise that tenths arise from dividing an object into 10 equal parts and from dividing one-digit numbers or quantities by 10 | `learn.html#tenpieces` |
| `mt_QNxFnxikCN` 用立体图形搭建 | Compose three-dimensional shapes (cubes, right rectangular prisms, right circular cones, right circular cylinders) and create composite shapes; build new shapes from component shapes | `learn.html#solidstack` |
| `mt_bfhng6mOuy` 图形的关键特征 | Distinguish defining attributes of shapes (e.g. triangles are closed and three-sided) from non-defining attributes (e.g. colour, orientation, overall size) | `learn.html#shapeidentity` |
| `mt__N55B7u7HD` 时、分、秒 | Measure and begin to record time in hours, minutes, and seconds | `learn.html#durationunit` |
| `mt_0XxyaQLRhn` 认识整时与半时 | Tell and write the time to the hour and half past the hour on analogue clocks and digital displays (e.g. 3 o'clock = 3:00, half past 7 = 7:30), and draw clock hands to show these times, placing the hour hand halfway between two numbers for half past | `learn.html#hourclock` |
| `mt_GDG9_SZmsO` 把除法看成求未知因数 | Understand division as an unknown-factor problem (e.g. find 32 ÷ 8 by finding the number that makes 32 when multiplied by 8) | `learn.html#missingfactor` |
| `mt_nZkL5-XjRX` 因数对与交换律 | Recognise and use factor pairs and commutativity in mental calculations | `learn.html#factorpairs` |
| `mt_zfy1gOEewd` 10的倍数 | Understand that the multiples of 10 (10, 20, 30 … 90) represent one to nine tens and 0 ones | `learn.html#decades` |
| `mt_8gy7uxRlF6` 一百是十个十 | Understand that 100 can be thought of as a bundle of ten tens — called a 'hundred' | `learn.html#hundredexchange` |
| `mt_iFFKZd-Vgv` 描述可能性 | Use probability language to describe and compare the likelihood of everyday events using words such as certain, likely, even chance, unlikely, impossible | `learn.html#likelihood` |
| `mt_xSgAgg9Ej_` 等可能的结果 | Understand that 'equally likely' means every outcome has exactly the same chance of occurring; identify whether a given situation has equally likely outcomes (a fair coin, a fair die, a spinner with equal sections) or unequally likely outcomes (a bag with more of one colour, a spinner with unequal sections) | `learn.html#fairness` |
| `mt_h0gJcSuwdL` 比的应用题 | Solve problems involving the relative sizes of two quantities where missing values can be found by using integer multiplication and division facts | `learn.html#ratioProblem37` |
| `mt_2OtRUM_0zW` 比例尺与相似图形 | Solve problems involving similar shapes where the scale factor is known or can be found | `learn.html#similar37` |

屏幕模拟不能证明真实计时、实物搭建、自由手绘或独立口头解释；概率例子以明确抽取条件为前提，比例与相似形活动只覆盖给定案例。数学教研、用户视觉验收与儿童理解测试均尚未完成。

技术验证：针对本批 20 个节点，在隔离浏览器的 1440×900 和 1280×720 两个视口共检查 40 个场景，均通过；截图和结果见 `verification/concept-local-batch20d-20261103/`。语言与地图等定向测试通过；全量 Node 测试为 1119/1127，8 项失败与本地原始基线相同。Phase 2–5 覆盖生成器检查通过。截图复看不等于用户视觉验收。
