# B26 研究与适配

2026-10-27，源快照 a8719737ff86ef7940ba5feca11940de1204103e。两个源节点共有六个源目标，均有上游教学研究；本批未新增研究缺口。source-review.json保留源目标、研究和前置关系指针。上游研究是建议，不是对本界面教学效果的证明；历史核验标志不代表本次逐一重验全部引文。

本次直接核查：[OpenStax 坐标距离与勾股定理](https://openstax.org/books/college-algebra/pages/2-1-the-rectangular-coordinate-systems-and-graphs)、[OpenStax 直角三角形比例](https://openstax.org/books/algebra-and-trigonometry/pages/7-2-right-triangle-trigonometry)、[OpenStax 反三角函数](https://openstax.org/books/algebra-and-trigonometry-2e/pages/8-3-inverse-trigonometric-functions)和 [Illustrative Mathematics 相似三角形与边长比例](https://tasks.illustrativemathematics.org/content-standards/HSG/SRT/C/6/tasks/1635)。这些资料支持数学事实和设计依据，不能证明孩子已经掌握。

## 斜边、面积与距离

先辨认直角，选择直角对面的斜边；再比较三条边上实际构造的正方形。面积条按同一尺度显示：3²+4²=5²，整体边长变成两倍后36+64=100。面积条表示数值比较，未模拟把小正方形切开拼进大正方形，也不是一般证明。

有限任务分别用6和8求斜边10，用斜边13和直角边5求另一边12，并在坐标网格上为(1,2)和(5,5)画出横竖辅助边，求距离5。两种辅助线均可用。面积和边长的关系有可选说明；打开说明作为帮助记录。例子覆盖加与减、平方与平方根，但不能验证任意情境迁移或心算。

## 参考角与比例

同一3-4-5直角三角形中，从B角和C角分别标记边；切换观察角时，对边与邻边交换，斜边不变。将图形和所有边长放大两倍，观察3/5与6/10仍相等；不把两个固定例子当成一般证明。

比例选择、未知边和未知角分别使用有限例子：10×sin35°约5.74、10×cos60°=5、tan的反算由3/4得到约36.9°。屏幕计算器把角度作为度数输入；反三角函数用于由比例找角，不是把函数值取倒数。错误的第一次斜边或比例选择及使用帮助均保留；计算器只计算输入的值，不代表心算能力。

原依赖中的公式变形节点尚未制作。活动提供有限的平方根和比例说明，不会因此自动点亮该前置节点，也不声称已覆盖一般公式变形。实体测量、开放解释、一般证明及实际孩子学习效果均未评估；逐目标边界见 [覆盖表](COVERAGE.md)。

上游 Marble Builder 的 Bee Builder 示例在隔离浏览器中实际切换方形与六边形，画面见 verification/phase5/B26/bee-example.png；借用改变图形后观察关系的原则，没有修改上游文件。
