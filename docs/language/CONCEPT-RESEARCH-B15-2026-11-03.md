# B15：三个坐标、铺砌与三角形研究缺口

2026-11-03。三个节点原 taxonomy 均为 `hasResearch=false`，标记保持不变；已核对来源描述、evidence、评估提示、直接关系与项目活动。

外部依据：[CCSS 6.G.A.3](https://www.thecorestandards.org/Math/Content/6/G/A/3/) 包含坐标多边形与水平、竖直边长；[CCSS 7.G.A.2](https://www.thecorestandards.org/Math/Content/7/G/A/2/) 讨论给定边角条件可能产生唯一、多个或没有三角形；[新南威尔士州教育厅铺砌活动](https://education.nsw.gov.au/teaching-and-learning/curriculum/mathematics/mathematics-curriculum-resources-k-12/thinking-mathematically-resources/mathematics-s2-s3-playing-with-tessellations) 展示平移、反射、旋转和铺砌探索。这些课程与教学资料不证明本项目的学习效果。

| 来源 ID | 来源目标与活动 | 限制 |
| --- | --- | --- |
| `mt_h7zVgCDVmx` | `pointdistance` 在四象限连成矩形，求水平竖直边长、面积及模拟地图距离。 | 仅给定水平、竖直线段和有限地图比例，不代表任意坐标距离公式。 |
| `mt_61Nhj8W78f` | `patternfloor` 比较正规多边形、平移旋转样板和构造有限花边。 | 单一种正五边形不能正规铺砌，不等于所有不规则五边形不能铺砌；不是外部通用软件能力评估。 |
| `mt_4bc3EAxhlY` | `trianglepossible` 比较三边不相交、共线相切与成形；还比较角度、夹角与非夹角情形。 | “唯一”指形状及大小在全等意义下确定，不以图形位置或镜像区分；有限构造不证明手绘或一般论证能力。 |

课程年级不决定路线。独立数学复核、用户视觉验收和儿童理解测试均未完成。

技术验证：3 个节点在 1440×900 和 1280×720 两个视口的隔离浏览器中共 6 个场景通过，截图与结果在 `verification/concept-research-gap3c-20261103/`。定向测试 101 项通过；全量 Node 测试 1148/1156，8 项失败与原始基线一致。技术验证不等于人工验收。
