# B 线接手 A 线剩余 214 道｜正式交接快照（2026-11-22）

## 可执行范围（已核对，不是开发成果）

- **新责任方：B 线（本地 Codex）**。原 A 线 #342 停止这 214 道的并行开发；唯一开发登记入口为 [#343](https://github.com/runlinx-eng/math/issues/343)。正式共享接入、exact-HEAD CI、main 合并/合并后验收仍由中央集成线办理（#341 历史，#130 总控）。
- **冻结正式 main**：`1e9d270d7243b3519fabcfbe7f05f66f82cada73`（PR #371 合并后 Required 44994085435、Fallback 44994085452 双 success）。
- **原 A 线冻结队列**：`planning/dual-lane-20261121:docs/math-parallel/dual-lane-queue.json`，Git Blob `3046a046592d99577b0206eb88c21cd38d8bdb58`；A 线原 59 工作包 / **608** 个唯一原生题位。
- **正式 A 名单**：上述 main 的 `docs/spatial-learning/evidence-review-manifest.json`，Git Blob `11faf487af80e245de66c2017c8fcdedf3457ce3`，共 **1663/1996 A**。
- **准确差集**：原 A 线608位置 ∖ 正式A = **214 个不同位置**，分布于 **22 个**原 P001–P059 研究包；原 A 线另 **394/608** 已正式 A。未发生重复、没有重命名 P 编号，与原 B 线575位置、已结项 B119位置无交叉。
- **交付索引**：[positions.csv](./positions.csv)，每行一个原生 `session_id:index`，对应旧包ID、研究池和原包风险。所有 `handoff_status=pending-B-evaluation`、`formal_a_at_baseline=false`，不是“已开发”“已审核可A”或“已结项”。
- 历史队列只有 **研究池级** 的来源节点集合，不能替代**逐题**原节点/原类型/完整任务 SHA-256；此快照没有冒填未独立验证的逐题 hash。接手时必须以最新原生 `sessionTaskFor` / 真实来源锁定准确身份，再决定能否开发。

## 包级剩余数（214题）

| 原包 | 移交题数 | 历史研究池（仅研究标签） | 原包风险 |
|---|---:|---|---|
| P001 | 2 | area-grid | medium |
| P002 | 54 | place-compose | high |
| P003 | 35 | count-walk | high |
| P004 | 2 | shape-classify | high |
| P005 | 2 | angles | high |
| P012 | 13 | clocks-calendar | high |
| P014 | 2 | fraction-amount | high |
| P015 | 17 | number-order | medium |
| P016 | 6 | unmapped-source-goal | high |
| P017 | 12 | number-line-position | high |
| P018 | 7 | chance-experiment | high |
| P019 | 5 | fraction-rename | high |
| P020 | 6 | area-dissection | high |
| P021 | 13 | fraction-line | medium |
| P022 | 11 | count-objects | medium |
| P023 | 1 | scatter-trend | high |
| P024 | 8 | count-instant | high |
| P026 | 6 | widget-unclassified/x-pvpair | high |
| P027 | 3 | ratio-balance | high |
| P029 | 4 | argument-structure | high |
| P030 | 1 | widget-unclassified/x-balance | high |
| P032 | 4 | widget-unclassified/x-sort | high |
| **合计** | **214** | **22 个旧包** | |

## B 线直接执行规则

1. **先复用证据，避免重复做活**：读取 #342 最新交接/历史已开发候选、#341 原件取证和目前 main。只针对上述214位置里还没正式结项的真实缺口工作；不要重新跑既有通过的 Mac/Chromium、Node、原始 Check。旧候选若有可复用数学证据，先核对其 source/task/HEAD 和结果，再补缺而非重新开发。
2. **按数学不变量而不是同一个 widget 批量推进**：每批在 #343 登记实际题位/原 `nodeId` / task SHA / 正反例数学合同 / 原模型保存的真实动作 / 与现有 A 冲突检查。研究池可拆分。能得到严格过程证据才做专属模块、Node负例和必要的真实原生 Chromium wrong→correct Check、State-v2/离线等检查。不要捏造缺失的过程历史、策略或儿童掌握。
3. **证据不足的也可真正收尾**：明确注明 `已结项、无需开发（保留原A–E分类）` 和理由，或暂列 `证据不足/依赖阻塞`（有具体可解除的阻塞才留待办）；不得把214/214强行升A。将本次新结项与既有 B119 的“已结项、无需开发”分别统计，不能重复算。
4. **只写本家族独有文件及开发分支**。B 线不抢中央共享 `manifest`、正式路由、feedback、`sw.js`、release、CI 的写权限。每批保留冻结开发HEAD、补丁、Node/Chromium原始 JSON/PNG、正式可下载 Artifact/ZIP（如有）、回执及SHA；原始记录不公开写入生产树。未跑标 `NOT_RUN`，失败标 `FAIL`；无独立人审。
5. **交回中央集成线**：每批准确数量、逐题状态、新旧证据出处与hash、排除位置、代码和候选 PR/branch，中央只做必要共享接线、原 Check 只读核验、适用 exact-HEAD CI 和真实合并后 main Required/Fallback。通过才把新题计 A；不部署 VPS/生产。
6. **防止交叉开发**：#342 从交接后停止新候选开发；#343 承接这214道并保留已有 B 工作历史。若 main 以后增加正式 A，B 线在认领前重新用**当时 main** 逐题去重，仅消除已经完成的条目，不擅自扩容或改写本冻结214索引。

## 当前完成口径

- **已完成本次范围与责任移交**：214/214 已列入 B 开发/评估队列；不是“B 已逐题完成”，也不是“严格A已批”。
- **待 B 线实际执行**：214题的候选开发或理由充分的保留原分类结项；当前尚未替 B 线宣称开始跑本机 Codex。
- **保持既有正式范围**：main A1663/1996、A线剩214；B 原119道已经全部“已结项、无需开发”；这次移交不改任何官方 A–E、生产路由、原题、判题、原记录、Service Worker 或 VPS。

本目录只保留正式交接文件，固定使用 GitHub 提交 SHA 引用，后续逐题状态在 #343 的评论及派生批次里追加，不能静默重写这份历史差集。