# #341 专项 218 题候选交接

P117–P060 专项的 **218 个原生题位**分布在 **52 个独立候选**，均通过 Mac 本机 Node 22.22.0、232 项仓库预检及 Chromium 141.0.7390.37 原控件测试，合计 **1,886 项浏览器检查**。本批与前两批 335 和 126 个题位逐题去重，三批共 **679 个候选题位**。另有 **119 道缺过程记录的题位**暂缓。

- [逐题清单和可验证范围](positions.csv)
- [固定提交和文件校验值](manifest.json)
- [候选补丁](patches/)与[本机测试回执](receipts/)

冻结基线为 `f4be9f88da7af59b6df1819ae242cf134591c376`。每份补丁只增加一个证据模块和两份测试。已逐份应用补丁，并核对重建文件树与候选提交完全一致。验收时可按题型选取补丁。截图、原始日志与备份留在 Mac，回执包含校验值供复核。

有些题只保存分段、折合快照或最终选择。清单逐项注明依据，核验范围以记录实际能支持的操作和数学结论为限。中央注册、P10、GitHub CI 和正式覆盖以中央验收后的提交为准。

| 批次 | 题型 | 题数 | 固定提交 | Chromium 检查 | 补丁 | 回执 |
| --- | --- | ---: | --- | ---: | --- | --- |
| p086m | x-a30-solid | 2 | `8d047262ae38e3c0d2f892245f4e47fb2104a10c` | 22 | [补丁](patches/p086m.patch) | [回执](receipts/p086m.json) |
| p088r | x-s39-graph | 2 | `efa14ad06fb1e71b087bdcf0cd7bb6b6117e2396` | 22 | [补丁](patches/p088r.patch) | [回执](receipts/p088r.json) |
| p091r | x-allowedrange | 3 | `12156d705f04368dd9dcbde21f13df8aa33f53a9` | 28 | [补丁](patches/p091r.patch) | [回执](receipts/p091r.json) |
| p092t | x-s23-tile | 4 | `8df04d5be1d587c61c3dac93f99422744ba3022a` | 34 | [补丁](patches/p092t.patch) | [回执](receipts/p092t.json) |
| p093n | x-net | 5 | `045a36b5e0a9c203a1915af14df1e9c0c21e20d2` | 42 | [补丁](patches/p093n.patch) | [回执](receipts/p093n.json) |
| p094d | x-decimaldivide | 4 | `244c3db419b7d8bf3a65ce398090f991a9877a62` | 35 | [补丁](patches/p094d.patch) | [回执](receipts/p094d.json) |
| p095m | x-m31-meter | 3 | `1f39fa1ceaf97195a27d67e02214360e7ef42d4e` | 29 | [补丁](patches/p095m.patch) | [回执](receipts/p095m.json) |
| p096s | x-subgroups | 1 | `072787704af31fd09b77b80e51e2ab032966c1aa` | 16 | [补丁](patches/p096s.patch) | [回执](receipts/p096s.json) |
| p096w | x-wholeshare | 6 | `10ca39b3d4a800b755f81a8670f4f225f2de0609` | 49 | [补丁](patches/p096w.patch) | [回执](receipts/p096w.json) |
| p097c | x-powerchain | 4 | `53b25036a51db30813b1ad20a843e728d634d1cc` | 34 | [补丁](patches/p097c.patch) | [回执](receipts/p097c.json) |
| p097r | x-rootwindow | 1 | `c4d8f43a3679e77c98c06de31fafc016da7a6dcf` | 16 | [补丁](patches/p097r.patch) | [回执](receipts/p097r.json) |
| p098p | x-f36-plot | 3 | `f8579661690042e7a12a18808c1978655f47dd0c` | 29 | [补丁](patches/p098p.patch) | [回执](receipts/p098p.json) |
| p098v | x-f36-live | 1 | `4f09125bfa6c2a530f352299ad827c51c0ee1f85` | 16 | [补丁](patches/p098v.patch) | [回执](receipts/p098v.json) |
| p099c | x-m31-compare | 2 | `2af041028d266dbc3f1dd937a663f3695635c524` | 22 | [补丁](patches/p099c.patch) | [回执](receipts/p099c.json) |
| p099b | x-m31-balance | 2 | `e7f1874b5700968bb9745d0cfc0b1bbfdac7e377` | 22 | [补丁](patches/p099b.patch) | [回执](receipts/p099b.json) |
| p100b | x-boxsummary | 1 | `a456362d43fe9f624f7f70fa03d4a1ff0810e759` | 16 | [补丁](patches/p100b.patch) | [回执](receipts/p100b.json) |
| p100v | x-m31-product | 1 | `80b5c031cfed8905275173df101ad5415ee9dab2` | 16 | [补丁](patches/p100v.patch) | [回执](receipts/p100v.json) |
| p101a | x-s23-symmetry | 9 | `12b929feab18ef8ee1bd32606770eaec9b46b3e6` | 66 | [补丁](patches/p101a.patch) | [回执](receipts/p101a.json) |
| p101s | x-p24-spin | 3 | `d5a5c022b5d45cf92d6a60b6c4d5e4cdec4f1ca0` | 28 | [补丁](patches/p101s.patch) | [回执](receipts/p101s.json) |
| p101f | x-p24-frieze | 1 | `ee4b25e07f532a33a0ce8d53a2914892f9acfcce` | 16 | [补丁](patches/p101f.patch) | [回执](receipts/p101f.json) |
| p102l | x-lawtiles | 1 | `564a713ea6730ff6af587c8312a5f8f9978912a6` | 16 | [补丁](patches/p102l.patch) | [回执](receipts/p102l.json) |
| p103t | x-p34-program | 7 | `9ee4e8e442ce032aec7d62e0f466a39287018ff9` | 54 | [补丁](patches/p103t.patch) | [回执](receipts/p103t.json) |
| p104t | x-toolwork | 4 | `7d0463ed22d488ccdbf70e41386a7773feffa232` | 35 | [补丁](patches/p104t.patch) | [回执](receipts/p104t.json) |
| p104m | x-s39-choose | 9 | `8858e2165b19d2467016dbbe1405a16d5ac59011` | 67 | [补丁](patches/p104m.patch) | [回执](receipts/p104m.json) |
| p105n | x-numbersearch | 11 | `87e2978201e1b0c2066fbe07e0aa1eba27d55286` | 80 | [补丁](patches/p105n.patch) | [回执](receipts/p105n.json) |
| p105c | x-factorcode | 2 | `2552afeae48a866bef71a068b755f47bf244d97b` | 22 | [补丁](patches/p105c.patch) | [回执](receipts/p105c.json) |
| p105f | x-factorforest | 4 | `eb7ad36732c3899f003889c633278a972280132a` | 34 | [补丁](patches/p105f.patch) | [回执](receipts/p105f.json) |
| p106p | x-partbuild | 1 | `309397606b6aca797fda619aa90f8d942805073e` | 16 | [补丁](patches/p106p.patch) | [回执](receipts/p106p.json) |
| p106n | x-fractiontalk | 2 | `9c46f803f407ff494839f070e1d977a8d79c1dca` | 22 | [补丁](patches/p106n.patch) | [回执](receipts/p106n.json) |
| p107p | x-planproduct | 3 | `678e4f705d9bb20b1e4bf58b4c215fae7c2e00ec` | 29 | [补丁](patches/p107p.patch) | [回执](receipts/p107p.json) |
| p109b | x-algebrabar | 4 | `8c40fa67361d21c85e9e5cf08665d8f48374b327` | 36 | [补丁](patches/p109b.patch) | [回执](receipts/p109b.json) |
| p109a | x-a35-sort | 12 | `b9d469b1bc64f37eae24cda1455e8e4a1e82bea0` | 88 | [补丁](patches/p109a.patch) | [回执](receipts/p109a.json) |
| p109f | x-f36-form | 4 | `399ca904e09db22961292ea6ab965f10a53bc2f0` | 35 | [补丁](patches/p109f.patch) | [回执](receipts/p109f.json) |
| p110c | x-statcentre | 10 | `b16a11b8fae379273f854e3a73054e403bcb8d25` | 73 | [补丁](patches/p110c.patch) | [回执](receipts/p110c.json) |
| p110d | x-distribution | 10 | `cbff2d3e5cfb40a872e22f4d629f619fd2fdd509` | 75 | [补丁](patches/p110d.patch) | [回执](receipts/p110d.json) |
| p110m | x-mediarepair | 5 | `681780c2eb3d7fca84c1db5b0c08c9e487620e4d` | 42 | [补丁](patches/p110m.patch) | [回执](receipts/p110m.json) |
| p111a | x-a35-build | 2 | `78a0ae1595184f37bb35f8d1f267de408dd55c8a` | 23 | [补丁](patches/p111a.patch) | [回执](receipts/p111a.json) |
| p111g | x-a35-plot | 2 | `c0642edb6d8269ebdb7c72385a0c67bb8c207adc` | 22 | [补丁](patches/p111g.patch) | [回执](receipts/p111g.json) |
| p112b | x-p22-order | 1 | `a7943b123910fbd9b833f2760b593f5fe0938d06` | 16 | [补丁](patches/p112b.patch) | [回执](receipts/p112b.json) |
| p112v | x-p22-venn | 5 | `320709c34f5f1b9e2b768595e7f30130eece9c34` | 41 | [补丁](patches/p112v.patch) | [回执](receipts/p112v.json) |
| p113s | x-pvshift | 13 | `2b78e59989fc7f462416ea73173626fffb5ee21c` | 91 | [补丁](patches/p113s.patch) | [回执](receipts/p113s.json) |
| p114s | x-g27-sort | 16 | `b7d44f9af2b97b361513da267755dcd3ed3652f5` | 111 | [补丁](patches/p114s.patch) | [回执](receipts/p114s.json) |
| p114f | x-g27-face | 4 | `c27dd4d5e9e1eac1bf6d47339bee277a2320cbe9` | 35 | [补丁](patches/p114f.patch) | [回执](receipts/p114f.json) |
| p114c | x-g27-cut | 4 | `fd67febba7eb974b3847ef59577cd8e5eec815c3` | 35 | [补丁](patches/p114c.patch) | [回执](receipts/p114c.json) |
| p115g | x-p24-grid | 9 | `47a1fd5992d40a65f8fa2cb9e3315b2a7bd52a20` | 67 | [补丁](patches/p115g.patch) | [回执](receipts/p115g.json) |
| p115s | x-p24-studio | 1 | `809fdd61d287559f766d8f838882d29c257cf6a8` | 16 | [补丁](patches/p115s.patch) | [回执](receipts/p115s.json) |
| p115f | x-p24-fan | 1 | `a2ff2145b96c6e7cbb0a72e50e0351e0b1229f66` | 16 | [补丁](patches/p115f.patch) | [回执](receipts/p115f.json) |
| p115t | x-p24-tiles | 1 | `ce14addfa32e7a8a1c7f55e7f9768920fd83e796` | 16 | [补丁](patches/p115t.patch) | [回执](receipts/p115t.json) |
| p116h | x-histbuild | 3 | `47249f275d98908766dd82b1a0c4d9db8ffb8837` | 29 | [补丁](patches/p116h.patch) | [回执](receipts/p116h.json) |
| p116p | x-piesector | 3 | `d181ef38562eabb888c8fc2f41962c6202ebe7e9` | 29 | [补丁](patches/p116p.patch) | [回执](receipts/p116p.json) |
| p116t | x-timeplot | 5 | `e41b66ce0cc72ea218bee1112f764e9372ce9b77` | 41 | [补丁](patches/p116t.patch) | [回执](receipts/p116t.json) |
| p116d | x-dotdraw | 1 | `c63d0eebb181351042ebb0db017006219a2331fb` | 16 | [补丁](patches/p116d.patch) | [回执](receipts/p116d.json) |
