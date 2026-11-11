# P7-D6｜统一学习 UI：固定结构与真实任务状态合同

> Issue #34，关联 Issue #30。基线 `main@b9265dfe07a84e06d06be66981aff81a9126e802`；独立 Draft PR #57。本文是工程实现和待验收记录，**不是** Mac、儿童或教研验收结论。

## 一、现有 P7 没有彻底统一的具体原因

1. `learn.html` 已定义四个 `.learning-region`，`#actions` 也是共用容器，但 `learn.js:renderTaskActions` 过去只依赖 `learningStage` 和 P03 的少数就绪条件。绝大多数活动在 `explore` 时直接突出可点击「检查我的作品」。
2. `phase5/b08-view.js` 的 `x-wideshift` 先输出「留下猜想，动手检查」，随后才解锁数位移动。其专属按钮不受上述主行动合同管理，出现**猜想按钮 + 共用检查按钮**同时竞争；`x-pvshift`、`x-parityjoin` 有类似先行操作。
3. `p3-view.js` 的 `renderP3Flow` 在尚未提交时仍生成空检查提示和完整可选内容结构；虽然内部 `details` 多数收起，但页面首次可见辅助标题、路线以及继续区，挤压真实数学操作。
4. `syncSubmissionUI` 原先先刷新区域后替换修改未复检反馈，可能使本次区域显示判断依赖上一次 `#check-feedback.hidden`；现已调整为**先失效旧反馈，再同步区域**。
5. P8 已使 `.execution-command` 紧凑停靠，D6 不退回覆盖数学教具的宽屏底栏，也不改变外层 3D。

## 二、固定空间，不强制数学步骤

固定四区：`#learning-problem` 当前问题 → `#learning-interaction/#work` 当前数学操作 → `#learning-check` 真实检查与反馈 → `#learning-next` 发现及可选后续。唯一全局 `#actions` 位于教具之后、检查反馈之前；其 DOM 不复制。

实际显示矩阵：

| 当前真实状态 | 主要可执行动作 | 检查反馈 | 辅助内容 |
| --- | --- | --- | --- |
| explore + 有必要的猜想未确认 | 原教具的猜想按钮（突出） | 共用检查禁用，历史不伪造 | 收进按需区域 |
| explore + 已猜想但尚未进行规定操作 | 原教具的数学操作；共用检查禁用 | 无伪检查 | 收进按需区域 |
| explore + 可检查 | 共用「检查作品」 | 尚无判定 | 收进按需区域 |
| revise | 修改作品后重新检查 | 呈现本次提交的真实反馈 | 历史可展开 |
| recheck | 共用「重新检查」 | 旧结果不再代表当前作品 | 保留旧尝试 |
| passed | 下一题或整理发现 | 真实检查结果与依据 | 按需查看 |
| reflect | 有待保存文字优先保存，否则真实继续/返回 | 不再显示孤立检查标题 | 记录、关系、拓展可展开 |

**重要边界：** `studyActionFocus` 只对有确凿模型字段和原教具动作的 `x-wideshift`、`x-pvshift`、`x-parityjoin` 加入预测/操作就绪判定。其他类型使用旧合同安全回退；不会用类型名称推断数学答案，也不会把任意数位移动硬编码为一次检查。

`#learning-support` 只折叠原有的 `#p3-learning-flow` 与 `#route-collapsible`，并不删除路线、联合任务、模拟应用或历史。用户主动展开仍可使用原 `data-do` 操作。对默认收起的可发现性，仍须 Mac/儿童验收。

## 三、测试与证据

- 新 Node：`tests/p7-d6-learning-contract.test.mjs`；检查纯合同、真实 `b08-model` 状态、四区 DOM 与原运行器调用。
- 新 Chromium：`tests/p7-d6-fixed-ui-browser.cjs`。**3.456×100** 的真实 `shiftfine`：初次 → 留猜想 → 两次移动数位 → 故意写错 → 检查失败 → 修改 → 刷新恢复未复检 → 重检通过 → 继续到真实下一题；`equivalent` 纸带任务：初次 → 错误检查 → 修改纸带 → 重检通过。1440×900 和 1280×720 均截图。
- 既有 `tests/p7-learning-panel-browser.cjs` 对等值分数全组含总结、可选保存、历史、关系和恢复的长链持续回归，不能由 D6 单例替代。
- `.github/workflows/pull-request-baseline.yml` 将新测试纳入 required，并上传 `verification/p7-d6/`。
- D6 不触碰 `state.js`、`tasks.js`、`bridges.js`、3D 空间文件；保留既有源 ID、存储、活动运行器和原规则。

### CI 先验风险

2026-11-10 最新 `main@b9265df` 的集成 required run #42790712657 已在 **P8 非关联知识节点对比度**的 Chromium 断言失败：ratio `0.9687`。与 D6 数位操作无关；D6 的 CI 必须区分这个原有红项与新失败。绝不能把整个 required 红灯说成 D6 已通过。

## 四、D7–D9 待办

- **D7**：以 `P7-D3-CAPABILITY-AUDIT.md`、清单生成器为依据扩展到其余预测、推理、反例、实验和联合任务模型；继续保留 603 条待归类能力原入口。统计 1,996 节点任务、1,552 联合子任务映射，不冒充逐题操作。
- **D8**：长数学教具的真正窄屏可达性、双滚动、动态区域显示层次、历史与探索折叠的可发现性、读取顺序；避免 P8 外层工作区回归。
- **D9**：五类真实完整浏览器链、窄屏和离线/备份旧记录、Mac 100% 缩放人工试用、儿童独立操作与教学教研分层验收。

**状态**：Draft #57；未经授权不合并、不部署 VPS、不关闭 Issue #34。
