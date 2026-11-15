// Independent original source positions and manually reviewed rational expectations.
// This fixture is test-only. No production adapter or author solver supplies its mathematical oracle.
module.exports={
  "cases": [
    {
      "id": "portionoperator",
      "sessionId": "portionoperator",
      "index": 0,
      "nodeId": "mt_J339bO7qLe",
      "taskHash": "9c9f558723210928b4fcaa50d7abc8a8e2a80a5ac9b8de7a431650c70fbc05a2",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/4",
            "mode": "take",
            "label": "取200颗的3/4"
          }
        ],
        "prompt": "先平均分成几份，再取其中几份；一小份与总共取出的量分别是多少？",
        "unit": "颗"
      },
      "start": [
        200,
        1
      ],
      "unit": "颗",
      "expectedStages": [
        {
          "before": [
            200,
            1
          ],
          "ratio": [
            3,
            4
          ],
          "mode": "take",
          "amount": [
            150,
            1
          ],
          "result": [
            150,
            1
          ],
          "denominator": 4,
          "pieceValue": [
            50,
            1
          ],
          "decimalRequired": false,
          "percent": null
        }
      ],
      "result": [
        150,
        1
      ]
    },
    {
      "id": "portionoperator",
      "sessionId": "portionoperator",
      "index": 1,
      "nodeId": "mt_J339bO7qLe",
      "taskHash": "5219ff27ddfd9f002ae75e43bd5421f67d8e2df2ba7a8447c153bdf05b442313",
      "task": {
        "type": "x-scalechain",
        "start": "60",
        "stages": [
          {
            "ratio": "1/5",
            "mode": "take",
            "percent": 20,
            "decimal": true,
            "label": "取60颗的20%"
          }
        ],
        "prompt": "20%表示每100份取20份，也可以按五等份来取。把它写成小数倍数，再算。",
        "unit": "颗"
      },
      "start": [
        60,
        1
      ],
      "unit": "颗",
      "expectedStages": [
        {
          "before": [
            60,
            1
          ],
          "ratio": [
            1,
            5
          ],
          "mode": "take",
          "amount": [
            12,
            1
          ],
          "result": [
            12,
            1
          ],
          "denominator": 5,
          "pieceValue": [
            12,
            1
          ],
          "decimalRequired": true,
          "percent": 20
        }
      ],
      "result": [
        12,
        1
      ]
    },
    {
      "id": "portionoperator",
      "sessionId": "portionoperator",
      "index": 2,
      "nodeId": "mt_J339bO7qLe",
      "taskHash": "4da41a6b5acdeb105b8421bdb2ef77c45eeaec489e4d047590818b6ebc006b68",
      "task": {
        "type": "x-scalechain",
        "start": "45",
        "stages": [
          {
            "ratio": "1/5",
            "mode": "off",
            "percent": 20,
            "decimal": true,
            "label": "先减去原价的20%"
          },
          {
            "ratio": "1/10",
            "mode": "add",
            "percent": 10,
            "decimal": true,
            "label": "按折后金额，增加10%模拟税额"
          },
          {
            "ratio": "1/2",
            "mode": "take",
            "label": "再取最终金额的一半"
          }
        ],
        "prompt": "虚构结算练习：45元先打八折，按折后价另加10%模拟税额，最后两人各付一半。每一步的整个是什么？",
        "unit": "元"
      },
      "start": [
        45,
        1
      ],
      "unit": "元",
      "expectedStages": [
        {
          "before": [
            45,
            1
          ],
          "ratio": [
            1,
            5
          ],
          "mode": "off",
          "amount": [
            9,
            1
          ],
          "result": [
            36,
            1
          ],
          "denominator": 5,
          "pieceValue": [
            9,
            1
          ],
          "decimalRequired": true,
          "percent": 20
        },
        {
          "before": [
            36,
            1
          ],
          "ratio": [
            1,
            10
          ],
          "mode": "add",
          "amount": [
            18,
            5
          ],
          "result": [
            198,
            5
          ],
          "denominator": 10,
          "pieceValue": [
            18,
            5
          ],
          "decimalRequired": true,
          "percent": 10
        },
        {
          "before": [
            198,
            5
          ],
          "ratio": [
            1,
            2
          ],
          "mode": "take",
          "amount": [
            99,
            5
          ],
          "result": [
            99,
            5
          ],
          "denominator": 2,
          "pieceValue": [
            99,
            5
          ],
          "decimalRequired": false,
          "percent": null
        }
      ],
      "result": [
        99,
        5
      ]
    },
    {
      "id": "portionoperator",
      "sessionId": "portionoperator",
      "index": 3,
      "nodeId": "mt_J339bO7qLe",
      "taskHash": "913fbb7877f747e40be091669fda48b0b4ae7be385cb1edec0fd16b628397bdc",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/2",
            "mode": "take",
            "percent": 150,
            "decimal": true,
            "label": "取200颗的150%"
          }
        ],
        "prompt": "百分数也可以超过100%。要拿一份半时，整体的大小不能悄悄改变。",
        "unit": "颗"
      },
      "start": [
        200,
        1
      ],
      "unit": "颗",
      "expectedStages": [
        {
          "before": [
            200,
            1
          ],
          "ratio": [
            3,
            2
          ],
          "mode": "take",
          "amount": [
            300,
            1
          ],
          "result": [
            300,
            1
          ],
          "denominator": 2,
          "pieceValue": [
            100,
            1
          ],
          "decimalRequired": true,
          "percent": 150
        }
      ],
      "result": [
        300,
        1
      ]
    },
    {
      "id": "pctNames37",
      "sessionId": "pctNames37",
      "index": 1,
      "nodeId": "mt_4ubP_RMg9o",
      "taskHash": "153cb875975df6dd3673301ce145d3a2cea6bf83caee563fc3af5fd06ccf5580",
      "task": {
        "type": "x-scalechain",
        "start": "60",
        "stages": [
          {
            "ratio": "1/5",
            "mode": "take",
            "label": "60个里取20%。先平均分，再取一份。",
            "percent": 20,
            "decimal": true
          }
        ],
        "prompt": "60个里取20%。先平均分，再取一份。",
        "unit": "个"
      },
      "start": [
        60,
        1
      ],
      "unit": "个",
      "expectedStages": [
        {
          "before": [
            60,
            1
          ],
          "ratio": [
            1,
            5
          ],
          "mode": "take",
          "amount": [
            12,
            1
          ],
          "result": [
            12,
            1
          ],
          "denominator": 5,
          "pieceValue": [
            12,
            1
          ],
          "decimalRequired": true,
          "percent": 20
        }
      ],
      "result": [
        12,
        1
      ]
    },
    {
      "id": "pctNames37",
      "sessionId": "pctNames37",
      "index": 3,
      "nodeId": "mt_4ubP_RMg9o",
      "taskHash": "3706182b1013572189bef4f206ec7b36811ae2dbcdb645558e007ede72760af4",
      "task": {
        "type": "x-scalechain",
        "start": "40",
        "stages": [
          {
            "ratio": "1/4",
            "mode": "off",
            "label": "虚构商店：40元减去25%，剩下多少？先区分拿走与留下。",
            "percent": 25,
            "decimal": true
          }
        ],
        "prompt": "虚构商店：40元减去25%，剩下多少？先区分拿走与留下。",
        "unit": "元"
      },
      "start": [
        40,
        1
      ],
      "unit": "元",
      "expectedStages": [
        {
          "before": [
            40,
            1
          ],
          "ratio": [
            1,
            4
          ],
          "mode": "off",
          "amount": [
            10,
            1
          ],
          "result": [
            30,
            1
          ],
          "denominator": 4,
          "pieceValue": [
            10,
            1
          ],
          "decimalRequired": true,
          "percent": 25
        }
      ],
      "result": [
        30,
        1
      ]
    },
    {
      "id": "pctFraction37",
      "sessionId": "pctFraction37",
      "index": 2,
      "nodeId": "mt_ALUrJpY0cZ",
      "taskHash": "177399cbff461ddbf5e2e223c9ac89361ce71f2b0596a50d8179534c137bd886",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/2",
            "mode": "take",
            "label": "取200颗的150%。先摆出一个整个，再取半个。",
            "percent": 150,
            "decimal": true
          }
        ],
        "prompt": "取200颗的150%。先摆出一个整个，再取半个。",
        "unit": "颗"
      },
      "start": [
        200,
        1
      ],
      "unit": "颗",
      "expectedStages": [
        {
          "before": [
            200,
            1
          ],
          "ratio": [
            3,
            2
          ],
          "mode": "take",
          "amount": [
            300,
            1
          ],
          "result": [
            300,
            1
          ],
          "denominator": 2,
          "pieceValue": [
            100,
            1
          ],
          "decimalRequired": true,
          "percent": 150
        }
      ],
      "result": [
        300,
        1
      ]
    },
    {
      "id": "pctFraction37",
      "sessionId": "pctFraction37",
      "index": 3,
      "nodeId": "mt_ALUrJpY0cZ",
      "taskHash": "64281683fecde294396af06415c0ee60f144992d453c9d2b8883a1508a455c99",
      "task": {
        "type": "x-scalechain",
        "start": "100",
        "stages": [
          {
            "ratio": "1/5",
            "mode": "add",
            "label": "100元增加20%，增加多少，最后是多少？",
            "percent": 20,
            "decimal": true
          }
        ],
        "prompt": "100元增加20%，增加多少，最后是多少？",
        "unit": "元"
      },
      "start": [
        100,
        1
      ],
      "unit": "元",
      "expectedStages": [
        {
          "before": [
            100,
            1
          ],
          "ratio": [
            1,
            5
          ],
          "mode": "add",
          "amount": [
            20,
            1
          ],
          "result": [
            120,
            1
          ],
          "denominator": 5,
          "pieceValue": [
            20,
            1
          ],
          "decimalRequired": true,
          "percent": 20
        }
      ],
      "result": [
        120,
        1
      ]
    },
    {
      "id": "pctFraction37",
      "sessionId": "pctFraction37",
      "index": 4,
      "nodeId": "mt_ALUrJpY0cZ",
      "taskHash": "3c69ec4bfa5a8383f2df972c4690b538b96f3249388ce282373f0240fd3d273f",
      "task": {
        "type": "x-scalechain",
        "start": "100",
        "stages": [
          {
            "ratio": "1/10",
            "mode": "off",
            "label": "换成减少10%，分清减少的量和剩下的量。",
            "percent": 10,
            "decimal": true
          }
        ],
        "prompt": "换成减少10%，分清减少的量和剩下的量。",
        "unit": "元"
      },
      "start": [
        100,
        1
      ],
      "unit": "元",
      "expectedStages": [
        {
          "before": [
            100,
            1
          ],
          "ratio": [
            1,
            10
          ],
          "mode": "off",
          "amount": [
            10,
            1
          ],
          "result": [
            90,
            1
          ],
          "denominator": 10,
          "pieceValue": [
            10,
            1
          ],
          "decimalRequired": true,
          "percent": 10
        }
      ],
      "result": [
        90,
        1
      ]
    },
    {
      "id": "model38",
      "sessionId": "model38",
      "index": 2,
      "nodeId": "mt_8xVHooT4aI",
      "taskHash": "3706182b1013572189bef4f206ec7b36811ae2dbcdb645558e007ede72760af4",
      "task": {
        "type": "x-scalechain",
        "start": "40",
        "stages": [
          {
            "ratio": "1/4",
            "mode": "off",
            "label": "虚构商店：40元减去25%，剩下多少？先区分拿走与留下。",
            "percent": 25,
            "decimal": true
          }
        ],
        "prompt": "虚构商店：40元减去25%，剩下多少？先区分拿走与留下。",
        "unit": "元"
      },
      "start": [
        40,
        1
      ],
      "unit": "元",
      "expectedStages": [
        {
          "before": [
            40,
            1
          ],
          "ratio": [
            1,
            4
          ],
          "mode": "off",
          "amount": [
            10,
            1
          ],
          "result": [
            30,
            1
          ],
          "denominator": 4,
          "pieceValue": [
            10,
            1
          ],
          "decimalRequired": true,
          "percent": 25
        }
      ],
      "result": [
        30,
        1
      ]
    }
  ],
  "bridges": [
    {
      "id": "link-scale-fractionrecipe",
      "sessionId": "link-scale-fractionrecipe",
      "index": 0,
      "fromNodeId": "mt_VKW8lOcFaw",
      "nodeId": "mt_lvaSGHwvQ5",
      "taskHash": "913fbb7877f747e40be091669fda48b0b4ae7be385cb1edec0fd16b628397bdc",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/2",
            "mode": "take",
            "percent": 150,
            "decimal": true,
            "label": "取200颗的150%"
          }
        ],
        "prompt": "百分数也可以超过100%。要拿一份半时，整体的大小不能悄悄改变。",
        "unit": "颗"
      }
    },
    {
      "id": "link-fractionarea-scale",
      "sessionId": "link-fractionarea-scale",
      "index": 1,
      "fromNodeId": "mt_gx6KQK5-Kx",
      "nodeId": "mt_VKW8lOcFaw",
      "taskHash": "913fbb7877f747e40be091669fda48b0b4ae7be385cb1edec0fd16b628397bdc",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/2",
            "mode": "take",
            "percent": 150,
            "decimal": true,
            "label": "取200颗的150%"
          }
        ],
        "prompt": "百分数也可以超过100%。要拿一份半时，整体的大小不能悄悄改变。",
        "unit": "颗"
      }
    },
    {
      "id": "link-pctCalculate37-pctFraction37",
      "sessionId": "link-pctCalculate37-pctFraction37",
      "index": 1,
      "fromNodeId": "mt_PNSyfH56eQ",
      "nodeId": "mt_ALUrJpY0cZ",
      "taskHash": "177399cbff461ddbf5e2e223c9ac89361ce71f2b0596a50d8179534c137bd886",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/2",
            "mode": "take",
            "label": "取200颗的150%。先摆出一个整个，再取半个。",
            "percent": 150,
            "decimal": true
          }
        ],
        "prompt": "取200颗的150%。先摆出一个整个，再取半个。",
        "unit": "颗"
      }
    },
    {
      "id": "link-pctFraction37-portionoperator",
      "sessionId": "link-pctFraction37-portionoperator",
      "index": 0,
      "fromNodeId": "mt_ALUrJpY0cZ",
      "nodeId": "mt_J339bO7qLe",
      "taskHash": "177399cbff461ddbf5e2e223c9ac89361ce71f2b0596a50d8179534c137bd886",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/2",
            "mode": "take",
            "label": "取200颗的150%。先摆出一个整个，再取半个。",
            "percent": 150,
            "decimal": true
          }
        ],
        "prompt": "取200颗的150%。先摆出一个整个，再取半个。",
        "unit": "颗"
      }
    },
    {
      "id": "link-pctFraction37-portionoperator",
      "sessionId": "link-pctFraction37-portionoperator",
      "index": 1,
      "fromNodeId": "mt_ALUrJpY0cZ",
      "nodeId": "mt_J339bO7qLe",
      "taskHash": "9c9f558723210928b4fcaa50d7abc8a8e2a80a5ac9b8de7a431650c70fbc05a2",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/4",
            "mode": "take",
            "label": "取200颗的3/4"
          }
        ],
        "prompt": "先平均分成几份，再取其中几份；一小份与总共取出的量分别是多少？",
        "unit": "颗"
      }
    }
  ],
  "practices": [
    {
      "id": "portionoperator",
      "sessionId": "portionoperator",
      "index": -1,
      "nodeId": "mt_J339bO7qLe",
      "taskHash": "9c9f558723210928b4fcaa50d7abc8a8e2a80a5ac9b8de7a431650c70fbc05a2",
      "task": {
        "type": "x-scalechain",
        "start": "200",
        "stages": [
          {
            "ratio": "3/4",
            "mode": "take",
            "label": "取200颗的3/4"
          }
        ],
        "prompt": "先平均分成几份，再取其中几份；一小份与总共取出的量分别是多少？",
        "unit": "颗"
      }
    },
    {
      "id": "model38",
      "sessionId": "model38",
      "index": -1,
      "nodeId": "mt_8xVHooT4aI",
      "taskHash": "3706182b1013572189bef4f206ec7b36811ae2dbcdb645558e007ede72760af4",
      "task": {
        "type": "x-scalechain",
        "start": "40",
        "stages": [
          {
            "ratio": "1/4",
            "mode": "off",
            "label": "虚构商店：40元减去25%，剩下多少？先区分拿走与留下。",
            "percent": 25,
            "decimal": true
          }
        ],
        "prompt": "虚构商店：40元减去25%，剩下多少？先区分拿走与留下。",
        "unit": "元"
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b18.js": "42a8183150eac38507cba09cbae6b9adc2ee0ff43dd4f820a56e4c17f8c05dd9",
    "dist/learning/phase5/b37.js": "132f28ca3314478002e985a11968380908943336a6cf0bae28bc0c3c57591352",
    "dist/learning/phase5/b38.js": "8953ff1e7e76a2bab98c2d0d94a24f9a896c5540b0127df4e95befcd5bcbcbe3",
    "dist/learning/phase5/b38-more.js": "cc37b490b4e52c55b26c798999e84217c38b0ebd759e96def805ecd50478a887",
    "dist/learning/phase5/b18-model.js": "8c1f393446397b64ff583afc0d7c08486c447f6b8c6d9fbb967b6396d3c7ec74",
    "dist/learning/phase5/b18-view.js": "65b37faa851efc0d2f1b50a4f928b73a3be9aadda5fa29659c5e13475987fff9",
    "dist/learning/phase5/b17-model.js": "52e8665b482c26ad444c95096130ef87c89b0793038db101fcc2cce23320ae78",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab"
  }
};
