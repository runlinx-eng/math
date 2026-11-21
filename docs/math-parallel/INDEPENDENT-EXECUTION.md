# 数学 A/B 双线自主开发协议（2026-11-21 生效）

> 最新用户决定：A 从 P001 到 P059，B 从 P117 到 P060，先各自开发并测试；接近 P060 才启动 #341 的集中代码整合与正式 CI。此前 **#341 不是逐题/逐家族开工审批门槛**。此条覆盖旧 README、B-CODEX-LOCAL、#341/#342/#343 中的“等中央批准/源锁才开工”措辞，不改变 #130 正式 A 和安全边界。

## 谁做什么

- **A / #342**：从前端编号前进；自行核来源和原题完整 SHA256、数学不变量与真实操作，自行在 `work/a/*` 分支开发独占新模块/fixture/Node/Chromium 测试并留下可复现记录。无需等 #341 批复。
- **B / #343**：用户 Mac 本地 Codex，从尾端编号后退；相同自审和独立工作区原则，在 `work/b/*` 中开发并做本地测试。不得假称本地命令已执行；实际记录 PASS/FAIL/NOT_RUN。
- **#341**：当前只保留整合需求和真正冲突记录，不给单个家族发施工许可证。**两线接近 P060 才启动实际集成**（统一公共模块、CI 配置、Release/SW/Manifest、PR exact-HEAD 和合并后 main 独立双验）。

## 单个子家族的零等待开工条件

1. 在本线 Issue 写明 `Pxxx`、精确 `sessionId:index`、实际来源 `nodeId`、**完整 task SHA256**、当前正式 A/非 A、数学不变量、真实动作/原 grader、负例与不能声称的事实。
2. 列出独占的新文件路径，核对另一线已申领的位置/文件（#342/#343 + 冻结队列）；研究池之间同一来源 ID 仅是风险提示，**不是自动冲突**。同一精确原题或同一待写公共文件才需要处置。
3. 在当前 main 基线上创建独立工作分支（A `work/a/...`；B 为本地 worktree `work/b/...`）；上述核对齐全即可自己决定开始候选代码，不需等中央确认。证据不足的子题标记 `excluded` 或 `insufficient-evidence` 并继续。
4. 只在本线专属文件中实现纯数学回放、事件证明、正/反例和原生 Chromium 夹具；任何要改全局路由/源题/已有模型的诉求先记录为整合需求，不能越权改。一个子家族做到可复现就标 `integration-ready` 并立即开发本线下一包。

## 冲突怎么处理

- **仅研究池 source ID 重叠**：先检查精确原生位置/原任务哈希与待写路径；无重叠可继续开发，不必请 #341 批示。
- **同一原生题、同一文件待写或需要改 shared 文件**：该子题标 `blocked`，留下双方分支、source/hash、路径和最小复现；两线都不抢写。可先审/开发本线其他位置和下一包，接近 P060 再由 #341 消解。
- **发现原题数学判定、State-v2/历史、源关系必须改变或存在数据安全风险**：暂停受影响子题，按 #130 的重大事项授权边界处理；未受影响家族仍继续。
- 专属中心写入文件（A/B 均不得碰）：`dist/learning/evidence-adapters.js`、`dist/learning/thinking-feedback.js`、`docs/spatial-learning/evidence-review-manifest.json`、`scripts/audit-learning-evidence.mjs`、`scripts/audit-evidence-expansion.mjs`、`ci/math-families.json`、`scripts/ci-targeted-checks.mjs`、`dist/sw.js`、`.github/workflows/`，以及 release/入口/nav hash、正式原任务/source graph。

## 证据与正式验收绝不混淆

- 候选子家族保留完整代码提交 SHA、数学/反例/来源检查、实际 Node 与 Chromium 操作、错误→订正、最新 Check、State-v2 刷新/持久化、截图/raw JSON/log；不能执行写 `NOT_RUN`，失败写 `FAIL`，不得称全绿。
- 此阶段不改 main、不改正式 manifest、不合并、不部署 VPS、不放宽 Required/35分钟/原判题，不运行不必要的全量 multiwave。**A813/1996 仍是正式 main 数据**，两线的候选数只能另报。
- 双方接近 P060 后由 #341 收集工作分支/patch，统一接入公共文件、拆小 PR 逐个 exact-HEAD 跑 Required/适用 P8/P9/P10/原 Chromium/官方 Artifact、受控合并，独立运行新 main Required/Fallback；只有验完的新 main 才能更新正式 A。

## 2026-11-21 已知试点

- A `P001 area-grid`：只推进 `gridarea:2`（node `mt_6xNmQLzuqm`，task SHA `79cadc478abf5d9d742c2ff5cd2cb0f090cbbbef9dcd21bc34d5451a1900997f`）“面积 12cm² / 周长 14cm 的真外边事件”候选；`term38:2` 排除当前来源目标，`tools39:4` 暂缓。工作分支 `work/a/p001-gridarea-contrast` 已从正式 main 建立；分支存在不等于测试通过/授 A。
- B `P117 number-line-jumps`：先前本地预审报告向 #341 建议仅 `fractionfour:8` 作为下一独立候选（node `mt_gNUE4B3vuk`，SHA `eb249dbc77c4acb4fc19245cfe552b6f39069c63461df463abf4bc9779a64e77`），其余三道暂为证据不足；原本地测试有旧 Node 套件 1 个失败，不能冒称全部通过。B 可自行继续专属新模块，不等 #341。
- A `P002 place-compose` 为 56 题的异质研究池，不是单一数学合同；`placeproblems:1` / `bigproblems:2` 两个排序＋极差候选仍需运行时指纹与原生实测。不能按 56 题批量开发/授 A。

当前源证据以 #342、#343 实际提交和原件为准；这份协议只变更审批与集中整合时点，不追认没有运行的测试。
