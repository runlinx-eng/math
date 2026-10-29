# B23 研究与适配

源快照 `a8719737ff86ef7940ba5feca11940de1204103e`。19个节点、60个源目标：17份上游教学研究和2个缺口；`source-review.json`保留源文本与指针。上游研究的标记不意味着本次逐一重验了所有原引文；本批活动是本地设计，尚无孩子试用证据。

2026-10-27直接核查：[OpenStax 多边形和圆](https://openstax.org/books/contemporary-mathematics/pages/10-4-polygons-perimeter-and-circumference)对边角均相等的正多边形、圆周、半径与直径的定义；[欧几里得《几何原本》I.9](https://www.euclids-elements.org/elements/books/bookI/propositions/propI9/)、[I.10](https://www.euclids-elements.org/elements/books/bookI/propositions/propI10/)与[I.12](https://www.euclids-elements.org/elements/books/bookI/propositions/propI12/)的角平分、线段平分和线外点作垂线；[Illustrative Mathematics 建模任务](https://tasks.illustrativemathematics.org/content-standards/HSG/MG/A/1/tasks/1140)及[图形属性任务](https://tasks.illustrativemathematics.org/content-standards/1/G/A/1/tasks/1104)用几何形状近似物体、区分定义性属性；[OpenStax 立体与圆柱](https://openstax.org/books/prealgebra/pages/9-6-solve-geometry-applications-volume-and-surface-area)对长方体的面与圆柱的圆形底面。资料支持数学和建模依据，不证明本设计的教学效果。

## 本地补充的两个缺口

| 节点 | 活动与核对 | 限制 |
| --- | --- | --- |
| `mt_mN4Ye_vtR7` 形状与用途 | 水平面无额外支撑的模型里，侧放圆柱滚动、立起用平面端叠放；长方体以平面和直边对齐排列，方块试叠。 | 几何属性只是选择形状的部分理由；材料、尺寸、重心与真实安全未验证，不推断罐子或盒子的唯一设计原因。 |
| `mt_SK7WntVZ6y` 用形状近似物体 | 房身和屋顶由方盒及三棱柱近似；平台、支撑、斜面拼成简化滑梯；在7×7方格上近似叶形，允许边缘误差。 | 图形有提示位置，屏幕上是二维投影或有限网格，不评自由绘画、现实结构设计和每个可能的近似结果。 |

## 数学与评价边界

三角形需三条直边围成；方向变化不改变属性。封闭多边形拒绝自交与连续共线伪顶点；正方形同时是长方形和菱形，正多边形需要边与角都相等。图形反射采用实际坐标，整幅轮廓重合才视为对称；非正方形长方形的对角线虽分面积，并非对称轴。转动后的轴与图形同步。

拼块围绕共同中心转动；颜色呈现实际姿态，长方形需要两块分别处于互补的0°和180°。尺规任务保留完整圆周，按真实半径计算交点，半径不足或两圆张口不等不能直接完成；角平分的两边角度由几何位置测量。第三个源目标写“仅用圆规”，此实现还使用虚拟直尺连接点，不声称满足纯圆规要求或实物操作能力。

屏幕模型、有限候选、提示位置与结构化选择并不证明自由构造、实物尺规、语言解释或跨情境掌握。逐目标具体覆盖和缺口见 `COVERAGE.md`。

上游 Marble Builder 的 Hidden Cubes 示例在隔离测试浏览器中实际放入六块、组成一层，留存 `verification/phase5/B23/hidden-cubes-example.png`；借用“先行动再观察”的交互原则，不修改上游文件。
