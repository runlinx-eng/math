# B28 研究与适配

2026-10-27，固定来源版本 a8719737ff86ef7940ba5feca11940de1204103e。本批22个节点、66项源目标中，20个节点有上游教学研究，2个没有：mt_e7tLi9SCIE（更小单位与分辨率）和 mt_SOM6Imm2sO（刻度之间读数）。原始目标、研究与依赖保存在 source-review.json；不改写原库。上游历史核验标记不等于本次重查全部引文。

## 补充一：更小单位与分辨率

目标是在同一长度、质量或容量上比较不同大小的均匀单位；前提是理解相同单位端对端迭代和数量守恒。[Illustrative Mathematics 的同物不同单位活动](https://cms-assets.illustrativemathematics.org/mskf3u6g225lzqn9yc4cy3f5xt7l)提供相同长度使用不同单位时数量改变的教学情境；[其测量任务](https://tasks.illustrativemathematics.org/content-standards/MD/1/A/2/tasks/688)说明相同单位铺满时不留空隙和重叠。[NIST 对分辨率的定义](https://www.itl.nist.gov/div898/handbook/mpc/section4/mpc451.htm)涉及区分较小变化的能力，而不是保证测得更准确。

本地设计让孩子先用较大的完整单位摆到放不下为止，再换小单位，观察数量与未覆盖部分；另用模拟小勺装满大杯装不下的容器，并用质量条比较。可能误区包括“大单位数量一定更多”“剩余被直接忽略”和“单位变小就一定准确”。反馈指出剩余，实际操作与记录分别保存，首次错误保留。小单位只可能改善该模型的分辨率；真实准确度还受工具、校准、零点、对齐和读数影响。自由解释、真实勺具或砝码操作没有自动评估。

## 补充二：刻度之间与数字读数

目标是先识别相邻标注之间的间隔，再按指针或液面的相对位置读数并带单位；前提是理解等间距数轴及小数。[OpenStax 的测量与读数讨论](https://openstax.org/books/physics/pages/1-3-the-language-of-physics-physical-quantities-and-units)使用介于刻度间的长度示例说明读数需要估计；[NIST 的教学米尺](https://www.nist.gov/publications/nist-special-publication-376-metric-ruler)展示厘米与毫米的分度。它们支持刻度与分辨率的数学说明，并不证明本界面的教学效果。

本地固定实例将指针放在400/600 g正中、液面放在150/200 mL正中及22/24 ℃正中；另画出12.7 cm的毫米刻度和01:26.4数字秒表。用户分别记录500 g、175 mL、23 ℃、12.7 cm和86.4秒；最后一种是同一时长的等价表示。常见错误是按刻线编号直接数、把两个标注之间误当1、忽略单位，或把分秒直接拼成小数。错误提交与后续修改分开记录；这些有限读数不代表对所有仪器或现实测量的掌握。

## 换算、近似与测量记录

[NIST 换算表](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8)列出1英寸恰好2.54厘米，并列出英制与美制容量的不同换算关系。按源目标使用1英寸约2.5厘米、1千克约2.2磅、1升约1.75**英制**品脱以及5英里约8千米作为近似，均在活动中标“约”；美制液体品脱不同。数量条使用题目给出的近似关系，不能被当作精密换算仪。

点图使用预设模拟长度，先逐个从尺上取最近的整数、二分之一、四分之一或八分之一，再由这些记录放点；加总要把重复值重复相加。模拟对象不是实际同学、植物或真实调查。原项目 Marble Builder 的 Bee Builder 已在独立浏览器打开并进入交互；借鉴其同尺度比较和无空隙表示，截图见 verification/phase5/B28/bee-example.png。参考资料支持数学与设计依据，不证明孩子已经学会。
