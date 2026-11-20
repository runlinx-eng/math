# Q02｜两道零换位取走题的冻结合同（#304）
基准：main `74e28331795ed81fcc351f5931c28fadcbefc7b4`（已独立验收的 A765/282来源/73家族）；本文件只冻结审阅事实，不是实现、浏览器通过或正式A验收。

## 两个原生位置（仅这些可以进入下一步严格审阅）
| Session:index | 来源节点 | 原题 | 冻结 taskFingerprint SHA-256 | 操作 |
|---|---|---|---|---|
| `tensmove:1` | `mt_I5j1ZWo2cn` | `82−40=42` | `42ef003e834f6b4407f857005e52e0585d2e0a29b186abc19e7cfef39b9af343` | 原生 `b11-remove`，index=1，needed=4，十位由8减至4，个位2不变 |
| `hundredsmove:1` | `mt_xPqczp7zPX` | `762−400=362` | `d64f49f77037193a52099f5cb98410800609c8afc9dc254889593a26b74abb3d` | 原生 `b11-remove`，index=2，needed=4，百位由7减至3，十位6、个位2不变 |

哈希遵循 `scripts/audit-evidence-expansion.mjs#taskFingerprint`：稳定键名递归排序，`JSON.stringify`，UTF-8 SHA-256。原题定义来自 `dist/learning/phase5/b11.js`。实施时应由独立 Node 校验复算，不能仅相信此文档。

## 独立严格数学回放（待实现）
1. 先通过 `isEvidenceContext`、`matchesNativeEvidenceTask` 绑定精确原生 session/index、source node 和完整原题；关联练习、同 widget 异源、非整数位置、变形 prompt 均不绑定。
2. 只读逐事件回放 `history`：初始为十进制低位在前的 `digits(minuend,width)`，`remaining=digits(subtrahend,width)`。首次有效 `b11-place-start` 之前可有失败对齐；每个 start 的 guess/align 必须与原 UI 可记录状态一致，`first` 必须为历史首猜，`guess` 为最后有效输入。失败不改变计数。
3. 成功开始后只接受且必须有**恰好一次**原生 `b11-remove`。精确校验事件四字段 `action,index,before,needed`，并逐列比较 `before`，要求 index 为1或2、needed=4、当列可取走。禁止自动臆造加法移动、禁止为凑旧 `replayPlaceEvidence` 的 exchange 门槛而人为换位。
4. 用整数算术逐步核算 `sum(count[i]*10**i)`：从82取走40后42，从762取走400后362；每一步 `beforeTotal-afterTotal=removed`，被取走的数量与 `remaining` 同步，其他数位保持，全部剩余应为0。重复、错列、错量、无效/无效果、交换、篡改 before、乱序及附加事件均拒绝。
5. 最终核对 model 的 started、align、first、guess、counts、remaining、issue、answer、history 与 replay 完全一致；且 `b11-model.valid` 与 `inspect().correct` 均成立。模型、原 grader、原学籍学习记录、State-v2 JSON/备份结构与 SW 不改。
6. 可选反馈只陈述“实际对齐、取走四个十/百、剩余与当前填写相同”；失败对齐和错误提交仍保留原始历史。不得宣称孩子自主解释、独立心算、迁移或掌握。

## 验收和排除
- Node：两道任务冻结哈希、真实操作/数学正例、首次错误对齐后成功、first-wrong Check 后纠正、旧记录/Retry、异源、伪造/重复/置乱/错单位/无效果负例；受审 manifest 与 A-E 统计同步。
- Chromium：1920×1080 原控件、不注入数学正确状态、真实 `b11-place-start` 与 `b11-remove`、首次错答及重试，离线重新载入、State-v2 导出、全新上下文导入与重复导入，以及同运行收据/必要原图。
- 新建独立家族 `place-removal`，不修改现有 `place` 交换逻辑；CI 注册 `ci/math-families.json` 并核 daily Required 适用测试。PR 最新 HEAD 通过后才能合并，新 main Required/Fallback 独立成功才计数、关 #304。
- `tensmove:0,2` 和 `hundredsmove:0,2` 是工具自动拼加，不能据此宣称学生手移。Q03四面积预置图没有学生构造切拼，不纳入。现有 `tensmove:3` 已受审，不重复注册。
- 最多候选 +2A。若两题验收通过则预期 A767/B187/C120/D842/E80，来源282→283（tensmove 来源已已有A，hundredsmove 是新A来源），严格家族73→74；这些都是**待验证预期而非正式事实**。

与 `docs/math-family-preaudit/Q02-Q03-FEASIBILITY.md` 和 #304 搭配使用。