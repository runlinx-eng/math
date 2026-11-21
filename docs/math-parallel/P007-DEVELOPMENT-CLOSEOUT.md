# P007（shape-draw）开发期收尾记录｜2026-11-21

状态：**DEVELOPMENT_PACK_COMPLETED / FORMAL_A_NOT_GRANTED / INDEPENDENT_ARTIFACT_AUDIT_NOT_RUN**。

本文件只是跨窗口交接与独立候选留证，不修改原题、判题、状态格式、数学关系、CI 正式门禁、main、B 线或发布。权威开发机器数据：`infra/a-dev-only-tests-20261121/ci/a-candidate-dev/progress-ledger.json`；该分支最后核对的提交为 `0da77fa915ee3ab460853aa529e54e4ea31acb1e`。完整开发里程碑见 [#342](https://github.com/runlinx-eng/math/issues/342)。

## 结果与边界

- 原研究包 P007：**30 / 30 个不同原生题位**取得 exact-candidate-HEAD 开发期机器收据 PASS，分属 **16 个彼此独立的数学子家族**，所有位置唯一。
- P001–P007 合计 **66 个不同开发期成功子家族 / 127 个不同原生题位**。这是候选进度，**不是 strict A**；正式已验 main `f4be9f88da7af59b6df1819ae242cf134591c376` 仍 **A813 / 1996**。
- 独立 exact SHA 开发流程包含 source/full runtime task SHA256、Node 数学与负例、真实 Chromium 原控件与原 Check、wrong→correct、原生记录/State-v2 和 SW 停原站后离线重载；以各自 CI 原始日志和 Artifact 为准。存在早期真实 FAIL，修复之后只以新的最终 SHA 绿灯为准。
- 开发 Artifact 各有 7 天保留、官方上传凭据；**所有独立下载、ZIP CRC、逐张 PNG 独立审计尚未执行**。不能用本记录代替正式 PR、新 main 的双重验收。
- 候选仍在独立 `work/a/*` 分支，未注册公共 `evidence-adapters` / manifest / feedback / SW / release；无 PR、合并、部署、家族间共享改动。不要因为 30/30 而提前触发 #341；接近 P060 集中整合。

## 16 个来源锁定候选

| 子家族 | 唯一原生题位 | 最终固定候选 HEAD | 成功开发 Run | Artifact ID（独立审计 NOT_RUN） |
|---|---|---|---|---|
| P007a-cube-frame-edge-build | shapeframe:2, shapedraw:4 | `6666ad4f5d09d124c11dc8309c9ea39bbae6efb0` | [44899719114](https://github.com/runlinx-eng/math/actions/runs/44899719114) | 14705511317 |
| P007b-pyramid-view-identity | shapedraw:5 | `6a2bd6024727cccbae2c143d82568e44e32640b4` | [44900548009](https://github.com/runlinx-eng/math/actions/runs/44900548009) | 14706155673 |
| P007c-triangle-sas-drawing | shapemeasures:0 | `01f3a0942b3c7f4d190f89f62b334f8868dfff41` | [44901188579](https://github.com/runlinx-eng/math/actions/runs/44901188579) | 14705838774 |
| P007d-rectangle-dimensions | shapemeasures:1 | `6c0e5265ad106820085ef3529dffddda662a7fbf` | [44901650053](https://github.com/runlinx-eng/math/actions/runs/44901650053) | 14706058868 |
| P007e-regular-pentagon | shapemeasures:2 | `6c8f91980f6a44e6180b0d56530ddb2cc7a8c526` | [44902374524](https://github.com/runlinx-eng/math/actions/runs/44902374524) | 14705489699 |
| P007f-native-circle-radius-diameter | circleparts:0, circleparts:1, circleparts:2 | `f39bfd988ca85d4709dc942c3704e31c21e2f212` | [44903175915](https://github.com/runlinx-eng/math/actions/runs/44903175915) | 14706717546 |
| P007g-native-compass-bisector | compasswork:0 | `3ed4b279f63039f0926fb59cbfdbce321bf7fe12` | [44904025937](https://github.com/runlinx-eng/math/actions/runs/44904025937) | 14706619640 |
| P007h-native-angle-bisector | compasswork:1 | `dd4faa8eadbd2253c4b21774f435e24c93f6e96c` | [44905055693](https://github.com/runlinx-eng/math/actions/runs/44905055693) | 14707327162 |
| P007i-native-exterior-perpendicular | compasswork:2 | `44521400301c1053f9fa48e825def87f02c066b9` | [44905055693](https://github.com/runlinx-eng/math/actions/runs/44905055693) | 14707462795 |
| P007j-native-rectangle-invariants | rectanglefacts:0, rectanglefacts:1, rectanglefacts:2 | `00f6dbeec869b866ed9b8df4cd61a322eee170ef` | [44905207750](https://github.com/runlinx-eng/math/actions/runs/44905207750) | 14707737040 |
| P007k-native-circle-pi | shapefacts:2 | `1f528006c22aac2f7ea7d91a80ff3dcdad2ede81` | [44905207750](https://github.com/runlinx-eng/math/actions/runs/44905207750) | 14707368575 |
| P007l-native-triangle-sas | triangledraw:0, trianglecongruent:0, trianglecongruent:3, trianglepossible:5 | `62e5ad637bcd4cda7d63e8a90dcec3ca160dcbcb` | [44905431028](https://github.com/runlinx-eng/math/actions/runs/44905431028) | 14707981252 |
| P007m-native-triangle-sss | triangledraw:1, trianglecongruent:1, trianglepossible:0, trianglepossible:1, trianglepossible:2 | `9eb90f233d66077e78c8b4d60569d4575ee88469` | [44905431028](https://github.com/runlinx-eng/math/actions/runs/44905431028) | 14707976337 |
| P007n-native-triangle-asa | triangledraw:2, trianglecongruent:2 | `eea37181efe7892428e21599228d4b6419f6d26f` | [44905431028](https://github.com/runlinx-eng/math/actions/runs/44905431028) | 14707369015 |
| P007o-native-triangle-ssa | trianglecongruent:4, trianglepossible:4 | `656c4cd2141fadc35d08566b40b841fa9bacb64c` | [44905431028](https://github.com/runlinx-eng/math/actions/runs/44905431028) | 14706983812 |
| P007p-native-circle-terminology | advancedWords38:0 | `a321983639798aba2223629f1b17fe486e99db8b` | [44905627141](https://github.com/runlinx-eng/math/actions/runs/44905627141) | 14707797806 |

## 下一阶段

从 [冻结队列](./dual-lane-queue.json) 的 P008 起按编号开发 A 侧 P008–P059。B 侧 P060–P117 由本地 Codex 自治，尚未收到代码和完整测试原件；只建立审核准备、收件和风险清单，不假设 B PASS 或对 B 提交做变更。审核准备索引为 [p008-p117-audit-index.json](./p008-p117-audit-index.json)，执行方式见 [P008-P117-AUDIT-PLAN.md](./P008-P117-AUDIT-PLAN.md)。

本 P007 包的开发验收可视为结案；#342 总线 Issue 因 P008–P059 仍进行中**保持 OPEN**。正式 A 转换仍严格归 #341 的末段独立整合。
