# #341｜不重复测试的正式接入预检（2026-11-21）

**目的：接收已有 B 线原始测试证据，不把 298 道尚未单独用 Python 重算当作“必须再测”；对公共共享写入者的下一道真正门禁做只读准备。**

## 精确来源锁定：365／365，0 冲突

- 已读取 `main@f4be9f88da7af59b6df1819ae242cf134591c376` 所批准的 [原始 `evidence-review-manifest.json`](https://github.com/runlinx-eng/math/blob/f4be9f88da7af59b6df1819ae242cf134591c376/docs/spatial-learning/evidence-review-manifest.json)，**813 道既有 A**（不是本批）。该正式 manifest 一行未改。
- 已逐家族锁定 P007 16、P009 5、B 92 的 **113 个精确候选模块**，提取真实 `Binding/replay/submitted` 导出函数，打包在 [113 导出对照表](./staging-integration/exports-all-113.json)。部分家族在单一模块下包含多个原题 `type`，因此不能靠源码中某个词语推断 type，而由原 `sessionTaskFor` 在专用 CI 中实际读取。
- [隔离 Draft PR #348](https://github.com/runlinx-eng/math/pull/348) 上的专用源码锁定 [run #44920634904](https://github.com/runlinx-eng/math/actions/runs/44920634904)，**exact HEAD `d0b9bf929d0ddf7fcce23601cff27ff9dc0e320e`**，`original-source-lock-only` job completed/success，记录：
  - **365/365** 题位：原 `LESSONS` nodeId、原 `sessionTaskFor` 的完整 64 位 SHA256 与冻结台账一致；
  - **113/113** 家族导出已实际 import，**365/365** 题位仅有匹配的那个候选家族 binding；
  - 与既有 **813** 个获批 manifest 题位 **0 重叠**，与原已注册 `EVIDENCE_ADAPTERS` 的有效绑定 **0 重叠**；
  - 候选没有擅自声明新的数学思维方法标签；`errors:[]`、`additionalMathTestsRun:0`、`approvedManifestChanges:0`。
- GitHub Actions **首次 run #44920568201 FAIL** 是新增源码锁定脚本中一个结果字段拼写造成的 JavaScript 语法错误；已只修该审计脚本，不改数学原题、候选 replay/现有通过测试。失败记录保留，修复后的上述 exact HEAD success 不抹除旧 FAIL。
- 预检产出 `issue-341-source-lock-only` Artifact **14713850524**，官方 SHA-256 `998b5f56628efa20ccec746b9d60748bcfb513185f9289b8b2717b28419c10c1`，过期时间 **2026-11-28 15:42:55 UTC**。其中 `UNAPPROVED-proposed-manifest.json` **只是审计提案**，不是正式 `evidence-review-manifest.json` 的增量，也不能据此称严格 A。

## 第一批有明确观察边界的 B 线合同：5 家族／12 题位

继续只读审现有 replay 和 Node 合同源码，不重跑成功的 Chromium／Node；详细逐题边界与排除项见 [12 道数学合同范围 JSON](./b-first-12-observable-contract-review.json)。

| B 家族 | 题位 | 可核查主张 | 禁止外推 |
|---|---:|---|---|
| P105 | 3 | 冻结 1／2／51 原题，真实试除、余数、因数和分类 | 一般任意整数的算法证明／学生独立策略 |
| P107 | 2 | 24／36 的无序因数对、转向去重、面积数量守恒 | 其他数的普遍能力 |
| P109 | 3 | 3 个冻结代数式最大公因式、指数与展开事件 | 自主推导一般代数分解方法 |
| P116 | 2 | 原点图叠点、频次、众数、空刻度及真实订正 | 自由文字和长期掌握 |
| P091 | 2 | 数轴端点最终状态、严格有理数探测和真假记录 | **未记录的历史数轴图形位置／端点样式** |
| **合计** | **12** | 使用原测试支持的有界数学证据 | **不授 A** |

其中 **10 道**此前已有额外独立有界数值核对，P091 两道继续尊重原生 `trials` 只保存真假判定、并不保存当时图上 marker 的位置的证明界限。报告中不声称第二套算法覆盖了另外 298 道，也不新增这些题的浏览器测试。

## 后续门禁，绝不自动扩张 A

1. 现有 B **308/308** 的开发／中央测试证据继续标 `EXISTING_EVIDENCE_REUSE_ACCEPTED_PENDING_FORMAL_INTEGRATION`，整批复用；上述来源锁定对本轮 **365** 道均为可复现的“准入准备预检”，但不是数学准入批准。
2. 公共单写入者接入 `evidence-adapters.js`、`thinking-feedback.js`、独立审核后的 `docs/spatial-learning/evidence-review-manifest.json` 之前，应逐家族明确哪些可观察数学论断／反馈文字得到源原动作与 CI 支持。manifest 只能经过有证据的人工范围批准，不能从候选程序自动授予。
3. 接入后的**变更 exact HEAD** 必须运行适用正式 Node／Chromium／P10/Artifact/Required；日后按现有保护策略正式合并后的**新 main** 仍须独立 Required/Fallback 双验。当前不擅自合并 main、授 A、部署 VPS 或 full multiwave。

截至此记录，原主线正式 A **813/1996**，本批新授 A **0**；#344–#348 均保持 Draft。此报告与 365 道逐题 JSON/CSV 均保存在隔离审计分支，不修改正式 manifest。
