# 7 个已有样板 · 外部研究依据核查

核查日期：2026-11-02
范围：7 个已有解释样板；核对课程标准、统计教育框架、实证教学研究和技术定义，并将缺失的来源目标落实到实际解释内容。

## 结论

- 7/7 已建立可追溯的外部来源记录，共 17 项来源：10 项实证研究/研究报告、2 项课程标准、1 项专业框架、4 项技术参考。
- 7 个样板均已在 `dist/concept-explanations.js` 中落实内容修订，不只是更新审查记录。
- 点图、直方图、箱线图、分割图形求面积的 SVG 仍需人工审图；本轮没有把静态图示误标为已验收。
- 原 taxonomy 的 `hasResearch=false` **保持不变**。外部来源已单独登记，但尚未接入产品内研究资料登记机制。
- 独立数学教研复核：0/7；儿童理解与迁移测试：0/7。

## 按节点核查

### 规划统计调查（`mt_SHVyE1CLUa`）

**课程/数学对齐：** AC9M5ST03 directly aligns with posing an investigative question, collecting relevant data, selecting displays, interpreting results and communicating findings in context. GAISE II supplies the broader investigation cycle.

**研究依据：** The IES STEPSS cluster-randomized study provides evidence for inquiry-oriented statistics instruction at Grade 7. Hedges et al. identify study design and data collection as a distinct reasoning challenge for middle-school students.

**此前缺少的覆盖：**
- Make the comparison question explicit: school-night versus weekend sleep duration.
- Distinguish population, sample, variable, unit and collection method, including self-report and sample limitations.
- Explain why a paired table and comparative dot plots serve different purposes.

**已落实的内容修订：** Replaced the generic sleep example with a school-night/weekend comparison using the same pupils; clarified paired records versus distribution comparison; strengthened sample, measurement, bias and display rationale.

**仍待验收：** Independent mathematical review of the investigation design and real-child comprehension testing remain pending.

**来源：** SRC-01 · SRC-02 · SRC-03 · SRC-04 · SRC-05

### 立体图形的表面积与体积（`mt_Sij9ByyHq6`）

**课程/数学对齐：** CCSS 7.G.B.6 covers composite objects made from polygons, cubes and right prisms; 6.G.A.4 covers nets and surface area.

**研究依据：** Sung et al. provide a specific 3D-representation intervention with 111 fifth-grade students. Lehmann supports flexible face/net strategy choice for simple prisms; Panorkou provides a conceptual account of area and volume reasoning.

**此前缺少的覆盖：**
- The prior sample included the glued-cube case but omitted a triangular-prism surface-area calculation.
- It omitted the L-shaped planter case distinguishing footprint area, soil volume and exterior surface area.

**已落实的内容修订：** Added a 3–4–5 right-triangular prism of length 10 cm: 2×6 + 12×10 = 132 cm². Added an L-shaped 3 m × 3 m footprint with a 1.5 m × 2 m corner removed: base area 6 m², 0.5 m depth gives 3 m³ soil volume; 12 m perimeter gives 6 m² sidewall area, or 12 m² including the base but not the open top. Retained glued-cube result (40 cm³ and 80 cm²).

**仍待验收：** Independent review must verify right-triangle dimensions, exposed-face accounting and the open-top planter surface-area convention.

**来源：** SRC-05 · SRC-06 · SRC-07 · SRC-08

### 到平均数的平均距离（`mt_ZfpeI1CFyP`）

**课程/数学对齐：** CCSS 6.SP.B.5c explicitly names mean absolute deviation; GAISE II Level B defines it as average distance from the mean.

**研究依据：** GAISE II confirms the school-statistics meaning of MAD as mean absolute deviation. NIST distinguishes average absolute deviation (AAD, from the mean) from median absolute deviation (MAD, from the median).

**此前缺少的覆盖：**
- Interpret the result in the original unit.
- Compare two data sets with the same mean to isolate differences in consistency.

**已落实的内容修订：** Spelled out mean absolute deviation to avoid acronym ambiguity; added plant heights 4, 6, 10 and 12 cm (mean 8 cm, MAD 3 cm); added two four-game bowling sets with the same mean 120 and MAD values 8 and 21.

**仍待验收：** Independent review should verify the convention and each calculation in original units.

**来源：** SRC-02 · SRC-05 · SRC-09

### 点图（`mt_JRzXQl9M7c`）

