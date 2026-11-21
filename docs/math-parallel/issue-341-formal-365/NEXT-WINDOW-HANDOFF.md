# 数学项目 #341｜新窗口中央验收交接（2026-11-21）

> **唯一接续入口。** 下个窗口先读本文件和 [#341 最新交接评论](https://github.com/runlinx-eng/math/issues/341#issuecomment-7065150449)，再核对 GitHub 实时分支与 CI；优先**接着做尚缺的共享集成准备**，不要从开发测试重来。本文是交接，不是授权合并或正式授 A。

## 1. 当前已经核实的状态

| 项目 | 接续结论 |
|---|---|
| 正式受保护主线 | `main@f4be9f88da7af59b6df1819ae242cf134591c376`；strict **A813/1996**，本批新增 A **0** |
| 冻结交接 | `3c4801f969f09a98c9f2bc4ed2f1cb953adbd530`；原补丁基线 `f4be9f88...` |
| 中央候选 | **113 家族 / 365 个互异原生题位**：P007 16 家族/30 题；P009 5 家族/27 题；B 92 家族/308 题 |
| PR #344 | `0cafdaed5aad3d32bf09ab1d9abf6e77130a069d`；主候选集中交付，**Draft/未合并** |
| PR #345 | `96b037991fe9e4fbc2c11b7fd95a944de119ce06`；原生导航专审，**Draft/未合并** |
| PR #346 | `80383841b2b96d81930b387167a6b01aeaa5b732`；P111/112/113 7 道导航，**Draft/未合并** |
| PR #347 | `d714f206371261fda35bbc4d64fa17a0232b89cc`；P117 连续八前题，**Draft/未合并** |
| PR #348 | `d0b9bf929d0ddf7fcce23601cff27ff9dc0e320e`；365 道只读来源锁定，**Draft/未合并** |
| GitHub 台账分支 | `audit/issue-341-formal-365-20261121`；所有本轮审计文档与逐题台账均在此，**不在 main** |

最近实际复核（新窗口启动前须再次拉取 GitHub 核实是否有变化）：#344–#348 全部 Draft 且未合并；main 仍如上；审计分支 JSON 为 **365 个去重题位**、**B 308 已接受原工程证据**、**28/28 重点原生导航**、**365/365 源锁定成功**、**0 题正式新授 A**。

## 2. 已通过的测试与证据——不得重复或覆盖

- 中央已通过的原测试：固定候选 HEAD `0cafdaed...`，[Actions #44909628782](https://github.com/runlinx-eng/math/actions/runs/44909628782) 的 **113 家族合计 Node 598/598 PASS**、Chromium **12/12 分片成功**、P10 成功、97/97 冻结补丁独立复演成功；[Required #44909628766](https://github.com/runlinx-eng/math/actions/runs/44909628766) 与 [P8 #44909628795](https://github.com/runlinx-eng/math/actions/runs/44909628795) 成功。**598 不是 B 独立计数**。
- 365/365 原始 Check/State-v2/SW/归档证据已有中央检查及 14 ZIP 独立校验。**B 92 家族/308 题的已有候选工程证据在中央已接收复用**，不要求把另外 **298 道**重新跑一套同类数学/浏览器测试。之前 B **10 道**做过额外有界数值复核；`298` 是“没有额外独立 Python 抽查”的统计，不是强制重测清单。
- 重点原生导航先后通过 [#44914189031](https://github.com/runlinx-eng/math/actions/runs/44914189031)、[#44916312166](https://github.com/runlinx-eng/math/actions/runs/44916312166)、[#44916741741](https://github.com/runlinx-eng/math/actions/runs/44916741741)，**28/28 完整原生前题 Check→Next**，seeded-only=0。相关 Required 已通过。历史失败轮次（例如 #44916179044 P113 B10 控件夹具失配）不覆盖、不删除。
- 原先独立有界算术/几何复核 **67/365**：P007 30、P009 27、B 10。它们不等于授予 67 道正式 A，也不构成要求补测另外 298 道的理由。
- 来源锁定：新 [Draft PR #348](https://github.com/runlinx-eng/math/pull/348) exact HEAD `d0b9bf929d0ddf7fcce23601cff27ff9dc0e320e`，[只读专用 #44920634904](https://github.com/runlinx-eng/math/actions/runs/44920634904) **success**，[Required #44920634864](https://github.com/runlinx-eng/math/actions/runs/44920634864) **success**（非定向 browser 矩阵 skipped，非全量重跑）。原生 nodeId/full task SHA256 **365/365** 匹配，113 家族真实候选 binding 导出可导入，365 题各仅匹配对应候选，和现有正式 **813** 题位及已登记 adapter 均 **0 冲突**；`errors:[]`。首轮新审计脚本语法错误 [#44920568201](https://github.com/runlinx-eng/math/actions/runs/44920568201) **FAIL**，已修且原回执保留。
- 正式 [`docs/spatial-learning/evidence-review-manifest.json`](https://github.com/runlinx-eng/math/blob/f4be9f88da7af59b6df1819ae242cf134591c376/docs/spatial-learning/evidence-review-manifest.json) 与 `dist/learning/evidence-adapters.js` 的 main/blob、审计分支与预检分支内容一致；813 A 一条没加。CI 的 `UNAPPROVED-proposed-manifest.json` **不是**已审核的 manifest。

## 3. 已写入的接续文件（不需要重新生成）

- [365 道正式逐题台账 JSON](./issue-341-formal-365-intake.json)；[同步 365 行 CSV](./issue-341-formal-365-intake.csv)。所有 `formalStrictA=NOT_GRANTED`。
- [B 92 家族／308 道已有证据复用矩阵](./b-existing-evidence-reuse-308.json) 与 [裁决报告](./b-existing-evidence-reuse-308.md)：`EXISTING_EVIDENCE_REUSE_ACCEPTED_PENDING_FORMAL_INTEGRATION` 仅表示**候选工程证据可继续使用**，不是最终数学准入。
- [2026-11-21 新来源锁定与第一批数学范围报告](./20261121-preintegration-source-lock-and-first-12-scopes.md)；[113 个精确 Binding/Replay/Submitted 导出](./staging-integration/exports-all-113.json)；[813 vs 365 静态冲突对照](./staging-integration/approved-manifest-collision-precheck.json)。
- [B 第 1 批 5 家族 12 道数学可观察边界](./b-first-12-observable-contract-review.json)：P105 3、P107 2、P109 3、P116 2、P091 2；其中 P091 `allowedrange:0/1` 仅保存 probe 结果/当前端点，**未保存每次历史图形位置和样式**，不得据此声称重建历史操作。
- [B 第 1 批 5 家族／12 道**不生效**集成提案](./b-first-12-INACTIVE-integration-proposal.json)：明确 `NOT_APPROVED_NOT_RUNTIME_REGISTERED`；只列真实 type、绑定/重放/提交导出及 nodeId/完整 taskHash。不能直接粘贴进正式 manifest。
- #341 最近中央交接评论：[证据复用](https://github.com/runlinx-eng/math/issues/341#issuecomment-7064965599)、[来源锁定与 first12](https://github.com/runlinx-eng/math/issues/341#issuecomment-7065150449)。#342 是 A 线历史交接，#343 是 B 线本机历史进度；对 #341 已经实收的 365 道以最新中央台账为准，不回退成“未上传”。

## 4. 新窗口要真正继续做什么（从这里开始）

1. **先只读复核**本交接、#341 最新评论、#344–#348 各自 Draft HEAD、`main`、专用 CI/Required 最终状态与 365 行台账。若无变化，**绝不重测旧的 598 Node/12 Chromium、28 导航，或把“298 未再做 Python”当成 298 项任务**。
2. **推进数学合同范围审阅，不重写数学测试**：从已有第一批 P091/P105/P107/P109/P116（12 题）向下一批家族扩展，仅用现有冻结题、Node 合同、replay、原 Check、Artifact 确认“观察得到的数学事实”和“不能推断的能力/历史/开放式解释”，逐家族/逐题记录真实遗漏。确有具体矛盾或证据丢失再做定向补测。
3. **准备中央单写入者的隔离共享集成**：以已标注 **INACTIVE** 的 5 家族 12 道试点为基础，先审核反馈文字/数学方法标签的证据边界，设计 `evidence-adapters.js`、`thinking-feedback.js`、独立审批 `evidence-review-manifest.json` 的最小集成差异。**未经正式范围批准不得自动把 365 条写入正式 manifest、不得授 A**。变更只在隔离 Draft、不得污染既有候选 HEAD。
4. 对**实际变更后的 exact HEAD** 执行适用的正式静态/Node/Chromium/P10/Artifact/Required 门禁；不要把 #348 来源锁定 CI 当作已完成共享集成后的整体验收。未来若有合规的主线合并，必须再做**新 main Required/Fallback 双验**，但当前**不擅自合并 main**。
5. 每完成一批，在本分支**更新 JSON、CSV、README、范围/隔离集成提案**，再将可核对的 commit、CI URL、PASS/FAIL 及仍未完成项写进 **#341**。**不删除旧 FAIL、不改历史回执**。

## 5. 禁令与留存提醒

- **禁止：** 擅自合并 main、授正式 A、修改原题/原判题器/原状态或 SW、部署 VPS、降低 Required/Fallback 门禁、把从未记录过的儿童操作/自由思考写成事实、无缺口重复执行已通过测试。
- **正式 A813/1996 永远以真实 main + 被审核的 manifest 为准**。新分支上 CI PASS、候选有界 evidence PASS 或复用裁决都不是 A。
- 2026-11-28 左右部分 Actions Artifact 7 天留存期届满，尤其 #348 的 Artifact `14713850524` 到期 **2026-11-28 15:42:55 UTC**；其他 P111–P117 原生导航 ZIP 同期到期。下一窗口应优先核对项目已有归档是否覆盖相关 ZIP，若未覆盖，只按项目正式规则**保存现有原件**，不要为续期而重跑已过测试。

## 6. 可直接复制到新窗口的任务

> 接手数学项目 #341 中央验收。先读取 GitHub `audit/issue-341-formal-365-20261121/docs/math-parallel/issue-341-formal-365/NEXT-WINDOW-HANDOFF.md` 与 #341 最新评论，核对 PR #344–#348、main 与最新 CI。接着复用 B 92 家族/308 道的已通过原始证据，切勿把 298 道未额外 Python 抽查作为统一重测任务。365/365 来源锁定、28/28 原生导航及既有 CI PASS 均保留。优先从第一批 B 5 家族/12 道不生效集成提案继续审数学证明边界与反馈文字，再推进隔离 Draft 中的最小共享集成准备；仅具体缺口定向补证。不得合并 main、授 A、部署或降低门禁，严格 A 保持 813/1996，所有进展写回 #341 的机器台账和评论。
