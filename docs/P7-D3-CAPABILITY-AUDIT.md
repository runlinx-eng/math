# P7-D3｜学习能力完整清查与保留性审计（D3-A）

> 基线：远程 `main` `097dd53bc09a673a97d6be8f229d446f0f2eeca3`（2026-11-09 核查）。执行 Issue #34，关联 Issue #30。本文为**源代码审计与待验收清单**，不是儿童使用有效性结论。
>
> 并行变更：Draft PR #49 已在处理完成页下一任务、可选总结及首屏按钮，**不在此分支重复实现或宣称完成**；合入时应另行验收。

## 1. 完整清单：可重建、可追踪的粒度

`node scripts/build_p7_d3_inventory.mjs` 从 **当前源码** 生成以下文件（CI 产物路径为 `verification/p7-d3/`）：

- `capability-map.csv`：逐行、可在表格中筛选的完整来源映射。
- `capability-map.json`：含原始映射、任务类型分布、清单汇总与自检诊断。
- `audit-counts.json`：汇总、任务类型及诊断。

**字段**：`group | source | id | originEntry | userTask | dataJudging | currentUI | recommendation | status | evidence | preservation`。按照用户提出的「来源/ID → 原入口 → 用户任务 → 数据和判题依赖 → 当前 UI → 建议去向 → 保留或合并状态 → 验收证据」建立，没有把任务类型混同为任务实例。

源资料此前宣称的**预期基数**（须由本分支 CI 重新验证，不能以本文代替运行结果）：

| 源对象 | 预期数量 | 可复核来源 |
| --- | ---: | --- |
| 数学源节点 | 587（537 领域、50 数学思维） | `dist/data/atlas.json`、`docs/PRODUCT-VISION.md` |
| 源关系 | 1,223 | `atlas.edges` |
| 已配置节点任务 | 1,996 | `TASKS` 聚合（B02–B39 及基础课程） |
| 专门联合任务 | 1,552（776 个双任务桥） | `BRIDGES`，每个要求真实 `sourceBridge` |
| 尚无专门桥接活动的源关系 | 447（若 776 均对应不同源边） | `atlas.edges` 对桥接源边的差集 |
| 旧工作面活动变式 | 12（3 种活动 × 构造/迁移 × 2 种条件） | `exploration-content.js` |
| 旧自由练习模型 | 理论上每个节点活动各 1，按生成结果核对 | `PRACTICE` 与 `models[-1]` |

**重要区别**：有 1,223 条知识关系 ≠ 每条关系都有联合任务；有 1,996 个可判题任务 ≠ 每个数学目标都完成教学验证。不得从条目数量推断儿童理解、思维成熟度或真实实践完成。

## 2. 能力链路及当前入口

| 能力域 | 实际来源与入口 | 现状与处理 |
| --- | --- | --- |
| 3D 知识选择/学习路线 | `space.js` → `openLearningLesson` → `learn.html#id`；`catalog.js` `ROUTES` | 已接入；路线不是强制知识前置关系 |
| 动手构造/自由操作/观察/预测 | 基础 13 种任务控制、B02–B39 `x-*` 模型/视图；`TASKS`、`PRACTICE` | 正式任务已接入；原 `play` 隐藏并迁移模型，**需核对损失的自由操作入口** |
| 推理/论证/反例 | `phase5/b38.js` 的 `x-r38-chain`、`x-r38-counterexample`；更多相关 `x-*` | 已配置且有专用判断；不把自由文字自动判为已证明 |
| 作品检查、错误反馈、修订、重试 | `tasks.js` `validModel/inspect`；`phase4/engine.js`；`state.js` `currentSubmission/submitLesson` | 已接入；`correctionGuidance` 只有百格等局部定制，多类型下一步支持待验 |
| 思维线索 | `thinking-feedback.js`（百格、分数改名、反例）；`workspace-flow.js` 的部分已检验解释 | 只在若干真实作品上有证据型反馈；**不能宣称 50 个节点已自动识别** |
| 基础/后续/联合学习 | `atlas.edges` + `bridges.js` `sourceBridge`；`p3-workflow.js` | 有来源关系及部分桥接任务；折叠入口需验可发现性 |
| 发现记录/足迹/问题恢复 | `state.js` `notes/draft/cases`；`daily.js` `captureSession/resumeQuestion`；`exploration.js` 足迹 | 已有保存/兼容处理；跨刷新现场和相机恢复仍需实测 |
| 拓展与实际应用 | `p3-workflow.js` `configuredApplications` 五类、`p3-view.js` 折叠入口 | 模拟活动可达，现实建议未核验，不能被判为真实实践 |
| 离线/导入导出/旧记录 | `storage.js`、`exploration-core.js`、`import-conflicts.js`、`sw.js` | 存储/恢复机制已存在，浏览器离线及冲突处理需逐场景回归 |