**课程/数学对齐：** CCSS 6.SP.B.4 includes dot plots on a number line; the node requires equal spacing, visible gaps, one dot per observation and frequency interpretation.

**研究依据：** Watson and Kelly directly studied Grades 5–10 students interpreting stacked dot plots, including omitted zero-value gaps. NIST documents stacking repeated observations.

**此前缺少的覆盖：**
- The previous example omitted the full 0–12 scale, four observations at 3, minimum, maximum and mode.
- Provide a complete frequency set that can be checked against the stated total of 20 pupils.

**已落实的内容修订：** Added a complete 0–12 frequency sequence for 20 pupils: 3 occurs four times, 5 occurs six times, 7/10/11 are empty, minimum 0, maximum 12 and mode 5.

**仍待验收：** The dot-plot SVG still requires manual visual checking against the complete scale and stack counts.

**来源：** SRC-02 · SRC-05 · SRC-10 · SRC-11

### 直方图（`mt_oderfUBZPw`）

**课程/数学对齐：** CCSS 6.SP.B.4 includes histograms; NIST defines the common equal-bin histogram with frequency counts and distribution features.

**研究依据：** Whitaker and Jacobbe’s LOCUS study documents misunderstandings about reading histograms and distinguishing them from bar graphs in Grades 6–12. NIST supports equal-width bins and frequency-axis definitions.

**此前缺少的覆盖：**
- Explicitly answer the two required frequency-reading questions.
- Require axis labels and justify the difference between continuous intervals and categories.

**已落实的内容修订：** Made interval boundaries explicit and added exact counts: 150≤h<160 contains 6 pupils; below 150 contains 10. Strengthened the task to label height/frequency axes, draw touching equal-width bins and explain the bar-chart distinction.

**仍待验收：** The histogram SVG still requires manual checking for touching bars, continuous numeric axis, interval boundaries and axis labels.

**来源：** SRC-02 · SRC-05 · SRC-12 · SRC-13

### 箱线图（`mt_8VjmxR1yfw`）

**课程/数学对齐：** CCSS 6.SP.B.4 includes box plots. NIST confirms both min/max-whisker and 1.5-IQR fence-based variants.

**研究依据：** Edwards et al. found a construction/interpretation gap among 259 middle-school students, including difficulty interpreting aggregated data and quartiles. Pfannkuch analyzes the reasoning demands of comparing box-plot distributions.

**此前缺少的覆盖：**
- State that different raw data sets can share the same five-number summary and box plot.
- Distinguish min/max whiskers from 1.5-IQR fence-based box plots.

**已落实的内容修订：** Made the min/max whisker convention explicit, contrasted it with 1.5-IQR fence-based plots, and explained that a five-number summary cannot reveal every cluster, gap or raw value.

**仍待验收：** The box-plot SVG still requires manual checking; independent review must confirm quartile interpretation and selected whisker convention.

**来源：** SRC-02 · SRC-05 · SRC-14 · SRC-15 · SRC-16

### 分割图形求面积（`mt_i2-QaXbyzB`）

**课程/数学对齐：** CCSS 6.G.A.1 explicitly requires composing polygons into rectangles or decomposing them into triangles and other shapes for real-world area problems.

**研究依据：** Lehmann’s Year 8 classroom study (31 participating students) documents decomposition, component-area calculation and recomposition strategies, including errors when students add rather than subtract outside pieces.

**此前缺少的覆盖：**
- Add the kite-in-an-enclosing-rectangle example.
- State the perpendicular-diagonal condition; retain the garden task.

**已落实的内容修订：** Added a kite with perpendicular diagonals 8 cm and 6 cm: enclosing rectangle 48 cm² minus four corner triangles totalling 24 cm² gives 24 cm²; direct half-product formula provides a check. Retained trapezoid and 108 m² garden tasks.

**仍待验收：** The polygon-area SVG still requires manual visual checking; independent review must verify perpendicular diagonals and corner-triangle subtraction.

**来源：** SRC-05 · SRC-17

## 来源目录

