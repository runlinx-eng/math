> 本窗口代码：PR #351，源 HEAD `fec2d5446c979741e3207a0c70f3e792a10eb5cf`。A–E 审计注入状态 `IMPLEMENTED_EXPLICIT_INJECTION_DEFAULT_OUTPUT_BYTE_IDENTICAL`；默认 CLI stdout 与7份输出字节一致、A813。采用113 types-aware家族表示；145条只作历史备选。生产注册/人工批准与新激活HEAD门禁仍未执行。

# #341 正式接入待审批变更集

状态：**隔离共享组合、纯模块拆分及扩展审计接口已实现；本材料中的正式激活与缓存 patch 尚未应用。365 道 `formalA=NOT_GRANTED`，正式 manifest 仍813。** 原数学合同、负例与工程证据复用。本材料不要求再做一遍原113套数学 Node/Chromium，也不创建额外 Python 抽查任务。

## 已消除的结构障碍

候选 presentation 已拆为纯 `issue341-candidate-feedback.js` 和薄 `issue341-isolated-integration.js`，并已进入代码提交。纯模块只依赖候选描述与原有限反馈，不导入正式 `thinking-feedback.js` 或 `evidence-adapters.js`；薄模块才显式调用共享 factory。

因此，未来经批准的正式 registry 可以导入纯模块的 normalized adapters，正式 feedback 可以导入纯回调，**不再需要从正式模块反向导入当前隔离 composition，避免 ESM 初始化环**。当前仅实现隔离组合，不启用生产。

## 正式注册准备方案：113 个 types-aware 家族

中央已选定 **`PLANNED_TYPES_AWARE_113_NOT_ACTIVATED`**。这是已实现并验证的技术表示，不是数学准入批准，也不再是等待用户决定的阻塞。145 个 `(家族,type)` 条目只保留为历史备选，不进入当前实施计划。

| 选择 | 实际表示 | 必要适配 |
|---|---|---|
| **当前准备方案：types-aware** |113个原数学家族条目，每项保留完整 `types` 数组；365行采用原 `issue341-PACKET` ID | 共享 factory、扩展审计及 A–E 分类显式注入均已支持类型集合；默认 CLI 的 stdout 与7份审计文件保持逐字节相同，正式813不变 |
| 历史备选：旧单 type 形状 |145个 `(家族,type)` 条目；单类型家族保持原ID，多类型条目使用 `issue341-PACKET-x-type`；仍是113数学家族 | 未选择、未导入；保留映射用于追溯，不要求用户重新选型 |

`alternative-single-type-adapters-145.json` 保留145条历史配对与精确题位，`admission-requests-365.json` 每行均明确选定 `PLANNED_TYPES_AWARE_113_NOT_ACTIVATED`，实际拟用 adapter 是原家族 ID。它们是申请材料，**没有生成或替换正式审核 manifest**。

单类型替代模块通过 `task.type===declaredType` 后才调用原 normalized binding，保留原 replay/submitted 和完整 record；不能把宽泛控件类型当正式数学家族。

## 经批准后，生产代码的最小接入方式

1. `dist/learning/evidence-adapters.js`：导入已获准的纯 adapter 列表，在正式 `EVIDENCE_ADAPTERS` 追加相应条目；本次未执行。不要导入 `issue341-isolated-integration.js`。
2. `dist/learning/thinking-feedback.js`：用正式 registry 对 exact source 作唯一匹配。匹配获准候选时，guide 调用纯 `issue341GuideForBinding`，feedback 必须先通过原 `submitted(task,model,record,context)` 再调用纯 `issue341FeedbackForProof`；其余来源继续走原 legacy 分支。正式路径不能调用会再次合并候选列表的隔离 factory，否则会重复ID；也不能让 fallback 回到同一新函数形成递归。
3. `docs/spatial-learning/evidence-review-manifest.json`：独立审批完成后才逐题写入批准来源、完整 taskHash、明确 adapter、`method:null` 和审核依据。请求文件不是批准记录，不能自动转换为生效 manifest。

**部分题位获批时的边界：** 若独立批准只覆盖某家族的部分题位，不能追加整个家族 adapter 后自动启用其余未批准来源。正式 binding 与 manifest 必须共同按已批准的 `(sessionId,index,nodeId,taskHash)` 准确子集过滤，或等待该家族全部题位获批再接入；未批准的同族题位继续拒绝正式反馈。当前隔离全365实例不因这条未来正式准入边界而改动。

原 learn.js 已从 `thinking-feedback.js` 使用相同导出，因此以上正式路由**不需要改变原学习记录、State-v2、原题、判题器或 UI 数据形状**；也不需要非 release 的 learn.js 改动。未来批准版保留的隔离检查若仍需调用原 factory，应显式提供不包含已准入候选的基础列表，或改为测试正式实例；不允许悄悄合并重名条目。

### 正式启用必须显式处理当前隔离元数据

当前纯模块返回的 binding 包含 `strictAApproved:false`，反馈包含 `proposalStatus:ISOLATED_INTEGRATION_NOT_FORMALLY_APPROVED` 与 `candidateFamily`。这些字段准确描述隔离阶段，不能盲贴隔离 wrapper 后当成正式完成，也不能在人工批准前改成已批准。

获批的生产适配层应从正式 manifest 的准确题位、nodeId、完整 taskHash 和批准依据推导批准状态，明确处理 `strictAApproved`、`proposalStatus` 等展示元数据；保留原 submitted 全记录门槛、method:null 与已审反馈范围。隔离实例继续保留未批准标志。测试应分别检查生产获批来源、未获批来源以及隔离实例，不以改一个布尔值替代准入。

