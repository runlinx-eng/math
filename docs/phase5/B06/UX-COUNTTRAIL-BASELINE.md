# B06 计数机制首批实机基线（#378）

以正式 main e3ba7d6f 为原生题基线；不把尚未合并的 #396 学习壳候选混入题目修复。源节点 mt_dmNvjroCPT 的第三项 evidence 是 counting in a different order gives the same total；同节第一题才是 rearranging objects does not change the count。原题 lastcount[1] 要求换起点；目前的配置同时启用 rearrange 和 recount，界面先要求预测、打散位置，原判题仅要求两次顺序不同（不强制起点不同）。以上为源码观察，待真实 Chromium 证实。

本 PR 只补诊断测试：全 B06 23 节点、76 原生任务的初始化控件/字段/题干/来源清单，练习和真实关联单列；真实控件从空白完成 countonce[0/1]、lastcount[0/1/2]、link-lastcount-manyfaces[0] 并记录重新加载、正确/错误检查、Next。特别记录原第一次数数后无预测时不能推进、实际珠子位置变化、同序拒绝、同起点不同次序接受。日志与截图是对现状的复现，不是 UX 合格声明。没有更改产品、数学模型、任务注册、原判断、历史证据或学习壳。

便携命令（本地先启动 dist 服务）：

    python3 scripts/server.py --port 43827
    node tests/b06-counttrail-browser.cjs

可通过 MATH_B06_BASE 使用其他本地服务端口；采用仓库标准 newDesktopContext 1920×1080，输出 verification/b06-counttrail/。现行定向 CI 自动选中新 -browser.cjs；新增成功后证据上传，不放宽原 gate、不重跑已冻结数学原始证据。

待真实基线结果再决定最小修复：明确区分换位置与换起点/次序；不自动填写正确预测或原因；保留原任务/判题和记录兼容。若需要改变原数学合同，另列产品裁决。当前仅初始盘点，不宣称76题实测。
