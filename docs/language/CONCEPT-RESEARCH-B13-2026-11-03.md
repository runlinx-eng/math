# B13：四个数据摘要与调查推断研究缺口

2026-11-03。四个节点原 taxonomy 均为 `hasResearch=false`，标记保持不变。已核对来源描述、全部 evidence、评估提示、直接关系与项目活动。

外部依据：[美国统计协会 GAISE II](https://www.amstat.org/docs/default-source/amstat-documents/gaiseiiprek-12_full.pdf) 讨论调查过程与数据分布；[CCSS 6.SP.B.5](https://www.thecorestandards.org/Math/Content/6/SP/B/5/) 要求结合背景概述数值数据；[CCSS 7.SP.B.4](https://www.thecorestandards.org/Math/Content/7/SP/B/4/) 使用随机样本的中心与变异作非正式总体比较；[CCSS 7.SP.B.3](https://www.thecorestandards.org/Math/Content/7/SP/B/3/) 讨论比较相近变异的数值分布。这些资料不证明本项目的学习效果。

| 来源 ID | 来源目标与活动 | 限制 |
| --- | --- | --- |
| `mt_mn765HbXi1` | `digitalsets` 以同序类别、共同尺度比较两组模拟调查数据和点图。 | 有序类别不假设等距；本地工具不证明外部电子表格技能。 |
| `mt_O-U263ukg1` | `betterquestion` 限定对象、时间及属性，记录模拟数据，选择展示并提出改进。 | 没有真实收集；有限选择不证明普遍独立调查能力。 |
| `mt_tuEnyrp5Ia` | `datasummary` 组合观察数、测量背景、单位、中心与对应的变异指标。 | 中位数与IQR、均值与MAD按数据形态和用途选择；自由文本语义未自动评估。 |
| `mt_km4V6d5IAh` | `comparepeople` 比较两个模拟随机样本，观察中心、变异及重复抽样波动。 | 结论应说明不确定性，不声称每个个体都符合，也未做正式显著性检验。 |

课程年龄和年级不决定路线。独立数学复核、用户视觉验收与儿童理解测试仍未完成。

技术验证：4 个节点在 1440×900 和 1280×720 两个视口的隔离浏览器中共 8 个场景通过，截图与结果在 `verification/concept-research-gap4b-20261103/`。定向测试 97 项通过；全量 Node 测试 1144/1152，8 项失败与原始基线一致。技术验证不等于人工验收。
