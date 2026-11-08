# Issue #23 P2｜学段分布计算依据与交互验收

**依赖：** [P1 Draft PR #24](https://github.com/runlinx-eng/math/pull/24)，基线 `96df45447358615fbcbdbb81d49044fb255cd57c`。P2 是独立 Draft PR，不直接合入 `main`。

## 数据计算口径

- 唯一运行数据源：`dist/data/grade-panorama-lite.json` 的 `nodeMappings[].curriculum.primaryStages`，分组只读取原有 `dist/data/atlas.json` 的 `themes`、`packs[].nodeIds` 和 `nodes[].domainId`。
- 一个节点属于两个小学学段，就各计一次。学段数量不是互斥划分，不得求和作为去重总数；不从年龄、3D 高度、关系边或知识群研究推断年级。
- 537 个领域节点均有节点映射记录。三个小学学段分别为 187 / 259 / 255 个节点；216 个领域节点跨越两个及以上小学学段（其中 9 个同时覆盖三个学段）。61 个领域节点没有 `primaryStages`，不等于丢失映射记录。50 个 `domainId=thinking` 思维节点独立展示，不能纳入小学学段数量。
- 主题的三个学段计数为其真实知识群节点的并集，知识群本身只按源 `nodeIds` 取成员；界面在主题、知识群层级的统计与节点详情保留一致来源。`unassigned` 与 `missing record` 独立统计。
- 23 组 × 3 学段的 69 份[知识群阶段研究判断](../grade-progression/PACK-STAGE-OVERVIEW.md)仅为群级观察依据，**不自动复制到群内 537 个节点**。历史研究文档曾记录与当前运行映射不同的覆盖数，P2 展示实际代码中的节点级结果，研究分歧留待独立教研复核。

## 用户流程

在「探索」中选择任一主题 → 阅读该主题下按节点统计的三个小学学段及跨阶段/未归属数量 → 展开本主题某学段节点清单或直接进入下属知识群 → 在知识群中选择节点 → 继续在同一 3D 全景查看概念解释、原有节点级学段角色/证据、直接关系与学习入口。点击学段数量同步左侧高亮筛选；未匹配节点及真实关系仍保留。

仅新增 `dist/grade-distribution.js` 的只读计算以及现有右侧知识卡内的分布视图，不修改原始数据、节点 ID、XYZ、边、学习证据或 storage keys。分布列表选择知识时使用原有 `choose()` + `scene.select()`，不执行新场景跳转或镜头重定位。

## 自动化范围

- `tests/grade-distribution.test.mjs`：真实来源计数、交叠、主题和 23 群聚合、50 思维节点、无小学阶段但有映射、原始数据只读。
- `tests/p2-grade-distribution-browser.cjs`：Chromium 三种视口，主题→群→点，列表点击和阶段切换相机稳定、统计与高亮一致、学习入口/搜索/关系/足迹/历史入口，长列表滚动与键盘可达性。
- 现有 14 组 Chromium 回归继续运行；`verification/p2-grade-distribution/` 是新增截图目录。

## 尚待人工验收

三视口视觉与阅读密度、儿童理解“跨阶段”含义、长中文词条的可读性、群级研究结论与节点级映射不一致时的教研解释，仍需人工验证。P3 应在 P2 探索上下文基础上组织「学习→验证→拓展→应用」，继续复用现有任务/证据，不得把已完成自动认定为掌握。
