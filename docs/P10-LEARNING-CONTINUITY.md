# P10 第一轮｜完整学习闭环、保存冲突和离线分层验收

基线：`main@9f8afd53c7e477c25e0f419e165bcf1f0e304c51`。PR #66 仍为独立 Draft，不视作本分支已有。对应 Issue #34，关联 #30 和 #22。

## 实际审计结论与修复

1. **同一任务在多个标签页操作**：原 `dist/learning/learn.js` 每次从存储读取新记录后用 `mergeLesson(a,previous)` 与旧页面的工作副本合并。旧页的 `view/index`、`models` 和 `draft` 可覆盖另一个页面刚提交的同任务现场，而合并尝试数组并不能阻止作品被改回去。P10 增加保存前的冲突门槛；同一活动任务位置、当前作品、自由草稿、当前提交列表和同 ID 证据不一致时，不写入存储，并向学习者发出停止保存的警告。只阻断不能安全判定的冲突；不修改旧事件格式、数学判题、旧备份合并规则。
2. **数据损坏后的备份误导**：原足迹页保存失败时仍使用内存 `fresh()` 生成正常 v2 备份，可能把“空白备份”误认为原学习记录。P10 不再这样导出；改为下载存储中的**原始文本**并明确标记“需人工恢复，不能作为 v2 备份直接导入”，原 localStorage 保持不变。
3. 其他 P7/P8/P9 任务行为不改。补足真实 Chromium P10 场景与 CI 工作流准入；旧 Node/Chromium 保持执行。

## 本轮新增自动化证据

- `tests/p10-learning-continuity.test.mjs`：保存前冲突/无冲突、任务索引、工作模型、草稿、当前历史提交、同 ID 证据、已删除现场。
- `tests/p10-learning-continuity-browser.cjs`：真实等值分数三任务和统一学习四区；首次错误、提示、修改、刷新重检、最终反思；存储中保留两次提交；另一标签页更改时阻止覆写；退出后在足迹查看、下载实际 v2 备份并在独立存储导入；损坏原文保全；浏览器离线重开 3D 与完成任务、恢复联网。生成 `verification/p10-learning-continuity/` 的图片、`results.json` 或 `failure.json`。
- 多类型既有证据：`tests/p7-d7-multi-type-browser.cjs` 的分数、十进位/位值、立体搭建、论证、联合任务；`tests/p9-thinking-feedback-browser.cjs` 的有界反馈；`tests/p8-mode-real-click-browser.cjs` 的三模式真实点击；`tests/p4-learning-reliability-browser.cjs` 的缓存/离线；`tests/p5-integration-browser.cjs` 的冲突导入，均应运行并区分是否属于当前 CI 门禁。
- CI：`.github/workflows/pull-request-baseline.yml` 的 Required 把 P10 Node、真实 Chromium 与截图产物纳入。Overview 按现行 path 规则触发。

## 尚未据此判定通过

- **离线层次**：Service Worker 对同域资源有 precache 与网络优先回退，但“第一次缓存后可离线打开”不等于可下载的独立安装包。未访问资源、首次未完整安装缓存、Service Worker 升级过程、浏览器清除站点数据和浏览器私密模式都需额外验收。
- **旧数据**：现有 P4/P5 测试覆盖 V1 导入和 V2 合并的部分案例，本轮未取得真实历史孩子备份进行端到端迁移，不声明所有旧备份已验收。
- **多类型**：本轮新增纵向闭环主要针对等值分数；P7-D7 已覆盖其他若干类型的前后操作，但并非 1,996 个节点任务和所有联合任务逐一验收。
- **真实用户**：Mac 触控板/键盘、关闭应用后隔天再进、儿童独立使用、独立数学教研、长期数学思维效果仍未通过人工验收。数学思维反馈不能据一次正确宣称掌握。

## 交付判断门槛

