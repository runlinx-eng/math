# A 线开发期测试入口 v2（仅 infra 分支）

这是与正式 Required/集中整合完全分离的开发期工具。**Artifact 保留 7 天不变。** 官方 main、Shared evidence/feedback/manifest、B 线本地 Codex、正式 CI、P060 整合时点均不变。

## 每个新子家族的操作

1. 从冻结/核对过的 main 新建独占 work/a/* 分支。先确认当前原生 \`sessionId:index\` 在运行时 \`sessionTaskFor\` 能取到；不要把 b39.js 等静态声明冒充已接入的课。精确核 \`LESSONS\` source node、完整 task SHA256、真实判题和原控件事件。
2. 只新增本族独立数学回放、Node test、Chromium fixture，不改 shared 文件。分组必须具有相同数学不变量和相容的原控件状态回放；一组中每个原生位置仍要独立锁 source/hash、执行错误→纠正 Check、状态及备份验证。P005a 选锐角与 P005b 排序不能合并成一个数学合同；P005 的其他 \`x-g25-vertices\` 可在单独预审后考虑分组。
3. 修改 \`ci/a-candidate-dev/active-targets.json\`：只列**这次**要跑的 case（至多 12 组）。每组必须填写精确不可变提交 \`sha\`、Node/Browser 入口，\`native[]\` 每一位置的精确课、索引、源节点、完整 \`taskSha256\`、原 task type、适用视图 \`b23/b25/null\`、实际控件动作 \`controls\`。无可观察 UI 时 controls 为空且 view 可为 null，不能据此声称浏览器验证。
4. 只推送 infra 分支一次，CI 根据 JSON 自动生成矩阵，无需每次改 Workflow YAML；目标先做输入和路径自测，再 sparse checkout candidate HEAD，先 Node 预检原生运行时、完整 hash **值相等**、原视图动作，才执行独立 Node 数学与真实 Chromium。每组保留原始失败、状态机和 raw Artifact；失败不得改为 PASS，修复只更新对应 candidate SHA 与 JSON，再跑新 HEAD。
5. 每个 Job 的 \`dev-results/development-receipt.json\` 为机器原件，\`dev-results/native-preflight.json\` 保留完整 source/hash 观测。历史进度见 \`ci/a-candidate-dev/progress-ledger.json\`，只有核验日志/Artifact 后才更新；不按 CI run 绿色自动增加正式 A。上传 ZIP 的独立审计仍未完成时写 \`NOT_RUN\`。

## 测试夹具固定防错约定

- 浏览器交互必须使用当前原始 View/DOM 的真实控件。B23 有的 pick 卡在 \`#extra-visual\` 而不是 \`#extra-controls\`；先检真实源码和 DOM；不复制别的题的 CSS 选择器、导出函数名、lesson 索引和错误选项。原答案若是下拉菜单，只选择实际 option。
- 同课程不同位置连续测试时必须重新发生真正的 document navigation，不能将 same-document hash navigation 当成新的 SW 响应。
- 停止 HTTP origin 以后，原 SW **不会缓存**未正式接入的候选 evidence 模块：浏览器负责捕获原生 task/model/Check/State-v2，Node 侧运行候选独立数学回放；不要在离线页强制动态 import 新候选模块。
- 必验原题 wrong→correct Check、原生事件、negative、最新提交、State-v2 持久化与需要的离线/备份。工具可复用，数学证明不得用“原 grader 已通过”替代独立证据。无法执行写 \`NOT_RUN\`。
- 按包结账：P004 32 开发候选 + 2 B39 不可达；P001/2/3/5 仍有待审位置。前包进入下一编号并不等于所有来源可升级。当前正式 strict A813/1996。

## 安全边界

- 当前 Workflow **只监听 infra/a-dev-only-tests-20261121 的 push**，不会触发正式 PR Required；不创建 PR、不合并、不部署。路径与 SHA 由独立 Node 校验，真实 checkout 再检查 exact HEAD。
- runner 的 \`strictAApproved:false\` 和 \`artifactIndependentAudit:NOT_RUN\` 是强制事实。正式 Required/P8/P9/P10/Artifact、合并后 main 双验仍由 #341 在接近 P060 时进行。
- Artifact 期限保持原样 \`retention-days: 7\`；不额外下载所有历史 ZIP、不延长保存期、不因超过 7 天自动复测已成功候选。
