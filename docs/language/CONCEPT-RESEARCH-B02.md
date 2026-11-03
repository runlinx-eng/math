# B02 教学研究依据核查：估计容积

核查日期：2026-11-03
工作分支：feat/language-concept-audit-v1
研究批次：B02（原计划 Phase 4）
状态：**外部来源核查与解释初稿完成；AI自检完成，独立数学复核待完成；儿童理解尚未测试。**

## 一、范围与结论

本批核查一个无解释样板的知识地图节点：

- mt_NSC3LT_-ch「估计容积」：PROCEDURAL，9–10岁，Measurement。

源目标要求孩子判断杯子容量的合理量级、用 1 升瓶作参照估计水壶容量并实际装水验证，以及区分容器容量与当前液体量。英国 Year 5 国家课程直接包含“估计体积与容量（例如使用水）”；新西兰课程资源、NZCER 测评任务和 Year 5 教学方案提供了具体的参照物、估计—测量活动与常见误区。两项研究资料分别支持测量估计的量级映射思路，以及不同估计任务形式会影响估计准确度。

本批**只完成外部研究依据核查和内容边界设计**：研究核查阶段没有创建解释样板；后续授权施工已完成对应解释初稿，没有修改节点名称、ID、关系、空间坐标或学习记录，也没有进入492个缺失解释的批量施工。taxonomy 的 hasResearch=false 保持原值。

## 二、来源目录

| ID | 来源 | 类型 | 对本节点的支持 | 限制 |
|---|---|---|---|---|
| SRC-01 | [England National Curriculum — Year 5 Measurement](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study) | 官方课程标准 | Year 5 要求估计体积与容量，例如使用水；也包含升与毫升的单位转换 | 规定课程范围，不证明某种教学方式有效 |
| SRC-02 | [New Zealand Curriculum — Morning tea volumes](https://newzealandcurriculum.tahurangi.education.govt.nz/morning-tea-volumes/5637166546.p) | 官方课程资源 | 要求估计并准确测量升和毫升；建立 1 L、10 mL 的量感，使用日常容器作参照并练习读刻度 | 课程活动资源，不是对照实验；其部分术语把 volume 与 capacity 互换使用 |
| SRC-03 | [NZCER Assessment Resource Banks — How many millilitres?](https://arbs.nzcer.org.nz/resources/how-many-millilitres) | 评估任务 | 先估计容器容量，再装水并用带 100 mL 刻度的 1 L 量杯测量 | 形成性测评任务，不证明单次活动能提升学习效果；100 mL 刻度不适合精确验证 30 mL |
| SRC-04 | [White Rose Year 5 Scheme of Learning — Estimate capacity](https://assets.whiteroseeducation.com/new-schemes/Y5%20Summer%20Term%20Scheme%20of%20Learning.pdf) | 教学方案 | 用 330 mL 饮料罐、2 L 瓶等熟悉物体建立参照；明确区分容器容量和当前液体量；指出不能只凭水位高度判断容量 | 教学方案，不是实证研究 |
| SRC-05 | [Weiher — Framework for the Parallelized Development of Estimation Tasks for Length, Area, Capacity, and Volume in Primary School](https://doi.org/10.31756/jrsmte.212)（2019） | 同行评审试点研究 | 137 名三、四年级学生完成不同类型的长度、面积、容量和体积估计任务；估计偏差会随测量属性和任务形式变化 | 估计测评试点，不是教学干预；不能证明某一种教学流程有效 |
| SRC-06 | [Joram, Subrahmanyam & Gelman — Measurement Estimation: Learning to Map the Route from Number to Quantity and Back](https://doi.org/10.3102/00346543068004413)（1998） | 同行评审研究综述 | 将测量估计解释为数字单位与心理量感之间的映射；指出只记住孤立参照物不够，还要理解测量刻度和单位系统 | 广义测量估计综述，不专门研究升/毫升容量或本节点年龄段 |

## 三、来源目标与教学边界

**来源描述：** 用已知量作比较，估计容器以升和毫升表示的容量，再通过装水验证；区分容器能装的量与其中现有液体的体积。固体体积用 1 cm³ 小正方体估计，属于另一个“数单位立方体”节点，不并入本节点。

**必须覆盖的三个源目标：**

1. 判断普通杯子的容量更接近 30 mL、300 mL 还是 3 L，并说明量级依据。
2. 以 1 L 瓶为参照估计水壶容量，再实际装水测量验证。
3. 解释一个 1 L 水壶即使只装了一半水，容量仍为 1 L，而当前水量为 500 mL。

**核心概念区分：**

- 容器容量：容器装到约定的装满线时，最多能容纳多少。
- 当前液体量：此刻容器里实际有多少液体。
- 因此，半满的 1 L 水壶，容量是 1 L，当前液体量是 500 mL。
- 不同课程体系有时会把 volume 和 capacity 交替使用；本节点必须遵守来源 description 的明确区分，不把两个量混为一谈。

## 四、研究支持与设计判断

1. **先建立参照物，再估计。** 330 mL 饮料罐、1 L 瓶和 2 L 瓶能帮助孩子建立可比较的容量量级。估计不是随意猜数，而是把未知容器与熟悉的量作比较。
2. **估计之后必须验证。** 先给出估计，再装水倒入量杯测量；容器超过量杯容量时，重复倒量并累加。测量刻度必须适合当前量级：100 mL 刻度可以核对数百毫升的容器，但不能精确验证 30 mL。
3. **不能只看高度。** 同样的液体量放进高而窄、矮而宽的容器，水位高度不同；同样水位高度也不代表容量相同。需要比较容器内部空间，不能把水位高度当作容量。
4. **建立量感而非背孤立答案。** 研究综述支持数字单位与心理量级之间建立联系；137 名学生的试点测评显示估计准确度受任务形式影响。因此应更换容器形状、已装液量和参照物，让孩子解释估计依据。
5. **保持范围边界。** 本节点关注液体容器容量及升/毫升，不提前加入用立方厘米方块估计固体体积的内容。

## 五、真实关系边界

- 硬前置：mt_6oxQPNLHNv「带测量单位的计算」。
- 软前置：mt_mFJ-2ZF6Tk「估算与比较金额」。
- 软后续：mt_IuHa5UI5od。
- mt_zkFbMLpu3U「比较容积」是较早的相邻知识点，可作背景参照，但不是本节点的直接关系边。
- 不新增任何前置或后续关系。

## 六、未来解释样板的验收证据

- 孩子能为陌生容器选择合理的单位和量级，并用熟悉参照物解释估计。
- 孩子能用 1 L 瓶估计水壶容量，再装水测量验证。
- 容器超过量杯量程时，能重复测量并累加。
- 孩子能解释半满的 1 L 水壶容量仍为 1 L，当前水量为 500 mL。
- 换成不同形状容器或改变已有液量后，仍能区分容量与当前液体量，并说明如何验证。

## 七、验收状态边界

| 项目 | 状态 |
|---|---|
| 源 description、3项 evidence、assessmentPrompt、年龄与课程标准核对 | 完成 |
| 外部来源核查 | 完成，6项来源 |
| 教学范围与风险边界 | 完成 |
| 解释样板起草 | 已完成（AI自检）；独立数学复核待完成 |
| 独立数学教研复核 | 未完成 |
| 人工页面/图示审查 | 尚无样板，不适用 |
| 儿童理解与迁移测试 | 未完成 |

下一批按原计划从 B03「二分之一、四分之一与八分之一」开始。
