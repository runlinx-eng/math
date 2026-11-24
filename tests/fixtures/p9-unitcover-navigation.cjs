// Literal routes through original ruler/compare controls; no strict unitcover credit.
module.exports={
  "schema": "math-unitcover-literal-navigation/1",
  "navigation": [
    {
      "id": "lengthstart",
      "index": 1,
      "role": "prerequisite",
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
          "action": "m28-record"
        }
      ],
      "strictUnitcoverCoverage": false
    },
    {
      "id": "twounits",
      "index": 0,
      "role": "prerequisite",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "同一张桌面模型，用厘米尺量到最接近的整厘米。",
        "value": 10,
        "unit": "cm",
        "object": "桌面",
        "questions": [],
        "actual": 10.16,
        "axisMax": 12.7,
        "tick": 0.1
      },
      "taskHash": "d8fb12f1e99f3d90d8352d65adfb49025b2f89ee438322ec078cc00f86886086",
      "steps": [
        {
          "field": "offset",
          "value": "0"
        },
        {
          "field": "measure",
          "value": "10"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "action": "m28-record"
        }
      ],
      "strictUnitcoverCoverage": false
    },
    {
      "id": "twounits",
      "index": 1,
      "role": "prerequisite",
      "task": {
        "type": "x-m28-ruler",
        "prompt": "还是这张桌面，换英寸尺量一量。",
        "value": 4,
        "unit": "英寸",
        "object": "桌面",
        "questions": [
          {
            "label": "同一个量，单位变小时需要的数量",
            "value": "more",
            "options": [
              [
                "more",
                "通常更多"
              ],
              [
                "less",
                "一定更少"
              ]
            ]
          }
        ],
        "axisMax": 5,
        "tick": 1
      },
      "taskHash": "f39daad2ffb89f89ff9a99b9e5106c65919cc755d2647993c66903128f535271",
      "steps": [
        {
          "field": "offset",
          "value": "0"
        },
        {
          "field": "measure",
          "value": "4"
        },
        {
          "field": "unit",
          "value": "英寸"
        },
        {
          "action": "m28-record"
        },
        {
          "field": "answers.0",
          "value": "more"
        }
      ],
      "strictUnitcoverCoverage": false
    },
    {
      "id": "link-compareheight-lengthstart",
      "index": 0,
      "role": "prerequisite",
      "task": {
        "type": "x-m28-compare",
        "prompt": "把两条丝带的起点对齐，再比较。",
        "items": [
          {
            "name": "丝带A",
            "length": 4
          },
          {
            "name": "丝带B",
            "length": 8
          }
        ],
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
        "want": "right",
        "questions": [
          {
            "label": "长丝带是短丝带的几倍",
            "value": 2
          }
        ]
      },
      "taskHash": "64c62710998755c4785127899e50a5e62875439227ac3425cf1d1e27c1a5d5b3",
      "steps": [
        {
          "field": "offset",
          "value": "0"
        },
        {
          "action": "m28-choice",
          "data": {
            "index": "right"
          }
        },
        {
          "field": "answers.0",
          "value": "2"
        }
      ],
      "strictUnitcoverCoverage": false
    }
  ],
  "sourceHashes": {
    "dist/learning/learn.js": "bd5862f4a7bd90a3b7de7d712f0400fac6c63c8accaf0263d7387c1605cf3172"
  },
  "controllerSourceHashes": {
    "update": "e9cce21f3f3cf36ba81f6d4996bc6bc090e22cb545cc0a2e7349720c9f0ff1cc",
    "edit": "dd160130be6cb009cb9d6bdd08cc47bb44b5a77f5be9d8dd76d46798803930ca",
    "extra": "918b63bd101f235a1cc550b4ddfb17dba29dcd5a38674fe8d581e7f55b432021",
    "input": "3664a0e098d53fbb497de83251b2ff2e29bde395ac8357c4c8dcf3618ee7c6d4",
    "shared": "4c2c7ede8f9effcfc581029f1d1b29913e8905dc550054f37c5f0f2a1d58d724"
  },
  "scope": {
    "targets": 11,
    "sessions": 7,
    "prerequisites": 4,
    "positions": 15,
    "nextPerViewport": 8,
    "rangeInputsPerViewport": 16,
    "nativePositionSeeding": false
  }
};
