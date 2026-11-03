# 本地 10 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_42QD6nYjiZ` 用点图表示测量数据 | Make a line plot to display measurement data in fractions of a unit (1/2, 1/4, 1/8); solve problems involving addition and subtraction of fractions using line plot data | `learn.html#eighthplot` |
| `mt_p6MhZJYYPN` 公制与英制换算 | Understand and use approximate equivalences between metric units and common imperial units (inches, pounds, pints) | `learn.html#imperialconversions` |
| `mt_n0AlyLQwC9` 组合图形的周长 | Measure and calculate the perimeter of composite rectilinear shapes in centimetres and metres | `learn.html#lperim` |
| `mt_2yas4Unc8o` 读时间：精确到分钟 | Solve problems involving converting between units of time (hours↔minutes, minutes↔seconds, years↔months, weeks↔days) | `learn.html#timeconvert` |
| `mt_IuHa5UI5od` 体积表示什么 | Recognise volume as an attribute of solid figures; understand that a unit cube (side length 1 unit) has 'one cubic unit' of volume and can be used to measure volume; a solid packed with n unit cubes has volume n cubic units | `learn.html#space` |
| `mt_2VpdPjvewx` 小数的数位与运用 | Convert among different-sized standard measurement units within a given system (e.g. 5 cm to 0.05 m) using decimal notation to up to three decimal places; convert between smaller and larger units of length, mass, volume, and time | `learn.html#decimalunits` |
| `mt_SqhXQhAEUf` 测量单位的转换 | Solve problems involving the calculation and conversion of units of measure, using decimal notation and multi-step reasoning in real-world contexts | `learn.html#unitstories` |
| `mt_3tPI0HqqcN` 英里与千米 | Convert between miles and kilometres using the approximate relationship (5 miles ≈ 8 km) | `learn.html#mileskm` |
| `mt_MJZA90uc6H` 周长 | Recognise that shapes with the same area can have different perimeters and vice versa; explore this relationship systematically | `learn.html#areaPerim` |
| `mt_5TBUFnCy5-` 体积可以相加 | Recognise volume as additive; find volumes of composite solid figures made of two or more non-overlapping right rectangular prisms | `learn.html#steps` |

不同币种保留题目原情境；时间记录区分时刻与时长，屏幕测量不证明真实工具使用。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 20 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
