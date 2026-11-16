// Literal arithmetic plans for seven unavoidable original preceding tasks.
// No original solver or generated task answer is used as the expected plan.
module.exports={
  "navigation": [
    {
      "id": "signedproducts",
      "index": 0,
      "task": {
        "type": "x-signwalk",
        "mode": "sequence",
        "a": -3,
        "reason": "plus3",
        "prompt": "让−3乘的数从2、1、0接到−1、−2。每次只少一份，结果要怎样延续？"
      },
      "taskHash": "fa39239307090bdd2b1612509be1b77f92a7c415150525f14c250918072e8d19",
      "steps": [
        {
          "field": "result",
          "value": "-6"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "-3"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "0"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "3"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "6"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "reason",
          "value": "plus3"
        }
      ]
    },
    {
      "id": "signedproducts",
      "index": 1,
      "task": {
        "type": "x-signwalk",
        "mode": "cases",
        "cases": [
          {
            "a": 6,
            "b": 2,
            "op": "*"
          },
          {
            "a": 6,
            "b": -2,
            "op": "*"
          },
          {
            "a": -6,
            "b": 2,
            "op": "*"
          },
          {
            "a": -6,
            "b": -2,
            "op": "*"
          },
          {
            "a": 0,
            "b": -5,
            "op": "*"
          }
        ],
        "prompt": "同样的大小，分别换一个或两个方向。把每种结果接出来，0也试一次。"
      },
      "taskHash": "014eace4356e307ff71c16ffcd44c6c83e01a36c62959859f967fa4f40b9f022",
      "steps": [
        {
          "field": "result",
          "value": "12"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "-12"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "-12"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "12"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "0"
        },
        {
          "action": "b15-sign",
          "data": {}
        }
      ]
    },
    {
      "id": "signedproducts",
      "index": 2,
      "task": {
        "type": "x-signwalk",
        "mode": "cases",
        "cases": [
          {
            "a": 12,
            "b": 3,
            "op": "/"
          },
          {
            "a": 12,
            "b": -3,
            "op": "/"
          },
          {
            "a": -12,
            "b": 3,
            "op": "/"
          },
          {
            "a": -12,
            "b": -3,
            "op": "/"
          }
        ],
        "prompt": "除法可以问：后面的数乘几，会回到前面的数？四种方向都试一次。"
      },
      "taskHash": "d63b42bc76511488879485dde716eb4468bb948750d823213c00b4a92733b700",
      "steps": [
        {
          "field": "result",
          "value": "4"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "-4"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "-4"
        },
        {
          "action": "b15-sign",
          "data": {}
        },
        {
          "field": "result",
          "value": "4"
        },
        {
          "action": "b15-sign",
          "data": {}
        }
      ]
    },
    {
      "id": "mentalchoices",
      "index": 0,
      "task": {
        "type": "x-areaproduct",
        "a": 45,
        "b": 8,
        "prompt": "45×8自己切成两块，两块都乘8，再合起来。"
      },
      "taskHash": "13580d87a5587378d3e1e80a8f27e620d2d05fb3e5a769c53a891e529a2f1832",
      "steps": [
        {
          "field": "cutA",
          "value": "40"
        },
        {
          "field": "cutB",
          "value": "8"
        },
        {
          "action": "b14-cut",
          "data": {}
        },
        {
          "field": "part",
          "value": "320"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "part",
          "value": "40"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "answer",
          "value": "360"
        }
      ]
    },
    {
      "id": "mentalchoices",
      "index": 2,
      "task": {
        "type": "x-decimalproduct",
        "decimal": "6.5",
        "multiplier": 4,
        "estimate": 60,
        "prompt": "从6×4借出6.5×4：65个十分之一取4份。最小单位仍要保留。"
      },
      "taskHash": "1d739fd4e69645b4e6b7e12176e6a051fbc772dc6f1520b02ac02309982e38f6",
      "steps": [
        {
          "field": "inner.estimate",
          "value": "240"
        },
        {
          "action": "b14-estimate",
          "data": {}
        },
        {
          "field": "inner.raw",
          "value": "20"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "field": "inner.digit",
          "value": "0"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "inner.raw",
          "value": "26"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "field": "inner.digit",
          "value": "6"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "inner.shift",
          "value": "0"
        },
        {
          "field": "inner.rowvalue",
          "value": "260"
        },
        {
          "action": "b14-row",
          "data": {}
        },
        {
          "field": "inner.answer",
          "value": "260"
        },
        {
          "field": "unit",
          "value": "10"
        },
        {
          "field": "answer",
          "value": "26"
        }
      ]
    },
    {
      "id": "link-remainders-bracketlab",
      "index": 0,
      "task": {
        "type": "x-planproduct",
        "values": [
          30,
          6,
          150
        ],
        "labels": [
          "需要30支",
          "每包6支",
          "每包150分"
        ],
        "prompt": "要买30支笔，每包6支、每包1.50元。自己选步骤，用n表示最后花多少元。",
        "money": true,
        "plans": [
          "((0/1)*2)",
          "(2*(0/1))",
          "((2/1)*0)",
          "(0*(2/1))",
          "((0*2)/1)",
          "((2*0)/1)"
        ],
        "equations": [
          "n=30÷6×1.5",
          "n=1.5×(30÷6)",
          "n=(30÷6)×1.5",
          "n=30×1.5÷6"
        ]
      },
      "taskHash": "0893576e1c69162ff67758968d1750c9dd63d49f2c236d2a56887d6d04642574",
      "steps": [
        {
          "action": "b14-plan-pick",
          "data": {
            "index": 0
          }
        },
        {
          "action": "b14-plan-pick",
          "data": {
            "index": 1
          }
        },
        {
          "field": "operator",
          "value": "/"
        },
        {
          "field": "result",
          "value": "5"
        },
        {
          "action": "b14-merge",
          "data": {}
        },
        {
          "action": "b14-plan-pick",
          "data": {
            "index": 0
          }
        },
        {
          "action": "b14-plan-pick",
          "data": {
            "index": 1
          }
        },
        {
          "field": "operator",
          "value": "*"
        },
        {
          "field": "result",
          "value": "750"
        },
        {
          "action": "b14-merge",
          "data": {}
        },
        {
          "field": "answer",
          "value": "7.50"
        },
        {
          "field": "equation",
          "value": "n=1.5×(30÷6)"
        }
      ]
    },
    {
      "id": "link-bigproduct-bracketlab",
      "index": 0,
      "task": {
        "type": "x-multable",
        "a": 2463,
        "b": 37,
        "estimate": 2500,
        "prompt": "2463×37：留下7份和30份的两行，再合起来。"
      },
      "taskHash": "94a95a7539daad7b3a8848ae5e14f899578b3713be5918154dbf0d4605d2b646",
      "steps": [
        {
          "field": "estimate",
          "value": "92500"
        },
        {
          "action": "b14-estimate",
          "data": {}
        },
        {
          "field": "raw",
          "value": "21"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "field": "digit",
          "value": "1"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "raw",
          "value": "44"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "field": "digit",
          "value": "4"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "raw",
          "value": "32"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "field": "digit",
          "value": "2"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "raw",
          "value": "17"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "field": "digit",
          "value": "7"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "shift",
          "value": "0"
        },
        {
          "field": "rowvalue",
          "value": "17241"
        },
        {
          "action": "b14-row",
          "data": {}
        },
        {
          "field": "raw",
          "value": "9"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "field": "digit",
          "value": "9"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "raw",
          "value": "18"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "field": "digit",
          "value": "8"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "raw",
          "value": "13"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "action": "b14-trade",
          "data": {}
        },
        {
          "field": "digit",
          "value": "3"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "raw",
          "value": "7"
        },
        {
          "action": "b14-mul-count",
          "data": {}
        },
        {
          "field": "digit",
          "value": "7"
        },
        {
          "action": "b14-digit",
          "data": {}
        },
        {
          "field": "shift",
          "value": "1"
        },
        {
          "field": "rowvalue",
          "value": "73890"
        },
        {
          "action": "b14-row",
          "data": {}
        },
        {
          "field": "answer",
          "value": "91131"
        }
      ]
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b14-model.js": "9fe453c590a81e350fcd6f9988bc44ff27727fc5c51991363db803116c8a3ea4",
    "dist/learning/phase5/b14-view.js": "964a738353548589afa95ce39eeac6b03a2e07e925b25362f567b481b273b007",
    "dist/learning/phase5/b15-model.js": "d73277dd8e285e8d37fc196f6b9bb02421f84276f4c0721cc129780e62cbe7bb",
    "dist/learning/phase5/b15-view.js": "faa0b7a58440e91423adef782bc40170812f80726521b935a3289a75251a306e",
    "dist/learning/phase5/b15.js": "91f41daf086f02ea42f1aa9f75cd8b74122f2c646588d5b91fbe05a690b86369",
    "dist/learning/phase5/b16.js": "32dd356d23a765122b60e0c40d804d7ee9353e3950757386704a6e9435e39d79",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8",
    "dist/learning/phase4/engine.js": "8164e3f66e9c1489ef4831a6477fe782591ea1a7bc0ed4da859fc3c575b9f9ee",
    "dist/learning/phase4/view-engine.js": "22ce2022cc9fb1f4fac0cdb40ac1bd7ef24497db9d1416b219f500f630c311f1",
    "dist/learning/p3-view.js": "100a430403ff5e5cce93546ebbce803df84fc4c602c2b6bcf6a342d53fe68a78",
    "dist/learning/p3-workflow.js": "864f42f1e161f299536bdb44c1ccf0cf1599a6e60d16b271c4f37719b41db06a",
    "dist/learning/workspace-flow.js": "3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05"
  }
};
