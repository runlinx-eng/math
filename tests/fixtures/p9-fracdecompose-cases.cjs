// Reviewed original B18 positions. Mathematical totals and goal sets are fixed independently.
// Production code does not import this fixture.
module.exports={
  "cases": [
    {
      "id": "splitfraction",
      "sessionId": "splitfraction",
      "index": 0,
      "nodeId": "mt_VgOePicFYK",
      "taskHash": "540f63437d0857b413a5cf547c1ed4d2678bed7582230a98e1d7dc274efd0fa2",
      "task": {
        "type": "x-fracdecompose",
        "n": 3,
        "d": 8,
        "required": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "prompt": "在小份之间分组，留下“三组各一份”和“一组一份、一组两份”两种拆法。"
      },
      "expected": {
        "total": [
          3,
          8
        ],
        "unit": [
          1,
          8
        ],
        "minimumSaved": 2,
        "requiredParts": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "exampleParts": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "distinctPartitions": 2
      }
    },
    {
      "id": "splitfraction",
      "sessionId": "splitfraction",
      "index": 1,
      "nodeId": "mt_VgOePicFYK",
      "taskHash": "b6f13b2f86707e09467cdddc8f132ce4a2b91ce7dceeaebb2c7d2a4e8f6a001a",
      "task": {
        "type": "x-fracdecompose",
        "n": 5,
        "d": 6,
        "count": 2,
        "prompt": "同样5/6，自己留下两种不同的分组。每组都要写进等式。"
      },
      "expected": {
        "total": [
          5,
          6
        ],
        "unit": [
          1,
          6
        ],
        "minimumSaved": 2,
        "requiredParts": [],
        "exampleParts": [
          [
            1,
            4
          ],
          [
            2,
            3
          ]
        ],
        "distinctPartitions": 6
      }
    },
    {
      "id": "splitfraction",
      "sessionId": "splitfraction",
      "index": 2,
      "nodeId": "mt_VgOePicFYK",
      "taskHash": "6c3c1cea77e36672aac00913ec97f8e6a3c60128e873d2ab165c14aa81de23e9",
      "task": {
        "type": "x-fracdecompose",
        "n": 17,
        "d": 8,
        "required": [
          [
            8,
            8,
            1
          ]
        ],
        "prompt": "17个八分之一，分成两个完整的1与一个小份。用等式留下整份和零头。"
      },
      "expected": {
        "total": [
          17,
          8
        ],
        "unit": [
          1,
          8
        ],
        "minimumSaved": 1,
        "requiredParts": [
          [
            8,
            8,
            1
          ]
        ],
        "exampleParts": [
          [
            8,
            8,
            1
          ]
        ],
        "distinctPartitions": 296
      }
    }
  ],
  "bridges": [
    {
      "id": "link-splitfraction-mixedexchange",
      "sessionId": "link-splitfraction-mixedexchange",
      "index": 0,
      "nodeId": "mt_70qDTI14td",
      "taskHash": "6c3c1cea77e36672aac00913ec97f8e6a3c60128e873d2ab165c14aa81de23e9",
      "task": {
        "type": "x-fracdecompose",
        "n": 17,
        "d": 8,
        "required": [
          [
            8,
            8,
            1
          ]
        ],
        "prompt": "17个八分之一，分成两个完整的1与一个小份。用等式留下整份和零头。"
      },
      "expected": {
        "total": [
          17,
          8
        ],
        "unit": [
          1,
          8
        ],
        "minimumSaved": 1,
        "requiredParts": [
          [
            8,
            8,
            1
          ]
        ],
        "exampleParts": [
          [
            8,
            8,
            1
          ]
        ],
        "distinctPartitions": 296
      }
    },
    {
      "id": "link-joinfractions-precisefractions",
      "sessionId": "link-joinfractions-precisefractions",
      "index": 1,
      "nodeId": "mt_HY8Yycu_rz",
      "taskHash": "540f63437d0857b413a5cf547c1ed4d2678bed7582230a98e1d7dc274efd0fa2",
      "task": {
        "type": "x-fracdecompose",
        "n": 3,
        "d": 8,
        "required": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "prompt": "在小份之间分组，留下“三组各一份”和“一组一份、一组两份”两种拆法。"
      },
      "expected": {
        "total": [
          3,
          8
        ],
        "unit": [
          1,
          8
        ],
        "minimumSaved": 2,
        "requiredParts": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "exampleParts": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "distinctPartitions": 2
      }
    },
    {
      "id": "link-splitfraction-relatedparts",
      "sessionId": "link-splitfraction-relatedparts",
      "index": 0,
      "nodeId": "mt_-V7EnqU7gG",
      "taskHash": "540f63437d0857b413a5cf547c1ed4d2678bed7582230a98e1d7dc274efd0fa2",
      "task": {
        "type": "x-fracdecompose",
        "n": 3,
        "d": 8,
        "required": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "prompt": "在小份之间分组，留下“三组各一份”和“一组一份、一组两份”两种拆法。"
      },
      "expected": {
        "total": [
          3,
          8
        ],
        "unit": [
          1,
          8
        ],
        "minimumSaved": 2,
        "requiredParts": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "exampleParts": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "distinctPartitions": 2
      }
    },
    {
      "id": "link-unitcopies-splitfraction",
      "sessionId": "link-unitcopies-splitfraction",
      "index": 1,
      "nodeId": "mt_VgOePicFYK",
      "taskHash": "b6f13b2f86707e09467cdddc8f132ce4a2b91ce7dceeaebb2c7d2a4e8f6a001a",
      "task": {
        "type": "x-fracdecompose",
        "n": 5,
        "d": 6,
        "count": 2,
        "prompt": "同样5/6，自己留下两种不同的分组。每组都要写进等式。"
      },
      "expected": {
        "total": [
          5,
          6
        ],
        "unit": [
          1,
          6
        ],
        "minimumSaved": 2,
        "requiredParts": [],
        "exampleParts": [
          [
            1,
            4
          ],
          [
            2,
            3
          ]
        ],
        "distinctPartitions": 6
      }
    },
    {
      "id": "link-fractioncarry-splitfraction",
      "sessionId": "link-fractioncarry-splitfraction",
      "index": 1,
      "nodeId": "mt_VgOePicFYK",
      "taskHash": "6c3c1cea77e36672aac00913ec97f8e6a3c60128e873d2ab165c14aa81de23e9",
      "task": {
        "type": "x-fracdecompose",
        "n": 17,
        "d": 8,
        "required": [
          [
            8,
            8,
            1
          ]
        ],
        "prompt": "17个八分之一，分成两个完整的1与一个小份。用等式留下整份和零头。"
      },
      "expected": {
        "total": [
          17,
          8
        ],
        "unit": [
          1,
          8
        ],
        "minimumSaved": 1,
        "requiredParts": [
          [
            8,
            8,
            1
          ]
        ],
        "exampleParts": [
          [
            8,
            8,
            1
          ]
        ],
        "distinctPartitions": 296
      }
    }
  ],
  "practices": [
    {
      "id": "splitfraction",
      "sessionId": "splitfraction",
      "index": -1,
      "nodeId": "mt_VgOePicFYK",
      "taskHash": "540f63437d0857b413a5cf547c1ed4d2678bed7582230a98e1d7dc274efd0fa2",
      "task": {
        "type": "x-fracdecompose",
        "n": 3,
        "d": 8,
        "required": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "prompt": "在小份之间分组，留下“三组各一份”和“一组一份、一组两份”两种拆法。"
      },
      "expected": {
        "total": [
          3,
          8
        ],
        "unit": [
          1,
          8
        ],
        "minimumSaved": 2,
        "requiredParts": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "exampleParts": [
          [
            1,
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "distinctPartitions": 2
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
