# 数学思维节点的来源映射

2026-11-01：从固定上游快照核对，50 个 Mathematical Thinking 节点中，48 个明确带有八个数学实践代码，两个没有这些代码。每个代码当前恰好对应六个源节点，且这六个节点之间有五条来源 hard 关系；这描述的是数据，不规定孩子的学习次序或能力等级。

每行顺序由现有源边得到，供核对，不作为任务入口或完成条件。显示名为本地适配；源名称、目标和活动入口见 [thinking-source-map.json](thinking-source-map.json)。

| 来源代码 | 本地理解 | 六个来源节点（ID） |
| --- | --- | --- |
| ccss-math:MP.1 | 理解和解决问题 | 读懂问题（`mt_WkKkb7W9Qd`） → 分步骤解决问题（`mt_O_UOTiMvT_`） → 解决多步问题 · 拆分问题与检查（`mt_RKeheOL9uo`） → 解决多步问题 · 四则、分数与面积体积（`mt_SmghasIvbT`） → 复杂的多步问题（`mt_GpltXPoaoc`） → 进阶多步问题（`mt_FieL-vVTI_`） |
| ccss-math:MP.2 | 抽象与数量推理 | 从生活走向数学（`mt_IM1G_7QzTa`） → 连接不同表示方式（`mt_EBYGhd8X3x`） → 理解分数 · 情境、图形与算式（`mt_dXq9VWm31W`） → 数轴上的分数 · 数轴、情境与算式（`mt_3VmBdlAeOZ`） → 数轴上的分数 · 连接小数与百分数（`mt_CUmjcE7W6c`） → 理解分数 · 多种表示之间的联系（`mt_9KmVWCuh5_`） |
| ccss-math:MP.3 | 论证与质疑 | 展示解题过程（`mt_nyK25mNOeR`） → 讲清数学推理（`mt_kJ5wYzO8qC`） → 说明推理的依据 · 跟随推理并找错（`mt_pyMD_SIiYO`） → 说明推理的依据 · 呈现推理并评价（`mt_a3dov8CZkq`） → 理解分数 · 多步论证与检错（`mt_2ESZh70NyS`） → 构建数学论证（`mt_j5YqQnN6xe`） |
| ccss-math:MP.4 | 数学建模 | 用实物表示真实问题（`mt_fLOkq-HfPB`） → 把数学与生活联系起来（`mt_f67qGDhyfi`） → 用数学表示测量、钱和时间（`mt_iQYPw8bMfN`） → 用乘法与分数建立模型（`mt_K3R0yaHVcx`） → 生活中的数学建模（`mt_8xVHooT4aI`） → 为生活问题建立数学模型（`mt_yqZiX6vS7D`） |
| ccss-math:MP.5 | 策略性使用工具 | 动手解决问题（`mt_20WfHhnL39`） → 数轴上的数 · 选择数轴等工具（`mt_zMEvtigoM3`） → 选择解题策略（`mt_mQcWGh02no`） → 选择合适的数学工具（`mt_d-WZC2OyMB`） → 选择合适的表示方式（`mt_IwEOCN6bL1`） → 选择数学工具（`mt_ZJC7JnnPCu`） |
| ccss-math:MP.6 | 准确表达 | 基础数学词汇（`mt_lMz9nAs7VO`） → 清楚准确地交流数学（`mt_TMoHjMhRS2`） → 理解分数 · 准确使用词语与符号（`mt_HY8Yycu_rz`） → 准确地表达数学（`mt_mywsN77hGZ`） → 准确使用数学词汇（`mt_xfwv0M83mJ`） → 进阶数学词汇（`mt_3rTIyJDw7-`） |
| ccss-math:MP.7 | 发现与利用结构 | 发现数学规律（`mt_uG2mjHFOlO`） → 图形规律 · 运算、数位与图形结构（`mt_DW2D1c0fKx`） → 图形规律 · 三位数、乘除与图形（`mt_FAXjFkgG6X`） → 运用数学结构（`mt__Itf4aQZUj`） → 运算、分数与图形的结构（`mt_hlGKg5M7qJ`） → 运算顺序 · 发现运算与图形结构（`mt_hImiKNiaNh`） |
| ccss-math:MP.8 | 从重复推理中发现规律 | 寻找更高效的方法（`mt_RFeVlw0QvX`） → 从规律中概括结论（`mt_fZTn0W_iZR`） → 延续表格中的规律（`mt_2jbUekyTu4`） → 乘法口诀与乘法表 · 从已知规律推出新事实（`mt_aivrWs6jrS`） → 利用等值关系推理（`mt_jCy07DyBNU`） → 从重复推理中概括规律（`mt_iyovKgZC1q`） |

以下两个节点属于上游 Mathematical Thinking，保留其原有标准和学习活动，但没有 MP.1–MP.8 代码；不因主题接近而自动写入 MP.5：

- 用计算器检查金额（`mt_FVVSQR9vGg`；Calculator checks for money）：acara-v9:AC9M3N06，活动 `moneycalc`。
- 合理使用计算器（`mt_ish_uH8vZe`；Using a calculator well）：acara-v9:AC9M4N06、acara-v9:AC9M4N08，活动 `calculator39`。

八个标准的原文标题来自项目内固定上游标准记录。标签、一次正确操作和任务完成都不能代表独立解释、真实工具使用、能力成长或跨情境迁移。来源与本地任务逐项数学审阅仍待继续。

重新核对：`node scripts/build_thinking_source_map.mjs --check`。
