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
