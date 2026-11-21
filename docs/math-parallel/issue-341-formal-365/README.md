# 新窗口接续入口（2026-11-22）

**2026-11-22 文件发布进度：用户已明确批准公开待审包中的29份验收、归档和准入提案文件；本轮在审计分支增量整合现有public*状态。详细逐题申请不代表人工数学批准，正式A仍813，本批新授A0；生产注册、main合并及部署均未授权。**

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

# 新窗口接续入口（2026-11-21）

> **2026-11-22 实际隔离反馈实现进度（不是新增数学证明）**：[Draft PR #350](https://github.com/runlinx-eng/math/pull/350) 已新增可复用的 `issue341ProposedGuide`/`issue341ProposedFeedback` 代码，用于首批 5 家族/12 道、仅使用旧 B 原数学 replay 和最近 Check；有唯一新反馈测试，已登记到既有 Required Node 清单。**正式共享 feedback/adapter/manifest 仍没改，运行时未启用，新增 A 0；没有重跑 B 308 原测试。** 新 exact HEAD `d3ddd6ee7d1e3236cf9d01d74053489b32b1f31c`，P8 #44924008538 与 Required #44924008601 均 completed/success；新反馈测试 2/2、Required Node 2424/2424、两项定向浏览器 2/2、smoke PASS；非定向 browser 矩阵按原策略 skipped，**不冒充 B308 重测**。此提案保留 `INACTIVE`，不可自动升级正式 A。详见 [最新交接](./NEXT-WINDOW-HANDOFF.md)。
> **2026-11-22 最新防重复交接（覆盖下方旧扩展口径）：** B 92 家族/308 道已有 #343 数学 replay/负例、Node/Chromium/Check 原合同与中央工程验收，直接复用；其余题位**不需要批量重写证明范围说明**，298 无额外 Python 抽查也不是任务。既有 **9 家族/18 道**的范围笔记仅是对 B 原合同的整理，不代表新证明或剩余 290 道待审清单。#348 全量锁定与 #349 12 道 INACTIVE 预检已成功，不再复制类似预检；#349 Required #44921950978 也已 `completed/success`。具体矛盾/新反馈主张才定向补证，下一步只推进独立批准下的**真实最小共享接入**及发生变更后的适用 exact-HEAD CI。详见 [最新交接第 0、4 节](./NEXT-WINDOW-HANDOFF.md)。**B308 候选工程证据继续接受，正式 A813/1996、新授0。**
**固定交接文件：[NEXT-WINDOW-HANDOFF.md](./NEXT-WINDOW-HANDOFF.md)。** 新窗口优先读取该文件、#341 最新评论及 PR #344–#348 HEAD，再继续隔离共享集成的证据范围审核。已经通过的 B 308 工程证据、28 原生导航、365 来源锁定等全部复用，**不因 298 道尚未做第二套 Python 抽查而统一重测**；不擅自合并 main、授 A、部署或降级门禁。正式 A813/1996，新增0。

> **2026-11-21 中央续办：第二批只读数学范围** 已从 B 5 家族/12 道扩至 **9 家族/18 道**（P104 2、P106 1、P108 1、P110 2）。仅审已有冻结 replay、原 Node 合同及通过的 CI，没有重复测试。特别保留 P110 的“原 Check 近似容差 ≠ replay 精确证据”限制。详见 [新增 6 道范围](./b-second-6-observable-contract-review.json) 与同步的 [365 JSON](./issue-341-formal-365-intake.json)／[CSV](./issue-341-formal-365-intake.csv)。B308 工程证据复用及旧 67 道额外有界数值复核不变，298 非强制重测；新授 A 为 0，当前不生效提案不变。

> **隔离共享接入准备（仍不生效）**：已为第一批 **5 家族/12 道**整理了真实 binding/replay/submitted 导出、最小可观察反馈文本和接入门禁，见 [INACTIVE-shared-5x12-preparation.json](./staging-integration/INACTIVE-shared-5x12-preparation.json)。不编辑三个正式共享文件；反馈仅为待审原文，全部 `method:null`，P091 历史图形界限明确保留。不得把预检结果冒充数学正式批准。

> **INACTIVE 隔离预检实际结果**：新 [Draft PR #349](https://github.com/runlinx-eng/math/pull/349) exact HEAD `9c8040f03946c37d94ee0de5b16e69e379efb20b`，专用 [CI #44921951088](https://github.com/runlinx-eng/math/actions/runs/44921951088) **completed/success**，5 家族/12 道唯一原生绑定、完整 nodeId/task SHA、非正式 A813 与已注册 adapter 不冲突，错误 0。原件 Artifact [14713972350](https://github.com/runlinx-eng/math/actions/runs/44921951088/artifacts/14713972350)（2026-11-28 15:58 UTC 到期）。此 CI **只验证不生效接入形状**，不运行 B308 Node/Chromium 数学测试，正式 `evidence-adapters.js`、`thinking-feedback.js` 和 manifest 均未改；**Required #44921950978 仍以实时结果为准**。对应 12 道台账已注明 `PASS_INACTIVE_NOT_RUNTIME_REGISTERED`，并保留正式数学批准 `NOT_APPROVED` 和 `formalStrictA=NOT_GRANTED`。

---

# #341 最新：365 道来源锁定预检通过，B 线已有证据继续复用（2026-11-21）

[隔离 Draft PR #348](https://github.com/runlinx-eng/math/pull/348) 的 [专用源码锁定 CI #44920634904](https://github.com/runlinx-eng/math/actions/runs/44920634904) **completed/success**：113 候选家族的 `Binding/replay/submitted` 函数均已解析，365 个原生位置对照完整 source nodeId/task SHA-256 成功；与既有 813 条正式 A manifest **0 重叠**，候选之间与既有运行时注册互相绑定冲突 **0**。未做第二套数学重测，未修改公开的 `evidence-review-manifest.json` 或 main，新增严格 A=0。#348 同一 exact HEAD 的 [Required #44920634864](https://github.com/runlinx-eng/math/actions/runs/44920634864) 也已 completed/success；日常 Required 自动跳过非定向 browser 矩阵，不能冒充全量复测。

B 线 **308 道已有原工程测试证据仍按上一轮接收并复用，不要求 298 道统一重测**。只读整理了 P091／P105／P107／P109／P116 共 **5 家族、12 道**的明确数学主张与不能外推之处，仍需正常共享接入和正式双门禁。已有 28/28 原生导航证明和此前有界独立数值复核全部保持。

[完整来源锁定与 12 道范围审查报告](./20261121-preintegration-source-lock-and-first-12-scopes.md) · [B 12 道边界 JSON](./b-first-12-observable-contract-review.json) · [5 家族／12 题位不生效集成提案](./b-first-12-INACTIVE-integration-proposal.json) · [正式 A813 与 365 候选静态冲突预检](./staging-integration/approved-manifest-collision-precheck.json) · [365 道最新机器台账](./issue-341-formal-365-intake.json) · [CSV](./issue-341-formal-365-intake.csv)

---

> 下方各段为不同时间点的历史进度快照；以本页顶部及机器台账为当前执行结论。

# B 线当前结论：已有测试证据复用（2026-11-21｜最新口径）

**B 线 92 家族／308 道的已有开发 Node/Chromium、错误拒绝、原始 Check/State-v2/Artifact 及 28 道专项导航证据，已接受为候选工程证据；不再要求“未做第二套独立算术抽查”的 298 道统一重新测试。** 这个裁决仅是**复用已有合格证据进入中央正式集成流程**，不是批准 B 308 道数学严格 A。main 仍 **A813/1996**，本次新增 A=0。

经只读审阅原 92 个 Node 测试文件和 92 个候选 evidence/replay 模块，92/92 均存在原生来源绑定、完整题型对照、数学 replay/inspect、最新原 Check 绑定和不合格证据拒绝；全部保留原中央 CI 成功记录，不重新运行已成功测试。P091 `allowedrange:0/1` 的历史图形位置不可重建，现有证明范围已限制为被记录的 probe 判断和最终端点，仍不得外推。

[新验收口径与原证据清查报告](./b-existing-evidence-reuse-308.md) · [92 家族／308 道证据复用 JSON](./b-existing-evidence-reuse-308.json) · [最新 365 道逐题 CSV](./issue-341-formal-365-intake.csv) · [最新逐题 JSON](./issue-341-formal-365-intake.json)

**仍待完成的是发生变更后的正式共享接入、其 exact-HEAD CI/Artifact，以及合并后新 main Required/Fallback 门禁。** 如果对某道数学主张或负例真的发现证据矛盾，再针对该位置补证／补测；不会因“298 未二次抽查”的统计数字自动重跑。P007、P009 的单独验收状态不因此改变。PR #344–#347 均保持 Draft，不擅自合并、不授 A、不部署。

---

> 下方为此前各个时点的**历史记录**，其中“298 道仍需逐题独立数学测试/裁决”的表述不再作为本轮统一补测命令。以当前顶部口径和机器台账为准。

# #341 新增 B 线数学复核（2026-11-21：晚于下方 59 道快照）

B P105 质数试除 3 题、P107 因数对 2 题、P109 最大公因式 3 题新增独立 Python **41/41 有界断言 PASS**。截至当前，**67/365** 道已有独立有界数学核对，另 **298** 道仍待逐题数学合同及负例审查；重点原生导航 **28/28** 已补证。以上均**不授严格 A**，main 保持 A813/1996，正式新增0，所有 PR #344–#347 保持 Draft、不合并。

[新增 8 道 B 线数学核验](./20261121-b-p105-p107-p109-bounded-math.md) · [本轮导航及 P009 数学核验](./20261121-followup-navigation-and-p009-math.md) · [最新 365 逐题 CSV](./issue-341-formal-365-intake.csv) · [最新 JSON](./issue-341-formal-365-intake.json)

P117 专用原生 Chromium [run #44916741741](https://github.com/runlinx-eng/math/actions/runs/44916741741) 与 Required [#44916741680](https://github.com/runlinx-eng/math/actions/runs/44916741680) 均已 `completed/success`，对应 Artifact 单独校验 SHA256/CRC/原始状态通过。下方旧快照对其他数字（59、306、20/28）及“Required 尚待结果”的陈述为**当时历史状态**，以本段及最新机器台账为准。

---

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
