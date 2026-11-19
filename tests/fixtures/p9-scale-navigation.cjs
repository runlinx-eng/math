// Six literal original prerequisite routes; their existing family evidence remains separate.
module.exports={
  "schema": "math-scale-literal-navigation/1",
  "navigation": [
    {
      "id": "weightstart",
      "index": 0,
      "task": {
        "type": "x-m28-balance",
        "mode": "compare",
        "prompt": "先把两个物体放在天平上，看看哪个更重。",
        "left": {
          "name": "书A",
          "mass": 5,
          "size": 32
        },
        "right": {
          "name": "盒B",
          "mass": 3,
          "size": 40
        },
        "want": "left",
        "choices": [
          {
            "id": "left",
            "label": "A"
          },
          {
            "id": "right",
            "label": "B"
          },
          {
            "id": "equal",
            "label": "一样"
          }
        ],
        "questions": []
      },
      "taskHash": "00fadcb86574c4a1bba420eafe1bc07f3d04fbe28fc9e112c7f31ba62a75e0ce",
      "steps": [
        {
          "action": "m28-test",
          "data": {}
        },
        {
          "action": "m28-choice",
          "data": {
            "index": "left"
          }
        }
      ],
      "role": "prerequisite",
      "strictScaleCoverage": false,
      "existingOtherFeedback": true,
      "existingAdapter": "balance-compare"
    },
    {
      "id": "weightstart",
      "index": 1,
      "task": {
        "type": "x-m28-balance",
        "mode": "weigh",
        "prompt": "把一样重的小块放到右边，让天平平衡。",
        "mass": 5,
        "unit": "块",
        "weights": [
          1
        ],
        "exampleWeights": [
          1,
          1,
          1,
          1,
          1
        ],
        "questions": [],
        "object": "书"
      },
      "taskHash": "f8a16cb43e63005b5b9f63af5405322e80ce8ea3c8804f0c2d84b2deabbdde15",
      "steps": [
        {
          "action": "m28-weight",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "m28-weight",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "m28-weight",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "m28-weight",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "m28-weight",
          "data": {
            "index": "1"
          }
        },
        {
          "field": "measure",
          "value": "5"
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
      "role": "prerequisite",
      "strictScaleCoverage": false,
      "existingOtherFeedback": true,
      "existingAdapter": "balance-weigh"
    },
    {
      "id": "measurecalc",
      "index": 0,
      "task": {
        "type": "x-m28-ruler",
        "prompt": "把尺的零刻度对准左端，读出这条模拟桌边。",
        "value": 7,
        "unit": "cm",
        "object": "桌边",
        "questions": [],
        "axisMax": 10,
        "tick": 1
      },
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "steps": [
        {
          "field": "offset",
          "value": "0"
        },
        {
          "field": "measure",
          "value": "7"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "action": "m28-record",
          "data": {}
        }
      ],
      "role": "prerequisite",
      "strictScaleCoverage": false,
      "existingOtherFeedback": true,
      "existingAdapter": "ruler"
    },
    {
      "id": "measurecalc",
      "index": 2,
      "task": {
        "type": "x-m28-balance",
        "mode": "weigh",
        "prompt": "把砝码放上模拟天平，让这袋东西平衡，再用 g 记录。",
        "mass": 700,
        "unit": "g",
        "weights": [
          100,
          200,
          500
        ],
        "exampleWeights": [
          500,
          200
        ],
        "object": "一袋东西",
        "questions": []
      },
      "taskHash": "4afb8f95c6649994654c8df07bafae4265dbce4bd82d905041ba2ae726e3b820",
      "steps": [
        {
          "action": "m28-weight",
          "data": {
            "index": "500"
          }
        },
        {
          "action": "m28-weight",
          "data": {
            "index": "200"
          }
        },
        {
          "field": "measure",
          "value": "700"
        },
        {
          "field": "unit",
          "value": "g"
        },
        {
          "action": "m28-record",
          "data": {}
        }
      ],
      "role": "prerequisite",
      "strictScaleCoverage": false,
      "existingOtherFeedback": true,
      "existingAdapter": "balance-weigh"
    },
    {
      "id": "link-measure-readscales",
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
      "taskHash": "d8f506c1104c63b4bda43c7554b2f471247ed3fcd6549422b54195832604977d",
      "steps": [
        {
          "action": "tool",
          "data": {
            "value": "length"
          }
        },
        {
          "field": "zero",
          "value": "3"
        },
        {
          "field": "reading",
          "value": "80"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "role": "prerequisite",
      "strictScaleCoverage": false,
      "existingOtherFeedback": false,
      "existingAdapter": null
    },
    {
      "id": "link-measureliquid-readscales",
      "index": 0,
      "task": {
        "type": "x-m31-meter",
        "prompt": "量杯每两个数字差 100 mL。先估，再找每个小间隔和液面。",
        "kind": "jug",
        "min": 0,
        "max": 500,
        "major": 100,
        "minorN": 20,
        "minorD": 1,
        "valueN": 340,
        "valueD": 1,
        "unit": "mL",
        "estimateExample": 300
      },
      "taskHash": "946cc31504c0620dcbf3caeea004fa2d970a7a378e2a94f941d2e3ccc56dd7cd",
      "steps": [
        {
          "field": "estimate",
          "value": "300"
        },
        {
          "action": "m31-predict",
          "data": {}
        },
        {
          "field": "step",
          "value": "20"
        },
        {
          "field": "reading",
          "value": "340"
        },
        {
          "field": "unit",
          "value": "mL"
        },
        {
          "action": "m31-meter",
          "data": {}
        }
      ],
      "role": "prerequisite",
      "strictScaleCoverage": false,
      "existingOtherFeedback": false,
      "existingAdapter": null
    }
  ],
  "sourceHashes": {
    "dist/learning/learn.js": "0174a2c01b37da20dc6cc9366a74ccf0510cd642150ccfb3201399d00581a40f"
  },
  "controllerSourceHashes": {
    "update": "e9cce21f3f3cf36ba81f6d4996bc6bc090e22cb545cc0a2e7349720c9f0ff1cc",
    "edit": "dd160130be6cb009cb9d6bdd08cc47bb44b5a77f5be9d8dd76d46798803930ca",
    "extra": "918b63bd101f235a1cc550b4ddfb17dba29dcd5a38674fe8d581e7f55b432021",
    "input": "3664a0e098d53fbb497de83251b2ff2e29bde395ac8357c4c8dcf3618ee7c6d4",
    "shared": "4c2c7ede8f9effcfc581029f1d1b29913e8905dc550054f37c5f0f2a1d58d724"
  }
};
