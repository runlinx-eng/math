// Independently reviewed original B18 positions and hand-calculated quantities.
// Production code never imports this fixture.
module.exports={
  "cases": [
    {
      "id": "mixedexchange",
      "sessionId": "mixedexchange",
      "index": 0,
      "nodeId": "mt_70qDTI14td",
      "taskHash": "ed74b4b61fb0b3793559c62808c909a388d1e725692de98394031333f17e6dd0",
      "task": {
        "type": "x-mixedtrade",
        "a": [
          2,
          3
        ],
        "op": "+",
        "b": [
          1,
          4
        ],
        "d": 5,
        "prompt": "两段整份和零头合起来。小份够一个整体时，把它们合拢。",
        "trade": true
      },
      "expected": {
        "operandA": [
          13,
          5
        ],
        "operandB": [
          9,
          5
        ],
        "initialQuantity": [
          22,
          5
        ],
        "result": [
          22,
          5
        ],
        "denominator": 5,
        "initial": {
          "w": 3,
          "p": 7
        },
        "final": {
          "w": 4,
          "p": 2
        },
        "requiredTaken": {
          "w": 0,
          "p": 0
        },
        "tradeRequired": true
      }
    },
    {
      "id": "mixedexchange",
      "sessionId": "mixedexchange",
      "index": 1,
      "nodeId": "mt_70qDTI14td",
      "taskHash": "0b8cda5c4eea7d1eea1f0bbdbbc4159f3a8f03f520885b72c564866994a8a894",
      "task": {
        "type": "x-mixedtrade",
        "a": [
          5,
          3
        ],
        "op": "-",
        "b": [
          3,
          1
        ],
        "d": 4,
        "prompt": "从5又3/4拿走3又1/4，整份和零头分别保留多少？"
      },
      "expected": {
        "operandA": [
          23,
          4
        ],
        "operandB": [
          13,
          4
        ],
        "initialQuantity": [
          23,
          4
        ],
        "result": [
          5,
          2
        ],
        "denominator": 4,
        "initial": {
          "w": 5,
          "p": 3
        },
        "final": {
          "w": 2,
          "p": 2
        },
        "requiredTaken": {
          "w": 3,
          "p": 1
        },
        "tradeRequired": false
      }
    },
    {
      "id": "mixedexchange",
      "sessionId": "mixedexchange",
      "index": 2,
      "nodeId": "mt_70qDTI14td",
      "taskHash": "b7d0c6bf5ed1acaf76ad51220632f8dc9ea48e467f16e9a33102c7344a95b6eb",
      "task": {
        "type": "x-mixedtrade",
        "a": [
          4,
          2
        ],
        "op": "-",
        "b": [
          1,
          5
        ],
        "d": 6,
        "prompt": "小份不够拿走时，试着换开一个整体；也可以先全部换成小份。",
        "trade": true
      },
      "expected": {
        "operandA": [
          13,
          3
        ],
        "operandB": [
          11,
          6
        ],
        "initialQuantity": [
          13,
          3
        ],
        "result": [
          5,
          2
        ],
        "denominator": 6,
        "initial": {
          "w": 4,
          "p": 2
        },
        "final": {
          "w": 2,
          "p": 3
        },
        "requiredTaken": {
          "w": 1,
          "p": 5
        },
        "tradeRequired": true
      }
    }
  ],
  "bridges": [
    {
      "id": "link-mixedrename-mixedexchange",
      "sessionId": "link-mixedrename-mixedexchange",
      "index": 1,
      "nodeId": "mt_70qDTI14td",
      "taskHash": "b7d0c6bf5ed1acaf76ad51220632f8dc9ea48e467f16e9a33102c7344a95b6eb",
      "task": {
        "type": "x-mixedtrade",
        "a": [
          4,
          2
        ],
        "op": "-",
        "b": [
          1,
          5
        ],
        "d": 6,
        "prompt": "小份不够拿走时，试着换开一个整体；也可以先全部换成小份。",
        "trade": true
      },
      "expected": {
        "operandA": [
          13,
          3
        ],
        "operandB": [
          11,
          6
        ],
        "initialQuantity": [
          13,
          3
        ],
        "result": [
          5,
          2
        ],
        "denominator": 6,
        "initial": {
          "w": 4,
          "p": 2
        },
        "final": {
          "w": 2,
          "p": 3
        },
        "requiredTaken": {
          "w": 1,
          "p": 5
        },
        "tradeRequired": true
      }
    },
    {
      "id": "link-splitfraction-mixedexchange",
      "sessionId": "link-splitfraction-mixedexchange",
      "index": 1,
      "nodeId": "mt_70qDTI14td",
      "taskHash": "b7d0c6bf5ed1acaf76ad51220632f8dc9ea48e467f16e9a33102c7344a95b6eb",
      "task": {
        "type": "x-mixedtrade",
        "a": [
          4,
          2
        ],
        "op": "-",
        "b": [
          1,
          5
        ],
        "d": 6,
        "prompt": "小份不够拿走时，试着换开一个整体；也可以先全部换成小份。",
        "trade": true
      },
      "expected": {
        "operandA": [
          13,
          3
        ],
        "operandB": [
          11,
          6
        ],
        "initialQuantity": [
          13,
          3
        ],
        "result": [
          5,
          2
        ],
        "denominator": 6,
        "initial": {
          "w": 4,
          "p": 2
        },
        "final": {
          "w": 2,
          "p": 3
        },
        "requiredTaken": {
          "w": 1,
          "p": 5
        },
        "tradeRequired": true
      }
    },
    {
      "id": "link-mixedexchange-fractionstories",
      "sessionId": "link-mixedexchange-fractionstories",
      "index": 0,
      "nodeId": "mt_ZLqYE7la4Z",
      "taskHash": "ed74b4b61fb0b3793559c62808c909a388d1e725692de98394031333f17e6dd0",
      "task": {
        "type": "x-mixedtrade",
        "a": [
          2,
          3
        ],
        "op": "+",
        "b": [
          1,
          4
        ],
        "d": 5,
        "prompt": "两段整份和零头合起来。小份够一个整体时，把它们合拢。",
        "trade": true
      },
      "expected": {
        "operandA": [
          13,
          5
        ],
        "operandB": [
          9,
          5
        ],
        "initialQuantity": [
          22,
          5
        ],
        "result": [
          22,
          5
        ],
        "denominator": 5,
        "initial": {
          "w": 3,
          "p": 7
        },
        "final": {
          "w": 4,
          "p": 2
        },
        "requiredTaken": {
          "w": 0,
          "p": 0
        },
        "tradeRequired": true
      }
    }
  ],
  "practices": [
    {
      "id": "mixedexchange",
      "sessionId": "mixedexchange",
      "index": -1,
      "nodeId": "mt_70qDTI14td",
      "taskHash": "ed74b4b61fb0b3793559c62808c909a388d1e725692de98394031333f17e6dd0",
      "task": {
        "type": "x-mixedtrade",
        "a": [
          2,
          3
        ],
        "op": "+",
        "b": [
          1,
          4
        ],
        "d": 5,
        "prompt": "两段整份和零头合起来。小份够一个整体时，把它们合拢。",
        "trade": true
      },
      "expected": {
        "operandA": [
          13,
          5
        ],
        "operandB": [
          9,
          5
        ],
        "initialQuantity": [
          22,
          5
        ],
        "result": [
          22,
          5
        ],
        "denominator": 5,
        "initial": {
          "w": 3,
          "p": 7
        },
        "final": {
          "w": 4,
          "p": 2
        },
        "requiredTaken": {
          "w": 0,
          "p": 0
        },
        "tradeRequired": true
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b18.js": "42a8183150eac38507cba09cbae6b9adc2ee0ff43dd4f820a56e4c17f8c05dd9",
    "dist/learning/phase5/b18-model.js": "8c1f393446397b64ff583afc0d7c08486c447f6b8c6d9fbb967b6396d3c7ec74",
    "dist/learning/phase5/b18-view.js": "65b37faa851efc0d2f1b50a4f928b73a3be9aadda5fa29659c5e13475987fff9",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab",
    "dist/learning/phase5/b17-model.js": "52e8665b482c26ad444c95096130ef87c89b0793038db101fcc2cce23320ae78"
  }
};
