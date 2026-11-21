# 数学树｜A/B 双线从两端推进：实施准备（非正式开发）

状态：**planning only / 未启动正式家族开发 / 未启动第二 GitHub 账号**  
固定原始基线：`main@f4be9f88da7af59b6df1819ae242cf134591c376`（2026-11-21，已独立 Required/Fallback 验收）  
唯一全局总控：[Issue #130](https://github.com/runlinx-eng/math/issues/130)；不改其 A 认定、分支保护、部署/发布和 State-v2。

## 1. 为什么这样拆

目标是把**实际开发**并行化，而不只是“教研上游、开发下游”并行。A 从小编号往中间，B 从大编号往中间；每条线都可以独立完成原题审查、数学合同、测试夹具和专属模块，提交**候选 Draft PR**。共享登记、正式合并和新 main 双门禁保持**一个整合者**。

机器队列：[dual-lane-queue.json](dual-lane-queue.json)，由 `docs/math-family-preaudit/candidate-pools.json` 的历史非 A 分组，与**新 main** `docs/spatial-learning/evidence-review-manifest.json` 的 813 道正式 A 逐题差集生成，当前确认 **1,996 原生 = 813 正式 A + 1,183 非 A**。旧池 1,237 道有 54 道已升 A，去重后 117 个仍有非 A 的**研究池**；空池 `ratio-steps/proportionGraph37` 已不分配。全部 1,183 个 `sessionId:index` 位置**无重复、无遗漏**。

**注意：117 是编号的研究工作包，不是 117 个已审数学家族，更不是 117 个可以直接升 A 的方案。** 已知 `place-compose`、`data-display` 等混合不同数学不变量。每包先核真实来源与动作，按数学不变量细分适合的**正式独立家族**；不能按控件、章节或分析桶批量授 A。无法观察学生行为的题标 `blocked/insufficient-evidence` 并继续下一个，而不是停工或伪造操作。严格 A 工程证据不代表儿童理解、掌握、迁移。

## 2. 编号与两端分工

| 路线 | 工作包范围 | 推进方向 | 当前非 A 题量（只表示待审量） | 第一试点 |
| --- | --- | --- | ---: | --- |
| **A（现有主开发线）** | `P001–P059`（59包） | `P001 → P059` | **608** | `P001 area-grid`：3 原生待审 |
| **B（拟转交第二账号）** | `P060–P117`（58包） | `P117 → P060` | **575** | `P117 number-line-jumps`：4 原生待审 |

编号方法：按历史剩余题数从大到小，将相邻大小包**交替**放在两端以接近平衡，再把工作量较小、与另一端控件不同的两个预审包移到起点。这只是“待审题量”均衡，不能替代工程时间/数学难度衡量；首轮真实成本出来后可调开发节奏，**不得任意重排 ID**。起点两个试点也都是**先审数学合同、再决定能否开发**，不是承诺 +3/+4A。

原生任务清单的正式来源 ID / taskHash 要在**当时最新 main** 的运行时原题逐题冻结；机器队列的 `researchSourceNodeIds` 是旧研究池的**并集提示**，不是逐题最终来源审定。跨两线有 **63 个研究池来源 ID 提示重叠**，因此仅靠不同账号和不同编号**不能保证**数据/代码完全独立，必须登记精确来源锁与共享文件锁。

## 3. 两条线的准入/交接协议

每个 `Pxxx` 在开始写代码前，在各线 Issue 留下固定记录：

1. `Pxxx`、子家族名称、两线归属、负责人 GitHub login、起始 main SHA、独立工作分支和预定修改文件（允许未提供账号时标 `unassigned`）。
2. 明确 `sessionId:index` 的原生位置、来源 nodeId、冻结的**完整**原题 SHA256、该题当前 A/B/C/D/E 级别；从最新 manifest 排除已验 A/重复题。桥接题单列。
3. 同一**数学不变量**、真实动作和可独立重放的过程、当前原 grader、错误先行/更正与 State-v2 历史；主动列出弱证据、自动生成过程、关联/异源等**拒绝边界**。
4. 多源/混合控件的研究包必须拆成相互独立的子家族合同，写清哪些可开发、哪些暂缓和原因；绝不把“这组 30 题”直接等同“能升 30A”。
5. 需要修改共享代码/源节点/其他线程预留文件，先在总控登记冲突，交整合者串行操作；**不为了绕过冲突而重命名来源或改变原任务**。
6. 独立原生 Chromium、数学反例、最新版 exact-HEAD CI 与官方原始 Artifact 供审查；实现完成先 Draft、由整合者接管共享文件和集成分支。

建议统一状态：`unclaimed → source-audit → contract-frozen → implementation-draft → head-verified → integration-wait → merged → main-verified`。可分支为 `blocked`（冲突）或 `excluded`（不可形成严格过程证据）；这些状态**只更新对应工作包**，不导致从头重新编号/全库扫描。**任何正式 A 增量只由合并后独立验 main 的总控记录。**

## 4. 共享代码分工（避免两线改同一入口）

| 责任 | 两线可自主 | 只能由中心整合者处理 |
| --- | --- | --- |
| 数学合同 | source-locked 的独立纯函数、回放证明、正负例、单族 fixture | 将合同接入全局 adapter 和学习反馈路由 |
| 浏览器证据 | 单族原控件脚本、原始操作与 screenshot/raw/JSON | CI 家族总清单、targeted 清单、Required 汇总 |
| 正式内容 | 独立数学建议、审查报告、可选教学解释草案 | 正式源题、知识关系、manifest、A–E 统计 |
| 离线/运行时 | 在候选文档中写清依赖，提供验证方案 | `dist/sw.js` 缓存、发布版本号、启动 hash、导航 hash |
| 主线 | 提交 Draft PR，交付确切 HEAD 原始证据 | 统一 rebase/cherry-pick、Ready/merge、新 main Required/Fallback 审核 |

**专属中心写入文件：** `dist/learning/evidence-adapters.js`、`dist/learning/thinking-feedback.js`、`docs/spatial-learning/evidence-review-manifest.json`、`scripts/audit-learning-evidence.mjs`、`scripts/audit-evidence-expansion.mjs`、`ci/math-families.json`、`scripts/ci-targeted-checks.mjs`、`dist/sw.js`、`.github/workflows/`。现有发布/入口/nav SHA 和原始源图/题也由中心处理。

各线应优先新增自身命名空间下的 source-aware 证据/测试文件。两线若需同一个 `dist/learning/phase5/*` 源模块、同一个 source nodeId、相同 release 或状态结构，预先加冲突标记，由中心选择排队或重新分配。**不直接推送 main，不自行合并，不改保护门禁，不部署 VPS。**

## 5. 不同 GitHub 账号与 CI 的现实边界

- 不同 GitHub **登录身份**在同一仓库开发，只隔离提交身份/权限，**不会自动提供两份 Actions 并发或用量配额**。
- 若确实需要独立账户承载开发 CI，可考虑各自在独立 fork 或独立有权限的副本上运行**开发阶段**工作流；需要分别开启 Actions、校验 fork 是否有相应权限、工作流/缓存与 artifact 来源身份。fork 的 PASS 不等同中心正式 PR HEAD PASS。
- 中央仓库仍须按实际集成后的 HEAD 运行 Required/适用 P8/P9/P10/Chromium、官方 artifact 数学审计，并在每次合并后验证**新 main Required 与 Fallback**。不能引用 fork 的一轮绿灯替代中心门禁。
- 同一 GitHub 仓库工作流已有 `max-parallel: 10`（定向浏览器矩阵）和 PR 级 `concurrency`；两个不同 PR 不应相互取消，但还会竞争仓库/所属账号的实际跑机配额。先跑一对小试点并记录**等待、实际执行、原包审计、整合成本**，再判断是否要真正分 fork。
- 本准备阶段**不创建第二账户、不修改 Actions/分支保护、不触发 full multiwave**。账号用户名与 fork 地址均待使用者选择。

## 6. 第一轮落实及停止条件

1. 总控固定本队列，并建立 **A/B/整合 3 个可追踪任务**。每条线使用不同分支，不能在两个会话中抢写此队列 JSON。
2. A 先做 `P001 area-grid` 真实原题/动作轻量预审；B 先做 `P117 number-line-jumps` 数学与原生事件轻量预审。两者分别属于 B30 格单位面积与 B09 数轴跳跃线索，仍需确认准确模块/任务指纹/合同；不立即升级 A。
3. 每线完成一个真实小家族试点以后，记录实现时长、PR CI 排队/执行时长、共享文件冲突、原始 ZIP 核验与合并后 main 双验成本，以真实情况决定是否继续双线，或收缩共享代码所有权。
4. 一旦真实来源/学习历史存在冲突，或发现必须大范围改 grader/State-v2/source graph/全局反馈，停止该包推进，先由 #130 明确边界。**不能为了“从两端向中间”强行改数学定义**。

当前工作只是规划登记，不代表任何待审题通过数学合同、人员就位、fork/第二账号已接入或 CI 已运行。
