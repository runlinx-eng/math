# P117 数轴跳跃预审

B 线 [#343](https://github.com/runlinx-eng/math/issues/343)，中央 [#341](https://github.com/runlinx-eng/math/issues/341)。本地分支 `work/b/p117-preaudit`，测试基于 `f4be9f88da7af59b6df1819ae242cf134591c376`。Node 22.22.0，macOS Chromium 141.0.7390.37。

## 四道原题

原题由运行时 `sessionTaskFor` 读取，来源与 `LESSONS[sessionId].topicId` 和审计结果比对，按仓库现有方法递归排序对象键后计算完整题目 SHA-256。四道当前均为 E，正式主线仍为 A813/1,996。

| 原生位置 | 来源节点 | 完整题目 SHA-256 | 数学与结论 |
| --- | --- | --- | --- |
| `signedwalk:3` | `mt_9QzSnn8m80` | `18a8b8cfd19534a4a52ffcd6e82acafdbbaebc15ba269040a1f46fdf525d5a21` | 1−(−3)=4，参考变化 0→−3，实际变化 +3。当前记录证据不足。 |
| `signedwalk:4` | `mt_9QzSnn8m80` | `d04d07348426908f58c460d1c7b14b2d009e9cbfc1e7bd2e6239dc9c7eac670d` | −2−(−5)=3，参考变化 0→−5，实际变化 +5。当前记录证据不足。 |
| `fractionfour:8` | `mt_gNUE4B3vuk` | `eb249dbc77c4acb4fc19245cfe552b6f39069c63461df463abf4bc9779a64e77` | −5+3=−2，整数有向跳跃。建议中央准入这一道。 |
| `fractionfour:9` | `mt_gNUE4B3vuk` | `49b314335636b93f32cef04cf51fe6cc6638dee6f2466e71a79f61e95b51d7e0` | −2−(−5)=3，参考变化 0→−5，实际变化 +5。当前记录证据不足。 |

`fractionfour:8/9` 虽在分数课次里，运行时使用的都是整数数轴题。三道减负数题分别用原控件做了「先留参考变化再跳」与「先跳再留参考变化」。原判题都接受，两种顺序得到逐值相同的最终模型。记录只有主路径的跳跃增量和最终 `refSaved`，所以三道标为 `insufficient-evidence`。

## 建议只实现 fractionfour:8

- 限定原生位置、来源、完整原题和最新 Check。头尾分别是 −5 和 −2，保存的成功跳跃为整数；以精确整数逐段重建，逐段检查数轴 −10 到 10，净变化必须为 +3。零参照填项仍按原题，预测值允许与正确结果不同。
- 原控件实测先保留猜想 0，向右跳 3，原 Check 先提交 −1 再订正为 −2。两次提交均保留，刷新后整个当前题记录逐值一致。另一组先向左跳 1、撤销、再向右跳 3，原判题仍通过，保存的 `history=[-1,3]` 与 `jumps=[3]` 不同。严格回放必须拒绝这种无法重建的过程。
- 需保留缺段、错方向、越界、非整数、篡改模型和旧 Check 反例。原生 `fractionfour:9`、异源同控件、关联会话及练习必须排除。反馈可描述已保存的实际位移和终点，猜测正确性、心算策略及撤销先后均超出证据范围。

## 本地证据

- `node scripts/audit-learning-evidence.mjs` 通过。原题、来源、整数等式、原 `valid` / `inspect`、已有登记及真实关联和练习上下文由 `preaudit-source.mjs` 复核通过。
- `node --test tests/p9-directed-jump-evidence-adapter.test.mjs` 为 5 通过、1 失败。第 67 行把 `PRACTICE.signedwalk` 以原生位置 `signedwalk:0` 传入。其题目序列化与原生 :0 相同，所以命中原生绑定。按练习真实索引 `-1`、以及五个数轴关联题的真实会话 ID 调用，均被拒绝。原断言保留，中央需一并核对这条既有回归。
- `preaudit-browser.cjs` 用原控件跑 8 个场景，50 个已记录检查均通过，0 个页面错误。只预选原题位置，跳跃、参考变化、撤销、答案和 Check 均由原控件产生。保留 8 张图、原 State-v2 字节与解码状态。已直接查看 `fractionfour-8-ordered.png`。
- 证据在该工作树旁的 `evidence/`。入口为 `source-audit.log`、`reference-node.log`、`browser.log`、`chromium/results.json`，后者 SHA-256 为 `de2c8b2bf19b20f172f45cee09b1004d6edc271b832cf647e9c6c4da5f606a59`。两份预审脚本及完整原题 JSON 在同目录。正式家族测试、备份导入、停服离线、P10 与 GitHub CI 当前均为 NOT_RUN。

## 请中央确认的范围

来源只锁 `fractionfour:8`（`mt_gNUE4B3vuk` 与上表题目哈希）。本地实现拟新增下列三个专属文件，现有 B09/B17 模型和中央共享文件均作为只读依赖。

- `dist/learning/p117-fractionfour-directed-jump-evidence.js`
- `tests/p9-p117-fractionfour-directed-jump.test.mjs`
- `tests/p9-p117-fractionfour-directed-jump-browser.cjs`

A 线 P001 目前申请的是 `gridarea:2`（`mt_6xNmQLzuqm`）。两项的当前申请来源和拟开发模块不同。正式实现待中央 #341 确认准入与文件锁。
