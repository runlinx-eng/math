# #341｜B 线 308 道已有测试证据复用验收（不重复跑测试）

**结论（2026-11-21）：B 92 个候选家族／308 个不同原生题位的已有候选工程证据，准予在后续中央整合中直接复用；不要求为此前未做第二套独立 Python 数学抽查的 298 题，逐题重跑同类测试。** 这不是批准严格 A；正式 A 仍为 main **813/1996，本轮新增 0**。

## 核对的既有执行证据

- B 交接 92 家族／308 题位，来自 [#341 固定交接](https://github.com/runlinx-eng/math/tree/3c4801f969f09a98c9f2bc4ed2f1cb953adbd530/docs/math-parallel/issue-341-handoff-335) 97 个记录中的 B 子集；全部有冻结候选提交、原题 nodeId、完整任务 SHA256、补丁与原始开发回执。
- [中央候选 HEAD `0cafdaed`，CI run #44909628782](https://github.com/runlinx-eng/math/actions/runs/44909628782) 的 **113 家族 Node 总计 598/598 PASS**，**12/12 Chromium 分片 success**，P10 success，97/97 补丁独立 worktree replay success；另 [Required #44909628766](https://github.com/runlinx-eng/math/actions/runs/44909628766)、[P8 #44909628795](https://github.com/runlinx-eng/math/actions/runs/44909628795) 均 success。598 是 **113 家族合计**，不得冒称 B 单独 598。
- 中央 14 份 Artifact 已有独立 SHA256/CRC/JSON/原始状态/PNG 完整性核验，B 全部 308 个原生位置均有原始错→对 Check 与 State-v2/离线恢复证据，**本次不下载重验、不重新执行这些测试**。
- 先前 B 特殊导航 28 个目标经新隔离 PR #345/#346/#347 真正原始前题 Check 和 Next 补完，现 **28/28 PASS、seeded-only=0**；没有重复浏览器测试其他已通过题。

## 本次只读检查：92 份 Node 单测 + 92 份候选 replay 源码

按固定提交逐个读取全部 **92 个 `.test.mjs` 与 92 个 `-evidence.js`**，逐项与冻结交接源及 308 行台账对齐（不运行测试），结论：

| 现有证据门禁 | 已核文件数 |
|---|---:|
| 完整原生题绑定及 frozen task/source 形状检查 | 92/92 |
| `sameEvidence` 严格原始任务／模型绑定 | 92/92 |
| `latestSubmissionMatches` 最新真实 Check 绑定 | 92/92 |
| 与原模型 `inspect` 协作、具数学 replay 的候选模块 | 92/92 |
| 代码包含不合格证据拒绝路径、Node 测试含 null 断言及有效结果断言 | 92/92 |
| 单测文件、原 Chromium 文件、数学证据模块齐全 | 92/92 |
| 明确使用原模型 `history` 字段的模块 | 91/92；P091 特殊边界见下 |

源码静态出现的 **348 个 `test(...)` 声明不等于仅执行 348 个测试**：其中 **24 个家族、涉及 183 个原生位置**采用按源题循环生成动态测试。以 Actions 中实际执行回执 **598/598** 为准。测试标题的词面扫描如果找不到“latest”或“bridge”，**不能凭此判定覆盖缺失**：共享 `matchesNativeEvidenceTask` 对原生来源和 bridge/practice 会 fail closed，`latestSubmissionMatches` 检查最后一个原始尝试，Node 文件里也确有拒绝与正确断言。

**特别边界 P091 `allowedrange:0/1`：** 原来记录有每次 probe 的真假结果、当前端点状态，但没有完整保存当时图形的位置历史；证据适配器只断言实际可观察到的 probe 判断和当前状态，没有声称重建未记录的移动轨迹。这个**有界证明限制**继续保留，不以新增浏览器测试伪造过去的历史；未来若扩大数学证明范围，才需另行设计证据或更改合同。

## 更新验收裁决（仅候选工程证据）

- **308/308**：记 `EXISTING_EVIDENCE_REUSE_ACCEPTED`，表示可直接复用开发期数学 replay、错误拒绝、原 Check、状态保存及中央固定 HEAD CI/Artifact；**不代表每个数学反例都已穷尽，更不代表严格 A 完整批准**。
- **需要重跑现有 308 题原测试：0**。**目前静态清查没有发现某题缺源/缺原 Check/缺数学 replay/缺已运行浏览器文件的具体缺口**。以后如在来源合同审阅或公共集成时发现冲突，仅对该位置补定向测试；不要把“未做第二套独立算术抽查”的 298 题列成统一测试阻断。
- **仍需完成的工作**：以已有证据判定每个候选数学主张的可接受范围（特别是不可观察的历史、策略和儿童理解不可外推）；由中央单写入者处理 `evidence-adapters`、`thinking-feedback`、manifest 等共享接入；只在**集成后发生变化的 exact HEAD** 运行正式适用 CI/Artifact，正式合并后新 main Required/Fallback 双验。用户已禁止擅自合并 main、授 A、部署 VPS；本轮完全遵守。
- 早前台账中的 `PENDING_ITEM_MATH_ADJUDICATION` 及 298 道“未另做独立数值 spotcheck”**保留为事实统计**，但不能据此要求全部重测或撤销 B 线既有测试合格的工程证据。

逐家族 92 个源文件、测试文件、冻结提交、原生位置及 308 行可机读结论见 [B 308 证据复用矩阵](./b-existing-evidence-reuse-308.json)。本报告不是新的结果测试回执，不含伪造的 pass 数或新增的 A。
