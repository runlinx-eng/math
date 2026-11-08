# Issue #23｜P0 基线与首批 P1 实施记录

状态：**P0 代码/契约核查完成，数据全集自动重算与新界面浏览器实测须以本 PR CI 确认。** 本文件不是数学教研或用户验收结论。

## 1. 固定工作基线

- base：`main@659ea884bda8ebb30aed0bdebc8dd374a61637e7`（2026-11-05），开始执行时重新读取 GitHub `main` 与 Issue #23。
- 代码边界：只编辑入口 HTML、主界面逻辑与样式、Service Worker 缓存版本、UI 文档及测试；不改变 `data/atlas.json`、空间位置、关系、学习任务或存储模型。
- 既有运行数据契约（Issue #23、主线学习设计与实现交叉核对）：5 主题、23 群、537 个有固定坐标的领域节点，加 50 个无常驻球的数学思维节点；851 hard + 372 soft = 1,223 条源关系。三学段节点级分布为 187/259/255，存在跨学段重叠。
- 这些计数是既有基线与不变量。每次涉及源数据的更改应通过运行时代码、`grade-node-filter.test.mjs` 及空间/关系测试重新核实；不能仅因计数符合就认为数学理由已核对。
- 主要存储：`math-explorer-v2` 保留学习 `lessons / activities / journeys / daily / bookmarks / legacy` 的既有语义；`math-explorer-network-relationship-view-v1` 独立保存相机、选中、学段和工作面。JSON 学习备份不等同于视图存储备份。
- 读入失败边界：`readLearning` 设置 `readBlocked` 并停止覆盖；不借助导航写新证据或静默改写旧数据。

## 2. 用户任务 → 入口 → 模块 → 检查

| 用户任务 | 当前已有入口与模块 | 这轮整合目标 | 测试/风险 |
| --- | --- | --- | --- |
| 知识探索 | `index.html`、`space.js`、`spatial-scene.js` | 探索主导航；保留全部搜索、主题与群选择 | 单图、相机不跳；`spatial-unified-map-browser.cjs` |
| 学段观察 | `grade-node-filter.js`、`grade-panorama-lite.json` | 在探索工具区继续使用四档高亮 | `grade-node-filter.test.mjs`；不重新定位 |
| 概念理解 | `concept-explanations.js`、`renderFocus` | 选中节点的「理解」快捷分组 | 概念不删、长卡可滚动 |
| 关系追踪 | `spatial-relationship.js`、`spatial-reasons.js`、`networkRelations` | 「联系」分组，仍默认展开直接列表 | 理由、原文、数学思维可达；`spatial-focus-filter-browser.cjs` |
| 学习活动 | `learning/catalog.js`、`learning/bridges.js`、`learn.html` | 「学习」任务入口，复用旧活动运行器 | 实际进入/返回、相机、导览；`learning-workspace-browser.cjs` |
| 成果验证 | `learning/state.js` 的 `lessonSummary` / `inspect` | 本轮只显示现有操作进度与独立操作证据，结果整合属 P3 | 不能写成「已掌握」，不改 `submitLesson` |
| 学习拓展 | 现有路线、联合任务、真实源边 | 学习入口指向已配置路线；换条件结果属 P3 | 不编造任务或关系 |
| 实践应用 | 现有数据、测量、建模等模拟任务 | 继续使用既有活动，正式应用组织属 P3 | 模拟任务≠现实实践 |
| 学习接续 | `learning/daily.js` 的 `continuation`、`v2.html#trail` | 「学习」继续与「足迹」持久入口 | 未完、问题、作品、收藏、备份；`exploration.test.mjs` |

## 3. 页面与状态边界

```text
                  单一 3D 关系全景（不卸载）
                      |
         探索 / 学习入口 / 足迹 iframe
          |          |          |
   选中主题、群、点   继续/路线/当前任务   v2.html#trail
          |          |          |
   理解 / 联系 / 学习    learn.html / 早期工作面
          |          |          |
          +----------返回到同一地图----------+
```

- `#space`、`#space/theme/:id`、`#space/pack/:id`、`#space/node/:id` 是既有关系图 URL；`#trail` / `#about` 兼容旧入口，`#atlas` 规范进入同一张图。P1 的「学习」入口属于暂时覆盖面板，**不新增 hash 路由或存储字段**。
- 视角状态由 `SpatialScene` / `captureView` / `saveView` 维护；标签导航只开关面板、不调用 `scene.fly`、`scene.fitGlobalView`、`scene.select`。
- 学习状态由 `exploration-core.js`、`learning/state.js`、`daily.js` 独立维护。实际提交、首次独立正确、重试、提示、自由解释及旧活动证据互不替代。
- 五步导览、局部追踪和学习面板之间既有的挂起/返回流程仍由原 `guideVisible / guideSuspended / journeyOpen` 管理；首批不引入第二套全局状态管理器。
- 辅助工具：搜索快捷键与按钮保留；归位/缩放/旋转/视角、学段、背景连线与说明保持在原位置。工具栏再分组属于后续 P1。

## 4. P1 首批改动与验收基线

变更：`dist/index.html` 增加任务导航及学习入口容器；`dist/space.js` 以复用函数接通“当前活动 / 下一处 / 已配置路线”，知识详情增加三个内容分组；`dist/space.css` 添加低影响布局与紧凑桌面响应式规则。保留 `v2.html`、`learn.html`、`journey.html` 的既有实现。同步 README、当前交互规范、SW 缓存版本（仅静态资源），不改存储键。

**浏览器实测固定场景：** 1440×900、980×760、1280×720；探索→学习→足迹→探索；搜索；节点选择→理解/联系/学习；进入现有学习 iframe→退出；比较切换前后 camera position/target/zoom；确认 537 球、默认直接联系、浏览器 JS 错误和截图。执行文件：`tests/p1-navigation-browser.cjs`；工作流 `required-checks` 包含它并上传截图到 `verification/p1-navigation/`。

**需要下一轮补充：** 保存/刷新与导览中跨入口接续、旧备份与坏文件的人工/自动化完整组合回归、离线 Service Worker 更新、窄屏遮挡与 Tab/Esc 的实测。CI 与截图只能证明工程操作，不自动证明儿童理解或用户对布局满意。

## 5. 下一阶段优先级

1. **P1-B / 最高**：观察工具按视角/学段/背景关系归组，详情的分组在短视口下布局校正；统一旧早期活动打开/关闭和非当前节点工作面返回语义。
2. **P2 / 高**：按主题 × 23 知识群汇总真实节点级学段数量，明确与群级 69 份判断不同；从列表在原地图选点，不挪镜头。
3. **P3 / 高**：学习提交→结果→再试/换条件→真实联合任务/应用的任务闭环及证据表达；不做文字自动核定。
4. **P4 / 最高（贯穿）**：旧记录、草稿、问题、备份导入/合并/损坏保护与相机存储分离专项回归。
5. **P5 / 最后**：三尺寸完整 Chromium 回归、用户实际交互验收和独立教研标记检查；用户确认后才合并本轮 PR。
