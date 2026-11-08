# Issue #23 · P3 学习成果验证、拓展与实践应用核查

基线：PR #25 `a82fa5b41d31088bdadfa1917fe07cdcbcb06bee`。本 PR 目标为 `feat/issue-23-p2-stage-distribution`，且保持 Draft。

## 核查：真实能力和边界

| 模块 | 已有能力 | P3 做法 |
| --- | --- | --- |
| `learning/state.js` | 持久化提交、提示、重试、作品与文字；`lessonSummary()` 分离完成与独立证据 | 不改结构；只读展示 |
| `learning/tasks.js` | `inspect()` 检查实际任务模型 | 展示最近一次已保存提交的检查结果 |
| `learning/catalog.js` | `LESSONS` 与实际 `ROUTES` | 只有存在已配置后续任务才显示按钮 |
| `learning/bridges.js` | `BRIDGES` 与 `sourceBridge()` | 有真实来源边且任务存在才显示联合任务 |
| `learning/learn.js` | 任务执行、提示、操作检查、草稿、活动记录、恢复 | 加入验证/下一步/应用面板，运行器保持唯一 |
| `exploration-core.js` | `evidenceSummary()` 和旧活动证据，备份验证及合并 | 不迁移旧证据，不新增 mastery |
| `learning/daily.js` | 未完成现场、继续建议、问题、学习位置 | 保留原样 |
| `space.js` | 单一 3D 全景、选中状态与镜头持久化 | 新增从活动跳回真实关联节点的无镜头移动导航 |

### 结果语义

- **本次检查**：`inspect()` 对当前任务最近一次*已提交*的模型作判断；编辑中的未提交草稿不算本次结果。
- **历史完成**：`lessonSummary().cases[].complete`，仅陈述某个配置任务的操作检查已通过；不是掌握证明。
- **首次独立正确**：使用已有 `lessonSummary().cases[].independent` 判断；提示、先错后对、重试不能改写为独立首次。
- **解释**：文字保存为待确认，不自动作数学评分；未保存文字仍是草稿。
- **再次练习**：清空当前任务的*工作模型*，但不删除旧 attempts、notes、support 等证据。保留历史完成语义，不能将再练后的未提交操作误称为新一次通过。

### 拓展与应用

- 条件变式只在当前 `sessionTasks(id)` 有另一项已配置任务时开放；完成路线按 `sessionRoute().ids` 选择真实下一学习任务。
- 相关知识来自 `atlas.edges` 与 `atlas.nodes`，不构造虚拟关系；数学思维节点仍作为独立节点可选。
- 联合任务必须同时满足真实 `sourceBridge()`、`BRIDGES` 和任务列表。
- 应用入口在现有配置中选择测量、数据、概率、几何和建模的真实 `LESSONS/TASKS`；课堂模型/屏幕模拟不能等同于实际测量调查。
- 现实实践只给出未核验的生活建议，**不增加持久化**。后续如要记录真实实践，先在 P4 核查旧数据、备份验证、旧版导入及合并兼容。

## 文件影响与不变量

只改 `dist/learn.html`、`dist/learning/learn.js`、`dist/learning/learn.css`、`dist/space.js`、`dist/sw.js` 和 CI；新增 `learning/p3-workflow.js`、`learning/p3-view.js` 和两份 P3 测试。**不变**：537 个领域节点坐标、50 个数学思维节点、1,223 条来源关系、学段数据、已有判题定义、`math-explorer-v2` 和视角存储键。

## 自动测试和人工验收

- `tests/p3-learning-flow.test.mjs`：首次独立正确、错误重试、提示、文字草稿/待确认、条件变式、来源关系门禁、情境应用区别、重复练习保留旧证据。
- `tests/p3-learning-flow-browser.cjs`：原知识点→学习→错误/提示/重试→持久化→刷新→相关知识返回，检查相机不动及三个尺寸 `1440×900`、`980×760`、`1280×720`，截图归档在 `verification/p3-learning-flow/`。
- 既有完整 Node 与 Chromium 回归由 `required-checks` 按 PR 执行；状态、失败日志和截图以 GitHub Actions 实际结果为准。
- 尚未代替人工核查长文字、儿童理解、教学解释有效性和真实生活实践。

## P4 后续待办

1. 使用包含旧活动、现代任务、联合任务、提示重试、草稿、自由文字、问题、收藏和学习现场的实际备份，验证升级前后内容一致。
2. 核对 `math-explorer-v2` 的版本 1/2 导入、重复导入幂等性、坏 JSON、缺字段和写入失败时原记录保护。
3. 检查任务模型覆盖历史 evidence 时的语义，尤其旧正确结果、再次练习、使用提示记录和 `mergeLesson()`。
4. 核对视图键 `math-explorer-network-relationship-view-v1` 与学习备份范围不同；跨刷新/历史/离线升级时镜头、选中与任务现场兼容。
5. 评估新增现实实践记录的 schema、旧备份与多版本读取/合并策略；未经证明不写入。
6. 人工检查所有现有任务的教学判断及数学思维节点独立入口，避免误把模型操作等价于现实技能。

PR #24、#25 与 P3 均继续 Draft；不合并、不关闭 Issue #23。
