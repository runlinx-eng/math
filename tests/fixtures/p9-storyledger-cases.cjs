// Fixed reviewed sources and independent exact prefix balances; not generated in CI.
module.exports={
  "reviewedSourceCommit": "a1a2ec3760e8f72758413276ee88d7b9a235eaa1",
  "issue": 164,
  "cases": [
    {
      "id": "storymoney",
      "sessionId": "storymoney",
      "index": 0,
      "nodeId": "mt_wzAZ8qFDc4",
      "taskHash": "eeff7a50c203b6c5f06ba36da36f3d437d63a6c80dbbaf499036bfdfc257fd65",
      "task": {
        "type": "x-storyledger",
        "start": 35,
        "steps": [
          {
            "text": "花掉12元。",
            "op": "-",
            "amount": 12
          },
          {
            "text": "后来又得到5元。",
            "op": "+",
            "amount": 5
          }
        ],
        "unit": "元",
        "prompt": "模拟小账本：原来35元，两件事都发生后还剩多少？"
      },
      "balances": [
        35,
        23,
        28
      ]
    },
    {
      "id": "storymoney",
      "sessionId": "storymoney",
      "index": 1,
      "nodeId": "mt_wzAZ8qFDc4",
      "taskHash": "0cf170e256f448619d3ce9b894e9c7fa1b7778759848fca77628c5048df454ca",
      "task": {
        "type": "x-storyledger",
        "start": 45,
        "steps": [
          {
            "text": "剪去18厘米。",
            "op": "-",
            "amount": 18
          }
        ],
        "unit": "厘米",
        "prompt": "一根45厘米的彩带，剪去一段后还剩多长？"
      },
      "balances": [
        45,
        27
      ]
    },
    {
      "id": "storymoney",
      "sessionId": "storymoney",
      "index": 2,
      "nodeId": "mt_wzAZ8qFDc4",
      "taskHash": "66b9dc151c08ad941259ae8d0ab3d6002397c4402475471d4b5eb24a29208e30",
      "task": {
        "type": "x-storyledger",
        "start": 32,
        "steps": [
          {
            "text": "小雨有32枚，比小林多8枚。现在求小林有多少。",
            "op": "-",
            "amount": 8
          }
        ],
        "unit": "枚",
        "prompt": "看到“多”，就一定要相加吗？跟住正在求的那一堆。"
      },
      "balances": [
        32,
        24
      ]
    },
    {
      "id": "storylarger",
      "sessionId": "storylarger",
      "index": 0,
      "nodeId": "mt_-F_Lv_apzH",
      "taskHash": "64108a269019125b4ad512bc04a61b16d0c8acf44cddab2f4a90ecf43aa2f901",
      "task": {
        "type": "x-storyledger",
        "start": 35,
        "steps": [
          {
            "text": "先花掉12元。",
            "op": "-",
            "amount": 12
          },
          {
            "text": "又得到5元。",
            "op": "+",
            "amount": 5
          }
        ],
        "unit": "元",
        "prompt": "先用小账本试两步：中间结果留下，故事继续。"
      },
      "balances": [
        35,
        23,
        28
      ]
    },
    {
      "id": "storylarger",
      "sessionId": "storylarger",
      "index": 2,
      "nodeId": "mt_-F_Lv_apzH",
      "taskHash": "1952eec2dea04ae2666404e8d84de4c27a8d7c7c6a516885f89068d4fab09765",
      "task": {
        "type": "x-storyledger",
        "start": 25000,
        "steps": [
          {
            "text": "目标25000个，第一周已收集12450个。求还差多少。",
            "op": "-",
            "amount": 12450
          },
          {
            "text": "第二周又收集8372个。继续求还差多少。",
            "op": "-",
            "amount": 8372
          }
        ],
        "unit": "个",
        "prompt": "目标25000个。每周过去后，更新距离目标还差多少。"
      },
      "balances": [
        25000,
        12550,
        4178
      ]
    },
    {
      "id": "storylarger",
      "sessionId": "storylarger",
      "index": 4,
      "nodeId": "mt_-F_Lv_apzH",
      "taskHash": "48aeb52bf307a94919263b503d4989fd1b62c4ecca240000f6b566d3e3f84ea8",
      "task": {
        "type": "x-storyledger",
        "start": 41000,
        "steps": [
          {
            "text": "支付18650元。",
            "op": "-",
            "amount": 18650
          },
          {
            "text": "收到9200元。",
            "op": "+",
            "amount": 9200
          },
          {
            "text": "再支付10750元。",
            "op": "-",
            "amount": 10750
          }
        ],
        "unit": "元",
        "prompt": "模拟活动账本：原有41000元，三次变化后剩多少？"
      },
      "balances": [
        41000,
        22350,
        31550,
        20800
      ]
    },
    {
      "id": "storymillion",
      "sessionId": "storymillion",
      "index": 1,
      "nodeId": "mt_M1tnXqmYbn",
      "taskHash": "517145051e94e184482630bb9258d465d8c470a8fcb17bd3af670a7b7fe637ba",
      "task": {
        "type": "x-storyledger",
        "start": 3450000,
        "steps": [
          {
            "text": "支出1280000元。",
            "op": "-",
            "amount": 1280000
          },
          {
            "text": "收到2000000元。",
            "op": "+",
            "amount": 2000000
          },
          {
            "text": "再支出675450元。",
            "op": "-",
            "amount": 675450
          }
        ],
        "unit": "元",
        "prompt": "模拟账本：每一步选自己的算法，别把中间结果当结尾。"
      },
      "balances": [
        3450000,
        2170000,
        4170000,
        3494550
      ]
    },
    {
      "id": "storymillion",
      "sessionId": "storymillion",
      "index": 3,
      "nodeId": "mt_M1tnXqmYbn",
      "taskHash": "a9a942a1984a5f604f389df734771d96d3c52cafc14aa7356a4cdd7ffa0d253f",
      "task": {
        "type": "x-storyledger",
        "start": 10000,
        "steps": [
          {
            "text": "支付34.75元。",
            "op": "-",
            "amount": 3475
          },
          {
            "text": "收到12.50元。",
            "op": "+",
            "amount": 1250
          },
          {
            "text": "再支付28.60元。",
            "op": "-",
            "amount": 2860
          }
        ],
        "unit": "元",
        "prompt": "换成带小数的模拟账本，三次变化都要记录。",
        "scale": 100
      },
      "balances": [
        10000,
        6525,
        7775,
        4915
      ]
    }
  ],
  "associatedCases": [
    {
      "id": "link-twodigitpair-storymoney",
      "sessionId": "link-twodigitpair-storymoney",
      "index": 1,
      "taskHash": "eeff7a50c203b6c5f06ba36da36f3d437d63a6c80dbbaf499036bfdfc257fd65",
      "task": {
        "type": "x-storyledger",
        "start": 35,
        "steps": [
          {
            "text": "花掉12元。",
            "op": "-",
            "amount": 12
          },
          {
            "text": "后来又得到5元。",
            "op": "+",
            "amount": 5
          }
        ],
        "unit": "元",
        "prompt": "模拟小账本：原来35元，两件事都发生后还剩多少？"
      },
      "balances": [
        35,
        23,
        28
      ]
    },
    {
      "id": "link-columnlarge-storylarger",
      "sessionId": "link-columnlarge-storylarger",
      "index": 1,
      "taskHash": "1952eec2dea04ae2666404e8d84de4c27a8d7c7c6a516885f89068d4fab09765",
      "task": {
        "type": "x-storyledger",
        "start": 25000,
        "steps": [
          {
            "text": "目标25000个，第一周已收集12450个。求还差多少。",
            "op": "-",
            "amount": 12450
          },
          {
            "text": "第二周又收集8372个。继续求还差多少。",
            "op": "-",
            "amount": 8372
          }
        ],
        "unit": "个",
        "prompt": "目标25000个。每周过去后，更新距离目标还差多少。"
      },
      "balances": [
        25000,
        12550,
        4178
      ]
    },
    {
      "id": "link-storylarger-storymillion",
      "sessionId": "link-storylarger-storymillion",
      "index": 0,
      "taskHash": "48aeb52bf307a94919263b503d4989fd1b62c4ecca240000f6b566d3e3f84ea8",
      "task": {
        "type": "x-storyledger",
        "start": 41000,
        "steps": [
          {
            "text": "支付18650元。",
            "op": "-",
            "amount": 18650
          },
          {
            "text": "收到9200元。",
            "op": "+",
            "amount": 9200
          },
          {
            "text": "再支付10750元。",
            "op": "-",
            "amount": 10750
          }
        ],
        "unit": "元",
        "prompt": "模拟活动账本：原有41000元，三次变化后剩多少？"
      },
      "balances": [
        41000,
        22350,
        31550,
        20800
      ]
    },
    {
      "id": "link-storylarger-storymillion",
      "sessionId": "link-storylarger-storymillion",
      "index": 1,
      "taskHash": "517145051e94e184482630bb9258d465d8c470a8fcb17bd3af670a7b7fe637ba",
      "task": {
        "type": "x-storyledger",
        "start": 3450000,
        "steps": [
          {
            "text": "支出1280000元。",
            "op": "-",
            "amount": 1280000
          },
          {
            "text": "收到2000000元。",
            "op": "+",
            "amount": 2000000
          },
          {
            "text": "再支出675450元。",
            "op": "-",
            "amount": 675450
          }
        ],
        "unit": "元",
        "prompt": "模拟账本：每一步选自己的算法，别把中间结果当结尾。"
      },
      "balances": [
        3450000,
        2170000,
        4170000,
        3494550
      ]
    },
    {
      "id": "link-plansteps-storylarger",
      "sessionId": "link-plansteps-storylarger",
      "index": 1,
      "taskHash": "1952eec2dea04ae2666404e8d84de4c27a8d7c7c6a516885f89068d4fab09765",
      "task": {
        "type": "x-storyledger",
        "start": 25000,
        "steps": [
          {
            "text": "目标25000个，第一周已收集12450个。求还差多少。",
            "op": "-",
            "amount": 12450
          },
          {
            "text": "第二周又收集8372个。继续求还差多少。",
            "op": "-",
            "amount": 8372
          }
        ],
        "unit": "个",
        "prompt": "目标25000个。每周过去后，更新距离目标还差多少。"
      },
      "balances": [
        25000,
        12550,
        4178
      ]
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b11.js": "fb10f142ba8f634591e21570e21855f7294127cc1132bde3cc97784dd3979503",
    "dist/learning/phase5/b11-model.js": "eb3fedefcf516915009bef41fb6a57a5de41aafda17e92c9b20f28a447720504",
    "dist/learning/phase5/b11-view.js": "76a245f5c9b12100e26eb4e21579f556e3592c2f4570063cb04712e03677add5",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8"
  }
};