待 PR #67 最新 SHA 的 Required、Overview 和适用 P8 回归完成且成功后，本轮可标记为**有限范围工程通过**。任何失败须保留原日志、截图与缺口；不得使用历史 SHA 的成功冒充最新验证。不经用户新授权，不合并、不发布 VPS。未来进入可下载本地发行版之前，要先完成关键保存/导出/导入/升级/离线兼容矩阵及 Mac 实际使用核查。

## P10 第二轮｜长周期可靠性与离线升级审计（2026-11-11，堆叠 Draft）

依赖：PR #67 的 `96844424ceb534e7ca5f864a006b72a52efd0d60`，本轮独立堆叠分支 `fix/issue-34-p10-longterm-offline-round2`，对 #67 发起 Draft PR。PR #66 独立且未合并；此轮没有引入它的新增反馈功能。上述仓库状态以开工核查为准，CI 以本轮**最新 head**为准。

### 源码审计发现与最小修复
1. **3D 主入口损坏记录导出**：`dist/space.js` 原来不论 `readLearning()` 能否验证存储，都可能将内存状态导成正常 v2 文件；现与足迹救援一致，阻止虚假的正常备份，按原样导出损坏存储文本，提示不能直接导入，且不修改已有 localStorage。
2. **3D 主入口导入冲突遗漏**：足迹 `dist/exploration.js` 已使用 `assertNoImportConflicts`，但 `dist/space.js` 的导入路径没有调用，可能在不同浏览器导入过程中对同 ID 证据和草稿发生静默合并；现调用原有 P5 冲突防线，在写入本机快照/合并记录之前拒绝有冲突的文件，不新建数据格式。
3. **离线就绪状态陈旧**：主界面原来按固定旧缓存名和部分资源清单判断“离线就绪”，无法可靠识别新版完整资源。现在由 **当前控制页面或活动的 Service Worker** 消息接口核对自身 `FILES` 全量预缓存清单与当前版本缓存；缺资源显示未就绪，避免把少量已访问资源误认作全部离线可用。Service Worker 改为独立版本名，从旧版安装新的缓存；原有 install/activate/fetch 策略和数据 schema 不变。

### 验收覆盖和证据分层
- 新增 `tests/p10-longterm-offline-browser.cjs`，并纳入 Required Chromium 门禁、截图和 failure.json：原生 `equivalent` 分数、`shiftfine` 位值、`solidstack` 立体搭建、`argument38` 推理，每种首题真实操作答错→修改→刷新→重新检查→进入下一题→关闭标签页→重新打开→足迹；分别验证提交历史仍有两次。**首题恢复不等于四门整课完成**。原 P10 `equivalent` 的完整三题及总结闭环仍由 `tests/p10-learning-continuity-browser.cjs` 验证；联合任务原 P7-D7 有整课回归。
- 另覆盖 3D 主入口损坏文本真实下载、缓存资源缺失发现与网络恢复、离线重开已有学习任务和 3D。既有 P4/P5/V1/V2/多人标签页测试继续运行，不代替真实历史儿童备份。
- **A 已实际通过的项目**：仅在本轮最新 SHA 的 CI 返回成功后填入，不提前填写；PR #67 上轮独立技术回归不作为本轮证明。
- **B 尚需更充分验证**：真实 Service Worker 跨发布版本更新（旧版浏览器长期运行、切换/接管、更新失败回滚），未曾打开的所有动态任务组合；浏览器重启/隔天真实 Mac 机器、V1/V2 儿童历史备份和低容量下的真实浏览器行为。
- **C 不属于当前已交付**：不含独立 Mac/Windows 可下载安装包，不保证清理站点数据后仍保存记录，不提供云同步或设备间自动同步。

### 验收保留
缺少完整四种数学活动的全部题目纵向完成、真正历史备份迁移矩阵与 Service Worker 多版发布切换实验时，P10 只能评估**有限范围工程可靠性**，不能声明全量验收或正式收尾。Mac 人工/儿童试用/独立数学教研继续开放；不改数学源节点、判题、思维来源、固定 3D 坐标。不合并、不部署 VPS。


