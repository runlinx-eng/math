# B32 教学依据与边界

固定上游提交 `a8719737ff86ef7940ba5feca11940de1204103e`。19 个主题中 15 个有上游研究、4 个缺记录；逐主题目标、原研究和邻接关系见 [source-review.json](source-review.json)。研究记录是建议，不是本地效果证据。路线是导航，不按年级或教材锁定。

## 时间的份数与事件

半场指比赛时间的中点；半小时是 30 分钟，一刻钟是 15 分钟，16 分钟等分成 8 份每份是 2 分钟。先将同一时间段等分、选择一份，再核对长度；不同事件的“半”以各自整个时长为单位。固定时长和屏幕选择不评估现实运动赛事或自由口述。[Math Learning Center 的钟面分数材料](https://www.mathlearningcenter.org/sites/default/files/pdfs/B4PB-B_0410w.pdf)将整小时分数与分钟数对应；这里的事件示例和互动为本地改编。

## 一刻过与差一刻

通过同步转动的两根指针看一圈 60 分钟：走过四分之一圈为 15 分，差一刻到下一小时为 45 分。时针随分针连续移动，不能固定在整数。换初始时刻后再试；操作可核对有限时刻，独立手绘和一般理解未评。[Illustrative Mathematics 钟面任务](https://tasks.illustrativemathematics.org/content-standards/1/MD/B/tasks/992)及[四分之一与半小时课例](https://cms-assets.illustrativemathematics.org/bxvv0jf7qkbq1s8egnmhd32ufwhy)提供钟面、分数及两针关系的教学例子，并不证明本实现有效。

## 罗马数字和十二／二十四小时

钟面数字 I–XII 只换写法，不改变分针位置；IV 与 IIII 都可能表示四。00:00 是某日开始，12:00 是正午；下午 1–11 点可对应 13–23 点，12 点的小时要单独处理。使用 00:20 与 12:20 等不在正午或午夜瞬间的例子来区分上下午；正午与午夜本身用文字或 24 小时制，避免 12 a.m./p.m. 的歧义。[NIST 时刻说明](https://www.nist.gov/pml/time-and-frequency-division/times-day-faqs)指出正午和午夜用 a.m./p.m. 可能含糊。固定表盘和转换不能自动评估自由说明。

## 日历

日历采用公历，每周七天，月份有 28、29、30 或 31 天；闰年能被 4 整除，整百年还需能被 400 整除。2000 是闰年，1900 和 2100 不是。比较日期间隔时从起始日期走到结束日期，不把起始日额外算一天；如题目需要首尾都计，应另说。日期通过确定的公历规则计算，不取用户的真实个人日程。[NASA 公历说明](https://eclipse.gsfc.nasa.gov/SEhelp/calendars.html)和 [NIST 闰年说明](https://www.nist.gov/pml/time-and-frequency-division/popular-links/time-frequency-z/time-and-frequency-z-l)说明月份与百年例外；[Illustrative Mathematics 日历活动](https://tasks.illustrativemathematics.org/content-standards/tasks/678)给出从日历日期计数的例子。

测量时长、事件和计时器是可重放模拟；不声称孩子完成了真实计时。跨小时必须按 60 进位，换算年、周和月时不能假设一个月恒等于四周。文字解释只保存，不自动判定理解。
