// Fixed reviewed B18 native positions; the shared B17 widget never grants a binding.
module.exports={
  "cases": [
    {
      "id": "joinfractions",
      "index": 0,
      "nodeId": "mt_a1FdAsRKOF",
      "taskHash": "a1cd80b4e2d9c1899e8e85ca6beecdfc2f046d6552f3556400db821ff340b07b",
      "a": "2/5",
      "op": "+",
      "b": "2/5",
      "result": [
        4,
        5
      ],
      "flags": {},
      "sessionId": "joinfractions",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/5",
        "op": "+",
        "b": "2/5",
        "prompt": "同样大小的面包，取出两份2/5。先猜，再接起来。",
        "scene": "2/5　与　2/5"
      }
    },
    {
      "id": "joinfractions",
      "index": 1,
      "nodeId": "mt_a1FdAsRKOF",
      "taskHash": "ded380bbd681cde1ffd4fada597223bb52ef5689589ccd5313d71bff40077e0a",
      "a": "6/8",
      "op": "-",
      "b": "3/8",
      "result": [
        3,
        8
      ],
      "flags": {},
      "sessionId": "joinfractions",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "6/8",
        "op": "-",
        "b": "3/8",
        "prompt": "原来有6/8，取走3/8。拿走的是几小份？",
        "scene": "6/8　与　3/8"
      }
    },
    {
      "id": "joinfractions",
      "index": 2,
      "nodeId": "mt_a1FdAsRKOF",
      "taskHash": "88bebb6511e397b1fd58853d3729eb9d309aee43276af65daa25c7c975e610dd",
      "a": "3/7",
      "op": "+",
      "b": "2/7",
      "result": [
        5,
        7
      ],
      "flags": {},
      "sessionId": "joinfractions",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3/7",
        "op": "+",
        "b": "2/7",
        "prompt": "换成七分之一。合起来时，每份的大小会不会变？",
        "scene": "3/7　与　2/7"
      }
    },
    {
      "id": "joinfractions",
      "index": 3,
      "nodeId": "mt_a1FdAsRKOF",
      "taskHash": "4bb516c3314a3e253a9004c51c2c4ed2e6fd0c340311c46b35b38a2c04f3eddd",
      "a": "5/6",
      "op": "-",
      "b": "1/6",
      "result": [
        2,
        3
      ],
      "flags": {},
      "sessionId": "joinfractions",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "5/6",
        "op": "-",
        "b": "1/6",
        "prompt": "换一种份，再做一次拿走；保留同一个整体。",
        "scene": "5/6　与　1/6"
      }
    },
    {
      "id": "fractioncarry",
      "index": 0,
      "nodeId": "mt_CBHwluE6Lp",
      "taskHash": "58704f2d23539b525663fdf710370eb4cd434e252ea8c070c4289ebaf2a39331",
      "a": "3/5",
      "op": "+",
      "b": "4/5",
      "result": [
        7,
        5
      ],
      "flags": {
        "mixed": true
      },
      "sessionId": "fractioncarry",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3/5",
        "op": "+",
        "b": "4/5",
        "prompt": "合出的量超过1，把完整的1与零头分别记下。",
        "scene": "3/5　与　4/5",
        "mixed": true
      }
    },
    {
      "id": "fractioncarry",
      "index": 1,
      "nodeId": "mt_CBHwluE6Lp",
      "taskHash": "951b6a2ced6eac4599c1d3409b066e12ff207015a3fab162049073ab28b18c7e",
      "a": "5/6",
      "op": "-",
      "b": "2/6",
      "result": [
        1,
        2
      ],
      "flags": {
        "simple": true
      },
      "sessionId": "fractioncarry",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "5/6",
        "op": "-",
        "b": "2/6",
        "prompt": "五个六分之一拿走两个，剩下的还能怎样合并？",
        "scene": "5/6　与　2/6",
        "simple": true
      }
    },
    {
      "id": "fractioncarry",
      "index": 2,
      "nodeId": "mt_CBHwluE6Lp",
      "taskHash": "58c404a694523a8508acfc6bedb075a9c48314510a803708d8557e22098de29a",
      "a": "7/8",
      "op": "+",
      "b": "3/8",
      "result": [
        5,
        4
      ],
      "flags": {
        "simple": true,
        "mixed": true
      },
      "sessionId": "fractioncarry",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "7/8",
        "op": "+",
        "b": "3/8",
        "prompt": "接过1以后继续数小份；写出整份与剩下的部分。",
        "scene": "7/8　与　3/8",
        "mixed": true,
        "simple": true
      }
    },
    {
      "id": "mixedexchange",
      "index": 3,
      "nodeId": "mt_70qDTI14td",
      "taskHash": "0c2931e9893301ec9c6f18a90f95c742210e2dd980a31975f274a5402eb10a35",
      "a": "2 3/5",
      "op": "+",
      "b": "1 4/5",
      "result": [
        22,
        5
      ],
      "flags": {
        "mixed": true
      },
      "sessionId": "mixedexchange",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2 3/5",
        "op": "+",
        "b": "1 4/5",
        "prompt": "同样的加法，换一种办法：整份和零头全部写成小份，再相加。",
        "scene": "2 3/5　与　1 4/5",
        "mixed": true
      }
    },
    {
      "id": "relatedparts",
      "index": 0,
      "nodeId": "mt_-V7EnqU7gG",
      "taskHash": "738712f55b2c62f2f612c8abdbd7ac1811a7f4fa132ce4df561a5093bd8ea794",
      "a": "1/3",
      "op": "+",
      "b": "1/6",
      "result": [
        1,
        2
      ],
      "flags": {
        "simple": true
      },
      "sessionId": "relatedparts",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "1/3",
        "op": "+",
        "b": "1/6",
        "prompt": "三分之一要切成几个六分之一？量保持不变后再接。",
        "scene": "1/3　与　1/6",
        "simple": true
      }
    },
    {
      "id": "relatedparts",
      "index": 1,
      "nodeId": "mt_-V7EnqU7gG",
      "taskHash": "4b24abd2c6a541a0f90cf78e6fd6405db361780117751f33949f02c36418757a",
      "a": "3/4",
      "op": "-",
      "b": "1/8",
      "result": [
        5,
        8
      ],
      "flags": {},
      "sessionId": "relatedparts",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3/4",
        "op": "-",
        "b": "1/8",
        "prompt": "把四分之一切细，再拿走一个八分之一。",
        "scene": "3/4　与　1/8"
      }
    },
    {
      "id": "relatedparts",
      "index": 2,
      "nodeId": "mt_-V7EnqU7gG",
      "taskHash": "e868305c9e229711f1e1d312d1db66a89c203f9856091e8cba8de85393b8b0a3",
      "a": "2/5",
      "op": "+",
      "b": "3/10",
      "result": [
        7,
        10
      ],
      "flags": {
        "simple": true
      },
      "sessionId": "relatedparts",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/5",
        "op": "+",
        "b": "3/10",
        "prompt": "两种份先变成一样大小，再接成一段。",
        "scene": "2/5　与　3/10",
        "simple": true
      }
    },
    {
      "id": "relatedparts",
      "index": 3,
      "nodeId": "mt_-V7EnqU7gG",
      "taskHash": "a913354ea1641af83bbb1b052850d7c05063ddb9eb5c2f5bf84a796e1de7ee89",
      "a": "1/2",
      "op": "+",
      "b": "3/8",
      "result": [
        7,
        8
      ],
      "flags": {
        "simple": true
      },
      "sessionId": "relatedparts",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "1/2",
        "op": "+",
        "b": "3/8",
        "prompt": "换成一半与八分之一，自己选择共同的小份。",
        "scene": "1/2　与　3/8",
        "simple": true
      }
    },
    {
      "id": "fractionstories",
      "index": 0,
      "nodeId": "mt_ZLqYE7la4Z",
      "taskHash": "99e1290a084caa5d2a90686224efb471f55d084bc66b0dcdf8b5531404cd5ee8",
      "a": "3/4",
      "op": "-",
      "b": "2/4",
      "result": [
        1,
        4
      ],
      "flags": {},
      "sessionId": "fractionstories",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3/4",
        "op": "-",
        "b": "2/4",
        "prompt": "壶里有3/4升，倒出2/4升。先选动作，再摆出原来、拿走与剩下的量。",
        "scene": "3/4升果汁，倒出2/4升"
      }
    },
    {
      "id": "fractionstories",
      "index": 1,
      "nodeId": "mt_ZLqYE7la4Z",
      "taskHash": "740dd38ab293875327b03d25b52c37f43f99a5c465b7f0579a350d1c4a237542",
      "a": "2 3/8",
      "op": "+",
      "b": "1 5/8",
      "result": [
        4,
        1
      ],
      "flags": {
        "mixed": true
      },
      "sessionId": "fractionstories",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2 3/8",
        "op": "+",
        "b": "1 5/8",
        "prompt": "两段绳长2又3/8厘米、1又5/8厘米，接起来多长？",
        "scene": "两段绳子接成一条",
        "mixed": true
      }
    },
    {
      "id": "fractionstories",
      "index": 2,
      "nodeId": "mt_ZLqYE7la4Z",
      "taskHash": "a47eccffbf551068521db7402b005131a3f951a084b00a265c5f555b1a250084",
      "a": "5/6",
      "op": "-",
      "b": "1/3",
      "result": [
        1,
        2
      ],
      "flags": {
        "simple": true
      },
      "sessionId": "fractionstories",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "5/6",
        "op": "-",
        "b": "1/3",
        "prompt": "自己在图上表示：5/6米绳子剪去1/3米。这里画出的是长度。",
        "scene": "5/6米绳子，剪去1/3米",
        "simple": true
      }
    },
    {
      "id": "unlikeparts",
      "index": 0,
      "nodeId": "mt_14T5yPXUq_",
      "taskHash": "08371c55af3e9dc641f2a92985140af550ffc86a5693fdf7aec7cf5dfccf2ff5",
      "a": "2/3",
      "op": "+",
      "b": "5/4",
      "result": [
        23,
        12
      ],
      "flags": {
        "simple": true,
        "estimate": [
          1,
          2
        ]
      },
      "sessionId": "unlikeparts",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/3",
        "op": "+",
        "b": "5/4",
        "prompt": "两种份都要切细。先估范围，再找共同的小份算出准确的和。",
        "scene": "2/3　与　5/4",
        "simple": true,
        "estimate": [
          1,
          2
        ]
      }
    },
    {
      "id": "unlikeparts",
      "index": 1,
      "nodeId": "mt_14T5yPXUq_",
      "taskHash": "f43292f291709538ecc3a7274bf8cc8669af2eb45d18b34c79a0a7c6fc43f833",
      "a": "3 1/4",
      "op": "-",
      "b": "1 3/5",
      "result": [
        33,
        20
      ],
      "flags": {
        "mixed": true
      },
      "sessionId": "unlikeparts",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3 1/4",
        "op": "-",
        "b": "1 3/5",
        "prompt": "整份、零头和不同大小的小份一起出现；都换成共同的小份再拿走。",
        "scene": "3 1/4　与　1 3/5",
        "mixed": true
      }
    },
    {
      "id": "unlikeparts",
      "index": 2,
      "nodeId": "mt_14T5yPXUq_",
      "taskHash": "b933be3e730a5a1de28fbdf28d6607777ab1308e6ec98613b332dcf6bce8a91a",
      "a": "5/6",
      "op": "-",
      "b": "1/4",
      "result": [
        7,
        12
      ],
      "flags": {
        "simple": true
      },
      "sessionId": "unlikeparts",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "5/6",
        "op": "-",
        "b": "1/4",
        "prompt": "换一组数，用自己的共同单位来表示两边，再取走。",
        "scene": "5/6　与　1/4",
        "simple": true
      }
    },
    {
      "id": "fractionarea",
      "index": 0,
      "nodeId": "mt_gx6KQK5-Kx",
      "taskHash": "0dd6fb187a6427af4461495f61e3936ce113c9da7abc6a085e65cf6270062c42",
      "a": "2/3",
      "op": "*",
      "b": "3/4",
      "result": [
        1,
        2
      ],
      "flags": {
        "simple": true,
        "tile": true
      },
      "sessionId": "fractionarea",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/3",
        "op": "*",
        "b": "3/4",
        "prompt": "在同一个单位正方形里，横取2/3，竖取3/4。数两种选择重合的小格。",
        "scene": "2/3　与　3/4",
        "tile": true,
        "simple": true
      }
    },
    {
      "id": "fractionarea",
      "index": 1,
      "nodeId": "mt_gx6KQK5-Kx",
      "taskHash": "62f09db85c9c0793a2fc40be35a8f22a4a16b6abf0f4c38cfd16ce73964a228c",
      "a": "1 1/2",
      "op": "*",
      "b": "2/3",
      "result": [
        1,
        1
      ],
      "flags": {
        "tile": true
      },
      "sessionId": "fractionarea",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "1 1/2",
        "op": "*",
        "b": "2/3",
        "prompt": "横向超过1，单位正方形的大小不变；求这块长方形的面积。",
        "scene": "1 1/2　与　2/3",
        "tile": true
      }
    },
    {
      "id": "fractionarea",
      "index": 2,
      "nodeId": "mt_gx6KQK5-Kx",
      "taskHash": "8c45479d4582d0f9835fb116a9efb3d5b411ba5faad00166e5c35df892a7235f",
      "a": "1/2",
      "op": "*",
      "b": "4/5",
      "result": [
        2,
        5
      ],
      "flags": {
        "simple": true,
        "tile": true
      },
      "sessionId": "fractionarea",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "1/2",
        "op": "*",
        "b": "4/5",
        "prompt": "换一组边长，亲手选择列与行；每小格相对单位面积是多少？",
        "scene": "1/2　与　4/5",
        "tile": true,
        "simple": true
      }
    },
    {
      "id": "productfractions",
      "index": 0,
      "nodeId": "mt_AabJisinfi",
      "taskHash": "6da14ffbe42401c01f00e715af1a48ba2359b0a78e5b5ab1e134b999ac27a8b9",
      "a": "2/3",
      "op": "*",
      "b": "4/5",
      "result": [
        8,
        15
      ],
      "flags": {
        "tile": true
      },
      "sessionId": "productfractions",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/3",
        "op": "*",
        "b": "4/5",
        "prompt": "取2/3中的4/5，用两个方向的选择找到重合部分。",
        "scene": "2/3　与　4/5",
        "tile": true
      }
    },
    {
      "id": "productfractions",
      "index": 1,
      "nodeId": "mt_AabJisinfi",
      "taskHash": "d5377245c793736aa95303421b97836b8852cd2c9ad932ba29f0f1bb7b052c3f",
      "a": "2/3",
      "op": "*",
      "b": "4",
      "result": [
        8,
        3
      ],
      "flags": {
        "mixed": true
      },
      "sessionId": "productfractions",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/3",
        "op": "*",
        "b": "4",
        "prompt": "这次拿4倍，不会越拿越小。跨过1后继续沿同一单位铺。",
        "scene": "2/3　与　4",
        "mixed": true
      }
    },
    {
      "id": "productfractions",
      "index": 2,
      "nodeId": "mt_AabJisinfi",
      "taskHash": "ace5f8052b4480632abaf6ecc942645b47b38b6142a0396ad1bb29178af9a8bb",
      "a": "3/4",
      "op": "*",
      "b": "2/3",
      "result": [
        1,
        2
      ],
      "flags": {
        "simple": true,
        "tile": true
      },
      "sessionId": "productfractions",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3/4",
        "op": "*",
        "b": "2/3",
        "prompt": "乘出的6/12还可以怎样合并？图中的面积不变。",
        "scene": "3/4　与　2/3",
        "simple": true,
        "tile": true
      }
    },
    {
      "id": "fractionrecipe",
      "index": 0,
      "nodeId": "mt_lvaSGHwvQ5",
      "taskHash": "b743153c646675029c5cce575ccb310b7a9ce0703e2ac235c48869f2c9ddaf4a",
      "a": "2 1/3",
      "op": "*",
      "b": "1 1/2",
      "result": [
        7,
        2
      ],
      "flags": {
        "mixed": true,
        "estimate": [
          3,
          4
        ]
      },
      "sessionId": "fractionrecipe",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2 1/3",
        "op": "*",
        "b": "1 1/2",
        "prompt": "一份配方用2又1/3杯，做1又1/2份。先估需要的杯数，再用图核对。",
        "scene": "做一份半，材料跟着配方一起放大",
        "estimate": [
          3,
          4
        ],
        "mixed": true
      }
    },
    {
      "id": "fractionrecipe",
      "index": 1,
      "nodeId": "mt_lvaSGHwvQ5",
      "taskHash": "ea9988387046c54cd77d96252dd177701b85fcd2416ed803431964e16d58ea06",
      "a": "3/4",
      "op": "*",
      "b": "1 1/2",
      "result": [
        9,
        8
      ],
      "flags": {
        "simple": true,
        "estimate": [
          1,
          2
        ]
      },
      "sessionId": "fractionrecipe",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3/4",
        "op": "*",
        "b": "1 1/2",
        "prompt": "另一份配方每份用3/4杯。做一份半，自己构造材料量。",
        "scene": "每份3/4杯，要做一份半",
        "estimate": [
          1,
          2
        ],
        "simple": true
      }
    },
    {
      "id": "fractionrecipe",
      "index": 2,
      "nodeId": "mt_lvaSGHwvQ5",
      "taskHash": "dd47083298ccf70ccbd274976b69c4692e2667a0d83787476b5dd263a5925f78",
      "a": "2/3",
      "op": "*",
      "b": "3/4",
      "result": [
        1,
        2
      ],
      "flags": {
        "simple": true,
        "story": true
      },
      "sessionId": "fractionrecipe",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/3",
        "op": "*",
        "b": "3/4",
        "prompt": "给“2/3的3/4”写一个自己的用量故事，再构造它。",
        "scene": "2/3　与　3/4",
        "story": true,
        "exampleStory": "一条绳长2/3米，取这条绳的3/4，用来绑盒子。",
        "simple": true
      }
    },
    {
      "id": "countsmallgroups",
      "index": 0,
      "nodeId": "mt_1PAWhRhpdg",
      "taskHash": "711a11ffa658a31d97a2a4b1b32810f84c0fd2df7a3b997ac03eda2e929dcca7",
      "a": "4",
      "op": "/",
      "b": "1/5",
      "result": [
        20,
        1
      ],
      "flags": {
        "inverse": true
      },
      "sessionId": "countsmallgroups",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "4",
        "op": "/",
        "b": "1/5",
        "prompt": "4个整体，每一份只装1/5。逐份装好，再用乘法检查总量。",
        "scene": "4升果汁，每杯装1/5升",
        "inverse": true
      }
    },
    {
      "id": "countsmallgroups",
      "index": 1,
      "nodeId": "mt_1PAWhRhpdg",
      "taskHash": "31955bdb4cf41cb6167ee68b0eeabbffef858bcf254c984de814d94a53c64a2c",
      "a": "6",
      "op": "/",
      "b": "1/4",
      "result": [
        24,
        1
      ],
      "flags": {
        "inverse": true,
        "story": true
      },
      "sessionId": "countsmallgroups",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "6",
        "op": "/",
        "b": "1/4",
        "prompt": "给6÷(1/4)写一个自己的分装故事，然后实际装一装。",
        "scene": "总量6，每小份1/4",
        "story": true,
        "exampleStory": "6升水，每瓶装1/4升，能装满多少瓶？",
        "inverse": true
      }
    },
    {
      "id": "countsmallgroups",
      "index": 2,
      "nodeId": "mt_1PAWhRhpdg",
      "taskHash": "2900ff1bbf9db37117084688b22a9aa0ad9472cbc90b42f5e5548236f242972e",
      "a": "3",
      "op": "/",
      "b": "1/2",
      "result": [
        6,
        1
      ],
      "flags": {
        "inverse": true
      },
      "sessionId": "countsmallgroups",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3",
        "op": "/",
        "b": "1/2",
        "prompt": "每组变成1/2，总量变成3。能装的组数怎样跟着变？",
        "scene": "3　与　1/2",
        "inverse": true
      }
    },
    {
      "id": "fractiondividewords",
      "index": 1,
      "nodeId": "mt_rCMdwG-YOE",
      "taskHash": "7d30d5921919e477d26861b79d0890ae8a7ac7569208b46fdf09e714eff63359",
      "a": "2",
      "op": "/",
      "b": "1/3",
      "result": [
        6,
        1
      ],
      "flags": {
        "inverse": true
      },
      "sessionId": "fractiondividewords",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2",
        "op": "/",
        "b": "1/3",
        "prompt": "2杯葡萄干，每份装1/3杯。这里已知每份大小，求能装几份。",
        "scene": "2杯葡萄干，按1/3杯一份分装",
        "inverse": true
      }
    },
    {
      "id": "fractionsanity",
      "index": 0,
      "nodeId": "mt_e7filQgayF",
      "taskHash": "ba520ef2aae336413664b8faad0e8823fa03a29be63a589bddebf42dd63ac062",
      "a": "2/5",
      "op": "+",
      "b": "1/3",
      "result": [
        11,
        15
      ],
      "flags": {
        "simple": true,
        "estimate": [
          "1/2",
          1
        ]
      },
      "sessionId": "fractionsanity",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/5",
        "op": "+",
        "b": "1/3",
        "prompt": "同一张披萨，分别吃了2/5与1/3。先借一半与整个估计，再算准确值。",
        "scene": "两人一共吃了多少张披萨？",
        "estimate": [
          "1/2",
          1
        ],
        "simple": true
      }
    },
    {
      "id": "fractionsanity",
      "index": 1,
      "nodeId": "mt_e7filQgayF",
      "taskHash": "8342157dea2eb1965814899258dfa94b222c1c35d8ff2b2ca34010664fd6f3eb",
      "a": "2/5",
      "op": "+",
      "b": "1/2",
      "result": [
        9,
        10
      ],
      "flags": {
        "simple": true,
        "estimate": [
          "1/2",
          1
        ]
      },
      "sessionId": "fractionsanity",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/5",
        "op": "+",
        "b": "1/2",
        "prompt": "有人把上下的数都相加，说结果是3/7。先留下自己的估计，再构造真正的和。",
        "scene": "2/5加1/2，会不会比1/2还小？",
        "estimate": [
          "1/2",
          1
        ],
        "simple": true
      }
    },
    {
      "id": "fractionsanity",
      "index": 3,
      "nodeId": "mt_e7filQgayF",
      "taskHash": "39384b83d9544f6900d71a498bff1f4819feedbcfc480918583202fbd15198a1",
      "a": "5/12",
      "op": "+",
      "b": "1/6",
      "result": [
        7,
        12
      ],
      "flags": {
        "simple": true,
        "estimate": [
          "1/2",
          1
        ]
      },
      "sessionId": "fractionsanity",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "5/12",
        "op": "+",
        "b": "1/6",
        "prompt": "换一组小份。估计可以不准，算后要如实检查最初的范围。",
        "scene": "5/12　与　1/6",
        "estimate": [
          "1/2",
          1
        ],
        "simple": true
      }
    },
    {
      "id": "fractionquotient",
      "index": 0,
      "nodeId": "mt_9Y96vxG_LH",
      "taskHash": "c6294032a427a8fbe5058710f110f2281be799433eeac294a9489257768d8353",
      "a": "2/3",
      "op": "/",
      "b": "4/5",
      "result": [
        5,
        6
      ],
      "flags": {
        "inverse": true,
        "reciprocal": true
      },
      "sessionId": "fractionquotient",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "2/3",
        "op": "/",
        "b": "4/5",
        "prompt": "先在图上比较能放下几组，再让每组的量变成1：两边应同时乘什么？",
        "scene": "总量2/3，每整组4/5；可以不足一整组",
        "reciprocal": true,
        "inverse": true
      }
    },
    {
      "id": "fractionquotient",
      "index": 1,
      "nodeId": "mt_9Y96vxG_LH",
      "taskHash": "0c50a8da2effa2091490f7117a14a0e3b68d70c68b7f0e146c3d658f663cbe97",
      "a": "3/4",
      "op": "/",
      "b": "1/2",
      "result": [
        3,
        2
      ],
      "flags": {
        "reciprocal": true,
        "story": true
      },
      "sessionId": "fractionquotient",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3/4",
        "op": "/",
        "b": "1/2",
        "prompt": "写一个“每组1/2，总量3/4”的故事；不足一整组的部分也要算。",
        "scene": "3/4　与　1/2",
        "story": true,
        "exampleStory": "有3/4升果汁，一份是1/2升，可以装几份，包括不足一份的部分？",
        "reciprocal": true
      }
    },
    {
      "id": "fractionquotient",
      "index": 2,
      "nodeId": "mt_9Y96vxG_LH",
      "taskHash": "0186a169239df00d8ac6486f6638b7fff0423d8c8c8add07697332623e1b6a38",
      "a": "5/6",
      "op": "/",
      "b": "2/3",
      "result": [
        5,
        4
      ],
      "flags": {
        "inverse": true,
        "reciprocal": true
      },
      "sessionId": "fractionquotient",
      "sourceFile": "dist/learning/phase5/b18.js",
      "task": {
        "type": "x-fractioncase",
        "a": "5/6",
        "op": "/",
        "b": "2/3",
        "prompt": "换一种每组大小，用图与两边一起改变两种办法，检查组数相同。",
        "scene": "5/6　与　2/3",
        "reciprocal": true,
        "inverse": true
      }
    },
    {
      "id": "argument38",
      "index": 1,
      "nodeId": "mt_j5YqQnN6xe",
      "taskHash": "a45eeaabf001e9831fd2c92b35ad088911d1cfe21a7108f5e0d57caa2529737f",
      "a": "3/4",
      "op": "/",
      "b": "1/2",
      "result": [
        3,
        2
      ],
      "flags": {
        "reciprocal": true,
        "story": true
      },
      "sessionId": "argument38",
      "sourceFile": "dist/learning/phase5/b38.js",
      "task": {
        "type": "x-fractioncase",
        "a": "3/4",
        "op": "/",
        "b": "1/2",
        "prompt": "3/4升果汁，每份1/2升。亲手装一装，不足一份的部分也要算。",
        "scene": "3/4　与　1/2",
        "story": true,
        "exampleStory": "有3/4升果汁，一份是1/2升，可以装几份，包括不足一份的部分？",
        "reciprocal": true
      }
    }
  ],
  "associated": [
    {
      "id": "link-simplestparts-unlikeparts",
      "index": 1,
      "taskHash": "08371c55af3e9dc641f2a92985140af550ffc86a5693fdf7aec7cf5dfccf2ff5",
      "sessionId": "link-simplestparts-unlikeparts",
      "from": "simplestparts",
      "to": "unlikeparts",
      "fromNodeId": "mt_b7T-CjOYUR",
      "toNodeId": "mt_14T5yPXUq_"
    },
    {
      "id": "link-mixedrename-unlikeparts",
      "index": 1,
      "taskHash": "f43292f291709538ecc3a7274bf8cc8669af2eb45d18b34c79a0a7c6fc43f833",
      "sessionId": "link-mixedrename-unlikeparts",
      "from": "mixedrename",
      "to": "unlikeparts",
      "fromNodeId": "mt_o_p-3tCxiM",
      "toNodeId": "mt_14T5yPXUq_"
    },
    {
      "id": "link-relatedparts-unlikeparts",
      "index": 0,
      "taskHash": "738712f55b2c62f2f612c8abdbd7ac1811a7f4fa132ce4df561a5093bd8ea794",
      "sessionId": "link-relatedparts-unlikeparts",
      "from": "relatedparts",
      "to": "unlikeparts",
      "fromNodeId": "mt_-V7EnqU7gG",
      "toNodeId": "mt_14T5yPXUq_"
    },
    {
      "id": "link-relatedparts-unlikeparts",
      "index": 1,
      "taskHash": "08371c55af3e9dc641f2a92985140af550ffc86a5693fdf7aec7cf5dfccf2ff5",
      "sessionId": "link-relatedparts-unlikeparts",
      "from": "relatedparts",
      "to": "unlikeparts",
      "fromNodeId": "mt_-V7EnqU7gG",
      "toNodeId": "mt_14T5yPXUq_"
    },
    {
      "id": "link-sharewholes-countsmallgroups",
      "index": 1,
      "taskHash": "711a11ffa658a31d97a2a4b1b32810f84c0fd2df7a3b997ac03eda2e929dcca7",
      "sessionId": "link-sharewholes-countsmallgroups",
      "from": "sharewholes",
      "to": "countsmallgroups",
      "fromNodeId": "mt_4Km38F4L-6",
      "toNodeId": "mt_1PAWhRhpdg"
    },
    {
      "id": "link-productfractions-countsmallgroups",
      "index": 0,
      "taskHash": "8e81ca088077d826507071bd67767f1d46bf8088cbfe7f61c10f72bfc3616d06",
      "sessionId": "link-productfractions-countsmallgroups",
      "from": "productfractions",
      "to": "countsmallgroups",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_1PAWhRhpdg"
    },
    {
      "id": "link-productfractions-countsmallgroups",
      "index": 1,
      "taskHash": "711a11ffa658a31d97a2a4b1b32810f84c0fd2df7a3b997ac03eda2e929dcca7",
      "sessionId": "link-productfractions-countsmallgroups",
      "from": "productfractions",
      "to": "countsmallgroups",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_1PAWhRhpdg"
    },
    {
      "id": "link-sharesmallpart-countsmallgroups",
      "index": 1,
      "taskHash": "711a11ffa658a31d97a2a4b1b32810f84c0fd2df7a3b997ac03eda2e929dcca7",
      "sessionId": "link-sharesmallpart-countsmallgroups",
      "from": "sharesmallpart",
      "to": "countsmallgroups",
      "fromNodeId": "mt_ifPDOYvUqm",
      "toNodeId": "mt_1PAWhRhpdg"
    },
    {
      "id": "link-fractioncarry-nonunitamount",
      "index": 0,
      "taskHash": "58704f2d23539b525663fdf710370eb4cd434e252ea8c070c4289ebaf2a39331",
      "sessionId": "link-fractioncarry-nonunitamount",
      "from": "fractioncarry",
      "to": "nonunitamount",
      "fromNodeId": "mt_CBHwluE6Lp",
      "toNodeId": "mt_3y7xKP9MjU"
    },
    {
      "id": "link-productfractions-fractionquotient",
      "index": 0,
      "taskHash": "c8d17ad12a9b817b41ffb1f53c8058b9618ccfd18ea87fabd48b5478da83612f",
      "sessionId": "link-productfractions-fractionquotient",
      "from": "productfractions",
      "to": "fractionquotient",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_9Y96vxG_LH"
    },
    {
      "id": "link-productfractions-fractionquotient",
      "index": 1,
      "taskHash": "c6294032a427a8fbe5058710f110f2281be799433eeac294a9489257768d8353",
      "sessionId": "link-productfractions-fractionquotient",
      "from": "productfractions",
      "to": "fractionquotient",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_9Y96vxG_LH"
    },
    {
      "id": "link-sharesmallpart-fractionquotient",
      "index": 1,
      "taskHash": "c6294032a427a8fbe5058710f110f2281be799433eeac294a9489257768d8353",
      "sessionId": "link-sharesmallpart-fractionquotient",
      "from": "sharesmallpart",
      "to": "fractionquotient",
      "fromNodeId": "mt_ifPDOYvUqm",
      "toNodeId": "mt_9Y96vxG_LH"
    },
    {
      "id": "link-lineplaces-joinfractions",
      "index": 1,
      "taskHash": "a1cd80b4e2d9c1899e8e85ca6beecdfc2f046d6552f3556400db821ff340b07b",
      "sessionId": "link-lineplaces-joinfractions",
      "from": "lineplaces",
      "to": "joinfractions",
      "fromNodeId": "mt_Kr3IyA6m-O",
      "toNodeId": "mt_a1FdAsRKOF"
    },
    {
      "id": "link-jointhings-joinfractions",
      "index": 0,
      "taskHash": "55fe830d50d233b9a038f5bd79276d44f0acc63133152a920edf77c5f128f8a2",
      "sessionId": "link-jointhings-joinfractions",
      "from": "jointhings",
      "to": "joinfractions",
      "fromNodeId": "mt_OvyoRo47K-",
      "toNodeId": "mt_a1FdAsRKOF"
    },
    {
      "id": "link-jointhings-joinfractions",
      "index": 1,
      "taskHash": "a1cd80b4e2d9c1899e8e85ca6beecdfc2f046d6552f3556400db821ff340b07b",
      "sessionId": "link-jointhings-joinfractions",
      "from": "jointhings",
      "to": "joinfractions",
      "fromNodeId": "mt_OvyoRo47K-",
      "toNodeId": "mt_a1FdAsRKOF"
    },
    {
      "id": "link-simplestparts-productfractions",
      "index": 1,
      "taskHash": "ace5f8052b4480632abaf6ecc942645b47b38b6142a0396ad1bb29178af9a8bb",
      "sessionId": "link-simplestparts-productfractions",
      "from": "simplestparts",
      "to": "productfractions",
      "fromNodeId": "mt_b7T-CjOYUR",
      "toNodeId": "mt_AabJisinfi"
    },
    {
      "id": "link-repeatfraction-productfractions",
      "index": 1,
      "taskHash": "6da14ffbe42401c01f00e715af1a48ba2359b0a78e5b5ab1e134b999ac27a8b9",
      "sessionId": "link-repeatfraction-productfractions",
      "from": "repeatfraction",
      "to": "productfractions",
      "fromNodeId": "mt_TgHxujL81r",
      "toNodeId": "mt_AabJisinfi"
    },
    {
      "id": "link-joinfractions-fractioncarry",
      "index": 0,
      "taskHash": "a1cd80b4e2d9c1899e8e85ca6beecdfc2f046d6552f3556400db821ff340b07b",
      "sessionId": "link-joinfractions-fractioncarry",
      "from": "joinfractions",
      "to": "fractioncarry",
      "fromNodeId": "mt_a1FdAsRKOF",
      "toNodeId": "mt_CBHwluE6Lp"
    },
    {
      "id": "link-joinfractions-fractioncarry",
      "index": 1,
      "taskHash": "58704f2d23539b525663fdf710370eb4cd434e252ea8c070c4289ebaf2a39331",
      "sessionId": "link-joinfractions-fractioncarry",
      "from": "joinfractions",
      "to": "fractioncarry",
      "fromNodeId": "mt_a1FdAsRKOF",
      "toNodeId": "mt_CBHwluE6Lp"
    },
    {
      "id": "link-unlikeparts-fractionsanity",
      "index": 0,
      "taskHash": "08371c55af3e9dc641f2a92985140af550ffc86a5693fdf7aec7cf5dfccf2ff5",
      "sessionId": "link-unlikeparts-fractionsanity",
      "from": "unlikeparts",
      "to": "fractionsanity",
      "fromNodeId": "mt_14T5yPXUq_",
      "toNodeId": "mt_e7filQgayF"
    },
    {
      "id": "link-unlikeparts-fractionsanity",
      "index": 1,
      "taskHash": "ba520ef2aae336413664b8faad0e8823fa03a29be63a589bddebf42dd63ac062",
      "sessionId": "link-unlikeparts-fractionsanity",
      "from": "unlikeparts",
      "to": "fractionsanity",
      "fromNodeId": "mt_14T5yPXUq_",
      "toNodeId": "mt_e7filQgayF"
    },
    {
      "id": "link-fractionstories-fractionsanity",
      "index": 0,
      "taskHash": "99e1290a084caa5d2a90686224efb471f55d084bc66b0dcdf8b5531404cd5ee8",
      "sessionId": "link-fractionstories-fractionsanity",
      "from": "fractionstories",
      "to": "fractionsanity",
      "fromNodeId": "mt_ZLqYE7la4Z",
      "toNodeId": "mt_e7filQgayF"
    },
    {
      "id": "link-fractionstories-fractionsanity",
      "index": 1,
      "taskHash": "8342157dea2eb1965814899258dfa94b222c1c35d8ff2b2ca34010664fd6f3eb",
      "sessionId": "link-fractionstories-fractionsanity",
      "from": "fractionstories",
      "to": "fractionsanity",
      "fromNodeId": "mt_ZLqYE7la4Z",
      "toNodeId": "mt_e7filQgayF"
    },
    {
      "id": "link-unlikeparts-fractionfour",
      "index": 0,
      "taskHash": "b933be3e730a5a1de28fbdf28d6607777ab1308e6ec98613b332dcf6bce8a91a",
      "sessionId": "link-unlikeparts-fractionfour",
      "from": "unlikeparts",
      "to": "fractionfour",
      "fromNodeId": "mt_14T5yPXUq_",
      "toNodeId": "mt_gNUE4B3vuk"
    },
    {
      "id": "link-unlikeparts-fractionfour",
      "index": 1,
      "taskHash": "42f09be82abe06358c731c90580c3651330e31cfdd4fef3f91a18ea4c3381384",
      "sessionId": "link-unlikeparts-fractionfour",
      "from": "unlikeparts",
      "to": "fractionfour",
      "fromNodeId": "mt_14T5yPXUq_",
      "toNodeId": "mt_gNUE4B3vuk"
    },
    {
      "id": "link-productfractions-fractionfour",
      "index": 0,
      "taskHash": "ace5f8052b4480632abaf6ecc942645b47b38b6142a0396ad1bb29178af9a8bb",
      "sessionId": "link-productfractions-fractionfour",
      "from": "productfractions",
      "to": "fractionfour",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_gNUE4B3vuk"
    },
    {
      "id": "link-productfractions-fractionfour",
      "index": 1,
      "taskHash": "9baae9cf567ff73368fed3eba4400876da3059b8eefcdb1aa86b89fb626d2b51",
      "sessionId": "link-productfractions-fractionfour",
      "from": "productfractions",
      "to": "fractionfour",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_gNUE4B3vuk"
    },
    {
      "id": "link-sharesmallpart-fractionfour",
      "index": 1,
      "taskHash": "b56c1e5195a4888671441840707b10455d6a89e23fe301aae4c2d59f5104fe53",
      "sessionId": "link-sharesmallpart-fractionfour",
      "from": "sharesmallpart",
      "to": "fractionfour",
      "fromNodeId": "mt_ifPDOYvUqm",
      "toNodeId": "mt_gNUE4B3vuk"
    },
    {
      "id": "link-productfractions-fractionarea",
      "index": 0,
      "taskHash": "6da14ffbe42401c01f00e715af1a48ba2359b0a78e5b5ab1e134b999ac27a8b9",
      "sessionId": "link-productfractions-fractionarea",
      "from": "productfractions",
      "to": "fractionarea",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_gx6KQK5-Kx"
    },
    {
      "id": "link-productfractions-fractionarea",
      "index": 1,
      "taskHash": "0dd6fb187a6427af4461495f61e3936ce113c9da7abc6a085e65cf6270062c42",
      "sessionId": "link-productfractions-fractionarea",
      "from": "productfractions",
      "to": "fractionarea",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_gx6KQK5-Kx"
    },
    {
      "id": "link-boundary-fractionarea",
      "index": 0,
      "taskHash": "3b124ce0e6631e4b38f82b912441003804026d3d76e24ca70877a70a11d8b1c9",
      "sessionId": "link-boundary-fractionarea",
      "from": "boundary",
      "to": "fractionarea",
      "fromNodeId": "mt_eiB3-6pu6a",
      "toNodeId": "mt_gx6KQK5-Kx"
    },
    {
      "id": "link-boundary-fractionarea",
      "index": 1,
      "taskHash": "0dd6fb187a6427af4461495f61e3936ce113c9da7abc6a085e65cf6270062c42",
      "sessionId": "link-boundary-fractionarea",
      "from": "boundary",
      "to": "fractionarea",
      "fromNodeId": "mt_eiB3-6pu6a",
      "toNodeId": "mt_gx6KQK5-Kx"
    },
    {
      "id": "link-repeatfraction-manycopies",
      "index": 1,
      "taskHash": "715e78f5365f0cf969b22abb751e3c9e5600d17f383b78f30fdea5fc165dbf5b",
      "sessionId": "link-repeatfraction-manycopies",
      "from": "repeatfraction",
      "to": "manycopies",
      "fromNodeId": "mt_TgHxujL81r",
      "toNodeId": "mt_HJA2Oz-Zh1"
    },
    {
      "id": "link-joinfractions-precisefractions",
      "index": 0,
      "taskHash": "a1cd80b4e2d9c1899e8e85ca6beecdfc2f046d6552f3556400db821ff340b07b",
      "sessionId": "link-joinfractions-precisefractions",
      "from": "joinfractions",
      "to": "precisefractions",
      "fromNodeId": "mt_a1FdAsRKOF",
      "toNodeId": "mt_HY8Yycu_rz"
    },
    {
      "id": "link-productfractions-sharesmallpart",
      "index": 0,
      "taskHash": "fc36b1b5d1cf4b6f49ab72400d0327bb6f034c508ee9661712013e14095b7ab5",
      "sessionId": "link-productfractions-sharesmallpart",
      "from": "productfractions",
      "to": "sharesmallpart",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_ifPDOYvUqm"
    },
    {
      "id": "link-productfractions-fractionrecipe",
      "index": 0,
      "taskHash": "d5377245c793736aa95303421b97836b8852cd2c9ad932ba29f0f1bb7b052c3f",
      "sessionId": "link-productfractions-fractionrecipe",
      "from": "productfractions",
      "to": "fractionrecipe",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_lvaSGHwvQ5"
    },
    {
      "id": "link-productfractions-fractionrecipe",
      "index": 1,
      "taskHash": "b743153c646675029c5cce575ccb310b7a9ce0703e2ac235c48869f2c9ddaf4a",
      "sessionId": "link-productfractions-fractionrecipe",
      "from": "productfractions",
      "to": "fractionrecipe",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_lvaSGHwvQ5"
    },
    {
      "id": "link-fractionarea-fractionrecipe",
      "index": 0,
      "taskHash": "62f09db85c9c0793a2fc40be35a8f22a4a16b6abf0f4c38cfd16ce73964a228c",
      "sessionId": "link-fractionarea-fractionrecipe",
      "from": "fractionarea",
      "to": "fractionrecipe",
      "fromNodeId": "mt_gx6KQK5-Kx",
      "toNodeId": "mt_lvaSGHwvQ5"
    },
    {
      "id": "link-fractionarea-fractionrecipe",
      "index": 1,
      "taskHash": "ea9988387046c54cd77d96252dd177701b85fcd2416ed803431964e16d58ea06",
      "sessionId": "link-fractionarea-fractionrecipe",
      "from": "fractionarea",
      "to": "fractionrecipe",
      "fromNodeId": "mt_gx6KQK5-Kx",
      "toNodeId": "mt_lvaSGHwvQ5"
    },
    {
      "id": "link-scale-fractionrecipe",
      "index": 1,
      "taskHash": "b743153c646675029c5cce575ccb310b7a9ce0703e2ac235c48869f2c9ddaf4a",
      "sessionId": "link-scale-fractionrecipe",
      "from": "scale",
      "to": "fractionrecipe",
      "fromNodeId": "mt_VKW8lOcFaw",
      "toNodeId": "mt_lvaSGHwvQ5"
    },
    {
      "id": "link-countsmallgroups-fractiondividewords",
      "index": 0,
      "taskHash": "711a11ffa658a31d97a2a4b1b32810f84c0fd2df7a3b997ac03eda2e929dcca7",
      "sessionId": "link-countsmallgroups-fractiondividewords",
      "from": "countsmallgroups",
      "to": "fractiondividewords",
      "fromNodeId": "mt_1PAWhRhpdg",
      "toNodeId": "mt_rCMdwG-YOE"
    },
    {
      "id": "link-countsmallgroups-fractiondividewords",
      "index": 1,
      "taskHash": "7d30d5921919e477d26861b79d0890ae8a7ac7569208b46fdf09e714eff63359",
      "sessionId": "link-countsmallgroups-fractiondividewords",
      "from": "countsmallgroups",
      "to": "fractiondividewords",
      "fromNodeId": "mt_1PAWhRhpdg",
      "toNodeId": "mt_rCMdwG-YOE"
    },
    {
      "id": "link-manycopies-fractiondividewords",
      "index": 0,
      "taskHash": "d33ae02b94545897a5f37f4a40f1ede9bdb6be26b4f8097876ef4033e826ba7d",
      "sessionId": "link-manycopies-fractiondividewords",
      "from": "manycopies",
      "to": "fractiondividewords",
      "fromNodeId": "mt_HJA2Oz-Zh1",
      "toNodeId": "mt_rCMdwG-YOE"
    },
    {
      "id": "link-manycopies-fractiondividewords",
      "index": 1,
      "taskHash": "7d30d5921919e477d26861b79d0890ae8a7ac7569208b46fdf09e714eff63359",
      "sessionId": "link-manycopies-fractiondividewords",
      "from": "manycopies",
      "to": "fractiondividewords",
      "fromNodeId": "mt_HJA2Oz-Zh1",
      "toNodeId": "mt_rCMdwG-YOE"
    },
    {
      "id": "link-joinfractions-fractionchoices",
      "index": 0,
      "taskHash": "a1cd80b4e2d9c1899e8e85ca6beecdfc2f046d6552f3556400db821ff340b07b",
      "sessionId": "link-joinfractions-fractionchoices",
      "from": "joinfractions",
      "to": "fractionchoices",
      "fromNodeId": "mt_a1FdAsRKOF",
      "toNodeId": "mt_SsLWS_APM7"
    },
    {
      "id": "link-samenames-relatedparts",
      "index": 1,
      "taskHash": "738712f55b2c62f2f612c8abdbd7ac1811a7f4fa132ce4df561a5093bd8ea794",
      "sessionId": "link-samenames-relatedparts",
      "from": "samenames",
      "to": "relatedparts",
      "fromNodeId": "mt_ebPelt-qAl",
      "toNodeId": "mt_-V7EnqU7gG"
    },
    {
      "id": "link-splitfraction-relatedparts",
      "index": 1,
      "taskHash": "4b24abd2c6a541a0f90cf78e6fd6405db361780117751f33949f02c36418757a",
      "sessionId": "link-splitfraction-relatedparts",
      "from": "splitfraction",
      "to": "relatedparts",
      "fromNodeId": "mt_VgOePicFYK",
      "toNodeId": "mt_-V7EnqU7gG"
    },
    {
      "id": "link-fractioncarry-splitfraction",
      "index": 0,
      "taskHash": "58c404a694523a8508acfc6bedb075a9c48314510a803708d8557e22098de29a",
      "sessionId": "link-fractioncarry-splitfraction",
      "from": "fractioncarry",
      "to": "splitfraction",
      "fromNodeId": "mt_CBHwluE6Lp",
      "toNodeId": "mt_VgOePicFYK"
    },
    {
      "id": "link-productfractions-scale",
      "index": 0,
      "taskHash": "ace5f8052b4480632abaf6ecc942645b47b38b6142a0396ad1bb29178af9a8bb",
      "sessionId": "link-productfractions-scale",
      "from": "productfractions",
      "to": "scale",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_VKW8lOcFaw"
    },
    {
      "id": "link-productfractions-scale",
      "index": 1,
      "taskHash": "d5377245c793736aa95303421b97836b8852cd2c9ad932ba29f0f1bb7b052c3f",
      "sessionId": "link-productfractions-scale",
      "from": "productfractions",
      "to": "scale",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_VKW8lOcFaw"
    },
    {
      "id": "link-fractionarea-scale",
      "index": 0,
      "taskHash": "62f09db85c9c0793a2fc40be35a8f22a4a16b6abf0f4c38cfd16ce73964a228c",
      "sessionId": "link-fractionarea-scale",
      "from": "fractionarea",
      "to": "scale",
      "fromNodeId": "mt_gx6KQK5-Kx",
      "toNodeId": "mt_VKW8lOcFaw"
    },
    {
      "id": "link-fractioncarry-fractionmeasure",
      "index": 0,
      "taskHash": "58704f2d23539b525663fdf710370eb4cd434e252ea8c070c4289ebaf2a39331",
      "sessionId": "link-fractioncarry-fractionmeasure",
      "from": "fractioncarry",
      "to": "fractionmeasure",
      "fromNodeId": "mt_CBHwluE6Lp",
      "toNodeId": "mt_wB-GBDkoNr"
    },
    {
      "id": "link-fractioncarry-fractionmeasure",
      "index": 1,
      "taskHash": "740dd38ab293875327b03d25b52c37f43f99a5c465b7f0579a350d1c4a237542",
      "sessionId": "link-fractioncarry-fractionmeasure",
      "from": "fractioncarry",
      "to": "fractionmeasure",
      "fromNodeId": "mt_CBHwluE6Lp",
      "toNodeId": "mt_wB-GBDkoNr"
    },
    {
      "id": "link-mixedexchange-fractionstories",
      "index": 1,
      "taskHash": "740dd38ab293875327b03d25b52c37f43f99a5c465b7f0579a350d1c4a237542",
      "sessionId": "link-mixedexchange-fractionstories",
      "from": "mixedexchange",
      "to": "fractionstories",
      "fromNodeId": "mt_70qDTI14td",
      "toNodeId": "mt_ZLqYE7la4Z"
    },
    {
      "id": "link-productfractions-triArea",
      "index": 0,
      "taskHash": "6da14ffbe42401c01f00e715af1a48ba2359b0a78e5b5ab1e134b999ac27a8b9",
      "sessionId": "link-productfractions-triArea",
      "from": "productfractions",
      "to": "triArea",
      "fromNodeId": "mt_AabJisinfi",
      "toNodeId": "mt_ML5t7n2-U8"
    },
    {
      "id": "link-fractionarea-fractionvolume",
      "index": 0,
      "taskHash": "0dd6fb187a6427af4461495f61e3936ce113c9da7abc6a085e65cf6270062c42",
      "sessionId": "link-fractionarea-fractionvolume",
      "from": "fractionarea",
      "to": "fractionvolume",
      "fromNodeId": "mt_gx6KQK5-Kx",
      "toNodeId": "mt_IlDaxVr60U"
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b18.js": "42a8183150eac38507cba09cbae6b9adc2ee0ff43dd4f820a56e4c17f8c05dd9",
    "dist/learning/phase5/b18-model.js": "8c1f393446397b64ff583afc0d7c08486c447f6b8c6d9fbb967b6396d3c7ec74",
    "dist/learning/phase5/b18-view.js": "65b37faa851efc0d2f1b50a4f928b73a3be9aadda5fa29659c5e13475987fff9",
    "dist/learning/phase5/b17-model.js": "52e8665b482c26ad444c95096130ef87c89b0793038db101fcc2cce23320ae78",
    "dist/learning/phase5/b17-view.js": "7ae3320116fc5d75cc4d576794c207d1d1ea54b490f46f406403d21b1e0c5d27",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab",
    "dist/learning/phase5/b38.js": "8953ff1e7e76a2bab98c2d0d94a24f9a896c5540b0127df4e95befcd5bcbcbe3",
    "dist/learning/bridges.js": "e480fb63c69a2ee259b9bce4688d698fc61a1a910a44439e98c45cf1f7faeb15"
  },
  "sourceNodes": 14,
  "coreDependencyIssue": 150,
  "reviewedSourceCommit": "b81ac628b85f981a40bc2749d713e39492b2c89e"
};
