# B 线学习工作台（2026-11-25）
独立基线 main `e3ba7d6fbe7db2a3df7dea39a650bf6a4f0962da`。A 线 #382 保持独立；用户已明确开始 B，A 的 Mac 人工体验仍单列未验。依据 A 线固定完成标准（b10e7b5）与真实源审计 5 节，不叠加 #379/#380 或 A 线布局代码，不改变 v53 默认。

## B1 第一批
- 实际学习工作面与地图的双前景切换：默认学习，地图真实点击/键盘/拖动获得前景；原 iframe 中真实用户焦点恢复学习。独立明确按钮在紧凑窗口可达。仅前景切换为视觉状态，不改变学习/探索模式、实际当前题、模型、草稿、历史、相机或存储；实际地图节点选择保留原访问记录。
- 顶栏显示四拍节奏；依据原 learningStage，不增加读题/猜想/发现 gate。原四区、唯一动作和已有数学教具、判断、历史全部保留。
- 新专项目标：真实等值分数错误检查→修正未检→点另一真实地图节点→恢复当前 iframe→键盘切换→实际重检正确；比对同一 document token、真实学习记录、选中节点、四拍与截图。固定 1920×1080，遵守 #239；Mac 人工体验另验。
- 本地无完整 checkout，正式 CI 与原始截图待验。此次改动 learn.js 仅新增展示态 beat 与同源当前 session 用户焦点消息；原 update/submitLesson/inspect/edit/model/lesson 导航与原生动作不改。按 release 工具要求人工审阅非 release 差异后同步入口 hash 和既有 8 个来源 fixture，不改变原 fixture 判题/历史数据。

## 尚未完成
1. B1 三层固定壳：标题/学段/题序/留到下次/退出，独立滚动的数学主舞台与不遮挡工具的固定唯一当前操作栏；原 history、可选提示、前置关系收进可达抽屉。
2. B2 原全部 gate、反例、纠正、下一题与可选发现回归。
3. B3 留到下次、关闭再进、刷新恢复、B→A 真实操作及更新足迹；窄窗实机与键盘可达性。
4. B4 最新适用 CI、原件核验、与 A 集成后的联合验收。无部署或默认布局变更。

## 入口完整性审阅
旧学习入口 SHA-256 `0fd8a863d19253084b445e1726a12703eeeec0fe6bd129ffb363c2dea5b7b9cb` 已逐字节匹配 main；本批实际 UI 展示和用户焦点消息改动后新入口 `d23abeac05734e01beac65c5c2441ef339f638b11383266be8444720c1bc4546`。同步五处 release 与原八个导航 fixture 的 learn.js 指纹。未改其数学动作、判定、数学来源或历史断言；须由原门禁及本专项重新验收。

## preview2：第一批失败归因与修复
preview1 正式 CI：5 个 workflow 通过；B 专项与 Required 未通过。Required 的 14 个 Node 失败均为共享 workspace-flow.js 的冻结来源指纹不一致；将四拍纯展示代码独立为 workbench-presentation.js，恢复主线共享文件完整原字节（SHA-256 `3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05`），保留原数学门禁与来源锁，独立测试展示映射并把新增模块登记离线清单。实际点击知识节点会按原 choose 逻辑追加 visited/openedPacks，专项改为对比整个 State-v2 仅允许所选真实节点/群的原有访问记录增加；不允许修改其他状态，返回学习与键盘切换仍要求全部原始记录逐字节不变，保留同 document token、原 grader、修正尝试等断言。
旧版 SW 导航隔离 C-verified-new-controller 中新缓存已完整 639/639，但历史 controller 仍 active，新 worker 等待超时。未改 SW 生命周期或隔离门禁，须以 preview2 完整新 CI 重验，不宣称修复。五处 release 同步为 preview2，学习入口新 SHA-256 `5b59a5b01c994dc6aae76d6f7db0cf3f363cce7359198fe10160aba295da3376`，八处既有导航 fixture 更新相同入口指纹。未改题库、原动作、判定、数学来源和学习记录结构。B1 固定三层壳、抽屉暂未叠加，先验收第一批。无本地完整 checkout，未执行本地 push-preflight/Chromium。

