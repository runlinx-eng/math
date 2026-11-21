# #341 审计扩展材料公开授权与增量交接（2026-11-22）

## #341 当前新增：逐题精确范围预检（2026-11-22）

**71个多题家族覆盖323/365道。** 部分题位获独立批准时不得仅按家族ID注册，否则扩大到未批准来源。新 [只读边界检查](./formal-activation/APPROVAL-SCOPE-READONLY.md)、[脚本](./formal-activation/approval-scope-preflight.mjs)及[365题结果](./formal-activation/approval-scope-check-365.json)已经核对每题身份，验证1题假设选中、错误hash/HEAD/重复/伪批准等失败关闭；逐题JSON/CSV新增3个`approvalScope*`字段，CSV现81列。该检查不复测B线原数学，不实施生产注册，不授A。正式A813/1996、新A0，独立人审PENDING。当前PR#351实际仍Draft=true、未合并；历史`draft=false`元数据不是当前GitHub PR状态。


**状态：29份已审阅文档获用户明确授权公开。** 全量详细证明范围、工程审核、Artifact索引、逐题准入申请和未执行的激活提案发布于本审计分支。正式批准、生产启用、main合并、部署均未授权；A仍813/1996，本批A0。以下先完整保留上一轮已公开的交接前言（其中“扩展材料待授权”属于历史状态），随后进入本轮全量详细交接。

---

## 上一轮公开状态（历史原文）

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

---

## 全量详细交接（本次获批公开）

# 数学项目 #341｜新窗口中央验收交接（2026-11-22）

<!-- issue341-window:33dddc361614fa9d -->
## 最新中央接续：全部113家族／365道共享隔离集成（2026-11-22）

**当前工作对象已覆盖全部365道，不再停留于 #350 的首批12道。** 本节覆盖下方历史段落中“仍只完成首批反馈”“还需重做范围说明”等旧待办；原通过、失败、来源与限制记录全部保留。

