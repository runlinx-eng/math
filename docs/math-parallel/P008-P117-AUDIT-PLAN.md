# P008–P117 数学候选审核准备｜2026-11-21

**状态：PREPARATION ONLY / 未逐题复核 / B 尚未上传。** 本文和 [索引](./p008-p117-audit-index.json) 用于检查来源、分流审核工作与收到 B 代码后的验收，不构成工作包开工许可证、独立数学证明、strict A 合并批准或正式质量结论。

## 范围与真实数据

以已冻结 `planning/dual-lane-20261121@02b634dcb6bf76972754b82924f04282530c40df` 的 `docs/math-parallel/dual-lane-queue.json` 为只读来源；原编排完全保留，不重新编号。正式 main 冻结在 `f4be9f88da7af59b6df1819ae242cf134591c376`、A813/1996。P007 开发已经完成 16 个独立子家族/30 个原生位置，收尾见 [P007-DEVELOPMENT-CLOSEOUT.md](./P007-DEVELOPMENT-CLOSEOUT.md)。

| 所属线 | 工作包 | 历史研究位置（仅待审） | 当前操作 |
|---|---|---:|---|
| A / #342 | P008–P059，52 包 | 386 | 当前原生来源和任务哈希逐题复核，依据数学不变量拆家族，自主开发/定向测试 |
| B / #343 | P060–P117，58 包 | 575 | **待本地 Codex 上传代码与原始结果**；仅冻结编号、索引和收件清单，不替 B 编写或声称测试 |
| 合计 | 110 包 | 961 | 队列中原生位置 961 个互不重复；真实可开发数、可升严格 A 数均**未知** |

冻结队列的 `researchSourceNodeIds` 与 `researchTaskTypes` 是历史研究桶**并集**，不能作为任一道 `sessionId:index` 的源 ID、当前模型、任务指纹或数学合同。历史题位可能已改变、未注册、已被其他正式家族覆盖；逐题核验之前全部视为 **UNKNOWN / NOT_RUN**。

## 先审范围：A 侧 P008–P013 的 5 个研究入口（非推荐 A 数量）

根据现行 #130 的数学思维价值和 2–5 候选对照原则，先仅比较真实动作与数值关系，不把整个研究桶视为一个家族。

| 研究入口 | 旧研究包（不可视作单一合同） | 历史位置 | 旧控件线索（须逐题查真实 runtime） | 当前审核状态 |
|---|---|---:|---|---|
| P008 | `rounding` | 29 | `x-pvestimate`、`x-roundwork` | `NOT_REVIEWED` |
| P009 | `additive-structure` | 27 | `x-complementpair`、`x-factfamily`、`x-tenbridge`、`x-threegroups`、`x-undolab` | `NOT_REVIEWED` |
| P010 | `additive-story` | 26 | `x-story`、`x-storychain`、`x-storyparts`、`x-storyplan` | `NOT_REVIEWED` |
| P012 | `clocks-calendar` | 21 | `x-m29-clock`、`x-t32-calendar`、`x-t32-clock`、`x-t32-order`、`x-t32-units`、`x-timetable` | `NOT_REVIEWED` |
| P013 | `estimate-check` | 20 | `x-estimate`、`x-estimatepad`、`x-recallbench` | `NOT_REVIEWED` |

P008 第一优先，只因为 A 线按编号推进，而不是假定 29 位均可开发；应先区分估算、按位取整、边界舍入与多次真实修正，检查位值与负例；无法保证真实动作时标记 `insufficient-evidence`。P009 按十补与进退位的可见操作、可逆性和事件顺序拆合同；P010 核对图示总量、部分、变化步骤与故事语义；P012 按时钟/日历及单位差异拆；P013 区分估计过程记录与只填最终结果。上述都只是历史题型线索，未核当前任务 SHA，**没有新增 A 或审核通过结论**。

## 每道原生位置审核最小模板（B 上传后同样使用）

1. **身份锁**：冻结包 `Pxxx`、`sessionId:index`、实际最新 main 原生注册、独立 `nodeId`、**整个 runtime task 的稳定 SHA256**、来源文字/原题字段、是否已正式 A、与关联练习/bridge 的区别。
2. **数学与真正动作**：目标的独立数学不变量、原 UI 按键/字段的实际事件与历史粒度、原判题语义、至少一组反例/边界/伪造/过时 Check，能力不能观察到时明确 `insufficient-evidence`；不能凭同 widget、题数、结果或 AI 推断策略。
3. **安全与冲突**：双方精确题位、节点 source **不等于实际冲突**；实际冲突仅同一原生位置/目标文件或需要共享改动。记录冲突对方 `branch@SHA`，先隔离；学习记录/State-v2、数学源/关系、原题/判题、大架构调整必须按重大风险授权流程。
4. **开发候选**：独立 `work/a/*`（A）或 Mac 本地 `work/b/*`（B）中的代码与固定提交 SHA；数学回放/Node 负例/原控件 Chromium 独立文件；测试必须绑定最终 SHA。记录 `PASS/FAIL/NOT_RUN`，不由静态预审自证 Chromium。
5. **原件与风险**：Node/Chromium/P10/原保存和 State-v2/离线真实 run、截图与原始 JSON/日志、Artifact ID/官方 ZIP SHA、独立下载 CRC 与图片审阅 status，runner 和源码 checkout identity。开发期 PASS ≠ 正式 PR required 或 exact merged-main PASS。
6. **分类**：每位置分别写 `source_verified`、`conditional_developable`、`excluded`、`insufficient_evidence`、`runtime_unregistered`、`blocked_exact_conflict` 等及依据；未经证据完成不得填写 `strictAApproved:true`。

## B 侧上传后才开始审核的入口

当前 B 线在用户 Mac 本地 Codex 运行，尚未提供本轮 `work/b/*` 代码、diff/patch 和实际 Chromium/Node 结果；#343 仅有旧 P117 本地预审记录和 1 个旧 Node FAIL，不能冒充提交或成功。收件时需 B 提供：

- 每个子家族固定 `branch@full SHA` 或可核验 patch，唯一 `sessionId:index` 与 runtime 全题 SHA、source node、数学不变量、原始操作事件以及负例；
- 真实 Node/Chromium 执行命令、runner/browser 版本、stdout 与 FAIL/NOT_RUN、Check 错→对、保存/恢复/备份/离线原件位置；
- 本地生成与官方 Artifact 的对应关系；没有 GitHub Artifact 则标 `NOT_RUN`，绝不伪造 SHA/CRC；
- 和 A 已做题位/待写文件的实际冲突表及解决建议；不得推断「同一来源节点」为冲突，也不得覆盖 A/主线代码。

只做隔离接收与审计。**接近 P060** 且依赖闭包明确后才交 #341 正式注册、Required/适用 Chromium/P8/P9/P10/备份/Artifact、PR 与新 main 独立双验；不变更主线、CI Required、分支保护或 VPS 授权。

## 更新约定

索引中的每个 `intakeStatus` 目前均是待审状态。以后只有实际收到 A 独占家族提交、B 本地提交/原件或当前 main 精确来源与实测时，才逐包修改索引并附证据，**不批量改为 PASS**。#342 继续负责 A 线日常开发；#343 负责 B 线本地事实；#341 负责集中整合；#130 是已独立验收正式 A 的权威口径。
