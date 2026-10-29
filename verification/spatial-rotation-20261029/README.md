# 拖动旋转 v52 技术检查

关系全图默认左键拖动旋转，Shift 拖动、右键拖动或选择“平移”可以移动画面；原有空间仍默认左键拖动平移。顶视图可向上或向下拖动离开顶视，拖动环绕固定观察中心，旋转后显示自由视角。坐标版本仍为 v49。

使用项目根目录的 `node scripts/verify_spatial_rotation.cjs`，分别指定 `rotation`、`exploration`、`global`、`camera`、`classic`，在隔离浏览器运行。Playwright 与浏览器可通过 `MATH_PLAYWRIGHT_MODULE` 和 `MATH_BROWSER_EXECUTABLE` 指定。原先的 v51 检查和截图保留在原目录。

专项 23 项、连续探索 38 项、全图 57 项、相机 6 项、原空间 39 项浏览器检查及 1,036 项单元测试通过。规划、阶段 2–5 和关系清单生成器检查通过。技术验证不代表孩子或首次使用者已经试用，也不能证明触控板交互自然。
