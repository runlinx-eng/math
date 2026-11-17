// Exact original sources and independently calculated equal-unit coverage.
module.exports={
  "schema": "math-unitcover-reviewed-cases/1",
  "cases": [
    {
      "id": "lengthstart",
      "index": 0,
      "role": "native",
      "nodeId": "mt_KaF0SQvaiu",
      "task": {
        "type": "x-m28-units",
        "prompt": "用一样长的回形针把这本模拟书从头量到尾。",
        "length": 8,
        "size": 2,
        "unit": "回形针",
        "object": "书",
        "questions": []
      },
      "taskHash": "b31208795cc4f548471711716cb77006d027902ca1a7ae7f657b80cebb5595d1",
      "math": {
        "length": 8,
        "size": 2,
        "count": 4,
        "unit": "回形针",
        "positions": [
          0,
          2,
          4,
          6
        ],
        "unitWidth": 96,
        "totalWidth": 384
      },
      "type": "x-m28-units"
    },
    {
      "id": "lengthstart",
      "index": 2,
      "role": "native",
      "nodeId": "mt_KaF0SQvaiu",
      "task": {
        "type": "x-m28-units",
        "prompt": "换一段模拟桌边，用小方块量完并写上单位。",
        "length": 6,
        "size": 1,
        "unit": "块",
        "object": "桌边",
        "questions": []
      },
      "taskHash": "40c7cbe449e63c9b593732ea57754e414aa252648a5bb4fbbf0a48f755d397a3",
      "math": {
        "length": 6,
        "size": 1,
        "count": 6,
        "unit": "块",
        "positions": [
          0,
          1,
          2,
          3,
          4,
          5
        ],
        "unitWidth": 48,
        "totalWidth": 288
      },
      "type": "x-m28-units"
    },
    {
      "id": "sameunitlength",
      "index": 0,
      "role": "native",
      "nodeId": "mt_cqSf213hSa",
      "task": {
        "type": "x-m28-units",
        "prompt": "把同样长的小块从头到尾挨着放。",
        "length": 6,
        "size": 1,
        "unit": "块",
        "object": "书",
        "questions": []
      },
      "taskHash": "f904cc1319ef9db443aed2713f6f715f1fee69a138669c218902dcf108097125",
      "math": {
        "length": 6,
        "size": 1,
        "count": 6,
        "unit": "块",
        "positions": [
          0,
          1,
          2,
          3,
          4,
          5
        ],
        "unitWidth": 48,
        "totalWidth": 288
      },
      "type": "x-m28-units"
    },
    {
      "id": "sameunitlength",
      "index": 1,
      "role": "native",
      "nodeId": "mt_cqSf213hSa",
      "task": {
        "type": "x-m28-units",
        "prompt": "换成较长的相同纸片，量另一条带子。",
        "length": 8,
        "size": 2,
        "unit": "回形针",
        "object": "带子",
        "questions": []
      },
      "taskHash": "4de819a7dac169e8890e7335f6a8b5d2c56626278271b4bc55bed1767108962a",
      "math": {
        "length": 8,
        "size": 2,
        "count": 4,
        "unit": "回形针",
        "positions": [
          0,
          2,
          4,
          6
        ],
        "unitWidth": 96,
        "totalWidth": 384
      },
      "type": "x-m28-units"
    },
    {
      "id": "sameunitlength",
      "index": 2,
      "role": "native",
      "nodeId": "mt_cqSf213hSa",
      "task": {
        "type": "x-m28-units",
        "prompt": "先试着铺满：留空或重叠都不能算量完。",
        "length": 9,
        "size": 1,
        "unit": "块",
        "object": "木条",
        "questions": []
      },
      "taskHash": "19277fb95431846ea222a1c9fe10c76387b2d42adedf86df23298b29800c19a7",
      "math": {
        "length": 9,
        "size": 1,
        "count": 9,
        "unit": "块",
        "positions": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8
        ],
        "unitWidth": 48,
        "totalWidth": 432
      },
      "type": "x-m28-units"
    },
    {
      "id": "twounits",
      "index": 2,
      "role": "native",
      "nodeId": "mt_jHv4BgRK8B",
      "task": {
        "type": "x-m28-units",
        "prompt": "再用较长的单位量同一段，比较需要的数量。",
        "length": 10,
        "size": 2,
        "unit": "回形针",
        "object": "物体",
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
        ]
      },
      "taskHash": "4e28e97a7103213b8e4aeaf84e70b62fc211d6e040721693b55b1b2d252a5f1d",
      "math": {
        "length": 10,
        "size": 2,
        "count": 5,
        "unit": "回形针",
        "positions": [
          0,
          2,
          4,
          6,
          8
        ],
        "unitWidth": 96,
        "totalWidth": 480
      },
      "type": "x-m28-units"
    }
  ],
  "associated": [
    {
      "id": "link-compareheight-lengthstart",
      "index": 1,
      "role": "associated",
      "nodeId": null,
      "bridge": {
        "from": "compareheight",
        "to": "lengthstart",
        "fromTopicId": "mt_uhuxX8sg9f",
        "topicId": "mt_KaF0SQvaiu"
      },
      "task": {
        "type": "x-m28-units",
        "prompt": "用一样长的回形针把这本模拟书从头量到尾。",
        "length": 8,
        "size": 2,
        "unit": "回形针",
        "object": "书",
        "questions": []
      },
      "taskHash": "b31208795cc4f548471711716cb77006d027902ca1a7ae7f657b80cebb5595d1",
      "math": {
        "length": 8,
        "size": 2,
        "count": 4,
        "unit": "回形针",
        "positions": [
          0,
          2,
          4,
          6
        ],
        "unitWidth": 96,
        "totalWidth": 384
      },
      "type": "x-m28-units"
    },
    {
      "id": "link-lengthstart-sameunitlength",
      "index": 0,
      "role": "associated",
      "nodeId": null,
      "bridge": {
        "from": "lengthstart",
        "to": "sameunitlength",
        "fromTopicId": "mt_KaF0SQvaiu",
        "topicId": "mt_cqSf213hSa"
      },
      "task": {
        "type": "x-m28-units",
        "prompt": "用一样长的回形针把这本模拟书从头量到尾。",
        "length": 8,
        "size": 2,
        "unit": "回形针",
        "object": "书",
        "questions": []
      },
      "taskHash": "b31208795cc4f548471711716cb77006d027902ca1a7ae7f657b80cebb5595d1",
      "math": {
        "length": 8,
        "size": 2,
        "count": 4,
        "unit": "回形针",
        "positions": [
          0,
          2,
          4,
          6
        ],
        "unitWidth": 96,
        "totalWidth": 384
      },
      "type": "x-m28-units"
    },
    {
      "id": "link-lengthstart-sameunitlength",
      "index": 1,
      "role": "associated",
      "nodeId": null,
      "bridge": {
        "from": "lengthstart",
        "to": "sameunitlength",
        "fromTopicId": "mt_KaF0SQvaiu",
        "topicId": "mt_cqSf213hSa"
      },
      "task": {
        "type": "x-m28-units",
        "prompt": "先试着铺满：留空或重叠都不能算量完。",
        "length": 9,
        "size": 1,
        "unit": "块",
        "object": "木条",
        "questions": []
      },
      "taskHash": "19277fb95431846ea222a1c9fe10c76387b2d42adedf86df23298b29800c19a7",
      "math": {
        "length": 9,
        "size": 1,
        "count": 9,
        "unit": "块",
        "positions": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8
        ],
        "unitWidth": 48,
        "totalWidth": 432
      },
      "type": "x-m28-units"
    },
    {
      "id": "link-sameunitlength-lengthtools",
      "index": 0,
      "role": "associated",
      "nodeId": null,
      "bridge": {
        "from": "sameunitlength",
        "to": "lengthtools",
        "fromTopicId": "mt_cqSf213hSa",
        "topicId": "mt_e4x3l2JeLI"
      },
      "task": {
        "type": "x-m28-units",
        "prompt": "把同样长的小块从头到尾挨着放。",
        "length": 6,
        "size": 1,
        "unit": "块",
        "object": "书",
        "questions": []
      },
      "taskHash": "f904cc1319ef9db443aed2713f6f715f1fee69a138669c218902dcf108097125",
      "math": {
        "length": 6,
        "size": 1,
        "count": 6,
        "unit": "块",
        "positions": [
          0,
          1,
          2,
          3,
          4,
          5
        ],
        "unitWidth": 48,
        "totalWidth": 288
      },
      "type": "x-m28-units"
    },
    {
      "id": "link-sameunitlength-precisionunits",
      "index": 0,
      "role": "associated",
      "nodeId": null,
      "bridge": {
        "from": "sameunitlength",
        "to": "precisionunits",
        "fromTopicId": "mt_cqSf213hSa",
        "topicId": "mt_e7tLi9SCIE"
      },
      "task": {
        "type": "x-m28-units",
        "prompt": "把同样长的小块从头到尾挨着放。",
        "length": 6,
        "size": 1,
        "unit": "块",
        "object": "书",
        "questions": []
      },
      "taskHash": "f904cc1319ef9db443aed2713f6f715f1fee69a138669c218902dcf108097125",
      "math": {
        "length": 6,
        "size": 1,
        "count": 6,
        "unit": "块",
        "positions": [
          0,
          1,
          2,
          3,
          4,
          5
        ],
        "unitWidth": 48,
        "totalWidth": 288
      },
      "type": "x-m28-units"
    }
  ],
  "practice": [
    {
      "id": "lengthstart",
      "index": -1,
      "role": "practice",
      "nodeId": "mt_KaF0SQvaiu",
      "task": {
        "type": "x-m28-units",
        "prompt": "换一段模拟桌边，用小方块量完并写上单位。",
        "length": 6,
        "size": 1,
        "unit": "块",
        "object": "桌边",
        "questions": []
      },
      "taskHash": "40c7cbe449e63c9b593732ea57754e414aa252648a5bb4fbbf0a48f755d397a3",
      "math": {
        "length": 6,
        "size": 1,
        "count": 6,
        "unit": "块",
        "positions": [
          0,
          1,
          2,
          3,
          4,
          5
        ],
        "unitWidth": 48,
        "totalWidth": 288
      },
      "type": "x-m28-units"
    },
    {
      "id": "sameunitlength",
      "index": -1,
      "role": "practice",
      "nodeId": "mt_cqSf213hSa",
      "task": {
        "type": "x-m28-units",
        "prompt": "先试着铺满：留空或重叠都不能算量完。",
        "length": 9,
        "size": 1,
        "unit": "块",
        "object": "木条",
        "questions": []
      },
      "taskHash": "19277fb95431846ea222a1c9fe10c76387b2d42adedf86df23298b29800c19a7",
      "math": {
        "length": 9,
        "size": 1,
        "count": 9,
        "unit": "块",
        "positions": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8
        ],
        "unitWidth": 48,
        "totalWidth": 432
      },
      "type": "x-m28-units"
    },
    {
      "id": "twounits",
      "index": -1,
      "role": "practice",
      "nodeId": "mt_jHv4BgRK8B",
      "task": {
        "type": "x-m28-units",
        "prompt": "再用较长的单位量同一段，比较需要的数量。",
        "length": 10,
        "size": 2,
        "unit": "回形针",
        "object": "物体",
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
        ]
      },
      "taskHash": "4e28e97a7103213b8e4aeaf84e70b62fc211d6e040721693b55b1b2d252a5f1d",
      "math": {
        "length": 10,
        "size": 2,
        "count": 5,
        "unit": "回形针",
        "positions": [
          0,
          2,
          4,
          6,
          8
        ],
        "unitWidth": 96,
        "totalWidth": 480
      },
      "type": "x-m28-units"
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
    "native": 6,
    "sourceNodes": [
      "mt_KaF0SQvaiu",
      "mt_cqSf213hSa",
      "mt_jHv4BgRK8B"
    ],
    "newNodes": [
      "mt_KaF0SQvaiu",
      "mt_cqSf213hSa",
      "mt_jHv4BgRK8B"
    ],
    "associated": 5,
    "practice": 3,
    "sessions": 7,
    "positions": 15,
    "prerequisites": 4,
    "nextPerViewport": 8,
    "contractSourceType": "x-m28-units",
    "excludedTypes": [
      "x-m28-refine",
      "x-m28-ruler",
      "x-m28-compare",
      "x-m28-convert"
    ]
  },
  "boundaries": {
    "historyLimit": 2000,
    "textLimit": 1200,
    "capActionEffect": "whole model unchanged; real controller may write timestamp and support",
    "overlongTextEffect": "write rejected, UI blocked, old raw preserved; reload restores saved state",
    "numericCount": "exact rational current saved pair; retain original near historical success",
    "method": null,
    "originalExamplesNeedHelper": false
  }
};
