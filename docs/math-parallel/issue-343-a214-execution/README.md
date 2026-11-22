# #343｜214 道原生题的 B 线交接

冻结基线为 `main@1e9d270d7243b3519fabcfbe7f05f66f82cada73`。B 线已逐题核对 22 个原包的 214 个位置、原生节点、题型和完整任务 SHA-256。

- **99 道、25 个候选家族**通过定向 Node、仓库推送前检查和本机 Chromium。每道均从原生入口进入，保存一次原控件错误 Check 和一次订正 Check，在停止 HTTP 源站后重开并核对完整记录，再复核原 State-v2 导出中的作品与提交。
- **115 道保留原分类结项**。其中 B 37、C 31、D 43、E 4。逐题看见的操作、只留下的结果和保留原分类的理由见下方清单。
- B39 的 4 道题经按需加载后可从原页面走到。3 道复用 GitHub 主线中相同原题的数学回放，1 道实现固定 130° 量角器辨读。本轮对四个不同的原生题位各留了自己的 Check。等式题 `communicate38:0` 也复用现有数学回放并保留本位置的原始记录。
- 正式覆盖仍为 **A1663/1996**。共享注册、正式 CI、主线合入及新主线 Required/Fallback 由中央线接续。开发期验证覆盖本机原控件、离线恢复和 State-v2 导出。文件选择器导入、正式 CI 和儿童实测分别待后续验收。

## A 线证据复用复核

- **可直接复用整题 0 道。** 对照 A 线开发台账的 127 道成功题位、66 个旧候选分支及相关交接，没有找到这 214 道中已有完整同题合同和原 Check 的候选。部分原生题位已有预审或前置记录，逐题索引保留这些出处。[A 线开发台账](https://github.com/runlinx-eng/math/blob/0da77fa915ee3ab460853aa529e54e4ea31acb1e/ci/a-candidate-dev/progress-ledger.json)
- **需要补开发或补验 99 道。** 其中 4 道直接复用已验证的数学回放，补独立的本题来源绑定和 Check。其余 95 道补足本题所缺的合同与验证。各族共享数学实现、反例和浏览器场景，原生来源和提交记录可逐题追溯。
- **无需开发结项 115 道。** 保留能继承的 A 线预审，例如 P001 的两道方格；保留原分类的逐题原因已写入清单。
- 原生「下一题」路径曾经过 14 道已有正式 A 的前置，存档里有 19 次前置 Check。这部分用于到达新候选位点，未列入 99 道的验证成果。现成原件能够覆盖同一前置与入口时，可直接复用。

## 逐题和候选证据

- [214 道逐题决定](./positions.csv)。表中列出开发判断、旧证据及来源。`CANDIDATE_LOCAL_PASS` 对应可交中央的本地候选。`CLOSED_RETAINED_CLASS` 对应「已结项、无需开发（保留原分类）」。
- [候选、范围与校验值](./manifest.json)。每族记录确切 commit、保留的数学观察、补丁与回执。
- [候选 Git bundle](./candidates.bundle)含 25 个独立候选提交。它们均以冻结 main 为父提交，每族新增一个数学模块和一份针对原生题位的 Node 测试。[文本补丁](./patches)和[测试收据](./receipts)也可逐族查看。
- [本机 Chromium 原件 ZIP](./originals/native-chromium.zip)和[成员 SHA-256](./originals/file-sha256.json)。ZIP 共 1,261 个文件，包含 Chromium 检查、原始 State-v2 存储与导出、PNG 及旧失败收据。测试使用隔离的合成记录。ZIP 全 CRC 及成员哈希复核通过。SHA-256 为 `8406bf77515db4ed3a33b25d7d540a02cbe46f50f886c4ae9e95198a478a4716`。
- 开发期夹具的首轮失败及定向补测保留在 ZIP。失败原因涉及页面片段导航、可提交条件、输入上界和换表示后须重新搭建。逐题收据引用实际成功的原件。

## 原件复核

用候选精确提交作当前工作树。把 ZIP 展开到独立目录，在候选工作树中运行以下命令，三个参数分别为 `manifest.json` 中的家族 ID、本交接目录的 `fixtures/families.json` 和原件的解压目录。

```sh
node /path/to/fixtures/audit-family.mjs family-id /path/to/fixtures/families.json /path/to/extracted-originals
```

复核读取原始存储和 State-v2 导出，并校验失败和订正 Check、离线恢复、完整任务指纹及原截图哈希。浏览器驱动与单族场景位于 [fixtures](./fixtures)。现有原件满足这些复核时，可以直接复用。

本轮任务来源采用 [#343 派单](https://github.com/runlinx-eng/math/issues/343#issuecomment-7075524509)、[#342 原履历](https://github.com/runlinx-eng/math/issues/342#issuecomment-7075428774)和[固定的 214 题清单](https://github.com/runlinx-eng/math/blob/0b04a61d567cd25b04b61bad49105aef6def6285/docs/math-parallel/issue-343-a214-handoff/positions.csv)。
