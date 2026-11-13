# 587 个知识节点学习任务与入口审计方法

关联 [Issue #82](https://github.com/runlinx-eng/math/issues/82)；不改变现有产品、学习数据或判题语义。

## 复现

在仓库根目录执行：

```sh
node scripts/audit-learning-nodes.mjs
node --test tests/learning-node-audit.test.mjs
```

产生 `verification/learning-node-audit/nodes.json`（逐节点清单）、`summary.json`（互斥统计）、`issues.json`（具体节点与修复方向）及 `README.md`（当次结果）。GitHub Required workflow 会运行脚本，检查输出，并将结果保留为 `math-required-checks-browser-evidence` Artifact。此审计只读取仓库内容，不读取或改写浏览器学习记录；报告由当前 HEAD 的运行生成。

## 统计口径

- 唯一主键为 `dist/data/math.json` 的真实源节点 ID。强制检查 587 个、其中 50 个 `thinking`、1,223 条关系；不手填节点。
- `atlas` 节点和 `packs` 与空间坐标索引分别检查。537 个领域节点有独立 3D 坐标，50 个思维节点没有独立坐标属于当前设计；后者通过搜索和知识关系访问，不能直接视为缺课。
- 原生任务 `LESSONS/TASKS`、早期 `ACTIVITIES`、老路线 `journey`、联合 `BRIDGES`、推荐 `ROUTES` 分别列出，不把同一个原生课程映射当成多个独立课程。B39 必须先完成惰性任务注册再校验。
- 入口由 `decideLearningEntry` 静态判定；标记为 `static_entry_mapped` **不代表完成真实鼠标/键盘/3D 点击**。所有未逐节点 Chromium 验证记录均保留 `pending_browser_verification`，不误报为已可达或坏入口。
- `lessonSummary` 对配置的任务按检查通过判定；未通过不能直接进入下一题，可选发现/反思文字不应阻塞学习。是否存在不同于原生顺序任务的可选评分题，需由实际继续条件和活动规则确认，不能根据题名/序号推断。
- 已保存的一次有效检查尝试，包括错误尝试，才是“学习中”的起点；打开课程、浏览地图或只有草稿不等于开始。只读审计**不接触用户本地记录**，不能宣称已对各节点实际学习进度做了四态判定。
- `issues.json` 中“待核查”是独立的证据不足类别，不等价于已确认 P1/P2。真实数据丢失风险优先 P0；真实核心入口和进度错误为 P1；非核心为 P2。未做真实浏览器测试，不确认具体入口故障。

## 浏览器和数据安全验收界限

本轮通过 Required CI 运行现有真实 3D/P8 点击、早期活动和 P7/P10 学习继续、旧版本升级及备份兼容回归；这些代表性回归的通过**不等于** 587 个节点全部点击过。实际运行结果必须以当前 PR 最新 HEAD 的 GitHub Actions 记录为准。各项浏览器截图和运行时报告作为另一级证据，静态脚本不伪造截图或自动填入 `browserVerified`。

## 最小修复规划

先复验证据可靠的 P0/P1，定位到具体节点、任务 ID 和入口；然后处理已证实的 P2 旧活动/非核心入口；其余全部列入待核查。任何数学内容、核心/可选门槛、源关系、节点坐标或存储格式变更均另立任务，不属于此 PR。

## 第二轮：任务门槛与真实页面验证

在原只读统计基础上，运行：

```sh
node scripts/audit-learning-task-rules.mjs
node --test tests/learning-task-rules.test.mjs
# 需启动本地 dist 静态服务并安装 Playwright Chromium：
node tests/learning-node-runtime-browser.cjs
```

任务规则脚本重新生成源节点清单，不读取或迁移学习记录，输出 `task-classification.json`（逐节点、逐题索引与来源）、`bridge-task-classification.json`（独立联合任务）、`four-level-feasibility.json`、`task-rules-summary.json`、`task-rules-issues.json` 和 `TASK-RULES.md`。Chromium 真实点击记录和截图独立存放在 `verification/learning-node-audit/browser/`，并由 Required CI Artifact 保留；静态任务脚本不会虚构点击记录。

**规则调查：** 原生课程的每个顺序题均是当前的下一题关卡，共 1,996 项，没有独立登记的评分可选题。历史 `PRACTICE` 属于旧自由试玩模型，不是一个新的可选评分任务；776 组联合任务单独记录，不进入单个节点的原生核心完成条件。早期三个活动按 construct 和 transfer 两类各至少一次有效提交计算历史完成，即使提交不正确；这与现代课程的「核心题检查通过」不是同一含义，不能混淆。保存个人发现、反思文字不影响原生课程完成。

**四级进度界限：** 已保存的有效答题尝试可以区分「未学」与「学习中」，答错也算开始；单纯打开、浏览和未提交草稿不算。原生课程的核心任务通过信息可用于第三级，但应分开判断历史成功与修改过的当前作品。当前没有独立评分可选题，第三级和第四级暂时无法作有意义的区分。旧活动兼容性和独立联合任务不能靠更改现存记录结构来强行消除。

**浏览器计数：** 运行时映射数、可见搜索/3D 点击数、打开实际课程数、完成提交恢复数分别报告，不把前者冒充后者。测试含 share、graph39、pattern39、早期 fair 入口条件和 link-equivalent-quarters 来源关系；条件未满足时记录真实证据并列为待核查，不虚报可达。自动检查不代替孩子试用、数学教研或 587 次逐节点操作。
