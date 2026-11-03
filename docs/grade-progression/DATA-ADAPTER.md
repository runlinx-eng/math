# 年级观察数据适配层

状态：A2-1 数据适配层、A2-2 年级观察矩阵、A2-3 节点级展示与双向联动均接入此运行时接口。

## 数据流

`dist/data/atlas.json` 是原始知识图谱，保持只读。适配层通过唯一 `nodeId` 连接537个领域知识节点，通过 `packId` 连接23个知识群；不按名称匹配，不复制节点内容，不写入坐标或关系。

课程映射源文件：
- `docs/grade-progression/node-stage-candidates.json`：537个领域节点的节点级课程映射。
- `docs/grade-progression/pack-stage-evidence.json`：23个知识群的独立群级阶段判断与风险登记。

构建命令：`node scripts/build_grade_progression_data.mjs`

生成文件：`dist/data/grade-progression.json`

前端读取入口：`loadGradeProgressionData()`，默认读取 `./data/grade-progression.json`。A2-2 年级观察矩阵按 `packs` 原始顺序和 `themeId` 分组，直接展示群级 `stageJudgements`；六个年级入口只选择对应的两年学段，矩阵不使用 `nodeMappings` 或节点级 `roles` 推算群级标记。A2-3 展开知识群时，再通过 `nodeMappings` 与原始 atlas 的 `nodeIds` 按唯一 `nodeId` 关联具体节点；原图详情反向读取同一条映射记录。

## 运行时语义

- 小学只定义 `stage-1`（1—2年级）、`stage-2`（3—4年级）、`stage-3`（5—6年级）。
- 上游年龄候选保留在 `ageCandidate`，不用于推导中国课程学段。
- 初中衔接使用独立的 `beyondPrimary`，不作为第四个小学学段。
- 节点级 `roles`（main、extension、transition）与 `evidenceLevel`（direct、conceptual、adjacent、not-covered）是两个独立字段。
- 群级 `stageJudgements` 独立于节点级映射；`main`、`extension`、`not-primary`（显示为「—」）和 `process` 原样保留。群级「—」不删除该群中仍有节点级阶段映射的节点。
- 50个数学思维节点只保留独立 ID 和所属群，不进入537个领域节点映射。
- 研究缺口、Not-covered、Adjacent/Main 风险及未决节点均原样保留。


## A2-3 节点级展示与双向联动

- 每个知识群展开后，领域知识点列表通过 space.packs.get(packId).nodeIds 与 nodeMappingsById 的唯一 nodeId 交集构建；不按名称匹配，不复制知识点，不生成第二套节点。
- 537个领域知识节点在所属知识群中各出现一次。跨阶段节点仍只出现一次，三个小学学段的节点角色全部展示；当前选中年级只影响排序优先级，不过滤其他学段信息。某学段没有映射时显示「未映射」，不使用群级标记代替节点角色。
- 节点级 main、extension、transition 与 Direct、Conceptual、Adjacent、Not-covered 分别展示。证据等级不能由角色推断，角色也不能由群级标记推断。
- beyondPrimary 独立显示为「初中后续」，不并入小学五、六年级。小学三个学段均无映射的节点显示「未纳入当前课程阶段映射」；Not-covered 保留其证据类别。
- 50个数学思维节点在独立的「数学思维」列表中呈现，不进入537个领域节点列表，也不分配小学学段；它们仍使用原始 nodeId 和原知识树关系。
- mt_b4lbTOJYwI 保留「数集与无穷」未决状态、beyond-primary:main 和 Adjacent 证据。17个 Adjacent/Main 风险节点仍分别显示角色与证据。85个研究缺口保留在数据和治理记录中，不作为普通用户的课程结论展示。
- 「时间怎样走」第三学段的群级 incomplete 仍显示「待补充」；其4个节点级延伸角色继续按节点映射显示。群级缺失不覆盖节点级数据，也不把 incomplete 解释成「—」。
- 年级列表点击领域知识点时，调用原图既有节点选择和详情入口，使用原地选择，不调用自动聚焦；节点坐标、关系、相机位置和缩放保持不变。原图详情中的「小学阶段位置」读取同一 nodeId 映射。
- 从原图详情进入年级观察时，只展开所属知识群并在左侧观察面板内滚动到该节点；保持原图 nodeId 选择、镜头和缩放。数学思维节点及未纳入小学阶段映射的节点只提供「查看所属知识群」，不制造小学年级归属。
- observationMode、selectedGrade、expandedGradePackId 与原地图视图一起保存并校验；模式切换不清除当前选中 nodeId。退出年级观察后原关系全景及原详情能力保持可用。

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
