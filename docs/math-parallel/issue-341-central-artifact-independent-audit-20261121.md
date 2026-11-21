# #341：中央 365 道联合验收的独立 Artifact 核查（2026-11-21）

> **结论：中央 Artifact 的文件完整性及可检查的原生状态保存一致性核查 PASS；不等于数学资格最终审核通过。正式 strict A 增量 = 0，PR #344 仍为 Draft，不合并 main。**

## 固定范围和来源

- 正式冻结 main `f4be9f88da7af59b6df1819ae242cf134591c376`。
- 中央复验 exact HEAD `0cafdaed5aad3d32bf09ab1d9abf6e77130a069d`；[中央 Run #44909628782](https://github.com/runlinx-eng/math/actions/runs/44909628782)、[Required #44909628766](https://github.com/runlinx-eng/math/actions/runs/44909628766)、[P8 #44909628795](https://github.com/runlinx-eng/math/actions/runs/44909628795) 均 completed/success。
- P007：16 家族 / 30 题位；P009：5 家族 / 27 题位；Codex B：92 家族 / 308 题位；合计 **113 家族 / 365 题位**，按 `sessionId:index` 去重 **0 冲突**。
- Codex 97 份本地补丁的冻结基线独立工作树重放见 [handoff-integrity Artifact](https://github.com/runlinx-eng/math/actions/runs/44909628782/artifacts/14709312636)：`git apply --check` / `git apply`、SHA-256 和 Git Blob 核对 **97 PASS / 0 FAIL**。

## 本次实际独立执行

独立取得中央 run 的 **14 份 ZIP 原件**（12 个 Chromium shard、1 个 P10、1 个补丁工作树审计），将下载字节直接与 GitHub Actions Artifact 页面公布的 `digest: sha256:...` 比较；在本地逐 ZIP 校验 CRC 和全部 member 的解码。

| Artifact ID | 内容 | SHA-256 / CRC |
|---:|---|---|
| 14709950119 | browser shard 4 | PASS / PASS |
| 14709840376 | browser shard 3 | PASS / PASS |
| 14709745536 | browser shard 10 | PASS / PASS |
| 14709706207 | browser shard 0 | PASS / PASS |
| 14709681095 | browser shard 2 | PASS / PASS |
| 14709606323 | browser shard 6 | PASS / PASS |
| 14709600758 | browser shard 11 | PASS / PASS |
| 14709546542 | browser shard 5 | PASS / PASS |
| 14709402458 | browser shard 1 | PASS / PASS |
| 14709312636 | handoff worktree replay | PASS / PASS |
| 14709259223 | browser shard 7 | PASS / PASS |
| 14709224626 | browser shard 9 | PASS / PASS |
| 14709214794 | browser shard 8 | PASS / PASS |
| 14708459686 | P10 backup/offline | PASS / PASS |

精确审计总数：
- ZIP 14/14、成员 4964 个：PNG **721**、JSON **2239**、原始存储 TXT **2004**。
- 2239/2239 JSON 可解析；**2004/2004** 原始 `*-storage.txt` 与对应 `*-decoded.json` JSON 结构深度相等，未发现缺少配对；721/721 PNG 可完整解码、非空、尺寸合理，未发现同字节重复截图或近似纯色截屏。
- 113 份浏览器 `results.json` 均有固定中央 HEAD、原生 source/nodeId 与 64 位 task SHA256、非空检查项、`errors: []`；713 份家族声明的截图均真实存在；P10 另有 8 张。
- 从 `results.json` 归并 365 个不重复原生位置；对应 365 份最终 Check 状态：**360 题有 2 次真实原始尝试、5 题有 3 次**；第一尝试 `exposed=false`、最后一次 `exposed=true`；**365/365** 的 `offline-reload` 与最终 Check 中原 `lessons[sessionId].cases[index].attempts` 及 `models[index]` 深度一致。
- 使用 113 个家族各一张“correct”阶段代表截图制作 6 张缩略图核对表并目视检查：均呈现数学原生页面与任务控件；**这属于每家族抽样视觉核对，不是 721 张逐张语义人工审图。**

### 原件和未覆盖范围

- 旧 run 的 `independentBrowserArtifactAudit: NOT_RUN` 是它**生成时**的准确状态，不追改；以上是此后新增的独立核查记录。
- 以上文件/状态检查没有脱离既有数学实现重新证明每个算法合同的正确性；不能仅凭整批 CI 通过而批准 365 个正式 A。数学合同逐题人工准入、公共 adapter/feedback/manifest 接入后的复验、PR exact HEAD 与合并后 main 双验，均仍待执行。
- 本次独立下载范围只含**中央 Run 的 14 个 Artifact**，不声称 16 个 P007 开发候选阶段 Artifact 也已独立审计。
- 中央 Artifact 按 GitHub 元数据将于 **2026-11-28 13:41–13:44 UTC** 左右到期，必须在期限前归档需要长期保留的证据。

## 后续逐题准入的特别关注

9 个 B 家族在中央 `results.json` 中注明 `seededLessonPositionOnly: true`，合计 **28 题**：

| B 家族 | 数量 |
|---|---:|
| P109 common-factor | 3 |
| P110 mean-distance | 2 |
| P111 bilateral-equations | 5 |
| P112 fair-die | 6 |
| P113 tens-removal | 4 |
| P114 solidstack | 2 |
| P115 signedpoints-quadrants | 3 |
| P116 integer-dotplot | 2 |
| P117 fractionfour-directed-jump | 1 |

它们的浏览器原始控件、最新 Check、原始状态和离线恢复确有证据；但**这份运行本身不能替代完整原生前置 / Next 路径的独立导航证据**。先补验或明确其合同允许定位测试的依据，避免把“真实目标控件”误写为“完整导航已验证”。这 28 题特别标记 `NAVIGATION_REVIEW_REQUIRED`。

**分组验收暂记：**

| 来源 | 结构与状态证据 | 正式严格 A |
|---|---|---|
| P007 30 | ARCHIVE_AND_STATE_PASS | 0 granted / 30 pending |
| P009 27 | ARCHIVE_AND_STATE_PASS | 0 granted / 27 pending |
| B 308 | ARCHIVE_AND_STATE_PASS（其中 28 需导航补验） | 0 granted / 308 pending |

## 下一轮执行入口

1. 优先补证或检查上述 28 题的完整前置路径，形成可复跑 exact-HEAD 记录；其他 337 题继续逐题数学合同和负例准入。
2. 将 P007、P009、B 分三份正式授 A / 拒绝 / 待补证名单，逐题明确 source、任务 hash、证据级别、合法拒绝边界；禁止把本报告的“档案 PASS”写成严格 A。
3. 合格题位分批接入 shared registry / feedback / manifest，原题和 grader 不改；每批 Draft PR exact HEAD 重新跑 Required/P8/P9/P10/Chromium/Artifact，然后在正式合并后对新 main 进行 Required/Fallback 双验，再更新 #130。

**零更改边界：** 此记录仅写入独立 `audit/*` 分支；未移动 #344 HEAD、未修改 main、未授 A、未部署 VPS。
