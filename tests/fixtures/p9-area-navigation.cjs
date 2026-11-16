// Fixed original tasks and literal visible paths for ordinary Next navigation.
// Prerequisite checks do not add strict area coverage.
module.exports={
  "navigation": [
    {
      "id": "term38",
      "sessionId": "term38",
      "index": 0,
      "taskHash": "3565ef221b2242c95b06538b5bb4337ed2408bffbe99bc8e115f49b87ab808b0",
      "task": {
        "type": "x-factorrects",
        "n": 24,
        "prompt": "24颗不添不减，能排出哪些不同的长方形？把每一种留下。"
      },
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
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "term38",
      "sessionId": "term38",
      "index": 1,
      "taskHash": "1059544ba30ec89c353645515c8fd54552ceccb0faf812265188c804efe9ebd8",
      "task": {
        "type": "x-numbersearch",
        "mode": "multiples",
        "ns": [
          7
        ],
        "prompt": "从一份7开始，接出前五个正倍数。",
        "count": 5
      },
      "steps": [
        {
          "field": "answer",
          "value": "7"
        },
        {
          "action": "b14-list",
          "data": {
            "side": 0
          }
        },
        {
          "field": "answer",
          "value": "14"
        },
        {
          "action": "b14-list",
          "data": {
            "side": 0
          }
        },
        {
          "field": "answer",
          "value": "21"
        },
        {
          "action": "b14-list",
          "data": {
            "side": 0
          }
        },
        {
          "field": "answer",
          "value": "28"
        },
        {
          "action": "b14-list",
          "data": {
            "side": 0
          }
        },
        {
          "field": "answer",
          "value": "35"
        },
        {
          "action": "b14-list",
          "data": {
            "side": 0
          }
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "multiShape38",
      "sessionId": "multiShape38",
      "index": 0,
      "taskHash": "bbe0c5631b2110d52cdadc2de01fab4bf8b02ceabdf0be432a10c7773c9518ac",
      "task": {
        "type": "x-storyplan",
        "values": [
          28,
          9,
          4
        ],
        "labels": [
          "小林现有",
          "小安多的",
          "小安送出的"
        ],
        "signs": [
          1,
          1,
          -1
        ],
        "unit": "颗",
        "prompt": "小林有28颗珠子，小安比他多9颗。小安送出4颗后，还剩多少？"
      },
      "steps": [
        {
          "action": "b12-plan-pick",
          "data": {
            "index": 0
          }
        },
        {
          "action": "b12-plan-pick",
          "data": {
            "index": 1
          }
        },
        {
          "field": "op",
          "value": "+"
        },
        {
          "field": "result",
          "value": "37"
        },
        {
          "field": "method",
          "value": "written"
        },
        {
          "action": "b12-plan-merge"
        },
        {
          "action": "b12-plan-pick",
          "data": {
            "index": 1
          }
        },
        {
          "action": "b12-plan-pick",
          "data": {
            "index": 0
          }
        },
        {
          "field": "op",
          "value": "-"
        },
        {
          "field": "result",
          "value": "33"
        },
        {
          "field": "method",
          "value": "written"
        },
        {
          "action": "b12-plan-merge"
        },
        {
          "field": "equation",
          "value": "(28+9)-4=□"
        },
        {
          "field": "answer",
          "value": "33"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "tools39",
      "sessionId": "tools39",
      "index": 0,
      "taskHash": "fa6b43a9ccdea6eece97c3492431860b9c076d1e5861ee7d49545023d77dd04b",
      "task": {
        "type": "x-s39-choose",
        "prompt": "25×4，你会怎样算？",
        "display": "25×4",
        "operator": "*",
        "operands": [
          25,
          4
        ],
        "result": 100
      },
      "steps": [
        {
          "field": "method",
          "value": "mental"
        },
        {
          "field": "answer",
          "value": "100"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "tools39",
      "sessionId": "tools39",
      "index": 1,
      "taskHash": "606e1840f80bdc176ac1f18c9d2cc4aa8488817671e52074ba0d7a9925c57321",
      "task": {
        "type": "x-s39-choose",
        "prompt": "换成167×3。你可以继续选自己的方法。",
        "display": "167×3",
        "operator": "*",
        "operands": [
          167,
          3
        ],
        "result": 501
      },
      "steps": [
        {
          "field": "method",
          "value": "mental"
        },
        {
          "field": "answer",
          "value": "501"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "tools39",
      "sessionId": "tools39",
      "index": 2,
      "taskHash": "4be59eeac3e96e771b7fc32bb0da34a32bfe23b3d17f847fcdd45533ed584616",
      "task": {
        "type": "x-samefraction",
        "left": [
          3,
          8
        ],
        "right": [
          1,
          4
        ],
        "prompt": "同一个整体取3/8与1/4。先猜，再用纸带叠一叠。",
        "common": false
      },
      "steps": [
        {
          "field": "prediction",
          "value": ">"
        },
        {
          "action": "b16-predict"
        },
        {
          "action": "b16-fraction",
          "data": {
            "row": "left",
            "index": 0
          }
        },
        {
          "action": "b16-fraction",
          "data": {
            "row": "left",
            "index": 1
          }
        },
        {
          "action": "b16-fraction",
          "data": {
            "row": "left",
            "index": 2
          }
        },
        {
          "action": "b16-fraction",
          "data": {
            "row": "right",
            "index": 0
          }
        },
        {
          "action": "b16-overlay"
        },
        {
          "field": "relation",
          "value": ">"
        },
        {
          "field": "reason",
          "value": "same-whole"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "tools39",
      "sessionId": "tools39",
      "index": 3,
      "taskHash": "cc0185f5827d90f88b2eb7a63c9ae11554d07b3ad388965200ae67a7581292a2",
      "task": {
        "type": "x-s39-choose",
        "prompt": "长4厘米、宽3厘米，先算4×3。",
        "display": "4×3",
        "operator": "*",
        "operands": [
          4,
          3
        ],
        "result": 12
      },
      "steps": [
        {
          "field": "method",
          "value": "mental"
        },
        {
          "field": "answer",
          "value": "12"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-lengthtools-gridarea",
      "sessionId": "link-lengthtools-gridarea",
      "index": 0,
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "量一条短书边：选工具，零刻度对齐。",
        "value": 12,
        "unit": "cm",
        "object": "书边",
        "questions": [],
        "axisMax": 15,
        "tool": "ruler",
        "tools": [
          {
            "id": "ruler",
            "label": "短尺"
          },
          {
            "id": "tape",
            "label": "卷尺"
          },
          {
            "id": "meter",
            "label": "米尺"
          },
          {
            "id": "yard",
            "label": "英制码尺"
          },
          {
            "id": "thermo",
            "label": "温度计"
          }
        ]
      },
      "steps": [
        {
          "action": "m28-tool",
          "data": {
            "index": "ruler"
          }
        },
        {
          "field": "offset",
          "value": "0"
        },
        {
          "field": "measure",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "action": "m28-record"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-rectangle-areadistrib",
      "sessionId": "link-rectangle-areadistrib",
      "index": 0,
      "taskHash": "86efaf3f3163352d6e832c16439cb685dfa48823794433c83254b82d97e91390",
      "task": {
        "type": "x-rectangle",
        "w": 7,
        "h": 9,
        "prompt": "看看一行与行数，为 7 cm × 9 cm 的板算出铺地面积。",
        "unit": "cm"
      },
      "steps": [
        {
          "field": "total",
          "value": "63"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-measurecalc-walkperim",
      "sessionId": "link-measurecalc-walkperim",
      "index": 0,
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "把尺的零刻度对准左端，读出这条模拟桌边。",
        "value": 7,
        "unit": "cm",
        "object": "桌边",
        "questions": [],
        "axisMax": 10,
        "tick": 1
      },
      "steps": [
        {
          "field": "offset",
          "value": "0"
        },
        {
          "field": "measure",
          "value": "7"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "action": "m28-record"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-sidesfold-walkperim",
      "sessionId": "link-sidesfold-walkperim",
      "index": 0,
      "taskHash": "45495542e41598d132a4507480f24c46e6cf3c46716abda13739d222024a4a18",
      "task": {
        "type": "x-s23-sides",
        "prompt": "沿边一条条点亮，数一数这个倾斜图形有几条边。",
        "shape": "pentagon",
        "rotation": 24,
        "questions": [
          {
            "label": "边的数量",
            "value": 5
          },
          {
            "label": "角的数量",
            "value": 5
          }
        ]
      },
      "steps": [
        {
          "action": "g23-mark",
          "data": {
            "index": 0
          }
        },
        {
          "action": "g23-mark",
          "data": {
            "index": 1
          }
        },
        {
          "action": "g23-mark",
          "data": {
            "index": 2
          }
        },
        {
          "action": "g23-mark",
          "data": {
            "index": 3
          }
        },
        {
          "action": "g23-mark",
          "data": {
            "index": 4
          }
        },
        {
          "field": "answers.0",
          "value": "5"
        },
        {
          "field": "answers.1",
          "value": "5"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-rectangle-polyperim",
      "sessionId": "link-rectangle-polyperim",
      "index": 0,
      "taskHash": "86efaf3f3163352d6e832c16439cb685dfa48823794433c83254b82d97e91390",
      "task": {
        "type": "x-rectangle",
        "w": 7,
        "h": 9,
        "prompt": "看看一行与行数，为 7 cm × 9 cm 的板算出铺地面积。",
        "unit": "cm"
      },
      "steps": [
        {
          "field": "total",
          "value": "63"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-boundary-areaPerim",
      "sessionId": "link-boundary-areaPerim",
      "index": 0,
      "taskHash": "e69fab8169d69e04e825ae8a65ee38ba99e20e5da6298d7c09bbec0e9a662d1f",
      "task": {
        "type": "x-rectangle",
        "w": 7.5,
        "h": 7.5,
        "prompt": "每条边 7.5 cm 的正方形，铺地面积和围边长度各是多少？",
        "unit": "cm",
        "perimeter": true
      },
      "steps": [
        {
          "field": "total",
          "value": "56.25"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "perimeter",
          "value": "30"
        },
        {
          "field": "borderUnit",
          "value": "cm"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-rectangle-rectsplit",
      "sessionId": "link-rectangle-rectsplit",
      "index": 0,
      "taskHash": "86efaf3f3163352d6e832c16439cb685dfa48823794433c83254b82d97e91390",
      "task": {
        "type": "x-rectangle",
        "w": 7,
        "h": 9,
        "prompt": "看看一行与行数，为 7 cm × 9 cm 的板算出铺地面积。",
        "unit": "cm"
      },
      "steps": [
        {
          "field": "total",
          "value": "63"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-productfractions-triArea",
      "sessionId": "link-productfractions-triArea",
      "index": 0,
      "taskHash": "6da14ffbe42401c01f00e715af1a48ba2359b0a78e5b5ab1e134b999ac27a8b9",
      "task": {
        "type": "x-fractioncase",
        "a": "2/3",
        "op": "*",
        "b": "4/5",
        "prompt": "取2/3中的4/5，用两个方向的选择找到重合部分。",
        "scene": "2/3　与　4/5",
        "tile": true
      },
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
          "value": "4/5"
        },
        {
          "action": "b18-op-forms"
        },
        {
          "action": "b18-op-column",
          "data": {
            "index": 0
          }
        },
        {
          "action": "b18-op-column",
          "data": {
            "index": 1
          }
        },
        {
          "action": "b18-op-row",
          "data": {
            "index": 0
          }
        },
        {
          "action": "b18-op-row",
          "data": {
            "index": 1
          }
        },
        {
          "action": "b18-op-row",
          "data": {
            "index": 2
          }
        },
        {
          "action": "b18-op-row",
          "data": {
            "index": 3
          }
        },
        {
          "field": "work.answer",
          "value": "8/15"
        },
        {
          "field": "work.reason",
          "value": "scale"
        },
        {
          "field": "tile",
          "value": "1/15"
        },
        {
          "field": "count",
          "value": "8"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-boundary-triArea",
      "sessionId": "link-boundary-triArea",
      "index": 0,
      "taskHash": "e69fab8169d69e04e825ae8a65ee38ba99e20e5da6298d7c09bbec0e9a662d1f",
      "task": {
        "type": "x-rectangle",
        "w": 7.5,
        "h": 7.5,
        "prompt": "每条边 7.5 cm 的正方形，铺地面积和围边长度各是多少？",
        "unit": "cm",
        "perimeter": true
      },
      "steps": [
        {
          "field": "total",
          "value": "56.25"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "perimeter",
          "value": "30"
        },
        {
          "field": "borderUnit",
          "value": "cm"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-quadhierarchy-triArea",
      "sessionId": "link-quadhierarchy-triArea",
      "index": 0,
      "taskHash": "b0fe61582ff2c8a102b12f2022bd4bdef0020d2c860a722860bccfc05479763c",
      "task": {
        "type": "x-s23-quad",
        "prompt": "把正方形逐项检查，再放入所有符合的四边形家族。",
        "shape": "square",
        "rotation": 0,
        "questions": [
          {
            "label": "每个正方形是长方形吗",
            "value": "yes",
            "options": [
              [
                "yes",
                "是，四角都是直角"
              ],
              [
                "no",
                "不是，外观不同"
              ]
            ]
          }
        ]
      },
      "steps": [
        {
          "action": "g23-test",
          "data": {
            "index": 0
          }
        },
        {
          "action": "g23-test",
          "data": {
            "index": 1
          }
        },
        {
          "action": "g23-test",
          "data": {
            "index": 2
          }
        },
        {
          "action": "g23-class",
          "data": {
            "index": 0
          }
        },
        {
          "action": "g23-class",
          "data": {
            "index": 1
          }
        },
        {
          "action": "g23-class",
          "data": {
            "index": 2
          }
        },
        {
          "action": "g23-class",
          "data": {
            "index": 3
          }
        },
        {
          "action": "g23-class",
          "data": {
            "index": 4
          }
        },
        {
          "action": "g23-class",
          "data": {
            "index": 5
          }
        },
        {
          "field": "answers.0",
          "value": "yes"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-boundary-prismFormulas",
      "sessionId": "link-boundary-prismFormulas",
      "index": 0,
      "taskHash": "e69fab8169d69e04e825ae8a65ee38ba99e20e5da6298d7c09bbec0e9a662d1f",
      "task": {
        "type": "x-rectangle",
        "w": 7.5,
        "h": 7.5,
        "prompt": "每条边 7.5 cm 的正方形，铺地面积和围边长度各是多少？",
        "unit": "cm",
        "perimeter": true
      },
      "steps": [
        {
          "field": "total",
          "value": "56.25"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "perimeter",
          "value": "30"
        },
        {
          "field": "borderUnit",
          "value": "cm"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-box-prismFormulas",
      "sessionId": "link-box-prismFormulas",
      "index": 0,
      "taskHash": "d321f2865167c2cab8342d91f2083bf68157f7464c9a6be6c7b3ae96f1dc5799",
      "task": {
        "type": "cube-plan",
        "dims": [
          4,
          3,
          5
        ],
        "prompt": "先按长、宽、高找到一层，再数出长方体里面的块数。"
      },
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
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-box-netSurface",
      "sessionId": "link-box-netSurface",
      "index": 0,
      "taskHash": "d321f2865167c2cab8342d91f2083bf68157f7464c9a6be6c7b3ae96f1dc5799",
      "task": {
        "type": "cube-plan",
        "dims": [
          4,
          3,
          5
        ],
        "prompt": "先按长、宽、高找到一层，再数出长方体里面的块数。"
      },
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
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-nets-netSurface",
      "sessionId": "link-nets-netSurface",
      "index": 0,
      "taskHash": "aeb0bb16299d8bc9d23d820709d9943a8e7ff9d8841aece32d59643fa422f143",
      "task": {
        "type": "x-net",
        "preset": [
          [
            0,
            0
          ],
          [
            1,
            0
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
            2,
            2
          ],
          [
            3,
            2
          ]
        ],
        "prompt": "换成这张阶梯纸片。先判断并选出一对相对的面，再折。"
      },
      "steps": [
        {
          "action": "guess",
          "data": {
            "value": "true"
          }
        },
        {
          "field": "pair.0",
          "value": "0"
        },
        {
          "field": "pair.1",
          "value": "3"
        },
        {
          "action": "fold"
        },
        {
          "field": "counts.faces",
          "value": "6"
        },
        {
          "field": "counts.edges",
          "value": "12"
        },
        {
          "field": "counts.vertices",
          "value": "8"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-circleparts-circleArea",
      "sessionId": "link-circleparts-circleArea",
      "index": 0,
      "taskHash": "a1466d51fcca03b4c7946c32cf66db3dc1eea6a4bf0fff0b1baea449ee38a234",
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
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-steps-solidSurface",
      "sessionId": "link-steps-solidSurface",
      "index": 0,
      "taskHash": "88e860f796d22407bd63579efeea0c46634acf45e14bece49d2d09c3aa527a94",
      "task": {
        "type": "decompose",
        "dims": [
          4,
          2,
          3
        ],
        "stepWidth": 2,
        "prompt": "先把台阶分成不重叠的两块，再把里面的体积接起来。"
      },
      "steps": [
        {
          "coreField": "axis",
          "value": "x"
        },
        {
          "coreField": "cut",
          "value": "2"
        },
        {
          "coreField": "first",
          "value": "12"
        },
        {
          "coreField": "second",
          "value": "4"
        },
        {
          "coreField": "total",
          "value": "16"
        }
      ],
      "strictAreaCoverage": false
    },
    {
      "id": "link-formula36-triArea",
      "sessionId": "link-formula36-triArea",
      "index": 0,
      "taskHash": "8be58c500d6013fde82e0564bedcd945ff51480699696eb155a7a11431bc01ab",
      "task": {
        "type": "x-f36-shape",
        "prompt": "先试底6、高4的三角形，猜里面的大小；再把高改成5。",
        "kind": "triangle",
        "initial": [
          6,
          4
        ],
        "required": [
          [
            6,
            4
          ],
          [
            6,
            5
          ]
        ],
        "questions": [
          {
            "label": "里面的单位",
            "value": "area",
            "kind": "choice",
            "options": [
              [
                "cm",
                "厘米"
              ],
              [
                "area",
                "平方厘米"
              ]
            ]
          }
        ]
      },
      "steps": [
        {
          "field": "value",
          "value": "12"
        },
        {
          "action": "f36-trial"
        },
        {
          "action": "f36-dim",
          "data": {
            "index": "1,1"
          }
        },
        {
          "field": "value",
          "value": "15"
        },
        {
          "action": "f36-trial"
        },
        {
          "field": "answers.0",
          "value": "area"
        }
      ],
      "strictAreaCoverage": false
    }
  ],
  "sourceHashes": {
    "dist/learning/tasks.js": "4eac447b0944644b1c1077464e849950b296fd708f7f8f0ecf9d4ac1fd7cb4a7",
    "dist/learning/learn.js": "d77aba5e39eb15985df24feba6778e3be104986bdeb9072d223a9c385b1cc033",
    "dist/learning/phase4/engine.js": "8164e3f66e9c1489ef4831a6477fe782591ea1a7bc0ed4da859fc3c575b9f9ee",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8",
    "dist/learning/phase4/b02-model.js": "b0b17bdc7f7fa95c0ad53258f2804cd06404272b1946a4e5830af3b337e55927",
    "dist/learning/phase4/b02-view.js": "209775e79fd018c63779c747b05da0d23913457b17c311df4977126da85f5e03",
    "dist/learning/phase5/b12-model.js": "121ffb6631ade31f38467d76d736cc77d57fabe8fbfd5589ca1980f1edd44d02",
    "dist/learning/phase5/b12-view.js": "d05a30460e3ed364dcccdd905ec6e5afc8c7fc75aedb75b601e832a3d60cf53c",
    "dist/learning/phase5/b13-model.js": "d5a146c466ac846dd555f833823453252f1268e6be4f4d1d845ad07c7c434cb3",
    "dist/learning/phase5/b13-view.js": "1cece24dc00f47b3d54bb1e0405d5f05270e625cd23841872cf38c96c024b6a8",
    "dist/learning/phase5/b14-model.js": "9fe453c590a81e350fcd6f9988bc44ff27727fc5c51991363db803116c8a3ea4",
    "dist/learning/phase5/b14-view.js": "964a738353548589afa95ce39eeac6b03a2e07e925b25362f567b481b273b007",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab",
    "dist/learning/phase5/b16-view.js": "2f319e0c77dcbd612cbbb71e21b728fad5e9dc7c257cbd94a6808c7ec4f459e7",
    "dist/learning/phase5/b17-model.js": "52e8665b482c26ad444c95096130ef87c89b0793038db101fcc2cce23320ae78",
    "dist/learning/phase5/b17-view.js": "7ae3320116fc5d75cc4d576794c207d1d1ea54b490f46f406403d21b1e0c5d27",
    "dist/learning/phase5/b18-model.js": "8c1f393446397b64ff583afc0d7c08486c447f6b8c6d9fbb967b6396d3c7ec74",
    "dist/learning/phase5/b18-view.js": "65b37faa851efc0d2f1b50a4f928b73a3be9aadda5fa29659c5e13475987fff9",
    "dist/learning/phase5/b23-model.js": "542c5f323b2832191f74100181f68faa4b18aa119c1cd3a7ff4fad85f8fd2265",
    "dist/learning/phase5/b23-view.js": "aeb8697a51bbd6354e5512d61ff34af9ad5eed3ed8a00176522b0bd199306f5f",
    "dist/learning/phase5/b28-model.js": "eb1ee26ca273ee1b629db0e84cc4f85d156c0569cfa751a18c208b00951c1391",
    "dist/learning/phase5/b28-view.js": "6fc48e49db9ce7c67e88c52db9740b602f42d95cd6a5756d3f2b8b3e8adb77d7",
    "dist/learning/phase5/b36-model.js": "8572b069207f8c16f6f9e597c671a7440a64e4ed03179e76c2b8e2819bfc8a20",
    "dist/learning/phase5/b36-view.js": "ab8e8d5ad3c6e48a535687248fd9ecac7c1794e34eeaeb04a057cb08508115ed",
    "dist/learning/phase5/b39-model.js": "76d3a16b0db5e3c078eaacf66b87e9fc1aeedc7447c8cd8b1fc456736294ec0e",
    "dist/learning/phase5/b39-view.js": "27e205182fa04e8de3f3c11d841742cd09fd79d47a3e458f36a1c4cea73dc7f4"
  }
};