正式 registry 只插入获准家族一次。当前隔离 factory 会组合默认 registry 与显式候选；生产默认名单已含候选后再调用它将产生重复 ID，因此正式路由应直接使用唯一注册实例，或由调用方明确分离基础名单。不得静默去重、依赖 first-match 或让 fallback 递归回同一入口。

## “三个共享文件”之外还必须收尾的实际代码

仅改这三个文件不构成可发布状态，原因来自现有实现：

- **正式分类与扩展审计的生产配置。** 两个审计入口已支持显式 `exampleFor`、`recordFor` 与 `.types[]`；A–E 审计只在直接 CLI 时写正式输出，注入模拟只返回内存数据并标为未批准。原/新 CLI 各一次兼容性核对确认 stdout 和7份审计文件逐字节相同，默认813不变。全365原完整记录的新分类注入、缺 record 不回退 replay、错误 type/歧义拒绝的3项测试已通过。正式激活仍须把获批名单与原完整记录 provider 明确接入正式审计调用，不能把现有模拟结果当正式 A，也不能让默认无 record 的 CLI 自动跳过 submitted。这里剩余的是获批生产配置，不是待实现的注入接口或旧数学重测。
- **发布缓存。** 已提供纯生产入口的完整缺失清单及哈希，见下面。新增依赖必须随批准的正式运行时一起进入缓存，不能仅在有网络的页面通过。
- **CI/收据/测试预期。** 当前365隔离测试中的“默认拒绝”和“manifest813”断言真实反映未准入状态；获批后需依据明确批准清单改成对应正式路径的准入与拒绝边界测试。此前未改的数学合同/控制器测试证据继续继承，实际新的正式共享/缓存 HEAD 才执行适用门禁。
- **长期远端CI原件来源。** `authorized-durable-ci-input-source` 尚未落实。当前GitHub runner按原12份Artifact IDs下载；Library中的持久原件和本地 `--archive-dir` 只证明可精确恢复，不能写成远端runner已具备到期后的自动取件能力。应落实受许可且CI可访问的同一字节原件源；之前维持缺失fail closed。自动审批曾拒绝raw gzip写Git，本轮metadata-only替代不授权再次raw发布，也不能为续期重跑原套件。

## 精确 SW 缺失清单与未执行 patch

`activation-sw-dependency-closure.json` 固定了当前源码 SHA256、当前 SW SHA256、静态相对 import 图和逐文件缓存 URL。

- 从纯候选入口起：闭包213文件；当前缺116文件，组成是113原候选模块、candidate-descriptors、candidate-feedback、原inactive共享反馈文件。
- 从隔离 wrapper 起：闭包290文件；当前缺117文件，额外包含isolated-integration。
- 正式路由直接导入纯入口时，isolated wrapper 不必进入生产闭包。如果选145条类型替代并把其包装器另存为生产文件，还需将该包装器本身加到清单；这是额外1个文件，不是新数学家族。
- 原B39懒加载和其既有依赖缓存继续继承；先按原 `ensureB39Ready()` 规则读取真实来源，不改 loader。

`PENDING-APPROVAL-cache-only.patch` 已准确准备116条缓存新增，**未应用**。它只表达缓存差异，不能单独发布：对应文件必须存在于批准版本，且后续 release 同步和离线验证不可省略。若纯模块继续修改，应重新生成材料以记录最终哈希；不需要重跑旧数学测试。

## 既有 release / entry / navigation 同步

当前 release 为 `math-explorer-20261121-p9-signed-order-v1`。正式候选代码与缓存变更完整后，选定明确版本名称，再使用既有工具：

```sh
node scripts/ci-release-sync.mjs sync --release <明确的math-explorer版本名称>
node scripts/ci-release-sync.mjs check
node --test tests/ci-release-sync.test.mjs
node scripts/ci-push-preflight.mjs
```

本材料没有执行这些命令。工具将同步 `dist/sw.js`、`dist/space.js`、`dist/exploration.js`、`dist/learning/learn.js`、`dist/learn.html` 五处 release，更新启动入口 SHA256 和现有8份导航 fixture 哈希。完整路径已列在机器材料中。若 learn.js 有非 release 变动，工具会拒绝自动刷新指纹；应审实际入口变更，不能把旧审阅指纹直接覆盖掉。

SW 变动会依据现有 targeted 规则触发长时离线、SW导航隔离和release升级重复测试；共享学习代码对应 P9/P10、Required、实际触发P8/Overview和Artifact都以变更HEAD为准。主线合并与部署仍分别保留用户授权，真正合并后才执行新main Required/Fallback。

## 独立批准请求的实际内容

365行请求已把需要审批的对象变成可检索数据：准确原题身份、原模块SHA与导出、保留的额外Check门槛、原ZIP/member与raw/results哈希、新反馈类型、独立agent文字审查与最终实现审查文件SHA、正式registry表示选择。最终实现审查绑定6个实际代码文件，材料生成时确认这6份字节仍与审查一致；这种字节比对不重跑数学合同。每行明确 `independentHumanApproval=PENDING`、`formalA=NOT_GRANTED`、`officialManifestWritten=false`。

剩余决定按真实依赖分组：新反馈/数学正式批准，已选定113家族方案的获批生产注册与元数据处理，正式审计的获批来源配置，离线release闭包，实际变更HEAD门禁，主线合并及新main双验，部署授权。完整record扩展审计与A–E注入接口、纯模块拆分和最终实现独立agent审查均已完成；145条历史备选不是当前阻塞。任何一项等待批准均不应阻止继续完成其他可执行的集成代码与材料。
