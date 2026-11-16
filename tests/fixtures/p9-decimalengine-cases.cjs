// Independent literal native positions and hand-calculated decimal division.
// No production adapter, solveSteps or author example supplies expectations.
module.exports = {
  "cases": [
    {
      "id": "fdpswitch",
      "sessionId": "fdpswitch",
      "index": 0,
      "nodeId": "mt_4K1dr204Hi",
      "taskHash": "94099be93da6caa3e2ab95d5adc8ca86e04f6ecf7f8720660ba911350487b8bf",
      "task": {
        "type": "x-decimalengine",
        "n": 3,
        "d": 8,
        "prompt": "3/8就是3÷8。先判断会不会分完，再一位一位分，保留每次余下的量。"
      },
      "expected": {
        "simple": [
          3,
          8
        ],
        "factorOrders": [
          [
            2,
            2,
            2
          ]
        ],
        "rows": [
          {
            "input": 3,
            "quotient": 0,
            "remainder": 3
          },
          {
            "input": 30,
            "quotient": 3,
            "remainder": 6
          },
          {
            "input": 60,
            "quotient": 7,
            "remainder": 4
          },
          {
            "input": 40,
            "quotient": 5,
            "remainder": 0
          }
        ],
        "kind": "stop",
        "nonrepeatingDigits": "375",
        "repeatingDigits": "",
        "cycleIndex": null,
        "cycleStartFractionalPlace": null,
        "firstRepeatedRemainder": null,
        "remainders": [
          3,
          6,
          4
        ],
        "answer": "0.375",
        "integerDigits": "0"
      }
    },
    {
      "id": "fdpswitch",
      "sessionId": "fdpswitch",
      "index": 3,
      "nodeId": "mt_4K1dr204Hi",
      "taskHash": "790d524fd366d22f5f1d9234c21362062801b3f27a2f566d8c2d0aa25c2fca2a",
      "task": {
        "type": "x-decimalengine",
        "n": 1,
        "d": 3,
        "prompt": "把1平均分3份，亲自跟踪余数。重复的不是最后一次四舍五入，而是后续步骤。"
      },
      "expected": {
        "simple": [
          1,
          3
        ],
        "factorOrders": [
          [
            3
          ]
        ],
        "rows": [
          {
            "input": 1,
            "quotient": 0,
            "remainder": 1
          },
          {
            "input": 10,
            "quotient": 3,
            "remainder": 1
          }
        ],
        "kind": "repeat",
        "nonrepeatingDigits": "",
        "repeatingDigits": "3",
        "cycleIndex": 0,
        "cycleStartFractionalPlace": 1,
        "firstRepeatedRemainder": 1,
        "remainders": [
          1
        ],
        "answer": "3",
        "integerDigits": "0"
      }
    },
    {
      "id": "decimalstops",
      "sessionId": "decimalstops",
      "index": 2,
      "nodeId": "mt_SBkTGjiZjZ",
      "taskHash": "f2aa36f5c7e612faa55b73095a59e5f6dce84b6d86499854d22ba49dad832a1a",
      "task": {
        "type": "x-decimalengine",
        "n": 7,
        "d": 40,
        "prompt": "先把整个的份数拆成质数，再判断、实际分，看看7/40在哪里停。"
      },
      "expected": {
        "simple": [
          7,
          40
        ],
        "factorOrders": [
          [
            2,
            2,
            2,
            5
          ],
          [
            2,
            2,
            5,
            2
          ],
          [
            2,
            5,
            2,
            2
          ],
          [
            5,
            2,
            2,
            2
          ]
        ],
        "rows": [
          {
            "input": 7,
            "quotient": 0,
            "remainder": 7
          },
          {
            "input": 70,
            "quotient": 1,
            "remainder": 30
          },
          {
            "input": 300,
            "quotient": 7,
            "remainder": 20
          },
          {
            "input": 200,
            "quotient": 5,
            "remainder": 0
          }
        ],
        "kind": "stop",
        "nonrepeatingDigits": "175",
        "repeatingDigits": "",
        "cycleIndex": null,
        "cycleStartFractionalPlace": null,
        "firstRepeatedRemainder": null,
        "remainders": [
          7,
          30,
          20
        ],
        "answer": "0.175",
        "integerDigits": "0"
      }
    },
    {
      "id": "decimalstops",
      "sessionId": "decimalstops",
      "index": 3,
      "nodeId": "mt_SBkTGjiZjZ",
      "taskHash": "b64c4dc82219de930bc5f53faa25886030f89ad6d81fc735e1f4bd1d5ee9d845",
      "task": {
        "type": "x-decimalengine",
        "n": 1,
        "d": 6,
        "prompt": "1/6的分母里除了2还有谁？追踪余数，看它怎么开始循环。"
      },
      "expected": {
        "simple": [
          1,
          6
        ],
        "factorOrders": [
          [
            2,
            3
          ],
          [
            3,
            2
          ]
        ],
        "rows": [
          {
            "input": 1,
            "quotient": 0,
            "remainder": 1
          },
          {
            "input": 10,
            "quotient": 1,
            "remainder": 4
          },
          {
            "input": 40,
            "quotient": 6,
            "remainder": 4
          }
        ],
        "kind": "repeat",
        "nonrepeatingDigits": "1",
        "repeatingDigits": "6",
        "cycleIndex": 1,
        "cycleStartFractionalPlace": 2,
        "firstRepeatedRemainder": 4,
        "remainders": [
          1,
          4
        ],
        "answer": "6",
        "integerDigits": "0"
      }
    },
    {
      "id": "decimalstops",
      "sessionId": "decimalstops",
      "index": 4,
      "nodeId": "mt_SBkTGjiZjZ",
      "taskHash": "0dad55d0bbed93a796e5fcaf34f3e9bc85df3d36e10607d6a7ff41b98a624f84",
      "task": {
        "type": "x-decimalengine",
        "n": 6,
        "d": 15,
        "prompt": "先化简6/15，再看质数因子。没化简前的15会不会误导你？"
      },
      "expected": {
        "simple": [
          2,
          5
        ],
        "factorOrders": [
          [
            5
          ]
        ],
        "rows": [
          {
            "input": 2,
            "quotient": 0,
            "remainder": 2
          },
          {
            "input": 20,
            "quotient": 4,
            "remainder": 0
          }
        ],
        "kind": "stop",
        "nonrepeatingDigits": "4",
        "repeatingDigits": "",
        "cycleIndex": null,
        "cycleStartFractionalPlace": null,
        "firstRepeatedRemainder": null,
        "remainders": [
          2
        ],
        "answer": "0.4",
        "integerDigits": "0"
      }
    },
    {
      "id": "decimalstops",
      "sessionId": "decimalstops",
      "index": 5,
      "nodeId": "mt_SBkTGjiZjZ",
      "taskHash": "0b5c4b33d13d2e75b0e06910c1c1bcc9a64d46e9aafeb1b4b5cfa6700fd6e8fe",
      "task": {
        "type": "x-decimalengine",
        "n": 4,
        "d": 15,
        "prompt": "同样下面写15，这次是4/15。按原量重新化简、判断、分一遍。"
      },
      "expected": {
        "simple": [
          4,
          15
        ],
        "factorOrders": [
          [
            3,
            5
          ],
          [
            5,
            3
          ]
        ],
        "rows": [
          {
            "input": 4,
            "quotient": 0,
            "remainder": 4
          },
          {
            "input": 40,
            "quotient": 2,
            "remainder": 10
          },
          {
            "input": 100,
            "quotient": 6,
            "remainder": 10
          }
        ],
        "kind": "repeat",
        "nonrepeatingDigits": "2",
        "repeatingDigits": "6",
        "cycleIndex": 1,
        "cycleStartFractionalPlace": 2,
        "firstRepeatedRemainder": 10,
        "remainders": [
          4,
          10
        ],
        "answer": "6",
        "integerDigits": "0"
      }
    }
  ],
  "bridges": [
    {
      "id": "link-sharewholes-fdpswitch",
      "sessionId": "link-sharewholes-fdpswitch",
      "index": 1,
      "nodeId": "mt_4K1dr204Hi",
      "taskHash": "94099be93da6caa3e2ab95d5adc8ca86e04f6ecf7f8720660ba911350487b8bf",
      "task": {
        "type": "x-decimalengine",
        "n": 3,
        "d": 8,
        "prompt": "3/8就是3÷8。先判断会不会分完，再一位一位分，保留每次余下的量。"
      }
    },
    {
      "id": "link-fdpswitch-decimalstops",
      "sessionId": "link-fdpswitch-decimalstops",
      "index": 0,
      "nodeId": "mt_SBkTGjiZjZ",
      "taskHash": "790d524fd366d22f5f1d9234c21362062801b3f27a2f566d8c2d0aa25c2fca2a",
      "task": {
        "type": "x-decimalengine",
        "n": 1,
        "d": 3,
        "prompt": "把1平均分3份，亲自跟踪余数。重复的不是最后一次四舍五入，而是后续步骤。"
      }
    },
    {
      "id": "link-fdpswitch-decimalstops",
      "sessionId": "link-fdpswitch-decimalstops",
      "index": 1,
      "nodeId": "mt_SBkTGjiZjZ",
      "taskHash": "b64c4dc82219de930bc5f53faa25886030f89ad6d81fc735e1f4bd1d5ee9d845",
      "task": {
        "type": "x-decimalengine",
        "n": 1,
        "d": 6,
        "prompt": "1/6的分母里除了2还有谁？追踪余数，看它怎么开始循环。"
      }
    }
  ],
  "practices": [
    {
      "id": "fdpswitch",
      "sessionId": "fdpswitch",
      "index": -1,
      "nodeId": "mt_4K1dr204Hi",
      "taskHash": "94099be93da6caa3e2ab95d5adc8ca86e04f6ecf7f8720660ba911350487b8bf",
      "task": {
        "type": "x-decimalengine",
        "n": 3,
        "d": 8,
        "prompt": "3/8就是3÷8。先判断会不会分完，再一位一位分，保留每次余下的量。"
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b17.js": "7598232e6f0d99ffbfedbd1e2bd923c45dec5afc935bfc7fca415ed5370bb9b2",
    "dist/learning/phase5/b17-model.js": "52e8665b482c26ad444c95096130ef87c89b0793038db101fcc2cce23320ae78",
    "dist/learning/phase5/b17-view.js": "7ae3320116fc5d75cc4d576794c207d1d1ea54b490f46f406403d21b1e0c5d27",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8"
  }
};