**当前工作区**：`learn.html` 四区依次为当前问题、数学操作、检查依据、发现与继续。统一的是主交互外壳，**不是**统一题型操作步骤或判题算法。新学习记录和旧 `activities`、`journeys`、`legacy` 记录仍是不同模型。

## 3. 五类状态及暂不处理原则

1. **已完整接入**：仅在来源、运行器、入口及保存/恢复测试都逐项通过后才允许定为「完整」。CSV 当前的「1 · 源码技术链路已接入」不等价于儿童/浏览器验收完成。
2. **已接入但交互不合理**：如完成后的下一操作在视口外、历史信息干扰思考；需要真实 DOM/视觉证据。
3. **存在但入口不清晰**：折叠的联合任务、实践入口、旧工作面的独立活动。
4. **尚未归类、暂保留**：旧 `PRACTICE`、早期路线 A、旧测验、两个英文实验室等。
5. **确认重复且具有等效替代路径**：**本次没有任何条目获准删除**。必须先核对输入、判题、历史恢复、视觉及实际操作均等效，才能列入此类。

CSV 中对未完成浏览器验收的“1”标记是**源码接入等级**，而非已验证的完整接入声明。所有行保留源路径及审计边界。

## 4. 优先级排序的交互问题及有界修复路径

| 优先级 | 问题与代码线索 | 最小行动／证据门槛 |
| --- | --- | --- |
| **P0** | 任务完成页的主操作未始终首屏可达；路线最后一项的真实继续路径不明显（`learn.js` 完成分支、`p3-view.js`；PR #49 已在修正） | 先等 #49 验收最新 Chromium 的按钮矩形及真实源边；仅处理仍失败的具体页面 |
| **P0** | 旧 `PRACTICE` `models[-1]` 的原操作工具可能因统一工作区而不可见（`enterUnifiedTask` 只迁移兼容形态） | 对 **不同模型** 的自由操作逐种比对；先保留原记录与原模型，不视为重复；明确原入口或等效替代 |
| **P1** | 操作失败后部分任务只有泛化提示，孩子不知道改哪一步（`correctionGuidance` 主要覆盖 `grid`） | 选出有实测失败证据的题型，在原检查器不变前提下补可执行步骤；每型做错误→修改→复检 |
| **P1** | 任务完成页预填 `lesson.summary`，可能在孩子自主解释前给出结论（`learn.js` summary 分支） | 比对练习先后关系；未验证前不贸然删掉数学解释；应以“孩子先表达/系统后说明”的折叠或时机调整处理 |
| **P1** | 联合任务及应用多在折叠次级区，难以辨认真实学习去向（`p3-view.js`） | 保留全部入口，仅去重已有等效入口；确保显示来自 `sourceBridge` 的真实关联 |
| **P1** | 3D 空间与 iframe 学习面板缺少足够的共同视觉上下文，长任务可能双滚动 | 与 Issue #30 协调，按 viewport/iframe 高度/焦点可达性的实际截图确定修复 |
| **P2** | 思维线索仅覆盖特定题型，未有证据的活动不提示方法 | 先扩展行为证据采集与测试，不靠通用表扬文字“补齐” 50 节点 |
| **P2** | 旧工作面、实验室和早期路线存在多入口 | 列为保留项；只有获得完整等效性证据后才考虑归并 |

## 5. 尚未纳入统一学习运行器、但必须保留的能力

