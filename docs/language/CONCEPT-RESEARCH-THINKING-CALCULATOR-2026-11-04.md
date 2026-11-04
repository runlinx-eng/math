# 数学思维研究缺口：计算器与估算核对

核查日期：2026-11-04。两节点均为来源中的数学思维节点，不加入 537 个知识点解释卡，也不修改 `hasResearch=false` 或补造 MP 标签。下面是课程与教学资料的有限核查，以及本地代码和任务的范围对照，不是学习效果研究或独立数学验收。

## 可追溯资料

- [新南威尔士州教育部门：Numeracy guide 3–8](https://education.nsw.gov.au/content/dam/main-education/en/home/teaching-and-learning/curriculum/literacy-and-numeracy/resources-for-schools/guides/numeracy-guide-3-8.pdf)：将选择心算、书写或计算器策略，与估算检查加减问题、包括金额问题的合理性相联系。该资料支持设计方向，不证明某一种方法对每个孩子都更有效。
- [新南威尔士州教育部门：Flexible strategies, multiplicative thinking, part 4](https://education.nsw.gov.au/content/dam/main-education/en/home/teaching-and-learning/curriculum/literacy-and-numeracy/teaching-and-learning-resources/numeracy/flexible-strategies-multiplicative-part-4.pdf)：提出利用估算检查积与商的合理性、使用计算器核对，以及比较不同方法。估算接近不能证明精确结果正确。
- [新南威尔士州教育部门：Broken calculator](https://education.nsw.gov.au/teaching-and-learning/curriculum/mathematics/mathematics-curriculum-resources-k-12/thinking-mathematically-resources/mathematics-s2-s3-broken-calculator)：提供以计算器、不同算式和记录思路探索运算关系的教学情境；不等同本项目具体任务经过实证检验。

## 来源目标、实际活动与证据边界

| 来源节点 | 来源目标和项目活动 | 当前可观察记录 | 不应推断 |
|---|---|---|---|
| `mt_FVVSQR9vGg` 用计算器检查金额 | `moneycalc` 保留澳元购物金额，先估再计算 $4.85＋$12.30＋$7.95＝$25.10，并以 $10－$6.45＝$3.55 检查找零；第三题计算 6×$3.95。 | `b33-model.js` 记录估计、输入式、运行结果和历史；有效式要求运算、结果及当前输入匹配；来源自由理由未自动评判。 | 不证明真实硬币使用、实际心算方法、对不同策略的效率判断或一般掌握。来源希望比较策略，实际第三题不能自动核实为何选择某方法。 |
| `mt_ish_uH8vZe` 合理使用计算器 | `calculator39` 先估 1468＋2975＋813 再核对 5256；对 400×3 与 387×46 选择计算方式；对 83×5 的候选 4150 先估再检查。 | `b39-model.js` 保留估计及运行历史；计算题检查指定范围内的当前估计、匹配的最新输入和结果；方法选择为计算器时要求对应算式运行，其余方法的实际过程不自动核实。 | 选择“心算”或“书写”不证明实际采用；4150不合理支持重新核对，不足以唯一确定错误来自按键；自由解释、真实工具使用和一般能力未评。 |

这两个节点的已有活动文案分别见 `dist/learning/phase5/b33.js`、`dist/learning/phase5/b39.js`；任务目标及有限覆盖见 `docs/phase5/coverage.json`。数学思维的来源标签和真实边界以 `docs/spatial-learning/THINKING-SOURCE-MAP.md` 为准。独立数学教研、真实儿童理解和迁移验证均未完成。

## 技术检查

研究台账、解释覆盖及清单专项测试 31 项通过；加入数学思维反馈与来源映射测试后共 36 项通过、1 项失败。失败项为 `thinking-source-map.json` 生成检查过期，与本轮开始前完整测试的失败项一致；未将其视为本次来源核查通过的证据。
