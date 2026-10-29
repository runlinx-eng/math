# B24 研究与适配

2026-10-27，源快照 `a8719737ff86ef7940ba5feca11940de1204103e`。18个节点含54个源目标：适配14份上游教学研究，补4份本地简报。`source-review.json`保留原目标、研究和源内指针；已有研究并不表示本次逐一重验其所有引文。54个目标的有限操作及未评范围见 `COVERAGE.md`。

本次核对的公开数学依据：[OpenStax 坐标平面](https://openstax.org/books/college-algebra/pages/2-1-the-rectangular-coordinate-systems-and-graphs)、[Illustrative Mathematics 坐标与全等](https://tasks.illustrativemathematics.org/content-standards/G/8/A/3/tasks/1232)、[变换课程](https://im.kendallhunt.com/MS/teachers/3/1/3/index.html)、[旋转对称任务](https://tasks.illustrativemathematics.org/content-standards/tasks/1471)、[正规铺砌任务](https://tasks.illustrativemathematics.org/content-standards/HSG/MG/A/tasks/1125)、[OpenStax 铺砌](https://openstax.org/books/contemporary-mathematics/pages/10-5-tessellations)和[相似三角形](https://tasks.illustrativemathematics.org/content-standards/tasks/1422)。这些资料支持数学和教学设计依据，不证明孩子已经理解或本界面有效。

## 本地补充的四个研究缺口

| 节点 | 设计和常见误解 | 有限范围 |
| --- | --- | --- |
| `mt_h7zVgCDVmx` 坐标网格中的形状 | 在等距网格实际放点并连接，比较跨原点的边长；先横后纵，轴上的点不属于任何象限。地图例子按100米一格换算。 | 仅给定图形和刻度，不代替自由测图或口头说明。 |
| `mt_NM5I3yN-Q6` 旋转对称 | 实际转动并叠合原形，比较正方形、爱心、等边三角形和风车；转动角度与中心都影响是否重合。 | 是有限候选与固定旋转，不证明对所有形状的判断。 |
| `mt_RdfzwInyAj` 几何软件变换 | 先保存预测，再按输入的平移、反射或绕指定中心旋转计算全部顶点；可比较对应边长和角度。错误预测和帮助保留。 | 使用本地限定工具；不评通用几何软件、自由论证或实体操作。 |
| `mt_61Nhj8W78f` 铺砌与变换图案 | 实际看同一顶点周围的角及空隙或重叠；在两个限定的边缘变体中排四块中心对称样板，镜映再平移形成花边。 | 正五边形的正规单一铺砌例子有空隙或重叠，不意味着不规则五边形或混合图形都不能铺砌；样板并非任意自由设计。 |

## 数学与评价边界

坐标依顺序表示横、纵位置；水平或垂直线段的格数由坐标差的绝对值决定。反射点到镜线的**垂直**距离相等；平移、反射和旋转保持对应边长与角度，反射会改变朝向。放大按指定中心到每个点的向量成倍变化，各边都加同样长度一般不能代替按比例放大。对称图的另一半由孩子放出的对应点自动连线，再折回比较；这不是无提示自由绘图评估。

有限任务、候选选项和提示不能证明自由解释、实物操作、开放构造、跨情境应用或长期保持。自由文字只保存，不作语义判分。上游 Marble Builder 的 Bee Builder 示例已在隔离浏览器实际切换方形与六边形；见 `verification/phase5/B24/bee-example.png`。借用先操作、再观察的原则，没有修改上游文件。
