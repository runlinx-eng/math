# Q02 / Q03 源码可观察性预审：避免无证据升级（2026-11-20）

冻结核对基线：`main@2ef5c4c0445f510136685b66a1543f826dd1f81e`。本次是**真实源模块、控件和现有回放代码的静态预审**，不是浏览器或独立新数学 replay 已验。对应逐题机器结果：[source-feasibility.json](source-feasibility.json)。旧 [NEXT-FAMILIES.md](NEXT-FAMILIES.md) 是早期假设；本报告中有源码依据的限制优先。

## 核对结果：严格 A 准入不等于可算对

| 原生位置 | 原值 / 结果 | 实际可见并记录的过程 | 后续建议 |
| --- | --- | --- | --- |
| `tensmove:0` | 45+30=75 | 选列对齐、猜想、按开始后**工具自动合并** | 不直接升 A；不能声称学生亲自搬3捆 |
| `tensmove:1` | 82−40=42 | 对齐后真实 `b11-remove` 取走4个十 | **优先审仅真实减法合同**；不要求额外换位 |
| `tensmove:2` | 45+3=48 | 对齐后工具自动合并3个一 | 不直接升 A；不能当成30 |
| `hundredsmove:0` | 345+200=545 | 对齐后工具自动合并2个百 | 不直接升 A；不能证明亲手搬板 |
| `hundredsmove:1` | 762−400=362 | 对齐后真实 `b11-remove` 取走4个百 | **优先审仅真实减法合同**；不要求额外换位 |
| `hundredsmove:2` | 345+20=365 | 对齐后工具自动合并2个十 | 不直接升 A；源目标的“20与200比较”未单独留操作 |
| `triArea:0` | 平行四边形8×5=40 | 点击预设“移动/复制”，记录一块面积 | 缺真实自选切口/平移，暂缓严格构造 |
| `triArea:1` | 直角三角形6×4÷2=12 | 点击预置复制图、记录面积 | 缺用户控制复制、旋转、合并，暂缓 |
| `triArea:2` | 钝角三角形12×7÷2=42 | 看预置外高及复制图、选答案、记录面积 | 外高不是孩子亲自构造，暂缓 |
| `triArea:3` | 平行四边形10×5=50 | 记录单块面积，另有**叶片估算**选择 | 原题并未要求选择“垂直高5还是斜边6”；禁止冒称做了这一判断 |

### Q02：不是一份现有 replay 加六个绑定

- `dist/learning/phase5/b11-model.js`：加法仅在 `b11-place-start` 自动对齐合并单位；模型没有 `add` / `move` 的逐颗事件。减法的 `b11-remove` 才有实际请求、原始列 index、`before` 和 `needed`；原操作同时记录 guess 与 align。
- `dist/learning/place-evidence.js`：已有 `replayPlaceEvidence` 显式要求 `exchanges.length > 0`，适用于需要进退位的已审题，不适合“无需换位的四个十/百被拿走”。
- 两道减法可以**条件性设计**来源限定、零换位也成立的实际移除回放，严格核对按列移除、数值守恒、错误首次请求、原答案与最新提交一致，并拒绝伪造和异源绑定；当前还没有冻结原题 taskHash、没有新 Node/Chromium 验收，**不能预先判定已达 A**。
- 其余4道加法若要获严格构造证据，必须有真正由学生执行并留在 history 的单位操作，不能因界面动画或工具一次合并而写“学生亲手移动”。**禁止刻意加入无必要的换位/撤换事件凑门槛**。只允许对确实可见的对齐、猜想、填写做窄描述，是否够 A 需单独审核。

### Q03：真实裁切没有进入原操作历史

- `dist/learning/phase5/b30.js` 为4题给出了固定 `pieces`、`before/after`；`dist/learning/phase5/b30-model.js` 中 `a30-transform` 只是切换 `board.transformed`；`a30-part` 保存当前单块面积，未记录学生实际裁切线、平移向量或复制角度。
- `dist/learning/phase5/b30-view.js` 的“移动或复制这一块”是把工具预置图形切换展示，不是可操控绘图。已有 `dist/learning/area-evidence.js` 的 `pieces` 数学回放也明确把每片预制几何标为 `partitionByTool:true`，没有授予 `triArea:0..3` 来源。
- `triArea:3` 采用 `Math.sqrt(11)` 的非整数图形坐标，现有 BigInt 整数顶点面积核验不能直接复用。更关键：实际选择题是“叶片形状怎样量面积”，不是“底10的垂直高是5还是斜边6”；严格反馈不能发明学生做了这一选择。
- **决策：Q03 严格剪拼/自构高合同暂缓。** 若未来需求允许新增真实可观察的裁切/复制/旋转/高选择操作，必须另立 UI 与数学语义设计、独立来源和新验收；若不改原操作，则保留原有判题与非 A 等级，避免低价值反复提交。

## 提交前的确定性校验：已经存在，无需重造

刚核对 `scripts/ci-release-sync.mjs`、`tests/ci-release-sync.test.mjs` 与主线 `docs/DEVELOPMENT-WORKFLOW.md` 的 #268 规则。它们已经在当前 main 提供：五处离线 release 一致性、学习入口的 SHA256、全部审阅导航 fixtures 旧 SHA256 及“只改 release 时安全批量同步、源码有其它改动就拒绝”。最近 #299 的8项旧导航 SHA 失败**属于此工具能在推送前检测的确定性缺口**，不是需要再次发明 CI 系统。

在发布源改动集中完成、提交或推送之前，运行：

```sh
node scripts/ci-release-sync.mjs check
node --test tests/ci-release-sync.test.mjs
```

若只是明确的 release 版本更新，按现行 #268 规则先 `node scripts/ci-release-sync.mjs sync --release math-explorer-<明确版本>`，**逐项审查 diff**，然后再运行 `check` 和对应单测。**非 release 的 learn.js 源码变化必须人工复核新的冻结哈希；工具会拒绝静默同步**。此预审没有新增脚本或弱化保护。

严格 A 家族实现另用现有数学审计：`node --test tests/p9-evidence-contract.test.mjs tests/evidence-expansion-audit.test.mjs`，`node scripts/audit-evidence-expansion.mjs`；后续 CI 依改动归属按现行范围运行，不以预提交检查取代 Required、Chromium、P10、State-v2 或新 main 验收。最新 main 的 [Required #44706032779](https://github.com/runlinx-eng/math/actions/runs/44706032779) 与 [Fallback #44706032825](https://github.com/runlinx-eng/math/actions/runs/44706032825) 已成功，这是仓库真实 CI 事实；本次**未在容器本地运行 Node 或真浏览器**。

## 维护方式

机器可读结果只冻结10道来源位置、不写未审核题的 hash、不改原生 A 审核清单。后续 Q02 先尝试真实移除的两题，研究通过后才考虑另四题；Q03 不进入“下一批必升四题”的循环。Q01/#301 的独立代码分支不动。其它未审 1,227 道原生题不重新全扫。
