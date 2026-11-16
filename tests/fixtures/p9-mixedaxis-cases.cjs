// Independent literal B16/B17 source positions and hand-calculated exact values.
// No production adapter, solveSteps or example supplies mathematical expectations.
// Each card keeps its identity even when another card has the same exact value.
module.exports={
  "cases": [
    {
      "id": "mixedpoints",
      "sessionId": "mixedpoints",
      "index": 1,
      "nodeId": "mt_PsylzZ9lHW",
      "taskHash": "8d9a4906907b29f163a2ec192b87e689e816c6b59e30c17a1769a773059e03ba",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-2",
          "-3/4",
          "0.6",
          "1.25"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把整数、小数、分数放到同一条线上，再按位置排起来。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            -2,
            1
          ],
          [
            -3,
            4
          ],
          [
            3,
            5
          ],
          [
            5,
            4
          ]
        ],
        "positionTexts": [
          "-2",
          "-0.75",
          "0.6",
          "1.25"
        ],
        "validOrders": [
          [
            0,
            1,
            2,
            3
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "mixedpoints",
      "sessionId": "mixedpoints",
      "index": 2,
      "nodeId": "mt_PsylzZ9lHW",
      "taskHash": "7cbe5601dd334c84a2c5e45bc33809169f7717e639c13a131568e647251f931e",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "0.07",
          "0.7",
          "3/4",
          "0.75"
        ],
        "min": -3,
        "max": 3,
        "prompt": "小数位多一定更大吗？写法不同也可以落在同一点。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            7,
            100
          ],
          [
            7,
            10
          ],
          [
            3,
            4
          ],
          [
            3,
            4
          ]
        ],
        "positionTexts": [
          "0.07",
          "0.7",
          "0.75",
          "0.75"
        ],
        "validOrders": [
          [
            0,
            1,
            2,
            3
          ],
          [
            0,
            1,
            3,
            2
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "orderforms",
      "sessionId": "orderforms",
      "index": 0,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "9b608dc584d15309b23c8f4c5543743c6c1982dff90992cdc06f16533564d771",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-2",
          "-0.8",
          "-3/4",
          "1/2",
          "0.75",
          "3/4"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把这些数放到同一条线上；相等的可以落在同一点，再从小到大排。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            -2,
            1
          ],
          [
            -4,
            5
          ],
          [
            -3,
            4
          ],
          [
            1,
            2
          ],
          [
            3,
            4
          ],
          [
            3,
            4
          ]
        ],
        "positionTexts": [
          "-2",
          "-0.8",
          "-0.75",
          "0.5",
          "0.75",
          "0.75"
        ],
        "validOrders": [
          [
            0,
            1,
            2,
            3,
            4,
            5
          ],
          [
            0,
            1,
            2,
            3,
            5,
            4
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "orderforms",
      "sessionId": "orderforms",
      "index": 1,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "9ae273408aff47ead0c6003201a85d986dbbe13c4b2d90df894314f7015f4818",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-1",
          "0",
          "1"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把三张卡摆好，再把六种不同说法与符号配准。",
        "statements": [
          {
            "a": "-1",
            "b": "0",
            "symbol": "<",
            "word": "严格小于"
          },
          {
            "a": "1",
            "b": "0",
            "symbol": ">",
            "word": "严格大于"
          },
          {
            "a": "0.75",
            "b": "3/4",
            "symbol": "=",
            "word": "等于"
          },
          {
            "a": "1/2",
            "b": "3/4",
            "symbol": "≠",
            "word": "不等于"
          },
          {
            "a": "3/4",
            "b": "0.75",
            "symbol": "≤",
            "word": "小于或等于"
          },
          {
            "a": "1",
            "b": "1",
            "symbol": "≥",
            "word": "大于或等于"
          }
        ]
      },
      "expected": {
        "cardValues": [
          [
            -1,
            1
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ]
        ],
        "positionTexts": [
          "-1",
          "0",
          "1"
        ],
        "validOrders": [
          [
            0,
            1,
            2
          ]
        ],
        "statements": [
          {
            "a": [
              -1,
              1
            ],
            "b": [
              0,
              1
            ],
            "symbol": "<",
            "word": "严格小于"
          },
          {
            "a": [
              1,
              1
            ],
            "b": [
              0,
              1
            ],
            "symbol": ">",
            "word": "严格大于"
          },
          {
            "a": [
              3,
              4
            ],
            "b": [
              3,
              4
            ],
            "symbol": "=",
            "word": "等于"
          },
          {
            "a": [
              1,
              2
            ],
            "b": [
              3,
              4
            ],
            "symbol": "≠",
            "word": "不等于"
          },
          {
            "a": [
              3,
              4
            ],
            "b": [
              3,
              4
            ],
            "symbol": "≤",
            "word": "小于或等于"
          },
          {
            "a": [
              1,
              1
            ],
            "b": [
              1,
              1
            ],
            "symbol": "≥",
            "word": "大于或等于"
          }
        ],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "orderforms",
      "sessionId": "orderforms",
      "index": 2,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "32310122c7b2f15f93c8617b567fe95303512fedd5b0160fa7b3bee408a38af9",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "0.7",
          "3/4",
          "0.75"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把0.7、3/4、0.75摆到各自位置，比较名字与大小。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            7,
            10
          ],
          [
            3,
            4
          ],
          [
            3,
            4
          ]
        ],
        "positionTexts": [
          "0.7",
          "0.75",
          "0.75"
        ],
        "validOrders": [
          [
            0,
            1,
            2
          ],
          [
            0,
            2,
            1
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "decimalorder2",
      "sessionId": "decimalorder2",
      "index": 0,
      "nodeId": "mt_IegHBHERVa",
      "taskHash": "f26ed92eca6c3a6959f1ff0f6d30fbe8d802125264105f765492df47c2539f0f",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "0.45",
          "0.54",
          "0.39"
        ],
        "min": 0,
        "max": 1,
        "prompt": "把三个两位小数放到线上，从小到大排。"
      },
      "expected": {
        "cardValues": [
          [
            9,
            20
          ],
          [
            27,
            50
          ],
          [
            39,
            100
          ]
        ],
        "positionTexts": [
          "0.45",
          "0.54",
          "0.39"
        ],
        "validOrders": [
          [
            2,
            0,
            1
          ]
        ],
        "statements": [],
        "axisMin": [
          0,
          1
        ],
        "axisMax": [
          1,
          1
        ]
      }
    },
    {
      "id": "decimalorder2",
      "sessionId": "decimalorder2",
      "index": 2,
      "nodeId": "mt_IegHBHERVa",
      "taskHash": "9eeb15ea00453c9211f501b818efb0e7a9b9a73630a6f7a8c48ea6bd7be86c0f",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "0.42",
          "0.47",
          "0.45"
        ],
        "min": 0,
        "max": 1,
        "prompt": "三个数都有四个十分之一；继续看更小的位置来安排它们。"
      },
      "expected": {
        "cardValues": [
          [
            21,
            50
          ],
          [
            47,
            100
          ],
          [
            9,
            20
          ]
        ],
        "positionTexts": [
          "0.42",
          "0.47",
          "0.45"
        ],
        "validOrders": [
          [
            0,
            2,
            1
          ]
        ],
        "statements": [],
        "axisMin": [
          0,
          1
        ],
        "axisMax": [
          1,
          1
        ]
      }
    },
    {
      "id": "raggeddecimals",
      "sessionId": "raggeddecimals",
      "index": 1,
      "nodeId": "mt_933BohS9BH",
      "taskHash": "60a06f1ebc612ae7d7ee60267e97de5059d3547abfc5f845042495d6d90e09f1",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "3.142",
          "3.14",
          "3.2"
        ],
        "min": 3,
        "max": 4,
        "prompt": "把它们放在3到4之间，别把点后的数字当成独立整数。"
      },
      "expected": {
        "cardValues": [
          [
            1571,
            500
          ],
          [
            157,
            50
          ],
          [
            16,
            5
          ]
        ],
        "positionTexts": [
          "3.142",
          "3.14",
          "3.2"
        ],
        "validOrders": [
          [
            1,
            0,
            2
          ]
        ],
        "statements": [],
        "axisMin": [
          3,
          1
        ],
        "axisMax": [
          4,
          1
        ]
      }
    }
  ],
  "bridges": [
    {
      "id": "link-orderforms-allowedrange",
      "sessionId": "link-orderforms-allowedrange",
      "index": 0,
      "nodeId": "mt_i2F1nWxJjv",
      "taskHash": "32310122c7b2f15f93c8617b567fe95303512fedd5b0160fa7b3bee408a38af9",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "0.7",
          "3/4",
          "0.75"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把0.7、3/4、0.75摆到各自位置，比较名字与大小。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            7,
            10
          ],
          [
            3,
            4
          ],
          [
            3,
            4
          ]
        ],
        "positionTexts": [
          "0.7",
          "0.75",
          "0.75"
        ],
        "validOrders": [
          [
            0,
            1,
            2
          ],
          [
            0,
            2,
            1
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "link-orderforms-allowedrange",
      "sessionId": "link-orderforms-allowedrange",
      "index": 1,
      "nodeId": "mt_i2F1nWxJjv",
      "taskHash": "9ae273408aff47ead0c6003201a85d986dbbe13c4b2d90df894314f7015f4818",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-1",
          "0",
          "1"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把三张卡摆好，再把六种不同说法与符号配准。",
        "statements": [
          {
            "a": "-1",
            "b": "0",
            "symbol": "<",
            "word": "严格小于"
          },
          {
            "a": "1",
            "b": "0",
            "symbol": ">",
            "word": "严格大于"
          },
          {
            "a": "0.75",
            "b": "3/4",
            "symbol": "=",
            "word": "等于"
          },
          {
            "a": "1/2",
            "b": "3/4",
            "symbol": "≠",
            "word": "不等于"
          },
          {
            "a": "3/4",
            "b": "0.75",
            "symbol": "≤",
            "word": "小于或等于"
          },
          {
            "a": "1",
            "b": "1",
            "symbol": "≥",
            "word": "大于或等于"
          }
        ]
      },
      "expected": {
        "cardValues": [
          [
            -1,
            1
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ]
        ],
        "positionTexts": [
          "-1",
          "0",
          "1"
        ],
        "validOrders": [
          [
            0,
            1,
            2
          ]
        ],
        "statements": [
          {
            "a": [
              -1,
              1
            ],
            "b": [
              0,
              1
            ],
            "symbol": "<",
            "word": "严格小于"
          },
          {
            "a": [
              1,
              1
            ],
            "b": [
              0,
              1
            ],
            "symbol": ">",
            "word": "严格大于"
          },
          {
            "a": [
              3,
              4
            ],
            "b": [
              3,
              4
            ],
            "symbol": "=",
            "word": "等于"
          },
          {
            "a": [
              1,
              2
            ],
            "b": [
              3,
              4
            ],
            "symbol": "≠",
            "word": "不等于"
          },
          {
            "a": [
              3,
              4
            ],
            "b": [
              3,
              4
            ],
            "symbol": "≤",
            "word": "小于或等于"
          },
          {
            "a": [
              1,
              1
            ],
            "b": [
              1,
              1
            ],
            "symbol": "≥",
            "word": "大于或等于"
          }
        ],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "link-signedwalk-orderforms",
      "sessionId": "link-signedwalk-orderforms",
      "index": 0,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "6a7552bb99484cb3f80b7b74201a2f60b53002749bdccec0335c5b54ff1f7f00",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-2",
          "-1",
          "0",
          "1"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把正数与负数放到同一条线上。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            -2,
            1
          ],
          [
            -1,
            1
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ]
        ],
        "positionTexts": [
          "-2",
          "-1",
          "0",
          "1"
        ],
        "validOrders": [
          [
            0,
            1,
            2,
            3
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "link-signedwalk-orderforms",
      "sessionId": "link-signedwalk-orderforms",
      "index": 1,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "9b608dc584d15309b23c8f4c5543743c6c1982dff90992cdc06f16533564d771",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-2",
          "-0.8",
          "-3/4",
          "1/2",
          "0.75",
          "3/4"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把这些数放到同一条线上；相等的可以落在同一点，再从小到大排。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            -2,
            1
          ],
          [
            -4,
            5
          ],
          [
            -3,
            4
          ],
          [
            1,
            2
          ],
          [
            3,
            4
          ],
          [
            3,
            4
          ]
        ],
        "positionTexts": [
          "-2",
          "-0.8",
          "-0.75",
          "0.5",
          "0.75",
          "0.75"
        ],
        "validOrders": [
          [
            0,
            1,
            2,
            3,
            4,
            5
          ],
          [
            0,
            1,
            2,
            3,
            5,
            4
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "link-mixedpoints-orderforms",
      "sessionId": "link-mixedpoints-orderforms",
      "index": 0,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "8d9a4906907b29f163a2ec192b87e689e816c6b59e30c17a1769a773059e03ba",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-2",
          "-3/4",
          "0.6",
          "1.25"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把整数、小数、分数放到同一条线上，再按位置排起来。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            -2,
            1
          ],
          [
            -3,
            4
          ],
          [
            3,
            5
          ],
          [
            5,
            4
          ]
        ],
        "positionTexts": [
          "-2",
          "-0.75",
          "0.6",
          "1.25"
        ],
        "validOrders": [
          [
            0,
            1,
            2,
            3
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "link-mixedpoints-orderforms",
      "sessionId": "link-mixedpoints-orderforms",
      "index": 1,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "9ae273408aff47ead0c6003201a85d986dbbe13c4b2d90df894314f7015f4818",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-1",
          "0",
          "1"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把三张卡摆好，再把六种不同说法与符号配准。",
        "statements": [
          {
            "a": "-1",
            "b": "0",
            "symbol": "<",
            "word": "严格小于"
          },
          {
            "a": "1",
            "b": "0",
            "symbol": ">",
            "word": "严格大于"
          },
          {
            "a": "0.75",
            "b": "3/4",
            "symbol": "=",
            "word": "等于"
          },
          {
            "a": "1/2",
            "b": "3/4",
            "symbol": "≠",
            "word": "不等于"
          },
          {
            "a": "3/4",
            "b": "0.75",
            "symbol": "≤",
            "word": "小于或等于"
          },
          {
            "a": "1",
            "b": "1",
            "symbol": "≥",
            "word": "大于或等于"
          }
        ]
      },
      "expected": {
        "cardValues": [
          [
            -1,
            1
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ]
        ],
        "positionTexts": [
          "-1",
          "0",
          "1"
        ],
        "validOrders": [
          [
            0,
            1,
            2
          ]
        ],
        "statements": [
          {
            "a": [
              -1,
              1
            ],
            "b": [
              0,
              1
            ],
            "symbol": "<",
            "word": "严格小于"
          },
          {
            "a": [
              1,
              1
            ],
            "b": [
              0,
              1
            ],
            "symbol": ">",
            "word": "严格大于"
          },
          {
            "a": [
              3,
              4
            ],
            "b": [
              3,
              4
            ],
            "symbol": "=",
            "word": "等于"
          },
          {
            "a": [
              1,
              2
            ],
            "b": [
              3,
              4
            ],
            "symbol": "≠",
            "word": "不等于"
          },
          {
            "a": [
              3,
              4
            ],
            "b": [
              3,
              4
            ],
            "symbol": "≤",
            "word": "小于或等于"
          },
          {
            "a": [
              1,
              1
            ],
            "b": [
              1,
              1
            ],
            "symbol": "≥",
            "word": "大于或等于"
          }
        ],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "link-thousandparts-raggeddecimals",
      "sessionId": "link-thousandparts-raggeddecimals",
      "index": 1,
      "nodeId": "mt_933BohS9BH",
      "taskHash": "60a06f1ebc612ae7d7ee60267e97de5059d3547abfc5f845042495d6d90e09f1",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "3.142",
          "3.14",
          "3.2"
        ],
        "min": 3,
        "max": 4,
        "prompt": "把它们放在3到4之间，别把点后的数字当成独立整数。"
      },
      "expected": {
        "cardValues": [
          [
            1571,
            500
          ],
          [
            157,
            50
          ],
          [
            16,
            5
          ]
        ],
        "positionTexts": [
          "3.142",
          "3.14",
          "3.2"
        ],
        "validOrders": [
          [
            1,
            0,
            2
          ]
        ],
        "statements": [],
        "axisMin": [
          3,
          1
        ],
        "axisMax": [
          4,
          1
        ]
      }
    },
    {
      "id": "link-decimal-decimalorder2",
      "sessionId": "link-decimal-decimalorder2",
      "index": 1,
      "nodeId": "mt_IegHBHERVa",
      "taskHash": "f26ed92eca6c3a6959f1ff0f6d30fbe8d802125264105f765492df47c2539f0f",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "0.45",
          "0.54",
          "0.39"
        ],
        "min": 0,
        "max": 1,
        "prompt": "把三个两位小数放到线上，从小到大排。"
      },
      "expected": {
        "cardValues": [
          [
            9,
            20
          ],
          [
            27,
            50
          ],
          [
            39,
            100
          ]
        ],
        "positionTexts": [
          "0.45",
          "0.54",
          "0.39"
        ],
        "validOrders": [
          [
            2,
            0,
            1
          ]
        ],
        "statements": [],
        "axisMin": [
          0,
          1
        ],
        "axisMax": [
          1,
          1
        ]
      }
    },
    {
      "id": "link-temperaturechange-orderforms",
      "sessionId": "link-temperaturechange-orderforms",
      "index": 1,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "9b608dc584d15309b23c8f4c5543743c6c1982dff90992cdc06f16533564d771",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-2",
          "-0.8",
          "-3/4",
          "1/2",
          "0.75",
          "3/4"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把这些数放到同一条线上；相等的可以落在同一点，再从小到大排。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            -2,
            1
          ],
          [
            -4,
            5
          ],
          [
            -3,
            4
          ],
          [
            1,
            2
          ],
          [
            3,
            4
          ],
          [
            3,
            4
          ]
        ],
        "positionTexts": [
          "-2",
          "-0.8",
          "-0.75",
          "0.5",
          "0.75",
          "0.75"
        ],
        "validOrders": [
          [
            0,
            1,
            2,
            3,
            4,
            5
          ],
          [
            0,
            1,
            2,
            3,
            5,
            4
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "link-orderforms-coords36",
      "sessionId": "link-orderforms-coords36",
      "index": 0,
      "nodeId": "mt_hVpGOEz2kG",
      "taskHash": "9ae273408aff47ead0c6003201a85d986dbbe13c4b2d90df894314f7015f4818",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-1",
          "0",
          "1"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把三张卡摆好，再把六种不同说法与符号配准。",
        "statements": [
          {
            "a": "-1",
            "b": "0",
            "symbol": "<",
            "word": "严格小于"
          },
          {
            "a": "1",
            "b": "0",
            "symbol": ">",
            "word": "严格大于"
          },
          {
            "a": "0.75",
            "b": "3/4",
            "symbol": "=",
            "word": "等于"
          },
          {
            "a": "1/2",
            "b": "3/4",
            "symbol": "≠",
            "word": "不等于"
          },
          {
            "a": "3/4",
            "b": "0.75",
            "symbol": "≤",
            "word": "小于或等于"
          },
          {
            "a": "1",
            "b": "1",
            "symbol": "≥",
            "word": "大于或等于"
          }
        ]
      },
      "expected": {
        "cardValues": [
          [
            -1,
            1
          ],
          [
            0,
            1
          ],
          [
            1,
            1
          ]
        ],
        "positionTexts": [
          "-1",
          "0",
          "1"
        ],
        "validOrders": [
          [
            0,
            1,
            2
          ]
        ],
        "statements": [
          {
            "a": [
              -1,
              1
            ],
            "b": [
              0,
              1
            ],
            "symbol": "<",
            "word": "严格小于"
          },
          {
            "a": [
              1,
              1
            ],
            "b": [
              0,
              1
            ],
            "symbol": ">",
            "word": "严格大于"
          },
          {
            "a": [
              3,
              4
            ],
            "b": [
              3,
              4
            ],
            "symbol": "=",
            "word": "等于"
          },
          {
            "a": [
              1,
              2
            ],
            "b": [
              3,
              4
            ],
            "symbol": "≠",
            "word": "不等于"
          },
          {
            "a": [
              3,
              4
            ],
            "b": [
              3,
              4
            ],
            "symbol": "≤",
            "word": "小于或等于"
          },
          {
            "a": [
              1,
              1
            ],
            "b": [
              1,
              1
            ],
            "symbol": "≥",
            "word": "大于或等于"
          }
        ],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    }
  ],
  "practices": [
    {
      "id": "orderforms",
      "sessionId": "orderforms",
      "index": -1,
      "nodeId": "mt_uDJY0X0hgo",
      "taskHash": "9b608dc584d15309b23c8f4c5543743c6c1982dff90992cdc06f16533564d771",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "-2",
          "-0.8",
          "-3/4",
          "1/2",
          "0.75",
          "3/4"
        ],
        "min": -3,
        "max": 3,
        "prompt": "把这些数放到同一条线上；相等的可以落在同一点，再从小到大排。",
        "statements": []
      },
      "expected": {
        "cardValues": [
          [
            -2,
            1
          ],
          [
            -4,
            5
          ],
          [
            -3,
            4
          ],
          [
            1,
            2
          ],
          [
            3,
            4
          ],
          [
            3,
            4
          ]
        ],
        "positionTexts": [
          "-2",
          "-0.8",
          "-0.75",
          "0.5",
          "0.75",
          "0.75"
        ],
        "validOrders": [
          [
            0,
            1,
            2,
            3,
            4,
            5
          ],
          [
            0,
            1,
            2,
            3,
            5,
            4
          ]
        ],
        "statements": [],
        "axisMin": [
          -3,
          1
        ],
        "axisMax": [
          3,
          1
        ]
      }
    },
    {
      "id": "decimalorder2",
      "sessionId": "decimalorder2",
      "index": -1,
      "nodeId": "mt_IegHBHERVa",
      "taskHash": "f26ed92eca6c3a6959f1ff0f6d30fbe8d802125264105f765492df47c2539f0f",
      "task": {
        "type": "x-mixedaxis",
        "cards": [
          "0.45",
          "0.54",
          "0.39"
        ],
        "min": 0,
        "max": 1,
        "prompt": "把三个两位小数放到线上，从小到大排。"
      },
      "expected": {
        "cardValues": [
          [
            9,
            20
          ],
          [
            27,
            50
          ],
          [
            39,
            100
          ]
        ],
        "positionTexts": [
          "0.45",
          "0.54",
          "0.39"
        ],
        "validOrders": [
          [
            2,
            0,
            1
          ]
        ],
        "statements": [],
        "axisMin": [
          0,
          1
        ],
        "axisMax": [
          1,
          1
        ]
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b16.js": "32dd356d23a765122b60e0c40d804d7ee9353e3950757386704a6e9435e39d79",
    "dist/learning/phase5/b17.js": "7598232e6f0d99ffbfedbd1e2bd923c45dec5afc935bfc7fca415ed5370bb9b2",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab",
    "dist/learning/phase5/b16-view.js": "2f319e0c77dcbd612cbbb71e21b728fad5e9dc7c257cbd94a6808c7ec4f459e7",
    "dist/learning/phase5/b17-model.js": "52e8665b482c26ad444c95096130ef87c89b0793038db101fcc2cce23320ae78",
    "dist/learning/phase5/b17-view.js": "7ae3320116fc5d75cc4d576794c207d1d1ea54b490f46f406403d21b1e0c5d27",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8"
  }
};
