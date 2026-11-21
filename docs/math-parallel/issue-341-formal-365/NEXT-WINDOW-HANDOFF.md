# 数学项目 #341｜中央验收公开状态交接（2026-11-22）

## 当前公开状态：全部113家族／365道隔离共享集成代码

**本次接续范围为全部365道，不再限于 PR #350 的首批12道。** [PR #351](https://github.com/runlinx-eng/math/pull/351) 已公开相应隔离共享集成代码，源 HEAD 为 `fec2d5446c979741e3207a0c70f3e792a10eb5cf`。下列本仓库公开 workflow 均已 `completed/success`：

| 公开 workflow | 运行 | 当前公开结论 |
| --- | --- | --- |
| Required | [44927311010](https://github.com/runlinx-eng/math/actions/runs/44927311010) | success |
| P8 | [44927311025](https://github.com/runlinx-eng/math/actions/runs/44927311025) | success |
| Overview | [44927311018](https://github.com/runlinx-eng/math/actions/runs/44927311018) | success |

这里同步的是**公开代码范围与当前公开 CI 状态**，不表示独立人工正式数学准入、生产启用或发布批准。正式 A 仍为 **813**，本批新增 A **0**；独立人工批准仍 **PENDING**，生产候选仍未启用。

[逐题 JSON](./issue-341-formal-365-intake.json) 和 [逐题 CSV](./issue-341-formal-365-intake.csv) 保留全部既有公开字段与历史记录，并为365道新增 `publicCurrentStatus`、PR/HEAD、三项公开运行和未准入状态。旧 `auditDisposition`、`missingEvidence` 与其他历史字段未删除、未改写；当前公开进度以新增 `public*` 字段和本节为准。

**完整扩展验收与交接材料仍待明确的公开授权。** 本次只更新用户明确指定的 JSON、CSV 和本交接三个文件，不包含该待审扩展包。本节不把未公开的细项材料转换成已批准或已公开的证据。

## 继续推进的门槛

1. 独立人工正式数学／反馈准入。
2. 按获批来源进行生产 adapter／feedback／manifest 接入，并完成适用的 SW 与 release 集成。
3. 在实际生产启用的变更 HEAD 上完成必要 CI；当前隔离代码的公开成功不能替代后续不同 HEAD 的验收。
4. 主线合并和部署分别保留用户授权；获授权合并后，再核对新 main Required／Fallback。
5. 完整扩展材料的公开发布另待明确授权。

继续复用已经公开记录的原数学、负例、Node／Chromium和工程证据；298道没有额外 Python 抽查不是统一任务。仅对具体缺口或实际代码变更执行必要工作，不因等待一项批准而停止其他已有授权的工作。

## 下一窗口接续

> 先读本节、#341最新公开交接、PR #351及其实际源HEAD和最新公开CI，再读365道JSON／CSV中的publicCurrentStatus。继续按全部113家族365道推进，继承既有公开证据，不回退到首批试点。保留人工正式批准、生产启用、后续实际HEAD门禁和合并／部署授权边界；完整扩展材料未经明确公开授权不得发布。下方旧交接与旧复制任务仅作历史，不能覆盖本节的当前公开进度。

---

## 以下原有公开交接全文保留

# 数学项目 #341｜新窗口中央验收交接（2026-11-21）

> **唯一接续入口。** 下个窗口先读本文件和 [#341 最新交接评论](https://github.com/runlinx-eng/math/issues/341)，再核对 GitHub 实时分支与 CI；优先**接着做尚缺的共享集成准备**，不要从开发测试重来。本文是交接，不是授权合并或正式授 A。

## 0. 2026-11-22 纠偏：**先复用 B 原数学合同，停止重复审证明**（覆盖本文件旧第 4 节的扩展队列指令）

**执行裁决：B 线 92 家族/308 道已经逐家族编写来源绑定数学 replay/负例合同，做过本地 Node/Chromium/原 Check/State-v2 测试，并经过中央 92/92 代码只读核对和既有 CI。** B 线 #343 的每族开发说明还记录了数学不变量、真实动作、排除项和可观察限制。它们是候选验收可直接复用的原始数学工程证据，不应让 B 线或中央按同样内容重新写证明、反例表或再运行测试。

- **禁止再建批量队列：** 298 道无额外 Python spotcheck 不是任务；其余约 290 道未单列第二份 `boundedContractScopeReview` 说明不是“待逐题重写数学证明”；旧 `independentMathReview=PENDING_ITEM_MATH_ADJUDICATION` 和 `mathContractIndependentAdjudicationRemaining=298` 只记录历史独立抽查/正式准入状态，**不能用作重做 298 道或 290 道的工单**。中央逐题机器台账已另记 `duplicateMathScopeWriteupRequired=false`、`duplicateNodeChromiumRetestRequired=false`（B 308 全部）。
- **18 道范围笔记的定位：** 第一批 5 家族/12 道与第二批 4 家族/6 道只是把 B 原有合同整理进中央台账；已保留，不视为新增数学证明、不将“18/308”解释为还须为其他 290 道逐题复制说明。
- **P091/P110 的边界沿用原记录：** P091 不能重建未记录的历史图形位置/开闭样式；P110 原 grader 对近似数字容忍度比严格 replay 宽。都是已记录的受限证明范围，**没有因此产生 B 线修复/统一重测任务**。只有拿出具体原题、可复现的矛盾/伪证或新拟上线的反馈数学主张，才开启受影响题位的定向核查，并记明触发原因、证据文件与结论。
- **停止制造重复的只读预检 PR：** #348 已核 365 来源 SHA、互斥及正式 813 零冲突；#349 对首批 12 道的 INACTIVE 预检（专用 CI #44921951088 与 Required #44921950978）均已 `completed/success`。#349 保留为 Draft/历史审计证据，**不继续扩大 #349、不复制到剩余 296 道，也不把此类预检当成新数学成果或授 A**。
- **真正剩余工作：** 当确有准备纳入正式运行时的候选时，审其 *新增* 反馈措辞/方法标签能否由原合同支持；由中央单写入者做 `evidence-adapters.js` / `thinking-feedback.js` / 独立审批的 `evidence-review-manifest.json` 最小变更；按实际变更 HEAD 执行适用 CI/Artifact；只在另获授权合并后运行新 main Required/Fallback。未批准前不得注册或授 A。

### 本窗口实质增量（2026-11-22）：反馈共享组合代码已成型，仍不生效

- **隔离 [Draft PR #350](https://github.com/runlinx-eng/math/pull/350)**，exact HEAD `d3ddd6ee7d1e3236cf9d01d74053489b32b1f31c`；仅新增 `dist/learning/issue341-inactive-shared-feedback.js` 与 `tests/issue341-inactive-shared-feedback.test.mjs`，再为新测试在既有 Required Node inventory 加**一行**，不删改原门禁。
- 首批 P091/P105/P107/P109/P116 **5 家族/12 道**，复用既有 binding/replay/submitted 代码。新增的是 `issue341ProposedGuide` / `issue341ProposedFeedback` 的**实际可审反馈生成函数**，严格按原题来源、最新原 Check、原 B replay 生成，`method:null`；P091 历史图形不得外推。
- **重要隔离：** 此新增文件未被正式 `thinking-feedback.js`/`evidence-adapters.js` 导入，正式 `evidence-review-manifest.json` 仍为 813。PR 是 Draft、未合并，**无运行时启用、无新增 A**。独立文字/数学范围批准之前，不得仅通过加 import 把它变成有效反馈。
- #350 exact HEAD `d3ddd6ee7d1e3236cf9d01d74053489b32b1f31c`：[Required #44924008601](https://github.com/runlinx-eng/math/actions/runs/44924008601) 与 [P8 #44924008538](https://github.com/runlinx-eng/math/actions/runs/44924008538) **均 completed/success**。Required 新反馈组合测试 **2/2 PASS**、Node **2424/2424 PASS**、受影响的 P10 连续性与 P9 反馈两项定向浏览器 **2/2 success**、smoke success；非定向大浏览器矩阵按现有策略 skipped，**不是 B308 再测或全量浏览器 PASS**。仅生成两份 targeted 收据 Artifact `14715027346`/`14714667582`，不能代替未来实际共享注册后的 CI/Artifact。此前被新提交取代的 cancelled/failed run 原样保留。
- 新测试的范围仅为**新反馈函数**（原题正例文字、旧 Check 快照拒绝、非生效隔离、方法标签和原模型不变）；**没有重跑 B 308 原数学 Node/Chromium**，也不扩做 #348/#349 已成功的来源预检。
- 下一步：独立确认新反馈五种措辞是否超出原 B 已测事实，然后由**中央单写入者**在另一个经准入审核的 Draft 做最小正式 `thinking-feedback.js` / `evidence-adapters.js` / manifest 变更；到那时再按实际变更 HEAD 做适用 P10/Chromium/Node/Artifact/Required。当前不得授 A/合并/部署。

**旧通过回执不被本裁决抹除；未知数学范围不得宣称获正式批准。** 本段为最新操作规则，历史第 1–3、5 节的来源与历史测试结果继续有效。

---
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

**当前最后通过的代码验收点：** #350 反馈模块仍 **INACTIVE**、只测新反馈组合、已通过它自己变更 HEAD 的 Required/P8；真实共享注册与正式数学准入仍未发生，不能因此授 A 或放宽后续变更后的门禁。

## 4. 新窗口唯一允许的增量工作（禁止按家族重写 B 证明）

1. **只核新变化。** 读本最新交接、#341 最新评论，查当前 main/PR HEAD/CI/Artifact 是否相对上次记录变化；未变化直接复用 598/598 Node、12/12 Chromium、28/28 导航、365/365 来源锁定与 B 308 原工程/数学合同。不要开展批量 Python 数值抽查、第二套逐题证明或重复浏览器。
2. **依已有 B 原合同审新的正式集成主张。** 以 #343 已开发数学不变量、B 原 replay/Node 负例与中央证据复用矩阵作为默认权威材料。只有新反馈文字/方法标签将宣称超出旧证据的内容，或发现可复现反例缺口时，才审该题位的新增主张；保留 P091、P110 限制，不能把未记录的历史补写为已发生。
3. **结束重复预检方向。** 5 家族/12 道的 #349 INACTIVE preview 已成功；#348 全量 source lock 也已成功，不再为下一批继续造同构 preflight/范围说明。现在 #350 的反馈组合实现也仅在隔离 Draft，仍须独立审新增反馈措辞，严禁直接启用。保留原两个 Draft 和原件，直接规划经范围批准后的中央单写入者最小实际共享接入；未经批准不得自动写入正式 813 manifest。
4. **只对实际发生的共享代码变更按 exact HEAD 做适用 CI/Artifact。** 不是新的产品/共享更改，不应为了取得重复 PASS 重跑 308 数学/Chromium。未来若单独获得合并授权，才在新 main 再独立 Required/Fallback 双验。当前不合并、不授 A、不部署、不改原题/grader/SW、不降门禁。
5. **写回规则。** 真缺口逐题记 `packet/position`、原来源、与 B 原证据相矛盾的精确主张、证据位置、是否影响共享反馈、所需的最小动作。无具体缺口保持 `specificMathEvidenceDefect=NONE_RECORDED_AS_OF_HANDOFF`；`missingEvidence` 只记正式共享集成与新 HEAD 门禁。阶段结果提交本审计分支 JSON/CSV/README 并在 #341 追加不可误读的评论。旧失败与旧通过保留。

**注意：** 365 道 `formalStrictA=NOT_GRANTED` 是当前正式接入/批准缺口，不是 365 道数学重做任务。

## 5. 禁令与留存提醒

- **禁止：** 擅自合并 main、授正式 A、修改原题/原判题器/原状态或 SW、部署 VPS、降低 Required/Fallback 门禁、把从未记录过的儿童操作/自由思考写成事实、无缺口重复执行已通过测试。
- **正式 A813/1996 永远以真实 main + 被审核的 manifest 为准**。新分支上 CI PASS、候选有界 evidence PASS 或复用裁决都不是 A。
- 2026-11-28 左右部分 Actions Artifact 7 天留存期届满，尤其 #348 的 Artifact `14713850524` 到期 **2026-11-28 15:42:55 UTC**；其他 P111–P117 原生导航 ZIP 同期到期。下一窗口应优先核对项目已有归档是否覆盖相关 ZIP，若未覆盖，只按项目正式规则**保存现有原件**，不要为续期而重跑已过测试。

## 6. 可直接复制到新窗口的任务

> 接手数学项目 #341 中央验收。先读审计分支最新 `NEXT-WINDOW-HANDOFF.md` 的 **第 0 和第 4 节**、#341 最新评论与实时 PR #344–#350/CI。执行 2026-11-22 防重复裁决：**B 92 家族/308 道原数学 replay、负例、Node/Chromium、原 Check 与中央工程证据全部复用，不重复测试或逐家族改写数学证明；298 道额外 Python 抽查缺口和其他 290 道无第二份范围笔记都不是任务**。保留 18 道历史范围记录、#348 365 来源锁定和 #349 INACTIVE 12/12 成功原件，不再复制同构预检。仅在有精确矛盾/新拟上线反馈主张时针对该题补审；工作重点转向中央单写入者的*实际*最小共享接入，在数学文字/范围获独立批准前不改正式 manifest、不授 A。共享 HEAD 改动后才按适用范围 CI/Artifact；没有合并授权不合并 main、不部署、不降门禁。保留 A813/1996、新授 0，增量写回 #341 和 365 道 JSON/CSV。
