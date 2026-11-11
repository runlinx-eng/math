# P10 第一轮｜完整学习闭环、保存冲突和离线分层验收

## P10 R3 第十二阶段：真实生命周期门禁与保守缓存清理（2026-11-12）

本节是本轮状态入口；下方各阶段保留历史结论，不能把历史绿色结果算作当前 HEAD 的验收。main 仍为 `9f8afd53c7e477c25e0f419e165bcf1f0e304c51`，#66～#69 都是未合并 Draft；#69 依赖 #68，#68 依赖 #67，#66 独立。

### 已纠正的证据错误

- 固定的 Playwright 1.56.1 在 `waitForFunction` 中判断 predicate 的直接 truthiness。异步 predicate 返回 Promise，随后即使解析成 `false` 也不会继续轮询。`1718439` 的真实 Chromium 控制实验已经返回 false handle；因此第十一阶段扩大 `newReady` 条件仍没有真正执行等待。现在以 Node 侧逐次 `await page.evaluate` 并要求 `ready === true`，同时核对 active/controller 身份、activated、无 waiting/installing 和双方当前完整 manifest 回执。
- [Required 43071591660](https://github.com/runlinx-eng/math/actions/runs/43071591660) / [Artifact 13878912558](https://github.com/runlinx-eng/math/actions/runs/43071591660/artifacts/13878912558)，PR head `1718439d1e93e2e9c8e070558727343c9780103e`，实际 checkout `7ca8185eb012ef5f2bfce24726822aff9b6d00c0`：旧版控制下 C 与 N 两条缓存路径仍超时；正确等待后完整测试停在新 worker waiting，而不是假报已经接管。N 的旧 worker 进程内日志不可读取，不能据此断言 `cache.open`、`match` 或 body 已完成；后续只补用户允许的 N/O 持久化时序记录。
- 历史旧 worker `9684442` 没有 message handler；其不回复新版 cache-status 本身是协议不支持，不能据此判断卡死。上一轮 retry 失败的 `browserState` 指向另一个已成功升级的 profile，现修正为实际失败页。
- 原失败安装分支没有等待 installing→redundant；现必须观察真实失败，同时记录实际 503 请求、旧 active/controller 身份及原记录。重试只有真实接管且完整缓存后才能进入清理。
- 原 Quota 测试按 1 MB 增量填充可能留有大量余量，且导入后立即读取，不能证明实际导入保存失败。新的独立门禁先保存非空原生学习记录，填到单字符容量边界，分别验证快照写入失败和合并记录写入失败，等待异步导入结束和失败提示，再关闭整个浏览器重开比较原记录字节。
- `setOffline(true)` 不足以证明 worker 自身网络已经断开。整课测试现在真正关闭测试 HTTP listener；升级测试真正切断测试连接。HTTP 503 安装失败与真实断网分开记录，不用错误页面冒充离线恢复。

### 第二轮有效取证与独立验收（并非后续修复 HEAD 的验收）

- PR head `3ec4ce5178a9b05191a0e11e400fc2fdbf594818`，实际 checkout `ae2273c2b90ed19d18740c36514162ba96dccd99`，相同 tree `308cbd69bb67ae9e03319ce320f88268e221f151`。[Required 43073390818](https://github.com/runlinx-eng/math/actions/runs/43073390818) failure，[P8 43073390620](https://github.com/runlinx-eng/math/actions/runs/43073390620) success；[Artifact 13881685302](https://github.com/runlinx-eng/math/actions/runs/43073390818/artifacts/13881685302) 已下载核查。
- N1 持久化记录在 18:00:52.563 UTC 显示 `fetch:event` → `cache.open:start` → `respondWith:registered`，没有 `cache.open:done`；9 秒导航未提交。未到 `cache.match`，不能声称已得到 Response 或 body 消费卡住。旧调试 target 到事后采集时已关闭，不能据此确定它何时停止；新 waiting 已在这次导航之前出现，不能倒推这次读取导致最初 waiting。
- N2 导航前新版已激活，根本未进入旧复制响应处理器，不能算“复制 body 修复成功”。O 首次构造漏接原历史处理器、未满足旧版接管前提，已明确排除，仅修正 O 取证一次，不增加实验类别。
- 完整升级在发起新版学习导航前已经正确阻塞于 waiting；1126 次服务器请求都有完整响应，不能归因于 HTTP 服务尚未交付。Cache API、旧扩展事件与生命周期交接的最终因果仍待有效 O。
- 独立备份安全 41 项通过：真实浏览器 V2 导出、跨 profile 导入/重复幂等、构造 V1、草稿/作品/同 ID 冲突、坏 JSON/版本拒绝。真实 Quota 分别触发恢复快照 key 和主记录 key 的原生异常；整个浏览器重启前后原记录均 795 字节，SHA-256 `a95f2fd7c1a6c605012b349f249c6947ffe4d0a9043b0c04332b2670d7a3b345`。
- 四类整课 141 项通过：equivalent 3/3、shiftfine 3/3、solidstack 3/3、argument38 5/5。4 个独立 profile，每类两次完整关闭重开；HTTP listener 停止期间收到请求为 0，离线文档均 200 且来自 SW。14 题逐一错误、提示、修改、原判题和保存；4 次离线再判题保留所有旧提交。CI 中文字体缺失，截图不作为中文可读性或人工视觉通过。

### 最后一组有效生命周期记录

[Required 43074585347](https://github.com/runlinx-eng/math/actions/runs/43074585347) failure，[P8 43074585168](https://github.com/runlinx-eng/math/actions/runs/43074585168) success；head `08938127fc06a3255638206e215876c89ae155eb`，实际 checkout `a783509c487c3f1b3851ab391d5f632302669b54`，[Artifact 13880323113](https://github.com/runlinx-eng/math/actions/runs/43074585347/artifacts/13880323113)。有效 O 中，旧 v2 的缓存写入及扩展事件于 18:08:43.405 UTC 完成；新 addAll/skipWaiting/install 扩展事件于 44.094 完成；旧 learn fetch 在 47.551 进入；新 activate 在 48.556 开始，keys/delete（true）/claim/activate 扩展事件在 48.559 全部完成，但导航仍在 9003 ms 后超时。因此本次没有挂在 activate 的 delete，不能断言 Cache Storage 全局锁。Chromium 141 的交接代码会先退役旧 worker，再延迟 1 秒派发 activate；这与时序相符，但缺少退役瞬间的直接记录，仍不能声称内部竞态已经唯一定位。完整未修改旧版流程仍在新版真实接管门禁失败。N/O 到此停止，不继续扩大诊断；当前应用修复只针对已确认的安全清理边界，正式三次结果必须如实决定发布阻塞。

### 应用保护与正式验收范围

- 新版 SW 激活只接管，不提前删除旧版本资源。单独的清理请求由 worker 核对所有当前作用域页面的固定源码版本；旧页面、未知页面、未回应页面、新客户端、当前资源不完整或下一版正在安装/等待时，保留旧缓存并返回可重试的 `deferred`。
- 各入口源码把自身固定 release 传入 `sw-client.js`，应答实际已加载入口版本；共享 helper 更新不能替旧入口重新标记版本；不能用新 controller 身份证明旧页面 JavaScript 已更新。页面自动清理前先确认被请求的 controller 正是自己的版本，防止调用旧清理实现误删正在安装的缓存。每次清理重新确认，不依赖会随 worker 重启丢失的“旧页面已关闭”内存标志。
- 此保护修复针对已确认的提前删除边界；不能在 Chromium 对照完成前将其称为导航超时的最终根因修复。
- `p10-release-upgrade-repeat.cjs` 要求三个独立 Chromium 进程/profile 全流程成功。每次固定未经修改的 `96844424ceb534e7ca5f864a006b72a52efd0d60`，记录实际 checkout/head/tree、旧新 SW 摘要、每次浏览器完整重启及前后原始学习存储。正式运行关闭诊断注入；N/O 修改临时 worker 的结果不计入。
- 正式流程包括旧版完整三题/说明/关浏览器重开/离线学习、新版真实接管和导航、逐字节保留、旧页写入冲突、旧页存在时延期清理、关闭后安全重试、B39 首次离线、新版整浏览器离线重开与再判题保存、503/安装中途断网/旧版离线继续学习/联网重试。
- 独立的备份/配额与四类整课门禁在升级门禁失败时也继续执行，不能再把“后段未运行”写成已通过。四类真实题数为 equivalent 3、shiftfine 3、solidstack 3、argument38 5；每题原生错误→提示→修改→原判题→保存，每类两次完整浏览器关闭和离线重开。

### 应用保护提交的三次正式结果

`e133b6940ff1d5240e2cbf4b934b42211abe32c3` 已完整运行：[Required 43076196399](https://github.com/runlinx-eng/math/actions/runs/43076196399) **failure**，[P8 43076196375](https://github.com/runlinx-eng/math/actions/runs/43076196375) **success**，[Overview 43076196401](https://github.com/runlinx-eng/math/actions/runs/43076196401) **success（42 项）**。Overview 因本轮入口模块修改实际适用并触发。实际 checkout `5dc5eb3c19cd8afa8eedb51eac23bdc4537554d9` 与 head tree 均为 `7741f7b5d0eb1c66ddea7e6ac1217cafc81ac175`；[Artifact 13883610625](https://github.com/runlinx-eng/math/actions/runs/43076196399/artifacts/13883610625) 已实际下载。

- 三次独立旧版升级均实际执行，成功 **0/3**。每次前 11 项通过，随后新 worker 持续 `waiting: installed`，90 秒真实接管门槛失败；旧版源码摘要三次相同且未经修改。新版学习导航、旧标签页跨版本冲突、最终清理与失败重试分支均未到达，不能记作通过。
- 三次原记录与失败现场原文均为 1992 字节，各次前后完全相等；旧三题尝试 `[2,1,1]`、自由解释和旧版 share 离线作答仍在。每次 HTTP 1330 请求 = 1127 完整结束 + 203 受控断网断连，未结为 0；发布切换后的 368 请求均结束。该数据证明到阻塞点未丢失，不证明完成跨版本迁移。
- 原始 C 仍为 9 秒导航超时；严格 C 显示新版 waiting 缓存完整 251/251、旧 active/controller 未交接。这直接证明“缓存完整”不能替代“新版已激活”。
- 272 Node 项通过；独立备份 41 项与四类整课 141 项在本提交重新通过。Quota 重启前后各 795 字节，SHA-256 `759a30e27ddb17830c8125c5a130fad878e36fed6a2bdec36b0a1172d1fffb96`。本提交尚是空 V1 样本；后续非空 V1 增强不能倒算在这里。
- 后续工程回归没有被升级失败截断：P4/P5/P7/P8/P9 等继续运行。另有三个真实失败：`spatial-focus-semantics` 阅读说明前后快照不等、`spatial-theme-overview` 悬停前后快照不等、`concept-visual` 阅读说明前后快照不等。既有产物未保存两侧快照，不能把原因猜成时间戳、摄像机浮点误差或本轮 SW 修复；保持失败，不降低断言，也不混入 P11 改造。

上述结果仅属于所列 SHA；后续版本必须以各自产物为准。三个正式升级仍失败，应用缓存保护尚未取得跨版本浏览器全流程通过，P10 尚未完成。

### 严格离线就绪与独立重试提交的实际结果

`38b7a64f49652cf532b8d435ec0b38c8042ec87a`：[Required 43079175006](https://github.com/runlinx-eng/math/actions/runs/43079175006) **failure**，[P8 43079175077](https://github.com/runlinx-eng/math/actions/runs/43079175077) **success**，[Overview 43079174778](https://github.com/runlinx-eng/math/actions/runs/43079174778) **success（42 项）**。实际 checkout `1cb07cea4094d6c99eaac8133642823e65462e32`，相同 tree `3c47412e3ba44f297b4964990f73271b4596ba43`。[Artifact 13885276068](https://github.com/runlinx-eng/math/actions/runs/43079175006/artifacts/13885276068) 已下载逐项核查。

- 三次未经修改旧版升级仍 **0/3**，均在前 11 项之后的新 waiting 门槛失败；每次 1992 字节原记录与失败现场逐字节相等。不能将新装 SW 的成功算成历史升级成功。
- 独立 retry 实际通过前 6 项：关键资源被拒绝、新安装真实 redundant、旧 active/controller 保留、旧缓存保留、安装失败本身未改原记录、旧页面真实离线得到 SW 缓存 200。随后“重新打开课程后整个原文仍完全相等”的断言失败；尚未进入中途断网、联网重试及 cleanup。历史 `openLesson` 会更新课程 `updatedAt` 和 `daily.continuation.at`；这里是已证实的比较时机缺陷，不能算儿童学习证据被覆盖。该 SHA 未留重载前原文文件，因此也不声称已实测仅有这两个字段变化。
- 修正保留安装失败时的原文字节断言，并在应用运行前捕获原文比较；应用运行后只允许上述两处合法 ISO 时间不倒退，其他完整 JSON 字段严格相等。新增三份 retry 前后原文供后续实际 SHA 审计，没有延长 90 秒接管或 12 秒清理期限。
- 273 Node、非空 V1/V2/冲突/Quota 的 **44 项**与四类整课 **141 项**均在本 SHA 通过。V1 构造样本 1780 字节，完整对象导入和整浏览器重开均深比较通过；Quota 前后各 795 字节，SHA-256 `d0f0f7ef2afbbecae203598477f627d1c0a31eae74100cb5158d52fb9f00716f`。四类仍为 3/3、3/3、3/3、5/5；8 次完整离线重开，停服期间请求为 0。本 SHA 尚未包含独立 B39 首次离线补测。
- 两处地图快照失败只差相机 `target[2]` 一个双精度间隔（`7.105427357601002e-15`），其他字段完全相同。仓库原 `Vector3.clampLength(0, Infinity)` 可以精确重现前后值；后续比较仅允许相机 position/target 的 `4 × Number.EPSILON × max(1, |a|, |b|)` 舍入差，数学模型坐标、关系、选中对象、缩放和全部其他字段继续精确比较。没有改产品坐标或视觉行为。
- 主题悬停这次通过最初的快照比较后，在原生 hover 时被 `aside#network-guide` 遮挡并 30 秒超时；保持真实失败，不强制 hover，不混入 P11 产品修改。

这些通过与失败全部绑定所列 SHA。后续补测不得继承已完成提交的绿色结果；核心历史升级及 retry cleanup 根因仍未解决，P10 继续未完成。

### 后续验收补强与离线状态修正

入口页的离线状态原先只看旧 worker 回复的 `complete`，可能把旧版本完整缓存误报为当前页面已经离线就绪。现在主入口与足迹入口共用严格判定：回复必须属于入口固定 release，响应者仍是当前 `activated` controller 且等于 `registration.active`；旧 controller 的迟到回复不能覆盖新版状态。监听在首次异步查询前注册，避免遗漏控制器切换。此处是独立的应用级提示修复，不是导航卡死根因的证明。

正式三次流程之外，repeat runner 还必须执行一个独立 `retry` 子进程，使用新的 Chromium context 和存储。即使前三次升级在接管门禁提前失败，关键资源 503、安装中断网、旧版离线继续判题保存、恢复网络重试和 12 秒清理门槛也不能被跳过；该次运行不计入三次完整升级。每个子进程仍保留原单项 90 秒接管／12 秒清理约束，不用延长等待换取通过。

独立备份门禁的 V1 样本进一步补成非空：由原 V1 API 生成四题完成历史、错误／提示／改正、当前与暂停会话、访问记录和收藏。原生文件导入及整浏览器重开后，对整个 legacy 对象逐字段深度比较，并要求不伪造新版 lessons 证据。完整预期由 41 项增至 44 项，真实 Quota 两个失败写入点及重启保全检查原样保留。非空构造样本仍不是实际儿童旧备份；这些新增路径只有对应提交的 Chromium Artifact 才能证明通过。

B39 首次离线打开另在整课套件的全新 equivalent profile 中验证：安装当前版本后真正关闭 HTTP listener，先首次打开 calculator39，要求文档和三个延迟运行模块均为 200 且来自 SW；原生控件可见，再真实 reload，仍不能产生判题提交。此检查与历史升级分开记，成功后的整课套件预期为 145 项，四类课程仍为 14 题、4 profile、8 次完整重开；不得用它替代升级成功后的首次离线 B39 门槛。

### 证据与收尾纪律

完整证据位于 Required artifact 的 `p10-release-upgrade/`：根目录隔离时序与汇总，`run-1`～`run-3` 及 `retry-independent` 的 JSON/HTTP/日志/截图，`backup-safety/` 与 `full-lessons/`。每份结果同时绑定 PR head 和实际 checkout；GitHub 默认 PR 合并 checkout 不能被混写为原始 head。

当前未获得应用修复最终 HEAD 的三次升级与完整 CI 成功前，P10 保持未完成。A 仅指绑定实际 SHA 的具体技术检查；失败为 C，尚未执行或证据不足为 B。合成 V1、浏览器测试作品和冲突样本不是历史儿童备份；真实历史儿童数据、Mac 人工、儿童独立使用和独立教研仍不冒充完成。#63 安装包开发不准入，P11 的单一最强操作标记和简化悬停控件可在独立分支推进。本 PR 不合并、不部署、不清理真实儿童记录，不改数学源数据、判题、记录语义或思维反馈。

## 第十阶段追加：J/K 导航接管单变量结论（2026-11-12）
- `6a233427e30228633df5659f40b8dcdc2e55fac2` 的 [Required 43061158681](https://github.com/runlinx-eng/math/actions/runs/43061158681) **failure**；[P8 43061158660](https://github.com/runlinx-eng/math/actions/runs/43061158660) **success**。原始 [Artifact 13872689128](https://github.com/runlinx-eng/math/actions/runs/43061158681/artifacts/13872689128) 已下载解压核查。
- 在独立 Chromium context 且旧 SW `activated`、控制页面、旧 `learn.html` precache 确实存在、安装/预缓存/缓存名未改的前提下，J 临时旧 SW **仅不拦截** `/learn.html` 导航，22 ms 成功（HTTP 200、`fromServiceWorker=false`、实际应用已载入）；K 临时旧 SW **仅以缓存响应**该导航，9 秒超时；C 原始旧 SW 网络优先同样超时。H1/H2/H3 关闭运行时缓存写入后亦全部失败。这说明旧 SW 对 `learn.html` 调用 `respondWith` 参与失败条件，而**不能**仅归因旧缓存写入或测试 HTTP Content-Length；但尚缺 SW fetch Promise 结束与浏览器导航生命周期的直接因果证据。
- J/K 都改过**临时历史旧 SW**，并非原始历史版本升级成功；新 Worker 在 J/K 导航前均处 `waiting: installed`、旧 SW 仍 `active`。J 导航成功**不证明新 Worker 已激活接管**。
- 本次原完整真实历史升级仍在 11 项前置检查之后 `learn.html#share` 45 秒超时；未实现正式生产修复，无法给出三次修复复验或跨版本旧记录最终安全结论。仅下一步优先区分 `respondWith` 事件/响应链与 `waiting`→`activated` 的因果关系，不降低任何数据保护和完整升级断言。P10 保持 B/C，PR #69 Draft、不合并、不部署。


## P10 第三轮第十阶段：真实 A/B 结论（2026-11-12）
- PR #69 的 `64e411049ad6caaea8c585fdda862d86de28a45c` 对应 Required [43058826516](https://github.com/runlinx-eng/math/actions/runs/43058826516) **failure**，P8 [43058826548](https://github.com/runlinx-eng/math/actions/runs/43058826548) **success**。Chromium Artifact [13872343462](https://github.com/runlinx-eng/math/actions/runs/43058826516/artifacts/13872343462) 已实读；Overview 同 SHA 未触发，不能算通过。
- 原始旧 SW 控制页面、`activated`、旧 Cache Storage 命中 `learn.html` 后，C 原始对照及 H1/H2/H3（临时旧 worktree 移除 fetch 运行时 `cache.put` 和关联 `waitUntil`）**均在 9 秒内导航未提交**；三次 H 的新 Worker 均为 `waiting: installed`，旧 Worker 仍 `active: activated`，新旧缓存均在。无 SW、新装新版 SW、临时绕过 SW 导航成功。故单纯关闭旧 Worker 运行时缓存写入**不能修复**；不能归因于单一 `cache.put` 或 `waitUntil`。
- 完整跨版本旧版三题、离线答题、重开恢复、升级前后存储 JSON 逐字段/字节相等（各 1992 字节）等 11 项前置检查已通过；但之后 `learn.html#share` 仍 **45 秒 commit 超时**。HTTP 服务端收到了 `/learn.html`，在响应头发送前记 aborted/incomplete；CDP Document 未见响应提交。尚不能唯一归因于 SW、浏览器或测试服务器。当前 `newReady` 成功只能说明其实际检查的缓存状态符合要求，不能代替当前 controller/new worker 身份的独立断言。
- 为进一步验证失败是否源自旧 Worker 对导航的 `fetch` 拦截，追加 J（仅放行 `/learn.html` 导航）与 K（仅对该导航返回旧预缓存）**诊断实验**，仍只修改临时旧 SW，C/H 对照不变。这些实验不属于未经修改历史 SW 的正式升级验收；必须等对应最新 HEAD 的真实 CI/Artifact 后再归因和选择最小修复。
- 旧标签页跨版本防覆盖、新版成功接管、旧缓存清理、升级失败恢复、首次离线 B39、V1/V2/Quota、四类整课离线仍由失败门禁阻断，维持 **B/C**；不存在稳定的修复后三次通过，P10 **不得收尾**，PR #69 保持 Draft，不合并、不部署。


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

## P10 R3 第六阶段：隔离导航对照初步证据（尚未收尾）

- `472cc544ea88967cb6d68a7f64b27038781c0fe8` 的 [Required 43047313108](https://github.com/runlinx-eng/math/actions/runs/43047313108) 失败；[P8 43047312703](https://github.com/runlinx-eng/math/actions/runs/43047312703) 成功。Required Artifact [13867757144](https://github.com/runlinx-eng/math/actions/runs/43047313108/artifacts/13867757144) 包含七组真实 Chromium 隔离实验的 JSON、HTTP 事件和截图。
- 无 SW、新版全新 SW、保留旧标签页、关闭旧标签页、绕过 SW、关闭旧标签页后执行旧缓存清理、显式 HTTP Content-Length 七组测试中，`learn.html#share` 均实际提交导航并加载数学学习任务；旧、新 HTTP 资源校验一致。**这不等于完整跨版本安全门禁通过。**
- 原完整场景仍在旧版完成三题、关闭重开、离线提交后升级时出现导航 commit 超时。仅从旧缓存残留、SW 激活或测试 HTTP 收到请求不能推断根因。
- 已继续追加“旧版离线答题→恢复联网→升级”的隔离场景，提交 `f8bcdcd59252040d7eaf2e4bcec4d96311406821`；需要对应新 SHA 的 Chromium/JSON 结果验证。未定位根因前不实施应用级修复，不将诊断测试当作验收替代。
- V1/V2 浏览器导入、Quota、升级失败重试、四类整课离线仍由原阻塞门禁限制，维持 B/C；真实历史儿童备份、Mac/Windows 安装与实机、儿童试用和独立教研未完成。保持 Draft，禁止合并和部署。


## P10 R3 第八阶段：诊断前提修正与请求事件关联（2026-11-12）

- 重新读取失败 Required `43052135066` 的 Artifact `13868889992`。旧版完整三题、离线提交、关页重开、新版缓存检查和升级前后字节一致共 11 项前置检查成功；`learn.html#share` 的 `page.goto(waitUntil:'commit')` 仍超时。此前成功不代表跨版本安全门槛通过。
- 差分审计发现：隔离实验多组 `oldState` 为 `controller=null, active=null, keys=[]`；同一组 HTTP 事件表明部分旧版页面仍在加载模块时测试服务器已切到新版，旧 `sw.js` 请求由新版目录提供。故这些实验不能证明“真实旧 Worker 控制后升级成功”。这是一项**诊断方法缺陷**，尚不能确定卡死属于 SW、HTTP 测试服务器还是 Chromium。
- 原完整失败的近端事件链：导航请求开始；服务器收到 `/learn.html`；服务端记录未完成响应；未记录页面响应或 commit。之前只保留末尾 1,000 事件，且缺 CDP requestId、loaderId 等，无法证明服务端中止原因。
- 本阶段仅调整两项真实 Chromium 诊断：隔离实验通过 Node 侧轮询并保存旧版 `controller`、`active.state`、旧缓存 `learn.html` 命中及旧 `sw.js` HTTP 请求证据，新增在线先学习再离线切换的对照；原完整测试保留完整 HTTP 事件和 CDP `requestWillBeSent/responseReceived/loadingFinished/loadingFailed/frameNavigated`，记录可关联字段。保留全部旧版数学操作及 45 秒原导航断言。
- 这些是**诊断改动而非应用修复**。最新 HEAD 的 CI/Artifact 未获得真实通过前不得标 A；升级导航、旧标签页保护、断网升级失败、Quota、V1/V2 兼容、四类整课离线仍处 B/C。缺真实历史儿童备份、Mac 人工、儿童独立学习和独立教研。禁止合并/部署或清理真实数据。


## P10 R3 第九阶段：真实旧 SW 故障隔离（2026-11-12）
- 核对 main `9f8afd5`、Draft #66/#67/#68/#69 和堆叠 base；HEAD `6dc6f27` 的 Required [43055524219](https://github.com/runlinx-eng/math/actions/runs/43055524219) **failure**，P8 [43055524265](https://github.com/runlinx-eng/math/actions/runs/43055524265) **success**，同 SHA 没有触发 Overview（按 workflow paths 判断不适用）。Required Chromium Artifact [13870314043](https://github.com/runlinx-eng/math/actions/runs/43055524219/artifacts/13870314043)。
- 实读隔离的 `isolation-results.json` / `isolation-http-events.json`：新装新版 SW 导航成功（9 ms），无 SW 成功（55 ms），旧版 SW 实际激活、控制页面、持有 `learn.html` 缓存且 `/sw.js` 来自旧版目录之后，所有正常升级变体导航均超时（9 秒）；绕过 SW 成功（6 ms）。这修正了此前旧 Worker 未接管而产生的假阳性，证明真正故障与升级后的 SW 参与有关，尚不能判定具体执行机制。
- 升级变体的旧 `controller` / `active` 消息探针超时；新 SW 为 `waiting: installed`，两个版本 Cache Storage 并存。不要把新缓存已经完整误认为新 SW 已激活/接管；原完整测试的 `newReady` 通过时没有验证 worker 的 `cache-status` 实际来自新 controller。原完整测试 11 项前置检查通过，`learn.html#share` commit 等候 45 秒超时；升级前后 JSON 都是 1992 字节且内容相等，但只覆盖故障之前。
- `diagnostics.json` 记录 CDP Document request 和服务端 `/learn.html` 请求：服务器在 headers 发送前记录 aborted/incomplete，随后 readFile 回调仍试图 writeHead；没有 CDP response/finished/failed 和导航 commit。CDP 与 HTTP requestId 不相同且尚未建立唯一相关标识，不能把相邻时间当成完备的跨端因果证明。
- 仅新增诊断性 A/B：`1483b38` 在**临时旧 worktree** 中保留原 install/precache，仅关闭旧 SW fetch 期间 `cache.put` / `waitUntil` 写入，独立重复 3 次，并保留原旧 SW 对照。这些修改过的旧 SW 运行不是历史版本迁移的 A 级证据。需要实际 CI 验证再确定缓存写入是否为必要因素；此时**不更改正式 `dist/sw.js`**，不增加 timeout、不减弱数据断言。
- C：实际跨版本导航仍失败；B：旧标签页安全、V1/V2 真实迁移、Quota、断网升级失败恢复、首次离线 B39、四类整课离线均因后段未运行而未验收。真实儿童历史备份、Mac 人工、儿童操作和独立数学教研仍待验收。P10 不收尾、不合并、不部署，#63 暂不准入。


## P10 R3 第十一阶段：历史 SW 响应路径缩小、真实升级后段与未关闭风险（2026-11-12）
- 固定历史旧版 `96844424ceb534e7ca5f864a006b72a52efd0d60`，main `9f8afd5`，#66～#69 均 Draft 未合并。基线 `81abdad`：Required [43062521248](https://github.com/runlinx-eng/math/actions/runs/43062521248) **failure**、P8 [43062521306](https://github.com/runlinx-eng/math/actions/runs/43062521306) **success**；Required Artifact [13874611707](https://github.com/runlinx-eng/math/actions/runs/43062521248/artifacts/13874611707)。原完整导航 45 秒超时，旧 SW active、新 SW waiting；CDP Document 请求发出，HTTP 服务端收到请求后记录 aborted/incomplete、未完成头和 body，不能推断 SW Response Promise 已结算。
- 新增临时历史 SW 的 L（同步最小内存 Response）与 M（Promise.resolve 同一 Response）对照：在真实旧控制器、缓存齐全、新 SW waiting 的前提下，均可在 5–8ms 导航并最终触发新 SW 接管；K（旧 Cache Storage 取预缓存 Response）仍稳定 9 秒超时。C（真实原始旧 SW）同样超时、J（不由旧 SW 拦截）成功。这排除了「任何 respondWith 或任意异步 Response 都会卡死」；尚不能区分旧 Cache API 访问、缓存 Response body 和新旧生命周期互锁。L/M/J/K 均修改临时旧 worker，不算真实旧版修复证据。
- 修复 `tests/p10-release-upgrade-browser.cjs` 的 `newReady()` 假阳性：必须是新版本 active/activated、waiting/installing 为空、当前 controller 与 active 分别回应新版完整缓存状态。后续修复 Playwright 隐藏 `#import-file` 不应等待可见，而应等待 attached；旧缓存重试清理只允许在旧页面关闭后触发，不以立即删除旧缓存作为成功条件。
- `0101a6a` 的 Required [43067062312](https://github.com/runlinx-eng/math/actions/runs/43067062312) failure、P8 [43067062415](https://github.com/runlinx-eng/math/actions/runs/43067062415) success；完整旧版升级首次越过原导航卡点，新 SW 实际 activated 并控制页面、清理旧缓存、B39 首次离线和推理修改及旧标签冲突保护通过，后因隐藏文件控件等待方式失败（18 项前段通过）。这只是**单次进展，不代表升级稳定**。
- `a584612` Required [43067851778](https://github.com/runlinx-eng/math/actions/runs/43067851778) failure、P8 [43067851932](https://github.com/runlinx-eng/math/actions/runs/43067851932) success。前段 28 项通过，包括浏览器 V2 导出、跨 profile 导入、重复幂等、自动构造 V1、坏 JSON/不支持版本拒绝、真实 QuotaExceededError 保留旧存储、升级失败保留旧数据；失败于重试时旧页面尚在却要求立即删除旧缓存。
- `35303ea` Required [43068578796](https://github.com/runlinx-eng/math/actions/runs/43068578796) **failure**；前段 29 项通过，包括新版重试激活和缓存完整；旧标签页关闭后的显式旧缓存清理消息超时 12 秒。不可将此解释为通过，也不得强行清空缓存。该阶段仍未形成可执行的稳定应用修复，未更改正式 `dist/sw.js`。
- 结论：C 为原始旧 SW 升级导航在隔离对照中的重复失败、升级重试的清理消息超时；B 为部分单次通过的真实升级、V1/V2 合成数据、Quota、断网与冲突保护。三次真正完整升级、安装失败后安全重试、四种数学整课离线、真实历史儿童备份迁移仍未通过。P10 不收尾、#63 不准入，不合并、不部署。
