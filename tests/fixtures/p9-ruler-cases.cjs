// Frozen original tasks; associated and practice positions do not bind native evidence.
module.exports={
  "schema": "math-ruler-reviewed-cases/1",
  "cases": [
    {
      "role": "native",
      "id": "lengthstart",
      "index": 1,
      "nodeId": "mt_KaF0SQvaiu",
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
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "math": {
        "shape": "plain",
        "value": 7,
        "unit": "cm",
        "actual": "7",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "estimateLength",
      "index": 0,
      "nodeId": "mt_OzRZ89GrQW",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "先借助1厘米的小段估一估，再移动尺子检查。",
        "value": 12,
        "unit": "cm",
        "object": "物体",
        "questions": [],
        "axisMax": 15,
        "estimate": true,
        "estimateExample": 10
      },
      "taskHash": "16f5ac317e57f7e74457184915ffdbc779e3489a64543546c95ad291ff43974e",
      "math": {
        "shape": "estimate",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "estimateLength",
      "index": 1,
      "nodeId": "mt_OzRZ89GrQW",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "先用1米作参照，估计这段距离。",
        "value": 3,
        "unit": "m",
        "object": "物体",
        "questions": [],
        "axisMax": 5,
        "estimate": true,
        "estimateExample": 2
      },
      "taskHash": "341a694edb48cbc89df6605a200b8f97417c1e650f2b9813c5da3daace882a28",
      "math": {
        "shape": "estimate",
        "value": 3,
        "unit": "m",
        "actual": "3",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "estimateLength",
      "index": 2,
      "nodeId": "mt_OzRZ89GrQW",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "先用1英寸作参照，再估一估这段。",
        "value": 6,
        "unit": "英寸",
        "object": "物体",
        "questions": [],
        "axisMax": 8,
        "estimate": true,
        "estimateExample": 5
      },
      "taskHash": "6e8aa167d14a7016425814764863c566c9f9a8c2f5c179b7d3457ece93afd2fb",
      "math": {
        "shape": "estimate",
        "value": 6,
        "unit": "英寸",
        "actual": "6",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "estimateLength",
      "index": 3,
      "nodeId": "mt_OzRZ89GrQW",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "先用1英尺作参照，再检查估计。",
        "value": 2,
        "unit": "英尺",
        "object": "物体",
        "questions": [],
        "axisMax": 4,
        "estimate": true,
        "estimateExample": 3
      },
      "taskHash": "3bef89d793e97d52c9a9e8badc9ea7f040278777dbb852b10c83c14375df24d4",
      "math": {
        "shape": "estimate",
        "value": 2,
        "unit": "英尺",
        "actual": "2",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "lengthtools",
      "index": 0,
      "nodeId": "mt_e4x3l2JeLI",
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
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "math": {
        "shape": "tool",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "lengthtools",
      "index": 1,
      "nodeId": "mt_e4x3l2JeLI",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "量房间里的长距离：选容易拉开的工具。",
        "value": 4,
        "unit": "m",
        "object": "房间",
        "questions": [],
        "axisMax": 6,
        "tool": "tape",
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
      "taskHash": "ebeec4980aa0f504e870fce158e428abaa6abc6341c39fb5ee27f1132fc950e1",
      "math": {
        "shape": "tool",
        "value": 4,
        "unit": "m",
        "actual": "4",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "lengthtools",
      "index": 2,
      "nodeId": "mt_e4x3l2JeLI",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "量一段接近米尺长度的直线。",
        "value": 1,
        "unit": "m",
        "object": "木条",
        "questions": [],
        "axisMax": 2,
        "tool": "meter",
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
      "taskHash": "fd4b6529ab97235a1dfc5346836914179aba0b01ff4a7890de990e4dd68e4177",
      "math": {
        "shape": "tool",
        "value": 1,
        "unit": "m",
        "actual": "1",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "lengthtools",
      "index": 3,
      "nodeId": "mt_e4x3l2JeLI",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "换一把英寸尺，读出这段。",
        "value": 6,
        "unit": "英寸",
        "object": "物体",
        "questions": [],
        "axisMax": 8,
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
      "taskHash": "2a4eb437a8ec787ba835f515d1ed03071eb63211bca7fbec262c90759338ea6a",
      "math": {
        "shape": "tool",
        "value": 6,
        "unit": "英寸",
        "actual": "6",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "lengthtools",
      "index": 4,
      "nodeId": "mt_e4x3l2JeLI",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "用一把三英尺长的码尺，量这段长度。",
        "value": 3,
        "unit": "英尺",
        "object": "物体",
        "questions": [],
        "axisMax": 3,
        "tool": "yard",
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
      "taskHash": "335dba64b128357cca2adfee864c7fa018a44790d379dd5079353687bb5d2993",
      "math": {
        "shape": "tool",
        "value": 3,
        "unit": "英尺",
        "actual": "3",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "twounits",
      "index": 0,
      "nodeId": "mt_jHv4BgRK8B",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "同一张桌面模型，用厘米尺量到最接近的整厘米。",
        "value": 10,
        "unit": "cm",
        "object": "桌面",
        "questions": [],
        "actual": 10.16,
        "axisMax": 12.7,
        "tick": 0.1
      },
      "taskHash": "d8fb12f1e99f3d90d8352d65adfb49025b2f89ee438322ec078cc00f86886086",
      "math": {
        "shape": "plain",
        "value": 10,
        "unit": "cm",
        "actual": "10.16",
        "readingRule": "nearest-whole-source-unit"
      }
    },
    {
      "role": "native",
      "id": "twounits",
      "index": 1,
      "nodeId": "mt_jHv4BgRK8B",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "还是这张桌面，换英寸尺量一量。",
        "value": 4,
        "unit": "英寸",
        "object": "桌面",
        "questions": [
          {
            "label": "同一个量，单位变小时需要的数量",
            "value": "more",
            "options": [
              [
                "more",
                "通常更多"
              ],
              [
                "less",
                "一定更少"
              ]
            ]
          }
        ],
        "axisMax": 5,
        "tick": 1
      },
      "taskHash": "f39daad2ffb89f89ff9a99b9e5106c65919cc755d2647993c66903128f535271",
      "math": {
        "shape": "plain",
        "value": 4,
        "unit": "英寸",
        "actual": "4",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "measurecalc",
      "index": 0,
      "nodeId": "mt_6oxQPNLHNv",
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
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "math": {
        "shape": "plain",
        "value": 7,
        "unit": "cm",
        "actual": "7",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "measuremoney",
      "index": 0,
      "nodeId": "mt_mFJ-2ZF6Tk",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "这是模拟房间的一段距离。先用1米作参照估一估，再量；现实教室需要亲自量。",
        "value": 3,
        "unit": "m",
        "object": "物体",
        "questions": [],
        "axisMax": 5,
        "estimate": true,
        "estimateExample": 2
      },
      "taskHash": "0345e7ff933a810f9f7179d57fbcf4a43477f83f488916276b6691dbbcebb9b1",
      "math": {
        "shape": "estimate",
        "value": 3,
        "unit": "m",
        "actual": "3",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "communicate38",
      "index": 1,
      "nodeId": "mt_TMoHjMhRS2",
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
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "math": {
        "shape": "plain",
        "value": 7,
        "unit": "cm",
        "actual": "7",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "native",
      "id": "strategy39",
      "index": 2,
      "nodeId": "mt_mQcWGh02no",
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
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "math": {
        "shape": "tool",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    }
  ],
  "associated": [
    {
      "role": "associated",
      "id": "link-sameunitlength-lengthtools",
      "index": 1,
      "nodeId": "mt_e4x3l2JeLI",
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
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "math": {
        "shape": "tool",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-lengthtools-lengthdifference",
      "index": 0,
      "nodeId": "mt_xWg0lI_gG4",
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
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "math": {
        "shape": "tool",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-lengthtools-estimateLength",
      "index": 0,
      "nodeId": "mt_OzRZ89GrQW",
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
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "math": {
        "shape": "tool",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-lengthtools-estimateLength",
      "index": 1,
      "nodeId": "mt_OzRZ89GrQW",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "先借助1厘米的小段估一估，再移动尺子检查。",
        "value": 12,
        "unit": "cm",
        "object": "物体",
        "questions": [],
        "axisMax": 15,
        "estimate": true,
        "estimateExample": 10
      },
      "taskHash": "16f5ac317e57f7e74457184915ffdbc779e3489a64543546c95ad291ff43974e",
      "math": {
        "shape": "estimate",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-lengthtools-twounits",
      "index": 0,
      "nodeId": "mt_jHv4BgRK8B",
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
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "math": {
        "shape": "tool",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-lengthtools-twounits",
      "index": 1,
      "nodeId": "mt_jHv4BgRK8B",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "还是这张桌面，换英寸尺量一量。",
        "value": 4,
        "unit": "英寸",
        "object": "桌面",
        "questions": [
          {
            "label": "同一个量，单位变小时需要的数量",
            "value": "more",
            "options": [
              [
                "more",
                "通常更多"
              ],
              [
                "less",
                "一定更少"
              ]
            ]
          }
        ],
        "axisMax": 5,
        "tick": 1
      },
      "taskHash": "f39daad2ffb89f89ff9a99b9e5106c65919cc755d2647993c66903128f535271",
      "math": {
        "shape": "plain",
        "value": 4,
        "unit": "英寸",
        "actual": "4",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-lengthtools-measureplot",
      "index": 0,
      "nodeId": "mt_mayItsxMUu",
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
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "math": {
        "shape": "tool",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-measure-measurecalc",
      "index": 1,
      "nodeId": "mt_6oxQPNLHNv",
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
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "math": {
        "shape": "plain",
        "value": 7,
        "unit": "cm",
        "actual": "7",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-lengthtools-gridarea",
      "index": 0,
      "nodeId": "mt_6xNmQLzuqm",
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
      "taskHash": "e1f41a5b2900cb4fa24a2dd25beaf07e5457b209ff70d257bd3c9b381bd70ce2",
      "math": {
        "shape": "tool",
        "value": 12,
        "unit": "cm",
        "actual": "12",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-measurecalc-walkperim",
      "index": 0,
      "nodeId": "mt_wE7-Gs9ENL",
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
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "math": {
        "shape": "plain",
        "value": 7,
        "unit": "cm",
        "actual": "7",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "associated",
      "id": "link-measurecalc-measureliquid",
      "index": 0,
      "nodeId": "mt_-af65bxfdp",
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
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "math": {
        "shape": "plain",
        "value": 7,
        "unit": "cm",
        "actual": "7",
        "readingRule": "exact-source-reading"
      }
    }
  ],
  "practice": [
    {
      "role": "practice",
      "id": "estimateLength",
      "index": -1,
      "nodeId": "mt_OzRZ89GrQW",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "先用1英尺作参照，再检查估计。",
        "value": 2,
        "unit": "英尺",
        "object": "物体",
        "questions": [],
        "axisMax": 4,
        "estimate": true,
        "estimateExample": 3
      },
      "taskHash": "3bef89d793e97d52c9a9e8badc9ea7f040278777dbb852b10c83c14375df24d4",
      "math": {
        "shape": "estimate",
        "value": 2,
        "unit": "英尺",
        "actual": "2",
        "readingRule": "exact-source-reading"
      }
    },
    {
      "role": "practice",
      "id": "lengthtools",
      "index": -1,
      "nodeId": "mt_e4x3l2JeLI",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "用一把三英尺长的码尺，量这段长度。",
        "value": 3,
        "unit": "英尺",
        "object": "物体",
        "questions": [],
        "axisMax": 3,
        "tool": "yard",
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
      "taskHash": "335dba64b128357cca2adfee864c7fa018a44790d379dd5079353687bb5d2993",
      "math": {
        "shape": "tool",
        "value": 3,
        "unit": "英尺",
        "actual": "3",
        "readingRule": "exact-source-reading"
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b28.js": "83ccc714c66906c7cd375088a3fe2e5b182e2c2bf509e641fcf1614611eda057",
    "dist/learning/phase5/b28-model.js": "eb1ee26ca273ee1b629db0e84cc4f85d156c0569cfa751a18c208b00951c1391",
    "dist/learning/phase5/b28-view.js": "6fc48e49db9ce7c67e88c52db9740b602f42d95cd6a5756d3f2b8b3e8adb77d7",
    "dist/learning/phase5/b20-model.js": "d3c51d56587fc93b0b8189a7ac9a6d82dcad6b768f7b436877a362406ee7070e",
    "dist/learning/state.js": "e20c834d9741761b57c60cc0ca385d604b9b9e16e7e6a383e36ef0696a21e8db",
    "dist/exploration-core.js": "1100d47beba5120ec68f484fc154365ecdaa11d439c13ee85b6efad8c2f41002",
    "dist/storage.js": "8a7d85b66c19898560c33e372d832b7416adc153d523acd8eaec516282361bf7",
    "dist/learning/phase5/b29.js": "77b3e6ee2f704581a31d1c9389f450f527b26293069c599edd5b5d0fae4312c3",
    "dist/learning/phase5/b33.js": "1f052b2d10ac4a68b0a7b8bf34a49c286f0cb8506b32699567aed71e16dfe19f",
    "dist/learning/phase5/b38.js": "8953ff1e7e76a2bab98c2d0d94a24f9a896c5540b0127df4e95befcd5bcbcbe3",
    "dist/learning/phase5/b39.js": "f282d5afe8b478b1e6ff623424f473d42f70212142556a0a433d68d369670838",
    "dist/learning/phase5/b39-model.js": "76d3a16b0db5e3c078eaacf66b87e9fc1aeedc7447c8cd8b1fc456736294ec0e",
    "dist/learning/phase5/b39-view.js": "27e205182fa04e8de3f3c11d841742cd09fd79d47a3e458f36a1c4cea73dc7f4",
    "dist/learning/phase4/b02-model.js": "b0b17bdc7f7fa95c0ad53258f2804cd06404272b1946a4e5830af3b337e55927",
    "dist/learning/phase4/b02-view.js": "209775e79fd018c63779c747b05da0d23913457b17c311df4977126da85f5e03",
    "dist/learning/phase4/b05-model.js": "5209dfc172d08cec8dd8d1dfdadb1e290c01aa54e90f54593f405b1f1733af19",
    "dist/learning/phase4/b05-view.js": "b7ee7a5fb21bc7f3255ed39ae0306e880fa9c32a51ac9eca3b60104f756e998a",
    "dist/learning/phase4/engine.js": "8164e3f66e9c1489ef4831a6477fe782591ea1a7bc0ed4da859fc3c575b9f9ee",
    "dist/learning/phase4/view-engine.js": "22ce2022cc9fb1f4fac0cdb40ac1bd7ef24497db9d1416b219f500f630c311f1",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8",
    "dist/learning/phase4/async-batches.js": "b41324f2b0657fda3f081ae861bed8832cd60e9eb7e84456f2683de5817b9c84",
    "dist/learning/tasks.js": "4eac447b0944644b1c1077464e849950b296fd708f7f8f0ecf9d4ac1fd7cb4a7",
    "dist/learning/bridges.js": "e480fb63c69a2ee259b9bce4688d698fc61a1a910a44439e98c45cf1f7faeb15",
    "dist/learning/daily.js": "27df81463b7bcaa20e62008bad04e2b50a8438c24a48e565b96db7de5d6ba8d5",
    "dist/learning/workspace-flow.js": "3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05",
    "dist/learning/p3-view.js": "100a430403ff5e5cce93546ebbce803df84fc4c602c2b6bcf6a342d53fe68a78",
    "dist/learning/p3-workflow.js": "864f42f1e161f299536bdb44c1ccf0cf1599a6e60d16b271c4f37719b41db06a",
    "dist/learning/evidence-contract.js": "bc73050766cc97a8820bf39aed84e42ebdcbf6e4605a2128bf6ff975325f683e",
    "dist/learning/catalog.js": "6f0258d01853e8e73ca4cc0e92379f3ad97731fee2e409c73baea6fa559f8518",
    "dist/data/atlas.json": "b30b16783f518e47fed8dd6e412bb6ee6e323b5250834c0ee1c0bb68dff94caf"
  }
};
