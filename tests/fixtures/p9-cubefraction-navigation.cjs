// Literal plans for the ten real preceding tasks; no solver-generated answers.
module.exports={
  "navigation": [
    {
      "id": "advancedWords38",
      "index": 0,
      "task": {
        "type": "x-s23-circle",
        "prompt": "先画一个半径4.5厘米的圆，再画从圆心到边缘的线和穿过圆心的整条线。",
        "radius": 4.5,
        "questions": [
          {
            "label": "直径多少厘米",
            "value": 9
          },
          {
            "label": "圆周指",
            "value": "edge",
            "options": [
              [
                "edge",
                "绕圆一整圈的边界"
              ],
              [
                "radius",
                "圆心到边缘的线"
              ]
            ]
          }
        ]
      },
      "taskHash": "a1466d51fcca03b4c7946c32cf66db3dc1eea6a4bf0fff0b1baea449ee38a234",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "field": "radius",
          "value": "4.5"
        },
        {
          "action": "g23-circle"
        },
        {
          "action": "g23-radial"
        },
        {
          "action": "g23-diameter"
        },
        {
          "action": "g23-rim"
        },
        {
          "field": "answers.0",
          "value": "9"
        },
        {
          "field": "answers.1",
          "value": "edge"
        }
      ]
    },
    {
      "id": "advancedWords38",
      "index": 1,
      "task": {
        "type": "x-a35-sort",
        "prompt": "公式也是等式。这三张分别是表达式、具体等式，还是表示面积关系的公式？",
        "items": [
          {
            "label": "2x＋3",
            "group": "expr"
          },
          {
            "label": "2x＋3＝7",
            "group": "eq"
          },
          {
            "label": "面积＝长×宽",
            "group": "formula"
          }
        ],
        "groups": [
          {
            "id": "expr",
            "label": "表达式"
          },
          {
            "id": "eq",
            "label": "具体等式"
          },
          {
            "id": "formula",
            "label": "面积公式（也是等式）"
          }
        ],
        "questions": [
          {
            "label": "面积公式也有等号吗",
            "value": "yes",
            "kind": "choice",
            "options": [
              [
                "yes",
                "有"
              ],
              [
                "no",
                "没有"
              ]
            ]
          }
        ]
      },
      "taskHash": "623d808e41977720b3995b893c41781a87ccd8191e6eed67e3e4a9bdb2043aca",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "action": "a35-choose",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "a35-group",
          "data": {
            "index": "expr"
          }
        },
        {
          "action": "a35-choose",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "a35-group",
          "data": {
            "index": "eq"
          }
        },
        {
          "action": "a35-choose",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "a35-group",
          "data": {
            "index": "formula"
          }
        },
        {
          "field": "answers.0",
          "value": "yes"
        }
      ]
    },
    {
      "id": "modelChoice38",
      "index": 0,
      "task": {
        "type": "x-r37-share",
        "prompt": "40颗按3:5分给甲和乙。先分成一样大的小份。",
        "total": 40,
        "parts": [
          3,
          5
        ],
        "labels": [
          "甲",
          "乙"
        ],
        "questions": [
          {
            "label": "一份多少颗",
            "value": 5
          },
          {
            "label": "甲得到多少颗",
            "value": 15
          },
          {
            "label": "乙得到多少颗",
            "value": 25
          }
        ],
        "unit": "颗"
      },
      "taskHash": "4fe2a93628c3b9d1c6a1d389ee4ca5daaf88ab2d748cb85e31a267fa966c7c53",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "action": "r37-person",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "r37-slot",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "r37-slot",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "r37-slot",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "r37-person",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "r37-slot",
          "data": {
            "index": "3"
          }
        },
        {
          "action": "r37-slot",
          "data": {
            "index": "4"
          }
        },
        {
          "action": "r37-slot",
          "data": {
            "index": "5"
          }
        },
        {
          "action": "r37-slot",
          "data": {
            "index": "6"
          }
        },
        {
          "action": "r37-slot",
          "data": {
            "index": "7"
          }
        },
        {
          "field": "answers.0",
          "value": "5"
        },
        {
          "field": "answers.1",
          "value": "15"
        },
        {
          "field": "answers.2",
          "value": "25"
        }
      ]
    },
    {
      "id": "term38",
      "index": 0,
      "task": {
        "type": "x-factorrects",
        "n": 24,
        "prompt": "24颗不添不减，能排出哪些不同的长方形？把每一种留下。"
      },
      "taskHash": "3565ef221b2242c95b06538b5bb4337ed2408bffbe99bc8e115f49b87ab808b0",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "field": "rows",
          "value": "1"
        },
        {
          "field": "cols",
          "value": "24"
        },
        {
          "field": "answer",
          "value": "24"
        },
        {
          "action": "b13-pair-save"
        },
        {
          "field": "rows",
          "value": "2"
        },
        {
          "field": "cols",
          "value": "12"
        },
        {
          "field": "answer",
          "value": "24"
        },
        {
          "action": "b13-pair-save"
        },
        {
          "field": "rows",
          "value": "3"
        },
        {
          "field": "cols",
          "value": "8"
        },
        {
          "field": "answer",
          "value": "24"
        },
        {
          "action": "b13-pair-save"
        },
        {
          "field": "rows",
          "value": "4"
        },
        {
          "field": "cols",
          "value": "6"
        },
        {
          "field": "answer",
          "value": "24"
        },
        {
          "action": "b13-pair-save"
        }
      ]
    },
    {
      "id": "term38",
      "index": 1,
      "task": {
        "type": "x-numbersearch",
        "mode": "multiples",
        "ns": [
          7
        ],
        "prompt": "从一份7开始，接出前五个正倍数。",
        "count": 5
      },
      "taskHash": "1059544ba30ec89c353645515c8fd54552ceccb0faf812265188c804efe9ebd8",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "field": "answer",
          "value": "7"
        },
        {
          "action": "b14-list",
          "data": {
            "side": "0"
          }
        },
        {
          "field": "answer",
          "value": "14"
        },
        {
          "action": "b14-list",
          "data": {
            "side": "0"
          }
        },
        {
          "field": "answer",
          "value": "21"
        },
        {
          "action": "b14-list",
          "data": {
            "side": "0"
          }
        },
        {
          "field": "answer",
          "value": "28"
        },
        {
          "action": "b14-list",
          "data": {
            "side": "0"
          }
        },
        {
          "field": "answer",
          "value": "35"
        },
        {
          "action": "b14-list",
          "data": {
            "side": "0"
          }
        }
      ]
    },
    {
      "id": "term38",
      "index": 2,
      "task": {
        "type": "x-a30-grid",
        "prompt": "铺满这片 3 行、每行 4 格的地面，边缘也要算。",
        "w": 4,
        "h": 3,
        "cells": [
          [
            0,
            0
          ],
          [
            1,
            0
          ],
          [
            2,
            0
          ],
          [
            3,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            2,
            1
          ],
          [
            3,
            1
          ],
          [
            0,
            2
          ],
          [
            1,
            2
          ],
          [
            2,
            2
          ],
          [
            3,
            2
          ]
        ],
        "mode": "tile",
        "unit": "cm"
      },
      "taskHash": "3fa5666f59799e2d95267be6c2c8f218155941a817e0525d19be8fbe8199a4f1",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "action": "a30-tile",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "3"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "4"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "5"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "6"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "7"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "8"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "9"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "10"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "11"
          }
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ]
    },
    {
      "id": "link-box-fractionvolume",
      "index": 0,
      "task": {
        "type": "cube-plan",
        "dims": [
          4,
          3,
          5
        ],
        "prompt": "先按长、宽、高找到一层，再数出长方体里面的块数。"
      },
      "taskHash": "d321f2865167c2cab8342d91f2083bf68157f7464c9a6be6c7b3ae96f1dc5799",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "coreField": "perLayer",
          "value": "12"
        },
        {
          "coreField": "layers",
          "value": "5"
        },
        {
          "coreField": "total",
          "value": "60"
        }
      ]
    },
    {
      "id": "link-fractionarea-fractionvolume",
      "index": 0,
      "task": {
        "type": "x-fractioncase",
        "a": "2/3",
        "op": "*",
        "b": "3/4",
        "prompt": "在同一个单位正方形里，横取2/3，竖取3/4。数两种选择重合的小格。",
        "scene": "2/3　与　3/4",
        "tile": true,
        "simple": true
      },
      "taskHash": "0dd6fb187a6427af4461495f61e3936ce113c9da7abc6a085e65cf6270062c42",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "field": "choice",
          "value": "*"
        },
        {
          "field": "guess",
          "value": "part"
        },
        {
          "action": "b18-start"
        },
        {
          "field": "work.aform",
          "value": "2/3"
        },
        {
          "field": "work.bform",
          "value": "3/4"
        },
        {
          "action": "b18-op-forms"
        },
        {
          "action": "b18-op-column",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "b18-op-column",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "b18-op-row",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "b18-op-row",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "b18-op-row",
          "data": {
            "index": "2"
          }
        },
        {
          "field": "work.answer",
          "value": "1/2"
        },
        {
          "field": "work.reason",
          "value": "scale"
        },
        {
          "field": "simple",
          "value": "1/2"
        },
        {
          "field": "tile",
          "value": "1/12"
        },
        {
          "field": "count",
          "value": "6"
        }
      ]
    },
    {
      "id": "link-precise38-term38",
      "index": 0,
      "task": {
        "type": "x-floor",
        "w": 4,
        "h": 5,
        "prompt": "用一平方厘米的小方片铺满这本模拟书的封面，再与刚才 14 平方厘米的 L 形比较。",
        "unit": "cm²",
        "compare": 14
      },
      "taskHash": "80b58f130d17f0ccce5feb327dfa127d33ec06118637e55f1c0794d1c618e48d",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "action": "row"
        },
        {
          "action": "row"
        },
        {
          "action": "row"
        },
        {
          "action": "row"
        },
        {
          "action": "row"
        },
        {
          "field": "total",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "comparison",
          "value": "more"
        }
      ]
    },
    {
      "id": "link-term38-advancedWords38",
      "index": 0,
      "task": {
        "type": "x-a30-grid",
        "prompt": "铺满这片 3 行、每行 4 格的地面，边缘也要算。",
        "w": 4,
        "h": 3,
        "cells": [
          [
            0,
            0
          ],
          [
            1,
            0
          ],
          [
            2,
            0
          ],
          [
            3,
            0
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            2,
            1
          ],
          [
            3,
            1
          ],
          [
            0,
            2
          ],
          [
            1,
            2
          ],
          [
            2,
            2
          ],
          [
            3,
            2
          ]
        ],
        "mode": "tile",
        "unit": "cm"
      },
      "taskHash": "3fa5666f59799e2d95267be6c2c8f218155941a817e0525d19be8fbe8199a4f1",
      "strictCubefractionCoverage": false,
      "steps": [
        {
          "action": "a30-tile",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "3"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "4"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "5"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "6"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "7"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "8"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "9"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "10"
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": "11"
          }
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ]
    }
  ],
  "sourceHashes": {
    "dist/learning/learn.js": "0e2bc073fb8d9163542f57adf16f7a9eecb6a4f37ea2055e650ca5e8793e44a2",
    "dist/learning/phase5/b13-model.js": "d5a146c466ac846dd555f833823453252f1268e6be4f4d1d845ad07c7c434cb3",
    "dist/learning/phase5/b13-view.js": "1cece24dc00f47b3d54bb1e0405d5f05270e625cd23841872cf38c96c024b6a8",
    "dist/learning/phase5/b14-model.js": "9fe453c590a81e350fcd6f9988bc44ff27727fc5c51991363db803116c8a3ea4",
    "dist/learning/phase5/b14-view.js": "964a738353548589afa95ce39eeac6b03a2e07e925b25362f567b481b273b007",
    "dist/learning/phase5/b17-model.js": "52e8665b482c26ad444c95096130ef87c89b0793038db101fcc2cce23320ae78",
    "dist/learning/phase5/b17-view.js": "7ae3320116fc5d75cc4d576794c207d1d1ea54b490f46f406403d21b1e0c5d27",
    "dist/learning/phase5/b18-model.js": "8c1f393446397b64ff583afc0d7c08486c447f6b8c6d9fbb967b6396d3c7ec74",
    "dist/learning/phase5/b18-view.js": "65b37faa851efc0d2f1b50a4f928b73a3be9aadda5fa29659c5e13475987fff9",
    "dist/learning/phase5/b23-model.js": "542c5f323b2832191f74100181f68faa4b18aa119c1cd3a7ff4fad85f8fd2265",
    "dist/learning/phase5/b23-view.js": "aeb8697a51bbd6354e5512d61ff34af9ad5eed3ed8a00176522b0bd199306f5f",
    "dist/learning/phase5/b30-model.js": "1596369a899fd4031756af136d8e26268fd7c018aa8c7ccaac196f3a2047253a",
    "dist/learning/phase5/b30-view.js": "09c3350a8563c5b4e88b47c480bb38f33a5556f1a6608e41bee1ae9893511269",
    "dist/learning/phase5/b35-model.js": "487c21c62dcaf8706e743294843bc31fa30fb2e021d790dd6aace40ebf6cb0c6",
    "dist/learning/phase5/b35-view.js": "d596fdbb8abbc3297cb72869c0c2223c98a83325a6cd84f2b83cb040c1b703be",
    "dist/learning/phase5/b37-model.js": "b29141ed6ce37ed6e0324d4d65f7cd0fcdcbf25f17a9e461b9206867922d8faf",
    "dist/learning/phase5/b37-view.js": "74a05e555a7bb36c15513a66399383ceb8af723e90817e142d8e7c07ad19b598",
    "dist/learning/phase4/view-engine.js": "22ce2022cc9fb1f4fac0cdb40ac1bd7ef24497db9d1416b219f500f630c311f1",
    "dist/learning/p3-view.js": "100a430403ff5e5cce93546ebbce803df84fc4c602c2b6bcf6a342d53fe68a78",
    "dist/learning/workspace-flow.js": "3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05"
  }
};