## P10 第三轮｜跨真实发布版本与旧记录迁移验收（待最新 CI）
- 基线：main `9f8afd5`；#66/#67/#68 仍是 Draft；第三轮堆叠在 #68 的 `8fd87d9` 上。没有合并或部署。
- 新增 `tests/p10-release-upgrade-browser.cjs`，用 `git worktree` 同时提取 #67 真实旧版与本 PR 新版，在同一 localhost origin 下切换真实静态文件；只通过本机测试 HTTP 服务器切换发布目录，不修改判题或伪造 Service Worker。
- 真实 Chromium 场景包括：旧版三题原判题与提示/解释保存、关页重开、旧版离线答错、新版 SW 安装/激活及旧缓存清理、升级前后完整 v2 JSON 对比、旧新标签页并发阻断、新版未访问 B39 模块离线首次加载、离线真实推理判题、真实浏览器 V2 导出跨 profile 导入及重复导入、构造 V1 兼容备份、损坏/不支持文件拒绝、真实配额耗尽、模拟新版必需资源失败及修复后重试。
- 证据：`verification/p10-release-upgrade/results.json` 或 `failure.json`、`before-upgrade.json`、`after-upgrade.json`、`browser-export-v2.json` 与 Chromium 截图，保留在 Required Actions artifact。
- **验收等级：** CI 对应第三轮最新 SHA 为 success 且产生对应 JSON 才可将该具体场景标为 A；CI 失败及未运行均保持 B/C，不能借 #68 历史绿色结果宣称第三轮完成。
- **重要限制：** V1 是自动构造兼容样本，V2 为真实浏览器测试作品，而非历史儿童备份；旧新版实际浏览器长期挂起与外部断电、Mac 人工、儿童独立学习、独立教研未验收。四大类当前完整全部题目尚缺逐一完成的离线证据，不得将首题当整课。
- **本地地址迁移：** 下载版若改变 origin、端口或 WebView 数据目录，`localStorage` 不自动随安装迁移。正式安装开发须在旧网址人工导出 JSON，明确提示保存备份；新应用导入前保留快照，冲突阻断，导入后比对任务数/提交数/说明文字及原生判题，不许自动清除旧站点。安装程序与系统数据目录迁移仍由 #63 后续设计。
- 本轮不修改 537+50 节点、1,223 关系、数学判题/思维反馈、3D 固定坐标、存储 schema。P10 工程收尾必须以升级中断、数据恢复及多类型完整闭环的实际证据判定。


## P10 R3 跨版本导航故障复核（2026-11-11）

- 对比真实 Required run `43027731839` 的 job log 与 artifact `13858881628`：Node、P9 Chromium 23 项、P10 continuity 24 项、P10 R2 Chromium 43 项成功；R3 在旧版三题、离线操作、关闭重开、升级前后完整存储 JSON 一致和新版完整缓存检查后，`learn.html#share` 的导航 commit 超时 45 秒。
- `before-upgrade.json` 和 `after-upgrade.json` 均 1,992 字节，实测内容保持一致；这是故障之前的记录保护证据，不证明后续迁移矩阵成功。
- 故障前 Cache Storage 同时存在 `math-explorer-20261111-p8-b39-lazy-v1` 和 `math-explorer-20261111-p10-continuity-r2-v1`；是否属于旧 Worker 并发写入、清理竞态或测试 HTTP 服务器响应阻塞，尚无证据定论，不能把缓存共存直接写成根因。
- 提交 `50862fb` 为真实 Chromium 测试新增 HTTP 请求/完成/中止、页面请求/响应/失败、Service Worker 创建与状态、失败时浏览器状态诊断，保存 `diagnostics.json`；不放宽导航、版本升级、记录完整性或离线判题断言。
- **工程门槛仍未通过（C）**：不得把调试日志改动称为根因修复；旧标签页防覆盖、升级中断恢复、V1/V2 文件迁移及四种全课离线闭环仍待本轮实际跑完并按场景 A/B/C 核验。真实历史儿童备份、Mac 人工、儿童使用和独立数学教研依然未完成。

