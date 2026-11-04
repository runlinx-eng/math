# 本地 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_SrrsLiJkr3` 加法与减法 | Add and subtract numbers with up to three digits using formal written methods of columnar addition and subtraction | `learn.html#columnthree` |
| `mt_TiQbi027PE` 数的相加 | Add up to four two-digit numbers using strategies based on place value and properties of operations | `learn.html#fourparts` |
| `mt_vHzVa3SURC` 把数代入公式 | Substitute numerical values into formulae and expressions including scientific formulae; evaluate expressions by replacing variables with given values and computing the result using correct order of operations | `learn.html#substitute36` |
| `mt_uESbzWCZIq` 因式分解 | Factorise algebraic expressions by taking out common factors — identify the highest common factor of all terms and write the expression as a product, e.g., 6x + 9 = 3(2x + 3) | `learn.html#factor35` |
| `mt_IHipFGTFEY` 带分数刻度的点图 | Make a line plot to display a data set of measurements in fractions of a unit (1/2, 1/4, 1/8); use operations on fractions to solve problems involving data in line plots (e.g. redistribute total equally) | `learn.html#fractiondots` |
| `mt_bESTSBB0wK` 扇形统计图 | Interpret and construct pie charts: calculate sector angles from data, draw sectors accurately, and read values from pie charts to solve problems | `learn.html#piepieces` |
| `mt_kDMKJ5Ztt6` 除以10和100 | Find the effect of dividing a one- or two-digit number by 10 and 100, identifying the value of the digits as ones, tenths, and hundredths | `learn.html#dividebyten` |
| `mt_DRlbMok2lT` 分数与小数的等值关系 | Recognise and write decimal equivalents of 1/4, 1/2, and 3/4 | `learn.html#quarters` |
| `mt_Xt1cRqaBOW` 四边形分类 | Understand that shapes in different categories may share attributes defining a larger category; classify quadrilaterals (rhombuses, rectangles, squares) and draw examples of quadrilaterals not in those subcategories | `learn.html#quadsort` |
| `mt_Uq5vYqboCR` 描述物体的移动 | Describe movements between positions as translations of a given unit to the left/right and up/down | `learn.html#pointmove` |
| `mt_6XCURuNwPw` 排列时间间隔 | Compare and sequence intervals of time | `learn.html#durationorder` |
| `mt_HNOPGJYiRK` 读时间：精确到5分钟 | Tell and write the time to five minutes on analogue clocks, including quarter past and quarter to the hour, write these times in digital form, and draw clock hands to show them | `learn.html#fiveclock` |
| `mt_iNdrM2-oJf` 除法的意义 | Interpret whole-number quotients (e.g. 56 ÷ 8 as the number of objects in each share or the number of equal groups) | `learn.html#divisionmeaning` |
| `mt_gtTl3R5buH` 乘法的意义 | Interpret products of whole numbers (e.g. 5 × 7 as the total number of objects in 5 groups of 7) | `learn.html#productmeaning` |
| `mt_MHaiUd2FLA` 比较大数 | Order and compare numbers beyond 1000 | `learn.html#bigcompare` |
| `mt_9IzhGUZ30z` 20以内数的英文读法 | Read and write number words from one to twenty | `learn.html#numberwords` |
| `mt_1YwOCMMwD8` 集合与韦恩图 | Enumerate sets and their unions and intersections systematically using tables, grids, and Venn diagrams to organise and count outcomes | `learn.html#chancesets` |
| `mt_GDtFU5fyUv` 树状图 | Generate theoretical sample spaces for single and combined events using listing, tables, and tree diagrams, and calculate theoretical probabilities as the number of favourable outcomes divided by the total number of equally likely outcomes | `learn.html#chancetree` |
| `mt_tpT9brpI6D` 单位换算 | Convert freely between related standard units of measurement (time, length, area, volume/capacity, mass) using decimal notation to up to three decimal places where appropriate | `learn.html#convertUnits37` |
| `mt_5mIcmKRCgA` 正比例与比例关系 | Recognise and solve problems involving direct proportion (as one quantity increases, the other increases at a constant rate) and inverse proportion (as one increases, the other decreases), including graphical and algebraic representations | `learn.html#proportion37` |

数词节点使用中文适配，来源英语数词的读写未评估；点图英寸数据以厘米改编；树状图需要保留不放回条件，单位换算区分面积与长度。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：20 个节点在隔离浏览器 1440×900 和 1280×720 两个视口共 40 个场景通过；截图与结果在 `verification/concept-local-batch20h-20261103/`。定向测试 78 项通过；全量 Node 测试 1125/1133，8 项失败与原始基线一致。截图复看不等于用户视觉验收。

数词节点的标题提到英文，而活动只覆盖中文。初次视觉检查后已将这一差异放入默认可见的定义，并在两种视口重新检查；替换了对应截图，复查结果见 `recheck-number-words.json`。
