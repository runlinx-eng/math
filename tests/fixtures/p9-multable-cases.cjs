// Original task fingerprints and separately calculated integer column/row quantities.
module.exports={
  "schema": "math-multable-reviewed-cases/1",
  "cases": [
    {
      "id": "writtenstart",
      "index": 2,
      "nodeId": "mt_DyGBW3ZHh3",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 23,
        "b": 4,
        "estimate": 20,
        "prompt": "把刚才的23×4按列记。每次算的这一位是什么单位？"
      },
      "taskHash": "c1216ca5f5a93bc5093a1d9c0785bbe18c2a0cc1a2f256617f21b0cdac1c9617",
      "math": {
        "product": 92,
        "estimatedProduct": 80,
        "trades": 1,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 4,
            "shift": 0,
            "unshifted": 92,
            "value": 92,
            "digits": [
              2,
              9
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 4,
                "incoming": 0,
                "raw": 12,
                "trades": 1,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 2,
                "bDigit": 4,
                "incoming": 1,
                "raw": 9,
                "trades": 0,
                "loose": 9
              }
            ]
          }
        ]
      }
    },
    {
      "id": "shortproduct",
      "index": 0,
      "nodeId": "mt_18fK9sQdIz",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 47,
        "b": 6,
        "estimate": 50,
        "prompt": "47×6：先估，再从个位乘。十个换一捆，送到前面。"
      },
      "taskHash": "fd3f22c611a3ae8ee479910cf12f96709d0a27ede8345834f3b1feb1cc80c2da",
      "math": {
        "product": 282,
        "estimatedProduct": 300,
        "trades": 6,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 6,
            "shift": 0,
            "unshifted": 282,
            "value": 282,
            "digits": [
              2,
              8
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 7,
                "bDigit": 6,
                "incoming": 0,
                "raw": 42,
                "trades": 4,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 6,
                "incoming": 4,
                "raw": 28,
                "trades": 2,
                "loose": 8
              }
            ]
          }
        ]
      }
    },
    {
      "id": "shortproduct",
      "index": 1,
      "nodeId": "mt_18fK9sQdIz",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 234,
        "b": 5,
        "estimate": 200,
        "prompt": "234×5：先借200×5估一估，再让进位走到正确的位置。"
      },
      "taskHash": "5676c78aa89f1b42966e39bc8a5271060b5273ed87fafb213c928fa92cfb785b",
      "math": {
        "product": 1170,
        "estimatedProduct": 1000,
        "trades": 4,
        "columnCount": 3,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 5,
            "shift": 0,
            "unshifted": 1170,
            "value": 1170,
            "digits": [
              0,
              7,
              1
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 5,
                "incoming": 0,
                "raw": 20,
                "trades": 2,
                "loose": 0
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 5,
                "incoming": 2,
                "raw": 17,
                "trades": 1,
                "loose": 7
              },
              {
                "column": 2,
                "aDigit": 2,
                "bDigit": 5,
                "incoming": 1,
                "raw": 11,
                "trades": 1,
                "loose": 1
              }
            ]
          }
        ]
      }
    },
    {
      "id": "shortproduct",
      "index": 2,
      "nodeId": "mt_18fK9sQdIz",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 306,
        "b": 7,
        "estimate": 300,
        "prompt": "306×7：中间这一位是0，也不能跳掉它的位置。"
      },
      "taskHash": "40ef3878b7bff1f2e2929e5191fc163c08985a3aa7a746068ae83c8385b55072",
      "math": {
        "product": 2142,
        "estimatedProduct": 2100,
        "trades": 6,
        "columnCount": 3,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 2142,
            "value": 2142,
            "digits": [
              2,
              4,
              1
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 6,
                "bDigit": 7,
                "incoming": 0,
                "raw": 42,
                "trades": 4,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 0,
                "bDigit": 7,
                "incoming": 4,
                "raw": 4,
                "trades": 0,
                "loose": 4
              },
              {
                "column": 2,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 0,
                "raw": 21,
                "trades": 2,
                "loose": 1
              }
            ]
          }
        ]
      }
    },
    {
      "id": "longproduct",
      "index": 0,
      "nodeId": "mt_q9EaJc2FP8",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 2347,
        "b": 6,
        "estimate": 2300,
        "prompt": "2347×6：多出的位置仍照同样的换捆规则。"
      },
      "taskHash": "5351737d9354ef387e74eaa0d778bd71916cff5373b234e67fe4cadc3795cf13",
      "math": {
        "product": 14082,
        "estimatedProduct": 13800,
        "trades": 9,
        "columnCount": 4,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 6,
            "shift": 0,
            "unshifted": 14082,
            "value": 14082,
            "digits": [
              2,
              8,
              0,
              4
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 7,
                "bDigit": 6,
                "incoming": 0,
                "raw": 42,
                "trades": 4,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 6,
                "incoming": 4,
                "raw": 28,
                "trades": 2,
                "loose": 8
              },
              {
                "column": 2,
                "aDigit": 3,
                "bDigit": 6,
                "incoming": 2,
                "raw": 20,
                "trades": 2,
                "loose": 0
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 6,
                "incoming": 2,
                "raw": 14,
                "trades": 1,
                "loose": 4
              }
            ]
          }
        ]
      }
    },
    {
      "id": "longproduct",
      "index": 1,
      "nodeId": "mt_q9EaJc2FP8",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 34,
        "b": 27,
        "estimate": 30,
        "prompt": "34×27：分别算7份与20份，再把两行合起来。"
      },
      "taskHash": "245fb99631abd7f8d85edbb94aabb7627e8762c9b8602816ea4f68c1dff192ec",
      "math": {
        "product": 918,
        "estimatedProduct": 810,
        "trades": 4,
        "columnCount": 4,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 238,
            "value": 238,
            "digits": [
              8,
              3
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 0,
                "raw": 28,
                "trades": 2,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 2,
                "raw": 23,
                "trades": 2,
                "loose": 3
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 68,
            "value": 680,
            "digits": [
              8,
              6
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 0,
                "raw": 8,
                "trades": 0,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 2,
                "incoming": 0,
                "raw": 6,
                "trades": 0,
                "loose": 6
              }
            ]
          }
        ]
      }
    },
    {
      "id": "longproduct",
      "index": 3,
      "nodeId": "mt_q9EaJc2FP8",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 45,
        "b": 23,
        "estimate": 50,
        "prompt": "把45×23改成两行来记。它们怎样对应刚才的四块？"
      },
      "taskHash": "7139950c9a988f83ee15216e8324030a7e7874ca0c337711e533dd24eecec599",
      "math": {
        "product": 1035,
        "estimatedProduct": 1150,
        "trades": 3,
        "columnCount": 4,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 3,
            "shift": 0,
            "unshifted": 135,
            "value": 135,
            "digits": [
              5,
              3
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 5,
                "bDigit": 3,
                "incoming": 0,
                "raw": 15,
                "trades": 1,
                "loose": 5
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 3,
                "incoming": 1,
                "raw": 13,
                "trades": 1,
                "loose": 3
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 90,
            "value": 900,
            "digits": [
              0,
              9
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 5,
                "bDigit": 2,
                "incoming": 0,
                "raw": 10,
                "trades": 1,
                "loose": 0
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 1,
                "raw": 9,
                "trades": 0,
                "loose": 9
              }
            ]
          }
        ]
      }
    },
    {
      "id": "bigproduct",
      "index": 0,
      "nodeId": "mt_XLP1IM3Qbb",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 2463,
        "b": 37,
        "estimate": 2500,
        "prompt": "2463×37：留下7份和30份的两行，再合起来。"
      },
      "taskHash": "94a95a7539daad7b3a8848ae5e14f899578b3713be5918154dbf0d4605d2b646",
      "math": {
        "product": 91131,
        "estimatedProduct": 92500,
        "trades": 12,
        "columnCount": 8,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 17241,
            "value": 17241,
            "digits": [
              1,
              4,
              2,
              7
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 0,
                "raw": 21,
                "trades": 2,
                "loose": 1
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 7,
                "incoming": 2,
                "raw": 44,
                "trades": 4,
                "loose": 4
              },
              {
                "column": 2,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 4,
                "raw": 32,
                "trades": 3,
                "loose": 2
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 7,
                "incoming": 3,
                "raw": 17,
                "trades": 1,
                "loose": 7
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 3,
            "shift": 1,
            "unshifted": 7389,
            "value": 73890,
            "digits": [
              9,
              8,
              3,
              7
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 3,
                "incoming": 0,
                "raw": 9,
                "trades": 0,
                "loose": 9
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 3,
                "incoming": 0,
                "raw": 18,
                "trades": 1,
                "loose": 8
              },
              {
                "column": 2,
                "aDigit": 4,
                "bDigit": 3,
                "incoming": 1,
                "raw": 13,
                "trades": 1,
                "loose": 3
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 3,
                "incoming": 1,
                "raw": 7,
                "trades": 0,
                "loose": 7
              }
            ]
          }
        ]
      }
    },
    {
      "id": "bigproduct",
      "index": 1,
      "nodeId": "mt_XLP1IM3Qbb",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 4762,
        "b": 28,
        "estimate": 4800,
        "prompt": "换成4762×28，检查第二行的位置和每次进位。"
      },
      "taskHash": "8a1664286312addb93e76ffca403db10977466f4744fd8e5fc881e1726730850",
      "math": {
        "product": 133336,
        "estimatedProduct": 134400,
        "trades": 16,
        "columnCount": 8,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 8,
            "shift": 0,
            "unshifted": 38096,
            "value": 38096,
            "digits": [
              6,
              9,
              0,
              8
            ],
            "carry": 3,
            "columns": [
              {
                "column": 0,
                "aDigit": 2,
                "bDigit": 8,
                "incoming": 0,
                "raw": 16,
                "trades": 1,
                "loose": 6
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 8,
                "incoming": 1,
                "raw": 49,
                "trades": 4,
                "loose": 9
              },
              {
                "column": 2,
                "aDigit": 7,
                "bDigit": 8,
                "incoming": 4,
                "raw": 60,
                "trades": 6,
                "loose": 0
              },
              {
                "column": 3,
                "aDigit": 4,
                "bDigit": 8,
                "incoming": 6,
                "raw": 38,
                "trades": 3,
                "loose": 8
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 9524,
            "value": 95240,
            "digits": [
              4,
              2,
              5,
              9
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 2,
                "bDigit": 2,
                "incoming": 0,
                "raw": 4,
                "trades": 0,
                "loose": 4
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 2,
                "incoming": 0,
                "raw": 12,
                "trades": 1,
                "loose": 2
              },
              {
                "column": 2,
                "aDigit": 7,
                "bDigit": 2,
                "incoming": 1,
                "raw": 15,
                "trades": 1,
                "loose": 5
              },
              {
                "column": 3,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 1,
                "raw": 9,
                "trades": 0,
                "loose": 9
              }
            ]
          }
        ]
      }
    },
    {
      "id": "translateamount",
      "index": 2,
      "nodeId": "mt_3VmBdlAeOZ",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 23,
        "b": 4,
        "estimate": 20,
        "prompt": "同一个4×23，用按位计算再做一次。这里的进位与刚才的80、12怎样相接？"
      },
      "taskHash": "4ecdf0a674e5802286b85774983b162cfdbf389281852d776c39f05d06b680f7",
      "math": {
        "product": 92,
        "estimatedProduct": 80,
        "trades": 1,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 4,
            "shift": 0,
            "unshifted": 92,
            "value": 92,
            "digits": [
              2,
              9
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 4,
                "incoming": 0,
                "raw": 12,
                "trades": 1,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 2,
                "bDigit": 4,
                "incoming": 1,
                "raw": 9,
                "trades": 0,
                "loose": 9
              }
            ]
          }
        ]
      }
    }
  ],
  "excluded": [
    {
      "id": "bigproduct",
      "index": 2,
      "nodeId": "mt_XLP1IM3Qbb",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 3040,
        "b": 20,
        "estimate": 3000,
        "prompt": "3040×20：遇到0也留下位置，别把20读成2。"
      },
      "taskHash": "93c94b11850b6790d18c4ed0709321802d6fc61bd91793ee18c6a95e02fd48c7",
      "math": {
        "product": 60800,
        "estimatedProduct": 60000,
        "trades": 0,
        "columnCount": 8,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 0,
            "shift": 0,
            "unshifted": 0,
            "value": 0,
            "digits": [
              0,
              0,
              0,
              0
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 0,
                "bDigit": 0,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 0,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 2,
                "aDigit": 0,
                "bDigit": 0,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 3,
                "aDigit": 3,
                "bDigit": 0,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 6080,
            "value": 60800,
            "digits": [
              0,
              8,
              0,
              6
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 0,
                "bDigit": 2,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 0,
                "raw": 8,
                "trades": 0,
                "loose": 8
              },
              {
                "column": 2,
                "aDigit": 0,
                "bDigit": 2,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 3,
                "aDigit": 3,
                "bDigit": 2,
                "incoming": 0,
                "raw": 6,
                "trades": 0,
                "loose": 6
              }
            ]
          }
        ]
      },
      "reason": "No enabled ten-for-one trade exists in any successful current workpiece; retain original grading and compatibility only."
    }
  ],
  "associated": [
    {
      "id": "link-writtenstart-shortproduct",
      "index": 1,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 23,
        "b": 4,
        "estimate": 20,
        "prompt": "把刚才的23×4按列记。每次算的这一位是什么单位？"
      },
      "taskHash": "c1216ca5f5a93bc5093a1d9c0785bbe18c2a0cc1a2f256617f21b0cdac1c9617",
      "math": {
        "product": 92,
        "estimatedProduct": 80,
        "trades": 1,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 4,
            "shift": 0,
            "unshifted": 92,
            "value": 92,
            "digits": [
              2,
              9
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 4,
                "incoming": 0,
                "raw": 12,
                "trades": 1,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 2,
                "bDigit": 4,
                "incoming": 1,
                "raw": 9,
                "trades": 0,
                "loose": 9
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-tables12-shortproduct",
      "index": 1,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 47,
        "b": 6,
        "estimate": 50,
        "prompt": "每一位借小乘法，再把进位送到前面。"
      },
      "taskHash": "a1c1aa22a47b7a2e2dc6485e4e08289f2918c91cbb1b612195abce4cde09f8b4",
      "math": {
        "product": 282,
        "estimatedProduct": 300,
        "trades": 6,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 6,
            "shift": 0,
            "unshifted": 282,
            "value": 282,
            "digits": [
              2,
              8
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 7,
                "bDigit": 6,
                "incoming": 0,
                "raw": 42,
                "trades": 4,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 6,
                "incoming": 4,
                "raw": 28,
                "trades": 2,
                "loose": 8
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-threeplaces-writtenstart",
      "index": 1,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 23,
        "b": 4,
        "estimate": 20,
        "prompt": "把20与3的计算按列记下来。"
      },
      "taskHash": "1f92acca2fb5e2f93ebce657a317f9a72d4b9263d65891c8cf5d7b80606b7eec",
      "math": {
        "product": 92,
        "estimatedProduct": 80,
        "trades": 1,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 4,
            "shift": 0,
            "unshifted": 92,
            "value": 92,
            "digits": [
              2,
              9
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 4,
                "incoming": 0,
                "raw": 12,
                "trades": 1,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 2,
                "bDigit": 4,
                "incoming": 1,
                "raw": 9,
                "trades": 0,
                "loose": 9
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-mulsymbols-writtenstart",
      "index": 1,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 12,
        "b": 3,
        "estimate": 10,
        "prompt": "把同样12×3按位记录，仍是三份12。"
      },
      "taskHash": "8e73e225c888f1b42e58a98242a4ed3ad5024bc15ae86d2f5ed911b928aa60fe",
      "math": {
        "product": 36,
        "estimatedProduct": 30,
        "trades": 0,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 3,
            "shift": 0,
            "unshifted": 36,
            "value": 36,
            "digits": [
              6,
              3
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 2,
                "bDigit": 3,
                "incoming": 0,
                "raw": 6,
                "trades": 0,
                "loose": 6
              },
              {
                "column": 1,
                "aDigit": 1,
                "bDigit": 3,
                "incoming": 0,
                "raw": 3,
                "trades": 0,
                "loose": 3
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-bigproduct-box",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 24,
        "b": 12,
        "estimate": 20,
        "prompt": "一层24块，12层。先用乘法把全部算出。"
      },
      "taskHash": "a3fd961290cc83098ca6044bbfc7926fb5edd8beeb556a4422821153fe1dd93c",
      "math": {
        "product": 288,
        "estimatedProduct": 240,
        "trades": 0,
        "columnCount": 4,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 2,
            "shift": 0,
            "unshifted": 48,
            "value": 48,
            "digits": [
              8,
              4
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 0,
                "raw": 8,
                "trades": 0,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 2,
                "bDigit": 2,
                "incoming": 0,
                "raw": 4,
                "trades": 0,
                "loose": 4
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 1,
            "shift": 1,
            "unshifted": 24,
            "value": 240,
            "digits": [
              4,
              2
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 1,
                "incoming": 0,
                "raw": 4,
                "trades": 0,
                "loose": 4
              },
              {
                "column": 1,
                "aDigit": 2,
                "bDigit": 1,
                "incoming": 0,
                "raw": 2,
                "trades": 0,
                "loose": 2
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-longproduct-remainders",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 13,
        "b": 4,
        "estimate": 10,
        "prompt": "4组各13人，一共多少人？"
      },
      "taskHash": "e8cea9e89703ba3d729a9b82cf253281d97dbc7f8db8186d86cf669d991fb4eb",
      "math": {
        "product": 52,
        "estimatedProduct": 40,
        "trades": 1,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 4,
            "shift": 0,
            "unshifted": 52,
            "value": 52,
            "digits": [
              2,
              5
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 4,
                "incoming": 0,
                "raw": 12,
                "trades": 1,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 1,
                "bDigit": 4,
                "incoming": 1,
                "raw": 5,
                "trades": 0,
                "loose": 5
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-shortproduct-longproduct",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 34,
        "b": 7,
        "estimate": 30,
        "prompt": "先计算34的7份。"
      },
      "taskHash": "43280d53c40336ce96691048595c0093b433a644f5500a1098f7a8f59ffad64e",
      "math": {
        "product": 238,
        "estimatedProduct": 210,
        "trades": 4,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 238,
            "value": 238,
            "digits": [
              8,
              3
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 0,
                "raw": 28,
                "trades": 2,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 2,
                "raw": 23,
                "trades": 2,
                "loose": 3
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-shortproduct-longproduct",
      "index": 1,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 34,
        "b": 27,
        "estimate": 30,
        "prompt": "34×27：分别算7份与20份，再把两行合起来。"
      },
      "taskHash": "245fb99631abd7f8d85edbb94aabb7627e8762c9b8602816ea4f68c1dff192ec",
      "math": {
        "product": 918,
        "estimatedProduct": 810,
        "trades": 4,
        "columnCount": 4,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 238,
            "value": 238,
            "digits": [
              8,
              3
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 0,
                "raw": 28,
                "trades": 2,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 2,
                "raw": 23,
                "trades": 2,
                "loose": 3
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 68,
            "value": 680,
            "digits": [
              8,
              6
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 0,
                "raw": 8,
                "trades": 0,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 2,
                "incoming": 0,
                "raw": 6,
                "trades": 0,
                "loose": 6
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-bigproduct-longdivide",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 365,
        "b": 13,
        "estimate": 400,
        "prompt": "先算365份13，留下各部分。"
      },
      "taskHash": "54462dcc87bf7b228b78eb19fa41d6693514adcc072260caeb505f1b7ee68555",
      "math": {
        "product": 4745,
        "estimatedProduct": 5200,
        "trades": 3,
        "columnCount": 6,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 3,
            "shift": 0,
            "unshifted": 1095,
            "value": 1095,
            "digits": [
              5,
              9,
              0
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 5,
                "bDigit": 3,
                "incoming": 0,
                "raw": 15,
                "trades": 1,
                "loose": 5
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 3,
                "incoming": 1,
                "raw": 19,
                "trades": 1,
                "loose": 9
              },
              {
                "column": 2,
                "aDigit": 3,
                "bDigit": 3,
                "incoming": 1,
                "raw": 10,
                "trades": 1,
                "loose": 0
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 1,
            "shift": 1,
            "unshifted": 365,
            "value": 3650,
            "digits": [
              5,
              6,
              3
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 5,
                "bDigit": 1,
                "incoming": 0,
                "raw": 5,
                "trades": 0,
                "loose": 5
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 1,
                "incoming": 0,
                "raw": 6,
                "trades": 0,
                "loose": 6
              },
              {
                "column": 2,
                "aDigit": 3,
                "bDigit": 1,
                "incoming": 0,
                "raw": 3,
                "trades": 0,
                "loose": 3
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-longproduct-bigproduct",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 34,
        "b": 27,
        "estimate": 30,
        "prompt": "34×27：分别算7份与20份，再把两行合起来。"
      },
      "taskHash": "245fb99631abd7f8d85edbb94aabb7627e8762c9b8602816ea4f68c1dff192ec",
      "math": {
        "product": 918,
        "estimatedProduct": 810,
        "trades": 4,
        "columnCount": 4,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 238,
            "value": 238,
            "digits": [
              8,
              3
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 0,
                "raw": 28,
                "trades": 2,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 2,
                "raw": 23,
                "trades": 2,
                "loose": 3
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 68,
            "value": 680,
            "digits": [
              8,
              6
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 0,
                "raw": 8,
                "trades": 0,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 2,
                "incoming": 0,
                "raw": 6,
                "trades": 0,
                "loose": 6
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-longproduct-bigproduct",
      "index": 1,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 2463,
        "b": 37,
        "estimate": 2500,
        "prompt": "2463×37：留下7份和30份的两行，再合起来。"
      },
      "taskHash": "94a95a7539daad7b3a8848ae5e14f899578b3713be5918154dbf0d4605d2b646",
      "math": {
        "product": 91131,
        "estimatedProduct": 92500,
        "trades": 12,
        "columnCount": 8,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 17241,
            "value": 17241,
            "digits": [
              1,
              4,
              2,
              7
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 0,
                "raw": 21,
                "trades": 2,
                "loose": 1
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 7,
                "incoming": 2,
                "raw": 44,
                "trades": 4,
                "loose": 4
              },
              {
                "column": 2,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 4,
                "raw": 32,
                "trades": 3,
                "loose": 2
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 7,
                "incoming": 3,
                "raw": 17,
                "trades": 1,
                "loose": 7
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 3,
            "shift": 1,
            "unshifted": 7389,
            "value": 73890,
            "digits": [
              9,
              8,
              3,
              7
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 3,
                "incoming": 0,
                "raw": 9,
                "trades": 0,
                "loose": 9
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 3,
                "incoming": 0,
                "raw": 18,
                "trades": 1,
                "loose": 8
              },
              {
                "column": 2,
                "aDigit": 4,
                "bDigit": 3,
                "incoming": 1,
                "raw": 13,
                "trades": 1,
                "loose": 3
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 3,
                "incoming": 1,
                "raw": 7,
                "trades": 0,
                "loose": 7
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-bigproduct-bracketlab",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 2463,
        "b": 37,
        "estimate": 2500,
        "prompt": "2463×37：留下7份和30份的两行，再合起来。"
      },
      "taskHash": "94a95a7539daad7b3a8848ae5e14f899578b3713be5918154dbf0d4605d2b646",
      "math": {
        "product": 91131,
        "estimatedProduct": 92500,
        "trades": 12,
        "columnCount": 8,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 17241,
            "value": 17241,
            "digits": [
              1,
              4,
              2,
              7
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 0,
                "raw": 21,
                "trades": 2,
                "loose": 1
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 7,
                "incoming": 2,
                "raw": 44,
                "trades": 4,
                "loose": 4
              },
              {
                "column": 2,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 4,
                "raw": 32,
                "trades": 3,
                "loose": 2
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 7,
                "incoming": 3,
                "raw": 17,
                "trades": 1,
                "loose": 7
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 3,
            "shift": 1,
            "unshifted": 7389,
            "value": 73890,
            "digits": [
              9,
              8,
              3,
              7
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 3,
                "incoming": 0,
                "raw": 9,
                "trades": 0,
                "loose": 9
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 3,
                "incoming": 0,
                "raw": 18,
                "trades": 1,
                "loose": 8
              },
              {
                "column": 2,
                "aDigit": 4,
                "bDigit": 3,
                "incoming": 1,
                "raw": 13,
                "trades": 1,
                "loose": 3
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 3,
                "incoming": 1,
                "raw": 7,
                "trades": 0,
                "loose": 7
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-shortproduct-combineproducts",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 47,
        "b": 6,
        "estimate": 50,
        "prompt": "47×6：先估，再从个位乘。十个换一捆，送到前面。"
      },
      "taskHash": "fd3f22c611a3ae8ee479910cf12f96709d0a27ede8345834f3b1feb1cc80c2da",
      "math": {
        "product": 282,
        "estimatedProduct": 300,
        "trades": 6,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 6,
            "shift": 0,
            "unshifted": 282,
            "value": 282,
            "digits": [
              2,
              8
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 7,
                "bDigit": 6,
                "incoming": 0,
                "raw": 42,
                "trades": 4,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 6,
                "incoming": 4,
                "raw": 28,
                "trades": 2,
                "loose": 8
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-bigproduct-decimalproduct",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 4762,
        "b": 28,
        "estimate": 4800,
        "prompt": "换成4762×28，检查第二行的位置和每次进位。"
      },
      "taskHash": "8a1664286312addb93e76ffca403db10977466f4744fd8e5fc881e1726730850",
      "math": {
        "product": 133336,
        "estimatedProduct": 134400,
        "trades": 16,
        "columnCount": 8,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 8,
            "shift": 0,
            "unshifted": 38096,
            "value": 38096,
            "digits": [
              6,
              9,
              0,
              8
            ],
            "carry": 3,
            "columns": [
              {
                "column": 0,
                "aDigit": 2,
                "bDigit": 8,
                "incoming": 0,
                "raw": 16,
                "trades": 1,
                "loose": 6
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 8,
                "incoming": 1,
                "raw": 49,
                "trades": 4,
                "loose": 9
              },
              {
                "column": 2,
                "aDigit": 7,
                "bDigit": 8,
                "incoming": 4,
                "raw": 60,
                "trades": 6,
                "loose": 0
              },
              {
                "column": 3,
                "aDigit": 4,
                "bDigit": 8,
                "incoming": 6,
                "raw": 38,
                "trades": 3,
                "loose": 8
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 9524,
            "value": 95240,
            "digits": [
              4,
              2,
              5,
              9
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 2,
                "bDigit": 2,
                "incoming": 0,
                "raw": 4,
                "trades": 0,
                "loose": 4
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 2,
                "incoming": 0,
                "raw": 12,
                "trades": 1,
                "loose": 2
              },
              {
                "column": 2,
                "aDigit": 7,
                "bDigit": 2,
                "incoming": 1,
                "raw": 15,
                "trades": 1,
                "loose": 5
              },
              {
                "column": 3,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 1,
                "raw": 9,
                "trades": 0,
                "loose": 9
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-longproduct-calculatormeaning",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 34,
        "b": 27,
        "estimate": 30,
        "prompt": "34×27：分别算7份与20份，再把两行合起来。"
      },
      "taskHash": "245fb99631abd7f8d85edbb94aabb7627e8762c9b8602816ea4f68c1dff192ec",
      "math": {
        "product": 918,
        "estimatedProduct": 810,
        "trades": 4,
        "columnCount": 4,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 238,
            "value": 238,
            "digits": [
              8,
              3
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 0,
                "raw": 28,
                "trades": 2,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 2,
                "raw": 23,
                "trades": 2,
                "loose": 3
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 68,
            "value": 680,
            "digits": [
              8,
              6
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 0,
                "raw": 8,
                "trades": 0,
                "loose": 8
              },
              {
                "column": 1,
                "aDigit": 3,
                "bDigit": 2,
                "incoming": 0,
                "raw": 6,
                "trades": 0,
                "loose": 6
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-bigproduct-mentalchoices",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 3040,
        "b": 20,
        "estimate": 3000,
        "prompt": "3040×20：遇到0也留下位置，别把20读成2。"
      },
      "taskHash": "93c94b11850b6790d18c4ed0709321802d6fc61bd91793ee18c6a95e02fd48c7",
      "math": {
        "product": 60800,
        "estimatedProduct": 60000,
        "trades": 0,
        "columnCount": 8,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 0,
            "shift": 0,
            "unshifted": 0,
            "value": 0,
            "digits": [
              0,
              0,
              0,
              0
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 0,
                "bDigit": 0,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 0,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 2,
                "aDigit": 0,
                "bDigit": 0,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 3,
                "aDigit": 3,
                "bDigit": 0,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 2,
            "shift": 1,
            "unshifted": 6080,
            "value": 60800,
            "digits": [
              0,
              8,
              0,
              6
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 0,
                "bDigit": 2,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 2,
                "incoming": 0,
                "raw": 8,
                "trades": 0,
                "loose": 8
              },
              {
                "column": 2,
                "aDigit": 0,
                "bDigit": 2,
                "incoming": 0,
                "raw": 0,
                "trades": 0,
                "loose": 0
              },
              {
                "column": 3,
                "aDigit": 3,
                "bDigit": 2,
                "incoming": 0,
                "raw": 6,
                "trades": 0,
                "loose": 6
              }
            ]
          }
        ]
      }
    },
    {
      "id": "link-longproduct-viewlinks",
      "index": 0,
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 23,
        "b": 4,
        "estimate": 20,
        "prompt": "同一个4×23，用按位计算再做一次。这里的进位与刚才的80、12怎样相接？"
      },
      "taskHash": "4ecdf0a674e5802286b85774983b162cfdbf389281852d776c39f05d06b680f7",
      "math": {
        "product": 92,
        "estimatedProduct": 80,
        "trades": 1,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 4,
            "shift": 0,
            "unshifted": 92,
            "value": 92,
            "digits": [
              2,
              9
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 4,
                "incoming": 0,
                "raw": 12,
                "trades": 1,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 2,
                "bDigit": 4,
                "incoming": 1,
                "raw": 9,
                "trades": 0,
                "loose": 9
              }
            ]
          }
        ]
      }
    }
  ],
  "practice": [
    {
      "id": "shortproduct",
      "index": -1,
      "nodeId": "mt_18fK9sQdIz",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 47,
        "b": 6,
        "estimate": 50,
        "prompt": "47×6：先估，再从个位乘。十个换一捆，送到前面。"
      },
      "taskHash": "fd3f22c611a3ae8ee479910cf12f96709d0a27ede8345834f3b1feb1cc80c2da",
      "math": {
        "product": 282,
        "estimatedProduct": 300,
        "trades": 6,
        "columnCount": 2,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 6,
            "shift": 0,
            "unshifted": 282,
            "value": 282,
            "digits": [
              2,
              8
            ],
            "carry": 2,
            "columns": [
              {
                "column": 0,
                "aDigit": 7,
                "bDigit": 6,
                "incoming": 0,
                "raw": 42,
                "trades": 4,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 6,
                "incoming": 4,
                "raw": 28,
                "trades": 2,
                "loose": 8
              }
            ]
          }
        ]
      }
    },
    {
      "id": "longproduct",
      "index": -1,
      "nodeId": "mt_q9EaJc2FP8",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 2347,
        "b": 6,
        "estimate": 2300,
        "prompt": "2347×6：多出的位置仍照同样的换捆规则。"
      },
      "taskHash": "5351737d9354ef387e74eaa0d778bd71916cff5373b234e67fe4cadc3795cf13",
      "math": {
        "product": 14082,
        "estimatedProduct": 13800,
        "trades": 9,
        "columnCount": 4,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 6,
            "shift": 0,
            "unshifted": 14082,
            "value": 14082,
            "digits": [
              2,
              8,
              0,
              4
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 7,
                "bDigit": 6,
                "incoming": 0,
                "raw": 42,
                "trades": 4,
                "loose": 2
              },
              {
                "column": 1,
                "aDigit": 4,
                "bDigit": 6,
                "incoming": 4,
                "raw": 28,
                "trades": 2,
                "loose": 8
              },
              {
                "column": 2,
                "aDigit": 3,
                "bDigit": 6,
                "incoming": 2,
                "raw": 20,
                "trades": 2,
                "loose": 0
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 6,
                "incoming": 2,
                "raw": 14,
                "trades": 1,
                "loose": 4
              }
            ]
          }
        ]
      }
    },
    {
      "id": "bigproduct",
      "index": -1,
      "nodeId": "mt_XLP1IM3Qbb",
      "type": "x-multable",
      "task": {
        "type": "x-multable",
        "a": 2463,
        "b": 37,
        "estimate": 2500,
        "prompt": "2463×37：留下7份和30份的两行，再合起来。"
      },
      "taskHash": "94a95a7539daad7b3a8848ae5e14f899578b3713be5918154dbf0d4605d2b646",
      "math": {
        "product": 91131,
        "estimatedProduct": 92500,
        "trades": 12,
        "columnCount": 8,
        "rows": [
          {
            "row": 0,
            "multiplierDigit": 7,
            "shift": 0,
            "unshifted": 17241,
            "value": 17241,
            "digits": [
              1,
              4,
              2,
              7
            ],
            "carry": 1,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 7,
                "incoming": 0,
                "raw": 21,
                "trades": 2,
                "loose": 1
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 7,
                "incoming": 2,
                "raw": 44,
                "trades": 4,
                "loose": 4
              },
              {
                "column": 2,
                "aDigit": 4,
                "bDigit": 7,
                "incoming": 4,
                "raw": 32,
                "trades": 3,
                "loose": 2
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 7,
                "incoming": 3,
                "raw": 17,
                "trades": 1,
                "loose": 7
              }
            ]
          },
          {
            "row": 1,
            "multiplierDigit": 3,
            "shift": 1,
            "unshifted": 7389,
            "value": 73890,
            "digits": [
              9,
              8,
              3,
              7
            ],
            "carry": 0,
            "columns": [
              {
                "column": 0,
                "aDigit": 3,
                "bDigit": 3,
                "incoming": 0,
                "raw": 9,
                "trades": 0,
                "loose": 9
              },
              {
                "column": 1,
                "aDigit": 6,
                "bDigit": 3,
                "incoming": 0,
                "raw": 18,
                "trades": 1,
                "loose": 8
              },
              {
                "column": 2,
                "aDigit": 4,
                "bDigit": 3,
                "incoming": 1,
                "raw": 13,
                "trades": 1,
                "loose": 3
              },
              {
                "column": 3,
                "aDigit": 2,
                "bDigit": 3,
                "incoming": 1,
                "raw": 7,
                "trades": 0,
                "loose": 7
              }
            ]
          }
        ]
      }
    }
  ],
  "sourceHashes": {
    "vendor/upstream.json": "d5c50f38991ca8f43bef03b1abecd3cace3c1ac6e2354db34f88afac75d705ed",
    "dist/data/atlas.json": "b30b16783f518e47fed8dd6e412bb6ee6e323b5250834c0ee1c0bb68dff94caf",
    "dist/learning/phase5/b14.js": "ea9fc678c74ecaebcd7557a302128312c48e3075c04bab38aaae3efcdda54093",
    "dist/learning/phase5/b14-model.js": "9fe453c590a81e350fcd6f9988bc44ff27727fc5c51991363db803116c8a3ea4",
    "dist/learning/phase5/b14-view.js": "964a738353548589afa95ce39eeac6b03a2e07e925b25362f567b481b273b007",
    "dist/learning/phase5/b14.css": "ae39df915ef7ed0263b72c42510ab0ac3e2d99878f882d81445c9c8653aa0403",
    "dist/learning/phase5/b38.js": "8953ff1e7e76a2bab98c2d0d94a24f9a896c5540b0127df4e95befcd5bcbcbe3",
    "dist/learning/phase5/b39.js": "f282d5afe8b478b1e6ff623424f473d42f70212142556a0a433d68d369670838",
    "dist/learning/catalog.js": "6f0258d01853e8e73ca4cc0e92379f3ad97731fee2e409c73baea6fa559f8518",
    "dist/learning/tasks.js": "4eac447b0944644b1c1077464e849950b296fd708f7f8f0ecf9d4ac1fd7cb4a7",
    "dist/learning/bridges.js": "e480fb63c69a2ee259b9bce4688d698fc61a1a910a44439e98c45cf1f7faeb15",
    "dist/learning/phase4/catalog.js": "297b04d578cfbd3eb42c1d048b50d5adedfc6e53639c849cb6114675cc33063a",
    "dist/learning/phase4/engine.js": "8164e3f66e9c1489ef4831a6477fe782591ea1a7bc0ed4da859fc3c575b9f9ee",
    "dist/learning/phase4/view-engine.js": "22ce2022cc9fb1f4fac0cdb40ac1bd7ef24497db9d1416b219f500f630c311f1",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8",
    "dist/learning/state.js": "e20c834d9741761b57c60cc0ca385d604b9b9e16e7e6a383e36ef0696a21e8db",
    "dist/learning/evidence-contract.js": "bc73050766cc97a8820bf39aed84e42ebdcbf6e4605a2128bf6ff975325f683e"
  }
};
