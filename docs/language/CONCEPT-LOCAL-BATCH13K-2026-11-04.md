# 本地 13 节点解释

2026-11-04。逐项对照 `dist/data/math.json` 的原始描述、evidence 与评估提示、直接来源关系，及 `vendor/os-taxonomy/data/teaching-research.json` 和 `docs/phase5/coverage.json` 中的现有活动。上游研究可能由模型生成；有记录不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_tAJH5BrpOx` 面积与体积公式 | Derive and apply formulae for the area of triangles, parallelograms, and trapezia, and for the volume of cuboids and other prisms (including cylinders), connecting each formula to its geometric reasoning | `learn.html#prismFormulas` |
| `mt_K0Y15w48SY` 坐标变换 | Identify properties of translations, rotations, and reflections; describe and perform these transformations on given figures, and understand that the image is congruent to the original | `learn.html#gridchange` |
| `mt_Jf8xcX4UTq` 准确绘制三角形 | Draw and measure line segments and angles accurately, and construct triangles from given conditions using the drawing approaches the standard calls for: ruler and protractor for two sides and the included angle (SAS) or two angles and the included side (ASA); ruler and compasses for three sides (SSS), using intersecting arcs; and dynamic geometry software; check each construction by measuring the remaining sides and angles (to within about 1 mm and 1°). Interpreting scale drawings is covered in Scale drawings and maps; deciding whether conditions give one, many or no triangles is covered in Which triangles are possible | `learn.html#triangledraw` |
| `mt_WtIFJSCQIT` 几何符号与草图 | Use conventional geometric terms and notation to describe, sketch, and draw points, lines, parallel and perpendicular lines, right angles, regular polygons, and reflectively/rotationally symmetric polygons | `learn.html#geometrynotation` |
| `mt_DNYQLahbfa` 三角形与四边形的特征 | Derive and illustrate properties of triangles, quadrilaterals, and circles using appropriate language, including interior angles, diagonals, symmetry, and relationships between side lengths | `learn.html#shapefacts` |
| `mt_tedML_iu4Y` 理解角 | Apply the properties of angles at a point (360°), on a straight line (180°), and vertically opposite angles to find unknown angles in multi-step problems | `learn.html#anglechain` |
| `mt_H_pNJ3ZI_S` 平行线中的角 | Understand and use the relationship between parallel lines cut by a transversal: corresponding angles, alternate interior angles, and co-interior (same-side interior) angles; use these to find unknown angles | `learn.html#parallelangle` |
| `mt_svFa6_mjO_` 圆的周长与面积 | Calculate the circumference and area of circles using the formulae C = πd (or 2πr) and A = πr², and solve problems involving perimeters and areas of composite shapes that include circular parts | `learn.html#circleArea` |
| `mt_167X6Ax8P7` 全等三角形 | Know and use the criteria for triangle congruence (SSS, SAS, ASA, RHS), use standard labelling conventions for sides and angles of triangle ABC, and determine whether two triangles are congruent | `learn.html#trianglecongruent` |
| `mt_ZrsqGVG-Wt` 尺规作图 | Use ruler and compasses to perform standard constructions: perpendicular bisector of a line segment, perpendicular to a line from or at a given point, and bisecting an angle | `learn.html#compasswork` |
| `mt_y-BuQAfw4B` 相似与放大 | Understand similarity as a relationship where one shape is an enlargement of another; construct similar shapes by enlargement with a given scale factor and centre, with and without coordinate grids | `learn.html#growshape` |
| `mt_1VmTUxBrNd` 使用勾股定理 | Apply Pythagoras’ Theorem (a² + b² = c²) to calculate unknown side lengths in right-angled triangles, including in real-world and coordinate-geometry contexts | `learn.html#pythagoras` |
| `mt_KB_Czd7RQH` 三角函数初步 | Use the trigonometric ratios sin, cos, and tan in right-angled triangles to find unknown sides and angles, including setting up the correct ratio for a given problem | `learn.html#trigbasics` |

图形以给定条件和实际模型为准；屏幕构造、量角与折叠不证明实体工具或独立作图能力。屏幕模拟不等于实体测量、自由绘图或独立解释；有限例子不证明全部来源目标。独立数学教研、用户视觉验收及儿童理解测试均未完成。

技术验证：相关内容与台账专项测试 75 项通过；两种桌面尺寸共 26 项浏览器检查通过。完整 Node 测试 1154 项通过、8 项失败，失败项目与本批之前相同。独立数学复核、用户视觉验收及儿童理解测试未完成。
