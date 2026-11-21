# #341 精确题位准入范围只读预检

本工具仅用于 **审阅范围与生产激活准备**，不是正式数学/反馈人审，也不生成正式 manifest 或授 A。全部 365 道的数学、负例与原 Node/Chromium 结果继续复用。输入绑定 [365 行请求](./admission-requests-365.json) 与 PR #351 源 HEAD `fec2d5446c979741e3207a0c70f3e792a10eb5cf`。

## 已核对的新增真实风险

113 个源家族中 **71 个家族有多道题，覆盖 323/365 道**；其余 42 个家族各1道。若只批准某家族的一道题，而正式 registry 仅按整个家族注册，会覆盖该家族未获批的其他题位。故新 adapter/feedback/正式 manifest 的生效路径必须同时按 `(sessionId,index,nodeId,taskHash)` 的准确批准子集过滤；如缺此过滤，只能等待该家族完整批准再注册。

## 只读使用方法

```sh
node docs/math-parallel/issue-341-formal-365/formal-activation/approval-scope-preflight.mjs
node docs/math-parallel/issue-341-formal-365/formal-activation/approval-scope-preflight.mjs --hypothetical-scope path/to/local-hypothetical-source-scope.json
```

第二条只接受 `issue341-hypothetical-source-scope/1`，`sourceHead` 必须等于请求所绑定的 `HEAD`，`rows` 每行只接受 `packet,sessionId,index,nodeId,taskHash,type,adapter` 七字段并精确匹配原条目。不得给该格式加 `approved`、`grantedA`、签发人等字段；该输入只是**范围模拟**，即使365道全选也始终输出 `activationAllowed:false`、`newFormalAGrants:0`。脚本只读来源，不输出私有模型/Check内容、不写注册文件。

## 经验证的失败关闭情形

在固定 `admission-requests-365.json` 上执行结构检查和单道多题家族模拟，已校验：无选项保持0准入；假设选中1道时正确标记未获批同族的溢出数量；错误 taskHash、重复题位、额外的“批准”字段、错误源码 HEAD、伪造的人审状态均直接拒绝。上述检查**不是**旧数学重测，也不证明正式授权已取得。详细只读回执参见 [scope-check-365](./approval-scope-check-365.json)。

## 仍须独立完成

独立人工明确审核每题范围/反馈与可追溯批准依据；设计获批清单的来源、签署与防伪机制；将准确子集核对加入真正生产 adapter、feedback、manifest、审计输入；经过 SW/release 闭包及实际新 HEAD 的适用 CI/Artifact；主线合并与部署各另需许可。**不可把本检查输出当成人工批准凭据，也不可从审核请求文件直接推导 A。**

## 2026-11-22 定向加固

[`90fafe6506a3`](https://github.com/runlinx-eng/math/commit/90fafe6506a3fb83f6d6bf876be3425ac8a5d787) 将所有原生题位按全局 `(sessionId,index)` 去重，不再仅按 packet 内去重，并把申请的 HEAD 固定为已审核 PR #351 的 `fec2d5446c979741e3207a0c70f3e792a10eb5cf`。跨包别名与协调修改所有行的 HEAD 都会拒绝。新增 `approval-scope-preflight.test.mjs` 只运行元数据结构检查和两项篡改负例，既不读取原模型/Check，也不重做数学/浏览器。工作流局限于审计分支文件变更；其 CI 结果必须独立查看，不因测试提交就宣称已成功。该工具依旧只读、始终不授 A。
