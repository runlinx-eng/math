# 本地 14 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_cPZwlUk8Nd` 硬币的面值 | Recognise and know the value of different coins and notes | `learn.html#coinvalues` |
| `mt_pbuhUQJjtt` 英镑与便士的写法 | Recognise and use symbols for pounds (£) and pence (p) and combine amounts to make a particular value | `learn.html#poundnotation` |
| `mt_6_O6THdEDK` 找零钱 | Add and subtract amounts of money to give change, using both £ and p in practical contexts | `learn.html#poundchange` |
| `mt_wE7-Gs9ENL` 测量周长 | Measure the perimeter of simple 2-D shapes | `learn.html#walkperim` |
| `mt_mayItsxMUu` 测量并记录长度 | Generate measurement data by measuring lengths to the nearest whole unit and display the data on a line plot | `learn.html#measureplot` |
| `mt_jHv4BgRK8B` 使用不同单位测量 | Measure the length of an object using two different length units and describe how the measurements relate to the size of the unit chosen | `learn.html#twounits` |
| `mt_3tz3Otap5j` 购物应用题 | Solve word problems involving dollar bills, quarters, dimes, nickels, and pennies, using $ and ¢ symbols appropriately | `learn.html#usmoney` |
| `mt_UNzojLkNdm` 读出最接近的分钟 | Tell, write and estimate the time to the nearest minute on analogue and digital clocks, using vocabulary such as o'clock, a.m./p.m., morning, afternoon, noon and midnight; record and compare times and durations in seconds, minutes and hours | `learn.html#minuteclock` |
| `mt_EXlmTURK_o` 时间单位与日历 | Know the number of seconds in a minute and the number of days in each month, year, and leap year | `learn.html#calendarfacts` |
| `mt_WfrE_4r-kY` 12时制与24时制 | Read, write, and convert time between analogue and digital 12-hour and 24-hour clocks | `learn.html#clockconvert` |
| `mt_y1n0Zwhoca` 认识面积 | Measure areas by counting unit squares (square cm, square m, square in, square ft) | `learn.html#area` |
| `mt_Jvvh5P06NV` 铺满方格来求面积 | Find the area of a rectangle by tiling it with unit squares and show that the result equals the product of the side lengths | `learn.html#tiling` |
| `mt_eMtV6tBSJm` 组合图形的面积 | Recognise area as additive; find areas of rectilinear figures by decomposing into non-overlapping rectangles and summing their areas | `learn.html#rectsplit` |
| `mt_GzcJEVkNRn` 用乘法求长方形面积 | Multiply side lengths to find areas of rectangles and represent whole-number products as rectangular areas | `learn.html#rectangle` |

不同币种保留题目原情境；时间记录区分时刻与时长，屏幕测量不证明真实工具使用。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 28 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
