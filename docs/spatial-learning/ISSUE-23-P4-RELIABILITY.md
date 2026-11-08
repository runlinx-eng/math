# Issue #23 · P4 学习足迹、兼容与离线可靠性核查

## 范围与可复核基线

- 上游：PR #26 HEAD `5c1c92938889ca5f4b4258ab859ce521c005315a`。
- P4：PR #27，目标为 P3 分支，保持 Draft；不改知识节点、坐标、关系、学段映射、教学内容、判题算法或 schema。
- 本轮先提交回归用例、运行 GitHub Actions，取得失败日志后才修复：初次 [Required Checks #42465164637](https://github.com/runlinx-eng/math/actions/runs/42465164637) 182 个 Node 测试中 178 通过、4 失败。
- 四项首次复现：导入侧未完成草稿丢失；重复问题缺失的现场不能从另一备份补回；访问/知识群首次打开时间被较新值覆盖；旧足迹离线提示检查已废弃缓存版本。
- 相关最小修复：`dist/learning/state.js`、`dist/learning/daily.js`、`dist/exploration-core.js`、`dist/exploration.js`、`dist/space.js`、`dist/sw.js`。
- 测试入口：`tests/p4-learning-reliability.test.mjs`，`tests/p4-learning-reliability-browser.cjs`，已加入 Required Checks。

## 存储、导出、合并与异常保护矩阵

| 对象与字段 | 存储和备份 | 验证与合并 | 风险/结论 |
| --- | --- | --- | --- |
| `visited`、`openedPacks` | `math-explorer-v2`；V2 JSON | atlas ID 与 ISO 日期；P4 保留两端最早访问日期 | 早期访问不因导入更新而失真 |
| `bookmarks` | 同上 | atlas ID 校验，去重并集 | 收藏保留，不导出镜头 |
| `activities` | 同上；原活动操作、提示、历史、草稿、文字 | 活动 ID、模型、唯一事件 ID、尝试、文本验证；按 ID 去重 | 沿用原证据语义，`exposed` 在合并后依事件顺序确定 |
| `lessons` | 同上；新版任务、联合任务、解释、草稿 | `validateLesson/mergeLesson`；提示累加，尝试/文字按 ID 去重 | 空本地草稿现在可接收导入草稿；**两份非空但不同的草稿仍保留本地草稿**，需人工选择策略 |
| `daily.bridges` | 同上 | 使用源关系校验，复用 `mergeLesson` | 不独立发明关联证据 |
| `daily.questions` | 同上；问题文字、节点 ID、场景、旧版坐标、行动事件 | `validateDaily/mergeDaily`；问题按 ID，事件按 ID；P4 补齐本地缺少的导入现场/视角/节点 | 对已有非空但冲突的场景不自动覆盖 |
| `daily.continuation`、`daily.guide` | 同上 | 更新较新的时间戳和继续现场 | UI 应从原知识返回；历史相机不强行应用 |
| `journeys`、`legacy` | 同上 | 路线模型及 V1 旧记录独立验证、去重 | 不把旧完成推断为新独立正确 |
| `math-explorer-network-relationship-view-v1` | 另一条 localStorage key | `space.js` 内独立读写；不属于 V1/V2 学习 JSON | 学习备份 **不包含完整相机、学段和界面状态** |
| 缓存 `math-explorer-20261108-learning-reliability-p4` | CacheStorage，按同源隔离 | SW `install` 全量缓存，`activate` 清理旧名；网络优先离线回退 | 真实离线重开需要 Chromium 验证；版本升级跨会话模拟另需 P5 |

## 备份与异常案例

| 测试场景 | Node 回归覆盖 | Chromium 覆盖 |
| --- | --- | --- |
| V1 迁移、保留旧版学习语义 | 已添加 | 待完整历史文件人工复核 |
| V2 往返、重复导入幂等 | 已添加 | 待文件选择器交互验证 |
| 两份部分重叠任务、事件 ID、提示与重试 | 已添加 | P3 原有浏览器检查重试与提示 |
| 未完成草稿、问题原始上下文 | 已添加；首次失败后修复 | 待历史界面全流程复核 |
| 错误 JSON、未知版本和缺失 schema | 已添加 | 待文件导入交互复核 |
| 压缩、异常和 QuotaExceeded 保留旧字节 | 已添加 | 待浏览器真实存储配额验证 |
| 真实断网后打开足迹、学习与 3D 地图 | 不以 Node 推断 | `p4-learning-reliability-browser.cjs` |
| Service Worker **跨版本**升级与缓存清退 | 仅校验当前包版本/文件存在 | **未完成真实双版本部署验证** |
| 1440×900、980×760、1280×720 足迹截图 | 不适用 | P4 Chromium 归档 |

## 数据语义与剩余风险

1. `mergeLesson` 的原有策略以本地工作模型为优先，不会覆盖已有模型；P4 仅在本地草稿为空时接收导入草稿。若两边草稿均非空且内容冲突，当前 schema 不能无损表示两个独立草稿。不得声称所有冲突均无损。
2. 旧活动对 `exposed` 采用按时间排序后的提交序号修正；如果历史事件时间冲突或 ID 复用，语义还需单独审阅。
3. 当前导入顺序先写 `KEY-before-import`，再写 `KEY`；导入失败的原学习 key 不应被覆盖。但若在快照写入后、合并写入前失败，快照 key 已变化，不能声称整个 localStorage 原子事务。
4. SW `caches.addAll` 有一个资源不可取会导致安装失败。当前 Chromium 回归验证离线运行，不等于完成真实“旧版本 SW 在线升级到新版本”的完整验证。
5. 不同端口、域名、浏览器 Profile 的 Storage/CacheStorage 隔离属于浏览器同源模型，跨环境迁移应使用学习 JSON 备份。
6. 现实实践持久化：P4 **不新增字段**。未来建议另开 schema 升级议题：事件需独立 ID、知识/任务引用、发生时间、用户原始描述与附件引用（可选）、证据来源、修订与冲突处理；禁止把现实实践自述直接推断为掌握。

## P5 人工清单

- 使用真实 V1 历史导出文件及多份有冲突的 V2 备份验证迁移和界面复看。
- 在实际设备上测试被禁用的 localStorage、容量不足、损坏压缩包、50 MB 边界、重复跨窗口写入。
- 以两套完整发布版本做 SW 升级、离线缓存过渡、旧缓存清理与网络恢复；区分服务端关闭和 DevTools Offline。
- 检查历史视角版本 47/48/49/53 的恢复，以及浏览器返回、前进、刷新后学习活动/问题/足迹准确性。
- 人工验收三视口作品长列表、键盘焦点、导入错误提示与备份下载语义。
- 不因工程测试通过就宣称学生理解、数学掌握或教学有效性得到验证。
