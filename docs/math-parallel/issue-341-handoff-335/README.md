# #341 候选验收交接

本批交接 **97 个候选、335 个原生题位**。B 线 92 个候选覆盖 308 道，P009 的 5 个候选覆盖 27 道。冻结基线为 `f4be9f88da7af59b6df1819ae242cf134591c376`。

- [335 道逐题清单](positions.csv)
- [候选提交、变更路径和交接文件 SHA-256](manifest.json)
- [代码补丁](patches/)与[本机测试回执](receipts/)

每个补丁均从冻结基线独立导出，已验证可重建对应候选的完整文件树。复验单个候选时，在冻结基线的独立工作树先用 `git apply --check <补丁路径>` 检查，再用 `git apply <补丁路径>` 应用，并按回执核对测试范围。

测试回执对应本机开发期。截图、原始浏览器日志和备份仍在 Mac 上，中央整合后需在最终提交上运行正式 CI。P007、后续 126 道及暂缓题另行跟踪。

| 题包 | 候选分支 | 固定提交 | 题位 | 补丁 | 测试回执 |
| --- | --- | --- | ---: | --- | --- |
| P117 | `work/b/p117-preaudit` | `f6683e726374a8e601f03ff5354a553f4e0b6bba` | 1 | [补丁](patches/P117.patch) | [回执](receipts/P117.json) |
| P116 | `work/b/p116-integer-dotplot` | `659e4613a6eee911e0fb1a16a6ae1a2e1d146fb3` | 2 | [补丁](patches/P116.patch) | [回执](receipts/P116.json) |
| P115 | `work/b/p115-signedpoints-quadrants` | `7207f32fa58bb25cad9cd07bf0d556a1d0c01246` | 3 | [补丁](patches/P115.patch) | [回执](receipts/P115.json) |
| P114 | `work/b/p114-solidstack` | `519c9da68961e44240cc966613447409af111163` | 2 | [补丁](patches/P114.patch) | [回执](receipts/P114.json) |
| P113 | `work/b/p113-tens-removal` | `af26d4693cb37393fb14a92da47e8555e2987b3f` | 4 | [补丁](patches/P113.patch) | [回执](receipts/P113.json) |
| P112 | `work/b/p112-fair-die` | `6953cfb5c47261b5c839248bee4abcbe474f32bb` | 6 | [补丁](patches/P112.patch) | [回执](receipts/P112.json) |
| P111 | `work/b/p111-bilateral-equations` | `2d334f3e0e99cd8af16c5db8cfc8447a335d826f` | 5 | [补丁](patches/P111.patch) | [回执](receipts/P111.json) |
| P110 | `work/b/p110-mean-distance` | `80cecc012875ab5972079e0ac13af88ed4018d79` | 2 | [补丁](patches/P110.patch) | [回执](receipts/P110.json) |
| P109 | `work/b/p109-common-factor` | `5846be80af9d8458d51f2bd7406b51a7a4d40754` | 3 | [补丁](patches/P109.patch) | [回执](receipts/P109.json) |
| P108 | `work/b/p108-digit-value` | `a459d62081221530468ecb8f06cbfef9252288c7` | 1 | [补丁](patches/P108.patch) | [回执](receipts/P108.json) |
| P107 | `work/b/p107-factor-pairs` | `be708fb91f910f4adcd3d2fee0319417e591188f` | 2 | [补丁](patches/P107.patch) | [回执](receipts/P107.json) |
| P106 | `work/b/p106-paper-fold-counts` | `a0ce272f8a5fe786e051c310f90455bab7463a30` | 1 | [补丁](patches/P106.patch) | [回执](receipts/P106.json) |
| P105 | `work/b/p105-prime-divisors` | `3beb8631a99edc0721da1e63c2294f08ce266a40` | 3 | [补丁](patches/P105.patch) | [回执](receipts/P105.json) |
| P104 | `work/b/p104-step-tools` | `b4de22f622a767b1764228116f73413c296a69df` | 2 | [补丁](patches/P104.patch) | [回执](receipts/P104.json) |
| P103 | `work/b/p103-pair-grid` | `736bd73bca56544fce6b04b9a6cdea8d66f50fb9` | 2 | [补丁](patches/P103.patch) | [回执](receipts/P103.json) |
| P102 | `work/b/p102-product-grouping` | `e9e0fdfa7277d54666b04a57d753a202812f5a3c` | 2 | [补丁](patches/P102.patch) | [回执](receipts/P102.json) |
| P101 | `work/b/p101-axis-mirror` | `bae84808cf6ba896376359b29f77fc8360c076b9` | 3 | [补丁](patches/P101.patch) | [回执](receipts/P101.json) |
| P100 | `work/b/p100-boxplot-marks` | `155421e3d526eb5192ee68113c1f8c5afd3c299c` | 1 | [补丁](patches/P100.patch) | [回执](receipts/P100.json) |
| P099 | `work/b/p099-length-tape` | `fd47e359eef43d0411c8704401a516146c186b11` | 3 | [补丁](patches/P099.patch) | [回执](receipts/P099.json) |
| P098 | `work/b/p098-linear-parameter` | `6b184a54df3b6c8d4ac8729c6e490358668a1b27` | 2 | [补丁](patches/P098.patch) | [回执](receipts/P098.json) |
| P097 | `work/b/p097-square-pair` | `e74a2b68465139da612c717b8c3434e25eb52f6e` | 1 | [补丁](patches/P097.patch) | [回执](receipts/P097.json) |
| P096 | `work/b/p096-four-addends` | `cc79c09b3fa0956e394a674ad03e28853afc5f17` | 2 | [补丁](patches/P096.patch) | [回执](receipts/P096.json) |
| P095 | `work/b/p095-zero-crossing` | `1067fd247cdb109787a9f9b883230fdf6de7b39b` | 2 | [补丁](patches/P095.patch) | [回执](receipts/P095.json) |
| P094 | `work/b/p094-small-unit-product` | `de7f2c5eeb19991e81447d310122fc05f5b4f067` | 2 | [补丁](patches/P094.patch) | [回执](receipts/P094.json) |
| P093 | `work/b/p093-triangular-prism-net` | `8561bdfd25e1683bbe598074870bb2b921e22927` | 1 | [补丁](patches/P093.patch) | [回执](receipts/P093.json) |
| P092 | `work/b/p092-triangle-tiling` | `b61fe5937c2773d7644c5519608cd78f3b2f8f3e` | 2 | [补丁](patches/P092.patch) | [回执](receipts/P092.json) |
| P091 | `work/b/p091-one-sided-range` | `8855f11e3a1d4932c4122882b7756a4cac5a896d` | 2 | [补丁](patches/P091.patch) | [回执](receipts/P091.json) |
| P090 | `work/b/p090-signed-product-rows` | `3c75aec6811bb9f3b4a49a5c5ae9d9655bedc7e3` | 3 | [补丁](patches/P090.patch) | [回执](receipts/P090.json) |
| P089 | `work/b/p089-parity-pairing` | `e85623a8d18d99b131f9c345c4593ecc8aed1c74` | 4 | [补丁](patches/P089.patch) | [回执](receipts/P089.json) |
| P088 | `work/b/p088-graph-crossings` | `06ea261e15a97843935892c4ca24373d99793f74` | 2 | [补丁](patches/P088.patch) | [回执](receipts/P088.json) |
| P087 | `work/b/p087-unordered-split-pairs` | `9a186c4d9fd6541069b970e7088af31cc7bfc08f` | 2 | [补丁](patches/P087.patch) | [回执](receipts/P087.json) |
| P086 | `work/b/p086-joined-solid-surfaces` | `5d57c622b0cf8757150c5dc1842a848701d60253` | 1 | [补丁](patches/P086.patch) | [回执](receipts/P086.json) |
| P085 | `work/b/p085-pythagoras-length` | `300332361f48c9636cd4b349e80c4c332f988c00` | 3 | [补丁](patches/P085.patch) | [回执](receipts/P085.json) |
| P084 | `work/b/p084-expression-build` | `5363f7c82a152e275a6e004ac36cf425e8163b9f` | 3 | [补丁](patches/P084.patch) | [回执](receipts/P084.json) |
| P083 | `work/b/p083-chance-mapping` | `177f7e428941439c3a99c12855116e2e21d677c5` | 3 | [补丁](patches/P083.patch) | [回执](receipts/P083.json) |
| P082 | `work/b/p082-shape-uses` | `54d3344b387262a66b543eaf79a4fcc0c867ef7e` | 3 | [补丁](patches/P082.patch) | [回执](receipts/P082.json) |
| P081 | `work/b/p081-stat-brief` | `c2de9782a29a327eea17a7c19f01c1d62f9c8ab1` | 3 | [补丁](patches/P081.patch) | [回执](receipts/P081.json) |
| P080 | `work/b/p080-argument-chain` | `7f3be4257d25cab5c09a4255afa840caaafaac06` | 2 | [补丁](patches/P080.patch) | [回执](receipts/P080.json) |
| P079 | `work/b/p079-net-surface` | `96ab1fb4c3aae65285e108d83526e5b7b6a299f1` | 2 | [补丁](patches/P079.patch) | [回执](receipts/P079.json) |
| P077 | `work/b/p077-digital-sets` | `92da3b7319d4aa02f1172077c92b0f3263459ae6` | 2 | [补丁](patches/P077.patch) | [回执](receipts/P077.json) |
| P076 | `work/b/p076-measure-story` | `01f10aaeab9b88736b1e089dbf666a9572b97afb` | 2 | [补丁](patches/P076.patch) | [回执](receipts/P076.json) |
| P075 | `work/b/p075-pair-table` | `473214feace17c3669fde1b895c7ca749b76797c` | 2 | [补丁](patches/P075.patch) | [回执](receipts/P075.json) |
| P074 | `work/b/p074-complex-chain` | `d8771fc9c7d18379bb7ed8728d60b3ed9be15758` | 1 | [补丁](patches/P074.patch) | [回执](receipts/P074.json) |
| P073 | `work/b/p073-plan-chain` | `b691f138cce2f61f22528b69565da8d2506e7ef9` | 1 | [补丁](patches/P073.patch) | [回执](receipts/P073.json) |
| P072 | `work/b/p072-sense-chain` | `76e49e18b1d77737f285d466156c9f2557beb0fb` | 1 | [补丁](patches/P072.patch) | [回执](receipts/P072.json) |
| P071 | `work/b/p071-story-chain` | `a807de3cafb5283b2cc328c9a1c6d6717d914cc5` | 1 | [补丁](patches/P071.patch) | [回执](receipts/P071.json) |
| P070 | `work/b/p070-perimeter-walk` | `e7e29e431ae108c14238a43c49128365780bb486` | 1 | [补丁](patches/P070.patch) | [回执](receipts/P070.json) |
| P069 | `work/b/p069-complex-steps` | `e7b040f8727b0d41850c81ccf6324b722eacdf5c` | 1 | [补丁](patches/P069.patch) | [回执](receipts/P069.json) |
| P068 | `work/b/p068-percent-steps` | `d2b8f8b0da44b83c72211034c40628e57c9fa5af` | 1 | [补丁](patches/P068.patch) | [回执](receipts/P068.json) |
| P067 | `work/b/p067-similar-steps` | `46eb7be0afe4c403a62ec4d03ab13a5418163893` | 1 | [补丁](patches/P067.patch) | [回执](receipts/P067.json) |
| P066 | `work/b/p066-data-clean` | `f9789b278277618cc92003c5ae95036382e3f161` | 1 | [补丁](patches/P066.patch) | [回执](receipts/P066.json) |
| P065 | `work/b/p065-similar-triangles` | `b58550e19081ae2feae6ba97ed563efb4ed0ca2a` | 1 | [补丁](patches/P065.patch) | [回执](receipts/P065.json) |
| P064 | `work/b/p064-pythagoras-area` | `84a9acacfa7baf0cbf71a4ebb5a36c0f01eefb71` | 1 | [补丁](patches/P064.patch) | [回执](receipts/P064.json) |
| P063 | `work/b/p063-temperature-order` | `6e862904b5f3322ddf15c7472a4158d2224ad481` | 1 | [补丁](patches/P063.patch) | [回执](receipts/P063.json) |
| P062 | `work/b/p062-zero-place-product` | `08961a16e316fcab5f7dfe2a7822232d3b098dbf` | 1 | [补丁](patches/P062.patch) | [回执](receipts/P062.json) |
| P059 | `work/b/p059-whole-unit-walk` | `3ca286a3e03829e53e7a1767484c17a442388dd6` | 1 | [补丁](patches/P059.patch) | [回执](receipts/P059.json) |
| P058 | `work/b/p058-leaf-grid-approximation` | `c267dcf05ed71778e79d187a39068387cb45a249` | 1 | [补丁](patches/P058.patch) | [回执](receipts/P058.json) |
| P057 | `work/b/p057-chance-condition-sort` | `34e4845c7648cd4d0af32522fb7ef391b360ccc7` | 1 | [补丁](patches/P057.patch) | [回执](receipts/P057.json) |
| P055 | `work/b/p055-right-triangle-condition` | `a11e5c0b509fdbef8f18f8db7c2e8a7310797820` | 1 | [补丁](patches/P055.patch) | [回执](receipts/P055.json) |
| P054 | `work/b/p054-opposite-side-marks` | `70afe009c2974d3b7ad8a6d8d56c4d4315ad84b4` | 1 | [补丁](patches/P054.patch) | [回执](receipts/P054.json) |
| P053 | `work/b/p053-data-kind-order` | `d4ba345634ba75213dc56720a9dbe3190610c8f9` | 1 | [补丁](patches/P053.patch) | [回执](receipts/P053.json) |
| P051 | `work/b/p051-compound-unit-meaning` | `a968df723037304b9a888ab4bd6bda662ac72759` | 1 | [补丁](patches/P051.patch) | [回执](receipts/P051.json) |
| P050 | `work/b/p050-drawing-area-scale` | `bffba7988fb155f1b697abd83d863684fb81914d` | 1 | [补丁](patches/P050.patch) | [回执](receipts/P050.json) |
| P049 | `work/b/p049-ratio-smallest-basket` | `64f7a69adce8fc3bd6cf8a6df133b8f5b78eece4` | 1 | [补丁](patches/P049.patch) | [回执](receipts/P049.json) |
| P048 | `work/b/p048-rope-cut-chain` | `7618d76faa648fa350a2f98d626b2070e9346479` | 1 | [补丁](patches/P048.patch) | [回执](receipts/P048.json) |
| P047 | `work/b/p047-subtraction-first-error` | `997460a2ed89a1af6631d3ed21a96fdc8efbb240` | 1 | [补丁](patches/P047.patch) | [回执](receipts/P047.json) |
| P046 | `work/b/p046-three-fourths-chain` | `fa972391046bcfcfd862c0cb1f00b502aa9db74f` | 1 | [补丁](patches/P046.patch) | [回执](receipts/P046.json) |
| P045 | `work/b/p045-three-fifths-vs-half` | `7d819a4c21be3aad123b67d41236aad9885018ee` | 1 | [补丁](patches/P045.patch) | [回执](receipts/P045.json) |
| P044 | `work/b/p044-straight-angle-gap` | `6b100945609d07d6c96a4e0d42edeccc6b16d79a` | 2 | [补丁](patches/P044.patch) | [回执](receipts/P044.json) |
| P043 | `work/b/p043-multiple-sheet` | `28924333cd78b1005605c047ce4e7c73b6e05a43` | 2 | [补丁](patches/P043.patch) | [回执](receipts/P043.json) |
| P042 | `work/b/p042-perimeter-area-trials` | `1e21ce38e1ec4bf0a5a092bdcc12a41539368ddd` | 2 | [补丁](patches/P042.patch) | [回执](receipts/P042.json) |
| P040 | `work/b/p040-prism-face-volume` | `506189de6dfd172da09b467375f2c0cbf98e6529` | 2 | [补丁](patches/P040.patch) | [回执](receipts/P040.json) |
| P039 | `work/b/p039-shortchains` | `fb8fb2f6adf63b09cfbf2ebd9ca48f20bf4de7a7` | 2 | [补丁](patches/P039.patch) | [回执](receipts/P039.json) |
| P037 | `work/b/p037-composite-scene` | `49f1f5683bd8672cdb56fe1588b399b4da2f8dd6` | 3 | [补丁](patches/P037.patch) | [回执](receipts/P037.json) |
| P036 | `work/b/p036-geometry-notation` | `a6b684d63e945cb117f67fcb56e53310b87aad9c` | 3 | [补丁](patches/P036.patch) | [回执](receipts/P036.json) |
| P035 | `work/b/p035-ordered-pair-grid` | `e86b2d18bb45f2528c20965616995da5fdafefee` | 3 | [补丁](patches/P035.patch) | [回执](receipts/P035.json) |
| P033 | `work/b/p033-observation-tally` | `7c42279e00e2cc66320671004de1893d3bb40ce2` | 3 | [补丁](patches/P033.patch) | [回执](receipts/P033.json) |
| P031 | `work/b/p031-hundred-chart` | `2b5079688e32d5c463f062e66ae8354b80d87b2a` | 4 | [补丁](patches/P031.patch) | [回执](receipts/P031.json) |
| P028 | `work/b/p028-trig-roles-and-ratios` | `799feec04cebede616f72c156e390742e10122d1` | 5 | [补丁](patches/P028.patch) | [回执](receipts/P028.json) |
| P027 | `work/b/p027-equal-ratio-shares` | `6b30e4bb7884b6d6d2eab902d16acb01995649b3` | 2 | [补丁](patches/P027.patch) | [回执](receipts/P027.json) |
| P025 | `work/b/p025-decimal-remainders-and-place-values` | `33300dd67a7361a3aac2940fbd4e5aeedac87d30` | 6 | [补丁](patches/P025.patch) | [回执](receipts/P025.json) |
| P023 | `work/b/p023-graph-interpretation` | `e6086a47c19442942f4219ff759e589660f1dcf0` | 10 | [补丁](patches/P023.patch) | [回执](receipts/P023.json) |
| P020 | `work/b/p020-boundary-and-area-construction` | `446ab74ffad4c383432d6e889ca551d1cf371947` | 7 | [补丁](patches/P020.patch) | [回执](receipts/P020.json) |
| P019 | `work/b/p019-equivalent-names-and-percent` | `39e073968d8da70770e7b4b9bcbd6298edc66c5f` | 9 | [补丁](patches/P019.patch) | [回执](receipts/P019.json) |
| P018 | `work/b/p018-probability-observations` | `05639387b353a80e9d71b1dfffbef29582f0bfe6` | 8 | [补丁](patches/P018.patch) | [回执](receipts/P018.json) |
| P017 | `work/b/p017-signed-walk-and-between` | `015a3323d00708756de6a1213bc83476a6f78d4e` | 4 | [补丁](patches/P017.patch) | [回执](receipts/P017.json) |
| P016 | `work/b/p016-model-and-rule-checks` | `acb26e3c012f2726b422474da88d677908184f2f` | 11 | [补丁](patches/P016.patch) | [回执](receipts/P016.json) |
| P014 | `work/b/p014-multiplicative-bars` | `c4a58c348b6341d1ac1af2eaa232c50a6626a3ab` | 18 | [补丁](patches/P014.patch) | [回执](receipts/P014.json) |
| P013 | `work/b/p013-recall-and-estimation` | `adcf8e19b4b636c410f710cc1cf680ad12ba02a9` | 20 | [补丁](patches/P013.patch) | [回执](receipts/P013.json) |
| P012 | `work/b/p012-time-calendar-and-timetables` | `f1238d9ddd14f2aa3d2610452a5b6b04ce48425e` | 8 | [补丁](patches/P012.patch) | [回执](receipts/P012.json) |
| P011 | `work/b/p011-measurement-models` | `c30476bf09697de618674c75dd7c9bae930b0e4e` | 25 | [补丁](patches/P011.patch) | [回执](receipts/P011.json) |
| P010 | `work/b/p010-story-operation-plans` | `2dccf637274fb9c84ad0c047160af42a366bc92e` | 24 | [补丁](patches/P010.patch) | [回执](receipts/P010.json) |
| P009A | `work/a/p009a-ten-landmark` | `2ba9ccdd358c18cdeb5233232c3bd80696c73044` | 7 | [补丁](patches/P009A.patch) | [回执](receipts/P009A.json) |
| P009B | `work/a/p009b-add-subtract-family` | `978d4a6c423cb8cefcd9c84cf290ec3fe172678b` | 8 | [补丁](patches/P009B.patch) | [回执](receipts/P009B.json) |
| P009C | `work/a/p009c-three-group-pairings` | `82cbbe858baaa3b96e0309ba5dbafd5f8c2b99b0` | 5 | [补丁](patches/P009C.patch) | [回执](receipts/P009C.json) |
| P009D | `work/a/p009d-inverse-calculation` | `ba4c8230dcaee23ac2b1417ad584ea0149737913` | 5 | [补丁](patches/P009D.patch) | [回执](receipts/P009D.json) |
| P009E | `work/a/p009e-decimal-complements` | `685681b9779a871a6ebd849fa3676c23df60ce26` | 2 | [补丁](patches/P009E.patch) | [回执](receipts/P009E.json) |
