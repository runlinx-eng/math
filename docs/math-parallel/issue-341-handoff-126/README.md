# #341 后续 126 题候选交接

本批 **126 个原生题位、35 个独立候选**均通过本机 Node、预检和真实 Chromium，浏览器检查共 1155 项。与首批 335 题逐题核对无重叠，冻结基线为 `f4be9f88da7af59b6df1819ae242cf134591c376`。

- [126 道逐题清单](positions.csv)
- [候选提交、来源和文件校验值](manifest.json)
- [候选补丁](patches/)和[本机测试回执](receipts/)

已验证每份补丁可在冻结基线重建对应候选提交的完整文件树。中央按题型在独立工作树应用并核验。回执里的截图、原始日志及备份仍存于 Mac。正式 CI、P10 和中央验收以整合后的固定提交为准。

218 道需另行开发，119 道仍缺关键过程记录，这两组继续暂放。

| 批次 | 题型 | 题数 | 固定提交 | Chromium 检查 | 补丁 | 回执 |
| --- | --- | ---: | --- | ---: | --- | --- |
| p087s | x-splitbench | 2 | `e65e8d1eac7ae775ffad7945846c03603661a6d8` | 23 | [补丁](patches/p087s.patch) | [回执](receipts/p087s.json) |
| p090s | x-signwalk | 2 | `71eaa111aba5d2e296b5a89783f34a27978d5b6b` | 22 | [补丁](patches/p090s.patch) | [回执](receipts/p090s.json) |
| p094d | x-decimalproduct | 2 | `78f74627c189cb27ec92aab07b101ffdf01b892c` | 23 | [补丁](patches/p094d.patch) | [回执](receipts/p094d.json) |
| p095s | x-m29-share | 2 | `f24312b09f6a880402f7b3fbebee092f615010d6` | 22 | [补丁](patches/p095s.patch) | [回执](receipts/p095s.json) |
| p095i | x-m29-interval | 2 | `914d928ebb7ca662e18ebd76eb6bf754054974f9` | 23 | [补丁](patches/p095i.patch) | [回执](receipts/p095i.json) |
| p096d | x-divreverse | 1 | `94bd04cf51f2036cff6910a1217617d71b440e1c` | 16 | [补丁](patches/p096d.patch) | [回执](receipts/p096d.json) |
| p098g | x-graphpoints | 3 | `7941e66cbc0d3720f03aa7971900354310343405` | 30 | [补丁](patches/p098g.patch) | [回执](receipts/p098g.json) |
| p098q | x-f36-coord | 3 | `068da269fa541efc2c2f882069c0525a61171c14` | 28 | [补丁](patches/p098q.patch) | [回执](receipts/p098q.json) |
| p098r | x-f36-ratio | 1 | `901aeb8cdf6138e3b9fe38e74c5cc5a1428a5b57` | 16 | [补丁](patches/p098r.patch) | [回执](receipts/p098r.json) |
| p099c | x-m29-combine | 2 | `31dae4429b354f73908fb75b04c67b7db81510ed` | 23 | [补丁](patches/p099c.patch) | [回执](receipts/p099c.json) |
| p102f | x-mulfacts | 9 | `cca942d7dc5970eef81eccb4fcb322079d52c400` | 70 | [补丁](patches/p102f.patch) | [回执](receipts/p102f.json) |
| p102c | x-mulchain | 3 | `5d4d40c603a36a7530d37a2c5d0ab4b5a3a2b54c` | 30 | [补丁](patches/p102c.patch) | [回执](receipts/p102c.json) |
| p103r | x-p34-repeat | 4 | `3b646e3b66d54a1548f14b1ecfccb0f13bccf975` | 36 | [补丁](patches/p103r.patch) | [回执](receipts/p103r.json) |
| p103g | x-p34-growth | 1 | `3eb88a851aa4f44512304c5b6a93022dfe5c777f` | 16 | [补丁](patches/p103g.patch) | [回执](receipts/p103g.json) |
| p103p | x-p34-pair | 2 | `5f46ca523dcf7050456bcff10bd7fd69efade3aa` | 22 | [补丁](patches/p103p.patch) | [回执](receipts/p103p.json) |
| p103e | x-p34-relation | 1 | `0d252a118fb430d6bb85ca90a2856cd96fd697a0` | 16 | [补丁](patches/p103e.patch) | [回执](receipts/p103e.json) |
| p104c | x-s39-calc | 2 | `4bacf46b234fde3412952aed8b97b65f1f195fc1` | 22 | [补丁](patches/p104c.patch) | [回执](receipts/p104c.json) |
| p107a | x-areaproduct | 10 | `33e70f8f7ac9973f16aa2c23d55e0b9de54553d5` | 78 | [补丁](patches/p107a.patch) | [回执](receipts/p107a.json) |
| p107r | x-factorrects | 2 | `85404d7a119c3f98403b60688eb67fe4b7da3704` | 23 | [补丁](patches/p107r.patch) | [回执](receipts/p107r.json) |
| p109s | x-f36-eval | 4 | `ff60480e7ce3f6125e87e7e0b112dcd350a561e1` | 35 | [补丁](patches/p109s.patch) | [回执](receipts/p109s.json) |
| p110r | x-rowrepair | 1 | `68ac1056b08886afa71c3f594b651ac2720ffcf4` | 16 | [补丁](patches/p110r.patch) | [回执](receipts/p110r.json) |
| p111w | x-a35-walk | 3 | `e3e820a77513c385e61cefe88cb6ffd9f3c003fc` | 29 | [补丁](patches/p111w.patch) | [回执](receipts/p111w.json) |
| p111t | x-a35-try | 5 | `4fef9d96c9fd65930a1fa543e8539d249a587a2f` | 44 | [补丁](patches/p111t.patch) | [回执](receipts/p111t.json) |
| p111p | x-a35-pairs | 4 | `cfdf279d2e60333b0c63a684a28a3dba0bc2e2d5` | 35 | [补丁](patches/p111p.patch) | [回执](receipts/p111p.json) |
| p111g | x-a35-grid | 7 | `bbb0d7aa4b77bd83d1c594786c8747f1ef235093` | 54 | [补丁](patches/p111g.patch) | [回执](receipts/p111g.json) |
| p112o | x-p22-order | 5 | `d71d9525286dd2b00b693f0754c796ab2b3dfa30` | 42 | [补丁](patches/p112o.patch) | [回执](receipts/p112o.json) |
| p112s | x-p22-pick | 8 | `1e41f7d19730afdaa97e808e08636db8ee863463` | 62 | [补丁](patches/p112s.patch) | [回执](receipts/p112s.json) |
| p112t | x-p22-table | 4 | `3c82bd4fcea3743bc4cdf96980d2b7d54d713a4a` | 36 | [补丁](patches/p112t.patch) | [回执](receipts/p112t.json) |
| p113u | x-unitadd | 3 | `6f79231c267aab6f9ead754221a37c908eab4891` | 28 | [补丁](patches/p113u.patch) | [回执](receipts/p113u.json) |
| p113p | x-placecalc | 7 | `83ff51e10f4530df1b5fa7e16f7064abe39ed87d` | 56 | [补丁](patches/p113p.patch) | [回执](receipts/p113p.json) |
| p115p | x-p24-place | 5 | `ed02653d929c4bec4184cb3892a5a69b20fea1e2` | 41 | [补丁](patches/p115p.patch) | [回执](receipts/p115p.json) |
| p115w | x-p24-walk | 8 | `b8bbe11cb0551c48b7804415a47f7640b6879003` | 59 | [补丁](patches/p115w.patch) | [回执](receipts/p115w.json) |
| p115r | x-p24-read | 4 | `10622b4d110d53c0f7e168d9e844e4f8ecbb7dca` | 35 | [补丁](patches/p115r.patch) | [回执](receipts/p115r.json) |
| p115d | x-p24-distance | 2 | `a7897095a6c4bf17f0d630833c2cbdda0b6e06ef` | 22 | [补丁](patches/p115d.patch) | [回执](receipts/p115d.json) |
| p116f | x-dotdraw | 2 | `489de2eed0742ae323adc07cfc2556ea86e75dfa` | 22 | [补丁](patches/p116f.patch) | [回执](receipts/p116f.json) |