代码：[Draft PR #351](https://github.com/runlinx-eng/math/pull/351)；exact HEAD `fec2d5446c979741e3207a0c70f3e792a10eb5cf`；CI/Artifact 状态 **`EXACT_HEAD_CI_AND_ARTIFACTS_ACCEPTED`**。正式 manifest 仍813，本批新增 A 0，人工正式准入 **PENDING**；生产候选尚未启用。

### 本窗口已经完成的实际准备

- 113 家族／365 道接入显式共享 registry 与 feedback factory；按原题来源唯一匹配，同 type 多家族参与解析，歧义/异常拒绝。纯候选反馈模块与隔离组合分开，默认正式注册和生产导入保持不启用候选。
- 原 binding/replay/submitted 合同直接复用。P007 的完整两次错→对 Check 条件保留；不拿通用 replay 取代原 submitted。检查前提示中性，原含答案问题只在提交通过后出现，`method:null`，不外推 P091 历史图形或 P110 容差范围。
- 最终独立 agent [完整代码审核](./all365-final-code-review.json) 已绑定实际发布的24份文件与 [发布身份回执](./all365-final-code-publication-identity-receipt.json)，源HEAD、tree和唯一parent明确，原raw gzip不在发布tree或祖先中；早先6份反馈文件审核继续保留为历史子证据。这是隔离准备审核，**不是独立人工数学准入**。
- 扩展审计支持 `.types[]`、原模型与完整 Check provider；A–E 分类审计状态为 **`IMPLEMENTED_EXPLICIT_INJECTION_DEFAULT_OUTPUT_BYTE_IDENTICAL`**。兼容性核对中原/新 CLI 各执行一次，stdout 与7份输出逐字节一致，默认 A813；原提案新增注入测试3/3通过，最终测试已收窄失败断言以免输出原record，其发布字节由24-file审核绑定，实际HEAD CI另列。原113候选数学套件未单独重跑，旧113浏览器suite未选；Required既有正式Node门禁仍按实际共享变更执行，不能记作整个CI旧Node执行0。
- 已准备365行正式批准请求，技术方案已选定113个 types-aware 家族条目；145个单type条目只保留为历史备选，不是待用户批准的阻塞。精确生产缓存闭包与未应用 patch 已备；纯生产入口缺116个缓存模块，隔离 wrapper 另加1个。详见 [正式激活材料](./formal-activation/ACTIVATION-CHANGESET.md)。

### 本窗口实际 HEAD 的 CI 与 Artifact

- [Pull request required checks #44927311010](https://github.com/runlinx-eng/math/actions/runs/44927311010)：`completed/success`，HEAD `fec2d5446c979741e3207a0c70f3e792a10eb5cf`。
- [P8 startup performance comparison #44927311025](https://github.com/runlinx-eng/math/actions/runs/44927311025)：`completed/success`，HEAD `fec2d5446c979741e3207a0c70f3e792a10eb5cf`。
- [Math Tree overview checks #44927311018](https://github.com/runlinx-eng/math/actions/runs/44927311018)：`completed/success`，HEAD `fec2d5446c979741e3207a0c70f3e792a10eb5cf`。


| 本HEAD实际验证范围 | 结果 |
| --- | --- |
| 新增组合／审计／传输 Node | 13/13 PASS |
| 保留的 Required 正式 Node 门禁 | full 144文件，2425/2425 PASS |
| 新共享隔离 Chromium | 365/365题、113家族、2952项检查，errors=0 |
| 新浏览器视口 | 1920×1080 |
| 当前HEAD原 Artifact | 5份，全部实核大小/SHA256/ZIP CRC |

实际测试 checkout `8f46a03173eff3b16627f4856b67deb21a0b06f9` 是GitHub PR merge提交，源PR HEAD仍为 `fec2d5446c979741e3207a0c70f3e792a10eb5cf`，二者分别保留。完整门禁和3项targeted作业结果见 [最终CI原元数据](./all365-final-pr351-ci-evidence.json)。


完整范围、运行状态、Artifact ID/SHA与覆盖指标见 [本窗口元数据回执](./all365-current-window-evidence.json)。CI 尚未提供/未完成/Artifact尚未核对时均保留为真实门槛；旧 #344–#350 的成功不替代当前共享变更的验证。

本轮新增隔离组合的两张代表截图已有 [有界视觉审核](./all365-bounded-visual-review.json)；该审核仅覆盖1920×1080下新共享组合卡片的可读性和P091边界文字，不代表重新运行原生113套控件测试或人工正式数学批准。

### 原件留存与安全恢复

144 份原 ZIP 已原样保存：`issue341-original-artifacts-144-20261122.tar`（已持久保存，按文件名与SHA取回）；TAR SHA256 `b756251a717727e4132625d4dd35438d5d12a73e836c951c4d5df6ac3221bea7`，原ZIP字节未改。当前所需12份浏览器原输入均于2026-11-28到期，最早为 `2026-11-28T13:42:40Z`（上海21:42:40）；全部144份原件中最早到期 `2026-11-28T13:41:38Z`（上海21:41:38）。不能把中央12分片误当90天。到期不等于已持久保存的数学证据失效，也不能成为重跑旧套件的理由。

另有 **7份互异的历史失败/取消轮次原ZIP** 已保存到 `issue341-historical-artifacts-7-20261122.tar`（已持久保存，按文件名与SHA取回），TAR SHA256 `7311899ebd938b44f6d977760ce26ddd3ba1fa6b23d2affdd01f734c79935830`，见 [历史清单](./all365-historical-artifact-inventory-7.json) 与 [保存回执](./all365-historical-archive-save-receipt.json)。原144份未改。source-lock失败轮次 #44920568201 无Artifact，保留其失败元数据；导航失败轮次 #44916179044 保存3份原件；PR350三轮cancelled包含部分Required汇总job failure，保留run级与job级区别，不把整轮改成failure或PASS。

本HEAD新增 **5份原ZIP** 也已保存到 `issue341-pr351-artifacts-5-20261122.tar`（已持久保存，按文件名与SHA取回），TAR SHA256 `4273f9e5c870171a94da68521b34451e196aeed9b9a6fff7b12a45cac55b5b23`，见 [新增保存回执](./all365-pr351-archive-save-receipt.json) 与 [5份清单](./all365-pr351-original-artifact-inventory-5.json)。**三档共156份互异原ZIP（144+7+5）均保留原bytes。**

Git 仅发布代码、来源引用和摘要哈希；原模型/完整 Check 只由既有官方 Artifact 或上述同一字节归档读入 ignored `verification/issue341-inputs`。读取脚本校验原 ZIP 大小、SHA256、CRC与member哈希；缺失、过期或不匹配即 fail closed，清除旧输入，禁止伪造/放行。需要恢复时先核 TAR SHA，再恢复原 ZIP 到本地只读输入目录，运行已有 `--archive-dir` 模式；不把原记录重新上传Git或新CI Artifact。详见 [归档元数据](./all365-original-archive-retention.json) 与 [365题引用](./all365-archived-input-references.json)。

**尚未解决的工程门槛：`authorized-durable-ci-input-source`。** 持久保存原件和本地 `--archive-dir` 精确恢复，**不等于GitHub runner已经具备长期自动取件能力**；当前runner仍按原Artifact IDs下载，12份输入到期后会拒绝运行。后续必须落实受许可、CI可访问的持久原件源或获许可的精确原件交付流程，继续核原ZIP摘要；未落实时维持fail closed，禁止为续期重跑旧套件或再次未经许可把raw输入写Git/公开发布。此前自动审批已经拒绝把原模型和完整Check的gzip写入Git，本轮采用metadata-only引用与ignored运行时读取的安全替代，发布tree和祖先均排除了被拒绝的raw提交；这不构成未来raw再发布授权。

### 真实剩余门槛与下一窗口动作

1. 仅对本次实际共享代码 HEAD 收齐适用 CI/Artifact；若已通过，直接复用，不再重跑无变更的原合同、源码锁定或首批预检。
2. 取得独立人工正式数学/反馈批准，再由中央单写入者做获批生产 adapter/feedback/manifest 注册。当前365行均 `formalStrictA=NOT_GRANTED`。
3. 正式启用时应用经审阅的 SW 依赖与 release/entry/navigation 同步，按实际激活 HEAD 做必要 CI与 Artifact；当前隔离通过不代替生产启用验收。
   同时落实 `authorized-durable-ci-input-source`：当前CI成功仅说明原Artifact仍可读，不能提前关闭到期后的远端原件供应门槛。
4. main 合并与部署仍分别保留用户授权；获授权合并后再看新 main Required/Fallback。等待某项批准时，继续处理其他已有授权的缺口。

B308 原合同/负例/Node/Chromium与工程证据继续全部复用；298 没有额外 Python 抽查不是统一任务，历史18道范围笔记不生成剩余逐题重写队列。只有具体题位的可复现矛盾或新反馈主张超出原证据时，才开启定向核查。逐题旧状态原文保留在 `intakeDecisionHistory`，其他历史字段未删改。

### 最新可复制的下一窗口任务

> 接手数学项目 #341 中央验收。先读本文件最上方“最新中央接续”节、#341最新评论、PR #351 的真实源HEAD与最终CI/Artifact、365道JSON/CSV、24-file代码审核及发布身份回执。全部113家族365道已具备显式共享隔离组合与两类审计注入，不回退到 #350 首批12道试点。复用B308原合同/负例/Node/Chromium和既有导航/来源证据；298额外Python抽查不是任务。若本共享HEAD适用CI/Artifact已完成就直接继承，仅修真实缺口。采用已定113 types-aware方案，继续准备独立人工正式准入、获批生产注册和隔离元数据处理、SW/release及真实激活HEAD门禁；不得自行授A、合并main或部署，也不得等待某项批准就停止其他可执行工作。原12分片将于2026-11-28到期；持久归档与本地恢复不等于远端CI长期自动取件，需落实authorized-durable-ci-input-source，缺失/不匹配fail closed，不续期重跑旧套件，不重新未经许可发布被自动审批拒绝的raw输入。持续更新#341、365台账和本交接，保留全部历史。

**下方历史第6节的旧复制任务仅作留档，不能继续作为当前任务入口或把工作限制回首批。**
<!-- /issue341-window:33dddc361614fa9d -->

---

### 以下为保留的历史交接

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
