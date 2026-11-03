# 年级观察数据适配层

状态：A2-1 数据适配层；A2-2 年级观察矩阵已接入此运行时接口。

## 数据流

`dist/data/atlas.json` 是原始知识图谱，保持只读。适配层通过唯一 `nodeId` 连接537个领域知识节点，通过 `packId` 连接23个知识群；不按名称匹配，不复制节点内容，不写入坐标或关系。

课程映射源文件：
- `docs/grade-progression/node-stage-candidates.json`：537个领域节点的节点级课程映射。
- `docs/grade-progression/pack-stage-evidence.json`：23个知识群的独立群级阶段判断与风险登记。

构建命令：`node scripts/build_grade_progression_data.mjs`

生成文件：`dist/data/grade-progression.json`

前端读取入口：`loadGradeProgressionData()`，默认读取 `./data/grade-progression.json`。A2-2 年级观察面板通过该入口读取数据，按 `packs` 原始顺序和 `themeId` 分组，并直接展示每个知识群的 `stageJudgements`。六个年级入口只选择对应的两年学段；矩阵不使用 `nodeMappings` 或节点级 `roles` 推算群级标记。

## 运行时语义

- 小学只定义 `stage-1`（1—2年级）、`stage-2`（3—4年级）、`stage-3`（5—6年级）。
- 上游年龄候选保留在 `ageCandidate`，不用于推导中国课程学段。
- 初中衔接使用独立的 `beyondPrimary`，不作为第四个小学学段。
- 节点级 `roles`（main、extension、transition）与 `evidenceLevel`（direct、conceptual、adjacent、not-covered）是两个独立字段。
- 群级 `stageJudgements` 独立于节点级映射；`main`、`extension`、`not-primary`（显示为「—」）和 `process` 原样保留。群级「—」不删除该群中仍有节点级阶段映射的节点。
- 50个数学思维节点只保留独立 ID 和所属群，不进入537个领域节点映射。
- 研究缺口、Not-covered、Adjacent/Main 风险及未决节点均原样保留。

## 不完整记录处理

群级每个阶段位置都生成一条记录。只有 `mark`、`markLabel`、`reviewStatus` 三项齐全时，`recordStatus` 才是 `complete`；否则为 `incomplete`。缺失值保持 `null`，不推断默认标签。

已核实的唯一不完整位置是「时间怎样走」的第三学段：JSON 保留4个延伸节点及其证据，但缺少 `mark`、`markLabel`、`reviewStatus`；`PACK-STAGE-OVERVIEW.md` 当前表格却显示「—」。适配层将其标为 `incomplete`，不把文档中的「—」写回 JSON。A2-2 矩阵与展开详情均显示「待补充」，并列出缺失字段；不会显示为「—」或补造审查结论。第二学段仍保留 `main`、`needs-independent-pedagogical-review` 和2项未决问题。

`mt_b4lbTOJYwI`「数集与无穷」仍保留为 `beyond-primary:main`、`adjacent` 证据的未决节点，不重新归属。

## 一致性与测试

适配构建时校验：
- 节点 ID 唯一且与原图谱领域节点精确对应；
- packId、群成员和逐群节点统计一致；
- 思维节点 ID 集合与各群登记一致；
- 研究缺口与原图谱 `hasResearch=false` 精确对应；
- 5个 Not-covered 与节点映射一致；
- 17个 Adjacent/Main 风险与节点映射一致；
- 群级证据中的节点引用均属于对应知识群。

专项测试：`node --test tests/grade-progression-model.test.mjs tests/grade-progression-overview.test.mjs`；浏览器验收：`tests/grade-progression-overview-browser.cjs`。

自动一致性检查不代表独立数学教研或儿童理解验收。
