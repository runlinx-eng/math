# #341 当前验收续办快照（2026-11-21，晚于下方初始记录）

**最新实际执行：重点原生导航 28/28 取得 Check→Next 或原生首题完整链；P009 27 道新增 227/227 独立有界算术核验 PASS；现有独立有界数学题位合计 59/365。** 其余 306 道尚缺独立数学合同/反例审核。以上都不是正式 strict A，main 仍 A813/1996，新增严格 A=0，#344/#345 及新 #346/#347 均保持 Draft，不合并、不动公共正式注册或部署。

[独立核验与分家族明细](./20261121-followup-navigation-and-p009-math.md) · [365 道最新 JSON](./issue-341-formal-365-intake.json) · [365 道最新 CSV](./issue-341-formal-365-intake.csv)

新专用 CI 的原始结果：P111–P113 `80383841b2b96d81930b387167a6b01aeaa5b732` 的 Chromium [run #44916312166](https://github.com/runlinx-eng/math/actions/runs/44916312166) 及 Required [#44916312157](https://github.com/runlinx-eng/math/actions/runs/44916312157) 全部 success；P117 `d714f206371261fda35bbc4d64fa17a0232b89cc` 专用 Chromium [#44916741741](https://github.com/runlinx-eng/math/actions/runs/44916741741) success，独立 ZIP SHA256/CRC、8 个前题原 Check、8 个 Next、0 次存储索引写入均已复核。P117 新 Required 以独立实际运行状态为准，不因 Chromium PASS 预填。P009 不重新执行历史成功的 Node/Chromium，新增结果完全来自已有 ZIP 的离线纯数学交叉核对。

---

> 以下为**初始 intake 记录的历史快照**（当时 20/28 原生导航、8 个缺口）。新结论请以本页最上方增量及最新 CSV/JSON 为准，保留旧文字仅为审计历史。

# #341｜365 道候选正式逐题验收入口（2026-11-21）

**状态：CENTRAL_INTAKE_RECORDED / FORMAL_A_NOT_GRANTED。** 本记录把正式审核拆到 365 个原生位置，保留已有真实通过的运行和归档结果；尚未证明 365 道全部符合严格 A 的逐题数学合同，因此不将任何一个题位授 A。审计工作只落在独立分支 `audit/issue-341-formal-365-20261121`；不修改 main、原生任务、判题器、共享 registry/feedback/manifest、PR #344/#345，也不部署。

## 输入和已独立验证的边界

- 冻结正式 `main@f4be9f88da7af59b6df1819ae242cf134591c376`；正式覆盖仍 **strict A 813/1996，新增 0**。
- 首批交接 `3c4801f969f09a98c9f2bc4ed2f1cb953adbd530`：`manifest.json` 中 97 个家族 / 335 个不同题位（B 92/308、P009 5/27）。本轮逐份读取原始 97 个 `receipts/*.json` 中的实际 source `nodeId` 和完整 `taskHash`，与 manifest 的固定候选提交及逐题清单校验。P117 回执原始字段格式不同（单题 `position/node/taskHash`），按原始字段显式归一化，不丢失该题。
- P007 16 家族 / 30 个原生题位：从 #342 开发收尾的 16 个固定候选 HEAD 与 #344 候选证据模块中的原生 `nodeId` / `task SHA256` 逐一组成清单。三组去重后 **113 个家族、365 个唯一题位**，按分组分别为 **30 / 27 / 308**，没有交叉位置。
- 原 [中央验收 HEAD `0cafdaed`](https://github.com/runlinx-eng/math/pull/344) 的 Node、12-shard Chromium、P10、Required、P8 与独立 14 ZIP Artifact 核验结果按原有成功记录保留。状态归档与 State-v2 一致性在 365/365 中已验，**不因建立本台账重跑**。
- P007 30 道既有的独立有界数值/几何交叉检查 **216/216 PASS**。本次又对 P116 2 道从原始存储独立核对点图频数、众数、空刻度、错误→订正原 Check 和离线模型一致性。**32 道已具备有界数学独立核验；333 道仍需逐题独立数学合同/负例审查**。32 道也尚未完成最终范围裁决和公共集成，不能冒充正式 A。

## P116 最新 exact-HEAD CI 和原件

- [原生导航 Chromium run 44914189031](https://github.com/runlinx-eng/math/actions/runs/44914189031)：`96b037991fe9e4fbc2c11b7fd95a944de119ce06`，3/3 shards `completed/success`；[Required run 44914189048](https://github.com/runlinx-eng/math/actions/runs/44914189048) `completed/success`。
- 本次独立取得上述 Chromium run 的三个新 Artifact ZIP；对应 ID 为 **14711037579**（shard0）、**14710938130**（shard1）、**14710629556**（shard2）。与 GitHub 官方 SHA-256 digest **3/3 相同**，ZIP CRC **3/3 PASS**；共 **440 个 ZIP 成员**，其中 **201 JSON、180 TXT、59 PNG**，JSON 可解析、同名原始存储与 decoded JSON 一致、PNG 能成功解码。不是使用旧 3 ZIP 冒充新复验。
- P116 `dotrecords:2` 已在真正原题导航路径 `dotrecords:0 → 原 Check 完成 → Next 到 dotrecords:1 → 填写原预绘点图的六个题目 → 原 Check 完成 → Next 到 dotrecords:2` 中证明；新报告的导航方式为 `native-next-after-correct-check`、`startingIndex:1`、`previousTaskComplete:true`，而非此前的 `seeded-only`。原生 Check、截图和源存储均保留于上述 Artifact。
- P116 的 2 个目标原生题位 `dotrecords:0` / `dotrecords:2` 另独立从 JSON 模型数得各 **20 / 10 个点**，众数皆为 **5**，空刻度分别为 **[7] / [0,4,6]**；原 wrong→correct 尝试各 2 次、离线恢复模型一致。独立数学核验只断言这些可观察的有界运算，不推断真实学生的长期能力。

## 尚存 8 道真实前置导航缺口

28 个 B 端特殊导航位置中，当前 **20/28 原生首题或完成前题后原生 Next**，仍 **8/28 `seeded-only`**：

| 包 | 题位 | 下一步真实原题证据 |
|---|---|---|
| P111 | `equations35:2` | 完成 `equations35:1` 的原生数学任务，原 Check 后合法 Next |
| P112 | `chancecalc:1`、`chancescale:1`、`chancenone:1`、`chancecomplement:1` | 各自不同会话 index0 的原生 Check，再走原生 Next |
| P113 | `tenslarge:1`、`general34:1` | 各自 index0 的原生 Check，再走原生 Next |
| P117 | `fractionfour:8` | 补 0–7 的真实前置数学流程，或正式合同明确限定并批准“直接定位”边界；不可擅自按此放行 |

这 8 道是 **导航证据缺口而非数学算法已 FAIL**。如需重新运行，只为新增的原题前置路径建隔离审计夹具，固定新 exact HEAD，成功后独立审计新 Artifact 再更新状态。旧 19 道导航和 P116 成功不重复跑。

## 分组逐题正式审查口径

- [逐题 JSON](./issue-341-formal-365-intake.json) / [逐题 CSV](./issue-341-formal-365-intake.csv) 逐位置记录 `packet / family / original position / nodeId / 64 位任务 SHA256 / immutable candidate commit / 原归档状态 / 独立数学状态 / 导航边界 / 待补条件 / formalStrictA`。
- **365/365 暂记 `NEEDS_EVIDENCE`**，含义是完整严格 A 准入所需的最终数学合同、反例裁决、公共注册和新主线双验证 **尚不齐**；不是拒绝代码、不是回滚先前 PASS，也不是把有界独立数学结果写成未运行。
- 后续优先分 P007 16 家族、P009 5 家族、B 92 家族逐题独立审原生目标与错误操作/反例，得出 `GRANT_CANDIDATE / REJECT / NEEDS_EVIDENCE` 的正式数学结论。P007b 四棱锥只接受已测的拓扑和转向按钮事件，不能额外声称摄影机朝向角度证明。
- 任何拟准入候选必须继续经过共享 `evidence-adapters`、`thinking-feedback`、manifest 等单写入者接入，以及适用 PR **exact HEAD** 正式 CI/Artifact。只有正式合并后的 **新 main Required/Fallback 独立双验** 成功，才可按 #130 更新正式覆盖。本轮 **不合并、不授 A、不动 VPS**。

## 可追踪来源

- [中央 Issue #341](https://github.com/runlinx-eng/math/issues/341)；[P007 开发 Issue #342](https://github.com/runlinx-eng/math/issues/342)；[B 线 Issue #343](https://github.com/runlinx-eng/math/issues/343)。
- [候选集成草稿 PR #344](https://github.com/runlinx-eng/math/pull/344) 与 [导航审计草稿 PR #345](https://github.com/runlinx-eng/math/pull/345) 均保留 Draft。
- [P007 216 项独立数学报告](https://github.com/runlinx-eng/math/blob/1b671c39969705ded0a7b26996d64f4c915653e6/docs/math-parallel/issue-341-p007-30-independent-math-20261121.md)、[B 原生导航 28 题旧报告](https://github.com/runlinx-eng/math/blob/cc04f1184d6b54aa3af75917cf313fb447f76337/docs/math-parallel/issue-341-b-native-navigation-28-20261121.md)，旧报告 19/28 是写作当时的真实状态，本记录按新 P116 复验升级到 20/28，不篡改历史。

**遗留证据期限：** 本次 3 份 Actions Artifact 按当前 GitHub 元数据显示将于 **2026-11-28 14:30 UTC 左右**过期。若需要长期审计，应在到期前将原 ZIP 复制到正式证据归档；GitHub 的旧收据与新审计在逻辑上分别留存。
