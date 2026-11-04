# B12：五个分布、四分位与样本推断研究缺口

2026-11-03。五个节点原 taxonomy 均为 `hasResearch=false`，标记保持不变。已核对原始描述、全部 evidence、评估提示、直接关系与项目活动。

外部依据：[美国统计协会 GAISE II](https://www.amstat.org/docs/default-source/amstat-documents/gaiseiiprek-12_full.pdf) 讨论数据分布的中心、变异以及四分位距；[CCSS 7.SP.B.3](https://www.thecorestandards.org/Math/Content/7/SP/B/3/) 将相近变异程度的两组数据中心差与变异度比较，并要求观察重叠；[CCSS 7.SP.A.1](https://www.thecorestandards.org/Math/Content/7/SP/A/1/) 区分随机样本与总体推断；[新南威尔士州教育厅抽样说明](https://education.nsw.gov.au/teaching-and-learning/professional-learning/pl-resources/evaluation-resource-hub/collecting-data/surveys/decide-on-a-sampling-strategy) 讨论目标总体和随机抽样。这些是课程或专业指导，不是对本项目的学习效果研究。

| 来源 ID | 来源目标与活动 | 限制 |
| --- | --- | --- |
| `mt_OwYms2tB1L` | `distributionlook` 比较中心相同而范围和形态不同的模拟数据，并核查远点背景。 | 图本身不能证明远点原因或推广到其他群体。 |
| `mt_KCS9GbZgU_` | `quartiles` 对奇数个数据排除整体中位数后分两半，计算上下四分位和四分位距，并比较极差。 | 本活动约定并非所有软件的唯一约定；并列值下不机械声称边界内精确占50%。 |
| `mt_fQ9Rw10fss` | `estimatepeople` 根据随机样本比例估计总体数量，并检查来自单一小组的限制。 | 估计不是清点，推断依赖样本选择和数据质量。 |
| `mt_A2hKhHXgL5` | `comparegap` 在共同尺度上看重叠，并把均值差与同类变异指标比较。 | 简单比值用于变异程度相近的组；尾部和聚集会改变实际重叠，比值不唯一决定重叠。 |
| `mt_x7V1qrkiqH` | `samplevary` 从模拟总体反复抽样并放回，比较样本估计之间及个体之间的变异。 | 观察到的几次极值不是误差保证或置信区间；较大样本通常更稳定但不保证每次更准。 |

课程年级不决定路线。独立数学复核、用户视觉验收和儿童理解测试仍未完成；有限模拟不证明真实调查能力。

技术验证：5 个节点在 1440×900 和 1280×720 两个视口的隔离浏览器中共 10 个场景通过，截图与结果在 `verification/concept-research-gap5e-20261103/`。定向测试 95 项通过；全量 Node 测试 1142/1150，8 项失败与原始基线一致。技术验证不等于人工验收。
