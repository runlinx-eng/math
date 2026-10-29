# B11 依据与边界

2026-10-26。固定上游为 `a8719737ff86ef7940ba5feca11940de1204103e`。本批23个源节点均有已有教学研究，没有新增研究缺口补充。72个源目标逐项映射到86个节点任务；映射表示这些有限活动与目标的对应，不表示全部目标已经达成。

[source-review.json](source-review.json) 保存所用 topic 与 research 全记录，并给出原始 JSON 指针。已逐条核对：23份副本与固定版本的 `topics.json`、`teaching-research.json` 对应位置完全相同。没有改动上游数据。目标映射见 [phase5-b11-goals.mjs](../../../scripts/phase5-b11-goals.mjs)，累计覆盖由阶段5生成器生成。

本批复核了已有研究的教学摘要、学习约束和复核备注。上游研究本身是代理整理的教学建议；历史 `verified` 字段不等于本轮重新核实了外部文献。本轮不声称重新访问全部参考资料，也不把这些建议当作已验证本产品有效的证据。继续采用已固定的 Marble Builder 制作方法；本批运行了 Hidden Cubes 示例，并参考其把构造、预测、帮助与独立证据分开的做法。二维数位格和路径服务于本次数量关系，三维全景继续承担空间导航；不沿用上游早期“3D没有价值”一类无证据的绝对判断。

## 来源索引

下面的 topic 指针相对于 `vendor/os-taxonomy/data/topics.json`，research 指针相对于 `vendor/os-taxonomy/data/teaching-research.json`。

| 本地活动 | 源节点 | topic 指针 | research 指针 |
| --- | --- | --- | --- |
| onesbridge | mt_AKAtWEwpcj | /topics/649 | /records/218 |
| tensmove | mt_I5j1ZWo2cn | /topics/637 | /records/471 |
| decadetake | mt_HJTuIGHvcR | /topics/651 | /records/448 |
| twodigitpair | mt_UQnAFPs83F | /topics/639 | /records/858 |
| addhundred | mt_glPPG-kTQY | /topics/640 | /records/410 |
| flexhundred | mt_cChv2j_-Da | /topics/660 | /records/275 |
| oneslarge | mt_oDU_8zMZjp | /topics/662 | /records/672 |
| tenslarge | mt_aHQ9kNt3is | /topics/664 | /records/214 |
| hundredsmove | mt_xPqczp7zPX | /topics/663 | /records/956 |
| showwhy | mt_zxST3MarI9 | /topics/657 | /records/1048 |
| fourparts | mt_TiQbi027PE | /topics/656 | /records/823 |
| buildthousand | mt_ewmuMMPAzP | /topics/658 | /records/351 |
| columnthree | mt_SrrsLiJkr3 | /topics/655 | /records/801 |
| flexthousand | mt_HFRYjTb-Z5 | /topics/669 | /records/441 |
| columnfour | mt_mpS-JK_p_m | /topics/668 | /records/619 |
| columnlarge | mt_Yw1_4Nfsql | /topics/674 | /records/1004 |
| decimalsum | mt_JH_6RpNWjr | /topics/677 | /records/520 |
| storymoney | mt_wzAZ8qFDc4 | /topics/650 | /records/930 |
| storylarger | mt_-F_Lv_apzH | /topics/672 | /records/23 |
| storymillion | mt_M1tnXqmYbn | /topics/676 | /records/594 |
| mentalbig | mt_MWXPiaTnEu | /topics/675 | /records/631 |
| checkrough | mt_QaYfeVL-0C | /topics/659 | /records/726 |
| checkpurpose | mt_G3sVFQNCme | /topics/673 | /records/396 |

## 采用的教学约束

- **先看到交换，再给名称。** 合并或取走同一种单位；十份小单位才换一份大单位，反向拆分也守恒。34+27、402−137、4002−1367、500000−234178分别覆盖进位、跨零及连续跨零。不是看一张已算完的图就算操作完成。
- **同时提供跨界与不跨界。** 43+5与36+7、345+3与398+7、345+40与372+40对照。“只改变个位／十位”只在没有向高位交换时成立。整百专题保留在千以内，不因加大数值而改变其约束。
- **允许合理的不同计算办法。** 自选路径须有一致的每步变化与落点；凑整只是可用办法。四堆先合哪两堆可以自己选，既有整十配对，也有不容易配整的例子。补偿任务需要把多走的量反向补回，不能把“多加了”又解释成继续加。
- **小数仍按单位对齐。** 3.4与2.78保留不同长度的原标签，4在十分位、8在百分位；5.03−2.67处理空十分位，4.9−4.11对照“写得长不一定大”。运算内部使用整数百分之一，显示格式不决定数量关系，也不表示所有小数都必须写两位。
- **故事跟住中间量和真正的问题。** 35−12+5必须做完两步；25000目标问题逐次更新“还差多少”，不把已收集的20822当最终答案。32枚“比对方多8枚”反求对方，避免按“多”字机械相加。金额、数量和长度均保留单位；自编账本及回收情境标注为模拟。
- **先估，再精算，最后独立核对。** 估计先提交；相反运算与原式重算区分。远离保证范围的结果可以排除，在范围内却不证明精确。精度取决于本题要求，不能推成“位数越多越好”。

## 原资料中的修正与范围处理

1. 保留来源定义，但不传播无条件的“只有某一个数位改变”。活动用真实进位反例显示高位可能一起变化。
2. 上游学习备注已经指出：12340+8706+15058虽然等于36104，却没有任何一列需要进2。本地采用该备注给出的替代例36489+27858+15937=80284，并复算其个位合计24、百位含进位合计22、千位含进位合计20。它用于展示多个进位，不声称这个具体例子的学习效果已经验证。
3. 原有“3421远小于约50000”的表现标准没有给加数。本地补出24378+25621，使估计与排除理由可核查，而不是孤立判断一个答案。
4. `checkrough` 的源条目有6个表现目标，后3项重复前3项的舍入、互逆、合理性主题。6项均保留映射，不据此重复计算节点或增加虚构任务。
5. `storylarger` 的硬前置 `mt_CDa5AVakLE` 尚未制作。该节点先提供35−12+5的可操作两步准备；不给该前置虚构完成状态，也不安排空跳转。批次顺序仍是制作顺序，不能当作孩子必须依次学习的先修链。

## 尚未自动评估的部分

屏幕操作不能确认孩子是否心算、是否已经流利或能处理全范围题目；有限正确结果不等于长期掌握。查看帮助、第一次输入、纠错反馈和修改过程均应保留，帮助后的完成与首次独立操作分开。

数位格里的对齐和筹码交换后，标为 `written` 的任务要求孩子逐列输入结果数字，保留零占位及需要的小数末尾零。它没有独立检验手写排版、完整进退位记号，或脱离教具的标准算法，不能称为完整标准笔算已经熟练。原有元认知目标要求孩子说明“为什么”；这里只保存总结与解释，数值通过不代表论证通过。

故事按已给出的事件顺序逐件执行。它检查运算选择、数量、中间结果和最终问题，但未要求孩子从未拆分的新故事自行建立完整计划。选择“心里想／写下来／工具”是孩子的自述，既不自动判方法优劣，也不证明实际用了工具。部分故事有先行子问题估计，尚未逐步建立每个中间量的独立估计和最终合理性论证。

所有实际使用效果仍待孩子试用。没有基于自动测试声称喜欢、理解、独立完成纸笔任务或真实隔天续学已经成立。
