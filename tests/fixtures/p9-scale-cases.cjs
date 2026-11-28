// Literal original instruments; identical task bytes still require the native source context.
module.exports={
  "schema": "math-scale-reviewed-cases/1",
  "cases": [
    {
      "role": "native",
      "id": "weightstart",
      "index": 2,
      "nodeId": "mt_zd0YkB3xNj",
      "task": {
        "type": "x-m28-scale",
        "prompt": "指针在400和600正中间，读出它的质量。",
        "kind": "dial",
        "value": 500,
        "unit": "g",
        "min": 0,
        "max": 800,
        "major": 200,
        "questions": []
      },
      "taskHash": "c0adc66e4afcb6f2056e08f7b9daf4002740dda6115619d53b238d3ab119a231",
      "math": {
        "shape": "analog",
        "kind": "dial",
        "raw": "500",
        "expected": "500",
        "lower": "400",
        "upper": "600",
        "between": "1/2",
        "position": "5/8"
      }
    },
    {
      "role": "native",
      "id": "readscales",
      "index": 0,
      "nodeId": "mt_SOM6Imm2sO",
      "task": {
        "type": "x-m28-scale",
        "prompt": "秤上400到600的中间，指针指向哪里？",
        "kind": "dial",
        "value": 500,
        "unit": "g",
        "min": 0,
        "max": 800,
        "major": 200,
        "questions": []
      },
      "taskHash": "b27de94fc17a87f4aeccaee432ae933cf7bf0add2609059f56fdbb258ffbd9fc",
      "math": {
        "shape": "analog",
        "kind": "dial",
        "raw": "500",
        "expected": "500",
        "lower": "400",
        "upper": "600",
        "between": "1/2",
        "position": "5/8"
      }
    },
    {
      "role": "native",
      "id": "readscales",
      "index": 1,
      "nodeId": "mt_SOM6Imm2sO",
      "task": {
        "type": "x-m28-scale",
        "prompt": "量杯的液面在150和200正中间。",
        "kind": "jug",
        "value": 175,
        "unit": "mL",
        "min": 0,
        "max": 250,
        "major": 50,
        "questions": []
      },
      "taskHash": "fef222d995112609c7ba1e7dd588bf43f79fe99d52ef9be2bf382110becf37ca",
      "math": {
        "shape": "analog",
        "kind": "jug",
        "raw": "175",
        "expected": "175",
        "lower": "150",
        "upper": "200",
        "between": "1/2",
        "position": "7/10"
      }
    },
    {
      "role": "native",
      "id": "readscales",
      "index": 2,
      "nodeId": "mt_SOM6Imm2sO",
      "task": {
        "type": "x-m28-scale",
        "prompt": "温度计每两个数字差2度，液面在哪？",
        "kind": "thermo",
        "value": 23,
        "unit": "℃",
        "min": 20,
        "max": 28,
        "major": 2,
        "questions": []
      },
      "taskHash": "7387eac7c190aa85b6680724fd7e553c31c4b57255557212bb4eb3a61846c2bc",
      "math": {
        "shape": "analog",
        "kind": "thermo",
        "raw": "23",
        "expected": "23",
        "lower": "22",
        "upper": "24",
        "between": "1/2",
        "position": "3/8"
      }
    },
    {
      "role": "native",
      "id": "readscales",
      "index": 3,
      "nodeId": "mt_SOM6Imm2sO",
      "task": {
        "type": "x-m28-scale",
        "prompt": "尺上的每厘米又分成10小格，终点在哪里？",
        "kind": "ruler",
        "value": 12.7,
        "unit": "cm",
        "min": 0,
        "max": 15,
        "major": 1,
        "questions": [],
        "minor": 0.1
      },
      "taskHash": "7978199629283fd8762b1146c3d5b4d793a338705c28935b6db7ad76d031e443",
      "math": {
        "shape": "analog",
        "kind": "ruler",
        "raw": "12.7",
        "expected": "127/10",
        "lower": "12",
        "upper": "13",
        "between": "7/10",
        "position": "127/150",
        "minor": "1/10",
        "minorCount": "127"
      }
    },
    {
      "role": "native",
      "id": "readscales",
      "index": 4,
      "nodeId": "mt_SOM6Imm2sO",
      "task": {
        "type": "x-m28-scale",
        "prompt": "秒表显示1分26.4秒。换成多少秒记录？",
        "kind": "digital",
        "value": 86.4,
        "unit": "秒",
        "min": 0,
        "max": 0,
        "major": 0,
        "questions": [],
        "display": "01:26.4"
      },
      "taskHash": "f17d82daab7db45835f9537fb68cce7ec507f14a84b77d6f4d1704a2e55342a5",
      "math": {
        "shape": "digital",
        "kind": "digital",
        "raw": "86.4",
        "expected": "432/5",
        "minutes": "1",
        "seconds": "132/5",
        "minuteSeconds": "60",
        "display": "01:26.4"
      }
    },
    {
      "role": "native",
      "id": "measurecalc",
      "index": 1,
      "nodeId": "mt_6oxQPNLHNv",
      "task": {
        "type": "x-m28-scale",
        "prompt": "尺上每厘米分成 10 小格。先读出厘米，再用毫米说同一段长度。",
        "kind": "ruler",
        "value": 12.7,
        "unit": "cm",
        "min": 0,
        "max": 15,
        "major": 1,
        "questions": [
          {
            "label": "这段相当于多少 mm",
            "value": 127
          }
        ],
        "minor": 0.1
      },
      "taskHash": "892c4fd033c82c1c8adb22de1baa19db58653866e518156a8cd51c719bc5e952",
      "math": {
        "shape": "analog",
        "kind": "ruler",
        "raw": "12.7",
        "expected": "127/10",
        "lower": "12",
        "upper": "13",
        "between": "7/10",
        "position": "127/150",
        "minor": "1/10",
        "minorCount": "127",
        "answer": "127"
      }
    },
    {
      "role": "native",
      "id": "measurecalc",
      "index": 3,
      "nodeId": "mt_6oxQPNLHNv",
      "task": {
        "type": "x-m28-scale",
        "prompt": "模拟秤的指针指在 2 和 3 kg 正中间。读出这袋东西的质量。",
        "kind": "dial",
        "value": 2.5,
        "unit": "kg",
        "min": 0,
        "max": 4,
        "major": 1,
        "questions": []
      },
      "taskHash": "516a751ca33addb52d582333cbffe54d68e44a97aa509a6a5ac67afc96357417",
      "math": {
        "shape": "analog",
        "kind": "dial",
        "raw": "2.5",
        "expected": "5/2",
        "lower": "2",
        "upper": "3",
        "between": "1/2",
        "position": "5/8"
      }
    }
  ],
  "associated": [
    {
      "role": "associated",
      "id": "link-measure-readscales",
      "index": 1,
      "nodeId": "mt_SOM6Imm2sO",
      "task": {
        "type": "x-m28-scale",
        "prompt": "秤上400到600的中间，指针指向哪里？",
        "kind": "dial",
        "value": 500,
        "unit": "g",
        "min": 0,
        "max": 800,
        "major": 200,
        "questions": []
      },
      "taskHash": "b27de94fc17a87f4aeccaee432ae933cf7bf0add2609059f56fdbb258ffbd9fc",
      "math": {
        "shape": "analog",
        "kind": "dial",
        "raw": "500",
        "expected": "500",
        "lower": "400",
        "upper": "600",
        "between": "1/2",
        "position": "5/8"
      },
      "sourceEdge": {
        "topicId": "mt_SOM6Imm2sO",
        "prerequisiteId": "mt_DOe893F6gN",
        "strength": "hard",
        "reason": "Reading partial units requires measuring with standard units"
      }
    },
    {
      "role": "associated",
      "id": "link-measureliquid-readscales",
      "index": 1,
      "nodeId": "mt_SOM6Imm2sO",
      "task": {
        "type": "x-m28-scale",
        "prompt": "秤上400到600的中间，指针指向哪里？",
        "kind": "dial",
        "value": 500,
        "unit": "g",
        "min": 0,
        "max": 800,
        "major": 200,
        "questions": []
      },
      "taskHash": "b27de94fc17a87f4aeccaee432ae933cf7bf0add2609059f56fdbb258ffbd9fc",
      "math": {
        "shape": "analog",
        "kind": "dial",
        "raw": "500",
        "expected": "500",
        "lower": "400",
        "upper": "600",
        "between": "1/2",
        "position": "5/8"
      },
      "sourceEdge": {
        "topicId": "mt_SOM6Imm2sO",
        "prerequisiteId": "mt_-af65bxfdp",
        "strength": "hard",
        "reason": "Interpreting unmarked intervals extends reading scales with labelled markings"
      }
    }
  ],
  "practice": [
    {
      "role": "practice",
      "id": "weightstart",
      "index": -1,
      "nodeId": "mt_zd0YkB3xNj",
      "task": {
        "type": "x-m28-scale",
        "prompt": "指针在400和600正中间，读出它的质量。",
        "kind": "dial",
        "value": 500,
        "unit": "g",
        "min": 0,
        "max": 800,
        "major": 200,
        "questions": []
      },
      "taskHash": "c0adc66e4afcb6f2056e08f7b9daf4002740dda6115619d53b238d3ab119a231",
      "math": {
        "shape": "analog",
        "kind": "dial",
        "raw": "500",
        "expected": "500",
        "lower": "400",
        "upper": "600",
        "between": "1/2",
        "position": "5/8"
      }
    },
    {
      "role": "practice",
      "id": "readscales",
      "index": -1,
      "nodeId": "mt_SOM6Imm2sO",
      "task": {
        "type": "x-m28-scale",
        "prompt": "秒表显示1分26.4秒。换成多少秒记录？",
        "kind": "digital",
        "value": 86.4,
        "unit": "秒",
        "min": 0,
        "max": 0,
        "major": 0,
        "questions": [],
        "display": "01:26.4"
      },
      "taskHash": "f17d82daab7db45835f9537fb68cce7ec507f14a84b77d6f4d1704a2e55342a5",
      "math": {
        "shape": "digital",
        "kind": "digital",
        "raw": "86.4",
        "expected": "432/5",
        "minutes": "1",
        "seconds": "132/5",
        "minuteSeconds": "60",
        "display": "01:26.4"
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
    "dist/data/atlas.json": "b30b16783f518e47fed8dd6e412bb6ee6e323b5250834c0ee1c0bb68dff94caf",
    "dist/learning/phase5/b31-model.js": "af26110a7f50a2e4e3d3399b1d621776203e9c56a199667b11f4f7fe0280dc57",
    "dist/learning/phase5/b31-view.js": "37760557311f03f4d8ca9cbaf86dfd995b2e57ccab594e3942a3908dc2d84604",
    "dist/learning/phase4/b02-model.js": "b0b17bdc7f7fa95c0ad53258f2804cd06404272b1946a4e5830af3b337e55927",
    "dist/learning/phase4/b02-view.js": "97b90a33f243c3d6c84908499f88edb3a2c129d484565cfd1ea032f9871d3c27"
  }
};
