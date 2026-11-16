// Independent pinned B18 source positions and manually reviewed sharing quantities.
// The expected per-person amounts and legal factor lists are not supplied by
// the production adapter, original solver or engineering fixture helper.
module.exports={
  "cases": [
    {
      "id": "sharesmallpart",
      "sessionId": "sharesmallpart",
      "index": 0,
      "nodeId": "mt_ifPDOYvUqm",
      "expected": {
        "original": [
          1,
          3
        ],
        "people": 4,
        "perPerson": [
          1,
          12
        ],
        "referenceWhole": [
          1,
          1
        ],
        "unit": "",
        "storyRequired": false,
        "canonicalFactor": 4,
        "legalFactors": [
          4,
          8,
          12,
          16,
          20,
          24,
          28,
          32,
          36,
          40
        ]
      },
      "taskHash": "a21013e4cfe1d249c3cbe7026f286f99a1250ab9bc8618ba8eb6e5640ec2e99d",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 3,
        "people": 4,
        "prompt": "已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。"
      }
    },
    {
      "id": "sharesmallpart",
      "sessionId": "sharesmallpart",
      "index": 1,
      "nodeId": "mt_ifPDOYvUqm",
      "expected": {
        "original": [
          1,
          6
        ],
        "people": 3,
        "perPerson": [
          1,
          18
        ],
        "referenceWhole": [
          1,
          1
        ],
        "unit": "",
        "storyRequired": true,
        "canonicalFactor": 3,
        "legalFactors": [
          3,
          6,
          9,
          12,
          15,
          18
        ]
      },
      "taskHash": "643844548350eba4d4bddba31d118da3f4fe032681dfdd582baec7b4d1f813f1",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 6,
        "people": 3,
        "prompt": "给1/6÷3写一个自己的分享故事，再让每人拿到一样多。",
        "story": true,
        "exampleStory": "一张饼的1/6留给3个人，每人分到这张饼的多少？"
      }
    },
    {
      "id": "sharesmallpart",
      "sessionId": "sharesmallpart",
      "index": 2,
      "nodeId": "mt_ifPDOYvUqm",
      "expected": {
        "original": [
          1,
          4
        ],
        "people": 2,
        "perPerson": [
          1,
          8
        ],
        "referenceWhole": [
          1,
          1
        ],
        "unit": "",
        "storyRequired": false,
        "canonicalFactor": 2,
        "legalFactors": [
          2,
          4,
          6,
          8,
          10,
          12,
          14,
          16,
          18,
          20,
          22,
          24,
          26,
          28,
          30
        ]
      },
      "taskHash": "a63730ca7e5110792299377cadd1d9064f899b1b2a123c25232bc793bcbce1f1",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 4,
        "people": 2,
        "prompt": "这次是1/4分给2个人；分好后，用乘法把各人的量合回去。"
      }
    },
    {
      "id": "fractiondividewords",
      "sessionId": "fractiondividewords",
      "index": 0,
      "nodeId": "mt_rCMdwG-YOE",
      "expected": {
        "original": [
          1,
          2
        ],
        "people": 3,
        "perPerson": [
          1,
          6
        ],
        "referenceWhole": [
          1,
          1
        ],
        "unit": "千克",
        "storyRequired": false,
        "canonicalFactor": 3,
        "legalFactors": [
          3,
          6,
          9,
          12,
          15,
          18,
          21,
          24,
          27,
          30,
          33,
          36,
          39
        ]
      },
      "taskHash": "dfdbb99e090603d901f537b35815df2f43e30168962f1e7bfead2ab617d41dc3",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 2,
        "people": 3,
        "prompt": "半千克巧克力平均分给3个人，每人多少千克？整条表示1千克。",
        "unit": "千克"
      }
    },
    {
      "id": "fractiondividewords",
      "sessionId": "fractiondividewords",
      "index": 2,
      "nodeId": "mt_rCMdwG-YOE",
      "expected": {
        "original": [
          1,
          4
        ],
        "people": 2,
        "perPerson": [
          1,
          8
        ],
        "referenceWhole": [
          1,
          1
        ],
        "unit": "",
        "storyRequired": true,
        "canonicalFactor": 2,
        "legalFactors": [
          2,
          4,
          6,
          8,
          10,
          12,
          14,
          16,
          18,
          20,
          22,
          24,
          26,
          28,
          30
        ]
      },
      "taskHash": "40d0025e9740b820a2fe9e0cf45a307dca81980a312972f3ad9b494579f2aea7",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 4,
        "people": 2,
        "prompt": "用“1/4平均给2个人”写另一个自己的故事；也用图把意思留下。",
        "story": true,
        "exampleStory": "一米彩带的1/4平均分给两个人，每人多少米？"
      }
    }
  ],
  "bridges": [
    {
      "id": "link-sharesmallpart-countsmallgroups",
      "sessionId": "link-sharesmallpart-countsmallgroups",
      "index": 0,
      "fromNodeId": "mt_ifPDOYvUqm",
      "nodeId": "mt_1PAWhRhpdg",
      "taskHash": "a21013e4cfe1d249c3cbe7026f286f99a1250ab9bc8618ba8eb6e5640ec2e99d",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 3,
        "people": 4,
        "prompt": "已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。"
      }
    },
    {
      "id": "link-sharesmallpart-fractionquotient",
      "sessionId": "link-sharesmallpart-fractionquotient",
      "index": 0,
      "fromNodeId": "mt_ifPDOYvUqm",
      "nodeId": "mt_9Y96vxG_LH",
      "taskHash": "a21013e4cfe1d249c3cbe7026f286f99a1250ab9bc8618ba8eb6e5640ec2e99d",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 3,
        "people": 4,
        "prompt": "已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。"
      }
    },
    {
      "id": "link-sharesmallpart-fractionfour",
      "sessionId": "link-sharesmallpart-fractionfour",
      "index": 0,
      "fromNodeId": "mt_ifPDOYvUqm",
      "nodeId": "mt_gNUE4B3vuk",
      "taskHash": "a21013e4cfe1d249c3cbe7026f286f99a1250ab9bc8618ba8eb6e5640ec2e99d",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 3,
        "people": 4,
        "prompt": "已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。"
      }
    },
    {
      "id": "link-sharewholes-sharesmallpart",
      "sessionId": "link-sharewholes-sharesmallpart",
      "index": 1,
      "fromNodeId": "mt_4Km38F4L-6",
      "nodeId": "mt_ifPDOYvUqm",
      "taskHash": "a21013e4cfe1d249c3cbe7026f286f99a1250ab9bc8618ba8eb6e5640ec2e99d",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 3,
        "people": 4,
        "prompt": "已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。"
      }
    },
    {
      "id": "link-productfractions-sharesmallpart",
      "sessionId": "link-productfractions-sharesmallpart",
      "index": 1,
      "fromNodeId": "mt_AabJisinfi",
      "nodeId": "mt_ifPDOYvUqm",
      "taskHash": "a21013e4cfe1d249c3cbe7026f286f99a1250ab9bc8618ba8eb6e5640ec2e99d",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 3,
        "people": 4,
        "prompt": "已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。"
      }
    },
    {
      "id": "link-sharesmallpart-fractiondividewords",
      "sessionId": "link-sharesmallpart-fractiondividewords",
      "index": 0,
      "fromNodeId": "mt_ifPDOYvUqm",
      "nodeId": "mt_rCMdwG-YOE",
      "taskHash": "a21013e4cfe1d249c3cbe7026f286f99a1250ab9bc8618ba8eb6e5640ec2e99d",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 3,
        "people": 4,
        "prompt": "已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。"
      }
    },
    {
      "id": "link-sharesmallpart-fractiondividewords",
      "sessionId": "link-sharesmallpart-fractiondividewords",
      "index": 1,
      "fromNodeId": "mt_ifPDOYvUqm",
      "nodeId": "mt_rCMdwG-YOE",
      "taskHash": "dfdbb99e090603d901f537b35815df2f43e30168962f1e7bfead2ab617d41dc3",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 2,
        "people": 3,
        "prompt": "半千克巧克力平均分给3个人，每人多少千克？整条表示1千克。",
        "unit": "千克"
      }
    }
  ],
  "practices": [
    {
      "id": "sharesmallpart",
      "sessionId": "sharesmallpart",
      "index": -1,
      "nodeId": "mt_ifPDOYvUqm",
      "taskHash": "a21013e4cfe1d249c3cbe7026f286f99a1250ab9bc8618ba8eb6e5640ec2e99d",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 3,
        "people": 4,
        "prompt": "已经只有一整个的1/3，还要平均给4个人。先继续切，再把每一块分出去。"
      }
    },
    {
      "id": "fractiondividewords",
      "sessionId": "fractiondividewords",
      "index": -1,
      "nodeId": "mt_rCMdwG-YOE",
      "taskHash": "dfdbb99e090603d901f537b35815df2f43e30168962f1e7bfead2ab617d41dc3",
      "task": {
        "type": "x-fracshare",
        "n": 1,
        "d": 2,
        "people": 3,
        "prompt": "半千克巧克力平均分给3个人，每人多少千克？整条表示1千克。",
        "unit": "千克"
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b18.js": "42a8183150eac38507cba09cbae6b9adc2ee0ff43dd4f820a56e4c17f8c05dd9",
    "dist/learning/phase5/b18-model.js": "8c1f393446397b64ff583afc0d7c08486c447f6b8c6d9fbb967b6396d3c7ec74",
    "dist/learning/phase5/b18-view.js": "65b37faa851efc0d2f1b50a4f928b73a3be9aadda5fa29659c5e13475987fff9",
    "dist/learning/phase5/b17-model.js": "52e8665b482c26ad444c95096130ef87c89b0793038db101fcc2cce23320ae78",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab"
  }
};
