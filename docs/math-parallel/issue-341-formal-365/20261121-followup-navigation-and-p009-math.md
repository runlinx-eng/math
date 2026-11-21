# #341｜正式逐题验收续办：28/28 原生导航 + P009 27 道独立算术复核

**2026-11-21 追加审核结果；保留全部历史 CI 结果及中央正式 strict A=813/1996，新授 A=0。**

## P111/P112/P113：真实前置路径 7/7

- 新隔离审计 Draft [PR #346](https://github.com/runlinx-eng/math/pull/346)，代码只新增 `tests/issue341-gap-prereq-navigation.cjs` 与专用 Actions，不修改候选算法、原题、grader、共享 registry/feedback/manifest 或 main。
- 初始 [run #44916179044](https://github.com/runlinx-eng/math/actions/runs/44916179044)：P111 1/1、P112 4/4 成功，P113 **FAIL**。原因是前题 `general34:0` 的原生控件为 B10 `x-threegroups`，旧夹具错误选用了 B11；保留原失败，不改原原题/判题器。
- 只修夹具：P113 `general34:0` 的两两配对由原 `triple-pick / triple-merge / sub / total / triple-save` 控件完成。最新 exact HEAD `80383841b2b96d81930b387167a6b01aeaa5b732`，新 [Chromium run #44916312166](https://github.com/runlinx-eng/math/actions/runs/44916312166) **P111/P112/P113 3/3 成功**，其 [Required #44916312157](https://github.com/runlinx-eng/math/actions/runs/44916312157) **completed/success**。
- 3 份新 Artifact ID：P111 `14711932530`、P112 `14711364741`、P113 `14711298172`。独立对照官方 SHA-256 与 ZIP CRC **3/3 PASS**，全部 JSON 可解析、TXT 与配对 decoded JSON 结构一致、PNG 可解码。目标题位按原 Check、Next、到达及停止 HTTP 后真实 SW reload 核对：`equations35:2`，`chancecalc:1`，`chancescale:1`，`chancenone:1`，`chancecomplement:1`，`tenslarge:1`，`general34:1`。
- 未进行用户练习历史存储索引写入；原生前题 Check 可确证前题数学动作，但不等于公共 strict-A 家族已注册，严禁将先前未注册 `supported:false` 或 `exposed:false` 改写成 strict A。

## P117：fractionfour:8 的连续 0–7 前置链 1/1

- 单独 Draft [PR #347](https://github.com/runlinx-eng/math/pull/347) 从原 365 台账分支创建；**仅新增 P117 浏览器前题夹具和单一新 CI Workflow**，不复跑前面 27 个已验证的导航位置，也不更改 PR #344/#345 或 main。
- 固定审计 HEAD `d714f206371261fda35bbc4d64fa17a0232b89cc`；[专用原生 Chromium run #44916741741](https://github.com/runlinx-eng/math/actions/runs/44916741741) **completed/success**，浏览器 Chromium 141.0.7390.37、398 条检查、`errors:[]`。
- 从 `fractionfour:0` 开始，原生 B17 `x-fracoperations` 加/减/乘/除原数学过程逐一由真实原 UI 控件完成，每题原 Check 均为正确并解锁原 Next。连续 **8 次原 Check 与 8 次 Next** 后到达原目标 `fractionfour:8`，目标锁定 node `mt_gNUE4B3vuk`、full task SHA-256 `eb249dbc77c4acb4fc19245cfe552b6f39069c63461df463abf4bc9779a64e77`；`storageIndexWrites=0`，停止源站后 SW reload 成功。
- 新 Artifact ID `14711587983`，独立下载的 ZIP 官方 SHA-256 `e99b01b43d6acea12733aab471a474df83ec9ed044a28525b384cdf0eb43eead` 对照成功、CRC PASS，30 成员（11 JSON / 10 TXT / 9 PNG），原始存储配对及 PNG 解码均 PASS。
- 此为 **导航证据**，不是额外声明 P117 目标数学模块全面完成独立负例审核；PR #347 的独立 Required 结果另以真实运行最终状态记载，不将运行中的结果冒写 PASS。

上述结果将原 28 个有 `seededLessonPositionOnly` 风险的 B 原生位置由此前 20/28 有完整前置证明更新为 **28/28 NATIVE_NEXT_PROOF_PASS，剩余 seeded-only=0**。原先 19/28 和 20/28 是过去时点真实状态，历史文档不回写。

## P009：5 个家族／27 道的独立算术交叉检查

对原中央 [run #44909628782](https://github.com/runlinx-eng/math/actions/runs/44909628782) 5 份已成功的 Chromium Artifact ZIP **只读分析，不重新执行任何 Node/Chromium 测试**，逐个验其 SHA-256/CRC、原始 Check 模型、错误→订正最新尝试和原生算术结构；以独立 Python 的整数、分数/有理数运算推导，不调用原候选 grader。

| 家族 | 题位数 | 独立公式/结构断言 | 检查主题 | Artifact ID |
|---|---:|---:|---|---:|
| P009a 十桥/补十 | 7 | 49 | 整数加减、到十分拆、移子唯一性及最后计数 | 14709950119 |
| P009b 加减事实族 | 8 | 96 | 四种等式、交换律及两条逆向减法 | 14709546542 |
| P009c 三组配对 | 5 | 55 | 两种不同配对、由总数和小计独立恢复三堆数量 | 14709606323 |
| P009d 逆运算 | 5 | 17 | 加/减/乘/除/整数平方根及连续步骤还原 | 14709259223 |
| P009e 小数互补 | 2 | 10 | 用精确有理数检验互补之和等于 1，错误首试不是 1 | 14709214794 |
| **总计** | **27** | **227/227 PASS** | **5/5 ZIP SHA-256 与 CRC PASS** | |

**边界：** 此处仅证明被冻结的 27 道原生状态里的明确可见算术关系及操作结构；没有为每道题构建独立的全部 adversarial/负例 grader、源登记或最终严格 A 合同。不把 227 条有界断言直接等同 27 道获授 A。

## 按原有 365 道 intake 更新

- P007：30 道，原独立几何交叉检查 216/216 PASS，状态不变。
- P009：本次新增 **27 道**独立有界算术核验 PASS。
- B P116：原有 **2 道**独立有界点图数学核验 PASS。
- 故 **59/365 道**已有独立有界数学数值/操作检查；**306 道**仍待独立逐题数学合同/反例评议。此算式的“待评议”不等于开发期未测试，也不等于原 CI FAIL。
- 全部 **365/365 原始状态及档案证据 PASS** 保持原样；**28/28 重点原生导航补验完成**。但是全部逐题最终数学范围裁决、共享 `evidence-adapters` / `thinking-feedback` / manifest 正式接入、适用 PR exact-HEAD 验证、合并后新 main Required/Fallback 双验仍未完成。
- **审计分支不授 A、不合并 #344/#345/#346/#347 至 main、不部署 VPS，不降低任何门禁。严格 A813/1996 不变。**

原本地独立数值核对脚本、机器 JSON 及下载 Artifact 保存在本轮执行环境，GitHub 本报告记录相同的审计统计和可追溯 Actions 证据。