## preview3：B1 固定三层工作台（第一段）
preview2 `8c9dbba2894749a86880277c204d49f37e565e56` 的 7 个 PR workflow 均完成且 success：B 专项 45533531445、Required 45533531557、P8 45533531390、overview 45533531405、module fallback 45533531499、ordinal recovery 45533531537、bounded ESM fault injection 45533531473。旧导航隔离超时本轮未复现，不据此宣称根因修复。
本批仅嵌入学习 iframe 初次启动时移动原有区域至独立可滚动主舞台；原 stage-top 与唯一 execution-command 分别占固定的上下行，底栏不覆盖主舞台。原题目、教具、动作、反馈和记录容器均复用；低于 440px 高或 340px 宽的极小视口回退文档滚动，独立 learn.html 保持原布局。顶部恢复原 route.title 与现有题序，外层原退出机制不改。原历史与可选支持继续在主舞台内以既有 details 提供；后续独立辅助抽屉/固定学段标识及 B2/B3/B4 尚未完成。
原 grader、前置规则、模型、状态存储、备份格式不改。仅修订 UI 滚动复位和检查反馈定位，不改变检查/下一题 gate。专项目标增加键盘展开历史与支持、State-v2 字节保全、滚动前后上下层坐标一致、底栏不重叠和原错误修正流程。无本地完整 checkout，未执行本地 preflight/真实 Chromium；仅新 HEAD 的适用 CI 和截图可作为验收。人工审阅学习入口上述非 release 差异后，五处 release 同步为 preview3、旧 SHA-256 5b59a5b01c994dc6aae76d6f7db0cf3f363cce7359198fe10160aba295da3376 与新 SHA-256 b620f9b074f57c08d86fa049f1ebe6ae625abb612090df5e542c14be79989b26 核对并更新原八个导航 fixture 入口指纹，数学断言及共享 workspace-flow.js 不改。

## preview4：固定壳和原控制器兼容修复
preview3 `faa4b682d0596d42cce656892caaf9d2bbb43f29` 的 Required 静态 Node 10 个失败（5 个原导航 controller shared 指纹和 5 个完整原控件路线的 DOM scrollTo 调用），B 专项 45536140094 未通过首次上下层几何断言。原件 14986897548（296070 bytes，SHA-256 905ad47467185af7a28c3b9ec1e5165e30dc2b476623f47e7e6761694b019ed7）已独立验 ZIP CRC 并看失败图；图中主舞台与操作栏已出现，但原断言时没有记录精确几何，不能仅凭截图判定通过。旧内容高度反馈与新的独立滚动壳存在冲突：native network B 父面板固定高度遵循原视口安全范围，取消该固定壳自身的内容高度回报；其他嵌入及 standalone 保留原高度行为。初次真实 CSS 生效后保留并强化不重叠、footer 位于 iframe 内、独立滚动、固定上下层和 State-v2 保全断言，新增原始几何诊断及实际原 Next/滚动复位。
恢复 preview2 共享按钮 controller 完整原字节（shared SHA-256 4c2c7ede8f9effcfc581029f1d1b29913e8905dc550054f37c5f0f2a1d58d724）；update/edit/extra/input 均与 preview2 精确一致。滚动由纯展示模块根据真实 session、题序、view 和 stage 处理，不修改原 Check/Next gate、模型、存储或数学证据。学习入口非 release 修改人工逐项审阅，五处 release 同步 preview4；旧 entry SHA-256 b620f9b074f57c08d86fa049f1ebe6ae625abb612090df5e542c14be79989b26、新 dffb27615f5cead32518cebdffb45203ca5e7fc4aef44d5fe18810edb4b6cc13 已以实际字节核对，八个导航 fixture 仅入口 hash 更新，controller pins 保持原值。隔离 JS 执行展示滚动断言及专项语法检查成功，未运行本地完整 checkout/preflight 或真实产品 Chromium（GitHub DNS 不可用、无 gh）。新 HEAD 仍需适用 CI 与原件；下一批辅助抽屉未开始。

