// Fixed native sources and hand-checked reduction quantities. No adapter/solver import.
module.exports={
  "cases": [
    {
      "id": "bracketlab",
      "index": 0,
      "nodeId": "mt_8jFSnXxqQD",
      "task": {
        "type": "x-orderlab",
        "expression": "3*(4+5)",
        "prompt": "3份相同的(4+5)，你准备先合哪一块？"
      },
      "taskHash": "a0d5ae6188a42b6d93cb33a5a0854f483b58152390e66fadca6b7cf1f446ebd8",
      "steps": [
        [
          3,
          "9"
        ],
        [
          1,
          "27"
        ]
      ],
      "answer": "27"
    },
    {
      "id": "bracketlab",
      "index": 1,
      "nodeId": "mt_8jFSnXxqQD",
      "task": {
        "type": "x-orderlab",
        "expression": "{2*[3+(7-1)]}",
        "prompt": "一层里面还有一层。从你选的一块开始，逐步合起来。"
      },
      "taskHash": "7b294cfff984bfe33d186d81a6458b0e6bbb3883088e2e89843e881503b29df5",
      "steps": [
        [
          5,
          "6"
        ],
        [
          3,
          "9"
        ],
        [
          1,
          "18"
        ]
      ],
      "answer": "18"
    },
    {
      "id": "bracketlab",
      "index": 2,
      "nodeId": "mt_8jFSnXxqQD",
      "task": {
        "type": "x-orderlab",
        "expression": "8+2*5",
        "prompt": "数字与符号不动，只添括号，让结果变成50。",
        "construct": true,
        "insert": true,
        "expected": "(8+2)*5",
        "target": 50
      },
      "taskHash": "5b6d08f2e12d2c82c620152dc8610ff6a1d28c20d43ac07f6b487a7140770a32",
      "steps": [
        [
          1,
          "10"
        ],
        [
          3,
          "50"
        ]
      ],
      "answer": "50"
    },
    {
      "id": "orderlab",
      "index": 0,
      "nodeId": "mt_jHgRQ4hR0g",
      "task": {
        "type": "x-orderlab",
        "expression": "8+2*5",
        "prompt": "8再加2份5。先准备哪一块，才能让大家读出同一个结果？"
      },
      "taskHash": "65bfbb7ed5ac5f13a1ecd3329e41baa645a14eb3d92f86f486a6394ef576696a",
      "steps": [
        [
          3,
          "10"
        ],
        [
          1,
          "18"
        ]
      ],
      "answer": "18"
    },
    {
      "id": "orderlab",
      "index": 1,
      "nodeId": "mt_jHgRQ4hR0g",
      "task": {
        "type": "x-orderlab",
        "expression": "12/3+4*2",
        "prompt": "两边都准备好，再合到一起。可以先处理互不影响的任意一边。"
      },
      "taskHash": "8777b0a26439b668eabc13d78b34d55f0901ecfd8451d59c3cb3d00e2040cfe1",
      "steps": [
        [
          1,
          "4"
        ],
        [
          5,
          "8"
        ],
        [
          3,
          "12"
        ]
      ],
      "answer": "12"
    },
    {
      "id": "orderlab",
      "index": 2,
      "nodeId": "mt_jHgRQ4hR0g",
      "task": {
        "type": "x-orderlab",
        "expression": "12/2*3",
        "prompt": "同一层的除与乘，从左往右接。先乘2×3会换成另一件事。"
      },
      "taskHash": "9be2131a764cc3a39bdbfb6070c2163f082d9c35d8ff25220c9302efa11a1f06",
      "steps": [
        [
          1,
          "6"
        ],
        [
          3,
          "18"
        ]
      ],
      "answer": "18"
    },
    {
      "id": "orderlab",
      "index": 3,
      "nodeId": "mt_jHgRQ4hR0g",
      "task": {
        "type": "x-orderlab",
        "expression": "20-6+2",
        "prompt": "同一层的减与加，从左往右接。这里没有把6+2抱在一起的括号。"
      },
      "taskHash": "864fa43db9065803dc07089d97cd40e5c6f581beabd097423a63b4b895e664e2",
      "steps": [
        [
          1,
          "14"
        ],
        [
          3,
          "16"
        ]
      ],
      "answer": "16"
    },
    {
      "id": "powerorder",
      "index": 0,
      "nodeId": "mt_X5cypSGoGU",
      "task": {
        "type": "x-orderlab",
        "expression": "3+2^3*4",
        "prompt": "先处理“3个2相乘”这一块，再按约定接下去。"
      },
      "taskHash": "4681f3636ef8eb0627de0dc45125c76c9919b088c62fb9c15f521aa67ee467db",
      "steps": [
        [
          3,
          "8"
        ],
        [
          5,
          "32"
        ],
        [
          1,
          "35"
        ]
      ],
      "answer": "35"
    },
    {
      "id": "powerorder",
      "index": 1,
      "nodeId": "mt_X5cypSGoGU",
      "task": {
        "type": "x-orderlab",
        "expression": "-3^2",
        "prompt": "先把3平方，再取负：这里负号抱住了哪一块？"
      },
      "taskHash": "16b281f9f30301404e4d6d38f80ec4c4dd5d030c46b484a31fd3a83c34658d07",
      "steps": [
        [
          2,
          "9"
        ],
        [
          0,
          "-9"
        ]
      ],
      "answer": "-9"
    },
    {
      "id": "powerorder",
      "index": 2,
      "nodeId": "mt_X5cypSGoGU",
      "task": {
        "type": "x-orderlab",
        "expression": "(-3)^2",
        "prompt": "这次负3被括号抱在一起，平方的是谁？"
      },
      "taskHash": "5596cece3beaff2b0e2074f92dd08bb010132be8b6c61ffcdfa6599d862b3d0e",
      "steps": [
        [
          0,
          "-3"
        ],
        [
          2,
          "9"
        ]
      ],
      "answer": "9"
    },
    {
      "id": "powerorder",
      "index": 3,
      "nodeId": "mt_X5cypSGoGU",
      "task": {
        "type": "x-orderlab",
        "expression": "√(9+16)",
        "prompt": "根号下面的一整块先准备好。两个数分别开平方再相加，会变成另一道题。"
      },
      "taskHash": "d1957cb9ba05e69f26d2d53254318ba013186a3b31c785258e0b2355983baefa",
      "steps": [
        [
          2,
          "25"
        ],
        [
          0,
          "5"
        ]
      ],
      "answer": "5"
    },
    {
      "id": "powerorder",
      "index": 4,
      "nodeId": "mt_X5cypSGoGU",
      "task": {
        "type": "x-orderlab",
        "expression": "",
        "prompt": "用5乘另一个数得到1。写出含有除法的那一份，再亲自合出来。",
        "construct": true,
        "expected": "5*(1/5)",
        "target": 1
      },
      "taskHash": "1faa76ea37e8e471c3da22e14633229996d60159f40d2d6e06827ef978a513fc",
      "steps": [
        [
          3,
          "0.2"
        ],
        [
          1,
          "1"
        ]
      ],
      "answer": "1"
    },
    {
      "id": "signedproducts",
      "index": 3,
      "nodeId": "mt_rxInpOQ74w",
      "task": {
        "type": "x-orderlab",
        "expression": "(6+(-2)*4)/2-(-1.5)",
        "prompt": "模拟记账：6元余额，扣4次每次2元，结果平均记到两个账户，再撤销1.5元欠款。按这段关系计算其中一个账户的余额。"
      },
      "taskHash": "19f73e549e454c0f606d38a27a5c0c0f5d1a25a1ca113a4175500867aa98a53b",
      "steps": [
        [
          2,
          "-2"
        ],
        [
          4,
          "-8"
        ],
        [
          1,
          "-2"
        ],
        [
          6,
          "-1"
        ],
        [
          9,
          "-1.5"
        ],
        [
          8,
          "0.5"
        ]
      ],
      "answer": "0.5"
    },
    {
      "id": "mentalchoices",
      "index": 1,
      "nodeId": "mt_vmW2cb5c7A",
      "task": {
        "type": "x-orderlab",
        "expression": "45*2*2*2",
        "prompt": "同一个45×8，换成连续三次加倍。算完比较哪种办法顺手。"
      },
      "taskHash": "43d5058cc5cccffc661b3155fb288c94887358901bb7566e81dd1bc5a5f9ae16",
      "steps": [
        [
          1,
          "90"
        ],
        [
          3,
          "180"
        ],
        [
          5,
          "360"
        ]
      ],
      "answer": "360"
    },
    {
      "id": "mentalchoices",
      "index": 3,
      "nodeId": "mt_vmW2cb5c7A",
      "task": {
        "type": "x-orderlab",
        "expression": "250*3+500",
        "prompt": "先找出250的3份，再与500合起来。"
      },
      "taskHash": "6ced27ae14727a9b656f735825d1b31e5bb50a028d6c6c678607d274200fb36f",
      "steps": [
        [
          1,
          "750"
        ],
        [
          3,
          "1250"
        ]
      ],
      "answer": "1250"
    },
    {
      "id": "mentalchoices",
      "index": 4,
      "nodeId": "mt_vmW2cb5c7A",
      "task": {
        "type": "x-orderlab",
        "expression": "100*6-6",
        "prompt": "99×6借100×6以后，多算的是一整份6。把这一份退回去。"
      },
      "taskHash": "4dee0a000dfafc36e93c2b3611d387ed62ee2a173fedd5b79b5791f6f2a1bde8",
      "steps": [
        [
          1,
          "600"
        ],
        [
          3,
          "594"
        ]
      ],
      "answer": "594"
    },
    {
      "id": "storyfraction",
      "index": 0,
      "nodeId": "mt_dXq9VWm31W",
      "task": {
        "type": "x-orderlab",
        "expression": "",
        "construct": true,
        "expected": "320-125",
        "writeOnly": false,
        "prompt": "一条320厘米的绳用掉125厘米。写出找剩余长度的关系，再实际算出来。"
      },
      "taskHash": "009dd6c53f4aeadb8fc3b09fb3c91935ad674a31980622c8558b23489e71b162",
      "steps": [
        [
          1,
          "195"
        ]
      ],
      "answer": "195"
    }
  ],
  "excluded": [
    {
      "sessionId": "expressions",
      "index": 0,
      "nodeId": "mt_4WaKWECpcv",
      "task": {
        "type": "x-orderlab",
        "expression": "",
        "prompt": "把“8与7先合起来，再取2份”写成一行。只表示关系，不必算结果。",
        "construct": true,
        "expected": "(8+7)*2",
        "writeOnly": true
      }
    },
    {
      "sessionId": "expressions",
      "index": 1,
      "nodeId": "mt_4WaKWECpcv",
      "task": {
        "type": "x-orderlab",
        "expression": "4*(365-12)",
        "prompt": "把“先从365拿走12，再取4份”写出来。上方是要表达的关系，不必算总数。",
        "construct": true,
        "expected": "4*(365-12)",
        "writeOnly": true
      }
    },
    {
      "sessionId": "expressions",
      "index": 2,
      "nodeId": "mt_4WaKWECpcv",
      "task": {
        "type": "x-orderlab",
        "expression": "",
        "prompt": "甲是18932与921的和，乙是甲的3倍。写出乙，再比较，先不算两个大数。",
        "construct": true,
        "expected": "3*(18932+921)",
        "writeOnly": true,
        "reason": "triple",
        "choices": [
          [
            "triple",
            "乙是甲的3倍"
          ],
          [
            "plus",
            "乙比甲多3"
          ],
          [
            "same",
            "两者相等"
          ]
        ]
      }
    }
  ],
  "associated": [
    {
      "sessionId": "link-bracketlab-expressions",
      "index": 0,
      "task": {
        "type": "x-orderlab",
        "expression": "3*(4+5)",
        "prompt": "3份相同的(4+5)，你准备先合哪一块？"
      }
    },
    {
      "sessionId": "link-bracketlab-expressions",
      "index": 1,
      "task": {
        "type": "x-orderlab",
        "expression": "",
        "prompt": "把“8与7先合起来，再取2份”写成一行。只表示关系，不必算结果。",
        "construct": true,
        "expected": "(8+7)*2",
        "writeOnly": true
      }
    },
    {
      "sessionId": "link-bracketlab-orderlab",
      "index": 0,
      "task": {
        "type": "x-orderlab",
        "expression": "{2*[3+(7-1)]}",
        "prompt": "一层里面还有一层。从你选的一块开始，逐步合起来。"
      }
    },
    {
      "sessionId": "link-bracketlab-orderlab",
      "index": 1,
      "task": {
        "type": "x-orderlab",
        "expression": "12/2*3",
        "prompt": "同一层的除与乘，从左往右接。先乘2×3会换成另一件事。"
      }
    },
    {
      "sessionId": "link-orderlab-powerorder",
      "index": 0,
      "task": {
        "type": "x-orderlab",
        "expression": "12/3+4*2",
        "prompt": "两边都准备好，再合到一起。可以先处理互不影响的任意一边。"
      }
    },
    {
      "sessionId": "link-orderlab-powerorder",
      "index": 1,
      "task": {
        "type": "x-orderlab",
        "expression": "3+2^3*4",
        "prompt": "先处理“3个2相乘”这一块，再按约定接下去。"
      }
    },
    {
      "sessionId": "link-orderlab-undocalc",
      "index": 0,
      "task": {
        "type": "x-orderlab",
        "expression": "8+2*5",
        "prompt": "8再加2份5。先准备哪一块，才能让大家读出同一个结果？"
      }
    },
    {
      "sessionId": "link-orderlab-storyoperations",
      "index": 0,
      "task": {
        "type": "x-orderlab",
        "expression": "12/3+4*2",
        "prompt": "两边都准备好，再合到一起。可以先处理互不影响的任意一边。"
      }
    },
    {
      "sessionId": "link-remainders-bracketlab",
      "index": 1,
      "task": {
        "type": "x-orderlab",
        "expression": "3*(4+5)",
        "prompt": "3份相同的(4+5)，你准备先合哪一块？"
      }
    },
    {
      "sessionId": "link-bigproduct-bracketlab",
      "index": 1,
      "task": {
        "type": "x-orderlab",
        "expression": "3*(4+5)",
        "prompt": "3份相同的(4+5)，你准备先合哪一块？"
      }
    },
    {
      "sessionId": "link-expressions-formula36",
      "index": 0,
      "task": {
        "type": "x-orderlab",
        "expression": "",
        "prompt": "把“8与7先合起来，再取2份”写成一行。只表示关系，不必算结果。",
        "construct": true,
        "expected": "(8+7)*2",
        "writeOnly": true
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b15-model.js": "d73277dd8e285e8d37fc196f6b9bb02421f84276f4c0721cc129780e62cbe7bb",
    "dist/learning/phase5/b15-view.js": "faa0b7a58440e91423adef782bc40170812f80726521b935a3289a75251a306e",
    "dist/learning/phase5/b15.js": "91f41daf086f02ea42f1aa9f75cd8b74122f2c646588d5b91fbe05a690b86369",
    "dist/learning/phase5/b16.js": "32dd356d23a765122b60e0c40d804d7ee9353e3950757386704a6e9435e39d79"
  }
};
