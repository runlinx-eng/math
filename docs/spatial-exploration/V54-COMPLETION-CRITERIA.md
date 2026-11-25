# v54 最终完成标准（2026-11-24，PR #382）
以固定参考 [HTML](https://github.com/runlinx-eng/math/blob/3f62d9c627d8b315d9413a3b3aeeba424b1c2636/docs/spatial-exploration/cylinder-layout-visual-reference.html) 与 [说明](https://github.com/runlinx-eng/math/blob/3f62d9c627d8b315d9413a3b3aeeba424b1c2636/docs/spatial-exploration/SPATIAL-COORDINATE-VISUAL-REFERENCE.md) 的实际交互为目标；真实源关系、数学任务与学习记录为底线。按体验与结构而非模拟图谱像素一致验收。全部达到才结项；不无限精修。

## A 线：星盘
- A1 视觉：圆柱轮廓、底部收拢和高层舒展、居中完整取景、五主题颜色/走廊、独立 50 思维轴核、真实主副干、精细星点、静默背景边、按需无大量重叠标签、轻量工具。标准横屏及用户实际高窄 Mac 窗口验收。
- A2 操作：直接拖动旋转、滚轮缩放；主题纯筛选，再点取消；学段与主题可组合，未命中原位降暗；悬停直接源关系，点击锁定完整 hard 上游与直接源联系，soft 不提升为多跳前置；再点或点空白解除；区别前置/后继/思维联系并体现真实方向；回到起点导航、主动重置视角、真实学习入口。普通选择和筛选不移动镜头/坐标。
- A3 开关：主副干、思维轴、跨主题背景边、参考环、缓慢公转可独立控制；尊重减少动态效果。入口为导航设施，不是新增数学节点或关系。
- A4 数据：537 领域（274/76/88/34/65）、50 思维、1223 真实关系，无增删改归属、无伪造学习足迹，坐标与学习进度解耦。

## B 线：从 main 独立开发
- B1 三层固定壳：顶栏知识点/学段/题序/留到下次/退出/四拍；中间问题+真实教具为主要滚动区；底部唯一当前主操作固定可见，更多抽屉收纳历史/可选提示/前置。删重复包装，不删原题能力。
- B2 四拍是界面映射，不增加强制教学步骤；真实检查、修改后旧反馈失效、按原合同记录发现和接续。
- B3 学习前景时地图暗化轻模糊；点地图恢复清晰，当前题目/教具/草稿/检查/会话不重载；点回面板恢复，留到下次与关闭再进真实持久化，真实证据更新足迹。
- B4 不改题库、判分、教学合同、存储 schema、既有 P7/P8/P9/P10/P11 功能。无需逐题重复开发或数学审计。

## 联合验收（A/B 集成后）
1. 全景拖动、缩放、主题与学段组合及解除。
2. 悬停直接联系、点击锁定上游、取消与切换、导航起点。
3. 真实题进入工作台、操作、检查、修改、重新检查。
4. 查前置再回原题，未提交作品及真实学习记录不丢失。
5. 留到下次、关闭、刷新恢复；完成后回地图并正确更新足迹。
6. v53/v54 切换、旧记录、离线及版本升级。
真实浏览器操作和对照截图、Mac 实机体验、代表性真实教具与现有必要门禁均须通过。无需额外独立人工审批；不重复有效数学证据。影响功能、数学、保存的缺陷必须修复。未完成项明确留存。未经授权不合并 main、不设为默认、不部署 VPS。

## 起始状态
preview5 专项通过，Required Checks 的历史 P006 附件读取 HTTP 503 失败；不放宽门禁，也不重跑原始数学测试。A 线本批推进 A2 的纯筛选、锁定与方向色，A3/起点/最终交互验证尚未完成。B 未启动。

## 交互第二批（preview7 候选）
preview6 全部七项 CI 通过，历史附件读取已恢复。本批实现紧凑检查卡（原详情折叠）、真实 hard 边方向流光、五项独立观察开关、五个真实入口的导航及主动重置。思维开关不删除节点，只弱化背景思维星点与隐藏轴装饰/背景边，保留学习记录及选中关系；公转每次进入默认关闭。真实浏览器、减少动态效果、Mac 高窄窗口体验尚待新 HEAD 验收，不宣称 A 线已结项。

## 节点预览收尾（preview8 候选）
普通探索悬停和锁定共用真实关系摘要：关键直接前置/后继、关联思维（思维节点显示关联领域概念）各显示总数与最多三个名称；辅助关系单独注明，不扩展为 hard 链。锁定显示完整 hard 上游唯一节点总数（不含自身、后继与仅辅助关联）。保留原详情折叠和唯一学习入口，不默认增加 Y/θ/R 等技术数据。以现有标准 Chromium 专项核对真实源 ID、名称、计数与卡片边界；Mac 实机体验仍待核验。

## 悬停名称对比度修复（preview9 候选）
preview8 固定提交 `0c19b9b6828d708e0bfa48ebd803a2c96ef0d8f2` 的七项 CI 均成功；专项 45418702395 的原始 ZIP（14933372238）已核对大小 9188853、SHA-256 和全 CRC，1920×1080 原始截图发现旧 P11 浅色悬停背景与 v54 浅色文字冲突。仅将旧浅色悬停规则排除 v54（保留旧版选择器优先级），让 v54 深色标签规则生效。专项增加真实 DOM 计算颜色的悬停/锁定名称对比度 ≥4.5:1 检查。版本与离线入口同步，不改数学、坐标或学习逻辑。新 HEAD 门禁和 Mac 实际高窄窗口仍待验，不合并、不部署。

## 星点优先与高窄窗构图（preview10 候选）
用户实机对照指出：矩形标签偏离真实节点，多个等权框使主次与位置难辨。普通 v54 探索改为真实星点/思维菱形定位，悬停或锁定的唯一主点使用原场景光环；文字为邻接透明标签，碰撞时省略低优先级标签，不以远置矩形替代空间点。保留文字点击、键盘焦点和真实右下关系卡，锁定优先于临时悬停；学习态及 v53/导览仍按原合同。Mac 尺寸高窄窗口恢复紧凑左观察栏，默认主动取景增加俯视倾角以看清层次；不改变节点世界坐标、源边、数学学习数据或保存结构。专项增加点标签几何、实际文字/描边对比、唯一光环位置与 1000×1200 同上下文截图检查；用户实机点击/筛选及参考形态仍须复验，不能把自动测试当成最终验收。

## 收拢底部与真实入口导航（preview11 候选）
保留 preview10 星点优先标注与高窄窗策略。统一领域径向包络：低层下限/上限 80/120，随实际 Y 以 0.15/0.26 增长；思维轴、扇区、源边、前置高度间隔、节点碰撞阈值及已审主副干/桥接 ID 不变。实际源图的上/下三分位径向 P90 比由约 1.34 增至约 1.69，仍保持直立形态。各真实主副干段在原端点之间以连续切线绘制，严格 Y 单调；共用边首次确定几何，分叉仍发生在真实节点。学段环复用同一包络。底部中央「起点 · 入口导航」只是可点击导航标志，进入同一五领域真实入口菜单；无虚构统一根、无假连接线、无新增学习记录。选择节点/顶视或非普通探索时不显示，碰撞让位。空闲旧 v54 观察镜头首次重新取景，已选节点/学习态保持旧保存行为。新增实际几何、导航锚点和宽/窄真实浏览器检查；仍须验最新 HEAD CI 与 Mac 实机。

## preview11 最终专项规范修复（2026-11-25）
- preview11 固定产品提交 `9da8441805255d7ba30a747b464a309cd02f4c69` 的 [v54 Chromium 专项 45528387509](https://github.com/runlinx-eng/math/actions/runs/45528387509) success；该运行的官方 [截图与结果附件 14983981640](https://github.com/runlinx-eng/math/actions/runs/45528387509/artifacts/14983981640)（11,134,971 bytes，官方 digest `sha256:c3644afbadaa831bdfcc5ddaa1693de62d33eaa400ab4ba607bad77fae2acb17`）保留 1920×1080 及该轮 1000×1200 窄窗诊断记录。此前窄窗专项成功只作为历史诊断，不等于正式门禁通过或 Mac 人工验收；本次未独立下载核验 ZIP 内容。
- 同一 HEAD 六项工作流成功；[Required 45528387501](https://github.com/runlinx-eng/math/actions/runs/45528387501) 的 static-checks 仅因新增脚本改变视口尺寸违反已批准的 #239 政策而失败。按 [#239](https://github.com/runlinx-eng/math/issues/239) 与 `ci/desktop-browser-viewport.json`，新 Chromium 专项统一 1920×1080；不修改政策、helper、工作流门槛或历史测试。
- 本次仅移除不合规的第二种视口运行段，保留全部既有标准桌面实际功能、点位/透明标签/对比度、真实关系、起点投影/点击、筛选、离线与切版断言，并在标准浏览器测试开始和结束验证实际视口。真实窄窗的同等项目仍为 A1/A2 最终 Mac 人工验收：左侧栏紧凑、上下轮廓/起点完整、单一光环与相邻透明文字、悬停/点击锁定/再点或空白取消、组合筛选、旋转缩放、真实学习入口及返回。若失败仍修复产品，不因测试规范撤销该验收要求。
- 本次无 dist、源数据、学习状态、release 或任何数学断言修改；产品仍为 preview11。新 HEAD 必须重新通过实际适用 CI，Mac 人工体验单独确认。A 未结项，B 未启动，不合并或部署。

## A/B 隔离集成候选 preview1
A 固定 `b10e7b54a1398efff7b7c5ca670d950fb7b1957a`（#382）和 B 固定 `be0c4affec7b61db3b1e8b89614320fd87973ae4`（#383）均有七项适用 CI 通过，原始 ZIP 独立核对：A artifact 14984157415 / 9,014,936 bytes / SHA-256 3defdccc012c6f7d1c9595f2ff342cc3d88fbdb363de2be37fa405871c0e1de0 / 全 CRC 成功 / 1920×1080 专项结果 passed、errors=[]；B artifact 14999403538 / 4,323,358 bytes / SHA-256 7c05e019efec888f385cf01ad7914a96b789a7a57dd1b0262d77d7fa4b8fe936 / 全 CRC 成功 / 109 checks、0 errors。原件截图已抽查。A/B 独立候选的历史成绩不算集成 HEAD 的通过。
以 A 树为底、B 独有八个 blob 保留、共有入口按同一 main 父版本合并；space.js 除统一 release 外修改块不重叠，index.html 两处不同入口均保留；CSS/规则尾部保留双方追加内容。SW 清单为原 639 资源加 A 3、B 1，共 643；五处 release 统一 `math-explorer-20261125-cylinder-workbench-ab-preview1`，learn.js 保留 B 非 release 全部内容，入口与八个原导航 SHA-256 同步 `bcc3f367be3af36191977c540e7d2f0ad86221b6e988bc423ee311ba3163ad45`。没有改动数学任务、判题、模型、状态 schema、原始图谱或原 A/B 独立分支；v53 默认不变。保留 A/B 原专项，A 新增真实 v54 知识入口→错检→修改→原来源前置选择→同文档恢复→暂停→离线刷新→原重检/Next→足迹→v53 同记录→v54 坐标不变的联合路线。仅是候选，新增 Chromium 和最终 HEAD 适用 CI 待运行；本地 GitHub DNS 不可用，无法完整 checkout/执行 preflight。Mac 高窄窗体验、正式发布仍须独立验收，不合并 main、不设默认、不部署。

## A/B preview1 实际联合结果与 preview2 视觉修复候选
联合固定 `c8b91fc3ae852229dcb9a9e37a4e8d3dab0b4712` 的八项适用 CI 全部 success。A/AB 专项 45568313453 官方原件 15001600971（11,505,879 bytes / SHA-256 f4d3af078a423fdddac8a0a86d4bb5b02fb41c83407deb265570bf436fe37454），B 专项 45568313581 官方原件 15001730449（4,323,069 bytes / SHA-256 c12b764239cb108af58dbdb55ed9ab1ef9f2dccaeb67257c5714e0a49703e2a4）；独立下载核对大小、SHA-256、全 ZIP CRC；A/AB passed=true、errors=[]，B 109 checks、0 errors。真实联合路线确认原等值分数两次提交、实际前置 mt_FbDKeLfBCo、第二题题序、离线暂停恢复、v53 同记录、源坐标不变。六张原始 1920×1080 图抽查。Required 定向检查成功，不声称重跑全量94路线。
原图显示 v54 深色调色规则也染黑了白色学习面内部的真实关系摘要，使邻居名称浅字落在浅底；同时原前景弱化在深色星盘上过于轻微。preview2 仅在 v54 内嵌学习的同一 DOM 上恢复浅色摘要及文字对比；学习前景时 canvas brightness .64 / blur .8px、标签 opacity .62、可见地图详情 opacity .76，地图前景仍恢复原清晰与可点击状态；不改变相机、布局、题库、判题、记录、选择器命中和 iframe 生命周期。保留全部原联合断言，新增真实计算颜色（>=4.5:1）、两种前景、返回和离线恢复检查，增两张原图。五处离线版本统一 preview2、入口与八导航 hash 同步、643资源清单不变。新 HEAD 待 CI 与原图复验；Mac 实机、最终体验未验。当前未执行本地完整 checkout/preflight，不合并 main、不设默认、不部署。

## preview2 视觉专项验证方法修复
固定 `72adb6da253ac8114159eb58dfcc4abc5d8ad308` 的 8 项适用 CI 中 7 项成功，A/AB 45570913253 失败于 foregroundStyles 颜色解析（实际浏览器返回 rgb(69, 107, 87)，脚本正则多转义反斜线），未进入对比度判断；另外两条 filter 正则存在相同转义问题。官方失败附件 15002665000 / 9,813,073 bytes / SHA256 f51c1edd627ea6db76151170ba80746b4bbd1e5e0f5ea113e16659088dfb390d / 全 CRC 成功，原始 1920×1080 失败截图确见右侧浅色关系摘要深字及地图弱化，不能据此代替实测 4.5:1。A 已执行至星盘、锁定、开关、导航、离线、版本切换并成功，新增联合路线中途失败。B artifact 15002201417 / 4,323,222 bytes / SHA256 a64209fc4bd05085e3dc9eb3c990374ec07152e0f13127097980d42f2775947f / 全 CRC 成功，109 checks、0 errors。
本次只改 A/AB 测试三行：数字字符集改为 [0-9.]，两条滤镜断言改为检查浏览器序列化后的真实 token；原 opacity、背景、WCAG 对比阈值、题目及离线操作断言全部保留。dist 完全不变，仍为 preview2，无须重复生成 release 或导航指纹。当前新 HEAD 适用 CI 和原件待核验；未执行本地完整 checkout、Mac 实机，未合并 main、不设默认、不部署。

## Mac 实机截图第一批修正（preview3 候选）
preview2 `010e38eb4da9106abfd5dd1bf2ab70b67d40e8c0` 8/8 适用 CI 成功，A/AB 与 B 原件校验及最低关系摘要对比度 5.77148:1 见 #384 交接；用户随后提供高窄 Mac 窗口 HD「把一个数放进关系」第 1/3 题截图。截图验证本机界面已打开，不等同实际暂停、选择或保存验收。两个可确认问题：三处「留到下次」含不同语义；原 B36 pressed 白字被 learn.css 通用 #extra-controls 浅底覆盖。保持外层真正暂停的「留到下次」，原内层与全局问题入口改为「记下问题」，原同一 composer 提交为「保存问题」，不删入口/不改事件及保存。仅覆盖 B36 f36-case 真选中按钮的颜色/边框（深绿 #315f55 白字），不触及其他数学教具或原 aria-pressed/模型。原题不改。B 专项追加真实 v54 substitute36：初始/切换选项实测对比度>=4.5:1、两原问题入口、取消不新增、实际保存原问题与原生场景、留到下次后刷新恢复 x=-2 / 未提交16；保留所有旧检查，使用原 #239 横屏视口。高窄 Mac 交互、布局和标签问题仍待实机核验，不凭单张图推断命中或改镜头。新 HEAD 待适用 CI 与原件；不合并、不部署。

## preview3 失败归因与 preview4 修复候选
固定 `d948829402805a78a6c17b708668050317d99d49` 七项 workflow 成功，B 45576764899 失败；官方原件 15004358588（6,036,592 bytes，SHA-256 8a157ca85753ce82cf251b36f3ce1142f90f0c6136e89e89a8c0666189253190，16 成员全 CRC）已核对，errors=[]。原 B1-B3 全部路线及新 B36 颜色、两问题入口、取消与实际保存原场景的断言成功，最后原 pause/reload awaitSession 超时；失败截图为真实 v54 总览。代码核对发现 boot 的 showQuestionEntry 先于 stored.journeyOpen 恢复，刚保存的 due question 同日覆盖暂停现场。preview4 仅让已验证视图中同日暂停、有效 native session 与 daily.continuation 的 session / questionId 一致时保留原现场；已有不同 route、全貌、跨日待续、真正关闭后的问题优先级仍不变。原失败断言完全保留，额外核对 v54 保存视图、问题原记录、刷新后原问题仍可见、明确关闭后原待续问题入口及真实恢复。只改启动决策，不改存储/判题/题库。新版本真实 Chromium 与适用 CI 待验；Mac、跨日行为实际浏览器专项仍待另验；未合并、未部署。

## preview4 云端联合验收固定检查点与边界候选
固定 `ce744bf75b9bac9faa9b0c685cd37725c00dc306` 的 8/8 适用 CI 全部成功。B 45582152532 官方原件 15007700422（6,743,192 bytes / SHA-256 e3a2462fc7250382a3f71e1da1e34a1a96ded0cf60fe3d930e6f718cc7184cbf / 17 成员全 CRC）117 checks、0 errors；A/AB 45582152585 官方原件 15007525314（13,083,616 bytes / SHA-256 f46b51506af36ebee6135c63721e56566e88b9bfc94eb71a9cc1d4a19766833b / 19 成员全 CRC）passed、errors=[]。B36 选中白字深绿实测 7.244745:1，未选中 10.640245:1；真实 v54 记录问题、暂停/同日刷新恢复 x=-2 / 未提交16、保留独立问题、关闭后真正恢复问题全部通过。抽查三张原始 B36 截图；A/AB 最低关系摘要对比 5.77148:1、星点名称描边 18.23871:1、原离线及跨版本同记录不变。此 SHA 是可供 Mac 复验的已通过检查点，非完整94路线或高窄窗实机签收。
仅追加测试及本说明：真实暂停状态下，同日显式不同知识/全貌不能被旧现场覆盖；另以 Playwright 固定浏览器时钟推进48小时（跨本地日，不更改已保存记录或应用时钟实现），核对原待续问题优先级、显式回到问题及原未提交值与历史事件。保持1920×1080 #239，保留全部117项旧检查，无产品代码、release、存储、题库、判题或默认版本变更；新提交尚待真实 Chromium。Mac高窄窗验收仍需用户实际操作，不再凭单截图调镜头或强拉教具；未完成本地完整预检，不合并、不部署。

## 合并前完整回归失败与共用入口修复候选 preview5
用户从 Mac 手动 dispatch 的正式云端运行 45595924867、HEAD `8bf12186bd0e7c9fbc28cc1e3ad26ad8c168bf74` 已完成 failure。实际 26 个 browser 组，12 success / 14 failure，plan/static/smoke 通过；此前日常定向与 A/B 专项仍是原固定提交的历史通过。失败组：ui、evidence-area、p8-performance、evidence-expansion-2、evidence-fractioncase、family-wave-1-job-04、evidence-expansion、family-wave-1-job-07、p10-learning、p9-multable、family-wave-1-job-10、family-wave-2-job-01、family-wave-1-job-09、family-wave-2-job-02。14 组原日志已读取，P10 离线及 backup-safety 44 项、full-lessons 145 项通过；不归咎 runner 或降低门禁。
源码确认 main 已存在 #341 懒加载完成后整块 render() 的控件替换风险：真实失败含多组 locator.scrollIntoViewIfNeeded DOM detach，部分真实操作结果断言失败。此候选只将已批准 session 的原 949/284 路由 Promise 结算移入首次交互 render 前，取消后台整块重绘，仍只在适用 session 加载、保留串行 openLesson 检查与原 fail-closed catch。无数学、源数据、名单、状态或教具合同变更；可能增加首开模块等待，需要新实测。B 专项新增真实 substitute36 延迟/失败注入两条独立空 context 路线，校验无提前写入、正式提示边界与真实未提交作品，原121项不删。五处 release 与 8 导航入口 pin 同步为 preview5 / 993f08d91c4340173085b7d701af669a0a667e1bf6103ce7a1d23e158556c0dc，643 资源不变。
另外，原 area/time 排除断言对应的 polyperim:0 / quarterclock:1 在当前正式 manifest 分别属于 area-edge / clock-setting，属于跨家族旧边界需核对；不能简单去掉反馈或删除断言。ui 旧动态高度/紧凑悬浮 dock 测试与 B 新固定舞台冲突，须以真实不遮挡与旧行为保留的等效约束分别处理。其余提示计数/真实数学操作失败尚未归因完；待官方原件复核和本次定向 CI 后继续。不宣称完整回归修复、未做本地完整预检、未合并、不部署。

## preview5 专项原件及旧布局兼容候选
preview5 `09af7f55dbe13caacbaf7c78f6ae51f6add847c6` 的 A/AB 45614235916 与 B 45614235771 成功；B 官方 artifact 15021947406（9,342,342 bytes，SHA-256 16bf298194ef6419abdbdb3613c1ac39966e9afab47c8606ea4c2861fd834f56，20成员全 CRC）实际下载核对，123 checks、errors=[]、passed=true，新增两条延迟/失败注入成功；尚有 Required/ordinal recovery 未结束，不宣称该 HEAD 8/8。
完整回归三份旧失败原件已下载核对 SHA256、size、CRC：area 15013013410（2448532 bytes，120成员，fda3ea00c7cb5fe4a3e977affe34c8c0e3fa343fd6da0e690c16b9a4348c3b29），multable 15014416715（234572 bytes，34成员，d98da09cb43a7bc1336a2ed1e68fd4e64f38f313a7c8a3faa2310d3e3bd963b7），money 15014765294（5909880 bytes，297成员，bb16f1b0c4428eac3572c74dff108bdacdf4d8e1d6f34d179e3b5bd5ac45fc04）。原 area polyperim:0 已正确提交四条真实外边 26cm，DOM 为 area-edge 的已批准说明；money auscoins:0 原正确前置作品，DOM 为后续正式 #341 有界说明；multable 两个旧视口均在 writtenstart:0 真教具操作途中 detach，原诊断 storage 不变、缓存 643/643。尚不能宣称全部其他家族通过。
本候选只修改两条原 ui 失败脚本及现行高度规则，保留旧视口/原路线/镜头/实际 pinch/历史/关闭/可达性断言：固定壳不再要求旧内容测高和悬浮 dock 宽度<85%，改为实际视口内高度、上下行不重叠、主操作和外层返回命中、真实增高后数学舞台增长；短子页保留原文档滚动及紧凑宽度约束。专项 B workflow 追加这两条已有脚本及原产物路径，既有 Required、完整分组及视口政策不改。dist、release、数学、记录、证据名单、全部旧 P9 数学断言均不变，候选待真实浏览器。其余家族旧反馈边界需独立按正式源位置和原 proof 合同核对，不以隐藏或删除已批准反馈求绿。

## preview5 定向结论与异步课程衔接兼容
`09af7f55dbe13caacbaf7c78f6ae51f6add847c6` 的最终8项适用workflow为7 success / 1 failure，ordinal90 recovery 45614236093 成功，Required 45614235800 中 plan/static/smoke 及另6个定向脚本成功，唯一失败的定向入口 tests/p7-learning-panel-browser.cjs 在真实小数整理发现后点击 quarters、立即读取仍处于旧课的标题（line 351，原 job 139205578283，已读日志）。Required 收据门禁相应失败，未宣称整套通过。源码确认 openLesson 本身原为异步，preview5 增加正式路由等待后旧瞬时读取不再可靠。现候选在 quarters 与其后真实 bridge 两处先等 child mathLesson 的精确 session id 和实际已映射课程标识，再验证原标题、真实题序、原记录和相机；新增 quarters 无伪造提交断言，不增加固定延时、不删除原数学断言，不改变任何产品代码。之前布局候选 `8e2076b3b29c1aad936c881d7c7a84df8de03187` 的5路径保留，另增加这一个P7脚本，原Release及8个入口pins不变。实际新HEAD浏览器结果待验，不能仅据旧断言时序确认实际衔接无误。仍需完成旧P9跨家族反馈兼容和完整回归；不合并、不部署。

## 原 area/time 反馈边界与后续正式家族兼容候选
097bfda 的 B 专项 45615898980 成功，真实 P7-D5 25 检查及 learning-workspace 31 检查/0 errors，release-sync 原8pins通过；当次读取其余 ordinal/Required 仍进行中。全量 45595924867 的14失败组日志重新定位：2旧UI断言（已专项复验），10个脚本 DOM detach（preview5针对风险修复，旧脚本仍须实际复验），原数学操作结果2项（mature array 与 fraction-order，未判定根因），angle 隐藏按钮、money/order/convert 反馈旧边界，以及 area/time 原排除项等；不同脚本不可简单用组数相加。逐行比对现行1762正式manifest和原冻结排除库存，area 26个中24个、time 40个中28个被其他正式家族覆盖；关联题均无正式位置匹配。新冻结52条精确 source id/index/hash/type/nodeId/adapter，保持原数学fixture不变。仅两条旧全量脚本的 excluded 分支按原家族 binding/replay 均 null 继续验证原排除，另外针对该固定名单单独验证正式registry唯一匹配、实际原始数学判定、最新原始提交与独立adapter replay/submitted、DOM guide和feedback原文、无提前反馈、真实离线重载后的相同proof；未覆盖位置仍强制零guide/feedback，所有原生、关联、错误/修正、数学快照、真实Next、备份等原断言和计数保持。其他家族反馈不计本家族新增覆盖，artifact excluded另记 otherFamily。当前候选未实际跑完两条长浏览器路线，不声称通过。money/order/convert/angle等另行核对。dist、release、名单、冻结数学fixture、现行Required矩阵不改，未合并、不部署。

## 后续 money/order/convert 正式来源兼容候选
097bfda 最终8/8适用workflow success，原9定向浏览器全通过，4e76845 的 area/time 候选已非强制更新PR分支并开始自身验证。再逐行核对旧冻结前置/排除库存：money 十个前置中6个有另一正式来源（含原已测试的 measuremoney:0 ruler，原专属文字断言保留）；order 七个前置中5个及三个原 expressions 排除位置已获其他正式来源；convert 六个前置中2个 measureliquid 位置获正式来源。冻结合计16条准确 manifest 记录；前三个 expressions 原fixture未直接带hash，继续由原 orderedOrderTargets 从冻结任务计算且与正式hash运行时逐项核验。其余已带hash的13条与现行名单精确匹配。只对这些明确列出的非本家族位置增加已有原始数学/最新提交/唯一绑定/adapter实际proof及DOM内容的独立审计；原家族native/negative/associated、原grader、尝试历史、真实Next、备份、数量与原 ruler 特例不变。原未批准位置仍按旧断言验；旧脚本原始检查未删。无产品改动、无新数学覆盖、无新浏览器场景或CI降级。本候选尚未执行长浏览器路线；以当前4e76845结果决定接续。angle及原数学操作、detach回归仍须核实；未合并、不部署。

## 第二轮完整回归 45625745253 进行中与剩余兼容候选
6d009ed 最终8/8及14定向成功后，用户启动正式 workflow_dispatch 45625745253，确切 HEAD 6d009ed78706326a67dfd861f7e53a344b94b75e。截至本次取样26 browser组15 success/5 failure/6进行中，plan/static/smoke通过。已通过 ui/area/p10-learning/evidence-expansion（包含原 mature阵列和fraction-order 实际数学操作）及多组旧detach路线，不能推断全部通过。已读五失败组原日志：evidence-core 中 unitwalk/groupwalk 对 wholefractions:0 旧零guide要求；evidence-place 中 integer/decimal 共用 tensmove:0 旧零guide要求；cubefraction 到 fractionvolume:3 原排除位置时 guide计数；multable 原先真实前置处 feedback计数；ratioshape 已完成原实际数学及retry，导出页加载时 export计数为0。按原冻结源和当前1762正式manifest，wholefractions:0 P059；tensmove:0 B126-p113p、general34:1 P113；cube原1排除+5前置、multable原1排除+5前置（含原division）单独保留既有反馈，共15条冻结正式源。保留所有原数学动作/原判题/快照/原家族绑定null/关联零反馈及其他负向断言，以已有 helper 严格查 exact hash、独立adapter proof、原Check/DOM全文和离线重载。原 walk/place 空位置测试的既有路线不改变，无额外正确状态注入；ratio导出先等实际原按钮可见与启用，核对离线导航不改记录，真实下载使用Promise.all，原备份/损坏拒绝/幂等重导入保留。当前候选仅6旧测试脚本+冻结名单+本记录，未执行新浏览器，未更新PR分支；当前完整回归尚在途，须收齐余下6组再确定接续，不能提前验收。无产品代码、release、正式名单、矩阵、数学、状态改动，不合并、不部署。
