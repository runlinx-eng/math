// Six unchanged prerequisite routes; none is ruler native evidence.
module.exports={
  "schema": "math-ruler-literal-navigation/1",
  "navigation": [
    {
      "id": "lengthstart",
      "index": 0,
      "task": {
        "type": "x-m28-units",
        "prompt": "用一样长的回形针把这本模拟书从头量到尾。",
        "length": 8,
        "size": 2,
        "unit": "回形针",
        "object": "书",
        "questions": []
      },
      "steps": [
        {
          "action": "m28-place",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "4"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "6"
          }
        },
        {
          "field": "measure",
          "value": "4"
        },
        {
          "field": "unit",
          "value": "回形针"
        },
        {
          "action": "m28-record",
          "data": {}
        }
      ],
      "taskHash": "b31208795cc4f548471711716cb77006d027902ca1a7ae7f657b80cebb5595d1",
      "strictRulerCoverage": false,
      "role": "prerequisite"
    },
    {
      "id": "communicate38",
      "index": 0,
      "task": {
        "type": "x-balance",
        "left": "5",
        "right": "2 + 3",
        "l": 5,
        "r": 5,
        "prompt": "“答案”在左边也能成立吗？用两盘珠子检查。"
      },
      "steps": [
        {
          "action": "balance-add",
          "data": {
            "side": "left",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "left",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "left",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "left",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "left",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "right",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "right",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "right",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "right",
            "delta": "1"
          }
        },
        {
          "action": "balance-add",
          "data": {
            "side": "right",
            "delta": "1"
          }
        },
        {
          "field": "guess",
          "value": "level"
        },
        {
          "action": "balance-release",
          "data": {}
        },
        {
          "field": "symbol",
          "value": "equal"
        }
      ],
      "taskHash": "23b489d4ffd0e44f95012b6e3868e234549400f9bc21a1cd441b3b6111e5edaa",
      "strictRulerCoverage": false,
      "role": "prerequisite"
    },
    {
      "id": "strategy39",
      "index": 0,
      "task": {
        "type": "x-s39-choose",
        "prompt": "345＋200，你想怎样算？",
        "display": "345＋200",
        "operator": "+",
        "operands": [
          345,
          200
        ],
        "result": 545
      },
      "steps": [
        {
          "field": "method",
          "value": "calculator"
        },
        {
          "field": "entry",
          "value": "345+200"
        },
        {
          "action": "s39-run",
          "data": {}
        },
        {
          "field": "answer",
          "value": "545"
        }
      ],
      "taskHash": "a6d2783245da097ec131ef1aaa320dbe598b1c977c304f1c51597acddaedba87",
      "strictRulerCoverage": false,
      "role": "prerequisite"
    },
    {
      "id": "strategy39",
      "index": 1,
      "task": {
        "type": "x-s39-choose",
        "prompt": "换成345＋278。还想用同一种方法吗？",
        "display": "345＋278",
        "operator": "+",
        "operands": [
          345,
          278
        ],
        "result": 623
      },
      "steps": [
        {
          "field": "method",
          "value": "calculator"
        },
        {
          "field": "entry",
          "value": "345+278"
        },
        {
          "action": "s39-run",
          "data": {}
        },
        {
          "field": "answer",
          "value": "623"
        }
      ],
      "taskHash": "a21a29e89f3a1fb2f593b1ca1ceea56b14b97e5725220d0651f2b6add84103ac",
      "strictRulerCoverage": false,
      "role": "prerequisite"
    },
    {
      "id": "link-sameunitlength-lengthtools",
      "index": 0,
      "task": {
        "type": "x-m28-units",
        "prompt": "把同样长的小块从头到尾挨着放。",
        "length": 6,
        "size": 1,
        "unit": "块",
        "object": "书",
        "questions": []
      },
      "steps": [
        {
          "action": "m28-place",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "3"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "4"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "5"
          }
        },
        {
          "field": "measure",
          "value": "6"
        },
        {
          "field": "unit",
          "value": "块"
        },
        {
          "action": "m28-record",
          "data": {}
        }
      ],
      "taskHash": "f904cc1319ef9db443aed2713f6f715f1fee69a138669c218902dcf108097125",
      "strictRulerCoverage": false,
      "role": "prerequisite"
    },
    {
      "id": "link-measure-measurecalc",
      "index": 0,
      "task": {
        "type": "x-measure",
        "attribute": "length",
        "value": 80,
        "start": 3,
        "object": "桌面",
        "unit": "cm",
        "prompt": "选好工具和单位，把尺的零点对准桌面左边，再用厘米（cm）记录长度。"
      },
      "steps": [
        {
          "action": "tool",
          "data": {
            "value": "length"
          }
        },
        {
          "field": "zero",
          "value": 3
        },
        {
          "field": "reading",
          "value": 80
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "taskHash": "d8f506c1104c63b4bda43c7554b2f471247ed3fcd6549422b54195832604977d",
      "strictRulerCoverage": false,
      "role": "prerequisite"
    }
  ],
  "sourceHashes": {
    "dist/learning/learn.js": "d83d4394a40122f750bc15e0c969d1683428183d51113a4991819552924c4378"
  },
  "controllerSourceHashes": {
    "update": "e9cce21f3f3cf36ba81f6d4996bc6bc090e22cb545cc0a2e7349720c9f0ff1cc",
    "edit": "dd160130be6cb009cb9d6bdd08cc47bb44b5a77f5be9d8dd76d46798803930ca",
    "extra": "918b63bd101f235a1cc550b4ddfb17dba29dcd5a38674fe8d581e7f55b432021",
    "input": "3664a0e098d53fbb497de83251b2ff2e29bde395ac8357c4c8dcf3618ee7c6d4",
    "shared": "4c2c7ede8f9effcfc581029f1d1b29913e8905dc550054f37c5f0f2a1d58d724"
  }
};
