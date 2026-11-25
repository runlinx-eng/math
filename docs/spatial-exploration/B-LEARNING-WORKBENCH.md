# B 线学习工作台（2026-11-25）
独立基线 main `e3ba7d6fbe7db2a3df7dea39a650bf6a4f0962da`。A 线 #382 保持独立；用户已明确开始 B，A 的 Mac 人工体验仍单列未验。依据 A 线固定完成标准（b10e7b5）与真实源审计 5 节，不叠加 #379/#380 或 A 线布局代码，不改变 v53 默认。

## B1 第一批
- 实际学习工作面与地图的双前景切换：默认学习，地图真实点击/键盘/拖动获得前景；原 iframe 中真实用户焦点恢复学习。独立明确按钮在紧凑窗口可达。仅前景切换为视觉状态，不改变学习/探索模式、实际当前题、模型、草稿、历史、相机或存储；实际地图节点选择保留原访问记录。
- 顶栏显示四拍节奏；依据原 learningStage，不增加读题/猜想/发现 gate。原四区、唯一动作和已有数学教具、判断、历史全部保留。
- 新专项目标：真实等值分数错误检查→修正未检→点另一真实地图节点→恢复当前 iframe→键盘切换→实际重检正确；比对同一 document token、真实学习记录、选中节点、四拍与截图。固定 1920×1080，遵守 #239；Mac 人工体验另验。
- 本地无完整 checkout，正式 CI 与原始截图待验。此次改动 learn.js 仅新增展示态 beat 与同源当前 session 用户焦点消息；原 update/submitLesson/inspect/edit/model/lesson 导航与原生动作不改。按 release 工具要求人工审阅非 release 差异后同步入口 hash 和既有 8 个来源 fixture，不改变原 fixture 判题/历史数据。

## 尚未完成
1. B1 三层固定壳：标题/学段/题序/留到下次/退出，独立滚动的数学主舞台与不遮挡工具的固定唯一当前操作栏；原 history、可选提示、前置关系收进可达抽屉。
2. B2 原全部 gate、反例、纠正、下一题与可选发现回归。
3. B3 留到下次、关闭再进、刷新恢复、B→A 真实操作及更新足迹；窄窗实机与键盘可达性。
4. B4 最新适用 CI、原件核验、与 A 集成后的联合验收。无部署或默认布局变更。

## 入口完整性审阅
旧学习入口 SHA-256 `0fd8a863d19253084b445e1726a12703eeeec0fe6bd129ffb363c2dea5b7b9cb` 已逐字节匹配 main；本批实际 UI 展示和用户焦点消息改动后新入口 `d23abeac05734e01beac65c5c2441ef339f638b11383266be8444720c1bc4546`。同步五处 release 与原八个导航 fixture 的 learn.js 指纹。未改其数学动作、判定、数学来源或历史断言；须由原门禁及本专项重新验收。

## preview2：第一批失败归因与修复
preview1 正式 CI：5 个 workflow 通过；B 专项与 Required 未通过。Required 的 14 个 Node 失败均为共享 workspace-flow.js 的冻结来源指纹不一致；将四拍纯展示代码独立为 workbench-presentation.js，恢复主线共享文件完整原字节（SHA-256 `3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05`），保留原数学门禁与来源锁，独立测试展示映射并把新增模块登记离线清单。实际点击知识节点会按原 choose 逻辑追加 visited/openedPacks，专项改为对比整个 State-v2 仅允许所选真实节点/群的原有访问记录增加；不允许修改其他状态，返回学习与键盘切换仍要求全部原始记录逐字节不变，保留同 document token、原 grader、修正尝试等断言。
旧版 SW 导航隔离 C-verified-new-controller 中新缓存已完整 639/639，但历史 controller 仍 active，新 worker 等待超时。未改 SW 生命周期或隔离门禁，须以 preview2 完整新 CI 重验，不宣称修复。五处 release 同步为 preview2，学习入口新 SHA-256 `5b59a5b01c994dc6aae76d6f7db0cf3f363cce7359198fe10160aba295da3376`，八处既有导航 fixture 更新相同入口指纹。未改题库、原动作、判定、数学来源和学习记录结构。B1 固定三层壳、抽屉暂未叠加，先验收第一批。无本地完整 checkout，未执行本地 push-preflight/Chromium。
