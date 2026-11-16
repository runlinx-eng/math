// Exact original source literals and independent whole-unit quotient/remainder quantities.
module.exports={
  "schema": "math-unitrefine-reviewed-cases/1",
  "cases": [
    {
      "id": "precisionunits",
      "index": 0,
      "role": "native",
      "nodeId": "mt_e7tLi9SCIE",
      "task": {
        "type": "x-m28-refine",
        "prompt": "同一本书，先用长铅笔，再用短回形针。",
        "total": 9,
        "sizes": [
          {
            "size": 4,
            "label": "长铅笔"
          },
          {
            "size": 1,
            "label": "短回形针"
          }
        ],
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
        "object": "书"
      },
      "taskHash": "f18def01e8694c79f9306b948300ce6e8db07b8f4eddc02502abb6d69cffc7ad",
      "math": {
        "total": 9,
        "quantities": [
          {
            "size": 4,
            "label": "长铅笔",
            "count": 2,
            "remainder": 1
          },
          {
            "size": 1,
            "label": "短回形针",
            "count": 9,
            "remainder": 0
          }
        ]
      }
    },
    {
      "id": "precisionunits",
      "index": 2,
      "role": "native",
      "nodeId": "mt_e7tLi9SCIE",
      "task": {
        "type": "x-m28-refine",
        "prompt": "同一份质量，用大砝码再用小砝码比较剩余部分。",
        "total": 10,
        "sizes": [
          {
            "size": 3,
            "label": "大砝码单位"
          },
          {
            "size": 1,
            "label": "小砝码单位"
          }
        ],
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
        "object": "质量条"
      },
      "taskHash": "0b708df686af0bddfe876a265afac13b4c822a69d8c6031646bc2cdf1bb70410",
      "math": {
        "total": 10,
        "quantities": [
          {
            "size": 3,
            "label": "大砝码单位",
            "count": 3,
            "remainder": 1
          },
          {
            "size": 1,
            "label": "小砝码单位",
            "count": 10,
            "remainder": 0
          }
        ]
      }
    },
    {
      "id": "precisionunits",
      "index": 3,
      "role": "native",
      "nodeId": "mt_e7tLi9SCIE",
      "task": {
        "type": "x-m28-refine",
        "prompt": "量模拟桌边，先用手掌跨度，再换成计数小块。",
        "total": 9,
        "sizes": [
          {
            "size": 4,
            "label": "手掌跨度"
          },
          {
            "size": 1,
            "label": "计数小块"
          }
        ],
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
        "object": "桌边"
      },
      "taskHash": "5617ba45b7c747ffa1bdb9fb404e1adeeaa799d52378b9ed2bf7cecb4545849b",
      "math": {
        "total": 9,
        "quantities": [
          {
            "size": 4,
            "label": "手掌跨度",
            "count": 2,
            "remainder": 1
          },
          {
            "size": 1,
            "label": "计数小块",
            "count": 9,
            "remainder": 0
          }
        ]
      }
    }
  ],
  "associated": [
    {
      "id": "link-sameunitlength-precisionunits",
      "index": 1,
      "role": "associated",
      "nodeId": "mt_e7tLi9SCIE",
      "fromNodeId": "mt_cqSf213hSa",
      "task": {
        "type": "x-m28-refine",
        "prompt": "同一本书，先用长铅笔，再用短回形针。",
        "total": 9,
        "sizes": [
          {
            "size": 4,
            "label": "长铅笔"
          },
          {
            "size": 1,
            "label": "短回形针"
          }
        ],
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
        "object": "书"
      },
      "taskHash": "f18def01e8694c79f9306b948300ce6e8db07b8f4eddc02502abb6d69cffc7ad",
      "math": {
        "total": 9,
        "quantities": [
          {
            "size": 4,
            "label": "长铅笔",
            "count": 2,
            "remainder": 1
          },
          {
            "size": 1,
            "label": "短回形针",
            "count": 9,
            "remainder": 0
          }
        ]
      }
    }
  ],
  "practice": [
    {
      "id": "precisionunits",
      "index": -1,
      "role": "practice",
      "nodeId": "mt_e7tLi9SCIE",
      "task": {
        "type": "x-m28-refine",
        "prompt": "量模拟桌边，先用手掌跨度，再换成计数小块。",
        "total": 9,
        "sizes": [
          {
            "size": 4,
            "label": "手掌跨度"
          },
          {
            "size": 1,
            "label": "计数小块"
          }
        ],
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
        "object": "桌边"
      },
      "taskHash": "5617ba45b7c747ffa1bdb9fb404e1adeeaa799d52378b9ed2bf7cecb4545849b",
      "math": {
        "total": 9,
        "quantities": [
          {
            "size": 4,
            "label": "手掌跨度",
            "count": 2,
            "remainder": 1
          },
          {
            "size": 1,
            "label": "计数小块",
            "count": 9,
            "remainder": 0
          }
        ]
      }
    }
  ],
  "sourceHashes": {
    "vendor/upstream.json": "d5c50f38991ca8f43bef03b1abecd3cace3c1ac6e2354db34f88afac75d705ed",
    "dist/data/atlas.json": "b30b16783f518e47fed8dd6e412bb6ee6e323b5250834c0ee1c0bb68dff94caf",
    "dist/learning/phase5/b28.js": "83ccc714c66906c7cd375088a3fe2e5b182e2c2bf509e641fcf1614611eda057",
    "dist/learning/phase5/b28-model.js": "eb1ee26ca273ee1b629db0e84cc4f85d156c0569cfa751a18c208b00951c1391",
    "dist/learning/phase5/b28-view.js": "6fc48e49db9ce7c67e88c52db9740b602f42d95cd6a5756d3f2b8b3e8adb77d7",
    "dist/learning/phase5/b28.css": "bcbab72a0704715775b0c5b2e5af1b979740be72e71564766b953df30a004d27",
    "dist/learning/phase5/b20-model.js": "d3c51d56587fc93b0b8189a7ac9a6d82dcad6b768f7b436877a362406ee7070e",
    "dist/learning/tasks.js": "4eac447b0944644b1c1077464e849950b296fd708f7f8f0ecf9d4ac1fd7cb4a7",
    "dist/learning/catalog.js": "6f0258d01853e8e73ca4cc0e92379f3ad97731fee2e409c73baea6fa559f8518",
    "dist/learning/bridges.js": "e480fb63c69a2ee259b9bce4688d698fc61a1a910a44439e98c45cf1f7faeb15",
    "dist/learning/phase4/engine.js": "8164e3f66e9c1489ef4831a6477fe782591ea1a7bc0ed4da859fc3c575b9f9ee",
    "dist/learning/phase4/view-engine.js": "22ce2022cc9fb1f4fac0cdb40ac1bd7ef24497db9d1416b219f500f630c311f1",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8",
    "dist/learning/state.js": "e20c834d9741761b57c60cc0ca385d604b9b9e16e7e6a383e36ef0696a21e8db",
    "dist/learning/workspace-flow.js": "3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05",
    "dist/learning/p3-view.js": "100a430403ff5e5cce93546ebbce803df84fc4c602c2b6bcf6a342d53fe68a78",
    "dist/learning/daily.js": "27df81463b7bcaa20e62008bad04e2b50a8438c24a48e565b96db7de5d6ba8d5",
    "dist/learning/evidence-contract.js": "bc73050766cc97a8820bf39aed84e42ebdcbf6e4605a2128bf6ff975325f683e",
    "dist/exploration-core.js": "1100d47beba5120ec68f484fc154365ecdaa11d439c13ee85b6efad8c2f41002",
    "dist/storage.js": "8a7d85b66c19898560c33e372d832b7416adc153d523acd8eaec516282361bf7"
  },
  "scope": {
    "native": 3,
    "nativeNodes": 1,
    "netNewNodesAfterUnitcover": 1,
    "contracts": 1,
    "associated": 1,
    "practice": 1,
    "targetPositions": 4,
    "sessions": 2,
    "prerequisites": 2,
    "totalPositions": 6,
    "nextPerViewport": 4,
    "rulerOrUnitsOrVesselsContractMerged": false
  },
  "boundaries": {
    "sourceType": "x-m28-refine",
    "nativeSession": "precisionunits",
    "nativeIndices": [
      0,
      2,
      3
    ],
    "nodeId": "mt_e7tLi9SCIE",
    "method": null,
    "claim": "two original unit sizes, their retained exact successful count records, whole-unit quantities and remainders; current exact count",
    "equations": [
      "total = count * size + remainder",
      "count = floor(total / size)",
      "0 <= remainder < size"
    ],
    "recordRawEqualityRequired": false,
    "bothSurvivingSuccessRecordsMustBeExact": true,
    "currentMeasureMustBeExact": true,
    "latestFullModelSubmissionGateIsSeparate": true,
    "originalNearAndFirstAndBadArePreserved": true
  },
  "originalExamplesNeedHelper": false
};