| ID | 来源 | 类型 | 年份 |
|---|---|---|---:|
| SRC-01 | [Australian Curriculum v9 — AC9M5ST03](https://www.scootle.edu.au/ec/search?accContentId=AC9M5ST03) | official_curriculum | Version 9 |
| SRC-02 | [Pre-K–12 Guidelines for Assessment and Instruction in Statistics Education II (GAISE II)](https://www.amstat.org/docs/default-source/amstat-documents/gaiseiiprek-12_full.pdf) | professional_framework | 2020 |
| SRC-03 | [Effects of an Inquiry-Oriented Curriculum and Professional Development Program on Grade 7 Students’ Understanding of Statistics and on Statistics Instruction](https://ies.ed.gov/use-work/resource-library/report/impact-study/effects-inquiry-oriented-curriculum-and-professional-development-program-grade-7-students) | cluster_randomized_impact_study | 2021 |
| SRC-04 | [Attending to Middle School Students’ Understanding of Study Design: The Often Overlooked or Contrived Step in the Statistical Problem-Solving Process](https://doi.org/10.1108/MGRJ-05-2022-0004) | empirical_teaching_research | 2022 |
| SRC-05 | [Common Core State Standards for Mathematics](https://corestandards.org/wp-content/uploads/2023/09/ADA-Compliant-Math-Standards.pdf) | official_curriculum_standard | 2010 |
| SRC-06 | [The Effects of 3D-Representation Instruction on Composite-Solid Surface-Area Learning for Elementary School Students](https://eric.ed.gov/?id=EJ1049021) | peer_reviewed_intervention_study | 2015 |
| SRC-07 | [Learning to calculate surface area: a focus on strategy choice](https://doi.org/10.1080/14794802.2022.2081991) | peer_reviewed_classroom_study | 2023 |
| SRC-08 | [Dynamic Measurement Reasoning for Area and Volume](https://eric.ed.gov/?id=EJ1275898) | research_based_conceptual_article | 2020 |
| SRC-09 | [NIST Engineering Statistics Handbook — Measures of Scale](https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm) | technical_reference | — |
| SRC-10 | [School Students’ Understanding of Stacked Dot (or Line) Plots](https://aare.edu.au/data/publications/2002/wat02243.pdf) | refereed_empirical_study | 2002 |
| SRC-11 | [NIST Dataplot — Strip Plot (also known as a dot plot)](https://www.itl.nist.gov/div898/software/dataplot/refman1/auxillar/striplot.htm) | technical_reference | — |
| SRC-12 | [NIST Engineering Statistics Handbook — Histogram](https://www.itl.nist.gov/div898/handbook/eda/section3/histogra.htm) | technical_reference | — |
| SRC-13 | [Students’ Understanding of Bar Graphs and Histograms: Results From the LOCUS Assessments](https://doi.org/10.1080/10691898.2017.1321974) | peer_reviewed_empirical_assessment_study | 2017 |
| SRC-14 | [NIST Engineering Statistics Handbook — Box Plot](https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm) | technical_reference | — |
| SRC-15 | [Interpretations of Boxplots: Helping Middle School Students to Think Outside the Box](https://doi.org/10.1080/10691898.2017.1288556) | peer_reviewed_empirical_study | 2017 |
| SRC-16 | [Comparing Box Plot Distributions: A Teacher’s Reasoning](https://iase-pub.org/ojs/SERJ/article/view/498) | refereed_empirical_study | 2006 |
| SRC-17 | [Learning to measure the area of composite shapes](https://doi.org/10.1007/s10649-022-10191-z) | peer_reviewed_classroom_study | 2023 |

## 来源与结论边界

1. **课程标准不是效果研究。** ACARA 和 CCSS 用于核对内容目标；不能据此声称某种教学设计一定有效。
2. **实证研究不能无条件外推。** 表面积、复合面积研究的样本年龄略高于对应节点；样本与课堂条件均已保留。
3. **MAD 缩写存在语境差异。** GAISE II 在学校统计中把 MAD 用作 mean absolute deviation（平均绝对偏差）；NIST 则用 AAD 表示平均绝对偏差、MAD 表示 median absolute deviation（中位数绝对偏差）。首次出现必须写全称。
4. **箱线图须线约定不唯一。** 本样板采用须线延伸到最小值和最大值；另有以 1.5×IQR 围栏确定须线并标出离群值的形式。
5. **图示和儿童测试没有被本轮代替。** 外部来源核查、解释修订、独立数学复核、人工审图和儿童迁移测试是不同验收项。

机器可读记录：[CONCEPT-RESEARCH-EVIDENCE.json](CONCEPT-RESEARCH-EVIDENCE.json)。
