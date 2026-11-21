# B 线本地 Codex 开发与本地测试交接单

> **最新执行规则（2026-11-21）：** [A/B 自主开发，接近 P060 才启动中央整合](INDEPENDENT-EXECUTION.md)。本交接单历史上写的“预审后等中央 #341 锁定才能开发”已经取消：在 #343 自助登记完整 source/hash、数学合同、专属文件路径并核对无实际冲突，即可直接独立开发与测试。#341 不审批日常开工。正式 A 仍需末段集成后 PR 和新 main 双验。

**生效范围：** [Issue #343](https://github.com/runlinx-eng/math/issues/343)；中央 [#341](https://github.com/runlinx-eng/math/issues/341)；数学总控 [#130](https://github.com/runlinx-eng/math/issues/130)。  
**模式：** B 线由用户 Mac 本地 Codex 独立开发、先在本地测试；**不再安排第二 GitHub 账号、Fork 或单独的远程 Actions**。Codex 不由此文档自动启动，也不具有自动访问用户 Mac 的能力。  
**冻结规划基线：** `main@f4be9f88da7af59b6df1819ae242cf134591c376`（正式 A813/1996）。实际动手时**重新读取最新 main**，不把旧 SHA 当作最新运行环境。

## B 的范围与第一工作包

- 独占研究编号 `P117 → P060`（58 个待审研究包 / 575 道当前非 A 原生题）。工作包编号稳定，**研究包不是已批准的严格数学家族**。
- 第一包 `P117 number-line-jumps`，四个位置：`signedwalk:3`、`signedwalk:4`、`fractionfour:8`、`fractionfour:9`。可能需要按原数学对象和真实动作分成不同的严格合同。
- 参考已审核的历史同控件测试 `tests/p9-directed-jump-evidence-adapter.test.mjs`、原控件浏览器 `tests/p9-directed-jump-adapter-browser.cjs`、`dist/learning/directed-jump-evidence.js`、`dist/learning/phase5/b09-model.js`。**只作参考，绝不继承已有题的 A 资格。** 旧测试明确排除 `signedwalk:3/4`，须先查为什么排除。
- 每道题核实：最新原生 source nodeId、完整 task fingerprint SHA256、题意、数值不变量、真实可观察事件/撤销、原 model valid/inspect、latest Check、旧记录及桥接/练习隔离。若只有正确结果没有可重放过程，记录 `insufficient-evidence` 并继续下一个。
- **零等待开工：** 在 #343 自行登记精确来源/hash、可复核数学合同及专属新文件，与 #342 已申领范围比对无同题或待写文件冲突后，即可写自己的候选实现；若真冲突将该子题标 `blocked`，继续 B 线下一题/包，不等中央批复。

## Mac 本地工作区起步（由用户在 Mac 终端执行）

只需一个本地 Git clone，可在它旁边创建**独立 worktree**；不要覆写已有 `math-issue180-test` 故障工作区或 A 线未完成修改。示例假设当前项目仓库在 `~/dev/math`：

```sh
cd ~/dev/math
git fetch origin main
git worktree add -b work/b/p117-preaudit ../math-b-p117 origin/main
cd ../math-b-p117
git status --short
git rev-parse HEAD
node --version
```

如果 `work/b/p117-preaudit` 已存在，**先检查已有 worktree**，使用新且唯一的分支名，不重置/删除原有工作。当前项目不要求执行 `npm install`；预期 Node 22（与 GitHub 工作流一致），Python 3 用于本地静态服务，真实 Chromium 测试需要**实际可用**的 Playwright/Chromium 安装。

在该目录启动**已安装并可用的 Codex CLI**（常见命令 `codex`），把下面的任务说明交给它。若尚未安装/配置 Codex，按本地官方安装/登录流程完成，不可把“已写交接文档”视为工具已经运行。

## 可复制给本地 Codex 的第一条任务

> 你负责数学树 B 线 [#343](https://github.com/runlinx-eng/math/issues/343)。P117 已有本地预审报告提交给 #341；**先核对当前 worktree 与 P117 原始记录，针对 `fractionfour:8` 只在专属新文件中继续候选数学 replay、独立 Node 负例与真实原控件 Chromium 测试**。不可将预审结论当作已获 A。先阅读 `AGENTS.md`、`docs/DEVELOPMENT-WORKFLOW.md`、`docs/math-parallel/B-CODEX-LOCAL.md`（规划文档如尚未合并到 main，请从 [准备分支链接](https://github.com/runlinx-eng/math/blob/planning/dual-lane-20261121/docs/math-parallel/B-CODEX-LOCAL.md) 读取）及 #130/#341/#343。当前本地工作区与 A 线完全独立。
>
> 查清 `signedwalk:3`、`signedwalk:4`、`fractionfour:8`、`fractionfour:9` 的当前原生来源、精确 taskHash、真实控件操作与数学证据是否足以严格回放；区分 signed integer 与 fractional jump，不因同控件共享合同。对每题写出可验证不变量、正例、先错后改和伪造/旧提交/关联隔离反例。先只生成 `docs/math-parallel/local-b/P117-PREAUDIT.md` 报告（如果规划文档不在工作分支，可直接新建相应目录），不要修改原题/判题/State-v2、全局 adapter/feedback/manifest/CI/sw/release、main 或其他工作线文件，不自行提交远端 PR 或合并。记录运行的实际命令、stdout 结论、未运行项和当前 Git SHA；如发现证据不足，标为 `NO-GO` 并换下一未认领包。预审与来源/文件申领写入 #343 后即可自行开始专属开发；**无需交中央 #341 审批**。结束后保存提交 SHA、原始测试记录，标记 integration-ready，继续下一个 B 工作包。

## 本地测试与证据交接

预审第一步先检查已有 A 同控件的数学参考回归；其成功**不等于** P117 四题已验收：

```sh
node --test tests/p9-directed-jump-evidence-adapter.test.mjs
```

新数学子家族在本线完成自审且与 #342 无精确来源/路径冲突后，本地 Codex 可以自行添加**专属** `*.test.mjs`、`*-browser.cjs`、fixture 与不碰全局路由的严格 replay 文件。至少记录以下四层检查：

1. **数学/来源：** 最新原题 fingerprint、独立整数/分数数学不变量、真实原动作 replay、异常/伪造/重复/溢出/错序/旧 Check 拒绝，当前 grader 与历史保持。
2. **本地 Node：** 对新增家族运行 `node --test <新建的家族测试文件>`；提交前运行 `node scripts/ci-push-preflight.mjs`。这个预检只读且**不能代替浏览器或中央 CI**。
3. **本地真实 Chromium（环境可用时）：** 运行新增家族的 `node <新建的真实 Chromium 脚本>`，真实点击/输入而非写入正确模型；保存首次错答、订正、原图、raw/JSON、刷新/恢复以及错误日志。按影响核对 P10/State-v2/离线；没有 Chromium 就明确标 `NOT_RUN`，不可凭 Node 绿灯称已通过。
4. **可复现交接包：** 分支名、精确 `git rev-parse HEAD`、变更文件清单、所用 Node/浏览器版本、原题 hash、每项 PASS/FAIL/NOT_RUN、失败复现命令、截图和 raw 证据清单；把本地日志与用户学习数据分开，避免提交无关私人数据。

**交付方式：** 每个候选子家族完成后，在自己的 `work/b/...` 分支保留 Commit、原件及 PASS/FAIL/NOT_RUN 清单，随即继续下一包；**不需要中央收到/批准才接着做**。可保留本地 patch，也可在有授权时只 push B 分支；不得 push main、合并、改保护门禁或部署。接近 P060 时中央统一接收各分支/patch、补全共享注册/发布缓存/hash，执行 PR exact-HEAD Required/适用 Chromium/P10/官方 Artifact，并独立验新 main Required/Fallback。

## 状态和验收口径

- `planning`：冻结的队列与早期准备记录。#341 后续已有 P117 **本地预审报告**，仅对报告明确记录的命令与结果负责；不能将报告等同整族产品验收。
- `local-preaudit`：有可复核的 P117 原题分析与本地参考测试记录。
- `local-implementation`：本线自审来源和独占新文件后直接开发，不等 #341 批准；`integration-ready` 后继续向 P060 推进。
- `integration-ready`：候选代码/原件与未运行项已在本线留档、可在接近 P060 时交中央；**仍非正式 A，也不阻塞本线下一包**。
- `main-verified`：中央 PR 和新 main 两级验收全部通过才计入正式 A。

B 线上所有结果须同时记录与 #130 目前正式进度的差异，不能把计划 575 题、原本同控件 A 或离线缓存在本地成功误报为新增 A。
