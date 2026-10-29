# v51 连续探索验证

界面缓存为 v51，源坐标版本仍为 v49。`tests/spatial-exploration.test.mjs` 检查源边全量绑定、重名唯一、分支与交叉边、最短跳数和问题备份字段；`tests/spatial-exploration-browser.js` 在隔离浏览器中检查实际鼠标和键盘预览、全部关系、返回与刷新、真实下载和重复导入、离线及最大网络。

在项目根目录启动本地服务后，使用 `node scripts/verify_spatial_exploration.cjs` 加 `exploration`、`global`、`camera`、`regressions` 参数执行。若 Playwright 和 Chromium 不在默认路径，可分别通过 `MATH_PLAYWRIGHT_MODULE` 和 `MATH_BROWSER_EXECUTABLE` 指定。运行器新建隔离上下文，不访问用户浏览器存储。

`docs/spatial-exploration/relation-review.json` 记录全部源边、源理由、双端目标、显示名称和中文说明；`node scripts/build_spatial_exploration_inventory.mjs --check` 对照当前运行时与来源。1,223 条说明已做本地对照，尚未经过独立数学审阅。此前自动检查发现问题而留下的 `failure.png` 保留作诊断，不是最终结果。

本次 1036 项单元检查、175 项浏览器检查、5 项规划与覆盖生成器检查及 1 项关系清单检查通过。技术结果不代表首次使用者测试、孩子试学或用户验收；拖动手势未调整。
