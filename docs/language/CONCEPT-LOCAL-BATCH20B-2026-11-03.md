# 本地第二组 20 节点解释

2026-11-03。逐项对照 `dist/data/math.json` 的描述、evidence、assessmentPrompt、来源年龄和真实关系，并核对 `vendor/os-taxonomy/data/teaching-research.json` 与 `docs/phase5/coverage.json` 的对应记录。原始研究可能由模型生成；研究标记不代表独立教研通过，年龄不决定路线。

| 来源 ID 与名称 | 来源目标 | 现有活动 |
| --- | --- | --- |
| `mt_I5j1ZWo2cn` 整十数的口算 | Add and subtract a two-digit number and tens mentally and using concrete/pictorial representations | `learn.html#tensmove` |
| `mt_Zx1xZM-RbX` 三个小整数相加 | Add three one-digit numbers using strategies including looking for pairs that make 10 | `learn.html#tripleadd` |
| `mt_s2mfRBoTal` 数的分与合 | Recall number bonds (addition and related subtraction facts) within 20 | `learn.html#bonds20` |
| `mt_UTnDKQkVX5` 长方形中的行与列 | Partition a rectangle into rows and columns of same-size squares and count to find the total number of them | `learn.html#rows` |
| `mt_EmR5n58jZt` 多步乘除问题 | Solve problems involving multiplication and division, including scaling problems and correspondence problems where n objects are connected to m objects | `learn.html#scaleandpair` |
| `mt_U0waNfD8PB` 比较数并排序 | Compare and order two-digit numbers using the symbols >, =, and <, based on place value understanding | `learn.html#compare100` |
| `mt_kJGCjnuelW` 用数位理解运算 | Use place value understanding and number facts to solve problems | `learn.html#twoproblems` |
| `mt_cFltwUQi-d` 一个数量的几分之几 | Recognise, find, name, and write fractions 1/3, 1/4, 2/4, and 3/4 of a length, shape, set of objects, or quantity | `learn.html#amounts` |
| `mt_xACS3rWWDp` 图形的二分之一与四分之一 | Partition circles and rectangles into two and four equal shares and describe them using the words halves, fourths, and quarters | `learn.html#shapeparts` |
| `mt_MyGblah2yY` 理解分数 | Write simple fractions (e.g. 1/2 of 6 = 3) and recognise the equivalence of 2/4 and 1/2 | `learn.html#setfractions` |
| `mt_yGv8doDAmp` 立体图形 | Analyse and compare 2-D and 3-D shapes using informal language to describe sides, vertices, and other attributes | `learn.html#flatcorners` |
| `mt_2VR963szuk` 搭建与画出图形 | Model shapes by building from components (e.g. sticks and clay balls) and by drawing | `learn.html#shapeframe` |
| `mt_XjwUlmxdCT` 组合简单图形 | Compose simple shapes to form larger shapes (e.g. two triangles make a rectangle) | `learn.html#shapepieces` |
| `mt_zkFbMLpu3U` 比较容积 | Compare and describe capacity and volume using language such as full, empty, more than, less than, half full | `learn.html#comparecap` |
| `mt_NtJYlJdUe9` 物体有哪些可测量的量 | Describe and identify measurable attributes of objects such as length, height, weight, and capacity; use comparative language (longer, shorter, heavier, lighter, more, less) | `learn.html#attributes` |
| `mt_-vvVxpOHG2` 按时间给事件排序 | Sequence events in chronological order using language such as before, after, next, first, today, yesterday, tomorrow, morning, afternoon, evening | `learn.html#eventorder` |
| `mt_M5PPDJStGm` 顺序数到100 | Rote count forwards and backwards from 0 to 100, beginning from 0, 1, or any given number, by ones | `learn.html#countline` |
| `mt_aHAM29nidj` 顺着数与倒着数 | Count forwards and backwards in steps of 3 from 0 | `learn.html#skipthree` |
| `mt_OkSJfrmFb_` 顺着数与倒着数 | Count forwards and backwards in tens from any number (not just multiples of 10) | `learn.html#anytens` |
| `mt_M2v1A9OEuM` 1000以内的数数 | Count within 1000, including skip-counting by 5s, 10s, and 100s | `learn.html#withinthousand` |

注意：`mt_I5j1ZWo2cn` 和 `mt_OkSJfrmFb_` 的说明均保留跨百位变化，不把“只有十位改变”当作无条件规律。`mt_zkFbMLpu3U` 区分容量与当前水量。`mt_yGv8doDAmp` 来源名称侧重立体，但来源目标包含平面与立体的比较，解释覆盖两者。

屏幕活动不自动评估实体操作、口头表达、心算方式、手写或全部案例。AI 初核不等于独立数学教研；用户视觉验收及儿童理解和迁移测试尚未完成。

## 技术检查

知识点、覆盖与台账专项测试 33/33 通过；增加本批边界回归后，PR 活跃 Node 检查 70/70 通过。隔离 Chromium 检查 20 个节点、两种桌面视口，共 40 个场景通过；展开截图与结果在 `verification/concept-local-batch20b-20261103/`。截图自动检查和抽看不等于用户视觉验收。

全量 Node 检查为 1117/1125；8 个失败项目与未修改基线复跑一致。phase2–5 覆盖生成器检查通过，内容规划生成器仍报告基线已有的过期文件；本次提交的完整 GitHub CI 未运行。
