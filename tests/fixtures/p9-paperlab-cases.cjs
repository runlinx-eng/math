// Frozen original B16/B17 tasks and independently checked quantities.
// Production adapters never import this test fixture.
module.exports={
  "cases": [
    {
      "id": "halfpaper",
      "sessionId": "halfpaper",
      "index": 1,
      "nodeId": "mt_-hTTat0mBR",
      "mode": "fold",
      "d": 2,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      },
      "expected": {
        "unit": [
          1,
          2
        ],
        "selected": 1,
        "answer": [
          1,
          2
        ]
      }
    },
    {
      "id": "halfpaper",
      "sessionId": "halfpaper",
      "index": 2,
      "nodeId": "mt_-hTTat0mBR",
      "mode": "classify",
      "d": 2,
      "taskHash": "d7a22cf0b6b726646dafd440be575e3f37256fb35fd48187993631f1f53e93b0",
      "task": {
        "type": "x-paperlab",
        "mode": "classify",
        "d": 2,
        "prompt": "每一张都切成了几块，哪些真的一样多？",
        "cases": [
          [
            1,
            1
          ],
          [
            1,
            3
          ],
          [
            2,
            2
          ],
          [
            1,
            1,
            2
          ]
        ]
      },
      "expected": {
        "truth": [
          true,
          false,
          true,
          false
        ],
        "shares": [
          [
            1,
            1
          ],
          [
            1,
            3
          ],
          [
            2,
            2
          ],
          [
            1,
            1,
            2
          ]
        ]
      }
    },
    {
      "id": "quarterpaper",
      "sessionId": "quarterpaper",
      "index": 0,
      "nodeId": "mt_g3W0mdADVu",
      "mode": "fold",
      "d": 4,
      "taskHash": "84d02d04a51e1a77023c3640cffbd8277600daaffe51aa752ed90d2ed6d621a3",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 4,
        "prompt": "先对折，再让每一半继续对折。摊开后涂出一小份。"
      },
      "expected": {
        "unit": [
          1,
          4
        ],
        "selected": 1,
        "answer": [
          1,
          4
        ]
      }
    },
    {
      "id": "quarterpaper",
      "sessionId": "quarterpaper",
      "index": 2,
      "nodeId": "mt_g3W0mdADVu",
      "mode": "classify",
      "d": 4,
      "taskHash": "d14932dcdc2d9ae478088075dc1e7452d5bc797433f6462d27cf1315b74d197a",
      "task": {
        "type": "x-paperlab",
        "mode": "classify",
        "d": 4,
        "prompt": "这些分法里，哪一张真的是四个相等的份？",
        "cases": [
          [
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            3
          ],
          [
            2,
            2
          ],
          [
            2,
            2,
            2,
            2
          ]
        ]
      },
      "expected": {
        "truth": [
          true,
          false,
          false,
          true
        ],
        "shares": [
          [
            1,
            1,
            1,
            1
          ],
          [
            1,
            1,
            1,
            3
          ],
          [
            2,
            2
          ],
          [
            2,
            2,
            2,
            2
          ]
        ]
      }
    },
    {
      "id": "shapeparts",
      "sessionId": "shapeparts",
      "index": 0,
      "nodeId": "mt_xACS3rWWDp",
      "mode": "build",
      "d": 2,
      "shape": "circle",
      "taskHash": "4d1c84bdbbc10a7e89d314ceb7c88a6605042c8fde401569ee41426d9eebbda1",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 2,
        "prompt": "从圆心出发，把圆分成两个相等的部分，涂一份。",
        "shape": "circle"
      },
      "expected": {
        "unit": [
          1,
          2
        ],
        "selected": 1,
        "answer": [
          1,
          2
        ]
      }
    },
    {
      "id": "shapeparts",
      "sessionId": "shapeparts",
      "index": 1,
      "nodeId": "mt_xACS3rWWDp",
      "mode": "build",
      "d": 4,
      "taskHash": "833791debf12e69518857c080f54e5eaf7b63d4e18f053c75aea722bf4404ca9",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 4,
        "prompt": "把长方形分成四个等份，可以自己选行和列。涂一份。"
      },
      "expected": {
        "unit": [
          1,
          4
        ],
        "selected": 1,
        "answer": [
          1,
          4
        ]
      }
    },
    {
      "id": "shapeparts",
      "sessionId": "shapeparts",
      "index": 2,
      "nodeId": "mt_xACS3rWWDp",
      "mode": "build",
      "d": 2,
      "shape": "circle",
      "take": 2,
      "taskHash": "a77be38e90c215524595a8c39744e624a95e90fd424c5caec61196649eb91678",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 2,
        "prompt": "把两份都涂上。整个圆怎样用这两份来表示？",
        "shape": "circle",
        "take": 2
      },
      "expected": {
        "unit": [
          1,
          2
        ],
        "selected": 2,
        "answer": [
          2,
          2
        ]
      }
    },
    {
      "id": "shapeparts",
      "sessionId": "shapeparts",
      "index": 3,
      "nodeId": "mt_xACS3rWWDp",
      "mode": "build",
      "d": 4,
      "take": 4,
      "taskHash": "e63dbb0245631a3371bca67690ec36f1b4d82cc72a2e0ab9f36098819f33c680",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 4,
        "prompt": "把四份都涂上。整个长方形怎样用这四份来表示？",
        "take": 4
      },
      "expected": {
        "unit": [
          1,
          4
        ],
        "selected": 4,
        "answer": [
          4,
          4
        ]
      }
    },
    {
      "id": "areaparts",
      "sessionId": "areaparts",
      "index": 0,
      "nodeId": "mt_idbKDrf9qZ",
      "mode": "build",
      "d": 6,
      "taskHash": "d72a6319639b9ab75e67e23a1be299bdff34ad8f9adb8a8812c94ba686e77c77",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 6,
        "prompt": "把长方形分成六个等面积部分，再取一份并写下它的名字。"
      },
      "expected": {
        "unit": [
          1,
          6
        ],
        "selected": 1,
        "answer": [
          1,
          6
        ]
      }
    },
    {
      "id": "areaparts",
      "sessionId": "areaparts",
      "index": 1,
      "nodeId": "mt_idbKDrf9qZ",
      "mode": "paint",
      "d": 4,
      "taskHash": "c3b48cd34eb12261a6b4c345fa161fd66fdf42202fd72814217c0456fafb0122",
      "task": {
        "type": "x-paperlab",
        "mode": "paint",
        "d": 4,
        "prompt": "用四种颜色分这16格，每色一样多。留下两种不同分界，形状可以不同。"
      },
      "expected": {
        "unit": [
          1,
          4
        ],
        "cellCount": 16,
        "colors": 4,
        "perColor": 4,
        "requiredDistinct": 2
      }
    },
    {
      "id": "areaparts",
      "sessionId": "areaparts",
      "index": 2,
      "nodeId": "mt_idbKDrf9qZ",
      "mode": "classify",
      "d": 6,
      "writeName": true,
      "taskHash": "bad8c6e9fbc072c774a0000e73544f59c2c733dfd1db7e3cb7bf6ad25a25f9ea",
      "task": {
        "type": "x-paperlab",
        "mode": "classify",
        "d": 6,
        "prompt": "看分好的图，先检查每份是不是一样多。相等时，给其中一份写个名字。",
        "writeName": true,
        "cases": [
          [
            2,
            2,
            2,
            2,
            2,
            2
          ],
          [
            1,
            1,
            1,
            1,
            1,
            7
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1
          ]
        ]
      },
      "expected": {
        "truth": [
          true,
          false,
          true
        ],
        "shares": [
          [
            2,
            2,
            2,
            2,
            2,
            2
          ],
          [
            1,
            1,
            1,
            1,
            1,
            7
          ],
          [
            1,
            1,
            1,
            1,
            1,
            1
          ]
        ]
      }
    },
    {
      "id": "tenpieces",
      "sessionId": "tenpieces",
      "index": 1,
      "nodeId": "mt_YzM5goBctT",
      "mode": "build",
      "d": 10,
      "taskHash": "7838eb61c0ddc2552ba542521ab0fee409a80ab184bacd39c6a27ae93fc06e77",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 10,
        "prompt": "把整张纸分十等份，涂一份，给它写出名字。"
      },
      "expected": {
        "unit": [
          1,
          10
        ],
        "selected": 1,
        "answer": [
          1,
          10
        ]
      }
    }
  ],
  "bridges": [
    {
      "id": "link-share-wholefractions",
      "index": 0,
      "taskHash": "e63dbb0245631a3371bca67690ec36f1b4d82cc72a2e0ab9f36098819f33c680",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 4,
        "prompt": "把四份都涂上。整个长方形怎样用这四份来表示？",
        "take": 4
      }
    },
    {
      "id": "link-quarterpaper-amounts",
      "index": 0,
      "taskHash": "84d02d04a51e1a77023c3640cffbd8277600daaffe51aa752ed90d2ed6d621a3",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 4,
        "prompt": "先对折，再让每一半继续对折。摊开后涂出一小份。"
      }
    },
    {
      "id": "link-halfpaper-amounts",
      "index": 0,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      }
    },
    {
      "id": "link-halfpaper-quarterpaper",
      "index": 0,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      }
    },
    {
      "id": "link-halfpaper-quarterpaper",
      "index": 1,
      "taskHash": "84d02d04a51e1a77023c3640cffbd8277600daaffe51aa752ed90d2ed6d621a3",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 4,
        "prompt": "先对折，再让每一半继续对折。摊开后涂出一小份。"
      }
    },
    {
      "id": "link-shapeparts-folds",
      "index": 0,
      "taskHash": "833791debf12e69518857c080f54e5eaf7b63d4e18f053c75aea722bf4404ca9",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 4,
        "prompt": "把长方形分成四个等份，可以自己选行和列。涂一份。"
      }
    },
    {
      "id": "link-shapeparts-folds",
      "index": 1,
      "taskHash": "00d12a9aac6d38352d19a6dab86402383465cad8f169426b705ee8008f536cfe",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 8,
        "prompt": "把纸连续对折三次，再取出八份中的一份。"
      }
    },
    {
      "id": "link-sharegroups-halfpaper",
      "index": 1,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      }
    },
    {
      "id": "link-shapeparts-smallershare",
      "index": 0,
      "taskHash": "833791debf12e69518857c080f54e5eaf7b63d4e18f053c75aea722bf4404ca9",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 4,
        "prompt": "把长方形分成四个等份，可以自己选行和列。涂一份。"
      }
    },
    {
      "id": "link-share-areaparts",
      "index": 0,
      "taskHash": "84d02d04a51e1a77023c3640cffbd8277600daaffe51aa752ed90d2ed6d621a3",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 4,
        "prompt": "先对折，再让每一半继续对折。摊开后涂出一小份。"
      }
    },
    {
      "id": "link-share-areaparts",
      "index": 1,
      "taskHash": "c3b48cd34eb12261a6b4c345fa161fd66fdf42202fd72814217c0456fafb0122",
      "task": {
        "type": "x-paperlab",
        "mode": "paint",
        "d": 4,
        "prompt": "用四种颜色分这16格，每色一样多。留下两种不同分界，形状可以不同。"
      }
    },
    {
      "id": "link-equalparts-areaparts",
      "index": 0,
      "taskHash": "c3b48cd34eb12261a6b4c345fa161fd66fdf42202fd72814217c0456fafb0122",
      "task": {
        "type": "x-paperlab",
        "mode": "paint",
        "d": 4,
        "prompt": "用四种颜色分这16格，每色一样多。留下两种不同分界，形状可以不同。"
      }
    },
    {
      "id": "link-equalparts-areaparts",
      "index": 1,
      "taskHash": "d72a6319639b9ab75e67e23a1be299bdff34ad8f9adb8a8812c94ba686e77c77",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 6,
        "prompt": "把长方形分成六个等面积部分，再取一份并写下它的名字。"
      }
    },
    {
      "id": "link-folds-unitsets",
      "index": 0,
      "taskHash": "84d02d04a51e1a77023c3640cffbd8277600daaffe51aa752ed90d2ed6d621a3",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 4,
        "prompt": "先对折，再让每一半继续对折。摊开后涂出一小份。"
      }
    },
    {
      "id": "link-quarterpaper-shapeparts",
      "index": 0,
      "taskHash": "84d02d04a51e1a77023c3640cffbd8277600daaffe51aa752ed90d2ed6d621a3",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 4,
        "prompt": "先对折，再让每一半继续对折。摊开后涂出一小份。"
      }
    },
    {
      "id": "link-quarterpaper-shapeparts",
      "index": 1,
      "taskHash": "e63dbb0245631a3371bca67690ec36f1b4d82cc72a2e0ab9f36098819f33c680",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 4,
        "prompt": "把四份都涂上。整个长方形怎样用这四份来表示？",
        "take": 4
      }
    },
    {
      "id": "link-halfpaper-shapeparts",
      "index": 0,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      }
    },
    {
      "id": "link-halfpaper-shapeparts",
      "index": 1,
      "taskHash": "4d1c84bdbbc10a7e89d314ceb7c88a6605042c8fde401569ee41426d9eebbda1",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 2,
        "prompt": "从圆心出发，把圆分成两个相等的部分，涂一份。",
        "shape": "circle"
      }
    },
    {
      "id": "link-smallershare-equalparts",
      "index": 1,
      "taskHash": "c3b48cd34eb12261a6b4c345fa161fd66fdf42202fd72814217c0456fafb0122",
      "task": {
        "type": "x-paperlab",
        "mode": "paint",
        "d": 4,
        "prompt": "用四种颜色分这16格，每色一样多。留下两种不同分界，形状可以不同。"
      }
    },
    {
      "id": "link-shapeparts-equalparts",
      "index": 0,
      "taskHash": "833791debf12e69518857c080f54e5eaf7b63d4e18f053c75aea722bf4404ca9",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 4,
        "prompt": "把长方形分成四个等份，可以自己选行和列。涂一份。"
      }
    },
    {
      "id": "link-shapeparts-equalparts",
      "index": 1,
      "taskHash": "c3b48cd34eb12261a6b4c345fa161fd66fdf42202fd72814217c0456fafb0122",
      "task": {
        "type": "x-paperlab",
        "mode": "paint",
        "d": 4,
        "prompt": "用四种颜色分这16格，每色一样多。留下两种不同分界，形状可以不同。"
      }
    },
    {
      "id": "link-share-samepartcompare",
      "index": 0,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      }
    },
    {
      "id": "link-halfpaper-hourclock",
      "index": 0,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      }
    },
    {
      "id": "link-halfpaper-fractiontime",
      "index": 0,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      }
    }
  ],
  "practices": [
    {
      "id": "quarterpaper",
      "index": -1,
      "taskHash": "84d02d04a51e1a77023c3640cffbd8277600daaffe51aa752ed90d2ed6d621a3",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 4,
        "prompt": "先对折，再让每一半继续对折。摊开后涂出一小份。"
      }
    },
    {
      "id": "shapeparts",
      "index": -1,
      "taskHash": "4d1c84bdbbc10a7e89d314ceb7c88a6605042c8fde401569ee41426d9eebbda1",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 2,
        "prompt": "从圆心出发，把圆分成两个相等的部分，涂一份。",
        "shape": "circle"
      }
    },
    {
      "id": "areaparts",
      "index": -1,
      "taskHash": "d72a6319639b9ab75e67e23a1be299bdff34ad8f9adb8a8812c94ba686e77c77",
      "task": {
        "type": "x-paperlab",
        "mode": "build",
        "d": 6,
        "prompt": "把长方形分成六个等面积部分，再取一份并写下它的名字。"
      }
    }
  ],
  "navigation": [
    {
      "id": "halfpaper",
      "index": 0,
      "taskHash": "45e0298da3c8b6eda9cb57e236df1a94b720c836beb0d128941d501afab81590",
      "task": {
        "type": "x-portiongroups",
        "total": 8,
        "d": 2,
        "n": 1,
        "prompt": "把8颗分给两组，让双方一样多。再取其中一组。"
      }
    },
    {
      "id": "quarterpaper",
      "index": 1,
      "taskHash": "2968d91033a907a1c726934354fbdbfd1cd8aa44b3381c4bea89b31107b3fbba",
      "task": {
        "type": "x-portiongroups",
        "total": 12,
        "d": 4,
        "n": 1,
        "prompt": "12颗分进四组，每组一样多；取一组，看拿到几颗。"
      }
    },
    {
      "id": "tenpieces",
      "index": 0,
      "taskHash": "44babccb1f97c7d675869b51410433bd918fd38dfaf19e7ae5877544d47d1d6a",
      "task": {
        "type": "x-unitwalk",
        "n": 10,
        "d": 10,
        "whole": true,
        "prompt": "把0到1分十等份，一小步一小步接，十步会落在哪里？"
      }
    },
    {
      "id": "link-sharegroups-halfpaper",
      "index": 0,
      "taskHash": "45e0298da3c8b6eda9cb57e236df1a94b720c836beb0d128941d501afab81590",
      "task": {
        "type": "x-portiongroups",
        "total": 8,
        "d": 2,
        "n": 1,
        "prompt": "把8颗分给两组，让双方一样多。再取其中一组。"
      }
    },
    {
      "id": "link-smallershare-equalparts",
      "index": 0,
      "taskHash": "26ee3d171d4007c86c945ae2845fc0ad472d092f987a7c7acbddd7cbf1894a52",
      "task": {
        "type": "x-samefraction",
        "left": [
          1,
          2
        ],
        "right": [
          1,
          4
        ],
        "prompt": "同一块披萨，分两份与分四份，拿一份会怎样？先猜，再叠起来看。",
        "common": false
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b16.js": "32dd356d23a765122b60e0c40d804d7ee9353e3950757386704a6e9435e39d79",
    "dist/learning/phase5/b17.js": "7598232e6f0d99ffbfedbd1e2bd923c45dec5afc935bfc7fca415ed5370bb9b2",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab",
    "dist/learning/phase5/b16-view.js": "2f319e0c77dcbd612cbbb71e21b728fad5e9dc7c257cbd94a6808c7ec4f459e7"
  }
};
