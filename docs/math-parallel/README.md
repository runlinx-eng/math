# 数学树｜A/B 双线从两端推进：实施准备（非正式开发）

状态：**planning only / 未启动正式家族开发 / B 线改由本地 Codex 实施（当前尚未实际执行本地命令）**  
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
| **B（本地 Codex）** | `P060–P117`（58包） | `P117 → P060` | **575** | `P117 number-line-jumps`：4 原生待审 |

编号方法：按历史剩余题数从大到小，将相邻大小包**交替**放在两端以接近平衡，再把工作量较小、与另一端控件不同的两个预审包移到起点。这只是“待审题量”均衡，不能替代工程时间/数学难度衡量；首轮真实成本出来后可调开发节奏，**不得任意重排 ID**。起点两个试点也都是**先审数学合同、再决定能否开发**，不是承诺 +3/+4A。

原生任务清单的正式来源 ID / taskHash 要在**当时最新 main** 的运行时原题逐题冻结；机器队列的 `researchSourceNodeIds` 是旧研究池的**并集提示**，不是逐题最终来源审定。跨两线有 **63 个研究池来源 ID 提示重叠**，因此仅靠不同账号和不同编号**不能保证**数据/代码完全独立，必须登记精确来源锁与共享文件锁。

## 3. 两条线的准入/交接协议

每个 `Pxxx` 在开始写代码前，在各线 Issue 留下固定记录：

1. `Pxxx`、子家族名称、两线归属、执行主体（A 线代理 / B 线本地 Codex）、起始 main SHA、独立工作分支和预定修改文件（允许未提供账号时标 `unassigned`）。
2. 明确 `sessionId:index` 的原生位置、来源 nodeId、冻结的**完整**原题 SHA256、该题当前 A/B/C/D/E 级别；从最新 manifest 排除已验 A/重复题。桥接题单列。
3. 同一**数学不变量**、真实动作和可独立重放的过程、当前原 grader、错误先行/更正与 State-v2 历史；主动列出弱证据、自动生成过程、关联/异源等**拒绝边界**。
4. 多源/混合控件的研究包必须拆成相互独立的子家族合同，写清哪些可开发、哪些暂缓和原因；绝不把“这组 30 题”直接等同“能升 30A”。
5. 需要修改共享代码/源节点/其他线程预留文件，先在总控登记冲突，交整合者串行操作；**不为了绕过冲突而重命名来源或改变原任务**。
6. A/B 均要提交可复核的数学和真实操作证据。**B 先在本地 Codex worktree 完成测试并保存日志、原图与 JSON，未执行项必须显式列出**；交给中央后，由中央完成 exact-HEAD GitHub CI 和官方 Artifact 核验。B 不自行触发中央 PR、合并或宣称正式 A。

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

## 5. B 线本地 Codex 开发、测试与中央 CI 的边界

- **B 线运行位置：用户的 Mac 本地 Codex / 独立 Git worktree。** 无需第二 GitHub 账号、Fork 或独立 GitHub Actions 配额；本准备阶段不连接/远程操作用户 Mac，不声称本地测试已运行。
- B 从 `origin/main` 最新 SHA 创建 `work/b/p117-...` 等独立工作分支，并核对当前 A 线及中央 #341 的锁定范围；不得在原 `~/dev/math-issue180-test` 故障基线工作区覆盖文件。B 只更改自己独有的数学回放模块、单族 fixtures/测试与预审报告，共享源文件均由中央写。
- B 优先执行 Node 22 快速数学/反例测试；安装并配置好可用 Chromium/Playwright 后，针对**真实原生控件**运行该家族本地浏览器测试，保存 stdout/stderr、脚本/运行命令、`git rev-parse HEAD`、截图、raw JSON、错误与保存/纠错/刷新证据；缺依赖或无法运行必须标为 `NOT_RUN`，不能以旧家族通过代替新家族。
- 本地交付是 `commit SHA + diff/branch + 数学审查结果 + 本地测试证据 + 未测项`。可由用户/中央指定已授权的 GitHub 账号 push **仅 B 工作分支**，或交付 patch/变更包；不要由本地 Codex 擅自 push main、开自动合并 PR、修改 CI 或发布。
- **正式门禁仍在 GitHub 中央仓库**：整合者接收本地成果、与最新 main 同步公共模块、创建/更新 PR，执行确切新 HEAD 的 Required/适用 P8/P9/P10/Chromium/官方 Artifact 数学审查；正常合并后独立验新 main Required/Fallback。本地成功不能替代这两个阶段。
- B 的详细操作、可复制起步命令和 Codex 工作提示见 [B-CODEX-LOCAL.md](B-CODEX-LOCAL.md)。A 仍按原有 GitHub 开发流程走，两线不抢共享登记。**无 Fork、无第二账号准备项。**

## 6. 第一轮落实及停止条件

1. 总控固定本队列并维护 **A/B/整合 3 个可追踪任务**（#342、#343、#341）。每条线使用不同分支，不能在两个会话中抢写此队列 JSON。
2. A 先做 `P001 area-grid` 真实原题/动作轻量预审；B 先做 `P117 number-line-jumps` 数学与原生事件轻量预审。两者分别属于 B30 格单位面积与 B09 数轴跳跃线索，仍需确认准确模块/任务指纹/合同；不立即升级 A。
3. 每线完成一个真实小家族试点以后，分别记录 A 远端与 B 本地的实现/测试时间，以及中央 PR CI 排队/执行时长、共享文件冲突、原始 ZIP 核验与合并后 main 双验成本，以真实情况决定是否继续双线，或收缩共享代码所有权。
4. 一旦真实来源/学习历史存在冲突，或发现必须大范围改 grader/State-v2/source graph/全局反馈，停止该包推进，先由 #130 明确边界。**不能为了“从两端向中间”强行改数学定义**。

当前工作只是规划登记，不代表任何待审题通过数学合同、B 本地 Codex 已启动或本地测试已执行，也不代表中央 CI 已运行。