- 早期三个活动 `fair/rename/decimal`：各有两种操作阶段、两种条件变式，走 `space.js` 工作面 iframe `v2.html?embedded=1#activity/... `；其历史存储与新 `lessons` 不同。
- 每个 `PRACTICE[id]` 与旧 `view:'play'`、`models[-1]`：原始自由操作及旧备份可验证性尚不足，不可视作已被新工作区取代。
- 早期路线 A 的 `journey.html`、`journey-model.js` 独立记录。
- 英文原版空间实验 `experiments/hidden-cubes/` 和六边形实验 `experiments/bee-builder/`，经 `v2.html#lab` 跳转，不应算作已经自动评定成绩。
- 更早 `app.js`/`lessons.js` 课程测验及 `legacy` 历史导入：现行独立入口需核实，数据不得删。
- 导出 CSV、查看历史错误及记录恢复、真实问题保存/继续、离线预缓存、实际应用建议：各自不同于“完成任务”主动作，不因收起入口而取消。

## 6. 三种真实学习活动：独立测试设计

| 类型 | 真实 ID | 已追踪的检查点 | 尚需浏览器/人工检查 |
| --- | --- | --- | --- |
| 操作构造 | `quarters` 的 `match`（三个杯子） | `TASKS.quarters[1]` → `defaultModel` → 修改杯水位/小数 → `inspect` → `currentSubmission` 失效控制 | 拖动杯水、输入格式、错误提示、焦点、不同尺寸、总结保存与恢复 |
| 解释/反例 | `argument38` 的 `x-r38-counterexample` | `b38-model.js` 历史回放、反例检查、自由 `prose` 不评分、`thinkingFeedback` 不误用旧快照 | 实际独立选择反例、错误修改、表达区大小、提示是否抢先揭示答案 |
| 跨知识联合 | `link-equivalent-quarters`（等值分数→常见分数小数） | `sourceBridge` 必须命中 `atlas.edges`；两个不同教具 `equivalent/grid`；双任务结果及 `notes` 保存/恢复 | 3D 源关系线可见、入口/返回、独立完成、错误重试、刷新恢复、离线 |

测试文件：`tests/p7-d3-capability-inventory.test.mjs`。这些是 **Node 的数据/模型/判断链回归**；不能替代 Chromium 中真实点击、拖动、滚动与截图，也不代表儿童的解释已被人工审核。仓库原有 `tests/p7-learning-panel-browser.cjs`、`tests/p3-learning-flow-browser.cjs`、`tests/p4-learning-reliability-browser.cjs` 在现行 PR CI 中负责已有浏览器路径。

## 7. 下一轮人工验收（明确步骤）

1. 从 3D 空间进入 `quarters`：不看提示，调整三个杯子的水位与小数；先故意做错再检查。观察反馈是否能直接知道修改哪一杯；修改后“通过”是否立即失效，重新提交才有效。
2. 从 3D 空间进入 `argument38` 的反例任务：孩子提出能推翻“总是”的操作，写下自己的理由；确认文本没有被当成已证明；重试后确认历史及来源仍在。
3. 在 `equivalent`→`quarters` 的真实知识关系线上进入联合任务：完成第一个教具再完成百格，检查完整反馈与思维提示边界，关闭、刷新、恢复并验证两段历史。
4. 使用 1440×900、1280×720 和窄屏宽度：捕获打开、错误、修改、通过、最后一项、总结、恢复截图；记录唯一主操作相对实际 iframe 首屏的 `getBoundingClientRect()`，检查双层滚动及 Tab 键可达。
5. 导入历史包含 `models[-1]`、`activities`、`journeys`、`legacy` 的备份并立即导出：逐字节/结构核对未丢失的作品、尝试、草稿、旧模型及相机状态；停服务后核对已缓存离线入口。
6. 单独访问 `v2.html#lab` 两个实验及旧工作面三项活动，记录入口是否可见和实际可操作；找到等效替代前一律保留。

**本次边界**：GitHub 远程文件可读、可在独立分支写入；当前执行容器无法克隆远程仓库。因此 **Node、Chromium 和截图的通过与否必须以新 PR 的 GitHub Actions 输出为准**；未见结果不得宣称通过。儿童试用、Mac 实机、离线真实使用仍需人工验收。**不部署、不合并、不改 3D 源坐标与数据，不删除任何旧功能。**