## P10 R3 第五阶段：复验环境中断与证据边界（2026-11-11）

- 重新核查 main `9f8afd53c7e477c25e0f419e165bcf1f0e304c51`；#66/#67/#68/#69 仍为 Draft。PR #69 依赖 #68，#68 依赖 #67；#66 独立。
- `2bcb3b663da23096674b4f27186c96fb4eb71687` 上的 Required run `43036967556` 与 P8 run `43036967682` 均失败于 Chromium 安装前置步骤，而非浏览器断言：Ubuntu apt 镜像 DNS `Temporary failure resolving 'azure.archive.ubuntu.com'`，`playwright install --with-deps chromium` 返回 100。Required 的 Node/语法步骤成功，浏览器回归跳过。该次不能作为上轮 SW 修复通过或失败的证明。
- 历史失败 run `43031402992` Artifact `13860279890` 的 `diagnostics.json`/`failure.json`：旧、新学习存储 `before-upgrade.json` 与 `after-upgrade.json` 字节一致；新 SW 缓存完整，但新的 `learn.html#share` 导航等候 commit 45 秒超时。服务器记录 `learn.html` 请求后 `server-aborted`，浏览器最终状态探针超时。该证据不能独立确定缓存清理竞态、fetch 生命周期还是旧标签页干扰为根因。
- 将 Required 和 P8 的安装步骤改为 `npx playwright install chromium`，仅跳过 runner 已具备的系统依赖的二次 apt 安装，不降低任何 Chromium 测试、断言或验收标准。复验须以**本次最终 HEAD** 的 Required、Overview（若触发）及 P8 结果、Artifact 为准。
- **等级 A**：仅保留有对应旧 SHA 真实浏览器原始证据的旧版三题、离线错误尝试与升级瞬间记录一致性；这不是本轮最新 HEAD 的安全通过证明。**等级 B**：升级后导航、旧标签页覆盖防护、V1/V2 浏览器导入、quota、断网升级、B39 和四类整课离线均仍待最终 HEAD 实测。**等级 C**：历史浏览器导航出现超时；未完成工程闭环，P10 不得收尾。
- 真实历史儿童备份、Mac 人工使用、儿童独立学习和独立数学教研保持独立未完成。没有合并、部署或变更数学题/源关系/坐标/记录语义。

### 第五阶段最新 HEAD 实际复验结果（`239c2c9d403eebbd3888626771bec39d4c450a88`）
- Required [43042940403](https://github.com/runlinx-eng/math/actions/runs/43042940403)：**failure**，不是通过。Chromium 成功安装，Node 263 项全通过；P9 浏览器 23 项、P10 第一轮 24 项、P10 第二轮 43 项成功；R3 在 `learn.html#share` 的 `goto(waitUntil=commit)` **再次超时 45 秒**。浏览器导航安全门槛依旧失败。
- 最新 Chromium Artifact [13865143932](https://github.com/runlinx-eng/math/actions/runs/43042940403/artifacts/13865143932)：`failure.json`/`diagnostics.json` 均确认 11 项前置检查通过，`before-upgrade.json` 与 `after-upgrade.json` **字节完全相同（各 1992 字节）**。事件末端：已激活 SW、旧新缓存并存，`learn.html` 服务器收到请求但记录 `server-aborted`，浏览器现场探针超时。该结果说明上阶段 `2bcb3b6` 并未解除卡死；但仍未精确归因到 SW、缓存竞争、fetch 生命周期或 Chromium/测试服务器交互。
- P8 [43042940326](https://github.com/runlinx-eng/math/actions/runs/43042940326)：**success**，对应相同 HEAD。Overview 未见同 SHA 的独立运行，不能记 success。
- 本阶段未修改应用 SW/存储代码；仅修正 CI 环境并重现原障碍。**P10 保持未完成，关键升级后测试均未进入，绝不宣布儿童记录全量安全。** 下一步应针对最新 `learn.html` server-aborted 做真实隔离对照实验并修对应根因，不靠增加超时。