## preview5：B1 辅助抽屉接入候选
前置 `7bde83febf19bc3020bb53db6a4bd78c3680b599` 七个 workflow 均 completed/success（Required 45555367380、B 专项 45555367208、ordinal recovery 45555367236 等），#239 误判修正已验。仅 native network 固定壳将原 `learning-support`（含真实路线/关系/可选应用）与 `record` 移入单一辅助资料条，默认收起、独立滚动、原 DOM 和原 data-do 不复制；打开时暂时隔离被遮挡主舞台，原操作栏仍可点击。Esc 返回原 summary 焦点，原 Check/Next 或真实辅助按钮关闭抽屉再走原 handler；题位/视图改变和历史隐藏时恢复主舞台。极小 iframe 保留文档滚动，standalone 布局不动。反思的原数学说明仍在第四区；实际教具内可选提示和纠错反馈不搬入抽屉。本次未更改 grader、题库、原控制器、记录或备份语义。
前一轮合成 iframe 17 项通过，仅隔离候选证据。新专项将使用真实等值分数错误检查、主舞台与抽屉分别滚动、真实课程关系入口可达、键盘 Escape/焦点、单抽屉、原 State-v2 字节不变、原地图/纠错/重检/Next；旧四区直接子元素选择器兼容固定壳，未放宽四区内容顺序断言。五处 release 和原八个入口 fixture 同步；实际旧入口 SHA-256 `dffb27615f5cead32518cebdffb45203ca5e7fc4aef44d5fe18810edb4b6cc13`、新 `69949934a8171bd19172ef3746b424de3f0cb42d90ed7c346ea3e27959ab1942`。本次无完整本地 checkout/preflight 或真实产品 Chromium；最终 HEAD 适用 CI、官方截图和 Mac 人工体验另验。B1 学段标识、B2/B3/B4 仍未完；不合并、不部署。

## preview6：B1 固定知识学段与实际题序（候选）
前置 `37b0be160c69af768d8af4da9c712bd2a3513aee` 七个 workflow 全部 completed/success（Required 45558258202、B 专项 45558258168、ordinal recovery 45558258102 等）。preview5 实际抽屉专项 31 项及旧 P7 正式三杯证据兼容性已通过；人工验收仍未完成。
仅 native network 固定壳在原数学标题下补充当前实际 session 的知识学段。异步复用已登记离线的 grade-node-filter.js / grade-panorama-lite.json 节点级课程映射，显示全部小学阶段与原主要/延伸/过渡角色，明确无小学映射、初中后续、思维节点、未决、缺失/不可读；不将地图当前高亮、空间位置、题号或知识群推断成年级。关联任务明确标为目标知识学段。异步返回只更新仍匹配的当前 session/topicId，不阻塞数学入口、不写状态；其他独立及嵌入页面不变。
原 status 在 task 视图显示真实 index+1/实际 sessionTasks 数量，保留数清三项已完成文字；整理发现保留原状态、无虚构下一题序号。原四拍、题序/题库/判题、真实 Check/Next 门槛、记录 schema、地图选择和镜头均不改。Node 检查真实 537 节点映射、例外、迟到响应、缺失数据、桥接/总结与独立页；专项增加真实等值分数跨学段、State-v2 字节不变、地图另选时学习定位不变、实际 Next 题序；P7 长路线增加独立页、反思、真实下一课程及目标桥接检查。新 HEAD 实际 CI 待验，未执行完整本地 checkout/preflight 或产品 Chromium。入口旧 SHA-256 `69949934a8171bd19172ef3746b424de3f0cb42d90ed7c346ea3e27959ab1942`、新 `a5f6bad4eda41dcf7e6eefdd95d6125ca48723d555fa482017d394562fcedf34`，五处 release 与八个原导航入口指纹同步，旧学习控制器精确不变。下一批 B2/B3 原 gate、反例、保存退出恢复、真实足迹与 A/B 联合验收；不合并、不部署。

## B2：原学习门槛、纠错与可选发现（待验候选）
仅增加原 B 专项的真实内嵌 Chromium 路线，不改变产品入口、题库、模型、判题、学习记录、SW 与 CI。等值分数三题完整覆盖：原首题错误→修正→切图→重检之外，第二题错检、提示 support 与原尝试保全、历史正确后改动仍禁止 Next、再次纠错、第三题实际正确、无虚构题序的整理发现、可选数学说明、原文字保存及真实下一课程。原生 argument38 五题按真实 Next 完成，含空推理链 gate、错误链纠正、分数除法原操作及错误分析、两条不同全称命题的有效/无效反例；改值后需真实实验再检查，原 attempts 保留；不写文字仍可使用原目的地继续，不虚构解释。固定 #239 桌面上下文、原控件真实点击输入，不注入状态/题序或强制点击。
候选自身尚未执行真实 Chromium；须检查父提交全部适用 CI，再以候选最终 HEAD 执行专项及必要门禁，核验原件。不能将新增断言当成已通过数量，也不称已遍历 12 种原 gate 或全库题型。保持 Draft、不合并、不部署。
