// Literal plans for ten real original preceding positions; no solver recipes.
// Range inputs follow their actual Home/Arrow input events in browser and Node.
module.exports={
  "navigation": [
    {
      "id": "modmoney",
      "index": 0,
      "task": {
        "type": "x-m33-model",
        "prompt": "一根绳原来45 cm，剪掉18 cm。挑一种表示，再找剩下的长度。",
        "whole": 45,
        "known": 18,
        "unit": "cm",
        "questions": [
          {
            "label": "剩下多少cm",
            "value": 27,
            "kind": "number"
          }
        ]
      },
      "taskHash": "c643f90af92aea7d21c0325b43e098702e1a1e78a3adfb02d5f4e1082564b03a",
      "steps": [
        {
          "action": "m33-method",
          "data": {
            "index": "bar"
          }
        },
        {
          "field": "answers.0",
          "value": "27"
        }
      ]
    },
    {
      "id": "auscoins",
      "index": 0,
      "task": {
        "type": "x-m33-sort",
        "prompt": "澳大利亚示意硬币：按澳分和澳元分类。比较50c与$2。",
        "currency": "AUD",
        "cards": [
          {
            "label": "澳50c",
            "cents": 50,
            "size": 76,
            "tone": "silver",
            "shape": "twelve",
            "group": "cent"
          },
          {
            "label": "澳20c",
            "cents": 20,
            "size": 65,
            "tone": "silver",
            "group": "cent"
          },
          {
            "label": "澳$1",
            "cents": 100,
            "size": 62,
            "group": "dollar"
          },
          {
            "label": "澳$2",
            "cents": 200,
            "size": 55,
            "group": "dollar"
          }
        ],
        "groups": [
          {
            "id": "cent",
            "label": "澳分 c"
          },
          {
            "id": "dollar",
            "label": "澳元 $"
          }
        ],
        "questions": [
          {
            "label": "面值更大的是",
            "value": "two",
            "kind": "choice",
            "options": [
              [
                "two",
                "较小的$2"
              ],
              [
                "fifty",
                "较大的50c"
              ]
            ]
          }
        ]
      },
      "taskHash": "714e67929c4c3fb9987a9bfbc15786b5bff7bd863e06394a7a988fd509569b6b",
      "steps": [
        {
          "action": "m33-group",
          "data": {
            "index": "cent"
          }
        },
        {
          "action": "m33-place",
          "data": {
            "index": 0
          }
        },
        {
          "action": "m33-place",
          "data": {
            "index": 1
          }
        },
        {
          "action": "m33-group",
          "data": {
            "index": "dollar"
          }
        },
        {
          "action": "m33-place",
          "data": {
            "index": 2
          }
        },
        {
          "action": "m33-place",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "two"
        }
      ]
    },
    {
      "id": "measuremoney",
      "index": 0,
      "task": {
        "type": "x-m28-ruler",
        "prompt": "这是模拟房间的一段距离。先用1米作参照估一估，再量；现实教室需要亲自量。",
        "value": 3,
        "unit": "m",
        "object": "物体",
        "questions": [],
        "axisMax": 5,
        "estimate": true,
        "estimateExample": 2
      },
      "taskHash": "0345e7ff933a810f9f7179d57fbcf4a43477f83f488916276b6691dbbcebb9b1",
      "steps": [
        {
          "field": "estimate",
          "value": "2"
        },
        {
          "action": "m28-predict",
          "data": {}
        },
        {
          "field": "offset",
          "value": "0"
        },
        {
          "field": "measure",
          "value": "3"
        },
        {
          "field": "unit",
          "value": "m"
        },
        {
          "action": "m28-record",
          "data": {}
        },
        {
          "field": "error",
          "value": "1"
        }
      ]
    },
    {
      "id": "measuremoney",
      "index": 1,
      "task": {
        "type": "x-m33-compare",
        "prompt": "一袋1.5 kg，另一袋1200 g。换成克后，哪袋更重？",
        "items": [
          {
            "label": "1.5 kg",
            "value": 1500,
            "detail": "1500 g"
          },
          {
            "label": "1200 g",
            "value": 1200,
            "detail": "1200 g"
          }
        ],
        "want": "left",
        "questions": [
          {
            "label": "1.5 kg是多少克",
            "value": 1500,
            "kind": "number"
          }
        ]
      },
      "taskHash": "c26e53518d47019d0feceba8c12a659bf3599a2cea8cda39f9c0d49a9ec6207f",
      "steps": [
        {
          "action": "m33-guess",
          "data": {
            "index": "left"
          }
        },
        {
          "action": "m33-reveal",
          "data": {}
        },
        {
          "action": "m33-pick",
          "data": {
            "index": "left"
          }
        },
        {
          "field": "answers.0",
          "value": "1500"
        }
      ]
    },
    {
      "id": "lifemath38",
      "index": 0,
      "task": {
        "type": "x-m33-model",
        "prompt": "一根绳原来45 cm，剪掉18 cm。挑一种表示，再找剩下的长度。",
        "whole": 45,
        "known": 18,
        "unit": "cm",
        "questions": [
          {
            "label": "剩下多少cm",
            "value": 27,
            "kind": "number"
          }
        ]
      },
      "taskHash": "c643f90af92aea7d21c0325b43e098702e1a1e78a3adfb02d5f4e1082564b03a",
      "steps": [
        {
          "action": "m33-method",
          "data": {
            "index": "bar"
          }
        },
        {
          "field": "answers.0",
          "value": "27"
        }
      ]
    },
    {
      "id": "lifemath38",
      "index": 1,
      "task": {
        "type": "x-storyplan",
        "values": [
          46,
          8,
          29
        ],
        "labels": [
          "红票原有",
          "红票用掉",
          "蓝票现有"
        ],
        "signs": [
          1,
          -1,
          -1
        ],
        "unit": "张",
        "prompt": "红票原有46张，用掉8张；蓝票有29张。剩下的红票比蓝票多多少？"
      },
      "taskHash": "f0cbe85b4904989e5bb5ca2ff5ef0162304bff2d48e56b130d4a71477207b95f",
      "steps": [
        {
          "action": "b12-plan-pick",
          "data": {
            "index": 0
          }
        },
        {
          "action": "b12-plan-pick",
          "data": {
            "index": 1
          }
        },
        {
          "field": "op",
          "value": "-"
        },
        {
          "field": "result",
          "value": "38"
        },
        {
          "field": "method",
          "value": "written"
        },
        {
          "action": "b12-plan-merge",
          "data": {}
        },
        {
          "action": "b12-plan-pick",
          "data": {
            "index": 1
          }
        },
        {
          "action": "b12-plan-pick",
          "data": {
            "index": 0
          }
        },
        {
          "field": "op",
          "value": "-"
        },
        {
          "field": "result",
          "value": "9"
        },
        {
          "field": "method",
          "value": "written"
        },
        {
          "action": "b12-plan-merge",
          "data": {}
        },
        {
          "field": "equation",
          "value": "(46-8)-29=□"
        },
        {
          "field": "answer",
          "value": "9"
        }
      ]
    },
    {
      "id": "link-coinvalues-poundnotation",
      "index": 0,
      "task": {
        "type": "x-m33-compare",
        "prompt": "英国的£2硬币和50p硬币，哪一枚面值更大？",
        "items": [
          {
            "label": "£2硬币",
            "value": 200,
            "detail": "200p"
          },
          {
            "label": "50p硬币",
            "value": 50,
            "detail": "50p"
          }
        ],
        "want": "left",
        "questions": [
          {
            "label": "£2等于多少便士",
            "value": 200,
            "kind": "minor"
          }
        ],
        "currency": "GBP"
      },
      "taskHash": "3a556ffd830371a04905acc9522725ee36cbcb13e024db2187d90eb844296203",
      "steps": [
        {
          "action": "m33-guess",
          "data": {
            "index": "left"
          }
        },
        {
          "action": "m33-reveal",
          "data": {}
        },
        {
          "action": "m33-pick",
          "data": {
            "index": "left"
          }
        },
        {
          "field": "answers.0",
          "value": "200"
        }
      ]
    },
    {
      "id": "link-roughmoney-budgetchoices",
      "index": 0,
      "task": {
        "type": "x-m33-calc",
        "prompt": "澳元$4.95、$2.10、$7.85先估大约多少，再算准确总价。",
        "currency": "AUD",
        "expected": 1490,
        "exampleFormula": "4.95+2.10+7.85",
        "questions": [
          {
            "label": "准确总价",
            "value": 1490,
            "kind": "major"
          }
        ],
        "estimate": true,
        "estimateExample": 15,
        "estimateRange": [
          13,
          17
        ],
        "estimateLabel": "估计大约多少澳元"
      },
      "taskHash": "e41de1d2de115110f707905fee60ec952ed805a64382c15562ca34929fe6535d",
      "steps": [
        {
          "field": "estimate",
          "value": "15"
        },
        {
          "action": "m33-estimate",
          "data": {}
        },
        {
          "field": "formula",
          "value": "4.95+2.10+7.85"
        },
        {
          "action": "m33-run",
          "data": {}
        },
        {
          "field": "answers.0",
          "value": "14.90"
        }
      ]
    },
    {
      "id": "link-lengthstory-modmoney",
      "index": 0,
      "task": {
        "type": "x-m29-tape",
        "prompt": "一根绳原来 45 cm，剪掉 18 cm。把已知的一段摆出来，剩下多长？",
        "whole": 45,
        "known": 18,
        "knownSide": "left",
        "leftLabel": "剪掉",
        "rightLabel": "剩下 ?",
        "wholeLabel": "原来的整段",
        "unit": "cm"
      },
      "taskHash": "f28e64d2c7c2f038af9a8c894a991ed6cbd71b112253180d6ad4cfaabc111d77",
      "steps": [
        {
          "field": "cut",
          "value": "18"
        },
        {
          "action": "m29-cut",
          "data": {}
        },
        {
          "field": "equation",
          "value": "45-18=□"
        },
        {
          "field": "answer",
          "value": "27"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ]
    },
    {
      "id": "link-flexhundred-usmoney",
      "index": 0,
      "task": {
        "type": "x-placecalc",
        "values": [
          46,
          37
        ],
        "op": "+",
        "prompt": "把46与37的相同单位合在一起。"
      },
      "taskHash": "4dd9ff43f3cd691a4d53ad013b04e90f7356e6120f0fffeb238fa1b2a1f0afb6",
      "steps": [
        {
          "field": "guess",
          "value": "83"
        },
        {
          "field": "align.0",
          "value": "0"
        },
        {
          "field": "align.1",
          "value": "0"
        },
        {
          "action": "b11-place-start",
          "data": {}
        },
        {
          "action": "b11-exchange",
          "data": {
            "index": 0,
            "dir": "up"
          }
        },
        {
          "field": "answer",
          "value": "83"
        }
      ]
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b11-model.js": "eb3fedefcf516915009bef41fb6a57a5de41aafda17e92c9b20f28a447720504",
    "dist/learning/phase5/b11-view.js": "76a245f5c9b12100e26eb4e21579f556e3592c2f4570063cb04712e03677add5",
    "dist/learning/phase5/b12-model.js": "121ffb6631ade31f38467d76d736cc77d57fabe8fbfd5589ca1980f1edd44d02",
    "dist/learning/phase5/b12-view.js": "d05a30460e3ed364dcccdd905ec6e5afc8c7fc75aedb75b601e832a3d60cf53c",
    "dist/learning/phase5/b28-model.js": "eb1ee26ca273ee1b629db0e84cc4f85d156c0569cfa751a18c208b00951c1391",
    "dist/learning/phase5/b28-view.js": "6fc48e49db9ce7c67e88c52db9740b602f42d95cd6a5756d3f2b8b3e8adb77d7",
    "dist/learning/phase5/b29-model.js": "1b57695aef8172436413ef4824e6babe7f9be48c0245e6e79eacac28c7287e48",
    "dist/learning/phase5/b29-view.js": "9333c05ee6efae18aa7a6e0dc3e2069555f18cb0db68d609d5e1a010ddf95836",
    "dist/learning/phase5/b33-model.js": "467754119d83334d34abe75842424a4b97b0357e3547841748b59002dfdafb0b",
    "dist/learning/phase5/b33-view.js": "9d6d88df23878b4c46059c37b01a9fc34c2d501f66c6dac9e985cdb265a50e26",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8",
    "dist/learning/phase4/engine.js": "8164e3f66e9c1489ef4831a6477fe782591ea1a7bc0ed4da859fc3c575b9f9ee",
    "dist/learning/phase4/view-engine.js": "22ce2022cc9fb1f4fac0cdb40ac1bd7ef24497db9d1416b219f500f630c311f1",
    "dist/learning/p3-view.js": "100a430403ff5e5cce93546ebbce803df84fc4c602c2b6bcf6a342d53fe68a78",
    "dist/learning/p3-workflow.js": "864f42f1e161f299536bdb44c1ccf0cf1599a6e60d16b271c4f37719b41db06a",
    "dist/learning/workspace-flow.js": "3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05"
  }
};
