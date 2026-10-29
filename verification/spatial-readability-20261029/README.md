# v50 地图可读性验证

范围：地图取景、渐进标签、选中关系及桌面遮挡；保持 networkVersion 49 的全局坐标与既有活动行为。

`snapshots/spatial-v49-before-readability-20261029/` 保留修改前的应用与文档。`before-positions.json` 与 `after-positions.json` 是实际浏览器导出的全部对象位置，`comparison.json` 记录逐项对照及同窗口画面几何测量。

运行本地服务后，在项目根目录用已安装的 Playwright 和 Chromium 执行：

```sh
node scripts/verify_spatial_readability.cjs readability
node scripts/verify_spatial_readability.cjs global
node scripts/verify_spatial_readability.cjs camera
node scripts/verify_spatial_readability.cjs regressions
```

如运行时不在默认模块路径中，可用 `MATH_PLAYWRIGHT_MODULE` 指定 Playwright 模块目录，以 `MATH_BROWSER_EXECUTABLE` 指定 Chromium 可执行文件。运行器创建独立浏览器及上下文，禁止指向用户 profile。服务固定为 `127.0.0.1:43827`。

本次通过 1031 项单元检查、191 项浏览器检查、5 项生成器检查。`coverage-checks.json` 保留生成器输出；阶段一的三个活动计数是冻结的历史规划，不是当前 587 节点的交付数量。`planning-fingerprints.json` 确认只更新缓存版本涉及的入口指纹。

截图 `after-*-*.png` 为三种桌面尺寸的实际画面。`zoom-groups.png` 和 `zoom-nodes.png` 对应通过实际缩放按钮进入的分组与节点尺度。旧图及改前数据保留，以便比较。没有儿童试学或用户验收结论。
