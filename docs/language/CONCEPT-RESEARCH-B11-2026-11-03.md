# B11：五个数据质量与抽样研究缺口的来源和解释草稿

2026-11-03。五个节点在原 taxonomy 中均为 `hasResearch=false`，标记保持不变；已对照原始描述、evidence、评估提示、直接关系与项目活动。

外部依据：[美国统计协会 GAISE 指南](https://www.amstat.org/docs/default-source/amstat-documents/gaiseprek-12_full.pdf) 讨论统计调查中的总体、样本、选择方式和测量；[CCSS 7.SP.A.1](https://www.thecorestandards.org/Math/Content/7/SP/A/1/) 区分总体与样本，说明随机抽样通常有助于代表性；[新南威尔士州教育统计术语表](https://education.nsw.gov.au/about-us/education-data-and-research/cese/glossary) 区分数据项、抽样误差和测量误差；[教育厅调查分析说明](https://education.nsw.gov.au/teaching-and-learning/professional-learning/pl-resources/evaluation-resource-hub/collecting-data/surveys/step-5-organise-and-analyse-the-data) 讨论整理调查回答与核对数据。以上是课程或专业资料，不能证明本项目的学习效果。

| 来源 ID | 来源目标与活动 | 限制 |
| --- | --- | --- |
| `mt_Y6JmLjnfRP` | `ownstudy` 设计给定选项中的问题、记录15份模拟回答、构造图并形成发现。 | 未进行真实15人调查，独立设计、课堂呈现及自由文字语义未评。 |
| `mt_QHT16CrFO-` | `checkrecords` 保留原值，区分有效、更正与未知，整理无序或有序类别。 | 有序等级不必等距；不能无证据猜填缺失值，有限本地公式不代表通用软件技能。 |
| `mt_8IsaoMPvod` | `medialens` 比较相同数据在不同坐标起点的柱图，检查样本和限定标题。 | 自愿者样本不能直接代表全部儿童；自由改写和开放批判未自动评估。 |
| `mt_4zgPzc6yu5` | `fairdraw` 区分总体与样本，在完整模拟名单及局部群体中比较抽取。 | 随机抽样通常有助于代表性，但单个样本仍可能偶然不具代表性；模拟设定不证明现实群体差异。 |
| `mt_6gpryAnpoZ` | `measurestory` 合计频数、描述测量对象、方法和精度，并观察取整后的模拟时间。 | 数据集中在整点可能由取整造成，但仅凭聚集不能证明真实原因。 |

课程年级不决定学习路线。独立数学复核、用户视觉验收和儿童理解测试均尚未完成。

技术验证：5 个节点在 1440×900 和 1280×720 两个视口的隔离浏览器中共 10 个场景通过，截图与结果在 `verification/concept-research-gap5d-20261103/`。该批定向测试 93 项通过；全量 Node 测试 1140/1148，8 项失败与原始基线一致。技术验证不等于人工验收。
