// Frozen original tasks. Context is required: associated and practice hashes can equal native hashes.
module.exports={
  "schema": "math-balance-reviewed-cases/1",
  "cases": [
    {
      "role": "native",
      "id": "compareweight",
      "index": 0,
      "nodeId": "mt_-P1kdZhHbL",
      "task": {
        "type": "x-m28-balance",
        "mode": "compare",
        "prompt": "一个大球和一块小石头，先放上天平再比较。",
        "left": {
          "name": "球A",
          "mass": 3,
          "size": 42
        },
        "right": {
          "name": "石头B",
          "mass": 5,
          "size": 23
        },
        "want": "right",
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
      "taskHash": "444a75afcad8a55a7aa372d8f401b2d3b19319a285867126c15e32a2f6207bf1",
      "math": {
        "shape": "compare",
        "relation": "right",
        "leftMass": 3,
        "rightMass": 5,
        "lighter": "left"
      }
    },
    {
      "role": "native",
      "id": "compareweight",
      "index": 1,
      "nodeId": "mt_-P1kdZhHbL",
      "task": {
        "type": "x-m28-balance",
        "mode": "compare",
        "prompt": "换成两件东西，看看有没有一样重。",
        "left": {
          "name": "盒A",
          "mass": 4,
          "size": 40
        },
        "right": {
          "name": "袋B",
          "mass": 4,
          "size": 24
        },
        "want": "equal",
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
      "taskHash": "7492b2dd2a53d9aafcd43d075cf958c6bae4b7e6162d628ae24c1d3362cdf58c",
      "math": {
        "shape": "compare",
        "relation": "equal",
        "leftMass": 4,
        "rightMass": 4,
        "lighter": null
      }
    },
    {
      "role": "native",
      "id": "compareweight",
      "index": 2,
      "nodeId": "mt_-P1kdZhHbL",
      "task": {
        "type": "x-m28-balance",
        "mode": "compare",
        "prompt": "先看天平，再说谁更重、谁更轻。",
        "left": {
          "name": "物体A",
          "mass": 6,
          "size": 26
        },
        "right": {
          "name": "物体B",
          "mass": 2,
          "size": 42
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
        "questions": [
          {
            "label": "较轻的是",
            "value": "right",
            "options": [
              [
                "left",
                "物体A"
              ],
              [
                "right",
                "物体B"
              ]
            ]
          }
        ]
      },
      "taskHash": "7b14009110e782399bcfedcdc8767dec44339fe3aa35b15b73571d61a19aab7c",
      "math": {
        "shape": "compare",
        "relation": "left",
        "leftMass": 6,
        "rightMass": 2,
        "lighter": "right"
      }
    },
    {
      "role": "native",
      "id": "weightstart",
      "index": 0,
      "nodeId": "mt_zd0YkB3xNj",
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
      "math": {
        "shape": "compare",
        "relation": "left",
        "leftMass": 5,
        "rightMass": 3,
        "lighter": "right"
      }
    },
    {
      "role": "native",
      "id": "weightstart",
      "index": 1,
      "nodeId": "mt_zd0YkB3xNj",
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
      "math": {
        "shape": "weigh",
        "mass": 5,
        "unit": "块",
        "weights": [
          1
        ],
        "multisets": [
          [
            1,
            1,
            1,
            1,
            1
          ]
        ],
        "orderedSolutions": 1
      }
    },
    {
      "role": "native",
      "id": "measurecalc",
      "index": 2,
      "nodeId": "mt_6oxQPNLHNv",
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
      "math": {
        "shape": "weigh",
        "mass": 700,
        "unit": "g",
        "weights": [
          100,
          200,
          500
        ],
        "multisets": [
          [
            100,
            100,
            100,
            100,
            100,
            100,
            100
          ],
          [
            100,
            100,
            100,
            100,
            100,
            200
          ],
          [
            100,
            100,
            100,
            200,
            200
          ],
          [
            100,
            200,
            200,
            200
          ],
          [
            100,
            100,
            500
          ],
          [
            200,
            500
          ]
        ],
        "orderedSolutions": 26
      }
    }
  ],
  "associated": [
    {
      "role": "associated",
      "id": "link-compareweight-weightstart",
      "index": 0,
      "nodeId": null,
      "task": {
        "type": "x-m28-balance",
        "mode": "compare",
        "prompt": "一个大球和一块小石头，先放上天平再比较。",
        "left": {
          "name": "球A",
          "mass": 3,
          "size": 42
        },
        "right": {
          "name": "石头B",
          "mass": 5,
          "size": 23
        },
        "want": "right",
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
      "taskHash": "444a75afcad8a55a7aa372d8f401b2d3b19319a285867126c15e32a2f6207bf1",
      "math": {
        "shape": "compare",
        "relation": "right",
        "leftMass": 3,
        "rightMass": 5,
        "lighter": "left"
      }
    },
    {
      "role": "associated",
      "id": "link-compareweight-weightstart",
      "index": 1,
      "nodeId": null,
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
      "math": {
        "shape": "weigh",
        "mass": 5,
        "unit": "块",
        "weights": [
          1
        ],
        "multisets": [
          [
            1,
            1,
            1,
            1,
            1
          ]
        ],
        "orderedSolutions": 1
      }
    },
    {
      "role": "associated",
      "id": "link-measurecalc-precisefractions",
      "index": 0,
      "nodeId": null,
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
      "math": {
        "shape": "weigh",
        "mass": 700,
        "unit": "g",
        "weights": [
          100,
          200,
          500
        ],
        "multisets": [
          [
            100,
            100,
            100,
            100,
            100,
            100,
            100
          ],
          [
            100,
            100,
            100,
            100,
            100,
            200
          ],
          [
            100,
            100,
            100,
            200,
            200
          ],
          [
            100,
            200,
            200,
            200
          ],
          [
            100,
            100,
            500
          ],
          [
            200,
            500
          ]
        ],
        "orderedSolutions": 26
      }
    },
    {
      "role": "associated",
      "id": "link-compareweight-indirectmass",
      "index": 0,
      "nodeId": null,
      "task": {
        "type": "x-m28-balance",
        "mode": "compare",
        "prompt": "一个大球和一块小石头，先放上天平再比较。",
        "left": {
          "name": "球A",
          "mass": 3,
          "size": 42
        },
        "right": {
          "name": "石头B",
          "mass": 5,
          "size": 23
        },
        "want": "right",
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
      "taskHash": "444a75afcad8a55a7aa372d8f401b2d3b19319a285867126c15e32a2f6207bf1",
      "math": {
        "shape": "compare",
        "relation": "right",
        "leftMass": 3,
        "rightMass": 5,
        "lighter": "left"
      }
    }
  ],
  "practice": [
    {
      "role": "practice",
      "id": "compareweight",
      "index": -1,
      "nodeId": "mt_-P1kdZhHbL",
      "task": {
        "type": "x-m28-balance",
        "mode": "compare",
        "prompt": "先看天平，再说谁更重、谁更轻。",
        "left": {
          "name": "物体A",
          "mass": 6,
          "size": 26
        },
        "right": {
          "name": "物体B",
          "mass": 2,
          "size": 42
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
        "questions": [
          {
            "label": "较轻的是",
            "value": "right",
            "options": [
              [
                "left",
                "物体A"
              ],
              [
                "right",
                "物体B"
              ]
            ]
          }
        ]
      },
      "taskHash": "7b14009110e782399bcfedcdc8767dec44339fe3aa35b15b73571d61a19aab7c",
      "math": {
        "shape": "compare",
        "relation": "left",
        "leftMass": 6,
        "rightMass": 2,
        "lighter": "right"
      }
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b28.js": "83ccc714c66906c7cd375088a3fe2e5b182e2c2bf509e641fcf1614611eda057",
    "dist/learning/phase5/b28-model.js": "eb1ee26ca273ee1b629db0e84cc4f85d156c0569cfa751a18c208b00951c1391",
    "dist/learning/phase5/b28-view.js": "6fc48e49db9ce7c67e88c52db9740b602f42d95cd6a5756d3f2b8b3e8adb77d7",
    "dist/learning/phase5/b29.js": "77b3e6ee2f704581a31d1c9389f450f527b26293069c599edd5b5d0fae4312c3",
    "dist/learning/phase5/b31.js": "2b17412e5ab4fdb80f7f6a37a38f9549cb031db18e38cfa8f5030788e4a43407",
    "dist/learning/phase5/b20-model.js": "d3c51d56587fc93b0b8189a7ac9a6d82dcad6b768f7b436877a362406ee7070e",
    "dist/learning/tasks.js": "4eac447b0944644b1c1077464e849950b296fd708f7f8f0ecf9d4ac1fd7cb4a7",
    "dist/learning/catalog.js": "6f0258d01853e8e73ca4cc0e92379f3ad97731fee2e409c73baea6fa559f8518",
    "dist/learning/bridges.js": "e480fb63c69a2ee259b9bce4688d698fc61a1a910a44439e98c45cf1f7faeb15",
    "dist/learning/phase4/catalog.js": "297b04d578cfbd3eb42c1d048b50d5adedfc6e53639c849cb6114675cc33063a",
    "dist/learning/phase4/engine.js": "8164e3f66e9c1489ef4831a6477fe782591ea1a7bc0ed4da859fc3c575b9f9ee",
    "dist/learning/phase4/view-engine.js": "22ce2022cc9fb1f4fac0cdb40ac1bd7ef24497db9d1416b219f500f630c311f1",
    "dist/learning/phase4/ui.js": "88a1fe937b6b4e9b2f1405e2f80d6e48a8750afa833b8ac2d76b046bd28678a8",
    "dist/learning/phase4/async-batches.js": "b41324f2b0657fda3f081ae861bed8832cd60e9eb7e84456f2683de5817b9c84",
    "dist/learning/state.js": "e20c834d9741761b57c60cc0ca385d604b9b9e16e7e6a383e36ef0696a21e8db",
    "dist/learning/daily.js": "27df81463b7bcaa20e62008bad04e2b50a8438c24a48e565b96db7de5d6ba8d5",
    "dist/storage.js": "8a7d85b66c19898560c33e372d832b7416adc153d523acd8eaec516282361bf7",
    "dist/exploration-core.js": "1100d47beba5120ec68f484fc154365ecdaa11d439c13ee85b6efad8c2f41002",
    "dist/live-state.js": "85d2cfa3147e557c827b84a817e3fa711e3b9dd2f6bdc7f9e54d47c1fc6aae08",
    "dist/import-conflicts.js": "daef42405c428697f6108856d5818c8441166c9ce3492af220649867128595b6",
    "dist/v2.html": "a73ea845ddc383ff5c094fe0d48d016059f2fc0dfd31bd86077ce368fb17f29a",
    "dist/learning/workspace-flow.js": "3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05",
    "dist/learning/p3-view.js": "100a430403ff5e5cce93546ebbce803df84fc4c602c2b6bcf6a342d53fe68a78",
    "dist/data/atlas.json": "b30b16783f518e47fed8dd6e412bb6ee6e323b5250834c0ee1c0bb68dff94caf"
  }
};
