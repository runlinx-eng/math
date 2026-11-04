# B09：四个概率研究缺口的来源和解释草稿

2026-11-03。四个节点在原 taxonomy 均为 `hasResearch=false`，该标记保持不变；已核对原始描述、evidence、评估提示、直接关系与项目活动。

外部依据：[美国统计协会 GAISE 指南](https://www.amstat.org/docs/default-source/amstat-documents/gaiseprek-12_full.pdf) 讨论独立性、概率与长期相对频率；[CCSS 7.SP.C.6](https://www.thecorestandards.org/Math/Content/7/SP/C/6/) 讨论试验频率与理论预期及有限试验的波动；[CCSS 7.SP.C.7.b](https://www.thecorestandards.org/Math/Content/7/SP/C/7/b/) 用观察频数建立可能不等概率的模型；[GAISE II](https://www.amstat.org/docs/default-source/amstat-documents/gaiseiiprek-12_full.pdf) 展示重复模拟辅助概率推断。它们是课程或专业指导，不能证明本项目的学习效果。

| 来源 ID | 来源目标与活动 | 边界 |
| --- | --- | --- |
| `mt_dlg6i-Lw0I` | `chanceindependent` 比较独立抛币及放回、不放回抽珠等情境。 | 基于题目明确的公平、独立假设；不将所有无放回事件一概判成相关，也不声称发生真实抽珠。 |
| `mt_8DT3LXwwH-` | `simulation` 每种规模重复五轮，绘制和比较实际保存的相对频率。 | 本地模拟代替外部电子表格；较长运行通常更稳定，但特定一次不保证更接近。 |
| `mt_aCwj2PCoRV` | `chancemodel` 比较等可能人群与给定杯子记录，并对比骰子观察值和模型。 | 样例数据不代表现实杯子必然的概率；差异可提示进一步检查，不能单凭本活动断言偏差原因。 |
| `mt_nzdtOLXWWa` | `chancesim` 用等可能数字映射40%情境，按首次成功定义完整试验并统计相对频率。 | 使用明确的独立假设；达到运行保护上限的未完成序列不计失败，有限试验不能保证精确。 |

来源年级不决定本项目路线。独立数学复核、用户视觉验收及儿童理解测试均尚未完成。

技术验证：4 个节点在 1440×900 和 1280×720 两个视口的隔离浏览器中共 8 个场景通过，截图与结果在 `verification/concept-research-gap4-20261103/`。定向测试 89 项通过；全量 Node 测试 1136/1144，8 项失败与原始基线一致。技术验证不等于人工验收。
