# 本地 10 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_cdMlC7EpTJ` 三角形中的角 | Find unknown angles in triangles, quadrilaterals, and regular polygons using angle sum properties | `learn.html#triangleangles` |
| `mt_liIW336odh` 按特征给图形分类 | Compare and classify geometric shapes based on their properties and sizes; understand that attributes belonging to a category also belong to all subcategories; classify two-dimensional figures in a hierarchy based on properties | `learn.html#quadhierarchy` |
| `mt_R4AY0LKxfl` 坐标 | Describe positions on the full coordinate grid (all four quadrants); use coordinates with negative values | `learn.html#signedpoints` |
| `mt_xq3YHZ2zeR` 认识圆的各部分 | Illustrate and name parts of circles, including radius, diameter, and circumference; know that the diameter is twice the radius | `learn.html#circleparts` |
| `mt_snlqRCiA1R` 在第一象限描点 | Plot and read ordered pairs in the first quadrant of the coordinate plane; represent real-world and mathematical problems by graphing points and interpreting coordinate values in context | `learn.html#pointstory` |
| `mt_oDlduFnemk` 坐标网格 | Understand a coordinate system defined by two perpendicular number lines (axes) with an origin at (0,0); know that an ordered pair (x, y) specifies a unique point where the first number gives horizontal distance and the second gives vertical distance from the origin | `learn.html#pointaxes` |
| `mt_lxaM6iVpdr` 图形的平移与轴对称 | Draw and translate simple shapes on the coordinate plane; reflect shapes in the axes | `learn.html#axisrules` |
| `mt_QDTO3GAgcq` 理解角 | Recognise angles where they meet at a point, are on a straight line, or are vertically opposite; find missing angles using these properties | `learn.html#anglecross` |
| `mt_nRksLqt-iR` 立体图形 | Use the properties of faces, surfaces, edges, and vertices of 3-D shapes (cubes, cuboids, prisms, cylinders, pyramids, cones, and spheres) to solve problems, including visualising cross-sections | `learn.html#crossparts` |
| `mt_J03RFlVdas` 三角形与多边形的内角和 | Derive and use the angle sum in a triangle (180°), use it to deduce the angle sum in any polygon ((n−2) × 180°), and calculate interior and exterior angles of regular polygons | `learn.html#polygonangles` |

图形以给定条件和实际模型为准；屏幕构造、量角与折叠不证明实体工具或独立作图能力。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 20 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
