# 本地 10 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_d8al9JcajP` 测量单位换算 | Convert between different units of measure (e.g. kilometre to metre, hour to minute, minute to second, year to month, week to day) | `learn.html#baseconversions` |
| `mt_IL86kadLSS` 经过时间的问题 | Solve word problems involving elapsed time by adding and subtracting time intervals in minutes, including using a number line | `learn.html#elapsedtime` |
| `mt_mFJ-2ZF6Tk` 估算与比较金额 | Estimate, compare, and calculate different measures including money in pounds and pence | `learn.html#measuremoney` |
| `mt_ghK1mnEstc` 一半与四分之一 | Generate measurement data by measuring lengths to the nearest half and quarter inch; display the data on a line plot with a scale marked in whole numbers, halves, and quarters | `learn.html#quarterplot` |
| `mt_-af65bxfdp` 测量液体与质量 | Measure and estimate liquid volumes and masses of objects using grams, kilograms, and litres; solve one-step word problems involving mass or volume | `learn.html#measureliquid` |
| `mt_WtcFrxGOgw` 多边形的周长 | Solve problems involving perimeters of polygons: find perimeter from side lengths, find an unknown side length, and explore rectangles with same perimeter but different areas (or vice versa) | `learn.html#polyperim` |
| `mt_eiB3-6pu6a` 长方形的面积与周长 | Apply the area formula (l × w) and perimeter formula (2l + 2w) for rectangles including squares in real-world and mathematical problems; calculate and compare areas using standard units (cm², m²) and estimate areas of irregular shapes | `learn.html#boundary` |
| `mt_Zks8xyInSG` 测量单位换算 | Know relative sizes of measurement units within one system (km/m/cm/mm, kg/g, l/ml, hr/min/sec); convert between different metric units and express measurements in terms of a smaller unit; record equivalents in conversion tables | `learn.html#metricconversions` |
| `mt_d7XktBQPxm` 数单位立方体 | Measure and estimate the volume of solids by counting unit cubes: build cuboids from 1 cm³ cubes and count them, count the cubes in models and drawings (including hidden cubes), estimate how many cubes will fill a box and check by filling it, and record volumes in cubic units (cm³, in³, ft³ or improvised units) | `learn.html#hidden` |
| `mt_5HV4mbgSGH` 数轴上的分数 | Solve word problems involving distances, time intervals, liquid volumes, masses, and money using the four operations with fractions or decimals; represent with diagrams including number lines | `learn.html#practicalmeasure` |

不同币种保留题目原情境；时间记录区分时刻与时长，屏幕测量不证明真实工具使用。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 20 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
