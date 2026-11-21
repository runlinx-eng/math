# #341：B 线 28 道原生前置导航补验（2026-11-21）

> **结论：原来 28 道 `seededLessonPositionOnly:true` 中，19 道获得原生首题 / 真实 Next 的独立新 CI 证据；剩余 9 道仍必须直接定位，不能冒充原生前置导航。正式 strict A 增量 0。**

## 新 exact HEAD 和可追踪工作

- 补验分支 [`audit/issue-341-native-next-20261121`](https://github.com/runlinx-eng/math/tree/audit/issue-341-native-next-20261121)，草稿 [PR #345](https://github.com/runlinx-eng/math/pull/345)，base 为原中央验收 [PR #344](https://github.com/runlinx-eng/math/pull/344) 的原 HEAD `0cafdaed5aad3d32bf09ab1d9abf6e77130a069d`，**没有合并**。
- 补验 exact HEAD `fc000d9143155081e7102fe65ce2d43fa93f0c58`；[专门 Chromium Run #44913254309](https://github.com/runlinx-eng/math/actions/runs/44913254309) **3/3 shards completed/success**；[Required Run #44913254277](https://github.com/runlinx-eng/math/actions/runs/44913254277) **completed/success**。
- 原来的 97 份交接补丁、113 个家族的原测试与原严格数学证据模块全部**保持原 Blob 不变**。新建 9 份 `tests/issue341-native-next-*.cjs` 独立复验副本；真实下一题只通过 `#actions [data-do="next"]`，并断言前一题 `summary.cases[index].complete===true`。不能继续的题位才明确采用原保存索引定位，并在 `navigationRoutes` 标 `seeded-only`。原 UI 数学操作 / wrong→correct Check、SW 停站刷新、State-v2 等检查仍执行。
- 第一轮 [#44913048333](https://github.com/runlinx-eng/math/actions/runs/44913048333) 曾 FAIL：夹具把同文档 `#lesson` 哈希跳转的 null navigation response 当成必须 `fromServiceWorker` 的网络响应。**仅修夹具断言**；停止 HTTP 后的 `page.reload().fromServiceWorker()===true` 仍保留，最终新 HEAD 正式重跑成功。不能擦除旧 FAIL。

## 9 家族、28 题的逐包结果

| B 研究包 | 目标原生题位数 | 原生首次或 Next | 仍直接定位 |
|---|---:|---:|---:|
| P109 common-factor | 3 | 3 | 0 |
| P110 mean-distance | 2 | 2 | 0 |
| P111 bilateral-equations | 5 | 4 | 1 |
| P112 fair-die | 6 | 2 | 4 |
| P113 tens-removal | 4 | 2 | 2 |
| P114 solidstack | 2 | 2 | 0 |
| P115 signedpoints-quadrants | 3 | 3 | 0 |
| P116 integer-dotplot | 2 | 1 | 1 |
| P117 directed-jump | 1 | 0 | 1 |
| **合计** | **28** | **19** | **9** |

### 9 个原生前置链仍待补齐的位置

- `equations35:2`（P111）
- `chancecalc:1`、`chancescale:1`、`chancenone:1`、`chancecomplement:1`（P112）
- `tenslarge:1`、`general34:1`（P113）
- `dotrecords:2`（P116）
- `fractionfour:8`（P117）

上述九题的原目标数学动作、原 Check 和停源离线回放有通过的中央证据；**缺的是从原 UI 合法前置任务进入该位置的附加证明**，不是源代码未测试，亦不是数学不变量已被判错。需要逐题完成前置操作并使用原生 Next，或明确定义目标题级合同允许直接定位的准入边界。不得直接把 `seeded-only` 更新为 `strictAApproved`。

## 独立 ZIP 和剩余事项

本轮 3 个新 Artifact 均已单独下载、SHA-256 与官方 digest 比较、ZIP CRC 核验，全部 PASS：

- Shard 0: [#14710513572](https://github.com/runlinx-eng/math/actions/runs/44913254309/artifacts/14710513572) — 12 位置，8 原生 / 4 seeded。
- Shard 1: [#14710432642](https://github.com/runlinx-eng/math/actions/runs/44913254309/artifacts/14710432642) — 8 位置，5 原生 / 3 seeded。
- Shard 2: [#14711065810](https://github.com/runlinx-eng/math/actions/runs/44913254309/artifacts/14711065810) — 8 位置，6 原生 / 2 seeded。

三个分片 `shard-{0,1,2}-route-summary.json` 中逐题保留起点索引、前题真实完成状态、导航方式和原始结果。ZIP 保留到 **2026-11-28**，需按正式证据保留策略归档。

### 分组正式 A 仍保持不变

- P007：30；独立数学交叉核查已记录于同一审计分支，正式授 A=0。
- B：308，其中原 28 个导航疑点已解决 19，剩余 9；正式授 A=0。
- P009：27；正式授 A=0。
- 其余 337 道不在本“28 个导航疑点”任务中，**也不代表已经完成正式逐题数学合同审查**。不得因 19 道补证而绕过 shared registry/feedback/manifest、PR exact HEAD、合并后 main Required/Fallback。
